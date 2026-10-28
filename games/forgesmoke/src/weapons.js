/**
 * Weapon system — two slots, swap, reload variants, heat, parts.
 * Pure logic, no rendering. Rendering handled by main.js.
 */

import { TUNING } from "./tuning.js";
import { weaponStatsWithParts, rollAirdropOptions } from "./balance.js";

export class Weapon {
  constructor(styleKey, parts = []) {
    this.styleKey = styleKey;
    this.baseConfig = TUNING.weapons[styleKey];
    this.parts = parts;
    this.config = weaponStatsWithParts(this.baseConfig, parts);
    this.magazine = this.config.magazine;
    this.heat = 0;
    this.reloadTimer = 0;
    this.isReloading = false;
    this.reloadPhase = 0;
    this.reloadPhaseTimer = 0;
    this.bloom = 0;
    this.spinupProgress = 0;
    this.lastFireTime = 0;
  }

  get maxMagazine() { return this.config.magazine; }
  get maxHeat() { return this.config.heatCap; }
  get isHeatWeapon() { return this.config.heatCap > 0; }
  get isEmpty() { return this.magazine <= 0; }
  get isOverheated() { return this.heat >= this.config.heatCap && this.config.heatCap > 0; }
  get canFire() { return !this.isReloading && this.reloadTimer <= 0 && !this.isOverheated && (!this.isEmpty || this.isHeatWeapon); }
  get currentCycle() {
    if (this.styleKey === "spinup") {
      return this.config.cycle * (1 - this.spinupProgress * 0.9);
    }
    return this.config.cycle;
  }
  get currentSpread() { return this.config.spread + this.bloom; }
  get family() { return this.config.family; }

  /** Start reload. Returns true if reload started. */
  startReload() {
    if (this.isReloading || this.reloadTimer > 0 || this.magazine >= this.maxMagazine) return false;
    if (this.isHeatWeapon) {
      // Heat weapons vent instead of reload
      this.reloadTimer = TUNING.heat.lockDuration;
      this.isReloading = true;
      this.reloadPhase = 0;
      return true;
    }
    this.isReloading = true;
    this.reloadTimer = this.config.reload;
    this.reloadPhase = 0;
    this.reloadPhaseTimer = 0;
    return true;
  }

  /** Update reload/heat vent. Returns true if reload completed this frame. */
  updateReload(dt) {
    if (this.isHeatWeapon && this.heat > 0) {
      // Vent heat after delay
      if (this.lastFireTime > TUNING.heat.ventDelay) {
        this.heat = Math.max(0, this.heat - TUNING.heat.ventRate * dt);
      }
      this.lastFireTime += dt;
    }

    if (!this.isReloading) return false;

    this.reloadTimer -= dt;
    this.lastFireTime += dt;

    // Advance reload phases for animation
    if (!this.isHeatWeapon && this.config.reloadPhases) {
      this.reloadPhaseTimer += dt;
      while (this.reloadPhase < this.config.reloadPhases.length &&
             this.reloadPhaseTimer >= this.config.reloadPhases[this.reloadPhase].duration) {
        this.reloadPhaseTimer -= this.config.reloadPhases[this.reloadPhase].duration;
        this.reloadPhase++;
      }
    }

    if (this.reloadTimer <= 0) {
      this.isReloading = false;
      this.reloadTimer = 0;
      if (this.isHeatWeapon) {
        this.heat = 0;
      } else {
        this.magazine = this.maxMagazine;
        this.bloom = 0;
      }
      this.reloadPhase = this.config.reloadPhases?.length || 0;
      return true;
    }
    return false;
  }

