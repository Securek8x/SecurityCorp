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
    "A success signal from an automated security action proves the action was attempted and accepted, not that its effect exists. Verify the effect directly, from a vantage point that does not share the automation's reporting path, and repeat the check on a schedule. Four checks cover the common actions: for a firewall rule, send the traffic it should block; for an access revocation, try the credential against the resource it protected; for a patch rollout, query the version that is actually running; for a quarantine, probe the host from outside it.",
  ],
  prerequisites: [
    "An automated security action you own, and knowledge of how it reports success.",
    "A verification method independent of that automation's reporting: a separate scanner, a second system, an out-of-band API, or an authorized test client.",
    "Authority to run that check against the real target without the control it tests blocking the check.",
  ],
  problem: [
    "Automated security actions are usually recorded as effective the moment their tooling reports success. The tooling can observe only its own request and response, not the downstream state the request was meant to change.",
  ],
  threatModel: [
    "The examples use a fictional team, Thistlewood Systems, that automates firewall-rule deployment, access revocation, patch rollout for internet-facing services, and EDR quarantine. The scenarios concern reported success diverging from actual effect, not an attack on the automation platform.",
    "Four divergences illustrate the gap. (1) A new firewall rule is accepted, but an older, higher-priority rule matches the same traffic first, so the new rule is never evaluated. (2) A revocation succeeds at the identity provider, but a downstream service caches credential validity with a longer time-to-live than anyone remembered, so the identity keeps working for hours. (3) A patch rollout is green at every stage, but a stale cached image layer was never invalidated and the restarted service runs the old binary. (4) The EDR agent reports a host isolated, but the policy covers only the interface the agent knows about; a second interface stays reachable.",
    "Adversaries can produce the same gap on purpose (MITRE ATT&CK T1562, Impair Defenses, including T1562.004, Disable or Modify System Firewall). In the original success log, an action that stayed in effect looks identical to one that was later undone; only recurring, independent verification tells them apart.",
  ],
  mainContent: [
    "**Keep the check independent.** A scanner routed through the enforcement point it is testing, or an access check that reuses the session that issued the revoke call, can fail the same way and agree incorrectly. A check is independent only if it would still catch the failure when the original cause is present.",
  ],
  validationEvidence: [
    "This guide is a verification framework, not a test result. Nothing described here was deployed or verified against a live or lab system for this guide, and no timing or outcome data was measured. Its evidence state stays UNVERIFIED until an organization applying it records its own independent verification evidence; internal consistency is not grounds to upgrade the label.",
  ],
  limitations: [
    "It describes a discipline, not the rule-evaluation order, token caching, image-layer caching, or isolation scope of any specific product. Translate each step into your tooling and re-validate it there.",
    "Out of scope here: backup restoration (see \"A Backup Is Not Proven Until It Is Restored\"), detecting attempts to disable these actions (a detection-engineering concern), and designing the action to fail closed (see \"Designing Fail-Closed Security Automation\").",
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
  nextSlug: "backup-restoration-verification",  anchorAliases: {
    "mod-requirements": "prerequisites",
    "sec-defensive-recommendations": "mod-procedure",
  },
};

const module_: GuideModule = {
  kind: "guide",
  procedure: [
    "List every automated security action whose only evidence of success is its own completion signal.",
    "For each, write down the state it claims to produce (\"traffic on this path is blocked,\" not \"the deployment call returned success\").",
    "Choose a vantage point, credential, and network position that do not share the automation's reporting path, then run the matching check below.",
    "**Firewall rule.** From an authorized test vantage point against a lab or fictional target, send the exact traffic the rule claims to affect. Expected: the outcome matches the rule's intent, whatever the deployment log says.",
    "**Access revocation.** From an authorized test path, try the revoked credential, session, or token against the resource it used to reach. Expected: that resource rejects it.",
    "**Patch rollout.** Query the running service for its version, build identifier, or a cryptographic attestation. Expected: it matches the intended patched version. Where build provenance is available, SLSA lets you verify that against what was supposed to be built and deployed.",
    "**Quarantine.** From a separate network vantage point, not the host's own agent, probe every path the quarantine claims to close, including interfaces the agent may not see. Expected: the host is unreachable on all of them.",
    "Record method, vantage point, timestamp, and outcome in a dated record separate from the automation's log, so a reviewer can read it without trusting the tool being checked.",
  ],
  validation: [
    "Re-run each check on a defined cadence and after related configuration changes, not only right after the action. A later rule, a repopulated cache, a redeployed old image, or a remediation step can each undo a verified result.",
    "Confirm each check does not share a failure mode with the automation it verifies.",
    "Where no safe, authorized test path exists, record the control as UNVERIFIED rather than inferring success.",
    "Periodically compare verification records with the automation's logs. A pattern of logged success that verification contradicts is a platform finding, not an isolated incident.",
  ],
  rollback: [
    "If a check shows a claimed effect did not occur, treat it as a control failure and remediate the action, not as a logging discrepancy.",
    "If a check proves unreliable or too disruptive, redesign it (a narrower test path, a lower-impact probe) instead of reverting to trusting the completion signal.",
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
    estimatedReadingMinutes: 5,
    publishedAt: "2026-09-03",
    updatedAt: "2026-11-22",
    lastReviewedAt: "2026-09-03",
    changeNote:
      "Shortened for faster reading. The four checks now appear in the opening. Each check and its expected result moved into the procedure, the requirements were merged into the prerequisites, and the recommendations, which repeated the procedure and validation steps, were removed. Sources and the evidence status are unchanged.",
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
