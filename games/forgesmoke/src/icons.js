/**
 * Weapon icons / silhouettes — 48 px procedural generator.
 * Produces a 256×256 atlas (5×3 grid = 15 slots, 12 used) for all 12 styles.
 * Each icon is a distinct silhouette at 48×48, rendered to an offscreen canvas.
 * Original (project-owned), CC0-compatible, no external assets.
 */
import * as THREE from "three";

export const ICON_SIZE = 48;
export const ATLAS_COLS = 5;
export const ATLAS_ROWS = 3;
export const ATLAS_SIZE = 256;

export const STYLE_ICON_INDEX = {
  spray: 0,
  cone: 1,
  pierce: 2,
  ricochet: 3,
  arc: 4,
  beam: 5,
  chain: 6,
  burst: 7,
  spinup: 8,
  rail: 9,
  flamer: 10,
  sentry: 11,
};

const STYLE_COLORS = {
  spray: 0xffd57a,
  cone: 0xff8a4a,
  pierce: 0x6fe3ff,
  ricochet: 0xa6ff7a,
  arc: 0xff6fd6,
  beam: 0x4deeea,
  chain: 0xc6a6ff,
  burst: 0xffe36f,
  spinup: 0xff5a5a,
  rail: 0xffffff,
  flamer: 0xff6a2a,
  sentry: 0x6fff9a,
};

function drawSpray(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = "#ffd57a";
  ctx.beginPath();
  ctx.roundRect(-10, -6, 20, 12, 2);
  ctx.fill();
  ctx.fillRect(-2, -6, 4, 6);
  ctx.fillRect(-10, -2, 6, 4);
  ctx.restore();
}

function drawCone(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = "#ff8a4a";
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(-8, 8);
  ctx.lineTo(8, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-3, -4, 6, 6);
  ctx.restore();
}

function drawPierce(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = "#6fe3ff";
  ctx.fillRect(-1, -14, 2, 28);
  ctx.fillRect(-5, -2, 10, 4);
  ctx.fillRect(-3, 8, 6, 3);
  ctx.restore();
}

function drawRicochet(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = "#a6ff7a";
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.lineTo(10, -6);
  ctx.lineTo(6, 6);
  ctx.lineTo(-12, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-2, -4, 4, 8);
  ctx.restore();
}

function drawArc(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = "#ff6fd6";
  ctx.beginPath();
  ctx.moveTo(-10, 2);
  ctx.quadraticCurveTo(0, -12, 10, 2);
  ctx.lineTo(8, 6);
  ctx.quadraticCurveTo(0, -8, -8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-3, 0, 6, 4);
  ctx.restore();
}

function drawBeam(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = "#4deeea";
  ctx.fillRect(-2, -14, 4, 28);
  ctx.fillRect(-6, -2, 12, 4);
  ctx.restore();
}

function drawChain(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = "#c6a6ff";
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1d22";
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-2, -10, 4, 5);
  ctx.restore();
}

function drawBurst(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = "#ffe36f";
  ctx.fillRect(-1.5, -14, 3, 28);
  ctx.fillRect(-6, 2, 12, 4);
  ctx.fillRect(-5, -8, 10, 3);
  ctx.restore();
}

function drawSpinup(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = "#ff5a5a";
  ctx.fillRect(-10, -4, 20, 8);
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-2, -10, 4, 8);
  ctx.restore();
}

function drawRail(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-2, -16, 4, 32);
  ctx.fillRect(-8, -2, 16, 4);
  ctx.fillRect(-6, 10, 12, 4);
  ctx.restore();
}

function drawFlamer(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = "#ff6a2a";
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(-6, 10);
  ctx.lineTo(6, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-4, 2, 8, 5);
  ctx.restore();
}

function drawSentry(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = "#6fff9a";
  ctx.beginPath();
  ctx.arc(0, 2, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-2, -10, 4, 10);
  ctx.fillRect(-8, -6, 16, 3);
  ctx.restore();
}

const DRAW_FUNCS = {
  spray: drawSpray,
  cone: drawCone,
  pierce: drawPierce,
  ricochet: drawRicochet,
  arc: drawArc,
  beam: drawBeam,
  chain: drawChain,
  burst: drawBurst,
  spinup: drawSpinup,
  rail: drawRail,
  flamer: drawFlamer,
  sentry: drawSentry,
};

const sortedStyles = () =>
  Object.keys(STYLE_ICON_INDEX).sort((a, b) => STYLE_ICON_INDEX[a] - STYLE_ICON_INDEX[b]);

