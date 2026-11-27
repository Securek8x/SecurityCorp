/* eslint-disable @next/next/no-img-element -- next.config.ts sets
   images.unoptimized:true (static export), so next/image adds nothing over a
   plain <img> with explicit dimensions for this fixed-size mark. */

/**
 * The site logo: the tiger mark plus a set-in-type "SecurityCorp" wordmark in
 * the publication serif (redesign, Bead securitycorp-source-wo8.1). The mark
 * is decorative; the accessible name is the visible wordmark text.
 */
export function BrandLockup() {
  return (
    <>
      <img className="brand-tiger" src="/brand/tiger-mark.webp" width={28} height={28} alt="" decoding="async" />
      <span className="brand-wordmark">SecurityCorp</span>
    </>
  );
}
