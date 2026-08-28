/**
 * A small local inline SVG standing in for Lucide's ShieldCheck in the
 * header wordmark only (the footer keeps the plain Lucide icon, static and
 * unanimated). Drawn locally — rather than animating Lucide's internal
 * path structure — because that structure isn't a public API and could
 * silently change shape on a library update; a local SVG we author keeps
 * the entrance-draw animation stable across upgrades. Generic shield
 * silhouette, not a reproduction of any third-party logo.
 */
export function WordmarkIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="wordmark-icon-svg"
    >
      <path
        className="wordmark-shield-outline"
        style={{ "--path-length": 44 } as React.CSSProperties}
        d="M12 3 L19 6 V11 C19 15.5 16 19 12 21 C8 19 5 15.5 5 11 V6 Z"
      />
      <path
        className="wordmark-shield-check"
        style={{ "--path-length": 9 } as React.CSSProperties}
        d="M9 12 L11 14 L15 9.5"
      />
    </svg>
  );
}
