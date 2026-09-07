// Knowledge-base article draft (Bead securitycorp-source-4zl.56.2.2, "False
// Positive vs Benign Positive", category securitycorp-source-4zl.56.2 "SOC
// Operations and Alert Tuning"). Status is intentionally "drafting" — see
// docs/publication-safety-policy.md. This file is registered in
// lib/knowledge-content.ts as a drafting-status entry; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md. Every organization, analyst, alert,
// and log detail in this file is fictional and sanitized; no real SOC case,
// alert configuration, telemetry, threshold, or employer-derived rule
// appears anywhere in this file.
//
// Judgment calls (for the reviewer):
// - primaryCategory "soc-operations" is lib/taxonomy.ts's existing category
//   id for "SOC Operations and Alert Tuning" (securitycorp-source-4zl.56.2)
//   — not invented.
// - Controlled tags: the bead's suggested "soc-operations" is a canonical id
//   in lib/knowledge-tags.ts and is used as-is. Its other two suggestions,
//   "triage" and "terminology", are not canonical tag ids — there is no
//   vocabulary entry for either. Closest real substitutes used instead:
//   "detection-engineering" (the false-positive half of this article's
//   distinction is a detection-logic-defect concept, and taxonomy already
//   scopes SOC Operations' own "triage" example subject under
//   "soc-operations" itself, so no separate triage tag is needed), and
//   "incident-response" (the terminology this article defines — true
//   positive / false positive / benign true positive — is sourced from
//   incident-classification guidance: NIST SP 800-61's incident-handling
//   framework and NIST SP 800-86's activity-classification definitions,
//   both incident-response documents, plus a vendor incident/alert
//   classification workflow).
// - contentType "playbook" (bead-specified) maps to PlaybookModule
//   (lib/knowledge-content-types.ts), following the same non-live-incident
//   mapping the sibling tuning article used: each field describes the
//   process of reaching and recording a disposition decision, not a live
//   incident. Restated inline above the module below.
// - No coverImage is added — that workflow is separate and out of scope for
//   this task.
// - No diagram is added. The contrast this article teaches is a binary
//   classification decision (does the underlying event match the
//   detection's own stated criteria, or not) rather than a multi-node
//   system flow — the worked examples in mainContent make the contrast
//   concrete without needing a second, redundant visual representation.
// - relatedSlugs point at "tuning-soc-alerts-without-hiding-real-attacks"
//   (verified via that file's meta.slug, not its filename — this article is
//   conceptually prior to it: correctly classifying why an alert isn't a
//   real attack has to happen before any tuning decision, and that
//   sibling's tuning advice assumes this distinction is already made) and
//   "turning-attack-hypothesis-into-detection" (verified via that file's
//   meta.slug; relevant background for the false-positive/logic-defect side
//   of the distinction). Neither sibling's own content is repeated here —
//   both are cross-referenced briefly.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788741682686-ij5sox, template "research", task
// describing this article's research brief needs: NIST/MITRE/CISA-grounded
// terminology sources for "false positive," "true positive," "false
// negative," and alert-disposition classification). A bounded
// mcp__ruflo__workflow_status check afterward showed it reproduced the
// documented issue in CLAUDE.md: 0% progress, a single pending "Execute"
// step, no retrievable editorial output. This draft was therefore produced
// with the disclosed native fallback instead — separate research (primary-
// source verification via WebFetch against csrc.nist.gov and
// learn.microsoft.com, not recalled from memory — this is what surfaced the
// exact NIST SP 800-86 false-positive/false-negative definitions and
// Microsoft Defender for Identity's TP/B-TP/FP classification scheme used
// below), drafting, technical-verification, publication-safety, and final
// editorial passes — not credited to Ruflo. See the calling agent's final
// report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, PlaybookModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "Every SOC alert that doesn't turn into an incident gets closed with some disposition, and most SOCs use two categories to describe \"not a real attack\": false positive and benign positive. Treating them as interchangeable — both just mean \"nothing to do here\" — is a common shortcut, and it produces a specific, predictable failure: the fix that's correct for one is actively harmful when applied to the other.",
    "The distinction is not about how serious the alert felt or how much analyst time it wasted. It's about where the mismatch actually happened. A false positive means the detection's own logic fired on something that does not meet the criteria the detection claims to evaluate — a defect in the logic or its inputs. A benign positive means the detection's logic worked exactly as designed, matched the real pattern it was built to find, and that pattern happened to be produced by legitimate activity this time. One is a bug. The other is a correct alarm about something that, on inspection, isn't a fire. This playbook is about telling them apart before deciding what to do about either one, using the same underlying alert type in both a false-positive and a benign-positive worked example so the contrast stays concrete. Every organization, analyst, and alert described here is synthetic.",
  ],
  whatYouWillLearn: [
    "The precise, mechanism-level difference between a false positive (a logic or implementation defect) and a benign positive (correct logic, legitimate activity) — not a severity or annoyance distinction.",
    "Why treating a benign positive as if it were a false positive leads a team to tighten or suppress detection logic that was never broken, quietly creating a blind spot for the genuine attack pattern the rule exists to catch.",
    "Why treating a genuine false positive as if it were a benign positive lets a real logic defect stand unfixed, so the same defect keeps firing (or keeps not firing) indefinitely.",
    "A worked, fully fictional example of each category using the same alert type, so the same alert firing can be either disposition depending on what actually happened underneath it.",
    "How to document a disposition decision so the next analyst who sees a similar alert doesn't have to re-derive the reasoning from scratch.",
  ],
  intendedAudience: [
    "SOC analysts who close alerts daily and choose a disposition for each one.",
    "Detection engineers who need an unambiguous handoff from analysts: which alerts represent an actual defect in their logic, versus which represent their logic working correctly.",
    "Team leads reviewing disposition patterns to decide whether a detection needs a logic fix, a documented exception, or neither.",
  ],
  prerequisites: [
    "Basic familiarity with how a SIEM or detection platform evaluates and fires an alert — a rule, a condition, a match against a defined pattern.",
    "No lab environment is required; every example in this guide is fictional and descriptive, not a runnable exercise.",
    "Reading this site's companion guide on tuning SOC alerts is useful follow-up, not a prerequisite — this article covers the classification question that guide's tuning techniques assume is already answered correctly.",
  ],
  problem: [
    "NIST's guidance on incident handling treats detection and analysis as fundamentally a triage problem: precursors and indicators arrive continuously, and an analyst has to decide, alert by alert, whether each one warrants further action. That decision has exactly three possible outcomes worth naming precisely: the alert correctly identifies something that shouldn't be happening (a true positive), the alert's own logic didn't actually match what it claims to detect (a false positive), or the alert's logic matched correctly but the matched activity turns out to be legitimate (a benign positive, sometimes written as a benign true positive).",
    "In practice, the second and third outcomes both get closed the same way — \"not an attack,\" queue moves on — and both reduce alert volume if suppressed. That surface-level similarity is exactly the problem. A team that records only \"true positive\" or \"not true positive\" has thrown away the one piece of information that determines the correct next step: whether the alert's underlying logic has a defect that needs fixing, or whether the logic is fine and the trigger condition was simply benign this particular time. Get that backwards — narrow or suppress a rule's logic in response to a benign positive — and the fix removes the rule's ability to catch the real attack pattern it exists to find, because the logic wasn't the problem; the removed coverage was.",
  ],
  threatModel: [
    "This is not an adversary threat model in the usual sense. The risk here is a defensive process failure: an analyst or detection engineer, acting on an accurate but incomplete disposition record, applies the wrong category of fix and either leaves a real defect unaddressed or quietly narrows a detection that was never broken.",
    "Representative scenario, fictional throughout: a mid-size cooperative we'll call Meridian Ledger Cooperative runs a SOC whose SIEM includes a detection named \"Excessive Authentication Failures.\" It fires whenever a single account's failed-login count exceeds a configured volume threshold within a fixed time window — a standard implementation aligned with MITRE ATT&CK T1110, Brute Force. Two separate weeks produce two alerts from this same detection, described below; each has a different underlying cause, and each needs a different response.",
    "Failure modes to watch for when a team doesn't separate these categories: (1) an analyst notices a detection fires often and assumes high volume alone means the logic is faulty, without checking whether each individual firing actually matched real, legitimate activity (a benign-positive pattern, not a defect); (2) a detection engineer, asked to \"reduce false positives\" on a rule, tightens its matching logic in response to a report that was actually describing legitimate-but-real matches, removing coverage rather than fixing a bug; (3) a genuine logic defect (a parsing bug, a misattributed field, a broken correlation join) gets waved through as \"probably just noise\" without anyone checking whether the underlying event the alert describes actually occurred as described, leaving the defect to keep misfiring or keep missing indefinitely; (4) disposition decisions are recorded as a single true/not-true flag with no note on which of the two \"not true\" categories applied, so a future reviewer re-derives the same investigation from nothing.",
    "Out of scope: the tuning techniques used once a benign positive has been correctly identified and a suppression or exception is warranted — see this site's guide on tuning SOC alerts without hiding real attacks — and the mechanics of authoring or debugging detection logic in any specific SIEM product.",
  ],
  mainContent: [
    "**False positive: the logic fired on something that does not meet its own stated criteria.** A detection rule is a claim: \"I will fire when condition X is met.\" A false positive means the rule fired, but condition X — as the rule itself defines it — was not actually met. The mismatch lives inside the detection's own mechanics: a parsing bug that miscounts events, a field-normalization error that merges two distinct accounts' activity into one, a correlation join that matches events that shouldn't be joined, a timezone or clock-skew bug that puts events in the wrong window, a data-source outage that produces malformed records the rule misinterprets. None of these require the described attack pattern to have happened at all — the alert is describing something that, on inspection, the evidence does not actually show. NIST SP 800-86 defines a false positive plainly, in the incident-response context, as incorrectly classifying benign activity as malicious; the incorrectness is the defect. The correct fix is a logic fix: correct the parsing, the field mapping, the join, the clock handling, or whatever specific mechanism produced a match the rule's own criteria don't actually support.",
    "**Benign positive: the logic worked correctly, and the matched activity is legitimate.** A benign positive (also called a benign true positive) means condition X, as the rule defines it, actually was met — the detection correctly identified the real pattern it was built to find — and the activity that produced that pattern turns out to be legitimate rather than an attack. Microsoft's Defender for Identity documentation states this classification scheme directly for its own alerts: a true positive is a malicious action the detection correctly identified; a benign true positive is \"an action detected... that is real, but not malicious, such as a penetration test or known activity generated by an approved application\"; a false positive is a false alarm where the described activity did not actually happen. The detection logic did its job in the benign-positive case. The problem is entirely in the outside-world context the rule has no way to evaluate on its own — who initiated the activity, and why. The correct fix, if one is warranted at all, is a narrowly scoped, time-boxed, owned exception for the specific verified cause, not a change to the rule's underlying logic.",
    "**Same alert type, two different underlying causes — Meridian Ledger Cooperative's false positive.** In week one, the \"Excessive Authentication Failures\" detection fires against a service account, `svc-ledger-batch`, reporting forty-one failed logins within the configured window — well above the threshold. Investigation of the raw authentication logs shows the service account actually failed to authenticate only three times that day; the alert's count was inflated by a log-normalization defect that had recently started merging two distinct source identifiers (the service account and an unrelated interactive account that happened to share a truncated display name after a recent identity-provider migration) into a single counted entity. The rule's own stated criterion — more than the threshold number of failures for one account — was never actually met by either real account. This is a false positive: the detection's counting logic, not the world, produced the match. The fix is correcting the identifier-normalization defect in the log pipeline feeding the rule, not touching the rule's threshold or adding an exception for the service account.",
    "**Same alert type, week two — Meridian Ledger Cooperative's benign positive.** The same detection fires again, this time against a different account, `svc-ledger-batch` again but on a different day, reporting thirty-eight failed logins within the window. Investigation of the raw logs this time confirms the count is accurate: the account genuinely failed to authenticate thirty-eight times. The cause, verified against the organization's own change record, is a scheduled, previously authorized credential-rotation exercise: the account's password was rotated, and an internal batch job that had not yet picked up the new credential retried on its old schedule until an operator updated its configuration. The detection's logic worked exactly as intended — it correctly identified a real, high-volume string of authentication failures against one account, which is precisely the pattern MITRE ATT&CK T1110 describes. The activity was real and it matched. It also was not an attack; it was a known, verifiable side effect of an authorized change. This is a benign positive: nothing about the rule's logic needs to change. What's warranted, if this specific batch job's rotation lag recurs, is a narrow, time-boxed exception scoped to that job's account and a documented expiry — not a threshold change that would also reduce sensitivity to every other account the rule protects.",
    "**Why getting the category wrong picks the wrong fix.** If Meridian's SOC had treated week one's false positive as a benign positive, the likely response would have been to add a standing exception for `svc-ledger-batch` — which would not fix the underlying identifier-merging defect, would leave it free to keep corrupting counts for other accounts sharing a truncated display name, and would additionally leave that specific account uninspected the next time it genuinely failed to authenticate. If Meridian's SOC had treated week two's benign positive as a false positive, the likely response would have been to tell the detection engineer the rule was \"too sensitive\" and ask for the per-account threshold to be raised — a change that has nothing to do with what actually happened (a real, high-volume failure burst, correctly detected) and that would raise the bar for detecting a real brute-force attempt against every account the rule covers, not just the one that happened to have a documented benign cause that week.",
    "**The evidence question that separates the two categories.** In both directions, the deciding question is the same: did the event the detection describes actually occur, exactly as the detection's own criteria state it? If the answer, on inspection of the raw underlying data, is no — the described condition wasn't really met — the category is false positive, and the fix belongs to whoever owns the detection logic or its data pipeline. If the answer is yes — the condition really was met, on real data, by real activity — the category is (at worst) a benign positive, and the fix, if any, belongs to scoping a narrow, documented, time-boxed exception for the verified cause, never to the rule's general logic.",
  ],
  validationEvidence: [
    "This guide describes a classification distinction and its consequences, illustrated with two fictional alerts sharing one detection at a single fictional organization; it does not reproduce a real SIEM's alert data, a completed investigation, or measured outcomes from a real environment. Its evidence state is UNVERIFIED — the terminology and reasoning are grounded in the cited NIST and vendor documentation, but the worked examples are illustrative constructions, not validated case results.",
  ],
  limitations: [
    "This guide covers how to classify a closed, non-true-positive alert correctly. It does not cover the tuning techniques (thresholding, suppression, aggregation, enrichment, allowlisting) used once a benign positive is confirmed and an exception is warranted — see this site's guide on tuning SOC alerts without hiding real attacks for that.",
    "It does not cover triaging a suspected true positive or live incident response; both categories discussed here apply only after an alert has been determined not to represent an ongoing attack.",
    "It does not cover the mechanics of any specific SIEM or log pipeline's normalization, parsing, or field-mapping features, which vary by product and change over time.",
  ],
  defensiveRecommendations: [
    "Record a closed alert's disposition using at least three categories — true positive, false positive, benign positive — never collapsing the second and third into a single \"not true positive\" value; the category is the information the next step depends on.",
    "Before closing any non-true-positive alert, verify against raw underlying data whether the condition the detection claims to evaluate actually occurred. If it did not occur as described, the category is false positive, full stop, regardless of how routine or expected the underlying real activity turns out to have been.",
    "Route a false positive to whoever owns the detection's logic or its upstream data pipeline for an actual defect fix; route a benign positive to a scoped, owned, time-boxed exception process instead — never the reverse.",
    "Never respond to a benign-positive report by tightening or narrowing the detection's general matching logic; that logic was not the problem, and narrowing it removes real coverage.",
    "Never respond to a false-positive report with only a suppression or allowlist exception; an unaddressed logic defect will keep producing incorrect matches (or incorrect non-matches) on other accounts, sources, or occasions the exception doesn't cover.",
    "When a benign-positive cause could plausibly change or expire (a rotation schedule, a temporary job, an approved-but-time-limited activity), give any resulting exception an explicit owner and review or expiry date at creation time.",
    "Write down the specific evidence that determined the category — which raw log fields were checked, what they showed — not just the category label, so a future analyst seeing a similar alert can verify the same reasoning applies rather than re-deriving it or assuming it still does.",
  ],
  keyTakeaways: [
    "False positive and benign positive are not two words for the same outcome: a false positive means the detection's own logic didn't actually match what it claims to detect (a defect); a benign positive means the logic matched correctly and the matched activity is legitimate (a context problem).",
    "The same detection, and even the same account, can produce one of each on different occasions — Meridian Ledger Cooperative's fictional \"Excessive Authentication Failures\" alert fired once from a log-normalization defect (false positive, fix the pipeline) and once from a real, verified, authorized credential-rotation retry storm (benign positive, scope a narrow exception if it recurs).",
    "Getting the category wrong picks the wrong fix in both directions: suppressing a benign positive's underlying logic removes real detection coverage, while dismissing a false positive as \"probably fine\" leaves an actual defect unaddressed.",
    "The deciding question is always the same: did the condition the detection claims to evaluate actually occur, verified against raw data? Yes, and it just happens to be legitimate — benign positive. No — false positive, regardless of how serious the alert looked.",
    "Record the category and the specific evidence behind it, not just \"not a true positive,\" so the next analyst inherits a decision instead of a mystery.",
  ],
  references: [
    "NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response: https://csrc.nist.gov/pubs/sp/800/86/final",
    "NIST Computer Security Resource Center Glossary, \"false positive\": https://csrc.nist.gov/glossary/term/false_positive",
    "NIST Computer Security Resource Center Glossary, \"false negative\": https://csrc.nist.gov/glossary/term/false_negative",
    "NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile: https://csrc.nist.gov/pubs/sp/800/61/r3/final",
    "MITRE ATT&CK, T1110 Brute Force: https://attack.mitre.org/techniques/T1110/",
    "Microsoft Defender for Identity, \"View and manage Microsoft Defender for Identity security alerts\" (true positive / benign true positive / false positive classification): https://learn.microsoft.com/en-us/defender-for-identity/understanding-security-alerts",
  ],
  relatedSlugs: ["tuning-soc-alerts-without-hiding-real-attacks", "turning-attack-hypothesis-into-detection"],
};

