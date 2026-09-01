import { test } from "node:test";
import assert from "node:assert/strict";
import { validateClaimLedger, validateClaimReferences, validateArticleClaims, type ArticleClaim } from "./claim-ledger.ts";
import type { UniversalSections } from "./knowledge-content-types.ts";

function validClaim(overrides: Partial<ArticleClaim> = {}): ArticleClaim {
  return {
    claimId: "network-segmentation-reduces-blast-radius",
    statement: "Network segmentation limits how far a compromise can spread.",
    locator: "mainContent[0]",
    sources: [{ sourceId: "nist-800-207", publisher: "NIST", version: "SP 800-207", accessedAt: "2026-08-30" }],
    semanticReview: { status: "unreviewed" },
    ...overrides,
  };
}

test("validateClaimLedger accepts a well-formed unreviewed claim", () => {
  assert.deepEqual(validateClaimLedger([validClaim()]), []);
});

test("validateClaimLedger accepts a well-formed reviewed claim", () => {
  const claim = validClaim({ semanticReview: { status: "reviewed", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" } });
  assert.deepEqual(validateClaimLedger([claim]), []);
});

test("validateClaimLedger flags a missing claimId", () => {
  const errors = validateClaimLedger([validClaim({ claimId: "" })]);
  assert.ok(errors.some((e) => e.includes("missing claimId")));
});

test("validateClaimLedger flags a non-kebab-case claimId", () => {
  const errors = validateClaimLedger([validClaim({ claimId: "Not_Kebab_Case" })]);
  assert.ok(errors.some((e) => e.includes("kebab-case")));
});

test("validateClaimLedger flags a duplicate claimId", () => {
  const errors = validateClaimLedger([validClaim(), validClaim()]);
  assert.ok(errors.some((e) => e.includes("duplicate claimId")));
});

test("validateClaimLedger flags a claim with zero sources", () => {
  const errors = validateClaimLedger([validClaim({ sources: [] })]);
  assert.ok(errors.some((e) => e.includes("requires at least one source")));
});

test("validateClaimLedger flags a source missing publisher", () => {
  const errors = validateClaimLedger([
    validClaim({ sources: [{ sourceId: "x", publisher: "", accessedAt: "2026-08-30" }] }),
  ]);
  assert.ok(errors.some((e) => e.includes("missing publisher")));
});

test("validateClaimLedger flags a source with an invalid accessedAt", () => {
  const errors = validateClaimLedger([
    validClaim({ sources: [{ sourceId: "x", publisher: "NIST", accessedAt: "not-a-date" }] }),
  ]);
  assert.ok(errors.some((e) => e.includes("invalid or missing accessedAt")));
});

test("validateClaimLedger flags a reviewed claim missing a reviewer", () => {
  const errors = validateClaimLedger([validClaim({ semanticReview: { status: "reviewed", reviewedAt: "2026-08-31" } })]);
  assert.ok(errors.some((e) => e.includes("requires a named reviewer")));
});

test("validateClaimLedger flags a reviewed claim missing reviewedAt", () => {
  const errors = validateClaimLedger([validClaim({ semanticReview: { status: "reviewed", reviewer: "Ravi" } })]);
  assert.ok(errors.some((e) => e.includes("valid reviewedAt")));
});

test("validateClaimLedger flags an invalid semanticReview.status", () => {
  const errors = validateClaimLedger([
    validClaim({ semanticReview: { status: "verified" as unknown as "reviewed" } }),
  ]);
  assert.ok(errors.some((e) => e.includes("invalid semanticReview.status")));
});

const emptySections: UniversalSections = {};

test("validateClaimReferences permits prose with no markers", () => {
  const sections: UniversalSections = { mainContent: ["Plain prose with no claim markers at all."] };
  assert.deepEqual(validateClaimReferences(sections, [validClaim()]), []);
});

test("validateClaimReferences permits a marker that resolves to a real claim", () => {
  const sections: UniversalSections = {
    mainContent: ["Segmentation limits blast radius. [[claim:network-segmentation-reduces-blast-radius]]"],
  };
  assert.deepEqual(validateClaimReferences(sections, [validClaim()]), []);
});

test("validateClaimReferences flags a marker with no matching claim entry", () => {
  const sections: UniversalSections = { mainContent: ["An unsupported claim. [[claim:nonexistent-claim]]"] };
  const errors = validateClaimReferences(sections, [validClaim()]);
  assert.ok(errors.some((e) => e.includes("unknown claim") && e.includes("nonexistent-claim")));
});

test("validateClaimReferences scans every string-array field and the single-string nextSlug field", () => {
  const sections: UniversalSections = {
    keyTakeaways: ["Takeaway one.", "Takeaway two. [[claim:nonexistent-claim]]"],
    nextSlug: "some-other-article [[claim:nonexistent-claim]]",
  };
  const errors = validateClaimReferences(sections, []);
  assert.equal(errors.length, 2);
});

test("validateClaimReferences on empty sections with no claims produces nothing", () => {
  assert.deepEqual(validateClaimReferences(emptySections, []), []);
});

test("validateArticleClaims combines both checks and treats an absent claims array as empty", () => {
  const sections: UniversalSections = { mainContent: ["No markers here."] };
  assert.deepEqual(validateArticleClaims(sections, undefined), []);
});

test("validateArticleClaims surfaces both a ledger error and a reference error together", () => {
  const sections: UniversalSections = { mainContent: ["[[claim:missing-one]]"] };
  const errors = validateArticleClaims(sections, [validClaim({ sources: [] })]);
  assert.ok(errors.some((e) => e.includes("requires at least one source")));
  assert.ok(errors.some((e) => e.includes("missing-one")));
});
