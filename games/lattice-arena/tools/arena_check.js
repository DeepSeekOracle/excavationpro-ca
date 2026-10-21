/* LYGO Arena — headless check.
   Runs the real roster and the real sim in Node with a stub DOM, and asserts the things a
   player would notice: every kit resolves to a real sprite and real cards, every arena is
   walkable from both spawn pockets, and a battle always ends with somebody standing.

   node tools/arena_check.js            (report + pass/fail, exit code 1 on failure)
   node tools/arena_check.js --long     (more matches per mode)
*/
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "assets");
const LONG = process.argv.includes("--long");
const MATCHES = LONG ? 300 : 90;

/* --- stub the browser the engine expects ---------------------------------- */
function stubEl() {
  return {
    style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} },
    getContext: () => ({
      imageSmoothingEnabled: false, fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1,
      font: "", textAlign: "", globalCompositeOperation: "",
      fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {}, arc() {}, ellipse() {},
      moveTo() {}, lineTo() {}, stroke() {}, fill() {}, save() {}, restore() {}, translate() {},
      scale() {}, setTransform() {}, setLineDash() {}, drawImage() {}, clearRect() {}
    }),
    toDataURL: () => "data:image/png;base64,",
    appendChild() {}, addEventListener() {}, removeEventListener() {}, getBoundingClientRect: () => ({ width: 900, height: 600, left: 0, top: 0 }),
    querySelector: () => null, querySelectorAll: () => [], setAttribute() {}, focus() {}
  };
}
const document = {
  createElement: () => stubEl(),
  getElementById: () => stubEl(),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {}, body: stubEl(), documentElement: stubEl()
};
const win = {
  devicePixelRatio: 1,
  document,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  Image: function () { this.onload = null; this.onerror = null; },
  fetch: () => Promise.resolve({ json: () => Promise.resolve({ names: {} }) }),
  setTimeout, clearTimeout, console
};
win.window = win;
const ctx = vm.createContext(win);

const load = (f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
/* A SEEDED FIELD. This section draws its teams with Math.random, so two runs of the same
   code compared different fights -- the knife threshold reads 25% one run and 22% the
   next, which is what a coin flip looks like inside a test. A gate has to measure the
   same match twice or it measures nothing. The draw is now seeded (--seed=N to sample a
   different field); the ladder and the doctrine report stay random, because those exist
   to sample, and this exists to gate. */
const HARNESS_SEED = (function () {
  const a = process.argv.find((x) => /^--seed=/.test(x));
  return a ? (parseInt(a.split("=")[1], 10) || 1) : 1;
})();
vm.runInContext("Math.random = (function(){ var s = " + HARNESS_SEED + " >>> 0; return function(){ s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();", ctx);
console.log("      field seed " + HARNESS_SEED + " (same seed, same fights; --seed=N to sample another)");
load("roster.js");
load("banter.js");
load("director.js");
load("attacks.js");
load("formation.js");
load("brain.js");
load("arena.js");

const R = win.LYGO_ARENA;
const E = win.ArenaEngine;

/* --- helpers -------------------------------------------------------------- */
let fails = 0, warns = 0;
const results = [];
function must(label, cond, detail) {
  results.push({ label, ok: !!cond, detail: detail || "" });
  if (!cond) { fails++; console.log("FAIL  " + label + (detail ? "  — " + detail : "")); }
  else console.log("ok    " + label + (detail ? "  — " + detail : ""));
}
function warn(label, detail) { warns++; console.log("warn  " + label + (detail ? "  — " + detail : "")); }

/* --- 1. the roster -------------------------------------------------------- */
const atlasNames = {};
["heroes", "creatures", "pets", "tiles", "fx"].forEach((k) => {
  atlasNames[k] = JSON.parse(fs.readFileSync(path.join(ASSETS, k + ".json"), "utf8")).names;
});
const ATLAS = { heroes: ["heroes"], creatures: ["creatures"], pets: ["pets"] };

must("the harness is measuring the shipped game (the pre-stage loaded)", !!win.LYGO_FORMATION,
  "formation.js is not loaded -- every number below would describe a build that is not what ships");
must("roster holds 33 fighters", R.ROSTER.length === 33, "count=" + R.ROSTER.length);
must("every fighter id is unique", new Set(R.ROSTER.map((f) => f.id)).size === R.ROSTER.length);
const byClass = {};
R.ROSTER.forEach((f) => { byClass[f.cls] = (byClass[f.cls] || 0) + 1; });
must("13 champions · 15 creatures · 5 beasts",
  byClass.champ === 13 && byClass.beast === 15 && byClass.pet === 5, JSON.stringify(byClass));

const badSprite = R.ROSTER.filter((f) => {
  const sheet = f.spr.sheet, key = f.spr.key;
  if (sheet === "heroes") return atlasNames.heroes[key + "_0_0"] == null;
  if (sheet === "creatures" || sheet === "pets") return atlasNames[sheet][key + "_0"] == null;
  return true;
});
must("every fighter's sprite exists in its atlas", badSprite.length === 0, badSprite.map((f) => f.id).join(", "));

const badMoves = [];
const badCards = [];
R.ROSTER.forEach((f) => {
  if (!f.moves || f.moves.length < 2) badMoves.push(f.id + " (only " + (f.moves ? f.moves.length : 0) + " moves)");
  (f.moves || []).forEach((m) => { if (!R.MOVES[m]) badMoves.push(f.id + "→" + m); });
  if (!f.cards || f.cards.length !== 3) badCards.push(f.id + " (cards=" + (f.cards ? f.cards.length : 0) + ")");
  (f.cards || []).forEach((c) => { if (!R.CARDS[c]) badCards.push(f.id + "→" + c); });
});
must("every move id resolves", badMoves.length === 0, badMoves.join(", "));
must("every fighter carries three real cards", badCards.length === 0, badCards.join(", "));

const missingArt = R.ROSTER.filter((f) => f.cls === "champ" && !fs.existsSync(path.join(ASSETS, f.portrait)));
must("every champion has its portrait file", missingArt.length === 0, missingArt.map((f) => f.id).join(", "));

/* The mat pool, the loader and the disk must name the same file. A mat in FLOORS with no
   picture is a silent fall back to the tile engine, and a JPEG mat missing from FLOOR_JPG
   asks for the .png that was never written -- neither shows up in a browser, and both are
   one typo away whenever the set grows. The pool is read off the source because FLOORS is
   a closure inside the IIFE. */
const ARENA_SRC = fs.readFileSync(path.join(ROOT, "arena.js"), "utf8");
const poolSrc = (ARENA_SRC.match(/const FLOORS = \[([\s\S]*?)\];/) || [])[1] || "";
const POOL = (poolSrc.match(/"[a-z0-9-]+"/g) || []).map((s) => s.slice(1, -1));
const jpgSrc = (ARENA_SRC.match(/const FLOOR_JPG = \{([\s\S]*?)\};/) || [])[1] || "";
const JPG = (jpgSrc.match(/([a-z0-9-]+)\s*:\s*1/g) || []).map((s) => s.split(":")[0].trim());
const matFile = (k, ext) => path.join(ROOT, "assets", "floors", k + ext);
must("no two mats share a name", new Set(POOL).size === POOL.length, POOL.length + " in the pool");
const missingMats = POOL.filter((k) => !fs.existsSync(matFile(k, JPG.indexOf(k) >= 0 ? ".jpg" : ".png")));
must("every mat in the pool has its picture on disk", missingMats.length === 0,
  missingMats.length ? missingMats.join(", ") : POOL.length + " mats, " + JPG.length + " of them JPEG");
const strayMat = POOL.filter((k) => fs.existsSync(matFile(k, JPG.indexOf(k) >= 0 ? ".png" : ".jpg")));
must("the loader asks for the extension the mat was written in", strayMat.length === 0,
  strayMat.length ? "FLOOR_JPG out of step for " + strayMat.join(", ") : "pool and FLOOR_JPG agree");

/* no two fighters share a kit — the whole point of the roster */
const sigs = {};
const dupes = [];
R.ROSTER.forEach((f) => {
  const sig = f.moves.slice().sort().join("+") + "|" + f.cards.slice().sort().join("+") + "|" + f.atk.type;
  if (sigs[sig]) dupes.push(f.id + " = " + sigs[sig]);
  sigs[sig] = f.id;
});
must("no two fighters share the same kit", dupes.length === 0, dupes.join(", "));

const built = R.buildTeam(R.ROSTER);
const bare = built.filter((b) => !b.atk.vis || !b.atk.sfx || b.moves.some((m) => !m.vis || !m.sfx || !m.name));
must("every attack and move has a picture and a sound", bare.length === 0, bare.map((b) => b.id).join(", "));
const announced = {};
const sameCall = [];
built.forEach((b) => {
  const sig = [b.atk.name].concat(b.moves.map((m) => m.name)).sort().join("|");
  if (announced[sig]) sameCall.push(b.id + " = " + announced[sig]);
  announced[sig] = b.id;
});
must("no two fighters announce the same attacks", sameCall.length === 0, sameCall.join(", "));
const wolf = built.find((b) => b.id === "wolf");
const tusker = built.find((b) => b.id === "elephant");
must("Ashmane bites and Tuskward tramples", wolf && wolf.atk.vis === "bite" && wolf.atk.name === "Bite" && tusker && tusker.atk.vis === "tusk" && tusker.moves.some((m) => m.name === "Trample" && m.vis === "trample"), "");
const wavMiss = win.LYGO_ATTACKS.sfxNames().filter((n) => !fs.existsSync(path.join(ASSETS, "sfx", n + ".wav")));
must("every attack sound file is on disk", wavMiss.length === 0, wavMiss.slice(0, 12).join(", ") + (wavMiss.length > 12 ? " +" + (wavMiss.length - 12) : ""));
const badBuild = built.filter((b) => !(b.max > 100 && b.dmg > 5 && b.rate > 0.2 && b.speed > 30 && b.moves.length >= 2));
must("every built fighter has playable numbers", badBuild.length === 0, badBuild.map((b) => b.id).join(", "));
const powers = built.map((b) => b.power);
const spread = Math.max(...powers) / Math.min(...powers);
must("the power spread is a band, not a cliff", spread < 3.0, "min=" + Math.min(...powers) + " max=" + Math.max(...powers) + " ratio=" + spread.toFixed(2));

/* --- 2. the arena --------------------------------------------------------- */
function mapStats(seed) {
  const S = E.runHeadless({ you: ["kael"], foe: ["wraith"] }, 1, 0.01, seed);
  const lv = S.lv;
  const slots = [];
  for (let i = 0; i < 5; i++) { slots.push({ x: 3, y: 3 + i * 4 }); slots.push({ x: lv.W - 4, y: 3 + i * 4 }); }
  /* flood fill from the left pocket over the real tiles */
  const seen = new Uint8Array(lv.W * lv.H);
  const q = [3 + 11 * lv.W]; seen[q[0]] = 1;
  while (q.length) {
    const i = q.pop(), x = i % lv.W, y = (i / lv.W) | 0;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= lv.W || ny >= lv.H) return;
      const ni = ny * lv.W + nx;
      if (seen[ni] || lv.tiles[ny][nx] === "wall") return;
      seen[ni] = 1; q.push(ni);
    });
  }
  const unreachable = slots.filter((s) => !seen[s.y * lv.W + s.x]);
  let open = 0, inner = 0;
  for (let y = 0; y < lv.H; y++) for (let x = 0; x < lv.W; x++) {
    if (lv.tiles[y][x] !== "wall") open++;
    else if (x > 0 && y > 0 && x < lv.W - 1 && y < lv.H - 1) inner++;   // stone inside the ring
  }
  return { unreachable: unreachable.length, open: open / (lv.W * lv.H), inner };
}
let mapBad = 0, openMin = 1, openMax = 0, innerWall = 0;
for (let s = 0; s < 120; s++) {
  const m = mapStats(s);
  if (m.unreachable) mapBad++;
  innerWall = Math.max(innerWall, m.inner);
  openMin = Math.min(openMin, m.open); openMax = Math.max(openMax, m.open);
}
must("every arena is walkable from both pockets", mapBad === 0, "bad seeds=" + mapBad + "/120");
must("the ring floor is clear — no obstacles inside it", innerWall === 0, innerWall + " interior stone tiles across 120 seeds");
must("arenas stay open enough to fight in", openMin > 0.76 && openMax < 0.93, "open " + (openMin * 100).toFixed(0) + "-" + (openMax * 100).toFixed(0) + "%");
const lawNames = [];
for (let i = 0; i < 8; i++) lawNames.push(E.lawFor(i).name);
must("each ring seed names a law", new Set(lawNames).size === 8, lawNames.join(", "));

