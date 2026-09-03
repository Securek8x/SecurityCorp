import { getSecurityTxtContent } from "@/lib/security-txt";

export const dynamic = "force-static";

// Content-Type/Cache-Control here are a fallback only — public/_headers sets
// the authoritative headers for this static export at Cloudflare's edge
// (Next's static-export route handlers don't control response headers at
// serve time; only the file that ships in `out/` matters — same pattern as
// app/build-info.json/route.ts).
export function GET() {
  return new Response(getSecurityTxtContent(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
