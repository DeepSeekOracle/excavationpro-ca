import { bootRadio } from "./radio.js";
import * as sfx from "./sfx.js?v=20261007-buttons";
import { activate, applySettings, bindMenu, refresh as refreshMenu, sync as syncMenu } from "./menu.js?v=20261008-newgame4";
import { bindHooks, bindTravel, closeWindow, escapeWindow, isOpen, openWindow, showPlate } from "./window.js";
import { writeFresh } from "./card.js?v=20261008-newgame4";
import { openTown } from "./town.js?v=20261008-gear";
import { mineLeaveCell, openDungeon } from "./dungeon.js";
import { armLoft, currentBeat, hideScene, openScenes, releaseLoft, resumeAfterFight, showScene } from "./scene.js?v=20261008-books2";
import {
  callingSlot,
  confirmRoadPlate,
  editCallingSlot,
  readSave,
  rememberCheckpoint,
  restoreCheckpoint,
  storeRoadWin,
  writeSave
} from "./save.js";
import {
  heroCamera,
  isBlocked,
  makeRegionWorld,
  makeSliceWorld,
  nearShade,
  placeHero,
  stepWorld,
  visibleTiles,
  worldPath,
  worldPathHome
} from "./travel.js";
import { ensureGrowth, grantPage, indexById, spendOne } from "./inventory.js";
import { applyCard, defaultAct, skillRecord } from "./battle_entry.js";
import { drawBodyAura, drawFightFx, drawImpactFx, strikeDur, strikeKind } from "./fx.js?v=20261008-aura";
import { prepareTree } from "./tree.js";
import { bindTerrain, drawTop, drawCliffs, scenicOf, elevOf, liftOf } from "./ground.js?v=6";

function cue(name) {
  try {
    const fn = sfx[name];
    if (typeof fn === "function") fn();
  } catch (_) { /* sound is optional */ }
}

const C = window.MoonlitCombat;
const COLS = 8;
const ROWS = 8;


const FACES = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1]
];
const ART_FACES_RIGHT = { shade: 1, raider: 1 };

function spriteFlip(actor) {
  const lookRight = actor.face === 0 || actor.face === 3;
  return ART_FACES_RIGHT[actor.sprite] ? !lookRight : lookRight;
}

const art = {
  serenya: loadImage("assets/serenya.png"),
  emberion: loadImage("assets/emberion.png"),
  shade: loadImage("assets/shade.png"),
  lyra: loadImage("assets/scenes/figures/lyra.png?v=1"),
  bram: loadImage("assets/scenes/figures/bram.png?v=1"),
  nessa: loadImage("assets/scenes/figures/nessa.png?v=1"),
  miralis: loadImage("assets/scenes/figures/miralis.png?v=1"),
  corvath: loadImage("assets/scenes/figures/corvath.png?v=1"),
  straw: loadImage("assets/scenes/figures/straw.png?v=1"),
  cantor: loadImage("assets/scenes/figures/cantor.png?v=1"),
  raider: loadImage("assets/scenes/figures/raider.png?v=1"),
  "warden-shape": loadImage("assets/scenes/figures/warden-shape.png?v=1")
};

const TERRAIN = ["meadow", "thicket", "path", "yard", "water", "rock"];
const PROP_NAMES = ["oak", "birch", "pine", "mine", "stone", "cottage", "well", "reed", "bush", "flowers"];
const PROP_H = {
  oak: 5.6, birch: 5.4, pine: 5.8, mine: 3.4, stone: 3.3,
  cottage: 3.6, well: 2.15, reed: 2.05, bush: 1.65, flowers: 1.3
};
const props = {};

function loadImage(src) {
  const img = new Image();
  img.addEventListener("load", () => {
    if (world) drawWorld();
    if (battle) paint();
  });
  img.src = src;
  return img;
}

for (const name of TERRAIN) {
  const img = loadImage("assets/terrain/" + name + ".jpg?v=2");
  bindTerrain(name, img);
}
for (const name of PROP_NAMES) props[name] = loadImage("assets/props/" + name + ".png");

function unit(partial) {
  return Object.assign({
    ct: 0, moved: false, acted: false, face: 2, z: 0, team: "ally",
    reach: 1, kind: "physical", power: 100, style: "claw", skill: "Strike"
  }, partial);
}

const GLYPH = { id: "glyph", name: "Glyph", mp: 8, power: 110, reach: 3, kind: "magical", style: "seal", element: "seal", overlay: "bolt", target: "foe" };
const VALE_CUT = { id: "vale-cut", name: "Vale Cut", mp: 0, power: 120, reach: 1, kind: "physical", style: "slash", element: "bronze", overlay: "slash", target: "foe" };

function guestBody(id) {
  const rows = {
    lyra: { name: "Lyra", sprite: "lyra", hp: 78, mp: 64, ATK: 6, DEF: 7, MAG: 18, RES: 14, spd: 8, mov: 3, jump: 2, HUM: 80, ACCORD: 92, EVA: 6, LUCK: 12, ACC: 88, known: [GLYPH] },
    bram: { name: "Bram", sprite: "bram", hp: 110, mp: 4, ATK: 14, DEF: 14, MAG: 2, RES: 6, spd: 7, mov: 4, jump: 2, HUM: 65, ACCORD: 40, EVA: 5, LUCK: 6, ACC: 78, known: [VALE_CUT] },
    nessa: { name: "Nessa", sprite: "nessa", hp: 72, mp: 46, ATK: 6, DEF: 5, MAG: 15, RES: 10, spd: 8, mov: 4, jump: 2, HUM: 60, ACCORD: 70, EVA: 7, LUCK: 8, ACC: 80, known: [GLYPH] },
    miralis: { name: "Miralis", sprite: "miralis", hp: 104, mp: 16, ATK: 12, DEF: 11, MAG: 6, RES: 8, spd: 10, mov: 4, jump: 2, HUM: 70, ACCORD: 48, EVA: 9, LUCK: 14, ACC: 84, known: [VALE_CUT] }
  };
  const row = rows[id];
  const act = row.known && row.known[0];
  return Object.assign({
    id: id,
    maxHp: row.hp,
    maxMp: row.mp,
    skill: act ? act.name : "Strike",
    reach: act ? act.reach : 1,
    kind: act ? act.kind : "physical",
    power: act ? act.power : 100,
    style: act ? act.style : "claw"
  }, row);
}

function companyIds(slot) {
  const beat = currentBeat();
  const chapter = beat && typeof beat.chapter === "number" ? beat.chapter : 0;
  const id = sceneSpec && sceneSpec.id ? sceneSpec.id : "";
  const flags = slot && slot.flags ? slot.flags : {};
  const ids = [];
  if (chapter >= 3 && chapter < 16 && !flags.lyraFallen) ids.push("lyra");
  if ((chapter >= 7 && chapter <= 20) || id === "h3-drill") ids.push("bram", "nessa");
  if (chapter >= 7 && chapter <= 10 && !flags.miralisTaken) ids.push("miralis");
  return ids;
}

function pushCompany(units, slot) {
  const spots = [[1, 6], [0, 5], [2, 4], [0, 6]];
  companyIds(slot).forEach((id, index) => {
    units.push(unit(Object.assign({ x: spots[index][0], y: spots[index][1], face: 0 }, guestBody(id))));
  });
}

function puppetUnits() {
  const warden = guestBody("bram");
  warden.id = "warden";
  warden.name = "Warden";
  return [
    unit(Object.assign({ x: 1, y: 5, face: 0, sprite: "serenya", known: [GLYPH], skill: "Glyph", reach: 3, kind: "magical", power: 110, style: "seal" }, {
      id: "adept", name: "Adept", hp: 86, maxHp: 86, mp: 42, maxMp: 42, ATK: 8, DEF: 6, MAG: 14, RES: 10,
      spd: 9, mov: 4, jump: 2, HUM: 72, ACCORD: 78, EVA: 8, LUCK: 10, ACC: 82
    })),
    unit({
      id: "chick", name: "Chick", x: 2, y: 6, face: 0, sprite: "emberion",
      hp: 110, maxHp: 110, mp: 28, ATK: 22, DEF: 10, MAG: 15, RES: 8,
      spd: 8, mov: 4, jump: 2, HUM: 68, ACCORD: 60, EVA: 6, LUCK: 8, ACC: 76,
      reach: 1, kind: "physical", power: 140, style: "claw", skill: "Claw Rend"
    }),
    unit(Object.assign({ x: 1, y: 6, face: 0 }, warden))
  ];
}

function battleState(tiles, units, clauseId, card, note) {
  return {
    tiles,
    units,
    floorNote: note || "",
    rng: C.createRng((Date.now() >>> 0) || 1),
    clauseId,
    downSet: null,
    mode: "move",
    hover: null,
    pops: [],
    fx: [],
    shake: 0,
    over: null,
    lock: false,
    fromWorld: false,
    card: !!card,
    pendingAct: null,
    note: "",
    corvathTurns: 0
  };
}

function foeSprite(id) {
  if (id === "straw-shade") return "straw";
  if (id === "shade-cantor") return "cantor";
  if (id === "peak-raider") return "raider";
  if (id === "parsed-warden") return "warden-shape";
  if (id === "corvath") return "corvath";
  return "shade";
}

function emberStageFor(chapter) {
  if (chapter >= 14) return 2;
  if (chapter >= 11) return 1;
  return 0;
}

function raiseEmberion(card, chapter) {
  const next = emberStageFor(chapter);
  if (!next || !card || !card.party) return;
  const hero = card.party.find((unit) => unit.id === "emberion");
  if (hero && (hero.stage || 0) < next) hero.stage = next;
  if (card && card.party) ensureGrowth(card);
  editCallingSlot(localStorage, (slot) => {
    const row = (slot.party || []).find((unit) => unit.id === "emberion");
    if (row && (row.stage || 0) < next) row.stage = next;
    ensureGrowth(slot);
  });
}

function makeTiles(plate) {
  const file = plate ? String(plate).split("/").pop() : "";
  let scenic = "meadow";
  let note = "Moss underfoot. Water does not take a step.";
  let high = false;
  if (file === "thicket.jpg" || file === "dream.jpg") {
    scenic = "thicket";
    note = "Thicket. The path is the open lane.";
  } else if (file === "peaks.jpg" || file === "ridge.jpg" || file === "b2-c01.jpg" || file === "b2-c04.jpg") {
    scenic = "rock";
    note = "Ridge stone. The far edge sits higher.";
    high = true;
  } else if (file) {
    scenic = "yard";
    note = "Yard stone. The path runs through the middle.";
  }
  const tiles = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!file) {
        const ground = x + y >= 13 ? "water" : "moss";
        tiles.push({ x, y, z: 0, ground, block: ground === "water" });
        continue;
      }
      const lane = x === 3 || x === 4;
      tiles.push({
        x, y, z: 0,
        ground: lane ? "path" : (scenic === "thicket" ? "moss" : "stone"),
        scenic: lane ? "path" : scenic,
        elev: high && y <= 1 ? 2 : 1,
        block: false
      });
    }
  }
  return { tiles, note };
}

