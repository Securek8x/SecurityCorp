import { test } from "node:test";
import assert from "node:assert/strict";
import { findKnowledgeArticle, knowledgeArticles, publishedKnowledgeArticles } from "./knowledge-content.ts";
import { validateArticleMeta, validateCatalogIntegrity } from "./knowledge-schema.ts";

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
