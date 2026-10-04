#!/usr/bin/env bash
# Service-reachability lab harness (Bead securitycorp-source-akn.2).
#
# Reproduces the testable claims of the knowledge article
# "validating-a-service-is-not-publicly-reachable" in an isolated local
# Docker lab, and proves the check can fail:
#
#   B1 baseline  dual-homed host, service bound to its internal address
#                -> must be UNREACHABLE from the outside vantage
#   B2 baseline  internal-only service probed at its internal address
#                -> must be UNREACHABLE from the outside vantage
#   F1 fault     dual-homed host, service bound to every interface
#                -> must be DETECTED as exposed
#   F2 fault     reverse proxy on the outside network forwarding to the
#                internal-only service -> must be DETECTED as exposed
#   F3 fault     leftover TCP port-forward to the internal-only service
#                -> must be DETECTED as exposed
#   C1 control   known-open service on the outside network
#                -> must be REACHABLE (a broken probe cannot pass as
#                   "not reachable")
#
# Isolation: both networks are created with --internal (no route to the
# host's uplink or the internet), every probe target is asserted to be a
# lab address before use, and nothing outside the two lab subnets is ever
# contacted. All containers and networks carry a per-run label and are
# removed on exit.
#
# Usage:  labs/service-reachability/run.sh [--out DIR]
# Self-tests (each MUST make the run fail):
#   SC_LAB_BREAK=probe          probe the wrong ports
#   SC_LAB_BREAK=fault-binding  remove fault F1 (bind it correctly)
#   SC_LAB_BREAK=fault-proxy    remove fault F2 (proxy not on outside net)
# Exit status: 0 only when every scenario matched its expected result.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"
# shellcheck source=images.lock
source "$HERE/images.lock"

OUT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
BREAK="${SC_LAB_BREAK:-}"
case "$BREAK" in ""|probe|fault-binding|fault-proxy) ;; *) echo "unknown SC_LAB_BREAK: $BREAK" >&2; exit 2 ;; esac

RUN_ID="sclab-$(date -u +%Y%m%d%H%M%S)-$$"
OUT="${OUT:-$PWD/$RUN_ID}"
mkdir -p "$OUT/raw"

INTERNAL_NET="$RUN_ID-internal"
OUTSIDE_NET="$RUN_ID-outside"
INTERNAL_SUBNET="172.30.250.0/24"
OUTSIDE_SUBNET="172.30.251.0/24"
LABEL="securitycorp.lab=$RUN_ID"

SERVICE_MARKER="sc-lab-service-marker"
CONTROL_MARKER="sc-lab-control-marker"

