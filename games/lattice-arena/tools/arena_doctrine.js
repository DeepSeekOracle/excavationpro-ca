/* LYGO Arena — the doctrine report.

   Wins are an outcome. This measures the BEHAVIOUR behind them, because the two
   things a spectator actually sees are a body that stops thinking and a body that
   walks into a gun on its own. Neither shows up in a win rate.

   Sections:
     1. DUELS   — contact kits against guns, 1v1, by the whole melee list against the
                  whole ranged list. Reports who wins AND what the walk in cost:
                  how much health was spent before first contact, and whether the gun
                  was already loaded when the body arrived (the bait question).
     2. FIELD   — random team battles, sampled four times a second. Counts, per kit:
                    solo     seconds inside its own reach with no ally within 200px
                    gunwalk  seconds closing on a longest-reach enemy whose shot is loaded
                    idle     seconds with no live target and no enemy within 220px
                    pinned   seconds the engine's own stuck counter was tripped
                    focus%   share of its engaged samples where an ally shared the target
                    isoD     deaths with no ally within 165px  (rushing)
                    wd       withdrawals, and how many were alive six seconds later

   node tools/arena_doctrine.js [duelSeeds=3] [fieldMatches=24]
*/
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const ARGV = process.argv.slice(2);
const POS = ARGV.filter((a) => !a.startsWith("--"));          // positional args, flags removed
const num = (i, d) => { const v = parseInt(POS[i], 10); return isFinite(v) ? v : d; };
/* --brain=<path> measures a different brain.js: the committed one from
   `git show HEAD:games/lattice-arena/brain.js` against the working tree is the only
   honest before/after this sim allows, because the sim calls Math.random itself. */
const BRAIN = (ARGV.find((a) => a.startsWith("--brain=")) || "").split("=")[1] || "";
/* --only=<kitId> runs that one contact kit against every gun with real resolution.
   A per-row win rate over a single fight is 0% or 100% and says nothing; one kit at
   many seeds is how a structural question (does a gap-closer decide these duels?)
   gets an answer. */
const ONLY = (ARGV.find((a) => a.startsWith("--only=")) || "").split("=")[1] || "";
/* --arena=<path> A/Bs the ENGINE, which is where the approach rules live. */
const ARENA = (ARGV.find((a) => a.startsWith("--arena=")) || "").split("=")[1] || "";
const DUEL_SEEDS = num(0, 3);
const FIELD_MATCHES = num(1, 24);
const SAMPLE = 0.25;          // seconds per sample: fast enough to catch a 1s stuck window
const CAP = 200;              // sim seconds per match, the same cap the check tool uses

/* --- stub the browser the engine expects (mirrors tools/arena_check.js) --- */
function stubEl() {
  return {
    style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} },
    getContext: () => ({
      imageSmoothingEnabled: false, fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1,
      font: "", textAlign: "", globalCompositeOperation: "",
      fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {}, arc() {}, ellipse() {},
      moveTo() {}, lineTo() {}, stroke() {}, fill() {}, save() {}, restore() {}, translate() {},
      scale() {}, setTransform() {}, setLineDash() {}, drawImage() {}, clearRect() {}, measureText: () => ({ width: 40 })
    }),
    toDataURL: () => "data:image/png;base64,",
    appendChild() {}, addEventListener() {}, removeEventListener() {},
    getBoundingClientRect: () => ({ width: 900, height: 600, left: 0, top: 0 }),
    querySelector: () => null, querySelectorAll: () => [], setAttribute() {}, focus() {}
  };
}
const document = {
  createElement: () => stubEl(), getElementById: () => stubEl(), querySelector: () => null,
  querySelectorAll: () => [], addEventListener() {}, body: stubEl(), documentElement: stubEl()
};
const win = {
  devicePixelRatio: 1, document, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  Image: function () { this.onload = null; this.onerror = null; },
  fetch: () => Promise.resolve({ json: () => Promise.resolve({ names: {} }) }),
  setTimeout, clearTimeout, console
};
win.window = win;
const ctx = vm.createContext(win);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
["roster.js", "banter.js", "director.js", "attacks.js", "formation.js"].forEach(load);
if (!win.LYGO_FORMATION) console.log("WARNING: formation.js is not loaded -- this report describes a build that is not what ships");
if (BRAIN) vm.runInContext(fs.readFileSync(BRAIN, "utf8"), ctx, { filename: "brain.js" });
else load("brain.js");
if (ARENA) vm.runInContext(fs.readFileSync(ARENA, "utf8"), ctx, { filename: "arena.js" });
else load("arena.js");
console.log("brain: " + (BRAIN || "working tree") + (process.env.LABEL ? "   [" + process.env.LABEL + "]" : ""));
const R = win.LYGO_ARENA, E = win.ArenaEngine;

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
/* roster.range is authored in TILES; a live body's kit is the buffed copy, in PX. */
const reach = (e) => e.b.range || 40;
const px = (f) => Math.round((f.range || 0) * 32);
/* Seeded team draw: the same teams every run, or the field numbers are two different
   experiments and cannot be compared. */