// PlaybookModule (kind: "playbook") is written for the process of reaching
// and recording a disposition decision on a closed, non-true-positive
// alert — not for a live incident. "trigger" is what starts a disposition
// review, "severity" is how much verification rigor a specific disposition
// call warrants (not an incident severity), "containment" is the guardrail
// that limits a wrong disposition's blast radius before it reaches a
// detection-logic or exception change, and "recovery" is what to do if a
// disposition is later found to have been the wrong category.
const module_: PlaybookModule = {
  kind: "playbook",
  trigger:
    "An alert has been determined not to represent an ongoing true-positive attack, and an analyst or reviewer needs to record why — and specifically, which of the two non-true-positive categories applies — before anyone acts on that determination.",
  severity:
    "Not an incident severity — this rates how much verification a specific disposition call needs before it's recorded and acted on. Treat any disposition on a detection covering a high-impact technique (credential theft, lateral movement, data staging or exfiltration, ransomware precursors) as requiring the underlying raw data to be checked directly, not inferred from pattern or habit. Treat a disposition on a low-impact, well-understood, recurring detection as routine, but still requiring the category (false positive vs. benign positive) to be recorded, not skipped.",
  triage: [
    "Pull the raw underlying data the alert is based on — the actual log events, not just the alert's summary fields — and check whether the condition the detection claims to evaluate literally occurred as described.",
    "If the condition did not occur as described (the count, the account, the sequence, or the timing the alert reports doesn't match what the raw data actually shows), stop here: this is a false positive, and the next step is identifying the specific mechanism that produced an incorrect match.",
    "If the condition did occur as described on real data, identify the specific real-world cause of that activity (a change record, an authorized activity, a known job, a verified account owner) before concluding it's benign — a real, matching event with no identified cause is not yet a confirmed benign positive.",
  ],
  decisionPoints: [
    "If the raw data does not support the alert's own stated criteria having been met at all: classify as false positive and route to whoever owns the detection logic or its upstream data pipeline — the fix is correcting a defect, never a suppression or exception.",
    "If the raw data confirms the criteria were genuinely met, and a specific, verifiable legitimate cause is identified: classify as benign positive. If the cause could plausibly recur, consider a narrowly scoped, owned, time-boxed exception; if it's a one-time event, no exception is needed at all.",
    "If the raw data confirms the criteria were met but no specific legitimate cause can be verified: do not default to benign positive. Escalate as a potential true positive requiring further investigation rather than dispositioning on an assumption.",
  ],
  escalation: [
    "Escalate to whoever owns the detection's logic or data pipeline immediately after confirming a false positive, rather than letting a confirmed defect sit unaddressed until the next unrelated review cycle.",
    "Escalate to a second reviewer before creating any exception based on a benign-positive disposition for a detection covering a high-impact technique, regardless of how confident the initial verification felt.",
    "Escalate immediately, independent of this playbook's normal cadence, if verifying a suspected benign positive's cause turns up any detail that doesn't fully check out — treat that as a potential true positive requiring investigation, not as a disposition to finalize under time pressure.",
  ],
  containment: [
    "Do not let a benign-positive disposition trigger a change to the detection's general matching logic — the exception, if any, is scoped to the specific verified cause, never to the rule itself.",
    "Do not let a false-positive disposition close with only a suppression or allowlist entry — track the underlying defect as its own item until the logic or pipeline fix actually ships, so the defect doesn't keep producing incorrect matches elsewhere in the meantime.",
    "Scope every benign-positive exception as narrowly as the verified cause allows, with a named owner and an explicit review or expiry date recorded at creation time.",
  ],
  recovery: [
    "If a disposition is later found to have been the wrong category — a false positive that was actually a benign positive, or the reverse — correct the record and re-route it to the correct owner rather than leaving the original, incorrect fix in place.",
    "If a benign-positive exception is later found to have covered activity that was not actually legitimate, treat investigating that activity as the priority; the exception's own review runs afterward, as its own item, not folded into the investigation under time pressure.",
    "Review other alerts closed with the same disposition around the same time for the same underlying reason — a mischaracterized false positive or benign positive is rarely a single, isolated event.",
    "Record what specifically was learned about the miscategorization (which evidence was missed or misread the first time), so the same mistake isn't repeated on the next similar alert.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "False Positive vs Benign Positive",
    slug: "false-positive-vs-benign-positive",
    summary:
      "A playbook for telling apart two closed-alert categories SOC teams routinely conflate — a false positive (a detection-logic defect) and a benign positive (correct logic matching legitimate activity) — before deciding how to respond to either.",
    pillar: "detect-respond",
    primaryCategory: "soc-operations",
    contentType: "playbook",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["soc-operations", "detection-engineering", "incident-response"],
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
