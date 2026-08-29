import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/site-shell";
import { pillars, categoriesForPillar, pillarById, type PillarId } from "@/lib/taxonomy";
import { cardsForPillar, publishedCountForCategory } from "@/lib/knowledge-catalog";
import { ogImages, twitterImages } from "@/lib/seo";

export function generateStaticParams() {
  return pillars.map((p) => ({ pillar: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ pillar: string }> }): Promise<Metadata> {
  const { pillar: pillarParam } = await params;
  const pillar = pillarById.get(pillarParam as PillarId);
  if (!pillar) return {};
  const description = pillar.description;
  return {
    title: pillar.name,
    description,
    alternates: { canonical: `/topics/${pillar.id}` },
    openGraph: { type: "website", url: `https://securitycorp.net/topics/${pillar.id}`, siteName: "SecurityCorp", title: `${pillar.name} | SecurityCorp`, description, images: ogImages(`${pillar.name} | SecurityCorp`) },
    twitter: { card: "summary_large_image", title: `${pillar.name} | SecurityCorp`, description, images: twitterImages(`${pillar.name} | SecurityCorp`) },
  };
}

export default async function PillarPage({ params }: { params: Promise<{ pillar: string }> }) {
  const { pillar: pillarParam } = await params;
  const pillar = pillarById.get(pillarParam as PillarId);
  if (!pillar) notFound();

  const categories = categoriesForPillar(pillar.id);
  const featured = cardsForPillar(pillar.id).slice(0, 3);

  return (
    <Shell current="/topics">
      <main className="inner-page">
        <section className="page-intro grid-lines">
          <p className="section-label">
            <Link href="/topics/">Topics</Link> / {pillar.name}
          </p>
          <h1>{pillar.name}</h1>
          <p>{pillar.description}</p>
        </section>

        <section className="guide-index">
          {categories.map((c) => {
            const count = publishedCountForCategory(c.id);
            return (
              <Link href={`/topics/${pillar.id}/${c.id}/`} className="guide-card record-trace clip-corner-sm" key={c.id}>
                <h2>{c.name}</h2>
                <p>{c.scope}</p>
                <div className="guide-foot">
                  <span>
                    {count} published {count === 1 ? "article" : "articles"}
                  </span>
                  <ArrowUpRight aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </section>

        {featured.length > 0 && (
          <section>
            <p className="section-label">Latest published content</p>
            <div className="guide-index">
              {featured.map((c) => (
                <Link href={`/knowledge/${c.slug}/`} className="guide-card record-trace clip-corner-sm" key={c.slug}>
                  <h2>{c.title}</h2>
                  <p>{c.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </Shell>
  );
}
