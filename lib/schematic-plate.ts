// Schematic Plate — the code-native visual system selected by Ravi Teja Thota
// in bead securitycorp-source-s41.5 (2026-09-13) as direction B of the B+C
// hybrid. One vocabulary drives article covers, in-body diagrams, catalog
// thumbnails and social cards, so the site stops maintaining two unrelated
// visual languages.
//
// Specifications: docs/code-native-design-system.md (tokens, responsive rule)
// and docs/graphic-and-diagram-language.md (archetypes, semantics, review).
//
// This module is pure data + pure geometry. It renders nothing and imports no
// React. Everything here is deterministic: the same spec always produces the
// same coordinates, so a plate is reproducible across builds and reviewable as
// a diff rather than as a binary.

/** Composition archetypes. Five materially different silhouettes, chosen so a
 *  catalog of 39+ covers does not collapse into wallpaper. */
export type PlateArchetype =
  | "linear-flow"
  | "sealed-enclosure"
  | "coverage-field"
  | "gate-sequence"
  | "divergent-pair";

export const PLATE_ARCHETYPES: readonly PlateArchetype[] = [
  "linear-flow",
  "sealed-enclosure",
  "coverage-field",
  "gate-sequence",
  "divergent-pair",
] as const;

/** The two-term semantic the approved covers established, plus neutral and
 *  failure. `sealed` is never "a second nice colour" — it means a boundary
 *  nothing crosses. */
export type PlateRole = "sanctioned" | "sealed" | "neutral" | "failure";

export type PlateEvidenceState = "VALIDATED" | "DESIGN ONLY" | "UNVERIFIED";

export type PlateZoneSpec = {
  id: string;
  /** Full label, shown at >= 768px. Public editorial content. */
  label: string;
  /** Short code, shown below 768px. Max 5 chars — the responsive rule steps
   *  density down rather than shrinking type below the legibility floor. */
  shortLabel: string;
  /** Optional second line, hidden below 768px. */
  sublabel?: string;
  role: PlateRole;
  /** Longer description surfaced to assistive technology and the explore
   *  panel when the plate is rendered interactively. */
  description?: string;
};

export type PlateLinkSpec = {
  from: string;
  to: string;
  /** Visual weight only. `primary` reads as the higher-volume sanctioned path. */
  weight?: "primary" | "secondary";
  kind?: "sanctioned" | "failure";
};

export type PlateSpec = {
  /** Stable id used for SVG element ids and the plate header mark. */
  plateId: string;
  archetype: PlateArchetype;
  /** SVG <title> — short, factual. */
  title: string;
  /** SVG <desc> — the text equivalent. Mandatory: every plate must be fully
   *  readable without seeing it. */
  desc: string;
  caption: string;
  zones: PlateZoneSpec[];
  links?: PlateLinkSpec[];
  legend?: { role: PlateRole; label: string }[];
  evidenceState?: PlateEvidenceState;
  /** Header mark shown top-left of the registration frame. */
  headerLabel?: string;
};

export const PLATE_VIEWBOX = { width: 800, height: 300 } as const;

/** Max characters for a short label. Enforced by validatePlateSpec so a long
 *  code cannot silently overflow its zone at phone width. */
export const SHORT_LABEL_MAX = 5;

/** Legal zone counts per archetype. Geometry is only defined inside these
 *  ranges; outside them the layout would overlap or leave dead space. */
export const ARCHETYPE_ZONE_RANGE: Record<PlateArchetype, { min: number; max: number }> = {
  "linear-flow": { min: 2, max: 5 },
  "sealed-enclosure": { min: 2, max: 5 },
  "coverage-field": { min: 2, max: 8 },
  "gate-sequence": { min: 2, max: 5 },
  "divergent-pair": { min: 2, max: 6 },
};

// ---------------------------------------------------------------------------
// Deterministic non-semantic variation
// ---------------------------------------------------------------------------

/** FNV-1a over the plate id. Used ONLY for non-semantic variation (tick
 *  phase). It must never choose an archetype — decorative randomness is
 *  prohibited by docs/graphic-and-diagram-language.md section 5.1. */
export function plateHash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Archetype selection — structural, not random
// ---------------------------------------------------------------------------

export type ArchetypeSignals = {
  /** Explicit override declared by the article. Highest priority. */
  declared?: PlateArchetype;
  title: string;
  summary: string;
  contentType?: string;
};

const COVERAGE_TERMS = ["coverage", "limits", "miss", "blind spot", "gap", "not detect", "what scanners"];
const SEQUENCE_TERMS = ["approval", "gate", "pipeline", "stage", "before", "order", "scope", "authoriz"];
const SEALED_TERMS = ["isolation", "isolated", "least privilege", "unreachable", "not publicly", "segmentation"];
const COMPARISON_TERMS = [" vs ", " versus ", "difference between", "compared"];

