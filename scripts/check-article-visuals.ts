// Article visual audit (Bead securitycorp-source-s41.9-12 pilot). Checks
// the type-safe provenance/brief data (via validateArticleVisual) AND the
// filesystem-level concerns that data alone can't catch: missing files,
// oversized rasters, missing dimensions, unsafe SVG, orphaned assets,
// unsupported formats. Publication-gate enforcement (requiring every
// published article to have a cover) is OFF by default during the
// migration period — see VISUAL_GATE_ENABLED in lib/article-visuals.ts.
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import path from "node:path";
import { knowledgeArticles } from "../lib/knowledge-content.ts";
import { validateArticleVisual, checkCoverImageGate, type ArticleVisual } from "../lib/article-visuals.ts";

const errors: string[] = [];
const warnings: string[] = [];

const PUBLIC_DIR = path.join(process.cwd(), "public");
const MAX_RASTER_BYTES = 400 * 1024; // 400KB — generous for a hero, still a real budget
const RASTER_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".avif", ".webp"]);
const SUPPORTED_EXTENSIONS = new Set([...RASTER_EXTENSIONS, ".svg"]);
const UNSAFE_SVG_PATTERNS = [/<script/i, /\son\w+\s*=/i, /xlink:href\s*=\s*["']https?:/i, /<!ENTITY/i];

const referencedAssets = new Set<string>();

function checkAssetFile(visual: ArticleVisual, articleSlug: string) {
  if (visual.stage === "brief" || !visual.src) return;
  const ext = path.extname(visual.src).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    errors.push(`${articleSlug} ${visual.visualType}: unsupported format "${ext}" (src: ${visual.src})`);
    return;
  }

  const filePath = path.join(PUBLIC_DIR, visual.src.replace(/^\//, ""));
  referencedAssets.add(filePath);

  if (!existsSync(filePath)) {
    errors.push(`${articleSlug} ${visual.visualType}: referenced file not found at public${visual.src}`);
    return;
  }

  if (RASTER_EXTENSIONS.has(ext)) {
    const size = statSync(filePath).size;
    if (size > MAX_RASTER_BYTES) {
      errors.push(`${articleSlug} ${visual.visualType}: ${(size / 1024).toFixed(0)}KB exceeds the ${MAX_RASTER_BYTES / 1024}KB raster budget (${visual.src})`);
    }
  }

  if (ext === ".svg") {
    const content = readFileSync(filePath, "utf-8");
    for (const pattern of UNSAFE_SVG_PATTERNS) {
      if (pattern.test(content)) {
        errors.push(`${articleSlug} ${visual.visualType}: SVG at ${visual.src} matches an unsafe pattern (${pattern})`);
      }
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

// Orphaned assets: anything under public/article-visuals/ that no article's coverImage references.
const assetsDir = path.join(PUBLIC_DIR, "article-visuals");
if (existsSync(assetsDir)) {
  for (const file of readdirSync(assetsDir)) {
    const fullPath = path.join(assetsDir, file);
    if (!referencedAssets.has(fullPath)) {
      warnings.push(`public/article-visuals/${file} is not referenced by any article's coverImage — orphaned asset`);
    }
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
