export type TimelineStage = {
  stage: string;
  summary: string;
  detail?: string;
};

export function CaseTimeline({ stages }: { stages: TimelineStage[] }) {
  return (
    <section className="case-timeline" aria-labelledby="timeline-heading">
      <p className="section-label" id="timeline-heading">Engineering timeline</p>
      <ol>
        {stages.map((s, i) => (
          <li key={s.stage} className="reveal">
            <span className="timeline-index">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <strong>{s.stage}</strong>
              <p>{s.summary}</p>
              {s.detail && (
                <details>
                  <summary>More detail</summary>
                  <p>{s.detail}</p>
                </details>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
