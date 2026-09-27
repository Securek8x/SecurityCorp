// Project evidence: three independent dimensions, one authoritative boundary.
//
//   Maturity  — how strong is the evidence?   design · documented · validated
//   Observation — what, if anything, was seen? recorded · reported · none
//   Outcome   — what happened? (only on a recorded observation)
//                                              as-intended · failed
//
// "Validated" means exactly: an explicit recorded observable result exists.
// It says nothing about whether the control behaved as intended — a recorded
// failure is Validated evidence of a failure. Nothing here maps maturity to
// pass/fail, and nothing aggregates a project's records into one maturity:
// projects expose their distribution ("1 Validated · 4 Documented").
//
// Operational state is a fourth, separate axis (see OperationalState) and is
// never derived from, nor implies, any of the above.
//
// The boundary: authored data is `unknown` until verifyProjectEvidence()
// accepts it. Only verified evidence (tracked in a module-private WeakSet, so
// a type cast can't forge it) reaches the presentation helpers below; anything
// else renders as "Evidence unavailable", never as Validated.
//
// Only relative imports — scripts under plain `node` import this module.
import { isIsoDate, type IsoDate } from "./content-dates.ts";

export const EVIDENCE_MATURITIES = ["design", "documented", "validated"] as const;
export type EvidenceMaturity = (typeof EVIDENCE_MATURITIES)[number];

export const evidenceMaturityLabel: Record<EvidenceMaturity, string> = {
  design: "Design",
  documented: "Documented",
  validated: "Validated",
};

export const TEST_OUTCOMES = ["as-intended", "failed"] as const;
export type TestOutcome = (typeof TEST_OUTCOMES)[number];

export const testOutcomeLabel: Record<TestOutcome, string> = {
  "as-intended": "as intended",
  failed: "failed",
};

export type Observation =
  /** An explicit, recorded observable result. The only basis for Validated. */
  | { kind: "recorded"; result: string; outcome: TestOutcome }
  /** Reported as exercised, but no observed result was recorded. Not proof
   * either way — neither a result nor evidence the test never ran. */
  | { kind: "reported"; note: string }
  /** No result is available. */
  | { kind: "none" };

export type EvidenceRecord = {
  /** Stable identifier, unique within its project. */
  readonly id: string;
  /** The documented behavior / design expectation this record is about. */
  readonly claim: string;
  readonly maturity: EvidenceMaturity;
  readonly observation: Readonly<Observation>;
};

/** Authoring shape. Treated as untrusted until verified. */
export type ProjectEvidenceInput = {
  /** Singular noun for what each record counts, e.g. "failure path". */
  unit?: string;
  records: EvidenceRecord[];
};

declare const verifiedBrand: unique symbol;
export type VerifiedEvidence = {
  readonly unit?: string;
  readonly records: readonly EvidenceRecord[];
  readonly [verifiedBrand]: true;
};
export type UnavailableEvidence = { readonly unavailable: true; readonly errors: readonly string[] };
/** What a Project carries: verified evidence, or an explicit rejection. */
export type CheckedEvidence = VerifiedEvidence | UnavailableEvidence;

const verified = new WeakSet<object>();

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isOneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === "string" && (list as readonly string[]).includes(v);
/** For error text only: never invokes an untrusted object's toString. */
const describe = (v: unknown): string => (typeof v === "object" && v !== null ? "[object]" : typeof v === "function" ? "[function]" : String(v));

// --- Snapshots --------------------------------------------------------------
//
// Untrusted input may be backed by accessors or a Proxy, so a field read twice
// can answer differently each time (check "documented", copy "validated").
// Every untrusted object is therefore destructured exactly once into a plain
// snapshot of data properties; all checks run on, and the verified copy is
// built from, that snapshot alone. A read that throws rejects the input.

const MAX_RECORDS = 1000;

type ObservationSnapshot = { kind: unknown; result: unknown; outcome: unknown; note: unknown };
type RecordSnapshot = { id: unknown; claim: unknown; maturity: unknown; observation: unknown };

function snapshotObservation(raw: unknown): unknown {
  if (!isObject(raw)) return raw;
  const { kind, result, outcome, note } = raw;
  return { kind, result, outcome, note } satisfies ObservationSnapshot;
}

function snapshotRecord(raw: unknown): unknown {
  if (!isObject(raw)) return raw;
  const { id, claim, maturity, observation } = raw;
  return { id, claim, maturity, observation: snapshotObservation(observation) } satisfies RecordSnapshot;
}

/** Reads `length` once and each index once; undefined if not a sane array. */
function snapshotArray(raw: unknown): unknown[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const length: unknown = raw.length;
  if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || length > MAX_RECORDS) return undefined;
  const items: unknown[] = [];
  for (let i = 0; i < length; i += 1) items.push(raw[i]);
  return items;
}

