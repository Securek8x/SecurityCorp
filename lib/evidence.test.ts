import { test } from "node:test";
import assert from "node:assert/strict";
import * as evidenceApi from "./evidence.ts";
import {
  checkProjectEvidence,
  describeEvidenceRecord,
  evidenceDistributionParts,
  evidenceDistribution,
  findEvidenceRecord,
  isVerifiedEvidence,
  observationRows,
  outcomeBadge,
  summarizeEvidence,
  verifyProjectEvidence,
  type EvidenceRecord,
  type VerifiedEvidence,
} from "./evidence.ts";
import { buildProjects, projectInputs, projectIntegrityErrors, projects, type Project } from "./content.ts";
import { controlScenarios, failurePathLabel, resolveControlScenarios, resolveScenarioEvidence, type ScenarioEvidence } from "./control-under-test.ts";
import { buildLog } from "./build-log.ts";
import { projectEvidenceManifest } from "./build-info.ts";

// Helpers ------------------------------------------------------------------

const clone = <T,>(v: T): T => structuredClone(v);
const inputsWith = (index: string, mutate: (p: Record<string, unknown>) => void): unknown[] =>
  projectInputs.map((p) => {
    const c = clone(p) as unknown as Record<string, unknown>;
    if (p.index === index) mutate(c);
    return c;
  });
const recordsOf = (p: Record<string, unknown>) => (p.evidence as { records: Record<string, unknown>[] }).records;
const project = (list: Project[], index: string) => {
  const p = list.find((x) => x.index === index);
  assert.ok(p, `missing project ${index}`);
  return p;
};
const verifiedRecords = (p: Project): readonly EvidenceRecord[] => {
  assert.ok(isVerifiedEvidence(p.evidence), `${p.index} evidence is not verified`);
  return p.evidence.records;
};
/** Everything a reader sees for a project: badge text + Failure Lab verdicts. */
function renderedMaturityClaims(list: Project[]): string[] {
  const badges = list.map((p) => summarizeEvidence(p.evidence));
  const lab = resolveControlScenarios(controlScenarios, list).map((s) =>
    s.evidence.status === "resolved" ? s.evidence.maturity : "unavailable",
  );
  return [...badges, ...lab];
}
const validRecord = { id: "a", claim: "a claim", maturity: "documented", observation: { kind: "none" } };

// --- Fail-closed boundary ---------------------------------------------------

test("unknown maturity is rejected and can never render as Validated (through buildProjects)", () => {
  const { projects: built, errors } = buildProjects(
    inputsWith("P-02", (p) => {
      recordsOf(p)[2].maturity = "operational";
    }),
  );
  assert.ok(errors.some((e) => e.includes('invalid maturity "operational"')));
  const p02 = project(built, "P-02");
  assert.equal(isVerifiedEvidence(p02.evidence), false);
  assert.equal(summarizeEvidence(p02.evidence), "Evidence unavailable");
  const kill = resolveControlScenarios(controlScenarios, built).find((s) => s.evidenceRef.projectIndex === "P-02");
  assert.equal(kill?.evidence.status, "unavailable");
});

test("malformed runtime shapes fail closed instead of throwing or upgrading", () => {
  const bad: unknown[] = [
    null,
    undefined,
    "validated",
    42,
    [],
    { records: null },
    { records: "validated" },
    { records: [null] },
    { records: [{ ...validRecord, id: 7 }] },
    { records: [{ ...validRecord, claim: ["x"] }] },
    { records: [{ ...validRecord, maturity: null }] },
    { records: [{ ...validRecord, maturity: "VALIDATED" }] },
    { records: [{ ...validRecord, observation: null }] },
    { records: [{ ...validRecord, observation: { kind: "observed" } }] },
    { records: [{ ...validRecord, maturity: "validated", observation: { kind: "recorded", result: 1, outcome: "as-intended" } }] },
    { records: [{ ...validRecord, maturity: "validated", observation: { kind: "recorded", result: "ok", outcome: "passed" } }] },
    { records: [validRecord, validRecord] },
    { unit: 5, records: [validRecord] },
  ];
  for (const raw of bad) {
    const result = verifyProjectEvidence("X", raw);
    assert.equal(result.ok, false, JSON.stringify(raw));
    const checked = checkProjectEvidence("X", raw);
    assert.equal(summarizeEvidence(checked), "Evidence unavailable", JSON.stringify(raw));
    assert.deepEqual(evidenceDistribution(checked), { available: false });
  }
});

test("validated without a valid recorded observed result is rejected", () => {
  for (const observation of [
    { kind: "none" },
    { kind: "reported", note: "Reported as exercised." },
    { kind: "recorded", result: "   ", outcome: "as-intended" },
    { kind: "recorded", result: "ok" },
    undefined,
  ]) {
    const r = verifyProjectEvidence("X", { records: [{ ...validRecord, maturity: "validated", observation }] });
    assert.equal(r.ok, false, JSON.stringify(observation));
  }
});

