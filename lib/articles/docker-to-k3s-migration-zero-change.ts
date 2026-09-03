// Knowledge-base article (Bead securitycorp-source-4zl.25, "Planning a
// Zero-Change Docker-to-k3s Migration"). Published 2026-09-03 under Ravi
// Teja Thota's standing publication authorization after real review of
// citations, safety, and evidenceState honesty, per
// docs/publication-safety-policy.md and docs/knowledge-base.md. All examples describe a fictional team
// and a fictional internal-tools stack; no real host, repository, credential,
// employer detail, or unresolved real vulnerability appears anywhere in this
// file.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788435001941-0qwsdd, template "research"). A
// bounded workflow_status check showed the same documented issue recorded
// elsewhere in this repo (see CLAUDE.md, "Current Ruflo executor
// limitation"): the workflow stayed at 0% progress with a single pending
// "Execute" stage and returned no retrievable editorial output. This draft
// was therefore produced with the disclosed native fallback instead —
// separate sequential research, drafting, technical-verification,
// publication-safety, and final-editorial passes — not credited to Ruflo.
// Every citation below was verified against its live primary source (NIST,
// CIS, CISA/NSA, and the official Kubernetes, k3s, and Docker Compose
// documentation) with WebFetch before being included; none was invented.
// See the calling agent's final report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, DeepDiveModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const sections: UniversalSections = {
  executiveSummary: [
    "\"Zero-change\" is usually used to describe a migration's blast radius on the application: same container images, same environment variables, same behavior observed by users. That framing measures functional parity, and functional parity is not security parity. A Docker Compose stack and the identical workload running on k3s do not sit behind the same defaults, even when every application-layer setting was carried over untouched — the platform underneath the workload changed, and several of the things Compose gave you for free by simply being Compose stop being free the moment the same containers become Kubernetes pods.",
    "This deep-dive treats \"zero-change\" as a claim that has to be verified, not a property that follows automatically from a careful manifest translation. It walks through five places where a Docker-to-k3s migration silently changes the platform's default security posture even while the workload's own code and configuration stay identical — the control-plane surface, the network model, the default exposure surface, per-workload identity, and secrets storage — and lays out what to check, on the new platform, before calling a \"zero-change\" migration actually zero-change. A fictional small team, referred to here as Alder Peak Labs, running a self-hosted internal-tools stack, runs through the deep-dive and its accompanying diagram as a concrete illustration; it is not a reference architecture.",
  ],
  whatYouWillLearn: [
    "Why \"zero-change\" has to be defined as a security-posture claim, verified against the new platform's actual defaults, rather than assumed from a faithful manifest translation of the old one.",
    "The five concrete places a Docker-to-k3s migration changes the platform's default behavior even when the workload's own configuration is carried over unmodified: the control-plane surface, the network model, the default exposure surface, per-workload identity, and secrets storage.",
    "Why Docker Compose's per-project network isolation does not reappear automatically at the Kubernetes namespace level, and what has to be built deliberately to restore it.",
    "Why k3s's bundled Traefik ingress controller and ServiceLB load balancer mean a Service can become reachable on a real node port without the explicit `ports:` mapping Compose would have required.",
    "How to verify — not assume — that a Docker-to-k3s migration preserved the workload's original trust boundaries, using checks aimed at the new platform's actual defaults rather than at whether the application still starts.",
  ],
  intendedAudience: [
    "Practitioners and security engineers planning or reviewing a migration of an existing Docker or Docker Compose workload onto k3s or a similar lightweight Kubernetes distribution.",
    "Platform engineers who have already done the manifest translation and want to verify the result preserved the original deployment's trust boundaries, not just its functional behavior.",
    "Security-minded homelab and small-team operators evaluating whether \"it still works the same\" is sufficient evidence that a migration was safe.",
  ],
  prerequisites: [
    "Basic familiarity with Docker and Docker Compose: images, containers, the default per-project network Compose creates, and the `ports:` mapping used to publish a service to the host.",
    "Basic familiarity with core Kubernetes concepts — pods, namespaces, Services, and the idea that the API server is the cluster's single control point — is helpful but not required; the relevant concepts are introduced as they come up.",
    "No lab environment is required to follow this deep-dive; it is conceptual and uses a fictional stack and migration scenario throughout.",
  ],
  problem: [
    "A common, reasonable-sounding migration plan is: translate each Compose service into a Deployment, translate each Compose network alias into a Kubernetes Service, translate each `ports:` entry into an Ingress or a Service of type LoadBalancer, move `.env` values into Kubernetes Secret objects, and call it done once the application behaves identically to how it behaved under Compose. Every step in that plan is aimed at functional parity, and every step can succeed completely — the migrated stack looks, from the outside, exactly like the Compose stack it replaced — while the platform underneath it quietly adopted a different, and in several specific ways more permissive, set of defaults.",
    "The reason this happens is structural, not a matter of an individual engineer missing a step. Docker Compose and Kubernetes solve overlapping problems with different default postures, and \"faithfully translate every explicit setting\" only carries forward the settings that were explicit. It says nothing about the settings that Compose enforced implicitly, as a side effect of how Compose itself works, and that Kubernetes does not enforce as a side effect of anything — those either have to be re-implemented deliberately on the new platform, or they quietly stop applying, and the workload still starts and still serves traffic either way.",
  ],
  threatModel: [
    "Alder Peak Labs runs a small self-hosted internal-tools stack — an application service and a database, both wired together through Docker Compose's default project network — and migrates it to a single-node k3s cluster with the goal of a zero-change cutover: same images, same environment configuration, same observed behavior. This deep-dive's scenarios assume an adversary who has already gained code execution inside the migrated application container through some means outside this deep-dive's scope (a vulnerable dependency, for instance) and is deciding what that foothold is worth on the new platform, compared to what it would have been worth under the original Compose deployment.",
    "Under Compose, that foothold gave the adversary reachability limited to whatever else shared the project's default network — in Alder Peak Labs' case, the database, and nothing outside that Compose project, because Compose does not create a route to any other project's network by default. Under a naively \"translated\" k3s deployment, the same foothold can additionally offer: a namespace-scoped API credential the container never had under Compose, network reachability to workloads in unrelated namespaces that Compose's project boundary would never have permitted, and the ability to read any Kubernetes Secret the credential's RBAC bindings permit — none of which required a single line of the application's own code or configuration to change.",
    "Out of scope for this deep-dive: how the adversary obtained the initial foothold, container image or supply-chain security for the migrated workload (see other container-and-Kubernetes-security content in this catalog), the internal design of any specific CNI plugin, and hardening guidance for managed/cloud Kubernetes offerings, whose defaults differ from a self-managed k3s cluster's. Alder Peak Labs is illustrative throughout, not a reference architecture.",
  ],
  mainContent: [
    "**1. The control-plane surface changes shape, not just size.** Under Docker, the entire control surface for the host's containers is the Docker daemon, reached through `docker.sock`. Access to that socket is effectively all-or-nothing: anyone who can talk to it can create, inspect, or attach to any container the daemon manages, which is functionally root-equivalent on that host. Kubernetes replaces that with the API server, secured by authentication and — separately — by RBAC, which can express fine-grained, per-verb, per-resource, per-namespace permissions the Docker socket has no concept of. That sounds like a strict improvement, and structurally it can be, but only once RBAC is actually configured that way. A default k3s installation still has an equivalent of the all-or-nothing credential: the cluster's admin kubeconfig and the server's node-token grant the same root-equivalent scope the Docker socket did. A zero-change migration that moves `docker.sock` access control habits — \"whoever has this file can do anything, and that's fine because only trusted people have it\" — onto the kubeconfig and node-token without re-deriving who actually needs cluster-admin has changed the shape of the control surface without changing its effective permissiveness.",
    "**2. The network model does not carry the per-project boundary forward.** Docker Compose creates one network per project by default, and every service in that project can reach every other service in it by container port; the boundary that matters here is the one Compose draws around the whole project, isolating it from every other Compose project and from the host's other traffic. Kubernetes' baseline network model is different in a way that matters directly for this migration: official Kubernetes documentation states plainly that \"all pods can communicate with all other pods\" across the entire cluster by default, without NAT, and that this holds \"barring intentional network segmentation\" — meaning a Kubernetes namespace is not a network boundary by itself. The Compose project boundary that Alder Peak Labs relied on without ever configuring it does not reappear at the namespace level automatically; it has to be rebuilt explicitly with a NetworkPolicy, and that policy only takes effect if the cluster's CNI actually enforces NetworkPolicy objects. k3s bundles a NetworkPolicy controller (based on kube-router) specifically because its default CNI, Flannel, does not enforce NetworkPolicy on its own — a detail worth verifying directly against the running cluster rather than assumed from either component's name.",
    "**3. The default exposure surface gets more automatic, not more explicit.** Under Compose, nothing on a service is reachable from outside its project's network unless a `ports:` entry explicitly maps a host port to it — exposure is opt-in, one line per port, and easy to audit by reading the compose file. k3s changes that default meaningfully: it deploys the Traefik ingress controller by default on server startup, and it includes a built-in load balancer, ServiceLB (formerly Klipper), that automatically provisions a DaemonSet to expose any Service of type LoadBalancer on the real IP of every node that can run it — no cloud provider and no extra configuration required, by k3s's own documentation. A manifest translation that turns a Compose `ports:` mapping into a Kubernetes Service without specifically choosing its type can end up with a Service that is reachable on the node's actual network interface, achieved with less explicit configuration than the Compose `ports:` line it replaced.",
    "**4. Per-workload identity exists now, and it exists by default.** A container under Docker Compose has no built-in notion of an API credential — it has whatever environment variables and mounted files it was given, and nothing else unless something was deliberately added. A pod under Kubernetes is different: official Kubernetes documentation confirms that a ServiceAccount token is automatically mounted into a pod by default, giving that pod a namespace-scoped credential capable of authenticating to the API server, unless `automountServiceAccountToken: false` is explicitly set on the ServiceAccount or the pod. A zero-change migration that only translates the application's own configuration leaves this default in place — the migrated workload gains a live, usable API credential it never had or needed under Compose, and that credential is exactly the kind of thing a foothold inside the container can use for lateral movement within the namespace.",
    "**5. Secrets move from files to an object with a different, broader read surface.** Under Compose, a secret typically lived in an `.env` file or a bind-mounted file, readable by whoever had filesystem or Docker daemon access to the host — usually a small, well-understood set of people. Kubernetes Secrets are a first-class API object instead, and official Kubernetes documentation is explicit that Secrets are, by default, \"stored unencrypted in the API server's underlying data store\" and base64-encoded rather than encrypted, with the documentation's own caution stating plainly that \"anyone with API access can retrieve or modify a Secret.\" The read surface for that same value changed from \"whoever can reach this specific file on this specific host\" to \"whoever holds any RBAC grant permitting `get` or `list` on secrets in that namespace\" — a broader and more indirect population unless that RBAC grant is deliberately scoped as narrowly as the original file access was, and unless encryption at rest is turned on, which is not the default.",
  ],
  validationEvidence: [
    "This deep-dive is conceptual. It was not developed against a live or lab-reproduced k3s cluster, no manifest or configuration was reproduced end-to-end, and Alder Peak Labs is a fictional illustrative scenario, not a documented test. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence on a real cluster — the technical claims above are grounded in the cited official documentation and standards, not in an exercise performed for this article, and the label must not be upgraded merely because the reasoning here is internally consistent.",
  ],
  limitations: [
    "This deep-dive covers self-managed k3s specifically. Managed Kubernetes offerings (EKS, GKE, AKS, and similar) ship different control-plane, networking, and ingress defaults, and this deep-dive's specific claims about k3s's bundled Traefik, ServiceLB, and NetworkPolicy controller do not transfer to them without separately verifying each provider's own defaults.",
    "It covers the platform-level defaults that change during migration, not container image provenance, dependency supply-chain risk, or runtime vulnerability scanning for the migrated workload — those are covered elsewhere in this catalog's container-and-Kubernetes-security content.",
    "It does not walk through the CIS Kubernetes Benchmark or CIS Docker Benchmark control by control; it cites both as the authoritative baselines each platform should be checked against, not as content reproduced here.",
    "It assumes a single-node or small self-hosted k3s cluster resembling Alder Peak Labs' fictional scenario. A multi-node or multi-tenant cluster introduces additional trust-boundary questions — node-to-node trust and cross-tenant namespace isolation among them — that this deep-dive does not address.",
  ],
  defensiveRecommendations: [
    "Before migration, write down every trust boundary the Compose deployment relied on — even the ones nobody configured explicitly, like project-level network isolation — so there is a concrete list to verify against after the cutover, rather than an intuition that \"it looked isolated before.\"",
    "Treat the k3s server's node-token and any cluster-admin kubeconfig with at least the same access discipline the Docker socket received on the original host; a migration that changes the credential's shape without changing who can reach it has not reduced its risk.",
    "Apply a default-deny NetworkPolicy per namespace immediately after migration, then add only the specific pod-to-pod paths the workload actually requires — and confirm the cluster's CNI is actually enforcing NetworkPolicy objects, not merely accepting them, before relying on that policy for anything.",
    "Inventory every Service created during the migration by type before cutover. A Service of type LoadBalancer on k3s is reachable on a real node port through the bundled ServiceLB without further action; confirm each externally reachable Service was a deliberate choice, not a default that followed from omitting an explicit type.",
    "Set `automountServiceAccountToken: false` on any ServiceAccount or pod that does not call the Kubernetes API, and scope the RBAC bound to every ServiceAccount that does to the minimum verbs and resources it actually needs — a migrated workload should not gain a live API credential it never had reason to use under Compose.",
    "Enable encryption at rest for Kubernetes Secrets and scope RBAC read access to them as narrowly as the original file-based access was under Compose, rather than leaving the default unencrypted, broadly-readable-by-RBAC-grant behavior in place.",
    "Validate the migration's trust boundaries from the untrusted side — attempt cross-namespace pod reachability, attempt to reach a Service that should not be externally exposed, attempt to read a Secret with a deliberately under-privileged credential — rather than accepting \"the application behaves the same\" as evidence that nothing regressed.",
  ],
  keyTakeaways: [
    "\"Zero-change\" is a security-posture claim about the new platform's defaults, not a property that follows automatically from faithfully translating every explicit Compose setting into a Kubernetes manifest.",
    "Docker Compose's per-project network isolation does not reappear at the Kubernetes namespace level by default; official Kubernetes documentation confirms all pods can reach all other pods across the cluster absent deliberate NetworkPolicy enforcement.",
    "k3s's bundled Traefik ingress controller and ServiceLB load balancer make external exposure more automatic than Compose's explicit `ports:` mapping ever was — a Service can become reachable on a real node port with less explicit configuration than the line it replaced.",
    "A migrated pod gains a namespace-scoped API credential by default, through automatic ServiceAccount token mounting, that the equivalent Docker Compose container never had — an identity surface that did not exist before the migration and did not require any application change to appear.",
    "Kubernetes Secrets are unencrypted by default in the cluster's datastore and readable by anyone with the right RBAC grant — a broader, more indirect read surface than the file-based secret it replaced, unless encryption at rest and narrow RBAC are both deliberately configured.",
    "Verify each of these five defaults directly against the running k3s cluster before calling a migration zero-change; a workload that behaves identically to its Compose original is not evidence that its trust boundaries survived the move.",
  ],
  references: [
    "NIST SP 800-190, Application Container Security Guide: https://csrc.nist.gov/pubs/sp/800/190/final",
    "CIS Kubernetes Benchmark: https://www.cisecurity.org/benchmark/kubernetes",
    "CIS Docker Benchmark: https://www.cisecurity.org/benchmark/docker",
    "CISA and NSA, Updated Kubernetes Hardening Guidance: https://www.cisa.gov/news-events/alerts/2022/03/15/updated-kubernetes-hardening-guide",
    "Kubernetes documentation — Services, Load Balancing, and Networking (the \"all pods can communicate with all other pods\" default networking model): https://kubernetes.io/docs/concepts/services-networking/",
    "Kubernetes documentation — Network Policies: https://kubernetes.io/docs/concepts/services-networking/network-policies/",
    "Kubernetes documentation — Secrets: https://kubernetes.io/docs/concepts/configuration/secret/",
    "Kubernetes documentation — Role Based Access Control Good Practices: https://kubernetes.io/docs/concepts/security/rbac-good-practices/",
    "Kubernetes documentation — Configure Service Accounts for Pods (automountServiceAccountToken): https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/",
    "k3s documentation — Hardening Guide: https://docs.k3s.io/security/hardening-guide",
    "k3s documentation — Networking Services (default Traefik and ServiceLB behavior): https://docs.k3s.io/networking/networking-services",
    "k3s documentation — Basic Network Options (NetworkPolicy controller and --disable-network-policy): https://docs.k3s.io/networking/basic-network-options",
    "Docker Compose documentation — Networking (default per-project network behavior): https://docs.docker.com/compose/how-tos/networking/",
  ],
  relatedSlugs: ["segmentation-vs-isolation", "understanding-network-trust-boundaries", "designing-fail-closed-security-automation"],
};

