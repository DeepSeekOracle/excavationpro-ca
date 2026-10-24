/* Lattice City — a regional isometric city builder.
   A world of 160x160 tile regions, up to 3x3 of them (230,400 tiles). Regions
   join wherever their border roads meet, and connected regions share jobs.
   Plain canvas + a small simulation. No framework, no build step. */
(() => {
  "use strict";

  const RS = 160;                 // region size, tiles
  const GW = 4, GH = 4;           // world grid: 640 x 640 tiles when complete
  const WORLD_W = RS * GW, WORLD_H = RS * GH;
  const TW = 128, TH = 64, HALF_W = TW / 2, HALF_H = TH / 2;
  const GROUND_OFFSET = 63;
  const CLAIM_COST = 15000;
  const SAVE_KEY = "latticeCity.save.v3";

  // ---------------------------------------------------------------- art tables
  const SPRITES = {};
  const ROAD = {
    0: "r01_road_straight_ns", 1: "r01_road_straight_ns", 2: "r02_road_straight_ew",
    3: "r08_road_corner_ne", 4: "r01_road_straight_ns", 5: "r01_road_straight_ns",
    6: "r09_road_corner_es", 7: "r04_road_tee_nes", 8: "r02_road_straight_ew",
    9: "r11_road_corner_wn", 10: "r02_road_straight_ew", 11: "r06_road_tee_ewn",
    12: "r10_road_corner_sw", 13: "r05_road_tee_nsw", 14: "r07_road_tee_ews",
    15: "r03_road_cross",
  };
  const Z = { NONE: 0, R: 1, C: 2, I: 3 };
  const TERRAIN = { MEADOW: 0, FOREST: 1, SAND: 2, WATER: 3, ROCK: 4 };

  const BLDG = [null,
    "b01_cottage_red", "b02_tudor_inn", "b20_noble_manor",
    "b12_general_store", "b06_bakery", "b14_town_hall",
    "b03_blacksmith_forge", "b11_carpenter_sawmill", "b13_barn_silo",
  ];
  const BLDG_IDX = { R: [0, 1, 2, 3], C: [0, 4, 5, 6], I: [0, 7, 8, 9] };
  const SVC = [null, "park", "water", "power", "plaza", "school", "monument"];
  const SVC_SPRITE = {
    park: "d04_oak_tree_park", water: "b05_watermill", power: "b10_wizard_tower",
    plaza: "d01_plaza_fountain", school: "b15_library_scholar", monument: "d08_stone_statue_plaza",
  };
  const SVC_RULE = {
    park: { radius: 4, value: 4, upkeep: 2 },
    plaza: { radius: 5, value: 12, upkeep: 4 },
    water: { radius: 9, upkeep: 8 },
    power: { radius: 10, upkeep: 14 },
    school: { radius: 8, value: 10, upkeep: 12 },
    monument: { radius: 12, value: 30, upkeep: 20 },
  };

  const TOOLS = [
    { id: "road", name: "Road", cost: 12, hint: "connect everything" },
    { id: "zoneR", name: "Homes", cost: 24, hint: "people live here", zone: Z.R },
    { id: "zoneC", name: "Shops", cost: 30, hint: "jobs + tax", zone: Z.C },
    { id: "zoneI", name: "Works", cost: 34, hint: "jobs, some smog", zone: Z.I },
    { id: "park", name: "Park", cost: 120, hint: "+ land value", service: "park", unlock: 1 },
    { id: "water", name: "Water mill", cost: 480, hint: "water radius", service: "water" },
    { id: "power", name: "Lattice tower", cost: 850, hint: "power radius", service: "power" },
    { id: "plaza", name: "Plaza", cost: 340, hint: "big value", service: "plaza", unlock: 2 },
    { id: "school", name: "Library", cost: 900, hint: "value + mood", service: "school", unlock: 3 },
    { id: "monument", name: "Monument", cost: 3200, hint: "the world remembers", service: "monument", unlock: 4 },
    { id: "bulldoze", name: "Bulldoze", cost: 6, hint: "remove" },
    { id: "inspect", name: "Inspect", cost: 0, hint: "read a tile" },
  ];
  const MILESTONES = [
    { pop: 0, title: "Hamlet", grant: 0 },
    { pop: 120, title: "Village", grant: 4000, unlock: 1, goal: "Reach 120 people to unlock parks." },
    { pop: 600, title: "Town", grant: 9000, unlock: 2, goal: "Reach 600 people to unlock plazas." },
    { pop: 2500, title: "City", grant: 20000, unlock: 3, goal: "Reach 2,500 people to unlock libraries." },
    { pop: 8000, title: "Metropolis", grant: 45000, unlock: 4, goal: "Reach 8,000 people to unlock monuments." },
  ];

  // ---------------------------------------------------------------- state
  const S = {
    seed: 1, cash: 25000, day: 0, hour: 7, speed: 1, tool: "road", unlocked: 0,
    regions: new Array(GW * GH).fill(null),
    demand: { r: 0.55, c: 0.35, i: 0.3 },
    pop: 0, jobs: 0, mood: 60, income: 0, upkeep: 0, shopCap: 0, indCap: 0,
    links: [], peds: [], cars: [],
  };
  let cam = { x: 0, y: 0, zoom: 0.9 };

  // ---------------------------------------------------------------- helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const el = (id) => document.getElementById(id);
  const regionKey = (rx, ry) => ry * GW + rx;

  function hash2(x, y) {
    let h = x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967296;
  }
  function noiseSeed(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function valueNoise(w, h, scale, seed) {
    const r = noiseSeed(seed);
    const gw = Math.ceil(w / scale) + 2, gh = Math.ceil(h / scale) + 2;
    const grid = new Float32Array(gw * gh);
    for (let i = 0; i < grid.length; i++) grid[i] = r();
    const out = new Float32Array(w * h);
    const smooth = (t) => t * t * (3 - 2 * t);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const gx = x / scale, gy = y / scale;
      const x0 = Math.floor(gx), y0 = Math.floor(gy);
      const fx = smooth(gx - x0), fy = smooth(gy - y0);
      const a = grid[y0 * gw + x0], b = grid[y0 * gw + x0 + 1];
      const c = grid[(y0 + 1) * gw + x0], d = grid[(y0 + 1) * gw + x0 + 1];
      out[y * w + x] = (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
    }
    return out;
  }

  // ---------------------------------------------------------------- regions
  function makeRegion(rx, ry) {
    return {
      rx, ry, claimed: false,
      terrain: null, road: null, zone: null, level: null, bldg: null, svc: null,
      owned: null, powerOn: null, waterOn: null, value: null,
      zoneList: [], zoneDirty: true,
      pop: 0, jobs: 0, built: 0, roads: 0, upkeep: 0, mood: 60, access: 0, parks: 0,
    };
  }

  function generateRegion(r, seed) {
    const n = RS * RS;
    r.terrain = new Uint8Array(n);
    r.road = new Uint8Array(n);
    r.zone = new Uint8Array(n);
    r.level = new Uint8Array(n);
    r.bldg = new Uint8Array(n);
    r.svc = new Uint8Array(n);
    r.owned = new Uint8Array(n).fill(1);
    r.powerOn = new Uint8Array(n);
    r.waterOn = new Uint8Array(n);
    r.value = new Uint8Array(n);

    const hgt = valueNoise(RS, RS, 22, seed);
    const for1 = valueNoise(RS, RS, 14, seed + 991);
    const sample = [];
    for (let i = 0; i < hgt.length; i += 9) sample.push(hgt[i]);
    sample.sort((a, b) => a - b);
    const q = (f) => sample[Math.min(sample.length - 1, Math.floor(sample.length * f))];
    const qWater = q(0.085), qSand = q(0.115), qRock = q(0.965), qForest = q(0.80);
    for (let y = 0; y < RS; y++) for (let x = 0; x < RS; x++) {
      const i = y * RS + x;
      let t = TERRAIN.MEADOW;
      if (hgt[i] < qWater) t = TERRAIN.WATER;
      else if (hgt[i] < qSand) t = TERRAIN.SAND;
      else if (hgt[i] > qRock) t = TERRAIN.ROCK;
      else if (for1[i] > qForest) t = TERRAIN.FOREST;
      r.terrain[i] = t;
    }
    let wx = Math.floor(RS * (0.35 + hash2(r.rx + 3, r.ry + 7) * 0.3));
    const phase = hash2(r.rx + 11, r.ry + 5) * 6.28;
    for (let y = 0; y < RS; y++) {
      const curve = Math.sin(y / 26 + phase) * 2.2;
      wx = clamp(wx + Math.round(rnd(-1, 1) + curve * 0.35), 8, RS - 9);
      for (let dx = -1; dx <= 1; dx++) {
        const i = y * RS + clamp(wx + dx, 0, RS - 1);
        r.terrain[i] = dx === 0 ? TERRAIN.WATER : (r.terrain[i] === TERRAIN.WATER ? TERRAIN.WATER : TERRAIN.SAND);
      }
    }
    buildDecor(r);
    r.claimed = true;
    return r;
  }

  // decor is decided once per tile, not per frame; also rebuilt on load
  function buildDecor(r) {
    const n = RS * RS;
    r.decor = new Uint8Array(n);
    for (let y = 0; y < RS; y++) for (let x = 0; x < RS; x++) {
      const i = y * RS + x, t = r.terrain[i];
      const gx = r.rx * RS + x, gy = r.ry * RS + y;
      const h = hash2(gx, gy), h2 = hash2(gx + 7, gy + 3), h3 = hash2(gx + 11, gy + 5), h4 = hash2(gx + 23, gy + 41);
      let d = 0;
      if (t === TERRAIN.FOREST && h > 0.68) d = h2 > 0.5 ? 1 : 2;
      else if (t === TERRAIN.ROCK && h > 0.82) d = 3;
      else if (t === TERRAIN.MEADOW && h3 > 0.955) d = 4;
      else if (t === TERRAIN.MEADOW && h4 > 0.94) d = h > 0.5 ? 1 : 2;
      r.decor[i] = d;
    }
    return r.decor;
  }

  function regionOf(gx, gy) {
    if (gx < 0 || gy < 0 || gx >= WORLD_W || gy >= WORLD_H) return null;
    const rx = (gx / RS) | 0, ry = (gy / RS) | 0;
    const r = S.regions[regionKey(rx, ry)];
    if (!r || !r.claimed) return null;
    const lx = gx - rx * RS, ly = gy - ry * RS;
    return { r, rx, ry, lx, ly, i: ly * RS + lx };
  }
  function regionAt(rx, ry) {
    if (rx < 0 || ry < 0 || rx >= GW || ry >= GH) return null;
    return S.regions[regionKey(rx, ry)];
  }
  function claimedList() { return S.regions.filter((r) => r && r.claimed); }

  function claimRegion(rx, ry, free) {
    if (rx < 0 || ry < 0 || rx >= GW || ry >= GH) return false;
    const existing = regionAt(rx, ry);
    if (existing && existing.claimed) return false;
    const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const n = regionAt(rx + dx, ry + dy);
      return n && n.claimed;
    });
    if (!free && !touches) { deny("Regions must touch the ones you own"); return false; }
    if (!free) {
      if (S.cash < CLAIM_COST) { deny("A region costs " + money(CLAIM_COST)); return false; }
      S.cash -= CLAIM_COST;
    }
    const r = generateRegion(makeRegion(rx, ry), S.seed + rx * 7919 + ry * 104729);
    S.regions[regionKey(rx, ry)] = r;
    recomputeRegion(r);
    refreshLinks();
    refreshHud();
    drawMinimap();
    if (!free) { toast("Region claimed · " + claimedList().length + " of " + (GW * GH)); sfx("milestone"); }
    return true;
  }

  // ---------------------------------------------------------------- roads
  function hasRoad(gx, gy) { const t = regionOf(gx, gy); return !!t && t.r.road[t.i] === 1; }
  function roadMask(gx, gy) {
    let m = 0;
    if (hasRoad(gx, gy - 1)) m |= 1;
    if (hasRoad(gx + 1, gy)) m |= 2;
    if (hasRoad(gx, gy + 1)) m |= 4;
    if (hasRoad(gx - 1, gy)) m |= 8;
    return m;
  }
  function hasRoadNear(gx, gy) {
    return hasRoad(gx, gy) || hasRoad(gx + 1, gy) || hasRoad(gx - 1, gy) || hasRoad(gx, gy + 1) || hasRoad(gx, gy - 1);
  }

  // ---------------------------------------------------------------- services
  function recomputeRegion(r) {
    const n = RS * RS;
    r.powerOn.fill(0); r.waterOn.fill(0); r.value.fill(0);
    const paint = (name, arr, radius) => {
      for (let i = 0; i < n; i++) {
        if (SVC[r.svc[i]] !== name) continue;
        const tx = i % RS, ty = (i / RS) | 0;
        for (let y = Math.max(0, ty - radius); y <= Math.min(RS - 1, ty + radius); y++) {
          for (let x = Math.max(0, tx - radius); x <= Math.min(RS - 1, tx + radius); x++) {
            const dx = x - tx, dy = y - ty;
            if (dx * dx + dy * dy <= radius * radius) arr[y * RS + x] = 1;
          }
        }
      }
    };
    paint("power", r.powerOn, 10);
    paint("water", r.waterOn, 9);
    for (let i = 0; i < n; i++) {
      const name = SVC[r.svc[i]];
      if (!name) continue;
      const rule = SVC_RULE[name];
      if (!rule || !rule.value) continue;
      const tx = i % RS, ty = (i / RS) | 0, rad = rule.radius;
      for (let y = Math.max(0, ty - rad); y <= Math.min(RS - 1, ty + rad); y++) {
        for (let x = Math.max(0, tx - rad); x <= Math.min(RS - 1, tx + rad); x++) {
          const dx = x - tx, dy = y - ty, d2 = dx * dx + dy * dy;
          if (d2 <= rad * rad) {
            const j = y * RS + x;
            r.value[j] = clamp(r.value[j] + Math.round(rule.value * (0.5 + (1 - Math.sqrt(d2) / rad))), 0, 255);
          }
        }
      }
    }
    recalcRegion(r);
  }

  function recalcRegion(r) {
    let pop = 0, jobs = 0, roads = 0, svcUp = 0, built = 0, parks = 0;
    for (let i = 0; i < RS * RS; i++) {
      if (r.road[i]) roads++;
      const svcName = SVC[r.svc[i]];
      if (svcName) { svcUp += SVC_RULE[svcName] ? SVC_RULE[svcName].upkeep : 0; if (svcName === "park") parks++; }
      const lv = r.level[i];
      if (!lv) continue;
      built++;
      const z = r.zone[i];
      const cap = (z === Z.R ? 4 : 6) * lv;
      if (z === Z.R) pop += cap; else jobs += cap;
    }
    r.pop = pop; r.jobs = jobs; r.built = built; r.roads = roads; r.parks = parks;
    r.upkeep = roads * 0.55 + svcUp;
  }

  // ---------------------------------------------------------------- links
  function refreshLinks() {
    S.links = [];
    const list = claimedList();
    const byKey = {};
    list.forEach((r) => { byKey[regionKey(r.rx, r.ry)] = r; });
    list.forEach((r) => {
      const e = byKey[regionKey(r.rx + 1, r.ry)];
      if (e) {
        let n = 0;
        for (let y = 0; y < RS; y++) if (r.road[y * RS + (RS - 1)] && e.road[y * RS]) n++;
        if (n) S.links.push({ a: r, b: e, strength: n });
      }
      const s = byKey[regionKey(r.rx, r.ry + 1)];
      if (s) {
        let n = 0;
        for (let x = 0; x < RS; x++) if (r.road[(RS - 1) * RS + x] && s.road[x]) n++;
        if (n) S.links.push({ a: r, b: s, strength: n });
      }
    });
    list.forEach((r) => { r.access = r.jobs; });
    S.links.forEach((l) => {
      const share = 0.75 * Math.min(1, l.strength / 6);
      l.a.access += l.b.jobs * share;
      l.b.access += l.a.jobs * share;
    });
  }

  // ---------------------------------------------------------------- totals
  function recalcWorld() {
    let pop = 0, jobs = 0, income = 0, upkeep = 0, moodSum = 0, n = 0;
    claimedList().forEach((r) => {
      recalcRegion(r);
      pop += r.pop; jobs += r.jobs;
      income += r.pop * 0.85 + r.jobs * 0.5;
      upkeep += r.upkeep || 0;
      moodSum += r.mood; n++;
    });
    S.pop = pop; S.jobs = jobs; S.income = income; S.upkeep = upkeep;
    S.mood = n ? moodSum / n : 60;
  }

  function updateDemand() {
    const spare = clamp((S.jobs - S.pop * 0.85) / Math.max(40, S.jobs), -0.45, 1);
    const shopperNeed = S.pop * 0.45, workNeed = S.pop * 0.35;
    let shops = 0, industry = 0;
    claimedList().forEach((r) => {
      for (let i = 0; i < RS * RS; i++) {
        const z = r.zone[i]; if (!z || !r.level[i]) continue;
        const cap = (z === Z.R ? 4 : 6) * r.level[i];
        if (z === Z.C) shops += cap;
        if (z === Z.I) industry += cap;
      }
    });
    S.shopCap = shops; S.indCap = industry;
    const moodFactor = S.mood < 40 ? -0.25 : (S.mood > 65 ? 0.15 : 0);
    S.demand.r = clamp(0.42 + spare * 0.6 + moodFactor, 0, 1);
    S.demand.c = clamp(0.24 + clamp((shopperNeed - shops) / Math.max(30, shopperNeed), -0.6, 1) * 0.8, 0, 1);
    S.demand.i = clamp(0.20 + clamp((workNeed + S.jobs * 0.1 - industry) / Math.max(30, workNeed), -0.6, 1) * 0.8, 0, 1);
  }

  // ---------------------------------------------------------------- growth
  function tickRegion(r, tries) {
    if (r.zoneDirty) {
      const list = [];
      for (let i = 0; i < RS * RS; i++) if (r.zone[i]) list.push(i);
      r.zoneList = list; r.zoneDirty = false;
    }
    const list = r.zoneList;
    if (!list.length) return;
    const accessBonus = r.access && r.jobs ? clamp((r.access - r.jobs) / Math.max(20, r.access), 0, 0.4) : 0;
    for (let k = 0; k < tries; k++) {
      const i = list[(Math.random() * list.length) | 0];
      const z = r.zone[i];
      if (!z) continue;
      const lx = i % RS, ly = (i / RS) | 0;
      const gx = r.rx * RS + lx, gy = r.ry * RS + ly;
      if (!hasRoadNear(gx, gy)) continue;
      const powered = r.powerOn[i] === 1, watered = r.waterOn[i] === 1;
      const lv = r.level[i];
      const canUp = lv === 0 ? true : lv === 1 ? powered : (powered && watered);
      let dem = z === Z.R ? S.demand.r : z === Z.C ? S.demand.c : S.demand.i;
      if (z === Z.R) dem = clamp(dem + accessBonus, 0, 1);
      const value = r.value[i] / 255;
      const table = z === Z.R ? BLDG_IDX.R : z === Z.C ? BLDG_IDX.C : BLDG_IDX.I;
      if (lv > 0 && !canUp && Math.random() < 0.02) {
        r.level[i] = lv - 1;
        r.bldg[i] = lv - 1 ? table[lv - 1] : 0;
        continue;
      }
      if (dem > 0.3 && lv < 3 && canUp && Math.random() < dem * (0.20 + value * 0.22)) {
        r.level[i] = lv + 1;
        r.bldg[i] = table[r.level[i]];
        sfx("grow");
      } else if (dem < 0.08 && lv > 0 && Math.random() < 0.02) {
        r.level[i] = lv - 1;
        r.bldg[i] = lv - 1 ? table[lv - 1] : 0;
      }
    }
  }

  function tick() {
    S.day++;
    S.hour = (S.hour + 6) % 24;
    refreshLinks();
    recalcWorld();
    updateDemand();
    claimedList().forEach((r) => tickRegion(r, Math.min(90, Math.max(10, Math.ceil(r.zoneList.length * 0.9) || 12))));
    refreshLinks();
    recalcWorld();
    updateDemand();
    claimedList().forEach((r) => {
      const unemp = clamp((r.pop - (r.access || r.jobs)) / Math.max(1, r.pop), 0, 1);
      const mood = 64 - unemp * 17 + Math.min(14, (r.parks || 0) * 1.5);
      r.mood = clamp(r.mood + (mood - r.mood) * 0.12, 0, 100);
    });
    S.cash += S.income - S.upkeep;
    if (S.cash < -5000) { S.cash = -5000; if (S.day % 10 === 0) toast("The treasury is empty for now. Build smaller, or bulldoze what is idle."); }
    checkMilestones();
    updatePeds();
    if (S.day % 7 === 0) log(weekLine());
    refreshHud();
  }

  function weekLine() {
    const n = claimedList().length;
    const lines = [
      S.pop + " people across " + n + " region" + (n === 1 ? "" : "s") + " · " + S.jobs + " jobs · mood " + Math.round(S.mood) + "%.",
      "The world holds " + S.pop + " people and " + money(S.cash) + ".",
      S.links.length ? S.links.length + " border connection" + (S.links.length === 1 ? "" : "s") + " carrying commuters between regions." : "No two regions are joined yet — a road across a border connects them.",
    ];
    return lines[S.day % lines.length];
  }

  function checkMilestones() {
    const m = MILESTONES[S.unlocked + 1];
    if (m && S.pop >= m.pop) {
      S.unlocked++;
      S.cash += m.grant;
      toast("MILESTONE · " + MILESTONES[S.unlocked].title + " · " + money(m.grant) + " grant");
      sfx("milestone");
      log("The world is now a " + MILESTONES[S.unlocked].title + ".");
      renderTools();
    }
  }

  // ---------------------------------------------------------------- walkers
  function updatePeds() {
    const spots = [];
    claimedList().forEach((r) => {
      const roads = [];
      for (let i = 0; i < r.road.length; i++) if (r.road[i]) roads.push(i);
      if (!roads.length) return;
      const take = clamp(Math.round(roads.length / 6), 1, 40);
      for (let k = 0; k < take; k++) {
        const i = roads[(Math.random() * roads.length) | 0];
        spots.push({ gx: r.rx * RS + (i % RS), gy: r.ry * RS + ((i / RS) | 0) });
      }
    });
    const wantPeds = clamp(Math.round(S.pop / 3.5), 0, 160);
    const wantCars = clamp(Math.round(S.pop / 12), 0, 40);
    while (S.peds.length < wantPeds && spots.length) {
      const p = spots[(Math.random() * spots.length) | 0];
      S.peds.push({ x: p.gx, y: p.gy, t: Math.random(), dir: (Math.random() * 4) | 0, hue: (Math.random() * 360) | 0, speed: rnd(0.35, 0.9) });
    }
    while (S.cars.length < wantCars && spots.length) {
      const p = spots[(Math.random() * spots.length) | 0];
      S.cars.push({ x: p.gx, y: p.gy, t: Math.random(), dir: (Math.random() * 4) | 0, hue: (Math.random() * 360) | 0, speed: rnd(0.7, 1.5) });
    }
    if (S.peds.length > wantPeds) S.peds.length = wantPeds;
    if (S.cars.length > wantCars) S.cars.length = wantCars;
  }
  function stepWalkers(list, dt) {
    for (const p of list) {
      p.t += dt * p.speed;
      if (p.t < 1) continue;
      p.t = 0;
      const opts = [[0, -1], [1, 0], [0, 1], [-1, 0]].filter(([dx, dy]) => hasRoad(p.x + dx, p.y + dy));
      if (!opts.length) continue;
      const [dx, dy] = opts[(Math.random() * opts.length) | 0];
      p.x += dx; p.y += dy; p.dir = dx === 1 ? 0 : dy === 1 ? 1 : dx === -1 ? 2 : 3;
    }
  }

  // ---------------------------------------------------------------- camera
  function tileToScreen(gx, gy) {
    return { x: ((gx - gy) * HALF_W) * cam.zoom + cam.x, y: ((gx + gy) * HALF_H) * cam.zoom + cam.y };
  }
  function screenToTile(sx, sy) {
    const x = (sx - cam.x) / cam.zoom - HALF_W;
    const y = (sy - cam.y) / cam.zoom - HALF_H;
    return { gx: Math.round((x / HALF_W + y / HALF_H) / 2), gy: Math.round((y / HALF_H - x / HALF_W) / 2) };
  }
  function focusOn(gx, gy, zoom) {
    const c = document.getElementById("map");
    cam.zoom = zoom || 0.95;
    const p = tileToScreen(gx, gy);
    cam.x += c.clientWidth / 2 - (p.x + TW * cam.zoom / 2);
    cam.y += c.clientHeight / 2 - (p.y + TH * cam.zoom / 2 - 40);
  }
  function focusRegion(r) { focusOn(r.rx * RS + RS / 2, r.ry * RS + RS / 2); }

  // ---------------------------------------------------------------- render
  const canvas = document.getElementById("map");
  const ctx = canvas.getContext("2d");
  let dpr = 1, last = 0, acc = 0, hover = { gx: -1, gy: -1 }, lastMini = 0;

  const GROUND_COLORS = {
    0: ["#3f6b34", "#426f37"],
    1: ["#2f5530", "#33592f"],
    2: ["#c9b26a", "#cdb672"],
    3: ["#2f5f86", "#335f86"],
    4: ["#6b6a63", "#6f6e66"],
  };

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

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
    const cs = [screenToTile(0, 0), screenToTile(w, 0), screenToTile(0, h), screenToTile(w, h)];
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    cs.forEach((c) => { x0 = Math.min(x0, c.gx); x1 = Math.max(x1, c.gx); y0 = Math.min(y0, c.gy); y1 = Math.max(y1, c.gy); });
    return {
      x0: clamp(x0 - 2, 0, WORLD_W - 1), x1: clamp(x1 + 2, 0, WORLD_W - 1),
      y0: clamp(y0 - 2, 0, WORLD_H - 1), y1: clamp(y1 + 3, 0, WORLD_H - 1),
    };
  }

  function render(ts) {
    try { drawFrame(ts); }
    catch (err) {
      if (!S.drawError) { S.drawError = String(err && err.message || err); try { log("Draw error: " + S.drawError); } catch (e) {} }
      requestAnimationFrame(render);
    }
  }

  function drawFrame(ts) {
    const dt = Math.min(0.1, (ts - last) / 1000 || 0.016);
    last = ts;
    if (S.speed > 0) {
      acc += dt * S.speed;
      const dayLen = 2.6;
      while (acc > dayLen) { acc -= dayLen; tick(); }
      S.hour = (S.hour + dt * S.speed * (24 / dayLen)) % 24;
    }
    stepWalkers(S.peds, dt * (S.speed || 1));
    stepWalkers(S.cars, dt * (S.speed || 1) * 1.6);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = "#0a0908";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const r = visibleRange();
    const zw = TW * cam.zoom, zh = TH * cam.zoom;
    const now = performance.now();

    for (let sum = r.x0 + r.y0; sum <= r.x1 + r.y1; sum++) {
      const gxStart = Math.max(r.x0, sum - r.y1), gxEnd = Math.min(r.x1, sum - r.y0);
      for (let gx = gxStart; gx <= gxEnd; gx++) {
        const gy = sum - gx;
        if (gy < r.y0 || gy > r.y1) continue;
        const t = regionOf(gx, gy);
        if (!t) {
          const s0 = tileToScreen(gx, gy);
          const c0x = Math.round(s0.x + zw / 2), c0y = Math.round(s0.y + zh / 2);
          drawDiamond(c0x, c0y, zw + 2, zh + 2, ((gx + gy) & 1) ? "#161512" : "#131210");
          continue;
        }
        const reg = t.r, i = t.i;
        const s = tileToScreen(gx, gy);
        const cx0 = Math.round(s.x + zw / 2), cy0 = Math.round(s.y + zh / 2);
        const terr = reg.terrain[i];
        const pal = GROUND_COLORS[terr] || GROUND_COLORS[0];
        const shade = pal[((gx * 7 + gy * 13) & 1)];
        drawDiamond(cx0, cy0, zw + 2, zh + 2, shade);
        if (zw > 64) { ctx.strokeStyle = shade; ctx.lineWidth = 1.2; ctx.stroke(); }

        if (terr === TERRAIN.WATER) {
          ctx.globalAlpha = 0.10 + 0.06 * Math.sin(now / 900 + gx * 0.6 + gy * 0.4);
          drawDiamond(cx0, cy0, zw * 0.86, zh * 0.86, "#9fd8ff");
          ctx.globalAlpha = 1;
        }
        if (zw > 56 && terr !== TERRAIN.WATER && ((gx * 5 + gy * 3) & 7) === 0) {
          ctx.fillStyle = terr === TERRAIN.SAND ? "rgba(150,125,70,.35)" : (terr === TERRAIN.ROCK ? "rgba(40,40,38,.35)" : "rgba(24,58,26,.32)");
          const sz = Math.max(1.5, 2.2 * cam.zoom);
          ctx.fillRect(cx0 + ((gx & 3) - 1.5) * 6, cy0 + ((gy & 3) - 1.5) * 4, sz, sz);
          ctx.fillRect(cx0 + ((gy & 3) - 1.5) * 6, cy0 + ((gx & 3) - 1.5) * 4, sz, sz);
        }
        if (reg.zone[i] && !reg.level[i]) {
          const zc = reg.zone[i] === Z.R ? "rgba(111,191,115,.42)" : reg.zone[i] === Z.C ? "rgba(90,169,230,.40)" : "rgba(242,193,78,.38)";
          drawDiamond(cx0, cy0, zw * 0.9, zh * 0.9, zc);
          if (!hasRoadNear(gx, gy)) {
            ctx.fillStyle = "rgba(226,88,60,.9)";
            const s0 = Math.max(2, 3 * cam.zoom);
            ctx.fillRect(cx0 - s0 / 2, cy0 - zh * 0.28 - s0, s0, s0);
          }
        }

        let key = null;
        if (reg.road[i]) key = ROAD[roadMask(gx, gy)] || "r02_road_straight_ew";
        else if (reg.level[i]) key = BLDG[reg.bldg[i]];
        else if (reg.svc[i]) key = SVC_SPRITE[SVC[reg.svc[i]]];
        else if (reg.decor[i] === 1) key = "d05_pine_grove";
        else if (reg.decor[i] === 2) key = "d04_oak_tree_park";
        else if (reg.decor[i] === 3) key = "s11_meadow_rock_outcrop_v2";
        else if (reg.decor[i] === 4) key = "s10_meadow_wildflowers_v1";
        if (key && SPRITES[key] && SPRITES[key].complete) {
          ctx.drawImage(SPRITES[key], s.x, s.y - GROUND_OFFSET * cam.zoom, TW * cam.zoom, TW * cam.zoom);
        }
        if (reg.level[i] && !reg.powerOn[i]) {
          ctx.globalAlpha = 0.22;
          drawDiamond(cx0, cy0, zw * 0.5, zh * 0.5, "#ffdf6b");
          ctx.globalAlpha = 1;
        }
      }
    }

    claimedList().forEach((reg) => {
      const x0 = reg.rx * RS, y0 = reg.ry * RS;
      const pts = [tileToScreen(x0, y0), tileToScreen(x0 + RS, y0), tileToScreen(x0 + RS, y0 + RS), tileToScreen(x0, y0 + RS)];
      ctx.beginPath();
      ctx.moveTo(pts[0].x + zw / 2, pts[0].y + zh / 2);
      for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x + zw / 2, pts[i].y + zh / 2);
      ctx.closePath();
      ctx.strokeStyle = "rgba(242,193,78,.16)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    for (const p of S.peds) {
      const a = tileToScreen(p.x, p.y);
      const b = tileToScreen(p.x + (p.dir === 0 ? 1 : p.dir === 2 ? -1 : 0), p.y + (p.dir === 1 ? 1 : p.dir === 3 ? -1 : 0));
      const s = { x: a.x + (b.x - a.x) * p.t + zw / 2, y: a.y + (b.y - a.y) * p.t + zh / 2 };
      const h = Math.max(2.5, 4.2 * cam.zoom);
      ctx.fillStyle = "hsl(" + p.hue + ",60%,62%)";
      ctx.fillRect(s.x - h / 3, s.y - h, h * 0.66, h);
    }
    for (const c of S.cars) {
      const a = tileToScreen(c.x, c.y);
      const b = tileToScreen(c.x + (c.dir === 0 ? 1 : c.dir === 2 ? -1 : 0), c.y + (c.dir === 1 ? 1 : c.dir === 3 ? -1 : 0));
      const s = { x: a.x + (b.x - a.x) * c.t + zw / 2, y: a.y + (b.y - a.y) * c.t + zh / 2 };
      const w = Math.max(3, 7 * cam.zoom), h = Math.max(2, 3.5 * cam.zoom);
      ctx.fillStyle = "hsl(" + c.hue + ",55%,55%)";
      ctx.fillRect(s.x - w / 2, s.y - h, w, h);
    }

    if (regionOf(hover.gx, hover.gy)) {
      const s = tileToScreen(hover.gx, hover.gy);
      const t = toolById(S.tool);
      const ok = canPaint(t, hover.gx, hover.gy);
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

    const night = Math.max(0, Math.cos((S.hour / 24) * Math.PI * 2)) * 0.28;
    if (night > 0.01) {
      ctx.fillStyle = "rgba(8,12,28," + night.toFixed(3) + ")";
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }

    if (performance.now() - lastMini > 200) { lastMini = performance.now(); drawMinimap(); }
    requestAnimationFrame(render);
  }

  // ---------------------------------------------------------------- minimap
  const mini = document.getElementById("minimap");
  const mctx = mini ? mini.getContext("2d") : null;
  const MM_PAD = 10;
  function mmCell() { return { w: (mini.width - MM_PAD * 2) / GW, h: (mini.height - MM_PAD * 2) / GH }; }
  function drawMinimap() {
    if (!mctx) return;
    const { w: cw, h: ch } = mmCell();
    mctx.clearRect(0, 0, mini.width, mini.height);
    mctx.fillStyle = "rgba(10,9,8,.92)";
    mctx.fillRect(0, 0, mini.width, mini.height);
    for (let ry = 0; ry < GH; ry++) for (let rx = 0; rx < GW; rx++) {
      const reg = regionAt(rx, ry);
      const x = MM_PAD + rx * cw, y = MM_PAD + ry * ch;
      if (reg && reg.claimed) {
        const lum = clamp(28 + Math.log10(1 + reg.pop) * 40, 28, 150);
        mctx.fillStyle = "rgb(" + Math.round(lum * 0.7) + "," + Math.round(lum) + "," + Math.round(lum * 0.55) + ")";
        mctx.fillRect(x + 2, y + 2, cw - 4, ch - 4);
        mctx.fillStyle = "rgba(16,14,12,.85)";
        mctx.font = "9px Tahoma";
        mctx.fillText(String(reg.pop), x + 6, y + ch - 6);
      } else {
        mctx.strokeStyle = "rgba(120,110,90,.45)";
        mctx.setLineDash([3, 3]);
        mctx.strokeRect(x + 2, y + 2, cw - 4, ch - 4);
        mctx.setLineDash([]);
        mctx.fillStyle = "rgba(242,193,78,.55)";
        mctx.font = "11px Tahoma";
        mctx.fillText("+", x + cw / 2 - 3, y + ch / 2 + 4);
      }
    }
    S.links.forEach((l) => {
      const ax = MM_PAD + l.a.rx * cw, ay = MM_PAD + l.a.ry * ch;
      const bx = MM_PAD + l.b.rx * cw, by = MM_PAD + l.b.ry * ch;
      mctx.strokeStyle = "rgba(242,193,78,.9)";
      mctx.lineWidth = 2;
      mctx.beginPath();
      mctx.moveTo(ax + cw / 2, ay + ch / 2);
      mctx.lineTo(bx + cw / 2, by + ch / 2);
      mctx.stroke();
    });
    const center = screenToTile(canvas.clientWidth / 2, canvas.clientHeight / 2);
    const crx = clamp(Math.floor(center.gx / RS), 0, GW - 1);
    const cry = clamp(Math.floor(center.gy / RS), 0, GH - 1);
    mctx.strokeStyle = "rgba(114,224,209,.9)";
    mctx.lineWidth = 1.5;
    mctx.strokeRect(MM_PAD + crx * cw + 1, MM_PAD + cry * ch + 1, cw - 2, ch - 2);
  }
  if (mini) {
    mini.addEventListener("click", (e) => {
      const rect = mini.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (mini.width / rect.width);
      const y = (e.clientY - rect.top) * (mini.height / rect.height);
      const { w: cw, h: ch } = mmCell();
      const rx = clamp(Math.floor((x - MM_PAD) / cw), 0, GW - 1);
      const ry = clamp(Math.floor((y - MM_PAD) / ch), 0, GH - 1);
      const reg = regionAt(rx, ry);
      if (reg && reg.claimed) focusRegion(reg);
      else if (claimRegion(rx, ry, false)) focusRegion(regionAt(rx, ry));
    });
  }

  // ---------------------------------------------------------------- tools
  function toolById(id) { return TOOLS.find((t) => t.id === id) || TOOLS[0]; }

  function canPaint(t, gx, gy) {
    const tile = regionOf(gx, gy);
    if (!tile) return false;
    const r = tile.r, i = tile.i;
    const terr = r.terrain[i];
    if (t.id === "road") return terr !== TERRAIN.WATER;
    if (t.zone) return terr !== TERRAIN.WATER && !r.road[i] && !r.level[i] && !r.svc[i];
    if (t.service) return terr !== TERRAIN.WATER && !r.road[i] && !r.zone[i] && !r.svc[i] && !r.level[i];
    return true;
  }

  function paint(t, gx, gy) {
    const tile = regionOf(gx, gy);
    if (!tile) return false;
    if (t.id === "inspect") { inspect(gx, gy); return true; }
    if (!canPaint(t, gx, gy)) return false;
    const r = tile.r, i = tile.i;
    if (S.cash < t.cost) { deny("Not enough funds for " + t.name.toLowerCase()); return false; }
    let did = false;
    if (t.id === "bulldoze") {
      if (!(r.road[i] || r.zone[i] || r.level[i] || r.svc[i])) return false;
      const hadSvc = r.svc[i] !== 0;
      r.road[i] = 0; r.zone[i] = 0; r.level[i] = 0; r.bldg[i] = 0; r.svc[i] = 0;
      r.zoneDirty = true;
      if (hadSvc) recomputeRegion(r);
      recalcRegion(r);
      sfx("clear");
      did = true;
    } else if (t.id === "road") {
      if (r.road[i]) return false;
      r.road[i] = 1; r.zone[i] = 0; r.level[i] = 0; r.bldg[i] = 0;
      r.zoneDirty = true;
      sfx("place");
      did = true;
    } else if (t.zone) {
      if (r.zone[i] === t.zone) return false;
      r.zone[i] = t.zone; r.zoneDirty = true;
      sfx("place");
      did = true;
    } else if (t.service) {
      if (r.svc[i]) return false;
      r.svc[i] = SVC.indexOf(t.service);
      recomputeRegion(r);
      sfx("place");
      did = true;
    }
    if (did) {
      S.cash -= t.cost;
      refreshLinks();
      recalcWorld();
      refreshHud();
      drawMinimap();
    }
    return did;
  }

  function paintLine(t, from, to) {
    if (!from) { paint(t, to.gx, to.gy); return; }
    let x = from.gx, y = from.gy, guard = 0;
    while ((x !== to.gx || y !== to.gy) && guard++ < 400) {
      if (x !== to.gx) x += Math.sign(to.gx - x);
      else y += Math.sign(to.gy - y);
      paint(t, x, y);
    }
  }

  function inspect(gx, gy) {
    const tile = regionOf(gx, gy);
    if (!tile) { toast("That land is not claimed — claim the region on the world map"); return; }
    const r = tile.r, i = tile.i;
    const zoneName = { 0: "unzoned", 1: "homes", 2: "shops", 3: "works" }[r.zone[i]];
    const rows = [
      ["Region", r.rx + ", " + r.ry],
      ["Tile", (gx % RS) + ", " + (gy % RS)],
      ["Ground", ["meadow", "forest", "sand", "water", "rock"][r.terrain[i]]],
      ["Road", r.road[i] ? "yes" : "no"],
      ["Zone", zoneName],
      ["Building", r.level[i] ? (BLDG[r.bldg[i]] || "").replace(/^b\d+_/, "").replace(/_/g, " ") + " (L" + r.level[i] + ")" : "none"],
      ["Power", r.powerOn[i] ? "on" : "off"],
      ["Water", r.waterOn[i] ? "on" : "off"],
      ["Land value", String(r.value[i])],
      ["Service", SVC[r.svc[i]] || "none"],
    ];
    el("ins-title").textContent = "Tile " + gx + ", " + gy;
    el("ins-body").innerHTML = rows.map(([k, v]) => '<div class="kv"><span>' + k + "</span><b>" + v + "</b></div>").join("");
    el("inspector").classList.remove("hidden");
  }

  // ---------------------------------------------------------------- hud
  function refreshHud() {
    el("ui-cash").textContent = money(S.cash);
    el("ui-pop").textContent = S.pop.toLocaleString();
    el("ui-jobs").textContent = S.jobs.toLocaleString();
    el("ui-mood").textContent = Math.round(S.mood) + "%";
    el("ui-date").textContent = "Day " + (S.day + 1) + " · " + String(Math.floor(S.hour)).padStart(2, "0") + ":00";
    el("ui-region").textContent = "Region " + claimedList().length + "/" + (GW * GH);
    el("ui-dem-r").style.width = Math.round(S.demand.r * 100) + "%";
    el("ui-dem-c").style.width = Math.round(S.demand.c * 100) + "%";
    el("ui-dem-i").style.width = Math.round(S.demand.i * 100) + "%";

    let built = 0, powered = 0, watered = 0, vsum = 0, vn = 0;
    claimedList().forEach((r) => {
      for (let i = 0; i < RS * RS; i++) {
        if (r.zone[i]) { built++; if (r.powerOn[i]) powered++; if (r.waterOn[i]) watered++; }
        if (r.zone[i] === Z.R) { vsum += r.value[i]; vn++; }
      }
    });
    const pf = built ? powered / built : 0, wf = built ? watered / built : 0;
    el("ui-power").style.width = Math.round(pf * 100) + "%";
    el("ui-power-t").textContent = Math.round(pf * 100) + "%";
    el("ui-water").style.width = Math.round(wf * 100) + "%";
    el("ui-water-t").textContent = Math.round(wf * 100) + "%";
    el("ui-value").style.width = Math.round(((vn ? vsum / vn : 0) / 255) * 100) + "%";
    el("ui-value-t").textContent = money((vn ? vsum / vn : 0) * 12);
    const next = MILESTONES[S.unlocked + 1];
    el("ui-goal").textContent = next ? (next.goal || ("Reach " + next.pop + " people for " + next.title + ".")) : "Metropolis. Nothing left to unlock but more world.";
    const claim = el("ui-claim");
    claim.textContent = "Claim a region · " + money(CLAIM_COST);
    claim.disabled = S.cash < CLAIM_COST;
    el("ui-region").title = claimedList().map((r) => "region " + r.rx + "," + r.ry + " · " + r.pop + " people").join(" | ");
  }

  let toastT = 0;
  function toast(text) {
    const n = el("toast");
    n.textContent = text;
    n.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(() => n.classList.remove("on"), 2800);
  }
  function deny(text) { toast(text); sfx("deny"); }
  function log(text) { el("ticker-text").innerHTML = text; }

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
    const ac = initAudio(); if (!ac || ambient) return;
    const master = ac.createGain(); master.gain.value = 0.05; master.connect(ac.destination);
    const o1 = ac.createOscillator(); o1.type = "sine"; o1.frequency.value = 110;
    const o2 = ac.createOscillator(); o2.type = "sine"; o2.frequency.value = 165;
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.08;
    const lg = ac.createGain(); lg.gain.value = 30;
    lfo.connect(lg); lg.connect(o2.frequency);
    o1.connect(master); o2.connect(master);
    o1.start(); o2.start(); lfo.start();
    ambient = { master };
  }
  function sfx(kind) {
    if (!audioOn) return;
    const ac = initAudio(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain(), now = ac.currentTime;
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
      const locked = t.unlock !== undefined && S.unlocked < t.unlock;
      const b = document.createElement("button");
      b.className = "tool" + (S.tool === t.id ? " on" : "") + (locked ? " locked" : "");
      b.innerHTML = "<b>" + t.name + "</b><span>" + (locked ? "milestone" : money(t.cost) + " · " + t.hint) + "</span>";
      b.onclick = () => {
        if (locked) { toast("Locked: reach the next milestone to build " + t.name.toLowerCase() + "."); return; }
        S.tool = t.id; renderTools();
      };
      box.appendChild(b);
    });
  }

  // ---------------------------------------------------------------- input
  function bindInput() {
    let painting = false, panning = false, panStart = null, spaceDown = false, lastTile = null;
    canvas.addEventListener("pointerdown", (e) => {
      if (!audioOn) { audioOn = true; el("ui-sound").classList.remove("off"); startAmbient(); }
      const t = screenToTile(e.offsetX, e.offsetY);
      if (e.button === 1 || e.button === 2 || spaceDown) {
        panning = true; panStart = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
        canvas.setPointerCapture(e.pointerId);
        return;
      }
      painting = true; lastTile = t;
      if (S.tool === "inspect") { inspect(t.gx, t.gy); painting = false; return; }
      paint(toolById(S.tool), t.gx, t.gy);
    });
    canvas.addEventListener("pointermove", (e) => {
      const t = screenToTile(e.offsetX, e.offsetY);
      hover = t;
      if (panning && panStart) {
        cam.x = panStart.cx + (e.clientX - panStart.x);
        cam.y = panStart.cy + (e.clientY - panStart.y);
        return;
      }
      if (painting) { paintLine(toolById(S.tool), lastTile, t); lastTile = t; }
    });
    window.addEventListener("pointerup", () => { painting = false; panning = false; panStart = null; lastTile = null; });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const before = screenToTile(e.offsetX, e.offsetY);
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      cam.zoom = clamp(cam.zoom * f, 0.16, 2.4);
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
    window.addEventListener("resize", resize);
  }

  function setSpeed(s) {
    S.speed = s;
    [...document.querySelectorAll("#ui-speeds button")].forEach((b) => b.classList.toggle("on", Number(b.dataset.speed) === s));
  }

  // ---------------------------------------------------------------- save / load
  function rle(arr) {
    const out = [];
    let v = arr[0], n = 1;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] === v && n < 65535) n++;
      else { out.push(v + "x" + n); v = arr[i]; n = 1; }
    }
    out.push(v + "x" + n);
    return out.join(",");
  }
  function unrle(str, len) {
    const out = new Uint8Array(len);
    let at = 0;
    str.split(",").forEach((chunk) => {
      const [v, n] = chunk.split("x");
      const count = Number(n) || 0;
      out.fill(Number(v) || 0, at, Math.min(len, at + count));
      at += count;
    });
    return out;
  }
  function save() {
    const regions = [];
    claimedList().forEach((r) => {
      regions.push({
        rx: r.rx, ry: r.ry,
        terrain: rle(r.terrain), road: rle(r.road), zone: rle(r.zone), level: rle(r.level),
        bldg: rle(r.bldg), svc: rle(r.svc),
      });
    });
    const data = { v: 3, seed: S.seed, cash: S.cash, day: S.day, hour: S.hour, unlocked: S.unlocked, regions,
      cam: { x: cam.x, y: cam.y, zoom: cam.zoom } };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      toast("World saved · " + regions.length + " region" + (regions.length === 1 ? "" : "s"));
    } catch (e) { toast("Could not save: browser storage is full"); }
  }
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (!raw) { toast("No saved world in this browser"); return false; }
    try {
      const d = JSON.parse(raw);
      S.regions = new Array(GW * GH).fill(null);
      S.seed = d.seed; S.cash = d.cash; S.day = d.day; S.hour = d.hour; S.unlocked = d.unlocked || 0;
      d.regions.forEach((r) => {
        const reg = makeRegion(r.rx, r.ry);
        reg.claimed = true;
        reg.terrain = unrle(r.terrain, RS * RS);
        reg.road = unrle(r.road, RS * RS);
        reg.zone = unrle(r.zone, RS * RS);
        reg.level = unrle(r.level, RS * RS);
        reg.bldg = unrle(r.bldg, RS * RS);
        reg.svc = unrle(r.svc, RS * RS);
        reg.owned = new Uint8Array(RS * RS).fill(1);
        reg.powerOn = new Uint8Array(RS * RS);
        reg.waterOn = new Uint8Array(RS * RS);
        reg.value = new Uint8Array(RS * RS);
        reg.zoneDirty = true;
        buildDecor(reg);
        S.regions[regionKey(r.rx, r.ry)] = reg;
        recomputeRegion(reg);
      });
      refreshLinks(); recalcWorld(); updateDemand();
      renderTools(); refreshHud();
      if (d.cam && typeof d.cam.zoom === "number") { cam.x = d.cam.x; cam.y = d.cam.y; cam.zoom = clamp(d.cam.zoom, 0.16, 2.4); }
      else focusCity();
      toast("World loaded · day " + (S.day + 1));
      return true;
    } catch (e) { toast("That save could not be read"); return false; }
  }

  function focusCity() {
    const list = claimedList();
    if (!list.length) return;
    // a sprawl has several clusters; the one worth showing is the densest region
    let best = null, bestCount = -1;
    list.forEach((r) => {
      let n = 0;
      for (let i = 0; i < RS * RS; i++) if (r.level[i] || r.road[i]) n++;
      if (n > bestCount) { bestCount = n; best = r; }
    });
    if (!best) { focusRegion(list[0]); return; }
    let sx = 0, sy = 0, n = 0;
    for (let i = 0; i < RS * RS; i++) {
      if (best.level[i] || best.road[i]) { sx += i % RS; sy += (i / RS) | 0; n++; }
    }
    if (n) focusOn(best.rx * RS + Math.round(sx / n), best.ry * RS + Math.round(sy / n));
    else focusRegion(best);
  }

  // ---------------------------------------------------------------- boot
  function modal(title, html) {
    el("modal-title").textContent = title;
    el("modal-body").innerHTML = html;
    el("modal").classList.remove("hidden");
  }

  function plantHamlet(r) {
    const cx = RS >> 1, cy = RS >> 1;
    for (let x = cx - 8; x <= cx + 8; x++) {
      const i = cy * RS + x;
      if (r.terrain[i] !== TERRAIN.WATER) r.road[i] = 1;
    }
    const place = (x, y, z, lvl) => {
      const i = y * RS + x;
      if (r.terrain[i] === TERRAIN.WATER || r.road[i]) return;
      r.zone[i] = z; r.level[i] = lvl;
      r.bldg[i] = BLDG_IDX[z === Z.R ? "R" : z === Z.C ? "C" : "I"][lvl];
    };
    for (let x = cx - 5; x <= cx - 3; x++) { place(x, cy - 1, Z.R, 1); place(x, cy + 1, Z.R, 1); }
    place(cx, cy - 1, Z.C, 1);
    place(cx + 1, cy + 1, Z.I, 1);
    place(cx + 4, cy - 1, Z.R, 1);
    place(cx + 5, cy + 1, Z.R, 1);
    r.zoneDirty = true;
  }

  function newWorld(seed) {
    S.seed = seed || Math.floor(Math.random() * 1e9);
    S.regions = new Array(GW * GH).fill(null);
    S.cash = 25000; S.day = 0; S.hour = 7; S.unlocked = 0;
    S.peds = []; S.cars = []; S.links = [];
    claimRegion(1, 1, true);
    const r = regionAt(1, 1);
    plantHamlet(r);
    recomputeRegion(r);
    refreshLinks();
    recalcWorld();
    updateDemand();
    focusRegion(r);
    toast("New world · " + (GW * GH) + " regions of " + RS + "×" + RS);
  }

  function bindUi() {
    el("ui-speeds").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      setSpeed(Number(b.dataset.speed));
    });
    el("ui-sound").onclick = () => {
      audioOn = !audioOn;
      el("ui-sound").classList.toggle("off", !audioOn);
      if (audioOn) startAmbient();
      if (ambient) ambient.master.gain.value = audioOn ? 0.05 : 0;
    };
    el("ui-help").onclick = () => modal("How to play", [
      "<p>You are the planner of a region, and then of a world of them.</p>",
      "<ul>",
      "<li><b>Road</b> first. Zoned land only grows next to a road.</li>",
      "<li><b>Zone</b> homes, shops and works. The demand bars show what the world wants.</li>",
      "<li><b>Power, water, parks</b> reach a radius. A first building needs a road; a second storey needs power; a third needs water too.</li>",
      "<li><b>Regions</b> are 160×160 tiles. Claim neighbours on the world map (bottom right) for $15,000. Each one is a full city of its own.</li>",
      "<li><b>Connections</b> happen where a road on one border meets a road on the other. Connected regions share jobs, so people can live in one town and work in another.</li>",
      "<li><b>Milestones</b> at 120, 600, 2,500 and 8,000 people unlock parks, plazas, libraries and monuments.</li>",
      "</ul>",
      "<p><kbd>1</kbd>–<kbd>4</kbd> speed · <kbd>Space</kbd>+drag or right-drag to pan · wheel to zoom · inspect to read a tile.</p>",
    ].join(""));
    el("modal-close").onclick = () => el("modal").classList.add("hidden");
    el("ins-close").onclick = () => el("inspector").classList.add("hidden");
    el("ui-save").onclick = save;
    el("ui-load").onclick = () => load();
    el("ui-new").onclick = () => {
      if (!confirm("Start a new world? The current one is replaced.")) return;
      newWorld();
      renderTools(); refreshHud();
    };
    el("ui-claim").onclick = () => {
      const options = [];
      claimedList().forEach((r) => {
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const rx = r.rx + dx, ry = r.ry + dy;
          if (rx < 0 || ry < 0 || rx >= GW || ry >= GH) return;
          const existing = regionAt(rx, ry);
          if (existing && existing.claimed) return;
          if (options.some((o) => o.rx === rx && o.ry === ry)) return;
          options.push({ rx, ry });
        });
      });
      if (!options.length) { toast("Every region is claimed"); return; }
      if (claimRegion(options[0].rx, options[0].ry, false)) focusRegion(regionAt(options[0].rx, options[0].ry));
    };
  }

  function firstRun() {
    modal("Lattice City", [
      "<p>A world of regions, one of them awake.</p>",
      "<p><b>Your first three minutes:</b></p>",
      "<ul>",
      "<li>Pick <b>Road</b> and drag a line out from the hamlet.</li>",
      "<li>Paint <b>Homes</b> and <b>Shops</b> beside it. Buildings appear once the demand is there.</li>",
      "<li>Add a <b>Lattice tower</b> (power) and a <b>Water mill</b> when storeys stop appearing.</li>",
      "<li>At 120 people you unlock parks. At $15,000 you claim the next <b>region</b> on the world map — 160×160 tiles of new land, and roads that cross the border join the two towns.</li>",
      "</ul>",
      "<p>The line at the bottom of the map says what the world is doing.</p>",
    ].join(""));
  }

  function loadSprites() {
    return fetch("assets/tiles/manifest.json").then((r) => r.json()).then((man) => {
      const jobs = [];
      Object.keys(man).forEach((key) => {
        if (key === "unknown") return;
        const img = new Image();
        img.src = "assets/tiles/" + man[key][0];
        SPRITES[key] = img;
        jobs.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
      });
      (man.unknown || []).slice(0, 80).forEach((file, i) => {
        const img = new Image(); img.src = "assets/tiles/" + file;
        SPRITES["extra" + i] = img;
        jobs.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
      });
      return Promise.all(jobs);
    });
  }

  window.LC = {
    S, cam, RS, GW, GH, tick, paint, paintLine, claimRegion, regionOf, regionAt,
    screenToTile, tileToScreen, newWorld, save, load, setSpeed, focusOn, focusRegion,
    counts: () => {
      let road = 0, r = 0, c = 0, i = 0, built = 0;
      claimedList().forEach((reg) => {
        for (let k = 0; k < RS * RS; k++) {
          if (reg.road[k]) road++;
          if (reg.zone[k] === Z.R) r++;
          if (reg.zone[k] === Z.C) c++;
          if (reg.zone[k] === Z.I) i++;
          if (reg.level[k]) built++;
        }
      });
      return { road, zoneR: r, zoneC: c, zoneI: i, built, regions: claimedList().length, links: S.links.length };
    },
  };

  function boot() {
    try { bootInner(); } catch (err) {
      console.error(err);
      try { modal("Lattice City could not start", "<p>" + String(err && err.message || err) + "</p>"); } catch (e) {}
    }
  }

  function bootInner() {
    resize();
    bindInput();
    bindUi();
    let hasSave = false;
    try { hasSave = !!localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (hasSave) load();
    else newWorld();
    renderTools();
    refreshHud();
    let seen = false;
    try { seen = localStorage.getItem("latticeCity.seen3") === "1"; localStorage.setItem("latticeCity.seen3", "1"); } catch (e) {}
    if (!seen) firstRun();
    if (hasSave) log("Welcome back. The world kept its shape.");
    requestAnimationFrame(render);
  }

  loadSprites().then(boot).catch((err) => {
    // a boot failure must say so rather than leave a black canvas
    console.error(err);
    try {
      modal("Lattice City could not start", "<p>" + String(err && err.message || err) + "</p><p>Reload the page; if it repeats, the saved world can be replaced with the New map button.</p>");
    } catch (e) {}
  });
})();
