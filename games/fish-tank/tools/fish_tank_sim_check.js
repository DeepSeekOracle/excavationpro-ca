#!/usr/bin/env node
/* Fish Tank sim check: lifts the balance maths plus the water chemistry, the
   brains and the announcer event table straight out of tank.js and exercises
   them in a stub context, so the curves can be regression tested without a
   browser. Run: node tools/fish_tank_sim_check.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "..", "tank.js"), "utf8");

let fails = 0;
function must(label, cond, extra) {
  if (!cond) {
    fails += 1;
    console.log("FAIL  " + label + (extra == null ? "" : "  (" + extra + ")"));
  } else {
    console.log("ok    " + label);
  }
}

/* --- lift functions and tables out of the IIFE --- */
function grab(name) {
  const head = "function " + name + "(";
  const i = src.indexOf(head);
  if (i < 0) throw new Error("missing function " + name);
  let depth = 0, j = i;
  for (; j < src.length; j += 1) {
    if (src[j] === "{") depth += 1;
    else if (src[j] === "}") {
      depth -= 1;
      if (depth === 0) { j += 1; break; }
    }
  }
  return src.slice(i, j);
}
function grabConst(name, end) {
  const i = src.indexOf("const " + name + " = ");
  if (i < 0) throw new Error("missing const " + name);
  const j = end ? src.indexOf(end, i) : -1;
  return j > 0 ? src.slice(i, j) : src.slice(i, src.indexOf("\n  };", i) + 5);
}

const tables = [
  "const HOUR = 3600000;",
  "const DAY = 24 * HOUR;",
  "const STARVE = 36 * HOUR;",
  "const FISH_CAP = 50;",
  "const HUNTER_CAP = 10;",
  "const STALK_LEAD = 22000;",
  "const STRIKE_WINDOW = 40000;",
  "const HATCH_MS = 20 * 60000;",
  "const EGG_CAP = 6;",
  "const CREW_LIFE = 30 * DAY;",
  grabConst("OX", "\n  const WASTE"),
  grabConst("WASTE", "\n  const"),
  grabConst("STAGES", "\n  const STAGE_DRAW"),
  grabConst("STAGE_DRAW", "\n  const FACE_RIGHT"),
  grabConst("SPECIES", "\n  const VITALS"),
  grabConst("VITALS", "\n  const PREDATORS"),
  grabConst("LIFE_CYCLE", "\n  const PRED_STAT"),
  grabConst("MOTION", "\n  /* Soft obstacles"),
  grabConst("DECOR", "\n  const TEMP_BAND"),
  grabConst("TEMP_BAND", "\n  const BIOS"),
  grabConst("CREW", "\n  const CREW_LIFE"),
  grabConst("THEMES", "\n  const THEME_ART"),
  grabConst("LOG_EVENTS", "\n  function readEvent"),
  grabConst("ANNOUNCE", "\n  const KEEPER_SAY"),
  grabConst("KEEPER_SAY", "\n  let keeperTag"),
  grabConst("FISH_VOICE", "\n  function fishVoice"),
  grabConst("BIOMASS", "\n  const LOAD_BASE"),
  grabConst("DEFENSE", "\n  function defenseOf"),
  "const LOAD_BASE = 56;",
  "const LOAD_PERK = 8;",
  "const LOAD_SANCTUARY = 16;",
  "const EGG_LOAD = 0.5;",
  "const HARD_CAP = 84;",
  grabConst("BREED", "\n  function breedOf"),
  grabConst("DNA_SALT", "\n  const DNA_BANK_CAP"),
  grabConst("DNA_BANK_CAP", "\n  function fnv1a"),
  grabConst("KEEPERS", "\n  const CAST_ORDER"),
  'const CAST_ORDER = ["mara", "ellis", "ren", "june", "mateo", "nia", "mira", "sancora", "lyra", "reed", "calder", "kai"];'
].join("\n");

const helpers = [
  "function specOf(id) { return SPECIES.filter(function (s) { return s.id === id; })[0] || SPECIES[0]; }",
  "function cycleOf(species) { return LIFE_CYCLE[species] || [2, 6, 12, 24, 96, 168]; }",
  "function vitals(f) { return VITALS[f.species] || { hp: 100, regen: 5, hurt: 10, food: 16 }; }",
  "function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }",
  "function RPG() { return !!(state && state.opts && state.opts.mode === 'rpg'); }",
  "function foodWindow(f) { return vitals(f).food * HOUR * (RPG() ? LOOP.rpgFoodScale : 1); }",
  "function foodLeft(f, now) { const hours = vitals(f).food * (hasPerk('meals') ? 1.28 : 1) * (RPG() ? LOOP.rpgFoodScale : 1); return hours * HOUR - (now - (f.lastFed || f.born)); }",
  "function bodyAge(f) { return f.growth || 0; }",
  "function ageOf(f, now) { return Math.max(0, now - f.born); }",
  "function moodOf() { return 'normal'; }",
  "function phase() { return (state.opts && state.opts.clock) === 'night' ? 'night' : 'day'; }",
  "function themeOf(id) { return THEMES[id] || THEMES.river; }",
  "function decorOf() { return DECOR[themeOf(state.theme).id] || DECOR.river; }",
  "function crewOf(id) { return CREW.filter(function (c) { return c.id === id; })[0]; }",
  "let _perks = [];",
  "function hasPerk(id) { return _perks.indexOf(id) >= 0; }",
  "let simDt = 0.016;",
  "let frameId = 0;",
  "let anchorCache = { frame: -1, by: {} };",
  "const BOND_KEEP = 8;",
  "const AR = 1.7;",
  grab("stageName"),
  grab("stageSpeed"),
  grab("traits"),
  grab("makeTraits"),
  grab("motionOf"),
  grab("bandOf"),
  grab("temperOf"),
  grab("socialOf"),
  grab("crowdLoad"),
  grab("biomassOf"),
  grab("loadCap"),
  grab("fishLoad"),
  grab("canAdd"),
  grab("loadRatio"),
  grab("breedOf"),
  grab("breedReady"),
  grab("stratNow"),
  grab("tempAt"),
  grab("rhythm"),
  grab("comfort"),
  grab("tempNote"),
  grab("mixScale"),
  grab("speedOf"),
  grab("huntChance"),
  grab("weakestPrey"),
  grab("preyScore"),
  grab("defenseOf"),
  grab("dval"),
  grab("schoolMates"),
  grab("schoolSafety"),
  grab("bandSteer"),
  grab("wallSteer"),
  grab("decorSteer"),
  grab("nearestShelter"),
  grab("simWater"),
  grab("shed"),
  grab("isFull"),
  grabConst("LOOP", "\n  const KEEPERS"),
  grabConst("CLEAN_SPECIES", "\n  /* ---- one beat"),

  grab("tickHealth"),
  grab("unitDir"),
  grab("depthOf"),
  grab("span3"),
  grab("apart"),
  grab("hashId"),
  grab("bond"),
  grab("pruneBonds"),
  grab("bondPick"),
  grab("mem"),
  grab("hidingSpot"),
  grab("wary"),
  grab("anchorOf"),
  grab("isAnchor"),
  grab("slotFor"),
  grab("schoolSpread"),
  grab("homeOf"),
  grab("territorySteer"),
  grab("crewSteer"),
  grab("readEvent"),
  "function uid() { return 'z' + Math.random().toString(36).slice(2, 8); }",
  grab("fnv1a"),
  grab("dnaCode"),
  grab("traitCode"),
  grab("genomeOf"),
  grab("dnaFor"),
  grab("dnaSalt"),
  grab("isDna"),
  grab("bankFish"),
  grab("geneTraits"),
  grab("giveDna"),
  grab("verifyDna"),
  grab("lineageOf")
].join("\n");

