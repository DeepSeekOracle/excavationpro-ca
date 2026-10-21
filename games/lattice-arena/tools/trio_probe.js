/* LYGO Arena — 3v3 balance probe.
   Who wins, who never dies, and whether a boss can stand in front of three bodies
   and take nothing. Headless. Does not draw.

   node tools/trio_probe.js
*/
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
function stubEl() {
  return { style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} },
    getContext: () => ({ imageSmoothingEnabled: false, fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1,
      font: "", textAlign: "", globalCompositeOperation: "", fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {},
      arc() {}, ellipse() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, save() {}, restore() {}, translate() {},
      scale() {}, setTransform() {}, setLineDash() {}, drawImage() {}, clearRect() {} }),
    toDataURL: () => "data:image/png;base64,", appendChild() {}, addEventListener() {}, removeEventListener() {},
    getBoundingClientRect: () => ({ width: 900, height: 600, left: 0, top: 0 }), querySelector: () => null,
    querySelectorAll: () => [], setAttribute() {}, focus() {} };
}
const document = { createElement: () => stubEl(), getElementById: () => stubEl(), querySelector: () => null,
  querySelectorAll: () => [], addEventListener() {}, body: stubEl(), documentElement: stubEl() };
const win = { devicePixelRatio: 1, document, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  Image: function () { this.onload = null; this.onerror = null; },
  fetch: () => Promise.resolve({ json: () => Promise.resolve({ names: {} }) }), setTimeout, clearTimeout, console };
win.window = win;
const ctx = vm.createContext(win);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
load("roster.js"); load("attacks.js"); load("brain.js"); load("arena.js");
const R = win.LYGO_ARENA, E = win.ArenaEngine;
const IDS = R.ROSTER.map((f) => f.id);

function sheet(id) {
  const f = R.ROSTER.find((x) => x.id === id);
  const b = R.buildTeam([f])[0];
  return b;
}

console.log("sheet        hp   dmg  rate armor  dps  power  shield%");
IDS.forEach((id) => {
  const b = sheet(id);
  console.log(id.padEnd(12) + String(b.max).padStart(5) + String(Math.round(b.dmg)).padStart(5) +
    b.rate.toFixed(2).padStart(6) + String(b.armor).padStart(6) +
    b.dps.toFixed(0).padStart(6) + String(b.power).padStart(7) +
    ((b.mods.startShield || 0) * 100).toFixed(0).padStart(8));
});

function fight(you, foe, seed) {
  const S = E.runHeadless({ you, foe }, Math.max(you.length, foe.length), 0.01, seed);
  const bodies = () => S.your.concat(S.foe).filter((e) => e.b && e.b.cls !== "token");
  const seen = new Set();
  let blocks = 0, t = 0.01, guard = 0;
  while (!S.over && t < 140 && guard++ < 700) {
    E.stepHeadless(0.25); t += 0.25;
    (S.texts || []).forEach((x) => { if (x.t === "block" && !seen.has(x)) { seen.add(x); blocks++; } });
  }
  return { S, t: S.time, blocks, bodies: bodies() };
}

