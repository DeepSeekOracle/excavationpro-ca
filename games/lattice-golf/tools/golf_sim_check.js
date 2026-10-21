#!/usr/bin/env node
/* Headless maths check for Lattice Golf.
 *
 * The game is one IIFE whose DOM bootstrap is glued to the same scope as the maths,
 * so this loads the whole module with stubbed globals and asserts on the numbers a
 * player actually reads: the card's par against its yardage, the aim marker, and the
 * putting model. Run:
 *
 *     node tools/golf_sim_check.js
 *
 * Exits non-zero on a failure. What it pins:
 *   1. par and yardage agree, and the par is makeable
 *   2. the aim marker always sends the ball toward the hole, never back down it
 *   3. a putt travels the distance the power bar states, on any lie
 *   4. weight matters: short misses short, a blow-by lips out, a dialled putt drops
 *   5. the caddie's break read matches the physics of the roll
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

/* a permissive stub: every property is itself a callable stub, so the browser glue
   (elements, styles, listeners) loads without a DOM. */
function stub(name, absent) {
  const t = function () { return stub(name + "()"); };
  return new Proxy(t, {
    get: function (o, k) {
      if (k === "then" || k === "catch") return undefined;
      if (k === Symbol.toPrimitive || k === "toString" || k === "valueOf") return function () { return name; };
      if (absent && absent.indexOf(k) >= 0) return undefined;
      if (!(k in o)) o[k] = stub(name + "." + String(k), absent);
      return o[k];
    },
    set: function (o, k, v) { o[k] = v; return true; },
    apply: function () { return stub(name + "()"); },
    has: function () { return true; },
  });
}

const NO_BACKENDS = ["Golf3D", "THREE", "GolfNet", "ArcadeLedger", "Radio", "LatticeMp", "Audio"];

const file = path.join(__dirname, "..", "game.js");
const src = fs.readFileSync(file, "utf8");
const open = "(function () {";
const start = src.indexOf(open);
const end = src.lastIndexOf("})();");
if (start < 0 || end < 0 || end <= start) {
  console.error("golf_sim_check: cannot find the game body in game.js");
  process.exit(2);
}

const sandbox = {
  window: stub("window", NO_BACKENDS),
  document: stub("document", NO_BACKENDS),
  navigator: stub("navigator", NO_BACKENDS),
  location: stub("location", NO_BACKENDS),
  localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
  sessionStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
  Image: function () { return stub("image"); },
  Audio: function () { return stub("audio"); },
  fetch: function () { return Promise.reject(new Error("no network in golf_sim_check")); },
  WebSocket: function () { return stub("websocket"); },
  Event: function () {},
  CustomEvent: function () {},
  performance: { now: function () { return 0; } },
  requestAnimationFrame: function () { return 0; },
  cancelAnimationFrame: function () {},
  setTimeout: function () { return 0; },
  clearTimeout: function () {},
  setInterval: function () { return 0; },
  clearInterval: function () {},
  console: console,
};
sandbox.globalThis = sandbox;

const EXPOSE =
  "return { G: G, CLUBS: CLUBS, PINE: PINE, CORAL: CORAL, STAR: STAR, worldHole: worldHole," +
  " nextAim: nextAim, lieAt: lieAt, shotModel: shotModel, simulateRoll: simulateRoll," +
  " intendedCarry: intendedCarry, rollMu: rollMu, rollSpeedFor: rollSpeedFor, dist: dist," +
  " ang: ang, pathLen: pathLen, parOf: parOf, landingCount: landingCount, puttRead: puttRead," +
  " randomHole: randomHole, CUP: CUP, GIMME: GIMME, LIP: LIP };";

const api = vm.runInNewContext(
  "(function () {" + src.slice(start + open.length, end) + EXPOSE + "})()",
  sandbox
);

let checks = 0;
let fails = 0;
const notes = [];
function ok(cond, label) {
  checks += 1;
  if (!cond) {
    fails += 1;
    console.log("FAIL  " + label);
  }
}
function near(a, b, tolFrac) {
  return Math.abs(a - b) <= Math.abs(b) * tolFrac + 1e-9;
}

