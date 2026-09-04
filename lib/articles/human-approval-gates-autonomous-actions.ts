// Knowledge-base article draft (Bead securitycorp-source-4zl.54.4.3).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is NOT wired into lib/knowledge-content.ts and is not
// registered as an article import in this commit; it becomes part of the
// published catalog only after human privacy/technical/publication review,
// per docs/knowledge-base.md. Every example describes a fictional
// automation system, fictional approval service, and fictional targets; no
// real system, credential, account, or production identifier appears
// anywhere in this file.
//
// Scope note / duplicate-topic flag: this bead was assigned under the
// "AI Security" epic (securitycorp-source-4zl.54.4) alongside bead
// securitycorp-source-4zl.33, "Designing Human Approval Gates for AI
// Agents," which was drafted and published (slug
// human-approval-gates-for-ai-agents) earlier in this same session under
// the same epic. That article's central thesis is narrative and threat-
// model-specific: an instruction-only "ask before doing X" gate fails
// because prompt injection can manipulate the agent's own reasoning, so
// enforcement has to sit in an external broker rather than the agent's
// context. This article deliberately does not re-argue that thesis. It is
// scoped instead as a pattern catalog: concrete, implementation-level gate
// mechanisms (confirmation prompts, scoped/expiring approval tokens, dual
// control, audit trails) and a reversibility/blast-radius classification
// applied across five named consequential-action categories (deploying
// code, external communications, production data/infrastructure changes,
// spending money, deleting data) — a broader taxonomy than either sibling
// article uses, and one that applies whether the actor proposing the
// action is a human (see the separate, already-published
// designing-human-approval-gates-for-production-changes, which covers what
// makes a human-authored change's approval meaningful) or an autonomous
// system. Because the overlap in title and scope between this bead and
// 4zl.33 appears to reflect duplicate planning rather than an intentional
// split, this should be flagged to the human content owner to decide
// whether both articles should remain in the catalog, be merged, or have
// one bead retired — this file does not resolve that on its own.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788482307991-5hkog4, template "research", task
// describing this article's research brief needs). A bounded
// mcp__ruflo__workflow_status check afterward showed it reproduced the
// documented issue in CLAUDE.md: 0% progress, a single pending "Execute"
// step, no retrievable editorial output. This draft was therefore produced
// with the disclosed native fallback instead — separate research (source
// verification via WebFetch against primary documents, not recalled from
// memory), drafting, technical-verification, publication-safety, and final
// editorial passes — not credited to Ruflo. See the calling agent's final
// report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "Consequential automated actions fall into a small number of recognizable categories — deploying code, sending an external communication, modifying production data or infrastructure, spending money, deleting data — and each carries a real question: should this run on its own, or should it stop and wait for a person? Answering that question well requires two separate things: a classification made in advance, before any specific action is in flight, and a small set of concrete gate mechanisms that actually enforce the answer rather than merely describing it.",
    "This guide is a pattern catalog, not a single narrative argument. It covers how to classify an action's risk by reversibility and blast radius, and then walks through four concrete gate-design patterns — explicit confirmation prompts, scoped and expiring approval tokens, dual control for the highest-risk actions, and audit trails — describing what makes each one a real control instead of a formality, and where each one still fails. Every example describes a fictional automation system and fictional approval service; no real system, credential, or account is described.",
  ],
  whatYouWillLearn: [
    "How to classify a consequential action by reversibility and blast radius, in advance, across five common categories: deploying code, external communications, production data/infrastructure changes, spending money, and deleting data.",
    "What makes an explicit confirmation prompt a real checkpoint rather than a click a person learns to dismiss without reading.",
    "How scoped, expiring approval tokens bind a human's 'yes' to one specific action instead of a general category, and why that binding is what stops an approval from being stretched to cover something it wasn't given for.",
    "When a single approver is not enough — the case for dual control (two-person integrity) on the highest-risk actions, and how it differs from ordinary separation of duties.",
    "What an audit trail needs to record to be useful for review and forensics, as distinct from a log line that only proves an action happened.",
  ],
  intendedAudience: [
    "Practitioners and security engineers designing approval checkpoints for any automated system — an AI agent, a deployment pipeline, a scheduled job, a support-automation tool — that can take a consequential action without a person in the loop by default.",
    "Engineering leads deciding, ahead of an incident, which categories of automated action are safe to run unattended and which must always stop for a person.",
    "Reviewers auditing whether an existing 'human approval required' claim is backed by an enforced mechanism or by an instruction that happens to usually be followed.",
  ],
  prerequisites: [
    "Basic familiarity with how an automated system — a script, a pipeline, or an AI agent with tool access — triggers an action with a real-world side effect.",
    "No specific approval-platform or vendor expertise is assumed; every pattern here is described generically, with a fictional example used only for illustration.",
    "Reading the companion articles on human approval gates for AI agents and for production changes is useful background but not required — this guide restates what's relevant to the pattern-catalog framing and does not assume either has been read.",
  ],
  problem: [
    "Teams that build automation eventually confront the same question for every new capability: does this action need a person to approve it first? In practice the question gets answered inconsistently, action by action, often by whoever happens to be building that specific feature — one engineer adds a confirmation dialog to a deletion flow, another wires a Slack approval button into a deploy script, a third ships a spend-authorization check that nobody has tested against a rejected request. None of these are wrong on their own, but none of them come from a shared answer to two prior questions: which actions, across the whole system, actually need a human gate at all, and once a gate exists, what specifically makes it hold rather than just look present.",
    "The result is a patchwork where some genuinely low-risk actions (a reversible, narrow-scope change) sit behind an unnecessary approval step that trains people to click through it without reading, while some genuinely high-risk actions (an irreversible bulk deletion, a large outbound payment, a mass external communication) either have no gate at all or have one that can be satisfied by an approval granted for something else entirely. Fixing this one gate at a time, reactively, after each near-miss, produces a system that is inconsistently protected in a way that is hard to audit — a reviewer cannot tell, from the outside, whether the absence of a gate on a given action reflects a deliberate risk decision or simply that nobody got to it yet.",
  ],
  threatModel: [
    "Assets: the state a consequential action changes — deployed code, external-facing communications, production data and infrastructure, funds, and stored data — and, separately, the evidentiary value of an approval record itself: whether 'approved' reliably means a specific, qualified decision was made about this exact action, or merely that some approval-shaped event occurred somewhere in the system.",
    "Representative action categories and their default risk shape: deploying code (usually reversible via rollback, but blast radius scales with what the deploy touches); sending an external communication (often irreversible the moment it's sent — a message, once delivered, cannot be recalled — with blast radius depending on audience size and content); modifying production data or infrastructure (reversibility depends heavily on whether a verified backup or infrastructure-as-code baseline exists; without one, an in-place change can be effectively irreversible); spending money (reversibility depends on the payment rail and how quickly a reversal or clawback can be initiated, which is often slow or partial); and deleting data (the default worst case: irreversible unless a tested, verified backup exists independent of the system that performed the deletion).",
    "Representative gate-mechanism failures, distinct from the action-classification question above: a confirmation prompt that shows a generic description ('proceed with this operation?') rather than the actual target and parameters, so confirming teaches nothing about what specifically will happen; an approval token whose scope is broader than the action it was granted for, so it can be replayed against a different target or a larger batch than a human actually reviewed; a single-approver gate on an action whose consequences are severe enough that one person's judgment — or one compromised approver credential — is not an adequate safeguard; and an audit log that records that an action occurred without recording the classification it was assigned, whether approval was required, or what the actual approver saw, leaving a reviewer unable to reconstruct after the fact whether the gate did anything.",
    "Out of scope for this guide, and covered elsewhere: how prompt injection can manipulate an AI agent's own decision to seek approval, and why enforcement for agent tool calls has to sit outside the agent's reasoning — see 'Designing Human Approval Gates for AI Agents.' What makes a human reviewer's approval of a proposed production change substantively informed (an actual diff, a blast-radius summary, a rollback plan) rather than a rubber stamp — see 'Designing Human Approval Gates for Production Changes.' This guide assumes both of those problems are handled and focuses on the mechanisms that implement the resulting gate.",
  ],
  mainContent: [
    "**Classify before building, using reversibility and blast radius, not the actor.** The question 'does this need a human' should be answered the same way regardless of whether the action is proposed by a script, a scheduled job, or an AI agent: how hard is this to undo, and how much does it affect if it goes wrong or targets the wrong thing? Apply that to the five categories above and a rough default shape emerges — narrow, reversible actions (a scoped code deploy behind a tested rollback, a routine reversible data update) are reasonable candidates for full autonomy with strong logging; broad or hard-to-reverse actions (a mass external communication, a bulk deletion, a large payment, an infrastructure change with no verified rollback) belong in a category that always requires a human, independent of how routine the specific instance looks. This classification is a versioned, reviewable decision made once for a category, not re-derived per action under time pressure.",
    "**Pattern 1 — Explicit confirmation prompts: a checkpoint, not a formality.** A confirmation prompt is only a real gate if answering it correctly requires the person to actually process what they're confirming. That means showing the real target and parameters — which record, how many rows, which recipient list, which amount — not a generic description that would read identically for any action of that type. It means requiring an input that can't be satisfied by reflex, such as typing the resource's name or the record count rather than clicking a single default-focused button, for the highest-consequence confirmations specifically. And it means treating repeated exposure to the same prompt as a design problem to solve, not a training opportunity: a prompt shown identically on every routine, low-risk action teaches people to dismiss it, and that habituation is exactly what fails on the one occasion the prompt actually mattered. OWASP's agentic-AI guidance describes this directly as requiring 'explicit approval for high-impact or irreversible actions' together with 'action previews before execution' — the preview is what separates a confirmation from a formality.",
    "**Pattern 2 — Scoped, expiring approval tokens: bind the yes to the exact action.** A meaningful approval is not a general permission slip; it is a record bound to one specific action — the actor, the operation, the target, the normalized parameters — with a short, defined lifetime and, where the platform supports it, single-use or replay protection. This is the same design principle behind a scoped, time-limited OAuth 2.0 access token (RFC 6749 defines both a 'scope' parameter narrowing what a token authorizes and an 'expires_in' lifetime after which it is no longer valid) applied to a human approval instead of a machine credential: narrow scope prevents an approval granted for one target from being replayed against a different or larger one, and a short expiry prevents an approval granted under one set of conditions from being exercised much later under different ones. OWASP's guidance for agent approval records makes the same binding explicit, recommending the approval include 'the actor, tool name, target resource, normalized parameters, timestamp, and expiry,' with 'short-lived authorization artifacts and replay protection for irreversible operations.' A gate that only checks 'does an approval of roughly this type exist somewhere recently' rather than verifying the actual action against a bound, unexpired token provides much weaker assurance than either sounds like it should.",
    "**Pattern 3 — Dual control for the highest-risk actions.** Ordinary separation of duties means the approver is not the same person as the actor proposing the action — a single independent reviewer. Dual control (also called two-person integrity) is a stronger, distinct pattern: it requires two separate, independent people to authorize the same action before it proceeds, neither of whom can complete it alone. NIST SP 800-53 Rev. 5 names this directly as control AC-3(2), Dual Authorization: 'Enforce dual authorization for [organization-defined privileged commands and/or other actions],' with supplemental guidance describing it as a two-person control intended to reduce the risk of a single compromised or malicious actor completing a high-impact action unilaterally. This belongs specifically on the highest-risk end of the classification from the first pattern — an irreversible bulk deletion, a large outbound payment, an infrastructure change with no rollback path — not on every gated action; applying dual control uniformly either makes low-risk actions needlessly slow or, more likely, trains both approvers to rubber-stamp each other's requests, which erases the benefit dual control exists to provide.",
    "**Pattern 4 — Audit trails: what makes a log entry actually reviewable.** A log line that records 'action X occurred at time Y' proves an event happened; it does not, by itself, prove a gate did anything. A reviewable audit trail for a gated action needs to capture the classification the action was assigned, whether approval was required and by which pattern (confirmation, scoped token, dual control), the specific approval or token identifier and who granted it, the actual parameters executed against, and the outcome — recorded at the time of the decision, not reconstructed afterward from partial evidence. OWASP's guidance describes this as logging 'structured decision metadata for high-risk actions, including action classification, risk score when applicable, authorization outcome, approval identifier, execution result, and policy version.' NIST SP 800-53 Rev. 5's AU-6, Audit Record Review, Analysis, and Reporting, is the complementary control: the trail is only useful if it is actually reviewed at a defined cadence for unusual patterns, not generated and left unread until an incident forces someone to go looking.",
    "**Match the pattern to the classification, not to habit.** A narrow, reversible action logged with full audit detail can reasonably run autonomously. A moderate-risk action — one with real but recoverable consequences — is a reasonable fit for a confirmation prompt backed by an audit trail. A high-risk, hard-to-reverse action needs a scoped, expiring approval token bound to the exact operation, not a confirmation dialog alone, because a dialog can be reflexively clicked while a bound token at minimum forces the approving system to verify the specific parameters. The highest-risk actions — the ones where a single wrong instance is genuinely catastrophic and hard to recover from — warrant dual control on top of a scoped token and a detailed audit trail, because at that tier a single point of authorization, human or automated, is not enough independent judgment for the stakes involved.",
    "**Know where each pattern still fails.** Confirmation prompts fail through habituation — shown too often, on too much low-stakes routine, they stop functioning as checkpoints. Scoped tokens fail when the scope is defined too broadly to begin with, or when a system trusts an unexpired token without re-verifying it against the exact action actually attempted. Dual control fails when the two approvers are not genuinely independent — the same team, the same manager, or a habit of one approver always following the other's lead reproduces a single point of failure with extra latency and no added assurance. And audit trails fail as a control, specifically, when they exist only for forensics after the fact rather than being reviewed on a cadence that could catch a problem while it's still current; a perfect record of what went wrong, discovered only in hindsight, is evidence for the postmortem, not a control that prevented anything.",
  ],
  validationEvidence: [
    "This guide describes a classification framework and four gate-mechanism patterns, illustrated with a fictional automation and approval system; it does not reproduce a specific platform's configuration, a completed red-team exercise, or captured incident data. Its evidence state is UNVERIFIED, and the recommendations should be treated as a starting design checklist to adapt and verify against your own system's actual action inventory, not as a validated result.",
  ],
  limitations: [
    "This guide is a pattern catalog for gate mechanisms and action classification. It deliberately does not cover how prompt injection can manipulate an AI agent's own decision to request approval, or why enforcement for agent tool calls specifically has to sit in a broker outside the agent's context — see 'Designing Human Approval Gates for AI Agents' for that distinct threat model.",
    "It also does not cover what makes a human reviewer's approval of a proposed production change substantively informed — the actual diff or plan, a blast-radius summary, a rollback plan — which is covered in depth by 'Designing Human Approval Gates for Production Changes.' This guide assumes that problem is separately addressed and focuses on the underlying gate mechanisms themselves.",
    "The five action categories used throughout (deploy code, external communications, production data/infrastructure, spend, deletion) are a representative, not exhaustive, taxonomy; a specific system may have consequential action types that don't map cleanly onto one category, and those need their own explicit classification rather than being forced into the nearest listed one.",
    "Exact implementation mechanics for confirmation UI, token issuance and verification, dual-control workflow enforcement, and structured audit logging vary by platform and framework. This guide describes each pattern generically; verify what your specific tooling actually supports and enforces before relying on it.",
  ],
  defensiveRecommendations: [
    "Classify every consequential action category by reversibility and blast radius before building its gate, as a versioned, reviewable decision — not re-derived per action under time pressure.",
    "Make confirmation prompts show the real target and parameters, not a generic description, and reserve them for actions where reading the prompt is expected to change the decision.",
    "Bind every approval token to the exact actor, operation, target, and normalized parameters, with a short expiry and, where supported, single-use or replay protection — never accept 'an approval of roughly this type exists recently' as sufficient.",
    "Reserve dual control (two genuinely independent approvers, neither able to act alone) for the highest-risk, hardest-to-reverse action categories, and confirm the two approvers are actually independent rather than a formality.",
    "Log structured decision metadata for every gated action — classification, which pattern applied, approval or token identifier, actual parameters executed, and outcome — at decision time, not reconstructed afterward.",
    "Review audit trails on a defined recurring cadence for unusual patterns, not only after an incident forces a retrospective look.",
    "Record any pattern that could not be verified end-to-end (a scoped token's replay protection, a dual-control workflow's independence guarantee) explicitly as UNVERIFIED rather than assuming it behaves as configured.",
  ],
  keyTakeaways: [
    "Classify consequential actions by reversibility and blast radius — across categories like deploying code, external communications, production data/infrastructure changes, spending money, and deleting data — before building the gate, as a decision made once and reviewed, not re-derived per action.",
    "A confirmation prompt is a real checkpoint only if it shows the actual target and parameters and isn't shown so often that it becomes a reflex to dismiss.",
    "A scoped, expiring approval token binds a human's yes to the exact action it was granted for — the same design principle behind a time-limited, scoped OAuth access token — which is what stops an approval from being stretched to cover a different or larger action.",
    "Dual control is a distinct, stronger pattern than ordinary separation of duties, reserved for the highest-risk actions, and it only works when the two approvers are genuinely independent; an audit trail is only a working control when it records structured decision metadata and is actually reviewed on a cadence, not just generated and left unread.",
  ],
  references: [
    "OWASP AI Agent Security Cheat Sheet — human-in-the-loop approval, action previews, scoped/expiring approval binding, and structured audit logging for high-risk actions: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html",
    "IETF RFC 6749, The OAuth 2.0 Authorization Framework — scope and token-lifetime (expires_in) as the underlying pattern for scoped, expiring authorization: https://www.rfc-editor.org/rfc/rfc6749",
    "NIST SP 800-53 Rev. 5, control AC-3(2), Dual Authorization: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "NIST SP 800-53 Rev. 5, control AC-5, Separation of Duties: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "NIST SP 800-53 Rev. 5, control AU-6, Audit Record Review, Analysis, and Reporting: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "NIST AI 600-1, Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile — human-AI configuration as a distinct risk category: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence",
  ],
  relatedSlugs: [
    "human-approval-gates-for-ai-agents",
    "designing-human-approval-gates-for-production-changes",
    "designing-fail-closed-security-automation",
    "logs-are-not-proof-verifying-automated-actions",
  ],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "An inventory of every consequential action your system(s) can take without a person in the loop by default — across code deployment, external communications, production data/infrastructure changes, spending, and data deletion — including automation, scheduled jobs, and any AI agent tool access.",
    "Authority, or a documented path to someone with authority, to insert or modify a gate mechanism (confirmation UI, token issuance/verification, dual-control workflow, structured logging) ahead of where these actions currently execute.",
    "Access to current logs for gated and ungated actions sufficient to establish a baseline of what is actually recorded today, before adding any new mechanism.",
  ],
  procedure: [
    "For each consequential action category in your inventory, classify it by reversibility (can it be undone, and how completely) and blast radius (what is affected if it targets the wrong thing or behaves unexpectedly), and assign it to an autonomous, confirmation-gated, token-gated, or dual-control tier as a reviewable, versioned decision.",
    "For any action currently behind only a generic confirmation dialog, replace the generic description with the real target and parameters, and reserve the confirmation pattern for actions where reading it plausibly changes the outcome — move higher-risk actions in that category to a scoped-token or dual-control tier instead.",
    "For actions in the token-gated tier, implement approval binding to the specific actor, operation, target, and normalized parameters, with a short expiry and replay protection, and verify the actual attempted action against the bound token rather than checking only that some recent approval of the right general type exists.",
    "For actions in the dual-control tier, implement a workflow requiring two independent approvers, confirm neither can complete the action alone, and confirm the two approver roles are staffed by people who are not in practice a single decision-maker (same manager mandating both, one habitually deferring to the other).",
    "Add or extend structured logging for every gated action to capture classification, gate pattern applied, approval/token identifier, actual executed parameters, and outcome at decision time.",
    "Establish a recurring cadence to review the audit trail for actions clustered near a classification boundary, confirmations approved with unusually low latency, or dual-control approvals that show no independent deliberation.",
  ],
  validation: [
    "In a non-production or lab context, attempt to replay an expired or wrongly-scoped approval token against a gated action and confirm it is rejected rather than accepted because 'an approval exists.'",
    "Attempt to complete a dual-control action with only one approver's authorization and confirm the system blocks it rather than allowing a single approval to satisfy the requirement.",
    "Review a sample of confirmation-prompt approvals for latency; confirm approval times show real variance rather than a uniform, near-instant pattern across every action regardless of risk, which would suggest the prompt has become a reflex rather than a checkpoint.",
    "Confirm the audit trail for a sample of gated actions actually contains the classification, gate pattern, approval identifier, and executed parameters — not only a bare 'action succeeded' entry.",
    "Where a mechanism could not be tested directly — no safe way to simulate a compromised approver credential, no historical approval-latency data — record that explicitly as UNVERIFIED rather than assuming it behaves as configured.",
  ],
  rollback: [
    "If a newly added confirmation prompt or scoped-token requirement blocks a legitimate, time-sensitive workflow, do not remove the gate — add a documented, narrow, logged break-glass path requiring a specific authorized action, rather than reverting the action to unattended autonomy.",
    "If dual control proves impractical for a specific action because only one qualified approver is realistically available, treat that as a staffing gap to close (train or authorize a second qualified approver) rather than silently downgrading the action to single-approval or autonomous.",
    "Stage the rollout: apply new classification and gate mechanisms to a lower-blast-radius action category first, run it through real usage, and only then extend the same mechanisms to the highest-risk categories.",
    "Keep a record of when each action category's gate mechanism became structurally enforced versus when it existed only as a UI convention or unenforced expectation, so a later reviewer can tell when the gate actually started providing a real guarantee.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Human Approval Gates for Autonomous Actions",
    slug: "human-approval-gates-autonomous-actions",
    summary:
      "A pattern catalog for gating consequential automated actions — deploying code, external communications, production data/infrastructure changes, spending money, and deleting data: classifying action risk by reversibility and blast radius, and four concrete gate-design patterns — explicit confirmation prompts, scoped/expiring approval tokens, dual control for the highest-risk actions, and structured audit trails.",
    pillar: "build-securely",
    primaryCategory: "ai-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["ai-security", "access-control", "fail-closed-design"],
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