const probe = `({
  OX: OX, WASTE: WASTE, MOTION: MOTION, DECOR: DECOR, TEMP_BAND: TEMP_BAND, SPECIES: SPECIES, VITALS: VITALS,
  THEMES: THEMES, CREW: CREW, LOG_EVENTS: LOG_EVENTS, ANNOUNCE: ANNOUNCE, KEEPER_SAY: KEEPER_SAY,
  clamp: clamp, comfort: comfort, tempNote: tempNote, tempAt: tempAt, stratNow: stratNow, crowdLoad: crowdLoad,
  BIOMASS: BIOMASS, BREED: BREED, biomassOf: biomassOf, loadCap: loadCap, fishLoad: fishLoad,
  canAdd: canAdd, loadRatio: loadRatio, breedOf: breedOf, breedReady: breedReady, HARD_CAP: HARD_CAP,
  rhythm: rhythm, speedOf: speedOf, huntChance: huntChance, weakestPrey: weakestPrey, preyScore: preyScore, DEFENSE: DEFENSE,
  defenseOf: defenseOf, dval: dval, schoolMates: schoolMates, schoolSafety: schoolSafety, cycleOf: cycleOf,
  bandSteer: bandSteer, wallSteer: wallSteer, decorSteer: decorSteer, nearestShelter: nearestShelter,
  simWater: simWater, tickHealth: tickHealth, makeTraits: makeTraits, bandOf: bandOf, motionOf: motionOf,
  bond: bond, bondPick: bondPick, pruneBonds: pruneBonds, mem: mem, hidingSpot: hidingSpot, wary: wary,
  anchorOf: anchorOf, isAnchor: isAnchor, slotFor: slotFor, schoolSpread: schoolSpread, homeOf: homeOf,
  territorySteer: territorySteer, crewSteer: crewSteer, readEvent: readEvent, foodLeft: foodLeft, foodWindow: foodWindow, RPG: RPG,
  dnaFor: dnaFor, genomeOf: genomeOf, traitCode: traitCode, isDna: isDna, dnaSalt: dnaSalt,
  giveDna: giveDna, geneTraits: geneTraits, verifyDna: verifyDna, lineageOf: lineageOf, bankFish: bankFish, DNA_BANK_CAP: DNA_BANK_CAP,
  BOND_KEEP: BOND_KEEP, FISH_VOICE: FISH_VOICE, KEEPERS: KEEPERS, CAST_ORDER: CAST_ORDER, state: state, setPerks: function (list) { _perks = list; }, bumpFrame: function () { frameId += 1; } })`;

const sandbox = {
  console, Date, Math, window: { ArcadeLedger: null },
  state: {
    temp: 25, theme: "river", quality: 86, algae: 8, oxygen: 92, waste: 10, mode: "standard",
    crew: [], fish: [], waterAt: Date.now(), opts: { heater: true, temp: 25, clock: "day" },
    eggs: [], points: 0, log: [], trend: null
  }
};
vm.createContext(sandbox);
let api;
try {
  api = vm.runInContext(tables + "\n" + helpers + "\n;" + probe, sandbox);
} catch (e) {
  console.log("FAIL  the lifted maths compiles: " + e.message);
  process.exit(1);
}
must("the lifted maths compiles", true);

const now = Date.now();
function mkFish(species, hoursOld, hp) {
  const v = api.VITALS[species] || { hp: 100, food: 16 };
  return {
    id: species + "-" + Math.random().toString(36).slice(2, 6),
    species: species, hp: hp == null ? v.hp : hp, lastFed: now - 0.1 * 3600000,
    born: now - hoursOld * 3600000, growth: hoursOld * 3600000, traits: api.makeTraits(),
    x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, state: "cruise"
  };
}

/* ---- temperature is a gradient ---- */
api.state.temp = 25;
must("tempAt with no depth is the tank number", api.tempAt(null) === 25);
must("the surface is warmer than the sand", api.tempAt(0.12) > api.tempAt(0.88));
must("the gradient stays inside a couple of degrees", api.tempAt(0.12) - api.tempAt(0.88) < 2.6);
must("tempAt is monotone top to bottom", api.tempAt(0.15) > api.tempAt(0.45) && api.tempAt(0.45) > api.tempAt(0.85));
api.state.opts.heater = false;
must("a cold room flattens the gradient", api.tempAt(0.12) - api.tempAt(0.88) < 1.6);
api.state.opts.heater = true;

/* ---- comfort reads the water the fish is actually in ---- */
const mossTop = mkFish("moss", 30); mossTop.y = 0.2;
const mossFloor = mkFish("moss", 30); mossFloor.y = 0.86;
api.state.temp = 26.4;
must("a cold-water fish feels the warm surface more than the sand", api.comfort(mossTop) > api.comfort(mossFloor));

