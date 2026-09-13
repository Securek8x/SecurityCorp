// Knowledge-base article draft (Bead securitycorp-source-4zl.56.3.8,
// "Designing an Incident-Response Checklist", category
// securitycorp-source-4zl.56.3 "Incident Response and DFIR"). Status is
// intentionally "drafting" — see docs/publication-safety-policy.md. This
// file is registered in lib/knowledge-content.ts as a drafting-status
// entry; it becomes part of the published catalog only after human privacy/
// technical/publication review, per docs/knowledge-base.md. Every
// organization, person, role, and event described in this file is fictional
// and sanitized; no real incident, victim, system, employer, credential, or
// identifier appears anywhere in this file. No literal filesystem path
// appears anywhere in this file, consistent with this category's
// established practice in building-a-defensible-incident-timeline.ts and
// evidence-collection-before-containment.ts.
//
// Third article in this sub-pillar, after building-a-defensible-incident-
// timeline.ts and evidence-collection-before-containment.ts. Those two cover
// activities *during* a response (writing the timeline, deciding what
// evidence to capture before containment); this one is upstream of both —
// the readiness artifact an organization should already have before either
// situation occurs.
//
// Judgment calls (for the reviewer):
// - primaryCategory "incident-response-dfir" is lib/taxonomy.ts's existing
//   category id for "Incident Response and DFIR" (securitycorp-source-
//   4zl.56.3) — not invented; confirmed by reading lib/taxonomy.ts directly.
// - Controlled tags: the bead's suggestion "incident-response" is a
//   canonical id in lib/knowledge-tags.ts and is used as-is. The bead's
//   other two suggestions, "checklist" and "preparedness", are NOT
//   canonical tag ids and have no alias entry in TAG_ALIASES — confirmed by
//   reading the full TAG_VOCABULARY list. Closest real substitutes used
//   instead: "security-control-validation" (a checklist item is, in this
//   article's own framing, a named control with a verification method and
//   required evidence — the same discipline this tag already covers
//   elsewhere in the catalog, including the very first article in this
//   catalog, "A Practical Secure Code Review Checklist") and
//   "governance-risk-compliance" (this article's central subject — a
//   leadership-approved, documented, periodically reviewed readiness plan —
//   is squarely a governance artifact in the sense this tag already covers
//   in rules-of-engagement-for-an-isolated-lab.ts and scoping-authorized-
//   security-assessment.ts; the taxonomy's own category description for
//   "Incident Response and DFIR" is "Prepare for evidence-based response and
//   investigation," which is this tag's closest available match to
//   "preparedness"). Three tags total, within the 2-4 range this category's
//   acceptance criteria requires.
// - contentType "playbook" (bead-specified, despite the title's "checklist"
//   wording) maps to PlaybookModule (lib/knowledge-content-types.ts), not
//   ChecklistModule. This matches the bead's explicit "Content type:
//   Playbook" field. The two sibling articles in this sub-pillar establish
//   the precedent of writing PlaybookModule fields for the *process*
//   discipline the article teaches rather than a specific incident; this
//   article continues that precedent for the process of designing and
//   maintaining the checklist artifact itself. Where the article's prose
//   needs a control-by-control checklist shape to make a concrete point
//   (the worked example's before/during/after item lists), that is
//   presented as prose within mainContent rather than as a second,
//   competing ChecklistModule — a KnowledgeArticle has exactly one
//   `module`, and the bead's own content-type field settles which one this
//   is.
// - No coverImage is added — that workflow is separate and out of scope for
//   this task.
// - Legal/procedural framing: this article describes an incident-response
//   plan/checklist as an operational readiness artifact, not as legal
//   advice about what a specific jurisdiction's breach-notification law,
//   regulatory requirement, or evidentiary standard requires. Consistent
//   with this sub-pillar's established hedge, the text defers those
//   questions to an organization's own legal counsel throughout.
// - Role realism: the worked example's named roles (an incident lead, a
//   technical lead, a communications lead) are generic functional labels
//   drawn from CISA's public "Incident Response Plan (IRP) Basics"
//   resource, not real individuals, titles, or any real organization's
//   staffing structure.
//
// Editorial routing note: per this repo's Ruflo routing requirement, this
// session's calling agent had already attempted a real
// mcp__ruflo__workflow_run invocation earlier in the session (workflow id
// workflow-1789326889333-sowtu4) and confirmed it reproduced the documented
// issue in CLAUDE.md: 0% progress, a single pending "Execute" stage, no
// retrievable editorial output. Per that confirmed, session-scoped
// limitation, this draft did not re-attempt Ruflo and was produced instead
// with the disclosed native fallback — separate research, drafting,
// technical-verification, publication-safety, and final editorial passes —
// not credited to Ruflo. Every citation below was independently verified
// against its primary source before inclusion (NIST SP 800-61 Rev. 3's PDF
// read directly, including its Section 2.3 policy-element list, its CSF 2.0
// Community Profile rows for GV.PO, GV.RR-02, ID.IM-01/02/03/04, RS.MA, and
// RS.CO, and its playbook/CISA-PB cross-reference in Section 2.3; CISA's
// "Incident Response Plan (IRP) Basics" PDF read directly; and the CIS
// Controls v8.1 page for Control 17 fetched directly for its control-level
// title and description); none were invented. See the calling agent's final
// report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, PlaybookModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "An incident-response checklist that lives only in one experienced responder's head is not a plan — it is a single point of failure wearing a plan's clothing. The Cybersecurity and Infrastructure Security Agency (CISA) frames the alternative directly: an incident response plan is 'a written document, formally approved by the senior leadership team,' that clarifies roles and responsibilities and provides guidance on key activities before, during, and after a confirmed or suspected security incident. A checklist built to that standard is what turns judgment an organization developed calmly, in advance, into something a stressed, time-pressured team can actually run during the one event it was built for.",
    "This guide covers what a defensible incident-response checklist needs to contain: a before/during/after structure that keeps it usable under pressure instead of one undifferentiated wall of tasks; named roles with real authority instead of department names; triage and escalation criteria decided in advance instead of improvised mid-incident; a tested, periodically reviewed cadence instead of a document written once and forgotten; and an honest acknowledgment that a checklist is a skeleton, not an exhaustive catalog of every incident an organization might face. A compact fictional worked example closes the guide. This is not legal-advice content; where legal or regulatory questions come up, the guide says so and defers to an organization's own legal counsel.",
  ],
  whatYouWillLearn: [
    "What a defensible incident-response checklist actually needs to contain, drawing on CISA's public IRP Basics guidance and NIST SP 800-61 Rev. 3's incident-response policy elements.",
    "Why organizing a checklist around before/during/after keeps it usable under pressure, and how that structure maps onto the NIST CSF 2.0 Functions this category's guidance is built on.",
    "Which specific roles a checklist should name — and why 'the security team' or 'IT' is not a role a stressed responder can act on.",
    "Why triage, prioritization, and escalation criteria belong in the checklist itself, decided in advance, rather than improvised for the first time during a real incident.",
    "Why a checklist is a skeleton, not an exhaustive incident catalog, and how to keep a completed review from being mistaken for complete coverage.",
    "How a compact, fully fictional worked example applies all of the above to build one organization's first checklist skeleton.",
  ],
  intendedAudience: [
    "Incident responders and security practitioners tasked with writing, reviewing, or maintaining their organization's incident-response plan or checklist.",
    "Team leads assessing whether an existing plan meets a reasonable baseline of documented elements before relying on it during a real incident.",
    "Practitioners building a first incident-response checklist without prior formal governance or policy-writing experience.",
  ],
  prerequisites: [
    "Basic familiarity with incident-response concepts (detection, containment, recovery) is helpful but not required.",
    "No prior formal governance, risk, or compliance experience is required; this guide is written to be usable by a first-time checklist author.",
    "No lab environment is required; every example in this guide is fictional and descriptive, not a runnable exercise.",
  ],
  problem: [
    "Many organizations either have no written incident-response plan at all, or have one that was written once — often to satisfy an audit or contractual requirement — and never revisited. NIST SP 800-61 Rev. 3 observes that today's incidents 'occur frequently and cause far more damage,' and that recovering from them 'often takes weeks or months due to their breadth, complexity, and dynamic nature' — a scale of effort that does not survive being carried in one person's memory, especially once staff turnover is accounted for. A checklist is the artifact that closes that gap: it moves what a capable responder would do from an individual's head into something the organization as a whole can run.",
    "A second, quieter failure mode is a checklist that exists but is not actually usable: it names departments instead of people, has never been tested against a realistic scenario, and was last touched on the day it was approved. An organization with a stale, untested, unowned document can still say 'we have an incident-response plan' — and that statement can be true and nearly useless at the same time. This guide is about closing both gaps: having a checklist, and having one that would actually hold up on the day it is needed.",
  ],
  threatModel: [
    "This guide's primary failure mode is not an adversary attacking the checklist directly — it is an organizational readiness gap. A well-intentioned team either never writes the plan down, or writes it once and lets it drift out of date, and the gap only becomes visible during the first real incident, when it is the most expensive possible time to discover it.",
    "A fictional scenario used throughout this guide: a small organization referred to here as Thornbury Logistics has grown past the point where an unwritten, one-person understanding of 'what we'd do' is adequate, and is designing its first formal incident-response checklist. Every detail below — the organization, its roles, and its example checklist items — is invented for illustration and does not describe any real organization's actual plan or practice.",
    "Representative failure-mode scenarios, none requiring a sophisticated adversary to produce: (1) a plan names 'the IT team' or 'security' as responsible for leading a response, and during an actual incident no one is sure who has the authority to make the call to isolate a system or notify a customer; (2) a plan exists only on an internal wiki or file share that depends on the same email, chat, or document-storage services an incident may itself take offline — CISA's guidance addresses this directly, recommending printed copies be distributed in advance; (3) a plan has never been tested against a tabletop scenario, so the first time anyone follows its escalation path is during a real, live incident, and gaps in the path are discovered under the worst possible conditions; (4) a plan was written once, at the time a compliance requirement demanded one, and by the time it is needed the named individuals have left the organization and the escalation contacts are stale.",
    "Out of scope: the technical mechanics of containment, evidence collection, or timeline construction during an active incident — this sub-pillar's other guides (see 'Related' below) cover those in depth. Also out of scope: legal advice about breach-notification timing, regulatory reporting obligations, or evidentiary chain-of-custody requirements, which are jurisdiction- and organization-specific questions for an organization's own legal counsel, not something a general guide can answer correctly for every reader. Thornbury Logistics is illustrative throughout, not a reference architecture.",
  ],
  mainContent: [
    "**A checklist is a written, leadership-approved artifact — not tribal knowledge.** CISA's public 'Incident Response Plan (IRP) Basics' guidance opens with exactly this framing: an incident response plan is 'a written document, formally approved by the senior leadership team,' and 'should also include a cybersecurity list of key people who may be needed during a crisis.' NIST SP 800-61 Rev. 3 backs this from the policy side: among the key elements most incident response policies include, the first is a 'statement of management commitment,' and the CSF 2.0 Community Profile this guide is built on rates the Govern-Policy (GV.PO) outcome as High priority for incident response specifically because 'cybersecurity policies should include an incident response policy.' A checklist that has never been formally approved by leadership is a draft, not a plan — and a draft has no one accountable for keeping it current or empowered to act on it during a real incident.",
    "**Organize the checklist around before/during/after — it keeps the document usable under pressure.** CISA's own IRP Basics guidance is structured this way explicitly, with distinct sections for what to do before, during, and after a cybersecurity incident. This is not an arbitrary layout choice: NIST SP 800-61 Rev. 3's incident response life cycle model maps the same three phases onto its CSF 2.0 Functions — 'Preparation' activities correspond to Govern, Identify, and Protect; the active response itself (what CISA calls 'during') corresponds to Detect, Respond, and Recover; and 'Post-Incident Activity' corresponds to the Identify Function's Improvement Category. A responder flipping through a checklist mid-incident should be able to find the 'during' section immediately, without wading through preparation tasks that are no longer relevant or lessons-learned tasks that come later.",
    "**Name real roles with real authority — not department names.** NIST SP 800-61 Rev. 3 is direct on this point: 'all roles and responsibilities involving cybersecurity incident response should be documented in an organization's policies,' and 'all appropriate individuals or parties should be designated the authority necessary to fulfill their incident response-related responsibilities.' CISA's IRP Basics gives one usable, generic model for what this looks like in practice: an Incident Manager who leads the response, manages communication flow, and delegates tasks (but does not perform technical work directly — CISA notes this separation exists partly because 'time dilation affects people's perception of time passing' under crisis conditions, and the Incident Manager's job includes watching the clock); a Technical Manager who serves as subject-matter expert and brings in further technical resources as needed; and a Communications Manager who handles reporters, social media, and external stakeholders. A checklist that says 'security team responds' has not actually assigned anyone anything.",
    "**Decide triage, prioritization, and escalation criteria in advance — not during the incident.** NIST SP 800-61 Rev. 3's Incident Management (RS.MA) guidance states plainly that 'because of resource limitations, incidents should not be handled on a first-come, first-served basis,' and that 'incident triage, prioritization, escalation, and elevation and decisions regarding when to initiate recovery processes should all be based on a set of risk evaluation factors' — the guide's own examples include asset criticality, functional impact, data impact, stage of observed activity, threat actor characterization, and recoverability. A checklist should specify these factors and roughly how they translate into response urgency before any real incident tests them; deciding a prioritization scheme for the first time while an incident is already underway means making that decision under exactly the conditions least suited to making it well.",
    "**Test the checklist before you need it.** CISA recommends conducting an 'attack simulation exercise, sometimes called a tabletop exercise, or TTX' — a role-playing exercise where a facilitator presents an evolving scenario and observes how the team responds — using the framing 'every sports team rehearses, and you should too.' NIST SP 800-61 Rev. 3 rates this as a High-priority activity (ID.IM-02: 'Improvements are identified from security tests and exercises'), noting that exercises 'may provide helpful information for program evaluation and prepare staff and involved third parties... for future incident response activities.' A checklist that has never been rehearsed is a hypothesis about what will work, not a tested plan — and NIST SP 800-84 (Guide to Test, Training, and Exercise Programs for IT Plans and Capabilities) is the resource NIST's own Community Profile points to for designing that testing program in more depth than this guide covers.",
    "**Treat the checklist as a living document with a scheduled review cadence, not a set-and-forget artifact.** CISA's guidance is explicit that 'the best IRPs are living documents that evolve with business changes' and recommends reviewing the plan quarterly. NIST SP 800-61 Rev. 3's ID.IM-04 outcome — rated High priority — recommends organizations 'review and update all cybersecurity plans periodically or when a need for significant improvements is identified,' base each plan 'on the organization's unique requirements, mission, size, structure, and functions,' and ensure each plan 'identif[ies] the resources and management support needed to carry it out successfully.' A review date with no owner responsible for actually performing the review is functionally the same as no review date.",
    "**Close every real use — and every exercise — with a blameless retrospective, and record concrete plan updates.** CISA frames this directly: hold a formal retrospective ('sometimes called a \"postmortem\"') in which the incident lead reports the known timeline and asks for additions, edits, and analysis from the team, and stresses that 'retrospectives must be blameless' because 'security incidents are rarely the result of one person's action' and are 'almost always the result of a failure of the overall system.' NIST SP 800-61 Rev. 3 reinforces this from the improvement side: ID.IM-01 and ID.IM-03 (both feeding the Identify-Improvement outcome that closes the life cycle) call for periodically evaluating incident response program performance and identifying improvements from 'the execution of operational processes, procedures, and activities,' and RC.RP-06 recommends preparing 'an after-action report that documents the incident itself, the response and recovery actions taken, and lessons learned.' A retrospective that produces feelings but no checklist edit has not actually closed the loop.",
    "**A checklist is a skeleton, not an exhaustive incident catalog — guard against a false sense of complete coverage.** NIST SP 800-61 Rev. 3 states this limitation about incident-response documentation directly: 'while it is impossible to have detailed procedures for every possible situation, organizations should consider documenting procedures for responding to the most common types of incidents and threats.' This guide's own opening article in the broader knowledge base makes the same point about checklists generally: 'a passed item means the available evidence was examined; it does not prove that every relevant risk has been found.' A completed checklist review during a real incident should be read the same way — it confirms the items the organization thought to prepare for were addressed, not that every possible risk in that incident was found or ruled out.",
    "**A compact worked example (fully fictional): Thornbury Logistics designs its first checklist.** Thornbury Logistics has never had a formally approved incident-response plan; response so far has depended on one long-tenured systems administrator's judgment. The organization is now building its first checklist skeleton, organized before/during/after.",
    "Before: (1) leadership formally approves the plan and signs a statement of management commitment; (2) staff receive role-appropriate training on how to report a suspected incident, with no penalty for a false alarm reported in good faith; (3) an attorney reviews the plan, particularly its notification and law-enforcement-contact sections; (4) a printed copy of the plan and a current contact list are distributed to every named role, independent of internal systems that might themselves be affected by an incident; (5) a tabletop exercise is scheduled and later held — clearly labeled as SIMULATED throughout — walking the named roles through a fictional scenario; (6) a quarterly review date is set, with a named owner responsible for actually performing it.",
    "During: (1) a named Incident Lead is designated for the specific incident, with authority to coordinate the response and delegate tasks, but not to perform technical work directly; (2) a named Technical Lead serves as subject-matter expert and brings in further technical resources as needed; (3) a named Communications Lead handles any external or media inquiries, following a prepared holding-statement template rather than improvising a public response; (4) the incident is triaged and prioritized against the risk evaluation factors decided on in advance (asset criticality, functional and data impact, and recoverability); (5) escalation criteria decided in advance — not improvised — determine when leadership is brought in.",
    "After: (1) a blameless retrospective is held once the incident (or exercise) concludes, led by the Incident Lead, examining people, process, and technology rather than assigning individual blame; (2) concrete, specific plan edits are recorded as a direct result of the retrospective — not just a general sense that 'we should do better'; (3) the updated plan is redistributed to every named role so the printed and stored copies stay current.",
  ],
  validationEvidence: [
    "This guide describes a checklist-design discipline, illustrated with a single fully fictional organization and checklist skeleton invented for this article. No real organization's incident-response plan, staffing structure, or retrospective record was collected, reviewed, or independently verified as part of writing this guide. Its evidence state is UNVERIFIED and stays UNVERIFIED until an organization applying this guide records its own real, independently reviewed checklist — the label must not be upgraded merely because the guide's reasoning is internally consistent or the worked example reads plausibly.",
  ],
  limitations: [
    "This guide covers what a checklist needs to contain and how to keep it usable and current. It does not cover the technical mechanics of containment, eradication, evidence collection, or timeline construction once an incident is underway — see this category's other guides for that material.",
    "It does not give legal advice about breach-notification timing, regulatory reporting obligations, or evidentiary chain-of-custody requirements. Those are jurisdiction- and organization-specific questions for an organization's own legal counsel, not something a general guide can answer correctly for every reader.",
    "It does not cover the detailed design of a tabletop exercise or test program; NIST SP 800-84 is the resource this guide's own sources point to for that depth.",
    "The worked example is deliberately a skeleton — a small, illustrative before/during/after list — rather than a complete plan; a real organization's checklist is typically longer, includes specific contact information and system-level runbooks, and is tailored to that organization's own structure and risk profile.",
  ],
  defensiveRecommendations: [
    "Get the incident-response checklist formally approved by senior leadership and captured as a written document, not left as one experienced responder's unwritten judgment.",
    "Organize the checklist around before/during/after so a responder can find the currently relevant section immediately during an active incident.",
    "Name specific roles with real authority (an incident lead, a technical lead, a communications lead, or an organization's own equivalent) rather than department names like 'IT' or 'security.'",
    "Decide triage, prioritization, and escalation criteria in advance, using factors like asset criticality, functional and data impact, and recoverability, rather than improvising them during a live incident.",
    "Test the checklist with a tabletop exercise before relying on it, and clearly label any simulated exercise as such throughout its documentation.",
    "Set a recurring review cadence with a named, accountable owner, and treat the plan as a living document that changes as the organization does.",
    "Close every real use and every exercise with a blameless retrospective that produces specific, recorded plan edits — not just a general intention to do better next time.",
    "Treat a completed checklist review as confirmation that the items the organization thought to prepare for were addressed, not as proof that every possible risk in an incident was found.",
  ],
  keyTakeaways: [
    "A defensible incident-response checklist is a written document formally approved by leadership, not tribal knowledge carried by one experienced responder.",
    "Organizing a checklist around before/during/after keeps it usable under pressure and mirrors NIST's own CSF 2.0 mapping of preparation, response, and lessons-learned activities.",
    "Named roles with real authority — not department labels — are what let a stressed team actually act on a checklist during a real incident.",
    "Triage, prioritization, and escalation criteria belong in the checklist, decided calmly in advance, not improvised for the first time during a live incident.",
    "A checklist is a tested, periodically reviewed skeleton, not an exhaustive incident catalog — a completed review confirms prepared-for items were addressed, not that every risk was found.",
  ],
  references: [
    "NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile (April 2025): https://csrc.nist.gov/pubs/sp/800/61/r3/final",
    "CISA, Incident Response Plan (IRP) Basics: https://www.cisa.gov/sites/default/files/publications/Incident-Response-Plan-Basics_508c.pdf",
    "NIST SP 800-84, Guide to Test, Training, and Exercise Programs for IT Plans and Capabilities: https://csrc.nist.gov/pubs/sp/800/84/final",
    "CIS Critical Security Control 17, Incident Response Management: https://www.cisecurity.org/controls/incident-response-management",
  ],
  relatedSlugs: ["building-a-defensible-incident-timeline", "evidence-collection-before-containment", "practical-secure-code-review-checklist"],
};