function makeBattle(card) {
  const beat = currentBeat();
  const storyPlate = sceneSpec && sceneSpec.foes && foeBook ? (beat && beat.plate) : "";
  const laid = makeTiles(storyPlate);
  const tiles = laid.tiles;
  const serenya = {
    id: "serenya", name: "Serenya", team: "ally", x: 1, y: 5, face: 0,
    hp: 86, maxHp: 86, mp: 42, ATK: 8, DEF: 6, MAG: 14, RES: 10,
    spd: 9, mov: 4, jump: 2, HUM: 72, ACCORD: 78, EVA: 8, LUCK: 10, ACC: 82,
    sprite: "serenya"
  };
  if (card) {
    serenya.reach = undefined;
    serenya.kind = undefined;
    serenya.power = undefined;
    serenya.style = undefined;
    serenya.skill = undefined;
  } else {
    serenya.reach = 3;
    serenya.kind = "magical";
    serenya.power = 110;
    serenya.style = "seal";
    serenya.skill = "Glyph";
  }
  const emberion = unit({
    id: "emberion", name: "Emberion", team: "ally", x: 2, y: 6, face: 0,
    hp: 110, maxHp: 110, mp: 28, ATK: 22, DEF: 10, MAG: 15, RES: 8,
    spd: 8, mov: 4, jump: 2, HUM: 68, ACCORD: 60, EVA: 6, LUCK: 8, ACC: 76,
    sprite: "emberion", reach: 1, kind: "physical", power: 140, style: "claw", skill: "Claw Rend"
  });
  const storyFoes = sceneSpec && sceneSpec.foes && foeBook;
  if (storyFoes && sceneSpec.id === "c0-hearth") {
    const puppets = puppetUnits();
    pushSceneFoes(puppets, sceneSpec);
    return battleState(tiles, puppets, "adept", false, laid.note);
  }
  const flags = card && card.flags ? card.flags : {};
  const units = [];
  if (!(storyFoes && flags.serenyaPassed)) units.push(unit(serenya));
  if (!flags.emberionAscended) units.push(emberion);
  if (!storyFoes) {
    units.push(unit({
      id: "shade", name: "Shade-beast", team: "foe", x: 5, y: 1, face: 2,
      hp: 70, maxHp: 70, mp: 20, ATK: 9, DEF: 6, MAG: 11, RES: 6,
      spd: 7, mov: 4, jump: 2, HUM: 30, ACCORD: 75, EVA: 6, LUCK: 4, ACC: 74,
      sprite: "shade", reach: 3, kind: "magical", power: 130, style: "fracture", skill: "Fracture"
    }));
  }
  if (storyFoes) raiseEmberion(card, beat && beat.chapter);
  if (card && battleBooks) applyCard(units, card, battleBooks);
  else if (!storyFoes) applyFoeQuery(units);
  const grown = units.find((unit) => unit.id === "emberion");
  if (grown && card && card.party) {
    const member = card.party.find((unit) => unit.id === "emberion");
    if (member) grown.stage = member.stage || 0;
  }
  if (storyFoes) {
    pushSceneFoes(units, sceneSpec);
    pushCompany(units, card);
  }
  return battleState(tiles, units, "serenya", card, laid.note);
}

let battle = null;
let foeBook = null;
let bareFight = false;
let menuDrill = false;

function tunedShade() {
  return menuDrill || new URLSearchParams(location.search).get("foe") === "shade-beast";
}

let inScene = false;
let sceneSpec = null;

function showTitle() {
  writeRegionPos();
  $("title-card").hidden = false;
  $("world").hidden = true;
  hideScene();
  inScene = false;
  $("battle").hidden = true;
  $("end").hidden = true;
  $("battle").classList.remove("fight-window", "armory-on");
  document.body.classList.remove("in-fight");
  bareFight = false;
  menuDrill = false;
  sceneSpec = null;
  world = null;
  walk = null;
  worldFrame += 1;
  refreshMenu();
}
let battleBooks = null;
let frame = 0;
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
let TW = 96;
let TH = 48;
let ZH = 26;
let originX = 520;
let originY = 120;

const vale = document.getElementById("vale");
const wctx = vale.getContext("2d");
let world = null;
let wTW = 86;
let wTH = 43;
let wOX = 480;
let wOY = 90;
let worldFrame = 0;
let walk = null;
let walkStamp = 0;

const $ = (id) => document.getElementById(id);

function tileAt(x, y) {
  return battle.tiles.find((t) => t.x === x && t.y === y);
}
function unitAt(x, y) {
  return battle.units.find((u) => u.hp > 0 && u.x === x && u.y === y);
}
function occupied(x, y, ignore) {
  return battle.units.some((u) => u !== ignore && u.hp > 0 && u.x === x && u.y === y);
}

function cellPos(x, y, z) {
  return {
    cx: originX + (x - y) * (TW / 2),
    cy: originY + (x + y) * (TH / 2) - (z || 0) * ZH
  };
}

function diamondPath(context, cx, cy, tw, th) {
  context.beginPath();
  context.moveTo(cx, cy - th / 2);
  context.lineTo(cx + tw / 2, cy);
  context.lineTo(cx, cy + th / 2);
  context.lineTo(cx - tw / 2, cy);
  context.closePath();
}

function inDiamond(px, py, cx, cy, tw, th) {
  return Math.abs(px - cx) / (tw / 2) + Math.abs(py - cy) / (th / 2) <= 1;
}

function reach(from, mov, jump) {
  const out = [];
  const seen = new Set();
  const q = [{ x: from.x, y: from.y, step: 0 }];
  seen.add(from.x + "," + from.y);
  while (q.length) {
    const n = q.shift();
    if (n.step > 0) out.push(n);
    if (n.step === mov) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = n.x + dx;
      const y = n.y + dy;
      const key = x + "," + y;
      if (seen.has(key)) continue;
      const t = tileAt(x, y);
      if (!t || t.block) continue;
      const here = tileAt(n.x, n.y);
      if (Math.abs(t.z - here.z) > jump) continue;
      if (occupied(x, y, from)) continue;
      seen.add(key);
      q.push({ x, y, step: n.step + 1 });
    }
  }
  return out;
}

function itemRecord(id) {
  const item = battleBooks && battleBooks.items[id];
  if (!item || item.kind !== "consumable") return null;
  const self = item.effect === "veil" || item.effect === "oath" || item.effect === "haste";
  return {
    id: "item:" + id,
    name: item.name,
    mp: 0,
    power: 0,
    reach: 4,
    kind: "item",
    target: self ? "self" : "ally",
    effect: item.effect,
    itemId: id
  };
}

function actRecord(u) {
  if (battle && battle.pendingAct && String(battle.pendingAct).indexOf("item:") === 0) {
    return itemRecord(String(battle.pendingAct).slice(5));
  }
  if (!u || !u.known || !u.known.length) return null;
  const chosen = battle && battle.pendingAct && u.known.find((row) => row.id === battle.pendingAct);
  return chosen || defaultAct(u.known);
}

function attackTiles(u) {
  const tiles = [];
  const rec = actRecord(u);
  const reachN = rec ? rec.reach : (u.reach || 1);
  const self = rec && rec.target === "self";
  const ally = rec && rec.target === "ally";
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const dist = Math.max(Math.abs(x - u.x), Math.abs(y - u.y));
      if (self) {
        if (x === u.x && y === u.y) tiles.push({ x, y });
      } else if (dist >= (ally ? 0 : 1) && dist <= reachN) {
        tiles.push({ x, y });
      }
    }
  }
  return tiles;
}

function relation(att, tar) {
  const dx = tar.x - att.x;
  const dy = tar.y - att.y;
  const f = FACES[att.face];
  const front = f[0] * dx + f[1] * dy;
  const side = Math.abs(f[0] * dy - f[1] * dx);
  if (front > 0 && front >= side) return "front";
  if (front < 0 && -front >= side) return "back";
  return "side";
}

function faceToward(u, x, y) {
  const dx = x - u.x;
  const dy = y - u.y;
  if (Math.abs(dx) > Math.abs(dy)) u.face = dx > 0 ? 0 : 2;
  else if (dy !== 0) u.face = dy > 0 ? 1 : 3;
}

function resize() {
  const wrap = canvas.parentElement;
  const w = Math.max(320, wrap.clientWidth);
  const h = Math.max(360, wrap.clientHeight);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const span = COLS + ROWS;
  const fitW = (w - 40) / span;
  const fitH = (h - 180) / span;
  TW = Math.max(48, Math.min(104, Math.floor(Math.min(fitW * 2, fitH * 4))));
  if (TW % 2) TW -= 1;
  TH = TW / 2;
  ZH = Math.round(TH * 0.55);
  originX = w / 2;
  originY = 78;
}

function figureScale(u) {
  if (!u) return 2.15;
  if (u.sprite === "corvath") return 2.7;
  if (u.sprite === "emberion") {
    if (u.stage >= 2) return 3.05;
    if (u.stage >= 1) return 2.75;
    return 2.45;
  }
  return 2.15;
}

function screenOf(u) {
  const p = cellPos(u.x, u.y, tileAt(u.x, u.y).z);
  return { x: p.cx, y: p.cy - TH * 0.35 };
}

function lungeFor(u) {
  const fx = battle.fx.find((f) => f.att === u && !f.resolved);
  if (!fx) return { x: 0, y: 0 };
  const p = Math.min(1, (performance.now() - fx.t0) / fx.dur);
  const k = fx.kind === "self" ? -8 : (fx.kind === "heal" || fx.kind === "veil" ? 0 : Math.sin(p * Math.PI) * (fx.kind === "slash" || fx.kind === "arc" ? 18 : 10));
  const ang = Math.atan2(fx.to.y - fx.from.y, fx.to.x - fx.from.x);
  return { x: Math.cos(ang) * k, y: Math.sin(ang) * k };
}

function drawBoard() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  if (battle.shake > 0.4) {
    const s = battle.shake;
    ctx.translate((Math.random() - 0.5) * s * 2, (Math.random() - 0.5) * s * 2);
  }
  const active = current();
  const moves = active && battle.mode === "move" && !active.moved && active.team === "ally"
    ? reach(active, active.mov, active.jump) : [];
  const strikes = active && !battle.lock && active.team === "ally"
    ? attackTiles(active) : [];
  const order = battle.tiles.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.z - b.z);
  for (const t of order) {
    const p = cellPos(t.x, t.y, t.z);
    const elev = elevOf(t);
    drawTop(ctx, p.cx, p.cy - liftOf(elev, TH), TW, TH, scenicOf(t));
  }
  for (const t of order) {
    const p = cellPos(t.x, t.y, t.z);
    const east = tileAt(t.x + 1, t.y);
    const south = tileAt(t.x, t.y + 1);
    const elev = elevOf(t);
    drawCliffs(ctx, p.cx, p.cy, TW, TH, elev, east ? elevOf(east) : elev, south ? elevOf(south) : elev);
  }
  for (const t of order) {
    const p = cellPos(t.x, t.y, t.z);
    const elev = elevOf(t);
    const cy = p.cy - liftOf(elev, TH);
    const hot = battle.hover && battle.hover.x === t.x && battle.hover.y === t.y;
    const canMove = moves.some((m) => m.x === t.x && m.y === t.y);
    const canHit = strikes.some((m) => m.x === t.x && m.y === t.y);
    const foe = unitAt(t.x, t.y);
    ctx.save();
    diamondPath(ctx, p.cx, cy, TW, TH);
    if (hot) ctx.fillStyle = "rgba(255,255,255,0.1)";
    else ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fill();
    if (canMove) ctx.strokeStyle = "rgba(228, 194, 122, 0.9)";
    else if (canHit && foe && foe.team === "foe") ctx.strokeStyle = "rgba(224, 122, 104, 0.95)";
    else if (canHit) ctx.strokeStyle = "rgba(224, 122, 104, 0.35)";
    else if (hot) ctx.strokeStyle = "rgba(244, 239, 228, 0.85)";
    else ctx.strokeStyle = "rgba(0, 0, 0, 0)";
    ctx.lineWidth = (canMove || (canHit && foe) || hot) ? 1.75 : 1;
    if (canMove || canHit || hot) ctx.stroke();
    ctx.restore();
    const u = unitAt(t.x, t.y);
    if (u) drawUnit(u, { cx: p.cx, cy }, u === active);
  }
  drawFx();
  ctx.restore();
}

