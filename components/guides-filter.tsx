"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Article } from "@/lib/content";

const FILTERS = ["All", "Detection Engineering", "Container Security", "Home Lab Security", "Foundational", "Intermediate"];

export function GuidesFilter({ articles }: { articles: Article[] }) {
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    if (filter === "All") return articles;
    return articles.filter((a) => a.category === filter || a.level === filter);
  }, [articles, filter]);

  return (
    <>
      <div role="group" aria-label="Filter guides" className="guides-filter">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className="filter-chip"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <span className="filter-count" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "guide" : "guides"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="filter-empty">No guides match that filter yet — check back as the publication grows.</p>
      ) : (
        <section className="guide-index">
          {filtered.map((a) => (
            <Link href={`/guides/${a.slug}`} className="guide-card" key={a.slug}>
              <span className="article-no">{a.number}</span>
              <div className="article-meta">
                <span>{a.category}</span>
                <span>{a.level}</span>
              </div>
              <h2>{a.title}</h2>
              <p>{a.dek}</p>
              <div className="guide-foot">
                <span>{a.date} · {a.read} read</span>
                <ArrowUpRight aria-hidden="true" />
              </div>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
