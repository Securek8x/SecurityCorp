// View model for the homepage "Systems under test" inventory (s41.20.10).
//
// Answers: which systems exist, and what evidence covers each one. It is not
// a second project model: every value comes from `projects` (built through
// the verified evidence boundary in ./content.ts) via the evidence API, and
// nothing here counts records, infers maturity, or reads prose for status.
// Failure behaviour and observed results stay in the Failure Lab and case
// studies; here each record contributes only its claim, maturity, and what
// kind of observation exists.
//
// Only relative imports — scripts under plain `node` may import this module.
import type { Project } from "./content.ts";
import { formatDisplayDate } from "./content-dates.ts";
import {
  evidenceDistribution,
  evidenceDistributionParts,
  observationRows,
  operationalStateLabel,
  summarizeEvidence,
  type EvidenceDistributionPart,
  type EvidenceMaturity,
  type Observation,
} from "./evidence.ts";

export type SystemRecord = Readonly<{
  claim: string;
  maturity: EvidenceMaturity;
  /** What kind of observation exists — never the observed result itself. */
  observation: Observation["kind"];
}>;

export type SystemRow = Readonly<{
  index: string;
  title: string;
  description: string;
  /** null = evidence unavailable (failed verification). */
  evidence: readonly EvidenceDistributionPart[] | null;
  /** The same distribution as one sentence, for accessible names. */
  evidenceSummary: string;
  /** e.g. "5 failure paths" or "3 evidence records", from the verified total. */
  recordsLabel: string;
  records: readonly SystemRecord[];
  /** Present only for a verified, sourced operational state. */
  operational?: Readonly<{ label: string; asOf: string }>;
  link?: Readonly<{ href: string; label: string }>;
}>;

export type SystemsUnderTest = Readonly<{
  rows: readonly SystemRow[];
  /** False when no system has a sourced operational state: the column is
   * omitted entirely rather than filled with placeholders. */
  showOperational: boolean;
}>;

/** Reader-facing note for an observation kind. States only what kind of
 * observation exists; the result itself (and whether the control behaved as
 * intended) is in the Failure Lab and case study. */
export const observationNote: Record<Observation["kind"], string> = {
  recorded: "Recorded observed result",
  reported: "Reported as exercised — no recorded result",
  none: "No execution result claimed",
};

function linkFor(p: Project): SystemRow["link"] {
  if (p.slug) return Object.freeze({ href: `/projects/${p.slug}`, label: "Case study" });
  if (p.guideSlug) return Object.freeze({ href: `/guides/${p.guideSlug}`, label: "Guide" });
  return undefined;
}

export function buildSystemsUnderTest(projects: readonly Project[]): SystemsUnderTest {
  const rows = projects.map((p): SystemRow => {
    const records = observationRows(p.evidence).map((r) =>
      Object.freeze({ claim: r.claim, maturity: r.maturity, observation: r.kind }),
    );
    const op = p.operationalState;
    const dist = evidenceDistribution(p.evidence);
    const total = dist.available ? dist.total : 0;
    const noun = dist.available && dist.unit ? dist.unit : "evidence record";
    const link = linkFor(p);
    return Object.freeze({
      index: p.index,
      title: p.title,
      description: p.text,
      evidence: evidenceDistributionParts(p.evidence),
      evidenceSummary: summarizeEvidence(p.evidence),
      recordsLabel: `${total} ${noun}${total === 1 ? "" : "s"}`,
      records: Object.freeze(records),
      ...(op ? { operational: Object.freeze({ label: operationalStateLabel[op.state], asOf: formatDisplayDate(op.asOf) }) } : {}),
      ...(link ? { link } : {}),
    });
  });
  return Object.freeze({ rows: Object.freeze(rows), showOperational: rows.some((r) => r.operational) });
}
