/* eslint-disable @next/next/no-img-element -- next.config.ts sets
   images.unoptimized:true (static export, no server-side image pipeline),
   so next/image buys nothing here beyond what a plain <img> with explicit
   width/height already gives for CLS — matches the existing plain-<img>
   convention (hero-tiger-image.tsx, hero-visual.tsx). Applies to every
   <img> in this file. */
"use client";

import { useRef } from "react";

/** Reusable article visual (Bead s41.9-12 pilot). Semantic <figure>/
 * <figcaption>, explicit width/height (prevents layout shift — no
 * aspect-ratio guessing), optional accessible enlargement via the native
 * <dialog> element (browsers handle focus trapping and Escape-to-close
 * for showModal() natively, so this doesn't hand-roll focus management —
 * the "only if it can be implemented correctly" bar from the brief).
 * Print behavior is handled globally in app/globals.css's @media print
 * block (securitycorp-source-1ng) — figures already fall inside
 * .article-page article>section, which that block already governs;
 * enlargement affordances are hidden in print via the .figure-enlarge
 * class below. */
export type ArticleFigureProps = {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  width: number;
  height: number;
  /** "inline" fits the 900px article column; "wide" breaks out to the
   * available viewport width up to a sane cap, for a cover/hero visual. */
  presentation?: "inline" | "wide";
  /** Only for genuinely detail-rich images (e.g. a dense diagram export)
   * where a reader plausibly needs to inspect it larger. Off by default —
   * most figures don't need this. */
  enlargeable?: boolean;
};

export function ArticleFigure({ src, alt, caption, credit, width, height, presentation = "inline", enlargeable = false }: ArticleFigureProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (!alt?.trim()) {
    // Fail loud in development rather than ship a figure with no
    // accessible description — validateArticleVisual (lib/article-
    // visuals.ts) is the pre-publish gate; this is the runtime backstop.
    throw new Error("ArticleFigure requires non-empty alt text");
  }

  const openEnlarged = () => dialogRef.current?.showModal();
  const closeEnlarged = () => dialogRef.current?.close();

  return (
    <figure className={`article-figure article-figure-${presentation}`}>
      {enlargeable ? (
        <button type="button" className="figure-enlarge" onClick={openEnlarged} aria-haspopup="dialog">
          <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
          <span className="figure-enlarge-hint" aria-hidden="true">
            Enlarge
          </span>
        </button>
      ) : (
        <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      )}
      {(caption || credit) && (
        <figcaption>
          {caption}
          {credit && <span className="figure-credit"> — {credit}</span>}
        </figcaption>
      )}
      {enlargeable && (
        <dialog ref={dialogRef} className="figure-dialog" aria-label={alt}>
          <button type="button" className="figure-dialog-close" onClick={closeEnlarged} autoFocus>
            Close
          </button>
          <img src={src} alt={alt} />
        </dialog>
      )}
    </figure>
  );
}
