// Generates the PWA/app icons from the BRACU Vault brand mark.
// Run: npm run gen:icons   (regenerate whenever the mark changes)
//
// Why a script (not next/og ImageResponse): @vercel/og crashes on Windows
// (fileURLToPath on its bundled font → "Invalid URL"), so we rasterize the
// brand SVG to static PNGs with sharp instead — works on every OS + in prod.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const GRAD = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#C17A2B"/><stop offset="0.55" stop-color="#8B6F47"/><stop offset="1" stop-color="#3A2E22"/>
</linearGradient></defs>`;

const MARK = `<g fill="none" stroke="#F8F5F0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
  <path d="M24 9 L37 16.5 L37 31.5 L24 39 L11 31.5 L11 16.5 Z"/><path d="M16 20 L24 29 L32 20"/>
</g><circle cx="24" cy="29" r="2.6" fill="#F8F5F0"/>`;

// scale the mark around the centre (24,24) to leave a safe zone
const scaled = (s) => `<g transform="translate(24 24) scale(${s}) translate(-24 -24)">${MARK}</g>`;

// rounded tile (home screens that don't mask), full-bleed (maskable / apple)
const anySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${GRAD}<rect width="48" height="48" rx="10.5" fill="url(#g)"/>${MARK}</svg>`;
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${GRAD}<rect width="48" height="48" fill="url(#g)"/>${scaled(0.78)}</svg>`;
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${GRAD}<rect width="48" height="48" fill="url(#g)"/>${scaled(0.64)}</svg>`;

const jobs = [
  ["icon-192.png", anySvg, 192],
  ["icon-512.png", anySvg, 512],
  ["maskable-192.png", maskableSvg, 192],
  ["maskable-512.png", maskableSvg, 512],
  ["apple-touch-icon.png", appleSvg, 180],
];

await mkdir(OUT, { recursive: true });
for (const [name, svg, size] of jobs) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(OUT, name));
  console.log("✓", name, `${size}x${size}`);
}
console.log("Done →", OUT);
