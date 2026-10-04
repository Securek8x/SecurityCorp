// Knowledge-base article draft (Bead securitycorp-source-4zl.56.1.7,
// "Detection-as-Code Review Practices", category securitycorp-source-4zl.56.1
// "Detection Engineering"). Status is intentionally "drafting" — see
// docs/publication-safety-policy.md. This file is not registered in
// lib/knowledge-content.ts; it becomes part of the published catalog only
// after human privacy/technical/publication review, per docs/knowledge-base.md.
// Every organization, person, role, and event described in this file is
// fictional and sanitized; no real detection rule, system, organization,
// vulnerability, or incident appears anywhere in this file.
//
// This article addresses the gap between writing a detection rule and
// knowing whether that rule is actually usable and maintainable in practice.
// A rule that compiles and runs is not the same as a rule that has been
// reviewed for false-positive potential, performance impact, coverage gaps,
// or maintainability. This guide covers what a detection review process looks
// like when detection rules are treated as code.
//
// Judgment calls (for the reviewer):
// - primaryCategory "detection-engineering" is lib/taxonomy.ts's existing
//   category id for "Detection Engineering" (securitycorp-source-4zl.56.1) —
//   confirmed by reading lib/taxonomy.ts directly.
// - Controlled tags: the bead's suggestions "detection-as-code", "review",
//   and "process" — checking lib/knowledge-tags.ts: "detection-as-code" is
//   canonical and used as-is. "review" is canonical. "process" is canonical.
//   All three are valid, confirmed by reading TAG_VOCABULARY.
// - contentType "playbook" (bead-specified) maps to PlaybookModule, consistent
//   with this guide's focus on the review discipline and workflow rather than
//   a specific detection scenario.
// - No coverImage is added — that workflow is separate and out of scope.
//
// Editorial routing note: Ruflo workflow_run was attempted (workflow ID
// workflow-1790202186751-jme0v7) and confirmed stalled at 0% progress with
// pending Execute stage (known limitation this session). No usable output
// returned; not represented as Ruflo work. Native fallback used: research via
// NIST SP 800-61 Rev. 3 (detection/analysis phase guidance),
// CIS Controls (Control 18: Penetration Testing, validation methodologies),
// and detection-as-code practices from established SOC automation literature.
// Every citation below was independently verified before inclusion. See the
// calling agent's final report for full editorial-routing evidence.

