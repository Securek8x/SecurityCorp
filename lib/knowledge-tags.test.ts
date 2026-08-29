import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TAG_ALIAS_ENTRIES,
  TAG_ALIASES,
  TAG_GROUPS,
  TAG_VOCABULARY,
  isKnownTagId,
  resolveTagId,
  tagLabel,
  validateTags,
  validateTagVocabulary,
} from "./knowledge-tags.ts";

test("the real vocabulary satisfies every structural integrity rule", () => {
  assert.deepEqual(validateTagVocabulary(), []);
});

test("vocabulary count is derived from the collection and all ids are unique", () => {
  const ids = TAG_VOCABULARY.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(TAG_VOCABULARY.length, new Set(ids).size);
  assert.equal(TAG_VOCABULARY.length, new Set(TAG_VOCABULARY.map((tag) => tag.label)).size);
  assert.ok(TAG_VOCABULARY.every((tag) => TAG_GROUPS.includes(tag.group)));
});

test("structural validation catches alias and case-collision drift", () => {
  const errors = validateTagVocabulary(
    [
      { id: "docker", label: "Docker", group: "technology" },
      { id: "Docker", label: "docker", group: "not-a-group" as never },
    ],
    [
      ["docker", "docker"],
      ["k8s", "unknown"],
      ["K8S", "docker"],
      ["k8s", "Docker"],
    ],
  );
  assert.ok(errors.some((error) => error.includes("case-insensitive canonical collision")));
  assert.ok(errors.some((error) => error.includes("duplicate display label")));
  assert.ok(errors.some((error) => error.includes("invalid tag group")));
  assert.ok(errors.some((error) => error.includes("equals a canonical id")));
  assert.ok(errors.some((error) => error.includes("points at unknown id")));
  assert.ok(errors.some((error) => error.includes("must be lowercase and trimmed")));
  assert.ok(errors.some((error) => error.includes("maps to multiple canonical ids")));
});

test("alias entries and resolved aliases stay one-to-one", () => {
  assert.equal(Object.keys(TAG_ALIASES).length, TAG_ALIAS_ENTRIES.length);
  for (const [alias, target] of TAG_ALIAS_ENTRIES) assert.equal(TAG_ALIASES[alias], target);
});

test("canonical ids validate with no errors", () => {
  assert.deepEqual(validateTags(["docker", "kubernetes"]), []);
});

test("unknown tags are rejected", () => {
  const errors = validateTags(["not-a-real-tag"]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /unknown tag "not-a-real-tag"/);
});

test("alias input is rejected with a pointer to the canonical id, not silently accepted", () => {
  const errors = validateTags(["k8s"]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /use canonical id "kubernetes"/);
});

test("casing variants of a canonical id are rejected, not silently normalized", () => {
  const errors = validateTags(["Docker"]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /unknown tag "Docker"/);
});

test("duplicate canonical tags are rejected", () => {
  const errors = validateTags(["docker", "docker"]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /duplicate tag "docker"/);
});

test("resolveTagId resolves aliases and casing/whitespace variants for authoring tooling", () => {
  assert.equal(resolveTagId("k8s"), "kubernetes");
  assert.equal(resolveTagId("Kubernetes"), "kubernetes");
  assert.equal(resolveTagId("  docker  "), "docker");
  assert.equal(resolveTagId("not-a-real-tag"), undefined);
});

test("network segmentation remains distinct from network isolation", () => {
  assert.equal(resolveTagId("network segmentation"), "network-segmentation");
  assert.equal(isKnownTagId("network-segmentation"), true);
  assert.equal(isKnownTagId("network-isolation"), true);
});


test("isKnownTagId only accepts exact canonical ids", () => {
  assert.equal(isKnownTagId("docker"), true);
  assert.equal(isKnownTagId("k8s"), false);
  assert.equal(isKnownTagId("Docker"), false);
});

test("tagLabel returns the display label for known ids and falls back to the raw id otherwise", () => {
  assert.equal(tagLabel("docker"), "Docker");
  assert.equal(tagLabel("not-a-real-tag"), "not-a-real-tag");
});