/**
 * Deterministic archetype selection from the article's own structure, per
 * docs/graphic-and-diagram-language.md section 5.1. First match wins, so the
 * same article always yields the same archetype and review is reproducible.
 */
export function selectArchetype(signals: ArchetypeSignals): PlateArchetype {
  if (signals.declared) return signals.declared;

  const haystack = `${signals.title} ${signals.summary}`.toLowerCase();
  const has = (terms: string[]) => terms.some((t) => haystack.includes(t));

  if (signals.contentType === "comparison" || has(COMPARISON_TERMS)) return "divergent-pair";
  if (has(COVERAGE_TERMS)) return "coverage-field";
  if (has(SEQUENCE_TERMS)) return "gate-sequence";
  if (has(SEALED_TERMS)) return "sealed-enclosure";
  return "linear-flow";
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

export type PlacedZone = PlateZoneSpec & {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Present only for `sealed` zones: the enclosing ring nothing crosses. */
  ring?: { x: number; y: number; w: number; h: number };
};

export type PlacedLink = {
  id: string;
  d: string;
  weight: "primary" | "secondary";
  kind: "sanctioned" | "failure";
};

export type PlateLayout = {
  zones: PlacedZone[];
  links: PlacedLink[];
  /** Edge tick positions on the registration frame. */
  ticks: { x1: number; y1: number; x2: number; y2: number }[];
  frame: { x: number; y: number; w: number; h: number };
};

const FRAME = { x: 28, y: 24, w: 744, h: 252 } as const;

function ticksFor(seed: string) {
  // Tick phase is the one hash-driven value. It shifts marks by at most a few
  // units so two adjacent plates in a catalog grid are not pixel-identical at
  // the frame edge. It carries no meaning.
  const phase = plateHash(seed) % 12;
  const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 1; i < 9; i += 1) {
    const x = FRAME.x + phase + (FRAME.w / 9) * i;
    out.push({ x1: x, y1: FRAME.y, x2: x, y2: FRAME.y + 9 });
  }
  for (let i = 1; i < 4; i += 1) {
    const y = FRAME.y + (FRAME.h / 4) * i;
    out.push({ x1: FRAME.x, y1: y, x2: FRAME.x + 9, y2: y });
    out.push({ x1: FRAME.x + FRAME.w - 9, y1: y, x2: FRAME.x + FRAME.w, y2: y });
  }
  return out;
}

function linkId(from: string, to: string) {
  return `${from}--${to}`;
}

/**
 * Pure layout. Same spec in, same coordinates out, every time — no randomness
 * beyond the non-semantic tick phase, no runtime measurement, no layout engine.
 */
