import { articles } from "@/lib/content";

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
  const lastBuildDate = sorted.length > 0 ? toRfc822(sorted[0].date) : new Date().toUTCString();

  const items = sorted
    .map((a) => {
      const url = `${siteUrl}/guides/${a.slug}/`;
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(a.dek)}</description>
      <pubDate>${toRfc822(a.date)}</pubDate>
    </item>`;
    })
    .join("\n");

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
