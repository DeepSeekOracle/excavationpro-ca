/* LYGO Arena — engine.
   A real-time arena: two AI teams, one tile arena built from Lattice Crypt's stone, every
   body moving, aiming, casting and dying on its own. The player does not drive anyone.
   Spectating is the game — so everything worth watching is telegraphed, numbered and logged.

   Public surface (window.ArenaEngine) is deliberately probe-friendly: state() returns the
   live match, so a verification harness can run a battle without touching the DOM. */
(function (w) {
  "use strict";

  const TILE = 32;
  const R = w.LYGO_ARENA;
  const BANTER = w.LYGO_BANTER || null;      // optional: the fight runs without it

  /* The fifteen seconds before the bell belong to the booth. He names the ring, names both
     teams, and asks the only question that matters; nothing else in the arena speaks until he
     is done. Every cue is on the clock, so the overlay can reveal each roster with the words. */
  const INTRO_S = 15;
  /* What outranks what. The booth outranks a body at equal priority, a wipe outranks a taunt,
     and the bell outranks everything -- the director decides who actually gets to talk. */
  const PRIO_BODY = { die: 2, hurt: 2, lose: 2, miss: 2, taunt: 3, cc: 3, block: 3, crit: 3,
    ready: 4, cleanse: 4, saved: 5, rise: 6, kill: 7, ace: 8, win: 8 };
  const PRIO_CAST = { hold: 3, tide: 4, save: 5, edge: 6, law: 6, kill: 7, draw: 7, recall: 7,
    firstBlood: 8, wipe: 8, ace: 8, sudden: 8,
    mapEnd: 8, matchEnd: 9, open: 9, introRing: 9, introTeam: 9, introScore: 9, introShow: 9, ready: 9, bell: 10 };

  /* A line never touches Math.random: the sim is seeded, and a pick that shifted the stream
     would move every number the harness measures. Picks ride the talk counter instead. */
  function picker(seed) {
    let s = (seed >>> 0) || 1;
    return function () { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 8) / 16777216; };
  }
  const MAP_W = 34, MAP_H = 22;
  const STEP = 1 / 60;
  const SUDDEN = 180;          // sudden death: damage starts climbing at three minutes
  const HARD_STOP = 600;       // ten minutes, then the map is a draw
  const SUDDEN_STEPS = 4;      // +25% each minute, four steps, cap +100% (double)
  /* A pure function of the clock. 1 before 3:00, then 1.25, 1.50, 1.75, and 2.00 from 6:00. */
  function suddenScale(t) {
    if (t < SUDDEN) return 1;
    const mins = Math.floor((t - SUDDEN) / 60) + 1;
    return 1 + Math.min(SUDDEN_STEPS, mins) * 0.25;
  }

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const dist2 = (a, b, c, d) => Math.hypot(a - c, b - d);
  const rnd = (n) => (Math.random() * n) | 0;

  /* ------------------------------------------------------------- atlases --- */
  const AT = { heroes: null, creatures: null, pets: null, tiles: null, fx: null, meta: {} };
  const FLOOR_SKIN = {};
  function loadImg(src) {
    return new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("missing " + src));
      i.src = src;
    });
  }
  async function loadAssets() {
    if (AT.heroes) return AT;
    const pairs = [["heroes", "heroes.png"], ["creatures", "creatures.png"], ["pets", "pets.png"], ["tiles", "tiles.png"], ["fx", "fx.png"]];
    const out = await Promise.all(pairs.map(([k, f]) => Promise.all([loadImg("./assets/" + f), fetch("./assets/" + k + ".json").then((r) => r.json())])));
    pairs.forEach(([k], i) => { AT[k] = out[i][0]; AT.meta[k] = out[i][1]; });
    /* Mats load on demand: one ring per fight, and the set is 51 MB. */
    return AT;
  }
  /* Photo skins. Sponsor type is already in the file, so the booth floor is a picture, not a tile.
     ONE ring, and only the ring a match is about to draw: eager-loading all seventeen was 51 MB
     before the menu was usable, and the fifteen-second walk-in is long enough to fetch one. */
  /* The newer mats ship as JPEG: the same picture for about a tenth of the bytes. */
  const FLOOR_JPG = {
    basalt: 1, nightrun: 1, glacier: 1, gantry: 1, granite: 1,
    rustbelt: 1, highland: 1, marble: 1, flagstone: 1, tideline: 1
  };
  const FLOOR_TRIED = {};
  function wantFloor(k) {
    if (!k || FLOOR_SKIN[k] || FLOOR_TRIED[k]) return;
    FLOOR_TRIED[k] = true;
    const img = new Image();
    img.onload = () => {
      FLOOR_SKIN[k] = img;
      if (S.lv && (S.lv.floor || S.lv.realm) === k) floorCv = paintFloor(S.lv);
    };
    img.onerror = () => { FLOOR_TRIED[k] = false; };   /* a failed mat may be retried */
    img.src = "./assets/floors/" + k + (FLOOR_JPG[k] ? ".jpg" : ".png") + "?v=3";
  }
  function atlasFor(sheet) { return AT[sheet]; }
  function cellOf(sheet, key, frame) {
    const m = AT.meta[sheet];
    let name = key;
    if (sheet === "heroes") name = key + "_" + (frame.face | 0) + "_" + (frame.fr | 0);
    else if (sheet === "creatures" || sheet === "pets") name = key + "_" + (frame.fr | 0);
    let i = m.names[name];
    if (i == null && sheet === "heroes") i = m.names[key + "_0_" + (frame.fr | 0)];
    if (i == null) return null;
    return { sx: (i % m.cols) * m.cell, sy: ((i / m.cols) | 0) * m.cell, cell: m.cell };
  }

  /* Small sprite icons for the picker and the HUD, cut straight out of the atlas. */
  const iconCache = {};
  function iconFor(tpl) {
    if (iconCache[tpl.id]) return iconCache[tpl.id];
    const sheet = tpl.spr.sheet;
    const img = AT[sheet];
    if (!img) return "";
    const c = cellOf(sheet, tpl.spr.key, { face: 0, fr: 0 });
    if (!c) return "";
    const cv = document.createElement("canvas");
    cv.width = c.cell; cv.height = c.cell;
    const cx = cv.getContext("2d");
    cx.imageSmoothingEnabled = false;
    cx.drawImage(img, c.sx, c.sy, c.cell, c.cell, 0, 0, c.cell, c.cell);
    const url = cv.toDataURL("image/png");
    iconCache[tpl.id] = url;
    return url;
  }

  /* ----------------------------------------------------------------- map ---
     One arena, mirrored down the middle so neither side owns a lane: a border, cover blocks
     on each flank, a central spine with gaps top and bottom, and four alcoves. Everything a
     spectator needs to read a fight: two ways round, cover to break sight, open middle. */
  const REALMS = ["stone", "frost", "ember", "gold", "lattice", "void", "tide", "root"];
  /* The law stays on the realm. The mat is a separate draw, so the canvas
     rotates through the set instead of locking to the ring. Ten more mats joined
     the pool — CC0 Poly Haven grounds composed by tools/gen_arena_mats.py — so the
     canvas to draw from is twenty-seven, and every mode lands on any of them. */
  const FLOORS = [
    "stone", "frost", "ember", "gold", "lattice", "void", "tide", "root",
    "ca-canvas", "ca-night", "ca-ember",
    "circle-gold", "circle-frost", "ring-tide",
    "bare-sand", "bare-night", "bare-earth",
    "basalt", "nightrun", "glacier", "gantry", "granite",
    "rustbelt", "highland", "marble", "flagstone", "tideline"
  ];
  function floorPick(seed) {
    const n = Math.abs(seed | 0);
    return FLOORS[((Math.imul(n, 13) + 7) >>> 0) % FLOORS.length];
  }
  /* Each ring is a small readable law. Numbers stay mild so a 3v3 still ends. */
  const LAWS = {
    stone: { name: "Stone Ring", line: "Stone Ring — the floor takes no side." },
    frost: { name: "Frost Ring", line: "Frost Ring — every stride is shorter." },
    ember: { name: "Ember Ring", line: "Ember Ring — the centre burns." },
    gold: { name: "Gold Ring", line: "Gold Ring — a kill pays the killer a spark." },
    lattice: { name: "Lattice Ring", line: "Lattice Ring — moves come back faster." },
    void: { name: "Void Ring", line: "Void Ring — a fall leaves a slow pocket." },
    tide: { name: "Tide Ring", line: "Tide Ring — the floor shoves every few seconds." },
    root: { name: "Root Ring", line: "Root Ring — the floor feeds whoever is still standing." }
  };
  function lawById(id) { return LAWS[id] || LAWS.stone; }
  function lawForSeed(seed) {
    return lawById(REALMS[(seed == null ? 0 : Math.abs(seed | 0)) % REALMS.length]);
  }
  /* ---------------------------------------------------------- the colosseums ---
     Five kinds of fighting ground, all mirrored down the middle so neither side
     owns a lane, all deliberately nearly empty: the obstacles are few and every one
     of them is worth standing next to. That is the whole design brief — cover to
     break a sight line, a gap to hold, a lane to run, and open sand everywhere else
     so a body that wants to go somewhere can go there.

       colosseum  the classic: open oval sand, four pillar knots on the diagonals
       gauntlet   a spine down the middle with a mouth at each end, and two ways round
       pit        low cross-walls with single-tile gates — four doorways to fight over
       colonnade  two broken rows of pillars, making lanes and hard cover
       ruin       a court of rubble: three short walls, scattered tooth-shaped blocks

     Every kind is authored for the left half and mirrored, then repaired: the spawn
     aprons are cleared and anything the repair cuts through is linked back in, so no
     seed can strand a body behind stone. */
  const KINDS = ["colosseum", "gauntlet", "pit", "colonnade", "ruin"];
  /* COVER off: every ring is swept down to bare sand. Nothing to walk round, nothing
     to get caught on, so what a body does is the brain's doing and not the walls'.
     Flip it back to true and all five layouts return exactly as they were. */
  const COVER = false;
  const KIND_BLURB = COVER ? {
    colosseum: "Colosseum — open sand, cover on the corners.",
    gauntlet: "Gauntlet — a spine down the middle and a mouth at each end.",
    pit: "The Pit — four doorways in a low wall. Hold one or lose the middle.",
    colonnade: "Colonnade — pillars in rows: lanes to run, columns to hide behind.",
    ruin: "Ruin — a court of broken walls and loose stone."
  } : {
    colosseum: "Colosseum — swept sand and one ring to settle it in.",
    gauntlet: "Gauntlet — a long floor and a mouth at each end.",
    pit: "The Pit — open ground, and the floor takes no side.",
    colonnade: "Colonnade — a wide court with the columns gone.",
    ruin: "Ruin — a court of cracked slabs, swept flat."
  };
  /* which colosseum a seed stands in — derived from the seed so the pre-fight card can
     name it before the match exists */
  function kindOf(seed) { return KINDS[(((seed | 0) >> 3) % KINDS.length + KINDS.length) % KINDS.length]; }
  function buildMap(seed) {
    const t = [];
    for (let y = 0; y < MAP_H; y++) { t.push([]); for (let x = 0; x < MAP_W; x++) t[y].push("floor"); }
    const block = (x, y, w, h) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const px = x + i, py = y + j;
        if (px > 0 && py > 0 && px < MAP_W - 1 && py < MAP_H - 1) t[py][px] = "wall";
      }
    };
    const carve = (x, y, w, h) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const px = x + i, py = y + j;
        if (px >= 0 && py >= 0 && px < MAP_W && py < MAP_H) t[py][px] = "floor";
      }
    };
    for (let x = 0; x < MAP_W; x++) { t[0][x] = "wall"; t[MAP_H - 1][x] = "wall"; }
    for (let y = 0; y < MAP_H; y++) { t[y][0] = "wall"; t[y][MAP_W - 1] = "wall"; }
    /* both a mirrored block and its twin, so a builder only writes the left half */
    const twin = (x, y, w2, h) => { block(x, y, w2, h); block(MAP_W - x - w2, y, w2, h); };

    const kind = kindOf(seed);
    /* the layouts, kept whole. COVER off leaves the floor bare: no pillars, no
       walls, no loose stone — the outer ring is the only stone in the arena. */
    if (COVER) {
      if (kind === "colosseum") {
      /* four knots on the diagonals, two tiles square, and nothing in the middle:
         the centre of a colosseum is where the fight should happen */
      twin(7, 5, 2, 2); twin(7, 15, 2, 2);
      twin(12, 9, 2, 1); twin(12, 12, 2, 1);
      twin(4, 10, 1, 2);
    } else if (kind === "gauntlet") {
      /* the spine, with a wide mouth above and below it, and a shoulder to break
         sight on each flank — the only structure that rewards holding a gap */
      for (let y = 7; y <= 14; y++) { t[y][MAP_W / 2 - 1 | 0] = "wall"; t[y][MAP_W / 2 | 0] = "wall"; }
      twin(5, 3, 2, 2); twin(5, 17, 2, 2);
      twin(9, 8, 2, 1); twin(9, 13, 2, 1);
      twin(12, 1, 3, 2); twin(12, 19, 3, 2);
    } else if (kind === "pit") {
      /* low cross-walls with single-tile gates: four doorways, and open sand in
         the middle, where the pit is */
      for (let x = 8; x <= 14; x++) { if (x !== 10 && x !== 12) { t[6][x] = "wall"; t[MAP_H - 7][x] = "wall"; } }
      for (let y = 7; y <= 14; y++) { if (y !== 10 && y !== 12) { t[y][16] = "wall"; t[y][MAP_W - 17] = "wall"; } }
      twin(3, 5, 1, 2); twin(3, 15, 1, 2);
    } else if (kind === "colonnade") {
      /* two rows of single pillars: lanes between them, and a column to break the
         line of every gun in the arena */
      for (let x = 6; x <= 13; x += 3) { t[7][x] = "wall"; t[MAP_H - 8][x] = "wall"; }
      for (let x = 8; x <= 13; x += 3) { t[4][x] = "wall"; t[MAP_H - 5][x] = "wall"; }
      twin(2, 10, 1, 2); twin(14, 10, 1, 2);
      t[MAP_H / 2 | 0][MAP_W / 2 - 1 | 0] = "wall"; t[MAP_H / 2 | 0][MAP_W / 2 | 0] = "wall";
    } else {
      /* ruin: three short walls at different angles of the court, plus loose stone */
      twin(6, 4, 3, 1); twin(6, 17, 3, 1);
      twin(12, 2, 1, 3); twin(12, 17, 1, 3);
      twin(9, 10, 1, 1); twin(4, 8, 1, 1); twin(4, 13, 1, 1);
      t[4][16] = "wall"; t[MAP_H - 5][16] = "wall";
    }

    }
    /* spawn pockets stay clear — nothing in front of a gate is a fair arena */
    const slots = spawnSlots();
    slots.forEach((s) => carve(s.x - 2, s.y - 1, 5, 3));
    /* guaranteed connectivity: flood from the left pocket, cut to anything stranded */
    const seen = flood(t, 2, 11);
    slots.forEach((s) => {
      if (!seen[s.y * MAP_W + s.x]) {
        let x = 2, y = s.y;
        while (x !== s.x) { t[y][x] = "floor"; x += Math.sign(s.x - x) || 0; if (x === s.x) break; }
        x = s.x;
        while (y !== 11) { t[y][x] = "floor"; y += Math.sign(11 - y) || 0; if (y === 11) break; }
      }
    });
    return { W: MAP_W, H: MAP_H, tiles: t, realm: REALMS[seed % REALMS.length], kind: kind, floor: floorPick(seed) };
  }
  function spawnSlots() {
    const out = [];
    for (let i = 0; i < 5; i++) {
      const y = 3 + i * 4;
      out.push({ x: 3, y: y, team: 0 });
      out.push({ x: MAP_W - 4, y: y, team: 1 });
    }
    return out;
  }
  function flood(t, sx, sy) {
    const seen = new Uint8Array(MAP_W * MAP_H);
    const q = [sy * MAP_W + sx];
    seen[q[0]] = 1;
    while (q.length) {
      const i = q.pop(), x = i % MAP_W, y = (i / MAP_W) | 0;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (nx < 1 || ny < 1 || nx >= MAP_W - 1 || ny >= MAP_H - 1) return;
        const ni = ny * MAP_W + nx;
        if (seen[ni] || t[ny][nx] === "wall") return;
        seen[ni] = 1; q.push(ni);
      });
    }
    return seen;
  }
  function solid(lv, tx, ty) {
    if (tx < 0 || ty < 0 || tx >= lv.W || ty >= lv.H) return true;
    return lv.tiles[ty][tx] === "wall";
  }
  function solidAt(lv, x, y) { return solid(lv, Math.floor(x / TILE), Math.floor(y / TILE)); }

  /* flow field: BFS from a destination cell, cached per destination. Units sharing a target
     share the field, so thirty bodies cost about one BFS. */
  const fieldCache = new Map();
  function flowField(lv, tx, ty) {
    const key = ty * lv.W + tx;
    let f = fieldCache.get(key);
    if (f) return f;
    const next = new Int32Array(lv.W * lv.H).fill(-2);
    if (solid(lv, tx, ty)) { fieldCache.set(key, next); return next; }
    const start = key;
    next[start] = -1;
    let q = [start];
    while (q.length) {
      const nq = [];
      for (let k = 0; k < q.length; k++) {
        const i = q[k], x = i % lv.W, y = (i / lv.W) | 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= lv.W || ny >= lv.H) return;
          const ni = ny * lv.W + nx;
          if (next[ni] !== -2 || lv.tiles[ny][nx] === "wall") return;
          next[ni] = i;
          nq.push(ni);
        });
      }
      q = nq;
    }
    if (fieldCache.size > 40) fieldCache.clear();
    fieldCache.set(key, next);
    return next;
  }

  /* --------------------------------------------------------------- state --- */
  let canvas = null, ctx = null, floorCv = null;
  const S = {
    phase: "idle",           // idle | count | live | over
    mode: 3,
    lv: null,
    your: [], foe: [],
    projectiles: [], pending: [], drops: [], texts: [], marks: [], swings: [],
    time: 0, speed: 1, paused: false, countdown: 0,
    events: [], winner: null, over: false, sudden: false,
    rng: 0, shake: 0, hitStop: 0, zones: [], tideIn: 12
  };
  let seq = 0;
  function pushEvent(text, kind, sfx) {
    S.events.push({ t: S.time, text: text, kind: kind || "", sfx: sfx || "" });
    if (S.events.length > 140) S.events.shift();
  }

  /* ------------------------------------------------------------- entity --- */
  function mkEntity(built, team, x, y, isToken) {
    return {
      /* Team is normalised here and nowhere else: every helper downstream tests
         `=== 0`, so a pet spawned with "0", undefined or 1-as-string used to read as
         the enemy side and attack its own team. One coercion kills that class. */
      uid: ++seq, team: (Number(team) === 1 ? 1 : 0), b: built, x: x * TILE, y: y * TILE,
      hp: built.max, max: built.max, mana: built.manaMax, shd: Math.round(built.max * (built.mods.startShield || 0)),
      armorBuff: 0, armorBuffT: 0,
      stun: 0, root: 0, silence: 0, slowT: 0, slowV: 0, swiftT: 0, swiftV: 0, hasteT: 0, hasteV: 0,
      woundT: 0, woundV: 0,
      rageT: 0, rageV: 0, weakT: 0, weakV: 0,
      burnT: 0, burnDps: 0, burnBank: 0, burnFrom: null,
      bleedT: 0, bleedDps: 0, bleedBank: 0, bleedFrom: null,
      regenT: 0, regenHps: 0, thornsT: 0, thornsV: 0, reflectT: 0, reflectV: 0, veilT: 0, veilV: 0,
      lifestealT: 0, lifestealV: 0, tauntT: 0, shieldWallT: 0,
      cds: built.moves.map(() => 0), atkCd: 0.6 + Math.random() * 0.5,
      face: 0, walk: 0, animT: 0, animMax: 0.34, animVis: "", aimA: 0, flash: 0, dead: false, dieT: 0,
      target: null, retarget: 0, stuck: 0, lastX: 0, lastY: 0, kite: 0, idleT: 0,
      firstUsed: false, usedLastStand: false, usedRevive: false, usedCleanse: false, lastCardCheck: 0,
      kills: 0, dmgDone: 0, healDone: 0, taken: 0, uses: {}, tokens: 0, ttl: isToken ? (built.ttl || 20) : 0,
      isToken: !!isToken
    };
  }

  function mkTeam(ids, team) {
    const tpls = ids.map((id) => (typeof id === "string" ? R.byId[id] : id)).filter(Boolean);
    const built = R.buildTeam(tpls);
    const slots = spawnSlots().filter((s) => s.team === team);
    const mid = (tpls.length - 1) / 2;
    return built.map((b, i) => {
      const slot = slots[clamp(i, 0, slots.length - 1)];
      const y = clamp(slot.y + (i - mid) * 0.3, 1.6, MAP_H - 2.6);
      return mkEntity(b, team, slot.x + (b.range > 100 ? -0.5 : 0.3), y, false);
    });
  }

  function all() { return S.your.concat(S.foe); }
  function live(team) { return (team == null ? all() : (team === 0 ? S.your : S.foe)).filter((e) => !e.dead); }
  function enemiesOf(e) { return live(e.team === 0 ? 1 : 0); }
  function alliesOf(e) { return live(e.team); }

  /* --------------------------------------------------------------- stats --- */
  function buffed(e) {
    const b = e.b;
    const hpFrac = e.hp / e.max;
    let dmg = b.dmg * (1 + (e.rageT > 0 ? e.rageV : 0)) * (1 - (e.weakT > 0 ? e.weakV : 0));
    if (b.mods.fury && hpFrac < 0.4) dmg *= 1 + b.mods.fury;
    /* Hall Standard and A New Accord belong to the ally who is still standing.
       They are not baked into the sheet, so they leave when that body does. */
    let auraDmg = 0, auraArmor = 0;
    alliesOf(e).forEach((a) => {
      if (a === e) return;
      auraDmg += a.b.mods.auraDmg || 0;
      auraArmor += a.b.mods.auraArmor || 0;
    });
    dmg *= 1 + auraDmg;
    let speed = b.speed * (1 + (e.swiftT > 0 ? e.swiftV : 0)) * (1 - (e.slowT > 0 ? e.slowV : 0)) * (e.stun > 0 || e.root > 0 ? 0 : 1);
    if (S.lv && S.lv.realm === "frost") speed *= 0.88;
    return {
      dmg: dmg,
      rate: b.rate * (1 + (e.hasteT > 0 ? e.hasteV : 0)),
      speed: speed,
      armor: b.armor + e.armorBuff + auraArmor,
      range: b.range + (e.shieldWallT > 0 ? 12 : 0)
    };
  }
  function statusList(e) {
    const out = [];
    if (e.stun > 0) out.push(["stun", e.stun]);
    if (e.root > 0) out.push(["root", e.root]);
    if (e.silence > 0) out.push(["hush", e.silence]);
    if (e.slowT > 0) out.push(["slow", e.slowT]);
    if (e.swiftT > 0) out.push(["swift", e.swiftT]);
    if (e.hasteT > 0) out.push(["haste", e.hasteT]);
    if (e.rageT > 0) out.push(["rage", e.rageT]);
    if (e.weakT > 0) out.push(["weak", e.weakT]);
    if (e.burnT > 0) out.push(["burn", e.burnT]);
    if (e.bleedT > 0) out.push(["bleed", e.bleedT]);
    if (e.regenT > 0) out.push(["regen", e.regenT]);
    if (e.thornsT > 0) out.push(["thorn", e.thornsT]);
    if (e.reflectT > 0) out.push(["mirror", e.reflectT]);
    if (e.veilT > 0 || e.b.mods.veil) out.push(["veil", e.veilT]);
    if (e.shd > 0) out.push(["aegis", e.shd]);
    if (e.tauntT > 0) out.push(["taunt", e.tauntT]);
    if (e.lifestealT > 0) out.push(["drink", e.lifestealT]);
    if (e.woundT > 0) out.push(["wound", e.woundT]);
    return out;
  }
  /* ----------------------------------------------------------------- talk ---
     Bubbles are not decoration: every one is a real event with a name on it. A kill makes
     the killer say something over the body and the body answer back, and the caster call is
     written from the same numbers the recap will print later. */
  function mmss(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ":" + (s < 10 ? "0" : "") + s; }
  function pushTalk(kind, who, foe, hot) {
    if (!BANTER || !who || !who.b) return;
    S.talk = S.talk || []; S.bubbles = S.bubbles || [];
    /* A kill, a fall, and the close of the map may talk over the quiet. Everything else
       waits, and a body never wears two bubbles: the new line replaces the old one. */
    const big = kind === "kill" || kind === "die" || kind === "win" || kind === "lose" || kind === "ace" || kind === "rise";
    S.mouthAt = S.mouthAt || {};
    const lastMouth = S.mouthAt[who.uid] == null ? -99 : S.mouthAt[who.uid];
    if (!big && S.time - lastMouth < 9) return;
    if (!big && S.time - (S.lastTalk == null ? -99 : S.lastTalk) < 7) return;
    const text = BANTER.line(kind, who.b, foe && foe.b, picker(S.talkSeq * 31 + 7));
    if (!text) return;
    S.lastTalk = S.time;
    S.mouthAt[who.uid] = S.time;
    const bubble = { who: who, text: text, life: 3.0, col: who.b.color || "#fbbf24" };
    const mine = S.bubbles.findIndex((b) => b.who === who);
    if (mine >= 0) S.bubbles[mine] = bubble;
    else {
      while (S.bubbles.length >= 2) S.bubbles.shift();
      S.bubbles.push(bubble);
    }
    S.talk.push({ seq: ++S.talkSeq, kind: kind, caster: false, who: who.b.id, whoName: who.b.name,
      foeName: (foe && foe.b && foe.b.name) || "", text: text, t: S.time, hot: !!hot,
      prio: PRIO_BODY[kind] != null ? PRIO_BODY[kind] : 3 });
    if (S.talk.length > 80) S.talk.shift();
  }
  function pushCast(kind, vars) {
    if (!BANTER) return;
    const text = BANTER.cast(kind, vars || {}, picker(S.talkSeq * 17 + 3));
    if (!text) return;
    S.talk = S.talk || [];
    S.talk.push({ seq: ++S.talkSeq, kind: kind, caster: true, text: text, t: S.time, hot: true,
      prio: PRIO_CAST[kind] != null ? PRIO_CAST[kind] : 6 });
    if (S.talk.length > 80) S.talk.shift();
  }
  /* Misses, blocks and crits are colour, not the story. One of them every few seconds,
     and never loud enough to step on a kill. */
  function colorLine(kind, who, foe) {
    if (S.time - (S.lastColor == null ? -9 : S.lastColor) < 16) return;
    S.lastColor = S.time;
    pushTalk(kind, who, foe, false);
  }
  function isMender(b) { return !!(b && (b.moves || []).some((m) => m.st && m.st.heal)); }
  /* ---- CONTROL THAT DEGRADES ITSELF WHEN IT IS SPAMMED ---------------------------
     Every arena game with hard control carries this, and this roster is why it needs it:
     eleven kits lay a stun, root, silence, pull or knock, and the group fight is exactly
     where they stack -- three bodies holding one is how a dive dies, and it is also how a
     melee buff turns the game into a prison. So hard control costs more each time it lands
     on the SAME body inside the window: full, then 60%, then 35% for everything after, and
     never below a floor (a hold of zero is a lie the player cannot see). Slows and
     weaknesses are the "slight edge" tools and decay more gently. The window clears itself,
     so control used properly is untouched and control used as a spam pays for it. */
  const CC_WIN = 5, CC_HARD = [1, 0.6, 0.35], CC_SOFT = [1, 0.8, 0.6], CC_FLOOR = 0.25;
  function dr(e, kind) {
    const now = S.time || 0;
    const key = kind === "hard" ? "ccHard" : "ccSoft";
    /* the counters are separate on purpose: a slow must not make the next stun weaker */
    if (!e[key] || now - e[key].t > CC_WIN || now < e[key].t) e[key] = { t: now, n: 0 };
    e[key].n++; e[key].t = now;
    const table = kind === "hard" ? CC_HARD : CC_SOFT;
    return table[Math.min(e[key].n - 1, table.length - 1)];
  }
  function applySt(e, st, from) {
    if (!st) return;
    /* A max accumulator that outlives its timer lies about strength. slowV and weakV were
       only ever raised with Math.max and never cleared, so once a body had been slowed hard
       a fresh, weaker slow read as the old one -- which is precisely the case the control
       degradation creates on purpose, so the soft half of it was silently a no-op. The
       values are cleared with their clocks (and only then, so nothing else moves). */
    if (!(e.slowT > 0)) e.slowV = 0;
    if (!(e.weakT > 0)) e.weakV = 0;
    /* Unwrite Ink: the first stun, root or silence aimed at this body does not land. */
    if (from && from !== e && from.team !== e.team && !e.usedCleanse &&
        e.b.cards.some((c) => c.hook === "cleanse") && (st.stun || st.root || st.silence)) {
      e.usedCleanse = true;
      st = Object.assign({}, st);
      delete st.stun; delete st.root; delete st.silence;
      pushEvent(e.b.name + " shrugs the first hold — Unwrite Ink.", "gift");
      pushTalk("cleanse", e, from, false);
    }
    /* one scale per APPLICATION, not per field: a move carrying a stun and a root is one
       press of the button, and counting it twice would punish a kit for its own design.
       Hostile control only -- a body's own haste or rage is nobody's spam. */
    const hostile = from && from !== e && from.team !== e.team;
    const hardHit = !!(st.stun || st.root || st.silence || st.pull || st.knock);
    const softHit = !!(st.slow || st.weak);
    const hs = hostile && hardHit ? dr(e, "hard") : 1;
    const ss = hostile && softHit ? dr(e, "soft") : 1;
    if (st.stun) e.stun = Math.max(e.stun, Math.max(CC_FLOOR, st.stun * hs));
    if (from && from.team !== e.team && (st.stun || st.root)) {
      pushTalk("cc", from, e, false);
      if ((S.time - (S.lastHold == null ? -9 : S.lastHold)) > 4) { S.lastHold = S.time; pushCast("hold", { me: from.b.name }); }
    }
    if (st.root) e.root = Math.max(e.root, Math.max(CC_FLOOR, st.root * hs));
    if (st.silence) e.silence = Math.max(e.silence, Math.max(CC_FLOOR, st.silence * hs));
    if (st.slow) { e.slowT = Math.max(e.slowT, st.slow[1]); e.slowV = Math.max(e.slowV, st.slow[0] * ss); }
    if (st.swift) { e.swiftT = Math.max(e.swiftT, st.swift[1]); e.swiftV = Math.max(e.swiftV, st.swift[0]); }
    if (st.haste) { e.hasteT = Math.max(e.hasteT, st.haste[1]); e.hasteV = Math.max(e.hasteV, st.haste[0]); }
    if (st.rage) { e.rageT = Math.max(e.rageT, st.rage[1]); e.rageV = Math.max(e.rageV, st.rage[0]); }
    if (st.weak) { e.weakT = Math.max(e.weakT, st.weak[1]); e.weakV = Math.max(e.weakV, st.weak[0] * ss); }
    if (st.burn) {
      if (st.burn[0] >= (e.burnDps || 0)) { e.burnDps = st.burn[0]; e.burnFrom = from || null; }
      e.burnT = Math.max(e.burnT, st.burn[1]);
    }
    if (st.bleed) {
      if (st.bleed[0] >= (e.bleedDps || 0)) { e.bleedDps = st.bleed[0]; e.bleedFrom = from || null; }
      e.bleedT = Math.max(e.bleedT, st.bleed[1]);
    }
    if (st.regen) { e.regenT = Math.max(e.regenT, st.regen[1]); e.regenHps = Math.max(e.regenHps, st.regen[0]); }
    if (st.thorns) { e.thornsT = Math.max(e.thornsT, st.thorns[1]); e.thornsV = Math.max(e.thornsV, st.thorns[0]); }
    if (st.reflect) { e.reflectT = Math.max(e.reflectT, st.reflect[1]); e.reflectV = Math.max(e.reflectV, st.reflect[0]); }
    if (st.veil) { e.veilT = Math.max(e.veilT, st.veil[1]); e.veilV = Math.max(e.veilV, st.veil[0]); }
    if (st.wound) { e.woundT = Math.max(e.woundT || 0, st.wound[1]); e.woundV = Math.max(e.woundV || 0, st.wound[0]); }
    if (st.lifesteal) { e.lifestealT = Math.max(e.lifestealT, st.lifesteal[1]); e.lifestealV = Math.max(e.lifestealV, st.lifesteal[0]); }
    if (st.aegis) {
      /* A second plate does not stack on one that is still up. Two doors
         were casting ward on cooldown, the shield only grew, and the
         ten-minute map ended with both of them still full. */
      if (!(e.shd > 0)) e.shd += Math.round(e.max * st.aegis);
    }
    /* Shield Wall: the body becomes the thing the other team has to hit. */
    if (st.taunt) {
      e.tauntT = Math.max(e.tauntT || 0, st.taunt);
      e.shieldWallT = Math.max(e.shieldWallT || 0, st.taunt);
    }
    if (st.armor) { e.armorBuff = Math.max(e.armorBuff, st.armor[0]); e.armorBuffT = Math.max(e.armorBuffT, st.armor[1]); }
    if (st.heal) { const amt = Math.round(e.max * st.heal); heal(e, amt, from); }
    if (st.cdReset) e.cds = e.cds.map(() => 0.15);
    if (st.knock) shove(e, from, Math.max(0.5, st.knock * hs) * TILE);
    if (st.pull) pullTo(e, from, Math.max(0.5, st.pull * hs) * TILE);
  }
  function heal(e, amt, from) {
    if (e.dead) return 0;
    /* a wound that will not close: everything mended into this body lands short while it
       lasts. The menders are the reason the ladder was a staircase, so the answer to a
       mender is a kit that makes mending expensive rather than another body to stand in
       front of it. */
    if (e.woundT > 0 && amt > 0) {
      const cut = Math.round(amt * e.woundV);
      if (cut > 0) { amt -= cut; S.woundCut = (S.woundCut || 0) + cut; }
    }
    const before = e.hp;
    e.hp = Math.min(e.max, e.hp + amt);
    const real = e.hp - before;
    if (from && real > 0) {
      from.healDone += real;
      /* "utility" has to mean something: the mending that lands on somebody else is
         counted apart from a kit drinking its own flask */
      if (from !== e) from.healOut = (from.healOut || 0) + real;
      /* a real save, not a top-up: the mender gets credit out loud */
      if (from !== e && e.hp / e.max < 0.55 && real > e.max * 0.07 && S.time - (S.lastSave == null ? -9 : S.lastSave) > 5) {
        S.lastSave = S.time;
        pushTalk("saved", from, e, false);
        pushCast("save", { mender: from.b.name, victim: e.b.name });
      }
    }
    if (real > 2) S.texts.push({ x: e.x, y: e.y - 22, t: "+" + Math.round(real), life: 0.9, col: "#6ee7b7" });
    return real;
  }
  /* facing and aim in one place: sprites use 0 front, 2 side (mirrored), 3 the other side.
     A swing owns the facing until it finishes. A body standing on its target used to
     flip left and right every step, because the sign of a few pixels changed, and the
     mirror read as a spin. The new face has to win three steps before it is drawn. */
  function faceTo(e, x, y) {
    if (e.animT > 0.04) return;
    const dx = x - e.x, dy = y - e.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 18) e.aimA = Math.atan2(dy, dx);
    if (dist < 18) return;
    let next = 0;
    if (Math.abs(dx) > Math.abs(dy) * 0.85 && Math.abs(dx) > 12) next = dx > 0 ? 3 : 2;
    if (next === e.face) { e.faceN = 0; return; }
    e.faceN = e.faceWant === next ? (e.faceN || 0) + 1 : 1;
    e.faceWant = next;
    if ((e.faceN || 0) >= 3) e.face = next;
  }
  /* is the straight line between two bodies free of stone? */
  function clearLine(x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(d / 12));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      if (solidAt(S.lv, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
    }
    return true;
  }
  function lowestAlly(e) {
    return alliesOf(e).reduce((a, b) => (b.hp / b.max < a.hp / a.max ? b : a));
  }
  function shove(e, from, px) {
    if (!from) return;
    const a = Math.atan2(e.y - from.y, e.x - from.x);
    const nx = e.x + Math.cos(a) * px, ny = e.y + Math.sin(a) * px;
    if (!solidAt(S.lv, nx, e.y)) e.x = clamp(nx, TILE * 1.1, (MAP_W - 1.1) * TILE);
    if (!solidAt(S.lv, e.x, ny)) e.y = clamp(ny, TILE * 1.1, (MAP_H - 1.1) * TILE);
  }
  function pullTo(e, from, px) {
    if (!from) return;
    const a = Math.atan2(from.y - e.y, from.x - e.x);
    const nx = e.x + Math.cos(a) * px, ny = e.y + Math.sin(a) * px;
    if (!solidAt(S.lv, nx, e.y)) e.x = clamp(nx, TILE * 1.1, (MAP_W - 1.1) * TILE);
    if (!solidAt(S.lv, e.x, ny)) e.y = clamp(ny, TILE * 1.1, (MAP_H - 1.1) * TILE);
  }

  /* -------------------------------------------------------------- damage --- */
  function damage(src, tgt, amount, opts) {
    opts = opts || {};
    if (!tgt || tgt.dead) return 0;
    let dmg = amount;
    /* veil: a miss is a miss, and it reads as one */
    const veil = (tgt.veilT > 0 ? tgt.veilV : 0) + (tgt.b.mods.veil || 0);
    if (!opts.sure && Math.random() < veil) {
      S.texts.push({ x: tgt.x, y: tgt.y - 24, t: "miss", life: 0.7, col: "#cbd5e1" });
      colorLine("miss", tgt, src);
      return 0;
    }
    let crit = false;
    if (src && !opts.noCrit && Math.random() < src.b.crit) {
      crit = true;
      dmg *= src.b.critMul;
    }
    /* Named Pulse is stamped on the cast, so a fan and a blast all share the one double. */
    if (opts.opening) dmg *= 2;
    const exec = (src && src.b.mods.execute) || (opts.execute ? 0.7 : 0);
    if (exec && tgt.hp / tgt.max < 0.32) dmg *= 1 + exec;
    if (tgt.b.mods.bulwark && tgt.hp / tgt.max > 0.6) dmg *= 1 - tgt.b.mods.bulwark;
    /* Sudden death raises the blow, then armor still cuts it. Heals never come through
       here. A reflected share is already taken from a risen hit, so it is not risen again. */
    if (!opts.reflect) dmg *= suddenScale(S.time);
    /* Armor is a flat cut, including a living ally's aura. A hit the plate fully stops
       deals nothing — the old floor of 3 made the printed armor a lie. */
    if (!opts.ignoreArmor) {
      dmg -= buffed(tgt).armor * 1.1;
      /* EVERY blow that deals nothing has to say so. A stopped hit that printed no
         number is what a spectator reported as "the basic attack went straight through
         the target": the swing animated, the plate ate the whole thing, and the screen
         stayed silent. The plate is allowed to stop a weak hit. It is not allowed to
         do it invisibly. */
      if (dmg < 0.5) {
        S.texts.push({ x: tgt.x, y: tgt.y - 26, t: "block", life: 0.5, col: "#94a3b8" });
        colorLine("block", tgt, src);
        if (S.tele) S.tele.blocks++;
        return 0;
      }
    }
    if (opts.strips && tgt.shd > 0) { dmg *= 2; tgt.shd = 0; }
    if (tgt.shd > 0) {
      /* A ward is a pause, not a second life -- and it has to READ like one. It used to
         swallow blows whole: a 300 point plate on a tank ate six to fifteen basics and not
         one point landed, which is the unkillable wall that got reported. A ward now takes
         a SHARE of every blow and lets the rest through, so a fight against a warded body
         is a fight and not a wall. The pool is spent at the same rate per point, so the
         total protection is unchanged: only the number of blows it is spread across goes
         up, and every one of those blows leaves a mark the spectator can see. */
      const incoming = dmg;
      const absorbed = Math.min(tgt.shd, incoming * WARD_SHARE);
      tgt.shd -= absorbed;
      dmg -= absorbed;
      if (S.tele) { S.tele.warded += absorbed; if (dmg > 0) S.tele.chipped += dmg; }
      tgt.wardAbs = (tgt.wardAbs || 0) + absorbed;
      /* The word goes up when the ward took most of a blow. A label on every chip of the
         plate would be noise, and a label on none of them was the other complaint. */
      if (absorbed >= incoming * 0.45 && !opts.dot) {
        S.texts.push({ x: tgt.x, y: tgt.y - 26, t: "ward", life: 0.5, col: "#7dd3fc" });
        if (src) colorLine("block", tgt, src);
        if (S.tele) S.tele.wards++;
      }
      if (dmg < 0.5 && !opts.dot) return 0;
    }
    dmg = Math.round(dmg);
    if (dmg <= 0) return 0;
    if (src && opts.name) src.lastBlow = opts.name;
    tgt.hp -= dmg;
    tgt.taken += dmg;
    S.lastBloodAt = S.time;          // the arena knows how long it has been quiet
    /* about to die: one clean hit from the recap, and everybody says so */
    if (!tgt.dead && !tgt.edgeSaid && tgt.max > 0 && tgt.hp > 0 && tgt.hp / tgt.max < 0.25) {
      tgt.edgeSaid = true;
      if (src) pushCast("edge", { victim: tgt.b.name });
      if (src) pushTalk("taunt", src, tgt, true);
    }
    if (!opts.dot) {
      tgt.flash = 0.16;
      S.texts.push({ x: tgt.x, y: tgt.y - 26, t: dmg + (crit ? "!" : ""), life: crit ? 1.0 : 0.75, col: crit ? "#fbbf24" : "#f8fafc", big: crit });
      /* a crit that does not end the body still deserves a mouth, on a long leash */
      if (crit && src && tgt.hp > 0) colorLine("crit", src, tgt);
    }
    if (src) { src.dmgDone += dmg; src.idleT = 0; }
    /* lifesteal, leech and vampirism all feed the attacker */
    if (src) {
      let back = 0;
      if (src.lifestealT > 0) back += dmg * src.lifestealV;
      if (src.b.mods.leech) back += dmg * src.b.mods.leech;
      if (back > 0.5) heal(src, Math.round(back), src);
    }
    /* thorns answer melee, reflect answers everything aimed */
    if (src && !opts.dot && !opts.reflect) {
      let back = 0;
      if (opts.melee || opts.contact) back += dmg * (tgt.thornsT > 0 ? tgt.thornsV : 0) + dmg * (tgt.b.mods.thorns || 0);
      if (opts.ranged) back += dmg * (tgt.reflectT > 0 ? tgt.reflectV : 0);
      if (back > 1) damage(tgt, src, back, { noCrit: true, dot: true, reflect: true, ignoreArmor: true, sure: true });
    }
    if (tgt.hp <= 0) die(tgt, src);
    return dmg;
  }

  function die(e, src) {
    if (e.dead) return;
    e.hp = 0;
    /* the recall cards get their one moment */
    if (!e.usedRevive && e.b.cards.some((c) => c.hook === "secondLife")) {
      e.usedRevive = true;
      e.hp = Math.round(e.max * 0.28);
      e.dead = false;
      e.shd += Math.round(e.max * 0.08);
      pushEvent(e.b.name + " is called back — Name Recall, " + Math.round(e.max * 0.4) + " back.", "gift");
      e.edgeSaid = false;
      pushTalk("rise", e, src, true);
      pushCast("recall", { me: e.b.name });
      S.marks.push({ x: e.x, y: e.y, r: 0, life: 0.9, col: "#fbbf24" });
      return;
    }
    e.dead = true;
    e.dieT = 0;
    e.hp = 0;
    e.killedBy = src ? src.b.name : "";        // the death recap names the hand
    e.killedAt = S.time;
    if (src) {
      src.kills++;
      if (src.b.mods.vamp) heal(src, Math.round(src.max * src.b.mods.vamp), src);
      if (S.lv && S.lv.realm === "gold") heal(src, Math.round(src.max * 0.05), src);
      pushEvent(src.b.name + " cuts down " + e.b.name + ".", "kill");
      S.kills = (S.kills || 0) + 1;
      pushTalk("kill", src, e, true);
      pushTalk("die", e, src, true);
      pushCast(S.kills === 1 ? "firstBlood" : "kill",
        { killer: src.b.name, victim: e.b.name, t: mmss(S.time), n: src.kills, move: src.lastBlow || "the strike" });
      const matesLeft = (e.team === 0 ? S.your : S.foe).filter((o) => !o.dead).length;
      if (matesLeft === 1 && !S.aceSaid) {
        S.aceSaid = true;
        const last = (e.team === 0 ? S.your : S.foe).find((o) => !o.dead);
        pushCast("ace", { me: last.b.name });
        pushTalk("ace", last, src, true);
      }
    } else {
      pushEvent(e.b.name + " falls.", "kill");
    }
    if (S.lv && S.lv.realm === "void") S.zones.push({ x: e.x, y: e.y, r: 70, life: 3.5, slow: 0.32 });
    /* Hit-stop is read by frame(), never by step(), so the headless ladder stays at sim speed. */
    S.hitStop = 0.1;
    S.shake = Math.max(S.shake, 0.34);
    S.marks.push({ x: e.x, y: e.y, r: 0, life: 0.8, col: "#f87171" });
    S.marks.push({ x: e.x, y: e.y + 4, r: 12, life: 0.55, col: "#fbbf24", ring: true });
    S.marks.push({ x: e.x, y: e.y - 6, r: 0, life: 0.42, col: "#fff7ed", spark: true });
    S.texts.push({ x: e.x, y: e.y - 30, t: "DOWN", life: 1.2, col: "#f87171", big: true });
    checkOver();
    if (S.over) {
      S.hitStop = 0.42;
      S.shake = Math.max(S.shake, 0.72);
      S.texts.push({ x: e.x, y: e.y - 100, t: "FINISH", life: 1.7, col: "#fbbf24", big: true });
      S.marks.push({ x: e.x, y: e.y, r: 18, life: 0.95, col: "#fbbf24", ring: true });
    }
    /* Draw-only. The death cam reads this. It does not change the hit. */
    S.camSpot = { x: e.x, y: e.y - 8, hold: S.over ? 1.7 : 1.15 };
  }

  /* how long a body stays on a target before it may pick again */
  var TGT_HOLD = 0.9;

  function checkOver() {
    if (S.over) return;
    const a = live(0).length, b = live(1).length;
    if (a && b) return;
    S.over = true;
    S.phase = "over";
    S.winner = a ? 0 : (b ? 1 : -1);
    pushEvent(S.winner === 0 ? "YOUR TEAM TAKES THE ARENA." : S.winner === 1 ? "THE CHALLENGERS TAKE THE ARENA." : "Both sides are down — a draw.", "over");
    if (S.winner === -1) pushCast("draw", {});
    else {
      const win = S.winner === 0 ? S.your : S.foe, lose = S.winner === 0 ? S.foe : S.your;
      const alive = win.filter((e) => !e.dead), down = lose.filter((e) => e.dead);
      if (alive.length) pushTalk("win", alive[0], null, true);
      if (down.length) pushTalk("lose", down[0], null, true);
      pushCast("wipe", { team: S.winner === 0 ? "your team" : "the challengers" });
    }
  }

  /* ---------------------------------------------------------------- moves --- */
  function moveCost(mv) { return mv.cost != null ? mv.cost : Math.min(mv.cd * 1.1, 40); }

  /* Where a Close or a Slip actually lands. Null means the step would not change
     the fight — the rim, a wall, or a body already in its own reach — and the
     caller must refuse before it spends mana. */
  function strideSpot(caster, prefer) {
    const foes = enemiesOf(caster).filter((o) => o && !o.dead);
    if (!foes.length) return null;
    const melee = (caster.b.range || 40) <= 110;
    const edge = TILE * 1.2;
    const maxX = (MAP_W - 1.2) * TILE;
    const maxY = (MAP_H - 1.2) * TILE;
    const nearest = (list) => list.reduce((a, b) => (dist2(caster.x, caster.y, b.x, b.y) < dist2(caster.x, caster.y, a.x, a.y) ? b : a));
    if (melee) {
      const window = 7 * TILE + 16;
      let tgt = prefer && !prefer.dead && dist2(caster.x, caster.y, prefer.x, prefer.y) <= window ? prefer : null;
      if (!tgt) {
        const n = nearest(foes);
        if (dist2(caster.x, caster.y, n.x, n.y) <= window) tgt = n;
      }
      if (!tgt) return null;
      const a = Math.atan2(caster.y - tgt.y, caster.x - tgt.x);
      const x = clamp(tgt.x + Math.cos(a) * 42, edge, maxX);
      const y = clamp(tgt.y + Math.sin(a) * 42, edge, maxY);
      if (!caster.b.ghost && solidAt(S.lv, x, y)) return null;
      const before = dist2(caster.x, caster.y, tgt.x, tgt.y);
      if (before - dist2(x, y, tgt.x, tgt.y) < 48) return null;
      return { x: x, y: y };
    }
    const fists = foes.filter((o) => (o.b.range || 40) <= 110 && o.root <= 0 && o.stun <= 0);
    const pool = fists.length ? fists : foes.filter((o) => (o.b.range || 40) <= 110);
    const tgt = (pool.length ? pool : foes).length ? nearest(pool.length ? pool : foes) : null;
    if (!tgt) return null;
    const before = dist2(caster.x, caster.y, tgt.x, tgt.y) || 1;
    const dx = (caster.x - tgt.x) / before;
    const dy = (caster.y - tgt.y) / before;
    const full = 5.2 * TILE;
    for (let step = full; step >= 48; step -= 16) {
      const x = clamp(caster.x + dx * step, edge, maxX);
      const y = clamp(caster.y + dy * step, edge, maxY);
      if (!caster.b.ghost && solidAt(S.lv, x, y)) continue;
      if (dist2(x, y, tgt.x, tgt.y) - before < 48) continue;
      return { x: x, y: y };
    }
    return null;
  }

  /* A short blink that can still reach the spot a Slip would land on. The long
     step is not one of these — answering Slip with Close is a fair trade. */
  function blinkCanChase(foe, fromDist) {
    if (!foe || foe.dead || foe.stun > 0) return false;
    const landed = fromDist + 5.2 * TILE;
    const moves = foe.b.moves || [];
    for (let i = 0; i < moves.length; i++) {
      const mv = moves[i];
      if (mv.shape !== "blink") continue;
      if (foe.cds[i] > 0 || foe.mana < moveCost(mv)) continue;
      if (landed <= (mv.range || 8) * TILE + 30) return true;
    }
    return false;
  }
  function pickRaw(e, en, mode) {
    if (mode === "weakest") return en.reduce((a, b) => (b.hp / b.max < a.hp / a.max ? b : a));
    if (mode === "clump") {
      let best = null, bestScore = -1;
      en.forEach((c) => {
        let n = 0;
        en.forEach((o) => { if (dist2(o.x, o.y, c.x, c.y) < 120) n++; });
        const sc = n * 100 - dist2(e.x, e.y, c.x, c.y) * 0.2;
        if (sc > bestScore) { bestScore = sc; best = c; }
      });
      return best;
    }
    if (mode === "protect") {
      const hurt = alliesOf(e).reduce((a, b) => (b.hp / b.max < a.hp / a.max ? b : a));
      if (hurt && hurt !== e) return en.reduce((a, b) => (dist2(b.x, b.y, hurt.x, hurt.y) < dist2(a.x, a.y, hurt.x, hurt.y) ? b : a));
    }
    if (mode === "deadally") return null;
    /* default: nearest, with a bias onto anything already hurt (bodies finish fights) */
    return en.reduce((a, b) => {
      const sa = dist2(e.x, e.y, a.x, a.y) - (1 - a.hp / a.max) * 60;
      const sb = dist2(e.x, e.y, b.x, b.y) - (1 - b.hp / b.max) * 60;
      return sb < sa ? b : a;
    });
  }

  /* Choosing is not the same as choosing again. The raw pick is scored fresh every time it is
     asked for, and two enemies a hair apart swap places several times a second -- a body that
     turns on the spot instead of walking, which is what "they do not know what to do" looks
     like. The body keeps the enemy it already picked unless the new one is a clear improvement:
     a quarter closer, or sixty pixels nearer. Scored inside the choice, so a style that ASKS
     for a particular kind of body (the knife's weakest, the gun's clump) still gets it. */
  function pickTarget(e, mode) {
    const en = enemiesOf(e);
    if (!en.length) return null;
    const best = pickRaw(e, en, mode);
    const held = e.target;
    if (best && held && !held.dead && held !== best && en.indexOf(held) >= 0) {
      const dHeld = dist2(e.x, e.y, held.x, held.y), dBest = dist2(e.x, e.y, best.x, best.y);
      if (!(dBest < dHeld * 0.75 || dBest < dHeld - 60)) return held;
    }
    return best;
  }

  function castMove(e, mv, idx) {
    const cost = moveCost(mv);
    /* A revive with nobody down, or a summon with no token, must not eat the mana. */
    if (mv.shape === "revive" && !(e.team === 0 ? S.your : S.foe).some((x) => x.dead)) return false;
    if (mv.shape === "summon" && !R.TOKENS[mv.token]) return false;
    let land = null;
    if (mv.shape === "stride") {
      land = strideSpot(e, e.target);
      if (!land) return false;
    }
    if (e.mana < cost || e.silence > 0 || e.stun > 0) return false;
    e.mana -= cost;
    /* The shared step stays on its own clock. cdMul would turn thirty seconds into
       a second engage for the kits that already blink. */
    e.cds[idx] = mv.shape === "stride" ? mv.cd : mv.cd * e.b.cdMul;
    e.uses[mv.name] = (e.uses[mv.name] || 0) + 1;
    const caster = e;
    const tgt = (mv.aim === "enemy" || mv.aim === "weakest" || mv.aim === "clump") ? pickTarget(e, mv.aim) :
      (mv.aim === "deadally" ? (e.team === 0 ? S.your : S.foe).find((x) => x.dead) : null);
    const anchorAlly = mv.aim === "allylow" ? lowestAlly(caster) : null;

    function reachPoint() {
      if (tgt) return { x: tgt.x, y: tgt.y };
      if (anchorAlly) return { x: anchorAlly.x, y: anchorAlly.y };
      if (mv.atRange) {
        const en = enemiesOf(caster);
        if (en.length) {
          const cx = en.reduce((s, o) => s + o.x, 0) / en.length, cy = en.reduce((s, o) => s + o.y, 0) / en.length;
          return { x: cx, y: cy };
        }
      }
      return { x: caster.x, y: caster.y };
    }
    const P = reachPoint();
    faceTo(caster, P.x, P.y);
    flourish(caster, mv.vis || "slash", P.x, P.y);
    if (mv.fx) S.marks.push({ x: caster.x, y: caster.y - 10, r: 0, life: 0.22, col: caster.b.color, spark: true });
    /* The first damaging move, not the first basic. Spent on the cast so every
       pellet of that move shares it, and a whiff still spends it. */
    let opening = false;
    if (mv.dmg && caster.b.mods.firstDouble && !caster.firstUsed) {
      opening = true;
      caster.firstUsed = true;
    }

    switch (mv.shape) {
      case "melee":
      case "arc": {
        const radius = mv.range * TILE;
        const hits = enemiesOf(caster).filter((o) => {
          const d = dist2(caster.x, caster.y, o.x, o.y);
          if (d > radius) return false;
          if (mv.shape === "melee") return true;
          const a = Math.atan2(o.y - caster.y, o.x - caster.x);
          let diff = Math.abs(((a - caster.aimA + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          return diff < 1.15;
        });
        hits.forEach((o) => {
          const dealt = damage(caster, o, caster.b.dmg * mv.dmg, { melee: true, opening: opening, ignoreArmor: !!mv.ignoreArmor, execute: !!mv.execute, name: mv.name });
          if (mv.drain && dealt > 0) heal(caster, Math.round(dealt * mv.drain), caster);
          applySt(o, mv.st, caster);
        });
        if (!hits.length) applySt(anchorAlly || caster, mv.selfSt, caster);
        if (mv.selfSt && hits.length) applySt(caster, mv.selfSt, caster);
        break;
      }
      case "aura": {
        const radius = (mv.radius || 3) * TILE;
        const cx = mv.atRange ? P.x : caster.x, cy = mv.atRange ? P.y : caster.y;
        S.marks.push({ x: cx, y: cy, r: radius, life: 0.4, col: caster.b.color, ring: true });
        enemiesOf(caster).forEach((o) => {
          if (dist2(cx, cy, o.x, o.y) > radius) return;
          if (mv.dmg) damage(caster, o, caster.b.dmg * mv.dmg, { melee: true, opening: opening, ignoreArmor: !!mv.ignoreArmor, name: mv.name });
          applySt(o, mv.st, caster);
        });
        if (mv.selfSt) applySt(caster, mv.selfSt, caster);
        if (mv.st && mv.st.aegis) applySt(caster, mv.st, caster);
        break;
      }
      case "blast": {
        S.pending.push({ t: 0.32, x: P.x, y: P.y, r: (mv.radius || 2) * TILE, dmg: caster.b.dmg * mv.dmg, src: caster, st: mv.st, col: caster.b.color, strips: !!mv.strips, opening: opening, name: mv.name });
        if (mv.selfSt) applySt(caster, mv.selfSt, caster);
        break;
      }
      case "beam": {
        const a = Math.atan2(P.y - caster.y, P.x - caster.x);
        const len = mv.range * TILE;
        S.marks.push({ x: caster.x, y: caster.y, x2: caster.x + Math.cos(a) * len, y2: caster.y + Math.sin(a) * len, life: 0.3, col: caster.b.color, beam: true });
        enemiesOf(caster).forEach((o) => {
          const dx = o.x - caster.x, dy = o.y - caster.y;
          const along = dx * Math.cos(a) + dy * Math.sin(a);
          if (along < 0 || along > len) return;
          const side = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
          if (side > 14) return;
          damage(caster, o, caster.b.dmg * mv.dmg, { ignoreArmor: !!mv.ignoreArmor || !!mv.pierce, ranged: true, opening: opening, name: mv.name });
          applySt(o, mv.st, caster);
        });
        break;
      }
      case "bolt":
      case "multi": {
        const baseN = mv.n || 1;
        const extra = mv.n ? (caster.b.mods.volleyAdd || 0) : 0;
        const n = baseN + extra;
        const lead = (tgt && !mv.lob) ? shotAt(caster, tgt, 430) : P;
        const a0 = Math.atan2(lead.y - caster.y, lead.x - caster.x);
        for (let i = 0; i < n; i++) {
          /* the aimed bearing stays in the fan. An extra volley shot is added
             beside it — stretching the fan to an even count was leaving the
             called body standing in the gap between two arrows. */
          let spread = baseN > 1 ? (i - (baseN - 1) / 2) * 0.24 : 0;
          if (i >= baseN) {
            const k = i - baseN;
            const side = k % 2 ? 1 : -1;
            const tier = 1 + (k / 2 | 0);
            spread = side * 0.24 * ((baseN - 1) / 2 + tier);
          }
          const a = a0 + spread;
          /* a lobbed fan lands on its own ray, at the same depth as the called target.
             One shared point makes the side shells orbit that point and never burst. */
          const depth = Math.hypot(P.x - caster.x, P.y - caster.y) || TILE;
          const tx = mv.lob ? caster.x + Math.cos(a) * depth : P.x;
          const ty = mv.lob ? caster.y + Math.sin(a) * depth : P.y;
          S.projectiles.push({
            x: caster.x, y: caster.y - 8, a: a, spd: mv.lob ? 220 : 430,
            dmg: caster.b.dmg * mv.dmg, src: caster, team: caster.team, w: mv.w || caster.b.atk.w,
            vis: mv.vis || caster.b.atk.vis, col: caster.b.color,
            life: 2.6, pierce: (mv.pierce || 0), lob: !!mv.lob,
            radius: (mv.radius || 1.4) * TILE,
            tx: tx, ty: ty, st: mv.st, frame: 0, ignoreWall: !!mv.lob || !!caster.b.ghost,
            opening: opening, name: mv.name
          });
        }
        break;
      }
      case "lob": {
        S.projectiles.push({
          x: caster.x, y: caster.y - 8, a: Math.atan2(P.y - caster.y, P.x - caster.x), spd: 200,
          dmg: caster.b.dmg * mv.dmg, src: caster, team: caster.team, w: mv.w || "comet",
          life: 3, pierce: 0, radius: (mv.radius || 2) * TILE, lob: true, tx: P.x, ty: P.y, st: mv.st, ignoreWall: true, frame: 0, opening: opening, name: mv.name,
          vis: mv.vis || "stone", col: caster.b.color
        });
        break;
      }
      case "self": applySt(caster, mv.st, caster); break;
      case "ally": if (anchorAlly) { applySt(anchorAlly, mv.st, caster); S.marks.push({ x: anchorAlly.x, y: anchorAlly.y, r: 18, life: 0.5, col: "#7dd3fc", ring: true }); } break;
      case "allies": {
        const radius = (mv.aim === "allies" ? (mv.range || 7) : 6) * TILE;
        alliesOf(caster).forEach((o) => { if (dist2(caster.x, caster.y, o.x, o.y) <= radius) applySt(o, mv.st, caster); });
        S.marks.push({ x: caster.x, y: caster.y, r: radius, life: 0.45, col: "#7dd3fc", ring: true });
        break;
      }
      case "blink": {
        const t2 = tgt || pickTarget(caster, "weakest");
        if (t2) {
          const a = Math.atan2(caster.y - t2.y, caster.x - t2.x);
          const land = { x: t2.x + Math.cos(a) * 26, y: t2.y + Math.sin(a) * 26 };
          if (caster.b.ghost || !solidAt(S.lv, land.x, land.y)) { caster.x = land.x; caster.y = land.y; }
          S.marks.push({ x: caster.x, y: caster.y, r: 14, life: 0.4, col: caster.b.color, ring: true });
          if (mv.dmg) {
            const dealt = damage(caster, t2, caster.b.dmg * mv.dmg, { melee: true, opening: opening, execute: !!mv.execute, name: mv.name });
            if (mv.drain && dealt > 0) heal(caster, Math.round(dealt * mv.drain), caster);
          }
          if (mv.st) applySt(t2, mv.st, caster);       // what the landing does to them
        }
        if (mv.selfSt) applySt(caster, mv.selfSt, caster);   // and what it does for us
        break;
      }
      case "stride": {
        caster.x = land.x;
        caster.y = land.y;
        S.marks.push({ x: caster.x, y: caster.y, r: 16, life: 0.35, col: caster.b.color, ring: true });
        break;
      }
      case "revive": {
        const dead = (caster.team === 0 ? S.your : S.foe).find((x) => x.dead);
        if (!dead) return false;
        dead.dead = false;
        dead.hp = Math.round(dead.max * (mv.heal || 0.4));
        dead.shd += Math.round(dead.max * 0.1);
        dead.stun = 0; dead.root = 0; dead.cds = dead.cds.map(() => 1.5);
        pushEvent(caster.b.name + " remembers " + dead.b.name + " — Provenance, back at " + dead.hp + ".", "gift");
        S.marks.push({ x: dead.x, y: dead.y, r: 24, life: 0.9, col: "#fbbf24", ring: true });
        checkOver();
        break;
      }
      case "summon": {
        const tk = R.TOKENS[mv.token];
        const n = mv.n || 1;
        const side = caster.team === 0 ? S.your : S.foe;
        /* Each warden is its own body. One shared template made both doors the same
           person: one id, one sheet, and a hit or a line about either of them. */
        for (let i = 0; i < n; i++) {
          const tpl = { id: mv.token + "_" + (++caster.tokens), name: tk.name, tag: "Summoned", cls: "token", spr: tk.spr,
            hp: tk.hp, dmg: tk.dmg, rate: tk.rate, speed: tk.speed, armor: tk.armor, range: tk.range, mana: 30, manaRegen: 4, crit: 0.1, cdMul: 1,
            atk: { name: "Warden Bolt", type: "bolt", w: tk.w }, moves: [], cards: [], bio: "", counter: "", ttl: tk.ttl };
          R.byId[tpl.id] = tpl;
          const built = R.build(tpl, [], null, Math.random);
          built.power = 0;
          const tx = Math.round(caster.x / TILE + (i ? 0.9 : -0.9));
          const ty = Math.round(caster.y / TILE + 0.4);
          const spot = openTile(tx, ty);
          side.push(mkEntity(built, caster.team, spot.x, spot.y, true));
        }
        pushEvent(caster.b.name + " calls " + n + " " + tk.name.toLowerCase() + " into the arena.", "summon");
        break;
      }
      default: return false;
    }
    if (mv.name) {
      pushEvent(caster.b.name + " — " + mv.name + (tgt && (mv.aim === "enemy" || mv.aim === "weakest") ? " on " + tgt.b.name : "") + ".", "move", mv.sfx || "");
    }
    return true;
  }

  /* ------------------------------------------------------------------ AI ---
     The brain (brain.js) decides; this is the body's hands and feet — pick the
     move, walk the ground the task asks for, and deal with stone. Every tactical
     judgement lives in brain.js so a spectator can read one file and know what a
     kit wants; everything here is execution. */
  const OPEN = { x: 0, y: 0 };
  /* the nearest open cell to a cell — a destination inside stone is no destination */
  function openTile(tx, ty) {
    if (!solid(S.lv, tx, ty)) { OPEN.x = tx; OPEN.y = ty; return OPEN; }
    for (let r = 1; r <= 4; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = clamp(tx + dx, 1, MAP_W - 2), ny = clamp(ty + dy, 1, MAP_H - 2);
        if (!solid(S.lv, nx, ny)) { OPEN.x = nx; OPEN.y = ny; return OPEN; }
      }
    }
    OPEN.x = clamp(tx, 1, MAP_W - 2); OPEN.y = clamp(ty, 1, MAP_H - 2);
    return OPEN;
  }
  /* the count of a body's own corners that are inside stone: the measure a move is
     judged by. A body that is already in the wall may always push its way out. */
  function overlapAt(x, y) {
    const rad = 11;
    let n = 0;
    if (solidAt(S.lv, x - rad, y - rad)) n++;
    if (solidAt(S.lv, x + rad, y - rad)) n++;
    if (solidAt(S.lv, x - rad, y + rad)) n++;
    if (solidAt(S.lv, x + rad, y + rad)) n++;
    return n;
  }

  /* Shoulder room. Two sprites are 46px. Centres closer than 40 draw as one body. */
  function bodyGap(e, speed) {
    let sx = 0, sy = 0;
    const selfTok = !!(e.b && e.b.cls === "token");
    all().forEach((o) => {
      if (o === e || o.dead) return;
      /* A ward standing on its summoner must not shove the fighter off a swing. */
      if (!selfTok && o.b && o.b.cls === "token") return;
      const dd = dist2(e.x, e.y, o.x, o.y);
      if (dd < 40 && dd > 0.01) {
        const push = (40 - dd) / 40;
        sx += ((e.x - o.x) / dd) * push;
        sy += ((e.y - o.y) / dd) * push;
      }
    });
    const n = Math.hypot(sx, sy);
    if (n < 1e-6) return { x: 0, y: 0 };
    const vel = Math.min(78 * n, speed * 1.05);
    return { x: (sx / n) * vel, y: (sy / n) * vel };
  }

  /* Two fists walking at the same body beat the soft shoulder nudge and draw as
     one sprite. This runs after the plans, and it only opens the overlap. It is
     not a wall, so it must not feed the bail. */
  function nudgeBody(e, dx, dy) {
    if (e.b && e.b.ghost) {
      e.x = clamp(e.x + dx, TILE * 1.15, (MAP_W - 1.15) * TILE);
      e.y = clamp(e.y + dy, TILE * 1.15, (MAP_H - 1.15) * TILE);
      return;
    }
    const before = overlapAt(e.x, e.y);
    const nx = e.x + dx;
    if (overlapAt(nx, e.y) <= before) e.x = nx;
    const ny = e.y + dy;
    if (overlapAt(e.x, ny) <= before) e.y = ny;
  }
  function shoulders() {
    const bodies = all().filter((e) => !e.dead);
    const want = 40;
    const tokPush = new Map();
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        const aTok = !!(a.b && a.b.cls === "token");
        const bTok = !!(b.b && b.b.cls === "token");
        const dx = b.x - a.x, dy = b.y - a.y;
        const dd = Math.hypot(dx, dy);
        if (dd >= want) continue;
        let ux = 1, uy = 0, gap = want;
        if (dd >= 0.01) { ux = dx / dd; uy = dy / dd; gap = want - dd; }
        else if ((a.uid || 0) % 2) ux = -1;
        if (aTok !== bTok) {
          /* The ward yields the whole gap. Two fighters still split it, or a
             pile of bodies never opens. A ward pinched on the line steps sideways. */
          const tok = aTok ? a : b;
          const acc = tokPush.get(tok) || { x: 0, y: 0, n: 0 };
          acc.x += (aTok ? -ux : ux) * gap;
          acc.y += (aTok ? -uy : uy) * gap;
          acc.n++;
          tokPush.set(tok, acc);
        } else {
          const push = gap * 0.5;
          nudgeBody(a, -ux * push, -uy * push);
          nudgeBody(b, ux * push, uy * push);
        }
      }
    }
    tokPush.forEach((acc, tok) => {
      let x = acc.x, y = acc.y;
      const mag = Math.hypot(x, y);
      if (acc.n >= 2 && mag < want * 0.35) {
        const side = ((tok.uid || 1) % 2) ? 1 : -1;
        if (mag > 0.01) {
          x = (-y / mag) * side * (want * 0.5);
          y = (acc.x / mag) * side * (want * 0.5);
        } else {
          x = 0;
          y = side * (want * 0.5);
        }
      }
      const cap = 22;
      const m2 = Math.hypot(x, y);
      if (m2 > cap) { x *= cap / m2; y *= cap / m2; }
      nudgeBody(tok, x, y);
    });
  }

  function think(e, dt) {
    const b = e.b;
    const st = buffed(e);
    if (e.stun > 0 || e.dead) return;
    /* lazily stamped so a body that never moved still has honest counters */
    if (e.blockedT == null) {
      e.blockedT = 0; e.blockedWorst = 0; e.bailT = 0; e.slideT = 0; e.slideDir = 1;
      e.strafeDir = Math.random() < 0.5 ? -1 : 1; e.stuckS = 0; e.stuckWorst = 0;
      e.mvT = 0; e.mvX = e.x; e.mvY = e.y; e.goalNow = false; e.pathOn = false; e.pathT = 0;
      e.idleT = 0; e.braveT = 0; e.recoilT = 0;
    }
    /* WHERE IT WAS AND HOW FAST IT IS GOING. A body that only knows where the enemy
       STANDS can never cut it off, and the approach maths needs the enemy's own speed.
       Measured from its own last two positions rather than reported by the movers, so
       walking, strafing, knock-backs and dashes are all in it and no movement path has
       to remember to say so. */
    if (e.lx != null) {
      const dti = Math.max(dt, 0.001);
      e.vx = (e.x - e.lx) / dti; e.vy = (e.y - e.ly) / dti;
    }
    e.lx = e.x; e.ly = e.y;
    e.idleT += dt;
    e.braveT = Math.max(0, e.braveT - dt);
    e.recoilT = Math.max(0, e.recoilT - dt);

    const B = w.LYGO_BRAIN;
    const stl = B ? B.styleOf(b) : { band: 0.9, commit: 1.4, prefer: "nearest", retreat: 0.25 };
    const plan = B ? B.plan(S, e, dt) : { task: "press", band: b.range, gait: 1, point: null, target: null };
    if (B) B.age(e, dt);
    e.plan = plan;

    let t = plan.target;
    const called = !!(t && !t.dead);          /* the brain named this one: it is not a guess */
    if (!t || t.dead) t = pickTarget(e, !stl.prefer || stl.prefer === "attack" ? "nearest" : stl.prefer);
    if (!t) return;
    /* Shield Wall outranks the plan. While somebody is holding the door, that is the target. */
    const taunters = enemiesOf(e).filter((o) => o.tauntT > 0 || o.shieldWallT > 0);
    if (taunters.length) {
      t = taunters.reduce((p, o) => (dist2(e.x, e.y, o.x, o.y) < dist2(e.x, e.y, p.x, p.y) ? o : p));
    } else if (e.target && !e.target.dead && e.target !== t && (e.tgtHold || 0) > 0) {
      /* the brain is rebuilt every 0.18s. A target that changes that often is a body
         turning on the spot. A dead target releases the hold at once.
         A ward is not that commit. Holding the summon walks the fighter off the
         body the plan just named. A real body already in reach is not dropped for a ward. */
      const heldTok = !!(e.target.b && e.target.b.cls === "token");
      const nextTok = !!(t.b && t.b.cls === "token");
      const releaseWard = heldTok && !nextTok;
      const leaveFar = !heldTok && nextTok && dist2(e.x, e.y, e.target.x, e.target.y) >= 140;
      if (!releaseWard && !leaveFar) t = e.target;
    } else if (e.target && e.target !== t) e.tgtHold = Math.max(0.45, Math.min(3.4, stl.commit || TGT_HOLD));
    e.target = t;

    /* ---- the kit: whatever is in reach and off cooldown, in the kit's own order.
       A body that cannot reach the called target still helps: the moves that land
       on its own side are thrown for whoever needs them. */
    /* ---- the mender. A wound cut in half is worth more than a hit that gets healed back,
       so a kit that carries one spends it on whoever is doing the mending — not on the
       body standing closest. Only when the mender is not already carrying one. */
    const widx = b.moves.findIndex((mv) => mv.st && mv.st.wound);
    if (widx >= 0 && e.cds[widx] <= 0 && e.mana >= moveCost(b.moves[widx])) {
      const wmv = b.moves[widx];
      const menders = enemiesOf(e).filter((o) => !o.dead && o.woundT <= 0 && isMender(o.b));
      if (menders.length) {
        const near = menders.reduce((p, o) => (dist2(e.x, e.y, o.x, o.y) < dist2(e.x, e.y, p.x, p.y) ? o : p));
        const wide = wmv.shape === "self" || wmv.shape === "aura" || wmv.shape === "allies";
        const reach = Math.max((wmv.range || 0) * TILE, wide ? (wmv.radius || 5.5) * TILE : 0);
        if (dist2(e.x, e.y, near.x, near.y) <= reach + 34 && castMove(e, wmv, widx)) {
          if (stl.recoil) e.recoilT = 0.55;
          return;
        }
      }
    }

    /* ---- own blood. A heal aimed at yourself is drunk when you are the one bleeding,
       even if the enemy is already out of reach. Waiting until they walk back into
       range is how a mender dies with a full bottle. */
    if (e.hp / e.max < Math.max(0.42, (stl.retreat || 0.25) + 0.12)) {
      const si = b.moves.findIndex((mv) => mv.st && mv.st.heal && (mv.aim === "self" || mv.shape === "self"));
      if (si >= 0 && e.cds[si] <= 0 && e.mana >= moveCost(b.moves[si]) && castMove(e, b.moves[si], si)) return;
    }

    /* ---- the rusher. This is the one move in a kit that has to be spent at the right
       moment to be worth anything. If something with a hand weapon is on top of this body
       and the kit carries something that stops a charge — a root, a stun, a shove, a
       chill, a hush — it is spent now, not saved. Charging three bodies at one gun only
       works if the gun has no answer for the first body that arrives. */
    const rushers = enemiesOf(e).filter((o) => dist2(e.x, e.y, o.x, o.y) < 132 && (o.b.range || 40) <= 110);
    const heldAlready = rushers.some((o) => o.root > 0 || o.stun > 0 || o.slowT > 0);
    if (rushers.length && !heldAlready) {
      const near = rushers.reduce((p, o) => (dist2(e.x, e.y, o.x, o.y) < dist2(e.x, e.y, p.x, p.y) ? o : p));
      const stop = (mv) => {
        const s = mv.st || {}, t2 = mv.tgtSt || {};
        return (s.root ? 5 : 0) + (s.stun ? 4.4 : 0) + (s.knock ? 3.4 : 0) + (s.slow ? 3 : 0) +
          (s.silence ? 2.2 : 0) + (t2.stun ? 4.4 : 0) + (t2.root ? 5 : 0) + (t2.slow ? 2.6 : 0);
      };
      let bi = -1, bs = 0;
      for (let i = 0; i < b.moves.length; i++) {
        const mv = b.moves[i];
        if (e.cds[i] > 0 || e.mana < moveCost(mv)) continue;
        const cc = stop(mv);
        if (!cc) continue;
        const wide = mv.shape === "self" || mv.shape === "aura" || mv.shape === "allies";
        const reach = Math.max((mv.range || 0) * TILE, wide ? (mv.radius || 5.5) * TILE : 0);
        if (dist2(e.x, e.y, near.x, near.y) > reach + 34) continue;
        if (cc > bs) { bs = cc; bi = i; }
      }
      if (bi >= 0 && castMove(e, b.moves[bi], bi)) { if (stl.recoil) e.recoilT = 0.55; return; }
    }

    /* The long step. A shorter blink or a root is spent first, above. Close is the
       backup when that blink is down and the gun is still outside the swing. Slip
       is the backup when a fist is on this body, the root did not land, and that
       fist cannot chase the landing with its own short blink. */
    {
      const si = b.moves.findIndex((mv) => mv.shape === "stride");
      if (si >= 0 && e.cds[si] <= 0 && e.mana >= moveCost(b.moves[si])) {
        const gun = (b.range || 40) > 110;
        const blinkReady = b.moves.some((mv, i) => i !== si && mv.shape === "blink" && e.cds[i] <= 0 && e.mana >= moveCost(mv));
        if (!blinkReady) {
          if (!gun) {
            const dNow = dist2(e.x, e.y, t.x, t.y);
            /* The step only has to land the body INSIDE its own swing, not on the
               target's head. A stride is 224px and a fist reaches 48, so the band a
               fist can commit from is 272px -- the hardcoded 16 measured the wrong
               thing by exactly the margin that decides the fight. A rifle holds its
               band at range * 0.9, and the longest guns hold at 247px: twenty-odd
               pixels OUTSIDE the window this check allowed. The one move every kit
               owns for crossing open ground could never be spent on the one enemy it
               was written for, and the brute -- no blink, so this is its only way in --
               ran three fights of two hundred seconds without ever landing a hit. */
            const reach = (b.moves[si].range || 7) * TILE + (b.range || 40);
            /* A fist already in the fight walks the last step. Close is for a gun
               that is still outside the swing, not for undoing your own shove. */
            const chasingGun = (t.b.range || 40) > 110;
            if (chasingGun && dNow > (b.range || 40) + 48 && dNow <= reach && castMove(e, b.moves[si], si)) {
              if (stl.recoil) e.recoilT = 0.55;
              return;
            }
          } else {
            const fists = enemiesOf(e).filter((o) => !o.dead && (o.b.range || 40) <= 110 && o.root <= 0 && o.stun <= 0 && dist2(e.x, e.y, o.x, o.y) < 150);
            const chased = fists.some((o) => blinkCanChase(o, dist2(e.x, e.y, o.x, o.y)));
            if (fists.length && !chased && castMove(e, b.moves[si], si)) {
              if (stl.recoil) e.recoilT = 0.55;
              return;
            }
          }
        }
      }
    }

    for (let i = 0; i < b.moves.length; i++) {
      const mv = b.moves[i];
      if (mv.shape === "stride") continue;
      if (e.cds[i] > 0 || e.mana < moveCost(mv)) continue;
      const d = dist2(e.x, e.y, t.x, t.y);
      const reach = (mv.range || 0) * TILE;
      const ring = (mv.radius || 3) * TILE;
      let ready = true;
      if (mv.aim === "allylow") { const low = lowestAlly(e); ready = low && low.hp / low.max < (mv.selfSt ? 0.72 : 0.8); }
      else if (mv.aim === "allies" || mv.shape === "allies") ready = e.hp / e.max < 0.92 || d < Math.max(reach, 5 * TILE);
      else if (mv.aim === "deadally") ready = (e.team === 0 ? S.your : S.foe).some((o) => o.dead);
      else if (mv.aim === "self" || mv.shape === "aura") ready = d < Math.max(reach, ring);
      else ready = d <= reach + 30;
      if (ready) { if (castMove(e, mv, i)) { if (stl.recoil) e.recoilT = 0.55; return; } }
    }

    /* ---- the ground. A plan either names a point or asks the body to hold where
       it stands; both are executed with the same walker. */
    const d = dist2(e.x, e.y, t.x, t.y);
    const band = Math.max(plan.band || (b.range > 100 ? b.range * 0.9 : 42), b.range <= 100 ? 40 : 58);
    /* the distance this body is actually trying to stand at, kept for the census: the
       check tool compares a style's doctrine against the band the engine aimed at, and
       a second opinion computed elsewhere would be measuring a different number. */
    e.bandNow = band;
    let gx2 = plan.point ? plan.point.x : t.x;
    let gy2 = plan.point ? plan.point.y : t.y;
    /* INTERCEPT, DO NOT CHASE. Walking at where the enemy stands means every step is a
       step behind it: a contact kit crossing eight tiles against a gun that can walk
       backwards never arrives at all, and the duel report showed exactly that -- a
       losing record made of seconds spent "closing on" somebody who is leaving. Aim
       where the target WILL BE, its own speed carried forward by the time this body
       needs to reach it. Two rules keep it honest: a body already inside its swing never
       leads (or a knife fight turns into two bodies orbiting), and the lead is capped at
       four tenths of a second of travel so a fast body cannot fling its aim past a
       slow one. */
    if (!plan.point && (t.vx || t.vy) && d > (st.range || 40) + 10) {
      const spd = Math.max(20, st.speed || 90);
      const lead = Math.min(0.4, d / spd);
      let ox = (t.vx || 0) * lead, oy = (t.vy || 0) * lead;
      /* A blink, a dash or a knock-back is one huge frame of "velocity". Walking at where
         a body that just teleported appears to be heading sends the chaser off the map, so
         the aim point can be moved along the target's line, never flung down it. */
      const om = Math.hypot(ox, oy), cap = Math.max(40, (st.range || 40) * 1.6);
      if (om > cap) { ox *= cap / om; oy *= cap / om; }
      gx2 += ox; gy2 += oy;
    }
    /* hit-and-run: a body that just threw something steps back off its line */
    if (stl.recoil && e.recoilT > 0.35) {
      gx2 = e.x + (e.x - t.x) * 0.8; gy2 = e.y + (e.y - t.y) * 0.8; e.recoilT = 0;
    }
    /* Which of the two things is this body doing: going somewhere, or standing on
       the ground it has already won? A plan that names a point is always walked to.
       A plan that does not (press, hold) means "get to your band" — INSIDE the band
       that is a hold, outside it is a walk. Getting this wrong is not cosmetic: read
       every press as a hold and no team in the arena ever closes, every fight runs to
       the clock and the floor decides it. */
    const holdClass = plan.task === "hold" || plan.task === "overwatch" || plan.task === "screen";
    const inBand = d <= band + 18;
    /* A fist "in band" can still be a step short of its swing. Stopping there and
       weaving reads as a body that cannot decide to hit. It keeps walking until the
       blow will land, then it holds. */
    /* A body told to hold, jammed against stone or the border while it holds, cannot strafe its
       way out: it swaps its shoulder from one side to the other for the rest of the match. That
       is the "standing on an edge with no idea what to do" report. Being pinned outranks the
       order -- walk clear, then hold again. */
    if (e.blockedT > 1.2) e.bailT = 0.7;
    const fistHere = (b.range || 40) <= 110;
    const inSwing = d <= (st.range || 40) + 10;
    const standing = e.bailT > 0 ? false : (plan.point ? false : (holdClass ? !fistHere || inSwing : (fistHere ? inSwing : inBand)));
    if (standing) {
      /* in position: face the enemy, drift across its front. A body blocked on that
         drift turns around instead of grinding its shoulder into a wall. */
      if (e.blockedT > 0.25) { e.strafeDir = -e.strafeDir; }
      /* A held strafe in one direction is a circle. Reverse it, and keep a
         gun's weave small enough that a shot can still meet the body. */
      e.weaveT = (e.weaveT || 0) + dt;
      if (e.weaveT > 0.62) { e.weaveT = 0; e.strafeDir = -e.strafeDir; }
      let sAmt = stl.strafe == null ? 0.5 : stl.strafe;
      const foeMelee = (t.b.range || 40) <= 110;
      const fist = (b.range || 40) <= 110;
      if ((b.range || 40) > 130) sAmt = Math.min(sAmt, foeMelee ? 0.22 : 0.36);
      else if (fist && d <= (st.range || 40) + 14) sAmt = Math.min(sAmt, 0.08);
      else if (d < 78) sAmt = Math.min(sAmt, 0.22);
      const sa = Math.atan2(t.y - e.y, t.x - e.x) + Math.PI / 2;
      /* holding on the rim drifts inward. Swapping shoulders along the border
         is how a body spends the match grinding a wall. */
      const ringW = S.lv.W * TILE, ringH = S.lv.H * TILE;
      const rim = Math.max(TILE * 2.25, Math.min(ringW, ringH) * 0.09);
      if (e.x < rim || e.y < rim || e.x > ringW - rim || e.y > ringH - rim) {
        const ix = e.x < ringW * 0.5 ? 1 : -1, iy = e.y < ringH * 0.5 ? 1 : -1;
        if (Math.cos(sa) * e.strafeDir * ix + Math.sin(sa) * e.strafeDir * iy < 0) e.strafeDir = -e.strafeDir;
      }
      let mvx2 = Math.cos(sa) * st.speed * sAmt * 0.7 * dt * e.strafeDir;
      let mvy2 = Math.sin(sa) * st.speed * sAmt * 0.7 * dt * e.strafeDir;
      const gap2 = bodyGap(e, st.speed);
      mvx2 += gap2.x * dt;
      mvy2 += gap2.y * dt;
      const want2 = Math.hypot(mvx2, mvy2);
      const got2 = moveEntity(e, mvx2, mvy2);
      /* the strafe has to measure itself the way the walk does, or a body pinned while holding
         never registers as pinned and so never earns its bail */
      if (want2 > 0.06 && got2 < want2 * 0.45) {
        e.blockedT += dt;
        if (e.blockedT > e.blockedWorst) e.blockedWorst = e.blockedT;
      } else e.blockedT = Math.max(0, e.blockedT - dt * 2);
      faceTo(e, t.x, t.y);
      e.aimA = Math.atan2(t.y - e.y, t.x - e.x);
      stampStuck(e, dt, false);
      return;
    }

    /* ---- pathing. In the open, walk the straight line; follow stone around
       corners. The choice is HELD for half a second: an enemy stepping in and out
       of cover flips a line-of-sight test every few ticks, and a heading that
       alternates between the direct line and the way round the rock walks on the
       spot for the rest of the match. */
    const cx = Math.floor(e.x / TILE), cy = Math.floor(e.y / TILE);
    /* A body whose own cell is stone is not walking anywhere sensible, whatever its plan
       says. It walks to the middle of the nearest open cell, straight through the
       collision test: it is already in the wall, so the only way out is through. Without
       this, a body shoved into the border by a knockback can sit in the stone for the
       rest of the match while its plan asks it to walk somewhere. */
    if (solid(S.lv, cx, cy)) {
      const ot = openTile(cx, cy);
      const tx2 = ot.x * TILE + TILE / 2, ty2 = ot.y * TILE + TILE / 2;
      const ang = Math.atan2(ty2 - e.y, tx2 - e.x);
      e.x = clamp(e.x + Math.cos(ang) * 52 * dt, 6, MAP_W * TILE - 6);
      e.y = clamp(e.y + Math.sin(ang) * 52 * dt, 6, MAP_H * TILE - 6);
      faceTo(e, t.x, t.y);
      e.aimA = Math.atan2(t.y - e.y, t.x - e.x);
      stampStuck(e, dt, true);
      return;
    }
    let inStone = false;
    if (solid(S.lv, cx, cy)) {
      inStone = true;
      e.slideT = 0;
      const out = openTile(cx, cy);
      gx2 = out.x * TILE + TILE / 2; gy2 = out.y * TILE + TILE / 2;
    } else {
      const gt = openTile(clamp(Math.floor(gx2 / TILE), 1, MAP_W - 2), clamp(Math.floor(gy2 / TILE), 1, MAP_H - 2));
      const gtx = gt.x, gty = gt.y;
      e.pathT = Math.max(0, e.pathT - dt);
      const needsField = !clearLine(e.x, e.y, gx2, gy2) || e.blockedT > 0.35;
      if (needsField) { e.pathOn = true; e.pathT = 0.5; }
      else if (e.pathT <= 0) e.pathOn = false;
      if (!(cx === gtx && cy === gty) && e.pathOn) {
        const f = flowField(S.lv, gtx, gty);
        const nxt = f[cy * MAP_W + cx];
        if (nxt >= 0) { gx2 = (nxt % MAP_W) * TILE + TILE / 2; gy2 = ((nxt / MAP_W) | 0) * TILE + TILE / 2; }
      }
    }
    /* a body that has been trying to move for over a second and gets nowhere walks
       to the middle of the arena for a moment. The pockets between the border and a
       pillar are the one place a wall-slide cannot reason its way out of. */
    const bail = e.bailT > 0;
    if (bail) {
      e.bailT -= dt;
      gx2 = MAP_W * TILE * 0.5; gy2 = MAP_H * TILE * 0.5;
      e.pathOn = true; e.pathT = 0.7;      // and take the route, not the straight line
    }
    /* The brain may name a goal that cannot be walked to: a retreat extrapolated from a body
       that is already against the wall lands outside the arena, and cover cells are picked at
       some call sites without a stone test. A goal like that is a body grinding the border for
       the rest of the match. Clamp it into the ring and snap it out of stone, in one place, so
       no call site in the brain has to remember. */
    /* One tile of inset still stands a body on the first floor tile, shoulder
       on the border. A goal that is the body itself may enter that rim, or a
       chaser spends the fight on a rail while the target stands in the gutter.
       A kite or a retreat that falls outside the wider floor was riding that
       same rail: bend it back into the ring instead of lapping the wall. */
    const ringW = S.lv.W * TILE, ringH = S.lv.H * TILE;
    const hard = TILE * 1.15;
    const wide = Math.max(TILE * 2.25, Math.min(ringW, ringH) * 0.09);
    const onBody = t && !t.dead && dist2(gx2, gy2, t.x, t.y) < 56;
    const edge = onBody ? hard : wide;
    const rawX = gx2, rawY = gy2;
    gx2 = clamp(gx2, edge, ringW - edge);
    gy2 = clamp(gy2, edge, ringH - edge);
    if (!onBody && (Math.abs(gx2 - rawX) > 0.5 || Math.abs(gy2 - rawY) > 0.5)) {
      gx2 += (ringW * 0.5 - gx2) * 0.45;
      gy2 += (ringH * 0.5 - gy2) * 0.45;
    }
    /* Already inside the floor, but the goal still runs along the inset. A gun
       with the chaser straight behind her sits a pixel inside the line, so the
       test has to cover that shoulder, and only the axis that is against the wall. */
    if (!onBody) {
      const pad = 36;
      const mx = ringW * 0.5, my = ringH * 0.5;
      if (e.x < wide + pad || e.x > ringW - wide - pad) gx2 += (mx - gx2) * 0.55;
      if (e.y < wide + pad || e.y > ringH - wide - pad) gy2 += (my - gy2) * 0.55;
    }
    if (solidAt(S.lv, gx2, gy2)) {
      const ot2 = openTile(Math.floor(gx2 / TILE), Math.floor(gy2 / TILE));
      gx2 = ot2.x * TILE + TILE / 2; gy2 = ot2.y * TILE + TILE / 2;
    }
    let a = Math.atan2(gy2 - e.y, gx2 - e.x);
    if (!inStone && e.slideT > 0) a += e.slideDir * Math.PI / 2;

    let mvx = Math.cos(a) * st.speed * dt;
    let mvy = Math.sin(a) * st.speed * dt;
    /* separation — a nudge, never a wall. Uncapped, four allies crowded round one
       slow body sum to more push-back than that body's walking speed. */
    const gap = bodyGap(e, st.speed);
    mvx += gap.x * dt;
    mvy += gap.y * dt;
    const wanted = Math.hypot(mvx, mvy);
    const walked = moveEntity(e, mvx, mvy);
    if (wanted > 0.06 && walked < wanted * 0.45) {
      e.blockedT += dt;
      if (e.blockedT > e.blockedWorst) e.blockedWorst = e.blockedT;
      if (e.blockedT > 0.2 && e.slideT <= 0 && !inStone) {
        /* step to the side that is actually open, not a coin flip */
        const p1 = a + Math.PI / 2, p2 = a - Math.PI / 2;
        const ok1 = !solidAt(S.lv, e.x + Math.cos(p1) * 22, e.y + Math.sin(p1) * 22);
        const ok2 = !solidAt(S.lv, e.x + Math.cos(p2) * 22, e.y + Math.sin(p2) * 22);
        e.slideDir = ok1 && !ok2 ? 1 : ok2 && !ok1 ? -1 : (Math.random() < 0.5 ? 1 : -1);
        e.slideT = 0.42;
      }
    } else {
      e.blockedT = 0;
    }
    if (e.slideT > 0) e.slideT -= dt;
    e.walk += walked > 0.02 ? dt * 6 : 0;
    /* Look at the body being fought. Facing the velocity made every sidestep a
       turn, and a walk away from the camera used a frame the sheet does not have. */
    faceTo(e, t.x, t.y);
    stampStuck(e, dt, true);
  }

  /* The measure that matches the complaint "they get caught on things": a body that
     has somewhere to be, is leaning on stone, and has not moved for two seconds.
     Sampled in windows because a single frame says nothing — a body pressed into a
     wall while it dies is fine, a body pressed into one for a minute is not. */
  function stampStuck(e, dt, moving) {
    e.goalNow = moving;
    e.mvT += dt;
    if (e.mvT < 1.0) return;
    e.mvT = 0;
    const net = Math.hypot(e.x - e.mvX, e.y - e.mvY);
    e.mvX = e.x; e.mvY = e.y;
    if (e.goalNow && e.blockedT > 0.4 && net < 14) {
      e.stuckS += 1;
      if (e.stuckS > e.stuckWorst) e.stuckWorst = e.stuckS;
    } else e.stuckS = 0;
  }

  function moveEntity(e, dx, dy) {
    /* Ghosts are not bodies the stone can hold. They still cannot leave the ring. */
    if (e.b && e.b.ghost) {
      const x0 = e.x, y0 = e.y;
      e.x = clamp(e.x + dx, TILE * 1.15, (MAP_W - 1.15) * TILE);
      e.y = clamp(e.y + dy, TILE * 1.15, (MAP_H - 1.15) * TILE);
      return Math.hypot(e.x - x0, e.y - y0);
    }
    const x0 = e.x, y0 = e.y;
    const before = overlapAt(x0, y0);
    const nx = e.x + dx;
    /* A body standing inside stone — knocked there, pulled there, blinking there —
       may always push its way back out. The old rule demanded a fully clear
       destination, so a kit shoved into the border wall had EVERY direction
       refused, including the one that would have freed it, and it stood frozen for
       the rest of the match. This one rule was the whole of the "caught on the
       obstacles" report. */
    if (overlapAt(nx, e.y) <= before) e.x = nx;
    const ny = e.y + dy;
    if (overlapAt(e.x, ny) <= before) e.y = ny;
    return Math.hypot(e.x - x0, e.y - y0);
  }

  function flourish(e, vis, x2, y2) {
    e.animT = 0.34;
    e.animMax = 0.34;
    e.animVis = vis || "slash";
    if (w.LYGO_ATTACKS) w.LYGO_ATTACKS.cast(S, e, e.animVis, x2, y2);
  }

  /* Where the body will be when the bolt arrives. A shot at the feet they
     have already left is the miss that reads as two people spinning. */
  function shotAt(src, tgt, spd) {
    const vx = tgt.vx || 0, vy = tgt.vy || 0;
    const dist = Math.hypot(tgt.x - src.x, tgt.y - src.y) || 1;
    let t = Math.min(0.42, dist / Math.max(120, spd));
    let x = tgt.x + vx * t, y = tgt.y + vy * t;
    const d2 = Math.hypot(x - src.x, y - src.y) || 1;
    t = Math.min(0.42, d2 / Math.max(120, spd));
    x = clamp(tgt.x + vx * t, 18, MAP_W * TILE - 18);
    y = clamp(tgt.y + vy * t, 18, MAP_H * TILE - 18);
    return { x: x, y: y };
  }

  function attack(e) {
    if (e.atkCd > 0 || e.stun > 0) return;
    const b = e.b;
    const t = e.target && !e.target.dead ? e.target : pickTarget(e, "nearest");
    if (!t) return;
    const st = buffed(e);
    const d = dist2(e.x, e.y, t.x, t.y);
    if (d > st.range + 16) return;
    if (e.silence > 0) return;
    faceTo(e, t.x, t.y);
    e.atkCd = 1 / Math.max(0.15, st.rate);
    flourish(e, b.atk.vis || (b.atk.type === "bolt" ? "shard" : "slash"), t.x, t.y);
    if (b.atk.sfx && w.ArenaUI && w.ArenaUI.sfx) w.ArenaUI.sfx(b.atk.sfx, 0.22);
    const isMelee = b.atk.type !== "bolt" && b.range <= 100;
    if (S.tele) { if (isMelee) S.tele.melee++; else S.tele.shots++; }
    const echo = b.mods.echo || 0;
    const dmg = st.dmg * (1 + (b.atk.dmg || 0));
    if (isMelee) {
      const dealt = damage(e, t, dmg, { melee: true, name: b.atk.name });
      if (b.atk.drain && dealt > 0) heal(e, Math.round(dealt * b.atk.drain), e);
      /* Truth Lens on a hand weapon: the blow carries into the next body in reach. */
      if (b.pierce > 0) {
        enemiesOf(e).filter((o) => o !== t && dist2(e.x, e.y, o.x, o.y) <= st.range + 18)
          .sort((a, c) => dist2(t.x, t.y, a.x, a.y) - dist2(t.x, t.y, c.x, c.y))
          .slice(0, b.pierce)
          .forEach((o) => damage(e, o, dmg, { melee: true, name: b.atk.name }));
      }
      if (b.atk.splash) {
        enemiesOf(e).forEach((o) => {
          if (o === t) return;
          if (dist2(t.x, t.y, o.x, o.y) < b.atk.splash * TILE) damage(e, o, dmg * 0.45, { melee: true, dot: true });
        });
      }
      if (b.atk.burn) applySt(t, { burn: [b.atk.burn, 3] }, e);
      S.marks.push({ x: t.x, y: t.y - 8, r: 0, life: 0.28, col: e.b.color, spark: true });
      S.marks.push({ x: t.x, y: t.y + 2, r: 8, life: 0.22, col: e.b.color, ring: true });
      S.marks.push({ x: t.x, y: t.y + 6, r: 10, life: 0.28, col: e.b.color, dust: true });
    } else {
      const aim = shotAt(e, t, 420);
      faceTo(e, aim.x, aim.y);
      S.projectiles.push({
        x: e.x, y: e.y - 8, a: Math.atan2(aim.y - (e.y - 8), aim.x - e.x), spd: 420, dmg: 0, src: e, team: e.team,
        w: b.atk.w, vis: b.atk.vis, col: b.color, life: 2.0, pierce: b.pierce || 0, frame: 0,
        direct: dmg, splashR: (b.atk.nova || 0) * TILE, splashMul: 0.5,
        ignoreWall: !!b.ghost, drain: b.atk.drain || 0, name: b.atk.name
      });
    }
    /* Echo Round: the shot arrives twice — the second one a beat later */
    if (echo) S.pending.push({ t: 0.32, x: t.x, y: t.y, r: 16, dmg: dmg * echo, src: e, col: e.b.color, echo: true, single: t, name: b.atk.name });
  }

  /* -------------------------------------------------------------- projectiles */
  function stepProjectiles(dt) {
    for (let i = S.projectiles.length - 1; i >= 0; i--) {
      const p = S.projectiles[i];
      p.frame += dt * 14;
      const sp = p.spd * dt;
      p.x += Math.cos(p.a) * sp;
      p.y += Math.sin(p.a) * sp;
      p.life -= dt;
      let done = false;
      if (!p.ignoreWall && solidAt(S.lv, p.x, p.y)) done = true;
      if (p.lob) {
        if (dist2(p.x, p.y, p.tx, p.ty) < Math.max(14, p.spd * dt)) {
          blast(p.x, p.y, p.radius, p.dmg, p.src, p.st, p.team, false, false, !!p.opening, p.name);
          done = true;
        }
      } else {
        const hits = all().filter((e) => !e.dead && e.team !== p.team && dist2(e.x, e.y - 6, p.x, p.y) < 22);
        if (!p.hit) p.hit = {};
        hits.forEach((h) => {
          if (p.hit[h.uid]) return;
          p.hit[h.uid] = 1;
          const amount = p.direct != null ? p.direct : p.dmg;
          const dealt = damage(p.src, h, amount, { ranged: true, opening: !!p.opening, name: p.name });
          p.landed = true;
          if (p.drain && dealt > 0 && p.src) heal(p.src, Math.round(dealt * p.drain), p.src);
          applySt(h, p.st, p.src);
          if (p.splashR) blast(p.x, p.y, p.splashR, amount * (p.splashMul || 0.5), p.src, null, p.team, true, false, false, p.name);
          done = true;
        });
      }
      if (p.life <= 0 || (p.x < 0 || p.y < 0 || p.x > MAP_W * TILE || p.y > MAP_H * TILE)) done = true;
      if (done) {
        if (p.pierce > 0 && p.life > 0) p.pierce--;
        else {
          /* The other half of the report: an aimed shot that slid past a strafing body
             and expired off the edge of the world without a word. It missed -- and now
             it says so, which is how a miss stops being mistaken for a bug. */
          if (!p.landed && p.direct != null && !p.lob) {
            S.texts.push({ x: p.x, y: p.y - 18, t: "miss", life: 0.5, col: "#94a3b8" });
            if (S.tele) S.tele.whiffs++;
          }
          S.projectiles.splice(i, 1);
        }
      }
    }
  }
  function blast(x, y, radius, dmg, src, st, team, quiet, strips, opening, name) {
    if (!quiet) S.marks.push({ x: x, y: y, r: radius, life: 0.35, col: (src && src.b.color) || "#fbbf24", ring: true });
    all().forEach((o) => {
      if (o.dead) return;
      if (team != null && o.team === team) return;
      if (dist2(x, y, o.x, o.y) > radius) return;
      if (dmg) damage(src, o, dmg, { ranged: true, strips: !!strips, opening: !!opening, name: name });
      applySt(o, st, src);
    });
  }
  /* Burn and bleed are stated in health per second. A per-frame fraction rounds
     away to zero, so the points bank on the body and land as whole hits. */
  function soak(e, kind, dt) {
    const T = kind + "T", D = kind + "Dps", B = kind + "Bank", F = kind + "From";
    if (e[T] <= 0) return false;
    e[T] -= dt;
    e[B] = (e[B] || 0) + (e[D] || 0) * dt;
    if (e[B] >= 1) {
      const bite = Math.floor(e[B]);
      e[B] -= bite;
      damage(e[F] || null, e, bite, { dot: true, sure: true, noCrit: true, ignoreArmor: true });
      if (e.dead) return true;
    }
    if (e[T] <= 0) { e[T] = 0; e[D] = 0; e[B] = 0; e[F] = null; }
    return false;
  }

  /* -------------------------------------------------------------- the tick --- */
  function step(dt) {
    S.time += dt;
    /* the pre-stage runs its opening clock first: waves, seams, hard switches, release */
    if (w.LYGO_FORMATION) w.LYGO_FORMATION.tick(S, dt);
    /* the team call is made on the squad's own clock, before anybody moves */
    if (w.LYGO_BRAIN) w.LYGO_BRAIN.tick(S, dt);
    const dmgMul = suddenScale(S.time);
    if (dmgMul > 1) {
      const tier = Math.round((dmgMul - 1) / 0.25);
      if (!S.sudden) {
        S.sudden = true;
        S.suddenTier = tier;
        pushEvent("Sudden death. Hits land 25% harder, and they climb each minute.", "warn");
        pushCast("sudden", {});
      } else if (tier > (S.suddenTier || 1)) {
        S.suddenTier = tier;
        pushEvent(tier >= SUDDEN_STEPS
          ? "Sudden death peaks. Every hit lands at double."
          : "Sudden death climbs. Hits land " + (tier * 25) + "% harder.", "warn");
      }
    }
    /* one line about the ring, once the bell's quiet is over and the fight is real */
    if (!S.lawSaid && S.time > 6.5 && !S.over) {
      S.lawSaid = true;
      const law = lawById(S.lv && S.lv.realm);
      const raw = String(law.line).split("—").pop().trim();
      const note = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : law.line;
      pushCast("law", { ring: law.name, note: note });
    }
    all().forEach((e) => {
      if (e.dead) { e.dieT += dt; return; }
      e.stun = Math.max(0, e.stun - dt);
      e.root = Math.max(0, e.root - dt);
      e.silence = Math.max(0, e.silence - dt);
      e.slowT = Math.max(0, e.slowT - dt);
      e.swiftT = Math.max(0, e.swiftT - dt);
      e.hasteT = Math.max(0, e.hasteT - dt);
      e.rageT = Math.max(0, e.rageT - dt);
      e.weakT = Math.max(0, e.weakT - dt);
      e.thornsT = Math.max(0, e.thornsT - dt);
      e.reflectT = Math.max(0, e.reflectT - dt);
      e.veilT = Math.max(0, e.veilT - dt);
      e.regenT = Math.max(0, e.regenT - dt);
      e.lifestealT = Math.max(0, e.lifestealT - dt);
      e.tauntT = Math.max(0, e.tauntT - dt);
      e.armorBuffT = Math.max(0, e.armorBuffT - dt);
      if (e.armorBuffT <= 0) e.armorBuff = 0;
      e.shieldWallT = Math.max(0, e.shieldWallT - dt);
      e.flash = Math.max(0, e.flash - dt);
      e.animT = Math.max(0, e.animT - dt);
      if (e.ttl) { e.ttl -= dt; if (e.ttl <= 0) { e.dead = true; S.texts.push({ x: e.x, y: e.y - 20, t: "fades", life: 0.7, col: "#94a3b8" }); checkOver(); return; } }
      /* the well: regen status plus the card */
      const regen = (e.regenT > 0 ? e.regenHps : 0) + (e.b.mods.regen || 0);
      if (regen) e.hp = Math.min(e.max, e.hp + regen * dt);
      const realm = S.lv && S.lv.realm;
      if (realm === "root") e.hp = Math.min(e.max, e.hp + 1.8 * dt);
      if (realm === "ember") {
        const cx = MAP_W * TILE * 0.5, cy = MAP_H * TILE * 0.5;
        if (dist2(e.x, e.y, cx, cy) < 108) {
          e.emberHold = (e.emberHold || 0) + 11 * dt;
          if (e.emberHold >= 4) {
            const bite = e.emberHold;
            e.emberHold = 0;
            damage(null, e, bite, { dot: true, sure: true, noCrit: true, ignoreArmor: true });
            if (e.dead) return;
          }
        }
      }
      if (soak(e, "burn", dt)) return;
      if (soak(e, "bleed", dt)) return;
      if (e.woundT > 0) e.woundT -= dt;
      if (e.hp <= 0 && !e.dead) { die(e, null); return; }
      if (e.shd < 0) e.shd = 0;
      /* the last-stand card */
      if (!e.usedLastStand && e.b.cards.some((c) => c.hook === "lastStand") && e.hp / e.max < 0.3) {
        e.usedLastStand = true;
        heal(e, Math.round(e.max * 0.35), e);
        pushEvent(e.b.name + " will not go down — Second Wind.", "gift");
      }
      e.mana = Math.min(e.b.manaMax, e.mana + e.b.manaRegen * dt);
      const cdStep = dt * ((S.lv && S.lv.realm === "lattice") ? 1.1 : 1);
      e.cds = e.cds.map((c) => Math.max(0, c - cdStep));
      e.atkCd = Math.max(0, e.atkCd - cdStep);
      if (e.px != null && dt > 0) {
        e.vx = (e.x - e.px) / dt;
        e.vy = (e.y - e.py) / dt;
      } else { e.vx = 0; e.vy = 0; }
      e.px = e.x; e.py = e.y;
      think(e, dt);
      attack(e);
    });
    for (let pass = 0; pass < 4; pass++) shoulders();
    stepProjectiles(dt);
    for (let i = S.pending.length - 1; i >= 0; i--) {
      const p = S.pending[i];
      p.t -= dt;
      if (p.t > 0) continue;
      if (p.single) {
        if (!p.single.dead) damage(p.src, p.single, p.dmg, { ranged: true, dot: true, name: p.name });
      } else blast(p.x, p.y, p.r, p.dmg, p.src, p.st, p.src ? p.src.team : null, false, !!p.strips, !!p.opening, p.name);
      S.pending.splice(i, 1);
    }
    S.texts.forEach((t) => { t.life -= dt; t.y -= 18 * dt; });
    S.texts = S.texts.filter((t) => t.life > 0);
    S.bubbles = (S.bubbles || []).filter((b) => {
      b.life -= dt;
      if (b.who) { b.x = b.who.x; b.y = b.who.y; }        // the bubble rides the head that said it
      return b.life > 0;
    });
    /* the quiet stretches still have mouths in them */
    S.talkT = (S.talkT == null ? 7 : S.talkT) - dt;
    if (S.talkT <= 0 && !S.over && S.time > 3) {
      /* the mouths never touch the sim's randomness: which body pipes up, and when, comes
         off the talk counter and the clock, so the fight itself plays out unchanged */
      S.talkT = 20 + ((S.talkSeq * 37 + ((S.time * 10) | 0)) % 13);
      const all = live();
      if (all.length > 1) {
        const tk = all[(S.talkSeq * 7 + ((S.time * 3) | 0)) % all.length];
        const en = enemiesOf(tk).filter((o) => !o.dead);
        pushTalk("taunt", tk, en.length ? en.reduce((p, o) => (dist2(tk.x, tk.y, o.x, o.y) < dist2(tk.x, tk.y, p.x, p.y) ? o : p)) : null, false);
      }
    }
    S.marks.forEach((m) => { m.life -= dt; if (m.ring) m.r += 90 * dt; else if (m.dust) m.r += 46 * dt; });
    S.marks = S.marks.filter((m) => m.life > 0);
    S.swings.forEach((s) => { s.life -= dt; });
    S.swings = S.swings.filter((s) => s.life > 0);
    S.zones.forEach((z) => {
      z.life -= dt;
      if (S.lv && S.lv.realm === "void") {
        live().forEach((e) => {
          if (dist2(e.x, e.y, z.x, z.y) <= z.r) {
            e.slowT = Math.max(e.slowT, 0.2);
            e.slowV = Math.max(e.slowV, z.slow);
          }
        });
      }
    });
    S.zones = S.zones.filter((z) => z.life > 0);
    if (S.lv && S.lv.realm === "tide" && !S.over) {
      S.tideIn -= dt;
      if (S.tideIn <= 0) {
        S.tideIn = 12;
        const cx = MAP_W * TILE * 0.5, cy = MAP_H * TILE * 0.5;
        pushEvent("The tide turns.", "law");
        if (!S.tideSaid) { S.tideSaid = true; pushCast("tide", { ring: "Tide Ring" }); }
        S.marks.push({ x: cx, y: cy, r: 40, life: 0.7, col: "#38bdf8", ring: true });
        live().forEach((e) => {
          const a = Math.atan2(e.y - cy, e.x - cx) + 1.5708;
          moveEntity(e, Math.cos(a) * 36, Math.sin(a) * 36);
        });
      }
    }
    if (!S.over && S.time >= HARD_STOP) {
      S.over = true; S.phase = "over"; S.winner = -1;
      pushEvent("Ten minutes. Neither side fell. The map is a draw.", "over");
      pushCast("draw", {});
    }
  }

  /* ---------------------------------------------------------------- render --- */
  function paintFloor(lv) {
    const cv = document.createElement("canvas");
    cv.width = lv.W * TILE; cv.height = lv.H * TILE;
    const cx = cv.getContext("2d");
    wantFloor(lv.floor || lv.realm);
    const skin = FLOOR_SKIN[lv.floor || lv.realm];
    if (skin && skin.width) {
      cx.imageSmoothingEnabled = true;
      cx.imageSmoothingQuality = "high";
      cx.drawImage(skin, 0, 0, cv.width, cv.height);
      cx.globalAlpha = 0.45; cx.strokeStyle = "#0b1220"; cx.lineWidth = 6;
      cx.strokeRect(3, 3, cv.width - 6, cv.height - 6);
      return cv;
    }
    if (!AT.tiles || !AT.meta.tiles) return null;
    cv.width = lv.W * TILE; cv.height = lv.H * TILE;
    cx.imageSmoothingEnabled = false;
    cx.fillStyle = "#05060a"; cx.fillRect(0, 0, cv.width, cv.height);
    const m = AT.meta.tiles, img = AT.tiles;
    const z = lv.realm;
    const tile = (name, x, y) => {
      const i = m.names[name];
      if (i == null) return;
      cx.drawImage(img, (i % m.cols) * m.cell, ((i / m.cols) | 0) * m.cell, m.cell, m.cell, x, y, TILE + 1, TILE + 1);
    };
    for (let y = 0; y < lv.H; y++) for (let x = 0; x < lv.W; x++) {
      const px = x * TILE, py = y * TILE;
      if (lv.tiles[y][x] === "wall") {
        const N = !solid(lv, x, y - 1), Sd = !solid(lv, x, y + 1), E = !solid(lv, x + 1, y), Wl = !solid(lv, x - 1, y);
        if (!N && !Sd && !E && !Wl) continue;
        tile(z + "_top", px, py);
        if (Sd) tile(z + "_face", px, py);
      } else {
        tile(z + "_f" + ((x & 3) + ((y & 3) << 2)), px, py);
      }
    }
    /* ---- the dressing. Each kind of colosseum paints its own floor, so a
       spectator knows which arena they are watching before the first blow lands. */
    const ring = (x, y, r, col, lw) => { cx.strokeStyle = col; cx.lineWidth = lw; cx.beginPath(); cx.arc(x, y, r, 0, 6.283); cx.stroke(); };
    const cxp = cv.width / 2, cyp = cv.height / 2;
    const kind = lv.kind || "colosseum";
    cx.save();
    /* sand grain: a seeded speckle so the sand never reads as flat colour */
    let sd = 1337;
    const rnd2 = () => { sd = (sd * 1103515245 + 12345) & 0x7fffffff; return sd / 0x7fffffff; };
    cx.globalAlpha = 0.07;
    for (let i = 0; i < 900; i++) {
      const px = rnd2() * cv.width, py = rnd2() * cv.height;
      if (solid(lv, Math.floor(px / TILE), Math.floor(py / TILE))) continue;
      cx.fillStyle = rnd2() > 0.5 ? "#fde68a" : "#0f172a";
      cx.fillRect(px, py, 2, 2);
    }
    /* No rings or discs on the floor. A big circle in the middle of bare sand read as a
       rendering fault, and the rings are not the arena any more — the sand is. */
    cx.globalAlpha = 0.30;
    if (kind === "pit") {
      cx.globalAlpha = 0.10; cx.fillStyle = "#7f1d1d";
      cx.fillRect(cxp - TILE * 0.9, 0, TILE * 1.8, cv.height);
    } else if (kind === "colonnade") {
      cx.globalAlpha = 0.22;
      for (let i = -3; i <= 3; i++) {
        cx.strokeStyle = i % 2 ? "#5eead4" : "#fbbf24";
        cx.beginPath(); cx.moveTo(cxp + i * 54, 0); cx.lineTo(cxp + i * 54, cv.height); cx.stroke();
      }
    } else if (kind === "gauntlet") {
      cx.globalAlpha = 0.35;
      cx.fillStyle = "#f87171"; cx.globalAlpha = 0.10;
      cx.fillRect(cxp - TILE * 1.2, 0, TILE * 2.4, cv.height);
    } else if (kind === "ruin") {
      cx.globalAlpha = 0.16; cx.fillStyle = "#a16207";
      for (let i = 0; i < 26; i++) { const px = rnd2() * cv.width, py = rnd2() * cv.height; if (!solid(lv, Math.floor(px / TILE), Math.floor(py / TILE))) cx.fillRect(px, py, 8, 5); }
    } else {
      /* the colosseum floor: a faint sand-scoured cross, no ring at all */
      cx.globalAlpha = 0.10; cx.strokeStyle = "#fde68a"; cx.lineWidth = 2;
      cx.beginPath(); cx.moveTo(0, cyp); cx.lineTo(cv.width, cyp); cx.stroke();
    }
    /* the gates: a wash down each side so the two camps are legible at a glance */
    cx.fillStyle = "#22d3ee"; cx.globalAlpha = 0.10;
    cx.fillRect(TILE, 0, TILE * 3.2, cv.height);
    cx.fillStyle = "#f87171";
    cx.fillRect(cv.width - TILE * 4.2, 0, TILE * 3.2, cv.height);
    /* a stone lip round the whole floor, so the sand sits inside a building */
    cx.globalAlpha = 0.5; cx.strokeStyle = "#0b1220"; cx.lineWidth = 6;
    cx.strokeRect(3, 3, cv.width - 6, cv.height - 6);
    cx.globalAlpha = 0.25; cx.strokeStyle = "#e2e8f0"; cx.lineWidth = 1;
    cx.strokeRect(TILE + 1, TILE + 1, cv.width - TILE * 2 - 2, cv.height - TILE * 2 - 2);
    cx.restore();
    return cv;
  }

  /* The intro is a broadcast, not a teleport. Positions in the sim stay on the
     marks the whole time — headless fights never see this. Draw-time only. */
  function presentOf(e) {
    if (!e || e.dead || S.phase !== "count") return null;
    const elapsed = INTRO_S - S.countdown;
    const start = e.team === 0 ? 3.2 : 8.0;
    const u = clamp((elapsed - start) / 5.6, 0, 1);
    const s = u * u * (3 - 2 * u);
    if (s >= 0.995) return null;
    const team = e.team === 0 ? S.your : S.foe;
    const idx = team.indexOf(e);
    const face = e.team === 0 ? 3 : 2;
    if ((idx & 1) === 1) {
      const top = TILE * 0.85;
      return { x: e.x, y: top + (e.y - top) * s, lift: true, face: face };
    }
    const gx = e.team === 0 ? 36 : MAP_W * TILE - 40;
    return { x: gx + (e.x - gx) * s, y: e.y, lift: false, face: face };
  }
  function poseBody(e, fn) {
    const p = presentOf(e);
    if (!p) { fn(null); return; }
    const ox = e.x, oy = e.y, oface = e.face, ow = e.walk;
    e.x = p.x; e.y = p.y; e.face = p.face;
    const frames = e.b.spr.sheet === "heroes" ? 2 : 4;
    e.walk = Math.floor((INTRO_S - S.countdown) * 8) % frames;
    try { fn(p); }
    finally { e.x = ox; e.y = oy; e.face = oface; e.walk = ow; }
  }
  function drawMouths() {
    const H = MAP_H * TILE, W = MAP_W * TILE;
    const arch = (x, glow) => {
      ctx.save();
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(x, 8, 16, H - 16);
      ctx.fillRect(x + 52, 8, 16, H - 16);
      ctx.fillStyle = "#334155";
      ctx.fillRect(x - 2, 4, 72, 16);
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = glow;
      ctx.fillRect(x + 16, 22, 36, H - 40);
      ctx.restore();
    };
    /* The mouth stops short of the spawn mark, so a body finishes the walk in the open. */
    arch(2, "#22d3ee");
    arch(W - 72, "#f87171");
  }
  /* How much of a blow a ward may swallow. At 1 the plate eats whole attacks and a warded
     tank is a wall; below 1 every blow chips the body underneath it. 0.68 keeps the ward
     worth casting (it still eats most of what arrives) while guaranteeing that nothing a
     warded body stands in front of is ever fully free. */
  const WARD_SHARE = 0.68;
  const CROWD = { watch: null, cheer: null, jump: null };
  function loadCrowd() {
    ["watch", "cheer", "jump"].forEach((k) => {
      const img = new Image();
      img.onload = () => { CROWD[k] = img; };
      img.src = "./assets/crowd/" + k + ".jpg?v=2";
    });
  }
  /* One bowl, cover-scaled to the whole canvas. The sand is a hole, so the corners are crowd. */
  function paintBowl(img, alpha, bob, wpx, hpx) {
    if (!img || !img.width || alpha < 0.04) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const sc = Math.max(wpx / img.width, hpx / img.height) * 1.08;
    const dw = img.width * sc, dh = img.height * sc;
    ctx.drawImage(img, (wpx - dw) / 2, (hpx - dh) / 2 - bob, dw, dh);
    ctx.restore();
  }
  function houseMood() {
    let m = 0.28;
    if (S.phase === "count") m = (INTRO_S - S.countdown) < 3 ? 0.22 : 0.58;
    else if (S.phase === "live") m = S.time < 2.4 ? 0.95 : (S.sudden ? 0.82 : 0.42);
    else if (S.phase === "over") m = 1;
    if (S.shake > 0.15) m = 1;
    const ev = S.events.length ? S.events[S.events.length - 1] : null;
    if (ev && (S.time - ev.t) < 1.5 && (ev.kind === "kill" || ev.text === "FIGHT.")) m = 1;
    return m;
  }
  function drawHouse(wpx, hpx, ox, oy, scale) {
    const mapW = S.lv.W * TILE * scale, mapH = S.lv.H * TILE * scale;
    const mood = houseMood();
    const clock = S.phase === "count" ? (INTRO_S - S.countdown) : (S.time + INTRO_S);
    const mid = mood < 0.42 ? mood / 0.42 : (mood - 0.42) / 0.58;
    const lo = mood < 0.42 ? CROWD.watch : CROWD.cheer;
    const hi = mood < 0.42 ? CROWD.cheer : CROWD.jump;
    const hop = Math.sin(clock * (mood > 0.72 ? 6.2 : 1.3)) * (mood > 0.72 ? 7 : 1.2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, wpx, hpx);
    ctx.rect(ox, oy, mapW, mapH);
    ctx.clip("evenodd");
    paintBowl(lo, 1, hop, wpx, hpx);
    paintBowl(hi, mid, hop, wpx, hpx);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "#78716c";
    ctx.lineWidth = 5;
    ctx.strokeRect(ox + 2, oy + 2, Math.max(0, mapW - 4), Math.max(0, mapH - 4));
    ctx.restore();
  }

  function drawSprite(e) {
    const b = e.b, sheet = b.spr.sheet, img = AT[sheet];
    if (!img) return 0;
    const fr = b.spr.sheet === "heroes" ? ((e.walk | 0) % 2) : ((e.walk | 0) % 4);
    let frame = { face: e.face === 2 ? 2 : e.face === 3 ? 3 : 0, fr: fr };
    if (b.spr.sheet === "pets" || b.spr.sheet === "creatures") frame = { fr: fr };
    const c = cellOf(sheet, b.spr.key, frame);
    if (!c) return 0;
    const size = b.cls === "token" ? 34 : b.boss ? 52 : b.cls === "pet" ? 40 : 46;
    /* Creature and pet sheets are front-facing loops. Mirroring them on a sidestep
       is the spin. Heroes have a real side frame, and that one is mirrored. */
    const flip = b.spr.sheet === "heroes" && e.face === 2;
    const pose = w.LYGO_ATTACKS ? w.LYGO_ATTACKS.pose(e) : null;
    ctx.save();
    ctx.translate(Math.round(e.x + (pose ? pose.dx : 0)), Math.round(e.y + (pose ? pose.dy : 0)));
    if (pose) ctx.scale(pose.sx || 1, pose.sy || 1);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, c.sx, c.sy, c.cell, c.cell, -size / 2, -size * 0.78, size, size);
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
    if (e.flash > 0) {
      ctx.save();
      ctx.globalAlpha = e.flash * 3;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(e.x, e.y - size * 0.3, size * 0.42, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    return size;
  }

  /* The bowl does not move. The camera only looks closer at the sand inside it. */
  function aimCamera(dt) {
    if (!S.lv) return;
    const mapW = S.lv.W * TILE, mapH = S.lv.H * TILE;
    if (!S.cam) S.cam = { x: mapW / 2, y: mapH / 2, z: 1 };
    const bodies = all().filter((e) => !e.dead);
    let tx = mapW / 2, ty = mapH / 2;
    let tz = S.phase === "count" ? 1 : 1.34;
    if (bodies.length) {
      let sx = 0, sy = 0;
      bodies.forEach((e) => { sx += e.x; sy += e.y; });
      tx = sx / bodies.length;
      ty = sy / bodies.length;
      let best = 1e9, ax = tx, ay = ty;
      bodies.forEach((a) => bodies.forEach((b) => {
        if (a.team === b.team) return;
        const d = dist2(a.x, a.y, b.x, b.y);
        if (d < best) { best = d; ax = (a.x + b.x) / 2; ay = (a.y + b.y) / 2; }
      }));
      if (best < 320) { tx = tx * 0.4 + ax * 0.6; ty = ty * 0.4 + ay * 0.6; }
    }
    let victim = null;
    bodies.forEach((e) => {
      const ratio = e.max > 0 ? e.hp / e.max : 1;
      if (ratio < 0.24 && (!victim || ratio < victim.hp / victim.max)) victim = e;
    });
    (S.pending || []).forEach((p) => {
      if (!p || p.t > 0.4) return;
      bodies.forEach((e) => {
        if (p.src && e.team === p.src.team) return;
        if (dist2(e.x, e.y, p.x, p.y) > (p.r || 24) + 10) return;
        const ratio = e.max > 0 ? e.hp / e.max : 1;
        if (ratio > 0.42 && e.hp > (p.dmg || 0) * 0.45) return;
        if (!victim || ratio < victim.hp / Math.max(1, victim.max)) victim = e;
      });
    });
    const spot = S.camSpot;
    if (victim) {
      tx = victim.x;
      ty = victim.y - 12;
      tz = 1.92;
      S.camSpot = { x: victim.x, y: victim.y - 12, hold: 0.35 };
    } else if (spot && spot.hold > 0) {
      spot.hold -= dt;
      tx = spot.x;
      ty = spot.y;
      tz = S.over ? 1.72 : 1.88;
    }
    const vw = mapW / tz, vh = mapH / tz;
    tx = clamp(tx, vw / 2, Math.max(vw / 2, mapW - vw / 2));
    ty = clamp(ty, vh / 2, Math.max(vh / 2, mapH - vh / 2));
    const tight = !!(victim || (spot && spot.hold > 0));
    const kL = 1 - Math.exp(-(tight ? 5.2 : 1.45) * dt);
    const kZ = 1 - Math.exp(-(tight ? 4.4 : 1.7) * dt);
    const cam = S.cam;
    cam.x += (tx - cam.x) * kL;
    cam.y += (ty - cam.y) * kL;
    cam.z += (tz - cam.z) * kZ;
    const viewW = mapW / cam.z, viewH = mapH / cam.z;
    cam.x = clamp(cam.x, viewW / 2, Math.max(viewW / 2, mapW - viewW / 2));
    cam.y = clamp(cam.y, viewH / 2, Math.max(viewH / 2, mapH - viewH / 2));
  }

  function draw() {
    if (!ctx || !S.lv) return;
    const wpx = canvas.clientWidth, hpx = canvas.clientHeight;
    const dpr = Math.min(2, w.devicePixelRatio || 1);
    if (canvas.width !== (wpx * dpr | 0) || canvas.height !== (hpx * dpr | 0)) {
      canvas.width = wpx * dpr | 0; canvas.height = hpx * dpr | 0;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.setLineDash([]);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#05060a";
    ctx.fillRect(0, 0, wpx, hpx);
    /* The sand stays the fight. The stands are a thin ring, about half the old bowl,
       and the ring sits a little high so the fight is the picture. */
    const mapW = S.lv.W * TILE, mapH = S.lv.H * TILE;
    const topBand = Math.max(34, hpx * 0.08);
    const botBand = Math.max(40, hpx * 0.105);
    const scale = (hpx - topBand - botBand) / mapH;
    const ox = (wpx - mapW * scale) / 2, oy = topBand;
    const kick = S.shake > 0 ? S.shake * 10 : 0;
    const sx = kick ? (Math.random() - 0.5) * kick : 0;
    const sy = kick ? (Math.random() - 0.5) * kick : 0;
    const cam = S.cam || { x: mapW / 2, y: mapH / 2, z: 1 };
    const zs = scale * cam.z;
    const holeCx = ox + mapW * scale / 2, holeCy = oy + mapH * scale / 2;
    ctx.setTransform(dpr * zs, 0, 0, dpr * zs, dpr * (holeCx - cam.x * zs + sx), dpr * (holeCy - cam.y * zs + sy));
    if (floorCv) {
      const photo = S.lv && FLOOR_SKIN[S.lv.floor || S.lv.realm];
      if (photo && photo.width) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
      }
      ctx.drawImage(floorCv, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }
    drawMouths();
    drawLaw();

    /* pending blasts are telegraphed before they land: a spectator needs to see it coming */
    S.pending.forEach((p) => {
      ctx.save();
      ctx.strokeStyle = p.col || "#fbbf24";
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(S.time * 30);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(2, p.r || 24), 0, 6.283); ctx.stroke();
      ctx.restore();
    });
    S.marks.forEach((m) => {
      ctx.save();
      ctx.strokeStyle = m.col || "#5eead4";
      ctx.globalAlpha = Math.max(0, m.life * 2.2);
      ctx.lineWidth = m.beam ? 6 : 3;
      if (m.beam) {
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x2, m.y2); ctx.stroke();
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      else if (m.ring) {
        ctx.beginPath(); ctx.arc(m.x, m.y, Math.max(4, m.r), 0, 6.283); ctx.stroke();
        ctx.globalAlpha *= 0.45;
        ctx.beginPath(); ctx.arc(m.x, m.y, Math.max(2, m.r * 0.55), 0, 6.283); ctx.stroke();
      }
      else if (m.dust) {
        ctx.fillStyle = m.col || "#e8eef5";
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.scale(1, 0.36);
        ctx.beginPath(); ctx.arc(0, 0, Math.max(6, m.r), 0, 6.283); ctx.stroke();
        ctx.restore();
        ctx.globalAlpha *= 0.7;
        for (let i = 0; i < 5; i++) {
          const a = i * 1.256 + m.life * 3;
          ctx.beginPath();
          ctx.arc(m.x + Math.cos(a) * m.r * 0.7, m.y + Math.sin(a) * m.r * 0.22, 1.6, 0, 6.283);
          ctx.fill();
        }
      }
      else if (m.spark) {
        ctx.fillStyle = m.col || "#fff";
        ctx.strokeStyle = m.col || "#fff";
        const n = 6;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 6.283 + m.life;
          const len = 7 + (1 - m.life) * 10;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x + Math.cos(a) * len, m.y + Math.sin(a) * len);
          ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, 6.283); ctx.fill();
      }
      else {
        ctx.fillStyle = m.col || "#fff";
        ctx.beginPath(); ctx.arc(m.x, m.y, 6 + (1 - m.life) * 12, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    });
    /* shadows, then bodies sorted by depth */
    ctx.save(); ctx.globalAlpha = 0.32; ctx.fillStyle = "#000";
    all().forEach((e) => {
      if (e.dead && !(e.dieT < 0.4)) return;
      poseBody(e, () => { ctx.beginPath(); ctx.ellipse(e.x, e.y + 2, 13, 5, 0, 0, 6.283); ctx.fill(); });
    });
    ctx.restore();
    const shownY = (e) => { const p = presentOf(e); return p ? p.y : e.y; };
    const order = all().filter((e) => !e.dead || e.dieT < 0.4).sort((a, b) => shownY(a) - shownY(b));
    order.forEach((e) => {
      poseBody(e, (p) => {
      if (p && p.lift) {
        /* A short cage around the body. A line from the top of the sand read as a
           blue stripe stuck to the second fighter on each side. */
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(e.x - 22, e.y + 2, 44, 7);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(e.x - 20, e.y - 34, 3, 36);
        ctx.fillRect(e.x + 17, e.y - 34, 3, 36);
        ctx.fillRect(e.x - 20, e.y - 34, 40, 3);
        ctx.restore();
      }
      const size = drawSprite(e);
      /* Team colour stays on the bar over the head. A disc at the feet painted on
         top of the sprite and read as a marker stuck to the body. */
      if (e.tauntT > 0 || e.shieldWallT > 0) {
        ctx.save();
        ctx.globalAlpha = 0.5; ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(e.x, e.y + 2, 20, 9, 0, 0, 6.283); ctx.stroke();
        ctx.restore();
      }
      /* health bar over the head with the shield stacked on top */
      const bw = e.b.boss ? 54 : 40, bx = e.x - bw / 2, by = e.y - size * 0.86 - 8;
      ctx.fillStyle = "rgba(3,6,12,0.82)";
      ctx.fillRect(bx - 1, by - 1, bw + 2, 7);
      ctx.fillStyle = e.team === 0 ? "#22d3ee" : "#f87171";
      ctx.fillRect(bx, by, bw * clamp(e.hp / e.max, 0, 1), 5);
      if (e.shd > 0) {
        ctx.fillStyle = "rgba(251,191,36,0.85)";
        ctx.fillRect(bx, by - 3, bw * clamp(e.shd / e.max, 0, 1), 2);
      }
      /* ability pips: lit when a move is ready */
      const pips = e.b.moves.length;
      for (let i = 0; i < pips; i++) {
        const px = bx + (bw / (pips + 1)) * (i + 1) - 3;
        const ready = e.cds[i] <= 0 && e.mana >= moveCost(e.b.moves[i]);
        ctx.fillStyle = ready ? "#fbbf24" : "rgba(148,163,184,0.45)";
        ctx.fillRect(px, by - 8, 6, 4);
      }
      if (e.stun > 0 || e.root > 0 || e.silence > 0) {
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "700 9px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(e.stun > 0 ? "STUN" : e.root > 0 ? "ROOT" : "HUSH", e.x, by - 11);
      }
      });
    });
    /* A visual that throws must cost its own effect and nothing else. It used to cost
       everything drawn after it -- the bodies, the marks and the whole crowd ring, which
       is how a negative arc radius turned into "the crowd disappears and the arena is
       black around it". Whatever the effect, the rest of the frame still gets drawn. */
    if (w.LYGO_ATTACKS) {
      try { w.LYGO_ATTACKS.draw(ctx, S); }
      catch (err) { if (!S.fxErr) { S.fxErr = 1; if (w.console) console.warn("attack visual skipped:", err && err.message); } }
    }
    /* projectiles */
    S.projectiles.forEach((p) => {
      if (w.LYGO_ATTACKS && p.vis) { w.LYGO_ATTACKS.shot(ctx, p); return; }
      const c = cellOf("fx", "bolt_" + p.w, { fr: (p.frame | 0) % 4 });
      if (c) ctx.drawImage(AT.fx, c.sx, c.sy, c.cell, c.cell, p.x - 9, p.y - 9, 18, 18);
      else { ctx.fillStyle = "#fbbf24"; ctx.fillRect(p.x - 3, p.y - 3, 6, 6); }
      if (p.lob) { ctx.strokeStyle = "rgba(148,163,184,0.5)"; ctx.beginPath(); ctx.arc(p.tx, p.ty, 10, 0, 6.283); ctx.stroke(); }
    });
    /* the mouths: a bubble over the body that said it */
    /* Two mouths standing together used to print their bubbles on top of each other,
       so neither line could be read. A bubble that would land on one already up this
       frame is lifted clear of it. */
    const up = [];
    const said = {};
    (S.bubbles || []).forEach((b) => {
      const e = b.who;
      if (!e || said[e.uid]) return;
      said[e.uid] = 1;
      const x = e.x;
      let y = e.y - 34;
      const name = (e.b && e.b.name) ? String(e.b.name).slice(0, 16) : "";
      const words = String(b.text).split(" ");
      const lines = [];
      let cur = "";
      words.forEach((wd) => {
        if ((cur + " " + wd).trim().length > 28 && cur) { lines.push(cur); cur = wd; }
        else cur = (cur ? cur + " " : "") + wd;
      });
      if (cur) lines.push(cur);
      const long = lines.reduce((p, l) => Math.max(p, l.length), name.length);
      const w = long * 7.1 + 18, h = lines.length * 15 + 22;
      for (let tries = 0; tries < 8; tries++) {
        const bx = { l: x - w / 2, r: x + w / 2, t: y - h - 8, b: y };
        if (!up.some((o) => bx.l < o.r + 4 && bx.r > o.l - 4 && bx.t < o.b + 4 && bx.b > o.t - 4)) break;
        y -= h + 10;
      }
      up.push({ l: x - w / 2, r: x + w / 2, t: y - h - 8, b: y });
      ctx.globalAlpha = Math.min(1, b.life / 0.5);
      ctx.fillStyle = "rgba(3,7,18,0.88)";
      ctx.fillRect(x - w / 2, y - h - 8, w, h);
      ctx.strokeStyle = b.col || "#fbbf24";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - w / 2, y - h - 8, w, h);
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 8); ctx.lineTo(x + 5, y - 8); ctx.lineTo(x, y); ctx.lineTo(x - 5, y - 8);
      ctx.fillStyle = "rgba(3,7,18,0.88)";
      ctx.fill();
      ctx.textAlign = "center";
      ctx.fillStyle = b.col || "#fbbf24";
      ctx.font = "700 11px 'IBM Plex Mono', monospace";
      ctx.fillText(name, x, y - h + 12);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "13px ui-sans-serif, sans-serif";
      lines.forEach((l, i) => ctx.fillText(l, x, y - h + 28 + i * 15));
      ctx.globalAlpha = 1;
    });
    /* the speech bubbles ride the heads that said them */
    (S.bubbles || []).forEach((b) => { if (b.who) { b.x = b.who.x; b.y = b.who.y; } });
    /* damage numbers */
    ctx.textAlign = "center";
    S.texts.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = clamp(t.life * 1.6, 0, 1);
      const fin = t.t === "FINISH";
      ctx.font = (fin ? "800 26px " : t.big ? "800 18px " : "700 15px ") + "'IBM Plex Mono', monospace";
      /* A kill banner and the dying body's last words hang off the same body, so the two
         used to print on top of each other. The banner sits in its own lane above the
         bubble and gets a plate: either line on its own stays readable. */
      if (fin) {
        const bw = ctx.measureText(t.t).width + 20;
        ctx.fillStyle = "rgba(3,7,18,0.84)";
        ctx.fillRect(t.x - bw / 2, t.y - 24, bw, 32);
        ctx.strokeStyle = "rgba(251,191,36,0.6)"; ctx.lineWidth = 1;
        ctx.strokeRect(t.x - bw / 2, t.y - 24, bw, 32);
      }
      ctx.fillStyle = "#000"; ctx.fillText(t.t, t.x + 1, t.y + 1);
      ctx.fillStyle = t.col; ctx.fillText(t.t, t.x, t.y);
      ctx.restore();
    });
    /* A thin warning while hits are risen. The sand does not shrink. */
    if (S.sudden) {
      const k = clamp(suddenScale(S.time) - 1, 0, 1);
      ctx.save();
      ctx.strokeStyle = "rgba(248,113,113," + (0.28 + k * 0.45) + ")";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(6, 6, S.lv.W * TILE - 12, S.lv.H * TILE - 12);
      ctx.restore();
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.setLineDash([]);
    drawHouse(wpx, hpx, ox, oy, scale);
  }

  /* ----------------------------------------------------------------- API --- */
  let acc = 0, last = 0, raf = 0;
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const now = ts / 1000;
    const dt = Math.min(0.1, last ? now - last : 0);
    last = now;
    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 1.35);
    if (S.phase === "count") {
      S.countdown -= dt;
      runCues(INTRO_S - S.countdown);
      /* THE MARCH. The countdown is the team's time to get into shape, so the bodies
         move during it. Combat is not in here at all: nobody is in reach at spawn, the
         damage path is not called, and the only thing a body can spend before the bell
         is a self-buff -- which is what preparing for a fight is supposed to look like.
         Everything else waits for the bell, exactly as before. */
      if (w.LYGO_FORMATION && S.form) w.LYGO_FORMATION.march(S, dt);
      /* Nothing else runs here on purpose. The per-body brain is asked for a plan, and a
         body standing on its own mark with nothing in reach satisfies none of the
         preconditions a plan needs -- it would return without a task, which reads in the
         HUD as a fighter doing nothing. The march walks the bodies itself, and the first
         decision any body makes is the one it makes after the bell. */
      if (S.countdown <= 0) { S.phase = "live"; bell(); }
    } else if (S.phase === "live" && !S.paused && S.hitStop > 0) {
      S.hitStop -= dt;
    } else if (S.phase === "live" && !S.paused) {
      acc += dt * S.speed;
      let steps = 0;
      while (acc >= STEP && steps < 24) { step(STEP); acc -= STEP; steps++; }
      if (acc > STEP * 24) acc = 0;
      runCues(INTRO_S + S.time);              // the cues after the bell ride the match clock
    }
    aimCamera(dt);
    draw();
    if (w.ArenaUI) w.ArenaUI.tick();
  }

  async function init(cv) {
    canvas = cv;
    ctx = canvas.getContext("2d");
    loadCrowd();
    await loadAssets();
    if (!raf) raf = requestAnimationFrame(frame);
    return true;
  }

  /* Every cue the booth owes the crowd before the bell, in order, on the clock. Names come
     from the built teams, so the introduction cannot drift from who is actually standing there. */
  function buildIntro(meta) {
    const ring = lawById((S.lv && S.lv.realm) || "colosseum").name;
    const names = (team) => team.map((e) => e.b.name).join(", ");
    const mapNo = meta.map || 1;
    /* The programme is fifteen seconds and the clock does not stretch for anybody. The announcer
       reads it at 1.22x, the cue times are laid out against the worst case (a five-name team is a
       five second list), and the bell cuts him off if he runs long -- see director.js. Nothing
       else is allowed in there: the bodies answer the bell, they do not talk under the booth. */
    S.cues = [
      { at: 0.5, p: 9, run() {
        if (meta.tv && mapNo <= 1) {
          pushCast("introShow", {
            ring: ring,
            card: meta.tv.card || (S.mode + "v" + S.mode),
            n: String(meta.tv.streak || 0),
            streak: meta.tv.streak ? (meta.tv.streak + " straight") : "no champion yet"
          });
        } else {
          pushCast(mapNo > 1 ? "introScore" : "introRing", mapNo > 1
            ? { n: mapNo, mode: S.mode + "v" + S.mode, score: meta.score || "nothing decided yet" }
            : { ring: ring });
        }
      } },
      { at: 4.4, p: 9, run() { pushCast("introTeam", { side: meta.me || "your team", names: names(S.your) }); S.introShow = 1; } },
      { at: 9.2, p: 9, run() { pushCast("introTeam", { side: "the challengers", names: names(S.foe) }); S.introShow = 2; } },
      /* the bell rings at fifteen and the room goes quiet; then the bodies answer it */
      { at: INTRO_S + 5.6, p: 4, run() { if (S.your[0] && !S.your[0].dead) pushTalk("ready", S.your[0], null, true); } },
      { at: INTRO_S + 9.0, p: 4, run() { if (S.foe[0] && !S.foe[0].dead) pushTalk("ready", S.foe[0], null, true); } }
    ];
    S.introShow = 0;
  }
  function runCues(elapsed) {
    if (!S.cues || !S.cues.length) return;
    for (let i = 0; i < S.cues.length; i++) {
      if (S.cues[i].at <= elapsed) { const c = S.cues.splice(i, 1)[0]; c.run(); }
    }
  }
  /* The bell: the fight is live, the booth asks the question everybody is thinking, and the
     room goes quiet behind it for three to five seconds. */
  function bell() {
    pushEvent("FIGHT.", "over");
    pushCast("bell", { n: S.your.length + S.foe.length });
    /* The shape each side chose is the last thing worth saying before the first blow:
       it tells the crowd what they are about to watch. ONE line and ONE feed entry --
       two calls at the bell would step on the quiet the director protects. */
    if (w.LYGO_FORMATION && S.form && S.mode > 1 && S.form.teams.length === 2) {
      const a = S.form.teams[0], b = S.form.teams[1];
      pushCast("formation", { form: a.name, foe: b.name, temper: a.temper, note: a.note });
      pushEvent("Your side opens in " + a.name + " — " + a.note + ". The challengers answer in " + b.name + ".", "law");
      S.form.called = true;
    }
    S.bellAt = S.talkSeq;
    S.talkT = 20;
  }

  /* Summon sheets are match-local. A long show would otherwise keep every warden
     the doors have ever called. */
  function dropSummoned() {
    const book = R.byId;
    Object.keys(book).forEach((id) => {
      if (book[id] && book[id].cls === "token") delete book[id];
    });
  }

  function newMatch(ids, mode, seed, meta) {
    meta = meta || {};
    dropSummoned();
    S.mode = mode;
    S.lv = buildMap(seed == null ? rnd(9999) : seed);
    fieldCache.clear();
    S.your = mkTeam(ids.you, 0);
    S.foe = mkTeam(ids.foe, 1);
    S.projectiles = []; S.pending = []; S.texts = []; S.marks = []; S.swings = []; S.zones = [];
    S.bubbles = []; S.talk = [];
    S.time = 0; S.over = false; S.winner = null; S.sudden = false; S.suddenTier = 0; S.events = []; S.paused = false;
    /* What the blows actually did. A spectator cannot tell a miss from a missing number,
       and neither could this file: armour stops, ward swallows and shots that arrive at
       nothing are counted here so the question has an answer instead of an impression. */
    S.tele = { melee: 0, shots: 0, blocks: 0, wards: 0, whiffs: 0, warded: 0, chipped: 0 };
    S.lastBloodAt = 0;
    S.countdown = INTRO_S; S.shake = 0; S.hitStop = 0; S.tideIn = 12; S.bellAt = 0;
    S.phase = "count";
    S.cam = null;
    S.camSpot = null;
    floorCv = paintFloor(S.lv);
    pushEvent(KIND_BLURB[S.lv.kind || "colosseum"], "law");
    pushEvent(lawById(S.lv.realm).line, "law");
    pushEvent("The arena opens. " + S.your.length + "v" + S.foe.length + ".", "over");
    S.bubbles = []; S.talk = []; S.mouthAt = {}; S.talkT = INTRO_S + 9; S.kills = 0; S.aceSaid = false;
    S.talkSeq = S.talkSeq || 0;
    S.lastTalk = -9; S.lastHold = -9; S.lastSave = -9; S.lastColor = -9;
    S.lawSaid = false; S.tideSaid = false;
    /* The pre-stage picks each side a shape and a post for every body before anybody
       moves, so the countdown has something to walk into. */
    if (w.LYGO_FORMATION) w.LYGO_FORMATION.stage(S, S.lv && S.lv.seed != null ? S.lv.seed : seed);
    buildIntro(meta);
  }

  function drawLaw() {
    if (!S.lv) return;
    const realm = S.lv.realm;
    const cx = MAP_W * TILE * 0.5, cy = MAP_H * TILE * 0.5;
    ctx.save();
    if (realm === "ember") {
      ctx.globalAlpha = 0.16 + 0.07 * Math.sin(S.time * 4);
      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.arc(cx, cy, 108, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 0.75; ctx.strokeStyle = "#fb923c"; ctx.lineWidth = 2; ctx.stroke();
    } else if (realm === "frost") {
      ctx.globalAlpha = 0.07; ctx.fillStyle = "#7dd3fc";
      ctx.fillRect(0, 0, MAP_W * TILE, MAP_H * TILE);
    } else if (realm === "root") {
      ctx.globalAlpha = 0.05 + 0.03 * Math.sin(S.time * 2);
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(0, 0, MAP_W * TILE, MAP_H * TILE);
    } else if (realm === "gold" && !(S.lv.floor && FLOOR_SKIN[S.lv.floor] && FLOOR_SKIN[S.lv.floor].width)) {
      ctx.globalAlpha = 0.35; ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 78 + 8 * Math.sin(S.time * 2), 0, 6.283); ctx.stroke();
    } else if (realm === "lattice" && !(S.lv.floor && FLOOR_SKIN[S.lv.floor] && FLOOR_SKIN[S.lv.floor].width)) {
      ctx.globalAlpha = 0.22; ctx.strokeStyle = "#5eead4"; ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) ctx.strokeRect(cx - i * 48, cy - i * 34, i * 96, i * 68);
    } else if (realm === "tide" && !(S.lv.floor && FLOOR_SKIN[S.lv.floor] && FLOOR_SKIN[S.lv.floor].width)) {
      ctx.globalAlpha = 0.2; ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 90 + 14 * Math.sin(S.time * 1.4), 0, 6.283); ctx.stroke();
    }
    S.zones.forEach((z) => {
      ctx.globalAlpha = Math.max(0.12, (z.life / 3.5) * 0.4);
      ctx.fillStyle = "rgba(88,28,135,0.35)";
      ctx.strokeStyle = "#c4b5fd"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 6.283); ctx.fill(); ctx.stroke();
    });
    ctx.restore();
  }

  w.ArenaEngine = {
    isMender: isMender,
    init: init, newMatch: newMatch, draw: draw,
    aim(dt) { aimCamera(dt || 0.016); return S.cam; },
    setSpeed(n) { S.speed = n; },
    pause(on) { S.paused = !!on; },
    iconFor: iconFor,
    assets: () => AT,
    state: () => S,
    suddenMul: (t) => suddenScale(t == null ? S.time : t),
    statusList: statusList,
    moveCost: moveCost,
    lawFor: lawForSeed,
    ringFor(seed) {
      const kind = kindOf(seed);
      return { law: lawForSeed(seed), kind: kind, blurb: KIND_BLURB[kind] };
    },
    /* the countdown before the bell, driven without the renderer (used by the check tool) */
    stepIntro(seconds) {
      const n = Math.max(1, Math.round((seconds || 0.05) / STEP));
      for (let i = 0; i < n; i++) {
        S.countdown -= STEP;
        runCues(INTRO_S - S.countdown);
        if (S.countdown <= 0) { S.phase = "live"; bell(); }
      }
      return S;
    },
    skipIntro() {
      if (S.phase !== "count") return false;
      S.cues.length = 0;                      // the programme is cut, but the bell still rings
      S.countdown = 0.03;
      return true;
    },
    introLength: () => INTRO_S,
    /* The kit probe casts one move with the real resolver. Mana and stun are cleared
       for that swing only — a silenced or empty body is not what the probe is asking. */
    forceCast(e, idx) {
      if (!e || !e.b || e.dead) return false;
      const mv = e.b.moves[idx];
      if (!mv) return false;
      e.stun = 0; e.silence = 0;
      e.mana = Math.max(e.mana, moveCost(mv));
      e.cds[idx] = 0;
      return castMove(e, mv, idx);
    },
    stepHeadless(seconds) {
      const n = Math.round(seconds / STEP);
      for (let i = 0; i < n && !S.over; i++) step(STEP);
      return S;
    },
    brain: () => w.LYGO_BRAIN,
    law() { return lawById(S.lv && S.lv.realm); },
    /* a headless battle: step the sim without the renderer (used by the check tool) */
    runHeadless(ids, mode, seconds, seed) {
      newMatch(ids, mode, seed);
      S.phase = "live";
      const n = Math.round(seconds / STEP);
      for (let i = 0; i < n && !S.over; i++) step(STEP);
      return S;
    }
  };
})(window);
