import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PLATE_PILOT_APPROVED_SLUGS,
  TEACHING_FIGURE_ASSESSMENTS,
  VISUAL_INVENTORY_BASELINE,
  inventoryRow,
  publishedVisualInventory,
  summarizeVisualInventory,
} from "./article-visual-inventory.ts";
import { ARTICLE_PLATES, FIRST_WAVE_SLUGS, publishedArticlesWithDiagram } from "./article-plates.ts";
import { publishedKnowledgeArticles } from "./knowledge-content.ts";
import { checkCoverImageGate } from "./article-visuals.ts";
import type { KnowledgeArticle } from "./knowledge-content.ts";

test("the live inventory matches the recorded baseline", () => {
  assert.deepEqual(
    summarizeVisualInventory(publishedVisualInventory()),
    VISUAL_INVENTORY_BASELINE,
    "the catalog changed — update VISUAL_INVENTORY_BASELINE and the counts in docs/article-visual-guidelines.md together",
  );
});

test("the inventory is internally consistent", () => {
  const s = summarizeVisualInventory(publishedVisualInventory());
  assert.equal(s.published, publishedKnowledgeArticles.length);
  assert.equal(s.withCover + s.withoutCover, s.published);
  assert.equal(s.rasterCovers + s.plateCovers, s.withCover);
  assert.equal(s.coversHumanApproved + s.coversPendingHumanReview, s.withCover);
  assert.equal(
    Object.values(s.teachingFigures).reduce((n, v) => n + v, 0),
    s.published,
  );
  // A teaching figure is not a cover: the two are counted independently.
  assert.equal(s.teachingFigures.present, publishedArticlesWithDiagram().length);
});

test("a raster cover keeps the cover slot and its plate moves in-body", () => {
  const rows = new Map(publishedVisualInventory().map((r) => [r.slug, r]));
  for (const slug of ["understanding-network-trust-boundaries", "protecting-main-branch-beyond-pr-approval"]) {
    const r = rows.get(slug);
    assert.equal(r?.cover, "raster", slug);
    assert.equal(r?.inBodyPlate, true, slug);
  }
});

test("plate approval covers exactly the approved pilot wave", () => {
  assert.deepEqual([...PLATE_PILOT_APPROVED_SLUGS].sort(), [...FIRST_WAVE_SLUGS].sort());
  assert.deepEqual(Object.keys(ARTICLE_PLATES).sort(), [...FIRST_WAVE_SLUGS].sort());
});

test("asset existence never implies approval", () => {
  const base = publishedKnowledgeArticles.find((a) => a.coverImage);
  assert.ok(base?.coverImage, "fixture needs one article with a raster cover");
  const pending: KnowledgeArticle = {
    ...base,
    coverImage: {
      ...base.coverImage,
      stage: "asset",
      provenance: { ...base.coverImage.provenance, reviewStatus: "pending", reviewer: undefined, reviewedAt: undefined },
    },
  };
  const row = inventoryRow(pending);
  assert.equal(row.cover, "raster");
  assert.equal(row.coverApproval, "pending-human-review");
});

test("an article with no cover has nothing to approve", () => {
  const article = publishedKnowledgeArticles.find((a) => !a.coverImage && !ARTICLE_PLATES[a.meta.slug]);
  assert.ok(article, "fixture needs one article with no cover");
  const row = inventoryRow(article);
  assert.equal(row.cover, "none");
  assert.equal(row.coverApproval, "not-applicable");
});

test("teaching-figure assessments are human-recorded only, never defaulted", () => {
  assert.deepEqual(TEACHING_FIGURE_ASSESSMENTS, {});
  const withoutDiagram = publishedVisualInventory().filter((r) => r.teachingFigure !== "present");
  assert.ok(withoutDiagram.every((r) => r.teachingFigure === "not-assessed"));
});

test("the enforced cover gate would fail exactly the uncovered articles, never a plate cover", () => {
  const errors = checkCoverImageGate(
    publishedKnowledgeArticles.map((a) => ({ meta: a.meta, coverImage: a.coverImage, hasPlate: Boolean(ARTICLE_PLATES[a.meta.slug]) })),
    true,
  );
  const failed = new Set(errors.map((e) => e.split(":")[0]));
  const rows = publishedVisualInventory();
  assert.equal(failed.size, VISUAL_INVENTORY_BASELINE.withoutCover);
  for (const r of rows) assert.equal(failed.has(r.slug), !r.canonicalCover, r.slug);
  for (const r of rows.filter((x) => x.cover === "plate")) assert.ok(!failed.has(r.slug), `plate cover ${r.slug} must pass`);
});

test("a teaching diagram alone never counts as a cover", () => {
  const diagramOnly = publishedVisualInventory().filter((r) => r.teachingFigure === "present" && r.cover === "none");
  assert.ok(diagramOnly.length > 0, "fixture needs a diagram article without a cover");
  assert.ok(diagramOnly.every((r) => !r.canonicalCover));
});
