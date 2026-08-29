import type { MetadataRoute } from "next";
import { articles, projects } from "@/lib/content";
import { pillars, categories } from "@/lib/taxonomy";
import { publishedKnowledgeArticles } from "@/lib/knowledge-content";

export const dynamic = "force-static";

const siteUrl = "https://securitycorp.net";

function toDate(date: string): Date {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const latestArticleDate = articles.reduce(
    (latest, a) => {
      const d = toDate(a.date);
      return d > latest ? d : latest;
    },
    toDate(articles[0]?.date ?? new Date().toISOString()),
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: latestArticleDate,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/guides/`,
      lastModified: latestArticleDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/projects/`,
      lastModified: latestArticleDate,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/about/`,
      lastModified: latestArticleDate,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/topics/`,
      lastModified: latestArticleDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/knowledge/`,
      lastModified: latestArticleDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/learning-paths/`,
      lastModified: latestArticleDate,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const pillarRoutes: MetadataRoute.Sitemap = pillars.map((p) => ({
    url: `${siteUrl}/topics/${p.id}/`,
    lastModified: latestArticleDate,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteUrl}/topics/${c.pillar}/${c.id}/`,
    lastModified: latestArticleDate,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/guides/${article.slug}/`,
    lastModified: toDate(article.date),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  // Only publishedKnowledgeArticles (already status==="published" and
  // schema-valid) ever reach the sitemap — draft/review-stage entries in
  // knowledgeArticles are excluded upstream, not filtered here.
  const knowledgeRoutes: MetadataRoute.Sitemap = publishedKnowledgeArticles.map((a) => ({
    url: `${siteUrl}/knowledge/${a.meta.slug}/`,
    lastModified: toDate(a.meta.updatedAt ?? a.meta.publishedAt ?? new Date().toISOString()),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${siteUrl}/projects/${p.slug}/`,
      lastModified: latestArticleDate,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...pillarRoutes, ...categoryRoutes, ...articleRoutes, ...knowledgeRoutes, ...projectRoutes];
}