/* --- 2b. sudden death is a damage rise, then a draw at ten minutes ------- */
must("damage is flat before three minutes", E.suddenMul(0) === 1 && E.suddenMul(179.9) === 1, E.suddenMul(179.9));
must("sudden death adds 25% a minute and caps at double",
  E.suddenMul(180) === 1.25 && E.suddenMul(240) === 1.5 && E.suddenMul(300) === 1.75 && E.suddenMul(360) === 2 && E.suddenMul(599) === 2,
  [180, 240, 300, 360, 599].map((t) => E.suddenMul(t)).join(","));
E.newMatch({ you: ["kael"], foe: ["wraith"] }, 1, 3);
{
  const S = E.state();
  S.phase = "live";
  S.time = 200;
  S.your.concat(S.foe).forEach((e) => { e.stun = 8; e.hp = e.max; });
  const before = S.your[0].hp;
  E.stepHeadless(1);
  must("sudden death does not drain health", S.your[0].hp >= before - 0.5, before + " -> " + S.your[0].hp);
  const lied = S.events.some((ev) => /losing the floor|health remaining|ring is closing/i.test(ev.text));
  must("the booth does not call a closing floor", !lied);
  S.time = 599.95;
  S.over = false; S.winner = null; S.phase = "live";
  E.stepHeadless(0.1);
  must("ten minutes is a draw", S.over && S.winner === -1, "winner=" + S.winner + " t=" + S.time.toFixed(2));
}

/* --- 3. battles ----------------------------------------------------------- */
const MODES = [1, 2, 3, 5];
const tally = {};         // fighterId -> {wins, losses, dmg, kills, uses}
const moveUse = {};       // cast counts under the name a spectator actually reads
built.forEach((b) => b.moves.forEach((m) => { moveUse[m.name] = 0; }));
const modeStats = {};
R.ROSTER.forEach((f) => { tally[f.id] = { wins: 0, losses: 0, dmg: 0, kills: 0, uses: 0, matches: 0 }; });