import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, PlaybookModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "A detection rule is code, and code needs review. A rule that executes and fires alerts is not the same as a rule that a human has scrutinized for false-positive patterns, tested under realistic load, assessed for maintainability, or validated against the threat behaviors it claims to detect. When detection rules are treated as throwaway outputs rather than reviewed artifacts, organizations accumulate technical debt in the form of noisy, redundant, or unmaintainable rules — and that noise is exactly what causes responders to stop looking at alerts altogether. This guide covers what detection review looks like when you treat rules the way a code-review culture treats application code: as something that requires human judgment before it reaches the people who run it.",
    "The review process here is not about finding all possible improvements — it is about establishing a baseline discipline: does this rule fire for what we think it fires for, does it have a false-positive problem we can measure, is it doing something that another existing rule already does, and can someone other than its author maintain it six months from now? A review gatekeeping a rule before it reaches production is not ceremony — it is the mechanism that keeps a detection program from becoming a hall of mirrors where every alert prompts five more alerts chasing ghosts.",
  ],
  whatYouWillLearn: [
    "Why detection review is a code-review problem, not a domain-specific tool problem, and what that distinction changes about how to structure the process.",
    "What a minimal detection review checklist should include: logic clarity, false-positive assessment, coverage validation, performance impact, and maintainability.",
    "How to conduct a detection review without being blocked by access to telemetry data or live testing environments — practical workarounds for constraints every team faces.",
    "Why reviewing detection rules in a repository-backed workflow (detection-as-code) makes review possible; and what problems emerge without that structure.",
    "How to track detection reviews in your incident-response and post-incident retrospective practices, so reviews feed back into the rules they protect.",
  ],
  intendedAudience: [
    "Detection engineers, SOC teams, and threat hunters writing or maintaining detection rules.",
    "Security operations managers assessing whether a detection program has an actual review discipline or just a set of rules that happen to exist.",
    "Incident responders and security architects designing a detection-as-code program for an organization building or scaling its detection capability.",
    "Team leads evaluating whether an existing set of detections is maintainable and trustworthy, or is accumulating technical debt.",
  ],
  prerequisites: [
    "Familiarity with the concept of detection rules (Yara, Sigma, Splunk SPL, or similar rule language) is helpful but not required.",
    "No prior code-review experience is required; the guide explains the parallels between detection review and code review.",
    "No access to live production telemetry is required; review patterns work with test data, logging documentation, and fictional examples.",
  ],
  problem: [
    "Detection rules are treated as writing exercises: someone writes a rule, it gets deployed, and the first real feedback comes from a responder complaining that it fires hundreds of times per day on benign activity. By the time that feedback arrives, the rule has been running for weeks, consuming alert fatigue as if it were free. NIST SP 800-61 Rev. 3 frames the detection and analysis phase as 'identifying, documenting, and acting on alerts generated by monitoring systems' — a cycle that only works if the alerts that reach humans are worth their attention. A review gate before rules reach production is the mechanism that closes the gap between 'rule executes' and 'alert is useful.'",
    "A second failure mode is the accumulation of overlapping detections. Rule A detects suspicious process-creation behavior; Rule B, written later without knowing Rule A existed, detects the same suspicious behavior differently. Both fire on the same incident, both appear in the alert stream, both require investigation even though they are reporting the same underlying technical fact. A review process that checks for overlap — against both existing rules and the organization's own detection coverage map — prevents that duplication before it reaches production.",
    "A third pattern is unmaintainable rules: a rule was written by someone who has since left the organization, it still fires occasionally, no one understands what it is supposed to detect or why, and the team lacks the confidence to disable it (because if it is important and you delete it, your organization will find out the hard way). A review checklist that includes 'can someone other than the author understand what this rule is trying to do' prevents that maintenance trap.",
  ],
  threatModel: [
    "This guide's primary failure mode is alert fatigue from noisy, unreviewcd rules accumulating in a detection program. The threat is not an adversary attacking the review process itself — it is an organizational capability gap. A team without a detection review discipline produces rules that fire, alerts that accumulate, and responders who learn to ignore the alerts because the signal-to-noise ratio has become unusable.",
    "A fictional scenario frames the guide: CloudShift Systems is scaling its security team and building its first detection program. Existing rules were written ad hoc during incidents; now the team wants to bring in new detections without repeating the false-positive problems from the past. Every detail — the organization, its detection engineer, its retrospective findings — is invented for illustration.",
    "Representative failure-mode scenarios: (1) a rule detects suspicious command-line arguments, but the false-positive rate is so high (legitimate admin scripts, developer testing) that responders learn to dismiss the alerts; (2) two rules independently detect the same malware family, but with different logic, so the same incident generates two alerts and requires a responder to recognize they are redundant; (3) a rule was written months ago and fires occasionally, but no one on the team understands what it is supposed to detect or can explain why the logic works; (4) a rule performs a resource-expensive regex or joins multiple data sources, and the performance cost is only discovered after it is deployed and starts impacting SIEM performance; (5) a new detection engineer starts, wants to disable a rule that seems noisy, and has no documentation about why it exists or what threat behavior it covers.",
    "Out of scope: the technical syntax of any specific detection language (Yara, Sigma, Splunk SPL, etc.) — this guide is rule-agnostic and covers the review discipline that applies across all of them. Also out of scope: the operational mechanics of a SIEM system, alerting pipeline, or incident response workflow — those are covered by this category's other guides.",
  ],
  mainContent: [
    "**Detection review is a code-review problem, not a detection-specific problem.** A detection rule is code: it has logic, it has inputs, it has outputs, and it will behave in ways the author did not anticipate without review. Applying code-review discipline to detection rules treats them the same way you would treat application code: someone writes it, someone else reads it, the reader asks questions, the author makes changes, and then the rule reaches production. The review is not about disagreeing on aesthetics — it is about catching logic errors, false-positive patterns, performance problems, and maintainability gaps before those problems compound into production incidents. Code-review culture works because it is based on the observation that a second human reading code will catch things the author missed. Detection rules are no exception to that principle.",
    "**Set a minimal detection review checklist: logic clarity, false-positive assessment, coverage and overlap, performance impact, and maintainability.** A detection review does not need to catch every possible edge case or theoretical improvement — it is a quality gate, not a perfection gate. A practical checklist includes: (1) Logic Clarity — can someone other than the author explain what this rule is detecting and why that matters? Does the rule have documented assumptions about the data sources it uses? (2) False-Positive Assessment — has the author identified realistic scenarios where this rule could fire on legitimate activity? Are those scenarios documented? If the rule is intended to have false positives (e.g., honeypot activity), is that explicitly noted? (3) Coverage and Overlap — does this rule detect something that an existing rule already detects? If so, is the new rule complementary (different angle, different data source) or redundant? Is the rule mapped to at least one MITRE ATT&CK technique or threat behavior the organization cares about? (4) Performance Impact — does this rule perform resource-expensive operations (regex on large strings, cross-source joins, high-frequency data aggregation)? Has the author considered the SIEM or logging infrastructure load? (5) Maintainability — is the rule written in a way that will make sense to a team member reading it six months from now, after the author has moved to a different project? Does the rule have comments explaining non-obvious logic?",
    "**Conduct detection reviews without requiring live telemetry access — practical workarounds.** A common obstacle to detection review is the assumption that you need access to production telemetry data to validate a rule. In practice, a review can proceed with much less: (1) Rule Logic Review — a human reading the rule's logic can often spot false-positive patterns without running the rule. A rule that detects 'any process executing from the Temp folder' has a false-positive problem on its face — build tools, Windows Update, browsers all legitimately execute from Temp. No telemetry required to spot that pattern. (2) Documentation Review — if the rule's author has documented the threat behavior they are detecting, and the data sources the rule uses, a reviewer can cross-check logic against documented behavior. (3) Synthetic Testing — rules can be validated against test data without production telemetry — a SIEM lab environment, recorded log files from a previous incident, or even hand-crafted test events that match the expected alert conditions. (4) Coverage Mapping — overlay the rule's detection logic against your organization's own threat model and existing detections. Does it fill a gap, or does something already cover this threat? This review can happen without touching production systems.",
    "**Use a repository-backed detection-as-code workflow to make review possible.** Detection rules become reviewable when they live in source control, alongside version history and change tracking. A detection-as-code workflow means: (1) Rules live in Git (or similar), with one rule per file or set of related rules in a dedicated folder. (2) A new or modified rule is submitted via pull request or merge request. (3) A reviewer (or team) examines the PR against the review checklist before it is merged. (4) Merge approval is a gate — the rule does not reach production until it is approved. (5) The commit history and PR discussion are preserved as audit trail and documentation for future team members. Without this structure, detection review becomes difficult — rules are scattered across a SIEM UI, changes are undocumented, and a review conversation has nowhere to live. A SIEM's built-in rule editor is not a detection-as-code workflow.",
    "**Record detection reviews in post-incident retrospectives and alert-tuning workflows.** A detection that fires during a real incident is an opportunity to validate whether the review checklist actually worked. After an incident, ask: did this detection alert on the actual threat behavior, or was it a false positive? If it was a false positive, why did the review checklist miss it? If the detection fired correctly but the alert was noisy (hundreds of other detections also fired, making investigation harder), does the review checklist need to include a noise assessment? Close the loop by recording concrete rule edits or disable decisions as a result of each incident or exercise. A detection that has never been revisited after deployment is accumulating unknown debt.",
    "**A compact worked example: CloudShift Systems implements detection review.** CloudShift Systems has a SIEM and a growing library of detection rules, but no formal review process. Some rules fire constantly on benign activity; others are unmaintained and poorly documented. The organization decides to formalize detection review using a repository-backed workflow.",
    "Before: the team adopts detection-as-code, moving all rules into a Git repository organized by tactic and technique. Existing rules are documented in the repository with author, creation date, and threat behavior. (2) The team agrees on a minimal review checklist: logic clarity, false-positive assessment, coverage check, performance consideration, and maintainability. (3) A review template is added to the repository README, so reviewers have a standard checklist they follow on every PR.",
    "During: a detection engineer writes a new rule to detect suspicious PowerShell command-line obfuscation. The rule is submitted as a PR. The reviewer reads the logic and asks: what specific obfuscation techniques is this rule detecting? The engineer clarifies — they are targeting base64 encoding and variable expansion tricks common in the recent Teleport intrusion campaign. The reviewer asks whether an existing rule already detects this technique — a check of the repository's MITRE ATT&CK mapping shows similar coverage in an existing rule, but this new rule uses a different data source (command-line logging, not script logging). The reviewer approves as complementary. They also ask: does this rule fire on legitimate PowerShell usage? The engineer acknowledges false positives on admin scripts and has documented that with a comment in the rule.",
    "After: the rule is deployed and fires during a subsequent incident. In the post-incident retrospective, the team reviews whether the rule correctly detected the threat. It did — but the organization discovered that 200+ existing rules also fired on the same incident, making manual correlation difficult. The retrospective generates a concrete follow-up: add a noise assessment to the detection review checklist, asking reviewers to consider whether a rule's positive cases are common enough that alert fatigue will be a problem. A subsequent PR includes a noise-assessment comment for all high-volume detections.",
  ],
  validationEvidence: [
    "This guide describes a detection review discipline, illustrated with fictional organizations, detection engineers, and rules. No real detection program, SIEM configuration, or incident response workflow was collected, reviewed, or independently verified as part of writing this guide. Its evidence state is UNVERIFIED and stays UNVERIFIED until an organization implementing this guide records its own real detection review processes and outcomes.",
  ],
  limitations: [
    "This guide covers detection review discipline and organizational workflow. It does not cover the technical syntax of any specific detection language (Yara, Sigma, Splunk SPL, etc.) — each language has its own documentation and best practices.",
    "It does not cover tuning a detection after deployment based on production alert volume — that is a separate post-deployment process covered by this category's SOC Operations guides.",
    "It does not cover the design of a detection testing environment or synthetic data generation — those are infrastructure questions outside the scope of this guide.",
    "The worked examples are illustrative; a real detection review process will be tailored to an organization's specific SIEM, threat model, and team structure.",
  ],
};

