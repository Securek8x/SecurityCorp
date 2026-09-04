// Knowledge-base article draft (Bead securitycorp-source-4zl.57.1.1).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This article is registered in lib/knowledge-content.ts as a drafting-status
// entry per that Bead's explicit instructions; it becomes eligible for
// "published" status only after the orchestrating session runs the full
// mandatory-gate review (editorial, technical, security/privacy, visual,
// repository QA, metadata) and records a named human approval, per
// docs/publication-safety-policy.md. Every example in this file describes a
// fully fictional client organization ("Meridian Freight Co."), fictional
// scope document, and fictional systems using documentation-safe addresses
// (RFC 5737 ranges, .example domains). No real company, host, credential, or
// vulnerability-exploitation detail appears anywhere in this file. This
// article is deliberately about the authorization/scoping/communication
// process, not about how to execute any attack technique — see the "no
// exploitation content" confirmation in the final task report.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting (workflow
// id workflow-1788532617671-xhqo8u, template "custom", task: editorial
// research/outline support for this article). No verified Ruflo research/
// editorial workflow template was registered (workflow_template list
// returned zero templates), so the closest available action — invoking
// workflow_run directly with the editorial objective, audience, and scope —
// was used. A bounded workflow_status check showed the workflow at 0%
// progress with its single "Execute" step still "pending," reproducing this
// project's documented Ruflo executor limitation (see CLAUDE.md). No
// retrievable editorial output was returned, so per the disclosed native
// fallback for non-public editorial work, this draft was researched, written,
// technically verified, and safety-reviewed natively instead — never
// represented as Ruflo output. Citations below were independently verified
// against their live sources (NIST SP 800-115, the CISA penetration-testing
// service page, and the PTES pre-engagement-interactions page) rather than
// invented.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { GuideModule } from "../knowledge-content-types.ts";

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A documented mandate to define scope on the organization's behalf — someone with the authority to say what may and may not be tested, not just an interested stakeholder.",
    "An asset inventory covering every reasonable candidate for the assessment (applications, network ranges, cloud accounts, third-party integrations) — you cannot scope a system nobody wrote down.",
    "An executive sponsor able to sign the written authorization before any technical work starts.",
    "Agreement, before scoping begins, on whether the assessment will be announced to the defending team (detection-and-response validation) or unannounced (control-effectiveness validation) — this single decision reshapes what belongs in the rules of engagement.",
    "A named emergency point of contact reachable for the full duration of the agreed testing window.",
  ],
  procedure: [
    "Inventory candidate scope first, independent of what the tester or client assumes is included. List every system, application, IP range, and third-party integration that could plausibly be touched by testing activity, then classify each as in-scope, out-of-scope, or needs-a-decision.",
    "Write the scope boundary explicitly: named systems or applications, specific IP ranges or domains, and a defined start and end date/time for active testing. NIST SP 800-115 treats this planning step — establishing scope, objectives, and rules of engagement before any technical activity — as the foundation the rest of the assessment depends on.",
    "Write the out-of-scope list with equal explicitness, not as a residual 'everything else.' Call out systems that look adjacent to the assessment but are not authorized: a payment processor's own infrastructure, a third-party SaaS admin console, employee personal devices, or any system the client does not have the authority to authorize testing against.",
    "Draft the rules of engagement as a document separate from the scope list. Following PTES's pre-engagement framework, cover: which techniques are permitted (for example, non-destructive vulnerability scanning and manual exploitation limited to proof of access), which techniques are prohibited unless separately authorized in writing (destructive testing, denial-of-service testing, social engineering or phishing against employees, physical intrusion), the emergency contact list (technical and business contacts, each reachable through at least two channels), and the exact procedure for what a tester does on finding something outside the agreed scope — stop, do not exploit further, record the minimum needed to describe it, and notify the named contact within an agreed response time.",
    "Confirm third-party authorization separately from the client's own sign-off. If any in-scope system is hosted, operated, or protected by a party other than the client (a cloud provider, an ISP, a managed security service provider), obtain that party's own permission before testing touches it — the client's authorization does not extend to infrastructure it does not own or control.",
    "Produce the written authorization itself: a signed statement of work plus a short 'permission to test' document naming the authorizing signer, the exact scope, the exact dates, and the exact techniques covered. Testing does not begin until this document is signed and in the possession of the assessment team.",
    "Decide and record, as part of scoping, whether the security operations team will be told the engagement is happening (an announced test, which validates detection and response) or kept unaware (an unannounced test, which validates whether controls hold without advance warning) — and make sure the rules of engagement state which one this is, since it changes what a defender should expect to see and how they should act on it.",
  ],
  validation: [
    "Confirm every in-scope item in the final document maps to something in the original asset inventory — an item that appears in scope without a matching inventory entry is a sign the inventory was incomplete, not that the scope is wrong.",
    "Confirm the out-of-scope list explicitly names third-party-owned or otherwise unauthorized-adjacent systems, not just 'everything not listed above.'",
    "Confirm the rules of engagement name specific prohibited techniques (not a vague 'nothing harmful') and specific emergency contacts with working, tested contact methods.",
    "Confirm the written authorization is signed by someone with the actual authority to authorize testing of every listed system — a project sponsor's signature does not cover a system owned by a separate business unit or a third-party provider.",
    "Confirm the announced-versus-unannounced decision is recorded in writing and that whoever needs to act on it (the security operations team, if announced) actually has it before the testing window opens.",
    "Where any of the above cannot be confirmed before the agreed start date, treat the finding as blocking and delay the start — not as an acceptable gap to close during testing.",
  ],
  rollback: [
    "If testing activity reveals a system that should have been in scope but was not listed, stop testing that system immediately and route the addition through a documented scope-change process with a new signature — do not treat 'it's obviously related' as authorization.",
    "If a tester encounters a finding or a system that falls outside the agreed scope, the correct response is always to stop, document the minimum necessary detail, and escalate to the named contact — never to continue testing it 'just to confirm the risk.'",
    "If the assessment causes unexpected impact (a service disruption, an unstable system), the rules of engagement's emergency-contact procedure takes over immediately: notify the named contacts, pause testing, and only resume once the client confirms it is safe to continue.",
    "Keep the signed scope document and rules of engagement retrievable for the life of the engagement and after — if a dispute arises about what was or was not authorized, the written record is what resolves it, not memory of the kickoff conversation.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "How to Scope an Authorized Security Assessment",
    slug: "scoping-authorized-security-assessment",
    summary:
      "How to define the scope of an authorized penetration test before any testing begins: what belongs in a written scope document and rules of engagement, why signed written authorization has to exist first, and how scope decisions shape what a defender should expect to see in their own detection systems during the engagement window.",
    pillar: "test-validate",
    primaryCategory: "offensive-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["authorized-offensive-testing", "governance-risk-compliance", "logging-monitoring"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
    publishedAt: "2026-09-04",
    lastReviewedAt: "2026-09-04",
    labRequired: false,
    authorizedLabOnly: true,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
  },
  sections: {
    executiveSummary: [
      "A penetration test or authorized security assessment is only 'authorized' to the extent its scope and rules of engagement are written down and signed before any technical activity starts. Scoping is not an administrative formality that happens after the interesting work is planned — it is the work that makes everything after it legal, safe, and useful. An assessment with a vague or unwritten scope puts the tester at legal risk, the client at operational risk, and produces findings nobody fully trusts because nobody can say for certain what was actually authorized.",
      "This guide walks through scoping an assessment for a fictional client, Meridian Freight Co., using a fictional scope document and rules-of-engagement checklist: what goes in scope, what stays explicitly out of scope, what the rules of engagement need to cover, why the written 'permission to test' authorization has to exist before testing begins, and how the scoping decisions a client makes — particularly whether the security team is told in advance — determine what a defender should expect to see in their own logs and alerts during the engagement window. Every system, address, and identity in this article is fictional.",
    ],
    whatYouWillLearn: [
      "How to translate an asset inventory into an explicit in-scope and out-of-scope list, including the third-party systems that look adjacent but are not authorized to test.",
      "What a rules-of-engagement document needs to specify: permitted and prohibited techniques, emergency contacts, and the exact procedure for handling an out-of-scope discovery.",
      "Why written, signed authorization has to exist before testing starts, and what that document needs to name.",
      "How the decision to announce (or not announce) an assessment to the defending team changes what that team should expect to see in their detection systems during the engagement.",
    ],
    intendedAudience: [
      "Security practitioners and testers preparing to scope an authorized engagement, whether performed internally or by an external firm.",
      "Defenders and security operations staff who need to know what a scoped, authorized assessment should look like from their side of the fence.",
      "Engineering or business stakeholders responsible for signing off on what a security assessment may and may not touch.",
    ],
    prerequisites: [
      "A rough inventory of the systems, applications, and network ranges that are candidates for the assessment.",
      "Enough organizational authority — or access to someone who has it — to make binding decisions about what may be tested and to sign written authorization.",
      "No prior offensive-security experience is assumed; this guide is about the authorization and planning process, not testing technique.",
    ],
    problem: [
      "It is common for a security assessment to start with a verbal understanding — 'test our external stuff, nothing too disruptive' — rather than a written scope. That gap causes real harm on both sides: a tester who touches a system outside the client's actual authority to authorize (a third-party cloud tenant, a payment processor's own infrastructure) can be committing unauthorized access under laws like the U.S. Computer Fraud and Abuse Act regardless of good intent, and a client who never wrote down what 'nothing too disruptive' meant has no way to hold a tester accountable for a decision that caused an outage.",
      "Scoping failures rarely look dramatic in the moment. They look like a scanner sweeping an IP range nobody meant to include, a tester exploiting a finding on a system that turned out to belong to a different business unit, or a security operations team spending a weekend chasing an incident that was actually the announced assessment nobody told them about. Each of these is a scope or communication failure, not a technical one — and each is fully preventable by the work this guide describes.",
    ],
    threatModel: [
      "The risk this guide addresses is not a technical vulnerability — it is the risk of unauthorized or miscommunicated testing activity. Three failure modes recur: testing a system the client did not actually have authority to authorize (a third-party-owned system, exposing both tester and client to legal and contractual risk); testing beyond the agreed technique boundary (for example, escalating a finding into destructive exploitation when only non-destructive proof of access was authorized); and testing without informing the parties who need to know it is happening (a security operations team that has no way to distinguish the authorized assessment from a real incident, or an executive who did not actually authorize the specific systems being touched).",
      "Each failure mode maps to a specific piece of the scoping process: an explicit out-of-scope list and third-party authorization check for the first, an explicit permitted/prohibited technique list in the rules of engagement for the second, and an explicit announced-versus-unannounced decision communicated to the right people for the third. Scoping is, in effect, threat modeling the assessment itself before it threat-models anything else.",
    ],
    mainContent: [
      "Meridian Freight Co. (fictional throughout) has asked for an assessment of its customer-facing shipment-tracking web application ahead of a compliance deadline. Before any testing technique is discussed, the scoping conversation starts with an inventory: what does Meridian actually operate, and what does it have the authority to authorize testing against?",
      "The resulting scope document lists what is in scope in specific, unambiguous terms: the web application at ship.meridianfreight.example and its supporting API; the externally reachable network range 203.0.113.0/24, which hosts that application's infrastructure; and the corporate VPN gateway at vpn.meridianfreight.example, limited to authentication and session-handling behavior rather than the internal network it grants access to. The document also states an exact testing window — a defined start date/time and end date/time — rather than an open-ended 'sometime this quarter.' NIST SP 800-115 treats this kind of explicit planning (scope, objectives, and rules of engagement fixed before any technical work begins) as the step that everything downstream depends on; a scope that can be renegotiated informally mid-engagement is not really a scope.",
      "The out-of-scope list is written with equal care, because 'adjacent' is not the same as 'authorized.' Meridian's scope document explicitly excludes: the third-party payment gateway at payments.thirdparty.example, even though checkout traffic flows through it, because Meridian does not own or control that infrastructure; Meridian's corporate email and any social-engineering or phishing activity against employees, unless separately authorized in a distinct written addendum; physical access to Meridian's offices; and any system belonging to a business unit that did not sign off on the assessment, even if it happens to share a network range with something that is in scope. A scope document that only lists what's included, and leaves everything else as an implicit 'no,' invites exactly the kind of boundary confusion this list is meant to prevent.",
      "The rules of engagement is a separate document from the scope list, and it answers a different question: not what may be touched, but how. Following the structure PTES's pre-engagement guidance lays out, Meridian's rules of engagement specify permitted techniques (non-destructive vulnerability scanning, and manual exploitation limited to demonstrating access rather than exploring further) and techniques that are prohibited unless separately authorized in writing — denial-of-service testing, any form of social engineering, physical intrusion attempts, and any technique intended to be destructive or to persist access beyond what is needed to demonstrate a finding. It also names two technical contacts and one business contact at Meridian, each reachable through at least two channels for the duration of the testing window, and it states the exact procedure for an out-of-scope discovery: stop testing that system immediately, record only the minimum detail needed to describe the finding, and notify the named contact within one business hour.",
      "None of this activity is authorized to begin until a written, signed document exists — a statement of work plus a short permission-to-test letter naming the authorizing signer, the exact scope, the exact dates, and the exact techniques. This is sometimes called a 'get-out-of-jail-free letter' in industry practice, though that is informal shorthand rather than a term used by NIST or PTES; the underlying requirement it points at is real: without it, a tester who accesses a system without the owner's authorization has no defense against a claim of unauthorized access, however well-intentioned the work was. Meridian's sponsor — someone with the actual authority to authorize testing of every listed system — signs this document before the testing window opens, and both the assessment team and Meridian retain a copy for the life of the engagement.",
      "The last scoping decision is one defenders should care about directly: will Meridian's security operations team be told the assessment is happening? An announced assessment validates whether detection and response actually work — the team should expect to see scanning and exploitation-attempt traffic from the stated source ranges during the stated window, should still triage every resulting alert rather than silently suppressing it, and should have an agreed process for tagging (not deleting) alerts known to correspond to the test. An unannounced assessment validates whether controls hold without advance warning, at the cost of the operations team having no way to distinguish it from a real incident in the moment — which is exactly why the rules of engagement need a clear, rehearsed process for de-escalating once the activity is identified as the authorized test rather than an actual compromise. Either choice is legitimate; what is not legitimate is leaving it undecided, because that ambiguity is what turns an authorized assessment into a false alarm, a missed detection opportunity, or both.",
    ],
    validationEvidence: [
      "This article describes a scoping method and a fictional illustrative engagement; it does not reproduce a specific real assessment, scope document, or client relationship. Its evidence state is UNVERIFIED — the scope document and rules-of-engagement checklist described here are a starting structure to adapt to a real engagement's own legal and organizational requirements, not a validated template to use unmodified.",
    ],
    limitations: [
      "This guide covers the scoping phase only — it does not cover how to conduct testing, how to report findings, or how to validate that a technique stayed within the agreed rules once testing is underway. Each of those is a separate discipline worth its own review.",
      "Legal requirements around authorized testing (what counts as sufficient authorization, what liability protections a permission-to-test document actually provides) vary by jurisdiction and by contract. This article describes the structure of the documentation, not legal advice — an organization scoping a real engagement should have its own legal counsel review the authorization language.",
      "The fictional Meridian Freight engagement is deliberately simple — one application, one network range, one VPN gateway. A real organization's scope is often larger and more fragmented across business units and cloud accounts, which makes the out-of-scope and third-party-authorization steps in this guide more work, not less important.",
    ],
    defensiveRecommendations: [
      "Insist on a written scope document and a separate written rules-of-engagement document before agreeing to any assessment — verbal agreement on 'what's included' is not a scope.",
      "Build and maintain the asset inventory this process depends on before an assessment is requested, not while scoping one under time pressure.",
      "Require signed, written authorization — naming the authorizing signer, exact scope, exact dates, and exact techniques — before any testing activity, and confirm the signer actually has authority over every listed system.",
      "Check third-party ownership explicitly for every in-scope item; obtain that provider's own authorization before testing touches infrastructure the client does not fully own or control.",
      "Decide and document, as part of scoping rather than as an afterthought, whether the assessment will be announced to the security operations team, and make sure that decision reaches the people who need to act on it before the testing window opens.",
      "Keep the signed scope and rules-of-engagement documents retrievable for the life of the engagement — they are what resolves any dispute about what was authorized.",
    ],
    keyTakeaways: [
      "Scope and rules of engagement are two separate written documents: scope defines what may be touched, rules of engagement defines how.",
      "Written, signed authorization — naming the signer, the exact scope, the dates, and the techniques — has to exist before any testing activity begins; it is what turns access into authorized access.",
      "The out-of-scope list, and third-party authorization for anything not fully owned by the client, matter as much as the in-scope list.",
      "Whether an assessment is announced or unannounced to the defending team is a scoping decision with direct consequences for what that team should expect to see, and must be decided and communicated deliberately rather than left implicit.",
    ],
    references: [
      "NIST SP 800-115, Technical Guide to Information Security Testing and Assessment: https://csrc.nist.gov/pubs/sp/800/115/final",
      "CISA, Penetration Testing (service and rules-of-engagement overview): https://www.cisa.gov/resources-tools/services/penetration-testing-0",
      "Penetration Testing Execution Standard (PTES), Pre-Engagement Interactions: https://pentest-standard.readthedocs.io/en/latest/preengagement_interactions.html",
    ],
  },
  module: module_,
};
