// Citation *source* verification — not semantic claim verification. Checks
// that every cited URL across lib/articles/*.ts is still reachable and
// whether its recorded metadata (title, content type, content fingerprint)
// has changed since it was first checked. It cannot prove a source actually
// supports the claim it's cited for; that stays a separate, human-reviewed
// process (see securitycorp-source-5q3, the claim-level evidence ledger).
//
// Review-time/advisory only — deliberately NOT wired into
// .github/workflows/ci.yml. Run on demand or before publishing a batch:
//   npm run check:citations
//
// Known false-positive classes worth checking manually before "fixing" a
// citation an UNREACHABLE result flags: (1) a bot-blocking site (Medium is
// the current example in this catalog) returning HTTP 403 to an automated
// fetch even though the page is genuinely live for a browser; (2) a TLS
// certificate chain the local trust store doesn't have (some .gov domains
// hit UNABLE_TO_GET_ISSUER_CERT_LOCALLY in a minimal CI/sandbox environment
// even though the site is reachable everywhere else). Confirm with a real
// browser or a second network path before replacing a citation over either.
//
// Results are cached in .citations-cache.json (committed — it's the
// durable "what we recorded when we last checked" baseline a "changed"
// verdict is diffed against, not disposable local state) so a transient
// network failure doesn't wipe out prior good data, and so the tool can
// report "changed since it was cited" rather than just "reachable today".
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { knowledgeArticles } from "../lib/knowledge-content.ts";

const CACHE_PATH = ".citations-cache.json";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 32_768; // enough for a <title> tag on virtually any real page
const USER_AGENT =
  "Mozilla/5.0 (compatible; SecurityCorpCitationCheck/1.0; +https://securitycorp.net) citation-source-verifier";

type CacheEntry = {
  firstCheckedAt: string;
  lastCheckedAt: string;
  status: number;
  finalUrl: string;
  contentType: string | null;
  contentHash: string;
  title: string | null;
};
type Cache = Record<string, CacheEntry>;

type Verdict = "ok" | "redirected" | "changed" | "unreachable" | "unverifiable";
type Result = { url: string; verdict: Verdict; detail: string; citedBy: string[] };

function extractUrl(reference: string): string | null {
  const match = reference.match(/https?:\/\/[^\s)]+/);
  if (!match) return null;
  return match[0].replace(/[.,;:]+$/, "");
}

function extractTitle(body: string): string | null {
  const match = body.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (!match) return null;
  return match[1].replace(/\s+/g, " ").trim().slice(0, 200) || null;
}

