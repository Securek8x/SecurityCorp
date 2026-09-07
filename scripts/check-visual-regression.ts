// Standing visual + DOM regression suite for the shared article shell and
// homepage (Bead securitycorp-source-2hh). This project has already hit two
// real incidents this would have caught earlier: the mobile-width-on-desktop
// CSS source-order regression on knowledge-article pages (PR #9), and the
// hero-tiger/H1 overlap regression at 375px/601px (PR #57, securitycorp-
// source-hcx) that a one-off screenshot check did not guard against going
// forward. This script is that standing coverage.
//
// Usage:
//   npm run build:pages                       # produce a fresh out/ first
//   npm run check:visual-regression            # compare against committed baselines
//   npm run check:visual-regression -- --update  # (re)capture baselines
//
// Reviewing an intentional visual change: run with --update, then open a
// diff of the changed PNG(s) under test/visual-regression/baselines/ in the
// same PR as the change that caused them, so a human reviewer sees the
// before/after alongside the code change — never update baselines silently
// in an unrelated commit.
//
// Known limitations:
// - The Three.js hero canvas (.hero-webgl-host) is hidden before every
//   screenshot. Headless Chromium's WebGL output is not guaranteed pixel-
//   deterministic frame-to-frame, so this suite intentionally does not
//   attempt to catch WebGL rendering regressions — only DOM/CSS layout.
// - Baselines are captured with a specific Chromium build (via the
//   `puppeteer` devDependency) and prefers-reduced-motion:reduce forced on
//   every capture for determinism. A different Chromium version or host font
//   substitution can produce small, uniform diffs across every page that are
//   not a real layout regression — if that happens, verify visually first,
//   then --update.
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "out");
const BASELINE_DIR = path.join(ROOT, "test/visual-regression/baselines");
const DIFF_DIR = path.join(ROOT, "test/visual-regression/diffs");

const UPDATE = process.argv.includes("--update");

// Pixel-diff tolerance. Static, text-heavy pages with WebGL/motion excluded
// should render near-identically run to run; this stays loose enough to
// absorb minor font-hinting differences across Chromium builds without
// masking a real layout shift (the hero-overlap regression this suite
// guards against moved 15-30% of the hero region, orders of magnitude
// above this threshold).
const PIXELMATCH_OPTIONS = { threshold: 0.15 };
const MAX_DIFF_RATIO = 0.003; // 0.3% of pixels

type PageSpec = {
  slug: string;
  path: string;
  label: string;
  isHomepage?: boolean;
  expectArticleShell?: boolean;
  expectRelatedContent?: boolean;
  /** Also capture one full-page (not just viewport-height) screenshot, at
   * desktop/dark only, so long tables/diagrams/pager/related-content further
   * down the page get regression coverage without every combination paying
   * for a full-page capture (a full article can be 5-10x a viewport's
   * height, and PNG-per-combination adds up fast in repo size). */
  alsoCaptureFullPage?: boolean;
};

const PAGES: PageSpec[] = [
  { slug: "homepage", path: "/", label: "Homepage (hero tiger, Three.js host)", isHomepage: true },
  {
    slug: "guide-malware-gate",
    path: "/guides/malware-gate-for-automated-downloads/",
    label: "Guide template",
    expectArticleShell: true,
  },
  {
    slug: "knowledge-diagram",
    path: "/knowledge/build-runners-untrusted/",
    label: "Knowledge article with an interactive diagram",
    expectArticleShell: true,
    alsoCaptureFullPage: true,
  },
  {
    slug: "knowledge-table",
    path: "/knowledge/common-causes-of-unexpected-network-exposure/",
    label: "Knowledge article with a data table and related-content",
    expectArticleShell: true,
    expectRelatedContent: true,
    alsoCaptureFullPage: true,
  },
];

