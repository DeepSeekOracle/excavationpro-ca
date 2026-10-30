/**
 * Balance formulas — pure functions, no side effects.
 * All tuning values come from tuning.js.
 */

import { TUNING } from "./tuning.js?v=202610324e";

/** Armour damage reduction: r = A / (A + 100), capped at 37.5% (A=60). */
export function damageAfterArmour(rawDamage, armour) {
  const A = Math.max(0, Math.min(60, armour));
  const reduction = A / (A + 100);
  const effective = Math.max(1, Math.round(rawDamage * (1 - reduction)));
  return effective;
}

/**
 * Shield gate - the single source of truth for "did that shot get through?".
 * The shieldbearer's wall tracks the player, so ordinary fire does nothing; explosive rounds punch
 * `pierce` (0..1) of the damage through; a lobbed grenade (flanked) lands in full.
 */
export function shieldGate(damage, { shielded = false, flanked = false, pierce = 0, armour = 0 } = {}) {
  if (!shielded || flanked) return damageAfterArmour(damage, armour);
  if (pierce > 0) return damageAfterArmour(damage * pierce, armour);
  return 0;
}

/**
 * Boss HP for a run. Level 1 reproduces the old live formula exactly (base*2 + 2600); each player
 * level above 1 adds 15% of the base, so a boss stays a boss as the cyborg grows.
 */
export function bossHp(baseHp, level = 1) {
  const steps = Math.max(0, (Number(level) || 1) - 1);
  return Math.round(baseHp * (2 + 0.15 * steps) + 2600);
}

/** Shots needed and seconds to kill, using the same armour model as live combat. */
export function timeToKill(weapon, hp, armour = 0) {
  const perShot = damageAfterArmour(weapon.damage, armour);
  if (perShot <= 0) return Infinity;
  return Math.ceil(hp / perShot) * weapon.cycle;
}

/** Enemy HP at time t (minutes): HP_E0 * (1 + 0.18 * t). No cap. */
export function enemyHpAt(baseHp, tMinutes) {
  const mult = TUNING.difficulty.hpMult ?? 1;
  return baseHp * mult * (1 + TUNING.difficulty.hpScaling * tMinutes);
}

/** Enemy speed at time t (minutes): v_E0 * min(1.45, 1 + 0.05 * t). */
export function enemySpeedAt(baseSpeed, tMinutes) {
  const mult = Math.min(TUNING.difficulty.speedCap, 1 + TUNING.difficulty.speedScaling * tMinutes);
  return baseSpeed * mult;
}

/** Score formula: (kills * 12 + damage * 0.12 + seconds * 6) * multiplier. */
export function score(kills, damage, seconds, multiplier) {
  return (kills * TUNING.scoring.killScore + damage * TUNING.scoring.damageScoreMult + seconds * TUNING.scoring.timeScore) * multiplier;
}

/** Multiplier: 1 + 0.1 * blackouts + 0.08 * evolutions + 0.05 * airdrops, clamped [1, 3]. */
export function multiplier(blackoutsSurvived, evolutions, airdropsTaken) {
  const m = 1 +
    TUNING.scoring.multiplier.perBlackout * blackoutsSurvived +
    TUNING.scoring.multiplier.perEvolution * evolutions +
    TUNING.scoring.multiplier.perAirdrop * airdropsTaken;
  return Math.max(TUNING.scoring.multiplier.base, Math.min(TUNING.scoring.multiplier.cap, m));
}

/**
 * XP required to advance out of level L: base * L * (L + 1) / 2 — a triangular curve.
 * L1 300, L2 900, L3 1800, L4 3000, L5 4500. Linear thresholds handed out 13 cards in a 3-minute
 * run (TUNE before-table); triangular lands a full run at 3-5.
 */
export function xpThreshold(level) {
  const lv = Math.max(1, Math.floor(Number(level) || 1));
  const pacing = TUNING.progression.cardPacing || {};
  const base = pacing.levelXpBase ?? TUNING.progression.levelBaseXp;
  return (base * lv * (lv + 1)) / 2;
}

