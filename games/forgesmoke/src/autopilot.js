/**
 * FORGE SMOKE — AUTOPILOT
 *
 * The cyborg fights itself. Firing already auto-targets the nearest threat (main.js `nearest()` +
 * `shoot()`), so the pilot only owns MOVEMENT: hold a preferred engagement range, strafe to keep
 * angles changing, and break off when integrity is low. The player keeps the power-up cards.
 */

export const PILOT_PROFILE = {
  idealRange: 9.5,
  bossRange: 13.5,   // bosses are fought from further out
  bossStrafe: 1.05,     // metres it tries to hold from the current target
  strafeBias: 0.8,     // how much of the motion is tangential (orbit) vs radial (close/open)
  retreatHealth: 0.35, // below this fraction of integrity it disengages
  wanderBias: 0.25,
};

/** Pick the target the pilot cares about: nearest threat, 360°. */
export function pickTarget(state, enemyManager) {
  if (!enemyManager || !enemyManager.enemies) return null;
  // a live boss outranks everything else - that is what the run is about
  const boss = state.bossEnemy;
  if (boss && boss.hp > 0 && enemyManager.enemies.includes(boss)) return boss;
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
function lowIntegrityFor(state, profile) {
  return state.health <= (state.maxHealth || 100) * (profile.retreatHealth || 0.35);
}

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
  // bosses get their own engagement envelope: stay further out, orbit harder, keep shooting
  const isBoss = target === state.bossEnemy;
  const idealRange = isBoss ? profile.bossRange || 13.5 : profile.idealRange;
  const strafe = isBoss ? profile.bossStrafe || 1.05 : profile.strafeBias;
  const radial = Math.max(-1, Math.min(1, (dist - idealRange) / idealRange));

  // flip strafe direction on a slow sine so it arcs rather than circling one way forever
  const t = (state.pilotClock || 0) + dt;
  state.pilotClock = t;
  const strafeDir = Math.sin(t * 0.55) >= 0 ? 1 : -1;

  // during a boss telegraph, break to range instead of brawling
  if (state.bossWarning > 0 && isBoss) {
    out.mx = -nx; out.mz = -nz;
    out.mode = "dodge";
    return out;
  }
  // OBJECTIVE FIRST: a live boss, then the zone rotation. Enemies are handled by the gun; the body
  // works the objective, which is what stops the frantic circling.
  if (!isBoss) {
    const step = objectiveStep(state, dt, profile);
    out.mx = step.mx; out.mz = step.mz;
    out.mode = step.mode;
    out.zone = step.zone || null;
    out.inZone = Boolean(step.inZone);
    if (lowIntegrityFor(state, profile)) { out.mx = -nx; out.mz = -nz; out.mode = "disengage"; }
    const len2 = Math.hypot(out.mx, out.mz) || 1;
    out.mx /= len2; out.mz /= len2;
    return out;
  }

  const lowIntegrity = state.health <= (state.maxHealth || 100) * profile.retreatHealth;
  if (lowIntegrity) {
    out.mx = -nx; out.mz = -nz;                  // disengage straight back
    out.mode = "disengage";
  } else if (dist > (state.awarenessRange || 30)) {
    out.mx = nx; out.mz = nz;                    // too far to matter: close in
    out.mode = "close";
  } else {
    out.mx = nx * radial + tx * strafeDir * strafe;
    out.mz = nz * radial + tz * strafeDir * strafe;
    out.mode = dist < idealRange * 0.55 ? "open" : (isBoss ? "boss" : "hold");
  }

  const len = Math.hypot(out.mx, out.mz) || 1;
  out.mx /= len;
  out.mz /= len;
  return out;
}


/* ── OBJECTIVES ──────────────────────────────────────────────────────────────
 * The fighter is not a leaf in the wind: it works a rotation of capture zones. Stand in a zone for
 * SECURE_SECONDS to bank it, then move to the next. Combat still happens on the way (the gun fires
 * itself); this just gives the movement a reason.
 */
export const SECURE_SECONDS = 3;

export function ensureZones(state, count = 4, radius = 22) {
  if (state.objZones && state.objZones.length === count) return state.objZones;
  const zones = [];
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + 0.4;
    zones.push({ x: Math.cos(a) * radius, z: Math.sin(a) * radius, held: 0, done: false });
  }
  state.objZones = zones;
  state.objIndex = 0;
  state.objProgress = 0;
  return zones;
}

/** Returns a movement intent toward the current zone plus progress state. */
export function objectiveStep(state, dt, profile = {}) {
  const zones = ensureZones(state);
  const z = zones[state.objIndex % zones.length];
  if (!z) return { mx: 0, mz: 0, mode: "idle" };
  const dx = z.x - state.pos.x;
  const dz = z.z - state.pos.z;
  const d = Math.hypot(dx, dz) || 1;
  const inZone = d < 2.2;

  if (inZone) {
    state.objProgress = (state.objProgress || 0) + dt;
    if (state.objProgress >= SECURE_SECONDS) {
      z.done = true;
      state.objIndex = (state.objIndex + 1) % zones.length;
      state.objProgress = 0;
    }
    // inside: small orbit so it is not a statue
    const t = (state.t || 0) * 0.8;
    return { mx: Math.cos(t) * 0.25, mz: Math.sin(t) * 0.25, mode: "securing", zone: z, inZone: true };
  }
  // outside: head for the zone, with a little weave so it reads as a soldier moving, not a bee
  const weave = Math.sin((state.t || 0) * 1.7) * 0.18;
  return {
    mx: (dx / d) + (-dz / d) * weave,
    mz: (dz / d) + (dx / d) * weave,
    mode: "advance",
    zone: z,
    inZone: false,
  };
}
