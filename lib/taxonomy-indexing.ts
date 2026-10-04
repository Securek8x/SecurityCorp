// Search-indexing policy for taxonomy and index routes (Bead
// securitycorp-source-th8). A pillar, category, or learning-paths page with
// no published content stays reachable — navigation links to it and a 404
// would be worse — but it is kept out of the sitemap and marked noindex so
// crawlers aren't handed an empty page as a destination.
//
// Emptiness is derived from the same catalog functions the pages render
// from (cardsForPillar/cardsForCategory), never from a hard-coded route
// list, so the sitemap, the robots meta, and the visible page can't
// disagree. A route becomes indexable again automatically the moment it
// gains a published article. Relative imports only: lib/sitemap-entries.ts
// (and through it scripts/check-route-integrity.ts) runs under plain node.
import { publishedCountForCategory, publishedCountForPillar } from "./knowledge-catalog.ts";
import type { CategoryId, PillarId } from "./taxonomy.ts";

/** Robots directive for a reachable route that should not be indexed.
 * `follow` stays true so links out of the page (to populated sibling
 * categories, the topics index) still count. */
export const EMPTY_ROUTE_ROBOTS = { index: false, follow: true } as const;

/** Learning paths have no data model yet (securitycorp-source-4zl.73), so
 * none can be published. Replace with a count from that model once it
 * exists — this is the single place the learning-paths page and the
 * sitemap read from. */
export const PUBLISHED_LEARNING_PATH_COUNT = 0;

export function isPillarIndexable(pillar: PillarId): boolean {
  return publishedCountForPillar(pillar) > 0;
}

export function isCategoryIndexable(category: CategoryId): boolean {
  return publishedCountForCategory(category) > 0;
}

export function isLearningPathsIndexable(): boolean {
  return PUBLISHED_LEARNING_PATH_COUNT > 0;
}

/** Metadata fragment to spread into a route's Metadata: empty when the
 * route is indexable (so the site-wide `index, follow` from app/layout.tsx
 * is inherited — an explicit `robots: undefined` would instead drop the
 * tag entirely), otherwise the noindex directive. */
export function robotsMetadataFor(indexable: boolean): { robots?: typeof EMPTY_ROUTE_ROBOTS } {
  return indexable ? {} : { robots: EMPTY_ROUTE_ROBOTS };
}
