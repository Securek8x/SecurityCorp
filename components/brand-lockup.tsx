/* eslint-disable @next/next/no-img-element -- next.config.ts sets
   images.unoptimized:true (static export), so next/image adds nothing over a
   plain <img> with explicit dimensions for this fixed-size mark. */

/**
 * The site logo: the tiger mark plus a text wordmark. The tiger image is
 * decorative. The accessible name is the visually hidden text.
 */
export function BrandLockup() {
  return (
    <>
      <img className="brand-tiger" src="/brand/tiger-mark.webp" width={44} height={44} alt="" decoding="async" />
      <span className="brand-word" aria-hidden="true">
        Security<span>Corp</span>
      </span>
      <span className="sr-only">SecurityCorp.net</span>
    </>
  );
}
