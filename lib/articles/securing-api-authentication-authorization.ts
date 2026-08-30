// Knowledge-base article draft (Bead securitycorp-source-4zl.54.1.4).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is NOT wired into lib/knowledge-content.ts; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "API authentication answers 'who is calling?'. API authorization answers 'what is this caller allowed to do, to this specific resource, right now?'. Most real-world API incidents are not failures of the first question — they are failures of the second, applied inconsistently to individual objects and individual functions rather than to the endpoint as a whole.",
    "This guide walks through a token-based authentication and authorization flow for a fictional API, shows where the two most common and most damaging authorization mistakes actually occur, and gives a repeatable set of checks a developer or reviewer can apply to a real API design without needing a lab environment.",
  ],
  whatYouWillLearn: [
    "The difference between authentication, coarse-grained (function-level) authorization, and fine-grained (object-level) authorization, and why conflating them creates blind spots.",
    "How short-lived bearer tokens are issued, validated, and rejected in a typical OAuth2/OIDC-style flow, including which fields (issuer, audience, expiry, scope) actually carry security meaning.",
    "Why broken object-level authorization (BOLA) and broken function-level authorization are the two most common ways APIs fail even when authentication is implemented correctly.",
    "A concrete, repeatable procedure for reviewing an API's authentication and authorization design, including what evidence to require before trusting a control.",
  ],
  intendedAudience: [
    "Developers designing or implementing API endpoints that accept a bearer token or session credential.",
    "Security practitioners reviewing an API's authorization model before or after release.",
    "Technical leads who need a shared vocabulary for discussing 'is this endpoint secure' with more precision than that question usually gets.",
  ],
  prerequisites: [
    "Basic familiarity with HTTP APIs and the concept of a bearer token or session credential.",
    "No lab environment is required — every example in this guide is fictional and descriptive, not a runnable exercise.",
    "Some prior exposure to OAuth2 or OpenID Connect terminology (client, authorization server, scope) is helpful but not assumed.",
  ],
  problem: [
    "It is easy to confirm that an API rejects requests with no token, and easy to stop there. That confirms authentication works. It says nothing about authorization: whether a validly authenticated caller can be tricked into accessing another user's data (object-level authorization), or into calling an administrative function their role should not reach (function-level authorization). Both failures produce a '200 OK' response, not an obvious error — which is exactly why they are found in production more often than broken authentication is.",
    "A second, quieter problem is treating a token's mere validity as proof of authorization. A cryptographically valid, unexpired token only proves who issued it and who it was issued to. It does not by itself prove the token's subject should be allowed to read or modify the specific resource named in the request path or body.",
  ],
  threatModel: [
    "Consider a fictional expense-reporting API we'll call the Meridian Ledger API, reachable at `api.lab.example.com`. Clients authenticate once against an authorization server at `auth.lab.example.com` and receive a short-lived access token, which they present as a bearer token on every subsequent request.",
    "Relevant adversaries: (1) an authenticated user of the system attempting to read or modify another user's expense records by changing an identifier in the request (an object-level authorization attack, not a credential-theft attack); (2) a caller with a narrowly scoped token attempting to reach an endpoint that requires a broader scope or an administrative role (a function-level authorization attack); (3) an attacker presenting an expired, forged, or wrong-audience token in the hope that a component downstream of the edge fails to re-validate it.",
    "Out of scope for this guide: transport-layer attacks (covered by TLS/PKI practice generally), credential-stuffing and password attacks against the authorization server's login flow, and infrastructure-level compromise of the authorization server itself. This guide assumes the authorization server correctly authenticates the end user and focuses on what happens to the token afterward.",
  ],
  mainContent: [
    "**Authentication issues the credential; authorization decides what it's good for.** In the Meridian Ledger example, the client authenticates against `auth.lab.example.com` and receives a signed access token. The token is proof of identity and of the scopes the resource owner granted — it is not, by itself, proof that the bearer may act on any particular expense record. Treating 'token is valid' and 'action is authorized' as the same check is the single most common root cause behind API authorization failures.",
    "**Validate the token fully, every time, at the boundary that enforces trust.** A well-formed token check confirms: the signature was produced by the expected authorization server (not merely that a signature is present); the token has not expired; the `aud` (audience) claim names this API, not some other service that happens to trust the same authorization server; and the granted scopes are sufficient for the requested operation. Skipping the audience check is a quietly common mistake — it lets a token legitimately issued for one API be replayed against a different API that trusts the same issuer.",
    "**Function-level authorization: does this caller's role reach this endpoint at all?** This is the coarse-grained check — does a token with `expenses:read` scope get anywhere near an endpoint that approves reimbursements? Function-level checks are usually easy to test because they don't depend on which specific record is involved; a reviewer can enumerate every endpoint and ask 'what scope or role does this require, and is that enforced on the server side, not just hidden from a client's menu.'",
    "**Object-level authorization: does this caller's role reach this specific object?** This is the check that most often gets skipped, because it requires re-verifying ownership on every single request rather than once at login. In the Meridian Ledger example, `GET /expenses/{id}` must confirm that the expense identified by `{id}` belongs to (or is otherwise visible to) the authenticated subject — not merely that the subject holds a valid `expenses:read` token. Changing `{id}` to a neighboring value and receiving another user's data back is the textbook broken object-level authorization (BOLA) failure, and OWASP's API Security Top 10 lists it as the most frequently reported API weakness for consecutive editions.",
    "**Short-lived tokens reduce, but do not eliminate, the blast radius of a leaked token.** A short expiry limits how long a stolen or over-shared token remains useful; it does not substitute for object- and function-level checks, and it does not prevent misuse during its valid lifetime. Pair short expiry with the ability to revoke a specific token or session before its natural expiry, for cases where a compromise is detected mid-lifetime.",
    "**Fail closed, and make the rejection uninformative to an attacker.** When a token is invalid, expired, wrong-audience, or under-scoped, the API should return a generic 401 or 403 without distinguishing 'this user doesn't exist' from 'this user exists but the token is wrong for it.' The same discipline applies to object-level checks: returning 404 for both 'this record doesn't exist' and 'this record exists but isn't yours' avoids confirming the existence of resources an attacker shouldn't be able to enumerate.",
    "**Authorization checks belong on the server, enforced independently at each layer that can act on the request.** A gateway that authenticates transport and forwards a bearer token is not itself an authorization decision point; the auth service that validates the token and the resource server that owns the underlying data must each independently enforce their portion of the check, rather than trusting that an earlier hop already handled it.",
  ],
  validationEvidence: [
    "This guide describes a design pattern and a review procedure; it does not include a reproduced implementation, a captured request/response trace, or a completed assessment of a real system. Its evidence state remains UNVERIFIED — the technical claims are grounded in the cited OWASP and IETF references, not in an exercise performed for this article.",
  ],
  limitations: [
    "This guide covers bearer-token API authorization patterns broadly; it does not cover mutual-TLS client authentication, API-key-only schemes without an authorization server, GraphQL-specific authorization concerns, or the authorization-server login flow itself (phishing resistance, MFA, credential-stuffing defenses).",
    "The fictional Meridian Ledger example is illustrative, not a reference architecture. A real API's authorization model must be derived from its own data model and threat model, not copied from this guide's diagram.",
    "Token-binding techniques that tie a token to the specific client that requested it are an active area of practice this guide does not detail; treat their absence here as a gap to research separately, not as evidence they are unnecessary.",
  ],
  defensiveRecommendations: [
    "Enforce object-level authorization on every request that names a specific resource, re-checked server-side on each call — never inferred from the fact that a valid token was presented.",
    "Enforce function-level authorization against the token's scopes or roles on the server, not only by hiding disallowed actions from a client's UI.",
    "Validate issuer, audience, expiry, and signature on every hop that makes a trust decision, not only at the network edge.",
    "Keep access tokens short-lived and support explicit revocation for the window between issuance and natural expiry.",
    "Return generic, non-distinguishing errors for both authentication and authorization failures so responses don't help an attacker enumerate valid users or resources.",
    "Log authorization denials with enough context to detect a pattern of object-ID enumeration, without logging the token itself or other sensitive values.",
  ],
  keyTakeaways: [
    "A valid token proves identity and granted scope — it does not by itself prove the bearer is authorized for the specific object or function being requested.",
    "Broken object-level authorization and broken function-level authorization are distinct checks that both need explicit, server-side enforcement on every request.",
    "Short-lived tokens and revocation reduce exposure time; they are not a substitute for per-request authorization checks.",
    "Fail closed with generic error responses, and re-validate trust independently at each layer capable of acting on the request.",
  ],
  references: [
    "OWASP API Security Project (API Security Top 10, 2023 edition): https://owasp.org/www-project-api-security/",
    "RFC 6749, The OAuth 2.0 Authorization Framework: https://www.rfc-editor.org/rfc/rfc6749",
    "RFC 6750, The OAuth 2.0 Authorization Framework: Bearer Token Usage: https://www.rfc-editor.org/rfc/rfc6750",
    "RFC 7519, JSON Web Token (JWT): https://www.rfc-editor.org/rfc/rfc7519",
    "RFC 9068, JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens: https://www.rfc-editor.org/rfc/rfc9068",
    "NIST SP 800-63B, Digital Identity Guidelines — Authentication and Lifecycle Management: https://pages.nist.gov/800-63-3/sp800-63b.html",
  ],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A documented list of every API endpoint, the scope or role each requires, and whether it accepts a resource identifier that must be checked for ownership.",
    "An authorization server (or equivalent token issuer) that supports short-lived access tokens with issuer, audience, expiry, and scope claims.",
    "Server-side logging sufficient to detect repeated authorization denials against varying resource identifiers, without recording token values.",
  ],
  procedure: [
    "List every endpoint and classify it: does it require authentication only, function-level authorization (a role or scope check), object-level authorization (a per-resource ownership check), or both.",
    "For each endpoint requiring object-level authorization, confirm the server re-derives ownership from the authenticated subject and the requested resource identifier on every request — not from a cached decision, a client-supplied flag, or the mere presence of a valid token.",
    "For each endpoint requiring function-level authorization, confirm the check is enforced server-side against the token's scopes or roles, independent of what a client's interface chooses to display.",
    "Trace a token from issuance to the resource server: confirm issuer, audience, expiry, and signature are validated at every hop capable of acting on the request, not only at the network edge.",
    "Confirm token lifetime is short and that a revocation mechanism exists for the window before natural expiry.",
    "Confirm both authentication and authorization failures return generic responses that do not distinguish 'invalid credential' from 'valid credential, wrong resource' or reveal whether a given identifier exists.",
    "Record the result of each check with supporting evidence (which requests were traced, which responses were observed) rather than marking an item passed because a control appeared configured.",
  ],
  validation: [
    "For a sample of object-scoped endpoints, confirm that a request using another subject's resource identifier is denied rather than returning that subject's data.",
    "For a sample of scope-restricted endpoints, confirm that a token with insufficient scope is denied server-side, independent of client-side UI restrictions.",
    "Confirm an expired or wrong-audience token is rejected at every validating hop, not only at the first one encountered.",
    "Confirm denial responses for both missing/invalid tokens and unauthorized-object requests are generic and do not leak whether the underlying resource exists.",
  ],
  rollback: [
    "If a review finds a missing object- or function-level check, treat the finding as internal-source per the publication-safety policy — do not describe the live weakness publicly, and route it to the responsible team for remediation before any public write-up.",
    "If a newly added authorization check breaks a legitimate workflow, revert the specific check and its enforcement point rather than disabling authorization broadly, then re-introduce it alongside a corrected data model or claim mapping.",
    "If token validation changes cause valid clients to be rejected, confirm the audience/issuer values expected by the change match every legitimate token source before rolling the change out further.",
  ],
};

