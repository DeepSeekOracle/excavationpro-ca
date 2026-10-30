/**
 * Engine math (brief 03) — one import surface for the combat/curve formulas.
 *
 * The live implementation lives in `balance.js` (already pure, already unit-tested); this module is
 * the documented, stable surface the brief asks for, plus the three helpers that were still ad hoc:
 * spread, falloff and the run-XP formula. Nothing here touches THREE or the DOM.
 */

import { TUNING } from "./tuning.js?v=202610323d";
import {
  shieldGate as gate,
  bossHp as bossCurve,
  xpThreshold as xpCurve,
  timeToKill as ttk,
} from "./balance.js?v=202610323d";

/** Every constant in one place, each with the reason it has that value. */
export const MATH = Object.freeze({
  armourK: 260,              // soak = 1 - armour/(armour+k): 260 makes 20 armour ~7 % soak
  shieldFront: 0,            // the wall covers the front arc: ordinary fire does nothing
  shieldPierceDefault: 0.55, // explosive rounds get this fraction through the wall
  falloffMin: 0.35,          // a shot never falls below 35 % damage at max range
  falloffRange: 30,          // metres over which falloff reaches its floor
  spreadGaussian: 0.5,       // std-dev as a fraction of the cone half-angle
  xpBase: 300,               // level curve base (matches TUNING.progression.cardPacing)
});

/** Damage after the fraction armour model (k is the soak knee, default 260). */
export function armourSoak(damage, armour, k = MATH.armourK) {
  const d = Math.max(0, Number(damage) || 0);
  const a = Math.max(0, Number(armour) || 0);
  return Math.max(0, d * (1 - Math.min(0.95, a / (a + Math.max(1, k)))));
}

/** The only place shield logic should live. */
export const shieldGate = (damage, opts) => gate(damage, opts);

/** Boss HP curve. */
export const bossHp = (base, level = 1) => bossCurve(base, level);

/** XP required to advance out of a level. */
export const xpThreshold = (level) => xpCurve(level);

/** Shots-to-kill time for balance tables. */
export const timeToKill = (weapon, hp, armour = 0) => ttk(weapon, hp, armour);

/** Gaussian-ish spread in radians, clamped to ±1.5x the half-angle. */
export function spread(halfAngleRad, accuracy = 1, rng = Math.random) {
  const sigma = Math.max(0.0001, halfAngleRad * MATH.spreadGaussian * (1 / Math.max(0.05, accuracy)));
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  v = rng();
  const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.max(-1.5 * halfAngleRad, Math.min(1.5 * halfAngleRad, g * sigma));
}

/** Damage multiplier by distance: 1 inside `base`, easing to `minFactor` at `range`. */
export function falloff(distance, base = 0, minFactor = MATH.falloffMin, range = MATH.falloffRange) {
  if (distance <= base) return 1;
  const t = Math.min(1, (distance - base) / Math.max(0.001, range - base));
  return 1 - (1 - minFactor) * t;
}

/**
 * XP banked for a run: survival seconds + kills + a clear bonus, one documented formula.
 * (Profile XP uses the same shape in `bankRun`; this is the reference used by the tables.)
 */
export function xpForRun({ seconds = 0, kills = 0, cleared = false, level = 1 } = {}) {
  const base = seconds * 2.5 + kills * 10;
  const clearBonus = cleared ? 120 + level * 20 : 0;
  return Math.round(base + clearBonus);
}
