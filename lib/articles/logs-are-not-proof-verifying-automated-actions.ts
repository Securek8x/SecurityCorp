// Knowledge-base article (Bead securitycorp-source-4zl.3,
// "Logs Are Not Proof: Verifying Automated Actions"). Published 2026-09-03
// under Ravi Teja Thota's standing publication authorization after real
// review of citations, safety, and evidenceState honesty, per
// docs/publication-safety-policy.md and docs/knowledge-base.md. All examples
// describe a fictional organization and fictional automated actions; no real
// pipeline, repository, credential, account, or production system appears
// anywhere in this file.
//
// Scope note: this guide covers the general principle that an automated
// security action's completion signal (exit code, log entry, dashboard
// status) is not proof its actual security-relevant effect occurred —
// across firewall-rule deployment, access revocation, patch rollout, and
// quarantine/isolation actions. The sibling article
// "A Backup Is Not Proven Until It Is Restored"
// (lib/articles/backup-restoration-verification.ts) already covers the same
// underlying gap for the specific case of backup jobs; this guide
// deliberately does not re-cover backup restoration and instead references
// that article for readers who land here from that specific case.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788446155073-ce3vme, template "research"). A
// bounded mcp__ruflo__workflow_status check afterward reproduced the
// documented issue in CLAUDE.md: 0% progress, a single pending "Execute"
// stage, no retrievable editorial output. This draft was therefore produced
// with the disclosed native fallback instead — separate research, drafting,
// technical-verification, and publication-safety passes — not credited to
// Ruflo. Every citation below was independently verified against its
// primary source (NIST, MITRE ATT&CK, CIS, CISA, and SLSA) with WebSearch/
// WebFetch before inclusion; none were invented. See the calling agent's
// final report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "A success signal from an automated security action proves the action was attempted and accepted, not that its effect exists. A rule deployment that exits 0 does not prove traffic is blocked; a revoke call that returns 200 does not prove the credential is rejected. Verify each action's effect with an independent check, from a vantage point that does not share the automation's reporting path, and repeat that check on a schedule. Every example here is fictional or documentation-safe.",
  ],
  prerequisites: [
    "At least one automated security action you own (firewall-rule deployment, access revocation, patch rollout, or endpoint quarantine) and knowledge of how it reports success.",
    "Access to, or authority to request, a vantage point independent of that automation: a separate scanner, a second system, an out-of-band API, or an authorized test client.",
  ],
  problem: [
    "Automated security actions are usually recorded as effective the moment their tooling reports success. What the tooling can observe is its own request and response, not the downstream state the request was meant to change.",
    "A firewall API can confirm a rule was accepted into a ruleset, but not that a matching packet is dropped at the enforcement point. An IAM API can confirm a revoke request was processed, but not that every session and cached token derived from the credential is now rejected. The tool is reporting on itself.",
  ],
  threatModel: [
    "The examples use a fictional team, Thistlewood Systems, running four automated actions: a firewall-rule pipeline, an access-revocation workflow, a patch-rollout pipeline for internet-facing services, and an EDR quarantine action. The scenarios are about reported success diverging from actual effect, not an attack on the automation platform.",
    "Four divergences illustrate the gap. (1) A new firewall rule is accepted, but an older, higher-priority rule matches the same traffic first, so the new rule is never evaluated. (2) A revocation succeeds at the identity provider, but a downstream service caches credential validity with a longer time-to-live than anyone remembered, so the identity keeps working for hours. (3) A patch rollout is green at every stage, but a stale cached image layer was never invalidated and the restarted service runs the old binary. (4) The EDR agent reports a host isolated, but the policy covers only the interface the agent knows about; a second interface stays reachable.",
    "Adversaries can produce the same gap on purpose. MITRE ATT&CK documents Impair Defenses (T1562, including T1562.004, Disable or Modify System Firewall). If you only check the original success log, an action that worked and stayed in effect looks identical to one that worked and was later undone. Independent, recurring verification tells them apart.",
  ],
  mainContent: [
    "**Write down the claim, not the command.** Each action asserts a resulting state. A rule deployment claims matching traffic is blocked or allowed. A revocation claims the identity can no longer act anywhere it previously could. A patch rollout claims the patched code is what executes. A quarantine claims the host cannot reach, or be reached by, the paths it severs.",
    "**Firewall rules: test the traffic, not the ruleset.** From an authorized test vantage point against a lab or fictional target, send the exact traffic the rule claims to affect and confirm the outcome matches its intent. A rule that is present but pre-empted earlier in the evaluation order produces the same deployment log as one that works.",
    "**Access revocation: test the protected resource, not the identity system.** Try the revoked credential, session, or token against the resource it used to reach, from an authorized test path, and confirm it is rejected there. The identity provider's dashboard only shows that its own record changed.",
    "**Patch rollout: check what is running, not what the pipeline reported.** Query the running service for its version, build identifier, or a cryptographic attestation, and compare it with the intended patched version. Where build provenance is available, SLSA exists to make \"what is running\" verifiable against \"what was supposed to be built and deployed.\"",
    "**Quarantine: verify from outside the host.** From a separate network vantage point, not the host's own agent, confirm the host is unreachable on every path the quarantine claims to close, including interfaces the agent may not see.",
    "**Keep the check independent.** A scanner routed through the enforcement point it is testing, or an access check that reuses the session that issued the revoke call, can fail the same way and agree incorrectly. A check is independent only if it would still catch the failure when the original cause is present.",
    "**Record results outside the automation's log, and repeat them.** Store method, vantage point, timestamp, and outcome in a separate dated record a reviewer can read without trusting the tool being checked. Then re-run the check on a cadence that matches how often the state can change, and after related configuration changes: a later rule can pre-empt a verified one, a repopulated cache can revive a revoked credential, an old image can be redeployed, and a remediation step can lift an isolation.",
  ],
  validationEvidence: [
    "This guide is a verification framework, not a reproduced test result. No action described here was deployed or independently verified against a live or lab system for this guide, and no timing or outcome data was measured. Its evidence state is UNVERIFIED and stays UNVERIFIED until an organization applying it records its own independent verification evidence; internal consistency is not grounds to upgrade the label.",
  ],
  limitations: [
    "Backup and disaster-recovery restoration is covered by the sibling article \"A Backup Is Not Proven Until It Is Restored,\" not here.",
    "It describes a discipline, not the rule-evaluation order, token caching, image-layer caching, or isolation scope of any specific product. Translate each step into your tooling and re-validate it there.",
    "Detecting an in-progress attempt to disable or bypass these actions (the ATT&CK T1562 behaviors above) is a detection-engineering concern, covered separately.",
    "Designing the action itself to fail closed when a dependency is unavailable is covered by \"Designing Fail-Closed Security Automation.\"",
  ],
  defensiveRecommendations: [
    "Never accept an exit code, API response, log entry, or dashboard status as evidence of an action's effect on its own.",
    "Write down the state each automated action claims to produce before designing its check.",
    "Run each check from a vantage point that does not share the automation's reporting path, credential, or network position.",
    "Keep verification records separate from the automation's own log.",
    "Repeat verification on a defined cadence and after related configuration changes.",
    "Where a control cannot be verified safely, record it as UNVERIFIED rather than inferring success.",
  ],
  references: [
    "NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations (see the CA-2 Control Assessments, CA-7 Continuous Monitoring, and AU-6 Audit Record Review, Analysis, and Reporting controls): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "NIST SP 800-137, Information Security Continuous Monitoring (ISCM) for Federal Information Systems and Organizations: https://csrc.nist.gov/pubs/sp/800/137/final",
    "MITRE ATT&CK T1562, Impair Defenses: https://attack.mitre.org/techniques/T1562/",
    "CIS Critical Security Control 13: Network Monitoring and Defense: https://www.cisecurity.org/controls/network-monitoring-and-defense",
    "CISA, Cross-Sector Cybersecurity Performance Goals (CPGs): https://www.cisa.gov/cross-sector-cybersecurity-performance-goals",
    "SLSA (Supply-chain Levels for Software Artifacts), provenance verification for build and deployment artifacts: https://slsa.dev/",
  ],
  relatedSlugs: ["backup-restoration-verification", "designing-fail-closed-security-automation", "designing-human-approval-gates-for-production-changes"],
  nextSlug: "backup-restoration-verification",
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "An out-of-band verification method, independent of each tool's own reporting, for at least one class of action in scope.",
    "Authority to run that check against the real target without the check being blocked by the control it tests.",
    "An inventory of which automated security actions currently report success only through their own completion signal.",
  ],
  procedure: [
    "List every automated security action whose only evidence of success is its own completion signal.",
    "For each, write down the state it claims to produce (\"traffic on this path is blocked,\" not \"the deployment call returned success\").",
    "Choose the matching check from \"How it works\": test the traffic, test the protected resource, query the running version, or probe the host from outside.",
    "Run the check from a vantage point, credential, and network position independent of the automation.",
    "Record method, vantage point, timestamp, and outcome in a durable record separate from the automation's log.",
  ],
  validation: [
    "Re-run each check on a defined cadence and after related configuration changes, not only right after the action.",
    "Confirm each check does not share a failure mode with the automation it verifies.",
    "Where no safe, authorized test path exists, record the control as UNVERIFIED.",
    "Periodically compare verification records with the automation's logs; a pattern of logged success that verification contradicts is a finding about the platform, not an isolated incident.",
  ],
  rollback: [
    "If a check shows a claimed effect did not occur, treat it as a control failure and remediate the action, not as a logging discrepancy.",
    "If a check proves unreliable or too disruptive, redesign it (a narrower test path, a lower-impact probe) instead of reverting to trusting the completion signal.",
    "Escalate repeated mismatches across actions as a platform-level finding.",
    "Record the date each action's verification became routine, so a later reviewer can tell when the control started producing real evidence.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Logs Are Not Proof: Verifying Automated Actions",
    slug: "logs-are-not-proof-verifying-automated-actions",
    summary:
      "A guide to verifying that an automated security action — a firewall-rule deployment, an access revocation, a patch rollout, a quarantine action — actually produced its intended effect, distinguishing a completion signal (exit code, log entry, dashboard status) from independently verified evidence, with fictional examples throughout.",
    pillar: "defend-systems",
    primaryCategory: "security-architecture",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["security-control-validation", "logging-monitoring", "access-control", "patch-management"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 6,
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
};