type ViewportSpec = { name: string; width: number; height: number };
const VIEWPORTS: ViewportSpec[] = [
  { name: "phone-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

const THEMES = ["dark", "light"] as const;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

// The request URL is untrusted input, so rather than derive a filesystem
// path from it at request time (however carefully guarded), enumerate every
// real file under OUT_DIR exactly once at startup into a trusted lookup
// table keyed by its site-relative URL. A request is then answered purely
// by map lookup — the tainted string never participates in constructing the
// path that actually reaches the filesystem, which closes off path
// traversal (e.g. "/../../etc/passwd") by construction rather than by guard.
async function buildFileIndex(): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        const relative = `/${path.relative(OUT_DIR, full).split(path.sep).join("/")}`;
        index.set(relative, full);
      }
    }
  }
  await walk(OUT_DIR);
  return index;
}

function resolveStaticFile(index: Map<string, string>, urlPath: string): string | null {
  const clean = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  const candidates = clean.endsWith("/")
    ? [`${clean}index.html`]
    : [clean, `${clean}.html`, `${clean}/index.html`];
  for (const candidate of candidates) {
    const hit = index.get(candidate);
    if (hit) return hit;
  }
  return null;
}

async function startServer(): Promise<{ url: string; close: () => Promise<void> }> {
  const index = await buildFileIndex();
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const filePath = resolveStaticFile(index, req.url ?? "/");
      if (!filePath) {
        res.writeHead(404, { "content-type": "text/plain" });
        res.end("Not found");
        return;
      }
      readFile(filePath)
        .then((body) => {
          const ext = path.extname(filePath);
          res.writeHead(200, { "content-type": MIME[ext] ?? "application/octet-stream" });
          res.end(body);
        })
        .catch((err: unknown) => {
          res.writeHead(500, { "content-type": "text/plain" });
          res.end(String(err));
        });
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo | null;
      if (!address) {
        reject(new Error("failed to bind local static server"));
        return;
      }
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((res) => server.close(() => res())),
      });
    });
  });
}

type DomFinding = { ok: boolean; message: string };

async function runDomAssertions(page: Page, spec: PageSpec): Promise<DomFinding[]> {
  return page.evaluate(
    (opts: { isHomepage: boolean; expectArticleShell: boolean; expectRelatedContent: boolean }) => {
      const findings: { ok: boolean; message: string }[] = [];

      const h1s = document.querySelectorAll("h1");
      findings.push({ ok: h1s.length === 1, message: `exactly one <h1> (found ${h1s.length})` });

      const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
      let maxSeen = 0;
      let orderOk = true;
      for (const h of headings) {
        const level = Number(h.tagName[1]);
        if (level > maxSeen + 1) orderOk = false;
        maxSeen = Math.max(maxSeen, level);
      }
      findings.push({ ok: orderOk, message: "heading levels never skip a level" });

      const focusable = document.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      findings.push({ ok: focusable.length > 0, message: `has focusable controls (${focusable.length} found)` });

      const legacy = document.querySelector(".knowledge-article-only");
      findings.push({ ok: !legacy, message: "no reintroduced .knowledge-article-only legacy class" });

      if (opts.expectArticleShell) {
        const shell = document.querySelector("main.article-page");
        findings.push({ ok: !!shell, message: "renders the shared .article-page shell" });

        const toc = document.querySelector("nav.toc");
        findings.push({ ok: !!toc, message: "renders the article table of contents" });

        // Each numbered content block renders as <section id="..."><h2>
        // (components/knowledge-article-shell.tsx) — the id anchors TOC/
        // HeadingLink navigation and lives on the section, not the heading.
        const contentSections = shell
          ? shell.querySelectorAll("article section")
          : ([] as unknown as NodeListOf<Element>);
        const missingIds = Array.from(contentSections).filter((s) => !s.id);
        findings.push({
          ok: missingIds.length === 0,
          message: `all content sections have an anchor id (${missingIds.length} missing of ${contentSections.length})`,
        });

        const pager = document.querySelector("nav.article-pager a.pager-next");
        if (pager) {
          const hasHref = pager.hasAttribute("href") && pager.getAttribute("href") !== "";
          const hasText = (pager.textContent ?? "").trim().length > 0;
          findings.push({ ok: hasHref && hasText, message: "article pager 'next' link has an href and label" });
        }

        const related = document.querySelector("section.related-guides");
        if (opts.expectRelatedContent) {
          findings.push({ ok: !!related, message: "renders the related-content section" });
        }
        if (related) {
          const cards = related.querySelectorAll("a.related-card");
          const brokenCards = Array.from(cards).filter(
            (c) => !c.getAttribute("href") || !(c.querySelector("h3")?.textContent ?? "").trim(),
          );
          findings.push({
            ok: cards.length > 0 && brokenCards.length === 0,
            message: `related-content cards all have a link and title (${brokenCards.length} broken of ${cards.length})`,
          });
        }
      }

      return findings;
    },
    {
      isHomepage: !!spec.isHomepage,
      expectArticleShell: !!spec.expectArticleShell,
      expectRelatedContent: !!spec.expectRelatedContent,
    },
  );
}

