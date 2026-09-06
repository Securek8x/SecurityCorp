import { test } from "node:test";
import assert from "node:assert/strict";
import { toCard } from "./knowledge-catalog.ts";
import type { KnowledgeArticle } from "./knowledge-content.ts";
import type { KnowledgeArticleMeta } from "./knowledge-schema.ts";
import type { ArticleVisual } from "./article-visuals.ts";

function article(overrides: { coverImage?: ArticleVisual }): KnowledgeArticle {
  return {
    meta: {
      title: "Test Article",
      slug: "test-article",
      summary: "A test article.",
    } as KnowledgeArticleMeta,
    sections: {},
    ...overrides,
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
