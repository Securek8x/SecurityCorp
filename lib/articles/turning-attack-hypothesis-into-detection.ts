// Knowledge-base article (Bead securitycorp-source-4zl.56.1.1, "Turning an
// Attack Hypothesis into a Detection"). Drafted 2026-09-05 as
// `status: "drafting"` — NOT authorized for publication by this agent. Every
// event, host, user, and company name in this file is fictional and is
// labeled SIMULATED where it appears in prose; there is no employer-derived
// telemetry, rule, threshold, screenshot, or case anywhere in this file, per
// this Bead's safety requirements and docs/publication-safety-policy.md.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788655397813-era4mc, template "research", task
// scoped to this article's exact objective/audience/scope — detection-
// engineering methodology for turning an attack hypothesis into a testable
// detection). A bounded workflow_status check showed the same documented
// issue recorded in CLAUDE.md ("Current Ruflo executor limitation"): the
// workflow stayed at 0% progress with a single pending "Execute" stage and
// returned no retrievable editorial output. This draft was therefore
// produced with the disclosed native fallback instead — separate sequential
// research (technique selection and source gathering), drafting, technical-
// verification (MITRE ATT&CK technique ID and Microsoft event-ID checks
// against this agent's own knowledge), publication-safety review (fictional-
// identity and no-real-telemetry check), and final-editorial passes — none
// of it credited to Ruflo.
//
// Worked example: a fictional company ("Alderbrook Systems"), fictional
// hosts, and a fictional user are used throughout to walk one attack
// hypothesis (T1053.005, Scheduled Task persistence) through the full
// hypothesis-to-detection loop. Every log line and test case is explicitly
// marked SIMULATED. This is the first article in the detect-respond pillar's
// detection-engineering category in this catalog — no sibling article exists
// yet to check for overlap against.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, DetectionModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "A detection is only as trustworthy as the hypothesis it was built to test. Too often, a detection rule starts life as a reaction — an indicator copied from a blog post, a query pattern lifted from a vendor's release notes, or a narrow rule written the week after an incident to catch the exact sequence of events that just happened. None of those starting points force anyone to state, in advance, what attacker behavior the rule is supposed to catch, what telemetry it depends on, or how anyone would know if it stopped working. The result is a detection whose actual coverage is effectively unknown, even to the person who wrote it.",
    "This guide walks through the alternative: starting from an explicit, falsifiable attack hypothesis anchored to a MITRE ATT&CK technique, and carrying it through telemetry validation, vendor-neutral detection logic, a synthetic test corpus, false-positive analysis, and tuning — the full loop, not just the rule at the end of it. One worked example (a fictional company using Windows Task Scheduler abuse for persistence) runs end to end through every stage, using synthetic events and fictional identities throughout, so the method is visible in one continuous example rather than scattered across unrelated fragments.",
  ],
  whatYouWillLearn: [
    "How to state an attack hypothesis in a falsifiable, technique-anchored form — naming a specific ATT&CK technique, a specific attacker action, and a specific expected telemetry signature — instead of a vague goal like 'detect persistence.'",
    "How to confirm the telemetry a hypothesis actually depends on exists and is populated in your environment before writing detection logic against it.",
    "How to express detection logic in vendor-neutral terms (fields and conditions) that can be translated into any specific query language, rather than starting from one platform's syntax.",
    "How to build a small, explicitly labeled synthetic test corpus — true positives, true negatives, and known gaps — and use it to validate logic before it reaches production.",
    "How to separate false-positive tuning (a noise problem) from documenting a coverage gap (a visibility problem), and why collapsing the two leads to a rule that quietly stops meaning what its name says.",
    "What to record so a detection can be maintained by someone other than its original author.",
  ],
  intendedAudience: [
    "Detection engineers building, reviewing, or inheriting detection logic and wanting a repeatable method rather than an ad hoc rule.",
    "Security practitioners and SOC analysts who want to understand where a rule's confidence and coverage claims actually come from before trusting an alert — or the absence of one.",
    "Technical leads standing up or auditing a detection-engineering practice who need a shared vocabulary for hypothesis, coverage, and tuning decisions.",
  ],
  prerequisites: [
    "Basic familiarity with a technique-based adversary framework such as MITRE ATT&CK, and with how security telemetry is typically structured (fields, timestamps, process and user context).",
    "No lab environment, SIEM, or EDR product is required to follow this guide — every event, host, and identity below is fictional and synthetic, built specifically to illustrate the method.",
    "Some prior exposure to a log-processing or detection-authoring concept (a query, a rule, a correlation search) is helpful but not assumed.",
  ],
  problem: [
    "A detection rule that exists is not the same thing as a detection whose coverage anyone can state. A rule copied from an indicator list catches exactly that indicator, and nothing about the underlying technique that indicator happened to use that week. A rule written after an incident to catch 'what just happened' often encodes the specific artifacts of that one occurrence — a particular file path, a particular process name — rather than the technique in general, and stops firing the moment an attacker (or a legitimate tool) varies any of those details.",
    "The deeper problem is that neither starting point forces anyone to write down, before the fact, what the rule is supposed to catch, what data it needs to exist, or what would prove it works. Without that record, 'the rule is deployed and hasn't fired' is impossible to distinguish from 'the technique hasn't been attempted' or 'the technique was attempted and the rule's coverage gap let it through silently' — three very different situations that look identical from the outside.",
  ],
  threatModel: [
    "Fictional environment used throughout this guide: Alderbrook Systems, a fictional company running a fleet of Windows endpoints. All hostnames (for example, ALD-WKS-2214), usernames (for example, m.romero), file paths, and log lines below are constructed for this article and do not describe any real host, account, employer, or incident.",
    "Attack hypothesis: an attacker who has already obtained user-level code execution on an endpoint — through a phishing attachment, a malicious download, or another initial-access vector this guide does not cover — registers a Scheduled Task (MITRE ATT&CK T1053.005, Scheduled Task/Job: Scheduled Task) to re-launch their payload after logoff or reboot. The hypothesis specifically expects the attacker to prefer a scheduled task over a registry Run key or a new Windows service, because scheduled-task creation is common enough in ordinary administrative and software-update activity to blend in, and typically does not require the elevated privilege a new service does.",
    "Assets and actors in scope: any endpoint in Alderbrook Systems' fleet with process-creation and scheduled-task-creation telemetry available; a post-compromise attacker or malicious tool with user-level code execution, not a specific named threat actor. Out of scope: the initial-access vector itself, other persistence sub-techniques (registry Run keys, new services, DLL search-order hijacking), and any specific SIEM, EDR, or log-platform product's query syntax — the detection logic below is expressed in vendor-neutral field/condition terms precisely so it can be adapted to whichever platform actually ingests the telemetry.",
  ],
  mainContent: [
    "**Step 1 — State the hypothesis so it can fail.** 'Detect persistence' is not a hypothesis; it names a tactic, not a testable claim. A usable hypothesis names the technique (T1053.005), the specific attacker action (registering a scheduled task that re-executes a payload), and the expected telemetry signature that action should produce (a scheduled-task-creation event, very often preceded by a process-creation event for the tool that registered it). A hypothesis phrased this precisely can fail — that is the point. If the expected telemetry never has the shape the hypothesis predicts, that's information, not a dead end.",
    "**Step 2 — Confirm the telemetry actually exists before writing logic against it.** A detection idea is worthless if the data it depends on isn't collected, isn't retained long enough, or exists but with the relevant field empty in practice. For this hypothesis, that means confirming two things concretely: that process-creation telemetry (for example, Sysmon Event ID 1, or an EDR agent's equivalent process-start event) is enabled fleet-wide and captures process name, full path, command line, and parent process; and that scheduled-task-creation telemetry (for example, Windows Security Event 4698, 'A scheduled task was created') is actually being generated, which on Windows requires the 'Audit Other Object Access Events' audit subcategory to be enabled — a setting that is not on by default in every configuration. Writing detection logic before confirming this produces a rule that can never fire, not because the technique never happens, but because the rule was built against data that was never there.",
    "**Step 3 — Draft the logic in vendor-neutral terms.** Before touching any platform's query language, write the condition as fields and relationships: alert when a process-creation event's process name is `schtasks.exe` (or a command line containing a task-creation argument), and the parent process is not one of the environment's known, allow-listed task-orchestration tools; in parallel, alert when a scheduled-task-creation event registers an action whose target path falls outside the environment's allow-listed installation directories, which also catches registration performed directly through the Task Scheduler COM API rather than through `schtasks.exe`. Expressing the logic this way first means it can be translated into any specific product's syntax later, and means the hypothesis and the logic can be reviewed by someone who has never used that product.",
    "**Step 4 — Build a synthetic test corpus, not a mental model of one.** A rule that has never been run against a concrete example — including an example of what it should *not* catch — has an unverified assumption baked into every one of its conditions. Below are three SIMULATED events built specifically for this article: one intended true positive, one intended true negative, and one intended false negative representing a known, documented coverage gap. None of them describes a real host, user, or company.",
    "SIMULATED true positive — host ALD-WKS-2214, user m.romero: a spawned `cmd.exe` process (parent: a document-viewer process, not an approved deployment tool) runs `schtasks.exe /create /tn \"WinUpdaterHelper\" /tr \"C:\\Users\\m.romero\\AppData\\Local\\Temp\\svcupd.exe\" /sc onlogon /ru SYSTEM`. The target path (`AppData\\Local\\Temp`) is outside the allow-listed installation directories, the parent process is not an approved orchestration tool, and `svcupd.exe` is unsigned and was created moments earlier by the same parent process. Every condition in Step 3's logic fires, and the correlation described below raises confidence further.",
    "SIMULATED true negative — host ALD-WKS-1187: an approved, baseline-allow-listed patch-management agent (identified by binary path plus cryptographic hash, not by process name) runs `schtasks.exe /create /tn \"AgentMaintenance\" /tr \"C:\\Program Files\\Patchly\\agent.exe\" /sc daily`. The target path is inside an allow-listed installation directory and the binary's hash matches the maintained baseline, so the suppression condition applies and no alert fires — this is intended behavior, not a missed detection.",
    "SIMULATED false negative (documented gap, not a hypothetical): a scheduled task is registered directly through the Task Scheduler COM API (`ITaskService`) on a host where the 'Audit Other Object Access Events' subcategory was never enabled. No process-creation event names `schtasks.exe` (it was never invoked), and no 4698-equivalent event is generated (the audit policy that produces it is off on that host). Neither of Step 3's conditions observes the registration. This is a property of audit-policy coverage on that specific host, not a flaw in the detection logic itself — but if it isn't written down as a known gap, a reviewer has no way to tell 'this technique wasn't attempted here' from 'this technique succeeded and the telemetry to see it was never turned on.'",
    "**Step 5 — Separate false-positive tuning from coverage-gap documentation.** These are different problems and need different fixes. A false positive means the logic fired on something legitimate — the fix is tightening or allow-listing the logic itself. A coverage gap (like the COM-API case above) means the logic is structurally unable to see a way the technique can be performed — the fix is either adding a data source that can see it, or writing down clearly that the gap exists and is accepted, not silently treating the rule as complete because it hasn't produced a false negative anyone has noticed yet.",
    "**Step 6 — Tune against binary identity, not names.** The dominant source of noise for this hypothesis is legitimate software — patch-management agents, backup clients, and licensing tools — routinely registering their own scheduled tasks as part of normal operation. Building the allow-list from process name or task name alone fails immediately, because both are trivially reused by whatever registered the malicious task in Step 4's true-positive example. Building it from binary path plus cryptographic hash is far harder to spoof, at the cost of needing to re-baseline the allow-list whenever legitimate tooling is upgraded.",
  ],
  validationEvidence: [
    "This guide's worked example uses SIMULATED telemetry and a fictional environment constructed specifically to illustrate the hypothesis-to-detection method end to end. It does not reproduce a deployed detection, a real environment's baseline, or a completed detection-engineering exercise against production telemetry, so its evidence state remains UNVERIFIED. Treat the specific logic, allow-list approach, and test cases as a worked illustration of the method, not as a validated rule ready to deploy as written.",
  ],
  limitations: [
    "This guide demonstrates the method through one technique (T1053.005, Scheduled Task persistence). The method generalizes to other techniques, but the specific fields, conditions, and thresholds shown here do not transfer directly to a different hypothesis — Steps 1 through 4 need to be redone for each new technique, not adapted by find-and-replace.",
    "The synthetic test events here are illustrative, not a statistically representative sample of any real environment's baseline traffic. A real tuning pass requires your own environment's actual volume of legitimate scheduled-task activity, not the three constructed examples in this guide.",
    "This guide does not cover SIEM- or EDR-specific query languages, alert routing, case-management workflow, or building a MITRE ATT&CK Navigator coverage layer — those are downstream operational concerns distinct from the hypothesis-to-logic method this guide focuses on.",
    "The documented COM-API coverage gap in Step 4 is specific to this one hypothesis and this one telemetry source; it is an example of how to recognize and record a gap, not an exhaustive list of every way T1053.005 can evade the logic shown here.",
  ],
  defensiveRecommendations: [
    "Write the attack hypothesis down in falsifiable form — technique ID, specific attacker action, specific expected telemetry signature — before writing any detection logic, and keep that hypothesis alongside the rule so a later reviewer can tell what it was actually meant to catch.",
    "Confirm the required telemetry exists and is populated in practice (not just enabled in a settings page) before deploying logic that depends on it.",
    "Build and version-control a small synthetic test corpus — true positives, true negatives, and known gaps — alongside the detection logic itself, and update both together when either changes.",
    "Tune allow-lists against binary path plus hash, not process name or task name alone, for any technique where the legitimate and malicious paths can share a tool name.",
    "Record known coverage gaps explicitly, including the specific telemetry or audit-policy dependency that creates them, rather than letting a deployed rule imply broader protection than it delivers.",
    "Revisit and re-test detections on a fixed cadence — legitimate tooling changes, audit policy drifts, and adversary behavior shifts all silently erode a rule's actual coverage over time even when nothing about the rule's own text has changed.",
  ],
  keyTakeaways: [
    "A detection built without an explicit, falsifiable hypothesis has unknown coverage, whether or not it has ever fired.",
    "Confirming telemetry availability and field population before writing logic prevents deploying a rule that can never fire in practice.",
    "A small, explicitly labeled synthetic test corpus — including known gaps, not just positive cases — validates logic before it reaches production and should be maintained alongside the rule.",
    "False-positive tuning and coverage-gap documentation are different problems: one is fixed by tightening the logic, the other is fixed by adding visibility or writing down what the rule structurally cannot see.",
    "Tuning against binary identity (path plus hash) rather than process or task names closes the easiest evasion for a technique where legitimate and malicious activity can share a tool name.",
  ],
  references: [
    "MITRE ATT&CK — Scheduled Task/Job: Scheduled Task (T1053.005): https://attack.mitre.org/techniques/T1053/005/",
    "MITRE ATT&CK — Scheduled Task/Job (T1053): https://attack.mitre.org/techniques/T1053/",
    "NIST SP 800-61 Rev. 2, Computer Security Incident Handling Guide: https://csrc.nist.gov/pubs/sp/800/61/r2/final",
    "NIST SP 800-94, Guide to Intrusion Detection and Prevention Systems (IDPS): https://csrc.nist.gov/pubs/sp/800/94/final",
    "NIST SP 800-137, Information Security Continuous Monitoring (ISCM) for Federal Information Systems and Organizations: https://csrc.nist.gov/pubs/sp/800/137/final",
    "Microsoft Learn — Sysmon (System Monitor) documentation: https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon",
    "Microsoft Learn — 4698(S): A scheduled task was created: https://learn.microsoft.com/en-us/windows/security/threat-protection/auditing/event-4698",
  ],
  relatedSlugs: ["threat-modeling-cicd-pipeline", "logs-are-not-proof-verifying-automated-actions"],
};

