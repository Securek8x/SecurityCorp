import { renderOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from "@/lib/og-image";
import { projects } from "@/lib/content";

// See app/knowledge/[slug]/opengraph-image.tsx for why this route shape
// (force-static + generateStaticParams) is required under static export.
export const dynamic = "force-static";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export function generateStaticParams() {
  return projects.filter((p) => p.slug).map((p) => ({ slug: p.slug as string }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) {
    return renderOgImage({ kicker: "Projects", title: "SecurityCorp" });
  }
  return renderOgImage({ kicker: "Project", title: project.title, badge: project.status });
}
