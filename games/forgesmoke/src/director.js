/**
 * Beat director — manages wave phases, airdrops, difficulty scaling.
 * Pure logic, no rendering.
 */

import { TUNING } from "./tuning.js?v=202610323p";
import { spawnBudget, eliteChance, spawnInterval } from "./balance.js?v=202610323p";

export const BEAT_NAMES = {
  CONTACT: "Contact",
  SUPPRESSION: "Suppression",
  BREACH: "Breach",
  BLACKOUT: "Blackout",
  COUNTER_ATTACK: "Counter-attack",
  BLACKOUT_II: "Blackout II",
  SIEGE: "Siege",
  Gunship: "Gunship",
  OVERTIME: "Overtime",
};

export class BeatDirector {
  constructor(rng) {
    this.rng = rng;
    this.beats = TUNING.director.beats;
    this.currentBeatIndex = 0;
    this.beatTimer = 0;
    this.runTime = 0;
    this.blackoutActive = false;
    this.blackoutTimer = 0;
    this.airdropTimer = 0;
    this.airdropWarningGiven = false;
    this.airdropPending = false;
    this.airdropCrate = null;
    this.airdropOptions = null;
    this.airdropPicked = false;
    this.killsThisBeat = 0;
    this.damageThisBeat = 0;
  }

  /** Get current beat config. */
  getCurrentBeat() {
    if (this.currentBeatIndex >= this.beats.length) {
      // Overtime - use last beat with scaling
      const lastBeat = this.beats[this.beats.length - 1];
      return {
        ...lastBeat,
        name: BEAT_NAMES.OVERTIME,
        start: this.beats[this.beats.length - 1].end,
        end: Infinity,
      };
    }
    return this.beats[this.currentBeatIndex];
  }

  /** Update director. Returns events that occurred. */
  update(dt, playerPos, enemyManager, weaponManager) {
    this.runTime += dt;
    this.beatTimer += dt;
    const beat = this.getCurrentBeat();
    const events = [];

    // Check beat transition
    if (this.runTime >= beat.end && this.currentBeatIndex < this.beats.length - 1) {
      this.currentBeatIndex++;
      this.beatTimer = 0;
      this.killsThisBeat = 0;
      this.damageThisBeat = 0;
      events.push({ type: "beatChange", beat: this.getCurrentBeat() });
    }

    // Handle blackout
    if (beat.blackout && !this.blackoutActive) {
      this.blackoutActive = true;
      this.blackoutTimer = 8.0; // 8 seconds
      events.push({ type: "blackoutStart", duration: 8.0 });
    }
    if (this.blackoutActive) {
      this.blackoutTimer -= dt;
      if (this.blackoutTimer <= 0) {
        this.blackoutActive = false;
        events.push({ type: "blackoutEnd" });
      }
    }

    // Handle airdrop
    if (beat.airdropAt && this.runTime >= beat.airdropAt - TUNING.airdrop.warningTime && !this.airdropWarningGiven) {
      this.airdropWarningGiven = true;
      events.push({ type: "airdropWarning", timeUntilDrop: TUNING.airdrop.warningTime });
    }
    if (beat.airdropAt && this.runTime >= beat.airdropAt && !this.airdropPending) {
      this.airdropPending = true;
      this.airdropTimer = 0;
      this.airdropWarningGiven = false;
      this.airdropOptions = weaponManager.generateAirdropOptions();
      events.push({ type: "airdropSpawn", options: this.airdropOptions });
    }

    // Airdrop crate animation phases
    if (this.airdropPending && !this.airdropPicked) {
      this.airdropTimer += dt;
      if (this.airdropTimer >= TUNING.airdrop.parachuteDescentTime && !this.airdropCrate) {
        // Crate landed, lid pop after delay
        events.push({ type: "airdropLanded" });
      }
    }

    // Update difficulty scaling
    const timeMinutes = this.runTime / 60;
    const budget = spawnBudget(timeMinutes);
    const elite = eliteChance(timeMinutes);
    const interval = spawnInterval(this.runTime);

    enemyManager.setMaxConcurrent(budget);
    // Spawn interval will be used by enemy manager

    // Track elite chance for spawning
    this.currentEliteChance = elite;
    this.currentSpawnInterval = interval;

    return events;
  }

