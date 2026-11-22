import { test } from "node:test";
import assert from "node:assert/strict";
import { knowledgeArticles } from "./knowledge-content.ts";
import type { KnowledgeArticle } from "./knowledge-content.ts";

// Section IDs the shell (components/knowledge-article-shell.tsx) renders,
// keyed by the content field that produces them. Kept in step with the
// shell's textBlock/listBlock/moduleBlocks calls.
const UNIVERSAL_IDS: Record<string, string> = {
  whatYouWillLearn: "sec-what-you-will-learn",
  intendedAudience: "sec-intended-audience",
  problem: "sec-problem",
  threatModel: "sec-threat-model",
  mainContent: "sec-main-content",
  validationEvidence: "sec-validation",
  limitations: "sec-limitations",
  defensiveRecommendations: "sec-defensive-recommendations",
  keyTakeaways: "sec-key-takeaways",
  references: "sec-references",
};
const MODULE_IDS: Record<string, string> = {
  requirements: "mod-requirements",
  procedure: "mod-procedure",
  validation: "mod-validation",
  rollback: "mod-rollback",
  architecture: "mod-architecture",
  trustBoundaries: "mod-trust-boundaries",
  alternatives: "mod-alternatives",
  tradeoffs: "mod-tradeoffs",
  items: "mod-checklist",
};

const nonEmpty = (v: unknown) => (Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim() !== "" : false);

function renderedIds(article: KnowledgeArticle): Set<string> {
  const ids = new Set<string>();
  const sections = article.sections as Record<string, unknown>;
  for (const [key, id] of Object.entries(UNIVERSAL_IDS)) if (nonEmpty(sections[key])) ids.add(id);
  if (Array.isArray(sections.executiveSummary) && sections.executiveSummary.length > 1) ids.add("sec-executive-summary");
  if (nonEmpty(sections.prerequisites)) ids.add("prerequisites");
  const mod = (article.module ?? {}) as Record<string, unknown>;
  for (const [key, id] of Object.entries(MODULE_IDS)) if (nonEmpty(mod[key])) ids.add(id);
  return ids;
}

test("anchor aliases point at a rendered section and never shadow a live section ID", () => {
  let checked = 0;
  for (const article of knowledgeArticles) {
    const aliases = article.sections.anchorAliases;
    if (!aliases) continue;
    const ids = renderedIds(article);
    for (const [alias, target] of Object.entries(aliases)) {
      checked++;
      assert.match(alias, /^(sec|mod)-[a-z0-9-]+$/, `${article.meta.slug}: alias ${alias} is not a section fragment ID`);
      assert.ok(!ids.has(alias), `${article.meta.slug}: alias ${alias} duplicates a section that still renders`);
      assert.ok(ids.has(target), `${article.meta.slug}: alias ${alias} targets ${target}, which does not render`);
    }
  }
  assert.ok(checked >= 4, "the pilot's four removed fragment IDs are aliased");
});

test("pilot articles keep their removed fragment IDs at the closest surviving section", () => {
  const bySlug = new Map(knowledgeArticles.map((a) => [a.meta.slug, a]));
  assert.deepEqual(bySlug.get("designing-fail-closed-security-automation")?.sections.anchorAliases, {
    "mod-alternatives": "mod-tradeoffs",
    "sec-defensive-recommendations": "sec-main-content",
  });
  assert.deepEqual(bySlug.get("logs-are-not-proof-verifying-automated-actions")?.sections.anchorAliases, {
    "mod-requirements": "prerequisites",
    "sec-defensive-recommendations": "mod-procedure",
  });
});