  /** Fire the weapon. Returns { hit: boolean, damage: number, pierceCount: number, heatAdded: number, tracerData: object }. */
  fire(rng, aimMode = false) {
    if (!this.canFire) return null;

    const spread = aimMode ? this.currentSpread * TUNING.aimMode.spreadReduction : this.currentSpread;
    const damage = this.config.damage;
    const pierceCount = this.config.pierceCount || 0;
    const pellets = this.config.pellets || 1;
    const heatAdded = this.config.heatPerShot;

    // Consume ammo or build heat
    if (!this.isHeatWeapon) {
      this.magazine--;
      this.bloom = Math.min(this.config.maxBloom, this.bloom + this.config.bloomPerShot);
    } else {
      this.heat = Math.min(this.config.heatCap, this.heat + heatAdded);
      this.lastFireTime = 0;
    }

    // Spin-up progress
    if (this.styleKey === "spinup") {
      this.spinupProgress = Math.min(1, this.spinupProgress + 0.1);
    }

    return {
      style: this.styleKey,
      damage,
      pierceCount,
      pellets,
      spread,
      tracerColor: this.config.tracerColor,
      tracerLife: this.config.tracerLife,
      muzzleFlashSize: this.config.muzzleFlashSize,
      muzzleFlashLife: this.config.muzzleFlashLife,
      recoilYaw: this.config.recoilYaw,
      recoilPitch: this.config.recoilPitch,
      hitFlashLife: this.config.hitFlashLife,
      hitPause: this.config.hitPause,
      pierceLinger: this.config.pierceLinger,
      multiHitFlashLife: this.config.multiHitFlashLife,
      falloffStart: this.config.falloffStart,
      falloffEnd: this.config.falloffEnd,
      range: this.config.range,
    };
  }

  /** Apply a part to this weapon. */
  addPart(part) {
    this.parts.push(part);
    this.config = weaponStatsWithParts(this.baseConfig, this.parts);
  }

  /** Get current reload phase for animation. */
  getReloadPhase() {
    if (!this.isReloading || this.isHeatWeapon) return null;
    if (this.reloadPhase >= (this.config.reloadPhases?.length || 0)) return null;
    return this.config.reloadPhases[this.reloadPhase];
  }

  /** Get swap animation params. */
  getSwapParams() {
    return {
      dip: this.config.swapDip,
      settle: this.config.swapSettle,
    };
  }

  /** Serialize for save. */
  serialize() {
    return {
      styleKey: this.styleKey,
      parts: this.parts.map(p => p.id),
      magazine: this.magazine,
      heat: this.heat,
      reloadTimer: this.reloadTimer,
      isReloading: this.isReloading,
      bloom: this.bloom,
      spinupProgress: this.spinupProgress,
    };
  }

  /** Deserialize from save. */
  static deserialize(data) {
    const weapon = new Weapon(data.styleKey, data.parts.map(id => {
      // Parts will be resolved after deserialization
      return { id };
    }));
    weapon.magazine = data.magazine;
    weapon.heat = data.heat;
    weapon.reloadTimer = data.reloadTimer;
    weapon.isReloading = data.isReloading;
    weapon.bloom = data.bloom || 0;
    weapon.spinupProgress = data.spinupProgress || 0;
    return weapon;
  }
}

/** Weapon manager — handles two slots, swap, airdrop/level-up integration. */
export class WeaponManager {
  constructor(rng) {
    this.rng = rng;
    this.primary = new Weapon("spray");
    this.secondary = new Weapon("pierce");
    this.activeSlot = "primary"; // "primary" or "secondary"
    this.swapTimer = 0;
    this.swapDuration = TUNING.swap.duration;
    this.isSwapping = false;
    this.swapDirection = 1;
  }

  get active() { return this.activeSlot === "primary" ? this.primary : this.secondary; }
  get inactive() { return this.activeSlot === "primary" ? this.secondary : this.primary; }

  /** Try to swap weapons. Returns true if swap initiated. */
  trySwap() {
    if (this.isSwapping) return false;
    this.isSwapping = true;
    this.swapTimer = this.swapDuration;
    this.swapDirection = this.activeSlot === "primary" ? 1 : -1;
    return true;
  }

  /** Update swap animation. Returns true if swap completed this frame. */
  updateSwap(dt) {
    if (!this.isSwapping) return false;
    this.swapTimer -= dt;
    if (this.swapTimer <= 0) {
      this.isSwapping = false;
      this.swapTimer = 0;
      this.activeSlot = this.activeSlot === "primary" ? "secondary" : "primary";
      return true;
    }
    return false;
  }

  /** Get swap progress 0-1 for animation. */
  getSwapProgress() {
    if (!this.isSwapping) return this.activeSlot === "primary" ? 0 : 1;
    return this.activeSlot === "primary"
      ? 1 - this.swapTimer / this.swapDuration
      : this.swapTimer / this.swapDuration;
  }

