import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkDuplicateGuideSlugs,
  checkDuplicateProjectSlugs,
  checkKnowledgeGraphReferences,
  checkProjectGuideReferences,
  checkUrlsPresent,
  checkKnowledgeGraphOrphans,
  type KnowledgeArticleForIntegrity,
} from "./route-integrity.ts";

function article(slug: string, overrides: Partial<KnowledgeArticleForIntegrity["sections"]> = {}): KnowledgeArticleForIntegrity {
  return {
    meta: { slug } as KnowledgeArticleForIntegrity["meta"],
    sections: overrides,
  };
}

test("checkDuplicateGuideSlugs is clean for unique slugs", () => {
  assert.deepEqual(checkDuplicateGuideSlugs([{ slug: "a" }, { slug: "b" }]), []);
});

test("checkDuplicateGuideSlugs flags a duplicate", () => {
  const errors = checkDuplicateGuideSlugs([{ slug: "a" }, { slug: "a" }, { slug: "b" }]);
  assert.ok(errors.some((e) => e.includes('duplicate guide slug "a"') && e.includes("(2 guides)")));
});

test("checkDuplicateProjectSlugs ignores projects with no slug", () => {
  assert.deepEqual(checkDuplicateProjectSlugs([{ index: "P-01" }, { index: "P-02" }]), []);
});

test("checkDuplicateProjectSlugs flags a duplicate among slugged projects", () => {
  const errors = checkDuplicateProjectSlugs([
    { index: "P-01", slug: "x" },
    { index: "P-02", slug: "x" },
  ]);
  assert.ok(errors.some((e) => e.includes('duplicate project slug "x"')));
});

test("checkKnowledgeGraphReferences permits an article with no relatedSlugs/nextSlug", () => {
  assert.deepEqual(checkKnowledgeGraphReferences([article("a")]), []);
});

test("checkKnowledgeGraphReferences permits relatedSlugs/nextSlug that resolve to published articles", () => {
  const a = article("a", { relatedSlugs: ["b"], nextSlug: "b" });
  const b = article("b");
  assert.deepEqual(checkKnowledgeGraphReferences([a, b]), []);
});

test("checkKnowledgeGraphReferences flags a relatedSlugs entry that doesn't resolve", () => {
  const a = article("a", { relatedSlugs: ["ghost"] });
  const errors = checkKnowledgeGraphReferences([a]);
  assert.ok(errors.some((e) => e.includes("a: relatedSlugs references unknown or unpublished slug \"ghost\"")));
});

test("checkKnowledgeGraphReferences flags a nextSlug that doesn't resolve", () => {
  const a = article("a", { nextSlug: "ghost" });
  const errors = checkKnowledgeGraphReferences([a]);
  assert.ok(errors.some((e) => e.includes('a: nextSlug references unknown or unpublished slug "ghost"')));
});

test("checkKnowledgeGraphReferences flags a reference to a real but unpublished (draft) slug", () => {
  // "draft" isn't in the published list passed in, simulating a
  // draft/retired article — the function only knows about what it's given.
  const a = article("a", { relatedSlugs: ["draft"] });
  const errors = checkKnowledgeGraphReferences([a]);
  assert.ok(errors.some((e) => e.includes('unknown or unpublished slug "draft"')));
});

test("checkProjectGuideReferences permits a project with no guideSlug", () => {
  assert.deepEqual(checkProjectGuideReferences([{ index: "P-01" }], [{ slug: "g" }]), []);
});

test("checkProjectGuideReferences permits a guideSlug that resolves", () => {
  assert.deepEqual(checkProjectGuideReferences([{ index: "P-01", guideSlug: "g" }], [{ slug: "g" }]), []);
});

test("checkProjectGuideReferences flags a guideSlug that doesn't resolve", () => {
  const errors = checkProjectGuideReferences([{ index: "P-01", guideSlug: "ghost" }], [{ slug: "g" }]);
  assert.ok(errors.some((e) => e.includes('project "P-01": guideSlug references unknown guide "ghost"')));
});

test("checkUrlsPresent accepts a Set of present URLs", () => {
  assert.deepEqual(checkUrlsPresent(["https://x/a"], new Set(["https://x/a", "https://x/b"]), "sitemap"), []);
});

test("checkUrlsPresent flags a missing URL against a Set", () => {
  const errors = checkUrlsPresent(["https://x/a"], new Set(["https://x/b"]), "sitemap");
  assert.ok(errors.some((e) => e.includes("https://x/a: missing from sitemap")));
});

test("checkUrlsPresent accepts a raw string haystack (e.g. RSS XML text)", () => {
  assert.deepEqual(checkUrlsPresent(["https://x/a"], "<link>https://x/a</link>", "RSS feed"), []);
});

test("checkUrlsPresent flags a missing URL against a raw string haystack", () => {
  const errors = checkUrlsPresent(["https://x/a"], "<link>https://x/b</link>", "RSS feed");
  assert.ok(errors.some((e) => e.includes("https://x/a: missing from RSS feed")));
});

test("checkKnowledgeGraphOrphans flags an article with no incoming or outgoing links", () => {
  const warnings = checkKnowledgeGraphOrphans([article("lonely")]);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].slug, "lonely");
});

test("checkKnowledgeGraphOrphans does not flag an article with only outgoing links", () => {
  const a = article("a", { relatedSlugs: ["b"] });
  const b = article("b");
  const warnings = checkKnowledgeGraphOrphans([a, b]);
  assert.deepEqual(
    warnings.map((w) => w.slug),
    [],
  );
});

test("checkKnowledgeGraphOrphans does not flag an article with only incoming links", () => {
  const a = article("a", { relatedSlugs: ["b"] });
  const b = article("b");
  const warnings = checkKnowledgeGraphOrphans([a, b]);
  assert.ok(!warnings.some((w) => w.slug === "b"));
});
