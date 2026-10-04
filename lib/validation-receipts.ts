// Validation receipts: the only basis on which a knowledge article may carry
// evidenceState "VALIDATED" (Beads securitycorp-source-akn / akn.1; owner
// decision recorded in securitycorp-source-0m5, 2026-10-04).
//
// A receipt records one run of a committed lab harness against an article's
// claims. It is bound to three things, and becomes STALE when any of them
// changes:
//   1. the article's substantive content (articleContentDigest — sections
//      minus navigation links, module, diagram, and claim ledger; navigation-
//      only edits do not re-trigger evidence, matching the owner's 2026-10-04
//      navigation policy),
//   2. every harness file, by sha256 (so a changed script, fixture, or pinned
//      image digest in the harness manifest forces a re-run),
//   3. the environment it declares (images must be pinned by digest).
//
// Mirrors lib/evidence.ts: what was observed and whether it matched intent
// are separate. A scenario that observed the control FAILING is still valid
// evidence — of a failure — and never counts as a pass.
//
// Agents may produce receipts with review.status "unreviewed". Only a named
// human reviewer sets "reviewed"; VALIDATED requires reviewed receipts.
//
// Scope rule (pending owner confirmation, see akn DESIGN section 2): until
// decided, the gate is conservative — a VALIDATED article needs a non-empty
// claim ledger and EVERY ledger claim covered by a passing receipt.
//
// Relative imports only: scripts run this under plain node.
import { createHash } from "node:crypto";
import { TEST_OUTCOMES, type TestOutcome } from "./evidence.ts";

export const SCENARIO_KINDS = ["baseline", "planted-fault", "probe-control"] as const;
export type ScenarioKind = (typeof SCENARIO_KINDS)[number];

export type ReceiptScenario = {
  id: string;
  kind: ScenarioKind;
  /** What the harness must observe if the claim holds (copied from the harness). */
  expected: string;
  /** What the harness actually observed in this run. */
  observed: string;
  /** Whether `observed` matched `expected`. A "failed" outcome is evidence of a failure. */
  outcome: TestOutcome;
  /** sha256 of this scenario's raw harness output. */
  rawOutputSha256: string;
};

export type ReceiptReview = {
  status: "unreviewed" | "reviewed";
  /** A named human. Never an AI tool, agent, or bot. */
  reviewer?: string;
  reviewedAt?: string;
  notes?: string;
};

export type ValidationReceipt = {
  receiptId: string;
  articleSlug: string;
  /** Claim ids from the article's claim ledger (lib/claim-ledger.ts) this run covers. */
  claimIds: string[];
  /** articleContentDigest() of the article at the time of the run. */
  articleContentSha256: string;
  harness: {
    /** Repository-relative directory of the harness. */
    path: string;
    /** Commit the harness was run from. */
    gitCommit: string;
    files: { path: string; sha256: string }[];
  };
  environment: {
    dockerEngine: string;
    /** Every image as name@sha256:<digest>. Tags alone are rejected. */
    images: string[];
    probeTool: string;
    /** OS family only (e.g. "linux") — never a hostname. */
    hostOsFamily: string;
  };
  /** Ordered steps, copied from the harness rather than paraphrased. */
  steps: string[];
  scenarios: ReceiptScenario[];
  executedAt: string;
  /** Who or what ran the harness, e.g. "harness run by <tool or person>". */
  executedBy: string;
  review: ReceiptReview;
  /** Which AI tools wrote, ran, or checked what. */
  disclosure: string;
};

const SHA256 = /^[0-9a-f]{64}$/;
const GIT_SHA = /^[0-9a-f]{7,40}$/;
const PINNED_IMAGE = /^[^\s@]+@sha256:[0-9a-f]{64}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// A reviewer is a named human; reject obvious tool/agent identities.
const NON_HUMAN_REVIEWER = /\b(claude|codex|gpt|chatgpt|copilot|gemini|ruflo|anthropic|openai|ai|agent|bot|automation|harness)\b/i;
const NAV_KEYS = new Set(["relatedSlugs", "nextSlug", "prerequisiteSlugs"]);

export function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

