/* Campaign integrity check: build all 24 floors headless and prove they are winnable, and that
   the door doctrine holds. Per floor: region size, start reachable, exit reachable, every relic /
   nexus / job on reachable floor (never sealed in stone), a seal floor's exit starting locked,
   nothing the floor NEEDS (the exit, a nexus) behind a door, EVERY door gating a relic with a key
   reachable outside it, and a gauntlet with teeth in it.
   Run: node tools/crypt_campaign_check.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const g = { window: null, Math, console };
g.window = g;
g.globalThis = g;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "campaign.js"), "utf8"), g);
const C = g.LatticeCampaign;
if (!C) throw new Error("no LatticeCampaign");
if (C.LEN !== 24) throw new Error("floor count " + C.LEN);

let id = 0;
const makeFoe = (kind, rank, x, y) => ({ id: ++id, kind, rank, x, y, hp: 1, max: 1, boss: /gate|crown|smith|heartboss|levi|tithe|unnamer|lock|unspool|titheking|nameeater/.test(kind) });
const rollLoot = () => "coin";

const OPEN = new Set(["floor", "pad", "exit", "exit_lock", "door_open"]);
const KEYKIND = new Set(["key", "latch", "triadkey"]);
let totalItems = 0, totalFoes = 0, totalGens = 0, totalOpen = 0, totalDoors = 0, totalGaunt = 0, minOpen = 1;

for (let i = 0; i < C.LEN; i++) {
  const lv = C.build(i, makeFoe, rollLoot);
  const tag = "floor " + (i + 1) + " " + lv.layout;
  if (lv.W !== 120 || lv.H !== 104) throw new Error(tag + ": region " + lv.W + "x" + lv.H);
  const open = (x, y) => lv.tiles[y] && OPEN.has(lv.tiles[y][x]);
  if (!open(lv.start.x, lv.start.y)) throw new Error(tag + ": start not open");
  const exitTile = lv.tiles[lv.exit.y][lv.exit.x];
  if (exitTile !== "exit" && exitTile !== "exit_lock") throw new Error(tag + ": exit tile is " + exitTile);
  if (lv.seal && exitTile !== "exit_lock") throw new Error(tag + ": seal floor exit is not locked");
  if (!lv.seal && exitTile !== "exit") throw new Error(tag + ": unsealed floor exit is locked");

  const key = (x, y) => y * lv.W + x;
  /* Two floods: the way the warden walks it with keys in hand, and with every door shut. */
  function flood(solidDoors) {
    const seen = new Uint8Array(lv.W * lv.H);
    const q = [[lv.start.x, lv.start.y]];
    seen[key(lv.start.x, lv.start.y)] = 1;
    while (q.length) {
      const [x, y] = q.pop();
      [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nx, ny]) => {
        if (nx < 0 || ny < 0 || nx >= lv.W || ny >= lv.H) return;
        if (seen[key(nx, ny)]) return;
        const t = lv.tiles[ny][nx];
        if (t === "wall") return;
        if (!OPEN.has(t) && !(t === "door" && !solidDoors)) return;
        seen[key(nx, ny)] = 1;
        q.push([nx, ny]);
      });
    }
    return seen;
  }
  const seen = flood(false);
  const shut = flood(true);
  if (!seen[key(lv.exit.x, lv.exit.y)]) throw new Error(tag + ": exit is sealed off from the start");
  if (lv.gens.some((n) => !seen[key(n.x, n.y)])) throw new Error(tag + ": a nexus is sealed in stone");
  if (lv.items.some((n) => !seen[key(n.x, n.y)])) throw new Error(tag + ": a relic is sealed in stone");

  /* THE DOOR DOCTRINE: a key may open a vault, never the way forward. */
  if (!shut[key(lv.exit.x, lv.exit.y)]) throw new Error(tag + ": a door stands between the warden and the exit");
  if (lv.gens.some((n) => !shut[key(n.x, n.y)])) throw new Error(tag + ": a nexus sits behind a door — a key could gate the way forward");

  /* Every door must gate a relic, and a key must be reachable without passing it. */
  const keysOpen = lv.items.filter((it) => KEYKIND.has(it.kind) && shut[key(it.x, it.y)]).length;
  if (lv.doors.length && keysOpen < lv.doors.length) {
    throw new Error(tag + ": " + lv.doors.length + " door(s) but only " + keysOpen + " key(s) reachable outside them");
  }
  lv.doors.forEach((d, di) => {
    const t = lv.tiles[d.y][d.x];
    if (t !== "door") throw new Error(tag + ": door " + di + " tile is " + t);
    lv.tiles[d.y][d.x] = "floor";
    const opened = flood(true);
    lv.tiles[d.y][d.x] = "door";
    let behind = 0, prize = 0;
    for (let y = 1; y < lv.H - 1; y++) for (let x = 1; x < lv.W - 1; x++) {
      const idx = y * lv.W + x;
      if (!opened[idx] || shut[idx]) continue;
      behind++;
      if (lv.items.some((it) => it.x === x && it.y === y)) prize++;
    }
    if (behind < 8) throw new Error(tag + ": a door gates " + behind + " tiles — a cupboard, not a vault");
    if (prize < 1) throw new Error(tag + ": a door gates no relic — nothing behind it is worth a key");
  });
  totalDoors += lv.doors.length;

  /* Gauntlets: at least one, wide open, with a nexus in it and a prize down it. */
  if (!lv.gauntlets || !lv.gauntlets.length) throw new Error(tag + ": no gauntlet");
  lv.gauntlets.forEach((gt, gi) => {
    let fl = 0, tot = 0;
    for (let y = Math.max(1, gt.y); y < Math.min(lv.H - 1, gt.y + gt.h); y++) {
      for (let x = Math.max(1, gt.x); x < Math.min(lv.W - 1, gt.x + gt.w); x++) {
        tot++;
        if (lv.tiles[y][x] !== "wall") fl++;
      }
    }
    if (!tot) throw new Error(tag + ": gauntlet " + gi + " is empty");
    if (fl / tot < 0.7) throw new Error(tag + ": gauntlet " + gi + " is only " + Math.round((fl / tot) * 100) + "% open");
    const inG = (n) => n.x >= gt.x && n.x < gt.x + gt.w && n.y >= gt.y && n.y < gt.y + gt.h;
    if (!lv.gens.some((n) => n.gauntlet && inG(n))) throw new Error(tag + ": gauntlet " + gi + " has no nexus in it");
    if (!lv.items.some(inG)) throw new Error(tag + ": gauntlet " + gi + " has no prize in it");
  });
  totalGaunt += lv.gauntlets.length;

  const startDist = lv.items.filter((n) => Math.abs(n.x - lv.start.x) + Math.abs(n.y - lv.start.y) < 2).length;
  if (startDist > 2) throw new Error(tag + ": " + startDist + " relics stacked on the start tile");
  if (lv.items.some((n) => lv.tiles[n.y][n.x] === "pad")) throw new Error(tag + ": a relic sits on a gate pad");
  if (lv.gens.length < 5) throw new Error(tag + ": only " + lv.gens.length + " nexuses on a large floor");
  if (lv.items.length < 26) throw new Error(tag + ": only " + lv.items.length + " relics on a large floor");
  if (lv.foes.length < 15) throw new Error(tag + ": only " + lv.foes.length + " jobs posted");
  /* Openness is design, not decoration: these floors exist so a horde can be fought in the
     open, so a floor that has quietly become mostly wall fails the build. */
  let openN = 0;
  for (let y = 0; y < lv.H; y++) for (let x = 0; x < lv.W; x++) if (lv.tiles[y][x] !== "wall") openN++;
  const openPct = openN / (lv.W * lv.H);
  if (openPct < 0.4) throw new Error(tag + ": only " + Math.round(openPct * 100) + "% of the region is open ground");
  if (openPct < minOpen) minOpen = openPct;
  totalOpen += openPct;
  totalItems += lv.items.length;
  totalFoes += lv.foes.length;
  totalGens += lv.gens.length;
  console.log(
    tag.padEnd(34),
    "act " + (lv.act + 1),
    "relics " + String(lv.items.length).padStart(3),
    "nexus " + String(lv.gens.length).padStart(2),
    "jobs " + String(lv.foes.length).padStart(2),
    "gaunt " + lv.gauntlets.length,
    "doors " + lv.doors.length,
    "keys " + keysOpen,
    "open " + String(Math.round(openPct * 100)).padStart(2) + "%",
    (lv.seal ? "SEAL" : "    "),
    lv.chapterBook
  );
}
console.log("\ncrypt_campaign_check ok", {
  floors: C.LEN,
  region: "120x104",
  open: Math.round((totalOpen / C.LEN) * 100) + "%",
  minOpen: Math.round(minOpen * 100) + "%",
  relics: totalItems,
  nexuses: totalGens,
  jobs: totalFoes,
  gauntlets: totalGaunt,
  doorsKept: totalDoors,
  acts: C.CHAPTERS.length
});
