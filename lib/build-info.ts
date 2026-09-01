// Public build-provenance data — the exact source commit and content state
// a live deployment was built from, so a human (or the verification step in
// docs/cloudflare-pages.md) can confirm production actually reflects a
// specific merge rather than relying on indirect signals like asset
// fingerprints. Computed once at build time (this module is imported only
// by force-static route handlers — see app/build-info.json/route.ts).
//
// Deliberately public-safe: a commit SHA, a build timestamp, and a hash of
// published-content identifiers are not sensitive. Never add a build host,
// environment variable, internal path, or infrastructure detail here.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { publishedKnowledgeArticles } from "./knowledge-content.ts";
import { articles, projects } from "./content.ts";

function resolveCommitSha(): string {
  // Cloudflare Pages injects this at build time (documented system
  // environment variable: https://developers.cloudflare.com/pages/configuration/build-configuration/).
  const fromCloudflare = process.env.CF_PAGES_COMMIT_SHA;
  if (fromCloudflare) return fromCloudflare;
  // Local/dev build fallback — reads the actual checked-out commit rather
  // than trusting an unset env var.
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function contentManifestHash(): string {
  // Only public identifiers and dates — never raw article bodies (unbounded
  // size) or anything not already public once published.
  const manifest = {
    knowledge: publishedKnowledgeArticles
      .map((a) => ({ slug: a.meta.slug, publishedAt: a.meta.publishedAt, lastReviewedAt: a.meta.lastReviewedAt }))
      .sort((a, b) => a.slug.localeCompare(b.slug)),
    guides: articles.map((a) => ({ slug: a.slug, date: a.date })).sort((a, b) => a.slug.localeCompare(b.slug)),
    projects: projects.map((p) => ({ index: p.index, status: p.status })).sort((a, b) => a.index.localeCompare(b.index)),
  };
  return createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
}

export type BuildInfo = {
  commitSha: string;
  buildTimestamp: string;
  contentManifestHash: string;
};

export function getBuildInfo(): BuildInfo {
  return {
    commitSha: resolveCommitSha(),
    buildTimestamp: new Date().toISOString(),
    contentManifestHash: contentManifestHash(),
  };
}
