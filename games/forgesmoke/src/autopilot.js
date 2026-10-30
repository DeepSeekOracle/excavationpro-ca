/**
 * FORGE SMOKE — AUTOPILOT (tactical movement)
 *
 * The cyborg fights itself; this file decides how it moves. Earlier versions strafed non-stop at a
 * near-constant throttle, which read as a glitchy treadmill. This one fights in beats:
 *
 *   HOLD        stand, face the target, let the gun work (throttle 0)
 *   REPOSITION  a 0.6 s dash to a new angle, then plant again
 *   ADVANCE     close the gap when the target is outside the preferred envelope
 *   BACKOFF     open the gap when it is too close
 *   RETREAT     low integrity: put distance between you and the threat
 *   DODGE       boss telegraph: break to range for the warning window
 *
 * The renderer smooths the resulting velocity (critically damped), so starts and stops are eased
 * instead of snapped. Movement is episodic on purpose: a fighter that stands and fires reads as
 * deliberate, and it keeps the body off the "always sprinting" treadmill.
 */

export const PILOT_PROFILE = {
  idealRange: 9.5,
  bossRange: 13.5,
  bossStrafe: 1.05,
  retreatHealth: 0.35,
  separationRadius: 3.1,
  separationWeight: 0.85,
  // tactical beat
  // A fighter that plants for 1.4-2.7 s at a time read as frozen: the arena is only 30 m across,
  // so the whole fight can happen while the body is standing still. Shorter holds keep the
  // silhouette alive without turning it into a treadmill.
  holdMin: 0.55,
  holdMax: 1.15,
  dashSeconds: 0.48,
  dashThrottle: 0.62,
  repositionDeg: 52,
  advanceThrottle: 0.44,
  backoffThrottle: 0.4,
  retreatThrottle: 0.8,
  dodgeThrottle: 1.0,
  patrolThrottle: 0.32,
};

