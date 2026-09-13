import { test } from "node:test";
import assert from "node:assert/strict";
import { toCard } from "./knowledge-catalog.ts";
import type { KnowledgeArticle } from "./knowledge-content.ts";
import type { KnowledgeArticleMeta } from "./knowledge-schema.ts";
import type { ArticleVisual } from "./article-visuals.ts";
import { ARTICLE_PLATES, LEGACY_COVER_SLUGS } from "./article-plates.ts";

function article(overrides: { coverImage?: ArticleVisual; slug?: string }): KnowledgeArticle {
  const { slug, ...rest } = overrides;
  return {
    meta: {
      title: "Test Article",
      slug: slug ?? "test-article",
      summary: "A test article.",
    } as KnowledgeArticleMeta,
    sections: {},
    ...rest,
  };
}

const baseBrief = {
  articleSlug: "test-article",
  readerTakeaway: "x",
  whyThisHelps: "x",
  visualType: "cover" as const,
  placement: "x",
  mustShow: ["x"],
  mustNotShow: ["x"],
  factualClaims: [],
  compositionNotes: "x",
  mobileCropNotes: "x",
  exportFormats: ["webp"],
  sizeBudgetKb: 200,
};

test("toCard has no thumbnail when there is no coverImage at all", () => {
  const card = toCard(article({}));
  assert.equal(card.thumbnail, undefined);
});

test("toCard has no thumbnail for a brief-stage coverImage (no file exists yet)", () => {
  const coverImage: ArticleVisual = {
    stage: "brief",
    visualType: "cover",
    alt: "A sufficiently long alt description",
    width: 1600,
    height: 900,
    purpose: "x",
    brief: baseBrief,
    provenance: {
      source: "brief-only",
      createdAt: "2026-09-04",
      license: "site-original-all-rights-reserved",
      editableSourceRef: "this coverImage.brief record",
      reviewStatus: "pending",
    },
  };
  const card = toCard(article({ coverImage }));
  assert.equal(card.thumbnail, undefined);
});

test("toCard has no thumbnail for a stage-asset coverImage pending human review", () => {
  const coverImage: ArticleVisual = {
    stage: "asset",
    src: "/article-visuals/test-article-cover.webp",
    visualType: "cover",
    alt: "A sufficiently long alt description",
    width: 1600,
    height: 900,
    focalPoint: { x: 0.75, y: 0.5 },
    purpose: "x",
    brief: baseBrief,
    provenance: {
      source: "ai-generated",
      generatingModel: "test model",
      prompt: "test prompt",
      createdAt: "2026-09-04",
      license: "site-original-all-rights-reserved",
      editableSourceRef: "this coverImage.brief record",
      reviewStatus: "pending",
    },
  };
  const card = toCard(article({ coverImage }));
  assert.equal(card.thumbnail, undefined, "a pending asset must never reach the catalog card, even though it renders on the article's own page");
});

test("toCard propagates src, alt, and focalPoint to the thumbnail once stage is reviewed and reviewStatus is approved", () => {
  const coverImage: ArticleVisual = {
    stage: "reviewed",
    src: "/article-visuals/test-article-cover.webp",
    visualType: "cover",
    alt: "A sufficiently long alt description",
    width: 1600,
    height: 900,
    focalPoint: { x: 0.87, y: 0.5 },
    purpose: "x",
    brief: baseBrief,
    provenance: {
      source: "ai-generated",
      generatingModel: "test model",
      prompt: "test prompt",
      createdAt: "2026-09-04",
      license: "site-original-all-rights-reserved",
      editableSourceRef: "this coverImage.brief record",
      reviewStatus: "approved",
      reviewer: "Ravi Teja Thota",
      reviewedAt: "2026-09-10",
    },
  };
  const card = toCard(article({ coverImage }));
  assert.deepEqual(card.thumbnail, {
    kind: "raster",
    src: "/article-visuals/test-article-cover.webp",
    alt: "A sufficiently long alt description",
    focalPoint: { x: 0.87, y: 0.5 },
  });
});

