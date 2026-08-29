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

// tiger-guardian-fallback: the same layered, code-native tiger guardian as
// the WebGL scene (hero-webgl-canvas.tsx), reduced to flat SVG polygons/
// lines in this diagram's own coordinate space. Always present here — this
// is the complete no-JS/reduced-motion/coarse-pointer/Save-Data/WebGL-
// failure composition, not a placeholder waiting for the canvas. Centered
// right-of-middle (300,235) and scaled (~1.55x the diagram's own unit
// grid) so it anchors the network at typical desktop widths instead of
// reading as a small corner icon.
const GUARDIAN_HEAD =
  "M300,142 319,145 356,120 340,158 378,192 390,235 374,278 347,309 316,325 " +
  "300,334 285,325 254,309 226,278 210,235 223,192 260,158 244,120 281,145 Z";
const GUARDIAN_ARMOR = "M359,207 384,201 393,232 381,260 359,263 343,238 Z";
const GUARDIAN_FOREHEAD = "M300,133 328,158 300,179 272,158 Z";
const GUARDIAN_NOSE = "M300,306 309,322 300,334 291,322 Z";
const GUARDIAN_STRIPES = [
  "M278,148 291,170", "M322,148 309,170",
  "M269,176 288,201", "M331,176 312,201",
  "M260,207 281,232", "M340,207 319,232",
  "M353,220 371,244", "M247,220 229,244",
  "M340,257 359,282", "M260,257 241,282",
];
const GUARDIAN_WHISKERS = ["M325,313 347,316", "M275,313 253,316", "M325,325 343,331", "M275,325 257,331"];
// short static connectors from nearby existing nodes into the guardian's
// silhouette edge, so it reads as embedded in the network rather than a
// separate icon floating over it — no motion, matching the pre-existing
// decorative-link treatment.
const GUARDIAN_LINKS = ["M370,60 L356,120", "M250,190 L223,192", "M150,250 L210,235"];

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
          first so the network routes above read as passing behind/around it.
          Wrapped in one group so the ≤600px mobile rule below (globals.css)
          can apply an intentional smaller composition instead of letting
          the desktop-scale guardian crowd or clip at 375px. */}
      <g className="tiger-guardian">
        <path d={GUARDIAN_HEAD} className="guardian-silhouette" fill="var(--acid)" fillOpacity=".08" stroke="var(--acid)" strokeOpacity=".32" strokeWidth="2" />
        {GUARDIAN_STRIPES.map((d) => (
          <path key={d} d={d} stroke="var(--acid)" strokeOpacity=".65" strokeWidth="1.6" fill="none" />
        ))}
        {GUARDIAN_WHISKERS.map((d) => (
          <path key={d} d={d} stroke="var(--acid)" strokeOpacity=".45" strokeWidth="1" fill="none" />
        ))}
        <path d={GUARDIAN_NOSE} stroke="var(--acid)" strokeOpacity=".6" strokeWidth="1.5" fill="var(--acid)" fillOpacity=".1" />
        <path d={GUARDIAN_ARMOR} stroke="var(--accent2)" strokeOpacity=".72" strokeWidth="1.75" fill="var(--accent2)" fillOpacity=".1" />
        <path d={GUARDIAN_FOREHEAD} stroke="var(--accent2)" strokeOpacity=".72" strokeWidth="1.75" fill="var(--accent2)" fillOpacity=".1" />
        {GUARDIAN_LINKS.map((d) => (
          <path key={d} d={d} stroke="var(--diagram-line)" strokeOpacity=".3" strokeWidth="1" fill="none" />
        ))}
      </g>

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

      {/* guardian eye cores/rings + forehead socket — on top, a restrained
          accent rather than the brightest element on the page. Separate
          group (same className, same transform-origin) so it still paints
          above the routes/nodes above while scaling with the rest of the
          guardian under the mobile rule. */}
      <g className="tiger-guardian">
        <circle cx="300" cy="145" r="4" fill="var(--accent2)" fillOpacity=".6" />
        {[266, 334].map((cx, i) => (
          <g key={cx}>
            <circle cx={cx} cy="226" r="7" fill="none" stroke="var(--acid)" strokeOpacity=".5" strokeWidth="1.25" />
            <circle
              className="flow-pulse-loop"
              cx={cx}
              cy="226"
              r="3.2"
              fill="var(--warn)"
              fillOpacity=".62"
              style={{ "--pulse-delay": `${i * 900}ms` } as React.CSSProperties}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