function checkObservation(where: string, raw: unknown, errors: string[]): Observation | undefined {
  if (!isObject(raw)) {
    errors.push(`${where}: observation must be an object`);
    return undefined;
  }
  switch (raw.kind) {
    case "recorded":
      if (!isNonEmptyString(raw.result)) errors.push(`${where}: recorded observation has no result`);
      if (!isOneOf(TEST_OUTCOMES, raw.outcome)) errors.push(`${where}: recorded observation has invalid outcome "${describe(raw.outcome)}"`);
      return isNonEmptyString(raw.result) && isOneOf(TEST_OUTCOMES, raw.outcome)
        ? { kind: "recorded", result: raw.result, outcome: raw.outcome }
        : undefined;
    case "reported":
      if (!isNonEmptyString(raw.note)) {
        errors.push(`${where}: reported observation has no note`);
        return undefined;
      }
      return { kind: "reported", note: raw.note };
    case "none":
      return { kind: "none" };
    default:
      errors.push(`${where}: invalid observation kind "${describe(raw.kind)}"`);
      return undefined;
  }
}

/**
 * The authoritative boundary. Accepts only well-formed evidence and returns a
 * fresh, frozen, verified copy (known fields only). Anything else is rejected
 * with reasons — never partially accepted, never coerced upward. The input is
 * read once into a snapshot (see Snapshots); what was checked is exactly
 * what is copied.
 */
export function verifyProjectEvidence(label: string, raw: unknown): { ok: true; evidence: VerifiedEvidence } | { ok: false; errors: string[] } {
  let unit: unknown;
  let snapshots: unknown[] | undefined;
  try {
    if (!isObject(raw)) return { ok: false, errors: [`${label}: evidence must be an object`] };
    const { unit: rawUnit, records: rawRecords } = raw;
    unit = rawUnit;
    snapshots = snapshotArray(rawRecords)?.map(snapshotRecord);
  } catch {
    return { ok: false, errors: [`${label}: evidence could not be read`] };
  }
  return verifySnapshot(label, unit, snapshots);
}

function verifySnapshot(
  label: string,
  unit: unknown,
  snapshots: unknown[] | undefined,
): { ok: true; evidence: VerifiedEvidence } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (unit !== undefined && !isNonEmptyString(unit)) errors.push(`${label}: evidence unit must be a non-empty string`);
  if (!snapshots) return { ok: false, errors: [...errors, `${label}: evidence records must be an array`] };

  const ids = new Set<string>();
  const records: EvidenceRecord[] = [];
  snapshots.forEach((r: unknown, i: number) => {
    if (!isObject(r)) {
      errors.push(`${label}: evidence record #${i} must be an object`);
      return;
    }
    const where = `${label}: evidence record "${isNonEmptyString(r.id) ? r.id : `#${i}`}"`;
    if (!isNonEmptyString(r.id)) errors.push(`${label}: evidence record #${i} has no id`);
    else if (ids.has(r.id)) errors.push(`${where}: duplicate id`);
    else ids.add(r.id);
    if (!isNonEmptyString(r.claim)) errors.push(`${where}: empty claim`);
    if (!isOneOf(EVIDENCE_MATURITIES, r.maturity)) errors.push(`${where}: invalid maturity "${describe(r.maturity)}"`);
    const observation = checkObservation(where, r.observation, errors);
    if (r.maturity === "validated" && observation?.kind !== "recorded") {
      errors.push(`${where}: validated without a recorded observed result`);
    }
    if (r.maturity !== "validated" && observation?.kind === "recorded") {
      errors.push(`${where}: has a recorded observed result but is not marked validated`);
    }
    if (isNonEmptyString(r.id) && isNonEmptyString(r.claim) && isOneOf(EVIDENCE_MATURITIES, r.maturity) && observation) {
      records.push(Object.freeze({ id: r.id, claim: r.claim, maturity: r.maturity, observation: Object.freeze(observation) }));
    }
  });

  if (errors.length > 0) return { ok: false, errors };
  const evidence = Object.freeze({
    ...(isNonEmptyString(unit) ? { unit } : {}),
    records: Object.freeze(records),
  }) as VerifiedEvidence;
  verified.add(evidence);
  return { ok: true, evidence };
}

/** Boundary helper for construction sites: verified evidence or an explicit rejection. */
export function checkProjectEvidence(label: string, raw: unknown): CheckedEvidence {
  const result = verifyProjectEvidence(label, raw);
  return result.ok ? result.evidence : Object.freeze({ unavailable: true as const, errors: Object.freeze(result.errors) });
}

export function isVerifiedEvidence(value: unknown): value is VerifiedEvidence {
  return typeof value === "object" && value !== null && verified.has(value);
}