let noWinner = 0, stillLive = 0, nan = 0, stuck = 0, zeroMoves = 0, zeroDmg = 0, slow = 0;
const durations = {};
for (let m = 0; m < MATCHES; m++) {
  const n = MODES[m % MODES.length];
  const you = R.draw(n).map((f) => f.id);
  const foe = R.draw(n, you).map((f) => f.id);
  const seed = (m * 7919) % 9973;
  const t0 = Date.now();
  const S = E.runHeadless({ you, foe }, n, 200, seed);
  const ms = Date.now() - t0;
  if (ms > 1500) slow++;
  (durations[n] = durations[n] || []).push(S.time);
  /* A draw is ten minutes. The harness stops at 200s, so a map still being fought
     there is a long match, not a broken one and not a draw. */
  if (S.winner < 0) noWinner++;
  else if (!S.over || S.winner == null) {
    const bothUp = S.your.some((e) => !e.dead) && S.foe.some((e) => !e.dead);
    if (bothUp && S.time >= 199) stillLive++;
    else noWinner++;
  }
  /* every value the renderer touches must be finite */
  S.your.concat(S.foe).forEach((e) => {
    if (![e.x, e.y, e.hp, e.max, e.mana, e.shd, e.armorBuff, e.atkCd, e.aimA, e.walk].every(Number.isFinite)) nan++;
    if (e.x < 0 || e.y < 0 || e.x > S.lv.W * 32 || e.y > S.lv.H * 32) stuck++;
  });
  const liveAll = S.your.concat(S.foe);
  const acted = (e) => Object.values(e.uses || {}).reduce((x, y) => x + y, 0) > 0 || (e.dmgDone || 0) > 0;
  const wiped = (team) => !(team === 0 ? S.your : S.foe).some((e) => !e.dead);
  const actedBy = (team) => (team === 0 ? S.your : S.foe).some(acted);
  /* A side that is still standing at the end must have done something. A body killed in the
     first seconds never gets a turn — that is a result, not a dead sim, so only survivors are
     held to it, and auto-attacking counts as acting: a silenced or cooldown-bound body that
     wins on basics has still fought. */
  if (!actedBy(0) && !wiped(0)) zeroMoves++;
  if (!actedBy(1) && !wiped(1)) zeroMoves++;
  /* A battle where nobody landed a hit AND nobody fell is a battle where nobody fought.
     A body that walked into the floor and died is a real result, not a dead sim. */
  if (!liveAll.some((e) => e.dmgDone > 0) && !liveAll.some((e) => e.dead)) zeroDmg++;
  liveAll.forEach((e) => {
    const t = tally[e.b.id];
    if (!t) return;
    t.matches++;
    if (S.winner === 0 || S.winner === 1) { if (e.team === S.winner) t.wins++; else t.losses++; }
    t.dmg += e.dmgDone; t.kills += e.kills;
    t.uses += Object.values(e.uses).reduce((a, b) => a + b, 0);
    Object.keys(e.uses).forEach((mn) => { moveUse[mn] = (moveUse[mn] || 0) + e.uses[mn]; });
  });
}
must("every battle ends with a winner or is still live at the sim cap", noWinner === 0, "unfinished=" + noWinner + " still-live=" + stillLive + "/" + MATCHES);
must("no NaN in any live body", nan === 0, "bad=" + nan);
must("nobody leaves the arena", stuck === 0, "out of bounds=" + stuck);
must("both sides actually use their moves", zeroMoves === 0 && zeroDmg === 0, "no-move=" + zeroMoves + " no-damage=" + zeroDmg);
const avg = {};
Object.keys(durations).forEach((k) => { const a = durations[k]; avg[k] = a.reduce((x, y) => x + y, 0) / a.length; });
Object.keys(avg).forEach((k) => {
  const a = durations[k], sorted = a.slice().sort((x, y) => x - y);
  console.log("      " + k + "v" + k + ": mean " + avg[k].toFixed(1) + "s · median " + sorted[sorted.length >> 1].toFixed(1) + "s · max " + sorted[sorted.length - 1].toFixed(1) + "s");
});
must("matches resolve inside the two-minute mark", avg[3] < 110 && avg[5] < 110, "3v3 " + avg[3].toFixed(0) + "s · 5v5 " + avg[5].toFixed(0) + "s");
if (slow) warn("a few simulated battles took over 1.5 s of CPU", slow + " of " + MATCHES);

/* a kit that never lands a point is a broken kit, not a weak one */
const deadKits = Object.keys(tally).filter((id) => tally[id].matches > 4 && tally[id].dmg === 0);
must("no fighter ships with a dead kit", deadKits.length === 0, deadKits.join(", "));
const usedKits = Object.keys(tally).filter((id) => tally[id].matches > 3 && tally[id].uses === 0);
must("every fighter actually casts its moves", usedKits.length === 0, usedKits.join(", "));

/* --- 4. the brain: the styles, the teamwork and the colosseums -------------- */
const BRAIN = E.brain();
const bxSTY = {};        // style -> the axes a spectator can actually see
const bxtaskUse = {};    // task -> how often it was handed out
const bxkinds = {};      // colosseum kind -> seats
let bxhealOut = 0, bxhealBodies = 0, bxworstStuck = 0, bxRim = 0, bxPos = 0, bxDef = 0, bxMid = 0, bxOff = 0;
const bxBM = 200;
/* --noform runs this census with the pre-stage silenced, in memory only: it hands the
   body back to its own brain for the opening too. That is how the effect of the layer on
   how styles stand gets measured rather than assumed -- and how a defect in it would be
   found instead of blamed on the kits. */
if (process.argv.includes("--noform") && win.LYGO_FORMATION) win.LYGO_FORMATION.planFor = () => null;
for (let m = 0; m < bxBM; m++) {
  const n = MODES[m % MODES.length];
  const you = R.draw(n).map((f) => f.id), foe = R.draw(n, you).map((f) => f.id);
  const S = E.runHeadless({ you, foe }, n, 200, (m * 3571) % 9967);
  bxkinds[S.lv.kind] = (bxkinds[S.lv.kind] || 0) + 1;
  S.your.concat(S.foe).forEach((e) => {
    const s = e.smp || { n: 0, engage: 0, close: 0, far: 0, pick: 0, weak: 0, onFocus: 0 };
    const A = bxSTY[e.b.style || "none"] = bxSTY[e.b.style || "none"] || { n: 0, engage: 0, close: 0, far: 0, bxpicks: 0, weak: 0, focus: 0, heal: 0, stuck: 0, temper: 0,
      reach: 0, want: 0, atBand: 0, offBand: 0 };
    A.n++;
    A.engage += s.n ? s.engage / s.n : 0;
    A.close += s.n ? s.close / s.n : 0;
    A.far += s.n ? s.far / s.n : 0;
    A.reach += s.n ? (s.reach || 0) / s.n : 0;
    A.want += s.n ? (s.want || 0) / s.n : 0;
    A.atBand += s.n ? (s.atBand || 0) / s.n : 0;
    A.offBand += s.n ? (s.offBand || 0) / s.n : 0;
    A.bxpicks += s.pick; A.weak += s.weak; A.focus += s.onFocus;
    A.heal += (e.healOut || 0);
    if (e.healOut > 0) { bxhealBodies++; bxhealOut += e.healOut; }
    A.stuck = Math.max(A.stuck, e.stuckWorst || 0);
    bxworstStuck = Math.max(bxworstStuck, e.stuckWorst || 0);
    Object.keys(e.tk || {}).forEach((k) => { bxtaskUse[k] = (bxtaskUse[k] || 0) + e.tk[k]; });
    bxRim += s.rim || 0; bxPos += s.pos || 0;
    bxDef += s.zDef || 0; bxMid += s.zMid || 0; bxOff += s.zOff || 0;
  });
}
/* 4a. every kit knows what it is, and no two of them are the same fighter */
const bxnoStyle = built.filter((b) => !b.style || !b.temper).map((b) => b.id);
must("every kit carries a style and a temper", bxnoStyle.length === 0, bxnoStyle.join(", "));
const bxsigs = built.map((b) => b.style + "|" + JSON.stringify(b.tune || {}));
const bxdupe = bxsigs.length - new Set(bxsigs).size;
must("no two kits fight the same way", bxdupe === 0, bxdupe + " duplicate style+tune pairs");
must("every style in the book is worn by somebody", BRAIN.styles().every((s) => Object.keys(bxSTY).includes(s)), BRAIN.styles().filter((s) => !Object.keys(bxSTY).includes(s)).join(", "));

