import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/site-shell";
import { JsonLd } from "@/components/json-ld";
import { ReadingProgress } from "@/components/reading-progress";
import { KnowledgeArticleShell } from "@/components/knowledge-article-shell";
import { publishedKnowledgeArticles, findKnowledgeArticle } from "@/lib/knowledge-content";
import { knowledgeArticleJsonLd, breadcrumbJsonLd } from "@/lib/json-ld";
import { pageOgImages, pageTwitterImages } from "@/lib/seo";

// Published articles only. Building a path for a drafting article made its
// URL answer HTTP 200 with a "Page not found" body: a soft 404 for search
// engines, and a confirmation to anyone guessing that the draft slug exists.
// Unbuilt slugs fall through to the host's real 404.
export function generateStaticParams() {
  return publishedKnowledgeArticles.map((a) => ({ slug: a.meta.slug }));
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
