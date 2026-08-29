import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/site-shell";
import { pillars, categoriesForPillar } from "@/lib/taxonomy";
import { publishedCountForPillar } from "@/lib/knowledge-catalog";
import { ogImages, twitterImages } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Topics",
  description: "Six cyber-defense pillars organizing SecurityCorp's published guides, labs, and field notes.",
  alternates: { canonical: "/topics" },
  openGraph: { type: "website", url: "https://securitycorp.net/topics", siteName: "SecurityCorp", title: "Topics | SecurityCorp", description: "Six cyber-defense pillars organizing SecurityCorp's published guides, labs, and field notes.", images: ogImages("Topics | SecurityCorp") },
  twitter: { card: "summary_large_image", title: "Topics | SecurityCorp", description: "Six cyber-defense pillars organizing SecurityCorp's published guides, labs, and field notes.", images: twitterImages("Topics | SecurityCorp") },
};

export default function Topics() {
  return (
    <Shell current="/topics">
      <main className="inner-page">
        <section className="page-intro grid-lines">
          <p className="section-label">Knowledge base / six pillars</p>
          <h1>
            Cyber-defense topics,<br />
            <em>organized by discipline.</em>
          </h1>
          <p>Every published guide, lab, and field note is filed under one of these six pillars. Published counts below reflect only reviewed, published content.</p>
          <p>
            <Link href="/knowledge/" className="text-link">
              Browse all knowledge <ArrowUpRight aria-hidden="true" size={14} />
            </Link>
          </p>
        </section>
        <section className="guide-index">
          {pillars.map((p) => {
            const count = publishedCountForPillar(p.id);
            const cats = categoriesForPillar(p.id);
            return (
              <Link href={`/topics/${p.id}/`} className="guide-card record-trace clip-corner" key={p.id}>
                <h2>{p.name}</h2>
                <p>{p.description}</p>
                <div className="tags">
                  {cats.map((c) => (
                    <span key={c.id}>{c.name}</span>
                  ))}
                </div>
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
      </main>
    </Shell>
  );
}