function drawUnit(u, p, active) {
  const img = art[u.sprite];
  const bob = active ? Math.sin(performance.now() / 420) * 3 : 0;
  const lung = lungeFor(u);
  const h = TH * figureScale(u);
  const ratio = img.naturalWidth ? img.naturalWidth / img.naturalHeight : 0.7;
  const dw = h * ratio;
  const footY = p.cy + TH / 2 - 6;
  ctx.save();
  ctx.translate(lung.x, lung.y);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(p.cx, footY, TW * 0.28, TH * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(p.cx, footY + bob);
  if (spriteFlip(u)) ctx.scale(-1, 1);
  if (img.complete && img.naturalWidth) ctx.drawImage(img, -dw / 2, -h, dw, h);
  ctx.restore();
  const armed = active && actRecord(u);
  drawBodyAura(ctx, {
    cx: p.cx + lung.x,
    footY: footY + lung.y,
    h: h,
    tw: TW,
    guard: !!u.guard,
    boons: u.boons || [],
    preview: !!(active && armed && (armed.target === "self" || armed.overlay === "self") && battle.mode === "strike" && !battle.lock),
    quiet: document.body.classList.contains("reduce-motion")
  });
  const bw = TW * 0.7;
  const hp = Math.max(0, u.hp / u.maxHp);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(p.cx - bw / 2 + lung.x, footY + 6 + lung.y, bw, 4);
  ctx.fillStyle = u.team === "ally" ? "#8fd0c8" : "#e07a68";
  ctx.fillRect(p.cx - bw / 2 + lung.x, footY + 6 + lung.y, bw * hp, 4);
  if (active) {
    ctx.strokeStyle = "#e4c27a";
    ctx.strokeRect(p.cx - bw / 2 - 1 + lung.x, footY + 5 + lung.y, bw + 2, 6);
  }
}

function drawFx() {
  const now = performance.now();
  for (const fx of battle.fx) {
    const p = Math.min(1, (now - fx.t0) / fx.dur);
    drawFightFx(ctx, fx, p, TW, TH);
    if (fx.resolved) drawImpactFx(ctx, fx, now);
  }
  ctx.save();
  ctx.font = "700 22px Syne, Georgia, serif";
  ctx.textAlign = "center";
  for (const pop of battle.pops) {
    const age = (now - pop.t0) / 700;
    if (age >= 1) continue;
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = pop.crit ? "#e4c27a" : pop.hit ? "#f4efe4" : "#b7ad9e";
    ctx.fillText(pop.text, pop.x, pop.y - age * 36);
  }
  ctx.restore();
  battle.pops = battle.pops.filter((pop) => now - pop.t0 < 700);
}

function tickFx() {
  const now = performance.now();
  const finished = [];
  battle.fx = battle.fx.filter((fx) => {
    if (fx.hold) {
      fx.t0 = now - fx.dur * 0.62;
      return true;
    }
    const p = (now - fx.t0) / fx.dur;
    if (!fx.resolved && p >= 1) {
      resolveStrike(fx);
      fx.resolved = true;
      fx.impactT = now;
    }
    if (fx.resolved && now - fx.impactT > 460) {
      finished.push(fx);
      return false;
    }
    return true;
  });
  if (battle.shake > 0) battle.shake *= 0.86;
  for (const fx of finished) {
    if (fx.done) fx.done();
  }
}

function current() {
  if (!battle || battle.over) return null;
  return C.pickReady(battle.units);
}

function ensureClock() {
  if (battle.over) return;
  if (!C.pickReady(battle.units)) C.advanceClock(battle.units);
}

function kickTurn() {
  if (!battle || battle.over) return;
  ensureClock();
  const next = current();
  if (next) next.guard = false;
  battle.pendingAct = null;
  if (next && next.team === "foe") {
    battle.lock = true;
    setTimeout(() => foeAct(next), 520);
  } else {
    battle.mode = "move";
    battle.lock = false;
  }
  paint();
}

function scriptedWin() {
  if (!battle || !sceneSpec) return null;
  const id = String(sceneSpec.id || "");
  if (id.indexOf("c10") >= 0) {
    const shades = battle.units.some((unit) => unit.team === "foe" && String(unit.id).indexOf("corvath") !== 0 && unit.hp > 0);
    const held = (battle.allyTurns || 0) >= 8;
    if (!shades || held) {
      battle.units.filter((unit) => String(unit.id).indexOf("corvath") === 0 && unit.hp > 0).forEach(markLeft);
      return { result: "win", reason: held && shades ? "hold" : "shades" };
    }
  }
  if (id.indexOf("c13") >= 0) {
    const lyra = battle.units.find((unit) => unit.id === "lyra");
    if (!lyra) return null;
    const foesUp = battle.units.some((unit) => unit.team === "foe" && unit.hp > 0);
    if (lyra.hp <= 0) return { result: "win", reason: "lyra-song" };
    if (!foesUp) {
      lyra.hp = 0;
      say("Lyra spends the song.");
      return { result: "win", reason: "lyra-song" };
    }
  }
  return null;
}

function tickBoons(u) {
  if (!u || !u.boons) return;
  u.boons.forEach((boon) => {
    if (boon.fresh) {
      boon.fresh = false;
      return;
    }
    boon.left -= 1;
  });
  u.boons = u.boons.filter((boon) => {
    if (boon.left > 0) return true;
    if (boon.eva) u.EVA -= boon.eva;
    if (boon.atk) u.ATK -= boon.atk;
    if (boon.spd != null) u.spd = boon.spd;
    return false;
  });
}

function addBoon(unit, kind) {
  if (!unit.boons) unit.boons = [];
  const have = unit.boons.find((boon) => boon.kind === kind);
  if (have) {
    have.left = 3;
    have.fresh = true;
    return;
  }
  if (kind === "veil") {
    unit.EVA += 20;
    unit.boons.push({ kind, left: 3, eva: 20, fresh: true });
  } else if (kind === "oath") {
    unit.ATK += 4;
    unit.boons.push({ kind, left: 3, atk: 4, fresh: true });
  } else if (kind === "haste") {
    const prev = unit.spd;
    unit.spd = Math.max(1, Math.round(prev * 1.5));
    unit.boons.push({ kind, left: 3, spd: prev, fresh: true });
  }
}

function useItem(att, tar, record) {
  const effect = record.effect;
  let refuse = "";
  let said = "";
  let apply = null;
  if (effect === "hp40") {
    if (tar.hp <= 0) refuse = "A salve does not close an interval.";
    else {
      const add = Math.min(40, Math.max(0, tar.maxHp - tar.hp));
      if (!add) refuse = "Already at full health.";
      else apply = () => { tar.hp += add; };
      said = record.name + " · +" + (apply ? Math.min(40, Math.max(0, tar.maxHp - tar.hp)) : 0);
    }
  } else if (effect === "mp20") {
    const add = Math.min(20, Math.max(0, (tar.maxMp || 0) - tar.mp));
    if (!add) refuse = "Already at full focus.";
    else {
      apply = () => { tar.mp += add; };
      said = record.name + " · +" + add + " focus";
    }
  } else if (effect === "revive30") {
    const closed = tar.id === "lyra" && sceneSpec && String(sceneSpec.id).indexOf("c13") >= 0;
    if (closed) refuse = "The interval is closed.";
    else if (tar.hp > 0) refuse = "They are still standing.";
    else {
      const back = Math.max(1, Math.floor(tar.maxHp * 0.3));
      apply = () => { tar.hp = back; tar.ct = 50; };
      said = record.name + " · " + back;
    }
  } else if (effect === "veil" || effect === "oath" || effect === "haste") {
    apply = () => addBoon(tar, effect);
    said = record.name + ".";
  } else refuse = "That has no use here.";
  if (refuse || !apply) {
    battle.note = refuse || "That has no use here.";
    paint();
    return;
  }
  let spent = false;
  editCallingSlot(localStorage, (slot) => { spent = spendOne(slot, record.itemId); });
  if (!spent) {
    battle.note = "It is not in the bag.";
    paint();
    return;
  }
  apply();
  say(att.name + " · " + said);
  sfx.impact("seal", false);
  const bloom = effect === "veil" || effect === "oath" || effect === "haste" ? effect : "heal";
  flourish(att, tar, bloom, effect === "oath" ? "bronze" : "seal");
  att.acted = true;
  battle.pendingAct = null;
  endTurn(att);
}

function endTurn(u) {
  tickBoons(u);
  C.spendTurn(u);
  u.moved = false;
  u.acted = false;
  if (u.team === "ally" && sceneSpec && String(sceneSpec.id).indexOf("c10") >= 0) {
    battle.allyTurns = (battle.allyTurns || 0) + 1;
  }
  if (u.team === "ally" && battle.clauseId && u.id !== battle.clauseId) {
    const clause = battle.units.find((x) => x.id === battle.clauseId);
    if (clause && clause.hp <= 0) {
      if (!Array.isArray(battle.downSet)) {
        battle.downSet = battle.units.filter((x) => x.team === "ally" && x.hp > 0).map((x) => x.id);
      }
      C.noteAllyTurnEnded(battle, u.id);
    }
  }
  if (u.team === "foe" && String(u.id).indexOf("corvath") === 0 && sceneSpec && String(sceneSpec.id).indexOf("c5") >= 0 && u.hp > 0) {
    battle.corvathTurns = (battle.corvathTurns || 0) + 1;
    if (battle.corvathTurns >= 6) markLeft(u);
  }
  const outcome = C.checkOutcome(battle);
  if (outcome.result === "lose") {
    finish(outcome);
    return;
  }
  const scripted = scriptedWin();
  if (scripted) {
    finish(scripted);
    return;
  }
  if (outcome.result !== "continue") {
    finish(outcome);
    return;
  }
  kickTurn();
}

function foeAct(u) {
  if (!battle || battle.over || u.hp <= 0) return;
  const prey = nearestAlly(u);
  if (!prey) {
    endTurn(u);
    return;
  }
  const dist = Math.max(Math.abs(prey.x - u.x), Math.abs(prey.y - u.y));
  if (dist > u.reach) {
    const steps = reach(u, u.mov, u.jump);
    steps.sort((a, b) => {
      const da = Math.max(Math.abs(prey.x - a.x), Math.abs(prey.y - a.y));
      const db = Math.max(Math.abs(prey.x - b.x), Math.abs(prey.y - b.y));
      return da - db;
    });
    const step = steps.find((s) => Math.max(Math.abs(prey.x - s.x), Math.abs(prey.y - s.y)) <= u.reach) || steps[0];
    if (step) {
      faceToward(u, step.x, step.y);
      u.x = step.x;
      u.y = step.y;
      u.z = tileAt(u.x, u.y).z;
    }
  }
  const now = Math.max(Math.abs(prey.x - u.x), Math.abs(prey.y - u.y));
  if (now >= 1 && now <= u.reach) {
    faceToward(u, prey.x, prey.y);
    beginStrike(u, prey, () => endTurn(u));
    return;
  }
  endTurn(u);
}

function nearestAlly(u) {
  const allies = battle.units.filter((a) => a.team === "ally" && a.hp > 0);
  allies.sort((a, b) => {
    const da = Math.abs(a.x - u.x) + Math.abs(a.y - u.y);
    const db = Math.abs(b.x - u.x) + Math.abs(b.y - u.y);
    return da - db;
  });
  return allies[0] || null;
}

function flourish(att, tar, kind, style) {
  const from = screenOf(att);
  const to = tar ? screenOf(tar) : from;
  battle.fx.push({
    kind: kind,
    style: style || "seal",
    t0: performance.now(),
    dur: strikeDur(kind),
    from: from,
    to: to,
    resolved: true,
    impactT: performance.now(),
    done: null
  });
}

function beginStrike(att, tar, done) {
  battle.lock = true;
  faceToward(att, tar.x, tar.y);
  const kind = strikeKind(att);
  sfx.launch(att.style);
  battle.fx.push({
    kind: kind,
    style: att.style,
    family: att.family || "",
    radius: att.family === "spear" ? 1.4 : 1,
    t0: performance.now(),
    dur: strikeDur(kind),
    from: screenOf(att),
    to: screenOf(tar),
    att,
    tar,
    resolved: false,
    done
  });
  lockDock();
}

function lockDock() {
  $("cmd-move").disabled = true;
  $("cmd-strike").disabled = true;
  $("cmd-wait").disabled = true;
  $("dock-note").textContent = "The blow is still in the air.";
}

function withdrawRatio(specId) {
  if (!specId) return null;
  if (specId.indexOf("c5") >= 0) return 0.7;
  if (specId.indexOf("c13") >= 0) return 0.3;
  if (specId.indexOf("c14") >= 0) return 0.25;
  return null;
}

function markLeft(tar) {
  tar.hp = 0;
  tar.left = true;
  say("Corvath leaves. He is not a corpse.");
}

function maybeWithdraw(tar) {
  if (!tar || tar.left || String(tar.id).indexOf("corvath") !== 0) return false;
  const specId = (sceneSpec && sceneSpec.id) || "";
  if (specId.indexOf("c10") >= 0) {
    if (tar.hp > 0) return false;
    markLeft(tar);
    return true;
  }
  const ratio = withdrawRatio(specId);
  if (ratio == null) return false;
  if (tar.hp > Math.floor(ratio * tar.maxHp)) return false;
  markLeft(tar);
  return true;
}

function elementFactor(att, tar) {
  const el = att.element || "none";
  if (!tar.traits || el === "none") return 1;
  if (tar.traits.weak && tar.traits.weak.indexOf(el) >= 0) return 1.5;
  if (tar.traits.resist && tar.traits.resist.indexOf(el) >= 0) return 0.5;
  return 1;
}

const FOE_SPOTS = [[6, 1], [5, 1], [6, 2], [4, 1]];
const FOE_NAMES = {
  "shade-beast": "Shade-beast",
  "shade-cantor": "Shade-cantor",
  "peak-raider": "Peak raider",
  "parsed-warden": "Warden-shape",
  "straw-shade": "Straw-shade",
  corvath: "Corvath",
  "mirror-serenya": "The mirror"
};

function foeStats(row, battleId) {
  if (row.stats) return row.stats;
  if (row.id === "corvath" && row.statsByBattle) {
    const id = battleId || "";
    if (id.indexOf("c14") >= 0) return row.statsByBattle.c14;
    if (id.indexOf("c13") >= 0) return row.statsByBattle.c13;
    if (id.indexOf("c10") >= 0) return row.statsByBattle.c10;
    return row.statsByBattle.c5;
  }
  return null;
}

function kitStrike(row) {
  const named = row.bolt || row.basic;
  if (named) {
    const magical = named.kind === "magical";
    return {
      reach: named.reach || 1,
      kind: named.kind || "physical",
      power: named.power || 100,
      element: named.element || "none",
      style: named.element === "fracture" ? "fracture" : (named.element === "seal" ? "seal" : "bronze"),
      overlay: magical ? "bolt" : "slash",
      skill: magical ? "Shade Bolt" : "Strike"
    };
  }
  const skills = battleBooks && battleBooks.skills;
  const first = row.kit && row.kit[0];
  const skill = skills && first ? skills[first] : null;
  if (skill) {
    const rec = skillRecord(skill, null, skill.power || 0);
    if (rec.power > 0 && (rec.target === "foe" || rec.target === "foes")) {
      return {
        reach: rec.reach == null ? 1 : rec.reach,
        kind: rec.kind,
        power: rec.power,
        element: rec.element,
        style: rec.style,
        overlay: rec.overlay || "slash",
        skill: rec.name,
        known: [rec]
      };
    }
  }
  return { reach: 1, kind: "physical", power: 100, element: "none", style: "bronze", overlay: "slash", skill: "Strike" };
}

function pushSceneFoes(units, spec) {
  const ser = units.find((u) => u.id === "serenya");
  let n = 0;
  (spec.foes || []).forEach((id) => {
    if (n >= FOE_SPOTS.length) return;
    const row = foeBook.bodies.find((body) => body.id === id);
    if (!row) return;
    const spot = FOE_SPOTS[n++];
    if (id === "mirror-serenya" && ser) {
      units.push(unit({
        id: "mirror", name: "The mirror", team: "foe", x: spot[0], y: spot[1], face: 2,
        hp: ser.maxHp, maxHp: ser.maxHp, mp: ser.mp, ATK: ser.ATK, DEF: ser.DEF, MAG: ser.MAG, RES: ser.RES,
        spd: ser.spd, mov: ser.mov, jump: ser.jump, HUM: ser.HUM, ACCORD: ser.ACCORD, EVA: ser.EVA, LUCK: ser.LUCK, ACC: ser.ACC,
        sprite: "serenya", reach: ser.reach || 3, kind: ser.kind || "magical", power: ser.power || 110,
        style: ser.style || "seal", skill: "Glyph", element: ser.element || "seal", overlay: "bolt"
      }));
      return;
    }
    const s = foeStats(row, spec.id) || { hp: 70, mp: 0, atk: 8, def: 4, mag: 8, res: 4, spd: 6, mov: 3, jump: 2, hum: 20, accord: 40, eva: 4, luck: 4, acc: 70 };
    const strike = kitStrike(row);
    units.push(unit({
      id: id + "-" + n, name: FOE_NAMES[id] || id, team: "foe", x: spot[0], y: spot[1], face: 2,
      hp: s.hp, maxHp: s.hp, mp: s.mp || 0, ATK: s.atk, DEF: s.def, MAG: s.mag, RES: s.res,
      spd: s.spd, mov: s.mov, jump: s.jump, HUM: s.hum, ACCORD: s.accord, EVA: s.eva, LUCK: s.luck, ACC: s.acc,
      sprite: foeSprite(id), reach: strike.reach, kind: strike.kind, power: strike.power,
      style: strike.style, skill: strike.skill, element: strike.element, overlay: strike.overlay, known: strike.known,
      traits: { weak: row.weak || [], resist: row.resist || [] }
    }));
  });
}

function applyFoeQuery(units) {
  const params = new URLSearchParams(location.search);
  if (!tunedShade() || !foeBook) return;
  const row = foeBook.bodies.find((b) => b.id === "shade-beast");
  const shade = units.find((u) => u.id === "shade");
  const s = row.stats;
  shade.hp = shade.maxHp = s.hp;
  shade.mp = shade.maxMp = s.mp;
  shade.ATK = s.atk;
  shade.DEF = s.def;
  shade.MAG = s.mag;
  shade.RES = s.res;
  shade.spd = s.spd;
  shade.mov = s.mov;
  shade.jump = s.jump;
  shade.HUM = s.hum;
  shade.ACCORD = s.accord;
  shade.EVA = s.eva;
  shade.LUCK = s.luck;
  shade.ACC = s.acc;
  shade.reach = row.bolt.reach;
  shade.power = row.bolt.power;
  shade.kind = row.bolt.kind;
  shade.element = row.bolt.element;
  shade.skill = "Shade Bolt";
  shade.overlay = "bolt";
  shade.traits = { weak: row.weak, resist: row.resist };
  const emb = units.find((u) => u.id === "emberion");
  emb.traits = { weak: ["fracture"] };
  emb.element = "none";
  const ser = units.find((u) => u.id === "serenya");
  const callings = {
    cantor: { hp: 78, mp: 52, ATK: 10, DEF: 5, MAG: 25, skill: "Glyph", power: 110, kind: "magical", reach: 3, element: "seal", style: "seal" },
    warden: { hp: 96, mp: 36, ATK: 16, DEF: 8, MAG: 12, skill: "Vale Cut", power: 120, kind: "physical", reach: 1, element: "bronze", style: "slash" },
    kindler: { hp: 90, mp: 44, ATK: 14, DEF: 6, MAG: 18, skill: "Brand Cut", power: 120, kind: "physical", reach: 1, element: "bronze", style: "slash" }
  };
  const call = callings[params.get("calling")];
  if (call) {
    ser.hp = ser.maxHp = call.hp;
    ser.mp = ser.maxMp = call.mp;
    ser.ATK = call.ATK;
    ser.DEF = call.DEF;
    ser.MAG = call.MAG;
    ser.skill = call.skill;
    ser.power = call.power;
    ser.kind = call.kind;
    ser.reach = call.reach;
    ser.element = call.element;
    ser.style = call.style;
  } else {
    ser.element = "seal";
  }
  if (params.has("hard")) {
    const straw = foeBook.bodies.find((b) => b.id === "straw-shade");
    const t = straw.stats;
    units.push(unit({
      id: "straw", name: "Straw-shade", team: "foe", x: 6, y: 2, face: 2,
      hp: t.hp, maxHp: t.hp, mp: t.mp, ATK: t.atk, DEF: t.def, MAG: t.mag, RES: t.res,
      spd: t.spd, mov: t.mov, jump: t.jump, HUM: t.hum, ACCORD: t.accord, EVA: t.eva, LUCK: t.luck, ACC: t.acc,
      sprite: "shade", reach: 1, kind: "physical", power: 100, style: "claw", skill: "Strike", element: "none"
    }));
  }
}

function resolveStrike(fx) {
  const att = fx.att;
  const tar = fx.tar;
  const facing = relation(att, tar);
  const heightTiles = tileAt(att.x, att.y).z - tileAt(tar.x, tar.y).z;
  const action = {
    attacker: att,
    target: tar,
    power: att.power,
    kind: att.kind,
    facing,
    heightTiles
  };
  if (battle.card || tunedShade()) {
    action.elementFactor = elementFactor(att, tar);
  }
  const heldDef = tar.DEF;
  const heldRes = tar.RES;
  if (tar.guard) {
    tar.DEF = heldDef * 1.5;
    tar.RES = heldRes * 1.5;
  }
  const result = C.applyAction(battle, action, battle.rng);
  tar.DEF = heldDef;
  tar.RES = heldRes;
  const left = maybeWithdraw(tar);
  const word = left ? "leaves" : (!result.hit ? "miss" : (result.crit ? "crit " + result.dmg : String(result.dmg)));
  say(att.name + " · " + att.skill + " → " + tar.name + "  " + word);
  if (result.hit) sfx.impact(att.style, result.crit);
  else sfx.miss();
  battle.shake = result.crit ? 9 : result.hit ? 5 : 1.5;
  battle.pops.push({
    x: fx.to.x,
    y: fx.to.y - 18,
    text: left ? "leaves" : (result.hit ? (result.crit ? result.dmg + "!" : String(result.dmg)) : "miss"),
    hit: result.hit,
    crit: result.crit,
    t0: performance.now()
  });
  if (tar.hp <= 0 && tar.id === battle.clauseId) {
    battle.downSet = battle.units.filter((x) => x.team === "ally" && x.hp > 0).map((x) => x.id);
  }
}

function isRoadBattle() {
  if (!world || world.mode !== "region" || bareFight || tunedShade()) return false;
  const params = new URLSearchParams(location.search);
  return !params.has("fight") && !params.has("walk");
}

function roadReward() {
  const reward = openingDoc && openingDoc.reward;
  if (reward && reward.row === "road") return reward;
  return { id: "opening-thicket", row: "road", embers: 20, measures: 0, salve: 0.15, item: "mend-salve" };
}

function readCalling() {
  const read = readSave(localStorage);
  if (!read.ok || !read.doc) return null;
  const index = callingSlot(read.doc);
  if (index < 0) return null;
  return read.doc.slots[index];
}

function writePartyVitals() {
  if (!battle) return;
  editCallingSlot(localStorage, (slot) => {
    battle.units.forEach((unit) => {
      const member = (slot.party || []).find((row) => row.id === unit.id);
      if (!member) return;
      member.hp = unit.hp;
      member.mp = unit.mp;
    });
  });
}

function battleVitals() {
  if (!battle) return [];
  return battle.units
    .filter((unit) => unit.team === "ally")
    .map((unit) => ({ id: unit.id, hp: unit.hp, mp: unit.mp }));
}

function pinRoadCheckpoint() {
  if (!isRoadBattle()) return;
  const read = readSave(localStorage);
  if (!read.ok || !read.doc) return;
  const index = callingSlot(read.doc);
  if (index < 0) return;
  const slot = read.doc.slots[index];
  if (slot.battleCheckpoint) return;
  rememberCheckpoint(slot, { x: world.hero.x, y: world.hero.y, facing: world.hero.face });
  writeSave(localStorage, read.doc);
}

function commitRoadWin() {
  let plate = null;
  editCallingSlot(localStorage, (slot) => {
    const rng = C.createRng(slot.rng && slot.rng.state ? slot.rng.state : 1);
    const roll = rng.next();
    slot.rng = { alg: "mulberry32", state: rng.state() };
    storeRoadWin(slot, roll, roadReward());
    slot.pendingPlate.vitals = battleVitals();
    plate = slot.pendingPlate;
  });
  if (world) world.shade.alive = false;
  return plate;
}

function applyRoadConfirm() {
  const live = battleVitals();
  editCallingSlot(localStorage, (slot) => {
    const stored = slot.pendingPlate && slot.pendingPlate.vitals;
    confirmRoadPlate(slot, live.length ? live : stored);
  });
}

function writeLossReturn() {
  if (!world) return;
  editCallingSlot(localStorage, (slot) => {
    restoreCheckpoint(slot, {
      map: "opening",
      x: world.hero.x,
      y: world.hero.y,
      facing: world.hero.face
    });
  });
}

function roadBody(plate) {
  const embers = plate && Number.isFinite(plate.embers) ? plate.embers : 20;
  const salve = plate && (plate.items || []).some((item) => item.id === "mend-salve" && (item.n || 1) > 0);
  return salve
    ? "The road pays " + embers + " Embers, and a Mend Salve."
    : "The road pays " + embers + " Embers.";
}

function roadModel(plate) {
  return {
    id: (plate && plate.id) || "opening-thicket",
    kind: "fight",
    result: "win",
    embers: plate ? plate.embers : 20,
    items: plate ? plate.items : [],
    measures: [],
    flags: {},
    restore: false,
    retreat: false,
    fromWorld: true,
    retry: false,
    kicker: "The thicket stills",
    title: "The shade breaks",
    body: roadBody(plate)
  };
}

function offerRoadPlate(plate) {
  openWindow({
    id: plate.id || "opening-thicket",
    kind: "adventure",
    title: "The road",
    kicker: "Road",
    placeId: "opening",
    allowsLeave: false,
    quiet: true
  }).then(() => {
    applyRoadConfirm();
    if (world) {
      noteWorld();
      drawWorld();
    }
  });
  showPlate(roadModel(plate));
}

function finish(outcome) {
  battle.over = outcome;
  battle.lock = true;
  const win = outcome.result === "win";
  if (inScene) writePartyVitals();
  sfx.sting(win);
  if (win && isRoadBattle()) {
    showPlate(roadModel(commitRoadWin()));
    return;
  }
  if (win && world) world.shade.alive = false;
  showPlate({
    id: "opening-thicket",
    kind: "fight",
    result: win ? "win" : "lose",
    embers: 0,
    items: [],
    measures: [],
    flags: {},
    restore: false,
    retreat: !win,
    fromWorld: !!battle.fromWorld,
    retry: inScene ? false : !win,
    kicker: inScene && sceneSpec ? sceneSpec.title : (win ? "The thicket stills" : "The Vale keeps the song"),
    title: inScene ? (win ? "The page turns" : "Serenya falls") : (win ? "The shade breaks" : "Serenya falls"),
    body: inScene
      ? (win ? storyWinLine() : ((sceneSpec && sceneSpec.loseLine) || "She falls. The Hatchery is still lit. Level, then meet it again."))
      : (win
        ? "The naming holds. The fight window closes, and the path through the Vale is quiet again."
        : "The lullaby does not end here. Step back, or meet the shade again."),
    leave: inScene ? (win ? "Onward" : "Level") : ""
  });
}

function paint() {
  if (!battle) return;
  resize();
  drawBoard();
  const active = current();
  const q = $("queue");
  q.innerHTML = "";
  const living = battle.units.filter((u) => u.hp > 0).slice().sort((a, b) => b.ct - a.ct);
  for (const u of living) {
    const li = document.createElement("li");
    li.textContent = u.name.split(" ")[0];
    if (u.team === "foe") li.classList.add("foe");
    if (u === active) li.classList.add("on");
    q.appendChild(li);
  }
  paintRosters(active);
  $("cmd-move").classList.toggle("on", battle.mode === "move");
  $("cmd-strike").classList.toggle("on", battle.mode === "strike");
  $("cmd-strike").textContent = active && active.known && active.known.length ? "Act" : (active && active.team === "ally" ? labelFor(active) : "Strike");
  paintActs(active);
  $("cmd-move").disabled = !active || active.team !== "ally" || active.moved || battle.lock;
  $("cmd-strike").disabled = !active || active.team !== "ally" || battle.lock;
  $("cmd-wait").disabled = !active || active.team !== "ally" || battle.lock;
  const note = $("dock-note");
  if (battle.fx.some((f) => !f.resolved)) note.textContent = "The blow is still in the air.";
  else if (!active) note.textContent = "";
  else if (active.team === "foe") note.textContent = active.name + " moves.";
  else if (battle.mode === "move") note.textContent = "Gold is a step. Rose can be struck from where you stand.";
  else if (actRecord(active) && (actRecord(active).target === "self" || actRecord(active).overlay === "self")) note.textContent = "The shield opens on you. Raise it from your card, or click your tile.";
  else note.textContent = battle.note || ("Rose outlines sit inside " + (actRecord(active) ? actRecord(active).name : labelFor(active)) + ".");
  forecast();
}

function auraLine(u) {
  const bits = [];
  if (u.guard) bits.push("Shield");
  (u.boons || []).forEach((boon) => {
    const name = boon.kind === "veil" ? "Veil" : boon.kind === "oath" ? "Oath" : boon.kind === "haste" ? "Haste" : "";
    if (name) bits.push(name + " " + boon.left);
  });
  return bits.join(" · ");
}

function statCell(label, value) {
  const cell = document.createElement("div");
  const num = document.createElement("b");
  num.textContent = value == null ? "—" : String(value);
  const cap = document.createElement("span");
  cap.textContent = label;
  cell.append(num, cap);
  return cell;
}

function meter(className, value, max) {
  const bar = document.createElement("div");
  bar.className = "bar " + className;
  const fill = document.createElement("i");
  const cap = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  fill.style.width = (cap * 100) + "%";
  bar.appendChild(fill);
  return bar;
}

function unitCard(u, active) {
  const card = document.createElement("article");
  const down = u.hp <= 0;
  const looked = battle.hover && battle.hover.x === u.x && battle.hover.y === u.y;
  card.className = "unit-card" + (u.team === "foe" ? " is-foe" : " is-ally") + (u === active ? " is-turn" : "") + (down ? " is-down" : "") + (looked ? " is-look" : "");
  const img = document.createElement("img");
  img.src = art[u.sprite] ? art[u.sprite].src : "";
  img.alt = "";
  const copy = document.createElement("div");
  const id = document.createElement("div");
  id.className = "card-id";
  const name = document.createElement("strong");
  name.textContent = u.name;
  id.appendChild(name);
  if (u === active) {
    const now = document.createElement("span");
    now.className = "now-pip";
    now.textContent = "Now";
    id.appendChild(now);
  }
  const hp = document.createElement("p");
  hp.className = "hp-num";
  hp.textContent = down ? "Down" : (u.hp + " / " + u.maxHp + " HP");
  const act = document.createElement("p");
  act.className = "act-name";
  const shown = shownAct(u);
  act.textContent = shown.name + " · reach " + shown.reach;
  const aura = auraLine(u);
  const grid = document.createElement("div");
  grid.className = "stat-grid";
  grid.append(
    statCell("ATK", u.ATK),
    statCell("DEF", u.DEF),
    statCell("MAG", u.MAG),
    statCell("RES", u.RES),
    statCell("SPD", u.spd),
    statCell("MOV", u.mov)
  );
  copy.append(id, hp, meter(u.team === "foe" ? "foe" : "hp", u.hp, u.maxHp));
  if (u.maxMp) copy.appendChild(meter("mp", u.mp, u.maxMp));
  copy.append(act, grid);
  if (aura) {
    const mark = document.createElement("p");
    mark.className = "aura-name";
    mark.textContent = aura;
    copy.appendChild(mark);
  }
  const armed = active && actRecord(active);
  const touch = active && active.team === "ally" && armed && u.team === "ally" && legalTarget(active, u)
    && (armed.kind === "item" || armed.target === "ally" || armed.target === "self" || armed.overlay === "self");
  if (touch) {
    const use = document.createElement("button");
    use.type = "button";
    use.className = "cmd";
    use.textContent = armed.kind === "item" ? "Use" : (armed.target === "self" || armed.overlay === "self" ? "Raise" : "Cast");
    use.addEventListener("click", (ev) => {
      ev.stopPropagation();
      confirmAct(active, u);
    });
    copy.appendChild(use);
  }
  card.append(img, copy);
  card.addEventListener("click", () => {
    if (!battle) return;
    battle.hover = { x: u.x, y: u.y };
    document.querySelectorAll(".unit-card").forEach((el) => el.classList.toggle("is-look", el === card));
    forecast();
  });
  return card;
}

function paintRosters(active) {
  const party = $("party");
  const foes = $("foe-list");
  if (!party || !foes) return;
  party.textContent = "";
  foes.textContent = "";
  const allyHead = document.createElement("p");
  allyHead.className = "kicker";
  allyHead.textContent = "Company";
  const foeHead = document.createElement("p");
  foeHead.className = "kicker";
  foeHead.textContent = "Opposition";
  const allyRow = document.createElement("div");
  allyRow.className = "roster-row";
  const foeRow = document.createElement("div");
  foeRow.className = "roster-row";
  party.append(allyHead, allyRow);
  foes.append(foeHead, foeRow);
  battle.units.forEach((u) => {
    (u.team === "foe" ? foeRow : allyRow).appendChild(unitCard(u, active));
  });
}

function forecast() {
  const h = battle.hover;
  const name = $("fc-name");
  const body = $("fc-body");
  const kick = $("fc-kicker");
  if (!h) {
    if (kick) kick.textContent = "Look";
    name.textContent = inScene && sceneSpec ? sceneSpec.title : "The thicket";
    let line = battle.floorNote || "Moon on the moss. Water does not take a step.";
    if (tunedShade()) {
      const shade = battle.units.find((u) => u.id === "shade");
      if (shade) line = "shade-beast · HP " + shade.maxHp + " · MAG " + shade.MAG + ". " + line;
    }
    body.textContent = line;
    return;
  }
  const u = unitAt(h.x, h.y);
  const active = current();
  if (u) {
    if (kick) kick.textContent = "Read";
    name.textContent = u.name;
    const lines = [
      (u.hp <= 0 ? "Down" : (u.hp + " / " + u.maxHp + " HP")) + (u.maxMp ? " · " + u.mp + " / " + u.maxMp + " MP" : ""),
      "ATK " + u.ATK + "   DEF " + u.DEF + "   MAG " + u.MAG,
      "RES " + u.RES + "   SPD " + u.spd + "   MOV " + u.mov,
      shownAct(u).name + " · reach " + shownAct(u).reach
    ];
    const aura = auraLine(u);
    if (aura) lines.push(aura + ".");
    if (active && active.team === "ally" && u.team === "foe") {
      const face = relation(active, u);
      const dz = tileAt(active.x, active.y).z - tileAt(u.x, u.y).z;
      const rec = actRecord(active);
      const kind = rec ? rec.kind : active.kind;
      const reachN = rec ? rec.reach : active.reach;
      const actName = rec ? rec.name : active.skill;
      const hit = C.previewHit(active, u, face, dz, kind);
      const dist = Math.max(Math.abs(u.x - active.x), Math.abs(u.y - active.y));
      const inReach = dist >= 1 && dist <= reachN;
      lines.push(actName + " · " + face + " · " + hit + "%");
      lines.push(inReach ? "In reach from where you stand." : "Out of reach from this tile.");
    }
    body.textContent = lines.join("\n");
    return;
  }
  const t = tileAt(h.x, h.y);
  if (kick) kick.textContent = "Ground";
  const groundNames = { water: "Moonwater", path: "The path", yard: "Yard stone", rock: "Ridge stone", thicket: "Thicket", meadow: "Moss" };
  name.textContent = groundNames[t.scenic] || groundNames[t.ground] || (t.ground === "water" ? "Moonwater" : "Moss");
  body.textContent = t.block ? "You cannot step here." : "Open ground.";
}

function spriteBox(u) {
  const t = tileAt(u.x, u.y);
  if (!t) return null;
  const p = cellPos(u.x, u.y, t.z);
  const cy = p.cy - liftOf(elevOf(t), TH);
  const h = TH * figureScale(u);
  const img = art[u.sprite];
  const ratio = img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : 0.7;
  const dw = h * ratio;
  const footY = cy + TH / 2 - 6;
  return { t, left: p.cx - dw / 2, right: p.cx + dw / 2, top: footY - h, bottom: footY + 8 };
}

function pointer(ev) {
  const rect = canvas.getBoundingClientRect();
  const px = ev.clientX - rect.left;
  const py = ev.clientY - rect.top;
  const figures = battle.units.filter((u) => u.hp > 0).sort((a, b) => (b.x + b.y) - (a.x + a.y));
  for (const u of figures) {
    const box = spriteBox(u);
    if (box && px >= box.left && px <= box.right && py >= box.top && py <= box.bottom) return box.t;
  }
  let found = null;
  const order = battle.tiles.slice().sort((a, b) => (b.x + b.y) - (a.x + a.y));
  for (const t of order) {
    const p = cellPos(t.x, t.y, t.z);
    if (inDiamond(px, py, p.cx, p.cy, TW, TH)) {
      found = t;
      break;
    }
  }
  return found;
}

function onMove(ev) {
  if (!battle || battle.over) return;
  const t = pointer(ev);
  const next = t ? { x: t.x, y: t.y } : null;
  const same = (!battle.hover && !next) || (battle.hover && next && battle.hover.x === next.x && battle.hover.y === next.y);
  if (same) return;
  battle.hover = next;
  forecast();
}

function legalTarget(active, standing) {
  if (!active || !standing) return false;
  const rec = actRecord(active);
  const reachN = rec ? rec.reach : active.reach;
  const dist = Math.max(Math.abs(standing.x - active.x), Math.abs(standing.y - active.y));
  const target = rec ? rec.target : "foe";
  if (rec && rec.kind === "item") {
    const dz = Math.abs((tileAt(active.x, active.y).z || 0) - (tileAt(standing.x, standing.y).z || 0));
    if (dz > 2 || dist > reachN) return false;
  }
  if (target === "self") return standing === active;
  if (target === "ally") return standing.team === "ally" && dist <= reachN;
  return standing.team !== active.team && dist >= 1 && dist <= reachN;
}

function onClick(ev) {
  if (!battle || battle.over || battle.lock) return;
  const t = pointer(ev);
  if (!t) return;
  const active = current();
  if (!active || active.team !== "ally") return;
  const standing = unitAt(t.x, t.y);
  if (legalTarget(active, standing)) {
    confirmAct(active, standing);
    return;
  }
  if (standing && standing.team !== active.team) {
    const rec = actRecord(active);
    const target = rec ? rec.target : "foe";
    if (target === "foe" || target === "foes") {
      battle.note = "Out of reach from this tile.";
      paint();
    }
    return;
  }
  if (battle.mode === "move" && !active.moved && !standing) {
    const ok = reach(active, active.mov, active.jump).some((m) => m.x === t.x && m.y === t.y);
    if (!ok) return;
    faceToward(active, t.x, t.y);
    active.x = t.x;
    active.y = t.y;
    active.z = t.z;
    active.moved = true;
    battle.mode = "strike";
    armPending(active);
    sfx.step();
    paint();
  }
}

function say(text) {
  $("float-log").textContent = text;
}

function shownAct(u) {
  const armed = battle && current() === u ? actRecord(u) : null;
  if (armed) return { name: armed.name, reach: armed.reach == null ? 1 : armed.reach };
  const rec = u && u.known && u.known.length ? defaultAct(u.known) : null;
  if (rec) return { name: rec.name, reach: rec.reach == null ? 1 : rec.reach };
  return { name: (u && u.skill) || "Strike", reach: u && u.reach != null ? u.reach : 1 };
}

function labelFor(u) {
  return shownAct(u).name;
}

function armPending(u) {
  if (battle && battle.pendingAct && String(battle.pendingAct).indexOf("item:") === 0) return;
  if (!u || !u.known || !u.known.length) return;
  if (!battle.pendingAct || !u.known.some((row) => row.id === battle.pendingAct)) {
    const rec = defaultAct(u.known);
    battle.pendingAct = rec ? rec.id : null;
  }
}

function paintActs(active) {
  const list = $("act-list");
  if (!list) return;
  list.textContent = "";
  if (!active || !active.known || !active.known.length || battle.mode !== "strike" || battle.lock) {
    list.hidden = true;
    return;
  }
  list.hidden = false;
  const chosen = actRecord(active);
  active.known.forEach((rec) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cmd" + (chosen && chosen.id === rec.id ? " on" : "");
    button.textContent = rec.name;
    button.addEventListener("click", () => {
      battle.pendingAct = rec.id;
      battle.note = "";
      paint();
    });
    list.appendChild(button);
  });
  const slot = readCalling();
  (slot && slot.bag || []).forEach((row) => {
    const rec = itemRecord(row.id);
    if (!rec || row.n < 1) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cmd" + (chosen && chosen.id === rec.id ? " on" : "");
    button.textContent = rec.name + " " + row.n;
    button.addEventListener("click", () => {
      battle.pendingAct = rec.id;
      battle.note = rec.target === "self" ? "Use it on yourself." : "Choose a friend within four tiles.";
      battle.mode = "strike";
      paint();
    });
    list.appendChild(button);
  });
}

