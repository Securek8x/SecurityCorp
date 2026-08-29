// Deterministic local-only audit of the article-planning Beads. The Beads
// database is intentionally Git-excluded, so this is a reporting command and
// must not be added to CI. It does not approve or publish any article.
import { spawnSync } from "node:child_process";
import { isKnownTagId, validateTags } from "../lib/knowledge-tags.ts";

type ArticleBead = {
  id: string;
  parent?: string;
  title: string;
  description: string;
};

const CATEGORY_DEFAULT_TAGS: Readonly<Record<string, readonly string[]>> = {
  "securitycorp-source-4zl.54.1": ["application-security", "secure-code-review"],
  "securitycorp-source-4zl.54.2": ["ci-cd-pipelines", "supply-chain-security"],
  "securitycorp-source-4zl.54.3": ["kubernetes", "least-privilege"],
  "securitycorp-source-4zl.54.4": ["ai-security", "least-privilege"],
  "securitycorp-source-4zl.55.1": ["network-segmentation", "network-isolation"],
  "securitycorp-source-4zl.55.2": ["cloud-platforms", "least-privilege"],
  "securitycorp-source-4zl.55.3": ["access-control", "least-privilege"],
  "securitycorp-source-4zl.55.4": ["threat-modeling", "fail-closed-design"],
  "securitycorp-source-4zl.56.1": ["detection-engineering", "security-control-validation"],
  "securitycorp-source-4zl.56.2": ["soc-operations", "alert-tuning"],
  "securitycorp-source-4zl.56.3": ["incident-response", "logging-monitoring"],
  "securitycorp-source-4zl.56.4": ["malware-scanners", "security-control-validation"],
  "securitycorp-source-4zl.57.1": ["authorized-offensive-testing", "threat-modeling"],
  "securitycorp-source-4zl.57.2": ["vulnerability-management", "patch-management"],
  "securitycorp-source-4zl.57.3": ["security-control-validation", "threat-modeling"],
  "securitycorp-source-4zl.58.1": ["governance-risk-compliance", "security-control-validation"],
  "securitycorp-source-4zl.58.2": ["threat-modeling", "governance-risk-compliance"],
  "securitycorp-source-4zl.58.3": ["governance-risk-compliance", "least-privilege"],
  "securitycorp-source-4zl.59.1": ["authentication", "least-privilege"],
  "securitycorp-source-4zl.59.2": ["security-control-validation", "threat-modeling"],
  "securitycorp-source-4zl.59.3": ["authentication", "access-control"],
};

// Title terms only refine the category assignment. They are deliberately
// conservative: a tag is never added just to reach a preferred count.
const TITLE_TAG_RULES: readonly [RegExp, string][] = [
  [/\bdocker\b/i, "docker"],
  [/\b(kubernetes|k3s)\b/i, "kubernetes"],
  [/\b(ci\/cd|pipeline|build runner|build artifact)\b/i, "ci-cd-pipelines"],
  [/\b(secret|sops|vault)\b/i, "secrets-management"],
  [/\b(tls|certificate|pki)\b/i, "tls-pki"],
  [/\bdns\b/i, "dns"],
  [/\b(reverse proxy)\b/i, "reverse-proxy"],
  [/\b(alert|triage|soc)\b/i, "alert-tuning"],
  [/\b(incident|root-cause|timeline|containment)\b/i, "incident-response"],
  [/\b(backup|rollback|recovery|retry)\b/i, "backup-recovery"],
  [/\b(threat model|attack path)\b/i, "threat-modeling"],
  [/\b(validate|validation|verification|verified)\b/i, "security-control-validation"],
  [/\b(migration|modernization)\b/i, "migration-planning"],
  [/\b(ai|prompt injection|autonomous)\b/i, "ai-security"],
];

