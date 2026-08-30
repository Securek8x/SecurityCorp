// Knowledge-base article: "TLS Certificate Validation Explained" (Bead
// securitycorp-source-4zl.55.1.4). Not yet added to lib/knowledge-content.ts's
// `knowledgeArticles` — status stays "drafting" and every review record
// stays "pending" until the human owner reviews it, per
// docs/publication-safety-policy.md and docs/knowledge-base.md. All examples
// describe a fictional environment; no real domain, address, port,
// topology, or configuration appears anywhere in this file.
//
// This article is conceptually adjacent to "DNS as a Security Control and
// Attack Surface" and "Understanding Network Trust Boundaries"
// (lib/articles/dns-security-control-and-attack-surface.ts,
// lib/articles/network-trust-boundaries.ts). Those cover general
// boundary-identification and DNS's dual control/attack-surface role; this
// one is specific to the mechanics of TLS certificate validation itself —
// chain-of-trust path building, hostname verification, revocation checking,
// what a client actually checks versus what it silently accepts, and the
// common ways validation gets quietly disabled or weakened. It does not
// restate general trust-boundary placement or DNS resolution concepts.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

export const article: KnowledgeArticle = {
  meta: {
    title: "TLS Certificate Validation Explained",
    slug: "tls-certificate-validation-explained",
    summary:
      "How a TLS client actually decides to trust a certificate — chain-of-trust path building up to a root trust anchor, hostname verification, and revocation checking — and the specific, common ways that decision gets quietly weakened: soft-fail revocation, disabled verification left over from local development, and self-signed or hostname-mismatched certificates accepted anyway. Illustrated with a fictional certificate chain and a validation-bypass path.",
    pillar: "defend-systems",
    primaryCategory: "network-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["tls-pki", "authentication", "fail-closed-design", "security-control-validation"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 13,
    updatedAt: "2026-08-30",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "pending" },
    technicalReview: { status: "pending" },
    publicationApproval: { status: "pending" },
  },
  sections: {
    executiveSummary: [
      "TLS certificate validation is usually described as a single pass/fail outcome — the padlock is either there or it isn't — but it is actually a small sequence of independent checks, each of which can pass, fail, or be silently skipped without the other checks noticing. A client can build a cryptographically perfect chain of signatures from a presented certificate up to a trusted root and still be talking to the wrong server, if nobody separately confirmed the certificate's name matches the host being connected to. A client can confirm the name matches and the chain is valid and still be relying on a certificate that was revoked yesterday, if the revocation check timed out and the client's default is to proceed anyway rather than stop. None of this requires broken cryptography — TLS's signature algorithms are not the weak point. The weak point is almost always a validation step that was skipped, weakened, or quietly made optional somewhere between the specification and the running client.",
      "This guide walks through what a compliant TLS client is actually supposed to check — chain-of-trust path validation up to a trust anchor, hostname verification against the certificate's subject alternative names, and revocation status — and, for each one, the specific way it commonly gets bypassed in practice: a verification-disabling flag left on from local development, a self-signed certificate imported into a trust store and never re-evaluated, a revocation check that soft-fails open when its responder is unreachable. A fictional certificate chain — a presented certificate, an intermediate CA, and a root trust anchor — runs through this guide and its accompanying interactive diagram, shown both validating correctly and reaching a validation-bypass outcome where the same presented certificate is accepted without ever building that chain at all.",
    ],
    whatYouWillLearn: [
      "How chain-of-trust path validation actually works: what a client checks about each certificate in the chain, and why a valid signature chain alone does not mean the connection is trustworthy.",
      "Why hostname verification (RFC 6125) is a separate check from chain validation, and how a certificate can be perfectly valid and still be the wrong certificate for the connection being made.",
      "How revocation checking works through CRLs and OCSP, and why 'soft-fail' revocation behavior is one of the most common ways a compromised or misissued certificate keeps being accepted.",
      "The specific, recurring ways certificate verification gets disabled or weakened in practice — not as an exploitation guide, but so each one can be found and closed.",
      "How to validate that a TLS client's certificate checking actually rejects a bad certificate, instead of assuming it does because a configuration setting exists.",
    ],
    intendedAudience: [
      "Network defenders and security practitioners deciding what TLS validation behavior to require, and how to confirm a client or service actually enforces it.",
      "Practitioners investigating whether an existing service's TLS configuration provides real certificate validation or only the appearance of it.",
      "Engineers who have encountered a certificate-verification error, disabled the check to move past it, and want to understand exactly what that disabled and how to close it safely.",
    ],
    prerequisites: [
      "A conceptual understanding of the TLS handshake — that a server presents a certificate and the client is expected to decide whether to trust it before proceeding.",
      "A conceptual understanding of public-key cryptography: a key pair, a digital signature, and the idea that a signature can be verified against a public key without knowing the corresponding private key.",
      "Comfort with the general idea of a trust boundary; see Understanding Network Trust Boundaries if that concept is unfamiliar. This guide assumes it as background and does not re-derive it.",
      "No lab environment is required to follow this guide; it is conceptual and uses a fictional certificate chain throughout.",
    ],
    problem: [
      "TLS certificate validation is treated, by most people who rely on it daily, as something that either works or produces an obvious, unmissable error. In practice it is a checklist executed by a specific piece of client code, and every item on that checklist can be individually satisfied, individually skipped, or individually weakened without the others noticing or compensating. A browser, a command-line HTTP client, a backend service's outbound HTTP library, and a custom TLS implementation embedded in an appliance do not all execute the same checklist with the same defaults — and the gap between 'validation exists in principle' and 'validation is actually enforced by this specific client, right now' is exactly where certificate-based attacks succeed.",
      "The failure pattern that causes the most real-world damage is not a cryptographic break. It is a developer or operator who hit a certificate error during setup or local development — an internal service with a self-signed certificate, a test environment with an expired one, a hostname that didn't quite match — and reached for the fastest available fix: a flag, an environment variable, or a code change that disables verification entirely, intending it as temporary. That change is rarely temporary in practice, because once the error stops appearing, there is no ongoing signal that anything is still wrong. The client keeps working, indistinguishably from a client doing real validation, right up until it is presented with a certificate an attacker controls.",
    ],
    threatModel: [
      "This guide's threat model is an adversary attempting to have a TLS client accept a certificate it should reject — one the adversary controls, one that has been revoked, or one whose name does not actually match the service being reached. This does not require the adversary to break TLS's cryptography or forge a signature over a certificate they were never issued. It requires only that the validating client, for whatever reason, does not fully execute the checklist described in this guide: it accepts a chain that does not actually resolve to a trusted root, accepts a certificate whose name does not match the host being connected to, or accepts a certificate without successfully confirming it has not been revoked.",
      "The adversary's position ranges from on-path (able to intercept and respond to a connection attempt, for instance from a compromised or rogue point on the network path) to simply operating a service the client was misdirected toward. In both cases, the adversary's own certificate — self-signed, issued by a CA the client should not trust, or valid for a different name entirely — is what gets presented. Whether that certificate succeeds depends entirely on whether the checklist below is actually enforced, which is why this guide treats each check, and each way it commonly gets weakened, separately rather than as one undifferentiated 'certificate validation' feature.",
    ],
    mainContent: [
      "**Chain-of-trust path validation.** A TLS server presents a leaf (end-entity) certificate, typically along with one or more intermediate CA certificates, forming a chain. Path validation, as defined in RFC 5280, means the client cryptographically confirms that each certificate in that chain was actually signed by the private key corresponding to the next certificate's public key, all the way up to a root certificate the client already trusts as a starting point — a trust anchor, held in the client's or operating system's trust store, never itself validated against anything else. Along the way the client also has to confirm each certificate's validity period covers the current time, that each intermediate is actually marked as a CA certificate with permission to issue further certificates (the basic constraints extension), and that the leaf certificate's extended key usage permits it to be used for server authentication. A chain that fails any one of these checks — an expired intermediate, a leaf signed by a certificate that isn't actually marked as a CA, a signature that doesn't verify — is not a valid chain, regardless of how legitimate the rest of it looks.",
      "**Hostname verification is a separate check.** RFC 6125 governs a question path validation does not answer at all: does this certificate — assuming its chain is perfectly valid — actually belong to the specific host the client meant to connect to? The client compares the hostname it intended to reach against the certificate's Subject Alternative Name (SAN) entries of type dNSName. The older practice of falling back to the certificate's Common Name (CN) field when no SAN is present is deprecated and, in modern browsers and most current TLS libraries, not honored at all — a certificate with no matching SAN entry should fail hostname verification even if its CN happens to match. A certificate for one legitimately owned service, presented in response to a connection intended for a different service, will pass chain validation perfectly and still represent a validation failure once the hostname check runs — which is exactly why the two checks have to be treated as independent, not as one 'the certificate is valid' outcome.",
      "**Revocation checking: CRLs, OCSP, and the soft-fail problem.** A certificate can be chain-valid, correctly named, and still compromised — its private key exposed, or the issuing CA determining it was misissued — after it was already issued. Revocation checking is how a client is supposed to catch that: consulting a Certificate Revocation List (CRL) published by the issuing CA, or querying that CA's OCSP responder directly (RFC 6960), or accepting a fresh, signed OCSP response the server itself attaches during the handshake (OCSP stapling, defined as a TLS extension in RFC 6066). All three approaches share the same operational weak point: what happens when the check cannot be completed at all, because the CRL can't be fetched or the OCSP responder doesn't answer in time. A client that 'hard-fails' treats an incomplete revocation check as a validation failure and refuses the connection. A client that 'soft-fails' proceeds as if the certificate were confirmed unrevoked. Soft-fail is a common default, precisely because a hard-fail default turns a CA's own infrastructure outage into every one of its relying parties' outage — but it also means an adversary who can prevent the revocation check from completing (far easier than defeating chain validation or hostname matching) gets the same result as an adversary who successfully proved the certificate was still valid.",
      "**What a client actually checks versus what it silently accepts.** A correctly implemented, correctly configured TLS client checks all three of the above as independent, mandatory conditions: a chain that resolves to a trusted root, a hostname that matches a SAN entry, and a revocation status that is either confirmed unrevoked or — if the deployment has made a deliberate, documented, fail-closed choice — cannot be treated as confirmed. What gets silently accepted, in real deployments, is usually not a documented exception to any of these; it is a gap between what the client's documentation describes and what the client's actual configuration or code does in this specific deployment. A soft-fail revocation default accepts an unrevoked-or-unknown certificate as if the two were the same outcome. A client library with certificate verification disabled accepts anything presented to it, with no distinction between a legitimate certificate and an attacker's. Neither of these produces an error message, a log entry, or any other signal that validation is not actually happening — from the outside, and often from the client's own perspective, the connection looks identical to one that was properly validated.",
      "**Common validation-bypass mistakes.** The recurring pattern behind most real-world certificate-validation failures is a deliberate, narrowly intended shortcut that outlives the situation that motivated it. Verification gets disabled — through a client-library flag, an environment variable, or a few lines of code that accept any certificate — to get past an error encountered against an internal service with a self-signed certificate or a test environment with an expired one, and the change is never reverted once the immediate obstacle is gone. A self-signed certificate gets imported directly into a trust store to make an internal service 'just work,' without any process for re-evaluating or expiring that trust decision later, effectively creating a permanent, unmonitored trust anchor outside the normal CA ecosystem. A hostname check gets weakened — accepting any certificate from a given issuer regardless of its SAN entries, or accepting a wildcard match broader than the deployment actually requires — to avoid maintaining exact hostname configuration across environments. None of these mistakes require an attacker to do anything sophisticated; they only require the client, at the moment it matters, not to be doing the validation its documentation claims it does.",
      "**Validating the control instead of assuming it.** Enabling certificate verification, or confirming a configuration file says validation is on, is not evidence that a specific client actually rejects a bad certificate — it is evidence that a setting exists. The only reliable way to know whether chain validation, hostname verification, and revocation checking are actually enforced is to present the client with a certificate that should fail each one, individually, in an isolated test: a self-signed certificate or one issued by a CA outside the trust store, to test chain validation; a chain-valid certificate for the wrong hostname, to test hostname verification; and a scenario where the revocation check cannot complete, to observe — not assume — whether the client fails closed or soft-fails. A client that has never been tested against a deliberately invalid certificate has not been shown to reject one, no matter how confident its configuration reads.",
    ],
    validationEvidence: [
      "This guide is conceptual. It was not developed against a live or lab-reproduced environment, no certificate chain, client configuration, or validation behavior was reproduced, and no client described here was tested end-to-end. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the label must not be upgraded merely because the reasoning here is internally consistent.",
    ],
    limitations: [
      "This guide covers TLS certificate validation mechanics specifically; it does not cover general trust-boundary identification or DNS's dual role as a control and attack surface — see Understanding Network Trust Boundaries and DNS as a Security Control and Attack Surface for those, which this guide assumes as background where relevant.",
      "It does not evaluate a specific browser's, operating system's, or TLS library's actual default behavior, version-by-version — those defaults change over time and differ across implementations, and applying this guide to a real environment requires confirming the specific client's current, actual behavior rather than assuming it from this guide's general description.",
      "It does not cover TLS 1.3's handshake-level changes, cipher-suite selection, or session-resumption mechanics in depth; it is scoped to the certificate-validation decision itself, which is materially unchanged in its trust-model fundamentals across TLS versions.",
      "It does not cover incident response once an accepted-but-invalid certificate is discovered in use — that is covered by SecurityCorp's detection and incident-response content, not this guide.",
    ],
    defensiveRecommendations: [
      "Treat every TLS client and outbound HTTP library in an environment as a separate thing to verify, not one property of the environment as a whole — a client-side library's default can differ from the platform's default even when both are configured 'normally.'",
      "Require hard-fail behavior for revocation checks on any connection protecting a sensitive resource, and explicitly document and time-box any deployment where soft-fail is accepted as a deliberate tradeoff, rather than leaving it as an unexamined library default.",
      "Track every place certificate verification has ever been disabled to work around a local development or test-environment error, and confirm each one is scoped to that environment only — not left active in anything that reaches production traffic.",
      "Prefer fixing the underlying certificate problem (issuing a properly chained certificate, correcting a hostname mismatch, renewing before expiry) over importing a self-signed certificate directly into a trust store as a permanent workaround.",
      "Confirm hostname verification checks the certificate's SAN entries specifically, not a broader wildcard or issuer-level match than the deployment actually requires.",
      "Validate every TLS validation control the way any other control should be validated: with a deliberately invalid certificate that exercises the specific failure it claims to catch, not by confirming the relevant setting exists.",
    ],
    keyTakeaways: [
      "TLS certificate validation is a checklist of independent checks — chain-of-trust path validation, hostname verification, and revocation checking — not one pass/fail outcome; each check can be individually skipped or weakened without the others compensating.",
      "A chain that resolves cryptographically to a trusted root does not confirm the certificate belongs to the host being connected to — hostname verification (RFC 6125) is a separate check.",
      "Revocation checking's soft-fail default is one of the most common, least visible ways a revoked or compromised certificate keeps being accepted — an incomplete check is not the same outcome as a confirmed-unrevoked one.",
      "The most common real-world validation failures are not cryptographic breaks; they are a verification-disabling shortcut, taken to solve a local or test-environment problem, that was never reverted.",
      "A TLS client that has never been tested against a deliberately invalid certificate — self-signed, hostname-mismatched, or unrevoked-unconfirmed — has not been shown to reject one, regardless of how its configuration reads.",
    ],
    references: [
      "RFC 5280, Internet X.509 Public Key Infrastructure Certificate and Certificate Revocation List (CRL) Profile: https://www.rfc-editor.org/rfc/rfc5280",
      "RFC 6125, Representation and Verification of Domain-Based Application Service Identity within Internet PKI Using X.509 Certificates: https://www.rfc-editor.org/rfc/rfc6125",
      "RFC 6960, X.509 Internet Public Key Infrastructure Online Certificate Status Protocol (OCSP): https://www.rfc-editor.org/rfc/rfc6960",
      "RFC 6066, Transport Layer Security (TLS) Extensions: Extension Definitions (includes the Certificate Status Request extension underlying OCSP stapling): https://www.rfc-editor.org/rfc/rfc6066",
      "CA/Browser Forum, Baseline Requirements for the Issuance and Management of Publicly-Trusted Certificates: https://cabforum.org/baseline-requirements/",
    ],
    relatedSlugs: ["understanding-network-trust-boundaries", "dns-security-control-and-attack-surface"],
  },
  module: {
    kind: "guide",
    requirements: [
      "A documented inventory of every TLS client and outbound HTTP or service library in scope, and which trust store (system-level or application-bundled) each one actually uses.",
      "Authority to generate isolated test certificates — a deliberately self-signed certificate, a chain-valid certificate for the wrong hostname, and a chain-valid but expired certificate — for validation testing without affecting production traffic.",
      "A way to present each test certificate to a client under test through an isolated path that does not touch a production service or a real end user.",
      "Access to each client's actual validation configuration or source, not only its documentation — verification-disabling flags are frequently set in application code, an environment variable, or build tooling rather than in the primary configuration file an audit would normally review.",
    ],
    procedure: [
      "Inventory every place certificate verification could be disabled or weakened across the environment: application code, HTTP client library defaults, command-line flags, environment variables, and CI or build tooling that talks to internal services.",
      "For each TLS client in scope, confirm which trust store it actually uses at runtime, and whether any certificate has been imported into that trust store as a standing exception.",
      "Present a self-signed certificate, or one signed by a CA outside the trust store, to each client under test and confirm the connection is refused rather than completed.",
      "Present a chain-valid certificate for a hostname other than the one being connected to, and confirm the client refuses the connection on the hostname mismatch even though the chain itself validates.",
      "Present a chain-valid, correctly named certificate that is expired, and confirm the client refuses the connection.",
      "For each client, determine and record what it does when a revocation check cannot be completed — whether it fails closed (rejects) or soft-fails (accepts) — rather than assuming the answer from documentation.",
      "Remove or explicitly scope-limit any verification-disabling flag found during the inventory step that is not confined to an isolated test environment.",
    ],
    validation: [
      "Every TLS client in scope rejects a self-signed or untrusted-chain certificate in a controlled test, observed directly rather than assumed from configuration.",
      "Every TLS client rejects a hostname-mismatched certificate even when that certificate's chain is otherwise valid.",
      "Every TLS client rejects an expired certificate.",
      "Each client's revocation-check failure behavior (fail-closed or soft-fail) is recorded as an observed result, and any soft-fail behavior protecting a sensitive resource is an explicit, documented decision rather than an unexamined default.",
      "No verification-disabling flag or manually imported trust-store exception remains active outside an isolated test environment.",
    ],
    rollback: [
      "If moving a revocation check from soft-fail to hard-fail breaks legitimate traffic because a responder is unreliable, address the responder's availability or add OCSP stapling first — do not silently reintroduce soft-fail as the permanent fix without recording the exception explicitly.",
      "If tightening hostname or chain validation breaks a legitimate internal service, correct that service's certificate deployment rather than re-enabling a verification-disabling flag to restore connectivity.",
      "Keep a record of each client's validation configuration immediately before a change, so a revert restores a known state rather than a best guess at one.",
    ],
  },
  diagram: buildDiagram(),
};

