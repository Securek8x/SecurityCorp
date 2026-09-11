// Knowledge-base article draft (Bead securitycorp-source-4zl.56.3.1,
// "Building a Defensible Incident Timeline", category securitycorp-source-
// 4zl.56.3 "Incident Response and DFIR"). Status is intentionally
// "drafting" — see docs/publication-safety-policy.md. This file is
// registered in lib/knowledge-content.ts as a drafting-status entry; it
// becomes part of the published catalog only after human privacy/technical/
// publication review, per docs/knowledge-base.md. Every organization,
// analyst, host, account, and event described in this file is fictional
// and sanitized; no real incident, victim, system, employer, credential, or
// identifier appears anywhere in this file. No literal filesystem path
// appears anywhere in this file (fictional or otherwise) — locations are
// described in prose, per this session's standing safety guidance.
//
// First article in this sub-pillar: this is the first article filed under
// the "Incident Response and DFIR" category (securitycorp-source-4zl.56.3),
// so relatedSlugs below draws on thematically adjacent published articles
// from neighboring categories (evidence/verification discipline, SOC
// alert-tuning) rather than a same-category sibling, since none yet exists.
//
// Judgment calls (for the reviewer):
// - primaryCategory "incident-response-dfir" is lib/taxonomy.ts's existing
//   category id for "Incident Response and DFIR" (securitycorp-source-
//   4zl.56.3) — not invented; confirmed by reading lib/taxonomy.ts directly.
// - Controlled tags: the bead's suggestion "incident-response" is a
//   canonical id in lib/knowledge-tags.ts and is used as-is. The bead's
//   other two suggestions, "timeline" and "evidence", are NOT canonical
//   tag ids and have no alias entry in TAG_ALIASES — confirmed by reading
//   the full TAG_VOCABULARY list. Closest real substitutes used instead:
//   "logging-monitoring" (this article's evidence is overwhelmingly
//   log/timestamp-sourced, and that tag exists specifically for that
//   practice) and "security-control-validation" (the article's central
//   claim — that a timeline entry needs independent, citable support
//   before being trusted — is the same verification discipline that tag
//   already covers elsewhere in the catalog, e.g. logs-are-not-proof-
//   verifying-automated-actions.ts). Three tags total, within the 2-4
//   range this category's acceptance criteria requires.
// - contentType "playbook" (bead-specified) maps to PlaybookModule
//   (lib/knowledge-content-types.ts). Its fields (trigger/severity/triage/
//   decisionPoints/escalation/containment/recovery) are written for the
//   process of building and maintaining a defensible timeline during an
//   active response, not for the underlying incident itself — the second
//   "playbook"-typed article in the catalog after tuning-soc-alerts-
//   without-hiding-real-attacks.ts, whose field-mapping precedent this
//   follows where it fits and departs from (explained inline) where the
//   subject matter differs.
// - No coverImage is added — that workflow is separate and out of scope
//   for this task.
// - Legal/compliance framing: this article uses "defensible" throughout in
//   its plain operational sense (an entry a later reviewer can verify
//   against cited evidence), not as a claim about admissibility, chain-of-
//   custody law, or any specific jurisdiction's evidentiary standard. Where
//   formal evidence-handling procedures are mentioned, the text explicitly
//   hedges that this is not legal advice and that an organization's legal
//   counsel — not this guide — determines what a specific matter requires.
// - Privilege realism: the worked example never depicts the fictional
//   actor performing an action requiring a privilege level not already
//   established earlier in the same example (the compromised account stays
//   at its documented low-privilege application-account level throughout;
//   any question of further privilege or lateral movement is explicitly
//   marked HYPOTHESIZED rather than asserted as having occurred).
//
// Editorial routing note: per this repo's Ruflo routing requirement, a
// real mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788755997894-a7utq3, template "research", task
// describing this article's research brief needs: NIST/MITRE/IETF-grounded
// sources on timeline defensibility, evidentiary uncertainty, and
// timezone/clock-skew normalization). A bounded mcp__ruflo__workflow_status
// check afterward reproduced the documented issue in CLAUDE.md: 0%
// progress, a single pending "Execute" stage, no retrievable editorial
// output. This draft was therefore produced with the disclosed native
// fallback instead — separate research, drafting, technical-verification,
// publication-safety, and final editorial passes — not credited to Ruflo.
// Every citation below was independently verified against its primary
// source (NIST SP 800-61 Rev. 3 and SP 800-86 PDFs read directly, MITRE
// ATT&CK, IETF RFC 3339, and CIS) via WebFetch before inclusion; none were
// invented. See the calling agent's final report for full editorial-
// routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, PlaybookModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "A timeline built during incident response makes a claim about what happened and when. That claim only holds up under review if every entry in it can be traced back to a specific, named piece of evidence — a log line, a file timestamp, a system record someone can point to — rather than to an analyst's recollection, a plausible-sounding guess, or a gap quietly filled in because it made the narrative read more smoothly. A defensible timeline is not a more confident timeline; it is a more honest one, and honesty here specifically means every entry says where it came from, and every gap stays visible as a gap.",
    "This guide covers three disciplines that, in practice, are where a timeline most often stops being defensible without anyone deciding to make it that way: citing the specific evidence behind every entry instead of a general sense of 'the logs showed this'; normalizing timestamps to one reference time and flagging any source with unreliable clock behavior, since timezone and clock-skew mismatches are one of the most common, least dramatic ways a timeline's sequence turns out to be wrong; and structurally separating what the evidence confirms from what the evidence merely suggests, so a reader of the timeline itself — not just a caveat in a separate document — can tell the two apart at a glance. A compact, fully fictional worked example closes the guide. This is not legal-advice content; where formal evidence-handling procedures come up, the guide says so and defers to an organization's own legal counsel and policy.",
  ],
  whatYouWillLearn: [
    "What makes an incident timeline 'defensible' in the operational sense this guide uses: every entry traceable to a specific, cited piece of evidence, not to inference or memory presented as fact.",
    "How to represent a genuine gap in the evidence honestly — as a visible gap — instead of bridging it with a plausible assumption that reads like a confirmed event.",
    "Why timezone and clock-skew mismatches across log sources are a common, underestimated source of timeline error, and how to normalize to one reference time while documenting every conversion.",
    "How to structurally separate 'confirmed by evidence' entries from 'hypothesized based on evidence' entries in the timeline itself, not only in a caveat elsewhere in the report.",
    "How a compact, fully fictional example applies all three disciplines together, including a deliberate example of an entry that stays marked as unconfirmed because the evidence to confirm it does not exist.",
  ],
  intendedAudience: [
    "Incident responders and security practitioners assembling or reviewing a timeline during or after a response, who need a repeatable standard for what belongs in it and how it should be sourced.",
    "Analysts new to formal timeline construction who have built an informal sequence of events before but not one meant to withstand a second reviewer's scrutiny.",
    "Team leads deciding whether a draft timeline is ready to hand to a broader audience — leadership, a post-incident review, or (where applicable, and subject to an organization's own legal guidance) outside counsel or a regulator.",
  ],
  prerequisites: [
    "Basic familiarity with at least one log or event source used during incident response — authentication logs, endpoint telemetry, network flow records, or file-system metadata.",
    "No prior formal DFIR (digital forensics and incident response) training is required; this guide is written to be usable by a first-time timeline author.",
    "No lab environment is required; every example in this guide is fictional and descriptive, not a runnable exercise.",
  ],
  problem: [
    "An incident timeline is frequently the single artifact a later reader — a peer reviewer, a leadership audience, an auditor, or (subject to an organization's own legal guidance) outside counsel — relies on to understand what happened, in what order, and how confident the response team actually is about each part of it. If that timeline was assembled the way a first draft usually gets assembled under time pressure — an analyst's best current understanding, written down in narrative order, evidence referenced loosely or not at all — it reads exactly like a fully evidenced timeline to anyone who wasn't there. Nothing about the document's appearance signals which parts are solid and which parts are the analyst's working theory.",
    "This gap rarely comes from carelessness. It comes from the ordinary act of writing a timeline as a narrative: a story needs continuity, and a genuine gap in the evidence — a period with no log coverage, a system that wasn't instrumented, a step between two confirmed events that nobody directly observed — creates an uncomfortable hole in that continuity. The natural instinct is to fill it with what probably happened, phrased the same way as the entries that are actually confirmed. Once that happens, the timeline has quietly stopped being an evidence record and started being a plausible story that happens to contain some evidence.",
  ],
  threatModel: [
    "This guide's failure mode is not an adversary attacking the timeline directly (though Section 'Main Content' below covers one adversary technique — timestamp manipulation — that specifically targets the evidence a timeline depends on). The primary failure mode is a defensive process failure: a well-intentioned analyst, writing under time pressure, produces a timeline that reads as more certain and more complete than the underlying evidence actually supports, and no one downstream can tell the difference because the document doesn't show its own sourcing.",
    "A fictional scenario used throughout this guide: a small organization referred to here as Windmere Data Partners identifies unusual authentication activity on a single low-privilege application account and opens an incident. Every detail below — the account, the host names, the specific timestamps, and the outcome — is invented for illustration and does not describe any real environment, incident, or organization.",
    "Representative failure-mode scenarios, none requiring a sophisticated adversary to produce: (1) an analyst writes 'the attacker then moved to a second host' as a plain timeline entry because it's the most likely next step given the technique observed, when no log, alert, or artifact from that second host was actually reviewed — the entry reads identically to one backed by a confirmed event; (2) two log sources disagree by several hours because one server's clock is set to local time and the other logs in UTC, and the analyst orders events by the raw timestamps without converting either, producing a sequence that has cause after effect; (3) a host whose clock had drifted by a known, uncorrected amount is treated as a precise time source for a critical ordering decision, when its drift makes it unsuitable for anything but a coarse, approximate placement until the drift is corrected for; (4) a gap where no system was logging is left out of the timeline entirely rather than shown as a gap, so a reader has no way to know that the smooth-looking sequence around it is actually two separately evidenced islands with an unobserved interval in between.",
    "A related adversary-driven case worth naming: MITRE ATT&CK documents Indicator Removal: Timestomp (technique T1070.006) as adversaries directly modifying file creation, modification, and access timestamps to blend malicious files in with legitimate ones and to defeat exactly the kind of timeline reconstruction this guide describes. A timeline that treats every file timestamp as trustworthy by default, with no corroboration from an independent source, is vulnerable to this technique whether or not the specific incident being investigated involved it — which is a separate reason (alongside honest gap representation) to prefer corroborating evidence over a single unverified timestamp wherever the stakes justify it.",
    "Out of scope: the internal architecture of any specific SIEM, EDR, or log-management product; formal forensic acquisition and chain-of-custody procedures, which are a legal and procedural topic this guide does not give advice on (see 'Limitations' below); and any evaluation of a real organization's actual incident-response practice. Windmere Data Partners is illustrative throughout, not a reference architecture.",
  ],
  mainContent: [
    "**Every timeline entry needs a named, specific source — not a general sense of where it came from.** 'The logs showed suspicious activity around this time' is not a citation; it does not let a second reviewer find the same evidence and check the analyst's reading of it. A defensible entry names the specific source (which system's authentication log, which host's process-creation record, which file's modification timestamp) precisely enough that another analyst could go find the same record independently. NIST SP 800-61 Rev. 3 frames this directly under its RS.AN-07 outcome — 'incident data and metadata are collected, and their integrity and provenance are preserved' — and, drawing on SP 800-160v1, defines evidence itself as 'grounds for belief or disbelief; data on which to base proof or to establish truth or falsehood.' A timeline entry with no named source is not evidence in that sense; it is an assertion that happens to appear next to some.",
    "**A gap in the evidence is information, not an inconvenience to write around.** When no source covers a period between two confirmed events, the defensible move is to show that period as an explicit gap — stated as such, with whatever is and isn't known about it — rather than to connect the two confirmed events with a sentence that implies continuous knowledge. A reader who sees 'no evidence source covers this interval' understands exactly how much the timeline actually establishes. A reader who sees a smooth, unbroken narrative has no way to tell that part of it was inferred rather than observed, and will reasonably treat the whole thing as equally solid.",
    "**Timezone and clock-skew handling is one of the most common, least dramatic ways a timeline turns out to be wrong.** Multiple systems logging the same incident rarely share a clock convention: one server may log in UTC, another in local time with or without daylight-saving adjustment, a cloud platform's console in the viewer's browser timezone, an endpoint agent in whatever the host's operating system clock reports. NIST SP 800-86 (Guide to Integrating Forensic Techniques into Incident Response) notes that reconstructing a sequence of events is 'complicated by unintentional or intentional discrepancies in time settings among systems,' and specifically flags that operating-system time can differ from other time sources on the same machine because of OS-specific settings such as timezone — information the guide says 'can be useful when building a timeline of events or correlating events among different systems' precisely because it so often goes unaccounted for. The practical discipline: pick one reference time (UTC is the conventional choice, and IETF RFC 3339 — the internet timestamp standard — represents it unambiguously with an explicit 'Z' or numeric offset rather than a bare, ambiguous local time), convert every source's timestamps to it, and document the conversion applied to each source next to the entries drawn from it, so a reviewer can audit the conversion, not just trust it.",
    "**Clock drift, not just timezone, can make a source unreliable for precise ordering.** SP 800-86 also notes that regular synchronization against an authoritative time source (the Network Time Protocol, NTP, synchronizing a system's clock against an external reference) is what keeps a system's reported time reasonably accurate, and that analysts should know the time, date, and timezone settings of any system whose data they're using for exactly this reason. A host known to have had a significant, uncorrected clock offset at the time of the events in question should not be trusted for fine-grained sequencing (which of two closely timed events happened first) even after its timestamps are timezone-converted — flag it explicitly as unreliable for precise ordering until the drift itself is quantified and corrected for, and prefer corroborating evidence from a known-accurate source wherever the sequence matters.",
    "**Structurally separate confirmed entries from hypothesized ones — in the timeline itself, not only in a caveat.** A caveat at the top of a report ('some entries below are inferred') does not survive the document being skimmed, excerpted, or read out of order — and a busy reader defaults to treating everything in a timeline as equally solid unless told otherwise at the point where it matters. Give every entry an explicit status field, directly in the entry: CONFIRMED (backed by a named, specific piece of evidence) or HYPOTHESIZED (a reasonable inference the team has not yet confirmed with direct evidence, stated as exactly that). A hypothesized entry still belongs in the timeline — it represents real analytical work and often points toward what still needs investigating — but it must never be visually or structurally indistinguishable from a confirmed one.",
    "**Formal evidence handling is a legal and procedural question this guide does not answer.** Depending on the nature of an incident, an organization's policies, and whether prosecution, litigation, or regulatory involvement is plausible, formal evidence-preservation procedures (sometimes called chain-of-custody procedures) may apply to some or all of the material a timeline is built from. NIST SP 800-61 Rev. 3 itself hedges this exact point — it notes that formal evidence gathering and handling 'might not be performed for every incident that occurs (e.g., most malware incidents will not result in prosecution)' while still recommending that organizations collect and retain evidence per their own evidence-preservation procedures. This guide does the same: it describes how to make a timeline's sourcing legible and honest, not what a specific jurisdiction's evidentiary standards require or when formal chain-of-custody procedures are legally necessary. That determination belongs to an organization's own legal counsel and incident-response policy, not to this guide.",
    "**A compact worked example (fully fictional): Windmere Data Partners' svc-reports incident.** The five entries below apply all three disciplines together — named sourcing, an explicit gap, documented timezone conversion, and CONFIRMED/HYPOTHESIZED labeling. Every name, timestamp, and system in this example is invented for this article.",
    "Entry 1 — 09:14:02 UTC, CONFIRMED. The identity provider's authentication log records a successful login to the application account 'svc-reports' from a source IP address inconsistent with that account's normal usage pattern. Source: identity provider authentication log (native timestamps already in UTC; no conversion needed). This is the earliest evidence-supported point in the timeline — nothing before it is asserted.",
    "Entry 2 — 09:14:55 UTC, CONFIRMED. The reporting application's own audit log shows the svc-reports account querying a substantially larger volume of report records than its documented normal pattern, using the read access already granted to that account. Source: application audit log (native timestamps in the application server's local time, UTC-5; converted here by adding five hours). No privilege escalation is observed or claimed at this point — the account acted within its existing, pre-incident permissions throughout.",
    "Gap — 09:15 UTC to 14:02 UTC. No evidence source available to the response team covers this interval; the account had no further logged activity in any system reviewed, and no host in scope for this incident retained telemetry covering this window. This gap is shown explicitly rather than bridged — the timeline does not assert what happened during it.",
    "Entry 3 — 14:02:31 UTC, HYPOTHESIZED. The response team suspects the report data queried in Entry 2 may have subsequently been transferred outside Windmere's network, based on the general shape of the incident so far — but as of this timeline's current version, no egress network log, proxy record, or outbound-transfer evidence has been located or reviewed to confirm it. Evidence that would confirm this entry: an egress log or proxy record showing an outbound transfer whose size and timing are consistent with the queried data. Until that evidence is found, this entry stays HYPOTHESIZED, not CONFIRMED.",
    "Entry 4 — 14:47:10 UTC, CONFIRMED. Windmere's identity team disabled the svc-reports account's credential after the anomalous activity in Entries 1 and 2 was flagged for review. Source: identity provider administrative-action log (native timestamps already in UTC; no conversion needed). This entry closes the timeline's currently evidenced portion — later entries covering remediation and lessons-learned would extend it, but are outside this compact example.",
  ],
  validationEvidence: [
    "This guide describes a timeline-construction discipline, illustrated with a single fully fictional organization, incident, and evidence set invented for this article. No real host, account, log source, or timestamp described here was collected, correlated, or independently verified against a live or lab-reproduced system as part of writing this guide. Its evidence state is UNVERIFIED and stays UNVERIFIED until an organization applying this guide records its own real, independently sourced timeline evidence — the label must not be upgraded merely because the guide's reasoning is internally consistent or the worked example reads plausibly.",
  ],
  limitations: [
    "This guide covers the discipline of sourcing, sequencing, and honestly representing uncertainty in a timeline once evidence exists. It does not cover the mechanics of collecting that evidence in the first place — log collection, endpoint data acquisition, or network capture — which vary by tooling and deserve their own treatment.",
    "It does not give legal advice about chain-of-custody procedures, evidentiary admissibility, data-retention obligations, or when law-enforcement or regulatory involvement is required. Those are jurisdiction- and organization-specific questions for an organization's own legal counsel, not something a general guide can answer correctly for every reader.",
    "It does not cover the statistical or automated correlation techniques some SIEM and log-management platforms offer for cross-source timestamp alignment; the discipline here (pick one reference time, document every conversion, flag unreliable sources) applies whether that alignment is done by hand or with tooling, but the tooling itself is out of scope.",
    "The worked example below is deliberately small (five entries) to stay compact and fully fictional; a real incident timeline is very often longer and more heavily cross-referenced than this guide's example can illustrate in a compact form.",
  ],
  defensiveRecommendations: [
    "Require a named, specific evidence source for every timeline entry — a particular system's particular log, record, or file timestamp — never a general description like 'the logs showed' with no way for a second reviewer to locate the same record.",
    "Show a genuine gap in the evidence as an explicit gap in the timeline, not as a smoothly narrated transition between two confirmed events; a reader needs to know which parts of the sequence are actually established.",
    "Normalize every timestamp to one documented reference time (UTC, in IETF RFC 3339 format, is a reasonable default) before ordering events, and record the specific conversion applied to each source next to the entries drawn from it.",
    "Flag any host or log source with known, uncorrected clock drift as unreliable for fine-grained event ordering until the drift is quantified and corrected for, even after its timestamps have been timezone-converted.",
    "Give every timeline entry an explicit CONFIRMED or HYPOTHESIZED status directly in the entry itself, not only in a separate caveat elsewhere in the report, so the distinction survives skimming or excerpting.",
    "Treat file or system timestamps as corroborated evidence, not sole evidence, wherever the stakes justify it — MITRE ATT&CK's Timestomp technique (T1070.006) documents that timestamps themselves can be adversary-manipulated.",
    "Defer questions of formal evidence-preservation procedure, chain-of-custody requirements, and legal or regulatory obligations to an organization's own legal counsel and policy; this guide's 'defensible' means evidence-traceable, not a legal-admissibility claim.",
  ],
  keyTakeaways: [
    "A defensible timeline entry is one a second reviewer can trace back to a specific, named piece of evidence — not a plausible-sounding narrative statement that merely appears next to real evidence elsewhere in the document.",
    "A genuine gap in the evidence should be shown as a visible gap, not bridged with an assumption phrased the same way as a confirmed event — the gap itself is information a reader needs.",
    "Timezone and clock-skew mismatches across log sources are a common, undramatic way a timeline's sequence turns out to be wrong; normalize to one documented reference time and flag any source with uncorrected clock drift as unreliable for precise ordering.",
    "CONFIRMED and HYPOTHESIZED entries need to be structurally distinguishable inside the timeline itself, because a caveat elsewhere in the report does not survive the document being skimmed or excerpted.",
    "This guide describes evidence-traceability, not legal admissibility — formal chain-of-custody and evidentiary questions belong to an organization's own legal counsel, not to this guide.",
  ],
  references: [
    "NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile (April 2025): https://csrc.nist.gov/pubs/sp/800/61/r3/final",
    "NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response: https://csrc.nist.gov/pubs/sp/800/86/final",
    "NIST SP 800-92, Guide to Computer Security Log Management: https://csrc.nist.gov/pubs/sp/800/92/final",
    "MITRE ATT&CK, T1070.006, Indicator Removal: Timestomp: https://attack.mitre.org/techniques/T1070/006/",
    "IETF RFC 3339, Date and Time on the Internet: Timestamps: https://www.rfc-editor.org/rfc/rfc3339",
    "CIS Critical Security Control 8, Audit Log Management: https://www.cisecurity.org/controls/audit-log-management",
  ],
  relatedSlugs: ["logs-are-not-proof-verifying-automated-actions", "tuning-soc-alerts-without-hiding-real-attacks", "turning-attack-hypothesis-into-detection"],
};

