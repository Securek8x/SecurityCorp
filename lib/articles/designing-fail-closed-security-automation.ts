// Knowledge-base article draft (Bead securitycorp-source-4zl.1).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is NOT wired into lib/knowledge-content.ts; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md. All examples describe a fictional
// organization and a fictional software component; no real code,
// repository, credential, system, employer detail, or unresolved real
// vulnerability appears anywhere in this file.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// `mcp__ruflo__workflow_run` invocation was attempted before drafting
// (workflow id workflow-1788201357328-hrwk9f, template "research"). A
// bounded `workflow_status` check showed the documented issue in CLAUDE.md:
// the workflow remained at 0% progress with a single pending "Execute"
// stage and returned no retrievable editorial output. This draft was
// therefore produced with the disclosed native fallback instead — separate
// sequential research, drafting, technical-verification, publication-safety,
// and final-editorial passes — not credited to Ruflo. Research for this
// draft used native WebSearch to verify (not invent) every citation below
// against its primary source (CWE, OWASP, NIST, and the originating
// description of the circuit-breaker pattern) before it was included. See
// the calling agent's final report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, DeepDiveModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const sections: UniversalSections = {
  executiveSummary: [
    "Fail-closed is not a setting you choose once. It is what each code path does when a security check cannot complete, and ordinary defaults (uncaught exceptions, booleans initialized to allowed, branches that fall through) resolve that moment to allow. To fail closed reliably, model \"cannot determine\" as its own outcome that denies by construction, prefer allow-lists, and use a monitored circuit breaker only for controls whose own outage is worse than the risk they guard.",
  ],
  prerequisites: [
    "The general shape of an authorization or policy check: one component decides, another enforces.",
    "Basic exception-handling and timeout behavior in a request-handling code path.",
    "No lab is required. Every example is fictional and descriptive.",
  ],
  problem: [
    "Teams often describe a control as \"fail closed\" as if that were one global property. It is the sum of many small decisions, one per code path that can be interrupted before it reaches a verdict. A system can deny correctly on the path its designers reviewed and allow on three paths nobody did, and both look identical until a dependency fails.",
    "Ordinary defaults lean toward allow. A default-initialized boolean is often wired to mean \"not blocked.\" An uncaught exception unwinds past the enforcement code, and code that never runs denies nothing. A conditional with no matching branch does nothing, which at an enforcement point means nothing was denied.",
  ],
  threatModel: [
    "The examples use a fictional team, Larkfield Systems, whose internal gateway calls an external policy service before forwarding requests to a sensitive administrative endpoint. The scenarios concern what the gateway does when that call returns no usable answer, not an attacker targeting the policy service.",
    "Four failures illustrate the pattern. (1) A connection timeout throws an unhandled exception that skips the line setting the request to denied, and the handler's flag, initialized to permitted by local convention, is never overwritten. (2) A 500-millisecond bypass added during a past overload incident was never removed; eighteen months later it is a permanent, undocumented fail-open path. (3) The gateway filters with a deny-list, so a request the policy service never evaluated passes exactly like one it approved. (4) After those fixes, a routine policy-service restart denies every in-flight request across the platform, because nothing distinguishes a compromised service from one that is warming up.",
  ],
  mainContent: [
    "**Treat \"cannot determine\" as a third outcome.** Every real check sometimes fails to complete: a partition, a restart, a timeout, an exception, a response the parser cannot read. Modeling the decision as a boolean lets that third outcome collapse into the boolean's starting value, which has already decided every code path that never reaches its own assignment.",
    "**Four ordinary mechanisms push the collapse toward allow.** An uncaught exception skips enforcement that runs after the decision call. A default branch with no failure case falls through to \"continue.\" A \"temporary\" bypass added under incident pressure has no owner or expiry, so it becomes permanent. A timeout treated as \"probably fine\" replaces verification with an assumption.",
    "**Prefer allow-lists where legitimate cases can be enumerated.** A deny-list permits everything it does not name, including cases nobody anticipated and requests the check never classified. An allow-list denies anything unlisted by the same mechanism, so \"not on the list\" and \"the list could not be checked\" both deny. Allow-lists cost more maintenance, but they fail closed by construction; a deny-list fails closed only if someone separately handles the case where it could not be evaluated.",
    "**Make Indeterminate deny by construction.** Return Allow, Deny, or Indeterminate as an explicit value rather than throwing, so every call site must handle the third case. Map Indeterminate to Deny at the enforcement boundary through the type itself (a compiler-enforced exhaustive match, or a wrapper with no unchecked path to \"allowed\"), not through a convention each future caller must remember.",
    "**Decide per control when fail-closed is the wrong default.** A control's own failure has a blast radius: a gateway that cannot tolerate a brief policy-service restart hands that dependency control over the platform's availability. Separate the per-request default, which should almost always deny, from the response to sustained unavailability, which is a design decision. A circuit breaker keeps per-request denial immediate during a blip and offers a monitored, time-boxed, visible degraded mode once unavailability passes a threshold set in advance, instead of an undocumented bypass added mid-incident.",
    "Make that call for each control. A low-sensitivity internal dashboard and a system that can exfiltrate customer records are different decisions, even when both sit behind the same policy service.",
  ],
  validationEvidence: [
    "This deep-dive describes a structural mechanism with a fictional scenario. It includes no reproduced incident, captured trace, or assessment of a real control. Its evidence state remains UNVERIFIED: the claims rest on the cited standards, weakness classification, and design-pattern references, not on an exercise performed for this article.",
  ],
  limitations: [
    "It covers a single control's failure behavior. Decision sources that return a confidently wrong answer (distributed-consensus and Byzantine failures) are a different, harder problem.",
    "It describes the pattern architecturally and does not cover configuring or tuning a specific circuit-breaker, service-mesh, or health-check product.",
    "Larkfield Systems is illustrative, not a reference architecture. Derive each control's blast-radius analysis from its own criticality and dependencies.",
    "It does not cover incident response after a fail-open path is exploited, or the monitoring needed to detect one; see the catalog's detection and incident-response content.",
  ],
  defensiveRecommendations: [
    "Model every decision that depends on an external check as Allow, Deny, or Indeterminate, and make Indeterminate deny by construction.",
    "Use an allow-list wherever the legitimate cases can be enumerated.",
    "Audit the exception paths around each security decision for calls that can throw before the enforcement assignment.",
    "Record every bypass added during an incident as a tracked item with an owner and a removal date at the moment it is added.",
    "Keep the per-request default (deny now) separate from the sustained-outage response (a monitored, time-boxed degraded mode behind a circuit breaker).",
    "For each control, record which failure is worse: an unauthorized request getting through, or the control's outage taking down what it protects.",
  ],
  references: [
    "Saltzer, J. & Schroeder, M. — The Protection of Information in Computer Systems (1975), the original statement of the fail-safe defaults principle: https://www.cs.virginia.edu/~evans/cs551/saltzer/",
    "CWE-636 — Not Failing Securely ('Failing Open'): https://cwe.mitre.org/data/definitions/636.html",
    "OWASP — Secure Product Design Cheat Sheet (fail securely): https://cheatsheetseries.owasp.org/cheatsheets/Secure_Product_Design_Cheat_Sheet.html",
    "NIST SP 800-53 Rev. 5 — Security and Privacy Controls for Information Systems and Organizations (see SC-24 Fail in Known State and SC-7(5) Deny by Default — Allow by Exception): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "Fowler, M. — CircuitBreaker (describing the pattern popularized by Michael Nygard's Release It!): https://martinfowler.com/bliki/CircuitBreaker.html",
  ],
  relatedSlugs: [
    "understanding-network-trust-boundaries",
    "securing-api-authentication-authorization",
    "designing-security-tests-for-failure-conditions",
  ],
  nextSlug: "designing-security-tests-for-failure-conditions",
};

