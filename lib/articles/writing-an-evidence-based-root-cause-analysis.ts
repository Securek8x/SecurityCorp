// Knowledge-base article draft (Bead securitycorp-source-4zl.56.3.6,
// "Writing an Evidence-Based Root-Cause Analysis", category
// securitycorp-source-4zl.56.3 "Incident Response and DFIR"). Status is
// intentionally "drafting" — see docs/publication-safety-policy.md. This
// file is registered in lib/knowledge-content.ts as a drafting-status
// entry; it becomes part of the published catalog only after human
// privacy/technical/publication review, per docs/knowledge-base.md. Every
// organization, analyst, host, account, and event described in this file is
// fictional and sanitized; no real incident, victim, system, employer,
// credential, or identifier appears anywhere in this file. No literal
// filesystem path appears anywhere in this file (fictional or otherwise) —
// locations are described in prose, consistent with this category's
// established practice in building-a-defensible-incident-timeline.ts and
// evidence-collection-before-containment.ts.
//
// Differentiation from Bead securitycorp-source-4zl.46 ("Evidence-Based
// Root-Cause Analysis for Infrastructure Incidents"): as of this writing
// that bead is still OPEN with no corresponding file under lib/articles/ —
// it has not actually been drafted or published in this worktree, despite
// this task's framing describing it as already-published. Regardless, the
// two are scoped to stay clearly distinct once both exist: 4zl.46 sits
// under the Security Architecture pillar/category, is aimed at security
// practitioners and platform engineers, and (per its own description) is
// about using evidence to design or verify a *resilient security control*
// for infrastructure — an architecture-verification exercise. This article
// sits under Detect and Respond / Incident Response and DFIR, is aimed at
// incident responders performing the general DFIR analytical discipline of
// establishing what actually caused an incident (as opposed to a technical
// control's resilience specifically): distinguishing a root cause from a
// contributing factor, a proximate cause, and a mere symptom; testing a
// causal claim against evidence rather than accepting a plausible-sounding
// narrative; and routing findings into the corrective-action loop. Nothing
// in this article assumes or describes a specific technology, architecture,
// or infrastructure component — the causal-reasoning discipline it teaches
// applies regardless of what technical system was involved, which is the
// intended line between the two articles.
//
// Sixth article in this sub-pillar, after building-a-defensible-incident-
// timeline.ts and evidence-collection-before-containment.ts (not yet
// registered in this branch's catalog — cross-referenced here by slug so
// the link resolves automatically once registered, per those articles'
// established convention). This article picks up where the timeline
// article's evidence discipline and the evidence-collection article's
// capture discipline leave off: once a defensible timeline and captured
// evidence exist, this is how to reason from them to a defensible
// statement of cause, rather than a plausible guess dressed up as one.
//
// Judgment calls (for the reviewer):
// - primaryCategory "incident-response-dfir" is lib/taxonomy.ts's existing
//   category id for "Incident Response and DFIR" (securitycorp-source-
//   4zl.56.3) — not invented; confirmed by reading lib/taxonomy.ts directly.
// - Controlled tags: the bead's suggestion "incident-response" is a
//   canonical id in lib/knowledge-tags.ts and is used as-is. The bead's
//   other two suggestions, "root-cause-analysis" and "evidence", are NOT
//   canonical tag ids and have no alias entry in TAG_ALIASES — confirmed by
//   reading the full TAG_VOCABULARY list. Closest real substitutes used
//   instead: "security-control-validation" (this article's central
//   discipline — testing a causal claim against evidence rather than
//   accepting it because it sounds plausible — is the same verification
//   discipline that tag already covers elsewhere in the catalog, e.g.
//   logs-are-not-proof-verifying-automated-actions.ts and the sibling
//   timeline article) and "governance-risk-compliance" (this article's
//   worked example and its treatment of root cause as a systemic/process
//   condition — not a single technical misconfiguration — is squarely a
//   governance-and-process finding, and NIST CSF 2.0's ID.IM "Improvement"
//   category, cited below, is itself a governance/risk-management
//   mechanism). Three tags total, within the 2-4 range this category's
//   acceptance criteria requires.
// - contentType "playbook" (bead-specified) maps to PlaybookModule
//   (lib/knowledge-content-types.ts). Like building-a-defensible-incident-
//   timeline.ts (and unlike evidence-collection-before-containment.ts, whose
//   subject is a literal containment action), this article's subject is an
//   analytical/documentation discipline rather than an action taken against
//   a live system — so "containment" below is written, following the
//   timeline article's precedent, about guarding the root-cause analysis
//   record's own integrity against premature closure and single-cause bias,
//   not about a literal network or account containment action. This
//   departure is intentional and explained inline at the module definition.
// - No coverImage is added — that workflow is separate and out of scope
//   for this task.
// - Legal/procedural framing: this article treats "root cause" in the same
//   operational, evidence-traceable sense NIST SP 800-61 Rev. 3 uses it
//   (an underlying or systemic condition established by analysis) — not as
//   a claim about legal liability, fault, or any jurisdiction's standard of
//   proof. It does not give legal advice, matching the sibling articles'
//   established hedge toward an organization's own legal counsel.
// - Privilege realism: the worked example never depicts the fictional
//   actor or automation identity performing an action requiring a
//   privilege level not already established earlier in the same example
//   (the service account's excess permission is itself the finding under
//   analysis, not a plot device to enable a further, unstated action).
// - Citation caution: root-cause techniques such as "five whys" and
//   fishbone/Ishikawa analysis are widely known general engineering
//   methods, not NIST- or CIS-specific ones. This article names the
//   iterative-questioning technique descriptively (a well-known named
//   method) without attributing it to any of the cited standards, and
//   attaches an actual citation only to claims those standards make
//   directly (root-cause language in NIST SP 800-61 Rev. 3 / CSF 2.0
//   RS.AN-03, the improvement loop in CSF 2.0 ID.IM, and the post-incident
//   review safeguard in CIS Control 17). No specific timing recommendation
//   (e.g., "within N days/weeks") is attributed to NIST — the primary
//   source, verified directly, ties a lessons-learned review to recovery
//   concluding rather than to a specific day/week interval, and several
//   secondary summaries found during research overstated this with an
//   invented interval that this article deliberately does not repeat.
//
// Editorial routing note: per this repo's Ruflo routing requirement, this
// task's calling agent had already attempted a real mcp__ruflo__workflow_run
// invocation earlier in this session (workflow id
// workflow-1789326889333-sowtu4) and confirmed the same documented issue as
// every prior article in this catalog: 0% progress, a single pending
// "Execute" stage, no retrievable editorial output. That confirmed-dead
// status was carried into this drafting task rather than re-attempted, per
// this session's explicit instruction not to re-invoke Ruflo tools once
// already confirmed dead. This draft was therefore produced with the
// disclosed native fallback instead — separate research, drafting,
// technical-verification, publication-safety, and final editorial passes —
// not credited to Ruflo. Every citation below was independently verified
// against its primary source via WebFetch before inclusion (NIST SP 800-61
// Rev. 3 and NIST CSWP 29 / CSF 2.0 PDFs read directly for their exact
// RS.AN-03, RS.AN-06/07/08, and ID.IM-01/02/03 wording; MITRE ATT&CK T1070's
// technique page; and CIS Control 17's and Control 8's safeguard/control
// pages); none were invented. A secondary-source claim about a specific
// "two weeks" lessons-learned timing window, and another about NIST-defined
// MTTD/MTTC/root-cause-distribution metrics, were checked directly against
// the primary SP 800-61 Rev. 3 text, found unsupported there, and
// deliberately excluded from this article rather than repeated. See the
// calling agent's final report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, PlaybookModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "A root-cause analysis (RCA) makes a specific, falsifiable claim: this is why the incident happened, and not merely what happened or in what order. That claim is easy to get wrong in a way that looks right — a plausible-sounding explanation, reached quickly under the pressure to close out an incident, reads exactly like a rigorously tested one to anyone who wasn't in the room. The difference is not confidence or fluency; it's whether the claim was actually tested against evidence and against the alternative explanations that were available, or simply accepted because it fit the story the team had already started telling.",
    "This guide covers the analytical discipline that separates a defensible root cause from a plausible guess: distinguishing a root cause from a proximate cause, a contributing factor, and a mere symptom; treating a causal claim the way this sub-pillar's other guides treat a factual claim — CONFIRMED only when evidence actually supports it, HYPOTHESIZED when it doesn't yet; testing whether a proposed cause is genuinely systemic by asking whether fixing it would prevent the next incident of the same kind, not just this one; and routing the finding into an organization's own corrective-action process rather than treating the written analysis as the end of the work. A compact fictional worked example closes the guide. This is not a technology- or architecture-specific analysis method, and it is not legal-advice content about fault or liability.",
  ],
  whatYouWillLearn: [
    "How to distinguish a symptom, a proximate cause, a contributing factor, and a root cause from one another, instead of using all four terms interchangeably for whatever explanation was found first.",
    "A practical test for whether a proposed cause is genuinely systemic ('would fixing only this prevent the next incident of the same general kind, even via a different specific trigger?') rather than a description of this one instance.",
    "How to apply the same CONFIRMED/HYPOTHESIZED evidentiary discipline this sub-pillar's timeline guide uses for events to a causal claim specifically — including why co-occurrence in time is not, by itself, sufficient evidence of causation.",
    "Why real incidents commonly have more than one necessary contributing condition, and why an RCA that settles on exactly one tidy cause is a common failure mode worth watching for in your own analysis.",
    "How to route an RCA's findings into an organization's corrective-action or improvement process, and how to verify afterward that the resulting fix actually addressed the identified root cause rather than only the specific trigger observed.",
  ],
  intendedAudience: [
    "Incident responders and security practitioners writing or reviewing a root-cause analysis during or after a response.",
    "Analysts who have written an incident summary or timeline before but not one required to defend a specific causal claim under scrutiny.",
    "Team leads and reviewers deciding whether a draft RCA is ready to inform a corrective-action decision, rather than only a narrative account of events.",
  ],
  prerequisites: [
    "A timeline or evidence record of the incident already assembled — this guide assumes events and their supporting evidence exist and focuses on reasoning from them to a cause, not on collecting them in the first place.",
    "No prior formal root-cause-analysis training is required; this guide is written to be usable by a first-time RCA author.",
    "No lab environment is required; every example in this guide is fictional and descriptive, not a runnable exercise.",
  ],
  problem: [
    "Once an incident is contained and a timeline exists, there is strong organizational pressure to produce an answer to 'why did this happen' quickly — leadership wants closure, a corrective action needs to be assigned, and a post-incident review meeting is often already scheduled. Under that pressure, the first plausible-sounding explanation that fits the available facts tends to get written down as the root cause, whether or not it was actually tested against the evidence or checked against other explanations that fit the same facts equally well.",
    "This gap rarely comes from carelessness. NIST SP 800-61 Rev. 3 itself directs analysts to 'analyze the incident to find the underlying or systemic root causes' — but a systemic cause usually takes more digging to reach than a proximate one, and a report that stops at the proximate cause (the specific technical action that immediately produced the observed effect) can look complete without actually being complete. The result is a root-cause analysis that reads confidently, gets a corrective action assigned against the proximate cause alone, and leaves the systemic condition that produced it fully intact — ready to produce the same class of incident again through a different specific trigger next time.",
  ],
  threatModel: [
    "This guide's primary failure mode is not an adversary attacking the analysis directly (though 'Main Content' below covers one adversary technique — indicator removal — that can directly limit how much a root-cause analysis can actually confirm). The primary failure mode is an analytical process failure: a well-intentioned team, under pressure to close out an incident, accepts a causal explanation because it is plausible and fits the known facts, without testing it against evidence or against the alternative explanations the same facts could also support.",
    "A fictional scenario used throughout this guide: a small organization referred to here as Thistlewood Retail Co. detects an unusual volume of data exported through an internal reporting interface, tied to an automation identity rather than a person. Every detail below — the account, the systems, the specific figures, and the outcome — is invented for illustration and does not describe any real environment, incident, or organization.",
    "Representative failure-mode scenarios, none requiring a sophisticated adversary to produce: (1) an RCA states 'the incident was caused by an overly permissive credential' and stops there, when the credential's excess permission was itself a symptom of a broader onboarding process that grants every new automation identity the same excess permission by default — fixing the one credential leaves the process that will produce the next one untouched; (2) two conditions were both necessary for the incident to occur (an excess permission and the absence of any alerting on abnormal use of that permission), but the RCA names only the more visible one, because acknowledging two causes felt less tidy than settling on one; (3) an RCA asserts that a specific configuration change 'caused' the incident because the change and the incident happened close together in time, without checking whether anything else changed in the same window or whether the mechanism connecting the change to the effect was ever actually confirmed; (4) an RCA is finalized and a corrective action assigned before anyone checks whether the fix addresses the identified cause or only the specific instance that was observed — the same underlying condition remains available to produce a similar incident through a different trigger.",
    "A related adversary-driven case worth naming: MITRE ATT&CK documents Indicator Removal (technique T1070) as adversaries deliberately deleting or altering artifacts — command history, files, timestamps, logs — specifically to complicate exactly the kind of causal reconstruction this guide describes. When evidence needed to confirm or rule out a candidate cause has been removed or altered, the honest conclusion is that the root cause could not be confirmed to the intended level of confidence with the evidence available — not a best guess presented with the same confidence a fully evidenced conclusion would carry.",
    "Out of scope: the internal architecture or configuration mechanics of any specific system, cloud platform, or identity provider; formal fault, liability, or legal-admissibility determinations, which are a legal and organizational-policy topic this guide does not give advice on; and any evaluation of a real organization's actual incident-response practice. Thistlewood Retail Co. is illustrative throughout, not a reference architecture.",
  ],
  mainContent: [
    "**A symptom, a proximate cause, a contributing factor, and a root cause are four different things, and confusing them is the single most common way an RCA falls short.** A symptom is what was observed — an alert, an anomaly, a report of unusual behavior. A proximate cause is the specific, immediate technical action or condition that directly produced the symptom. A contributing factor is a condition that was necessary for the incident to happen or to reach the severity it did, but was not, by itself, sufficient to cause it. A root cause is the underlying or systemic condition that — left unaddressed — would keep producing incidents in this general class regardless of which specific proximate cause triggers the next one. NIST SP 800-61 Rev. 3 frames the analysis task under its RS.AN-03 outcome — 'analysis is performed to establish what has taken place during an incident and the root cause of the incident' — directing analysts both to determine what was 'directly or indirectly involved' and separately to 'analyze the incident to find the underlying or systemic root causes.' That double framing is doing real work: it distinguishes what was directly involved (closer to a proximate cause) from what is underlying or systemic (a root cause), even though it does not give the four-way distinction above a formal name of its own — this guide's terminology is this guide's own, built to make that same distinction usable in practice.",
    "**A practical test for whether a proposed cause is genuinely 'root': would fixing only this prevent the next incident of the same general kind, even through a different specific trigger?** If the answer is no — if a different specific technical trigger could still produce the same class of incident because the underlying condition that made it possible is untouched — the proposed cause is a proximate cause or a contributing factor, not a root cause, no matter how directly it produced this particular incident. This test is what keeps an iterative 'why' line of questioning (a well-known general technique: keep asking why the prior answer was possible, not just what happened) from stopping at the first plausible-sounding answer. The discipline is to keep asking until the answer describes a condition whose correction would change the organization's general exposure to this class of incident, not just this specific instance of it.",
    "**Treat a causal claim with the same evidentiary discipline this sub-pillar's timeline guide applies to a factual claim — CONFIRMED only when evidence actually supports it, HYPOTHESIZED when it doesn't yet.** A confirmed causal claim needs three things: evidence that the candidate cause actually existed at the relevant time; evidence, or at minimum a clearly stated and plausible mechanism, connecting that cause to the observed effect; and an explicit record of which alternative explanations were considered and why they were ruled out. Co-occurrence in time — 'the change happened shortly before the incident' — is not, by itself, sufficient evidence of causation; it is a reason to investigate the connection, not a substitute for confirming it. An RCA that presents a causal claim without having checked for a plausible alternative explanation has not confirmed causation — it has found a candidate and stopped looking.",
    "**Real incidents commonly have more than one necessary contributing condition, and settling on exactly one is a common failure mode, not a sign of rigor.** NIST SP 800-61 Rev. 3's own language treats causal involvement plurally — 'vulnerabilities, threats, and threat actors' directly or indirectly involved, considered separately from 'underlying or systemic root causes' — which is consistent with most real incidents needing more than one condition to align before they can occur. An RCA that names a single tidy cause when the evidence actually supports two or three contributing conditions has not simplified the finding; it has left at least one exploitable condition undocumented and, likely, uncorrected.",
    "**When evidence needed to confirm or rule out a candidate cause is missing, altered, or was never collected, say so explicitly rather than presenting a best guess with unearned confidence.** MITRE ATT&CK's Indicator Removal (T1070) documents that adversaries can and do remove exactly the kind of artifact — command history, files, timestamps, log entries — an RCA depends on to confirm a mechanism. When that has plausibly happened, or when a needed evidence source simply was never retained, the defensible statement is that the root cause could not be confirmed to the intended confidence level with the evidence available, naming specifically what evidence would have been needed — not a narrative that reads as confidently as a fully evidenced conclusion while resting on materially less support.",
    "**An RCA's job is not finished when the document is written — it is finished when the finding has been routed into the organization's corrective-action process and the fix has been checked against the root cause it was meant to address.** NIST CSF 2.0's ID.IM (Improvement) category exists for exactly this handoff: ID.IM-01 covers improvements 'identified from evaluations,' and ID.IM-03 covers improvements 'identified from execution of operational processes, procedures, and activities' — a root-cause analysis is squarely both. CIS Critical Security Control 17 (Incident Response Management) names this formally as Safeguard 17.8, 'Conduct Post-Incident Reviews,' as part of a broader incident-response management program. The verification step this guide adds on top of routing the finding: after a corrective action is implemented, check it against the 'next occurrence' test from earlier in this section — does the fix address the systemic condition identified as root cause, or only the specific proximate trigger that was observed this time? A corrective action that passes only the second test has closed the incident's paperwork without closing its exposure.",
    "**A compact worked example (fully fictional): Thistlewood Retail Co.'s reporting-API incident.** Thistlewood's SOC receives an alert for an unusually large data export through an internal reporting API, attributed to an automation identity, 'svc-analytics-sync,' rather than a person. The steps below apply the distinctions above to reach a defensible root cause rather than stopping at the first plausible explanation.",
    "Step 1 — Symptom (CONFIRMED): the SOC's monitoring shows svc-analytics-sync exporting a data volume many times its documented normal pattern within a short window. Source: the reporting API's own access log (native timestamps already in UTC). This is what was observed, not yet why.",
    "Step 2 — Proximate cause (CONFIRMED): review of the identity's granted permissions shows svc-analytics-sync holds read access to the entire reporting dataset, though its documented function only requires read access to a single report category. Source: the identity provider's current entitlement record for the account. The account's excess permission is what technically made the large export possible; this is the proximate cause, not yet the root cause.",
    "Step 3 — Testing whether the proximate cause is the root cause: the team asks whether narrowing svc-analytics-sync's permission to only its documented report category would prevent the next incident of this kind. Reviewing the onboarding records for the four most recently created automation identities (CONFIRMED, sourced from the identity provider's account-creation log) shows every one of them was granted the same broad, unreviewed 'read-all-reports' scope as svc-analytics-sync at creation time, regardless of documented function. Narrowing this one account's permission would not change that pattern — the next automation identity created under the same onboarding process would receive the same excess scope. This fails the 'next occurrence' test for a root cause and confirms the excess permission is a proximate cause, not the root cause.",
    "Step 4 — Root cause (CONFIRMED): the onboarding process for new automation identities grants a broad default permission scope with no documented least-privilege review step before an identity is put into use — a systemic, process-level condition that produced this specific instance and would produce a similar one again through a different automation identity. Source: the organization's current onboarding procedure documentation, which the team confirms contains no such review step.",
    "Step 5 — Contributing factor (CONFIRMED, recorded separately from the root cause rather than folded into it): no alerting existed for a sustained period on unusually large exports specifically from automation identities as a category, which meant this instance was caught only because the volume was extreme enough to trip a general threshold. This condition did not cause the incident on its own, but it affected how quickly it was noticed, and is recorded as a distinct contributing factor rather than merged into the root-cause statement.",
    "Step 6 — Routing and verification: the finding is routed to the team that owns automation-identity onboarding, with the root cause (the process gap) and the contributing factor (the alerting gap) recorded as two separate items requiring two separate corrective actions. After the onboarding process is updated to require a documented least-privilege scope review, the team verifies the fix against the root cause specifically — checking that a newly created test identity created under the updated process receives only its documented required scope — rather than verifying only that svc-analytics-sync's individual permission was narrowed.",
  ],
  validationEvidence: [
    "This guide describes a root-cause-analysis reasoning discipline, illustrated with a single fully fictional organization, account, and incident invented for this article. No real system, permission record, onboarding process, or export event described here was collected, correlated, or independently verified against a live or lab-reproduced environment as part of writing this guide. Its evidence state is UNVERIFIED and stays UNVERIFIED until an organization applying this guide records its own real, independently sourced root-cause finding — the label must not be upgraded merely because the guide's reasoning is internally consistent or the worked example reaches a tidy-sounding conclusion.",
  ],
  limitations: [
    "This guide covers the reasoning discipline for reaching and documenting a defensible root cause once a timeline and supporting evidence already exist. It does not cover assembling that timeline or collecting that evidence in the first place — see this sub-pillar's timeline and evidence-collection guides for those disciplines.",
    "It does not give legal advice about fault, liability, or any jurisdiction's standard of proof for a causal claim. Where an RCA's findings might inform a legal, contractual, or regulatory process, that determination belongs to an organization's own legal counsel, not to this guide.",
    "It does not cover formal engineering root-cause methodologies (fault-tree analysis, Ishikawa/fishbone diagramming, statistical process control) in depth; it names the general iterative-questioning technique descriptively and focuses on the evidentiary discipline that applies regardless of which specific method structures the questioning.",
    "The worked example is deliberately small (one account, one incident, six steps) to stay compact and fully fictional; a real incident's causal analysis is often more heavily cross-referenced across multiple systems and conditions than this guide's example can illustrate in a compact form.",
  ],
  defensiveRecommendations: [
    "Distinguish a symptom, a proximate cause, a contributing factor, and a root cause explicitly in every RCA, rather than using whichever term feels appropriate for the first explanation that was found.",
    "Apply the 'next occurrence' test to any proposed root cause: would fixing only this prevent the next incident of the same general kind through a different specific trigger? If not, keep looking — the proposed cause is proximate or contributing, not root.",
    "Require a confirmed causal claim to show three things: evidence the candidate cause existed at the relevant time, evidence or a stated mechanism connecting it to the effect, and a record of which alternative explanations were checked and ruled out — never treat time-based co-occurrence alone as sufficient.",
    "Expect and record more than one contributing condition where the evidence supports it; do not simplify a multi-cause finding into a single tidy cause for the sake of a cleaner-looking report.",
    "State explicitly when evidence needed to confirm a candidate cause is missing or was never collected, and name what evidence would have been needed — do not present an unconfirmed best guess with the same confidence as a fully evidenced conclusion.",
    "Route every RCA finding into the organization's corrective-action or improvement process (NIST CSF 2.0's ID.IM category and CIS Control 17's post-incident review safeguard are two established mechanisms for this), and verify the resulting fix against the identified root cause specifically, not only against the single instance that was observed.",
    "Treat MITRE ATT&CK's Indicator Removal (T1070) as a reason evidence supporting a causal claim may be incomplete or altered — factor that possibility into how confidently a root cause is stated, rather than assuming available evidence is always complete.",
  ],
  keyTakeaways: [
    "A root cause is the underlying, systemic condition that would keep producing incidents in this class regardless of which specific trigger occurs next — not the same thing as a symptom, a proximate cause, or a contributing factor, and confusing the four is the most common way an RCA falls short.",
    "The 'next occurrence' test — would fixing only this prevent a similar incident through a different specific trigger? — is a practical way to check whether a proposed cause is genuinely systemic before writing it down as the root cause.",
    "A causal claim needs the same evidentiary discipline as a factual claim: confirmed evidence the cause existed and a confirmed or clearly stated mechanism connecting it to the effect, with alternative explanations explicitly checked — co-occurrence in time is not enough on its own.",
    "Real incidents often have more than one necessary contributing condition; settling on a single tidy cause when the evidence supports several is a common failure mode, not a sign of a well-focused analysis.",
    "An RCA is not finished when it is written — it is finished when its finding has been routed into a corrective-action process and the resulting fix has been verified against the root cause itself, not only against the specific instance that was observed.",
  ],
  references: [
    "NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile (April 2025): https://csrc.nist.gov/pubs/sp/800/61/r3/final",
    "NIST CSWP 29, The NIST Cybersecurity Framework (CSF) 2.0 (February 2024): https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf",
    "MITRE ATT&CK, T1070, Indicator Removal: https://attack.mitre.org/techniques/T1070/",
    "CIS Critical Security Control 17, Incident Response Management: https://www.cisecurity.org/controls/incident-response-management",
    "CIS Critical Security Control 8, Audit Log Management: https://www.cisecurity.org/controls/audit-log-management",
  ],
  relatedSlugs: ["building-a-defensible-incident-timeline", "evidence-collection-before-containment", "logs-are-not-proof-verifying-automated-actions"],
};

