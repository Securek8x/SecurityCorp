// Scan repository candidates that can become a public-facing source surface.
// .beads is Git-excluded local state and is intentionally outside this check.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const prohibitedTerms = ["glue" + "tun"];
const publicSourceRoots = ["app/", "components/", "content/", "docs/", "lib/", "public/"];

const git = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" });
if (git.status !== 0 || !git.stdout) throw new Error(git.stderr?.trim() || "git ls-files failed");

const files = git.stdout
  .split("\n")
  .filter(Boolean)
  .filter((file) => file === "README.md" || publicSourceRoots.some((root) => file.startsWith(root)));

const findings = files.flatMap((file) => {
  const source = readFileSync(file, "utf8");
  return prohibitedTerms.flatMap((term) => source.toLocaleLowerCase().includes(term) ? [`${file}: ${term}`] : []);
});

if (findings.length > 0) {
  console.error(`[public-term-scan] BLOCKED:\n${findings.map((finding) => `- ${finding}`).join("\n")}`);
  process.exit(1);
}

console.log(`[public-term-scan] OK: ${files.length} tracked or publishable candidate files scanned.`);
