"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

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

    document.querySelectorAll<HTMLElement>("[data-motion]").forEach((el) => {
      if (el.dataset.motionState !== "complete") observer.observe(el);
    });

    function onVisibility() {
      document.body.classList.toggle("motion-tab-hidden", document.visibilityState !== "visible");
    }
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // Re-scan after every route change: elements on the new page need fresh
    // observation, and any observer for the previous page is torn down above.
  }, [pathname]);

  return null;
}