const module_: DeepDiveModule = {
  kind: "deep-dive",
  architecture: [
    "The gateway only enforces; a separate decision source decides. What the gateway does when that source is unavailable is therefore a property of the gateway's own code.",
    "The decision source is called synchronously on the request path. It normally returns Allow or Deny; on a timeout, an exception, or an unreachable network path it returns nothing usable.",
    "A circuit breaker, where present, sits between the two and changes the gateway's behavior only after failures cross a defined, monitored threshold. Denying is a local, instant decision, so the gateway never needs to fail open to stay available.",
  ],
  trustBoundaries: [
    "Gateway to decision source: where the third outcome lives. A gateway that fails open here has removed itself as a boundary toward the resource behind it, however correctly it enforces the decisions it does receive.",
    "A single failure versus sustained unavailability: the boundary a circuit breaker adds. Collapsing it is how a temporary bypass becomes permanent, or a brief blip becomes a full outage.",
  ],
  alternatives: [
    "A tri-state decision type enforced by the type system: slightly more call-site code, no silent collapse.",
    "A circuit breaker with a defined threshold and a monitored, time-boxed degraded mode: a narrow, deliberate exposure window in exchange for platform-wide availability.",
    "A cached, short-lived last-known-good decision, used only while the breaker's degraded mode is active and only for a bounded period.",
    "Redundant decision sources with a fail-closed quorum: this reduces how often the third outcome occurs rather than changing what happens when it does, and is justified only for highly critical controls.",
  ],
  tradeoffs: [
    "An unconditional fail-closed default trades availability for integrity. It is right when the control's absence is the worse outcome and harmful when the control's own failure has the wider blast radius.",
    "A circuit breaker adds its own failure mode: a threshold that never trips, or trips too eagerly. Use one only where a control's outage could cause a broader outage.",
    "An explicit third outcome costs design and code at every call site, and removes the most common structural cause of unintended fail-open behavior.",
  ],
};

