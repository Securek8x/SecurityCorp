// Knowledge-base article draft (Bead securitycorp-source-4zl.56.3.2,
// "Evidence Collection Before Containment", category securitycorp-source-
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
// in building-a-defensible-incident-timeline.ts.
//
// Second article in this sub-pillar: this is the second article filed
// under "Incident Response and DFIR" (securitycorp-source-4zl.56.3), after
// building-a-defensible-incident-timeline.ts (drafted the same week, not
// yet merged into this branch's registry — see relatedSlugs below, which
// cross-references it by slug so the link resolves automatically once it
// is registered; its content is not re-derived here). This article covers
// the activity that precedes that one in the response lifecycle — what to
// capture before a containment action destroys it — rather than how to
// write up the resulting timeline once evidence exists.
//
// Judgment calls (for the reviewer):
// - primaryCategory "incident-response-dfir" is lib/taxonomy.ts's existing
//   category id for "Incident Response and DFIR" (securitycorp-source-
//   4zl.56.3) — not invented; confirmed by reading lib/taxonomy.ts directly.
// - Controlled tags: the bead's suggestion "incident-response" is a
//   canonical id in lib/knowledge-tags.ts and is used as-is. The bead's
//   other two suggestions, "evidence-collection" and "containment", are NOT
//   canonical tag ids and have no alias entry in TAG_ALIASES — confirmed by
//   reading the full TAG_VOCABULARY list. Closest real substitutes used
//   instead: "logging-monitoring" (this article's volatile-evidence
//   sources — network connections, login sessions, running processes — are
//   the same operational data logging-monitoring already covers, and the
//   sibling timeline article uses this same tag for its own "evidence"
//   suggestion, so this stays consistent within the sub-pillar) and
//   "network-isolation" (the article's worked example and decision
//   framework center on host isolation as the paradigmatic containment
//   action being weighed against evidence loss — network-isolation is the
//   existing control-type tag for exactly that control, more specific than
//   any broader "containment" concept the vocabulary doesn't define as a
//   tag). Three tags total, within the 2-4 range this category's acceptance
//   criteria requires.
// - contentType "playbook" (bead-specified) maps to PlaybookModule
//   (lib/knowledge-content-types.ts). Unlike the two prior playbook-typed
//   articles in this catalog — tuning-soc-alerts-without-hiding-real-
//   attacks.ts (a change-management process) and building-a-defensible-
//   incident-timeline.ts (an ongoing documentation discipline) — this
//   article's subject genuinely *is* a containment decision, so the
//   module's "containment" field is written directly about safe execution
//   of the containment action itself (informed by NIST SP 800-86's note
//   that a graceful OS shutdown can itself destroy volatile evidence)
//   rather than repurposed to describe protecting an unrelated artifact's
//   integrity. This departure is intentional and explained inline at the
//   module definition below.
// - No coverImage is added — that workflow is separate and out of scope
//   for this task.
// - Legal/procedural framing: this article describes chain-of-custody and
//   evidence-preservation practice in the same operational sense NIST SP
//   800-86 uses it — grounds for a later reviewer to trust what was
//   collected and how — not as legal advice about admissibility, retention
//   obligations, or any jurisdiction's evidentiary standard. Where formal
//   procedures are mentioned, the text hedges that this is not legal advice
//   and defers to an organization's own legal counsel, matching the
//   sibling timeline article's established hedge.
// - Privilege realism: the worked example never depicts the fictional
//   actor performing an action requiring a privilege level not already
//   established earlier in the same example (the affected account stays at
//   its documented low-privilege level throughout; anything further is
//   explicitly marked as unconfirmed rather than asserted as having
//   occurred).
//
// Editorial routing note: per this repo's Ruflo routing requirement, a
// real mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1789252196555-ubxgdi, template "research", task
// describing this article's research brief needs: NIST SP 800-86's order-
// of-volatility guidance, NIST SP 800-61 Rev. 3's evidence-related
// outcomes, chain-of-custody basics, and MITRE ATT&CK anti-forensics
// techniques relevant to containment timing). A bounded
// mcp__ruflo__workflow_status check afterward reproduced the documented
// issue in CLAUDE.md: 0% progress, a single pending "Execute" stage, no
// retrievable editorial output. This draft was therefore produced with the
// disclosed native fallback instead — separate research, drafting,
// technical-verification, publication-safety, and final editorial passes —
// not credited to Ruflo. Every citation below was independently verified
// against its primary source before inclusion (NIST SP 800-86 and SP
// 800-61 Rev. 3 PDFs read directly — including the exact Section 5.2.1.3
// order-of-volatility list and the RS.AN-07/RS.MI-01 CSF outcome text —
// MITRE ATT&CK T1070 and T1485 technique pages, and the CIS Control 8 page,
// all fetched directly); none were invented. See the calling agent's final
// report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, PlaybookModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "A containment action — isolating a host from the network, disabling a compromised account, powering down a system — is often the single most useful thing a responder can do to stop an incident from getting worse. It is also, in almost every case, the moment that destroys whatever volatile evidence that host or account was still holding. Network connections vanish the instant a host is isolated. Login-session data disappears the instant an account is disabled or a system reboots. The contents of memory are gone the instant power is removed. None of that evidence comes back.",
    "This guide is about the narrow, time-pressured decision that sits between detection and containment: what to capture, in what order, before a containment action takes it away — and how to document that capture so a second reviewer can trust what was collected and why containment happened when it did. It draws directly on NIST SP 800-86's order-of-volatility guidance and NIST SP 800-61 Rev. 3's evidence-preservation outcomes, uses a single fully fictional worked example, and does not give legal advice about chain-of-custody law or evidentiary admissibility — those questions belong to an organization's own legal counsel.",
  ],
  whatYouWillLearn: [
    "Why a containment action and evidence preservation are frequently in direct tension — isolating a host or disabling an account is exactly the kind of action most likely to destroy the volatile evidence that host or account was still holding.",
    "NIST SP 800-86's recommended order of volatility for live-response collection, and why that order exists (some data disappears faster than other data, independent of anything a responder does).",
    "How to make and document the decision to delay containment briefly for evidence capture, or to contain immediately and accept the evidence loss — and why neither choice is automatically correct.",
    "The minimum chain-of-custody discipline a live-response capture needs: a named collector, a timestamp, the specific method used, and a way to verify the captured data wasn't altered afterward.",
    "How a compact, fully fictional example applies order-of-volatility capture and defensible documentation together, including a case where containment could not wait and the evidence loss was recorded rather than hidden.",
  ],
  intendedAudience: [
    "Incident responders and security practitioners who need to decide, under time pressure, what to capture from a live system before a containment action is taken.",
    "Analysts who have performed containment actions before but not under an explicit framework for what evidence that action puts at risk.",
    "Team leads deciding whether a given incident's containment timeline needs to be reviewed against what evidence was or wasn't preserved.",
  ],
  prerequisites: [
    "Basic familiarity with at least one live-response data source — network connection listings, login-session records, running-process lists, or memory contents.",
    "No prior formal digital-forensics training is required; this guide is written to be usable by a first-time responder facing this decision.",
    "No lab environment is required; every example in this guide is fictional and descriptive, not a runnable exercise.",
  ],
  problem: [
    "Containment is usually framed as an unambiguous good: stop the bleeding, limit the blast radius, isolate what's compromised. That framing is correct as far as it goes, but it treats containment as a free action, when in practice it consumes something — the volatile evidence still present on the system being contained. Isolating a host from the network ends every live connection that host had; disabling an account ends every session that account was holding; a reboot or shutdown clears memory and can trigger an operating system's own cleanup routines. Whatever a responder was going to learn from that live state has to be captured before the containment action, or it is not captured at all.",
    "The pressure runs the other way too: a system left uncontained a few minutes longer is a few more minutes of possible lateral movement, data staging, or damage. Neither 'always capture evidence first' nor 'always contain immediately' is a safe default — the correct choice depends on what is actually at risk on each side, and a responder who has never been asked to weigh that tradeoff explicitly tends to default to whichever action feels more decisive in the moment, without documenting why.",
  ],
  threatModel: [
    "This guide's primary failure mode is not an adversary attacking the evidence directly (though 'Main Content' below covers two adversary techniques — indicator removal and data destruction — that do exactly that, and are a separate reason evidence capture shouldn't wait longer than necessary). The primary failure mode is a defensive process failure: a responder takes a reasonable, necessary containment action without first considering what volatile evidence it destroys, and without recording that the tradeoff was considered at all.",
    "A fictional scenario used throughout this guide: a small organization referred to here as Alderleaf Systems detects unusual outbound network activity from a single employee workstation tied to a low-privilege application account. Every detail below — the account, the host, the specific timestamps, and the outcome — is invented for illustration and does not describe any real environment, incident, or organization.",
    "Representative failure-mode scenarios, none requiring a sophisticated adversary to produce: (1) a responder isolates a host from the network the moment malicious activity is confirmed, without first capturing its current network connections or login sessions, because isolation felt like the responsible move — and the evidence that would have shown what the host was actually connected to at the time is now permanently gone; (2) a responder disables a compromised account and only afterward realizes that account's active session details, which might have shown what the account was doing at that exact moment, were never recorded; (3) a responder powers a system down to be safe, not realizing NIST SP 800-86 documents that a graceful shutdown can itself trigger cleanup activity — closing files, clearing temporary data — that removes evidence along with it; (4) a containment decision is made and recorded only as 'host isolated at [time]', with no note of what evidence existed beforehand, what was or wasn't captured, or why — leaving a later reviewer no way to tell whether evidence was lost through an informed tradeoff or simple oversight.",
    "A related adversary-driven case worth naming: MITRE ATT&CK documents Indicator Removal (technique T1070) as adversaries deliberately deleting or altering system artifacts — command history, files, timestamps, network-connection records — specifically to defeat the kind of live-response collection this guide describes, and Data Destruction (technique T1485) as adversaries overwriting file contents outright to render data unrecoverable by forensic techniques. Both techniques mean that time spent deciding whether to capture evidence is time an adversary may also be spending removing it — a reason to move promptly once a capture decision is made, not a reason to skip the decision or its documentation.",
    "Out of scope: the internal architecture or command syntax of any specific live-response or EDR tool; formal forensic imaging and legal chain-of-custody procedure, which is a legal and procedural topic this guide does not give advice on (see 'Limitations' below); and any evaluation of a real organization's actual incident-response practice. Alderleaf Systems is illustrative throughout, not a reference architecture.",
  ],
  mainContent: [
    "**Volatile evidence disappears at different rates, and containment usually accelerates whichever rate applies.** NIST SP 800-86 (Guide to Integrating Forensic Techniques into Incident Response) notes that 'because volatile data has a propensity to change over time, the order and timeliness with which volatile data is collected is important,' and gives a recommended order for collecting it — from first to last: network connections, login sessions, contents of memory, running processes, open files, network configuration, and operating system time. Network connections and login sessions come first specifically because 'network connections may time out or be disconnected and the list of users connected to a system at any single time may vary' — exactly the state a containment action (isolating the host, disabling the account) ends immediately. Data further down the list — network configuration, OS time — changes more slowly and can reasonably wait if something more urgent needs attention first.",
    "**A containment action is not a neutral pause button — it actively destroys some of the evidence it interrupts.** Isolating a host from the network ends its current connections before they can be listed. Disabling an account ends its live sessions before they can be recorded. NIST SP 800-86 makes the shutdown case explicit: a graceful OS shutdown 'causes the OS to perform cleanup activities, such as closing open files, deleting temporary files, and possibly clearing the swap file,' and can even trigger memory-resident malicious code to remove its own traces on the way down. None of this makes containment the wrong call — it frequently is the right one — but it means the responder's actual choice is not 'contain or don't,' it's 'what, if anything, gets captured in the time between confirming the need for containment and executing it.'",
    "**The decision to delay containment briefly for evidence capture is a tradeoff, not a default.** NIST SP 800-86 frames this directly: the risks of collecting volatile data from a running, possibly-compromised system (further change to the system, a rootkit returning false information) should be 'weighed against the potential for recovering important information,' and if the effort isn't merited, the analyst may reasonably move straight to containment or shutdown instead. In practice this means asking, for the specific incident in front of you: is the system actively causing damage that a few minutes' delay would meaningfully worsen (active data destruction, active lateral movement, a fast-spreading condition)? If yes, contain now and document that the tradeoff was made deliberately. If the system's current state is comparatively stable, a short, prioritized capture — network connections and login sessions first, per the order above — is usually worth the delay.",
    "**Chain-of-custody discipline for a live capture is simpler than it sounds: name the collector, the time, the method, and a way to verify nothing changed afterward.** NIST SP 800-61 Rev. 3 frames collected incident data as evidence in the plain sense — 'grounds for belief or disbelief; data on which to base proof or to establish truth or falsehood' (drawing on SP 800-160v1) — and notes that formal chain-of-custody procedures might not apply to every incident, but collected data should still be retained per the organization's own evidence-preservation procedures regardless. For a live-response capture specifically, NIST SP 800-86 recommends computing and storing a message digest (a cryptographic hash) of each tool used and, where practical, of the data collected, so a later reviewer can verify the capture wasn't altered after the fact — and documenting the exact commands run, by whom, and at what time. This is not a heavy process: a short, consistent record of who collected what, how, and when is what makes the capture defensible later, independent of whether formal chain-of-custody law ever applies to the specific incident.",
    "**Document the containment decision itself, not just its outcome.** A record that says only 'host isolated at 14:32 UTC' tells a later reviewer nothing about whether evidence was lost through a considered tradeoff or an oversight. A defensible record states what volatile evidence existed and was (or wasn't) captured beforehand, and — if containment happened without capture — states why: the specific active risk that made waiting unacceptable. This mirrors the CONFIRMED/HYPOTHESIZED discipline this category's timeline guide describes for evidence entries generally: the goal is a record a second reviewer can actually evaluate, not a narrative that reads well.",
    "**A compact worked example (fully fictional): Alderleaf Systems' workstation containment decision.** Alderleaf Systems' SOC identifies unusual outbound network activity from a single employee workstation, tied to a low-privilege application account with read access to internal reporting data. The account has not been observed attempting any action beyond its existing, pre-incident permissions. The responder on call has to decide, within minutes, what to do.",
    "Step 1 — the responder first checks whether anything about the activity suggests active, worsening damage (large-volume data transfer still in progress, signs of destructive behavior, spreading to other hosts). None is observed; the outbound activity appears to be a steady, moderate-volume connection that has been ongoing for several minutes. This is recorded as the basis for the decision that follows.",
    "Step 2 — because no active worsening risk is identified, the responder captures volatile evidence in NIST SP 800-86's recommended order before isolating the host: current network connections and the destination the workstation is communicating with (first, because this is exactly what isolation would end); the account's current login session details (second, for the same reason); then, given time constraints, a decision to stop at that point rather than also attempting a full memory capture, which the responder judges would take longer than the situation's continued risk justifies. This stopping point — and the reasoning for it — is recorded explicitly, not left implicit.",
    "Step 3 — the responder records who performed the capture, the exact time, and the specific commands used, and computes a hash of the captured connection and session data immediately afterward so its integrity can be verified later. Only after this capture does the responder isolate the workstation from the network.",
    "Step 4 — the incident record states plainly what was captured, what was not (full memory contents), and why (the judged risk did not justify the additional delay a memory capture would have required). A later reviewer can see exactly what tradeoff was made and evaluate it, rather than having to infer it from an isolation timestamp alone.",
  ],
  validationEvidence: [
    "This guide describes an evidence-preservation-versus-containment decision framework, illustrated with a single fully fictional organization, host, account, and event set invented for this article. No real host, account, network connection, or capture was collected, correlated, or independently verified against a live or lab-reproduced system as part of writing this guide. Its evidence state is UNVERIFIED and stays UNVERIFIED until an organization applying this guide records its own real, independently sourced capture evidence — the label must not be upgraded merely because the guide's reasoning is internally consistent or the worked example reads plausibly.",
  ],
  limitations: [
    "This guide covers the decision of what to capture and when, relative to a containment action, and the minimum documentation that makes that capture defensible. It does not cover the mechanics of forensic imaging, memory acquisition tooling, or any specific EDR or live-response product's command syntax, which vary by tooling and deserve their own treatment.",
    "It does not give legal advice about chain-of-custody procedures, evidentiary admissibility, data-retention obligations, or when law-enforcement or regulatory involvement changes what evidence handling is required. Those are jurisdiction- and organization-specific questions for an organization's own legal counsel, not something a general guide can answer correctly for every reader.",
    "It does not cover longer-running forensic analysis of captured evidence once collected, or the statistical/automated techniques some EDR platforms offer for retrospective evidence reconstruction after containment has already occurred — this guide is scoped to the capture decision itself.",
    "The worked example is deliberately small (a single host and account, four steps) to stay compact and fully fictional; a real incident's evidence-capture decision is often more heavily cross-referenced across multiple systems than this guide's example can illustrate in a compact form.",
  ],
  defensiveRecommendations: [
    "Before taking a containment action, briefly check whether the system's current state poses an active, worsening risk (ongoing destructive activity, active lateral movement, fast-spreading damage) — that check, not habit, should decide whether evidence capture happens first.",
    "When capturing volatile evidence before containment, follow NIST SP 800-86's recommended order — network connections and login sessions first, then memory, running processes, open files, network configuration, and operating system time last — so the fastest-disappearing evidence is captured before anything else.",
    "Prefer isolating a host over shutting it down where a choice exists; a graceful shutdown's own cleanup activity can remove evidence, and an ungraceful power-off forecloses further live capture entirely.",
    "Record who performed a live-response capture, the exact time, and the specific method used, and compute a verifiable hash of what was captured — this is the minimum chain-of-custody discipline that makes the capture defensible later, independent of whether formal legal procedures apply to the specific incident.",
    "Document the containment decision itself — what evidence existed, what was or wasn't captured, and why — not only its outcome; an isolation or account-disable timestamp with no accompanying reasoning gives a later reviewer nothing to evaluate.",
    "Treat time spent deciding whether to capture evidence as time an adversary may also be spending removing it (MITRE ATT&CK T1070, Indicator Removal; T1485, Data Destruction) — move promptly once a capture decision is made, rather than treating the decision itself as license to delay indefinitely.",
    "Defer questions of formal evidence-preservation procedure, chain-of-custody requirements, and legal or regulatory obligations to an organization's own legal counsel and policy; this guide's recommendations describe operational evidence-preservation practice, not a legal-admissibility claim.",
  ],
  keyTakeaways: [
    "A containment action is not a neutral pause — isolating a host or disabling an account actively ends the volatile evidence (network connections, login sessions) that action would otherwise have interrupted.",
    "NIST SP 800-86's recommended collection order — network connections, login sessions, memory, running processes, open files, network configuration, operating system time — exists because volatile data disappears at different rates, independent of containment.",
    "Delaying containment briefly for evidence capture is a considered tradeoff against active risk, not a default in either direction; the decision and its reasoning belong in the incident record, not just its outcome.",
    "Defensible chain-of-custody for a live capture is simple: a named collector, a timestamp, the specific method, and a verifiable hash of what was captured — not a heavy legal process.",
    "This guide describes evidence-preservation practice, not legal admissibility — formal chain-of-custody and evidentiary questions belong to an organization's own legal counsel, not to this guide.",
  ],
  references: [
    "NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response: https://csrc.nist.gov/pubs/sp/800/86/final",
    "NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile (April 2025): https://csrc.nist.gov/pubs/sp/800/61/r3/final",
    "MITRE ATT&CK, T1070, Indicator Removal: https://attack.mitre.org/techniques/T1070/",
    "MITRE ATT&CK, T1485, Data Destruction: https://attack.mitre.org/techniques/T1485/",
    "CIS Critical Security Control 8, Audit Log Management: https://www.cisecurity.org/controls/audit-log-management",
  ],
  relatedSlugs: ["building-a-defensible-incident-timeline", "logs-are-not-proof-verifying-automated-actions", "tuning-soc-alerts-without-hiding-real-attacks"],
};