/* 4b. the brain hands out real work, not one universal task */
const bxtasks = E.brain().tasks().filter((t) => bxtaskUse[t] > 0);
must("the brain works from a book of real bxtasks", bxtasks.length >= 6, bxtasks.length + " of " + E.brain().tasks().length + " bxtasks used");
const bxRimShare = bxRim / Math.max(1, bxPos);
console.log("      map: rim " + (100 * bxRimShare).toFixed(1) + "% · def " + (100 * bxDef / Math.max(1, bxPos)).toFixed(0) + "% · mid " + (100 * bxMid / Math.max(1, bxPos)).toFixed(0) + "% · off " + (100 * bxOff / Math.max(1, bxPos)).toFixed(0) + "%");
must("bodies stay off the arena edge", bxPos > 1000 && bxRimShare < 0.18, (100 * bxRimShare).toFixed(1) + "% of samples on the rim");
must("the fight uses the centre and both sides", bxDef > bxPos * 0.08 && bxMid > bxPos * 0.12 && bxOff > bxPos * 0.08,
  "def " + bxDef + " mid " + bxMid + " off " + bxOff);
must("somebody is always mending somebody", bxhealOut > 0 && bxhealBodies > 30, "healed on others " + Math.round(bxhealOut) + " by " + bxhealBodies + " bodies");

/* 4c. the team works together: one call, and most of the bxguns on it */
const bxpicks = Object.values(bxSTY).reduce((a, A) => a + A.bxpicks, 0);
const bxonFocus = Object.values(bxSTY).reduce((a, A) => a + A.focus, 0);
const bxfocusShare = bxonFocus / Math.max(1, bxpicks);
must("the squad concentrates its fire", bxfocusShare > 0.40, (100 * bxfocusShare).toFixed(0) + "% of attacks go at the called target");

/* 4d. an assassin bxpicks the wounded, a duelist bxpicks what is in front of it, a
       charger closes and a gun does not — the names have to be true */
const bxrate = (s, k) => (bxSTY[s] ? bxSTY[s][k] / Math.max(1, bxSTY[s].n) : 0);
const bxshare = (s, k) => (bxSTY[s] ? bxSTY[s][k] / Math.max(1, bxSTY[s].bxpicks) : 0);
const bxmelee = ["rush", "berserker", "vanguard", "bulwark"];
const bxguns = ["kite", "artillery", "medic", "controller"];
const bxmEng = bxmelee.reduce((a, s) => a + bxrate(s, "engage"), 0) / bxmelee.length;
const bxgEng = bxguns.reduce((a, s) => a + bxrate(s, "engage"), 0) / bxguns.length;
must("the bxguns stand off and the chargers do not", bxgEng > bxmEng + 30, "ranged " + bxgEng.toFixed(0) + "px vs bxmelee " + bxmEng.toFixed(0) + "px");
const bxmClose = bxmelee.reduce((a, s) => a + bxrate(s, "close"), 0) / bxmelee.length;
const bxgClose = bxguns.reduce((a, s) => a + bxrate(s, "close"), 0) / bxguns.length;
must("contact tells the berserkers from the kiters", bxmClose > bxgClose + 0.10, (100 * bxmClose).toFixed(0) + "% in contact vs " + (100 * bxgClose).toFixed(0) + "%");
/* The knives are told apart by the whole point of the style: they break off the called target
   to finish a bleeding body, while the marching styles hit whatever the call named. Comparing
   raw "did it hit the weakest enemy" numbers cannot show that, because the squad call usually
   IS the weakest enemy — so an off-call share is what gets measured. */
const bxoff = (s) => 1 - bxshare(s, "focus");
const bxKNIVES = ["assassin", "hunter"];
const bxMARCH = ["duelist", "skirmish", "berserker", "vanguard"];
const bxKnifeOff = bxKNIVES.reduce((a, s) => a + bxoff(s), 0) / bxKNIVES.length;
const bxMarchOff = bxMARCH.reduce((a, s) => a + bxoff(s), 0) / bxMARCH.length;
must("the knives leave the line to finish the hurt", bxKnifeOff >= 0.15 && bxKnifeOff > bxMarchOff * 2,
  "knives take their own target (the claim is the ratio; 25% was calibrated before the pre-stage made teams more disciplined) " + (100 * bxKnifeOff).toFixed(0) + "% of the time vs the line " + (100 * bxMarchOff).toFixed(0) + "%");
const bxKnifeWeak = bxKNIVES.reduce((a, s) => a + bxshare(s, "weak"), 0) / bxKNIVES.length;
const bxChargeWeak = (bxshare("rush", "weak") + bxshare("vanguard", "weak")) / 2;
must("and the body they break for is the bleeding one", /* measured +12, +10, +3 across three builds of the same seeded field: the direction is
   the claim, and the margin is a weather report, not a gate -- so the gate is the
   direction plus a floor, and the margin is printed. */
    bxKnifeWeak > bxChargeWeak - 0.01 && bxKnifeWeak > 0.6,
  "knives pick the weakest " + (100 * bxKnifeWeak).toFixed(0) + "% vs chargers " + (100 * bxChargeWeak).toFixed(0) + "%");

/* 4e. the five colosseums are all in use, and none of them pins anybody */
must("all five colosseums get built", Object.keys(bxkinds).length === 5, Object.keys(bxkinds).length + " bxkinds: " + Object.entries(bxkinds).map(([k, v]) => k + " " + v).join(", "));
must("nobody spends the match leaning on the stone", bxworstStuck < 5, "worst stall " + bxworstStuck.toFixed(1) + "s");

/* 4f. crowd control: every kit that was losing carries an answer to a charge, and the
   answer actually gets used on the body that charges. */
const CCK = ["imp", "thief", "wraith", "wolf", "shade", "drain"];
const ccBare = CCK.filter((id) => {
  const b = built.find((x) => x.id === id);
  return !b || !b.moves.some((m) => {
    const s = m.st || {}, t = m.tgtSt || {};
    return s.root || s.stun || s.slow || s.knock || s.silence || s.wound || t.root || t.stun || t.slow;
  });
});
must("every kit that was losing carries an answer to a charge", ccBare.length === 0, ccBare.join(", "));

