/* eslint-disable @next/next/no-img-element -- next.config.ts sets
   images.unoptimized:true (static export, no server-side image pipeline);
   matches the plain-<img> convention used throughout this codebase. */
"use client";

import { useRef } from "react";

export type FigureEnlargeTriggerProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** See ArticleFigureProps.priority — propagated through when an
   * enlargeable figure is also a priority (e.g. cover) image. */
  priority?: boolean;
};

/** The one genuinely interactive piece of a figure — kept as its own small
 * client component so an ordinary, non-enlargeable figure (the common
 * case) stays a plain server-rendered <img>, not a client component just
 * because SOME figures elsewhere use a dialog. Native <dialog> +
 * showModal() for focus-trapping and Escape-to-close (browsers already do
 * this correctly; no hand-rolled modal). Focus is explicitly restored to
 * the trigger button on close — the native "close" event fires
 * regardless of how the dialog closed (Escape, the close button, or
 * dialog.close()), so listening to it (rather than only the button's own
 * onClick) restores focus in every case. */
export function FigureEnlargeTrigger({ src, alt, width, height, priority = false }: FigureEnlargeTriggerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openEnlarged = () => dialogRef.current?.showModal();
  const closeEnlarged = () => dialogRef.current?.close();

  return (
    <>
      <button type="button" className="figure-enlarge" onClick={openEnlarged} aria-haspopup="dialog" aria-label={`Enlarge image: ${alt}`} ref={triggerRef}>
        <img src={src} alt={alt} width={width} height={height} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" />
        <span className="figure-enlarge-hint" aria-hidden="true">
          Enlarge
        </span>
      </button>
      <dialog
        ref={dialogRef}
        className="figure-dialog"
        aria-label={alt}
        onClose={() => triggerRef.current?.focus()}
      >
        <button type="button" className="figure-dialog-close" onClick={closeEnlarged} autoFocus>
          Close
        </button>
        <img src={src} alt={alt} width={width} height={height} />
      </dialog>
    </>
  );
}
