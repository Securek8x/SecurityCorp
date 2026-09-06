// One-off normalization for the three real pilot cover-image sources
// (Bead securitycorp-source-s41.12). Uses the exactly-pinned `sharp@0.35.4`
// devDependency (Ravi's explicit authorization, recorded on that bead) to
// turn a raw generated PNG into the final production-shaped WebP:
//
//   1. Auto-orient from EXIF (`.rotate()`) BEFORE anything else — this
//      MUST happen before metadata is stripped, or a rotation baked only
//      into EXIF would be lost.
//   2. Resize/crop to exactly 1600x900 with `fit: "cover"` (centered —
//      these sources are already ~16:9, so this is a negligible edge
//      crop, never a stretch, and never biased toward a focal point:
//      focalPoint is a card-thumbnail object-position hint, not a master-
//      crop instruction).
//   3. Encode to WebP, stepping quality down until the 200KB-per-file
//      budget is met. Sharp does NOT embed source metadata into its
//      output unless `.withMetadata()` is explicitly called — this script
//      deliberately never calls it, which is what actually strips EXIF/
//      ICC/IPTC/XMP/comments. Fails loudly (throws) rather than silently
//      shipping something over budget or visibly degraded.
//   4. Re-reads the written file from disk and re-verifies real decoded
//      width/height and metadata cleanliness — proving the actual bytes,
//      not inferring from the pipeline's exit code.
//
// Deliberately hardcoded to exactly the three known pilot sources — no
// glob, no CLI path argument, nothing attacker- or argument-controlled.
// Reuses `resolveAssetPath` for the destination side so path-containment
// logic isn't duplicated. Not wired into `npm test` or `npm run check`;
// run manually: `node scripts/normalize-cover-source.ts`.
import { readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { resolveAssetPath, checkDimensionsMatch, hasDisallowedMetadata } from "../lib/article-visual-assets.ts";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const ASSETS_DIR = path.join(PUBLIC_DIR, "article-visuals");
const SOURCE_DIR = path.join(process.cwd(), "images");

const TARGET_WIDTH = 1600;
const TARGET_HEIGHT = 900;
const BUDGET_BYTES = 200 * 1024;
const MIN_ACCEPTABLE_QUALITY = 40;
const START_QUALITY = 82;
const QUALITY_STEP = 2;

type Job = { sourceFile: string; slug: string };

const JOBS: Job[] = [
  { sourceFile: "understanding-network-trust-boundaries-cover-source.png", slug: "understanding-network-trust-boundaries" },
  { sourceFile: "protecting-main-branch-beyond-pr-approval-cover-source.png", slug: "protecting-main-branch-beyond-pr-approval" },
  { sourceFile: "secrets-detection-scanner-limits-cover-source.png", slug: "secrets-detection-scanner-limits" },
];

async function normalizeOne(job: Job) {
  const sourcePath = path.join(SOURCE_DIR, job.sourceFile);
  const destSrc = `/article-visuals/${job.slug}-cover.webp`;
  const resolved = resolveAssetPath(destSrc, PUBLIC_DIR, ASSETS_DIR);
  if (!resolved.ok) throw new Error(`${job.slug}: refusing unsafe destination path — ${resolved.reason}`);

  const inputBuffer = readFileSync(sourcePath);
  const inputMeta = await sharp(inputBuffer).metadata();
  console.log(`[normalize] ${job.slug}: input ${inputMeta.width}x${inputMeta.height} ${inputMeta.format}, ${inputBuffer.length} bytes`);

  let quality = START_QUALITY;
  let outputBuffer: Buffer | undefined;
  while (quality >= MIN_ACCEPTABLE_QUALITY) {
    // Fresh pipeline each iteration — sharp instances are single-use per output.
    const candidate = await sharp(inputBuffer).rotate().resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: "cover", position: "centre" }).webp({ quality }).toBuffer();
    if (candidate.length <= BUDGET_BYTES) {
      outputBuffer = candidate;
      break;
    }
    quality -= QUALITY_STEP;
  }

  if (!outputBuffer) {
    throw new Error(
      `${job.slug}: could not reach the ${BUDGET_BYTES / 1024}KB budget even at minimum acceptable quality (${MIN_ACCEPTABLE_QUALITY}) — stopping rather than shipping visible degradation. Report the smallest size actually reached instead of weakening the budget.`,
    );
  }

  writeFileSync(resolved.filePath, outputBuffer);

  // Re-verify from the actual written file, not the in-memory buffer or exit code.
  const writtenBuffer = readFileSync(resolved.filePath);
  const outputMeta = await sharp(writtenBuffer).metadata();
  const dimCheck = checkDimensionsMatch({ width: outputMeta.width ?? -1, height: outputMeta.height ?? -1 }, { width: TARGET_WIDTH, height: TARGET_HEIGHT });
  if (!dimCheck.ok) throw new Error(`${job.slug}: post-write dimension check failed — ${dimCheck.reason}`);

  const metadataFindings = hasDisallowedMetadata({
    exif: outputMeta.exif,
    icc: outputMeta.icc,
    iptc: outputMeta.iptc,
    xmp: outputMeta.xmp,
    orientation: outputMeta.orientation,
    comments: (outputMeta as { comments?: unknown[] }).comments,
  });
  if (metadataFindings.length > 0) {
    throw new Error(`${job.slug}: disallowed metadata survived normalization: ${metadataFindings.join(", ")}`);
  }

  const sizeBytes = statSync(resolved.filePath).size;
  console.log(
    `[normalize] ${job.slug}: output ${outputMeta.width}x${outputMeta.height} ${outputMeta.format}, ${sizeBytes} bytes (quality=${quality}), metadata clean, written to public${destSrc}`,
  );
}

for (const job of JOBS) {
  await normalizeOne(job);
}
console.log("[normalize] all three pilot covers normalized successfully.");
