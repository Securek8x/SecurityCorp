"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion, useCoarsePointer, prefersReducedData } from "@/components/motion-controller";

const HeroWebglCanvas = dynamic(() => import("@/components/hero-webgl-canvas"), { ssr: false });

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Decides whether to attempt the WebGL hero scene at all, and only then
 * pulls in the (three.js-based) canvas module. `hero-network.tsx` — the
 * existing lightweight SVG — is always rendered underneath by the caller
 * as the complete, immediate, no-layout-shift fallback; this component
 * only ever adds a crossfading canvas on top of it, never replaces it in
 * the DOM, so there's nothing to "fall back to" on failure — the SVG was
 * already there.
 */
export function HeroSceneLoader({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const reducedMotion = useReducedMotion();
  const coarsePointer = useCoarsePointer();
  const [attempt, setAttempt] = useState(false);
  const decided = useRef(false);

  useEffect(() => {
    if (decided.current) return;
    if (reducedMotion || coarsePointer || prefersReducedData() || !webglAvailable()) return;
    decided.current = true;
    // Defer past first paint so the WebGL init never competes with hero
    // text/LCP — the SVG fallback is already fully painted by this point.
    const hasIdle = typeof window.requestIdleCallback === "function";
    const id = hasIdle ? window.requestIdleCallback(() => setAttempt(true), { timeout: 1200 }) : window.setTimeout(() => setAttempt(true), 300);
    return () => {
      if (hasIdle) window.cancelIdleCallback(id as number);
      else window.clearTimeout(id as number);
    };
  }, [reducedMotion, coarsePointer]);

  if (!attempt) return null;
  return <HeroWebglCanvas containerRef={containerRef} />;
}
