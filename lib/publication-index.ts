// One reading list across the two content collections (redesign, Bead
// securitycorp-source-wo8.4): the original field guides (lib/content.ts) and
// the published knowledge articles (lib/knowledge-content.ts). Only
// publicly visible knowledge articles are included — drafting, in-review,
// and retired content never reaches this list.
import type { IsoDate } from "./content-dates.ts";
import { articles } from "./content.ts";
import { publishedKnowledgeArticles } from "./knowledge-content.ts";
import { pillarById } from "./taxonomy.ts";

export type PublicationEntry = {
  href: string;
  title: string;
  summary: string;
  /** Reader-facing topic: the pillar for knowledge articles, the category for field guides. */
  topic: string;
  /** Format label, e.g. "Guide", "Checklist", "Deep dive". */
  format: string;
  level: string;
  readMinutes: number;
  publishedAt: IsoDate;
};

const FORMAT: Record<string, string> = {
  guide: "Guide", lab: "Lab", detection: "Detection", playbook: "Playbook", "field-note": "Field note",
  "deep-dive": "Deep dive", checklist: "Checklist", "case-study": "Case study", "tool-review": "Tool review",
};

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function publicationEntries(): PublicationEntry[] {
  const guides: PublicationEntry[] = articles.map((a) => ({
    href: `/guides/${a.slug}`,
    title: a.title,
    summary: a.dek,
    topic: a.category,
    format: "Field guide",
    level: a.level,
    readMinutes: Number.parseInt(a.read, 10) || 0,
    publishedAt: a.publishedAt,
  }));
  const knowledge: PublicationEntry[] = publishedKnowledgeArticles
    .filter((a) => Boolean(a.meta.publishedAt))
    .map((a) => ({
      href: `/knowledge/${a.meta.slug}`,
      title: a.meta.title,
      summary: a.meta.summary,
      topic: pillarById.get(a.meta.pillar)?.name ?? "",
      format: FORMAT[a.meta.contentType] ?? capitalize(a.meta.contentType),
      level: capitalize(a.meta.difficulty),
      readMinutes: a.meta.estimatedReadingMinutes,
      publishedAt: a.meta.publishedAt as IsoDate,
    }));
  // Newest first; ties keep a stable, title-ordered sequence.
  return [...guides, ...knowledge].sort((x, y) => (x.publishedAt === y.publishedAt ? x.title.localeCompare(y.title) : x.publishedAt < y.publishedAt ? 1 : -1));
}

export function latestEntries(count: number): PublicationEntry[] {
  return publicationEntries().slice(0, count);
}
