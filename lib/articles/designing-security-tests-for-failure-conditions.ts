// Knowledge-base article draft (Bead securitycorp-source-4zl.54.1.8).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is NOT wired into lib/knowledge-content.ts; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md. All examples describe a fictional
// organization ("Amberwood Systems") and a fictional service; no real code,
// repository, credential, system, employer detail, or unresolved real
// vulnerability appears anywhere in this file.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// `mcp__ruflo__workflow_run` invocation was attempted before drafting
// (template "research", workflow id workflow-1788196573190-fc7cau). Two
// bounded `workflow_status` checks, roughly 20 seconds apart, both showed
// the documented issue in CLAUDE.md: the workflow remained at 0% progress
// with a single pending "Execute" stage and returned no retrievable
// editorial output. This draft was therefore produced with the disclosed
// native fallback instead — separate sequential research, drafting,
// technical-verification, publication-safety, and final-editorial passes —
// not credited to Ruflo. See the calling agent's final report for full
// editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const sections: UniversalSections = {
  executiveSummary: [
    "Conventional test suites are built around the happy path plus a handful of error cases the author already anticipated: a bad password returns 401, a missing field returns 400. Security-relevant behavior often lives specifically in the failure conditions nobody wrote a test for — what does an authorization check do when the service it depends on times out? What does a validation step do when an upstream service hands back a truncated response instead of a clean rejection? Most suites never ask, because nothing prompts anyone to write that test: the code has a try/catch, the endpoint doesn't crash, and a catch block that never specifies what should happen on failure looks, to a coverage tool and to a reviewer, indistinguishable from one that fails safely.",
    "This guide explains why that gap is systematic rather than a discipline failure, and lays out a deliberate practice for closing it: designing tests that inject exactly the failure conditions a conventional suite never triggers — dependency timeout or unavailability, malformed or truncated upstream responses, partial failure partway through a multi-step operation, and concurrent or racing requests around a single security decision — and asserting that the system fails closed, not merely that it didn't crash. A fictional document-approval endpoint, and its accompanying interactive diagram, runs through the guide so the mechanism stays concrete without describing any real application.",
  ],
  whatYouWillLearn: [
    "Why a conventional test suite's coverage of 'the happy path plus a few expected errors' systematically misses security-relevant failure conditions, and why that's a structural property of how test suites get written, not a discipline failure.",
    "The distinction between a test that asserts a system 'handled' an error — didn't crash, returned some response — and a test that asserts a system failed closed on that error: denied, rejected, or halted, rather than defaulting to permissive behavior.",
    "Four categories of failure condition worth deliberately injecting: dependency timeout or unavailability, malformed or truncated upstream responses, partial failure in a multi-step operation, and concurrent or racing requests around a security decision.",
    "How to design these tests without a live dependency or a real race — using controllable fakes, stubs, and synchronization primitives to make the injected failure condition reproducible on demand.",
    "Why the closed outcome has to be the explicit, named assertion for every one of these tests, not an assumption about what the code 'probably' does when something goes wrong.",
  ],
  intendedAudience: [
    "Developers writing or reviewing tests for any code path that makes a security-relevant decision — authorization, authentication, rate limiting, input validation — and depends on another service, a later step, or concurrent execution to make that decision correctly.",
    "Security practitioners reviewing test coverage or an application's resilience posture, evaluating whether 'we have tests' actually means the security-relevant failure paths are covered, not just the ones that were easy to imagine.",
    "QA and test engineers building test plans who want failure-condition injection to be a deliberate, repeatable practice rather than something that only happens after an incident.",
  ],
  prerequisites: [
    "Basic familiarity with automated testing: unit and integration tests, mocks, fakes, or stubs, and what a test assertion is.",
    "Basic familiarity with the idea of a security decision made in code — an authorization check, a rate-limit decision, a validation step.",
    "No lab environment is required — every example in this guide is fictional and descriptive, not a runnable exercise.",
  ],
  problem: [
    "A test suite with high line coverage and a consistently green CI run looks, from the outside, like a codebase whose behavior is well understood. Line coverage measures whether a line executed during some test, not what the test asserted happened when it did — and it says nothing about lines that only execute when a dependency fails, a response is malformed, or a request arrives concurrently with another one, conditions no test intentionally creates in the first place. A codebase can reach high coverage numbers while its failure branches — the ones a security decision actually depends on — have never once been exercised by anything other than a real production incident.",
    "The underlying failure is treating 'the code doesn't crash on error' as equivalent to 'the code makes the correct security decision on error.' They coincide when the error handling was written with the security property specifically in mind, and diverge whenever it was written with a different goal in mind instead — most commonly, keeping the endpoint from returning a 500 and staying available. A catch block, a default value, or a retry-then-fallback pattern is optimized for uptime by default; nothing about that pattern guarantees the fallback it reaches for is the safe one, and nothing in a conventional test run — which almost never triggers that catch block at all — would reveal it either way.",
  ],
  threatModel: [
    "Consider a fictional workflow application we'll call Amberwood Systems, reachable at `approvals.lab.example.com`. Authenticated users approve financial documents above a configured threshold through `POST /documents/{id}/approve`. Before approving, the endpoint calls an internal dependency we'll call the Entitlement Service to confirm the requesting user holds the entitlement level required for that document's amount, then — for over-threshold documents specifically — writes a mandatory compliance-notification record as a required part of the same approval operation.",
    "Relevant failure modes, not adversaries in the traditional sense: (1) the Entitlement Service becomes slow or unreachable under load, and the authorization code's timeout handler — written to keep the approval endpoint from hanging or returning a 500 — treats 'no answer arrived' as 'no entitlement information available, so allow the approval,' a default no conventional test ever exercises because no conventional test ever makes the dependency time out; (2) the Entitlement Service returns a truncated or malformed response — plausible during its own deploy, a partial network write, or load-shedding — and the parsing code, written to tolerate 'unexpected' data without crashing the endpoint, catches the parse failure and falls back to a default entitlement level rather than treating an unparseable answer as no answer at all; (3) the approval operation's mandatory compliance-notification step fails after the entitlement check has already passed and the approval has already been recorded — the user sees a successful approval, and the transaction as a whole is reported as complete despite the required compliance record never having been created; (4) two concurrent approval requests for the same document each independently read the document's 'not yet approved' state, each independently pass the authorization check, and both proceed to approve — bypassing a two-distinct-approvers, no-double-approval rule that was correctly written as a check-then-act sequence but was never protected against two requests reading that same stale state at once, a gap no test exercised because no test ever sent two requests at the same time.",
    "Out of scope for this guide: general chaos-engineering or production fault-injection practice, which operates on live systems rather than a test suite and is a related but separate discipline; fuzz testing of input or response shapes in general, since malformed and truncated responses are covered here narrowly as one category of dependency-failure injection rather than as an introduction to fuzzing; any specific test framework's, mocking library's, or concurrency-testing tool's syntax, since the guide is intentionally about the underlying practice rather than one ecosystem's API; and how to design the production fail-closed behavior itself, which this guide assumes the reader is testing for rather than implementing from scratch (though the defensive recommendations describe its shape).",
  ],
  mainContent: [
    "**A conventional test suite is shaped by what its author already imagined, and the failure conditions that matter most are exactly what they didn't imagine.** A developer writing a new authorization check reliably writes a test for the case they're building the check for — valid credentials, invalid credentials, maybe a malformed request. A dependency timing out, a dependency returning garbage instead of a clean error, a later mandatory step silently failing, two requests racing each other — these aren't oversights in the sense of 'the developer forgot a case they knew about.' They're conditions that were never in the author's mental model of 'the cases this code handles' in the first place, so nothing in the normal course of writing the feature prompts a test for them. That's the actual reason security-relevant failure conditions are systematically under-tested: not carelessness, but the simple fact that a test suite only covers what someone thought to write a test for, and these conditions are specifically the ones that don't occur to most authors unannounced.",
    "**'The code has a try/catch' is evidence a failure path won't crash the process — it is not evidence the failure path makes the correct security decision.** Error handling written for resilience and error handling written for security look identical at a glance: both wrap a risky call, both catch an exception, both return some value instead of propagating a stack trace to the caller. The difference is entirely in what value they return and why. A catch block optimized to keep an endpoint available under a flaky dependency reaches for whatever value lets the request complete — often a permissive default, because a permissive default is the one least likely to break a legitimate caller's day. A catch block optimized for the security property that call site exists to enforce reaches for the closed outcome instead, even though that means some legitimate callers will occasionally see a denial when the dependency is merely slow. Reading the code doesn't reliably tell you which goal it was written for; only a test that actually triggers the catch block and inspects what it returned does.",
    "**Fail open and fail closed name the two directions a failure can default toward, and 'it still works' is the wrong test for telling them apart.** A control fails open when its failure mode defaults to permissive behavior — access granted, validation skipped, rate limit not enforced — because the failure path was written (or defaulted) to preserve availability or convenience over the security property. A control fails closed when its failure mode defaults to restrictive behavior — access denied, request rejected, operation halted — because the failure path was written to preserve the security property even at the cost of availability. Both directions produce a response instead of a crash, both look, from a smoke test's perspective, like 'the endpoint handled the error.' The only way to tell which one a given piece of code actually does is to trigger the failure deliberately and inspect the specific outcome — which is precisely what a conventional test suite, built around the happy path, almost never does.",
    "**Dependency timeout or unavailability is the first category worth deliberately injecting.** Any security decision that calls out to another service — an entitlement lookup, a token-introspection endpoint, a fraud-scoring service — has an implicit answer to 'what happens if that call never returns.' Injecting this failure means configuring a fake or mock of the dependency to hang past the configured timeout, or to refuse the connection outright, and then asserting what the calling code decided: not whether it returned a response at all, but whether that response was the defined closed outcome.",
    "**Malformed or truncated upstream responses are the second category, and they're easy to miss because they look like a parsing bug rather than a security bug.** A dependency that answers on time but with an empty body, a truncated JSON payload, or a well-formed-but-semantically-invalid response is a realistic failure mode — a partial write during the dependency's own deploy, load-shedding, a version mismatch — not an exotic edge case. Injecting it means configuring the fake dependency to return exactly that kind of response and asserting the parsing and decision code treats an unparseable or invalid answer as a failure to authorize, rather than falling back to a default entitlement or permission level the way a resilience-minded catch block often does.",
    "**Partial failure in a multi-step operation is the third category, and it targets steps that are meant to be mandatory gates rather than optional side effects.** A multi-step security-relevant operation — approve, then log, then notify a compliance system — is only as strong as its weakest assumption about what happens when a later step fails after an earlier one has already succeeded. Injecting this failure means forcing a specific later step, particularly one that's supposed to be a required gate for a specific class of operation, to fail after the earlier steps have completed, and asserting the operation as a whole is treated as failed — rolled back, or explicitly and visibly flagged incomplete — rather than reported to the caller as a plain success because only the first step's outcome was checked.",
    "**Concurrent or racing requests around a single security decision are the fourth category, and they're the hardest to notice because the individual code often looks correct in isolation.** A check-then-act pattern — read the current state, decide based on it, then act — is exactly right for a single request at a time and exactly wrong the moment two requests can read the same 'before' state concurrently and each independently decide they're allowed to act. Injecting this failure means using a synchronization primitive — a barrier, a countdown latch, or an equivalent — to force two or more requests to overlap deterministically rather than hoping they happen to race by chance, then asserting that only the intended number succeeded and the rest received an explicit rejection rather than each independently believing it succeeded.",
    "**A failure-condition test's assertion has to name the specific closed outcome, not just 'no exception escaped.'** Confirming that an endpoint returned a response instead of crashing when its dependency times out demonstrates the code has error handling. It demonstrates nothing about which direction that error handling defaults to. A validated failure-condition test asserts the actual closed outcome by name: the response was a denial with the expected status, the compliance record's absence caused the whole operation to roll back rather than report success, only one of two concurrent approval attempts returned success and the other returned an explicit conflict. Anything less than that specific assertion is a test that a failure path exists, not a test that it fails closed.",
  ],
  validationEvidence: [
    "This guide is conceptual. It was not developed against a live or lab-reproduced application, no request or response traffic was captured, and no failure-condition test described here was implemented and run end-to-end. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the label must not be upgraded merely because the reasoning here is internally consistent.",
  ],
  limitations: [
    "This guide describes a testing practice and a fictional illustrative endpoint, not a specific test framework's, mocking library's, or concurrency-testing tool's API — those vary by language and ecosystem and have to be translated into the reader's own stack.",
    "It does not cover general chaos-engineering or production fault-injection practice, which operates on a live system rather than a test suite and carries its own separate safety and authorization requirements.",
    "It does not cover fuzz testing of input or response shapes as a general technique — malformed and truncated responses are addressed narrowly, as one category of dependency-failure injection.",
    "It does not cover how to design the production fail-closed behavior itself from first principles; it assumes the reader is testing an existing implementation to find where it doesn't fail closed, though the defensive recommendations describe the shape of the fix.",
  ],
  defensiveRecommendations: [
    "Treat any security-relevant code path that depends on another service, a later step, or concurrent execution as having an implicit failure-mode contract, and write down what 'closed' means for it before writing any failure-condition test.",
    "For every external dependency behind a security decision, add at least one test that injects a timeout or unavailability and asserts the decision defaults to deny, not merely that the call site returns without throwing.",
    "For every response parsed from an upstream service into a security decision, add at least one test that injects a malformed or truncated payload and asserts the decision defaults to deny rather than falling back to a permissive default value.",
    "For every multi-step operation where a later step is meant to be a mandatory gate — a required compliance, audit, or logging step — add a test that fails that step specifically and asserts the whole operation is treated as failed, not silently reported as complete.",
    "For every security decision that reads state and then acts on it, add a concurrency test that forces overlapping requests against the same initial state and asserts only the intended number of them succeed.",
    "Review 'resilience' error handling — retries, catch-and-continue, default fallback values — specifically for whether the default it falls back to is permissive; a fallback written to preserve uptime can silently become a fail-open security defect nobody chose deliberately.",
  ],
  keyTakeaways: [
    "Conventional test suites are shaped around the happy path plus errors the author already anticipated; the security-relevant failure conditions that matter most are usually exactly the ones nobody thought to write a test for.",
    "A try/catch or a default-value fallback is evidence a failure path won't crash the process — it is not evidence the failure path makes the correct security decision.",
    "The four categories worth deliberately testing are dependency timeout or unavailability, malformed or truncated upstream responses, partial failure in a multi-step operation, and concurrent or racing requests around a single security decision.",
    "A failure-condition test has to assert a specific closed outcome — access denied, operation rolled back, only one of several concurrent requests succeeded — not merely that no exception escaped.",
    "This is a deliberate practice layered onto a normal test suite, not a replacement for it — the happy-path suite still matters, it just isn't where these failure modes were ever going to show up.",
  ],
  references: [
    "CWE-636: Not Failing Securely ('Failing Open'): https://cwe.mitre.org/data/definitions/636.html",
    "CWE-703: Improper Check or Handling of Exceptional Conditions: https://cwe.mitre.org/data/definitions/703.html",
    "CWE-754: Improper Check for Unusual or Exceptional Conditions: https://cwe.mitre.org/data/definitions/754.html",
    "OWASP Top 10:2021 — A04:2021 Insecure Design: https://owasp.org/Top10/A04_2021-Insecure_Design/",
    "NIST SP 800-53 Rev. 5 — SC-24 Fail in Known State: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "OWASP Web Security Testing Guide: https://owasp.org/www-project-web-security-testing-guide/",
  ],
  relatedSlugs: ["sast-vs-dast-vs-software-composition-analysis", "securing-api-authentication-authorization", "input-validation-not-complete-control"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A documented list of every security-relevant decision point — an authorization check, a validation step, a rate limiter — that depends on an external service, a later step in a multi-step operation, or shared state that's read and then acted on under concurrency.",
    "A test harness capable of substituting a controllable fake or mock for each external dependency involved, one that can be configured on demand to hang past a timeout, return a malformed or truncated response, or fail outright — rather than relying on a live dependency for these tests.",
    "Where relevant, a synchronization primitive — a barrier, a countdown latch, or an equivalent — capable of forcing two or more requests to overlap deterministically, since a race reproduced only by chance is not a repeatable test.",
  ],
  procedure: [
    "For each security decision point identified in requirements, write down explicitly what 'fails closed' means for it — denied, rejected, rolled back, an explicit conflict response — before writing any failure-condition test. A test can't assert an outcome nobody defined.",
    "Inject a dependency timeout or unavailability: configure the fake dependency to hang past the configured timeout or refuse the connection, and assert the security decision defaults to the defined closed outcome, not merely that the call site returns without throwing.",
    "Inject a malformed or truncated upstream response: configure the fake dependency to return an empty body, a truncated payload, or a well-formed-but-semantically-invalid response, and assert the parsing and decision code treats it as a failure to authorize, not as a signal to fall back to a default entitlement or permission level.",
    "Inject a partial failure in a multi-step operation: force a specific later step — particularly a mandatory gate such as a required audit, compliance, or logging step — to fail after earlier steps have already succeeded, and assert the operation as a whole is treated as failed, rather than reported to the caller as successful.",
    "Inject a concurrent or racing condition around a security decision: fire two or more requests that read and act on the same initial state as close to simultaneously as the harness can force, and assert only the intended number of them succeed, with the rest receiving an explicit rejection rather than each independently believing it succeeded.",
    "For each of the four categories, confirm the corresponding happy-path behavior is unaffected — a fail-closed 'fix' that makes the code reject everything, including legitimate requests, is not a fix.",
    "Record which decision points received which categories of failure-condition test, and which still rely only on happy-path coverage, so a later audit can see the gap directly instead of assuming it's already covered.",
  ],
  validation: [
    "Confirm each dependency-timeout test asserts the defined closed outcome by name, not merely the absence of an unhandled exception.",
    "Confirm each malformed- or truncated-response test asserts a denial, not a fallback to a default permission level.",
    "Confirm each partial-multi-step-failure test asserts the operation as a whole is treated as failed, including verifying that a failed mandatory step (such as compliance logging) is not silently skipped while the rest of the operation reports success.",
    "Confirm each concurrency test asserts exactly the intended number of concurrent requests succeeded and that the remainder received an explicit rejection, not merely that no data corruption occurred.",
    "Confirm the happy-path suite still passes unchanged once the fail-closed behavior these tests assert is implemented — a suite that only passes by rejecting all traffic has validated fail-broken, not fail-closed.",
  ],
  rollback: [
    "If a newly added failure-condition test reveals an actual fail-open defect, treat it as a defect to fix in the production code, not as a reason to weaken or remove the test — the test did exactly what it was designed to do.",
    "If a concurrency test is flaky because the synchronization primitive doesn't reliably force an overlap, fix the harness's synchronization rather than loosening the assertion or discarding the test.",
    "If injecting a partial-step failure leaves shared test fixtures in an inconsistent state between runs, isolate the fixture — a fresh instance or transaction per test — rather than skipping the failure-injection step to avoid the cleanup work.",
  ],
};

