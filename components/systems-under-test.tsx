import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EvidenceDistribution, EvidenceGlyph } from "@/components/evidence-mark";
import { evidenceMaturityLabel } from "@/lib/evidence";
import { observationNote, type SystemsUnderTest as Model } from "@/lib/systems-under-test";

// Homepage inventory of systems and their evidence coverage (s41.20.10).
// Failure behaviour lives in the Failure Lab; this answers "what exists, and
// what evidence covers it". Everything rendered comes from the view model,
// which reads only the verified evidence API.
export function SystemsUnderTest({ model }: { model: Model }) {
  const cols = model.showOperational ? "sut-with-operational" : "";
  return (
    <div className={`sut ${cols}`}>
      <div className="sut-head" aria-hidden="true">
        <span>System</span>
        {model.showOperational && <span>Operational</span>}
        <span>Evidence</span>
        <span>Evidence records</span>
        <span />
      </div>
      <ul className="sut-list" role="list">
        {model.rows.map((row) => (
          <li key={row.index} className="sut-row record-trace">
            <div className="sut-system">
              <span className="sut-index">{row.index}</span>
              <h3>{row.title}</h3>
              <p>{row.description}</p>
            </div>
            {model.showOperational && (
              <div className="sut-operational">
                {row.operational && (
                  <p>
                    <span className="sut-field-label">Operational state</span>
                    {row.operational.label} <span className="sut-asof">as of {row.operational.asOf}</span>
                  </p>
                )}
              </div>
            )}
            <div className="sut-evidence">
              <span className="sut-field-label">Evidence</span>
              <EvidenceDistribution parts={row.evidence} summary={row.evidenceSummary} />
            </div>
            <div className="sut-records">
              <span className="sut-records-count">{row.recordsLabel}</span>
              <ul role="list">
                {row.records.map((r) => (
                  <li key={r.claim} data-maturity={r.maturity}>
                    <EvidenceGlyph maturity={r.maturity} size={14} />
                    <span>
                      <span className="sr-only">{evidenceMaturityLabel[r.maturity]}: </span>
                      {r.claim}
                      <span className="sut-record-note">{observationNote[r.observation]}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sut-link">
              {row.link && (
                <Link href={row.link.href} className="card-cta">
                  {row.link.label}
                  <span className="sr-only">: {row.title}</span>
                  <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
