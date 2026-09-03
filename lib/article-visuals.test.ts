import { test } from "node:test";
import assert from "node:assert/strict";
import { validateArticleVisual, checkCoverImageGate, type ArticleVisual, type VisualBrief } from "./article-visuals.ts";

function brief(overrides: Partial<VisualBrief> = {}): VisualBrief {
  return {
    articleSlug: "test-article",
    readerTakeaway: "Understands the boundary at a glance.",
    whyThisHelps: "The prose alone requires holding four tiers in your head at once.",
    visualType: "cover",
    placement: "After the lead paragraph, before the first numbered section.",
    mustShow: ["Four labeled tiers", "One arrow per allowed path"],
    mustNotShow: ["Any real hostname", "A hooded figure"],
    factualClaims: [{ claim: "The admin plane is isolated, not merely segmented", source: "Article body, Segmentation versus isolation section" }],
    compositionNotes: "Wide 16:9, tiers arranged left to right.",
    mobileCropNotes: "Center-crop to the two most relevant tiers under 480px.",
    exportFormats: ["avif", "webp"],
    sizeBudgetKb: 150,
    ...overrides,
  };
}

function visual(overrides: Partial<ArticleVisual> = {}): ArticleVisual {
  return {
    stage: "brief",
    visualType: "cover",
    alt: "Four-tier network architecture with the admin plane isolated from the data tier",
    purpose: "Let a reader see the tier boundaries before reading the prose describing them.",
    width: 1600,
    height: 900,
    brief: brief(),
    provenance: {
      source: "brief-only",
      createdAt: "2026-09-03",
      license: "site-original-all-rights-reserved",
      editableSourceRef: "this brief record",
      reviewStatus: "pending",
    },
    ...overrides,
  };
}

test("validateArticleVisual accepts a well-formed brief-stage visual", () => {
  assert.deepEqual(validateArticleVisual(visual(), "test-article"), []);
});

test("validateArticleVisual accepts a well-formed asset-stage visual", () => {
  const v = visual({
    stage: "asset",
    src: "/article-visuals/test-article-cover.avif",
    provenance: {
      source: "ai-generated",
      generatingModel: "ui-ux-pro-max / gemini-3-pro-image-preview",
      prompt: "Isometric four-tier network diagram, deep navy, cyan accents, no text",
      createdAt: "2026-09-03",
      license: "site-original-all-rights-reserved",
      editableSourceRef: "prompt above; regenerate with the same model/prompt/seed",
      reviewStatus: "pending",
    },
  });
  assert.deepEqual(validateArticleVisual(v, "test-article"), []);
});

test("validateArticleVisual flags missing alt text", () => {
  const errors = validateArticleVisual(visual({ alt: "" }), "test-article");
  assert.ok(errors.some((e) => e.includes("missing alt text")));
});

test("validateArticleVisual flags a too-short alt text", () => {
  const errors = validateArticleVisual(visual({ alt: "diagram" }), "test-article");
  assert.ok(errors.some((e) => e.includes("too short")));
});

test("validateArticleVisual flags filename-like alt text", () => {
  const errors = validateArticleVisual(visual({ alt: "cover-image-final.png" }), "test-article");
  assert.ok(errors.some((e) => e.includes("looks like a filename")));
});

test("validateArticleVisual flags a brief-stage visual that has a src set", () => {
  const errors = validateArticleVisual(visual({ src: "/should-not-be-here.png" }), "test-article");
  assert.ok(errors.some((e) => e.includes('stage is "brief" but src is set')));
});

test("validateArticleVisual flags an asset-stage visual missing src/dimensions", () => {
  const errors = validateArticleVisual(visual({ stage: "asset", width: 0, height: 0 }), "test-article");
  assert.ok(errors.some((e) => e.includes("src is missing")));
  assert.ok(errors.some((e) => e.includes("invalid width")));
  assert.ok(errors.some((e) => e.includes("invalid height")));
});

test("validateArticleVisual flags an out-of-range focal point", () => {
  const errors = validateArticleVisual(visual({ focalPoint: { x: 1.4, y: 0.5 } }), "test-article");
  assert.ok(errors.some((e) => e.includes("focalPoint out of 0-1 range")));
});

test("validateArticleVisual flags an incomplete brief", () => {
  const errors = validateArticleVisual(visual({ brief: brief({ mustShow: [], mustNotShow: [] }) }), "test-article");
  assert.ok(errors.some((e) => e.includes('missing "must show"')));
  assert.ok(errors.some((e) => e.includes('missing "must not show"')));
});

test("validateArticleVisual flags a factual claim with no source", () => {
  const errors = validateArticleVisual(visual({ brief: brief({ factualClaims: [{ claim: "X is true", source: "" }] }) }), "test-article");
  assert.ok(errors.some((e) => e.includes("has no supporting source")));
});

test("validateArticleVisual flags a mismatched brief.articleSlug", () => {
  const errors = validateArticleVisual(visual({ brief: brief({ articleSlug: "wrong-slug" }) }), "test-article");
  assert.ok(errors.some((e) => e.includes("does not match article slug")));
});

test("validateArticleVisual flags approved review status missing reviewer", () => {
  const v = visual({ provenance: { ...visual().provenance, reviewStatus: "approved" } });
  const errors = validateArticleVisual(v, "test-article");
  assert.ok(errors.some((e) => e.includes("reviewer/reviewedAt is missing")));
});

test("validateArticleVisual accepts approved review status with reviewer and date", () => {
  const v = visual({
    provenance: { ...visual().provenance, reviewStatus: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
  });
  assert.deepEqual(validateArticleVisual(v, "test-article"), []);
});

test("validateArticleVisual flags ai-generated asset missing generatingModel/prompt", () => {
  const v = visual({
    stage: "asset",
    src: "/x.avif",
    provenance: { source: "ai-generated", createdAt: "2026-09-03", license: "cc0", editableSourceRef: "x", reviewStatus: "pending" },
  });
  const errors = validateArticleVisual(v, "test-article");
  assert.ok(errors.some((e) => e.includes("missing provenance.generatingModel")));
  assert.ok(errors.some((e) => e.includes("missing provenance.prompt")));
});

test("validateArticleVisual flags a private IP leaking through the alt text", () => {
  const errors = validateArticleVisual(visual({ alt: "Architecture diagram showing the host at 10.0.5.12 reachable" }), "test-article");
  assert.ok(errors.some((e) => e.includes("alt")));
});

test("checkCoverImageGate is a no-op while VISUAL_GATE_ENABLED is false", () => {
  const errors = checkCoverImageGate([{ meta: { slug: "a", status: "published" } }]);
  assert.deepEqual(errors, []);
});
