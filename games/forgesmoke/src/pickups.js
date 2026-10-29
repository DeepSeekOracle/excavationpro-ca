/**
 * FORGE SMOKE — PICKUPS (meta-game ground items)
 *
 * Three ground items that auto-apply on touch and stack:
 *   health  +50 % max integrity, delivered as a 10 s regen tick
 *   speed   +25 % move speed for 12 s (stacks; one buff already beats the base-speed health gap)
 *   power   +25 % weapon damage for 12 s (stacks)
 *
 * Spacing rule (the math the design asks for): base speed is 6.4 m/s, so in 10 s the operator covers
 * 64 m. The two health sites sit on opposite ends of a 34 m ring — 68 m apart — which is 10.6 s at
 * base speed (unreachable inside the 10 s window) and 8.5 s with one speed buff (reachable). That is
 * exactly the intended "you need a boost to chain health".
 *
 * Items respawn 60 s after they are taken, for the whole match.
 */

export const BASE_SPEED = 6.4;
export const HEALTH_GAP_SECONDS = 10;

export const PICKUP_DEFS = {
  health: { color: 0x7ce6a8, glyph: "+", regen: 0.5, seconds: 10, label: "INTEGRITY" },
  speed: { color: 0x6fe3ff, glyph: ">", speedMult: 0.25, seconds: 12, label: "SPEED" },
  power: { color: 0xffb347, glyph: "*", powerMult: 0.25, seconds: 12, label: "POWER" },
};

const HEALTH_RADIUS = 34;       // opposite ends -> 68 m apart
const HEALTH_MIN_GAP = BASE_SPEED * HEALTH_GAP_SECONDS;      // 64 m
const HEALTH_MAX_GAP = BASE_SPEED * 1.25 * HEALTH_GAP_SECONDS; // 80 m (one speed buff reaches it)
export const HEALTH_SPACING = {
  radius: HEALTH_RADIUS,
  gap: HEALTH_RADIUS * 2,
  minGap: HEALTH_MIN_GAP,
  maxGap: HEALTH_MAX_GAP,
  baseSeconds: (HEALTH_RADIUS * 2) / BASE_SPEED,
  boostedSeconds: (HEALTH_RADIUS * 2) / (BASE_SPEED * 1.25),
};

/** Multipliers from stacked buffs (bounded so ten pickups do not break the game). */
export function speedMultiplier(stacks) {
  return Math.min(1.9, 1 + PICKUP_DEFS.speed.speedMult * Math.max(0, stacks));
}
export function powerMultiplier(stacks) {
  return Math.min(2.0, 1 + PICKUP_DEFS.power.powerMult * Math.max(0, stacks));
}

/**
 * Plan the opening sites. `blocked(x, z)` returns true when a site sits inside cover.
 * Health sites are always opposite each other; the rest are random with a minimum spacing.
 */
export function planPickupSites({ rng = Math.random, blocked = () => false, arenaRadius = 54 } = {}) {
  const sites = [];
  const trySite = (type, angle, radius) => {
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (blocked(x, z)) return null;
    if (Math.hypot(x, z) > arenaRadius - 4) return null;
    return { type, x, z, angle, radius };
  };
  const a0 = rng() * Math.PI * 2;
  let guard = 0;
  while (sites.length < 2 && guard < 40) {
    const site = trySite("health", a0 + (sites.length ? Math.PI : 0), HEALTH_RADIUS - guard * 0.5);
    if (site) sites.push(site);
    guard += 1;
  }
  const place = (type, minSep) => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const angle = rng() * Math.PI * 2;
      const radius = 18 + rng() * 22;
      const site = trySite(type, angle, radius);
      if (!site) continue;
      if (sites.some((s) => Math.hypot(s.x - site.x, s.z - site.z) < minSep)) continue;
      sites.push(site);
      return true;
    }
    return false;
  };
  // guaranteed counts: try generous spacing first, then relax so the layout always has all 8 items
  for (const type of ["power", "power", "power", "speed", "speed", "speed"]) {
    if (place(type, 18)) continue;
    if (place(type, 12)) continue;
    place(type, 6);
  }
  return sites;
}

/** Priority for the pilot: health if hurt, then power, then speed — nearest of that type. */
export function choosePickup(sites, healthRatio, { needHealthAt = 0.75, x = 0, z = 0 } = {}) {
  const alive = (sites || []).filter((s) => s.alive !== false);
  if (!alive.length) return null;
  const nearest = (list) => (list.length
    ? list.reduce((best, s) => (Math.hypot(s.x - x, s.z - z) < Math.hypot(best.x - x, best.z - z) ? s : best))
    : null);
  if (healthRatio < needHealthAt) {
    const h = nearest(alive.filter((s) => s.type === "health"));
    if (h) return h;
  }
  const power = nearest(alive.filter((s) => s.type === "power"));
  if (power) return power;
  return nearest(alive.filter((s) => s.type === "speed"));
}

/** Validate a layout against the spacing rule (used by tests and the boot assertion). */
export function validateSites(sites) {
  const health = sites.filter((s) => s.type === "health");
  const problems = [];
  if (health.length < 2) problems.push("needs two health sites");
  if (health.length >= 2) {
    const gap = Math.hypot(health[0].x - health[1].x, health[0].z - health[1].z);
    if (gap < HEALTH_MIN_GAP) problems.push(`health gap ${gap.toFixed(1)} m < ${HEALTH_MIN_GAP} m (reachable in 10 s)`);
    if (gap > HEALTH_MAX_GAP) problems.push(`health gap ${gap.toFixed(1)} m > ${HEALTH_MAX_GAP} m (unreachable even boosted)`);
  }
  return { ok: problems.length === 0, problems, healthGap: health.length >= 2 ? Math.hypot(health[0].x - health[1].x, health[0].z - health[1].z) : null };
}