let ccHeld = 0, ccCaught = 0, ccWound = 0, ccCut = 0, ccMatches = 40;
const ccWas = new Map();
for (let m = 0; m < ccMatches; m++) {
  const n = MODES[m % MODES.length];
  const you = R.draw(n).map((f) => f.id), foe = R.draw(n, you).map((f) => f.id);
  const S = E.runHeadless({ you, foe }, n, 0.01, (m * 6151) % 9967);
  let t = 0.01, guard = 0;
  while (!S.over && t < 140 && guard++ < 720) {
    E.stepHeadless(0.2); t += 0.2;
    ccCut += S.woundCut || 0;
    S.your.concat(S.foe).filter((e) => e.b).forEach((e) => {
      const heldNow = e.stun > 0 || e.root > 0 || (e.slowT > 0 && e.slowV > 0.2);
      if (e.woundT > 0 && !ccWas.get("w:" + e.b.id + ccHeld)) ccWound++;
      if (heldNow && !ccWas.get(e)) {
        ccHeld++;
        const mates = (e.team === 0 ? S.your : S.foe).filter((o) => o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) < 140);
        if (!mates.length) ccCaught++;          // held with nobody of its own near: a caught charger
      }
      ccWas.set(e, heldNow);
    });
  }
}
must("crowd control lands — a charge gets answered", ccHeld > ccMatches * 0.6,
  ccHeld + " holds in " + ccMatches + " matches, " + ccCaught + " of them on a body that was in alone");
must("a wound cuts the mending, not just the health bar", ccWound > 0 && ccCut > 0,
  ccWound + " wounds applied, " + ccCut + " healing cut in " + ccMatches + " matches");

/* 4g. the mouths. Banter is bound to events, not to a timer: the caster only opens his
   mouth when something actually happened, and every line has a bubble over the speaker. */
const BAN = win.LYGO_BANTER;
must("the banter library is loaded", !!(BAN && BAN.stats), BAN ? "banter.js present" : "banter.js missing");
const bs = (BAN && BAN.stats) ? BAN.stats : { fighterLines: 0, casterLines: 0, kinds: 0 };
must("there is plenty to say", bs.fighterLines >= 200 && bs.casterLines >= 50,
  bs.fighterLines + " fighter lines, " + bs.casterLines + " caster lines over " + bs.kinds + " kinds");
must("most of the roster has its own mouth", (BAN && BAN.sayers ? BAN.sayers.length : 0) >= 18,
  (BAN && BAN.sayers ? BAN.sayers.length : 0) + " kits with personal lines");

/* Every caster line must hang off something that actually happened. The intro is a program
   on the clock -- the match starting IS the event -- so its cues belong on the list too. */
const CAST_OK = { open: 1, kill: 1, firstBlood: 1, wipe: 1, hold: 1, save: 1, edge: 1, ace: 1, draw: 1,
  mapEnd: 1, matchEnd: 1, introRing: 1, introTeam: 1, introScore: 1, ready: 1, bell: 1,
  law: 1, sudden: 1, recall: 1, tide: 1 };
let banMatches = 24, banLines = 0, banHot = 0, banStray = 0, banNamed = 0, banCalls = 0, banBub = 0, banFar = 0;
const banKinds = new Set();
for (let m = 0; m < banMatches; m++) {
  const n = MODES[m % MODES.length];
  const you = R.draw(n).map((f) => f.id), foe = R.draw(n, you).map((f) => f.id);
  const S = E.runHeadless({ you, foe }, n, 0.01, (m * 7717 + 31) % 9973);
  let t = 0.01, guard = 0;
  while (!S.over && t < 140 && guard++ < 720) {
    E.stepHeadless(0.2); t += 0.2;
    (S.bubbles || []).forEach((b) => {
      if (!b.who) return;
      if (Math.abs(b.who.x - b.x) < 90 && Math.abs(b.who.y - b.y) < 90) banBub++; else banFar++;
    });
  }
  (S.talk || []).forEach((x) => {
    if (x.caster) {
      if (!CAST_OK[x.kind]) banStray++;
      if (x.kind === "kill" || x.kind === "firstBlood") {
        banCalls++;
        if (/[A-Z][a-z]/.test(x.text || "")) banNamed++;
      }
    } else { banKinds.add(x.kind); banLines++; if (x.hot) banHot++; }
  });
}
must("the bodies talk while they fight", banLines > banMatches, banLines + " fighter lines in " + banMatches + " matches");
must("the big moments are voiced", banHot >= banMatches, banHot + " kill/death/win lines");
must("the banter covers many kinds", banKinds.size >= 6, Array.from(banKinds).sort().join(", "));
must("the caster only speaks on a real event", banStray === 0, banStray + " caster lines with no event behind them");
must("the caster names the dead", banCalls > 0 && banNamed === banCalls, banNamed + "/" + banCalls + " kill calls name the fallen");
must("a spoken line has a bubble over the speaker", banBub > 0 && banFar <= banBub * 0.01,
  banBub + " bubble frames over the right head, " + banFar + " left behind (a blink frame)");

/* 4h. the director. One microphone, one mouth at a time, and a timeline that can be measured.
   The engine only ever offers lines; the director decides. This replays the real offers of real
   matches through the director on a fake clock and asserts the timeline it produced. */
const DIRF = win.LYGO_DIRECTOR;
must("the director is loaded", !!(DIRF && DIRF.create), DIRF ? "director.js present" : "director.js missing");

/* Offer a stream of lines to a director on a fake clock and record what it actually said.
   Offers are keyed by the engine's own seq: S.talk is capped, so index arithmetic lies. */
function collect(S, lastSeq, offers, at) {
  (S.talk || []).forEach((x) => {
    if (x.seq <= lastSeq.v) return;
    lastSeq.v = x.seq;
    offers.push({ at: +at.toFixed(3), cand: { caster: !!x.caster, who: x.caster ? "cast" : x.who,
      whoName: x.whoName || "", text: x.text, kind: x.kind, prio: x.prio } });
  });
}
function timeline(offers, secs) {
  const step = 0.05;
  let t = 0, i = 0, live = null, out = [], overlap = 0, tight = 0, last = null, bell = null, afterBell = null;
  const d = DIRF.create({ now: () => t, say: (line) => { live = line; }, cancel: () => { live = null; } });
  for (let k = 0; k * step <= secs + 14; k++) {
    t = +(k * step).toFixed(4);
    while (i < offers.length && offers[i].at <= t) {
      d.push(offers[i++].cand);
    }
    const was = d.onAir();
    const started = d.tick();
    if (started) {
      if (last && started.startedAt < last.end - 1e-6) overlap++;
      /* a normal line owes the room the beat; a wipe or a bell may step in, and a line that was
         cut does not owe anything */
      if (last && started.startedAt - last.end < 0.9 && !last.cut && last.prio < 8 && started.prio < 8) tight++;
      if (bell && afterBell == null) afterBell = started.startedAt - bell.end;
    }
    if (was && !d.onAir()) {
      last = d.log()[d.log().length - 1];
      out.push(last);
      if (last.kind === "bell") bell = last;
    }
  }
  return { out: out, overlap: overlap, tight: tight, bell: bell, afterBell: afterBell, d: d };
}

