/* eslint-disable @next/next/no-img-element -- next.config.ts sets
   images.unoptimized:true (static export), so next/image adds nothing over a
   plain <img> with explicit dimensions for this fixed-size mark. */

/**
 * The site logo: the tiger mark plus the original SECURITYCORP.NET lettering
 * (assets from scripts/extract-brand-assets.ts). The lettering is an alpha
 * mask filled with the theme ink, so it follows light/dark mode; ".NET" keeps
 * its own colours. Both images are decorative — the accessible name is the
 * visually hidden text.
 */
export function BrandLockup() {
  return (
    <>
      <img className="brand-tiger" src="/brand/tiger-mark.webp" width={44} height={44} alt="" decoding="async" />
      <span className="brand-lettering" aria-hidden="true">
        <span className="brand-lettering-ink" />
        <span className="brand-lettering-net" />
      </span>
      <span className="sr-only">SecurityCorp.net</span>
    </>
  );
}
