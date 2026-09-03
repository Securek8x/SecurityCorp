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
    "An automated security action that reports success has confirmed exactly one thing: that a process ran to completion and returned a result its own reporting considered good. A firewall-rule deployment that exits 0, an access-revocation call that receives a 200 response, a patch rollout whose pipeline shows every stage green, a quarantine action whose endpoint agent reports 'isolated' — none of these, on their own, confirm that the security-relevant effect the action was supposed to produce actually exists in the world. They confirm that a command was accepted, not that traffic is blocked, that a credential is actually rejected, that the patched code is actually what is running, or that the host genuinely cannot reach the network.",
    "This guide generalizes a discipline this catalog also applies specifically to backups (see 'A Backup Is Not Proven Until It Is Restored') to automated security actions broadly. Its central claim is simple to state and easy to skip under time pressure: a completion signal is evidence that an action was attempted, not evidence that its intended effect occurred. Verifying the effect requires an independent check — one that observes the actual state the action claims to have produced, from a vantage point that does not share the automation's own reporting path — and that check, not the log line, is the real evidence a security control exists. Every example below is fictional or documentation-safe; no real infrastructure, tool, or incident is described.",
  ],
  whatYouWillLearn: [
    "Why an automated action's completion signal (exit code, API response, log entry, dashboard status) only ever confirms that the action was attempted and accepted — never that its intended security-relevant effect actually occurred.",
    "How to distinguish the action performed from the state it claims to produce, for four common categories: firewall-rule deployment, access revocation, patch rollout, and quarantine/isolation actions.",
    "How to design an independent verification check for each category — one sourced from a vantage point that does not share the automation's own reporting path, so a shared failure can't make both the action and its check agree incorrectly.",
    "Why verification has to recur on a defined cadence rather than run once immediately after the action, since a later change can silently undo an effect that was genuinely verified at the time.",
    "When a control genuinely cannot be verified safely, and why recording it as UNVERIFIED is the correct outcome rather than inferring success from the action's own report.",
  ],
  intendedAudience: [
    "Security practitioners responsible for validating that automated security actions actually produce their intended effect, not only that they run and report success.",
    "Platform engineers who own the automation performing firewall changes, access revocation, patch rollout, or quarantine actions and need a defensible way to demonstrate it works.",
    "Technical leads and auditors who need a repeatable way to distinguish 'the action's log says it succeeded' from 'the action's intended effect was independently confirmed.'",
  ],
  prerequisites: [
    "Familiarity with at least one automated security action in your environment — a firewall-rule deployment pipeline, an access-revocation workflow, a patch-rollout process, or an endpoint quarantine mechanism — and how its current success signal is reported.",
    "Access to (or authority to request) a vantage point independent of that automation for verification — a separate scanning tool, a second system, an out-of-band API, or an authorized test client. This guide assumes such a vantage point can be created or reused, not that one already exists.",
    "No prior incident-response or automation-engineering experience is required; this guide is written to be usable by a first-time reviewer of an existing automated control.",
  ],
  problem: [
    "Automated security actions are frequently accepted as effective the moment their tooling reports success. A firewall-rule pipeline applies a change and exits cleanly; an IAM system logs 'access revoked' after a call to its own API; a patch-management tool marks a rollout 'complete' once its deployment step returns; an EDR agent reports a host as 'quarantined' after sending an isolation command. In each case, the organization records the control as working, and in each case, what was actually confirmed is that a tool's own internal bookkeeping considers its part done — not that the world outside that tool changed the way the action intended.",
    "This gap is structural, not a symptom of neglect: most automation tools can only report on what they can observe, and what they can observe is usually their own request-and-response cycle with whatever system they called — not the downstream, security-relevant state that call was supposed to produce. A firewall-management API can confirm a rule was accepted into a ruleset; it generally cannot confirm, from inside that same call, that a packet matching the rule is actually dropped at the enforcement point. An IAM API can confirm a revoke request was processed; it cannot confirm, from the same call, that every session and cached token derived from that credential is now actually rejected everywhere it was previously accepted. The tool is reporting on itself, and a report about itself is not evidence about the system it was supposed to change.",
  ],
  threatModel: [
    "Consider a fictional platform team, referred to here as Thistlewood Systems, running automated security actions across four categories: a firewall-rule pipeline that pushes changes to a perimeter enforcement point, an access-revocation workflow triggered from an identity system, a patch-rollout pipeline for internet-facing services, and an EDR-driven quarantine action for compromised hosts. This guide's scenarios are about what happens when each action's own reported success diverges from its actual effect, not about an adversary attacking the automation platform directly.",
    "Relevant failure-mode scenarios, not adversary actions: (1) a firewall-rule deployment reports success because the rule was accepted into the managed ruleset, but a higher-priority rule earlier in the same enforcement chain — added months earlier for an unrelated reason — continues to match the same traffic first, so the new rule is syntactically present but never actually evaluated; (2) an access-revocation call against an identity provider returns success, but a downstream service holds its own cached copy of the credential's validity with a longer time-to-live than anyone remembered configuring, so the 'revoked' identity keeps working against that service for hours; (3) a patch-rollout pipeline reports every stage green, but a stale, unpatched container image cached at an intermediate build layer was never invalidated, and the 'patched' service that started afterward is running the old binary; (4) an EDR agent reports a host 'isolated' immediately after sending the quarantine command, but the host's isolation policy only blocks outbound connections on the interface the agent was aware of, while a second network interface — present on the host but outside the policy's scope — remains fully reachable.",
    "A related adversary-driven case is worth naming explicitly: MITRE ATT&CK documents Impair Defenses (technique T1562, including sub-technique T1562.004, Disable or Modify System Firewall) as adversaries directly weakening or disabling defensive tooling, sometimes specifically the same automated controls this guide is about. An organization that only ever checks an automated action's own completion signal has no way to distinguish 'the action worked and stayed in effect' from 'the action worked and was quietly undone or bypassed afterward' — because both look identical in the original success log. Independent, recurring verification is what actually distinguishes them.",
    "Out of scope for this guide: backup and disaster-recovery restoration, which is covered specifically by the sibling article 'A Backup Is Not Proven Until It Is Restored'; the internal architecture of any specific firewall, IAM, patch-management, or EDR product; and any evaluation of a real organization's actual automation platform. Thistlewood Systems is illustrative throughout, not a reference architecture.",
  ],
  mainContent: [
    "**Separate the action performed from the effect it claims to produce.** Every automated security action makes an implicit claim about a resulting state, and that claim is a different, more specific statement than 'the action ran.' 'Deploy this firewall rule' implies the claim 'matching traffic is now blocked (or allowed).' 'Revoke this access' implies the claim 'this identity can no longer authenticate or act, anywhere it previously could.' 'Roll out this patch' implies the claim 'the patched code is now what actually executes in production.' 'Quarantine this host' implies the claim 'this host cannot reach, or be reached by, the network paths the quarantine is supposed to sever.' Before verifying anything, write down the specific claim each action in your environment is actually making — not the command that was run, but the state it asserts now exists.",
    "**Verify firewall-rule deployment by testing the traffic it claims to affect, not by inspecting the ruleset.** Confirming a rule appears in an applied configuration, or that a management API returned success, confirms the rule was accepted — not that it is the rule actually evaluated for matching traffic, and not that no earlier rule in the same enforcement chain pre-empts it. Verification requires attempting (from an authorized test vantage point, against a fictional or lab target) the exact traffic the rule claims to block or allow, and confirming the observed outcome matches the rule's intent. A rule that is syntactically present but never actually reached in evaluation order produces an identical deployment log to a rule that works.",
    "**Verify access revocation against the resource it protects, not against the identity system that issued the revoke call.** An identity provider or IAM API returning success for a revoke request confirms that system's own record was updated — it does not confirm every downstream service, cached session, or previously issued token derived from that credential has actually stopped honoring it. Verification requires attempting to use the revoked credential, session, or token against the actual protected resource (again, from an authorized test path against a fictional target) and confirming it is rejected — not merely confirming the identity system's dashboard shows the account as revoked.",
    "**Verify patch rollout by confirming what is actually running, not that the deployment pipeline reported completion.** A pipeline's green checkmark confirms its own steps executed in sequence; it does not confirm the artifact that ended up running in production is the patched one, rather than a stale cached layer, an untouched replica that missed the rollout wave, or a rollback that silently reverted a later stage. Verification requires an independent runtime check — querying the actual running service for its version, build identifier, or a cryptographic attestation of what was deployed — and comparing that against the intended patched version. Where build provenance is available, a framework like SLSA exists specifically to make 'what is running' independently verifiable against 'what was supposed to be built and deployed,' rather than trusted from the deployment tool's own say-so.",
    "**Verify quarantine and isolation actions from outside the isolated host, not from the agent that issued the command.** An EDR or endpoint agent reporting 'isolated' confirms that agent successfully applied an isolation policy as it understands the host's network configuration — it does not confirm every interface, path, or protocol the host could use to communicate is actually severed, particularly on a host with more network exposure than the agent's own visibility. Verification requires an out-of-band check — from a separate network vantage point, not the isolated host's own agent — confirming the host is genuinely unreachable through the paths the quarantine claims to close.",
    "**Source the verification check from a vantage point that doesn't share the automation's failure mode.** A verification method that reuses the same reporting path, credential, or network position as the action it's checking can fail in the same way and agree with it incorrectly — a firewall-verification scanner routed through the same enforcement point it's testing, or an access check performed using the same identity-provider session that issued the revoke call, is not independent evidence. Independence means the verification would still catch a failure even if the exact mechanism that caused the original action to silently not take effect were also present.",
    "**Record verification results in a durable record distinct from the automation's own log.** The automation's own log already exists and already says the action succeeded; a verification record that lives in the same system, written by the same pipeline, adds confidence in appearance without adding independent evidence. Keep verification results — method used, vantage point, timestamp, and outcome — in a separate, dated record an auditor or a later reviewer can inspect without relying on the same tool whose claim is being checked.",
    "**Recur the verification on a defined cadence, not only once immediately after the action.** A firewall rule that was genuinely verified as blocking traffic on the day it deployed can be silently pre-empted by a later, unrelated rule change; a revoked credential's cached validity can outlive the revocation once a downstream cache is repopulated; a patched service can be replaced by a redeploy of an older image; a quarantined host's isolation can be lifted by a routine remediation step that forgets to re-check first. A single historical verification does not carry forward indefinitely — repeat the check on an interval appropriate to how often the underlying state can change, and after any related configuration change.",
  ],
  validationEvidence: [
    "This guide is a verification framework, not a reproduced test result. No firewall rule, access revocation, patch rollout, or quarantine action described here was actually deployed or independently verified against a live or lab-reproduced system as part of writing this guide, and no timing or outcome data was actually measured. Its evidence state is UNVERIFIED and stays UNVERIFIED until an organization applying this guide records its own real, independent verification evidence — the label must not be upgraded merely because the guide's reasoning is internally consistent.",
  ],
  limitations: [
    "This guide addresses the general principle of verifying an automated security action's actual effect; it deliberately does not cover backup or disaster-recovery restoration, which the sibling article 'A Backup Is Not Proven Until It Is Restored' already covers in depth. A reader arriving here for that specific case should read that article instead of expecting this one to repeat it.",
    "It describes a verification discipline, not a specific firewall product's rule-evaluation order, a specific identity provider's token-caching behavior, a specific patch-management or container-registry tool's layer-caching mechanics, or a specific EDR product's isolation-policy scope. Applying it requires translating each item into the actual tooling in use and independently re-validating the result there.",
    "It does not cover the detection engineering needed to notice an in-progress attempt to disable or bypass one of these automated actions (for example, monitoring for the ATT&CK T1562 behaviors referenced above) — that is a detection-engineering concern, addressed separately from this control-verification guide.",
    "It does not cover how to design the underlying automated action itself to fail closed when its own dependency is unavailable — that structural question is addressed by the sibling deep-dive 'Designing Fail-Closed Security Automation.'",
  ],
  defensiveRecommendations: [
    "Never accept an automated security action's exit code, API response, log entry, or dashboard status as evidence of its actual effect on its own — require an independent verification check as the real evidence.",
    "For each category of automated action in scope, write down the specific claim it makes about resulting state (traffic blocked, credential rejected, patched code running, host unreachable) before designing how to verify it.",
    "Source verification from a vantage point that does not share the automation's own reporting path, credential, or network position, so a shared failure mode can't make the action and its check agree incorrectly.",
    "Keep verification results in a durable record separate from the automation's own log, with method, vantage point, timestamp, and outcome, so a later reviewer isn't relying on the same tool whose claim is being checked.",
    "Recur verification on a defined cadence and after related configuration changes, not only once immediately after the action — a genuinely verified effect can be silently undone later.",
    "Where independent verification cannot be safely performed against a real target, record the control as UNVERIFIED explicitly rather than inferring success from the action's own completion signal.",
  ],
  keyTakeaways: [
    "An automated security action's completion signal proves the action was attempted and accepted by its own tooling; it does not prove the action's intended security-relevant effect actually exists in the world.",
    "Firewall-rule deployment, access revocation, patch rollout, and quarantine actions each make a specific claim about resulting state — traffic blocked, credential rejected, patched code running, host unreachable — that requires its own independent verification, not just a green checkmark.",
    "Verification has to come from a vantage point that doesn't share the automation's own failure mode, or it can fail the same way and agree with the original claim incorrectly.",
    "A verified effect does not carry forward indefinitely — a later, unrelated change can silently undo it, which is why verification has to recur on a defined cadence, not run only once.",
    "This is the same underlying discipline this catalog applies to backups in 'A Backup Is Not Proven Until It Is Restored,' generalized to automated security actions broadly.",
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
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "Access to an out-of-band verification method independent of each automation tool's own reporting — a separate scanner, a second system, an authorized test client, or an out-of-band API — for at least one class of automated action in scope.",
    "Authority to run a verification check against the actual target (attempt blocked traffic, use a revoked credential, query a running service's version, probe an isolated host) without that check itself being blocked by the same control it's testing.",
    "A defined inventory of which automated security actions in your environment currently report success via completion signal only (exit code, API response, log entry, dashboard status), to prioritize verification work.",
  ],
  procedure: [
    "Catalog every automated security action whose current evidence of success is limited to its own completion signal, across firewall-rule deployment, access revocation, patch rollout, and quarantine/isolation actions.",
    "For each cataloged action, write down the specific security-relevant claim it makes about resulting state — not the command or API call performed, but the state that call is supposed to produce (for example, 'traffic on this path is blocked,' not 'the rule-deployment call returned success').",
    "For firewall-rule deployment: from an authorized test vantage point, attempt the exact traffic the rule claims to affect, and confirm the observed behavior matches the rule's intent — not merely that the rule appears in the applied ruleset.",
    "For access revocation: attempt to use the revoked credential, session, or token against the actual protected resource, and confirm it is rejected there — not only that the identity system's own API returned success for the revoke call.",
    "For patch rollout: query the actual running service for its version, build identifier, or attestation, and compare it against the intended patched version — not only that the deployment pipeline's stages all reported completion.",
    "For quarantine/isolation actions: from a separate network vantage point outside the isolated host's own agent, confirm the host is genuinely unreachable through the paths the quarantine claims to sever.",
    "Design each verification check to run from a vantage point, credential, or network position independent of the automation being checked, so a shared failure mode can't produce a false agreement between the action's log and the verification result.",
    "Record every verification's method, vantage point, timestamp, and outcome in a durable record distinct from the automation's own log, retained for audit.",
  ],
  validation: [
    "Re-run each independent verification check on a defined recurring cadence, and after any related configuration change, not only immediately after the original action — a genuinely verified effect can be silently undone later.",
    "Confirm each verification method doesn't share a failure mode with the automation it's checking (for example, a firewall-verification scanner routed through the same enforcement point it's testing is not independent evidence).",
    "Where independent verification cannot be safely performed against a real target — no authorized test path exists, or testing would itself be disruptive — record that control explicitly as UNVERIFIED rather than inferring success from the completion signal alone.",
    "Periodically sample verification records against the automation's own logs for the same actions, and treat any pattern of logs reporting success where verification finds otherwise as a finding about the automation platform itself, not an isolated incident.",
  ],
  rollback: [
    "If a verification check reveals a claimed effect did not actually occur — a rule not really blocking traffic, a session not really revoked, a patch not really running, a host not really isolated — treat this as a control failure requiring immediate remediation of the underlying automated action, not merely a logging discrepancy to note and move past.",
    "If a verification method itself proves unreliable, unsafe to run recurringly, or too disruptive against a real target, redesign the method (a narrower authorized test path, a lower-impact probe) rather than reverting to trusting the completion signal alone.",
    "Escalate a systemic pattern — multiple automated actions whose logs report success but independent verification repeatedly finds otherwise — as a platform-level finding, since it suggests the gap is structural to how the automation reports on itself, not specific to one action.",
    "Keep a dated record of when independent verification became a routine, enforced part of each automated action's workflow versus when the action was trusted on its completion signal alone, so a later reviewer can tell when the control actually started providing real evidence.",
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
};