  /** Pick airdrop option (0 or 1). */
  pickAirdrop(index, weaponManager) {
    if (!this.airdropOptions || this.airdropPicked) return null;
    if (index < 0 || index >= this.airdropOptions.length) return null;

    const option = this.airdropOptions[index];
    this.airdropPicked = true;
    this.airdropPending = false;

    if (option.type === "weapon") {
      // Replace inactive weapon
      const inactiveSlot = weaponManager.activeSlot === "primary" ? "secondary" : "primary";
      weaponManager.replaceWeapon(inactiveSlot, option.style);
    } else if (option.type === "part") {
      // Apply to active weapon (or let player choose - simplified to active)
      weaponManager.applyPart(weaponManager.activeSlot, option.part);
    }

    this.airdropOptions = null;
    this.airdropCrate = null;
    return option;
  }

  /** Get beat progress 0-1. */
  getBeatProgress() {
    const beat = this.getCurrentBeat();
    if (beat.end === Infinity) return 1;
    const elapsed = this.runTime - beat.start;
    return Math.max(0, Math.min(1, elapsed / (beat.end - beat.start)));
  }

  /** Get time remaining in current beat. */
  getBeatTimeRemaining() {
    const beat = this.getCurrentBeat();
    if (beat.end === Infinity) return Infinity;
    return Math.max(0, beat.end - this.runTime);
  }

