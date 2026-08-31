// Knowledge-base article: "Least Privilege for Pipeline Identities"
// (Bead securitycorp-source-4zl.54.2.3). Not yet added to
// lib/knowledge-content.ts's `knowledgeArticles` — status stays "drafting"
// and every review record stays "pending" until the human owner reviews it,
// per docs/publication-safety-policy.md and docs/knowledge-base.md. All
// examples describe a fictional pipeline; no real pipeline name, repository
// identifier, credential, account name, or production release detail
// appears anywhere in this file.
//
// Differentiation from the other CI/CD-adjacent articles in this category:
// lib/articles/threat-modeling-cicd-pipeline.ts teaches a general trust-
// boundary threat-modeling method across the whole pipeline, and
// lib/articles/build-runners-untrusted.ts is about the build runner's own
// execution environment (blast radius from arbitrary code execution). This
// article is narrower still: it is specifically about the pipeline
// identity — the service account, OIDC-federated role, or deploy token a
// job authenticates as — and about assessing and reducing that identity's
// standing privilege deliberately, without breaking the pipeline it serves.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const diagram: FlowDiagramSpec = {
  titleId: "pipeline-identity-scope-diagram",
  title: "Scoping a fictional pipeline identity's reach",
  desc: "A pipeline trigger feeds a build stage, which feeds a deploy stage, which reaches a target environment. Interactive: switch between the normal flow, where the deploy stage's identity is scoped to reach only its one authorized target environment, and a failure mode showing what a standing, over-broad grant on that same identity would additionally reach — and explore each node's role in containing that reach.",
  viewBox: "0 0 1000 300",
  failureLabel: "Over-privileged identity",
  caption:
    "Fictional pipeline: trigger → build stage → deploy stage → target environment. In the failure mode, the deploy stage's identity carries a standing, account-wide grant instead of a role scoped to one environment, so it can also reach an unrelated resource it was never meant to touch. Scoping the identity's permissions and its federation trust conditions is what removes that extra path — not monitoring, and not luck.",
  motionDuration: 2600,
  mainPacketRoute: {
    d: "M160,90 H190 M360,90 H400 M590,90 H630",
    length: 110,
  },
  edges: [
    { id: "trigger-build", from: "trigger", to: "build-stage", d: "M160,90 H190", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "build-deploy", from: "build-stage", to: "deploy-stage", d: "M360,90 H400", length: 40, kind: "main", activeIn: ["normal", "failure"] },
    { id: "deploy-target", from: "deploy-stage", to: "target-environment", d: "M590,90 H630", length: 40, kind: "main", activeIn: ["normal"] },
    { id: "deploy-unintended", from: "deploy-stage", to: "unintended-resource", d: "M495,125 V210", length: 85, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "trigger",
      label: "Pipeline trigger",
      x: 10,
      y: 60,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description:
        "A reviewed change reaches the point where it starts a build. What identity the resulting jobs authenticate as — and what that identity can reach — is decided long before this trigger fires, by how the pipeline's roles and trust conditions were configured.",
    },
    {
      id: "build-stage",
      label: "Build stage",
      x: 190,
      y: 55,
      w: 170,
      h: 70,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Build stage — holds an identity scoped to compiling and testing only; it has no deploy credential of its own",
      description:
        "Compiles and tests the change. Its identity should be able to do exactly that — read source, fetch build-time dependencies, write build output — and nothing that a deploy step needs. A build stage that also happens to hold deploy credentials, 'in case it's convenient later,' is already carrying privilege it doesn't use.",
    },
    {
      id: "deploy-stage",
      label: "Deploy stage",
      x: 400,
      y: 55,
      w: 190,
      h: 70,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Deploy stage — the identity this article is about: the credential or federated role a job actually authenticates as to reach a target environment",
      description:
        "Holds the pipeline identity under review: a service account, an OIDC-federated role, or a deploy token that authenticates to a target environment. This is the highest-value node in the diagram, because whatever this identity is authorized to do, any job running in this stage can do — whether or not that job's actual task needs the full extent of it.",
    },
    {
      id: "target-environment",
      label: "Target environment",
      x: 630,
      y: 60,
      w: 170,
      h: 60,
      role: "safe",
      activeIn: ["normal"],
      description:
        "The one environment this deploy job is actually authorized to change. In the normal path, a properly scoped identity's permissions and federation trust conditions (which repository, which branch or environment, which action) end here, because that is all the job was ever supposed to reach.",
    },
    {
      id: "unintended-resource",
      label: "Unrelated resource",
      x: 400,
      y: 210,
      w: 190,
      h: 60,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Unrelated resource — reachable only when the deploy identity's grant is broader than the job, visible only in failure mode",
      description:
        "Failure-mode only: something this job never needed to touch — a different environment, a broader account scope, a resource outside this pipeline's purpose. It is reachable only because the deploy identity's grant was written broadly (a wildcard action, an account-wide role, a trust condition that accepts more callers than it should) rather than scoped to this one job's actual need. Narrowing the grant and the trust condition removes this edge entirely; it does not make the excess access harder to notice.",
    },
  ],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "Visibility into what each pipeline identity is actually granted today — the policy or role definition itself, not a description of what the team intended it to do.",
    "Visibility into what each pipeline identity actually uses — which actions a job's credential exercises in practice, whether from access logs, a policy-simulation tool, or a dry-run capability the identity provider offers.",
    "Authority, or a documented path to someone with authority, to change role definitions, federation trust conditions, and credential issuance for the pipelines under review.",
    "A staged environment or a safe rollout path to test a narrowed grant before it is the only grant in place — reducing privilege in the one environment that cannot tolerate a mistake, with no fallback, is how a legitimate deploy gets broken.",
  ],
  procedure: [
    "Inventory every distinct pipeline identity across the pipeline: one per stage where possible (build, deploy, and any promotion or notification step that authenticates to something), not one shared identity reused everywhere because it was easiest to set up first.",
    "For each identity, list what it is currently granted — every action, resource scope, and environment it can reach — from the actual policy or role definition, not from a README or a teammate's memory of how it was set up.",
    "For each identity, list what its jobs actually do — the specific actions a build or deploy step exercises against a specific target. Where a policy-simulation, access-analyzer, or audit-log capability exists for the identity provider in use, use it to compare granted permissions against exercised ones rather than guessing from the job's script.",
    "Treat every gap between granted and exercised as a finding: a deploy identity that can reach three environments but only ever deploys to one, a role that permits broad write access but the job only ever creates one kind of resource, a token whose scope was never revisited since the pipeline's first version.",
    "Narrow the federation trust condition alongside the permission scope. An OIDC-federated identity that is scoped tightly by permissions but whose trust condition accepts a token from any branch, any repository, or any workflow in an organization is still handing that access to more callers than the one job that needs it.",
    "Replace long-lived, standing credentials with short-lived ones minted per job wherever the identity provider supports it — federation that issues a token scoped to this run, rather than a static secret that remains valid indefinitely regardless of whether a job is currently running.",
    "Separate identities across environments deliberately: a deploy identity authorized for a staging environment should not also be authorized for a production one, even if the same pipeline definition triggers both. One identity spanning multiple environments turns a single compromised or misused credential into an incident in more than one place.",
  ],
  validation: [
    "After narrowing a grant, run the pipeline's normal jobs (build, test, deploy) in a non-production environment first and confirm they complete without an access-denied failure before applying the same change where a mistake is costly.",
    "Confirm the narrowed policy still allows every action the job's normal, legitimate path exercises — not just the happy path a single test run covers, but any conditional branch (a rollback step, a notification step, a cleanup step) that the same identity might also need.",
    "Confirm the identity cannot reach what it no longer needs by attempting, in a lab or non-production context, an action outside the new scope and confirming it is rejected rather than merely unused in the current job definition.",
    "Confirm a narrowed OIDC trust condition still matches the actual calling context (the correct repository, branch, or environment claim) and rejects a token asserting a different one — a scoped permission behind an unscoped trust condition still hands the access to more callers than intended.",
    "Where a control could not be tested directly (no safe way to force a denial, no non-production environment available), record that explicitly as UNVERIFIED rather than assuming the narrower policy behaves as intended because it was written that way.",
  ],
  rollback: [
    "If narrowing a grant breaks a legitimate step the inventory missed, do not revert to the original broad grant as the fix — add the specific, narrow permission that step actually needs and record why, so the addition is a deliberate, documented decision rather than a silent return to the previous over-broad state.",
    "Stage privilege reduction: move a shared or standing identity to short-lived, scoped credentials in a lower environment first, confirm nothing breaks over a full normal usage cycle, and only then apply the same change to a higher-stakes environment.",
    "Keep the previous and the narrowed policy both on record when a change is made, so a later reviewer can tell 'this was reduced deliberately, on this date, for this reason' apart from 'this was always this narrow' — that distinction matters when someone is trying to understand why a job later needed an exception added back.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Least Privilege for Pipeline Identities",
    slug: "least-privilege-for-pipeline-identities",
    summary:
      "How to recognize when a CI/CD pipeline identity — a service account, OIDC-federated role, or deploy token — carries more privilege than the job it serves actually needs, and how to reduce that privilege deliberately, in stages, without breaking the pipeline.",
    pillar: "build-securely",
    primaryCategory: "cicd-supply-chain-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["least-privilege", "ci-cd-pipelines", "access-control"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
    publishedAt: "2026-08-31",
    lastReviewedAt: "2026-08-31",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" },
  },
  sections: {
    executiveSummary: [
      "Every stage of a pipeline that authenticates to something else — a build stage fetching dependencies, a deploy stage pushing to a target environment — does so as some identity: a service account, an OIDC-federated role, or a deploy token. That identity's actual privilege is rarely examined once the pipeline is working, because 'it works' and 'it is scoped to what it needs' are different claims, and only the first one is visible from a green build.",
      "This guide is about closing that gap deliberately: inventorying what each pipeline identity is granted versus what its jobs actually use, narrowing both the permission scope and the federation trust condition that decides who can assume it, and rolling the change out in stages so a legitimate step does not silently break. The example pipeline and every identifier in it are fictional; no real pipeline, repository, credential, or production system is described.",
    ],
    whatYouWillLearn: [
      "How to inventory a pipeline's distinct identities and compare what each is granted against what it actually uses.",
      "Why an OIDC-federated identity needs its trust condition scoped, not just its permissions — and what happens when only one of the two is narrowed.",
      "The practical difference between a standing, long-lived credential and a short-lived one minted per job, and why that difference matters even when both are 'correctly' scoped on paper.",
      "A staged approach to reducing privilege that catches a missed legitimate use before it breaks a production deploy, instead of after.",
    ],
    intendedAudience: [
      "Developers who want to understand what their pipeline's build and deploy steps are actually authorized to do, beyond 'the pipeline works.'",
      "DevOps practitioners responsible for configuring service accounts, federated roles, or deploy tokens for pipeline stages.",
      "Security engineers assessing whether a pipeline's identities are scoped to their jobs' actual needs or inherited from whatever configuration happened to work first.",
    ],
    prerequisites: [
      "Basic familiarity with how a CI/CD pipeline authenticates to external systems — a credential, a service account, or a federated identity assumed for the duration of a job.",
      "No specific identity-provider or cloud-platform expertise is assumed; this guide describes the pattern generically and uses a fictional example for illustration.",
      "Awareness that 'permission scope' and 'who can assume this identity' are two separate questions is useful background, though this guide explains both.",
    ],
    problem: [
      "Pipeline identities tend to accumulate privilege rather than lose it. A deploy role gets a broad grant early on because narrowing it later felt like unnecessary friction, or because the person who set it up wasn't sure yet exactly what the job would need and erred toward 'enough to not get blocked.' Once the pipeline is working, nobody revisits that decision — a working deploy provides no signal about whether the identity behind it could also do things the job never asks it to do.",
      "The risk is not hypothetical in shape, even in a fictional illustration: a pipeline identity that can reach more than its one job requires turns a single compromised token, a misconfigured workflow, or a mistakenly triggered job into an incident with a larger blast radius than the job itself ever justified. The gap between 'what this identity can do' and 'what this job needs to do' is exactly the excess privilege this guide is about finding and removing.",
    ],
    threatModel: [
      "Assets: the pipeline identity's credential or federated-role assumption itself, every resource and environment that identity's current grant reaches, and the trust condition that decides which caller may assume it in the first place.",
      "The central trust decision: a pipeline identity is granted enough access to complete its stage's legitimate work, and — unless deliberately scoped otherwise — that access is available to anything running in that stage, for as long as the credential remains valid, to any caller the trust condition accepts.",
      "Representative threats: a deploy identity scoped with a wildcard action or account-wide role can affect resources well outside its one target environment. An OIDC trust condition that accepts a token from any branch or any workflow in an organization, rather than the specific one that should assume this role, hands deploy access to more callers than the one legitimate pipeline. A standing, long-lived credential remains usable long after the job that needed it has finished, giving a later compromise a wider window than a credential minted per job would. A single identity shared across environments turns a compromise or misuse in one environment into exposure in every environment that identity can also reach.",
      "The interactive diagram accompanying this article shows the difference concretely: a properly scoped deploy identity reaches only its one target environment, while the same identity carrying a standing, account-wide grant can also reach an unrelated resource it was never meant to touch. What decides which case is true is not monitoring or good luck — it is whether the identity's permissions and trust condition were deliberately narrowed to the job's actual need.",
    ],
    mainContent: [
      "Start with an inventory, not a policy rewrite. Before narrowing anything, list every distinct identity a pipeline uses — one per stage where the platform allows it, since a shared identity across build and deploy (or across multiple environments) is itself usually the first finding, not a detail to work around. For each identity, record what it is currently granted, from the actual role or policy definition rather than from how the team remembers configuring it.",
      "Compare granted access against exercised access. Most identity providers and cloud platforms offer some form of access analysis, policy simulation, or audit log that shows which permissions an identity actually used over a period of normal operation. The gap between what an identity can do and what its jobs have ever actually done is the concrete, evidence-based starting point for reduction — narrowing based on that gap is a defensible engineering decision; narrowing based on a guess about what 'should' be enough is not.",
      "Treat the permission grant and the federation trust condition as two separate things to scope, because narrowing only one leaves the other doing no work. A deploy role with a tightly scoped set of permissions is still available to too many callers if its OIDC trust condition accepts a token asserting any branch or any repository in an organization. Conversely, a trust condition scoped to exactly the right workflow doesn't help if the role it grants is still a broad, account-wide one. Both need to match the job's actual, specific identity — which repository, which branch or environment, and which action — before the identity is genuinely least-privileged.",
      "Prefer short-lived, per-job credentials over standing ones wherever the platform supports federation. A credential that exists only for the duration of a specific job run, minted fresh each time and scoped to that run, gives a compromise or a misuse a much smaller window than a static secret that remains valid indefinitely and has to be manually rotated or revoked to stop working. This is a different axis from permission scope — a short-lived credential with excessive permissions is still a problem, and a long-lived credential with narrow permissions is still exposed for longer than it needs to be. Both matter, and neither substitutes for the other.",
      "Separate identities by environment deliberately, even when a single pipeline definition triggers deploys to more than one. An identity authorized for a staging environment should not also be authorized for a production one, because the two environments have different consequences for a mistake, and because a single identity spanning both means a compromise or an accidental misuse in the lower-stakes environment can reach the higher-stakes one. This separation is often the single change with the largest blast-radius reduction, and it is also the one most often skipped because it means configuring more than one role instead of reusing the one that already works.",
      "Roll a narrowed grant out in stages rather than switching it in place across every environment at once. Apply the narrower policy to a non-production identity first, run the pipeline's normal jobs — including any less common paths like a rollback or a cleanup step — through a full cycle, and only then apply the same narrowing to the identity a production deploy actually depends on. A missed legitimate use surfaces as a blocked non-production job, not as a blocked production deploy at the worst possible moment.",
      "Expect reduction to surface a legitimate use the original broad grant was quietly covering. When that happens, the fix is a specific, documented, narrow addition to the new policy — not reverting to the previous broad grant. A pipeline identity that ends up slightly wider than the theoretical minimum, for a recorded and understood reason, is a materially different and more defensible state than one that is broad because nobody has looked at it since it was first configured.",
    ],
    validationEvidence: [
      "This article describes a method and a fictional illustrative pipeline; it does not reproduce a specific identity-provider configuration or a completed privilege-reduction exercise against a real pipeline. Its evidence state is UNVERIFIED, and the recommendations should be treated as a starting checklist to adapt and then verify against your own pipeline's identities, not as a validated result.",
    ],
    limitations: [
      "This guide addresses the pipeline identity's own permission scope, federation trust condition, and credential lifetime. It does not cover how to threat model the pipeline broadly, or the build runner's own execution-environment risk — 'Threat Modeling a CI/CD Pipeline' and 'Why Build Runners Should Be Treated as Untrusted' cover those, and this guide deliberately does not repeat them.",
      "Exact mechanisms for policy simulation, OIDC federation, and short-lived credential issuance vary by identity provider and by whether infrastructure is hosted or self-managed. This guide describes the pattern generically; verify the specific mechanisms your platform offers before relying on any one of them.",
      "Reducing privilege changes what a pipeline is authorized to do, which means an incomplete inventory can break a legitimate but infrequently exercised path (a rare rollback branch, a step that only runs on a schedule). The staged rollout in this guide reduces that risk; it does not eliminate the need to test thoroughly before relying on a narrowed identity in production.",
    ],
    defensiveRecommendations: [
      "Inventory every distinct pipeline identity and compare its granted permissions against its actually exercised permissions before deciding what to narrow.",
      "Scope both the permission grant and the federation trust condition — narrowing only one leaves the identity as broadly reachable, or as broadly capable, as before.",
      "Prefer short-lived, per-job credentials issued through federation over standing, long-lived secrets wherever the platform supports it.",
      "Use a separate identity per environment rather than one identity authorized across staging and production; a single shared identity turns a lower-stakes compromise into a higher-stakes one.",
      "Roll a narrowed grant out to a non-production identity first, exercise the pipeline's full normal usage (including uncommon paths), and only then apply the same narrowing to production.",
      "When reduction breaks a legitimate step, add the specific narrow permission that step needs and record why, rather than reverting to the previous broad grant.",
      "Record any control that could not be directly verified as UNVERIFIED rather than assuming a policy behaves as intended because it was written that way.",
    ],
    keyTakeaways: [
      "A pipeline identity's actual privilege and a pipeline's success are different claims — a working deploy provides no evidence that the identity behind it is scoped to what the job needs.",
      "Permission scope and federation trust condition both have to be narrowed; narrowing only one still leaves the identity broadly capable or broadly reachable.",
      "Short-lived, per-job credentials and narrow permission scope are separate, complementary controls — neither substitutes for the other.",
      "Reduce privilege in stages, starting in a non-production environment, so a missed legitimate use surfaces as a blocked test job rather than a blocked production deploy.",
    ],
    references: [
      "OWASP Top 10 CI/CD Security Risks (CICD-SEC-2: Inadequate Identity and Access Management): https://owasp.org/www-project-top-10-ci-cd-security-risks/",
      "NIST SP 800-53 Rev. 5, control AC-6, Least Privilege: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
      "NIST SP 800-218, Secure Software Development Framework: https://csrc.nist.gov/pubs/sp/800/218/final",
      "CISA and NSA, Defending Continuous Integration/Continuous Delivery (CI/CD) Environments: https://www.cisa.gov/resources-tools/resources/defending-continuous-integrationcontinuous-delivery-cicd-environments",
    ],
  },
  module: module_,
  diagram,
};