  /** Update both weapons' reload/heat. */
  updateReload(dt) {
    this.primary.updateReload(dt);
    this.secondary.updateReload(dt);
  }

  /** Fire active weapon. */
  fire(aimMode = false) {
    return this.active.fire(this.rng, aimMode);
  }

  /** Try to reload active weapon. */
  tryReload() {
    return this.active.startReload();
  }

  /** Get active weapon config for HUD. */
  getActiveConfig() {
    return this.active.config;
  }

  /** Get inactive weapon config for HUD. */
  getInactiveConfig() {
    return this.inactive.config;
  }

  /** Apply part to a specific slot. */
  applyPart(slot, part) {
    const weapon = slot === "primary" ? this.primary : this.secondary;
    weapon.addPart(part);
  }

  /** Replace weapon in slot (from airdrop). */
  replaceWeapon(slot, styleKey) {
    if (slot === "primary") {
      this.primary = new Weapon(styleKey, this.primary.parts);
    } else {
      this.secondary = new Weapon(styleKey, this.secondary.parts);
    }
  }

  /** Generate airdrop options. */
  generateAirdropOptions() {
    return rollAirdropOptions(this.rng);
  }

  /** Serialize for save. */
  serialize() {
    return {
      primary: this.primary.serialize(),
      secondary: this.secondary.serialize(),
      activeSlot: this.activeSlot,
    };
  }

  /** Deserialize from save. */
  static deserialize(data, rng) {
    const mgr = new WeaponManager(rng);
    mgr.primary = Weapon.deserialize(data.primary);
    mgr.secondary = Weapon.deserialize(data.secondary);
    mgr.activeSlot = data.activeSlot || "primary";
    return mgr;
  }
}

/** Card system for level-ups and airdrops. */
export class CardSystem {
  constructor(rng) {
    this.rng = rng;
    this.queuedCards = [];
    this.maxQueued = TUNING.progression.maxQueuedCards;
    this.xp = 0;
    this.level = 1;
    this.nextLevelXp = TUNING.progression.levelBaseXp;
  }

  /** Add XP and check for level up. Returns card options if level up. */
  addXp(amount) {
    this.xp += amount;
    if (this.xp >= this.nextLevelXp && this.queuedCards.length < this.maxQueued) {
      this.level++;
      this.nextLevelXp = TUNING.progression.levelBaseXp * this.level;
      return this.generateCardOptions();
    }
    return null;
  }

  /** Generate 3 card options for level up. */
  generateCardOptions() {
    const options = [];
    for (let i = 0; i < TUNING.progression.cardChoices; i++) {
      // 65% part, 35% weapon (but weapon only if slots not full - simplified here)
      if (this.rng() < 0.35) {
        const styles = ["spray", "pierce", "cone", "ricochet", "arc", "beam", "chain", "burst", "spinup", "rail", "flamer", "sentry"];
        options.push({ type: "weapon", style: styles[Math.floor(this.rng() * styles.length)] });
      } else {
        options.push({ type: "part", part: rollPart(this.rng, TUNING.airdrop.partSlotWeights, TUNING.airdrop.rarityWeights) });
      }
    }
    this.queuedCards.push(options);
    return options;
  }

  /** Pick a card (0, 1, or 2). Returns the chosen option. */
  pickCard(index) {
    if (this.queuedCards.length === 0) return null;
    const options = this.queuedCards.shift();
    return options[index];
  }

  /** Get current queued cards for HUD. */
  getQueuedCards() {
    return this.queuedCards;
  }

  /** Serialize for save. */
  serialize() {
    return {
      xp: this.xp,
      level: this.level,
      nextLevelXp: this.nextLevelXp,
      queuedCards: this.queuedCards,
    };
  }

  /** Deserialize from save. */
  static deserialize(data, rng) {
    const sys = new CardSystem(rng);
    sys.xp = data.xp;
    sys.level = data.level;
    sys.nextLevelXp = data.nextLevelXp;
    sys.queuedCards = data.queuedCards || [];
    return sys;
  }
}

/** Roll part helper (re-exported for convenience). */
import { rollPart as _rollPart } from "./balance.js";
function rollPart(rng, slotWeights, rarityWeights) {
  return _rollPart(rng, slotWeights, rarityWeights);
}