import type { ControlScenario } from "@/lib/control-under-test";

// Stage labels are a compact paraphrase of each scenario's own trigger/
// expected text in lib/control-under-test.ts — nothing here asserts a fact
// the stored scenario doesn't already state.
const STAGES: Record<string, string[]> = {
  "scanner-unavailable": ["Input", "Isolated staging", "Scanner unavailable", "Held / quarantined"],
  "vpn-tunnel-stopped": ["Workload", "VPN namespace", "Tunnel drop", "Egress blocked"],
  "proxy-migration-fails": ["Proxy migration", "Interface change", "Rollback triggered", "Config restored"],
};

const ROUTE = "M40,50 H190 M240,50 H390 M440,50 H590";
const ROUTE_LENGTH = 150 + 150 + 150;

// Balance a label across up to two short lines so it stays legible inside
// an 80px-wide node instead of overflowing or shrinking unreadably small.
function wrapLabel(label: string): [string] | [string, string] {
  const words = label.split(" ");
  if (words.length < 2) return [label];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

/**
 * Purely decorative restatement of the panel's own trigger/expected/observed
 * text as a small flow diagram — aria-hidden, since it adds no information
 * a screen-reader user doesn't already get from the dl above it. Remounted
 * via `key={scenario.id}` by the caller so its short draw-in sequence
 * restarts on every tab change without stealing focus.
 */
export function FailurePathDiagram({ scenario, verdictClassName }: { scenario: ControlScenario; verdictClassName: string }) {
  const stages = STAGES[scenario.id] ?? [scenario.control, "Trigger", "Response", "Outcome"];
  const isValidated = verdictClassName === "cut-verdict-validated";

  return (
    <figure className="failure-path-diagram diagram-sequence diagram-sequence-auto" aria-hidden="true">
      <p className="mono-label failure-path-label">Documented failure path</p>
      <svg viewBox="0 0 640 100" width="100%" focusable="false">
        <path className="flow-path" d={ROUTE} style={{ "--path-length": ROUTE_LENGTH, "--draw-duration": "700ms" } as React.CSSProperties} />
        <circle
          className="flow-packet flow-packet-cyan"
          r="4"
          style={{ offsetPath: `path("${ROUTE}")`, "--flow-duration": "900ms", "--flow-delay": "100ms" } as React.CSSProperties}
        />
        {stages.map((label, i) => {
          const x = 40 + i * 183.3;
          const isLast = i === stages.length - 1;
          const lines = wrapLabel(label);
          return (
            <g key={label}>
              <rect
                className={`flow-node flow-pulse-once${isLast && isValidated ? " flow-node-safe" : ""}`}
                x={x - 42}
                y="27"
                width="84"
                height="46"
                rx="5"
                style={{ "--pulse-delay": `${150 + i * 250}ms` } as React.CSSProperties}
              />
              {lines.map((line, li) => (
                <text
                  key={line}
                  x={x}
                  y={lines.length === 1 ? 54 : 46 + li * 13}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="var(--diagram-node-text)"
                  fontFamily="var(--font-mono)"
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
