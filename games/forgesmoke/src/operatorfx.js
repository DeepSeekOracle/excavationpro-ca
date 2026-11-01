/**
 * OPERATOR FX — a signature effect package for each of the four playable suits.
 *
 * The guns already throw their own light (see spawnImpact / STYLE_VFX). This module is about the
 * BODY: what the suit itself does when it stands, walks, takes a hit and scores a kill. Every
 * particle, ring and flash here is code — a canvas sprite and a bit of geometry — so there is
 * nothing to download and any suit can be re-coloured in one line.
 *
 * Four suits, four behaviours (the numbers are the personality):
 *   OLIVE     amber embers that rise and drift      — slow, warm, industrial
 *   NIGHTFALL cyan streaks that cut flat and fast    — recon, cold, precise
 *   HAZMAT    emerald fumes that hang and swell      — heavy, toxic, sluggish
 *   CRIMSON   hot red sparks that spray and die      — vanguard, violent, short
 *
 * Contract: presentation only. It reads positions, it never writes them.
 */

export const OPERATOR_FX_PRESETS = {
  olive:     { accent: 0xffb347, accentHex: "#ffb347", rate: 0.155, rise: 0.55, spread: 0.75, size: 0.22, burst: 10, ring: 0.30, label: "ember" },
  nightfall: { accent: 0x4deeea, accentHex: "#4deeea", rate: 0.100, rise: 0.10, spread: 1.25, size: 0.15, burst: 14, ring: 0.36, label: "streak" },
  hazmat:    { accent: 0x7ce6a8, accentHex: "#7ce6a8", rate: 0.190, rise: 0.30, spread: 0.95, size: 0.30, burst: 9,  ring: 0.24, label: "fume" },
  crimson:   { accent: 0xff8d95, accentHex: "#ff8d95", rate: 0.115, rise: 0.42, spread: 1.45, size: 0.19, burst: 16, ring: 0.40, label: "heat" },
};

function presetFor(skin) {
  const id = (skin && skin.id) || "olive";
  const base = OPERATOR_FX_PRESETS[id] || OPERATOR_FX_PRESETS.olive;
  /* The suit's own accent line, never its visor: CRIMSON's visor is pure white, and a white ring
     under a red exo-frame is a hole in the floor, not a signature. */
  const accentHex = (skin && skin.accentHex) || base.accentHex;
  const accent = parseInt(String(accentHex).replace("#", ""), 16);
  return {
    ...base,
    accent: Number.isFinite(accent) ? accent : base.accent,
    accentHex,
  };
}

