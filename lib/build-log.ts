import { formatDisplayDate, type IsoDate } from "./content-dates.ts";
import { articles } from "./content.ts";

// Build log (s41.20.12): what changed, and when. Event type is its own
// vocabulary — never an evidence maturity (Design/Documented/Validated live
// on project records only) and never a test outcome.
export const BUILD_LOG_EVENT_TYPES = ["publication", "plan"] as const;
export type BuildLogEventType = (typeof BUILD_LOG_EVENT_TYPES)[number];

export const buildLogEventLabel: Record<BuildLogEventType, string> = {
  publication: "Publication",
  plan: "Plan",
};

/** A dated event stores a canonical day; an undated plan stores only the
 * year it is aimed at — never an invented day. */
export type BuildLogDate = { precision: "day"; value: IsoDate } | { precision: "year"; value: number };

export function formatBuildLogDate(date: BuildLogDate): string {
  return date.precision === "day" ? formatDisplayDate(date.value) : String(date.value);
}

export type BuildLogEntry = {
  date: BuildLogDate;
  type: BuildLogEventType;
  /** What changed, in one line. */
  title: string;
  href?: string;
};

type BuildLogSource =
  /** Resolved from the guide record: its publishedAt and title. */
  | { type: "publication"; guideSlug: string }
  | { type: "plan"; date: BuildLogDate; title: string; href?: string };

const sources: BuildLogSource[] = [
  { type: "publication", guideSlug: "malware-gate-for-automated-downloads" },
  { type: "publication", guideSlug: "vpn-bound-container-stack" },
  { type: "publication", guideSlug: "reverse-proxy-home-lab" },
  {
    type: "plan",
    date: { precision: "year", value: 2026 },
    title: "Kubernetes parity migration plan — in design, no production cutover yet",
    href: "/projects",
  },
];

/** Publication events take their date and title from the guide itself, so
 * the log can't drift from the published record. Unknown slugs throw. */
export function resolveBuildLog(list: readonly BuildLogSource[] = sources): BuildLogEntry[] {
  return list.map((s) => {
    if (s.type === "plan") return { date: s.date, type: "plan", title: s.title, ...(s.href ? { href: s.href } : {}) };
    const guide = articles.find((a) => a.slug === s.guideSlug);
    if (!guide) throw new Error(`build log: unknown guide "${s.guideSlug}"`);
    return {
      date: { precision: "day", value: guide.publishedAt },
      type: "publication",
      title: `Published “${guide.title}”`,
      href: `/guides/${guide.slug}`,
    };
  });
}

export const buildLog: BuildLogEntry[] = resolveBuildLog();
