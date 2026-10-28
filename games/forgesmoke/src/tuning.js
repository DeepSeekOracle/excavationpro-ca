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

export const TUNING = {
  reloadMeta: {
    startMult: 1.40,
    perLevelReduction: 0.06,
    perCardReduction: 0.14,
    minMult: 0.35,
  },
  // Player
  player: {
    maxHealth: 100,
    baseSpeed: 6.4,
    aimModeSpeedMult: 0.75,
    spinupSpeedMult: 0.8,
    bodyYawSmoothing: 14,
    gunPivotYawSmoothing: 16,
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
    gunship: {
      hp: 2600,
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
      { name: "Contact", start: 0, end: 45, spawnInterval: 1.2, enemyTypes: ["rifleman"], maxConcurrent: 20 },
      { name: "Suppression", start: 45, end: 90, spawnInterval: 0.8, enemyTypes: ["rifleman"], maxConcurrent: 25, airdropAt: 90 },
      { name: "Breach", start: 90, end: 150, spawnInterval: 0.6, enemyTypes: ["rifleman", "sapper"], maxConcurrent: 30 },
      { name: "Blackout", start: 150, end: 158, spawnInterval: 0.4, enemyTypes: ["rifleman", "sapper", "shieldbearer"], maxConcurrent: 40, blackout: true },
      { name: "CounterAttack", start: 158, end: 360, spawnInterval: 0.5, enemyTypes: ["rifleman", "shieldbearer", "mortar"], maxConcurrent: 50, airdropAt: 270 },
      { name: "BlackoutII", start: 360, end: 368, spawnInterval: 0.3, enemyTypes: ["rifleman", "sapper", "shieldbearer", "drone"], maxConcurrent: 60, blackout: true },
      { name: "Siege", start: 368, end: 660, spawnInterval: 0.35, enemyTypes: ["rifleman", "shieldbearer", "mortar", "mech"], maxConcurrent: 80 },
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
    xpPerKill: 10,
    xpPerDamage: 1 / 25,
    xpPerSecond: 2,
    levelBaseXp: 300,
    maxQueuedCards: 1,
    cardChoices: 3,
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
    hpScaling: 0.18,
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
    casingCap: 6,
    groundFireCap: 24,
    groundFireLife: 4,
    screenShakeHeavyOnly: true,
  },
};