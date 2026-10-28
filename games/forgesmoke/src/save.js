/**
 * Save system — localStorage schema, corruption handling.
 * Pure logic, no rendering.
 */

export const SAVE_KEY = "forge-smoke/v1";
export const SAVE_VERSION = 1;

export const DEFAULT_SAVE = {
  version: SAVE_VERSION,
  bestScore: 0,
  bestTime: 0,
  unlocks: [],
  settings: {
    mute: false,
    reducedMotion: false,
    colourBlind: false,
    keymap: {},
  },
};

/** Validate save data structure. */
export function validateSave(data) {
  if (!data || typeof data !== "object") return false;
  if (data.version !== SAVE_VERSION) return false;
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
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = JSON.parse(raw);
    if (!validateSave(parsed)) {
      console.warn("Save data invalid, resetting to defaults");
      return { ...DEFAULT_SAVE };
    }
    return parsed;
  } catch (e) {
    console.warn("Failed to load save, resetting to defaults:", e);
    return { ...DEFAULT_SAVE };
  }
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