import { renderOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from "@/lib/og-image";
import { publishedKnowledgeArticles, findKnowledgeArticle } from "@/lib/knowledge-content";
import { categoryById } from "@/lib/taxonomy";

// Static export requires an explicit opt-in for a generated image route —
// see lib/og-image.tsx's header comment for why this is a route at all
// rather than a plain file. Mirrors this folder's page.tsx: published
// slugs only, so no image exists for a drafting article. The generic
// fallback below remains as a guard.
export const dynamic = "force-static";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export function generateStaticParams() {
  return publishedKnowledgeArticles.map((a) => ({ slug: a.meta.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = findKnowledgeArticle(slug);
  if (!article) {
    return renderOgImage({ kicker: "Knowledge", title: "SecurityCorp" });
  }
  const category = categoryById.get(article.meta.primaryCategory);
  return renderOgImage({
    kicker: category?.name ?? "Knowledge",
    title: article.meta.title,
    badge: article.meta.evidenceState,
  });
}
