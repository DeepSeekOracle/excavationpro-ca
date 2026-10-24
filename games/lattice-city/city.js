/* Lattice City — endless isometric city builder.
   Plain canvas + a small simulation. No framework, no build step.
   Tiles are the 128x128 isometric sprites in assets/tiles/. */
(() => {
  "use strict";

  const TW = 128, TH = 64, HALF_W = TW / 2, HALF_H = TH / 2;
  const GROUND_OFFSET = 63;           // sprite row where the tile diamond starts
  const START_W = 96, START_H = 96;   // 9,216 tiles is the hamlet; expand adds a ring
  const SAVE_KEY = "latticeCity.save.v2";

  function focusOn(gx, gy) {
    const c = document.getElementById("map");
    const p = tileToScreen(gx, gy);
    cam.zoom = 0.95;
    cam.x += c.clientWidth / 2 - (p.x + TW * cam.zoom / 2);
    cam.y += c.clientHeight / 2 - (p.y + TH * cam.zoom / 2 - 40);
  }

  // ---------------------------------------------------------------- sprites
  const SPRITES = {};
  const ROAD = {
    0: "r01_road_straight_ns", 1: "r01_road_straight_ns", 2: "r02_road_straight_ew",
    3: "r08_road_corner_ne", 4: "r01_road_straight_ns", 5: "r01_road_straight_ns",
    6: "r09_road_corner_es", 7: "r04_road_tee_nes", 8: "r02_road_straight_ew",
    9: "r11_road_corner_wn", 10: "r02_road_straight_ew", 11: "r06_road_tee_ewn",
    12: "r10_road_corner_sw", 13: "r05_road_tee_nsw", 14: "r07_road_tee_ews",
    15: "r03_road_cross",
  };
  // zones ------------------------------------------------------------------
  const Z = { NONE: 0, R: 1, C: 2, I: 3 };
  const TERRAIN = { MEADOW: 0, FOREST: 1, SAND: 2, WATER: 3, ROCK: 4 };

  // tools ------------------------------------------------------------------
  const TOOLS = [
    { id: "road", name: "Road", cost: 12, key: "Road", hint: "connect everything" },
    { id: "zoneR", name: "Homes", cost: 24, key: "R zone", hint: "people live here", zone: Z.R },
    { id: "zoneC", name: "Shops", cost: 30, key: "C zone", hint: "jobs + tax", zone: Z.C },
    { id: "zoneI", name: "Works", cost: 34, key: "I zone", hint: "jobs, some smog", zone: Z.I },
    { id: "park", name: "Park", cost: 120, key: "Park", hint: "+ mood", service: "park", unlock: 1 },
    { id: "water", name: "Water mill", cost: 480, key: "Water", hint: "water radius", service: "water" },
    { id: "power", name: "Lattice tower", cost: 850, key: "Power", hint: "power radius", service: "power" },
    { id: "plaza", name: "Plaza", cost: 340, key: "Plaza", hint: "+ land value", service: "plaza", unlock: 2 },
    { id: "school", name: "Library", cost: 900, key: "Library", hint: "+ mood, + value", service: "school", unlock: 3 },
    { id: "monument", name: "Monument", cost: 3200, key: "Monument", hint: "the district remembers", service: "monument", unlock: 4 },
    { id: "bulldoze", name: "Bulldoze", cost: 6, key: "Clear", hint: "remove" },
    { id: "inspect", name: "Inspect", cost: 0, key: "Look", hint: "read a tile" },
  ];
  const SERVICE_SPRITE = {
    park: "d04_oak_tree_park", water: "b05_watermill", power: "b10_wizard_tower",
    plaza: "d01_plaza_fountain", school: "b15_library_scholar", monument: "d08_stone_statue_plaza",
  };
  const SERVICE = {
    park: { radius: 4, mood: 6, value: 4, upkeep: 2 },
    plaza: { radius: 5, mood: 3, value: 12, upkeep: 4 },
    water: { radius: 9, upkeep: 8 },
    power: { radius: 10, upkeep: 14 },
    school: { radius: 8, mood: 8, value: 10, upkeep: 12 },
    monument: { radius: 12, mood: 12, value: 30, upkeep: 20 },
  };
  const LEVELS = { R: [0, "b01_cottage_red", "b02_tudor_inn", "b20_noble_manor"],
                   C: [0, "b12_general_store", "b06_bakery", "b14_town_hall"],
                   I: [0, "b03_blacksmith_forge", "b11_carpenter_sawmill", "b13_barn_silo"] };
  const MILESTONES = [
    { pop: 0, title: "Hamlet", grant: 0, unlock: 0 },
    { pop: 50, title: "Village", grant: 1500, unlock: 1, goal: "Reach 50 people to unlock parks." },
    { pop: 250, title: "Town", grant: 3000, unlock: 2, goal: "Reach 250 people to unlock plazas." },
    { pop: 1000, title: "City", grant: 6000, unlock: 3, goal: "Reach 1,000 people to unlock libraries." },
    { pop: 3000, title: "Metropolis", grant: 12000, unlock: 4, goal: "Reach 3,000 people to unlock monuments." },
  ];

  // ---------------------------------------------------------------- state
  const W = {
    w: START_W, h: START_H, seed: 1,
    terrain: null, road: null, zone: null, bldg: null, level: null,
    svc: null,          // service id per tile (string|null)
    powerOn: null, waterOn: null, value: null,
    owned: null,        // expanded land
    day: 0, hour: 7, cash: 20000, pop: 0, jobs: 0, mood: 60,
    demand: { r: 0.6, c: 0.35, i: 0.25 },
    taxRate: 0.09,
    speed: 1, muted: false, tool: "road", unlocked: 0,
    events: [], peds: [], cars: [], growQueue: [],
  };
  let cam = { x: 0, y: 0, zoom: 1 };

  // ---------------------------------------------------------------- helpers
  const idx = (x, y) => y * W.w + x;
  const inMap = (x, y) => x >= 0 && y >= 0 && x < W.w && y < W.h;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const el = (id) => document.getElementById(id);

  function noiseSeed(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function valueNoise(w, h, scale, seed) {
    const r = noiseSeed(seed);
    const gw = Math.ceil(w / scale) + 2, gh = Math.ceil(h / scale) + 2;
    const grid = new Float32Array(gw * gh);
    for (let i = 0; i < grid.length; i++) grid[i] = r();
    const out = new Float32Array(w * h);
    const smooth = (t) => t * t * (3 - 2 * t);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const gx = x / scale, gy = y / scale;
        const x0 = Math.floor(gx), y0 = Math.floor(gy);
        const fx = smooth(gx - x0), fy = smooth(gy - y0);
        const a = grid[y0 * gw + x0], b = grid[y0 * gw + x0 + 1];
        const c = grid[(y0 + 1) * gw + x0], d = grid[(y0 + 1) * gw + x0 + 1];
        out[y * w + x] = (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
      }
    }
    return out;
  }

  function allocWorld(w, h) {
    const n = w * h;
    W.w = w; W.h = h;
    W.terrain = new Uint8Array(n);
    W.road = new Uint8Array(n);
    W.zone = new Uint8Array(n);
    W.bldg = new Array(n).fill(null);
    W.level = new Uint8Array(n);
    W.svc = new Array(n).fill(null);
    W.powerOn = new Uint8Array(n);
    W.waterOn = new Uint8Array(n);
    W.value = new Uint8Array(n);
    W.owned = new Uint8Array(n).fill(1);
  }

  function plantHamlet(cx, cy) {
    // a short street, a few homes, one shop: the district exists before you do
    const roadY = cy;
    for (let x = cx - 6; x <= cx + 6; x++) {
      if (!inMap(x, roadY)) continue;
      const i = idx(x, roadY);
      if (W.terrain[i] === TERRAIN.WATER) continue;
      W.road[i] = 1; W.zone[i] = 0; W.bldg[i] = null;
    }
    const place = (x, y, zone, lvl) => {
      if (!inMap(x, y)) return;
      const i = idx(x, y);
      if (W.terrain[i] === TERRAIN.WATER || W.road[i]) return;
      W.zone[i] = zone; W.level[i] = lvl;
      W.bldg[i] = LEVELS[zone === Z.R ? "R" : zone === Z.C ? "C" : "I"][lvl];
    };
    for (let x = cx - 4; x <= cx - 2; x++) { place(x, roadY - 1, Z.R, 1); place(x, roadY + 1, Z.R, 1); }
    place(cx + 1, roadY - 1, Z.C, 1);
    place(cx + 2, roadY + 1, Z.I, 1);
    place(cx + 5, roadY - 1, Z.R, 1);
    for (let x = cx - 6; x <= cx + 6; x++) {
      const i = idx(x, roadY);
      if (W.terrain[i] !== TERRAIN.WATER) W.road[i] = 1;
    }
  }

  function findOpenSpot() {
    const cxm = Math.floor(W.w / 2), cym = Math.floor(W.h / 2);
    let best = { x: cxm, y: cym, score: -1 };
    for (let y = 8; y < W.h - 8; y += 3) {
      for (let x = 8; x < W.w - 8; x += 3) {
        let water = 0, forest = 0;
        for (let dy = -4; dy <= 4; dy++) for (let dx = -8; dx <= 8; dx++) {
          const t = W.terrain[idx(x + dx, y + dy)];
          if (t === TERRAIN.WATER) water++;
          if (t === TERRAIN.FOREST) forest++;
        }
        const score = 200 - water * 6 - forest * 0.4 - (Math.abs(x - cxm) + Math.abs(y - cym)) * 0.6;
        if (score > best.score) best = { x, y, score };
      }
    }
    return best;
  }

  function generate(seed) {
    W.seed = seed || Math.floor(Math.random() * 1e9);
    allocWorld(START_W, START_H);
    const hgt = valueNoise(W.w, W.h, 14, W.seed);
    const wet = valueNoise(W.w, W.h, 26, W.seed + 77);
    const for1 = valueNoise(W.w, W.h, 9, W.seed + 991);
    // thresholds come from the map's own distribution: a valley should be mostly
    // meadow, with water and rock as features, not as half the map
    const sample = [];
    for (let i = 0; i < hgt.length; i += 7) sample.push(hgt[i]);
    sample.sort((a, b) => a - b);
    const q = (f) => sample[Math.min(sample.length - 1, Math.floor(sample.length * f))];
    const qWater = q(0.10), qSand = q(0.14), qRock = q(0.93), qForest = q(0.62);
    for (let y = 0; y < W.h; y++) {
      for (let x = 0; x < W.w; x++) {
        const i = idx(x, y);
        const edge = Math.min(x, y, W.w - 1 - x, W.h - 1 - y) / 8;
        const h = hgt[i] + (edge > 1 ? 0 : -0.35);
        let t = TERRAIN.MEADOW;
        if (h < qWater) t = TERRAIN.WATER;
        else if (h < qSand) t = TERRAIN.SAND;
        else if (h > qRock) t = TERRAIN.ROCK;
        else if (for1[i] > qForest) t = TERRAIN.FOREST;
        W.terrain[i] = t;
      }
    }
    // a river-ish vein so water is useful and pretty
    let rx = Math.floor(W.w * 0.62);
    for (let y = 0; y < W.h; y++) {
      rx += Math.round(rnd(-1.2, 1.2));
      rx = clamp(rx, 6, W.w - 6);
      for (let dx = -1; dx <= 1; dx++) {
        const x = clamp(rx + dx, 0, W.w - 1);
        W.terrain[idx(x, y)] = dx === 0 ? TERRAIN.WATER : (Math.random() < 0.6 ? TERRAIN.SAND : TERRAIN.MEADOW);
      }
    }
    W.day = 0; W.hour = 7; W.cash = 20000; W.pop = 0; W.jobs = 0; W.mood = 60;
    W.demand = { r: 0.6, c: 0.35, i: 0.25 };
    W.unlocked = 0; W.events = []; W.peds = []; W.cars = []; W.growQueue = [];
    const spot = findOpenSpot();
    plantHamlet(spot.x, spot.y);
    recomputeServices();
    recalcTotals();
    refreshZoneList();
    countCaps();
    updateDemand();
    focusOn(spot.x, spot.y);
    toast("New district · " + W.w + "×" + W.h + " tiles");
  }

  function centerCamera() {
    const c = document.getElementById("map");
    const cx = (W.w - W.h) * HALF_W / 2, cy = (W.w + W.h) * HALF_H / 2;
    cam.zoom = 0.85;
    cam.x = c.clientWidth / 2 - cx * cam.zoom;
    cam.y = c.clientHeight / 2 - cy * cam.zoom;
  }

  function focusOn(gx, gy) {
    const c = document.getElementById("map");
    const p = tileToScreen(gx, gy);
    cam.zoom = 0.95;
    cam.x += c.clientWidth / 2 - (p.x + TW * cam.zoom / 2);
    cam.y += c.clientHeight / 2 - (p.y + TH * cam.zoom / 2 - 40);
  }

  // ---------------------------------------------------------------- sprites
  function loadSprites() {
    return fetch("assets/tiles/manifest.json").then((r) => r.json()).then((man) => {
      const jobs = [];
      Object.keys(man).forEach((key) => {
        if (key === "unknown") return;
        const file = man[key][0];
        const img = new Image();
        img.src = "assets/tiles/" + file;
        SPRITES[key] = img;
        jobs.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
      });
      const unknown = (man.unknown || []).slice(0, 80);
      unknown.forEach((file, i) => {
        const img = new Image(); img.src = "assets/tiles/" + file;
        SPRITES["extra" + i] = img; jobs.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
      });
      return Promise.all(jobs);
    });
  }

  // ---------------------------------------------------------------- services
  function recomputeServices() {
    W.powerOn.fill(0); W.waterOn.fill(0);
    W.value.fill(0);
    const powerTiles = [], waterTiles = [];
    for (let i = 0; i < W.svc.length; i++) {
      const s = W.svc[i];
      if (!s) continue;
      if (s === "power") powerTiles.push(i);
      if (s === "water") waterTiles.push(i);
    }
    const paint = (tiles, arr, radius) => {
      tiles.forEach((i) => {
        const tx = i % W.w, ty = Math.floor(i / W.w);
        const r = SERVICE[W.svc[i]] ? SERVICE[W.svc[i]].radius : radius;
        for (let y = Math.max(0, ty - r); y <= Math.min(W.h - 1, ty + r); y++) {
          for (let x = Math.max(0, tx - r); x <= Math.min(W.w - 1, tx + r); x++) {
            const dx = x - tx, dy = y - ty;
            if (dx * dx + dy * dy <= r * r) arr[idx(x, y)] = 1;
          }
        }
      });
    };
    paint(powerTiles, W.powerOn, 10);
    paint(waterTiles, W.waterOn, 9);

    // land value + mood from amenity services
    const amen = [];
    for (let i = 0; i < W.svc.length; i++) if (W.svc[i] && SERVICE[W.svc[i]]) amen.push(i);
    amen.forEach((i) => {
      const s = SERVICE[W.svc[i]];
      if (!s.value && !s.mood) return;
      const tx = i % W.w, ty = Math.floor(i / W.w);
      for (let y = Math.max(0, ty - s.radius); y <= Math.min(W.h - 1, ty + s.radius); y++) {
        for (let x = Math.max(0, tx - s.radius); x <= Math.min(W.w - 1, tx + s.radius); x++) {
          const dx = x - tx, dy = y - ty;
          const d2 = dx * dx + dy * dy;
          if (d2 <= s.radius * s.radius) {
            const fall = 1 - Math.sqrt(d2) / s.radius;
            const j = idx(x, y);
            W.value[j] = clamp(W.value[j] + Math.round((s.value || 0) * (0.5 + fall)), 0, 255);
          }
        }
      }
    });
  }

  // ---------------------------------------------------------------- camera math
  function tileToScreen(gx, gy) {
    return {
      x: ((gx - gy) * HALF_W) * cam.zoom + cam.x,
      y: ((gx + gy) * HALF_H) * cam.zoom + cam.y,
    };
  }
  function screenToTile(sx, sy) {
    // tileToScreen gives the top-left of a tile's bounding box, so step in by the
    // half tile to reach the diamond centre before inverting.
    const x = (sx - cam.x) / cam.zoom - HALF_W;
    const y = (sy - cam.y) / cam.zoom - HALF_H;
    const gx = Math.round((x / HALF_W + y / HALF_H) / 2);
    const gy = Math.round((y / HALF_H - x / HALF_W) / 2);
    return { gx, gy };
  }

  // ---------------------------------------------------------------- reachability
  function roadMask(x, y) {
    let m = 0;
    if (hasRoad(x, y - 1)) m |= 1;
    if (hasRoad(x + 1, y)) m |= 2;
    if (hasRoad(x, y + 1)) m |= 4;
    if (hasRoad(x - 1, y)) m |= 8;
    return m;
  }
  function hasRoad(x, y) { return inMap(x, y) && W.road[idx(x, y)] === 1; }
  function hasRoadNear(x, y) { return hasRoad(x, y) || hasRoad(x + 1, y) || hasRoad(x - 1, y) || hasRoad(x, y + 1) || hasRoad(x, y - 1); }

  // ---------------------------------------------------------------- tools
  function toolById(id) { return TOOLS.find((t) => t.id === id) || TOOLS[0]; }

  function canPaint(t, x, y) {
    if (!inMap(x, y)) return false;
    const i = idx(x, y);
    if (!W.owned[i]) return false;
    const terr = W.terrain[i];
    if (t.id === "road") return terr !== TERRAIN.WATER;
    if (t.zone) return terr !== TERRAIN.WATER && !W.road[i] && !W.bldg[i] && !W.svc[i];
    if (t.service) return terr !== TERRAIN.WATER && !W.road[i] && !W.zone[i] && !W.svc[i] && !W.bldg[i];
    if (t.id === "bulldoze") return true;
    return true;
  }

  function paintLine(t, from, to) {
    if (!from) { paint(t, to.gx, to.gy); return; }
    let x = from.gx, y = from.gy;
    const tx = to.gx, ty = to.gy;
    let guard = 0;
    while ((x !== tx || y !== ty) && guard++ < 400) {
      if (x !== tx) x += Math.sign(tx - x);
      else if (y !== ty) y += Math.sign(ty - y);
      else break;
      paint(t, x, y);
    }
  }

  function paint(t, x, y) {
    if (!canPaint(t, x, y)) return false;
    const i = idx(x, y);
    if (t.id === "inspect") { inspect(x, y); return true; }
    const cost = t.cost;
    if (W.cash < cost) { deny("Not enough funds for " + t.name.toLowerCase()); return false; }
    let did = false;
    if (t.id === "bulldoze") {
      const had = W.road[i] || W.zone[i] || W.bldg[i] || W.svc[i];
      if (!had) return false;
      const wasSvc = W.svc[i];
      W.road[i] = 0; W.zone[i] = 0; W.bldg[i] = null; W.level[i] = 0; W.svc[i] = null; W.zoneDirty = true;
      if (wasSvc) recomputeServices();
      recalcTotals();
      sfx("clear");
      did = true;
    } else if (t.id === "road") {
      if (W.road[i] === 1) return false;
      W.road[i] = 1; W.zone[i] = 0; W.bldg[i] = null; W.level[i] = 0;
      sfx("place");
      did = true;
    } else if (t.zone) {
      if (W.zone[i] === t.zone) return false;
      W.zone[i] = t.zone;
      W.zoneDirty = true;
      sfx("place");
      did = true;
    } else if (t.service) {
      if (W.svc[i]) return false;
      W.svc[i] = t.service;
      recomputeServices();
      sfx("place");
      did = true;
    }
    if (did) { W.cash -= cost; refreshHud(); }
    return did;
  }

  function roadSprite(x, y) {
    const m = roadMask(x, y);
    return ROAD[m] || "r02_road_straight_ew";
  }

  // ---------------------------------------------------------------- sim
  function refreshZoneList() {
    const list = [];
    for (let i = 0; i < W.zone.length; i++) if (W.zone[i]) list.push(i);
    W.zoneList = list;
  }

  function capacityOf(i) {
    const z = W.zone[i], lv = W.level[i];
    if (!z || !lv) return 0;
    return (z === Z.R ? 4 : 6) * lv;
  }

  function recalcTotals() {
    let pop = 0, jobs = 0, roads = 0, svcUp = 0;
    for (let i = 0; i < W.road.length; i++) {
      if (W.road[i]) roads++;
      if (W.svc[i] && SERVICE[W.svc[i]]) svcUp += SERVICE[W.svc[i]].upkeep || 0;
      const z = W.zone[i];
      if (!z || !W.level[i]) continue;
      if (z === Z.R) pop += capacityOf(i);
      else jobs += capacityOf(i);
    }
    W.pop = pop; W.jobs = jobs;
    W.upkeep = roads * 0.55 + svcUp;
    W.income = pop * 0.85 + jobs * 0.50;
  }

  function updateDemand() {
    const homes = Math.max(1, W.pop), jobs = W.jobs;
    const unemp = clamp((W.pop - jobs) / homes, 0, 1);
    const spare = clamp((jobs - W.pop * 0.8) / Math.max(30, jobs), -0.4, 1);
    const shopNeed = clamp((W.pop * 0.45 - W.shopCap) / Math.max(20, W.pop * 0.45), -0.6, 1);
    const workNeed = clamp((W.pop * 0.35 + jobs * 0.15 - W.indCap) / Math.max(20, W.pop * 0.35), -0.6, 1);
    const moodFactor = W.mood < 40 ? -0.3 : (W.mood > 65 ? 0.2 : 0);
    W.demand.r = clamp(0.42 + spare * 0.62 + moodFactor, 0, 1);
    W.demand.c = clamp(0.25 + shopNeed * 0.8, 0, 1);
    W.demand.i = clamp(0.20 + workNeed * 0.8, 0, 1);
  }

  function countCaps() {
    let shopCap = 0, indCap = 0, green = 0, smog = 0;
    for (let i = 0; i < W.zone.length; i++) {
      const z = W.zone[i]; if (!z || !W.level[i]) continue;
      if (z === Z.C) shopCap += capacityOf(i);
      if (z === Z.I) indCap += capacityOf(i);
      if (z === Z.R) green += W.value[i] / 255;
      if (z === Z.I) smog++;
    }
    W.shopCap = shopCap; W.indCap = indCap;
    W.greenFrac = green / Math.max(1, W.zone.length);
    W.smog = smog;
  }

  function tick() {
    W.day++;
    if (!W.zoneList || W.zoneDirty) { refreshZoneList(); W.zoneDirty = false; }
    W.hour = (W.hour + 6) % 24;
    countCaps();
    updateDemand();

    // growth: try a handful of zoned tiles each day
    const list = W.zoneList || [];
    const tries = Math.min(64, Math.max(8, Math.ceil(list.length * 0.8)));
    for (let k = 0; k < tries && list.length; k++) {
      const i = list[Math.floor(Math.random() * list.length)];
      const z = W.zone[i];
      if (!z) continue;
      const x = i % W.w, y = Math.floor(i / W.w);
      if (!hasRoadNear(x, y)) continue;
      const powered = W.powerOn[i] === 1, watered = W.waterOn[i] === 1;
      const dem = z === Z.R ? W.demand.r : z === Z.C ? W.demand.c : W.demand.i;
      const lv = W.level[i];
      const value = W.value[i] / 255;
      // a first building only needs a road; the second storey needs power and the
      // third needs water too, so the utilities arrive as the town outgrows itself
      const canUp = lv === 0 ? true : lv === 1 ? powered : (powered && watered);
      if (lv > 0 && !canUp && Math.random() < 0.02) {
        W.level[i] = lv - 1;
        W.bldg[i] = lv - 1 ? LEVELS[z === Z.R ? "R" : z === Z.C ? "C" : "I"][lv - 1] : null;
        continue;
      }
      if (dem > 0.3 && lv < 3 && canUp && Math.random() < dem * (0.18 + value * 0.2)) {
        W.level[i] = lv + 1;
        W.bldg[i] = LEVELS[z === Z.R ? "R" : z === Z.C ? "C" : "I"][W.level[i]];
        sfx("grow");
        if (W.level[i] === 3) log("A three-storey " + (z === Z.R ? "house" : z === Z.C ? "shop" : "workshop") + " opened at " + x + "," + y + ".");
      } else if (dem < 0.08 && lv > 0 && Math.random() < 0.025) {
        W.level[i] = lv - 1;
        W.bldg[i] = lv - 1 ? LEVELS[z === Z.R ? "R" : z === Z.C ? "C" : "I"][lv - 1] : null;
      }
    }

    recalcTotals();
    updateDemand();
    W.cash += W.income - W.upkeep;
    const unemployment = clamp((W.pop - W.jobs) / Math.max(1, W.pop), 0, 1);
    let mood = 64 + Math.min(18, W.parks * 2.2) - unemployment * 17 - clamp(W.smog / 60, 0, 1) * 12 + Math.min(10, W.valueAvg / 25);
    W.mood = clamp(W.mood + (mood - W.mood) * 0.12, 0, 100);
    if (W.cash < -2500) { toast("The treasury is empty. Bulldoze something or raise taxes."); W.cash = -2500; }
    checkMilestones();
    updatePeds();
    if (W.day % 7 === 0) log(weekLine());
    refreshHud();
  }

  function weekLine() {
    const lines = [
      "Population " + W.pop + " · jobs " + W.jobs + " · mood " + Math.round(W.mood) + "%.",
      "The district holds " + W.pop + " people and " + Math.round(W.cash).toLocaleString() + " dollars.",
      "Power covers " + Math.round(W.powerFrac * 100) + "% of the built land.",
    ];
    return lines[W.day % lines.length];
  }

  function checkMilestones() {
    const m = MILESTONES[W.unlocked + 1];
    if (m && W.pop >= m.pop) {
      W.unlocked++;
      W.cash += m.grant;
      toast("MILESTONE · " + MILESTONES[W.unlocked].title + " · " + money(m.grant) + " grant");
      sfx("milestone");
      log("The district is now a " + MILESTONES[W.unlocked].title + ".");
      renderTools();
    }
  }

  // ---------------------------------------------------------------- people
  function roadTiles() {
    const out = [];
    for (let i = 0; i < W.road.length; i++) if (W.road[i]) out.push(i);
    return out;
  }
  function updatePeds() {
    const roads = roadTiles();
    if (!roads.length) { W.peds = []; W.cars = []; return; }
    const wantPeds = clamp(Math.round(W.pop / 3.5), 0, 150);
    const wantCars = clamp(Math.round(W.pop / 12), 0, 34);
    while (W.peds.length < wantPeds) {
      const i = roads[Math.floor(Math.random() * roads.length)];
      W.peds.push({ x: i % W.w, y: Math.floor(i / W.w), t: Math.random(), dir: Math.floor(Math.random() * 4), hue: Math.floor(rnd(0, 360)), speed: rnd(0.35, 0.9) });
    }
    W.peds.length = wantPeds;
    while (W.cars.length < wantCars) {
      const i = roads[Math.floor(Math.random() * roads.length)];
      W.cars.push({ x: i % W.w, y: Math.floor(i / W.w), t: 0, dir: Math.floor(Math.random() * 4), speed: rnd(0.7, 1.5), hue: Math.floor(rnd(0, 360)) });
    }
    W.cars.length = wantCars;
  }
  function stepWalkers(list, dt) {
    for (const p of list) {
      p.t += dt * p.speed;
      if (p.t < 1) continue;
      p.t = 0;
      const opts = [[0, -1], [1, 0], [0, 1], [-1, 0]].filter(([dx, dy]) => hasRoad(p.x + dx, p.y + dy));
      if (!opts.length) { continue; }
      const [dx, dy] = opts[Math.floor(Math.random() * opts.length)];
      p.x += dx; p.y += dy; p.dir = dx === 1 ? 0 : dy === 1 ? 1 : dx === -1 ? 2 : 3;
    }
  }

  // ---------------------------------------------------------------- render
  const canvas = document.getElementById("map");
  const ctx = canvas.getContext("2d");
  let dpr = 1;
  let last = 0, acc = 0;
  let hover = { x: -1, y: -1 };
  let drag = null;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  const GROUND_COLORS = {
    0: ["#3f6b34", "#426f37"],       // meadow
    1: ["#2f5530", "#33592f"],       // forest floor
    2: ["#c9b26a", "#cdb672"],       // sand
    3: ["#2f5f86", "#335f86"],       // water
    4: ["#6b6a63", "#6f6e66"],       // rock
  };
  function hash2(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }

  function drawDiamond(cx, cy, w, h, fill) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - h / 2);
    ctx.lineTo(cx + w / 2, cy);
    ctx.lineTo(cx, cy + h / 2);
    ctx.lineTo(cx - w / 2, cy);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function visibleRange() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const corners = [screenToTile(0, 0), screenToTile(w, 0), screenToTile(0, h), screenToTile(w, h)];
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    corners.forEach((c) => { minX = Math.min(minX, c.gx); maxX = Math.max(maxX, c.gx); minY = Math.min(minY, c.gy); maxY = Math.max(maxY, c.gy); });
    // buildings rise above their tile, so pad the top
    return { x0: clamp(minX - 2, 0, W.w - 1), x1: clamp(maxX + 2, 0, W.w - 1), y0: clamp(minY - 2, 0, W.h - 1), y1: clamp(maxY + 3, 0, W.h - 1) };
  }

  function render(ts) {
    const dt = Math.min(0.1, (ts - last) / 1000 || 0.016);
    last = ts;
    if (W.speed > 0) {
      acc += dt * W.speed;
      const dayLen = 2.6;                     // seconds per day at 1x
      while (acc > dayLen) { acc -= dayLen; tick(); }
      W.hour = (W.hour + dt * W.speed * (24 / dayLen)) % 24;
    }
    stepWalkers(W.peds, dt * (W.speed || 1));
    stepWalkers(W.cars, dt * (W.speed || 1) * 1.6);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = "#0a0908";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const r = visibleRange();
    const zw = TW * cam.zoom, zh = TH * cam.zoom;

    // ground pass
    for (let gy = r.y0; gy <= r.y1; gy++) {
      for (let gx = r.x0; gx <= r.x1; gx++) {
        const i = idx(gx, gy);
        const s = tileToScreen(gx, gy);
        const t = W.terrain[i];
        const pal = GROUND_COLORS[t] || GROUND_COLORS[0];
        const shade = pal[hash2(gx, gy) > 0.55 ? 1 : 0];
        const cx0 = Math.round(s.x + zw / 2), cy0 = Math.round(s.y + zh / 2);
        drawDiamond(cx0, cy0, zw + 2, zh + 2, shade);
        // a hairline of the same colour closes the pinholes where four tiles meet
        ctx.strokeStyle = shade; ctx.lineWidth = 1.2; ctx.stroke();
        if (t === TERRAIN.WATER) {
          const a = 0.10 + 0.06 * Math.sin(performance.now() / 900 + gx * 0.6 + gy * 0.4);
          ctx.globalAlpha = a * 0.9;
          drawDiamond(s.x + zw / 2, s.y + zh / 2, zw * 0.86, zh * 0.86, "#9fd8ff");
          ctx.globalAlpha = 1;
        } else if (!W.owned[i]) {
          ctx.globalAlpha = 0.55;
          drawDiamond(s.x + zw / 2, s.y + zh / 2, zw, zh, "#141210");
          ctx.globalAlpha = 1;
        }
        const tuft = hash2(gx + 3, gy + 17);
        if (tuft > 0.62 && t !== TERRAIN.WATER) {
          const n = tuft > 0.9 ? 3 : 2;
          ctx.fillStyle = t === TERRAIN.SAND ? "rgba(150,125,70,.35)" : (t === TERRAIN.ROCK ? "rgba(40,40,38,.35)" : "rgba(24,58,26,.32)");
          for (let q = 0; q < n; q++) {
            const ax = cx0 + (hash2(gx + q, gy + 31) - 0.5) * zw * 0.5;
            const ay = cy0 + (hash2(gx + 13, gy + q) - 0.5) * zh * 0.5;
            ctx.fillRect(ax, ay, Math.max(1.5, 2.2 * cam.zoom), Math.max(1.5, 2.2 * cam.zoom));
          }
        }
        if (W.zone[i] && !W.bldg[i]) {
          const zc = W.zone[i] === Z.R ? "rgba(111,191,115,.42)" : W.zone[i] === Z.C ? "rgba(90,169,230,.40)" : "rgba(242,193,78,.38)";
          drawDiamond(s.x + zw / 2, s.y + zh / 2, zw * 0.9, zh * 0.9, zc);
        }
      }
    }

    // sprite pass, painter order
    for (let sum = r.x0 + r.y0; sum <= r.x1 + r.y1; sum++) {
      const xStart = Math.max(r.x0, sum - r.y1), xEnd = Math.min(r.x1, sum - r.y0);
      for (let gx = xStart; gx <= xEnd; gx++) {
        const gy = sum - gx;
        if (gy < r.y0 || gy > r.y1) continue;
        const i = idx(gx, gy);
        const s = tileToScreen(gx, gy);
        const drawW = TW * cam.zoom, drawH = TW * cam.zoom;
        let key = null;
        if (W.road[i]) key = roadSprite(gx, gy);
        else if (W.bldg[i]) key = W.bldg[i];
        else if (W.svc[i]) key = SERVICE_SPRITE[W.svc[i]];
        else if (W.terrain[i] === TERRAIN.FOREST && hash2(gx, gy) > 0.68) key = hash2(gx + 7, gy + 3) > 0.5 ? "d05_pine_grove" : "d04_oak_tree_park";
        else if (W.terrain[i] === TERRAIN.ROCK && hash2(gx, gy) > 0.82) key = "s11_meadow_rock_outcrop_v2";
        else if (W.terrain[i] === TERRAIN.MEADOW && hash2(gx + 11, gy + 5) > 0.955) key = "s10_meadow_wildflowers_v1";
        else if (W.terrain[i] === TERRAIN.MEADOW && hash2(gx + 23, gy + 41) > 0.935) key = hash2(gx, gy) > 0.5 ? "d05_pine_grove" : "d04_oak_tree_park";
        else if (W.terrain[i] === TERRAIN.SAND && hash2(gx + 2, gy + 9) > 0.93) key = "d12_meadow_wildflowers";
        if (key && SPRITES[key] && SPRITES[key].complete) {
          ctx.drawImage(SPRITES[key], s.x, s.y - GROUND_OFFSET * cam.zoom, drawW, drawH);
        }
        if (W.bldg[i] && !W.powerOn[i]) {
          ctx.globalAlpha = 0.22; drawDiamond(s.x + zw / 2, s.y + zh / 2, zw * 0.5, zh * 0.5, "#ffdf6b"); ctx.globalAlpha = 1;
        }
      }
    }

    // walkers
    for (const p of W.peds) {
      const a = tileToScreen(p.x, p.y), b = tileToScreen(p.x + (p.dir === 0 ? 1 : p.dir === 2 ? -1 : 0), p.y + (p.dir === 1 ? 1 : p.dir === 3 ? -1 : 0));
      const s = { x: a.x + (b.x - a.x) * p.t + zw / 2, y: a.y + (b.y - a.y) * p.t + zh / 2 };
      ctx.fillStyle = "hsl(" + p.hue + ",60%,62%)";
      const h = Math.max(2.5, 4.2 * cam.zoom);
      ctx.fillRect(s.x - h / 3, s.y - h, h * 0.66, h);
    }
    for (const c of W.cars) {
      const a = tileToScreen(c.x, c.y), b = tileToScreen(c.x + (c.dir === 0 ? 1 : c.dir === 2 ? -1 : 0), c.y + (c.dir === 1 ? 1 : c.dir === 3 ? -1 : 0));
      const s = { x: a.x + (b.x - a.x) * c.t + zw / 2, y: a.y + (b.y - a.y) * c.t + zh / 2 };
      ctx.fillStyle = "hsl(" + c.hue + ",55%,55%)";
      const w = Math.max(3, 7 * cam.zoom), h = Math.max(2, 3.5 * cam.zoom);
      ctx.fillRect(s.x - w / 2, s.y - h, w, h);
    }

    // hover
    if (inMap(hover.x, hover.y)) {
      const s = tileToScreen(hover.x, hover.y);
      const t = toolById(W.tool);
      const ok = canPaint(t, hover.x, hover.y);
      ctx.strokeStyle = ok ? "rgba(242,193,78,.9)" : "rgba(217,105,76,.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x + zw / 2, s.y);
      ctx.lineTo(s.x + zw, s.y + zh / 2);
      ctx.lineTo(s.x + zw / 2, s.y + zh);
      ctx.lineTo(s.x, s.y + zh / 2);
      ctx.closePath();
      ctx.stroke();
    }

    // night tint
    const night = Math.max(0, Math.cos((W.hour / 24) * Math.PI * 2)) * 0.28;
    if (night > 0.01) {
      ctx.fillStyle = "rgba(8,12,28," + night.toFixed(3) + ")";
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }

    requestAnimationFrame(render);
  }

  // ---------------------------------------------------------------- hud
  function refreshHud() {
    el("ui-cash").textContent = money(W.cash);
    el("ui-pop").textContent = W.pop.toLocaleString();
    el("ui-jobs").textContent = W.jobs.toLocaleString();
    el("ui-mood").textContent = Math.round(W.mood) + "%";
    el("ui-date").textContent = "Day " + (W.day + 1) + " · " + String(Math.floor(W.hour)).padStart(2, "0") + ":00";
    el("ui-dem-r").style.width = Math.round(W.demand.r * 100) + "%";
    el("ui-dem-c").style.width = Math.round(W.demand.c * 100) + "%";
    el("ui-dem-i").style.width = Math.round(W.demand.i * 100) + "%";

    let built = 0, powered = 0, watered = 0, vsum = 0, vn = 0, parks = 0;
    for (let i = 0; i < W.zone.length; i++) {
      if (W.zone[i]) { built++; if (W.powerOn[i]) powered++; if (W.waterOn[i]) watered++; }
      if (W.zone[i] === Z.R) { vsum += W.value[i]; vn++; }
      if (W.svc[i] === "park") parks++;
    }
    W.parks = parks;
    W.valueAvg = vn ? vsum / vn : 0;
    W.powerFrac = vn ? powered / Math.max(1, built) : 0;
    const pf = built ? powered / built : 0, wf = built ? watered / built : 0;
    el("ui-power").style.width = Math.round(pf * 100) + "%";
    el("ui-power-t").textContent = Math.round(pf * 100) + "%";
    el("ui-water").style.width = Math.round(wf * 100) + "%";
    el("ui-water-t").textContent = Math.round(wf * 100) + "%";
    el("ui-value").style.width = Math.round((W.valueAvg / 255) * 100) + "%";
    el("ui-value-t").textContent = money(W.valueAvg * 12);
    const next = MILESTONES[W.unlocked + 1];
    el("ui-goal").textContent = next
      ? (next.goal || ("Reach " + next.pop + " people for " + next.title + ".")).replace("Reach", "Reach " + next.pop + " people →")
      : "Metropolis. The district answers to nobody but you.";
    el("ui-expand").textContent = "Expand district · " + money(4000);
    el("ui-expand").disabled = W.cash < 4000;
  }

  function log(text) {
    const t = el("ticker-text");
    t.innerHTML = text;
  }
  let toastT = 0;
  function toast(text) {
    const n = el("toast");
    n.textContent = text;
    n.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(() => n.classList.remove("on"), 2600);
  }
  function deny(text) { toast(text); sfx("deny"); }

  // ---------------------------------------------------------------- sound
  let audio = null, audioOn = false, ambient = null;
  function initAudio() {
    if (audio) return audio;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio = new AC();
    return audio;
  }
  function startAmbient() {
    const ac = initAudio(); if (!ac) return;
    if (ambient) return;
    const master = ac.createGain(); master.gain.value = 0.05; master.connect(ac.destination);
    const o1 = ac.createOscillator(); o1.type = "sine"; o1.frequency.value = 110;
    const o2 = ac.createOscillator(); o2.type = "sine"; o2.frequency.value = 164.8;
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.08;
    const lfoGain = ac.createGain(); lfoGain.gain.value = 30;
    lfo.connect(lfoGain); lfoGain.connect(o2.frequency);
    o1.connect(master); o2.connect(master);
    o1.start(); o2.start(); lfo.start();
    ambient = { master, o1, o2, lfo };
  }
  function sfx(kind) {
    if (!audioOn) return;
    const ac = initAudio(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    const now = ac.currentTime;
    const map = { place: [440, 0.05, 0.05], clear: [180, 0.09, 0.06], grow: [660, 0.05, 0.07], deny: [110, 0.12, 0.06], milestone: [880, 0.18, 0.12] };
    const [f, dur, vol] = map[kind] || map.place;
    o.type = kind === "deny" ? "square" : "triangle";
    o.frequency.value = f;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(now); o.stop(now + dur + 0.02);
  }

  // ---------------------------------------------------------------- tools ui
  function renderTools() {
    const box = el("tools");
    box.innerHTML = "";
    TOOLS.forEach((t) => {
      const locked = t.unlock !== undefined && W.unlocked < t.unlock;
      const b = document.createElement("button");
      b.className = "tool" + (W.tool === t.id ? " on" : "") + (locked ? " locked" : "");
      b.innerHTML = "<b>" + t.name + "</b><span>" + (locked ? "milestone" : money(t.cost) + " · " + t.hint) + "</span>";
      b.onclick = () => {
        if (locked) { toast("Locked: reach the next milestone to build " + t.name.toLowerCase() + "."); return; }
        W.tool = t.id; renderTools();
      };
      box.appendChild(b);
    });
  }

  // ---------------------------------------------------------------- inspect
  function inspect(x, y) {
    const i = idx(x, y);
    const zoneName = { 0: "unzoned", 1: "homes", 2: "shops", 3: "works" }[W.zone[i]];
    const rows = [
      ["Tile", x + ", " + y],
      ["Ground", ["meadow", "forest", "sand", "water", "rock"][W.terrain[i]]],
      ["Road", W.road[i] ? "yes" : "no"],
      ["Zone", zoneName],
      ["Building", W.bldg[i] ? W.bldg[i].replace(/^b\d+_/, "").replace(/_/g, " ") + " (L" + W.level[i] + ")" : "none"],
      ["Power", W.powerOn[i] ? "on" : "off"],
      ["Water", W.waterOn[i] ? "on" : "off"],
      ["Land value", String(W.value[i])],
      ["Service", W.svc[i] || "none"],
    ];
    el("ins-title").textContent = "Tile " + x + ", " + y;
    el("ins-body").innerHTML = rows.map(([k, v]) => '<div class="kv"><span>' + k + "</span><b>" + v + "</b></div>").join("");
    el("inspector").classList.remove("hidden");
  }

  // ---------------------------------------------------------------- input
  function bindInput() {
    let painting = false, panning = false, panStart = null, spaceDown = false, lastTile = null;

    canvas.addEventListener("pointerdown", (e) => {
      if (!audioOn) { audioOn = true; el("ui-sound").classList.remove("off"); startAmbient(); }
      const t = screenToTile(e.offsetX, e.offsetY);
      if (e.button === 1 || e.button === 2 || spaceDown) { panning = true; panStart = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }; canvas.setPointerCapture(e.pointerId); return; }
      painting = true;
      lastTile = t;
      if (W.tool === "inspect") { inspect(t.gx, t.gy); painting = false; return; }
      paint(toolById(W.tool), t.gx, t.gy);
    });
    canvas.addEventListener("pointermove", (e) => {
      const t = screenToTile(e.offsetX, e.offsetY);
      hover = t;
      if (panning && panStart) {
        cam.x = panStart.cx + (e.clientX - panStart.x);
        cam.y = panStart.cy + (e.clientY - panStart.y);
        return;
      }
      if (painting) { paintLine(toolById(W.tool), lastTile, t); lastTile = t; }
    });
    window.addEventListener("pointerup", () => { painting = false; panning = false; panStart = null; lastTile = null; });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const before = screenToTile(e.offsetX, e.offsetY);
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      cam.zoom = clamp(cam.zoom * f, 0.22, 2.4);
      const after = screenToTile(e.offsetX, e.offsetY);
      cam.x += (after.gx - before.gx) * HALF_W * cam.zoom;
      cam.y += (after.gy - before.gy) * HALF_H * cam.zoom;
    }, { passive: false });
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") { spaceDown = true; canvas.style.cursor = "grab"; }
      if (e.key === "Escape") { el("modal").classList.add("hidden"); el("inspector").classList.add("hidden"); }
      if (["1", "2", "3", "4"].includes(e.key)) setSpeed([0, 1, 2, 4][Number(e.key) - 1]);
    });
    window.addEventListener("keyup", (e) => { if (e.code === "Space") { spaceDown = false; canvas.style.cursor = "crosshair"; } });
    window.addEventListener("resize", () => { resize(); });
  }

  function setSpeed(s) {
    W.speed = s;
    [...document.querySelectorAll("#ui-speeds button")].forEach((b) => b.classList.toggle("on", Number(b.dataset.speed) === s));
  }

  // ---------------------------------------------------------------- save / load
  function save() {
    const data = {
      v: 2, w: W.w, h: W.h, seed: W.seed, day: W.day, hour: W.hour, cash: W.cash,
      unlocked: W.unlocked, taxRate: W.taxRate,
      terrain: Array.from(W.terrain), road: Array.from(W.road).map((v) => v ? 1 : 0),
      zone: Array.from(W.zone), level: Array.from(W.level),
      bldg: W.bldg.map((b) => b || 0), svc: W.svc.map((s) => s || 0),
      owned: Array.from(W.owned),
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); toast("District saved"); }
    catch (e) { toast("Could not save: storage full"); }
  }
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (!raw) { toast("No saved district in this browser"); return; }
    try {
      const d = JSON.parse(raw);
      allocWorld(d.w, d.h);
      W.seed = d.seed; W.day = d.day; W.hour = d.hour; W.cash = d.cash; W.unlocked = d.unlocked || 0;
      W.terrain.set(d.terrain); W.road.set(d.road.map((v) => v ? 1 : 0)); W.zone.set(d.zone); W.level.set(d.level);
      W.bldg = d.bldg.map((b) => b || null);
      W.svc = d.svc.map((s) => s || null);
      W.owned.set(d.owned);
      recomputeServices(); refreshZoneList(); recalcTotals(); countCaps(); updateDemand();
      renderTools(); refreshHud(); focusCity();
      toast("District loaded · day " + (W.day + 1));
    } catch (e) { toast("That save could not be read"); }
  }

  function focusCity() {
    let sx = 0, sy = 0, n = 0;
    for (let i = 0; i < W.bldg.length; i++) {
      if (W.bldg[i] || W.road[i]) { sx += i % W.w; sy += Math.floor(i / W.w); n++; }
    }
    if (n) focusOn(Math.round(sx / n), Math.round(sy / n));
    else centerCamera();
  }

  function expand() {
    if (W.cash < 4000) { deny("Expanding costs $4,000"); return; }
    W.cash -= 4000;
    const nw = W.w + 16, nh = W.h + 16;
    const pad = 8;
    const old = { w: W.w, h: W.h, terrain: W.terrain, road: W.road, zone: W.zone, level: W.level, bldg: W.bldg, svc: W.svc, owned: W.owned };
    allocWorld(nw, nh);
    for (let y = 0; y < old.h; y++) {
      for (let x = 0; x < old.w; x++) {
        const i = y * old.w + x, j = idx(x + pad, y + pad);
        W.terrain[j] = old.terrain[i]; W.road[j] = old.road[i]; W.zone[j] = old.zone[i];
        W.level[j] = old.level[i]; W.bldg[j] = old.bldg[i]; W.svc[j] = old.svc[i]; W.owned[j] = old.owned[i];
      }
    }
    for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
      const j = idx(x, y);
      if (W.owned[j]) continue;
      W.owned[j] = 1;
      W.terrain[j] = Math.random() < 0.12 ? TERRAIN.FOREST : (Math.random() < 0.04 ? TERRAIN.WATER : TERRAIN.MEADOW);
    }
    recomputeServices(); refreshHud();
    toast("District expanded to " + W.w + "×" + W.h);
  }

  // ---------------------------------------------------------------- boot
  function modal(title, html) {
    el("modal-title").textContent = title;
    el("modal-body").innerHTML = html;
    el("modal").classList.remove("hidden");
  }

  function bindUi() {
    el("ui-speeds").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      setSpeed(Number(b.dataset.speed));
    });
    el("ui-sound").onclick = () => {
      audioOn = !audioOn;
      el("ui-sound").classList.toggle("off", !audioOn);
      if (audioOn) startAmbient(); else if (ambient) { try { ambient.master.gain.value = 0; } catch (e) {} }
      if (audioOn && ambient) ambient.master.gain.value = 0.05;
    };
    el("ui-help").onclick = () => modal("How to play", [
      "<p>You are the district planner. The city grows on its own; you decide where it is allowed to.</p>",
      "<ul>",
      "<li><b>Road</b> first. Zoned land only grows next to a road.</li>",
      "<li><b>Zone</b> homes, shops and works. Demand bars at the top show what the city wants.</li>",
      "<li><b>Power and water</b> reach a radius around their building. A first house needs only a road; a second storey needs power, a third needs water too.</li>",
      "<li><b>Parks and plazas</b> raise mood and land value; industry lowers mood nearby.</li>",
      "<li><b>Milestones</b> at 50, 250, 1,000 and 3,000 people unlock better tools and pay a grant.</li>",
      "<li><b>Expand district</b> buys another ring of land. The map starts at 96×96 and grows by 16 each time.</li>",
      "</ul>",
      "<p><kbd>1</kbd>–<kbd>4</kbd> speed · <kbd>Space</kbd>+drag or right-drag to pan · wheel to zoom · inspect tool to read a tile.</p>",
    ].join(""));
    el("modal-close").onclick = () => el("modal").classList.add("hidden");
    el("ins-close").onclick = () => el("inspector").classList.add("hidden");
    el("ui-save").onclick = save;
    el("ui-load").onclick = load;
    el("ui-new").onclick = () => {
      if (!confirm("Start a new district? The current one is replaced.")) return;
      generate(Math.floor(Math.random() * 1e9)); renderTools(); refreshHud(); log("A new valley, a new chance.");
    };
    el("ui-expand").onclick = expand;
  }

  function firstRun() {
    modal("Lattice City", [
      "<p>A valley, a budget, and a road that goes nowhere yet.</p>",
      "<p><b>Your first three minutes:</b></p>",
      "<ul>",
      "<li>Pick <b>Road</b> and drag a line across the meadow.</li>",
      "<li>Paint <b>Homes</b> beside the road. People move in on their own once the demand is there.</li>",
      "<li>Add <b>Shops</b> for jobs, then a <b>Park</b> when you can afford mood.</li>",
      "<li>Utilities are <b>Lattice tower</b> (power) and <b>Water mill</b>. Build them when storeys stop appearing.</li>",
      "</ul>",
      "<p>The line at the bottom of the map tells you what the district is doing. Day and night keep moving; you can pause any time.</p>",
    ].join(""));
  }

  // Small QA handle: lets a test (or the console) read the real state.
  window.LC = { W, cam, tick, paint, paintLine, tileToScreen, screenToTile, generate, save, load, setSpeed,
                counts: () => ({
                  road: W.road.reduce((a, v) => a + (v ? 1 : 0), 0),
                  zoneR: W.zone.filter((z) => z === 1).length,
                  zoneC: W.zone.filter((z) => z === 2).length,
                  zoneI: W.zone.filter((z) => z === 3).length,
                  built: W.level.filter((l) => l > 0).length,
                }) };

  loadSprites().then(() => {
    resize();
    bindInput();
    bindUi();
    let hasSave = false;
    try { hasSave = !!localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (hasSave) { load(); }
    else { generate(Math.floor(Math.random() * 1e9)); }
    renderTools();
    refreshHud();
    let seen = false;
    try { seen = localStorage.getItem("latticeCity.seen") === "1"; localStorage.setItem("latticeCity.seen", "1"); } catch (e) {}
    if (!seen) firstRun();
    if (hasSave) log("Welcome back. The district kept going while you were away.");
    requestAnimationFrame(render);
  });
})();
