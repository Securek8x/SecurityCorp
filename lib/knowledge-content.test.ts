import { test } from "node:test";
import assert from "node:assert/strict";
import { findKnowledgeArticle, knowledgeArticles, publishedKnowledgeArticles } from "./knowledge-content.ts";
import { validateArticleMeta, validateCatalogIntegrity } from "./knowledge-schema.ts";
import { validateArticleClaims } from "./claim-ledger.ts";
import { validateFreshness } from "./content-freshness.ts";

test("the approved secure-code-review checklist is the first published knowledge article", () => {
  const article = findKnowledgeArticle("practical-secure-code-review-checklist");
  assert.ok(article);
  assert.equal(article.meta.status, "published");
  assert.equal(article.meta.contentType, "checklist");
  assert.equal(article.meta.evidenceState, "UNVERIFIED");
  assert.deepEqual(article.meta.tags, ["secure-code-review", "application-security", "threat-modeling"]);
  assert.deepEqual(validateArticleMeta(article.meta), []);
  assert.deepEqual(validateCatalogIntegrity(knowledgeArticles.map((entry) => entry.meta)), []);
  assert.ok(publishedKnowledgeArticles.map((entry) => entry.meta.slug).includes("practical-secure-code-review-checklist"));
});

test("every article's claim ledger (if any) and every [[claim:ID]] reference resolve cleanly", () => {
  for (const article of knowledgeArticles) {
    const errors = validateArticleClaims(article.sections, article.claims);
    assert.deepEqual(errors, [], `${article.meta.slug}: ${errors.join("; ")}`);
  }
});

test("every article's freshness metadata (if any) is internally valid", () => {
  for (const article of knowledgeArticles) {
    if (!article.freshness) continue;
    const errors = validateFreshness(
      article.freshness,
      article.meta.lastReviewedAt,
      article.meta.publishedAt,
      article.meta.status,
    );
    assert.deepEqual(errors, [], `${article.meta.slug}: ${errors.join("; ")}`);
  }
});
