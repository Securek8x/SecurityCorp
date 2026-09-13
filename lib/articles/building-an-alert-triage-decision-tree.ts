// Knowledge-base article draft (Bead securitycorp-source-4zl.56.2.3,
// "Building an Alert-Triage Decision Tree", category
// securitycorp-source-4zl.56.2 "SOC Operations and Alert Tuning"). Status is
// intentionally "drafting" — see docs/publication-safety-policy.md. This
// file is registered in lib/knowledge-content.ts as a drafting-status
// entry; it becomes part of the published catalog only after human privacy/
// technical/publication review, per docs/knowledge-base.md. Every
// organization, analyst, alert, and record described here is fictional and
// sanitized; no real SOC case, alert configuration, telemetry, or employer-
// derived rule appears anywhere in this file.
//
// Judgment calls (for the reviewer):
// - primaryCategory "soc-operations" is lib/taxonomy.ts's existing category
//   id for "SOC Operations and Alert Tuning" (securitycorp-source-4zl.56.2)
//   — not invented.
// - Controlled tags: the bead's suggested "soc-operations" is a canonical
//   id in lib/knowledge-tags.ts and is used as-is. Its other two
//   suggestions, "triage" and "playbook", are not canonical tag ids —
//   "playbook" is the contentType, not a tag, and there is no vocabulary
//   entry for "triage" itself. Closest real substitutes used instead:
//   "incident-response" (this article's decision sequence is a direct
//   operationalization of NIST SP 800-61 Rev. 3's RS.MA/DE.AE incident-
//   triage and adverse-event-analysis guidance, both incident-response
//   concepts), and "logging-monitoring" (the context-gathering and
//   correlation steps the tree opens with are a monitoring/log-review
//   practice, distinct from both siblings' "detection-engineering" tag,
//   which this article deliberately does not use since it is not about
//   detection logic).
// - contentType "playbook" (bead-specified) maps to PlaybookModule
//   (lib/knowledge-content-types.ts). Unlike both siblings — which had to
//   repurpose the trigger/severity/triage/decisionPoints/escalation/
//   containment/recovery shape for a non-live change-management process —
//   this article is a live alert-triage workflow, so the module is used in
//   its more natural sense: "trigger" is an alert reaching the queue,
//   "triage" is the ordered context-gathering sequence, "decisionPoints"
//   are the four disposition branches, and so on.
// - No coverImage is added — that workflow is separate and out of scope
//   for this task.
// - No diagram is added. The four-branch decision tree is already fully
//   represented as a structured module (PlaybookModule's triage/
//   decisionPoints/escalation fields), which is the more precise medium for
//   an ordered checklist with named evidence criteria than a node/edge flow
//   diagram would be; a diagram would be a second, redundant representation
//   of the same sequence rather than adding new information.
// - relatedSlugs point at "false-positive-vs-benign-positive" (verified via
//   that file's own meta.slug, not its filename) and
//   "tuning-soc-alerts-without-hiding-real-attacks" (same verification).
//   This article is the practical next step after both: it assumes the
//   false-positive/benign-positive classification question and the tuning
//   techniques are separate, and does not re-derive either — it covers the
//   ordered sequence of checks and evidence criteria that gets an analyst
//   to the point of making that classification call at all.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788756018296-86sfw3, template "research", task
// describing this article's research brief needs: NIST/MITRE/CISA-grounded
// sourcing for a concrete alert-triage decision sequence). A bounded
// mcp__ruflo__workflow_status check afterward showed it reproduced the
// documented issue in CLAUDE.md: 0% progress, a single pending "Execute"
// step, no retrievable editorial output. This draft was therefore produced
// with the disclosed native fallback instead — separate research (primary-
// source verification via WebFetch/WebSearch against csrc.nist.gov,
// attack.mitre.org, and cisa.gov, and direct extraction of NIST SP 800-61
// Rev. 3's downloaded PDF text since the HTML abstract page carries no body
// content — not recalled from memory; this is what surfaced the exact
// RS.MA/DE.AE risk-evaluation-factor and adverse-event-analysis language
// cited below), drafting, technical-verification, publication-safety, and
// final editorial passes — not credited to Ruflo. See the calling agent's
// final report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, PlaybookModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "An alert reaching a human is the easy part; deciding what to do about it is where triage actually happens, and that decision is too often made ad hoc — by whichever analyst is on shift, using whatever check they happen to think of first, in whatever order feels natural that day. NIST's current incident-handling guidance is blunt about the stakes of getting this specific step right: evaluating an alert's overall risk and applying the correct prioritization is described as perhaps the most critical decision point in the entire incident response process, precisely because resource limits mean alerts cannot be handled first-come, first-served. This playbook is that decision, made explicit: a repeatable sequence for reaching one of four dispositions — escalate now, close as benign, close as false positive, or hold for more evidence — starting from the moment an alert lands in the queue.",
    "It assumes the classification question is already answered elsewhere: distinguishing a false positive from a benign positive is its own playbook (see this site's companion guide), and this article does not re-derive that distinction. What it covers instead is the sequence that gets an analyst to the point of being able to make that call at all — what to check first, in what order, and what specific evidence resolves an alert that isn't yet clearly one thing or the other. Every organization, analyst, and alert described here is synthetic.",
  ],
  whatYouWillLearn: [
    "What context to gather before making any disposition call — asset criticality, recent related activity on the same account or host, and whether a known-legitimate explanation is already available — and why skipping this step is what makes the rest of the tree unreliable.",
    "Why cheap, fast checks belong before expensive, slow ones, and what that ordering actually looks like against a real alert.",
    "Explicit, evidence-based criteria for each of the four disposition branches: escalate now, close as benign, close as false positive, and hold for more evidence.",
    "What 'needs more evidence' concretely means — which specific additional data resolves the ambiguity — instead of functioning as an indefinite parking state.",
    "A worked, fully fictional walkthrough applying the tree to one alert from first check to final disposition.",
  ],
  intendedAudience: [
    "SOC analysts making disposition decisions on incoming alerts, especially those newer to the role who are still building a repeatable process rather than relying on pattern-matched instinct.",
    "Senior analysts and team leads formalizing an informal or tribal-knowledge triage process into something a new team member can follow and a reviewer can audit.",
    "Detection engineers who want a clear, predictable handoff from triage — what an analyst actually checked, in what order, before reaching a disposition.",
  ],
  prerequisites: [
    "Basic familiarity with how a SIEM or EDR platform surfaces an alert, its enrichment fields, and basic process/account/network correlation queries.",
    "No lab environment is required; every example in this guide is fictional and descriptive, not a runnable exercise.",
    "Reading this site's companion guides on false positive vs. benign positive and on tuning SOC alerts is useful background — this playbook assumes the classification distinction the first guide covers and does not repeat it, and treats the tuning techniques the second guide covers as a separate, later step — but neither is required before this one.",
  ],
  problem: [
    "Every SOC analyst eventually develops a personal triage process — a mental checklist of what to look at first, what usually turns out to matter, what usually doesn't. That process being personal, rather than shared and explicit, is the actual problem. NIST's current incident-handling guidance states plainly that evaluating an incident's overall risk and applying the appropriate prioritization is 'perhaps the most critical decision point' in the entire response process, and that because of resource limitations, incidents cannot be handled on a first-come, first-served basis — triage has to run on a deliberate, risk-based sequence, not on habit or queue position.",
    "An undocumented, personal process fails in two directions, and both are common. An analyst who defaults to caution escalates everything ambiguous, which trains incident responders to discount escalations from that analyst over time — the opposite of the intended safety margin. An analyst who defaults to speed pattern-matches an alert against 'the usual noise' and closes it without checking the evidence that would actually confirm that judgment, which is indistinguishable, from the outside, from a real attack being waved through. A written decision sequence — what to check, in what order, and what specific evidence justifies each outcome — is what makes triage a process a team can audit, teach, and improve, instead of a skill that leaves with whoever built it.",
  ],
  threatModel: [
    "This is not an adversary threat model in the usual sense. The risk here is a defensive-process failure: without an explicit, ordered decision sequence, triage quality depends entirely on which analyst is on shift and how much unstructured judgment they bring to a given alert — and neither of those is something a team can verify, audit, or improve directly.",
    "Representative scenario, fictional throughout: a mid-size logistics company we'll call Kestrel Bay Logistics runs a SOC that receives EDR and SIEM alerts from across its fleet of endpoints and a handful of internal applications, including an accounts-payable system. On a Tuesday afternoon, an EDR alert fires against a workstation used by a member of the accounts-payable team, describing a PowerShell process spawned by an office productivity application with an encoded command line — a pattern consistent with MITRE ATT&CK T1204.002, User Execution: Malicious File, feeding into T1059.001, Command and Scripting Interpreter: PowerShell. The on-call analyst has to decide what to do with it, in what order, before anyone with more context or more authority gets involved.",
    "Failure modes to watch for without an explicit decision sequence: (1) an analyst checks whatever field is visible first — often the alert's own severity label or a generic description — rather than the specific context (asset criticality, recent related activity, a known-legitimate explanation) that actually determines the correct disposition; (2) an analyst runs an expensive check (a live host interaction, a call to an asset owner, a request to a downstream team) before a cheap one (the alert's own enrichment fields, a fast correlation query) that could have resolved the question in seconds; (3) an alert that is genuinely ambiguous — not clearly benign, not clearly confirmed — gets forced into 'closed' because the queue has to move, rather than held with a specific, time-boxed next step; (4) a disposition decision is recorded with no note of what evidence supported it, so a later reviewer, or the same analyst months later, cannot tell whether the reasoning still applies.",
    "Out of scope: the mechanics of telling a false positive apart from a benign positive once evidence is in hand (see this site's companion guide on that classification), and the techniques used to tune a detection's logic once a recurring benign-positive pattern is confirmed (see this site's guide on tuning SOC alerts without hiding real attacks). This guide is about the sequence that gets an analyst to a disposition in the first place.",
  ],
  mainContent: [
    "**Context before conclusions: three checks before any disposition call.** Before evaluating whether an alert's own criteria were actually met — the question that eventually separates a false positive from a benign positive from a true positive — establish three things about the alert's context. First, asset criticality: what does the affected host or account actually touch, and what would the impact be if the alert's worst-case interpretation were true? NIST's incident-handling guidance lists asset criticality first among the risk-evaluation factors that should drive triage and prioritization, alongside functional impact, data impact, and recoverability. Second, recent related activity: has this account or host produced other flags recently, even low-confidence ones, that would make an otherwise-marginal alert look different in combination? A single ambiguous alert and three ambiguous alerts against the same host in a week are not the same triage problem. Third, whether a known-legitimate explanation is already available — a change record, a deployment ticket, a documented job schedule — because if one exists and can be verified quickly, it resolves a large share of alerts before any deeper investigation is warranted at all. Skipping straight to 'is this malicious' without these three checks is what makes an analyst's disposition depend on instinct rather than on the actual shape of the alert.",
    "**Order operations from cheap to expensive, not from familiar to unfamiliar.** A platform's own enrichment fields — reputation lookups already run against an observed indicator, a process-lineage summary, an existing account or asset tag — cost nothing beyond reading them and should be checked first, every time, regardless of how familiar or unfamiliar the alert type looks. NIST's guidance on adverse-event analysis makes the same point structurally: because the volume of potentially adverse events is too high for uniform manual review, organizations are expected to rely on automated filtering to reduce a large dataset to the subset that actually warrants human attention, rather than manually reviewing everything to the same depth. A fast, targeted correlation query — has this account triggered anything else recently, does this process's parent-child relationship match a known-benign pattern — comes next, because it's still cheap relative to what follows: pulling additional raw logs from an adjacent data source, contacting an asset owner or a downstream team to verify a claimed legitimate cause, or a live interactive check against the host itself. Doing the expensive check first doesn't just waste time — it risks disturbing evidence (a live host check can itself change process state) or creating unnecessary friction (paging an asset owner for something the platform's own reputation data could have already resolved).",
    "**Four dispositions, four different evidence bars.** Escalate now when the alert's own criteria appear to have been genuinely met on real data, no known-legitimate explanation can be verified quickly, and the asset or account involved crosses a criticality or technique-impact threshold the team has defined in advance — credential access, lateral movement, data staging or exfiltration, and ransomware precursors are the kind of categories NIST's guidance and MITRE ATT&CK's own tactic groupings both treat as consistently high-impact regardless of how routine the specific alert otherwise looks. Close as benign only once a specific, verifiable legitimate cause has actually been confirmed for genuinely-matched activity — not merely plausible, confirmed — following the same evidence standard this site's companion guide on false positive vs. benign positive sets out for that classification question. Close as false positive only once the raw underlying data shows the alert's own stated criteria were not actually met, which is a defect in the detection or its inputs, not a judgment about the underlying activity's intent. Hold for more evidence when neither an escalation threshold nor a verified benign cause is met: the activity appears real, but nothing yet confirms it's malicious or benign, and forcing a premature close in either direction is worse than leaving it explicitly open with a defined next step.",
    "**What 'needs more evidence' has to mean, concretely.** A hold disposition that isn't tied to a specific, named piece of missing evidence is not a decision — it's a delay. Before recording an alert as held, name exactly what would resolve it: a specific adjacent log source not yet pulled (authentication logs from an identity provider or proxy that the current alert didn't include), a specific person to contact (the asset owner, the account holder, a change-record custodian) and the specific question to ask them, or a specific reputation or correlation check that hasn't yet returned a result (a newly observed network indicator whose age or registration history hasn't been checked, a file hash not yet checked against available threat intelligence). A hold with a named, specific next step is a productive pause. A hold that just says 'investigate more' is functionally the same as closing the alert without deciding, except it still occupies a queue slot.",
    "**Time-box the hold state, and revisit it as a decision, not a reminder.** Assign every held alert an explicit follow-up point — a defined time, or a defined trigger such as the next relevant data-source refresh — rather than leaving it open-ended. NIST's guidance on incident status tracking calls for recording an expected time frame and next steps for each open item precisely so a held item doesn't quietly age out of anyone's attention. When the follow-up point arrives, treat it as a fresh disposition decision using whatever new evidence has come in, not as a formality that rubber-stamps whatever the queue pressure that day suggests.",
    "**Worked walkthrough: Kestrel Bay Logistics' accounts-payable alert.** Returning to the scenario above: the EDR alert reports a PowerShell process, launched with an encoded command line, spawned by an office productivity application on a workstation belonging to an accounts-payable specialist. Context first — asset criticality: this workstation routinely handles vendor payment data, placing it above the team's baseline criticality threshold. Recent related activity: a fast correlation query shows no other alerts against this account or host in the prior thirty days. Known-legitimate explanation: a check against the organization's change and deployment records shows no scheduled software rollout, patch, or approved script matching this timing or this host. None of the three checks resolve the alert on their own, so the analyst proceeds to the cheap technical checks: the alert's own enrichment shows the destination the PowerShell process attempted to reach is a domain registered within the past several days — a reputation signal the platform computed automatically, at no investigative cost. A fast process-lineage query confirms the office application's parent-child relationship does not match a known-benign automation pattern the team has previously documented. At this point, the evidence bar for escalation is met: the alert's criteria appear genuinely satisfied on real data (not a false positive), no legitimate explanation was found despite checking (ruling out an easy benign-positive close), the asset handles financially sensitive data (crossing the criticality threshold), and the technique chain (T1204.002 into T1059.001) is one the team has pre-classified as high-impact. The analyst escalates to the on-call incident lead rather than continuing to independently investigate for full certainty alone.",
    "**How the same alert would resolve differently.** If the change-record check had instead turned up a verified, time-matched entry for an approved software deployment using a similar launch pattern, and a quick confirmation with the deployment owner matched the observed destination, the alert would resolve as benign — the criteria were genuinely met, and a specific cause was verified, not assumed. If the destination domain's registration history had come back ambiguous — not clearly new, not clearly established, with the reputation check still pending a result — and no other corroborating signal were present, the correct disposition would be hold, with the named next step being the pending reputation result and a defined follow-up time, not an immediate escalation or an immediate close in either direction. The alert type didn't determine the outcome in any of these branches; the specific evidence gathered, in a consistent order, did.",
  ],
  validationEvidence: [
    "This guide describes a triage decision sequence and a single fictional worked alert at one fictional organization; it does not reproduce a real SIEM or EDR platform's alert data, a completed investigation, or measured triage outcomes from a real environment. Its evidence state is UNVERIFIED — the sequence and criteria are a starting framework to adapt and verify against a team's own detections, evidence sources, and pre-defined criticality thresholds, not a validated outcome.",
  ],
  limitations: [
    "This guide covers the decision sequence for reaching a disposition on a single alert. It does not cover the mechanics of telling a false positive apart from a benign positive once evidence is in hand — see this site's companion guide on that distinction — or the techniques used to tune a detection once a recurring benign-positive pattern is confirmed — see this site's guide on tuning SOC alerts.",
    "It does not cover full incident response once an alert is escalated and confirmed as a true positive — investigation, containment, eradication, and recovery for a confirmed incident are their own, larger process, only briefly touched on here as the point this playbook hands off to.",
    "It assumes a team already has, or is willing to define in advance, an asset-criticality baseline and a list of pre-classified high-impact techniques or categories; a team without either needs to establish that groundwork first, which this guide does not cover building from scratch.",
  ],
  defensiveRecommendations: [
    "Define asset-criticality tiers and a list of pre-classified high-impact techniques or action categories in advance, before an alert arrives — triage under time pressure is the wrong moment to be deciding, for the first time, whether a given asset or technique counts as high-stakes.",
    "Check a platform's own enrichment and reputation fields before running any additional query, and run any additional query before contacting a person or touching a live host — cheap-to-expensive is the default order regardless of how the alert looks at first glance.",
    "Require a specific, verified cause — not a plausible one — before closing an alert as benign; require confirmation that the alert's own stated criteria were not actually met, checked against raw data, before closing it as false positive.",
    "Never let 'needs more evidence' be recorded without naming the specific missing evidence and a defined follow-up point; a hold with neither is indistinguishable from an alert nobody is tracking.",
    "Record the specific evidence that supported each disposition, not just the disposition itself, so a later reviewer — or the same analyst months later — can verify the reasoning instead of re-deriving or blindly trusting it.",
    "Treat host or account containment actions (isolation, credential disablement) as their own decision with their own authorization requirement, distinct from the disposition decision — many SOC analyst roles do not carry standing authority to isolate a production asset or disable an account unilaterally, and a playbook that assumes otherwise will fail exactly when it matters most.",
  ],
  keyTakeaways: [
    "Triage that runs on individual instinct instead of an explicit sequence is not auditable, teachable, or improvable — NIST's incident-handling guidance calls getting this specific decision right 'perhaps the most critical decision point' in the entire response process.",
    "Gather context — asset criticality, recent related activity, a known-legitimate explanation — before evaluating whether an alert's own criteria were met; skipping straight to that question is what makes disposition depend on instinct.",
    "Order checks from cheap to expensive: a platform's own enrichment fields first, a fast correlation query next, and only then an adjacent log pull, a contact to a person, or a live host check.",
    "Each of the four dispositions — escalate now, close as benign, close as false positive, hold for more evidence — has its own specific evidence bar; 'hold' only functions as a real decision when it names the exact missing evidence and a follow-up point, not as an indefinite parking state.",
    "The same alert type can resolve to any of the four dispositions depending only on what the evidence actually shows — Kestrel Bay Logistics' fictional accounts-payable alert escalates, resolves benign, or holds, entirely depending on what the change-record check and the reputation lookup return.",
  ],
  references: [
    "NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile: https://csrc.nist.gov/pubs/sp/800/61/r3/final",
    "MITRE ATT&CK, T1204.002 User Execution: Malicious File: https://attack.mitre.org/techniques/T1204/002/",
    "MITRE ATT&CK, T1059.001 Command and Scripting Interpreter: PowerShell: https://attack.mitre.org/techniques/T1059/001/",
    "CISA, Federal Government Cybersecurity Incident and Vulnerability Response Playbooks: https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks",
  ],
  relatedSlugs: ["false-positive-vs-benign-positive", "tuning-soc-alerts-without-hiding-real-attacks"],
};

