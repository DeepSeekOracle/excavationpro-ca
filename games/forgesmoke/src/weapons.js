/**
 * Weapon system — two slots, swap, auto-reload, reload speed meta-progression, heat, parts.
 * Pure logic, no rendering. Rendering handled by main.js.
 */

import { TUNING } from "./tuning.js?v=202610322v";
import { weaponStatsWithParts, rollAirdropOptions, rollPart as _rollPart, xpThreshold } from "./balance.js?v=202610322v";

const DEFAULT_RELOAD_META = {
  startMult: 1.40,        // Starts 40% slower at Level 1 (~0.71x speed)
  perLevelReduction: 0.06,// -6% reload duration per level up
  perCardReduction: 0.14, // -14% reload duration per fast-reload upgrade
  minMult: 0.35,          // Up to 2.86x reload speed at high levels
};

export class Weapon {
  constructor(styleKey, parts = [], levelReloadMult = null) {
    this.styleKey = styleKey || "spray";
    this.baseConfig = TUNING.weapons[this.styleKey] || { ...TUNING.weapons.spray, style: this.styleKey };
    this.parts = parts;
    this.config = weaponStatsWithParts(this.baseConfig, parts);
    this.magazine = this.config.magazine;
    this.heat = 0;
    const meta = TUNING.reloadMeta || DEFAULT_RELOAD_META;
    this.levelReloadMult = typeof levelReloadMult === "number" ? levelReloadMult : meta.startMult;
    this.reloadTimer = 0;
    this.reloadDuration = this.effectiveReloadTime;
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

  /** Effective reload duration in seconds (starts slower at Lv 1, gets faster with levels & reload cards). */
  get effectiveReloadTime() {
    const base = this.isHeatWeapon ? TUNING.heat.lockDuration : this.config.reload;
    return Math.max(0.22, base * (this.levelReloadMult || 1.0));
  }

  /** Reload speed multiplier relative to baseline weapon reload (e.g. 0.71x at Lv 1 -> 1.85x+ with upgrades). */
  get reloadSpeedMultiplier() {
    const base = this.isHeatWeapon ? TUNING.heat.lockDuration : this.baseConfig.reload;
    return Number((base / this.effectiveReloadTime).toFixed(2));
  }

  /** Reload progress 0..1 for HUD bar and 3D weapon tilt animation. */
  get reloadProgress() {
    if (!this.isReloading || this.reloadDuration <= 0) return 1;
    return Math.max(0, Math.min(1, 1 - this.reloadTimer / this.reloadDuration));
  }

  /** Set meta reload duration multiplier from player level & reload upgrades. */
  setMetaReloadMultiplier(mult) {
    const meta = TUNING.reloadMeta || DEFAULT_RELOAD_META;
    const nextMult = Math.max(meta.minMult, mult);
    if (this.isReloading && this.levelReloadMult > 0) {
      const ratio = nextMult / this.levelReloadMult;
      this.reloadTimer *= ratio;
      this.reloadDuration *= ratio;
    }
    this.levelReloadMult = nextMult;
  }

  /** Start reload. Returns true if reload started. */
  startReload() {
    if (this.isReloading || this.reloadTimer > 0) return false;
    if (!this.isHeatWeapon && this.magazine >= this.maxMagazine) return false;
    if (this.isHeatWeapon && this.heat <= 0) return false;

    this.isReloading = true;
    this.reloadDuration = this.effectiveReloadTime;
    this.reloadTimer = this.reloadDuration;
    this.reloadPhase = 0;
    this.reloadPhaseTimer = 0;
    return true;
  }

  /** Update reload/heat vent + AUTO-RELOAD when magazine hits 0 or weapon overheats. */
  updateReload(dt) {
    if (this.isHeatWeapon && this.heat > 0) {
      if (this.lastFireTime > TUNING.heat.ventDelay) {
        this.heat = Math.max(0, this.heat - TUNING.heat.ventRate * dt);
      }
      this.lastFireTime += dt;
    }

    // Auto-reload whenever magazine is empty (or heat weapon overheated)
    if (!this.isReloading) {
      if ((!this.isHeatWeapon && this.isEmpty) || (this.isHeatWeapon && this.isOverheated)) {
        this.startReload();
      } else {
        return false;
      }
    }

    this.reloadTimer -= dt;
    this.lastFireTime += dt;

    // Advance reload phases scaled by reload speed multiplier
    if (!this.isHeatWeapon && this.config.reloadPhases) {
      const phaseScale = this.reloadSpeedMultiplier || 1;
      this.reloadPhaseTimer += dt * phaseScale;
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

  /** Fire the weapon. Automatically triggers reload if the last round in the magazine is spent. */
  fire(rng, aimMode = false) {
    if (!this.canFire) {
      if (!this.isReloading && ((!this.isHeatWeapon && this.isEmpty) || (this.isHeatWeapon && this.isOverheated))) {
        this.startReload();
      }
      return null;
    }

    const spread = aimMode ? this.currentSpread * TUNING.aimMode.spreadReduction : this.currentSpread;
    const damage = this.config.damage;
    const pierceCount = this.config.pierceCount || 0;
    const pellets = this.config.pellets || 1;
    const heatAdded = this.config.heatPerShot;

    // Consume ammo or build heat, and auto-reload immediately on empty / overheat
    if (!this.isHeatWeapon) {
      this.magazine--;
      this.bloom = Math.min(this.config.maxBloom, this.bloom + this.config.bloomPerShot);
      if (this.magazine <= 0) {
        this.startReload();
      }
    } else {
      this.heat = Math.min(this.config.heatCap, this.heat + heatAdded);
      this.lastFireTime = 0;
      if (this.heat >= this.config.heatCap) {
        this.startReload();
      }
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
    this.reloadDuration = this.effectiveReloadTime;
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
      levelReloadMult: this.levelReloadMult,
      bloom: this.bloom,
      spinupProgress: this.spinupProgress,
    };
  }

  /** Deserialize from save. */
  static deserialize(data) {
    const weapon = new Weapon(
      data.styleKey,
      (data.parts || []).map(id => ({ id })),
      data.levelReloadMult,
    );
    weapon.magazine = data.magazine;
    weapon.heat = data.heat;
    weapon.reloadTimer = data.reloadTimer;
    weapon.isReloading = data.isReloading;
    weapon.bloom = data.bloom || 0;
    weapon.spinupProgress = data.spinupProgress || 0;
    return weapon;
  }
}

/** Weapon manager — handles two slots, swap, auto-reload & reload meta progression. */
export class WeaponManager {
  constructor(rng) {
    this.rng = rng;
    this.playerLevel = 1;
    this.reloadUpgradesCount = 0;
    this.lightModLevel = 0;
    this.hasFloodlightMod = false;
    this.hasLightOrbMod = false;
    this.hasSolarAuraMod = false;
    this.hasExplosiveMod = false;
    this.hasLightDroneMod = false;
    this.hasLightBeaconMod = false;
    this.primary = new Weapon("spray");
    this.secondary = new Weapon("pierce");
    this.activeSlot = "primary"; // "primary" or "secondary"
    this.swapTimer = 0;
    this.swapDuration = TUNING.swap.duration;
    this.isSwapping = false;
    this.swapDirection = 1;
    this.syncReloadMeta(1, 0);
  }

  /** Reset all card-gated Light Mods at the start of a new run (player starts with 0 light effects unless using a Light Gun). */
  resetLightMods() {
    this.lightModLevel = 0;
    this.hasFloodlightMod = false;
    this.hasLightOrbMod = false;
    this.hasSolarAuraMod = false;
    this.hasLightDroneMod = false;
    this.hasLightBeaconMod = false;
  }

  get active() { return this.activeSlot === "primary" ? this.primary : this.secondary; }
  get inactive() { return this.activeSlot === "primary" ? this.secondary : this.primary; }

  /** Compute and apply meta reload speed multiplier from player level and collected upgrades. */
  syncReloadMeta(level = this.playerLevel, reloadUpgrades = this.reloadUpgradesCount) {
    this.playerLevel = Math.max(1, level);
    this.reloadUpgradesCount = Math.max(0, reloadUpgrades);
    const meta = TUNING.reloadMeta || DEFAULT_RELOAD_META;
    const mult = Math.max(
      meta.minMult,
      meta.startMult - (this.playerLevel - 1) * meta.perLevelReduction - this.reloadUpgradesCount * meta.perCardReduction,
    );
    if (this.primary) this.primary.setMetaReloadMultiplier(mult);
    if (this.secondary) this.secondary.setMetaReloadMultiplier(mult);
    return mult;
  }

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

  /** Update both weapons' reload/heat (auto-reloads active weapon if empty). */
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

  /** Apply part to a specific slot and boost reload meta speed + tactical light mods. */
  applyPart(slot, part) {
    const weapon = slot === "primary" ? this.primary : this.secondary;
    if (part) {
      weapon.addPart(part);
      if (part.effect?.reloadMult && part.effect.reloadMult < 1) {
        this.reloadUpgradesCount += 1.5;
      } else {
        this.reloadUpgradesCount += 0.5;
      }
      if (part.id === "tac_flashlight" || part.effect?.lightBeamMult) {
        this.hasFloodlightMod = true;
        this.lightModLevel += 1;
      }
      if (part.id === "light_orb_rounds" || part.effect?.lightOrbMult) {
        this.hasLightOrbMod = true;
        this.lightModLevel += 1;
      }
      if (part.id === "flare_rig" || part.effect?.solarAura) {
        this.hasSolarAuraMod = true;
        this.lightModLevel += 1;
      }
      if (part.id === "frag_rounds" || part.id === "breach_grenade" || part.effect?.explosive) {
        this.hasExplosiveMod = true;
        this.lightModLevel += 1;
      }
      if (part.id === "light_drone" || part.effect?.lightDrone) {
        this.hasLightDroneMod = true;
        this.lightModLevel += 1;
      }
      if (part.id === "light_beacon" || part.effect?.lightBeacon) {
        this.hasLightBeaconMod = true;
        this.lightModLevel += 1;
      }
      this.syncReloadMeta(this.playerLevel, this.reloadUpgradesCount);
    }
  }

  /** Replace weapon in slot (from airdrop) preserving parts and reload meta speed. */
  replaceWeapon(slot, styleKey) {
    if (slot === "primary") {
      this.primary = new Weapon(styleKey, this.primary.parts, this.primary.levelReloadMult);
    } else {
      this.secondary = new Weapon(styleKey, this.secondary.parts, this.secondary.levelReloadMult);
    }
    this.syncReloadMeta(this.playerLevel, this.reloadUpgradesCount);
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
      playerLevel: this.playerLevel,
      reloadUpgradesCount: this.reloadUpgradesCount,
    };
  }

  /** Deserialize from save. */
  static deserialize(data, rng) {
    const mgr = new WeaponManager(rng);
    mgr.primary = Weapon.deserialize(data.primary);
    mgr.secondary = Weapon.deserialize(data.secondary);
    mgr.activeSlot = data.activeSlot || "primary";
    mgr.syncReloadMeta(data.playerLevel || 1, data.reloadUpgradesCount || 0);
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
    this.nextLevelXp = xpThreshold(1);
  }

  /** Add XP and check for level up. Returns card options if level up. */
  addXp(amount) {
    this.xp += amount;
    if (this.xp >= this.nextLevelXp && this.queuedCards.length < this.maxQueued) {
      this.level++;
      this.nextLevelXp = xpThreshold(this.level);
      return this.generateCardOptions();
    }
    return null;
  }

  /** Generate 3 card options for level up (includes Tactical Light Mods + Fast-Reload Mods + Weapon Styles). */
  generateCardOptions() {
    const lightAndReloadPool = [
      {
        id: "tac_flashlight",
        name: "Lumen-X Weapon Floodlight (Gun Light Beam)",
        slot: "underbarrel",
        rarity: "common",
        effect: { lightBeamMult: 1.85, litDamageMult: 1.25, recoilMult: 0.85 },
      },
      {
        id: "light_orb_rounds",
        name: "Phosphor Light-Orb Rounds (Light-Orb Shots)",
        slot: "magazine",
        rarity: "rare",
        effect: { lightOrbMult: 2.2, reloadMult: 0.78, cycleMult: 0.9 },
      },
      {
        id: "flare_rig",
        name: "Solar Halo Aura (360° Light Aura + Fast RLD)",
        slot: "optic",
        rarity: "rare",
        effect: { solarAura: true, reloadMult: 0.7, aimSpreadMult: 0.75 },
      },
      {
        id: "light_drone",
        name: "Helios Orbiting Light-Drone (Auto-Zap + Lamp)",
        slot: "receiver",
        rarity: "rare",
        effect: { lightDrone: true, cycleMult: 0.92 },
      },
      {
        id: "light_beacon",
        name: "Flare-Drop Ground Beacons (Drops Light Pylons)",
        slot: "plate",
        rarity: "common",
        effect: { lightBeacon: true, reloadMult: 0.85 },
      },
      {
        id: "frag_rounds",
        name: "Frag Rounds (Explosive — over the top of shields)",
        slot: "magazine",
        rarity: "rare",
        effect: { explosive: true, damageMult: 1.10 },
      },
      {
        id: "breach_grenade",
        name: "Breach Grenade Rig (Blast — ignores shield facing)",
        slot: "underbarrel",
        rarity: "epic",
        effect: { explosive: true, damageMult: 1.25, cycleMult: 1.12 },
      },
      {
        id: "fast_mag",
        name: "Quick-Release Mag (+35% Reload Spd)",
        slot: "magazine",
        rarity: "common",
        effect: { reloadMult: 0.72, magMult: 1.1 },
      },
    ];
    const options = [];
    const used = new Set();
    const styles = ["spray", "pierce", "cone", "ricochet", "arc", "beam", "chain", "burst", "spinup", "rail", "flamer", "sentry", "flak", "breach", "rail2"];
    const pickUnique = (pool) => {
      let p = pool[Math.floor(this.rng() * pool.length)];
      for (let k = 0; k < 6 && used.has(p.id); k += 1) p = pool[Math.floor(this.rng() * pool.length)];
      used.add(p.id);
      return p;
    };
    for (let i = 0; i < TUNING.progression.cardChoices; i++) {
      if (i === 0) {
        const chosenMod = pickUnique(lightAndReloadPool);
        options.push({ type: "part", name: chosenMod.name, part: chosenMod });
      } else if (i === 1 && this.rng() < 0.65) {
        const chosenMod = pickUnique(lightAndReloadPool);
        options.push({ type: "part", name: chosenMod.name, part: chosenMod });
      } else if (!this.lastHadWeapon && this.rng() < 0.16) {
        // weapon cards are the rarest offer (16 %, and never two trays in a row)
        // never offer the same weapon twice in one tray
        const open = styles.filter((s) => !used.has(`wpn_${s}`));
        const st = open.length ? open[Math.floor(this.rng() * open.length)] : styles[Math.floor(this.rng() * styles.length)];
        used.add(`wpn_${st}`);
        options.push({ type: "weapon", name: `WEAPON: ${st.toUpperCase()}`, style: st });
      } else {
        let p = rollPart(this.rng, TUNING.airdrop.partSlotWeights, TUNING.airdrop.rarityWeights);
        for (let k = 0; k < 6 && p && used.has(p.id); k += 1) {
          p = rollPart(this.rng, TUNING.airdrop.partSlotWeights, TUNING.airdrop.rarityWeights);
        }
        if (p && !used.has(p.id)) {
          used.add(p.id);
          options.push({ type: "part", name: p.name, part: p });
        } else {
          const fallback = pickUnique(lightAndReloadPool);
          options.push({ type: "part", name: fallback.name, part: fallback });
        }
      }
    }
    this.lastHadWeapon = options.some((o) => o.type === "weapon");
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

function rollPart(rng, slotWeights, rarityWeights) {
  return _rollPart(rng, slotWeights, rarityWeights);
}


/**
 * Per-weapon firing identity. Every style gets its own tracer colour, width, muzzle flash and
 * report, so a shot is recognisable by its silhouette and its sound, not just its damage number.
 * `kind` drives the special effect: tracer / lance / beam / arc / flame / grenade.
 */
export const STYLE_VFX = {
  spray:    { color: 0xffd57a, tracer: 0.9, flash: 1.0, sound: "shot_smg",      pitch: 1.00, kind: "tracer" },
  cone:     { color: 0xff8a4a, tracer: 1.6, flash: 1.5, sound: "shot_shotgun",  pitch: 0.78, kind: "spread" },
  pierce:   { color: 0x6fe3ff, tracer: 0.5, flash: 0.9, sound: "shot_marksman", pitch: 1.18, kind: "lance" },
  ricochet: { color: 0xa6ff7a, tracer: 0.9, flash: 1.0, sound: "laser3",        pitch: 1.32, kind: "tracer" },
  burst:    { color: 0xffe36f, tracer: 0.8, flash: 1.2, sound: "shot_marksman", pitch: 1.12, kind: "tracer" },
  beam:     { color: 0x6fe3ff, tracer: 2.6, flash: 1.7, sound: "shot_beam",     pitch: 0.92, kind: "beam" },
  chain:    { color: 0xc6a4ff, tracer: 1.4, flash: 1.3, sound: "laser5",        pitch: 1.26, kind: "arc" },
  spinup:   { color: 0xff5a5a, tracer: 0.7, flash: 0.8, sound: "shot_minigun",  pitch: 1.28, kind: "rapid" },
  rail:     { color: 0xf2f8ff, tracer: 3.4, flash: 2.1, sound: "shot_rail",     pitch: 0.68, kind: "lance" },
  flamer:   { color: 0xffa23c, tracer: 1.9, flash: 2.3, sound: "shot_flamer",   pitch: 0.62, kind: "flame" },
  arc:      { color: 0xff6fd6, tracer: 1.2, flash: 1.6, sound: "shot_grenade",  pitch: 0.70, kind: "grenade" },
  sentry:   { color: 0x6fff9a, tracer: 0.8, flash: 1.0, sound: "laser7",        pitch: 1.42, kind: "tracer" },
  flak:     { color: 0xffb347, tracer: 1.3, flash: 1.8, sound: "shot_shotgun",  pitch: 0.72, kind: "spread" },
  breach:   { color: 0xff8a4a, tracer: 2.0, flash: 2.2, sound: "shot_shotgun",  pitch: 0.58, kind: "spread" },
  rail2:    { color: 0xf2f8ff, tracer: 3.6, flash: 2.4, sound: "shot_rail",     pitch: 0.60, kind: "lance" },
};

/** The one style that carries a real grenade (and therefore bypasses shields). */
export const GRENADE_STYLES = new Set(["arc"]);
