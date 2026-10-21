/* Painted ground for the vale and the fight board.
   One repeating texture per material, clipped to the diamond, so
   neighbouring tiles share the paint. A face is drawn only where
   the next cell sits lower. */

const STEP = 0.7;

const FALLBACK = {
  meadow: "#2c6a4c",
  thicket: "#1a3024",
  path: "#8b6842",
  yard: "#6e7d8b",
  water: "#14384c",
  rock: "#5c6b78"
};

const imgs = new Map();
const patterns = new WeakMap();

export function bindTerrain(name, image) {
  imgs.set(name, image);
}

export function scenicOf(tile) {
  if (tile && tile.scenic) return tile.scenic;
  if (tile && tile.road) return "path";
  if (tile && tile.ground === "water") return "water";
  if (tile && tile.ground === "stone") return "yard";
  return "meadow";
}

export function elevOf(tile) {
  if (tile && tile.elev != null) return tile.elev;
  if (tile && tile.ground === "water") return 0;
  return 1;
}

export function liftOf(elev, th) {
  return ((elev == null ? 1 : elev) - 1) * th * STEP;
}

function patternFor(ctx, scenic) {
  const img = imgs.get(scenic);
  if (!img || !img.complete || !img.naturalWidth) return null;
  let bag = patterns.get(ctx);
  if (!bag) {
    bag = new Map();
    patterns.set(ctx, bag);
  }
  if (bag.has(scenic)) return bag.get(scenic);
  const pat = ctx.createPattern(img, "repeat");
  bag.set(scenic, pat);
  return pat;
}

export function diamondPath(ctx, cx, cy, tw, th) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - th / 2);
  ctx.lineTo(cx + tw / 2, cy);
  ctx.lineTo(cx, cy + th / 2);
  ctx.lineTo(cx - tw / 2, cy);
  ctx.closePath();
}

export function drawTop(ctx, cx, cy, tw, th, scenic) {
  const fallback = FALLBACK[scenic] || FALLBACK.meadow;
  ctx.save();
  // A solid under-coat, slightly large, so the clip edge blends into paint instead of the night sky.
  diamondPath(ctx, cx, cy, tw + 3.2, th + 2);
  ctx.fillStyle = fallback;
  ctx.fill();
  diamondPath(ctx, cx, cy, tw + 1.4, th + 0.9);
  ctx.clip();
  const pat = patternFor(ctx, scenic);
  ctx.fillStyle = pat || fallback;
  ctx.fill();
  ctx.restore();
}

function drawFace(ctx, ax, ay, bx, by, drop, lit) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(bx, by + drop);
  ctx.lineTo(ax, ay + drop);
  ctx.closePath();
  ctx.clip();
  const pat = patternFor(ctx, "rock");
  ctx.fillStyle = pat || FALLBACK.rock;
  ctx.fill();
  const g = ctx.createLinearGradient(0, Math.min(ay, by), 0, Math.max(ay, by) + drop);
  g.addColorStop(0, lit ? "rgba(255, 236, 206, 0.2)" : "rgba(0, 0, 0, 0.25)");
  g.addColorStop(1, lit ? "rgba(0, 0, 0, 0.38)" : "rgba(0, 0, 0, 0.62)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

export function drawCliffs(ctx, cx, cy, tw, th, elev, eastElev, southElev) {
  const topY = cy - liftOf(elev, th);
  const eastDrop = (elev - eastElev) * th * STEP;
  const southDrop = (elev - southElev) * th * STEP;
  if (eastDrop > 1) drawFace(ctx, cx + tw / 2, topY, cx, topY + th / 2, eastDrop, false);
  if (southDrop > 1) drawFace(ctx, cx - tw / 2, topY, cx, topY + th / 2, southDrop, true);
}
