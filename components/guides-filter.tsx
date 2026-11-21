"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { PublicationEntry } from "@/lib/publication-index";
import { ContentDate } from "@/components/content-date";

/** Scannable guide index (redesign, Bead securitycorp-source-wo8.4): one list,
 * newest first, filterable by topic. Without JavaScript every entry renders. */
export function GuidesFilter({ entries }: { entries: PublicationEntry[] }) {
  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(e.topic, (counts.get(e.topic) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
  }, [entries]);
  const [topic, setTopic] = useState("All");
  const shown = topic === "All" ? entries : entries.filter((e) => e.topic === topic);

  return (
    <>
      <div role="group" aria-label="Filter guides by topic" className="pub-filter">
        {["All", ...topics].map((t) => (
          <button key={t} type="button" aria-pressed={topic === t} onClick={() => setTopic(t)}>
            {t}
          </button>
        ))}
        <span className="filter-count" aria-live="polite">
          {shown.length} {shown.length === 1 ? "guide" : "guides"}
        </span>
      </div>
      <ul className="pub-list">
        {shown.map((e) => (
          <li key={e.href}>
            <Link href={e.href} className="pub-entry">
              <h2>{e.title}</h2>
              <p>{e.summary}</p>
              <span className="pub-meta">
                <span>{e.topic}</span>
                <span>{e.format}</span>
                <span>{e.level}</span>
                <span>{e.readMinutes} min read</span>
              </span>
              <ContentDate value={e.publishedAt} className="pub-date" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
