// Knowledge-base article draft (Bead securitycorp-source-4zl.56.3.7,
// "Post-Incident Detection Improvements", category securitycorp-source-
// 4zl.56.3 "Incident Response and DFIR"). Status is intentionally
// "drafting" — see docs/publication-safety-policy.md. This file is
// registered in lib/knowledge-content.ts as a drafting-status entry; it
// becomes part of the published catalog only after human privacy/technical/
// publication review, per docs/knowledge-base.md. Every organization,
// analyst, host, account, and event described in this file is fictional
// and sanitized; no real incident, victim, system, employer, credential, or
// identifier appears anywhere in this file. No literal filesystem path
// appears anywhere in this file (fictional or otherwise) — locations are
// described in prose, consistent with this category's established practice
// in the sibling articles below.
//
// Third article filed under "Incident Response and DFIR"
// (securitycorp-source-4zl.56.3), after building-a-defensible-incident-
// timeline.ts and evidence-collection-before-containment.ts. This article
// covers the activity that follows both of those in the response
// lifecycle — turning a completed root-cause analysis and lessons-learned
// review into an actually-implemented, actually-validated detection
// change — rather than how to build the timeline or what to capture before
// containment.
//
// Judgment calls (for the reviewer):
// - primaryCategory "incident-response-dfir" is lib/taxonomy.ts's existing
//   category id for "Incident Response and DFIR" (securitycorp-source-
//   4zl.56.3) — not invented; confirmed by reading lib/taxonomy.ts
//   directly. That category's own exampleSubjects text already names
//   "post-incident improvement" as in-scope.
// - Controlled tags: the bead's suggestion "incident-response" is a
//   canonical id in lib/knowledge-tags.ts and is used as-is, as is
//   "detection-engineering". The bead's third suggestion, "improvement",
//   is NOT a canonical tag id and has no alias entry in TAG_ALIASES —
//   confirmed by reading the full TAG_VOCABULARY list. Closest real
//   substitute used instead: "security-control-validation" — this
//   article's central mechanism is exactly that verification discipline
//   (a proposed detection change isn't "done" until it's been validated
//   against a test corpus, mirroring the same tag's use in building-a-
//   defensible-incident-timeline.ts for an analogous verification
//   argument). Three tags total, within the 2-4 range this category's
//   acceptance criteria requires.
// - contentType "playbook" (bead-specified) maps to PlaybookModule
//   (lib/knowledge-content-types.ts). Unlike the two prior playbook-typed
//   articles in this category, this article's subject is a backlog/
//   improvement-tracking process rather than an in-the-moment response
//   action, so "containment" below is repurposed (as both prior articles
//   in this category also did, for their own differently-shaped subjects)
//   to describe keeping a proposed detection's scope bounded to the
//   generalized technique rather than the single incident's literal
//   artifacts — explained inline at the module definition.
// - No coverImage is added — that workflow is separate and out of scope
//   for this task.
// - PROPOSED / IMPLEMENTED / VALIDATED / DECLINED status labeling (Main
//   Content, Step 5) is this article's own status framework, not a direct
//   quotation from any cited source — it deliberately extends the same
//   discipline building-a-defensible-incident-timeline.ts uses for
//   CONFIRMED/HYPOTHESIZED entries (an explicit, structural status on
//   every item, not a caveat elsewhere) to a different lifecycle stage:
//   whether a proposed improvement has actually been implemented and
//   verified, not whether a timeline entry is evidenced.
// - Privilege realism: the worked example never depicts the fictional
//   actor performing an action requiring a privilege level not already
//   established earlier in the same example (the attacker holds only the
//   compromised low-privilege account's own valid credentials throughout;
//   RDP access to the second host succeeds because that account already
//   had legitimate access to it, not because of any escalation).
//
// Editorial routing note: this session's orchestrator had already
// confirmed, session-wide, that Ruflo's workflow executor was unusable
// before this article was assigned — workflow id
// workflow-1789326889333-sowtu4 remained at 0% progress with a single
// pending "Execute" stage and returned no retrievable editorial output,
// reproducing the same documented issue recorded elsewhere in this
// session. Per explicit instruction accompanying this task, no further
// mcp__ruflo__workflow_run attempt was made for this article specifically;
// this draft was produced entirely with the disclosed native fallback —
// separate research, drafting, technical-verification, publication-safety,
// and final-editorial passes, none of it credited to Ruflo. Every citation
// below was independently verified against its primary source before
// inclusion: NIST SP 800-61 Rev. 3 and NIST CSWP 29 (The NIST Cybersecurity
// Framework 2.0) were both fetched and their exact text extracted directly
// from the PDFs (including the precise ID.IM-03/ID.IM-04/RS.AN-03 outcome
// text and the CSF 2.0 Function/Category table), MITRE ATT&CK's T1021.001
// technique page and the ATT&CK Navigator project page were fetched
// directly, and Microsoft Learn's Event 4624 documentation was fetched
// directly for the Logon Type 10 (RemoteInteractive) definition; none were
// invented.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, PlaybookModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "Almost every post-incident review produces a list of recommendations, and almost every one of those lists includes some version of \"we should have detected this sooner.\" NIST SP 800-61 Rev. 3 describes exactly this pattern as a designed part of the incident-response lifecycle, not an afterthought: lessons learned from every function are meant to feed into a dedicated Improvement activity, and those lessons are then \"analyzed, prioritized, and used to inform all of the Functions\" — including Detect. What the framework does not do, and what this guide is about, is the harder operational question of what actually happens between a reviewer writing \"add a detection for this\" in a report and a validated rule existing in production that catches the generalized technique, not just the exact indicator from one incident.",
    "This guide treats a post-incident detection finding the same way a rigorous detection-engineering process treats any other proposed rule: it needs a root cause that names the specific kind of gap involved, a technique-anchored hypothesis instead of a literal-indicator rule, a synthetic test corpus before it ships, and an explicit, trackable status so a finding can't quietly die between the report and production. A compact, fully fictional worked example closes the guide, including a finding that is deliberately declined rather than turned into a permanent detection, because not every post-incident recommendation deserves one.",
  ],
  whatYouWillLearn: [
    "How to classify a post-incident detection finding into one of four distinct gap types — detection, telemetry, logic, or process — because each one has a different fix, and treating them interchangeably produces the wrong remediation.",
    "Why a detection improvement built directly from one incident's literal indicators (a specific host, account, or file path) tends to stop working the moment any of those details vary, and how to generalize the finding to the underlying technique instead.",
    "How NIST SP 800-61 Rev. 3's Improvement category (ID.IM) frames post-incident findings as an input to the organization's detection capability specifically — not only its incident-response plan — and what that means in practice.",
    "Why a proposed detection change needs the same synthetic-test-corpus validation as any other new detection before it counts as implemented, and why a rule that has never been tested against a true negative is an unverified assumption, not a fix.",
    "How to track a post-incident finding's status explicitly — proposed, implemented, validated, or deliberately declined — so a report's recommendation can't quietly vanish without a recorded reason.",
    "How a compact, fully fictional example applies all of this together, including one finding that gets a durable detection and one that is intentionally declined.",
  ],
  intendedAudience: [
    "Incident responders and detection engineers who own the follow-through from a post-incident review to an actual production detection change.",
    "Team leads running lessons-learned reviews who want recommendations to become tracked, closable work items instead of prose in a report nobody revisits.",
    "Security practitioners who have written detection rules before but not under an explicit framework for turning an incident finding into one without overfitting it.",
  ],
  prerequisites: [
    "Basic familiarity with how a security incident is investigated and documented — this guide assumes a root-cause analysis or lessons-learned review has already happened, not that this guide teaches how to run one.",
    "Some prior exposure to writing or reviewing detection logic is helpful; this guide builds directly on the hypothesis-to-detection method described in this catalog's detection-engineering articles rather than re-deriving it from scratch.",
    "No lab environment is required; every example in this guide is fictional and descriptive, not a runnable exercise.",
  ],
  problem: [
    "A lessons-learned meeting is good at surfacing that a gap existed. It is much less reliable at making sure that gap actually closes. \"We should detect this\" is easy to write down and easy to agree with in the room; it is a different thing entirely from a tested, deployed rule that catches the generalized technique the next time it appears in a different form. Between those two points sits a substantial amount of ordinary engineering work — classifying what kind of gap it actually was, generalizing past the one incident's specific artifacts, building and testing the logic — and none of that work happens automatically just because the finding was written down.",
    "The failure mode this produces is quiet rather than dramatic: a report says a detection gap was identified and will be addressed, the meeting moves on, and months later no one can say with confidence whether the corresponding rule exists, was tested, or was ever actually written. The organization's stated posture (\"we learned from that incident and fixed the gap\") and its actual posture (an unimplemented recommendation in an old document) diverge silently, and the next occurrence of the same technique is the only thing that reveals the difference — at the worst possible time to discover it.",
  ],
  threatModel: [
    "This guide's primary failure mode is not an adversary attacking the improvement process directly. It is a defensive process failure: a genuine, correctly identified finding from a real (fictional, here) incident fails to become a real detection change, either because no one classified what kind of gap it actually was, because the resulting rule was built too narrowly around the one incident's specific details, or because it was never tested before being declared \"done.\"",
    "A fictional scenario used throughout this guide: a small organization referred to here as Thistlewood Logistics investigates an incident in which an attacker who had already obtained a low-privilege employee account's valid credentials used them to establish a Remote Desktop Protocol (RDP) session from that employee's workstation to a second internal host the account also had legitimate access to, and used that access to browse file shares on the second host. No exploit or privilege escalation is involved anywhere in this scenario — the attacker only ever uses access the compromised account already legitimately had. Every detail below — the organization, hosts, account, and event set — is invented for illustration and does not describe any real environment, incident, or organization.",
    "Representative failure-mode scenarios, none requiring a sophisticated adversary to produce: (1) a post-incident report recommends \"block the specific external IP address the attacker used,\" and a rule is built for exactly that address — the rule has no ability to catch the same technique on the next occurrence, because the address was never the technique, only one instance of infrastructure; (2) a review finds that a technique wasn't detected and assumes the fix is new detection logic, when the actual root cause is a telemetry gap (the relevant log source wasn't retained long enough, or wasn't collected from the affected host at all) — writing logic against data that doesn't exist produces a rule that can never fire, for reasons unrelated to the logic itself; (3) a new detection rule is written and marked complete in the tracking report without ever being run against a synthetic true-positive or true-negative event, so its actual behavior in production is discovered for the first time when it either misses the next occurrence or floods the SOC with false positives; (4) a finding is legitimately not worth a permanent detection (a one-off, ephemeral piece of attacker infrastructure with no enduring value as a rule condition) but gets silently dropped rather than explicitly declined and recorded as such, so a later reviewer can't tell whether it was considered and rejected or simply forgotten.",
    "Out of scope: the mechanics of running the lessons-learned meeting itself or writing the incident report that precedes this guide's starting point (a separate topic); the internal architecture of any specific SIEM, EDR, or ticketing/backlog product; and any evaluation of a real organization's actual post-incident process. Thistlewood Logistics is illustrative throughout, not a reference architecture.",
  ],
  mainContent: [
    "**Step 1 — Classify the finding by gap type before deciding on a fix.** Not every \"we missed this\" finding has the same underlying cause, and the fix genuinely differs by type. A **detection gap** means no rule existed for the technique at all. A **telemetry gap** means the data a rule would need wasn't collected, wasn't retained long enough, or existed but with the relevant field unpopulated in practice. A **logic gap** means a rule existed and the right telemetry existed, but the rule's specific conditions (a threshold, a pattern, a field match) didn't cover the variant of the technique actually used. A **process gap** means an alert did fire but was missed, mistriaged, or arrived too late to change the outcome — which is a triage or escalation problem, not a detection-engineering one, and belongs with this catalog's SOC-operations and alert-triage material rather than this guide. Treating a telemetry gap as if it were a logic gap produces detection logic written against data that isn't there; treating a process gap as if it were a detection gap produces a new rule solving a problem the organization didn't actually have.",
    "**Step 2 — Root-cause the finding before writing anything.** NIST SP 800-61 Rev. 3 places root-cause analysis explicitly inside its Incident Analysis category: RS.AN-03 states that \"analysis is performed to establish what has taken place during an incident and the root cause of the incident,\" with the guide's own recommendation to \"analyze the incident to find the underlying or systemic root causes\" rather than stopping at a surface description of what happened. For a detection finding specifically, this means identifying which of Step 1's four gap types actually applies — not assuming detection logic is the fix just because \"detection\" is the word that comes to mind first.",
    "**Step 3 — State the improvement as a technique-anchored hypothesis, not a literal-indicator rule.** A rule built directly from one incident's specific host, account, file path, or external address catches exactly that one occurrence and nothing else — the moment any detail varies on a later attempt, the rule has nothing to match against. The fix is the same hypothesis-to-detection discipline this catalog's detection-engineering articles already describe: name the specific technique (ideally anchored to a MITRE ATT&CK technique ID), the specific attacker action, and the expected telemetry signature that action should produce — generalized past the one incident that surfaced it. This guide does not re-derive that method in full; see this article's related detection-engineering reading for the complete hypothesis-to-logic-to-test-corpus walkthrough.",
    "**Step 4 — Check existing coverage before building something new.** A post-incident finding that a technique wasn't caught doesn't automatically mean no detection exists for it anywhere in the environment — it may mean an existing rule has a gap in its specific conditions (a logic gap, per Step 1), or that the technique is covered for one telemetry source but not another. MITRE ATT&CK's Navigator tool is built specifically to visualize this kind of thing: it lets a team maintain a \"layer\" annotating which techniques in the ATT&CK matrix currently have detection coverage, and check a new finding against that existing layer before assuming a rule needs to be built from nothing. Building a redundant rule where a gap in an existing one would have sufficed adds maintenance burden without closing any coverage that wasn't already closed.",
    "**Step 5 — Track every finding's status explicitly: PROPOSED, IMPLEMENTED, VALIDATED, or DECLINED.** A recommendation sitting in a report with no further status is functionally indistinguishable from one that was forgotten. Borrowing the same discipline this category's timeline guide applies to evidence entries — an explicit, structural status on every item, not a caveat elsewhere — give every post-incident detection finding one of four states: PROPOSED (identified, not yet built), IMPLEMENTED (logic exists and is deployed), VALIDATED (tested against a synthetic corpus and confirmed to behave as intended), or DECLINED (considered and deliberately not turned into a permanent detection, with the reason recorded). A finding is not \"done\" at PROPOSED or even IMPLEMENTED — only VALIDATED or a documented DECLINED closes it.",
    "**Step 6 — Validate before calling it VALIDATED.** A newly implemented rule needs the same synthetic-test-corpus treatment as any other detection before its status can honestly move past IMPLEMENTED: a labeled true positive built from the generalized technique (not the literal incident), a true negative representing legitimate activity that must not trigger it, and — where relevant — a documented known gap the rule still can't see. This catalog's synthetic-event-validation article covers the full method for building that corpus; the point specific to this guide is that skipping this step is exactly how a finding ends up marked complete while its actual detection behavior in production remains unknown.",
    "**Step 7 — Feed validated changes back into the organization's plans, not just its rule set.** NIST SP 800-61 Rev. 3's ID.IM-03 (\"Improvements are identified from execution of operational processes, procedures, and activities\") explicitly names this exact case in its guidance notes — improvements identified from an incident can include \"identifying TTPs that are not currently being blocked by safeguards or flagged by detection technologies,\" and the same source frames lessons-learned meetings held as an incident's recovery concludes as a primary point where such findings surface. ID.IM-04 extends this to the plans themselves — \"incident response plans and other cybersecurity plans that affect operations are established, communicated, maintained, and improved.\" In practice: once a finding reaches VALIDATED, update whatever the organization uses to track detection coverage (an ATT&CK Navigator layer, a rule inventory, the incident-response plan's own documented capability list) so the improvement is visible somewhere durable, not only inside the closed incident's own report.",
    "**A compact worked example (fully fictional): Thistlewood Logistics' RDP-lateral-movement finding.** The incident described in 'Threat Model' above produces two post-incident findings. Finding A: no existing rule flagged the RDP session between the two hosts, even though the relevant logon telemetry existed the whole time on both machines — classified in Step 1 as a **detection gap**, not a telemetry gap, since the data existed and was retained; root-caused in Step 2 as \"lateral movement using a valid account's pre-existing legitimate access was never modeled as something to watch for.\" Finding B: the review also recommends blocking the specific external IP address the attacker's initial-access tooling had called out to before the RDP activity began.",
    "For Finding A, the hypothesis stated in Step 3, anchored to MITRE ATT&CK T1021.001 (Remote Services: Remote Desktop Protocol — \"adversaries may use valid accounts to log into computers via Remote Desktop Protocol (RDP) to expand access and perform actions as the logged-on user\"): an account establishes a successful RDP session (Windows Security Event 4624 with Logon Type 10 — Microsoft's own documentation defines this value as \"a user logged on to this computer remotely using Terminal Services or Remote Desktop\") to a host outside that account's established, typically-observed access pattern. Step 4's coverage check confirms no existing rule already modeled this pattern. The logic is deliberately generalized past the two specific hostnames in the fictional incident: it compares each new Logon Type 10 session's source/destination host pair against a maintained baseline of each account's normal access, not against the literal two hosts involved in this one incident.",
    "Step 5 marks Finding A PROPOSED, then IMPLEMENTED once the logic is written and deployed. Step 6 builds a small synthetic corpus before moving it further: a true positive (a fictional account's session to a host outside its established baseline), a true negative (a fictional systems-administrator account's routine RDP session to a host well within its documented, frequently-used baseline), and a documented known gap (a host where the relevant audit subcategory generating Event 4624 is not enabled, so no telemetry exists for the comparison regardless of the logic's correctness). Only after this test corpus confirms the expected behavior does Finding A move to VALIDATED, at which point Thistlewood Logistics' detection-coverage layer for T1021.001 is updated to reflect the new rule, per Step 7.",
    "Finding B — the specific external IP address — is explicitly marked DECLINED as a permanent detection, with the reason recorded directly rather than left implicit: the address is ephemeral, disposable attacker infrastructure with no enduring value as a durable rule condition, and building a permanent rule around it would misrepresent the environment's actual coverage of the underlying technique. A short-lived blocklist entry, tracked separately from the permanent detection backlog, is judged the appropriate response instead. Recording DECLINED with this reasoning lets a later reviewer see that Finding B was considered and deliberately not built into a rule — not silently dropped.",
  ],
  validationEvidence: [
    "This guide describes a post-incident-finding-to-validated-detection workflow, illustrated with a single fully fictional organization, incident, and finding set invented for this article. No real host, account, RDP session, or detection rule described here was collected, correlated, deployed, or independently tested against a live or lab-reproduced system as part of writing this guide. Its evidence state is UNVERIFIED and stays UNVERIFIED until an organization applying this guide records its own real, independently tested detection change — the label must not be upgraded merely because the guide's reasoning is internally consistent or the worked example reads plausibly.",
  ],
  limitations: [
    "This guide covers the workflow from a completed post-incident finding to a validated (or explicitly declined) detection change. It does not cover how to run the root-cause analysis or lessons-learned meeting itself, which is its own topic with its own facilitation and documentation practices.",
    "It does not re-derive the full hypothesis-to-detection-logic method or the synthetic-test-corpus construction method in detail — both are covered by this catalog's dedicated detection-engineering articles, which this guide builds on rather than duplicates.",
    "It does not cover SIEM- or EDR-specific query languages, ticketing or backlog tooling, or the internal mechanics of any specific ATT&CK Navigator deployment — the coverage-tracking discussion here is about the practice, not a specific product's configuration.",
    "The worked example is deliberately small (two findings, one implemented and one declined) to stay compact and fully fictional; a real post-incident review very often produces more findings, spanning more of the four gap types, than this guide's example can illustrate in a compact form.",
  ],
  defensiveRecommendations: [
    "Classify every post-incident detection finding into a detection gap, telemetry gap, logic gap, or process gap before deciding on a fix — the four types have different remediations, and misclassifying one wastes effort solving the wrong problem.",
    "Generalize a proposed detection improvement to the underlying technique before writing any logic; a rule built directly from one incident's literal host, account, or address will not catch the next occurrence once any of those specific details change.",
    "Check existing detection coverage (an ATT&CK Navigator layer or equivalent coverage record) before building a new rule — a finding may indicate a gap in existing logic rather than the complete absence of any relevant rule.",
    "Track every post-incident finding's status explicitly as PROPOSED, IMPLEMENTED, VALIDATED, or DECLINED, with a recorded reason for any DECLINED item, so a recommendation can never quietly disappear between the report and production.",
    "Validate a newly implemented detection against a labeled synthetic test corpus — including a true negative — before marking it VALIDATED; an untested rule's real production behavior is still unknown, regardless of how confident its logic looks on paper.",
    "Update the organization's durable coverage records (a Navigator layer, a rule inventory, the incident-response plan's own capability list) once a finding reaches VALIDATED, consistent with NIST SP 800-61 Rev. 3's ID.IM-04 — the closed incident's own report is not a durable place for this information to live.",
  ],
  keyTakeaways: [
    "A post-incident detection finding needs to be classified by gap type — detection, telemetry, logic, or process — before a fix is chosen, because each type has a genuinely different remediation.",
    "NIST SP 800-61 Rev. 3 frames lessons learned from every incident-response function as feeding into a dedicated Improvement activity (ID.IM) that then informs all functions, including Detect — this is a designed part of the lifecycle, not an informal add-on.",
    "A detection improvement built directly from one incident's literal indicators fails to generalize; state it as a technique-anchored hypothesis instead, and check existing coverage before building something new.",
    "PROPOSED, IMPLEMENTED, VALIDATED, and DECLINED are meaningfully different states, and a finding isn't closed until it reaches VALIDATED or a documented DECLINED — not merely written down or deployed untested.",
    "Not every post-incident recommendation deserves a permanent detection; a deliberately DECLINED finding with its reasoning recorded is a better outcome than one silently dropped or one that produces a rule with no enduring coverage value.",
  ],
  references: [
    "NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile (April 2025): https://csrc.nist.gov/pubs/sp/800/61/r3/final",
    "NIST CSWP 29, The NIST Cybersecurity Framework (CSF) 2.0 (February 26, 2024): https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf",
    "MITRE ATT&CK — Remote Services: Remote Desktop Protocol (T1021.001): https://attack.mitre.org/techniques/T1021/001/",
    "MITRE ATT&CK Navigator project: https://github.com/mitre-attack/attack-navigator",
    "Microsoft Learn — 4624(S): An account was successfully logged on: https://learn.microsoft.com/en-us/windows/security/threat-protection/auditing/event-4624",
  ],
  relatedSlugs: [
    "turning-attack-hypothesis-into-detection",
    "validating-a-detection-with-synthetic-events",
    "building-a-defensible-incident-timeline",
    "evidence-collection-before-containment",
  ],
};

