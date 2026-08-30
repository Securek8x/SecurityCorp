// Knowledge-base article draft (Bead securitycorp-source-4zl.54.1.6).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is NOT wired into lib/knowledge-content.ts; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "Input validation confirms that a request is well-formed: the right fields are present, values match an expected format, lengths and character sets fall within bounds. That is a genuinely useful, necessary check. It is also a narrower check than it is usually treated as — validation answers 'is this shaped correctly?', not 'should this specific caller be allowed to do this, to this specific thing, right now?' Those are different questions, and a value can pass the first one completely while failing the second.",
    "This guide draws that line precisely: what input validation actually catches, what it structurally cannot catch by design, and the defense-in-depth layers — authorization checks, output encoding, parameterized queries — that have to sit alongside validation rather than behind it, because none of them is a stricter version of the same check.",
  ],
  whatYouWillLearn: [
    "Why input validation is a syntax check (is this value shaped correctly) and not a semantics check (is this value legitimate for this caller, in this context, right now).",
    "A concrete case where a request passes validation cleanly — every field well-formed, every value in range — and still needs to be rejected, because the thing validation cannot see is who the caller is and what they own.",
    "Why output encoding, authorization checks, and parameterized queries are each doing a job validation cannot do, rather than being redundant with it.",
    "A repeatable way to review whether a given control is actually enforcing what a team believes it's enforcing, instead of assuming 'we validate input' closes a category of risk it only partially addresses.",
  ],
  intendedAudience: [
    "Developers who validate request input today and want a precise account of what that validation does and doesn't guarantee.",
    "Security practitioners reviewing an application's input-handling and authorization design for gaps that a passing validation layer can hide.",
    "Technical leads deciding where a limited security budget goes next, when 'we already validate our inputs' is being used to justify skipping a distinct control.",
  ],
  prerequisites: [
    "Basic familiarity with how a web application or API receives and processes a request.",
    "No lab environment is required — every example in this guide is fictional and descriptive, not a runnable exercise.",
    "Helpful but not required: prior exposure to authorization concepts (roles, ownership, object-level access) covered in more depth in this knowledge base's API authentication and authorization guide.",
  ],
  problem: [
    "It is easy to point at a validation layer — a schema check, a regex, a strict type — and conclude 'this endpoint is protected against bad input.' That conclusion is broader than the evidence supports. A passing validation check means: this value is shaped the way the schema expects. It says nothing about whether this specific, well-formed value should be allowed for this specific caller, and nothing about what happens to that value once it is handed to a database query, a rendered page, or a downstream system that has its own rules about safe handling.",
    "The gap is easy to miss precisely because a well-formed malicious or unauthorized value looks identical, at the validation layer, to a well-formed legitimate one. A validator that only asks 'does this match the pattern' cannot distinguish a case ID that names the caller's own record from a case ID — equally well-formed — that names someone else's. It was never given the information needed to make that distinction, because ownership and authorization are not properties of a string's shape.",
  ],
  threatModel: [
    "Consider a fictional case-management application we'll call the Lumen Case Portal, reachable at `api.lab.example.com`. Authenticated case workers retrieve case records by ID — `GET /cases/{caseId}/notes` — where `caseId` is a UUID assigned when a case is created, and each case belongs to exactly one organization's workspace.",
    "Relevant failure modes, not adversaries in the traditional sense: (1) a caller supplies a well-formed UUID for a case belonging to a different organization — the identifier passes every format check because a valid UUID is a valid UUID regardless of who owns the case it names; (2) a caller supplies case-note text containing characters that are individually permitted by the validator (letters, punctuation, no length violation) but that form markup which, if rendered without encoding, executes in another user's browser; (3) a caller supplies a value that satisfies validation but is then interpolated directly into a query string rather than passed as a bound parameter, so the value's validity as input says nothing about its safety once concatenated into a different context.",
    "Out of scope for this guide: the mechanics of object- and function-level authorization design (a token's scopes, role checks, ownership derivation) — that is covered in depth by this knowledge base's guide to securing API authentication and authorization, which this guide references rather than repeats. Also out of scope: specific validation library configuration, and injection classes beyond the illustrative SQL and markup examples used here.",
  ],
  mainContent: [
    "**Validation is a syntax check; the risks that matter are usually semantic.** A validator answers a bounded question: does this value conform to an expected type, format, length, and character set? That question has a correct, mechanical answer that doesn't depend on who is asking or what the value will be used for. Whether a caller is allowed to retrieve *this* case, or whether *this* note text is safe to render as HTML, or whether *this* identifier is safe to concatenate into a query — those are semantic questions, and a general-purpose format check has no way to answer them, because the answer depends on context validation was never given.",
    "**A syntactically perfect value can still be the wrong value.** In the Lumen Case Portal example, a UUID naming another organization's case is, as a string, indistinguishable from a UUID naming the caller's own case. Both are correctly formatted 128-bit identifiers rendered as hyphenated hex. A validator built to reject malformed input has nothing to reject here — the input isn't malformed. Treating 'the input validated successfully' as evidence the request is safe conflates two properties that are simply unrelated: well-formedness and legitimacy.",
    "**Authorization has to independently ask the question validation can't.** Where validation checks shape, authorization checks standing: is this authenticated caller permitted to access the specific object named by this (validly formatted) identifier, right now? That check has to run after validation passes, using information validation doesn't have access to — the caller's identity and the resource's ownership — and it has to run on every request, not once at login. This knowledge base's API authentication and authorization guide covers object- and function-level authorization design in depth; the point here is narrower: authorization is not a stricter validation rule, it's a different control answering a different question, and skipping it because 'we already validate input' leaves that question unanswered.",
    "**Output encoding solves a problem validation format rules don't address.** A case-note field that permits ordinary punctuation and a reasonable length range can still admit a string that, left unencoded, is interpreted as markup by a browser rather than as text. Rejecting the input outright (overly strict validation) breaks legitimate use of common punctuation; validating it as 'permitted characters, acceptable length' and then rendering it unencoded leaves the underlying risk open. The fix isn't a stricter input rule — it's a separate control applied at the point where the value is emitted into a new context (HTML, in this case), because the safety of a value is a property of where it's used, not just what it contains. CWE-20 (Improper Input Validation) and CWE-79 (Cross-Site Scripting) are catalogued separately for exactly this reason: one is about accepting the wrong shape of input, the other is about failing to neutralize output for its rendering context, and a fix for one does not fix the other.",
    "**Parameterized queries solve a problem validation format rules don't address, either.** A case ID that passes a UUID-format check is safe to use as a database parameter — but only if it's actually passed as a parameter. A validated value concatenated directly into a query string is still exposed to injection through any code path that builds queries that way, including a later refactor that reuses the 'already validated' value without preserving the parameterization. Validating a value's shape and binding it safely into a query are two separate steps; a defense-in-depth design does both rather than treating validation as having made concatenation safe. OWASP catalogues this under injection (A03:2021 in the OWASP Top 10) as a distinct risk category from broken access control (A01:2021) — the two require different controls because they're different failure modes, not degrees of the same one.",
    "**Each layer closes a gap the others structurally cannot.** Validation rejects malformed input before it reaches application logic at all — a real and useful narrowing of what downstream code has to handle. Authorization rejects well-formed input that names something this caller shouldn't reach. Output encoding neutralizes a well-formed, authorized value at the point it's rendered somewhere it could be misinterpreted. Parameterized queries neutralize a well-formed, authorized value at the point it's used to construct a query. None of these four controls substitutes for another; each is answering a question the others don't ask.",
    "**'We validate our input' is a true but incomplete sentence.** It's a reasonable thing to say about a codebase, and it describes a real control. The failure mode this guide is about isn't skipping validation — it's treating that sentence as though it also meant 'we authorize access,' 'we encode output,' and 'we parameterize queries,' when none of those follow from it. A review that stops at 'is input validated?' will pass a system that is still open to exactly the case this guide describes: a request that is entirely well-formed and entirely unauthorized.",
  ],
  validationEvidence: [
    "This guide describes a conceptual distinction and a review procedure; it does not include a reproduced implementation, a captured request/response trace, or a completed assessment of a real system. Its evidence state remains UNVERIFIED — the technical claims are grounded in the cited OWASP and CWE references, not in an exercise performed for this article.",
  ],
  limitations: [
    "This guide focuses on the relationship between input validation and three specific defense-in-depth layers (authorization, output encoding, parameterized queries). It does not cover client-side validation's separate (and much narrower) role of user-experience feedback, nor does it survey every injection class (command injection, deserialization, XXE) in depth.",
    "The fictional Lumen Case Portal example is illustrative, not a reference architecture. A real system's validation, authorization, encoding, and query-construction design must be derived from its own data model and threat model, not copied from this guide.",
    "Object- and function-level authorization mechanics — token scopes, role checks, how ownership is derived and enforced — are intentionally not repeated here; see this knowledge base's guide to securing API authentication and authorization for that depth.",
  ],
  defensiveRecommendations: [
    "Treat 'input is validated' and 'request is authorized' as two separate, independently verified claims — never infer the second from the first.",
    "Re-check authorization server-side on every request that names a specific object, using the caller's identity and the object's actual ownership, not the mere fact that the identifier is well-formed.",
    "Apply output encoding at the point a value is rendered into a new context (HTML, a shell argument, a log line), matched to that context — not as a substitute step folded into input validation.",
    "Use parameterized queries or an equivalent safe query-construction API for every value that reaches a database, regardless of whether that value already passed format validation.",
    "When reviewing a control, ask what specific question it answers and what it structurally cannot answer — then confirm something else in the design answers the questions it leaves open.",
    "Avoid treating overly strict input validation as a substitute for authorization or encoding; rejecting more input narrows the attack surface at the margins but does not close a missing authorization or encoding gap.",
  ],
  keyTakeaways: [
    "Input validation checks whether a value is shaped correctly — it does not and structurally cannot check whether this caller should have this value, or whether this value is safe once it reaches a database query or a rendered page.",
    "A syntactically valid, well-formed request can still be the wrong request; a validly formatted identifier for someone else's resource passes validation by construction.",
    "Authorization, output encoding, and parameterized queries each answer a distinct question validation does not ask; none of the four is a stricter version of another.",
    "'We validate our input' is true and useful, but it is not evidence that authorization, encoding, or safe query construction are also in place.",
  ],
  references: [
    "OWASP Input Validation Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html",
    "OWASP Cross Site Scripting Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
    "OWASP SQL Injection Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
    "OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
    "OWASP Top 10:2021 — A01:2021 Broken Access Control: https://owasp.org/Top10/A01_2021-Broken_Access_Control/",
    "OWASP Top 10:2021 — A03:2021 Injection: https://owasp.org/Top10/A03_2021-Injection/",
    "CWE-20: Improper Input Validation: https://cwe.mitre.org/data/definitions/20.html",
    "CWE-79: Improper Neutralization of Input During Web Page Generation (Cross-site Scripting): https://cwe.mitre.org/data/definitions/79.html",
    "CWE-89: Improper Neutralization of Special Elements used in an SQL Command (SQL Injection): https://cwe.mitre.org/data/definitions/89.html",
  ],
  relatedSlugs: ["securing-api-authentication-authorization", "practical-secure-code-review-checklist", "secrets-detection-scanner-limits"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A documented list of every endpoint or entry point that accepts caller-supplied input naming a specific object (a record ID, a file path, a resource name).",
    "A clear statement of the current validation rules applied to that input (format, type, length, allowed characters) separate from any statement about authorization.",
    "Visibility into how validated values are subsequently used: rendered into a response, used to build a database query, passed to another system.",
  ],
  procedure: [
    "For each entry point, write down the validation rule in one sentence and the authorization rule in a separate sentence. If the authorization sentence can't be written — because there isn't one, or because it's assumed to be covered by validation — that's the gap this guide is about.",
    "For each entry point that names a specific object by an identifier a caller could plausibly guess or enumerate, confirm a server-side check re-derives whether the authenticated caller may access that specific object, independent of the identifier's format being valid.",
    "For each field whose value is later rendered into a response body, a page, or a log, confirm it is encoded for the context it's rendered into at the point of output — not only checked for permitted characters at the point of input.",
    "For each field whose value is used to construct a database query, confirm it is passed as a bound parameter (or through an equivalent safe query API), not concatenated into a query string, regardless of whether it already passed format validation.",
    "Where a review finds validation but no distinct authorization, encoding, or parameterization step, record the specific gap and which of the three it corresponds to, rather than recording the control area as 'input handling: reviewed.'",
  ],
  validation: [
    "For a sample of object-scoped endpoints, confirm a well-formed identifier for a resource the caller does not own is rejected, not merely that a malformed identifier is rejected.",
    "For a sample of fields rendered back to a client, confirm a value containing markup-shaped but format-permitted characters is rendered inertly (encoded), not executed.",
    "For a sample of query-construction code paths, confirm the query is built with bound parameters by inspecting the query-construction code itself, not by inferring safety from the fact that the input passed validation.",
    "Confirm the review record distinguishes 'validation confirmed' from 'authorization confirmed' from 'encoding confirmed' from 'parameterization confirmed' as four separate line items, not one combined 'input handling' checkbox.",
  ],
  rollback: [
    "If a review finds a missing authorization check behind valid-looking input, treat the finding as internal-source per the publication-safety policy — do not describe the live weakness publicly, and route it to the responsible team for remediation before any public write-up.",
    "If adding an authorization check breaks a legitimate workflow, revert the specific check and its enforcement point rather than loosening validation to compensate, then re-introduce the authorization check alongside a corrected ownership or role model.",
    "If tightening output encoding breaks legitimate formatting a user relied on, restore the specific encoding rule to context-appropriate behavior (e.g., allow the formatting, encode it correctly) rather than removing encoding to unblock the workflow.",
  ],
};

