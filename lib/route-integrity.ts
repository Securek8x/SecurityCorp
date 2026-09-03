// Route and knowledge-graph integrity checks (Bead securitycorp-source-34i).
// Verifies that whatever navigation/catalog structure exists is actually
// correct and complete — it does not build new navigation, and it is
// distinct from securitycorp-source-4zl.73/4zl.74 which plan new
// learning-track/prerequisite features. Pure functions here so they're
// testable in isolation; scripts/check-route-integrity.ts wires them
// against the real catalog and (when a static build exists) the actual
// generated output.
import { validateCatalogIntegrity } from "./knowledge-schema.ts";
import type { KnowledgeArticleMeta } from "./knowledge-schema.ts";
import type { UniversalSections } from "./knowledge-content-types.ts";

export type KnowledgeArticleForIntegrity = { meta: KnowledgeArticleMeta; sections: UniversalSections };
export type Guide = { slug: string };
export type ProjectRef = { index: string; slug?: string; guideSlug?: string };

/** Duplicate slugs within the knowledge-article catalog (delegates to the
 * existing validator so there is one source of truth for this check). */
export function checkDuplicateKnowledgeSlugs(all: KnowledgeArticleMeta[]): string[] {
  return validateCatalogIntegrity(all);
}

/** Duplicate slugs within the guides collection (lib/content.ts) — this
 * collection has no existing validator of its own. */
export function checkDuplicateGuideSlugs(guides: Guide[]): string[] {
  const errors: string[] = [];
  const seen = new Map<string, number>();
  guides.forEach((g) => seen.set(g.slug, (seen.get(g.slug) ?? 0) + 1));
  for (const [slug, count] of seen) {
    if (count > 1) errors.push(`duplicate guide slug "${slug}" (${count} guides)`);
  }
  return errors;
}

/** Duplicate slugs among projects that declare one (not every project has
 * its own page — some are guide-only case studies). */
export function checkDuplicateProjectSlugs(projects: ProjectRef[]): string[] {
  const errors: string[] = [];
  const seen = new Map<string, number>();
  for (const p of projects) {
    if (!p.slug) continue;
    seen.set(p.slug, (seen.get(p.slug) ?? 0) + 1);
  }
  for (const [slug, count] of seen) {
    if (count > 1) errors.push(`duplicate project slug "${slug}" (${count} projects)`);
  }
  return errors;
}

/** Every published knowledge article's relatedSlugs/nextSlug must resolve
 * to another PUBLISHED knowledge article — a reference to a draft, retired,
 * or nonexistent slug is a broken internal link even though it would never
 * 404 for a reader (it just silently wouldn't render as a link target). */
export function checkKnowledgeGraphReferences(published: KnowledgeArticleForIntegrity[]): string[] {
  const errors: string[] = [];
  const publishedSlugs = new Set(published.map((a) => a.meta.slug));
  for (const article of published) {
    for (const rel of article.sections.relatedSlugs ?? []) {
      if (!publishedSlugs.has(rel)) {
        errors.push(`${article.meta.slug}: relatedSlugs references unknown or unpublished slug "${rel}"`);
      }
    }
    const next = article.sections.nextSlug;
    if (next && !publishedSlugs.has(next)) {
      errors.push(`${article.meta.slug}: nextSlug references unknown or unpublished slug "${next}"`);
    }
  }
  return errors;
}

/** A project's guideSlug (linking a case study to its walkthrough) must
 * resolve to a real guide. */
export function checkProjectGuideReferences(projects: ProjectRef[], guides: Guide[]): string[] {
  const errors: string[] = [];
  const guideSlugs = new Set(guides.map((g) => g.slug));
  for (const p of projects) {
    if (p.guideSlug && !guideSlugs.has(p.guideSlug)) {
      errors.push(`project "${p.index}": guideSlug references unknown guide "${p.guideSlug}"`);
    }
  }
  return errors;
}

/** Every URL a collection should produce must actually appear in a given
 * feed's set of URLs (sitemap, RSS — both take a pre-extracted URL set/text
 * so this stays independent of how each feed is actually built). */
export function checkUrlsPresent(expectedUrls: string[], present: Set<string> | string, feedName: string): string[] {
  const errors: string[] = [];
  for (const url of expectedUrls) {
    const found = typeof present === "string" ? present.includes(url) : present.has(url);
    if (!found) errors.push(`${url}: missing from ${feedName}`);
  }
  return errors;
}

export type OrphanWarning = { slug: string; message: string };

/** Soft, non-blocking signal: a published article with no related-content
 * link in either direction. This does NOT mean the page is unreachable —
 * /knowledge and /topics/[pillar]/[category] enumerate every published
 * article directly, not via a link graph — it just means a reader on that
 * page has no direct path to or from any other article, which is worth an
 * editor's attention even though it isn't a broken link. */
export function checkKnowledgeGraphOrphans(published: KnowledgeArticleForIntegrity[]): OrphanWarning[] {
  const referenced = new Set<string>();
  for (const a of published) {
    for (const rel of a.sections.relatedSlugs ?? []) referenced.add(rel);
    if (a.sections.nextSlug) referenced.add(a.sections.nextSlug);
  }
  const warnings: OrphanWarning[] = [];
  for (const a of published) {
    const hasOutgoing = (a.sections.relatedSlugs?.length ?? 0) > 0 || Boolean(a.sections.nextSlug);
    const hasIncoming = referenced.has(a.meta.slug);
    if (!hasOutgoing && !hasIncoming) {
      warnings.push({
        slug: a.meta.slug,
        message: `${a.meta.slug}: no related-content link in or out (still reachable via /knowledge and /topics; has no direct related-article path for a reader)`,
      });
    }
  }
  return warnings;
}