const module_: DeepDiveModule = {
  kind: "deep-dive",
  architecture: [
    "Docker Compose's architecture is single-daemon and single-host: the Docker Engine is the only control plane, `docker.sock` is its only interface, and a project's network is a Linux bridge the daemon creates and tears down with the project. There is no separate datastore, no separate scheduler, and no separate identity system for containers to hold — everything a container has, it was explicitly given.",
    "k3s's architecture adds several components that do not have a Compose equivalent: the kube-apiserver as the single point of cluster control, a datastore behind it (SQLite by default on a single server, or an external datastore for multi-server setups), a scheduler, a controller manager, and — specific to k3s rather than to Kubernetes generally — a bundled containerd runtime, Traefik ingress controller, ServiceLB load balancer, and a kube-router-based NetworkPolicy controller layered on top of the default Flannel CNI. None of these are optional add-ons a migration chooses to bring along; they are present by default the moment `k3s server` starts.",
    "The practical architectural consequence for a migration is that the workload's own container images and runtime behavior can be identical before and after, while the platform they run inside gained an API server, a network policy engine, an ingress controller, and a load balancer that Compose never had — each with its own default posture, and each of those defaults now applies to the migrated workload whether or not anyone configured it on purpose.",
    "None of this requires abandoning k3s's convenience components to be safe — Traefik, ServiceLB, and the bundled NetworkPolicy controller can all be run securely. It requires treating each one as a new architectural element with its own default that has to be verified, the same way a new dependency added to an application would be reviewed rather than assumed safe because the rest of the stack around it is trusted.",
  ],
  trustBoundaries: [
    "The boundary Compose draws around a project's network is implicit and free: it exists the moment `docker compose up` runs, without a line of configuration dedicated to it. The equivalent Kubernetes boundary — pods in one namespace unable to reach pods in another — is neither implicit nor free: it requires a NetworkPolicy object and a CNI that actually enforces NetworkPolicy, and until both are in place, the cluster's real behavior is the opposite of Compose's default: every pod can reach every other pod, across every namespace, cluster-wide.",
    "The boundary around \"who can act as this workload\" changed from nonexistent (a Compose container has no API identity to hold) to present-but-unexamined (a pod's default ServiceAccount token) the moment the workload became a Kubernetes pod. A migration that never asks what that default token can do has introduced a new trust boundary — namespace-scoped API access — without anyone having decided where it should sit.",
    "The boundary around \"what is reachable from outside the cluster\" moved from an explicit, per-line decision in a compose file to an automatic consequence of a Service's `type` field, mediated by components — Traefik and ServiceLB — that are active by default rather than opted into. A Service left at its Kubernetes default or mistakenly declared as LoadBalancer crosses this boundary without the deliberate action Compose's `ports:` line would have required.",
    "The boundary around a secret value moved from a filesystem permission (who can read this file on this host) to an RBAC grant (who can `get` or `list` this object in this namespace), evaluated against an object that is unencrypted at rest by default. The boundary did not necessarily get weaker — RBAC can be scoped as tightly as a file permission — but it did become a boundary that has to be actively scoped rather than one that came from the filesystem's existing access model for free.",
  ],
  alternatives: [
    "Stay on Docker Compose, or move to Docker Swarm instead of Kubernetes, for a workload whose scale and team size don't need Kubernetes' scheduling or ecosystem — this avoids introducing the API server, RBAC surface, and NetworkPolicy model discussed throughout this deep-dive entirely, at the cost of Kubernetes' broader tooling and portability.",
    "Use a full kubeadm-provisioned cluster, k0s, or MicroK8s instead of k3s specifically. Each ships different bundled defaults — k3s's Traefik and ServiceLB are not universal Kubernetes behavior, and a distribution-neutral \"it's just Kubernetes\" assumption is exactly the kind of unverified default this deep-dive argues against; each distribution's actual defaults have to be checked on their own terms.",
    "Use a managed Kubernetes offering (for example, a major cloud provider's hosted control plane) instead of a self-managed k3s cluster. This shifts control-plane hardening to the provider and typically comes with a provider-specific CIS Kubernetes Benchmark profile, at the cost of the self-hosted property that made k3s attractive for a homelab or small-team deployment in the first place.",
    "Migrate in two deliberate phases rather than one \"zero-change\" cutover: first reproduce the original Compose-level trust boundaries explicitly on k3s (default-deny NetworkPolicy, scoped RBAC, disabled unneeded automount, encrypted secrets) before cutover, then treat any subsequent architectural change — adopting Ingress routing rules, splitting services across namespaces, and similar — as a separate, individually reviewed step instead of bundling it into the same change as the platform migration.",
  ],
  tradeoffs: [
    "A default-deny NetworkPolicy trades ongoing manifest maintenance — every legitimate pod-to-pod path must be added explicitly — for the same fail-closed network posture Compose's project isolation provided by default; skipping it trades that maintenance burden away but leaves the cluster's actual default, cluster-wide pod reachability, in place indefinitely.",
    "Disabling k3s's bundled Traefik and ServiceLB in favor of a manually configured ingress and load-balancing setup trades some of k3s's out-of-the-box convenience for an exposure surface that is fully explicit and auditable from the manifests alone — worthwhile for a workload where unreviewed exposure is unacceptable, unnecessary overhead for a low-sensitivity internal tool where the bundled defaults are already understood and accepted.",
    "Scoping RBAC and disabling ServiceAccount token automount per workload costs upfront analysis of what each workload actually needs to call, in exchange for removing a namespace-scoped API credential that most migrated workloads never had a use for under Compose and that meaningfully raises the value of a foothold inside any one of them.",
    "Enabling secrets encryption at rest costs a small amount of operational setup (an encryption configuration and key management) in exchange for closing the specific default Kubernetes documentation itself warns about — unencrypted secret storage in the cluster's datastore — which has no equivalent gap in a typical Compose deployment's file-based secrets.",
  ],
};