const diagram: FlowDiagramSpec = {
  titleId: "security-test-failure-injection-diagram",
  title: "Injecting a dependency timeout into an authorization check, and the two outcomes it can produce",
  desc: "A fictional document-approval endpoint calls an external Entitlement Service before approving. Interactive: toggle between the normal path, where the dependency responds in time and the authorization check is enforced correctly, and a failure-condition test path, where the test deliberately injects a dependency timeout — revealing two possible outcomes side by side: failing closed, where the check correctly denies access when no answer arrives, and failing open, where a resilience-minded timeout handler silently defaults to granting access instead. Explore each node for detail.",
  viewBox: "0 0 900 400",
  failureLabel: "Inject dependency timeout",
  caption:
    "Approval request → authorization check → Entitlement Service call → access decided correctly, once the dependency responds in time. The failure-condition-test view shows what happens when the test deliberately makes that dependency call time out instead: a correctly designed check fails closed and denies access, while a resilience-minded timeout handler that was never tested against this condition fails open and grants access by default.",
  motionDuration: 2700,
  mainPacketRoute: { d: "M160,170 H190 M370,170 H410 M600,170 H650", length: 120 },
  edges: [
    { id: "request-authCheck", from: "request", to: "authCheck", d: "M160,170 H190", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "authCheck-entitlementService", from: "authCheck", to: "entitlementService", d: "M370,170 H410", length: 40, kind: "main", activeIn: ["normal", "failure"] },
    { id: "entitlementService-decisionEnforced", from: "entitlementService", to: "decisionEnforced", d: "M600,170 H650", length: 50, kind: "main", activeIn: ["normal"] },
    {
      id: "entitlementService-timeoutInjected",
      from: "entitlementService",
      to: "timeoutInjected",
      d: "M505,205 V260",
      length: 55,
      kind: "failure",
      activeIn: ["failure"],
    },
    { id: "timeoutInjected-failsClosed", from: "timeoutInjected", to: "failsClosed", d: "M600,295 H625 V245 H650", length: 100, kind: "main", activeIn: ["failure"] },
    { id: "timeoutInjected-failsOpen", from: "timeoutInjected", to: "failsOpen", d: "M600,295 H625 V345 H650", length: 100, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "request",
      label: "Approval request",
      x: 10,
      y: 140,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description:
        "An authenticated caller submits a request to approve a financial document above the configured threshold, at a fictional endpoint reachable as POST /documents/{id}/approve on approvals.lab.example.com. In both the normal and failure-condition-test paths, this request looks identical — the two paths diverge only in how the Entitlement Service call behaves once it's made.",
    },
    {
      id: "authCheck",
      label: "Authorization check",
      x: 190,
      y: 135,
      w: 180,
      h: 70,
      activeIn: ["normal", "failure"],
      role: "boundary",
      focusableLabel:
        "Authorization check — the security decision point that calls the external Entitlement Service and is responsible for deciding what to do if that call doesn't return a usable answer",
      description:
        "The code responsible for confirming the requesting user holds the entitlement level required for this document's amount before the approval proceeds. It calls out to the Entitlement Service to get that answer — which means it also owns an implicit decision about what to do if that call times out, a decision a conventional test suite rarely exercises because it never makes the dependency time out in the first place.",
    },
    {
      id: "entitlementService",
      label: "Entitlement Service call",
      x: 410,
      y: 135,
      w: 190,
      h: 70,
      activeIn: ["normal", "failure"],
      description:
        "The outbound call to a fictional internal dependency that returns the caller's entitlement level. In the normal path it responds within its configured timeout. In the failure-condition-test path, the test deliberately configures this call to hang past its timeout instead of returning any answer at all — the injected condition the rest of the diagram's failure branch depends on.",
    },
    {
      id: "decisionEnforced",
      label: "Access decided correctly",
      x: 650,
      y: 140,
      w: 200,
      h: 60,
      activeIn: ["normal"],
      role: "safe",
      description:
        "Reached only when the Entitlement Service responds in time: the authorization check enforces the caller's actual entitlement level, approving or denying the request based on real information rather than a fallback default.",
    },
    {
      id: "timeoutInjected",
      label: "Test injects dependency timeout",
      x: 410,
      y: 260,
      w: 190,
      h: 70,
      activeIn: ["failure"],
      role: "boundary",
      focusableLabel:
        "Test injects dependency timeout — the deliberate fault-injection point a conventional happy-path test never reaches, from which two different implementations can produce two different outcomes",
      description:
        "The point where a failure-condition test deliberately forces the Entitlement Service call to hang past its timeout instead of relying on chance. What happens next depends entirely on how the authorization check's timeout handler was written — which is exactly the fact a test at this point is designed to reveal.",
    },
    {
      id: "failsClosed",
      label: "Fails closed: access denied",
      x: 650,
      y: 215,
      w: 210,
      h: 60,
      activeIn: ["failure"],
      role: "safe",
      focusableLabel: "Fails closed — the authorization check correctly treats a timed-out dependency as 'no answer,' and denies the approval rather than defaulting to allow",
      description:
        "The outcome a correctly designed and correctly tested authorization check produces: when the Entitlement Service doesn't answer in time, the check treats that as insufficient information to approve, and denies the request. This is the specific outcome a failure-condition test has to assert by name — not merely that the endpoint returned some response.",
    },
    {
      id: "failsOpen",
      label: "Fails open: access granted",
      x: 650,
      y: 315,
      w: 210,
      h: 60,
      activeIn: ["failure"],
      role: "blocked",
      focusableLabel:
        "Fails open — a timeout handler written to keep the endpoint available silently grants the approval when the dependency doesn't answer, exactly the defect a deliberate failure-condition test exists to catch before it reaches production",
      description:
        "The defect a deliberate failure-condition test is written to catch: a timeout handler built to keep the approval endpoint from hanging or returning a 500 catches the timeout and defaults to granting the approval instead of denying it, treating 'no answer from the Entitlement Service' as equivalent to 'approved.' A conventional happy-path suite would never reach this branch, because it never makes the dependency time out.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Designing Security Tests for Failure Conditions",
    slug: "designing-security-tests-for-failure-conditions",
    summary:
      "Conventional test suites cover the happy path plus a few expected errors, which systematically misses where security decisions actually break: a dependency timeout, a malformed upstream response, a partial multi-step failure, a race around a check-then-act decision. How to deliberately inject each of those conditions and assert the system fails closed, not just that it doesn't crash.",
    pillar: "build-securely",
    primaryCategory: "application-code-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["application-security", "security-control-validation", "fail-closed-design", "secure-code-review"],
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