function cardForBattle() {
  const params = new URLSearchParams(location.search);
  if (bareFight || tunedShade() || params.has("fight") || params.has("walk")) return null;
  const read = readSave(localStorage);
  if (!read.ok || !read.doc) return null;
  const slot = read.doc.slots.find((row) => row);
  if (!slot) return null;
  const serenya = slot.party.find((row) => row.id === "serenya");
  if (!serenya || !serenya.calling) return null;
  return JSON.parse(JSON.stringify(slot));
}

function loadBattleBooks() {
  if (battleBooks) return Promise.resolve(battleBooks);
  return Promise.all([
    fetch("data/units.json").then((res) => res.json()),
    fetch("data/callings.json").then((res) => res.json()),
    fetch("data/items.json").then((res) => res.json()),
    fetch("data/skills.json").then((res) => res.json()),
    fetch("data/tree.json").then((res) => res.json()).catch(() => null),
    fetch("data/drops.json").then((res) => res.json()).catch(() => ({ pages: {} }))
  ]).then(([units, callings, items, skills, tree, drops]) => {
    battleBooks = {
      units: indexById(units.units),
      callings: indexById(callings.callings),
      items: indexById(items.items),
      skills: indexById(skills.skills),
      tree: tree ? prepareTree(tree) : null,
      drops: drops || { pages: {} }
    };
    return battleBooks;
  });
}