/** Spawn budget at time t (minutes): min(400, floor(8 + 3.2 * t)). */
export function spawnBudget(tMinutes) {
  return Math.min(TUNING.difficulty.spawnBudgetCap, Math.floor(TUNING.difficulty.spawnBudgetBase + TUNING.difficulty.spawnBudgetPerMinute * tMinutes));
}

/** Elite chance at time t (minutes): min(0.35, 0.06 * t). */
export function eliteChance(tMinutes) {
  return Math.min(TUNING.difficulty.eliteChanceCap, TUNING.difficulty.eliteChancePerMinute * tMinutes);
}

/** Spawn interval at elapsed seconds t_s: max(0.5, 1.2 - 0.012 * t_s). */
export function spawnInterval(tSeconds) {
  return Math.max(TUNING.director.minSpawnInterval, TUNING.director.baseSpawnInterval - TUNING.director.spawnIntervalDecay * tSeconds);
}

/** Player speed with modifiers (multiplicative, no positives). */
export function playerSpeed(baseSpeed, aimMode = false, spinupFiring = false) {
  let speed = baseSpeed;
  if (aimMode) speed *= TUNING.player.aimModeSpeedMult;
  if (spinupFiring) speed *= TUNING.player.spinupSpeedMult;
  return speed;
}

/** Effective weapon stats with parts applied. */
export function weaponStatsWithParts(baseWeapon, parts) {
  const stats = { ...baseWeapon };
  for (const part of parts) {
    const effect = part.effect;
    if (effect.damageMult) stats.damage *= effect.damageMult;
    if (effect.cycleMult) stats.cycle *= effect.cycleMult;
    if (effect.magMult) stats.magazine = Math.round(stats.magazine * effect.magMult);
    if (effect.reloadMult) stats.reload *= effect.reloadMult;
    if (effect.rangeMult) stats.range *= effect.rangeMult;
    if (effect.spreadMult) stats.spread *= effect.spreadMult;
    if (effect.bloomMult) stats.bloomPerShot *= effect.bloomMult;
    if (effect.recoilMult) {
      stats.recoilYaw *= effect.recoilMult;
      stats.recoilPitch *= effect.recoilMult;
    }
    if (effect.heatMult) stats.heatPerShot *= effect.heatMult;
    if (effect.pierceCount) stats.pierceCount = (stats.pierceCount || 0) + effect.pierceCount;
    if (effect.burnDps) stats.burnDps = effect.burnDps;
    if (effect.burnDuration) stats.burnDuration = effect.burnDuration;
    if (effect.aimSpreadMult) stats.aimSpreadMult = effect.aimSpreadMult;
    if (effect.aimSpeedMult) stats.aimSpeedMult = effect.aimSpeedMult;
    if (effect.stationarySpreadMult) stats.stationarySpreadMult = effect.stationarySpreadMult;
    if (effect.stationaryRecoilMult) stats.stationaryRecoilMult = effect.stationaryRecoilMult;
    if (effect.moveSpreadMult) stats.moveSpreadMult = effect.moveSpreadMult;
    if (effect.secondaryGrenade) stats.secondaryGrenade = true;
    if (effect.grenadeCooldown) stats.grenadeCooldown = effect.grenadeCooldown;
    if (effect.burstCount) stats.burstCount = effect.burstCount;
    if (effect.seekTarget) stats.seekTarget = true;
    if (effect.sweepWithMovement) stats.sweepWithMovement = true;
    if (effect.spreadBurn) stats.spreadBurn = true;
    if (effect.soundSuppressed) stats.soundSuppressed = true;
    if (effect.aggroMult) stats.aggroMult = effect.aggroMult;
    if (effect.muzzleFlashMult) stats.muzzleFlashMult = effect.muzzleFlashMult;
    if (effect.tracerVisible) stats.tracerVisible = true;
    if (effect.revealCloaked) stats.revealCloaked = true;
    if (effect.hipSpreadMult) stats.hipSpreadMult = effect.hipSpreadMult;
    if (effect.armour) stats.armour = (stats.armour || 0) + effect.armour;
    if (effect.bleedReduction) stats.bleedReduction = effect.bleedReduction;
    if (effect.healOnKill) stats.healOnKill = effect.healOnKill;
    if (effect.maxHealth) stats.maxHealth = effect.maxHealth;
    if (effect.reflectMelee) stats.reflectMelee = true;
  }
  return stats;
}