async function fetchWithLimit(url: string): Promise<{ status: number; finalUrl: string; redirected: boolean; contentType: string | null; body: string }> {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,application/pdf,*/*" },
  });
  const reader = response.body?.getReader();
  let received = 0;
  const chunks: Uint8Array[] = [];
  if (reader) {
    while (received < MAX_BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      received += value.length;
    }
    await reader.cancel().catch(() => {});
  }
  const body = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
  return {
    status: response.status,
    finalUrl: response.url || url,
    redirected: response.redirected,
    contentType: response.headers.get("content-type"),
    body,
  };
}

async function checkUrl(url: string, cache: Cache): Promise<Result & { newEntry?: CacheEntry }> {
  const previous = cache[url];
  const now = new Date().toISOString();

  let live: Awaited<ReturnType<typeof fetchWithLimit>>;
  try {
    live = await fetchWithLimit(url);
  } catch (error) {
    if (previous) {
      return {
        url,
        verdict: "unverifiable",
        detail: `live fetch failed (${(error as Error).message}); using cached baseline from ${previous.lastCheckedAt} (status was ${previous.status})`,
        citedBy: [],
      };
    }
    return { url, verdict: "unreachable", detail: `fetch failed and no prior cached result: ${(error as Error).message}`, citedBy: [] };
  }

  if (live.status >= 400) {
    return { url, verdict: "unreachable", detail: `HTTP ${live.status}`, citedBy: [] };
  }

  const contentHash = createHash("sha256").update(live.body).digest("hex").slice(0, 16);
  const title = extractTitle(live.body);
  const newEntry: CacheEntry = {
    firstCheckedAt: previous?.firstCheckedAt ?? now,
    lastCheckedAt: now,
    status: live.status,
    finalUrl: live.finalUrl,
    contentType: live.contentType,
    contentHash,
    title,
  };

  if (!previous) {
    return { url, verdict: "ok", detail: `first check: HTTP ${live.status}${title ? ` — "${title}"` : ""}`, citedBy: [], newEntry };
  }

  if (previous.finalUrl !== live.finalUrl) {
    return { url, verdict: "redirected", detail: `now resolves to ${live.finalUrl} (was ${previous.finalUrl})`, citedBy: [], newEntry };
  }

  // HTML pages routinely embed a per-request nonce, timestamp, or tracking
  // ID within the first MAX_BODY_BYTES, which makes a raw content hash
  // change on literally every request regardless of whether the actual
  // document changed — too noisy to be a "changed" signal. The <title> is a
  // far more stable proxy for "this is now a materially different
  // document" and is what we gate on for HTML. Non-HTML content (PDFs,
  // plain text — most of this catalog's NIST/CISA citations) has no title
  // to compare, but is also far less likely to embed per-request noise, so
  // the content hash itself is the reliable signal there.
  const isHtml = (live.contentType ?? "").includes("html");
  if (isHtml) {
    if (!previous.title || !title) {
      return { url, verdict: "unverifiable", detail: "HTML page has no extractable <title> — no reliable change-detection signal", citedBy: [], newEntry };
    }
    if (previous.title !== title) {
      return { url, verdict: "changed", detail: `title changed since ${previous.firstCheckedAt}: "${previous.title}" -> "${title}"`, citedBy: [], newEntry };
    }
    return { url, verdict: "ok", detail: `unchanged since ${previous.firstCheckedAt}`, citedBy: [], newEntry };
  }

  if (previous.contentHash !== contentHash) {
    return {
      url,
      verdict: "changed",
      detail: `content fingerprint changed since ${previous.firstCheckedAt} (content-type: ${live.contentType ?? "unknown"})`,
      citedBy: [],
      newEntry,
    };
  }

  return { url, verdict: "ok", detail: `unchanged since ${previous.firstCheckedAt}`, citedBy: [], newEntry };
}

async function loadCache(): Promise<Cache> {
  try {
    return JSON.parse(await readFile(CACHE_PATH, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

async function main() {
  const cache = await loadCache();

  const citedBy = new Map<string, Set<string>>();
  for (const article of knowledgeArticles) {
    for (const reference of article.sections.references ?? []) {
      const url = extractUrl(reference);
      if (!url) continue;
      if (!citedBy.has(url)) citedBy.set(url, new Set());
      citedBy.get(url)!.add(article.meta.slug);
    }
  }

  if (citedBy.size === 0) {
    console.log("[check-citations] No cited URLs found across lib/articles/*.ts.");
    return;
  }

  const results: Result[] = [];
  const nextCache: Cache = { ...cache };
  for (const [url, slugs] of citedBy) {
    const result = await checkUrl(url, cache);
    result.citedBy = [...slugs];
    if (result.newEntry) nextCache[url] = result.newEntry;
    results.push(result);
  }

  await writeFile(CACHE_PATH, `${JSON.stringify(nextCache, null, 2)}\n`, "utf8");

  const byVerdict = (verdict: Verdict) => results.filter((r) => r.verdict === verdict);
  const print = (verdict: Verdict, label: string) => {
    const matches = byVerdict(verdict);
    if (matches.length === 0) return;
    console.log(`\n${label} (${matches.length}):`);
    for (const r of matches) {
      console.log(`  - ${r.url}`);
      console.log(`      ${r.detail}`);
      console.log(`      cited by: ${r.citedBy.join(", ")}`);
    }
  };

  print("unreachable", "UNREACHABLE");
  print("redirected", "REDIRECTED");
  print("changed", "CHANGED SINCE CITED");
  print("unverifiable", "UNVERIFIABLE (no reliable change-detection signal, or a network failure fell back to cache)");

  console.log(
    `\n[check-citations] ${results.length} cited URL(s) checked: ${byVerdict("ok").length} ok, ${byVerdict("redirected").length} redirected, ${byVerdict("changed").length} changed, ${byVerdict("unreachable").length} unreachable, ${byVerdict("unverifiable").length} unverifiable.`,
  );
  console.log(
    "[check-citations] A passing result means the source is reachable and its recorded metadata is unchanged — it does NOT prove the source supports the article's claim. That is a separate, human-reviewed process.",
  );

  if (byVerdict("unreachable").length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`[check-citations] ERROR: ${(error as Error).message}`);
  process.exit(1);
});