export function layoutPlate(spec: PlateSpec): PlateLayout {
  const zones = spec.zones;
  const n = zones.length;
  const placed: PlacedZone[] = [];

  const midY = 118;
  const zh = 76;

  switch (spec.archetype) {
    case "linear-flow": {
      const gap = 24;
      const usable = FRAME.w - 76;
      const zw = Math.min(130, (usable - gap * (n - 1)) / n);
      const total = zw * n + gap * (n - 1);
      const startX = FRAME.x + (FRAME.w - total) / 2;
      zones.forEach((z, i) => {
        placed.push({ ...z, x: startX + i * (zw + gap), y: midY, w: zw, h: zh });
      });
      break;
    }
    case "sealed-enclosure": {
      // Connected cluster on the left, one sealed zone held apart on the right
      // with generous negative space. The gap is the composition.
      const sealedIdx = zones.findIndex((z) => z.role === "sealed");
      const cluster = zones.filter((_, i) => i !== sealedIdx);
      const gap = 22;
      const zw = Math.min(118, (FRAME.w * 0.62 - gap * (cluster.length - 1)) / Math.max(cluster.length, 1));
      const startX = FRAME.x + 38;
      let ci = 0;
      zones.forEach((z, i) => {
        if (i === sealedIdx) {
          const x = FRAME.x + FRAME.w - 158;
          placed.push({
            ...z,
            x,
            y: midY - 12,
            w: 118,
            h: 100,
            ring: { x: x - 10, y: midY - 22, w: 138, h: 120 },
          });
        } else {
          placed.push({ ...z, x: startX + ci * (zw + gap), y: midY, w: zw, h: zh });
          ci += 1;
        }
      });
      break;
    }
    case "coverage-field": {
      // A plane split by a lit boundary: covered zones above, uncovered below.
      const covered = zones.filter((z) => z.role !== "sealed");
      const uncovered = zones.filter((z) => z.role === "sealed");
      const row = (items: PlateZoneSpec[], y: number) => {
        const gap = 18;
        const zw = Math.min(120, (FRAME.w - 76 - gap * (items.length - 1)) / Math.max(items.length, 1));
        const total = zw * items.length + gap * (items.length - 1);
        const startX = FRAME.x + (FRAME.w - total) / 2;
        items.forEach((z, i) => {
          placed.push({ ...z, x: startX + i * (zw + gap), y, w: zw, h: 58 });
        });
      };
      row(covered, 78);
      row(uncovered, 186);
      break;
    }
    case "gate-sequence": {
      // Vertical gate planes a path bundle crosses left to right.
      const gap = 20;
      const zw = Math.min(118, (FRAME.w - 96 - gap * (n - 1)) / n);
      const total = zw * n + gap * (n - 1);
      const startX = FRAME.x + (FRAME.w - total) / 2;
      zones.forEach((z, i) => {
        const tall = z.role === "sealed" ? 128 : 108;
        placed.push({ ...z, x: startX + i * (zw + gap), y: 150 - tall / 2, w: zw, h: tall });
      });
      break;
    }
    case "divergent-pair": {
      // Shared origin, two tracks that end differently.
      const half = Math.ceil((n - 1) / 2);
      const originW = 118;
      const originX = FRAME.x + 40;
      placed.push({ ...zones[0], x: originX, y: midY, w: originW, h: zh });
      const rest = zones.slice(1);
      const gap = 20;
      const zw = Math.min(112, (FRAME.w - originW - 120 - gap * (half - 1)) / Math.max(half, 1));
      const trackStartX = originX + originW + 62;
      rest.forEach((z, i) => {
        const isTop = i < half;
        const col = isTop ? i : i - half;
        placed.push({
          ...z,
          x: trackStartX + col * (zw + gap),
          y: isTop ? 66 : 176,
          w: zw,
          h: 62,
        });
      });
      break;
    }
  }

  const byId = new Map(placed.map((z) => [z.id, z]));
  const links: PlacedLink[] = [];
  for (const link of spec.links ?? []) {
    const a = byId.get(link.from);
    const b = byId.get(link.to);
    // A link touching a sealed zone would contradict the sealed semantic, and
    // a link to a missing zone cannot be drawn. Both are dropped here and
    // reported as errors by validatePlateSpec.
    if (!a || !b || a.role === "sealed" || b.role === "sealed") continue;
    const ax = a.x + a.w;
    const ay = a.y + a.h / 2;
    const bx = b.x;
    const by = b.y + b.h / 2;
    const d =
      ay === by
        ? `M${round(ax)} ${round(ay)} H${round(bx)}`
        : `M${round(ax)} ${round(ay)} C${round(ax + (bx - ax) / 2)} ${round(ay)},${round(ax + (bx - ax) / 2)} ${round(by)},${round(bx)} ${round(by)}`;
    links.push({
      id: linkId(link.from, link.to),
      d,
      weight: link.weight ?? "primary",
      kind: link.kind ?? "sanctioned",
    });
  }

  return { zones: placed, links, ticks: ticksFor(spec.plateId), frame: { ...FRAME } };
}

function round(n: number): number {
  // Fixed precision keeps generated path data byte-stable across platforms.
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Label fitting
// ---------------------------------------------------------------------------

/** Average advance width of the mono label face, as a fraction of font size.
 *  Deliberately conservative: over-estimating width makes the fit check fail
 *  early (a caught authoring error) rather than shipping collided text. */
export const MONO_ADVANCE_RATIO = 0.62;
export const ZONE_LABEL_FONT_SIZE = 11;
/** Horizontal breathing room inside a zone, total across both edges. */
export const ZONE_LABEL_PADDING = 14;
/** Labels wrap to at most two lines; a third would collide with the sublabel. */
export const MAX_LABEL_LINES = 2;

export function estimateTextWidth(text: string, fontSize = ZONE_LABEL_FONT_SIZE): number {
  return text.length * fontSize * MONO_ADVANCE_RATIO;
}

/**
 * Greedy word wrap to at most `maxLines`, fitting `maxWidth` user units.
 * Pure and deterministic. Returns the lines it produced; the caller checks
 * `fitsLabel` to learn whether they actually fit, because a single word longer
 * than the zone cannot be wrapped and must be an authoring error rather than
 * silently overflowing text.
 */
export function wrapPlateLabel(label: string, maxWidth: number, maxLines = MAX_LABEL_LINES): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && estimateTextWidth(candidate) > maxWidth && lines.length < maxLines - 1) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  lines.push(current);
  return lines.slice(0, maxLines);
}

/** Sublabels render one step down; measuring them at the label size would
 *  reject copy that actually fits. */