function confirmAct(att, tar) {
  const record = actRecord(att);
  if (record && record.kind === "item") {
    useItem(att, tar, record);
    return;
  }
  if (!record) {
    beginStrike(att, tar, () => {
      att.acted = true;
      endTurn(att);
    });
    return;
  }
  if (record.mp && att.mp < record.mp) {
    battle.note = "Not enough MP.";
    paint();
    return;
  }
  att.mp -= record.mp || 0;
  if (record.target === "ally") {
    const variance = 0.9 + 0.2 * battle.rng.next();
    const raw = att.MAG * (record.power / 100) * (att.ACCORD / 100) * variance;
    const rolled = Math.max(1, Math.round(raw));
    const add = Math.min(rolled, Math.max(0, tar.maxHp - tar.hp));
    tar.hp += add;
    say(att.name + " · " + record.name + " → " + tar.name + "  +" + add);
    sfx.impact("seal", false);
    flourish(att, tar, "heal", "seal");
    const at = screenOf(tar);
    battle.pops.push({ x: at.x, y: at.y - 18, text: "+" + add, hit: true, crit: false, t0: performance.now() });
    att.acted = true;
    endTurn(att);
    return;
  }
  if (record.target === "self") {
    att.guard = true;
    att.skill = record.name;
    say(att.name + " · " + record.name);
    sfx.launch(record.style || "bronze");
    flourish(att, att, "self", record.style || "bronze");
    att.acted = true;
    endTurn(att);
    return;
  }
  att.overlay = record.overlay || "";
  att.reach = record.reach;
  att.kind = record.kind;
  att.power = record.power;
  att.style = record.style;
  att.skill = record.name;
  att.element = record.element;
  beginStrike(att, tar, () => {
    att.acted = true;
    endTurn(att);
  });
}

