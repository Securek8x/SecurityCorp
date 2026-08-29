// Server-side catalog preparation: turns the (currently empty) published
// article list into the small, card-shaped data the catalog UI actually
// needs. Keeps full article bodies out of the catalog/browser payload and
// keeps filtering logic in one place shared by /knowledge, pillar pages,
// and category pages.
import { publishedKnowledgeArticles } from "./knowledge-content.ts";
import type { KnowledgeArticleMeta, ContentType, Difficulty, EvidenceState, Audience } from "./knowledge-schema.ts";
import type { CategoryId, PillarId } from "./taxonomy.ts";

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
};

function toCard(meta: KnowledgeArticleMeta): KnowledgeCatalogCard {
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
  };
}

export function allCatalogCards(): KnowledgeCatalogCard[] {
  return publishedKnowledgeArticles.map((a) => toCard(a.meta));
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