/* ---- crowding is a slope ---- */
api.state.fish = [];
must("an empty tank has no crowd load", api.crowdLoad() === 0);
api.state.fish = new Array(30).fill(0).map(function () { return mkFish("ruby", 30); });
must("thirty mid-size fish is a bit over half the glass", Math.abs(api.crowdLoad() - 0.54) < 0.04,
  "load " + api.fishLoad() + " of " + api.loadCap());
must("a school of small fish is easier on the water than the same count of giants", (function () {
  api.state.fish = new Array(30).fill(0).map(function () { return mkFish("glimmer", 30); });
  const school = api.crowdLoad();
  api.state.fish = new Array(30).fill(0).map(function () { return mkFish("octo", 30); });
  return school < api.crowdLoad() - 0.2;
})(), "glimmers " + api.crowdLoad());
must("small schoolers are the cheap ones", api.biomassOf("glimmer") < api.biomassOf("ruby") &&
  api.biomassOf("ruby") < api.biomassOf("octo"));
must("the glass refuses a giant with no room left", (function () {
  api.state.fish = new Array(26).fill(0).map(function () { return mkFish("octo", 30); });
  return api.canAdd("tusk") === false;
})());
must("and still takes a schooler in the same water", (function () {
  api.state.fish = new Array(78).fill(0).map(function () { return mkFish("glimmer", 30); });
  return api.canAdd("glimmer") === true && api.canAdd("octo") === false;
})(), "load " + api.fishLoad() + " of " + api.loadCap());
must("the roomy-glass perk buys more room", (function () {
  api.state.fish = [];
  const before = api.loadCap();
  api.setPerks(["crowd"]);
  const after = api.loadCap();
  api.setPerks([]);
  return after > before;
})());
api.state.fish = [];

/* ---- breeding: each species on its own clock ---- */
must("every species that breeds carries a cadence, a clutch and a water bar",
  Object.keys(api.BREED).every(function (id) {
    const b = api.BREED[id];
    if (!b) return true;
    return b.cd > 0 && b.min > 0 && b.eggs[1] >= b.eggs[0] && b.roll > 0 && b.roll <= 1 && !!b.mature;
  }));
must("the fast schoolers come round sooner than the slow ones",
  api.BREED.glimmer.cd < api.BREED.sunscale.cd && api.BREED.dart.cd < api.BREED.tusk.cd &&
  api.BREED.glimmer.cd < api.BREED.claw.cd);
must("the slow breeders are the consistent ones",
  api.BREED.sunscale.roll > api.BREED.glimmer.roll && api.BREED.claw.roll >= api.BREED.dart.roll);
must("the fast schoolers lay bigger clutches", api.BREED.glimmer.eggs[1] >= api.BREED.tusk.eggs[1]);
must("the slow ones insist on better water", api.BREED.claw.min > api.BREED.glimmer.min);
must("the octopus and the seadragon do not breed in the glass", api.BREED.octo == null && api.BREED.dragon == null);
must("every species in the tank has a breeding answer", api.SPECIES.every(function (sp) {
  return Object.prototype.hasOwnProperty.call(api.BREED, sp.id);
}), "missing: " + api.SPECIES.filter(function (sp) {
  return !Object.prototype.hasOwnProperty.call(api.BREED, sp.id);
}).map(function (sp) { return sp.id; }).join(","));
must("a slow breeder waits for the elder stage", api.breedReady("adult", api.BREED.sunscale) === false ||
  api.breedReady("elder", api.BREED.sunscale) === true);

/* ---- oxygen: a balanced tank holds, a crowded one falls ---- */

/* ---- oxygen: a balanced tank holds, a crowded one falls ---- */
function runWater(fishN, spanHours, crew, species) {
  const sp = species || "ruby";
  api.state.fish = new Array(fishN).fill(0).map(function () { return mkFish(sp, 30); });
  api.state.crew = (crew || []).map(function (role) { return { role: role }; });
  api.state.algae = 10; api.state.waste = 10; api.state.oxygen = 92; api.state.quality = 86;
  for (let h = 0; h < spanHours; h += 1) {
    api.state.waterAt = now + h * 3600000 - 3600000;
    api.simWater(now + h * 3600000);
  }
  return api.state.oxygen;
}
const ox12 = runWater(12, 6);
must("a balanced tank holds its oxygen", ox12 > api.OX.thin, Math.round(ox12));
const ox30 = runWater(60, 6);
must("a crowded tank loses it", ox30 < ox12 - 10, Math.round(ox30));
must("gasping comes before thin water", api.OX.gasp < api.OX.thin);
const oxEmpty = runWater(0, 3);
must("an empty planted tank climbs back", oxEmpty > 95, Math.round(oxEmpty));
api.state.fish = new Array(30).fill(0).map(function () { return mkFish("ruby", 30); });
api.state.crew = [];
api.state.waste = 60; api.state.oxygen = 40;
api.state.waterAt = now - 3600000;
api.simWater(now);
must("waste spends oxygen too", api.state.oxygen < 40);

/* ---- waste: fish and meals leave it, corys lift it ---- */
api.state.fish = new Array(12).fill(0).map(function () { return mkFish("ruby", 30); });
api.state.crew = []; api.state.waste = 10; api.state.algae = 5; api.state.waterAt = now - 3600000;
api.simWater(now);
const wasteDirty = api.state.waste;
api.state.waste = 10; api.state.crew = [{ role: "cory" }, { role: "cory" }];
api.state.waterAt = now - 3600000;
api.simWater(now);
must("corys lift the waste", api.state.waste < wasteDirty, api.state.waste.toFixed(1) + " vs " + wasteDirty.toFixed(1));

