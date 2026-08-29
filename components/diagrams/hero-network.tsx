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

// tiger-guardian-fallback: the same layered, code-native tiger guardian as
// the WebGL scene (hero-webgl-canvas.tsx), reduced to flat SVG polygons/
// lines in this diagram's own coordinate space. Always present here — this
// is the complete no-JS/reduced-motion/coarse-pointer/Save-Data/WebGL-
// failure composition, not a placeholder waiting for the canvas.
const GUARDIAN_HEAD =
  "M290,89 306,91 324,79 320,99 334,121 336,143 326,167 308,185 290,193 " +
  "272,185 254,167 244,143 246,121 260,99 256,79 274,91 Z";
const GUARDIAN_ARMOR = "M320,135 334,131 340,145 334,159 322,161 314,149 Z";
const GUARDIAN_FOREHEAD = "M290,93 304,105 290,115 276,105 Z";
const GUARDIAN_STRIPES = [
  "M280,95 286,107", "M300,95 294,107", "M276,111 284,125", "M304,111 296,125",
  "M320,135 330,149", "M260,135 250,149", "M314,159 324,171", "M266,159 256,171",
  "M290,153 282,173", "M290,153 298,173",
];

export default function HeroNetwork() {
  return (
    <svg
      className="hero-network"
      viewBox="0 0 400 460"
      aria-hidden="true"
      focusable="false"
      data-motion="loop"
    >
      {/* holographic-tiger-guardian: rear silhouette + facial contour, drawn
          first so the network routes above read as passing behind/around it */}
      <path d={GUARDIAN_HEAD} className="guardian-silhouette" fill="var(--acid)" fillOpacity=".05" stroke="var(--acid)" strokeOpacity=".18" strokeWidth="1.5" />
      {GUARDIAN_STRIPES.map((d) => (
        <path key={d} d={d} stroke="var(--acid)" strokeOpacity=".4" strokeWidth="1.25" fill="none" />
      ))}
      <path d={GUARDIAN_ARMOR} stroke="var(--accent2)" strokeOpacity=".55" strokeWidth="1.25" fill="var(--accent2)" fillOpacity=".06" />
      <path d={GUARDIAN_FOREHEAD} stroke="var(--accent2)" strokeOpacity=".55" strokeWidth="1.25" fill="var(--accent2)" fillOpacity=".06" />

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

      {/* guardian eye cores/rings + forehead socket — on top, a restrained
          accent rather than the brightest element on the page */}
      <circle cx="290" cy="99" r="3.5" fill="var(--accent2)" fillOpacity=".55" />
      {[273, 307].map((cx, i) => (
        <g key={cx}>
          <circle cx={cx} cy="141" r="6" fill="none" stroke="var(--acid)" strokeOpacity=".4" strokeWidth="1" />
          <circle
            className="flow-pulse-loop"
            cx={cx}
            cy="141"
            r="3"
            fill="var(--warn)"
            fillOpacity=".65"
            style={{ "--pulse-delay": `${i * 900}ms` } as React.CSSProperties}
          />
        </g>
      ))}
    </svg>
  );
}
