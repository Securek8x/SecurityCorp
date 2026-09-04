// Knowledge-base article (Bead securitycorp-source-4zl.54.3.1, "Why
// Container Health Is Not Security Validation"). Drafted 2026-09-04 as
// `status: "drafting"` — NOT authorized for publication by this agent. All
// examples describe a fictional lab workload and a fictional company
// ("Northlake Labs"); no real host, cluster, credential, employer detail, or
// unresolved real vulnerability appears anywhere in this file.
//
// Overlap check against Bead securitycorp-source-4zl.5, "Why Container
// Health Is Not Application Health": as of this draft, 4zl.5 is OPEN and has
// not been drafted — no matching slug or file exists under lib/articles/
// (confirmed by searching lib/articles/ and lib/knowledge-content.ts for
// "application-health" / "Not Application Health" before writing this
// file). Because that companion piece does not yet exist, this article's
// title and slug were deliberately chosen to stay unambiguous against 4zl.5's
// likely future scope: this one is titled precisely around "security
// validation," not "application health," and its content stays confined to
// the security-posture gap (is the container compromised, misconfigured, or
// running with excess privilege) rather than the functional-correctness gap
// (does the application behave correctly) that 4zl.5's title implies. A
// probe proves neither — but they are different gaps, and a future author of
// 4zl.5 should find this article's scope easy to distinguish from their own
// without needing to re-read it first. If 4zl.5 is drafted later, its author
// should add a short overlap note here (and in their own file) confirming
// the boundary held.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788532574920-olk4g4, template "research", task
// scoped to this article's exact objective/audience/scope). A bounded
// workflow_status check showed the same documented issue recorded elsewhere
// in this repo (see CLAUDE.md, "Current Ruflo executor limitation"): the
// workflow stayed at 0% progress with a single pending "Execute" stage and
// returned no retrievable editorial output. This draft was therefore
// produced with the disclosed native fallback instead — separate sequential
// research, drafting, technical-verification, publication-safety, and
// final-editorial passes — not credited to Ruflo. Every citation below was
// verified against its live source (Kubernetes upstream docs, OWASP cheat
// sheets, and search-corroborated summaries of NIST SP 800-190 and the
// NSA/CISA Kubernetes Hardening Guidance, whose primary PDFs returned
// non-text/binary content or an HTTP 403 to direct fetch) before being
// included; claims attributed to a source that could not be fetched
// verbatim are phrased as general, well-established descriptions of that
// source's guidance rather than as direct quotations. See the calling
// agent's final report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const sections: UniversalSections = {
  executiveSummary: [
    "A container orchestrator's health-check machinery — a liveness probe, a readiness probe, a `Running` pod status, a restart policy that keeps succeeding — answers one narrow question: is the process inside the container alive and responding the way it was configured to respond. Kubernetes' own documentation is explicit that a liveness probe exists to \"catch a deadlock, where an application is running, but unable to make progress,\" and that a readiness probe exists only to decide \"when a container is ready to accept traffic.\" Neither check reasons about who the process is running as, what is installed inside the image, what the filesystem or kernel-capability configuration permits, or whether the process has been compromised.",
    "That gap is not cosmetic. A container can be reported healthy — probe green, status `Running`, zero restarts — while running as root, while a dependency inside it carries a known, exploitable vulnerability, while its root filesystem is writable, while it holds Linux capabilities it never needs, or while it is actively under an adversary's control. An adversary who has gained a foothold has a direct incentive to keep the health check passing: a failing liveness probe gets the container restarted, destroying the foothold, and a failing readiness probe pulls it out of service, drawing operator attention. Staying quietly healthy is the outcome that best serves an attacker who wants to persist undetected — which makes health-check evidence actively misleading as a stand-in for security evidence, not merely insufficient.",
    "What actually validates security posture is a different set of controls entirely, answering different questions at different points in a container's lifecycle: image scanning before deployment (what vulnerabilities and misconfigurations does this image carry), admission-control policy at deploy time (does this pod's configuration meet a defined security baseline before the orchestrator will schedule it), runtime security monitoring after deployment (is this running container's behavior consistent with what it should be doing), and periodic configuration audits on an ongoing cadence (does the deployed configuration still match the intended baseline, and has it drifted). This guide covers each of those specifically, and why they form a different control category from health checks rather than a stricter version of the same idea.",
  ],
  whatYouWillLearn: [
    "Exactly what a Kubernetes liveness, readiness, and startup probe check, and — per Kubernetes' own documentation — exactly what each one does not check.",
    "A concrete list of the specific insecure states a container can be in while every configured health check continues to pass.",
    "Why an adversary who has compromised a running container is incentivized to keep its health checks passing, not to break them.",
    "The four control categories that actually validate container security posture — image scanning, admission-control policy, runtime security monitoring, and periodic configuration audits — and why each answers a genuinely different question than a health check does, rather than a stricter version of the same question.",
  ],
  intendedAudience: [
    "Platform engineers who use pod status, restart counts, and probe results as their day-to-day signal for whether a workload needs attention, and who need a precise account of what that signal does and does not cover.",
    "Security engineers reviewing container deployments who need language to explain, in a review record, why \"the health check has been green for weeks\" does not satisfy a control-validation requirement.",
  ],
  prerequisites: [
    "Basic familiarity with container orchestration — what a liveness or readiness probe is configured to do, and what a restart policy governs — in either Docker or Kubernetes.",
    "No lab environment is required to follow this guide; it is conceptual and uses a fictional scenario throughout, though the review procedure below is meant to be applied to a real deployment under review.",
  ],
  problem: [
    "Health status is the easiest signal in a container deployment to lean on because it is cheap, continuous, and already automated: the orchestrator computes it constantly and surfaces it in the same dashboard operators already watch for every other purpose. That makes it tempting to treat \"healthy\" as a general-purpose positive signal — including, implicitly, as evidence that a workload is safe to leave unreviewed. It was never designed to carry that meaning. A liveness probe was designed to answer \"should this specific process be restarted,\" and a readiness probe was designed to answer \"should traffic be routed here right now.\" Both are legitimate, narrow, operational questions. Neither is a security question, and treating a passing answer to either as if it were one leaves the actual security questions — is this container's privilege level appropriate, is its image free of known exploitable vulnerabilities, is its runtime behavior consistent with its intended function — unexamined.",
  ],
  threatModel: [
    "Assets: a fictional lab workload, `ledger-api`, deployed with a liveness probe configured against `GET /healthz` and a readiness probe against `GET /ready`; the container's process privilege level, filesystem write permissions, kernel-capability set, and installed dependency versions, none of which either probe examines.",
    "Central trust decision: whether an operator or reviewer treats a passing probe result and a `Running`/`Ready` pod status as sufficient evidence that the workload requires no further security review. Nothing about the probe mechanism itself makes that treatment reasonable — the decision to rely on it is made by the human or process consuming the status, not by the orchestrator.",
    "Representative scenario: a fictional small platform team at Northlake Labs runs `ledger-api` in a container built from a base image with an outdated logging library carrying a known, publicly disclosed vulnerability; the container runs as UID 0 (root) inside its namespace, its root filesystem is writable, and it retains the default Docker capability set rather than a reduced one. `/healthz` and `/ready` were written to check only that the process has started and that its internal request queue is not blocked — neither route touches the vulnerable library, the process's privilege level, or the filesystem's write permissions, so both continue to return success regardless of any of those conditions. An adversary who exploits the logging library to gain code execution inside the container gains it at root, with a writable filesystem and an unrestricted capability set to work with — and has every reason to leave `/healthz` and `/ready` exactly as they were: a failing liveness probe triggers a restart that destroys the adversary's foothold, and a failing readiness probe pulls the pod out of service and draws operator attention neither outcome benefits an adversary trying to persist quietly. The probes keep passing throughout, because nothing about the compromise touches what they check.",
    "Out of scope: how the adversary obtained the initial vulnerable dependency in this scenario (a supply-chain and dependency-management question covered by other CI/CD-supply-chain-security content in this catalog); the specifics of any one image-scanning, admission-control, or runtime-monitoring product; and host-level or node-OS hardening, which is a related but separate concern from the container-configuration and image questions this guide focuses on.",
  ],
  mainContent: [
    "**What a health check actually verifies.** Kubernetes documents three probe types, each answering a distinct operational question and none of them a security question. A startup probe verifies only \"whether the application within a container is started,\" and stops running once that succeeds. A liveness probe \"could catch a deadlock, where an application is running, but unable to make progress\" — it verifies the process hasn't wedged, nothing more. A readiness probe determines \"when a container is ready to accept traffic,\" governing whether the pod stays in a Service's routable endpoint set. Docker's own restart-policy mechanism and a Kubernetes pod's `Running` status are cut from the same cloth: both report that a process is executing, not what that process is doing, running as, or exposed to. None of these mechanisms inspects the process's user ID, the filesystem's write permissions, the container's Linux capability set, the installed package versions inside the image, or the process's actual runtime behavior beyond whatever narrow endpoint or command the probe was configured to hit.",
    "**Five concrete ways a container stays \"healthy\" while insecure.** First, running as root: a process with UID 0 inside the container has materially more capability to abuse a subsequent flaw — including one that reaches the host — than one running unprivileged, and no probe checks the effective UID a process is running as. Second, an exploitable dependency: a known, disclosed vulnerability in an installed library or base-image package has no effect on whether a health endpoint returns 200 OK, since the two are unrelated code paths unless the vulnerable function happens to be the one the probe calls. Third, a writable root filesystem: nothing about probe success depends on whether the container's own filesystem can be modified at runtime, which matters directly to how much an intruder can persist or tamper once inside. Fourth, excess Linux capabilities: a container holding capabilities like `CAP_SYS_ADMIN` that its actual function never uses is a wider blast radius sitting unused, and a probe has no visibility into the capability set at all. Fifth, and most direct: a container can be actively compromised — an adversary already has code execution inside it — while every configured probe continues to pass, because compromise and probe success are simply checking different things.",
    "**Why an attacker has an incentive to keep the health check green, not break it.** This is a reasoning point about attacker incentives, not a claim drawn from a cited source: once an adversary has a foothold inside a container, a failing liveness probe results in that container being restarted, which destroys the foothold and forces the adversary to start over; a failing readiness probe pulls the pod from service, which draws operator attention exactly when the adversary least wants it. An adversary trying to persist quietly is therefore better served by leaving the health-check machinery undisturbed than by breaking it — which is precisely why treating continued probe success as reassurance is backwards. A probe that has been green for weeks tells you a process kept responding for weeks; it does not tell you whether that process spent those weeks doing only what it was supposed to.",
    "**Image scanning — the pre-deployment question.** Image scanning asks a question a probe never asks at all: what does this image actually contain, before it ever runs. The OWASP Docker Security Cheat Sheet states that \"container scanning tools are especially important as part of a successful security strategy\" because \"they can detect known vulnerabilities, secrets and misconfigurations in container images,\" and its Kubernetes counterpart describes the same discipline at the build phase: an image \"should be scanned for security vulnerabilities\" and only pushed to a registry \"if no issues are found.\" NIST SP 800-190 frames this as part of a broader image-assurance discipline spanning the full image life cycle, including CI/CD-integrated scanning that catches known vulnerabilities and misconfigurations before an image is ever deployed — a pre-deployment gate a running-container probe structurally cannot provide, since by the time a probe exists to check, the image has already been built and deployed.",
    "**Admission-control policy — the deploy-time gate.** This is the control category that most directly answers the questions this guide's threat-model scenario raises: should a pod configured to run as root, with a writable root filesystem, and with an unrestricted capability set be allowed to start at all. Kubernetes' Pod Security Standards define graduated policy levels — Privileged, Baseline, and Restricted — that are, per Kubernetes' own documentation, \"cumulative\" and range \"from highly-permissive to highly-restrictive\"; the Baseline level alone already disallows privileged containers, restricts the capability set to a safe allow-list, and forbids arbitrary host-path mounts. These standards are enforced through the Pod Security Admission Controller, and OWASP's Kubernetes Security Cheat Sheet describes exactly this pairing: \"Pod Security Standards combined with the Pod Security Admission Controller allow cluster administrators to enforce requirements on a pod's `securityContext` fields.\" Where a cluster needs policy beyond what the built-in admission controller covers, a policy engine like OPA Gatekeeper — a validating and mutating admission webhook that enforces custom policy at the same deploy-time gate — extends the same mechanism to organization-specific rules. The NSA/CISA Kubernetes Hardening Guidance likewise recommends running an image scanner as an admission controller so that vulnerable or misconfigured pods are rejected before they are scheduled at all, and calls out `readOnlyRootFileSystem` specifically as a setting that limits a container's ability to be tampered with at runtime. Every one of these checks runs before a container starts and blocks it from starting if it fails — the opposite of a health probe, which only ever evaluates a container that is already running.",
    "**Runtime security monitoring — the continuous behavioral question.** Once a container is running, image scanning and admission control have already had their say; what's needed next is a control that watches actual behavior, not configuration, on an ongoing basis. NIST SP 800-190 treats runtime and behavioral monitoring of deployed containers as a distinct countermeasure category from pre-deployment image assurance, aimed at detecting anomalous process activity, unexpected network connections, or file-system modification inside a running container that a static image scan or a deploy-time policy check could never have caught, because the anomaly only exists once the container is executing under real conditions. This is the control category structurally closest to a health probe in that both operate continuously against a running container — and the distinction matters precisely because of that closeness: a health probe evaluates one narrow, developer-defined signal (does this endpoint respond, has this process deadlocked), while runtime security monitoring evaluates the container's actual observed behavior against what a container of its kind should be doing, which is a fundamentally broader and differently sourced signal.",
    "**Periodic configuration audits — the drift question.** A container that passed admission control and started clean does not necessarily stay that way: configuration drifts, exceptions accumulate, and a setting approved for one workload gets silently copied into another that shouldn't have inherited it. The CIS Docker and Kubernetes Benchmarks exist to be run repeatedly against a live environment, not once at build time, checking the deployed configuration — non-root execution, capability restrictions, filesystem permissions, and dozens of other settings — against a maintained baseline on an ongoing cadence. This is the control category that catches the gap a one-time admission-control pass cannot: a pod that was compliant when it was created but whose live configuration has since diverged from policy, whether through a manual override, a stale manifest, or a since-tightened baseline the workload was never re-checked against.",
    "**Why these are a different control category, not a stricter health check.** Each of the four controls above differs from a health probe along every axis that matters: the question asked (what does this image contain / should this configuration be allowed to start / is this running container's behavior normal / does the live configuration still match policy — versus a probe's \"is this specific process still responding\"), the point in the lifecycle it runs at (pre-deployment, deploy-time, continuously post-deployment, and periodically thereafter, versus a probe's continuous-but-post-deployment-only window), and the consequence of failure (block the build, block the deploy, alert and investigate, or flag for remediation — versus a probe's restart or service-removal, which fixes nothing about an underlying security condition and can, as this guide's threat model shows, actively help an adversary go undetected by never firing at all). A probe cannot be tuned into a security control by adding more checks to it; it is answering a different question by design, and no amount of additional liveness-check sophistication changes that.",
  ],
  validationEvidence: [
    "This guide is conceptual. It was not developed against a live or lab-reproduced Kubernetes or Docker deployment, and the Northlake Labs scenario is a fictional illustrative example, not a documented test or incident. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the technical claims above are grounded in the cited Kubernetes, OWASP, NIST, CIS, and NSA/CISA sources, not in an exercise performed for this article, and the label must not be upgraded merely because the reasoning here is internally consistent.",
  ],
  limitations: [
    "This guide explains why health checks are not a security control and names the four control categories that are; it is not a step-by-step implementation walkthrough for any one of them (a specific Gatekeeper policy library, a specific scanner's rule set, a specific CIS Benchmark control run in full) — see the cited sources directly for that level of detail.",
    "It does not cover host- or node-level hardening, which is a related but separate concern from the container-configuration and image questions covered here.",
    "It does not cover how an initial vulnerable dependency enters an image in the first place; see this catalog's CI/CD-supply-chain-security content for that question.",
    "The Northlake Labs scenario is illustrative only. It does not represent a documented incident, a specific product's behavior, or a completed test.",
  ],
  defensiveRecommendations: [
    "Never record a passing health check, a `Running` pod status, or a clean restart count as evidence of security posture in a review — note explicitly what it does and does not cover instead.",
    "Require image scanning before an image reaches a registry a deployment can pull from, and treat unresolved known-vulnerability findings as a release blocker, not a follow-up item.",
    "Enforce a Pod Security Standard (at minimum Baseline) through the Pod Security Admission Controller, or an equivalent policy engine such as OPA Gatekeeper, so root execution, writable root filesystems, and unrestricted capability sets are rejected at deploy time rather than discovered later.",
    "Deploy runtime security monitoring for behavior a static scan and a deploy-time policy check cannot see — anomalous process activity, unexpected network connections, or filesystem modification inside a container that is already running.",
    "Run configuration audits against a maintained baseline (such as the CIS Docker or Kubernetes Benchmark) on a recurring cadence, not only at initial deployment, so configuration drift and inherited exceptions get caught.",
    "When writing or reviewing a liveness or readiness probe, keep its scope narrow and documented — what it checks and what it deliberately does not — so nobody downstream mistakes its continued success for a broader guarantee it was never designed to make.",
  ],
  keyTakeaways: [
    "A liveness probe, a readiness probe, and a `Running` pod status each answer a narrow operational question about whether a process is responding — none of them examines privilege level, filesystem permissions, capability set, installed dependency versions, or runtime behavior.",
    "A container can be reported healthy while running as root, with an exploitable dependency, with a writable root filesystem, with excess Linux capabilities, or while actively compromised — none of those conditions affects whether a health endpoint returns success.",
    "An adversary with a foothold inside a compromised container is incentivized to keep its health checks passing, since a failing probe triggers a restart or service removal that either destroys the foothold or draws attention — which makes sustained probe success an actively misleading signal to lean on, not merely an insufficient one.",
    "Image scanning, admission-control policy (Pod Security Standards and policy engines like OPA Gatekeeper), runtime security monitoring, and periodic configuration audits are four distinct controls answering four distinct questions at four distinct points in a container's lifecycle — not a stricter version of a health check.",
    "None of those four controls can be replaced by adding more sophistication to a liveness or readiness probe; each is structurally answering a different question than a probe is designed to ask.",
  ],
  references: [
    "Kubernetes documentation — Liveness, Readiness, and Startup Probes (what each probe type checks and does not check): https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/",
    "Kubernetes documentation — Pod Lifecycle, container probes overview: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/",
    "Kubernetes documentation — Pod Security Standards (Privileged, Baseline, Restricted policy levels): https://kubernetes.io/docs/concepts/security/pod-security-standards/",
    "OWASP Docker Security Cheat Sheet (Rule #9, image scanning; Rule #2, non-root execution; Rule #3, capability restriction; Rule #8, read-only root filesystem): https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html",
    "OWASP Kubernetes Security Cheat Sheet (Build Phase image scanning; Deploy Phase Pod Security Standards and Admission Controller): https://cheatsheetseries.owasp.org/cheatsheets/Kubernetes_Security_Cheat_Sheet.html",
    "NIST SP 800-190, Application Container Security Guide (image assurance and life-cycle scanning; runtime and behavioral monitoring as a distinct countermeasure category): https://csrc.nist.gov/pubs/sp/800/190/final",
    "CIS Docker Benchmark: https://www.cisecurity.org/benchmark/docker",
    "CIS Kubernetes Benchmark: https://www.cisecurity.org/benchmark/kubernetes",
    // media.defense.gov (DoD's own CDN) blocks automated fetches (HTTP
    // 403) regardless of the document's own liveness — confirmed live via
    // WebFetch. Cited via CISA's own announcement page for the same
    // guidance instead of the bot-blocked direct PDF URL, matching the
    // pattern already established for the same class of issue in
    // workload-identities-vs-long-lived-credentials.ts and
    // cloud-iam-permission-creep.ts.
    "NSA/CISA Kubernetes Hardening Guidance (admission-controller image scanning; readOnlyRootFileSystem; non-root execution), announced: https://www.cisa.gov/news-events/alerts/2022/03/15/updated-kubernetes-hardening-guide",
    "OPA Gatekeeper documentation (validating/mutating admission-control policy engine for Kubernetes): https://open-policy-agent.github.io/gatekeeper/website/docs/",
  ],
  relatedSlugs: [
    "logs-are-not-proof-verifying-automated-actions",
    "docker-sock-mounting-security-risks",
    "input-validation-not-complete-control",
  ],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "Visibility into how the workload's existing liveness, readiness, and startup probes are configured — what endpoint or command each one checks, and what it does not.",
    "Visibility into the workload's actual deployed configuration: process privilege level, root-filesystem write permissions, Linux capability set, and installed image contents.",
    "Authority to review or change deploy-time admission policy for the cluster or namespace under review, since adding a Pod Security Standard or policy-engine rule is a platform decision, not a per-workload flag.",
    "Access to whatever image-scanning, runtime-monitoring, and configuration-audit tooling the organization already has, or authority to evaluate adopting one where a category is missing entirely.",
  ],
  procedure: [
    "For the workload under review, write down exactly what each configured probe checks — the literal endpoint, command, or port — and confirm it does not incidentally also validate anything about privilege level, filesystem permissions, capabilities, or dependency versions.",
    "Separately, determine the workload's actual security configuration: is it running as root or a scoped user, is its root filesystem writable, what Linux capabilities does it hold beyond the defaults it actually needs, and what known vulnerabilities exist in its installed dependencies.",
    "Confirm image scanning runs before the image reaches a registry a deployment can pull from, and that unresolved known-vulnerability findings are treated as a release blocker rather than a follow-up note.",
    "Confirm a Pod Security Standard (Baseline at minimum) or an equivalent policy-engine rule set is enforced through the cluster's admission controller, and that it would actually reject the specific misconfigurations found in step two — do not assume a policy exists just because the platform supports one.",
    "Confirm runtime security monitoring is deployed against the workload and covers behavior a static scan and admission policy cannot see — process activity, network connections, and filesystem modification during actual execution.",
    "Confirm a configuration audit against a maintained baseline (such as the CIS Docker or Kubernetes Benchmark) runs against this workload on a recurring cadence, not only once at initial deployment.",
  ],
  validation: [
    "For each of the four controls, confirm it would actually catch the specific findings from step two of the procedure above — a scanner that isn't configured to flag the vulnerable dependency, or a policy engine with an exception carved out for this exact namespace, provides no real coverage even though the control nominally exists.",
    "Confirm that none of the four controls' pass/fail state is derived from, or conflated with, the workload's health-probe results in any dashboard, report, or review record.",
    "Record any control category that could not be directly confirmed — no available runtime-monitoring tooling, no scheduled recurring audit — as an open finding rather than assuming coverage exists because a tool was mentioned in a past conversation.",
  ],
  rollback: [
    "If a newly enforced admission-control policy blocks a workload that turns out to have a legitimate reason for its current configuration, do not simply exempt the workload from the policy as the fix — document the specific exception, its owner, and its review date, so it reads as a deliberate, tracked decision rather than a silent gap in coverage.",
    "Stage new admission-control or runtime-monitoring coverage on the lowest-consequence workload first, confirm it behaves as expected through a full normal usage cycle, and only then extend it to workloads whose disruption would be costly.",
    "Keep a record of which workloads were reviewed under this procedure and when, so a later reviewer can distinguish \"this workload's security posture was actually checked\" from \"this workload has only ever been healthy.\"",
  ],
};