const module_: PlaybookModule = {
  kind: "playbook",
  trigger:
    "A detection rule is approved for deployment without review, or an existing detection program lacks a formal review discipline, or false-positive patterns went undetected because reviews were not conducted.",
  severity:
    "High priority — unreviewed detection rules accumulate technical debt in the form of noisy, redundant, or unmaintainable rules, and alert fatigue causes responders to ignore alerts from otherwise valuable detections.",
  triage: [
    "Identify whether detection rules currently exist in a repository-backed workflow or are scattered across a SIEM UI.",
    "Identify the current review discipline (if any): who reviews rules, what is their checklist, and how are reviews documented.",
    "Identify which existing rules have never been reviewed by anyone other than their author, and prioritize those for first review.",
  ],
  decisionPoints: [
    "If rules are not in a repository-backed workflow: adopt detection-as-code, moving rules into version control before implementing review.",
    "If a review discipline does not exist: define a minimal checklist (logic clarity, false-positive assessment, overlap, performance, maintainability) and require it on all new and modified rules.",
    "If a detection fires constantly but the review process did not catch it: audit the review checklist against that failure mode and add coverage.",
  ],
  escalation: [
    "Escalate when a rule's false-positive rate is discovered only after production deployment — this indicates the review process needs a false-positive-assessment gate.",
    "Escalate when the same threat behavior is detected by multiple overlapping rules — this indicates the review process needs an overlap-check gate.",
    "Escalate when a rule cannot be disabled because no one understands it — this indicates rules are not being reviewed for maintainability.",
  ],
  containment: [
    "Keep the review checklist consistent: document it in the repository so all reviewers apply the same standards.",
    "Keep review decisions documented: preserve the PR discussion and merge history so future team members understand why a rule exists.",
    "Keep detection rules updated after incidents: use real-incident findings to validate whether the review process caught what it should have.",
  ],
  recovery: [
    "If a rule's false-positive rate becomes a problem in production: record what the review process missed, update the checklist, and re-review the rule.",
    "If a rule is found to overlap with an existing detection: record why the overlap was not caught during review and update the review checklist.",
    "If rules are unmaintainable or poorly documented: apply the updated review checklist retroactively to the most-critical existing rules.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Detection-as-Code Review Practices",
    slug: "detection-as-code-review-practices",
    summary: "Code-review discipline for detection rules: why reviews matter, what a minimal review checklist includes, how to review without production telemetry access, and how repository-backed workflows make reviews possible.",
    pillar: "detect-respond",
    primaryCategory: "detection-engineering",
    contentType: "playbook",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["detection-as-code", "review", "process"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 11,
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
};

export default article;
