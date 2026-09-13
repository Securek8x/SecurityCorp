// Knowledge-base article (Bead securitycorp-source-4zl.56.1.2, "Choosing
// Telemetry Before Writing Detection Logic"). Drafted 2026-09-06 as
// `status: "drafting"` — NOT authorized for publication by this agent. Every
// event, host, user, and company name in this file is fictional and is
// labeled SIMULATED where it appears in prose; there is no employer-derived
// telemetry, rule, threshold, screenshot, or case anywhere in this file, per
// this Bead's safety requirements and docs/publication-safety-policy.md. No
// absolute filesystem path appears anywhere in this file — locations are
// described in prose, matching the pattern in the companion article below.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788741615854-tshqvx, template "research", task
// scoped to this article's exact objective/audience/scope — telemetry
// sufficiency as a precondition for detection logic). A bounded
// mcp__ruflo__workflow_status check afterward reproduced the same documented
// issue recorded in CLAUDE.md ("Current Ruflo executor limitation"): the
// workflow stayed at 0% progress with a single pending "Execute" step and
// returned no retrievable editorial output. This draft was therefore
// produced with the disclosed native fallback instead — separate sequential
// research (technique and citation verification via WebFetch against the
// primary MITRE ATT&CK, NIST, and Microsoft Learn pages, not recalled from
// memory), drafting, technical verification, publication-safety review, and
// a final editorial pass — none of it credited to Ruflo. See the calling
// agent's final report for full editorial-routing evidence.
//
// Companion-article note: this is the natural companion to
// "Turning an Attack Hypothesis into a Detection" (turning-attack-
// hypothesis-into-detection), which walks the full hypothesis-to-detection
// loop and treats telemetry confirmation as one step among several. This
// article does not re-derive that walkthrough; it goes deep on the
// telemetry-selection question specifically and cross-references the
// companion via relatedSlugs instead of repeating its worked example. The
// two articles use different fictional companies, hosts, and attack
// hypotheses so neither can be mistaken for a continuation of the other.
//
// Worked example: a fictional company ("Thornfield Analytics"), a fictional
// host, and a fictional user are used to walk one attack hypothesis
// (T1059.001, obfuscated PowerShell execution) through a telemetry-
// sufficiency check that fails — the exact event type fires fleet-wide, but
// the one field the draft detection logic depends on is empty in practice,
// making the original rule dead on arrival until the underlying
// configuration gap is fixed or the data source is changed. Every log line
// and test case is explicitly marked SIMULATED.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, DetectionModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "\"We have logs for that\" is one of the most common wrong answers in detection engineering, because it treats telemetry as a single yes/no property when it is actually three separate claims stacked on top of each other: that an event type exists at all for a given product or platform, that the event type is actually enabled and firing in this specific environment, and that the specific field a detection's logic depends on is actually populated on the events that fire. Any of the three can be true while the others are false, and a detection drafted before checking all three can pass every review that only checks the first one — and still never fire in production, for reasons that look identical from the outside to \"the attacker never tried this.\"",
    "This guide is about the telemetry-selection question specifically, not the full hypothesis-to-detection method — see \"Turning an Attack Hypothesis into a Detection\" for that end-to-end walkthrough, which treats telemetry confirmation as one step among several. Here, one worked example (a fictional company discovering that a detection idea is dead on arrival because a required field is empty in practice, even though the event type itself fires fleet-wide) is used to make the three-level check concrete, followed by how to confirm a log source's actual retention covers a detection's assumed lookback, and how to record a telemetry gap as a documented limitation instead of silently shipping a rule that can never do what its name claims.",
  ],
  whatYouWillLearn: [
    "Why \"the event type exists\" is not the same claim as \"the field my detection logic reads is populated in practice\" — and how to check the second claim directly instead of inferring it from the first.",
    "How to confirm a log source's actual retention window covers a detection's assumed lookback, rather than assuming a hunting or backtest query can reach as far back as the detection's design implies.",
    "The difference between telemetry that exists in principle — a vendor's documentation describes an event type's full capability — and telemetry that is actually enabled and flowing in one specific environment, which depends on audit-policy and agent-configuration settings the documentation cannot see.",
    "A worked, synthetic example of discovering a detection idea is dead on arrival: the relevant event fires fleet-wide, but the one field the logic depends on is empty by default and requires a separate, easy-to-miss configuration setting.",
    "How to record a discovered telemetry gap as an explicit, documented limitation — including the exact dependency and how it was confirmed — instead of deploying a rule that quietly can never fire.",
  ],
  intendedAudience: [
    "Detection engineers scoping a new detection idea who want to check telemetry sufficiency before investing time in logic, test cases, and tuning that depend on data that was never really there.",
    "Security practitioners reviewing an inherited or vendor-recommended detection who want to verify its stated data-source dependency actually holds in their own environment before trusting it.",
    "Technical leads standing up a detection-engineering practice who need a repeatable check for \"is this telemetry actually good enough\" that goes deeper than confirming a log source is connected.",
  ],
  prerequisites: [
    "Basic familiarity with how security telemetry is typically structured (event types, fields, audit policies or agent configuration profiles that control what gets collected).",
    "No lab environment, SIEM, or EDR product is required to follow this guide — every event, host, and identity below is fictional and synthetic, built specifically to illustrate the method.",
    "Reading \"Turning an Attack Hypothesis into a Detection\" first is helpful for the broader method this guide fits into, but is not required — this guide is self-contained on the telemetry-selection question.",
  ],
  problem: [
    "A detection idea usually gets scoped against a data source the way a shopping list gets checked against a pantry: does this ingredient exist here, yes or no. That check catches the easy failure (no log source connected at all) and misses the two harder ones: whether the specific event type the idea depends on is actually being generated in this environment rather than merely supported by the platform in general, and whether the specific field the detection logic reads is populated on the events that do fire. A log source can be \"connected\" in every dashboard that reports connection status while still producing events with the one field a rule needs left empty on every single occurrence.",
    "The failure mode this produces is worse than a rule that never gets written, because a deployed rule that structurally cannot fire looks, from a coverage report, identical to a rule that is working and simply hasn't seen the technique yet. Nobody investigates a quiet rule. The gap survives every audit that only asks \"is there a rule for this technique\" and fails only the audit that asks \"has this rule's logic ever actually been exercised by a real event with the field populated the way the logic assumes\" — a much rarer and more expensive question to ask after the fact than before deployment.",
  ],
  threatModel: [
    "Fictional environment used throughout this guide: Thornfield Analytics, a fictional company running a fleet of Windows endpoints. All hostnames (for example, host identifier THN-WKS-3312), usernames (for example, r.delgado), and log lines below are constructed for this article and do not describe any real host, account, employer, or incident.",
    "Attack hypothesis: an attacker who has obtained user-level code execution on an endpoint — through a phishing attachment, matching MITRE ATT&CK's Initial Access tactic but not itself the subject of this guide — runs an obfuscated PowerShell command using the encoded-command execution form (MITRE ATT&CK T1059.001, Command and Scripting Interpreter: PowerShell) to stage a secondary payload. Encoding the command as a base64 argument rather than a plaintext one-liner is intended to evade simple string matching against the visible arguments and does not require any privilege beyond running a process as the compromised user's own account — no elevation is assumed or needed for this action.",
    "Assets and actors in scope: any endpoint in Thornfield Analytics' fleet with process-creation telemetry available; a post-compromise attacker or malicious tool with user-level code execution, not a specific named threat actor. Out of scope: the phishing delivery vector itself, the payload the encoded command ultimately stages, and any specific SIEM or EDR product's query syntax — the telemetry-sufficiency check below is what determines whether vendor-neutral detection logic against this hypothesis is even viable, independent of which platform would eventually run it.",
  ],
  mainContent: [
    "**Level 1 — Does the event type exist for this platform at all?** This is the check most detection ideas already get, and the one vendor documentation answers directly: does Windows, or a given EDR agent, or a cloud provider's audit trail, support an event type that captures the action the hypothesis cares about. For this hypothesis, the answer is yes on more than one axis — Windows Security Event 4688 (\"A new process has been created\") fires whenever the \"Audit Process Creation\" audit subcategory is enabled, and Sysmon's Event ID 1 (process creation) is a documented, purpose-built alternative. Confirming this level is necessary but is only the first of three checks, and by itself proves nothing about whether either event type is actually useful in one specific environment.",
    "**Level 2 — Is the event type actually enabled and firing in this environment?** A platform supporting an event type in general does not mean a given fleet has turned it on. \"Audit Process Creation\" is not enabled by default in every Windows configuration, and Sysmon is a separate agent that has to be deployed and configured host by host — a vendor's documentation cannot see whether either condition holds in Thornfield Analytics' fleet specifically. Confirming this level means checking the actual, current audit policy or agent configuration on representative hosts, and confirming the event type is generating a nonzero, plausible volume of events in the log platform itself — not just that the setting exists somewhere in a baseline configuration document.",
    "**Level 3 — Is the specific field the logic depends on actually populated?** This is the level that gets skipped most often, because it looks identical to Level 2 from a dashboard: the event type is firing, event counts are healthy, and it is easy to conclude the telemetry is \"good.\" It isn't, unless the one field the detection logic reads is confirmed non-empty on real events — and this is exactly where Event 4688 hides its trap: the event fires on every process start once Level 2's audit subcategory is enabled, but the Process Command Line field inside that same event is empty by default, and only gets populated if a separate policy — \"Include command line in process creation events,\" under Administrative Templates\\System\\Audit Process Creation in Group Policy — is also enabled (Microsoft Learn, event 4688 documentation). A detection idea built on matching command-line content against 4688 can pass Levels 1 and 2 completely and still be structurally incapable of ever evaluating true, because the field it reads was never turned on.",
    "**The worked example: a detection idea that's dead on arrival.** A Thornfield Analytics detection engineer drafts logic for the hypothesis above: alert when a process-creation event for `powershell.exe` has a command line containing an encoded-command indicator. Level 1 passes immediately — Windows documents exactly this capability. Level 2 also appears to pass: a query against the log platform shows Event 4688 firing across the fleet at a healthy, expected volume, which reads as \"the telemetry exists and is flowing.\" The mistake is treating that as sufficient. When the engineer pulls one real SIMULATED 4688 event from host THN-WKS-3312 for user r.delgado to validate the logic before deployment, the event's Process Command Line field is present as a field name but contains no value — exactly the default Microsoft Learn describes, because the \"Include command line in process creation events\" policy was never separately enabled anywhere in the fleet's baseline. Every 4688 event ever generated in this environment, past and future, has and will have this field empty. The detection logic as drafted cannot ever evaluate true; it was dead on arrival the moment it was written, not because the technique hasn't been attempted, but because the one field it depends on was never populated by an existing, firing, healthy-volume event type.",
    "**Confirming retention covers the assumed lookback — a second, independent way telemetry can be insufficient.** Even after the field-population problem above is understood, a second and separate question remains: how far back can this log source actually be searched. The hypothesis assumes a detection engineer investigating a downstream alert would want to hunt back roughly 45 days for earlier, unnoticed encoded-command executions on the same or related hosts — a routine assumption when dwell time between initial access and a triggering event is unknown. NIST SP 800-92 frames retention as a decision that should be driven by an organization's own risk assessment and any applicable legal or regulatory requirements, not treated as a fixed default; NIST SP 800-137 frames periodically reassessing what is collected and how long it is kept as part of a continuous-monitoring program's own maturity, not a one-time setup decision. Neither document can tell an engineer what a specific index's retention is actually configured to — that has to be checked directly, the same way field population does. In this worked example, the log platform's actual configured retention for this specific process-creation index turns out to be 14 days, not 45; a hunt or backtest query written against the hypothesis's assumed lookback would silently return zero results past day 14, indistinguishable from a genuinely clean history unless the retention gap is known and stated up front.",
    "**Telemetry that exists in principle is not evidence it exists in this environment.** The through-line connecting the field-population and retention findings above is the same distinction, applied twice: what a vendor's documentation says an event type or platform is capable of, under a fully configured deployment, is a capability claim — not a fact about one specific environment's actual audit policy, agent configuration, or retention settings. Sysmon's Event ID 1 is a useful contrast here: it populates its own CommandLine field by default, with no separate second setting required, which genuinely does close the Level 3 gap Event 4688 has — but only on hosts where the Sysmon agent is actually deployed and its configuration file requests process-creation logging, which is itself a Level 2 question that has to be checked host by host, not assumed from the fact that Sysmon is documented to support it.",
    "**Two different fixes for two different gaps.** The field-population gap and the retention gap each have their own fix, and neither is a change to the detection logic itself. Fixing the field-population gap means enabling the missing \"Include command line in process creation events\" policy fleet-wide — a configuration-remediation action with its own rollout timeline, and one that only populates the field going forward, not retroactively on already-collected events — or shifting the data source to Sysmon Event ID 1 on hosts where it is confirmed deployed and configured for process creation, accepting that this leaves any host without Sysmon at the same Level 3 gap Event 4688 already has. Fixing the retention gap means either changing the log platform's retention configuration for that index — an infrastructure or licensing decision, not something a detection author can do unilaterally — or explicitly narrowing the detection's documented lookback claim to match what is actually retained, so nobody hunts past day 14 believing the query reached day 45.",
    "**Recording the gap instead of silently shipping a dead rule.** Whichever fix path is chosen, and even before either fix lands, the gap itself belongs in the detection's own record: the exact field and event-type dependency, the specific audit-policy or agent-configuration setting that has to be true for that field to populate, how that was confirmed (a real pulled event showing the field non-empty, not an event-count dashboard), and the log source's actual retention window compared against any lookback claim the detection or its playbook makes. A future reviewer who sees only \"no alerts fired\" cannot tell a dead rule from a quiet one; a future reviewer who sees the documented dependency and its confirmation method can.",
  ],
  validationEvidence: [
    "This guide's worked example uses SIMULATED telemetry and a fictional environment constructed specifically to illustrate the telemetry-sufficiency method. It does not reproduce a deployed detection, a real environment's audit-policy baseline, or a completed telemetry audit against production systems, so its evidence state remains UNVERIFIED. The factual claims about Windows Event 4688's default field behavior and the specific Group Policy setting that changes it are drawn from Microsoft's own published documentation (cited in References) and are accurate as documented there; the fictional company's specific configuration state is illustrative, not a report of any real environment.",
  ],
  limitations: [
    "This guide demonstrates the three-level telemetry check through one platform and one event type (Windows Event 4688 and Sysmon Event ID 1). The same three-level structure — capability exists, is enabled and flowing, has the needed field populated — applies to other platforms and event sources, but the specific settings that gate each level are different for each one and have to be checked directly rather than assumed by analogy.",
    "This guide does not cover cloud-provider audit-log field gaps, which follow the same three-level structure but with different specific settings (for example, a cloud API audit trail that logs an action but omits a request-parameter field unless a separate detailed-logging tier is enabled) — that is a distinct worked example this guide does not attempt.",
    "This guide does not cover SIEM- or log-platform-specific retention-tier mechanics (hot versus cold storage, index lifecycle policies, or licensing-driven retention caps) beyond the general point that actual configured retention must be checked directly; those mechanics are product-specific and out of scope for a vendor-neutral guide.",
    "The worked example's dead-on-arrival finding is specific to this one hypothesis and this one field dependency; it illustrates how to recognize and record this class of gap, not an exhaustive list of every telemetry-sufficiency failure T1059.001 detections can encounter.",
  ],
  defensiveRecommendations: [
    "Before writing detection logic, check telemetry sufficiency at all three levels: the event type exists for the platform, the event type is actually enabled and firing in this environment, and the specific field the logic reads is actually populated — confirmed against a real pulled event, not inferred from an event-count dashboard.",
    "Confirm a log source's actual configured retention against any lookback assumption a detection or its response playbook makes, using the organization's own risk assessment and applicable requirements to set the target (NIST SP 800-92), and revisit that check periodically as part of ongoing continuous-monitoring practice (NIST SP 800-137) rather than only at initial deployment.",
    "Treat vendor and platform documentation as a description of what an event type or platform is capable of under a fully configured deployment, not as evidence that a specific environment's audit policy or agent configuration currently matches that description.",
    "When a required field or event type turns out to be missing in practice, record the exact dependency, the setting that would fix it, and how the gap was confirmed — as a documented, known limitation alongside the detection — rather than deploying logic that can never fire and letting silence be mistaken for coverage.",
    "Re-verify field population and retention after any platform upgrade, agent-configuration change, or audit-policy change — defaults and configured settings can shift silently, and a detection that passed its sufficiency check once is not guaranteed to still pass it after the environment around it changes.",
  ],
  keyTakeaways: [
    "Telemetry sufficiency is three separate claims, not one: the event type exists for the platform, it is actually enabled and firing in this environment, and the specific field the detection logic depends on is actually populated on events that fire — any can be true while the others are false.",
    "A required field can be empty by default even when the event type that carries it fires reliably and at healthy volume — Windows Event 4688's Process Command Line field, empty unless a separate Group Policy setting is enabled, is a documented, real-world example of exactly this gap.",
    "A detection's assumed lookback is meaningless unless it is checked against the log source's actual configured retention — a hunt or backtest can silently return an empty, seemingly clean result past the point retention actually stops, not because nothing happened but because nothing was kept.",
    "Vendor documentation describes what a platform or event type is capable of under full configuration; it is not evidence that one specific environment's audit policy, agent configuration, or retention settings actually match that description.",
    "A telemetry gap discovered during scoping should be recorded as an explicit, documented limitation — the dependency, the fix, and how the gap was confirmed — rather than left implicit in a rule that quietly can never fire.",
  ],
  references: [
    "MITRE ATT&CK — Command and Scripting Interpreter: PowerShell (T1059.001): https://attack.mitre.org/techniques/T1059/001/",
    "MITRE ATT&CK — Command and Scripting Interpreter (T1059): https://attack.mitre.org/techniques/T1059/",
    "NIST SP 800-92, Guide to Computer Security Log Management: https://csrc.nist.gov/pubs/sp/800/92/final",
    "NIST SP 800-137, Information Security Continuous Monitoring (ISCM) for Federal Information Systems and Organizations: https://csrc.nist.gov/pubs/sp/800/137/final",
    "Microsoft Learn — 4688(S): A new process has been created (documents the Process Command Line field's default empty state and the Group Policy setting required to populate it): https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4688",
    "Microsoft Learn — Sysmon (System Monitor) documentation: https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon",
    "CISA (with ASD's ACSC and international partners) — Best Practices for Event Logging and Threat Detection: https://www.cisa.gov/resources-tools/resources/best-practices-event-logging-and-threat-detection",
  ],
  relatedSlugs: ["turning-attack-hypothesis-into-detection", "logs-are-not-proof-verifying-automated-actions"],
};

