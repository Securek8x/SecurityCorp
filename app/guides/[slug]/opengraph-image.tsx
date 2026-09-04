import { renderOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from "@/lib/og-image";
import { articles } from "@/lib/content";

// See app/knowledge/[slug]/opengraph-image.tsx for why this route shape
// (force-static + generateStaticParams) is required under static export.
export const dynamic = "force-static";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) {
    return renderOgImage({ kicker: "Guides", title: "SecurityCorp" });
  }
  return renderOgImage({ kicker: article.category, title: article.title, badge: article.level });
}
