import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/site-shell";
import { KnowledgeCatalogFilter } from "@/components/knowledge-catalog-filter";
import { categories, categoryById, categoriesForPillar, pillarById, type CategoryId, type PillarId } from "@/lib/taxonomy";
import { cardsForCategory } from "@/lib/knowledge-catalog";
import { ogImages, twitterImages } from "@/lib/seo";

export function generateStaticParams() {
  return categories.map((c) => ({ pillar: c.pillar, category: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ pillar: string; category: string }> }): Promise<Metadata> {
  const { pillar: pillarParam, category: categoryParam } = await params;
  const category = categoryById.get(categoryParam as CategoryId);
  if (!category || category.pillar !== pillarParam) return {};
  const description = category.scope;
  return {
    title: category.name,
    description,
    alternates: { canonical: `/topics/${category.pillar}/${category.id}` },
    openGraph: { type: "website", url: `https://securitycorp.net/topics/${category.pillar}/${category.id}`, siteName: "SecurityCorp", title: `${category.name} | SecurityCorp`, description, images: ogImages(`${category.name} | SecurityCorp`) },
    twitter: { card: "summary_large_image", title: `${category.name} | SecurityCorp`, description, images: twitterImages(`${category.name} | SecurityCorp`) },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ pillar: string; category: string }> }) {
  const { pillar: pillarParam, category: categoryParam } = await params;
  const category = categoryById.get(categoryParam as CategoryId);
  if (!category || category.pillar !== pillarParam) notFound();
  const pillar = pillarById.get(category.pillar as PillarId);
  const related = categoriesForPillar(category.pillar).filter((c) => c.id !== category.id);
  const cards = cardsForCategory(category.id);

  return (
    <Shell current="/topics">
      <main className="inner-page">
        <section className="page-intro grid-lines">
          <p className="section-label">
            <Link href="/topics/">Topics</Link> / <Link href={`/topics/${category.pillar}/`}>{pillar?.name}</Link> / {category.name}
          </p>
          <h1>{category.name}</h1>
          <p>{category.scope}</p>
          <p>
            <strong>Intended audience:</strong> {category.audience}
          </p>
        </section>

        {cards.length > 0 ? (
          <KnowledgeCatalogFilter cards={cards} />
        ) : (
          <p className="filter-empty">No published content in this category yet — check back as the catalog grows.</p>
        )}

        {related.length > 0 && (
          <section>
            <p className="section-label">Related categories</p>
            <div className="tags">
              {related.map((c) => (
                <Link key={c.id} href={`/topics/${c.pillar}/${c.id}/`}>
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </Shell>
  );
}
