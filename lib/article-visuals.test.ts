import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateArticleVisual,
  checkCoverImageGate,
  checkAssetApprovalGate,
  isVisualProductionEligible,
  type ArticleVisual,
  type VisualBrief,
} from "./article-visuals.ts";

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
    mobileCropNotes: "All four tiers must stay individually distinguishable when scaled down under 480px.",
    exportFormats: ["webp"],
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
    src: "/article-visuals/test-article-cover.webp",
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

test("validateArticleVisual accepts approved review status with reviewer, date, and stage reviewed", () => {
  const v = visual({
    stage: "reviewed",
    src: "/article-visuals/test-article-cover.webp",
    provenance: {
      source: "human-illustrated",
      creator: "Ravi Teja Thota",
      createdAt: "2026-09-03",
      license: "site-original-all-rights-reserved",
      editableSourceRef: "design-source/test-article-cover.fig",
      reviewStatus: "approved",
      reviewer: "Ravi Teja Thota",
      reviewedAt: "2026-09-03",
    },
  });
  assert.deepEqual(validateArticleVisual(v, "test-article"), []);
});

test("validateArticleVisual flags approved reviewStatus at stage asset (not yet promoted to reviewed)", () => {
  const v = visual({
    stage: "asset",
    src: "/article-visuals/test-article-cover.webp",
    provenance: { ...visual().provenance, reviewStatus: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
  });
  const errors = validateArticleVisual(v, "test-article");
  assert.ok(errors.some((e) => e.includes('stage is not "reviewed"')));
});

test("validateArticleVisual flags stage reviewed without an approved reviewStatus", () => {
  const v = visual({
    stage: "reviewed",
    src: "/article-visuals/test-article-cover.webp",
    provenance: { ...visual().provenance, reviewStatus: "pending" },
  });
  const errors = validateArticleVisual(v, "test-article");
  assert.ok(errors.some((e) => e.includes('not "approved"')));
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

test("validateArticleVisual flags a mismatched brief.visualType", () => {
  const errors = validateArticleVisual(visual({ brief: brief({ visualType: "in-body-illustration" }) }), "test-article");
  assert.ok(errors.some((e) => e.includes("does not match the visual's own visualType")));
});

test("validateArticleVisual flags empty compositionNotes and mobileCropNotes", () => {
  const errors = validateArticleVisual(visual({ brief: brief({ compositionNotes: "", mobileCropNotes: "" }) }), "test-article");
  assert.ok(errors.some((e) => e.includes("missing compositionNotes")));
  assert.ok(errors.some((e) => e.includes("missing mobileCropNotes")));
});

test("validateArticleVisual flags a factual claim with an empty claim string", () => {
  const errors = validateArticleVisual(visual({ brief: brief({ factualClaims: [{ claim: "", source: "somewhere" }] }) }), "test-article");
  assert.ok(errors.some((e) => e.includes('empty "claim"')));
});

test("validateArticleVisual flags more than one exportFormat (single-format rendering contract)", () => {
  const errors = validateArticleVisual(visual({ brief: brief({ exportFormats: ["avif", "webp"] }) }), "test-article");
  assert.ok(errors.some((e) => e.includes("exactly one file per visual")));
});

test("validateArticleVisual flags a missing/invalid provenance.createdAt", () => {
  const missing = validateArticleVisual(visual({ provenance: { ...visual().provenance, createdAt: "" } }), "test-article");
  assert.ok(missing.some((e) => e.includes("provenance missing createdAt")));
  const invalid = validateArticleVisual(visual({ provenance: { ...visual().provenance, createdAt: "not-a-date" } }), "test-article");
  assert.ok(invalid.some((e) => e.includes("is not a valid date")));
});

test("validateArticleVisual flags human-illustrated/photographed sources missing a creator", () => {
  const illustrated = validateArticleVisual(
    visual({ provenance: { ...visual().provenance, source: "human-illustrated" } }),
    "test-article",
  );
  assert.ok(illustrated.some((e) => e.includes('source is "human-illustrated" but provenance.creator is missing')));
  const photographed = validateArticleVisual(
    visual({ provenance: { ...visual().provenance, source: "photographed" } }),
    "test-article",
  );
  assert.ok(photographed.some((e) => e.includes('source is "photographed" but provenance.creator is missing')));
});

test("validateArticleVisual privacy-scans every nested brief/provenance free-text field", () => {
  const leak = "internal host at 10.0.5.12";
  for (const overrides of [
    { readerTakeaway: leak },
    { whyThisHelps: leak },
    { placement: leak },
    { mustShow: [leak] },
    { mustNotShow: [leak] },
    { compositionNotes: leak },
    { mobileCropNotes: leak },
    { factualClaims: [{ claim: leak, source: "somewhere" }] },
    { factualClaims: [{ claim: "a claim", source: leak }] },
  ] satisfies Partial<VisualBrief>[]) {
    const errors = validateArticleVisual(visual({ brief: brief(overrides) }), "test-article");
    assert.ok(
      errors.some((e) => e.includes("10.0.5.12")),
      `expected a privacy-leak finding for brief overrides ${JSON.stringify(overrides)}, got: ${JSON.stringify(errors)}`,
    );
  }
  const creatorLeak = validateArticleVisual(
    visual({ provenance: { ...visual().provenance, source: "human-illustrated", creator: leak } }),
    "test-article",
  );
  assert.ok(creatorLeak.some((e) => e.includes("10.0.5.12")));
});

test("isVisualProductionEligible: brief stage is trivially eligible (nothing renders)", () => {
  assert.equal(isVisualProductionEligible(visual()), true);
});

test("isVisualProductionEligible: asset stage with pending review is NOT eligible", () => {
  const v = visual({ stage: "asset", src: "/article-visuals/x.webp" });
  assert.equal(isVisualProductionEligible(v), false);
});

test("isVisualProductionEligible: asset stage with needs-revision or rejected is NOT eligible", () => {
  for (const reviewStatus of ["needs-revision", "rejected"] as const) {
    const v = visual({ stage: "asset", src: "/article-visuals/x.webp", provenance: { ...visual().provenance, reviewStatus } });
    assert.equal(isVisualProductionEligible(v), false);
  }
});

test("isVisualProductionEligible: reviewed stage with approved review IS eligible", () => {
  const v = visual({
    stage: "reviewed",
    src: "/article-visuals/x.webp",
    provenance: { ...visual().provenance, reviewStatus: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
  });
  assert.equal(isVisualProductionEligible(v), true);
});

test("checkAssetApprovalGate always applies, independent of VISUAL_GATE_ENABLED (unlike checkCoverImageGate)", () => {
  const pendingAsset = visual({ stage: "asset", src: "/article-visuals/x.webp" });
  const errors = checkAssetApprovalGate([{ meta: { slug: "some-article", status: "drafting" }, coverImage: pendingAsset }]);
  assert.ok(errors.some((e) => e.includes("not production-eligible")));
});

test("checkAssetApprovalGate passes for a brief-only article and for a reviewed+approved one", () => {
  const reviewed = visual({
    stage: "reviewed",
    src: "/article-visuals/x.webp",
    provenance: { ...visual().provenance, reviewStatus: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
  });
  const errors = checkAssetApprovalGate([
    { meta: { slug: "brief-only-article", status: "published" }, coverImage: visual() },
    { meta: { slug: "reviewed-article", status: "published" }, coverImage: reviewed },
    { meta: { slug: "no-cover-article", status: "published" } },
  ]);
  assert.deepEqual(errors, []);
});