test("toCard has no thumbnail for a reviewed-but-needs-revision coverImage", () => {
  const coverImage: ArticleVisual = {
    stage: "asset",
    src: "/article-visuals/test-article-cover.webp",
    visualType: "cover",
    alt: "A sufficiently long alt description",
    width: 1600,
    height: 900,
    purpose: "x",
    brief: baseBrief,
    provenance: {
      source: "ai-generated",
      generatingModel: "test model",
      prompt: "test prompt",
      createdAt: "2026-09-04",
      license: "site-original-all-rights-reserved",
      editableSourceRef: "this coverImage.brief record",
      reviewStatus: "needs-revision",
    },
  };
  const card = toCard(article({ coverImage }));
  assert.equal(card.thumbnail, undefined);
});

// --- Schematic Plate thumbnails (bead s41.18) -------------------------------

test("toCard uses a plate thumbnail for a bounded-wave article with no raster cover", () => {
  const card = toCard(article({ slug: "docker-sock-mounting-security-risks" }));
  assert.deepEqual(card.thumbnail, { kind: "plate", plate: ARTICLE_PLATES["docker-sock-mounting-security-risks"] });
});

test("toCard has no thumbnail for an article outside the plate wave and with no raster cover", () => {
  const card = toCard(article({ slug: "segmentation-vs-isolation" }));
  assert.equal(card.thumbnail, undefined, "segmentation-vs-isolation carries a diagram but is not in the s41.12 plate wave");
});

test("a legacy article's approved raster cover wins over its own plate — legacy covers keep their existing card treatment", () => {
  assert.ok(LEGACY_COVER_SLUGS.includes("understanding-network-trust-boundaries"), "test assumption: this slug is both a legacy-cover article and has a registered plate");
  assert.ok("understanding-network-trust-boundaries" in ARTICLE_PLATES, "test assumption: this slug has a registered plate");

  const coverImage: ArticleVisual = {
    stage: "reviewed",
    src: "/article-visuals/understanding-network-trust-boundaries-cover.webp",
    visualType: "cover",
    alt: "A sufficiently long alt description",
    width: 1600,
    height: 900,
    focalPoint: { x: 0.87, y: 0.5 },
    purpose: "x",
    brief: baseBrief,
    provenance: {
      source: "ai-generated",
      generatingModel: "test model",
      prompt: "test prompt",
      createdAt: "2026-09-04",
      license: "site-original-all-rights-reserved",
      editableSourceRef: "this coverImage.brief record",
      reviewStatus: "approved",
      reviewer: "Ravi Teja Thota",
      reviewedAt: "2026-09-05",
    },
  };
  const card = toCard(article({ slug: "understanding-network-trust-boundaries", coverImage }));
  assert.equal(card.thumbnail?.kind, "raster", "the approved raster cover must win over the registered plate");
});

test("an article with neither an eligible raster cover nor a plate falls back to a plate if one is registered, else no thumbnail", () => {
  // A pending (unapproved) raster asset must not block the plate fallback,
  // since it is not eligible for the card surface at all (see the
  // stage-asset-pending-review test above) — the plate should still show.
  const coverImage: ArticleVisual = {
    stage: "asset",
    src: "/article-visuals/docker-sock-mounting-security-risks-cover.webp",
    visualType: "cover",
    alt: "A sufficiently long alt description",
    width: 1600,
    height: 900,
    purpose: "x",
    brief: baseBrief,
    provenance: {
      source: "ai-generated",
      generatingModel: "test model",
      prompt: "test prompt",
      createdAt: "2026-09-04",
      license: "site-original-all-rights-reserved",
      editableSourceRef: "this coverImage.brief record",
      reviewStatus: "pending",
    },
  };
  const card = toCard(article({ slug: "docker-sock-mounting-security-risks", coverImage }));
  assert.deepEqual(card.thumbnail, { kind: "plate", plate: ARTICLE_PLATES["docker-sock-mounting-security-risks"] }, "an ineligible raster asset must not suppress the plate fallback");
});
