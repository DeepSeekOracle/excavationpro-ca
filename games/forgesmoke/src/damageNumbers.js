/**
 * Arcade damage numbers — pooled DOM labels projected from world space.
 *
 * Enemy hits pop a gold number at the target's head; crits are bigger and orange; kills turn red;
 * damage taken by the operator shows as a red negative over his shoulder. CSS does the pop/rise/fade,
 * this module only keeps the projection in sync for the label's ~0.9 s life.
 */

const LIFE = 0.92;
const MAX = 48;
const items = [];
let layer = null;
let styled = false;

const STYLE_ID = "fs-dmg-numbers-style";

function ensureStyle() {
  if (styled || typeof document === "undefined") return;
  styled = true;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
#fs-damage-layer{position:fixed;inset:0;pointer-events:none;z-index:70;overflow:hidden;contain:strict}
.fs-dmg{position:absolute;left:0;top:0;will-change:transform;transform:translate(-50%,-50%)}
.fs-dmg span{display:block;font-family:"Arial Black","Impact",system-ui,sans-serif;font-weight:900;
  letter-spacing:.5px;line-height:1;white-space:nowrap;transform-origin:50% 50%;
  -webkit-text-stroke:2px rgba(10,6,2,.85);paint-order:stroke fill;
  text-shadow:0 3px 0 rgba(0,0,0,.45),0 0 14px rgba(255,150,60,.55);
  animation:fs-dmg-pop ${LIFE}s cubic-bezier(.16,.84,.3,1) forwards}
.fs-dmg.enemy span{color:#ffe9a8;font-size:34px}
.fs-dmg.crit span{color:#ffb347;font-size:48px;text-shadow:0 3px 0 rgba(0,0,0,.5),0 0 22px rgba(255,110,20,.85)}
.fs-dmg.kill span{color:#ff5a5a;font-size:50px;text-shadow:0 3px 0 rgba(0,0,0,.5),0 0 24px rgba(255,40,40,.9)}
.fs-dmg.player span{color:#ff4d5e;font-size:42px;text-shadow:0 3px 0 rgba(0,0,0,.5),0 0 20px rgba(255,0,30,.75)}
}
@media (max-width:700px){.fs-dmg.enemy span{font-size:22px}.fs-dmg.crit span{font-size:30px}
  .fs-dmg.kill span{font-size:32px}.fs-dmg.player span{font-size:28px}}
`;
  document.head.appendChild(style);
}

function ensureLayer() {
  if (typeof document === "undefined") return null;
  ensureStyle();
  if (!layer || !layer.isConnected) {
    layer = document.getElementById("fs-damage-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "fs-damage-layer";
      document.body.appendChild(layer);
    }
  }
  return layer;
}

function makeLabel(kind) {
  const el = document.createElement("div");
  el.className = `fs-dmg ${kind}`;
  const span = document.createElement("span");
  el.appendChild(span);
  return { el, span };
}

/**
 * @param {number} x world position
 * @param {number} y world height (head/shoulder)
 * @param {number} z world position
 * @param {number} amount damage dealt/taken (rounded for display)
 * @param {{player?:boolean, crit?:boolean, kill?:boolean, suffix?:string}} opts
 */
export function spawnDamageNumber(x, y, z, amount, opts = {}) {
  const host = ensureLayer();
  if (!host || !Number.isFinite(amount)) return;
  const value = Math.max(1, Math.round(amount));
  const kind = opts.player ? "player" : opts.kill ? "kill" : opts.crit ? "crit" : "enemy";
  // Reuse expired labels before creating new nodes.
  let slot = items.find((it) => it.life <= 0);
  if (!slot) {
    if (items.length >= MAX) slot = items.shift();
    if (!slot) {
      const { el, span } = makeLabel(kind);
      host.appendChild(el);
      slot = { el, span, life: 0, world: { x: 0, y: 0, z: 0 }, jx: 0, jy: 0 };
      items.push(slot);
    }
  }
  slot.life = LIFE;
  slot.el.className = `fs-dmg ${kind}`;
  slot.el.style.display = "block";
  slot.span.textContent = opts.player ? `-${value}` : `${value}${opts.suffix || ""}`;
  slot.world.x = x;
  slot.world.y = y;
  slot.world.z = z;
  slot.jx = (Math.random() - 0.5) * 34;
  slot.jy = (Math.random() - 0.5) * 14;
  slot.age = 0;
  slot.span.style.opacity = "1";
  slot.el.style.transform = "translate(-50%,-50%)";
}

const _v = { x: 0, y: 0, z: 0 };

/** Project every live label to screen space. Call once per rendered frame with the live camera. */
export function updateDamageNumbers(camera, dt = 0.016) {
  if (!camera || !items.length) return;
  const w = globalThis.innerWidth || 1280;
  const h = globalThis.innerHeight || 720;
  for (const it of items) {
    if (it.life <= 0) {
      if (it.el.style.display !== "none") it.el.style.display = "none";
      continue;
    }
    it.life -= dt;
    if (it.life <= 0) {
      it.el.style.display = "none";
      continue;
    }
    const age = 1 - Math.max(0, it.life) / LIFE;      // 0 -> 1 over the label's life
    const pop = age < 0.16 ? (age / 0.16) : 1;        // fast punch-in
    const scale = age < 0.16 ? 0.35 + pop * 0.9 : 1.25 - (age - 0.16) * 0.28;
    const rise = -56 * age;
    const fade = age < 0.1 ? age / 0.1 : age > 0.62 ? Math.max(0, 1 - (age - 0.62) / 0.38) : 1;
    it.span.style.opacity = fade.toFixed(3);
    _v.x = it.world.x; _v.y = it.world.y; _v.z = it.world.z;
    // three's Vector3.project is not reachable without importing THREE; do the matrix math via the
    // camera's own projection matrix and matrixWorldInverse.
    const e = camera.matrixWorldInverse.elements;
    const p = camera.projectionMatrix.elements;
    const vx = e[0] * _v.x + e[4] * _v.y + e[8] * _v.z + e[12];
    const vy = e[1] * _v.x + e[5] * _v.y + e[9] * _v.z + e[13];
    const vz = e[2] * _v.x + e[6] * _v.y + e[10] * _v.z + e[14];
    const cw = -vz;
    if (cw <= 0.01) { it.el.style.display = "none"; continue; }
    const cx = (p[0] * vx + p[4] * vy + p[8] * vz + p[12]) / cw;
    const cy = (p[1] * vx + p[5] * vy + p[9] * vz + p[13]) / cw;
    if (cx < -1.4 || cx > 1.4 || cy < -1.4 || cy > 1.4) { it.el.style.display = "none"; continue; }
    it.el.style.display = "block";
    it.el.style.transform = `translate(${((cx * 0.5 + 0.5) * w).toFixed(1)}px, ${((-cy * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%,-50%)`;
  }
}

export function clearDamageNumbers() {
  for (const it of items) {
    it.life = 0;
    if (it.el) it.el.style.display = "none";
  }
}
