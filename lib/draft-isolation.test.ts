import { test } from "node:test";
import assert from "node:assert/strict";
import { draftSlugs, validateDraftIsolation } from "./draft-isolation.ts";

test("unapproved draft fixture remains outside the knowledge-content registry", () => {
  assert.ok(draftSlugs().includes("workflow-isolation-draft"));
  assert.deepEqual(validateDraftIsolation(), []);
});
