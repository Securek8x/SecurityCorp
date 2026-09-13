// Schematic Plate specs for the bounded first wave (bead securitycorp-source-
// s41.12), direction B of the s41.5 hybrid.
//
// ---------------------------------------------------------------------------
// CORRECTED BASELINE (2026-09-13)
// ---------------------------------------------------------------------------
// The s41.5 decision text described the wave as "all eight currently published
// articles that already contain a code-native diagram". That premise was
// wrong: 29 of the 42 published articles carry a diagram, not 8. The apparent
// "8" came from grepping for an inline `diagram:` property, which silently
// missed the 23 articles that assign a `const diagram` and use object
// shorthand. Both styles compile to an identical KnowledgeArticle.diagram
// value, so the distinction was never semantic.
//
// The counting method is fixed below: `publishedArticlesWithDiagram()` counts
// from the compiled catalog, never from source text, so it is blind to
// declaration style. `DIAGRAM_ARTICLE_COUNT` records the corrected baseline
// and is asserted against the live catalog in the test suite.
//
// ---------------------------------------------------------------------------
// WAVE SELECTION RULE (given by Ravi Teja Thota, 2026-09-13)
// ---------------------------------------------------------------------------
// 1. Exactly 4 Build Securely + 4 Defend Systems articles that already have a
//    diagram, capped with a ninth article that has none.
// 2. Cover at least 4 different categories. (Hard constraint — it outranks
//    rule 3, which is a preference.)
// 3. Prefer different diagram structures.
// 4. Tie-break by oldest publication date, then alphabetical slug.
// 5. The ninth is scoping-authorized-security-assessment.
//
// Applying that rule yields the eight below: 4+4 across both pillars, all six
// diagram-bearing categories covered, and five distinct plate archetypes. Two
// legacy-cover articles (understanding-network-trust-boundaries and
// protecting-main-branch-beyond-pr-approval) fall out of the rule naturally,
// which is what lets the pilot demonstrate legacy raster covers and new plates
// coexisting rather than asserting it.
//
// Archetype note: selection used the automatic `selectArchetype()` result as a
// structural-variety proxy. Each plate below then DECLARES its archetype for
// thesis accuracy, which `selectArchetype` treats as priority 1. The test
// suite asserts the declared set still spans at least four archetypes, so
// accuracy cannot quietly collapse the variety the selection bought.
//
// ---------------------------------------------------------------------------
// EDITORIAL STATUS
// ---------------------------------------------------------------------------
// Every label, caption and description is public editorial content, not
// decoration. Each is derived from wording already reviewed and published in
// that article's own `diagram` spec, so the plates restate each article's
// existing thesis rather than introducing new claims. No plate carries a
// metric, command, hostname, address, credential, or private product name;
// every scenario is fictional, as in the articles themselves.
//
// Evidence state is deliberately NOT encoded here. The article shell renders
// the authoritative badge from `meta.evidenceState`; duplicating it would
// create a second source of truth that could drift.

import type { PlateSpec } from "./schematic-plate.ts";
import { publishedKnowledgeArticles } from "./knowledge-content.ts";
import type { KnowledgeArticle } from "./knowledge-content.ts";

/**
 * Style-agnostic count of published articles carrying a code-native diagram.
 * Reads the compiled catalog, so it sees `diagram: buildDiagram()` and
 * `const diagram = {...}; ... diagram,` identically. Never count these by
 * grepping source text — that is what produced the wrong baseline of 8.
 */
export function publishedArticlesWithDiagram(): KnowledgeArticle[] {
  return publishedKnowledgeArticles.filter((a) => Boolean(a.diagram));
}

/** Corrected baseline, asserted against the live catalog in the test suite. */
export const DIAGRAM_ARTICLE_COUNT = 29;

