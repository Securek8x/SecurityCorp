// Extracts the site logo assets from the approved logo source image
// (Bead securitycorp-source-72w). The source is a generated raster whose
// "transparent" checkerboard and drop shadow are painted in (no alpha), so it
// can't be used directly on the dark/light header. This produces:
//
//   public/brand/tiger-mark.webp    the tiger head, background removed
//   public/brand/wordmark-mask.png  the SECURITYCORP lettering as an alpha
//                                   mask — CSS fills it with the theme ink,
//                                   so it reads light on dark, dark on light
//   public/brand/wordmark-net.webp  the ".NET" in its original colours,
//                                   aligned to the mask's box
//
// Usage: node scripts/extract-brand-assets.ts "<path to source .png>"
// The source image is not committed; rerun only when the logo changes.
import path from "node:path";
import { mkdir, stat } from "node:fs/promises";
import sharp, { type Region } from "sharp";

const OUT = path.resolve(import.meta.dirname, "../public/brand");
// Display sizes: tiger ≤44 CSS px, lettering 20 CSS px tall. Export at 3×.
const TIGER_PX = 132;
const LETTERING_PX = 60;

type Raw = { data: Buffer; width: number; height: number; channels: number };

async function region(src: string, box: Region, alpha: boolean): Promise<Raw> {
  let img = sharp(src).extract(box);
  if (alpha) img = img.ensureAlpha();
  else img = img.removeAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

/** Tiger: flood-fill the light, low-saturation painted background from the
 * crop's edges; the tiger's cyan outline stops the fill. */
async function tiger(src: string): Promise<Buffer> {
  const { data, width: W, height: H } = await region(src, { left: 20, top: 140, width: 580, height: 600 }, true);
  const isBg = (p: number) => {
    const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
    return Math.min(r, g, b) > 150 && Math.max(r, g, b) - Math.min(r, g, b) < 22;
  };
  const bg = new Uint8Array(W * H);
  const queue: number[] = [];
  for (let x = 0; x < W; x++) queue.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) queue.push(y * W, y * W + W - 1);
  while (queue.length) {
    const p = queue.pop()!;
    if (bg[p] || !isBg(p)) continue;
    bg[p] = 1;
    data[p * 4 + 3] = 0;
    const x = p % W;
    if (x > 0) queue.push(p - 1);
    if (x < W - 1) queue.push(p + 1);
    if (p >= W) queue.push(p - W);
    if (p < W * (H - 1)) queue.push(p + W);
  }
  // Soften the one-pixel boundary so the outline doesn't fringe.
  for (let p = 0; p < W * H; p++) {
    if (bg[p]) continue;
    const x = p % W;
    const n = (x > 0 && bg[p - 1] ? 1 : 0) + (x < W - 1 && bg[p + 1] ? 1 : 0) + (p >= W && bg[p - W] ? 1 : 0) + (p < W * (H - 1) && bg[p + W] ? 1 : 0);
    if (n >= 2) data[p * 4 + 3] = 170;
  }
  const png = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  return sharp(await sharp(png).trim().toBuffer())
    .resize(TIGER_PX, TIGER_PX, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toBuffer();
}

/** Lettering: near-white glyphs sit on the grey drop-shadow band, so they
 * separate by brightness; ".NET" separates by saturation. Both layers share
 * one crop box so they stay aligned when stacked. */
async function lettering(src: string): Promise<{ mask: Buffer; net: Buffer }> {
  const { data, width: W, height: H } = await region(src, { left: 585, top: 385, width: 1150, height: 130 }, false);
  const N = W * H;
  const rgb = (p: number) => [data[p * 3], data[p * 3 + 1], data[p * 3 + 2]];
  const sat = (p: number) => Math.max(...rgb(p)) - Math.min(...rgb(p));
  const low = (p: number) => Math.min(...rgb(p));
  const white = new Uint8Array(N);
  const color = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    if (sat(p) > 70) color[p] = 1;
    else if (low(p) >= 236) white[p] = 1;
  }

  // Keep glyph-sized connected components that cross the text's centre line.
  const label = new Int32Array(N).fill(-1);
  const comps: { y0: number; y1: number; n: number }[] = [];
  for (let s = 0; s < N; s++) {
    if (!white[s] || label[s] >= 0) continue;
    const id = comps.length;
    const stack = [s];
    label[s] = id;
    let y0 = H, y1 = 0, n = 0;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % W, y = (p / W) | 0;
      n++;
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      for (const q of [p - 1, p + 1, p - W, p + W]) {
        if (q < 0 || q >= N || Math.abs((q % W) - x) > 1) continue;
        if (white[q] && label[q] < 0) {
          label[q] = id;
          stack.push(q);
        }
      }
    }
    comps.push({ y0, y1, n });
  }
  const big = comps.filter((c) => c.n > 200);
  const heights = big.map((c) => c.y1 - c.y0).sort((a, b) => a - b);
  const capHeight = heights[Math.floor(heights.length * 0.75)] ?? 60;
  const mid = big.reduce((sum, c) => sum + (c.y0 + c.y1) / 2, 0) / Math.max(1, big.length);
  const keep = comps.map((c) => c.n > 40 && c.y1 - c.y0 > capHeight * 0.5 && c.y0 < mid && c.y1 > mid);

  // Anti-aliased alpha from brightness, within 2px of a kept glyph.
  const near = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    if (label[p] < 0 || !keep[label[p]]) continue;
    const x = p % W, y = (p / W) | 0;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < W && yy >= 0 && yy < H) near[yy * W + xx] = 1;
      }
  }
  const colorXs: number[] = [];
  for (let p = 0; p < N; p++) if (color[p]) colorXs.push(p % W);
  colorXs.sort((a, b) => a - b);
  const netStart = colorXs.length ? colorXs[Math.floor(colorXs.length * 0.02)] - 4 : W;

  const mask = Buffer.alloc(N * 4);
  const net = Buffer.alloc(N * 4);
  for (let p = 0; p < N; p++) {
    if (near[p] && sat(p) <= 70) {
      mask.set([255, 255, 255, Math.max(0, Math.min(255, Math.round(((low(p) - 205) / 40) * 255)))], p * 4);
    }
    if (color[p] && p % W >= netStart) {
      const [r, g, b] = rgb(p);
      net.set([r, g, b, Math.min(255, (sat(p) - 70) * 4)], p * 4);
    }
  }

  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let p = 0; p < N; p++) {
    if (mask[p * 4 + 3] <= 20 && net[p * 4 + 3] <= 20) continue;
    const x = p % W, y = (p / W) | 0;
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  const crop = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  const layer = (buf: Buffer) => sharp(buf, { raw: { width: W, height: H, channels: 4 } }).extract(crop).resize({ height: LETTERING_PX });
  return {
    mask: await layer(mask).png({ compressionLevel: 9, palette: true }).toBuffer(),
    net: await layer(net).webp({ quality: 90, alphaQuality: 100 }).toBuffer(),
  };
}

const src = process.argv[2];
if (!src) {
  console.error('usage: node scripts/extract-brand-assets.ts "<source .png>"');
  process.exit(1);
}
await mkdir(OUT, { recursive: true });
const { mask, net } = await lettering(src);
await sharp(await tiger(src)).toFile(path.join(OUT, "tiger-mark.webp"));
await sharp(mask).toFile(path.join(OUT, "wordmark-mask.png"));
await sharp(net).toFile(path.join(OUT, "wordmark-net.webp"));
for (const f of ["tiger-mark.webp", "wordmark-mask.png", "wordmark-net.webp"]) {
  const m = await sharp(path.join(OUT, f)).metadata();
  console.log(`[brand-assets] ${f}: ${m.width}x${m.height}, ${(await stat(path.join(OUT, f))).size} bytes`);
}