/** JSON with object keys sorted recursively, so digests don't depend on key order. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export type DigestableArticle = {
  sections: Record<string, unknown>;
  module?: unknown;
  diagram?: unknown;
  claims?: unknown;
};

/** Digest of an article's substantive content: everything a validation run
 * could depend on, excluding navigation links and metadata (status, dates,
 * evidenceState, reviews) so promoting an article or editing its links
 * does not itself invalidate the receipt. */
export function articleContentDigest(article: DigestableArticle): string {
  const sections = Object.fromEntries(Object.entries(article.sections).filter(([k]) => !NAV_KEYS.has(k)));
  return sha256Hex(canonicalJson({ sections, module: article.module, diagram: article.diagram, claims: article.claims }));
}

function isIsoTimestamp(value: string | undefined): boolean {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/.test(value) && !Number.isNaN(Date.parse(value));
}

/** Structural validation of one receipt, independent of the repository state. */
export function validateReceipt(r: ValidationReceipt): string[] {
  const e: string[] = [];
  const at = `receipt "${r.receiptId}"`;
  if (!ID.test(r.receiptId)) e.push(`${at}: receiptId must be lowercase kebab-case`);
  if (!ID.test(r.articleSlug)) e.push(`${at}: articleSlug must be lowercase kebab-case`);
  if (r.claimIds.length === 0) e.push(`${at}: must cover at least one claim`);
  if (!SHA256.test(r.articleContentSha256)) e.push(`${at}: articleContentSha256 must be a sha256 hex digest`);
  if (!r.harness.path.trim() || r.harness.path.startsWith("/") || r.harness.path.includes("..")) e.push(`${at}: harness.path must be repository-relative`);
  if (!GIT_SHA.test(r.harness.gitCommit)) e.push(`${at}: harness.gitCommit must be a git commit sha`);
  if (r.harness.files.length === 0) e.push(`${at}: harness.files must list every harness file`);
  for (const f of r.harness.files) if (!SHA256.test(f.sha256)) e.push(`${at}: harness file "${f.path}" has an invalid sha256`);
  if (!r.environment.dockerEngine.trim()) e.push(`${at}: environment.dockerEngine is required`);
  if (!r.environment.probeTool.trim()) e.push(`${at}: environment.probeTool is required`);
  if (!/^[a-z]+$/.test(r.environment.hostOsFamily)) e.push(`${at}: environment.hostOsFamily must be an OS family only (e.g. "linux")`);
  if (r.environment.images.length === 0) e.push(`${at}: environment.images must list every image used`);
  for (const img of r.environment.images) if (!PINNED_IMAGE.test(img)) e.push(`${at}: image "${img}" is not pinned by sha256 digest`);
  if (r.steps.length === 0) e.push(`${at}: steps are required`);
  for (const kind of SCENARIO_KINDS) {
    if (!r.scenarios.some((s) => s.kind === kind)) e.push(`${at}: needs at least one "${kind}" scenario`);
  }
  const ids = new Set<string>();
  for (const s of r.scenarios) {
    if (ids.has(s.id)) e.push(`${at}: duplicate scenario id "${s.id}"`);
    ids.add(s.id);
    if (!SCENARIO_KINDS.includes(s.kind)) e.push(`${at}: scenario "${s.id}" has unknown kind "${s.kind}"`);
    if (!TEST_OUTCOMES.includes(s.outcome)) e.push(`${at}: scenario "${s.id}" has unknown outcome "${s.outcome}"`);
    if (!s.expected.trim() || !s.observed.trim()) e.push(`${at}: scenario "${s.id}" needs both expected and observed results`);
    if (!SHA256.test(s.rawOutputSha256)) e.push(`${at}: scenario "${s.id}" has an invalid rawOutputSha256`);
  }
  if (!isIsoTimestamp(r.executedAt)) e.push(`${at}: executedAt must be an ISO date/time`);
  if (!r.executedBy.trim()) e.push(`${at}: executedBy is required`);
  if (!r.disclosure.trim()) e.push(`${at}: disclosure of AI involvement is required`);
  if (r.review.status === "reviewed") {
    if (!r.review.reviewer?.trim()) e.push(`${at}: a reviewed receipt must name its reviewer`);
    else if (NON_HUMAN_REVIEWER.test(r.review.reviewer)) e.push(`${at}: reviewer "${r.review.reviewer}" is not a named human`);
    if (!isIsoTimestamp(r.review.reviewedAt)) e.push(`${at}: a reviewed receipt needs reviewedAt`);
  } else if (r.review.status !== "unreviewed") {
    e.push(`${at}: unknown review status`);
  }
  return e;
}

