import { profile } from "@/lib/profile";
import type { Article } from "@/lib/content";

const siteUrl = "https://securitycorp.net";

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SecurityCorp",
    url: siteUrl,
    description:
      "Practical cybersecurity guides, hands-on lab projects, and field notes by security engineer Ravi Teja Thota.",
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: `${siteUrl}/about/`,
    jobTitle: profile.role,
    // Only the confirmed public profile link goes here — no invented
    // LinkedIn/X/email accounts.
    sameAs: ["https://github.com/Securek8x"],
  };
}

export function articleJsonLd(article: Article) {
  const url = `${siteUrl}/guides/${article.slug}/`;
  const published = new Date(article.date);
  const publishedIso = Number.isNaN(published.getTime()) ? undefined : published.toISOString();
  const reviewed = new Date(article.lastReviewed);
  const reviewedIso = Number.isNaN(reviewed.getTime()) ? undefined : reviewed.toISOString();
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: article.title,
    description: article.dek,
    url,
    mainEntityOfPage: url,
    datePublished: publishedIso,
    dateModified: reviewedIso ?? publishedIso,
    author: { "@type": "Person", name: "Ravi Teja Thota", url: `${siteUrl}/about/` },
    publisher: { "@type": "Organization", name: "SecurityCorp", url: siteUrl },
    image: `${siteUrl}/opengraph-image.png`,
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
