import { articles } from "./content.ts";
import { publishedKnowledgeArticles } from "./knowledge-content.ts";

const siteUrl = "https://securitycorp.net";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(date: string): string {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export function buildRssFeed(): string {
  // Sorted newest-first from each article's own real date — no invented
  // publishing cadence, no dates beyond what's already in lib/content.ts.
  const sorted = [...articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // publishedKnowledgeArticles is already filtered to status==="published"
  // and schema-valid (see isPubliclyVisible) — nothing draft, in-review, or
  // retired ever reaches this feed.
  const knowledgeItems = [...publishedKnowledgeArticles].sort(
    (a, b) => new Date(b.meta.publishedAt ?? 0).getTime() - new Date(a.meta.publishedAt ?? 0).getTime(),
  );

  const newestDate = [sorted[0]?.date, knowledgeItems[0]?.meta.publishedAt].filter((d): d is string => Boolean(d)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  const lastBuildDate = newestDate ? toRfc822(newestDate) : new Date().toUTCString();

  const guideItems = sorted
    .map((a) => {
      const url = `${siteUrl}/guides/${a.slug}/`;
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(a.dek)}</description>
      <pubDate>${toRfc822(a.date)}</pubDate>
    </item>`;
    });

  const knowledgeRssItems = knowledgeItems.map((a) => {
    const url = `${siteUrl}/knowledge/${a.meta.slug}/`;
    return `    <item>
      <title>${escapeXml(a.meta.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(a.meta.summary)}</description>
      <pubDate>${toRfc822(a.meta.publishedAt ?? new Date().toISOString())}</pubDate>
    </item>`;
  });

  const items = [...guideItems, ...knowledgeRssItems].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>SecurityCorp</title>
    <link>${siteUrl}/</link>
    <description>Practical cybersecurity guides, hands-on lab projects, and field notes by security engineer Ravi Teja Thota.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
