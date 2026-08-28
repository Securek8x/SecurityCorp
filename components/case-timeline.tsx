export type TimelineStage = {
  stage: string;
  summary: string;
  detail?: string;
};

export function CaseTimeline({ stages }: { stages: TimelineStage[] }) {
  return (
    <section
      className="case-timeline"
      aria-labelledby="timeline-heading"
      data-motion="once"
      data-motion-duration={String(600 + stages.length * 260)}
    >
      <p className="section-label" id="timeline-heading">Engineering timeline</p>
      <div className="case-timeline-track">
        <div className="case-timeline-trace" aria-hidden="true" />
        <ol>
        {stages.map((s, i) => (
          <li key={s.stage} className="reveal">
            <span className="timeline-index flow-pulse-once" style={{ "--pulse-delay": `${200 + i * 260}ms` } as React.CSSProperties}>
              {String(i + 1).padStart(2, "0")}
            </span>
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
      </div>
    </section>
  );
}
