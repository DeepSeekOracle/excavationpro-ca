/**
 * Tuning values — single source of truth for all numbers.
 * Pure data, no logic. Formulas live in balance.js.
 */

const CARD_POOL = [
  { id: "long_barrel", name: "Long Barrel", slot: "barrel", rarity: "common", effect: { rangeMult: 1.25, spreadMult: 0.8 } },
  { id: "suppressor", name: "Suppressor", slot: "barrel", rarity: "rare", effect: { soundSuppressed: true, aggroMult: 0.5, rangeMult: 0.95 } },
  { id: "drum_mag", name: "Drum Magazine", slot: "magazine", rarity: "common", effect: { magMult: 2.0, reloadMult: 1.3 } },
  { id: "ap_rounds", name: "AP Rounds", slot: "magazine", rarity: "rare", effect: { pierceCount: 1, damageMult: 0.9 } },
  { id: "red_dot", name: "Red Dot", slot: "optic", rarity: "common", effect: { aimSpreadMult: 0.7, aimSpeedMult: 1.1 } },
  { id: "foregrip", name: "Foregrip", slot: "underbarrel", rarity: "common", effect: { recoilMult: 0.7, bloomMult: 0.8 } },
  { id: "overclock", name: "Overclock", slot: "receiver", rarity: "rare", effect: { cycleMult: 0.8, heatMult: 1.5 } },
  { id: "ceramic", name: "Ceramic Plate", slot: "plate", rarity: "common", effect: { armour: 15 } },
];

/**
 * MATH-04 — XP and card pacing, one source of truth.
 * Level L costs `base * L * (L + 1) / 2` (300, 900, 1800, 3000, 4500 …), a kill pays
 * `xpPerKill`, damage pays `xpPerDamage` per point, and surviving pays `xpPerSecond`.
 * Everything else in the file reads these numbers; none of them are re-typed elsewhere.
 */
const CARD_PACING = {
  levelXpBase: 300,
  levelXpShape: "triangular",
  xpPerKill: 30,
  xpPerDamage: 1 / 25,
  xpPerSecond: 2,
  maxQueuedCards: 1,
  cardChoices: 3,
  firstCardSeconds: 22,       // design target: first card around 0:22 of an average run
  targetCardsPerMinute: 2.4,  // design target once the run is in full contact
};

