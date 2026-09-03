// Knowledge-base article: "Building a Secure Internal Reverse Proxy"
// (Bead securitycorp-source-4zl.11). Published 2026-09-03 under Ravi Teja
// Thota's standing publication authorization after real review of
// citations, safety, and evidenceState honesty, per
// docs/publication-safety-policy.md. All examples
// describe a fictional environment; no real domain, address, port,
// topology, or configuration appears anywhere in this file.
//
// Scope note: this is a general, vendor-neutral design-principles article
// (TLS-termination trust boundary, header trust/spoofing, backend
// authentication, SSRF prevention, and proxy-layer access control) — a
// different scope from the existing /guides/reverse-proxy-home-lab guide,
// which is a specific private-home-lab walkthrough (split DNS, internal CA
// trust decisions, and rollback planning for one lab setup). See
// `limitations` below for the explicit boundary between the two.
import type { KnowledgeArticle } from "../knowledge-content.ts";

export const article: KnowledgeArticle = {
  meta: {
    title: "Building a Secure Internal Reverse Proxy",
    slug: "secure-internal-reverse-proxy-design",
    summary:
      "Design principles for an internal reverse proxy: why TLS termination creates a trust boundary, why proxy-added headers must never be trusted blindly, how to authenticate the proxy to its backends, how to prevent the proxy itself from becoming an SSRF vector, and how to enforce access control at the proxy layer — illustrated with a fictional internal service.",
    pillar: "defend-systems",
    primaryCategory: "network-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["reverse-proxy", "tls-pki", "access-control", "authentication"],
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
  sections: {
    executiveSummary: [
      "A reverse proxy is often introduced as a convenience: one public listener, TLS handled in one place, friendly routing to whatever sits behind it. That framing hides the fact that the proxy is a trust boundary — the single point where an external, untrusted connection is converted into an internal request that downstream services are expected to act on. Every property of that internal request — its claimed protocol, its claimed client address, the identity making it, and the destination it is allowed to reach — is a decision the proxy makes on the backend's behalf. Treating the proxy as plumbing instead of a boundary is how header spoofing, unauthenticated backend calls, and proxy-mediated SSRF end up in production.",
      "This guide covers five design decisions that a secure internal reverse proxy has to get right: where the TLS trust boundary actually sits, why headers the proxy adds cannot be trusted merely because the proxy added them, how a backend authenticates the proxy itself, how to stop the proxy's own request-forwarding logic from becoming a server-side request forgery (SSRF) primitive, and how to enforce access control at the proxy layer as a second, independent control rather than the application's only gate. A single fictional internal service — an order-status API reached through an internal proxy — runs through the examples so the concepts stay concrete without describing a real environment.",
    ],
    whatYouWillLearn: [
      "Why terminating TLS at a reverse proxy creates a new internal trust boundary, and what re-encrypting to the backend actually buys you versus plaintext backend traffic.",
      "Why a backend must never trust a client-supplied `X-Forwarded-For`, `Forwarded`, or `X-Forwarded-Proto` header without the proxy actively stripping and overwriting it first.",
      "How to authenticate the proxy to its backends as a specific service identity, instead of implicitly trusting 'traffic from the proxy's network segment.'",
      "How a proxy's own upstream-selection or request-forwarding logic can become an SSRF vector, and the controls that prevent it.",
      "How to enforce access control at the proxy layer — path-based restrictions, listener separation, rate limiting — as a second control, not a replacement for backend authorization.",
    ],
    intendedAudience: [
      "Platform and network engineers designing or reviewing an internal reverse proxy deployment.",
      "Backend developers who need to know what a proxy-added header does and does not prove about a request.",
      "Security practitioners reviewing a proxy configuration for header trust, SSRF exposure, and access-control gaps.",
    ],
    prerequisites: [
      "Familiarity with basic HTTP concepts (headers, virtual hosts, upstream targets) and TLS at a conceptual level.",
      "Comfort reading a simple reverse-proxy configuration (listeners, routes, upstream pools).",
      "No lab environment is required to follow this guide; it is conceptual and uses a fictional internal service throughout.",
    ],
    problem: [
      "A common failure pattern: a reverse proxy is deployed to centralize TLS and simplify routing, and everything behind it is treated as safe because 'it's internal now.' The proxy forwards a client-supplied `X-Forwarded-For` header unmodified, the backend logs and even authorizes based on that header's value, and the backend accepts any connection that reaches it on the expected port without checking who is actually connecting. None of these are theoretical — they are the default behavior of a naively configured proxy and a backend that assumes the network position it received a request at implies the request is trustworthy.",
      "The underlying problem is that a reverse proxy sits at the exact point where an untrusted client interaction becomes a request an internal system is expected to honor, and each property of that internal request — origin, protocol, identity, destination — has to be an explicit, enforced decision rather than an inherited assumption. Fixing this means treating the proxy configuration itself as security-relevant, not just as routing plumbing.",
    ],
    threatModel: [
      "This guide's threat model covers three distinct actors. First, an external client that can reach the proxy's public listener and wants to influence how the backend perceives the request — by spoofing forwarding headers, claiming a false client address, or attempting to reach a destination the proxy was not meant to expose. Second, a compromised or misconfigured component elsewhere on the internal network that attempts to reach a backend directly, bypassing the proxy's access control, or that attempts to impersonate the proxy without holding the proxy's actual credential. Third, an attacker who can influence data the proxy uses to select or construct an outbound request (a redirect target, a routing parameter, a webhook callback URL) and wants to turn the proxy into a request-forwarding primitive that reaches internal-only destinations — the SSRF case.",
      "None of these require compromising the proxy's host. Header spoofing and naive backend trust require only network reachability to the proxy's public listener. Backend impersonation requires only network reachability to the backend if the backend authenticates connections no more strongly than 'source IP looks like the proxy.' SSRF through the proxy requires only that some upstream-selection input is attacker-influenced and insufficiently constrained.",
    ],
    mainContent: [
      "**TLS termination is where the trust boundary actually sits, not a detail of where encryption happens.** When a reverse proxy terminates TLS, the encrypted, integrity-protected connection from the client ends at the proxy, and everything from that point inward is the proxy's responsibility to secure. If the proxy re-encrypts to the backend (TLS all the way, sometimes called TLS bridging), the backend gets confidentiality and integrity on that internal hop too; if the proxy forwards over plaintext because 'it's internal,' that hop has none of the protections the client connection had, and anything with visibility into that internal segment — a misconfigured neighboring workload, a compromised host on the same segment — can read or alter the request. NIST SP 800-52 Rev. 2 covers TLS implementation selection and configuration in detail; the design decision this guide is concerned with is simpler and comes first: decide explicitly whether the internal hop is encrypted, and do not let 'it's behind the proxy now' stand in for that decision.",
      "**Proxy-added headers are not automatically trustworthy — the backend has to know they came from the proxy, not the client.** A reverse proxy commonly adds headers like `X-Forwarded-For` (a de facto standard for the original client address) or the standardized `Forwarded` header from RFC 7239 to tell the backend what the original request looked like before proxying. The problem is that both headers are ordinary HTTP header fields, and if a client sends its own `X-Forwarded-For` or `Forwarded` header in the original request, a proxy that merely appends to or passes through the existing value — rather than stripping any client-supplied instance and setting the header itself — lets the client inject an arbitrary claimed origin. RFC 7239 says this plainly of the header it defines: it 'cannot be relied upon to be correct, as it may be modified, whether mistakenly or for malicious reasons, by every node on the way to the server, including the client making the request.' The fix is not a smarter parsing rule; it is proxy configuration: the proxy must strip any client-supplied `X-Forwarded-For`/`Forwarded`/`X-Forwarded-Proto` before adding its own, and the backend must only trust these headers when it can prove the request actually came through the proxy (network-layer enforcement that the backend is unreachable except from the proxy, combined with the proxy authentication covered next) — never merely because the header is present and looks well formed.",
      "**Authenticate the proxy to the backend as a specific identity — 'traffic from the proxy's IP' is not authentication.** A backend that accepts any connection arriving on its listening port, or that checks only that the source address matches the proxy's known address, is trusting network position rather than an actual credential. Network position is spoofable by anything that can reach the same internal segment, misroutable by a configuration change, and gives no way to tell a legitimate proxy request from any other host that happens to share that address or segment. NIST SP 800-207 (Zero Trust Architecture) states the underlying principle directly: 'there is no implicit trust granted to assets or user accounts based solely on their physical or network location.' In practice this means giving the proxy its own verifiable identity toward each backend — a mutually authenticated TLS client certificate presented on the internal hop, or a signed, short-lived service token attached to each forwarded request — and having the backend reject any request that does not present it, rather than inferring trust from where the packet arrived.",
      "**The proxy's own request-forwarding logic can itself become an SSRF vector.** SSRF is usually discussed as an application-layer bug — a server fetches a URL supplied by a user without validating the destination (this is CWE-918). A reverse proxy is exposed to the identical pattern whenever any part of its upstream selection is influenced by request data it does not fully control: a routing rule keyed on a client-supplied header, a dynamic upstream resolved from a path segment, or a proxy configured to follow redirects returned by the very upstream it forwarded to. Each of these lets an attacker steer the proxy's own outbound connection toward a destination the proxy was never meant to reach — an internal management interface, a cloud metadata endpoint, or a service on a segment the proxy has privileged access to precisely because it is the proxy. OWASP's Server-Side Request Forgery Prevention Cheat Sheet is written for exactly this class of problem and its core guidance applies directly to proxy configuration: restrict outbound reachability with network-layer rules so the proxy can only reach the specific upstream pool it is meant to serve, use an explicit allowlist of permitted upstream destinations rather than a blocklist of forbidden ones (blocklists are bypass-prone), and disable automatic following of redirects returned by upstreams so a compromised or malicious backend cannot use a redirect to send the proxy somewhere else on its behalf.",
      "**Access control belongs at the proxy layer too — as a second control, not a replacement for the backend's own authorization.** Because the proxy sees every request before any backend does, it is a natural place to enforce coarse controls that are expensive or easy to miss at the application layer: blocking public-listener access to administrative or management paths entirely, separating a public listener from an internal-management listener so the two have different exposure by construction, and rate-limiting or IP-restricting paths that should only ever be reached from a known internal set of callers. CIS Controls v8, Control 12 (Network Infrastructure Management) frames this as actively managing network devices and access points specifically to prevent exploitation of vulnerable services — a proxy's routing and listener configuration is exactly that kind of network infrastructure. The important failure mode to avoid is treating proxy-layer access control as sufficient on its own: it is a second, independent boundary that narrows what can reach the backend at all, not a substitute for the backend enforcing its own authorization on every request it receives, including requests the proxy already filtered.",
    ],
    validationEvidence: [
      "This guide is conceptual. It was not developed against a live or lab-reproduced environment, no proxy configuration or packet capture was reproduced, and no control described here was tested end-to-end. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the label must not be upgraded merely because the reasoning here is internally consistent or the cited sources are authoritative.",
    ],
    limitations: [
      "This guide covers general, vendor-neutral design principles, not a specific product's configuration syntax. Applying it requires translating each principle into your actual reverse-proxy software's directives and re-validating the result there.",
      "This guide deliberately does not repeat the home-lab-specific implementation detail already covered by SecurityCorp's separate reverse-proxy home-lab guide — split-DNS design, internal certificate-authority trust decisions for consumer client devices, and interface-change rollback planning for one specific lab setup. Readers building that specific pattern should use that guide alongside this one; this guide focuses on header trust, backend authentication, SSRF prevention, and proxy-layer access control, which that guide does not cover.",
      "It does not cover Web Application Firewall (WAF) rule design, DDoS mitigation, or detection and response once a proxy-layer control has already been bypassed — those are separate topics in SecurityCorp's network-security and detection-and-response content.",
    ],
    defensiveRecommendations: [
      "Decide explicitly whether the internal hop from proxy to backend is encrypted; do not let proximity to the proxy stand in for that decision.",
      "Configure the proxy to strip any client-supplied `X-Forwarded-For`, `Forwarded`, or `X-Forwarded-Proto` header before setting its own value, and configure the backend to trust those headers only when it can also verify the request came through the proxy.",
      "Give the proxy a verifiable identity toward each backend (mutual TLS or a signed service token) and reject backend requests that lack it, rather than trusting the proxy's network position.",
      "Restrict the proxy's outbound reachability to an explicit allowlist of upstream destinations, and disable automatic following of upstream-returned redirects.",
      "Enforce coarse access control at the proxy (listener separation, path restrictions on administrative routes, rate limiting) as a second, independent boundary — never as a replacement for backend-side authorization.",
      "Review the proxy configuration itself during security review, not only the applications behind it — a correct backend cannot compensate for a proxy that forwards a forged header or follows an attacker-controlled redirect.",
    ],
    keyTakeaways: [
      "A reverse proxy is a trust boundary: every property of the internal request it forwards (protocol, origin, identity, destination) is a decision it makes, not a fact it merely observes.",
      "`X-Forwarded-For` and `Forwarded` are ordinary, client-modifiable headers unless the proxy actively strips and overwrites them — RFC 7239 says this about its own header explicitly.",
      "Backend authentication of the proxy must be an actual credential (mutual TLS, signed token), not an inference from network location or source address.",
      "A proxy whose upstream selection is influenced by request data is exposed to SSRF (CWE-918) exactly like an application that fetches a user-supplied URL — allowlist destinations and disable redirect-following.",
      "Proxy-layer access control is a valuable second boundary; it does not remove the backend's own responsibility to authorize every request it receives.",
    ],
    references: [
      "NIST SP 800-52 Rev. 2, Guidelines for the Selection, Configuration, and Use of Transport Layer Security (TLS) Implementations: https://csrc.nist.gov/pubs/sp/800/52/r2/final",
      "NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations (see the SC-7 Boundary Protection control): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
      "NIST SP 800-207, Zero Trust Architecture: https://csrc.nist.gov/pubs/sp/800/207/final",
      "OWASP Server-Side Request Forgery Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html",
      "MITRE CWE-918, Server-Side Request Forgery (SSRF): https://cwe.mitre.org/data/definitions/918.html",
      "IETF RFC 7239, Forwarded HTTP Extension: https://www.rfc-editor.org/rfc/rfc7239",
      "CIS Controls v8, Control 12: Network Infrastructure Management: https://www.cisecurity.org/controls/network-infrastructure-management",
    ],
  },
  module: {
    kind: "guide",
    requirements: [
      "A documented list of every backend the proxy is meant to reach, and the specific route or virtual host that should reach each one — an undocumented upstream cannot be allowlisted.",
      "Authority to configure the proxy's header-handling, TLS, and routing behavior, and the backend's request-authentication behavior.",
      "A way to issue and rotate a proxy-to-backend credential (a client certificate or signed service token) independent of the application deployment pipeline.",
    ],
    procedure: [
      "Decide and document whether the proxy-to-backend hop is encrypted (TLS bridging) or plaintext, and confirm the choice matches the sensitivity of what is being forwarded.",
      "Configure the proxy to strip any client-supplied `X-Forwarded-For`, `Forwarded`, and `X-Forwarded-Proto` headers before setting its own values from the actual client connection.",
      "Issue the proxy a distinct service identity (client certificate or signed token) and configure every backend to require and verify it on requests it accepts, rejecting anything that arrives without it — including requests that arrive from the proxy's expected network segment but lack the credential.",
      "Enumerate every place the proxy's upstream selection can be influenced by request data (routing keyed on headers or path segments, redirect-following behavior) and replace open-ended resolution with an explicit allowlist of permitted upstream destinations.",
      "Disable automatic following of redirects returned by upstream services, or constrain any redirect-following to the same allowlist used for initial upstream selection.",
      "Separate public-facing listeners from any administrative or management listener, and block administrative paths from the public listener entirely rather than relying on application-layer checks alone.",
      "Confirm each backend still performs its own request authorization independent of the proxy's access control — the proxy narrows what can reach the backend, it does not decide what the backend is allowed to do.",
    ],
    validation: [
      "A request that includes an attacker-supplied `X-Forwarded-For` or `Forwarded` header arrives at the backend carrying only the proxy's own value, with the client-supplied value discarded.",
      "A direct connection attempt to a backend that presents no proxy credential (or an invalid one) is rejected, even when it originates from the proxy's expected network segment.",
      "An attempt to make the proxy forward a request to a destination outside its documented upstream allowlist — including via a crafted redirect from an upstream — fails.",
      "Administrative or management routes return a rejection when requested through the public listener and succeed only through the separated management path.",
    ],
    rollback: [
      "If enforcing the proxy credential unexpectedly blocks a legitimate backend integration, restore the prior authentication behavior for that specific backend only and confirm restored function before investigating further — do not disable the credential requirement across every backend as a workaround.",
      "If tightening the upstream allowlist breaks a route that turns out to be legitimate, add that specific destination to the allowlist with its justification recorded, rather than reverting to open-ended upstream resolution.",
      "Keep the prior proxy configuration recorded before each change so a revert restores a known-good state rather than a best guess at one, and re-run the validation steps above after every revert.",
    ],
  },
};
