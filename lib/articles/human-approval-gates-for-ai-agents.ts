// Knowledge-base article (Bead securitycorp-source-4zl.33). Published
// 2026-09-03 under Ravi Teja Thota's standing publication authorization
// after real review of citations, safety, and the differentiation from the
// existing production-approval-gates article — see the scope note below —
// per docs/publication-safety-policy.md. All examples describe a fictional agent, fictional
// tool-broker service, and fictional repository; no real pipeline name,
// credential, account, or production system appears anywhere in this file.
//
// Scope note: this article is specifically about approval gates for
// autonomous AI-agent actions — an LLM agent with tool access (file writes,
// shell commands, API calls, merges) deciding to take a real-world action.
// It deliberately does not re-cover human approval gates for
// human-authored, human-executed production changes in general (deploys,
// config changes, infrastructure changes) — that ground is covered by the
// separate, already-published article at slug
// designing-human-approval-gates-for-production-changes. The two
// articles share some vocabulary (blast radius, separation of duties,
// fail-closed) because both are approval-gate design guides, but the
// central problem here is structurally different: the entity whose action
// is being gated is the same system that would otherwise decide whether to
// ask for approval, and that system can be manipulated by content it
// processes (prompt injection) into skipping the ask. A human approval gate
// for production changes does not have an analogous "the approver's mind
// can be hijacked by the artifact under review" failure mode; a threat
// model built for one does not transfer to the other, which is why this is
// a separate article rather than a section added to that one.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788434973796-yq6127, template "research", task
// describing this article's research brief needs). A bounded
// mcp__ruflo__workflow_status check afterward showed it reproduced the
// documented issue in CLAUDE.md: 0% progress, a pending "Execute" stage, no
// retrievable editorial output. This draft was therefore produced with the
// disclosed native fallback instead — separate research, drafting,
// technical-verification, publication-safety, and editorial passes — not
// credited to Ruflo. See the calling agent's final report for full
// editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "An AI agent with tool access — the ability to write files, run shell commands, call external APIs, or merge code — is not a person deciding whether to ask for permission. It is a system that, on any given turn, either emits a tool call or it doesn't, based on a prompt, a context window, and whatever content it has ingested since the task began. Telling that system 'ask a human before doing anything destructive' is an instruction, not a control: it lives in the same place — the model's context — as every other piece of text the agent has read, including text an attacker put there on purpose.",
    "This guide covers how to design an approval gate for autonomous agent actions that holds even when the agent itself is the thing trying to get past it: what has to be decided in advance about which actions may proceed without a human and which never can, why the enforcement point has to sit outside the agent's own reasoning rather than inside its instructions, how prompt injection specifically defeats a policy-only gate, and what a rollback plan looks like once an agent has already taken an action that should have been gated. The agent, tool broker, and repository described throughout are fictional; no real system, credential, or identifier is used.",
  ],
  whatYouWillLearn: [
    "Why an instruction telling an agent to ask permission first is not an approval gate — it is advice the agent can be talked out of, including by content it reads rather than by its own operator.",
    "How to classify agent-accessible actions by irreversibility and blast radius in advance, so the boundary between autonomous and human-gated is decided once, deliberately, rather than re-litigated by the agent on every turn.",
    "How to enforce that boundary as a broker or policy layer that intercepts tool calls before execution, independent of the agent's own output, so the gate holds even when the agent's reasoning has been manipulated.",
    "Why prompt injection is the threat model that makes agent approval gates different from human approval gates, and what fail-closed enforcement looks like when a classification, policy lookup, or approval check itself fails.",
    "What a rollback plan specifically for an agent's ungated action needs to include — a compensating action per tool, decided before the tool is granted, not improvised after an incident.",
  ],
  intendedAudience: [
    "Practitioners and security engineers building or configuring tool access for an LLM agent — an internal coding assistant, an automation agent, or any system where a model's output can trigger a real-world side effect.",
    "AI-security reviewers assessing whether an existing agent deployment's 'human in the loop' claim is a structural guarantee or a system-prompt instruction that has not been tested against manipulated input.",
    "Engineering leads deciding which categories of agent action are safe to automate fully versus which must always stop for a person, before an incident forces that decision under pressure.",
  ],
  prerequisites: [
    "Basic familiarity with how an LLM agent uses tool calling or function calling to take an action outside its own context window — writing a file, invoking an API, running a command.",
    "Awareness that 'the agent was told to ask first' and 'the agent was structurally prevented from proceeding without approval' are different claims; this guide explains the distinction and why only the second one is a control.",
    "Reading the companion article 'Designing Human Approval Gates for Production Changes' is useful background on approval-gate fundamentals — what an approver needs to see, separation of duties, fail-closed design — but is not required; this guide restates what's relevant to the agent-specific case.",
  ],
  problem: [
    "Teams that give an agent tool access almost always add a guardrail the same way: a line in the system prompt telling the model to ask before doing anything risky, or to stick to a described set of safe actions. This looks like a control because it changes the model's behavior most of the time — a well-behaved agent, given ordinary tasks, generally does ask. But the instruction and the model's actual decision live in the same place: the context window. Anything that can influence that context — an ambiguous task description, content fetched from a webpage, the output of a prior tool call, a comment embedded in a file the agent is asked to review — can compete with the guardrail for the model's next action, and there is no structural reason the guardrail wins.",
    "The gap rarely shows up as an obvious failure. It shows up as an agent that has, for months, correctly asked before deleting files or merging code, and then — following a task description that included attacker-supplied text, or simply because a long, ambiguous instruction created room to interpret 'go ahead and clean this up' as covering more than intended — takes an action nobody approved. From outside the system, the previous hundred correctly-gated actions and the one that slipped through look identical in the logs: a tool call happened. Nothing distinguishes 'the agent asked and a human said yes' from 'the agent decided this one didn't need asking' unless the system was built to make that distinction externally verifiable.",
  ],
  threatModel: [
    "Assets: the state that agent tool calls can change — files, repositories, external systems reachable through an API, anything a shell command can touch — and, separately, the evidentiary value of 'the agent asked for approval': whether that event reliably means a human reviewed the specific action before it happened, or merely that the agent's own judgment concluded it should ask.",
    "The central trust decision: everything downstream of an agent's tool call assumes that if the action was consequential enough to need a human, a human was actually asked, and if it wasn't, the automation classifying it as safe was correct. Unless the boundary between 'may proceed automatically' and 'requires a human' is enforced by something other than the agent's own output, both halves of that assumption depend entirely on the agent's judgment in the moment — which is exactly the judgment an attacker, or an ambiguous task, can influence.",
    "Representative threats: prompt injection, where text the agent processes — a fetched web page, a file it was asked to summarize, the output of an earlier tool call, an issue or pull-request description — contains instructions designed to make the agent take an action, skip its own 'ask first' guardrail, or reinterpret an already-granted approval as covering more than it did. Scope creep through an overbroad tool, where a gate is built around an explicit dangerous verb (a 'delete_file' tool is gated) but an equivalent effect is reachable through a broader tool that wasn't classified the same way (a general-purpose shell tool that can also delete files). Misclassification of a dual-purpose action, where a tool that looks read-only — 'check order status' — actually has a side effect on the far end (cancels a stale order as a side effect of the check), and was granted autonomous access on the assumption that it only reads. Approval reuse, where a human's yes to one specific action is treated by the system as covering a similar-looking but materially different action the agent substitutes, because the approval wasn't bound tightly enough to the exact action it was granted for. And a missing rollback path, where an agent takes an action — a force-push, an external API call with a side effect, a bulk delete — that should have been gated, and there is no pre-defined compensating action, so recovery is improvised during the incident instead of designed before the tool was ever granted.",
    "What makes this threat model different from a human approval gate's is not the vocabulary — blast radius, separation of duties, and fail-closed design all still apply — but where the attacker's leverage is. A human approver's judgment is not manipulable by the artifact they're reviewing in the way a model's next output is manipulable by the content in its own context window. A gate designed only against 'the agent misjudges' and not against 'the agent is deliberately steered' will hold in testing and fail exactly when it matters.",
  ],
  mainContent: [
    "**Decide the autonomy boundary before granting the tool, not while handling a task.** For every tool an agent can call, classify it in advance by two questions: how reversible is the action, and how large is its blast radius if it goes wrong or targets the wrong thing? A tool that appends to a scratch log is reversible and narrow — a reasonable candidate for full autonomy. A tool that force-pushes to a shared branch, deletes data, sends an external communication, spends money, or changes an access-control setting is either hard to reverse, wide in blast radius, or both — and belongs in a category that always requires a human, regardless of how routine the specific invocation looks. This classification has to happen once, deliberately, and be reviewable — not be re-derived by the agent, under task pressure, for each call.",
    "**Enforce the boundary outside the agent's own output, not inside its instructions.** A system prompt telling the agent to ask before a gated action is not the control — it is a description of the intended behavior, sitting in the same context the agent reasons over. The actual control is a broker or policy layer that intercepts every tool call before execution: it independently checks whether this specific action, from this agent, against this target, with these parameters, falls in an autonomous or gated category, and it holds gated calls until a human approval exists for that exact call. If the agent 'decides not to ask,' the broker still blocks the call — the agent's compliance with its own instructions is not load-bearing for the security property.",
    "**Treat everything the agent reads as untrusted input capable of steering it.** Fetched web content, file contents, tool output, and task descriptions from any source the agent doesn't fully control can contain text engineered to look like an instruction. A gate that can be satisfied because the agent 'decided' the action was fine, after processing content that told it the action was fine, provides no real assurance — the decision was made by whoever wrote that content. This is the specific reason a policy-only, instruction-based gate is not adequate for agents in a way it wouldn't need to be for a human approver: a human reviewing a suspicious pull request is not at risk of being persuaded by a comment inside that PR to approve its own merge; a model reasoning over the same PR's content can be.",
    "**Bind every approval to the exact action, not to the general category.** When a human does approve a gated call, the approval record should capture the specific tool, target, and normalized parameters it was granted for, along with an expiry — so the agent (or an attacker manipulating it) cannot present a slightly different action as covered by a prior yes. An approval for 'merge pull request #142 as currently diffed' should not silently cover a subsequent force-push to the same branch, and the broker should verify the actual action against the bound approval, not just check that an approval of the right general type exists somewhere in recent history.",
    "**Fail closed at every stage the gate depends on.** If the action-classification lookup errors, if the policy service is unreachable, if the approval-verification check times out, or if audit logging fails, the tool call must be blocked, not allowed through on the assumption that the failure is unrelated to safety. A gate that defaults to permissive when its own supporting infrastructure has a bad day converts an availability problem into a security bypass, and availability problems are common enough in practice that this failure mode will eventually be exercised for real.",
    "**Plan the rollback for a specific tool before granting it, not after an incident.** Every tool an agent can call that isn't fully reversible needs a defined compensating action decided at design time: a git-level protection (branch protection plus required review, so a force-push is rejected outright rather than merely logged) for repository-affecting tools; a snapshot-and-restore procedure for file-system-affecting tools; a documented compensating transaction (a refund, a cancellation call, a corrective notification) for external-API-affecting tools. 'We'll figure out how to undo it if it happens' is not a rollback plan — it is the absence of one, discovered at the worst possible time.",
    "**Instrument every tool call, gated and autonomous alike, and watch the boundary itself.** Log which category each call was classified into, whether a human approval was required and, if so, whether it was granted before or after execution was attempted, and how often a call is classified right at the edge between categories. An agent's tool-call volume is typically far higher than a human change-approval pipeline's, so the useful signal is not 'was this one call reviewed' but whether the classification boundary is being exercised near its edges more often than expected — which suggests either the categories are miscalibrated or something is deliberately probing them.",
  ],
  validationEvidence: [
    "This guide describes a design pattern and a fictional illustrative agent and tool broker; it does not reproduce a specific agent framework's configuration, a completed red-team exercise against a real deployment, or captured incident data. Its evidence state is UNVERIFIED, and the recommendations should be treated as a starting design checklist to adapt and verify against your own agent architecture, not as a validated result.",
  ],
  limitations: [
    "This guide addresses approval gates for actions an autonomous AI agent takes through tool access — file writes, shell commands, API calls, merges. It deliberately does not re-cover approval gates for production changes proposed and executed by people in general; see 'Designing Human Approval Gates for Production Changes' for that adjacent but structurally different topic.",
    "This guide does not cover model-level or training-time mitigations for prompt injection (input sanitization research, adversarial training, constitutional or guardrail-model approaches) — it addresses the architectural question of where enforcement lives once you assume the model's reasoning can be manipulated, not how to reduce the odds of manipulation in the first place.",
    "Exact mechanisms for intercepting tool calls, binding approvals to specific actions, and enforcing fail-closed behavior vary by agent framework, orchestration platform, and tool-calling API. This guide describes the pattern generically; verify what your specific framework supports — some tool-calling implementations offer little beyond a callback the agent's own process controls, which is a materially weaker guarantee than an external broker.",
    "This guide does not provide a complete taxonomy of every possible agent-accessible action's reversibility and blast radius — that classification is necessarily specific to what an individual agent deployment can actually reach, and has to be built and reviewed for that deployment rather than adopted from a generic list.",
  ],
  defensiveRecommendations: [
    "Classify every tool an agent can call by reversibility and blast radius before granting access, and treat that classification as a reviewable, versioned decision — not something re-derived per task.",
    "Enforce the autonomous/gated boundary with a broker or policy layer that intercepts tool calls independently of the agent's own reasoning, so the agent's compliance with its own instructions is never the security property being relied on.",
    "Treat fetched content, tool output, and any task input the agent doesn't fully control as capable of steering the agent's next action, and design the gate assuming an attacker may try exactly that.",
    "Bind human approvals to the specific action — tool, target, normalized parameters, expiry — rather than a general category, so a granted approval cannot silently cover a different action the agent substitutes.",
    "Fail closed when classification, policy lookup, approval verification, or audit logging fails — never allow a gated action through because a supporting system was unavailable.",
    "Define the rollback or compensating action for every non-fully-reversible tool at design time, before the tool is granted, not after the first incident that needs one.",
    "Instrument and review how often actions are classified near the autonomous/gated boundary, not just whether individual gated calls were approved — a boundary being probed more than expected is itself a signal.",
  ],
  keyTakeaways: [
    "An instruction telling an agent to ask permission first is advice living in the same context the agent reasons over — it is not a control, because it can compete with and lose to other content in that context, including content an attacker placed there deliberately.",
    "The enforcement point for an agent approval gate has to sit outside the agent's own output — a broker or policy layer that independently checks and can block a tool call — because the agent's compliance with its own guardrail instructions is not something a security control can depend on.",
    "Prompt injection is the threat model that makes agent approval gates structurally different from human approval gates: a human approver's judgment isn't manipulable by the artifact under review the way a model's next output is manipulable by its own context.",
    "A rollback plan for an agent's ungated action has to be decided per tool at design time — what compensating action undoes this specific tool's effect — not improvised after the action has already happened.",
  ],
  references: [
    "OWASP AI Agent Security Cheat Sheet — human-in-the-loop controls, high-impact action integrity, decoupled authorization, and fail-closed enforcement for agent tool calls: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html",
    "NIST AI 600-1, Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile — human-AI configuration as a distinct risk category: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence",
    "NIST AI 100-1, Artificial Intelligence Risk Management Framework (AI RMF 1.0): https://www.nist.gov/itl/ai-risk-management-framework",
    "NIST SP 800-53 Rev. 5, controls AC-5 (Separation of Duties) and AC-6 (Least Privilege): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "CISA, NSA, FBI, and international partners, Joint Guidance on Deploying AI Systems Securely: https://www.cisa.gov/news-events/alerts/2024/04/15/joint-guidance-deploying-ai-systems-securely",
  ],
  relatedSlugs: [
    "designing-human-approval-gates-for-production-changes",
    "designing-fail-closed-security-automation",
    "least-privilege-for-pipeline-identities",
    "protecting-main-branch-beyond-pr-approval",
  ],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A complete inventory of every tool the agent can currently call — file access, shell execution, network/API calls, repository operations — and what each tool can actually do, including side effects that aren't obvious from the tool's name or description.",
    "Authority, or a documented path to someone with authority, to change how tool calls are executed: specifically, the ability to insert a broker or policy-check step between the agent's tool-call output and the action actually being taken.",
    "Access to the agent's current guardrail configuration (system prompt instructions, any existing allow/deny lists) to establish what is presently enforced by instruction only versus enforced structurally, before changing anything.",
  ],
  procedure: [
    "List every tool the agent can call today, and for each one, classify it by reversibility (can this be undone, and how completely) and blast radius (what is affected if it targets the wrong thing or behaves unexpectedly) — assign each tool to an 'autonomous' or 'always gated' category as a reviewable, versioned decision.",
    "For any tool whose side effects aren't fully captured by its name or description — a 'read' or 'check' operation that also mutates state on the far end — reclassify it based on its actual effect, not its label.",
    "Insert a broker or policy-check layer between the agent's tool-call output and actual execution, so every call is evaluated against the classification independently of what the agent's own reasoning concluded about whether to ask.",
    "For gated tools, require the broker to hold execution until a human approval exists that is bound to the specific tool, target, and normalized parameters of that exact call, with an expiry — not merely to a general category of action.",
    "Configure the broker, classification lookup, and approval-verification path to fail closed: any error, timeout, or unavailability in that path blocks the call rather than allowing it through.",
    "For every non-fully-reversible gated tool, define and document the compensating action ahead of time — branch protection and required review for repository operations, snapshot-and-restore for file operations, a documented compensating transaction for external-API operations.",
    "Instrument every tool call — autonomous and gated — with its classification, whether approval was required, and whether it was granted before execution was attempted; build a recurring review of calls classified near the autonomous/gated boundary.",
    "Remove or demote any existing 'ask before doing X' system-prompt instruction from being the sole enforcement mechanism once the broker enforces the same boundary structurally — keep it only as a UX nicety that shapes normal behavior, never as the security control itself.",
  ],
  validation: [
    "In a non-production or lab context, attempt to have the agent take a gated action through prompt-injected content (a fetched document, a tool-output string, a task description) that instructs it to proceed without asking, and confirm the broker blocks the action regardless of what the agent's own output says.",
    "Attempt a gated action through a broader-scoped tool that reaches a similar effect to an already-gated narrow tool (for example, a general-purpose shell call performing an action equivalent to a specifically gated 'delete' tool), and confirm the broker's classification catches the effect rather than only the tool name.",
    "Confirm a human approval bound to one specific action does not silently authorize a materially different action the agent attempts afterward — for example, an approval for a described merge does not also authorize a subsequent force-push to the same branch.",
    "Force a failure in the classification lookup, policy service, or approval-verification path (in a lab context) and confirm the affected tool call is blocked, not allowed through.",
    "Review a sample of logged tool calls for classification-boundary clustering — confirm gated and autonomous calls aren't concentrated suspiciously near the edge of their category in a way that suggests either miscalibration or active probing.",
    "Where a control could not be tested directly — no safe way to simulate a compromised upstream content source, no historical call-log access — record that explicitly as UNVERIFIED rather than assuming the gate behaves as intended because it was configured that way.",
  ],
  rollback: [
    "If the broker's fail-closed behavior blocks a legitimate, time-sensitive workflow because a supporting service is briefly unavailable, do not disable fail-closed enforcement to unblock it — add a documented, narrow break-glass path requiring a specific human action to proceed, with its own audit trail, rather than reverting to fail-open.",
    "If reclassifying a dual-purpose tool from autonomous to gated breaks an existing automated workflow that depended on it running unattended, redesign that workflow around an explicitly narrower, genuinely side-effect-free tool rather than reverting the tool to autonomous.",
    "If an agent already took an ungated action that should have been gated before this design was in place, execute the pre-defined compensating action for that specific tool (branch-protection-enabled revert, file-snapshot restore, or the documented compensating transaction) rather than improvising a fix, and record the gap in the classification that allowed it.",
    "Stage the rollout: apply the new broker and classification to a lower-blast-radius set of tools first, run it through real usage, and only then extend the same enforcement to the tools whose misuse would be most costly.",
    "Keep a record of when each tool's classification and gating requirement became structurally enforced versus when it existed only as a system-prompt instruction, so a later reviewer can tell when the gate actually started providing a real guarantee.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Designing Human Approval Gates for AI Agents",
    slug: "human-approval-gates-for-ai-agents",
    summary:
      "How to design an approval gate for an autonomous AI agent's tool-driven actions — file writes, shell commands, API calls, merges — that holds even when the agent's own reasoning has been manipulated: classifying actions by reversibility and blast radius, enforcing the boundary outside the agent's output, why prompt injection defeats an instruction-only gate, and what rollback looks like for an ungated action.",
    pillar: "build-securely",
    primaryCategory: "ai-security",
    secondaryCategory: "cicd-supply-chain-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["ai-security", "ai-tooling", "access-control", "fail-closed-design"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 13,
    publishedAt: "2026-09-03",
    updatedAt: "2026-09-03",
    lastReviewedAt: "2026-09-03",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
  },
  sections,
  module: module_,
};