export const TUNING = {
  reloadMeta: {
    startMult: 1.40,
    perLevelReduction: 0.06,
    perCardReduction: 0.14,
    minMult: 0.35,
  },
  // Map selection: "rotate" by seed+run, or "fixed" to honour the bay's arena choice (MAP-04)
  mapSelection: "rotate",

  // Player
  player: {
    maxHealth: 100,
    baseSpeed: 6.4,
    aimModeSpeedMult: 0.75,
    spinupSpeedMult: 0.8,
    bodyYawSmoothing: 14,
    gunPivotYawSmoothing: 16,
    // RESTORED 2026-10-30: shrinking this to 30 put the map's own cover ring (17-33 m) on the
    // boundary, so the fighter was clamped inside his own props and every outer asset was
    // unreachable. The arena is 54 m again; the spawn and ring code now respects it.
    arenaRadius: 54,
  },

  // Card pool (8)
  cards: CARD_POOL,

  // Weapons — 3 styles for M1 (Spray, Pierce, Cone)
  weapons: {
    spray: {
      style: "spray",
      family: "smg",
      damage: 6,
      cycle: 0.125,
      magazine: 30,
      reload: 1.1,
      range: 10.7,
      spread: 9,
      bloomPerShot: 0.5,
      maxBloom: 18,
      heatPerShot: 0,
      heatCap: 0,
      tracerColor: 0xffd57a,
      tracerLife: 0.075,
      muzzleFlashSize: 0.24,
      muzzleFlashLife: 0.06,
      recoilYaw: 0.008,
      recoilPitch: -0.004,
      hitFlashLife: 0.05,
      hitPause: 0.01,
      pierceLinger: 0,
      reloadPhases: [
        { name: "eject", duration: 0.15, angle: -15 },
        { name: "insert", duration: 0.4, angle: -15 },
        { name: "slap", duration: 0.2, angle: -10 },
        { name: "bolt", duration: 0.35, angle: 5 },
      ],
      swapDip: -30,
      swapSettle: 0.08,
      iconIndex: 0,
    },
    pierce: {
      style: "pierce",
      family: "marksman",
      damage: 34,
      cycle: 0.55,
      magazine: 8,
      reload: 1.6,
      range: 13.3,
      spread: 0.5,
      bloomPerShot: 0,
      maxBloom: 0,
      heatPerShot: 0,
      heatCap: 0,
      tracerColor: 0x6fe3ff,
      tracerLife: 0.12,
      muzzleFlashSize: 0.28,
      muzzleFlashLife: 0.08,
      recoilYaw: 0.015,
      recoilPitch: -0.01,
      hitFlashLife: 0.08,
      hitPause: 0.02,
      pierceLinger: 0.15,
      pierceCount: 3,
      reloadPhases: [
        { name: "lift", duration: 0.3, angle: 20 },
        { name: "pull", duration: 0.4, angle: 20 },
        { name: "push", duration: 0.4, angle: 15 },
        { name: "lock", duration: 0.5, angle: -5 },
      ],
      swapDip: -30,
      swapSettle: 0.12,
      iconIndex: 2,
    },
    cone: {
      style: "cone",
      family: "shotgun",
      damage: 7,
      pellets: 8,
      cycle: 0.9,
      magazine: 6,
      reload: 1.4,
      range: 8.0,
      falloffStart: 4.0,
      falloffEnd: 8.0,
      spread: 25,
      bloomPerShot: 0,
      maxBloom: 0,
      heatPerShot: 0,
      heatCap: 0,
      tracerColor: 0xff8a4a,
      tracerLife: 0.06,
      muzzleFlashSize: 0.35,
      muzzleFlashLife: 0.07,
      recoilYaw: 0.025,
      recoilPitch: -0.015,
      hitFlashLife: 0.04,
      hitPause: 0.01,
      multiHitFlashLife: 0.12,
      reloadPhases: [
        { name: "break", duration: 0.3, angle: -45 },
        { name: "eject", duration: 0.3, angle: -45 },
        { name: "load", duration: 0.5, angle: -30 },
        { name: "close", duration: 0.3, angle: 10 },
      ],
      swapDip: -35,
      swapSettle: 0.08,
      iconIndex: 1,
    },
  },

  // Weapon families for reload variants
  families: {
    smg: { reload: 1.1, phases: "magSlap" },
    marksman: { reload: 1.6, phases: "bolt" },
    shotgun: { reload: 1.4, phases: "breakOpen" },
    minigun: { reload: 2.4, phases: "belt" },
    beam: { reload: 1.2, phases: "cellSwap" },
    flamer: { reload: 1.8, phases: "drum" },
    rail: { reload: 2.1, phases: "breach" },
    sentry: { reload: 1.5, phases: "rack" },
  },

  // Heat system (for M2+ styles)
  heat: {
    ventRate: 40,
    ventDelay: 1.0,
    lockDuration: 2.4,
    lockThreshold: 100,
  },

  // Enemies
  enemies: {
    rifleman: {
      hp: 14,
      speed: 1.93,
      behaviour: "advance; melee on contact (9 dmg, 1.0 s cooldown)",
      meleeDamage: 9,
      meleeCooldown: 1.0,
      meleeRange: 1.5,
      xpValue: 10,
      scoreValue: 12,
    },
    sapper: {
      hp: 18,
      speed: 3.07,
      behaviour: "sprint; plant charge (40 dmg, 2.0 s fuse)",
      chargeDamage: 40,
      chargeFuse: 2.0,
      xpValue: 12,
      scoreValue: 12,
    },
    shieldbearer: {
      hp: 60,
      speed: 1.13,
      behaviour: "advance with frontal shield; melee (12 dmg); damage only from flank/rear",
      meleeDamage: 12,
      meleeCooldown: 1.2,
      meleeRange: 1.8,
      xpValue: 20,
      scoreValue: 12,
    },
    spotter: {
      hp: 22,
      speed: 1.53,
      behaviour: "advance; paint target (+15% accuracy, 5.0 s)",
      paintDuration: 5.0,
      accuracyBonus: 0.15,
      xpValue: 15,
      scoreValue: 12,
    },
    drone: {
      hp: 16,
      speed: 4.0,
      behaviour: "orbit; dive (18 dmg); explode on death (25 dmg, 3.0 u)",
      diveDamage: 18,
      diveCooldown: 3.0,
      explodeDamage: 25,
      explodeRadius: 3.0,
      xpValue: 15,
      scoreValue: 12,
    },
    mortar: {
      hp: 34,
      speed: 0.67,
      behaviour: "keep range; lob shell (30 dmg, 4.0 u radius, 1.5 s fuse)",
      shellDamage: 30,
      shellRadius: 4.0,
      shellFuse: 1.5,
      shellCooldown: 4.0,
      xpValue: 25,
      scoreValue: 12,
    },
    mech: {
      hp: 260,
      speed: 1.33,
      behaviour: "advance; minigun (8 dmg, 0.1 s) + stomp (50 dmg, 3.0 u)",
      minigunDamage: 8,
      minigunCycle: 0.1,
      stompDamage: 50,
      stompRadius: 3.0,
      stompCooldown: 5.0,
      xpValue: 100,
      scoreValue: 12,
    },
  },

  // Boss (separate from the 7-enemy roster)
  boss: {
    // TUNE-02: ground bosses are scaled from the bossHp() curve; that curve is tuned for a 34-damage
    // rifle and left them unkillable inside a 100 s run, so the spawned boss takes this multiplier.
    hpScale: 0.2,
    gunship: {
      // TUNE-04: the aerial boss is tuned for an 8-15 s TTK with an anti-air weapon, not the
      // +2600 flat HP that the ground boss uses. Flak: 22 x 2.6 = 57 per hit / 0.55 s = 104 DPS.
      hp: 900,
      attackRange: 26,
      altitude: 6.4,
      strafeSpeed: 4.0,
      cannonDamage: 40,
      cannonCycle: 0.8,
      mineDamage: 60,
      mineCooldown: 3.0,
      enrageThreshold: 0.3,
      enrageFireRateMult: 1.4,
      enrageSpeedMult: 1.2,
      behaviour: "strafe; drop mines (60 dmg); enrage at 30% HP (x1.4 fire, +20% speed)",
      xpValue: 500,
      scoreValue: 12,
    },
  },

  // Spawn / Director
  director: {
    beats: [
      // ROSTER RAMP: every board used to be rifleman-only until 158 s, and a normal run is 60-90 s,
      // so six of the eight archetypes were never seen. The roster now opens up inside the first
      // 90 s, in order of how much they ask of the player.
      { name: "Contact", start: 0, end: 35, spawnInterval: 1.2, enemyTypes: ["rifleman", "spotter"], maxConcurrent: 20 },
      { name: "Suppression", start: 35, end: 70, spawnInterval: 0.85, enemyTypes: ["rifleman", "spotter", "sapper"], maxConcurrent: 25, airdropAt: 55 },
      { name: "Breach", start: 70, end: 120, spawnInterval: 0.65, enemyTypes: ["rifleman", "sapper", "shieldbearer", "drone"], maxConcurrent: 30 },
      { name: "Blackout", start: 120, end: 128, spawnInterval: 0.4, enemyTypes: ["rifleman", "sapper", "shieldbearer", "spotter"], maxConcurrent: 40, blackout: true },
      { name: "CounterAttack", start: 128, end: 300, spawnInterval: 0.5, enemyTypes: ["rifleman", "shieldbearer", "mortar", "drone"], maxConcurrent: 50, airdropAt: 180 },
      { name: "BlackoutII", start: 300, end: 308, spawnInterval: 0.3, enemyTypes: ["rifleman", "sapper", "shieldbearer", "drone", "mortar"], maxConcurrent: 60, blackout: true },
      { name: "Siege", start: 308, end: 600, spawnInterval: 0.35, enemyTypes: ["rifleman", "shieldbearer", "mortar", "mech", "drone"], maxConcurrent: 80 },
      { name: "Gunship", start: 660, end: 720, spawnInterval: 0, enemyTypes: ["gunship"], maxConcurrent: 1 },
    ],
    baseSpawnInterval: 1.2,
    minSpawnInterval: 0.5,
    spawnIntervalDecay: 0.012,
    maxConcurrentBase: 8,
    maxConcurrentPerMinute: 3.2,
    maxConcurrentCap: 400,
    eliteChanceBase: 0,
    eliteChancePerMinute: 0.06,
    eliteChanceCap: 0.35,
  },

  // Airdrop
  airdrop: {
    interval: 90,
    warningTime: 2,
    parachuteDescentTime: 2.5,
    lidPopDelay: 0.3,
    optionsAppearDelay: 0.5,
    crateFoldTime: 0.4,
    itemFlyTime: 0.6,
    optionsCount: 2,
    weaponChance: 0.35,
    partChance: 0.65,
    partSlotWeights: { barrel: 20, magazine: 20, optic: 15, underbarrel: 15, receiver: 15, plate: 15 },
    rarityWeights: { common: 70, rare: 25, evolution: 5 },
  },

  // Level-up / Parts
  progression: {
    cards: CARD_POOL,
    xpPerKill: CARD_PACING.xpPerKill,
    xpPerDamage: CARD_PACING.xpPerDamage,
    xpPerSecond: CARD_PACING.xpPerSecond,
    levelBaseXp: CARD_PACING.levelXpBase,
    maxQueuedCards: CARD_PACING.maxQueuedCards,
    cardChoices: CARD_PACING.cardChoices,
    cardPacing: CARD_PACING,
    parts: {
      barrel: [
        { id: "long_barrel", name: "Long Barrel", rarity: "common", effect: { rangeMult: 1.25, spreadMult: 0.8 } },
        { id: "choke", name: "Choke", rarity: "common", effect: { spreadMult: 0.6, rangeMult: 0.9 } },
        { id: "suppressor", name: "Suppressor", rarity: "rare", effect: { soundSuppressed: true, aggroMult: 0.5, rangeMult: 0.95 } },
        { id: "muzzle_brake", name: "Muzzle Brake", rarity: "common", effect: { recoilMult: 0.6, bloomMult: 1.2 } },
        { id: "compensator", name: "Compensator", rarity: "common", effect: { recoilMult: 0.7, bloomMult: 1.1 } },
        { id: "flash_hider", name: "Flash Hider", rarity: "common", effect: { muzzleFlashMult: 0.3, aggroMult: 0.8 } },
      ],
      magazine: [
        { id: "drum_mag", name: "Drum Magazine", rarity: "common", effect: { magMult: 2.0, reloadMult: 1.3 } },
        { id: "fast_mag", name: "Fast Mag", rarity: "common", effect: { reloadMult: 0.7, magMult: 0.9 } },
        { id: "ap_rounds", name: "AP Rounds", rarity: "rare", effect: { pierceCount: 1, damageMult: 0.9 } },
        { id: "incendiary", name: "Incendiary Rounds", rarity: "rare", effect: { burnDps: 3, burnDuration: 3 } },
        { id: "extended_mag", name: "Extended Mag", rarity: "common", effect: { magMult: 1.5, reloadMult: 1.1 } },
        { id: "tracer_mag", name: "Tracer Mag", rarity: "common", effect: { tracerVisible: true, aggroMult: 1.2 } },
      ],
      optic: [
        { id: "red_dot", name: "Red Dot", rarity: "common", effect: { aimSpreadMult: 0.7, aimSpeedMult: 1.1 } },
        { id: "scope_4x", name: "4× Scope", rarity: "rare", effect: { aimSpreadMult: 0.4, aimSpeedMult: 0.8, rangeMult: 1.3 } },
        { id: "thermal", name: "Thermal Optic", rarity: "rare", effect: { revealCloaked: true, aimSpreadMult: 0.8 } },
        { id: "holographic", name: "Holographic", rarity: "common", effect: { aimSpreadMult: 0.6, aimSpeedMult: 1.0 } },
      ],
      underbarrel: [
        { id: "foregrip", name: "Foregrip", rarity: "common", effect: { recoilMult: 0.7, bloomMult: 0.8 } },
        { id: "bipod", name: "Bipod", rarity: "rare", effect: { stationarySpreadMult: 0.3, stationaryRecoilMult: 0.2, moveSpreadMult: 1.5 } },
        { id: "grenade_tube", name: "Grenade Tube", rarity: "rare", effect: { secondaryGrenade: true, grenadeCooldown: 8 } },
        { id: "laser", name: "Laser Pointer", rarity: "common", effect: { hipSpreadMult: 0.8, aggroMult: 1.1 } },
      ],
      receiver: [
        { id: "binary_trigger", name: "Binary Trigger", rarity: "rare", effect: { burstCount: 2, cycleMult: 0.6 } },
        { id: "overclock", name: "Overclock", rarity: "rare", effect: { cycleMult: 0.8, heatMult: 1.5 } },
        { id: "stabiliser", name: "Stabiliser", rarity: "common", effect: { bloomMult: 0.6, cycleMult: 1.1 } },
        { id: "lightened_bolt", name: "Lightened Bolt", rarity: "common", effect: { cycleMult: 0.9, damageMult: 0.95 } },
      ],
      plate: [
        { id: "ceramic", name: "Ceramic Plate", rarity: "common", effect: { armour: 15 } },
        { id: "spall_liner", name: "Spall Liner", rarity: "common", effect: { armour: 10, bleedReduction: 0.5 } },
        { id: "medkit_rig", name: "Medkit Rig", rarity: "rare", effect: { healOnKill: 8, maxHealth: 100 } },
        { id: "reactive", name: "Reactive Armour", rarity: "rare", effect: { armour: 15, reflectMelee: true } },
      ],
    },
    evolutions: {
      bank_shot: { name: "Bank Shot", requires: { style: "ricochet", parts: ["ap_rounds", "muzzle_brake"] }, effect: { seekTarget: true } },
      cutting_torch: { name: "Cutting Torch", requires: { style: "beam", parts: ["overclock", "stabiliser"] }, effect: { sweepWithMovement: true } },
      firebreak: { name: "Firebreak", requires: { style: "flamer", parts: ["incendiary", "extended_mag"] }, effect: { spreadBurn: true } },
    },
  },

  // Scoring
  scoring: {
    killScore: 12,
    damageScoreMult: 0.12,
    timeScore: 6,
    multiplier: {
      base: 1,
      perBlackout: 0.1,
      perEvolution: 0.08,
      perAirdrop: 0.05,
      cap: 3.0,
    },
    unlockThreshold: 25000,
    maxUnlocksPerRun: 3,
    totalUnlocks: 12,
  },

  // Difficulty scaling
  difficulty: {
    // TUNE-02: base HP is authored for one-shot kills on paper; the arena needs bodies that live
    // long enough to use their cooldowns, so the curve multiplies the whole roster.
    hpMult: 3.0,
    hpScaling: 0.24,
    speedScaling: 0.05,
    speedCap: 1.45,
    spawnBudgetBase: 8,
    spawnBudgetPerMinute: 3.2,
    spawnBudgetCap: 400,
    eliteChanceBase: 0,
    eliteChancePerMinute: 0.06,
    eliteChanceCap: 0.35,
  },

  // Aim mode
  aimMode: {
    windUp: 0.6,
    windDown: 0.25,
    spreadReduction: 0.5,
    speedReduction: 0.25,
  },

  // Swap
  swap: {
    duration: 0.15,
    settle: 0.08,
  },

  // Card pick
  card: {
    scaleUpDuration: 0.2,
    scaleUpPeak: 1.12,
    typeOutDuration: 0.4,
    chosenScale: 1.2,
    rejectFadeDuration: 0.3,
  },

  // Death / Results
  death: {
    slowMoDuration: 0.5,
    slowMoTimescale: 0.2,
  },

  // Visual / Feel
  feel: {
    tracerPoolSize: 800,
    particleCap: 400,
    // 6 recycled the whole pool inside a single SMG burst; 24 lets a mag's worth of brass lie on the deck
    casingCap: 24,
    groundFireCap: 24,
    groundFireLife: 4,
    screenShakeHeavyOnly: true,
  },
};

