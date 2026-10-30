// F3 Debug Overlay Module
const DebugOverlay = (function() {
  let enabled = false;
  let overlayEl = null;
  let stats = {
    fps: 0,
    frameMs: 0,
    simMs: 0,
    visibleTiles: 0,
    chunksDrawn: 0,
    buildings: 0,
    entities: 0,
    saveBytes: 0
  };
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsUpdateTime = 0;

  function createOverlay() {
    if (overlayEl) return;
    overlayEl = document.createElement('div');
    overlayEl.id = 'debug-overlay';
    overlayEl.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.85);
      color: #0f0;
      font-family: 'Consolas', 'Monospace';
      font-size: 12px;
      line-height: 1.4;
      padding: 10px 14px;
      border-radius: 4px;
      z-index: 10000;
      pointer-events: none;
      min-width: 220px;
      text-shadow: 0 0 2px #000;
    `;
    document.body.appendChild(overlayEl);
    updateDisplay();
  }

  function updateDisplay() {
    if (!overlayEl) return;
    overlayEl.innerHTML = `
      <div><strong>LATTICE CITY DEBUG</strong></div>
      <div>FPS: ${stats.fps}</div>
      <div>Frame: ${stats.frameMs.toFixed(2)} ms</div>
      <div>Sim: ${stats.simMs.toFixed(2)} ms</div>
      <div>Visible Tiles: ${stats.visibleTiles}</div>
      <div>Chunks Drawn: ${stats.chunksDrawn}</div>
      <div>Buildings: ${stats.buildings}</div>
      <div>Entities: ${stats.entities}</div>
      <div>Save Size: ${formatBytes(stats.saveBytes)}</div>
    `;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function toggle() {
    enabled = !enabled;
    if (enabled) {
      createOverlay();
      overlayEl.style.display = 'block';
    } else if (overlayEl) {
      overlayEl.style.display = 'none';
    }
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  function updateFrameStats(frameMs, simMs) {
    if (!enabled) return;
    const now = performance.now();
    frameCount++;
    stats.frameMs = frameMs;
    stats.simMs = simMs;
    
    if (now - fpsUpdateTime >= 1000) {
      stats.fps = Math.round(frameCount * 1000 / (now - fpsUpdateTime));
      frameCount = 0;
      fpsUpdateTime = now;
      updateDisplay();
    }
  }

  function updateRenderStats(visibleTiles, chunksDrawn) {
    if (!enabled) return;
    stats.visibleTiles = visibleTiles;
    stats.chunksDrawn = chunksDrawn;
    updateDisplay();
  }

  function updateEntityStats(buildings, entities) {
    if (!enabled) return;
    stats.buildings = buildings;
    stats.entities = entities;
    updateDisplay();
  }

  function updateSaveStats(bytes) {
    if (!enabled) return;
    stats.saveBytes = bytes;
    updateDisplay();
  }

  // Keyboard handler
  function handleKeyDown(e) {
    if (e.code === 'F3') {
      e.preventDefault();
      toggle();
    }
  }

  // key handling lives in the main input handler (single toggle, no double-fire)

  return {
    toggle,
    isEnabled,
    updateFrameStats,
    updateRenderStats,
    updateEntityStats,
    updateSaveStats
  };
})();

// Export for global access if needed
window.DebugOverlay = DebugOverlay;
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
  // The city lives on the player's clock: no pause, no fast forward. The economy
  // still needs a beat, so one "district day" passes every TICK_SECONDS of real
  // time, whether or not the tab is in front.
  const TICK_SECONDS = 7;
  function localHour() {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  }
  const SAVE_KEY = "latticeCity.save.v3";
  function el(id) { return document.getElementById(id); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
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
    const RAIL = {
      0: "rail_straight_ns", 1: "rail_straight_ns", 2: "rail_straight_ew",
      3: "rail_curve_ne", 4: "rail_straight_ns", 5: "rail_straight_ns",
      6: "rail_curve_es", 7: "rail_tee_nes", 8: "rail_straight_ew",
      9: "rail_curve_wn", 10: "rail_straight_ew", 11: "rail_tee_ewn",
      12: "rail_curve_sw", 13: "rail_tee_nsw", 14: "rail_tee_ews",
      15: "rail_cross",
    };
    const Z = { NONE: 0, R: 1, C: 2, I: 3 };
  const TERRAIN = { MEADOW: 0, FOREST: 1, SAND: 2, WATER: 3, ROCK: 4, MOUNTAIN: 5 };

  // Region themes: a town's silhouette comes from the land it sits on. Every
  // sprite here is a single-tile building from the library, so no half-pairs.
  const THEMES = {
    oldtown: {
      label: "Old town",
      R: [["b01_cottage_red", "b02_tudor_inn"], ["b02_tudor_inn", "b01_cottage_red"], ["b20_noble_manor"]],
      C: [["b12_general_store"], ["b06_bakery", "b12_general_store"], ["b58_guildhall", "b14_town_hall"]],
      I: [["b03_blacksmith_forge"], ["b11_carpenter_sawmill"], ["b57_observatory", "b13_barn_silo"]],
    },
    chapel: {
      label: "Chapel town",
      R: [["b01_cottage_red"], ["b02_tudor_inn", "b09_chapel"], ["b20_noble_manor"]],
      C: [["b12_general_store"], ["b06_bakery"], ["b67_stone_chapel", "b15_library_scholar"]],
      I: [["b03_blacksmith_forge"], ["b13_barn_silo"], ["b11_carpenter_sawmill"]],
    },
    mill: {
      label: "Mill country",
      R: [["b01_cottage_red", "b04_windmill"], ["b02_tudor_inn"], ["b59_conservatory", "b18_greenhouse_orangery"]],
      C: [["b12_general_store"], ["b06_bakery"], ["b16_alchemist_workshop"]],
      I: [["b04_windmill", "b05_watermill"], ["b11_carpenter_sawmill"], ["b60_brewery", "b13_barn_silo"]],
    },
    watch: {
      label: "Watch country",
      R: [["b01_cottage_red"], ["b65_shepherd_croft", "b02_tudor_inn"], ["b20_noble_manor"]],
      C: [["b12_general_store"], ["b68_watch_hut", "b08_watchtower"], ["b14_town_hall"]],
      I: [["b03_blacksmith_forge"], ["b11_carpenter_sawmill"], ["b66_whisky_barn", "b17_twin_gatehouse"]],
    },
    harbour: {
      label: "Harbour",
      R: [["b01_cottage_red"], ["b61_fisher_hut", "b02_tudor_inn", "b19_lighthouse_dock"], ["b64_lighthouse_cottage", "b20_noble_manor"]],
      C: [["b12_general_store"], ["b06_bakery", "b07_apothecary"], ["b62_chandlery", "b14_town_hall"]],
      I: [["b05_watermill"], ["b13_barn_silo"], ["b63_drydock_shed", "b11_carpenter_sawmill"]],
    },
  }

  // ---------------------------------------------------------------- landmarks
  // Major landmarks that give each region a distinct silhouette.
  // Placed at generation time on suitable terrain.
  const LANDMARKS = [
    // Water/coastal landmarks
    { key: "l01_harbor_estuary_seagate", terrains: [3], coast: true, weight: 1 },
    { key: "l02_coastal_sea_arch_cliff", terrains: [3, 4], coast: true, weight: 1 },
    { key: "l04_bamboo_torii_sanctuary", terrains: [0, 1], weight: 2 },
    { key: "l05_desert_pyramid_ruin", terrains: [2], weight: 1 },
    { key: "l06_savanna_acacia_waterhole", terrains: [0], weight: 2 },
    { key: "l07_wildlife_dolphins", terrains: [3], weight: 2 },
    { key: "l08_wildlife_whale", terrains: [3], weight: 1 },
    { key: "l09_wildlife_sea_turtles", terrains: [3, 2], coast: true, weight: 2 },
    { key: "l10_wildlife_pelagic_pod", terrains: [3], weight: 1 },
    { key: "l11_volcanic_caldera_island", terrains: [3, 4], weight: 1 },
    { key: "l12_geothermal_hotspring_onsen", terrains: [4, 5], weight: 2 },
    { key: "l13_wildlife_flamingos", terrains: [3, 2], coast: true, weight: 2 },
    { key: "l14_wildlife_pelicans", terrains: [3, 2], coast: true, weight: 2 },
    { key: "l15_wildlife_arctic_foxes", terrains: [4, 5], weight: 1 },
    { key: "l16_cypress_marsh_boardwalk", terrains: [3, 0], coast: true, weight: 2 },
    { key: "l17_coastal_tidal_saltworks", terrains: [2, 3], coast: true, weight: 2 },
    { key: "l18_heron_alligator_marsh", terrains: [3, 0], coast: true, weight: 1 },
    { key: "l19_gondola_lagoon_fleet", terrains: [3], weight: 1 },
    { key: "l20_coastal_wharf_boathouse", terrains: [3], coast: true, weight: 2 },
    { key: "l21_terraced_rice_paddy", terrains: [0], weight: 2 },
    { key: "l22_crystal_cavern_mine", terrains: [4, 5], weight: 1 },
    { key: "l23_royal_coach_procession", terrains: [0], weight: 1 },
    { key: "l24_water_buffalo_peacock", terrains: [0], weight: 1 },
    { key: "l25_highland_cattle_pasture", terrains: [0, 4], weight: 2 },
    { key: "l26_husky_dog_sled_trail", terrains: [4, 5], weight: 1 },
    { key: "l27_ancient_ruined_aqueduct", terrains: [0, 4], weight: 1 },
    { key: "l28_log_boom_millpond", terrains: [3], coast: true, weight: 2 },
    { key: "l29_ox_logging_wagon_bear", terrains: [1], weight: 1 },
    { key: "l30_town_crier_plaza", terrains: [0], weight: 2 },
    { key: "l31_pearl_diver_atoll", terrains: [3], weight: 1 },
    { key: "l32_desert_qanat_garden", terrains: [2], weight: 2 },
    { key: "l33_chinese_junk_outrigger", terrains: [3], weight: 1 },
    { key: "l34_ostrich_desert_savanna", terrains: [2, 0], weight: 1 },
    { key: "l35_arctic_aurora_station", terrains: [4, 5], weight: 1 },
    { key: "l36_savanna_baobab_waterhole", terrains: [0], weight: 2 },
    { key: "l37_giraffe_bactrian_camel", terrains: [2, 0], weight: 1 },
    { key: "l38_potter_donkey_cart", terrains: [0], weight: 2 },
    { key: "l39_monastery_cloister", terrains: [0, 4], weight: 1 },
    { key: "l40_underground_river_grotto", terrains: [4, 5], weight: 1 },
    { key: "l41_wine_barrel_dray_falconer", terrains: [0], weight: 2 },
    { key: "l42_monk_scribe_procession", terrains: [0, 1], weight: 1 },
    { key: "l43_glacial_ice_shrine", terrains: [4, 5], weight: 1 },
    { key: "l44_terraced_tea_plantation", terrains: [0, 1], weight: 2 },
    { key: "l45_steam_traction_jester_troupe", terrains: [0], weight: 1 },
    { key: "l46_tea_picker_masked_troupe", terrains: [0, 1], weight: 1 },
    { key: "l47_nabataean_treasury_canyon", terrains: [4, 2], weight: 1 },
    { key: "l48_alpine_stupa_prayer_flag", terrains: [4, 5], weight: 1 },
    { key: "l49_tibetan_yak_tuareg_camel", terrains: [4, 5], weight: 1 },
    { key: "l50_glass_merchant_carts", terrains: [0], weight: 2 },
  ];

  // Landmark placement: each region gets 1-3 landmarks based on its terrain
  function placeLandmarks(r) {
    r.landmarks = [];
    if (!r.theme) return;

    // Determine candidate landmarks for this region's terrain mix
    let water = 0, forest = 0, rock = 0, sand = 0, mountain = 0;
    for (let i = 0; i < RS * RS; i++) {
      const t = r.terrain[i];
      if (t === 3) water++;
      else if (t === 1) forest++;
      else if (t === 4) rock++;
      else if (t === 2) sand++;
      else if (t === 5) mountain++;
    }

    const terrainCounts = {
      0: RS * RS - water - forest - rock - sand - mountain,
      1: forest,
      2: sand,
      3: water,
      4: rock,
      5: mountain,
    };

    // Filter landmarks that match this region's terrain
    const candidates = LANDMARKS.filter((lm) => {
      return lm.terrains.some((t) => terrainCounts[t] > RS * RS * 0.02);
    });

    if (!candidates.length) return;

    // Weight by theme affinity and terrain abundance
    const themeAffinities = {
      harbour: { water: 2, sand: 1.5 },
      watch: { rock: 2, mountain: 1.5 },
      mill: { forest: 1.5, sand: 1.5 },
      chapel: { meadow: 1.5 },
      oldtown: { meadow: 1.2 },
    };
    const affinity = themeAffinities[r.theme] || {};

    // Score each candidate
    const scored = candidates.map((lm) => {
      let score = lm.weight;
      lm.terrains.forEach((t) => {
        const terrainNames = { 0: "meadow", 1: "forest", 2: "sand", 3: "water", 4: "rock", 5: "mountain" };
        const tn = terrainNames[t];
        if (affinity[tn]) score *= affinity[tn];
        score *= Math.min(2, terrainCounts[t] / (RS * RS * 0.05));
      });
      // Coast requirement: needs water adjacent to land
      if (lm.coast) {
        let hasCoast = false;
        for (let i = 0; i < RS * RS; i++) {
          if (r.terrain[i] === 3) {
            const gx = r.rx * RS + (i % RS), gy = r.ry * RS + ((i / RS) | 0);
            const nbrs = [[0,-1],[1,0],[0,1],[-1,0]];
            for (const [dx,dy] of nbrs) {
              const n = regionOf(gx+dx, gy+dy);
              if (n && n.r.terrain[n.i] !== 3) { hasCoast = true; break; }
            }
            if (hasCoast) break;
          }
        }
        if (!hasCoast) score *= 0.1;
      }
      return { lm, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Place 1-3 landmarks
    const num = 1 + Math.floor(Math.random() * 3);
    const placed = [];
    for (let pi = 0; pi < num && pi < scored.length; pi++) {
      const { lm } = scored[pi];
      // Find a valid tile for this landmark
      let bestTile = -1, bestScore = -1;
      for (let i = 0; i < RS * RS; i++) {
        if (r.road[i] || r.zone[i] || r.level[i] || r.svc[i] || r.landmarks.some(l => l.i === i)) continue;
        const terr = r.terrain[i];
        if (!lm.terrains.includes(terr)) continue;
        // Coast check
        if (lm.coast) {
          const gx = r.rx * RS + (i % RS), gy = r.ry * RS + ((i / RS) | 0);
          let hasCoast = false;
          const nbrs = [[0,-1],[1,0],[0,1],[-1,0]];
          for (const [dx,dy] of nbrs) {
            const n = regionOf(gx+dx, gy+dy);
            if (n && n.r.terrain[n.i] !== 3) { hasCoast = true; break; }
          }
          if (!hasCoast) continue;
        }
        // Prefer flat areas (not on steep slopes)
        const h = hash2(r.rx * RS + (i % RS), r.ry * RS + ((i / RS) | 0));
        if (h > bestScore) { bestScore = h; bestTile = i; }
      }
      if (bestTile >= 0) {
        r.landmarks.push({ key: lm.key, i: bestTile });
        placed.push(lm.key);
      }
    }
  }

;

  function themeSprite(theme, zone, level) {
    const t = THEMES[theme] || THEMES.oldtown;
    const table = zone === Z.R ? t.R : zone === Z.C ? t.C : t.I;
    const options = table[Math.max(0, Math.min(2, level - 1))] || table[0];
    return options[0];
  }

  function themeVariant(theme, zone, level, gx, gy) {
    const t = THEMES[theme] || THEMES.oldtown;
    const table = zone === Z.R ? t.R : zone === Z.C ? t.C : t.I;
    const options = table[Math.max(0, Math.min(2, level - 1))] || table[0];
    return options[Math.floor(hash2(gx, gy) * options.length) % options.length];
  }

  function pickTheme(terrain, rx, ry) {
    let water = 0, forest = 0, rock = 0, sand = 0;
    for (let i = 0; i < terrain.length; i++) {
      const t = terrain[i];
      if (t === TERRAIN.WATER) water++;
      else if (t === TERRAIN.FOREST) forest++;
      else if (t === TERRAIN.ROCK) rock++;
      else if (t === TERRAIN.SAND) sand++;
    }
    const n = terrain.length;
    if (water / n > 0.11) return "harbour";
    if (rock / n > 0.055) return "watch";
    if (sand / n > 0.07) return "mill";
    if (forest / n > 0.17) return "mill";
    // meadow country still varies town to town, so neighbours never look the same
    const keys = ["oldtown", "chapel", "mill", "watch"];
    return keys[Math.floor(hash2(rx * 7 + 3, ry * 11 + 5) * keys.length) % keys.length];
  }

  // Appending to SVC is safe for old saves: the array index is what a save stores.
  const SVC = [null, "park", "water", "power", "plaza", "school", "monument", "dock", "rail", "fire", "police"];
  const SVC_SPRITE = {
    park: "d04_oak_tree_park", water: "b05_watermill", power: "b10_wizard_tower",
    plaza: "d01_plaza_fountain", school: "b15_library_scholar", monument: "d08_stone_statue_plaza",
    dock: "b69_ferry_terminal",
    rail: "b17_twin_gatehouse",
    fire: "b08_watchtower",
    police: "b17_twin_gatehouse",
  };
  const SVC_RULE = {
    park: { radius: 4, value: 4, upkeep: 2 },
    plaza: { radius: 5, value: 12, upkeep: 4 },
    water: { radius: 9, upkeep: 8 },
    power: { radius: 10, upkeep: 14 },
    school: { radius: 8, value: 10, upkeep: 12 },
    monument: { radius: 12, value: 30, upkeep: 20 },
    dock: { radius: 0, upkeep: 6 },
    rail: { radius: 0, upkeep: 16 },
    fire: { radius: 8, upkeep: 10 },
    police: { radius: 9, upkeep: 12, safety: 1 },
  };

  const TOOLS = [
    { id: "road", name: "Road", cost: 12, hint: "bridge $180 · pass $90" },
    { id: "zoneR", name: "Homes", cost: 24, hint: "people live here", zone: Z.R },
    { id: "zoneC", name: "Shops", cost: 30, hint: "jobs + tax", zone: Z.C },
    { id: "zoneI", name: "Works", cost: 34, hint: "jobs, some smog", zone: Z.I },
    { id: "park", name: "Park", cost: 120, hint: "+ land value", service: "park", unlock: 1 },
    { id: "water", name: "Water mill", cost: 480, hint: "water radius", service: "water" },
    { id: "power", name: "Lattice tower", cost: 850, hint: "power radius", service: "power" },
        { id: "dock", name: "Ferry dock", cost: 1400, hint: "links regions by water", service: "dock" },
        { id: "rail", name: "Rail depot", cost: 2200, hint: "the strongest region link", service: "rail" },
        { id: "railTrack", name: "Rail track", cost: 80, hint: "lay tracks on land" },
        { id: "fire", name: "Fire station", cost: 900, hint: "stops fires", service: "fire" },
        { id: "clinic", name: "Medical clinic", cost: 600, hint: "ambulance dispatch", service: "school", unlock: 1 },
        { id: "police", name: "Police station", cost: 1200, hint: "cuts crime", service: "police", unlock: 2 },
        { id: "plaza", name: "Plaza", cost: 340, hint: "big value", service: "plaza", unlock: 2 },
    { id: "school", name: "Library", cost: 900, hint: "value + mood", service: "school", unlock: 3 },
    { id: "monument", name: "Monument", cost: 3200, hint: "the world remembers", service: "monument", unlock: 4 },
    { id: "bulldoze", name: "Bulldoze", cost: 6, hint: "remove" },
        { id: "inspect", name: "Inspect", cost: 0, hint: "read a tile" },
        { id: "inspectCitizen", name: "Citizen", cost: 0, hint: "click a home to view residents", unlock: 1 },
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
    rci: { r: 0.55, c: 0.35, i: 0.3, homes: 0, shops: 0, industry: 0, ic: 0.86 },
    taxRate: 7,                 // percent, SimCity default; 7-9 is the workable band
    ordinances: { fines: false, cleanAir: false, watch: false, greenbelt: false },
    taxIncome: 0, bonds: 0, bondRate: 0.06,
    pop: 0, jobs: 0, mood: 60, income: 0, upkeep: 0, shopCap: 0, indCap: 0,
    links: [], peds: [], cars: [], boats: [], smoke: [], clouds: [],
    rain: 0, rainTarget: 0, weatherTimer: 0, lastAnnounce: -99,
    event: null, nextEventDay: 26, eventHistory: [],
  };



  // ---------------------------------------------------------------- Unified Movement System
  // Single source of truth for all vehicle movement physics

  const MOVEMENT = {
    // Speeds in tiles per game second
    speeds: {
      pedestrian: 1.0,
      car: 1.8,
      bus: 1.4,
      truck: 1.3,
      fireTruck: 2.5,
      ambulance: 3.0,
      policeCar: 3.5,
      train: 0.085,    // tiles per game second along track
      ferry: 0.07,     // tiles per game second on water
      boat: 0.05,      // wandering boats
    },
    // Acceleration/deceleration (tiles/s^2)
    accel: 0.5,
    decel: 0.8,
    // Turn rate (radians per second)
    turnRate: Math.PI / 2,
  };

  // Path following state machine
  const VehicleState = {
    IDLE: "idle",
    PATHING: "pathing",      // computing path
    MOVING: "moving",        // following route
    WAITING: "waiting",      // at waypoint/stop
    ARRIVED: "arrived",      // at destination
    RETURNING: "returning",  // going back to depot
  };

  // Unified vehicle structure
  function createVehicle(type, x, y, homeX, homeY, depotId) {
    return {
      id: 0,  // assigned by fleet manager
      type: type,
      x: x, y: y,
      homeX: homeX, homeY: homeY,
      depotId: depotId,
      state: VehicleState.IDLE,
      route: null,      // array of {x, y} waypoints
      routeIndex: 0,
      target: null,     // {x, y} or entity id
      speed: MOVEMENT.speeds[type] || 1.0,
      heading: 0,       // radians
      waitTimer: 0,
      dispatchedAt: 0,
      eta: 0,
    };
  }

  // Fleet manager for each vehicle type
  const fleets = {
    cars: [],
    fireTrucks: [],
    ambulances: [],
    policeCars: [],
    trains: [],
    ferries: [],
    boats: [],
  };

  function getFleet(type) {
    const map = {
      car: "cars", bus: "cars", truck: "cars",
      fireTruck: "fireTrucks",
      ambulance: "ambulances",
      policeCar: "policeCars",
      train: "trains",
      ferry: "ferries",
      boat: "boats",
    };
    return fleets[map[type] || "cars"];
  }

  // Unified path request
  function requestPath(startX, startY, goalX, goalY, vehicleType) {
    // Use appropriate pathfinder based on vehicle type
    if (vehicleType === "train") return findRailPath(startX, startY, goalX, goalY);
    if (vehicleType === "ferry") return findWaterPath(startX, startY, goalX, goalY);
    if (vehicleType === "boat") return findWaterPath(startX, startY, goalX, goalY);
    return findRoadPath(startX, startY, goalX, goalY);
  }

  // Rail pathfinding - follows rail tiles
  function findRailPath(startX, startY, goalX, goalY) {
    // A* on rail tiles only
    const open = [];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    const key = (x, y) => x + "," + y;
    const startKey = key(startX, startY);
    const goalKey = key(goalX, goalY);
    gScore.set(startKey, 0);
    fScore.set(startKey, Math.abs(startX - goalX) + Math.abs(startY - goalY));
    open.push({ key: startKey, x: startX, y: startY, f: fScore.get(startKey) });

    while (open.length > 0) {
      let bestIdx = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bestIdx].f) bestIdx = i;
      const current = open.splice(bestIdx, 1)[0];
      if (current.key === goalKey) {
        const path = [];
        let curr = current.key;
        while (cameFrom.has(curr)) {
          const [x, y] = curr.split(",").map(Number);
          path.unshift({ x, y });
          curr = cameFrom.get(curr);
        }
        const [sx, sy] = curr.split(",").map(Number);
        path.unshift({ x: sx, y: sy });
        return path;
      }
      const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (const [dx, dy] of dirs) {
        const nx = current.x + dx, ny = current.y + dy;
        const nKey = key(nx, ny);
        const tile = regionOf(nx, ny);
        if (!tile || !tile.r.rail[tile.i]) continue;
        const tentativeG = gScore.get(current.key) + 1;
        if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
          cameFrom.set(nKey, current.key);
          gScore.set(nKey, tentativeG);
          fScore.set(nKey, tentativeG + Math.abs(nx - goalX) + Math.abs(ny - goalY));
          if (!open.some(o => o.key === nKey)) open.push({ key: nKey, x: nx, y: ny, f: fScore.get(nKey) });
        }
      }
    }
    return null;
  }

  // Water pathfinding - follows water tiles
  function findWaterPath(startX, startY, goalX, goalY) {
    const open = [];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    const key = (x, y) => x + "," + y;
    const startKey = key(startX, startY);
    const goalKey = key(goalX, goalY);
    gScore.set(startKey, 0);
    fScore.set(startKey, Math.abs(startX - goalX) + Math.abs(startY - goalY));
    open.push({ key: startKey, x: startX, y: startY, f: fScore.get(startKey) });

    while (open.length > 0) {
      let bestIdx = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bestIdx].f) bestIdx = i;
      const current = open.splice(bestIdx, 1)[0];
      if (current.key === goalKey) {
        const path = [];
        let curr = current.key;
        while (cameFrom.has(curr)) {
          const [x, y] = curr.split(",").map(Number);
          path.unshift({ x, y });
          curr = cameFrom.get(curr);
        }
        const [sx, sy] = curr.split(",").map(Number);
        path.unshift({ x: sx, y: sy });
        return path;
      }
      const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (const [dx, dy] of dirs) {
        const nx = current.x + dx, ny = current.y + dy;
        const nKey = key(nx, ny);
        const tile = regionOf(nx, ny);
        if (!tile || tile.r.terrain[tile.i] !== TERRAIN.WATER) continue;
        const tentativeG = gScore.get(current.key) + 1;
        if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
          cameFrom.set(nKey, current.key);
          gScore.set(nKey, tentativeG);
          fScore.set(nKey, tentativeG + Math.abs(nx - goalX) + Math.abs(ny - goalY));
          if (!open.some(o => o.key === nKey)) open.push({ key: nKey, x: nx, y: ny, f: fScore.get(nKey) });
        }
      }
    }
    return null;
  }

  // Unified vehicle update - call once per frame for all fleets
  function updateAllVehicles(dt) {
    const gameSeconds = dt * (S.speed || 1) * 86400;
    
    Object.values(fleets).forEach(fleet => {
      fleet.forEach(v => {
        if (v.state === VehicleState.MOVING && v.route && v.route.length > 1) {
          moveAlongRoute(v, gameSeconds);
        } else if (v.state === VehicleState.WAITING) {
          v.waitTimer -= gameSeconds;
          if (v.waitTimer <= 0) v.state = VehicleState.MOVING;
        } else if (v.state === VehicleState.RETURNING) {
          returnToDepot(v, gameSeconds);
        }
      });
    });
  }

  function moveAlongRoute(v, dt) {
    const speed = MOVEMENT.speeds[v.type] || 1.0;
    const dist = speed * dt;
    
    // Move along route
    let remaining = dist;
    while (remaining > 0 && v.routeIndex < v.route.length - 1) {
      const curr = v.route[v.routeIndex];
      const next = v.route[v.routeIndex + 1];
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const segLen = Math.hypot(dx, dy);
      
      if (segLen <= remaining) {
        remaining -= segLen;
        v.routeIndex++;
        v.x = next.x;
        v.y = next.y;
        v.heading = Math.atan2(dy, dx);
      } else {
        // Move partway along segment
        const ratio = remaining / segLen;
        v.x = curr.x + dx * ratio;
        v.y = curr.y + dy * ratio;
        v.heading = Math.atan2(dy, dx);
        remaining = 0;
      }
    }
    
    // Check arrival
    if (v.routeIndex >= v.route.length - 1) {
      v.state = VehicleState.ARRIVED;
      onVehicleArrived(v);
    }
  }

  function returnToDepot(v, dt) {
    if (!v.route) {
      // Compute return path
      v.route = requestPath(Math.round(v.x), Math.round(v.y), v.homeX, v.homeY, v.type);
      v.routeIndex = 0;
      if (!v.route || v.route.length < 2) {
        v.state = VehicleState.IDLE;
        v.x = v.homeX; v.y = v.homeY;
        return;
      }
    }
    moveAlongRoute(v, dt);
    if (v.state === VehicleState.ARRIVED) {
      v.state = VehicleState.IDLE;
      v.route = null;
    }
  }

  function onVehicleArrived(v) {
    if (v.type === "fireTruck" && v.target) {
      const fire = activeFires.find(f => f.id === v.target);
      if (fire) fire.assignedTrucks.push(v.id);
    } else if (v.type === "ambulance" && v.target) {
      const call = medicalCalls.find(c => c.id === v.target);
      if (call) { call.status = "transporting"; v.state = VehicleState.RETURNING; }
    } else if (v.type === "policeCar" && v.target) {
      const call = policeCalls.find(c => c.id === v.target);
      if (call) call.status = "resolving";
    }
  }

  // Dispatch helpers using unified system
  function dispatchVehicle(type, startX, startY, goalX, goalY, target, depotId) {
    const fleet = getFleet(type);
    const idle = fleet.find(v => v.state === VehicleState.IDLE);
    if (!idle) return null;
    
    const path = requestPath(startX, startY, goalX, goalY, type);
    if (!path) return null;
    
    idle.state = VehicleState.MOVING;
    idle.route = path;
    idle.routeIndex = 0;
    idle.target = target;
    idle.dispatchedAt = S.hour * 3600 + S.day * 86400;
    const dist = path.length;
    idle.eta = idle.dispatchedAt + dist / (MOVEMENT.speeds[type] || 1.0);
    
    return idle;
  }


  // ---------------------------------------------------------------- Emergency Response
  // Real logistics: fire trucks, ambulances, police with actual pathfinding,
  // real-time movement, ETA calculation, and TTS dispatch announcements.

  const EMERGENCY = {
    trucksPerStation: [0, 1, 2, 3],
    fireSpeed: 2.5,
    ambulanceSpeed: 3.0,
    policeSpeed: 3.5,
    fireSpreadInterval: 30,
    fireDamagePerTick: 0.1,
  };

  let fireTrucks = [];
  let ambulances = [];
  let policeCars = [];
  let activeFires = [];
  let eventLog = [];
  let eventIdCounter = 0;

  let ttsEnabled = true;
    let ttsVoice = null;
    let ttsQueue = [];
    let ttsSpeaking = false;
    let ttsBroadcastTimer = null;
    let ttsPendingBroadcasts = [];

    function silenceTTS() {
      ttsPendingBroadcasts.length = 0;
      ttsQueue.length = 0;
      ttsSpeaking = false;
      if (ttsBroadcastTimer) { clearInterval(ttsBroadcastTimer); ttsBroadcastTimer = null; }
      try { if ("speechSynthesis" in window) speechSynthesis.cancel(); } catch (e) {}
    }

    function initTTS() {
      if (!("speechSynthesis" in window)) return;
      const pickVoice = () => {
        const voices = speechSynthesis.getVoices();
        ttsVoice = voices.find(v => v.lang === "en-GB" && /male/i.test(v.name)) ||
                   voices.find(v => v.lang === "en-GB") ||
                   voices.find(v => v.lang === "en-US" && /male/i.test(v.name)) ||
                   voices[0] || null;
      };
      pickVoice();
      speechSynthesis.addEventListener("voiceschanged", pickVoice);
      ttsEnabled = !!OPT.tts;
      if (ttsEnabled) startTTSBroadcast();
    }

    function startTTSBroadcast() {
      if (ttsBroadcastTimer) clearInterval(ttsBroadcastTimer);
      // Broadcast every 45 seconds
      ttsBroadcastTimer = setInterval(() => {
        if (ttsPendingBroadcasts.length > 0 && ttsEnabled) {
          const batch = ttsPendingBroadcasts.splice(0, ttsPendingBroadcasts.length);
          broadcastNews(batch);
        }
      }, 45000);
    }

    function queueBroadcast(text, priority = "normal") {
      if (!ttsEnabled) return;
      ttsPendingBroadcasts.push({ text, priority, time: Date.now() });
    }

    function broadcastNews(items) {
      if (!ttsEnabled || !items.length) return;
      if (!("speechSynthesis" in window)) return;
    
      // News anchor intro
      const hour = new Date().getHours();
      const timeStr = hour === 0 ? "midnight" : hour === 12 ? "noon" : 
                      hour > 12 ? (hour - 12) + " PM" : hour + " AM";
    
      let broadcastText = "Lattice City News at " + timeStr + ". ";
    
      if (items.length === 1) {
        broadcastText += items[0].text;
      } else {
        broadcastText += "Multiple incidents reported. " + 
          items.map((item, i) => (i + 1) + ". " + item.text).join(" ") + ".";
      }
    
      broadcastText += " All units responding. Stay informed.";
    
      const utter = new SpeechSynthesisUtterance(broadcastText);
      utter.voice = ttsVoice;
      utter.rate = 0.95; // Slightly slower for news anchor feel
      utter.pitch = 0.95;
      utter.volume = 0.7 * (OPT.master / 100);
      utter.lang = "en-GB";
      if (!ttsEnabled) return;
      speechSynthesis.speak(utter);
    }

    function speak(text, priority = "normal") {
      if (!ttsEnabled || !("speechSynthesis" in window)) return;
      // For immediate high-priority, speak directly; otherwise queue for broadcast
      if (priority === "emergency") {
        const utter = new SpeechSynthesisUtterance(text);
        utter.voice = ttsVoice;
        utter.rate = 1.05;
        utter.pitch = 1.0;
        utter.volume = 0.8 * (OPT.master / 100);
        utter.lang = "en-GB";
        if (!ttsEnabled) return;
        speechSynthesis.speak(utter);
      } else {
        queueBroadcast(text, priority);
      }
    }

    function processTTSQueue() {
      if (!ttsEnabled || ttsSpeaking || ttsQueue.length === 0) return;
      ttsSpeaking = true;
      speechSynthesis.speak(ttsQueue.shift());
    }

  function logEvent(type, message, location = null, priority = "normal", speakText = null) {
    const id = ++eventIdCounter;
    const event = { id, time: Date.now(), type, message, location, priority, tts: speakText || (priority === "emergency" ? message : null) };
    eventLog.unshift(event);
    if (eventLog.length > 50) eventLog.pop();
    if (priority === "emergency") toast(message);
    if (event.tts) speak(event.tts, priority);
    updateEventLogUI();
    return event;
  }

  function findRoadPath(startGx, startGy, goalGx, goalGy) {
    const open = [];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    const key = (x, y) => x + "," + y;
    const startKey = key(startGx, startGy);
    const goalKey = key(goalGx, goalGy);
    gScore.set(startKey, 0);
    fScore.set(startKey, Math.abs(startGx - goalGx) + Math.abs(startGy - goalGy));
    open.push({ key: startKey, gx: startGx, gy: startGy, f: fScore.get(startKey) });

    while (open.length > 0) {
      let bestIdx = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bestIdx].f) bestIdx = i;
      const current = open.splice(bestIdx, 1)[0];
      if (current.key === goalKey) {
        const path = [];
        let curr = current.key;
        while (cameFrom.has(curr)) {
          const [x, y] = curr.split(",").map(Number);
          path.unshift({ x, y });
          curr = cameFrom.get(curr);
        }
        const [sx, sy] = curr.split(",").map(Number);
        path.unshift({ x: sx, y: sy });
        return path;
      }
      const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (const [dx, dy] of dirs) {
        const nx = current.gx + dx, ny = current.gy + dy;
        const nKey = key(nx, ny);
        const tile = regionOf(nx, ny);
        if (!tile || !tile.r.road[tile.i]) continue;
        const tentativeG = gScore.get(current.key) + 1;
        if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
          cameFrom.set(nKey, current.key);
          gScore.set(nKey, tentativeG);
          fScore.set(nKey, tentativeG + Math.abs(nx - goalGx) + Math.abs(ny - goalGy));
          if (!open.some(o => o.key === nKey)) open.push({ key: nKey, gx: nx, gy: ny, f: fScore.get(nKey) });
        }
      }
    }
    return null;
  }

  function getFireStations() {
    const stations = [];
    claimedList().forEach(r => {
      for (let i = 0; i < RS * RS; i++) {
        if (SVC[r.svc[i]] === "fire") {
          stations.push({
            region: r, tile: i,
            gx: r.rx * RS + (i % RS), gy: r.ry * RS + ((i / RS) | 0),
            level: r.level[i] || 1,
            trucks: EMERGENCY.trucksPerStation[Math.min(3, r.level[i] || 1)]
          });
        }
      }
    });
    return stations;
  }

  function stationId(station) { return station.region.rx + "," + station.region.ry + "," + station.tile; }

  function countIdleTrucks(station) {
    return fireTrucks.filter(t => t.stationId === stationId(station) && t.state === "idle").length;
  }

  function dispatchToFire(fire) {
      const stations = getFireStations();
      if (!stations.length) {
        if (!fire.noStationsLogged) {
          fire.noStationsLogged = true;
          logEvent("fire", "NO FIRE STATIONS AVAILABLE - Structure fire uncontrolled!", { gx: fire.gx, gy: fire.gy }, "emergency", "Alert! No fire stations in the city. The fire burns unchecked.");
        }
        return;
      }
      let bestStation = null, bestDist = Infinity, bestPath = null;
      for (const station of stations) {
        const idle = countIdleTrucks(station);
        if (idle <= 0) continue;
        const path = findRoadPath(station.gx, station.gy, fire.gx, fire.gy);
        if (!path) continue;
        const dist = path.length;
        if (dist < bestDist) { bestDist = dist; bestStation = station; bestPath = path; }
      }
      if (!bestStation) {
        if (!fire.noTrucksLogged) {
          fire.noTrucksLogged = true;
          logEvent("fire", "All fire trucks committed - no units available!", { gx: fire.gx, gy: fire.gy }, "emergency", "All fire units committed. Mutual aid requested.");
        }
        return;
      }
      const numTrucks = Math.min(fire.severity, countIdleTrucks(bestStation), 2);
      const trucksToSend = []; for (let i = 0; i < numTrucks; i++) { const t = dispatchVehicle("fireTruck", bestStation.gx, bestStation.gy, fire.gx, fire.gy, fire.id, stationId(bestStation)); if (t) trucksToSend.push(t); }
      if (trucksToSend.length === 0) return;
      const travelTime = bestDist / EMERGENCY.fireSpeed;
      const etaMinutes = Math.ceil(travelTime / 60 * 10) / 10;
      trucksToSend.forEach((truck, idx) => {
        truck.state = "responding"; truck.targetFire = fire.id; truck.route = bestPath; truck.routeIdx = 0;
        truck.dispatchedAt = S.hour * 3600 + S.day * 86400; truck.eta = truck.dispatchedAt + travelTime;
      });
      fire.assignedTrucks.push(...trucksToSend.map(t => t.id));
      const stationName = bestStation.region.name || "Region " + bestStation.region.rx + "," + bestStation.region.ry;
      const truckNames = trucksToSend.map(t => "Engine " + t.id).join(", ");
      logEvent("dispatch", truckNames + " dispatched from " + stationName + " - ETA " + etaMinutes + " minutes", { gx: fire.gx, gy: fire.gy }, "emergency", truckNames + " responding from " + stationName + ". Structure fire at " + fire.gx + "," + fire.gy + ". ETA " + etaMinutes + " minutes.");
    }

  function startFire(region, tileIdx) {
    const gx = region.rx * RS + (tileIdx % RS);
    const gy = region.ry * RS + ((tileIdx / RS) | 0);
    if (activeFires.some(f => f.gx === gx && f.gy === gy && !f.contained)) return;
    const severity = 1 + Math.floor(Math.random() * 2);
    const fire = { id: "fire_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6), region, tile: tileIdx, gx, gy, severity, startedAt: S.hour * 3600 + S.day * 86400, spreadTimer: EMERGENCY.fireSpreadInterval, assignedTrucks: [], contained: false, damage: 0 };
    activeFires.push(fire);
    logEvent("fire", "STRUCTURE FIRE - " + (region.name || "Unknown district") + " at " + gx + "," + gy + " - " + severity + "-alarm", { gx, gy }, "emergency", "Structure fire reported in " + (region.name || "the district") + " at " + gx + "," + gy + ". " + severity + "-alarm response initiated.");
    dispatchToFire(fire);
    S.fireTile = { x: gx, y: gy, until: S.day + 3 };
  }

  function updateFires(dt) {
    const gameSeconds = dt * (S.speed || 1) * 86400;
    for (let i = activeFires.length - 1; i >= 0; i--) {
      const fire = activeFires[i];
      if (fire.contained) continue;
      fire.spreadTimer -= gameSeconds;
      if (fire.spreadTimer <= 0) {
        fire.spreadTimer = EMERGENCY.fireSpreadInterval;
        const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (const [dx, dy] of dirs) {
          const tile = regionOf(fire.gx + dx, fire.gy + dy);
          if (!tile) continue;
          if ((tile.r.zone[tile.i] === Z.I || tile.r.zone[tile.i] === Z.C) && tile.r.level[tile.i] > 0 && Math.random() < 0.3) startFire(tile.r, tile.i);
        }
      }
      const onScene = fireTrucks.filter(t => t.targetFire === fire.id && t.state === "on_scene").length;
      if (onScene === 0) {
        fire.damage += EMERGENCY.fireDamagePerTick * gameSeconds / 60;
        if (fire.damage >= 1 && fire.region.level[fire.tile] > 0) {
          fire.region.level[fire.tile] = Math.max(0, fire.region.level[fire.tile] - 1);
          fire.damage = 0;
          logEvent("fire", "Fire damage - building reduced to level " + fire.region.level[fire.tile], { gx: fire.gx, gy: fire.gy }, "high");
        }
        if (fire.region.level[fire.tile] === 0) {
          fire.contained = true;
          logEvent("fire", "Structure collapsed - fire burned out", { gx: fire.gx, gy: fire.gy }, "high", "The structure has collapsed. Fire burned out.");
        }
      } else {
        fire.damage = Math.max(0, fire.damage - onScene * 0.05 * gameSeconds / 60);
        if (fire.damage <= 0.01) {
          fire.contained = true;
          fireTrucks.filter(t => t.targetFire === fire.id).forEach(t => { t.state = "returning"; t.targetFire = null; });
          logEvent("fire", "FIRE CONTAINED - All units returning", { gx: fire.gx, gy: fire.gy }, "emergency", "Fire under control. All units returning to quarters.");
        }
      }
    }
    activeFires = activeFires.filter(f => !f.contained || (S.hour * 3600 + S.day * 86400 - f.startedAt) < 3600);
  }

  function updateEmergencyVehicles(dt) {
    const rate = (S.speed == null ? 1 : S.speed);
    if (rate <= 0) return;
    const allUnits = fireTrucks.concat(ambulances).concat(policeCars);
    allUnits.forEach(unit => {
      const speed = unit.type === "fire" ? EMERGENCY.fireSpeed : unit.type === "ambulance" ? EMERGENCY.ambulanceSpeed : EMERGENCY.policeSpeed;
      const stepTiles = dt * rate * speed;          // tiles per real second, not per game day
      const moving = (unit.state === "responding" || unit.state === "returning" || unit.state === "patrol") && unit.route && unit.route.length > 1;
      if (moving) {
        unit.acc = (unit.acc || 0) + stepTiles;
        while (unit.acc >= 1 && unit.routeIdx < unit.route.length - 1) { unit.acc -= 1; unit.routeIdx++; }
        const p = unit.route[Math.min(unit.routeIdx, unit.route.length - 1)];
        if (p) { unit.x = p.x; unit.y = p.y; }
        if (unit.routeIdx >= unit.route.length - 1) {
          unit.route = null; unit.routeIdx = 0; unit.acc = 0;
          if (unit.state === "responding") {
            unit.state = "on_scene";
            if (unit.type === "fire") logEvent("arrival", "Engine " + unit.id + " on scene", { gx: unit.x, gy: unit.y }, "high", "Engine " + unit.id + " on scene. Beginning fire attack.");
          } else if (unit.state === "patrol") {
            unit.state = "returning";    // drive home after a patrol
          } else {
            unit.state = "idle";
            if (unit.parkX != null) { unit.x = unit.parkX; unit.y = unit.parkY; }
          }
        }
        return;
      }
      if (unit.state === "returning") {
        const tx = unit.parkX != null ? unit.parkX : unit.x, ty = unit.parkY != null ? unit.parkY : unit.y;
        const path = findRoadPath(unit.x, unit.y, tx, ty);
        if (path && path.length > 1) { unit.route = path; unit.routeIdx = 0; unit.acc = 0; }
        else { unit.state = "idle"; if (unit.parkX != null) { unit.x = unit.parkX; unit.y = unit.parkY; } }
        return;
      }
      if (unit.state === "idle" && Math.random() < 0.05) {
        const spots = (S.roadSpots || []).filter(s => Math.abs(s.x - unit.x) <= 10 && Math.abs(s.y - unit.y) <= 10);
        if (spots.length) {
          const dest = spots[(Math.random() * spots.length) | 0];
          const path = findRoadPath(unit.x, unit.y, dest.x, dest.y);
          if (path && path.length > 1) { unit.route = path; unit.routeIdx = 0; unit.acc = 0; unit.state = "patrol"; }
        }
      }
    });
  }

  // emergency units park on a road tile beside their station, never on the building tile
  function nearestRoadTile(gx, gy, maxR) {
    for (let rad = 1; rad <= (maxR || 5); rad++) {
      for (let dx = -rad; dx <= rad; dx++) {
        for (let dy = -rad; dy <= rad; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
          const t = regionOf(gx + dx, gy + dy);
          if (t && t.r.road[t.i]) return { x: gx + dx, y: gy + dy };
        }
      }
    }
    return null;
  }

  function initializeFireTrucks() {
      fireTrucks = [];
      let truckId = 1;
      getFireStations().forEach(station => {
        for (let t = 0; t < station.trucks; t++) {
      const park = nearestRoadTile(station.gx, station.gy, 5) || { x: station.gx, y: station.gy };
      fireTrucks.push({ id: truckId++, type: "fire", stationId: stationId(station), homeRegion: station.region, homeTile: station.tile, x: park.x, y: park.y, parkX: park.x, parkY: park.y, state: "idle", targetFire: null, route: null, routeIdx: 0, dispatchedAt: 0, eta: 0, returning: false });
        }
      });
    }

    function initializeAmbulances() {
      ambulances = [];
      let ambId = 1;
      getClinics().forEach(clinic => {
        for (let a = 0; a < clinic.ambulances; a++) {
      const park = nearestRoadTile(clinic.gx, clinic.gy, 5) || { x: clinic.gx, y: clinic.gy };
      ambulances.push({ id: ambId++, type: "ambulance", clinicId: clinicId(clinic), x: park.x, y: park.y, parkX: park.x, parkY: park.y, state: "idle", targetCall: null, route: null, routeIdx: 0 });
        }
      });
    }

    function initializePoliceCars() {
      policeCars = [];
      let carId = 1;
      getPoliceStations().forEach(station => {
        for (let c = 0; c < station.cars; c++) {
        const park = nearestRoadTile(station.gx, station.gy, 5) || { x: station.gx, y: station.gy };
        policeCars.push({ id: carId++, type: "police", stationId: station.region.rx + "," + station.region.ry + "," + station.tile, x: park.x, y: park.y, parkX: park.x, parkY: park.y, state: "idle", targetCall: null, route: null, routeIdx: 0 });
        }
      });
    }

    // ---------------------------------------------------------------- Medical / Ambulance System
      const MEDICAL = {
        EMERGENCY_TYPES: [
          { id: "heart", label: "Cardiac Emergency", weight: 3, urgency: "critical" },
          { id: "injury", label: "Serious Injury", weight: 5, urgency: "high" },
          { id: "illness", label: "Acute Illness", weight: 7, urgency: "medium" },
          { id: "accident", label: "Traffic Accident", weight: 2, urgency: "critical" },
        ],
        ambulanceSpeed: 3.0,
        ambulancesPerClinic: [0, 1, 2],
        responseRadius: 200,
        // Per-capita rates (events per person per day)
        BASE_RATE_PER_CAPITA: 0.0008,      // ~0.8 per 1000 people per day
        MIN_POPULATION: 150,               // No medical emergencies below this pop
        MAX_DAILY_EVENTS: 8,               // Cap daily events even for huge cities
      };

      let medicalCalls = [];
      let medicalDailyCount = 0;
      let medicalLastDay = -1;

      function getClinics() {
        const clinics = [];
        claimedList().forEach(r => {
          for (let i = 0; i < RS * RS; i++) {
            if (SVC[r.svc[i]] === "school") {
              clinics.push({ region: r, tile: i, gx: r.rx * RS + (i % RS), gy: r.ry * RS + ((i / RS) | 0), level: r.level[i] || 1, ambulances: MEDICAL.ambulancesPerClinic[Math.min(2, r.level[i] || 1)] });
            }
          }
        });
        return clinics;
      }

      function clinicId(clinic) { return clinic.region.rx + "," + clinic.region.ry + "," + clinic.tile; }

      function countIdleAmbulances(clinic) {
        return ambulances.filter(a => a.clinicId === clinicId(clinic) && a.state === "idle").length;
      }

      function spawnMedicalEmergency() {
        // Reset daily counter
        if (S.day !== medicalLastDay) {
          medicalDailyCount = 0;
          medicalLastDay = S.day;
        }
        if (medicalDailyCount >= MEDICAL.MAX_DAILY_EVENTS) return;

        // Population threshold
        if (S.pop < MEDICAL.MIN_POPULATION) return;

        // Per-capita probability scaled by population
        // At MIN_POPULATION: ~0.012% per tick (very rare)
        // At 1000 pop: ~0.08% per tick
        // At 5000 pop: ~0.4% per tick
        const perCapitaRate = MEDICAL.BASE_RATE_PER_CAPITA * (S.pop / 1000);
        const tickProbability = perCapitaRate / (86400 / TICK_SECONDS); // Convert daily rate to per-tick
        if (Math.random() > tickProbability) return;

        if (S.peds.length === 0) return;
        const ped = S.peds[Math.floor(Math.random() * S.peds.length)];
        if (!ped.path || ped.path.length === 0) return;
        const tile = ped.path[ped.at];
        if (!tile) return;
        const type = MEDICAL.EMERGENCY_TYPES[Math.floor(Math.random() * MEDICAL.EMERGENCY_TYPES.length)];
        const call = { id: "med_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6), type: type.id, label: type.label, urgency: type.urgency, patient: ped, gx: tile.x, gy: tile.y, time: S.hour * 3600 + S.day * 86400, assignedAmbulance: null, status: "waiting" };
        medicalCalls.push(call);
        medicalDailyCount++;
        logEvent("medical", type.label + " at " + tile.x + "," + tile.y + " - " + type.urgency.toUpperCase(), { gx: tile.x, gy: tile.y }, type.urgency === "critical" ? "emergency" : "high", type.label + " reported at " + tile.x + "," + tile.y + ". " + type.urgency + " priority.");
        dispatchAmbulance(call);
      }

    function dispatchAmbulance(call) {
          const clinics = getClinics();
          if (!clinics.length) {
            if (!call.noFacilitiesLogged) {
              call.noFacilitiesLogged = true;
              logEvent("medical", "NO MEDICAL FACILITIES - Patient without care!", { gx: call.gx, gy: call.gy }, "emergency", "No medical facilities available. Patient awaiting transport.");
            }
            return;
          }
          let bestClinic = null, bestDist = Infinity, bestPath = null;
          for (const clinic of clinics) {
            const idle = countIdleAmbulances(clinic);
            if (idle <= 0) continue;
            const path = findRoadPath(clinic.gx, clinic.gy, call.gx, call.gy);
            if (!path || path.length > MEDICAL.responseRadius) continue;
            if (path.length < bestDist) { bestDist = path.length; bestClinic = clinic; bestPath = path; }
          }
          if (!bestClinic) {
            logEvent("medical", "All ambulances committed or out of range!", { gx: call.gx, gy: call.gy }, "high");
            return;
          }
          const amb = dispatchVehicle("ambulance", bestClinic.gx, bestClinic.gy, call.gx, call.gy, call.id, clinicId(bestClinic));
          if (!amb) return;
          const travelTime = bestDist / MEDICAL.ambulanceSpeed;
          const etaMin = Math.ceil(travelTime / 60 * 10) / 10;
          amb.state = "responding"; amb.targetCall = call.id; amb.route = bestPath; amb.routeIdx = 0;
          amb.dispatchedAt = S.hour * 3600 + S.day * 86400; amb.eta = amb.dispatchedAt + travelTime;
          amb.clinicId = clinicId(bestClinic);
          call.assignedAmbulance = amb.id; call.status = "enroute";
          const clinicName = bestClinic.region.name || "Clinic " + bestClinic.region.rx + "," + bestClinic.region.ry;
          logEvent("dispatch", "Ambulance " + amb.id + " from " + clinicName + " - ETA " + etaMin + " min", { gx: call.gx, gy: call.gy }, call.urgency === "critical" ? "emergency" : "high", "Ambulance " + amb.id + " responding from " + clinicName + ". " + call.label + " at " + call.gx + "," + call.gy + ". ETA " + etaMin + " minutes.");
        }

    function updateMedicalCalls(dt) {
          const gameSeconds = dt * (S.speed || 1) * 86400;
          for (let i = medicalCalls.length - 1; i >= 0; i--) {
            const call = medicalCalls[i];
            if (call.status === "waiting") {
              // Only retry dispatch every 60 game seconds, not every 30
              if (Math.random() < gameSeconds / 60) dispatchAmbulance(call);
            } else if (call.status === "enroute") {
              const amb = ambulances.find(a => a.id === call.assignedAmbulance);
              if (amb && amb.state === "on_scene") {
                call.status = "transporting";
                amb.state = "returning";
                amb.route = null;
                logEvent("medical", "Patient loaded - transporting to hospital", { gx: call.gx, gy: call.gy }, "normal");
              }
            } else if (call.status === "transporting") {
              const amb = ambulances.find(a => a.id === call.assignedAmbulance);
              if (amb && amb.state === "idle") {
                call.status = "resolved";
                logEvent("medical", call.label + " resolved - patient treated", { gx: call.gx, gy: call.gy }, "normal");
                medicalCalls.splice(i, 1);
              }
            }
          }
        }

    // ---------------------------------------------------------------- Police / Law Enforcement
      const POLICE = {
        policeSpeed: 3.5,
        carsPerStation: [0, 1, 2],
        patrolInterval: 120,
        // Per-capita rates (events per person per day)
        BASE_RATE_PER_CAPITA: 0.0004,      // ~0.4 per 1000 people per day (lower than medical)
        MIN_POPULATION: 300,               // No police calls below this pop (crime needs density)
        MAX_DAILY_EVENTS: 6,               // Cap daily events
        // Crime scales with density and unemployment
        CRIME_DENSITY_FACTOR: 1.5,         // Higher density = more crime
        CRIME_UNEMPLOYMENT_FACTOR: 2.0,    // Higher unemployment = more crime
      };

      let policeCalls = [];
      let policeDailyCount = 0;
      let policeLastDay = -1;

      function getPoliceStations() {
        const stations = [];
        claimedList().forEach(r => {
          for (let i = 0; i < RS * RS; i++) {
            if (SVC[r.svc[i]] === "fire") {
              stations.push({ region: r, tile: i, gx: r.rx * RS + (i % RS), gy: r.ry * RS + ((i / RS) | 0), level: r.level[i] || 1, cars: POLICE.carsPerStation[Math.min(2, r.level[i] || 1)] });
            }
          }
        });
        return stations;
      }

      function computeCrimeRate() {
        if (S.pop < POLICE.MIN_POPULATION) return 0;
        // Base per-capita rate
        let rate = POLICE.BASE_RATE_PER_CAPITA * (S.pop / 1000);
        // Density factor: more roads/buildings per person = more opportunities
        let totalRoads = 0, totalBuilt = 0;
        claimedList().forEach(r => {
          for (let i = 0; i < RS * RS; i++) {
            if (r.road[i]) totalRoads++;
            if (r.level[i]) totalBuilt++;
          }
        });
        const density = totalBuilt / Math.max(1, S.pop);
        rate *= 1 + (density - 0.5) * POLICE.CRIME_DENSITY_FACTOR;
        // Unemployment factor
        const unemp = Math.max(0, (S.pop - S.jobs) / Math.max(1, S.pop));
        rate *= 1 + unemp * POLICE.CRIME_UNEMPLOYMENT_FACTOR;
        // Night time multiplier
        const isNight = S.hour < 6 || S.hour > 20;
        if (isNight) rate *= 1.5;
        // Rain multiplier (fewer witnesses)
        if (S.rain > 0.3) rate *= 1.3;
        return Math.max(0, rate);
      }

      function spawnPoliceCall() {
        // Reset daily counter
        if (S.day !== policeLastDay) {
          policeDailyCount = 0;
          policeLastDay = S.day;
        }
        if (policeDailyCount >= POLICE.MAX_DAILY_EVENTS) return;

        const crimeRate = computeCrimeRate();
        if (crimeRate === 0) return;

        // Convert daily rate to per-tick probability
        const tickProbability = crimeRate / (86400 / TICK_SECONDS);
        if (Math.random() > tickProbability) return;

        const roadsWithCars = [];
        claimedList().forEach(r => {
          for (let i = 0; i < RS * RS; i++) if (r.road[i]) roadsWithCars.push({ r, i, gx: r.rx * RS + (i % RS), gy: r.ry * RS + ((i / RS) | 0) });
        });
        if (roadsWithCars.length === 0) return;
        const spot = roadsWithCars[Math.floor(Math.random() * roadsWithCars.length)];
        // Weight types by situation: more accidents with more traffic, more crime with unemployment
        const unemp = Math.max(0, (S.pop - S.jobs) / Math.max(1, S.pop));
        const types = [
          { id: "accident", label: "Traffic Accident", weight: 3 + S.cars.length * 0.5, urgency: "high" },
          { id: "disturbance", label: "Civil Disturbance", weight: 2 + unemp * 5, urgency: "medium" },
          { id: "crime", label: "Reported Crime", weight: 1 + unemp * 8, urgency: "high" },
        ];
        // Normalize weights
        const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
        let roll = Math.random() * totalWeight;
        let type = types[0];
        for (const t of types) {
          roll -= t.weight;
          if (roll <= 0) { type = t; break; }
        }
        const call = { id: "pol_" + Date.now(), type: type.id, label: type.label, urgency: type.urgency, gx: spot.gx, gy: spot.gy, time: S.hour * 3600 + S.day * 86400, assignedUnit: null, status: "waiting" };
        policeCalls.push(call);
        policeDailyCount++;
        logEvent("police", type.label + " at " + spot.gx + "," + spot.gy, { gx: spot.gx, gy: spot.gy }, type.urgency === "critical" ? "emergency" : "high");
        dispatchPolice(call);
      }

    function dispatchPolice(call) {
          const stations = getPoliceStations();
          if (!stations.length) {
            if (!call.noStationsLogged) {
              call.noStationsLogged = true;
              logEvent("police", "NO POLICE STATIONS - Incident unreported!", { gx: call.gx, gy: call.gy }, "high", "No police stations in the city.");
            }
            return;
          }
          let bestStation = null, bestDist = Infinity, bestPath = null;
          for (const station of stations) {
            const idle = policeCars.filter(c => c.stationId === station.region.rx + "," + station.region.ry + "," + station.tile && c.state === "idle").length;
            if (idle <= 0) continue;
            const path = findRoadPath(station.gx, station.gy, call.gx, call.gy);
            if (!path) continue;
            if (path.length < bestDist) { bestDist = path.length; bestStation = station; bestPath = path; }
          }
          if (!bestStation) {
            if (!call.noUnitsLogged) {
              call.noUnitsLogged = true;
              logEvent("police", "All police units committed!", { gx: call.gx, gy: call.gy }, "high");
            }
            return;
          }
          const unit = policeCars.find(c => c.stationId === bestStation.region.rx + "," + bestStation.region.ry + "," + bestStation.tile && c.state === "idle");
          if (!unit) return;
          const travelTime = bestDist / POLICE.policeSpeed;
          const etaMin = Math.ceil(travelTime / 60 * 10) / 10;
          // route from where the car is parked, not from the station tile (it used to teleport onto the building)
          const unitPath = findRoadPath(unit.x, unit.y, call.gx, call.gy) || bestPath;
          unit.state = "responding"; unit.targetCall = call.id; unit.route = unitPath; unit.routeIdx = 0;
          unit.dispatchedAt = S.hour * 3600 + S.day * 86400; unit.eta = unit.dispatchedAt + travelTime;
          unit.stationId = bestStation.region.rx + "," + bestStation.region.ry + "," + bestStation.tile;
          call.assignedUnit = unit.id; call.status = "enroute";
          logEvent("dispatch", "Unit " + unit.id + " responding - ETA " + etaMin + " min", { gx: call.gx, gy: call.gy }, call.urgency === "critical" ? "emergency" : "high");
        }

    function updatePoliceCalls(dt) {
          const gameSeconds = dt * (S.speed || 1) * 86400;
          for (let i = policeCalls.length - 1; i >= 0; i--) {
            const call = policeCalls[i];
            if (call.status === "waiting") {
              // Only retry dispatch every 60 game seconds
              if (Math.random() < gameSeconds / 60) dispatchPolice(call);
            } else if (call.status === "enroute") {
              const unit = policeCars.find(c => c.id === call.assignedUnit);
              if (unit && unit.state === "on_scene") {
                call.status = "resolving";
                unit.state = "returning";
                logEvent("police", call.label + " - situation contained", { gx: call.gx, gy: call.gy }, "normal");
              }
            } else if (call.status === "resolving") {
              const unit = policeCars.find(c => c.id === call.assignedUnit);
              if (unit && unit.state === "idle") {
                call.status = "resolved";
                policeCalls.splice(i, 1);
              }
            }
          }
        }

    function updateEventLogUI() {
      const container = document.getElementById("event-log");
      if (!container) return;
      container.innerHTML = eventLog.slice(0, 10).map(e => `<div class="event-entry ${e.priority}">${e.message}</div>`).join("");
    }

  function assessFireRisk(region) {
      // Population-gated: no fire risk below threshold
      if (S.pop < 200) return 0;

      let risk = 0;
      let industrialCount = 0;
      let industrialLevel = 0;
      for (let i = 0; i < RS * RS; i++) {
        if (region.zone[i] === Z.I) {
          industrialCount++;
          industrialLevel += region.level[i];
          risk += region.level[i] * 0.5;
          const dirs = [[0,-1],[1,0],[0,1],[-1,0]];
          for (const [dx,dy] of dirs) {
            const t = regionOf(region.rx * RS + (i % RS) + dx, region.ry * RS + ((i / RS) | 0) + dy);
            if (t && t.r.zone[t.i] === Z.I) risk += 0.2;
          }
        }
      }

      // No industry = minimal fire risk (only from events)
      if (industrialCount === 0) return 0.001 * (S.pop / 1000);

      // Scale risk by industrial density per capita
      const industrialPerCapita = industrialCount / Math.max(1, region.pop || 1);
      risk *= 0.5 + industrialPerCapita * 2;

      // Fire station coverage
      const stations = getFireStations();
      let covered = false;
      stations.forEach(st => {
        const path = findRoadPath(st.gx, st.gy, region.rx * RS + RS/2, region.ry * RS + RS/2);
        if (path && path.length < 100) { risk *= 0.3; covered = true; }
        else if (path) { risk *= 0.6; covered = true; }
      });

      // Dry weather increases risk
      if (S.rain < 0.1) risk *= 1.4;
      else if (S.rain > 0.5) risk *= 0.7;

      // Night slightly higher risk (less activity)
      const isNight = S.hour < 6 || S.hour > 20;
      if (isNight) risk *= 1.15;

      return Math.max(0, risk);
    }

    // Daily fire ignition check - called once per tick
    let fireDailyIgnitions = 0;
    let fireLastDay = -1;
    const FIRE = {
      BASE_IGNITION_RATE: 0.00005,    // Base daily ignition chance per industrial tile
      MIN_POPULATION: 200,
      MAX_DAILY_IGNITIONS: 3,
    };

    function checkFireIgnition() {
      if (S.day !== fireLastDay) {
        fireDailyIgnitions = 0;
        fireLastDay = S.day;
      }
      if (fireDailyIgnitions >= FIRE.MAX_DAILY_IGNITIONS) return;

      if (S.pop < FIRE.MIN_POPULATION) return;

      claimedList().forEach(region => {
        if (fireDailyIgnitions >= FIRE.MAX_DAILY_IGNITIONS) return;
        const risk = assessFireRisk(region);
        if (risk <= 0) return;

        // Convert risk to daily probability, then to per-tick
        const dailyProb = Math.min(0.15, risk * FIRE.BASE_IGNITION_RATE * region.built);
        const tickProb = dailyProb / (86400 / TICK_SECONDS);

        if (Math.random() < tickProb) {
          // Find industrial tiles to start fire
          const industrialTiles = [];
          for (let i = 0; i < RS * RS; i++) {
            if (region.zone[i] === Z.I && region.level[i] > 0) industrialTiles.push(i);
          }
          if (industrialTiles.length === 0) return;
          const tileIdx = industrialTiles[Math.floor(Math.random() * industrialTiles.length)];
          startFire(region, tileIdx);
          fireDailyIgnitions++;
        }
      });
    }

  let cam = { x: 0, y: 0, zoom: 0.9 };

  // ---------------------------------------------------------------- options
  const OPT_KEY = "latticeCity.opts.v1";
  const OPT_DEFAULT = { master: 80, music: 55, sfx: 80, ambience: 70, weather: true, grid: false, night: true, autosave: true, reduceMotion: false, clock24: true, tts: true };
  const OPT = Object.assign({}, OPT_DEFAULT);
  try {
    const saved = JSON.parse(localStorage.getItem(OPT_KEY) || "{}");
    Object.keys(OPT_DEFAULT).forEach((k) => { if (saved[k] !== undefined) OPT[k] = saved[k]; });
  } catch (e) {}
  ttsEnabled = !!OPT.tts;
  function saveOpts() {
    ttsEnabled = !!OPT.tts;
    if (!ttsEnabled) silenceTTS();
    else if (!ttsBroadcastTimer) startTTSBroadcast();
    try { localStorage.setItem(OPT_KEY, JSON.stringify(OPT)); } catch (e) {}
    applyOpts();
  }
  function applyOpts() {
    if (ambient) {
      const base = (OPT.ambience / 100) * (OPT.master / 100);
      ambient.master.gain.value = 0.5 * base * (radioPlaying() ? 0.05 : 1);
    }
    try {
      if (window.LatticeRadio) {
        window.LatticeRadio.setVol(OPT.music / 100);
        if (OPT.master === 0) window.LatticeRadio.setMuted(true);
      }
    } catch (e) {}
  }

  // ---------------------------------------------------------------- Population System (Micro-Simulation)
    // Every citizen is a real entity with a generated character card.
    // Houses on tiles = containers (capacity 6). Jobs = slots at workplaces.
    // Happiness drives retention; unhappiness → departure → slums.

    const CITIZEN = {
      // Base stats range
      STAT_MIN: 1, STAT_MAX: 100,
      // Personality archetypes
      ARCHETYPES: {
        worker:   { name: "Worker",      jobAffinity: ["industrial", "construction", "transport"],  baseHappiness: 55, crimeRisk: 0.02, welfareRisk: 0.05 },
        clerk:    { name: "Clerk",       jobAffinity: ["commercial", "office", "retail"],           baseHappiness: 60, crimeRisk: 0.01, welfareRisk: 0.03 },
        scholar:  { name: "Scholar",     jobAffinity: ["education", "research", "library"],          baseHappiness: 65, crimeRisk: 0.005, welfareRisk: 0.02 },
        guardian: { name: "Guardian",    jobAffinity: ["police", "fire", "emergency"],               baseHappiness: 60, crimeRisk: 0.0, welfareRisk: 0.01 },
        artisan:  { name: "Artisan",     jobAffinity: ["craft", "workshop", "market"],               baseHappiness: 58, crimeRisk: 0.015, welfareRisk: 0.04 },
        drifter:  { name: "Drifter",     jobAffinity: [],                                           baseHappiness: 35, crimeRisk: 0.15, welfareRisk: 0.30 },
      },
      // Needs weights (must sum to ~1.0)
      NEEDS: {
        housing:   0.25,  // has home, not overcrowded
        employment: 0.25, // has job matching skills
        safety:    0.15,  // low crime, fire coverage
        services:  0.10,  // water, power, parks, schools
        social:    0.10,  // community, relationships
        leisure:   0.08,  // shops, restaurants, entertainment
        health:    0.07,  // clinic access, low pollution
      },
      // Life stages
      AGES: {
        child:    { min: 0,   max: 17,  workCapable: false,  schoolNeeded: true },
        young:    { min: 18,  max: 30,  workCapable: true,   schoolNeeded: false },
        prime:    { min: 31,  max: 55,  workCapable: true,   schoolNeeded: false },
        senior:   { min: 56,  max: 80,  workCapable: false,  schoolNeeded: false, pension: true },
        elder:    { min: 81,  max: 100, workCapable: false,  schoolNeeded: false, careNeeded: true },
      },
      // Max citizens per house tile
      HOUSE_CAPACITY: 6,
      // Happiness thresholds
      HAPPY_THRESHOLD: 70,      // Thriving, may attract newcomers
      CONTENT_THRESHOLD: 45,    // Stable
      UNHAPPY_THRESHOLD: 25,    // Risk of leaving
      DESPAIR_THRESHOLD: 10,    // Will leave soon, creates blight
    };

    // Name generation pools
    const FIRST_NAMES = [
      "Aldric","Mara","Tobin","Elara","Finn","Lyra","Gareth","Nora","Kellen","Sofia",
      "Bram","Tessa","Corin","Mira","Darian","Fey","Joren","Vera","Liam","Zara",
      "Owen","Keira","Ronan","Anya","Silas","Ivy","Tomas","Lena","Vance","Mina",
      "Kai","Nina","Orin","Paige","Quinn","Rhea","Soren","Tara","Ulric","Wren",
      "Xander","Yara","Zeke","Adele","Bryce","Cara","Derek","Elise","Felix","Gwen"
    ];
    const LAST_NAMES = [
      "Stoneheart","Ironwood","Brightwater","Ashford","Copperfield","Dawnstrider","Emberglow",
      "Fairwind","Goldleaf","Hearthstone","Ironforge","Jadebrook","Kingsley","Lightfoot",
      "Merrifield","Northwatch","Oakhaven","Pinecrest","Quill","Riverstone","Silverstream",
      "Thornfield","Underwood","Valewalker","Whitmore","Yardley","Zephyr"
    ];

    // Citizen registry — all living citizens in the city
    let citizens = [];
    let citizenIdCounter = 0;
    let householdIdCounter = 0;

    // Household: a house tile + its residents
    function createHousehold(region, tileIdx, level) {
      const capacity = CITIZEN.HOUSE_CAPACITY * level;
      return {
        id: ++householdIdCounter,
        region: region,
        tile: tileIdx,
        gx: region.rx * RS + (tileIdx % RS),
        gy: region.ry * RS + ((tileIdx / RS) | 0),
        capacity: capacity,
        residents: [], // citizen IDs
        condition: 100, // maintenance level
        rent: level * 12, // monthly rent per resident
        createdDay: S.day,
      };
    }

    // Generate a unique citizen
    function generateCitizen(household, archetypeHint = null) {
      const id = ++citizenIdCounter;
      const archetypeKey = archetypeHint || weightedRandom(Object.keys(CITIZEN.ARCHETYPES).map(k => ({
        key: k, weight: CITIZEN.ARCHETYPES[k].baseHappiness
      })));
      const archetype = CITIZEN.ARCHETYPES[archetypeKey];

      // Age distribution weighted toward working age
      const ageRoll = Math.random();
      let ageStage, age;
      if (ageRoll < 0.22) { ageStage = "child"; age = 5 + Math.floor(Math.random() * 12); }
      else if (ageRoll < 0.55) { ageStage = "young"; age = 18 + Math.floor(Math.random() * 13); }
      else if (ageRoll < 0.78) { ageStage = "prime"; age = 31 + Math.floor(Math.random() * 25); }
      else if (ageRoll < 0.93) { ageStage = "senior"; age = 56 + Math.floor(Math.random() * 25); }
      else { ageStage = "elder"; age = 81 + Math.floor(Math.random() * 20); }

      const stage = CITIZEN.AGES[ageStage];

      // Stats
      const stats = {
        intelligence:   rndInt(20, 100),
        strength:       rndInt(20, 100),
        dexterity:      rndInt(20, 100),
        charisma:       rndInt(20, 100),
        endurance:      rndInt(20, 100),
        luck:           rndInt(1, 100),
      };

      // Skills based on archetype + some randomness
      const skills = {};
      const allSkills = ["industrial","construction","transport","commercial","office","retail",
                         "education","research","library","police","fire","emergency",
                         "craft","workshop","market","farming","fishing","medical"];
      archetype.jobAffinity.forEach(aff => skills[aff] = rndInt(40, 85));
      // Add 1-2 random skills
      const extraSkills = allSkills.filter(s => !skills[s]).sort(() => Math.random() - 0.5).slice(0, 2);
      extraSkills.forEach(s => skills[s] = rndInt(10, 40));

      // Personality traits
      const traits = [];
      if (stats.charisma > 70) traits.push("charismatic");
      if (stats.intelligence > 70) traits.push("sharp");
      if (stats.strength > 70) traits.push("strong");
      if (stats.luck > 80) traits.push("lucky");
      if (stats.luck < 20) traits.push("unlucky");
      if (archetypeKey === "drifter") traits.push("restless");

      const citizen = {
        id: id,
        name: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] + " " + LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)],
        archetype: archetypeKey,
        age: age,
        ageStage: ageStage,
        stats: stats,
        skills: skills,
        traits: traits,
        householdId: household.id,
        household: household,
        job: null, // { workplaceId, role, income, satisfaction }
        happiness: archetype.baseHappiness + rndInt(-10, 10),
        needs: { housing: 100, employment: 0, safety: 50, services: 50, social: 50, leisure: 50, health: 50 },
        relationships: [], // other citizen IDs with bond strength
        routine: null, // daily schedule
        commutePath: null,
        daysUnemployed: 0,
        daysInCity: 0,
        bornDay: S.day,
        lastMovedDay: S.day,
        status: "active", // active, leaving, departed
        blightContribution: 0, // negative happiness generates blight
      };

      // Clamp happiness
      citizen.happiness = clamp(citizen.happiness, 0, 100);

      citizens.push(citizen);
      household.residents.push(id);
      return citizen;
    }

    function weightedRandom(items) {
      const total = items.reduce((sum, item) => sum + item.weight, 0);
      let roll = Math.random() * total;
      for (const item of items) {
        roll -= item.weight;
        if (roll <= 0) return item.key;
      }
      return items[0].key;
    }

    function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    // Initialize households from existing residential buildings
    function initializeHouseholds() {
      const newHouseholds = [];
      claimedList().forEach(region => {
        for (let i = 0; i < RS * RS; i++) {
          if (region.zone[i] === Z.R && region.level[i] > 0) {
            // Check if household already exists for this tile
            let existing = region.households?.find(h => h.tile === i);
            if (!existing) {
              existing = createHousehold(region, i, region.level[i]);
              if (!region.households) region.households = [];
              region.households.push(existing);
            }
            newHouseholds.push(existing);
          }
        }
      });
      return newHouseholds;
    }

    // Populate households with citizens (initial fill)
    function populateHouseholds() {
      claimedList().forEach(region => {
        if (!region.households) return;
        region.households.forEach(household => {
          const archetypeWeights = {
            worker: 0.45, clerk: 0.25, scholar: 0.1, guardian: 0.05, artisan: 0.1, drifter: 0.05
          };
          while (household.residents.length < household.capacity) {
            const archetype = weightedRandom(Object.entries(archetypeWeights).map(([k,w]) => ({key:k,weight:w})));
            generateCitizen(household, archetype);
          }
        });
      });
    }

    // Find workplaces with open slots
    function findWorkplaces() {
      const workplaces = [];
      claimedList().forEach(region => {
        for (let i = 0; i < RS * RS; i++) {
          if (!region.level[i]) continue;
          const z = region.zone[i];
          const lv = region.level[i];
          const cap = (z === Z.C || z === Z.I) ? 6 * lv : 0;
          if (cap > 0) {
            workplaces.push({
              id: region.rx + "," + region.ry + "," + i,
              region: region,
              tile: i,
              zone: z,
              level: lv,
              gx: region.rx * RS + (i % RS),
              gy: region.ry * RS + ((i / RS) | 0),
              capacity: cap,
              workers: [], // citizen IDs
              sector: z === Z.C ? "commercial" : "industrial",
              wages: z === Z.C ? 18 : 22, // daily wage
            });
          }
          // Service buildings also employ
          const svc = SVC[region.svc[i]];
          if (svc && region.level[i] > 0) {
            const svcJobs = { fire: 4, school: 3, water: 2, power: 2, clinic: 3, police: 4 };
            if (svcJobs[svc]) {
              workplaces.push({
                id: region.rx + "," + region.ry + "," + i + "-svc",
                region: region,
                tile: i,
                zone: "service",
                level: region.level[i],
                gx: region.rx * RS + (i % RS),
                gy: region.ry * RS + ((i / RS) | 0),
                capacity: svcJobs[svc] * region.level[i],
                workers: [],
                sector: "public",
                wages: 25,
                serviceType: svc,
              });
            }
          }
        }
      });
      return workplaces;
    }

    // Job matching: assign citizens to workplaces
    function assignJobs() {
      const workplaces = findWorkplaces();
      const unemployed = citizens.filter(c =>
        c.status === "active" &&
        c.ageStage !== "child" &&
        c.ageStage !== "elder" &&
        !c.job
      );

      // Shuffle for fairness
      unemployed.sort(() => Math.random() - 0.5);

      for (const citizen of unemployed) {
        // Find best matching workplace
        let bestMatch = null, bestScore = -1;
        for (const wp of workplaces) {
          if (wp.workers.length >= wp.capacity) continue;
          // Score based on skill match
          let score = 0;
          for (const [skill, level] of Object.entries(citizen.skills)) {
            if (wp.sector === "public" && wp.serviceType) {
              if (wp.serviceType === "fire" && skill === "emergency") score += level;
              if (wp.serviceType === "police" && skill === "police") score += level;
              if (wp.serviceType === "school" && skill === "education") score += level;
              if (wp.serviceType === "clinic" && skill === "medical") score += level;
              if (wp.serviceType === "water" && (skill === "craft" || skill === "farming")) score += level * 0.5;
              if (wp.serviceType === "power" && skill === "industrial") score += level * 0.5;
            } else if (wp.sector === "commercial") {
              if (["commercial","office","retail","craft","market"].includes(skill)) score += level;
            } else if (wp.sector === "industrial") {
              if (["industrial","construction","transport","craft","farming","fishing"].includes(skill)) score += level;
            }
          }
          // Distance penalty
          const dist = Math.abs(citizen.household.gx - wp.gx) + Math.abs(citizen.household.gy - wp.gy);
          score -= dist * 0.1;
          if (score > bestScore) { bestScore = score; bestMatch = wp; }
        }
        if (bestMatch) {
          citizen.job = {
            workplaceId: bestMatch.id,
            workplace: bestMatch,
            role: bestMatch.sector === "public" ? "public_servant" : (bestMatch.sector === "commercial" ? "clerk" : "laborer"),
            income: bestMatch.wages,
            satisfaction: clamp(50 + bestScore * 0.2, 20, 100),
          };
          bestMatch.workers.push(citizen.id);
          citizen.daysUnemployed = 0;
        } else {
          citizen.daysUnemployed++;
        }
      }
    }

    // Daily needs evaluation
    function evaluateNeeds() {
      const workplaces = findWorkplaces();
      const fireStations = getFireStations();
      const clinics = getClinics();
      const policeStations = getPoliceStations();

      citizens.forEach(citizen => {
        if (citizen.status !== "active") return;

        // Housing need
        const hh = citizen.household;
        const overcrowded = hh.residents.length > hh.capacity;
        citizen.needs.housing = overcrowded ? 30 : (hh.condition > 50 ? 100 : 60);

        // Employment need
        if (citizen.ageStage === "child" || citizen.ageStage === "elder") {
          citizen.needs.employment = 100; // not applicable
        } else if (citizen.job) {
          citizen.needs.employment = citizen.job.satisfaction;
        } else {
          citizen.needs.employment = Math.max(0, 100 - citizen.daysUnemployed * 8);
        }

        // Safety need - based on local crime/fire coverage
        const hhTile = regionOf(citizen.household.gx, citizen.household.gy);
        let safety = 50;
        if (hhTile) {
          // Fire coverage
          let fireCovered = false;
          fireStations.forEach(st => {
            const path = findRoadPath(st.gx, st.gy, citizen.household.gx, citizen.household.gy);
            if (path && path.length < 100) fireCovered = true;
          });
          // Police coverage
          let policeCovered = false;
          policeStations.forEach(st => {
            const path = findRoadPath(st.gx, st.gy, citizen.household.gx, citizen.household.gy);
            if (path && path.length < 150) policeCovered = true;
          });
          // Local crime rate
          const localCrime = activeCrimesNear(citizen.household.gx, citizen.household.gy, 50);
          safety = (fireCovered ? 40 : 10) + (policeCovered ? 35 : 5) + (localCrime === 0 ? 25 : Math.max(0, 25 - localCrime * 8));
        }
        citizen.needs.safety = clamp(safety, 0, 100);

        // Services need - water, power, parks
        let services = 0;
        if (hhTile) {
          if (hhTile.r.powerOn[hhTile.i]) services += 30;
          if (hhTile.r.waterOn[hhTile.i]) services += 30;
          // Parks nearby
          let parkNearby = false;
          for (let dx = -8; dx <= 8; dx++) for (let dy = -8; dy <= 8; dy++) {
            const t = regionOf(citizen.household.gx + dx, citizen.household.gy + dy);
            if (t && SVC[t.r.svc[t.i]] === "park") { parkNearby = true; break; }
          }
          if (parkNearby) services += 25;
          // School nearby (for children)
          if (citizen.ageStage === "child") {
            let schoolNearby = false;
            for (let dx = -12; dx <= 12; dx++) for (let dy = -12; dy <= 12; dy++) {
              const t = regionOf(citizen.household.gx + dx, citizen.household.gy + dy);
              if (t && SVC[t.r.svc[t.i]] === "school") { schoolNearby = true; break; }
            }
            if (schoolNearby) services += 15;
          }
        }
        citizen.needs.services = clamp(services, 0, 100);

        // Social need - relationships, household size
        let social = 40 + Math.min(30, citizen.relationships.length * 5);
        if (hh.residents.length >= 3) social += 15; // family/community
        citizen.needs.social = clamp(social, 0, 100);

        // Leisure - shops, restaurants nearby
        let leisure = 30;
        if (hhTile) {
          let shopsNearby = 0;
          for (let dx = -10; dx <= 10; dx++) for (let dy = -10; dy <= 10; dy++) {
            const t = regionOf(citizen.household.gx + dx, citizen.household.gy + dy);
            if (t && t.r.zone[t.i] === Z.C && t.r.level[t.i] > 0) shopsNearby++;
          }
          leisure += Math.min(50, shopsNearby * 5);
        }
        citizen.needs.leisure = clamp(leisure, 0, 100);

        // Health - clinic access, pollution
        let health = 60;
        if (hhTile) {
          let clinicNearby = false;
          for (let dx = -15; dx <= 15; dx++) for (let dy = -15; dy <= 15; dy++) {
            const t = regionOf(citizen.household.gx + dx, citizen.household.gy + dy);
            if (t && (SVC[t.r.svc[t.i]] === "clinic" || SVC[t.r.svc[t.i]] === "school")) { clinicNearby = true; break; }
          }
          if (clinicNearby) health += 30;
          // Industrial pollution penalty
          let industrialNearby = 0;
          for (let dx = -6; dx <= 6; dx++) for (let dy = -6; dy <= 6; dy++) {
            const t = regionOf(citizen.household.gx + dx, citizen.household.gy + dy);
            if (t && t.r.zone[t.i] === Z.I && t.r.level[t.i] > 0) industrialNearby++;
          }
          health -= industrialNearby * 3;
        }
        citizen.needs.health = clamp(health, 0, 100);
      });
    }

    function activeCrimesNear(gx, gy, radius) {
      let count = 0;
      policeCalls.forEach(call => {
        if (call.status !== "resolved") {
          const dist = Math.abs(call.gx - gx) + Math.abs(call.gy - gy);
          if (dist <= radius) count++;
        }
      });
      activeFires.forEach(fire => {
        if (!fire.contained) {
          const dist = Math.abs(fire.gx - gx) + Math.abs(fire.gy - gy);
          if (dist <= radius) count++;
        }
      });
      return count;
    }

    // Calculate happiness from needs
    function updateHappiness() {
      citizens.forEach(citizen => {
        if (citizen.status !== "active") return;

        let happiness = 0;
        for (const [need, weight] of Object.entries(CITIZEN.NEEDS)) {
          happiness += citizen.needs[need] * weight;
        }
        // Archetype base
        happiness += CITIZEN.ARCHETYPES[citizen.archetype].baseHappiness * 0.15;
        // Traits
        if (citizen.traits.includes("lucky")) happiness += 5;
        if (citizen.traits.includes("unlucky")) happiness -= 5;
        if (citizen.traits.includes("restless")) happiness -= 10;

        // Age modifiers
        if (citizen.ageStage === "senior" && !citizen.job) happiness += 10; // pension ok
        if (citizen.ageStage === "elder") happiness -= 5; // frailty

        // Smooth towards new happiness
        citizen.happiness = clamp(citizen.happiness + (happiness - citizen.happiness) * 0.15, 0, 100);

        // Blight contribution from despair
        if (citizen.happiness < CITIZEN.DESPAIR_THRESHOLD) {
          citizen.blightContribution = (CITIZEN.DESPAIR_THRESHOLD - citizen.happiness) * 0.5;
        } else {
          citizen.blightContribution = 0;
        }

        // Departure check
        if (citizen.happiness < CITIZEN.UNHAPPY_THRESHOLD && Math.random() < 0.02) {
          citizen.status = "leaving";
          citizen.leavingReason = "unhappiness";
        }
        if (citizen.happiness < CITIZEN.DESPAIR_THRESHOLD && Math.random() < 0.08) {
          citizen.status = "leaving";
          citizen.leavingReason = "despair";
        }
        // Elderly natural departure
        if (citizen.ageStage === "elder" && Math.random() < 0.001) {
          citizen.status = "leaving";
          citizen.leavingReason = "old_age";
        }
      });
    }

    // Process departures and create blight
    function processDepartures() {
      const leaving = citizens.filter(c => c.status === "leaving");
      leaving.forEach(citizen => {
        // Remove from household
        if (citizen.household) {
          citizen.household.residents = citizen.household.residents.filter(id => id !== citizen.id);
        }
        // Remove from workplace
        if (citizen.job && citizen.job.workplace) {
          citizen.job.workplace.workers = citizen.job.workplace.workers.filter(id => id !== citizen.id);
        }
        // Generate blight at household location
        if (citizen.blightContribution > 0 && citizen.household) {
          const hhTile = regionOf(citizen.household.gx, citizen.household.gy);
          if (hhTile) {
            hhTile.r.blight = (hhTile.r.blight || 0) + citizen.blightContribution;
          }
        }
        // Log departure
        logEvent("population", citizen.name + " has left the city (" + citizen.leavingReason + ")", 
          { gx: citizen.household?.gx, gy: citizen.household?.gy }, "high");
        citizen.status = "departed";
      });
      // Remove departed citizens
      citizens = citizens.filter(c => c.status !== "departed");
    }

    // Natural population growth (births/migration)
    function processMigration() {
      // Immigration: attracted by high happiness, jobs, housing
      const avgHappiness = citizens.length ? citizens.reduce((s,c) => s + c.happiness, 0) / citizens.length : 50;
      const openJobs = findWorkplaces().reduce((s,wp) => s + Math.max(0, wp.capacity - wp.workers.length), 0);
      const openHousing = claimedList().reduce((s,r) => s + (r.households||[]).reduce((s2,h) => s2 + Math.max(0, h.capacity - h.residents.length), 0), 0);

      if (avgHappiness > CITIZEN.HAPPY_THRESHOLD && (openJobs > 5 || openHousing > 5) && Math.random() < 0.15) {
        // New migrant arrives
        const regions = claimedList().filter(r => (r.households||[]).some(h => h.residents.length < h.capacity));
        if (regions.length) {
          const region = regions[Math.floor(Math.random() * regions.length)];
          const household = region.households.find(h => h.residents.length < h.capacity);
          if (household) {
            const archetypeWeights = { worker: 0.5, clerk: 0.2, scholar: 0.05, guardian: 0.05, artisan: 0.1, drifter: 0.1 };
            generateCitizen(household, weightedRandom(Object.entries(archetypeWeights).map(([k,w]) => ({key:k,weight:w}))));
            logEvent("population", "New citizen arrived: " + citizens[citizens.length-1].name, 
              { gx: household.gx, gy: household.gy }, "normal");
          }
        }
      }

      // Births: couples in prime age, happy, housed
      const couples = citizens.filter(c => 
        c.status === "active" && c.ageStage === "prime" && c.happiness > 60 && c.household &&
        c.household.residents.length < c.household.capacity && Math.random() < 0.0008
      );
      couples.forEach(c => {
        // Create child
        const child = generateCitizen(c.household, "worker"); // children start as generic
        child.age = 0;
        child.ageStage = "child";
        child.stats = { intelligence: rndInt(40,80), strength: rndInt(30,70), dexterity: rndInt(30,70), charisma: rndInt(30,80), endurance: rndInt(40,80), luck: rndInt(1,100) };
        child.skills = {};
        child.traits = ["child"];
        child.job = null;
        child.happiness = 70;
        child.needs = { housing: 100, employment: 100, safety: 50, services: 50, social: 80, leisure: 60, health: 70 };
        logEvent("population", "Birth: " + child.name + " born to " + c.name, 
          { gx: c.household.gx, gy: c.household.gy }, "normal");
      });
    }

    // Aging: once per year (365 days)
    function processAging() {
      if (S.day % 365 !== 0) return;
      citizens.forEach(citizen => {
        if (citizen.status !== "active") return;
        citizen.age++;
        const oldStage = citizen.ageStage;
        if (citizen.age >= 18 && oldStage === "child") citizen.ageStage = "young";
        else if (citizen.age >= 31 && oldStage === "young") citizen.ageStage = "prime";
        else if (citizen.age >= 56 && oldStage === "prime") citizen.ageStage = "senior";
        else if (citizen.age >= 81 && oldStage === "senior") citizen.ageStage = "elder";
        if (oldStage !== citizen.ageStage) {
          logEvent("population", citizen.name + " reached " + citizen.ageStage + " (" + citizen.age + ")", 
            { gx: citizen.household?.gx, gy: citizen.household?.gy }, "normal");
        }
      });
    }

    // Main population tick - called once per game day
    function tickPopulation() {
      // Initialize on first run
      if (!S.populationInitialized) {
        initializeHouseholds();
        populateHouseholds();
        S.populationInitialized = true;
        log("Population system initialized: " + citizens.length + " citizens in " + 
          claimedList().reduce((s,r) => s + (r.households||[]).length, 0) + " households");
      }

      evaluateNeeds();
      updateHappiness();
      assignJobs();
      processDepartures();
      processMigration();
      processAging();

      // Update region aggregates
      updateRegionPopulationStats();
    }

    function updateRegionPopulationStats() {
      claimedList().forEach(region => {
        region.citizens = citizens.filter(c => 
          c.status === "active" && c.household && c.household.region === region
        );
        region.pop = region.citizens.length;
        region.workers = region.citizens.filter(c => c.job).length;
        region.unemployed = region.citizens.filter(c => !c.job && c.ageStage !== "child" && c.ageStage !== "elder").length;
        region.children = region.citizens.filter(c => c.ageStage === "child").length;
        region.seniors = region.citizens.filter(c => c.ageStage === "senior" || c.ageStage === "elder").length;
        region.avgHappiness = region.citizens.length ? 
          region.citizens.reduce((s,c) => s + c.happiness, 0) / region.citizens.length : 50;
        region.blight = region.blight || 0;
        // Blight decay
        region.blight = Math.max(0, region.blight * 0.98);
        // Blight effects: reduces land value, increases crime risk
        if (region.blight > 30) {
          region.crimeMultiplier = 1 + (region.blight - 30) * 0.02;
        } else {
          region.crimeMultiplier = 1;
        }
      });
      // Update global S.pop from real citizens
      S.pop = citizens.filter(c => c.status === "active").length;
      S.jobs = citizens.filter(c => c.status === "active" && c.job).length;
    }

    // ============= CITIZEN CARD UI =============
      // DiceBear avatar styles for diverse portraits
      const AVATAR_STYLES = ["avataaars", "micah", "big-smile", "notionists", "open-peeps", "personas"];
      const AVATAR_GENDERS = ["male", "female"];
  
      function getCitizenAvatarURL(citizen) {
        // Deterministic seed from citizen ID for consistent avatar
        const seed = "citizen_" + citizen.id;
        const style = AVATAR_STYLES[citizen.id % AVATAR_STYLES.length];
        const gender = AVATAR_GENDERS[citizen.id % AVATAR_GENDERS.length];
        // Use DiceBear API - free, no key required
        return "https://api.dicebear.com/7.x/" + style + "/svg?seed=" + encodeURIComponent(seed) + "&gender=" + gender + "&backgroundColor=141312,2e2a25,3f3a35&size=128";
      }

      function getCitizenCardHTML(citizen) {
        const jobStr = citizen.job ? citizen.job.role + " at " + (citizen.job.workplace?.sector || "?") + " ($" + citizen.job.income + "/day)" : "Unemployed";
        const hhStr = citizen.household ? "Household #" + citizen.household.id + " (" + citizen.household.residents.length + "/" + citizen.household.capacity + ")" : "Homeless";
        const traitsStr = citizen.traits.length ? citizen.traits.join(", ") : "—";
        const skillsStr = Object.entries(citizen.skills).sort((a,b) => b[1]-a[1]).slice(0,5).map(([k,v]) => k + ":" + v).join(", ");
        const needsHtml = Object.entries(citizen.needs).map(([k,v]) => 
          '<div class="need-bar"><span>' + k + '</span><i><u style="width:' + v + '%"></u></i><b>' + Math.round(v) + '</b></div>'
        ).join("");
        const avatarURL = getCitizenAvatarURL(citizen);
        const happinessColor = citizen.happiness > 70 ? '#6fbf73' : citizen.happiness > 45 ? '#f2c14e' : '#e2583c';

        return `
          <div class="citizen-card">
            <div class="citizen-header">
              <img class="citizen-avatar" src="${avatarURL}" alt="${citizen.name}" loading="lazy">
              <div class="citizen-info">
                <h3>${citizen.name}</h3>
                <span class="archetype ${citizen.archetype}">${CITIZEN.ARCHETYPES[citizen.archetype].name}</span>
                <span class="age">Age ${citizen.age} (${citizen.ageStage})</span>
              </div>
            </div>
            <div class="citizen-stats">
              <div class="stat-row">Happiness: <b style="color:${happinessColor}">${Math.round(citizen.happiness)}%</b></div>
              <div class="stat-row">${jobStr}</div>
              <div class="stat-row">${hhStr}</div>
            </div>
            <div class="citizen-attrs">
              <div class="attrs-col">
                <b>Stats</b>
                ${Object.entries(citizen.stats).map(([k,v]) => '<div class="stat-mini"><span>'+k+'</span><b>'+v+'</b></div>').join("")}
              </div>
              <div class="attrs-col">
                <b>Skills</b>
                <div>${skillsStr}</div>
              </div>
            </div>
            <div class="citizen-needs">
              <b>Needs</b>
              ${needsHtml}
            </div>
            <div class="citizen-traits"><b>Traits:</b> ${traitsStr}</div>
            ${citizen.relationships.length ? '<div class="citizen-rels"><b>Relationships:</b> ' + citizen.relationships.map(r => '#'+r.id+' ('+r.bond+')').join(", ") + '</div>' : ''}
          </div>
        `;
      }

    // Inspector integration for citizen cards
    function inspectCitizen(citizenId) {
      const citizen = citizens.find(c => c.id === citizenId);
      if (!citizen) return;
      el("inspector").classList.remove("hidden");
      el("ins-title").textContent = "Citizen: " + citizen.name;
      el("ins-body").innerHTML = getCitizenCardHTML(citizen);
    }

    // Population dashboard data
    function getPopulationDashboard() {
      const active = citizens.filter(c => c.status === "active");
      const byArchetype = {};
      const byAgeStage = {};
      active.forEach(c => {
        byArchetype[c.archetype] = (byArchetype[c.archetype] || 0) + 1;
        byAgeStage[c.ageStage] = (byAgeStage[c.ageStage] || 0) + 1;
      });
      const employed = active.filter(c => c.job).length;
      const unemployed = active.filter(c => !c.job && c.ageStage !== "child" && c.ageStage !== "elder").length;
      const avgHappiness = active.length ? active.reduce((s,c) => s + c.happiness, 0) / active.length : 0;
      const totalBlight = claimedList().reduce((s,r) => s + (r.blight||0), 0);

      return {
        total: active.length,
        employed: employed,
        unemployed: unemployed,
        employmentRate: active.length ? employed / active.filter(c => c.ageStage !== "child" && c.ageStage !== "elder").length : 0,
        avgHappiness: avgHappiness,
        byArchetype: byArchetype,
        byAgeStage: byAgeStage,
        totalBlight: totalBlight,
        households: claimedList().reduce((s,r) => s + (r.households||[]).length, 0),
        housingOccupancy: claimedList().reduce((s,r) => s + (r.households||[]).reduce((s2,h) => s2 + h.residents.length, 0), 0) / 
          Math.max(1, claimedList().reduce((s,r) => s + (r.households||[]).reduce((s2,h) => s2 + h.capacity, 0), 0)),
        avgCommute: S.avgCommute || 0,
      };
    }

    // Expose for UI
    const populationAPI = {
      citizens: () => citizens.filter(c => c.status === "active"),
      allCitizens: () => citizens,
      getDashboard: getPopulationDashboard,
      inspectCitizen: inspectCitizen,
      tickPopulation: tickPopulation,
    };


    const ECON = {
      MICRO_DAY_MS: 10 * 60 * 1000,
      WORK_SHIFT_MS: (10 * 60 * 1000) / 3,
      REVENUE_TICK_MS: 10 * 60 * 1000,
      MAX_WORKERS_PER_SHOP: 4,
      BASE_WAGE_PER_SHIFT: 6,
      REVENUE_PER_WORKER_PER_SHIFT: 10,
      TAX_RATE: 0.20,
      STARTUP_CAPITAL_DAYS: 30,
      BANKRUPTCY_GRACE_DAYS: 7,
      PUBLIC_WAGES: { fire: 8, police: 8, school: 7, clinic: 7, water: 6, power: 6 },
      CRIME_REVENUE_PENALTY: 0.15,
      FIRE_REVENUE_PENALTY: 0.25,
      UNDERSTAFFED_PENALTY: 0.20,
      FULL_STAFF_BONUS: 0.10,
      OVERSTAFF_BONUS: 0.05,
    };
    let workplaces = [];
    let workplaceIdCounter = 0;
    let lastRevenueTick = 0;
    let lastWageTick = 0;
    let econInitialized = false;

    function createWorkplace(region, tileIdx, zone, level) {
      const id = ++workplaceIdCounter;
      const isPublic = zone !== Z.C && zone !== Z.I;
      const sector = zone === Z.C ? "commercial" : zone === Z.I ? "industrial" : "public";
      const serviceType = isPublic ? SVC[region.svc[tileIdx]] : null;
      let capacity;
      if (isPublic) {
        const svcCaps = { fire: 4, school: 3, clinic: 3, police: 4, water: 2, power: 2 };
        capacity = (svcCaps[serviceType] || 2) * level;
      } else {
        capacity = Math.min(ECON.MAX_WORKERS_PER_SHOP, 6 * level);
      }
      const wagePerShift = isPublic
        ? (ECON.PUBLIC_WAGES[serviceType] || ECON.BASE_WAGE_PER_SHIFT)
        : ECON.BASE_WAGE_PER_SHIFT;
      const dailyWageCost = capacity * wagePerShift * 3;
      const dailyTaxEstimate = capacity * ECON.REVENUE_PER_WORKER_PER_SHIFT * 3 * ECON.TAX_RATE;
      const wp = {
        id: id,
        region: region,
        tile: tileIdx,
        zone: zone,
        level: level,
        sector: sector,
        serviceType: serviceType,
        isPublic: isPublic,
        gx: region.rx * RS + (tileIdx % RS),
        gy: region.ry * RS + ((tileIdx / RS) | 0),
        capacity: capacity,
        workers: [],
        wagePerShift: wagePerShift,
        revenuePerWorkerPerShift: ECON.REVENUE_PER_WORKER_PER_SHIFT,
        balance: (dailyWageCost + dailyTaxEstimate) * ECON.STARTUP_CAPITAL_DAYS,
        totalRevenue: 0,
        totalWagesPaid: 0,
        totalTaxPaid: 0,
        daysNegative: 0,
        lastRevenueMicroDay: -1,
        lastWageShift: -1,
        status: "operating",
        bankruptcyDay: null,
        inventory: sector === "industrial" ? 40 : (sector === "commercial" ? 25 : 0),
        pricePerUnit: sector === "industrial" ? 5 : 8,
        dailySales: 0,
        customersServed: 0,
        productionCost: 0,
      };
      workplaces.push(wp);
      return wp;
    }

    function initializeWorkplaces() {
      workplaces.length = 0;
      workplaceIdCounter = 0;
      claimedList().forEach(function (region) {
        for (let i = 0; i < RS * RS; i++) {
          if (!region.level[i]) continue;
          const z = region.zone[i];
          const svc = SVC[region.svc[i]];
          if ((z === Z.C || z === Z.I) && region.level[i] > 0) {
            createWorkplace(region, i, z, region.level[i]);
          } else if (svc && region.level[i] > 0 && ["fire", "school", "clinic", "police", "water", "power"].indexOf(svc) >= 0) {
            createWorkplace(region, i, "service", region.level[i]);
          }
        }
      });
      econInitialized = true;
      log("Economy initialized: " + workplaces.length + " workplaces");
    }

    function syncEconomyWorkers() {
      if (!econInitialized) return;
      workplaces.forEach(function (wp) { wp.workers = []; });
      citizens.forEach(function (c) {
        if (c.status !== "active" || !c.job || !c.job.workplace) return;
        const src = c.job.workplace;
        const match = workplaces.find(function (wp) {
          return wp.gx === src.gx && wp.gy === src.gy && wp.sector === src.sector;
        });
        if (match && match.workers.indexOf(c.id) < 0) {
          match.workers.push(c.id);
          c.money = c.money || 0;
        }
      });
    }

    function payWages() {
      workplaces.forEach(function (wp) {
        if (wp.status !== "operating" || wp.isPublic) return;
        wp.workers.forEach(function (workerId) {
          const citizen = citizens.find(function (c) { return c.id === workerId; });
          if (citizen && citizen.status === "active") {
            citizen.money = (citizen.money || 0) + wp.wagePerShift;
            wp.balance -= wp.wagePerShift;
            wp.totalWagesPaid += wp.wagePerShift;
            citizen.lastPaidShift = Date.now();
          }
        });
      });
    }

    function payPublicPayroll() {
      workplaces.forEach(function (wp) {
        if (!wp.isPublic) return;
        wp.workers.forEach(function (workerId) {
          const citizen = citizens.find(function (c) { return c.id === workerId; });
          if (citizen && citizen.status === "active") {
            citizen.money = (citizen.money || 0) + wp.wagePerShift;
            S.cash -= wp.wagePerShift;
            wp.totalWagesPaid += wp.wagePerShift;
          }
        });
      });
    }

    function calculateRevenue() {
      workplaces.forEach(function (wp) {
        wp.dailySales = 0;
        wp.customersServed = 0;
      });
      citizens.forEach(function (citizen) {
        if (citizen.status !== "active" || !citizen.job) return;
        if (!citizen.money || citizen.money < 5) return;
        const hh = citizen.household;
        if (!hh) return;
        const nearbyShops = workplaces.filter(function (wp) {
          return !wp.isPublic && wp.sector === "commercial" && wp.status === "operating"
            && wp.inventory > 0
            && Math.abs(wp.gx - hh.gx) + Math.abs(wp.gy - hh.gy) <= 20;
        });
        if (!nearbyShops.length) return;
        const spendAmount = Math.min(citizen.money * (0.1 + Math.random() * 0.2), 50);
        let totalWeight = 0;
        const shopWeights = nearbyShops.map(function (wp) {
          const dist = Math.abs(wp.gx - hh.gx) + Math.abs(wp.gy - hh.gy);
          const weight = 1 / (1 + dist * 0.1);
          totalWeight += weight;
          return { wp: wp, weight: weight };
        });
        let roll = Math.random() * totalWeight;
        let chosenShop = nearbyShops[0];
        for (let i = 0; i < shopWeights.length; i++) {
          roll -= shopWeights[i].weight;
          if (roll <= 0) { chosenShop = shopWeights[i].wp; break; }
        }
        const purchase = Math.min(spendAmount, chosenShop.inventory * chosenShop.pricePerUnit);
        if (purchase > 0) {
          citizen.money -= purchase;
          chosenShop.dailySales += purchase;
          chosenShop.customersServed++;
          chosenShop.inventory -= Math.ceil(purchase / chosenShop.pricePerUnit);
        }
      });
      workplaces.forEach(function (wp) {
        if (wp.status !== "operating" || wp.isPublic) return;
        if (wp.sector === "industrial" && wp.workers.length > 0) {
          wp.inventory = (wp.inventory || 0) + wp.workers.length * 5;
          wp.productionCost = wp.workers.length * 3;
        }
        if (wp.sector !== "commercial") return;
        wp.inventory = wp.inventory || 0;
        wp.pricePerUnit = wp.pricePerUnit || 8;
        if (wp.inventory < 20 && wp.workers.length > 0) {
          const nearbyIndustrial = workplaces.filter(function (iwp) {
            return iwp.sector === "industrial" && iwp.status === "operating"
              && iwp.inventory > 10
              && Math.abs(iwp.gx - wp.gx) + Math.abs(iwp.gy - wp.gy) <= 30;
          });
          nearbyIndustrial.sort(function (a, b) { return a.pricePerUnit - b.pricePerUnit; });
          if (nearbyIndustrial.length) {
            const supplier = nearbyIndustrial[0];
            const buyAmount = Math.min(30, supplier.inventory);
            const cost = buyAmount * supplier.pricePerUnit;
            if (wp.balance >= cost) {
              wp.balance -= cost;
              supplier.balance += cost;
              wp.inventory += buyAmount;
              supplier.inventory -= buyAmount;
            }
          }
        }
        const nearbyCrimes = activeCrimesNear(wp.gx, wp.gy, 30);
        const crimeMult = Math.max(0.3, 1 - nearbyCrimes * ECON.CRIME_REVENUE_PENALTY);
        const nearbyFires = activeFires.filter(function (f) {
          return !f.contained && Math.abs(f.gx - wp.gx) + Math.abs(f.gy - wp.gy) <= 30;
        }).length;
        const fireMult = Math.max(0.3, 1 - nearbyFires * ECON.FIRE_REVENUE_PENALTY);
        const workerCount = wp.workers.length;
        let staffMult = 1;
        if (workerCount < 2) staffMult = Math.max(0.5, 1 - (2 - workerCount) * ECON.UNDERSTAFFED_PENALTY);
        if (workerCount >= 4) staffMult *= 1 + ECON.OVERSTAFF_BONUS;
        else if (workerCount >= 3) staffMult *= 1 + ECON.FULL_STAFF_BONUS;
        const finalRevenue = wp.dailySales * crimeMult * fireMult * staffMult;
        const tax = finalRevenue * ECON.TAX_RATE;
        wp.balance += finalRevenue - tax;
        wp.totalRevenue += finalRevenue;
        wp.totalTaxPaid += tax;
        S.cash += tax;
        if (wp.balance < 0) {
          wp.daysNegative++;
          if (wp.daysNegative >= ECON.BANKRUPTCY_GRACE_DAYS && wp.status === "operating") {
            wp.status = "struggling";
            logEvent("economy", "Business struggling: " + wp.id, { gx: wp.gx, gy: wp.gy }, "high");
          }
        } else {
          wp.daysNegative = 0;
          if (wp.status === "struggling") wp.status = "operating";
        }
      });
    }

    function checkBankruptcies() {
      workplaces.filter(function (wp) {
        return wp.daysNegative >= ECON.BANKRUPTCY_GRACE_DAYS && wp.status !== "bankrupt";
      }).forEach(function (wp) {
        wp.status = "bankrupt";
        wp.bankruptcyDay = S.day;
        wp.workers.forEach(function (workerId) {
          const citizen = citizens.find(function (c) { return c.id === workerId; });
          if (citizen) {
            citizen.job = null;
            citizen.daysUnemployed = 0;
            citizen.money = citizen.money || 0;
          }
        });
        wp.workers = [];
        const tile = regionOf(wp.gx, wp.gy);
        if (tile) {
          tile.r.zone[wp.tile] = 0;
          tile.r.level[wp.tile] = 0;
          tile.r.bldg[wp.tile] = 0;
          tile.r.zoneDirty = true;
          recomputeRegion(tile.r);
        }
        logEvent("economy", "Business bankrupt and demolished: " + wp.id, { gx: wp.gx, gy: wp.gy }, "emergency");
        toast("BANKRUPTCY - Business at " + wp.gx + "," + wp.gy + " collapsed");
      });
    }

    function tickEconomy() {
      if (!econInitialized) {
        initializeWorkplaces();
        lastRevenueTick = Date.now();
        lastWageTick = Date.now();
      }
      syncEconomyWorkers();
      const now = Date.now();
      if (now - lastRevenueTick >= ECON.REVENUE_TICK_MS) {
        calculateRevenue();
        checkBankruptcies();
        lastRevenueTick = now;
      }
      if (now - lastWageTick >= ECON.WORK_SHIFT_MS) {
        payWages();
        payPublicPayroll();
        lastWageTick = now;
      }
    }

    function getEconomicDashboard() {
      const shops = workplaces.filter(function (wp) { return !wp.isPublic; });
      const publicServices = workplaces.filter(function (wp) { return wp.isPublic; });
      return {
        shops: shops.length,
        publicServices: publicServices.length,
        totalWorkers: workplaces.reduce(function (s, wp) { return s + wp.workers.length; }, 0),
        totalRevenue: shops.reduce(function (s, wp) { return s + wp.totalRevenue; }, 0),
        totalWages: workplaces.reduce(function (s, wp) { return s + wp.totalWagesPaid; }, 0),
        totalTax: shops.reduce(function (s, wp) { return s + wp.totalTaxPaid; }, 0),
        avgShopBalance: shops.length ? shops.reduce(function (s, wp) { return s + wp.balance; }, 0) / shops.length : 0,
        cityCash: S.cash,
        bankruptCount: workplaces.filter(function (wp) { return wp.status === "bankrupt"; }).length,
        strugglingCount: workplaces.filter(function (wp) { return wp.status === "struggling"; }).length,
        bySector: {
          commercial: shops.filter(function (wp) { return wp.sector === "commercial"; }).length,
          industrial: shops.filter(function (wp) { return wp.sector === "industrial"; }).length,
          public: publicServices.length,
        },
      };
    }

    function getWorkplaceCardHTML(wp) {
      const workers = wp.workers.map(function (id) {
        return citizens.find(function (c) { return c.id === id; });
      }).filter(Boolean);
      const avgHappiness = workers.length ? workers.reduce(function (s, c) { return s + c.happiness; }, 0) / workers.length : 0;
      const statusClass = wp.status === "bankrupt" ? "bad" : wp.status === "struggling" ? "warn" : "good";
      const statusText = wp.status === "bankrupt" ? "BANKRUPT" : wp.status === "struggling" ? "STRUGGLING" : "OPERATING";
      const workerLines = workers.length
        ? workers.map(function (c) {
          return "<div class=\'worker-mini\'>" + c.name + " (" + c.archetype + ") - $" + (c.money || 0) + " - Happiness " + Math.round(c.happiness) + "%</div>";
        }).join("")
        : "<span style=\'color:var(--mute)\'>None</span>";
      return "<div class=\'workplace-card\'>"
        + "<div class=\'workplace-header\'><h3>" + wp.sector + " #" + wp.id + "</h3>"
        + "<span class=\'status " + statusClass + "\'>" + statusText + "</span></div>"
        + "<div class=\'workplace-stats\'>"
        + "<div class=\'stat-row\'>Workers: <b>" + wp.workers.length + "/" + wp.capacity + "</b></div>"
        + "<div class=\'stat-row\'>Balance: <b>" + money(wp.balance) + "</b></div>"
        + "<div class=\'stat-row\'>Inventory: <b>" + (wp.inventory || 0) + "</b></div>"
        + "<div class=\'stat-row\'>Daily sales: <b>" + money(Math.round(wp.dailySales || 0)) + "</b></div>"
        + "<div class=\'stat-row\'>Wage/shift: <b>$" + wp.wagePerShift + "</b></div>"
        + "<div class=\'stat-row\'>Tax paid: <b>" + money(wp.totalTaxPaid) + "</b></div>"
        + "<div class=\'stat-row\'>Avg happiness: <b>" + Math.round(avgHappiness) + "%</b></div>"
        + "</div><div class=\'workplace-workers\'><b>Workers:</b>" + workerLines + "</div></div>";
    }

    function inspectWorkplace(workplaceId) {
      const wp = workplaces.find(function (w) { return w.id === workplaceId; });
      if (!wp) return;
      el("inspector").classList.remove("hidden");
      el("ins-title").textContent = "Workplace: " + wp.sector + " #" + wp.id;
      el("ins-body").innerHTML = getWorkplaceCardHTML(wp);
    }

    const economyAPI = {
      workplaces: function () { return workplaces; },
      getDashboard: getEconomicDashboard,
      inspectWorkplace: inspectWorkplace,
      tickEconomy: tickEconomy,
    };


    // ---------------------------------------------------------------- helpers (add rndInt if not exists)
    // (rndInt already exists above as helper)

  // ---------------------------------------------------------------- regions
  function makeRegion(rx, ry) {
      return {
        rx, ry, claimed: false,
        terrain: null, road: null, rail: null, zone: null, level: null, bldg: null, svc: null,
        owned: null, powerOn: null, waterOn: null, value: null, commuteDistance: null,
        zoneList: [], zoneDirty: true,
        pop: 0, jobs: 0, built: 0, roads: 0, upkeep: 0, mood: 60, access: 0, parks: 0, theme: "oldtown",
        trades: 0, commerce: 0,
      };
    }

  function generateRegion(r, seed) {
    const n = RS * RS;
      r.terrain = new Uint8Array(n);
      r.road = new Uint8Array(n);
      r.rail = new Uint8Array(n);
      r.zone = new Uint8Array(n);
      r.level = new Uint8Array(n);
      r.bldg = new Uint8Array(n);
      r.svc = new Uint8Array(n);
      r.owned = new Uint8Array(n).fill(1);
      r.powerOn = new Uint8Array(n);
      r.waterOn = new Uint8Array(n);
      r.value = new Uint8Array(n);
      r.svcVal = new Uint8Array(n);     // service contribution, kept apart from the final value
      r.poll = new Uint8Array(n);       // pollution
      r.crime = new Uint8Array(n);      // crime
      r.policeOn = new Uint8Array(n);   // police coverage
      r.density = new Uint8Array(n);    // 1x1 / 2x2 / 3x3 development
      r.density = new Uint8Array(n).fill(1); // 1x1, 2x2, 3x3 density (1, 2, or 3)

    const hgt = valueNoise(RS, RS, 22, seed);
    const for1 = valueNoise(RS, RS, 14, seed + 991);
    const sample = [];
    for (let i = 0; i < hgt.length; i += 9) sample.push(hgt[i]);
    sample.sort((a, b) => a - b);
    const q = (f) => sample[Math.min(sample.length - 1, Math.floor(sample.length * f))];
    const qWater = q(0.085), qSand = q(0.115), qRock = q(0.962), qForest = q(0.80), qMountain = q(0.9945);
    for (let y = 0; y < RS; y++) for (let x = 0; x < RS; x++) {
      const i = y * RS + x;
      let t = TERRAIN.MEADOW;
      if (hgt[i] < qWater) t = TERRAIN.WATER;
      else if (hgt[i] < qSand) t = TERRAIN.SAND;
      else if (hgt[i] > qMountain) t = TERRAIN.MOUNTAIN;
      else if (hgt[i] > qRock) t = TERRAIN.ROCK;
      else if (for1[i] > qForest) t = TERRAIN.FOREST;
      r.terrain[i] = t;
    }
    // Rivers must read as water, not as a thread: widen every water body by one tile so
    // the narrowest channel is 3 wide (was often 1, which looked blocky on the diagonals),
    // then rebuild the sand shoreline around the new edges.
    (function widenWater() {
      const src = r.terrain.slice();
      for (let y = 1; y < RS - 1; y++) {
        for (let x = 1; x < RS - 1; x++) {
          const i = y * RS + x;
          if (src[i] !== TERRAIN.WATER) continue;
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const j = (y + dy) * RS + (x + dx);
            const t = src[j];
            if (t === TERRAIN.MEADOW || t === TERRAIN.FOREST || t === TERRAIN.SAND) r.terrain[j] = TERRAIN.WATER;
          }
        }
      }
      // shoreline: land next to water becomes sand so the edge reads as a beach
      const after = r.terrain.slice();
      for (let y = 1; y < RS - 1; y++) {
        for (let x = 1; x < RS - 1; x++) {
          const i = y * RS + x;
          if (after[i] === TERRAIN.WATER || after[i] === TERRAIN.MOUNTAIN || after[i] === TERRAIN.ROCK) continue;
          let edge = false;
          for (let dy = -1; dy <= 1 && !edge; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue;
              if (after[(y + dy) * RS + (x + dx)] === TERRAIN.WATER) { edge = true; break; }
            }
          }
          if (edge) r.terrain[i] = TERRAIN.SAND;
        }
      }
    })();

    // a few islands so open water is somewhere, not just a wall
    let waterCount = 0;
    for (let i = 0; i < r.terrain.length; i++) if (r.terrain[i] === TERRAIN.WATER) waterCount++;
    if (waterCount / r.terrain.length > 0.1) {
      const islands = 1 + Math.floor(hash2(r.rx + 41, r.ry + 17) * 3);
      for (let k = 0; k < islands; k++) {
        let tries = 40, placed = false;
        while (tries-- && !placed) {
          const ix = 12 + Math.floor(Math.random() * (RS - 24));
          const iy = 12 + Math.floor(Math.random() * (RS - 24));
          const i0 = iy * RS + ix;
          if (r.terrain[i0] !== TERRAIN.WATER) continue;
          let deep = true;
          for (let dy = -2; dy <= 2 && deep; dy++) for (let dx = -2; dx <= 2; dx++) {
            const t = r.terrain[(iy + dy) * RS + (ix + dx)];
            if (t !== TERRAIN.WATER) { deep = false; break; }
          }
          if (!deep) continue;
          const size = 1 + Math.floor(Math.random() * 2);
          for (let dy = -size; dy <= size; dy++) for (let dx = -size; dx <= size; dx++) {
            if (Math.abs(dx) + Math.abs(dy) > size + 1) continue;
            const j = (iy + dy) * RS + (ix + dx);
            r.terrain[j] = (Math.abs(dx) + Math.abs(dy) <= size - 1) ? TERRAIN.MEADOW : TERRAIN.SAND;
          }
          placed = true;
        }
      }
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
    r.theme = pickTheme(r.terrain, r.rx, r.ry);
    r.name = (THEMES[r.theme] || THEMES.oldtown).label;
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
    placeLandmarks(r);
    refreshLinks();
    refreshHud();
    drawMinimap();
    if (!free) { toast("Claimed · " + (r.name || "new land") + " · " + claimedList().length + " of " + (GW * GH)); sfx("milestone"); }
    return true;
  }

  // ---------------------------------------------------------------- roads
  function hasRoad(gx, gy) { const t = regionOf(gx, gy); return !!t && t.r.road[t.i] === 1; }
  // Sprite bits follow the screen, not the world. N=1 E=2 S=4 W=8 in view space,
  // so a rotated camera still picks the piece that meets its neighbours.
  function linkMask(gx, gy, has) {
    const v = toView(gx, gy);
    const on = (dvx, dvy) => {
      const w = fromView(v.gx + dvx, v.gy + dvy);
      return has(w.gx, w.gy);
    };
    let m = 0;
    if (on(0, -1)) m |= 1;
    if (on(1, 0)) m |= 2;
    if (on(0, 1)) m |= 4;
    if (on(-1, 0)) m |= 8;
    return m;
  }
  function roadMask(gx, gy) { return linkMask(gx, gy, hasRoad); }
  function slopeRoadKey(mask) {
    const ns = (mask & 1 ? 1 : 0) + (mask & 4 ? 1 : 0);
    const ew = (mask & 2 ? 1 : 0) + (mask & 8 ? 1 : 0);
    return ew > ns ? "c14_switchback_road_w" : "c13_switchback_road_n";
  }
  function hasRoadNear(gx, gy) {
      return hasRoad(gx, gy) || hasRoad(gx + 1, gy) || hasRoad(gx - 1, gy) || hasRoad(gx, gy + 1) || hasRoad(gx, gy - 1);
    }
    // A rail depot IS a rail node: track laid up to it connects, trains can enter, and the
  // neighbouring track tiles draw a segment pointing at the station.
  function hasRail(gx, gy) {
    const t = regionOf(gx, gy);
    if (!t) return false;
    return t.r.rail[t.i] === 1 || SVC[t.r.svc[t.i]] === "rail";
  }
    function railMask(gx, gy) { return linkMask(gx, gy, hasRail); }

    // ---------------------------------------------------------------- services
  function recomputeRegion(r) {
    const n = RS * RS;
    r.powerOn.fill(0); r.waterOn.fill(0); r.policeOn.fill(0); r.svcVal.fill(0);
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
    paint("police", r.policeOn, 9);
    computeUtilities(r);
    for (let i = 0; i < n; i++) {
      const name = SVC[r.svc[i]];
      if (!name) continue;
      const rule = SVC_RULE[name];
      if (!rule || !rule.value || !rule.radius) continue;
      const tx = i % RS, ty = (i / RS) | 0, rad = rule.radius;
      for (let y = Math.max(0, ty - rad); y <= Math.min(RS - 1, ty + rad); y++) {
        for (let x = Math.max(0, tx - rad); x <= Math.min(RS - 1, tx + rad); x++) {
          const dx = x - tx, dy = y - ty, d2 = dx * dx + dy * dy;
          if (d2 <= rad * rad) {
            const j = y * RS + x;
            r.svcVal[j] = clamp(r.svcVal[j] + Math.round(rule.value * (0.5 + (1 - Math.sqrt(d2) / rad))), 0, 255);
          }
        }
      }
    }
    computeFields(r);
    recalcRegion(r);
  
  initializeFireTrucks();
    initializeAmbulances();
    initializePoliceCars();
  }

  // ---------------------------------------------------------------- fields
  // Land value, pollution and crime as real per-tile fields (SimCity 3000 style):
  // water/forest/road set the base, services add in recomputeRegion, industry and power
  // plant pollution subtract, density-driven crime subtracts, police and parks push back.
  // ---------------------------------------------------------------- utilities
  // Power and water are networks, not just radii: plants have capacity (MW / pressure
  // units), every building draws by level, and when demand exceeds capacity the load
  // sheds in priority order — industry first, then commerce, homes last. Water sheds by
  // distance from the nearest pump (a BFS pressure field), so a far district browns out
  // before the one next door.
  function computeUtilities(r) {
    const n = RS * RS;
    let plants = 0, pumps = 0;
    for (let i = 0; i < n; i++) {
      const s = SVC[r.svc[i]];
      if (s === "power") plants++;
      else if (s === "water") pumps++;
    }
    const capP = 30 + plants * 24;
    const capW = 24 + pumps * 28;
    let demP = 0, demW = 0;
    for (let i = 0; i < n; i++) {
      const lv = r.level[i];
      if (!lv) continue;
      const z = r.zone[i];
      const drawP = 1 + lv * 0.6 + (z === Z.I ? 0.8 : 0);
      const drawW = 0.8 + lv * 0.4 + (z === Z.C ? 0.2 : 0);
      if (r.powerOn[i]) demP += drawP;
      if (r.waterOn[i]) demW += drawW;
    }
    r.powerCap = Math.round(capP);
    r.powerDemand = Math.round(demP);
    r.waterCap = Math.round(capW);
    r.waterDemand = Math.round(demW);
    r.brownout = 0;
    if (demP > capP) {
      // shed industry, then commerce, then homes until the load fits
      let over = demP - capP;
      const order = [Z.I, Z.C, Z.R];
      for (const z of order) {
        for (let i = 0; i < n && over > 0; i++) {
          if (!r.powerOn[i] || r.zone[i] !== z || !r.level[i]) continue;
          r.powerOn[i] = 0;
          over -= 1 + r.level[i] * 0.6 + (z === Z.I ? 0.8 : 0);
          r.brownout++;
        }
        if (over <= 0) break;
      }
    }
    // water pressure field: BFS distance from every pump
    if (!r.waterDist) r.waterDist = new Uint8Array(n).fill(255);
    r.waterDist.fill(255);
    const q = [];
    for (let i = 0; i < n; i++) {
      if (SVC[r.svc[i]] === "water") { r.waterDist[i] = 0; q.push(i); }
    }
    let head = 0;
    while (head < q.length) {
      const i = q[head++];
      const d = r.waterDist[i];
      if (d >= 12) continue;
      const x = i % RS, y = (i / RS) | 0;
      for (let k = 0; k < 4; k++) {
        const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0);
        const ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= RS || ny >= RS) continue;
        const j = ny * RS + nx;
        if (r.waterDist[j] <= d + 1) continue;
        r.waterDist[j] = d + 1;
        q.push(j);
      }
    }
    for (let i = 0; i < n; i++) r.waterOn[i] = r.waterDist[i] <= 9 ? 1 : 0;
    if (demW > capW) {
      let over = demW - capW;
      for (let dist = 9; dist >= 0 && over > 0; dist--) {
        for (let i = 0; i < n && over > 0; i++) {
          if (!r.waterOn[i] || r.waterDist[i] !== dist || !r.level[i]) continue;
          r.waterOn[i] = 0;
          over -= 0.8 + r.level[i] * 0.4;
          r.brownout++;
        }
      }
    }
  }

  function computeFields(r) {
    const n = RS * RS;
    r.poll.fill(0);
    r.crime.fill(0);
    // pollution sources: industry by level, power plants
    for (let i = 0; i < n; i++) {
      const lv = r.level[i], z = r.zone[i], svc = SVC[r.svc[i]];
      if (!((lv > 0 && z === Z.I) || svc === "power")) continue;
      const power = svc === "power";
      const amount = power ? 26 : 10 + lv * 7;
      const rad = power ? 6 : 3 + lv;
      const tx = i % RS, ty = (i / RS) | 0;
      for (let y = Math.max(0, ty - rad); y <= Math.min(RS - 1, ty + rad); y++) {
        for (let x = Math.max(0, tx - rad); x <= Math.min(RS - 1, tx + rad); x++) {
          const dx = x - tx, dy = y - ty, d2 = dx * dx + dy * dy;
          if (d2 > rad * rad) continue;
          const j = y * RS + x;
          const fall = 1 - Math.sqrt(d2) / rad;
          r.poll[j] = Math.min(100, r.poll[j] + Math.round(amount * fall));
        }
      }
    }
    // one diffusion pass so pollution bleeds instead of stopping at a ring
    const tmp = r._pollTmp || (r._pollTmp = new Uint8Array(n));
    tmp.set(r.poll);
    for (let y = 1; y < RS - 1; y++) {
      for (let x = 1; x < RS - 1; x++) {
        const j = y * RS + x;
        const avg = (tmp[j - 1] + tmp[j + 1] + tmp[j - RS] + tmp[j + RS]) >> 2;
        r.poll[j] = Math.min(100, ((tmp[j] * 2 + avg) / 3 | 0) * ((S.ordinances && S.ordinances.cleanAir) ? 0.75 : 1));
      }
    }
    // crime: neighbour density + unemployment, less police and parks
    const unemp = clamp((S.pop - (S.jobs || 0)) / Math.max(1, S.pop), 0, 1);
    const zoned = (r.zoneList && r.zoneList.length) || 1;
    const density = clamp((r.built || 0) / zoned, 0, 1);
    for (let y = 0; y < RS; y++) {
      for (let x = 0; x < RS; x++) {
        const j = y * RS + x;
        let near = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const yy = y + dy, xx = x + dx;
            if (yy < 0 || yy >= RS || xx < 0 || xx >= RS) continue;
            const k = yy * RS + xx;
            if (r.level[k] > 0) near++;
          }
        }
        const base = 6 + near * 1.1 + unemp * 26 + density * 18;
        const safety = r.policeOn[j] ? 20 : 0;
        const green = SVC[r.svc[j]] === "park" ? 6 : 0;
        const watch = (S.ordinances && S.ordinances.watch) ? 8 : 0;
        r.crime[j] = clamp(Math.round(base - safety - green - watch), 0, 100);
      }
    }
    // final land value: base terrain/access, + services, − pollution, − crime
    for (let y = 0; y < RS; y++) {
      for (let x = 0; x < RS; x++) {
        const j = y * RS + x;
        const t = r.terrain[j];
        let base = t === TERRAIN.SAND ? 14 : t === TERRAIN.FOREST ? 22 : t === TERRAIN.WATER ? 0 : 18;
        if (t === TERRAIN.ROCK) base = 8;
        if (t === TERRAIN.MOUNTAIN) base = 4;
        // water within 2 tiles is the biggest single driver
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const yy = y + dy, xx = x + dx;
            if (yy < 0 || yy >= RS || xx < 0 || xx >= RS) continue;
            if (r.terrain[yy * RS + xx] === TERRAIN.WATER) { base += 18; dy = 3; break; }
          }
        }
        if (r.road[j]) base += 8;
        else {
          let roadNear = false;
          for (let dy = -1; dy <= 1 && !roadNear; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const yy = y + dy, xx = x + dx;
              if (yy < 0 || yy >= RS || xx < 0 || xx >= RS) continue;
              if (r.road[yy * RS + xx]) { roadNear = true; break; }
            }
          }
          if (roadNear) base += 4;
        }
        const commute = r.commuteDistance ? r.commuteDistance[j] : 0;
        if (commute > 12) base -= Math.min(15, (commute - 12) * 0.7);
        const ordGreen = (S.ordinances && S.ordinances.greenbelt) ? 6 : 0;
        const val = base + r.svcVal[j] + ordGreen - r.poll[j] * 0.45 - r.crime[j] * 0.30;
        r.value[j] = clamp(Math.round(val), 0, 255);
      }
    }
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
      const dens = r.density ? (r.density[i] || 1) : 1;
      const cap = (z === Z.R ? 4 : 6) * lv * dens;
      if (z === Z.R) pop += cap; else jobs += cap;
    }
    r.pop = pop; r.jobs = jobs; r.built = built; r.roads = roads; r.parks = parks;
    r.upkeep = roads * 0.55 + svcUp;
  }

  // ---------------------------------------------------------------- links
  function refreshLinks() {
    S.links = [];
    // any lay/bulldoze/claim bumps this; the rail line cache keys off it
    S.railVer = (S.railVer || 0) + 1;
    const list = claimedList();
    const byKey = {};
    list.forEach((r) => { byKey[regionKey(r.rx, r.ry)] = r; });
    list.forEach((r) => {
      const e = byKey[regionKey(r.rx + 1, r.ry)];
      if (e) {
        let n = 0;
        for (let y = 0; y < RS; y++) if (r.road[y * RS + (RS - 1)] && e.road[y * RS]) n++;
        if (n) S.links.push({ a: r, b: e, strength: n, kind: "road" });
      }
      const s = byKey[regionKey(r.rx, r.ry + 1)];
      if (s) {
        let n = 0;
        for (let x = 0; x < RS; x++) if (r.road[(RS - 1) * RS + x] && s.road[x]) n++;
        if (n) S.links.push({ a: r, b: s, strength: n, kind: "road" });
      }
    });
    // ferry routes: two neighbouring regions that both have a dock are joined by
    // water as well as by road, so a harbour town can feed a landlocked one
    list.forEach((r) => {
      r.docks = 0;
      for (let i = 0; i < RS * RS; i++) if (SVC[r.svc[i]] === "dock") r.docks++;
    });
    list.forEach((r) => {
      [[1, 0], [0, 1]].forEach(([dx, dy]) => {
        const nb = byKey[regionKey(r.rx + dx, r.ry + dy)];
        if (!nb || !r.docks || !nb.docks) return;
        if (S.links.some((l) => (l.a === r && l.b === nb) || (l.a === nb && l.b === r))) return;
        S.links.push({ a: r, b: nb, strength: 5, kind: "ferry" });
      });
    });

    // rail: two neighbouring regions with depots are joined by track, which is
    // the strongest link in the game and ignores the road network entirely
    list.forEach((r) => {
      r.rails = 0;
      for (let i = 0; i < RS * RS; i++) if (SVC[r.svc[i]] === "rail") r.rails++;
    });
    list.forEach((r) => {
      [[1, 0], [0, 1]].forEach(([dx, dy]) => {
        const nb = byKey[regionKey(r.rx + dx, r.ry + dy)];
        if (!nb || !r.rails || !nb.rails) return;
        if (S.links.some((l) => l.kind === "rail" && ((l.a === r && l.b === nb) || (l.a === nb && l.b === r)))) return;
        S.links.push({ a: r, b: nb, strength: 7, kind: "rail" });
      });
    });

    list.forEach((r) => { r.access = r.jobs; });
    S.links.forEach((l) => {
      const share = 0.75 * Math.min(1, l.strength / 6);
      l.a.access += l.b.jobs * share;
      l.b.access += l.a.jobs * share;
    });
  }

  // ---------------------------------------------------------------- commutes & trips
  function updateCommutes() {
    const homes = [];
    const jobs = [];
    const claimed = claimedList();
    claimed.forEach((r) => {
      if (!r.commuteDistance) r.commuteDistance = new Float32Array(RS * RS);
      for (let i = 0; i < RS * RS; i++) {
        if (!r.level[i] || !r.zone[i]) continue;
        const gx = r.rx * RS + (i % RS);
        const gy = r.ry * RS + Math.floor(i / RS);
        if (r.zone[i] === Z.R) {
          homes.push({ r, i, gx, gy });
        } else if (r.zone[i] === Z.C || r.zone[i] === Z.I) {
          jobs.push({ r, i, gx, gy });
        }
      }
    });

    let totalDist = 0;
    let count = 0;
    const COMMUTE_LIMIT = 30;

    homes.forEach((h) => {
      let minDist = 60;
      if (jobs.length > 0) {
        jobs.forEach((j) => {
          const d = Math.abs(h.gx - j.gx) + Math.abs(h.gy - j.gy);
          if (d < minDist) minDist = d;
        });
      }
      h.r.commuteDistance[h.i] = minDist;
      if (minDist > COMMUTE_LIMIT) {
        const penalty = (minDist - COMMUTE_LIMIT) * 3;
        h.r.value[h.i] = Math.max(0, h.r.value[h.i] - penalty);
      }
      totalDist += minDist;
      count++;
    });

    jobs.forEach((j) => {
      let minDist = 60;
      if (homes.length > 0) {
        homes.forEach((h) => {
          const d = Math.abs(j.gx - h.gx) + Math.abs(j.gy - h.gy);
          if (d < minDist) minDist = d;
        });
      }
      j.r.commuteDistance[j.i] = minDist;
      if (minDist > COMMUTE_LIMIT) {
        const penalty = (minDist - COMMUTE_LIMIT) * 3;
        j.r.value[j.i] = Math.max(0, j.r.value[j.i] - penalty);
      }
      totalDist += minDist;
      count++;
    });

    S.avgCommute = count ? +(totalDist / count).toFixed(1) : 0;
  }

  // ---------------------------------------------------------------- totals
  function recalcWorld() {
    let pop = 0, jobs = 0, income = 0, upkeep = 0, moodSum = 0, n = 0;
    updateCommutes();
    // SimCity 3000: revenue = taxRate × population / 75 per zone. The 7% rate is the
    // calibrated default, so the multiplier keeps the existing economy at par and makes
    // the slider a real lever (below 5% growth rises, above 9% demand collapses).
    const taxMul = (S.taxRate == null ? 7 : S.taxRate) / 7;
    claimedList().forEach((r) => {
      recalcRegion(r);
      pop += r.pop; jobs += r.jobs;
      income += (r.pop * 0.85 + r.jobs * 0.5) * taxMul;
      upkeep += r.upkeep || 0;
      moodSum += r.mood; n++;
    });
    if (S.ordinances && S.ordinances.fines) income += Math.max(2, pop * 0.02);
    S.pop = pop; S.jobs = jobs; S.taxIncome = income; S.income = income - (S.bonds || 0) * (S.bondRate || 0.06) * 1000;
    S.upkeep = upkeep;
    S.mood = n ? moodSum / n : 60;
  }

  function updateDemand() {
    const spare = clamp((S.jobs - S.pop * 0.85) / Math.max(40, S.jobs), -0.45, 1);
    const shopperNeed = S.pop * 0.45, workNeed = S.pop * 0.35;
    let shops = 0, industry = 0, homes = 0;
    claimedList().forEach((r) => {
      for (let i = 0; i < RS * RS; i++) {
        const z = r.zone[i]; if (!z || !r.level[i]) continue;
        const dens = r.density ? (r.density[i] || 1) : 1;
        const cap = (z === Z.R ? 4 : 6) * r.level[i] * dens;
        if (z === Z.C) shops += cap;
        if (z === Z.I) industry += cap;
        if (z === Z.R) homes += cap;
      }
    });
    S.shopCap = shops; S.indCap = industry; S.homeCap = homes;
    const moodFactor = S.mood < 40 ? -0.25 : (S.mood > 65 ? 0.15 : 0);
    // SimCity 3000 shape: industry is driven by outside demand and leads early,
    // commerce follows population and overtakes industry as the town matures.
    // every working inter-region link adds outside demand for goods (SimCity neighbour deals)
    const trade = (S.links || []).filter((l) => l.kind === 'road' || l.kind === 'rail').length * 0.04;
    const external = 0.34 + trade - Math.min(0.20, (S.pop || 0) / 60000);
    const mature = Math.min(0.22, (S.pop || 0) / 30000);
    const taxDrag = (S.taxRate || 7) > 9 ? ((S.taxRate || 7) - 9) * 0.045 : 0;
    const taxBoost = (S.taxRate || 7) < 5 ? (5 - (S.taxRate || 7)) * 0.03 : 0;
    S.demand.r = clamp(0.42 + spare * 0.6 + moodFactor + taxBoost, 0, 1);
    S.demand.c = clamp(0.20 + mature + clamp((shopperNeed - shops) / Math.max(30, shopperNeed), -0.6, 1) * 0.7 - taxDrag, 0, 1);
    S.demand.i = clamp(external + clamp((workNeed + S.jobs * 0.1 - industry) / Math.max(30, workNeed), -0.6, 1) * 0.7 - taxDrag, 0, 1);
    S.rci = {
      r: +S.demand.r.toFixed(3), c: +S.demand.c.toFixed(3), i: +S.demand.i.toFixed(3),
      homes, shops, industry,
      ic: +(S.demand.i / Math.max(0.01, S.demand.c)).toFixed(2),
    };
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
      const commuteDist = r.commuteDistance ? r.commuteDistance[i] : 0;
      const COMMUTE_LIMIT = 30;
      if (commuteDist > COMMUTE_LIMIT) {
        const stallChance = Math.min(1, (commuteDist - COMMUTE_LIMIT) / 15);
        if (Math.random() < stallChance) continue;
      }
      const powered = r.powerOn[i] === 1, watered = r.waterOn[i] === 1;
      const lv = r.level[i];
      const landVal = r.value[i] || 0;

      // Determine density (1, 2, or 3) from road access, power/water and land value.
      // A 3x3 needs land value above a threshold (140) and full services (power + water).
      let dens = 1;
      if (landVal > 140 && powered && watered) {
        dens = 3;
      } else if (landVal > 70 && powered) {
        dens = 2;
      }
      if (!r.density) r.density = new Uint8Array(RS * RS).fill(1);
      r.density[i] = dens;

      const canUp = lv === 0 ? true : lv === 1 ? powered : (powered && watered);
      let dem = z === Z.R ? S.demand.r : z === Z.C ? S.demand.c : S.demand.i;
      if (z === Z.R) dem = clamp(dem + accessBonus, 0, 1);
      const value = landVal / 255;
      const evCom = eventCommerce(r);
      // shops grow on custom: a shop with no trade all day does not expand
      let commerce = 1;
      if (z === Z.C) commerce = (0.55 + Math.min(1.4, (r.commerce || 0) / 14)) * evCom;
      else if (z === Z.I) commerce = 0.85 + Math.min(0.5, (r.commerce || 0) / 40);
      if (lv > 0 && !canUp && Math.random() < 0.02) {
        r.level[i] = lv - 1;
        continue;
      }
      // 0.2 not 0.3: the RCI model below produces lower demand numbers than the old one
      if (dem > 0.2 && lv < 3 && canUp && Math.random() < dem * commerce * eventGrowth(r) * (0.20 + value * 0.22)) {
        r.level[i] = lv + 1;
        sfx("grow");
      } else if (lv > 0 && z === Z.C && (r.commerce || 0) < 1.5 && Math.random() < 0.03) {
        r.level[i] = lv - 1;
      } else if (dem < 0.08 && lv > 0 && Math.random() < 0.02) {
        r.level[i] = lv - 1;
      }
    }
  }

  let lastWheelSfx = 0;   // throttle for the train wheel clack (AUD-04)
  let lastTickWall = Date.now();
  function pumpTicks() {
    const now = Date.now();
    // speed control (ENG-01): 0 pauses, 1/2/3 multiply the day rate
    const rate = S.speed == null ? 1 : S.speed;
    if (rate <= 0) { lastTickWall = now; return; }
    const step = (TICK_SECONDS * 1000) / rate;
    let n = 0;
    while (now - lastTickWall >= step && n < 12) {
      lastTickWall += step;
      tick();
      n++;
    }
    // a tab that slept for hours replays a bounded stretch, same as a load
    const maxGap = step * 80;
    if (now - lastTickWall > maxGap) lastTickWall = now - maxGap;
  }

  function tick() {
      S.day++;
      // the hour advances in the frame loop; a tick only marks the day
      refreshLinks();
      recalcWorld();
      updateDemand();
      claimedList().forEach((r) => tickRegion(r, Math.min(90, Math.max(10, Math.ceil(r.zoneList.length * 0.9) || 12))));
      // pollution, crime and land value follow the buildings, so refresh them each day
      claimedList().forEach((r) => computeFields(r));
      refreshLinks();
      recalcWorld();
      updateDemand();
      claimedList().forEach((r) => {
        const unemp = clamp((r.pop - (r.access || r.jobs)) / Math.max(1, r.pop), 0, 1);
        const mood = 64 - unemp * 17 + Math.min(14, (r.parks || 0) * 1.5);
        r.mood = clamp(r.mood + (mood - r.mood) * 0.12, 0, 100);
      });
      claimedList().forEach((r) => {
        r.commerce = (r.commerce || 0) * 0.88 + (r.trades || 0) * (1 - S.rain * 0.45);
        r.trades = 0;
      });
      S.cash += S.income - S.upkeep;
      if (S.cash < -5000) { S.cash = -5000; if (S.day % 10 === 0) toast("The treasury is empty for now. Build smaller, or bulldoze what is idle."); }
      // weather drifts between dry spells and rain every couple of weeks
      if (S.weatherTimer-- <= 0) {
        S.weatherTimer = 100 + Math.floor(Math.random() * 120);
        S.rainTarget = Math.random() < 0.28 ? rnd(0.55, 1) : 0;
      }
      if (!OPT.weather) S.rainTarget = 0;
      S.rain += (S.rainTarget - S.rain) * 0.06;

      // Population-scaled emergency systems (once per tick)
            checkFireIgnition();
            spawnMedicalEmergency();
            spawnPoliceCall();

            // Population micro-simulation (once per tick)
            tickPopulation();

            checkMilestones();
            updatePeds();
            updateEvent();
            if (S.day % 7 === 0) { log(weekLine()); S.tradesToday = 0; }
            if (OPT.autosave && S.day > 0 && S.day % 10 === 0) { save(); }
            refreshHud();
          }

  function announce(train, town) {
    if (S.speed === 0) return;
    if (S.lastAnnounce !== undefined && S.day - S.lastAnnounce < 2) return;
    S.lastAnnounce = S.day;
    const hh = String(Math.floor(S.hour)).padStart(2, "0");
    log("Platform call · <b>" + town + "</b> · the " + hh + ":00 service is in.");
    sfx("trainhorn"); setTimeout(() => sfx("announce"), 380);
    // duck the radio while the platform call plays (AUD-04)
    try {
      if (window.LatticeRadio && window.LatticeRadio.playing()) {
        const base = window.LatticeRadio.vol();
        window.LatticeRadio.setVol(Math.max(0, base * 0.35));
        setTimeout(() => { try { window.LatticeRadio.setVol(base); } catch (e) {} }, 2600);
      }
    } catch (e) {}
  }

  function weekLine() {
    const n = claimedList().length;
    const lines = [
      S.tradesToday ? "The shops served " + S.tradesToday + " customers this week." : S.pop + " people across " + n + " region" + (n === 1 ? "" : "s") + " · " + S.jobs + " jobs · mood " + Math.round(S.mood) + "%.",
      "The world holds " + S.pop + " people and " + money(S.cash) + ".",
      S.rain > 0.35 ? "Rain over the district. Trade is down and the streets are thinner." : S.links.length ? S.links.length + " connection" + (S.links.length === 1 ? "" : "s") + " carrying commuters between regions." : "No two regions are joined yet — a road across a border connects them.",
    ];
    return lines[S.day % lines.length];
  }

  // ---------------------------------------------------------------- events
    // Rare and deliberate: one at a time, days apart, and never in the opening
    // minutes. Each one changes a number the player can feel.
    const EVENTS = {
      market: { days: 4, label: "Market day", colour: "#f2c14e", minPop: 120, weight: 4 },
      festival: { days: 5, label: "Festival", colour: "#d98fe0", minPop: 300, weight: 3 },
      boom: { days: 5, label: "Building boom", colour: "#6fbf73", minPop: 600, weight: 2 },
      // Fire removed from random events - now driven by checkFireIgnition() based on industrial risk
    };

    let eventDailyCount = 0;
    let eventLastDay = -1;

    function startEvent() {
      // Once per day max
      if (S.day !== eventLastDay) {
        eventDailyCount = 0;
        eventLastDay = S.day;
      }
      if (eventDailyCount >= 1) return false;

      const towns = claimedList().filter((r) => r.built > 3);
      if (!towns.length) return false;

      // Filter events by population requirements
      const availableEvents = Object.entries(EVENTS).filter(([_, def]) => S.pop >= def.minPop);
      if (!availableEvents.length) return false;

      // Weighted selection
      const totalWeight = availableEvents.reduce((sum, [_, def]) => sum + def.weight, 0);
      let roll = Math.random() * totalWeight;
      let chosenType = availableEvents[0][0];
      for (const [type, def] of availableEvents) {
        roll -= def.weight;
        if (roll <= 0) { chosenType = type; break; }
      }

      const town = towns[(Math.random() * towns.length) | 0];
      if (chosenType === "fire") sfx("fire"); else if (chosenType === "storm") sfx("siren");
      const def = EVENTS[chosenType];
      S.event = { type: chosenType, region: town, until: S.day + def.days, started: S.day };
      S.eventHistory.push(chosenType);
      eventDailyCount++;

      if (chosenType === "market") {
        toast("MARKET DAY · " + (town.name || "a district"));
        log("<b>Market day</b> in " + (town.name || "the district") + " — the streets are thick with trade.");
      } else if (chosenType === "festival") {
        town.mood = clamp(town.mood + 9, 0, 100);
        toast("FESTIVAL · " + (town.name || "a district"));
        log("<b>Festival</b> in " + (town.name || "the district") + " — mood is up for days.");
      } else {
        toast("BOOM · " + (town.name || "a district"));
        log("<b>Building boom</b> in " + (town.name || "the district") + " — cranes on every corner.");
      }
      sfx("milestone");
      return true;
    }

    function updateEvent() {
      if (S.event && S.day >= S.event.until) {
        S.event = null;
        S.nextEventDay = S.day + 14 + Math.floor(Math.random() * 16);
        S.fireTile = null;
      }
      if (!S.event && S.day >= S.nextEventDay && S.day > 20 && S.pop >= 120) startEvent();
    }

    function eventCommerce(region) {
      if (!S.event || S.event.region !== region) return 1;
      if (S.event.type === "market") return 1.6;
      if (S.event.type === "festival") return 1.25;
      return 1;
    }
    function eventGrowth(region) {
      if (!S.event || S.event.region !== region) return 1;
      if (S.event.type === "boom") return 1.5;
      return 1;
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
  // ---------------------------------------------------------------- life
  // Citizens commute: they spawn at a home, walk the road network toward a
  // workplace, and go home again. Routes are greedy, which is cheap and looks
  // right at this camera distance.
  const PALETTE = ["#e8d7b8", "#f0b1a0", "#9fd8a8", "#a8c6f0", "#f0d79f", "#d7b8e8", "#e8a8a8", "#b8e8e0", "#f0c4a0", "#c9d7a8"];
  const SKIN = ["#e8b48a", "#c98d63", "#8a5a3b", "#f0c9a0", "#6f452c"];

  function roadsNear(gx, gy) {
    const out = [];
    [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      if (hasRoad(gx + dx, gy + dy)) out.push({ x: gx + dx, y: gy + dy });
    });
    return out;
  }

  function builtTiles(zones) {
    const out = [];
    claimedList().forEach((r) => {
      for (let i = 0; i < RS * RS; i++) {
        if (r.level[i] && zones.indexOf(r.zone[i]) !== -1) {
          out.push({ x: r.rx * RS + (i % RS), y: r.ry * RS + ((i / RS) | 0) });
        }
      }
    });
    return out;
  }

  function greedyRoute(from, to, maxSteps) {
    const path = [from];
    let x = from.x, y = from.y;
    for (let step = 0; step < maxSteps; step++) {
      if (x === to.x && y === to.y) return path;
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => hasRoad(x + dx, y + dy));
      if (!opts.length) break;
      let best = null, bestScore = Infinity;
      opts.forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        const d = Math.abs(nx - to.x) + Math.abs(ny - to.y);
        const score = d + Math.random() * 1.5;
        if (score < bestScore) { bestScore = score; best = [nx, ny]; }
      });
      x = best[0]; y = best[1];
      path.push({ x, y });
      if (path.length > 90) break;
    }
    return path;
  }

  function spawnCitizen() {
    const homes = S.homes || [], jobs = S.workplaces || [];
    if (!homes.length || !jobs.length) return null;
    const home = homes[(Math.random() * homes.length) | 0];
    const job = jobs[(Math.random() * jobs.length) | 0];
    const starts = roadsNear(home.x, home.y), ends = roadsNear(job.x, job.y);
    if (!starts.length || !ends.length) return null;
    const start = starts[(Math.random() * starts.length) | 0];
    const end = ends[(Math.random() * ends.length) | 0];
    const path = greedyRoute(start, end, 90);
    if (path.length < 2) return null;
    return {
      path, at: 0, t: Math.random(), speed: rnd(0.5, 1.1), dest: job,
      hue: (Math.random() * 360) | 0,
      coat: PALETTE[(Math.random() * PALETTE.length) | 0],
      skin: SKIN[(Math.random() * SKIN.length) | 0],
      hat: Math.random() < 0.25,
      umbrella: Math.random() < 0.15,
      walk: Math.random() * 6.28,
    };
  }

  function spawnVehicle() {
    const roads = S.roadSpots || [];
    if (roads.length < 2) return null;
    const a = roads[(Math.random() * roads.length) | 0];
    const b = roads[(Math.random() * roads.length) | 0];
    const path = greedyRoute(a, b, 70);
    if (path.length < 2) return null;
    const kind = Math.random() < 0.12 ? "bus" : Math.random() < 0.28 ? "truck" : "car";
    return {
      path, at: 0, t: Math.random(), speed: rnd(0.9, 1.7) * (kind === "bus" ? 0.7 : 1),
      kind, hue: (Math.random() * 360) | 0,
    };
  }

  function dockCentres() {
    const out = [];
    claimedList().forEach((r) => {
      let sx = 0, sy = 0, n = 0;
      for (let i = 0; i < RS * RS; i++) {
        if (SVC[r.svc[i]] === "dock") { sx += i % RS; sy += (i / RS) | 0; n++; }
      }
      if (n) out.push({ r, x: r.rx * RS + sx / n, y: r.ry * RS + sy / n, n });
    });
    return out;
  }

  function railCentres() {
    const out = [];
    claimedList().forEach((r) => {
      let sx = 0, sy = 0, n = 0;
      for (let i = 0; i < RS * RS; i++) {
        if (SVC[r.svc[i]] === "rail") { sx += i % RS; sy += (i / RS) | 0; n++; }
      }
      if (n) out.push({ r, x: r.rx * RS + sx / n, y: r.ry * RS + sy / n, n });
    });
    return out;
  }

  // BFS over laid track, depot to depot. Returns the tile path trains actually follow.
  function railRoute(a, b) {
    const sx = Math.round(a.x), sy = Math.round(a.y);
    const tx = Math.round(b.x), ty = Math.round(b.y);
    if (!hasRail(sx, sy) || !hasRail(tx, ty)) return null;
    const K = (x, y) => x + "," + y;
    const prev = new Map();
    const q = [[sx, sy]];
    prev.set(K(sx, sy), null);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let guard = 0;
    while (q.length && guard++ < 6000) {
      const [x, y] = q.shift();
      if (x === tx && y === ty) break;
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy, k = K(nx, ny);
        if (prev.has(k) || !hasRail(nx, ny)) continue;
        prev.set(k, [x, y]);
        q.push([nx, ny]);
      }
    }
    if (!prev.has(K(tx, ty))) return null;
    const route = [];
    let cur = [tx, ty];
    while (cur) { route.push({ x: cur[0], y: cur[1] }); cur = prev.get(K(cur[0], cur[1])); }
    route.reverse();
    return route.length > 1 ? route.slice(0, 400) : null;
  }

  function railStats() {
    S.rail = S.rail || { riders: 0, fares: 0, trips: 0, stops: 0 };
    return S.rail;
  }

  // Catchment of a depot: built homes within 5 tiles. Simple, and it reads correctly.
  function stationDemand(d) {
    let homes = 0;
    const cx = Math.round(d.x), cy = Math.round(d.y);
    for (let dx = -5; dx <= 5; dx++) {
      for (let dy = -5; dy <= 5; dy++) {
        const t = regionOf(cx + dx, cy + dy);
        if (t && t.r.zone[t.i] === Z.R && t.r.level[t.i] > 0) homes++;
      }
    }
    return homes;
  }

  // One station stop: fares into the cash spine, riders onto the books.
  const FARE = 1.1, TRAIN_CAP = 40, DWELL = 3.5;
  function serviceStop(tr) {
    const st = railStats();
    const demand = tr.atEnd ? tr.demandB : tr.demandA;
    const riders = Math.min(TRAIN_CAP, demand || 0);
    S.cash += riders * FARE;
    st.riders += riders;
    st.fares += riders * FARE;
    st.stops += 1;
    if (tr.atEnd) st.trips += 1;
    // a working line makes the district feel connected
    S.mood = Math.min(100, S.mood + Math.min(1.5, riders * 0.03));
    return riders;
  }

  // A line inside ONE region: two depots joined by laid track. Rail used to need two
  // claimed regions with a depot each before a single train existed, so a player could
  // lay a full rail loop in their first town and watch nothing move. This is the same
  // route/dwell/fare machinery, pointed at a local pair.
  function localRailLine(r) {
    if (S.links.some((l) => l.kind === "rail" && (l.a === r || l.b === r))) return null;
    const pts = [];
    for (let i = 0; i < RS * RS; i++) {
      if (SVC[r.svc[i]] === "rail") pts.push({ x: r.rx * RS + (i % RS), y: r.ry * RS + ((i / RS) | 0) });
    }
    if (pts.length < 2) return null;
    let best = null;
    const cap = Math.min(pts.length, 8);
    for (let i = 0; i < cap; i++) {
      for (let j = i + 1; j < cap; j++) {
        const A = pts[i], B = pts[j];
        const span = Math.abs(A.x - B.x) + Math.abs(A.y - B.y);
        if (best && span > best.span * 2) continue;   // far pair: not worth the BFS
        const route = railRoute(A, B);
        if (!route) continue;
        if (!best || route.length < best.route.length) best = { A, B, span, route };
      }
    }
    if (!best) return null;
    return { a: best.A, b: best.B, route: best.route, regionName: r.name || "the town", local: true };
  }

  // Cache: the BFS above must not run every frame. refreshLinks() bumps S.railVer on
  // every lay, bulldoze and claim, which is exactly when the lines can change.
  let railLineCache = { ver: -1, lines: [] };
  let railVerSeen = -1;
  function localRailLines() {
    const ver = S.railVer || 0;
    if (railLineCache.ver === ver) return railLineCache.lines;
    const lines = [];
    claimedList().forEach((r) => {
      const l = localRailLine(r);
      if (l) lines.push(l);
    });
    railLineCache = { ver, lines };
    return lines;
  }

  function spawnTrain(line) {
    if (line) {
      // local shuttle: lighter and quicker than the inter-region freight
      return { ax: line.a.x, ay: line.a.y, bx: line.b.x, by: line.b.y, t: 0, dir: 1, speed: rnd(0.16, 0.24),
               from: line.regionName, to: line.regionName,
               route: line.route, idx: 0, seg: 0, dwell: 0, atEnd: false,
               demandA: stationDemand(line.a), demandB: stationDemand(line.b), riders: 0, local: true };
    }
    const depots = railCentres();
    const track = S.links.filter((l) => l.kind === "rail");
    if (!track.length || depots.length < 2) return null;
    const link = track[(Math.random() * track.length) | 0];
    const a = depots.find((d) => d.r === link.a), b = depots.find((d) => d.r === link.b);
    if (!a || !b) return null;
    return { ax: a.x, ay: a.y, bx: b.x, by: b.y, t: 0, dir: 1, speed: rnd(0.06, 0.11),
             from: (link.a.name || "depot"), to: (link.b.name || "depot"),
             route: railRoute(a, b), idx: 0, seg: 0, dwell: 0, atEnd: false,
             demandA: stationDemand(a), demandB: stationDemand(b), riders: 0 };
  }

  function spawnFerry() {
    const docks = dockCentres();
    if (docks.length < 2) return null;
    const pair = S.links.filter((l) => l.kind === "ferry");
    if (!pair.length) return null;
    const link = pair[(Math.random() * pair.length) | 0];
    const a = docks.find((d) => d.r === link.a), b = docks.find((d) => d.r === link.b);
    if (!a || !b) return null;
    return { ax: a.x, ay: a.y, bx: b.x, by: b.y, t: Math.random(), dir: 1, speed: rnd(0.05, 0.09) };
  }

  // BFS over water tiles: boats and ferries follow the river instead of drifting through land
  function waterRoute(ax, ay, bx, by) {
    const start = regionOf(ax, ay), goal = regionOf(bx, by);
    if (!start || !goal) return null;
    if (start.r.terrain[start.i] !== TERRAIN.WATER || goal.r.terrain[goal.i] !== TERRAIN.WATER) return null;
    const w = (gx, gy) => { const t = regionOf(gx, gy); return t && t.r.terrain[t.i] === TERRAIN.WATER; };
    const key = (gx, gy) => gx + "," + gy;
    const prev = new Map(), seen = new Set([key(ax, ay)]);
    const q = [[ax, ay]];
    let guard = 0;
    while (q.length && guard++ < 6000) {
      const [gx, gy] = q.shift();
      if (gx === bx && gy === by) {
        const path = [];
        let cx = bx, cy = by, k = key(cx, cy);
        while (k) { path.push({ x: cx, y: cy }); const p = prev.get(k); if (!p) break; cx = p[0]; cy = p[1]; k = key(cx, cy); }
        return path.reverse();
      }
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = gx + dx, ny = gy + dy, nk = key(nx, ny);
        if (seen.has(nk) || !w(nx, ny)) continue;
        seen.add(nk); prev.set(nk, [gx, gy]); q.push([nx, ny]);
      }
    }
    return null;
  }

  function nearestWaterTile(gx, gy, maxR) {
    for (let rad = 1; rad <= (maxR || 4); rad++) {
      for (let dx = -rad; dx <= rad; dx++) {
        for (let dy = -rad; dy <= rad; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
          const t = regionOf(gx + dx, gy + dy);
          if (t && t.r.terrain[t.i] === TERRAIN.WATER) return { x: gx + dx, y: gy + dy };
        }
      }
    }
    return null;
  }

  function spawnBoat() {
    const water = S.waterSpots || [];
    if (water.length < 4) return null;
    // boats leave from a dock when there is one, otherwise from open water
    const docks = dockCentres();
    let start = null;
    if (docks.length) {
      const d = docks[(Math.random() * docks.length) | 0];
      start = nearestWaterTile(Math.round(d.x), Math.round(d.y), 5);
    }
    if (!start) { const a = water[(Math.random() * water.length) | 0]; start = { x: a.x, y: a.y }; }
    let target = null, route = null;
    for (let tries = 0; tries < 12 && !target; tries++) {
      const cand = water[(Math.random() * water.length) | 0];
      const dist = Math.abs(cand.x - start.x) + Math.abs(cand.y - start.y);
      if (dist < 6 || dist > 40) continue;
      const r = waterRoute(start.x, start.y, cand.x, cand.y);
      if (r && r.length > 3) { target = cand; route = r; }
    }
    const kind = Math.random() < 0.5 ? "skiff" : "barge";
    return {
      x: start.x, y: start.y, kind,
      route: route || null, idx: 0, acc: 0,
      speed: kind === "barge" ? rnd(0.55, 0.8) : rnd(1.0, 1.5),   // tiles per second
      t: Math.random(), dir: (Math.random() * 4) | 0,
    };
  }

  function refreshSpots() {
    S.homes = builtTiles([Z.R]);
    S.workplaces = builtTiles([Z.C, Z.I]);
    const roads = [], water = [];
    claimedList().forEach((r) => {
      for (let i = 0; i < RS * RS; i++) {
        if (r.road[i]) roads.push({ x: r.rx * RS + (i % RS), y: r.ry * RS + ((i / RS) | 0) });
        if (r.terrain[i] === TERRAIN.WATER) water.push({ x: r.rx * RS + (i % RS), y: r.ry * RS + ((i / RS) | 0) });
      }
    });
    S.roadSpots = roads;
    S.waterSpots = water.slice(0, 4000);
  }

  function seedClouds() {
    S.clouds = [];
    for (let i = 0; i < 7; i++) {
      S.clouds.push({ gx: rnd(0, WORLD_W), gy: rnd(0, WORLD_H), r: rnd(6, 16), vx: rnd(0.12, 0.34), vy: rnd(-0.05, 0.05) });
    }
  }

  function stepClouds(dt) {
    (S.clouds || []).forEach((c) => {
      c.gx += c.vx * dt;
      c.gy += c.vy * dt;
      if (c.gx > WORLD_W + 20) c.gx = -20;
      if (c.gx < -20) c.gx = WORLD_W + 20;
      if (c.gy > WORLD_H + 20) c.gy = -20;
      if (c.gy < -20) c.gy = WORLD_H + 20;
    });
  }

  function updatePeds() {
    if (!S.homes || S.day % 3 === 0) refreshSpots();
    // the streets empty at night: commuters are at home, not on the road
    const daylight = (S.hour >= 6.5 && S.hour <= 19.5) ? 1 : 0.32;
    const rainFactor = 1 - S.rain * 0.45;
    const eventCrowd = (S.event && S.event.type === "market") ? 1.35 : 1;
    const wantPeds = clamp(Math.round(S.pop / 3 * daylight * rainFactor * eventCrowd), 0, 170);
    const wantCars = clamp(Math.round(S.pop / 14 * (0.6 + daylight * 0.4) * rainFactor), 0, 44);
    const wantBoats = clamp(Math.round((S.waterSpots || []).length / 900), 0, 10);

    let guard = 0;
    while (S.peds.length < wantPeds && guard++ < 30) {
      const c = spawnCitizen();
      if (!c) break;
      S.peds.push(c);
    }
    let carGuard = 0;
    while (S.cars.length < wantCars && carGuard++ < 120) {
      const v = spawnVehicle();
      if (v) S.cars.push(v);
    }
    S.boats = S.boats || [];
    while (S.boats.length < wantBoats && guard++ < 90) {
      const b = spawnBoat();
      if (!b) break;
      S.boats.push(b);
    }
    S.trains = S.trains || [];
    const railLinks = S.links.filter((l) => l.kind === "rail");
    const localLines = localRailLines();
    if (railVerSeen !== (S.railVer || 0)) {
      railVerSeen = S.railVer || 0;
      // a bulldozed tile leaves no train floating over grass
      S.trains = S.trains.filter((tr) => !tr.route || tr.route.every((p) => hasRail(p.x, p.y)));
    }
    const wantTrains = railLinks.length + localLines.length;
    let trainGuard = 0;
    while (S.trains.length < wantTrains && trainGuard++ < 12) {
      const n = S.trains.length;
      const t = spawnTrain(n < railLinks.length ? null : localLines[n - railLinks.length]);
      if (!t) break;
      S.trains.push(t);
    }
    if (S.trains.length > wantTrains) S.trains.length = wantTrains;

    S.ferries = S.ferries || [];
    const wantFerries = S.links.filter((l) => l.kind === "ferry").length;
    let ferryGuard = 0;
    while (S.ferries.length < wantFerries && ferryGuard++ < 12) {
      const f = spawnFerry();
      if (!f) break;
      S.ferries.push(f);
    }
    if (S.ferries.length > wantFerries) S.ferries.length = wantFerries;
    if (S.peds.length > wantPeds) S.peds.length = wantPeds;
    if (S.cars.length > wantCars) S.cars.length = wantCars;
    if (S.boats.length > wantBoats) S.boats.length = wantBoats;

    // industry breathes
    S.smoke = S.smoke || [];
    if (S.smoke.length < 70) {
      const stacks = S.workplaces ? S.workplaces.filter((t) => {
        const reg = regionOf(t.x, t.y);
        return reg && reg.r.level[reg.i] >= 2 && reg.r.zone[reg.i] === Z.I;
      }) : [];
      if (stacks.length) {
        const t = stacks[(Math.random() * stacks.length) | 0];
        S.smoke.push({ x: t.x + rnd(-0.2, 0.2), y: t.y + rnd(-0.2, 0.2), life: 1, rise: rnd(0.15, 0.35), drift: rnd(-0.12, 0.12) });
      }
    }
  }

  function advance(list, dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.t += dt * p.speed;
      if (p.t < 1) continue;
      p.t = 0;
      p.at++;
      const next = p.path[p.at];
      // roads can be bulldozed under a walker's feet; retire it instead of
      // letting it stroll across the meadow
      if (!next || !hasRoad(next.x, next.y)) { list.splice(i, 1); continue; }
      // the last step of the route is the shop or the works: a trade happens
      if (p.dest && p.at === p.path.length - 1) {
        const t = regionOf(p.dest.x, p.dest.y);
        if (t && (t.r.zone[t.i] === Z.C || t.r.zone[t.i] === Z.I)) {
          t.r.trades = (t.r.trades || 0) + 1;
          S.tradesToday = (S.tradesToday || 0) + 1;
        }
      }
    }
  }

  // ---------------------------------------------------------------- rotation
  // The world is square, so a quarter turn is a coordinate swap. Rendering
  // walks view space; every lookup converts back to world space.
  let ROT = 0;
  function toView(gx, gy) {
    if (ROT === 1) return { gx: gy, gy: WORLD_W - 1 - gx };
    if (ROT === 2) return { gx: WORLD_W - 1 - gx, gy: WORLD_H - 1 - gy };
    if (ROT === 3) return { gx: WORLD_H - 1 - gy, gy: gx };
    return { gx, gy };
  }
  function fromView(vx, vy) {
    if (ROT === 1) return { gx: WORLD_W - 1 - vy, gy: vx };
    if (ROT === 2) return { gx: WORLD_W - 1 - vx, gy: WORLD_H - 1 - vy };
    if (ROT === 3) return { gx: vy, gy: WORLD_H - 1 - vx };
    return { gx: vx, gy: vy };
  }
  function rotateCamera(dir) {
    const w = screenToTile(getCanvas().clientWidth / 2, getCanvas().clientHeight / 2);   // already world space
    ROT = (ROT + dir + 4) % 4;
    focusOn(w.gx, w.gy, cam.zoom);
  }

  // ---------------------------------------------------------------- camera
  function tileToScreen(gx, gy) {
    const v = toView(gx, gy);
    return { x: ((v.gx - v.gy) * HALF_W) * cam.zoom + cam.x, y: ((v.gx + v.gy) * HALF_H) * cam.zoom + cam.y };
  }
  function screenToView(sx, sy) {
    const x = (sx - cam.x) / cam.zoom - HALF_W;
    const y = (sy - cam.y) / cam.zoom - HALF_H;
    return { gx: Math.round((x / HALF_W + y / HALF_H) / 2), gy: Math.round((y / HALF_H - x / HALF_W) / 2) };
  }
  function screenToTile(sx, sy) {
    const v = screenToView(sx, sy);
    return fromView(v.gx, v.gy);
  }
  let needFocus = false;
  let pendingFocus = null;
  function focusOn(gx, gy, zoom) {
    const c = getCanvas();
    const w = c ? c.clientWidth : 0;
    const h = c ? c.clientHeight : 0;
    if (w < 8 || h < 8) {
      needFocus = true;
      pendingFocus = { gx: gx, gy: gy, zoom: zoom || cam.zoom || 0.95 };
      return;
    }
    needFocus = false;
    pendingFocus = null;
    cam.zoom = zoom || 0.95;
    const p = tileToScreen(gx, gy);
    cam.x += w / 2 - (p.x + TW * cam.zoom / 2);
    cam.y += h / 2 - (p.y + TH * cam.zoom / 2 - 40);
  }
  function focusRegion(r) { focusOn(r.rx * RS + RS / 2, r.ry * RS + RS / 2); }

  // ---------------------------------------------------------------- render
  let canvas = null, ctx = null;
  let dpr = 1, last = 0, acc = 0, hover = { gx: -1, gy: -1 }, lastMini = 0;
  function getCanvas() {
    if (!canvas) {
      canvas = document.getElementById("map");
      ctx = canvas ? canvas.getContext("2d") : null;
    }
    return canvas;
  }
  function getCtx() { getCanvas(); return ctx; }

  const GROUND_COLORS = {
    5: ["#5a5348", "#514a40"],
    0: ["#3f6b34", "#426f37"],
    1: ["#2f5530", "#33592f"],
    2: ["#c9b26a", "#cdb672"],
    3: ["#2f5f86", "#335f86"],
    4: ["#6b6a63", "#6f6e66"],
  };

  function resize() {
    const c = getCanvas();
    if (!c || !ctx) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.floor(c.clientWidth * dpr);
    c.height = Math.floor(c.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (needFocus && c.clientWidth >= 8 && c.clientHeight >= 8) {
      const p = pendingFocus;
      needFocus = false;
      pendingFocus = null;
      if (p) focusOn(p.gx, p.gy, p.zoom);
      else focusCity();
    }
  }

  // ---------------------------------------------------------------- ground textures
  // One 128x64 diamond per variant, drawn once at boot. Grass gets blades, sand
  // gets grains, rock gets facets, water gets ripples: the ground stops being a
  // flat fill without costing a sprite per tile.
  const TEX = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  function texRand(seed) {
    let x = seed >>> 0;
    return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
  }
  function buildTextures() {
    const base = { 0: ["#3f6b34", "#426f37", "#3a6330"], 1: ["#2c4f2a", "#31562c", "#264524"],
                   2: ["#c9b26a", "#cdb672", "#c3ab62"], 3: ["#2f5f86", "#2b567c", "#33638b"],
                   4: ["#6b6a63", "#6f6e66", "#656459"] };
    for (let terr = 0; terr <= 4; terr++) {
      TEX[terr] = [];
      for (let v = 0; v < 3; v++) {
        const c = document.createElement("canvas");
        c.width = TW; c.height = TH;
        const g = c.getContext("2d");
        const rnd = texRand(terr * 977 + v * 131 + 7);
        g.beginPath();
        g.moveTo(TW / 2, 0); g.lineTo(TW, TH / 2); g.lineTo(TW / 2, TH); g.lineTo(0, TH / 2);
        g.closePath();
        g.fillStyle = base[terr][v];
        g.fill();
        g.save();
        g.clip();
        if (terr === 0 || terr === 1) {
          const dark = terr === 0 ? "rgba(26,60,24,.85)" : "rgba(14,38,16,.9)";
          const light = terr === 0 ? "rgba(136,186,102,.55)" : "rgba(104,150,86,.45)";
          for (let i = 0; i < 150; i++) {
            const x = rnd() * TW, y = rnd() * TH;
            g.strokeStyle = rnd() > 0.55 ? light : dark;
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(x, y);
            g.lineTo(x + (rnd() - 0.5) * 2, y - 2 - rnd() * 3);
            g.stroke();
          }
          for (let i = 0; i < 12; i++) {
            g.fillStyle = terr === 0 ? "rgba(160,200,120,.28)" : "rgba(40,74,42,.4)";
            g.fillRect(rnd() * TW, rnd() * TH, 2 + rnd() * 5, 1.5 + rnd() * 2);
          }
        } else if (terr === 2) {
          for (let i = 0; i < 140; i++) {
            g.fillStyle = rnd() > 0.5 ? "rgba(150,125,70,.35)" : "rgba(240,225,180,.35)";
            g.fillRect(rnd() * TW, rnd() * TH, 1, 1);
          }
          for (let i = 0; i < 5; i++) {
            g.strokeStyle = "rgba(120,100,60,.18)";
            g.beginPath();
            const y = rnd() * TH;
            g.moveTo(rnd() * TW * 0.6, y);
            g.lineTo(rnd() * TW * 0.4 + TW * 0.6, y + 4);
            g.stroke();
          }
        } else if (terr === 4) {
          for (let i = 0; i < 22; i++) {
            const x = rnd() * TW, y = rnd() * TH, w = 6 + rnd() * 14, h = 3 + rnd() * 6;
            g.fillStyle = rnd() > 0.5 ? "rgba(150,148,138,.35)" : "rgba(52,50,46,.35)";
            g.beginPath();
            g.moveTo(x, y); g.lineTo(x + w, y + h * 0.4); g.lineTo(x + w * 0.7, y + h); g.closePath();
            g.fill();
          }
        } else if (terr === 3) {
          for (let i = 0; i < 26; i++) {
            g.strokeStyle = rnd() > 0.5 ? "rgba(150,205,240,.20)" : "rgba(20,55,85,.28)";
            g.lineWidth = 1 + rnd();
            const y = rnd() * TH, x = rnd() * TW;
            g.beginPath();
            g.moveTo(x, y);
            g.lineTo(x + 10 + rnd() * 26, y + (rnd() - 0.5) * 2);
            g.stroke();
          }
        }
        g.restore();
        TEX[terr].push(c);
      }
    }
  }

  function drawDiamond(cx, cy, w, h, fill) {
    getCtx().beginPath();
    getCtx().moveTo(cx, cy - h / 2);
    getCtx().lineTo(cx + w / 2, cy);
    getCtx().lineTo(cx, cy + h / 2);
    getCtx().lineTo(cx - w / 2, cy);
    ctx.closePath();
    getCtx().fillStyle = fill;
    getCtx().fill();
  }

  function visibleRange() {
    const w = getCanvas().clientWidth, h = getCanvas().clientHeight;
    const cs = [screenToView(0, 0), screenToView(w, 0), screenToView(0, h), screenToView(w, h)];
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
      animateSprites(ts);
      // Boot can focus before the canvas has a size. Retry until layout gives it one.
      if (needFocus) resize();
      const dt = Math.min(0.1, (ts - last) / 1000 || 0.016);
      last = ts;
      S.hour = localHour();
      pumpTicks();
      tickEconomy();
      const sim = 1;
      advance(S.peds, dt * sim);
      advance(S.cars, dt * sim * 1.8 * (1 - S.rain * 0.35));
      updateFires(dt);
      updateAllVehicles(dt);
      // emergency units: move along their route, patrol when idle, return to park
      updateEmergencyVehicles(dt);
      // Emergency spawns now happen in tick() once per day, not every frame
      updateMedicalCalls(dt);
      updatePoliceCalls(dt);
      if (S.boats) {
      S.boats.forEach((b) => {
        if (b.route && b.route.length > 1) {
          b.acc = (b.acc || 0) + dt * sim * b.speed;
          while (b.acc >= 1 && b.idx < b.route.length - 1) { b.acc -= 1; b.idx++; }
          const p = b.route[Math.min(b.idx, b.route.length - 1)];
          if (p) { b.x = p.x; b.y = p.y; }
          if (b.idx >= b.route.length - 1) {
            // arrived: pick another reachable stretch of water, or drift in place
            const water = S.waterSpots || [];
            let next = null;
            for (let tries = 0; tries < 10 && !next; tries++) {
              const cand = water[(Math.random() * water.length) | 0];
              if (!cand) break;
              const dist = Math.abs(cand.x - b.x) + Math.abs(cand.y - b.y);
              if (dist < 6 || dist > 40) continue;
              const route = waterRoute(b.x, b.y, cand.x, cand.y);
              if (route && route.length > 3) next = route;
            }
            b.route = next; b.idx = 0; b.acc = 0;
          }
        } else {
          b.t += dt * sim * 0.2;
          if (b.t >= 1) b.t = 0;
        }
      });
    }
    if (S.trains) {
      S.trains.forEach((t) => {
        // wheel clack while a train is rolling (AUD-04); silent at a platform
        if (t.route && t.route.length > 1 && t.dwell <= 0) {
          const wnow = performance.now();
          if (wnow - lastWheelSfx > 340) { lastWheelSfx = wnow; if (typeof sfx === "function") sfx("wheel"); }
        }
        if (t.route && t.route.length > 1) {
          if (t.dwell > 0) { t.dwell -= dt * sim; return; }   // stopped at a station
          t.seg += t.speed * dt * sim * 3.2;                  // tiles travelled this frame
          while (t.seg >= 1) {
            t.seg -= 1;
            const next = t.idx + t.dir;
            if (next >= t.route.length - 1) {
              t.idx = t.route.length - 1; t.dir = -1; t.seg = 0;
              t.dwell = DWELL; t.atEnd = true;
              t.riders = serviceStop(t); announce(t, t.to);
              break;
            }
            if (next <= 0) {
              t.idx = 0; t.dir = 1; t.seg = 0;
              t.dwell = DWELL; t.atEnd = false;
              t.riders = serviceStop(t); announce(t, t.from);
              break;
            }
            t.idx = next;
          }
          return;
        }
        t.t += dt * sim * t.speed * t.dir;
        if (t.t >= 1) { t.t = 1; if (t.dir > 0) announce(t, t.to); t.dir = -1; }
        if (t.t <= 0) { t.t = 0; if (t.dir < 0) announce(t, t.from); t.dir = 1; }
      });
    }
    if (S.ferries) {
      S.ferries.forEach((f) => {
        f.t += dt * sim * f.speed * f.dir;
        if (f.t > 1) { f.t = 1; f.dir = -1; }
        if (f.t < 0) { f.t = 0; f.dir = 1; }
      });
    }
    if (S.smoke) {
      for (let i = S.smoke.length - 1; i >= 0; i--) {
        const p = S.smoke[i];
        p.life -= dt * p.rise;
        p.x += p.drift * dt; p.y -= p.rise * 0.15 * dt;
        if (p.life <= 0) S.smoke.splice(i, 1);
      }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, getCanvas().clientWidth, getCanvas().clientHeight);
    getCtx().fillStyle = "#0a0908";
    getCtx().fillRect(0, 0, getCanvas().clientWidth, getCanvas().clientHeight);

    const r = visibleRange();
    const zw = TW * cam.zoom, zh = TH * cam.zoom;
    const now = performance.now();
    // real numbers for the F3 overlay (ENG-02 counters)
    if (typeof DebugOverlay !== "undefined" && DebugOverlay.isEnabled && DebugOverlay.isEnabled()) {
      const vw = r.x1 - r.x0 + 1, vh = r.y1 - r.y0 + 1;
      let bcount = 0, ecount = 0;
      claimedList().forEach((reg) => { bcount += reg.built || 0; });
      ecount = (S.peds || []).length + (S.cars || []).length + (S.trains || []).length + (S.boats || []).length;
      DebugOverlay.updateRenderStats(vw * vh, Math.ceil(vw / 16) * Math.ceil(vh / 16));
      DebugOverlay.updateEntityStats(bcount, ecount);
    }
    // A real sky: darkness ramps across dawn and dusk, and the low sun warms the
    // whole map for a short while on either side of it.
    const hourNow = S.hour;
    let dark = 0;
    if (hourNow >= 20 || hourNow < 4.5) dark = 1;
    else if (hourNow >= 16.5) dark = (hourNow - 16.5) / 3.5;
    else if (hourNow < 8.5) dark = (8.5 - hourNow) / 4;
    dark = clamp(dark, 0, 1);
    const warm = Math.min(1, Math.exp(-Math.pow((hourNow - 6.6) / 1.5, 2)) + Math.exp(-Math.pow((hourNow - 18.4) / 1.7, 2)));
    const night = dark * 0.28;

    for (let vsum = r.x0 + r.y0; vsum <= r.x1 + r.y1; vsum++) {
      const vxStart = Math.max(r.x0, vsum - r.y1), vxEnd = Math.min(r.x1, vsum - r.y0);
      for (let vx = vxStart; vx <= vxEnd; vx++) {
        const vy = vsum - vx;
        if (vy < r.y0 || vy > r.y1) continue;
        const wv = fromView(vx, vy);
        const gx = wv.gx, gy = wv.gy;
        const t = regionOf(gx, gy);
        if (!t) {
          const s0 = tileToScreen(gx, gy);
          const c0x = Math.round(s0.x + zw / 2), c0y = Math.round(s0.y + zh / 2);
          drawDiamond(c0x, c0y, zw + 2, zh + 2, ((gx + gy) & 1) ? "#1c2618" : "#182114");
          continue;
        }
        const reg = t.r, i = t.i;
        const s = tileToScreen(gx, gy);
        const cx0 = Math.round(s.x + zw / 2), cy0 = Math.round(s.y + zh / 2);
        const terr = reg.terrain[i];
        const pal = GROUND_COLORS[terr] || GROUND_COLORS[0];
        const shade = pal[((gx * 7 + gy * 13) & 1)];
        const atlas = TEX[terr] && TEX[terr].length ? TEX[terr] : (terr === TERRAIN.MOUNTAIN ? TEX[4] : null);
        const tex = atlas ? atlas[((gx * 3 + gy * 5 + ((gx * gy) & 1)) & 7) % 3] : null;
        if (tex) {
          getCtx().drawImage(tex, Math.round(s.x) - 1, Math.round(s.y) - 1, zw + 2, zh + 2);
        } else {
          drawDiamond(cx0, cy0, zw + 2, zh + 2, shade);
        }
        // shoreline: land beside water gets a wet sand edge, water beside land
        // gets a foam lip. This is what stops rivers reading as torn strips.
        const nW = terr === TERRAIN.WATER;
        if (cam.zoom > 0.3) {
          const nb = [
            [gx, gy - 1, 0], [gx + 1, gy, 1], [gx, gy + 1, 2], [gx - 1, gy, 3],
          ];
          for (let d = 0; d < 4; d++) {
            const t2 = regionOf(nb[d][0], nb[d][1]);
            if (!t2) continue;
            const other = t2.r.terrain[t2.i] === TERRAIN.WATER;
            if (other === nW) continue;
            const cxD = cx0, cyD = cy0;
            getCtx().strokeStyle = nW ? "rgba(190,225,245,.55)" : "rgba(198,180,120,.6)";
            getCtx().lineWidth = Math.max(1, 1.6 * cam.zoom);
            getCtx().beginPath();
            if (d === 0) { getCtx().moveTo(cxD - zw / 2, cyD); getCtx().lineTo(cxD, cyD - zh / 2); }
            if (d === 1) { getCtx().moveTo(cxD, cyD - zh / 2); getCtx().lineTo(cxD + zw / 2, cyD); }
            if (d === 2) { getCtx().moveTo(cxD + zw / 2, cyD); getCtx().lineTo(cxD, cyD + zh / 2); }
            if (d === 3) { getCtx().moveTo(cxD, cyD + zh / 2); getCtx().lineTo(cxD - zw / 2, cyD); }
            getCtx().stroke();
          }
        }

        if (OPT.grid) {
          getCtx().strokeStyle = "rgba(0,0,0,.13)";
          getCtx().lineWidth = 1;
          getCtx().beginPath();
          getCtx().moveTo(cx0, cy0 - zh / 2); getCtx().lineTo(cx0 + zw / 2, cy0);
          getCtx().lineTo(cx0, cy0 + zh / 2); getCtx().lineTo(cx0 - zw / 2, cy0);
          ctx.closePath(); getCtx().stroke();
        }
        if (terr === TERRAIN.WATER) {
          if (OPT.reduceMotion) { getCtx().globalAlpha = 0.12; } else {
          getCtx().globalAlpha = 0.10 + 0.06 * Math.sin(now / 900 + gx * 0.6 + gy * 0.4);
          }
          drawDiamond(cx0, cy0, zw * 0.86, zh * 0.86, "#9fd8ff");
          getCtx().globalAlpha = 1;
        }
        if (zw > 56 && terr !== TERRAIN.WATER && ((gx * 5 + gy * 3) & 7) === 0) {
          getCtx().fillStyle = terr === TERRAIN.SAND ? "rgba(150,125,70,.35)" : (terr === TERRAIN.ROCK ? "rgba(40,40,38,.35)" : "rgba(24,58,26,.32)");
          const sz = Math.max(1.5, 2.2 * cam.zoom);
          getCtx().fillRect(cx0 + ((gx & 3) - 1.5) * 6, cy0 + ((gy & 3) - 1.5) * 4, sz, sz);
          getCtx().fillRect(cx0 + ((gy & 3) - 1.5) * 6, cy0 + ((gx & 3) - 1.5) * 4, sz, sz);
        }
        if (reg.zone[i] && !reg.level[i]) {
          const zc = reg.zone[i] === Z.R ? "rgba(111,191,115,.26)" : reg.zone[i] === Z.C ? "rgba(90,169,230,.24)" : "rgba(242,193,78,.22)";
          drawDiamond(cx0, cy0, zw * 0.9, zh * 0.9, zc);
          if (!hasRoadNear(gx, gy)) {
            getCtx().fillStyle = "rgba(226,88,60,.9)";
            const s0 = Math.max(2, 3 * cam.zoom);
            getCtx().fillRect(cx0 - s0 / 2, cy0 - zh * 0.28 - s0, s0, s0);
          }
        }

        if (terr === TERRAIN.MOUNTAIN && !reg.road[i]) {
          // one peak per ridge: only the highest of the nine neighbours gets a
          // sprite, so mountains rise out of the rock instead of tiling into a
          // mesa field
          const mine = hash2(gx * 7 + 3, gy * 13 + 5);
          let isPeak = true;
          for (let dy = -1; dy <= 1 && isPeak; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const t2 = regionOf(gx + dx, gy + dy);
            if (!t2 || t2.r.terrain[t2.i] !== TERRAIN.MOUNTAIN) continue;
            if (hash2((gx + dx) * 7 + 3, (gy + dy) * 13 + 5) > mine) { isPeak = false; break; }
          }
          if (isPeak) {
            const mk = mine > 0.7 ? "gen_mtn_snow" : mine > 0.35 ? "gen_mtn_peak" : "gen_ridge";
            const img = SPRITES[mk];
            if (img && img.complete) {
              const mw = TW * 1.5 * cam.zoom;
              getCtx().drawImage(img, cx0 - mw / 2, cy0 + zh / 2 - mw, mw, mw);
            }
          }
          continue;
        }

        let key = null;
        let railOverlay = null;
        let flipX = false;
                if (reg.road[i]) {
                  if (terr === TERRAIN.WATER) key = "r12_road_bridge_stone";
                  else if (terr === TERRAIN.MOUNTAIN || terr === TERRAIN.ROCK) key = slopeRoadKey(roadMask(gx, gy));
                  else key = ROAD[roadMask(gx, gy)] || "r02_road_straight_ew";
                  // level crossing: dedicated tile where road and rail share the square
                  if (reg.rail[i]) {
                    const lm = railMask(gx, gy), rm = roadMask(gx, gy);
                    if ((lm & 5) === 5 && (rm & 10) === 10) key = "x_cross_rail_ns_road_ew";
                    else if ((lm & 10) === 10 && (rm & 5) === 5) key = "x_cross_rail_ew_road_ns";
                    else railOverlay = RAIL[lm] || "rail_straight_ew";
                  }
                }
                else if (reg.rail[i]) {
                  key = RAIL[railMask(gx, gy)] || "rail_straight_ew";
                }
                else if (reg.level[i]) key = themeVariant(reg.theme, reg.zone[i], reg.level[i], gx, gy);
        else if (reg.svc[i]) {
          key = SVC_SPRITE[SVC[reg.svc[i]]];
          // directional pieces (the ferry terminal) face the water: mirror when the
          // water side is the opposite one, so the gangway always meets the river
          if (SVC[reg.svc[i]] === "dock") {
            const isWater = (x, y) => { const t = regionOf(x, y); return !!t && t.r.terrain[t.i] === TERRAIN.WATER; };
            if (isWater(gx - 1, gy) || isWater(gx, gy - 1)) flipX = true;
          }
        }
        else if (reg.decor[i] === 1) key = "d05_pine_grove";
        else if (reg.decor[i] === 2) key = "d04_oak_tree_park";
        else if (reg.decor[i] === 0 && terr === TERRAIN.FOREST && hash2(gx + 5, gy + 19) > 0.82) key = hash2(gx, gy) > 0.5 ? "d05_pine_grove" : "d04_oak_tree_park";
        else if (reg.decor[i] === 0 && terr === TERRAIN.FOREST && hash2(gx + 31, gy + 7) > 0.7) key = "d06_cherry_garden";
        else if (reg.decor[i] === 3) key = hash2(gx + 9, gy + 4) > 0.5 ? "gen_hill" : "s23_forest_var3_pine_cedar";
        else if (terr === TERRAIN.ROCK) {
          const h = hash2(gx * 5 + 1, gy * 3 + 7);
          // s11_meadow_rock_outcrop_v2 is a fence with a gate, not rock or a tree.
          key = h > 0.86 ? "l11_volcanic_caldera_island"
              : h > 0.7 ? "s33_slope_var5_snow_moraine"
              : h > 0.5 ? "s09_plateau_level1"
              : h > 0.3 ? "s34_slope_var6_badlands_canyon"
              : (hash2(gx + 4, gy + 8) > 0.5 ? "s23_forest_var3_pine_cedar" : "s21_forest_var1_hollow_oak");
        }
        else if (reg.decor[i] === 4) key = "s10_meadow_wildflowers_v1";
        // field overlays: tint the tile by land value, crime or pollution
        if (S.overlay && (reg.value || reg.poll || reg.crime)) {
          let col = null;
          if (S.overlay === "lv" && reg.value) {
            const v = reg.value[i] / 255;
            col = v > 0.55 ? "rgba(90,200,120,.34)" : v > 0.3 ? "rgba(230,200,80,.30)" : "rgba(200,80,70,.30)";
          } else if (S.overlay === "crime" && reg.crime) {
            const c = reg.crime[i] / 100;
            if (c > 0.05) col = "rgba(200,60,60," + (0.10 + c * 0.45).toFixed(2) + ")";
          } else if (S.overlay === "poll" && reg.poll) {
            const p = reg.poll[i] / 100;
            if (p > 0.05) col = "rgba(120,80,140," + (0.10 + p * 0.45).toFixed(2) + ")";
          }
          if (col) drawDiamond(cx0, cy0, zw, zh, col);
        }
        // contact shadow: buildings, services and vehicles sit ON the ground, not in it
        if ((reg.level[i] || reg.svc[i]) && cam.zoom > 0.45) {
          // offset down and wider than the base so it reads under the 128x128 sprite
          getCtx().globalAlpha = 0.45;
          getCtx().fillStyle = "#000";
          getCtx().beginPath();
          getCtx().ellipse(cx0 + zw * 0.05, cy0 + zh * 0.26, zw * 0.50, zh * 0.19, 0, 0, 6.2832);
          getCtx().fill();
          getCtx().globalAlpha = 1;
        }
        if (key && SPRITES[key] && SPRITES[key].complete) {
          if (flipX) {
            getCtx().save();
            getCtx().translate(s.x + TW * cam.zoom, s.y - GROUND_OFFSET * cam.zoom);
            getCtx().scale(-1, 1);
            getCtx().drawImage(SPRITES[key], 0, 0, TW * cam.zoom, TW * cam.zoom);
            getCtx().restore();
          } else {
            getCtx().drawImage(SPRITES[key], s.x, s.y - GROUND_OFFSET * cam.zoom, TW * cam.zoom, TW * cam.zoom);
          }
        }
        if (railOverlay && SPRITES[railOverlay] && SPRITES[railOverlay].complete) {
          // level crossing: rails and ties drawn over the road, centred on the same tile box
          getCtx().drawImage(SPRITES[railOverlay], s.x, s.y - GROUND_OFFSET * cam.zoom, TW * cam.zoom, TW * cam.zoom);
        }
        if (reg.level[i] && !reg.powerOn[i]) {
          getCtx().globalAlpha = 0.22;
          drawDiamond(cx0, cy0, zw * 0.5, zh * 0.5, "#ffdf6b");
          getCtx().globalAlpha = 1;
        }
        // landmarks on this tile
        if (reg.landmarks) {
          const lm = reg.landmarks.find((l) => l.i === i);
          if (lm && SPRITES[lm.key] && SPRITES[lm.key].complete) {
            getCtx().drawImage(SPRITES[lm.key], s.x, s.y - GROUND_OFFSET * cam.zoom, TW * cam.zoom, TW * cam.zoom);
          }
        }
        // lit windows once the sun is down: the skyline reads from far out
        if (night > 0.18 && reg.level[i] && reg.zone[i] && cam.zoom > 0.45) {
          const lit = 0.55 + hash2(gx + 5, gy + 9) * 0.45;
          const count = reg.level[i] + (reg.zone[i] === Z.C ? 1 : 0);
          getCtx().fillStyle = "rgba(255,220,150," + (Math.min(1, night * 3.4) * lit).toFixed(2) + ")";
          const wpx = Math.max(1.5, 2.6 * cam.zoom), hpx = Math.max(1.5, 2.2 * cam.zoom);
          for (let w = 0; w < count; w++) {
            const ox = (hash2(gx + w * 7, gy + 3) - 0.5) * zw * 0.5;
            const oy = -(reg.level[i] * 0.12 + w * 0.05) * zh;
            getCtx().fillRect(cx0 + ox, cy0 + oy - zh * 0.22, wpx, hpx);
          }
        }
      }
    }

    claimedList().forEach((reg) => {
      const x0 = reg.rx * RS, y0 = reg.ry * RS;
      const pts = [tileToScreen(x0, y0), tileToScreen(x0 + RS, y0), tileToScreen(x0 + RS, y0 + RS), tileToScreen(x0, y0 + RS)];
      getCtx().beginPath();
      getCtx().moveTo(pts[0].x + zw / 2, pts[0].y + zh / 2);
      for (let i = 1; i < 4; i++) getCtx().lineTo(pts[i].x + zw / 2, pts[i].y + zh / 2);
      ctx.closePath();
      getCtx().strokeStyle = "rgba(242,193,78,.16)";
      getCtx().lineWidth = 1.5;
      getCtx().stroke();
    });

    if (night > 0.12) {
      claimedList().forEach((reg) => {
        for (let i = 0; i < RS * RS; i++) {
          if (!reg.road[i] || (i % 23) !== 0) continue;
          const gx = reg.rx * RS + (i % RS), gy = reg.ry * RS + ((i / RS) | 0);
          const p = tileToScreen(gx, gy);
          const cx = p.x + zw / 2, cy = p.y + zh / 2;
          const rr = Math.max(6, 22 * cam.zoom);
          const g = getCtx().createRadialGradient(cx, cy - 6 * cam.zoom, 1, cx, cy - 6 * cam.zoom, rr);
          g.addColorStop(0, "rgba(255,214,130," + (0.20 * night / 0.28).toFixed(3) + ")");
          g.addColorStop(1, "rgba(255,214,130,0)");
          getCtx().fillStyle = g;
          getCtx().beginPath(); getCtx().arc(cx, cy - 6 * cam.zoom, rr, 0, 6.28); getCtx().fill();
        }
      });
    }

    // ---------------- life on the streets ----------------
    const at = (obj) => {
      const a = tileToScreen(obj.path[obj.at].x, obj.path[obj.at].y);
      const b = tileToScreen(obj.path[Math.min(obj.at + 1, obj.path.length - 1)].x, obj.path[Math.min(obj.at + 1, obj.path.length - 1)].y);
      return { x: a.x + (b.x - a.x) * obj.t + zw / 2, y: a.y + (b.y - a.y) * obj.t + zh / 2,
               dx: b.x - a.x, dy: b.y - a.y };
    };
    const zoom = cam.zoom;

    S.peds.forEach((p) => {
      const s0 = at(p);
      s0.x += (s0.dx || 0) * 0.06; s0.y += (s0.dy || 0) * 0.06;
      const bob = Math.sin((p.walk += 0.25) + p.at) > 0 ? 1 : 0;
      const h = Math.max(4, 8.6 * zoom), w = Math.max(2.4, 4.2 * zoom);
      // shadow
      getCtx().fillStyle = "rgba(0,0,0,.28)";
      getCtx().beginPath(); getCtx().ellipse(s0.x, s0.y, w * 0.9, w * 0.45, 0, 0, 6.28); getCtx().fill();
      // legs
      getCtx().fillStyle = "#22303a";
      getCtx().fillRect(s0.x - w * 0.45, s0.y - h * 0.42, w * 0.35, h * 0.42);
      getCtx().fillRect(s0.x + w * 0.1, s0.y - h * 0.42 - bob * zoom, w * 0.35, h * 0.42);
      // coat
      getCtx().fillStyle = "rgba(0,0,0,.35)";
      getCtx().fillRect(s0.x - w * 0.58, s0.y - h * 0.86, w * 1.16, h * 0.5);
      getCtx().fillStyle = p.coat;
      getCtx().fillRect(s0.x - w * 0.5, s0.y - h * 0.82, w, h * 0.42);
      // head
      getCtx().fillStyle = p.skin;
      getCtx().fillRect(s0.x - w * 0.32, s0.y - h * 1.08, w * 0.64, h * 0.3);
      if (p.hat) { getCtx().fillStyle = "#3a2d24"; getCtx().fillRect(s0.x - w * 0.42, s0.y - h * 1.16, w * 0.84, h * 0.14); }
      if (p.umbrella && (night > 0.15 || S.rain > 0.35)) {
        getCtx().fillStyle = "rgba(220,80,70,.85)";
        getCtx().beginPath(); getCtx().ellipse(s0.x, s0.y - h * 1.35, w * 1.5, w * 0.7, 0, Math.PI, 0); getCtx().fill();
      }
    });

    S.cars.forEach((c) => {
      const s0 = at(c);
      // the body follows the road: the true screen heading of the tile step,
      // which is 26.57 degrees off horizontal either way in this projection
      const ang = Math.atan2(s0.dy, s0.dx);
      const rawL = (c.kind === "bus" ? 20 : c.kind === "truck" ? 15 : 11) * zoom;
      const L = Math.max(5, Math.min(rawL, 34 * zoom));
      const W = Math.max(3, (c.kind === "bus" ? 8 : 6.4) * zoom);
      getCtx().save();
      getCtx().translate(s0.x, s0.y - W * 0.35);
      ctx.rotate(ang);
      // shadow on the road, not offset by the rotation
      getCtx().fillStyle = "rgba(0,0,0,.32)";
      getCtx().fillRect(-L / 2, -W / 2 + W * 0.55, L, Math.max(1.5, W * 0.5));
      // body
      getCtx().fillStyle = c.kind === "bus" ? "#c9642f" : c.kind === "truck" ? "#4d6a52" : "hsl(" + c.hue + ",48%,54%)";
      getCtx().fillRect(-L / 2, -W / 2, L, W);
      // cabin glass toward the front of travel
      getCtx().fillStyle = "rgba(190,225,255,.85)";
      getCtx().fillRect(L * 0.06, -W / 2 + W * 0.16, L * 0.3, W * 0.5);
      if (c.kind !== "car") {
        getCtx().fillStyle = "rgba(30,24,18,.75)";
        getCtx().fillRect(-L * 0.46, -W / 2 + W * 0.1, L * 0.4, W * 0.8);
      }
      // wheels
      getCtx().fillStyle = "#1d2226";
      getCtx().fillRect(-L * 0.34, -W / 2 - W * 0.12, W * 0.34, W * 0.2);
      getCtx().fillRect(L * 0.2, -W / 2 - W * 0.12, W * 0.34, W * 0.2);
      if (night > 0.2) {
        getCtx().fillStyle = "rgba(255,236,170,.95)";
        getCtx().fillRect(L / 2 - Math.max(1, 1.6 * zoom), -W * 0.3, Math.max(1, 1.8 * zoom), W * 0.3);
        getCtx().fillStyle = "rgba(255,236,170,.10)";
        getCtx().beginPath(); getCtx().arc(L / 2, 0, L * 0.8, 0, 6.28); getCtx().fill();
      }
      getCtx().restore();
    });

        // fire trucks
        fireTrucks.forEach((truck) => {
                  if (truck.state === "idle") return;
                  const p = tileToScreen(truck.x, truck.y);
                  const cx = Math.round(p.x + zw / 2), cy = Math.round(p.y + zh / 2);
                  getCtx().save();
                  getCtx().translate(cx, cy);
                  let angle = 0;
                  if (truck.route && truck.routeIdx < truck.route.length - 1) {
                    const next = truck.route[truck.routeIdx + 1];
                    const curr = truck.route[truck.routeIdx];
                    angle = Math.atan2(next.y - curr.y, next.x - curr.x);
                  }
                  getCtx().rotate(angle);
                  const spr = SPRITES["fire_truck"];
                  if (spr && spr.complete) {
                    const sw = 64 * cam.zoom, sh = 48 * cam.zoom;
                    getCtx().drawImage(spr, -sw / 2, -sh / 2, sw, sh);
                  } else {
                    getCtx().fillStyle = "#cc2222";
                    getCtx().fillRect(-zw * 0.4, -zh * 0.3, zw * 0.8, zh * 0.6);
                    getCtx().fillStyle = "#ffffff";
                    getCtx().fillRect(-zw * 0.35, -zh * 0.25, zw * 0.7, zh * 0.15);
                    const flash = Math.floor(performance.now() / 200) % 2 === 0;
                    getCtx().fillStyle = flash ? "#ff0000" : "#0000ff";
                    getCtx().fillRect(-zw * 0.2, -zh * 0.35, zw * 0.15, zh * 0.1);
                    getCtx().fillStyle = flash ? "#0000ff" : "#ff0000";
                    getCtx().fillRect(zw * 0.05, -zh * 0.35, zw * 0.15, zh * 0.1);
                  }
                  getCtx().restore();
                  if (truck.state === "responding" && truck.eta > 0) {
                    const etaSec = Math.max(0, truck.eta - (S.hour * 3600 + S.day * 86400));
                    const etaMin = Math.ceil(etaSec / 60);
                    getCtx().fillStyle = "rgba(255,255,255,0.9)";
                    getCtx().font = "bold " + Math.max(10, 12 * cam.zoom) + "px sans-serif";
                    getCtx().textAlign = "center";
                    getCtx().fillText("ETA " + etaMin + "m", cx, cy - zh * 0.6);
                  }
                });

                // ambulances
                ambulances.forEach((amb) => {
                  if (amb.state === "idle") return;
                  const p = tileToScreen(amb.x, amb.y);
                  const cx = Math.round(p.x + zw / 2), cy = Math.round(p.y + zh / 2);
                  getCtx().save();
                  getCtx().translate(cx, cy);
                  let angle = 0;
                  if (amb.route && amb.routeIdx < amb.route.length - 1) {
                    const next = amb.route[amb.routeIdx + 1];
                    const curr = amb.route[amb.routeIdx];
                    angle = Math.atan2(next.y - curr.y, next.x - curr.x);
                  }
                  getCtx().rotate(angle);
                  const spr = SPRITES["ambulance"];
                  if (spr && spr.complete) {
                    const sw = 64 * cam.zoom, sh = 48 * cam.zoom;
                    getCtx().drawImage(spr, -sw / 2, -sh / 2, sw, sh);
                  } else {
                    getCtx().fillStyle = "#ffffff";
                    getCtx().fillRect(-zw * 0.4, -zh * 0.3, zw * 0.8, zh * 0.6);
                    getCtx().fillStyle = "#cc0000";
                    getCtx().fillRect(-zw * 0.35, -zh * 0.25, zw * 0.7, zh * 0.5);
                    getCtx().fillStyle = "#ffffff";
                    getCtx().fillRect(-zw * 0.05, -zh * 0.3, zw * 0.1, zh * 0.6);
                    getCtx().fillRect(-zw * 0.2, -zh * 0.05, zw * 0.4, zh * 0.1);
                  }
                  getCtx().restore();
                });

                // police cars
                policeCars.forEach((cop) => {
                  if (cop.state === "idle") return;
                  const p = tileToScreen(cop.x, cop.y);
                  const cx = Math.round(p.x + zw / 2), cy = Math.round(p.y + zh / 2);
                  getCtx().save();
                  getCtx().translate(cx, cy);
                  let angle = 0;
                  if (cop.route && cop.routeIdx < cop.route.length - 1) {
                    const next = cop.route[cop.routeIdx + 1];
                    const curr = cop.route[cop.routeIdx];
                    angle = Math.atan2(next.y - curr.y, next.x - curr.x);
                  }
                  getCtx().rotate(angle);
                  const spr = SPRITES["police_car"];
                  if (spr && spr.complete) {
                    const sw = 64 * cam.zoom, sh = 48 * cam.zoom;
                    getCtx().drawImage(spr, -sw / 2, -sh / 2, sw, sh);
                  } else {
                    getCtx().fillStyle = "#111133";
                    getCtx().fillRect(-zw * 0.4, -zh * 0.3, zw * 0.8, zh * 0.6);
                    const flash = Math.floor(performance.now() / 150) % 2 === 0;
                    getCtx().fillStyle = flash ? "#ff0000" : "#0000ff";
                    getCtx().fillRect(-zw * 0.35, -zh * 0.35, zw * 0.7, zh * 0.1);
                  }
                  getCtx().restore();
                                  });

                          // weather and night lights (VIS-02 / VIS-03), drawn over the tiles
    if (S.rain > 0.02) {
      const rain = Math.min(1, S.rain);
      const t = now * (0.9 + rain * 0.4);
      getCtx().strokeStyle = "rgba(180,210,235," + (0.10 + rain * 0.22).toFixed(2) + ")";
      getCtx().lineWidth = Math.max(1, 1.2 * cam.zoom);
      const drops = Math.round(70 + rain * 130);
      for (let d = 0; d < drops; d++) {
        const seedX = (d * 2654435761) % 1000003 / 1000003;
        const seedY = (d * 40503 + 12345) % 1000003 / 1000003;
        const x = ((seedX * 1.7 + t * 0.22) % 1) * getCanvas().clientWidth;
        const y = ((seedY + t * (0.55 + rain * 0.5)) % 1) * getCanvas().clientHeight;
        const len = 7 + rain * 12;
        getCtx().beginPath();
        getCtx().moveTo(x, y);
        getCtx().lineTo(x - len * 0.28, y + len);
        getCtx().stroke();
      }
      // puddle sheen on roads
      getCtx().fillStyle = "rgba(150,190,215," + (0.05 + rain * 0.08).toFixed(2) + ")";
      getCtx().fillRect(0, 0, getCanvas().clientWidth, getCanvas().clientHeight);
    }

    // rail: sleepers along the track the trains actually follow. The old
    // version drew a straight line between depot centres, which cut across every
    // curve and drew a second railway over the tiles.
    const railLines = S.links.filter((l) => l.kind === "rail");
    const depots = railLines.length ? railCentres() : [];
    const drawSleeperRun = (route) => {
      if (!route || route.length < 2) return;
      const pts = route.map((p) => { const s = tileToScreen(p.x, p.y); return { x: s.x + zw / 2, y: s.y + zh / 2 }; });
      getCtx().strokeStyle = "rgba(60,52,44,.75)";
      getCtx().lineWidth = Math.max(1.5, 2.4 * cam.zoom);
      getCtx().beginPath(); getCtx().moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) getCtx().lineTo(pts[i].x, pts[i].y);
      getCtx().stroke();
      getCtx().strokeStyle = "rgba(190,175,150,.55)";
      getCtx().lineWidth = Math.max(1, 1.2 * cam.zoom);
      const step = Math.max(6, 10 * cam.zoom);
      let travelled = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
        if (len < 0.5) continue;
        const ux = dx / len, uy = dy / len;
        for (let d = (step - (travelled % step)) % step; d < len; d += step) {
          const px = a.x + ux * d, py = a.y + uy * d;
          getCtx().beginPath();
          getCtx().moveTo(px - uy * 4 * cam.zoom, py + ux * 4 * cam.zoom);
          getCtx().lineTo(px + uy * 4 * cam.zoom, py - ux * 4 * cam.zoom);
          getCtx().stroke();
        }
        travelled += len;
      }
    };
    const sleeperDrawn = new Set();
    (S.trains || []).forEach((tr) => {
      // a routed train runs on real track tiles, which already draw rails and ties;
      // painting a second set of sleepers over them read as a smeared double line
      if (tr.route && tr.route.length > 1) sleeperDrawn.add(tr.ax + "," + tr.ay + ">" + tr.bx + "," + tr.by);
    });
    railLines.forEach((l) => {
      const a = depots.find((d) => d.r === l.a), b = depots.find((d) => d.r === l.b);
      if (!a || !b) return;
      const k = a.x + "," + a.y + ">" + b.x + "," + b.y;
      if (sleeperDrawn.has(k)) return;
      // no track tiles between these depots: the region link is drawn as a straight span
      drawSleeperRun([{ x: a.x, y: a.y }, { x: b.x, y: b.y }]);
    });

    (S.trains || []).forEach((tr) => {
      let px, py, ang;
      if (tr.route && tr.route.length > 1) {
        // follow the laid track
        const i = Math.max(0, Math.min(tr.idx, tr.route.length - 2));
        const A = tr.route[i], B = tr.route[i + 1];
        const f = tr.dir >= 0 ? Math.min(1, tr.seg) : 1 - Math.min(1, tr.seg);
        const pa = tileToScreen(A.x, A.y), pb = tileToScreen(B.x, B.y);
        px = pa.x + (pb.x - pa.x) * f + zw / 2;
        py = pa.y + (pb.y - pa.y) * f + zh / 2;
        ang = Math.atan2(pb.y - pa.y, pb.x - pa.x) + (tr.dir < 0 ? Math.PI : 0);
      } else {
        // fallback: straight line between depot centres (no route found)
        const ax = tileToScreen(tr.ax, tr.ay), bx = tileToScreen(tr.bx, tr.by);
        const x0 = ax.x + zw / 2, y0 = ax.y + zh / 2, x1 = bx.x + zw / 2, y1 = bx.y + zh / 2;
        ang = Math.atan2(y1 - y0, x1 - x0);
        px = x0 + (x1 - x0) * tr.t;
        py = y0 + (y1 - y0) * tr.t;
      }
      const L = Math.max(7, 20 * cam.zoom), W = Math.max(2.5, 5.4 * cam.zoom);
      const dirSign = tr.dir >= 0 ? 1 : -1;
      const CARS = 3;
      const step = L * 1.22;                 // a real coupling gap: three cars must read as three
      for (let car = 0; car < CARS; car++) {
        const off = ((CARS - 1) / 2 - car) * step * dirSign;   // car 0 leads
        getCtx().save();
        getCtx().translate(px + Math.cos(ang) * off, py + Math.sin(ang) * off);
        getCtx().rotate(ang);
        // ground shadow
        getCtx().fillStyle = "rgba(0,0,0,.32)";
        getCtx().fillRect(-L / 2 + L * 0.04, W * 0.55, L, Math.max(1.4, W * 0.34));
        // bogies
        getCtx().fillStyle = "#1d1915";
        getCtx().fillRect(-L * 0.38, W * 0.28, L * 0.18, Math.max(1.2, W * 0.30));
        getCtx().fillRect(L * 0.20, W * 0.28, L * 0.18, Math.max(1.2, W * 0.30));
        // body + roof highlight
        getCtx().fillStyle = car === 0 ? "#8a4030" : "#46525c";
        getCtx().fillRect(-L / 2, -W / 2, L, W);
        getCtx().fillStyle = car === 0 ? "rgba(255,190,150,.35)" : "rgba(190,215,235,.22)";
        getCtx().fillRect(-L / 2, -W / 2, L, Math.max(1, W * 0.22));
        // two window panes, so a car is countable at play zoom
        getCtx().fillStyle = "rgba(205,225,240,.75)";
        getCtx().fillRect(-L * 0.30, -W * 0.18, L * 0.20, W * 0.40);
        getCtx().fillRect(L * 0.08, -W * 0.18, L * 0.20, W * 0.40);
        if (car === 0) {
          // one chimney and a low cab roof on the loco — two dark blocks read as two funnels
          getCtx().fillStyle = "#241d18";
          getCtx().fillRect(L * 0.24, -W * 1.15, L * 0.16, W * 0.75);
          getCtx().fillStyle = "rgba(40,24,20,.85)";
          getCtx().fillRect(-L * 0.44, -W * 0.62, L * 0.26, W * 0.20);
          if (night > 0.2) {
            getCtx().fillStyle = "rgba(255,236,170,.95)";
            getCtx().fillRect(L * 0.44, -W * 0.3, Math.max(1, 1.8 * cam.zoom), Math.max(1, 1.5 * cam.zoom));
          }
        }
        getCtx().restore();
      }
    });

    // ferry routes: a dotted line between the two docks, so the water link is visible
    const ferryLines = S.links.filter((l) => l.kind === "ferry");
    const docks = ferryLines.length ? dockCentres() : [];
    ferryLines.forEach((l) => {
      if (!docks.length) return;
      const a = docks.find((d) => d.r === l.a), b = docks.find((d) => d.r === l.b);
      if (!a || !b) return;
      const pa = tileToScreen(a.x, a.y), pb = tileToScreen(b.x, b.y);
      getCtx().save();
      ctx.setLineDash([6 * cam.zoom, 6 * cam.zoom]);
      getCtx().strokeStyle = "rgba(114,224,209,.45)";
      getCtx().lineWidth = Math.max(1, 1.6 * cam.zoom);
      getCtx().beginPath();
      getCtx().moveTo(pa.x + zw / 2, pa.y + zh / 2);
      getCtx().lineTo(pb.x + zw / 2, pb.y + zh / 2);
      getCtx().stroke();
      getCtx().restore();
    });

    (S.ferries || []).forEach((f) => {
      const x = f.ax + (f.bx - f.ax) * f.t, y = f.ay + (f.by - f.ay) * f.t;
      const s0 = tileToScreen(x, y);
      const cx = s0.x + zw / 2, cy = s0.y + zh / 2;
      const L = Math.max(6, 16 * cam.zoom), W = Math.max(3, 6 * cam.zoom);
      getCtx().fillStyle = "rgba(10,25,35,.5)";
      getCtx().beginPath(); getCtx().ellipse(cx, cy + W * 0.5, L * 0.7, W * 0.6, 0, 0, 6.28); getCtx().fill();
      getCtx().fillStyle = "#e9e3d2";
      getCtx().fillRect(cx - L / 2, cy - W / 2, L, W);
      getCtx().fillStyle = "#3c5568";
      getCtx().fillRect(cx - L * 0.1, cy - W * 1.5, L * 0.42, W);
      if (night > 0.2) { getCtx().fillStyle = "rgba(255,220,140,.95)"; getCtx().fillRect(cx - L * 0.3, cy - W * 1.3, Math.max(1, 1.6 * cam.zoom), Math.max(1, 1.6 * cam.zoom)); }
    });

    (S.boats || []).forEach((b) => {
      const s0 = tileToScreen(b.x, b.y);
      const cx = s0.x + zw / 2, cy = s0.y + zh / 2;
      const L = Math.max(4, (b.kind === "barge" ? 16 : 10) * zoom), W = Math.max(2, 4 * zoom);
      let angle = 0;
      if (b.route && b.idx < b.route.length - 1) {
        const a = b.route[Math.min(b.idx, b.route.length - 1)];
        const n = b.route[Math.min(b.idx + 1, b.route.length - 1)];
        const pa = tileToScreen(a.x, a.y), pn = tileToScreen(n.x, n.y);
        angle = Math.atan2(pn.y - pa.y, pn.x - pa.x);
      }
      getCtx().save();
      getCtx().translate(cx, cy);
      // wake shadow
      getCtx().fillStyle = "rgba(10,25,35,.55)";
      getCtx().beginPath(); getCtx().ellipse(0, W * 0.4, L * 0.7, W * 0.7, 0, 0, 6.28); getCtx().fill();
      getCtx().rotate(angle);
      // hull with a pointed bow so the heading reads
      getCtx().fillStyle = b.kind === "barge" ? "#5c4030" : "#e6e0cf";
      getCtx().beginPath();
      getCtx().moveTo(L / 2, 0);
      getCtx().lineTo(L * 0.15, -W / 2);
      getCtx().lineTo(-L / 2, -W / 2);
      getCtx().lineTo(-L / 2, W / 2);
      getCtx().lineTo(L * 0.15, W / 2);
      getCtx().closePath(); getCtx().fill();
      getCtx().fillStyle = b.kind === "barge" ? "#8a6a4a" : "#f6f2e6";
      getCtx().fillRect(-L * 0.18, -W * 0.38, L * 0.34, W * 0.76);
      if (night > 0.2) {
        getCtx().fillStyle = "rgba(255,220,140,.9)";
        getCtx().fillRect(L * 0.05, -Math.max(1, 1.6 * zoom) / 2, Math.max(1, 1.6 * zoom), Math.max(1, 1.6 * zoom));
      }
      getCtx().restore();
    });

    (S.smoke || []).forEach((puff) => {
      const s0 = tileToScreen(puff.x, puff.y);
      const life = puff.life;
      const r = (1 - life) * 16 * zoom + 3 * zoom;
      getCtx().fillStyle = "rgba(120,120,120," + (0.30 * life).toFixed(3) + ")";
      getCtx().beginPath(); getCtx().arc(s0.x + zw / 2, s0.y + zh / 2 - (1 - life) * 40 * zoom, r, 0, 6.28); getCtx().fill();
    });

    if (regionOf(hover.gx, hover.gy)) {
      const s = tileToScreen(hover.gx, hover.gy);
      const t = toolById(S.tool);
      const ok = canPaint(t, hover.gx, hover.gy);
      getCtx().strokeStyle = ok ? "rgba(242,193,78,.9)" : "rgba(217,105,76,.9)";
      getCtx().lineWidth = 2;
      getCtx().beginPath();
      getCtx().moveTo(s.x + zw / 2, s.y);
      getCtx().lineTo(s.x + zw, s.y + zh / 2);
      getCtx().lineTo(s.x + zw / 2, s.y + zh);
      getCtx().lineTo(s.x, s.y + zh / 2);
      ctx.closePath();
      getCtx().stroke();
    }

    if (S.rain > 0.02 && OPT.weather) {
      const w = getCanvas().clientWidth, h = getCanvas().clientHeight;
      getCtx().fillStyle = "rgba(90,120,150," + (0.10 * S.rain).toFixed(3) + ")";
      getCtx().fillRect(0, 0, w, h);
      getCtx().strokeStyle = "rgba(200,220,240," + (0.35 * S.rain).toFixed(3) + ")";
      getCtx().lineWidth = Math.max(1, 1.1 * cam.zoom);
      getCtx().beginPath();
      const drops = Math.round(120 * S.rain);
      for (let i = 0; i < drops; i++) {
        const seed = i * 97.13;
        const x = (seed * 37 + performance.now() * 0.45) % w;
        const y = (seed * 61 + performance.now() * 1.6) % h;
        getCtx().moveTo(x, y);
        getCtx().lineTo(x - 2, y + 12);
      }
      getCtx().stroke();
    }

    if (OPT.night) {
      if (warm > 0.02 && dark < 0.85) {
        getCtx().fillStyle = "rgba(255,146,64," + (0.20 * warm * (1 - dark * 0.6)).toFixed(3) + ")";
        getCtx().fillRect(0, 0, getCanvas().clientWidth, getCanvas().clientHeight);
      }
      if (dark > 0.01) {
        getCtx().fillStyle = "rgba(10,16,42," + (dark * 0.42).toFixed(3) + ")";
        getCtx().fillRect(0, 0, getCanvas().clientWidth, getCanvas().clientHeight);
        // a colder cast deep in the night, so the two ends of it differ
        getCtx().fillStyle = "rgba(40,60,120," + (dark * 0.10).toFixed(3) + ")";
        getCtx().fillRect(0, 0, getCanvas().clientWidth, getCanvas().clientHeight);
      // lamps sit ABOVE the night tint, or the tint buries them (VIS-02)
      if (night > 0.02) {
        const zw2 = TW * cam.zoom, zh2 = TH * cam.zoom;
        getCtx().globalAlpha = Math.min(0.85, night * 3.4);
        for (let gx = r.x0; gx <= r.x1; gx++) {
          for (let gy = r.y0; gy <= r.y1; gy++) {
            const tt = regionOf(gx, gy);
            if (!tt) continue;
            const ii = tt.i;
            const isLamp = (tt.r.road[ii] && ((gx * 5 + gy * 3) & 7) === 0) || SVC[tt.r.svc[ii]] === "plaza" || SVC[tt.r.svc[ii]] === "school";
            if (!isLamp || cam.zoom < 0.5) continue;
            const ss = tileToScreen(gx, gy);
            const cx = ss.x + zw2 / 2, cy = ss.y + zh2 / 2 - 6 * cam.zoom;
            const rad = 20 * cam.zoom;
            const grd = getCtx().createRadialGradient(cx, cy, 1, cx, cy, rad);
            grd.addColorStop(0, "rgba(255,232,170,.75)");
            grd.addColorStop(0.55, "rgba(255,220,150,.28)");
            grd.addColorStop(1, "rgba(255,220,150,0)");
            getCtx().fillStyle = grd;
            getCtx().beginPath();
            getCtx().arc(cx, cy, rad, 0, 6.2832);
            getCtx().fill();
          }
        }
        getCtx().globalAlpha = 1;
      }
      }
      // cloud shadows: multiplied over everything, so they pass across roofs too
      const cloudAlpha = 0.16 * (1 - dark * 0.55);
      if (cloudAlpha > 0.02) {
        getCtx().save();
        getCtx().globalCompositeOperation = "multiply";
        (S.clouds || []).forEach((c) => {
          const p = tileToScreen(c.gx, c.gy);
          const cx = p.x + zw / 2, cy = p.y + zh / 2;
          const rad = c.r * TW * cam.zoom * 0.6;
          if (cx + rad < 0 || cx - rad > getCanvas().clientWidth || cy + rad < 0 || cy - rad > getCanvas().clientHeight) return;
          const grad = getCtx().createRadialGradient(cx, cy, rad * 0.15, cx, cy, rad);
          grad.addColorStop(0, "rgba(150,150,168," + cloudAlpha.toFixed(3) + ")");
          grad.addColorStop(1, "rgba(255,255,255,0)");
          getCtx().fillStyle = grad;
          getCtx().beginPath();
          getCtx().ellipse(cx, cy, rad, rad * 0.55, 0, 0, 6.28);
          getCtx().fill();
        });
        getCtx().restore();
      }
    }

    if (performance.now() - lastMini > 200) { lastMini = performance.now(); drawMinimap(); }
    requestAnimationFrame(render);
  }

  // ---------------------------------------------------------------- minimap
  let mini = null, mctx = null;
  const MM_PAD = 10;
  function getMini() {
    if (!mini) {
      mini = document.getElementById("minimap");
      mctx = mini ? mini.getContext("2d") : null;
    }
    return mini;
  }
  function getMCtx() { getMini(); return mctx; }
  function mmCell() { return { w: (getMini().width - MM_PAD * 2) / GW, h: (getMini().height - MM_PAD * 2) / GH }; }
  function drawMinimap() {
    if (!getMCtx()) return;
    const { w: cw, h: ch } = mmCell();
    getMCtx().clearRect(0, 0, getMini().width, getMini().height);
    getMCtx().fillStyle = "rgba(10,9,8,.92)";
    getMCtx().fillRect(0, 0, getMini().width, getMini().height);
    for (let ry = 0; ry < GH; ry++) for (let rx = 0; rx < GW; rx++) {
      const reg = regionAt(rx, ry);
      const x = MM_PAD + rx * cw, y = MM_PAD + ry * ch;
      if (reg && reg.claimed) {
        const lum = clamp(38 + Math.log10(1 + reg.pop) * 46, 38, 165);
        getMCtx().fillStyle = "rgb(" + Math.round(lum * 0.7) + "," + Math.round(lum) + "," + Math.round(lum * 0.55) + ")";
        getMCtx().fillRect(x + 2, y + 2, cw - 4, ch - 4);
        getMCtx().fillStyle = "rgba(16,14,12,.85)";
        getMCtx().font = "9px Tahoma";
        getMCtx().fillText(String(reg.pop), x + 6, y + ch - 6);
        getMCtx().fillStyle = "rgba(242,193,78,.75)";
        getMCtx().font = "8px Tahoma";
        getMCtx().fillText((reg.name || "").slice(0, 9), x + 6, y + 12);
      } else {
        getMCtx().fillStyle = "#4b4436";
        getMCtx().fillRect(x + 2, y + 2, cw - 4, ch - 4);
        getMCtx().strokeStyle = "rgba(196,176,128,.75)";
        getMCtx().setLineDash([3, 3]);
        getMCtx().strokeRect(x + 2, y + 2, cw - 4, ch - 4);
        getMCtx().setLineDash([]);
        getMCtx().fillStyle = "#f2c14e";
        getMCtx().font = "bold 15px Tahoma";
        getMCtx().fillText("+", x + cw / 2 - 5, y + ch / 2 + 5);
      }
    }
    S.links.forEach((l) => {
      const ax = MM_PAD + l.a.rx * cw, ay = MM_PAD + l.a.ry * ch;
      const bx = MM_PAD + l.b.rx * cw, by = MM_PAD + l.b.ry * ch;
      getMCtx().strokeStyle = l.kind === "ferry" ? "rgba(114,224,209,.95)" : l.kind === "rail" ? "rgba(214,196,160,.95)" : "rgba(242,193,78,.9)";
      getMCtx().lineWidth = l.kind === "rail" ? 2.5 : 2;
      if (l.kind === "ferry") getMCtx().setLineDash([3, 3]);
      getMCtx().beginPath();
      getMCtx().moveTo(ax + cw / 2, ay + ch / 2);
      getMCtx().lineTo(bx + cw / 2, by + ch / 2);
      getMCtx().stroke();
      getMCtx().setLineDash([]);
    });
    const center = screenToTile(getCanvas().clientWidth / 2, getCanvas().clientHeight / 2);
    const crx = clamp(Math.floor(center.gx / RS), 0, GW - 1);
    const cry = clamp(Math.floor(center.gy / RS), 0, GH - 1);
    getMCtx().strokeStyle = "rgba(114,224,209,.9)";
    getMCtx().lineWidth = 1.5;
    getMCtx().strokeRect(MM_PAD + crx * cw + 1, MM_PAD + cry * ch + 1, cw - 2, ch - 2);
  }
  const mm = getMini();
  if (mm) {
    mm.addEventListener("click", (e) => {
      const rect = mm.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (getMini().width / rect.width);
      const y = (e.clientY - rect.top) * (getMini().height / rect.height);
      const { w: cw, h: ch } = mmCell();
      const rx = clamp(Math.floor((x - MM_PAD) / cw), 0, GW - 1);
      const ry = clamp(Math.floor((y - MM_PAD) / ch), 0, GH - 1);
      const reg = regionAt(rx, ry);
      if (reg && reg.claimed) { focusRegion(reg); showRegion(reg); }
      else if (claimRegion(rx, ry, false)) { focusRegion(regionAt(rx, ry)); showRegion(regionAt(rx, ry)); }
    });
  }

  // ---------------------------------------------------------------- tools
  function toolById(id) { return TOOLS.find((t) => t.id === id) || TOOLS[0]; }

  function canPaint(t, gx, gy) {
      const tile = regionOf(gx, gy);
      if (!tile) return false;
      const r = tile.r, i = tile.i;
      const terr = r.terrain[i];
      if (terr === TERRAIN.MOUNTAIN && t.id !== "bulldoze") return t.id === "inspect" || t.id === "road" || t.id === "railTrack" || t.id === "inspectCitizen";
        if (t.id === "road") {
        if (terr !== TERRAIN.WATER) return true;
        // a bridge needs ground or road on two opposite sides to span
        const land = (x, y) => { const n = regionOf(x, y); return !!n && (n.r.terrain[n.i] !== TERRAIN.WATER || n.r.road[n.i] === 1); };
        return (land(gx - 1, gy) && land(gx + 1, gy)) || (land(gx, gy - 1) && land(gx, gy + 1));
      }
      if (t.zone) return terr !== TERRAIN.WATER && !r.road[i] && !r.level[i] && !r.svc[i];
      if (t.service === "dock") return terr === TERRAIN.WATER && !r.svc[i];
      if (t.service === "rail") return terr !== TERRAIN.WATER && !r.road[i] && !r.zone[i] && !r.svc[i] && !r.level[i];
      if (t.service) return terr !== TERRAIN.WATER && !r.road[i] && !r.zone[i] && !r.svc[i] && !r.level[i];
      if (t.id === "inspectCitizen") return r.zone[i] === Z.R && r.level[i] > 0;
      return true;
    }

    function paint(t, gx, gy) {
      const tile = regionOf(gx, gy);
      if (!tile) return false;
      if (t.id === "inspect") { inspect(gx, gy); return true; }
      if (t.id === "inspectCitizen") {
        const r = tile.r, i = tile.i;
        if (r.zone[i] === Z.R && r.level[i] > 0 && r.households) {
          const household = r.households.find(h => h.tile === i);
          if (household && household.residents.length > 0) {
            // Show first resident's card
            const citizen = citizens.find(c => c.id === household.residents[0]);
            if (citizen) inspectCitizen(citizen.id);
          } else {
            toast("No residents in this home");
          }
        } else {
          toast("Click a residential building to view residents");
        }
        return true;
      }
      if (!canPaint(t, gx, gy)) return false;
    const r = tile.r, i = tile.i;
    if (S.cash < t.cost) { deny("Not enough funds for " + t.name.toLowerCase()); return false; }
    let did = false;
    if (t.id === "bulldoze") {
          const hasRailTile = !!(r.rail && r.rail[i]);
          if (!(r.road[i] || hasRailTile || r.zone[i] || r.level[i] || r.svc[i])) return false;
          const hadSvc = r.svc[i] !== 0;
          r.road[i] = 0;
          if (r.rail) r.rail[i] = 0;
          r.zone[i] = 0; r.level[i] = 0; r.bldg[i] = 0; r.svc[i] = 0;
          r.zoneDirty = true;
          if (hadSvc) recomputeRegion(r);
          recalcRegion(r);
          sfx("clear");
          did = true;
    } else if (t.id === "road") {
      if (r.road[i]) return false;
      const bridge = r.terrain[i] === TERRAIN.WATER;
      const climb = r.terrain[i] === TERRAIN.MOUNTAIN;
      if (bridge && S.cash < 180) { deny("A bridge costs $180"); return false; }
      if (climb && S.cash < 90) { deny("A mountain pass costs $90"); return false; }
      r.road[i] = 1; r.zone[i] = 0; r.level[i] = 0; r.bldg[i] = 0;
      r.zoneDirty = true;
      sfx(bridge || climb ? "place" : "road");
      if (bridge) S.cash -= 168;         // the road's own $12 is charged below
      if (climb) S.cash -= 78;
      did = true;
    } else if (t.zone) {
          if (r.zone[i] === t.zone) return false;
          r.zone[i] = t.zone; r.zoneDirty = true;
          sfx("zone");
          did = true;
        } else if (t.id === "railTrack") {
          if (r.rail[i]) return false;
          if (r.terrain[i] === TERRAIN.WATER) return false;
          // rail may cross a road: the tile keeps both layers (level crossing)
          if (r.zone[i] || r.level[i] || r.svc[i]) return false;
          r.rail[i] = 1; r.zoneDirty = true;
          sfx("rail");
          did = true;
        } else if (t.service) {
      if (r.svc[i]) return false;
      if (t.service === "dock" && r.terrain[i] !== TERRAIN.WATER) return false;
      if (t.service === "rail" && r.terrain[i] === TERRAIN.WATER) return false;
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
      ["Ground", ["meadow", "forest", "sand", "water", "rock", "mountain"][r.terrain[i]]],
      ["Road", r.road[i] ? "yes" : "no"],
      ["Zone", zoneName],
      ["Building", r.level[i] ? themeVariant(r.theme, r.zone[i], r.level[i], gx, gy).replace(/^b\d+_/, "").replace(/_/g, " ") + " (L" + r.level[i] + ")" : "none"],
      ["Theme", r.name || "—"],
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
  function showRegion(r) {
    if (!r) return;
    let roads = 0, built = 0, homes = 0, works = 0, shops = 0;
    for (let i = 0; i < RS * RS; i++) {
      if (r.road[i]) roads++;
      if (r.level[i]) {
        built++;
        if (r.zone[i] === Z.R) homes++;
        else if (r.zone[i] === Z.I) works++;
        else if (r.zone[i] === Z.C) shops++;
      }
    }
    const links = S.links.filter((l) => l.a === r || l.b === r);
    const rows = [
      ["Theme", r.name || "—"],
      ["Position", r.rx + ", " + r.ry],
      ["People", String(r.pop)],
      ["Jobs", String(r.jobs)],
      ["Mood", Math.round(r.mood) + "%"],
      ["Buildings", built + " (" + homes + " home, " + shops + " shop, " + works + " works)"],
      ["Roads", String(roads)],
      ["Links", links.length ? links.map((l) => (l.kind === "rail" ? "rail to " : l.kind === "ferry" ? "ferry to " : "road to ") + ((l.a === r ? l.b : l.a).name || "neighbour")).join(", ") : "none"],
      ["Commerce", String(Math.round(r.commerce || 0)) + (r.commerce > 8 ? " · busy" : r.commerce > 2 ? " · steady" : " · quiet")],
      ["Upkeep", money(r.upkeep || 0) + " / day"],
    ];
    el("ins-title").textContent = (r.name || "Region") + " " + r.rx + "," + r.ry;
    el("ins-body").innerHTML = rows.map(([k, v]) => '<div class="kv"><span>' + k + "</span><b>" + v + "</b></div>").join("")
      + '<div class="row"><button id="ins-jump" class="wide">Jump here</button></div>';
    el("inspector").classList.remove("hidden");
    const jump = el("ins-jump");
    if (jump) jump.onclick = () => focusRegion(r);
  }

  function snapshot() {
    try {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "lattice-city-" + (S.day + 1) + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast("Snapshot saved · " + (GW * RS) + "×" + (GH * RS) + " world");
    } catch (e) { toast("The snapshot could not be made in this browser"); }
  }

  function refreshHud() {
    el("ui-cash").textContent = money(S.cash);
    el("ui-pop").textContent = S.pop.toLocaleString();
    el("ui-jobs").textContent = S.jobs.toLocaleString();
    el("ui-mood").textContent = Math.round(S.mood) + "%";
    const now = new Date();
    const hh = now.getHours(), mm = now.getMinutes();
    const clock = document.getElementById("ui-clock");
    if (clock) clock.textContent = (OPT.clock24 ? String(hh).padStart(2, "0") : String(((hh + 11) % 12) + 1)) + ":" + String(mm).padStart(2, "0");
    const phase = (hh >= 5 && hh < 8) ? "dawn" : (hh >= 8 && hh < 17) ? "day" : (hh >= 17 && hh < 20) ? "dusk" : "night";
    const ph = document.getElementById("ui-phase");
    if (ph) ph.textContent = "live · " + phase;
    el("ui-date").textContent = now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) + " · beat " + (S.day + 1);
    el("ui-region").textContent = "Region " + claimedList().length + "/" + (GW * GH);
    const ev = S.event;
    const evEl = el("ui-event");
    if (evEl) {
      if (ev) {
        evEl.textContent = EVENTS[ev.type].label + " · " + ((ev.region && ev.region.name) || "district");
        evEl.style.display = "inline-block";
        evEl.style.color = EVENTS[ev.type].colour;
      } else { evEl.style.display = "none"; }
    }
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
    // capacity vs demand, not just coverage (SIM-07 / SIM-08)
    let capP = 0, demP = 0, capW = 0, demW = 0;
    claimedList().forEach((r) => {
      capP += r.powerCap || 0; demP += r.powerDemand || 0;
      capW += r.waterCap || 0; demW += r.waterDemand || 0;
    });
    el("ui-power").style.width = Math.round(Math.min(100, capP ? (demP / capP) * 100 : pf * 100)) + "%";
    el("ui-power-t").textContent = capP ? demP + "/" + capP + " MW" : Math.round(pf * 100) + "%";
    el("ui-water").style.width = Math.round(Math.min(100, capW ? (demW / capW) * 100 : wf * 100)) + "%";
    el("ui-water-t").textContent = capW ? demW + "/" + capW : Math.round(wf * 100) + "%";
    el("ui-value").style.width = Math.round(((vn ? vsum / vn : 0) / 255) * 100) + "%";
    el("ui-value-t").textContent = money((vn ? vsum / vn : 0) * 12);
    // pollution / crime / budget (added 2026-10-30 with the field simulation)
    let psum = 0, pn = 0, csum = 0, cn = 0;
    claimedList().forEach((r) => {
      for (let i = 0; i < RS * RS; i++) {
        if (!r.zone[i]) continue;
        if (r.poll) { psum += r.poll[i]; pn++; }
        if (r.crime) { csum += r.crime[i]; cn++; }
      }
    });
    const pollAvg = pn ? psum / pn : 0, crimeAvg = cn ? csum / cn : 0;
    const elPoll = el("ui-poll");
    if (elPoll) {
      elPoll.style.width = Math.round(pollAvg) + "%";
      el("ui-poll-t").textContent = Math.round(pollAvg);
      el("ui-crime").style.width = Math.round(crimeAvg) + "%";
      el("ui-crime-t").textContent = Math.round(crimeAvg);
      el("ui-tax").textContent = (S.taxRate || 7) + "%";
      el("ui-income").textContent = money(S.taxIncome || 0);
      el("ui-upkeep").textContent = money(S.upkeep || 0);
      const net = (S.taxIncome || 0) - (S.upkeep || 0) - (S.bonds || 0) * (S.bondRate || 0.06) * 1000;
      el("ui-net").textContent = (net >= 0 ? "+" : "−") + money(Math.abs(net));
      el("ui-net").style.color = net >= 0 ? "var(--good, #7ec97e)" : "var(--bad, #d2695a)";
    }
    const next = MILESTONES[S.unlocked + 1];
    el("ui-goal").textContent = next ? (next.goal || ("Reach " + next.pop + " people for " + next.title + ".")) : "Metropolis. Nothing left to unlock but more world.";
    const claim = el("ui-claim");
    claim.textContent = "Claim a region · " + money(CLAIM_COST);
    claim.disabled = S.cash < CLAIM_COST;
    el("ui-region").title = claimedList().map((r) => (r.name || "region") + " " + r.rx + "," + r.ry + " · " + r.pop + " people").join(" | ");
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
  function log(text) {
    el("ticker-text").innerHTML = text;
  }

  // ---------------------------------------------------------------- sound
  const AUDIO_STORAGE_KEY = 'lattice-city-audio';
  let audioCtx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let audioUnlocked = false;
  let audioOn = true;
  let ambient = null;

  let audioState = {
    master: 0.8,
    music: 0.55,
    sfx: 0.8,
    muted: { master: false, music: false, sfx: false }
  };

  function loadAudioState() {
    try {
      const saved = localStorage.getItem(AUDIO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        audioState = { ...audioState, ...parsed };
        if (!audioState.muted) audioState.muted = { master: false, music: false, sfx: false };
      }
    } catch (e) {
      console.warn('[audio] Failed to load audio state:', e);
    }
    if (typeof OPT !== 'undefined') {
      if (typeof OPT.master === 'number') audioState.master = OPT.master / 100;
      if (typeof OPT.music === 'number') audioState.music = OPT.music / 100;
      if (typeof OPT.sfx === 'number') audioState.sfx = OPT.sfx / 100;
    }
    audioOn = !audioState.muted.master;
  }

  function saveAudioState() {
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(audioState));
    } catch (e) {
      console.warn('[audio] Failed to save audio state:', e);
    }
  }

  function ensureAudioContext() {
    if (audioCtx) return audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    musicGain = audioCtx.createGain();
    sfxGain = audioCtx.createGain();

    musicGain.connect(masterGain);
    sfxGain.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    applyAudioGains();
    audioUnlocked = true;
    return audioCtx;
  }

  function applyAudioGains() {
    if (!masterGain) return;
    const mMuted = audioState.muted.master;
    const musMuted = audioState.muted.music;
    const sfxMuted = audioState.muted.sfx;

    masterGain.gain.value = mMuted ? 0 : Math.max(0, Math.min(1, audioState.master));
    musicGain.gain.value = musMuted ? 0 : Math.max(0, Math.min(1, audioState.music * audioState.master));
    sfxGain.gain.value = sfxMuted ? 0 : Math.max(0, Math.min(1, audioState.sfx * audioState.master));
  }

  function unlockAudio() {
    if (audioUnlocked) return;
    ensureAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(e => console.warn('[audio] Resume failed:', e));
    }
    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  }

  loadAudioState();
  document.addEventListener('pointerdown', unlockAudio, { passive: true });
  document.addEventListener('keydown', unlockAudio, { passive: true });

  const audioAPI = {
    get() {
      return {
        master: audioState.master,
        music: audioState.music,
        sfx: audioState.sfx,
        muted: { ...audioState.muted }
      };
    },
    set(levels) {
      if (!levels || typeof levels !== 'object') return;
      if (typeof levels.master === 'number') {
        audioState.master = levels.master > 1 ? levels.master / 100 : Math.max(0, Math.min(1, levels.master));
        if (typeof OPT !== 'undefined') OPT.master = Math.round(audioState.master * 100);
      }
      if (typeof levels.music === 'number') {
        audioState.music = levels.music > 1 ? levels.music / 100 : Math.max(0, Math.min(1, levels.music));
        if (typeof OPT !== 'undefined') OPT.music = Math.round(audioState.music * 100);
      }
      if (typeof levels.sfx === 'number') {
        audioState.sfx = levels.sfx > 1 ? levels.sfx / 100 : Math.max(0, Math.min(1, levels.sfx));
        if (typeof OPT !== 'undefined') OPT.sfx = Math.round(audioState.sfx * 100);
      }
      applyAudioGains();
      saveAudioState();
      if (typeof saveOpts === 'function') saveOpts();
    },
    mute(bus, muted) {
      if (!audioState.muted.hasOwnProperty(bus)) return;
      audioState.muted[bus] = !!muted;
      if (bus === 'master') audioOn = !audioState.muted.master;
      applyAudioGains();
      saveAudioState();
    }
  };

  function initAudio() {
    const ac = ensureAudioContext();
    if (ac && ac.state === 'suspended') {
      ac.resume().catch(() => {});
    }
    return ac;
  }

  // ---------------------------------------------------------------- sound bank
  let noiseBuf = null;
  function noiseBuffer(ac) {
    if (noiseBuf && noiseBuf.sampleRate === ac.sampleRate) return noiseBuf;
    const len = Math.floor(ac.sampleRate * 0.4);
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    return noiseBuf;
  }
  function tone(ac, when, f0, f1, dur, gain, type) {
    if (audioState.muted.master || audioState.muted.sfx || audioState.sfx <= 0 || audioState.master <= 0) return;
    const sfxNode = ensureAudioContext() && sfxGain ? sfxGain : ac.destination;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "triangle";
    o.frequency.setValueAtTime(f0, when);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), when + dur);
    g.gain.setValueAtTime(Math.max(0.0002, gain), when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(sfxNode);
    o.start(when); o.stop(when + dur + 0.03);
  }
  function burst(ac, when, dur, cutoff, gain) {
    if (audioState.muted.master || audioState.muted.sfx || audioState.sfx <= 0 || audioState.master <= 0) return;
    const sfxNode = ensureAudioContext() && sfxGain ? sfxGain : ac.destination;
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac);
    const filt = ac.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = cutoff;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filt); filt.connect(g); g.connect(sfxNode);
    src.start(when); src.stop(when + dur + 0.02);
  }
  function sfx(kind) {
    if (!audioOn || OPT.sfx <= 0 || OPT.master <= 0) return;
    const ac = initAudio(); if (!ac) return;
    const t0 = ac.currentTime + 0.002;
    switch (kind) {
      case "place":
        burst(ac, t0, 0.05, 1800, 0.05);
        tone(ac, t0, 523, 659, 0.07, 0.05, "triangle");
        break;
      case "road":
        burst(ac, t0, 0.11, 2400, 0.07);
        tone(ac, t0, 150, 110, 0.08, 0.04, "sine");
        break;
      case "zone":
        tone(ac, t0, 392, 523, 0.09, 0.035, "sine");
        break;
      case "clear":
        burst(ac, t0, 0.22, 700, 0.09);
        tone(ac, t0, 180, 70, 0.2, 0.05, "sawtooth");
        break;
      case "grow":
        tone(ac, t0, 523, 523, 0.06, 0.035, "triangle");
        tone(ac, t0 + 0.07, 784, 784, 0.09, 0.03, "triangle");
        break;
      case "milestone":
        [523, 659, 784, 1047].forEach((f, i) => tone(ac, t0 + i * 0.1, f, f, 0.26, 0.05, "triangle"));
        burst(ac, t0, 0.06, 3000, 0.03);
        break;
      case "announce":
        tone(ac, t0, 988, 988, 0.42, 0.035, "sine");
        tone(ac, t0 + 0.26, 740, 740, 0.55, 0.03, "sine");
        break;
      case "deny":
        tone(ac, t0, 140, 110, 0.16, 0.05, "square");
        burst(ac, t0, 0.08, 500, 0.04);
        break;
      case "rail":
        tone(ac, t0, 196, 196, 0.12, 0.04, "sawtooth");
        tone(ac, t0 + 0.05, 294, 294, 0.16, 0.03, "sawtooth");
        burst(ac, t0, 0.05, 2600, 0.03);
        break;
      case "coin":
        tone(ac, t0, 1319, 1319, 0.07, 0.035, "sine");
        tone(ac, t0 + 0.06, 1760, 1760, 0.09, 0.03, "sine");
        break;
      case "levelup":
        [392, 523, 659].forEach((f, i) => tone(ac, t0 + i * 0.06, f, f, 0.3, 0.04, "triangle"));
        break;
      case "fire":
        burst(ac, t0, 0.5, 900, 0.06);
        tone(ac, t0, 90, 60, 0.5, 0.05, "sawtooth");
        break;
      case "siren":
        tone(ac, t0, 440, 880, 0.5, 0.045, "square");
        tone(ac, t0 + 0.5, 880, 440, 0.5, 0.045, "square");
        break;
      case "trainhorn":
        tone(ac, t0, 165, 165, 0.55, 0.05, "sine");
        tone(ac, t0, 247, 247, 0.55, 0.04, "sine");
        break;
      case "carhorn":
        tone(ac, t0, 420, 420, 0.18, 0.03, "square");
        tone(ac, t0 + 0.02, 520, 520, 0.16, 0.02, "square");
        break;
      case "click":
        tone(ac, t0, 1200, 1200, 0.025, 0.02, "sine");
        break;
      case "wheel":
        burst(ac, t0, 0.05, 420, 0.02);
        tone(ac, t0, 96, 78, 0.06, 0.02, "sine");
        break;
      default:
        tone(ac, t0, 880, 880, 0.03, 0.03, "sine");
    }
  }

  // ---------------------------------------------------------------- ambience
  // Synthetic ambience: a pink-noise wash, a low traffic bed and timed
  // bird/cricket chirps. No external sample files are required, so the page
  // never requests placeholder MP3s that were never shipped.
  // All controlled by OPT.ambience and OPT.master sliders.

  let ambienceSources = {
    distant_city: null,
    traffic_pass: null,
    birds_day: null,
    crickets_night: null,
    wind: null,
  };
  let ambienceGains = {};
  let trafficTimer = null;
  let chirpTimer = null;

  function startAmbient() {
    const ac = initAudio(); if (!ac || ambient) return;

    const master = ac.createGain();
    master.gain.value = 0.5 * (OPT.ambience / 100) * (OPT.master / 100);
    master.connect(ac.destination);
    startSyntheticAmbient(ac, master);
  }

  function updateTimeLayers(ac) {
    const hour = S.hour;
    const isNight = hour < 6 || hour > 20;
    const isDawn = hour >= 4.5 && hour < 8.5;
    const isDusk = hour >= 16.5 && hour < 20;

    // Birds: day only, louder at dawn
    if (ambienceSources.birds_day) {
      const gain = ambienceGains.birds_day;
      if (isNight) {
        gain.gain.value = 0;
      } else if (isDawn) {
        gain.gain.value = 0.15 * (OPT.ambience / 100) * (OPT.master / 100);
      } else {
        gain.gain.value = 0.08 * (OPT.ambience / 100) * (OPT.master / 100);
      }
    }

    // Crickets: night only, louder at dusk
    if (ambienceSources.crickets_night) {
      const gain = ambienceGains.crickets_night;
      if (!isNight) {
        gain.gain.value = 0;
      } else if (isDusk) {
        gain.gain.value = 0.12 * (OPT.ambience / 100) * (OPT.master / 100);
      } else {
        gain.gain.value = 0.06 * (OPT.ambience / 100) * (OPT.master / 100);
      }
    }
  }

  function scheduleTrafficPass(ac) {
    if (!ambienceSources.traffic_pass) {
      trafficTimer = setTimeout(() => scheduleTrafficPass(ac), 5000);
      return;
    }
    const src = ac.createBufferSource();
    src.buffer = ambienceSources.traffic_pass.buffer;
    const gain = ac.createGain();
    gain.gain.value = 0.05 * (OPT.ambience / 100) * (OPT.master / 100);
    // Bandpass filter for traffic sound
    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 380;
    filter.Q.value = 0.9;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ambienceGains.traffic_pass); // which connects to master
    src.start();

    // Schedule next pass: 8-22 seconds
    const gap = 8000 + Math.random() * 14000;
    trafficTimer = setTimeout(() => scheduleTrafficPass(ac), gap);
  }

  function scheduleChirps(ac) {
    if (!audioOn) {
      chirpTimer = setTimeout(() => scheduleChirps(ac), 1800);
      return;
    }
    const hour = S.hour;
    const isNight = hour < 6 || hour > 20;

    if (isNight && ambienceSources.crickets_night) {
      playChirp(ac, ambienceSources.crickets_night, ambienceGains.crickets_night, 2600, 3400, 0.012);
    } else if (!isNight && ambienceSources.birds_day) {
      playChirp(ac, ambienceSources.birds_day, ambienceGains.birds_day, 1500, 2400, 0.03);
    }

    const gap = isNight ? 900 + Math.random() * 1100 : 500 + Math.random() * 1000;
    chirpTimer = setTimeout(() => scheduleChirps(ac), gap);
  }

  function playChirp(ac, srcBuf, gainNode, f0, f1, maxGain) {
    const src = ac.createBufferSource();
    src.buffer = srcBuf.buffer;
    const gain = ac.createGain();
    gain.gain.value = maxGain * (OPT.ambience / 100) * (OPT.master / 100);
    src.connect(gain);
    gain.connect(gainNode);
    src.start();
    src.stop(ac.currentTime + 0.12);
  }

  // Fallback synthetic ambience (original implementation)
  function startSyntheticAmbient(ac, master) {
    // Pink noise buffer
    const len = Math.floor(ac.sampleRate * 4);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    // Wash layer
    const washSrc = ac.createBufferSource();
    washSrc.buffer = buf; washSrc.loop = true;
    const washFilter = ac.createBiquadFilter();
    washFilter.type = "lowpass"; washFilter.frequency.value = 520; washFilter.Q.value = 0.6;
    const washGain = ac.createGain(); washGain.gain.value = 0.055;
    washSrc.connect(washFilter); washFilter.connect(washGain); washGain.connect(master);
    const sweep = ac.createOscillator(); sweep.frequency.value = 0.035;
    const sweepDepth = ac.createGain(); sweepDepth.gain.value = 120;
    sweep.connect(sweepDepth); sweepDepth.connect(washFilter.frequency);
    washSrc.start(); sweep.start();

    // Traffic layer
    const trafficSrc = ac.createBufferSource();
    trafficSrc.buffer = buf; trafficSrc.loop = true;
    const trafficFilter = ac.createBiquadFilter();
    trafficFilter.type = "bandpass"; trafficFilter.frequency.value = 380; trafficFilter.Q.value = 0.9;
    const trafficGain = ac.createGain(); trafficGain.gain.value = 0.0001;
    trafficSrc.connect(trafficFilter); trafficFilter.connect(trafficGain); trafficGain.connect(master);
    trafficSrc.start();

    const nature = ac.createGain(); nature.gain.value = 0.5; nature.connect(master);
    ambient = { master, washGain, washFilter, trafficGain, trafficFilter, nature };

    const chirp = () => {
      if (!audioOn) { ambient.chirpTimer = setTimeout(chirp, 1800); return; }
      const now = ac.currentTime;
      const nightTime = S.hour < 6 || S.hour > 20;
      const osc = ac.createOscillator(), g = ac.createGain();
      osc.type = "sine";
      const base = nightTime ? rnd(2600, 3400) : rnd(1500, 2400);
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * (nightTime ? 0.86 : 1.2), now + 0.05);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(nightTime ? 0.012 : 0.03, now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (nightTime ? 0.05 : 0.08));
      osc.connect(g); g.connect(nature);
      osc.start(now); osc.stop(now + 0.12);
      const gap = S.rain > 0.3 ? rnd(3000, 6000) : (nightTime ? rnd(900, 2000) : rnd(500, 1500));
      ambient.chirpTimer = setTimeout(chirp, gap);
    };
    chirp();
  }

  function stopAmbient() {
    if (trafficTimer) clearTimeout(trafficTimer);
    if (chirpTimer) clearTimeout(chirpTimer);
    if (ambient) {
      Object.values(ambienceSources).forEach(src => {
        if (src && src.stop) src.stop();
      });
      if (ambient.master) ambient.master.disconnect();
      ambient = null;
    }
  }  // ---------------------------------------------------------------- tools ui
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
    const c = getCanvas();
    if (!c) return;
    let painting = false, panning = false, panStart = null, spaceDown = false, lastTile = null;
    // touch: one finger pans, two fingers pinch, a tap paints (ENG-06)
    const touchPts = new Map();
    let pinch = null, touchMoved = false, touchStartTile = null;
    const touchDist = () => {
      const ids = Array.from(touchPts.keys());
      if (ids.length < 2) return 0;
      const a = touchPts.get(ids[0]), b = touchPts.get(ids[1]);
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    c.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") {
        touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touchPts.size === 1) {
          panning = true; touchMoved = false;
          panStart = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
          touchStartTile = screenToTile(e.offsetX, e.offsetY);
        } else if (touchPts.size === 2) {
          panning = false;
          pinch = { d: touchDist(), zoom: cam.zoom };
        }
        c.setPointerCapture(e.pointerId);
        return;
      }
      if (!audioOn) { audioOn = true; el("ui-sound").classList.remove("off"); startAmbient(); }
      const t = screenToTile(e.offsetX, e.offsetY);
      if (e.button === 1 || e.button === 2 || spaceDown) {
        panning = true; panStart = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
        c.setPointerCapture(e.pointerId);
        return;
      }
      painting = true; lastTile = t;
      if (S.tool === "inspect") { inspect(t.gx, t.gy); painting = false; return; }
      paint(toolById(S.tool), t.gx, t.gy);
    });
    c.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") {
        if (touchPts.has(e.pointerId)) touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && touchPts.size >= 2) {
          const d = touchDist();
          if (pinch.d > 8) cam.zoom = clamp(pinch.zoom * (d / pinch.d), 0.25, 8);
          return;
        }
        if (panning && panStart) {
          const dx = e.clientX - panStart.x, dy = e.clientY - panStart.y;
          if (Math.abs(dx) + Math.abs(dy) > 6) touchMoved = true;
          cam.x = panStart.cx + dx; cam.y = panStart.cy + dy;
        }
        return;
      }
      const t = screenToTile(e.offsetX, e.offsetY);
      hover = t;
      if (panning && panStart) {
        cam.x = panStart.cx + (e.clientX - panStart.x);
        cam.y = panStart.cy + (e.clientY - panStart.y);
        return;
      }
      if (painting) { paintLine(toolById(S.tool), lastTile, t); lastTile = t; }
    });
    window.addEventListener("pointerup", (e) => {
      if (e && e.pointerType === "touch") {
        touchPts.delete(e.pointerId);
        if (touchPts.size < 2) pinch = null;
        if (!touchMoved && touchStartTile && touchPts.size === 0) {
          if (S.tool === "inspect") inspect(touchStartTile.gx, touchStartTile.gy);
          else paint(toolById(S.tool), touchStartTile.gx, touchStartTile.gy);
        }
        if (touchPts.size === 0) { panning = false; panStart = null; touchStartTile = null; }
        return;
      }
      painting = false; panning = false; panStart = null; lastTile = null;
    });
    c.addEventListener("contextmenu", (e) => e.preventDefault());
    c.addEventListener("wheel", (e) => {
      e.preventDefault();
      zoomAt(e.offsetX, e.offsetY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    }, { passive: false });
    window.addEventListener("keydown", (e) => {
          if (e.code === "Space") { spaceDown = true; c.style.cursor = "grab"; }
          if (e.key === "Escape") {
            el("modal").classList.add("hidden");
            el("inspector").classList.add("hidden");
            const pd = el("pop-dashboard"); if (pd) pd.classList.add("hidden");
            const ed = el("econ-dashboard"); if (ed) ed.classList.add("hidden");
          }
          if (e.key === "q" || e.key === "Q") rotateCamera(-1);
          if (e.key === "e" || e.key === "E") rotateCamera(1);
          if (e.key === "+" || e.key === "=") zoomBy(1.25);
          if (e.key === "-") zoomBy(1 / 1.25);
          if (e.key === "o" || e.key === "O") optionsModal();
          if (e.key === "p" || e.key === "P") togglePopDashboard();
          if (e.key === "e" && !e.ctrlKey && !e.metaKey) { /* rotate already uses e/E */ }
          if (e.key === "$") toggleEconDashboard();
          // overlays and the tax lever (2026-10-30)
          if (e.key === "l" || e.key === "L") { S.overlay = S.overlay === "lv" ? null : "lv"; toast(S.overlay ? "Land value overlay" : "Overlay off"); }
          if (e.key === "k" || e.key === "K") { S.overlay = S.overlay === "crime" ? null : "crime"; toast(S.overlay ? "Crime overlay" : "Overlay off"); }
          if (e.key === "j" || e.key === "J") { S.overlay = S.overlay === "poll" ? null : "poll"; toast(S.overlay ? "Pollution overlay" : "Overlay off"); }
          if (e.key === "[") {
            S.taxRate = clamp((S.taxRate == null ? 7 : S.taxRate) - 1, 1, 15);
            recalcWorld(); updateDemand(); refreshHud(); toast("Tax " + S.taxRate + "%");
          }
          if (e.key === "]") {
            S.taxRate = clamp((S.taxRate == null ? 7 : S.taxRate) + 1, 1, 15);
            recalcWorld(); updateDemand(); refreshHud(); toast("Tax " + S.taxRate + "%");
          }
          if (e.key === "F3" || e.code === "F3") {
            e.preventDefault();
            if (typeof DebugOverlay !== "undefined") DebugOverlay.toggle();
          }
        });
    window.addEventListener("keyup", (e) => { if (e.code === "Space") { spaceDown = false; c.style.cursor = "crosshair"; } });
    window.addEventListener("resize", resize);
  }

  function setSpeed(v) {
    // 0 pauses, 1/2/3 multiply the day rate (ENG-01). The sky still follows the wall clock.
    if (typeof v === "number") { S.speed = clamp(Math.round(v), 0, 3); refreshHud(); }
    return S.speed;
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
    // Older saves omit fields that were added later (rail, and any empty layer).
    // A non-string here used to throw, wipe the world, and leave a blank board.
    if (typeof str !== "string" || !str.length) return out;
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
                terrain: rle(r.terrain), road: rle(r.road), rail: rle(r.rail), zone: rle(r.zone), level: rle(r.level),
                landmarks: (r.landmarks || []).map(l => l.key + "@" + l.i).join(","),
                bldg: rle(r.bldg), svc: rle(r.svc),
                households: (r.households || []).map(h => ({
                  id: h.id, tile: h.tile, capacity: h.capacity, residents: h.residents,
                  condition: h.condition, rent: h.rent, createdDay: h.createdDay
                })),
              });
      });
      const data = { schema: 2, v: 4, seed: S.seed, cash: S.cash, day: S.day, taxRate: S.taxRate, ordinances: S.ordinances, bonds: S.bonds, unlocked: S.unlocked, regions,
            savedAt: Date.now(), cam: { x: cam.x, y: cam.y, zoom: cam.zoom },
            fireTrucks: fireTrucks.map(t => ({ id: t.id, x: t.x, y: t.y, state: t.state, targetFire: t.targetFire, routeIdx: t.routeIdx, stationId: t.stationId })),
            ambulances: ambulances.map(a => ({ id: a.id, x: a.x, y: a.y, state: a.state, targetCall: a.targetCall, routeIdx: a.routeIdx, clinicId: a.clinicId })),
            policeCars: policeCars.map(c => ({ id: c.id, x: c.x, y: c.y, state: c.state, targetCall: c.targetCall, routeIdx: c.routeIdx, stationId: c.stationId })),
            activeFires: activeFires.map(f => ({ id: f.id, gx: f.gx, gy: f.gy, severity: f.severity, contained: f.contained, damage: f.damage })),
            medicalCalls: medicalCalls.map(m => ({ id: m.id, type: m.type, gx: m.gx, gy: m.gy, status: m.status, assignedAmbulance: m.assignedAmbulance })),
            policeCalls: policeCalls.map(p => ({ id: p.id, type: p.type, gx: p.gx, gy: p.gy, status: p.status, assignedUnit: p.assignedUnit })),
            // Population data
            citizens: citizens.map(c => ({
              id: c.id, name: c.name, archetype: c.archetype, age: c.age, ageStage: c.ageStage,
              stats: c.stats, skills: c.skills, traits: c.traits,
              householdId: c.householdId, job: c.job, happiness: c.happiness,
              needs: c.needs, relationships: c.relationships, routine: c.routine,
              commutePath: c.commutePath, daysUnemployed: c.daysUnemployed,
              daysInCity: c.daysInCity, bornDay: c.bornDay, lastMovedDay: c.lastMovedDay,
              status: c.status, blightContribution: c.blightContribution, leavingReason: c.leavingReason
            })),
            citizenIdCounter: citizenIdCounter,
            householdIdCounter: householdIdCounter,
          };
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        toast("World saved · " + regions.length + " region" + (regions.length === 1 ? "" : "s"));
      } catch (e) {
        // Quota or a bad blob: keep the city geometry, drop the citizen/truck detail, and say so.
        try {
          const slim = Object.assign({}, data);
          ["citizens", "fireTrucks", "ambulances", "policeCars", "activeFires", "medicalCalls", "policeCalls"].forEach((k) => { delete slim[k]; });
          slim.regions = data.regions.map((r) => Object.assign({}, r, { households: [] }));
          const bytes = JSON.stringify(slim);
          localStorage.setItem(SAVE_KEY, bytes);
          toast("Saved without citizen detail (storage was tight, " + Math.round(bytes.length / 1024) + " KB)");
        } catch (e2) {
          toast("Could not save: browser storage is full");
        }
      }
    }
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (!raw) { toast("No saved world in this browser"); return false; }
    try {
      const d = JSON.parse(raw);
      if (!d || !Array.isArray(d.regions) || !d.regions.length) throw new Error("empty save");
      // schema v2: keep the raw pre-v2 payload so a failed migration is always recoverable
      if (!d.schema) {
        try { localStorage.setItem("lattice-city-v1-backup", raw); } catch (e) {}
      }
      if (typeof d.taxRate === "number") S.taxRate = d.taxRate;
      if (d.ordinances) S.ordinances = Object.assign({ fines: false, cleanAir: false, watch: false, greenbelt: false }, d.ordinances);
      if (typeof d.bonds === "number") S.bonds = d.bonds;
      const next = new Array(GW * GH).fill(null);
      S.seed = d.seed; S.cash = d.cash; S.day = d.day || 0; S.unlocked = d.unlocked || 0;
      S.hour = localHour();   // the sky belongs to the player's clock, not the save
      d.regions.forEach((r) => {
        const reg = makeRegion(r.rx, r.ry);
        reg.claimed = true;
        reg.terrain = unrle(r.terrain, RS * RS);
                reg.road = unrle(r.road, RS * RS);
                reg.rail = unrle(r.rail, RS * RS);
                reg.zone = unrle(r.zone, RS * RS);
                reg.level = unrle(r.level, RS * RS);
          if (r.landmarks) {
            reg.landmarks = r.landmarks.split(",").filter(Boolean).map(s => {
              const [key, idx] = s.split("@");
              return { key, i: parseInt(idx) };
            });
          } else {
            reg.landmarks = [];
          }
        reg.bldg = unrle(r.bldg, RS * RS);
        reg.svc = unrle(r.svc, RS * RS);
        reg.owned = new Uint8Array(RS * RS).fill(1);
        reg.powerOn = new Uint8Array(RS * RS);
        reg.waterOn = new Uint8Array(RS * RS);
        reg.policeOn = new Uint8Array(RS * RS);
        reg.density = new Uint8Array(RS * RS);
        reg.value = new Uint8Array(RS * RS);
        reg.svcVal = new Uint8Array(RS * RS);
        reg.poll = new Uint8Array(RS * RS);
        reg.crime = new Uint8Array(RS * RS);
        reg.zoneDirty = true;
        buildDecor(reg);
        reg.theme = pickTheme(reg.terrain, reg.rx, reg.ry);
        reg.name = (THEMES[reg.theme] || THEMES.oldtown).label;
        next[regionKey(r.rx, r.ry)] = reg;
        recomputeRegion(reg);
      });
      S.regions = next;
      S.peds = []; S.cars = []; S.boats = []; S.smoke = []; S.ferries = []; S.trains = [];
            if (!S.clouds || !S.clouds.length) seedClouds();
            S.homes = null; S.workplaces = null; S.roadSpots = null; S.waterSpots = null;

            // Restore emergency vehicles and calls
                        fireTrucks.length = 0; ambulances.length = 0; policeCars.length = 0;
                        activeFires.length = 0; medicalCalls.length = 0; policeCalls.length = 0;
                        if (d.fireTrucks) d.fireTrucks.forEach(t => { const nt = { ...t, route: null }; fireTrucks.push(nt); });
                        if (d.ambulances) d.ambulances.forEach(a => { const nt = { ...a, route: null }; ambulances.push(nt); });
                        if (d.policeCars) d.policeCars.forEach(c => { const nt = { ...c, route: null }; policeCars.push(nt); });
                        if (d.activeFires) d.activeFires.forEach(f => activeFires.push(f));
                        if (d.medicalCalls) d.medicalCalls.forEach(m => medicalCalls.push(m));
                        if (d.policeCalls) d.policeCalls.forEach(p => policeCalls.push(p));

                        // Restore population data
                                                citizens.length = 0;
                                                if (d.citizens) {
                                                  d.citizens.forEach(cData => {
                                                    const citizen = { ...cData };
                                                    citizen.household = null;
                                                    citizens.push(citizen);
                                                  });
                                                  citizenIdCounter = d.citizenIdCounter || 0;
                                                  householdIdCounter = d.householdIdCounter || 0;
                                                }

                                                // Restore households to regions
                                                if (d.regions) {
                                                  d.regions.forEach(rData => {
                                                    if (rData.households) {
                                                      const reg = regionAt(rData.rx, rData.ry);
                                                      if (reg) {
                                                        reg.households = rData.households.map(hData => ({
                                                          ...hData,
                                                          region: reg,
                                                          gx: reg.rx * RS + (hData.tile % RS),
                                                          gy: reg.ry * RS + ((hData.tile / RS) | 0),
                                                        }));
                                                        reg.households.forEach(h => {
                                                          h.residents.forEach(citizenId => {
                                                            const citizen = citizens.find(c => c.id === citizenId);
                                                            if (citizen) citizen.household = h;
                                                          });
                                                        });
                                                      }
                                                    }
                                                  });
                                                }

                                                initializeFireTrucks(); initializeAmbulances(); initializePoliceCars();      refreshLinks(); recalcWorld(); updateDemand();
      renderTools(); refreshHud();
      const view = getCanvas();
      const vw = view ? view.clientWidth : 0;
      const vh = view ? view.clientHeight : 0;
      let seeCity = false;
      if (vw >= 8 && vh >= 8 && d.cam && typeof d.cam.zoom === "number" && isFinite(d.cam.x) && isFinite(d.cam.y)) {
        cam.x = d.cam.x; cam.y = d.cam.y; cam.zoom = clamp(d.cam.zoom, 0.16, 2.4);
        const c = screenToTile(vw / 2, vh / 2);
        seeCity = !!regionOf(c.gx, c.gy);
      }
      if (!seeCity) focusCity();
      // while you were away the city kept its own time: replay a bounded stretch
      const away = Math.floor((Date.now() - (d.savedAt || Date.now())) / (TICK_SECONDS * 1000));
      const catchUp = clamp(away, 0, 80);
      for (let i = 0; i < catchUp; i++) tick();
      lastTickWall = Date.now();
      toast(catchUp > 4
        ? "World loaded · " + catchUp + " beats of city life caught up"
        : "World loaded · " + claimedList().length + " regions");
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
    seedClouds();
    toast("New world · " + (GW * GH) + " regions of " + RS + "×" + RS);
  
  initializeFireTrucks();
    initializeAmbulances();
    initializePoliceCars();
  }

  function optionsModal() {
    const rows = [];
    const slider = (key, label, hint) => rows.push(
      '<label class="opt"><span>' + label + '<i>' + hint + '</i></span>' +
      '<input type="range" min="0" max="100" data-opt="' + key + '" value="' + OPT[key] + '">' +
      '<b data-optout="' + key + '">' + OPT[key] + '</b></label>');
    const toggle = (key, label, hint) => rows.push(
      '<label class="opt togglerow"><span>' + label + '<i>' + hint + '</i></span>' +
      '<input type="checkbox" data-opt="' + key + '"' + (OPT[key] ? " checked" : "") + '><b></b></label>');

    slider("master", "Master", "everything the game makes");
    slider("music", "LYGO music", "the listen portal volume");
    slider("sfx", "Effects", "roads, builds, milestones");
    slider("ambience", "Ambience", "birds, crickets, traffic");
    toggle("weather", "Weather", "rain and dry spells");
    toggle("night", "Day and night", "tint and lit windows");
    toggle("grid", "Tile grid", "faint lines on the ground");
    toggle("autosave", "Autosave", "every 10 days to this browser");
    toggle("reduceMotion", "Reduce motion", "no water shimmer, no bobbing");
    toggle("tts", "TTS Dispatch", "voice announcements for emergencies");
    toggle("clock24", "24-hour clock", "off for am/pm");

    modal("Options", '<div class="optlist">' + rows.join("") + "</div>" +
      '<div class="row"><button id="opt-reset" class="wide">Reset to defaults</button>' +
      '<button id="opt-close" class="wide">Back to the city</button></div>');

    document.querySelectorAll("[data-opt]").forEach((inp) => {
      const apply = () => {
        const key = inp.dataset.opt;
        OPT[key] = inp.type === "checkbox" ? inp.checked : Number(inp.value);
        const out = document.querySelector('[data-optout="' + key + '"]');
        if (out) out.textContent = String(OPT[key]);
        saveOpts();
      };
      inp.addEventListener(inp.type === "checkbox" ? "change" : "input", apply);
    });
    const reset = el("opt-reset");
    if (reset) reset.onclick = () => { Object.assign(OPT, OPT_DEFAULT); saveOpts(); optionsModal(); };
    const close = el("opt-close");
    if (close) close.onclick = () => el("modal").classList.add("hidden");
  }

  function zoomAt(sx, sy, factor) {
    // hold the point under the cursor: world position before, same position after
    const wx = (sx - cam.x) / cam.zoom;
    const wy = (sy - cam.y) / cam.zoom;
    cam.zoom = clamp(cam.zoom * factor, 0.16, 2.4);
    cam.x = sx - wx * cam.zoom;
    cam.y = sy - wy * cam.zoom;
  }
  function zoomBy(f) {
    zoomAt(getCanvas().clientWidth / 2, getCanvas().clientHeight / 2, f);
  }

  function bindUi() {
    const soundBtn = el("ui-sound");
    if (soundBtn) soundBtn.onclick = () => {
      audioOn = !audioOn;
      soundBtn.classList.toggle("off", !audioOn);
      if (audioOn) startAmbient();
      if (ambient) ambient.master.gain.value = audioOn ? 0.05 : 0;
    };
    const ui_help = el("ui-help"); if (ui_help) ui_help.onclick = () => modal("How to play", [
      "<p>You are the planner of a region, and then of a world of them.</p>",
      "<ul>",
      "<li><b>Road</b> first. Zoned land only grows next to a road.</li>",
      "<li><b>Zone</b> homes, shops and works. The demand bars show what the world wants.</li>",
      "<li><b>Power, water, parks</b> reach a radius. A first building needs a road; a second storey needs power; a third needs water too.</li>",
      "<li><b>Regions</b> are 160×160 tiles. Claim neighbours on the world map (bottom right) for $15,000. Each one is a full city of its own.</li>",
      "<li><b>Connections</b> happen where a road on one border meets a road on the other. Connected regions share jobs, so people can live in one town and work in another.</li>",
      "<li><b>Milestones</b> at 120, 600, 2,500 and 8,000 people unlock parks, plazas, libraries and monuments.</li>",
      "</ul>",
      "<p><p><b>Time is yours, not the game's:</b> the sky, the shops and the night follow your local clock, and the city takes one beat every seven seconds with no pause and no fast forward. Close the tab and it keeps living; come back and it catches up.</p><p>The <b>Music</b> panel under Build is the LYGO listen portal — 80+ tracks from the catalogue, plus birdsong and traffic from the game itself. Playing music ducks the game ambience.</p><p><kbd>Space</kbd>+drag or right-drag to pan · wheel to zoom · inspect to read a tile.</p>",
    ].join(""));
    const modal_close = el("modal-close"); if (modal_close) modal_close.onclick = () => el("modal").classList.add("hidden");
    const ins_close = el("ins-close"); if (ins_close) ins_close.onclick = () => el("inspector").classList.add("hidden");
    const ui_save = el("ui-save"); if (ui_save) ui_save.onclick = save;
    // ordinance toggles (2026-10-30)
    document.querySelectorAll(".ord").forEach((btn) => {
      const name = btn.getAttribute("data-ord");
      if (!name || !S.ordinances) return;
      btn.classList.toggle("on", !!S.ordinances[name]);
      btn.onclick = () => {
        S.ordinances[name] = !S.ordinances[name];
        btn.classList.toggle("on", S.ordinances[name]);
        claimedList().forEach((r) => computeFields(r));
        recalcWorld();
        updateDemand();
        refreshHud();
        toast((S.ordinances[name] ? "On: " : "Off: ") + btn.textContent.trim());
      };
    });
    // one click cue for the whole UI (AUD-02)
    document.addEventListener("click", (ev) => {
      if (ev.target && ev.target.closest && ev.target.closest("button")) sfx("click");
    }, { passive: true });
    // speed buttons (ENG-01)
    document.querySelectorAll(".spd").forEach((btn) => {
      const v = Number(btn.getAttribute("data-spd"));
      btn.classList.toggle("on", (S.speed == null ? 1 : S.speed) === v);
      btn.onclick = () => {
        setSpeed(v);
        document.querySelectorAll(".spd").forEach((b) => b.classList.toggle("on", Number(b.getAttribute("data-spd")) === v));
        toast(v === 0 ? "Paused" : "Speed " + v + "x");
      };
    });
    const ui_bond = el("ui-bond");
    if (ui_bond) ui_bond.onclick = () => {
      if ((S.bonds || 0) > 0 && S.cash >= 10600) {
        S.bonds -= 1; S.cash -= 10600;
        recalcWorld(); refreshHud();
        toast("Bond repaid · $10,600");
        return;
      }
      S.bonds = (S.bonds || 0) + 1;
      S.cash += 10000;
      recalcWorld();
      refreshHud();
      toast("Bond issued · $10,000 · 6% a year");
    };
    const ui_load = el("ui-load"); if (ui_load) ui_load.onclick = () => load();
    const ui_snapshot = el("ui-snapshot"); if (ui_snapshot) ui_snapshot.onclick = snapshot;
    const ui_options = el("ui-options"); if (ui_options) ui_options.onclick = optionsModal;
    const ui_zoomin = el("ui-zoomin"); if (ui_zoomin) ui_zoomin.onclick = () => zoomBy(1.25);
    const ui_zoomout = el("ui-zoomout"); if (ui_zoomout) ui_zoomout.onclick = () => zoomBy(1 / 1.25);
    const ui_rotate = el("ui-rotate"); if (ui_rotate) ui_rotate.onclick = () => rotateCamera(1);
    const ui_new = el("ui-new"); if (ui_new) ui_new.onclick = () => {
      if (!confirm("Start a new world? The current one is replaced.")) return;
      newWorld();
      renderTools(); refreshHud();
    };
    const ui_claim = el("ui-claim"); if (ui_claim) ui_claim.onclick = () => {
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
        const ui_pop_dash = el("ui-pop-dash"); if (ui_pop_dash) ui_pop_dash.onclick = () => togglePopDashboard();
        const ui_econ_dash = el("ui-econ-dash"); if (ui_econ_dash) ui_econ_dash.onclick = () => toggleEconDashboard();
      }

      function togglePopDashboard() {
        const dash = el("pop-dashboard");
        if (!dash) return;
        const isHidden = dash.classList.toggle("hidden");
        if (!isHidden) updatePopDashboard();
      }

      function updatePopDashboard() {
        const dash = el("pop-dash-body");
        if (!dash) return;
        const data = window.LC.population.getDashboard();
        if (!data) { dash.innerHTML = "<p>No population data yet</p>"; return; }
        const empClass = data.employmentRate > 0.8 ? "good" : data.employmentRate > 0.5 ? "warn" : "bad";
        const happyClass = data.avgHappiness > 70 ? "good" : data.avgHappiness > 45 ? "warn" : "bad";
        const blightClass = data.totalBlight < 20 ? "good" : data.totalBlight < 50 ? "warn" : "bad";
        dash.innerHTML = `
          <div class="pop-stat"><span>Total Citizens</span><b>${data.total}</b></div>
          <div class="pop-stat ${empClass}"><span>Employed / Unemployed</span><b>${data.employed} / ${data.unemployed}</b></div>
          <div class="pop-stat ${empClass}"><span>Employment Rate</span><b>${Math.round(data.employmentRate * 100)}%</b></div>
          <div class="pop-stat ${happyClass}"><span>Average Happiness</span><b>${Math.round(data.avgHappiness)}%</b></div>
          <div class="pop-stat ${blightClass}"><span>Total Blight</span><b>${Math.round(data.totalBlight)}</b></div>
          <div class="pop-stat"><span>Households</span><b>${data.households}</b></div>
          <div class="pop-stat"><span>Housing Occupancy</span><b>${Math.round(data.housingOccupancy * 100)}%</b></div>
          <div class="pop-stat"><span>Average Commute</span><b>${Math.round(data.avgCommute)} tiles</b></div>
          <div class="pop-breakdown">
            <h4>By Archetype</h4>
            ${Object.entries(data.byArchetype).map(([k,v]) => `<div class="item"><span>${CITIZEN.ARCHETYPES[k]?.name || k}</span><b>${v}</b></div>`).join("")}
            <h4>By Age Stage</h4>
            ${Object.entries(data.byAgeStage).map(([k,v]) => `<div class="item"><span>${k}</span><b>${v}</b></div>`).join("")}
          </div>
        `;
      }


      function toggleEconDashboard() {
        const dash = el("econ-dashboard");
        if (!dash) return;
        const isHidden = dash.classList.toggle("hidden");
        if (!isHidden) updateEconDashboard();
      }

      function updateEconDashboard() {
        const dash = el("econ-dash-body");
        if (!dash) return;
        const data = economyAPI.getDashboard();
        if (!data) { dash.innerHTML = "<p>No economic data yet</p>"; return; }
        const cashClass = data.cityCash >= 0 ? "good" : "bad";
        const shopClass = data.avgShopBalance >= 0 ? "good" : "bad";
        const bankruptClass = data.bankruptCount > 0 ? "bad" : "good";
        const struggleClass = data.strugglingCount > 0 ? "warn" : "good";
        const sectors = Object.entries(data.bySector).map(function (kv) {
          return "<div class=\'item\'><span>" + kv[0] + "</span><b>" + kv[1] + "</b></div>";
        }).join("");
        dash.innerHTML =
          "<div class=\'pop-stat " + cashClass + "\'><span>City Treasury</span><b>" + money(data.cityCash) + "</b></div>" +
          "<div class=\'pop-stat " + shopClass + "\'><span>Avg Shop Balance</span><b>" + money(Math.round(data.avgShopBalance)) + "</b></div>" +
          "<div class=\'pop-stat\'><span>Total Workers</span><b>" + data.totalWorkers + "</b></div>" +
          "<div class=\'pop-stat\'><span>Total Revenue</span><b>" + money(Math.round(data.totalRevenue)) + "</b></div>" +
          "<div class=\'pop-stat\'><span>Total Wages</span><b>" + money(Math.round(data.totalWages)) + "</b></div>" +
          "<div class=\'pop-stat\'><span>Total Tax Collected</span><b>" + money(Math.round(data.totalTax)) + "</b></div>" +
          "<div class=\'pop-stat " + bankruptClass + "\'><span>Bankrupt</span><b>" + data.bankruptCount + "</b></div>" +
          "<div class=\'pop-stat " + struggleClass + "\'><span>Struggling</span><b>" + data.strugglingCount + "</b></div>" +
          "<div class=\'pop-breakdown\'><h4>By Sector</h4>" + sectors + "</div>";
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
      "<p>The events box in the tool panel says what the world is doing.</p>",
    ].join(""));
  }

  const GEN_SPRITES = ["gen_mtn_peak", "gen_mtn_snow", "gen_hill", "gen_ridge"];
  // Bump on every art change. Sprite URLs carry no other version, so without this the
  // Pages CDN can serve the previous PNGs for ~10 minutes after a push.
  const ASSET_VER = "20261030-river1";

  // Multi-frame tiles. The manifest lists every frame of a sprite, but the loader used to
  // take only [0], so the extra frames were dead weight. Add a key here to make it animate;
  // the value is the frame duration in ms.
  // ONLY the windmill turns. b05_watermill ships two frames, but the Water mill is a
  // separate building that is not animated in this game (Justin, 2026-10-30) — its second
  // frame is a variant, not a rotation, and flipping it read as a twitch. Do not add it back.
  // Water moves (3 generated frames, VIS-04). The windmill turns. The Water mill does not:
  // b05_watermill is deliberately absent — do not add it back.
  const ANIM_SPRITES = {
    b04_windmill: 420,
    c01_river_bend_ne: 320, c02_river_bend_nw: 320, c03_river_bend_se: 320, c04_river_bend_sw: 320,
    c05_river_tjct_nse: 320, c06_river_tjct_ews: 320,
    c11_waterfall_gorge_n: 260, c12_waterfall_gorge_w: 260,
    d11_canal_straight: 320,
  };
  const ANIM_FRAMES = {};

  function animateSprites(ts) {
    for (const key in ANIM_FRAMES) {
      const frames = ANIM_FRAMES[key];
      if (!frames || frames.length < 2) continue;
      const ms = ANIM_SPRITES[key] || 400;
      const f = Math.floor(ts / ms) % frames.length;
      if (frames[f]) SPRITES[key] = frames[f];
    }
  }

  function loadSprites() {
      const manifestUrl = "assets/tiles/manifest.json?v=" + Date.now();
      return fetch(manifestUrl).then((r) => r.json()).then((man) => {
      const jobs = [];
      Object.keys(man).forEach((key) => {
        if (key === "unknown") return;
        const img = new Image();
        img.src = "assets/tiles/" + man[key][0] + "?v=" + ASSET_VER;
        SPRITES[key] = img;
        jobs.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
        // load the remaining frames only for keys we actually animate
        if (ANIM_SPRITES[key] && man[key].length > 1) {
          ANIM_FRAMES[key] = man[key].map((file, fi) => {
            const f = new Image();
            f.src = "assets/tiles/" + file + "?v=" + ASSET_VER;
            if (fi > 0) jobs.push(new Promise((res) => { f.onload = res; f.onerror = res; }));
            return f;
          });
        }
      });
      (man.unknown || []).slice(0, 80).forEach((file, i) => {
        const img = new Image(); img.src = "assets/tiles/" + file + "?v=" + ASSET_VER;
        SPRITES["extra" + i] = img;
        jobs.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
      });
      GEN_SPRITES.forEach((key) => {
        const img = new Image();
        img.src = "assets/tiles/gen/" + key.replace("gen_", "") + ".png?v=" + ASSET_VER;
        SPRITES[key] = img;
        jobs.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
      });
      return Promise.all(jobs);
    });
  }

  window.LC = {
    S, cam, RS, GW, GH, tick, paint, paintLine, claimRegion, regionOf, regionAt, startEvent,
    screenToTile, tileToScreen, newWorld, save, load, setSpeed, focusOn, focusRegion,
    // QA hooks added 2026-10-30 with the field simulation and the audio bus
    audio: audioAPI,
    units: () => ({ fire: fireTrucks.map(u => ({ id: u.id, state: u.state, x: u.x, y: u.y })), police: policeCars.map(u => ({ id: u.id, state: u.state, x: u.x, y: u.y })), amb: ambulances.map(u => ({ id: u.id, state: u.state, x: u.x, y: u.y })) }),
    debug: () => (typeof DebugOverlay !== "undefined" ? DebugOverlay : null),
    taxRate: (v) => {
      if (typeof v === "number") { S.taxRate = clamp(v, 1, 15); recalcWorld(); updateDemand(); refreshHud(); }
      return S.taxRate;
    },
    overlay: (name) => {
      S.overlay = (name === "lv" || name === "crime" || name === "poll") ? name : null;
      return S.overlay;
    },
    fields: () => {
      const out = { value: 0, poll: 0, crime: 0, density: 0, n: 0 };
      claimedList().forEach((r) => {
        for (let i = 0; i < RS * RS; i++) {
          if (!r.zone[i] && !r.level[i]) continue;
          out.value += r.value[i]; out.poll += (r.poll ? r.poll[i] : 0); out.crime += (r.crime ? r.crime[i] : 0); out.density += (r.density ? r.density[i] : 1); out.n++;
        }
      });
      if (out.n) { out.value /= out.n; out.poll /= out.n; out.crime /= out.n; out.density /= out.n; }
      return out;
    },
    // QA hook: which multi-frame tiles are animating, and which frame is live right now
    animInfo: () => {
      const out = {};
      for (const k in ANIM_FRAMES) {
        out[k] = {
          frames: ANIM_FRAMES[k].length,
          loaded: ANIM_FRAMES[k].filter((f) => f && f.complete && f.naturalWidth > 0).length,
          current: SPRITES[k] ? SPRITES[k].src.split("/").pop() : null,
        };
      }
      return out;
    },
    // QA hook: coordinates of built tiles that resolve to a given sprite key
    findSprite: (key, limit) => {
      const hits = [];
      const cap = limit || 5;
      for (let gx = 0; gx < GW * RS && hits.length < cap; gx++) {
        for (let gy = 0; gy < GH * RS; gy++) {
          const t = regionOf(gx, gy);
          if (!t) continue;
          const r = t.r, i = t.i;
          if (!r.level[i] || !r.zone[i]) continue;
          if (themeVariant(r.theme, r.zone[i], r.level[i], gx, gy) === key) {
            hits.push({ gx, gy, zone: r.zone[i], level: r.level[i] });
            break;
          }
        }
      }
      return hits;
    },
    // QA hook: what sprite key a tile resolves to, using the renderer's own rule
    tileKey: (gx, gy) => {
      const t = regionOf(gx, gy);
      if (!t) return null;
      const r = t.r, i = t.i;
      let key = null;
      if (r.road[i]) key = ROAD[roadMask(gx, gy)] || "r02_road_straight_ew";
      else if (r.rail[i]) key = RAIL[railMask(gx, gy)] || "rail_straight_ew";
      else if (r.level[i]) key = themeVariant(r.theme, r.zone[i], r.level[i], gx, gy);
      else if (r.svc[i]) key = SVC_SPRITE[SVC[r.svc[i]]];
      return { key, theme: r.theme, zone: r.zone[i], level: r.level[i], terr: r.terrain[i] };
    },
    railStats,
    railRoute,
    railInfo: () => (S.trains || []).map((t) => ({
      route: t.route ? t.route.length : 0,
      idx: t.idx, dwell: +(t.dwell || 0).toFixed(2), riders: t.riders || 0,
      from: t.from, to: t.to,
    })),
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

  window.LC.population = populationAPI;
  window.LC.economy = economyAPI;

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
    initTTS();
    let hasSave = false;
    try { hasSave = !!localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (!(hasSave && load())) newWorld();
    renderTools();
    refreshHud();
    let seen = false;
    try { seen = localStorage.getItem("latticeCity.seen3") === "1"; localStorage.setItem("latticeCity.seen3", "1"); } catch (e) {}
    if (!seen) firstRun();
    if (hasSave) log("Welcome back. The world kept its shape.");
    requestAnimationFrame(render);
  }

  loadSprites().then(() => { buildTextures(); }).then(boot).catch((err) => {
    // a boot failure must say so rather than leave a black canvas
    console.error(err);
    try {
      modal("Lattice City could not start", "<p>" + String(err && err.message || err) + "</p><p>Reload the page; if it repeats, the saved world can be replaced with the New map button.</p>");
    } catch (e) {}
  });
})();