const diagram: FlowDiagramSpec = {
  titleId: "docker-compose-to-k3s-network-boundary-diagram",
  title: "Where a Docker Compose network boundary can silently disappear during a k3s migration",
  desc: "A fictional workload's application and database containers run inside a Docker Compose project, isolated by Compose's default per-project network from every other project on the host. Interactive: toggle between that default Compose isolation and the same workload migrated to k3s with no NetworkPolicy applied, where an unrelated namespace's pod can reach the database directly because Kubernetes' default pod network has no equivalent per-project boundary. Explore each node for details.",
  viewBox: "0 0 900 380",
  failureLabel: "Migrated to k3s, no NetworkPolicy applied",
  caption:
    "Under Compose, the migrated workload's project network has no path to any other project — the attempted route from the boundary to \"outside the project\" ends in open space because Compose never builds it. After a naive migration to k3s, the same workload sits on the cluster's flat default pod network, and a pod in an unrelated namespace reaches the database directly — the boundary Compose provided for free did not reappear, because nothing rebuilt it.",
  motionDuration: 2600,
  mainPacketRoute: { d: "M190,180 C220,140 235,120 260,105", length: 90 },
  edges: [
    { id: "workload-composeBoundary", from: "workload", to: "composeBoundary", d: "M190,180 C220,140 235,120 260,105", length: 90, kind: "main", activeIn: ["normal"] },
    {
      id: "composeBoundary-noroute",
      from: "composeBoundary",
      to: "composeIsolated",
      d: "M460,105 C485,105 505,105 525,105",
      length: 65,
      kind: "failure",
      activeIn: ["normal"],
    },
    { id: "workload-k3sBoundary", from: "workload", to: "k3sBoundary", d: "M190,200 C220,240 235,260 260,275", length: 90, kind: "main", activeIn: ["failure"] },
    { id: "k3sBoundary-unrelatedNamespace", from: "k3sBoundary", to: "unrelatedNamespace", d: "M460,275 H540", length: 80, kind: "main", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "workload",
      label: "Migrated workload (app + database)",
      x: 10,
      y: 140,
      w: 180,
      h: 90,
      activeIn: ["normal", "failure"],
      description:
        "The same application and database containers, unchanged, in both views. What differs between the normal and failure modes is not this workload's own code or configuration — it is the network platform underneath it, which is exactly the point: a workload can be a genuine zero-change migration at the application layer while its trust boundaries change entirely underneath it.",
    },
    {
      id: "composeBoundary",
      label: "Docker Compose project network",
      x: 260,
      y: 60,
      w: 200,
      h: 90,
      activeIn: ["normal"],
      role: "boundary",
      focusableLabel: "Docker Compose project network — the default per-project boundary Compose creates without any explicit configuration",
      description:
        "Compose creates this network automatically for the project and attaches every service in it. Reachability inside this boundary is open by design — that is what lets the app reach the database by service name — but the boundary around the whole project is real and exists for free: Compose does not build a route out of it to any other project.",
    },
    {
      id: "composeIsolated",
      label: "Other Compose projects / host: no route",
      x: 540,
      y: 60,
      w: 220,
      h: 90,
      activeIn: ["normal"],
      role: "safe",
      description:
        "Nothing here is reachable from the migrated workload's project network under normal Compose operation, and nothing had to be configured to make that true — it is Compose's default. This is the boundary a zero-change k3s migration has to rebuild deliberately, because the platform underneath no longer provides it automatically.",
    },
    {
      id: "k3sBoundary",
      label: "k3s cluster pod network (flat, no NetworkPolicy)",
      x: 260,
      y: 230,
      w: 200,
      h: 90,
      activeIn: ["failure"],
      role: "boundary",
      focusableLabel: "k3s cluster pod network with no NetworkPolicy applied — every pod can reach every other pod across every namespace by default",
      description:
        "This is Kubernetes' baseline networking model, not a k3s-specific misconfiguration: official Kubernetes documentation states all pods can communicate with all other pods across the cluster without NAT by default, and that Kubernetes namespaces are not a network boundary on their own. Without a NetworkPolicy — enforced by a controller that actually implements it — this is the real, active state of the migrated cluster.",
    },
    {
      id: "unrelatedNamespace",
      label: "Unrelated namespace pod: reaches database directly",
      x: 540,
      y: 230,
      w: 220,
      h: 90,
      activeIn: ["failure"],
      role: "blocked",
      focusableLabel: "Unrelated namespace's pod reaching the migrated database directly — the regression a naive zero-change migration introduces silently",
      description:
        "A pod in a namespace that has nothing to do with this workload can reach its database directly, because nothing on the cluster prevents it by default. This is the specific, concrete form the Compose project boundary's disappearance takes: not a crash, not an error, not anything that would surface during a functional-parity check — only a reachable path that used to not exist.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Planning a Zero-Change Docker-to-k3s Migration",
    slug: "docker-to-k3s-migration-zero-change",
    summary:
      "\"Zero-change\" usually means the application behaves identically before and after a migration — it says nothing about whether the platform's default security posture came along for the ride. A deep-dive into five places a Docker-to-k3s migration silently changes trust boundaries even when the workload's own code and configuration never change: the control-plane surface, the network model, the default exposure surface, per-workload identity, and secrets storage — and what to verify, on the new platform, before trusting the zero-change claim.",
    pillar: "build-securely",
    primaryCategory: "container-kubernetes-security",
    contentType: "deep-dive",
    difficulty: "intermediate",
    status: "published",
    tags: ["docker", "kubernetes", "migration-planning", "network-isolation"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 14,
    publishedAt: "2026-09-03",
    updatedAt: "2026-09-03",
    lastReviewedAt: "2026-09-03",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: false,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
  },
  sections,
  module: module_,
  diagram,
};
