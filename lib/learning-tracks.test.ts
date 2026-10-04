import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findCycle,
  learningTracks,
  publishedLearningTracks,
  trackPositionsForArticle,
  validateLearningTracks,
  type LearningTrack,
} from "./learning-tracks.ts";
import { checkKnowledgeSequenceGraph, checkKnowledgeGraphOrphans, type KnowledgeArticleForIntegrity } from "./route-integrity.ts";
import { knowledgeArticles, publishedKnowledgeArticles } from "./knowledge-content.ts";
import type { KnowledgeArticleMeta } from "./knowledge-schema.ts";
import type { UniversalSections } from "./knowledge-content-types.ts";

const known = new Set(["a", "b", "c", "d", "draft-x"]);
const published = new Set(["a", "b", "c", "d"]);

function track(overrides: Partial<LearningTrack> = {}): LearningTrack {
  return {
    id: "example-track",
    title: "Example Track",
    summary: "A fictional track used only by tests.",
    audience: ["practitioner"],
    difficulty: "intermediate",
    prerequisiteTrackIds: [],
    stages: [
      { title: "Stage one", articleSlugs: ["a", "b"], checkpoint: "Explain stage one." },
      { title: "Stage two", articleSlugs: ["c"], checkpoint: "Explain stage two." },
    ],
    learningOutcomes: ["Plan a fictional thing."],
    status: "published",
    ...overrides,
  };
}

test("a well-formed published track validates", () => {
  assert.deepEqual(validateLearningTracks([track()], known, published), []);
});

test("the registry ships empty and nothing unpublished is public", () => {
  assert.deepEqual(validateLearningTracks(learningTracks, new Set(knowledgeArticles.map((a) => a.meta.slug)), new Set(publishedKnowledgeArticles.map((a) => a.meta.slug))), []);
  assert.ok(publishedLearningTracks.every((t) => t.status === "published"));
});

test("rejects unknown articles, and unpublished articles in a published track", () => {
  const unknown = validateLearningTracks([track({ stages: [{ title: "s", articleSlugs: ["nope"], checkpoint: "c" }] })], known, published);
  assert.ok(unknown.some((e) => e.includes('unknown article "nope"')), unknown.join("\n"));
  const draftRef = validateLearningTracks([track({ stages: [{ title: "s", articleSlugs: ["draft-x"], checkpoint: "c" }] })], known, published);
  assert.ok(draftRef.some((e) => e.includes('unpublished article "draft-x"')), draftRef.join("\n"));
  // The same reference is allowed while the track itself is still drafting.
  assert.deepEqual(validateLearningTracks([track({ status: "drafting", stages: [{ title: "s", articleSlugs: ["draft-x"], checkpoint: "c" }] })], known, published), []);
});

test("rejects structural gaps: empty stages, missing checkpoint, missing outcome, repeated article", () => {
  assert.ok(validateLearningTracks([track({ stages: [] })], known, published).some((e) => e.includes("at least one stage")));
  assert.ok(validateLearningTracks([track({ learningOutcomes: [] })], known, published).some((e) => e.includes("learning outcome")));
  assert.ok(
    validateLearningTracks([track({ stages: [{ title: "s", articleSlugs: ["a"], checkpoint: " " }] })], known, published).some((e) => e.includes("checkpoint is required")),
  );
  assert.ok(
    validateLearningTracks([track({ stages: [{ title: "s", articleSlugs: ["a"], checkpoint: "c" }, { title: "t", articleSlugs: ["a"], checkpoint: "c" }] })], known, published).some((e) =>
      e.includes("appears more than once"),
    ),
  );
  assert.ok(validateLearningTracks([track({ id: "Bad Id" })], known, published).some((e) => e.includes("kebab-case")));
  assert.ok(validateLearningTracks([track(), track()], known, published).some((e) => e.includes("duplicate learning-track id")));
});

test("rejects credential or guaranteed-outcome promises", () => {
  const errors = validateLearningTracks([track({ learningOutcomes: ["Become certified in pipeline security."] })], known, published);
  assert.ok(errors.some((e) => e.includes("credential or guaranteed outcome")), errors.join("\n"));
  // Security vocabulary must not trip the guard.
  assert.deepEqual(validateLearningTracks([track({ learningOutcomes: ["Explain why a certificate chain is validated and how credentials are scoped."] })], known, published), []);
});

test("track prerequisites: unknown, self, unpublished-from-published, and cycles are rejected", () => {
  assert.ok(validateLearningTracks([track({ prerequisiteTrackIds: ["ghost"] })], known, published).some((e) => e.includes('unknown prerequisite track "ghost"')));
  assert.ok(validateLearningTracks([track({ prerequisiteTrackIds: ["example-track"] })], known, published).some((e) => e.includes("lists itself")));
  const draftPre = validateLearningTracks([track({ prerequisiteTrackIds: ["base"] }), track({ id: "base", status: "drafting" })], known, published);
  assert.ok(draftPre.some((e) => e.includes('unpublished prerequisite track "base"')), draftPre.join("\n"));
  const cyc = validateLearningTracks([track({ id: "x", prerequisiteTrackIds: ["y"] }), track({ id: "y", prerequisiteTrackIds: ["x"] })], known, published);
  assert.ok(cyc.some((e) => e.includes("form a cycle")), cyc.join("\n"));
});

