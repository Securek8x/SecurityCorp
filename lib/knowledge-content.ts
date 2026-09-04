// The real knowledge-base catalog. Every page that lists or counts knowledge content (topics,
// pillar/category pages, catalog, sitemap, RSS, structured data) must read
// from `publishedKnowledgeArticles` below, never fabricate a count, and
// never fall back to Beads-derived numbers.
import type { KnowledgeArticleMeta } from "./knowledge-schema.ts";
import { isPubliclyVisible } from "./knowledge-schema.ts";
import type { UniversalSections, ContentModule } from "./knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";
import type { ArticleClaim } from "./claim-ledger.ts";
import type { FreshnessMeta } from "./content-freshness.ts";
import type { ArticleVisual } from "./article-visuals.ts";
import { article as networkTrustBoundaries } from "./articles/network-trust-boundaries.ts";
import { article as threatModelingCicdPipeline } from "./articles/threat-modeling-cicd-pipeline.ts";
import { article as securingApiAuth } from "./articles/securing-api-authentication-authorization.ts";
import { article as segmentationVsIsolation } from "./articles/segmentation-vs-isolation.ts";
import { article as protectingMainBranch } from "./articles/protecting-main-branch-beyond-pr-approval.ts";
import { article as secretsDetectionScannerLimits } from "./articles/secrets-detection-scanner-limits.ts";
import { article as dnsSecurityAttackSurface } from "./articles/dns-security-control-and-attack-surface.ts";
import { article as buildRunnersUntrusted } from "./articles/build-runners-untrusted.ts";
import { article as dependencyConfusionPackageTrust } from "./articles/dependency-confusion-package-trust.ts";
import { article as tlsCertificateValidation } from "./articles/tls-certificate-validation-explained.ts";
import { article as sbomsWhatTheySolve } from "./articles/sboms-what-they-solve.ts";
import { article as inputValidationNotComplete } from "./articles/input-validation-not-complete-control.ts";
import { article as buildingFirewallRules } from "./articles/building-firewall-rules-from-documented-requirements.ts";
import { article as leastPrivilegePipelineIdentities } from "./articles/least-privilege-for-pipeline-identities.ts";
import { article as sastVsDastVsSca } from "./articles/sast-vs-dast-vs-software-composition-analysis.ts";
import { article as safelyAnalyzingPacketCaptures } from "./articles/safely-analyzing-packet-captures.ts";
import { article as verifyingBuildArtifacts } from "./articles/verifying-build-artifacts-before-deployment.ts";
import { article as preventingPathTraversal } from "./articles/preventing-path-traversal-through-boundary-validation.ts";
import { article as validatingServiceNotReachable } from "./articles/validating-a-service-is-not-publicly-reachable.ts";
import { article as preventingSecretsInBuildLogs } from "./articles/preventing-secrets-from-entering-build-logs.ts";
import { article as designingSecurityTestsForFailure } from "./articles/designing-security-tests-for-failure-conditions.ts";
import { article as commonCausesNetworkExposure } from "./articles/common-causes-of-unexpected-network-exposure.ts";
import { article as humanApprovalGatesProductionChanges } from "./articles/designing-human-approval-gates-for-production-changes.ts";
import { article as failClosedSecurityAutomation } from "./articles/designing-fail-closed-security-automation.ts";
import { article as backupRestorationVerification } from "./articles/backup-restoration-verification.ts";
import { article as humanApprovalGatesForAiAgents } from "./articles/human-approval-gates-for-ai-agents.ts";
import { article as dockerToK3sMigrationZeroChange } from "./articles/docker-to-k3s-migration-zero-change.ts";
import { article as dockerSockMountingSecurityRisks } from "./articles/docker-sock-mounting-security-risks.ts";
import { article as secureInternalReverseProxyDesign } from "./articles/secure-internal-reverse-proxy-design.ts";
import { article as logsAreNotProofVerifyingAutomatedActions } from "./articles/logs-are-not-proof-verifying-automated-actions.ts";
import { article as hardeningPrivateGiteaServer } from "./articles/hardening-a-private-gitea-server.ts";
import { article as threatModelingAiAgentsToolAccess } from "./articles/threat-modeling-ai-agents-tool-access.ts";
import { article as promptInjectionAiAssistedEngineering } from "./articles/prompt-injection-ai-assisted-engineering.ts";
import { article as approvalGateFailureModesActorAgnosticCatalog } from "./articles/approval-gate-failure-modes-actor-agnostic-catalog.ts";
import { article as preventingSensitiveDataLeakageAiTools } from "./articles/preventing-sensitive-data-leakage-ai-tools.ts";
import { article as workloadIdentitiesVsLongLivedCredentials } from "./articles/workload-identities-vs-long-lived-credentials.ts";
import { article as cloudIamPermissionCreep } from "./articles/cloud-iam-permission-creep.ts";
import { article as kubernetesRbacDesignPrinciples } from "./articles/kubernetes-rbac-design-principles.ts";
import { article as containerHealthNotSecurityValidation } from "./articles/container-health-not-security-validation.ts";
import { article as scopingAuthorizedSecurityAssessment } from "./articles/scoping-authorized-security-assessment.ts";

