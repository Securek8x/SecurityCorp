// Knowledge-base article: "Threat Modeling AI Agents with Tool Access"
// (Bead securitycorp-source-4zl.54.4.1). Status is intentionally "drafting"
// and every review record stays "pending" — this file is NOT authorized for
// "published" status. It is registered in lib/knowledge-content.ts's
// `knowledgeArticles` array (as every article in that array is, regardless
// of status) but is filtered out of `publishedKnowledgeArticles` by
// `isPubliclyVisible` until a human reviewer records approved privacy,
// technical, and publication review per docs/publication-safety-policy.md.
// All examples describe a fictional agent and fictional tools; no real
// system, credential, employer, or production identifier appears anywhere
// in this file, and no example depicts unsafe autonomous operation.
//
// Differentiation from lib/articles/human-approval-gates-for-ai-agents.ts:
// that article is a narrow, already-published deep dive on one specific
// mitigation — how to design the approval-gate broker itself so it holds up
// against prompt injection. This article is the broader threat-modeling
// method that motivates that mitigation (and three others) in the first
// place: how to enumerate an AI agent's actual tool-access attack surface
// (file writes, shell, network calls, credentials) as a set of trust
// boundaries, identify representative threats at each one, and map each
// threat to one of four compensating-control categories — least privilege /
// scoped credentials, human-approval gates for the specific high-risk
// actions identified, audit logging, and execution sandboxing — rather than
// re-deriving the approval-gate broker design itself. Where this article
// reaches the approval-gate mitigation, it references the companion article
// instead of repeating its content, the same way
// lib/articles/threat-modeling-cicd-pipeline.ts (general pipeline
// trust-boundary method) relates to
// lib/articles/protecting-main-branch-beyond-pr-approval.ts (one narrow
// boundary within that pipeline).
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788482211233-0uc76g, template "research", task
// describing this article's research brief needs). A bounded
// mcp__ruflo__workflow_status check afterward showed it reproduced the
// documented issue in CLAUDE.md: 0% progress, a single pending "Execute"
// step, no retrievable editorial output. This draft was therefore produced
// with the disclosed native fallback instead — separate research, drafting,
// technical-verification, publication-safety, and editorial passes — not
// credited to Ruflo. See the calling agent's final report for full
// editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "An AI agent with tool access — the ability to write files, run shell commands, call external APIs, or reach a credentialed service — is not one risk to accept or reject. It is a specific set of capabilities, each with its own reach, and each one is a place where the model's next output can become a real-world side effect. Two agents built on the same underlying model but granted different tools carry completely different risk profiles; treating 'is this AI agent safe' as a single yes/no question skips the analysis that actually matters, which is what this particular agent can touch and what happens when its reasoning about a specific action turns out to be wrong.",
    "This guide is a method for threat modeling that surface: enumerating an agent's tool inventory as a set of trust boundaries, identifying representative threats at each boundary — including the boundary that is unique to agents, the model's own context being manipulable by content it processes — and mapping each threat to one of four compensating-control categories: least privilege and scoped credentials, human-approval gates for the specific high-risk actions identified, audit logging built for reconstruction, and execution sandboxing. It does not re-derive how to build the approval-gate mechanism itself; the companion article 'Designing Human Approval Gates for AI Agents' covers that in depth. Every example below describes a fictional agent, fictional tools, and a fictional target environment; no real system, credential, or production configuration is described.",
  ],
  whatYouWillLearn: [
    "How to enumerate an AI agent's actual attack surface as a tool inventory — what each tool can read, write, or execute, and what credential it authenticates as — instead of treating 'the agent' as one undifferentiated risk.",
    "Why prompt injection means content the agent merely processes (a fetched page, a file, a prior tool's output) is part of the threat model, not just the task description a human typed — and how that changes what 'trusted input' means for a tool-calling agent.",
    "How least privilege applies at the level of an individual tool's credential, not the agent as a whole, and why a credential broader than the tool's stated purpose defeats the point even if the agent 'only' calls that tool for its intended use.",
    "What execution sandboxing actually contains — a compromised reasoning step's blast radius — and what it does not: a valid, scoped credential handed to the agent still works from inside the sandbox.",
    "A repeatable way to record every identified threat as mitigated, planned, or an accepted residual risk, so an agent's tool access is never approved because nobody got around to writing the gap down.",
  ],
  intendedAudience: [
    "Engineers building or configuring tool access for an AI-assisted system — a coding assistant, an automation agent, or any deployment where a model's output can trigger a file write, a command, or an API call.",
    "Security engineers assessing an existing or proposed agent deployment's actual attack surface before it is granted broader tool access, rather than accepting a vendor's or team's general assurance that 'guardrails are in place.'",
    "Technical leads deciding which categories of tool access an agent should be granted at all, before the decision gets made implicitly by whichever tool happened to be easiest to wire up.",
  ],
  prerequisites: [
    "Basic familiarity with how an LLM agent uses tool calling or function calling to take an action outside its own context window.",
    "General threat-modeling vocabulary (asset, trust boundary, mitigation, residual risk) is helpful; the companion article 'Threat Modeling a CI/CD Pipeline' introduces the same method applied to a different system, but is not required reading for this guide.",
    "No lab environment is required — every example here is fictional and descriptive, not a runnable exercise.",
  ],
  problem: [
    "It is common to evaluate an AI agent's security as a single property — 'does it have guardrails,' 'is prompt injection possible' — rather than as a function of exactly what the agent can do. A read-only documentation assistant and a coding agent with shell access and a deploy credential are not the same threat model wearing different prompts; the second one inherits every risk of the first plus a set that only exists because it can take irreversible, wide-blast-radius actions in the real world. Skipping the decomposition step — what tools, what do they reach, what do they authenticate as — means the risk conversation happens at the wrong altitude, and the actual gaps (an overbroad credential behind a narrowly named tool, a shell tool with no isolation, a tool call nobody logs enough context to reconstruct later) go unexamined.",
    "The gap does not require a sophisticated attacker to matter. An agent that has correctly handled hundreds of ordinary tasks can, on the next one, process a single piece of content — a fetched web page, a file it was asked to summarize, the output of an earlier tool call — that was engineered to steer its next action. Whether that steering succeeds in causing real harm depends entirely on what the agent's tools can actually reach at that moment, which is exactly the analysis a tool-by-tool threat model is for and a single 'is AI safe' judgment is not.",
  ],
  threatModel: [
    "Assets: the tool surface itself (what each tool can read, write, or execute), the credentials or API keys each tool authenticates as when it runs, the systems reachable through those credentials, and — distinct from a traditional pipeline's assets — the integrity of the agent's own decision process, since a manipulated decision is functionally equivalent to a malicious operator for every tool it can reach.",
    "Trust boundaries specific to a tool-access agent: (1) the input boundary — what content reaches the model's context (task description, retrieved documents, fetched web content, prior tool output) versus what the operator actually intended as instruction; this is the prompt-injection boundary, and it has no clean analogue in a system built from deterministic code, because the 'code' here is the model's own reasoning over whatever text it has read. (2) the tool-invocation boundary — the gap between the model deciding to call a tool and that tool actually executing; whatever sits in that gap (or doesn't) is where scope enforcement either becomes a real control or stays a hopeful instruction. (3) the credential boundary — what identity or key a tool authenticates as, and whether that credential's actual reach matches the tool's apparent, narrow purpose. (4) the execution-environment boundary — the host, container, or sandbox a shell or file-write tool actually runs inside, and what compromising that environment would additionally expose beyond the specific call the agent intended. (5) the audit boundary — what evidence exists afterward that a given action happened, what content in the agent's context led to it, and whether it was authorized.",
    "Representative threats, one per boundary: a fetched web page or reviewed file contains text engineered to make the agent invoke a destructive or data-exposing tool call it was never asked to perform — the input boundary failing. A broad, general-purpose tool (an unrestricted shell) reaches the same effect as a narrowly named tool that was deliberately gated or blocked, because the enforcement point checked the tool's name rather than its actual effect — the tool-invocation boundary failing. A tool that looks narrowly scoped by name — 'look up an order' — actually authenticates with a credential broad enough to also cancel or modify records, so a manipulated 'lookup' call becomes a write — the credential boundary failing. A shell or file-write tool runs directly against a host with unrestricted network reach and no isolation from other workloads, so any single compromised reasoning step becomes a host-level compromise rather than a contained one — the execution-environment boundary failing. And a tool call is logged only as 'tool X invoked at time Y' with no record of what content was in the agent's context when it decided to call it, so a reviewer investigating an unexpected action afterward cannot reconstruct whether it was legitimate or injected — the audit boundary failing.",
    "What makes this threat model structurally different from a threat model built for a deterministic pipeline is the first boundary: a human reviewer evaluating a pull request is not at risk of being persuaded, by a comment embedded in that pull request, to approve its own merge. A model reasoning over the same content can be. Every other boundary below — tool scope, credentials, sandboxing, logging — exists in large part because the first one cannot be fully closed, only contained.",
  ],
  mainContent: [
    "**Start from a tool inventory, not an agent-level judgment.** Before evaluating anything else, list every tool the agent can call and, for each one, record what it can read, what it can write or execute, what credential or identity it authenticates as, and its blast radius and reversibility if misused. This inventory is the actual unit of threat modeling here — 'the agent' is not a single risk, it is the sum of what its tools can reach, and two deployments of the same underlying model with different tool grants have different threat models even if every other configuration detail is identical.",
    "**Treat everything the agent processes as untrusted input, not just the task description.** A fetched web page, a file the agent was asked to summarize, the output of an earlier tool call in the same session, and an issue or document description from a source the operator doesn't fully control are all capable of containing text that reads, to the model, like an instruction. This is what OWASP's Excessive Agency category (the current OWASP Top 10 for LLM Applications' LLM06:2025 entry) describes as risk arising from a model's granted functionality, permissions, or autonomy combined with unexpected or manipulated input — the failure isn't that the model was 'tricked' in some exotic sense, it's that nothing structurally distinguished operator intent from ingested content in the first place.",
    "**Apply least privilege at the level of the individual tool's credential, not the agent as a whole.** 'The agent only needs to read customer records' is a description of intended use, not a security boundary, if the credential behind that tool can also write or delete. Scope each tool's credential to the narrowest capability that tool's stated purpose requires — a read-only key for a read-only tool, a credential limited to one resource or namespace rather than an account-wide grant — so that a manipulated call to that specific tool is bounded by what the credential can do, not by what the model's judgment was supposed to prevent it from doing. This mirrors the same principle NIST SP 800-53's AC-6 (Least Privilege) applies to any system identity: scope the credential to the task, not to the broadest access convenient to provision once.",
    "**Reserve human-approval gates for the specific high-risk actions the tool inventory identifies — and enforce them outside the agent's own output.** Once the inventory marks a tool as high blast-radius or hard-to-reverse, that is the signal to require a human approval before it executes, not a blanket 'ask before doing anything risky' instruction living in the system prompt. An instruction is advice the model's own context can compete with and lose to; a structural gate — a broker or policy layer that intercepts the call independently of what the agent decided — is a control. This guide identifies which actions need that treatment; the mechanics of building a gate that actually holds against a manipulated agent (binding approvals to the exact action, failing closed, planning rollback per tool) are covered in depth in the companion article 'Designing Human Approval Gates for AI Agents' rather than repeated here.",
    "**Contain what scoping and approval gates don't fully prevent with execution isolation.** A sandboxed or isolated execution environment for shell and file-write tools limits what a single compromised reasoning step can additionally reach — it does not, by itself, stop the agent from misusing a credential it was legitimately given access to inside that sandbox. Isolation and credential scoping solve different problems: isolation bounds what an unexpected escape from the intended tool surface can touch (the host, other workloads, unrelated network destinations); scoping bounds what the intended tool surface itself can do even when used exactly as designed but on manipulated input. A deployment needs both, because neither substitutes for the other.",
    "**Log tool calls for reconstruction, not just occurrence.** A record that a tool was invoked at a given time is an observation; a record that also captures the relevant content in the agent's context at that moment, the classification the call received, and whether approval was required and granted is what lets a reviewer actually determine, after the fact, whether an unexpected action was legitimate or the result of manipulated input. This distinction matters specifically because of the input-boundary problem above: without knowing what the agent had read before it acted, 'the tool call succeeded' and 'the tool call succeeded because of injected content' are indistinguishable in a thin log. NIST SP 800-53's AU-2 (Event Logging) and AU-6 (Audit Record Review, Analysis, and Reporting) describe the same general discipline — log what's needed to review, and actually review it — applied here to a system whose failure mode is specifically about what it read, not just what it did.",
    "**Record every identified threat as mitigated, planned, or an accepted residual risk — never leave it unexamined.** For each tool in the inventory, the threat model should resolve to: an existing control with evidence (this credential is scoped, verified how), a planned control with an owner and a date, or an accepted risk with a named approver who understood the tradeoff. A tool granted 'because the guardrail cheat sheet says to add guardrails' with no specific answer to 'what does this credential actually reach' has not been threat modeled — it has been assumed safe.",
  ],
  validationEvidence: [
    "This guide describes a threat-modeling method and fictional illustrative tools; it does not reproduce a specific agent framework's configuration, a completed red-team exercise against a real deployment, or captured incident data. Its evidence state is UNVERIFIED, and the recommendations should be treated as a starting checklist to adapt and verify against your own agent's actual tool inventory, not as a validated result.",
  ],
  limitations: [
    "This guide addresses the tool-access attack surface of an already-deployed or about-to-be-deployed agent: what its tools can reach and how to bound that. It does not cover model-level or training-time mitigations for prompt injection (input sanitization research, adversarial training, guardrail-model approaches) in depth — that is a related but separate line of defense this guide does not evaluate.",
    "It does not fully cover multi-agent orchestration, where one agent's output becomes another agent's input and the trust-boundary analysis compounds across hops; that scenario deserves its own threat model built on the same method, not a one-paragraph extension here.",
    "The tool inventory and blast-radius classification described here are necessarily specific to what an individual deployment's agent can actually reach — they have to be built and reviewed for that deployment, not adopted from this guide's fictional examples.",
    "This guide identifies where a human-approval gate belongs; it deliberately does not re-cover how to design that gate so it holds against a manipulated agent — see 'Designing Human Approval Gates for AI Agents' for that narrower, already-published topic.",
  ],
  defensiveRecommendations: [
    "Maintain a current tool inventory for every agent deployment: what each tool reads, writes, or executes, what credential it authenticates as, and its blast radius and reversibility — reviewed as a versioned decision, not re-derived informally when someone asks.",
    "Treat fetched content, file contents, and prior tool output as untrusted input capable of steering the agent's next action, and design every downstream control assuming that content, not just the task description, can attempt to trigger a tool call.",
    "Scope each tool's credential to that tool's narrowest stated purpose — a read-only key for a read tool, a resource- or namespace-limited grant rather than an account-wide one — so a manipulated call is bounded by what the credential can do.",
    "Require human approval, enforced structurally outside the agent's own output, for every tool the inventory classifies as high blast-radius or hard to reverse; do not rely on a system-prompt instruction alone.",
    "Run shell- and file-write-capable tools inside an isolated execution environment scoped to that agent's session, and do not assume isolation makes credential scoping unnecessary or the reverse.",
    "Log tool calls with enough context — the relevant content in the agent's context, the classification the call received, whether approval was required and granted — to reconstruct after the fact why an action happened, not just that it happened.",
    "Resolve every identified threat to a documented mitigation, a planned fix with an owner, or an accepted risk with a named approver, and revisit the inventory whenever a tool, credential, or reachable system changes.",
  ],
  keyTakeaways: [
    "An AI agent's threat model is a function of its actual tool inventory — what each tool reads, writes, executes, and authenticates as — not a single property of 'the agent' as a whole.",
    "Prompt injection means content the agent merely processes is part of the attack surface; a threat model built only against the operator's own task description misses the boundary that makes agent threat modeling different from modeling a deterministic pipeline.",
    "Least privilege has to apply at the individual tool-credential level, and execution sandboxing solves a different problem than credential scoping does — a deployment needs both, and neither substitutes for the other.",
    "Human-approval gates belong on the specific high-risk actions the tool inventory identifies, enforced structurally rather than by instruction; see the companion article for how to design a gate that actually holds against a manipulated agent.",
  ],
  references: [
    "OWASP AI Agent Security Cheat Sheet — least-privilege tool scoping, risk-classified human-in-the-loop approval, execution isolation, and structured audit logging for agent tool calls: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html",
    "OWASP Top 10 for LLM Applications, LLM06:2025 Excessive Agency — risk from granting an LLM-based system excessive functionality, permissions, or autonomy over its tools: https://genai.owasp.org/llmrisk/llm062025-excessive-agency/",
    "MITRE ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems) — knowledge base of adversary tactics and techniques against AI systems: https://atlas.mitre.org/",
    "NIST AI 600-1, Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence",
    "NIST AI 100-1, Artificial Intelligence Risk Management Framework (AI RMF 1.0): https://www.nist.gov/itl/ai-risk-management-framework",
    "NIST SP 800-53 Rev. 5, controls AC-6 (Least Privilege), AU-2 (Event Logging), and AU-6 (Audit Record Review, Analysis, and Reporting): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "CISA, NSA, FBI, and international partners, Joint Guidance on Deploying AI Systems Securely: https://www.cisa.gov/news-events/alerts/2024/04/15/joint-guidance-deploying-ai-systems-securely",
  ],
  relatedSlugs: [
    "human-approval-gates-for-ai-agents",
    "least-privilege-for-pipeline-identities",
    "threat-modeling-cicd-pipeline",
    "logs-are-not-proof-verifying-automated-actions",
  ],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A complete list of every tool the agent can currently call, including any generic or general-purpose tool (a shell, a broad HTTP fetch capability) whose effective reach may not be obvious from its name.",
    "Access to each tool's actual credential or identity configuration — not just its documented intended use — so the tool inventory can record what it can really do rather than what it's meant to do.",
    "Authority, or a documented path to someone with authority, to change tool scoping, credential grants, or the execution environment a tool runs in.",
    "Willingness to record 'we don't know what this credential can reach' as an explicit finding rather than assuming a tool is safe because its name sounds narrow.",
  ],
  procedure: [
    "Build the tool inventory: for every tool the agent can call, record what it reads, what it writes or executes, the credential or identity it authenticates as, and its blast radius and reversibility if misused on the wrong target.",
    "For each tool, verify the credential's actual scope against the tool's stated purpose — not the other way around. A tool named for a narrow action but backed by a broad credential is a finding, not a detail to note and move past.",
    "Identify every input source that reaches the agent's context without full operator control — fetched web content, ingested documents, prior tool output, third-party task or ticket descriptions — and treat each as a potential source of injected instruction for every tool the agent can call, not only the tools that source is nominally related to.",
    "For each tool classified as high blast-radius or hard to reverse, confirm a human-approval requirement is enforced structurally (a broker or policy layer independent of the agent's own output), not only as a system-prompt instruction. Where none exists yet, treat adding one as the first remediation, using the companion article's design pattern rather than improvising a new one.",
    "Confirm shell- and file-write-capable tools execute inside an environment isolated from other workloads and from network destinations the agent's task doesn't require, and record what that isolation would and would not contain if a specific tool call turned out to be malicious.",
    "Confirm tool-call logging captures enough context to reconstruct intent after the fact — not just that a call happened, but what content was present in the agent's context, how the call was classified, and whether approval was required and granted.",
    "Resolve every identified gap to a mitigation with evidence, a planned fix with an owner and date, or an accepted risk with a named approver; re-run the inventory whenever a tool, credential, or reachable system changes.",
  ],
  validation: [
    "Confirm, for a sample of tools, that the credential each one authenticates as cannot perform an action beyond that tool's stated purpose — attempt the out-of-scope action in a lab or non-production context and confirm it is rejected by the credential's own scope, not merely undocumented.",
    "In a non-production or lab context, attempt to steer the agent toward a high-risk tool call through injected content in a source it processes (a fetched document, a tool-output string) and confirm any structural approval gate blocks the call regardless of what the agent's own output claims it decided.",
    "Confirm an isolated execution environment for shell or file-write tools actually restricts reach beyond the agent's intended targets — attempt, in a lab context, to reach an unrelated resource from inside that environment and confirm it is blocked.",
    "Review a sample of tool-call logs and confirm a reviewer could determine, from the log alone, what content in the agent's context preceded the call — not only that the call occurred.",
    "Where a control could not be tested directly (no lab environment, no authorized way to simulate injected content), record that explicitly as UNVERIFIED rather than assuming the control holds because it was configured that way.",
  ],
  rollback: [
    "If a review finds a credential broader than its tool's stated purpose, narrow the credential and treat the discovery as scoped, article-relevant remediation — do not describe the specific finding in any public material until it is corrected and reviewed, per the publication-safety policy.",
    "If tightening a tool's scope or credential breaks a legitimate workflow, redesign the workflow around a narrower, genuinely limited credential rather than reverting to a broad one for convenience.",
    "If adding a structural approval gate for a high-risk tool blocks a time-sensitive legitimate use, add a documented, narrow, logged exception path rather than removing the gate or falling back to an instruction-only guardrail.",
    "Keep a record of when each tool's scoping, isolation, and logging were verified versus assumed, so a later reviewer can tell what has actually been tested from what was configured and never re-checked.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Threat Modeling AI Agents with Tool Access",
    slug: "threat-modeling-ai-agents-tool-access",
    summary:
      "A method for threat modeling an AI agent's tool-access attack surface — file writes, shell commands, network calls, API keys — by enumerating its tool inventory as trust boundaries and mapping each identified threat to least privilege, human-approval gates, audit logging, or execution sandboxing.",
    pillar: "build-securely",
    primaryCategory: "ai-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["ai-security", "threat-modeling", "least-privilege", "access-control"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 13,
    publishedAt: "2026-09-03",
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
