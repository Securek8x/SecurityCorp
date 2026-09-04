/* eslint-disable @next/next/no-img-element -- next.config.ts sets
   images.unoptimized:true (static export, no server-side image pipeline),
   so next/image buys nothing here beyond what a plain <img> with explicit
   width/height already gives for CLS — matches the existing plain-<img>
   convention (hero-tiger-image.tsx, hero-visual.tsx). Applies to every
   <img> in this file. */
import { FigureEnlargeTrigger } from "./figure-enlarge-trigger";

/** Reusable article visual (Bead s41.9-12 pilot). Semantic <figure>/
 * <figcaption>, explicit width/height (prevents layout shift — no
 * aspect-ratio guessing), optional accessible enlargement via
 * FigureEnlargeTrigger (a small client component — see that file for why
 * enlargement is split out rather than making every figure a client
 * component).
 *
 * Server-rendered by default: only figures with `enlargeable` pull in any
 * client-side JS. This is deliberately NOT print-styled yet —
 * app/globals.css has no `@media print` block on this branch
 * (securitycorp-source-1ng, the print stylesheet, is a separate,
 * unmerged PR) — so `.figure-enlarge`/`.figure-dialog` currently render
 * as normal screen chrome in print too. Revisit once 1ng merges. */
export type ArticleFigureProps = {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  width: number;
  height: number;
  /** "inline" and "wide" are the same rendered width today — both sit
   * inside the shared `.article-page article{max-width:900px}` column, so
   * "wide" cannot actually break out past it (a wide breakout would be a
   * layout change to the article shell, which is out of scope here
   * without explicit authorization). The distinction is reserved for a
   * possible future context where a figure isn't nested inside that
   * 900px column; within the current article shell, treat both as
   * "fills the shared article column." */
  presentation?: "inline" | "wide";
  /** Only for genuinely detail-rich images (e.g. a dense diagram export)
   * where a reader plausibly needs to inspect it larger. Off by default —
   * most figures don't need this. */
  enlargeable?: boolean;
  /** Set for a cover/hero near the top of the article — eager-loads with
   * a high fetch priority instead of the lazy-loading default, since a
   * cover is very likely already in (or near) the viewport on load.
   * In-body figures should leave this false/unset and stay lazy. */
  priority?: boolean;
};

export function ArticleFigure({ src, alt, caption, credit, width, height, presentation = "inline", enlargeable = false, priority = false }: ArticleFigureProps) {
  if (!alt?.trim()) {
    // Fail loud in development rather than ship a figure with no
    // accessible description — validateArticleVisual (lib/article-
    // visuals.ts) is the pre-publish gate; this is the runtime backstop.
    throw new Error("ArticleFigure requires non-empty alt text");
  }

  return (
    <figure className={`article-figure article-figure-${presentation}`}>
      {enlargeable ? (
        <FigureEnlargeTrigger src={src} alt={alt} width={width} height={height} priority={priority} />
      ) : priority ? (
        <img src={src} alt={alt} width={width} height={height} loading="eager" fetchPriority="high" decoding="async" />
      ) : (
        <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      )}
      {(caption || credit) && (
        <figcaption>
          {caption}
          {credit && <span className="figure-credit"> — {credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}