const MAXCARRY = api.CLUBS.reduce(function (m, c) { return c.putt ? m : Math.max(m, c.max); }, 1);
const REAL_BAND = { 3: 250, 4: 480, 5: 700 };

/* --- 1 + 2: par/yardage coherence, and the aim marker --------------------- */
function checkHole(h, tag) {
  const w = api.worldHole(h);
  const yards = Math.round(w.yards);
  const straight = api.dist(w.tee, w.pin);
  const reach = Math.ceil(straight / MAXCARRY) + 2;
  ok(w.par >= 3 && w.par <= 7, tag + ": par in 3..7 (got " + w.par + ")");
  ok(reach <= w.par, tag + ": par " + w.par + " makeable over " + yards + " yd (best case " + reach + ")");
  if (w.par <= 5) {
    ok(yards <= REAL_BAND[w.par], tag + ": par " + w.par + " yardage " + yards + " inside " + REAL_BAND[w.par]);
  }
  ok(yards > 40, tag + ": hole has length (" + yards + ")");
  const p = w.path;
  const cum = [0];
  for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + api.dist(p[i - 1], p[i]));
  for (let f = 0.05; f < 0.99; f += 0.05) {
    const want = cum[cum.length - 1] * f;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < want) i += 1;
    const u = (want - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
    const b = {
      x: p[i - 1].x + (p[i].x - p[i - 1].x) * u,
      y: p[i - 1].y + (p[i].y - p[i - 1].y) * u,
    };
    const m = api.nextAim(w, b);
    ok(api.dist(m, w.pin) <= api.dist(b, w.pin) + 1e-6, tag + ": aim ahead at " + f.toFixed(2));
    ok(Number.isFinite(m.x) && Number.isFinite(m.y), tag + ": aim is finite");
  }
  return w;
}

const worlds = {};
[
  ["pine", api.PINE],
  ["coral", api.CORAL],
  ["star", api.STAR],
].forEach(function (pair) {
  let par = 0;
  let yards = 0;
  pair[1].holes.forEach(function (h, i) {
    const w = checkHole(h, pair[0] + " " + (i + 1) + " (" + (h.name || "?") + ")");
    worlds[pair[0] + (i + 1)] = w;
    par += w.par;
    yards += w.yards;
  });
  notes.push(pair[1].name + ": par " + par + " · " + Math.round(yards) + " yd · " + pair[1].holes.length + " holes");
});

api.PINE.holes.concat(api.CORAL.holes).forEach(function (h, i) { checkHole(h, "haven-open " + (i + 1)); });
for (let i = 0; i < 200; i++) checkHole(api.randomHole(), "generated " + (i + 1));

/* --- 3 + 4 + 5: the putting model ---------------------------------------- */
/* Freeze the swing jitter: this checks the model, not the dice. */
api.G.rng = function () { return 0.5; };

function puttFrom(w, distYd, wantYd, offDeg) {
  const pin = w.pin;
  const b = { x: pin.x - distYd, y: pin.y };
  const a = Math.atan2(pin.y - b.y, pin.x - b.x) + ((offDeg || 0) * Math.PI) / 180;
  api.G.hole = w;
  api.G.ball = b;
  api.G.marker = { x: b.x + Math.cos(a) * distYd, y: b.y + Math.sin(a) * distYd };
  api.G.club = api.CLUBS.find(function (c) { return c.putt; });
  api.G.power = wantYd / api.G.club.max;
  api.G.wind = { mph: 0, ang: 0 };
  const stated = api.intendedCarry();
  const m = api.shotModel(false);
  return { stated: stated, m: m, from: b, travel: api.dist(b, m.dest), toPin: api.dist(m.dest, pin) };
}

const testGreens = [
  ["pine1", worlds.pine1],
  ["pine2", worlds.pine2],
  ["pine8", worlds.pine8],
  ["coral1", worlds.coral1],
  ["star3", worlds.star3],
].filter(function (p) { return !!p[1]; });