let rseed = 987654321;
const rnd = () => { rseed = (rseed * 1103515245 + 12345) & 0x7fffffff; return rseed / 0x7fffffff; };
function draw(n, exclude) {
  const pool = R.ROSTER.filter((f) => !(exclude || []).includes(f.id));
  const out = [];
  for (let i = 0; i < n; i++) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return out;
}
/* The census: what the bodies were actually thinking. Every plan names its reason. */
function census() { return {}; }
function say(book, why, dt, died) {
  if (!why) why = "(no reason given)";
  const row = (book[why] = book[why] || { s: 0, d: 0 });
  row.s += dt;
  if (died) row.d++;
  return row;
}
function showCensus(book, title) {
  const rows = Object.keys(book).map((k) => ({ k, r: book[k] })).sort((a, c) => c.r.s - a.r.s);
  console.log("    " + title);
  rows.forEach((r) => console.log("      " + r.k.padEnd(34) + r.r.s.toFixed(0).padStart(6) + "s" + String(r.r.d).padStart(6) + " deaths"));
}
const MELEE = (ONLY ? R.ROSTER.filter((f) => f.id === ONLY)
  : R.ROSTER.filter((f) => (f.range || 0) > 0 && (f.range || 0) <= 2.2)
    .sort((a, b) => a.range - b.range).slice(0, num(2, 6)));
const GUNS = R.ROSTER.filter((f) => (f.range || 0) >= 5)
  .sort((a, b) => b.range - a.range).slice(0, num(3, 6));

/* Drive one match by hand so every frame is observable. */
function trace(you, foe, mode, seed, onSample) {
  E.newMatch({ you, foe }, mode, seed);
  const S = E.state();
  S.phase = "live";
  let t = 0;
  while (!S.over && t < CAP) {
    E.stepHeadless(SAMPLE);
    t += SAMPLE;
    if (onSample) onSample(S, t);
  }
  return S;
}

/* ============================ 1. duels ==================================== */
console.log("=== duels: contact kits vs guns, 1v1 (cap " + CAP + "s) ===");
console.log("    melee kit        reach | gun kit           reach | win% | hp spent walking | met a loaded gun | first contact");
console.log("    (" + MELEE.map((f) => f.id + " " + px(f) + "px").join(", ") + ")");
console.log("    (" + GUNS.map((f) => f.id + " " + px(f) + "px").join(", ") + ")");
const duelRows = [];
const duelWhy = census();
let mWins = 0, mTotal = 0;
MELEE.forEach((me) => {
  GUNS.forEach((gu) => {
    let wins = 0, walk = 0, loaded = 0, contact = 0, n = 0;
    for (let s = 0; s < DUEL_SEEDS; s++) {
      const seed = 1000 + s * 37;
      let firstAt = null, hpAtEntry = null, gunReadyAtEntry = null;
      trace([me.id], [gu.id], 1, seed, (S) => {
        const a = S.your[0], b = S.foe[0];
        [a, b].forEach((x) => { if (x && !x.dead && x.plan) say(duelWhy, x.plan.why, SAMPLE, false); });
        if (!a || !b || a.dead || b.dead) return;
        if (firstAt == null && dist(a, b) <= reach(a) + 14) {
          firstAt = S.time; hpAtEntry = a.hp / a.max; gunReadyAtEntry = b.atkCd <= 0.2;
        }
      });
      const S = E.state();
      const a = S.your[0], b = S.foe[0];
      n++;
      if (S.winner === 0) wins++;
      if (firstAt == null) { walk += 1; loaded += 0; contact += CAP; }
      else { walk += 1 - hpAtEntry; loaded += gunReadyAtEntry ? 1 : 0; contact += firstAt; }
      void a; void b;
    }
    mWins += wins; mTotal += n;
    duelRows.push({ me, gu, win: wins / n, walk: walk / n, loaded: loaded / n, contact: contact / n });
  });
});
duelRows.sort((a, b) => a.win - b.win);
duelRows.forEach((r) => {
  console.log("    " + r.me.id.padEnd(16) + String(px(r.me)).padStart(4) + " | " +
    r.gu.id.padEnd(16) + String(px(r.gu)).padStart(4) + " | " +
    (r.win * 100).toFixed(0).padStart(9) + "% | " +
    (r.walk * 100).toFixed(0).padStart(7) + "% | " +
    (r.loaded * 100).toFixed(0).padStart(18) + "% | " +
    r.contact.toFixed(1).padStart(12) + "s");
});
const avgWalk = duelRows.reduce((s, r) => s + r.walk, 0) / duelRows.length;
const avgLoaded = duelRows.reduce((s, r) => s + r.loaded, 0) / duelRows.length;
console.log("    ---");
/* A win rate without an interval is a coin toss wearing a number: at n=180 the standard
   error on a 34% rate is 3.5 points, so anything under 7 points is not a result. */