export type ReceiptContext = {
  /** articleContentDigest of each known article, by slug. */
  articleDigests: Map<string, string>;
  /** Claim ids in each article's ledger, by slug. */
  articleClaimIds: Map<string, string[]>;
  /** sha256 of a repository file as it exists now, or undefined if missing. */
  fileSha256: (repoPath: string) => string | undefined;
};

export type ReceiptStatus = {
  receiptId: string;
  /** Structural or reference problems: the receipt cannot be used at all. */
  invalid: string[];
  /** The article or harness changed since the run: must be re-run. */
  stale: string[];
  /** current, structurally valid, reviewed, and every scenario as intended. */
  passing: boolean;
};

export function evaluateReceipt(r: ValidationReceipt, ctx: ReceiptContext): ReceiptStatus {
  const invalid = validateReceipt(r);
  const stale: string[] = [];
  const at = `receipt "${r.receiptId}"`;
  const digest = ctx.articleDigests.get(r.articleSlug);
  if (digest === undefined) invalid.push(`${at}: unknown article "${r.articleSlug}"`);
  else if (digest !== r.articleContentSha256) stale.push(`${at}: article "${r.articleSlug}" content changed since the run`);
  const ledger = new Set(ctx.articleClaimIds.get(r.articleSlug) ?? []);
  for (const c of r.claimIds) if (!ledger.has(c)) invalid.push(`${at}: claim "${c}" is not in the article's claim ledger`);
  for (const f of r.harness.files) {
    const now = ctx.fileSha256(f.path);
    if (now === undefined) stale.push(`${at}: harness file "${f.path}" no longer exists`);
    else if (now !== f.sha256) stale.push(`${at}: harness file "${f.path}" changed since the run`);
  }
  const allAsIntended = r.scenarios.length > 0 && r.scenarios.every((s) => s.outcome === "as-intended");
  const passing = invalid.length === 0 && stale.length === 0 && r.review.status === "reviewed" && allAsIntended;
  return { receiptId: r.receiptId, invalid, stale, passing };
}

export type GateArticle = { meta: { slug: string; evidenceState: string }; claims?: { claimId: string }[] };

/** The VALIDATED gate. Errors block the build: an article claiming VALIDATED
 * without passing receipts for every ledger claim, and any receipt that is
 * invalid (malformed or pointing at nothing). Stale or unreviewed receipts
 * for articles that do NOT claim VALIDATED are reported as notices only. */
export function checkValidatedEvidenceGate(
  articles: GateArticle[],
  receipts: ValidationReceipt[],
  ctx: ReceiptContext,
): { errors: string[]; notices: string[] } {
  const errors: string[] = [];
  const notices: string[] = [];
  const statuses = receipts.map((r) => ({ r, s: evaluateReceipt(r, ctx) }));
  const seenIds = new Set<string>();
  for (const { r, s } of statuses) {
    if (seenIds.has(r.receiptId)) errors.push(`duplicate receiptId "${r.receiptId}"`);
    seenIds.add(r.receiptId);
    errors.push(...s.invalid);
    notices.push(...s.stale);
    if (s.invalid.length === 0 && s.stale.length === 0 && !s.passing) {
      notices.push(`receipt "${r.receiptId}": current but not passing (${r.review.status !== "reviewed" ? "awaiting human review" : "a scenario did not match intent"})`);
    }
  }
  for (const a of articles) {
    if (a.meta.evidenceState !== "VALIDATED") continue;
    const slug = a.meta.slug;
    const ledger = (a.claims ?? []).map((c) => c.claimId);
    if (ledger.length === 0) {
      errors.push(`${slug}: evidenceState VALIDATED requires a claim ledger to validate against`);
      continue;
    }
    const covered = new Set(statuses.filter(({ r, s }) => s.passing && r.articleSlug === slug).flatMap(({ r }) => r.claimIds));
    const missing = ledger.filter((c) => !covered.has(c));
    if (missing.length > 0) {
      errors.push(`${slug}: evidenceState VALIDATED but claim(s) ${missing.map((c) => `"${c}"`).join(", ")} have no current, human-reviewed, passing receipt`);
    }
  }
  return { errors, notices };
}
