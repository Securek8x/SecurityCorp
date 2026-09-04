import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/site-shell";
import { JsonLd } from "@/components/json-ld";
import { ReadingProgress } from "@/components/reading-progress";
import { KnowledgeArticleShell } from "@/components/knowledge-article-shell";
import { knowledgeArticles, findKnowledgeArticle } from "@/lib/knowledge-content";
import { knowledgeArticleJsonLd, breadcrumbJsonLd } from "@/lib/json-ld";
import { pageOgImages, pageTwitterImages } from "@/lib/seo";

// Sourced from the full (not just published) list — see the
// STATIC_EXPORT_PLACEHOLDER comment in lib/knowledge-content.ts for why:
// static export requires at least one path here. findKnowledgeArticle
// below only ever resolves published articles, so anything non-published,
// including that placeholder, renders as a 404, never real content.
export function generateStaticParams() {
  return knowledgeArticles.map((a) => ({ slug: a.meta.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = findKnowledgeArticle(slug);
  if (!article) return {};
  const { title, summary } = article.meta;
  return {
    title,
    description: summary,
    alternates: { canonical: `/knowledge/${article.meta.slug}` },
    openGraph: {
      type: "article",
      url: `https://securitycorp.net/knowledge/${article.meta.slug}`,
      siteName: "SecurityCorp",
      title: `${title} | SecurityCorp`,
      description: summary,
      images: pageOgImages(`/knowledge/${article.meta.slug}`, `${title} | SecurityCorp`),
    },
    twitter: { card: "summary_large_image", title: `${title} | SecurityCorp`, description: summary, images: pageTwitterImages(`/knowledge/${article.meta.slug}`, `${title} | SecurityCorp`) },
  };
}

export default async function KnowledgeArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = findKnowledgeArticle(slug);
  if (!article) notFound();

  return (
    <Shell current="/topics">
      <JsonLd data={knowledgeArticleJsonLd(article.meta)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://securitycorp.net/" },
          { name: "Knowledge", url: "https://securitycorp.net/knowledge/" },
          { name: article.meta.title, url: `https://securitycorp.net/knowledge/${article.meta.slug}/` },
        ])}
      />
      <ReadingProgress />
      <main className="article-page">
        <KnowledgeArticleShell article={article} />
      </main>
    </Shell>
  );
}
