// Publication-safety gate: scans the built static export, feeds, JSON-LD,
// generated assets, and public source content for likely-private leaks
// before publication. Complements human sanitization review — does not
// replace it. See docs/publication-safety-policy.md and
// lib/privacy-leak-gate.ts (the detection logic tested in
// lib/privacy-leak-gate.test.ts).
//
// An optional, git-ignored local denylist at .privacy-denylist.json
// (`{"terms": ["..."]}`) supplies site-specific real values (usernames,
// private repo identifiers) to check for without ever committing them to
// this public repo.
import { existsSync, readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  findImageMetadata,
  scanTextAgainstDenylist,
  scanTextForLeaks,
  type LeakFinding,
  type LocalDenylist,
} from "../lib/privacy-leak-gate.ts";

// Built-output extensions are deliberately narrow: actual rendered pages,
// the sitemap/feed, and embedded JSON-LD/metadata — never .js/.css bundle
// output. Next's own compiled/minified framework and library code (under
// out/_next/) routinely contains coincidental substring matches (a
// "password=" property assignment, a stray "192.168" in a vendored library)
// that are not real leaks; it is also never something this project authored.
const BUILT_TEXT_EXTENSIONS = new Set([".html", ".htm", ".xml", ".json", ".txt"]);
// Source extensions are broader — this is our own hand-authored content,
// where a real leak (a hardcoded internal path, a pasted credential) is a
// genuine finding worth flagging regardless of file type.
const SOURCE_TEXT_EXTENSIONS = new Set([".html", ".htm", ".xml", ".json", ".txt", ".css", ".js", ".mjs", ".ts", ".tsx", ".md"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const SKIP_DIR_NAMES = new Set(["node_modules", ".git", ".next", ".beads", ".claude-flow", ".impeccable"]);
// Next's own compiled bundle output — framework/library code, never
// hand-authored content. Excluded from the built-output walk entirely.
const SKIP_BUILT_SUBDIR = join("out", "_next");

async function walk(root: string, skipPaths: Set<string> = new Set()): Promise<string[]> {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const full = join(root, entry.name);
    if (skipPaths.has(full)) continue;
    if (entry.isDirectory()) {
      out.push(...(await walk(full, skipPaths)));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function loadDenylist(): LocalDenylist {
  const path = ".privacy-denylist.json";
  if (!existsSync(path)) return { terms: [] };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return { terms: Array.isArray(parsed.terms) ? parsed.terms : [] };
  } catch (error) {
    console.error(`[privacy-leak-gate] BLOCKED: .privacy-denylist.json exists but could not be parsed: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function scanFiles(files: string[], denylist: LocalDenylist, textExtensions: Set<string>): Promise<LeakFinding[]> {
  const findings: LeakFinding[] = [];
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      const bytes = new Uint8Array(await readFile(file));
      findings.push(...findImageMetadata(bytes, file));
      continue;
    }
    if (!textExtensions.has(ext)) continue;
    const text = await readFile(file, "utf8");
    findings.push(...scanTextForLeaks(text, file));
    if (denylist.terms.length > 0) {
      findings.push(...scanTextAgainstDenylist(text, denylist, file));
    }
  }
  return findings;
}

async function main() {
  const denylist = loadDenylist();

  // Built static export: rendered HTML, sitemap.xml, RSS feed, embedded
  // JSON-LD, and generated OG images. Excludes out/_next/ (Next's own
  // compiled framework/library bundle output — see the comment above
  // SKIP_BUILT_SUBDIR).
  const builtFiles = await walk("out", new Set([SKIP_BUILT_SUBDIR]));
  if (builtFiles.length === 0) {
    console.warn("[privacy-leak-gate] WARNING: out/ not found or empty — run `npm run build:pages` first for full coverage. Continuing with source-only scan.");
  }

  // Source content that feeds publication: knowledge-base content, docs,
  // and the public site source itself. Test fixtures are intentionally
  // excluded — they contain deliberate positive/negative examples of the
  // exact patterns this gate looks for, not real leaks.
  const git = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" });
  if (git.status !== 0 || !git.stdout) throw new Error(git.stderr?.trim() || "git ls-files failed");
  const sourceRoots = ["app/", "components/", "content/", "docs/", "lib/", "public/"];
  const sourceFiles = git.stdout
    .split("\n")
    .filter(Boolean)
    .filter((file) => sourceRoots.some((root) => file.startsWith(root)))
    .filter((file) => !file.endsWith(".test.ts"));

  const findings = [
    ...(await scanFiles(builtFiles, denylist, BUILT_TEXT_EXTENSIONS)),
    ...(await scanFiles(sourceFiles, denylist, SOURCE_TEXT_EXTENSIONS)),
  ];

  if (findings.length > 0) {
    console.error(
      `[privacy-leak-gate] BLOCKED: ${findings.length} potential privacy leak(s) found:\n${findings
        .map((f) => `- [${f.rule}] ${f.context}: ${f.match}`)
        .join("\n")}`,
    );
    process.exit(1);
  }

  console.log(
    `[privacy-leak-gate] OK: ${builtFiles.length} built file(s) and ${sourceFiles.length} source file(s) scanned, no leaks found.`,
  );
}

main().catch((error) => {
  console.error(`[privacy-leak-gate] ERROR: ${(error as Error).message}`);
  process.exit(1);
});
