import { test } from "node:test";
import assert from "node:assert/strict";
import { pillars, categories } from "./taxonomy.ts";
import { buildSitemapEntries } from "./sitemap-entries.ts";
import { publishedCountForCategory, publishedCountForPillar } from "./knowledge-catalog.ts";
import {
  EMPTY_ROUTE_ROBOTS,
  isCategoryIndexable,
  isLearningPathsIndexable,
  isPillarIndexable,
  robotsMetadataFor,
} from "./taxonomy-indexing.ts";
import { robotsMetaContent } from "./route-integrity.ts";

const SITE_URL = "https://securitycorp.net";
const sitemapUrls = new Set(buildSitemapEntries().map((e) => e.url));

test("robotsMetadataFor: omits the key when indexable (inherit site default), noindex,follow when not", () => {
  assert.deepEqual(robotsMetadataFor(true), {});
  assert.equal("robots" in robotsMetadataFor(true), false);
  assert.deepEqual(robotsMetadataFor(false), { robots: { index: false, follow: true } });
  assert.equal(EMPTY_ROUTE_ROBOTS.follow, true);
});

test("indexability is derived from the published catalog count, not a route list", () => {
  for (const p of pillars) assert.equal(isPillarIndexable(p.id), publishedCountForPillar(p.id) > 0, p.id);
  for (const c of categories) assert.equal(isCategoryIndexable(c.id), publishedCountForCategory(c.id) > 0, c.id);
});

test("sitemap lists exactly the populated pillars and categories", () => {
  for (const p of pillars) {
    const url = `${SITE_URL}/topics/${p.id}/`;
    assert.equal(sitemapUrls.has(url), isPillarIndexable(p.id), `${url} sitemap inclusion must match indexability`);
  }
  for (const c of categories) {
    const url = `${SITE_URL}/topics/${c.pillar}/${c.id}/`;
    assert.equal(sitemapUrls.has(url), isCategoryIndexable(c.id), `${url} sitemap inclusion must match indexability`);
  }
});

test("learning-paths is in the sitemap only when a path is published", () => {
  assert.equal(sitemapUrls.has(`${SITE_URL}/learning-paths/`), isLearningPathsIndexable());
});

// Guards against the two tests above passing vacuously: the current catalog
// must actually exercise both branches (some empty and some populated
// taxonomy routes). If the catalog ever fills every category, delete this
// test rather than weakening the ones above.
test("current catalog has both populated and empty categories", () => {
  const populated = categories.filter((c) => isCategoryIndexable(c.id)).length;
  assert.ok(populated > 0, "expected at least one populated category");
  assert.ok(populated < categories.length, "expected at least one empty category");
});

test("non-taxonomy core routes stay in the sitemap", () => {
  for (const path of ["/", "/topics/", "/knowledge/", "/guides/", "/projects/", "/about/"]) {
    assert.ok(sitemapUrls.has(`${SITE_URL}${path}`), path);
  }
});

test("robotsMetaContent reads Next's rendered robots tag and nothing else", () => {
  assert.equal(robotsMetaContent('<head><meta name="robots" content="noindex, follow"/></head>'), "noindex, follow");
  assert.equal(robotsMetaContent('<head><meta name="robots" content="index, follow"/></head>'), "index, follow");
  assert.equal(robotsMetaContent("<head></head>"), undefined);
  // Prose mentioning the word must not count as the directive.
  assert.equal(robotsMetaContent("<p>We never use noindex here.</p>"), undefined);
});
