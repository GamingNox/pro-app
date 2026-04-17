// Brand asset generator.
// ─ PWA icons  → simplified "CB" monogram on violet plaque (favicon / 192 / 512)
// ─ In-app     → full "Clientbase.fr" wordmark (logo-wordmark.svg)
// Both paths are rasterized from Segoe UI Black via opentype.js → deterministic.
import opentype from "opentype.js";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, "..", "public");

const FONT_PATH = "C:/Windows/Fonts/seguibl.ttf";
const font = opentype.loadSync(FONT_PATH);

const DARK = "#1E2A3A";
const VIOLET = "#5B4FE9";
const VIOLET_LIGHT = "#7B6DFF";
const VIOLET_DARK = "#3B30B5";
const CREAM_TOP = "#FDFCF8";
const CREAM_BOTTOM = "#F3F2EC";

/* ═ Path helpers ═══════════════════════════════════════════════ */
function measureOne(text, fontSize) {
  const p = font.getPath(text, 0, 0, fontSize);
  const bb = p.getBoundingBox();
  return { p, bb, w: bb.x2 - bb.x1, h: bb.y2 - bb.y1 };
}

function measureSplit(mainText, accentText, fontSize) {
  const mainPath = font.getPath(mainText, 0, 0, fontSize);
  const mainAdv = font.getAdvanceWidth(mainText, fontSize);
  const accentPath = font.getPath(accentText, mainAdv, 0, fontSize);
  const mbb = mainPath.getBoundingBox();
  const abb = accentPath.getBoundingBox();
  const bb = {
    x1: Math.min(mbb.x1, abb.x1),
    y1: Math.min(mbb.y1, abb.y1),
    x2: Math.max(mbb.x2, abb.x2),
    y2: Math.max(mbb.y2, abb.y2),
  };
  return {
    mainD: mainPath.toPathData(2),
    accentD: accentPath.toPathData(2),
    bb,
    w: bb.x2 - bb.x1,
    h: bb.y2 - bb.y1,
  };
}

/* ═ PWA icon — violet pill with white "Clientbase" wordmark ═════ */
function makePwaIcon(canvas) {
  // Pill dimensions — match provided logo proportions (~4.2:1 w:h).
  const pillMaxW = canvas * 0.86;
  const pillH = canvas * 0.26;
  const pillRx = pillH / 2; // stadium shape

  // Interior text padding (left/right).
  const insetX = pillH * 0.48;
  const textMaxW = pillMaxW - 2 * insetX;
  const textMaxH = pillH * 0.58;

  // Fit "Clientbase" inside the inner area.
  const refSize = 100;
  const r = measureOne("Clientbase", refSize);
  const scale = Math.min(textMaxW / r.w, textMaxH / r.h);
  const fontSize = refSize * scale;
  const m = measureOne("Clientbase", fontSize);

  // Final pill width hugs the text + symmetric inset, never exceeds pillMaxW.
  const pillW = Math.min(pillMaxW, m.w + 2 * insetX);
  const pillX = (canvas - pillW) / 2;
  const pillY = (canvas - pillH) / 2;

  // Text centered inside the pill (based on bbox).
  const textOffsetX = pillX + (pillW - m.w) / 2 - m.bb.x1;
  const textOffsetY = pillY + (pillH - m.h) / 2 - m.bb.y1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">
  <rect width="${canvas}" height="${canvas}" fill="#FFFFFF"/>
  <rect x="${pillX.toFixed(2)}" y="${pillY.toFixed(2)}" width="${pillW.toFixed(2)}" height="${pillH.toFixed(2)}" rx="${pillRx.toFixed(2)}" fill="${VIOLET}"/>
  <g transform="translate(${textOffsetX.toFixed(2)} ${textOffsetY.toFixed(2)})">
    <path d="${m.p.toPathData(2)}" fill="#FFFFFF"/>
  </g>
</svg>
`;
}

/* ═ In-app wordmark — full "Clientbase.fr" ═══════════════════════ */
function makeInAppWordmark(height = 120) {
  const fontSize = height * 0.58;
  const w = measureSplit("Clientbase.", "fr", fontSize);
  const padX = fontSize * 0.25;
  const width = Math.ceil(w.w + padX * 2);
  const offsetX = padX - w.bb.x1;
  const offsetY = (height - w.h) / 2 - w.bb.y1;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g transform="translate(${offsetX.toFixed(2)} ${offsetY.toFixed(2)})">
    <path d="${w.mainD}" fill="${DARK}"/>
    <path d="${w.accentD}" fill="${VIOLET}"/>
  </g>
</svg>
`;
}

writeFileSync(resolve(PUBLIC, "icon-192.svg"), makePwaIcon(192));
writeFileSync(resolve(PUBLIC, "icon-512.svg"), makePwaIcon(512));
writeFileSync(resolve(PUBLIC, "favicon.svg"), makePwaIcon(64));
writeFileSync(resolve(PUBLIC, "logo-wordmark.svg"), makeInAppWordmark(120));

console.log("✓ PWA icons: violet pill + Clientbase (favicon.svg, icon-192.svg, icon-512.svg)");
console.log("✓ In-app wordmark: Clientbase.fr (logo-wordmark.svg)");
void VIOLET_LIGHT; void VIOLET_DARK; void CREAM_TOP; void CREAM_BOTTOM;
