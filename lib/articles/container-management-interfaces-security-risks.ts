// Knowledge-base article draft (Bead securitycorp-source-4zl.54.3.2,
// "Security Risks of Container Management Interfaces", category
// securitycorp-source-4zl.54.3 "Container and Kubernetes Security"). Status
// is intentionally "drafting" and every review record is intentionally
// "pending" — see docs/publication-safety-policy.md. This agent is not
// authorized to set status to "published" or to mark any review "approved";
// those remain human decisions. All examples describe a fictional company
// ("Vantage Grid Systems"), a fictional cluster, and fictional node/subnet
// names; no real cluster, namespace, credential, hostname, or infrastructure
// detail appears anywhere in this file.
//
// Judgment calls (for the reviewer):
// - primaryCategory "container-kubernetes-security" is lib/taxonomy.ts's
//   existing category id for "Container and Kubernetes Security"
//   (securitycorp-source-4zl.54.3) — not invented.
// - Controlled tags: the bead's suggested "access-control" is a canonical id
//   in lib/knowledge-tags.ts and is used as-is. The bead's other two
//   suggestions are not canonical ids: "container-security" has no matching
//   entry (the vocabulary uses per-technology ids instead), so this article
//   uses both "kubernetes" and "docker" — the two technologies whose
//   management interfaces this guide actually covers — rather than one
//   invented umbrella tag. "management-interfaces" is likewise not a
//   canonical id or alias; "least-privilege" is used instead as the closest
//   real match, since the guide's actual defensive recommendation for every
//   interface covered is narrowing who/what can reach it and what it can do
//   once reached, which is exactly what that tag denotes.
// - Overlap check against lib/articles/docker-sock-mounting-security-risks.ts:
//   that guide is a deep dive on docker.sock specifically — what the Docker
//   Engine API grants once a client can reach the socket, why a read-only
//   bind mount doesn't help, and three mitigations for that one interface.
//   Its own "Limitations" section explicitly states it does not cover "the
//   Kubernetes-specific equivalents of this same pattern (the kubelet API, a
//   mounted containerd or CRI-O socket)... those deserve their own review
//   against each platform's actual defaults." This article is that review:
//   it treats "container management interface" as a broader category (the
//   kubelet API, the containerd/CRI-O socket, and the Docker Engine API when
//   exposed remotely over TCP rather than mounted locally as a socket), goes
//   deep on the kubelet API specifically (not covered elsewhere in this
//   catalog), and cross-references the docker.sock article for the
//   already-covered local-socket case rather than repeating it.
// - Overlap check against lib/articles/kubernetes-rbac-design-principles.ts:
//   that guide covers Kubernetes RBAC's own object model — how an
//   already-authenticated subject's permissions are scoped once inside the
//   Kubernetes API server's authorization layer. This article is upstream of
//   that: whether a caller reaches a node-level or runtime-level management
//   interface at all, and whether that interface authenticates and
//   authorizes the caller before acting, not what a properly authenticated
//   Kubernetes API-server subject may then do. The two are complementary,
//   not overlapping, and each is cross-referenced from the other's
//   "Limitations" section framing.
// - contentType "guide" (bead-specified) maps to GuideModule
//   (lib/knowledge-content-types.ts), matching the pattern already used by
//   lib/articles/kubernetes-rbac-design-principles.ts and
//   lib/articles/docker-sock-mounting-security-risks.ts, the two closest
//   sibling articles in this category.
// - No coverImage is added — that workflow is separate and out of scope for
//   this task (see docs/article-visual-guidelines.md and CLAUDE.md; the
//   visual gate stays disabled and an agent may never set stage/reviewStatus
//   for a visual).
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (template "research", workflow id workflow-1789252141396-f86cbv, task
// describing this article's exact research needs — kubelet API exposure,
// Docker Engine API remote-TCP exposure, and containerd/CRI-O socket risk,
// scoped to NIST/CIS/MITRE/vendor-doc grounding). A bounded
// mcp__ruflo__workflow_status check afterward reproduced the documented
// issue in CLAUDE.md: 0% progress, a single pending "Execute" stage, no
// retrievable editorial output. This draft was therefore produced with the
// disclosed native fallback instead — separate research, drafting,
// technical-verification, publication-safety, and final-editorial passes —
// not credited to Ruflo. Every citation below was independently verified via
// WebFetch/WebSearch against its primary source before inclusion:
// - Kubelet anonymous-auth default (true) and its system:anonymous /
//   system:unauthenticated treatment: fetched directly from
//   kubernetes.io/docs/reference/access-authn-authz/kubelet-authn-authz/.
// - Kubelet --authorization-mode default (AlwaysAllow) and the
//   --anonymous-auth deprecation-to-config-file notice: fetched directly
//   from kubernetes.io/docs/reference/command-line-tools-reference/kubelet/.
// - The kubelet read-only port's exact behavior ("no authentication/
//   authorization") and current default (0, disabled): the doc-generated
//   kubernetes.io/docs/reference/config-api/kubelet-config.v1beta1/ page
//   fetched as truncated content with WebFetch (the same class of fetch
//   limitation already documented elsewhere in this catalog, e.g. the
//   media.defense.gov 403 workaround in kubernetes-rbac-design-principles.ts)
//   — verified instead directly against the upstream source comment in
//   kubernetes/kubernetes's staging/src/k8s.io/kubelet/config/v1beta1/types.go
//   (the same text the doc-generated page is built from), fetched via
//   WebFetch. Cited below via the doc-generated kubernetes.io URL, which is
//   the canonical reference readers should consult and matches this
//   article's own verified content.
// - Docker daemon TLS/remote-API guidance and the "guard these keys as you
//   would a root password" statement: fetched directly from
//   docs.docker.com/engine/security/protect-access/.
// - Docker's current refusal to start with the API exposed over HTTP
//   without TLS: fetched directly from docs.docker.com/engine/security/.
// - containerd socket default permissions (0660), the "socket access is
//   equivalent to root and bypasses sudo auditing" statement, and the
//   guidance to never mount the socket into an unprivileged container:
//   fetched directly from
//   containerd.io/docs/main/security/operator_guidelines/.
// - MITRE ATT&CK T1609 (Container Administration Command, naming the Docker
//   daemon, Kubernetes API server, and kubelet as remote command-execution
//   vectors), T1610 (Deploy Container, naming Docker's create/start APIs and
//   Kubernetes dashboards as deployment vectors), and T1611 (Escape to Host,
//   naming a mounted container-management socket such as docker.sock as an
//   escape vector): each fetched directly from its attack.mitre.org page.
// - NIST SP 800-190 and the CIS Kubernetes/Docker Benchmarks are cited as
//   the authoritative baselines this guide's recommendations align with,
//   the same citation pattern already used elsewhere in this catalog (e.g.
//   lib/articles/kubernetes-rbac-design-principles.ts,
//   lib/articles/docker-sock-mounting-security-risks.ts) — not walked
//   through control-by-control here. NIST's own PDF returned non-extractable
//   binary content to WebFetch (a known limitation, not a claim of content);
//   its metadata page confirms the publication and scope directly.
// - The NSA/CISA Kubernetes Hardening Guidance is cited via CISA's own
//   announcement/landing page, matching the same bot-blocked-PDF workaround
//   already used in lib/articles/kubernetes-rbac-design-principles.ts
//   (media.defense.gov returns HTTP 403 to automated fetches regardless of
//   the document's own liveness).
// See the calling agent's final report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const sections: UniversalSections = {
  executiveSummary: [
    "A container management interface is anything that lets a caller tell a container runtime or a node what to run, what to execute inside a running container, or what to inspect — the kubelet's own HTTPS API on every Kubernetes node, the containerd or CRI-O socket that runtime speaks to, and the Docker Engine API when it is exposed remotely over TCP rather than only through a local socket. Each is a distinct piece of software with its own protocol, and each is easy to reason about in isolation as \"that's just how the platform talks to itself.\" The risk shape underneath all three is identical: whether a caller is authenticated and authorized before the interface acts on a request, and what that interface can do once it decides to act, is usually far more permissive than whoever configured it assumed.",
    "This guide treats container management interfaces as one category rather than three separate topics, because the failure mode repeats across all of them: a default that is permissive by design (the kubelet ships with anonymous requests allowed and every authorized-or-not request permitted, unless both are explicitly turned off), a control that looks like a boundary but isn't (a private subnet is not the same claim as an authenticated interface), and an interface whose blast radius, once reached, is effectively the whole node — exec into any pod, pull any pod's logs, or start a new container with the host's own privileges. It goes deep on the kubelet API specifically, since it is the one of the three not already covered elsewhere in this catalog, and treats the containerd/CRI-O socket and the Docker Engine API's remote-TCP case as parallel instances of the same underlying pattern rather than repeating this catalog's existing docker.sock deep dive.",
  ],
  whatYouWillLearn: [
    "What counts as a container management interface across three distinct mechanisms — the kubelet API, the containerd/CRI-O socket, and the Docker Engine API exposed remotely — and why treating them as one risk category, rather than three unrelated topics, changes what you check for.",
    "The kubelet's actual default authentication and authorization behavior (anonymous requests accepted by default, every request permitted by default unless a webhook authorizer is configured) and exactly what that combination grants a reachable caller.",
    "Why the historical kubelet read-only port was a stricter version of the same risk — literally no authentication or authorization check of any kind — and why it still shows up in hardening checklists even though current versions default it off.",
    "Why the containerd/CRI-O socket carries the same root-equivalent risk this catalog's docker.sock guide already documents for Docker, reached through a different transport that is easy to assume is 'not that risk.'",
    "How to inventory every management interface a node actually exposes, test its real reachability instead of trusting a network diagram, and verify each one enforces authentication and authorization rather than assuming a private subnet is itself a control.",
  ],
  intendedAudience: [
    "Platform engineers who operate Kubernetes nodes, containerd/CRI-O runtimes, or Docker hosts and need to know exactly what each management interface exposes by default.",
    "Security engineers auditing a cluster or fleet of container hosts for reachable, under-authenticated management surfaces.",
    "Practitioners who have already read this catalog's docker.sock guide and want the equivalent treatment for the kubelet API and the containerd/CRI-O socket.",
  ],
  prerequisites: [
    "Basic familiarity with Kubernetes nodes, kubectl, and with how a container runtime (Docker, containerd, CRI-O) relates to the kubelet that manages it.",
    "A fictional or isolated lab cluster or container host you control and are authorized to configure — a local kind, minikube, or k3s instance, or a standalone Docker/containerd host, is sufficient; this guide does not require a managed cloud cluster.",
    "This guide does not repeat lib/articles/docker-sock-mounting-security-risks.ts's docker.sock-specific mechanics or lib/articles/kubernetes-rbac-design-principles.ts's RBAC object model — reading either first is helpful but not required.",
  ],
  problem: [
    "Every container management interface covered here exists for a legitimate operational reason: the kubelet API is how the control plane tells a node to start a pod, execute a health check, or stream a container's logs; the containerd/CRI-O socket is how the kubelet actually talks to the runtime doing that work; the Docker Engine API is how a remote client manages containers on a Docker host without local shell access. None of that legitimate purpose requires the interface to be reachable, or to act, without checking who is asking.",
    "The recurring failure is treating network placement as if it were authentication. A kubelet API left at its shipped defaults, a containerd socket whose group membership was never actually audited, or a Docker Engine API bound to a TCP port \"because it's only reachable from the internal network\" all share the same unexamined assumption: that the set of callers who can reach the interface is smaller, and more trustworthy, than it actually is. A subnet gets a new host added to it for an unrelated reason. A firewall rule gets loosened during an incident and never reverted. A default that was permissive on day one stays permissive because nothing about it visibly broke. The interface itself never notices any of this, because it was never actually checking who was calling.",
  ],
  threatModel: [
    "Assets: every pod and container schedulable on a given node (reachable through kubelet exec/logs/run endpoints or through the runtime socket the kubelet itself uses), the node's own filesystem and kernel (reachable through a privileged container the interface can be told to start), and, transitively, anything else those pods or that node can reach.",
    "The central trust decision each interface must make, and the one this guide is actually about: is the caller authenticated, is the authenticated caller then authorized for the specific action requested, and does the interface deny by default when either check is inconclusive. Kubernetes' own kubelet documentation states plainly that, by default, \"requests that are not rejected by other configured authentication methods are treated as anonymous requests,\" with a username of `system:anonymous` and a group of `system:unauthenticated` (Kubernetes, Kubelet authentication/authorization documentation) — anonymous access is the shipped default, not an opt-in. The kubelet's `--authorization-mode` flag defaults to `AlwaysAllow`, which the flag's own description states allows all requests (Kubernetes, kubelet command-line reference) — so a kubelet running with both defaults unchanged accepts an unauthenticated caller and then authorizes every request that caller makes, with no further check at all.",
    "Representative scenario, fictional throughout: Vantage Grid Systems, a fictional mid-size operator, runs a small on-premises Kubernetes cluster. A node pool was recently expanded onto a broader internal subnet to add capacity, and the network policy meant to restrict which hosts could reach each node's kubelet port was written against the original, narrower subnet and never updated for the new one. No credential was ever configured or leaked — the kubelet was simply left at its shipped anonymous-auth and AlwaysAllow defaults, and a caller on the newly added subnet can now reach it directly.",
    "Failure modes this scenario illustrates, none requiring a sophisticated attacker: (1) a caller on the reachable subnet queries the kubelet's pod-listing endpoint and enumerates every pod on the node with no credential at all; (2) the same caller issues an exec request against a running pod and gets an interactive shell inside it, again with no credential, because `AlwaysAllow` authorizes the request once anonymous authentication has already been accepted; (3) from inside that pod, the caller reaches the node's containerd or CRI-O socket if it happens to be mounted or otherwise reachable from within the pod, and uses it the same way this catalog's docker.sock guide describes for the Docker Engine API — to create a new, more privileged container and escape to the node itself.",
    "Out of scope: the Kubernetes API server's own authentication and authorization (covered by lib/articles/kubernetes-rbac-design-principles.ts once a caller is already an authenticated API-server subject — this guide is about interfaces upstream of that, at the node and runtime level); docker.sock's own mechanics as a local socket (covered in depth by lib/articles/docker-sock-mounting-security-risks.ts); and the specific query syntax or configuration file format of any one Kubernetes distribution's kubelet defaults, which vary by distribution and version.",
  ],
  mainContent: [
    "**Three distinct interfaces, one risk shape.** The kubelet API is an HTTPS endpoint every node's kubelet serves, primarily for the control plane to instruct the node and to retrieve logs and exec results, but reachable by any network caller who can complete a TLS handshake with it. The containerd or CRI-O socket is a local Unix domain socket (or, less commonly, a network-exposed gRPC endpoint) the kubelet itself uses to tell the runtime what to actually start, stop, or inspect — structurally the same kind of interface as docker.sock, just a different daemon and protocol. The Docker Engine API is usually reached through a local socket (docker.sock, covered by lib/articles/docker-sock-mounting-security-risks.ts), but can also be bound to a TCP port for remote management — a materially different exposure, since a TCP-bound API can be reached from anywhere the network permits, not just from inside the host. All three answer the same underlying question for every request: who is asking, and are they allowed to ask for this — and all three can be configured, by omission rather than by a deliberate choice, to answer that question with 'anyone' and 'yes.'",
    "**The kubelet's shipped defaults are permissive, not neutral.** `--anonymous-auth` defaults to `true`, and the kubelet's own documented behavior is direct about what that means: any request that isn't otherwise rejected is treated as anonymous, with `system:anonymous`/`system:unauthenticated` identity (Kubernetes, Kubelet authentication/authorization documentation). `--authorization-mode` defaults to `AlwaysAllow` (Kubernetes, kubelet command-line reference) — a mode whose own description is simply that it allows all requests, with no further evaluation. Neither default is a misconfiguration introduced by an operator; both are what a kubelet does out of the box unless `--anonymous-auth=false` and `--authorization-mode=Webhook` (with `--kubeconfig` pointing at an API server that can evaluate `SubjectAccessReview`s) are explicitly configured. A kubelet left at both defaults, and reachable on the network, will authenticate anyone as anonymous and then authorize that anonymous caller for everything — including the exec, run, and logs endpoints that let a caller act on or observe any pod the node is running.",
    "**The historical read-only port was a stricter version of the same problem.** Kubernetes' kubelet configuration documents a `readOnlyPort` field whose own description states it serves requests \"with no authentication/authorization\" at all — not anonymous authentication followed by an AlwaysAllow authorization decision, but no check of any kind (Kubernetes, Kubelet Configuration reference). Current kubelet versions default this field to `0` (disabled), but it is still configurable, and CIS's Kubernetes Benchmark and multiple managed-Kubernetes vendors continue to call out disabling it explicitly precisely because clusters upgraded or built from older defaults, or from a distribution that still enables it, can still be running it today. A reachable read-only port answers every read-style request (pod listing, metrics, some log access) with no authentication step to bypass in the first place — it isn't gated by AlwaysAllow being permissive; there is no gate.",
    "**The containerd/CRI-O socket is the same root-equivalent risk as docker.sock, reached differently.** containerd's own operator guidelines state the socket's default permissions directly — \"containerd sets socket permissions to `0660` on startup\" — and are equally direct about the consequence of loosening them: \"socket access is equivalent to root and bypasses `sudo` auditing,\" with explicit guidance to \"never mount these sockets inside unprivileged containers\" and to restrict the socket's group ownership to \"a system GID... that has no unprivileged users\" (containerd, Operator Guidelines). This is structurally the same finding lib/articles/docker-sock-mounting-security-risks.ts documents for docker.sock — a client that can connect to the socket can tell the runtime to do anything the runtime itself is privileged to do, including start a new container with the host's filesystem mounted in. The reason it deserves separate attention rather than being assumed to be 'already covered' by the docker.sock guide is that a reviewer auditing only for docker.sock mounts, because that is the name they know to look for, can walk right past an equally reachable containerd or CRI-O socket that grants the same thing under a different filename.",
    "**The Docker Engine API's remote-TCP exposure is a different exposure shape than the local-socket case.** Docker's current documentation states that exposing the daemon API over HTTP without TLS is not permitted and causes the daemon to fail to start (Docker documentation, Docker daemon attack surface) — a meaningfully hardened default compared to earlier versions. Where the remote API is enabled, Docker's own guidance on protecting daemon access describes a mutual TLS model: the daemon accepts connections only from a client holding a certificate signed by a trusted CA, and a client connects only to a daemon presenting a certificate signed by that same CA (Docker documentation, Protect the Docker daemon socket). The same guidance states the consequence of a leaked or overly broad certificate as plainly as its docker.sock guidance states the consequence of socket access: \"anyone with the keys can give any instructions to your Docker daemon, giving them root access to the machine hosting the daemon,\" and to \"guard these keys as you would a root password.\" The exposure shape differs from a local socket mount in one specific way worth treating separately: a TCP-bound API, even with TLS required, is reachable from anywhere the network permits a connection, not only from processes already running on the host — so the actual reachable population of callers is a network question (firewall rules, security groups, routing), not only a filesystem-permission question the way the local-socket case is.",
    "**MITRE ATT&CK catalogs this as a known technique family, not a novel concern.** T1609, Container Administration Command, names exactly the interfaces this guide covers as remote-execution vectors: an adversary \"may gain remote execution in a container in the cluster via interaction with the Kubernetes API server, the kubelet, or by running a command such as `kubectl exec`,\" alongside the Docker daemon and `docker exec` (MITRE ATT&CK, T1609). T1610, Deploy Container, names Docker's `create` and `start` APIs and Kubernetes' own web dashboards as deployment vectors an adversary can use once a management interface is reachable (MITRE ATT&CK, T1610). T1611, Escape to Host, documents the general pattern of exploiting a reachable container-management socket to break out of a container, naming docker.sock as its example — the same reasoning this guide applies to the containerd and CRI-O sockets extends directly from that documented pattern (MITRE ATT&CK, T1611).",
  ],
  validationEvidence: [
    "This guide describes the documented default behavior of the kubelet API, the containerd/CRI-O socket, and the Docker Engine API, illustrated with a single fictional organization and scenario; it does not reproduce a completed audit of a real cluster's or fleet's actual interface configuration. Its evidence state is UNVERIFIED, and the guide module's requirements/procedure/validation/rollback steps below are a starting checklist to run and verify against your own isolated lab's actual behavior, not a validated result.",
  ],
  limitations: [
    "This guide covers whether a caller can reach and act on a node-level or runtime-level container management interface at all. It does not repeat lib/articles/kubernetes-rbac-design-principles.ts's treatment of what an already-authenticated Kubernetes API-server subject may then do, or lib/articles/docker-sock-mounting-security-risks.ts's deep mechanics of the Docker Engine API and its docker.sock-specific mitigations — both are cross-referenced above rather than restated.",
    "It does not cover the Kubernetes API server's own hardening (its own authentication, authorization, and admission-control configuration on port 6443/443) beyond noting it as a separate, upstream topic from the node-level interfaces covered here.",
    "It does not walk through the CIS Kubernetes or Docker Benchmarks control by control, or the NSA/CISA Kubernetes Hardening Guidance section by section; it cites them as authoritative baselines to check a real environment against, not as content reproduced here.",
    "Exact defaults (the kubelet read-only port's default value, the specific flags a given managed-Kubernetes distribution has already changed from upstream) can differ by Kubernetes version and by distribution; verify current behavior against your own cluster's actual version and configuration before relying on any one detail here.",
  ],
  defensiveRecommendations: [
    "Inventory every container management interface actually reachable per node or host: the kubelet's HTTPS endpoint, any read-only kubelet port still enabled, the containerd or CRI-O socket's reachability from within any container, and any Docker Engine API bound to a TCP port — regardless of what a network diagram claims should be reachable.",
    "Set `--anonymous-auth=false` and `--authorization-mode=Webhook` (with a `--kubeconfig` pointing at an API server that can evaluate `SubjectAccessReview`s) on every kubelet; treat a kubelet still running either default as a finding, not an acceptable baseline.",
    "Confirm the kubelet's read-only port is disabled (`readOnlyPort: 0`) rather than assuming a current default already disables it, since distribution and version differences mean this cannot be taken for granted.",
    "Restrict the containerd/CRI-O socket's group ownership to a system group with no unprivileged members, and never mount that socket into a container that does not have a specific, documented need to reach the runtime directly.",
    "Never bind the Docker Engine API to a TCP port without mutual TLS client-certificate authentication, and treat a valid client certificate for that API with the same handling discipline as a root credential — including rotation and revocation when a certificate may have been exposed.",
    "Test reachability of every management interface from a position representing an untrusted or newly added network segment, not only from the position the interface was originally designed to be reached from — a subnet added later for an unrelated reason is a common, quiet way an interface's actual reachable population grows past what its original configuration assumed.",
  ],
  keyTakeaways: [
    "A container management interface's risk is the same question in three different transports: is the caller authenticated, is the authenticated caller then authorized, and does the interface deny by default when either check is inconclusive — network placement alone answers neither question.",
    "The kubelet ships with `--anonymous-auth=true` and `--authorization-mode=AlwaysAllow` by default; both must be explicitly changed, or a reachable kubelet authenticates anyone as anonymous and then authorizes everything that caller requests.",
    "The containerd/CRI-O socket carries the same root-equivalent risk this catalog's docker.sock guide documents for Docker, reached through a different daemon and filename — auditing only for docker.sock mounts can miss it entirely.",
    "MITRE ATT&CK documents this as a known technique family (T1609, T1610, T1611), not a novel or theoretical concern — the kubelet, the Kubernetes API server, and the Docker daemon are named explicitly as remote command-execution and container-deployment vectors.",
    "A Docker Engine API bound to a TCP port is a different exposure shape than a local socket mount: reachability becomes a network question, not only a filesystem-permission question, even when mutual TLS is correctly required.",
  ],
  references: [
    "Kubernetes, Kubelet authentication/authorization documentation: https://kubernetes.io/docs/reference/access-authn-authz/kubelet-authn-authz/",
    "Kubernetes, kubelet command-line reference (--anonymous-auth, --authorization-mode): https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/",
    "Kubernetes, Kubelet Configuration (v1beta1) reference (readOnlyPort): https://kubernetes.io/docs/reference/config-api/kubelet-config.v1beta1/",
    "Docker documentation — Docker daemon attack surface: https://docs.docker.com/engine/security/",
    "Docker documentation — Protect the Docker daemon socket: https://docs.docker.com/engine/security/protect-access/",
    "containerd documentation — Operator Guidelines (socket permissions, root-equivalent access): https://containerd.io/docs/main/security/operator_guidelines/",
    "MITRE ATT&CK, T1609 — Container Administration Command: https://attack.mitre.org/techniques/T1609/",
    "MITRE ATT&CK, T1610 — Deploy Container: https://attack.mitre.org/techniques/T1610/",
    "MITRE ATT&CK, T1611 — Escape to Host: https://attack.mitre.org/techniques/T1611/",
    "NIST SP 800-190, Application Container Security Guide: https://csrc.nist.gov/pubs/sp/800/190/final",
    "CIS Kubernetes Benchmark: https://www.cisecurity.org/benchmark/kubernetes",
    "CIS Docker Benchmark: https://www.cisecurity.org/benchmark/docker",
    // media.defense.gov (DoD's own CDN) blocks automated fetches (HTTP 403)
    // regardless of the document's own liveness — same workaround already
    // used in lib/articles/kubernetes-rbac-design-principles.ts. Cited via
    // CISA's own announcement/landing page for the same guidance instead of
    // the bot-blocked direct PDF URL.
    "NSA and CISA, Kubernetes Hardening Guidance, announced: https://www.cisa.gov/news-events/alerts/2022/03/15/updated-kubernetes-hardening-guide",
  ],
  relatedSlugs: ["docker-sock-mounting-security-risks", "kubernetes-rbac-design-principles", "understanding-network-trust-boundaries"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A fictional or isolated lab Kubernetes cluster and/or standalone Docker or containerd host you control and are authorized to configure — a local kind, minikube, or k3s instance, or a standalone container host, is sufficient; not a production environment.",
    "Sufficient access to inspect and change kubelet flags/configuration, containerd/CRI-O socket permissions, and Docker daemon configuration on the lab host(s) for the duration of the exercise.",
    "A second host, network namespace, or equivalent vantage point that represents an untrusted or newly added network segment, so reachability can be tested from outside the interface's originally intended callers.",
  ],
  procedure: [
    "On the lab kubelet, check the currently effective `--anonymous-auth` and `--authorization-mode` values (via the running process's flags or its config file) rather than assuming the shipped defaults were already changed.",
    "From the untrusted vantage point, attempt an unauthenticated request against the kubelet's HTTPS endpoint (for example, a pod-listing or exec request) and record whether it is accepted or rejected.",
    "Set `--anonymous-auth=false` and `--authorization-mode=Webhook` (with a valid `--kubeconfig`) on the lab kubelet, and repeat the same unauthenticated request from the same vantage point — confirm it is now rejected.",
    "Check whether the kubelet's read-only port is enabled (a non-zero `readOnlyPort`); if it is, attempt an unauthenticated request against it specifically, then disable it and confirm the same request now fails to connect at all.",
    "Inspect the containerd or CRI-O socket's file permissions and group ownership on the lab host, and confirm whether any running container has that socket mounted or otherwise reachable from inside it.",
    "If a Docker daemon is in scope, confirm whether its API is bound to any TCP port and, if so, whether it requires mutual TLS client-certificate authentication — attempt a plain, unauthenticated connection from the untrusted vantage point and confirm it is refused.",
  ],
  validation: [
    "Confirm the kubelet's actual authentication/authorization behavior was tested by an unauthenticated request from the untrusted vantage point, not inferred from the configuration file alone — a flag change only counts once its effect is observed.",
    "Confirm the read-only port test, if applicable, showed a connection-level failure after disabling it, not merely an absence of the flag from a config file.",
    "Confirm the containerd/CRI-O socket check identified every container with that socket reachable from inside it, not only the ones expected to have it — an unexpected mount is the finding this check exists to surface.",
    "Confirm the Docker Engine API's TLS requirement, if applicable, was tested with an actual unauthenticated connection attempt from the untrusted vantage point, not assumed from the daemon's configuration file alone.",
    "Record any check that could not be performed directly in the lab (for example, a distribution-specific default this guide does not cover) as UNVERIFIED rather than assuming it behaves as described here.",
  ],
  rollback: [
    "If hardening the kubelet's authentication or authorization breaks a legitimate control-plane call path the initial testing missed, do not revert to `AlwaysAllow` or anonymous access as the fix — identify the specific missing credential or authorization rule and add only that, so the fix stays a deliberate, documented narrowing.",
    "If restricting containerd/CRI-O socket access breaks a workload that genuinely needs it, grant that specific workload access explicitly (a dedicated, narrowly scoped mount or group membership) rather than reopening the socket broadly.",
    "Keep the before/after configuration on record for any real change to a management interface's authentication, authorization, or exposure, so a later reviewer can distinguish a deliberate hardening change from an interface that was always configured this way.",
  ],
};