/* Gate alone against three other kits. */
const G = { n: 0, win: 0, taken0: 0, untouched: 0, dead: 0, taken: 0, hpLeft: 0, blocks: 0, time: 0 };
const pool = IDS.filter((id) => id !== "gate");
console.log("\nGate alone vs 3");
for (let i = 0; i < 48; i++) {
  const foe = [];
  let s = (i * 97 + 13) % pool.length;
  while (foe.length < 3) {
    const id = pool[s % pool.length];
    s++;
    if (!foe.includes(id)) foe.push(id);
  }
  const r = fight(["gate"], foe, (i * 7919 + 3) % 9973);
  const g = r.S.your.find((e) => e.b && e.b.id === "gate");
  G.n++;
  if (r.S.winner === 0) G.win++;
  if (g) {
    G.taken += g.taken;
    G.hpLeft += g.hp / g.max;
    G.blocks += r.blocks;
    G.time += r.t;
    if (g.dead) G.dead++;
    if (g.taken < 1) G.taken0++;
    if (g.hp > g.max * 0.97 && !g.dead) G.untouched++;
  }
  if (i < 8) {
    const names = foe.join(",");
    console.log("  " + names.padEnd(28) + " winner " + (r.S.winner === 0 ? "GATE" : r.S.winner === 1 ? "three" : "draw") +
      "  t " + r.t.toFixed(0) + "s  gate hp " + (g ? Math.round(100 * g.hp / g.max) : "?") +
      "%  taken " + (g ? Math.round(g.taken) : "?") + "  blocks " + r.blocks + (g && g.dead ? "  DEAD" : ""));
  }
}
console.log("gate 1v3  n " + G.n + "  win " + (100 * G.win / G.n).toFixed(0) +
  "%  died " + (100 * G.dead / G.n).toFixed(0) +
  "%  taken/match " + Math.round(G.taken / G.n) +
  "  hp left " + (100 * G.hpLeft / G.n).toFixed(0) +
  "%  untouched " + G.untouched +
  "  zero-taken " + G.taken0 +
  "  blocks/match " + (G.blocks / G.n).toFixed(1) +
  "  time " + (G.time / G.n).toFixed(0) + "s");

/* Fair 3v3. Each kit's own record. */
const N = parseInt(process.argv[2] || "300", 10);
const T = {};
function rec(id) { return T[id] = T[id] || { m: 0, w: 0, dead: 0, dmg: 0, taken: 0, kills: 0, heal: 0, timeAlive: 0 }; }
console.log("\n3v3 ladder, " + N + " matches");
for (let i = 0; i < N; i++) {
  if (i && i % 25 === 0) console.log("  ... " + i + "/" + N + " matches");
  const you = R.draw(3).map((f) => f.id);
  const foe = R.draw(3, you).map((f) => f.id);
  const r = fight(you, foe, (i * 4289 + 11) % 9973);
  const side = (team) => (team === 0 ? r.S.your : r.S.foe).filter((e) => e.b && e.b.cls !== "token");
  side(0).concat(side(1)).forEach((e) => {
    const row = rec(e.b.id);
    row.m++;
    row.dmg += e.dmgDone || 0;
    row.taken += e.taken || 0;
    row.kills += e.kills || 0;
    row.heal += e.healDone || 0;
    if (e.dead) row.dead++;
  });
  if (r.S.winner === 0 || r.S.winner === 1) {
    (r.S.winner === 0 ? you : foe).forEach((id) => { if (T[id]) T[id].w++; });
  }
}
const rows = Object.entries(T).map(([id, r]) => ({
  id, m: r.m, wr: r.m ? r.w / r.m : 0, dead: r.m ? r.dead / r.m : 0,
  dmg: r.m ? r.dmg / r.m : 0, taken: r.m ? r.taken / r.m : 0,
  kills: r.m ? r.kills / r.m : 0, heal: r.m ? r.heal / r.m : 0
})).sort((a, b) => b.wr - a.wr);
console.log("kit            m   win%  died%   dealt   taken  kills  healed");
rows.forEach((r) => console.log(
  r.id.padEnd(13) + String(r.m).padStart(3) +
  (100 * r.wr).toFixed(0).padStart(6) + "%" +
  (100 * r.dead).toFixed(0).padStart(6) + "%" +
  String(Math.round(r.dmg)).padStart(8) +
  String(Math.round(r.taken)).padStart(8) +
  r.kills.toFixed(1).padStart(7) +
  String(Math.round(r.heal)).padStart(8)));
const mean = rows.reduce((s, r) => s + r.wr, 0) / rows.length;
console.log("mean win " + (100 * mean).toFixed(1) + "%");
console.log("high " + rows.filter((r) => r.wr >= 0.68).map((r) => r.id + " " + (100 * r.wr).toFixed(0)).join(", "));
console.log("low  " + rows.filter((r) => r.wr <= 0.34).map((r) => r.id + " " + (100 * r.wr).toFixed(0)).join(", "));
