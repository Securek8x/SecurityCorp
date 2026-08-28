"use client";
import { useRef } from "react";
import HeroNetwork from "@/components/diagrams/hero-network";
import { HeroSceneLoader } from "@/components/hero-scene-loader";

/**
 * hero-network.tsx (the existing lightweight SVG) is always rendered first
 * and is the complete experience on its own — no JS, reduced motion,
 * coarse pointer, Save-Data, or WebGL failure all just mean this is what
 * stays visible. The WebGL canvas (if attempted and successful) crossfades
 * on top of it at the exact same position/size, so nothing ever shifts
 * layout on load or on canvas failure.
 */
export function HeroVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="hero-visual" ref={containerRef}>
      <HeroNetwork />
      <HeroSceneLoader containerRef={containerRef} />
    </div>
  );
}
