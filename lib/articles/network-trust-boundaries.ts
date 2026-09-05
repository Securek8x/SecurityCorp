// Knowledge-base article: "Understanding Network Trust Boundaries"
// (Bead securitycorp-source-4zl.55.1.1). Not yet added to
// lib/knowledge-content.ts's `knowledgeArticles` — status stays "drafting"
// and every review record stays "pending" until the human owner reviews it,
// per docs/publication-safety-policy.md and docs/knowledge-base.md. All
// examples describe a fictional environment; no real domain, address,
// port, topology, or configuration appears anywhere in this file.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";
import type { ArticleVisual } from "../article-visuals.ts";

// Cover visual (Bead s41.9/s41.12 pilot) — real asset produced from the
// brief below via the OpenAI built-in image-generation tool in ChatGPT/
// Codex (external to this repo; the tool exposed no model identifier or
// seed), normalized with sharp@0.35.4 to exactly 1600x900 WebP. Specific
// to this article's own thesis (segmentation vs. isolation as materially
// different boundary strengths), not a generic "network security" image —
// the differential boundary treatment IS the brief's one required idea.
// Reviewed and approved by Ravi Teja Thota (2026-09-05, PR #51) after
// rendered browser QA — see provenance below.
const coverImage: ArticleVisual = {
  stage: "reviewed",
  src: "/article-visuals/understanding-network-trust-boundaries-cover.webp",
  visualType: "cover",
  alt: "Four adjacent zones in a deep-navy field, connected by cyan paths of varying visible strength — one zone sealed behind a solid violet ring with no path reaching it directly",
  caption: "Not every boundary here is the same strength — one path never exists at all.",
  purpose:
    "Let a reader register, before reading a word, that not every boundary in this article is the same strength — foreshadowing the segmentation-vs-isolation distinction the article's thesis depends on.",
  width: 1600,
  height: 900,
  // Biased right, toward the sealed zone — this is what the catalog-card
  // thumbnail's object-fit:cover crop keeps centered under the card's
  // 16:9 aspect ratio; the full article-page cover itself only ever
  // scales (never crops), so focalPoint only matters for the card. Set to
  // (0.87, 0.5) rather than a rounder number because the actual rendered
  // artwork's sealed zone sits close to the right edge (independently
  // measured centroid ~0.85-0.89) — this describes the real asset, not
  // the brief's original aspirational framing. The current 1600x900
  // asset is itself exactly 16:9, matching .guide-card-thumb's own
  // aspect-ratio, so object-fit:cover currently has no crop to apply
  // regardless of this value — it exists as an accurate record for any
  // future alternate crop, not because it visibly changes today's card.
  focalPoint: { x: 0.87, y: 0.5 },
  brief: {
    articleSlug: "understanding-network-trust-boundaries",
    readerTakeaway: "Boundaries between zones are not uniform — some permit controlled traffic, one permits none at all, and the difference is deliberate, not decorative.",
    whyThisHelps:
      "The article's central move is distinguishing segmentation (controlled paths) from isolation (no path) — a purely textual intro doesn't let a reader feel that difference before the prose explains it.",
    visualType: "cover",
    placement: "After the lead paragraph, before the prerequisites box — the shared article-shell cover slot.",
    mustShow: [
      "Four distinct zones/nodes, arranged left-to-right or in a simple flow, each visually equal in size/weight (no zone drawn as more \"important\" than another)",
      "Cyan connecting paths between three of the zones, varying in visible thickness/opacity to suggest different traffic volumes",
      "One zone (representing the admin plane) fully enclosed by a solid violet/purple boundary ring with zero connecting paths crossing it",
      "Deep-navy background consistent with the site's existing hero/diagram palette",
    ],
    mustNotShow: [
      "Any text, labels, tier names, or protocol/port numbers",
      "A literal firewall icon, padlock, or shield — those are the generic imagery this brief exists to avoid",
      "A hooded figure, screen-full-of-code, or any stock hacker imagery",
      "Any real hostname, IP address, or company/product identifier",
    ],
    factualClaims: [
      {
        claim: "Segmentation permits controlled paths between zones; isolation removes the path entirely — these are materially different, not degrees of the same control.",
        source: "This article's own \"Segmentation versus isolation\" section (lib/articles/network-trust-boundaries.ts mainContent).",
      },
    ],
    compositionNotes: "Wide 16:9 (matches ArticleFigure presentation=\"wide\"). Horizontal flow, generous negative space — calm operations-console feel, not busy or noisy. Restrained cyan/violet accents only, per DESIGN.md.",
    mobileCropNotes:
      "The full article-page cover only ever scales down (app/globals.css's .article-figure img is width:100%;height:auto — never cropped), so composition must keep the sealed zone and its violet ring legible even scaled to a narrow phone width, not just at full size. The catalog-card thumbnail DOES crop (object-fit:cover); focalPoint above is set to (0.87, 0.5), biased toward the sealed zone, so the card's crop keeps that zone centered.",
    exportFormats: ["webp"],
    sizeBudgetKb: 200,
  },
  provenance: {
    source: "ai-generated",
    generatingModel: "OpenAI built-in image-generation tool in ChatGPT/Codex — the tool did not expose a narrower model identifier or version",
    prompt:
      'Use case: stylized-concept\nAsset type: SecurityCorp.net cybersecurity article cover, Pilot 1 of a coherent three-cover editorial series\nPrimary request: Create an original abstract cover for “Understanding Network Trust Boundaries” that immediately communicates that controlled connectivity and total isolation are different boundary strengths.\nScene/backdrop: Exact 16:9 wide landscape canvas, deep near-black navy gradient from #040609 to #070b12, subtle premium matte texture, spacious and calm.\nSubject: Four equally sized and equally weighted abstract geometric zones arranged in a simple left-to-right flow. Only the first three zones participate in a controlled network: thin cyan #00e5ff paths connect those three, with visibly varied thickness and opacity. The fourth zone on the right is entirely enclosed by one continuous solid muted/desaturated violet boundary ring derived from #8b5cf6. Absolutely no path enters, crosses, touches, or terminates on that violet boundary; the sealed zone is clearly separated by empty space.\nStyle/medium: Refined geometric editorial concept art, restrained netrunner operations aesthetic, crisp forms with subtle depth, not an infographic and not a literal network diagram.\nComposition/framing: Wide 16:9; four equal zones across the central band; visual focal point near x=75%, y=50% on the isolated right-hand zone; generous margins. The sealed zone and unbroken boundary must remain unmistakable in a narrow mobile crop centered around the right three-quarters.\nLighting/mood: Controlled low-key illumination, subtle cyan and muted-violet edge light, disciplined glow with no bloom.\nColor palette: #040609, #070b12, restrained #00e5ff cyan, muted/desaturated #8b5cf6 violet, rare #e8f1f8 neutral glints.\nConstraints: Exactly four zones. First three connected; fourth isolated. Geometric abstraction only. No text, letters, words, numbers, labels, arrows, factual diagram labels, code, protocol names, credential strings, hostnames, IP addresses, logos, signatures, or watermark. No literal icons.\nAvoid: padlocks, shields, magnifying glasses, checkmarks, hooded figures, terminals, keyboards, code screens, circuit-board motif, product branding, HUD frames, meaningless overlay chrome, photorealism, excessive neon, lens flare, bloom, clutter.',
    // Seed: not exposed by the generating tool — not invented here.
    createdAt: "2026-09-04",
    license: "site-original-all-rights-reserved",
    editableSourceRef: "this coverImage.brief record",
    reviewStatus: "approved",
    reviewer: "Ravi Teja Thota",
    reviewedAt: "2026-09-05",
  },
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Understanding Network Trust Boundaries",
    slug: "understanding-network-trust-boundaries",
    summary:
      "How to identify where trust actually changes in a network, place boundaries there instead of at the perimeter alone, and validate that a boundary fails closed — illustrated with a fictional multi-tier architecture.",
    pillar: "defend-systems",
    primaryCategory: "network-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["network-segmentation", "network-isolation", "fail-closed-design", "threat-modeling"],
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
  sections: {
    executiveSummary: [
      "A trust boundary is any point in a network where the level of trust extended to traffic changes. It is not a firewall, a VLAN, or a subnet — those are mechanisms that can enforce a boundary, but the boundary itself is a decision about who and what is allowed to act on which resources, and what happens when that decision cannot be verified. Most network compromises that spread beyond an initial foothold do so because a boundary existed on a diagram but was never actually enforced at the point where trust changed.",
      "This guide gives you a repeatable way to find where boundaries belong, design them so they fail closed instead of open, and distinguish two controls that are often confused with each other: segmentation, which divides a network into zones with controlled paths between them, and isolation, which removes or severely restricts a path entirely. A fictional multi-tier architecture — edge, application, data, and an internal admin plane — runs through the guide and the accompanying interactive diagram so the concepts stay concrete without describing any real environment.",
    ],
    whatYouWillLearn: [
      "How to identify a trust boundary by where trust actually changes, not by where a network diagram happens to draw a line.",
      "The practical difference between network segmentation and network isolation, and when each is the correct control.",
      "Why a boundary must fail closed, and what fail-open boundary behavior looks like in practice.",
      "How to place a boundary close to the resource it protects instead of relying on a single perimeter.",
      "How to validate that an enforced boundary actually blocks the traffic it claims to block, rather than assuming a rule that exists is a rule that works.",
    ],
    intendedAudience: [
      "Network defenders and platform engineers designing or reviewing zone boundaries.",
      "Security practitioners who need to validate that an existing boundary still does what its documentation claims.",
      "Engineers moving from a single-perimeter mental model toward a design where trust is checked closer to each resource.",
    ],
    prerequisites: [
      "Familiarity with basic network concepts (routing, addressing, and the idea of a firewall or access-control rule).",
      "Comfort reading a simple architecture diagram showing tiers and the connections between them.",
      "No lab environment is required to follow this guide; it is conceptual and uses a fictional architecture throughout.",
    ],
    problem: [
      "A common failure pattern looks like this: a network is drawn with a perimeter firewall at the edge, and everything behind that firewall is treated as one trusted zone. The diagram shows a boundary; the design does not actually have one, because nothing stops a compromised or misconfigured component inside the perimeter from reaching every other component inside it. When an attacker or a misconfiguration gets past the single outer boundary, there is no second boundary to slow them down — the rest of the environment behaves as if trust had already been established everywhere.",
      "The underlying problem is treating 'trust boundary' as a place on a diagram instead of a property of a specific connection: who is allowed to initiate it, to what, under what condition, and what happens when that condition cannot be confirmed. Fixing this requires finding every point where trust actually changes and making a deliberate, testable decision about it — not adding more lines to the diagram.",
    ],
    threatModel: [
      "This guide's threat model assumes an adversary who has already gained some foothold inside a network — through a compromised edge component, a misconfigured rule, a leaked credential, or a vulnerable service — and is now attempting to reach a more valuable resource than the one they started with. The relevant question a trust boundary must answer is not 'can this attacker get in from the internet' but 'once something inside this zone is compromised, what can it reach next, and does an enforced boundary actually stop it, or only a diagram convention.'",
      "Boundary failures generally take one of two forms, both represented in this guide's interactive diagram: a perimeter bypass, where traffic reaches an interior tier directly instead of through the boundary meant to filter it, and lateral movement, where a compromised interior tier reaches a more sensitive interior tier that should have required a separate, stronger boundary. Neither requires an especially sophisticated attacker — both are frequently the result of an access-control rule that was added for convenience, never removed, or never actually tested against the traffic it claims to block.",
    ],
    mainContent: [
      "**Finding a trust boundary.** Walk the path a request takes from its origin to the resource it ultimately affects, and mark every point where the level of trust extended to that request changes. In a fictional retail order-processing system used throughout this guide, a request enters at an edge tier (a reverse proxy and web-application filtering layer), is forwarded to an application tier that implements business logic, and from there reaches a data tier holding order records. Each arrow in that chain is a candidate trust boundary, not just the outermost one. A separate internal admin plane, used only for operational access to the system, is a further boundary that should not be reachable from the application or data tiers at all under normal operation.",
      "**Segmentation versus isolation.** These two controls are frequently used interchangeably, and the difference matters for how you validate them. Segmentation divides a network into zones and permits specific, controlled paths between them — the edge tier can reach the application tier on a defined path because that path is required for the system to function. Isolation removes or severely restricts a path so that, under normal operation, no traffic should cross it at all — the admin plane should be isolated from the application and data tiers, not merely segmented from them, because there is no legitimate business reason for the application tier to ever initiate a connection to it. Choosing segmentation where isolation is required is one of the most common ways a boundary looks correct on a diagram while doing far less than its designer assumed.",
      "**Fail-closed design.** A boundary is only as good as its behavior when something goes wrong — a rule fails to load, a policy engine is unreachable, a certificate expires, a service restarts mid-update. A fail-closed boundary denies traffic by default when it cannot confirm the traffic is permitted; a fail-open boundary permits traffic by default under the same condition. Fail-open behavior is rarely a deliberate design choice — it is usually an unexamined default, a permissive rule left in place after testing, or an access-control mechanism that was never verified under failure conditions at all. Any boundary protecting a sensitive resource should be designed and tested with the explicit question: what does this control do when it cannot decide?",
      "**Placing boundaries close to the resource.** A single perimeter boundary treats the interior of a network as one trust zone, which means a compromise anywhere inside it effectively compromises everywhere inside it. Placing additional boundaries close to the most sensitive resources — rather than relying on the outer perimeter alone — limits how far an initial compromise can spread before it meets a second boundary that has to be defeated independently. In the fictional architecture used here, that means the data tier and the admin plane each have their own boundary, evaluated on its own terms, rather than inheriting trust from having already crossed the edge boundary once.",
      "**Validating a boundary, not just deploying it.** A rule that exists is not the same as a rule that works. Validating a boundary means confirming, from a position that represents the untrusted side of that specific boundary, that the traffic it claims to block is actually blocked, and that the traffic it claims to permit is limited to exactly what is required — not a broader range left in place from an earlier, less careful configuration. This validation should be repeated whenever the boundary's configuration changes, not performed once at initial deployment and assumed to remain accurate indefinitely.",
    ],
    validationEvidence: [
      "This guide is conceptual. It was not developed against a live or lab-reproduced environment, no packet captures or configuration were reproduced, and no boundary described here was tested end-to-end. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the label must not be upgraded merely because the reasoning here is internally consistent.",
    ],
    limitations: [
      "This guide describes principles and a fictional illustrative architecture, not a specific vendor's firewall syntax, a specific cloud provider's security-group model, or a specific product's policy engine. Applying it to a real environment requires translating each principle into that environment's actual controls and re-validating the result there.",
      "It does not cover identity-centric zero-trust architectures in depth (where the boundary decision is bound to workload or user identity rather than network location) beyond noting that the placement principles above are a prerequisite for that model, not a substitute for it.",
      "It does not address detection or response once a boundary has already been bypassed — that is covered by SecurityCorp's detection and incident-response content, not this guide.",
    ],
    defensiveRecommendations: [
      "Enumerate every point in your architecture where trust changes, not just the outermost perimeter, and treat each one as a boundary requiring its own explicit decision.",
      "Use isolation, not segmentation, for paths that have no legitimate business justification — an administrative or management plane is a common example.",
      "Design and test every boundary's failure behavior explicitly; a control that has never been observed failing has not actually been shown to fail closed.",
      "Place a boundary as close as practical to the resource it protects, so a compromise of one tier does not automatically extend trust to the next.",
      "Validate boundaries from the untrusted side of the specific connection being tested, and repeat that validation after every configuration change, not only at initial deployment.",
      "Document each boundary's intended permitted paths narrowly enough that an unreviewed broadening is easy to notice during a later audit.",
    ],
    keyTakeaways: [
      "A trust boundary is a property of a specific connection — who may initiate it, to what, and under what condition — not a line drawn once on an architecture diagram.",
      "Segmentation permits controlled paths between zones; isolation removes a path almost entirely. Using segmentation where isolation is required is a common, quiet failure.",
      "A boundary must fail closed. Untested failure behavior is not evidence of fail-closed design.",
      "Boundaries placed only at the perimeter let a single compromise reach everything behind it; boundaries placed close to sensitive resources limit how far that compromise can spread.",
      "A rule that exists has not been validated until it has been tested from the untrusted side of that specific boundary.",
    ],
    references: [
      "NIST SP 800-207, Zero Trust Architecture: https://csrc.nist.gov/pubs/sp/800/207/final",
      "NIST SP 800-41 Rev. 1, Guidelines on Firewalls and Firewall Policy: https://csrc.nist.gov/pubs/sp/800/41/r1/final",
      "NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations (see the SC-7 Boundary Protection control): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
      "OWASP Threat Modeling Cheat Sheet (trust boundaries in data-flow analysis): https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html",
    ],
  },
  module: {
    kind: "guide",
    requirements: [
      "A documented architecture diagram or description covering every tier and the connections between them — an undocumented connection cannot be evaluated as a boundary.",
      "Authority to review, and where necessary propose changes to, the access-control configuration that enforces each candidate boundary.",
      "A way to generate or observe traffic from the untrusted side of the boundary being validated, without affecting production data or availability.",
    ],
    procedure: [
      "List every tier in the architecture and every connection between tiers, including administrative or operational paths that are easy to omit from a primary diagram.",
      "For each connection, identify whether the trust level changes across it. If it does, that connection is a candidate boundary regardless of whether existing documentation calls it one.",
      "For each candidate boundary, decide explicitly whether it requires segmentation (a controlled, necessary path) or isolation (no legitimate path should exist), using the connection's actual business justification — not its current configuration — to decide.",
      "For each boundary that should exist, confirm what its enforcement mechanism does when it cannot evaluate a request: whether it fails closed (denies by default) or fails open (permits by default), and correct any boundary found to fail open.",
      "For sensitive resources reachable only through one perimeter boundary today, identify where an additional boundary closer to that resource is practical to add.",
      "Test each boundary from the untrusted side of that specific connection: confirm the traffic it should block is blocked, and that the traffic it permits is no broader than the documented justification for that boundary.",
      "Record the result of each boundary's validation, including the date and the specific traffic tested, so a later audit can distinguish a validated boundary from an assumed one.",
    ],
    validation: [
      "Every connection identified in the requirements is either a documented, isolated path with no traffic observed crossing it, or a documented, segmented path carrying only its justified traffic.",
      "Every boundary protecting a sensitive resource has an observed fail-closed result under a simulated evaluation failure, not merely a configuration setting that claims fail-closed behavior.",
      "Validation was performed from a position representing the untrusted side of each specific boundary, not from a position that already had broader network access.",
    ],
    rollback: [
      "If a boundary change unexpectedly blocks required traffic, revert the specific access-control change first and confirm restored function before investigating further — do not widen an unrelated boundary as a workaround.",
      "If validation traffic used to test a boundary risks affecting a shared or production resource, stop the test, restore the boundary to its prior configuration, and repeat the validation against a non-production equivalent instead.",
      "Keep a record of the configuration in place immediately before each boundary change so a revert restores a known-good state rather than a best guess at one.",
    ],
  },
  diagram: buildDiagram(),
  coverImage,
};