export const ZONE_SUBLABEL_FONT_SIZE = 9;

/** True when every wrapped line fits inside the available width. */
export function fitsLabel(label: string, zoneWidth: number, fontSize = ZONE_LABEL_FONT_SIZE): boolean {
  const maxWidth = zoneWidth - ZONE_LABEL_PADDING;
  if (maxWidth <= 0) return false;
  // Sublabels are single-line in the renderer, so they get no wrap budget.
  const lines =
    fontSize === ZONE_LABEL_FONT_SIZE ? wrapPlateLabel(label, maxWidth) : [label];
  return lines.every((line) => estimateTextWidth(line, fontSize) <= maxWidth);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Structural validation. Returns a list of human-readable problems; an empty
 * array means the spec is renderable. Called by the test suite for every
 * registered plate so a malformed spec fails CI rather than shipping a broken
 * frame.
 */
export function validatePlateSpec(spec: PlateSpec): string[] {
  const errors: string[] = [];
  const where = `plate "${spec.plateId}"`;

  if (!spec.plateId.trim()) errors.push("plateId must not be empty");
  if (!spec.title.trim()) errors.push(`${where}: title is required (SVG <title>)`);
  if (!spec.desc.trim()) errors.push(`${where}: desc is required — every plate needs a text equivalent`);
  if (!spec.caption.trim()) errors.push(`${where}: caption is required`);

  const range = ARCHETYPE_ZONE_RANGE[spec.archetype];
  if (!range) {
    errors.push(`${where}: unknown archetype "${spec.archetype}"`);
  } else if (spec.zones.length < range.min || spec.zones.length > range.max) {
    errors.push(
      `${where}: archetype "${spec.archetype}" supports ${range.min}-${range.max} zones, got ${spec.zones.length}`,
    );
  }

  const seen = new Set<string>();
  for (const z of spec.zones) {
    if (seen.has(z.id)) errors.push(`${where}: duplicate zone id "${z.id}"`);
    seen.add(z.id);
    if (!z.label.trim()) errors.push(`${where}: zone "${z.id}" needs a label`);
    if (!z.shortLabel.trim()) errors.push(`${where}: zone "${z.id}" needs a shortLabel for phone width`);
    if (z.shortLabel.length > SHORT_LABEL_MAX) {
      errors.push(
        `${where}: zone "${z.id}" shortLabel "${z.shortLabel}" exceeds ${SHORT_LABEL_MAX} chars and will overflow at phone width`,
      );
    }
  }

  for (const link of spec.links ?? []) {
    if (!seen.has(link.from)) errors.push(`${where}: link from unknown zone "${link.from}"`);
    if (!seen.has(link.to)) errors.push(`${where}: link to unknown zone "${link.to}"`);
    const from = spec.zones.find((z) => z.id === link.from);
    const to = spec.zones.find((z) => z.id === link.to);
    // The load-bearing rule of the whole language: a sealed boundary has no
    // path touching it. A spec that draws one is asserting the opposite of
    // what the geometry claims.
    if (from?.role === "sealed" || to?.role === "sealed") {
      errors.push(
        `${where}: link ${link.from}->${link.to} touches a sealed zone; a sealed boundary must have no path crossing it`,
      );
    }
  }

  // Labels must physically fit their zone. Without this the renderer happily
  // paints text straight through its own box and into the neighbouring zone,
  // which is invisible to every other check in the suite.
  if (errors.length === 0) {
    for (const placed of layoutPlate(spec).zones) {
      if (!fitsLabel(placed.label, placed.w)) {
        const lines = wrapPlateLabel(placed.label, placed.w - ZONE_LABEL_PADDING);
        errors.push(
          `${where}: zone "${placed.id}" label ${JSON.stringify(placed.label)} does not fit ${Math.round(placed.w)}px even wrapped to ${lines.length} line(s) — shorten it or reduce the zone count`,
        );
      }
      if (placed.sublabel && !fitsLabel(placed.sublabel, placed.w, ZONE_SUBLABEL_FONT_SIZE)) {
        errors.push(
          `${where}: zone "${placed.id}" sublabel ${JSON.stringify(placed.sublabel)} does not fit ${Math.round(placed.w)}px`,
        );
      }
    }
  }

  if (spec.archetype === "sealed-enclosure" && !spec.zones.some((z) => z.role === "sealed")) {
    errors.push(`${where}: archetype "sealed-enclosure" requires exactly one zone with role "sealed"`);
  }
  if (spec.zones.filter((z) => z.role === "sealed").length > 1 && spec.archetype === "sealed-enclosure") {
    errors.push(`${where}: archetype "sealed-enclosure" supports only one sealed zone`);
  }

  return errors;
}