/** Pick the target: a live boss outranks everything, then the nearest threat in 360°. */
export function pickTarget(state, enemyManager) {
  if (!enemyManager || !enemyManager.enemies) return null;
  const boss = state.bossEnemy;
  if (boss && boss.hp > 0 && enemyManager.enemies.includes(boss)) return boss;
  if (typeof enemyManager.findNearest === "function") {
    return enemyManager.findNearest(state.pos, state.yaw, 42, Math.PI * 2) || null;
  }
  let best = null;
  let bestD = Infinity;
  for (const e of enemyManager.enemies) {
    if (!e || !e.mesh || e.dead) continue;
    const d = Math.hypot(e.mesh.position.x - state.pos.x, e.mesh.position.z - state.pos.z);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

/** Push away from bodies inside `radius`; only used while actually moving. */
export function separation(state, enemyManager, radius = PILOT_PROFILE.separationRadius) {
  const out = { x: 0, z: 0, n: 0 };
  for (const e of enemyManager?.enemies || []) {
    if (!e || !e.mesh || e.hp <= 0) continue;
    const dx = state.pos.x - e.mesh.position.x;
    const dz = state.pos.z - e.mesh.position.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.001 && d < radius) {
      const w = (radius - d) / radius;
      out.x += (dx / d) * w;
      out.z += (dz / d) * w;
      out.n += 1;
    }
  }
  const len = Math.hypot(out.x, out.z) || 1;
  return { x: out.x / len, z: out.z / len, n: out.n };
}

function lowIntegrityFor(state, profile) {
  return state.health <= (state.maxHealth || 100) * (profile.retreatHealth || 0.35);
}

/**
 * Bounding movement for the non-tactical modes: a short push, then a pause to shoot.
 * Returns true when the body should move this frame. Reset whenever the mode changes.
 */
function beat(state, mode, moveSec, holdMin, holdMax) {
  if (state.pilotBeatMode !== mode) {
    state.pilotBeatMode = mode;
    state.pilotMoving = true;
    state.pilotTimer = moveSec;
  }
  if (state.pilotMoving) {
    if (state.pilotTimer <= 0) {
      state.pilotMoving = false;
      state.pilotTimer = holdMin + Math.random() * (holdMax - holdMin);
    }
    return state.pilotMoving;
  }
  if (state.pilotTimer <= 0) {
    state.pilotMoving = true;
    state.pilotTimer = moveSec;
  }
  return state.pilotMoving;
}

function resetBeat(state) {
  state.pilotMoving = false;
  state.pilotTimer = 0.35 + Math.random() * 0.4;
}

/**
 * MGR-07: how the pilot adapts to each archetype. Range is the preferred standoff; the shield is
 * special-cased into a flank because its wall only covers the front arc.
 */
const ARCHETYPE_RANGE = {
  rifleman: 9.5,
  sapper: 6.5,
  shieldbearer: 5,
  spotter: 10,
  drone: 11.5,
  mortar: 4.5,
  mech: 11,
  gunship: 13.5,
};

/**
 * Movement intent for this frame.
 * @returns {{mx:number,mz:number,mode:string,throttle:number,wantsMove:boolean,distance:number,target:any}}
 */
export function pilot(state, enemyManager, dt, profile = PILOT_PROFILE) {
  const out = { mx: 0, mz: 0, mode: "hold", throttle: 0, wantsMove: false, target: null, distance: Infinity };
  const target = pickTarget(state, enemyManager);

  if (!target || !target.mesh) {
    const goal = state.pickupGoal;
    if (goal) {
      const gx = goal.x - state.pos.x;
      const gz = goal.z - state.pos.z;
      const gl = Math.hypot(gx, gz) || 1;
      out.mx = gx / gl;
      out.mz = gz / gl;
      out.mode = "fetch-" + goal.type;
      out.throttle = 0.95;
      out.wantsMove = true;
      return out;
    }
    // nothing to fight: wander back toward the middle at a walk, not a sprint
    const r = Math.hypot(state.pos.x, state.pos.z) || 1;
    out.mx = -state.pos.x / r;
    out.mz = -state.pos.z / r;
    out.mode = "patrol";
    out.throttle = profile.patrolThrottle || 0.32;
    out.wantsMove = true;
    return out;
  }
  out.target = target;
  out.targetX = target.mesh.position.x;
  out.targetZ = target.mesh.position.z;

  const dx = target.mesh.position.x - state.pos.x;
  const dz = target.mesh.position.z - state.pos.z;
  const dist = Math.hypot(dx, dz) || 0.0001;
  out.distance = dist;
  const nx = dx / dist;
  const nz = dz / dist;
  const tx = -nz;
  const tz = nx;

  const isBoss = target === state.bossEnemy;
  // MGR-07: standoff depends on what is being fought — mortars get rushed, drones get space,
  // shields get circled. Bosses keep their own envelope.
  const idealRange = isBoss
    ? (profile.bossRange || 13.5)
    : (ARCHETYPE_RANGE[target.type] ?? profile.idealRange ?? 9.5);
  const closeRange = idealRange * 0.55;
  const farRange = idealRange * 1.35;

  // keep the beat clock running only in the tactical (hold/reposition) branch
  state.pilotTimer = (state.pilotTimer ?? 0.4) - dt;

  let dirX = 0;
  let dirZ = 0;
  let mode;
  let throttle = 0;

  if (state.bossWarning > 0 && isBoss) {
    // break to range: away plus a tangent so it is a cut, not a straight sprint
    dirX = -nx + tx * 0.45;
    dirZ = -nz + tz * 0.45;
    mode = "dodge";
    throttle = profile.dodgeThrottle || 1;
    resetBeat(state);
  } else if (state.incomingShot) {
    // a bolt is on a collision course: step perpendicular to it, hard, for as long as it threatens
    dirX = state.incomingShot.x;
    dirZ = state.incomingShot.z;
    mode = "dodge-shot";
    throttle = 0.85;
    state.pilotBeatMode = null;
  } else if (state.pickupGoal && (state.pickupCooldown || 0) <= 0
    && (state.pickupGoal.type === "health" || !target)) {
    // Pickups are a detour, not a treadmill: health wins whenever integrity is low, power/speed only
    // when there is no live target to fight. Without this the pilot ran 230 m per minute and never
    // held an angle — the tactical beats never got a chance to play.
    // META PRIORITY: health if hurt, then power, then speed (choosePickup already ordered them)
    const g = state.pickupGoal;
    const gx = g.x - state.pos.x;
    const gz = g.z - state.pos.z;
    const gl = Math.hypot(gx, gz) || 1;
    dirX = gx / gl;
    dirZ = gz / gl;
    mode = "fetch-" + g.type;
    throttle = 0.95;
    state.pilotBeatMode = null;
  } else if (lowIntegrityFor(state, profile)) {
    dirX = -nx;
    dirZ = -nz;
    mode = "retreat";
    // bounding retreat: 0.8 s of movement, half a second to shoot back
    throttle = beat(state, "retreat", 0.7, 0.4, 0.6) ? (profile.retreatThrottle || 0.8) : 0;
  } else if (target.type === "shieldbearer" && target.isShielded) {
    // MGR-07: the wall only covers the front arc. Close first, then circle it until the shield is
    // no longer facing the gun. This is the archetype that forces a movement decision, not DPS.
    state.pilotBeatMode = null;
    if (dist > 6) {
      dirX = nx;
      dirZ = nz;
      mode = "advance";
      throttle = 0.6;
    } else {
      const sign = state.flankSign || 1;
      dirX = tx * sign + nx * 0.1;
      dirZ = tz * sign + nz * 0.1;
      mode = "flank";
      throttle = 0.72;
    }
  } else if (dist > farRange) {
    dirX = nx;
    dirZ = nz;
    mode = "advance";
    // bounding advance for most targets; a mortar/sapper gets a committed rush (their design is to
    // keep range, so a stop-start walk never closes the gap)
    const rush = target.type === "mortar" || target.type === "sapper";
    throttle = (rush || beat(state, "advance", 0.8, 0.75, 1.2)) ? (profile.advanceThrottle || 0.55) : 0;
  } else if (dist < closeRange) {
    dirX = -nx;
    dirZ = -nz;
    mode = "backoff";
    throttle = beat(state, "backoff", 0.5, 0.9, 1.2) ? (profile.backoffThrottle || 0.45) : 0;
  } else {
    state.pilotBeatMode = null;
    // the tactical beat: plant and fire, then dash to a new angle
    if (state.pilotMoving) {
      const sign = state.pilotStrafe || 1;
      const rad = (profile.repositionDeg || 52) * (Math.PI / 180);
      dirX = nx * Math.sin(rad) * 0.35 + tx * sign;
      dirZ = nz * Math.sin(rad) * 0.35 + tz * sign;
      mode = "reposition";
      throttle = profile.dashThrottle || 0.62;
      if (state.pilotTimer <= 0) {
        state.pilotMoving = false;
        state.pilotTimer = (profile.holdMin || 1.05) + Math.random() * ((profile.holdMax || 2.35) - (profile.holdMin || 1.05));
      }
    } else {
      mode = "hold";
      throttle = 0;
      if (state.pilotTimer <= 0) {
        state.pilotMoving = true;
        state.pilotTimer = profile.dashSeconds || 0.62;
        state.pilotStrafe = -(state.pilotStrafe || 1);
      }
    }
  }

  if (throttle > 0) {
    const sep = separation(state, enemyManager, profile.separationRadius || 2.5);
    if (sep.n) {
      dirX += sep.x * (profile.separationWeight || 0.55);
      dirZ += sep.z * (profile.separationWeight || 0.55);
    }
    const len = Math.hypot(dirX, dirZ);
    if (len < 1e-6) {
      dirX = nx;
      dirZ = nz;
    } else {
      dirX /= len;
      dirZ /= len;
    }
    out.mx = dirX;
    out.mz = dirZ;
    out.throttle = throttle;
    out.wantsMove = true;
  } else {
    // hold: no command, the renderer eases the body to a stop
    out.mx = 0;
    out.mz = 0;
    out.throttle = 0;
    out.wantsMove = false;
  }

  out.mode = mode;
  return out;
}
