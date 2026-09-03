// Knowledge-base article (Bead securitycorp-source-4zl.6, "The Security
// Risks of Mounting docker.sock"). Published 2026-09-03 under Ravi Teja
// Thota's standing publication authorization after real review of
// citations, safety, and evidenceState honesty, per
// docs/publication-safety-policy.md. All examples describe a fictional team ("Meridian
// Ops") and a fictional monitoring container; no real host, repository,
// credential, employer detail, or unresolved real vulnerability appears
// anywhere in this file.
//
// Overlap check against lib/articles/docker-to-k3s-migration-zero-change.ts:
// that deep-dive discusses docker.sock's all-or-nothing access model as one
// point among five in a broader migration overview (see its mainContent
// item 1). This article does not repeat that overview. It goes deep on
// docker.sock specifically and only: exactly what a connected client can do
// through the Docker Engine API, the concrete mechanism by which a
// read-only bind mount fails to reduce that risk (a claim the migration
// article does not make at all), and three specific architectural
// alternatives (removing the mount, rootless Docker, a scoped API proxy)
// that the migration article never discusses. The scope is genuinely
// distinct, not a restatement.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788446270709-38vzjb, template "research"). A
// bounded workflow_status check showed the same documented issue recorded
// elsewhere in this repo (see CLAUDE.md, "Current Ruflo executor
// limitation"): the workflow stayed at 0% progress with a single pending
// "Execute" stage and returned no retrievable editorial output. This draft
// was therefore produced with the disclosed native fallback instead —
// separate sequential research, drafting, technical-verification,
// publication-safety, and final-editorial passes — not credited to Ruflo.
// Every citation below was verified against its live primary source (NIST,
// OWASP, MITRE ATT&CK, CIS, and Docker's own official documentation) with
// WebFetch before being included; none was invented. See the calling
// agent's final report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const sections: UniversalSections = {
  executiveSummary: [
    "`/var/run/docker.sock` is the Unix domain socket the Docker daemon listens on, and by default the daemon runs as root and applies no per-call authorization of its own to whoever can connect to it. Mounting that socket into a container does not grant a curated subset of Docker functionality — it hands the container a live client connection to the entire Docker Engine API, which is capable of creating and starting new containers, including ones that mount arbitrary host paths and run with expanded kernel privileges. Docker's own documentation and the OWASP Docker Security Cheat Sheet both describe this as equivalent to granting root access to the host, not to the container.",
    "This guide goes deep on that one specific mount rather than surveying container security broadly. It covers exactly what a connected client can do through the socket, why a `:ro` (read-only) mount is widely assumed to reduce that risk and does not meaningfully do so, a concrete illustration of the escape path using a fictional monitoring setup, and three specific, more defensible alternatives — removing the mount entirely, running Docker rootless, and placing a scoped API proxy in front of the socket — with the tradeoffs of each.",
  ],
  whatYouWillLearn: [
    "Exactly what capabilities the Docker Engine API grants once a client can reach docker.sock, and why that access is effectively all-or-nothing rather than scoped to any one task.",
    "Why marking the docker.sock bind mount read-only does not meaningfully reduce the risk, and the specific mechanism — Unix domain socket connect/read/write semantics versus filesystem write permission — that explains why.",
    "The concrete sequence an attacker with socket access can use to reach root-equivalent control of the host, illustrated with a fictional monitoring-container scenario.",
    "Three specific, more defensible alternatives to a direct docker.sock mount — removing it entirely, rootless Docker, and a scoped API proxy — and what each one actually buys you.",
  ],
  intendedAudience: [
    "Developers and DevOps practitioners who mount docker.sock into a CI runner, a monitoring dashboard, or a \"Docker-in-Docker\" orchestration container because it was the fastest way to get a job working.",
    "Security engineers reviewing an environment for docker.sock exposure and needing to tell a genuine mitigation apart from one that only sounds like one.",
    "Self-hosted and homelab operators running container-management dashboards or automation tools that request socket access as part of their default setup.",
  ],
  prerequisites: [
    "Basic familiarity with Docker containers, images, and the distinction between the Docker client (the `docker` command) and the Docker daemon it talks to.",
    "No lab environment is required to follow this guide; it is conceptual and uses a fictional scenario throughout, though the procedure below is meant to be applied to a real environment under review.",
  ],
  problem: [
    "docker.sock gets mounted into a container for reasons that sound narrow and reasonable in isolation: a CI runner needs to build an image, a monitoring dashboard needs to list running containers, a deployment tool needs to restart a sibling service. Once the mount exists, \"this container has some Docker access\" tends to get treated as a single, fixed fact rather than a question with an actual size — what, specifically, can a process inside that container now do, and is there a narrower way to grant only the part of it the job actually uses.",
    "A `:ro` flag on the bind mount is frequently offered, and accepted, as the answer to that second question without anyone checking whether it restricts anything that matters. It is an intuitive fix — read-only sounds like it should prevent a container from doing anything destructive through the socket — and that intuition is wrong in a way that is specific and checkable, not a matter of degree.",
  ],
  threatModel: [
    "Assets: the root-owned Unix socket itself and the full Docker Engine API reachable through it; every other container, image, volume, network, and Docker-managed secret on the host; and, transitively, the host's kernel and filesystem, which the daemon can reach directly on the API's behalf.",
    "Central trust decision: Docker's engine API applies no per-call authorization by default — whoever can open a connection to the socket can issue any request the API supports, exactly as if they were the daemon's own trusted local client, unless a separate authorization mechanism has deliberately been placed in front of it. Docker's own security documentation states plainly that control of the daemon is equivalent to root access to the host, precisely because the daemon can bind-mount arbitrary host directories into containers it creates without restriction.",
    "Representative scenario: a fictional small team, Meridian Ops, runs a container-monitoring dashboard with docker.sock bind-mounted read-only so the dashboard can list and inspect running containers. An adversary compromises the dashboard container through an unrelated flaw in its own web front end — out of scope for this guide — and finds the socket file already present inside the container's filesystem. Despite the read-only mount, the adversary connects to the socket directly with a raw HTTP client and issues a `POST /containers/create` request for a new container that runs with expanded privileges and has the host's root filesystem bind-mounted into it, starts that container, and executes a shell inside it. From there, chrooting into the mounted host filesystem gives the adversary a root shell on the underlying host — a host that was never itself compromised through any privilege the daemon didn't already have.",
    "Out of scope: how the adversary obtained the initial foothold in the dashboard container (a dependency flaw, in this scenario); image and supply-chain provenance for the dashboard container itself; the Kubernetes-specific equivalents of this pattern (a compromised pod reaching the kubelet API or a mounted containerd socket), beyond noting that the same reasoning applies to them; and hardening the Docker daemon's own remote-access configuration (TLS on the remote API, seccomp/AppArmor profiles), which is a related but separate topic from container access to the local socket.",
  ],
  mainContent: [
    "**What connecting to docker.sock actually grants.** The socket is the transport for the Docker Engine API — the same API the `docker` CLI itself uses. A process that can open a connection to it can create, start, stop, inspect, and remove any container the daemon manages; execute a command inside any running container; read the logs, environment variables, and mounted-file contents of any container; pull and push images; and, most consequentially, create a brand-new container with `--privileged` set and with any host path — including `/` — bind-mounted into it. There is no version of \"give this container read-only Docker access\" available through the socket itself: the API's read operations (listing containers, reading logs) and its write operations (creating a privileged container) are reached through the same connection, gated only by whatever authorization exists in front of the daemon, which by default is none.",
    "**Why this is all-or-nothing rather than scoped.** Docker does support an optional authorization-plugin framework that can inspect each API request before the daemon acts on it, but it is not enabled by default, and a container that has been handed the raw socket bypasses it entirely unless the plugin is specifically what's answering on the other end. Absent that deliberate addition, \"has docker.sock access\" and \"can do anything the Docker Engine API supports\" are the same statement. This is a structural property of how the socket is exposed, not a misconfiguration of any one deployment — which is exactly why a partial mitigation like a read-only mount is so tempting: it looks like it should narrow an otherwise binary grant, without actually doing so.",
    "**Why a read-only mount does not meaningfully reduce the risk.** The `:ro` flag on a Docker bind mount governs filesystem-level operations against the mounted path inside the container — creating, deleting, renaming, or overwriting the socket file itself. It does not govern what a process can do once it has opened that socket file and connected to it as a client, because connecting to and communicating over a Unix domain socket is not a filesystem write in the sense the mount flag restricts; it is a separate socket-level read/write exchange over an already-open file descriptor. A process inside the container can still call `connect()` on the read-only-mounted socket file and then send and receive the full duplex Docker Engine API traffic — including a `POST /containers/create` request — because nothing about that exchange touches the mount's write permission on the underlying inode. The OWASP Docker Security Cheat Sheet states this directly: \"mounting the socket read-only is not a solution but only makes it harder to exploit\" — meaningfully weaker than a real access boundary, and specific enough that it should not be recorded as a mitigation without that caveat attached every time it appears in a review.",
    "**The escape path, concretely.** Continuing the Meridian Ops scenario above: once the adversary can issue Docker Engine API calls, the sequence to reach host-root is a small, well-known handful of steps — create a container with `--privileged` (or, more narrowly, with `CAP_SYS_ADMIN` and the ability to mount) and a bind mount of the host's `/` into some path inside the new container; start that container; exec a shell into it; and `chroot` into the mounted host path. From that point, commands run as root against the actual host filesystem, not against any container's isolated view of it. MITRE ATT&CK documents this exact pattern under Escape to Host (T1611), noting specifically that \"an adversary may be able to exploit a compromised container with a mounted container management socket, such as `docker.sock`, to break out of the container\" via a container administration command (T1609) — this is not a novel technique being described here; it is a cataloged, named adversary technique with docker.sock named explicitly as an example vector.",
    "**Removing the mount entirely.** The strongest fix is architectural: does the container's actual job require calling the Docker Engine API at all, or was the socket mounted because it was the easiest way to reach some narrower underlying capability? A CI job that only needs to build an image can often use a daemonless, rootless image-building tool that produces an OCI-compliant image without ever talking to a privileged daemon, rather than shelling out to `docker build` against a mounted socket. A deployment tool that only needs to restart one specific service is frequently better served by a purpose-built control mechanism scoped to that one action than by full Docker API access used for one call out of hundreds it technically permits.",
    "**Rootless Docker, when API access genuinely can't be avoided.** Docker's own documentation describes rootless mode as running \"the Docker daemon and containers inside a user namespace,\" so that \"both the daemon and the container are running without root privileges\" on the host. This changes the consequence of a socket compromise materially: a client that connects to a rootless daemon's socket and creates a fully privileged container is still confined to the user namespace that daemon runs in, rather than landing on genuine host UID 0 the way a socket compromise against a conventional installation does in the scenario above. Docker's documentation also states the real limitations plainly — the host still needs `newuidmap`/`newgidmap` (setuid binaries) and a configured `uidmap` package with sufficient subordinate UID/GID ranges, and the rootless daemon has some feature and performance differences from a conventional installation — so this is a genuine reduction in blast radius, not a reduction to zero, and it still deserves the same access discipline as any privileged socket.",
    "**A scoped API proxy, when full daemon access is not needed but socket-style access is.** For a case like the Meridian Ops dashboard — read access to container listings and metadata, nothing more — the defensible pattern is a small proxy process that terminates the actual connection to the real docker.sock and enforces an explicit allow-list of specific API paths and methods: permit `GET /containers/json` and `GET /containers/{id}/json`, and reject every `POST`, `DELETE`, and any request whose body carries `Privileged: true` or a host-path bind mount. The container being reviewed then mounts the proxy's own socket, never the daemon's — so even a full compromise of that container yields, at most, whatever the proxy's allow-list permits, not the full API. This is a general architectural pattern rather than a specific product; whatever implements it should be reviewed with the same scrutiny as the daemon socket itself, since a proxy with a permissive or buggy allow-list provides the same false sense of scoping that a read-only mount does.",
  ],
  validationEvidence: [
    "This guide is conceptual. It was not developed against a live or lab-reproduced Docker installation, and the Meridian Ops scenario is a fictional illustrative example, not a documented test or incident. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the technical claims above are grounded in the cited Docker, OWASP, MITRE ATT&CK, NIST, and CIS sources, not in an exercise performed for this article, and the label must not be upgraded merely because the reasoning here is internally consistent.",
  ],
  limitations: [
    "This guide covers docker.sock specifically, on a conventional single-host Docker or Docker Compose deployment. It does not cover the Kubernetes-specific equivalents of this same pattern (the kubelet API, a mounted containerd or CRI-O socket) beyond the brief note in the threat model — those deserve their own review against each platform's actual defaults.",
    "It does not cover container image provenance, supply-chain risk, or how the initial foothold inside a container is obtained — see other container-and-Kubernetes-security and CI/CD-supply-chain-security content in this catalog for those.",
    "It does not walk through the CIS Docker Benchmark control by control; it cites the benchmark as an authoritative baseline to check a Docker installation against, not as content reproduced here.",
    "It does not fully repeat lib/articles/docker-to-k3s-migration-zero-change.ts's broader five-point migration overview, which covers docker.sock only as one of several platform defaults that change during a Docker-to-Kubernetes migration; that article is the right starting point for migration planning specifically.",
  ],
  defensiveRecommendations: [
    "Inventory every container that currently has docker.sock (or an equivalent container-management socket) bind-mounted into it, regardless of whether the mount is read-only or read-write — read-only entries are findings, not evidence the risk was already addressed.",
    "For each one, determine precisely why it has access — building images, orchestrating sibling containers, or read-only introspection for monitoring — and treat \"nobody's sure\" as itself a finding.",
    "Remove the mount entirely wherever the underlying job can be done without a live Docker Engine API connection, such as a daemonless, rootless image build instead of `docker build` against a mounted socket.",
    "Move any workload that genuinely needs to orchestrate sibling containers onto a rootless Docker installation, so a socket compromise is confined to a user namespace rather than landing on real host root.",
    "Where full API access truly can't be avoided, place a scoped proxy in front of the real socket that allow-lists specific paths and methods, and mount only the proxy's socket into the container — never the daemon's own.",
    "Never record a read-only docker.sock mount as a completed mitigation in a review; per OWASP's own guidance it only makes exploitation somewhat harder, not meaningfully less possible.",
  ],
  keyTakeaways: [
    "Connecting to docker.sock grants the full Docker Engine API, including the ability to create a privileged container with an arbitrary host path bind-mounted into it — Docker's own documentation and OWASP both describe this as equivalent to root access to the host.",
    "The API applies no per-call authorization by default, so access is effectively all-or-nothing unless a separate authorization plugin or proxy is deliberately placed in front of the socket.",
    "A read-only bind mount restricts filesystem operations against the socket file itself; it does not restrict the read/write API traffic a client sends once it has connected to that socket, which is why OWASP states plainly that a read-only mount \"is not a solution but only makes it harder to exploit.\"",
    "MITRE ATT&CK catalogs the resulting host-escape path explicitly under Escape to Host (T1611), naming docker.sock as an example vector for breaking out of a compromised container via a container administration command (T1609).",
    "Removing the mount entirely, running Docker rootless, and placing a scoped API proxy in front of the socket are three genuinely different mitigations with different tradeoffs — none of them is a drop-in replacement for the other two, and none is as simple as adding `:ro`.",
  ],
  references: [
    "OWASP Docker Security Cheat Sheet (Rule #1, socket exposure and the read-only-mount limitation; Rule #11, rootless Docker): https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html",
    "Docker documentation — Docker daemon attack surface (daemon access as root-equivalent, host-directory sharing without restriction): https://docs.docker.com/engine/security/",
    "Docker documentation — Rootless mode (daemon and containers running inside a user namespace without root privileges, and its stated limitations): https://docs.docker.com/engine/security/rootless/",
    "MITRE ATT&CK, T1611 — Escape to Host (docker.sock named explicitly as an example container-management-socket escape vector): https://attack.mitre.org/techniques/T1611/",
    "MITRE ATT&CK, T1609 — Container Administration Command: https://attack.mitre.org/techniques/T1609/",
    "NIST SP 800-190, Application Container Security Guide: https://csrc.nist.gov/pubs/sp/800/190/final",
    "CIS Docker Benchmark: https://www.cisecurity.org/benchmark/docker",
  ],
  relatedSlugs: ["docker-to-k3s-migration-zero-change", "least-privilege-for-pipeline-identities", "understanding-network-trust-boundaries"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "Visibility into every place docker.sock (or an equivalent container-management socket) is currently mounted into a container — CI runners, monitoring or dashboard containers, log shippers, deployment tooling, and any \"Docker-in-Docker\" pattern.",
    "Authority to change how those containers are built or deployed, since removing or replacing socket access is an architecture decision, not a runtime flag to flip.",
    "A non-production environment or a safe rollout path to test each replacement before removing the last container's direct socket access in a way that can't be reverted quickly.",
    "Basic familiarity with the Docker Engine API and Unix domain socket permission semantics; the specific mechanics are explained in the guide's mainContent, not assumed here.",
  ],
  procedure: [
    "Inventory every container that currently has docker.sock (or a platform equivalent, such as containerd's socket or the Podman API socket) bind-mounted into it, regardless of whether the mount is read-only or read-write.",
    "For each one, determine why it has access — building images, orchestrating sibling containers, or read-only introspection for monitoring — and record \"we're not sure\" as a finding in its own right, not a footnote to skip past.",
    "Flag any container relying on a read-only mount as its stated mitigation, and treat that reliance as an open finding rather than a resolved one: the mount's `:ro` flag restricts filesystem operations against the socket file, not the read/write API traffic a connected client can still send over it.",
    "For every container whose job could work without ever calling the Docker Engine API directly, remove the mount entirely and replace the underlying workflow — for example, a CI job that only needs to build images can use a daemonless, rootless builder instead of shelling out to `docker build` against a mounted socket.",
    "For every container that genuinely needs to orchestrate sibling containers, move that workload onto a rootless Docker installation, so a full socket compromise is confined to a user namespace rather than landing on actual host root.",
    "For any remaining case where full Docker API access truly can't be avoided or made rootless, place a scoped proxy in front of the real socket that terminates the connection and enforces an allow-list of specific API paths and methods, and mount only the proxy's socket into the container — never the daemon's own.",
  ],
  validation: [
    "Confirm, in a non-production copy of each replaced container, that its actual job (build, deploy, orchestration, monitoring) still completes successfully without the removed or restricted socket access.",
    "Where a scoped proxy replaced direct socket access, attempt a request the proxy is supposed to reject (for example, a privileged-container create call) from inside the container and confirm it is actually rejected — not merely absent from the container's own script.",
    "Where rootless Docker replaced a conventional installation, confirm from the host that the daemon and its child containers are running under an unprivileged UID, not UID 0.",
    "Record any check that could not be performed directly — no safe way to force a denial, no non-production environment available — as UNVERIFIED rather than assuming the new configuration behaves as intended because it was configured that way.",
  ],
  rollback: [
    "If removing socket access breaks a legitimate step the inventory missed, do not restore the original direct socket mount as the fix — add the specific proxy rule, rootless capability, or daemonless-builder feature that step actually needs, and record why, so the addition is a deliberate, documented decision rather than a silent return to unrestricted access.",
    "Stage the change per container rather than across an entire environment at once: replace access on the lowest-consequence container first, run it through a full normal usage cycle, and only then apply the same change to a container whose failure would be costly.",
    "Keep the previous and the replaced configuration both on record, so a later reviewer can tell \"this was replaced deliberately, on this date, for this reason\" apart from \"this container never had direct socket access\" — that distinction matters when someone later needs to understand why a proxy rule or rootless capability was added.",
  ],
};

