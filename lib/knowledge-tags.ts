// Controlled tag vocabulary for KnowledgeArticleMeta.tags (Bead
// securitycorp-source-4zl.84). Published content must carry 2-4 tags
// (TAG_MIN/TAG_MAX in ./knowledge-schema.ts), and every tag must be one of
// the canonical ids below — dynamically accepting whatever string an
// article happened to use is not controlled tagging.
//
// A tag is identified by its canonical id (what `meta.tags` must contain)
// and rendered with its display `label`. Ids are grouped for authoring UI
// and documentation purposes only — grouping never affects validation.
//
// Adding a new approved tag:
//   1. Confirm the concept isn't already covered by an existing tag or
//      alias below (check TAG_ALIASES too — a near-miss should usually
//      become an alias, not a new tag).
//   2. Add one entry to TAG_VOCABULARY with a stable kebab-case `id`, a
//      human-readable `label`, and the closest-fitting `group`.
//   3. If a common variant spelling/casing/synonym exists, add it to
//      TAG_ALIASES pointing at the new id rather than teaching authors to
//      remember the exact canonical form.
//   4. Add or extend a case in lib/knowledge-tags.test.ts covering the new
//      id (and any alias) so drift is caught by `npm run test`.
//   5. This file is the single source of truth — do not hand-list tags
//      anywhere else (authoring docs link here instead of duplicating the
//      list).
export type TagGroup = "technology" | "practice" | "control-type" | "environment";

export const TAG_GROUPS: readonly TagGroup[] = ["technology", "practice", "control-type", "environment"] as const;

export type TagDefinition = {
  id: string;
  label: string;
  group: TagGroup;
};

// Canonical vocabulary. Ids are the only values `KnowledgeArticleMeta.tags`
// may contain. Starter set scoped to the six pillars / twenty-one
// categories in ./taxonomy.ts — expected to grow via the process above as
// the 99 planned articles are drafted, not to be treated as exhaustive now.
export const TAG_VOCABULARY: readonly TagDefinition[] = [
  // technology
  { id: "docker", label: "Docker", group: "technology" },
  { id: "kubernetes", label: "Kubernetes", group: "technology" },
  { id: "ci-cd-pipelines", label: "CI/CD Pipelines", group: "technology" },
  { id: "vpn", label: "VPN", group: "technology" },
  { id: "dns", label: "DNS", group: "technology" },
  { id: "tls-pki", label: "TLS / PKI", group: "technology" },
  { id: "reverse-proxy", label: "Reverse Proxy", group: "technology" },
  { id: "siem", label: "SIEM", group: "technology" },
  { id: "edr", label: "EDR", group: "technology" },
  { id: "cloud-platforms", label: "Cloud Platforms", group: "technology" },
  { id: "infrastructure-as-code", label: "Infrastructure as Code", group: "technology" },
  { id: "secrets-managers", label: "Secrets Managers", group: "technology" },
  { id: "malware-scanners", label: "Malware Scanners", group: "technology" },
  { id: "ai-tooling", label: "AI Tooling", group: "technology" },

  // practice
  { id: "threat-modeling", label: "Threat Modeling", group: "practice" },
  { id: "incident-response", label: "Incident Response", group: "practice" },
  { id: "detection-engineering", label: "Detection Engineering", group: "practice" },
  { id: "authorized-offensive-testing", label: "Authorized Offensive Testing", group: "practice" },
  { id: "vulnerability-management", label: "Vulnerability Management", group: "practice" },
  { id: "security-control-validation", label: "Security Control Validation", group: "practice" },
  { id: "governance-risk-compliance", label: "Governance, Risk & Compliance", group: "practice" },
  { id: "secrets-management", label: "Secrets Management", group: "practice" },
  { id: "patch-management", label: "Patch Management", group: "practice" },
  { id: "backup-recovery", label: "Backup & Recovery", group: "practice" },
  { id: "logging-monitoring", label: "Logging & Monitoring", group: "practice" },
  { id: "least-privilege", label: "Least Privilege", group: "practice" },
  { id: "supply-chain-security", label: "Supply Chain Security", group: "practice" },
  { id: "migration-planning", label: "Migration Planning", group: "practice" },
  { id: "application-security", label: "Application Security", group: "practice" },
  { id: "secure-code-review", label: "Secure Code Review", group: "practice" },
  { id: "soc-operations", label: "SOC Operations", group: "practice" },
  { id: "alert-tuning", label: "Alert Tuning", group: "practice" },
  { id: "ai-security", label: "AI Security", group: "practice" },

  // control-type
  { id: "network-isolation", label: "Network Isolation", group: "control-type" },
  { id: "access-control", label: "Access Control", group: "control-type" },
  { id: "authentication", label: "Authentication", group: "control-type" },
  { id: "encryption", label: "Encryption", group: "control-type" },
  { id: "fail-closed-design", label: "Fail-Closed Design", group: "control-type" },
  { id: "kill-switch-testing", label: "Kill-Switch Testing", group: "control-type" },
  // Segmentation divides systems into controlled zones. Isolation prevents
  // or severely restricts communication; use network-isolation for that
  // stronger boundary rather than treating these controls as synonyms.
  { id: "network-segmentation", label: "Network Segmentation", group: "control-type" },

  // environment
  { id: "home-lab", label: "Home Lab", group: "environment" },
  { id: "self-hosted", label: "Self-Hosted", group: "environment" },
  { id: "cloud-hosted", label: "Cloud-Hosted", group: "environment" },
  { id: "enterprise", label: "Enterprise", group: "environment" },
  { id: "hybrid", label: "Hybrid", group: "environment" },
] as const;

