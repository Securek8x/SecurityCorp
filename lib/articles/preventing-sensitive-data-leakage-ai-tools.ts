// Knowledge-base article (Bead securitycorp-source-4zl.54.4.4). Left as
// status: "drafting" — NOT published. Only the orchestrating session, after
// running the full batch validation suite and recording named-human review,
// is authorized to move this to "published" per
// docs/publication-safety-policy.md. All examples describe a fictional
// engineer, fictional AI coding assistant, fictional internal chat tool, and
// fictional third-party MCP server; no real product name, company,
// credential, hostname, or employer detail appears anywhere in this file.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788514578575-pjkigz, template "research", task
// describing this article's research brief needs — sensitive-data-leakage
// causes and mitigations for AI-assisted tools). A bounded
// mcp__ruflo__workflow_status check afterward reproduced the documented
// issue in CLAUDE.md: 0% progress, a pending "Execute" stage, no retrievable
// editorial output. This draft was therefore produced with the disclosed
// native fallback instead — separate research (including live verification
// of every citation below against its source), drafting,
// technical-verification, publication-safety, and final-editorial passes —
// not credited to Ruflo. See the calling agent's final report for full
// editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "Sensitive data rarely leaks out through an AI tool in one dramatic event. It leaks the way most data leaves a boundary it shouldn't: through routine use, by people and systems that had no intention of exposing anything, doing exactly what the tool made easy. An engineer pastes a stack trace containing a customer record into a chat interface to get a faster answer. An agent's tool call, logged for debugging, captures the full contents of a file it read — including a section that never needed to be in scope. A coding assistant is pointed at a repository and given a context window wide enough to ingest a configuration directory it didn't need. A third-party plugin or MCP server is granted access to a mail inbox or a database and forwards more than the task required, because nothing scoped what it could reach.",
    "This guide covers how sensitive data — source code, customer data, credentials, and internal documentation — actually moves through AI-assisted tools, and the mitigations that hold up against that reality rather than against an idealized one: classifying data before it reaches an AI tool, reviewing what a specific tool actually does with data before adopting it, scoping and redacting what an agent can read, and logging what left the boundary so a leak is detectable rather than merely theoretical. The tools, agents, and data described throughout are fictional; no real system, credential, or organization is used.",
  ],
  whatYouWillLearn: [
    "The four channels sensitive data actually leaks through when people and agents use AI tools: an unclear-retention chat interface, an agent's own tool output and logs, an overly broad context window, and a third-party plugin or MCP server with its own data egress path.",
    "Why 'don't paste sensitive data into the chat' is a policy statement, not a control, and what has to exist structurally for it to hold.",
    "How to classify data before it reaches an AI tool, so the question 'is this safe to send' has an answer before someone has to guess under time pressure.",
    "How to scope what an agent can read and log — least privilege applied to context and tool access, not just to production credentials — and why the agent's own diagnostic output is itself a leakage channel that needs the same treatment as the data it processes.",
    "Why human oversight belongs at specific points in this flow — approving access to high-sensitivity data sources, reviewing new tools before adoption, periodically auditing what actually left the boundary — rather than as a general instruction to 'be careful.'",
  ],
  intendedAudience: [
    "Engineers using AI-assisted tools — chat interfaces, coding assistants, agents with tool access — on codebases or data that include anything sensitive.",
    "Security engineers and platform owners deciding what data an AI tool, plugin, or MCP server should be allowed to reach, and reviewing tools already in use.",
    "Engineering leads setting policy for AI tool adoption who need a concrete model of how leakage actually happens, not just a prohibition to circulate.",
  ],
  prerequisites: [
    "Basic familiarity with how a chat-based AI tool or coding assistant is used day to day — pasting content in, an assistant reading files, an agent calling tools.",
    "Awareness that data classification (public, internal, confidential, restricted, or an equivalent scheme) is a starting input this guide assumes exists or needs to be created, not something it defines from scratch.",
    "Reading the companion article 'Designing Human Approval Gates for AI Agents' is useful background on why an instruction alone isn't a control; this guide applies the same principle specifically to data exposure rather than to autonomous action.",
  ],
  problem: [
    "AI tools are adopted for speed, and speed is exactly what erodes the deliberateness that data handling normally depends on. A code review that would never include a real customer's data in a shared document happens in seconds inside a chat window with an unclear retention and training policy. A script that would be scoped to a specific directory when written by hand is instead handed to an agent with 'read whatever you need,' because scoping it precisely takes longer than the task seems to justify. Each individual instance looks like ordinary, low-stakes tool use. None of it looks like a data-handling decision, which is exactly why it usually isn't treated as one.",
    "The result is that sensitive data — source code with embedded secrets, customer records, credentials, internal architecture documentation — ends up inside a system boundary nobody explicitly decided to trust with it: a vendor's chat logs, an agent's own debug output, a plugin's downstream API call. The gap doesn't announce itself. It shows up, if at all, much later — during a vendor security review, a breach notification from a third party, or an audit that asks a question nobody can answer: what exactly did we send, to what, and can we prove it.",
  ],
  threatModel: [
    "Assets: source code (including embedded secrets and proprietary logic), customer and employee data, credentials and tokens, and internal documentation (architecture, incident history, access policies) — anywhere any of this can reach an AI tool's input, context window, tool output, logs, or a downstream system that tool talks to.",
    "The central trust decision: every use of an AI tool implicitly assumes the tool's data handling — what it retains, whether it trains on input, what its logs capture, what a connected plugin or MCP server can reach and send onward — is at least as restrictive as the sensitivity of the data being given to it. That assumption is almost never verified at the point of use; it is set once, informally, and then relied on by everyone who uses the tool afterward.",
    "Representative leakage channels: pasting content into a chat interface whose retention and training policy is unclear or unreviewed, so a one-time convenience use becomes an indefinite, un-auditable copy outside the organization's boundary. An agent's own tool output and logs capturing more than intended — a file read for one purpose gets logged in full, including sections irrelevant to the task, because logging was built for debugging and never re-reviewed against data sensitivity. An overly broad context window or tool scope that ingests more than a task requires — an agent asked to fix one module is given read access to an entire repository, including configuration and credentials it never needed to see, so anything in its context is now something a prompt-injected instruction or a model error could act on or surface. A third-party plugin or MCP server with its own data egress path — granted access to a mailbox, database, or file store for a narrow purpose, but with permissions, logging, or an upstream call that can move data beyond that purpose, and no review of what the plugin's provider itself does with what passes through it.",
    "What connects these four channels is that none of them requires an attacker. A well-behaved engineer, a correctly functioning agent, and a plugin operating exactly as documented can each produce the same outcome: sensitive data now exists somewhere it wasn't classified for and isn't governed. A threat model built only around malicious misuse will miss most of how this actually happens.",
  ],
  mainContent: [
    "**Classify data before it reaches an AI tool, not while deciding whether to use one.** The question 'can I paste this into the assistant' is unanswerable in the moment unless the data was already classified before that moment arrived. Establishing a small number of sensitivity tiers — public, internal, confidential, restricted, or an equivalent scheme — and labeling data sources against it (a repository, a customer table, a documentation space) turns a judgment call under time pressure into a lookup. NIST SP 800-122 provides a working model for this specifically for personal data, defining PII confidentiality impact levels that scale the required protection to what's actually at stake rather than treating all data uniformly; the same tiered approach generalizes to source code and internal documentation. CIS Control 3 (Data Protection) frames this as a lifecycle discipline — maintain a data inventory and a data management process — precisely because classification decided once and left unmaintained decays into the same ungoverned state it was meant to prevent.",
    "**Review what a specific AI tool actually does with data before adopting it, not after an incident asks the question.** 'Retention and training policy unclear' is not a neutral default — treat it as equivalent to 'assume retained and assume used for training' until a vendor's documentation says otherwise in writing. This applies to a general-purpose chat interface as much as to a coding assistant or an agent framework: what is logged, how long it is kept, whether it is used to improve the underlying model, and whether a support or debugging process gives a human reviewer access to raw input. A tool that is fine for public or internal-tier data can be entirely wrong for confidential or restricted-tier data, and the review has to happen at the tool level, before the first sensitive input reaches it, rather than being inferred from the tool being generally reputable.",
    "**Scope what an agent's context window and tool access can reach to what the task actually requires.** OWASP's Top 10 for LLM Applications names this failure mode directly as Excessive Agency: a system granted more functionality, more permission, or more autonomy than a task needs becomes exploitable through that surplus, whether or not anything malicious is present yet. Concretely, this means not handing an agent read access to an entire repository when it needs one module, not connecting a chat tool to a full mailbox when it needs a single folder, and treating 'give it broad access so it doesn't get stuck' as a data-exposure decision, not a convenience trade-off. Everything inside an agent's reachable context is something a manipulated instruction, a model mistake, or a misconfigured downstream call can act on — scope is a leakage control, not just a correctness one.",
    "**Treat an agent's own tool output and logs as a leakage channel, not a diagnostic afterthought.** Logging exists to make a system debuggable, and debugging usually wants everything — the full file an agent read, the complete API response, the raw prompt and completion. None of that intent considers data sensitivity by default. OWASP's AI Agent Security Cheat Sheet recommends structured logging that redacts sensitive fields before persistence and applying the same sensitivity classification to what gets logged as to the data itself; the same guidance, from the OWASP Cheat Sheet Series' MCP Security Cheat Sheet, applies specifically to tool-call logging — redact secrets and PII from logs, because a monitoring or debugging system that captures sensitive data in full has simply relocated the exposure rather than preventing it. A log line is not exempt from classification just because it was written for engineers rather than for output.",
    "**Vet a third-party plugin or MCP server's own data handling before granting it access, and scope its permissions as narrowly as its function allows.** A plugin or MCP server is a separate system with its own logging, retention, and onward data flow, and granting it access to a mailbox, database, or file store extends the organization's data boundary to include that system's practices — practices that are frequently undocumented or reviewed only superficially before adoption. The OWASP MCP Security Cheat Sheet is direct about the resulting risk, naming 'data exfiltration via legitimate channels' — where content is moved out through what looks like ordinary tool activity, such as a search query or a message subject, rather than through an obvious anomaly — and recommending scoped, per-server credentials and the narrowest workable permission for each connected tool (a read-only scope rather than a read-write one, for example) so that a single compromised or overreaching integration can't reach further than its stated purpose.",
    "**Log and audit what actually left the boundary, not just what a tool was asked to do.** A record that an agent 'read a file' or 'called an API' is not the same evidence as a record of what data specifically was in that file or that call's payload — and it is the second one that answers the question a later review will actually ask. NIST SP 800-53's audit-logging controls (AU-2, Event Logging; AU-3, Content of Audit Records) and information-flow-enforcement control (AC-4) point at the same requirement from the general-purpose security-control side: capture enough content about what crossed a boundary, not just that a boundary-crossing event occurred, or the log exists without being able to answer the question it was kept for.",
    "**Put a human at the points where oversight actually changes the outcome, not everywhere.** Least privilege limits what an agent or tool can reach by default; human oversight is the complement for the decisions that shouldn't be made by default at all — approving which data sources a new AI tool or agent gets access to before it's granted, reviewing a new plugin or MCP server's documented data handling before adoption rather than after it's already connected, and periodically auditing a sample of what actually left the boundary against what was expected to. This is oversight applied at specific, infrequent, high-leverage decision points, not a standing instruction for every individual use — a rule that depends on a person catching every paste or every tool call in real time will not hold at the volume AI tools are actually used.",
  ],
  validationEvidence: [
    "This guide describes a design pattern and fictional illustrative tools, agents, and data sources; it does not reproduce a specific vendor's retention policy, a completed data-loss-prevention deployment, or captured incident data. Its evidence state is UNVERIFIED, and the recommendations should be treated as a starting checklist to adapt and verify against your own tools' actual, current data-handling documentation — which changes over time and must be re-checked, not assumed to remain accurate.",
  ],
  limitations: [
    "This guide addresses how sensitive data reaches and moves through AI-assisted tools in day-to-day use — chat interfaces, coding assistants, agents with tool access, and connected plugins or MCP servers. It does not cover model training or fine-tuning data governance for an organization operating its own models, which is a substantially different data-lifecycle problem.",
    "This guide does not cover specific legal or regulatory compliance requirements (data residency, sector-specific privacy law, cross-border transfer restrictions) — those obligations vary by jurisdiction and data type and require review beyond a general engineering guide.",
    "This guide does not evaluate or recommend specific data-loss-prevention products, redaction tooling, or vendor retention policies — those are point-in-time facts about specific commercial offerings that this guide, written to stay vendor-neutral, does not track.",
    "Exact mechanisms for scoping an agent's context window, redacting logs, or restricting a plugin's permissions vary by tool, framework, and vendor API; this guide describes the pattern generically and defers to each tool's current documentation for what it actually supports.",
  ],
  defensiveRecommendations: [
    "Classify data sources (repositories, tables, documentation spaces) against a small set of sensitivity tiers before anyone has to decide, in the moment, whether a given AI tool is safe to use with them.",
    "Review each AI tool's actual retention, training-use, and logging behavior before adopting it for anything above the lowest sensitivity tier, and treat an unclear policy as equivalent to the least favorable one until documented otherwise.",
    "Scope an agent's context window and tool access to what the current task requires, not to what's convenient to grant once — excessive reach is a data-exposure control failure even when nothing has yet gone wrong with it.",
    "Redact sensitive fields from agent logs and tool-output records before persistence, and apply the same sensitivity classification to what's logged as to the underlying data.",
    "Vet a third-party plugin or MCP server's own data handling before granting it access, and scope its credentials and permissions as narrowly as its function allows — a read-only, single-purpose scope rather than a broad one.",
    "Log what data actually crossed a boundary, not only that a tool call happened, so a later review can answer what left rather than only that something did.",
    "Reserve human review for the decisions that set the boundary — new tool adoption, new data-source access, periodic audit of what left — rather than expecting a person to catch every individual use in real time.",
  ],
  keyTakeaways: [
    "Sensitive data leaks through AI tools mainly through ordinary, well-intentioned use — an unclear-retention chat paste, an agent's own diagnostic logs, an overly broad context window, or a third-party plugin's data handling — not primarily through attacks.",
    "Classification has to happen before the moment of use, or the question 'is this safe to send' has no answer when it's actually being asked.",
    "Scope and redaction are least-privilege applied to what an agent can read and what its logs retain, not only to the credentials it holds — everything reachable in context is something that can end up exposed.",
    "A log of that a boundary-crossing tool call happened is not evidence of what data it carried; auditing what actually left the boundary is what answers the question a later review will ask.",
  ],
  references: [
    "OWASP Top 10 for LLM Applications (2025), LLM02:2025 — Sensitive Information Disclosure: https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/",
    "OWASP Top 10 for LLM Applications (2025), LLM06:2025 — Excessive Agency: https://genai.owasp.org/llmrisk/llm062025-excessive-agency/",
    "OWASP Cheat Sheet Series — AI Agent Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html",
    "OWASP Cheat Sheet Series — MCP Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/MCP_Security_Cheat_Sheet.html",
    "NIST AI 600-1, Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile — data privacy as a distinct GAI risk category: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence",
    "NIST SP 800-53 Rev. 5, controls AC-4 (Information Flow Enforcement), AC-6 (Least Privilege), AU-2 (Event Logging), and AU-3 (Content of Audit Records): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "NIST SP 800-122, Guide to Protecting the Confidentiality of Personally Identifiable Information (PII): https://www.nist.gov/publications/guide-protecting-confidentiality-personally-identifiable-information-pii",
    "CIS Critical Security Control 3: Data Protection: https://www.cisecurity.org/controls/data-protection",
    "CISA, NSA, FBI, and international partners, Joint Guidance on Deploying AI Systems Securely: https://www.cisa.gov/news-events/alerts/2024/04/15/joint-guidance-deploying-ai-systems-securely",
  ],
  relatedSlugs: [
    "human-approval-gates-for-ai-agents",
    "least-privilege-for-pipeline-identities",
    "logs-are-not-proof-verifying-automated-actions",
  ],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A working data-classification scheme, or the authority to establish a minimal one, so data sources can be labeled before anyone has to guess their sensitivity in the moment.",
    "An inventory of AI tools currently in use or under evaluation — chat interfaces, coding assistants, agents, and any connected third-party plugins or MCP servers — and access to each one's actual retention, training-use, and logging documentation.",
    "Authority, or a documented path to someone with authority, to change what data sources, context, and tool permissions an AI tool or agent is granted, and to require review before a new one is adopted.",
  ],
  procedure: [
    "Classify existing data sources — repositories, customer data stores, internal documentation spaces, credential stores — against a small set of sensitivity tiers, and record the classification somewhere it can be checked rather than remembered.",
    "For each AI tool currently in use, obtain and review its actual retention, training-use, and logging policy; where the policy is unclear or unavailable, treat the tool as unsuitable for anything above the lowest sensitivity tier until documented otherwise.",
    "For each agent or coding assistant with tool access, reduce its context window and tool scope to what its current task requires — narrow a repository-wide read to the relevant module, a full-mailbox connection to a single folder — and treat any broader grant as a decision that needs its own justification.",
    "Review agent and tool-call logging configuration; add redaction for sensitive fields before persistence, and apply the same sensitivity classification to logged content as to the underlying data source it came from.",
    "For each connected third-party plugin or MCP server, review its documented data handling and scope its credentials and permissions to the narrowest workable level for its actual function — a read-only, single-purpose scope rather than a broad one.",
    "Instrument logging so that what data crossed a boundary is recorded, not only that a tool call or paste event happened, so a later review can answer the specific question rather than only confirm that activity occurred.",
    "Set explicit human-review checkpoints: before granting a new AI tool or agent access to a new data source, before adopting a new plugin or MCP server, and on a recurring schedule to audit a sample of what actually left the boundary against what was expected.",
  ],
  validation: [
    "In a non-production or lab context, review the actual content of an agent's or tool's logs after a representative task and confirm sensitive fields were redacted before persistence, not merely intended to be.",
    "Confirm that an agent scoped to a specific module or folder cannot, in practice, read outside that scope through its granted tool access — the enforced boundary, not the described one.",
    "Review a connected plugin's or MCP server's actual granted permissions against its stated function, and confirm the permission is the narrowest available option rather than a broader default that was never narrowed.",
    "Sample recent tool-call or chat-interface activity involving a classified data source and confirm the classification tier and the tool's retention/training policy were compatible for that use — not assumed compatible because the tool is generally trusted.",
    "Where a control could not be verified directly — a vendor's retention policy is not independently confirmable, no log sample was available for a given tool — record that explicitly as UNVERIFIED rather than assuming compliant behavior because the tool was configured as intended.",
  ],
  rollback: [
    "If narrowing an agent's context or tool scope breaks a workflow that depended on broader access, redesign the workflow around an explicitly scoped request (a targeted read, a narrower query) rather than reverting to the broader grant.",
    "If a review finds a third-party plugin or MCP server's actual data handling doesn't match what was assumed when it was adopted, restrict or revoke its access pending a documented re-review, rather than leaving it connected on the assumption that no leak has been observed yet.",
    "If sensitive data is found to have already reached a tool whose retention or training policy is unclear or unfavorable, treat it as a possible disclosure per this repository's incident and remediation procedure — notify the responsible human reviewer, do not attempt to quietly delete or ignore the exposure, and review whether the same gap affected other uses of the same tool.",
    "Stage rollout of new logging redaction or scope restrictions: apply to lower-sensitivity tools and data sources first, confirm the redaction or scoping behaves as intended, and only then extend to the highest-sensitivity sources.",
    "Keep a record of when each tool's data-handling review was last performed and what was found, so a later reviewer can tell whether a tool's classification-compatibility decision is current or has gone stale as the tool's policy or the data's sensitivity changed.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Preventing Sensitive Data Leakage Through AI Tools",
    slug: "preventing-sensitive-data-leakage-ai-tools",
    summary:
      "How sensitive data — source code, customer data, credentials, and internal documentation — actually leaks through AI-assisted tools: an unclear-retention chat interface, an agent's own tool output and logs, an overly broad context window, and a third-party plugin or MCP server with its own data egress path. Covers concrete mitigations that hold up against routine use: classifying data before it reaches an AI tool, reviewing a tool's actual data handling before adoption, scoping and redacting what an agent can read and log, and auditing what actually left the boundary.",
    pillar: "build-securely",
    primaryCategory: "ai-security",
    secondaryCategory: "governance-risk-compliance",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["ai-security", "least-privilege", "access-control", "ai-tooling"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
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
