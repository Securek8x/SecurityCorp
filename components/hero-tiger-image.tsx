// holographic-tiger-guardian (image edition): the actual supplied artwork,
// rendered as a plain <img> so it is visible immediately — before any
// script runs, with WebGL unavailable, under reduced motion, and with
// JavaScript disabled entirely. Purely decorative: aria-hidden, empty alt,
// no pointer events. See app/globals.css ".hero-tiger-image" for the
// mask/glow/scan-band treatment that blends its square source into the
// hero instead of showing an obvious avatar tile.
export function HeroTigerImage() {
  return (
    <div className="hero-tiger-image" aria-hidden="true">
      <div className="hero-tiger-glow" />
      {/* eslint-disable-next-line @next/next/no-img-element -- must be a
          real <img>, not next/image: needs to render before hydration with
          no lazy-load/optimization pipeline in the loop, per the explicit
          "actual artwork, always visible without JS" requirement. */}
      <img
        src="/images/securitycorp-tiger-guardian.png"
        alt=""
        aria-hidden="true"
        width={460}
        height={460}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        draggable={false}
      />
      <span className="hero-tiger-scan" />
      <span className="hero-tiger-eyeglow" />
    </div>
  );
}
