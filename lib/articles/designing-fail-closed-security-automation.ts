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
    "Fail-open and fail-closed are usually described as if a system simply chooses one — a policy decision made once and applied everywhere. In practice, that behavior is not chosen at the policy level at all; it falls out of how each individual code path handles the moment a check cannot complete. A dependency times out. An exception is thrown somewhere in the call chain. A response never arrives. What happens next was decided — deliberately or not — by whichever branch of code happens to run when that moment occurs, and unless that branch was written to deny by default, it almost always allows by default instead.",
    "This deep-dive explains why that asymmetry exists structurally, not just as a pattern of individual mistakes: the ordinary defaults of exception handling, boolean initialization, and permissive branching all point toward allow, so a system that intends to fail closed but doesn't design for it deliberately will fail open in practice, gradually and mostly invisibly. It then lays out a structural approach — explicit allow-lists instead of deny-lists, and treating 'the check could not be completed' as a distinct third outcome that itself denies — and closes with the case where fail-closed is the wrong instinct: a control whose own failure mode can turn a minor dependency blip into a total outage, and how to reason about that tradeoff on purpose instead of by default in either direction.",
  ],
  whatYouWillLearn: [
    "The structural difference between fail-open and fail-closed automation — not as two named policies, but as two default resolutions of the same underlying event: a check that could not be completed.",
    "Why systems drift toward fail-open more often than their designers intend, and the four concrete mechanisms responsible: uncaught exceptions, permissive default branches, 'temporary' bypass logic that outlives its justification, and timeouts that assume the safe outcome.",
    "Why a deny-list approach is structurally unable to fail closed against anything it wasn't written to anticipate, and why an allow-list approach can be — and the difference is not stylistic, it's what happens automatically when neither list matches.",
    "How to treat 'cannot determine' as a distinct third outcome from allow and deny, so that outcome has to be handled explicitly rather than falling through to whatever a language's or framework's untouched default happens to be.",
    "When fail-closed is the wrong default: a control whose own failure would cause a worse outage than the risk it defends against, and how a circuit breaker or health check changes that tradeoff without quietly becoming a permanent fail-open bypass.",
  ],
  intendedAudience: [
    "Security practitioners designing or reviewing an automated control — an authorization check, a policy gate, an admission controller — that depends on an external decision source.",
    "Platform engineers who own the availability of a system that enforces a security decision and need to reason about what that system does when its own dependency is unhealthy.",
    "Technical leads deciding, for a specific control, whether fail-closed or fail-open is the deliberately correct default — not assuming one is always right.",
  ],
  prerequisites: [
    "Familiarity with the general shape of an authorization or policy check: something evaluates a request and returns a decision that a separate component enforces.",
    "Basic exposure to exception handling and timeout behavior in a typical request-handling code path.",
    "No lab environment is required — every example in this deep-dive is fictional and descriptive, not a runnable exercise.",
  ],
  problem: [
    "Teams frequently describe a security control as 'fail closed' as though that were a single global property of the system, decided once and enforced everywhere. It isn't. Fail-closed behavior is the sum of many individual decisions — one per code path that can be interrupted before it reaches a conclusion — and each of those decisions is made by whoever wrote that specific branch, under whatever default their language, framework, or in-the-moment judgment happened to supply. A system can be fail-closed in the code path its designers thought hardest about and fail-open in three others nobody reviewed with the same scrutiny, and from the outside, both look identical until the day one of them fails.",
    "The deeper problem is that the ordinary defaults of software construction lean toward allow, not deny. An uninitialized or default-initialized boolean is usually falsy, and 'falsy' is often wired to mean 'not blocked.' An exception that isn't caught unwinds past whatever enforcement code was supposed to run next, and code that never runs enforces nothing. A conditional with no matching branch typically does nothing at all, which in an enforcement context means nothing was denied. None of this requires a careless engineer — it requires only that fail-closed behavior was never made structurally necessary, only intended.",
  ],
  threatModel: [
    "Consider a fictional platform team, referred to here as Larkfield Systems, operating an internal request gateway in front of a sensitive administrative endpoint. Before forwarding any request to that endpoint, the gateway calls a separate, external decision source — a policy service that evaluates the request against current authorization rules and returns allow or deny. This deep-dive's scenarios are about what the gateway does when that call does not return a usable answer, not about an adversary attacking the policy service directly.",
    "Relevant failure-mode scenarios, not adversary actions: (1) the gateway's client library throws an unhandled exception when the policy service's connection times out; the exception unwinds past the line that would have set the request to denied, and the request handler's outer boolean — initialized to permitted before the call, following an established local convention of 'assume yes, prove otherwise' — is never overwritten, so the request proceeds; (2) during a past incident where the policy service was briefly overloaded, an on-call engineer added a short-circuit that let requests through whenever the policy call exceeded 500 milliseconds, intending to remove it once the incident closed — the removal was never done, and eighteen months later the 500-millisecond bypass is a permanent, undocumented fail-open path nobody currently on the team is aware exists; (3) the gateway's request-filtering logic is written as a deny-list of known-bad request patterns, and anything that doesn't match a known-bad pattern — including a request the policy service was never successfully consulted about at all — passes by construction, because 'not matched' and 'not evaluated' produce the identical outcome in a deny-list design; (4) after the previous three issues are fixed and the gateway now denies by default on any policy-service failure, a routine deployment briefly restarts the policy service, and every in-flight request across the platform is denied for the duration — the fail-closed control produced a self-inflicted total outage broader than any single unauthorized request the control was meant to prevent, because it had no circuit breaker or health check to distinguish 'the service is compromised' from 'the service is warming up.'",
    "Out of scope for this deep-dive: distributed-consensus and Byzantine-failure models, where a decision source might return a wrong answer with high confidence rather than no answer at all; the internal design of a specific circuit-breaker or service-mesh product; and any evaluation of a real organization's actual authorization architecture. Larkfield Systems is illustrative throughout, not a reference architecture.",
  ],
  mainContent: [
    "**A check that cannot complete is a third outcome, not a missing one.** Most descriptions of an authorization decision assume exactly two outcomes: allow or deny. In reality there is always a third possibility — the check could not be completed at all, for any reason — and every real system produces that outcome regularly: a network partition, a dependency restart, a timeout, an unhandled exception, a malformed response the parser can't interpret. The structural mistake is not usually failing to imagine this outcome; it's modeling the decision as a boolean and letting the third outcome collapse silently into whichever of the two the boolean's default happens to represent. A boolean has no room for 'unknown' — it is always already true or false the moment it's declared, before the check has even run. Whatever that starting value is has effectively already made the decision for every code path that fails to reach its own explicit assignment.",
    "**Why the collapse points toward allow more often than toward deny.** Four concrete mechanisms account for most of it, and each is ordinary, unremarkable code, not a lapse in judgment. First, an uncaught exception: enforcement logic that runs *after* a call to the decision source — 'get the decision, then act on it' — is skipped entirely if that call throws, and skipped enforcement denies nothing. Second, a permissive default branch: a conditional or switch statement with no explicit handling for the failure case falls through to whatever happens after the statement, which in most languages is simply 'continue,' not 'stop.' Third, 'temporary' bypass logic: a shortcut added under incident pressure to restore availability, justified at the time by an emergency that has since ended, but with no expiry mechanism, no owner, and often no record connecting it back to the incident that justified it — it becomes permanent by default, because removing code requires someone to notice it and decide to act, while leaving it requires nothing. Fourth, timeouts that assume the safe outcome: a timeout is fundamentally a statement of ignorance — 'no answer arrived in time' — and treating that as equivalent to 'the answer was probably fine' substitutes an assumption about likely conditions for the actual verification the control exists to perform.",
    "**Deny-lists cannot fail closed against what they weren't written to name; allow-lists can.** A deny-list defines what is forbidden and permits everything else by omission — which means its coverage is only ever as complete as the list of things its authors thought to write down, and every request that doesn't match an entry is treated as fine, whether that's because it genuinely is fine or because it's a case nobody anticipated, or because the check that would have classified it never ran at all. An allow-list inverts this: it defines what is permitted, and anything that doesn't match an entry — a genuinely new pattern, an unanticipated case, or a request the check couldn't classify because a dependency was unavailable — is denied by the same mechanism, with no separate 'unknown' handling required. This is not a claim that allow-lists are more convenient (they usually require more maintenance, since every legitimate new case has to be added explicitly) — it's a structural claim: an allow-list fails closed by construction, because 'not on the list' and 'the list couldn't be checked' both resolve to the identical, already-denying outcome. A deny-list fails closed only by discipline, because someone has to have separately written code to handle the case where the deny-list itself couldn't be evaluated.",
    "**Modeling 'cannot determine' as its own outcome, not a fallback path.** The most direct fix for the collapse described above is refusing to represent a decision as a two-valued boolean at all. A decision function that can return Allow, Deny, or Indeterminate — as an explicit, distinct value, not a caught exception that a caller might forget to handle — forces every call site to decide what Indeterminate means for that specific call, rather than inheriting whatever a language's exception-propagation or default-initialization rules happen to produce. The design discipline that matters is narrow and specific: Indeterminate must map to Deny at the enforcement boundary, and that mapping has to be the default behavior of the type itself — through a compiler-enforced exhaustive match, a wrapper type with no unchecked 'unwrap to allowed' method, or an equivalent structural guarantee — not a convention that every future call site is expected to remember and re-implement correctly on its own.",
    "**Where fail-closed becomes the wrong default.** None of the above argues that every control should fail closed unconditionally. A control's own failure is itself an event with a blast radius, and for some controls, that blast radius is worse than the risk being defended against — an authentication gateway with no tolerance for its decision source being briefly unavailable doesn't protect a system so much as hand that dependency's uptime direct control over the whole platform's availability, turning a routine restart into a full outage. The distinction that matters is between the per-decision default (what happens to *this* request when the check can't complete — this should almost always deny) and the system-level response to sustained unavailability (what the gateway does when the decision source has been unreachable for an extended, defined period — this is a deliberate design question, not a foregone conclusion). A circuit breaker or health check exists precisely to separate these two questions: it lets the gateway keep denying individual requests immediately during a brief blip (fail-closed, per-request), while giving the operators a monitored, time-boxed, and — critically — visible mechanism to deliberately shift to a documented degraded mode if unavailability persists past a threshold they set in advance, rather than an undocumented bypass someone adds during the incident and never removes.",
    "**The tradeoff has to be reasoned about per control, not defaulted either way.** 'Always fail closed' and 'always fail open' are both a refusal to do the actual analysis: what does this specific control protect, what does an attacker gain from its temporary absence, and what does the rest of the platform lose if this control's dependency briefly failing takes the whole platform down with it? A control gating access to a low-sensitivity internal dashboard and a control gating access to a system capable of exfiltrating customer records are not the same decision, even though both might call an identical-looking policy service. The point of building in a circuit breaker is not to make fail-open acceptable by default — it's to make the deliberate, monitored, reversible version of degraded availability the only path that exists, instead of leaving that decision to whichever engineer is on call when the dependency next has a bad day.",
  ],
  validationEvidence: [
    "This deep-dive describes the structural mechanism behind fail-open and fail-closed behavior and a fictional illustrative scenario; it does not include a reproduced incident, a captured system trace, or a completed assessment of a real control. Its evidence state remains UNVERIFIED — the technical claims are grounded in the cited standards, weakness classification, and design-pattern references, not in an exercise performed for this article.",
  ],
  limitations: [
    "This deep-dive covers the structural design of a single control's failure behavior; it does not cover distributed-consensus failure modes, where a decision source can return a confidently wrong answer rather than no answer at all — a different and harder problem than the one addressed here.",
    "It does not specify the configuration syntax or operational tuning of any particular circuit-breaker library, service mesh, or health-check product — the pattern is described architecturally, not as an implementation guide for a specific tool.",
    "The fictional Larkfield Systems scenario is illustrative, not a reference architecture. A real organization's blast-radius analysis for any specific control must be derived from that control's own criticality and dependencies, not copied from this deep-dive.",
    "This deep-dive does not cover incident response once a fail-open condition has already been exploited, or the monitoring and alerting design needed to detect one in progress — both are addressed elsewhere in this catalog's detection and incident-response content.",
  ],
  defensiveRecommendations: [
    "Model every decision point that depends on an external check as three-valued — Allow, Deny, Indeterminate — rather than a boolean, and make Indeterminate collapse to Deny at the enforcement boundary by construction, not by convention every call site has to remember.",
    "Prefer an explicit allow-list over a deny-list wherever the set of legitimate cases is enumerable, specifically because an allow-list fails closed against an unanticipated case by the same mechanism that handles a known-bad one — a deny-list requires separate, additional code to achieve the same result.",
    "Audit exception-handling paths around every security decision specifically for what happens when the call throws before reaching its intended assignment — an uncaught exception that skips an enforcement branch is functionally identical to a permissive default, even though nothing about the code looks permissive.",
    "Treat every 'temporary' bypass added under incident pressure as an open, tracked, expiring item from the moment it's introduced, with an owner and a removal date recorded at the time — not as something to clean up later, which in practice usually means never.",
    "Separate the per-request default (deny immediately when a check can't complete) from the system-level response to sustained unavailability (a monitored, time-boxed degraded mode reached only through a circuit breaker or health check with a defined threshold) — never let the second one exist as an undocumented side effect of the first.",
    "For each control, explicitly reason about and record which failure mode is worse — an unauthorized request slipping through, or the control's own unavailability taking down the system it protects — instead of applying 'fail closed' or 'fail open' as a blanket default across every control in a platform.",
  ],
  keyTakeaways: [
    "Fail-open and fail-closed are not a policy choice made once — they're the sum of what every individual code path does when a check can't complete, and the ordinary defaults of exception handling, boolean initialization, and permissive branching all lean toward allow.",
    "A deny-list can only fail closed against cases its authors wrote down; an allow-list fails closed by construction against anything unlisted, including a case the check itself couldn't classify.",
    "'Cannot determine' is a distinct third outcome from allow and deny. Modeling it as its own explicit value — one that collapses to Deny by construction, not by convention — is the structural fix for silent fail-open drift.",
    "Fail-closed is not the universally correct default: a control whose own failure causes a worse outage than the risk it defends against needs a circuit breaker or health check that separates immediate per-request denial from a deliberate, monitored, time-boxed degraded mode — reasoned about per control, not defaulted either way.",
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
};