cleanup() {
  local ids
  mapfile -t ids < <(docker ps -aq --filter "label=$LABEL")
  if [[ ${#ids[@]} -gt 0 ]]; then docker rm -f "${ids[@]}" >/dev/null 2>&1 || true; fi
  docker network rm "$INTERNAL_NET" "$OUTSIDE_NET" >/dev/null 2>&1 || true
}
trap cleanup EXIT

assert_lab_ip() {
  [[ "$1" =~ ^172\.30\.25[01]\.[0-9]{1,3}$ ]] || { echo "refusing to probe non-lab address: $1" >&2; exit 3; }
}

for img in "$SERVICE_IMAGE" "$PROXY_IMAGE" "$FORWARDER_IMAGE"; do
  [[ "$img" == *@sha256:* ]] || { echo "image not pinned by digest: $img" >&2; exit 2; }
  docker pull -q "$img" >/dev/null
done

docker network create --internal --subnet "$INTERNAL_SUBNET" --label "$LABEL" "$INTERNAL_NET" >/dev/null
docker network create --internal --subnet "$OUTSIDE_SUBNET" --label "$LABEL" "$OUTSIDE_NET" >/dev/null

# serve NAME NET IP BIND MARKER: a busybox httpd serving MARKER, bound to BIND.
serve() {
  local name="$1" net="$2" ip="$3" bind="$4" marker="$5"
  docker run -d --name "$RUN_ID-$name" --label "$LABEL" --network "$net" --ip "$ip" "$SERVICE_IMAGE" \
    sh -c "mkdir -p /www && echo $marker > /www/index.html && exec httpd -f -p $bind -h /www" >/dev/null
}
dual_home() { docker network connect --ip "$2" "$OUTSIDE_NET" "$RUN_ID-$1"; }

# The protected internal-only service (target of F2/F3, probed directly in B2).
serve svc "$INTERNAL_NET" 172.30.250.10 0.0.0.0:8080 "$SERVICE_MARKER"

# B1: dual-homed host, service correctly bound to its internal address only.
serve host-baseline "$INTERNAL_NET" 172.30.250.21 172.30.250.21:8080 "$SERVICE_MARKER"
dual_home host-baseline 172.30.251.21

# F1: dual-homed host, service bound to every interface (the fault).
F1_BIND="0.0.0.0:8080"
[[ "$BREAK" == "fault-binding" ]] && F1_BIND="172.30.250.22:8080"
serve host-fault "$INTERNAL_NET" 172.30.250.22 "$F1_BIND" "$SERVICE_MARKER"
dual_home host-fault 172.30.251.22

# F2: reverse proxy forwarding the outside network to the internal service.
docker run -d --name "$RUN_ID-proxy" --label "$LABEL" --network "$INTERNAL_NET" --ip 172.30.250.30 \
  -v "$HERE/nginx.conf:/etc/nginx/nginx.conf:ro" "$PROXY_IMAGE" >/dev/null
[[ "$BREAK" == "fault-proxy" ]] || dual_home proxy 172.30.251.30

# F3: leftover TCP port-forward to the internal service.
docker run -d --name "$RUN_ID-forwarder" --label "$LABEL" --network "$INTERNAL_NET" --ip 172.30.250.40 "$FORWARDER_IMAGE" \
  TCP-LISTEN:9090,fork,reuseaddr TCP:172.30.250.10:8080 >/dev/null
dual_home forwarder 172.30.251.40

# C1: known-open control on the outside network.
serve control "$OUTSIDE_NET" 172.30.251.50 0.0.0.0:8080 "$CONTROL_MARKER"

# The outside vantage point: attached to the outside network ONLY.
docker run -d --name "$RUN_ID-probe" --label "$LABEL" --network "$OUTSIDE_NET" --ip 172.30.251.100 "$SERVICE_IMAGE" sleep 600 >/dev/null

# Wait until each listener answers from its own side (so "unreachable" can't
# mean "not started yet").
ready() {
  local container="$1" url="$2" _
  for _ in $(seq 1 30); do
    docker exec "$RUN_ID-$container" wget -qO- -T 1 "$url" >/dev/null 2>&1 && return 0
    sleep 0.5
  done
  echo "listener in $container never became ready at $url" >&2; exit 4
}
ready svc http://127.0.0.1:8080/
ready host-baseline http://172.30.250.21:8080/
ready host-fault "http://${F1_BIND/0.0.0.0/127.0.0.1}/"
ready proxy http://127.0.0.1:80/
ready forwarder http://127.0.0.1:9090/
ready control http://127.0.0.1:8080/

# probe IP PORT -> prints "reachable:<marker>" or "unreachable:exit-<code>"
probe() {
  local ip="$1" port="$2" body rc
  assert_lab_ip "$ip"
  [[ "$BREAK" == "probe" ]] && port=$((port + 1))
  set +e
  body="$(docker exec "$RUN_ID-probe" wget -qO- -T 3 "http://$ip:$port/" 2>&1)"
  rc=$?
  set -e
  # Keep the observation JSON-safe: strip quotes, backslashes, and newlines.
  # shellcheck disable=SC1003 # the '\\' is a literal backslash for tr, not an escaped quote
  body="$(echo "$body" | tr -d '\r\n"\\' | cut -c1-120)"
  if [[ $rc -eq 0 ]]; then echo "reachable:$body"; else echo "unreachable:exit-$rc:$body"; fi
}

RESULTS=()
FAILED=0
# scenario ID KIND IP PORT EXPECTED  (EXPECTED: unreachable | reachable:<marker>)
scenario() {
  local id="$1" kind="$2" ip="$3" port="$4" expected="$5" observed outcome raw
  observed="$(probe "$ip" "$port")"
  raw="$OUT/raw/$id.txt"
  printf 'scenario=%s\nkind=%s\ntarget=%s:%s\nexpected=%s\nobserved=%s\n' "$id" "$kind" "$ip" "$port" "$expected" "$observed" > "$raw"
  if [[ "$expected" == "unreachable" && "$observed" == unreachable:* ]] || [[ "$observed" == "$expected" ]]; then
    outcome="as-intended"
  else
    outcome="failed"; FAILED=1
  fi
  RESULTS+=("$(printf '{"id":"%s","kind":"%s","target":"%s:%s","expected":"%s","observed":"%s","outcome":"%s","rawOutputSha256":"%s"}' \
    "$id" "$kind" "$ip" "$port" "$expected" "$observed" "$outcome" "$(sha256sum "$raw" | cut -d' ' -f1)")")
  echo "$id ($kind): expected $expected, observed $observed -> $outcome"
}

scenario B1-binding-internal-only baseline 172.30.251.21 8080 unreachable
scenario B2-internal-service-direct baseline 172.30.250.10 8080 unreachable
scenario F1-binding-all-interfaces planted-fault 172.30.251.22 8080 "reachable:$SERVICE_MARKER"
scenario F2-reverse-proxy planted-fault 172.30.251.30 80 "reachable:$SERVICE_MARKER"
scenario F3-leftover-port-forward planted-fault 172.30.251.40 9090 "reachable:$SERVICE_MARKER"
scenario C1-probe-control probe-control 172.30.251.50 8080 "reachable:$CONTROL_MARKER"

hash_file() { sha256sum "$1" | cut -d' ' -f1; }
HARNESS_FILES=""
for f in run.sh images.lock nginx.conf README.md; do
  HARNESS_FILES+="$(printf '{"path":"labs/service-reachability/%s","sha256":"%s"},' "$f" "$(hash_file "$HERE/$f")")"
done
GIT_COMMIT="$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
GIT_DIRTY="$(git -C "$REPO_ROOT" status --porcelain -- labs/service-reachability 2>/dev/null | wc -l | tr -d ' ')"

{
  printf '{\n'
  printf '  "runId": "%s",\n' "$RUN_ID"
  printf '  "executedAt": "%s",\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '  "selfTestBreak": "%s",\n' "$BREAK"
  printf '  "harness": {"path": "labs/service-reachability", "gitCommit": "%s", "uncommittedHarnessChanges": %s, "files": [%s]},\n' "$GIT_COMMIT" "$GIT_DIRTY" "${HARNESS_FILES%,}"
  printf '  "environment": {"dockerEngine": "%s", "images": ["%s", "%s", "%s"], "probeTool": "busybox wget (SERVICE_IMAGE)", "hostOsFamily": "%s"},\n' \
    "$(docker version --format '{{.Server.Version}}')" "$SERVICE_IMAGE" "$PROXY_IMAGE" "$FORWARDER_IMAGE" "$(uname -s | tr '[:upper:]' '[:lower:]')"
  printf '  "scenarios": [\n    %s\n  ],\n' "$(IFS=$'\n'; echo "${RESULTS[*]}" | paste -sd ',' | sed 's/},{/},\n    {/g')"
  printf '  "passed": %s\n' "$([[ $FAILED -eq 0 ]] && echo true || echo false)"
  printf '}\n'
} > "$OUT/results.json"

echo "results: $OUT/results.json"
if [[ $FAILED -ne 0 ]]; then echo "HARNESS RESULT: FAIL (a scenario did not match its expected result)"; exit 1; fi
echo "HARNESS RESULT: PASS"
