import { test } from "node:test";
import assert from "node:assert/strict";
import { getSecurityTxtContent, getSecurityTxtExpiryStatus, SECURITY_TXT_EXPIRES } from "./security-txt.ts";

test("getSecurityTxtContent includes required RFC 9116 fields", () => {
  const content = getSecurityTxtContent();
  assert.match(content, /^Contact: https:\/\//m);
  assert.match(content, new RegExp(`^Expires: ${SECURITY_TXT_EXPIRES}$`, "m"));
  assert.match(content, /^Canonical: https:\/\/securitycorp\.net\/\.well-known\/security\.txt$/m);
});

test("getSecurityTxtContent does not include a personal email address", () => {
  const content = getSecurityTxtContent();
  assert.doesNotMatch(content, /@(?!github)/);
});

test("getSecurityTxtExpiryStatus is ok well before expiry", () => {
  const now = new Date(SECURITY_TXT_EXPIRES);
  now.setUTCDate(now.getUTCDate() - 60);
  assert.equal(getSecurityTxtExpiryStatus(now), "ok");
});

test("getSecurityTxtExpiryStatus is expiring-soon within the 30-day window", () => {
  const now = new Date(SECURITY_TXT_EXPIRES);
  now.setUTCDate(now.getUTCDate() - 10);
  assert.equal(getSecurityTxtExpiryStatus(now), "expiring-soon");
});

test("getSecurityTxtExpiryStatus is expiring-soon exactly at the 30-day boundary", () => {
  const now = new Date(SECURITY_TXT_EXPIRES);
  now.setUTCDate(now.getUTCDate() - 30);
  assert.equal(getSecurityTxtExpiryStatus(now), "expiring-soon");
});

test("getSecurityTxtExpiryStatus is expired after the date has passed", () => {
  const now = new Date(SECURITY_TXT_EXPIRES);
  now.setUTCDate(now.getUTCDate() + 1);
  assert.equal(getSecurityTxtExpiryStatus(now), "expired");
});