// PlaybookModule (kind: "playbook") is used here in its most direct sense —
// unlike both sibling articles, which repurposed the shape for a non-live
// change-management process, this article describes a live alert-triage
// workflow: "trigger" is an alert reaching the queue, "severity" is how
// much evidence rigor the sequence itself demands, "triage" is the ordered
// context-gathering sequence, "decisionPoints" are the four disposition
// branches, "escalation" is when and to whom to hand off, "containment" is
// the guardrail around any interim stabilizing action taken while evidence
// is still being gathered, and "recovery" is what to do if a disposition is
// later found to have been the wrong one.
const module_: PlaybookModule = {
  kind: "playbook",
  trigger:
    "An alert reaches an analyst's queue and has not yet been dispositioned. This playbook covers the sequence from that point through recording one of four outcomes: escalate now, close as benign, close as false positive, or hold for more evidence.",
  severity:
    "Not a fixed alert-platform severity field — this rates how much verification rigor and escalation urgency the triage sequence itself applies, based on the asset-criticality and technique-impact context gathered in the first step below. Treat an alert touching a pre-defined high-criticality asset or a pre-classified high-impact technique category as warranting escalation at a lower evidence bar than a routine alert against a low-criticality asset; the sequence of checks is the same in both cases, but how much ambiguity is tolerated before escalating is not.",
  triage: [
    "Establish asset criticality for the affected host or account against the team's pre-defined tiers, before evaluating anything else about the alert.",
    "Run a fast correlation query for other recent activity — flagged or not — on the same account or host, so an isolated alert and a pattern of related alerts are not triaged identically.",
    "Check for a known-legitimate explanation already on record — a change ticket, a deployment record, a documented job schedule — and verify it quickly rather than assuming it applies.",
    "Only after the three checks above, evaluate whether the alert's own stated criteria were actually met on real data, starting with the platform's own enrichment and reputation fields before running any additional query.",
  ],
  decisionPoints: [
    "Escalate now if the criteria were genuinely met, no legitimate explanation verified, and the asset or technique crosses a pre-defined criticality or impact threshold.",
    "Close as benign only once a specific, verified legitimate cause is confirmed for genuinely-matched activity — see this site's companion guide on false positive vs. benign positive for the evidence standard that classification itself requires.",
    "Close as false positive only once raw underlying data confirms the alert's own stated criteria were not actually met — a detection or data defect, not a judgment about intent.",
    "Hold for more evidence when neither an escalation threshold nor a verified benign cause is met — and only record a hold alongside the specific missing evidence and a defined follow-up point.",
  ],
  escalation: [
    "Escalate to the on-call incident lead immediately once the escalate-now criteria are met, rather than continuing to independently investigate for full certainty alone.",
    "Escalate immediately, outside this playbook's normal cadence, if verifying a suspected benign cause turns up any detail that doesn't fully check out — treat that as a potential true positive, not a disposition to finalize under time pressure.",
    "Escalate a repeated pattern of held alerts against the same asset or account, even if no single one individually crosses the escalation threshold — a pattern the tree doesn't resolve on its own is itself information.",
  ],
  containment: [
    "Treat any host-isolation or account-disablement action as a separate decision from the disposition itself, requiring whatever authorization tier the organization's access model assigns to that specific action — many analyst roles carry read access for triage but not standing authority to isolate a production asset or disable an account unilaterally.",
    "Where a team has pre-authorized scoped containment actions (for example, a defined class of low-criticality endpoints an analyst may isolate directly), apply them only within that pre-defined scope, not by extension to a similar-looking but out-of-scope asset.",
    "Preserve the specific evidence that justified any interim containment action taken while a hold disposition is still open, so the containment decision itself can be reviewed alongside the eventual final disposition.",
  ],
  recovery: [
    "If a disposition is later found to have been wrong — a hold that should have escalated, a benign close that wasn't actually verified — correct the record and route it to the correct next step immediately, rather than leaving the original call in place.",
    "Review other alerts closed or held around the same time, against the same asset or account, for the same missing check — a single missed context-gathering step is rarely isolated to one alert.",
    "Record what specific evidence was missed or misread the first time, not just that the disposition changed, so the same gap in the sequence doesn't recur on the next similar alert.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Building an Alert-Triage Decision Tree",
    slug: "building-an-alert-triage-decision-tree",
    summary:
      "A playbook for the concrete decision sequence a SOC analyst follows once an alert arrives: what context to gather first, what order to run checks in, and the explicit evidence criteria for escalating, closing as benign, closing as false positive, or holding for more evidence.",
    pillar: "detect-respond",
    primaryCategory: "soc-operations",
    contentType: "playbook",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["soc-operations", "incident-response", "logging-monitoring"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
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