async function runMotionAssertions(page: Page): Promise<DomFinding[]> {
  // With reduced motion, any node-pulse-classed element must have its
  // animation disabled per the app/globals.css contract (line ~85-87).
  return page.evaluate(() => {
    const findings: { ok: boolean; message: string }[] = [];
    const pulsing = document.querySelectorAll('[class*="node-pulse"]');
    if (pulsing.length > 0) {
      const stillAnimating = Array.from(pulsing).some((el) => {
        const style = window.getComputedStyle(el);
        return style.animationName !== "none" && style.animationName !== "";
      });
      findings.push({
        ok: !stillAnimating,
        message: `prefers-reduced-motion disables node-pulse animation (${pulsing.length} element(s) checked)`,
      });
    }
    return findings;
  });
}

async function preparePage(browser: Browser, theme: string, viewport: ViewportSpec): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.width, height: viewport.height });
  await page.evaluateOnNewDocument((t: string) => {
    try {
      localStorage.setItem("securitycorp-theme", t);
    } catch {
      /* ignore — falls back to the default theme */
    }
  }, theme);
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  return page;
}

async function loadAndSettle(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.addStyleTag({ content: ".hero-webgl-host{visibility:hidden !important}" });
  await page.evaluate(() => (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready);
}

function readPng(filePath: string): Promise<InstanceType<typeof PNG>> {
  return new Promise((resolve, reject) => {
    const png = new PNG();
    const chunks: Buffer[] = [];
    readFile(filePath)
      .then((buf) => {
        png.parse(buf, (err) => {
          if (err) reject(err);
          else resolve(png);
        });
      })
      .catch(reject);
    void chunks;
  });
}

type CompareResult = { status: "created" | "pass" | "fail" | "size-changed"; message: string };

async function compareOrUpdate(name: string, screenshot: Buffer): Promise<CompareResult> {
  const baselinePath = path.join(BASELINE_DIR, `${name}.png`);

  if (UPDATE || !existsSync(baselinePath)) {
    await mkdir(BASELINE_DIR, { recursive: true });
    await writeFile(baselinePath, screenshot);
    return { status: "created", message: UPDATE ? "baseline updated" : "baseline created (first run)" };
  }

  const [baseline, candidate] = await Promise.all([readPng(baselinePath), (async () => {
    const png = new PNG();
    return new Promise<InstanceType<typeof PNG>>((resolve, reject) => {
      png.parse(screenshot, (err) => (err ? reject(err) : resolve(png)));
    });
  })()]);

  if (baseline.width !== candidate.width || baseline.height !== candidate.height) {
    await mkdir(DIFF_DIR, { recursive: true });
    await writeFile(path.join(DIFF_DIR, `${name}.candidate.png`), screenshot);
    return {
      status: "size-changed",
      message: `baseline is ${baseline.width}x${baseline.height}, capture is ${candidate.width}x${candidate.height} — content length/layout changed; if intentional, rerun with --update`,
    };
  }

  const diff = new PNG({ width: baseline.width, height: baseline.height });
  const diffPixels = pixelmatch(
    baseline.data,
    candidate.data,
    diff.data,
    baseline.width,
    baseline.height,
    PIXELMATCH_OPTIONS,
  );
  const totalPixels = baseline.width * baseline.height;
  const ratio = diffPixels / totalPixels;

  if (ratio > MAX_DIFF_RATIO) {
    await mkdir(DIFF_DIR, { recursive: true });
    await writeFile(path.join(DIFF_DIR, `${name}.diff.png`), PNG.sync.write(diff));
    await writeFile(path.join(DIFF_DIR, `${name}.candidate.png`), screenshot);
    return {
      status: "fail",
      message: `${diffPixels} px differ (${(ratio * 100).toFixed(3)}% > ${(MAX_DIFF_RATIO * 100).toFixed(2)}% threshold) — see test/visual-regression/diffs/${name}.diff.png`,
    };
  }

  return { status: "pass", message: `${diffPixels} px differ (${(ratio * 100).toFixed(3)}%, within threshold)` };
}

async function main(): Promise<void> {
  if (!existsSync(path.join(OUT_DIR, "index.html"))) {
    console.error("[visual-regression] out/ has no build — run `npm run build:pages` first.");
    process.exitCode = 1;
    return;
  }

  const server = await startServer();
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });

  let failures = 0;
  let created = 0;
  let checked = 0;
  const domFailures: string[] = [];

  try {
    for (const spec of PAGES) {
      // DOM + motion assertions: one navigation per page, at a fixed
      // viewport/theme — the DOM structure being checked doesn't vary by
      // viewport or theme, only its CSS presentation does (checked below).
      const domPage = await preparePage(browser, "dark", VIEWPORTS[VIEWPORTS.length - 1]);
      await loadAndSettle(domPage, `${server.url}${spec.path}`);
      const domFindings = await runDomAssertions(domPage, spec);
      const motionFindings = await runMotionAssertions(domPage);
      await domPage.close();

      for (const finding of [...domFindings, ...motionFindings]) {
        const line = `[${spec.slug}] ${finding.ok ? "OK" : "FAIL"} — ${finding.message}`;
        if (finding.ok) {
          console.log(line);
        } else {
          console.error(line);
          domFailures.push(line);
        }
      }

      for (const viewport of VIEWPORTS) {
        for (const theme of THEMES) {
          const page = await preparePage(browser, theme, viewport);
          await loadAndSettle(page, `${server.url}${spec.path}`);
          // Viewport-height clip, not full-page: this is what a reader
          // actually sees without scrolling on each device class, and it
          // keeps committed baseline size bounded regardless of article
          // length. The hero-overlap regression this suite guards against
          // is exactly this kind of above-the-fold layout defect.
          const screenshot = (await page.screenshot({ fullPage: false })) as Buffer;

          let fullPageScreenshot: Buffer | null = null;
          if (spec.alsoCaptureFullPage && viewport.name === "desktop-1440" && theme === "dark") {
            fullPageScreenshot = (await page.screenshot({ fullPage: true })) as Buffer;
          }
          await page.close();

          const name = `${spec.slug}__${viewport.name}__${theme}`;
          const result = await compareOrUpdate(name, screenshot);
          checked++;
          const line = `[${name}] ${result.status.toUpperCase()} — ${result.message}`;
          if (result.status === "fail" || result.status === "size-changed") {
            console.error(line);
            failures++;
          } else {
            console.log(line);
            if (result.status === "created") created++;
          }

          if (fullPageScreenshot) {
            const fullName = `${spec.slug}__full-page`;
            const fullResult = await compareOrUpdate(fullName, fullPageScreenshot);
            checked++;
            const fullLine = `[${fullName}] ${fullResult.status.toUpperCase()} — ${fullResult.message}`;
            if (fullResult.status === "fail" || fullResult.status === "size-changed") {
              console.error(fullLine);
              failures++;
            } else {
              console.log(fullLine);
              if (fullResult.status === "created") created++;
            }
          }
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log(
    `\n[visual-regression] ${checked} screenshot(s) checked, ${created} baseline(s) created, ${failures} failure(s), ${domFailures.length} DOM/motion assertion failure(s).`,
  );

  if (failures > 0 || domFailures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[visual-regression] fatal error:", err);
  process.exitCode = 1;
});
