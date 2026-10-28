/**
 * Save system — localStorage schema, corruption handling.
 * Pure logic, no rendering.
 */

export const SAVE_KEY = "forge-smoke/v1";
export const SAVE_VERSION = 2;

/**
 * v2 adds `profile`: the cyborg manager's permanent state (level, xp, unlocks, equipped loadout).
 * v1 saves migrate in place — best score / best time / settings / unlocks are preserved.
 */
export const DEFAULT_PROFILE = {
  level: 1,
  xp: 0,
  runs: 0,
  arenasCleared: 0,
  bestRunTime: 0,
  legacy: [],                 // permanent unlocks: light cards, perks, legendary drops
  talentPoints: 6,            // spend in the Special Operations tree
  talents: [],                // allocated node ids
  trials: {},                 // boss id -> best round count
  equipped: {
    weapon: "spray",
    secondary: "pierce",
    lightMods: [],            // card ids the player wants to start with (owned only)
    perks: [],
  },
};

export const DEFAULT_SAVE = {
  version: SAVE_VERSION,
  bestScore: 0,
  bestTime: 0,
  unlocks: [],
  profile: { ...DEFAULT_PROFILE },
  settings: {
    mute: false,
    reducedMotion: false,
    colourBlind: false,
    masterVolume: 0.8,
    sfxVolume: 1.0,
    musicVolume: 0.6,
    sensitivity: 1.0,
    quality: "low",
    showFPS: false,
    fullscreen: false,
    keymap: {},
  },
};

/** XP required to reach the next level (gentle curve, capped growth). */
export function xpForLevel(level) {
  return Math.round(110 * Math.pow(1.28, Math.max(0, level - 1)));
}

/** Merge a stored profile over the defaults so a partial v1.5 profile still loads. */
function normalizeProfile(profile) {
  const merged = { ...DEFAULT_PROFILE, ...(profile || {}) };
  merged.equipped = { ...DEFAULT_PROFILE.equipped, ...(merged.equipped || {}) };
  merged.equipped.lightMods = Array.isArray(merged.equipped.lightMods) ? merged.equipped.lightMods : [];
  merged.equipped.perks = Array.isArray(merged.equipped.perks) ? merged.equipped.perks : [];
  merged.legacy = Array.isArray(merged.legacy) ? merged.legacy : [];
  merged.talents = Array.isArray(merged.talents) ? merged.talents : [];
  merged.trials = (merged.trials && typeof merged.trials === "object") ? merged.trials : {};
  if (typeof merged.talentPoints !== "number") merged.talentPoints = 6;
  return merged;
}

/** Add XP to the profile, levelling up as many times as the total allows. */
export function addProfileXp(profile, amount) {
  const p = normalizeProfile(profile);
  p.xp += Math.max(0, Math.round(amount));
  let levelled = 0;
  while (p.xp >= xpForLevel(p.level)) {
    p.xp -= xpForLevel(p.level);
    p.level += 1;
    levelled += 1;
    if (p.level > 60) break;
  }
  return { profile: p, levelled };
}

/** Grant a permanent unlock (idempotent). */
export function grantLegacy(profile, id) {
  const p = normalizeProfile(profile);
  if (!p.legacy.includes(id)) p.legacy.push(id);
  return p;
}

/** Validate save data structure. */
export function validateSave(data) {
  if (!data || typeof data !== "object") return false;
  if (data.version !== 1 && data.version !== SAVE_VERSION) return false;
  if (typeof data.bestScore !== "number") return false;
  if (typeof data.bestTime !== "number") return false;
  if (!Array.isArray(data.unlocks)) return false;
  if (!data.settings || typeof data.settings !== "object") return false;
  return true;
}

/** Load save from localStorage. Returns parsed save or default. */
export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE, profile: normalizeProfile(null) };
    const parsed = JSON.parse(raw);
    if (!validateSave(parsed)) {
      console.warn("Save data invalid, resetting to defaults");
      return { ...DEFAULT_SAVE, profile: normalizeProfile(null) };
    }
    // migrate v1 -> v2 in place: same key, profile added
    const migrated = { ...DEFAULT_SAVE, ...parsed, version: SAVE_VERSION };
    migrated.profile = normalizeProfile(parsed.profile);
    return migrated;
  } catch (e) {
    console.warn("Failed to load save, resetting to defaults:", e);
    return { ...DEFAULT_SAVE, profile: normalizeProfile(null) };
  }
}

/** Save the cyborg profile (level/xp/unlocks/loadout). */
export function saveProfile(profile) {
  const save = loadSave();
  save.profile = normalizeProfile(profile);
  saveSave(save);
  return save.profile;
}

/** Save data to localStorage. */
export function saveSave(data) {
  try {
    const validated = { ...DEFAULT_SAVE, ...data };
    validated.version = SAVE_VERSION;
    localStorage.setItem(SAVE_KEY, JSON.stringify(validated));
    return true;
  } catch (e) {
    console.error("Failed to save:", e);
    return false;
  }
}

/** Update best score. */
export function updateBestScore(score) {
  const save = loadSave();
  if (score > save.bestScore) {
    save.bestScore = score;
    saveSave(save);
    return true;
  }
  return false;
}

/** Update best time. */
export function updateBestTime(time) {
  const save = loadSave();
  if (time > save.bestTime) {
    save.bestTime = time;
    saveSave(save);
    return true;
  }
  return false;
}

/** Add unlock token. */
export function addUnlock(tokenId) {
  const save = loadSave();
  if (!save.unlocks.includes(tokenId) && save.unlocks.length < 12) {
    save.unlocks.push(tokenId);
    saveSave(save);
    return true;
  }
  return false;
}

/** Check if unlock owned. */
export function hasUnlock(tokenId) {
  const save = loadSave();
  return save.unlocks.includes(tokenId);
}

/** Get all unlocks. */
export function getUnlocks() {
  const save = loadSave();
  return [...save.unlocks];
}

/** Update settings. */
export function updateSettings(settings) {
  const save = loadSave();
  save.settings = { ...save.settings, ...settings };
  saveSave(save);
  return save.settings;
}

/** Get settings. */
export function getSettings() {
  const save = loadSave();
  return { ...save.settings };
}

/** Reset save to defaults (for testing/corruption). */
export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  return { ...DEFAULT_SAVE };
}

/** Corrupt save for testing. */
export function corruptSave() {
  localStorage.setItem(SAVE_KEY, "corrupted data");
}

/** Export save for backup. */
export function exportSave() {
  return loadSave();
}

/** Import save from backup. */
export function importSave(data) {
  if (validateSave(data)) {
    saveSave(data);
    return true;
  }
  return false;
}