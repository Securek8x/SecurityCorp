// Decorative schematic behind/around the hero scope card. Purely
// atmospheric — no node or path here represents live infrastructure, a
// real network, or current traffic. Cyan is the dominant main route,
// violet a sparse secondary route, green marks the single safe/complete
// node. Node coordinates and derived path lengths below (all straight
// segments, computed by hand — see MOTION SYSTEM in globals.css for why
// stroke-dasharray needs an exact length).
const MAIN_ROUTE = "M30,420 L110,360 L150,250 L250,190 L370,60";
const MAIN_ROUTE_LENGTH = 100 + 117 + 117 + 177; // ≈ 511
const SECONDARY_ROUTE = "M150,250 L60,150 L140,70";
const SECONDARY_ROUTE_LENGTH = 135 + 113; // ≈ 248
const DECORATIVE_LINK = "M250,190 L300,300";

export default function HeroNetwork() {
  return (
    <svg
      className="hero-network"
      viewBox="0 0 400 460"
      aria-hidden="true"
      focusable="false"
      data-motion="loop"
    >
      {/* decorative static texture — no motion, no packet */}
      <path d={DECORATIVE_LINK} stroke="var(--diagram-line)" strokeOpacity=".25" strokeWidth="1" fill="none" />

      {/* secondary (violet) route — sparse, dimmer, no terminal outcome node */}
      <path
        className="flow-path flow-path-secondary"
        d={SECONDARY_ROUTE}
        style={{ "--path-length": SECONDARY_ROUTE_LENGTH, "--draw-delay": "180ms" } as React.CSSProperties}
      />
      <circle
        className="flow-packet flow-packet-violet flow-packet-loop"
        r="3.5"
        style={{ offsetPath: `path("${SECONDARY_ROUTE}")`, "--flow-duration": "3600ms", "--flow-delay": "900ms" } as React.CSSProperties}
      />

      {/* main (cyan) route — the dominant, occasionally-brightened path */}
      <path
        className="flow-path flow-route-ambient"
        d={MAIN_ROUTE}
        style={{ "--path-length": MAIN_ROUTE_LENGTH } as React.CSSProperties}
      />
      <circle
        className="flow-packet flow-packet-cyan flow-packet-loop"
        r="4"
        style={{ offsetPath: `path("${MAIN_ROUTE}")`, "--flow-duration": "2600ms", "--flow-delay": "0ms" } as React.CSSProperties}
      />
      <circle
        className="flow-packet flow-packet-cyan flow-packet-loop"
        r="4"
        style={{ offsetPath: `path("${MAIN_ROUTE}")`, "--flow-duration": "2600ms", "--flow-delay": "1300ms" } as React.CSSProperties}
      />

      {/* nodes */}
      <circle className="flow-node" cx="30" cy="420" r="5" style={{ "--draw-delay": "0ms" } as React.CSSProperties} />
      <circle className="flow-node flow-pulse-loop" cx="110" cy="360" r="5" style={{ "--pulse-delay": "500ms" } as React.CSSProperties} />
      <circle className="flow-node flow-pulse-loop" cx="150" cy="250" r="5.5" style={{ "--pulse-delay": "1050ms" } as React.CSSProperties} />
      <circle className="flow-node flow-pulse-loop" cx="250" cy="190" r="5" style={{ "--pulse-delay": "1650ms" } as React.CSSProperties} />
      <circle className="flow-node flow-node-safe flow-pulse-loop" cx="370" cy="60" r="6" style={{ "--pulse-delay": "2500ms" } as React.CSSProperties} />
      <circle className="flow-node" cx="60" cy="150" r="4" />
      <circle className="flow-node" cx="140" cy="70" r="4" />
      <circle className="flow-node" cx="300" cy="300" r="3.5" opacity=".5" />
    </svg>
  );
}
