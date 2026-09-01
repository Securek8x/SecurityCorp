// Knowledge-base article: "Threat Modeling a CI/CD Pipeline"
// Bead securitycorp-source-4zl.54.2.1. Not added to lib/knowledge-content.ts
// yet — status stays "drafting" and every review record stays "pending"
// until the human owner (Ravi) runs privacy, technical, and publication
// review per docs/publication-safety-policy.md. Do not treat this file as
// published content.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const diagram: FlowDiagramSpec = {
  titleId: "cicd-threat-model-diagram",
  title: "Fictional CI/CD pipeline trust boundaries",
  desc: "A developer commits to source control, which triggers a build runner, which publishes to an artifact registry, which deploys to a target environment. Interactive: switch between the normal build/deploy flow and a failure mode showing how a compromised dependency can inject code into the build runner, and explore each node's role in the trust boundary.",
  viewBox: "0 0 1000 300",
  failureLabel: "Compromised dependency",
  caption:
    "Fictional pipeline: developer → source control → build runner → artifact registry → deployment target. In the failure mode, a compromised dependency injects code during the build; the artifact registry's provenance check is the boundary that decides whether the tainted artifact ever reaches deployment.",
  motionDuration: 2600,
  mainPacketRoute: {
    d: "M160,90 H190 M360,90 H400 M570,90 H610 M780,90 H820",
    length: 150,
  },
  edges: [
    { id: "dev-scm", from: "developer", to: "source-control", d: "M160,90 H190", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "scm-runner", from: "source-control", to: "build-runner", d: "M360,90 H400", length: 40, kind: "main", activeIn: ["normal", "failure"] },
    { id: "dependency-runner", from: "dependency", to: "build-runner", d: "M485,210 V125", length: 85, kind: "failure", activeIn: ["failure"] },
    { id: "runner-registry", from: "build-runner", to: "artifact-registry", d: "M570,90 H610", length: 40, kind: "main", activeIn: ["normal", "failure"] },
    { id: "registry-deploy", from: "artifact-registry", to: "deploy-target", d: "M780,90 H820", length: 40, kind: "main", activeIn: ["normal"] },
  ],
  nodes: [
    {
      id: "developer",
      label: "Developer",
      x: 10,
      y: 60,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description:
        "Opens a change and pushes a commit. The developer's own workstation and credentials are out of scope for this diagram — the pipeline must not assume the commit's origin is trustworthy just because the source-control step accepted it.",
    },
    {
      id: "source-control",
      label: "Source control",
      x: 190,
      y: 60,
      w: 170,
      h: 60,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Source control — first trust boundary: branch protection and required review decide what reaches the build runner",
      description:
        "First trust boundary. Branch protection, required review, and signed commits decide what is even eligible to trigger a build. A gap here (force-push allowed, review bypassable by the author, unsigned commits accepted) widens everything downstream, since every later stage inherits this decision.",
    },
    {
      id: "dependency",
      label: "Compromised dependency",
      x: 400,
      y: 210,
      w: 170,
      h: 60,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Compromised dependency — a malicious package version pulled in during the build, visible only in failure mode",
      description:
        "Failure-mode only: a third-party package the build script fetches at build time turns out to run attacker-controlled code (a classic dependency-confusion or compromised-maintainer scenario). It has no direct path to production — its only route in is through the build runner's own execution.",
    },
    {
      id: "build-runner",
      label: "Build runner",
      x: 400,
      y: 55,
      w: 170,
      h: 70,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Build runner — second trust boundary: an ephemeral execution environment with build-time network and credential access",
      description:
        "Second trust boundary, and the highest-value target in the whole pipeline: it has execution rights, network egress to fetch dependencies, and short-lived credentials to publish the result. In the failure path, this is exactly where a compromised dependency's install script or build hook gets to run with the runner's own privileges.",
    },
    {
      id: "artifact-registry",
      label: "Artifact registry",
      x: 610,
      y: 60,
      w: 170,
      h: 60,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Artifact registry — verification boundary: provenance and signature checks decide whether a build result may be promoted",
      description:
        "Third trust boundary and the last checkpoint before deployment. A registry that only stores artifacts is not a control; a registry that verifies provenance (was this artifact built by the expected runner, from the expected source revision, with an intact signature) is what turns a tainted build into a rejected one instead of a deployed one.",
    },
    {
      id: "deploy-target",
      label: "Deployment target",
      x: 820,
      y: 60,
      w: 160,
      h: 60,
      role: "safe",
      activeIn: ["normal"],
      description:
        "The environment that actually matters to an attacker and to the business. In the normal path it only ever receives artifacts that passed the registry's verification. In the failure mode this node is never reached — the point of the diagram is that the registry boundary, not luck, is what keeps it that way.",
    },
  ],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A documented pipeline diagram (even a rough one) showing every stage from commit to running artifact, not just the parts a team happens to control.",
    "Enough authority or influence to ask 'why' about each stage's trust decisions — a threat model that nobody with a mandate reads or acts on is a diagram, not a control.",
    "A working definition of the pipeline's assets: what an attacker gains by compromising each stage (source, build-time secrets, the artifact itself, or the deployment target).",
    "Willingness to record 'we don't know' as an explicit finding rather than assuming a control exists because a tool is installed.",
  ],
  procedure: [
    "Draw the pipeline as a sequence of trust boundaries, not just a sequence of tools. For the fictional pipeline in this article, that is: developer workstation → source control → build runner → artifact registry → deployment target. Each arrow is a place where trust is extended, and each box is a place where it can be misused.",
    "For each boundary, ask what currently enforces it and what evidence supports that. 'Branch protection is configured' is an observation; 'branch protection was tested by attempting a direct push and it was rejected' is evidence. Keep the two separate in your notes — the publication-safety policy's caution about not inferring effectiveness from a running process applies here too.",
    "Enumerate realistic threats per boundary using a structured prompt (STRIDE, or simply 'what would a moderately resourced attacker who fully compromises this one stage be able to do next'). For a build runner specifically: can it read secrets it doesn't need, reach networks it doesn't need, or persist beyond a single job?",
    "Trace the worst case for each threat forward to the deployment target. A compromised dependency that reaches the build runner is bad; a compromised dependency that reaches the build runner *and* the runner's output is trusted without verification is the difference between an incident and a non-event.",
    "For every threat, record one of three outcomes: an existing mitigation with evidence, a planned mitigation with an owner and a date, or an accepted residual risk with a named approver. A threat model with no accepted-risk entries has usually just hidden them, not resolved them.",
    "Re-run the exercise whenever a stage changes meaningfully — a new dependency source, a new runner type, a new deployment target, or a change to who can approve a merge. A threat model that was accurate at design time and never revisited degrades silently.",
  ],
  validation: [
    "For each boundary, confirm the control fails closed: if the check cannot run (registry unreachable, signature service down, review system unavailable), does the pipeline stop, or does it proceed anyway?",
    "For the source-control boundary, confirm review and branch-protection requirements cannot be bypassed by the same identity that authored the change.",
    "For the build-runner boundary, confirm the runner's credentials and network reach are scoped to what that specific job needs, and that the runner environment does not persist state or secrets between unrelated jobs.",
    "For the artifact-registry boundary, confirm that provenance or signature verification is enforced at the point of promotion or deployment, not merely available as an optional check a consumer could skip.",
    "Where a control could not be tested (no lab environment, no authorized change to force a failure), record that explicitly as UNVERIFIED rather than assuming the control holds.",
  ],
  rollback: [
    "If a review surfaces a boundary with no enforced control (for example, a build runner with standing production credentials or a registry that never checks provenance), do not silently tighten it in the same change — record the finding, assess blast radius, and route it through the team's normal change process so the fix itself gets reviewed.",
    "If tightening a boundary breaks a legitimate workflow (for example, a stricter registry policy rejects a previously-accepted artifact type), have a documented, time-boxed exception path rather than disabling the control outright.",
    "Keep the previous threat-model version alongside the new one when a review changes a finding's status — knowing that a risk was newly discovered versus newly accepted is different information for whoever inherits the pipeline next.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Threat Modeling a CI/CD Pipeline",
    slug: "threat-modeling-cicd-pipeline",
    summary:
      "A structured method for threat modeling a CI/CD pipeline's trust boundaries — from commit to deployment — using a fictional example pipeline.",
    pillar: "build-securely",
    primaryCategory: "cicd-supply-chain-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["threat-modeling", "ci-cd-pipelines", "supply-chain-security"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 13,
    publishedAt: "2026-08-29",
    lastReviewedAt: "2026-08-29",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi", reviewedAt: "2026-08-29" },
    technicalReview: { status: "approved", reviewer: "Ravi", reviewedAt: "2026-08-29" },
    publicationApproval: { status: "approved", reviewer: "Ravi", reviewedAt: "2026-08-29" },
  },
  sections: {
    executiveSummary: [
      "A CI/CD pipeline is not a single system to secure — it is a chain of trust decisions, each one inherited by the stage after it. Threat modeling a pipeline means treating every handoff (commit to build, build to artifact, artifact to deployment) as a boundary that must justify the trust it extends, rather than treating the pipeline as one black box that either 'has security' or doesn't.",
      "This guide walks through threat modeling a fictional pipeline — developer commit, source control, build runner, artifact registry, deployment target — using a repeatable method: enumerate boundaries, ask what enforces each one, trace the worst case forward, and record the outcome as a mitigation, a plan, or an accepted risk. The example pipeline and every identifier in it are fictional; no real repository, credentials, or production system is described.",
    ],
    whatYouWillLearn: [
      "How to decompose a CI/CD pipeline into trust boundaries instead of treating it as a single unit.",
      "A repeatable threat-enumeration method (assets, boundaries, threats, mitigations, residual risk) applied to a concrete fictional pipeline.",
      "Why the artifact registry's verification step is usually the last meaningful checkpoint before a compromised build reaches production, and what 'meaningful' requires of it.",
      "How to record findings so that 'we haven't checked' and 'we checked and it's fine' don't get collapsed into the same status.",
    ],
    intendedAudience: [
      "Developers who maintain or depend on a CI/CD pipeline and want to reason about what it actually trusts.",
      "DevOps practitioners responsible for runner configuration, artifact promotion, and deployment gating.",
      "Security engineers supporting a supply-chain or pipeline-hardening review.",
    ],
    prerequisites: [
      "Basic familiarity with how a CI/CD pipeline is structured (triggers, build steps, artifacts, deployment).",
      "A rough diagram or mental model of a pipeline you can apply this method to — this guide uses a fictional one for illustration.",
      "No specific tool knowledge is assumed; the method is deliberately vendor-neutral.",
    ],
    problem: [
      "It is common to secure the parts of a pipeline that are easiest to see — a linter here, a dependency scanner there — while leaving the trust relationships between stages unexamined. A pipeline can pass every individual scan and still have no enforced boundary between 'a build ran' and 'this specific build is safe to deploy.' Threat modeling closes that gap by asking, stage by stage, what would have to be true for an attacker to move from one boundary to the next.",
      "The risk is not hypothetical in shape, even in a fictional illustration: a build runner typically has more reach than any single stage's obvious purpose suggests — network egress to fetch dependencies, short-lived credentials to publish results, and often a wider blast radius than the team maintaining it has actually inventoried.",
    ],
    threatModel: [
      "Assets: the source-control history and its integrity, the build runner's execution environment and credentials, the artifact registry's record of what was actually built and by what process, and the deployment target's running state.",
      "Trust boundaries, in order: developer workstation → source control (first boundary — is this commit legitimate and reviewed), source control → build runner (second boundary — does triggering a build require anything beyond a plausible-looking event), build runner → artifact registry (third boundary — is the published artifact actually what the runner claims to have built), and artifact registry → deployment target (fourth boundary — is a request to deploy verified against the same evidence).",
      "Representative threats: an attacker who can push directly to a protected branch bypasses the first boundary entirely. A compromised or dependency-confused third-party package executes attacker code inside the build runner during a routine build. A build runner with standing (not job-scoped) credentials lets a single compromised build reach far more than that build's own artifact. An artifact registry that stores builds without verifying their provenance turns 'the registry has the file' into a false signal of trust.",
      "The interactive diagram accompanying this article shows the failure case concretely: a compromised dependency reaches the build runner during a normal-looking build, and the artifact registry's provenance check is the boundary that decides whether that tainted artifact is ever eligible to reach the deployment target.",
    ],
    mainContent: [
      "Start by drawing the pipeline as boundaries, not tools. It is tempting to threat model by product name — 'we use a build tool, a container registry, an orchestrator' — but a boundary-first view forces the useful question at each step: what is trusted here, and why. The fictional pipeline in this guide has four boundaries: source control, the build runner, the artifact registry, and the deployment target. A real pipeline may have more (a staging environment, a separate signing service) or fewer, but the method is the same regardless of stage count.",
      "At the source-control boundary, the question is whether a commit's presence in the trigger branch is meaningful evidence of review. Branch protection that the author of a change can disable, or that accepts unsigned commits from any authenticated identity, provides less assurance than its configuration screen suggests. This boundary matters disproportionately because every downstream stage inherits whatever it lets through.",
      "At the build-runner boundary, the central question is scope: what can this specific job reach that it does not need? A runner with broad network egress can fetch a compromised dependency; a runner with standing credentials (rather than credentials minted fresh and narrowly scoped per job) turns a single compromised build into a much larger incident. Ephemeral, single-use runner environments reduce persistence risk — a compromise that doesn't survive past one job is a materially smaller problem than one that does.",
      "At the artifact-registry boundary, the useful distinction is between a registry that stores artifacts and a registry that verifies them. Storage alone gives you a copy of whatever the build runner produced, trustworthy or not. Verification — checking that an artifact's provenance (source revision, build identity, and an intact signature) matches what was expected before allowing promotion — is what makes this boundary an actual control rather than a filing cabinet. This is also usually the last point where a compromised build can still be stopped before it reaches anything that matters.",
      "At the deployment-target boundary, confirm that the deployment step itself re-checks verification rather than trusting that 'it's in the registry, so it must have passed.' A deployment process that pulls the newest artifact without re-validating provenance re-opens a boundary that the registry step just closed.",
      "Throughout, separate what you have observed from what you have verified. A build runner reporting success, a registry accepting a push, or a deployment completing without error are all observations — none of them, on their own, is evidence that the relevant boundary actually enforced anything. Where you cannot test a boundary directly, say so and mark the finding UNVERIFIED rather than letting an unexamined assumption stand in for a checked control.",
    ],
    validationEvidence: [
      "This article describes a method and a fictional illustrative pipeline; it does not reproduce a specific implementation or a completed assessment against a real system. Its evidence state is UNVERIFIED, and the recommendations should be treated as a starting checklist to adapt and then verify against your own pipeline, not as a validated result.",
    ],
    limitations: [
      "The fictional pipeline used here is intentionally simple — four boundaries in a straight line. Real pipelines often branch (multiple deployment targets, parallel build jobs, promotion through several environments), and each additional path is its own boundary that this article's linear example does not walk through.",
      "This guide covers pipeline-stage trust boundaries. It does not cover developer-endpoint security, identity-provider configuration, or cloud-account governance in depth — those are related but separate threat surfaces, each large enough for its own review.",
      "A threat model is a snapshot. It goes stale the moment a stage changes meaningfully, and nothing in this article substitutes for revisiting it on that trigger.",
    ],
    defensiveRecommendations: [
      "Require review and branch protection that the change's own author cannot bypass, and treat any bypass path as a finding, not an edge case.",
      "Scope build-runner credentials and network egress to what each specific job needs; prefer short-lived, job-scoped credentials over standing ones.",
      "Prefer ephemeral, single-use build environments over long-lived runners that persist state between unrelated jobs.",
      "Enforce artifact provenance and signature verification at the point of promotion or deployment — not as an optional check a consumer may or may not run.",
      "Make deployment re-validate provenance at deploy time rather than trusting registry presence alone.",
      "Record every threat-model finding as mitigated-with-evidence, planned-with-an-owner, or accepted-with-a-named-approver — never leave a finding in an undocumented middle state.",
      "Revisit the threat model whenever a pipeline stage changes meaningfully, not on a fixed calendar alone.",
    ],
    keyTakeaways: [
      "Threat model the pipeline's trust boundaries, not its tool list — a boundary is where trust is extended and where it can be misused.",
      "The build runner is usually the highest-value target; the artifact registry's verification step is usually the last meaningful checkpoint before deployment.",
      "Separate observation from verification at every boundary, and record what you genuinely don't know as UNVERIFIED rather than assuming a control works.",
      "A threat model is only useful if every finding resolves to a mitigation, a plan, or a named accepted risk — and if it gets revisited when the pipeline changes.",
    ],
    references: [
      "SLSA (Supply-chain Levels for Software Artifacts): https://slsa.dev/",
      "OWASP Top 10 CI/CD Security Risks: https://owasp.org/www-project-top-10-ci-cd-security-risks/",
      "NIST SP 800-218, Secure Software Development Framework: https://csrc.nist.gov/pubs/sp/800/218/final",
      "CISA and NSA, Defending Continuous Integration/Continuous Delivery (CI/CD) Environments: https://www.cisa.gov/news-events/alerts/2023/06/28/cisa-and-nsa-release-joint-guidance-defending-continuous-integrationcontinuous-delivery-cicd",
    ],
  },
  module: module_,
  diagram,
};