/* ---- algae: it blooms, and grazers hold it ---- */
api.state.fish = new Array(10).fill(0).map(function () { return mkFish("ruby", 30); });
api.state.crew = []; api.state.algae = 20; api.state.waterAt = now - 3600000;
api.simWater(now);
must("green grows while nobody grazes", api.state.algae > 20, api.state.algae.toFixed(1));
api.state.algae = 20; api.state.crew = [{ role: "snail" }, { role: "snail" }, { role: "snail" }];
api.state.waterAt = now - 3600000;
api.simWater(now);
must("three snails turn it around", api.state.algae < 20, api.state.algae.toFixed(1));
api.state.crew = [];
api.state.algae = 96; api.state.waterAt = now - 6 * 3600000;
api.simWater(now);
must("algae never exceeds a hundred", api.state.algae <= 100);

/* ---- health: thin water hurts, clean water heals ---- */
api.state.fish = [mkFish("ruby", 30, 100)];
api.state.oxygen = 90; api.state.waste = 5; api.state.algae = 5; api.state.quality = 90;
api.state.fish[0].hpAt = now - 3600000;
api.tickHealth(api.state.fish[0], now);
must("clean water heals a fish", api.state.fish[0].hp > 100);
api.state.fish[0].hp = 100; api.state.fish[0].hpAt = now - 3600000;
api.state.oxygen = 40;
api.tickHealth(api.state.fish[0], now);
must("thin water drains one", api.state.fish[0].hp < 100, api.state.fish[0].hp.toFixed(1));
api.state.fish[0].hp = 100; api.state.fish[0].hpAt = now - 3600000;
api.state.oxygen = 90;
api.tickHealth(api.state.fish[0], now);
must("and it heals again once the air is back", api.state.fish[0].hp > 100);
api.state.fish[0].hp = 100; api.state.fish[0].hpAt = now - 3600000;
api.state.fish = new Array(60).fill(0).map(function () { return mkFish("ruby", 30, 100); });
api.state.fish[0].hpAt = now - 3600000;
api.state.oxygen = 90; api.state.quality = 90; api.state.algae = 5;
api.tickHealth(api.state.fish[0], now);
must("a glass past its load drains the ones already tight", api.state.fish[0].hp < 100,
  "load " + api.fishLoad() + "/" + api.loadCap() + ", hp " + api.state.fish[0].hp.toFixed(1));
must("but the same headcount of small schoolers is not crowded at all", (function () {
  api.state.fish = new Array(60).fill(0).map(function () { return mkFish("glimmer", 30, 100); });
  api.state.fish[0].hp = 100; api.state.fish[0].hpAt = now - 3600000;
  api.state.oxygen = 92; api.state.quality = 92; api.state.algae = 5;
  api.tickHealth(api.state.fish[0], now);
  return api.state.fish[0].hp >= 100;
})(), "load " + api.fishLoad() + "/" + api.loadCap());

/* ---- bonds: they build near, decay apart, and stay small in the save ---- */
const a = mkFish("glimmer", 30), b = mkFish("glimmer", 30);
for (let i = 0; i < 400; i += 1) api.bond(a, b, 0.06 * 0.016);
must("swimming together builds a bond", (a.bonds[b.id] || 0) > 0.2, (a.bonds[b.id] || 0).toFixed(3));
const held = a.bonds[b.id];
for (let i = 0; i < 400; i += 1) api.bond(a, b, -0.012 * 0.016);
must("time apart wears it down", a.bonds[b.id] < held);
const c = mkFish("ruby", 30), d = mkFish("dart", 30);
api.state.fish = [a, b, c, d];
must("the strongest companion is the one it keeps", api.bondPick(a, 1, 0.05).f.id === b.id);
a.bonds[c.id] = -0.4; a.bonds[d.id] = -0.5;
must("and it remembers who to avoid", api.bondPick(a, -1, 0.2).f.id === d.id);
for (let i = 0; i < 20; i += 1) { const x = mkFish("dart", 30); a.bonds[x.id] = 0.1 + i * 0.01; }
api.pruneBonds(a);
must("the save keeps a handful of bonds, not a list", Object.keys(a.bonds).length <= api.BOND_KEEP, Object.keys(a.bonds).length);

/* ---- the school elects a leader and the rest take slots ---- */
const lead = mkFish("glimmer", 40), f1 = mkFish("glimmer", 20), f2 = mkFish("glimmer", 20);
lead.traits = { bold: 0.7, social: 0.95, appetite: 0.5, vigor: 0.5 };
f1.traits = { bold: 0.3, social: 0.3, appetite: 0.5, vigor: 0.5 };
f2.traits = { bold: 0.3, social: 0.3, appetite: 0.5, vigor: 0.5 };
api.state.fish = [lead, f1, f2];
api.bumpFrame();
must("the most social fish leads the school", api.anchorOf("glimmer") === lead);
must("and it knows it", api.isAnchor(lead) === true && api.isAnchor(f1) === false);
api.state.fish = [f1, f2];
api.bumpFrame();
must("when the leader dies the school elects another", api.anchorOf("glimmer") === f1 || api.anchorOf("glimmer") === f2);
const slot = api.slotFor(f1, lead);
must("a follower keeps a slot near the leader", Math.hypot(slot.x - lead.x, (slot.y - lead.y) * 1.7) < 0.3);
api.state.fish = [lead, f1, f2];
api.bumpFrame();
f1.x = 0.62; f1.y = 0.55; f2.x = 0.40; f2.y = 0.44;
must("spread is measured inside the school", api.schoolSpread(lead) > 0.1, api.schoolSpread(lead).toFixed(2));

/* ---- territory: a loner has a patch and holds it ---- */
const loner = mkFish("azure", 40);
api.state.fish = [loner];
loner.x = 0.9; loner.y = 0.6;
const home = api.homeOf(loner);
must("every fish gets a home patch", home && home.x > 0.1 && home.x < 0.9 && home.y > 0.1 && home.y < 0.9);
must("the patch is stable once set", api.homeOf(loner) === home);
const outT = { x: 0, y: 0 };
api.territorySteer(loner, outT);
must("and pulls back toward it", Math.sign(outT.x) === Math.sign(home.x - loner.x) || Math.abs(home.x - loner.x) < 0.26, outT.x.toFixed(2));
const mate = mkFish("azure", 40);
loner.home = { x: 0.80, y: 0.50 };
mate.home = { x: 0.20, y: 0.20 };
loner.x = 0.80; loner.y = 0.50;
mate.x = 0.83; mate.y = 0.51;
api.state.fish = [loner, mate];
api.bumpFrame();
outT.x = 0; outT.y = 0;
api.territorySteer(loner, outT);
must("an intruder of its own kind gets pushed off", Math.hypot(outT.x, outT.y) > 0.05, Math.hypot(outT.x, outT.y).toFixed(3));

