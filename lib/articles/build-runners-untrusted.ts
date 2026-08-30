// Knowledge-base article: "Why Build Runners Should Be Treated as
// Untrusted" (Bead securitycorp-source-4zl.54.2.2). Not added to
// lib/knowledge-content.ts yet — status stays "drafting" and every review
// record stays "pending" until the human owner (Ravi) runs privacy,
// technical, and publication review per docs/publication-safety-policy.md.
// Do not treat this file as published content.
//
// Differentiation from the other two CI/CD-adjacent articles in this
// category: lib/articles/threat-modeling-cicd-pipeline.ts teaches a general
// trust-boundary threat-modeling method across the whole pipeline (commit
// through deployment), and lib/articles/protecting-main-branch-beyond-pr-approval.ts
// hardens one specific boundary — the merge gate into a protected main
// branch. Neither one focuses on the build runner's own blast radius. This
// article is narrower still: it is specifically about why the ephemeral
// execution environment that actually runs build and install scripts must
// itself be treated as untrusted — because it combines arbitrary code
// execution, network egress, and short-lived publish credentials in one
// place — and about which controls (isolation, ephemerality, least
// privilege) actually limit that blast radius when a dependency turns out
// to be malicious.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const diagram: FlowDiagramSpec = {
  titleId: "build-runner-blast-radius-diagram",
  title: "Blast radius of a compromised build runner",
  desc: "Source checkout feeds dependency install, which feeds the build runner, which produces an artifact. Interactive: switch between the normal flow, where a properly scoped, ephemeral runner executes the job and is destroyed afterward, and a failure mode showing a malicious dependency's install script trying to use the runner's own secrets and network access to exfiltrate data or persist beyond the job — and explore each node's role in containing that.",
  viewBox: "0 0 1000 300",
  failureLabel: "Runner compromise",
  caption:
    "Fictional build job: source checkout → dependency install → build runner → artifact output. In the failure mode, a malicious dependency's install script runs inside the build runner and attempts to exfiltrate data or persist beyond the job; scoped network egress and the runner's ephemeral, credential-free-afterward lifecycle are what actually limit how far that gets, not luck.",
  motionDuration: 2600,
  mainPacketRoute: {
    d: "M160,90 H190 M370,90 H430 M620,90 H650",
    length: 120,
  },
  edges: [
    { id: "checkout-install", from: "source-checkout", to: "dependency-install", d: "M160,90 H190", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "install-runner", from: "dependency-install", to: "build-runner", d: "M370,90 H430", length: 60, kind: "main", activeIn: ["normal", "failure"] },
    { id: "malicious-install", from: "malicious-dependency", to: "dependency-install", d: "M280,210 V125", length: 85, kind: "failure", activeIn: ["failure"] },
    { id: "runner-exfil", from: "build-runner", to: "exfiltration-attempt", d: "M525,125 V210", length: 85, kind: "failure", activeIn: ["failure"] },
    { id: "runner-output", from: "build-runner", to: "artifact-output", d: "M620,90 H650", length: 30, kind: "main", activeIn: ["normal"] },
  ],
  nodes: [
    {
      id: "source-checkout",
      label: "Source checkout",
      x: 10,
      y: 60,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description:
        "The job starts by checking out the reviewed source revision it was triggered for. This step is generally the part a merge gate already covers. What happens immediately afterward — installing whatever the checked-out project declares as its dependencies — is the step this diagram is actually about.",
    },
    {
      id: "dependency-install",
      label: "Dependency install",
      x: 190,
      y: 55,
      w: 180,
      h: 70,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Dependency install — first blast-radius boundary: third-party install and build scripts execute here with the runner's own permissions",
      description:
        "The point where the job first executes code the team did not write and, in most package ecosystems, did not individually review: installing a dependency routinely runs that package's own install, build, or postinstall scripts. A build script is not reviewed the way application code is — the job accepts it as a routine, trusted step, which is exactly why it is a boundary worth naming rather than an implementation detail.",
    },
    {
      id: "malicious-dependency",
      label: "Malicious dependency",
      x: 190,
      y: 210,
      w: 180,
      h: 60,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Malicious dependency — a package whose install script runs attacker-controlled code, visible only in failure mode",
      description:
        "Failure-mode only: a dependency resolved during install turns out to run attacker-controlled code in its install or build script. A compromised maintainer account, a typosquatted or dependency-confused package name, and a previously trustworthy package that was later hijacked are all realistic routes in — this diagram treats the mechanism generically rather than pointing at any one incident. Its only path into the job is through the install step accepting and running it like any other dependency.",
    },
    {
      id: "build-runner",
      label: "Build runner",
      x: 430,
      y: 55,
      w: 190,
      h: 70,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Build runner — highest blast radius: holds this job's execution rights, network egress, and short-lived publish credentials together in one place",
      description:
        "The highest-value target in the whole job, because three things sit together in exactly one place: the ability to execute arbitrary code (that is literally its purpose), whatever network egress this job needs to reach a package registry or an internal service, and short-lived credentials minted so this job can publish its result. A malicious install script inherits all three automatically the moment it runs — it does not need a separate vulnerability to reach them, because it is already running as the build.",
    },
    {
      id: "exfiltration-attempt",
      label: "Exfiltration attempt",
      x: 430,
      y: 210,
      w: 190,
      h: 60,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Exfiltration attempt — blocked or limited only when egress is scoped and the runner and its credentials do not survive past this job",
      description:
        "Failure-mode only: the malicious install script tries to use the runner's own network egress and credentials to send data out or to establish a foothold that outlives the job. Two separate properties decide whether that goes anywhere: whether egress is scoped to only what this job legitimately needs, so an attacker-chosen destination is simply unreachable, and whether the runner and its credentials are destroyed the moment the job ends, so there is no later moment for a stolen credential to be used in. Neither is automatic — both have to be deliberately configured, and this diagram's point is that this node's outcome depends entirely on that configuration, not on the attacker's skill.",
    },
    {
      id: "artifact-output",
      label: "Artifact output",
      x: 650,
      y: 60,
      w: 160,
      h: 60,
      role: "safe",
      activeIn: ["normal"],
      description:
        "What a properly scoped job produces: a build artifact and, where the pipeline supports it, verifiable provenance of the job that produced it. In the normal path this is the whole story — checkout, install, build, publish. This node is not part of the failure-mode story on purpose: the point of ephemerality and credential scoping is to contain a compromised job's blast radius to that one job, not to guarantee the job silently fails to produce output. A job that ran a malicious script still needs its output treated as suspect and investigated, separately from whether the exfiltration or persistence attempt itself succeeded.",
    },
  ],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "Enough visibility into the pipeline's runner configuration to answer concrete questions: what credentials does a job receive, how long do they live, what network destinations can a job reach, and does the runner environment get reused across jobs.",
    "Authority, or a documented path to someone with authority, to change runner provisioning, credential scoping, or egress configuration — this guide describes what a defensible configuration contains, not how to request the access to change it.",
    "A working definition of what a compromised job could reach today: which secrets, which internal services, which publish targets — treat 'we don't know' as a finding to record, not a reason to skip the exercise.",
    "Willingness to treat every dependency, including ones the team has used for years without incident, as code that will execute with the runner's own privileges — this guide is about the runner's blast radius, not about how to decide which specific dependencies are trustworthy.",
  ],
  procedure: [
    "Inventory what the build runner can reach today: which secrets are injected into every job versus only jobs that need them, what network egress is permitted, and whether the runner environment or its filesystem persists across jobs. Write this down even if the answer is 'more than we expected' — that is the finding, not a reason to stop.",
    "Move from standing, long-lived credentials toward short-lived credentials minted per job and scoped to exactly what that job's publish step needs. A credential that is valid for the lifetime of one job and authorized for one destination is a materially smaller target than one that is valid indefinitely and authorized broadly.",
    "Scope network egress to what dependency installation and publishing actually require, rather than leaving the runner able to reach arbitrary destinations. An install script attempting to exfiltrate data has nowhere useful to send it if the runner cannot reach outside a narrow, deliberate allowlist.",
    "Prefer ephemeral, single-use runner environments — a fresh environment provisioned per job and destroyed afterward — over long-lived runners that persist state, caches, or credentials between unrelated jobs. Ephemerality does not stop a malicious script from running; it stops whatever that script planted from surviving to affect the next job.",
    "Isolate concurrent or sequential jobs from each other, especially on self-managed runner infrastructure where multiple jobs might otherwise share a host, a filesystem, or a network namespace. A compromise that stays contained to one job's own environment is a materially smaller incident than one that can reach a neighboring job.",
    "Treat the runner's own configuration (what credentials it receives, what it can reach, how long it lives) as something that needs review and change control, the same as any other security-relevant configuration — not as an operational detail owned entirely by whoever set up the pipeline originally.",
    "Where the runner environment produces build provenance (a record of what was built, from what source, by which runner), treat that as a separate control from the runner's own isolation — provenance tells a downstream consumer what happened, it does not by itself limit what a compromised job could do while it was happening.",
  ],
  validation: [
    "Confirm what credentials a job actually receives by inspecting the job's own environment, not by reading the pipeline configuration's stated intent — a scoping rule that isn't enforced at runtime provides no more assurance than not having it.",
    "Confirm credential lifetime: attempt, in a lab or non-production environment, to use a job's credential after that job has completed, and confirm it is rejected rather than still valid.",
    "Confirm network egress is actually restricted by attempting, from within a job in a lab environment, to reach a destination outside the intended allowlist, and confirm the attempt fails rather than merely being unmonitored.",
    "Confirm the runner environment does not persist state between jobs: run two unrelated jobs in sequence and confirm the second cannot read anything the first left behind (files, environment variables, cached credentials).",
    "Where a control could not be tested directly (no lab environment, no authorized way to force a failure), record that explicitly as UNVERIFIED rather than assuming the control holds because a configuration screen describes it that way.",
  ],
  rollback: [
    "If tightening egress or credential scope breaks a legitimate build step (a dependency that genuinely needs to reach an additional destination, a publish step that needs a broader credential than assumed), do not quietly widen the rule back to its previous scope — add the specific, narrow exception the workflow needs and record why, so the exception is a deliberate decision rather than a silent regression.",
    "If moving to ephemeral, single-use runners increases build time or cost in a way that changes the team's calculus, treat that as a tradeoff to make explicitly and document, not a reason to revert to long-lived runners without discussing the isolation this guide is about.",
    "Keep a record of any period during which a runner ran with broader access than the target configuration (a migration in progress, a temporary exception), so a later reviewer can distinguish 'this was never scoped' from 'this was temporarily broader for a documented reason and then narrowed.'",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Why Build Runners Should Be Treated as Untrusted",
    slug: "build-runners-untrusted",
    summary:
      "The ephemeral environment that actually runs build and install scripts combines code execution, network egress, and short-lived credentials in one place — why that makes it the pipeline's highest-value target, and what isolation, ephemerality, and least-privilege controls actually limit the resulting blast radius.",
    pillar: "build-securely",
    primaryCategory: "cicd-supply-chain-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["ci-cd-pipelines", "supply-chain-security", "secrets-management", "least-privilege"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
    publishedAt: "2026-08-30",
    lastReviewedAt: "2026-08-30",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Codex", reviewedAt: "2026-08-30" },
    technicalReview: { status: "approved", reviewer: "Codex", reviewedAt: "2026-08-30" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-30" },
  },
  sections: {
    executiveSummary: [
      "A build runner is not a neutral piece of infrastructure that happens to sit between source control and a published artifact — it is a code-execution environment that routinely runs software the team did not write, holds credentials scoped to publish the job's result, and typically has whatever network reach the job needs to fetch dependencies. Those three properties together — execution, secrets, and egress, in one place — are exactly what makes a runner worth compromising, and exactly why it should be treated as untrusted infrastructure rather than as a trusted extension of the team's own workstation.",
      "This guide is deliberately narrow: it is not a general pipeline threat model (see 'Threat Modeling a CI/CD Pipeline' for that) and it is not about the merge gate that decides what reaches the runner in the first place (see 'Protecting the Main Branch Beyond Pull-Request Approval' for that). It is specifically about the runner itself — why its blast radius is larger than most teams have inventoried, and which controls (isolation, ephemerality, least privilege) actually shrink that blast radius when a dependency turns out to be malicious. The example pipeline and every identifier in it are fictional; no real repository, credentials, or production infrastructure is described.",
    ],
    whatYouWillLearn: [
      "Why a build runner combines execution rights, network egress, and short-lived credentials in a way that makes it the pipeline's highest-value target, independent of how well any other stage is secured.",
      "How a routine step — installing a project's declared dependencies — becomes the point where the runner first executes code the team did not review.",
      "The practical difference between a runner that merely ran successfully and a runner whose access was actually scoped to what the job needed.",
      "Which controls (ephemeral single-use environments, scoped and short-lived credentials, restricted network egress, per-job isolation) limit a compromised runner's blast radius, and why each one addresses a different part of the problem rather than the same one twice.",
    ],
    intendedAudience: [
      "Developers who want to understand what actually has access when their pipeline's build step runs, beyond 'it built successfully.'",
      "DevOps practitioners responsible for provisioning, configuring, or maintaining build-runner infrastructure.",
      "Security engineers assessing whether a pipeline's build stage is a contained, disposable environment or a standing, trusted one.",
    ],
    prerequisites: [
      "Basic familiarity with how a build job works: a runner checks out source, installs declared dependencies, runs build steps, and typically publishes a result.",
      "No specific runner platform or package-ecosystem expertise is assumed; this guide describes the pattern generically and uses a fictional example for illustration.",
      "Awareness that most package ecosystems support some form of install-time or build-time scripting is useful background, though this guide explains the relevant mechanism rather than assuming prior familiarity with it.",
    ],
    problem: [
      "It is easy to reason about a build runner the way you'd reason about a compiler on your own laptop — a tool that turns source into output, and nothing more. That framing misses what the runner actually is in most modern pipelines: an environment that executes arbitrary code from every dependency the project declares (via install, build, or postinstall scripts that most ecosystems support), that has network egress to reach a package registry or other services the job needs, and that holds credentials — often short-lived, but sometimes not — scoped to publish the job's result somewhere that matters.",
      "None of that requires a sophisticated attacker to exercise. A single compromised or dependency-confused package pulled in during a routine, unremarkable-looking build is enough, because the malicious code does not need to find a separate way in — it simply runs as the build, with whatever access the build already has. The question worth asking about any runner is not 'did the build succeed,' but 'what could this job have reached, and would we know if it had.'",
    ],
    threatModel: [
      "Assets: the runner's execution environment itself, the credentials issued to it for this job, whatever network destinations it can reach, and — if the runner environment is reused — anything a prior job may have left behind for a later one to find.",
      "The central trust decision: a build runner is granted execution, network, and credential access sufficient to complete a legitimate job, and that access is available to anything that executes during the job — including code from a dependency nobody on the team wrote or individually reviewed.",
      "Representative threats: a compromised or dependency-confused package's install script runs with the runner's own permissions during a routine install step. A runner with standing (not job-scoped, not short-lived) publish credentials turns a single compromised job into access that outlives that job. A runner with broad, unscoped network egress gives a malicious script somewhere to send data even when nothing else about the job looks unusual. A runner environment reused across jobs lets one compromised job leave something (a cached file, a leftover credential, a modified tool) for the next, unrelated job to inherit.",
      "The interactive diagram accompanying this article shows the failure case concretely: a malicious dependency's install script runs inside the build runner and attempts to use the runner's own network access and credentials to exfiltrate data or persist beyond the job. Whether that attempt goes anywhere depends on two properties configured in advance — whether egress is scoped to only what the job needs, and whether the runner and its credentials are destroyed the moment the job ends — not on whether the attempt itself was detected in the moment.",
    ],
    mainContent: [
      "Start from where trust actually gets extended. Source control and a merge gate can do a thorough job of deciding which commits are eligible to trigger a build, and none of that protects against a dependency the project itself declares. The moment a job runs its dependency-install step, it is very likely executing code from every package in that dependency tree, because most package ecosystems support some form of script that runs automatically at install or build time. That code runs with the same permissions as the rest of the job — there is no separate, lower-trust execution context for it by default. Treating dependency installation as a routine, non-security-relevant step is the first assumption worth dropping.",
      "Once you accept that the runner will, as a matter of course, execute code the team did not review, the next question is what that code can reach. This is where the runner's combination of properties matters more than any single one alone: network egress lets it reach somewhere; credentials give it something worth taking or using; and persistence, if the environment isn't torn down afterward, gives whatever it planted a chance to matter beyond this one job. A runner that is generous on all three fronts turns 'a dependency's install script ran' into 'a dependency's install script could have exfiltrated data, abused a publish credential, and left something behind for the next job' — three separate, addressable gaps rather than one.",
      "Least-privilege credentialing addresses the second of those directly. A runner that receives a credential minted specifically for this job, scoped to exactly the publish action this job needs to perform, and valid only for the job's duration, gives a compromised install script very little to work with even if it finds the credential. Compare that to a runner configured with a standing credential valid indefinitely and authorized for more than any single job actually requires — the difference is not whether a compromise can happen, but how much it's worth once it does.",
      "Restricting network egress addresses the exfiltration and command-and-control angle specifically. A build job legitimately needs to reach a small, known set of destinations: a package registry, perhaps an internal artifact store, perhaps a small number of other services the build genuinely depends on. A runner that can reach arbitrary destinations gives a malicious script somewhere to send data regardless of what else is configured correctly. Scoping egress to a deliberate allowlist does not require predicting every possible attack — it only requires being honest about what the legitimate job actually needs to reach, which is usually a much shorter list than 'the internet.'",
      "Ephemerality — provisioning a fresh runner environment per job and destroying it afterward — addresses persistence directly, and it is the control most likely to be skipped for convenience, because reusing a warm environment is often faster and cheaper than provisioning a fresh one each time. The tradeoff is real: a persistent runner is a persistent target. Anything a compromised job manages to plant — a modified tool, a cached credential, a background process — survives into the next job's environment on a reused runner and simply disappears on an ephemeral one, whether or not the compromise was ever detected. Ephemerality does not prevent a malicious script from running once; it prevents whatever it planted from mattering a second time.",
      "Isolation between concurrent jobs is the piece that matters most on self-managed runner infrastructure, where multiple jobs might otherwise share a host, a filesystem, or a network namespace unless the runner platform explicitly separates them. Two unrelated jobs running at the same time should not be able to observe or interfere with each other's environment; a build runner is, in effect, executing untrusted code on behalf of every job it accepts, and the isolation between those jobs is what keeps one compromise from becoming several.",
      "Put together, these controls are complementary, not redundant: scoped, short-lived credentials limit what a compromised job's access is worth; restricted egress limits where it can send anything or reach out to; ephemerality limits how long anything it plants can survive; and per-job isolation limits how far a single compromise spreads to other jobs running around it. None of them prevents the malicious script from running in the first place — that is a dependency-integrity problem, addressed by different controls entirely — but together they are what determines whether a single compromised dependency stays a contained, recoverable event or becomes something considerably larger.",
    ],
    validationEvidence: [
      "This article describes a pattern and a fictional illustrative build job; it does not reproduce a specific runner implementation or a completed assessment against a real pipeline. Its evidence state is UNVERIFIED, and the recommendations should be treated as a starting checklist to adapt and then verify against your own runner configuration, not as a validated result.",
    ],
    limitations: [
      "This guide addresses the build runner's own execution environment and access. It does not cover how to vet or scan a dependency before it reaches the runner, how to verify build provenance after the fact, or how to threat model the pipeline broadly — 'Threat Modeling a CI/CD Pipeline' covers that method, and this guide deliberately does not repeat it.",
      "It also does not cover the merge gate that decides which commits are eligible to trigger a build in the first place — 'Protecting the Main Branch Beyond Pull-Request Approval' covers that boundary specifically.",
      "Exact mechanisms for credential scoping, egress restriction, and ephemeral provisioning vary by runner platform and by whether infrastructure is hosted or self-managed. This guide describes the pattern generically; verify the specific mechanisms your platform offers before relying on any one of them.",
    ],
    defensiveRecommendations: [
      "Issue job-scoped, short-lived credentials for publishing build results rather than standing credentials valid beyond the job's duration.",
      "Restrict a runner's network egress to a deliberate, known allowlist of destinations the job actually needs, rather than leaving it able to reach arbitrary addresses.",
      "Prefer ephemeral, single-use runner environments provisioned fresh per job and destroyed afterward over long-lived runners that persist state between unrelated jobs.",
      "Isolate concurrent and sequential jobs from each other, particularly on self-managed runner infrastructure where multiple jobs could otherwise share a host or filesystem.",
      "Treat dependency installation as code execution, not as a passive step — because in most package ecosystems, it is.",
      "Inventory what a runner can currently reach (secrets, network destinations, persistence) before assuming its access is already appropriately scoped.",
      "Record any control that could not be directly tested as UNVERIFIED rather than assuming it holds because a configuration option is enabled.",
    ],
    keyTakeaways: [
      "A build runner combines code execution, network egress, and publish credentials in one place — that combination, not any single property, is what makes it the pipeline's highest-value target.",
      "Dependency installation is a code-execution step in most package ecosystems, not a passive one; a malicious dependency's install script runs with the runner's own access by default.",
      "Least-privilege credentials, restricted egress, ephemerality, and per-job isolation are complementary controls that each limit a different part of the blast radius — none of them prevents the malicious code from running, but together they limit what running it is worth.",
      "This is a narrower, more specific lens than a full pipeline threat model or a merge-gate hardening review — see the related articles in this category for those.",
    ],
    references: [
      "SLSA (Supply-chain Levels for Software Artifacts) — build-track requirements, including isolated and ephemeral build environments: https://slsa.dev/",
      "OWASP Top 10 CI/CD Security Risks: https://owasp.org/www-project-top-10-ci-cd-security-risks/",
      "NIST SP 800-218, Secure Software Development Framework: https://csrc.nist.gov/pubs/sp/800/218/final",
      "CISA and NSA, Defending Continuous Integration/Continuous Delivery (CI/CD) Environments: https://www.cisa.gov/resources-tools/resources/defending-continuous-integrationcontinuous-delivery-cicd-environments",
    ],
  },
  module: module_,
  diagram,
};
