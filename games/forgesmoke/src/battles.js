/**
 * FORGE SMOKE — TRIALS ENGINE (BONK-style resolution)
 *
 * A deterministic auto-battler: your cyborg is resolved against a boss in whole rounds, numbers
 * first, animation second. The same seed always produces the same fight, so a "you should have won"
 * argument can be settled by replaying it.
 *
 * Bosses are meant to be hard and legible: each one punishes a different lazy build.
 *   WARDEN   — heavy armour: needs crit or armour pierce
 *   COLOSSUS — frontal shield: needs explosives / shield pierce
 *   HIVE     — spawns adds: needs sustained DPS, not burst
 */

export const BOSSES = [
  {
    id: "warden", name: "FOUNDRY WARDEN", hp: 900, armor: 120, damage: 22, rate: 1.0,
    mechanic: "armor", reward: 4, rig: "mech",
    blurb: "Plated in reclaimed hull steel. Small arms glance off; crits find the seams.",
  },
  {
    id: "colossus", name: "SCRAP COLOSSUS", hp: 1250, armor: 90, damage: 30, rate: 0.9,
    mechanic: "shield", shield: 0.82, reward: 5, rig: "robot-rig",
    blurb: "Carries a riot wall. Frontal fire is wasted — go over it with explosives.",
  },
  {
    id: "hive", name: "DRONE HIVE", hp: 1050, armor: 60, damage: 14, rate: 1.2,
    mechanic: "adds", addRate: 0.06, addDamage: 5, reward: 6, rig: "drone",
    blurb: "Launches a new drone every round. Burst builds drown; sustained builds grind it out.",
  },
];

/** Deterministic RNG (mulberry32). */
export function rngFrom(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Turn the profile + talent modifiers into a fighter.
 * `mods` is the object from talents.toRunMods().
 */
export function makeFighter(profile = {}, mods = {}, talents = []) {
  const level = Math.max(1, profile.level || 1);
  const hp = Math.round((380 + level * 45) * (mods.hpMult || 1) * (0.6 + 0.4 * (mods.armorMult || 1)));
  const baseDmg = 30 + level * 3.2;
  return {
    name: profile.name || "OPERATOR",
    hp,
    maxHp: hp,
    damage: baseDmg * (mods.damageMult || 1),
    rate: 2.2 * (mods.rateMult || 1),
    crit: Math.min(0.75, 0.05 + (mods.critAdd || 0)),
    armor: Math.round(20 + level * 2 * (mods.armorMult || 1)),
    shieldPierce: mods.shieldPierce || 0,
    blastMult: mods.blastMult || 1,
    ownDamageMult: mods.damageMult || 1,
    talentCount: Array.isArray(talents) ? talents.length : 0,
  };
}

/** One fight, round by round. Returns the full transcript. */
export function simulate(fighter, boss, seed = 20261029) {
  const rng = rngFrom(seed);
  const log = [];
  let php = fighter.hp;
  let bhp = boss.hp;
  let adds = 0;
  const rounds = [];

  // armour is a fraction of the hit, so a low-level cyborg still scratches a heavy target
  const armourSoak = (raw, armor) => raw * Math.max(0.30, 1 - armor / (armor + 260));
  const shieldFactor = boss.mechanic === "shield" ? 1 - (boss.shield || 0) : 1;

  for (let r = 1; r <= 80; r += 1) {
    // ── player volley ────────────────────────────────────────────────────────
    let dealt = 0;
    let crits = 0;
    const swings = Math.max(1, Math.round(fighter.rate));
    for (let s = 0; s < swings; s += 1) {
      const isCrit = rng() < fighter.crit;
      let dmg = fighter.damage * (0.9 + rng() * 0.2);
      if (isCrit) { dmg *= 1.9; crits += 1; }
      if (boss.mechanic === "armor") dmg = armourSoak(dmg, boss.armor) * (isCrit ? 1.35 : 1);
      if (boss.mechanic === "shield") {
        // explosives are the intended answer; shieldPierce 0.5+ opens it wide
        const opened = Math.min(1, fighter.shieldPierce / 0.5);
        dmg *= shieldFactor + (1 - shieldFactor) * opened;
      }
      if (boss.mechanic === "adds") dmg *= 0.96;
      dealt += dmg;
    }
    bhp -= dealt;

    // ── boss volley ──────────────────────────────────────────────────────────
    let taken = 0;
    const bossSwings = Math.max(1, Math.round(boss.rate));
    for (let s = 0; s < bossSwings; s += 1) {
      const raw = boss.damage * (0.9 + rng() * 0.2);
      taken += raw * Math.max(0.30, 1 - fighter.armor / (fighter.armor + 240));
    }
    if (boss.mechanic === "adds") {
      adds += 1;
      taken += adds * (boss.addDamage || 8);
    }
    php -= taken;

    rounds.push({
      round: r,
      dealt: Math.round(dealt),
      taken: Math.round(taken),
      crits,
      bossHp: Math.max(0, Math.round(bhp)),
      playerHp: Math.max(0, Math.round(php)),
    });
    log.push(`R${String(r).padStart(2, "0")}  you ${Math.round(dealt).toLocaleString()} dmg${crits ? ` (${crits} crit)` : ""}  ·  ${boss.name} ${Math.round(taken).toLocaleString()} dmg${boss.mechanic === "adds" ? ` (${adds} drones)` : ""}`);

    if (bhp <= 0 || php <= 0) break;
  }

  const won = bhp <= 0 && php > 0;
  return {
    won,
    rounds: rounds.length,
    bossHpLeft: Math.max(0, Math.round(bhp)),
    playerHpLeft: Math.max(0, Math.round(php)),
    playerMaxHp: fighter.maxHp,
    bossMaxHp: boss.hp,
    log,
    roundsData: rounds,
    reward: won ? boss.reward : Math.max(1, Math.floor(boss.reward / 2)),
    seed,
  };
}

/** Rough DPS readout for the trials card, so a loss is explainable before you take it. */
export function estimateDps(fighter, boss) {
  const swings = Math.max(1, Math.round(fighter.rate));
  const critMult = 1 + fighter.crit * 0.9;
  let perHit = fighter.damage * critMult;
  if (boss.mechanic === "armor") perHit *= Math.max(0.30, 1 - boss.armor / (boss.armor + 260)) * 1.15;
  if (boss.mechanic === "shield") {
    const opened = Math.min(1, fighter.shieldPierce / 0.5);
    perHit *= (1 - (boss.shield || 0)) + (boss.shield || 0) * opened;
  }
  return Math.round(perHit * swings);
}
