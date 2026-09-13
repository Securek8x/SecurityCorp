import {
  ZONE_LABEL_PADDING,
  layoutPlate,
  wrapPlateLabel,
  PLATE_VIEWBOX,
  type PlateRole,
  type PlateSpec,
} from "@/lib/schematic-plate";

/**
 * Static renderer for the Schematic Plate system (bead s41.12, direction B of
 * the s41.5 hybrid).
 *
 * Deliberately a server component with no hooks and no client JavaScript: the
 * plate's resting state is the whole plate. Interactivity, where an article
 * needs it, stays with the existing `InteractiveFlowDiagram` rather than
 * growing a second interactive system.
 *
 * Closed rendering model. Every colour resolves to a CSS custom property so
 * both themes are native, and all caller text is rendered as JSX children so
 * React escapes it — no `dangerouslySetInnerHTML`, and no caller string is
 * ever interpolated into `d=`, `style` or an id.
 */

function roleClass(role: PlateRole): string {
  switch (role) {
    case "sealed":
      return "plate-zone-sealed";
    case "failure":
      return "plate-zone-failure";
    case "neutral":
      return "plate-zone-neutral";
    default:
      return "plate-zone-sanctioned";
  }
}

export type SchematicPlateProps = {
  spec: PlateSpec;
  /** Card-thumbnail mode (bead s41.18): short codes only, no legend, no
   * header/evidence marks, and the SVG is treated as decorative (the card's
   * own heading already supplies the link's accessible name — exactly the
   * existing `alt=""` treatment the raster thumbnail path uses) rather than
   * announcing a `role="img"` name once per card in a 40+ item grid. This is
   * a render-time choice, not a CSS/viewport toggle: a catalog card is
   * always small regardless of viewport width, so density here does not
   * follow the article-page responsive breakpoint. */
  compact?: boolean;
  /** Merged onto the root `<svg>` — used to apply `.guide-card-thumb`'s
   * existing bleed/aspect-ratio/border treatment so a plate thumbnail sits
   * in exactly the same box a raster thumbnail would. */
  className?: string;
};

