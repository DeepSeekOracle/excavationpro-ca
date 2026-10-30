/**
 * FORGE SMOKE — SHELL CASINGS (FX-02)
 *
 * Ballistic styles throw a real brass case out of the ejection port. Cases are a fixed pool of
 * meshes (TUNING.feel.casingCap) so a long burst never allocates and never grows the draw call
 * count: the oldest case is recycled when the pool wraps.
 *
 * Beam / flamer / grenade styles have no case, so `eject` is a no-op for them.
 */
import * as THREE from "three";
import { TUNING } from "./tuning.js?v=202610323p";

/** Styles that physically eject a case. Energy and thrown styles do not. */
export const BALLISTIC_STYLES = new Set([
  "spray", "pierce", "cone", "flak", "breach", "rail2",
  "burst", "spinup", "chain", "ricochet", "sentry",
]);

const GRAVITY = 9.8;

export function createCasings(scene, options = {}) {
  const cap = Math.max(1, Math.round(options.cap ?? TUNING.feel.casingCap ?? 6));
  const geo = new THREE.CylinderGeometry(0.016, 0.021, 0.07, 6);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xc9a227,
    metalness: 0.92,
    roughness: 0.34,
    emissive: 0x2a1d05,
    emissiveIntensity: 0.35,
  });

  const pool = [];
  for (let i = 0; i < cap; i += 1) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.castShadow = false;
    scene.add(mesh);
    pool.push({
      mesh,
      active: false,
      life: 0,
      maxLife: 0,
      vx: 0, vy: 0, vz: 0,
      spinX: 0, spinZ: 0,
    });
  }

  let cursor = 0;
  let ejected = 0;
  const right = new THREE.Vector3();

  /**
   * Eject one case. `pos` is the muzzle in world space, `dir` the shot direction, `styleKey` the
   * firing style. Returns true when a case was actually thrown.
   */
  function eject(pos, dir, styleKey, rng = Math.random) {
    if (!BALLISTIC_STYLES.has(styleKey)) return false;
    if (!pos || !dir) return false;

    const c = pool[cursor % pool.length];
    cursor += 1;
    ejected += 1;

    // eject to the shooter's right, plus a little lift and a little forward drag
    right.set(dir.z, 0, -dir.x);
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    right.normalize();

    c.active = true;
    c.maxLife = 0.85 + rng() * 0.5;
    c.life = c.maxLife;
    c.mesh.position.copy(pos);
    c.mesh.position.addScaledVector(right, 0.16 + rng() * 0.05);
    c.mesh.position.y += 0.03;
    c.mesh.rotation.set(0, rng() * Math.PI, 0);

    // right and down, per the acceptance: a case leaves the port sideways and falls
    const side = 1.1 + rng() * 1.1;
    c.vx = right.x * side + dir.x * 0.25;
    c.vz = right.z * side + dir.z * 0.25;
    c.vy = -0.35 - rng() * 0.5;
    c.spinX = (rng() - 0.5) * 26;
    c.spinZ = (rng() - 0.5) * 26;

    c.mesh.visible = true;
    c.mesh.scale.setScalar(1);
    return true;
  }

  /** Integrate every live case: gravity, ground bounce, tumble, expiry. */
  function update(dt) {
    if (dt <= 0) return;
    for (const c of pool) {
      if (!c.active) continue;
      c.life -= dt;
      if (c.life <= 0) {
        c.active = false;
        c.mesh.visible = false;
        continue;
      }
      c.vy -= GRAVITY * dt;
      c.mesh.position.x += c.vx * dt;
      c.mesh.position.y += c.vy * dt;
      c.mesh.position.z += c.vz * dt;
      c.mesh.rotation.x += c.spinX * dt;
      c.mesh.rotation.z += c.spinZ * dt;

      if (c.mesh.position.y <= 0.02) {
        c.mesh.position.y = 0.02;
        if (c.vy < -0.6) {
          c.vy = -c.vy * 0.32;
          c.vx *= 0.55;
          c.vz *= 0.55;
          c.spinX *= 0.4;
          c.spinZ *= 0.4;
        } else {
          c.vy = 0;
          c.vx *= 0.88;
          c.vz *= 0.88;
          c.spinX *= 0.85;
          c.spinZ *= 0.85;
        }
      }
      // last third of life: sink and shrink out rather than pop
      const fade = Math.min(1, c.life / (c.maxLife * 0.35));
      c.mesh.scale.setScalar(0.55 + 0.45 * fade);
    }
  }

  function clear() {
    for (const c of pool) {
      c.active = false;
      c.life = 0;
      c.mesh.visible = false;
    }
  }

  return {
    cap,
    eject,
    update,
    clear,
    count: () => pool.reduce((n, c) => n + (c.active ? 1 : 0), 0),
    total: () => ejected,
    pool,
  };
}