test("a recorded result on a non-validated record is rejected as inconsistent", () => {
  const r = verifyProjectEvidence("X", {
    records: [{ ...validRecord, maturity: "documented", observation: { kind: "recorded", result: "seen", outcome: "as-intended" } }],
  });
  assert.equal(r.ok, false);
});

test("forged (cast) evidence is not verified and renders as unavailable", () => {
  const forged = {
    records: [{ id: "x", claim: "x", maturity: "validated", observation: { kind: "none" } }],
  } as unknown as VerifiedEvidence;
  assert.equal(isVerifiedEvidence(forged), false);
  assert.equal(summarizeEvidence(forged), "Evidence unavailable");
  assert.equal(findEvidenceRecord(forged, "x"), undefined);
  assert.equal(outcomeBadge(forged).label, "Evidence unavailable");
});

test("verified evidence is a frozen copy: later mutation of input or output can't upgrade it", () => {
  const raw = { records: [{ ...validRecord, observation: { kind: "none" } }] };
  const result = verifyProjectEvidence("X", raw);
  assert.ok(result.ok);
  (raw.records[0] as Record<string, unknown>).maturity = "validated";
  assert.equal(summarizeEvidence(result.evidence), "1 Documented");
  assert.throws(() => {
    (result.evidence.records[0] as { maturity: string }).maturity = "validated";
  });
});

test("operational state without a valid source or date is rejected and yields no claim", () => {
  for (const operationalState of [
    { state: "running", asOf: "2026-09-01" },
    { state: "running", asOf: "Sep 1, 2026", source: "runbook" },
    { state: "operational", asOf: "2026-09-01", source: "runbook" },
    { state: "running", asOf: "2026-09-01", source: 3 },
    null,
    "running",
  ]) {
    const { projects: built, errors } = buildProjects(inputsWith("P-03", (p) => (p.operationalState = operationalState)));
    assert.ok(errors.length > 0, JSON.stringify(operationalState));
    assert.equal(project(built, "P-03").operationalState, undefined, JSON.stringify(operationalState));
    // Operational data never affects evidence.
    assert.equal(summarizeEvidence(project(built, "P-03").evidence), "1 Documented");
  }
});

test("a valid, sourced operational state is independent of evidence maturity", () => {
  const { projects: built, errors } = buildProjects(
    inputsWith("P-04", (p) => (p.operationalState = { state: "running", asOf: "2026-09-01", source: "test fixture" })),
  );
  assert.deepEqual(errors, []);
  const p04 = project(built, "P-04");
  assert.equal(p04.operationalState?.state, "running");
  assert.equal(summarizeEvidence(p04.evidence), "1 Design", "Running does not imply Validated");
});

test("non-object project entries are excluded with an error, not thrown or rendered", () => {
  const { projects: built, errors } = buildProjects([null, "P-09", { title: "no index" }, ...projectInputs]);
  assert.equal(built.length, projectInputs.length);
  assert.equal(errors.length, 3);
});

// --- Maturity vs. outcome -----------------------------------------------------

test("a recorded failed outcome is still Validated evidence and never reads as passed", () => {
  const { projects: built, errors } = buildProjects(
    inputsWith("P-02", (p) => {
      recordsOf(p)[2].observation = { kind: "recorded", result: "Outbound access continued via the host route.", outcome: "failed" };
    }),
  );
  assert.deepEqual(errors, []);
  const p02 = project(built, "P-02");
  assert.equal(summarizeEvidence(p02.evidence), "1 Validated · 2 Documented");
  const badge = outcomeBadge(p02.evidence);
  assert.equal(badge.tone, "failed");
  assert.match(badge.label, /1 failed/);
  assert.doesNotMatch(badge.label, /pass/i);
  const lab = resolveControlScenarios(controlScenarios, built).find((s) => s.id === "vpn-tunnel-stopped");
  assert.deepEqual(lab?.evidence, { status: "resolved", maturity: "validated", observed: "Outbound access continued via the host route.", outcome: "failed" });
});

test("outcome badge derives only from explicit outcomes, not from maturity", () => {
  const allValidated = checkProjectEvidence("X", {
    records: [
      { id: "a", claim: "a", maturity: "validated", observation: { kind: "recorded", result: "r", outcome: "as-intended" } },
      { id: "b", claim: "b", maturity: "validated", observation: { kind: "recorded", result: "r", outcome: "as-intended" } },
    ],
  });
  assert.deepEqual(outcomeBadge(allValidated), { label: "2 as intended", tone: "passed" });
  const documentedOnly = checkProjectEvidence("X", { records: [validRecord] });
  assert.deepEqual(outcomeBadge(documentedOnly), { label: "1 without recorded result", tone: "planned" });
  assert.deepEqual(outcomeBadge(project(projects, "P-01").evidence), { label: "1 as intended · 4 without recorded result", tone: "partial" });
});

// --- Distribution, not aggregate ------------------------------------------------

