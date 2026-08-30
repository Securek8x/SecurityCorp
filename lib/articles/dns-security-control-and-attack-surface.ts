// Knowledge-base article: "DNS as a Security Control and Attack Surface"
// (Bead securitycorp-source-4zl.55.1.3). Not yet added to
// lib/knowledge-content.ts's `knowledgeArticles` — status stays "drafting"
// and every review record stays "pending" until the human owner reviews it,
// per docs/publication-safety-policy.md and docs/knowledge-base.md. All
// examples describe a fictional environment; no real domain, address, port,
// topology, or configuration appears anywhere in this file.
//
// This article is conceptually adjacent to "Understanding Network Trust
// Boundaries" and "Segmentation vs Isolation" (lib/articles/network-trust-
// boundaries.ts, lib/articles/segmentation-vs-isolation.ts). Those cover
// general boundary-identification and segmentation-versus-isolation
// decisions; this one is specific to DNS's dual role — the same protocol
// that can serve as a monitored security control (filtering, DNSSEC
// validation, query monitoring) is also a common attack surface in its own
// right (cache poisoning, subdomain takeover, tunneling/covert C2). It does
// not restate general boundary or segmentation concepts.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

export const article: KnowledgeArticle = {
  meta: {
    title: "DNS as a Security Control and Attack Surface",
    slug: "dns-security-control-and-attack-surface",
    summary:
      "DNS is both a place to enforce security controls — filtering, monitoring, DNSSEC validation — and a protocol attackers abuse in its own right, through cache poisoning, subdomain takeover, and tunneling used as a covert command-and-control channel. A decision framework for treating DNS as a control point instead of invisible plumbing, illustrated with a fictional resolution and tunneling path.",
    pillar: "defend-systems",
    primaryCategory: "network-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["dns", "threat-modeling", "detection-engineering", "logging-monitoring"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 13,
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
  sections: {
    executiveSummary: [
      "DNS occupies an unusual position in most network designs: it is treated as invisible infrastructure — plumbing that has to work for everything else to work — rather than as a protocol that deserves the same scrutiny given to HTTP, SSH, or any other traffic crossing a boundary. That treatment cuts both ways. It means DNS is rarely used deliberately as a security control, even though a resolver is a natural place to filter known-malicious destinations, validate that a response hasn't been tampered with, and log query patterns that reveal a compromised host long before that host does anything else observable. It also means DNS is an unusually effective attack surface, because a protocol nobody inspects closely is a protocol an attacker can abuse without triggering the controls built for other traffic.",
      "This guide treats those as two sides of one decision, not two separate topics. It covers DNS as a security control — filtering, query monitoring, and DNSSEC validation, and what each one actually does and does not protect against — and DNS as an attack surface in its own right, through cache poisoning against the resolution process, subdomain takeover of dangling records, and tunneling that turns query and response fields into a covert channel for exfiltration and command-and-control. A fictional resolution path — a client, a network egress control, a recursive resolver, and an authoritative server — runs through this guide and its accompanying interactive diagram, shown both as it behaves normally and as it behaves when a compromised host uses the same protocol path to run a tunnel instead of an ordinary lookup.",
    ],
    whatYouWillLearn: [
      "How DNS filtering, query monitoring, and DNSSEC validation each function as a distinct security control, and what each one does and does not actually protect against.",
      "How DNS cache poisoning works as an attack on the resolution process itself, distinct from attacks that abuse DNS as a channel.",
      "How a dangling DNS record becomes a subdomain-takeover exposure, and why it inherits the trust of the domain it points from.",
      "How DNS tunneling encodes data in query and response fields to build a covert exfiltration or command-and-control channel that bypasses controls built for other protocols.",
      "Why a control that only checks domain reputation misses channel-abuse patterns, and what has to be validated in addition to a blocklist for DNS security controls to be trustworthy.",
    ],
    intendedAudience: [
      "Network defenders and security practitioners deciding what DNS-layer controls to deploy and how to validate that they actually work.",
      "Practitioners investigating whether an existing DNS resolver configuration provides real filtering and monitoring or only the appearance of it.",
      "Engineers who treat DNS as infrastructure to keep running rather than as a control point or a surface that needs its own review.",
    ],
    prerequisites: [
      "Familiarity with the basic DNS resolution process — a client query, a recursive resolver, and an authoritative server providing an answer.",
      "Comfort with the general idea of a network trust boundary; see Understanding Network Trust Boundaries if that concept is unfamiliar.",
      "No lab environment is required to follow this guide; it is conceptual and uses a fictional resolution path throughout.",
    ],
    problem: [
      "Most network designs apply careful, layered inspection to HTTP and HTTPS egress traffic — proxies, content filtering, TLS inspection where policy allows it — and then permit DNS outbound almost without exception, because a host that cannot resolve names cannot do much of anything else. That asymmetry is well understood by attackers and rarely revisited by defenders: DNS gets a structural pass through controls tuned for other protocols, precisely because blocking it outright would break normal operation. The result is a protocol that is simultaneously essential to allow and rarely inspected closely enough to notice when it is being used for something other than name resolution.",
      "The same blind spot exists on the other side of the relationship. Organizations that do treat DNS as a control point often stop at domain reputation — block the resolver from answering for known-bad destinations — without asking whether that control would catch a newly registered domain being used as a tunnel endpoint, or whether a dangling record pointing at a deprovisioned third-party resource has quietly turned part of their own domain into someone else's to serve content from. Both failures come from the same root cause as the DNS-as-attack-surface problem: treating DNS as something that either always works and needs no review, or is 'handled' because a blocklist exists, rather than as infrastructure with its own attack surface that has to be validated like any other control.",
    ],
    threatModel: [
      "This guide's threat model covers two distinct adversary goals, both represented in the accompanying interactive diagram. The first treats DNS as a channel to abuse: an adversary who has already compromised a host, or wants to establish command-and-control on one, uses DNS queries and responses to move data or receive instructions, specifically because DNS traffic is far less likely to be inspected or blocked than other outbound protocols. This does not require compromising DNS infrastructure at all — it only requires that a resolver somewhere along the path will forward a query and return whatever answer the attacker's own authoritative server provides.",
      "The second treats DNS itself as the target: an adversary attempting to make a resolver, or a client relying on one, accept an answer that was never legitimately produced by the domain's actual authoritative server, most commonly through cache poisoning; or an adversary who finds a domain's own DNS records point at a resource the domain owner no longer controls, and claims that resource to serve content under the victim's trusted name through subdomain takeover. Both goals matter independently — a resolver that filters and monitors well is not thereby protected against cache poisoning, and DNSSEC deployed correctly does not detect a tunnel built entirely from legitimately signed, freshly registered infrastructure.",
    ],
    mainContent: [
      "**DNS as a security control.** A recursive resolver is a natural enforcement and observation point, because effectively every host on a network depends on it. Filtering — checking a queried domain against a reputation or policy list and refusing to resolve known-malicious destinations — stops a client from reaching an already-identified bad domain before any connection to it is attempted. Query monitoring — logging what is queried, how often, and in what pattern — gives a defender visibility that exists before any other protocol is involved, since a compromised host typically has to resolve a name before it can reach whatever that name points to. DNSSEC validation is a different control with a narrower, frequently misunderstood scope: it authenticates that a signed response actually came from the zone's legitimate authoritative chain and was not altered in transit, but it does not encrypt the query or the response — anyone observing the traffic can still see what was asked and answered — and it protects nothing for a zone that isn't signed in the first place.",
      "**DNS as an attack surface: cache poisoning.** Cache poisoning targets the resolution process itself rather than any downstream connection. A resolver that accepts a forged response — because the response arrived with a guessable or reused transaction identifier and source port, or because the resolver has no way to authenticate that the response actually came from the zone's real authoritative server — will cache and return that forged answer to every client that queries the same name until the cache entry expires. The defenses are specific and layered rather than a single fix: strong randomization of the transaction identifier and source port used for each outbound query makes off-path forgery harder to guess, and DNSSEC validation, where the target zone is signed, lets the resolver cryptographically reject a response that didn't actually come from the legitimate chain, regardless of how well an attacker guessed the transaction details.",
      "**DNS as an attack surface: subdomain takeover.** A subdomain-takeover exposure starts as ordinary DNS hygiene debt: a CNAME or delegation record pointing at a third-party-hosted resource — a content platform, a cloud storage endpoint, a hosted application — that gets deprovisioned without the DNS record that pointed at it ever being removed. The record still resolves, but it now points at nothing, or at a slot the hosting provider will hand out to the next person who claims the matching name. An attacker who finds such a record can claim the now-unclaimed resource and serve their own content from it — content that appears to browsers, security tools, and users to be served from the victim's own subdomain, inheriting whatever trust, cookies, or content-security-policy allowances that domain carries. This is not a DNS-protocol flaw; it is an operational gap between decommissioning a resource and removing the record that pointed at it, and it is invisible to filtering or monitoring controls that only inspect queries a client makes, because the exposure sits in the organization's own outbound-facing records rather than in anything a client resolves.",
      "**DNS as an attack surface: tunneling and covert command-and-control.** Tunneling encodes data into the parts of a DNS query and response that were designed to carry names and records, not arbitrary payloads: a subdomain label built from encoded exfiltrated data, sent as a query to a domain the attacker controls and is authoritative for; a reply carrying encoded commands or acknowledgements in a TXT, NULL, or similarly flexible record type. Nothing about an individual query in this exchange is malformed — it is a syntactically valid DNS message to a domain the attacker legitimately registered and administers. What makes it attractive to an adversary is exactly the asymmetry described in the problem section above: outbound DNS is close to universally permitted, rarely deep-inspected, and not subject to the same content controls applied to HTTP egress, so a channel built entirely from DNS traffic can move data and receive instructions with a materially lower chance of being blocked by controls designed for other protocols.",
      "**Where the two roles meet.** The same DNS traffic a filtering and monitoring control inspects is the exact channel an attacker running a tunnel is trying to use, which means the two roles in this guide's title are not independent — a control built only around the first without the second gives an attacker an easy way through. A reputation blocklist stops a client from reaching an already-identified bad domain, but a domain registered specifically for tunneling is, by construction, not on any blocklist yet; reputation filtering catches known-bad destinations, not channel-abuse patterns. Detecting the second requires different signals entirely: unusually long or high-entropy query names, a record-type mix skewed toward TXT or NULL relative to ordinary resolution traffic, regular-interval query timing consistent with polling rather than human-driven lookups, and query volume to a single domain far above what ordinary name resolution would produce. None of those signals require the destination domain to already be known-bad.",
      "**Validating the control instead of assuming it.** Enabling a filtering policy, turning on query logging, or flipping on DNSSEC validation is a configuration change, not evidence that the control works. Filtering should be validated by confirming a deliberately test-blocked domain is actually refused, not by confirming the setting exists in a configuration file. DNSSEC validation should be validated by confirming the resolver actually rejects a deliberately invalid signed response, and by explicitly recording — not assuming — what the resolver does when it cannot reach the infrastructure needed to validate, since a validator that quietly falls back to accepting an unvalidated answer under failure conditions provides none of the protection its presence implies. Anomaly-based monitoring for tunneling-shaped traffic should be validated by generating synthetic traffic that matches the failure patterns described above, in isolation from production, and confirming the logging and detection actually fire on it — a dashboard that has never detected a known test pattern has not been shown capable of detecting an unknown one.",
    ],
    validationEvidence: [
      "This guide is conceptual. It was not developed against a live or lab-reproduced environment, no DNS traffic, configuration, or detection output was reproduced, and no control described here was tested end-to-end. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the label must not be upgraded merely because the reasoning here is internally consistent.",
    ],
    limitations: [
      "This guide covers DNS-specific controls and attack surface; it does not cover general trust-boundary identification or the segmentation-versus-isolation decision — see Understanding Network Trust Boundaries and Segmentation vs Isolation for those, which this guide assumes as background where relevant.",
      "It does not evaluate a specific vendor's protective DNS product, resolver software, or DNSSEC tooling. Applying it to a real environment requires translating each principle into that environment's actual resolver configuration and re-validating the result there.",
      "It does not cover the client-side privacy and policy debate around DNS over HTTPS or DNS over TLS bypassing network-level DNS controls in depth, beyond noting in this guide's requirements and procedure that an approved-resolver check has to include confirming clients cannot silently route around it through an alternate encrypted DNS path.",
      "It does not cover incident response once a tunnel, poisoning event, or takeover has already been confirmed — that is covered by SecurityCorp's detection and incident-response content, not this guide.",
    ],
    defensiveRecommendations: [
      "Treat the recursive resolver as a control point, not invisible infrastructure: enable filtering against a maintained reputation or policy list, and confirm the block is enforced at the resolver rather than only recommended by a dashboard a client can ignore.",
      "Enable DNSSEC validation for signed zones, and explicitly decide and record what the resolver does with an unsigned zone or a validation failure — an unexamined fallback to an unvalidated answer defeats the purpose of enabling validation at all.",
      "Log DNS queries with enough detail to compute per-host query volume by record type, name length, and name entropy — the signals that distinguish tunneling-shaped traffic from ordinary resolution, which reputation filtering alone will not catch for a newly registered tunnel domain.",
      "Audit externally facing DNS records on a recurring schedule for delegations or CNAMEs pointing at a third-party resource that may no longer be provisioned, and remove or re-point any dangling record found rather than treating the audit as a one-time cleanup.",
      "Confirm clients cannot bypass the approved, monitored resolver through an unapproved external resolver or a client-configured encrypted DNS path — a control enforced at one resolver protects nothing if a host can simply resolve elsewhere.",
      "Validate every DNS control the way any other control should be validated: with a deliberate test that exercises the specific failure it claims to catch, not by confirming the relevant setting exists.",
    ],
    keyTakeaways: [
      "DNS is both a security control point — filtering, monitoring, DNSSEC validation — and an attack surface in its own right; a defense built around one role without the other leaves the second one open.",
      "Cache poisoning attacks the resolution process itself; subdomain takeover attacks a dangling record's residual trust; tunneling abuses DNS as a channel. They are three different problems with three different defenses, not one 'DNS security' fix.",
      "DNSSEC authenticates that a signed response came from the legitimate zone; it does not encrypt DNS traffic and protects nothing for an unsigned zone.",
      "Reputation-based filtering catches known-bad destinations, not channel-abuse patterns — detecting tunneling requires query-shape and timing signals a blocklist alone does not provide.",
      "A DNS control that has never been tested against the specific failure it claims to catch — a blocked domain, an invalid signature, synthetic tunneling traffic — has not been shown to work, regardless of how confidently its configuration reads.",
    ],
    references: [
      "RFC 1035, Domain Names — Implementation and Specification: https://www.rfc-editor.org/rfc/rfc1035",
      "RFC 4033, DNS Security Introduction and Requirements (DNSSEC): https://www.rfc-editor.org/rfc/rfc4033",
      "RFC 7858, Specification for DNS over Transport Layer Security (DoT): https://www.rfc-editor.org/rfc/rfc7858",
      "RFC 8484, DNS Queries over HTTPS (DoH): https://www.rfc-editor.org/rfc/rfc8484",
      "NIST SP 800-81 Rev. 3, Secure Domain Name System (DNS) Deployment Guide: https://csrc.nist.gov/pubs/sp/800/81/r3/final",
    ],
    relatedSlugs: ["understanding-network-trust-boundaries", "segmentation-vs-isolation"],
  },
  module: {
    kind: "guide",
    requirements: [
      "A documented inventory of every DNS resolver a client is permitted to use — internal recursive resolvers and any approved external or protective DNS service — and confirmation that no other resolution path exists, including a client-configured encrypted DNS path that bypasses the approved resolver.",
      "Authority to enable and adjust query logging, filtering/reputation policy, and DNSSEC validation on the resolvers in scope without a separate change-control cycle for every adjustment during initial baselining.",
      "A way to generate synthetic DNS traffic shaped like the failure patterns being defended against — encoded query labels, elevated TXT/NULL query volume, regular-interval query timing — without sending it to a real external destination or affecting production resolution.",
      "A recorded inventory of externally facing DNS records — CNAMEs and delegations pointing outside the organization's own infrastructure — to check for subdomain-takeover exposure.",
    ],
    procedure: [
      "Confirm every client actually resolves through an approved resolver. A host configured to use its own external resolver, or a browser configured to use encrypted DNS directly to a third-party resolver, bypasses whatever filtering and monitoring the approved resolver provides.",
      "Enable filtering against a maintained reputation or policy list on the approved resolver, and confirm the block is enforced at the resolver itself, not only surfaced as a recommendation a client or downstream system can ignore.",
      "Enable DNSSEC validation for zones that are signed, and explicitly document what the resolver does with an unsigned zone or a validation failure — a silent fallback to an unvalidated answer defeats the purpose of turning validation on.",
      "Enable query logging sufficient to compute, per host, query volume by record type, average and maximum query-name length, and name entropy — the signals that distinguish tunneling-shaped traffic from ordinary resolution, which a reputation blocklist will not catch for a newly registered tunnel domain.",
      "Audit externally facing DNS records for a delegation or CNAME pointing at a third-party resource that may no longer be provisioned, and remove or re-point any dangling record found rather than logging it for later.",
      "Generate the synthetic tunneling-shaped traffic prepared in the requirements step against the approved resolver, isolated from production traffic, and confirm the logging and signals from the previous step actually detect it.",
      "Record the resolver's behavior when the filtering service or DNSSEC validation dependency is unreachable, and correct it if it defaults to permitting unfiltered or unvalidated resolution during an outage.",
    ],
    validation: [
      "Every client resolves exclusively through an approved, monitored resolver — confirmed by testing that an unapproved resolver or a direct encrypted-DNS path is actually blocked, not merely undocumented.",
      "DNSSEC validation rejects a deliberately invalid signed response in a controlled test, and the resolver's behavior under a simulated validation-dependency failure is fail-closed, observed directly rather than assumed from a configuration setting.",
      "The synthetic tunneling-shaped traffic generated during setup appears in the resolver's logs and triggers the anomaly signals it was meant to test — a control that cannot detect a known test pattern should not be trusted to detect an unknown one.",
      "No externally facing DNS record in the audited inventory points at an unprovisioned third-party resource.",
    ],
    rollback: [
      "If enabling filtering blocks a legitimate domain, remove the specific block entry and confirm restored resolution before broadening the filtering policy further — do not disable filtering entirely to resolve one false positive.",
      "If enabling DNSSEC validation breaks resolution for a zone with a genuine signing problem outside your control, record the affected zone as an explicit, time-boxed exception rather than disabling validation resolver-wide.",
      "Keep a record of the resolver's filtering, logging, and DNSSEC configuration immediately before each change, so a revert restores a known state rather than a best guess at one.",
    ],
  },
  diagram: buildDiagram(),
};

function buildDiagram(): FlowDiagramSpec {
  return {
    titleId: "dns-security-diagram",
    title: "Fictional DNS resolution path and tunneling channel",
    desc: "A fictional client resolves a name through a network egress control and a recursive resolver that filters, monitors, and validates DNSSEC, reaching a legitimate authoritative server in the normal path. Interactive: toggle to a DNS-tunneling view where the same protocol path instead reaches an attacker-controlled DNS server, with a separate return path illustrating command-and-control delivered through DNS responses. Explore each node for detail.",
    viewBox: "0 0 900 380",
    failureLabel: "DNS tunneling",
    caption:
      "Client → network egress control → recursive resolver → authoritative server, normally, with the resolver filtering, logging, and validating along the way. The tunneling view shows the identical protocol path instead terminating at an attacker-controlled DNS server — reached because the domain isn't yet on any reputation list — with a separate curved path showing encoded commands returned to the client through DNS response records.",
    motionDuration: 2600,
    mainPacketRoute: { d: "M170,145 H210 M390,145 H430 M620,145 H660", length: 120 },
    edges: [
      { id: "client-egress", from: "client", to: "egress", d: "M170,145 H210", length: 40, kind: "main", activeIn: ["normal", "failure"] },
      { id: "egress-resolver", from: "egress", to: "resolver", d: "M390,145 H430", length: 40, kind: "main", activeIn: ["normal", "failure"] },
      { id: "resolver-authoritative", from: "resolver", to: "authoritative", d: "M620,145 H660", length: 40, kind: "main", activeIn: ["normal"] },
      { id: "resolver-attacker", from: "resolver", to: "attacker", d: "M525,190 V260", length: 70, kind: "failure", activeIn: ["failure"] },
      {
        id: "attacker-c2-return",
        from: "attacker",
        to: "client",
        d: "M415,295 C300,345 120,320 90,180",
        length: 420,
        kind: "failure",
        activeIn: ["failure"],
      },
    ],
    nodes: [
      {
        id: "client",
        label: "Client host",
        x: 10,
        y: 110,
        w: 160,
        h: 70,
        activeIn: ["normal", "failure"],
        description:
          "The originating host in this fictional environment. In the normal-path view it simply issues an ordinary DNS query for a service it needs to reach. In the tunneling view, the same host is compromised and deliberately encodes data into the labels of its DNS queries — the traffic is structurally indistinguishable from ordinary resolution at the network layer, which is why endpoint compromise alone does not make the channel visible to controls inspecting only traffic shape.",
      },
      {
        id: "egress",
        label: "Network egress control",
        x: 210,
        y: 100,
        w: 180,
        h: 90,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "Network egress control — the boundary meant to restrict outbound traffic, but one that typically permits DNS by default regardless of its content",
        description:
          "The boundary responsible for restricting what a host is allowed to send outbound. Most egress controls are tuned around HTTP and HTTPS and apply little scrutiny to DNS, because name resolution is assumed to be infrastructure traffic rather than a channel a host could use to move data. That assumption is exactly what the tunneling view exploits: the encoded query passes through this same control unblocked, because it is still, syntactically, DNS.",
      },
      {
        id: "resolver",
        label: "Recursive resolver",
        x: 430,
        y: 100,
        w: 190,
        h: 90,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "Recursive resolver — the point where DNS filtering, query monitoring, and DNSSEC validation are enforced as security controls",
        description:
          "This is DNS acting as a security control: a resolver configured to check queried domains against a reputation or policy list, log query patterns for later analysis, and validate DNSSEC signatures before accepting a signed answer. In the normal-path view it forwards a legitimate query to the correct authoritative server. In the tunneling view it forwards the same query onward just as faithfully, because a newly registered or lookalike tunnel domain usually is not on any reputation list yet — reputation filtering alone does not catch a channel-abuse pattern, only an already-known-bad destination.",
      },
      {
        id: "authoritative",
        label: "Authoritative server",
        x: 660,
        y: 105,
        w: 170,
        h: 80,
        activeIn: ["normal"],
        role: "safe",
        description:
          "The legitimate authoritative server for the domain the client actually needed to resolve. Reaching it is the expected, validated outcome of the normal resolution path, and where DNSSEC validation — if the zone is signed — confirms the returned answer genuinely came from this server rather than from an off-path forgery.",
      },
      {
        id: "attacker",
        label: "Attacker DNS server",
        x: 415,
        y: 260,
        w: 220,
        h: 70,
        activeIn: ["failure"],
        role: "blocked",
        focusableLabel:
          "Attacker-controlled DNS server — authoritative for a domain used purely as a tunnel endpoint, reached because it is not yet on any reputation list",
        description:
          "A domain the attacker registered and is legitimately authoritative for, used only to receive encoded data hidden in query labels and to return commands or exfiltration acknowledgements hidden in response records such as TXT or NULL. Nothing about the individual protocol exchange looks malformed to a control that only checks domain reputation — the abuse is in the pattern, volume, and content of the traffic, not in reaching a server DNS wasn't 'supposed' to reach.",
      },
    ],
  };
}