const module_: DetectionModule = {
  kind: "detection",
  hypothesis:
    "An attacker who has already obtained user-level code execution on a Windows endpoint registers a Scheduled Task (MITRE ATT&CK T1053.005) to re-launch their payload after logoff or reboot, preferring it over a registry Run key or a new service because scheduled-task creation blends into ordinary administrative and software-update activity and typically needs less privilege than a new service.",
  requiredDataSources: [
    "Process-creation telemetry (for example, Sysmon Event ID 1, or an EDR agent's equivalent process-start event) capturing process name, full path, command line, parent process, and executing user for every in-scope endpoint.",
    "Scheduled-task-creation telemetry (for example, Windows Security Event 4698, 'A scheduled task was created') capturing the task name, the registered action/command, and the creating account — this requires the 'Audit Other Object Access Events' subcategory to be enabled and is not universal by default.",
    "A maintained baseline inventory (binary path plus cryptographic hash) of software known to legitimately register scheduled tasks in the environment — patch management, backup agents, licensing and update clients — sufficient to distinguish expected registrations from unexpected ones.",
  ],
  detectionLogic: [
    "Alert when a process-creation event's process name is schtasks.exe (or its command line contains a task-creation argument) AND the parent process is not one of the environment's allow-listed task-orchestration tools.",
    "In parallel, alert when a scheduled-task-creation event (4698 or equivalent) registers an action whose target path falls outside the environment's allow-listed installation directories — this also catches direct Task Scheduler COM API registration that bypasses schtasks.exe entirely.",
    "Raise confidence, but do not require, when either signal correlates on the same host within a short window with an unsigned binary, a file newly created at the registered action's target path, or an outbound network connection from that binary near the task's configured run time.",
    "Suppress an alert only when the registered binary's full path and cryptographic hash match an entry in the maintained baseline allow-list — never suppress by process name or task name alone, since both are reused by the malicious path in the true-positive test case below.",
  ],
  testCases: [
    "SIMULATED true positive — host ALD-WKS-2214, user m.romero: cmd.exe (parent: a document-viewer process) runs schtasks.exe /create /tn \"WinUpdaterHelper\" /tr \"C:\\Users\\m.romero\\AppData\\Local\\Temp\\svcupd.exe\" /sc onlogon /ru SYSTEM. Target path is outside the allow-list, the parent process is not an approved orchestration tool, and svcupd.exe is unsigned and freshly created — all detection-logic conditions fire.",
    "SIMULATED true negative — host ALD-WKS-1187: an allow-listed patch-management agent (matched by path plus hash) runs schtasks.exe /create /tn \"AgentMaintenance\" /tr \"C:\\Program Files\\Patchly\\agent.exe\" /sc daily. Target path is inside an allow-listed directory and the hash matches the baseline; the suppression condition applies and no alert fires.",
    "SIMULATED false negative (documented gap): a task is registered via the Task Scheduler COM API (ITaskService) on a host where 'Audit Other Object Access Events' is not enabled. No schtasks.exe process event occurs and no 4698-equivalent event is generated, so neither detection-logic condition observes the registration. This is an audit-policy coverage gap on that host, not a flaw in the logic itself, and must be tracked as a known blind spot.",
  ],
  falsePositiveAnalysis: [
    "Software installers and patch-management agents routinely register scheduled tasks as part of normal operation; without a path-plus-hash allow-list, this is the dominant source of noise for this hypothesis.",
    "IT administrators running ad hoc scheduled tasks from an interactive session for legitimate maintenance will trigger the parent-process condition unless the baseline explicitly accounts for expected administrative activity — this argues for a documented exception process, not a blanket exclusion for every administrative account.",
    "Backup and licensing/update clients commonly re-register their scheduled tasks on every version upgrade; tracking the allow-list by task name rather than binary identity makes a routine software update look like a new, unexpected registration.",
  ],
  tuningGuidance: [
    "Build and maintain the allow-list from binary path plus cryptographic hash, not process name or task name alone — both names are trivially reused by whatever registers a malicious task.",
    "Re-baseline the allow-list on a fixed cadence tied to known upgrade cycles for patch-management and backup tooling, not only when a false positive is reported, so it neither goes stale nor silently keeps allow-listing a binary version no longer installed.",
    "Track the 'Audit Other Object Access Events' dependency as its own monitored control across the fleet, rather than assuming scheduled-task-creation telemetry is universally present just because the detection logic references it.",
    "When the correlation signal (signing status, file-creation timing, network activity) is unavailable for a given host, fall back to the two primary conditions alone at lower confidence, and record that confidence downgrade explicitly in the alert rather than silently dropping the check.",
  ],
  mitreMapping: [
    "T1053.005 — Scheduled Task/Job: Scheduled Task (primary hypothesis)",
    "T1053 — Scheduled Task/Job (parent technique)",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Turning an Attack Hypothesis into a Detection",
    slug: "turning-attack-hypothesis-into-detection",
    summary:
      "A worked, synthetic-data walkthrough of turning a falsifiable attack hypothesis into a maintainable detection — from telemetry validation and vendor-neutral logic through a synthetic test corpus, false-positive analysis, and tuning.",
    pillar: "detect-respond",
    primaryCategory: "detection-engineering",
    contentType: "detection",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["detection-engineering", "threat-modeling", "logging-monitoring"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 14,
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
