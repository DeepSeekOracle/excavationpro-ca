/* Haven Rally QA matrix — Node stand-in for a browser pass.
   Runs the pure lap/ghost maths straight out of game.js, then checks the source
   invariants that the fixes depend on. No browser, no build step. */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const game = fs.readFileSync(path.join(root, "game.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "game.css"), "utf8");
const rally = fs.readFileSync(path.join(root, "rally3d.js"), "utf8");
const paper = fs.readFileSync(path.join(root, "whitepaper.html"), "utf8");

let checks = 0;
function must(cond, msg) {
  checks += 1;
  if (!cond) {
    process.stderr.write("FAIL " + msg + "\n");
    process.exit(1);
  }
}

/* ---- lift the real functions out of the IIFE so the maths is tested, not assumed ---- */
function grab(name) {
  const i = game.indexOf("function " + name + "(");
  must(i >= 0, "game.js defines " + name);
  const open = game.indexOf("{", i);
  let depth = 0;
  for (let j = open; j < game.length; j++) {
    if (game[j] === "{") depth += 1;
    else if (game[j] === "}") {
      depth -= 1;
      if (!depth) return game.slice(i, j + 1);
    }
  }
  throw new Error("unbalanced " + name);
}
function sandbox(names) {
  const body = names.map(grab).join("\n") + "\nreturn { " + names.join(", ") + " };";
  return new Function("clamp", "G", "isFinite", "Math", body);
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const box = sandbox(["expectedAt", "ghostCoversHeat", "fmtSigned", "crossed"]);
const G = {
  bestSegs: [10000, 12000, 11000, 13000],
  segFracs: [0.28, 0.55, 0.82, 1]
};
const { expectedAt, ghostCoversHeat, fmtSigned, crossed } = box(clamp, G, isFinite, Math);

/* ---- record-lap profile: the live delta reads off this ---- */
must(expectedAt(0) === 0, "profile starts at zero");
must(expectedAt(0.28) === 10000, "profile hits sector 1 split");
must(expectedAt(0.55) === 22000, "profile hits sector 2 split");
must(expectedAt(0.82) === 33000, "profile hits sector 3 split");
must(expectedAt(1) === 46000, "profile ends on the record lap time");
must(expectedAt(0.14) === 5000, "profile interpolates inside a sector");
must(expectedAt(0.9) > 33000 && expectedAt(0.9) < 46000, "profile interpolates the last sector");
must(expectedAt(1.4) === 46000, "profile clamps past the line");
let prev = -1, mono = true;
for (let f = 0; f <= 1.0001; f += 0.01) {
  const v = expectedAt(f);
  if (v < prev) mono = false;
  prev = v;
}
must(mono, "profile is monotonic");
G.bestSegs = null;
must(expectedAt(0.5) === null, "no record lap = no delta");

/* ---- the phantom opening lap: the start/finish seam ---- */
const L = 1000;
must(crossed(0.2 * L, 0.3 * L, 0.28 * L, L) === true, "a real sector pass still counts");
must(crossed(0.8 * L, 0.24 * L, 0.28 * L, L) === false, "no sector on the wrap itself");
must(crossed(0.9 * L, 0.02 * L, 0, L) === true, "the line crossing after a full lap counts");
/* measured on the live grid: the projector flips between s~0 and s~len at the seam.
   Before the fix that stamped all three sectors in the first frame (0:00.017 each). */
const SEAM = 1565;
must(crossed(0.5, SEAM - 0.2, 0.28 * SEAM, SEAM) === false, "seam flip forward stamps no sector");
must(crossed(0.5, SEAM - 0.2, 0, SEAM) === false, "seam flip forward counts no lap");
must(crossed(SEAM - 0.2, 0.5, 0.28 * SEAM, SEAM) === false, "seam flip backward stamps no sector");
/* the stamp storm that survived the first fix: the heat sat on the grid for seconds,
   the projector or the car stepped across the seam, and every gate read as passed */
must(crossed(1508 - 11.27, 1508 - 11.27, 0.28 * 1508, 1508) === false, "a stationary frame stamps nothing");
must(crossed(1508 - 11.27, 1508 - 11.9, 0.28 * 1508, 1508) === false, "jitter backwards stamps nothing");
must(crossed(1508 - 11.27, 1.5, 0.28 * 1508, 1508) === false, "a seam flip stamps no sector");
must(crossed(1.5, 1508 - 11.27, 0.28 * 1508, 1508) === false, "the flip back stamps no sector either");
must(crossed(1508 - 11.27, 1.5, 829, 1508) === false, "and not the later gates");
must(crossed(1508 - 300, 1508 - 200, 0.28 * 1508, 1508) === false, "a gate still needs real distance");
must(crossed(SEAM - 11, SEAM - 9, 0.28 * SEAM, SEAM) === false, "the grid stub crosses no gate");

/* ---- standing start: seed at the grid, drive a lap, nothing may stamp early ---- */
(function () {
  const len = 1565, seed = len - 11, fracs = [0.28, 0.55, 0.82];
  let gates = [false, false, false], lap = 0, s = seed, travelled = 0;
  const stamp = [], laps = [];
  for (let t = 0; t < 120; t += 1 / 60) {
    const prev = s;
    const spd = Math.min(30, t * 3.4);
    travelled += spd / 60;
    s = (seed + travelled) % len;
    fracs.forEach(function (f, i) {
      if (!gates[i] && crossed(prev, s, f * len, len)) { gates[i] = true; stamp[i] = t; }
    });
    if (gates.every(Boolean) && crossed(prev, s, 0, len) && prev > len * 0.7) {
      lap += 1; laps.push(t); gates = [false, false, false];
    }
  }
  must(stamp.length === 3 && stamp[0] > 12, "sector 1 lands after real distance, not on frame one (got " + stamp[0] + "s)");
  must(stamp[0] < stamp[1] && stamp[1] < stamp[2], "sectors land in order");
  must(laps.length === 2 && laps[0] > 40, "lap 1 needs a full lap from the grid (got " + laps[0] + "s)");
  /* a car that never moves must never score anything, however long the heat runs */
  let idle = 0, idleGates = [false, false, false], sp = seed;
  for (let t = 0; t < 30; t += 1 / 60) {
    const q = sp + (t % 0.4 < 0.2 ? 0.05 : -0.05);
    fracs.forEach(function (f, i) { if (!idleGates[i] && crossed(sp, q, f * len, len)) { idleGates[i] = true; idle += 1; } });
    sp = q;
  }
  must(idle === 0, "thirty idle seconds stamp nothing (got " + idle + ")");
})();

/* ---- the grid origin comes from geometry, never from the projector ---- */
must(game.indexOf("const GRID_BACK = 11;") >= 0, "standing-start grid offset");
must(game.indexOf("const s = (closed && total) ? ((total - back) % total + total) % total : 0;") >= 0,
  "poseOnGrid derives the arc position from the grid geometry");
must(game.indexOf("s0: pose.s == null ? null : pose.s,") >= 0, "the pose carries its arc position into the car");
must(game.indexOf("if (r.car.s0 != null) r.lastS = r.car.s0;") >= 0, "every racer seeds from the pose");
must(game.indexOf("G.lastS = (G.car && G.car.s0 != null) ? G.car.s0") >= 0, "the heat seeds its lap origin from the car");
must(game.indexOf("if (step > total * 0.5) return false;") >= 0 &&
  game.indexOf("return ahead <= step;") >= 0, "crossed measures the stretch actually covered");
must(game.indexOf("return prev <= target || now > target;") < 0, "the old absolute comparison is gone");
must(game.indexOf("if (G.ghost && !ghostCoversHeat(G.ghost, tr.laps, tr.len))") >= 0 &&
  game.indexOf("delete G.save.ghosts[gk];") >= 0, "stale ghosts are dropped, not raced");

/* ---- ghost sanity: an old ghost is one lap short ---- */
function ghost(len, laps, drift) {
  const sm = [];
  for (let i = 0; i <= laps * 10; i++) sm.push({ t: i * 0.1, x: i * (len / 10) * (drift || 1), y: 0 });
  return { ms: 60000, samples: sm };
}
must(ghostCoversHeat(ghost(L, 24), 24, L) === true, "a full heat ghost is kept");
must(ghostCoversHeat(ghost(L, 23), 24, L) === false, "a one-lap-short ghost is rejected");
must(ghostCoversHeat({ ms: 1, samples: [] }, 24, L) === false, "an empty recording is rejected");
must(ghostCoversHeat(null, 24, L) === false, "a missing ghost is rejected");

/* ---- delta formatting ---- */
must(fmtSigned(-213) === "\u22120.213", "signed delta, negative");
must(fmtSigned(120) === "+0.120", "signed delta, positive");
must(fmtSigned(null) === "\u2014", "no reference reads as a dash");

/* ---- barrier contact: a clip may not become a trap ---- */
must(game.indexOf("1 - 0.34 * into") >= 0, "angle-scaled impact thump");
must(game.indexOf("1 - (0.09 + 0.8 * into) * dt") >= 0, "gentle grind rate");
must(game.indexOf("car.speed *= Math.max(0.22, 1 - 1.7 * dt)") < 0, "old 3-mph stall scrub is gone");
must(game.indexOf("car.wallCool = 0.16") >= 0 && game.indexOf("car.scrape = 1") >= 0, "scrape state tracked");

/* ---- auto reverse ---- */
must(game.indexOf("const REV_CAP = 11;") >= 0, "reverse ceiling");
must(game.indexOf("const revOn = !!inp.human && !inp.manual && inp.brake > 0.35") >= 0, "brake-at-standstill reverse, humans only");
must(game.indexOf("const drvIn = car.rev ? inp.brake : inp.throttle;") >= 0, "reverse uses the brake pedal as drive");
must(game.indexOf("const Fbrk = (car.rev ? 0 : inp.brake)") >= 0, "no brake force while reversing");
must(game.indexOf("else if (inp.brake && !inp.throttle && car.speed < 0 && car.speed > -5) car.speed = 0;") >= 0, "old stop-clamp kept for forward gears");
must(game.indexOf("Space brake/reverse") >= 0, "the hint tells you");

/* ---- records + readouts ---- */
must(game.indexOf("function saveLapRecord(") >= 0 && game.indexOf("G.save.bests[k] = { ms: ms, segs:") >= 0, "lap record persisted per circuit + chassis");
must(game.indexOf("G.recordMs = rec ? rec.ms : null;") >= 0, "record shown at heat start");
must(game.indexOf("function expectedAt(") >= 0 && game.indexOf("lapMs - want") >= 0, "live delta uses the record profile");
must(game.indexOf("lapMs / prog - G.bestLap") < 0, "naive lap extrapolation removed");
must(game.indexOf("flashMsg(\"BEST LAP \" + fmt(lapMs), \"good\")") >= 0, "record flash");
must(game.indexOf("flashMsg(\"S\" + (i + 1) + \" \" + fmtSigned(") >= 0, "split delta flash");
must(game.indexOf("const d = (g && seg != null && bs[i] != null) ? \" \" + fmtSigned(seg - bs[i]) : \"\";") >= 0, "sector card split delta");
must(game.indexOf("<span>Lap <b>\" + fmt(elapsed - (G.lapStartMs || 0))") >= 0, "top bar shows the current lap");
must(game.indexOf("<span>Best lap <b>\" + fmt(G.bestLap)") >= 0, "top bar shows your best lap");

/* ---- feedback ---- */
must(game.indexOf("function wrongWayTick(") >= 0 && game.indexOf("WRONG WAY") >= 0, "wrong-way callout");
must(game.indexOf("function flashMsg(") >= 0 && css.indexOf(".count-flash.msg") >= 0, "event flash styling");
must(css.indexOf(".count-flash.good") >= 0 && css.indexOf(".count-flash.bad") >= 0, "good/bad flash tones");

/* ---- body attitude off the physics ---- */
must(game.indexOf("car.gLat = clamp(0.9144 * car.speed * yaw / G0, -2, 2);") >= 0, "lateral g tracked");
must(game.indexOf("car.gLon = clamp(a / G0, -1.8, 1.8);") >= 0, "longitudinal g tracked");
must(rally.indexOf("mesh.rotation.order !== \"YXZ\"") >= 0 && rally.indexOf("(car.gLat || 0) * 0.045") >= 0 &&
  rally.indexOf("(car.gLon || 0) * 0.012") >= 0, "car leans and pitches on the physics");
must(rally.indexOf("stats: function ()") >= 0 && rally.indexOf("pitch: Math.round(carMesh.rotation.x") >= 0, "Rally3D.stats() for future passes");

/* ---- cabinet invariants ---- */
must(/game\.js\?v=\d+/.test(html) && /game\.css\?v=\d+/.test(html) && /rally3d\.js\?v=\d+/.test(html), "cache-busts present");
const floors = { "game.js": 64, "rally3d.js": 31, "game.css": 24 };
Object.keys(floors).forEach(function (n) {
  const m = new RegExp(n.replace(".", "\\.") + "\\?v=(\\d+)").exec(html);
  must(!!m, "cache-bust present for " + n);
  must(Number(m[1]) >= floors[n], "cache-bust current for " + n + " (found v=" + m[1] + ")");
});
const ids = {};
html.replace(/id="([^"]+)"/g, function (m, k) { ids[k] = 1; return m; });
/* sheets and HUD fragments are built in game.js, so count the ids it generates too */
game.replace(/id=["']([A-Za-z0-9_-]+)["']/g, function (m, k) { ids[k] = 1; return m; });
const used = {};
game.replace(/\$\("([^"]+)"\)/g, function (m, k) { used[k] = 1; return m; });
const missing = Object.keys(used).filter(function (k) { return !ids[k]; });
must(missing.length === 0, "every $() id is rendered somewhere (missing: " + missing.join(", ") + ")");
must(game.indexOf("eval(") < 0, "no eval");
must(rally.indexOf("three.min.js") < 0 || html.indexOf("three@0.160.1") >= 0, "pinned three.js");
must(paper.indexOf("Phase 10") >= 0, "whitepaper documents this pass");
must(html.indexOf('id="ghostHead"') >= 0 && game.indexOf('$("ghostHead")') >= 0, "the ghost panel renames itself per mode");
must(html.indexOf('id="boostVeil"') >= 0 && css.indexOf(".boost-veil.on") >= 0 &&
  game.indexOf('veilEl.classList.toggle("on", boostOn && !opt("reduceFx"))') >= 0, "boost veil, respects reduce effects");
must(game.indexOf("G.gates = [false, false, false];") < 0, "gate resets follow the track's sector list");

process.stdout.write("haven-rally QA: " + checks + " checks passed\n");