/* ---- cleaners are neighbours ---- */
const near = mkFish("glimmer", 30);
api.state.fish = [near];
near.x = 0.5; near.y = 0.45;
api.state.crew = [{ role: "jelly", x: 0.52, y: 0.45 }];
const outJ = { x: 0, y: 0 };
api.crewSteer(near, outJ);
must("a fish gives a jelly room", outJ.x < 0, outJ.x.toFixed(3));
const bottom = mkFish("moss", 30);
bottom.y = 0.8; bottom.x = 0.6; bottom.lastFed = now - 30 * 3600000;
api.state.fish = [bottom];
api.state.crew = [{ role: "cory", x: 0.7, y: 0.8 }];
const outC = { x: 0, y: 0 };
api.crewSteer(bottom, outC);
must("a hungry bottom feeder follows the cory", outC.x > 0, outC.x.toFixed(3));

/* ---- memory ---- */
const scared = mkFish("dart", 30);
api.mem(scared).chasedAt = now;
must("a fish that was chased is wary", api.wary(scared, now) === true);
api.mem(scared).hidSpot = { x: 0.2, y: 0.5 };
api.mem(scared).hidAt = now;
must("and it knows where it hid", api.hidingSpot(scared) !== null);
api.mem(scared).hidAt = now - 300000;
must("old hiding places are forgotten", api.hidingSpot(scared) === null);
const fed = mkFish("ruby", 30);
api.mem(fed).ateAt = now;
must("a meal is remembered", api.mem(fed).ateAt === now);

/* ---- the announcer reads the event stream ---- */
const keys = {};
api.LOG_EVENTS.forEach(function (e) { keys[e.key] = 1; });
const missing = [];
Object.keys(keys).forEach(function (k) { if (!api.ANNOUNCE[k] || !api.ANNOUNCE[k].lines || !api.ANNOUNCE[k].lines.length) missing.push(k); });
must("every event the game logs has something to say", missing.length === 0, missing.join(","));
must("events carry a priority and a tag", Object.keys(api.ANNOUNCE).every(function (k) {
  const ev = api.ANNOUNCE[k];
  return !!ev.tag && typeof ev.pri === "number";
}));
const TOPICS = ["night", "day", "dawn", "dusk", "variety", "mono", "full", "few", "crew", "eggs", "calm"];
const badVoice = [];
Object.keys(api.KEEPER_SAY).forEach(function (who) {
  if (!api.KEEPERS[who]) badVoice.push(who);
  Object.keys(api.KEEPER_SAY[who]).forEach(function (k) {
    if (!api.ANNOUNCE[k] && TOPICS.indexOf(k) < 0) badVoice.push(who + "." + k);
  });
});
must("every keeper voice belongs to a real keeper and a real event or topic", badVoice.length === 0, badVoice.join(","));

/* ---- the cast: twelve keepers, six of them static art from the lattice ---- */
const castIds = Object.keys(api.KEEPERS);
must("there are twelve keepers", castIds.length === 12 && api.CAST_ORDER.length === 12, castIds.length);
must("the six hand-drawn keepers are still here", ["mara", "ellis", "ren", "june", "mateo", "nia"].every(function (id) { return !!api.KEEPERS[id]; }));
must("six keepers come from the lattice cast", castIds.filter(function (id) { return api.KEEPERS[id].cast === "lattice"; }).length === 6,
  castIds.filter(function (id) { return api.KEEPERS[id].cast === "lattice"; }).join(","));
must("the lattice six are the golf cast", ["mira", "sancora", "lyra", "reed", "calder", "kai"].every(function (id) {
  return api.KEEPERS[id] && api.KEEPERS[id].cast === "lattice";
}));
must("Calder Voss is Justin here, and not a copy of anyone else", api.KEEPERS.calder.name === "Justin" && api.KEEPERS.calder.tag === "Steward");
must("static art still gets the bubble and the voice, only the picture holds still",
  castIds.filter(function (id) { const k = api.KEEPERS[id]; return k.cast === "lattice" && k.talk === false && k.ext === "jpg"; }).length === 6);
must("every keeper has a voice to speak with", castIds.every(function (id) {
  return api.KEEPERS[id].pitch > 0.5 && api.KEEPERS[id].rate > 0.5 && typeof api.KEEPERS[id].bio === "string" && api.KEEPERS[id].bio.length > 40;
}));
must("every keeper has their own idle chatter", castIds.every(function (id) {
  return api.KEEPERS[id].idle && api.KEEPERS[id].idle.length >= 3;
}));
must("every keeper has topic lines of their own", castIds.every(function (id) {
  const l = api.KEEPERS[id].lines;
  return l && Object.keys(l).length >= 4;
}));
must("every keeper's topics are real topics", (function () {
  const ok = ["night", "day", "dawn", "dusk", "variety", "mono", "full", "few", "crew", "eggs", "calm"];
  return castIds.every(function (id) {
    return Object.keys(api.KEEPERS[id].lines).every(function (k) { return ok.indexOf(k) >= 0; });
  });
})());
must("every keeper reacts to events in their own words", castIds.every(function (id) {
  const v = api.KEEPER_SAY[id];
  return v && Object.keys(v).length >= 3;
}));
must("no keeper has a line for an event that does not exist", (function () {
  const bad = [];
  Object.keys(api.KEEPER_SAY).forEach(function (who) {
    Object.keys(api.KEEPER_SAY[who]).forEach(function (k) {
      if (!api.ANNOUNCE[k] && TOPICS.indexOf(k) < 0) bad.push(who + "." + k);
    });
  });
  return bad.length === 0;
})());
must("every keeper can talk about a single fish too", castIds.every(function (id) {
  const v = api.FISH_VOICE[id];
  return v && v.fine && v.watch && v.thin;
}));

