// Route and knowledge-graph integrity check (Bead securitycorp-source-34i).
// Validates the real catalog data — duplicate slugs, broken internal
// references, sitemap/RSS inclusion, and (when a static build exists)
// that every published route actually produced a file. See
// lib/route-integrity.ts for the pure check functions this wires together.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { knowledgeArticles, publishedKnowledgeArticles } from "../lib/knowledge-content.ts";
import { articles as guides, projects } from "../lib/content.ts";
import { buildSitemapEntries } from "../lib/sitemap-entries.ts";
import { buildRssFeed } from "../lib/rss.ts";
import {
  checkDuplicateKnowledgeSlugs,
  checkDuplicateGuideSlugs,
  checkDuplicateProjectSlugs,
  checkKnowledgeGraphReferences,
  checkProjectGuideReferences,
  checkUrlsPresent,
  checkKnowledgeGraphOrphans,
  robotsMetaContent,
  checkKnowledgeSequenceGraph,
} from "../lib/route-integrity.ts";
import { pillars, categories } from "../lib/taxonomy.ts";
import { isCategoryIndexable, isLearningPathsIndexable, isPillarIndexable } from "../lib/taxonomy-indexing.ts";
import { learningTracks, validateLearningTracks } from "../lib/learning-tracks.ts";

const SITE_URL = "https://securitycorp.net";
const errors: string[] = [];
const warnings: string[] = [];

errors.push(...checkDuplicateKnowledgeSlugs(knowledgeArticles.map((a) => a.meta)));
errors.push(...checkDuplicateGuideSlugs(guides));
errors.push(...checkDuplicateProjectSlugs(projects));
errors.push(...checkKnowledgeGraphReferences(publishedKnowledgeArticles));
errors.push(...checkProjectGuideReferences(projects, guides));
errors.push(...checkKnowledgeSequenceGraph(publishedKnowledgeArticles));
errors.push(
  ...validateLearningTracks(
    learningTracks,
    new Set(knowledgeArticles.map((a) => a.meta.slug)),
    new Set(publishedKnowledgeArticles.map((a) => a.meta.slug)),
  ),
);

const sitemapUrls = new Set(buildSitemapEntries().map((entry) => entry.url));
const knowledgeUrls = publishedKnowledgeArticles.map((a) => `${SITE_URL}/knowledge/${a.meta.slug}/`);
const guideUrls = guides.map((g) => `${SITE_URL}/guides/${g.slug}/`);
errors.push(...checkUrlsPresent(knowledgeUrls, sitemapUrls, "sitemap"));
errors.push(...checkUrlsPresent(guideUrls, sitemapUrls, "sitemap"));

const rss = buildRssFeed();
errors.push(...checkUrlsPresent(knowledgeUrls, rss, "RSS feed"));
errors.push(...checkUrlsPresent(guideUrls, rss, "RSS feed"));

warnings.push(...checkKnowledgeGraphOrphans(publishedKnowledgeArticles).map((w) => w.message));

// Static-output check: only runs when a build already exists (this
// deliberately does not run `next build` itself — same pattern as
// check-draft-isolation's build-dependent portion). Confirms every
// published route actually produced a static file, not just that the
// source data claims it should exist.
const outDir = path.join(process.cwd(), "out");
if (existsSync(outDir)) {
  for (const a of publishedKnowledgeArticles) {
    const file = path.join(outDir, "knowledge", a.meta.slug, "index.html");
    if (!existsSync(file)) errors.push(`${a.meta.slug}: expected static output not found at out/knowledge/${a.meta.slug}/index.html`);
  }
  for (const g of guides) {
    const file = path.join(outDir, "guides", g.slug, "index.html");
    if (!existsSync(file)) errors.push(`${g.slug}: expected static output not found at out/guides/${g.slug}/index.html`);
  }
  for (const p of projects) {
    if (!p.slug) continue;
    const file = path.join(outDir, "projects", p.slug, "index.html");
    if (!existsSync(file)) errors.push(`project "${p.index}": expected static output not found at out/projects/${p.slug}/index.html`);
  }
  // Taxonomy indexing (securitycorp-source-th8): the built page's robots
  // meta must agree with the sitemap decision — exactly "noindex, follow"
  // when the route is empty and the inherited "index, follow" when it is
  // populated, so a page can't be excluded from the sitemap yet still
  // advertise itself as indexable, nor silently lose its robots tag.
  const taxonomyRoutes: { route: string; indexable: boolean }[] = [
    ...pillars.map((p) => ({ route: `topics/${p.id}`, indexable: isPillarIndexable(p.id) })),
    ...categories.map((c) => ({ route: `topics/${c.pillar}/${c.id}`, indexable: isCategoryIndexable(c.id) })),
    { route: "learning-paths", indexable: isLearningPathsIndexable() },
  ];
  for (const { route, indexable } of taxonomyRoutes) {
    const file = path.join(outDir, route, "index.html");
    if (!existsSync(file)) {
      errors.push(`/${route}/: expected static output not found at out/${route}/index.html`);
      continue;
    }
    const expected = indexable ? "index, follow" : "noindex, follow";
    const actual = robotsMetaContent(readFileSync(file, "utf8"));
    if (actual !== expected) {
      errors.push(`/${route}/: robots meta is ${actual === undefined ? "missing" : `"${actual}"`}, expected "${expected}" for ${indexable ? "a populated" : "an empty"} route`);
    }
  }
} else {
  warnings.push("no static build found at out/ — skipping static-output verification; run npm run build:pages first for full coverage.");
}

if (warnings.length > 0) {
  console.warn(`[route-integrity] ${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  - ${w}`);
}

if (errors.length > 0) {
  console.error(`[route-integrity] BLOCKED: ${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `[route-integrity] OK: ${knowledgeArticles.length} knowledge articles, ${guides.length} guides, ${projects.length} projects, ${learningTracks.length} learning tracks checked. No duplicate slugs, no broken internal references, no navigation cycles, sitemap/RSS inclusion confirmed.`,
);