const diagram: FlowDiagramSpec = {
  titleId: "container-health-vs-security-diagram",
  title: "What a passing health check actually covers, and what it doesn't",
  desc: "A fictional container is shown in two modes. Normal mode: an unreviewed container whose liveness and readiness probes pass, with no separate security controls in place. Failure mode: the same container is compromised, running as root with a writable filesystem and excess capabilities — while its probes keep passing throughout, because none of the four security controls (image scanning, admission-control policy, runtime monitoring, configuration audits) are in place to catch it. Explore each node for details.",
  viewBox: "0 0 1000 320",
  failureLabel: "container compromised; health probes never stop passing",
  caption:
    "In both modes, the liveness and readiness probes report success — that never changes, because compromise, root execution, a writable filesystem, and excess capabilities are none of the things a probe checks. What differs is only whether the four security controls (image scanning, admission-control policy, runtime monitoring, configuration audits) are in place to catch what the probes structurally cannot.",
  motionDuration: 2600,
  mainPacketRoute: { d: "M180,140 C215,110 235,90 260,70 M480,70 H560", length: 170 },
  edges: [
    { id: "container-probesPass", from: "container", to: "probesPass", d: "M180,140 C215,110 235,90 260,70", length: 90, kind: "main", activeIn: ["normal", "failure"] },
    { id: "probesPass-noSecurityChecks", from: "probesPass", to: "noSecurityChecks", d: "M480,70 H560", length: 80, kind: "main", activeIn: ["normal"] },
    { id: "container-compromised", from: "container", to: "compromised", d: "M180,170 C215,200 235,220 260,240", length: 90, kind: "failure", activeIn: ["failure"] },
    { id: "compromised-undetected", from: "compromised", to: "undetected", d: "M480,240 H560", length: 80, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "container",
      label: "Fictional container (\"ledger-api\") with a liveness and readiness probe configured",
      x: 10,
      y: 105,
      w: 170,
      h: 90,
      activeIn: ["normal", "failure"],
      description:
        "The same fictional container in both views. What differs between the normal and failure modes is not the probes themselves — they behave identically in both — but whether the container is actually secure, and whether any control besides the probes exists to notice either way.",
    },
    {
      id: "probesPass",
      label: "Liveness + readiness probes pass (process responds normally)",
      x: 260,
      y: 25,
      w: 220,
      h: 90,
      activeIn: ["normal", "failure"],
      role: "boundary",
      focusableLabel: "Health probes pass in both modes — they check only that the process is responding, not whether it is secure",
      description:
        "Identical outcome in both modes: the configured probe endpoints return success. Per Kubernetes' own documentation, a liveness probe only checks for a deadlocked process and a readiness probe only checks whether the container should receive traffic — neither examines privilege level, filesystem permissions, capabilities, or compromise.",
    },
    {
      id: "noSecurityChecks",
      label: "No security controls reviewed — probe success treated as sufficient",
      x: 560,
      y: 25,
      w: 260,
      h: 90,
      activeIn: ["normal"],
      role: "safe",
      description:
        "In the normal mode, the container happens to have no active compromise or misconfiguration — but nothing in this diagram's normal path actually confirmed that, because no image scan, admission policy, runtime monitor, or configuration audit is shown running. The safe outcome here is coincidental, not verified.",
    },
    {
      id: "compromised",
      label: "Root execution, writable filesystem, excess capabilities, active compromise",
      x: 260,
      y: 195,
      w: 220,
      h: 90,
      activeIn: ["failure"],
      role: "boundary",
      focusableLabel: "The container is compromised and misconfigured — root, writable filesystem, excess capabilities — while its probes keep passing",
      description:
        "None of these conditions — root execution, a writable root filesystem, an unrestricted capability set, or an adversary's active code execution inside the container — has any effect on the probe endpoints checked in the node above. That is exactly why they coexist with passing probes in this failure mode.",
    },
    {
      id: "undetected",
      label: "Compromise persists undetected — adversary keeps the probes green",
      x: 560,
      y: 195,
      w: 260,
      h: 90,
      activeIn: ["failure"],
      role: "blocked",
      focusableLabel: "The compromise persists undetected because the adversary has an incentive to keep the health checks passing, and no other control is in place to notice",
      description:
        "An adversary with a foothold has a direct incentive to leave the probes untouched: a failing liveness probe triggers a restart that destroys the foothold, and a failing readiness probe pulls the pod from service and draws attention. Without image scanning, admission-control policy, runtime monitoring, or a configuration audit in place, nothing else exists to catch what the probes were never designed to check.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Why Container Health Is Not Security Validation",
    slug: "container-health-not-security-validation",
    summary:
      "A liveness probe, a readiness probe, and a `Running` pod status only prove a container's process is alive and responding — not that it is running securely. A container can be reported healthy while running as root, with an exploitable dependency, a writable root filesystem, excess Linux capabilities, or active compromise, and an adversary who wants to persist undetected has every incentive to keep the health check passing. What actually validates security posture is a different control category entirely: image scanning, admission-control policy, runtime security monitoring, and periodic configuration audits.",
    pillar: "build-securely",
    primaryCategory: "container-kubernetes-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["docker", "kubernetes", "security-control-validation", "vulnerability-management"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
    publishedAt: "2026-09-04",
    lastReviewedAt: "2026-09-04",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
  },
  sections,
  module: module_,
  diagram,
};
