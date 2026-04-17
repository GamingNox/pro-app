import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRAND = join(__dirname, "..", "public", "brand");

const exports = [
  { src: "clientbase-mark.svg", out: "clientbase-mark-512.png", size: 512 },
  { src: "clientbase-mark.svg", out: "clientbase-mark-1024.png", size: 1024 },
  { src: "clientbase-mark.svg", out: "clientbase-mark-2048.png", size: 2048 },
  { src: "clientbase-wordmark.svg", out: "clientbase-wordmark-512.png", width: 1560 },
  { src: "clientbase-lockup.svg", out: "clientbase-lockup-1024.png", width: 2048 },
];

for (const e of exports) {
  const svg = readFileSync(join(BRAND, e.src));
  let pipe = sharp(svg, { density: 384 });
  if (e.size) pipe = pipe.resize(e.size, e.size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } });
  else if (e.width) pipe = pipe.resize({ width: e.width, fit: "inside", background: { r: 255, g: 255, b: 255, alpha: 0 } });
  await pipe.png({ compressionLevel: 9, palette: false }).toFile(join(BRAND, e.out));
  console.log("✔", e.out);
}