test("mixed evidence exposes a distribution with no project-wide maturity", () => {
  const d = evidenceDistribution(project(projects, "P-01").evidence);
  assert.ok(d.available);
  assert.equal(d.uniform, null);
  assert.equal(d.total, 5);
  assert.equal(d.unit, "failure path");
  assert.deepEqual(d.counts, { validated: 1, documented: 4, design: 0 });
  const p03 = evidenceDistribution(project(projects, "P-03").evidence);
  assert.ok(p03.available);
  assert.equal(p03.uniform, "documented");
});

test("empty verified evidence says so rather than implying any maturity", () => {
  assert.equal(summarizeEvidence(checkProjectEvidence("X", { records: [] })), "No evidence recorded");
});

// --- Failure Lab source of truth -------------------------------------------------

test("broken Failure Lab references fail safe, never stronger", () => {
  const scenario = controlScenarios[0];
  for (const evidenceRef of [
    { projectIndex: "P-99", recordId: "scanner-outage" },
    { projectIndex: "P-01", recordId: "does-not-exist" },
    { projectIndex: "P-01", recordId: "" },
  ]) {
    assert.equal(resolveScenarioEvidence({ ...scenario, evidenceRef }, projects).status, "unavailable", JSON.stringify(evidenceRef));
  }
  const withMissingRef = { ...scenario, evidenceRef: undefined as unknown as typeof scenario.evidenceRef };
  assert.equal(resolveScenarioEvidence(withMissingRef, projects).status, "unavailable");
});

test("changes to the authoritative record propagate to the Failure Lab", () => {
  const { projects: demoted } = buildProjects(
    inputsWith("P-01", (p) => {
      const r = recordsOf(p).find((x) => x.id === "scanner-outage")!;
      r.maturity = "documented";
      r.observation = { kind: "reported", note: "Reported as exercised." };
    }),
  );
  const lab = resolveControlScenarios(controlScenarios, demoted).find((s) => s.id === "scanner-unavailable");
  assert.equal(lab?.evidence.status, "resolved");
  assert.equal(lab?.evidence.status === "resolved" && lab.evidence.maturity, "documented");
  assert.match(lab?.evidence.status === "resolved" ? lab.evidence.observed : "", /No observed result was recorded/);
});

test("scenarios store no maturity or observed text of their own", () => {
  for (const s of controlScenarios) {
    assert.equal("evidenceMaturity" in s, false, s.id);
    assert.equal("observed" in s, false, s.id);
  }
});

test("every real Failure Lab scenario resolves to its project record", () => {
  for (const s of resolveControlScenarios(controlScenarios, projects)) {
    const record = findEvidenceRecord(project(projects, s.evidenceRef.projectIndex).evidence, s.evidenceRef.recordId);
    assert.ok(record, s.id);
    assert.equal(s.evidence.status, "resolved", s.id);
    assert.equal(s.evidence.status === "resolved" && s.evidence.maturity, record.maturity, s.id);
  }
});

// --- Real project data ---------------------------------------------------------

test("all real project data passes the construction boundary", () => {
  assert.deepEqual(projectIntegrityErrors, []);
  for (const p of projects) assert.ok(isVerifiedEvidence(p.evidence), p.index);
});

test("no project carries an operational state without authoritative support", () => {
  // The legacy "Operational" status had no recorded operational source
  // (s41.20.5). Adding one requires a dated source — update this test then.
  for (const p of projects) assert.equal(p.operationalState, undefined, p.index);
});

test("P-01: 1 Validated · 4 Documented across 5 failure paths; scanner outage is the only recorded result", () => {
  const p = project(projects, "P-01");
  assert.equal(summarizeEvidence(p.evidence), "1 Validated · 4 Documented");
  const records = verifiedRecords(p);
  assert.equal(records.length, p.caseStudy?.failureModes.length);
  assert.deepEqual(records.filter((r) => r.maturity === "validated").map((r) => r.id), ["scanner-outage"]);
  // The four documented paths are individually addressable for later promotion (s41.20.9),
  // and kept as "reported" — neither upgraded to a result nor presented as never run.
  const documented = records.filter((r) => r.maturity === "documented");
  assert.deepEqual(documented.map((r) => r.id), ["incomplete-transfer", "malicious-test-file", "worker-race", "false-success-move"]);
  for (const r of documented) assert.equal(r.observation.kind, "reported", r.id);
});

test("P-01 Observed presentation excludes unrecorded outcomes and the design expectation", () => {
  const p = project(projects, "P-01");
  const rows = observationRows(p.evidence);
  const recorded = rows.filter((r) => r.kind === "recorded");
  assert.deepEqual(recorded.map((r) => r.text), ["A scanner outage was simulated deliberately and the release step never ran."]);
  for (const r of rows.filter((x) => x.kind !== "recorded")) assert.match(r.text, /No observed result was recorded/);
  const expectation = p.caseStudy?.designExpectation ?? "";
  assert.ok(expectation.length > 0);
  assert.ok(!rows.some((r) => r.text === expectation), "design expectation must not appear as an observation");
  // Case-study prose must not claim recorded results for all paths, nor imply the four never ran.
  assert.doesNotMatch(p.caseStudy?.validation ?? "", /were all tested|remain documented test designs/i);
  assert.match(p.caseStudy?.validation ?? "", /reported as exercised/i);
});