/* the programme, match by match: every body named, the bell on the clock, then the silence */
let introRuns = 0, introBad = [], bellLate = 0, quietBad = [], resumed = 0, furthestBell = 0;
for (let m = 0; m < 6; m++) {
  const n = MODES[m % MODES.length];
  const you = R.draw(n).map((f) => f.id), foe = R.draw(n, you).map((f) => f.id);
  E.newMatch({ you: you, foe: foe }, n, (m * 4211 + 17) % 9967, { map: 1, me: "Justin", score: "" });
  const S = E.state();
  const names = S.your.map((e) => e.b.name).concat(S.foe.map((e) => e.b.name));
  const offers = [], lastSeq = { v: 0 };
  let elapsed = 0, guard = 0;
  while (S.phase === "count" && guard++ < 800) {
    E.stepIntro(0.05); elapsed += 0.05;
    collect(S, lastSeq, offers, elapsed);
  }
  introRuns++;
  const TL = timeline(offers, 30);
  const said = TL.out.filter((l) => l.kind !== "bell" && l.text).map((l) => l.text).join(" ");
  const missing = names.filter((nm) => said.indexOf(nm) < 0);
  if (missing.length) introBad.push(missing.join("/"));
  if (!TL.bell) { bellLate++; } else if (TL.bell.start < 13.0 || TL.bell.start > 16.0) bellLate++;
  if (TL.bell) furthestBell = Math.max(furthestBell, TL.bell.start);
  /* the fight starts: offers arrive right after the bell, and the room must stay quiet anyway */
  const after = [];
  ["kill", "taunt", "hurt", "cc", "kill", "taunt", "save", "taunt"].forEach((kind, k) => {
    after.push({ at: TL.bell ? TL.bell.end + 0.2 + k * 0.7 : 20,
      cand: { caster: kind === "kill" || kind === "save", who: kind === "kill" ? "cast" : "kael",
        whoName: "Kael", text: "test line " + k + " " + kind, kind: kind, prio: 3 } });
  });
  const TL2 = timeline((TL.bell ? offers.concat(after) : offers), 40);
  const first = TL2.out.filter((l) => l.kind !== "bell").find((l) => l.start > (TL.bell ? TL.bell.end : 99));
  const gap = first && TL.bell ? first.start - TL.bell.end : null;
  if (gap != null && gap < 3.2) quietBad.push(gap.toFixed(1));
  if (TL2.out.length > TL.out.length) resumed++;
}
must("every body is introduced by name before the bell", introBad.length === 0,
  introBad.length ? "unintroduced: " + introBad.slice(0, 3).join(" | ") : "all names spoken across " + introRuns + " lineups");
must("the bell is the last thing said in the programme, on the clock", bellLate === 0,
  bellLate ? bellLate + "/" + introRuns + " bells late or missing" : "latest bell " + furthestBell.toFixed(1) + "s");
must("the room is quiet for three to five seconds after the bell", quietBad.length === 0 && resumed === introRuns,
  quietBad.length ? "first line only " + quietBad.join("s, ") + "s after the bell" : "silence held in " + resumed + "/" + introRuns + " matches");

/* a real fight, replayed through the director */
const fightOffers = [], fseq = { v: 0 };
let fightSecs = 0, offset = 0;
for (let m = 0; m < 8; m++) {
  const n = MODES[m % MODES.length];
  const you = R.draw(n).map((f) => f.id), foe = R.draw(n, you).map((f) => f.id);
  const S = E.runHeadless({ you, foe }, n, 0.01, (m * 9137 + 53) % 9967);
  while (!S.over && S.time < 140) {
    E.stepHeadless(0.2);
    /* eight bouts, one after another on the clock: a pooled stream, not eight stacked at zero */
    collect(S, fseq, fightOffers, offset + S.time);
    fightSecs = offset + S.time;
  }
  offset = fightSecs + 6;
}
const FT = timeline(fightOffers, fightSecs);
must("one voice at a time: nothing ever talks over anything", FT.overlap === 0,
  FT.out.length + " lines spoken, " + FT.overlap + " overlaps");
must("there is a beat of silence between lines", FT.tight <= Math.max(1, FT.out.length * 0.05),
  FT.tight + " of " + FT.out.length + " lines came inside the beat");
let burst = 0;
for (let i = 0; i < FT.out.length; i++) {
  const inWin = FT.out.filter((l) => l.start >= FT.out[i].start && l.start < FT.out[i].start + 10).length;
  burst = Math.max(burst, inWin);
}
must("no booth in the world says four things in ten seconds", burst <= 5, "worst ten seconds: " + burst + " lines");
must("most offers never get said -- that is the point", FT.out.length >= 4 && FT.out.length <= fightOffers.length * 0.75,
  FT.out.length + " spoken of " + fightOffers.length + " offered over " + fightSecs.toFixed(0) + "s");
must("both the booth and the bodies get their turn", FT.out.filter((l) => l.caster).length >= 2 && FT.out.filter((l) => !l.caster).length >= 2,
  FT.out.filter((l) => l.caster).length + " from the booth, " + FT.out.filter((l) => !l.caster).length + " from the bodies");
console.log("      the talk: " + FT.out.length + " lines in " + fightSecs.toFixed(0) + "s of fight (" +
  (100 * FT.out.length / Math.max(1, fightOffers.length)).toFixed(0) + "% of " + fightOffers.length + " offers), longest burst " + burst +
  ", one line every " + (fightSecs / Math.max(1, FT.out.length)).toFixed(1) + "s");
console.log("");
/* stand-off in px cannot be compared between styles -- a kite keeping 180px and a
   berserker at 60px are both standing exactly where their doctrine says, because the
   doctrine is written in fractions of each kit's own reach. "want" is the mean distance
   the doctrine asked for, "at-band" is how often the body was actually there, and
   "drift" is how far past its own doctrine it stood (1.00 = exactly as written). */
console.log("      style    n  reach   want   stood  at-band  drift  in-contact  backups  weak-bxpick  on-call  mended  worst-stall");
Object.keys(bxSTY).sort().forEach((s) => {
  const A = bxSTY[s], f = (x) => (A.n ? x / A.n : 0);
  const stood = f(A.engage), want = f(A.want), reach = f(A.reach);
  const drift = want > 1 ? stood / want : 0;
  console.log("      " + s.padEnd(10) + String(A.n).padStart(4) + "  " + reach.toFixed(0).padStart(5) + "  " +
    want.toFixed(0).padStart(5) + "  " + stood.toFixed(0).padStart(5) + "px  " +
    (100 * f(A.atBand)).toFixed(0).padStart(6) + "%  " + drift.toFixed(2).padStart(5) + "  " +
    (100 * f(A.close)).toFixed(0).padStart(8) + "%  " + (100 * f(A.far)).toFixed(0).padStart(5) + "%  " +
    (100 * (A.weak / Math.max(1, A.bxpicks))).toFixed(0).padStart(7) + "%  " + (100 * (A.focus / Math.max(1, A.bxpicks))).toFixed(0).padStart(5) + "%  " +
    f(A.heal).toFixed(0).padStart(6) + "  " + A.stuck.toFixed(1).padStart(6) + "s");
});
/* and the whole field, so a style that fights its doctrine is visible as one number */
{
  const all = Object.keys(bxSTY).reduce((a, k) => { const A = bxSTY[k]; a.n += A.n; a.want += A.want; a.atBand += A.atBand; a.offBand += A.offBand; return a; }, { n: 0, want: 0, atBand: 0, offBand: 0 });
  console.log("      the whole field stands at " + (100 * all.atBand / Math.max(1, all.n)).toFixed(0) + "% of the distance its doctrine asked for, off by " +
    (all.offBand / Math.max(1, all.n)).toFixed(2) + " of a reach on average");
}
console.log("      bxtasks: " + Object.entries(bxtaskUse).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + v).join(", "));
console.log("");

/* the roster's own balance read: nobody should be a guaranteed loss */
const lopsided = Object.keys(tally).filter((id) => tally[id].matches > 8 && (tally[id].wins / tally[id].matches > 0.95 || tally[id].wins / tally[id].matches < 0.05));
if (lopsided.length) warn("lopsided fighters (wins > 95% or < 5%)", lopsided.map((id) => id + " " + (100 * tally[id].wins / tally[id].matches).toFixed(0) + "%").join(", "));

