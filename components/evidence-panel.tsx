export type Evidence = {
  control: string;
  claim: string;
  test: string;
  expected: string;
  observed: string;
  result: "passed" | "failed" | "partial" | "planned";
  limitations: string[];
};

const resultLabel: Record<Evidence["result"], string> = {
  passed: "Passed",
  failed: "Failed",
  partial: "Partial",
  planned: "Planned",
};

export function EvidencePanel({ evidence }: { evidence: Evidence }) {
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
          <p><strong>Observed:</strong> {evidence.observed}</p>
          <span className={`evidence-result evidence-result-${evidence.result}`}>{resultLabel[evidence.result]}</span>
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
