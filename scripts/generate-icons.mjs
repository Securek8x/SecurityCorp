// One-off script: generates apple-touch-icon.png and favicon.ico from the
// same brand mark used in the site header (cyan chip, dark "S"), so browser
// chrome/bookmarks/iOS home screen icons match the header logo. Not part of
// the Next build — run manually when the mark design changes.
import { writeFile } from "node:fs/promises";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";

async function renderMark(size, radius) {
  const tree = h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#4ce8ff",
        borderRadius: radius,
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          color: "#040609",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontWeight: 800,
          fontSize: Math.round(size * 0.55),
        },
      },
      "S",
    ),
  );
  const response = new ImageResponse(tree, { width: size, height: size });
  return Buffer.from(await response.arrayBuffer());
}

// apple-touch-icon.png — iOS applies its own corner rounding, so this ships square.
const appleTouchIcon = await renderMark(180, 0);
await writeFile(new URL("../public/apple-touch-icon.png", import.meta.url), appleTouchIcon);
console.log(`wrote public/apple-touch-icon.png (${appleTouchIcon.length} bytes)`);

// favicon.ico — a single 48x48 PNG-in-ICO entry. Modern browsers and Windows
// both accept PNG-compressed ICO entries directly (no BMP/palette needed).
const faviconPng = await renderMark(48, 8);
const ICONDIR = Buffer.alloc(6);
ICONDIR.writeUInt16LE(0, 0); // reserved
ICONDIR.writeUInt16LE(1, 2); // type: 1 = icon
ICONDIR.writeUInt16LE(1, 4); // image count

const ICONDIRENTRY = Buffer.alloc(16);
ICONDIRENTRY.writeUInt8(48, 0); // width
ICONDIRENTRY.writeUInt8(48, 1); // height
ICONDIRENTRY.writeUInt8(0, 2); // color count (0 = not palette-based)
ICONDIRENTRY.writeUInt8(0, 3); // reserved
ICONDIRENTRY.writeUInt16LE(1, 4); // color planes
ICONDIRENTRY.writeUInt16LE(32, 6); // bits per pixel
ICONDIRENTRY.writeUInt32LE(faviconPng.length, 8); // size of image data
ICONDIRENTRY.writeUInt32LE(6 + 16, 12); // offset of image data

const ico = Buffer.concat([ICONDIR, ICONDIRENTRY, faviconPng]);
await writeFile(new URL("../public/favicon.ico", import.meta.url), ico);
console.log(`wrote public/favicon.ico (${ico.length} bytes)`);
