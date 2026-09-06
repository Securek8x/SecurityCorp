// Server-side catalog preparation: turns the (currently empty) published
// article list into the small, card-shaped data the catalog UI actually
// needs. Keeps full article bodies out of the catalog/browser payload and
// keeps filtering logic in one place shared by /knowledge, pillar pages,
// and category pages.
import { publishedKnowledgeArticles, type KnowledgeArticle } from "./knowledge-content.ts";
import type { ContentType, Difficulty, EvidenceState, Audience } from "./knowledge-schema.ts";
import type { CategoryId, PillarId } from "./taxonomy.ts";
import { isVisualProductionEligible } from "./article-visuals.ts";

export type KnowledgeCatalogCard = {
  slug: string;
  title: string;
  summary: string;
  pillar: PillarId;
  category: CategoryId;
  contentType: ContentType;
  difficulty: Difficulty;
  evidenceState: EvidenceState;
  audience: Audience[];
  tags: string[];
  estimatedReadingMinutes: number;
  /** Only set once the article's coverImage is BOTH a real asset (stage
   * "asset"/"reviewed") AND production-eligible (isVisualProductionEligible
   * — stage "reviewed" with an approved review). Unlike the full-size
   * cover on the article's own page (which deliberately renders any real
   * asset so a reviewer can inspect it on an unmerged branch preview),
   * the catalog card is treated as a production-only surface — a
   * pending/rejected/needs-revision asset never appears here, even on a
   * preview build. A "brief"-stage cover has no file to show yet, so the
   * card renders exactly as it does today (Bead s41.9-12 pilot). */
  thumbnail?: { src: string; alt: string; focalPoint?: { x: number; y: number } };
};

/** Exported for direct unit-testing of the thumbnail-eligibility/focal-
 * point propagation rule (lib/knowledge-catalog.test.ts) — the public
 * catalog only ever has real published articles to construct from, which
 * can't exercise both the pending and approved cases in one place. */
export function toCard(article: KnowledgeArticle): KnowledgeCatalogCard {
  const { meta, coverImage } = article;
  const showThumbnail = coverImage && coverImage.stage !== "brief" && coverImage.src && isVisualProductionEligible(coverImage);
  return {
    slug: meta.slug,
    title: meta.title,
    summary: meta.summary,
    pillar: meta.pillar,
    category: meta.primaryCategory,
    contentType: meta.contentType,
    difficulty: meta.difficulty,
    evidenceState: meta.evidenceState,
    audience: meta.audience,
    tags: meta.tags,
    estimatedReadingMinutes: meta.estimatedReadingMinutes,
    thumbnail: showThumbnail ? { src: coverImage.src!, alt: coverImage.alt, focalPoint: coverImage.focalPoint } : undefined,
  };
}

export function allCatalogCards(): KnowledgeCatalogCard[] {
  return publishedKnowledgeArticles.map(toCard);
}

export function cardsForPillar(pillar: PillarId): KnowledgeCatalogCard[] {
  return allCatalogCards().filter((c) => c.pillar === pillar);
}

export function cardsForCategory(category: CategoryId): KnowledgeCatalogCard[] {
  return allCatalogCards().filter((c) => c.category === category);
}

/** Published-article count for a pillar — the only source pillar/topics
 * cards may use for a public count. Never derive a count from Beads. */
export function publishedCountForPillar(pillar: PillarId): number {
  return cardsForPillar(pillar).length;
}

export function publishedCountForCategory(category: CategoryId): number {
  return cardsForCategory(category).length;
}
