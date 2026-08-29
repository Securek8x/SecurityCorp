import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { knowledgeArticles } from "./knowledge-content.ts";

const DRAFTS_DIRECTORY = join(process.cwd(), "content", "drafts");

/** Names of topic directories that must stay out of the published registry. */
export function draftSlugs(): string[] {
  return readdirSync(DRAFTS_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/** Source-level guard: draft directories may not share a registered article slug. */
export function validateDraftIsolation(): string[] {
  const registered = new Set(knowledgeArticles.map((article) => article.meta.slug));
  return draftSlugs()
    .filter((slug) => registered.has(slug))
    .map((slug) => `draft slug "${slug}" appears in lib/knowledge-content.ts`);
}

/** Build-level guard used after `next build` creates the static `out` directory. */
export function validateDraftsAbsentFromStaticOutput(outputDirectory = join(process.cwd(), "out")): string[] {
  if (!existsSync(outputDirectory)) return [`static output directory not found: ${outputDirectory}`];
  return draftSlugs()
    .filter((slug) => existsSync(join(outputDirectory, "knowledge", slug, "index.html")))
    .map((slug) => `draft slug "${slug}" generated a production route`);
}