must("the cast has a lot to say", (function () {
  let n = 0;
  castIds.forEach(function (id) {
    const k = api.KEEPERS[id];
    n += k.idle.length;
    Object.keys(k.lines).forEach(function (top) { n += k.lines[top].length; });
    const v = api.KEEPER_SAY[id] || {};
    Object.keys(v).forEach(function (ev) { n += v[ev].length; });
  });
  return n;
})() >= 260, (function () {
  let n = 0;
  castIds.forEach(function (id) {
    const k = api.KEEPERS[id];
    n += k.idle.length;
    Object.keys(k.lines).forEach(function (top) { n += k.lines[top].length; });
    const v = api.KEEPER_SAY[id] || {};
    Object.keys(v).forEach(function (ev) { n += v[ev].length; });
  });
  return n;
})());

/* the lines the game actually writes must all be caught by the event table */
const LINES = [
  ["Spike is eaten.", "death", "Spike"],
  ["Nemo dies unfed after 22 hours.", "death", "Nemo"],
  ["Bubbles dies in a dirty tank after 40 hours.", "death", "Bubbles"],
  ["Koiton rests of old age after 320 hours.", "death", "Koiton"],
  ["Reed rolls 44 against 27% and eats Fan. It has one more hour.", "bite", "Fan"],
  ["Reed rolls 61 against 27% and misses Fan at the last moment.", "dodge", "Fan"],
  ["Reed turns toward Fan, the weakest. The shoal scatters.", "stalk", "Fan"],
  ["Boss Sable enters. One hunter a tank hour. A full fish is 25%.", "hunt", ""],
  ["Eight throws a cloud of black ink.", "ink", "Eight"],
  ["Disc and Stripe turn slow circles. Ruby eggs are coming.", "court", "Disc"],
  ["Disc and Disc Two leave 2 Ruby eggs on the rockwork.", "egg", "Disc"],
  ["A fry hatches by the rockwork: Ruby 2, generation 2, from Disc and Disc Two. +12", "birth", "Ruby 2"],
  ["First time — One fish grows to adult. +20 pts.", "first", ""],
  ["You change a third of the water. Algae drops. The glass clears.", "water", ""],
  ["Fan joins. A baby.", "buy", "Fan"],
  ["Nerite starts work.", "crew", "Nerite"],
  ["Reed slips into the far water.", "leave", "Reed"],
  ["A man's hand reaches over the glass.", "feed", ""],
  ["The glass was empty. A fry drifted in so the tank can go on.", "empty", ""],
  ["Volt cracks the water. 4 fish jolt.", "shock", "Volt"],
  ["Greymaw becomes JAWS. It is larger, it stalks, and an eat hour can take two fish.", "jaws", ""],
  ["Reed is grown. It hunts on the next tank hour.", "grow", "Reed"],
  ["Nerite finishes a month of work.", "retire", "Nerite"]
];
const unmatched = [];
LINES.forEach(function (row) {
  const hit = api.LOG_EVENTS.filter(function (e) { return e.re.test(row[0]); });
  if (!hit.length) { unmatched.push(row[0]); return; }
  if (row[1] && hit[0].key !== row[1]) unmatched.push(row[0] + " -> " + hit[0].key);
  const m = hit[0].re.exec(row[0]);
  const vars = m ? (hit[0].pick ? hit[0].pick(m) : { name: m[1] }) : {};
  if (row[2] && vars.name !== row[2]) unmatched.push(row[0] + " names " + vars.name);
});
must("the announcer catches every real log line", unmatched.length === 0, unmatched.join(" | "));

/* ---- the rules the title still promises ---- */
must("a full fed fish is the baseline bite, less its own armour", (function () {
  const full = mkFish("ruby", 30);
  full.lastFed = now;
  full.x = 0.5; full.y = 0.5;
  api.state.fish = [full];
  const bare = 0.25 - api.dval("ruby", "armor") * 0.12;
  return Math.abs(api.huntChance(full, now) - bare) < 1e-9;
})(), "ruby alone: " + api.huntChance(mkFish("ruby", 30), now).toFixed(3));
must("the bite still caps at 85%", (function () {
  const f = mkFish("ruby", 30, api.VITALS.ruby.hp * 0.1);
  f.lastFed = now - 40 * 3600000;
  return api.huntChance(f, now) <= 0.85 + 1e-9;
})());
must("a hunted fish can still find cover", !!api.nearestShelter(0.07, 0.42, 1.7));
must("speed still orders burst over cruise over rest", (function () {
  const f = mkFish("dart", 30);
  return api.speedOf(f, now, "burst") > api.speedOf(f, now, "cruise") && api.speedOf(f, now, "cruise") > api.speedOf(f, now, "rest");
})());
must("every species has a temperature band and a motion profile", Object.keys(api.VITALS).every(function (id) {
  return !!api.TEMP_BAND[id] && !!api.MOTION[id];
}));
must("every theme has plants that make oxygen", Object.keys(api.THEMES).every(function (id) { return api.OX.plant[id] > 0; }));

/* ---- a day in the life: does the water hold for 24 tank hours? ---- */
function dayRun(fishN, hours, crew, waterChangeAt, species) {
  const sp = species || "ruby";
  api.state.fish = new Array(fishN).fill(0).map(function () { return mkFish(sp, 30, 100); });
  api.state.crew = (crew || []).map(function (role) { return { role: role }; });
  api.state.theme = "river";
  api.state.algae = 12; api.state.waste = 12; api.state.oxygen = 92; api.state.quality = 88;
  api.state.opts.clock = "day";
  const t0 = now;
  const rows = [];
  for (let h = 1; h <= hours; h += 1) {
    api.state.waterAt = t0 + (h - 1) * 3600000;
    if (waterChangeAt && h === waterChangeAt) {
      api.state.oxygen = api.clamp(api.state.oxygen + 18, 0, 100);
      api.state.waste = api.clamp(api.state.waste - 30, 0, 100);
      api.state.algae = api.clamp(api.state.algae - 28, 0, 100);
      api.state.quality = api.clamp(api.state.quality + 24, 0, 100);
    }
    api.simWater(t0 + h * 3600000);
    rows.push({ h: h, oxy: +api.state.oxygen.toFixed(1), waste: +api.state.waste.toFixed(1),
      algae: +api.state.algae.toFixed(1), quality: +api.state.quality.toFixed(1) });
  }
  return rows;
}
const mild = dayRun(12, 24, [{ role: "snail" }, { role: "cory" }]);
const last = mild[mild.length - 1];
must("a neglected twelve fish tank keeps its air but not its water",
  last.oxy > api.OX.thin && last.waste < 60 && last.quality < 25,
  "end of day untouched: oxy " + last.oxy + ", waste " + last.waste + ", algae " + last.algae + ", quality " + last.quality);