const diagram: FlowDiagramSpec = {
  titleId: "container-management-interface-diagram",
  title: "A kubelet left at its shipped defaults answers an unauthenticated request",
  desc: "A caller on a fictional internal subnet reaches a node's kubelet HTTPS endpoint. Interactive: switch between the normal path, where the kubelet has anonymous-auth disabled and Webhook authorization configured and rejects the request, and the failure path, where the kubelet is left at its shipped defaults (anonymous-auth enabled, AlwaysAllow authorization) and the same unauthenticated request reaches a pod's exec endpoint. Explore each node for details.",
  viewBox: "0 0 1140 320",
  failureLabel: "Kubelet left at shipped defaults",
  caption:
    "Fictional Vantage Grid Systems node: an unauthenticated caller on a newly added internal subnet reaches the kubelet's HTTPS endpoint. In the normal path, the kubelet has anonymous-auth disabled and Webhook authorization configured, so the request is rejected with 401 Unauthorized. In the failure path, the kubelet is left at its shipped defaults — anonymous-auth enabled, AlwaysAllow authorization — so the same request is treated as system:anonymous, authorized anyway, and reaches the pod exec endpoint, giving the caller a shell inside the pod with no credential at all.",
  motionDuration: 2600,
  mainPacketRoute: { d: "M180,150 H220 M440,95 H480 M700,95 H740", length: 200 },
  edges: [
    { id: "caller-kubelet", from: "caller", to: "kubelet", d: "M180,150 H220", length: 40, kind: "main", activeIn: ["normal", "failure"] },
    { id: "kubelet-webhook", from: "kubelet", to: "webhook-authz", d: "M440,95 H480", length: 40, kind: "main", activeIn: ["normal"] },
    { id: "webhook-rejected", from: "webhook-authz", to: "rejected", d: "M700,95 H740", length: 40, kind: "main", activeIn: ["normal"] },
    { id: "kubelet-alwaysallow", from: "kubelet", to: "alwaysallow", d: "M440,215 H480", length: 40, kind: "failure", activeIn: ["failure"] },
    { id: "alwaysallow-exec", from: "alwaysallow", to: "exec-endpoint", d: "M700,215 H740", length: 40, kind: "failure", activeIn: ["failure"] },
    { id: "exec-shell", from: "exec-endpoint", to: "shell", d: "M960,215 H1000", length: 40, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "caller",
      label: "Caller on a newly added internal subnet",
      x: 10,
      y: 120,
      w: 170,
      h: 70,
      activeIn: ["normal", "failure"],
      description:
        "A fictional network caller reaching the node directly — not the Kubernetes control plane. No credential of any kind is presented; the caller relies entirely on whatever the kubelet's own authentication and authorization decide to do with an anonymous request.",
    },
    {
      id: "kubelet",
      label: "Kubelet HTTPS endpoint",
      x: 220,
      y: 110,
      w: 220,
      h: 90,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Kubelet HTTPS endpoint — the first and only trust decision point in this diagram",
      description:
        "Every node's kubelet serves this endpoint. What happens next depends entirely on two flags: --anonymous-auth and --authorization-mode. Both default to permissive values (anonymous-auth=true, authorization-mode=AlwaysAllow) unless explicitly changed.",
    },
    {
      id: "webhook-authz",
      label: "anonymous-auth=false, authorization-mode=Webhook",
      x: 480,
      y: 55,
      w: 220,
      h: 80,
      role: "safe",
      activeIn: ["normal"],
      focusableLabel: "Kubelet hardened configuration — normal path only",
      description:
        "The kubelet explicitly configured to reject anonymous requests and delegate authorization to a SubjectAccessReview against the API server. This is a deliberate configuration choice, not the kubelet's own shipped default.",
    },
    {
      id: "rejected",
      label: "401 Unauthorized — request rejected",
      x: 740,
      y: 60,
      w: 220,
      h: 70,
      role: "safe",
      activeIn: ["normal"],
      description:
        "The intended outcome for an unauthenticated caller: the kubelet rejects the request outright. No pod is listed, no exec is granted, no log is streamed.",
    },
    {
      id: "alwaysallow",
      label: "Default: anonymous-auth=true, authorization-mode=AlwaysAllow",
      x: 480,
      y: 180,
      w: 220,
      h: 80,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Kubelet shipped defaults, unchanged — failure path only",
      description:
        "The kubelet's own shipped defaults, left unchanged. The caller's unauthenticated request is authenticated as system:anonymous / system:unauthenticated, and AlwaysAllow authorizes every request from any identity with no further check — including this one.",
    },
    {
      id: "exec-endpoint",
      label: "Pod exec / logs / run endpoint",
      x: 740,
      y: 185,
      w: 220,
      h: 70,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Pod exec/logs/run endpoint reached with no credential",
      description:
        "The same endpoints a legitimate control-plane caller uses to manage the node's pods, now reached by an unauthenticated caller because nothing upstream stopped the request.",
    },
    {
      id: "shell",
      label: "Interactive shell inside the pod",
      x: 1000,
      y: 185,
      w: 130,
      h: 70,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Interactive shell inside the pod — the failure path's actual endpoint",
      description:
        "The concrete outcome: the caller now has an interactive shell inside a running pod with no credential ever presented. From here, reaching the node's containerd or CRI-O socket — if it is mounted or otherwise reachable from inside the pod — extends the same pattern this catalog's docker.sock guide documents for the Docker Engine API, toward escaping to the node itself.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Security Risks of Container Management Interfaces",
    slug: "container-management-interfaces-security-risks",
    summary:
      "The kubelet API, the containerd/CRI-O socket, and the Docker Engine API exposed remotely are three distinct container management interfaces that share one risk shape: each can be reached and acted on by an unauthenticated or under-authorized caller when left at permissive defaults or assumed-safe network placement. Goes deep on the kubelet's actual anonymous-auth and AlwaysAllow defaults — not covered elsewhere in this catalog — and cross-references this catalog's existing docker.sock guide rather than repeating it.",
    pillar: "build-securely",
    primaryCategory: "container-kubernetes-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["kubernetes", "docker", "access-control", "least-privilege"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 13,
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "pending" },
    technicalReview: { status: "pending" },
    publicationApproval: { status: "pending" },
  },
  sections,
  module: module_,
  diagram,
};