// --- Presentation primitives (verified input only) -------------------------
//
// Every exported function below takes the *evidence* (or a verified record
// looked up inside it) and re-checks verification itself. Claim text is only
// ever formatted from verified evidence: the formatters that turn a
// distribution or a record into text are module-private, so a fabricated or
// mutated distribution/record has no public path to a rendered claim. Derived
// data handed back to callers is frozen, and is never read back in to format.

export type EvidenceDistribution =
  | {
      readonly available: true;
      readonly unit?: string;
      readonly total: number;
      readonly counts: Readonly<Record<EvidenceMaturity, number>>;
      /** The one maturity every record shares, or null when mixed/empty.
       * A statement about the records, not a project-wide rating. */
      readonly uniform: EvidenceMaturity | null;
    }
  | { readonly available: false };

/** Frozen, read-only data (e.g. for choosing a style). Not an input to any
 * formatter — use summarizeEvidence(evidence) for the text. */
export function evidenceDistribution(evidence: unknown): EvidenceDistribution {
  return deriveDistribution(evidence);
}

function deriveDistribution(evidence: unknown): EvidenceDistribution {
  if (!isVerifiedEvidence(evidence)) return Object.freeze({ available: false as const });
  const counts: Record<EvidenceMaturity, number> = { design: 0, documented: 0, validated: 0 };
  for (const r of evidence.records) counts[r.maturity] += 1;
  const present = EVIDENCE_MATURITIES.filter((m) => counts[m] > 0);
  return Object.freeze({
    available: true as const,
    ...(evidence.unit ? { unit: evidence.unit } : {}),
    total: evidence.records.length,
    counts: Object.freeze(counts),
    uniform: present.length === 1 ? present[0] : null,
  });
}

export type EvidenceDistributionPart = Readonly<{ maturity: EvidenceMaturity; count: number; label: string }>;

// Private: only ever called on a distribution derived just now from verified evidence.
function partsOf(distribution: EvidenceDistribution): readonly EvidenceDistributionPart[] | null {
  if (!distribution.available) return null;
  return Object.freeze(
    (["validated", "documented", "design"] as const)
      .filter((m) => distribution.counts[m] > 0)
      .map((m) => Object.freeze({ maturity: m, count: distribution.counts[m], label: `${distribution.counts[m]} ${evidenceMaturityLabel[m]}` })),
  );
}

// Private: only ever called on a distribution derived just now from verified evidence.
function formatDistribution(distribution: EvidenceDistribution): string {
  const parts = partsOf(distribution);
  if (!parts) return "Evidence unavailable";
  if (parts.length === 0) return "No evidence recorded";
  return parts.map((p) => p.label).join(" · ");
}

/**
 * The distribution as ordered, labelled parts (validated → documented →
 * design, zero counts omitted) for components that render each maturity with
 * its own mark. null = evidence unavailable; [] = verified but empty. The
 * labels are the same strings summarizeEvidence joins, so no component ever
 * counts records itself.
 */
export function evidenceDistributionParts(evidence: unknown): readonly EvidenceDistributionPart[] | null {
  return partsOf(deriveDistribution(evidence));
}

/** "1 Validated · 4 Documented", "No evidence recorded", or "Evidence unavailable".
 * The only public way to turn evidence into a maturity claim. */
export function summarizeEvidence(evidence: unknown): string {
  return formatDistribution(deriveDistribution(evidence));
}

export function findEvidenceRecord(evidence: unknown, id: string): EvidenceRecord | undefined {
  return isVerifiedEvidence(evidence) ? evidence.records.find((r) => r.id === id) : undefined;
}

/**
 * Maturity + observed text for one record, looked up inside verified
 * evidence by id. Anything unverified or unknown → undefined.
 */
export function describeEvidenceRecord(
  evidence: unknown,
  id: string,
): Readonly<{ maturity: EvidenceMaturity; observed: string; outcome?: TestOutcome }> | undefined {
  const record = findEvidenceRecord(evidence, id);
  if (!record) return undefined;
  return Object.freeze({
    maturity: record.maturity,
    observed: describeObservation(record),
    ...(record.observation.kind === "recorded" ? { outcome: record.observation.outcome } : {}),
  });
}

// Private: callers reach it only with records taken from verified evidence.
function describeObservation(record: EvidenceRecord): string {
  switch (record.observation.kind) {
    case "recorded":
      return record.observation.result;
    case "reported":
      return `${record.observation.note} No observed result was recorded.`;
    case "none":
      return "No recorded result — documented only.";
  }
}

export type OutcomeSummary = { asIntended: number; failed: number; withoutRecordedResult: number };

/** Counts explicit outcomes only; records without a recorded result are
 * counted as such, never as passes. */
