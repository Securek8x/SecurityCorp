// Prints the published-article visual inventory (bead securitycorp-source-d4e).
// Read-only report — it never fails the build. The baseline assertion lives in
// lib/article-visual-inventory.test.ts; enforcement lives in
// scripts/check-article-visuals.ts. Pass --json for machine-readable output.
import { publishedVisualInventory, summarizeVisualInventory } from "../lib/article-visual-inventory.ts";

const rows = publishedVisualInventory();
const summary = summarizeVisualInventory(rows);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ summary, rows }, null, 2));
} else {
  console.log("slug\tpillar\tcover\tcanonicalCover\tcoverApproval\tinBodyPlate\tteachingFigure");
  for (const r of rows) {
    console.log([r.slug, r.pillar, r.cover, r.canonicalCover ? "yes" : "no", r.coverApproval, r.inBodyPlate ? "yes" : "no", r.teachingFigure].join("\t"));
  }
  console.log("\nsummary:", JSON.stringify(summary));
}
