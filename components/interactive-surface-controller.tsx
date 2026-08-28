"use client";
import { useEffect } from "react";
import { useReducedMotion, useCoarsePointer } from "@/components/motion-controller";

/**
 * One document-level, event-delegated pointermove listener for every
 * `[data-tilt]` surface (guide cards, project cards) — not a listener per
 * card. Writes CSS custom properties directly via ref/DOM (rAF-throttled),
 * never React state, so a pointer move never triggers a re-render. See
 * `[data-tilt]` rules in app/globals.css for the actual transform/glow.
 *
 * Keyboard users get an equivalent state via `:focus-within` in CSS
 * (a static highlight, since there's no pointer position to derive a tilt
 * from) — handled entirely in CSS, no JS branch needed here for that case.
 */
export function InteractiveSurfaceController() {
  const reducedMotion = useReducedMotion();
  const coarsePointer = useCoarsePointer();

  useEffect(() => {
    if (reducedMotion || coarsePointer) return;

    let rafId = 0;
    let pendingEvent: PointerEvent | null = null;
    let activeEl: HTMLElement | null = null;

    function applyTilt() {
      rafId = 0;
      const e = pendingEvent;
      if (!e) return;
      const target = (e.target as HTMLElement)?.closest<HTMLElement>("[data-tilt]");
      if (target !== activeEl && activeEl) {
        activeEl.style.setProperty("--tilt-x", "0");
        activeEl.style.setProperty("--tilt-y", "0");
      }
      activeEl = target;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      target.style.setProperty("--tilt-x", x.toFixed(3));
      target.style.setProperty("--tilt-y", y.toFixed(3));
      target.style.setProperty("--glow-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
      target.style.setProperty("--glow-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
    }

    function onPointerMove(e: PointerEvent) {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      pendingEvent = e;
      if (!rafId) rafId = requestAnimationFrame(applyTilt);
    }

    function reset() {
      if (activeEl) {
        activeEl.style.setProperty("--tilt-x", "0");
        activeEl.style.setProperty("--tilt-y", "0");
        activeEl = null;
      }
    }

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", reset, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", reset);
      reset();
    };
  }, [reducedMotion, coarsePointer]);

  return null;
}