function buildDiagram(): FlowDiagramSpec {
  return {
    titleId: "trust-boundary-diagram",
    title: "Fictional multi-tier trust boundary architecture",
    desc: "A fictional request path: internet, to an edge/WAF tier, to an application tier, to a data tier, with a separate internal admin plane. Interactive: toggle between the normal path and a boundary-failure view showing a perimeter bypass and lateral movement into the admin plane, and explore each node for detail.",
    viewBox: "0 0 900 340",
    failureLabel: "Boundary failure path",
    caption:
      "Internet → edge/WAF → application tier → data tier, normally. The boundary-failure view shows two separate ways a missing or misconfigured boundary lets traffic reach a tier it should never reach directly: a perimeter bypass into the application tier, and lateral movement from the application tier into the internal admin plane.",
    motionDuration: 2600,
    mainPacketRoute: { d: "M160,160 H210 M380,160 H430 M590,160 H640", length: 150 },
    edges: [
      { id: "internet-edge", from: "internet", to: "edge", d: "M160,160 H210", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      { id: "edge-app", from: "edge", to: "app", d: "M380,160 H430", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      { id: "app-data", from: "app", to: "data", d: "M590,160 H640", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      {
        id: "perimeter-bypass",
        from: "internet",
        to: "app",
        d: "M90,130 C90,30 500,30 500,120",
        length: 480,
        kind: "failure",
        activeIn: ["failure"],
      },
      { id: "app-admin-lateral", from: "app", to: "admin", d: "M510,200 V250", length: 50, kind: "failure", activeIn: ["failure"] },
    ],
    nodes: [
      {
        id: "internet",
        label: "Internet",
        x: 10,
        y: 130,
        w: 150,
        h: 60,
        activeIn: ["normal", "failure"],
        description:
          "The untrusted origin for all inbound traffic in this fictional architecture. Nothing here is trusted by default, and in a correctly enforced design it never has a direct path to the application or data tiers.",
      },
      {
        id: "edge",
        label: "Edge / WAF",
        x: 210,
        y: 120,
        w: 170,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "Edge / WAF — the first trust boundary; terminates the client connection, filters requests, and is the only tier permitted to receive traffic directly from the internet",
        description:
          "The first trust boundary. It terminates the inbound connection and filters requests before forwarding a validated subset to the application tier. No other tier should ever accept a direct connection from the internet — the perimeter-bypass path in the failure view shows what it looks like when that assumption breaks.",
      },
      {
        id: "app",
        label: "Application tier",
        x: 430,
        y: 120,
        w: 160,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "safe",
        description:
          "Runs business logic and trusts a request because it arrived through the edge tier's boundary and passed its own authorization check — not because of network location alone. It should have no legitimate path to the internal admin plane.",
      },
      {
        id: "data",
        label: "Data tier",
        x: 640,
        y: 120,
        w: 160,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "Data tier — the most sensitive boundary in this design; only the application tier's specific service identity may reach it",
        description:
          "The most sensitive boundary in this architecture. Only the application tier's specific service identity may reach it — not the edge tier, not the internet, and not the admin plane by default. Placing this boundary close to the data itself limits how far a compromise upstream can spread.",
      },
      {
        id: "admin",
        label: "Internal admin plane",
        x: 430,
        y: 250,
        w: 200,
        h: 60,
        activeIn: ["failure"],
        role: "blocked",
        focusableLabel:
          "Internal admin plane — normally isolated, reached only through a separate restricted management path not shown in the normal-flow view",
        description:
          "Operational access to the system, isolated rather than merely segmented from the application and data tiers — it is reached only through a separate, dedicated management path with its own authentication, not modeled in the normal-flow view. Its appearance here, reached directly from the application tier, is the failure being illustrated: a missing or misconfigured internal boundary let a lower tier reach it.",
      },
    ],
  };
}
