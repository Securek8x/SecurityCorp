import { CircleDashed, DraftingCompass, FileText, ScanEye, type LucideIcon } from "lucide-react";
import { evidenceMaturityLabel, type EvidenceDistributionPart, type EvidenceMaturity } from "@/lib/evidence";

// Three-state evidence vocabulary (s41.20.4). Each maturity differs in glyph,
// border treatment, and weight as well as color, so no state depends on color
// alone. The color is one intensity ramp of the site's signal color — design
// (dashed, muted) → documented (solid, neutral) → validated (solid, signal) —
// deliberately NOT the green/amber/grey used for test outcomes elsewhere:
// maturity says how strong the evidence is, never whether a test passed.
// Validated's glyph is an eye: a result was observed, whatever it showed.
const glyph: Record<EvidenceMaturity, LucideIcon> = {
  design: DraftingCompass,
  documented: FileText,
  validated: ScanEye,
};

export const evidenceMaturityMeaning: Record<EvidenceMaturity, string> = {
  design: "Design intent only",
  documented: "Written up; no recorded observed result",
  validated: "An observed result is recorded — whatever it showed",
};

export function EvidenceGlyph({ maturity, size = 13 }: { maturity: EvidenceMaturity; size?: number }) {
  const Icon = glyph[maturity];
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" className="evidence-glyph" />;
}

/** One maturity, labelled. `label` defaults to the maturity name. */
export function EvidenceMark({ maturity, label }: { maturity: EvidenceMaturity; label?: string }) {
  return (
    <span className="evidence-mark" data-maturity={maturity}>
      <EvidenceGlyph maturity={maturity} />
      {label ?? evidenceMaturityLabel[maturity]}
    </span>
  );
}

export function EvidenceUnavailableMark() {
  return (
    <span className="evidence-mark" data-maturity="unavailable">
      <CircleDashed size={13} strokeWidth={1.75} aria-hidden="true" className="evidence-glyph" />
      Evidence unavailable
    </span>
  );
}

/**
 * A project's evidence as its distribution — one mark per maturity present,
 * never a single project-wide maturity. `parts` must come from
 * evidenceDistributionParts(); this component does no counting of its own.
 * Callers provide the accessible lead-in (e.g. a visually hidden
 * "Evidence:"), so the counts are announced once, as list items.
 */
export function EvidenceDistribution({ parts, summary }: { parts: readonly EvidenceDistributionPart[] | null; summary: string }) {
  if (!parts) return <EvidenceUnavailableMark />;
  if (parts.length === 0) return <span className="evidence-mark" data-maturity="unavailable">{summary}</span>;
  return (
    <ul className="evidence-distribution" role="list">
      {parts.map((p) => (
        <li key={p.maturity}>
          <EvidenceMark maturity={p.maturity} label={p.label} />
        </li>
      ))}
    </ul>
  );
}

/** Key for the vocabulary, shown once where evidence is first met. */
export function EvidenceKey() {
  return (
    <dl className="evidence-key" aria-label="Evidence maturity key">
      {(["design", "documented", "validated"] as const).map((m) => (
        <div key={m}>
          <dt>
            <EvidenceMark maturity={m} />
          </dt>
          <dd>{evidenceMaturityMeaning[m]}</dd>
        </div>
      ))}
    </dl>
  );
}
