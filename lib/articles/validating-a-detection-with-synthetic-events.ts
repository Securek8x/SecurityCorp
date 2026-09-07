// Knowledge-base article (Bead securitycorp-source-4zl.56.1.3, "How to
// Validate a Detection with Synthetic Events"). Drafted 2026-09-07 as
// `status: "drafting"` — NOT authorized for publication by this agent. Every
// event, host, user, and company name in this file is fictional and is
// labeled SIMULATED where it appears in prose; there is no employer-derived
// telemetry, rule, threshold, screenshot, or case anywhere in this file, per
// this Bead's safety requirements and docs/publication-safety-policy.md. No
// absolute filesystem path appears anywhere in this file — locations and
// executables are described by process/file name only, in prose, matching
// the pattern in the two companion articles below.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788756066893-z8ghnb, template "research", task
// scoped to this article's exact objective/audience/scope — validating a
// detection with a synthetic, auditable test corpus). A bounded
// mcp__ruflo__workflow_status check afterward reproduced the same documented
// issue recorded in CLAUDE.md ("Current Ruflo executor limitation"): the
// workflow stayed at 0% progress with a single pending "Execute" step and
// returned no retrievable editorial output. This draft was therefore
// produced with the disclosed native fallback instead — separate sequential
// research (citation verification via WebFetch against the primary MITRE
// ATT&CK, Microsoft Learn, and NIST pages, not recalled from memory),
// drafting, technical verification, publication-safety review, and a final
// editorial pass — none of it credited to Ruflo. See the calling agent's
// final report for full editorial-routing evidence.
//
// Companion-article note: this is the deep-dive companion to "Turning an
// Attack Hypothesis into a Detection" (turning-attack-hypothesis-into-
// detection) and "Choosing Telemetry Before Writing Detection Logic"
// (choosing-telemetry-before-writing-detection-logic). Both companions touch
// synthetic-event validation as one step among several in their own
// worked examples; this article does not re-derive either walkthrough — it
// goes deep on the validation step specifically: what makes a synthetic
// event representative, how a minimal test corpus (true positive, true
// negative, near miss) is built and kept, and how a test can pass by
// accident when the synthetic event behind it is too simple. It uses a
// third fictional company, host, user, and attack hypothesis so it cannot
// be mistaken for a continuation of either companion.
//
// Worked example: a fictional company ("Thistledown Robotics"), a fictional
// host, and a fictional user are used to walk through validating a detection
// for LSASS memory access (MITRE ATT&CK T1003.001) with a small synthetic
// test corpus — including a near-miss case that exposes a real category of
// logic defect (checking that a handle to lsass.exe exists, rather than
// checking that the handle's access rights actually permit reading process
// memory) that a corpus without a near-miss case would never catch. Every
// log line, access-rights value, and test case is explicitly marked
// SIMULATED; the underlying Windows access-right constants (PROCESS_VM_READ,
// PROCESS_QUERY_INFORMATION, PROCESS_QUERY_LIMITED_INFORMATION and their
// hexadecimal values) are drawn from Microsoft's own published documentation
// (cited in References), not invented for this article.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, DetectionModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "\"The rule fired in my test\" and \"the rule fires for the right reason\" are not the same claim, and a synthetic test corpus that only ever tries to prove the first one is not evidence of the second. A single hand-built synthetic event, especially one built with placeholder or simplified field values instead of the shape a genuine occurrence would actually have, can make almost any detection logic evaluate true — including logic with a real defect in it. The defect stays invisible until someone builds a synthetic event specifically designed to sit just outside the behavior the rule is supposed to catch, and confirms the rule correctly stays silent for it.",
    "This guide is the deep-dive companion on validation specifically — not the full hypothesis-to-detection method (see \"Turning an Attack Hypothesis into a Detection\") and not telemetry sufficiency (see \"Choosing Telemetry Before Writing Detection Logic\"), both of which treat a synthetic test corpus as one step among several. Here, one worked example — validating a detection for credential-dumping access to the LSASS process, using a small corpus of a true positive, a true negative, and a deliberately adjacent near-miss case — makes concrete what a representative synthetic event actually requires, how a near-miss case catches a logic defect a positive-only corpus cannot, and how to turn validation into something repeatable and reviewable rather than a one-time manual check.",
  ],
  whatYouWillLearn: [
    "What makes a synthetic test event actually representative of a genuine occurrence — matching the real event type's field shapes and using accurate, non-placeholder field values — rather than a simplified stand-in that happens to trip the logic under test.",
    "How to build a minimal synthetic test corpus with three distinct roles: a true positive, a true negative, and at least one deliberately adjacent 'near miss' that probes the exact boundary of the detection logic's own conditions.",
    "Why a detection can pass every test in a positive-only corpus while still containing a real logic defect, and how a well-chosen near-miss case exposes that defect before deployment instead of after.",
    "How to structure validation as a repeatable process — a versioned corpus re-run after every logic change, not a manual check performed once at initial deployment and never revisited.",
    "How to document validation evidence (per-case purpose, key field values, expected result, actual result, and the logic version tested) so a reviewer can confirm a detection was actually validated without re-deriving the test corpus themselves.",
  ],
  intendedAudience: [
    "Detection engineers who have drafted logic and need to prove — to themselves and to a reviewer — that it does what it claims before it reaches production.",
    "Security practitioners assessing an inherited detection who want to check whether its validation evidence, if any exists, actually supports its coverage claim.",
    "Technical leads defining what 'validated' should mean for a detection-engineering practice, beyond 'it fired once when I tried it.'",
  ],
  prerequisites: [
    "Basic familiarity with how security telemetry is structured (event types, fields, access-control or audit concepts) and with reading detection logic expressed as conditions over fields.",
    "No lab environment, SIEM, or EDR product is required to follow this guide — every event, host, and identity below is fictional and synthetic, built specifically to illustrate the method.",
    "Reading \"Turning an Attack Hypothesis into a Detection\" and \"Choosing Telemetry Before Writing Detection Logic\" first is helpful for the broader method this guide's validation step fits into, but neither is required — this guide is self-contained on the validation question.",
  ],
  problem: [
    "A detection that 'passed testing' usually means one thing happened: someone built or triggered an event that looked like the thing the rule is supposed to catch, ran it through the logic, and watched the rule fire. That is a real result, but it answers a narrower question than the one it is usually taken to answer. It proves the logic can evaluate true for at least one input. It does not prove the logic evaluates true for the right reason — that the specific condition doing the real work of separating malicious from benign activity is the condition that actually fired, rather than some looser, coincidentally-satisfied condition that happens to also be true of the one test event that was tried.",
    "This gap is easiest to see in hindsight and easiest to miss in advance, because a synthetic test event is authored by the same person who wrote the detection logic, working from the same mental model of what the malicious case looks like. If that mental model has a gap — a condition that's broader than intended, a field the logic doesn't actually check, an access level treated as equivalent to a stronger one it doesn't imply — the test event built from that same mental model will usually satisfy the logic anyway, and the test will pass. A test corpus built entirely from confirmatory, true-positive-shaped events is structurally unable to catch this class of defect, because nothing in it was ever designed to make the rule prove it stays silent when it should.",
  ],
  threatModel: [
    "Fictional environment used throughout this guide: Thistledown Robotics, a fictional company running a fleet of Windows endpoints with an approved, allow-listed endpoint-monitoring agent deployed fleet-wide. The host identifier used below (for example, TDR-WKS-6103) and the username (for example, n.okoye) are constructed for this article and do not describe any real host, account, employer, or incident.",
    "Attack hypothesis: an attacker who has already obtained local administrator privilege on a Windows endpoint — through a separate, out-of-scope privilege-escalation step, not through user-level code execution alone — opens a handle to the lsass.exe process with access rights sufficient to read its memory, intending to extract credential material for offline use (MITRE ATT&CK T1003.001, OS Credential Dumping: LSASS Memory). The elevated-privilege requirement is explicit and load-bearing here, not incidental: obtaining a handle to another process with the access rights this hypothesis depends on requires the SeDebugPrivilege privilege, which by default only an administrator account can enable (Microsoft Learn, Process Security and Access Rights) — a user-level attacker without prior escalation cannot perform this action at all, and this guide does not describe how escalation was obtained.",
    "Assets and actors in scope: any endpoint in Thistledown Robotics' fleet with process-access telemetry available, and an already-privileged post-compromise attacker or malicious tool — not a specific named threat actor. Out of scope: the privilege-escalation step itself, the offline credential-cracking or reuse that would follow a successful memory read, and any specific SIEM or EDR product's query syntax. What is in scope, and the entire focus of this guide, is how the detection logic that watches for this access pattern gets proven correct — and proven correct for the right reason — before it is trusted.",
  ],
  mainContent: [
    "**Step 1 — What makes a synthetic event representative, not just plausible-looking.** A representative synthetic event has to get two things right, not one. First, its shape: the event type, the fields it carries, and how those fields relate to each other have to match what the real telemetry source actually produces — a fabricated field name, a field the real event type doesn't have, or a value in a format the real source never emits is not a test of the detection logic, it's a test of a system that doesn't exist. Second, and more often skipped, its values: a field has to carry a value a genuine occurrence would actually produce, not a placeholder standing in for 'the malicious one' or 'the legitimate one.' For this guide's worked example, that second requirement means the access-rights field on a synthetic LSASS-access event cannot simply read something like \"high\" or \"full\" — it has to carry the actual access-mask value a real process-access API call would produce, built from real, documented access-right constants (PROCESS_QUERY_INFORMATION at 0x0400, PROCESS_VM_READ at 0x0010, PROCESS_QUERY_LIMITED_INFORMATION at 0x1000 — Microsoft Learn, Process Security and Access Rights), because the detection logic's actual job is to distinguish between combinations of exactly those bits, and a placeholder value can't exercise that distinction at all.",
    "**Step 2 — Build a minimal corpus with three distinct roles, not three variations on one theme.** A true positive and a true negative alone answer 'does this look different enough' — useful, but not sufficient, because two events that already look obviously different rarely stress the specific boundary condition a rule's logic actually encodes. A minimal, useful corpus adds a third role: a near miss, an event deliberately constructed to satisfy as many of the rule's surface-level conditions as possible while failing the one condition that is supposed to be the actual determining factor. A near miss isn't a random negative example — it's the negative example chosen specifically because it is closest to the rule's own decision boundary, which is exactly where a badly-scoped condition would fail to distinguish it from a true positive.",
    "**The worked example's true positive.** SIMULATED — host TDR-WKS-6103: from an interactively launched command shell (not an approved deployment or diagnostic tool), `rundll32.exe` invokes the MiniDump export of the `comsvcs.dll` library against the `lsass.exe` process — a documented technique for dumping LSASS memory using only built-in Windows components (MITRE ATT&CK T1003.001). The resulting process-access telemetry (for example, Sysmon Event ID 10, ProcessAccess) records `rundll32.exe` as the source process, `lsass.exe` as the target, and a GrantedAccess value that combines PROCESS_QUERY_INFORMATION (0x0400) and PROCESS_VM_READ (0x0010) — the specific combination required to both identify the target process and read its memory content, and the same access-right bits the technique genuinely needs to succeed, not a stand-in for 'suspicious access.'",
    "**The worked example's true negative.** SIMULATED — the fleet's allow-listed endpoint-monitoring agent (matched by binary path plus cryptographic hash, not by process name) opens a handle to `lsass.exe` as part of its routine health-check cycle, requesting and receiving the same full combination of access rights the true positive used, including PROCESS_VM_READ. This case is a true negative for a reason that has nothing to do with the access-rights field: the accessing process matches a maintained allow-list entry by path and hash. Suppressing this event correctly is the allow-list mechanism doing its job — but a corpus that stopped here would still not have tested whether the access-rights condition itself is correct, because the allow-list check alone was sufficient to explain the expected result.",
    "**The worked example's near miss.** SIMULATED — a different, non-allow-listed process on the same host (a locally run system-diagnostics utility, launched interactively by an administrator troubleshooting an unrelated performance issue, not a deployment or monitoring tool) opens a handle to `lsass.exe` and receives only PROCESS_QUERY_LIMITED_INFORMATION (0x1000) — enough to retrieve basic process metadata such as an exit code or priority class, and nothing else. This access right does not include PROCESS_VM_READ; it cannot be used to read process memory content by design (Microsoft Learn, Process Security and Access Rights). The process is not on the allow-list, so an allow-list-only suppression condition would not protect it — this event has to be correctly excluded by the access-rights condition itself, which is precisely the condition a positive-only corpus never exercises.",
    "**Step 3 — 'Fired' versus 'fired for the right reason.'** Consider a first draft of this hypothesis's detection logic: alert whenever a process-access event's target is `lsass.exe` and the source process is not on the allow-list. Run only the true-positive and true-negative cases above against it, and it passes both — the true positive fires (not allow-listed), the true negative is silent (allow-listed). A reviewer looking only at those two results would reasonably conclude the logic works. Add the near-miss case, and the defect is immediately visible: the diagnostics utility is not allow-listed either, so this draft logic fires on it too — a false positive on an access that structurally cannot read LSASS memory, because the logic never actually inspected the one field, GrantedAccess, that would have told it the difference. The rule 'worked' on the two-case corpus for the wrong reason: it happened to key off allow-list membership, which was true of both original test events for reasons unrelated to what the rule was supposed to be measuring, and nothing in that corpus ever forced the access-rights condition to matter. The corrected logic — alert when the target is `lsass.exe`, the source is not allow-listed, AND GrantedAccess includes PROCESS_VM_READ — passes all three cases for the reason each case was built to test, not by coincidence.",
    "**Step 4 — Validation as a repeatable process, not a one-time check.** A synthetic test corpus that lives only in whoever validated the rule's memory, or in a one-off manual test performed before initial deployment, degrades the moment the logic changes and nobody re-runs it. Treat the corpus the way a software test suite is treated: store it alongside the detection logic it validates (in the same repository, ideally the same change set), give every case a stated purpose and an explicit expected result (fire or no-fire), and re-run the full corpus — not just the cases someone remembers to check — against any change to the logic before that change is considered complete. A tuning change that narrows an allow-list, a threshold adjustment, or a field-name fix are all logic changes in this sense, even when they feel small; each is exactly the kind of edit that can silently reintroduce the 'fires for the wrong reason' failure Step 3 walked through; a corpus is only doing its job if it is re-run every time, not only when someone remembers it exists.",
    "**Step 5 — Documenting evidence so a reviewer doesn't have to re-derive it.** A reviewer checking whether a detection was actually validated should not have to reconstruct the test corpus from a rule's commit history or from the author's memory. Record, per case: its purpose (what specific condition or boundary it exists to test — the near-miss case's record should say explicitly that it tests whether the access-rights condition alone, independent of the allow-list, correctly excludes a non-malicious access), the representative field values used, the expected result, the actual result observed against the current logic, and the date and logic version the case was last run against. This is the same posture NIST SP 800-53A takes toward control-assessment evidence generally: an assessment procedure is only useful if its execution and results are recorded well enough to support a determination without re-running the assessment from scratch, and NIST SP 800-115 frames a documented, repeatable testing methodology as the difference between a technical security test and an undocumented one-off exercise. A detection's validation record deserves the same discipline.",
    "**Step 6 — Revalidate on a cadence, not only when the logic changes.** A corpus can also go stale for reasons that have nothing to do with the detection logic's own text: a platform security change can silently alter which access rights an attacker (or a legitimate tool) can actually obtain. Thistledown Robotics adopting Credential Guard or Protected Process Light for LSASS, for example, would change what access rights are achievable against the process at all — a true-positive fixture built before such a change could stop representing a real achievable attacker action, or a previously-correct near-miss case could stop representing the actual boundary, without a single line of the detection logic changing. NIST SP 800-137 frames exactly this kind of periodic reassessment — checking that a control's effectiveness assumptions still hold as the environment around it changes — as a continuous-monitoring responsibility, not a one-time setup task; a synthetic test corpus benefits from the same cadence, re-run and re-examined on a schedule even when no one has touched the rule.",
  ],
  validationEvidence: [
    "This guide's worked example uses SIMULATED telemetry and a fictional environment constructed specifically to illustrate the validation method. It does not reproduce a deployed detection, a real environment's process-access baseline, or a completed validation exercise against production telemetry, so its evidence state remains UNVERIFIED. The Windows access-right constants and their hexadecimal values (PROCESS_QUERY_INFORMATION, PROCESS_VM_READ, PROCESS_QUERY_LIMITED_INFORMATION) and the SeDebugPrivilege requirement for opening a process handle with full access rights are drawn from Microsoft's own published documentation (cited in References) and are accurate as documented there; the fictional company's specific hosts, users, and event values are illustrative, not a report of any real environment.",
  ],
  limitations: [
    "This guide demonstrates the validation method through one hypothesis and one telemetry source (Sysmon Event ID 10, ProcessAccess, for LSASS credential-dumping detection). The three-role corpus structure — true positive, true negative, near miss — generalizes to other hypotheses and telemetry sources, but each new detection needs its own near-miss case designed around its own specific boundary condition; a near-miss case cannot be copied from one detection to another by analogy.",
    "This guide does not cover building the initial attack hypothesis or confirming telemetry sufficiency — see the two companion articles for those steps, which this guide assumes are already complete by the time validation begins.",
    "This guide does not cover automating corpus execution inside a specific CI/CD or SIEM testing framework; the repeatable-process guidance in Step 4 is deliberately vendor-neutral and describes the practice, not a specific tool's implementation.",
    "The synthetic events here illustrate the method with a minimal three-case corpus. A production validation exercise for a broadly deployed detection typically needs a larger corpus covering more variations of legitimate activity than the single true-negative and single near-miss case shown here.",
  ],
  defensiveRecommendations: [
    "Build every synthetic test event from the real telemetry source's actual schema and real, accurate field values — never a placeholder standing in for 'the malicious one' or 'the legitimate one' — because a detection's logic can only be validated against the exact field content it actually reads.",
    "Include at least one deliberately adjacent near-miss case in every detection's test corpus, chosen specifically to satisfy the rule's surface-level conditions while failing the one condition meant to be the true determining factor — a corpus without one cannot distinguish 'fired' from 'fired for the right reason.'",
    "Store the test corpus alongside the detection logic it validates, with an explicit purpose and expected result recorded for every case, and re-run the full corpus against every logic change before that change is considered complete.",
    "Document each case's actual result and the logic version it was last run against, so a reviewer can confirm validation occurred without re-deriving or re-running the corpus themselves.",
    "Revalidate the corpus on a periodic cadence independent of whether the detection logic has changed — a platform security change can silently invalidate a previously-correct fixture or near-miss case without touching a single line of the rule.",
  ],
  keyTakeaways: [
    "A synthetic test event that passes a detection's logic proves the logic can evaluate true for that one input — it does not prove the logic fired for the right reason, and a positive-only test corpus is structurally unable to catch that difference.",
    "A representative synthetic event matches both the real telemetry source's schema and its real, accurate field values; a placeholder value in place of a genuine one can make a defective rule pass its own test.",
    "A minimal, useful test corpus needs three distinct roles — true positive, true negative, and a deliberately adjacent near-miss case — because the near miss is what actually exercises the rule's real decision boundary.",
    "Validation is a repeatable process, not a one-time check: the corpus should be versioned alongside the detection logic and re-run on every change, and revalidated periodically even when the logic itself hasn't changed, because the environment around it can shift the corpus's own accuracy.",
    "Documented validation evidence — per-case purpose, values, expected and actual results, and the logic version tested — lets a reviewer confirm a detection was actually validated without re-deriving the test corpus from scratch.",
  ],
  references: [
    "MITRE ATT&CK — OS Credential Dumping: LSASS Memory (T1003.001): https://attack.mitre.org/techniques/T1003/001/",
    "MITRE ATT&CK — OS Credential Dumping (T1003): https://attack.mitre.org/techniques/T1003/",
    "Microsoft Learn — Process Security and Access Rights (documents PROCESS_VM_READ, PROCESS_QUERY_INFORMATION, PROCESS_QUERY_LIMITED_INFORMATION, and the SeDebugPrivilege requirement for full process access): https://learn.microsoft.com/en-us/windows/win32/procthread/process-security-and-access-rights",
    "Microsoft Learn — Sysmon (System Monitor) documentation, including Event ID 10 (ProcessAccess): https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon",
    "NIST SP 800-53A Rev. 5, Assessing Security and Privacy Controls in Information Systems and Organizations: https://csrc.nist.gov/pubs/sp/800/53/a/r5/final",
    "NIST SP 800-115, Technical Guide to Information Security Testing and Assessment: https://csrc.nist.gov/pubs/sp/800/115/final",
    "NIST SP 800-137, Information Security Continuous Monitoring (ISCM) for Federal Information Systems and Organizations: https://csrc.nist.gov/pubs/sp/800/137/final",
  ],
  relatedSlugs: [
    "turning-attack-hypothesis-into-detection",
    "choosing-telemetry-before-writing-detection-logic",
    "logs-are-not-proof-verifying-automated-actions",
  ],
};

