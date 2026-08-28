"use client";
import { useEffect, useId, useRef, useState } from "react";
import { DiagramControls, type FlowMode } from "@/components/diagrams/diagram-controls";
import { reobserveMotionElement } from "@/components/motion-controller";

export type FlowNodeSpec = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  description: string;
  /** Which mode(s) this node is part of the active flow in. Always rendered; dimmed outside its modes. */
  activeIn: FlowMode[];
  role?: "safe" | "blocked" | "boundary";
  focusableLabel?: string;
};

export type FlowEdgeSpec = {
  id: string;
  from: string;
  to: string;
  d: string;
  length: number;
  kind: "main" | "failure";
  activeIn: FlowMode[];
};

export type FlowDiagramSpec = {
  titleId: string;
  title: string;
  desc: string;
  viewBox: string;
  nodes: FlowNodeSpec[];
  edges: FlowEdgeSpec[];
  mainPacketRoute: { d: string; length: number };
  failureLabel: string;
  caption: string;
  motionDuration?: number;
};

function wrapLabel(label: string): string[] {
  const words = label.split(" ");
  if (words.length < 2) return [label];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

/**
 * Shared renderer for all three guide architecture diagrams. A declarative
 * spec (nodes/edges/modes) drives one implementation instead of duplicating
 * the intro-sequence, mode-toggle, node-exploration, and replay logic three
 * times. Node hover/focus highlights connected edges and reveals a
 * description in a real, always-in-the-DOM panel (not a pointer-only
 * tooltip) so keyboard and screen-reader users get the same information.
 */
export function InteractiveFlowDiagram({ spec }: { spec: FlowDiagramSpec }) {
  const [mode, setMode] = useState<FlowMode>("normal");
  const [exploredId, setExploredId] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const reactId = useId();
  const figureRef = useRef<HTMLDivElement>(null);

  // On initial mount the shared MotionController's own querySelectorAll
  // scan already finds and observes this element. Replay (below) gives the
  // figure a fresh `key`, which unmounts/remounts this whole subtree with a
  // brand-new DOM node the controller never scanned for — this re-observes
  // it with the *same* running observer so the intro sequence replays
  // rather than sitting inert.
  useEffect(() => {
    reobserveMotionElement(figureRef.current);
  }, [playKey]);

  const explored = spec.nodes.find((n) => n.id === exploredId) ?? null;
  const connectedEdges = exploredId ? spec.edges.filter((e) => e.from === exploredId || e.to === exploredId) : [];
  const connectedEdgeIds = exploredId ? new Set(connectedEdges.map((e) => e.id)) : null;
  const connectedNodeIds = exploredId
    ? new Set(connectedEdges.flatMap((e) => [e.from, e.to]))
    : null;

  return (
    <figure className="arch-diagram">
      {/* Only this inner wrapper remounts on Replay (fresh key restarts the
          CSS draw sequence) — DiagramControls stays mounted outside it, so
          the Replay button itself is never destroyed and never loses focus. */}
      <div ref={figureRef} className="diagram-sequence" data-motion="once" data-motion-duration={String(spec.motionDuration ?? 2600)} key={playKey}>
      <svg className="arch-diagram-svg" viewBox={spec.viewBox} width="100%" role="img" aria-labelledby={`${spec.titleId}-t ${spec.titleId}-d`}>
        <title id={`${spec.titleId}-t`}>{spec.title}</title>
        <desc id={`${spec.titleId}-d`}>{spec.desc}</desc>
        <defs>
          <marker id={`${reactId}-cyan`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--diagram-line)" />
          </marker>
          <marker id={`${reactId}-amber`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--diagram-failure)" />
          </marker>
        </defs>

        {spec.edges.map((edge) => {
          const activeNow = edge.activeIn.includes(mode);
          const dimmedByExploration = connectedEdgeIds ? !connectedEdgeIds.has(edge.id) : false;
          return (
            <path
              key={edge.id}
              className={`flow-path ${edge.kind === "failure" ? "flow-path-failure" : ""} ${!activeNow ? "flow-path-dim" : ""} ${dimmedByExploration && activeNow ? "flow-path-explore-dim" : ""}`}
              d={edge.d}
              markerEnd={`url(#${reactId}-${edge.kind === "failure" ? "amber" : "cyan"})`}
              style={{ "--path-length": edge.length, "--draw-delay": edge.kind === "failure" ? "1250ms" : "0ms" } as React.CSSProperties}
            />
          );
        })}

        {mode === "normal" && (
          <>
            <circle
              className="flow-packet flow-packet-cyan flow-packet-once"
              r="4.5"
              style={{ offsetPath: `path("${spec.mainPacketRoute.d}")`, "--flow-duration": "1400ms", "--flow-delay": "150ms" } as React.CSSProperties}
            />
            <circle
              className="flow-packet flow-packet-cyan flow-packet-loop"
              r="3"
              opacity=".55"
              style={{ offsetPath: `path("${spec.mainPacketRoute.d}")`, "--flow-duration": "3200ms", "--flow-delay": "1800ms" } as React.CSSProperties}
            />
          </>
        )}

        {spec.nodes.map((node) => {
          const activeNow = node.activeIn.includes(mode);
          const isExplored = exploredId === node.id;
          const dimmedByExploration = Boolean(exploredId) && !isExplored && !connectedNodeIds?.has(node.id);
          const roleClass = node.role === "safe" ? "flow-node-safe" : node.role === "blocked" ? "flow-node-blocked" : node.role === "boundary" ? "flow-node-active" : "";
          const lines = wrapLabel(node.label);
          return (
            <g
              key={node.id}
              tabIndex={0}
              role="group"
              aria-label={node.focusableLabel ?? `${node.label} — ${node.description}`}
              className={`flow-node-group ${isExplored ? "flow-node-explored" : ""}`}
              onMouseEnter={() => setExploredId(node.id)}
              onMouseLeave={() => setExploredId((cur) => (cur === node.id ? null : cur))}
              onFocus={() => setExploredId(node.id)}
              onBlur={() => setExploredId((cur) => (cur === node.id ? null : cur))}
            >
              <rect
                className={`flow-node ${roleClass} flow-pulse-once ${!activeNow ? "flow-node-dim" : ""} ${dimmedByExploration ? "flow-node-explore-dim" : ""}`}
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                rx="6"
                style={{ "--pulse-delay": "500ms" } as React.CSSProperties}
              />
              {lines.map((line, li) => (
                <text
                  key={line}
                  x={node.x + node.w / 2}
                  y={node.y + node.h / 2 + (lines.length === 1 ? 5 : li === 0 ? -2 : 15)}
                  textAnchor="middle"
                  fontSize="13"
                  fill="var(--diagram-node-text)"
                  fontFamily="Arial, Helvetica, sans-serif"
                  opacity={activeNow ? 1 : 0.55}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
      </div>

      <DiagramControls mode={mode} onModeChange={setMode} onReplay={() => setPlayKey((k) => k + 1)} failureLabel={spec.failureLabel} />

      <div className="diagram-explore-panel" aria-live="polite">
        {explored ? (
          <p>
            <strong>{explored.label}.</strong> {explored.description}
          </p>
        ) : (
          <p className="diagram-explore-hint">Hover or focus a node to explore it.</p>
        )}
      </div>

      <figcaption>{spec.caption}</figcaption>
    </figure>
  );
}