function buildDiagram(): FlowDiagramSpec {
  return {
    titleId: "tls-validation-diagram",
    title: "Fictional TLS certificate chain-of-trust validation",
    desc: "A fictional TLS client validates a presented certificate by building a chain through an intermediate CA up to a trusted root CA, and confirming the hostname matches along the way. Interactive: toggle to a validation-bypass view where the same presented certificate — self-signed or hostname-mismatched — reaches a client whose verification has been disabled or weakened, and is accepted without ever building that chain. Explore each node for detail.",
    viewBox: "0 0 900 380",
    failureLabel: "Validation bypass",
    caption:
      "Client → presented certificate → intermediate CA → root CA (trust anchor), normally, with hostname verification confirmed along the way. The validation-bypass view shows the same presented certificate instead reaching a client whose verification has been disabled or weakened — skipping the intermediate and root entirely — with a return path showing the connection proceeding as if it had been validated.",
    motionDuration: 2600,
    mainPacketRoute: { d: "M160,145 H200 M390,145 H430 M610,145 H650", length: 120 },
    edges: [
      { id: "client-presented", from: "client", to: "presented", d: "M160,145 H200", length: 40, kind: "main", activeIn: ["normal", "failure"] },
      { id: "presented-intermediate", from: "presented", to: "intermediate", d: "M390,145 H430", length: 40, kind: "main", activeIn: ["normal"] },
      { id: "intermediate-root", from: "intermediate", to: "root", d: "M610,145 H650", length: 40, kind: "main", activeIn: ["normal"] },
      { id: "presented-bypass", from: "presented", to: "bypass", d: "M295,190 V260", length: 70, kind: "failure", activeIn: ["failure"] },
      {
        id: "bypass-client-return",
        from: "bypass",
        to: "client",
        d: "M300,295 C160,345 20,300 20,180",
        length: 340,
        kind: "failure",
        activeIn: ["failure"],
      },
    ],
    nodes: [
      {
        id: "client",
        label: "TLS client",
        x: 10,
        y: 110,
        w: 150,
        h: 70,
        activeIn: ["normal", "failure"],
        description:
          "The connecting client in this fictional exchange — a browser, a backend service's outbound HTTP library, or any other TLS implementation. In the normal-path view it performs the full validation checklist before trusting the connection. In the validation-bypass view, the same client has verification disabled or weakened somewhere in its configuration or code, so it accepts whatever certificate is presented without completing that checklist.",
      },
      {
        id: "presented",
        label: "Presented certificate",
        x: 200,
        y: 100,
        w: 190,
        h: 90,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "Presented certificate — the leaf (end-entity) certificate offered by the remote endpoint; the point where chain validation, hostname verification, and revocation checking are all supposed to be enforced",
        description:
          "The leaf certificate offered by the remote endpoint during the handshake. In the normal-path view, this certificate's signature chains correctly to an intermediate and then a trusted root, and its Subject Alternative Name matches the hostname the client meant to reach. In the validation-bypass view, this is the identical presented certificate — self-signed, or valid for a different hostname — but the client's disabled verification never actually inspects it against either check before proceeding.",
      },
      {
        id: "intermediate",
        label: "Intermediate CA",
        x: 430,
        y: 100,
        w: 180,
        h: 90,
        activeIn: ["normal"],
        description:
          "An intermediate certificate authority in the fictional chain, itself certified by the root. Path validation confirms this certificate is marked as a CA (the basic constraints extension), is within its validity period, and actually signed the presented certificate — this step is entirely skipped in the validation-bypass view, since a client with verification disabled never attempts to build a chain at all.",
      },
      {
        id: "root",
        label: "Root CA (trust anchor)",
        x: 650,
        y: 105,
        w: 180,
        h: 80,
        activeIn: ["normal"],
        role: "safe",
        description:
          "The trust anchor: a root certificate already present in the client's trust store, never itself validated against anything else. Reaching it with an unbroken, correctly signed chain is the expected, validated outcome of the normal path — the client's confirmation that the presented certificate was genuinely issued through a trusted certificate authority, not merely that a certificate of some kind was offered.",
      },
      {
        id: "bypass",
        label: "Verification disabled",
        x: 200,
        y: 260,
        w: 190,
        h: 70,
        activeIn: ["failure"],
        role: "blocked",
        focusableLabel:
          "Verification disabled — a client-side flag, environment variable, or code path that accepts any presented certificate, typically left over from working around a local development or test-environment certificate error",
        description:
          "Represents a client whose certificate verification has been disabled or substantially weakened — commonly a leftover shortcut from working past a self-signed or expired certificate during local development or testing, never reverted. Nothing about the presented certificate changes here; what changes is that neither the chain-of-trust check nor the hostname check is actually performed, so a certificate that should have been rejected is accepted exactly as if it had passed both.",
      },
    ],
  };
}
