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
import { articles, projects, type Project } from "./content.ts";
import { isVerifiedEvidence } from "./evidence.ts";

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

// Evidence status is published content, so the receipt must change when it
// does: record identity, maturity, observation kind and outcome, plus the
// operational claim with its date and source. Prose is excluded, as for
// articles; evidence that failed verification is hashed as "unavailable".
export function projectEvidenceManifest(list: readonly Pick<Project, "index" | "evidence" | "operationalState">[]) {
  return list
    .map((p) => ({
      index: p.index,
      evidence: isVerifiedEvidence(p.evidence)
        ? p.evidence.records.map((r) => ({
            id: r.id,
            maturity: r.maturity,
            observation: r.observation.kind,
            outcome: r.observation.kind === "recorded" ? r.observation.outcome : null,
          }))
        : "unavailable",
      operationalState: p.operationalState ?? null,
    }))
    .sort((a, b) => a.index.localeCompare(b.index));
}

function contentManifestHash(): string {
  // Only public identifiers and dates — never raw article bodies (unbounded
  // size) or anything not already public once published.
  const manifest = {
    knowledge: publishedKnowledgeArticles
      .map((a) => ({ slug: a.meta.slug, publishedAt: a.meta.publishedAt, lastReviewedAt: a.meta.lastReviewedAt }))
      .sort((a, b) => a.slug.localeCompare(b.slug)),
    guides: articles.map((a) => ({ slug: a.slug, publishedAt: a.publishedAt })).sort((a, b) => a.slug.localeCompare(b.slug)),
    projects: projectEvidenceManifest(projects),
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
