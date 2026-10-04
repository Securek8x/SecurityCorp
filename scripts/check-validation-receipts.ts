// VALIDATED evidence gate (Bead securitycorp-source-akn.1). Loads every
// receipt in validation-receipts/*.json, recomputes the bound article and
// harness digests from the current tree, and blocks when any article claims
// evidenceState "VALIDATED" without a current, human-reviewed, passing
// receipt for every claim in its ledger — or when any receipt is malformed.
// See lib/validation-receipts.ts for the rules.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { knowledgeArticles } from "../lib/knowledge-content.ts";
import { articleContentDigest, checkValidatedEvidenceGate, sha256Hex, type ValidationReceipt } from "../lib/validation-receipts.ts";

const ROOT = process.cwd();
const RECEIPT_DIR = path.join(ROOT, "validation-receipts");

const receipts: ValidationReceipt[] = [];
const loadErrors: string[] = [];
if (existsSync(RECEIPT_DIR)) {
  for (const name of readdirSync(RECEIPT_DIR).filter((n) => n.endsWith(".json")).sort()) {
    try {
      receipts.push(JSON.parse(readFileSync(path.join(RECEIPT_DIR, name), "utf8")) as ValidationReceipt);
    } catch (error) {
      loadErrors.push(`validation-receipts/${name}: not valid JSON (${(error as Error).message})`);
    }
  }
}

const { errors, notices } = checkValidatedEvidenceGate(knowledgeArticles, receipts, {
  articleDigests: new Map(knowledgeArticles.map((a) => [a.meta.slug, articleContentDigest(a)])),
  articleClaimIds: new Map(knowledgeArticles.map((a) => [a.meta.slug, (a.claims ?? []).map((c) => c.claimId)])),
  fileSha256: (repoPath) => {
    const full = path.resolve(ROOT, repoPath);
    if (!full.startsWith(ROOT + path.sep) || !existsSync(full)) return undefined;
    return sha256Hex(readFileSync(full));
  },
});
errors.unshift(...loadErrors);

for (const n of notices) console.warn(`[validation-receipts] notice: ${n}`);
if (errors.length > 0) {
  console.error(`[validation-receipts] BLOCKED: ${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
const validated = knowledgeArticles.filter((a) => a.meta.evidenceState === "VALIDATED").length;
console.log(`[validation-receipts] OK: ${receipts.length} receipt(s), ${validated} VALIDATED article(s), all VALIDATED claims backed by current human-reviewed receipts.`);
