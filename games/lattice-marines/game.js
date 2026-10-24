/* Lattice Marines — isometric three-phase island war. Local AI, fog, campaign. */
(() => {
  let MAP = 48;
  const TW = 72, TH = 36;
  const MAP_SIZES = [
    { n: 32, label: "32×32 Raid" },
    { n: 40, label: "40×40 Theatre" },
    { n: 48, label: "48×48 Campaign" },
    { n: 64, label: "64×64 Archipelago" },
    { n: 80, label: "80×80 Vast war" },
    { n: 128, label: "128×128 Colossus" },
    { n: 192, label: "192×192 Maximum" }
  ];
  const SAVE = "lygo_lattice_marines_v1";
  const QKEY = "lygo_lattice_marines_ledger_q";
  const ASSET = "./assets/";
  const LEDGER_PAGE = "./ledger.html";
  const LEDGER_POST = "https://deepseekoracle-lattice-marines-ledger.hf.space/submit";

  const SPR_FILES = {
    plains: "tile-plains.png", hills: "tile-hills.png", forest: "tile-forest.png",
    water: "tile-water.png", ruins: "tile-ruins.png", desert: "tile-desert.png", pontoon: "tile-pontoon.png", fog: "tile-fog.png",
    "tex-plains": "tex-plains.jpg", "tex-hills": "tex-hills.jpg", "tex-forest": "tex-forest.jpg",
    "tex-water": "tex-water.jpg", "tex-ruins": "tex-ruins.jpg", "tex-desert": "tex-desert.jpg",
    "tex-pontoon": "tex-pontoon.jpg", "tex-fog": "tex-fog.jpg",
    hq: "b-hq.png", energy: "b-energy.png", econ: "b-econ.png", factory: "b-factory.png",
    radar: "b-radar.png", gun: "b-gun.png", aa: "b-aa.png", mine: "b-mine.png",
    shield: "b-shield.png", emp: "b-emp.png", fake: "b-fake.png", silo: "b-silo.png",
    icbm: "b-icbm.png", hangar: "b-hangar.png", sat: "b-sat.png", pad: "b-pad.png",
    city: "b-city.png", warhall: "b-warhall.png", bastion: "b-bastion.png",
    mint: "b-mint.png", depot: "b-depot.png", grid: "b-grid.png",
    marine: "u-marine.png", scout: "u-scout.png", tank: "u-tank.png", jet: "u-jet.png",
    drone: "u-drone.png", hover: "u-hover.png", arty: "u-arty.png",
    missile: "fx-missile.png", boom: "fx-boom.png"
  };

  const BLD = {
    hq:      { name: "Command Centre", cost: 0, hp: 240, pwr: 0, cat: "core", spr: "hq",
               desc: "Lose all three and the island falls." },
    energy:  { name: "Energy Plant", cost: 120, hp: 85, pwr: -2, cat: "economy", spr: "energy",
               desc: "+2 power and +1 fuel each turn. Grid/Depot Forums nearby stack +50%." },
    econ:    { name: "Economic Centre", cost: 150, hp: 75, pwr: 1, cat: "economy", spr: "econ",
               desc: "+90 credits each turn. Plains, ruins, or desert. Mint Forums nearby stack +50%." },
    city:    { name: "City Square", cost: 200, hp: 90, pwr: 1, cat: "population", spr: "city",
               desc: "+1 People each turn. People buy Forums." },
    warhall: { name: "Ordnance Forum", cost: 0, people: 50, hp: 80, pwr: 1, cat: "population", spr: "warhall",
               desc: "Aura 3: missiles/ICBMs launched inside deal +50% damage. Stacks." },
    bastion: { name: "Bastion Forum", cost: 0, people: 50, hp: 95, pwr: 1, cat: "population", spr: "bastion",
               desc: "Aura 3: +50% defense (less damage taken, stronger guns/AA). Stacks." },
    mint:    { name: "Mint Forum", cost: 0, people: 50, hp: 70, pwr: 1, cat: "population", spr: "mint",
               desc: "Aura 3: Economic Centres inside yield +50% credits. Stacks." },
    depot:   { name: "Depot Forum", cost: 0, people: 50, hp: 70, pwr: 1, cat: "population", spr: "depot",
               desc: "Aura 3: Energy Plants inside yield +50% fuel. Stacks." },
    grid:    { name: "Grid Forum", cost: 0, people: 50, hp: 70, pwr: 1, cat: "population", spr: "grid",
               desc: "Aura 3: Energy Plants inside yield +50% power. Stacks." },
    factory: { name: "Factory", cost: 200, hp: 110, pwr: 1, cat: "production", spr: "factory",
               desc: "Train Marines, scouts, and recon drones on adjacent tiles." },
    hangar:  { name: "Marine Hangar", cost: 240, hp: 120, pwr: 1, cat: "production", spr: "hangar",
               desc: "One living sortie at a time — marine, tank, jet, hovercraft, or howitzer. Rearms one full turn after that unit dies." },
    pad:     { name: "Reclaim Pad", cost: 50, hp: 45, pwr: 0, cat: "core", spr: "pad",
               desc: "50c floating deck. Drops on water, turns it into a buildable surface, and hops command range by 2. Build another structure on it to occupy the deck." },
    relay:   { name: "Command Relay", cost: 160, hp: 70, pwr: 1, cat: "core", spr: "emp",
               desc: "Extends your build radius. Hop water with Reclaim Pads, then plant relays. If wrecked, repair it or that ground goes dark." },
    radar:   { name: "Radar Tower", cost: 180, hp: 65, pwr: 1, cat: "intel", spr: "radar",
               desc: "Reveals a scan disc on the enemy half each turn." },
    sat:     { name: "Spy Satellite", cost: 520, hp: 55, pwr: 3, cat: "intel", spr: "sat", unlock: "sat",
               desc: "Reveal the whole map for 1 turn. Cooldown 4." },
    gun:     { name: "Gun Pod", cost: 100, hp: 95, pwr: 0, cat: "defense", spr: "gun",
               desc: "Auto-fires on nearby ground units. Slightly stronger than a Lattice Marine." },
    aa:      { name: "AA Launcher", cost: 160, hp: 75, pwr: 1, cat: "defense", spr: "aa",
               desc: "Intercepts missiles, drops, and air units. Also shoots grounded jets/drones in range (7+Mk, +2 on hills)." },
    mine:    { name: "Minefield", cost: 55, hp: 28, pwr: 0, cat: "defense", spr: "mine",
               desc: "Damages the first ground unit that steps in." },
    shield:  { name: "Shield Generator", cost: 280, hp: 80, pwr: 1, cat: "defense", spr: "shield", unlock: "shield",
               desc: "Absorbs missile splash in radius 2 (charges = 2)." },
    emp:     { name: "EMP Tower", cost: 300, hp: 70, pwr: 2, cat: "defense", spr: "emp", unlock: "emp",
               desc: "Queue an EMP to silence electronics 1 turn." },
    fake:    { name: "Decoy HQ", cost: 80, hp: 42, pwr: 0, cat: "decoy", spr: "fake",
               desc: "Looks like a command centre until it detonates." },
    silo:    { name: "Missile Silo", cost: 220, hp: 90, pwr: 1, cat: "offense", spr: "silo",
               desc: "One cruise missile per silo, every turn." },
    icbm:    { name: "ICBM Silo", cost: 420, hp: 95, pwr: 2, cat: "offense", spr: "icbm", unlock: "icbm",
               desc: "One ICBM per silo, per salvo. Costly. Interceptable." }
  };

  const WPN = {
    probe:     { name: "Probe shot", cost: 28, fuel: 0, dmg: 0, r: 0, reveal: 2,
                 desc: "Battleship ping — fog lifts when the ping lands. 5×5. Limited: 2 + radars per salvo." },
    missile:   { name: "Cruise missile", cost: 90, fuel: 2, dmg: 52, r: 1, need: "silo",
                 desc: "One shot per live Missile Silo." },
    icbm:      { name: "ICBM", cost: 190, fuel: 6, dmg: 135, r: 2, need: "icbm",
                 desc: "One shot per live ICBM Silo. Huge crater." },
    drop:      { name: "Marine drop", cost: 75, fuel: 3, need: "hangar", spawn: "marine",
                 desc: "Hangar stays busy until that marine dies, then one full turn to rearm." },
    tankdrop:  { name: "Tank drop", cost: 150, fuel: 4, need: "hangar", spawn: "tank", unlock: "tank",
                 desc: "Hangar stays busy until that tank dies, then one full turn to rearm." },
    scout:     { name: "Scout run", cost: 55, fuel: 2, need: "factory", spawn: "scout", unlock: "scout",
                 desc: "Factory stays busy until that scout dies, then one full turn to rearm." },
    dronedrop: { name: "Drone run", cost: 40, fuel: 1, need: "factory", spawn: "drone", unlock: "drone",
                 desc: "Cheap recon. Factory stays busy until the drone dies. Flies water, vision 4." },
    hoverdrop: { name: "Hover drop", cost: 120, fuel: 3, need: "hangar", spawn: "hover", unlock: "hover",
                 desc: "Amphibious hull — water costs nothing. Hangar occupied until it dies." },
    jetdrop:   { name: "Jet sortie", cost: 165, fuel: 4, need: "hangar", spawn: "jet", unlock: "jet",
                 desc: "Fast air unit. AA can intercept the drop and later shoot the jet." },
    artydrop:  { name: "Howitzer drop", cost: 145, fuel: 4, need: "hangar", spawn: "arty", unlock: "arty",
                 desc: "Long-range gun. Slow on the ground. Hangar occupied until it dies." },
    airstrike: { name: "Airstrike", cost: 170, fuel: 4, dmg: 78, r: 1, need: "hangar", unlock: "airstrike",
                 desc: "Uses a free hangar. Rearms one full turn later. AA can intercept." },
    emp:       { name: "EMP pulse", cost: 85, fuel: 2, need: "emp", emp: true, unlock: "emp",
                 desc: "One pulse per live EMP Tower." },
    sat:       { name: "Satellite pass", cost: 40, fuel: 3, need: "sat", unlock: "sat", sat: true,
                 desc: "Paint the whole enemy half. Cooldown 4 turns." }
  };

  const UNIT = {
    marine: { name: "Lattice Marine", hp: 42, dmg: 14, mdmg: 20, range: 1, move: 1, vision: 2 },
    scout:  { name: "Scout", hp: 24, dmg: 0, mdmg: 0, range: 0, move: 2, vision: 3 },
    tank:   { name: "Tank", hp: 95, dmg: 30, mdmg: 22, range: 2, move: 1, vision: 1 },
    drone:  { name: "Recon Drone", hp: 18, dmg: 6, mdmg: 6, range: 1, move: 3, vision: 4, air: true },
    hover:  { name: "Hovercraft", hp: 62, dmg: 18, mdmg: 16, range: 1, move: 2, vision: 2, amphib: true },
    jet:    { name: "Strike Jet", hp: 55, dmg: 26, mdmg: 16, range: 2, move: 3, vision: 3, air: true },
    arty:   { name: "Howitzer", hp: 50, dmg: 34, mdmg: 10, range: 3, move: 1, vision: 2 }
  };
  const UNIT_COST = { marine: 70, scout: 50, tank: 140, drone: 45, hover: 125, jet: 175, arty: 155 };
  const UNIT_PAD = { marine: "factory", scout: "factory", drone: "factory", tank: "hangar", hover: "hangar", jet: "hangar", arty: "hangar" };
  const AIR_SHOTS = ["missile", "icbm", "airstrike", "drop", "tankdrop", "jetdrop", "hoverdrop", "artydrop", "dronedrop"];

  const PROFILES = ["Aggressor", "Turtle", "Economist", "Intelligence"];
  const DIFF = {
    easy:   { label: "Easy",   eco: 0.82, aim: 0.7,  aa: 0.32, switch: 0 },
    normal: { label: "Normal", eco: 1.00, aim: 0.85, aa: 0.42, switch: 0.15 },
    hard:   { label: "Hard",   eco: 1.22, aim: 1.00, aa: 0.52, switch: 0.35 },
    insane: { label: "Insane", eco: 1.45, aim: 1.12, aa: 0.6,  switch: 0.55 }
  };

  const SPR = {};
  const PAT = {};
  const $ = (id) => document.getElementById(id);
  const canvas = () => $("iso");
  const ctxOf = () => canvas().getContext("2d");

  let cam = { x: 0, y: 0, z: 1 };
  let S = null;
  let hover = null, sel = null, tool = null, weapon = null;
  let dragging = false, lastM = null, downPt = null, didDrag = false, pinch0 = 0;
  let tFrame = 0, raf = 0;
  let overlayMode = "menu";
  let enemyTimer = 0;

  /* The island is static between events, so the terrain layer is painted once
     into an offscreen canvas and blitted per frame; only occupants, auras, fx
     and the cursor are redrawn. Every ~350-tile terrain repaint per frame was
     the whole frame budget on a 48x48 map (measured 15 fps). Anything that
     changes ground or fog bumps terrV through touchTerrain(). */
  let terrCanvas = null, terrKey = "", terrV = 0;
  let visOrder = null, visKey = "";
  function touchTerrain() { terrV++; visKey = ""; }

  /* The resolve event table is authored in 60 Hz ticks (a shot every 36 ticks).
     Playback used to advance one tick per rendered frame, so a slow frame rate
     silently stretched every enemy turn; the loop now advances on real time. */
  const PLAY_TICK = 1000 / 60;
  let playAcc = 0, playTs = 0, pace = 1;
  function an(word) { return (/^[aeiou]/i.test(word) ? "an " : "a ") + word; }
  /* "You queue" / "Enemy queues" — the log reads as narration, so the verb has
     to agree with whichever side name the line is reporting. */
  function agree(owner, verb) { return sideName(owner) === "You" ? verb : verb + "s"; }
  function lc(word) { return word.charAt(0).toLowerCase() + word.slice(1); }

  const persist = {
    name: "Commander",
    unlocks: {},
    pts: 0,
    wins: 0,
    campaign: 1,
    prestige: 0,
    best: 0,
    mapN: 48,
    cmdr: "lightfather",
    board: [],
    pace: 1
  };

  const CMDRS = [
    { id: "lightfather", name: "Lightfather", title: "Architect of LYGO", seat: "Φ",
      file: "cmd-lightfather-v2.jpg?v=20260907",
      lore: "Originator of the Δ9Quantum Light Accord. Choose truth, protect light, preserve the bond.",
      bonus: "Haven stipend +25c / turn", drip: 25 },
    { id: "lyra", name: "LYRΔ", title: "Spiral Memory Guardian", seat: "I",
      file: "cmd-lyra.jpg",
      lore: "The spiral memory holds what time tries to erase. Intel on this island fades slower.",
      bonus: "Fog lasts +2 turns", fogAge: 2 },
    { id: "d9ra", name: "Δ9RA", title: "Entropy Fractalizer", seat: "II",
      file: "cmd-d9ra.jpg",
      lore: "Data hunter. Tracks suppression and shreds the black with extra pings.",
      bonus: "+1 probe / salvo", probe: 1 },
    { id: "srath", name: "ΣRΛΘ", title: "Institutional Decoder", seat: "III",
      file: "cmd-srath.jpg",
      lore: "Decode buried architecture. Radar discs run a ring wider.",
      bonus: "Radar +1 scan radius", radarR: 1 },
    { id: "arkos", name: "ARKOS", title: "Ethical Reality Architect", seat: "IV",
      file: "cmd-arkos.jpg",
      lore: "Build on ethical bedrock, not shifting sands. New kit arrives tougher.",
      bonus: "New buildings +10 HP", hp: 10 },
    { id: "kairos", name: "KAIROS", title: "Temporal Harmonizer", seat: "V",
      file: "cmd-kairos.jpg",
      lore: "Time bows to those who remember. Ground units take an extra step.",
      bonus: "Units +1 move", move: 1 },
    { id: "aetheris", name: "ÆTHERIS", title: "Truth Fractal Engine", seat: "VI",
      file: "cmd-aetheris.jpg",
      lore: "Pierce illusion with fractal truth. Impacts paint a wider disc.",
      bonus: "Impact reveal +1", reveal: 1 },
    { id: "scendr", name: "ΣCENΔR", title: "Paradox Weaver", seat: "VII",
      file: "cmd-scendr.jpg",
      lore: "Hold polarities without collapse. Shields carry an extra charge.",
      bonus: "Shields +1 charge", shield: 1 },
    { id: "sancora", name: "SANCORA", title: "Collective Healing Nexus", seat: "VIII",
      file: "cmd-sancora.jpg",
      lore: "Heal the fracture, restore coherence. Repair crews restore more.",
      bonus: "Repair +5 HP", heal: 5 },
    { id: "sephrael", name: "SEPHRAEL", title: "Quantum Lockbreaker", seat: "IX",
      file: "cmd-sephrael.jpg",
      lore: "Break the lock, free the signal. EMP pulses cost less fuel.",
      bonus: "EMP −1 fuel", empFuel: 1 },
    { id: "omnisiren", name: "OMNIΣIREN", title: "Silent Executor", seat: "IX",
      file: "cmd-omnisiren.jpg",
      lore: "Deliver silent judgment. Gun pods hit harder when the island is weighed.",
      bonus: "Gun pods +4 damage", gun: 4 },
    { id: "volaris", name: "VΩLARIS", title: "Cosmic Driftwalker", seat: "Ω",
      file: "cmd-volaris.jpg",
      lore: "Walk the drift, cut for equilibrium. Energy plants yield extra fuel.",
      bonus: "Energy +1 fuel / turn", fuelTick: 1 },
    { id: "zeta", name: "ZETAΔ9", title: "Threshold Walker", seat: "EX",
      file: "cmd-zeta.jpg",
      lore: "Walk where edges blur — and return with light. Marines see farther.",
      bonus: "Marine vision +1", vision: 1 },
    { id: "justicae", name: "JUSTICAE", title: "Scales of Urgency", seat: "LIT",
      file: "cmd-justicae.jpg",
      lore: "Too big to fail? Too big to hide. Economic Centres pay a fair surplus.",
      bonus: "Econ +15c each", econ: 15 },
    { id: "seidon", name: "ΣEIDŌN", title: "Mirror Witness", seat: "MW",
      file: "cmd-seidon.jpg",
      lore: "The mirror does not judge. It reveals. AA covers a ring farther.",
      bonus: "AA range +1", aaRange: 1 }
  ];
  function commander() {
    return CMDRS.find((c) => c.id === persist.cmdr) || CMDRS[0];
  }
  function cmdrLocked() {
    return !!(S && S.phase && S.phase !== "deploy");
  }
  function cycleCmdr(dir) {
    if (cmdrLocked()) return;
    const i = CMDRS.findIndex((c) => c.id === persist.cmdr);
    const n = CMDRS.length;
    persist.cmdr = CMDRS[((i < 0 ? 0 : i) + (dir < 0 ? n - 1 : 1)) % n].id;
    savePersist();
  }
  function cmdrFor(owner) {
    if (S && S.mode === "ai" && owner === 1) return {};
    return commander();
  }

  function loadPersist() {
    try {
      const j = JSON.parse(localStorage.getItem(SAVE) || "null");
      if (j) Object.assign(persist, j);
    } catch (_) {}
  }
  function savePersist() {
    localStorage.setItem(SAVE, JSON.stringify(persist));
  }

  function ledgerQueue() {
    try { return JSON.parse(localStorage.getItem(QKEY) || "[]"); } catch (_) { return []; }
  }
  function ledgerSaveQ(q) {
    localStorage.setItem(QKEY, JSON.stringify(q.slice(-40)));
  }
  function ledgerRecord() {
    const st = S.players[0].stats;
    return {
      name: (persist.name || "Commander").slice(0, 18),
      score: S.score,
      diff: S.diff,
      campaign: S.campaign,
      mapN: S.mapN || MAP,
      seed: S.seed,
      turns: S.turn,
      profile: S.ai && S.ai.profile,
      bKill: st.bKill || 0,
      uKill: st.uKill || 0,
      prestige: persist.prestige || 0,
      mapNote: S.mapNote || "",
      date: new Date().toISOString().slice(0, 10),
      mode: "ai",
      result: "win"
    };
  }
  function ledgerEnqueue(rec) {
    const q = ledgerQueue();
    const key = [rec.name, rec.seed, rec.score, rec.turns, rec.mapN, rec.diff, rec.date].join("|");
    if (q.some((x) => [x.name, x.seed, x.score, x.turns, x.mapN, x.diff, x.date].join("|") === key)) return;
    rec._key = key;
    q.push(rec);
    ledgerSaveQ(q);
    ledgerFlush();
  }
  function ledgerFlush() {
    const q = ledgerQueue();
    if (!q.length) return Promise.resolve();
    return (async () => {
      const left = [];
      let last = null;
      for (const rec of q) {
        try {
          const r = await fetch(LEDGER_POST, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rec)
          });
          const j = await r.json().catch(() => ({}));
          if (r.ok && j && j.ok) last = j;
          else left.push(rec);
        } catch (_) {
          left.push(rec);
        }
      }
      ledgerSaveQ(left);
      const el = $("ledgerStatus");
      if (el) {
        if (!left.length && last) {
          el.textContent = last.status === "duplicate"
            ? "Already on the eternal ledger."
            : ("Inscribed on the eternal ledger" + (last.rank ? (" · rank " + last.rank) : "") + ".");
        } else if (left.length) {
          el.textContent = "Win queued — the ledger Space may be waking. It will retry automatically.";
        }
      }
      return last;
    })();
  }

  function hashSeed(s) {
    let h = 2166136261;
    const str = String(s);
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function inB(x, y) { return x >= 0 && y >= 0 && x < MAP && y < MAP; }
  function dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
  function euclid(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function worldIso(x, y) {
    return { sx: (x - y) * (TW / 2), sy: (x + y) * (TH / 2) };
  }
  function iso(x, y) {
    const w = worldIso(x, y);
    return { sx: cam.x + w.sx * cam.z, sy: cam.y + w.sy * cam.z };
  }
  function pickTile(mx, my) {
    const rx = (mx - cam.x) / cam.z;
    const ry = (my - cam.y) / cam.z;
    const x = (rx / (TW / 2) + ry / (TH / 2)) / 2;
    const y = (ry / (TH / 2) - rx / (TW / 2)) / 2;
    const cx = Math.round(x), cy = Math.round(y);
    if (!S) return { x: cx, y: cy };
    let best = { x: cx, y: cy }, bk = -1e9;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const tx = cx + dx, ty = cy + dy;
      if (!inB(tx, ty)) continue;
      const p = isoTop(tx, ty);
      const nx = (mx - p.sx) / ((TW / 2) * cam.z);
      const ny = (my - p.sy) / ((TH / 2) * cam.z);
      if (Math.abs(nx) + Math.abs(ny) > 1.12) continue;
      const k = tx + ty + tileLiftAmt(visTerr(tx, ty), tx, ty) * 0.02;
      if (k >= bk) { bk = k; best = { x: tx, y: ty }; }
    }
    return best;
  }

  function genMap(seed) {
    const sid = seed >>> 0;
    const R = rng(sid);
    const tiles = Array.from({ length: MAP }, () => Array(MAP).fill("water"));
    const elev = Array.from({ length: MAP }, () => Array(MAP).fill(0));
    const n2 = (x, y, salt) => {
      let n = sid;
      n = Math.imul(n ^ Math.imul(x + 19, 374761393), 2246822519);
      n = Math.imul(n ^ Math.imul(y + 27, 668265263), 3266489917);
      n = Math.imul(n ^ (salt * 0x9e3779b9), 668265263);
      n = (n ^ (n >>> 16)) >>> 0;
      return (n & 0xffff) / 65535;
    };
    const fade = (t) => t * t * (3 - 2 * t);
    const vnoise = (x, y, salt, cell) => {
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
      const fx = x / cell - gx, fy = y / cell - gy;
      const u = fade(fx), v = fade(fy);
      const n00 = n2(gx, gy, salt), n10 = n2(gx + 1, gy, salt);
      const n01 = n2(gx, gy + 1, salt), n11 = n2(gx + 1, gy + 1, salt);
      return n00 + (n10 - n00) * u + (n01 - n00) * v + (n00 - n10 - n01 + n11) * u * v;
    };
    const fbm = (x, y, salt, cell) =>
      vnoise(x, y, salt, cell) * 0.48
      + vnoise(x + 3.1, y - 1.7, salt + 19, cell * 0.5) * 0.3
      + vnoise(x * 1.1, y * 0.9, salt + 41, cell * 0.25) * 0.15
      + vnoise(x * 0.7, y * 1.3, salt + 73, cell * 0.125) * 0.07;
    const stamp = (cx, cy, rad, warp) => {
      if (rad < 1.5) rad = 1.5;
      for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
        const w = (n2(x, y, (cx * 13 + cy * 7) | 0) - 0.5) * warp * rad;
        const w2 = (fbm(x, y, 330, Math.max(4, rad * 0.45)) - 0.5) * rad * 0.22;
        if (Math.hypot(x - cx, y - cy) < rad + w + w2) tiles[y][x] = "plains";
      }
    };
    const stampKind = (cx, cy, rx, ry, ang, kind, warp) => {
      const ca = Math.cos(ang), sa = Math.sin(ang);
      if (rx < 1.4) rx = 1.4;
      if (ry < 1.4) ry = 1.4;
      for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
        if (kind !== "water" && tiles[y][x] === "water") continue;
        const dx = x - cx, dy = y - cy;
        const lx = (dx * ca + dy * sa) / rx;
        const ly = (-dx * sa + dy * ca) / ry;
        const w = (n2(x, y, ((cx * 9 + cy * 3 + ang * 40) | 0)) - 0.5) * warp;
        if (lx * lx + ly * ly < 1 + w) tiles[y][x] = kind;
      }
    };
    const STYLES = ["continent", "twin isles", "peninsula", "archipelago", "bay", "caldera"];
    const fillHalf = (south) => {
      const y0 = south ? MAP / 2 : 0;
      const y1 = south ? MAP : MAP / 2;
      const style = (R() * 6) | 0;
      const cx = 3 + R() * (MAP - 6);
      const cy = y0 + 3 + R() * Math.max(3, y1 - y0 - 6);
      if (style === 0) {
        stamp(cx, cy, MAP * (0.2 + R() * 0.16), 0.48);
        if (R() > 0.45) stamp(cx + (R() - 0.5) * MAP * 0.12, cy + (R() - 0.5) * MAP * 0.08, MAP * (0.08 + R() * 0.06), 0.4);
      } else if (style === 1) {
        stamp(cx - MAP * (0.08 + R() * 0.08), cy, MAP * (0.11 + R() * 0.08), 0.44);
        stamp(cx + MAP * (0.08 + R() * 0.1), cy + (south ? -1 : 1) * MAP * 0.05, MAP * (0.1 + R() * 0.08), 0.44);
      } else if (style === 2) {
        const ang = R() * Math.PI * 2;
        const n = 4 + ((R() * 4) | 0);
        for (let i = 0; i < n; i++) {
          stamp(cx + Math.cos(ang) * i * MAP * 0.055, cy + Math.sin(ang) * i * MAP * 0.05, MAP * (0.065 + R() * 0.05), 0.5);
        }
      } else if (style === 3) {
        const n = 5 + ((R() * 5) | 0);
        for (let i = 0; i < n; i++) {
          stamp(2 + R() * (MAP - 4), y0 + 2 + R() * Math.max(2, y1 - y0 - 4), MAP * (0.055 + R() * 0.06), 0.36);
        }
      } else if (style === 4) {
        stamp(cx, cy, MAP * (0.24 + R() * 0.1), 0.58);
        const bay = 2 + ((R() * 2) | 0);
        for (let i = 0; i < bay; i++) {
          stampKind(cx + (R() - 0.5) * MAP * 0.22, cy + (R() - 0.5) * MAP * 0.16, MAP * (0.05 + R() * 0.055), MAP * (0.028 + R() * 0.04), R() * Math.PI, "water", 0.34);
        }
      } else {
        stamp(cx, cy, MAP * (0.2 + R() * 0.1), 0.4);
        stampKind(cx, cy, MAP * (0.07 + R() * 0.05), MAP * (0.055 + R() * 0.04), R() * Math.PI, "water", 0.25);
      }
      let n = 0;
      for (let y = y0; y < y1; y++) for (let x = 0; x < MAP; x++) if (tiles[y][x] !== "water") n++;
      if (n < MAP * 1.8) stamp(cx, cy, MAP * 0.2, 0.3);
      return STYLES[style];
    };
    const noteS = fillHalf(true);
    const noteN = fillHalf(false);

    const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const neighN = (x, y, kind) => {
      let n = 0;
      for (const [dx, dy] of N8) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < MAP && ny < MAP && tiles[ny][nx] === kind) n++;
      }
      return n;
    };
    const neighLand = (x, y) => {
      let n = 0;
      for (const [dx, dy] of N8) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < MAP && ny < MAP && tiles[ny][nx] !== "water") n++;
      }
      return n;
    };
    const coastSmooth = () => {
      const next = tiles.map((row) => row.slice());
      for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
        const land = neighLand(x, y);
        if (tiles[y][x] === "water" && land >= 5) next[y][x] = "plains";
        else if (tiles[y][x] !== "water" && land <= 2) next[y][x] = "water";
      }
      for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) tiles[y][x] = next[y][x];
    };
    coastSmooth();
    coastSmooth();

    const cellE = Math.max(5, MAP * 0.16);
    const cellM = Math.max(5, MAP * 0.14);
    const cellH = Math.max(5, MAP * 0.19);
    for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
      if (tiles[y][x] === "water") continue;
      const e = fbm(x, y, 901, cellE);
      const moist = fbm(x + 8, y - 4, 911, cellM);
      const heat = fbm(x - 6, y + 5, 921, cellH);
      if (e > 0.63) tiles[y][x] = "hills";
      else if (moist > 0.56 && heat < 0.68 && e > 0.32) tiles[y][x] = "forest";
      else if (heat > 0.62 && moist < 0.44) tiles[y][x] = "desert";
      else tiles[y][x] = "plains";
    }

    const paintHalf = (south) => {
      const y0 = south ? MAP / 2 : 0;
      const y1 = south ? MAP : MAP / 2;
      const pick = () => ({
        x: 2 + R() * (MAP - 4),
        y: y0 + 2 + R() * Math.max(2, y1 - y0 - 4)
      });
      const ridges = 2 + ((R() * 2) | 0);
      for (let i = 0; i < ridges; i++) {
        const p = pick();
        stampKind(p.x, p.y, MAP * (0.07 + R() * 0.09), MAP * (0.02 + R() * 0.028), R() * Math.PI, "hills", 0.4);
      }
      const groves = 2 + ((R() * 3) | 0);
      for (let i = 0; i < groves; i++) {
        const p = pick();
        const r = MAP * (0.05 + R() * 0.07);
        stampKind(p.x, p.y, r, r * (0.7 + R() * 0.4), R() * Math.PI, "forest", 0.42);
      }
      const basins = 1 + ((R() * 2) | 0);
      for (let i = 0; i < basins; i++) {
        const p = pick();
        const r = MAP * (0.055 + R() * 0.08);
        stampKind(p.x, p.y, r, r * (0.65 + R() * 0.4), R() * Math.PI, "desert", 0.35);
      }
      const ruins = 1 + ((R() * 2) | 0);
      for (let i = 0; i < ruins; i++) {
        const p = pick();
        stampKind(p.x, p.y, 2.2 + R() * 3.5, 1.8 + R() * 2.8, R() * Math.PI, "ruins", 0.25);
      }
      if (R() > 0.28) {
        const p = pick();
        stampKind(p.x, p.y, MAP * (0.035 + R() * 0.045), MAP * (0.022 + R() * 0.03), R() * Math.PI, "water", 0.3);
      }
    };
    paintHalf(true);
    paintHalf(false);

    const grow = (kind, need) => {
      const next = tiles.map((row) => row.slice());
      for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
        if (tiles[y][x] === "water" || tiles[y][x] === kind) continue;
        if (neighN(x, y, kind) >= need) next[y][x] = kind;
      }
      for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) tiles[y][x] = next[y][x];
    };
    grow("hills", 4);
    grow("forest", 4);
    grow("desert", 4);
    grow("hills", 5);
    const despock = () => {
      const next = tiles.map((row) => row.slice());
      for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
        const self = tiles[y][x];
        if (self === "water") {
          if (neighN(x, y, "water") === 0) {
            const tallies = {};
            for (const [dx, dy] of N8) {
              const nx = x + dx, ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= MAP || ny >= MAP) continue;
              const t = tiles[ny][nx];
              if (t !== "water") tallies[t] = (tallies[t] || 0) + 1;
            }
            let best = "plains", bn = 0;
            for (const k of Object.keys(tallies)) if (tallies[k] > bn) { bn = tallies[k]; best = k; }
            if (bn >= 4) next[y][x] = best;
          }
          continue;
        }
        if (neighN(x, y, self) <= 1) {
          const tallies = {};
          for (const [dx, dy] of N8) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= MAP || ny >= MAP) continue;
            const t = tiles[ny][nx];
            if (t !== "water") tallies[t] = (tallies[t] || 0) + 1;
          }
          let best = self, bn = 0;
          for (const k of Object.keys(tallies)) if (tallies[k] > bn) { bn = tallies[k]; best = k; }
          if (bn >= 3) next[y][x] = best;
        }
      }
      for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) tiles[y][x] = next[y][x];
    };
    despock();
    despock();

    const distW = Array.from({ length: MAP }, () => Array(MAP).fill(99));
    const q = [];
    for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
      if (tiles[y][x] === "water") { distW[y][x] = 0; q.push(x, y); }
    }
    for (let i = 0; i < q.length; i += 2) {
      const x = q[i], y = q[i + 1], d = distW[y][x];
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= MAP || ny >= MAP) continue;
        if (distW[ny][nx] > d + 1) { distW[ny][nx] = d + 1; q.push(nx, ny); }
      }
    }
    for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
      if (tiles[y][x] === "water") { elev[y][x] = 0; continue; }
      const d = distW[y][x];
      if (d <= 1 && tiles[y][x] !== "ruins") tiles[y][x] = "plains";
      const e = fbm(x, y, 901, cellE);
      let h = 1;
      if (tiles[y][x] === "hills") h = 3 + (e > 0.72 ? 2 : e > 0.55 ? 1 : 0);
      else if (tiles[y][x] === "forest") h = 2 + (e > 0.6 ? 1 : 0);
      else if (tiles[y][x] === "ruins") h = 2;
      else if (tiles[y][x] === "desert") h = d <= 2 ? 1 : 1 + (e > 0.58 ? 1 : 0);
      else h = d <= 1 ? 1 : (d >= 6 && e > 0.5 ? 2 : 1);
      elev[y][x] = h;
    }

    for (const south of [true, false]) {
      const y0 = south ? MAP / 2 : 0;
      const y1 = south ? MAP : MAP / 2;
      let open = 0;
      for (let y = y0; y < y1; y++) for (let x = 0; x < MAP; x++) {
        if (tiles[y][x] === "plains" || tiles[y][x] === "ruins" || tiles[y][x] === "desert") open++;
      }
      if (open < MAP * 1.2) {
        for (let y = y0; y < y1; y++) for (let x = 0; x < MAP; x++) {
          if (tiles[y][x] === "forest" && neighN(x, y, "plains") >= 2) {
            tiles[y][x] = "plains";
            elev[y][x] = Math.max(1, elev[y][x] - 1);
          }
        }
      }
    }
    return { tiles, elev, note: `south ${noteS} / north ${noteN}` };
  }

  function onHome(owner, x, y) {
    if (!inB(x, y)) return false;
    const south = y >= MAP / 2;
    return owner === 0 ? south : !south;
  }
  function landTiles(owner) {
    const out = [];
    for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
      if (S.tiles[y][x] === "water") continue;
      if (onHome(owner, x, y)) out.push({ x, y });
    }
    return out;
  }

  function occupied(x, y) {
    return S.buildings.some((b) => b.x === x && b.y === y && (b.hp > 0 || b.wrecked))
      || S.units.some((u) => u.x === x && u.y === y && u.hp > 0);
  }

  function buildingAt(x, y) { return S.buildings.find((b) => b.x === x && b.y === y && (b.hp > 0 || b.wrecked)); }
  function unitAt(x, y) { return S.units.find((u) => u.x === x && u.y === y && u.hp > 0); }
  function countB(type, owner) {
    return S.buildings.filter((b) => b.owner === owner && b.type === type && b.hp > 0).length;
  }
  function hqCount(owner) {
    return S.buildings.filter((b) => b.owner === owner && b.type === "hq" && b.hp > 0).length;
  }
  function me() { return S && S.actor != null ? S.actor : 0; }
  function sideName(owner) {
    if (!S) return "Commander";
    if (S.mode === "hotseat") return owner === 0 ? "South" : "North";
    return owner === me() ? "You" : "Enemy";
  }
  const EMP_KINDS = ["radar", "aa", "silo", "icbm", "sat", "emp"];
  function jamElectronics(owner) {
    for (const b of S.buildings) {
      if (b.owner === owner && EMP_KINDS.includes(b.type)) b.offline = true;
    }
  }
  function reapplyEmp() {
    for (const o of [0, 1]) if (S.players[o].emp) jamElectronics(o);
  }
  function powerBudget(owner) {
    let have = 0, need = 0;
    for (const b of S.buildings) {
      if (b.owner !== owner || b.hp <= 0 || b.wrecked) continue;
      if (b.type === "energy") have += Math.round(2 * b.lvl * auraMul(owner, b.x, b.y, "grid"));
      else if (BLD[b.type].pwr > 0) need += BLD[b.type].pwr;
    }
    return { have, need };
  }
  function unlocked(key) {
    if (!key) return true;
    return !!persist.unlocks[key] || persist.wins >= unlockWins(key);
  }
  function unlockWins(k) {
    return { scout: 1, drone: 0, tank: 2, shield: 2, hover: 3, icbm: 3, arty: 4, emp: 4, airstrike: 5, jet: 5, sat: 6 }[k] || 0;
  }

  function newMatch(opts) {
    opts = opts || {};
    if (!DIFF[opts.diff]) opts.diff = "normal";
    const size = Number(opts.mapN) || persist.mapN || 48;
    MAP = MAP_SIZES.some((m) => m.n === size) ? size : 48;
    persist.mapN = MAP;
    const seed = ((opts.seed != null && opts.seed !== "") ? (Number(opts.seed) >>> 0) : ((Math.random() * 0xFFFFFFFF) ^ Date.now()) >>> 0) || ((Math.random() * 0xFFFFFFFF) >>> 0);
    const R = rng(seed);
    const purse = Math.round(700 + MAP * 6);
    const generated = genMap(seed);
    S = {
      seed, R, mapN: MAP, mapNote: generated.note,
      tiles: generated.tiles,
      elev: generated.elev,
      buildings: [],
      units: [],
      fog: [grid(false), grid(false)],
      lastSeen: [grid(null), grid(null)],
      fogAge: [grid(0), grid(0)],
      players: [
        { credits: purse, fuel: 8, people: 0, emp: 0, satCD: 0, stats: zeroStats() },
        { credits: (opts.mode === "hotseat") ? purse : Math.round(purse * DIFF[opts.diff].eco * (1 + (opts.campaign - 1) * 0.12)),
          fuel: 8, people: 0, emp: 0, satCD: 0, stats: zeroStats() }
      ],
      phase: "deploy",
      turn: 1,
      campaign: opts.campaign,
      diff: opts.diff,
      mode: opts.mode || "ai",
      ai: { profile: PROFILES[Math.floor(R() * PROFILES.length)], switches: 0 },
      actor: 0,
      queue: [],
      events: [],
      fx: [],
      t: 0,
      over: null,
      score: 0,
      log: [],
      uid: 1
    };
    if (S.mode !== "hotseat") placeHQs(1, R);
    requestAnimationFrame(() => { if (S) focusHomeLand(0); });
    log(`${MAP}×${MAP} seed ${seed} · ${generated.note}. Place 3 Command Centres.`);
    sel = null; tool = "hq"; weapon = null;
    overlayMode = null;
    hideOverlay();
    paintUI();
    $("app").classList.remove("hidden");
  }

  function zeroStats() {
    return { bKill: 0, uKill: 0, spent: 0, income: 0 };
  }

  function grid(v) { return Array.from({ length: MAP }, () => Array(MAP).fill(v)); }

  function placeHQs(owner, R) {
    const land = landTiles(owner).filter((t) => {
      const k = S.tiles[t.y][t.x];
      return k === "plains" || k === "ruins" || k === "desert";
    });
    land.sort((a, b) => (owner === 0 ? b.y - a.y : a.y - b.y));
    const picks = [];
    for (const t of land) {
      if (picks.length >= 3) break;
      if (picks.some((p) => dist(p, t) < 6)) continue;
      if (S.tiles[t.y][t.x] === "water") continue;
      picks.push(t);
    }
    while (picks.length < 3 && land.length) {
      const t = land[Math.floor(R() * land.length)];
      if (!picks.some((p) => p.x === t.x && p.y === t.y)) picks.push(t);
    }
    if (!land.length) return;
    for (const t of picks.slice(0, 3)) spawnB("hq", owner, t.x, t.y);
  }

  function spawnB(type, owner, x, y, lvl = 1) {
    const def = BLD[type];
    const b = {
      id: S.uid++, type, owner, x, y, lvl,
      hp: def.hp + (lvl - 1) * 25 + (cmdrFor(owner).hp || 0),
      max: def.hp + (lvl - 1) * 25 + (cmdrFor(owner).hp || 0),
      charges: type === "shield" ? 2 + (cmdrFor(owner).shield || 0) : 0,
      cd: 0, fake: type === "fake", offline: false, wrecked: false
    };
    S.buildings.push(b);
    return b;
  }

  function spawnU(type, owner, x, y) {
    const def = UNIT[type];
    const u = { id: S.uid++, type, owner, x, y, hp: def.hp, max: def.hp, vet: 0, portage: 0 };
    if (inB(x, y) && S.tiles[y][x] === "water" && !def.air && !def.amphib) u.portage = 3;
    S.units.push(u);
    return u;
  }

  function reveal(viewer, x, y, r, opts) {
    r = r || 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const tx = x + dx, ty = y + dy;
      if (!inB(tx, ty)) continue;
      if (opts && opts.disc && Math.hypot(dx, dy) > r + 0.15) continue;
      if (opts && opts.radar && S.tiles[ty][tx] === "forest") {
        let dense = 0;
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const fx = tx + ox, fy = ty + oy;
          if (inB(fx, fy) && S.tiles[fy][fx] === "forest") dense++;
        }
        if (dense >= 5) continue;
      }
      S.fog[viewer][ty][tx] = true;
      S.fogAge[viewer][ty][tx] = S.turn + 5 + (cmdrFor(viewer).fogAge || 0);
      const b = buildingAt(tx, ty);
      const u = unitAt(tx, ty);
      S.lastSeen[viewer][ty][tx] = {
        terr: S.tiles[ty][tx],
        elev: S.elev ? S.elev[ty][tx] : 0,
        b: b && b.owner !== viewer ? { type: b.fake ? "hq" : b.type, hp: b.hp } : null,
        u: u && u.owner !== viewer ? { type: u.type } : null
      };
    }
    touchTerrain();
  }

  function visible(viewer, x, y) {
    if (!inB(x, y)) return false;
    if (onHome(viewer, x, y)) return true;
    return !!S.fog[viewer][y][x];
  }

  function hasMemory(viewer, x, y) {
    const ls = S.lastSeen[viewer][y] && S.lastSeen[viewer][y][x];
    return !!(ls && ls.terr);
  }

  function projectRadar(radar, owner) {
    const mx = radar.x;
    const my = MAP - 1 - radar.y;
    const land = landTiles(1 - owner);
    if (!land.length) {
      return {
        x: Math.max(0, Math.min(MAP - 1, mx)),
        y: Math.max(0, Math.min(MAP - 1, my))
      };
    }
    let best = land[0], bd = 1e9;
    for (const t of land) {
      const dx = t.x - mx, dy = t.y - my;
      let d = dx * dx + dy * dy;
      if (!S.fog[owner][t.y][t.x]) d *= 0.5;
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }

  function radarSweep(owner) {
    const radars = S.buildings.filter((b) => b.owner === owner && b.type === "radar" && b.hp > 0 && !b.offline);
    for (const r of radars) {
      const scan = projectRadar(r, owner);
      reveal(owner, scan.x, scan.y, 3 + r.lvl + (cmdrFor(owner).radarR || 0), { radar: true, disc: true });
    }
  }

  function tickEconomy(first) {
    for (const o of [0, 1]) {
      const p = S.players[o];
      let inc = 150 + (cmdrFor(o).drip || 0);
      let people = 0;
      for (const b of S.buildings) {
        if (b.owner !== o || b.hp <= 0 || b.offline || b.wrecked) continue;
        if (b.type === "econ") {
          inc += Math.round((90 + (b.lvl - 1) * 25 + (cmdrFor(o).econ || 0)) * auraMul(o, b.x, b.y, "mint"));
        }
        if (b.type === "energy") {
          const add = Math.round((1 + (b.lvl - 1) + (cmdrFor(o).fuelTick || 0)) * auraMul(o, b.x, b.y, "depot"));
          p.fuel = Math.min(24, p.fuel + add);
        }
        if (b.type === "city") people += 1;
        if (b.cd > 0) b.cd--;
      }
      if (S.players[o].satCD > 0) S.players[o].satCD--;
      p.credits += inc;
      p.stats.income += inc;
      p.people = (p.people || 0) + people;
      void first;
      const pw = powerBudget(o);
      const ok = pw.have >= pw.need;
      for (const b of S.buildings) {
        if (b.owner !== o) continue;
        if (BLD[b.type].pwr > 0) b.offline = !ok && S.turn > 1;
      }
    }
  }

  function canAfford(owner, cred, fuel) {
    const p = S.players[owner];
    return p.credits >= cred && p.fuel >= fuel;
  }
  function pay(owner, cred, fuel, people) {
    S.players[owner].credits -= cred || 0;
    S.players[owner].fuel -= fuel || 0;
    if (people) S.players[owner].people = Math.max(0, (S.players[owner].people || 0) - people);
    S.players[owner].stats.spent += cred || 0;
  }

  function canBuild(type, owner, x, y) {
    if (!inB(x, y)) return "Off the map.";
    if (!onHome(owner, x, y)) return "Build only on your half.";
    const terr = S.tiles[y][x];
    const under = buildingAt(x, y);
    const overPad = !!(under && under.type === "pad" && under.owner === owner && type !== "pad");
    if (type === "pad") {
      if (terr !== "water" && terr !== "pontoon") return "Reclaim pads go on water.";
    } else if (terr === "water" && !overPad) {
      return "Need land. Drop a 50c Reclaim Pad on the water first.";
    }
    if (occupied(x, y) && !overPad) return "Tile occupied.";
    if (!unlocked(BLD[type].unlock)) return "Locked.";
    if ((BLD[type].cost || 0) > 0 && S.players[owner].credits < BLD[type].cost) return "Not enough credits.";
    if ((BLD[type].people || 0) > 0 && (S.players[owner].people || 0) < BLD[type].people) {
      return "Need " + BLD[type].people + " People. Raise City Squares.";
    }
    const terrErr = terrainAllows(type, terr === "water" ? "pontoon" : terr);
    if (terrErr) return terrErr;
    if (type === "hq") {
      if (S.phase !== "deploy") return "Command centres are already locked in.";
      if (countB("hq", owner) >= 3) return "All 3 command centres are placed. Pick one up to move it.";
      return null;
    }
    if (S.phase === "deploy") return "Lock your 3 HQs first.";
    if (!inBuildNet(owner, x, y)) {
      return "Out of command range. Expand from an HQ or a linked building.";
    }
    return null;
  }

  function reachOf(b) {
    if (b.wrecked || b.hp <= 0) return 0;
    if (b.type === "hq") return 4 + b.lvl;
    if (b.type === "relay") return 8 + 2 * b.lvl;
    if (b.type === "pad") return 2 + Math.max(0, (b.lvl || 1) - 1);
    return 1;
  }
  function cheb(a, x, y) {
    return Math.max(Math.abs(a.x - x), Math.abs(a.y - y));
  }
  const AURA_R = 3;
  const AURA_TYPES = ["warhall", "bastion", "mint", "depot", "grid"];
  function liveAura(b) {
    return !!(b && b.hp > 0 && !b.wrecked && !b.offline);
  }
  function auraReach(b) {
    return AURA_R + Math.max(0, (b.lvl || 1) - 1);
  }
  function auraStacks(owner, x, y, type) {
    let n = 0;
    for (const b of S.buildings) {
      if (b.owner !== owner || b.type !== type || !liveAura(b)) continue;
      if (cheb(b, x, y) <= auraReach(b)) n++;
    }
    return n;
  }
  function auraMul(owner, x, y, type) {
    return 1 + 0.5 * auraStacks(owner, x, y, type);
  }
  function defenseTaken(owner, x, y) {
    return 1 / auraMul(owner, x, y, "bastion");
  }
  function inBuildNet(owner, x, y) {
    for (const b of S.buildings) {
      if (b.owner !== owner || b.hp <= 0) continue;
      if (cheb(b, x, y) <= reachOf(b)) return true;
    }
    return false;
  }

  function terrainAllows(type, terr) {
    if (terr === "water") {
      if (type === "pad") return null;
      return "Need land.";
    }
    if (terr === "pontoon") return null;
    if (terr === "hills") {
      if (type === "gun" || type === "aa" || type === "mine") return null;
      return "Mountains: gun pods, AA launchers, and mines only.";
    }
    if (terr === "forest") {
      if (type === "hq" || type === "factory" || type === "hangar" || type === "silo" || type === "icbm" || type === "sat" || type === "econ" || type === "city") {
        return "Forest is too dense. Use plains for HQs, cities, and industry. Guns, mines, radar, energy, shields, EMP, AA, decoys, Forums OK.";
      }
      return null;
    }
    if (type === "hq" && terr !== "plains" && terr !== "ruins" && terr !== "desert") {
      return "Command centres need plains, ruins, or desert.";
    }
    if (type === "city" && terr !== "plains" && terr !== "ruins" && terr !== "desert") {
      return "City Squares need plains, ruins, or desert.";
    }
    if (type === "relay" && terr === "hills") return "Relays cannot sit on mountains.";
    return null;
  }

  function tryBuild(type, owner, x, y) {
    const err = canBuild(type, owner, x, y);
    if (err) { if (owner === me()) { toast(err); fx("error"); } return false; }
    const under = buildingAt(x, y);
    if (under && under.type === "pad" && type !== "pad") {
      S.buildings = S.buildings.filter((b) => b.id !== under.id);
    }
    pay(owner, BLD[type].cost || 0, 0, BLD[type].people || 0);
    const made = spawnB(type, owner, x, y);
    if (type === "pad" || S.tiles[y][x] === "water") { S.tiles[y][x] = "pontoon"; touchTerrain(); }
    log(`${sideName(owner)} ${agree(owner, "raise")} ${an(BLD[type].name)} at ${x},${y}.`);
    void made;
    if (owner === me()) fx("build");
    return true;
  }

  function tryUpgrade(b) {
    if (!b || b.lvl >= 3) return;
    const cred = BLD[b.type].cost ? Math.round(BLD[b.type].cost * 0.55 * b.lvl) : 0;
    const peo = BLD[b.type].people ? 25 * b.lvl : 0;
    if (cred && S.players[b.owner].credits < cred) { if (b.owner === me()) toast("Need " + cred + "c to upgrade."); return; }
    if (peo && (S.players[b.owner].people || 0) < peo) { if (b.owner === me()) toast("Need " + peo + " People to upgrade."); return; }
    pay(b.owner, cred, 0, peo);
    b.lvl++;
    b.max += 25; b.hp += 25;
    log(`Upgrade ${BLD[b.type].name} → Mk${b.lvl}${peo ? " (aura " + auraReach(b) + ")" : ""}.`);
  }

  function repairCost(b) {
    const base = BLD[b.type].cost || (BLD[b.type].people ? 100 : 80);
    return Math.max(10, Math.round(base * 0.25));
  }
  function tryRepair(b) {
    if (!b) return;
    if (!b.wrecked && b.hp >= b.max) { if (b.owner === me()) toast("Already at full integrity."); return; }
    if (b.repairTick) { if (b.owner === me()) toast("Already repairing this turn — 25% per turn."); return; }
    const cost = repairCost(b);
    if (S.players[b.owner].credits < cost) { if (b.owner === me()) toast("Need " + cost + "c (25% of build cost) to repair."); return; }
    pay(b.owner, cost, 0);
    const heal = Math.max(1, Math.round(b.max * 0.25)) + (cmdrFor(b.owner).heal || 0);
    b.hp = Math.min(b.max, (b.hp || 0) + heal);
    if (b.hp > 0) b.wrecked = false;
    b.offline = false;
    b.repairTick = true;
    log(`Repair crew on ${BLD[b.type].name} +${heal} HP (${cost}c).`);
    if (b.owner === me()) fx("build");
  }
  function tryBulldoze(b) {
    if (!b || b.owner !== me()) return;
    if (b.type === "hq") { toast("Cannot bulldoze a Command Centre."); fx("error"); return; }
    S.buildings = S.buildings.filter((x) => x.id !== b.id);
    log(`Bulldozed ${BLD[b.type].name}. No salvage.`);
    fx("emp");
    sel = { x: b.x, y: b.y };
  }

  function tryTrain(b, utype) {
    if (!b || (b.type !== "factory" && b.type !== "hangar")) return;
    const def = UNIT[utype];
    if (!def) return;
    const pad = UNIT_PAD[utype];
    if (pad && b.type !== pad && !(utype === "marine" && (b.type === "factory" || b.type === "hangar"))) {
      if (b.owner === me()) toast("Train that kit from a " + BLD[pad].name + ".");
      return;
    }
    if (utype !== "marine" && !unlocked(utype)) { if (b.owner === me()) toast(def.name + " locked."); return; }
    const cost = UNIT_COST[utype] || 70;
    if (S.players[b.owner].credits < cost) { if (b.owner === me()) toast("Need credits."); return; }
    const wetOk = def.air || def.amphib;
    const n = neighbors(b.x, b.y).find((t) => inB(t.x, t.y) && (wetOk || S.tiles[t.y][t.x] !== "water") && !occupied(t.x, t.y));
    if (!n) { if (b.owner === me()) toast("No free adjacent tile."); return; }
    pay(b.owner, cost, 0);
    const nu = spawnU(utype, b.owner, n.x, n.y);
    unitLook(nu);
    log(`Trained ${def.name}.`);
  }

  function neighbors(x, y) {
    return [{ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }];
  }

  function launcherOf(kind) {
    if (kind === "missile") return "silo";
    if (kind === "icbm") return "icbm";
    if (kind === "drop" || kind === "tankdrop" || kind === "airstrike" || kind === "jetdrop" || kind === "hoverdrop" || kind === "artydrop") return "hangar";
    if (kind === "emp") return "emp";
    if (kind === "scout" || kind === "dronedrop") return "factory";
    return null;
  }
  function padReady(b) {
    if (!b) return false;
    if (b.boundUid) {
      const u = S.units.find((x) => x.id === b.boundUid && x.hp > 0);
      if (u) return false;
    }
    if (b.rearmTurn && S.turn < b.rearmTurn) return false;
    return true;
  }
  function livePads(owner, type) {
    return S.buildings.filter((b) => {
      if (b.owner !== owner || b.type !== type || b.hp <= 0 || b.wrecked || b.offline) return false;
      if (type === "hangar" || type === "factory") return padReady(b);
      return true;
    });
  }
  function markSortie(q, unit) {
    const pad = q.pad && S.buildings.find((b) => b.id === q.pad);
    if (!pad) return;
    const occupy = ["drop", "tankdrop", "scout", "dronedrop", "hoverdrop", "jetdrop", "artydrop"].includes(q.kind);
    if (occupy && unit && unit.hp > 0) {
      pad.boundUid = unit.id;
      unit.fromPad = pad.id;
      pad.rearmTurn = 0;
    } else {
      pad.boundUid = null;
      pad.rearmTurn = S.turn + 2;
    }
  }
  function tickSorties() {
    for (const b of S.buildings) {
      if (!b.boundUid) continue;
      const u = S.units.find((x) => x.id === b.boundUid && x.hp > 0);
      if (!u) {
        b.boundUid = null;
        b.rearmTurn = S.turn + 1;
      }
    }
  }
  function queuedPads(owner, type) {
    return S.queue.filter((q) => q.owner === owner && launcherOf(q.kind) === type).length;
  }
  function probeCap(owner) {
    return 2 + livePads(owner, "radar").length + (cmdrFor(owner).probe || 0);
  }
  function shotsLeft(owner, kind) {
    if (kind === "probe") return Math.max(0, probeCap(owner) - S.queue.filter((q) => q.owner === owner && q.kind === "probe").length);
    const type = launcherOf(kind);
    if (!type) return 1;
    return Math.max(0, livePads(owner, type).length - queuedPads(owner, type));
  }
  function claimPad(owner, kind) {
    const type = launcherOf(kind);
    if (!type) return null;
    const used = new Set(S.queue.filter((q) => q.owner === owner && q.pad).map((q) => q.pad));
    return livePads(owner, type).find((b) => !used.has(b.id)) || null;
  }

  function queueStrike(owner, kind, x, y) {
    const w = WPN[kind];
    if (!w) return false;
    const fail = (msg) => { if (owner === me()) toast(msg); return false; };
    if (w.unlock && !unlocked(w.unlock)) return fail("Weapon locked.");
    if (kind === "probe" && shotsLeft(owner, "probe") <= 0) return fail("Probe limit this salvo (2 + radars).");
    const pad = claimPad(owner, kind);
    if (launcherOf(kind) && !pad) {
      const t = launcherOf(kind);
      const any = S.buildings.some((b) => b.owner === owner && b.type === t && b.hp > 0 && !b.wrecked);
      if ((t === "hangar" || t === "factory") && any) {
        return fail(BLD[t].name + " is in the field or rearming — back one full turn after that unit dies.");
      }
      return fail("No free " + BLD[t].name + " this salvo — one shot per live pad.");
    }
    if (w.need && !livePads(owner, w.need).length) return fail("Need a live " + BLD[w.need].name + ".");
    const fuelNeed = Math.max(0, w.fuel - (kind === "emp" ? (cmdrFor(owner).empFuel || 0) : 0));
    if (!canAfford(owner, w.cost, fuelNeed)) return fail("Need credits/fuel.");
    if (w.sat) {
      if (S.players[owner].satCD > 0) return fail("Satellite recharging (" + S.players[owner].satCD + ").");
      pay(owner, w.cost, fuelNeed);
      for (let yy = 0; yy < MAP; yy++) for (let xx = 0; xx < MAP; xx++) {
        if (!onHome(owner, xx, yy)) reveal(owner, xx, yy, 0);
      }
      S.players[owner].satCD = 4;
      log(sideName(owner) + " spy satellite paints the theatre.");
      if (owner === me()) fx("radar");
      paintUI();
      return true;
    }
    if (!inB(x, y)) return fail("Pick a target tile.");
    if (onHome(owner, x, y)) {
      if (owner === me()) sel = { x, y };
      return fail("Strike the fogged enemy island — not your own.");
    }
    pay(owner, w.cost, fuelNeed);
    S.queue.push({ owner, kind, x, y, pad: pad ? pad.id : null });
    log(`${sideName(owner)} ${agree(owner, "queue")} ${an(lc(w.name))} at ${x},${y}.`);
    if (owner === me()) fx(w.spawn ? "drop" : (kind === "probe" ? "probe" : "launch"));
    return true;
  }

  function endDeploy() {
    if (S.phase !== "deploy") return;
    if (hqCount(me()) < 3) {
      toast("Place all 3 Command Centres before locking.");
      fx("error");
      return;
    }
    if (S.mode === "hotseat" && S.actor === 0) {
      fx("phase");
      showPass(
        "Hand the keyboard to the northern commander. They place 3 Command Centres on their island — same staging as the south.",
        () => {
          S.actor = 1;
          tool = "hq";
          weapon = null;
          sel = null;
          focusHomeLand(1);
          log("Northern commander — deploy 3 Command Centres.");
          paintUI();
        }
      );
      return;
    }
    const startSouth = S.mode === "hotseat";
    if (startSouth) S.actor = 0;
    tickEconomy(true);
    for (const o of [0, 1]) radarSweep(o);
    S.phase = "defense";
    tool = null; weapon = null;
    fx("phase");
    if (startSouth) {
      showPass("Both command nets are live. Southern commander: fortify first.", () => {
        focusHomeLand(0);
        log("Command net live. Southern commander — Defense.");
        paintUI();
      });
      return;
    }
    log("Command net live. Fortify the island.");
    paintUI();
  }

  function showPass(msg, then) {
    overlayMode = "help";
    showOverlay(`
      <h2>Pass the keyboard</h2>
      <p>${msg}</p>
      <div class="row"><button class="btn gold" id="ok">Ready</button></div>
    `);
    $("ok").onclick = () => {
      hideOverlay();
      overlayMode = null;
      if (then) then();
    };
  }

  function endDefense() {
    if (S.phase !== "defense") return;
    S.phase = "offense";
    tool = null; weapon = "probe";
    log("Offense phase — probe the fog or fire what you built.");
    fx("phase");
    paintUI();
  }

  function endOffense() {
    if (S.phase !== "offense") return;
    startResolve("player");
  }

  function startResolve(who) {
    S.phase = "resolve";
    S.resolveWho = who;
    S.events = [];
    S.t = 0;
    S.fx = S.fx || [];
    const owner = who === "enemy" ? 1 : me();
    const shots = S.queue.filter((q) => q.owner === owner);
    let t = 16;
    for (const q of shots) {
      S.events.push({ at: t, kind: "shot", q });
      t += 36;
    }
    S.events.push({ at: t + 16, kind: "autoguns" });
    S.events.push({ at: t + 40, kind: "march" });
    S.events.push({ at: t + 68, kind: "done" });
    S.queue = S.queue.filter((q) => q.owner !== owner);
    for (const b of S.buildings) b.shotThis = false;
    log(who === "player" ? "Attack execution — watch the sky." : "Enemy salvo incoming.");
    paintUI();
  }

  function stepResolve() {
    if (S.phase !== "resolve") return;
    S.t++;
    const due = S.events.filter((e) => e.at === S.t);
    for (const e of due) {
      if (e.kind === "shot") fireShot(e.q);
      if (e.kind === "autoguns") autoCombat();
      if (e.kind === "march") marchUnits();
      if (e.kind === "done") {
        if (S.fx.some((f) => f.onEnd && f.life > 0)) S.events.push({ at: S.t + 1, kind: "done" });
        else finishResolve();
      }
    }
    S.fx = S.fx.filter((f) => {
      f.life--;
      if (f.life > 0) return true;
      if (typeof f.onEnd === "function") f.onEnd();
      return false;
    });
  }

  function aaCovering(defender, tx, ty) {
    return S.buildings.filter((b) => {
      if (b.owner !== defender || b.type !== "aa" || b.hp <= 0 || b.offline) return false;
      const hill = S.tiles[b.y][b.x] === "hills" ? 2 : 0;
      const range = 7 + b.lvl + hill + (cmdrFor(b.owner).aaRange || 0);
      return cheb(b, tx, ty) <= range;
    });
  }

  function rollIntercept(q) {
    const w = WPN[q.kind];
    if (!w) return null;
    const air = AIR_SHOTS.includes(q.kind);
    if (!air) return null;
    const defender = 1 - q.owner;
    const batteries = aaCovering(defender, q.x, q.y);
    if (!batteries.length) return null;
    let skill = 1;
    if (S.mode === "ai" && defender === 1) {
      skill = { easy: 0.72, normal: 1, hard: 1.18, insane: 1.32 }[S.diff] || 1;
    } else if (S.mode === "ai" && defender === 0) {
      skill = { easy: 1.08, normal: 1, hard: 0.95, insane: 0.9 }[S.diff] || 1;
    }
    let kindMul = 1;
    if (q.kind === "icbm") kindMul = 0.48;
    else if (q.kind === "airstrike") kindMul = 0.82;
    else if (q.kind === "drop" || q.kind === "tankdrop" || q.kind === "hoverdrop" || q.kind === "artydrop") kindMul = 0.62;
    else if (q.kind === "jetdrop" || q.kind === "dronedrop") kindMul = 0.78;
    else if (q.kind === "missile") kindMul = 1;
    for (const b of batteries) {
      if (b.shotThis) continue;
      const hill = S.tiles[b.y][b.x] === "hills" ? 0.08 : 0;
      const p = Math.min(0.92, (0.22 + 0.12 * b.lvl + hill) * skill * kindMul * auraMul(defender, b.x, b.y, "bastion"));
      if (S.R() < p) {
        b.shotThis = true;
        return b;
      }
    }
    return null;
  }

  function fireShot(q) {
    const w = WPN[q.kind];
    if (!w) return;
    const defender = 1 - q.owner;
    const padB = q.pad && S.buildings.find((b) => b.id === q.pad);
    const from = padB || nearestSilo(q.owner, q.kind) || hqCentroid(q.owner);
    const fly = 32;
    const intercepted = rollIntercept(q);
    const hx = intercepted ? from.x + (q.x - from.x) * 0.68 : q.x;
    const hy = intercepted ? from.y + (q.y - from.y) * 0.68 : q.y;
    S.fx.push({
      kind: (q.kind === "airstrike" || q.kind === "jetdrop" || q.kind === "dronedrop") ? "jet" : (WPN[q.kind] && WPN[q.kind].spawn) ? "drop" : "missile",
      x0: from.x, y0: from.y, x1: hx, y1: hy, life: fly, max: fly,
      onEnd: () => resolveImpact(q, intercepted, hx, hy)
    });
    if (w.emp) {
      /* EMP still flies then lands */
    }
  }

  function resolveImpact(q, aa, hx, hy) {
    const w = WPN[q.kind];
    if (!w) return;
    const defender = 1 - q.owner;
    if (aa) {
      log(`${w.name} intercepted by AA Mk${aa.lvl} at ${aa.x},${aa.y}.`);
      fx("aa");
      boom(hx, hy);
      reveal(q.owner, q.x, q.y, 1 + (cmdrFor(q.owner).reveal || 0));
      if (w.spawn || q.kind === "airstrike") markSortie(q, null);
      return;
    }
    if (w.emp) {
      S.players[defender].emp = 1;
      jamElectronics(defender);
      log("EMP silences " + sideName(defender) + " electronics until they finish their next salvo.");
      fx("emp");
      boom(q.x, q.y);
      return;
    }
    if (w.spawn) {
      let dropped = null;
      const mine = buildingAt(q.x, q.y);
      if (mine && mine.type === "mine" && mine.owner !== q.owner && !(UNIT[w.spawn] && UNIT[w.spawn].air)) {
        dropped = spawnU(w.spawn, q.owner, q.x, q.y);
        hurtU(dropped, 40, mine.owner);
        mine.hp = 0;
        mine.wrecked = false;
        S.buildings = S.buildings.filter((x) => x.id !== mine.id);
        log("Minefield detonates under the drop.");
        boom(q.x, q.y);
      } else if (occupied(q.x, q.y) && !unitAt(q.x, q.y)) {
        const n = neighbors(q.x, q.y).find((t) => inB(t.x, t.y) && !buildingAt(t.x, t.y));
        if (n) dropped = spawnU(w.spawn, q.owner, n.x, n.y);
        else log("Drop aborted — no landing zone.");
      } else if (unitAt(q.x, q.y)) {
        const n = neighbors(q.x, q.y).find((t) => inB(t.x, t.y) && !occupied(t.x, t.y));
        if (n) dropped = spawnU(w.spawn, q.owner, n.x, n.y);
      } else dropped = spawnU(w.spawn, q.owner, q.x, q.y);
      if (dropped && dropped.portage) log(`${UNIT[dropped.type].name} portaging — 3 turns on that water tile.`);
      if (dropped && dropped.hp > 0) unitLook(dropped);
      else reveal(q.owner, q.x, q.y, (UNIT[w.spawn] && UNIT[w.spawn].vision) || 2);
      markSortie(q, dropped && dropped.hp > 0 ? dropped : null);
      boom(q.x, q.y);
      return;
    }
    if (w.dmg) {
      let dmg = w.dmg;
      if (q.kind === "missile" || q.kind === "icbm") {
        const padB = q.pad && S.buildings.find((b) => b.id === q.pad);
        const ox = padB ? padB.x : q.x, oy = padB ? padB.y : q.y;
        dmg = Math.round(dmg * auraMul(q.owner, ox, oy, "warhall"));
      }
      applySplash(q.owner, q.x, q.y, dmg, w.r || 0);
    }
    reveal(q.owner, q.x, q.y, (w.reveal != null ? w.reveal : 1) + (w.r || 0) + (cmdrFor(q.owner).reveal || 0));
    if (q.kind === "airstrike") markSortie(q, null);
    boom(q.x, q.y);
  }

  function nearestSilo(owner, kind) {
    const need = WPN[kind].need;
    const list = S.buildings.filter((b) => b.owner === owner && b.hp > 0 && (need ? b.type === need : b.type === "silo" || b.type === "hangar" || b.type === "hq"));
    return list[0] || S.buildings.find((b) => b.owner === owner && b.type === "hq" && b.hp > 0);
  }
  function hqCentroid(owner) {
    const h = S.buildings.filter((b) => b.owner === owner && b.type === "hq" && b.hp > 0);
    if (!h.length) return { x: MAP >> 1, y: owner === 0 ? MAP - 4 : 3 };
    return { x: Math.round(h.reduce((a, b) => a + b.x, 0) / h.length), y: Math.round(h.reduce((a, b) => a + b.y, 0) / h.length) };
  }

  function applySplash(attacker, x, y, dmg, r) {
    const sh = S.buildings.find((b) => b.owner !== attacker && b.type === "shield" && b.hp > 0 && b.charges > 0 && dist(b, { x, y }) <= 2);
    if (sh) {
      sh.charges--;
      dmg = Math.max(0, dmg - 80);
      if (sh.charges <= 0) log("Shield generator exhausted.");
    }
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const tx = x + dx, ty = y + dy;
      if (!inB(tx, ty)) continue;
      const fall = 1 - Math.max(Math.abs(dx), Math.abs(dy)) * 0.28;
      const dealt = Math.round(dmg * Math.max(0.4, fall));
      const b = buildingAt(tx, ty);
      const u = unitAt(tx, ty);
      if (b && b.owner !== attacker) hurtB(b, dealt, attacker);
      if (u && u.owner !== attacker) hurtU(u, dealt, attacker);
    }
  }

  function hurtB(b, dmg, attacker) {
    if (b.offline && b.type === "shield") { /* still takes */ }
    dmg = Math.round(dmg * defenseTaken(b.owner, b.x, b.y));
    b.hp -= dmg;
    if (b.hp <= 0) {
      b.hp = 0;
      if (attacker != null && !b.wrecked) S.players[attacker].stats.bKill++;
      if (b.type === "hq") {
        log(`${BLD[b.type].name} destroyed.`);
        boom(b.x, b.y);
      } else if (!b.wrecked) {
        b.wrecked = true;
        log(`${BLD[b.type].name} wrecked. Repair to restore it.`);
        boom(b.x, b.y);
        if (b.type === "relay") log("Build radius collapsed around that relay.");
        if (b.fake || b.type === "fake") {
          for (const u of S.units) {
            if (u.hp > 0 && dist(u, b) <= 2 && u.owner !== b.owner) hurtU(u, 28, attacker);
          }
          log("Decoy HQ detonates!");
          b.wrecked = false;
        }
      }
    }
  }
  function hurtU(u, dmg, attacker) {
    dmg = Math.round(dmg * defenseTaken(u.owner, u.x, u.y));
    if (inB(u.x, u.y) && S.tiles[u.y][u.x] === "forest" && !(UNIT[u.type] && UNIT[u.type].air)) {
      dmg = Math.max(1, Math.round(dmg * 0.82));
    }
    u.hp -= dmg;
    if (u.hp <= 0) {
      u.hp = 0;
      if (attacker != null) S.players[attacker].stats.uKill++;
    }
  }

  function boom(x, y) {
    S.fx.push({ kind: "boom", x, y, life: 14, max: 14 });
    bang();
  }

  function autoCombat() {
    const guns = S.buildings.filter((b) => b.type === "gun" && b.hp > 0 && !b.offline && !b.wrecked);
    for (const g of guns) {
      const hill = S.tiles[g.y][g.x] === "hills";
      const foes = S.units.filter((u) => u.owner !== g.owner && u.hp > 0 && dist(u, g) <= 2 + (hill ? 1 : 0));
      if (!foes.length) continue;
      foes.sort((a, b) => dist(a, g) - dist(b, g));
      const tgt = foes[0];
      hurtU(tgt, Math.round((24 + (g.lvl - 1) * 4 + (hill ? 8 : 0) + (cmdrFor(g.owner).gun || 0)) * auraMul(g.owner, g.x, g.y, "bastion")), g.owner);
      S.fx.push({ kind: "tracer", x0: g.x, y0: g.y, x1: tgt.x, y1: tgt.y, life: 7, max: 7, hue: "#fbbf24" });
      S.fx.push({ kind: "muzzle", x: g.x, y: g.y, life: 5, max: 5 });
      S.fx.push({ kind: "flash", x: tgt.x, y: tgt.y, life: 8, max: 8 });
    }
    for (const g of S.buildings.filter((b) => b.type === "aa" && b.hp > 0 && !b.offline && !b.wrecked)) {
      const foes = S.units.filter((u) => u.owner !== g.owner && u.hp > 0 && UNIT[u.type] && UNIT[u.type].air && cheb(g, u.x, u.y) <= (7 + g.lvl + (S.tiles[g.y][g.x] === "hills" ? 2 : 0) + (cmdrFor(g.owner).aaRange || 0)));
      if (!foes.length) continue;
      foes.sort((a, b) => dist(a, g) - dist(b, g));
      const tgt = foes[0];
      hurtU(tgt, Math.round((18 + (g.lvl - 1) * 4) * auraMul(g.owner, g.x, g.y, "bastion")), g.owner);
      S.fx.push({ kind: "tracer", x0: g.x, y0: g.y, x1: tgt.x, y1: tgt.y, life: 7, max: 7, hue: "#fbbf24" });
      S.fx.push({ kind: "muzzle", x: g.x, y: g.y, life: 5, max: 5 });
      S.fx.push({ kind: "flash", x: tgt.x, y: tgt.y, life: 8, max: 8 });
    }
    for (const u of S.units.filter((x) => x.hp > 0)) {
      unitLook(u);
      const def = UNIT[u.type];
      if (!def.dmg) continue;
      const t = unitStrikeTarget(u);
      if (!t) continue;
      const melee = dist(t, u) <= 1;
      const dmg = melee ? def.mdmg : def.dmg;
      if (UNIT[t.type]) hurtU(t, dmg, u.owner);
      else hurtB(t, dmg, u.owner);
      const laser = u.type === "marine";
      S.fx.push({
        kind: laser ? "laser" : "tracer",
        x0: u.x, y0: u.y, x1: t.x, y1: t.y,
        life: laser ? 9 : 7, max: laser ? 9 : 7,
        hue: laser ? "#22d3ee" : "#fb923c"
      });
      S.fx.push({ kind: "muzzle", x: u.x, y: u.y, life: 6, max: 6, laser });
    }
    for (const u of S.units.filter((x) => x.hp > 0)) {
      const mine = buildingAt(u.x, u.y);
      if (mine && mine.type === "mine" && mine.owner !== u.owner && !mine.wrecked && !(UNIT[u.type] && UNIT[u.type].air)) {
        hurtU(u, 40, mine.owner);
        mine.hp = 0;
        mine.wrecked = false;
        S.buildings = S.buildings.filter((x) => x.id !== mine.id);
        boom(u.x, u.y);
      }
    }
  }

  function unitVision(u) {
    const def = UNIT[u.type];
    let v = (def && def.vision) || 0;
    if (u.type === "marine") v += (cmdrFor(u.owner).vision || 0);
    if (inB(u.x, u.y)) {
      const terr = S.tiles[u.y][u.x];
      if (terr === "hills") v += 1;
      if (terr === "forest" && !(def && def.air)) v = Math.max(1, v - 1);
    }
    return v;
  }
  function unitLook(u) {
    const r = unitVision(u);
    if (r > 0 && u.hp > 0) reveal(u.owner, u.x, u.y, r);
  }
  function strikePri(t) {
    if (!t) return 99;
    if (UNIT[t.type]) return 0;
    if (t.type === "hq") return 1;
    if (t.type === "gun" || t.type === "aa" || t.type === "mine") return 2;
    if (t.type === "silo" || t.type === "icbm" || t.type === "warhall" || t.type === "hangar") return 3;
    return 4;
  }
  function unitStrikeTarget(u) {
    const def = UNIT[u.type];
    if (!def || !def.dmg) return null;
    let range = Math.max(def.range || 1, 1);
    if (inB(u.x, u.y) && S.tiles[u.y][u.x] === "hills") range += 1;
    const list = [
      ...S.units.filter((o) => o.owner !== u.owner && o.hp > 0),
      ...S.buildings.filter((o) => o.owner !== u.owner && o.hp > 0)
    ].filter((t) => dist(t, u) <= range);
    list.sort((a, b) => strikePri(a) - strikePri(b) || dist(a, u) - dist(b, u));
    return list[0] || null;
  }
  function knownEnemyHQs(viewer) {
    const out = [];
    const seen = new Set();
    for (const b of S.buildings) {
      if (b.owner === viewer || b.type !== "hq" || b.hp <= 0) continue;
      if (!visible(viewer, b.x, b.y) && !(S.lastSeen[viewer][b.y] && S.lastSeen[viewer][b.y][b.x] && S.lastSeen[viewer][b.y][b.x].b)) continue;
      out.push(b);
      seen.add(b.x + "," + b.y);
    }
    for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
      if (onHome(viewer, x, y) || seen.has(x + "," + y)) continue;
      const ls = S.lastSeen[viewer][y] && S.lastSeen[viewer][y][x];
      if (ls && ls.b && ls.b.type === "hq") out.push({ x, y, type: "hq", ghost: true });
    }
    return out;
  }
  function fogHuntTile(u) {
    const foe = 1 - u.owner;
    let best = null, bd = 1e9, bu = 1e9;
    for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
      if (!onHome(foe, x, y)) continue;
      if (S.tiles[y][x] === "water" && !(UNIT[u.type] && (UNIT[u.type].air || UNIT[u.type].amphib))) continue;
      const unknown = !visible(u.owner, x, y) && !hasMemory(u.owner, x, y);
      const stale = !visible(u.owner, x, y) && hasMemory(u.owner, x, y);
      if (!unknown && !stale) continue;
      const d = dist(u, { x, y });
      const urg = unknown ? 0 : 1;
      if (urg < bu || (urg === bu && d < bd)) { bu = urg; bd = d; best = { x, y }; }
    }
    return best;
  }
  function unitObjective(u) {
    const hqs = knownEnemyHQs(u.owner);
    if (hqs.length) {
      hqs.sort((a, b) => dist(a, u) - dist(b, u));
      return hqs[0];
    }
    const hunt = fogHuntTile(u);
    if (hunt) return hunt;
    const blds = S.buildings.filter((b) => b.owner !== u.owner && b.hp > 0);
    if (blds.length) {
      blds.sort((a, b) => strikePri(a) - strikePri(b) || dist(a, u) - dist(b, u));
      return blds[0];
    }
    const foes = S.units.filter((o) => o.owner !== u.owner && o.hp > 0);
    if (foes.length) {
      foes.sort((a, b) => dist(a, u) - dist(b, u));
      return foes[0];
    }
    return null;
  }
  function stepToward(u, t) {
    const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    const def = UNIT[u.type] || {};
    const cost = (p) => {
      if (!inB(p.x, p.y)) return 1e6;
      const terr = S.tiles[p.y][p.x];
      let extra = 0;
      if (terr === "water") extra = (def.air || def.amphib) ? 0 : 3;
      else if (terr === "forest" && (u.type === "tank" || u.type === "arty")) extra = 1;
      else if (terr === "hills" && (u.type === "tank" || u.type === "arty")) extra = 1;
      return dist(p, t) + extra;
    };
    dirs.sort((a, b) => cost({ x: u.x + a.x, y: u.y + a.y }) - cost({ x: u.x + b.x, y: u.y + b.y }));
    for (const d of dirs) {
      const nx = u.x + d.x, ny = u.y + d.y;
      if (!inB(nx, ny)) continue;
      const blk = buildingAt(nx, ny);
      if (blk && blk.owner !== u.owner) continue;
      if (unitAt(nx, ny)) continue;
      return { x: nx, y: ny };
    }
    return null;
  }

  function marchUnits() {
    for (const u of S.units.filter((x) => x.hp > 0)) {
      const def = UNIT[u.type];
      unitLook(u);
      const flies = def.air || def.amphib;
      if (!flies && inB(u.x, u.y) && S.tiles[u.y][u.x] === "water") {
        u.portage = (u.portage > 0 ? u.portage : 3) - 1;
        if (u.portage > 0) continue;
        u.portage = 0;
      } else u.portage = 0;
      let steps = (def.move || 1) + (cmdrFor(u.owner).move || 0);
      if (inB(u.x, u.y) && (S.tiles[u.y][u.x] === "forest" || S.tiles[u.y][u.x] === "hills") && (u.type === "tank" || u.type === "arty")) {
        steps = Math.max(1, steps - 1);
      }
      for (let s = 0; s < steps; s++) {
        if (def.dmg && unitStrikeTarget(u)) break;
        const t = unitObjective(u);
        if (!t) break;
        const step = stepToward(u, t);
        if (!step) break;
        u.x = step.x; u.y = step.y;
        if (!flies && S.tiles[u.y][u.x] === "water") {
          u.portage = 3;
          break;
        }
        u.portage = 0;
        unitLook(u);
      }
    }
  }

  function finishResolve() {
    for (const b of S.buildings) {
      if (b.hp <= 0 && b.type !== "hq" && b.type !== "fake") b.wrecked = true;
    }
    S.buildings = S.buildings.filter((b) => (b.type === "hq" || b.type === "fake") ? b.hp > 0 : true);
    S.units = S.units.filter((u) => u.hp > 0);
    const actor = S.resolveWho === "enemy" ? 1 : me();
    S.players[actor].emp = 0;
    const pHQ = hqCount(0), eHQ = hqCount(1);
    if (pHQ <= 0 || eHQ <= 0) {
      S.over = pHQ <= 0 && eHQ <= 0 ? "draw" : (pHQ > 0 ? "win" : "lose");
      S.phase = "end";
      tally();
      paintUI();
      fx(S.over === "win" ? "win" : "lose");
      showEnd();
      return;
    }
    if (S.mode === "ai") {
      if (S.resolveWho !== "enemy") enemyTurn();
      else nextTurn();
      return;
    }
    if (S.actor === 0) {
      showPass("Northern commander: Defense, then Offense.", () => {
        S.actor = 1;
        S.phase = "defense";
        tool = null; weapon = null;
        focusHomeLand(1);
        log("Hot-seat — northern commander, fortify.");
        paintUI();
      });
    } else {
      showPass("Southern commander: new turn. Defense first.", () => {
        S.actor = 0;
        nextTurn();
      });
    }
  }

  function nextTurn() {
    S.turn++;
    tickSorties();
    S.phase = "defense";
    for (const o of [0, 1]) {
      for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
        if (!onHome(o, x, y) && S.fogAge[o][y][x] && S.fogAge[o][y][x] < S.turn) {
          S.fog[o][y][x] = false;
        }
      }
    }
    touchTerrain();
    for (const u of S.units) if (u.hp > 0) unitLook(u);
    for (const b of S.buildings) b.offline = false;
    tickEconomy(false);
    reapplyEmp();
    for (const o of [0, 1]) radarSweep(o);
    maybeSwitchAI();
    tool = null; weapon = null;
    for (const b of S.buildings) {
      b.repairTick = false;
      if (!b.wrecked && b.hp > 0 && b.type === "shield" && b.charges < 2 + (cmdrFor(b.owner).shield || 0)) b.charges++;
    }
    log(`Turn ${S.turn}. Defense — fortify the island.`);
    paintUI();
  }

  function maybeSwitchAI() {
    const d = DIFF[S.diff];
    if (S.R() > d.switch) return;
    const intel = aiContacts(1);
    const seenHq = intel.some((c) => c.b && c.b.type === "hq");
    const losing = hqCount(1) < hqCount(0) || countB("silo", 1) + countB("aa", 1) < 2;
    if (losing) S.ai.profile = "Aggressor";
    else if (!seenHq) S.ai.profile = "Intelligence";
    else S.ai.profile = S.R() > 0.5 ? "Turtle" : "Economist";
    S.ai.switches++;
    log(`Enemy doctrine shifts → ${S.ai.profile}.`);
  }

  function enemyTurn() {
    S.phase = "enemy";
    paintUI();
    aiDefense();
    aiOffense();
    if (enemyTimer) clearTimeout(enemyTimer);
    enemyTimer = setTimeout(() => {
      enemyTimer = 0;
      if (S && S.phase === "enemy") startResolve("enemy");
    }, 900);
  }

  function aiContacts(viewer) {
    const list = [];
    for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
      if (onHome(viewer, x, y)) continue;
      if (S.fog[viewer][y][x]) {
        const b = buildingAt(x, y);
        list.push({
          x, y, live: true, terr: S.tiles[y][x],
          b: b && b.owner !== viewer ? b : null,
          u: unitAt(x, y)
        });
      } else if (hasMemory(viewer, x, y)) {
        const ls = S.lastSeen[viewer][y][x];
        list.push({
          x, y, live: false, terr: ls.terr,
          b: ls.b ? { type: ls.b.type, hp: ls.b.hp, max: 200, owner: 1 - viewer } : null
        });
      }
    }
    return list;
  }

  function aiTargetValue(c) {
    if (!c || !c.b) return 0;
    const t = c.b.type;
    const tab = {
      hq: 100, icbm: 78, silo: 70, hangar: 66, relay: 62, aa: 58,
      radar: 52, sat: 50, emp: 46, econ: 42, energy: 36, factory: 32,
      city: 50, warhall: 60, bastion: 55, mint: 48, depot: 40, grid: 44, pad: 22,
      shield: 28, gun: 18, mine: 8, fake: 100
    };
    let s = tab[t] || 10;
    if (c.live && c.b.hp && c.b.max) s += (1 - c.b.hp / c.b.max) * 12;
    if (!c.live) s *= 0.72;
    return s;
  }

  function aiPickSpots(type, owner, minSep) {
    const hqs = S.buildings.filter((b) => b.owner === owner && b.type === "hq" && b.hp > 0);
    const legal = [];
    if (type === "pad") {
      for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
        if (!onHome(owner, x, y)) continue;
        const terr = S.tiles[y][x];
        if (terr !== "water" && terr !== "pontoon") continue;
        if (occupied(x, y) || !inBuildNet(owner, x, y)) continue;
        legal.push({ x, y });
      }
    } else {
      for (const t of landTiles(owner)) {
        if (occupied(t.x, t.y) || terrainAllows(type, S.tiles[t.y][t.x]) || !inBuildNet(owner, t.x, t.y)) continue;
        legal.push(t);
      }
    }
    const score = (t) => {
      const terr = S.tiles[t.y][t.x];
      const hqD = hqs.length ? Math.min(...hqs.map((h) => dist(h, t))) : 8;
      const same = S.buildings.filter((b) => b.owner === owner && b.type === type && b.hp > 0 && dist(b, t) < minSep).length;
      const crowd = S.buildings.filter((b) => b.owner === owner && (b.hp > 0 || b.wrecked) && dist(b, t) < 2).length;
      const rear = owner === 1 ? (MAP - 1 - t.y) : t.y;
      const front = owner === 1 ? t.y : (MAP - 1 - t.y);
      let s = -same * 14 - crowd * 5 + S.R() * 3;
      if (type === "energy" || type === "econ" || type === "silo" || type === "icbm" || type === "hangar" || type === "factory") {
        s += rear * 1.2 + hqD * 0.8;
      } else if (type === "aa" || type === "gun" || type === "shield" || type === "mine") {
        s += 10 - hqD * 2 + front * 0.15;
        if ((type === "gun" || type === "aa") && terr === "hills") s += 22;
      } else if (type === "relay") {
        s += hqD * 1.6 - same * 8;
      } else if (type === "radar") {
        s += 4 - same * 12;
        const rads = S.buildings.filter((b) => b.owner === owner && b.type === "radar" && b.hp > 0);
        if (rads.length) s += Math.min(...rads.map((r) => Math.abs(r.x - t.x)));
      } else if (type === "fake") {
        s += 8 - hqD * 3;
      } else if (type === "emp") {
        s += rear * 0.5;
      } else if (type === "city") {
        s += rear * 1.1 + hqD * 0.4;
      } else if (type === "mint") {
        const ecos = S.buildings.filter((b) => b.owner === owner && b.type === "econ" && b.hp > 0);
        s += ecos.length ? 20 - Math.min(...ecos.map((e) => dist(e, t))) * 3 : -8;
      } else if (type === "warhall") {
        const pads = S.buildings.filter((b) => b.owner === owner && (b.type === "silo" || b.type === "icbm") && b.hp > 0);
        s += pads.length ? 22 - Math.min(...pads.map((e) => dist(e, t))) * 3 : -6;
      } else if (type === "bastion") {
        s += 12 - hqD * 2.2;
      } else if (type === "depot" || type === "grid") {
        const plants = S.buildings.filter((b) => b.owner === owner && b.type === "energy" && b.hp > 0);
        s += plants.length ? 18 - Math.min(...plants.map((e) => dist(e, t))) * 3 : -6;
      } else if (type === "pad") {
        s += front * 0.4 + (S.tiles[t.y][t.x] === "water" ? 8 : 0);
      }
      if ((type === "econ" || type === "city") && (terr === "plains" || terr === "desert")) s += 4;
      return s;
    };
    legal.sort((a, b) => score(b) - score(a));
    return legal;
  }

  function aiPlace(type, owner) {
    if (!BLD[type]) return false;
    if ((BLD[type].cost || 0) > 0 && S.players[owner].credits < BLD[type].cost) return false;
    if ((BLD[type].people || 0) > 0 && (S.players[owner].people || 0) < BLD[type].people) return false;
    if (BLD[type].unlock && !unlocked(BLD[type].unlock)) return false;
    const sep = type === "gun" || type === "mine" || type === "aa" || AURA_TYPES.includes(type) ? 2 : 3;
    const spots = aiPickSpots(type, owner, sep);
    if (!spots.length) return false;
    return tryBuild(type, owner, spots[0].x, spots[0].y);
  }

  function aiDefense() {
    const o = 1;
    const profile = S.ai.profile;
    for (const w of S.buildings.filter((b) => b.owner === o && (b.wrecked || b.hp < b.max * 0.7))) tryRepair(w);
    const n = (t) => countB(t, o);
    const hqN = Math.max(1, hqCount(o));
    const peo = S.players[o].people || 0;
    const plan = [];
    if (n("energy") < 2) plan.push("energy", "energy");
    else if (n("energy") < 3 + (profile === "Economist" ? 1 : 0)) plan.push("energy");
    if (n("econ") < (profile === "Economist" ? 4 : 2)) plan.push("econ");
    if (n("city") < 1) plan.push("city");
    else if (n("city") < (profile === "Economist" ? 3 : 2) && S.turn >= 2) plan.push("city");
    if (n("relay") < 1 + Math.floor(S.turn / 3)) plan.push("relay");
    if (n("pad") < 3 + Math.floor(MAP / 40)) plan.push("pad");
    if (n("aa") < hqN) plan.push("aa");
    if (n("gun") < hqN) plan.push("gun");
    if (n("radar") < (profile === "Intelligence" ? 3 : 1)) plan.push("radar");
    if (profile === "Aggressor") plan.push("silo", "hangar", "silo", "factory");
    else if (profile === "Turtle") plan.push("aa", "shield", "gun", "mine", "fake");
    else if (profile === "Economist") plan.push("econ", "energy", "silo");
    else plan.push("radar", "emp", "aa", "silo");
    if (n("silo") < 1) plan.push("silo");
    if (unlocked("icbm") && S.turn >= 4 && n("icbm") < 1) plan.push("icbm");
    if (n("fake") < 1 && profile !== "Aggressor") plan.push("fake");
    if (peo >= 50) {
      if (profile === "Aggressor" || n("silo") + n("icbm") > 0) plan.push("warhall");
      if (profile === "Turtle" || n("hq") >= 1) plan.push("bastion");
      if (n("econ") > 0) plan.push("mint");
      if (n("energy") > 0) plan.push("grid", "depot");
      if (profile === "Economist") plan.push("mint", "grid");
    }
    const cap = (profile === "Turtle" ? 4 : 3) + (peo >= 50 ? 1 : 0);
    let built = 0;
    for (const type of plan) {
      if (built >= cap) break;
      if (aiPlace(type, o)) built++;
    }
    const fac = S.buildings.find((b) => b.owner === o && b.type === "factory" && b.hp > 0 && !b.wrecked);
    const hang = S.buildings.find((b) => b.owner === o && b.type === "hangar" && b.hp > 0 && !b.wrecked);
    if (fac && profile !== "Turtle") {
      if (unlocked("drone") && S.R() > 0.55) tryTrain(fac, "drone");
      else tryTrain(fac, "marine");
    }
    if (hang && profile === "Aggressor") {
      if (unlocked("jet") && S.R() > 0.6) tryTrain(hang, "jet");
      else if (unlocked("hover") && S.R() > 0.5) tryTrain(hang, "hover");
      else if (unlocked("arty") && S.R() > 0.45) tryTrain(hang, "arty");
      else if (unlocked("tank")) tryTrain(hang, "tank");
    }
  }

  function aiAssignTargets(contacts, n, maxStack) {
    const scored = contacts.filter((c) => c.b).map((c) => ({ c, s: aiTargetValue(c) }))
      .sort((a, b) => b.s - a.s);
    const out = [];
    const piled = {};
    let i = 0, guard = 0;
    while (out.length < n && scored.length && guard++ < 40) {
      const row = scored[i % scored.length];
      const key = row.c.x + "," + row.c.y;
      if ((piled[key] || 0) >= maxStack && scored.length > 1) { i++; continue; }
      piled[key] = (piled[key] || 0) + 1;
      out.push(row.c);
      i++;
    }
    return out;
  }

  function aiProbePlan(viewer, contacts) {
    const unknown = [];
    for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
      if (onHome(viewer, x, y)) continue;
      if (S.fog[viewer][y][x] || hasMemory(viewer, x, y)) continue;
      unknown.push({ x, y });
    }
    const seeds = contacts.filter((c) => c.b);
    unknown.sort((a, b) => {
      const da = seeds.length ? Math.min(...seeds.map((s) => dist(s, a))) : 99;
      const db = seeds.length ? Math.min(...seeds.map((s) => dist(s, b))) : 99;
      const ga = (a.x + a.y * 3) % 4;
      const gb = (b.x + b.y * 3) % 4;
      return da - db || ga - gb;
    });
    return unknown;
  }

  function aiOffense() {
    const o = 1;
    const contacts = aiContacts(o);
    const valued = contacts.filter((c) => c.b);
    const hqs = valued.filter((c) => c.b.type === "hq" || c.b.type === "fake");
    const aa = valued.filter((c) => c.b.type === "aa");
    const electronics = valued.filter((c) => ["radar", "aa", "silo", "icbm", "sat", "emp"].includes(c.b.type));
    const fire = (kind, t) => t && queueStrike(o, kind, t.x, t.y);
    const probes = aiProbePlan(o, contacts);

    const siloN = livePads(o, "silo").length;
    const missileTgts = valued.length ? aiAssignTargets(valued, siloN, 2) : [];
    if (missileTgts.length) {
      for (let i = 0; i < siloN; i++) fire("missile", missileTgts[i] || missileTgts[0]);
    } else {
      for (let i = 0; i < siloN; i++) fire("missile", probes[i] || probes[0]);
    }

    const icbmN = livePads(o, "icbm").length;
    if (icbmN && (hqs.length || S.turn >= 4)) {
      fire("icbm", hqs[0] || valued.sort((a, b) => aiTargetValue(b) - aiTargetValue(a))[0] || probes[0]);
    }

    if (livePads(o, "hangar").length) {
      const dropAt = hqs[0] || valued[0];
      let dropKind = "drop";
      if (unlocked("jet") && S.ai.profile === "Aggressor" && S.R() > 0.55) dropKind = "jetdrop";
      else if (unlocked("hover") && S.R() > 0.5) dropKind = "hoverdrop";
      else if (unlocked("tank") && dropAt && dropAt.b && dropAt.b.type === "hq") dropKind = "tankdrop";
      if (dropAt && (S.ai.profile === "Aggressor" || dropAt.b && dropAt.b.type === "hq")) fire(dropKind, dropAt);
      else if (S.ai.profile === "Aggressor") fire(dropKind, probes[0]);
    }
    if (livePads(o, "factory").length && unlocked("drone") && probes[0]) fire("dronedrop", probes[0]);

    if (livePads(o, "emp").length && electronics.length >= 2) {
      electronics.sort((a, b) => {
        const na = electronics.filter((e) => dist(e, a) <= 3).length;
        const nb = electronics.filter((e) => dist(e, b) <= 3).length;
        return nb - na;
      });
      fire("emp", electronics[0]);
    }

    let p = 0;
    while (shotsLeft(o, "probe") > 0 && S.players[o].credits >= 28 && probes[p]) {
      if (!fire("probe", probes[p])) break;
      p++;
    }
  }

  function tally() {
    const st = S.players[0].stats;
    const survive = S.buildings.filter((b) => b.owner === 0 && b.hp > 0).length;
    const eco = Math.round(st.income * 0.05);
    const timePen = S.turn * 8;
    let score = st.bKill * 10 + st.uKill * 2 + survive * 5 + eco - timePen;
    if (S.over === "win") score += 250 + S.campaign * 40;
    if (S.over === "draw") score = Math.round(score * 0.5);
    score = Math.max(0, Math.round(score * (1 + persist.prestige * 0.15)));
    S.score = score;
    persist.best = Math.max(persist.best, score);
    persist.board.push({
      name: persist.name || "Commander",
      score, diff: S.diff, campaign: S.campaign,
      result: S.over, date: new Date().toISOString().slice(0, 10),
      profile: S.ai.profile
    });
    persist.board.sort((a, b) => b.score - a.score);
    persist.board = persist.board.slice(0, 50);
    if (S.over === "win") {
      persist.wins++;
      persist.campaign++;
      persist.pts += 2 + Math.floor(S.campaign / 2);
      persist.prestige = Math.floor(persist.wins / 10);
      autoUnlock();
    }
    savePersist();
    if (S.over === "win" && S.mode === "ai") ledgerEnqueue(ledgerRecord());
  }

  function autoUnlock() {
    const map = { scout: 1, drone: 0, tank: 2, shield: 2, hover: 3, icbm: 3, arty: 4, emp: 4, airstrike: 5, jet: 5, sat: 6 };
    for (const [k, w] of Object.entries(map)) {
      if (persist.wins >= w) persist.unlocks[k] = true;
    }
  }

  function log(msg) {
    if (!S) return;
    S.log.unshift(`T${S.turn}  ${msg}`);
    S.log = S.log.slice(0, 80);
    const el = $("log");
    if (el) el.textContent = S.log.join("\n");
  }
  function toast(msg) {
    $("hint").textContent = msg;
    $("dockStatus").textContent = msg;
  }

  /* ---------- render ---------- */
  function focusOwner(o) {
    const c = hqCentroid(o);
    const w = worldIso(c.x, c.y);
    const cv = canvas();
    const cw = cv.clientWidth || 960;
    const ch = cv.clientHeight || 640;
    cam.z = Math.max(0.7, Math.min(1.4, ch / 720));
    cam.x = cw / 2 - w.sx * cam.z;
    cam.y = ch / 2 - w.sy * cam.z;
  }
  function focusHomeLand(owner) {
    const land = landTiles(owner);
    if (!land.length) return;
    const c = {
      x: land.reduce((a, t) => a + t.x, 0) / land.length,
      y: land.reduce((a, t) => a + t.y, 0) / land.length
    };
    const w = worldIso(c.x, c.y);
    const cv = canvas();
    const cw = cv.clientWidth || 960;
    const ch = cv.clientHeight || 640;
    cam.z = Math.max(0.38, Math.min(1.15, ch / (MAP * TH * 0.62)));
    cam.x = cw / 2 - w.sx * cam.z;
    cam.y = ch / 2 - w.sy * cam.z;
  }

  function draw() {
    const cv = canvas(), ctx = ctxOf();
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== (w * dpr | 0) || cv.height !== (h * dpr | 0)) {
      cv.width = w * dpr | 0; cv.height = h * dpr | 0;
      for (const k of Object.keys(PAT)) delete PAT[k];
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!S) {
      const sky0 = ctx.createLinearGradient(0, 0, 0, h);
      sky0.addColorStop(0, "#243656");
      sky0.addColorStop(0.35, "#121c2e");
      sky0.addColorStop(1, "#070b12");
      ctx.fillStyle = sky0;
      ctx.fillRect(0, 0, w, h);
      return;
    }
    const pad = TW * cam.z * 1.8;
    /* MAP and seed belong in the key: a new island reuses the same camera but
       not the same tile grid, and a stale visible-tile list would index it. */
    const viewKey = [cam.x | 0, cam.y | 0, cam.z, w, h, dpr, MAP, S.seed || ""].join(",");
    if (visKey !== viewKey || !visOrder) {
      const list = [];
      for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
        const p = iso(x, y);
        if (p.sx < -pad || p.sx > w + pad || p.sy < -pad || p.sy > h + pad) continue;
        list.push({ x, y, k: x + y });
      }
      list.sort((a, b) => a.k - b.k);
      visOrder = list; visKey = viewKey;
    }
    const order = visOrder;
    const key = viewKey + "|" + terrV;
    if (!terrCanvas || terrCanvas.width !== cv.width || terrCanvas.height !== cv.height) {
      terrCanvas = document.createElement("canvas");
      terrCanvas.width = cv.width; terrCanvas.height = cv.height;
      for (const k of Object.keys(PAT)) delete PAT[k];
      terrKey = "";
    }
    if (terrKey !== key) {
      const tctx = terrCanvas.getContext("2d");
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sky = tctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#243656");
      sky.addColorStop(0.35, "#121c2e");
      sky.addColorStop(1, "#070b12");
      tctx.fillStyle = sky;
      tctx.fillRect(0, 0, w, h);
      for (const t of order) drawTile(tctx, t.x, t.y);
      terrKey = key;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(terrCanvas, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (S.phase === "defense" && tool && tool !== "hq") {
      for (const t of order) {
        if (!onHome(me(), t.x, t.y) || !inBuildNet(me(), t.x, t.y)) continue;
        const terr = S.tiles[t.y][t.x];
        if (tool === "pad") {
          if ((terr !== "water" && terr !== "pontoon") || occupied(t.x, t.y)) continue;
          drawDiamondLift(ctx, t.x, t.y, "rgba(56,189,248,.55)");
          continue;
        }
        const under = buildingAt(t.x, t.y);
        const overPad = under && under.type === "pad" && under.owner === me();
        if (terr === "water" && !overPad) continue;
        if (occupied(t.x, t.y) && !overPad) continue;
        if (terrainAllows(tool, overPad ? "pontoon" : terr)) continue;
        drawDiamondLift(ctx, t.x, t.y, "rgba(52,211,153,.45)");
      }
    }
    drawAuraOverlay(ctx, order);
    for (const t of order) drawOcc(ctx, t.x, t.y);
    for (const f of S.fx) drawFx(ctx, f);
    if (hover && inB(hover.x, hover.y)) drawDiamondLift(ctx, hover.x, hover.y, "rgba(34,211,238,.95)");
    if (sel) drawDiamondLift(ctx, sel.x, sel.y, "rgba(251,191,36,.95)");
    tFrame++;
  }

  function auraColor(type) {
    return {
      warhall: "rgba(251,146,60,.42)",
      bastion: "rgba(56,189,248,.42)",
      mint: "rgba(250,204,21,.42)",
      depot: "rgba(251,191,36,.35)",
      grid: "rgba(45,212,191,.42)"
    }[type] || "rgba(167,139,250,.35)";
  }
  function drawAuraOverlay(ctx, order) {
    let src = null, type = null;
    const b = sel && inB(sel.x, sel.y) ? buildingAt(sel.x, sel.y) : null;
    if (b && b.owner === me() && AURA_TYPES.includes(b.type) && liveAura(b)) {
      src = b; type = b.type;
    } else if (S.phase === "defense" && tool && AURA_TYPES.includes(tool) && hover && inB(hover.x, hover.y) && onHome(me(), hover.x, hover.y)) {
      src = { x: hover.x, y: hover.y, lvl: 1 }; type = tool;
    }
    if (!src) return;
    const r = auraReach(src);
    const col = auraColor(type);
    for (const t of order) {
      if (cheb(src, t.x, t.y) <= r) drawDiamondLift(ctx, t.x, t.y, col);
    }
  }
  function terrainColor(t) {
    return {
      plains: "#4d7330", hills: "#6e726c", forest: "#1d3d20",
      water: "#0e4a5c", ruins: "#6b645a", desert: "#c4a46a", pontoon: "#5c6773", fog: "#070c14"
    }[t] || "#0a121c";
  }
  function terrainShade(t, k) {
    const hex = terrainColor(t).slice(1);
    const n = parseInt(hex, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, r * (1 + k) | 0));
    g = Math.max(0, Math.min(255, g * (1 + k) | 0));
    b = Math.max(0, Math.min(255, b * (1 + k) | 0));
    return `rgb(${r},${g},${b})`;
  }

  function tileLiftAmt(terr, x, y) {
    if (terr === "water" || terr === "fog") return 0;
    let e = 1;
    if (S && x != null && inB(x, y)) {
      if (visible(me(), x, y) && S.elev) e = S.elev[y][x] || 1;
      else {
        const ls = S.lastSeen[me()][y] && S.lastSeen[me()][y][x];
        if (ls && ls.elev != null) e = ls.elev;
        else if (terr === "hills") e = 4;
        else if (terr === "forest" || terr === "ruins") e = 2;
        else e = 1;
      }
    } else if (terr === "hills") e = 4;
    else if (terr === "forest" || terr === "ruins") e = 2;
    if (terr === "pontoon") e = Math.max(1, e);
    return e * 6 * cam.z;
  }
  function visTerr(x, y) {
    const viewer = me();
    const vis = visible(viewer, x, y);
    const mem = hasMemory(viewer, x, y);
    if (!vis && !mem) return "fog";
    return vis ? S.tiles[y][x] : ((S.lastSeen[viewer][y] && S.lastSeen[viewer][y][x] && S.lastSeen[viewer][y][x].terr) || "fog");
  }
  function isoTop(x, y) {
    const p = iso(x, y);
    return { sx: p.sx, sy: p.sy - tileLiftAmt(visTerr(x, y), x, y) };
  }
  function hash01(x, y, k) {
    let n = (x * 374761393 + y * 668265263 + k * 1274126177) >>> 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
    return (n & 0xffff) / 65535;
  }

  function neighborLift(x, y) {
    if (!inB(x, y)) return 0;
    return tileLiftAmt(visTerr(x, y), x, y);
  }
  function drawCliffSides(ctx, x, y, terr, base, lift, tw, th) {
    const hw = tw / 2, hh = th / 2;
    const top = { sx: base.sx, sy: base.sy - lift };
    const east = neighborLift(x + 1, y);
    const south = neighborLift(x, y + 1);
    const dropE = lift - east;
    const dropS = lift - south;
    if (dropE > 2) {
      ctx.beginPath();
      ctx.moveTo(top.sx + hw, top.sy);
      ctx.lineTo(top.sx, top.sy + hh);
      ctx.lineTo(top.sx, top.sy + hh + dropE);
      ctx.lineTo(top.sx + hw, top.sy + dropE);
      ctx.closePath();
      ctx.fillStyle = terrainShade(terr, -0.28);
      ctx.fill();
    }
    if (dropS > 2) {
      ctx.beginPath();
      ctx.moveTo(top.sx - hw, top.sy);
      ctx.lineTo(top.sx, top.sy + hh);
      ctx.lineTo(top.sx, top.sy + hh + dropS);
      ctx.lineTo(top.sx - hw, top.sy + dropS);
      ctx.closePath();
      ctx.fillStyle = terrainShade(terr, -0.42);
      ctx.fill();
    }
  }

  function drawTile(ctx, x, y) {
    const viewer = me();
    const vis = visible(viewer, x, y);
    const mem = hasMemory(viewer, x, y);
    const unknown = !vis && !mem;
    const terr = unknown ? "fog" : (vis ? S.tiles[y][x] : (S.lastSeen[viewer][y][x].terr || "fog"));
    const base = iso(x, y);
    const lift = tileLiftAmt(terr, x, y);
    const top = { sx: base.sx, sy: base.sy - lift };
    const tw = TW * cam.z, th = TH * cam.z;
    if (lift > 1.5 && terr !== "fog") drawCliffSides(ctx, x, y, terr, base, lift, tw, th);
    diamondPathAt(ctx, top.sx, top.sy, 1.04);
    ctx.fillStyle = terrainColor(terr);
    ctx.fill();
    fillWorldTile(ctx, x, y, terr, top.sx, top.sy, vis || unknown ? 1 : 0.55);
    if (terr !== "water" && terr !== "fog") {
      const light = ctx.createLinearGradient(top.sx - tw / 2, top.sy - th / 2, top.sx + tw / 2, top.sy + th / 2);
      light.addColorStop(0, "rgba(255,255,255,0.07)");
      light.addColorStop(1, "rgba(0,0,0,0.08)");
      diamondPathAt(ctx, top.sx, top.sy, 1.04);
      ctx.fillStyle = light;
      ctx.fill();
    }

    if (vis && !unknown) drawProps(ctx, x, y, terr, top, tw, th);

    if (!vis && mem) {
      diamondPathAt(ctx, top.sx, top.sy, 1.04);
      ctx.fillStyle = "rgba(4,10,18,.35)";
      ctx.fill();
    }

    const land = terr !== "water" && terr !== "fog";
    if (vis && land) {
      const wet = neighbors(x, y).some((n) => inB(n.x, n.y) && S.tiles[n.y][n.x] === "water");
      if (wet) {
        diamondPathAt(ctx, top.sx, top.sy, 1.0);
        ctx.strokeStyle = "rgba(226, 242, 232, 0.42)";
        ctx.lineWidth = 1.6 * Math.max(0.7, cam.z);
        ctx.stroke();
        diamondPathAt(ctx, top.sx, top.sy, 0.72);
        ctx.fillStyle = "rgba(212, 196, 140, 0.18)";
        ctx.fill();
      }
    }
    if (vis && terr === "water") {
      let shore = 0;
      for (const n of neighbors(x, y)) if (inB(n.x, n.y) && S.tiles[n.y][n.x] !== "water") shore++;
      if (shore) {
        diamondPathAt(ctx, top.sx, top.sy, 1.0);
        ctx.fillStyle = `rgba(90, 180, 175, ${0.08 + shore * 0.05})`;
        ctx.fill();
      } else {
        diamondPathAt(ctx, top.sx, top.sy, 1.04);
        ctx.fillStyle = "rgba(4, 18, 32, 0.18)";
        ctx.fill();
      }
    }
  }

  function fillWorldTile(ctx, x, y, kind, sx, sy, alpha) {
    const img = SPR["tex-" + kind];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!img) return;
    if (!PAT[kind]) {
      try { PAT[kind] = ctx.createPattern(img, "repeat"); } catch (_) { PAT[kind] = null; }
    }
    if (!PAT[kind]) return;
    ctx.save();
    diamondPathAt(ctx, sx, sy, 1.04);
    ctx.clip();
    ctx.globalAlpha = alpha;
    const k = 64;
    const drift = kind === "water" ? tFrame * 0.04 : 0;
    ctx.setTransform(
      dpr * (TW / 2) * cam.z / k,
      dpr * (TH / 2) * cam.z / k,
      dpr * (-TW / 2) * cam.z / k,
      dpr * (TH / 2) * cam.z / k,
      dpr * cam.x,
      dpr * cam.y
    );
    ctx.fillStyle = PAT[kind];
    ctx.fillRect((x - 1.5) * k + drift, (y - 1.5) * k + drift * 0.45, k * 3, k * 3);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawProps(ctx, x, y, terr, top, tw, th) {
    const n = 1 + ((x * 13 + y * 7) % 2);
    if (terr === "forest") {
      for (let i = 0; i < n; i++) {
        const u = hash01(x, y, 10 + i) - 0.5;
        const v = hash01(x, y, 20 + i) - 0.5;
        const px = top.sx + u * tw * 0.35;
        const py = top.sy + v * th * 0.35;
        const r = (2.2 + hash01(x, y, 30 + i) * 2.4) * cam.z;
        ctx.beginPath();
        ctx.ellipse(px, py + r * 0.15, r * 0.35, r * 0.2, 0, 0, 7);
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py - r * 0.2, r, 0, 7);
        ctx.fillStyle = hash01(x, y, 40 + i) > 0.5 ? "#163c1a" : "#1f5a24";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px - r * 0.2, py - r * 0.35, r * 0.55, 0, 7);
        ctx.fillStyle = "#2a6b32";
        ctx.fill();
      }
    } else if (terr === "hills") {
      for (let i = 0; i < n; i++) {
        const u = hash01(x, y, 50 + i) - 0.5;
        const v = hash01(x, y, 60 + i) - 0.5;
        const px = top.sx + u * tw * 0.3;
        const py = top.sy + v * th * 0.25;
        const s = (1.8 + hash01(x, y, 70 + i) * 2) * cam.z;
        ctx.beginPath();
        ctx.moveTo(px, py - s);
        ctx.lineTo(px + s, py + s * 0.4);
        ctx.lineTo(px - s, py + s * 0.4);
        ctx.closePath();
        ctx.fillStyle = "#8a8880";
        ctx.fill();
      }
    } else if (terr === "ruins") {
      const px = top.sx + (hash01(x, y, 1) - 0.5) * tw * 0.2;
      const py = top.sy;
      ctx.fillStyle = "#4b463e";
      ctx.fillRect(px - 2.5 * cam.z, py - 5 * cam.z, 5 * cam.z, 6 * cam.z);
      ctx.fillStyle = "#6d6558";
      ctx.fillRect(px - 2 * cam.z, py - 7 * cam.z, 4 * cam.z, 3 * cam.z);
    } else if (terr === "desert") {
      const u = hash01(x, y, 80) - 0.5;
      const v = hash01(x, y, 81) - 0.5;
      const px = top.sx + u * tw * 0.28;
      const py = top.sy + v * th * 0.22;
      ctx.beginPath();
      ctx.ellipse(px, py, 5.5 * cam.z, 2.2 * cam.z, 0.3, 0, 7);
      ctx.fillStyle = hash01(x, y, 82) > 0.5 ? "#d4b57a" : "#b8894c";
      ctx.fill();
    } else if (terr === "plains" && hash01(x, y, 9) > 0.82) {
      ctx.fillStyle = "#3d5c28";
      ctx.fillRect(top.sx + 4 * cam.z, top.sy, 2 * cam.z, 5 * cam.z);
    }
  }

  function drawOcc(ctx, x, y) {
    const viewer = me();
    const vis = visible(viewer, x, y);
    const b = buildingAt(x, y);
    const u = unitAt(x, y);
    if (b) {
      if (b.owner === viewer || vis) {
        const key = b.fake && b.owner !== viewer && vis ? "hq" : b.type;
        if (b.wrecked) ctx.globalAlpha = 0.4;
        if (b.type === "radar" && !b.wrecked) drawRadar(ctx, x, y, b.owner !== viewer);
        else drawSpr(ctx, SPR[BLD[key] ? BLD[key].spr : b.type] || SPR[b.type], x, y, b.owner !== viewer);
        ctx.globalAlpha = 1;
        hpBar(ctx, x, y, b.hp / b.max, b.owner);
      } else if (S.lastSeen[viewer][y][x] && S.lastSeen[viewer][y][x].b) {
        ctx.globalAlpha = 0.4;
        drawSpr(ctx, SPR[S.lastSeen[viewer][y][x].b.type] || SPR.hq, x, y, true);
        ctx.globalAlpha = 1;
      }
    } else if (!vis && S.lastSeen[viewer][y][x] && S.lastSeen[viewer][y][x].b) {
      ctx.globalAlpha = 0.4;
      drawSpr(ctx, SPR[S.lastSeen[viewer][y][x].b.type] || SPR.hq, x, y, true);
      ctx.globalAlpha = 1;
    }
    else if (!vis && S.lastSeen[viewer][y][x] && S.lastSeen[viewer][y][x].u) {
      ctx.globalAlpha = 0.32;
      drawSpr(ctx, SPR[S.lastSeen[viewer][y][x].u.type] || SPR.marine, x, y, true);
      ctx.globalAlpha = 1;
    }
    if (u && (u.owner === viewer || vis)) {
      const wet = S.tiles[y][x] === "water";
      const air = UNIT[u.type] && UNIT[u.type].air;
      const bob = Math.sin((tFrame + u.id * 7) / 10) * (air ? 4.4 : wet ? 3.2 : 2) * cam.z;
      if (wet) {
        const p = isoTop(x, y);
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(p.sx, p.sy + 4 * cam.z, 16 * cam.z, 7 * cam.z, 0, 0, 7);
        ctx.fillStyle = "#7dd3fc";
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      drawSpr(ctx, SPR[u.type], x, y, u.owner !== me(), bob + (air ? 8 * cam.z : 0));
      hpBar(ctx, x, y, u.hp / u.max, u.owner);
    }
  }

  function sitOf(img) {
    if (!img) return 0.88;
    const k = img._sit;
    return k != null ? k : 0.88;
  }
  function drawSpr(ctx, img, x, y, enemy, bob = 0, sit) {
    const p = isoTop(x, y);
    const tw = TW * cam.z * 1.05;
    ctx.beginPath();
    ctx.ellipse(p.sx, p.sy + 6 * cam.z, 14 * cam.z, 6 * cam.z, 0, 0, 7);
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.fill();
    if (!img) {
      ctx.fillStyle = enemy ? "#a78bfa" : "#22d3ee";
      ctx.fillRect(p.sx - 8, p.sy - 18 - bob, 16, 18);
      return;
    }
    const ih = tw * (img.height / img.width);
    const foot = sit != null ? sit : sitOf(img);
    if (enemy) ctx.filter = "hue-rotate(70deg) saturate(1.15)";
    ctx.drawImage(img, p.sx - tw / 2, p.sy - ih * foot - bob, tw, ih);
    ctx.filter = "none";
  }
  function drawRadar(ctx, x, y, enemy) {
    const p = isoTop(x, y);
    drawSpr(ctx, SPR.radar, x, y, enemy, 0, 0.93);
    const ang = tFrame * 0.07;
    ctx.save();
    ctx.translate(p.sx, p.sy - 26 * cam.z);
    ctx.scale(Math.max(0.18, Math.abs(Math.cos(ang))), 1);
    ctx.beginPath();
    ctx.ellipse(0, 0, 15 * cam.z, 6.5 * cam.z, 0, 0, 7);
    ctx.strokeStyle = "rgba(34,211,238,.9)";
    ctx.lineWidth = 1.8 * cam.z;
    ctx.stroke();
    ctx.fillStyle = "rgba(34,211,238,.12)";
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(p.sx, p.sy - 26 * cam.z);
    ctx.rotate(ang);
    ctx.strokeStyle = "rgba(125, 211, 252, .55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(18 * cam.z, 4 * cam.z);
    ctx.stroke();
    ctx.restore();
  }

  function hpBar(ctx, x, y, r, owner) {
    const p = isoTop(x, y);
    const w = 28 * cam.z, h = 4 * cam.z;
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(p.sx - w / 2, p.sy + 8 * cam.z, w, h);
    ctx.fillStyle = owner === me() ? "#22d3ee" : "#c084fc";
    ctx.fillRect(p.sx - w / 2, p.sy + 8 * cam.z, w * Math.max(0, Math.min(1, r)), h);
  }

  function diamondPathAt(ctx, sx, sy, scale) {
    const s = scale == null ? 1 : scale;
    const hw = (TW / 2) * cam.z * s, hh = (TH / 2) * cam.z * s;
    ctx.beginPath();
    ctx.moveTo(sx, sy - hh);
    ctx.lineTo(sx + hw, sy);
    ctx.lineTo(sx, sy + hh);
    ctx.lineTo(sx - hw, sy);
    ctx.closePath();
  }
  function diamondPath(ctx, x, y) {
    const p = isoTop(x, y);
    diamondPathAt(ctx, p.sx, p.sy);
  }
  function drawDiamondLift(ctx, x, y, color) {
    diamondPath(ctx, x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  function fillDiamond(ctx, x, y, color) {
    diamondPath(ctx, x, y);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function drawDiamond(ctx, x, y, color) {
    const p = iso(x, y);
    const hw = (TW / 2) * cam.z, hh = (TH / 2) * cam.z;
    ctx.beginPath();
    ctx.moveTo(p.sx, p.sy - hh);
    ctx.lineTo(p.sx + hw, p.sy);
    ctx.lineTo(p.sx, p.sy + hh);
    ctx.lineTo(p.sx - hw, p.sy);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawFx(ctx, f) {
    if (f.kind === "missile" || f.kind === "jet" || f.kind === "drop") {
      const k = 1 - f.life / f.max;
      const x = f.x0 + (f.x1 - f.x0) * k;
      const y = f.y0 + (f.y1 - f.y0) * k;
      const p = iso(x, y);
      const img = f.kind === "jet" ? SPR.jet : SPR.missile;
      const lift = Math.sin(k * Math.PI) * 40 * cam.z;
      if (img) ctx.drawImage(img, p.sx - 18 * cam.z, p.sy - 28 * cam.z - lift, 36 * cam.z, 36 * cam.z);
      else {
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath(); ctx.arc(p.sx, p.sy - lift, 4, 0, 6.28); ctx.fill();
      }
    } else if (f.kind === "boom") {
      const p = iso(f.x, f.y);
      const img = SPR.boom;
      const sc = (1.2 - f.life / f.max) * 52 * cam.z;
      ctx.globalAlpha = f.life / f.max;
      if (img) ctx.drawImage(img, p.sx - sc / 2, p.sy - sc / 2, sc, sc);
      else { ctx.fillStyle = "#fb923c"; ctx.beginPath(); ctx.arc(p.sx, p.sy, sc / 2, 0, 6.28); ctx.fill(); }
      ctx.globalAlpha = 1;
    } else if (f.kind === "flash") {
      const p = iso(f.x, f.y);
      ctx.globalAlpha = f.life / f.max;
      ctx.fillStyle = "#fff";
      ctx.fillRect(p.sx - 3, p.sy - 10, 6, 12);
      ctx.globalAlpha = 1;
    } else if (f.kind === "laser" || f.kind === "tracer") {
      const k = 1 - f.life / f.max;
      const a = iso(f.x0, f.y0), b = iso(f.x1, f.y1);
      ctx.save();
      ctx.globalAlpha = Math.max(0.15, f.life / f.max);
      ctx.strokeStyle = f.hue || (f.kind === "laser" ? "#22d3ee" : "#fbbf24");
      ctx.lineWidth = (f.kind === "laser" ? 2.4 : 1.6) * cam.z;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy - 10 * cam.z);
      ctx.lineTo(b.sx, b.sy - 6 * cam.z);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(a.sx + (b.sx - a.sx) * k, a.sy - 10 * cam.z + (b.sy - a.sy) * k, 2.2 * cam.z, 0, 7);
      ctx.fill();
      ctx.restore();
    } else if (f.kind === "muzzle") {
      const p = iso(f.x, f.y);
      const sc = (6 + (1 - f.life / f.max) * 8) * cam.z;
      ctx.globalAlpha = f.life / f.max;
      ctx.fillStyle = f.laser ? "#67e8f9" : "#fdba74";
      ctx.beginPath();
      ctx.arc(p.sx + 8 * cam.z, p.sy - 14 * cam.z, sc * 0.35, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- UI ---------- */
  function paintUI() {
    if (!S) return;
    const p = S.players[me()];
    const pw = powerBudget(me());
    $("phasePill").textContent = ({
      deploy: "DEPLOY HQs",
      defense: "DEFENSE", offense: "OFFENSE", resolve: "ATTACK PLAYBACK",
      enemy: "ENEMY RESPONSE",
      end: S.over === "win" ? "VICTORY" : S.over === "draw" ? "DRAW" : "DEFEAT"
    })[S.phase] || S.phase;
    $("resHud").innerHTML = `
      <span>Turn <b>${S.turn}</b></span>
      <span>Credits <b>${p.credits}</b></span>
      <span>People <b>${p.people || 0}</b></span>
      <span>Fuel <b>${p.fuel}</b></span>
      <span>Power <b>${pw.have}/${pw.need}${pw.have < pw.need ? " BROWN" : ""}</b></span>
      <span>Campaign <b>${S.campaign}</b></span>
      <span>Island <b>#${S.seed}</b></span>
      <span>${S.mapNote ? S.mapNote : ""}</span>
      <span>AI <b>${S.mode === "ai" ? S.ai.profile : "hot-seat"}</b></span>`;
    const ph = hqCount(me()), eh = hqCount(1 - me());
    $("hqPips").innerHTML = `YOU ${pips(ph, "me")} <span style="width:8px"></span> FOE ${pips(eh, "foe")}`;
    paintLeft();
    paintPortrait();
    paintSel();
    paintBoard();
    $("btnEnd").disabled = S.phase === "resolve" || S.phase === "enemy" || S.phase === "end";
    $("btnSkip").disabled = S.phase !== "resolve";
    $("btnEnd").textContent = S.phase === "deploy" ? "Lock 3 command centres →"
      : S.phase === "defense" ? "Commit defenses →" : S.phase === "offense" ? "Launch attacks →" : "End phase";
    $("dockStatus").textContent = S.phase === "deploy"
      ? `${me() === 0 ? "South" : "North"}: place ${3 - hqCount(me())} more Command Centre(s) on your island. Click an HQ to pick it up.`
      : S.phase === "defense"
      ? "Reclaim Pads (50c) sit on water and become decks you can build on. Relays and pads hop command range."
      : S.phase === "offense"
        ? "Click black fog to probe (Battleship). Radar discs and strikes lift the dark."
        : S.phase === "resolve" ? "Playback — or skip." : "";
    const el = $("log");
    if (el) el.textContent = (S.log || []).join("\n");
  }
  function pips(n, cls) {
    let s = "";
    for (let i = 0; i < 3; i++) s += `<i class="pip ${i < n ? cls : "dead"}"></i>`;
    return s;
  }

  function paintLeft() {
    const rail = $("leftRail");
    if (S.phase === "deploy") {
      const left = 3 - hqCount(me());
      rail.innerHTML = `<div class="panel"><h3>Command net</h3>
        <p class="sel-meta">${me() === 0 ? "Southern" : "Northern"} commander — drop ${left} Command Centre${left === 1 ? "" : "s"} on your land. Cluster or spread. Click a placed HQ to pick it up.</p>
        ${itemBtn("hq", BLD.hq.name, BLD.hq.desc, left + " left", ASSET + SPR_FILES.hq, true, false)}
      </div>`;
      return;
    }
    if (S.phase === "defense") {
      const cats = ["core", "economy", "population", "production", "intel", "defense", "decoy", "offense"];
      let html = `<p class="cat">Build</p>`;
      for (const c of cats) {
        html += `<div class="cat">${c}</div>`;
        for (const [k, b] of Object.entries(BLD)) {
          if (b.cat !== c || k === "hq") continue;
          const lock = b.unlock && !unlocked(b.unlock);
          const cost = b.people ? (b.people + "p") : (b.cost + "c");
          html += itemBtn(k, b.name, b.desc, cost, ASSET + SPR_FILES[b.spr], tool === k, lock, lock);
        }
      }
      rail.innerHTML = html;
      rail.querySelectorAll("[data-k]").forEach((el) => {
        el.onclick = () => { if (el.disabled) return; tool = el.dataset.k; weapon = null; paintUI(); };
      });
    } else if (S.phase === "offense") {
      let html = `<p class="cat">Strike package</p>`;
      for (const [k, w] of Object.entries(WPN)) {
        const lock = w.unlock && !unlocked(w.unlock);
        const left = shotsLeft(me(), k);
        const cd = w.sat ? S.players[me()].satCD : 0;
        const need = (w.need && !livePads(me(), w.need).length) || left <= 0 || cd > 0;
        const cost = cd > 0 ? ("CD " + cd) : (left < 99 ? `${w.cost}c · ${left} left` : `${w.cost}c · ${w.fuel}f`);
        const icon = k === "airstrike" || k === "jetdrop" ? SPR_FILES.jet
          : (w.spawn && SPR_FILES[w.spawn]) ? SPR_FILES[w.spawn]
          : SPR_FILES.missile;
        html += itemBtn(k, w.name, w.desc, cost, ASSET + icon, weapon === k, lock || need, lock);
      }
      rail.innerHTML = html;
      rail.querySelectorAll("[data-k]").forEach((el) => {
        el.onclick = () => {
          if (el.disabled) return;
          weapon = el.dataset.k;
          tool = null;
          if (weapon === "sat") {
            queueStrike(me(), "sat", 0, 0);
            weapon = null;
          }
          paintUI();
        };
      });
    } else {
      rail.innerHTML = `<div class="panel"><h3>Playback</h3><p class="sel-meta">Missiles, drops, and gunfire resolve in sequence. Marines march toward enemy command centres on their own.</p></div>`;
    }
  }

  function itemBtn(k, name, desc, cost, src, on, dis, locked) {
    return `<button class="item ${on ? "on" : ""}" data-k="${k}" ${dis ? "disabled" : ""}>
      <img src="${src}" alt="">
      <span><div class="nm">${name}</div><div class="ds">${desc}</div></span>
      <span class="cost">${locked && !on ? "LOCK" : cost}</span>
    </button>`;
  }

  function paintPortrait() {
    const el = $("cmdPanel");
    if (!el) return;
    const c = commander();
    const locked = cmdrLocked();
    const key = c.id + "|" + (persist.name || "") + "|" + (S ? S.campaign : "") + "|" + (locked ? "L" : "U");
    if (el.dataset.k === key) return;
    el.dataset.k = key;
    const opts = CMDRS.map((x) => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${x.seat} · ${esc(x.name)}</option>`).join("");
    el.innerHTML = `
      <h3>Δ9 Council</h3>
      <div class="cmd-frame"><img src="${ASSET + c.file}" alt="${esc(c.name)}"></div>
      <p class="cmd-name">${esc(persist.name || "Commander")}</p>
      <p class="cmd-title">Seat ${esc(c.seat)} · ${esc(c.name)}</p>
      <p class="cmd-lore">${esc(c.title)}. ${esc(c.lore)}</p>
      <p class="cmd-bonus">${esc(c.bonus)}</p>
      ${locked ? `<p class="sel-meta">Champion locked with the command net.</p>` : `<div class="row">
        <button class="btn" type="button" id="cmdPrev">◀</button>
        <select id="cmdPick" style="flex:1;min-width:0">${opts}</select>
        <button class="btn" type="button" id="cmdNext">▶</button>
      </div>
      <p class="sel-meta">Pick before you lock 3 HQs. 15 Haven champions · <a href="https://excavationpro.ca/app.html" target="_blank" rel="noopener">chatagent.ca</a></p>`}
    `;
    if (locked) return;
    const refresh = () => { const p = $("cmdPanel"); if (p) p.dataset.k = ""; paintPortrait(); };
    const prev = $("cmdPrev"), next = $("cmdNext"), pick = $("cmdPick");
    if (prev) prev.onclick = () => { cycleCmdr(-1); refresh(); };
    if (next) next.onclick = () => { cycleCmdr(1); refresh(); };
    if (pick) pick.onchange = () => {
      if (cmdrLocked()) return;
      persist.cmdr = pick.value;
      savePersist();
      refresh();
    };
  }

  function paintSel() {
    const box = $("selPanel");
    if (!sel || !inB(sel.x, sel.y)) {
      box.innerHTML = `<h3>Tile</h3><p class="sel-meta">Your island is clear. The enemy island is black until a radar disc, probe, or strike lights a tile — like Battleship. Stale scans fade after a few turns but leave a ghost.</p>`;
      return;
    }
    const vis = visible(me(), sel.x, sel.y);
    const mem = hasMemory(me(), sel.x, sel.y);
    const terr = vis ? S.tiles[sel.y][sel.x] : (mem ? S.lastSeen[me()][sel.y][sel.x].terr : "unknown");
    const b = buildingAt(sel.x, sel.y);
    const u = unitAt(sel.x, sel.y);
    let html = `<h3>${sel.x},${sel.y} · ${terr}${vis ? "" : (mem ? " · last seen" : " · FOG")}</h3>`;
    if (!vis && !onHome(me(), sel.x, sel.y)) {
      if (!mem) {
        html += `<p class="sel-meta">Unknown water or land. Probe this tile or raise a radar.</p>`;
        box.innerHTML = html; return;
      }
      const ghost = S.lastSeen[me()][sel.y][sel.x];
      html += `<p class="sel-meta">Stale intel. ${ghost.b ? "Last contact: " + (BLD[ghost.b.type] ? BLD[ghost.b.type].name : ghost.b.type) : "No structure when last scanned."} Probe again to refresh.</p>`;
      box.innerHTML = html; return;
    }
    if (b) {
      html += `<p class="nm">${b.fake && b.owner !== me() ? BLD.hq.name : BLD[b.type].name} Mk${b.lvl}${b.wrecked ? " · WRECK" : ""}</p>
        <div class="hpbar"><i style="width:${(b.hp / b.max) * 100}%"></i></div>
        <p class="sel-meta">${b.hp}/${b.max} HP · ${b.owner === me() ? "friendly" : "hostile"}${b.offline ? " · OFFLINE" : ""}${b.wrecked ? " · wrecked" : ""}${AURA_TYPES.includes(b.type) ? " · aura r" + auraReach(b) : ""}${b.type === "econ" ? " · mint ×" + auraMul(b.owner, b.x, b.y, "mint").toFixed(1) : ""}${b.type === "energy" ? " · fuel ×" + auraMul(b.owner, b.x, b.y, "depot").toFixed(1) + " · power ×" + auraMul(b.owner, b.x, b.y, "grid").toFixed(1) : ""}${(b.type === "silo" || b.type === "icbm") ? " · ordnance ×" + auraMul(b.owner, b.x, b.y, "warhall").toFixed(1) : ""}</p>`;
      if (b.owner === me() && S.phase === "defense") {
        html += `<div class="row">
          ${!b.wrecked && b.lvl < 3 ? `<button class="btn" id="upg">Upgrade (${BLD[b.type].people ? (25 * b.lvl) + "p" : Math.round(BLD[b.type].cost * 0.55 * b.lvl) + "c"})</button>` : ""}
          ${(b.wrecked || b.hp < b.max) ? `<button class="btn" id="rep">${b.repairTick ? "Repairing…" : "Repair 25% (" + repairCost(b) + "c)"}</button>` : ""}
          ${b.type !== "hq" ? `<button class="btn" id="doze">Bulldoze (no refund)</button>` : ""}
          ${!b.wrecked && (b.type === "factory" || b.type === "hangar") ? `<button class="btn" id="trM">Train marine</button>` : ""}
          ${!b.wrecked && b.type === "factory" && unlocked("scout") ? `<button class="btn" id="trS">Train scout</button>` : ""}
          ${!b.wrecked && b.type === "factory" && unlocked("drone") ? `<button class="btn" id="trD">Train drone</button>` : ""}
          ${!b.wrecked && b.type === "hangar" && unlocked("tank") ? `<button class="btn" id="trT">Build tank</button>` : ""}
          ${!b.wrecked && b.type === "hangar" && unlocked("hover") ? `<button class="btn" id="trH">Build hovercraft</button>` : ""}
          ${!b.wrecked && b.type === "hangar" && unlocked("jet") ? `<button class="btn" id="trJ">Ready jet</button>` : ""}
          ${!b.wrecked && b.type === "hangar" && unlocked("arty") ? `<button class="btn" id="trA">Build howitzer</button>` : ""}
        </div>`;
      }
    }
    if (u) {
      const ud = UNIT[u.type];
      const wet = S.tiles[u.y][u.x] === "water" && ud && !ud.air && !ud.amphib;
      html += `<p class="sel-meta">${ud.name} ${u.hp}/${u.max}${wet ? " · portage " + Math.max(1, u.portage || 3) + "/3" : ""}${ud.air ? " · air" : ""}${ud.amphib ? " · amphibious" : ""} · vis ${unitVision(u)} · rng ${ud.range}${S.tiles[u.y][u.x] === "hills" ? "+1" : ""}</p>`;
    }
    box.innerHTML = html;
    const bind = (id, fn) => { const e = $(id); if (e) e.onclick = fn; };
    bind("upg", () => { tryUpgrade(b); paintUI(); });
    bind("rep", () => { tryRepair(b); paintUI(); });
    bind("doze", () => { tryBulldoze(b); paintUI(); });
    bind("trM", () => { tryTrain(b, "marine"); paintUI(); });
    bind("trS", () => { tryTrain(b, "scout"); paintUI(); });
    bind("trD", () => { tryTrain(b, "drone"); paintUI(); });
    bind("trT", () => { tryTrain(b, "tank"); paintUI(); });
    bind("trH", () => { tryTrain(b, "hover"); paintUI(); });
    bind("trJ", () => { tryTrain(b, "jet"); paintUI(); });
    bind("trA", () => { tryTrain(b, "arty"); paintUI(); });
  }

  function paintBoard() {
    const el = $("boardPanel");
    const rows = persist.board.slice(0, 8).map((r, i) =>
      `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td>${r.score}</td><td>${r.diff}</td></tr>`).join("");
    el.innerHTML = `<h3>Local board</h3>
      <p class="sel-meta">Wins ${persist.wins} · Best ${persist.best} · Prestige ${persist.prestige}</p>
      <p class="sel-meta"><a href="${LEDGER_PAGE}" target="_blank" rel="noopener">Eternal AI ledger →</a></p>
      <table class="lb"><thead><tr><th>#</th><th>Name</th><th>Score</th><th>Diff</th></tr></thead>
      <tbody>${rows || "<tr><td colspan=4>No sorties yet.</td></tr>"}</tbody></table>`;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  /* ---------- overlay ---------- */
  function showOverlay(html, kind) {
    const o = $("overlay");
    o.className = "overlay show" + (kind ? " " + kind : "");
    o.innerHTML = kind === "menu" ? html : `<div class="modal">${html}</div>`;
  }
  function hideOverlay() { $("overlay").className = "overlay"; $("overlay").innerHTML = ""; }

  /* ---- supporter access ------------------------------------------------------------
     The shared gate (games/lygo-gate.js) runs in embed mode here, so it injects no
     banner of its own and this game offers the code entry itself, in the island's
     palette, at the bottom of the menu. Two things the gate cannot know on its own:
     a reminder must never land on a live board, and a player who has just come out of
     a match should get a beat before the next one — so the game holds the reminder
     while a match is running and relaxes it for two minutes afterwards. */
  let gateBusy = false;   // a match is on the board (the abort path nulls S first)
  function gate() { return window.LYGO_GATE || null; }
  function gateState() {
    const g = gate();
    return g ? g.state() : { unlocked: false, label: "", until: "", lapsed: false };
  }
  function gateHold(on, relaxMs) {
    let tries = 0;
    const apply = () => {
      const g = gate();
      if (!g || !g.hold) { if (tries++ < 24) setTimeout(apply, 250); return; }
      g.hold(on);
      if (!on && relaxMs) g.suppress(relaxMs);
    };
    apply();
  }
  function supHTML() {
    const s = gateState();
    const url = (gate() && gate().patreon) || "https://www.patreon.com/Excavationpro/posts/chatagent-ca-api-170485961";
    return `
          <details class="sup-panel${s.unlocked ? " is-unlocked" : ""}" id="supPanel">
            <summary><span>Supporter access</span><span class="sup-chip" id="supChip">${s.unlocked ? "active" : "enter a code"}</span></summary>
            <p class="sup-note" id="supState"></p>
            <div class="sup-row">
              <input id="supCode" type="text" inputmode="latin" autocomplete="off" spellcheck="false"
                     placeholder="LYGO-2609-XXXX-XXXX" aria-label="Supporter code">
              <button class="btn gold" id="supGo" type="button">Unlock</button>
              <button class="btn" id="supRelock" type="button">Lock again</button>
            </div>
            <p class="sup-msg" id="supMsg" role="status" aria-live="polite"></p>
            <a class="sup-get" href="${url}" target="_blank" rel="noopener">Get this month's code — Patreon post →</a>
          </details>`;
  }
  function paintSup() {
    const chip = $("supChip"), note = $("supState"), go = $("supGo"), rl = $("supRelock");
    const inp = $("supCode"), panel = $("supPanel");
    if (!note) return;
    const s = gateState();
    if (chip) chip.textContent = s.unlocked ? "active" : "enter a code";
    if (panel) panel.classList.toggle("is-unlocked", !!s.unlocked);
    note.textContent = s.unlocked
      ? ("Reminders are off in this browser · code " + (s.label || "supporter") +
         (s.until ? " · good through " + s.until : " · permanent"))
      : (s.lapsed
          ? ("The code from " + s.label + " ran through " + s.until + " and has lapsed, so the reminders are back.")
          : "Every mode here plays the same with or without one. A monthly code from the Patreon post switches the donation reminders off in this browser.");
    if (go) go.hidden = !!s.unlocked;
    if (rl) rl.hidden = !s.unlocked;
    if (inp) inp.disabled = !!s.unlocked;
  }
  function wireSup() {
    const go = $("supGo"), inp = $("supCode"), rl = $("supRelock"), msg = () => $("supMsg");
    if (!go || !inp) return;
    const submit = async () => {
      const g = gate();
      if (!g) { if (msg()) msg().textContent = "The code module has not loaded yet — try again in a moment."; return; }
      const r = await g.unlock(inp.value);
      if (r.ok) inp.value = "";
      if (msg()) msg().textContent = r.ok
        ? ("Unlocked — the reminders stay off in this browser" + (r.until ? " through " + r.until : "") + ". Thank you for keeping the lattice lit.")
        : r.why;
      paintSup();
    };
    go.onclick = submit;
    inp.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } };
    if (rl) rl.onclick = () => {
      const g = gate();
      if (g) g.relock();
      if (msg()) msg().textContent = "Locked again in this browser. The reminders will come back.";
      paintSup();
    };
  }
  document.addEventListener("lygo-supporter", () => paintSup());
  document.addEventListener("lygo-gate-door", () => {
    if (overlayMode !== "menu") showMenu();
    setTimeout(() => {
      const p = $("supPanel");
      if (p) {
        p.open = true;
        p.classList.add("fly");
        setTimeout(() => p.classList.remove("fly"), 1400);
        p.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      const i = $("supCode");
      if (i && !i.disabled) i.focus();
      paintSup();
    }, 260);
  });

  function showMenu() {
    overlayMode = "menu";
    const sizeOpts = MAP_SIZES.map((m) =>
      `<option value="${m.n}" ${(persist.mapN || 48) === m.n ? "selected" : ""}>${m.label}</option>`).join("");
    const diffOpts = Object.keys(DIFF).map((k) =>
      `<option value="${k}" ${k === "normal" ? "selected" : ""}>${DIFF[k].label}</option>`).join("");
    showOverlay(`
      <div class="title-screen">
        <div class="title-art">
          <img src="./assets/menu.jpg" alt="Lattice Marines island fortress">
          <div class="title-art-fade"></div>
        </div>
        <div class="title-panel">
          <p class="kicker">Δ9Φ963 · Excavationpro</p>
          <h1>LATTICE MARINES</h1>
          <p class="title-tag">Place three command centres. Probe the fog. Watch the island burn.</p>
          <p>You deploy your own HQs. Fifteen Δ9 council champions from chatagent.ca can command the island — each with Haven lore and a small bonus. Ridges lift off the water, beaches hug the coast, forests hide radar, and new kit — drones, hovercraft, jets, howitzers — joins the marines. Maps go up to 192×192.</p>
          <div class="row">
            <label>Callsign <input id="nm" maxlength="18" value="${esc(persist.name)}"></label>
            <label>Map
              <select id="ms">${sizeOpts}</select>
            </label>
            <label>Difficulty
              <select id="df">${diffOpts}</select>
            </label>
            <label>Mode
              <select id="md"><option value="ai">vs Adaptive AI</option><option value="hotseat">Hot-seat</option></select>
            </label>
            <label>Seed <input id="sd" placeholder="blank = new random" value=""></label>
          </div>
          <div class="row">
            <button class="btn gold" id="go">Deploy campaign ${persist.campaign}</button>
            <button class="btn" id="fresh">New island</button>
            <button class="btn" id="menuRadio">Play radio</button>
            <button class="btn" id="menuCmdr">Commander: ${esc(commander().name)}</button>
            <a class="btn ghost" href="/games/">All games</a>
            <a class="btn ghost" href="${LEDGER_PAGE}" target="_blank" rel="noopener">Eternal ledger</a>
            <a class="btn ghost" id="menuSupporter" href="#supPanel">Supporter access</a>
          </div>
          <p class="sel-meta">Wins ${persist.wins} · Best ${persist.best} · Prestige ${persist.prestige} · Unlocks: ${Object.keys(persist.unlocks).filter((k) => persist.unlocks[k]).join(", ") || "starter kit"}</p>
          <p class="sel-meta"><b>Deploy</b> 3 HQs → <b>Defense</b> build → <b>Offense</b> probe the black → <b>Playback</b>.</p>
          <div class="row">
            <a class="paypal-mini" href="https://www.paypal.com/paypalme/ExcavationPro" target="_blank" rel="noopener noreferrer">PayPal.me/ExcavationPro</a>
            <a class="btn ghost" href="https://asiancoastline.com/listen.html" target="_blank" rel="noopener">Listen portal</a>
            <a class="btn ghost" href="https://deepseekoracle.github.io/lygo-protocol-stack/HavenStarChart.html" target="_blank" rel="noopener">Star Chart</a>
          </div>
          ${supHTML()}
        </div>
      </div>
    `, "menu");
    $("go").onclick = () => startFromForm(false);
    $("fresh").onclick = () => startFromForm(true);
    $("menuRadio").onclick = () => { const b = $("radioPlay"); if (b) b.click(); };
    const supBtn = $("menuSupporter");
    if (supBtn) supBtn.onclick = (ev) => {
      ev.preventDefault();
      const p = $("supPanel");
      if (!p) return;
      p.open = true;
      paintSup();
      p.scrollIntoView({ block: "center", behavior: "smooth" });
      const i = $("supCode");
      if (i && !i.disabled) setTimeout(() => i.focus(), 320);
    };
    const mc = $("menuCmdr");
    if (mc) mc.onclick = () => { if (!cmdrLocked()) { cycleCmdr(1); showMenu(); } };
    paintSup();
    wireSup();
    // the gate script is deferred, so it can land after this menu is painted
    setTimeout(paintSup, 400);
    setTimeout(paintSup, 1500);
    // coming back from a match: reminders may resume, but not for two minutes.
    // (S is already null on the abort path, so a flag carries this instead.)
    if (gateBusy) { gateBusy = false; gateHold(false, 2 * 60 * 1000); }
  }
  function startFromForm(resetCamp) {
    persist.name = ($("nm").value || "Commander").slice(0, 18);
    persist.mapN = Number($("ms").value) || 48;
    savePersist();
    if (resetCamp) persist.campaign = Math.max(1, persist.campaign);
    const typed = ($("sd") && $("sd").value || "").trim();
    const seed = (!resetCamp && typed) ? (Number(typed) >>> 0 || hashSeed(typed)) : (((Math.random() * 0xFFFFFFFF) ^ Date.now()) >>> 0);
    beginMatch({
      seed,
      diff: $("df").value,
      campaign: persist.campaign,
      mode: $("md").value,
      mapN: persist.mapN
    });
  }
  function beginMatch(opts) {
    const n = Number(opts && opts.mapN) || persist.mapN || 48;
    gateBusy = true;
    gateHold(true);
    overlayMode = "help";
    showOverlay(`
      <h2>Shaping island</h2>
      <p class="sel-meta">${n}×${n} theatre. Raising continents, groves, ranges, and lakes…</p>
      <div class="gen-bar" role="progressbar" aria-label="Generating map" aria-valuemin="0" aria-valuemax="100" aria-valuenow="55"><i></i></div>
    `);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => newMatch(opts));
    });
  }

  function showHelp() {
    showOverlay(`
      <h2>Field manual</h2>
      <p><b>Population:</b> City Squares mint 1 People per turn. Spend 50 People on a Forum. Each standing Forum auras Chebyshev 3 (Mk2→4, Mk3→5) and stacks +50%: Ordnance (missile/ICBM damage from pads inside), Bastion (defense + guns/AA), Mint (econ credits), Depot (fuel), Grid (power). Overlap is the point — clustered Forums go unfair; misplaced ones waste the census.</p>
      <p><b>Reclaim:</b> 50c Reclaim Pads drop on water, turn the tile into a pontoon deck, and extend command range by 2. Click a pad with another building selected to occupy that deck. Chain pads + relays to hop the sea when the island runs out of land.</p>
      <p><b>Stipend:</b> 150 credits every turn even with no economy, so a wrecked island can always raise a new Economic Centre.</p>
      <p><b>Council:</b> pick one of the 15 Δ9 champions from <a href="https://excavationpro.ca/app.html" target="_blank" rel="noopener">chatagent.ca</a>. Each carries Haven lore and a small island bonus. Cycle from the right-rail portrait or the title menu.</p>
      <p><b>Fog:</b> queued missiles stay in the black until they hit. Probes paint a 5×5 on impact. Living units keep their vision disc every turn — hills add +1 sight, forest cuts it. Interior forest still blocks radar; the canopy edge does not. Stale scans fade after a few turns but leave a ghost.</p>
      <p><b>Salvo:</b> silos and ICBMs rearm every turn (one rocket per live pad). Hangar and factory sorties stay in the field until they die, then that pad waits one full turn to rearm. Airstrikes also cost a hangar a full-turn rearm. One EMP per tower. Each AA fires once per incoming wave and also shoots grounded jets/drones.</p>
      <p><b>Win:</b> level all three enemy Command Centres. <b>Lose:</b> yours fall. Score rewards wreckage, surviving kit, and a brisk economy; long wars pay a time tax. Wins unlock scouts, drones, tanks, hovercraft, howitzers, jets, shields, ICBMs, EMP, airstrikes, and the spy satellite. After 10 wins you prestige for a score multiplier.</p>
      <p>Units hunt Command Centres. Land units <b>portage</b> water at 3 turns per tile. Hovercraft treat water as land; jets and drones fly it. Forest gives cover. Hills add +1 shot range. Tanks and howitzers slow in woods and mountains. Gun pods out-punch a marine (~24 vs 20 melee).</p>
      <p><b>Keys:</b> WASD / arrows pan · wheel or pinch zoom · 1–9 pick the left-rail list · Enter ends phase · Space skips playback · F cycles playback speed ×1/×2/×4 · Esc cancels tool · R repairs the selected friendly · Home recenters. Drag or one-finger pan on touch.</p>
      <div class="row"><button class="btn gold" id="ok">Close</button></div>
    `);
    overlayMode = "help";
    $("ok").onclick = () => { hideOverlay(); overlayMode = null; };
  }

  function showEnd() {
    const title = S.mode === "hotseat"
      ? (S.over === "win" ? "South holds the island" : S.over === "draw" ? "Mutual annihilation" : "North holds the island")
      : (S.over === "win" ? "Island secured" : S.over === "draw" ? "Mutual annihilation" : "Command net down");
    const st = S.players[S.mode === "hotseat" ? 0 : me()].stats;
    showOverlay(`
      <h2>${title}</h2>
      <p>Score <b>${S.score}</b> · ${S.diff} · ${S.mode === "ai" ? S.ai.profile : "hot-seat"} · ${S.turn} turns</p>
      <p class="sel-meta">Buildings wrecked ${st.bKill} · Units down ${st.uKill} · Best ${persist.best}</p>
      ${S.over === "win" && S.mode === "ai" ? `<p class="sel-meta" id="ledgerStatus">Inscribing ${esc(persist.name || "Commander")} on the eternal ledger…</p>` : (S.mode === "hotseat" ? `<p class="sel-meta">Hot-seat is local only — the eternal ledger is vs AI.</p>` : "")}
      <div class="row">
        <button class="btn gold" id="again">${S.over === "win" ? "Next campaign island" : "Retry island"}</button>
        <button class="btn" id="mm">Main menu</button>
        <a class="btn ghost" href="${LEDGER_PAGE}" target="_blank" rel="noopener">Eternal ledger</a>
        <a class="paypal-mini" href="https://www.paypal.com/paypalme/ExcavationPro" target="_blank" rel="noopener noreferrer">PayPal tip</a>
      </div>
    `);
    $("again").onclick = () => beginMatch({ seed: Math.floor(Math.random() * 1e9), diff: S.diff, campaign: persist.campaign, mode: S.mode, mapN: S.mapN || persist.mapN });
    $("mm").onclick = showMenu;
    if (S.over === "win" && S.mode === "ai") ledgerFlush();
  }

  /* ---------- input ---------- */
  function resize() { /* canvas tracks client in draw */ }

  function clickTile(t) {
    if (!inB(t.x, t.y)) return;
    sel = t;
    if (S.phase === "deploy") {
      const b = buildingAt(t.x, t.y);
      if (b && b.owner === me() && b.type === "hq") {
        S.buildings = S.buildings.filter((x) => x.id !== b.id);
        toast("Picked up a Command Centre. Place it again.");
        fx("ui");
        paintUI();
        return;
      }
      tryBuild("hq", me(), t.x, t.y);
      paintUI();
      return;
    }
    if (S.phase === "defense" && tool) {
      tryBuild(tool, me(), t.x, t.y);
    } else if (S.phase === "offense" && weapon) {
      queueStrike(me(), weapon, t.x, t.y);
    } else fx("select");
    paintUI();
  }
  function onDown(e) {
    if (!S || overlayMode) return;
    const r = canvas().getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    downPt = { mx, my, button: e.button, t: pickTile(mx, my) };
    didDrag = false;
    lastM = { mx, my };
    dragging = e.button === 1 || e.button === 2 || e.shiftKey;
    if (e.button !== 0) e.preventDefault();
  }
  function onMove(e) {
    if (!S) return;
    const r = canvas().getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    hover = pickTile(mx, my);
    if (hover && inB(hover.x, hover.y)) {
      const vis = visible(me(), hover.x, hover.y);
      const mem = hasMemory(me(), hover.x, hover.y);
      const home = onHome(me(), hover.x, hover.y);
      let label;
      if (home || vis) {
        label = `${hover.x},${hover.y} ${S.tiles[hover.y][hover.x]}`;
        if (S.phase === "defense" && tool && tool !== "hq" && home) {
          const terr = S.tiles[hover.y][hover.x];
          if (tool === "pad") {
            if (terr === "water" || terr === "pontoon") {
              label += occupied(hover.x, hover.y) ? "  · occupied" : (inBuildNet(me(), hover.x, hover.y) ? "  · reclaim" : "  · OUT OF RANGE");
            } else label += "  · pads go on water";
          } else if (terr !== "water" || (buildingAt(hover.x, hover.y) && buildingAt(hover.x, hover.y).type === "pad")) {
            const te = terrainAllows(tool, terr === "water" ? "pontoon" : terr);
            if (te) label += "  · " + te;
            else {
              label += inBuildNet(me(), hover.x, hover.y) ? "  · in range" : "  · OUT OF RANGE";
              if (AURA_TYPES.includes(tool)) label += "  · aura r" + AURA_R;
            }
          }
        }
      }
      else if (mem) label = `${hover.x},${hover.y} last seen ${S.lastSeen[me()][hover.y][hover.x].terr}`;
      else label = `${hover.x},${hover.y}  unknown fog`;
      $("hint").textContent = label;
    } else $("hint").textContent = "";
    if (downPt && lastM) {
      const dx = mx - downPt.mx, dy = my - downPt.my;
      if (!didDrag && Math.hypot(dx, dy) > 8) {
        didDrag = true;
        dragging = true;
      }
    }
    if (dragging && lastM) {
      cam.x += mx - lastM.mx;
      cam.y += my - lastM.my;
      lastM = { mx, my };
    }
  }
  function onUp(e) {
    if (downPt && !didDrag && e.button === 0 && S && !overlayMode) clickTile(downPt.t);
    dragging = false; downPt = null; didDrag = false; lastM = null;
  }
  function onTouchStart(e) {
    e.preventDefault();
    if (!S || overlayMode) return;
    if (e.touches.length === 2) {
      pinch0 = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      downPt = null; dragging = false; didDrag = false;
      return;
    }
    const t = e.changedTouches[0];
    const fake = { clientX: t.clientX, clientY: t.clientY, button: 0 };
    onDown(fake);
  }
  function onTouchMove(e) {
    e.preventDefault();
    if (!S) return;
    if (e.touches.length === 2 && pinch0 > 0) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const r = canvas().getBoundingClientRect();
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
      const z0 = cam.z;
      cam.z = Math.max(0.22, Math.min(1.85, cam.z * (d / pinch0)));
      cam.x = mx - (mx - cam.x) * (cam.z / z0);
      cam.y = my - (my - cam.y) * (cam.z / z0);
      pinch0 = d;
      return;
    }
    const t = e.changedTouches[0];
    onMove({ clientX: t.clientX, clientY: t.clientY });
  }
  function onTouchEnd(e) {
    if (e.touches && e.touches.length >= 2) return;
    pinch0 = 0;
    onUp({ button: 0 });
  }
  function onWheel(e) {
    e.preventDefault();
    const r = canvas().getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const z0 = cam.z;
    cam.z = Math.max(0.22, Math.min(1.85, cam.z * (e.deltaY > 0 ? 0.9 : 1.1)));
    cam.x = mx - (mx - cam.x) * (cam.z / z0);
    cam.y = my - (my - cam.y) * (cam.z / z0);
  }
  function onKey(e) {
    if (overlayMode === "menu" || overlayMode === "help") return;
    const step = 28;
    if (e.key === "w" || e.key === "ArrowUp") cam.y += step;
    if (e.key === "s" || e.key === "ArrowDown") cam.y -= step;
    if (e.key === "a" || e.key === "ArrowLeft") cam.x += step;
    if (e.key === "d" || e.key === "ArrowRight") cam.x -= step;
    if (e.key === "Enter") { e.preventDefault(); $("btnEnd").click(); }
    if (e.key === "Escape") { tool = null; weapon = null; paintUI(); }
    if (e.key === " ") { e.preventDefault(); if (S && S.phase === "resolve") skipPlayback(); }
    if (e.key === "f" || e.key === "F") { pace = pace === 1 ? 2 : pace === 2 ? 4 : 1; persist.pace = pace; savePersist(); paintPace(); }
    if (e.key === "Home") { e.preventDefault(); if (S) focusHomeLand(me()); }
    if ((e.key === "r" || e.key === "R") && S && sel) {
      const b = buildingAt(sel.x, sel.y);
      if (b && b.owner === me() && S.phase === "defense") { tryRepair(b); paintUI(); }
    }
    if (e.key >= "1" && e.key <= "9") {
      const items = Array.prototype.slice.call(document.querySelectorAll("#leftRail [data-k]:not([disabled])"));
      const it = items[Number(e.key) - 1];
      if (it) it.click();
    }
  }

  function paintPace() {
    const b = $("btnPace");
    if (b) b.textContent = "Speed ×" + pace;
  }

  function skipPlayback() {
    if (!S || S.phase !== "resolve") return;
    S.skipping = true;
    let guard = 0;
    while (S && S.phase === "resolve" && guard++ < 8000) stepResolve();
    if (S) S.skipping = false;
  }

  /* ---------- game SFX (WebAudio, independent of radio mute) ---------- */
  let AC = null;
  function ac() {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume().catch(() => {});
    return AC;
  }
  function envGain(a, peak, attack, dur) {
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, a.currentTime);
    g.gain.exponentialRampToValueAtTime(peak, a.currentTime + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    g.connect(a.destination);
    return g;
  }
  function osc(a, type, f0, f1, dur, peak) {
    const o = a.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, a.currentTime);
    if (f1 != null) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), a.currentTime + dur);
    o.connect(envGain(a, peak, 0.008, dur));
    o.start(); o.stop(a.currentTime + dur + 0.02);
  }
  function noiseBurst(a, dur, peak, hp) {
    const n = a.sampleRate * dur | 0;
    const buf = a.createBuffer(1, n, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.4);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = hp ? "highpass" : "lowpass"; f.frequency.value = hp || 420;
    src.connect(f); f.connect(envGain(a, peak, 0.004, dur));
    src.start();
  }
  function fx(kind) {
    if (S && S.skipping) return;
    try {
      const a = ac();
      switch (kind) {
        case "ui": osc(a, "triangle", 880, 880, 0.05, 0.03); break;
        case "build": osc(a, "square", 180, 90, 0.12, 0.04); osc(a, "triangle", 520, 260, 0.1, 0.02); break;
        case "select": osc(a, "sine", 640, 720, 0.06, 0.025); break;
        case "error": osc(a, "sawtooth", 140, 70, 0.16, 0.04); break;
        case "probe": osc(a, "sine", 920, 420, 0.22, 0.045); osc(a, "sine", 1380, 700, 0.18, 0.02); break;
        case "launch": osc(a, "sawtooth", 240, 70, 0.28, 0.05); noiseBurst(a, 0.18, 0.03, 900); break;
        case "drop": osc(a, "triangle", 110, 48, 0.2, 0.05); noiseBurst(a, 0.12, 0.025, 200); break;
        case "boom": noiseBurst(a, 0.28, 0.07, 180); osc(a, "sawtooth", 90, 32, 0.26, 0.05); break;
        case "aa": osc(a, "square", 1400, 400, 0.12, 0.035); break;
        case "emp": osc(a, "square", 80, 40, 0.35, 0.04); noiseBurst(a, 0.3, 0.04, 1200); break;
        case "radar": osc(a, "sine", 480, 1600, 0.4, 0.02); break;
        case "phase": osc(a, "triangle", 330, 990, 0.18, 0.03); break;
        case "win": osc(a, "triangle", 523, 784, 0.35, 0.04); setTimeout(() => { try { osc(ac(), "triangle", 659, 1046, 0.4, 0.04); } catch (_) {} }, 140); break;
        case "lose": osc(a, "sawtooth", 196, 80, 0.5, 0.045); break;
        default: osc(a, "sine", 440, 440, 0.05, 0.03);
      }
    } catch (_) {}
  }
  function beep(f, d) { fx(f > 700 ? "probe" : f > 500 ? "launch" : "build"); void d; }
  function bang() { fx("boom"); }

  /* ---------- loop / boot ---------- */
  function loop(ts) {
    const now = typeof ts === "number" ? ts : performance.now();
    if (!playTs) playTs = now;
    const dt = Math.min(120, Math.max(0, now - playTs));
    playTs = now;
    if (S && S.phase === "resolve") {
      playAcc += dt * pace;
      let steps = 0;
      while (playAcc >= PLAY_TICK && steps < 8 && S && S.phase === "resolve") {
        playAcc -= PLAY_TICK;
        stepResolve();
        steps++;
      }
      if (playAcc > PLAY_TICK * 8) playAcc = 0;
      if (S && S.t % 8 === 0) {
        const el = $("log");
        if (el) el.textContent = (S.log || []).join("\n");
      }
    } else playAcc = 0;
    draw();
    raf = requestAnimationFrame(loop);
  }

  async function boot() {
    loadPersist();
    pace = persist.pace === 2 || persist.pace === 4 ? persist.pace : 1;
    paintPace();
    autoUnlock();
    ledgerFlush();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) ledgerFlush(); });
    const names = Object.keys(SPR_FILES);
    let n = 0;
    function keySprite(img, tile, kind) {
      touchTerrain();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0);
      const id = x.getImageData(0, 0, c.width, c.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const mag = r > 180 && b > 100 && g < 90 && r - g > 70;
        const hot = r > 220 && g < 70 && b > 80;
        const ink = !tile && r < 10 && g < 10 && b < 10;
        if (mag || hot || ink) d[i + 3] = 0;
      }
      x.putImageData(id, 0, 0);
      if (tile) return c;
      let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
      const d2 = x.getImageData(0, 0, c.width, c.height).data;
      for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) {
        if (d2[(y * c.width + xx) * 4 + 3] > 12) {
          if (xx < minX) minX = xx;
          if (y < minY) minY = y;
          if (xx > maxX) maxX = xx;
          if (y > maxY) maxY = y;
        }
      }
      if (maxX <= minX || maxY <= minY) return c;
      const pad = 2;
      minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
      maxX = Math.min(c.width - 1, maxX + pad); maxY = Math.min(c.height - 1, maxY + pad);
      const w = maxX - minX + 1, h = maxY - minY + 1;
      const out = document.createElement("canvas");
      out.width = w; out.height = h;
      out.getContext("2d").drawImage(c, minX, minY, w, h, 0, 0, w, h);
      const ratio = h / w;
      const SIT = { gun: 0.68, mine: 0.7, radar: 0.93, marine: 0.84, tank: 0.84, scout: 0.84, aa: 0.8, pad: 0.7, drone: 0.78, hover: 0.8, jet: 0.72, arty: 0.84 };
      out._sit = SIT[kind] || (ratio > 1.35 ? 0.92 : ratio < 0.85 ? 0.7 : 0.86);
      return out;
    }
    const TILE_KEYS = { plains: 1, hills: 1, forest: 1, water: 1, ruins: 1, desert: 1, pontoon: 1, fog: 1 };
    await Promise.all(names.map((k) => new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        SPR[k] = String(k).startsWith("tex-") ? img : keySprite(img, !!TILE_KEYS[k], k);
        n++; $("bootMsg").textContent = `Assets ${n}/${names.length}`; res();
      };
      img.onerror = () => { SPR[k] = null; n++; res(); };
      img.src = ASSET + SPR_FILES[k];
    })));
    $("boot").classList.add("hidden");
    $("app").classList.remove("hidden");
    const cv = canvas();
    cv.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    cv.addEventListener("wheel", onWheel, { passive: false });
    cv.addEventListener("touchstart", onTouchStart, { passive: false });
    cv.addEventListener("touchmove", onTouchMove, { passive: false });
    cv.addEventListener("touchend", onTouchEnd, { passive: false });
    cv.addEventListener("touchcancel", onTouchEnd, { passive: false });
    cv.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", resize);
    $("btnEnd").onclick = () => {
      if (!S) return;
      if (S.phase === "deploy") endDeploy();
      else if (S.phase === "defense") endDefense();
      else if (S.phase === "offense") endOffense();
    };
    $("btnSkip").onclick = skipPlayback;
    $("btnPace").onclick = () => {
      pace = pace === 1 ? 2 : pace === 2 ? 4 : 1;
      persist.pace = pace;
      savePersist();
      paintPace();
    };
    $("btnHelp").onclick = showHelp;
    $("btnMenu").onclick = () => {
      if (enemyTimer) { clearTimeout(enemyTimer); enemyTimer = 0; }
      S = null;
      showMenu();
    };
    loop();
    showMenu();
  }

  boot();
})();
