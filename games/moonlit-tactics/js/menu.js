import { readSave, readSettings, writeSettings } from "./save.js";
import { setVolume as setRadioVolume } from "./radio.js";
import { setVolume as setSfxVolume } from "./sfx.js?v=20261007-buttons";

const CALLING = { cantor: "Cantor", warden: "Warden", kindler: "Kindler" };
const PLAY = ["begin", "title-hatchery", "start-cantor", "start-warden", "start-kindler", "menu-fight", "menu-drill", "menu-armory"];

let agreed = false;
let hooksRef = null;
let lastStart = 0;

function $(id) {
  return document.getElementById(id);
}

function savedCalling() {
  const read = readSave(localStorage);
  if (!read.ok) return { error: read.error };
  if (!read.doc) return { slot: null };
  const slot = read.doc.slots.find((row) => row && row.party && row.party.some((unit) => unit.id === "serenya" && unit.calling));
  return { slot: slot || null };
}

export function applySettings() {
  const settings = readSettings(localStorage);
  setRadioVolume(settings.music);
  setSfxVolume(settings.sfx);
  document.body.classList.toggle("reduce-motion", settings.reducedMotion === true);
  const music = $("opt-music");
  const sfx = $("opt-sfx");
  const motion = $("opt-motion");
  const musicOut = $("opt-music-out");
  const sfxOut = $("opt-sfx-out");
  if (music) music.value = String(Math.round(settings.music * 100));
  if (sfx) sfx.value = String(Math.round(settings.sfx * 100));
  if (motion) motion.checked = settings.reducedMotion === true;
  if (musicOut) musicOut.textContent = Math.round(settings.music * 100) + "%";
  if (sfxOut) sfxOut.textContent = Math.round(settings.sfx * 100) + "%";
  return settings;
}

export function refresh() {
  const found = savedCalling();
  const button = $("menu-continue");
  const note = $("menu-continue-note");
  if (!button || !note) return;
  if (found.error) {
    button.disabled = true;
    note.textContent = found.error;
    return;
  }
  if (!found.slot) {
    button.disabled = true;
    button.classList.add("is-locked");
    note.textContent = "No saved calling yet. New game writes one.";
    return;
  }
  const hero = found.slot.party && found.slot.party.find((unit) => unit.id === "serenya");
  if (!hero || !hero.calling) {
    button.disabled = true;
    note.textContent = "No saved calling yet. New game writes one.";
    return;
  }
  const name = CALLING[hero.calling] || hero.calling;
  button.disabled = false;
  button.classList.toggle("is-locked", !agreed);
  button.setAttribute("aria-disabled", agreed ? "false" : "true");
  note.textContent = name + " · " + found.slot.embers + " Embers. Resumes the saved page.";
}

function showLock(show) {
  const note = $("menu-lock");
  if (note) note.hidden = !show;
}

function rememberCredits(on) {
  try {
    if (on) sessionStorage.setItem("moonlit-credits", "1");
    else sessionStorage.removeItem("moonlit-credits");
  } catch (err) { /* storage can be blocked; the checkbox still counts */ }
}

function creditsOn() {
  const box = $("opt-credits");
  return !!(box && box.checked);
}

function runMode(run, id) {
  if (!creditsOn()) {
    showLock(true);
    const box = $("opt-credits");
    if (box) box.focus();
    return;
  }
  if (!agreed) sync(true);
  showLock(false);
  try {
    run(id);
  } catch (err) {
    const note = $("menu-lock");
    if (note) {
      note.hidden = false;
      note.textContent = "That mode did not open. Try it again.";
    }
  }
}

export function sync(next) {
  agreed = !!next;
  rememberCredits(agreed);
  const box = $("opt-credits");
  if (box) box.checked = agreed;
  PLAY.forEach((id) => {
    const node = $(id);
    if (!node) return;
    node.disabled = false;
    node.classList.toggle("is-locked", !agreed);
    node.removeAttribute("aria-disabled");
  });
  showLock(false);
  try { refresh(); } catch (err) { /* a bad save must not block the modes */ }
}

function showPanel(id) {
  ["menu-play", "menu-guide", "menu-options"].forEach((panel) => {
    const node = $(panel);
    if (node) node.hidden = panel !== id;
  });
  document.querySelectorAll(".menu-tabs button").forEach((button) => {
    button.classList.toggle("on", button.dataset.panel === id);
  });
}

function store(patch) {
  const settings = writeSettings(localStorage, patch);
  applySettings();
  return settings;
}

const MODE = {
  "menu-continue": "onContinue",
  "start-cantor": "onFresh",
  "start-warden": "onFresh",
  "start-kindler": "onFresh",
  begin: "onWalk",
  "title-hatchery": "onHatchery",
  "menu-fight": "onPractice",
  "menu-drill": "onDrill",
  "menu-armory": "onArmory"
};

export function activate(id) {
  if (!hooksRef || !id) return;
  if (id.indexOf("tab:") === 0) {
    showPanel(id.slice(4));
    return;
  }
  const name = MODE[id];
  const run = name && hooksRef[name];
  if (!run) return;
  if (id === "menu-continue" && $("menu-continue").disabled) return;
  const now = Date.now();
  const fresh = id.indexOf("start-") === 0;
  if (!fresh && now - lastStart < 450) return;
  lastStart = now;
  const box = $("opt-credits");
  if (box && !box.checked) box.checked = true;
  runMode(run, id);
}

export function bindMenu(hooks) {
  hooksRef = hooks;
  document.querySelectorAll(".menu-tabs button").forEach((button) => {
    button.addEventListener("click", () => activate("tab:" + button.dataset.panel));
  });
  Object.keys(MODE).forEach((id) => {
    const button = $(id);
    if (!button) return;
    button.disabled = id === "menu-continue" ? button.disabled : false;
    button.addEventListener("click", () => activate(id));
  });
  $("opt-music").addEventListener("input", () => store({ music: Number($("opt-music").value) / 100 }));
  $("opt-sfx").addEventListener("input", () => {
    const settings = store({ sfx: Number($("opt-sfx").value) / 100 });
    if (hooks.onSfx) hooks.onSfx(settings.sfx);
  });
  $("opt-motion").addEventListener("change", () => store({ reducedMotion: $("opt-motion").checked }));
  $("opt-credits").addEventListener("change", () => {
    sync($("opt-credits").checked);
    if (hooks.onCredits) hooks.onCredits(agreed);
  });
  try {
    applySettings();
    refresh();
  } catch (err) { /* settings must not stop the mode buttons */ }
}