export type KnowledgeArticle = {
  meta: KnowledgeArticleMeta;
  sections: UniversalSections;
  module?: ContentModule;
  /** Interactive architecture diagram, reusing the existing guide diagram
   * system (components/diagrams/interactive-flow-diagram.tsx) — one spec
   * drives the same hover-explore/mode-toggle/replay renderer already used
   * by the three guide pages, so no second diagram system exists. */
  diagram?: FlowDiagramSpec;
  /** Claim-level evidence ledger (lib/claim-ledger.ts, Bead
   * securitycorp-source-5q3) — optional. Absent on every article in this
   * catalog today; new/updated articles that make a material externally
   * verifiable claim should populate it rather than relying solely on the
   * free-text `sections.references` list. */
  claims?: ArticleClaim[];
  /** Freshness and applicability metadata (lib/content-freshness.ts, Bead
   * securitycorp-source-9vn) — optional. Absent on every article in this
   * catalog today; new/updated articles should populate it going forward. */
  freshness?: FreshnessMeta;
  /** Cover/hero visual and its full provenance record (lib/article-
   * visuals.ts, Bead securitycorp-source-s41.9-12 pilot) — optional
   * during the migration period (VISUAL_GATE_ENABLED is false). May sit
   * at stage "brief" (a complete generation-ready brief, no asset file
   * yet — this repo has no working image-generation capability
   * installed; see docs/article-visual-guidelines.md) or "asset"/
   * "reviewed" once a real file exists. */
  coverImage?: ArticleVisual;
};

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    meta: {
      title: "A Practical Secure Code Review Checklist",
      slug: "practical-secure-code-review-checklist",
      summary: "A defensive, risk-focused checklist for reviewing software changes before approval.",
      pillar: "build-securely",
      primaryCategory: "application-code-security",
      contentType: "checklist",
      difficulty: "intermediate",
      status: "published",
      tags: ["secure-code-review", "application-security", "threat-modeling"],
      audience: ["practitioner", "security-engineer"],
      estimatedReadingMinutes: 9,
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
        "Secure code review is a focused examination of a change and its surrounding context. It complements automated checks by asking a human reviewer to reason about trust boundaries, intended behavior, and failure modes. Start with the change that is being proposed, then follow the data and decisions that the change affects.",
        "This checklist is a repeatable prompt for review, not a certification. A passed item means the available evidence was examined; it does not prove that every relevant risk has been found.",
      ],
      whatYouWillLearn: [
        "How to scope a review around changed behavior and trust boundaries.",
        "Which common control areas deserve explicit evidence.",
        "How to record uncertainty and route it for follow-up instead of guessing.",
      ],
      intendedAudience: [
        "Developers reviewing a change before approval.",
        "Security practitioners supporting an application review.",
        "Technical leads who need a consistent review record.",
      ],
      prerequisites: [
        "A clear description of the intended change.",
        "Access to the approved review scope and relevant design context.",
        "Authority to request clarification or a security review when evidence is missing.",
      ],
      problem: [
        "Functional review can confirm that a change works as intended while missing whether it changes who can act, what data crosses a boundary, or how the application behaves when inputs and dependencies fail. A short, risk-focused checklist makes those questions visible and keeps unresolved concerns from being silently accepted.",
      ],
      threatModel: [
        "Prioritize code that accepts data, makes authorization decisions, changes state, invokes an external dependency, handles secrets, or changes logging and error behavior. Review the path from entry point to sensitive operation: identify what is trusted, what is validated, which decision permits the action, and what happens when a dependency returns an unexpected result.",
      ],
      mainContent: [
        "Begin by restating the security-relevant intent in plain language. Identify the inputs, the state that can change, and the expected authorization decision. Then inspect the smallest affected path end-to-end instead of searching for isolated patterns. Automated findings can guide attention, but a reviewer should confirm their context and consider behavior that a pattern-based check cannot infer.",
        "Use the checklist below as a discussion record. Mark an item as reviewed only when the stated evidence is available. If it is unavailable or inconclusive, record the question and assign a follow-up rather than marking the control as passed.",
      ],
      validationEvidence: [
        "The checklist structure is informed by the cited OWASP and NIST guidance. This article does not include a reproduced implementation or a completed assessment, so its evidence state remains UNVERIFIED.",
      ],
      limitations: [
        "This checklist does not replace design review, testing, threat modeling, or specialist assessment. Its items must be adapted to the change and the organization’s approved engineering practices. A reviewer should not infer that a blank, skipped, or incomplete item is acceptable.",
      ],
      defensiveRecommendations: [
        "Review the highest-risk changes early, while the design can still be clarified.",
        "Keep the review record concise and distinguish confirmed evidence from assumptions.",
        "Escalate ambiguous authorization, sensitive-data, cryptographic, or workflow questions to an appropriate reviewer.",
        "Use automated analysis as an input, then apply human context before accepting or dismissing a finding.",
        "Revisit the checklist when a change alters a trust boundary, a critical workflow, or a security control.",
      ],
      keyTakeaways: [
        "Secure review is about changed context and risk, not only code patterns.",
        "Evidence should support each conclusion; uncertainty deserves a visible follow-up.",
        "A checklist improves consistency but never substitutes for human approval.",
      ],
      references: [
        "OWASP Secure Code Review Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html",
        "OWASP Code Review Guide: https://owasp.org/www-project-code-review-guide/",
        "NIST SP 800-218, Secure Software Development Framework: https://csrc.nist.gov/pubs/sp/800/218/final",
      ],
    },
    module: {
      kind: "checklist",
      items: [
        { control: "Review scope", verificationMethod: "Compare the requested behavior with the changed entry points and affected components.", requiredEvidence: "A concise description of the change, affected boundary, and reviewer scope.", result: "Pending review for each change" },
        { control: "Input handling", verificationMethod: "Trace externally influenced data to the operation it affects.", requiredEvidence: "Evidence of context-appropriate server-side validation and safe handling of invalid input.", result: "Pending review for each change" },
        { control: "Authorization", verificationMethod: "Identify every action that changes protected state or exposes protected data.", requiredEvidence: "Evidence that the decision is enforced on the trusted side for each relevant action.", result: "Pending review for each change" },
        { control: "Sensitive data", verificationMethod: "Inspect data creation, use, storage, and logging paths affected by the change.", requiredEvidence: "Evidence that sensitive values are not exposed through source, responses, errors, or logs.", result: "Pending review for each change" },
        { control: "Dependency and error behavior", verificationMethod: "Consider expected failures, malformed responses, and unavailable dependencies.", requiredEvidence: "Evidence of explicit failure handling that preserves the intended security boundary.", result: "Pending review for each change" },
        { control: "State and workflow integrity", verificationMethod: "Follow multi-step operations, retries, and concurrent paths where they are affected.", requiredEvidence: "Evidence that required checks cannot be bypassed by an unexpected sequence or partial failure.", result: "Pending review for each change" },
        { control: "Review record", verificationMethod: "Capture unresolved assumptions and required follow-up.", requiredEvidence: "A review note that separates verified observations from open questions.", result: "Pending review for each change" },
      ],
    },
  },
  networkTrustBoundaries,
  threatModelingCicdPipeline,
  securingApiAuth,
  segmentationVsIsolation,
  protectingMainBranch,
  secretsDetectionScannerLimits,
  dnsSecurityAttackSurface,
  buildRunnersUntrusted,
  dependencyConfusionPackageTrust,
  tlsCertificateValidation,
  sbomsWhatTheySolve,
  inputValidationNotComplete,
  buildingFirewallRules,
  leastPrivilegePipelineIdentities,
  sastVsDastVsSca,
  safelyAnalyzingPacketCaptures,
  verifyingBuildArtifacts,
  preventingPathTraversal,
  validatingServiceNotReachable,
  preventingSecretsInBuildLogs,
  designingSecurityTestsForFailure,
  commonCausesNetworkExposure,
  humanApprovalGatesProductionChanges,
  failClosedSecurityAutomation,
  backupRestorationVerification,
  humanApprovalGatesForAiAgents,
  dockerToK3sMigrationZeroChange,
  secureInternalReverseProxyDesign,
  dockerSockMountingSecurityRisks,
  logsAreNotProofVerifyingAutomatedActions,
  hardeningPrivateGiteaServer,
  threatModelingAiAgentsToolAccess,
  promptInjectionAiAssistedEngineering,
  approvalGateFailureModesActorAgnosticCatalog,
  preventingSensitiveDataLeakageAiTools,
  workloadIdentitiesVsLongLivedCredentials,
  cloudIamPermissionCreep,
  kubernetesRbacDesignPrinciples,
  containerHealthNotSecurityValidation,
  scopingAuthorizedSecurityAssessment,
];

export const publishedKnowledgeArticles: KnowledgeArticle[] = knowledgeArticles.filter((a) => isPubliclyVisible(a.meta));

export function findKnowledgeArticle(slug: string): KnowledgeArticle | undefined {
  return publishedKnowledgeArticles.find((a) => a.meta.slug === slug);
}