// PlaybookModule (kind: "playbook") is written here for the process of
// reasoning from existing evidence to a defensible root cause, following
// building-a-defensible-incident-timeline.ts's precedent rather than
// evidence-collection-before-containment.ts's: like the timeline article,
// this article's subject is an analytical/documentation discipline, not a
// literal action taken against a live system, so "containment" below
// describes guarding the RCA record's own integrity (against premature
// closure and single-cause bias) rather than a network or account
// containment action. "trigger" is what starts root-cause reasoning,
// "severity" is how much causal rigor a given finding warrants (not an
// incident severity), and "recovery" covers correcting an RCA finding later
// shown to be wrong or incomplete.
const module_: PlaybookModule = {
  kind: "playbook",
  trigger:
    "A timeline and supporting evidence for an incident already exist (see this sub-pillar's timeline and evidence-collection guides), and the team is ready to reason from them to a statement of cause. This playbook applies from that point through the finding being routed into a corrective-action process and verified.",
  severity:
    "Not an incident severity — this rates how much causal rigor the finding itself warrants. Treat any RCA that will inform a corrective action, a leadership report, or a post-incident review (CIS Control 17 Safeguard 17.8) as requiring the full CONFIRMED/HYPOTHESIZED causal discipline below before it leaves the response team. Treat an RCA whose corrective action would be costly, disruptive, or hard to reverse as additionally requiring a second reviewer's explicit sign-off on the 'next occurrence' test before the corrective action is finalized.",
  triage: [
    "Separate what was observed (the symptom) from what is being proposed as its cause before writing anything down as a conclusion — a symptom and a cause are not the same claim and should never share a single, unlabeled sentence.",
    "For each candidate cause, identify what evidence would need to exist to confirm it, and check whether that evidence is actually available, missing, or was never collected.",
    "Apply the 'next occurrence' test to every candidate root cause before finalizing it: would fixing only this prevent a similar incident through a different specific trigger?",
  ],
  decisionPoints: [
    "If a candidate cause passes the 'next occurrence' test (fixing it would prevent recurrence through other triggers, not just this one): treat it as a root cause and document the systemic condition explicitly, not just the specific instance observed.",
    "If a candidate cause fails that test but was still necessary for the incident to occur: record it as a proximate cause or contributing factor, not a root cause, and keep looking for the systemic condition behind it.",
    "If evidence needed to confirm a candidate cause is missing, altered, or was never retained: label the causal claim as unconfirmed and state explicitly what evidence would have been needed, rather than presenting a best guess with unearned confidence.",
    "If more than one condition appears necessary for the incident to have occurred: record each as a separate finding rather than merging them into a single cause for the sake of a tidier-looking report.",
  ],
  escalation: [
    "Escalate to a peer reviewer before an RCA's finding is routed into a corrective-action decision, specifically to check the 'next occurrence' test and the evidentiary support for the stated cause — a second set of eyes catches premature closure an author no longer notices in their own analysis.",
    "Escalate to the organization's own legal counsel, per its policy, where an RCA's findings might inform a legal, contractual, or regulatory process — this guide does not determine that threshold and should not be treated as having done so.",
    "Escalate immediately, independent of this playbook's normal cadence, if evidence needed for the analysis shows signs of removal or alteration (see MITRE ATT&CK T1070 in 'Main Content' above) — treat that as a finding about the analysis's own achievable confidence, not merely an inconvenience to work around.",
  ],
  containment: [
    "Keep every causal claim's supporting evidence and its CONFIRMED/HYPOTHESIZED status documented alongside the claim itself, so a reviewer can audit the basis for the conclusion rather than trust it silently.",
    "Keep a root cause, a proximate cause, and a contributing factor visibly distinct throughout the document — a summary or excerpt that collapses them into one 'cause' has silently discarded information a corrective-action decision needs.",
    "Resist finalizing a single-cause conclusion before checking whether the evidence actually supports more than one necessary condition; treat an unusually tidy finding as a prompt to check for what might have been left out, not as a sign the analysis is complete.",
  ],
  recovery: [
    "If a stated root cause is later found to have been unconfirmed, incomplete, or wrong, correct the RCA in place — restate it with the actual supporting reasoning shown, or relabel it HYPOTHESIZED — rather than leaving the original conclusion and noting the correction only elsewhere.",
    "If a corrective action is later found to have addressed only a proximate cause rather than the identified root cause, reopen the finding and route it again rather than treating the original corrective action as having closed the matter.",
    "Record what specifically was wrong (an untested causal claim, a missed contributing factor, a corrective action that didn't reach the root cause) when an RCA defect is found, not only that it was corrected, so the same category of gap is caught earlier in the next incident's analysis.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Writing an Evidence-Based Root-Cause Analysis",
    slug: "writing-an-evidence-based-root-cause-analysis",
    summary:
      "A playbook for reasoning from existing incident evidence to a defensible root cause: distinguishing a root cause from a proximate cause, a contributing factor, and a symptom; testing a proposed cause against a 'would this prevent the next occurrence' standard; applying evidence-based CONFIRMED/HYPOTHESIZED discipline to causal claims specifically; and routing findings into a corrective-action process with a follow-up verification step, illustrated with a compact fictional worked example.",
    pillar: "detect-respond",
    primaryCategory: "incident-response-dfir",
    contentType: "playbook",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["incident-response", "security-control-validation", "governance-risk-compliance"],
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