const diagram: KnowledgeArticle["diagram"] = {
  titleId: "input-validation-diagram",
  title: "Input validation is not the same check as authorization",
  desc: "A client request carrying a well-formed resource identifier passes through input validation, then an authorization check, before reaching the data-access layer. Interactive: switch between the normal path, where a well-formed and authorized request reaches the data-access layer, and the failure path, where a request that is equally well-formed — but names a resource the caller does not own — passes input validation cleanly and is only caught at the authorization layer. Explore each node for details.",
  viewBox: "0 0 820 300",
  failureLabel: "Valid but unauthorized",
  caption: "Client → input validation → authorization check → data-access layer, which reaches the resource only after both checks pass. In the failure path, a syntactically valid but unauthorized request clears input validation and is denied only at the authorization layer — validation passing is not evidence the request is safe.",
  motionDuration: 2600,
  mainPacketRoute: { d: "M160,90 H190 M360,90 H390 M570,90 H610", length: 100 },
  edges: [
    { id: "client-validation", from: "client", to: "validation", d: "M160,90 H190", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "validation-authorization", from: "validation", to: "authorization", d: "M360,90 H390", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "authorization-dataaccess", from: "authorization", to: "dataaccess", d: "M570,90 H610", length: 40, kind: "main", activeIn: ["normal"] },
    { id: "authorization-denied", from: "authorization", to: "denied", d: "M480,125 V220", length: 95, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "client",
      label: "Client request",
      x: 10,
      y: 60,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description: "Names a specific case record by its identifier. In both the normal and failure paths, the identifier is a perfectly well-formed value — the two paths differ only in whose case it actually names, which the identifier's format can't reveal.",
    },
    {
      id: "validation",
      label: "Input validation",
      x: 190,
      y: 55,
      w: 170,
      h: 70,
      activeIn: ["normal", "failure"],
      role: "boundary",
      focusableLabel: "Input validation — a syntax boundary confirming the request is well-formed, not that the caller is allowed to make it",
      description: "Confirms the request is well-formed: the case identifier matches the expected format, required fields are present, lengths and character sets are in range. A malformed identifier is rejected here — but a syntactically perfect identifier for a case the caller doesn't own passes this check cleanly, because shape is the only thing this layer was built to evaluate.",
    },
    {
      id: "authorization",
      label: "Authorization check",
      x: 390,
      y: 55,
      w: 180,
      h: 70,
      activeIn: ["normal", "failure"],
      role: "boundary",
      focusableLabel: "Authorization check — independently confirms this specific caller may access this specific, already-well-formed resource",
      description: "Independently checks whether the authenticated caller may access the specific case named by the (already validated) identifier — not whether the identifier is shaped correctly. This is where a well-formed but foreign case ID is caught in the failure path: input validation had nothing to say about ownership, and this layer is the one built to say it.",
    },
    {
      id: "dataaccess",
      label: "Data-access layer",
      x: 610,
      y: 60,
      w: 170,
      h: 60,
      activeIn: ["normal"],
      role: "safe",
      description: "Reached only once both checks pass. Defense-in-depth continues here too: the case identifier is bound into the query as a parameter rather than concatenated, and any note text returned to a client is encoded for its rendering context — so a value that was valid input stays safe as output and as a query parameter.",
    },
    {
      id: "denied",
      label: "Access denied",
      x: 390,
      y: 220,
      w: 220,
      h: 60,
      activeIn: ["failure"],
      role: "blocked",
      focusableLabel: "Access denied — the request was well-formed throughout; it is rejected here because the caller does not own the named resource",
      description: "Where a syntactically valid request is rejected because format was never the question that mattered. The caller supplied a well-formed case identifier — it simply isn't their case. Input validation passed; authorization didn't, and the two are independent checks rather than stages of the same one.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Why Input Validation Is Not a Complete Security Control",
    slug: "input-validation-not-complete-control",
    summary: "Input validation confirms a request is well-formed — it does not confirm the request is safe. What validation actually catches, what it structurally cannot, and the authorization, output-encoding, and parameterized-query layers that have to sit alongside it.",
    pillar: "build-securely",
    primaryCategory: "application-code-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["application-security", "access-control", "fail-closed-design"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 11,
    publishedAt: "2026-08-30",
    lastReviewedAt: "2026-08-30",
    updatedAt: "2026-08-30",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Codex", reviewedAt: "2026-08-30" },
    technicalReview: { status: "approved", reviewer: "Codex", reviewedAt: "2026-08-30" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-30" },
  },
  sections,
  module: module_,
  diagram,
};
