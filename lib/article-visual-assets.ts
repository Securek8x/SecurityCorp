// Pure, filesystem-adjacent logic for the article-visual asset pipeline,
// split out of scripts/check-article-visuals.ts so it's directly unit-
// testable (same rationale as lib/sitemap-entries.ts being split out of
// app/sitemap.ts — pure logic lives in lib/*.ts with a lib/*.test.ts,
// scripts/*.ts stays a thin orchestration wrapper around it).
import path from "node:path";

export const RASTER_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".avif", ".webp"]);
export const SUPPORTED_ASSET_EXTENSIONS = new Set([...RASTER_EXTENSIONS, ".svg"]);

// Targeted checks, not a general-purpose SVG sanitizer — see the comment
// on scanSvgForUnsafePatterns below for exactly what this does and does
// not cover.
const UNSAFE_SVG_PATTERNS = [
  /<script/i,
  /\son\w+\s*=/i,
  /(?:xlink:href|href)\s*=\s*["']https?:/i,
  /<foreignObject/i,
  /<!ENTITY/i,
];

/** Resolves a declared asset src (e.g. "/article-visuals/foo-cover.webp")
 * to an absolute filesystem path, requiring the normalized result to stay
 * inside `assetsDirAbs`. Returns `{ ok: true, filePath }` or
 * `{ ok: false, reason }` — never throws, never reads the filesystem.
 * Rejects: external URLs (any "scheme://" or protocol-relative "//"),
 * query strings/fragments, backslashes, anything not starting with
 * "/article-visuals/", and anything that normalizes outside
 * `assetsDirAbs` (e.g. via "..") — checked on the normalized/resolved
 * path, not by string-prefix assumption alone. */
export function resolveAssetPath(src: string, publicDirAbs: string, assetsDirAbs: string): { ok: true; filePath: string } | { ok: false; reason: string } {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(src) || src.startsWith("//")) {
    return { ok: false, reason: "external URL, not a local asset path" };
  }
  if (/[?#]/.test(src)) return { ok: false, reason: "query string or fragment not allowed" };
  if (src.includes("\\")) return { ok: false, reason: "backslashes not allowed" };
  if (!src.startsWith("/article-visuals/")) return { ok: false, reason: 'must start with "/article-visuals/"' };

  const filePath = path.normalize(path.join(publicDirAbs, src.replace(/^\//, "")));
  const relative = path.relative(assetsDirAbs, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return { ok: false, reason: "resolves outside public/article-visuals/" };
  }
  return { ok: true, filePath };
}

export type DimensionCheck = { ok: true } | { ok: false; reason: string };

/** Compares a raster's actual decoded pixel dimensions (read from the file
 * itself, e.g. via sharp's `.metadata()`) against the dimensions declared
 * on its ArticleVisual record. Pure comparison — the caller is responsible
 * for actually opening the file; this function never touches the
 * filesystem, so it stays testable without a real image or the `sharp`
 * dependency. Closes the "dimension verification" gap named in
 * docs/article-visual-guidelines.md. */
export function checkDimensionsMatch(actual: { width: number; height: number }, declared: { width: number; height: number }): DimensionCheck {
  if (actual.width !== declared.width || actual.height !== declared.height) {
    return {
      ok: false,
      reason: `actual dimensions ${actual.width}x${actual.height} do not match declared ${declared.width}x${declared.height}`,
    };
  }
  return { ok: true };
}

/** A minimal shape mirroring the fields of sharp's `Metadata` result that
 * matter for the "no disallowed embedded metadata" requirement. Kept as a
 * plain structural type (not imported from `sharp`) so this stays
 * testable without the `sharp` dependency. */
export type RasterMetadataSummary = {
  exif?: unknown;
  icc?: unknown;
  iptc?: unknown;
  xmp?: unknown;
  /** sharp reports EXIF orientation 1-8; 1 (or absent) means "already
   * normalized, nothing to strip." Anything else means orientation
   * metadata is still present and must be resolved (via `.rotate()`)
   * before the file can be considered clean. */
  orientation?: number;
  comments?: unknown[];
};

/** Returns the names of every disallowed metadata field actually present
 * in a decoded raster's metadata — EXIF, ICC profile, IPTC, XMP, a
 * non-normalized orientation tag, or embedded comments. An empty array
 * means the file is clean. Pure classifier — no filesystem/sharp
 * dependency, so it's directly unit-testable against a plain object
 * shaped like sharp's `.metadata()` return. */
export function hasDisallowedMetadata(metadata: RasterMetadataSummary): string[] {
  const found: string[] = [];
  if (metadata.exif) found.push("exif");
  if (metadata.icc) found.push("icc");
  if (metadata.iptc) found.push("iptc");
  if (metadata.xmp) found.push("xmp");
  if (metadata.orientation !== undefined && metadata.orientation !== 1) found.push(`orientation (${metadata.orientation})`);
  if (metadata.comments && metadata.comments.length > 0) found.push("comments");
  return found;
}

export type RasterBudgetCheck = { withinBudget: true } | { withinBudget: false; reason: string };

/** A raster's own declared brief.sizeBudgetKb is the enforced limit — NOT
 * a shared global number. `absoluteCeilingBytes` is a separate, generous
 * backstop that still applies even when a visual's own declared budget is
 * larger than it (a brief can't set an absurd budget to escape the
 * ceiling). */
export function checkRasterBudget(sizeBytes: number, budgetKb: number, absoluteCeilingBytes: number): RasterBudgetCheck {
  const budgetBytes = budgetKb * 1024;
  if (sizeBytes > budgetBytes) {
    return { withinBudget: false, reason: `${(sizeBytes / 1024).toFixed(0)}KB exceeds this visual's own ${budgetKb}KB budget (brief.sizeBudgetKb)` };
  }
  if (sizeBytes > absoluteCeilingBytes) {
    return {
      withinBudget: false,
      reason: `${(sizeBytes / 1024).toFixed(0)}KB exceeds the absolute ${(absoluteCeilingBytes / 1024).toFixed(0)}KB ceiling, even though it is under its declared per-visual budget`,
    };
  }
  return { withinBudget: true };
}

/** Targeted SVG safety scan — NOT a comprehensive sanitizer. Checks for:
 * `<script>` tags, inline event-handler attributes (`onload=`, etc.),
 * external resource references via `xlink:href` or bare `href` pointing
 * at an http(s) URL, `<foreignObject>` (can embed arbitrary HTML), and
 * XML external entities (`<!ENTITY`). Does NOT check `@import`/`url(...)`
 * inside embedded `<style>` blocks, SMIL `<animate>`/`<set>` scripting
 * vectors, or any other form not listed here — do not represent this as
 * complete SVG sanitization in documentation or a PR description. */
export function scanSvgForUnsafePatterns(content: string): string[] {
  return UNSAFE_SVG_PATTERNS.filter((pattern) => pattern.test(content)).map((pattern) => pattern.toString());
}
