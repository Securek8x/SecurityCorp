// Knowledge-base article draft (Bead securitycorp-source-4zl.55.2.1,
// "Cloud IAM Permission Creep"). Status is intentionally "drafting" and
// every review record is intentionally "pending" — see
// docs/publication-safety-policy.md. This agent is not authorized to set
// status to "published" or to mark any review "approved"; those remain
// human decisions. All examples describe a fictional organization
// ("Cedarcroft Systems") and fictional roles/policies; no real cloud
// account, tenant, project ID, role name, credential, or infrastructure
// detail appears anywhere in this file. The article describes the generic,
// publicly documented mechanism of cloud IAM access-analysis tooling
// (comparing a role's granted permissions against what it has actually
// exercised over a lookback window) without naming or referencing any one
// specific vendor product or real deployment, consistent with this
// article's vendorNeutral: true metadata.
//
// Differentiation from the other identity-focused articles already in this
// catalog: lib/articles/least-privilege-for-pipeline-identities.ts is about
// scoping a CI/CD pipeline identity's privilege deliberately at grant
// time — inventorying what a specific identity needs and narrowing its
// permissions and federation trust condition before or shortly after it is
// created. This article is a different failure mode: DRIFT over time, in
// any cloud IAM context (not limited to pipeline identities) — why
// permissions accumulate on a role even when every individual grant seemed
// reasonable in isolation, why that accumulation is structurally hard to
// detect from a point-in-time permission snapshot, and how to review and
// de-provision on an ongoing basis rather than only at creation. As of
// drafting, lib/knowledge-content.ts does not yet register an article at
// slug "workload-identities-vs-long-lived-credentials"; this file makes no
// reference to it and no relatedSlugs entry assumes it exists.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788514624434-1c0ujr, task-based custom workflow —
// no verified research/editorial template was registered via
// mcp__ruflo__workflow_template list, so the task description itself
// carried the research objective, audience, and scope). A bounded
// mcp__ruflo__workflow_status check afterward reproduced the documented
// issue in CLAUDE.md: 0% progress, a single pending "Execute" stage, no
// retrievable editorial output. This draft was therefore produced with the
// disclosed native fallback instead — separate research, drafting,
// technical-verification, publication-safety, and final-editorial passes —
// not credited to Ruflo. Every citation below was independently verified
// via WebSearch against its primary source (NIST, CISA/NSA, and CIS) before
// inclusion; none were invented. See the calling agent's final report for
// full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "Cloud IAM permission creep is the gradual accumulation of standing privilege on a role or identity, produced not by a single bad decision but by a series of individually reasonable ones: a broad managed policy attached 'temporarily' to unblock a launch and never removed; a wildcard resource or action added during an incident to stop the bleeding and never narrowed afterward; a new role's permissions copied wholesale from an existing, already over-privileged role because that was faster than scoping from scratch; and, underneath all of it, no one who owns checking any of this on a recurring basis. Each grant, considered alone at the moment it was made, looks defensible. The role that results a year later usually does not.",
    "This guide explains why permission creep is specifically hard to catch — an unused permission and a permission that is used once a quarter look identical in a point-in-time snapshot of what a role is granted — and lays out concrete, evidence-driven mitigations: reviewing granted-versus-exercised permissions using access-analyzer or last-used data over a deliberately chosen lookback window, replacing standing elevated grants with time-bound access issued only when needed, reviewing new grants at request time with policy-as-code rather than after the fact, and running scheduled de-provisioning with a named owner instead of leaving review to whoever eventually notices. Every example organization, role, and policy in this guide is fictional; no real cloud account, tenant, or production configuration is described.",
  ],
  whatYouWillLearn: [
    "The four common mechanisms by which cloud IAM roles accumulate privilege over time, even when no single grant was obviously wrong.",
    "Why permission creep resists detection from a single point-in-time permission review, and what evidence is actually needed to tell an unused permission apart from a rarely-but-legitimately-used one.",
    "How access-analyzer and last-used-data-driven review works generically across cloud platforms, and the lookback-window tradeoff that determines whether it catches real creep or produces false positives against infrequent legitimate use.",
    "Why time-bound, just-in-time elevated access is a structurally different (and complementary) control from narrowing a standing grant, and where NIST's account-management guidance treats it as its own control enhancement.",
    "How to review a new grant's justification and scope at request time using policy-as-code, so a 'temporary' exception is temporary in the system that tracks it, not only in the requester's intent.",
    "How to run scheduled de-provisioning with clear ownership, so an unreviewed role is treated as a finding rather than silently re-approved by default.",
  ],
  intendedAudience: [
    "Platform engineers who provision and maintain cloud IAM roles, policies, and service accounts and want a defensible way to keep them from drifting wider over time.",
    "Security engineers responsible for periodic access review who need a concrete method for distinguishing genuine excess privilege from infrequent legitimate use.",
    "Technical leads deciding how to structure incident-response permission grants, role-creation workflows, and access-review cadence so today's convenient shortcut doesn't become next year's unexamined standing risk.",
  ],
  prerequisites: [
    "Basic familiarity with cloud IAM concepts — roles, policies, managed or attached permission sets, and the general idea that an identity's actual privilege is whatever its current policy grants, not what it was originally intended to have.",
    "No specific cloud-platform expertise is assumed; this guide describes the pattern and the generic access-analysis mechanism at a level that applies across major cloud providers, and uses a fictional example throughout.",
    "Awareness that 'a role works' and 'a role is scoped to what it needs' are different claims is useful background — this guide treats that distinction as central, not incidental.",
  ],
  problem: [
    "Cloud IAM roles tend to accumulate privilege, not shed it, because every mechanism that adds privilege is easy and every mechanism that removes it requires someone to notice, decide, and act. A role gets a broad managed policy attached because scoping a custom one felt like unnecessary friction under deadline pressure, or because 'this will cover whatever we need later' seemed like reasonable foresight at the time. An incident response adds a wildcard action or resource to a role to stop an active problem quickly, and once the incident is resolved, narrowing that grant back down competes for attention against the next thing on fire — and usually loses. A new team spinning up a new service copies an existing role's policy because it is known to work, inheriting whatever excess that role had already accumulated rather than scoping the new role from its own actual requirements.",
    "None of these individual decisions is obviously wrong in the moment. A broad managed policy unblocks a launch; a wildcard grant stops an incident; copying a working role saves real time under real pressure. The problem is that each of these is a one-way ratchet: the decision to add privilege is made deliberately, under time pressure, by someone motivated to act, while the decision to remove it later has no equivalent moment of pressure forcing it to happen. Without a defined owner and a recurring cadence for reviewing standing privilege, the ratchet only turns one direction, and every role's actual privilege trends toward the union of everything it was ever temporarily granted, rather than the current sum of what it actually needs.",
  ],
  threatModel: [
    "Assets: every resource and action a cloud IAM role's current policy grants — not what the role was originally scoped to do, and not what its jobs actually exercise, but the full extent of what the policy as written currently permits.",
    "The central trust decision: an identity is trusted with whatever its attached policies currently grant, for as long as those policies remain attached, regardless of whether the reason the grant was added still applies. Nothing in a typical cloud IAM system automatically expires a standing grant just because the incident that justified it has been resolved for months, or because the launch it unblocked shipped a year ago.",
    "Consider a fictional platform team at Cedarcroft Systems maintaining a deployment role used by an internal release-automation service. The role started narrowly scoped to the one storage resource its deployments needed to write to. Over eighteen months: a broad, account-wide managed policy was attached during a rushed migration 'to save time getting everything working' and never revisited once the migration finished; a wildcard action was added to the role during an unrelated incident to let an on-call engineer clear a stuck resource quickly, and the specific narrow permission that would have sufficed was never substituted back in afterward; and two newer roles for adjacent services were created by copying this role's policy wholesale, because it was known to work, inheriting all of the above along with the new role's own legitimate needs.",
    "Representative consequences, not a specific incident: a credential or session belonging to any of the three roles above now carries privilege far beyond what its actual job requires, so a compromise, a misconfigured automation, or a mistakenly triggered job has a blast radius shaped by everything the role has ever been granted — not by what it does day to day. Because the excess accumulated gradually across many individually defensible decisions, no single review moment ever saw the full picture at once, and no single person felt individually responsible for catching it.",
    "This guide's scenarios are about how standing privilege quietly grows past a role's actual need over time, not about an adversary directly attacking the IAM system itself. Out of scope: the CI/CD-pipeline-identity grant-time scoping problem covered by the sibling article 'Least Privilege for Pipeline Identities,' and the internal mechanics of any specific cloud provider's policy language or access-analysis product. Cedarcroft Systems is illustrative throughout, not a reference architecture.",
  ],
  mainContent: [
    "**Name the four accumulation mechanisms explicitly, because each needs a different fix.** A 'temporary' broad managed policy that was never removed needs an expiry mechanism, not just good intentions. An incident-driven wildcard grant needs a mandatory post-incident narrowing step, not an assumption that someone will eventually get to it. A role copied from an existing over-privileged one needs to be scoped from its own actual requirements, not inherited wholesale. And the absence of an owner for periodic review needs an assigned owner and a recurring cadence, not a hope that someone will notice. Treating 'permission creep' as one undifferentiated problem tends to produce one generic mitigation ('review roles sometimes') that doesn't actually close any of the four specific gaps that produced it.",
    "**Understand why a point-in-time permission snapshot cannot distinguish unused privilege from rarely-but-legitimately-used privilege.** A role's policy, inspected on any single day, shows only what is currently granted — not how often, or how recently, each granted permission has actually been exercised. A permission nobody has used in ninety days and a permission a quarterly reconciliation job uses exactly once every ninety days can be indistinguishable in that snapshot, even though removing the first is a safe reduction and removing the second breaks a legitimate, infrequent process. This is the structural reason permission creep is hard to detect: the review has to observe usage over time, not inspect a policy document once, and the lookback window used for that observation has to be long enough to cover the least-frequent legitimate use the role actually has — an annual audit script, a disaster-recovery break-glass procedure, a seasonal batch job — or the review will misclassify legitimate infrequent use as safe-to-remove excess.",
    "**Use access-analyzer or last-used-data-driven review as the evidence source, not a description of what the role was intended to do.** Every major cloud platform offers some form of access-analysis, policy-simulation, or last-accessed reporting that compares an identity's granted permissions against what it has actually exercised over a period of observed activity. This is publicly documented, generic functionality across providers, not a specific product this guide endorses — the mechanism matters more than which platform's implementation is used. The output is a concrete, evidence-based gap: permissions granted but never exercised across the observed window. That gap is the defensible starting point for narrowing a policy; a description of what the role's owner remembers it being 'supposed to do' is not, because that description is exactly the kind of assumption that let the excess accumulate unnoticed in the first place.",
    "**Choose the lookback window deliberately, and document the choice.** A window too short (say, seven days) will flag a role's legitimate monthly or quarterly permissions as unused, producing false positives that erode trust in the review process and encourage exceptions. A window too long delays catching real excess and makes the review less actionable. Set the window to match the least-frequent legitimate activity the role is actually expected to perform, confirmed by asking the role's owner what infrequent jobs it serves before removing anything the analysis flags — not by guessing, and not by defaulting to whatever window the tooling ships with.",
    "**Replace standing elevated grants with time-bound, just-in-time access wherever the operation is genuinely occasional.** A permission that is needed for a specific task and not for ongoing daily operation — an incident-response wildcard action, an emergency administrative capability, a one-time migration permission — is a poor candidate for a standing grant regardless of how carefully it is scoped, because a correctly scoped standing grant is still standing: available to be misused or compromised at any time, not only when the task it was meant for is actually happening. NIST SP 800-53's account-management control family treats this as its own distinct mechanism — automated temporary and emergency account management — separate from simply narrowing what a standing account is permitted to do. Time-bound access and narrow permission scope are complementary controls, not substitutes for each other: a standing grant that is narrowly scoped is still standing, and a broad grant that expires automatically is still broad while it is active.",
    "**Review new grants at request time with policy-as-code, not only after the fact.** If a new or expanded grant is defined in version-controlled infrastructure-as-code, require an explicit justification and, for anything intended as temporary, an explicit expiry or a scheduled follow-up review as part of the change itself — enforced by an automated policy check in the review pipeline, not left to a reviewer's memory of what was verbally promised. A grant that is 'temporary' only in a chat message or a verbal agreement has no mechanism forcing it to actually be removed later; a grant that is temporary in a tracked, reviewable system has a concrete artifact someone can act on when the expiry arrives.",
    "**Run scheduled de-provisioning with a named owner, and treat silence as a finding rather than an approval.** A periodic review cadence only works if a specific person or team is accountable for each role's continued justification, and if an unanswered review request is escalated rather than defaulting to 'no response means it's still needed.' Silent re-approval by default is how permission creep survives review cycles that technically occurred: the review happened, produced no action, and the same excess privilege carried forward unchanged. NIST SP 800-53's AC-2 account-management control and CIS Critical Security Control 5 (Account Management) both frame this as reviewing accounts and their assigned privileges on a defined, recurring frequency — the review existing on a calendar is necessary but not sufficient; it has to actually produce a decision and, where warranted, a removal.",
    "**Stage removal the same way a deliberate grant-time scoping change would be staged.** When an access-analysis review flags a gap between granted and exercised permissions, apply the narrower policy to a non-production identity or a low-stakes copy of the role first, exercise its normal jobs — including uncommon ones the lookback window was chosen to cover — and only then apply the same narrowing where a mistake is costly. Reducing privilege changes what an identity is authorized to do; an incomplete picture of its legitimate infrequent use can break a real process just as surely as an incomplete inventory can when scoping a role at creation.",
  ],
  validationEvidence: [
    "This guide describes a method and a fictional illustrative organization; it does not reproduce a specific cloud platform's access-analyzer output, a completed permission-creep review, or measured before-and-after privilege data against a real environment. Its evidence state is UNVERIFIED, and the recommendations should be treated as a starting checklist to adapt and then verify against your own cloud IAM roles and their actual usage data, not as a validated result.",
  ],
  limitations: [
    "This guide addresses drift in standing IAM privilege over time — how roles accumulate more access than they need after they already exist. It does not cover scoping a specific pipeline identity's grant at the moment it is created; 'Least Privilege for Pipeline Identities' covers that narrower, grant-time problem and this guide deliberately does not repeat it.",
    "It describes the access-analyzer and last-used-data mechanism generically, because the exact implementation, terminology, and reporting granularity vary by cloud platform. Applying this guide requires identifying and using the specific access-analysis capability your platform actually offers, and verifying its lookback-window behavior before relying on its output.",
    "It does not cover how to threat-model a cloud environment broadly, how to design the underlying role-request or provisioning workflow from scratch, or how to structure identity-provider federation — those are broader architectural questions this guide assumes are already addressed elsewhere.",
    "Reducing a role's privilege based on an access-analysis finding always carries some risk of breaking a legitimate but infrequent process if the lookback window was chosen too short or the role's owner was not consulted; the staged-removal guidance in this article reduces that risk, it does not eliminate the need to verify thoroughly before applying a narrowed policy where a mistake is costly.",
  ],
  defensiveRecommendations: [
    "Treat every 'temporary' broad grant, incident-driven wildcard permission, and role copied from an existing role as a distinct accumulation mechanism requiring its own specific fix, not one generic periodic cleanup.",
    "Base privilege reduction on granted-versus-exercised evidence from access-analyzer or last-used data over a deliberately chosen lookback window, not on a description of what a role was originally intended to do.",
    "Set the lookback window to match the role's least-frequent legitimate activity, confirmed with the role's owner, so infrequent legitimate use is not misclassified as safe-to-remove excess.",
    "Prefer time-bound, just-in-time access for genuinely occasional operations over standing elevated grants, treating credential lifetime and permission scope as two separate, complementary controls.",
    "Require explicit justification and, for temporary grants, an explicit expiry enforced through policy-as-code review at request time, so a 'temporary' exception is tracked and actionable rather than dependent on memory.",
    "Assign a named owner to each role's periodic review and escalate an unanswered review rather than treating silence as continued approval.",
    "Stage a narrowed policy through a non-production identity first, exercising uncommon legitimate paths, before applying the same narrowing where a mistake is costly.",
  ],
  keyTakeaways: [
    "Permission creep results from a series of individually reasonable decisions — a temporary broad grant, an incident-driven wildcard, a copied over-privileged role, and no owner for periodic review — not from one obviously bad choice.",
    "A point-in-time permission snapshot cannot distinguish an unused permission from a rarely-but-legitimately-used one; only usage observed over a deliberately chosen lookback window can.",
    "Access-analyzer and last-used-data review is the generic, evidence-based mechanism for finding the gap between granted and exercised permissions — a description of intended use is not a substitute for it.",
    "Time-bound, just-in-time access and narrow standing permission scope are complementary controls; neither substitutes for the other.",
    "A periodic review cadence only closes the gap if it has a named owner and treats an unanswered review as a finding — a review that exists on a calendar but produces no removal decision does not stop privilege from accumulating.",
  ],
  references: [
    "NIST SP 800-53 Rev. 5, control AC-6, Least Privilege: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "NIST SP 800-53 Rev. 5, control AC-2, Account Management (including the AC-2(2) enhancement, Automated Temporary and Emergency Account Management): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    // media.defense.gov (DoD's own CDN) blocks automated fetches (HTTP
    // 403) regardless of the document's own liveness — confirmed live via
    // WebFetch. Cited via CISA's own announcement/landing page for the
    // same Cybersecurity Information Sheet instead of the bot-blocked
    // direct PDF URL.
    "CISA and NSA, Cybersecurity Information Sheet: Use Secure Cloud Identity and Access Management Practices (March 2024), announced: https://www.cisa.gov/news-events/alerts/2024/03/07/cisa-and-nsa-release-cybersecurity-information-sheets-cloud-security-best-practices",
    "CIS Critical Security Control 5: Account Management: https://www.cisecurity.org/controls/account-management",
    "CIS Critical Security Control 6: Access Control Management: https://www.cisecurity.org/controls/access-control-management",
  ],
  relatedSlugs: ["least-privilege-for-pipeline-identities"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "Visibility into every cloud IAM role or identity's current granted permissions — the actual policy or role definition, not a description of what it was originally set up to do.",
    "Access to an access-analyzer, policy-simulation, or last-accessed reporting capability for the identity provider or cloud platform in use, covering a lookback window long enough to include the role's least-frequent legitimate activity.",
    "Authority, or a documented path to someone with authority, to change role definitions, remove or expire managed policy attachments, and enforce a policy-as-code review step on new grants.",
    "A non-production environment or a safe way to stage a narrowed policy before it becomes the only policy in place for a role a production process depends on.",
  ],
  procedure: [
    "Inventory every role and identity in scope, and for each one record what it is currently granted from the actual policy definition — including every managed policy attachment, wildcard grant, and permission inherited by having been copied from another role.",
    "For each role, identify how each grant most likely originated: an intended standing need, a 'temporary' attachment never removed, an incident-response addition never narrowed, or an inheritance from a copied role — this classification determines which fix applies.",
    "Run access-analyzer or last-used-data review for each role over a lookback window matched to its least-frequent legitimate activity, confirmed with the role's owner rather than assumed from the tooling's default window.",
    "Treat every permission granted but never exercised across the full lookback window as a finding, and every permission whose only justification was a resolved incident or a completed one-time migration as a finding regardless of whether it has technically been 'used' since.",
    "For any grant that is genuinely needed only occasionally, replace the standing grant with a time-bound, just-in-time mechanism scoped to the specific task and window it is needed for, rather than leaving it standing and narrowly scoped.",
    "Add a policy-as-code check to the role-definition review pipeline that requires an explicit justification for every new or expanded grant and an explicit expiry or scheduled follow-up review for anything described as temporary.",
    "Assign a named owner to each role's periodic review, define a recurring cadence, and define what happens when a review goes unanswered — escalation, not default re-approval.",
  ],
  validation: [
    "After narrowing a role's policy based on an access-analysis finding, run the role's full normal set of jobs — including any low-frequency legitimate ones the lookback window was chosen to cover — in a non-production environment first, and confirm none fail with an access-denied error before applying the same change to production.",
    "Confirm the narrowed policy still allows every legitimate action the role's owner identified during the lookback-window discussion, not only the actions the access-analysis tooling happened to observe during the review period.",
    "Confirm a removed grant is actually rejected when exercised in a lab or non-production context, rather than assuming removal took effect because the policy document was edited.",
    "Where a control could not be tested directly — no safe way to force a denial, no non-production copy of the role available — record that explicitly as UNVERIFIED rather than assuming the narrower policy behaves as intended because it was written that way.",
  ],
  rollback: [
    "If narrowing a role's policy breaks a legitimate but infrequent job the review missed, do not revert to the previous broad grant as the fix — add the specific, narrow permission that job actually needs and record why, so the addition is a deliberate, documented decision rather than a silent return to the previous over-broad state.",
    "If a policy-as-code check on new grants proves too disruptive to normal request flow, narrow what it requires (a shorter justification, a longer default expiry) rather than removing the check entirely — the goal is a check that is actually followed, not a documented ideal nobody uses.",
    "Keep the previous and the narrowed policy both on record when a change is made, so a later reviewer can tell 'this was reduced deliberately, on this date, based on this evidence' apart from 'this was always this narrow' — that distinction matters when someone is trying to understand why an exception was later added back.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Cloud IAM Permission Creep",
    slug: "cloud-iam-permission-creep",
    summary:
      "Why cloud IAM permissions accumulate over time even when every individual grant seemed reasonable, why that drift is structurally hard to detect from a point-in-time permission snapshot, and how to review and reduce standing privilege using access-analyzer evidence, time-bound access, policy-as-code review, and owned, scheduled de-provisioning.",
    pillar: "defend-systems",
    primaryCategory: "cloud-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["least-privilege", "access-control", "cloud-platforms"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 13,
    publishedAt: "2026-09-04",
    lastReviewedAt: "2026-09-04",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
  },
  sections,
  module: module_,
};