// PlaybookModule (kind: "playbook") is written here for the containment
// decision itself, since — unlike the two prior playbook-typed articles in
// this catalog — that decision is this article's actual subject: "trigger"
// is what opens the evidence-versus-containment tradeoff, "severity" is how
// much evidence-preservation rigor a given situation warrants (not an
// incident severity), and "containment" describes safe execution of the
// containment action itself (informed by NIST SP 800-86's note that even a
// graceful shutdown can destroy evidence) rather than being repurposed to
// describe guarding an unrelated artifact's integrity, as the two prior
// playbook articles did for their own, differently-shaped subjects.
const module_: PlaybookModule = {
  kind: "playbook",
  trigger:
    "A live system (host or account) has been confirmed as part of an active incident, and a containment action — network isolation, account disablement, shutdown — is being considered. This playbook applies from that point through the containment action's execution.",
  severity:
    "Not an incident severity — this rates how much evidence-preservation rigor the situation warrants before containment. Treat any system whose volatile state might later need review (by a peer, leadership, or, subject to an organization's own legal guidance, outside counsel) as warranting at least a prioritized, documented capture attempt before containment. Treat a system showing active, worsening damage (ongoing destructive activity, active lateral movement) as warranting immediate containment with the evidence-loss decision explicitly recorded, rather than a capture attempt that risks meaningful additional delay.",
  triage: [
    "Identify what volatile evidence the system currently holds that a pending containment action would end — current network connections and login sessions first, since NIST SP 800-86 documents these as the fastest to change or disappear.",
    "Check whether the system's current state shows active, worsening risk (ongoing destructive activity, active lateral movement, rapid spread) that would make even a brief capture delay unacceptable.",
    "Confirm who is available to perform the capture and document it — a capture with no named collector, timestamp, or method is not a defensible one, regardless of what it contains.",
  ],
  decisionPoints: [
    "If the system shows no active, worsening risk: capture volatile evidence in NIST SP 800-86's recommended order (network connections, login sessions, memory, running processes, open files, network configuration, operating system time) before taking the containment action, stopping at whatever point further delay would become unjustified — and record that stopping point and the reasoning for it.",
    "If the system shows active, worsening risk that delay would meaningfully compound: contain immediately, and record explicitly what evidence was not captured and why the delay was judged unacceptable — do not leave the record silent on the tradeoff.",
    "If a full or graceful shutdown is being considered as the containment action: prefer isolation instead where the choice exists, since NIST SP 800-86 documents that a graceful shutdown's own cleanup activity can destroy evidence on the way down.",
    "If any volatile evidence is captured: record the collector, the exact time, the specific method or commands used, and compute a verifiable hash of the captured data before proceeding — an uncaptured chain of custody is functionally the same as no capture for later review purposes.",
  ],
  escalation: [
    "Escalate to a peer reviewer or team lead before executing containment on a system where the evidence-capture tradeoff is genuinely unclear — a second opinion catches a false sense of urgency an individual responder may not notice under time pressure.",
    "Escalate to the organization's own legal counsel, per its incident-response policy, when prosecution, litigation, or regulatory involvement becomes plausible for the incident in question — this guide does not determine that threshold and should not be treated as having done so.",
    "Escalate immediately, independent of this playbook's normal cadence, if a system shows signs of active indicator removal or data destruction (see MITRE ATT&CK T1070 and T1485 in 'Main Content' above) — treat that as a signal that any remaining capture window is closing faster than usual, not merely a tuning input for how much time to take.",
  ],
  containment: [
    "Prefer network isolation over shutdown where a choice exists; isolation stops further external activity without triggering the cleanup behavior a graceful shutdown can perform on the way down.",
    "If a full shutdown is unavoidable, treat it as ending any further opportunity for live capture, and complete whatever prioritized capture is going to happen before initiating it, not partway through.",
    "Keep the containment action itself narrowly scoped to what the situation requires (the specific host or account, not a broader segment or population) so the evidence-versus-containment tradeoff is made once, deliberately, rather than repeated implicitly at a larger scale.",
  ],
  recovery: [
    "If evidence is later found to have been lost without a recorded reason, document what should have been captured and why the gap occurred, so the same category of oversight is caught earlier in the next incident's containment decision.",
    "Backfill whatever documentation is still possible after the fact (what was known about the system's state at containment time, from any source that does survive) rather than leaving the record silent because the ideal capture window has closed.",
    "Review the containment decision itself during post-incident review — not only whether containment happened in time, but whether the evidence-preservation tradeoff was made deliberately and recorded, or defaulted to without consideration.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Evidence Collection Before Containment",
    slug: "evidence-collection-before-containment",
    summary:
      "A playbook for the time-pressured decision between capturing volatile evidence and taking a containment action that would destroy it: NIST SP 800-86's order-of-volatility collection sequence, when a brief delay for capture is (and isn't) justified, minimum chain-of-custody documentation for a live-response capture, and a compact fictional worked example.",
    pillar: "detect-respond",
    primaryCategory: "incident-response-dfir",
    contentType: "playbook",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["incident-response", "logging-monitoring", "network-isolation"],
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
