import type { ObservationRow, OutcomeTone } from "@/lib/evidence";

export type Evidence = {
  control: string;
  claim: string;
  test: string;
  /** Documented design expectation — never presented as observed. */
  expected: string;
  /** One row per evidence record, from the verified project evidence. */
  observations: readonly Readonly<ObservationRow>[];
  /** From explicit recorded outcomes only; never derived from maturity. */
  outcome: { label: string; tone: OutcomeTone };
  limitations: string[];
};

export function EvidencePanel({ evidence }: { evidence: Evidence }) {
  const recorded = evidence.observations.filter((o) => o.kind === "recorded");
  const unrecorded = evidence.observations.filter((o) => o.kind !== "recorded");
  return (
    <section className="evidence-panel" aria-labelledby="evidence-heading">
      <p className="section-label" id="evidence-heading">Evidence panel</p>
      <p className="evidence-claim">
        <strong>Claim:</strong> {evidence.claim}
      </p>
      <div className="evidence-grid">
        <details open className="evidence-detail">
          <summary>Design</summary>
          <p>{evidence.control}</p>
        </details>
        <details open className="evidence-detail">
          <summary>Test</summary>
          <p>{evidence.test}</p>
        </details>
        <details open className="evidence-detail">
          <summary>Expected vs. observed</summary>
          <p><strong>Expected:</strong> {evidence.expected}</p>
          <p><strong>Observed (recorded):</strong>{recorded.length === 0 && " No recorded observed result yet."}</p>
          {recorded.length > 0 && (
            <ul>
              {recorded.map((o) => (
                <li key={o.claim}>{o.claim}: {o.text}</li>
              ))}
            </ul>
          )}
          {unrecorded.length > 0 && (
            <>
              <p><strong>No recorded result:</strong></p>
              <ul>
                {unrecorded.map((o) => (
                  <li key={o.claim}>{o.claim}: {o.text}</li>
                ))}
              </ul>
            </>
          )}
          <span className={`evidence-result evidence-result-${evidence.outcome.tone}`}>{evidence.outcome.label}</span>
        </details>
        <details open className="evidence-detail">
          <summary>Limitations</summary>
          <ul>
            {evidence.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}