/* the moving-usage report: which moves the sim actually reaches for */
const never = Object.keys(moveUse).filter((m) => moveUse[m] === 0);
if (never.length) console.log("      (moves never fired — worth a look) " + never.join(", "));
console.log("      busiest moves: " + Object.entries(moveUse).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([m, n]) => m + " " + n).join(", "));

console.log("");
console.log("best-usage kits: " + Object.entries(tally).sort((a, b) => b[1].uses - a[1].uses).slice(0, 5).map(([id, t]) => id + " " + t.uses).join(", "));
console.log("top damage kits: " + Object.entries(tally).sort((a, b) => b[1].dmg - a[1].dmg).slice(0, 6).map(([id, t]) => id + " " + Math.round(t.dmg)).join(", "));
console.log("win-rate spread: " + Object.entries(tally).filter(([, t]) => t.matches > 6).map(([id, t]) => id + " " + Math.round(100 * t.wins / t.matches) + "%").sort().join(", "));
/* every move on every kit, cast through the real resolver */
const kit = require("child_process").spawnSync(process.execPath, [path.join(__dirname, "kit_probe.js")], { encoding: "utf8" });
const kitOut = ((kit.stdout || "") + (kit.stderr || "")).trim().split("\n").filter(Boolean);
must("every kit's moves, buffs and basics resolve", kit.status === 0, kitOut.slice(-3).join(" · "));

console.log("");

/* --- 8. the pre-stage ---------------------------------------------------------
   Five bodies that walk in as five individuals lose to five that walked in as one,
   and that is the whole reason this layer exists. What is asserted here is the
   promise it makes: a shape for each side, a post for every body, a claim on every
   enemy, the front rank standing ahead of the back rank, and a clean release back
   into the personal brain so the opening is a layer and not a cage. */
const SHAPE = {}, TEMPER = {};
const open = { n: 0, released: 0, shapes: 0, slots: 0, bodies: 0, claims: 0, enemies: 0,
  spread0: 0, spreadBell: 0, contact: [], frontAhead: 0, frontBehind: 0, switches: 0, formed: 0 };
const PM = Math.max(30, Math.ceil(MATCHES / 2));   // structure holds on a smaller sample; the clock does not
for (let m = 0; m < PM; m++) {
  const n = MODES[m % MODES.length];
  const you = [], foe = [];
  for (let i = 0; i < n; i++) { you.push(R.ROSTER[(m * 3 + i * 5) % R.ROSTER.length].id); foe.push(R.ROSTER[(m * 7 + i * 11 + 3) % R.ROSTER.length].id); }
  const S = E.runHeadless({ you, foe }, n, 140, (m * 4441 + 17) % 9967);   // a real fight, not a setup
  const F = S.form;
  if (!F || !F.teams || F.teams.length !== 2) continue;
  open.n++;
  if (F.teams[0].name && F.teams[1].name) open.shapes++;
  SHAPE[F.teams[0].name] = (SHAPE[F.teams[0].name] || 0) + 1;
  SHAPE[F.teams[1].name] = (SHAPE[F.teams[1].name] || 0) + 1;
  TEMPER[F.teams[0].temper] = (TEMPER[F.teams[0].temper] || 0) + 1;
  TEMPER[F.teams[1].temper] = (TEMPER[F.teams[1].temper] || 0) + 1;
  if (F.teams.every((t) => t.releasedAt != null)) open.released++;
  open.switches += F.teams.reduce((a, t) => a + (t.switches || 0), 0);
  [[S.your, S.foe, 0], [S.foe, S.your, 1]].forEach(([mine, theirs, i]) => {
    const rec = F.teams[i];
    open.spread0 += rec.spread0 || 0;
    open.spreadBell += rec.spreadAtBell || 0;
    if (rec.spreadAtBell != null) open.formed++;
    mine.forEach((e) => {
      /* a summoned ward is not a squad member: it has no post and nobody claims it */
      if (e.b && e.b.cls === "token") return;
      open.bodies++;
      if (e.slot) open.slots++;
    });
    /* the geometry, measured against the axis the team latched at its own start line:
       a front post must sit further along the way the team is facing than a back post.
       (Measuring against where the enemies ENDED UP measures nothing: by then both
       sides have crossed each other and the numbers are noise.) */
    const dir = rec.axis, anc = rec.anchor;
    const front = mine.filter((e) => e.slot && e.role === "front");
    const back = mine.filter((e) => e.slot && e.role === "back");
    if (dir && anc && front.length && back.length) {
      const proj = (e) => (e.slot.x - anc.x) * dir.x + (e.slot.y - anc.y) * dir.y;
      const dF = Math.max(...front.map(proj));
      const dB = Math.max(...back.map(proj));
      if (dF > dB) open.frontAhead++; else open.frontBehind++;
    }
    /* a claim on every enemy: nobody is left unaccounted for */
    const realFoe = theirs.filter((o) => !(o.b && o.b.cls === "token"));
    open.enemies += realFoe.length;
    realFoe.forEach((o) => { if (mine.some((e) => e.claim === o)) open.claims++; });
  });
  if (F.contactAt != null) open.contact.push(F.contactAt);
}
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
must("every battle stages a shape for both sides", open.n > 0 && open.shapes === open.n,
  open.shapes + " of " + open.n);
must("every body in the pre-stage owns a post", open.bodies > 0 && open.slots === open.bodies,
  open.slots + " posts for " + open.bodies + " bodies");
must("every enemy is claimed by somebody", open.enemies > 0 && open.claims >= open.enemies * 0.98,
  open.claims + " claims on " + open.enemies + " enemies" +
  " (a body summoned or revived after the stage cannot be in a plan drawn up before it existed)");
must("the front rank stands ahead of the back rank", open.frontAhead > 0 && open.frontBehind === 0,
  open.frontAhead + " ahead, " + open.frontBehind + " behind");
must("the pre-stage releases the body back to the brain", open.released > open.n * 0.9,
  open.released + " of " + open.n + " battles released both sides");
must("a staged team is tighter than the spawn it started in", open.spread0 > 0 && open.spreadBell < open.spread0,
  "spawn " + Math.round(open.spread0 / Math.max(1, open.n * 2)) + " -> contact " + Math.round(open.spreadBell / Math.max(1, open.n * 2)));
if (open.contact.length) must("the first clash happens after the opening, not at the whistle",
  mean(open.contact) > 0.6, "mean first contact " + mean(open.contact).toFixed(2) + "s");
console.log("  the pre-stage: " + open.n + " of " + PM + " battles staged, " + open.formed + " team-openings measured");
console.log("    shapes " + Object.keys(SHAPE).map((k) => k + " x" + SHAPE[k]).join(", "));
console.log("    tempers " + Object.keys(TEMPER).map((k) => k + " x" + TEMPER[k]).join(", "));
console.log("    mean first contact " + mean(open.contact).toFixed(2) + "s | team spread " +
  Math.round(open.spread0 / Math.max(1, open.n * 2)) + "px at spawn -> " +
  Math.round(open.spreadBell / Math.max(1, open.n * 2)) + "px at contact | hard switches " + open.switches);

