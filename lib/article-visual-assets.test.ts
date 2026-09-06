import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { resolveAssetPath, checkRasterBudget, scanSvgForUnsafePatterns, checkDimensionsMatch, hasDisallowedMetadata } from "./article-visual-assets.ts";

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

test("checkDimensionsMatch passes on an exact match", () => {
  const result = checkDimensionsMatch({ width: 1600, height: 900 }, { width: 1600, height: 900 });
  assert.equal(result.ok, true);
});

test("checkDimensionsMatch fails on an off-by-one width", () => {
  const result = checkDimensionsMatch({ width: 1601, height: 900 }, { width: 1600, height: 900 });
  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.reason.includes("1601x900"));
});

test("checkDimensionsMatch fails on an off-by-one height", () => {
  const result = checkDimensionsMatch({ width: 1600, height: 899 }, { width: 1600, height: 900 });
  assert.equal(result.ok, false);
});

test("checkDimensionsMatch fails on swapped width/height", () => {
  const result = checkDimensionsMatch({ width: 900, height: 1600 }, { width: 1600, height: 900 });
  assert.equal(result.ok, false);
});

test("hasDisallowedMetadata returns empty for a clean metadata object", () => {
  const findings = hasDisallowedMetadata({ orientation: 1 });
  assert.deepEqual(findings, []);
});

test("hasDisallowedMetadata returns empty for a metadata object with no fields at all", () => {
  const findings = hasDisallowedMetadata({});
  assert.deepEqual(findings, []);
});

test("hasDisallowedMetadata flags exif individually", () => {
  const findings = hasDisallowedMetadata({ exif: Buffer.from("x") });
  assert.deepEqual(findings, ["exif"]);
});

test("hasDisallowedMetadata flags icc individually", () => {
  const findings = hasDisallowedMetadata({ icc: Buffer.from("x") });
  assert.deepEqual(findings, ["icc"]);
});

test("hasDisallowedMetadata flags iptc individually", () => {
  const findings = hasDisallowedMetadata({ iptc: Buffer.from("x") });
  assert.deepEqual(findings, ["iptc"]);
});

test("hasDisallowedMetadata flags xmp individually", () => {
  const findings = hasDisallowedMetadata({ xmp: Buffer.from("x") });
  assert.deepEqual(findings, ["xmp"]);
});

test("hasDisallowedMetadata flags a non-normalized orientation", () => {
  const findings = hasDisallowedMetadata({ orientation: 6 });
  assert.deepEqual(findings, ["orientation (6)"]);
});

test("hasDisallowedMetadata flags embedded comments", () => {
  const findings = hasDisallowedMetadata({ comments: ["some comment"] });
  assert.deepEqual(findings, ["comments"]);
});

test("hasDisallowedMetadata flags every disallowed field in combination", () => {
  const findings = hasDisallowedMetadata({
    exif: Buffer.from("x"),
    icc: Buffer.from("x"),
    iptc: Buffer.from("x"),
    xmp: Buffer.from("x"),
    orientation: 3,
    comments: ["x"],
  });
  assert.deepEqual(findings, ["exif", "icc", "iptc", "xmp", "orientation (3)", "comments"]);
});