test("findCycle returns the loop, ignores dangling edges, and passes DAGs", () => {
  assert.equal(findCycle(new Map([["a", ["b"]], ["b", ["c"]], ["c", []]])), undefined);
  assert.equal(findCycle(new Map([["a", ["missing"]]])), undefined);
  assert.deepEqual(findCycle(new Map([["a", ["b"]], ["b", ["c"]], ["c", ["a"]]])), ["a", "b", "c", "a"]);
});

test("trackPositionsForArticle reports stage and 1-based position without stored progress", () => {
  assert.deepEqual(trackPositionsForArticle("c", [track()]), [
    { trackId: "example-track", trackTitle: "Example Track", stageIndex: 1, stageTitle: "Stage two", position: 3, total: 3 },
  ]);
  assert.deepEqual(trackPositionsForArticle("zzz", [track()]), []);
});

function art(slug: string, sections: UniversalSections): KnowledgeArticleForIntegrity {
  return { meta: { slug } as KnowledgeArticleMeta, sections };
}

test("checkKnowledgeSequenceGraph: accepts a chain, rejects cycles, self-links, and dangling prerequisites", () => {
  assert.deepEqual(checkKnowledgeSequenceGraph([art("a", { nextSlug: "b" }), art("b", { nextSlug: "c", prerequisiteSlugs: ["a"] }), art("c", {})]), []);
  const loop = checkKnowledgeSequenceGraph([art("a", { nextSlug: "b" }), art("b", { nextSlug: "a" })]);
  assert.ok(loop.some((e) => e.startsWith("nextSlug links form a cycle")), loop.join("\n"));
  const preLoop = checkKnowledgeSequenceGraph([art("a", { prerequisiteSlugs: ["b"] }), art("b", { prerequisiteSlugs: ["a"] })]);
  assert.ok(preLoop.some((e) => e.startsWith("prerequisiteSlugs form a cycle")), preLoop.join("\n"));
  assert.ok(checkKnowledgeSequenceGraph([art("a", { nextSlug: "a" })]).some((e) => e.includes("nextSlug references itself")));
  assert.ok(checkKnowledgeSequenceGraph([art("a", { relatedSlugs: ["a"] })]).some((e) => e.includes("relatedSlugs references itself")));
  assert.ok(checkKnowledgeSequenceGraph([art("a", { prerequisiteSlugs: ["a"] })]).some((e) => e.includes("prerequisiteSlugs references itself")));
  assert.ok(checkKnowledgeSequenceGraph([art("a", { prerequisiteSlugs: ["ghost"] })]).some((e) => e.includes('unpublished slug "ghost"')));
  // Mutual related links are fine — related is undirected "see also".
  assert.deepEqual(checkKnowledgeSequenceGraph([art("a", { relatedSlugs: ["b"] }), art("b", { relatedSlugs: ["a"] })]), []);
});

test("prerequisite links count as connections for the orphan warning", () => {
  assert.deepEqual(checkKnowledgeGraphOrphans([art("a", { prerequisiteSlugs: ["b"] }), art("b", {})]), []);
});

test("the live catalog's navigation graph is valid", () => {
  assert.deepEqual(checkKnowledgeSequenceGraph(publishedKnowledgeArticles), []);
});

// Content-sufficiency probe for securitycorp-source-4zl.59.2.1 ("Secure Code
// to Production"): the bead's four stages, built only from the article slugs
// it names plus live articles that fit each stage, validate as a PUBLISHED
// track against the real catalog. This fixture is test-only — it is not
// registered and never renders; the public track still goes through the
// editorial workflow. Text here is placeholder, not proposed public copy.
test("Secure Code to Production can be assembled entirely from published articles", () => {
  const probe = track({
    id: "secure-code-to-production",
    title: "probe",
    summary: "probe",
    audience: ["practitioner", "security-engineer"],
    stages: [
      { title: "1", articleSlugs: ["practical-secure-code-review-checklist", "sast-vs-dast-vs-software-composition-analysis"], checkpoint: "probe" },
      { title: "2", articleSlugs: ["dependency-confusion-package-trust", "securing-api-authentication-authorization", "sboms-what-they-solve"], checkpoint: "probe" },
      { title: "3", articleSlugs: ["threat-modeling-cicd-pipeline", "protecting-main-branch-beyond-pr-approval", "build-runners-untrusted", "least-privilege-for-pipeline-identities"], checkpoint: "probe" },
      { title: "4", articleSlugs: ["verifying-build-artifacts-before-deployment"], checkpoint: "probe" },
    ],
    learningOutcomes: ["probe"],
  });
  const all = new Set(knowledgeArticles.map((a) => a.meta.slug));
  const pub = new Set(publishedKnowledgeArticles.map((a) => a.meta.slug));
  assert.deepEqual(validateLearningTracks([probe], all, pub), []);
});