const module_: DeepDiveModule = {
  kind: "deep-dive",
  architecture: [
    "The gateway is the enforcement point: it never decides allow or deny itself, it only enforces whatever a separate decision source returns. This separation is deliberate — it keeps the policy logic centralized and updatable — but it also means the gateway's behavior during the decision source's unavailability is entirely a property of the gateway's own code, not of anything the decision source does.",
    "The decision source (a policy engine, entitlement service, or similar external dependency in this fictional architecture) is called synchronously on the request path. Its normal output is a definite Allow or Deny; its failure mode — timeout, exception, unreachable network path — produces no usable output at all, which is the third outcome this deep-dive is built around.",
    "A circuit breaker, where present, sits between the gateway and the decision source, tracking the decision source's recent health and changing the gateway's behavior only after failures cross a defined, monitored threshold — not on the first failure, and not silently. Its presence is what allows the per-request default (deny on failure) and the system-level response to sustained unavailability (a deliberate degraded mode) to be two separate, separately reasoned-about decisions instead of one undifferentiated default.",
    "None of this requires the decision source and the gateway to share a fate: the gateway can be highly available even while denying every request, because denying is a decision the gateway can make locally and instantly, without needing the decision source to be healthy at all. Fail-open behavior is never necessary for the gateway's own availability — it only ever trades away the control's integrity for the decision source's convenience.",
  ],
  trustBoundaries: [
    "The boundary between the gateway and the decision source is where the third outcome actually lives — every request that crosses this boundary either gets a definite answer or it doesn't, and what happens on 'it doesn't' is the entire subject of this deep-dive.",
    "The boundary the gateway enforces toward the protected resource is only as strong as its behavior on that first boundary's failure — a gateway that fails open toward the decision source has effectively removed itself as a boundary toward the resource behind it, regardless of how correctly it enforces a decision it did successfully receive.",
    "A circuit breaker introduces a third boundary: between 'this request failed' and 'this dependency is unhealthy enough to warrant a different system-level response.' Collapsing that boundary — letting a single failure trigger the same response as sustained unavailability, or vice versa — is exactly how a 'temporary' bypass becomes permanent, or how a brief blip becomes a full outage.",
    "The trust boundary a fail-closed control actually enforces is not 'this request is safe' — it's 'this request was denied because it was not affirmatively verified as safe, and the absence of verification was treated as equivalent to a negative result.' Conflating 'not yet verified' with 'verified safe' is the structural risk every mechanism in this deep-dive exists to prevent.",
  ],
  alternatives: [
    "A tri-state decision type (Allow / Deny / Indeterminate) enforced at the type-system level, so a caller cannot treat an Indeterminate result as either Allow or Deny without an explicit, visible branch — trading a small amount of additional call-site code for the elimination of silent collapse.",
    "A circuit breaker with a defined failure threshold and a monitored, time-boxed degraded mode, for controls where an unconditional fail-closed default would itself cause an outage disproportionate to the risk being defended against — trading a narrow, deliberate exposure window for platform-wide availability.",
    "A cached, short-lived last-known-good decision, used only while a circuit breaker's degraded mode is active and only for a bounded period, rather than either denying everything or allowing everything during sustained unavailability — a middle option that still requires the same deliberate, monitored activation as a circuit breaker, not an unconditional default of its own.",
    "Redundant decision sources evaluated with a fail-closed quorum (for example, requiring at least one of several independent policy replicas to return an explicit Deny before enforcing an Allow) — this reduces how often the third outcome occurs at all, rather than changing what happens when it does, and is a heavier architectural investment appropriate only for controls whose criticality justifies it.",
  ],
  tradeoffs: [
    "An allow-list trades ongoing maintenance burden (every new legitimate case must be added explicitly) for structural fail-closed behavior against anything unanticipated — a deny-list trades that maintenance burden away but only ever fails closed against cases someone thought to write down.",
    "An unconditional fail-closed default trades platform availability for control integrity — appropriate when the control's absence is the worse outcome, actively harmful when the control's own failure has a wider blast radius than the risk it defends against.",
    "A circuit breaker trades response-time complexity and an additional failure mode of its own (a misconfigured threshold that never trips, or trips too eagerly) for the ability to separate 'deny this one request' from 'this dependency is unhealthy enough to warrant a deliberate, visible change in system behavior' — worth the complexity for any control whose own failure could cause an outage, not worth it for a control where an unconditional fail-closed default is already the correct and sufficient answer.",
    "Modeling 'cannot determine' as an explicit third outcome costs more upfront design and code at every call site that consumes a decision, in exchange for removing the single most common structural cause of unintended fail-open behavior — an uncaught exception, an unset default, or a permissive fallthrough silently resolving to allow.",
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
    estimatedReadingMinutes: 13,
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
