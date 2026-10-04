import { test } from "node:test";
import assert from "node:assert/strict";
import {
  articleContentDigest,
  canonicalJson,
  checkValidatedEvidenceGate,
  evaluateReceipt,
  sha256Hex,
  validateReceipt,
  type GateArticle,
  type ReceiptContext,
  type ValidationReceipt,
} from "./validation-receipts.ts";
import { knowledgeArticles } from "./knowledge-content.ts";

// Entirely synthetic fixtures — no real article, harness, or run.
const article = {
  meta: { slug: "fixture-article", evidenceState: "VALIDATED" },
  sections: { mainContent: ["A fictional claim."], relatedSlugs: ["other"] },
  claims: [{ claimId: "claim-a" }, { claimId: "claim-b" }],
};
const HARNESS_FILE = "labs/fixture/run.sh";
const HARNESS_SHA = sha256Hex("echo fixture harness\n");
const IMG = `example/probe@sha256:${"a".repeat(64)}`;

function ctx(overrides: Partial<{ digest: string; harnessSha: string | undefined }> = {}): ReceiptContext {
  return {
    articleDigests: new Map([["fixture-article", overrides.digest ?? articleContentDigest(article)]]),
    articleClaimIds: new Map([["fixture-article", ["claim-a", "claim-b"]]]),
    fileSha256: (p) => (p === HARNESS_FILE ? ("harnessSha" in overrides ? overrides.harnessSha : HARNESS_SHA) : undefined),
  };
}

function receipt(overrides: Partial<ValidationReceipt> = {}): ValidationReceipt {
  return {
    receiptId: "fixture-receipt",
    articleSlug: "fixture-article",
    claimIds: ["claim-a", "claim-b"],
    articleContentSha256: articleContentDigest(article),
    harness: { path: "labs/fixture", gitCommit: "abc1234", files: [{ path: HARNESS_FILE, sha256: HARNESS_SHA }] },
    environment: { dockerEngine: "29.1.3", images: [IMG], probeTool: "fixture-probe 1.0", hostOsFamily: "linux" },
    steps: ["create networks", "run scenarios", "tear down"],
    scenarios: [
      { id: "baseline", kind: "baseline", expected: "unreachable", observed: "unreachable", outcome: "as-intended", rawOutputSha256: sha256Hex("b") },
      { id: "fault-binding", kind: "planted-fault", expected: "exposed (detected)", observed: "exposed (detected)", outcome: "as-intended", rawOutputSha256: sha256Hex("f") },
      { id: "control-open", kind: "probe-control", expected: "reachable", observed: "reachable", outcome: "as-intended", rawOutputSha256: sha256Hex("c") },
    ],
    executedAt: "2026-10-04T20:00:00Z",
    executedBy: "harness run by a fixture",
    review: { status: "reviewed", reviewer: "A. Fictional Reviewer", reviewedAt: "2026-10-05" },
    disclosure: "Fixture only.",
    ...overrides,
  };
}

const gate = (r: ValidationReceipt[], c = ctx(), a: GateArticle[] = [article]) => checkValidatedEvidenceGate(a, r, c);

test("clean fixture: current, reviewed, all as-intended receipt satisfies the VALIDATED gate", () => {
  assert.deepEqual(validateReceipt(receipt()), []);
  assert.equal(evaluateReceipt(receipt(), ctx()).passing, true);
  assert.deepEqual(gate([receipt()]).errors, []);
});

// Planted faults required by bead akn.1's acceptance criteria — each must block.
test("planted fault: tampered article content makes the receipt stale and blocks VALIDATED", () => {
  const { errors, notices } = gate([receipt()], ctx({ digest: sha256Hex("edited article") }));
  assert.ok(notices.some((n) => n.includes("content changed since the run")), notices.join("\n"));
  assert.ok(errors.some((e) => e.includes("no current, human-reviewed, passing receipt")), errors.join("\n"));
});

test("planted fault: tampered or missing harness file makes the receipt stale and blocks VALIDATED", () => {
  for (const harnessSha of [sha256Hex("edited harness"), undefined]) {
    const { errors, notices } = gate([receipt()], ctx({ harnessSha }));
    assert.ok(notices.some((n) => n.includes(`harness file "${HARNESS_FILE}"`)), notices.join("\n"));
    assert.ok(errors.length > 0);
  }
});

test("planted fault: an image pinned by tag instead of digest is rejected", () => {
  const r = receipt({ environment: { ...receipt().environment, images: ["example/probe:latest"] } });
  assert.ok(gate([r]).errors.some((e) => e.includes("not pinned by sha256 digest")));
});

test("planted fault: a flipped scenario outcome is evidence of failure, never a pass", () => {
  const r = receipt();
  r.scenarios[1] = { ...r.scenarios[1], observed: "unreachable (fault not detected)", outcome: "failed" };
  assert.equal(evaluateReceipt(r, ctx()).passing, false);
  const { errors, notices } = gate([r]);
  assert.ok(errors.some((e) => e.includes("no current, human-reviewed, passing receipt")), errors.join("\n"));
  assert.ok(notices.some((n) => n.includes("did not match intent")));
});

