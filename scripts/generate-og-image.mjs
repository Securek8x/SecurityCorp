// One-off script: renders the same artwork as app/opengraph-image.tsx to a
// real static PNG file, so it can be served with a correct .png extension
// (Cloudflare Pages was serving the extensionless dynamic route as
// application/octet-stream instead of image/png). Not part of the build.
import { writeFile } from "node:fs/promises";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";

const size = { width: 1200, height: 630 };

const tree = h(
  "div",
  {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "80px 100px",
      background:
        "radial-gradient(55% 55% at 78% 15%, rgba(76,232,255,0.20) 0%, rgba(4,6,9,0) 70%), radial-gradient(45% 45% at 10% 90%, rgba(139,124,255,0.16) 0%, rgba(4,6,9,0) 70%), #040609",
      color: "#f4f8fc",
      fontFamily: "Georgia, 'Times New Roman', serif",
    },
  },
  h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 16, marginBottom: 48 } },
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          background: "#4ce8ff",
          color: "#040609",
          fontSize: 30,
          fontWeight: 700,
          fontFamily: "Arial, Helvetica, sans-serif",
        },
      },
      "S",
    ),
    h(
      "div",
      { style: { display: "flex", fontSize: 28, fontWeight: 800, letterSpacing: 2, fontFamily: "Arial, Helvetica, sans-serif", color: "#e8eef5" } },
      "SECURITY",
      h("span", { style: { color: "#8291a6" } }, "CORP"),
    ),
  ),
  h("div", { style: { display: "flex", fontSize: 76, lineHeight: 1.05, letterSpacing: "-0.02em" } }, "Security is a"),
  h(
    "div",
    { style: { display: "flex", fontSize: 76, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#4ce8ff", marginBottom: 40 } },
    "practice.",
  ),
  h(
    "div",
    { style: { display: "flex", fontSize: 26, color: "#8291a6", fontFamily: "Arial, Helvetica, sans-serif", maxWidth: 820 } },
    "Hands-on security guides, honest lab notes, and defensive systems built to fail safely.",
  ),
);

const response = new ImageResponse(tree, size);
const buffer = Buffer.from(await response.arrayBuffer());
await writeFile(new URL("../public/opengraph-image.png", import.meta.url), buffer);
console.log(`wrote public/opengraph-image.png (${buffer.length} bytes)`);
