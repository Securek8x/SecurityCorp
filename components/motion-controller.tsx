"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Module-level pub-sub so additional consumers (the WebGL hero scene, the
// card-tilt controller) can read tab-hidden state without each attaching
// its own `visibilitychange` listener — MotionController's own listener
// (below) is the only one that ever fires; this just fans it out.
const tabHiddenListeners = new Set<(hidden: boolean) => void>();
let lastTabHidden = false;
function notifyTabHidden(hidden: boolean) {
  lastTabHidden = hidden;
  tabHiddenListeners.forEach((cb) => cb(hidden));
}

/** True while the document tab is hidden. Shares MotionController's one listener. */
export function useTabHidden(): boolean {
  const [hidden, setHidden] = useState(lastTabHidden);
  useEffect(() => {
    tabHiddenListeners.add(setHidden);
    return () => {
      tabHiddenListeners.delete(setHidden);
    };
  }, []);
  return hidden;
}

function matchMediaState(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

/** True if the user has asked for reduced motion. Re-evaluates on change. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => matchMediaState("(prefers-reduced-motion: reduce)"));
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** True on devices whose primary input has no hover/fine pointer (touch). */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => matchMediaState("(pointer: coarse)"));
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = () => setCoarse(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return coarse;
}

/** True when the browser has requested reduced data usage (Save-Data). */
export function prefersReducedData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(conn?.saveData);
}

/**
 * Single shared IntersectionObserver for every `[data-motion]` element on
 * the page (hero network loop, guide-diagram play-once sequences, build-log
 * circuit, case timeline). Avoids per-component observers and per-element
 * scroll listeners.
 *
 * Contract (see app/globals.css "MOTION SYSTEM" for the CSS half):
 * - data-motion="once": plays a sequence exactly once when it first enters
 *   the viewport, then is unobserved. data-motion-duration (ms) controls
 *   when the element is marked data-motion-state="complete".
 * - data-motion="loop": data-motion-state toggles active/paused as it
 *   enters/leaves the viewport, and is forced paused while the tab is
 *   hidden (via a body class, checked in CSS) — resumes automatically.
 *
 * Renders nothing. Skips all setup under prefers-reduced-motion: reduce —
 * the CSS default (fully drawn/complete) already satisfies that case, so
 * there is nothing for this controller to do.
 */
// Module-level so components that remount an already-primed element (a
// React `key` change — the guide diagrams' Replay button, most notably)
// can re-register themselves with the *same* running observer instead of
// waiting for a route change to be rescanned. Safe to call with no
// observer yet (reduced motion, or before MotionController has mounted) —
// it's just a no-op then, matching the reduced-motion CSS fallback.
let sharedObserver: IntersectionObserver | null = null;

/** Re-observe an element whose data-motion sequence needs to run again
 *  (e.g. after a key-remount) without waiting for the next route change. */
export function reobserveMotionElement(el: HTMLElement | null) {
  if (!el || !sharedObserver) return;
  delete el.dataset.motionState;
  sharedObserver.observe(el);
}

export function MotionController() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.documentElement.setAttribute("data-js-motion", "true");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const mode = el.dataset.motion;
          if (mode === "once") {
            if (entry.isIntersecting && el.dataset.motionState !== "complete") {
              el.dataset.motionPrimed = "true";
              el.dataset.motionState = "active";
              const duration = Number(el.dataset.motionDuration) || 4200;
              window.setTimeout(() => {
                el.dataset.motionState = "complete";
              }, duration);
              observer.unobserve(el);
            }
          } else if (mode === "loop") {
            // motionPrimed is permanent once set: a drawn path must stay drawn
            // when the element pauses offscreen, even though the packet/pulse
            // loop animations (gated on motion-state, not motion-primed) do
            // pause. Only the pause/resume toggle is reversible.
            if (entry.isIntersecting) el.dataset.motionPrimed = "true";
            el.dataset.motionState = entry.isIntersecting ? "active" : "paused";
          }
        }
      },
      { threshold: 0.25 }
    );
    sharedObserver = observer;

    document.querySelectorAll<HTMLElement>("[data-motion]").forEach((el) => {
      if (el.dataset.motionState !== "complete") observer.observe(el);
    });

    function onVisibility() {
      const hidden = document.visibilityState !== "visible";
      document.body.classList.toggle("motion-tab-hidden", hidden);
      notifyTabHidden(hidden);
    }
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();

    return () => {
      observer.disconnect();
      if (sharedObserver === observer) sharedObserver = null;
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // Re-scan after every route change: elements on the new page need fresh
    // observation, and any observer for the previous page is torn down above.
  }, [pathname]);

  return null;
}