const diagram: KnowledgeArticle["diagram"] = {
  titleId: "api-auth-diagram",
  title: "API authentication and authorization flow",
  desc: "A client presents a bearer token to an API gateway, which forwards it to an auth service for validation, which allows the request to reach a resource server that performs its own object-level authorization check. Interactive: switch between the normal authorized path and the failure path, where a forged, expired, or over-scoped token — or a request for another subject's object — is denied. Explore each node for details.",
  viewBox: "0 0 820 300",
  failureLabel: "Token / BOLA failure",
  caption: "Client → API gateway → auth service → resource server. The auth service validates token integrity and scope; the resource server independently enforces object-level authorization before returning data.",
  motionDuration: 2600,
  mainPacketRoute: { d: "M160,90 H190 M360,90 H390 M570,90 H610", length: 100 },
  edges: [
    { id: "client-gateway", from: "client", to: "gateway", d: "M160,90 H190", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "gateway-auth", from: "gateway", to: "auth", d: "M360,90 H390", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "auth-resource", from: "auth", to: "resource", d: "M570,90 H610", length: 40, kind: "main", activeIn: ["normal"] },
    { id: "auth-blocked", from: "auth", to: "blocked", d: "M480,125 V220", length: 95, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "client",
      label: "Client",
      x: 10,
      y: 60,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description: "Holds a short-lived access token obtained from a prior authorization flow. It never sees the resource server's internal identifiers or another subject's data directly — only what the API chooses to return.",
    },
    {
      id: "gateway",
      label: "API gateway",
      x: 190,
      y: 55,
      w: 170,
      h: 70,
      activeIn: ["normal", "failure"],
      description: "Terminates TLS and forwards the request with its bearer token intact. The gateway is not itself an authorization decision point — it does not infer that a request is authorized merely because it reached this far.",
    },
    {
      id: "auth",
      label: "Auth service",
      x: 390,
      y: 55,
      w: 180,
      h: 70,
      activeIn: ["normal", "failure"],
      role: "boundary",
      focusableLabel: "Auth service — trust boundary that validates token signature, issuer, audience, expiry, and scope before the request may continue",
      description: "Trust boundary: validates the token's signature, issuer, audience, expiration, and granted scopes. This is where a forged, expired, or wrong-audience token is caught in the failure path below — scope alone does not authorize access to a specific object.",
    },
    {
      id: "resource",
      label: "Resource server",
      x: 610,
      y: 60,
      w: 170,
      h: 60,
      activeIn: ["normal"],
      role: "safe",
      description: "The resolved destination for an authorized request. It performs its own object-level authorization check — confirming the token's subject may access this specific record, not just this endpoint — independent of the auth service's scope check.",
    },
    {
      id: "blocked",
      label: "Request denied",
      x: 390,
      y: 220,
      w: 220,
      h: 60,
      activeIn: ["failure"],
      role: "blocked",
      focusableLabel: "Request denied — covers both invalid-token rejection at the auth service and broken object-level authorization rejection at the resource server",
      description: "Rejection point for two distinct failures: an invalid token (bad signature, expired, wrong audience or scope) rejected by the auth service, and a structurally valid token whose subject is not authorized for the specific object requested — a broken object-level authorization (BOLA) failure caught at the resource server. Both are denied with a generic response rather than a distinguishing error.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Securing API Authentication and Authorization",
    slug: "securing-api-authentication-authorization",
    summary: "How token-based API authentication and authorization actually fail in practice, and a repeatable procedure for reviewing object- and function-level checks before they do.",
    pillar: "build-securely",
    primaryCategory: "application-code-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["authentication", "access-control", "application-security"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
    publishedAt: "2026-08-29",
    lastReviewedAt: "2026-08-29",
    updatedAt: "2026-08-29",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi", reviewedAt: "2026-08-29" },
    technicalReview: { status: "approved", reviewer: "Ravi", reviewedAt: "2026-08-29" },
    publicationApproval: { status: "approved", reviewer: "Ravi", reviewedAt: "2026-08-29" },
  },
  sections,
  module: module_,
  diagram,
};