  /** Get run time formatted. */
  getRunTimeFormatted() {
    const mins = Math.floor(this.runTime / 60);
    const secs = Math.floor(this.runTime % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  /** Get blackout state. */
  getBlackoutState() {
    return {
      active: this.blackoutActive,
      timer: this.blackoutTimer,
      progress: this.blackoutActive ? 1 - this.blackoutTimer / 8.0 : 0,
    };
  }

  /** Get airdrop state. */
  getAirdropState() {
    return {
      pending: this.airdropPending,
      picked: this.airdropPicked,
      options: this.airdropOptions,
      timer: this.airdropTimer,
      warningGiven: this.airdropWarningGiven,
    };
  }

  /** Serialize for save. */
  serialize() {
    return {
      currentBeatIndex: this.currentBeatIndex,
      beatTimer: this.beatTimer,
      runTime: this.runTime,
      blackoutActive: this.blackoutActive,
      blackoutTimer: this.blackoutTimer,
      airdropTimer: this.airdropTimer,
      airdropWarningGiven: this.airdropWarningGiven,
      airdropPending: this.airdropPending,
      airdropPicked: this.airdropPicked,
      airdropOptions: this.airdropOptions,
      killsThisBeat: this.killsThisBeat,
      damageThisBeat: this.damageThisBeat,
      currentEliteChance: this.currentEliteChance,
      currentSpawnInterval: this.currentSpawnInterval,
    };
  }

  /** Deserialize from save. */
  static deserialize(data, rng) {
    const director = new BeatDirector(rng);
    director.currentBeatIndex = data.currentBeatIndex;
    director.beatTimer = data.beatTimer;
    director.runTime = data.runTime;
    director.blackoutActive = data.blackoutActive;
    director.blackoutTimer = data.blackoutTimer;
    director.airdropTimer = data.airdropTimer;
    director.airdropWarningGiven = data.airdropWarningGiven;
    director.airdropPending = data.airdropPending;
    director.airdropPicked = data.airdropPicked;
    director.airdropOptions = data.airdropOptions;
    director.killsThisBeat = data.killsThisBeat;
    director.damageThisBeat = data.damageThisBeat;
    director.currentEliteChance = data.currentEliteChance;
    director.currentSpawnInterval = data.currentSpawnInterval;
    return director;
  }
}

/** Scoring system. */
export class ScoreSystem {
  constructor() {
    this.kills = 0;
    this.damageDealt = 0;
    this.blackoutsSurvived = 0;
    this.evolutions = 0;
    this.airdropsTaken = 0;
    this.runStartTime = 0;
  }

  /** Record a kill. */
  recordKill(scoreValue = 12) {
    this.kills++;
  }

  /** Record damage dealt. */
  recordDamage(amount) {
    this.damageDealt += amount;
  }

  /** Record blackout survived. */
  recordBlackout() {
    this.blackoutsSurvived++;
  }

  /** Record evolution unlocked. */
  recordEvolution() {
    this.evolutions++;
  }

  /** Record airdrop taken. */
  recordAirdrop() {
    this.airdropsTaken++;
  }

  /** Get current multiplier. */
  getMultiplier() {
    return 1 +
      TUNING.scoring.multiplier.perBlackout * this.blackoutsSurvived +
      TUNING.scoring.multiplier.perEvolution * this.evolutions +
      TUNING.scoring.multiplier.perAirdrop * this.airdropsTaken;
  }

  /** Get current score (live). */
  getCurrentScore(runTime) {
    const mult = this.getMultiplier();
    return Math.floor((
      this.kills * TUNING.scoring.killScore +
      this.damageDealt * TUNING.scoring.damageScoreMult +
      runTime * TUNING.scoring.timeScore
    ) * mult);
  }

  /** Get final score breakdown for results screen. */
  getBreakdown(runTime) {
    const baseKills = this.kills * TUNING.scoring.killScore;
    const baseDamage = this.damageDealt * TUNING.scoring.damageScoreMult;
    const baseTime = runTime * TUNING.scoring.timeScore;
    const base = baseKills + baseDamage + baseTime;
    const mult = this.getMultiplier();
    const final = Math.floor(base * mult);

    return {
      kills: this.kills,
      killScore: baseKills,
      damage: this.damageDealt,
      damageScore: baseDamage,
      time: runTime,
      timeScore: baseTime,
      baseScore: base,
      multiplier: mult,
      finalScore: final,
      blackoutsSurvived: this.blackoutsSurvived,
      evolutions: this.evolutions,
      airdropsTaken: this.airdropsTaken,
      unlockTokens: Math.min(TUNING.scoring.maxUnlocksPerRun, Math.floor(final / TUNING.scoring.unlockThreshold)),
    };
  }

  /** Serialize for save. */
  serialize() {
    return {
      kills: this.kills,
      damageDealt: this.damageDealt,
      blackoutsSurvived: this.blackoutsSurvived,
      evolutions: this.evolutions,
      airdropsTaken: this.airdropsTaken,
      runStartTime: this.runStartTime,
    };
  }

  /** Deserialize from save. */
  static deserialize(data) {
    const sys = new ScoreSystem();
    sys.kills = data.kills;
    sys.damageDealt = data.damageDealt;
    sys.blackoutsSurvived = data.blackoutsSurvived;
    sys.evolutions = data.evolutions;
    sys.airdropsTaken = data.airdropsTaken;
    sys.runStartTime = data.runStartTime;
    return sys;
  }
}

/** Results screen data. */
export class ResultsScreen {
  constructor(scoreSystem, runTime, health, waveReached, cleared = false) {
    this.cleared = Boolean(cleared);
    this.breakdown = scoreSystem.getBreakdown(runTime);
    this.runTime = runTime;
    this.health = health;
    this.waveReached = waveReached;
    this.threatsDown = scoreSystem.kills;
  }

  /** Get formatted results for HUD. */
  getFormatted() {
    const tidy = (n) => {
      const v = Math.round((Number(n) || 0) * 10) / 10;
      return Number.isInteger(v) ? String(v) : v.toFixed(1);
    };
    return {
      title: this.cleared ? "SECTOR CLEARED" : "PERIMETER LOST",
      threatsDown: this.threatsDown,
      timeSurvived: this.formatTime(this.runTime),
      scoreBreakdown: {
        kills: `${this.breakdown.kills} × ${TUNING.scoring.killScore} = ${this.breakdown.killScore}`,
        damage: `${Math.floor(this.breakdown.damage)} × ${TUNING.scoring.damageScoreMult} = ${Math.floor(this.breakdown.damageScore)}`,
        time: `${Math.floor(this.runTime)}s × ${TUNING.scoring.timeScore} = ${tidy(this.breakdown.timeScore)}`,
        base: tidy(this.breakdown.baseScore),
        multiplier: `×${this.breakdown.multiplier.toFixed(2)}`,
        final: tidy(this.breakdown.finalScore),
      },
      unlockTokens: this.breakdown.unlockTokens,
      multiplierDetails: {
        blackouts: this.breakdown.blackoutsSurvived,
        evolutions: this.breakdown.evolutions,
        airdrops: this.breakdown.airdropsTaken,
      },
    };
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
}