function startBattle() {
  const card = cardForBattle();
  if (card && !battleBooks) {
    loadBattleBooks().then(() => startBattle());
    return;
  }
  pinRoadCheckpoint();
  const fromWorld = world !== null;
  battle = makeBattle(card);
  battle.fromWorld = fromWorld;
  if (fromWorld && world) world.fighting = true;
  $("title-card").hidden = true;
  $("battle").hidden = false;
  $("battle").classList.add("fight-window");
  document.body.classList.add("in-fight");
  $("end").hidden = true;
  $("fight-kicker").textContent = fromWorld ? "Fight" : (inScene && sceneSpec ? "Fight" : "Chapter 1");
  $("fight-title").textContent = inScene && sceneSpec ? sceneSpec.title : "The Thicket";
  frame += 1;
  const token = frame;
  requestAnimationFrame(() => {
    armDemo();
    kickTurn();
    requestAnimationFrame(() => loop(token));
  });
}

function armDemo() {
  const params = new URLSearchParams(location.search);
  const demo = params.get("demo");
  if (!demo || !battle) return;
  const ser = battle.units.find((u) => u.id === "serenya");
  const emb = battle.units.find((u) => u.id === "emberion");
  const shade = battle.units.find((u) => u.id === "shade");
  if (demo === "bolt") {
    ser.x = 3;
    ser.y = 4;
    shade.x = 5;
    shade.y = 2;
    faceToward(ser, shade.x, shade.y);
    beginStrike(ser, shade, () => {});
  } else if (demo === "claw") {
    emb.x = 4;
    emb.y = 2;
    shade.x = 5;
    shade.y = 2;
    faceToward(emb, shade.x, shade.y);
    beginStrike(emb, shade, () => {});
  }
  if (params.has("hold") && battle.fx[0]) battle.fx[0].hold = true;
}

function loop(token) {
  if (token !== frame || !battle) return;
  tickFx();
  drawBoard();
  if (!battle.over) requestAnimationFrame(() => loop(token));
}

let openingDoc = null;
let leaveCell = { x: 8, y: 19, facing: 2 };

function ensureOpening() {
  if (openingDoc) return Promise.resolve(openingDoc);
  return fetch("data/maps/opening.json").then((res) => res.json()).then((doc) => {
    openingDoc = doc;
    if (doc.leave) leaveCell = { x: doc.leave.x, y: doc.leave.y, facing: 2 };
    return doc;
  });
}

function wCell(x, y) {
  const camX = world && world.camX ? world.camX : 0;
  const camY = world && world.camY ? world.camY : 0;
  return {
    cx: wOX + (x - y) * (wTW / 2) - camX,
    cy: wOY + (x + y) * (wTH / 2) - camY
  };
}

function resizeWorld() {
  const wrap = vale.parentElement;
  const w = Math.max(320, wrap.clientWidth);
  const h = Math.max(280, wrap.clientHeight);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const pw = Math.floor(w * dpr);
  const ph = Math.floor(h * dpr);
  if (vale.width !== pw || vale.height !== ph) {
    vale.width = pw;
    vale.height = ph;
  }
  wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (world && world.mode === "region") {
    wTW = window.matchMedia("(max-width: 800px)").matches ? 48 : 64;
    wTH = wTW / 2;
    wOX = w / 2;
    wOY = h / 2;
    return;
  }
  const cols = world ? world.cols : 14;
  const rows = world ? world.rows : 10;
  const span = cols + rows;
  const fitW = (w - 36) / span;
  const fitH = (h - 80) / span;
  wTW = Math.max(40, Math.min(92, Math.floor(Math.min(fitW * 2, fitH * 4))));
  if (wTW % 2) wTW -= 1;
  wTH = wTW / 2;
  wOX = w / 2;
  const mapH = (cols + rows) * (wTH / 2);
  wOY = Math.max(wTH, (h - mapH) / 2 + wTH);
}

function surfaceOf(x, y) {
  const p = wCell(x, y);
  const tile = world.byKey.get(x + "," + y);
  return { cx: p.cx, cy: p.cy - liftOf(elevOf(tile), wTH) };
}

function drawProp(tile) {
  const img = props[tile.prop];
  if (!img || !img.complete || !img.naturalWidth) return;
  const p = surfaceOf(tile.x, tile.y);
  const h = wTH * (PROP_H[tile.prop] || 2);
  const dw = h * (img.naturalWidth / img.naturalHeight);
  const footY = p.cy + wTH / 2 - 2;
  wctx.save();
  wctx.fillStyle = "rgba(0,0,0,0.28)";
  wctx.beginPath();
  wctx.ellipse(p.cx, footY, Math.min(dw * 0.28, wTW * 0.46), wTH * 0.16, 0, 0, Math.PI * 2);
  wctx.fill();
  wctx.drawImage(img, p.cx - dw / 2, footY - h, dw, h);
  wctx.restore();
}

function drawActor(actor, danger) {
  const p = surfaceOf(actor.x, actor.y);
  const img = art[actor.sprite];
  const h = actor.sprite === "emberion" ? wTH * 2.35 : wTH * 2.15;
  const ratio = img.naturalWidth ? img.naturalWidth / img.naturalHeight : 0.7;
  const dw = h * ratio;
  const footY = p.cy + wTH / 2 - 4;
  wctx.save();
  wctx.fillStyle = "rgba(0,0,0,0.35)";
  wctx.beginPath();
  wctx.ellipse(p.cx, footY, wTW * 0.26, wTH * 0.16, 0, 0, Math.PI * 2);
  wctx.fill();
  wctx.translate(p.cx, footY);
  if (spriteFlip(actor)) wctx.scale(-1, 1);
  if (img.complete && img.naturalWidth) wctx.drawImage(img, -dw / 2, -h, dw, h);
  wctx.restore();
  if (danger) {
    wctx.save();
    diamondPath(wctx, p.cx, p.cy, wTW, wTH);
    wctx.strokeStyle = "rgba(224, 122, 104, 0.85)";
    wctx.lineWidth = 1.6;
    wctx.stroke();
    wctx.restore();
  }
}

