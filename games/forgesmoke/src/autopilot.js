/**
 * FORGE SMOKE — AUTOPILOT
 *
 * The cyborg fights itself. Firing already auto-targets the nearest threat (main.js `nearest()` +
 * `shoot()`), so the pilot only owns MOVEMENT: hold a preferred engagement range, strafe to keep
 * angles changing, and break off when integrity is low. The player keeps the power-up cards.
 */

export const PILOT_PROFILE = {
  idealRange: 9.5,     // metres it tries to hold from the current target
  strafeBias: 0.8,     // how much of the motion is tangential (orbit) vs radial (close/open)
  retreatHealth: 0.35, // below this fraction of integrity it disengages
  wanderBias: 0.25,
};

/** Pick the target the pilot cares about: nearest threat, 360°. */
export function pickTarget(state, enemyManager) {
  if (!enemyManager || !enemyManager.enemies) return null;
  if (typeof enemyManager.findNearest === "function") {
    return enemyManager.findNearest(state.pos, state.yaw, 42, Math.PI * 2) || null;
  }
  let best = null, bestD = Infinity;
  for (const e of enemyManager.enemies) {
    if (!e || !e.mesh || e.dead) continue;
    const d = Math.hypot(e.mesh.position.x - state.pos.x, e.mesh.position.z - state.pos.z);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

/**
 * Compute this frame's movement intent. Returns a normalised {mx, mz} world vector plus diagnostics
 * the manager/HUD can show ("RANGE", "STRAFE", "DISENGAGE").
 */
export function pilot(state, enemyManager, dt, profile = PILOT_PROFILE) {
  const out = { mx: 0, mz: 0, mode: "hold", target: null, distance: Infinity };
  const target = pickTarget(state, enemyManager);
  if (!target || !target.mesh) {
    // no threat: drift back toward the arena centre so it is never parked against a wall
    const r = Math.hypot(state.pos.x, state.pos.z) || 1;
    out.mx = -state.pos.x / r * profile.wanderBias;
    out.mz = -state.pos.z / r * profile.wanderBias;
    out.mode = "patrol";
    return out;
  }
  out.target = target;

  const dx = target.mesh.position.x - state.pos.x;
  const dz = target.mesh.position.z - state.pos.z;
  const dist = Math.hypot(dx, dz) || 0.0001;
  out.distance = dist;
  const nx = dx / dist, nz = dz / dist;
  const tx = -nz, tz = nx;                       // tangent (perpendicular) for orbiting

  // radial term: positive closes the gap, negative opens it
  const radial = Math.max(-1, Math.min(1, (dist - profile.idealRange) / profile.idealRange));

  // flip strafe direction on a slow sine so it arcs rather than circling one way forever
  const t = (state.pilotClock || 0) + dt;
  state.pilotClock = t;
  const strafeDir = Math.sin(t * 0.55) >= 0 ? 1 : -1;

  const lowIntegrity = state.health <= (state.maxHealth || 100) * profile.retreatHealth;
  if (lowIntegrity) {
    out.mx = -nx; out.mz = -nz;                  // disengage straight back
    out.mode = "disengage";
  } else if (dist > (state.awarenessRange || 30)) {
    out.mx = nx; out.mz = nz;                    // too far to matter: close in
    out.mode = "close";
  } else {
    out.mx = nx * radial + tx * strafeDir * profile.strafeBias;
    out.mz = nz * radial + tz * strafeDir * profile.strafeBias;
    out.mode = dist < profile.idealRange * 0.55 ? "open" : "hold";
  }

  const len = Math.hypot(out.mx, out.mz) || 1;
  out.mx /= len;
  out.mz /= len;
  return out;
}