// PlaybookModule (kind: "playbook") is written here for the process of
// building and maintaining a defensible timeline during an active
// response, not for the underlying fictional incident itself: "trigger" is
// what starts timeline-construction discipline, "severity" is how much
// rigor a given timeline warrants (not an incident severity), and
// "containment"/"recovery" describe guarding and repairing the timeline
// artifact's own integrity rather than the incident's blast radius. This
// departs from tuning-soc-alerts-without-hiding-real-attacks.ts's mapping
// (a change-management process) because timeline-building is itself an
// ongoing incident-response activity, not a pre-deployment review — so
// "triage" and "decisionPoints" below are about the timeline's construction
// choices at each new piece of evidence, not about disposition of a queue.
const module_: PlaybookModule = {
  kind: "playbook",
  trigger:
    "An incident has been opened and evidence is starting to accumulate from more than one source (a log, an alert, a file timestamp, a system record). This playbook applies from the first entry added to the timeline through the point the timeline is handed to a broader audience (a peer reviewer, leadership, a post-incident review, or, subject to an organization's own legal guidance, outside counsel).",
  severity:
    "Not an incident severity — this rates how much sourcing rigor the timeline itself needs. Treat any timeline that may be shown outside the immediate response team (a peer reviewer, leadership, a post-incident review) as requiring full source citation and CONFIRMED/HYPOTHESIZED labeling on every entry before it leaves the response team. Treat a timeline for an incident where prosecution, litigation, or regulatory involvement is plausible as additionally requiring the organization's own legal counsel to review its evidence-handling procedure before the timeline is finalized — this guide does not determine when that threshold is met.",
  triage: [
    "For each new piece of evidence added to the timeline, identify its specific source (which system, which log, which record) precisely enough that a second reviewer could locate the same evidence independently.",
    "Determine that source's native time reference (UTC, local time, an unspecified or unknown offset) before using its timestamps for anything, and check whether the source system is known to have accurate, synchronized time or documented clock drift.",
    "Classify the entry as CONFIRMED (directly supported by the named evidence) or HYPOTHESIZED (a reasonable inference from the evidence, not itself directly observed) before adding it to the timeline — never add an entry without one of these two labels.",
  ],
  decisionPoints: [
    "If a period between two confirmed events has no covering evidence source: represent it explicitly as a gap in the timeline, stating what is and isn't known about it, rather than writing a connecting sentence that implies continuous observation.",
    "If two sources disagree on timestamps for events that should be sequential: convert both to one documented reference time (UTC in RFC 3339 format is a reasonable default) before drawing any conclusion about ordering, and record the conversion applied to each.",
    "If a source's clock is known to have drifted by an uncorrected amount: use it only for coarse, approximate placement in the timeline, not for deciding the order of two closely timed events, until the drift is quantified and corrected for.",
    "If an entry would assert an event with no directly supporting evidence (a plausible next step in the fictional example's technique, an assumed but unobserved action): label it HYPOTHESIZED and state explicitly what evidence, if it existed, would confirm it — do not write it as a plain, unlabeled timeline entry.",
  ],
  escalation: [
    "Escalate to a peer reviewer before a timeline leaves the immediate response team, specifically to check that every entry carries a named source and a CONFIRMED/HYPOTHESIZED label — a second set of eyes catches narrative-smoothing an author no longer notices in their own draft.",
    "Escalate to the organization's own legal counsel, per its incident-response policy, when prosecution, litigation, or regulatory involvement becomes plausible — this guide does not determine that threshold and should not be treated as having done so.",
    "Escalate immediately, independent of this playbook's normal cadence, if reviewing available evidence reveals that a system depended on for timeline accuracy shows signs of timestamp manipulation (see MITRE ATT&CK T1070.006 in 'Main Content' above) — treat that as a finding about the evidence's trustworthiness, not merely a timeline-formatting question.",
  ],
  containment: [
    "Keep every timestamp conversion applied to a source's raw timestamps documented alongside the timeline entries drawn from that source, so a reviewer can audit the conversion rather than trust it silently.",
    "Keep HYPOTHESIZED entries visually and structurally distinguishable from CONFIRMED ones at every point the timeline is copied, excerpted, or summarized — a summary that drops the label has silently converted an inference into an assertion.",
    "Limit fine-grained ordering claims (which of two closely timed events happened first) to sources with known-accurate, synchronized time; do not let a single unreliable source's precise-looking timestamp override the ordering evidence from a known-reliable one.",
  ],
  recovery: [
    "If a timeline entry is later found to have been asserted without adequate evidentiary support, correct it in place — relabel it HYPOTHESIZED with the actual reasoning shown, or remove it — rather than leaving the original wording and only noting the correction elsewhere.",
    "If a timezone or clock-skew error is discovered after a timeline has already been shared, reissue the corrected timeline explicitly rather than silently editing the original, so anyone who already relied on the earlier version knows a correction occurred.",
    "Record what specifically was wrong (a missing source citation, an unconverted timezone, an unlabeled inference) when a timeline defect is found, not only that it was fixed, so the same category of gap is caught earlier in the next incident's timeline.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Building a Defensible Incident Timeline",
    slug: "building-a-defensible-incident-timeline",
    summary:
      "A playbook for building an incident timeline that a second reviewer can actually verify: citing the specific evidence behind every entry, showing gaps honestly instead of bridging them with plausible assumptions, normalizing timestamps across sources with documented timezone and clock-drift handling, and structurally separating confirmed entries from hypothesized ones, with a compact fictional worked example.",
    pillar: "detect-respond",
    primaryCategory: "incident-response-dfir",
    contentType: "playbook",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["incident-response", "logging-monitoring", "security-control-validation"],
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