function drawWorld() {
  resizeWorld();
  const w = vale.clientWidth;
  const h = vale.clientHeight;
  const sky = wctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#1a2744");
  sky.addColorStop(0.55, "#101828");
  sky.addColorStop(1, "#0c1412");
  wctx.fillStyle = sky;
  wctx.fillRect(0, 0, w, h);
  const moon = wctx.createRadialGradient(w * 0.78, h * 0.12, 8, w * 0.78, h * 0.12, w * 0.28);
  moon.addColorStop(0, "rgba(244, 232, 204, 0.55)");
  moon.addColorStop(0.18, "rgba(228, 194, 122, 0.18)");
  moon.addColorStop(1, "rgba(228, 194, 122, 0)");
  wctx.fillStyle = moon;
  wctx.beginPath();
  wctx.arc(w * 0.78, h * 0.12, w * 0.28, 0, Math.PI * 2);
  wctx.fill();
  const wall = wTH * 6;
  const shown = world.mode === "region"
    ? visibleTiles(world, wTW, wTH, wOX, wOY, (world.camX || 0) - wall, (world.camY || 0) - wall, w + wall * 2, h + wall * 2)
    : world.tiles;
  const order = shown.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y));
  for (const t of order) {
    const p = surfaceOf(t.x, t.y);
    drawTop(wctx, p.cx, p.cy, wTW, wTH, scenicOf(t));
  }
  for (const t of order) {
    const p = wCell(t.x, t.y);
    const east = world.byKey.get((t.x + 1) + "," + t.y);
    const south = world.byKey.get(t.x + "," + (t.y + 1));
    const elev = elevOf(t);
    drawCliffs(
      wctx, p.cx, p.cy, wTW, wTH, elev,
      east ? elevOf(east) : elev,
      south ? elevOf(south) : elev
    );
  }
  const hot = world.hover;
  if (hot) {
    const p = surfaceOf(hot.x, hot.y);
    wctx.save();
    diamondPath(wctx, p.cx, p.cy, wTW, wTH);
    wctx.strokeStyle = "rgba(228, 194, 122, 0.95)";
    wctx.lineWidth = 1.6;
    wctx.stroke();
    wctx.restore();
  }
  const sprites = [];
  for (const t of order) if (t.prop) sprites.push({ z: t.x + t.y, prop: t });
  const actors = [world.pet, world.hero];
  if (world.shade.alive) actors.push(world.shade);
  for (const actor of actors) sprites.push({ z: actor.x + actor.y, actor });
  sprites.sort((a, b) => a.z - b.z || (a.prop ? -1 : 1));
  for (const sprite of sprites) {
    if (sprite.prop) drawProp(sprite.prop);
    else drawActor(sprite.actor, sprite.actor === world.shade);
  }
}

function stepHero(x, y) {
  faceToward(world.hero, x, y);
  const outcome = stepWorld(world, x, y);
  world.pet.face = world.hero.face;
  sfx.step();
  if (outcome.town) openTownFromRoad();
  else if (outcome.dungeon) openMineFromRoad();
  else if (outcome.fight) openFight();
  noteWorld();
}

function openPractice() {
  if (isOpen()) return;
  openWindow({
    id: "opening-thicket",
    kind: "fight",
    title: "The Thicket",
    kicker: "Fight",
    placeId: "thicket",
    suspendTravel: true
  });
}

function openFight() {
  if (world.fighting || isOpen()) return;
  walk = null;
  $("world-note").textContent = "The shade steps out of the grass.";
  openWindow({
    id: "opening-thicket",
    kind: "fight",
    title: "The Thicket",
    kicker: "Fight",
    placeId: "thicket",
    suspendTravel: true
  });
}

function closeFight(retreat) {
  frame += 1;
  battle = null;
  $("battle").hidden = true;
  $("end").hidden = true;
  $("battle").classList.remove("fight-window");
  document.body.classList.remove("in-fight");
  if (!world) return;
  world.fighting = false;
  if (retreat && world.shade.alive) {
    const back = worldPathHome(world);
    if (back) {
      world.pet.x = world.hero.x;
      world.pet.y = world.hero.y;
      world.hero.x = back.x;
      world.hero.y = back.y;
    }
  }
  noteWorld();
  drawWorld();
}

function noteWorld() {
  const el = $("world-note");
  if (!world.shade.alive) el.textContent = "The grass is quiet. The shade does not return.";
  else if (nearShade(world)) el.textContent = "The shade steps out of the grass.";
  else if (world.mode === "region") {
    const tile = world.byKey.get(world.hero.x + "," + world.hero.y);
    const place = tile && tile.place ? tile.place : "road";
    el.textContent = place + ". Click a tile, or use the arrow keys.";
  } else el.textContent = "Click the moss, or use the arrow keys. A rose outline is the shade.";
}

function updateWalk(now) {
  if (!walk || world.fighting) return;
  if (now - walkStamp < 150) return;
  walkStamp = now;
  const step = walk.path[walk.i++];
  if (!step) {
    walk = null;
    return;
  }
  stepHero(step.x, step.y);
  if (world.fighting) walk = null;
}

function worldPointer(ev) {
  const rect = vale.getBoundingClientRect();
  const px = ev.clientX - rect.left;
  const py = ev.clientY - rect.top;
  let found = null;
  const order = world.tiles.slice().sort((a, b) => (b.x + b.y) - (a.x + a.y));
  for (const t of order) {
    const p = surfaceOf(t.x, t.y);
    if (inDiamond(px, py, p.cx, p.cy, wTW, wTH)) {
      found = t;
      break;
    }
  }
  return found;
}

function onWorldMove(ev) {
  if (!world || world.fighting) return;
  const t = worldPointer(ev);
  world.hover = t ? { x: t.x, y: t.y } : null;
}

function onWorldClick(ev) {
  if (!world || world.fighting) return;
  const t = worldPointer(ev);
  if (!t) return;
  if (world.shade.alive && t.x === world.shade.x && t.y === world.shade.y) {
    if (nearShade(world)) openFight();
    return;
  }
  if (t.block) return;
  const path = worldPath(world, t.x, t.y);
  if (!path || !path.length) return;
  walk = { path, i: 0 };
  walkStamp = 0;
}

function onKey(ev) {
  if (ev.key === "Escape" && escapeWindow()) {
    ev.preventDefault();
    return;
  }
  if (!world || world.fighting || $("world").hidden) return;
  const key = ev.key;
  const map = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
  if (!map[key]) return;
  ev.preventDefault();
  walk = null;
  const [dx, dy] = map[key];
  const x = world.hero.x + dx;
  const y = world.hero.y + dy;
  if (isBlocked(world, x, y)) {
    if (world.shade.alive && world.shade.x === x && world.shade.y === y && nearShade(world)) openFight();
    return;
  }
  stepHero(x, y);
}

function worldLoop(token) {
  if (token !== worldFrame || !world || $("world").hidden) return;
  const now = performance.now();
  easeCamera(now);
  updateWalk(now);
  drawWorld();
  requestAnimationFrame(() => worldLoop(token));
}

function easeCamera(now) {
  if (!world || world.mode !== "region") return;
  resizeWorld();
  const goal = heroCamera(world, wTW, wTH, wOX, wOY, vale.clientWidth, vale.clientHeight);
  const reduced = document.body.classList.contains("reduce-motion") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!world.camReady || reduced) {
    world.camX = goal.x;
    world.camY = goal.y;
    world.camFromX = goal.x;
    world.camFromY = goal.y;
    world.camGoalX = goal.x;
    world.camGoalY = goal.y;
    world.camStamp = now;
    world.camReady = true;
    return;
  }
  if (world.camGoalX !== goal.x || world.camGoalY !== goal.y) {
    world.camFromX = world.camX;
    world.camFromY = world.camY;
    world.camGoalX = goal.x;
    world.camGoalY = goal.y;
    world.camStamp = now;
  }
  const t = Math.min(1, (now - world.camStamp) / 120);
  world.camX = world.camFromX + (world.camGoalX - world.camFromX) * t;
  world.camY = world.camFromY + (world.camGoalY - world.camFromY) * t;
}

function showMap() {
  walk = null;
  $("title-card").hidden = true;
  $("world").hidden = false;
  $("battle").hidden = true;
  noteWorld();
  worldFrame += 1;
  const token = worldFrame;
  requestAnimationFrame(() => worldLoop(token));
}

function startSlice() {
  world = makeSliceWorld();
  showMap();
}

function startRegion(spawn) {
  return ensureOpening().then((doc) => {
    let slot = readCalling();
    let at = spawn || leaveCell;
    if (slot && slot.battleCheckpoint && !(slot.pendingPlate && slot.pendingPlate.applied === false)) {
      const saved = slot.battleCheckpoint.pos || at;
      editCallingSlot(localStorage, (row) => {
        restoreCheckpoint(row);
      });
      slot = readCalling();
      at = saved;
    }
    world = makeRegionWorld(doc, {
      x: at.x,
      y: at.y,
      facing: at.facing == null ? 2 : at.facing,
      shadeAlive: !slot || slot.shadeAlive !== false
    });
    writeRegionPos();
    showMap();
    if (slot && slot.pendingPlate && slot.pendingPlate.applied === false) offerRoadPlate(slot.pendingPlate);
  });
}

function writeRegionPos() {
  if (!world || world.mode !== "region") return;
  editCallingSlot(localStorage, (slot) => {
    slot.pos = {
      map: "opening",
      x: world.hero.x,
      y: world.hero.y,
      facing: world.hero.face
    };
  });
}

function savedPos() {
  const slot = readCalling();
  return slot ? slot.pos : null;
}

function placeOnCell(cell) {
  if (world && world.mode === "region") {
    placeHero(world, cell.x, cell.y, cell.facing == null ? 2 : cell.facing);
    writeRegionPos();
    noteWorld();
    drawWorld();
    return;
  }
  return startRegion(cell);
}

function placeOnLeave() {
  return placeOnCell(leaveCell);
}

function storyWinLine() {
  const beat = currentBeat();
  const spec = sceneSpec;
  const id = (beat && beat.id) || (spec && spec.id);
  if (spec && spec.flag) noteStoryFlag(spec.flag);
  const paid = spec && spec.pay === false ? null : payStoryPage(id);
  const lead = spec && spec.winLine ? spec.winLine : "The grass goes quiet.";
  if (!paid) return lead;
  const found = paid.found && paid.found.length ? " She finds " + paid.found.join(" and ") + "." : "";
  return lead + " She takes " + paid.measures + " Measure and " + paid.embers + " Embers." + found;
}

function noteStoryFlag(flag) {
  editCallingSlot(localStorage, (slot) => {
    if (!slot.flags) slot.flags = {};
    slot.flags[flag] = true;
  });
}

function payStoryPage(id) {
  if (!id) return null;
  let paid = null;
  editCallingSlot(localStorage, (slot) => {
    if (!Array.isArray(slot.cleared)) slot.cleared = [];
    if (slot.cleared.indexOf(id) >= 0) return;
    slot.cleared.push(id);
    const hero = (slot.party || []).find((unit) => unit.id === "serenya" && unit.anchor);
    const measures = hero ? 1 : 0;
    if (hero) hero.measures = (hero.measures || 0) + measures;
    const embers = 80 + 20 * (slot.chapterIndex || 0);
    slot.embers = (slot.embers || 0) + embers;
    const found = grantStoryPage(slot, id);
    paid = { measures, embers, found };
  });
  return paid;
}

function grantStoryPage(slot, id) {
  if (!id) return [];
  if (battleBooks) return grantPage(slot, id, battleBooks.items, battleBooks.drops) || [];
  loadBattleBooks().then(() => {
    let found = [];
    editCallingSlot(localStorage, (row) => {
      found = grantPage(row, id, battleBooks.items, battleBooks.drops) || [];
    });
    const body = $("end-body");
    if (found.length && body && body.textContent.indexOf(found[0]) < 0) {
      body.textContent += " She finds " + found.join(" and ") + ".";
    }
  });
  return [];
}

function markPage(id) {
  if (!id) return;
  const beat = currentBeat();
  editCallingSlot(localStorage, (slot) => {
    slot.page = id;
    if (beat && typeof beat.chapter === "number") slot.chapterIndex = beat.chapter;
    if (beat && beat.flag && !beat.fight) {
      if (!slot.flags) slot.flags = {};
      slot.flags[beat.flag] = true;
    }
    if (beat && !beat.fight) grantStoryPage(slot, id);
  });
}

function levelThenPage() {
  hideScene();
  openTown().then(() => {
    refreshMenu();
    inScene = true;
    $("title-card").hidden = true;
    showScene();
  }).catch(() => {
    inScene = true;
    showScene();
  });
}

function cutStoryProgress() {
  const read = readSave(localStorage);
  if (!read.ok || !read.doc) return;
  read.doc.slots.forEach((slot) => {
    if (!slot) return;
    slot.page = null;
    slot.chapterIndex = 0;
    slot.pos = null;
    slot.pendingPlate = null;
    slot.battleCheckpoint = null;
  });
  writeSave(localStorage, read.doc);
}

function openBook(fromStart) {
  $("title-card").hidden = true;
  $("world").hidden = true;
  $("battle").hidden = true;
  hideScene();
  inScene = true;
  const slot = readCalling();
  const page = fromStart ? null : (slot && slot.page);
  openScenes({
    onFight: openSceneFight,
    onLevel: levelThenPage,
    onMark: markPage,
    onMenu() {
      inScene = false;
      hideScene();
      showTitle();
    }
  }, page).catch(() => {
    inScene = false;
    showTitle();
  });
}