export function SchematicPlate({ spec, compact = false, className }: SchematicPlateProps) {
  const layout = layoutPlate(spec);
  // Ids are derived from plateId, which is repo-authored and validated, never
  // from free-form article prose.
  const titleId = `plate-${spec.plateId}-title`;
  const descId = `plate-${spec.plateId}-desc`;
  const svgClassName = ["schematic-plate", compact && "schematic-plate--compact", className].filter(Boolean).join(" ");

  return (
    <svg
      className={svgClassName}
      viewBox={`0 0 ${PLATE_VIEWBOX.width} ${PLATE_VIEWBOX.height}`}
      width="100%"
      preserveAspectRatio={compact ? "xMidYMid slice" : undefined}
      {...(compact ? { "aria-hidden": true } : { role: "img", "aria-labelledby": `${titleId} ${descId}` })}
    >
      {!compact && (
        <>
          <title id={titleId}>{spec.title}</title>
          <desc id={descId}>{spec.desc}</desc>
        </>
      )}

      {/* registration frame + edge ticks: this is an instrument, not a picture */}
      <rect
        className="plate-frame"
        x={layout.frame.x}
        y={layout.frame.y}
        width={layout.frame.w}
        height={layout.frame.h}
      />
      {layout.ticks.map((t, i) => (
        <line className="plate-tick" key={`tick-${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
      ))}

      {!compact && spec.headerLabel ? (
        <text className="plate-header" x={layout.frame.x + 16} y={layout.frame.y + 22}>
          {spec.headerLabel}
        </text>
      ) : null}
      {!compact && spec.evidenceState ? (
        <text
          className={`plate-evidence plate-evidence-${spec.evidenceState.toLowerCase().replace(/\s+/g, "-")}`}
          x={layout.frame.x + layout.frame.w - 16}
          y={layout.frame.y + 22}
          textAnchor="end"
        >
          {spec.evidenceState}
        </text>
      ) : null}

      {/* links first so zones paint over their endpoints */}
      {layout.links.map((link) => (
        <path
          key={link.id}
          className={`plate-link plate-link-${link.weight} ${link.kind === "failure" ? "plate-link-failure" : ""}`}
          d={link.d}
        />
      ))}

      {layout.zones.map((z) => {
        const cx = z.x + z.w / 2;
        return (
          <g key={z.id} className={`plate-zone ${roleClass(z.role)}`}>
            {/* the sealed ring: unbroken, and nothing touches it */}
            {z.ring ? (
              <rect
                className="plate-ring"
                x={z.ring.x}
                y={z.ring.y}
                width={z.ring.w}
                height={z.ring.h}
              />
            ) : null}
            <rect className="plate-zone-body" x={z.x} y={z.y} width={z.w} height={z.h} />
            {z.role !== "sealed" ? (
              <rect className="plate-zone-cap" x={z.x} y={z.y} width={z.w} height={4} />
            ) : null}

            {compact ? (
              // Card size: short code only, centred. No full/sublabel pair —
              // there is no viewport at which a catalog card grows into the
              // article-page density, so there is nothing for it to step
              // down from.
              <text className="plate-zone-label" x={cx} y={z.y + z.h / 2 + 4} textAnchor="middle">
                {z.shortLabel}
              </text>
            ) : (
              <>
                {/* Full labels (>=768px) and short codes (<768px) are both in
                    the DOM; CSS swaps them. Density steps down — type never
                    shrinks below the legibility floor. */}
                <g className="plate-label-full">
                  {(() => {
                    const lines = wrapPlateLabel(z.label, z.w - ZONE_LABEL_PADDING);
                    // Centre the label block in the upper part of the zone,
                    // leaving the sublabel its own baseline below.
                    const lineHeight = 13;
                    const blockTop = z.y + (z.sublabel ? 26 : 32) - ((lines.length - 1) * lineHeight) / 2;
                    return (
                      <>
                        {lines.map((line, i) => (
                          <text
                            key={`${z.id}-l${i}`}
                            className="plate-zone-label"
                            x={cx}
                            y={blockTop + i * lineHeight}
                            textAnchor="middle"
                          >
                            {line}
                          </text>
                        ))}
                        {z.sublabel ? (
                          <text
                            className="plate-zone-sublabel"
                            x={cx}
                            y={blockTop + lines.length * lineHeight + 6}
                            textAnchor="middle"
                          >
                            {z.sublabel}
                          </text>
                        ) : null}
                      </>
                    );
                  })()}
                </g>
                <g className="plate-label-short">
                  <text className="plate-zone-label" x={cx} y={z.y + z.h / 2 + 4} textAnchor="middle">
                    {z.shortLabel}
                  </text>
                </g>
              </>
            )}
          </g>
        );
      })}

      {!compact && spec.legend && spec.legend.length > 0 ? (
        <g className="plate-legend">
          <line
            className="plate-legend-rule"
            x1={layout.frame.x + 38}
            y1={layout.frame.y + layout.frame.h - 40}
            x2={layout.frame.x + layout.frame.w - 38}
            y2={layout.frame.y + layout.frame.h - 40}
          />
          {spec.legend.map((item, i) => {
            const x = layout.frame.x + 38 + i * 186;
            const y = layout.frame.y + layout.frame.h - 22;
            return (
              <g key={item.label} className={roleClass(item.role)}>
                {item.role === "sealed" ? (
                  <rect className="plate-legend-swatch-sealed" x={x} y={y - 9} width={10} height={10} />
                ) : (
                  <rect className="plate-legend-swatch" x={x} y={y - 6} width={12} height={3} />
                )}
                <text className="plate-legend-text" x={x + 20} y={y}>
                  {item.label}
                </text>
              </g>
            );
          })}
        </g>
      ) : null}
    </svg>
  );
}

/**
 * A plate wrapped in the same `.article-figure` framing, caption treatment and
 * spacing that `ArticleFigure` gives a raster cover.
 *
 * This shared framing is the mechanism that makes a retained legacy cinematic
 * cover and a new plate read as one deliberate system rather than as two eras
 * accidentally stacked (docs/graphic-and-diagram-language.md section 9). The
 * plate carries its own accessible name and description through the SVG's
 * `<title>`/`<desc>`, so unlike a raster figure it needs no separate alt text.
 */
export function PlateFigure({ spec, presentation = "wide" }: { spec: PlateSpec; presentation?: "inline" | "wide" }) {
  return (
    <figure className={`article-figure article-figure-${presentation} article-figure-plate`}>
      <SchematicPlate spec={spec} />
      {spec.caption ? <figcaption>{spec.caption}</figcaption> : null}
    </figure>
  );
}

/**
 * Catalog-card thumbnail (bead s41.18) — a plate rendered compact, carrying
 * the raster thumbnail's own `.guide-card-thumb` class so it inherits the
 * identical bleed, 16:9 aspect ratio, and bottom-border treatment. No
 * wrapping element: the SVG *is* the thumbnail, exactly as the `<img>` is on
 * the raster path, which is what keeps grid layout identical between the
 * two kinds of card.
 */
export function PlateCardThumb({ spec }: { spec: PlateSpec }) {
  return <SchematicPlate spec={spec} compact className="guide-card-thumb" />;
}