must("and the day shows on the gauges, not just at the end", mild[5].oxy < 95 && mild[0].quality > 55,
  "hour 6: oxy " + mild[5].oxy + ", quality " + mild[0].quality + " - hour 24: oxy " + last.oxy + ", quality " + last.quality);
const keptEvery = (function () {
  api.state.trend = null;
  return dayRun(12, 24, [{ role: "snail" }, { role: "cory" }, { role: "otto" }], 6);
})();
const keptEnd = keptEvery[keptEvery.length - 1];
must("a kept tank holds its quality for a day", keptEnd.quality > 25 && keptEnd.oxy > 85 && keptEnd.waste < 30,
  "end of day with a change at hour 6: oxy " + keptEnd.oxy + ", waste " + keptEnd.waste + ", quality " + keptEnd.quality);
const crowdDay = dayRun(60, 24, []);
const crow = crowdDay[crowdDay.length - 1];
must("a crowded tank goes thin inside a day", crow.oxy < api.OX.thin,
  "sixty fish end of day: oxy " + crow.oxy + ", quality " + crow.quality + ", load " + api.fishLoad() + "/" + api.loadCap());
must("and a light tank does not just sit on the ceiling", mild[mild.length - 1].oxy < 100,
  "twelve fish end of day: oxy " + mild[mild.length - 1].oxy);
console.log("      twelve fish, 24h, untouched:  " + JSON.stringify(mild.filter(function (r) { return r.h % 6 === 0; })));
console.log("      twelve fish, 24h, water at 6: " + JSON.stringify(keptEvery.filter(function (r) { return r.h % 6 === 0; })));
console.log("      thirty fish, 24h, untouched:  " + JSON.stringify(crowdDay.filter(function (r) { return r.h % 6 === 0; })));

/* ---- DNA: unique, deterministic, inherited, tamper evident ---- */
const nowD = Date.now();
const mkGenome = function (species, gen, sex, t, parents, born, salt) {
  return api.dnaFor(species, gen, sex, t, parents, born, salt);
};
const t4 = function (b, s, a, v) { return { bold: b, social: s, appetite: a, vigor: v }; };
must("the same genome always hashes the same", mkGenome("glimmer", 1, "f", t4(0.5, 0.5, 0.5, 0.5), [], 1000, "aa") ===
  mkGenome("glimmer", 1, "f", t4(0.5, 0.5, 0.5, 0.5), [], 1000, "aa"));
must("a different salt is a different fish", mkGenome("glimmer", 1, "f", t4(0.5, 0.5, 0.5, 0.5), [], 1000, "aa") !==
  mkGenome("glimmer", 1, "f", t4(0.5, 0.5, 0.5, 0.5), [], 1000, "ab"));
must("one trait point changes the hash", mkGenome("glimmer", 1, "f", t4(0.5, 0.5, 0.5, 0.5), [], 1000, "aa") !==
  mkGenome("glimmer", 1, "f", t4(0.5, 0.5, 0.5, 0.56), [], 1000, "aa"));
must("changing a parent's hash changes the child", mkGenome("glimmer", 2, "m", t4(0.4, 0.4, 0.4, 0.4), ["LG1-GLIM-AAAA11112222"], 2000, "cc") !==
  mkGenome("glimmer", 2, "m", t4(0.4, 0.4, 0.4, 0.4), ["LG1-GLIM-AAAA11113333"], 2000, "cc"));
const hashes = {};
let dupes = 0, badFormat = 0;
for (let i = 0; i < 500; i += 1) {
  const h = mkGenome("dart", 1 + (i % 3), i % 2 ? "f" : "m",
    t4(Math.random(), Math.random(), Math.random(), Math.random()), [], 1000 + i, api.dnaSalt());
  if (hashes[h]) dupes += 1;
  hashes[h] = 1;
  if (!/^LG1-[A-Z0-9]{4}-[0-9A-F]{12}$/.test(h)) badFormat += 1;
}
must("five hundred fish, no collisions", dupes === 0, dupes + " duplicates");
must("every hash is the documented shape", badFormat === 0, badFormat + " malformed");
const founders = [0, 1].map(function (i) {
  const t = t4(0.5 + i * 0.1, 0.4, 0.6, 0.5);
  return { species: "glimmer", gen: 1, sex: i ? "f" : "m", traits: t, parents: [], genes: { born: 5000 + i, salt: "s" + i }, name: "F" + i };
});
founders.forEach(function (f) { f.dna = mkGenome(f.species, f.gen, f.sex, f.traits, f.parents, f.genes.born, f.genes.salt); });
const child = { species: "glimmer", gen: 2, sex: "m", traits: t4(0.5, 0.4, 0.6, 0.52), parents: [founders[0].dna, founders[1].dna], genes: { born: 9000, salt: "kid" }, name: "Kid" };
child.dna = mkGenome(child.species, child.gen, child.sex, child.traits, child.parents, child.genes.born, child.genes.salt);
const grand = { species: "glimmer", gen: 3, sex: "f", traits: t4(0.45, 0.42, 0.6, 0.51), parents: [child.dna, founders[1].dna], genes: { born: 12000, salt: "gkid" }, name: "Grand" };
grand.dna = mkGenome(grand.species, grand.gen, grand.sex, grand.traits, grand.parents, grand.genes.born, grand.genes.salt);
[founders[0], founders[1], child, grand].forEach(function (f) { api.bankFish(f); });
must("a fish's own DNA verifies", api.verifyDna(child).ok === true, api.verifyDna(child).reason);
must("a tampered fish fails its own check", (function () {
  const bad = JSON.parse(JSON.stringify(child));
  bad.dna = "LG1-GLIM-000000000000";
  return api.verifyDna(bad).ok === false;
})());
must("a tampered trait fails its own check", (function () {
  const bad = JSON.parse(JSON.stringify(child));
  bad.traits.vigor = 0.99;
  return api.verifyDna(bad).ok === false;
})());
const lin = api.lineageOf(grand);
must("the chain walks back three ancestors deep", lin.found >= 3 && lin.deepest >= 2,
  "found " + lin.found + ", deepest " + lin.deepest + ", chain " + lin.chain.map(function (c) { return c.name + "@" + c.depth; }).join(" < "));