test("P-02 reconciled records: namespace sharing + egress Documented, kill switch Validated", () => {
  const p = project(projects, "P-02");
  const records = verifiedRecords(p);
  assert.deepEqual(
    records.map((r) => [r.id, r.maturity]),
    [["namespace-sharing", "documented"], ["egress-path", "documented"], ["kill-switch", "validated"]],
  );
  assert.equal(summarizeEvidence(p.evidence), "1 Validated · 2 Documented");
  assert.match(p.limitation, /hasn't been exercised against every possible VPN client crash mode/);
  assert.doesNotMatch(p.text, /restart/i);
});

test("P-03: rollback evidence is Documented with no recorded or reported execution", () => {
  const p = project(projects, "P-03");
  const rollback = findEvidenceRecord(p.evidence, "rollback");
  assert.equal(rollback?.maturity, "documented");
  assert.equal(rollback?.observation.kind, "none");
  assert.equal(summarizeEvidence(p.evidence), "1 Documented");
  const lab = resolveControlScenarios(controlScenarios, projects).find((s) => s.evidenceRef.projectIndex === "P-03");
  for (const text of [p.text, p.problem, p.limitation, lab?.evidence.status === "resolved" ? lab.evidence.observed : ""]) {
    assert.doesNotMatch(text, /tested rollback|rollback (was )?(tested|exercised|validated)/i);
  }
});

test("P-04 is Design through the same record model as every other project", () => {
  assert.equal(summarizeEvidence(project(projects, "P-04").evidence), "1 Design");
});

test("no rendered surface claims Validated for a project without all-validated records", () => {
  for (const claim of renderedMaturityClaims(projects)) assert.notEqual(claim, "Validated");
});

test("build-log entries make no evidence claims at all", () => {
  for (const e of buildLog) assert.doesNotMatch(`${e.type} ${e.title}`, /validated|documented|verified|confirmed/i, e.title);
});

// --- Build receipt ---------------------------------------------------------------

test("build-info manifest changes when evidence identity, maturity, outcome, or operational state changes", () => {
  const base = JSON.stringify(projectEvidenceManifest(projects));
  const variants = [
    buildProjects(inputsWith("P-02", (p) => (recordsOf(p)[0].id = "renamed"))).projects,
    buildProjects(inputsWith("P-02", (p) => {
      recordsOf(p)[2].observation = { kind: "recorded", result: "x", outcome: "failed" };
    })).projects,
    buildProjects(inputsWith("P-01", (p) => {
      recordsOf(p)[0].observation = { kind: "none" };
    })).projects,
    buildProjects(inputsWith("P-04", (p) => (p.operationalState = { state: "running", asOf: "2026-09-01", source: "s" }))).projects,
  ];
  for (const v of variants) assert.notEqual(JSON.stringify(projectEvidenceManifest(v)), base);
});

// --- Presentation boundary: bypass regressions (s41.20.25 verification) -------

test("raw formatters are not exported: only verified-evidence entry points exist", () => {
  const exported = Object.keys(evidenceApi);
  assert.equal(exported.includes("formatEvidenceDistribution"), false);
  assert.equal(exported.includes("describeObservation"), false);
});

test("a fabricated distribution cannot produce an authoritative claim", () => {
  const fabricated = { available: true, total: 1, counts: { validated: 1, documented: 0, design: 0 }, uniform: "validated" };
  // No public formatter accepts a distribution; the evidence-level entry
  // point treats the fabrication as unverified evidence.
  assert.equal(summarizeEvidence(fabricated), "Evidence unavailable");
  assert.deepEqual(evidenceDistribution(fabricated), { available: false });
  assert.equal(outcomeBadge(fabricated).label, "Evidence unavailable");
});

test("mutating a legitimately derived distribution cannot strengthen the rendered claim", () => {
  const p03 = project(projects, "P-03");
  const d = evidenceDistribution(p03.evidence) as { available: true; counts: Record<string, number>; uniform: string | null; total: number };
  assert.ok(Object.isFrozen(d) && Object.isFrozen(d.counts));
  assert.throws(() => (d.counts.validated = 1));
  assert.throws(() => (d.uniform = "validated"));
  assert.throws(() => (d.total = 9));
  assert.equal(summarizeEvidence(p03.evidence), "1 Documented");
  // Each call derives afresh from verified evidence.
  assert.notEqual(evidenceDistribution(p03.evidence), d);
});

test("derived rows, badges, record descriptions and Failure Lab evidence are frozen", () => {
  const p01 = project(projects, "P-01");
  const rows = observationRows(p01.evidence);
  assert.ok(Object.isFrozen(rows) && rows.every((r) => Object.isFrozen(r)));
  assert.throws(() => ((rows[0] as { kind: string }).kind = "recorded"));
  assert.ok(Object.isFrozen(outcomeBadge(p01.evidence)));
  const described = describeEvidenceRecord(p01.evidence, "incomplete-transfer");
  assert.ok(described && Object.isFrozen(described));
  assert.throws(() => ((described as { maturity: string }).maturity = "validated"));
  for (const s of resolveControlScenarios(controlScenarios, projects)) assert.ok(Object.isFrozen(s.evidence), s.id);
});

test("an unverified Documented record carrying fabricated recorded-result data yields no observed text", () => {
  const fake = {
    records: [{ id: "x", claim: "x", maturity: "documented", observation: { kind: "recorded", result: "It worked.", outcome: "as-intended" } }],
  };
  assert.equal(describeEvidenceRecord(fake, "x"), undefined);
  assert.deepEqual(observationRows(fake), []);
  assert.equal(findEvidenceRecord(fake, "x"), undefined);
  // And the boundary itself rejects it.
  assert.equal(verifyProjectEvidence("X", fake).ok, false);
});

test("an unverified Validated-looking record yields no observed text, even if well-formed", () => {
  const lookalike = {
    records: [{ id: "x", claim: "x", maturity: "validated", observation: { kind: "recorded", result: "It worked.", outcome: "as-intended" } }],
  };
  assert.equal(describeEvidenceRecord(lookalike, "x"), undefined);
  assert.deepEqual(observationRows(lookalike), []);
  assert.equal(summarizeEvidence(lookalike), "Evidence unavailable");
  const scenario = { ...controlScenarios[0], evidenceRef: { projectIndex: "P-X", recordId: "x" } };
  assert.equal(resolveScenarioEvidence(scenario, [{ index: "P-X", evidence: lookalike }]).status, "unavailable");
});

test("verified summaries are unchanged: P-01..P-04", () => {
  assert.deepEqual(
    projects.map((p) => [p.index, summarizeEvidence(p.evidence)]),
    [["P-01", "1 Validated · 4 Documented"], ["P-02", "1 Validated · 2 Documented"], ["P-03", "1 Documented"], ["P-04", "1 Design"]],
  );
});

test("verified failed outcome still counts and renders as failed through the public API", () => {
  const { projects: built } = buildProjects(
    inputsWith("P-02", (p) => {
      recordsOf(p)[2].observation = { kind: "recorded", result: "Outbound access continued.", outcome: "failed" };
    }),
  );
  const p02 = project(built, "P-02");
  assert.deepEqual(describeEvidenceRecord(p02.evidence, "kill-switch"), { maturity: "validated", observed: "Outbound access continued.", outcome: "failed" });
  assert.equal(observationRows(p02.evidence).find((r) => r.kind === "recorded")?.outcome, "failed");
  assert.equal(outcomeBadge(p02.evidence).tone, "failed");
});

test("Failure Lab resolves through verified records only", () => {
  const resolved = resolveControlScenarios(controlScenarios, projects);
  assert.deepEqual(
    resolved.map((s) => [s.id, s.evidence.status === "resolved" ? s.evidence.maturity : "unavailable"]),
    [["scanner-unavailable", "validated"], ["vpn-tunnel-stopped", "validated"], ["proxy-migration-fails", "documented"]],
  );
  // Same references against unverified copies of the same data → unavailable.
  const unverified = projects.map((p) => ({ index: p.index, evidence: structuredClone(isVerifiedEvidence(p.evidence) ? { ...p.evidence, records: [...p.evidence.records] } : p.evidence) }));
  for (const s of resolveControlScenarios(controlScenarios, unverified)) assert.equal(s.evidence.status, "unavailable", s.id);
});

// --- Distribution parts (s41.20.4) ----------------------------------------------

test("distribution parts mirror the authoritative summaries, validated first", () => {
  for (const p of projects) {
    const parts = evidenceDistributionParts(p.evidence);
    assert.ok(parts, p.index);
    assert.equal(parts.map((x) => x.label).join(" · "), summarizeEvidence(p.evidence), p.index);
    assert.ok(Object.isFrozen(parts) && parts.every((x) => Object.isFrozen(x)), p.index);
  }
  assert.deepEqual(
    evidenceDistributionParts(project(projects, "P-01").evidence)?.map((x) => [x.maturity, x.count]),
    [["validated", 1], ["documented", 4]],
  );
});

test("distribution parts fail closed for unverified or fabricated input", () => {
  const lookalike = { records: [{ id: "x", claim: "x", maturity: "validated", observation: { kind: "recorded", result: "r", outcome: "as-intended" } }] };
  assert.equal(evidenceDistributionParts(lookalike), null);
  assert.equal(evidenceDistributionParts({ available: true, counts: { validated: 1, documented: 0, design: 0 }, total: 1, uniform: "validated" }), null);
  assert.deepEqual(evidenceDistributionParts(checkProjectEvidence("X", { records: [] })), []);
});

test("Failure Lab resolution carries the recorded outcome separately from maturity", () => {
  const resolved = resolveControlScenarios(controlScenarios, projects);
  const byId = Object.fromEntries(resolved.map((s) => [s.id, s.evidence]));
  assert.deepEqual(byId["scanner-unavailable"], { status: "resolved", maturity: "validated", observed: "A scanner outage was simulated deliberately and the release step never ran.", outcome: "as-intended" });
  const p03 = byId["proxy-migration-fails"];
  assert.equal(p03.status === "resolved" && p03.maturity, "documented");
  assert.equal(p03.status === "resolved" && "outcome" in p03, false, "no outcome without a recorded result");
});

// --- Snapshot boundary: accessor / Proxy / post-verification mutation (s41.20.27)
//
// Invariant: what was verified is exactly what downstream code presents.

/** A getter that answers values[0] on the first read, values[1] on the
 * second, … and the last value thereafter; `reads()` counts reads. */
function flipping(values: unknown[]) {
  let n = 0;
  return {
    get: () => values[Math.min(n++, values.length - 1)],
    reads: () => n,
  };
}
function withAccessor<T extends object>(target: T, key: string, getter: () => unknown): T {
  Object.defineProperty(target, key, { get: getter, enumerable: true, configurable: true });
  return target;
}
/** Every verified record must satisfy the maturity/observation invariant. */
function assertConsistent(evidence: VerifiedEvidence) {
  for (const r of evidence.records) {
    assert.equal(r.maturity === "validated", r.observation.kind === "recorded", JSON.stringify(r));
  }
}

test("review repro: a maturity accessor that flips to validated after the checks cannot render Validated", () => {
  // Independent .23 review reproduction: "documented" for the first four
  // reads, "validated" afterwards, with no recorded observation.
  const m = flipping(["documented", "documented", "documented", "documented", "validated"]);
  const rec = withAccessor({ id: "x", claim: "c", observation: { kind: "none" } }, "maturity", m.get);
  const res = verifyProjectEvidence("probe", { records: [rec] });
  assert.equal(m.reads(), 1, "maturity is read exactly once");
  assert.ok(res.ok);
  assert.equal(summarizeEvidence(res.evidence), "1 Documented");
  assert.equal(describeEvidenceRecord(res.evidence, "x")?.maturity, "documented");
  assertConsistent(res.evidence);
});

test("a maturity flip at any read position never yields a stronger maturity than was checked", () => {
  for (let flipAt = 0; flipAt <= 6; flipAt += 1) {
    for (const [before, after, observation] of [
      ["documented", "validated", { kind: "none" }],
      ["design", "validated", { kind: "reported", note: "n" }],
      ["validated", "documented", { kind: "recorded", result: "r", outcome: "as-intended" }],
      ["validated", "design", { kind: "none" }],
    ] as const) {
      const m = flipping([...Array(flipAt).fill(before), after]);
      const rec = withAccessor({ id: "x", claim: "c", observation: { ...observation } }, "maturity", m.get);
      const res = verifyProjectEvidence("probe", { records: [rec] });
      assert.ok(m.reads() <= 1, `maturity read ${m.reads()} times`);
      if (!res.ok) continue; // fail closed is acceptable
      assertConsistent(res.evidence);
      const checked = flipAt === 0 ? after : before;
      assert.equal(res.evidence.records[0].maturity, checked, `flipAt=${flipAt} ${before}->${after}`);
    }
  }
});

test("an observation-kind flip cannot create, or strip, authoritative recorded evidence", () => {
  for (let flipAt = 0; flipAt <= 4; flipAt += 1) {
    // documented + kind "none" that later claims "recorded" with a result.
    const toRecorded = flipping([...Array(flipAt).fill("none"), "recorded"]);
    const a = verifyProjectEvidence("probe", {
      records: [{ id: "x", claim: "c", maturity: "documented", observation: withAccessor({ result: "seen", outcome: "as-intended" }, "kind", toRecorded.get) }],
    });
    assert.ok(toRecorded.reads() <= 1);
    if (a.ok) {
      assertConsistent(a.evidence);
      assert.equal(summarizeEvidence(a.evidence), "1 Documented");
      assert.equal(describeEvidenceRecord(a.evidence, "x")?.outcome, undefined);
      assert.equal(observationRows(a.evidence)[0].kind, "none");
    }
    // validated + kind "recorded" that later claims "none".
    const toNone = flipping([...Array(flipAt).fill("recorded"), "none"]);
    const b = verifyProjectEvidence("probe", {
      records: [{ id: "x", claim: "c", maturity: "validated", observation: withAccessor({ result: "seen", outcome: "as-intended" }, "kind", toNone.get) }],
    });
    assert.ok(toNone.reads() <= 1);
    if (b.ok) {
      assertConsistent(b.evidence);
      assert.equal(summarizeEvidence(b.evidence), "1 Validated");
      assert.equal(describeEvidenceRecord(b.evidence, "x")?.observed, "seen");
    }
  }
});

test("an outcome or result flip cannot alter the verified presentation", () => {
  const outcome = flipping(["failed", "as-intended"]);
  const result = flipping(["Outbound access continued.", "Blocked as expected."]);
  const obs = withAccessor(withAccessor({ kind: "recorded" }, "outcome", outcome.get), "result", result.get);
  const res = verifyProjectEvidence("probe", { records: [{ id: "x", claim: "c", maturity: "validated", observation: obs }] });
  assert.equal(outcome.reads(), 1);
  assert.equal(result.reads(), 1);
  assert.ok(res.ok);
  assert.deepEqual(describeEvidenceRecord(res.evidence, "x"), { maturity: "validated", observed: "Outbound access continued.", outcome: "failed" });
  assert.equal(outcomeBadge(res.evidence).tone, "failed");
  assert.deepEqual(observationRows(res.evidence)[0], { claim: "c", maturity: "validated", kind: "recorded", text: "Outbound access continued.", outcome: "failed" });
});

test("Proxy-backed evidence: every untrusted field is read at most once", () => {
  const reads = new Map<string, number>();
  const counted = <T extends object>(name: string, target: T): T =>
    new Proxy(target, {
      get(t, key, receiver) {
        if (typeof key === "string") reads.set(`${name}.${key}`, (reads.get(`${name}.${key}`) ?? 0) + 1);
        return Reflect.get(t, key, receiver);
      },
    });
  const observation = counted("observation", { kind: "recorded", result: "r", outcome: "as-intended", note: undefined });
  const record = counted("record", { id: "x", claim: "c", maturity: "validated", observation });
  const records = counted("records", [record]);
  const res = verifyProjectEvidence("probe", counted("evidence", { unit: "failure path", records }));
  assert.ok(res.ok);
  const repeated = [...reads].filter(([, n]) => n > 1);
  assert.deepEqual(repeated, [], `fields read more than once: ${JSON.stringify(repeated)}`);
  for (const field of ["evidence.unit", "evidence.records", "records.length", "records.0", "record.id", "record.claim", "record.maturity", "record.observation", "observation.kind", "observation.result", "observation.outcome"]) {
    assert.equal(reads.get(field), 1, field);
  }
});

test("a throwing accessor or unreadable input fails closed, never throws or renders", () => {
  const boom = () => {
    throw new Error("boom");
  };
  const { proxy: revoked, revoke } = Proxy.revocable({}, {});
  revoke();
  for (const raw of [
    withAccessor({ records: [] }, "unit", boom),
    { records: [withAccessor({ id: "x", claim: "c", observation: { kind: "none" } }, "maturity", boom)] },
    { records: [{ id: "x", claim: "c", maturity: "documented", observation: withAccessor({}, "kind", boom) }] },
    { records: [revoked] },
    revoked,
    { records: new Proxy([], { get: (t, k) => (k === "length" ? 1e9 : Reflect.get(t, k)) }) },
  ]) {
    const checked = checkProjectEvidence("probe", raw);
    assert.equal(isVerifiedEvidence(checked), false);
    assert.equal(summarizeEvidence(checked), "Evidence unavailable");
  }
});

test("mutating the original input after verification cannot alter rendered evidence", () => {
  const observation: Record<string, unknown> = { kind: "recorded", result: "Blocked.", outcome: "as-intended" };
  const record: Record<string, unknown> = { id: "x", claim: "c", maturity: "validated", observation };
  const other: Record<string, unknown> = { id: "y", claim: "d", maturity: "documented", observation: { kind: "none" } };
  const raw: Record<string, unknown> = { unit: "failure path", records: [record, other] };
  const res = verifyProjectEvidence("probe", raw);
  assert.ok(res.ok);
  const render = (e: unknown) => ({
    summary: summarizeEvidence(e),
    parts: evidenceDistributionParts(e),
    x: describeEvidenceRecord(e, "x"),
    y: describeEvidenceRecord(e, "y"),
    rows: observationRows(e),
    badge: outcomeBadge(e),
    unit: evidenceDistribution(e),
  });
  const before = structuredClone(render(res.evidence));

  observation.kind = "none";
  observation.outcome = "failed";
  observation.result = "Leaked.";
  record.maturity = "design";
  record.claim = "rewritten";
  other.maturity = "validated";
  other.observation = { kind: "recorded", result: "forged", outcome: "as-intended" };
  (raw.records as unknown[]).push({ id: "z", claim: "z", maturity: "validated", observation: { kind: "recorded", result: "z", outcome: "as-intended" } });
  raw.unit = "something else";
  raw.records = [];

  assert.deepEqual(render(res.evidence), before);
  assert.equal(before.summary, "1 Validated · 1 Documented");
  assert.ok(Object.isFrozen(res.evidence) && Object.isFrozen(res.evidence.records));
});

test("operational state is read once: a flipping state/asOf/source cannot change the stored claim", () => {
  const state = flipping(["running", "in-service"]);
  const asOf = flipping(["2026-09-01", "not a date"]);
  const source = flipping(["runbook", ""]);
  const raw = withAccessor(withAccessor(withAccessor({}, "state", state.get), "asOf", asOf.get), "source", source.get);
  const { projects: built, errors } = buildProjects(inputsWith("P-04", () => {}).map((p) => {
    const c = p as Record<string, unknown>;
    return c.index === "P-04" ? { ...c, operationalState: raw } : c;
  }));
  assert.deepEqual(errors, []);
  assert.deepEqual(project(built, "P-04").operationalState, { state: "running", asOf: "2026-09-01", source: "runbook" });
  assert.equal(state.reads() + asOf.reads() + source.reads(), 3);
});

test("a project index that flips after verification cannot rebind verified evidence to another project", () => {
  const index = flipping(["P-01", "P-03"]);
  const inputs = inputsWith("P-01", () => {}).map((p) => {
    const c = p as Record<string, unknown>;
    if (c.index !== "P-01") return c;
    const { index: _drop, ...rest } = c;
    void _drop;
    return withAccessor(rest, "index", index.get);
  });
  const { projects: built, errors } = buildProjects(inputs);
  assert.deepEqual(errors, []);
  assert.equal(index.reads(), 1);
  assert.equal(built.filter((p) => p.index === "P-01").length, 1);
  assert.equal(summarizeEvidence(project(built, "P-01").evidence), "1 Validated · 4 Documented");
  assert.deepEqual(renderedMaturityClaims(built), renderedMaturityClaims(projects));
});

test("legitimate authored evidence verifies and renders identically to its plain source", () => {
  const { projects: rebuilt, errors } = buildProjects(projectInputs.map((p) => clone(p)));
  assert.deepEqual(errors, []);
  assert.deepEqual(renderedMaturityClaims(rebuilt), renderedMaturityClaims(projects));
  for (const input of projectInputs) {
    const p = project(projects, input.index);
    assert.deepEqual(clone(verifiedRecords(p)), clone(input.evidence.records), input.index);
    assert.equal(project(rebuilt, input.index).evidence && summarizeEvidence(project(rebuilt, input.index).evidence), summarizeEvidence(p.evidence));
  }
  assert.equal(summarizeEvidence(project(projects, "P-01").evidence), "1 Validated · 4 Documented");
});

// --- Failure Lab diagram caption (s41.20.26) --------------------------------

const MATURITY_TERMS = /\b(Design|Documented|Validated)\b/g;

test("Failure Lab diagram caption uses exactly the maturity of the authoritative record, never another", () => {
  const resolved = resolveControlScenarios(controlScenarios, projects);
  for (const s of resolved) {
    assert.equal(s.evidence.status, "resolved", s.id);
    if (s.evidence.status !== "resolved") continue;
    const terms = failurePathLabel(s.evidence).match(MATURITY_TERMS) ?? [];
    assert.deepEqual(terms, [evidenceApi.evidenceMaturityLabel[s.evidence.maturity]], s.id);
  }
  // The default (first) tab is P-01's scanner outage: Validated, recorded as intended.
  assert.equal(resolved[0].id, "scanner-unavailable");
  assert.equal(failurePathLabel(resolved[0].evidence), "Validated failure path");
  assert.equal(failurePathLabel(resolved.find((s) => s.id === "proxy-migration-fails")!.evidence), "Documented failure path");
});

test("Failure Lab diagram caption follows the supplied record for every maturity, and names none when unavailable", () => {
  for (const maturity of evidenceApi.EVIDENCE_MATURITIES) {
    const evidence: ScenarioEvidence = { status: "resolved", maturity, observed: "x" };
    assert.deepEqual(failurePathLabel(evidence).match(MATURITY_TERMS), [evidenceApi.evidenceMaturityLabel[maturity]]);
  }
  assert.equal(failurePathLabel({ status: "unavailable", reason: "r" }), "Failure path");
  // Unverified evidence resolves to unavailable, so it can't lend the caption a maturity.
  const { projects: broken } = buildProjects(inputsWith("P-01", (p) => (recordsOf(p)[0].maturity = "VALIDATED")));
  const lab = resolveControlScenarios(controlScenarios, broken).find((s) => s.id === "scanner-unavailable")!;
  assert.equal(failurePathLabel(lab.evidence).match(MATURITY_TERMS), null);
});

test("the Failure Lab diagram component hard-codes no maturity term and captions from the scenario's evidence", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../components/diagrams/failure-path-diagram.tsx", import.meta.url), "utf8");
  const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
  assert.equal(code.match(MATURITY_TERMS), null, "maturity terms must come from the evidence model");
  assert.match(code, /failurePathLabel\(scenario\.evidence\)/);
});