// PlaybookModule (kind: "playbook") is written here for the process of
// turning a post-incident finding into a validated (or explicitly
// declined) detection change. Unlike the two prior playbook-typed articles
// in this category — building-a-defensible-incident-timeline.ts (an
// ongoing documentation discipline) and evidence-collection-before-
// containment.ts (a time-pressured live-response decision) — this
// article's subject is a backlog/follow-through process that runs after
// an incident has already been closed, so "trigger" begins at a completed
// finding rather than an active incident, and "containment" is repurposed
// (as both prior articles in this category also did, for their own
// differently-shaped subjects) to describe keeping a proposed detection's
// scope bounded to the generalized technique rather than the one
// incident's literal artifacts — a scope-creep risk specific to this
// subject rather than a live blast-radius concern.
const module_: PlaybookModule = {
  kind: "playbook",
  trigger:
    "A post-incident review (root-cause analysis or lessons-learned meeting) has produced at least one finding describing a gap in detection coverage, telemetry, or triage that contributed to a delayed or missed detection. This playbook applies from that finding through a VALIDATED detection change or a documented DECLINED decision.",
  severity:
    "Not an incident severity — this rates how much rigor a given finding's remediation deserves. Treat a finding indicating a technique the environment currently cannot detect through any existing rule (a detection gap) as high priority; treat a finding indicating an existing, working rule needed a logic adjustment as lower priority but still tracked through to VALIDATED or DECLINED, not left at PROPOSED indefinitely.",
  triage: [
    "Classify the finding as a detection gap, telemetry gap, logic gap, or process gap before deciding on a remediation — a process gap (an alert fired but was mishandled) belongs with SOC-operations and alert-triage practice, not a new detection rule.",
    "Check whether this finding duplicates an already-tracked item from a prior incident before opening a new one — a recurring finding is itself informative and should be flagged as recurring, not silently re-logged as new each time.",
    "Identify the specific telemetry source(s) the finding depends on and confirm they are populated in practice, not merely enabled in a settings page, before assuming a logic fix alone will suffice.",
  ],
  decisionPoints: [
    "If the finding is a telemetry gap: prioritize closing the data-availability problem first; logic written against data that doesn't exist cannot become a working detection regardless of how the logic itself is written.",
    "If the finding is a detection or logic gap: state the improvement as a technique-anchored hypothesis generalized past the specific incident, and check existing coverage (an ATT&CK Navigator layer or equivalent) before building new logic from nothing.",
    "If the finding's most direct fix would be a rule keyed to a literal, ephemeral detail (a specific address, filename, or one-off artifact) with no enduring value as a detection condition: mark it DECLINED as a permanent detection, record the reason, and route any short-term response (a temporary blocklist entry) through a separate, explicitly time-bounded mechanism instead.",
    "If a proposed detection has been implemented but not yet run against a synthetic test corpus: keep its status at IMPLEMENTED, not VALIDATED, until that testing is complete.",
  ],
  escalation: [
    "Escalate to the team or individual who owns the detection-engineering backlog when a finding reveals a systemic capability gap (an entire telemetry source or audit-policy setting missing fleet-wide) rather than a single rule's narrow condition — that scope of fix usually needs resourcing beyond one analyst's immediate follow-up.",
    "Escalate to a peer reviewer before marking any finding DECLINED — a second opinion helps confirm the finding genuinely lacks enduring detection value rather than being declined out of convenience under backlog pressure.",
    "Escalate immediately, independent of this playbook's normal cadence, if triage surfaces that the same gap type has recurred across multiple unrelated incidents — a repeated detection gap for different techniques may indicate a structural weakness in how new detections get modeled, not a string of unrelated one-off findings.",
  ],
  containment: [
    "Keep a proposed detection's logic scoped to the generalized technique identified in the hypothesis, not the literal hosts, accounts, or addresses from the incident that surfaced it — this is the specific scope-creep this playbook exists to prevent, not a live blast-radius concern.",
    "Keep DECLINED findings visibly distinguished from ones simply awaiting action; a finding with no recorded status is not the same as one considered and intentionally not built into a permanent rule.",
    "Avoid letting an incident's own closed report remain the sole record of a validated improvement — durable coverage records (a Navigator layer, a rule inventory) should reflect the change independent of whether anyone later reopens that specific report.",
  ],
  recovery: [
    "If a finding is later discovered to have been implemented but never actually validated against a test corpus, correct its status back to IMPLEMENTED and complete the validation before treating it as closed — do not backfill a VALIDATED label without the testing that label is supposed to represent.",
    "If a DECLINED finding recurs in a later incident, revisit the original decision explicitly with the new evidence in hand, rather than treating the earlier DECLINED status as permanent regardless of new information.",
    "Record what specifically went wrong (a misclassified gap type, an overfit rule, a skipped validation step) when a post-incident detection improvement is later found to have failed, so the same category of process gap is caught earlier the next time.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Post-Incident Detection Improvements",
    slug: "post-incident-detection-improvements",
    summary:
      "A playbook for turning a post-incident finding into an actually-validated detection change: classifying the gap as a detection, telemetry, logic, or process problem, generalizing the fix to the underlying technique instead of the one incident's literal indicators, tracking every finding's status explicitly through PROPOSED/IMPLEMENTED/VALIDATED/DECLINED, and a compact fictional worked example.",
    pillar: "detect-respond",
    primaryCategory: "incident-response-dfir",
    contentType: "playbook",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["incident-response", "detection-engineering", "security-control-validation"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 13,
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
