import { getBuildInfo } from "@/lib/build-info";

export const dynamic = "force-static";

// Cache-Control here is a fallback only — public/_headers sets the
// authoritative header for this static export at Cloudflare's edge (Next's
// static-export route handlers don't control response headers at serve
// time; only the file that ships in `out/` matters). Kept in sync with
// public/_headers deliberately: `no-cache` (revalidate on every request via
// ETag, not "never cache") so a stale deployment's provenance is never
// served without at least a conditional-GET round trip against the current
// deployment.
export function GET() {
  return new Response(JSON.stringify(getBuildInfo(), null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