/** TTK calculation for balance test BT-01. */
export function ttk(weapon, enemyHp, enemyIsShieldbearer = false, isFlank = true) {
  if (enemyIsShieldbearer && !isFlank) return Infinity;
  let dps;
  if (weapon.style === "beam" || weapon.style === "flamer" || weapon.style === "spinup") {
    dps = weapon.damage / weapon.cycle; // continuous approximation
  } else {
    dps = weapon.damage / weapon.cycle;
  }
  const shots = Math.ceil(enemyHp / weapon.damage);
  return shots * weapon.cycle;
}

/** Check if evolution requirements are met. */
export function checkEvolution(weaponStyle, ownedParts) {
  const evos = TUNING.progression.evolutions;
  for (const [id, evo] of Object.entries(evos)) {
    if (evo.requires.style === weaponStyle) {
      const hasParts = evo.requires.parts.every(p => ownedParts.includes(p));
      if (hasParts) return id;
    }
  }
  return null;
}

/** Get part by ID from all part pools. */
export function getPartById(partId) {
  for (const [slot, parts] of Object.entries(TUNING.progression.parts)) {
    const part = parts.find(p => p.id === partId);
    if (part) return { ...part, slot };
  }
  return null;
}

/** Get random part weighted by slot weights and rarity. */
export function rollPart(rng, slotWeights, rarityWeights) {
  // Pick slot
  const totalSlotWeight = Object.values(slotWeights).reduce((a, b) => a + b, 0);
  let roll = rng() * totalSlotWeight;
  let chosenSlot = "barrel";
  for (const [slot, weight] of Object.entries(slotWeights)) {
    roll -= weight;
    if (roll <= 0) { chosenSlot = slot; break; }
  }

  // Pick rarity
  const totalRarityWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
  roll = rng() * totalRarityWeight;
  let chosenRarity = "common";
  for (const [rarity, weight] of Object.entries(rarityWeights)) {
    roll -= weight;
    if (roll <= 0) { chosenRarity = rarity; break; }
  }

  // Pick part from slot with matching rarity
  const parts = TUNING.progression.parts[chosenSlot].filter(p => p.rarity === chosenRarity);
  if (parts.length === 0) {
    // Fallback to common
    const commonParts = TUNING.progression.parts[chosenSlot].filter(p => p.rarity === "common");
    return commonParts[Math.floor(rng() * commonParts.length)];
  }
  return parts[Math.floor(rng() * parts.length)];
}

/** Roll airdrop options (weapon or part). */
export function rollAirdropOptions(rng) {
  const options = [];
  for (let i = 0; i < TUNING.airdrop.optionsCount; i++) {
    if (rng() < TUNING.airdrop.weaponChance) {
      // Weapon option - pick from available styles not already owned
      const styles = ["spray", "pierce", "cone", "ricochet", "arc", "beam", "chain", "burst", "spinup", "rail", "flamer", "sentry", "flak", "breach", "rail2"];
      options.push({ type: "weapon", style: styles[Math.floor(rng() * styles.length)] });
    } else {
      options.push({ type: "part", part: rollPart(rng, TUNING.airdrop.partSlotWeights, TUNING.airdrop.rarityWeights) });
    }
  }
  return options;
}

/** Unlock tokens from score. */
export function unlockTokensFromScore(score) {
  return Math.min(TUNING.scoring.maxUnlocksPerRun, Math.floor(score / TUNING.scoring.unlockThreshold));
}