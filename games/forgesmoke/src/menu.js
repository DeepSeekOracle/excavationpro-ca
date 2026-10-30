/**
 * Menu Module Contract & UI State Controller
 * Responsibilities: UI state machine, navigation, overlays, settings, arena selection, unlock enforcement.
 * @module menu
 */
import { loadSave, saveSave, getSettings, updateSettings } from "./save.js?v=202610327g";

export const MenuState = {
  TITLE: "title",
  ARENA_SELECT: "arenaSelect",
  LOADOUT: "loadout",
  PLAYING: "playing",
  PAUSED: "paused",
  OPTIONS: "options",
  GAME_OVER: "gameOver",
  RESULTS: "results",
  CREDITS: "credits",
};

export const ARENAS = [
  { id: "arena1", name: "Perimeter", desc: "Beats 1-3 · Treeline Perimeter", reqScore: 0, defaultUnlocked: true },
  { id: "arena2", name: "Breach Yard", desc: "Beats 4-6 · Blackout Zone", reqScore: 1000, defaultUnlocked: false },
  { id: "arena3", name: "Gunship Pad", desc: "Beats 7-8 + Overtime · Boss Arena", reqScore: 5000, defaultUnlocked: false },
];

export function isArenaUnlocked(arenaId, save = loadSave()) {
  const arena = ARENAS.find(a => a.id === arenaId);
  if (!arena) return false;
  if (arena.defaultUnlocked) return true;
  if (save.bestScore >= arena.reqScore) return true;
  if (Array.isArray(save.unlocks) && save.unlocks.includes(arenaId)) return true;
  return false;
}

export function getDefaultSettings() {
  const saved = getSettings();
  return {
    masterVolume: saved.masterVolume ?? 0.8,
    sfxVolume: saved.sfxVolume ?? 1.0,
    musicVolume: saved.musicVolume ?? 0.6,
    sensitivity: saved.sensitivity ?? 1.0,
    quality: saved.quality ?? "low",
    showFPS: saved.showFPS ?? false,
    fullscreen: saved.fullscreen ?? false,
    ...saved,
  };
}

export function createMenu(canvas = null, callbacks = {}) {
  let state = MenuState.TITLE;
  let visible = true;
  let settings = { ...getDefaultSettings() };
  let selectedArenaIndex = 0;
  let selectedOptionIndex = 0;
  let optionsCaller = MenuState.TITLE;

  return {
    canvas,
    get state() { return state; },
    get visible() { return visible; },
    get settings() { return settings; },
    get selectedArenaIndex() { return selectedArenaIndex; },
    get selectedOptionIndex() { return selectedOptionIndex; },
    
    show(nextState = MenuState.TITLE) {
      state = nextState;
      visible = true;
    },
    hide() {
      visible = false;
    },
    setState(newState) {
      state = newState;
      visible = true;
    },
    setSelectedArenaIndex(idx) {
      selectedArenaIndex = Math.max(0, Math.min(ARENAS.length - 1, idx));
    },
    setSelectedOptionIndex(idx) {
      selectedOptionIndex = Math.max(0, Math.min(5, idx));
    },
    setOptionsCaller(caller) {
      optionsCaller = caller;
    },
    getOptionsCaller() {
      return optionsCaller;
    },
    updateSettings(patch = {}) {
      settings = { ...settings, ...patch };
      updateSettings(settings);
      if (typeof callbacks.onSettingsChange === "function") callbacks.onSettingsChange(settings);
      return settings;
    },
    destroy() {
      visible = false;
    },
  };
}