test("planted fault: an unreviewed receipt cannot back VALIDATED", () => {
  const r = receipt({ review: { status: "unreviewed" } });
  assert.deepEqual(validateReceipt(r), []);
  const { errors, notices } = gate([r]);
  assert.ok(errors.some((e) => e.includes("no current, human-reviewed, passing receipt")));
  assert.ok(notices.some((n) => n.includes("awaiting human review")));
});

test("reviewer must be a named human, not a tool or agent", () => {
  for (const reviewer of ["Claude", "Codex agent", "ruflo", "CI bot"]) {
    const errors = validateReceipt(receipt({ review: { status: "reviewed", reviewer, reviewedAt: "2026-10-05" } }));
    assert.ok(errors.some((e) => e.includes("is not a named human")), `${reviewer}: ${errors.join("\n")}`);
  }
  assert.ok(validateReceipt(receipt({ review: { status: "reviewed", reviewedAt: "2026-10-05" } })).some((e) => e.includes("must name its reviewer")));
});

test("partial claim coverage blocks VALIDATED; a VALIDATED article with no ledger is blocked", () => {
  const partial = gate([receipt({ claimIds: ["claim-a"] })]);
  assert.ok(partial.errors.some((e) => e.includes('"claim-b"')), partial.errors.join("\n"));
  const noLedger = gate([], ctx(), [{ meta: { slug: "fixture-article", evidenceState: "VALIDATED" } }]);
  assert.ok(noLedger.errors.some((e) => e.includes("requires a claim ledger")));
});

test("each scenario kind is required: baseline, planted fault, and probe control", () => {
  for (const kind of ["baseline", "planted-fault", "probe-control"] as const) {
    const r = receipt({ scenarios: receipt().scenarios.filter((s) => s.kind !== kind) });
    assert.ok(validateReceipt(r).some((e) => e.includes(`"${kind}" scenario`)), kind);
  }
});

test("receipts referencing unknown articles or claims are invalid even when nothing claims VALIDATED", () => {
  const unverified = [{ ...article, meta: { ...article.meta, evidenceState: "UNVERIFIED" } }];
  assert.ok(gate([receipt({ articleSlug: "ghost-article" })], ctx(), unverified).errors.some((e) => e.includes('unknown article "ghost-article"')));
  assert.ok(gate([receipt({ claimIds: ["claim-z"] })], ctx(), unverified).errors.some((e) => e.includes('claim "claim-z"')));
});

test("stale or unreviewed receipts for non-VALIDATED articles are notices, not errors", () => {
  const unverified = [{ ...article, meta: { ...article.meta, evidenceState: "UNVERIFIED" } }];
  const { errors, notices } = gate([receipt({ review: { status: "unreviewed" } })], ctx({ digest: sha256Hex("x") }), unverified);
  assert.deepEqual(errors, []);
  assert.ok(notices.length > 0);
});

test("articleContentDigest ignores navigation links and key order, but not substantive edits", () => {
  const base = articleContentDigest(article);
  assert.equal(articleContentDigest({ ...article, sections: { relatedSlugs: ["x", "y"], nextSlug: "z", mainContent: ["A fictional claim."] } }), base);
  assert.notEqual(articleContentDigest({ ...article, sections: { ...article.sections, mainContent: ["A different claim."] } }), base);
  assert.notEqual(articleContentDigest({ ...article, claims: [{ claimId: "claim-a" }] }), base);
  assert.equal(canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] }), '{"a":[2,{"c":4,"d":3}],"b":1}');
});

test("receipt reviewer/harness rules hold: relative harness path, git sha, OS family only", () => {
  assert.ok(validateReceipt(receipt({ harness: { ...receipt().harness, path: "/abs/path" } })).some((e) => e.includes("repository-relative")));
  assert.ok(validateReceipt(receipt({ harness: { ...receipt().harness, gitCommit: "main" } })).some((e) => e.includes("git commit sha")));
  assert.ok(validateReceipt(receipt({ environment: { ...receipt().environment, hostOsFamily: "lab-host-01.internal" } })).some((e) => e.includes("OS family only")));
});

test("live catalog: no article claims VALIDATED today, so the gate passes with no receipts", () => {
  assert.equal(knowledgeArticles.filter((a) => a.meta.evidenceState === "VALIDATED").length, 0);
  const live = checkValidatedEvidenceGate(knowledgeArticles, [], {
    articleDigests: new Map(knowledgeArticles.map((a) => [a.meta.slug, articleContentDigest(a)])),
    articleClaimIds: new Map(),
    fileSha256: () => undefined,
  });
  assert.deepEqual(live.errors, []);
});