const diagram: FlowDiagramSpec = {
  titleId: "docker-sock-mount-escape-diagram",
  title: "What a docker.sock mount actually grants, read-only or not",
  desc: "A fictional monitoring container either has no access to docker.sock, or has it bind-mounted read-only. Interactive: toggle between the normal mode, where the container has no path to the Docker daemon and the host stays isolated, and a failure mode showing what a compromised container with docker.sock mounted read-only can still do — connect to the daemon, create a privileged sibling container with the host filesystem bind-mounted into it, and reach root-equivalent access to the host. Explore each node for details.",
  viewBox: "0 0 1000 320",
  failureLabel: "docker.sock mounted (read-only) and container compromised",
  caption:
    "In the normal mode, the container never reaches the Docker daemon at all, so the host stays isolated — no bind mount means no path exists. In the failure mode, the same container has docker.sock mounted read-only, which is commonly treated as a mitigation; it is not one. The read-only flag restricts filesystem writes to the socket file, not the read/write Docker Engine API traffic a connected client sends over it, so a compromised container can still create a privileged sibling container with the host's root filesystem bind-mounted in and reach root-equivalent control of the host.",
  motionDuration: 2600,
  mainPacketRoute: { d: "M180,140 C215,110 235,90 260,70 M480,70 H560", length: 170 },
  edges: [
    { id: "container-noSocket", from: "container", to: "noSocket", d: "M180,140 C215,110 235,90 260,70", length: 90, kind: "main", activeIn: ["normal"] },
    { id: "noSocket-hostIsolated", from: "noSocket", to: "hostIsolated", d: "M480,70 H560", length: 80, kind: "main", activeIn: ["normal"] },
    { id: "container-daemonAccess", from: "container", to: "daemonAccess", d: "M180,170 C215,200 235,220 260,240", length: 90, kind: "main", activeIn: ["failure"] },
    { id: "daemonAccess-hostRoot", from: "daemonAccess", to: "hostRoot", d: "M480,240 H560", length: 80, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "container",
      label: "Monitoring container (compromised via an unrelated web-UI flaw)",
      x: 10,
      y: 105,
      w: 170,
      h: 90,
      activeIn: ["normal", "failure"],
      description:
        "The same fictional monitoring container in both views. What differs between the normal and failure modes is not this container's own compromise state alone — it is whether docker.sock was ever mounted into it, and, once compromised, whether that mount's read-only flag actually stopped anything.",
    },
    {
      id: "noSocket",
      label: "No docker.sock mount present",
      x: 260,
      y: 25,
      w: 220,
      h: 90,
      activeIn: ["normal"],
      role: "boundary",
      focusableLabel: "No docker.sock mount present — the container has no client connection to the Docker Engine API at all",
      description:
        "Without the mount, there is no client connection to the Docker Engine API for a compromised process to use, regardless of what else the compromise achieves inside the container. This is the only mode in this diagram where the host is genuinely unreachable through Docker.",
    },
    {
      id: "hostIsolated",
      label: "Host stays isolated — no path exists",
      x: 560,
      y: 25,
      w: 260,
      h: 90,
      activeIn: ["normal"],
      role: "safe",
      description:
        "Nothing about compromising the container's own web UI grants any further reach here, because no route to the daemon exists in the first place. This is the state every one of the alternatives in this guide (removing the mount, rootless Docker, a scoped proxy) is trying to approximate as closely as the container's actual job allows.",
    },
    {
      id: "daemonAccess",
      label: "docker.sock mounted read-only, connected to Docker Engine API",
      x: 260,
      y: 195,
      w: 220,
      h: 90,
      activeIn: ["failure"],
      role: "boundary",
      focusableLabel: "docker.sock mounted read-only — the read-only flag restricts filesystem writes to the socket file, not API traffic sent over an established connection",
      description:
        "The read-only mount is real, but it restricts filesystem operations against the socket file's inode (create, delete, rename) — not the read/write duplex traffic a client sends once it has opened the file and connected. A compromised process can still issue a full Docker Engine API request, including one that creates a new privileged container.",
    },
    {
      id: "hostRoot",
      label: "Privileged sibling container, host / bind-mounted → root on host",
      x: 560,
      y: 195,
      w: 260,
      h: 90,
      activeIn: ["failure"],
      role: "blocked",
      focusableLabel: "Privileged sibling container with the host filesystem bind-mounted in — chrooting into it yields a root shell on the actual host",
      description:
        "The concrete escape path MITRE ATT&CK catalogs under Escape to Host (T1611): create a privileged container with the host's root filesystem bind-mounted into it, exec a shell inside that new container, and chroot into the mounted host path. Commands from there run as root against the real host filesystem — a result the read-only flag on the original mount never restricted.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "The Security Risks of Mounting docker.sock",
    slug: "docker-sock-mounting-security-risks",
    summary:
      "Mounting docker.sock into a container does not grant a scoped slice of Docker functionality — it hands the container a live client connection to the full Docker Engine API, which Docker's own documentation and OWASP both describe as equivalent to root access on the host. A deep look at exactly what that access grants, why marking the mount read-only does not meaningfully reduce the risk, and three concrete, more defensible alternatives: removing the mount entirely, rootless Docker, and a scoped API proxy.",
    pillar: "build-securely",
    primaryCategory: "container-kubernetes-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["docker", "access-control", "least-privilege"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
    publishedAt: "2026-09-03",
    updatedAt: "2026-09-03",
    lastReviewedAt: "2026-09-03",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
  },
  sections,
  module: module_,
  diagram,
};