const pWin = mWins / mTotal, se = Math.sqrt((pWin * (1 - pWin)) / mTotal);
console.log("    contact kits win " + (pWin * 100).toFixed(1) + "% of these duels (" + mTotal + " fights, 95% " +
  ((pWin - 1.96 * se) * 100).toFixed(1) + "-" + ((pWin + 1.96 * se) * 100).toFixed(1) + "%)");
console.log("    they spend " + (avgWalk * 100).toFixed(0) + "% of their health before they land a hit, and arrive at a LOADED gun " + (avgLoaded * 100).toFixed(0) + "% of the time");
/* The loaded-at-arrival number is a weak instrument: the walk takes about 2.4s and the
   gun's cycle is about 1s, so a well-timed entry still lands on a loaded gun by chance.
   What the AI was THINKING is the measurement that actually reads. */
showCensus(duelWhy, "what both bodies were thinking (seconds, deaths):");

/* ============================ 2. field =================================== */
console.log("");
console.log("=== field behaviour (" + FIELD_MATCHES + " battles, sampled every " + SAMPLE + "s) ===");
const MODES = [1, 2, 3, 5];
const K = {};                 // kit id -> counters
const bump = (id) => (K[id] = K[id] || { solo: 0, gun: 0, idle: 0, pinned: 0, eng: 0, shared: 0, isoD: 0, D: 0, wd: 0, wdSaved: 0, t: 0 });
const fieldWhy = census();
const T = { melee: 0, shots: 0, blocks: 0, wards: 0, whiffs: 0, warded: 0, chipped: 0 };
let TS = null;
let deaths = 0, isoDeaths = 0, gunDeaths = 0, idleSec = 0, soloSec = 0, gunSec = 0, pinnedSec = 0, engS = 0, sharedS = 0;
for (let m = 0; m < FIELD_MATCHES; m++) {
  const n = MODES[m % MODES.length];
  const you = draw(n).map((f) => f.id);
  const foe = draw(n, you).map((f) => f.id);
  const wdAt = {};            // body key -> sim time it withdrew
  const prevDead = {};
  TS = trace(you, foe, n, (m * 7919) % 9973, (S) => {
    const all = S.your.concat(S.foe);
    all.forEach((e) => {
      const id = e.b.id, k = bump(id);
      k.t += SAMPLE;
      const dead = !!e.dead;
      const key = (e.team) + ":" + id + ":" + all.indexOf(e);
      if (dead && !prevDead[key]) {
        prevDead[key] = true; k.D++; deaths++;
        const mates = (e.team === 0 ? S.your : S.foe).filter((o) => o !== e && !o.dead);
        const near = mates.some((o) => dist(o, e) < 165);
        if (!near) { k.isoD++; isoDeaths++; }
        const tgt = e.target;
        if (tgt && !tgt.dead && reach(tgt) > reach(e) + 60) { gunDeaths++; }
      }
      if (dead) return;
      const team = e.team === 0 ? S.your : S.foe;
      const en = (e.team === 0 ? S.foe : S.your).filter((o) => !o.dead);
      const mates = team.filter((o) => o !== e && !o.dead);
      const nearMate = mates.filter((o) => dist(o, e) < 200).length;
      const myR = reach(e);
      const within = en.filter((o) => dist(o, e) <= myR + 20);
      const tgt = e.target && !e.target.dead ? e.target : null;
      /* standing with nothing to do: no target and nothing close */
      const closest = en.reduce((a, o) => Math.min(a, dist(o, e)), 1e9);
      if (!tgt && closest > 220) { k.idle += SAMPLE; idleSec += SAMPLE; }
      /* inside my own reach with no ally anywhere near */
      if (within.length && nearMate === 0) { k.solo += SAMPLE; soloSec += SAMPLE; }
      /* closing on the longest reach on the field while its shot is loaded */
      if (tgt && myR < 90 && reach(tgt) > 160 && dist(e, tgt) > myR && (tgt.atkCd == null || tgt.atkCd <= 0.15) && nearMate === 0) {
        k.gun += SAMPLE; gunSec += SAMPLE;
      }
      if (e.stuckS > 0) { k.pinned += SAMPLE; pinnedSec += SAMPLE; }
      if (e.plan) say(fieldWhy, e.plan.why, SAMPLE, false);
      if (tgt) {
        k.eng += SAMPLE; engS += SAMPLE;
        const sharedT = mates.some((o) => o.target === tgt);
        if (sharedT) { k.shared += SAMPLE; sharedS += SAMPLE; }
      }
      const task = e.plan && e.plan.task;
      if (task === "withdraw" && wdAt[key] == null) { wdAt[key] = S.time; k.wd++; }
      if (wdAt[key] != null && S.time - wdAt[key] <= SAMPLE * 1.5 && S.time - wdAt[key] >= 6 && !dead) k.wdSaved++;
    });
  });
}
const rows = Object.keys(K).map((id) => ({ id, k: K[id] }))
  .sort((a, b) => (b.k.isoD * 60 + b.k.pinned + b.k.gun * 0.5) - (a.k.isoD * 60 + a.k.pinned + a.k.gun * 0.5));
