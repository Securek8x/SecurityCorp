export type ProjectVisual = "file-intake" | "vpn-tunnel" | "gateway" | "k8s-parity";

// Small decorative per-project schematics, standing in for the repeated
// FlaskConical icon on each homepage project card. Purely illustrative —
// the visual is chosen from stable project identity (see the VISUAL_BY_INDEX
// map in app/page.tsx keyed by project index), never from status, so it
// can't be read as implying anything operational. Animates only on
// :hover/:focus-within (see .project-card .project-schematic in
// globals.css) — no viewport-triggered motion, no shared controller
// involvement needed for a purely interaction-driven effect.
export function ProjectSchematic({ visual }: { visual: ProjectVisual }) {
  const common = {
    className: "project-schematic",
    viewBox: "0 0 130 60",
    "aria-hidden": "true" as const,
    focusable: "false" as const,
  };

  if (visual === "file-intake") {
    const route = "M8,30 H55 M75,30 H122";
    const branch = "M65,40 V54";
    return (
      <svg {...common}>
        <path className="flow-path" d={route} style={{ "--path-length": 94 } as React.CSSProperties} />
        <path className="flow-path flow-path-failure" d={branch} style={{ "--path-length": 14 } as React.CSSProperties} />
        <circle className="flow-node" cx="8" cy="30" r="5" />
        <circle className="flow-node flow-node-active" cx="65" cy="30" r="7" />
        <circle className="flow-node flow-node-safe" cx="122" cy="30" r="5" />
        <circle className="flow-node flow-node-blocked" cx="65" cy="54" r="4.5" />
      </svg>
    );
  }

  if (visual === "vpn-tunnel") {
    const route = "M8,20 H50 M70,20 H122";
    const branch = "M60,30 V54";
    return (
      <svg {...common}>
        <path className="flow-path" d={route} style={{ "--path-length": 94 } as React.CSSProperties} />
        <path className="flow-path flow-path-failure" d={branch} style={{ "--path-length": 24 } as React.CSSProperties} />
        <rect className="flow-node" x="4" y="12" width="12" height="16" rx="2" />
        <rect className="flow-node flow-node-active" x="44" y="10" width="22" height="20" rx="3" />
        <circle className="flow-node flow-node-safe" cx="122" cy="20" r="5" />
        <rect className="flow-node flow-node-blocked" x="46" y="46" width="28" height="12" rx="2" />
      </svg>
    );
  }

  if (visual === "gateway") {
    const route = "M8,30 H40 M60,30 H90 M110,30 H122";
    return (
      <svg {...common}>
        <path className="flow-path" d={route} style={{ "--path-length": 94 } as React.CSSProperties} />
        <circle className="flow-node" cx="8" cy="30" r="5" />
        <circle className="flow-node flow-node-active" cx="50" cy="30" r="6" />
        <rect className="flow-node" x="82" y="21" width="16" height="18" rx="3" />
        <circle className="flow-node flow-node-safe" cx="122" cy="30" r="5" />
      </svg>
    );
  }

  // k8s-parity: two paired columns (current / target) linked by parity
  // arrows — deliberately neutral (no green/safe node): the migration is
  // design-only, and this visual must not read as validated or operational.
  const parityTop = "M22,16 H98";
  const parityBottom = "M22,44 H98";
  return (
    <svg {...common}>
      <path className="flow-path flow-path-secondary" d={parityTop} style={{ "--path-length": 76 } as React.CSSProperties} />
      <path className="flow-path flow-path-secondary" d={parityBottom} style={{ "--path-length": 76 } as React.CSSProperties} />
      <circle className="flow-node flow-node-active" cx="12" cy="16" r="6" />
      <circle className="flow-node flow-node-active" cx="12" cy="44" r="6" />
      <circle className="flow-node" cx="108" cy="16" r="6" />
      <circle className="flow-node" cx="108" cy="44" r="6" />
    </svg>
  );
}