const module_: DetectionModule = {
  kind: "detection",
  hypothesis:
    "An attacker with user-level code execution on a Windows endpoint (obtained through a phishing attachment, out of scope here) runs an obfuscated PowerShell command using the encoded-command execution form (MITRE ATT&CK T1059.001) to stage a secondary payload, intending base64 encoding to evade simple plaintext string matching against the visible command-line arguments.",
  requiredDataSources: [
    "Process-creation telemetry that includes the actual command-line argument text for powershell.exe (or pwsh.exe) processes — not merely an event indicating a process started, but confirmed field-level population of the command-line content on real events pulled from the environment.",
    "Confirmation of the specific audit-policy or agent-configuration setting that gates whether that command-line field is populated — for Windows Event 4688, the separate 'Include command line in process creation events' Group Policy setting; for Sysmon Event ID 1, confirmed deployment and configuration on the relevant hosts.",
    "A confirmed retention window for the chosen log source that covers the detection's or its response playbook's assumed lookback for retrospective hunting, checked directly against the log platform's actual configuration rather than assumed from a general retention policy document.",
  ],
  detectionLogic: [
    "Alert when a process-creation event for powershell.exe or pwsh.exe has a command line containing an encoded-command indicator (for example, an -EncodedCommand or -enc argument form) — evaluated only after Level 3 telemetry sufficiency is confirmed: the command-line field is verified non-empty on real events from this log source in this environment, not merely present as a field name.",
    "Where the primary log source's command-line field is confirmed empty in practice (the worked example's finding for Windows Event 4688 without the separate Group Policy setting enabled), the logic cannot evaluate and must not be deployed against that source until the field-population gap is fixed or the data source is changed to one with confirmed field population, such as Sysmon Event ID 1 on hosts where it is deployed and configured.",
    "Scope any retrospective hunting or backtest query built on this logic to the log source's actual confirmed retention window, not the hypothesis's assumed lookback, until retention is verified to cover that lookback.",
  ],
  testCases: [
    "SIMULATED dead-on-arrival case — host THN-WKS-3312, user r.delgado: a Windows Event 4688 process-creation event fires for powershell.exe as expected (Level 1 and Level 2 both pass — the event type exists and is firing at healthy volume fleet-wide), but the event's Process Command Line field is present with no value, because the 'Include command line in process creation events' Group Policy setting was never enabled anywhere in the fleet's baseline. The detection logic above cannot evaluate against this event regardless of what the actual command line contained — this is the Level 3 failure the worked example walks through, not a hypothetical.",
    "SIMULATED true positive after remediation — the same host and user, after the missing Group Policy setting is enabled fleet-wide: a subsequent Event 4688 for powershell.exe now carries a populated Process Command Line field containing an -EncodedCommand argument, and the detection logic evaluates true. This event postdates the fix; it does not retroactively populate the field on any 4688 event generated before the policy change.",
    "SIMULATED alternate-source true positive — a different host confirmed to run the Sysmon agent with process-creation logging configured: a Sysmon Event ID 1 for powershell.exe carries a populated CommandLine field by default, with no separate Group Policy dependency, and the detection logic evaluates true on this host even before the Event 4688 remediation above lands fleet-wide — illustrating that the same hypothesis can be covered on some hosts and blind on others depending on which telemetry source each host actually has configured.",
  ],
  falsePositiveAnalysis: [
    "Legitimate administrative scripts and deployment tooling routinely invoke PowerShell with an encoded command to avoid shell-quoting issues with complex arguments, not to evade detection — an allow-list keyed to the specific automation tool's signed binary identity (not to the mere presence of an encoded-command argument) is necessary before this logic is deployed broadly, though building that allow-list is out of scope for this telemetry-focused guide.",
    "Once the field-population and retention gaps above are fixed, false-positive volume itself becomes measurable for the first time — before that point, a rule with an empty required field produces zero alerts of any kind, true or false, which must not be misread as 'well-tuned.'",
  ],
  tuningGuidance: [
    "Re-verify command-line field population after any Group Policy change, Windows feature update, or Sysmon configuration change — the setting that gates this field can be reverted or drift out of a baseline without the event type itself changing in any way that would be visible from an event-count dashboard.",
    "Track the 'Include command line in process creation events' policy (or the equivalent Sysmon deployment-and-configuration state) as its own explicitly monitored control across the fleet, the same way an audit-policy dependency was tracked in the companion article's worked example, rather than assuming it once confirmed on one host generalizes to the rest of the fleet.",
    "When retention is shorter than a lookback claim, state the actual retained window explicitly in the detection's own documentation and in any linked response playbook, so an investigator hunting against this rule knows the real boundary before concluding an absence of results means a clean history.",
  ],
  mitreMapping: [
    "T1059.001 — Command and Scripting Interpreter: PowerShell (primary hypothesis)",
    "T1059 — Command and Scripting Interpreter (parent technique)",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Choosing Telemetry Before Writing Detection Logic",
    slug: "choosing-telemetry-before-writing-detection-logic",
    summary:
      "A synthetic-data guide to confirming telemetry is actually sufficient — not just present — before writing detection logic: field-level completeness versus mere log existence, verifying retention covers an assumed lookback, and the gap between telemetry that exists in principle and telemetry that is actually enabled and flowing in one specific environment, with a worked example of a detection that is dead on arrival because a required field is empty even though the event type fires.",
    pillar: "detect-respond",
    primaryCategory: "detection-engineering",
    contentType: "detection",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["detection-engineering", "logging-monitoring", "edr"],
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
