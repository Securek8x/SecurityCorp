import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateArticleMeta,
  validateCatalogIntegrity,
  isPubliclyVisible,
  CONTENT_TYPES,
  DIFFICULTIES,
  EVIDENCE_STATES,
  type KnowledgeArticleMeta,
} from "./knowledge-schema.ts";

function baseMeta(overrides: Partial<KnowledgeArticleMeta> = {}): KnowledgeArticleMeta {
  return {
    title: "Example title",
    slug: "example-title",
    summary: "Example summary.",
    pillar: "build-securely",
    primaryCategory: "application-code-security",
    contentType: "guide",
    difficulty: "beginner",
    status: "idea",
    tags: [],
    audience: ["beginner"],
    estimatedReadingMinutes: 5,
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "DESIGN ONLY",
    privacyReview: { status: "pending" },
    technicalReview: { status: "pending" },
    publicationApproval: { status: "pending" },
    ...overrides,
  };
}

test("a well-formed non-published draft has no errors", () => {
  assert.deepEqual(validateArticleMeta(baseMeta()), []);
});

test("primary category must belong to the selected pillar", () => {
  const errors = validateArticleMeta(baseMeta({ primaryCategory: "network-security" })); // belongs to defend-systems, not build-securely
  assert.ok(errors.some((e) => e.includes("does not belong to pillar")));
});

test("secondary category cannot equal primary category", () => {
  const errors = validateArticleMeta(baseMeta({ secondaryCategory: "application-code-security" }));
  assert.ok(errors.some((e) => e.includes("must not equal")));
});

test("invalid content type, difficulty, and evidence label fail safely", () => {
  assert.ok(!CONTENT_TYPES.includes("nonsense" as never));
  const errors = validateArticleMeta(baseMeta({ contentType: "nonsense" as never, difficulty: "expert" as never, evidenceState: "proven" as never }));
  assert.ok(errors.some((e) => e.includes("invalid contentType")));
  assert.ok(errors.some((e) => e.includes("invalid difficulty")));
  assert.ok(errors.some((e) => e.includes("invalid evidenceState")));
  assert.deepEqual(EVIDENCE_STATES, ["VALIDATED", "DESIGN ONLY", "UNVERIFIED"]);
  assert.equal(DIFFICULTIES.length, 3);
});

test("published content requires two to four controlled tags", () => {
  const approved = { status: "approved" as const, reviewer: "SecurityCorp owner", reviewedAt: "2026-01-01" };
  const tooFew = validateArticleMeta(baseMeta({ status: "published", tags: ["docker"], publishedAt: "2026-01-01", lastReviewedAt: "2026-01-01", privacyReview: approved, technicalReview: approved, publicationApproval: approved }));
  assert.ok(tooFew.some((e) => e.includes("requires 2-4 tags")));

  const tooMany = validateArticleMeta(baseMeta({ status: "published", tags: ["docker", "kubernetes", "dns", "vpn", "tls-pki"], publishedAt: "2026-01-01", lastReviewedAt: "2026-01-01", privacyReview: approved, technicalReview: approved, publicationApproval: approved }));
  assert.ok(tooMany.some((e) => e.includes("requires 2-4 tags")));

  const justRight = validateArticleMeta(baseMeta({ status: "published", tags: ["docker", "kubernetes"], publishedAt: "2026-01-01", lastReviewedAt: "2026-01-01", privacyReview: approved, technicalReview: approved, publicationApproval: approved }));
  assert.deepEqual(justRight, []);
});

test("published content rejects tags outside the controlled vocabulary", () => {
  const approved = { status: "approved" as const, reviewer: "SecurityCorp owner", reviewedAt: "2026-01-01" };
  const errors = validateArticleMeta(baseMeta({ status: "published", tags: ["docker", "not-a-real-tag"], publishedAt: "2026-01-01", lastReviewedAt: "2026-01-01", privacyReview: approved, technicalReview: approved, publicationApproval: approved }));
  assert.ok(errors.some((e) => e.includes('unknown tag "not-a-real-tag"')));
});