export function summarizeOutcomes(evidence: unknown): OutcomeSummary | undefined {
  if (!isVerifiedEvidence(evidence)) return undefined;
  const s: OutcomeSummary = { asIntended: 0, failed: 0, withoutRecordedResult: 0 };
  for (const r of evidence.records) {
    if (r.observation.kind !== "recorded") s.withoutRecordedResult += 1;
    else if (r.observation.outcome === "failed") s.failed += 1;
    else s.asIntended += 1;
  }
  return Object.freeze(s);
}

// --- Operational state -----------------------------------------------------

/**
 * Separate from evidence. Definitions (fix these before any public use):
 *   running    — the system's processes were up as of `asOf`. A liveness
 *                fact only; says nothing about whether anything relies on it.
 *   in-service — the system was deployed and relied on for its intended
 *                function as of `asOf`. A stronger usage claim; implies it
 *                was running then, but not the reverse.
 *   retired    — deliberately taken out of service as of `asOf`.
 * None of these implies or is implied by any evidence maturity.
 */
export const OPERATIONAL_STATES = ["running", "in-service", "retired"] as const;
export type OperationalStateValue = (typeof OPERATIONAL_STATES)[number];

export const operationalStateLabel: Record<OperationalStateValue, string> = {
  running: "Running",
  "in-service": "In service",
  retired: "Retired",
};

export type OperationalState = {
  readonly state: OperationalStateValue;
  /** Date the operational claim was last confirmed. */
  readonly asOf: IsoDate;
  /** Where the claim is recorded (a reviewable, public-safe reference). */
  readonly source: string;
};

/** Absent input → no claim. Malformed input → rejected (no claim), never coerced. */
export function verifyOperationalState(label: string, raw: unknown): { ok: true; value?: OperationalState } | { ok: false; errors: string[] } {
  if (raw === undefined) return { ok: true };
  let state: unknown, asOf: unknown, source: unknown;
  try {
    if (!isObject(raw)) return { ok: false, errors: [`${label}: operational state must be an object`] };
    ({ state, asOf, source } = raw);
  } catch {
    return { ok: false, errors: [`${label}: operational state could not be read`] };
  }
  const errors: string[] = [];
  if (!isOneOf(OPERATIONAL_STATES, state)) errors.push(`${label}: invalid operational state "${describe(state)}"`);
  if (!isIsoDate(asOf)) errors.push(`${label}: operational state asOf "${describe(asOf)}" is not an ISO date`);
  if (!isNonEmptyString(source)) errors.push(`${label}: operational state has no source`);
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: Object.freeze({ state: state as OperationalStateValue, asOf: asOf as IsoDate, source: source as string }) };
}

// --- Case-study evidence panel data (verified input only) -------------------

export type ObservationRow = {
  claim: string;
  maturity: EvidenceMaturity;
  kind: Observation["kind"];
  /** Recorded result, or an explicit statement that none was recorded. */
  text: string;
  outcome?: TestOutcome;
};

/** Every record as a row, so recorded results and unrecorded paths are
 * listed separately and a design expectation is never shown as observed. */
export function observationRows(evidence: unknown): readonly Readonly<ObservationRow>[] {
  if (!isVerifiedEvidence(evidence)) return Object.freeze([]);
  return Object.freeze(
    evidence.records.map((r) =>
      Object.freeze({
        claim: r.claim,
        maturity: r.maturity,
        kind: r.observation.kind,
        text: describeObservation(r),
        ...(r.observation.kind === "recorded" ? { outcome: r.observation.outcome } : {}),
      }),
    ),
  );
}

export type OutcomeTone = "passed" | "failed" | "partial" | "planned";

/**
 * Badge for "what happened", from explicit outcomes only — independent of
 * maturity. A recorded failure is still Validated evidence and reads
 * "failed"; "passed" tone needs every record to have a recorded
 * as-intended outcome.
 */
export function outcomeBadge(evidence: unknown): { label: string; tone: OutcomeTone } {
  const s = summarizeOutcomes(evidence);
  if (!s) return Object.freeze({ label: "Evidence unavailable", tone: "planned" as const });
  const parts = [
    s.asIntended > 0 && `${s.asIntended} ${testOutcomeLabel["as-intended"]}`,
    s.failed > 0 && `${s.failed} ${testOutcomeLabel.failed}`,
    s.withoutRecordedResult > 0 && `${s.withoutRecordedResult} without recorded result`,
  ].filter((p): p is string => Boolean(p));
  const tone: OutcomeTone =
    s.failed > 0 ? "failed" : s.asIntended > 0 && s.withoutRecordedResult === 0 ? "passed" : s.asIntended > 0 ? "partial" : "planned";
  return Object.freeze({ label: parts.join(" · ") || "No evidence recorded", tone });
}