// Structured suggestions are evidence, not stored tags. This deliberately
// maps only concepts with a documented canonical boundary; unmapped words do
// not become invented vocabulary.
const SUGGESTION_TAGS: Readonly<Record<string, string>> = {
  "access-control": "access-control",
  "adversary-emulation": "authorized-offensive-testing",
  "ai-security": "ai-security",
  "alert-deduplication": "alert-tuning",
  "alert-quality": "alert-tuning",
  "alert-tuning": "alert-tuning",
  "api-security": "application-security",
  "application-security": "application-security",
  "artifact-integrity": "supply-chain-security",
  "attack-hypothesis": "detection-engineering",
  "attack-paths": "threat-modeling",
  "authentication": "authentication",
  "authorization": "access-control",
  "authorized-testing": "authorized-offensive-testing",
  "boundary-security": "application-security",
  "certificate-validation": "tls-pki",
  "cicd-security": "ci-cd-pipelines",
  "cloud-security": "cloud-platforms",
  "code-review": "secure-code-review",
  "container-security": "kubernetes",
  containment: "incident-response",
  credentials: "access-control",
  dependencies: "supply-chain-security",
  detection: "detection-engineering",
  "detection-as-code": "detection-engineering",
  "detection-coverage": "detection-engineering",
  "detection-engineering": "detection-engineering",
  "detection-review": "detection-engineering",
  "detection-validation": "security-control-validation",
  "dns-security": "dns",
  enrichment: "alert-tuning",
  escalation: "soc-operations",
  evidence: "security-control-validation",
  "evidence-collection": "incident-response",
  "exposure-validation": "security-control-validation",
  "failure-paths": "fail-closed-design",
  "firewall-policy": "network-segmentation",
  "health-checks": "security-control-validation",
  iam: "access-control",
  identity: "access-control",
  "incident-response": "incident-response",
  "input-validation": "application-security",
  isolation: "network-isolation",
  kubernetes: "kubernetes",
  "lab-safety": "authorized-offensive-testing",
  "least-privilege": "least-privilege",
  "network-security": "network-segmentation",
  "packet-analysis": "logging-monitoring",
  "process-telemetry": "detection-engineering",
  "prompt-injection": "ai-security",
  rbac: "access-control",
  remediation: "vulnerability-management",
  "remediation-validation": "vulnerability-management",
  resilience: "backup-recovery",
  review: "secure-code-review",
  risk: "vulnerability-management",
  "root-cause-analysis": "incident-response",
  "rules-of-engagement": "authorized-offensive-testing",
  runners: "ci-cd-pipelines",
  sbom: "supply-chain-security",
  "secrets-management": "secrets-management",
  "secure-code-review": "secure-code-review",
  segmentation: "network-segmentation",
  sigma: "detection-engineering",
  "soc-operations": "soc-operations",
  "source-control": "supply-chain-security",
  "supply-chain": "supply-chain-security",
  suppression: "alert-tuning",
  "synthetic-events": "security-control-validation",
  telemetry: "detection-engineering",
  "threat-modeling": "threat-modeling",
  tls: "tls-pki",
  triage: "soc-operations",
  "trust-boundaries": "threat-modeling",
  validation: "security-control-validation",
  verification: "security-control-validation",
  "vulnerability-management": "vulnerability-management",
  "workload-identity": "access-control",
};

function readArticleBeads(): ArticleBead[] {
  const result = spawnSync("bd", ["list", "--label", "article", "--all", "--limit", "0", "--json"], {
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stderr.trim() || "bd list failed");
  return JSON.parse(result.stdout) as ArticleBead[];
}

function hasStructuredSuggestions(bead: ArticleBead): boolean {
  return bead.description.includes("Suggested controlled tags:");
}

function suggestionsFor(bead: ArticleBead): string[] {
  const match = /Suggested controlled tags: ([^.]+)/.exec(bead.description);
  return match ? match[1].split(", ") : [];
}

function selectAuthoritativeRecord(records: ArticleBead[]): ArticleBead {
  return records.find(hasStructuredSuggestions) ?? records.find((record) => record.parent !== undefined && record.parent in CATEGORY_DEFAULT_TAGS) ?? records[0];
}

function tagsFor(bead: ArticleBead): string[] {
  const defaults = bead.parent ? CATEGORY_DEFAULT_TAGS[bead.parent] : undefined;
  if (!defaults) throw new Error(`${bead.id}: no category mapping for parent ${bead.parent ?? "<none>"}`);

  const tags = new Set(suggestionsFor(bead).flatMap((suggestion) => SUGGESTION_TAGS[suggestion] ?? []));
  for (const [pattern, tag] of TITLE_TAG_RULES) if (pattern.test(bead.title)) tags.add(tag);
  for (const fallback of defaults) {
    if (tags.size >= 2) break;
    tags.add(fallback);
  }
  return [...tags].slice(0, 4);
}

const beads = readArticleBeads();
const byTitle = new Map<string, ArticleBead[]>();
for (const bead of beads) byTitle.set(bead.title, [...(byTitle.get(bead.title) ?? []), bead]);

const rows = [...byTitle.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([title, records]) => {
  const authoritative = selectAuthoritativeRecord(records);
  const tags = tagsFor(authoritative);
  const errors = [...validateTags(tags), ...(tags.length < 2 || tags.length > 4 ? [`requires 2-4 tags, found ${tags.length}`] : [])];
  return { title, ids: records.map((record) => record.id).sort(), tags, errors, structured: hasStructuredSuggestions(authoritative) };
});

const failures = rows.filter((row) => row.errors.length > 0);
const duplicateRecords = rows.filter((row) => row.ids.length > 1);
const structured = rows.filter((row) => row.structured).length;
const unknown = rows.flatMap((row) => row.tags.filter((tag) => !isKnownTagId(tag)));

for (const row of rows) console.log(`${row.ids.join(",")}\t${row.title}\t${row.tags.join(",")}`);
console.log(`\n[audit] unique article identities: ${rows.length}`);
console.log(`[audit] structured suggestions used as evidence: ${structured}`);
console.log(`[audit] older-format identities mapped from title/category: ${rows.length - structured}`);
console.log(`[audit] duplicate legacy records: ${duplicateRecords.length}`);
console.log(`[audit] unknown canonical ids: ${unknown.length}`);
console.log(`[audit] articles requiring human tag judgment: ${failures.length}`);

if (failures.length > 0 || unknown.length > 0) {
  for (const row of failures) console.error(`[audit] ${row.title}: ${row.errors.join("; ")}`);
  process.exit(1);
}