function openSceneFight() {
  if (isOpen()) return;
  const beat = currentBeat() || {};
  sceneSpec = {
    id: beat.battle || beat.id,
    title: beat.fightTitle || beat.kicker || "The Thicket",
    foes: beat.foes || ["shade-beast"],
    pay: beat.pay !== false,
    winLine: beat.winLine || "",
    loseLine: beat.loseLine || "",
    flag: beat.flag || ""
  };
  const go = () => {
    hideScene();
    openWindow({
      id: sceneSpec.id,
      kind: "fight",
      title: sceneSpec.title,
      kicker: "Fight",
      placeId: "thicket",
      suspendTravel: true
    });
  };
  if (foeBook) go();
  else fetch("data/foes.json").then((res) => res.json()).then((book) => { foeBook = book; go(); }).catch(() => { sceneSpec.foes = null; go(); });
}

function afterTown(result) {
  refreshMenu();
  if (!result || result.kind !== "town" || result.result !== "leave") return;
  openBook();
}

function openTownFromRoad() {
  if (!world || world.fighting || isOpen()) return;
  walk = null;
  world.fighting = true;
  writeRegionPos();
  openTown().then((result) => {
    afterTown(result);
  }).finally(() => {
    if (world) world.fighting = false;
  });
}

function afterDungeon(result) {
  if (!result || result.kind !== "dungeon" || result.result !== "leave") return;
  placeOnCell(mineLeaveCell());
}

function openMineFromRoad() {
  if (!world || world.fighting || isOpen()) return;
  walk = null;
  world.fighting = true;
  writeRegionPos();
  openDungeon().then((result) => {
    afterDungeon(result);
  }).finally(() => {
    if (world) world.fighting = false;
  });
}

function openArmory() {
  $("title-card").hidden = true;
  $("world").hidden = true;
  const frame = $("battle");
  frame.hidden = false;
  frame.classList.add("fight-window", "armory-on");
  resize();
  import("./armory.js?v=20261008-aura").then((mod) => {
    mod.start({
      resize,
      metrics: () => ({ TW, TH, ZH, originX, originY }),
      onMenu: showTitle
    });
  });
}

function wakeRadio() {
  Promise.resolve().then(() => bootRadio()).catch(() => {});
}

function releaseStuck() {
  const place = $("place-window");
  const field = $("battle");
  const end = $("end");
  if (isOpen() && place.hidden && field.hidden && end.hidden) closeWindow({ result: "cancel" });
}

function boot() {
  const params = new URLSearchParams(location.search);
  if (params.has("debug")) {
    globalThis.__moonlitDebug = true;
    globalThis.__moonlitShell = {
      openWindow,
      closeWindow,
      isOpen,
      escapeWindow,
      startBattle,
      world: () => world && ({
        mode: world.mode,
        x: world.hero.x,
        y: world.hero.y,
        petX: world.pet.x,
        petY: world.pet.y,
        camX: world.camX,
        camY: world.camY,
        shade: world.shade.alive
      }),
      place(x, y) {
        if (!world) return null;
        placeHero(world, x, y, world.hero.face);
        noteWorld();
        drawWorld();
        return this.world();
      },
      meetShade() {
        if (world) openFight();
        return isOpen();
      },
      raiseShade() {
        if (!world) return false;
        world.shade.alive = true;
        noteWorld();
        drawWorld();
        return true;
      },
      nick(id, hp) {
        if (!battle) return false;
        const unit = battle.units.find((row) => row.id === id);
        if (!unit) return false;
        unit.hp = hp;
        return true;
      },
      winFight() {
        if (!battle) return false;
        const foe = battle.units.find((unit) => unit.team === "foe");
        if (foe) foe.hp = 0;
        finish({ result: "win" });
        return true;
      },
      loseFight() {
        if (!battle) return false;
        const hero = battle.units.find((unit) => unit.id === "serenya");
        if (hero) hero.hp = 0;
        finish({ result: "lose" });
        return true;
      },
      foe: () => {
        if (!battle) return null;
        const foe = battle.units.find((unit) => unit.team === "foe");
        return foe ? { hp: foe.hp, maxHp: foe.maxHp, skill: foe.skill, power: foe.power, card: battle.card } : null;
      },
      roster: () => {
        if (!battle) return [];
        return battle.units.map((unit) => ({
          id: unit.id,
          name: unit.name,
          skill: unit.skill,
          reach: unit.reach,
          power: unit.power,
          kind: unit.kind,
          boons: (unit.boons || []).map((boon) => ({ kind: boon.kind, left: boon.left, fresh: !!boon.fresh }))
        }));
      },
      foes() {
        if (!battle) return [];
        return battle.units.filter((unit) => unit.team === "foe").map((unit) => ({ name: unit.name, hp: unit.maxHp }));
      },
      save: () => {
        const slot = readCalling();
        if (!slot) return null;
        const hero = slot.party.find((unit) => unit.id === "serenya");
        const check = slot.battleCheckpoint;
        return {
          embers: slot.embers,
          shadeAlive: slot.shadeAlive !== false,
          measures: hero ? hero.measures : null,
          hp: hero ? hero.hp : null,
          mp: hero ? hero.mp : null,
          bag: slot.bag,
          pending: slot.pendingPlate,
          checkpoint: check ? {
            embers: check.embers,
            x: check.pos && check.pos.x,
            y: check.pos && check.pos.y,
            shadeAlive: check.shadeAlive !== false
          } : null,
          pos: slot.pos
        };
      }
    };
  }
  bindTravel({
    suspend() { if (world) world.fighting = true; },
    resume() { if (world) world.fighting = false; }
  });
  bindHooks({
    onFight() { startBattle(); },
    onFightClose(body) {
      const road = isRoadBattle();
      const win = body.result === "win";
      if (road && win) applyRoadConfirm();
      closeFight(!!body.retreat);
      if (road && !win && body.retreat) writeLossReturn();
      bareFight = false;
      menuDrill = false;
      if (inScene) {
        $("battle").hidden = true;
        $("end").hidden = true;
        $("battle").classList.remove("fight-window");
        document.body.classList.remove("in-fight");
        sceneSpec = null;
        if (win) resumeAfterFight(true);
        else levelThenPage();
        return;
      }
      if (!world) {
        $("battle").hidden = true;
        $("title-card").hidden = false;
        refreshMenu();
      }
    }
  });
  $("place-leave").addEventListener("click", () => {
    const result = $("place-leave").dataset.result || "leave";
    closeWindow({ result, retreat: false, embers: 0 });
  });
  let agreed = false;
  try {
    agreed = sessionStorage.getItem("moonlit-credits") === "1" || params.has("play") || params.has("fight") || params.has("walk");
  } catch (err) { agreed = params.has("play") || params.has("fight") || params.has("walk"); }
  bindMenu({
    onContinue() {
      releaseLoft();
      wakeRadio();
      releaseStuck();
      $("title-card").hidden = true;
      const pos = savedPos();
      const slot = readCalling();
      const midFight = slot && (slot.pendingPlate || slot.battleCheckpoint);
      if (pos && pos.map === "opening" && midFight) startRegion(pos);
      else if ((slot && slot.page) || (pos && pos.map === "opening")) openBook();
      else openTown().then(afterTown).catch(() => { $("title-card").hidden = false; });
    },
    onFresh(id) {
      const callingId = String(id || "").replace(/^start-/, "");
      if (callingId !== "cantor" && callingId !== "warden" && callingId !== "kindler") return;
      try { sessionStorage.setItem("moonlit-credits", "1"); } catch (err) { /* the next page still starts */ }
      try { localStorage.removeItem("moonlit-tactics-save-v1"); } catch (err) { /* boot writes a fresh save */ }
      const next = new URL(location.href);
      next.searchParams.set("new", callingId);
      location.assign(next.pathname + next.search);
    },
    onPractice() {
      bareFight = true;
      menuDrill = false;
      wakeRadio();
      releaseStuck();
      openPractice();
    },
    onDrill() {
      wakeRadio();
      const run = () => {
        bareFight = true;
        menuDrill = true;
        releaseStuck();
        openPractice();
      };
      if (foeBook) run();
      else fetch("data/foes.json").then((res) => res.json()).then((book) => { foeBook = book; run(); }).catch(() => {
        const note = $("menu-lock");
        if (note) {
          note.hidden = false;
          note.textContent = "The shade drill did not load.";
        }
      });
    },
    onArmory() {
      wakeRadio();
      releaseStuck();
      openArmory();
    },
    onWalk() {
      if (params.has("armory")) return;
      wakeRadio();
      releaseStuck();
      if (isOpen()) return;
      startSlice();
    },
    onHatchery() {
      wakeRadio();
      releaseStuck();
      if (isOpen()) return;
      $("title-card").hidden = true;
      openTown().then((result) => {
        afterTown(result);
        if (!result || result.result !== "leave") $("title-card").hidden = false;
      }).catch(() => { $("title-card").hidden = false; });
    },
    onSfx() { sfx.launch("seal"); },
    onCredits(on) {
      if (!on) return;
      wakeRadio();
      sfx.launch("seal");
      if (params.has("armory")) openArmory();
    }
  });
  syncMenu(agreed);
  window.__valeStart = activate;
  (window.__valeQueue || []).splice(0).forEach((id) => activate(id));
  $("world-menu").addEventListener("click", () => {
    if (world && world.fighting) return;
    showTitle();
  });
  $("end-again").addEventListener("click", () => {
    if (world) world.fighting = false;
    startBattle();
  });
  $("end-leave").addEventListener("click", () => {
    closeWindow();
  });
  $("cmd-move").addEventListener("click", () => {
    if (battle && !battle.lock) {
      cue("ui");
      battle.mode = "move";
      paint();
    }
  });
  $("cmd-strike").addEventListener("click", () => {
    if (battle && !battle.lock) {
      cue("ui");
      battle.mode = "strike";
      battle.note = "";
      const active = current();
      if (active) armPending(active);
      paint();
    }
  });
  $("cmd-wait").addEventListener("click", () => {
    const u = current();
    if (!u || u.team !== "ally" || battle.lock) return;
    cue("settle");
    endTurn(u);
  });
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onClick);
  vale.addEventListener("pointermove", onWorldMove);
  vale.addEventListener("pointerdown", onWorldClick);
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", () => {
    if (battle) paint();
    if (world) drawWorld();
  });
  loadBattleBooks();
  const freshCalling = params.get("new");
  if (freshCalling === "cantor" || freshCalling === "warden" || freshCalling === "kindler") {
    try { sessionStorage.setItem("moonlit-credits", "1"); } catch (err) { /* credits already accepted */ }
    syncMenu(true);
    $("title-card").hidden = true;
    $("world").hidden = true;
    $("battle").hidden = true;
    hideScene();
    const kicker = $("scene-kicker");
    const line = $("scene-line");
    const plate = $("scene-plate");
    const banner = $("scene-banner");
    if (kicker) kicker.textContent = "The loft";
    if (line) line.textContent = "Serenya wakes in the Hatchery loft before the bell.";
    if (plate) plate.src = "assets/scenes/loft.jpg";
    if (banner) banner.hidden = false;
    $("scene").hidden = false;
    writeFresh(freshCalling).then((ok) => {
      const clean = new URL(location.href);
      clean.searchParams.delete("new");
      history.replaceState(null, "", clean.pathname + clean.search + clean.hash);
      refreshMenu();
      if (!ok) {
        hideScene();
        $("title-card").hidden = false;
        return;
      }
      armLoft();
      openBook(true);
    }).catch(() => {
      hideScene();
      $("title-card").hidden = false;
    });
    return;
  }
  if (params.has("armory")) {
    if (sessionStorage.getItem("moonlit-credits") === "1") openArmory();
    return;
  }
  if (params.has("play") || params.has("fight") || params.has("walk")) {
    sessionStorage.setItem("moonlit-credits", "1");
    syncMenu(true);
    startSlice();
  }
  if (params.has("walk")) {
    const path = worldPath(world, 9, 3);
    if (path) {
      for (const step of path) {
        if (world.fighting) break;
        stepHero(step.x, step.y);
      }
    }
  }
  const tuned = params.get("foe") === "shade-beast";
  if (tuned) {
    sessionStorage.setItem("moonlit-credits", "1");
    syncMenu(true);
    fetch("data/foes.json").then((res) => res.json()).then((book) => {
      foeBook = book;
      if (!world) startSlice();
      startBattle();
    });
  } else if (params.has("fight")) {
    openWindow({
      id: "opening-thicket",
      kind: "fight",
      title: "The Thicket",
      kicker: "Fight",
      placeId: "thicket",
      suspendTravel: true
    });
  }
}

boot();