/** A soft round sprite, built once, shared by every particle in every suit. */
function makeGlowTexture(THREE) {
  if (typeof document === "undefined") return null;
  const size = 64;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

const POOL = 30;

export function createOperatorFx({ THREE, scene, skin, parent = null }) {
  if (!THREE || !scene) {
    return { setSkin() {}, update() {}, hit() {}, kill() {}, state: () => ({}) };
  }
  let preset = presetFor(skin);
  const glow = makeGlowTexture(THREE);

  /* The plinth ring: the suit's colour, breathing under its feet. It is the cheapest way to make a
     character belong to a player rather than to the level. */
  const ringMat = new THREE.MeshBasicMaterial({
    color: preset.accent,
    transparent: true,
    opacity: preset.ring,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.56, 44), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.035;
  ring.userData.tag = "operator-ring";
  ring.renderOrder = 3;
  (parent || scene).add(ring);

  const parts = [];
  for (let i = 0; i < POOL; i += 1) {
    const mat = new THREE.SpriteMaterial({
      map: glow,
      color: preset.accent,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    sprite.scale.setScalar(0.2);
    sprite.userData.tag = "operator-spark";
    sprite.renderOrder = 4;
    (parent || scene).add(sprite);
    parts.push({ sprite, life: 0, maxLife: 1, vx: 0, vy: 0, vz: 0, size: 0.2, hot: false });
  }

  let cursor = 0;
  let emitAcc = 0;
  let ringPulse = 0;
  let lastSkinId = (skin && skin.id) || "olive";
  /* Movement is read from the body itself, not from a flag somewhere else in the game: a frame's
     delta over one frame at any speed is the only signal this layer actually needs. */
  let lastX = null, lastZ = null;
  const tmp = new THREE.Vector3();

  /* The title and the results screens are their own pictures. A suit effect that keeps breathing
     under a menu is the one thing that reads as a bug rather than as juice. */
  let active = true;

  function spawn(x, y, z, opts = {}) {
    const p = parts[cursor % parts.length];
    cursor += 1;
    const lift = opts.lift ?? preset.rise;
    const sp = opts.speed ?? (0.6 + Math.random() * preset.spread);
    const a = Math.random() * Math.PI * 2;
    p.sprite.position.set(x + (Math.random() - 0.5) * 0.22, y + Math.random() * 0.18, z + (Math.random() - 0.5) * 0.22);
    p.sprite.material.color.setHex(opts.hot ? 0xffffff : preset.accent);
    p.sprite.material.opacity = 0.95;
    p.sprite.visible = true;
    p.life = opts.life ?? (0.28 + Math.random() * 0.26);
    p.maxLife = p.life;
    p.vx = Math.cos(a) * sp * 0.45;
    p.vz = Math.sin(a) * sp * 0.45;
    p.vy = lift * (0.7 + Math.random() * 0.8) + (opts.vy || 0);
    p.size = opts.size ?? preset.size * (0.7 + Math.random() * 0.6);
    p.hot = !!opts.hot;
    p.sprite.scale.setScalar(p.size);
    return p;
  }

  const api = {
    /** On while the fight is live, off for every menu. Particles already in the air still decay. */
    setActive(on) {
      active = !!on;
      ring.visible = active;
      if (!active) emitAcc = 0;
    },

    /** Recolour everything for a suit. Safe to call every frame; it no-ops unless the id changed. */
    setSkin(next) {
      if (!next || next.id === lastSkinId) return false;
      lastSkinId = next.id;
      preset = presetFor(next);
      ringMat.color.setHex(preset.accent);
      for (const p of parts) p.sprite.material.color.setHex(preset.accent);
      return true;
    },

    /** A blow landed on the operator. */
    hit(pos, power = 1) {
      if (!pos) return;
      const n = Math.round(preset.burst * 0.7 * Math.min(1.4, 0.7 + power * 0.5));
      for (let i = 0; i < n; i += 1) {
        spawn(pos.x, (pos.y || 0) + 1.05, pos.z, { hot: i < 2, life: 0.24 + Math.random() * 0.2, speed: 1.4 });
      }
      ringPulse = Math.max(ringPulse, 0.55);
    },

    /** The operator scored a kill: the suit answers. */
    kill(pos) {
      if (!pos) return;
      for (let i = 0; i < preset.burst; i += 1) {
        spawn(pos.x, (pos.y || 0) + 1.1, pos.z, { hot: i < 3, life: 0.34 + Math.random() * 0.3, speed: 2.2, size: preset.size * 1.15 });
      }
      ringPulse = 1;
    },

    /**
     * Per frame. pos = the operator's position, moving = is it walking, hp/maxHp for the low-health
     * ember trickle. Real seconds.
     */
    update(dt, opts = {}) {
      const pos = opts.pos;
      const d = Math.min(0.05, Math.max(0.001, dt || 0.016));
      let moving = false;
      if (pos) {
        if (lastX !== null) {
          const dx = pos.x - lastX, dz = pos.z - lastZ;
          moving = (dx * dx + dz * dz) > 0.0004;
        }
        lastX = pos.x; lastZ = pos.z;
      }
      if (ringPulse > 0) ringPulse = Math.max(0, ringPulse - d * 2.2);

      if (pos && active) {
        ring.position.set(pos.x, 0.035, pos.z);
        const breathe = 0.5 + 0.5 * Math.sin((globalThis.performance?.now?.() || 0) / 620);
        const low = opts.maxHp > 0 && opts.hp / opts.maxHp < 0.3;
        ringMat.opacity = preset.ring * 0.72 * (0.55 + breathe * 0.45) + ringPulse * 0.42 + (low ? 0.10 : 0);
        const pulseScale = 1 + ringPulse * 0.35 + (moving ? 0.06 : 0);
        ring.scale.setScalar(pulseScale);

        /* emission: a trail when it moves, a slow ember when it stands, faster when it is hurt */
        emitAcc += d;
        const cadence = (moving ? preset.rate : preset.rate * 2.8) / (low ? 2.2 : 1);
        if (emitAcc >= cadence) {
          emitAcc = 0;
          spawn(pos.x, 0.08 + (moving ? 0.12 : 0.02), pos.z, { size: preset.size * (moving ? 0.85 : 0.6) });
          if (moving && preset.label === "streak") {
            spawn(pos.x, 0.35, pos.z, { life: 0.2, speed: 0.4, lift: 0.02, size: preset.size * 0.7 });
          }
        }
      }

      for (const p of parts) {
        if (p.life <= 0) continue;
        p.life -= d;
        if (p.life <= 0) { p.sprite.visible = false; continue; }
        p.vy += (preset.label === "fume" ? 0.6 : preset.label === "heat" ? -0.3 : 0.15) * d;
        p.sprite.position.x += p.vx * d;
        p.sprite.position.y += p.vy * d;
        p.sprite.position.z += p.vz * d;
        p.vx *= 1 - 1.6 * d;
        p.vz *= 1 - 1.6 * d;
        const k = p.life / p.maxLife;
        p.sprite.material.opacity = Math.max(0, k * 0.9);
        p.sprite.scale.setScalar(p.size * (0.45 + k * 0.9));
      }
    },

    state: () => ({
      skin: lastSkinId,
      preset: preset.label,
      accent: preset.accentHex,
      live: parts.filter((p) => p.life > 0).length,
      ring: +ringMat.opacity.toFixed(3),
    }),
  };
  return api;
}
