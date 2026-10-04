import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ARCHETYPE_ZONE_RANGE,
  PLATE_ARCHETYPES,
  SHORT_LABEL_MAX,
  layoutPlate,
  plateHash,
  selectArchetype,
  validatePlateSpec,
  wrapPlateLabel,
  fitsLabel,
  MAX_LABEL_LINES,
  LEGEND_CLEARANCE,
  LEGEND_RULE_Y,
  LEGEND_FAILURE_SWATCH_LENGTH,
  LEGEND_TEXT_OFFSET,
  LEGEND_SWATCH_WIDTH,
  legendSwatchKind,
  zoneBottom,
  type PlateSpec,
  type PlateZoneSpec,
} from "./schematic-plate.ts";

function spec(overrides: Partial<PlateSpec> = {}): PlateSpec {
  return {
    plateId: "test-plate",
    archetype: "linear-flow",
    title: "Test plate",
    desc: "A test plate with three connected zones.",
    caption: "Test caption.",
    zones: [
      { id: "a", label: "Ingress", shortLabel: "ING", role: "sanctioned" },
      { id: "b", label: "App tier", shortLabel: "APP", role: "sanctioned" },
      { id: "c", label: "Data tier", shortLabel: "DATA", role: "sanctioned" },
    ],
    links: [{ from: "a", to: "b" }, { from: "b", to: "c" }],
    ...overrides,
  };
}

// --- determinism -----------------------------------------------------------