const module_: DetectionModule = {
  kind: "detection",
  hypothesis:
    "An attacker who has already obtained local administrator privilege on a Windows endpoint (through a separate, out-of-scope privilege-escalation step) opens a handle to the lsass.exe process with access rights sufficient to read its memory, intending to extract credential material for offline use (MITRE ATT&CK T1003.001). The elevated-privilege precondition is explicit: opening a process handle with the access rights this hypothesis depends on requires the SeDebugPrivilege privilege, which only an administrator account can enable by default — this action is not achievable from user-level code execution alone.",
  requiredDataSources: [
    "Process-access telemetry (for example, Sysmon Event ID 10, ProcessAccess) capturing the source process, the target process, and the specific GrantedAccess value — the access-rights bitmask — for every handle opened to another process.",
    "Process-creation telemetry capturing process name, command line, and parent process, to establish the context in which the access occurred (for example, whether rundll32.exe was launched interactively versus by an approved deployment tool).",
    "A maintained baseline allow-list (binary path plus cryptographic hash, not process name) of tooling known to legitimately open handles to lsass.exe in the environment — endpoint-monitoring agents, diagnostic utilities, and backup or crash-dump tooling.",
  ],
  detectionLogic: [
    "Alert when a process-access event's target process is lsass.exe AND the source process is not on the environment's allow-listed baseline (matched by path plus hash) AND the event's GrantedAccess value includes PROCESS_VM_READ (0x0010) — the specific access right required to read process memory content, not merely any nonzero access to the process.",
    "Do not alert on a process-access event to lsass.exe whose GrantedAccess value is limited to rights that cannot read process memory (for example, PROCESS_QUERY_LIMITED_INFORMATION alone) — this access right is documented to provide only basic process metadata and structurally cannot be used to extract credential material, regardless of the accessing process's allow-list status.",
    "Suppress an alert only when the accessing process's full binary path and cryptographic hash match a maintained allow-list entry — never suppress by process name alone, since an attacker can rename or repurpose a tool to a legitimate-sounding name.",
  ],
  testCases: [
    "SIMULATED true positive — host TDR-WKS-6103: rundll32.exe, launched from an interactive command shell, invokes the comsvcs.dll library's MiniDump export against lsass.exe, producing a process-access event with GrantedAccess including both PROCESS_QUERY_INFORMATION (0x0400) and PROCESS_VM_READ (0x0010). The source process is not allow-listed and the access includes VM_READ — both detection-logic conditions fire for the reason each was designed to test.",
    "SIMULATED true negative — the fleet's allow-listed endpoint-monitoring agent (matched by path plus hash) opens lsass.exe during its routine health-check cycle, receiving the same full access rights as the true-positive case, including PROCESS_VM_READ. The allow-list suppression condition applies and no alert fires — this case validates the allow-list mechanism specifically, independent of the access-rights condition.",
    "SIMULATED near miss — a non-allow-listed, interactively launched system-diagnostics utility opens lsass.exe and receives only PROCESS_QUERY_LIMITED_INFORMATION (0x1000), with no PROCESS_VM_READ. The source process is not allow-listed, so an allow-list-only condition would incorrectly fire on this event; the access-rights condition (GrantedAccess must include PROCESS_VM_READ) correctly excludes it. This case is the one that exposes whether the detection logic is checking the right condition rather than a coincidentally-correlated one.",
  ],
  falsePositiveAnalysis: [
    "Legitimate diagnostic, backup, and crash-dump tooling can request the same PROCESS_VM_READ access right this detection alerts on, for non-malicious reasons — an allow-list keyed to binary path plus cryptographic hash, re-baselined when such tooling is upgraded, is required before broad deployment.",
    "A newly deployed or updated allow-listed tool that has not yet been re-baselined will appear identical to the true-positive case until its updated binary hash is added — this is an allow-list maintenance problem, not a defect in the access-rights condition, and should be tracked and fixed via the allow-list process rather than by loosening the access-rights check.",
    "Without the near-miss case in the validation corpus, this exact false-positive source (a legitimate, low-privilege diagnostic access to lsass.exe) would not have been caught before deployment — it is the same category of gap Step 3 in the main content walks through.",
  ],
  tuningGuidance: [
    "Re-run the full three-case corpus (true positive, true negative, near miss) against the detection logic after any change to the logic, however small, before considering the change complete.",
    "Re-baseline the allow-list on a cadence tied to known upgrade cycles for endpoint-monitoring and diagnostic tooling, and add the updated binary's hash before its next scheduled access to lsass.exe, not only after a false positive is reported.",
    "Revalidate the corpus itself — not just the logic — after any platform security change affecting achievable process-access rights (for example, adopting Credential Guard or Protected Process Light for LSASS), since such a change can silently invalidate a previously-correct true-positive or near-miss fixture without any change to the detection logic's text.",
    "Record each corpus run's date, the logic version it was run against, and each case's actual result, so a reviewer can confirm the detection is currently validated without re-running the corpus themselves.",
  ],
  mitreMapping: [
    "T1003.001 — OS Credential Dumping: LSASS Memory (primary hypothesis)",
    "T1003 — OS Credential Dumping (parent technique)",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "How to Validate a Detection with Synthetic Events",
    slug: "validating-a-detection-with-synthetic-events",
    summary:
      "A synthetic-data deep dive on the validation step of detection engineering: what makes a synthetic test event representative, how to build a minimal test corpus (true positive, true negative, and a deliberately adjacent near-miss case), why a rule can pass a test corpus for the wrong reason, and how to make validation a repeatable, documented process instead of a one-time manual check.",
    pillar: "detect-respond",
    primaryCategory: "detection-engineering",
    contentType: "detection",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["detection-engineering", "security-control-validation", "logging-monitoring"],
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
