export type FlowMode = "normal" | "failure";

/**
 * Shared control strip for the three guide diagrams — semantic buttons,
 * not tabs (there's no single "selected panel"; switching mode redraws the
 * same diagram in place). aria-pressed communicates the current mode.
 */
export function DiagramControls({
  mode,
  onModeChange,
  onReplay,
  failureLabel,
}: {
  mode: FlowMode;
  onModeChange: (mode: FlowMode) => void;
  onReplay: () => void;
  failureLabel: string;
}) {
  return (
    <div className="diagram-controls" role="group" aria-label="Diagram controls">
      <button type="button" className="diagram-control-btn" aria-pressed={mode === "normal"} onClick={() => onModeChange("normal")}>
        Normal path
      </button>
      <button type="button" className="diagram-control-btn" aria-pressed={mode === "failure"} onClick={() => onModeChange("failure")}>
        {failureLabel}
      </button>
      <button type="button" className="diagram-control-btn diagram-control-replay" onClick={onReplay}>
        Replay
      </button>
    </div>
  );
}
