import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProjects, projectInputs, projects } from "./content.ts";
import { buildSystemsUnderTest, observationNote } from "./systems-under-test.ts";
import { summarizeEvidence } from "./evidence.ts";

const inputsWith = (index: string, mutate: (p: Record<string, unknown>) => void): unknown[] =>
  projectInputs.map((p) => {
    const c = structuredClone(p) as unknown as Record<string, unknown>;
    if (p.index === index) mutate(c);
    return c;
  });

const model = buildSystemsUnderTest(projects);
const row = (index: string) => {
  const r = model.rows.find((x) => x.index === index);
  assert.ok(r, index);
  return r;
};

test("one row per project, in project order, from the authoritative data", () => {
  assert.deepEqual(model.rows.map((r) => r.index), projects.map((p) => p.index));
});

test("rows expose the verified distribution, never a single project-wide maturity", () => {
  const expected: Record<string, [string, string[]]> = {
    "P-01": ["1 Validated · 4 Documented", ["1 Validated", "4 Documented"]],
    "P-02": ["1 Validated · 2 Documented", ["1 Validated", "2 Documented"]],
    "P-03": ["1 Documented", ["1 Documented"]],
    "P-04": ["1 Design", ["1 Design"]],
  };
  for (const [index, [summary, labels]] of Object.entries(expected)) {
    const r = row(index);
    assert.equal(r.evidenceSummary, summary, index);
    assert.deepEqual(r.evidence?.map((p) => p.label), labels, index);
  }
  for (const r of model.rows) assert.equal("maturity" in r, false, `${r.index} must not carry an aggregate maturity`);
});

test("records carry claim, maturity, and observation kind — never observed result text", () => {
  const p01 = row("P-01");
  assert.equal(p01.recordsLabel, "5 failure paths");
  assert.deepEqual(p01.records.map((r) => [r.maturity, r.observation]), [
    ["documented", "reported"],
    ["validated", "recorded"],
    ["documented", "reported"],
    ["documented", "reported"],
    ["documented", "reported"],
  ]);
  for (const r of model.rows.flatMap((x) => x.records)) {
    assert.deepEqual(Object.keys(r).sort(), ["claim", "maturity", "observation"]);
  }
  assert.equal(row("P-02").recordsLabel, "3 evidence records");
  assert.deepEqual(row("P-03").records.map((r) => [r.maturity, r.observation]), [["documented", "none"]]);
  assert.equal(row("P-04").recordsLabel, "1 evidence record");
});

test("observation notes distinguish recorded / reported / none without implying an outcome", () => {
  assert.match(observationNote.recorded, /recorded observed result/i);
  assert.match(observationNote.reported, /no recorded result/i);
  assert.match(observationNote.none, /no execution result/i);
  for (const note of Object.values(observationNote)) assert.doesNotMatch(note, /pass|fail|success|verified|partial/i, note);
});

test("operational column is omitted entirely when no project has a sourced state", () => {
  assert.equal(model.showOperational, false);
  for (const r of model.rows) assert.equal(r.operational, undefined, r.index);
});

test("a sourced operational state appears for that row only, separate from evidence", () => {
  const { projects: built } = buildProjects(
    inputsWith("P-04", (p) => (p.operationalState = { state: "in-service", asOf: "2026-09-01", source: "test fixture" })),
  );
  const m = buildSystemsUnderTest(built);
  assert.equal(m.showOperational, true);
  const p04 = m.rows.find((r) => r.index === "P-04");
  assert.deepEqual(p04?.operational, { label: "In service", asOf: "Sep 1, 2026" });
  assert.equal(p04?.evidenceSummary, "1 Design", "operational state does not change evidence");
  assert.equal(m.rows.find((r) => r.index === "P-01")?.operational, undefined);
});

test("unverified evidence renders as unavailable, not as any maturity", () => {
  const { projects: built } = buildProjects(
    inputsWith("P-03", (p) => {
      (p.evidence as { records: Record<string, unknown>[] }).records[0].maturity = "validated";
    }),
  );
  const p03 = buildSystemsUnderTest(built).rows.find((r) => r.index === "P-03");
  assert.equal(p03?.evidence, null);
  assert.equal(p03?.evidenceSummary, "Evidence unavailable");
  assert.deepEqual(p03?.records, []);
});

test("links point at existing routes with meaningful labels; no link is invented", () => {
  assert.deepEqual(row("P-01").link, { href: "/projects/fail-closed-file-intake", label: "Case study" });
  assert.deepEqual(row("P-02").link, { href: "/guides/vpn-bound-container-stack", label: "Guide" });
  assert.deepEqual(row("P-03").link, { href: "/guides/reverse-proxy-home-lab", label: "Guide" });
  assert.equal(row("P-04").link, undefined);
});

test("the view model is frozen end to end", () => {
  assert.ok(Object.isFrozen(model) && Object.isFrozen(model.rows));
  for (const r of model.rows) {
    assert.ok(Object.isFrozen(r) && Object.isFrozen(r.records), r.index);
    assert.throws(() => ((r as { evidenceSummary: string }).evidenceSummary = "1 Validated"));
  }
  assert.equal(summarizeEvidence(projects[2].evidence), "1 Documented");
});
