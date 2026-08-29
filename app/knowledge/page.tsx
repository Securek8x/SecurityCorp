import type { Metadata } from "next";
import { Shell } from "@/components/site-shell";
import { KnowledgeCatalogFilter } from "@/components/knowledge-catalog-filter";
import { allCatalogCards } from "@/lib/knowledge-catalog";
import { ogImages, twitterImages } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Knowledge Catalog",
  description: "Browse every published SecurityCorp guide, lab, detection, and field note by pillar, category, content type, difficulty, and evidence state.",
  alternates: { canonical: "/knowledge" },
  openGraph: { type: "website", url: "https://securitycorp.net/knowledge", siteName: "SecurityCorp", title: "Knowledge Catalog | SecurityCorp", description: "Browse every published SecurityCorp guide, lab, detection, and field note.", images: ogImages("Knowledge Catalog | SecurityCorp") },
  twitter: { card: "summary_large_image", title: "Knowledge Catalog | SecurityCorp", description: "Browse every published SecurityCorp guide, lab, detection, and field note.", images: twitterImages("Knowledge Catalog | SecurityCorp") },
};

export default function KnowledgeCatalogPage() {
  return (
    <Shell current="/topics">
      <main className="inner-page">
        <section className="page-intro grid-lines">
          <p className="section-label">Full catalog</p>
          <h1>
            Every published<br />
            <em>knowledge-base article.</em>
          </h1>
          <p>Search or filter across all six pillars at once. Draft, in-review, and retired content never appears here.</p>
        </section>
        <KnowledgeCatalogFilter cards={allCatalogCards()} />
      </main>
    </Shell>
  );
}