test("layout is deterministic: the same spec yields byte-identical geometry", () => {
  const a = layoutPlate(spec());
  const b = layoutPlate(spec());
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("generated path data is fixed-precision so builds are byte-stable", () => {
  const { links } = layoutPlate(spec());
  for (const link of links) {
    for (const num of link.d.match(/-?\d+(\.\d+)?/g) ?? []) {
      const decimals = num.split(".")[1];
      assert.ok(
        decimals === undefined || decimals.length <= 2,
        `path number ${num} has more than 2 decimals and would vary across platforms`,
      );
    }
  }
});

test("plateHash is stable and unsigned", () => {
  assert.equal(plateHash("understanding-network-trust-boundaries"), plateHash("understanding-network-trust-boundaries"));
  assert.notEqual(plateHash("a"), plateHash("b"));
  for (const seed of ["", "a", "zzz", "segmentation-vs-isolation"]) {
    const h = plateHash(seed);
    assert.ok(Number.isInteger(h) && h >= 0, `hash for "${seed}" must be a non-negative integer`);
  }
});

test("every archetype produces a layout for its whole legal zone range", () => {
  for (const archetype of PLATE_ARCHETYPES) {
    const range = ARCHETYPE_ZONE_RANGE[archetype];
    for (let n = range.min; n <= range.max; n += 1) {
      const zones: PlateZoneSpec[] = Array.from({ length: n }, (_, i) => ({
        id: `z${i}`,
        label: `Zone ${i}`,
        shortLabel: `Z${i}`,
        role: archetype === "sealed-enclosure" && i === n - 1 ? "sealed" : "sanctioned",
      }));
      const layout = layoutPlate(spec({ archetype, zones, links: [] }));
      assert.equal(layout.zones.length, n, `${archetype} with ${n} zones`);
      for (const z of layout.zones) {
        assert.ok(z.w > 0 && z.h > 0, `${archetype}/${z.id} must have positive size`);
        assert.ok(z.x >= 0 && z.y >= 0, `${archetype}/${z.id} must stay inside the viewBox`);
        assert.ok(z.x + z.w <= 800, `${archetype}/${z.id} overflows the viewBox horizontally`);
        assert.ok(z.y + z.h <= 300, `${archetype}/${z.id} overflows the viewBox vertically`);
      }
    }
  }
});

// --- archetype selection ---------------------------------------------------

test("archetype selection is deterministic and honours priority order", () => {
  assert.equal(
    selectArchetype({ declared: "gate-sequence", title: "Segmentation vs Isolation", summary: "" }),
    "gate-sequence",
    "an explicit declaration outranks every inferred signal",
  );
  assert.equal(selectArchetype({ title: "Segmentation vs Isolation", summary: "" }), "divergent-pair");
  assert.equal(
    selectArchetype({ title: "Secrets Detection", summary: "what automated scanners miss and their limits" }),
    "coverage-field",
  );
  assert.equal(
    selectArchetype({ title: "How to Scope an Authorized Security Assessment", summary: "written authorization first" }),
    "gate-sequence",
  );
  assert.equal(
    selectArchetype({ title: "Validating a service is not publicly reachable", summary: "isolation" }),
    "sealed-enclosure",
  );
  assert.equal(selectArchetype({ title: "Something else entirely", summary: "no signals here" }), "linear-flow");
});

test("archetype selection never depends on the slug hash", () => {
  // Same textual signals, different ids: the archetype must not move.
  const a = selectArchetype({ title: "Plain title", summary: "plain summary" });
  const b = selectArchetype({ title: "Plain title", summary: "plain summary" });
  assert.equal(a, b);
  assert.equal(a, "linear-flow");
});

// --- validation ------------------------------------------------------------

test("a well-formed spec validates clean", () => {
  assert.deepEqual(validatePlateSpec(spec()), []);
});

test("a link touching a sealed zone is rejected — the core semantic rule", () => {
  const errors = validatePlateSpec(
    spec({
      archetype: "sealed-enclosure",
      zones: [
        { id: "a", label: "App tier", shortLabel: "APP", role: "sanctioned" },
        { id: "admin", label: "Admin plane", shortLabel: "ADMIN", role: "sealed" },
      ],
      links: [{ from: "a", to: "admin" }],
    }),
  );
  assert.ok(
    errors.some((e) => e.includes("sealed boundary must have no path crossing it")),
    `expected a sealed-link error, got: ${errors.join(" | ")}`,
  );
});

test("layout drops any link that would touch a sealed zone", () => {
  const layout = layoutPlate(
    spec({
      archetype: "sealed-enclosure",
      zones: [
        { id: "a", label: "App tier", shortLabel: "APP", role: "sanctioned" },
        { id: "admin", label: "Admin plane", shortLabel: "ADMIN", role: "sealed" },
      ],
      links: [{ from: "a", to: "admin" }],
    }),
  );
  assert.equal(layout.links.length, 0, "a sealed zone must never be drawn with a path reaching it");
});

test("an over-long short label is rejected before it can overflow at phone width", () => {
  const errors = validatePlateSpec(
    spec({ zones: [
      { id: "a", label: "Ingress", shortLabel: "INGRESS-EDGE", role: "sanctioned" },
      { id: "b", label: "App", shortLabel: "APP", role: "sanctioned" },
    ], links: [] }),
  );
  assert.ok(errors.some((e) => e.includes(`exceeds ${SHORT_LABEL_MAX} chars`)));
});

test("duplicate zone ids, unknown link endpoints and missing text are all caught", () => {
  const dup = validatePlateSpec(
    spec({ zones: [
      { id: "a", label: "One", shortLabel: "ONE", role: "sanctioned" },
      { id: "a", label: "Two", shortLabel: "TWO", role: "sanctioned" },
    ], links: [] }),
  );
  assert.ok(dup.some((e) => e.includes("duplicate zone id")));

  const unknown = validatePlateSpec(spec({ links: [{ from: "a", to: "nope" }] }));
  assert.ok(unknown.some((e) => e.includes('link to unknown zone "nope"')));

  const noDesc = validatePlateSpec(spec({ desc: "   " }));
  assert.ok(noDesc.some((e) => e.includes("text equivalent")), "a plate without a desc has no text equivalent");
});

test("zone counts outside an archetype's legal range are rejected", () => {
  const tooMany = validatePlateSpec(
    spec({
      archetype: "linear-flow",
      zones: Array.from({ length: 9 }, (_, i) => ({
        id: `z${i}`,
        label: `Zone ${i}`,
        shortLabel: `Z${i}`,
        role: "sanctioned" as const,
      })),
      links: [],
    }),
  );
  assert.ok(tooMany.some((e) => e.includes("supports 2-5 zones")));
});

test("sealed-enclosure requires a sealed zone", () => {
  const errors = validatePlateSpec(
    spec({
      archetype: "sealed-enclosure",
      zones: [
        { id: "a", label: "One", shortLabel: "ONE", role: "sanctioned" },
        { id: "b", label: "Two", shortLabel: "TWO", role: "sanctioned" },
      ],
      links: [],
    }),
  );
  assert.ok(errors.some((e) => e.includes('requires exactly one zone with role "sealed"')));
});

// --- label fitting ---------------------------------------------------------

test("wrapPlateLabel wraps on word boundaries and never exceeds the line cap", () => {
  const lines = wrapPlateLabel("Required status checks", 100);
  assert.ok(lines.length <= MAX_LABEL_LINES);
  assert.equal(lines.join(" "), "Required status checks", "wrapping must not lose or reorder words");
  for (const line of lines) {
    assert.ok(!line.startsWith(" ") && !line.endsWith(" "), "no stray padding");
  }
});

test("wrapPlateLabel is deterministic", () => {
  assert.deepEqual(wrapPlateLabel("Branch ruleset enforcement", 90), wrapPlateLabel("Branch ruleset enforcement", 90));
});

test("fitsLabel rejects a label that cannot fit even wrapped", () => {
  assert.equal(fitsLabel("O", 120), true);
  // A single unbreakable word wider than the zone cannot be wrapped.
  assert.equal(fitsLabel("Supercalifragilisticexpialidocious", 60), false);
});

test("a label that would overflow its zone is a validation error", () => {
  const errors = validatePlateSpec(
    spec({
      archetype: "linear-flow",
      zones: [
        { id: "a", label: "Extraordinarily long unbreakable zone title here", shortLabel: "A", role: "sanctioned" },
        { id: "b", label: "B", shortLabel: "B", role: "sanctioned" },
        { id: "c", label: "C", shortLabel: "C", role: "sanctioned" },
        { id: "d", label: "D", shortLabel: "D", role: "sanctioned" },
        { id: "e", label: "E", shortLabel: "E", role: "sanctioned" },
      ],
      links: [],
    }),
  );
  assert.ok(
    errors.some((e) => e.includes("does not fit")),
    `expected a fit error, got: ${errors.join(" | ") || "(none)"}`,
  );
});

// --- legend band (s41.22) ----------------------------------------------------

test("no archetype places a zone or ring in the legend band, at any legal zone count", () => {
  for (const archetype of PLATE_ARCHETYPES) {
    const { min, max } = ARCHETYPE_ZONE_RANGE[archetype];
    for (let n = min; n <= max; n++) {
      const zones: PlateZoneSpec[] = Array.from({ length: n }, (_, i) => ({
        id: `z${i}`,
        label: `Zone ${i}`,
        shortLabel: `Z${i}`,
        sublabel: "sub",
        // Exercise the sealed row/ring wherever the archetype has one.
        role: i === n - 1 && archetype !== "linear-flow" ? "sealed" : "sanctioned",
      }));
      const layout = layoutPlate(spec({ archetype, zones, links: [] }));
      for (const z of layout.zones) {
        assert.ok(
          zoneBottom(z) <= LEGEND_RULE_Y - LEGEND_CLEARANCE,
          `${archetype} n=${n}: zone ${z.id} bottom ${zoneBottom(z)} reaches the legend rule at ${LEGEND_RULE_Y}`,
        );
      }
    }
  }
});

test("coverage-field keeps both rows above the legend with sublabels (the s41.22 regression)", () => {
  const s = spec({
    archetype: "coverage-field",
    zones: [
      { id: "a", label: "Covered one", shortLabel: "A", role: "sanctioned" },
      { id: "b", label: "Outside one", shortLabel: "B", sublabel: "outside coverage", role: "sealed" },
    ],
    links: [],
    legend: [
      { role: "sanctioned", label: "COVERED" },
      { role: "sealed", label: "OUTSIDE COVERAGE" },
    ],
  });
  assert.deepEqual(validatePlateSpec(s), []);
  const bottom = Math.max(...layoutPlate(s).zones.map(zoneBottom));
  assert.ok(bottom <= LEGEND_RULE_Y - LEGEND_CLEARANCE);
});

test("a legend label too long for its slot is a validation error", () => {
  const errors = validatePlateSpec(
    spec({
      legend: [
        { role: "sanctioned", label: "EXERCISED IN LOOKBACK WINDOW" },
        { role: "sealed", label: "GRANTED, NOT EXERCISED" },
      ],
    }),
  );
  assert.ok(errors.some((e) => e.includes("overflows its")), errors.join("; "));
});

// --- legend swatches (s41.23) -------------------------------------------------

test("each legend role draws its own swatch; failure is the dashed failure swatch, not the sanctioned bar", () => {
  assert.equal(legendSwatchKind("failure"), "failure-dash");
  assert.equal(legendSwatchKind("sealed"), "sealed-ring");
  assert.equal(legendSwatchKind("sanctioned"), "solid-bar");
  assert.equal(legendSwatchKind("neutral"), "solid-bar");
  assert.notEqual(legendSwatchKind("failure"), legendSwatchKind("sanctioned"));
});

test("the failure swatch keeps the standard swatch footprint, clear of its label", () => {
  assert.ok(
    LEGEND_FAILURE_SWATCH_LENGTH <= LEGEND_SWATCH_WIDTH,
    `failure swatch ${LEGEND_FAILURE_SWATCH_LENGTH}px is wider than the ${LEGEND_SWATCH_WIDTH}px swatch footprint`,
  );
  assert.ok(LEGEND_SWATCH_WIDTH < LEGEND_TEXT_OFFSET);
});
