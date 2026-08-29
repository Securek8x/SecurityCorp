"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import type { KnowledgeCatalogCard } from "@/lib/knowledge-catalog";
import { pillars, categoryById } from "@/lib/taxonomy";
import type { ContentType, Difficulty, EvidenceState, Audience } from "@/lib/knowledge-schema";
import { CONTENT_TYPES, DIFFICULTIES, EVIDENCE_STATES, AUDIENCES } from "@/lib/knowledge-schema";
import { tagLabel } from "@/lib/knowledge-tags";

const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  guide: "Guide",
  lab: "Lab",
  detection: "Detection",
  playbook: "Playbook",
  "field-note": "Field Note",
  "deep-dive": "Deep Dive",
  checklist: "Checklist",
  "case-study": "Case Study",
  "tool-review": "Tool Review",
};
const EVIDENCE_LABEL: Record<EvidenceState, string> = {
  VALIDATED: "VALIDATED",
  "DESIGN ONLY": "DESIGN ONLY",
  UNVERIFIED: "UNVERIFIED",
};
const AUDIENCE_LABEL: Record<Audience, string> = {
  beginner: "Beginner",
  practitioner: "Practitioner",
  "security-engineer": "Security Engineer",
  recruiter: "Recruiter",
  "career-changer": "Career Changer",
};

type Filters = {
  query: string;
  pillar: string | null;
  category: string | null;
  contentType: ContentType | null;
  difficulty: Difficulty | null;
  audience: Audience | null;
  evidenceState: EvidenceState | null;
  tag: string | null;
};

const EMPTY_FILTERS: Filters = { query: "", pillar: null, category: null, contentType: null, difficulty: null, audience: null, evidenceState: null, tag: null };

/**
 * Filtering runs entirely client-side over the (already published-only,
 * card-shaped) data passed in — no client-side dependency beyond React
 * state, no full article bodies ever reach the browser. Usable without a
 * pointer: every control is a real <button>/<select>/<input>, so keyboard
 * and screen-reader users get the same filtering as a mouse user.
 */
export function KnowledgeCatalogFilter({ cards }: { cards: KnowledgeCatalogCard[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);

  const tags = useMemo(() => [...new Set(cards.flatMap((c) => c.tags))].sort(), [cards]);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return cards.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q) && !c.summary.toLowerCase().includes(q)) return false;
      if (filters.pillar && c.pillar !== filters.pillar) return false;
      if (filters.category && c.category !== filters.category) return false;
      if (filters.contentType && c.contentType !== filters.contentType) return false;
      if (filters.difficulty && c.difficulty !== filters.difficulty) return false;
      if (filters.audience && !c.audience.includes(filters.audience)) return false;
      if (filters.evidenceState && c.evidenceState !== filters.evidenceState) return false;
      if (filters.tag && !c.tags.includes(filters.tag)) return false;
      return true;
    });
  }, [cards, filters]);

  const activeChips = Object.entries(filters).filter(([key, value]) => key !== "query" && value !== null) as [keyof Filters, string][];
  const clearOne = (key: keyof Filters) => setFilters((f) => ({ ...f, [key]: key === "query" ? "" : null }));
  const clearAll = () => setFilters(EMPTY_FILTERS);

  return (
    <div className="knowledge-catalog">
      <div className="knowledge-catalog-search">
        <label htmlFor="knowledge-search" className="sr-only">
          Search published content
        </label>
        <input
          id="knowledge-search"
          type="search"
          placeholder="Search title or summary…"
          value={filters.query}
          onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
        />
      </div>

      <div role="group" aria-label="Filter by pillar" className="knowledge-catalog-pillars">
        <button type="button" className="filter-chip" aria-pressed={filters.pillar === null} onClick={() => setFilters((f) => ({ ...f, pillar: null, category: null }))}>
          All pillars
        </button>
        {pillars.map((p) => (
          <button key={p.id} type="button" className="filter-chip" aria-pressed={filters.pillar === p.id} onClick={() => setFilters((f) => ({ ...f, pillar: p.id, category: null }))}>
            {p.name}
          </button>
        ))}
      </div>

      <button type="button" className="filter-chip knowledge-catalog-toggle" aria-expanded={panelOpen} aria-controls="knowledge-catalog-panel" onClick={() => setPanelOpen((v) => !v)}>
        More filters
      </button>

      <div id="knowledge-catalog-panel" hidden={!panelOpen} className="knowledge-catalog-panel">
        <label>
          Content type
          <select value={filters.contentType ?? ""} onChange={(e) => setFilters((f) => ({ ...f, contentType: (e.target.value || null) as ContentType | null }))}>
            <option value="">Any</option>
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {CONTENT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Difficulty
          <select value={filters.difficulty ?? ""} onChange={(e) => setFilters((f) => ({ ...f, difficulty: (e.target.value || null) as Difficulty | null }))}>
            <option value="">Any</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label>
          Audience
          <select value={filters.audience ?? ""} onChange={(e) => setFilters((f) => ({ ...f, audience: (e.target.value || null) as Audience | null }))}>
            <option value="">Any</option>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Evidence state
          <select value={filters.evidenceState ?? ""} onChange={(e) => setFilters((f) => ({ ...f, evidenceState: (e.target.value || null) as EvidenceState | null }))}>
            <option value="">Any</option>
            {EVIDENCE_STATES.map((e) => (
              <option key={e} value={e}>
                {EVIDENCE_LABEL[e]}
              </option>
            ))}
          </select>
        </label>
        {tags.length > 0 && (
          <label>
            Tag
            <select value={filters.tag ?? ""} onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value || null }))}>
              <option value="">Any</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {tagLabel(t)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="knowledge-catalog-active" aria-label="Active filters">
          {activeChips.map(([key, value]) => (
            <button key={key} type="button" className="filter-chip" onClick={() => clearOne(key)}>
              {key === "tag" ? tagLabel(value) : value} <X size={12} aria-hidden="true" />
            </button>
          ))}
          <button type="button" className="filter-chip" onClick={clearAll}>
            Clear all
          </button>
        </div>
      )}

      <p className="filter-count" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "result" : "results"}
      </p>

      {filtered.length === 0 ? (
        <p className="filter-empty">No published content matches yet — check back as the catalog grows.</p>
      ) : (
        <section className="guide-index">
          {filtered.map((c) => (
            <Link href={`/knowledge/${c.slug}/`} className="guide-card record-trace clip-corner-sm" key={c.slug}>
              <div className="article-meta">
                <span>{CONTENT_TYPE_LABEL[c.contentType]}</span>
                <span>{categoryById.get(c.category)?.name}</span>
              </div>
              <h2>{c.title}</h2>
              <p>{c.summary}</p>
              <div className="guide-foot">
                <span>
                  {c.difficulty} · {c.estimatedReadingMinutes} min · {EVIDENCE_LABEL[c.evidenceState]}
                </span>
                <ArrowUpRight aria-hidden="true" />
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
