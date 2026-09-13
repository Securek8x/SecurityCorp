// Server-side catalog preparation: turns the (currently empty) published
// article list into the small, card-shaped data the catalog UI actually
// needs. Keeps full article bodies out of the catalog/browser payload and
// keeps filtering logic in one place shared by /knowledge, pillar pages,
// and category pages.
import { publishedKnowledgeArticles, type KnowledgeArticle } from "./knowledge-content.ts";
import type { ContentType, Difficulty, EvidenceState, Audience } from "./knowledge-schema.ts";
import type { CategoryId, PillarId } from "./taxonomy.ts";
import { isVisualProductionEligible } from "./article-visuals.ts";
import { plateForSlug } from "./article-plates.ts";
import type { PlateSpec } from "./schematic-plate.ts";

/** A raster cover image (the legacy Deep Field pilots) or a code-native
 * Schematic Plate (bead s41.18) — the one system spanning covers, diagrams,
 * catalog thumbnails, and social cards keeps a single discriminated shape
 * here rather than smuggling a plate through the raster fields. */
export type KnowledgeCatalogCardThumbnail =
  | { kind: "raster"; src: string; alt: string; focalPoint?: { x: number; y: number } }
  | { kind: "plate"; plate: PlateSpec };

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
  /** `kind: "raster"` only once the article's coverImage is BOTH a real
   * asset (stage "asset"/"reviewed") AND production-eligible
   * (isVisualProductionEligible — stage "reviewed" with an approved
   * review). Unlike the full-size cover on the article's own page (which
   * deliberately renders any real asset so a reviewer can inspect it on
   * an unmerged branch preview), the catalog card is treated as a
   * production-only surface — a pending/rejected/needs-revision asset
   * never appears here, even on a preview build. A raster cover always
   * wins over a plate when both exist, so the three legacy cinematic
   * covers keep their existing card treatment unchanged. `kind: "plate"`
   * only for the bounded s41.12 pilot wave (lib/article-plates.ts) when
   * no raster cover is eligible. Absent for every other article — visuals
   * are additive, not a redesign every card must carry. */
  thumbnail?: KnowledgeCatalogCardThumbnail;
};

/** Exported for direct unit-testing of the thumbnail-eligibility/focal-
 * point propagation rule (lib/knowledge-catalog.test.ts) — the public
 * catalog only ever has real published articles to construct from, which
 * can't exercise both the pending and approved cases in one place. */
export function toCard(article: KnowledgeArticle): KnowledgeCatalogCard {
  const { meta, coverImage } = article;
  const showRaster = Boolean(coverImage && coverImage.stage !== "brief" && coverImage.src && isVisualProductionEligible(coverImage));
  const plate = !showRaster ? plateForSlug(meta.slug) : undefined;
  const thumbnail: KnowledgeCatalogCardThumbnail | undefined = showRaster
    ? { kind: "raster", src: coverImage!.src!, alt: coverImage!.alt, focalPoint: coverImage!.focalPoint }
    : plate
      ? { kind: "plate", plate }
      : undefined;
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
    thumbnail,
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
