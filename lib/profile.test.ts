import { test } from "node:test";
import assert from "node:assert/strict";
import { certifications, verifiableUrl } from "./profile.ts";

test("no certification currently carries a verify link (none have been confirmed)", () => {
  for (const c of certifications) assert.equal(verifiableUrl(c), undefined, c.name);
});

test("only real https URLs render as verify links; placeholders are omitted", () => {
  assert.equal(verifiableUrl({ name: "X", verifyUrl: "https://www.credly.com/badges/abc" }), "https://www.credly.com/badges/abc");
  for (const bad of ["", "http://www.credly.com/badges/abc", "https://example.com/verify", "https://sub.example.org/x", "https://localhost/x", "#", "TODO", "javascript:alert(1)", "https://verify"]) {
    assert.equal(verifiableUrl({ name: "X", verifyUrl: bad }), undefined, bad);
  }
});