const diagram: FlowDiagramSpec = {
  titleId: "fail-closed-fail-open-diagram",
  title: "How a fail-closed gateway diverges from a fail-open one when its decision source is unavailable",
  desc: "A fictional request passes from a client to an enforcement gateway, which calls an external decision source before allowing the request through. Interactive: switch between the normal path, where the decision source responds and the gateway enforces a real decision, and the failure path, where the decision source does not respond in time and the same event diverges into two different outcomes depending on how the gateway was built: a fail-closed outcome that denies the request, and a fail-open outcome that silently allows it through a permissive default. Explore each node for details.",
  viewBox: "0 0 900 380",
  failureLabel: "Decision source unavailable",
  caption:
    "Request → gateway → external decision source → decision enforced, normally. In the failure view, the decision source does not respond in time, and the identical event produces two different results depending on the gateway's own construction: fail-closed denies the request by default; fail-open allows it through an uncaught exception, an unset default, or a leftover bypass.",
  motionDuration: 2600,
  mainPacketRoute: { d: "M150,180 H190 M360,180 H400 M590,180 H630", length: 120 },
  edges: [
    { id: "request-gateway", from: "request", to: "gateway", d: "M150,180 H190", length: 40, kind: "main", activeIn: ["normal", "failure"] },
    { id: "gateway-source", from: "gateway", to: "decisionSource", d: "M360,180 H400", length: 40, kind: "main", activeIn: ["normal", "failure"] },
    { id: "source-enforced", from: "decisionSource", to: "decisionEnforced", d: "M590,180 H630", length: 40, kind: "main", activeIn: ["normal"] },
    {
      id: "source-failclosed",
      from: "decisionSource",
      to: "failClosed",
      d: "M590,165 C610,165 610,75 630,75",
      length: 90,
      kind: "failure",
      activeIn: ["failure"],
    },
    {
      id: "source-failopen",
      from: "decisionSource",
      to: "failOpen",
      d: "M590,195 C610,195 610,305 630,305",
      length: 90,
      kind: "failure",
      activeIn: ["failure"],
    },
  ],
  nodes: [
    {
      id: "request",
      label: "Incoming request",
      x: 10,
      y: 150,
      w: 140,
      h: 60,
      activeIn: ["normal", "failure"],
      description:
        "A request to a sensitive endpoint in this fictional system, requiring an authorization decision before the gateway processes it further.",
    },
    {
      id: "gateway",
      label: "Enforcement gateway",
      x: 190,
      y: 145,
      w: 170,
      h: 70,
      activeIn: ["normal", "failure"],
      role: "boundary",
      focusableLabel: "Enforcement gateway — never decides allow or deny itself, only enforces whatever the decision source returns",
      description:
        "The enforcement point. It never makes the allow/deny decision itself — it calls the decision source and enforces whatever comes back. What it does when that call doesn't come back at all is the entire subject of this deep-dive, and that behavior lives entirely in this gateway's own code.",
    },
    {
      id: "decisionSource",
      label: "External decision source",
      x: 400,
      y: 145,
      w: 190,
      h: 70,
      activeIn: ["normal", "failure"],
      role: "boundary",
      focusableLabel: "External decision source — responds with a decision in the normal path; is unreachable in time in the failure path",
      description:
        "A policy engine or entitlement service the gateway calls on every request. In the normal path it responds inside its timeout and the gateway enforces that response. In the failure path it does not respond in time — a dependency timeout, an unhandled exception, an unreachable network path — leaving the gateway to decide what to do without an actual decision at all.",
    },
    {
      id: "decisionEnforced",
      label: "Decision enforced",
      x: 630,
      y: 150,
      w: 220,
      h: 60,
      activeIn: ["normal"],
      role: "safe",
      description:
        "The gateway enforces whatever the decision source actually returned — allow or deny. This is normal operation: the source was reachable and returned a real answer, so the gateway had a decision to enforce rather than one to assume.",
    },
    {
      id: "failClosed",
      label: "Fail-closed: request denied",
      x: 630,
      y: 40,
      w: 220,
      h: 70,
      activeIn: ["failure"],
      role: "safe",
      description:
        "Structural fail-closed behavior: the gateway treats 'cannot determine' as its own third outcome, distinct from and defaulting to deny — not silently mapped onto allow. The request is denied not because it was found malicious, but because the check that would have confirmed it was safe never completed.",
    },
    {
      id: "failOpen",
      label: "Fail-open: request silently allowed",
      x: 630,
      y: 270,
      w: 220,
      h: 70,
      activeIn: ["failure"],
      role: "blocked",
      focusableLabel: "Fail-open outcome — the same unavailable decision source, but a permissive default lets the request through unverified",
      description:
        "The same unavailable decision source, but the gateway's code has a permissive default — an uncaught exception that skips the enforcement branch, a boolean initialized to allowed before the call, or a 'temporary' bypass from a past incident that was never removed. The request is allowed through, and nothing about it was actually verified.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Designing Fail-Closed Security Automation",
    slug: "designing-fail-closed-security-automation",
    summary:
      "Why security automation drifts toward fail-open by default — uncaught exceptions, permissive branches, leftover bypasses, and timeouts that assume the safe outcome — and how to design a control that fails closed by construction: explicit allow-lists, treating 'cannot determine' as its own denying outcome, and a deliberate circuit breaker for the controls where fail-closed itself is the greater risk.",
    pillar: "defend-systems",
    primaryCategory: "security-architecture",
    contentType: "deep-dive",
    difficulty: "intermediate",
    status: "published",
    tags: ["fail-closed-design", "security-control-validation", "access-control", "threat-modeling"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 6,
    publishedAt: "2026-08-31",
    lastReviewedAt: "2026-08-31",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" },
  },
  sections,
  module: module_,
  diagram,
};
