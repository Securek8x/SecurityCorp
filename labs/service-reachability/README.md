# Service-reachability lab harness

Internal tooling for the VALIDATED evidence pilot (Beads
`securitycorp-source-akn`, `akn.2`). Not public site content.

It reproduces the lab-testable claims of the knowledge article
`validating-a-service-is-not-publicly-reachable` in an isolated local Docker
lab and produces `results.json`, the raw material for a validation receipt
(`lib/validation-receipts.ts`). A run is evidence only; it never changes an
article's `evidenceState`, and a receipt built from it needs a named human
reviewer before it can back VALIDATED.

## What it covers

| Scenario | Kind | Article checklist item | Must observe |
|---|---|---|---|
| B1 binding, internal-only | baseline | 2 (interface binding) | unreachable |
| B2 internal service, direct | baseline | 6 (external check) | unreachable |
| F1 binding, all interfaces | planted fault | 2 | exposed (detected) |
| F2 reverse proxy | planted fault | 3 (load balancer / proxy scope) | exposed (detected) |
| F3 leftover port-forward | planted fault | 5 (NAT / port-forward) | exposed (detected) |
| C1 open control | probe control | 6, 7 (check and reconcile) | reachable |

Not lab-testable here, so not covered: item 1 (intent is documented),
item 4 (cloud security-group scope), item 8 (revalidation trigger).

## Isolation

- Both Docker networks are `--internal`: no route to the host uplink or
  the internet.
- Probe targets are asserted to be lab addresses (`172.30.250.0/24`,
  `172.30.251.0/24`) before use; nothing else is contacted.
- Images are pinned by digest in `images.lock`.
- Every container and network carries a per-run label and is removed on
  exit.

## Run

```sh
labs/service-reachability/run.sh --out /tmp/sclab-run
```

Requires the Docker engine (the compose plugin is not needed). Exit status
is 0 only when every scenario matched its expected result.

## Self-tests: the harness must be able to fail

Each of these must end in `HARNESS RESULT: FAIL`:

```sh
SC_LAB_BREAK=probe         labs/service-reachability/run.sh   # probe wrong ports
SC_LAB_BREAK=fault-binding labs/service-reachability/run.sh   # F1 fault removed
SC_LAB_BREAK=fault-proxy   labs/service-reachability/run.sh   # F2 fault removed
```

Editing any harness file (including `images.lock`) changes its sha256 and
marks receipts bound to the old version stale.