export const ARTICLE_PLATES: Record<string, PlateSpec> = {
  // ===== Build Securely =====================================================

  // application-code-security · gate-sequence
  "securing-api-authentication-authorization": {
    plateId: "api-authn-authz",
    archetype: "gate-sequence",
    headerLabel: "PLATE / AUTHN THEN AUTHZ",
    title: "Fictional API authentication and authorization flow",
    desc:
      "A client request reaches an API gateway, which consults an auth service before a resource server is reached. Authentication and authorization are separate stages: passing the first does not by itself grant the second.",
    caption: "Authentication answers who is calling. Authorization is a separate question, asked after.",
    zones: [
      { id: "client", label: "Client", shortLabel: "CLNT", role: "sanctioned" },
      { id: "gateway", label: "API gateway", shortLabel: "GWAY", role: "sanctioned" },
      { id: "auth", label: "Auth service", shortLabel: "AUTH", sublabel: "decision point", role: "sanctioned" },
      { id: "resource", label: "Resource server", shortLabel: "RSRC", role: "sanctioned" },
    ],
    links: [
      { from: "client", to: "gateway", weight: "primary" },
      { from: "gateway", to: "auth", weight: "primary" },
      { from: "auth", to: "resource", weight: "primary" },
    ],
  },

  // cicd-supply-chain-security · coverage-field · LEGACY COVER ARTICLE
  "protecting-main-branch-beyond-pr-approval": {
    plateId: "branch-protection-coverage",
    archetype: "coverage-field",
    headerLabel: "PLATE / WHAT APPROVAL COVERS",
    title: "Fictional layered protection for a protected main branch",
    desc:
      "Required review, required status checks and branch ruleset enforcement each cover part of the protection surface. A bypass attempt sits outside that covered set, which is why pull-request approval alone is not the whole control.",
    caption: "Approval covers part of the surface. What sits outside it is the reason for the other layers.",
    zones: [
      { id: "review", label: "Required review", shortLabel: "REVW", role: "sanctioned" },
      { id: "checks", label: "Required status checks", shortLabel: "CHECK", role: "sanctioned" },
      { id: "ruleset", label: "Branch ruleset enforcement", shortLabel: "RULES", role: "sanctioned" },
      { id: "bypass", label: "Bypass attempt", shortLabel: "BYPAS", sublabel: "outside coverage", role: "sealed" },
    ],
    legend: [
      { role: "sanctioned", label: "COVERED BY A CONTROL" },
      { role: "sealed", label: "OUTSIDE COVERAGE" },
    ],
  },

  // container-kubernetes-security · sealed-enclosure
  "docker-sock-mounting-security-risks": {
    plateId: "docker-sock-path",
    archetype: "sealed-enclosure",
    headerLabel: "PLATE / WHAT THE MOUNT GRANTS",
    title: "Fictional container-to-host path created by a docker.sock mount",
    desc:
      "A compromised monitoring container reaches the Docker Engine API through a mounted socket and from there a privileged sibling container. Where no socket is mounted, the host is enclosed by an unbroken boundary and no path to it exists at all.",
    caption: "Read-only changes nothing about the path. Not mounting the socket is what removes it.",
    zones: [
      { id: "container", label: "Compromised container", shortLabel: "CNTR", role: "sanctioned" },
      { id: "sock", label: "Mounted docker.sock", shortLabel: "SOCK", sublabel: "engine API", role: "failure" },
      { id: "sibling", label: "Privileged sibling", shortLabel: "SIBL", sublabel: "root on host", role: "failure" },
      { id: "isolated", label: "Host with no mount", shortLabel: "HOST", sublabel: "no path exists", role: "sealed" },
    ],
    links: [
      { from: "container", to: "sock", weight: "primary", kind: "failure" },
      { from: "sock", to: "sibling", weight: "primary", kind: "failure" },
    ],
    legend: [
      { role: "failure", label: "PATH THE MOUNT CREATES" },
      { role: "sealed", label: "NO MOUNT: NO PATH" },
    ],
  },

  // application-code-security · linear-flow
  "preventing-path-traversal-through-boundary-validation": {
    plateId: "path-boundary-check",
    archetype: "linear-flow",
    headerLabel: "PLATE / BOUNDARY CHECK ORDER",
    title: "Fictional file-download boundary check",
    desc:
      "A client file request is resolved to a concrete path, and only then checked against the intended root boundary before permitted file access. The boundary check happens after resolution, because checking the raw request instead is what the traversal defeats.",
    caption: "Resolve the path first, then check it. Checking the request instead is the bug.",
    zones: [
      { id: "request", label: "Client file request", shortLabel: "REQ", role: "sanctioned" },
      { id: "resolve", label: "Path resolution", shortLabel: "RSLV", role: "sanctioned" },
      { id: "check", label: "Boundary check", shortLabel: "CHECK", sublabel: "vs intended root", role: "sanctioned" },
      { id: "access", label: "Permitted file access", shortLabel: "ALLOW", role: "sanctioned" },
    ],
    links: [
      { from: "request", to: "resolve", weight: "primary" },
      { from: "resolve", to: "check", weight: "primary" },
      { from: "check", to: "access", weight: "primary" },
    ],
  },

  // ===== Defend Systems =====================================================

  // identity-access-management · divergent-pair
  "workload-identities-vs-long-lived-credentials": {
    plateId: "workload-identity-pair",
    archetype: "divergent-pair",
    headerLabel: "PLATE / TWO CREDENTIAL MODELS",
    title: "Fictional workload identity compared with an embedded static credential",
    desc:
      "A workload runtime reaches a target resource through a workload identity provider on one track. On the other, an embedded static credential is reused by an attacker, because a long-lived secret remains valid wherever it is copied to.",
    caption: "One model issues identity at runtime. The other leaves a secret that keeps working once copied.",
    zones: [
      { id: "runtime", label: "Workload runtime", shortLabel: "WKLD", role: "sanctioned" },
      { id: "provider", label: "Identity provider", shortLabel: "IDP", sublabel: "issued at runtime", role: "sanctioned" },
      { id: "resource", label: "Target resource", shortLabel: "RSRC", role: "sanctioned" },
      { id: "static", label: "Static credential", shortLabel: "STATC", sublabel: "valid once copied", role: "failure" },
    ],
    links: [
      { from: "runtime", to: "provider", weight: "primary" },
      { from: "provider", to: "resource", weight: "primary" },
      { from: "runtime", to: "static", weight: "secondary", kind: "failure" },
    ],
    legend: [
      { role: "sanctioned", label: "WORKLOAD IDENTITY" },
      { role: "failure", label: "LONG-LIVED CREDENTIAL" },
    ],
  },

  // network-security · linear-flow
  "safely-analyzing-packet-captures": {
    plateId: "capture-handling",
    archetype: "linear-flow",
    headerLabel: "PLATE / CAPTURE HANDLING",
    title: "Fictional safe packet-capture handling flow",
    desc:
      "A received capture passes integrity verification, is opened only inside an isolated read-only analysis environment, and produces findings recorded with a chain-of-custody record. The analyst host is never the analysis environment.",
    caption: "The capture is never opened on the analyst's own host — isolation comes before analysis.",
    zones: [
      { id: "cap", label: "Capture received", shortLabel: "CAP", role: "sanctioned" },
      { id: "verify", label: "Integrity verification", shortLabel: "VERIF", role: "sanctioned" },
      { id: "iso", label: "Isolated analysis", shortLabel: "ISO", sublabel: "read-only", role: "sanctioned" },
      { id: "custody", label: "Chain-of-custody record", shortLabel: "CUST", role: "sanctioned" },
    ],
    links: [
      { from: "cap", to: "verify", weight: "primary" },
      { from: "verify", to: "iso", weight: "primary" },
      { from: "iso", to: "custody", weight: "primary" },
    ],
  },

  // security-architecture · divergent-pair
  "designing-fail-closed-security-automation": {
    plateId: "fail-closed-divergence",
    archetype: "divergent-pair",
    headerLabel: "PLATE / WHEN THE SOURCE IS GONE",
    title: "Fictional divergence between a fail-closed and a fail-open gateway",
    desc:
      "An incoming request reaches an enforcement gateway whose external decision source is unavailable. A fail-closed gateway denies the request; a fail-open gateway silently allows it. The difference appears only when the decision source is missing.",
    caption: "Both designs look identical until the decision source disappears.",
    zones: [
      { id: "request", label: "Incoming request", shortLabel: "REQ", role: "sanctioned" },
      { id: "gateway", label: "Enforcement gateway", shortLabel: "GWAY", sublabel: "source missing", role: "sanctioned" },
      { id: "closed", label: "Fail-closed", shortLabel: "DENY", sublabel: "request denied", role: "sanctioned" },
      { id: "open", label: "Fail-open", shortLabel: "ALLOW", sublabel: "silently allowed", role: "failure" },
    ],
    links: [
      { from: "request", to: "gateway", weight: "primary" },
      { from: "gateway", to: "closed", weight: "primary" },
      { from: "gateway", to: "open", weight: "secondary", kind: "failure" },
    ],
    legend: [
      { role: "sanctioned", label: "FAIL CLOSED" },
      { role: "failure", label: "FAIL OPEN" },
    ],
  },

  // network-security · sealed-enclosure · LEGACY COVER ARTICLE
  "understanding-network-trust-boundaries": {
    plateId: "trust-boundaries",
    archetype: "sealed-enclosure",
    headerLabel: "PLATE / TRUST BOUNDARIES",
    title: "Fictional multi-tier trust boundary architecture",
    desc:
      "Four tiers connected in sequence — internet, edge or WAF, application tier, data tier — with sanctioned paths between them. A fifth zone, the internal admin plane, is enclosed by an unbroken boundary and has no path reaching it from any other zone.",
    caption: "Not every boundary here is the same strength — one zone has no path into it at all.",
    zones: [
      { id: "net", label: "Internet", shortLabel: "NET", role: "sanctioned" },
      { id: "edge", label: "Edge / WAF", shortLabel: "EDGE", sublabel: "public boundary", role: "sanctioned" },
      { id: "app", label: "App tier", shortLabel: "APP", sublabel: "workloads", role: "sanctioned" },
      { id: "data", label: "Data tier", shortLabel: "DATA", sublabel: "persistence", role: "sanctioned" },
      { id: "admin", label: "Internal admin plane", shortLabel: "ADMIN", sublabel: "no path", role: "sealed" },
    ],
    links: [
      { from: "net", to: "edge", weight: "primary" },
      { from: "edge", to: "app", weight: "primary" },
      { from: "app", to: "data", weight: "secondary" },
    ],
    legend: [
      { role: "sanctioned", label: "SANCTIONED PATH" },
      { role: "sealed", label: "SEALED BOUNDARY" },
    ],
  },

  // ===== Ninth: no pre-existing diagram, built from scratch =================
  // test-validate / offensive-security · gate-sequence
  "scoping-authorized-security-assessment": {
    plateId: "assessment-scope",
    archetype: "gate-sequence",
    headerLabel: "PLATE / AUTHORIZATION ORDER",
    title: "Fictional ordering of authorization before assessment activity",
    desc:
      "Written authorization exists first, then a scope document, then rules of engagement, and only then a defined testing window. Each stage depends on the one before it, so testing cannot begin from a later stage alone.",
    caption: "Written authorization comes first. Everything after it depends on that order holding.",
    zones: [
      { id: "auth", label: "Written authorization", shortLabel: "AUTH", sublabel: "first", role: "sanctioned" },
      { id: "scope", label: "Scope document", shortLabel: "SCOPE", role: "sanctioned" },
      { id: "roe", label: "Rules of engagement", shortLabel: "ROE", role: "sanctioned" },
      { id: "window", label: "Testing window", shortLabel: "WINDW", role: "sanctioned" },
    ],
    links: [
      { from: "auth", to: "scope", weight: "primary" },
      { from: "scope", to: "roe", weight: "primary" },
      { from: "roe", to: "window", weight: "primary" },
    ],
  },
};

/** The bounded first wave: 4 Build Securely + 4 Defend Systems + 1 without a
 *  diagram. Capped at exactly nine. */
export const FIRST_WAVE_SLUGS: readonly string[] = [
  "securing-api-authentication-authorization",
  "protecting-main-branch-beyond-pr-approval",
  "docker-sock-mounting-security-risks",
  "preventing-path-traversal-through-boundary-validation",
  "workload-identities-vs-long-lived-credentials",
  "safely-analyzing-packet-captures",
  "designing-fail-closed-security-automation",
  "understanding-network-trust-boundaries",
  "scoping-authorized-security-assessment",
] as const;

/** Articles in the wave that keep an approved legacy cinematic cover. The
 *  pilot must show these coexisting with the new plates. */
export const LEGACY_COVER_SLUGS: readonly string[] = [
  "understanding-network-trust-boundaries",
  "protecting-main-branch-beyond-pr-approval",
] as const;

export function plateForSlug(slug: string): PlateSpec | undefined {
  return ARTICLE_PLATES[slug];
}
