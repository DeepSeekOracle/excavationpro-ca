/* LYGO Arena — the balance ladder.
   Runs the whole roster through N headless matches and prints a win rate per kit, so a
   change can be measured instead of guessed: the buffs that made the arena fair were all
   found here. Slow by design (a few minutes for 420 matches).

   node tools/arena_ladder.js 420
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
load("roster.js"); load("attacks.js"); load("formation.js"); load("brain.js"); load("arena.js");
if (!win.LYGO_FORMATION) console.log("WARNING: formation.js is not loaded -- this report describes a build that is not what ships");
/* the pre-stage has to be loaded or this tool measures the game without it, which is
   exactly the mistake it exists to catch */
const R = win.LYGO_ARENA, E = win.ArenaEngine, STY = E.brain().styles();
const N = parseInt(process.argv[2] || "400", 10);
const MODES = [1, 2, 3, 5];
const T = {};
function rec(id) { return T[id] = T[id] || { m: 0, w: 0, dead: 0, dmg: 0, kills: 0, heal: 0, byMelee: 0, byRanged: 0, ccT: 0 }; }
const d = (a, c) => Math.hypot(a.x - c.x, a.y - c.y);
for (let i = 0; i < N; i++) {
  const n = MODES[i % MODES.length];
  const you = R.draw(n).map((f) => f.id), foe = R.draw(n, you).map((f) => f.id);
  const S = E.runHeadless({ you, foe }, n, 0.01, (i * 4289 + 11) % 9973);
  const mine = {}, seen = {};
  const bodiesOf = (team) => (team === 0 ? S.your : S.foe).filter((e) => e.b);
  bodiesOf(0).concat(bodiesOf(1)).forEach((e) => { mine[e.b.id] = e; rec(e.b.id).m++; seen[e.b.id] = e.dead; });
  let t = 0.01, guard = 0;
  while (!S.over && t < 140 && guard++ < 700) {
    E.stepHeadless(0.25); t += 0.25;
    bodiesOf(0).concat(bodiesOf(1)).forEach((e) => {
      if (e.dead && !seen[e.b.id]) {
        seen[e.b.id] = true;
        const r = rec(e.b.id);
        r.dead++;
        const foes = bodiesOf(1 - e.team).filter((o) => !o.dead);
        if (foes.length) {
          const near = foes.reduce((a, o) => (d(o, e) < d(a, e) ? o : a));
          if ((near.b.range || 40) <= 110) r.byMelee++; else r.byRanged++;
        }
      }
    });
  }
  // CC pressure applied: how much stun/root/slow this kit put on the other side
  const myTeam = mine[you[0]] ? 0 : null;
  bodiesOf(0).concat(bodiesOf(1)).forEach((e) => {
    const r = rec(e.b.id);
    r.dmg += e.dmgDone || 0; r.kills += e.kills || 0; r.heal += e.healDone || 0;
    r.ccT += (e.ccApplied || 0);
  });
  if (S.winner === 0 || S.winner === 1) {
    const winners = S.winner === 0 ? you : foe;
    winners.forEach((id) => { if (T[id]) T[id].w++; });
  }
}
const rows = Object.entries(T).map(([id, r]) => ({
  id, m: r.m, wr: r.m ? r.w / r.m : 0, dead: r.m ? r.dead / r.m : 0,
  dmg: r.m ? r.dmg / r.m : 0, kills: r.m ? r.kills / r.m : 0, heal: r.m ? r.heal / r.m : 0,
  meleeShare: (r.byMelee + r.byRanged) ? r.byMelee / (r.byMelee + r.byRanged) : 0,
  style: (R.ROSTER.find((f) => f.id === id) || {}).style,
  ci: 1.96 * Math.sqrt(0.25 / r.m)                       // 95% half-width: the noise this sample can resolve
})).filter((r) => r.m >= 30).sort((a, b) => a.wr - b.wr);
const f = (v, k) => v.toFixed(k === undefined ? 2 : k);
console.log("kit          style        m  win%+-  died%  dmg/match  kills  healed  killed-by-melee");
rows.forEach((r) => console.log(
  r.id.padEnd(12) + String(r.style || "-").padEnd(11) + String(r.m).padStart(3) + "  " +
  (100 * r.wr).toFixed(0).padStart(3) + "+-" + (100 * r.ci).toFixed(0).padStart(2) + "   " +
  (100 * r.dead).toFixed(0).padStart(4) + "   " +
  f(r.dmg, 0).padStart(6) + "   " + f(r.kills, 1).padStart(5) + "   " + f(r.heal, 0).padStart(6) + "   " +
  (100 * r.meleeShare).toFixed(0).padStart(4) + "%" + (Math.abs(r.wr - 0.5) <= r.ci ? "   ~" : "")));
const all = rows.reduce((a, r) => a + r.wr * r.m, 0) / rows.reduce((a, r) => a + r.m, 0);
console.log("\nfield average " + (100 * all).toFixed(1) + "% of " + rows.length + " kits over " + N + " matches");
const ci = rows.reduce((a, r) => a + r.ci, 0) / rows.length * 100;
console.log("\n+-" + ci.toFixed(0) + " points is the 95% interval on one kit at this sample, and two runs of this");
console.log("harness disagree by more than that ('~' = the interval covers 50%, so the kit is average, not weak).");
console.log("Fix a kit only for a cause you can name -- it cannot use its own attack, it never reaches its own");
console.log("band, its signature ability carries the match -- never to chase a number inside that band.");