/**
 * Paint the 5x3 icon grid. `background` null clears to transparent (the shipped HUD sheet);
 * a colour fills the sheet (the atlas texture used by older callers).
 */
function paintIconSheet(ctx, { background = null } = {}) {
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);
  } else {
    ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);
  }

  const scale = 1.6;
  for (const style of sortedStyles()) {
    const idx = STYLE_ICON_INDEX[style];
    const col = idx % ATLAS_COLS;
    const row = Math.floor(idx / ATLAS_COLS);
    const cx = col * ICON_SIZE + ICON_SIZE / 2;
    const cy = row * ICON_SIZE + ICON_SIZE / 2;
    DRAW_FUNCS[style](ctx, cx, cy, scale);
  }
}

export function generateWeaponIconAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext("2d");
  paintIconSheet(ctx, { background: "#0b0d11" });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  texture.userData = { baked: "weapon-icons", size: ICON_SIZE };
  return texture;
}

/** The shipped HUD icon sheet (ART_BIBLE.md section 8): 256x256 PNG, transparent, 48 px cells. */
export function generateWeaponIconSheetDataUrl() {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  paintIconSheet(canvas.getContext("2d"), { background: null });
  return canvas.toDataURL("image/png");
}

/**
 * Slice `assets/icons/hud-weapon-icons.png` into one data URL per style so the HUD can draw a
 * single item per weapon plate. Resolves null on load failure; the caller keeps the procedural
 * fallback in that case.
 */
export function loadWeaponIconSheetDataUrls(src) {
  return new Promise((resolve) => {
    if (typeof Image !== "function") {
      resolve(null);
      return;
    }
    const image = new Image();
    image.onload = () => {
      const dataUrls = {};
      for (const style of sortedStyles()) {
        const idx = STYLE_ICON_INDEX[style];
        const col = idx % ATLAS_COLS;
        const row = Math.floor(idx / ATLAS_COLS);
        const iconCanvas = document.createElement("canvas");
        iconCanvas.width = ICON_SIZE;
        iconCanvas.height = ICON_SIZE;
        iconCanvas
          .getContext("2d")
          .drawImage(
            image,
            col * ICON_SIZE, row * ICON_SIZE,
            ICON_SIZE, ICON_SIZE,
            0, 0,
            ICON_SIZE, ICON_SIZE,
          );
        dataUrls[style] = iconCanvas.toDataURL("image/png");
      }
      resolve(dataUrls);
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export function getWeaponIconUV(style) {
  const idx = STYLE_ICON_INDEX[style];
  if (idx === undefined) return null;
  const col = idx % ATLAS_COLS;
  const row = Math.floor(idx / ATLAS_COLS);
  const u0 = col / ATLAS_COLS;
  const v0 = row / ATLAS_ROWS;
  const u1 = (col + 1) / ATLAS_COLS;
  const v1 = (row + 1) / ATLAS_ROWS;
  return { u0, v0, u1, v1 };
}

export function createWeaponIconMesh(style, atlasTexture) {
  const uv = getWeaponIconUV(style);
  if (!uv) return null;
  const geo = new THREE.PlaneGeometry(1, 1);
  const attrs = geo.attributes;
  const uvAttr = new Float32Array([
    uv.u0, uv.v1,
    uv.u1, uv.v1,
    uv.u0, uv.v0,
    uv.u1, uv.v0,
  ]);
  geo.setAttribute("uv", new THREE.BufferAttribute(uvAttr, 2));
  const mat = new THREE.MeshBasicMaterial({
    map: atlasTexture,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.tag = `weapon-icon-${style}`;
  return mesh;
}

export function generateWeaponIconDataUrls() {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  paintIconSheet(canvas.getContext("2d"), { background: "#0b0d11" });

  const dataUrls = {};
  for (const style of sortedStyles()) {
    const idx = STYLE_ICON_INDEX[style];
    const col = idx % ATLAS_COLS;
    const row = Math.floor(idx / ATLAS_COLS);
    const iconCanvas = document.createElement("canvas");
    iconCanvas.width = ICON_SIZE;
    iconCanvas.height = ICON_SIZE;
    const iconCtx = iconCanvas.getContext("2d");
    iconCtx.drawImage(
      canvas,
      col * ICON_SIZE, row * ICON_SIZE,
      ICON_SIZE, ICON_SIZE,
      0, 0,
      ICON_SIZE, ICON_SIZE
    );
    dataUrls[style] = iconCanvas.toDataURL("image/png");
  }
  return dataUrls;
}