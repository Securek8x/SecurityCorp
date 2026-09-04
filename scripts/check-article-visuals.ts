// Article visual audit (Bead securitycorp-source-s41.9-12 pilot). Checks
// the type-safe provenance/brief data (via validateArticleVisual) AND the
// filesystem-level concerns that data alone can't catch: missing files,
// oversized rasters, missing dimensions, unsafe SVG, orphaned assets,
// unsupported formats, unsafe asset paths. Publication-gate enforcement
// (requiring every published article to have SOME cover) is OFF by
// default during the migration period — see VISUAL_GATE_ENABLED in
// lib/article-visuals.ts. checkAssetApprovalGate below is a SEPARATE,
// always-on concern (never gated by VISUAL_GATE_ENABLED): whether any
// cover that IS present is actually human-approved for production.
//
// Known, deliberate limitation: this script validates metadata only —
// declared width/height and declared file size — it does NOT open
// AVIF/WebP/PNG/JPEG files and compare their real pixel dimensions
// against the declared width/height, and it does NOT verify that a
// raster's embedded metadata has been stripped. Both would require a new
// image-inspection dependency (e.g. `image-size`), which this script
// intentionally has not added — that requires Ravi's explicit
// authorization (exact package, pinned version, reason, dependency-review
// result) before being added, per docs/article-visual-guidelines.md.
// Until that lands, a real asset must be manually confirmed to match its
// declared dimensions and to have had its metadata stripped before it can
// be promoted past stage "asset".
//
// Pure path/budget/SVG-pattern logic lives in lib/article-visual-assets.ts
// (unit-tested there) — this script is the thin fs-walking orchestrator.
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import path from "node:path";
import { knowledgeArticles } from "../lib/knowledge-content.ts";
import { validateArticleVisual, checkCoverImageGate, checkAssetApprovalGate, type ArticleVisual } from "../lib/article-visuals.ts";
import { RASTER_EXTENSIONS, SUPPORTED_ASSET_EXTENSIONS, resolveAssetPath, checkRasterBudget, scanSvgForUnsafePatterns } from "../lib/article-visual-assets.ts";

const errors: string[] = [];
const warnings: string[] = [];

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ASSETS_DIR = path.join(PUBLIC_DIR, "article-visuals");
// Backstop only — the real enforced limit is each visual's own
// brief.sizeBudgetKb. This ceiling exists so a brief that forgot to set a
// sane sizeBudgetKb still can't ship something absurd.
const ABSOLUTE_MAX_RASTER_BYTES = 1024 * 1024; // 1MB

const referencedAssets = new Set<string>();

function checkAssetFile(visual: ArticleVisual, articleSlug: string) {
  if (visual.stage === "brief" || !visual.src) return;
  const ext = path.extname(visual.src).toLowerCase();
  if (!SUPPORTED_ASSET_EXTENSIONS.has(ext)) {
    errors.push(`${articleSlug} ${visual.visualType}: unsupported format "${ext}" (src: ${visual.src})`);
    return;
  }

  const resolved = resolveAssetPath(visual.src, PUBLIC_DIR, ASSETS_DIR);
  if (!resolved.ok) {
    errors.push(`${articleSlug} ${visual.visualType}: unsafe asset path "${visual.src}" — ${resolved.reason}`);
    return;
  }
  const filePath = resolved.filePath;
  referencedAssets.add(filePath);

  if (!existsSync(filePath)) {
    errors.push(`${articleSlug} ${visual.visualType}: referenced file not found at public${visual.src}`);
    return;
  }

  if (RASTER_EXTENSIONS.has(ext)) {
    const size = statSync(filePath).size;
    const budgetCheck = checkRasterBudget(size, visual.brief.sizeBudgetKb, ABSOLUTE_MAX_RASTER_BYTES);
    if (!budgetCheck.withinBudget) {
      errors.push(`${articleSlug} ${visual.visualType}: ${budgetCheck.reason} (${visual.src})`);
    }
  }

  if (ext === ".svg") {
    const content = readFileSync(filePath, "utf-8");
    for (const pattern of scanSvgForUnsafePatterns(content)) {
      errors.push(`${articleSlug} ${visual.visualType}: SVG at ${visual.src} matches an unsafe pattern (${pattern})`);
    }
  }
}

for (const article of knowledgeArticles) {
  const slug = article.meta.slug;

  if (article.coverImage) {
    errors.push(...validateArticleVisual(article.coverImage, slug));
    checkAssetFile(article.coverImage, slug);
  } else if (article.meta.status === "published") {
    warnings.push(`${slug}: published with no coverImage at all — not yet required (migration period), but worth a brief`);
  }
}

errors.push(...checkCoverImageGate(knowledgeArticles.map((a) => ({ meta: a.meta, coverImage: a.coverImage }))));
// Always-on, independent of VISUAL_GATE_ENABLED: a present-but-unapproved
// asset must never pass, on any branch, published or not.
errors.push(...checkAssetApprovalGate(knowledgeArticles.map((a) => ({ meta: a.meta, coverImage: a.coverImage }))));

// Orphaned assets: anything under public/article-visuals/ (recursively —
// a per-article subdirectory is a permitted layout even though the
// current pilot uses flat filenames) that no article's coverImage
// references.
function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}
for (const fullPath of walk(ASSETS_DIR)) {
  if (!referencedAssets.has(fullPath)) {
    warnings.push(`${path.relative(PUBLIC_DIR, fullPath)} is not referenced by any article's coverImage — orphaned asset`);
  }
}

if (warnings.length > 0) {
  console.warn(`[article-visuals] ${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  - ${w}`);
}

if (errors.length > 0) {
  console.error(`[article-visuals] BLOCKED: ${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const withCover = knowledgeArticles.filter((a) => a.coverImage).length;
const briefOnly = knowledgeArticles.filter((a) => a.coverImage?.stage === "brief").length;
console.log(
  `[article-visuals] OK: ${knowledgeArticles.length} articles checked, ${withCover} have coverImage data (${briefOnly} at brief stage, ${withCover - briefOnly} with a real asset).`,
);