test("published content rejects aliases and duplicate canonical tags", () => {
  const approved = { status: "approved" as const, reviewer: "SecurityCorp owner", reviewedAt: "2026-01-01" };
  const aliasErrors = validateArticleMeta(baseMeta({ status: "published", tags: ["k8s", "docker"], publishedAt: "2026-01-01", lastReviewedAt: "2026-01-01", privacyReview: approved, technicalReview: approved, publicationApproval: approved }));
  assert.ok(aliasErrors.some((e) => e.includes('use canonical id "kubernetes"')));

  const duplicateErrors = validateArticleMeta(baseMeta({ status: "published", tags: ["docker", "docker"], publishedAt: "2026-01-01", lastReviewedAt: "2026-01-01", privacyReview: approved, technicalReview: approved, publicationApproval: approved }));
  assert.ok(duplicateErrors.some((e) => e.includes('duplicate tag "docker"')));
});

test("published content requires publication dates, reviews, and human approval", () => {
  const errors = validateArticleMeta(baseMeta({ status: "published", tags: ["docker", "kubernetes"] }));
  assert.ok(errors.some((e) => e.includes("requires publishedAt")));
  assert.ok(errors.some((e) => e.includes("requires lastReviewedAt")));
  assert.ok(errors.some((e) => e.includes("approved privacyReview")));
  assert.ok(errors.some((e) => e.includes("approved technicalReview")));
  assert.ok(errors.some((e) => e.includes("explicit human publicationApproval")));
});

test("invalid dates fail validation", () => {
  const errors = validateArticleMeta(baseMeta({ publishedAt: "not-a-date" }));
  assert.ok(errors.some((e) => e.includes("not a valid date")));
});

test("draft (non-published) content is never publicly visible, even if otherwise well-formed", () => {
  assert.equal(isPubliclyVisible(baseMeta({ status: "drafting" })), false);
  assert.equal(isPubliclyVisible(baseMeta({ status: "ready" })), false);
});

test("published + fully valid content is publicly visible", () => {
  const approved = { status: "approved" as const, reviewer: "SecurityCorp owner", reviewedAt: "2026-01-01" };
  const meta = baseMeta({ status: "published", tags: ["docker", "kubernetes"], evidenceState: "VALIDATED", publishedAt: "2026-01-01", lastReviewedAt: "2026-01-01", privacyReview: approved, technicalReview: approved, publicationApproval: approved });
  assert.equal(isPubliclyVisible(meta), true);
});

test("UNVERIFIED content needs the same explicit human approval gate", () => {
  const approved = { status: "approved" as const, reviewer: "SecurityCorp owner", reviewedAt: "2026-01-01" };
  const withoutOwnerApproval = baseMeta({ status: "published", tags: ["docker", "kubernetes"], evidenceState: "UNVERIFIED", publishedAt: "2026-01-01", lastReviewedAt: "2026-01-01", privacyReview: approved, technicalReview: approved });
  assert.equal(isPubliclyVisible(withoutOwnerApproval), false);

  const explicitOwnerApproval = { ...withoutOwnerApproval, publicationApproval: approved };
  assert.equal(isPubliclyVisible(explicitOwnerApproval), true);
});

test("published but invalid content (e.g. missing review) is not publicly visible", () => {
  const meta = baseMeta({ status: "published", tags: ["docker", "kubernetes"], publishedAt: "2026-01-01", lastReviewedAt: "2026-01-01" });
  assert.equal(isPubliclyVisible(meta), false);
});

test("duplicate slugs are detected across the catalog", () => {
  const a = baseMeta({ slug: "same-slug" });
  const b = baseMeta({ slug: "same-slug" });
  const errors = validateCatalogIntegrity([a, b]);
  assert.ok(errors.some((e) => e.includes('duplicate slug "same-slug"')));
});

test("unique slugs produce no catalog errors", () => {
  const a = baseMeta({ slug: "one" });
  const b = baseMeta({ slug: "two" });
  assert.deepEqual(validateCatalogIntegrity([a, b]), []);
});