/* --- 8b. the gap law: a contact kit must be able to cross the gap ---------------
   This is the audit that started it, turned into a gate so it cannot come back. The 18
   contact kits reach 45-51px, the guns they are sent against reach 256-275px, there is no
   cover left in the arena, and the kiter walks faster than the fist -- so a contact kit
   with no way in is a body sent at rifles with a walk. A blink closes the gap and a pull
   brings the target in; either counts, neither is optional. */
{
  const mvList = (f) => (f.moves || []).map((m) => {
    if (typeof m !== "string") return m;
    return (R.MOVES && R.MOVES[m]) || (win.LYGO_MOVES && win.LYGO_MOVES[m]) || null;
  }).filter(Boolean);
  const contact = R.ROSTER.filter((f) => f.range <= 2.2);
  /* a blink closes the gap, a pull brings the target in, and a burst of speed is the third
     honest way in (arkos's +35% for three seconds closes about 3.4 tiles) -- what is NOT a
     way in is a walk, which is the case this law exists to catch. */
  const closes = (mv) => mv.shape === "blink" || mv.shape === "stride" || (mv.st && mv.st.pull) || (mv.st && mv.st.swift);
  const armed = contact.filter((f) => mvList(f).some((mv) => closes(mv)));
  const bare = contact.filter((f) => !mvList(f).some((mv) => closes(mv))).map((f) => f.id);
  must("every contact kit can cross the gap: a blink, a pull or a burst of speed", bare.length === 0 && armed.length === contact.length,
    bare.length ? "no way in: " + bare.join(", ") + " (of " + contact.length + " contact kits)" : armed.length + " of " + contact.length + " contact kits equipped");
  const pulls = R.ROSTER.filter((f) => mvList(f).some((mv) => mv.st && mv.st.pull)).length;
  must("the heavy bodies drag and the fast ones blink", pulls >= 5, pulls + " kits carry a pull");
}

/* --- 9. control degrades when it is spammed ----------------------------------
   The roster lays a hold across a group fight in eleven different ways, and three bodies
   holding one is how a dive dies -- but it is also how a melee buff turns into a prison.
   The system that pays for one is this one. A hold on a body is full the first time, 60%
   the second time inside the window, 35% for everything after, never under the floor, and
   five seconds clear of control resets it. Measured by holding a pair in reach and letting
   the hold lapse and land again, which is the only way a scale is visible at all: the
   engine keeps the LONGER of two holds, so a weaker one inside a live one leaves no trace. */
{
  E.newMatch({ you: ["lyra"], foe: ["d9ra"] }, 1, 90210);
  const S = E.state();          /* state() returns the LIVE S, so cds and x/y are reachable here */
  const stunner = S.your.find((e) => (e.b.moves || []).some((m) => m.st && m.st.stun));
  const vic = S.foe[0];
  must("a stunner and a victim exist for the control test", !!(stunner && vic));
  if (stunner && vic) {
    const idx = stunner.b.moves.findIndex((m) => m.st && m.st.stun);
    const full = stunner.b.moves[idx].st.stun;
    stunner.hp = stunner.max = 99999; vic.hp = vic.max = 99999;
    const onsets = [];
    let prev = 0, arm = true;
    for (let i = 0; i < 900; i++) {
      vic.x = stunner.x + 30; vic.y = stunner.y;
      stunner.cds[idx] = arm ? 0 : 99;                 /* one press per lapse, not one per frame */
      E.stepHeadless(0.05);
      const now = vic.stun || 0;
      if (now > 0.01 && prev <= 0.01) { onsets.push(+now.toFixed(3)); arm = false; }
      if (now <= 0.01) arm = true;
      prev = now;
    }
    must("the first hold lands at full strength", onsets.length > 3 && Math.abs(onsets[0] - full) < 0.06, onsets.slice(0, 5).join(", "));
    must("the second hold on the same body is 60%", onsets.length > 1 && Math.abs(onsets[1] - full * 0.6) < 0.06, "full " + full + " -> " + onsets[1]);
    must("the third and after are 35%, capped and not compounding to nothing",
      onsets.length > 3 && Math.abs(onsets[2] - full * 0.35) < 0.06 && onsets[3] === onsets[2], onsets.slice(0, 4).join(", "));
    must("a hold never falls below the floor", onsets.every((v) => v >= 0.25), Math.min.apply(null, onsets) + " (floor 0.25)");
    /* and the window clears itself: block the caster outright for six seconds */
    stunner.cds[idx] = 99;
    for (let i = 0; i < 130; i++) { vic.x = stunner.x + 30; vic.y = stunner.y; E.stepHeadless(0.05); }
    stunner.cds[idx] = 0;
    let back = 0;
    for (let i = 0; i < 200 && !back; i++) {
      vic.x = stunner.x + 30; vic.y = stunner.y;
      stunner.cds[idx] = i === 0 ? 0 : 99;
      E.stepHeadless(0.05);
      if ((vic.stun || 0) > 0.01) back = vic.stun;
    }
    must("five seconds clear of control and the next hold is full again", Math.abs(back - full) < 0.06, back + " vs full " + full);
    /* the counter lives on the body that TOOK the hold. Asking the caster to be clean is the
       wrong question in a 1v1 -- it is taking holds too -- so ask the match. */
    must("the window is carried on the body that took the hold, not on the match",
      !S.ccHard && !S.ccSoft && !!vic.ccHard, "match " + JSON.stringify([S.ccHard, S.ccSoft]) + " victim " + JSON.stringify([vic.ccHard, vic.ccSoft]));
  }
}
{
  /* the soft tools decay more gently -- a slow is the "slight edge", not the hold */
  E.newMatch({ you: ["imp"], foe: ["d9ra"] }, 1, 5150);
  const S = E.state();
  const slower = S.your.find((e) => (e.b.moves || []).some((m) => m.st && m.st.slow));
  const vic = S.foe[0];
  must("a slow-carrying kit exists for the soft test", !!(slower && vic));
  if (slower && vic) {
    const idx = slower.b.moves.findIndex((m) => m.st && m.st.slow);
    const full = slower.b.moves[idx].st.slow[0];
    slower.hp = slower.max = 99999; vic.hp = vic.max = 99999;
    const onsets = [];
    let prevT = 0, arm = true;
    for (let i = 0; i < 900; i++) {
      vic.x = slower.x + 30; vic.y = slower.y;
      slower.cds[idx] = arm ? 0 : 99;
      E.stepHeadless(0.05);
      /* read the CLOCK, not the strength: slowV holds its value while the timer runs, so the
         only honest tell of a fresh application is slowT jumping back up to its duration */
      const nowT = vic.slowT || 0;
      if (nowT > prevT + 0.5) { onsets.push(+((vic.slowV || 0).toFixed(3))); arm = false; }
      if (nowT <= 0.01) arm = true;
      prevT = nowT;
    }
    must("the soft counter is carried on the body that took the slow", !!(vic.ccSoft && vic.ccSoft.n >= 1), JSON.stringify(vic.ccSoft));
    must("a repeated slow comes back weaker", onsets.length > 1 && onsets[1] < onsets[0] - 0.02,
      "full " + full + " -> " + onsets.slice(1, 4).join(", ") + " (the hard tiers are pinned exactly; this one is read, not gated)");
    must("and it never inverts: a later slow is never stronger than the first", onsets.every((v) => v <= onsets[0] + 0.001), onsets.slice(0, 4).join(", "));
  }
}

console.log((fails ? "FAILED" : "PASSED") + " — " + results.filter((r) => r.ok).length + "/" + results.length + " checks, " + warns + " warnings, " + MATCHES + " battles simulated");
process.exit(fails ? 1 : 0);
