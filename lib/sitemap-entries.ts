// Sitemap entry construction, extracted from app/sitemap.ts so it can be
// imported both by that Next.js route (which needs the "@/" alias Next's
// bundler resolves) and by scripts/check-route-integrity.ts, which runs
// under plain `node` with no bundler and therefore cannot resolve "@/"
// imports at all — only relative imports work there. This file uses only
// relative imports for exactly that reason; app/sitemap.ts stays a thin
// wrapper so there is one source of truth for what belongs in the sitemap.
import type { MetadataRoute } from "next";
import { articles, projects } from "./content.ts";
import { pillars, categories } from "./taxonomy.ts";
import { publishedKnowledgeArticles } from "./knowledge-content.ts";

const SITE_URL = "https://securitycorp.net";

function toDate(date: string): Date {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function buildSitemapEntries(): MetadataRoute.Sitemap {
  const latestArticleDate = articles.reduce(
    (latest, a) => {
      const d = toDate(a.date);
      return d > latest ? d : latest;
    },
    toDate(articles[0]?.date ?? new Date().toISOString()),
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: latestArticleDate, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/guides/`, lastModified: latestArticleDate, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/projects/`, lastModified: latestArticleDate, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/about/`, lastModified: latestArticleDate, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/topics/`, lastModified: latestArticleDate, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/knowledge/`, lastModified: latestArticleDate, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/learning-paths/`, lastModified: latestArticleDate, changeFrequency: "monthly", priority: 0.4 },
  ];

  const pillarRoutes: MetadataRoute.Sitemap = pillars.map((p) => ({
    url: `${SITE_URL}/topics/${p.id}/`,
    lastModified: latestArticleDate,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/topics/${c.pillar}/${c.id}/`,
    lastModified: latestArticleDate,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/guides/${article.slug}/`,
    lastModified: toDate(article.date),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  // Only publishedKnowledgeArticles (already status==="published" and
  // schema-valid) ever reach the sitemap — draft/review-stage entries in
  // knowledgeArticles are excluded upstream, not filtered here.
  const knowledgeRoutes: MetadataRoute.Sitemap = publishedKnowledgeArticles.map((a) => ({
    url: `${SITE_URL}/knowledge/${a.meta.slug}/`,
    lastModified: toDate(a.meta.updatedAt ?? a.meta.publishedAt ?? new Date().toISOString()),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${SITE_URL}/projects/${p.slug}/`,
      lastModified: latestArticleDate,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...pillarRoutes, ...categoryRoutes, ...articleRoutes, ...knowledgeRoutes, ...projectRoutes];
}