console.log("    kit            solo s   gunwalk s   idle s   pinned s   focus%   deaths  isolated  withdrew/saved");
rows.slice(0, 14).forEach((r) => {
  console.log("    " + r.id.padEnd(14) + r.k.solo.toFixed(1).padStart(7) + r.k.gun.toFixed(1).padStart(12) +
    r.k.idle.toFixed(1).padStart(9) + r.k.pinned.toFixed(1).padStart(10) +
    (r.k.eng ? ((r.k.shared / r.k.eng) * 100).toFixed(0) + "%" : "—").padStart(9) +
    String(r.k.D).padStart(8) + String(r.k.isoD).padStart(10) +
    ("  " + r.k.wd + "/" + r.k.wdSaved).padStart(18));
});
console.log("    ---");
console.log("    deaths " + deaths + " · isolated (no ally within 165px) " + isoDeaths + " (" + ((isoDeaths / (deaths || 1)) * 100).toFixed(0) + "%)" +
  " · killed while chasing a longer reach " + gunDeaths);
if (TS.tele) Object.keys(T).forEach((k) => { T[k] += TS.tele[k] || 0; });
showCensus(fieldWhy, "what the whole field was thinking (seconds, deaths):");
console.log("    blows: " + T.melee + " melee swings, " + T.shots + " aimed shots fired | armour stopped " + T.blocks +
  " | a ward ate " + T.wards + " blows for " + Math.round(T.warded || 0) + " damage and let " + Math.round(T.chipped || 0) + " through | shots that arrived at nothing " + T.whiffs +
  (T.shots ? " (" + ((T.whiffs / T.shots) * 100).toFixed(0) + "% of shots)" : ""));
console.log("    field seconds: solo " + soloSec.toFixed(0) + " · gunwalk " + gunSec.toFixed(0) + " · idle " + idleSec.toFixed(0) +
  " · pinned " + pinnedSec.toFixed(0) + " · focus share " + ((sharedS / (engS || 1)) * 100).toFixed(0) + "%");