/* --- added for WPN-01..03: anti-air, breacher, heavy rail -------------------------------- */
Object.assign(TUNING.weapons, {
  // MGR-06 / MATH-04: the nine styles that used to fall back to spray stats now have their own
  // numbers, so the manager can show real damage/RPM/mag and loadout choice actually changes play.
  ricochet: {
    ...TUNING.weapons.spray, style: "ricochet", family: "carbine", damage: 20, cycle: 0.42,
    magazine: 12, reload: 1.5, range: 15, spread: 2.5, bloomPerShot: 0, maxBloom: 0,
    tracerColor: 0xa6ff7a, tracerLife: 0.09, muzzleFlashSize: 0.3,
  },
  burst: {
    ...TUNING.weapons.spray, style: "burst", family: "rifle", damage: 18, cycle: 0.62,
    magazine: 24, reload: 1.9, range: 18, spread: 2, bloomPerShot: 0, maxBloom: 0,
    tracerColor: 0xffe36f, tracerLife: 0.1, muzzleFlashSize: 0.3,
  },
  beam: {
    ...TUNING.weapons.spray, style: "beam", family: "beam", damage: 9, cycle: 0.09,
    magazine: 60, reload: 1.2, range: 16, spread: 1, bloomPerShot: 0, maxBloom: 0,
    tracerColor: 0x6fe3ff, tracerLife: 0.05, muzzleFlashSize: 0.26,
  },
  chain: {
    ...TUNING.weapons.spray, style: "chain", family: "arc", damage: 12, cycle: 0.22,
    magazine: 20, reload: 1.6, range: 13, spread: 2, bloomPerShot: 0, maxBloom: 0,
    tracerColor: 0xc6a4ff, tracerLife: 0.08,
  },
  spinup: {
    ...TUNING.weapons.spray, style: "spinup", family: "minigun", damage: 7, cycle: 0.07,
    magazine: 100, reload: 2.4, range: 12, spread: 12, bloomPerShot: 0.4, maxBloom: 16,
    tracerColor: 0xff5a5a, tracerLife: 0.06,
  },
  rail: {
    ...TUNING.weapons.spray, style: "rail", family: "rail", damage: 120, cycle: 1.6,
    magazine: 4, reload: 2.1, range: 34, spread: 0.2, pierceCount: 2, bloomPerShot: 0, maxBloom: 0,
    tracerColor: 0xf2f8ff, tracerLife: 0.12, muzzleFlashSize: 0.5,
  },
  flamer: {
    ...TUNING.weapons.spray, style: "flamer", family: "flamer", damage: 4, cycle: 0.05,
    magazine: 120, reload: 1.8, range: 6.5, spread: 20, bloomPerShot: 0, maxBloom: 0,
    tracerColor: 0xffa23c, tracerLife: 0.05, muzzleFlashSize: 0.4,
  },
  arc: {
    ...TUNING.weapons.spray, style: "arc", family: "launcher", damage: 60, cycle: 1.1,
    magazine: 5, reload: 2.6, range: 12, spread: 0, bloomPerShot: 0, maxBloom: 0,
    tracerColor: 0xff6fd6, tracerLife: 0.14, muzzleFlashSize: 0.4,
  },
  sentry: {
    ...TUNING.weapons.spray, style: "sentry", family: "sentry", damage: 8, cycle: 0.15,
    magazine: 40, reload: 1.5, range: 14, spread: 4, bloomPerShot: 0, maxBloom: 0,
    tracerColor: 0x6fff9a, tracerLife: 0.08,
  },
  flak: {
    ...TUNING.weapons.burst,
    style: "flak", family: "aa", damage: 22, cycle: 0.55, magazine: 10, reload: 1.8,
    range: 34, spread: 2.2, bloomPerShot: 0.2, maxBloom: 4,
    tracerColor: 0xffb347, tracerLife: 0.09, muzzleFlashSize: 0.34, muzzleFlashLife: 0.07,
    airDamageMult: 2.6, groundDamageMult: 0.45,
  },
  breach: {
    ...TUNING.weapons.cone,
    style: "breach", family: "shotgun", damage: 11, cycle: 0.78, magazine: 5, reload: 2.6,
    range: 6.2, spread: 16, bloomPerShot: 0.9, maxBloom: 24,
    tracerColor: 0xff8a4a, tracerLife: 0.06, muzzleFlashSize: 0.42, muzzleFlashLife: 0.09,
    shieldPierce: 0.7,
  },
  rail2: {
    ...TUNING.weapons.rail,
    style: "rail2", family: "rail", damage: 190, cycle: 2.1, magazine: 2, reload: 3.4,
    range: 40, pierceCount: 3,
    tracerColor: 0xf2f8ff, tracerLife: 0.12, muzzleFlashSize: 0.5, muzzleFlashLife: 0.1,
  },
});
