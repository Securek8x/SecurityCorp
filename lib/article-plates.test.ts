import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ARTICLE_PLATES,
  DIAGRAM_ARTICLE_COUNT,
  FIRST_WAVE_SLUGS,
  LEGACY_COVER_SLUGS,
  plateForSlug,
  publishedArticlesWithDiagram,
} from "./article-plates.ts";
import { layoutPlate, validatePlateSpec, PLATE_ARCHETYPES } from "./schematic-plate.ts";
import { publishedKnowledgeArticles } from "./knowledge-content.ts";

// --- corrected baseline ----------------------------------------------------

test("the diagram baseline is counted from compiled data, not source text", () => {
  const found = publishedArticlesWithDiagram();
  assert.equal(
    found.length,
    DIAGRAM_ARTICLE_COUNT,
    `recorded baseline is ${DIAGRAM_ARTICLE_COUNT} but the catalog has ${found.length} published articles with a diagram`,
  );
  // The original error was grepping for an inline `diagram:` property, which
  // missed every article using `const diagram` plus object shorthand. The
  // corrected count must be well above that 8.
  assert.ok(found.length > 8, "the corrected baseline must not regress to the source-style artifact of 8");
});

test("counting is blind to declaration style", () => {
  // Two articles known to use different source styles must both be counted.
  const counted = new Set(publishedArticlesWithDiagram().map((a) => a.meta.slug));
  assert.ok(counted.has("segmentation-vs-isolation"), "inline `diagram:` style must be counted");
  assert.ok(counted.has("threat-modeling-cicd-pipeline"), "`const diagram` shorthand style must be counted");
});

test("the first wave is exactly the nine articles fixed by the s41.5 decision", () => {
  assert.equal(FIRST_WAVE_SLUGS.length, 9);
  assert.equal(new Set(FIRST_WAVE_SLUGS).size, 9, "no duplicates");
  assert.deepEqual(
    [...FIRST_WAVE_SLUGS].sort(),
    Object.keys(ARTICLE_PLATES).sort(),
    "every wave slug has a plate and every plate belongs to the wave",
  );
});

test("every first-wave slug is a genuinely published article", () => {
  const published = new Set(publishedKnowledgeArticles.map((a) => a.meta.slug));
  for (const slug of FIRST_WAVE_SLUGS) {
    assert.ok(published.has(slug), `${slug} must be published to be in the pilot wave`);
  }
});

test("the wave is eight existing-diagram articles plus exactly one without", () => {
  const bySlug = new Map(publishedKnowledgeArticles.map((a) => [a.meta.slug, a]));
  const withDiagram = FIRST_WAVE_SLUGS.filter((s) => Boolean(bySlug.get(s)?.diagram));
  const withoutDiagram = FIRST_WAVE_SLUGS.filter((s) => !bySlug.get(s)?.diagram);

  assert.equal(withDiagram.length, 8, `expected 8 diagram articles, got ${withDiagram.join(", ")}`);
  assert.equal(withoutDiagram.length, 1, `expected exactly 1 built from scratch, got ${withoutDiagram.join(", ")}`);
  assert.deepEqual(withoutDiagram, ["scoping-authorized-security-assessment"]);
});

test("the wave is balanced 4 Build Securely + 4 Defend Systems", () => {
  const bySlug = new Map(publishedKnowledgeArticles.map((a) => [a.meta.slug, a]));
  const diagramMembers = FIRST_WAVE_SLUGS.filter((s) => Boolean(bySlug.get(s)?.diagram));
  const counts = new Map<string, number>();
  for (const slug of diagramMembers) {
    const pillar = bySlug.get(slug)!.meta.pillar;
    counts.set(pillar, (counts.get(pillar) ?? 0) + 1);
  }
  assert.equal(counts.get("build-securely"), 4, "expected 4 Build Securely articles");
  assert.equal(counts.get("defend-systems"), 4, "expected 4 Defend Systems articles");
});

test("the wave covers at least four distinct categories", () => {
  const bySlug = new Map(publishedKnowledgeArticles.map((a) => [a.meta.slug, a]));
  const cats = new Set(FIRST_WAVE_SLUGS.map((s) => bySlug.get(s)!.meta.primaryCategory));
  assert.ok(cats.size >= 4, `expected >= 4 categories, got ${cats.size}: ${[...cats].sort().join(", ")}`);
});

test("the wave includes legacy-cover articles so coexistence can actually be shown", () => {
  assert.ok(LEGACY_COVER_SLUGS.length >= 1, "at least one legacy-cover article must be in the wave");
  for (const slug of LEGACY_COVER_SLUGS) {
    assert.ok(FIRST_WAVE_SLUGS.includes(slug), `${slug} must be part of the wave`);
    const article = publishedKnowledgeArticles.find((a) => a.meta.slug === slug);
    assert.ok(article?.coverImage, `${slug} must genuinely still carry its legacy cover`);
  }
});

