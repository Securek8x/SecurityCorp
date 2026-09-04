// Shared OG/Twitter share-card renderer (Bead securitycorp-source-wq4).
// Used by every per-page opengraph-image.tsx route (knowledge articles,
// guides, projects) so the three route files stay thin and the card
// layout/palette lives in exactly one place.
//
// next/og's ImageResponse renders via Satori, which supports only a
// constrained CSS subset (flexbox layout, no external stylesheets, no
// custom @font-face without embedding a font file) — this deliberately
// does not embed a font (no new binary asset/dependency for this pass;
// DESIGN.md already defines --font-sans-nf/--font-mono-nf as the
// sanctioned "no custom font available" fallback tokens, which is
// exactly this situation) and sticks to system-ui/monospace, matching
// that established fallback intent rather than inventing a new one.
//
// Never pass a factual claim, real identifier, or anything not already
// public in the article's own title/category/evidence-state into this —
// same publication-safety boundary as every other public surface.
import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";

// DESIGN.md tokens, inlined — Satori cannot read CSS custom properties.
const COLORS = {
  night: "#040609",
  paper: "#070b12",
  ink: "#e8f1f8",
  muted: "#93a6b9",
  line: "#1b2836",
  acid: "#00e5ff",
  accent2: "#8b5cf6",
};

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function renderOgImage({ kicker, title, badge }: { kicker: string; title: string; badge?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 76px",
          background: COLORS.night,
          backgroundImage: `linear-gradient(135deg, ${COLORS.night} 0%, ${COLORS.paper} 100%)`,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 28, fontFamily: "monospace", letterSpacing: 4, color: COLORS.acid, textTransform: "uppercase" }}>SecurityCorp</div>
          <div style={{ display: "flex", fontSize: 22, fontFamily: "monospace", letterSpacing: 2, color: COLORS.muted, textTransform: "uppercase" }}>{truncate(kicker, 40)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ width: 90, height: 5, display: "flex", background: COLORS.acid }} />
          <div style={{ display: "flex", fontSize: title.length > 60 ? 52 : 64, lineHeight: 1.12, color: COLORS.ink, fontWeight: 700 }}>{truncate(title, 110)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${COLORS.line}`, paddingTop: 28 }}>
          <div style={{ display: "flex", fontSize: 20, fontFamily: "monospace", color: COLORS.muted }}>securitycorp.net</div>
          {badge && (
            <div
              style={{
                display: "flex",
                fontSize: 18,
                fontFamily: "monospace",
                letterSpacing: 2,
                textTransform: "uppercase",
                color: COLORS.accent2,
                border: `1px solid ${COLORS.accent2}`,
                padding: "8px 16px",
              }}
            >
              {badge}
            </div>
          )}
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE },
  );
}