must("an unknown parent is reported missing, never invented", api.lineageOf({ parents: ["LG1-NOPE-000000000000"] }).missing === 1);
must("a founder has no ancestors to claim", api.lineageOf(founders[0]).found === 0);


/* ---- the hunt maths: prey choice, defences, the shoal ---- */
api.state.fish = [];
const prey = function (species, opts) {
  /* same health (its own maximum) and same stage (mid-life adult) so the only thing
     that differs between two test fish is the defence under test */
  const v = api.VITALS[species] || { hp: 100 };
  const f = mkFish(species, 40, v.hp);
  f.x = (opts && opts.x != null) ? opts.x : 0.5;
  f.y = 0.5; f.z = 0.5;
  if (opts && opts.baby) f.growth = 0;
  else f.growth = (api.cycleOf(species)[5] || 168) * 0.5 * 3600000;
  if (opts && opts.starving) f.lastFed = now - 30 * 3600000;
  if (opts && opts.hp != null) f.hp = opts.hp;
  return f;
};
const lone = prey("glimmer", { x: 0.12 });
api.state.fish = [lone];
const loneScore = api.preyScore(lone, now);
const aloneChance = api.huntChance(lone, now);
must("a fish with nobody of its kind near it has no shoal to hide in", api.schoolSafety(lone) === 0);
const plenty = prey("glimmer", { x: 0.8 });
const mates = [prey("glimmer", { x: 0.82 }), prey("glimmer", { x: 0.85 }), prey("glimmer", { x: 0.88 }), prey("glimmer", { x: 0.91 })];
api.state.fish = [plenty].concat(mates);
must("a fish inside its own shoal is harder to pick out", api.preyScore(plenty, now) < loneScore,
  "shoal " + api.preyScore(plenty, now) + " vs alone " + loneScore);
must("and the same shoal blunts the bite", api.huntChance(plenty, now) < aloneChance,
  "shoal " + Math.round(api.huntChance(plenty, now) * 100) + "% vs alone " + Math.round(aloneChance * 100) + "%");
must("the shoal count is the count of its own kind, not everyone", (function () {
  const d1 = mkFish("dart", 40), d2 = mkFish("dart", 40);
  d1.x = 0.81; d1.y = 0.5; d2.x = 0.83; d2.y = 0.5;
  api.state.fish = [plenty, mates[0], d1, d2];
  return api.schoolMates(plenty, 0.13) === 1;
})());
must("a starving fish is the better target", (function () {
  const fed = prey("dart", { hp: 100, x: 0.2 });
  const starving = prey("dart", { starving: true, hp: 100, x: 0.8 });
  api.state.fish = [fed, starving];
  return api.preyScore(starving, now) > api.preyScore(fed, now);
})());
must("spines and armour make a fish a worse target than a soft one", (function () {
  const soft = prey("glimmer", { x: 0.15 });
  const spiky = prey("tusk", { x: 0.5 });
  const armed = prey("crab", { x: 0.85 });
  api.state.fish = [soft, spiky, armed];
  return api.preyScore(spiky, now) < api.preyScore(soft, now) && api.preyScore(armed, now) < api.preyScore(soft, now);
})(), "soft " + api.preyScore(prey("glimmer", { x: 0.15 }), now) + " tusk " + api.preyScore(prey("tusk", { x: 0.5 }), now));
must("a defended fish is harder to bite", (function () {
  const soft = prey("glimmer", { x: 0.15 });
  const spiky = prey("tusk", { x: 0.5 });
  const fast = prey("dart", { x: 0.85 });
  api.state.fish = [soft, spiky, fast];
  return api.huntChance(spiky, now) < api.huntChance(soft, now) && api.huntChance(fast, now) < api.huntChance(soft, now);
})(), "glimmer " + Math.round(api.huntChance(prey("glimmer", { x: 0.15 }), now) * 100) + "% tusk " +
  Math.round(api.huntChance(prey("tusk", { x: 0.5 }), now) * 100) + "% dart " +
  Math.round(api.huntChance(prey("dart", { x: 0.85 }), now) * 100) + "%");
must("the picker takes the worst-off fish when the water is clear", (function () {
  const fine = prey("glimmer", { hp: 100, x: 0.2 });
  const sick = prey("glimmer", { hp: 20, starving: true, x: 0.8 });
  api.state.fish = [fine, sick];
  return api.weakestPrey(now, true) === sick;
})());
must("an inked octopus drops down the list", (function () {
  const octo = prey("octo", { x: 0.2 });
  octo.inkUntil = now + 10000;
  const other = prey("octo", { x: 0.8 });
  api.state.fish = [octo, other];
  return api.preyScore(octo, now) < api.preyScore(other, now);
})());
must("and a baby is the easiest thing in the water", (function () {
  const baby = prey("glimmer", { x: 0.2, baby: true });
  const grown = prey("glimmer", { x: 0.8 });
  api.state.fish = [baby, grown];
  return api.preyScore(baby, now) > api.preyScore(grown, now);
})());
must("every species in the tank has an answer for a hunter", api.SPECIES.every(function (sp) {
  return Object.keys(api.defenseOf(sp.id)).length > 0;
}), "bare: " + api.SPECIES.filter(function (sp) { return !Object.keys(api.defenseOf(sp.id)).length; })
  .map(function (sp) { return sp.id; }).join(","));
must("the slow heavy species carry the real armour", api.dval("crab", "armor") > api.dval("glimmer", "armor") &&
  api.dval("tusk", "spines") > api.dval("dart", "spines") && api.dval("claw", "venom") > api.dval("ruby", "venom"));
api.state.fish = [];

console.log("");
if (fails) {
  console.log(fails + " sim check(s) failed");
  process.exit(1);
}
console.log("all sim checks passed");
