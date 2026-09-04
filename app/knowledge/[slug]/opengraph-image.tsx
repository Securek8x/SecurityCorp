import { renderOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from "@/lib/og-image";
import { knowledgeArticles, findKnowledgeArticle } from "@/lib/knowledge-content";
import { categoryById } from "@/lib/taxonomy";

// Static export requires an explicit opt-in for a generated image route —
// see lib/og-image.tsx's header comment for why this is a route at all
// rather than a plain file. Mirrors this folder's page.tsx: enumerate
// every known slug (including non-published) for static-export technical
// reasons, then render a safe generic fallback for anything that isn't
// actually a real, published article, the same way page.tsx 404s it.
export const dynamic = "force-static";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export function generateStaticParams() {
  return knowledgeArticles.map((a) => ({ slug: a.meta.slug }));
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
