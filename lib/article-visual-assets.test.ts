import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { resolveAssetPath, checkRasterBudget, scanSvgForUnsafePatterns } from "./article-visual-assets.ts";

const PUBLIC_DIR = "/repo/public";
const ASSETS_DIR = path.join(PUBLIC_DIR, "article-visuals");

test("resolveAssetPath accepts a well-formed flat path inside article-visuals/", () => {
  const result = resolveAssetPath("/article-visuals/some-slug-cover.webp", PUBLIC_DIR, ASSETS_DIR);
  assert.equal(result.ok, true);
  assert.ok(result.ok && result.filePath === path.join(ASSETS_DIR, "some-slug-cover.webp"));
});

test("resolveAssetPath accepts a nested per-article subdirectory path", () => {
  const result = resolveAssetPath("/article-visuals/some-slug/cover.webp", PUBLIC_DIR, ASSETS_DIR);
  assert.equal(result.ok, true);
  assert.ok(result.ok && result.filePath === path.join(ASSETS_DIR, "some-slug", "cover.webp"));
});

test("resolveAssetPath rejects path traversal via ..", () => {
  const result = resolveAssetPath("/article-visuals/../../etc/passwd", PUBLIC_DIR, ASSETS_DIR);
  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.reason.includes("outside"));
});

test("resolveAssetPath rejects an absolute filesystem path disguised as a src", () => {
  const result = resolveAssetPath("/article-visuals/foo/../../../etc/passwd", PUBLIC_DIR, ASSETS_DIR);
  assert.equal(result.ok, false);
});

test("resolveAssetPath rejects external URLs", () => {
  for (const src of ["https://evil.example/x.webp", "http://evil.example/x.webp", "//evil.example/x.webp"]) {
    const result = resolveAssetPath(src, PUBLIC_DIR, ASSETS_DIR);
    assert.equal(result.ok, false, `expected ${src} to be rejected`);
    assert.ok(!result.ok && result.reason.includes("external"));
  }
});

test("resolveAssetPath rejects query strings and fragments", () => {
  const withQuery = resolveAssetPath("/article-visuals/cover.webp?x=1", PUBLIC_DIR, ASSETS_DIR);
  assert.equal(withQuery.ok, false);
  const withFragment = resolveAssetPath("/article-visuals/cover.webp#frag", PUBLIC_DIR, ASSETS_DIR);
  assert.equal(withFragment.ok, false);
});

test("resolveAssetPath rejects backslashes", () => {
  const result = resolveAssetPath("/article-visuals/..\\..\\windows\\system32", PUBLIC_DIR, ASSETS_DIR);
  assert.equal(result.ok, false);
});

test("resolveAssetPath rejects a path outside article-visuals/ entirely", () => {
  const result = resolveAssetPath("/other-dir/cover.webp", PUBLIC_DIR, ASSETS_DIR);
  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.reason.includes('must start with "/article-visuals/"'));
});

test("checkRasterBudget passes when under the declared per-visual budget", () => {
  const result = checkRasterBudget(50 * 1024, 200, 1024 * 1024);
  assert.equal(result.withinBudget, true);
});

test("checkRasterBudget fails when over the declared per-visual budget but under the global ceiling", () => {
  const result = checkRasterBudget(250 * 1024, 200, 1024 * 1024);
  assert.equal(result.withinBudget, false);
  assert.ok(!result.withinBudget && result.reason.includes("own 200KB budget"));
});

test("checkRasterBudget fails when over both the per-visual budget and the absolute ceiling", () => {
  const result = checkRasterBudget(2 * 1024 * 1024, 200, 1024 * 1024);
  assert.equal(result.withinBudget, false);
  assert.ok(!result.withinBudget && result.reason.includes("own 200KB budget"));
});

test("checkRasterBudget flags the absolute ceiling even when a visual declares an oversized budget", () => {
  const result = checkRasterBudget(2 * 1024 * 1024, 5000, 1024 * 1024);
  assert.equal(result.withinBudget, false);
  assert.ok(!result.withinBudget && result.reason.includes("absolute"));
});

test("scanSvgForUnsafePatterns flags a <script> tag", () => {
  const findings = scanSvgForUnsafePatterns('<svg><script>alert(1)</script></svg>');
  assert.ok(findings.length > 0);
});

test("scanSvgForUnsafePatterns flags an inline event handler", () => {
  const findings = scanSvgForUnsafePatterns('<svg onload="alert(1)"></svg>');
  assert.ok(findings.length > 0);
});

test("scanSvgForUnsafePatterns flags an external xlink:href reference", () => {
  const findings = scanSvgForUnsafePatterns('<svg><image xlink:href="https://evil.example/x.png"/></svg>');
  assert.ok(findings.length > 0);
});

test("scanSvgForUnsafePatterns flags an external bare href reference", () => {
  const findings = scanSvgForUnsafePatterns('<svg><use href="https://evil.example/x.svg#y"/></svg>');
  assert.ok(findings.length > 0);
});

test("scanSvgForUnsafePatterns flags a foreignObject element", () => {
  const findings = scanSvgForUnsafePatterns('<svg><foreignObject><body xmlns="http://www.w3.org/1999/xhtml">x</body></foreignObject></svg>');
  assert.ok(findings.length > 0);
});

test("scanSvgForUnsafePatterns flags an XML external entity", () => {
  const findings = scanSvgForUnsafePatterns('<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>');
  assert.ok(findings.length > 0);
});

test("scanSvgForUnsafePatterns finds nothing in a clean, static SVG", () => {
  const findings = scanSvgForUnsafePatterns('<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#0ff"/></svg>');
  assert.deepEqual(findings, []);
});