// CORRECTION (2026-09-13). The s41.5 decision text said the wave was "all
// eight currently published articles that already contain a code-native
// diagram". That premise does not hold against the repository: 29 of the 42
// published articles carry a diagram, not 8. The apparent "8" was an artifact
// of source style only — 8 articles write `diagram: buildDiagram()` inline
// while 23 assign a `const diagram` and use shorthand — which produces an
// identical `KnowledgeArticle.diagram` value and is not a real category.
//
// This test therefore asserts the *bounded* invariant the pilot can actually
// guarantee (a 9-article wave: 8 drawn from the diagram set, 1 without), and
// deliberately does NOT assert that the wave exhausts the diagram set, which
// would re-encode the false premise. Which 8 of the 29 belong in the pilot is
// recorded as an open question for Ravi on bead s41.5.
test("the wave is a bounded subset of the diagram set, not a claim to exhaust it", () => {
  const diagramSlugs = new Set(publishedKnowledgeArticles.filter((a) => a.diagram).map((a) => a.meta.slug));
  const waveDiagramSlugs = FIRST_WAVE_SLUGS.filter((s) => diagramSlugs.has(s));
  assert.equal(waveDiagramSlugs.length, 8);
  for (const slug of waveDiagramSlugs) {
    assert.ok(diagramSlugs.has(slug), `${slug} must genuinely already carry a diagram`);
  }
  assert.ok(diagramSlugs.size > waveDiagramSlugs.length, "the wave is intentionally bounded, not exhaustive");
});

test("every registered plate spec is structurally valid", () => {
  for (const [slug, spec] of Object.entries(ARTICLE_PLATES)) {
    assert.deepEqual(validatePlateSpec(spec), [], `plate for ${slug} must validate clean`);
  }
});

test("every registered plate lays out inside the viewBox with positive geometry", () => {
  for (const [slug, spec] of Object.entries(ARTICLE_PLATES)) {
    const layout = layoutPlate(spec);
    assert.equal(layout.zones.length, spec.zones.length, `${slug}: every zone must be placed`);
    for (const z of layout.zones) {
      assert.ok(z.w > 0 && z.h > 0, `${slug}/${z.id}: positive size`);
      assert.ok(z.x >= 0 && z.x + z.w <= 800, `${slug}/${z.id}: horizontal overflow`);
      assert.ok(z.y >= 0 && z.y + z.h <= 300, `${slug}/${z.id}: vertical overflow`);
      if (z.ring) {
        assert.ok(z.ring.x >= 0 && z.ring.x + z.ring.w <= 800, `${slug}/${z.id}: ring overflows horizontally`);
        assert.ok(z.ring.y >= 0 && z.ring.y + z.ring.h <= 300, `${slug}/${z.id}: ring overflows vertically`);
      }
    }
  }
});

test("no sealed zone anywhere in the wave has a path reaching it", () => {
  for (const [slug, spec] of Object.entries(ARTICLE_PLATES)) {
    const sealed = new Set(spec.zones.filter((z) => z.role === "sealed").map((z) => z.id));
    for (const link of spec.links ?? []) {
      assert.ok(!sealed.has(link.from) && !sealed.has(link.to), `${slug}: link ${link.from}->${link.to} touches a sealed zone`);
    }
    const layout = layoutPlate(spec);
    for (const link of layout.links) {
      for (const id of sealed) {
        assert.ok(!link.id.split("--").includes(id), `${slug}: rendered link ${link.id} reaches sealed zone ${id}`);
      }
    }
  }
});

test("the wave demonstrates real compositional variety, not one archetype repeated", () => {
  const used = new Set(Object.values(ARTICLE_PLATES).map((s) => s.archetype));
  assert.equal(used.size, PLATE_ARCHETYPES.length, `expected all ${PLATE_ARCHETYPES.length} archetypes, got ${[...used].join(", ")}`);

  // No single archetype may dominate the catalog grid.
  const counts = new Map<string, number>();
  for (const spec of Object.values(ARTICLE_PLATES)) {
    counts.set(spec.archetype, (counts.get(spec.archetype) ?? 0) + 1);
  }
  for (const [archetype, count] of counts) {
    assert.ok(count <= 3, `${archetype} used ${count} times — too repetitive for a 9-article wave`);
  }
});

test("plate ids are unique so generated SVG element ids cannot collide", () => {
  const ids = Object.values(ARTICLE_PLATES).map((s) => s.plateId);
  assert.equal(new Set(ids).size, ids.length, `duplicate plateId in ${ids.join(", ")}`);
  for (const id of ids) {
    assert.match(id, /^[a-z0-9-]+$/, `plateId "${id}" must be lowercase kebab-case to be safe in an SVG id`);
  }
});

test("no plate encodes an evidence state — the article shell stays the single source of truth", () => {
  for (const [slug, spec] of Object.entries(ARTICLE_PLATES)) {
    assert.equal(spec.evidenceState, undefined, `${slug} must not duplicate meta.evidenceState in its plate`);
  }
});

test("plate prose carries no placeholder or unsupported-claim markers", () => {
  const banned = [/lorem/i, /placeholder/i, /TODO/i, /TBD/i, /example\.com/i, /\blocalhost\b/i, /\b\d{1,3}(\.\d{1,3}){3}\b/];
  for (const [slug, spec] of Object.entries(ARTICLE_PLATES)) {
    const prose = [spec.title, spec.desc, spec.caption, spec.headerLabel ?? "", ...spec.zones.flatMap((z) => [z.label, z.sublabel ?? "", z.description ?? ""])].join(" ");
    for (const pattern of banned) {
      assert.ok(!pattern.test(prose), `${slug}: plate prose matches forbidden pattern ${pattern}`);
    }
  }
});

test("plateForSlug returns a spec for wave members and undefined otherwise", () => {
  assert.ok(plateForSlug("understanding-network-trust-boundaries"));
  assert.equal(plateForSlug("not-a-real-slug"), undefined);
  // An article outside the bounded wave must not silently acquire a plate.
  assert.equal(plateForSlug("segmentation-vs-isolation"), undefined);
});
