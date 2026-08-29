import { test } from "node:test";
import assert from "node:assert/strict";
import { pillars, categories, pillarById, categoriesForPillar, checkTaxonomyIntegrity } from "./taxonomy.ts";

test("exactly six pillars and twenty-one categories", () => {
  assert.equal(pillars.length, 6);
  assert.equal(categories.length, 21);
});

test("no duplicate pillar identifiers", () => {
  const ids = pillars.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("no duplicate category identifiers", () => {
  const ids = categories.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every category belongs to exactly one existing pillar", () => {
  for (const category of categories) {
    assert.ok(pillarById.has(category.pillar), `category "${category.id}" references unknown pillar "${category.pillar}"`);
  }
});

test("no orphaned categories: every pillar's categories() are reachable and every category maps back", () => {
  for (const pillar of pillars) {
    const cats = categoriesForPillar(pillar.id);
    assert.ok(cats.length > 0, `pillar "${pillar.id}" has no categories`);
    for (const c of cats) assert.equal(c.pillar, pillar.id);
  }
  const reachable = new Set(pillars.flatMap((p) => categoriesForPillar(p.id).map((c) => c.id)));
  for (const c of categories) assert.ok(reachable.has(c.id), `category "${c.id}" is not reachable from any pillar`);
});

test("checkTaxonomyIntegrity reports no errors on the real taxonomy", () => {
  assert.deepEqual(checkTaxonomyIntegrity(), []);
});
