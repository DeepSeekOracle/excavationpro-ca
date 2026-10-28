/**
 * Menu Module Contract & UI State Controller
 * Responsibilities: UI state machine, navigation, overlays, settings
 * @module menu
 */

export const MenuState = {
  MAIN: "main",
  PAUSE: "pause",
  SETTINGS: "settings",
  GAME_OVER: "gameOver",
  LEVEL_SELECT: "levelSelect",
  CREDITS: "credits",
};

export function getDefaultSettings() {
  return {
    masterVolume: 0.8,
    sfxVolume: 1.0,
    musicVolume: 0.6,
    fullscreen: false,
    showFPS: false,
    controls: "keyboard",
  };
}

/**
 * Initialize menu system
 * @param {HTMLCanvasElement} [canvas] - Render target
 * @param {Object} [callbacks] - Event callbacks
 * @returns {Object} Controller instance
 */
export function createMenu(canvas = null, callbacks = {}) {
  let state = MenuState.MAIN;
  let visible = true;
  let settings = { ...getDefaultSettings() };

  return {
    canvas,
    get state() { return state; },
    get visible() { return visible; },
    get settings() { return settings; },
    show(nextState = MenuState.MAIN) {
      state = nextState;
      visible = true;
    },
    hide() {
      visible = false;
    },
    update(_dtMs = 16.67) {},
    render(_ctx2d) {},
    handleInput(key) {
      const k = String(key || "");
      if (state === MenuState.MAIN && (k === "Enter" || k === "Space" || k === "KeyW")) {
        visible = false;
        if (typeof callbacks.onStart === "function") callbacks.onStart();
        return true;
      }
      if (k === "Escape") {
        if (state === MenuState.PAUSE) {
          visible = false;
          if (typeof callbacks.onResume === "function") callbacks.onResume();
        } else {
          state = MenuState.PAUSE;
          visible = true;
        }
        return true;
      }
      if ((state === MenuState.GAME_OVER || state === MenuState.PAUSE) && (k === "KeyR" || k === "r")) {
        visible = false;
        if (typeof callbacks.onRestart === "function") callbacks.onRestart();
        return true;
      }
      return false;
    },
    updateSettings(patch = {}) {
      settings = { ...settings, ...patch };
      if (typeof callbacks.onSettingsChange === "function") callbacks.onSettingsChange(settings);
      return settings;
    },
    destroy() {
      visible = false;
    },
  };
}