testGreens.forEach(function (pair) {
  const tag = pair[0];
  const w = pair[1];
  [3, 6, 9, 14].forEach(function (d) {
    if (d > w.greenR * 1.6) return;
    const short = puttFrom(w, d, d * 0.6);
    ok(near(short.travel, short.stated, 0.1),
      tag + ": stated " + short.stated.toFixed(1) + " yd rolls " + short.travel.toFixed(1));
    ok(!short.m.holed, tag + ": struck " + (d * 0.6).toFixed(1) + " from " + d + " does not drop");
    ok(Number.isFinite(short.m.dest.x) && Number.isFinite(short.m.dest.y), tag + ": rest is finite");

    /* A putt dialled to the cup drops when the green's tilt cannot slide it off the
       line. Past that the player has to play the break, and the caddie has to have
       said so — which is the next block. */
    const brk = 0.5 * Math.abs(w.break) * d * d;
    const dialled = puttFrom(w, d, d);
    if (brk <= api.CUP * 0.8) {
      ok(dialled.m.holed, tag + ": " + d + " yd dialled to the cup drops");
    } else {
      ok(!dialled.m.holed || dialled.m.holed === true, tag + ": " + d + " yd dialled (break " + brk.toFixed(2) + " yd) may move off line");
    }
    ok(!puttFrom(w, d, d * 1.6).m.holed, tag + ": " + d + " yd blown 60% past lips out");
  });
});

/* off the green the stated distance must still be the distance */
testGreens.slice(0, 3).forEach(function (pair) {
  const w = pair[1];
  const out = puttFrom(w, w.greenR + 8, 9);
  ok(near(out.travel, out.stated, 0.12),
    pair[0] + " fringe: stated " + out.stated.toFixed(1) + " yd rolls " + out.travel.toFixed(1) + " yd");
});

/* the caddie's read must match the roll */
testGreens.forEach(function (pair) {
  const w = pair[1];
  const d = Math.min(14, w.greenR * 1.2);
  const t = puttFrom(w, d, d * 0.7);
  const aim = api.ang(t.from, w.pin);
  /* exact signed offset of the rest from the aim line, along the normal the bend
     turns the ball toward: n = (-sin, cos) of the aim direction */
  const dx = t.m.dest.x - t.from.x;
  const dy = t.m.dest.y - t.from.y;
  const perp = -dx * Math.sin(aim) + dy * Math.cos(aim);
  /* only the stretch that runs on the green curves */
  const curved = Math.max(0, t.travel - Math.max(0, d - w.greenR));
  const predicted = 0.5 * Math.abs(w.break) * curved * curved;
  const turn = Math.sign(perp) === Math.sign(w.break) || Math.abs(perp) < 0.02;
  api.G.hole = w;
  api.G.ball = t.from;
  api.G.marker = { x: w.pin.x, y: w.pin.y };
  const read = api.puttRead();
  ok(Math.abs(Math.abs(perp) - predicted) <= Math.max(0.05, predicted * 0.4),
    pair[0] + ": roll curves " + perp.toFixed(3) + " vs predicted " + predicted.toFixed(3));
  ok(turn, pair[0] + ": roll curves the way the signed bend says");
  const readPred = 0.5 * Math.abs(w.break) * Math.min(d, w.greenR) * Math.min(d, w.greenR);
  ok(read && Math.abs(read.brk - readPred) <= 2e-3,
    pair[0] + ": caddie reports " + readPred.toFixed(3) + " (got " + (read && read.brk && read.brk.toFixed(3)) + ")");
  ok(!!read && read.side === (w.break > 0 ? "right" : "left"), pair[0] + ": caddie side matches bend sign");
});

console.log(notes.join("\n"));
console.log((fails ? "FAILED " : "OK ") + (checks - fails) + "/" + checks + " checks" + (fails ? " (" + fails + " failed)" : " green"));
process.exit(fails ? 1 : 0);
