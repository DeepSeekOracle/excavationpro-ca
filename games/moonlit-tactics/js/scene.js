/* Story pages. One painting per beat. A loss sends her back to level. */

import * as sfx from "./sfx.js?v=20261007-buttons";

const NAMES = {
  serenya: "Serenya",
  emberion: "Emberion",
  lyra: "Lyra",
  bram: "Bram",
  nessa: "Nessa",
  miralis: "Miralis",
  corvath: "Corvath",
  shade: "Shade",
  kaelion: "Kaelion",
  harmonix: "Harmonix",
  aetheris: "Ætheris",
  sancora: "Sancora",
  lightfather: "Lightfather",
  eternis: "Eternis",
  orphiel: "Orphiel",
  arval: "Arval",
  aureon: "Aureon",
  genesis: "Genesis Bloom",
  volaris: "Volaris",
  mirror: "Infinity Mirror"
};

let beats = [];
let index = 0;
let hooks = { onFight() {}, onMenu() {}, onLevel() {}, onMark() {} };
let bound = false;
let openToken = 0;
let freshLock = false;
let playGen = 0;

function loftLocked() {
  return freshLock || globalThis.__valeFreshLock === true;
}

function cue(name) {
  try {
    const fn = sfx[name];
    if (typeof fn === "function") fn();
  } catch (_) { /* sound is optional */ }
}

function $(id) {
  return document.getElementById(id);
}

function novelFor(chapter) {
  if (chapter >= 49) return "book-4";
  if (chapter >= 33) return "book-3";
  if (chapter >= 16) return "book-2";
  return "book-1";
}

function loadBook(file) {
  return fetch(file).then((res) => (res.ok ? res.json() : { beats: [] })).catch(() => ({ beats: [] }));
}

function bind() {
  if (bound) return;
  bound = true;
  $("scene-next").addEventListener("click", () => {
    releaseLoft();
    cue("page");
    if (index >= beats.length - 1) hooks.onMenu();
    else {
      index += 1;
      paint();
    }
  });
  $("scene-fight").addEventListener("click", () => {
    releaseLoft();
    cue("ui");
    hooks.onFight();
  });
  $("scene-level").addEventListener("click", () => {
    releaseLoft();
    cue("ui");
    hooks.onLevel();
  });
  $("scene-menu").addEventListener("click", () => {
    releaseLoft();
    cue("ui");
    hooks.onMenu();
  });
}

function paintBubbles(beat) {
  const host = $("scene-bubbles");
  if (!host) return;
  host.textContent = "";
  const seen = {};
  const bottoms = { serenya: 64, emberion: 44, lyra: 66, bram: 58, nessa: 50, miralis: 60, corvath: 72, shade: 46 };
  (beat.speak || []).forEach((row) => {
    if (!row || !row.text) return;
    const who = row.who || "serenya";
    const n = seen[who] || 0;
    seen[who] = n + 1;
    const bubble = document.createElement("div");
    bubble.className = "scene-bubble who-" + who;
    if (n) bubble.style.bottom = (bottoms[who] || 50) + n * 12 + "%";
    const name = document.createElement("b");
    name.textContent = NAMES[row.who] || "";
    const say = document.createElement("p");
    say.textContent = row.text;
    bubble.append(name, say);
    host.appendChild(bubble);
  });
  if (beat.speak && beat.speak.length) cue("talk");
}

function paint() {
  const beat = beats[index];
  const stage = $("scene");
  if (!beat || !stage) return;
  stage.hidden = false;
  $("scene-plate").src = beat.plate;
  $("scene-kicker").textContent = beat.kicker || "";
  $("scene-line").textContent = beat.line || "";
  paintBubbles(beat);
  stage.classList.remove("is-turn");
  $("scene-line").classList.remove("is-turn");
  void stage.offsetWidth;
  stage.classList.add("is-turn");
  $("scene-line").classList.add("is-turn");
  const cast = new Set(beat.cast || []);
  $("scene-hero").hidden = !cast.has("serenya");
  $("scene-pet").hidden = !cast.has("emberion");
  $("scene-shade").hidden = !cast.has("shade");
  ["lyra", "bram", "nessa", "miralis", "corvath"].forEach((id) => {
    const node = $("scene-" + id);
    if (node) node.hidden = !cast.has(id);
  });
  const next = $("scene-next");
  const fight = $("scene-fight");
  const last = index >= beats.length - 1;
  if (beat.fight) {
    fight.hidden = false;
    fight.textContent = beat.fight;
  } else fight.hidden = true;
  if (!last && beat.next) {
    next.hidden = false;
    next.textContent = beat.next;
  } else next.hidden = true;
  const read = $("scene-read");
  if (read) {
    const novel = beat.novel || novelFor(beat.chapter || 0);
    read.href = "https://chatagent.ca/books/" + novel + "/";
    read.hidden = !beat.read;
  }
  const banner = $("scene-banner");
  if (banner) banner.hidden = !loftLocked();
  if (hooks.onMark) hooks.onMark(beat.id);
}

export function hideScene() {
  const stage = $("scene");
  if (stage) stage.hidden = true;
}

export function currentBeat() {
  return beats[index] || null;
}

export function showScene() {
  paint();
}

export function armLoft() {
  freshLock = true;
  globalThis.__valeFreshLock = true;
  openToken += 1;
  playGen += 1;
}

export function releaseLoft() {
  freshLock = false;
  globalThis.__valeFreshLock = false;
  playGen += 1;
}

export function openScenes(nextHooks, startId) {
  const token = ++openToken;
  const gen = playGen;
  const blocked = loftLocked();
  hooks = nextHooks || hooks;
  bind();
  if (blocked && beats.length) {
    index = 0;
    paint();
  }
  const stamp = "20261008-books2";
  const book1 = fetch("data/scenes/book.json?v=" + stamp).then((res) => res.json());
  const book2 = loadBook("data/scenes/book-2.json?v=" + stamp);
  const book3 = loadBook("data/scenes/book-3.json?v=" + stamp);
  const book4 = loadBook("data/scenes/book-4.json?v=" + stamp);
  return Promise.all([book1, book2, book3, book4]).then((docs) => {
    if (token !== openToken || gen !== playGen) return;
    const resumeId = blocked || loftLocked() ? null : startId;
    beats = docs.reduce((all, doc) => all.concat((doc && doc.beats) || []), []);
    index = 0;
    if (resumeId) {
      const at = beats.findIndex((beat) => beat.id === resumeId);
      if (at >= 0) index = at;
    }
    paint();
  });
}

export function resumeAfterFight(win) {
  if (win && index < beats.length - 1) index += 1;
  paint();
}