// PlaybookModule (kind: "playbook") is written here, consistent with this
// sub-pillar's established precedent, for the process of designing and
// maintaining the checklist artifact itself — not for a specific fictional
// incident. "trigger" is what starts (or restarts) checklist-design work,
// "severity" is how much governance rigor a given checklist's scope
// warrants (not an incident severity), "containment" describes guarding the
// checklist artifact's own integrity and honest scope (against false
// completeness) rather than a live incident's blast radius, and "recovery"
// describes correcting the checklist itself after a gap is found, mirroring
// building-a-defensible-incident-timeline.ts's mapping for the same reason:
// this article's subject is the readiness artifact, not the incident it is
// eventually used during.
const module_: PlaybookModule = {
  kind: "playbook",
  trigger:
    "No formally approved incident-response checklist exists yet, an existing one has never been reviewed against a current organizational structure, a retrospective or exercise has surfaced a specific gap, or a regulatory or contractual change has introduced a new requirement the checklist does not yet address.",
  severity:
    "Not an incident severity — this rates how much governance rigor a given checklist's scope warrants. Treat any checklist intended to be the organization's actual incident-response plan as requiring full leadership approval, named roles, and a tested tabletop exercise before it is relied upon. A narrower team-level job aid intended to supplement (not replace) an approved organizational plan warrants less formal review, but should still name specific roles rather than departments.",
  triage: [
    "Identify the checklist's intended audience and scope: an organization-wide, leadership-approved plan, or a narrower team-level supplement to one that already exists.",
    "Identify legal, regulatory, and contractual requirements the checklist needs to address (for example, breach-notification obligations) so they can be reviewed with an organization's own legal counsel before the checklist is finalized.",
    "Identify the specific individuals, not departments, who will fill each named role, and confirm each has the authority the role requires.",
  ],
  decisionPoints: [
    "If no organization-wide plan exists yet: build the full before/during/after skeleton and route it for formal leadership approval before treating it as the organization's actual plan.",
    "If a plan exists but has never been tested: schedule a tabletop exercise, clearly labeled as SIMULATED throughout its documentation, before relying on the plan during a real incident.",
    "If a retrospective or exercise surfaces a specific gap: record a concrete, specific edit to the checklist as a direct result — not a general note to 'improve the plan' with no assigned owner or deadline.",
    "If a named individual in a checklist role leaves the organization or changes position: update the checklist's role assignments and redistribute the current version before the gap is discovered during a real incident.",
  ],
  escalation: [
    "Escalate to an organization's own legal counsel before finalizing any section addressing breach notification, law-enforcement contact, or regulatory reporting — this guide does not determine what a specific jurisdiction requires.",
    "Escalate to senior leadership for formal approval before treating a drafted checklist as the organization's actual incident-response plan; an unapproved draft has no one accountable for keeping it current.",
    "Escalate immediately, independent of the normal review cadence, if a tabletop exercise or real incident reveals that a named role has no one currently able to fill it — an unfillable role is a gap that should not wait for the next scheduled review.",
  ],
  containment: [
    "Keep the checklist's stated scope honest: label it clearly as covering the most common, anticipated incident types rather than implying it is an exhaustive catalog of every possible incident.",
    "Keep distributed copies (printed or otherwise independent of internal systems) synchronized with the current approved version, so an outdated copy is not mistaken for the current plan during an actual incident.",
    "Keep any tabletop exercise or drill clearly and consistently labeled as simulated throughout its own documentation, so a later reader cannot mistake exercise records for a real incident's record.",
  ],
  recovery: [
    "If a checklist gap is discovered — during a real incident, an exercise, or a routine review — correct the checklist itself and record what specifically was wrong, not only that a correction was made, so the same category of gap is caught earlier next time.",
    "If a real incident or exercise reveals that named roles, contacts, or escalation paths were stale, update and redistribute the corrected checklist promptly rather than waiting for the next scheduled quarterly review.",
    "Review the checklist itself, not only the incident it was used for, during every retrospective — asking whether the checklist's structure, named roles, and criteria actually held up, not just whether the incident was resolved.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Designing an Incident-Response Checklist",
    slug: "designing-an-incident-response-checklist",
    summary:
      "A playbook for building a defensible incident-response checklist: a before/during/after structure that stays usable under pressure, named roles with real authority, triage and escalation criteria decided in advance, a tested and periodically reviewed cadence, and an honest acknowledgment that a checklist is a skeleton rather than an exhaustive incident catalog — with a compact fictional worked example.",
    pillar: "detect-respond",
    primaryCategory: "incident-response-dfir",
    contentType: "playbook",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["incident-response", "security-control-validation", "governance-risk-compliance"],
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
