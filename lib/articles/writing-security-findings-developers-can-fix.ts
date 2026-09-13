// Knowledge-base article draft (Bead securitycorp-source-4zl.57.1.4,
// "Writing Security Findings That Developers Can Fix"). Status is
// intentionally "drafting" — see docs/publication-safety-policy.md. This
// file is registered in lib/knowledge-content.ts as a drafting-status entry;
// it becomes part of the published catalog only after human privacy/
// technical/publication review, per docs/knowledge-base.md. This article
// reuses the fictional client established in
// lib/articles/scoping-authorized-security-assessment.ts ("Meridian Freight
// Co.", its fictional shipment-tracking application, and its fictional
// compliance-deadline-driven assessment) for continuity across this
// category's series, and describes only a fictional, non-destructive,
// conceptual finding (a broken object-level authorization / CWE-639-class
// issue) at the level of what makes a *write-up* reproducible and
// actionable — not a runnable exploit. No real target, credential, working
// exploit, or destructive/attack-recipe instruction appears anywhere in
// this file. This article is about reporting practice: how a finding from
// an already-authorized engagement or isolated lab gets communicated so a
// developer can actually fix it — never about how to find or exploit a
// vulnerability. See the "no exploitation content" confirmation in the
// orchestrating session's final task report.
//
// Differentiation from the rest of this category's series: "How to Scope
// an Authorized Security Assessment" covers pre-engagement authorization,
// and "Rules of Engagement for an Isolated Lab" covers the lab isolation
// and authorization baseline. This article picks up after testing has
// already happened, inside whatever scope those two establish, and covers
// only the reporting/communication step: turning an observed condition into
// a finding a developer can reproduce, understand the impact of, and fix.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1789252197203-nsrvl3, template "research", task
// describing this article's exact research needs: writing reproducible,
// actionable findings — CVSS/severity communication, reproducibility,
// remediation-guidance quality, CWE/OWASP/NIST-grounded). A bounded
// workflow_status check afterward showed the same documented issue recorded
// in CLAUDE.md ("Current Ruflo executor limitation"): the workflow stayed at
// 0% progress with a single pending "Execute" step and returned no
// retrievable research output. This draft was therefore produced with the
// disclosed native fallback instead — research, drafting, technical
// verification, and publication-safety review as separate native passes —
// not credited to Ruflo. Every citation below was independently fetched and
// verified against its live primary source rather than recalled from
// memory: NIST SP 800-115's abstract and scope; FIRST.org's CVSS
// specification document, whose own text states that "[c]onsumers may use
// CVSS information as input to an organizational vulnerability management
// process that also considers factors that are not part of CVSS ... [such]
// factors are outside the scope of CVSS"; OWASP's Web Security Testing
// Guide v4.2 Reporting chapter, whose text states findings need "a detailed
// description of what the vulnerability is, how to exploit it, and the
// damage that may result from its exploitation," a stated risk rating, and
// remediation steps, and that descriptions must "provide enough information
// for the engineer reading this report to take action based on it"; and
// MITRE's Common Weakness Enumeration (CWE) top-level page, whose own text
// frames CWE's purpose as letting "software developers, hardware designers,
// and security architects ... eliminate [weaknesses] before deployment."
//
// Controlled tags: the bead's suggested "security-findings" and
// "remediation" are not canonical ids in lib/knowledge-tags.ts. The closest
// real matches are "authorized-offensive-testing" (the practice this
// article's findings come from) and "vulnerability-management" (whose own
// description in that file — "risk prioritization, remediation workflows,
// exception review, and validation" — is the closest canonical match to
// "remediation"). The bead's third suggestion, "developer-experience", is
// also not canonical; "application-security" is used instead as the closest
// real match, since this article's findings are aimed at developers fixing
// application-level issues. All three are used here.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "A security finding that nobody can reproduce, understand the impact of, or act on is not a deliverable — it is a line item that will sit open until an audit forces someone to close it without actually fixing anything. Writing a finding a developer can fix is a distinct skill from finding the underlying issue in the first place, and it is graded on a different standard: not 'is this technically true' but 'can the person who receives this take the next concrete step without asking the tester what they meant.'",
    "This guide covers that reporting step only, using a fictional worked example from Meridian Freight Co.'s shipment-tracking assessment (the same fictional client and application introduced in this site's 'How to Scope an Authorized Security Assessment'). It assumes the finding already came from testing that was authorized under a signed scope and rules of engagement, as covered by that article and by 'Rules of Engagement for an Isolated Lab' — this guide is entirely about what happens after a tester observes something, never about how to find or exploit a vulnerability. Every system, identity, and finding described here is fictional.",
  ],
  whatYouWillLearn: [
    "What a finding needs to contain to be reproducible: preconditions, the action taken within the agreed scope, and the observed result — stated specifically enough that someone with the same authorized access could confirm it independently.",
    "How to state technical and business impact concretely, and how to avoid both vague findings ('a vulnerability was found') and alarmist ones (impact language the evidence doesn't actually support).",
    "How to communicate severity as more than a bare score — what CVSS is actually scoped to measure, and why a plain-language justification has to travel with the number.",
    "How to write a remediation recommendation specific enough to close the gap, and how to define what a later retest needs to confirm before the finding is considered resolved.",
    "Why everything in a finding still has to stay inside the engagement's authorized scope and data-handling rules — a good write-up doesn't override a boundary the scoping and rules-of-engagement work already set.",
  ],
  intendedAudience: [
    "Authorized security testers and assessors writing up results from an engagement or isolated lab exercise.",
    "Developers, application-security engineers, and engineering leads who receive findings and need to know what a complete one looks like before accepting an incomplete one.",
    "Program owners defining what a finding template should require before an assessment starts.",
  ],
  prerequisites: [
    "A finding that already came from testing authorized under a signed scope and rules-of-engagement document — see 'How to Scope an Authorized Security Assessment' and 'Rules of Engagement for an Isolated Lab' if that groundwork isn't in place yet.",
    "An agreed severity/risk-rating scale for the engagement (CVSS or an equivalent scale the recipient organization already uses), settled before reporting begins rather than improvised per finding.",
    "No offensive-security technique knowledge is assumed; this guide is about communicating a result, not producing one.",
  ],
  problem: [
    "The most common failure in a security report isn't a wrong finding — it's a correct finding nobody can act on. A raw scanner export pasted into a report, a one-line description ('SQL injection possible'), or a severity score with no explanation of what it's actually based on all share the same defect: they tell a developer that something is wrong without telling them what to check, what it affects, or what to change. That gap gets filled with guessing, and a guessed fix is often a wrong fix.",
    "The opposite failure is just as common and less often named: alarmist language that overstates confirmed impact ('this allows complete system compromise' when only a single, narrow condition was actually observed) trains recipients to discount the next report, including the one that really is severe. Both failures — too vague to act on, and too inflated to trust — come from the same root cause: writing the finding as a record of what the tester noticed, instead of as an instruction the recipient can execute.",
  ],
  threatModel: [
    "The risk this guide addresses isn't a technical vulnerability class — it's the risk that a real, confirmed finding never gets fixed because the write-up failed to make it actionable. That failure has a longer tail than it looks: a finding that sits unfixed because nobody could reproduce it, or because its remediation section said 'follow security best practices,' represents exactly the same residual risk to the organization as a finding that was never reported at all, at a fraction of the discoverability — the organization believes the issue is tracked and will eventually close, when in practice nothing is moving.",
    "Each piece of this guide maps to a specific way that failure happens: missing or vague reproduction steps prevent independent confirmation; a bare severity score with no plain-language impact prevents correct prioritization against everything else competing for the same engineering time; and a generic remediation recommendation gives the recipient nothing concrete to implement or verify. Writing a fixable finding means closing all three gaps in the same document, not just the one that happens to be easiest to write.",
  ],
  mainContent: [
    "**What a fixable finding actually contains.** A finding a developer can act on has five parts, and all five have to be present: a title naming the weakness class (not the symptom); reproduction steps specific enough for someone with the same authorized access to confirm it independently; technical and business impact stated concretely and separately; severity presented as a score plus a plain-language justification; and a remediation recommendation that names the specific fix. Dropping any one of these doesn't make the finding shorter — it makes it a different, less useful kind of document: an observation instead of an instruction.",
    "**A worked example, badly written.** Suppose testing under Meridian Freight Co.'s signed scope (the shipment-tracking application at ship.meridianfreight.example, per the scope document described in 'How to Scope an Authorized Security Assessment') turns up a case where one authorized test account can view another test account's shipment records. Written the way findings too often are, it reads: 'Title: Authorization Issue Found. Severity: High. Description: The application has an authorization vulnerability that could allow access to data it shouldn't. Recommendation: Fix authorization.' Every sentence here is defensible and none of it is usable — there's no way to reproduce the condition, no stated mechanism, no specific data affected, and 'fix authorization' names no action a developer could actually take.",
    "**The same finding, rewritten to be fixable.** Title: 'Shipment-detail endpoint does not verify the requesting account owns the requested shipment record (CWE-639, Authorization Bypass Through User-Controlled Key).' Reproduction: authenticate to the application as one authorized test account created for this engagement; request the shipment-detail view for a shipment ID belonging to a different test account also created for this engagement; the application returns that second account's shipment detail instead of rejecting the request. Impact — technical: an authenticated account can read another account's shipment records (recipient name, address, and package-contents description, in this fictional scenario) by changing an identifier, with no additional authentication step; impact — business: for a customer-facing logistics application ahead of a compliance deadline, this is exactly the kind of cross-customer data exposure a compliance review is meant to catch, and it would likely trigger the organization's own breach-notification analysis if it occurred against real customer data. Severity: illustrative CVSS v3.1 base metrics reflecting network-reachable access, low attack complexity, low privileges required, no user interaction, and high confidentiality impact with no integrity or availability impact — stated here as an illustrative characterization for this fictional example, not a verified score computed against a real target. Remediation: add a server-side check on the shipment-detail endpoint that confirms the requesting account owns the shipment record before returning it, rather than relying on the identifier being hard to guess; add an automated test asserting that request is rejected for a non-owning account. The difference between the two versions isn't length — it's that the second one gives a developer somewhere concrete to start and a defender something specific to verify.",
    "**Severity is a score plus a reason, not just a score.** CVSS is a widely used way to standardize severity communication, but its own specification is explicit that a base score alone is not a remediation decision: FIRST's CVSS specification document states that consumers should treat CVSS information as one input to \"an organizational vulnerability management process that also considers factors that are not part of CVSS\" — such as regulatory exposure, number of affected customers, or reputational impact — because those factors \"are outside the scope of CVSS.\" A finding that reports 'CVSS 7.4' with no accompanying sentence explaining what that means for this specific system and this specific organization is asking the recipient to do the prioritization work the tester was better positioned to do.",
    "**Avoiding both vagueness and alarmism.** A vague finding forces the recipient to reconstruct what actually happened before they can even start fixing it. An alarmist finding claims more than the evidence supports — describing a confirmed, narrow read-access issue as 'complete system compromise' when no further exploitation was attempted or observed. Both failures trace back to the same discipline this site applies to every other kind of claim: separate what was directly observed from what is inferred, and say which is which. OWASP's Web Security Testing Guide states the same standard for a finding write-up directly — descriptions must \"provide enough information for the engineer reading this report to take action based on it,\" no more and no less than that.",
    "**Remediation guidance has to name a fix, not a philosophy.** 'Improve input validation' or 'follow security best practices' describes a category of solutions, not one a developer can implement and check off. A remediation recommendation should name the specific control, configuration change, or code change that closes the observed gap, and — where a CWE mapping fits the finding — point to the weakness class the fix addresses so the same defect elsewhere in the codebase is easier to recognize. MITRE frames CWE's entire purpose around this: identifying weakness classes early enough that \"software developers, hardware designers, and security architects can eliminate them before deployment, when it is much easier and cheaper to do so\" — a mapped finding gives a team a category to search their own codebase against, not just one instance to patch.",
    "**A finding stays inside the engagement's authorized scope, not just its own paragraph.** Nothing in how a finding is written can retroactively authorize activity the engagement's scope and rules of engagement didn't already cover — if a reproduction step describes touching something outside the agreed scope, that's a scope violation to escalate through the process 'How to Scope an Authorized Security Assessment' and 'Rules of Engagement for an Isolated Lab' both describe, not a result to include in the report. The same data-handling discipline that guide applies to lab artifacts applies to the finding write-up itself: no real secrets, no identifying detail beyond what the engagement's own client and reviewers are authorized to see, even when the underlying condition is real and confirmed.",
  ],
  validationEvidence: [
    "This guide describes a reporting method illustrated with a fictional finding against a fictional application; it does not reproduce a specific real assessment, a specific real vulnerability, or a computed CVSS score against a live target. Its evidence state is UNVERIFIED — the finding structure and worked example here are a starting point to adapt to a real engagement's own reporting requirements and severity scale, not a validated template to use unmodified.",
  ],
  limitations: [
    "This guide covers writing an individual finding — it does not cover assembling a full assessment report (executive summary, methodology section, appendices), which has its own structure and audience considerations beyond what's covered here.",
    "It covers CVSS as the most widely used severity-communication standard, not every risk-rating scheme an organization might already use; the same completeness principles (a score plus a plain-language justification) apply regardless of which scale is chosen.",
    "It does not cover the legal or contractual requirements a real report may need to satisfy (retention periods, disclosure timelines, specific client-mandated formats), which vary by engagement and jurisdiction and should be confirmed against the engagement's own contract, not this guide.",
  ],
  defensiveRecommendations: [
    "Require every finding to name a specific weakness class, with a CWE reference where one fits, rather than accepting a generic descriptor like 'vulnerability found.'",
    "Require reproduction steps specific enough that someone with the same authorized access could confirm the finding independently, without relying on the original tester's memory of what they did.",
    "Require severity to be reported as a score plus a plain-language justification tied to actual observed impact — reject a bare number and reject unverified superlative language alike.",
    "Require a remediation recommendation that names a specific action, and a stated validation/retest step that confirms the fix actually holds before the finding is closed.",
    "Agree on the severity scale and the finding template before testing starts, not while the report is being assembled under deadline pressure.",
    "Treat every finding write-up as subject to the same data-handling and sanitization rules as any other artifact leaving the engagement, regardless of how confirmed or severe the underlying issue is.",
  ],
  keyTakeaways: [
    "A fixable finding has five parts — a named weakness class, specific reproduction steps, concrete technical and business impact, severity as a score plus a reason, and a specific remediation recommendation — and dropping any one turns it into an observation instead of an instruction.",
    "CVSS measures a base severity, not an organization's remediation priority; FIRST's own specification says environmental and business factors sit outside CVSS's scope and have to be added by the reader, not skipped.",
    "Avoid both vagueness (forcing the recipient to reconstruct what happened) and alarmism (claiming more impact than the evidence supports) — separate what was observed from what is inferred, and say which is which.",
    "A finding write-up never gets to exceed what the engagement's signed scope and rules of engagement actually authorized, and is subject to the same data-handling and sanitization rules as any other artifact leaving the engagement.",
  ],
  references: [
    "NIST SP 800-115, Technical Guide to Information Security Testing and Assessment: https://csrc.nist.gov/pubs/sp/800/115/final",
    "FIRST.org, Common Vulnerability Scoring System (CVSS) Specification Document: https://www.first.org/cvss/specification-document",
    "OWASP Web Security Testing Guide v4.2, Reporting: https://owasp.org/www-project-web-security-testing-guide/v42/5-Reporting/README",
    "MITRE, Common Weakness Enumeration (CWE): https://cwe.mitre.org/",
  ],
  relatedSlugs: ["scoping-authorized-security-assessment", "rules-of-engagement-for-an-isolated-lab"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "The finding's source engagement or lab exercise has a signed scope and rules-of-engagement document already in place — see 'How to Scope an Authorized Security Assessment' and 'Rules of Engagement for an Isolated Lab' — since a finding can only describe what that document actually authorized testing to touch.",
    "An agreed severity/risk-rating scale for the engagement, established before reporting begins — CVSS or an equivalent scale the recipient organization already uses — so scores are comparable across findings in the same report.",
    "A named recipient for each finding who owns remediation, agreed before the report is delivered — a finding with no owner rarely gets fixed regardless of how well it's written.",
    "A secure, access-controlled place to store the report and any supporting evidence, consistent with the engagement's own data-handling rules.",
  ],
  procedure: [
    "Name the finding after the weakness class, not the symptom — reference the closest CWE identifier where one genuinely fits, so the recipient can find established remediation guidance for that class rather than treating the finding as a one-off.",
    "Write reproduction steps as precondition, action, and observed result: what access or state is required to reach the condition, what was actually done within the agreed rules of engagement, and what the application or system did in response — enough for someone with the same authorized access to confirm it themselves, without exploit code or destructive detail beyond what's needed to demonstrate the finding.",
    "State technical impact and business impact separately and concretely: what specific data, action, or asset is affected technically, and — in plain language a non-specialist stakeholder can use — what that means for the organization if left unaddressed. Avoid unverified superlatives the evidence doesn't actually support.",
    "Assign severity using the engagement's agreed scale and explain the reasoning in plain language rather than reporting a bare score — CVSS's own specification is explicit that consumers should layer organization-specific and environmental factors on top of a base score before using it to drive a remediation decision.",
    "Write a remediation recommendation that names the specific fix — the control, configuration change, or code change that closes the gap — rather than a generic instruction, and note the broader weakness class from the CWE mapping so the same defect elsewhere is easier to recognize.",
    "Record how the finding will be validated once remediation is claimed complete: what a retest needs to confirm before the finding is considered closed, not just that a ticket status changed.",
    "Route the finished finding through the same sanitization review as any other artifact leaving the engagement — no real secrets, no identifying detail beyond what the engagement's own client and reviewers are authorized to see.",
  ],
  validation: [
    "Confirm every finding names a specific weakness class, with a CWE reference where one fits, rather than only a generic descriptor like 'vulnerability found.'",
    "Confirm reproduction steps are specific enough that someone with the same authorized access could confirm the finding independently, without depending on the original tester's memory of what they did.",
    "Confirm severity is presented as both a score and a plain-language justification tied to actual, observed impact — not a bare number and not an unverified superlative.",
    "Confirm the remediation recommendation names a specific action, and that a validation/retest step is defined for confirming the fix later.",
    "Confirm the finding stays within what the engagement's scope and rules of engagement actually authorized — a finding describing activity outside that scope is a scope violation to escalate, not a result to include in the report.",
  ],
  rollback: [
    "If a finding turns out to be a false positive after the report is delivered, issue a dated correction to the recipient rather than silently editing the original report — the corrected version and the reason for the correction should both stay retrievable later.",
    "If new information changes a finding's assessed severity or impact after delivery, issue a dated revision note rather than treating the original severity as permanent once assigned.",
    "If a reproduction step or piece of evidence is later found to expose more detail than the engagement's data-handling rules allow (a real-looking secret, an unredacted identifier), correct and reissue that section immediately and treat the original as internal-source per the publication-safety policy until it is.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Writing Security Findings That Developers Can Fix",
    slug: "writing-security-findings-developers-can-fix",
    summary:
      "How to turn a confirmed security observation into a finding a developer can actually act on: reproducible steps, concrete technical and business impact, severity communicated as more than a bare score, and a remediation recommendation specific enough to close the gap — illustrated with a fictional worked example and bounded throughout by authorized-engagement and isolated-lab scope.",
    pillar: "test-validate",
    primaryCategory: "offensive-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["authorized-offensive-testing", "vulnerability-management", "application-security"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 13,
    labRequired: false,
    authorizedLabOnly: true,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "pending" },
    technicalReview: { status: "pending" },
    publicationApproval: { status: "pending" },
  },
  sections,
  module: module_,
};
