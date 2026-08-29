// Release blocker for the static-export placeholder in lib/knowledge-content.ts.
//
// STATIC_EXPORT_PLACEHOLDER exists only so Next's static export has at
// least one /knowledge/[slug] path to generate before any real article is
// published (a dynamic route with zero generateStaticParams entries fails
// the export outright). It renders as a plain 404 and is excluded from the
// catalog, sitemap, RSS, and structured data — but a statically generated
// 404-shaped document sitting at a real URL is still a soft-404 risk if it
// ever reaches production. It is approved for local development only.
//
// This script is wired into CI (see .github/workflows/ci.yml) as a required
// check on main, so it blocks merge/deploy until the placeholder is removed
// or replaced by the first policy-approved, published article.
import { knowledgeArticles, publishedKnowledgeArticles } from "../lib/knowledge-content.ts";

const PLACEHOLDER_SLUG = "__static-export-placeholder";
const hasPlaceholder = knowledgeArticles.some((a) => a.meta.slug === PLACEHOLDER_SLUG);

if (hasPlaceholder && publishedKnowledgeArticles.length === 0) {
  console.error(
    [
      "[release-guard] BLOCKED: STATIC_EXPORT_PLACEHOLDER is still the only entry in lib/knowledge-content.ts and no real article has been published yet.",
      "",
      "This placeholder is approved for local development only (see docs/knowledge-base.md). It must not reach production.",
      "",
      "Fix: publish the first policy-approved knowledge article (status: \"published\", both privacyReview and technicalReview approved) and remove STATIC_EXPORT_PLACEHOLDER from lib/knowledge-content.ts, then re-run this check.",
    ].join("\n"),
  );
  process.exit(1);
}

console.log("[release-guard] OK: real published knowledge content exists, placeholder-only export is not present.");
