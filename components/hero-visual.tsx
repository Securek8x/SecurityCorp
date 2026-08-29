"use client";
import { useRef } from "react";
import HeroNetwork from "@/components/diagrams/hero-network";
import { HeroSceneLoader } from "@/components/hero-scene-loader";
import { HeroTigerImage } from "@/components/hero-tiger-image";

/**
 * Layering, back to front: the actual tiger artwork (HeroTigerImage, a
 * plain <img> — visible immediately, no script/WebGL required) as its own
 * sibling so the network's opacity/visibility rules at narrower breakpoints
 * never dim or hide it; then hero-network.tsx (the existing lightweight
 * SVG, always rendered and the complete experience on its own — no JS,
 * reduced motion, coarse pointer, Save-Data, or WebGL failure all just mean
 * the image + this SVG is what stays visible); then the WebGL canvas (if
 * attempted and successful), which crossfades on top of the SVG at the
 * exact same position/size so nothing shifts layout on load or on canvas
 * failure. The WebGL scene is untouched from main and draws no tiger of
 * its own — there is only ever one visible tiger.
 */
export function HeroVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <HeroTigerImage />
      <div className="hero-visual" ref={containerRef}>
        <HeroNetwork />
        <HeroSceneLoader containerRef={containerRef} />
      </div>
    </>
  );
}