// Non-canonical spellings/synonyms/casing variants that should resolve to a
// canonical id instead of being rejected outright. Keys are matched after
// lowercasing + trimming (see normalizeTagInput), so entries here should be
// lowercase. Values must be ids present in TAG_VOCABULARY (checked by
// lib/knowledge-tags.test.ts).
export const TAG_ALIAS_ENTRIES: readonly (readonly [alias: string, canonicalId: string])[] = [
  ["k8s", "kubernetes"],
  ["ci/cd", "ci-cd-pipelines"],
  ["cicd", "ci-cd-pipelines"],
  ["iac", "infrastructure-as-code"],
  ["pki", "tls-pki"],
  ["tls", "tls-pki"],
  ["ssl", "tls-pki"],
  ["network segmentation", "network-segmentation"],
  ["red team", "authorized-offensive-testing"],
  ["red-team", "authorized-offensive-testing"],
  ["red teaming", "authorized-offensive-testing"],
  ["pentesting", "authorized-offensive-testing"],
  ["penetration testing", "authorized-offensive-testing"],
  ["homelab", "home-lab"],
] as const;

export const TAG_ALIASES: Readonly<Record<string, string>> = Object.fromEntries(TAG_ALIAS_ENTRIES);

const TAG_IDS = new Set(TAG_VOCABULARY.map((t) => t.id));
export const tagById = new Map(TAG_VOCABULARY.map((t) => [t.id, t]));

/** Lowercase + trim only — canonical ids are already kebab-case, so this is
 * just enough normalization to make alias lookups and casing-variant input
 * ("Kubernetes", " kubernetes ") resolve without duplicating every id in
 * TAG_ALIASES. */
export function normalizeTagInput(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Resolves free-form author input to a canonical tag id, or undefined if
 * it matches neither a canonical id nor a known alias. Does not mutate or
 * validate `meta.tags` — see validateTags for that. */
export function resolveTagId(raw: string): string | undefined {
  const normalized = normalizeTagInput(raw);
  if (TAG_IDS.has(normalized)) return normalized;
  return TAG_ALIASES[normalized];
}

export function isKnownTagId(id: string): boolean {
  return TAG_IDS.has(id);
}

export function tagLabel(id: string): string {
  return tagById.get(id)?.label ?? id;
}

/** Validates a raw `meta.tags` array against the controlled vocabulary:
 * every entry must already be a canonical id (authors are expected to
 * store resolved ids, not raw aliases — resolveTagId is for authoring
 * tooling, not a silent runtime fallback) and no id may repeat. Casing or
 * alias variants are reported as unknown-tag errors that name the
 * canonical id they should have used, so the fix is unambiguous. */
export function validateTags(tags: string[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const raw of tags) {
    if (isKnownTagId(raw)) {
      if (seen.has(raw)) {
        errors.push(`duplicate tag "${raw}"`);
      } else {
        seen.add(raw);
      }
      continue;
    }

    const resolved = resolveTagId(raw);
    if (resolved && resolved !== raw) {
      errors.push(`unknown tag "${raw}" — use canonical id "${resolved}" instead`);
    } else {
      errors.push(`unknown tag "${raw}" is not in the controlled vocabulary (see lib/knowledge-tags.ts)`);
    }
  }

  return errors;
}

/** Structural checks for the vocabulary itself. Kept separate from article
 * validation so tests and local authoring tools can catch definition drift
 * before a tag reaches article metadata. */
export function validateTagVocabulary(
  vocabulary: readonly TagDefinition[] = TAG_VOCABULARY,
  aliases: readonly (readonly [string, string])[] = TAG_ALIAS_ENTRIES,
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const normalizedIds = new Set<string>();
  const labels = new Set<string>();
  const aliasIds = new Map<string, string>();

  for (const tag of vocabulary) {
    if (!TAG_GROUPS.includes(tag.group)) errors.push(`invalid tag group "${tag.group}" for "${tag.id}"`);
    if (ids.has(tag.id)) errors.push(`duplicate canonical id "${tag.id}"`);
    ids.add(tag.id);

    const normalizedId = normalizeTagInput(tag.id);
    if (normalizedIds.has(normalizedId)) errors.push(`case-insensitive canonical collision "${tag.id}"`);
    normalizedIds.add(normalizedId);

    const normalizedLabel = normalizeTagInput(tag.label);
    if (labels.has(normalizedLabel)) errors.push(`duplicate display label "${tag.label}"`);
    labels.add(normalizedLabel);
  }

  for (const [rawAlias, canonicalId] of aliases) {
    const alias = normalizeTagInput(rawAlias);
    if (alias !== rawAlias) errors.push(`alias "${rawAlias}" must be lowercase and trimmed`);
    if (ids.has(alias)) errors.push(`alias "${rawAlias}" equals a canonical id`);
    if (!ids.has(canonicalId)) errors.push(`alias "${rawAlias}" points at unknown id "${canonicalId}"`);
    const previous = aliasIds.get(alias);
    if (previous !== undefined) {
      errors.push(previous === canonicalId ? `duplicate alias "${rawAlias}"` : `alias "${rawAlias}" maps to multiple canonical ids`);
    }
    aliasIds.set(alias, canonicalId);
  }

  return errors;
}
