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
      C: [["b12_general_store"], ["b06_bakery", "b12_general_store"], ["b14_town_hall"]],
      I: [["b03_blacksmith_forge"], ["b11_carpenter_sawmill"], ["b13_barn_silo"]],
    },
    chapel: {
      label: "Chapel town",
      R: [["b01_cottage_red"], ["b02_tudor_inn", "b09_chapel"], ["b20_noble_manor"]],
      C: [["b12_general_store"], ["b06_bakery"], ["b15_library_scholar"]],
      I: [["b03_blacksmith_forge"], ["b13_barn_silo"], ["b11_carpenter_sawmill"]],
    },
    mill: {
      label: "Mill country",
      R: [["b01_cottage_red", "b04_windmill"], ["b02_tudor_inn"], ["b18_greenhouse_orangery"]],
      C: [["b12_general_store"], ["b06_bakery"], ["b16_alchemist_workshop"]],
      I: [["b04_windmill", "b05_watermill"], ["b11_carpenter_sawmill"], ["b13_barn_silo"]],
    },
    watch: {
      label: "Watch country",
      R: [["b01_cottage_red"], ["b02_tudor_inn"], ["b20_noble_manor"]],
      C: [["b12_general_store"], ["b08_watchtower"], ["b14_town_hall"]],
      I: [["b03_blacksmith_forge"], ["b11_carpenter_sawmill"], ["b17_twin_gatehouse"]],
    },
    harbour: {
      label: "Harbour",
      R: [["b01_cottage_red"], ["b02_tudor_inn", "b19_lighthouse_dock"], ["b20_noble_manor"]],
      C: [["b12_general_store"], ["b06_bakery", "b07_apothecary"], ["b14_town_hall"]],
      I: [["b05_watermill"], ["b13_barn_silo"], ["b11_carpenter_sawmill"]],
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

  const SVC = [null, "park", "water", "power", "plaza", "school", "monument", "dock", "rail", "fire"];
  const SVC_SPRITE = {
    park: "d04_oak_tree_park", water: "b05_watermill", power: "b10_wizard_tower",
    plaza: "d01_plaza_fountain", school: "b15_library_scholar", monument: "d08_stone_statue_plaza",
    dock: "c08_river_quay_dock",
    rail: "b17_twin_gatehouse",
    fire: "b08_watchtower",
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
    links: [], peds: [], cars: [], boats: [], smoke: [], clouds: [],
    rain: 0, rainTarget: 0, weatherTimer: 0, lastAnnounce: -99,
    event: null, nextEventDay: 26, eventHistory: [],
  };

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

  function initTTS() {
    if ("speechSynthesis" in window) {
      const voices = speechSynthesis.getVoices();
      ttsVoice = voices.find(v => v.name.includes("Google") && v.lang === "en-US") ||
                 voices.find(v => v.lang === "en-US" && v.name.includes("Male")) ||
                 voices[0];
      const test = new SpeechSynthesisUtterance(" ");
      test.volume = 0;
      speechSynthesis.speak(test);
    }
  }

  function speak(text, priority = "normal") {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = ttsVoice;
    utter.rate = priority === "emergency" ? 1.1 : 1.0;
    utter.pitch = priority === "emergency" ? 1.05 : 1.0;
    utter.volume = 0.8 * (OPT.master / 100);
    utter.onend = () => { ttsSpeaking = false; processTTSQueue(); };
    ttsQueue.push(utter);
    processTTSQueue();
  }

  function processTTSQueue() {
    if (ttsSpeaking || ttsQueue.length === 0) return;
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
      logEvent("fire", "NO FIRE STATIONS AVAILABLE - Structure fire uncontrolled!", { gx: fire.gx, gy: fire.gy }, "emergency", "Alert! No fire stations in the city. The fire burns unchecked.");
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
      logEvent("fire", "All fire trucks committed - no units available!", { gx: fire.gx, gy: fire.gy }, "emergency", "All fire units committed. Mutual aid requested.");
      return;
    }
    const numTrucks = Math.min(fire.severity, countIdleTrucks(bestStation), 2);
    const trucksToSend = fireTrucks.filter(t => t.stationId === stationId(bestStation) && t.state === "idle").slice(0, numTrucks);
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
    const gameSeconds = dt * (S.speed || 1) * 86400;
    const allUnits = fireTrucks.concat(ambulances).concat(policeCars);
    allUnits.forEach(unit => {
      if (unit.state === "responding" && unit.route && unit.route.length > 0) {
        const speed = unit.type === "fire" ? EMERGENCY.fireSpeed : unit.type === "ambulance" ? EMERGENCY.ambulanceSpeed : EMERGENCY.policeSpeed;
        const tilesToMove = gameSeconds * speed;
        for (let m = 0; m < tilesToMove && unit.routeIdx < unit.route.length - 1; m++) unit.routeIdx++;
        if (unit.routeIdx < unit.route.length) { unit.x = unit.route[unit.routeIdx].x; unit.y = unit.route[unit.routeIdx].y; }
        if (unit.routeIdx >= unit.route.length - 1) {
          unit.state = "on_scene";
          if (unit.type === "fire") logEvent("arrival", "Engine " + unit.id + " on scene", { gx: unit.x, gy: unit.y }, "high", "Engine " + unit.id + " on scene. Beginning fire attack.");
        }
      } else if (unit.state === "returning") {
        const station = getFireStations().find(s => stationId(s) === unit.stationId);
        if (station) {
          const path = findRoadPath(unit.x, unit.y, station.gx, station.gy);
          if (path) { unit.route = path; unit.routeIdx = 0; unit.state = "responding"; unit.returning = true; }
        }
        const stationTile = regionOf(unit.x, unit.y);
        if (stationTile && SVC[stationTile.r.svc[stationTile.i]] === "fire") { unit.state = "idle"; unit.returning = false; unit.route = null; }
      }
    });
  }

  function initializeFireTrucks() {
      fireTrucks = [];
      let truckId = 1;
      getFireStations().forEach(station => {
        for (let t = 0; t < station.trucks; t++) {
          fireTrucks.push({ id: truckId++, type: "fire", stationId: stationId(station), homeRegion: station.region, homeTile: station.tile, x: station.gx, y: station.gy, state: "idle", targetFire: null, route: null, routeIdx: 0, dispatchedAt: 0, eta: 0, returning: false });
        }
      });
    }

    function initializeAmbulances() {
      ambulances = [];
      let ambId = 1;
      getClinics().forEach(clinic => {
        for (let a = 0; a < clinic.ambulances; a++) {
          ambulances.push({ id: ambId++, type: "ambulance", clinicId: clinicId(clinic), x: clinic.gx, y: clinic.gy, state: "idle", targetCall: null, route: null, routeIdx: 0 });
        }
      });
    }

    function initializePoliceCars() {
      policeCars = [];
      let carId = 1;
      getPoliceStations().forEach(station => {
        for (let c = 0; c < station.cars; c++) {
          policeCars.push({ id: carId++, type: "police", stationId: station.region.rx + "," + station.region.ry + "," + station.tile, x: station.gx, y: station.gy, state: "idle", targetCall: null, route: null, routeIdx: 0 });
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
    };

    let medicalCalls = [];

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
      if (S.peds.length === 0) return;
      if (Math.random() > 0.001) return;
      const ped = S.peds[Math.floor(Math.random() * S.peds.length)];
      if (!ped.path || ped.path.length === 0) return;
      const tile = ped.path[ped.at];
      if (!tile) return;
      const type = MEDICAL.EMERGENCY_TYPES[Math.floor(Math.random() * MEDICAL.EMERGENCY_TYPES.length)];
      const call = { id: "med_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6), type: type.id, label: type.label, urgency: type.urgency, patient: ped, gx: tile.x, gy: tile.y, time: S.hour * 3600 + S.day * 86400, assignedAmbulance: null, status: "waiting" };
      medicalCalls.push(call);
      logEvent("medical", type.label + " at " + tile.x + "," + tile.y + " - " + type.urgency.toUpperCase(), { gx: tile.x, gy: tile.y }, type.urgency === "critical" ? "emergency" : "high", type.label + " reported at " + tile.x + "," + tile.y + ". " + type.urgency + " priority.");
      dispatchAmbulance(call);
    }

    function dispatchAmbulance(call) {
      const clinics = getClinics();
      if (!clinics.length) {
        logEvent("medical", "NO MEDICAL FACILITIES - Patient without care!", { gx: call.gx, gy: call.gy }, "emergency", "No medical facilities available. Patient awaiting transport.");
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
      const amb = ambulances.find(a => a.clinicId === clinicId(bestClinic) && a.state === "idle");
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
          if (Math.random() < gameSeconds / 30) dispatchAmbulance(call);
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
    };

    let policeCalls = [];

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

    function spawnPoliceCall() {
      if (Math.random() > 0.0005) return;
      const roadsWithCars = [];
      claimedList().forEach(r => {
        for (let i = 0; i < RS * RS; i++) if (r.road[i]) roadsWithCars.push({ r, i, gx: r.rx * RS + (i % RS), gy: r.ry * RS + ((i / RS) | 0) });
      });
      if (roadsWithCars.length === 0) return;
      const spot = roadsWithCars[Math.floor(Math.random() * roadsWithCars.length)];
      const types = [
        { id: "accident", label: "Traffic Accident", weight: 3, urgency: "high" },
        { id: "disturbance", label: "Civil Disturbance", weight: 2, urgency: "medium" },
        { id: "crime", label: "Reported Crime", weight: 1, urgency: "high" },
      ];
      const type = types[Math.floor(Math.random() * types.length)];
      const call = { id: "pol_" + Date.now(), type: type.id, label: type.label, urgency: type.urgency, gx: spot.gx, gy: spot.gy, time: S.hour * 3600 + S.day * 86400, assignedUnit: null, status: "waiting" };
      policeCalls.push(call);
      logEvent("police", type.label + " at " + spot.gx + "," + spot.gy, { gx: spot.gx, gy: spot.gy }, type.urgency === "critical" ? "emergency" : "high");
      dispatchPolice(call);
    }

    function dispatchPolice(call) {
      const stations = getPoliceStations();
      if (!stations.length) return;
      let bestStation = null, bestDist = Infinity, bestPath = null;
      for (const station of stations) {
        const idle = policeCars.filter(c => c.stationId === station.region.rx + "," + station.region.ry + "," + station.tile && c.state === "idle").length;
        if (idle <= 0) continue;
        const path = findRoadPath(station.gx, station.gy, call.gx, call.gy);
        if (!path) continue;
        if (path.length < bestDist) { bestDist = path.length; bestStation = station; bestPath = path; }
      }
      if (!bestStation) return;
      const unit = policeCars.find(c => c.stationId === bestStation.region.rx + "," + bestStation.region.ry + "," + bestStation.tile && c.state === "idle");
      if (!unit) return;
      const travelTime = bestDist / POLICE.policeSpeed;
      const etaMin = Math.ceil(travelTime / 60 * 10) / 10;
      unit.state = "responding"; unit.targetCall = call.id; unit.route = bestPath; unit.routeIdx = 0;
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
          if (Math.random() < gameSeconds / 30) dispatchPolice(call);
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
    let risk = 0;
    for (let i = 0; i < RS * RS; i++) {
      if (region.zone[i] === Z.I) {
        risk += region.level[i] * 0.5;
        const dirs = [[0,-1],[1,0],[0,1],[-1,0]];
        for (const [dx,dy] of dirs) {
          const t = regionOf(region.rx * RS + (i % RS) + dx, region.ry * RS + ((i / RS) | 0) + dy);
          if (t && t.r.zone[t.i] === Z.I) risk += 0.2;
        }
      }
    }
    const stations = getFireStations();
    stations.forEach(st => {
      const path = findRoadPath(st.gx, st.gy, region.rx * RS + RS/2, region.ry * RS + RS/2);
      if (path && path.length < 100) risk *= 0.5;
      else if (path) risk *= 0.8;
    });
    return Math.max(0, risk);
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
  function saveOpts() {
    ttsEnabled = OPT.tts;
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
        terrain: null, road: null, rail: null, zone: null, level: null, bldg: null, svc: null,
        owned: null, powerOn: null, waterOn: null, value: null,
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
    function hasRail(gx, gy) { const t = regionOf(gx, gy); return !!t && t.r.rail[t.i] === 1; }
    function railMask(gx, gy) {
      let m = 0;
      if (hasRail(gx, gy - 1)) m |= 1;
      if (hasRail(gx + 1, gy)) m |= 2;
      if (hasRail(gx, gy + 1)) m |= 4;
      if (hasRail(gx - 1, gy)) m |= 8;
      return m;
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
      if (!rule || !rule.value || !rule.radius) continue;
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
  
  initializeFireTrucks();
    initializeAmbulances();
    initializePoliceCars();
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
      const evCom = eventCommerce(r);
      // shops grow on custom: a shop with no trade all day does not expand
      let commerce = 1;
      if (z === Z.C) commerce = (0.55 + Math.min(1.4, (r.commerce || 0) / 14)) * evCom;
      else if (z === Z.I) commerce = 0.85 + Math.min(0.5, (r.commerce || 0) / 40);
      if (lv > 0 && !canUp && Math.random() < 0.02) {
        r.level[i] = lv - 1;
        continue;
      }
      if (dem > 0.3 && lv < 3 && canUp && Math.random() < dem * commerce * eventGrowth(r) * (0.20 + value * 0.22)) {
        r.level[i] = lv + 1;
        sfx("grow");
      } else if (lv > 0 && z === Z.C && (r.commerce || 0) < 1.5 && Math.random() < 0.03) {
        r.level[i] = lv - 1;
      } else if (dem < 0.08 && lv > 0 && Math.random() < 0.02) {
        r.level[i] = lv - 1;
      }
    }
  }

  let lastTickWall = Date.now();
  function pumpTicks() {
    const now = Date.now();
    let n = 0;
    while (now - lastTickWall >= TICK_SECONDS * 1000 && n < 12) {
      lastTickWall += TICK_SECONDS * 1000;
      tick();
      n++;
    }
    // a tab that slept for hours replays a bounded stretch, same as a load
    const maxGap = TICK_SECONDS * 1000 * 80;
    if (now - lastTickWall > maxGap) lastTickWall = now - maxGap;
  }

  function tick() {
    S.day++;
    // the hour advances in the frame loop; a tick only marks the day
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
    checkMilestones();
    updatePeds();
    updateEvent();
    balanceAudio();
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
    sfx("announce");
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
    market: { days: 4, label: "Market day", colour: "#f2c14e" },
    festival: { days: 5, label: "Festival", colour: "#d98fe0" },
    fire: { days: 3, label: "Fire", colour: "#e2583c" },
    boom: { days: 5, label: "Building boom", colour: "#6fbf73" },
  };

  function startEvent() {
    const towns = claimedList().filter((r) => r.built > 3);
    if (!towns.length) return false;
    const town = towns[(Math.random() * towns.length) | 0];
    const roll = Math.random();
    const type = roll < 0.4 ? "market" : roll < 0.65 ? "festival" : roll < 0.85 ? "boom" : "fire";
    const def = EVENTS[type];
    S.event = { type, region: town, until: S.day + def.days, started: S.day };
    S.eventHistory.push(type);
    if (type === "fire") {
      // the worst fire a town can have: a level-3 works loses a floor
      let hit = -1;
      for (let i = 0; i < RS * RS; i++) {
        if (town.zone[i] === Z.I && town.level[i] >= 2) { hit = i; break; }
      }
      if (hit >= 0) {
        const fx = hit % RS, fy = (hit / RS) | 0;
        // a fire station within reach saves the building
        let covered = false;
        for (let i = 0; i < RS * RS && !covered; i++) {
          if (SVC[town.svc[i]] !== "fire") continue;
          const dx = (i % RS) - fx, dy = ((i / RS) | 0) - fy;
          if (dx * dx + dy * dy <= 8 * 8) covered = true;
        }
        S.fireTile = { x: town.rx * RS + fx, y: town.ry * RS + fy, until: S.day + 2 };
        if (covered) {
          town.mood = clamp(town.mood - 2, 0, 100);
          toast("FIRE CONTAINED · " + (town.name || "a district"));
          log("<b>Fire</b> in " + (town.name || "the district") + " — the station put it out. A workshop smells of smoke.");
        } else {
          town.level[hit] -= 1;
          town.mood = clamp(town.mood - 6, 0, 100);
          toast("FIRE · " + (town.name || "a district") + " · a workshop is burning");
          log("<b>Fire</b> breaks out in " + (town.name || "the district") + ". The works lost a floor — no station covered it.");
        }
      } else {
        town.mood = clamp(town.mood - 3, 0, 100);
        toast("FIRE SCARE · " + (town.name || "a district"));
        log("<b>Fire</b> scare in " + (town.name || "the district") + " — nothing important burned.");
      }
    } else if (type === "market") {
      toast("MARKET DAY · " + (town.name || "a district"));
      log("<b>Market day</b> in " + (town.name || "the district") + " — the streets are thick with trade.");
    } else if (type === "festival") {
      town.mood = clamp(town.mood + 9, 0, 100);
      toast("FESTIVAL · " + (town.name || "a district"));
      log("<b>Festival</b> in " + (town.name || "the district") + " — mood is up for days.");
    } else {
      toast("BOOM · " + (town.name || "a district"));
      log("<b>Building boom</b> in " + (town.name || "the district") + " — cranes on every corner.");
    }
    sfx(type === "fire" ? "deny" : "milestone");
    return true;
  }

  function updateEvent() {
    if (S.event && S.day >= S.event.until) {
      S.event = null;
      S.nextEventDay = S.day + 14 + Math.floor(Math.random() * 16);
      S.fireTile = null;
    }
    if (!S.event && S.day >= S.nextEventDay && S.day > 20 && S.pop >= 60) startEvent();
  }

  function eventCommerce(region) {
    if (!S.event || S.event.region !== region) return 1;
    if (S.event.type === "market") return 1.6;
    if (S.event.type === "festival") return 1.25;
    if (S.event.type === "fire") return 0.7;
    return 1;
  }
  function eventGrowth(region) {
    if (!S.event || S.event.region !== region) return 1;
    if (S.event.type === "boom") return 1.5;
    if (S.event.type === "fire") return 0.7;
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

  function spawnTrain() {
    const depots = railCentres();
    const track = S.links.filter((l) => l.kind === "rail");
    if (!track.length || depots.length < 2) return null;
    const link = track[(Math.random() * track.length) | 0];
    const a = depots.find((d) => d.r === link.a), b = depots.find((d) => d.r === link.b);
    if (!a || !b) return null;
    return { ax: a.x, ay: a.y, bx: b.x, by: b.y, t: Math.random(), dir: 1, speed: rnd(0.06, 0.11),
           from: (link.a.name || "depot"), to: (link.b.name || "depot") };
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

  function spawnBoat() {
    const water = S.waterSpots || [];
    if (water.length < 4) return null;
    const a = water[(Math.random() * water.length) | 0];
    return { x: a.x, y: a.y, t: Math.random(), speed: rnd(0.15, 0.3), dir: (Math.random() * 4) | 0, kind: Math.random() < 0.5 ? "skiff" : "barge" };
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
    const wantTrains = S.links.filter((l) => l.kind === "rail").length;
    let trainGuard = 0;
    while (S.trains.length < wantTrains && trainGuard++ < 12) {
      const t = spawnTrain();
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
  function focusOn(gx, gy, zoom) {
    const c = getCanvas();
    cam.zoom = zoom || 0.95;
    const p = tileToScreen(gx, gy);
    cam.x += c.clientWidth / 2 - (p.x + TW * cam.zoom / 2);
    cam.y += c.clientHeight / 2 - (p.y + TH * cam.zoom / 2 - 40);
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
    const dt = Math.min(0.1, (ts - last) / 1000 || 0.016);
    last = ts;
    S.hour = localHour();
    pumpTicks();
    const sim = 1;
    advance(S.peds, dt * sim);
    advance(S.cars, dt * sim * 1.8 * (1 - S.rain * 0.35));
    updateFires(dt);
        updateEmergencyVehicles(dt);
        spawnMedicalEmergency();
        spawnPoliceCall();
        updateMedicalCalls(dt);
        updatePoliceCalls(dt);
        if (S.boats) {
      S.boats.forEach((b) => {
        b.t += dt * sim * b.speed;
        if (b.t >= 1) {
          b.t = 0;
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          const ok = dirs.filter(([dx, dy]) => {
            const t = regionOf(b.x + dx, b.y + dy);
            return t && t.r.terrain[t.i] === TERRAIN.WATER;
          });
          if (ok.length) { const [dx, dy] = ok[(Math.random() * ok.length) | 0]; b.x += dx; b.y += dy; b.dir = dx === 1 ? 0 : dy === 1 ? 1 : dx === -1 ? 2 : 3; }
          else b.t = Math.random();
        }
      });
    }
    if (S.trains) {
      S.trains.forEach((t) => {
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
                if (reg.road[i]) {
                  if (terr === TERRAIN.WATER) key = "r12_road_bridge_stone";
                  else if (terr === TERRAIN.MOUNTAIN) key = (roadMask(gx, gy) & 3) === 3 ? "c14_switchback_road_w" : "c13_switchback_road_n";
                  else key = ROAD[roadMask(gx, gy)] || "r02_road_straight_ew";
                }
                else if (reg.rail[i]) {
                  key = RAIL[railMask(gx, gy)] || "rail_straight_ew";
                }
                else if (reg.level[i]) key = themeVariant(reg.theme, reg.zone[i], reg.level[i], gx, gy);
        else if (reg.svc[i]) key = SVC_SPRITE[SVC[reg.svc[i]]];
        else if (reg.decor[i] === 1) key = "d05_pine_grove";
        else if (reg.decor[i] === 2) key = "d04_oak_tree_park";
        else if (reg.decor[i] === 0 && terr === TERRAIN.FOREST && hash2(gx + 5, gy + 19) > 0.82) key = hash2(gx, gy) > 0.5 ? "d05_pine_grove" : "d04_oak_tree_park";
        else if (reg.decor[i] === 0 && terr === TERRAIN.FOREST && hash2(gx + 31, gy + 7) > 0.7) key = "d06_cherry_garden";
        else if (reg.decor[i] === 3) key = hash2(gx + 9, gy + 4) > 0.5 ? "gen_hill" : "s11_meadow_rock_outcrop_v2";
        else if (terr === TERRAIN.ROCK) {
          const h = hash2(gx * 5 + 1, gy * 3 + 7);
          key = h > 0.86 ? "l11_volcanic_caldera_island"
              : h > 0.7 ? "s33_slope_var5_snow_moraine"
              : h > 0.5 ? "s09_plateau_level1"
              : h > 0.3 ? "s34_slope_var6_badlands_canyon"
              : "s11_meadow_rock_outcrop_v2";
        }
        else if (reg.decor[i] === 4) key = "s10_meadow_wildflowers_v1";
        if (key && SPRITES[key] && SPRITES[key].complete) {
          getCtx().drawImage(SPRITES[key], s.x, s.y - GROUND_OFFSET * cam.zoom, TW * cam.zoom, TW * cam.zoom);
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

                          // rail: sleepers between depots, then the trains on them
    const railLines = S.links.filter((l) => l.kind === "rail");
    const depots = railLines.length ? railCentres() : [];
    railLines.forEach((l) => {
      const a = depots.find((d) => d.r === l.a), b = depots.find((d) => d.r === l.b);
      if (!a || !b) return;
      const pa = tileToScreen(a.x, a.y), pb = tileToScreen(b.x, b.y);
      const ax = pa.x + zw / 2, ay = pa.y + zh / 2, bx = pb.x + zw / 2, by = pb.y + zh / 2;
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      getCtx().strokeStyle = "rgba(60,52,44,.75)";
      getCtx().lineWidth = Math.max(1.5, 2.4 * cam.zoom);
      getCtx().beginPath(); getCtx().moveTo(ax, ay); getCtx().lineTo(bx, by); getCtx().stroke();
      getCtx().strokeStyle = "rgba(190,175,150,.55)";
      getCtx().lineWidth = Math.max(1, 1.2 * cam.zoom);
      const sleepers = Math.min(60, Math.floor(len / (10 * cam.zoom)));
      for (let i = 1; i < sleepers; i++) {
        const px = ax + ux * (len * i / sleepers), py = ay + uy * (len * i / sleepers);
        getCtx().beginPath();
        getCtx().moveTo(px - uy * 4 * cam.zoom, py + ux * 4 * cam.zoom);
        getCtx().lineTo(px + uy * 4 * cam.zoom, py - ux * 4 * cam.zoom);
        getCtx().stroke();
      }
    });

    (S.trains || []).forEach((tr) => {
      const ax = tileToScreen(tr.ax, tr.ay), bx = tileToScreen(tr.bx, tr.by);
      const x0 = ax.x + zw / 2, y0 = ax.y + zh / 2, x1 = bx.x + zw / 2, y1 = bx.y + zh / 2;
      const ang = Math.atan2(y1 - y0, x1 - x0);
      const t = tr.t;
      const px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
      const L = Math.max(8, 26 * cam.zoom), W = Math.max(3, 7 * cam.zoom);
      const dirSign = tr.dir >= 0 ? 1 : -1;
      for (let car = 0; car < 3; car++) {
        const off = (car - 1) * L * 0.95 * dirSign;
        getCtx().save();
        getCtx().translate(px + Math.cos(ang) * off, py + Math.sin(ang) * off);
        ctx.rotate(ang);
        getCtx().fillStyle = "rgba(0,0,0,.35)";
        getCtx().fillRect(-L / 2, -W / 2 + W * 0.7, L, Math.max(1.5, W * 0.4));
        getCtx().fillStyle = car === 0 ? "#7a3b2e" : "#3f4a52";
        getCtx().fillRect(-L / 2, -W / 2, L, W);
        getCtx().fillStyle = "rgba(210,225,240,.7)";
        getCtx().fillRect(-L * 0.34, -W / 2 + W * 0.18, L * 0.24, W * 0.42);
        if (car === 0) {
          getCtx().fillStyle = "#241d18";
          getCtx().fillRect(-L * 0.05, -W * 1.25, L * 0.14, W * 0.8);
          if (night > 0.2) {
            getCtx().fillStyle = "rgba(255,236,170,.95)";
            getCtx().fillRect(L * 0.4, -W * 0.3, Math.max(1, 1.8 * cam.zoom), Math.max(1, 1.6 * cam.zoom));
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
      getCtx().fillStyle = "rgba(10,25,35,.55)";
      getCtx().beginPath(); getCtx().ellipse(cx, cy + W * 0.4, L * 0.7, W * 0.7, 0, 0, 6.28); getCtx().fill();
      getCtx().fillStyle = b.kind === "barge" ? "#5c4030" : "#e6e0cf";
      getCtx().fillRect(cx - L / 2, cy - W * 0.4, L, W);
      getCtx().fillStyle = "rgba(255,255,255,.6)";
      getCtx().fillRect(cx + L * 0.1, cy - W * 1.1, L * 0.16, W * 0.9);
      if (night > 0.2) { getCtx().fillStyle = "rgba(255,220,140,.9)"; getCtx().fillRect(cx - L * 0.1, cy - W * 0.9, Math.max(1, 1.6 * zoom), Math.max(1, 1.6 * zoom)); }
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
    if (terr === TERRAIN.MOUNTAIN) return t.id === "inspect" || t.id === "road" || t.id === "railTrack";
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
          if (!(r.road[i] || r.rail[i] || r.zone[i] || r.level[i] || r.svc[i])) return false;
          const hadSvc = r.svc[i] !== 0;
          r.road[i] = 0; r.rail[i] = 0; r.zone[i] = 0; r.level[i] = 0; r.bldg[i] = 0; r.svc[i] = 0;
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
          if (r.road[i] || r.zone[i] || r.level[i] || r.svc[i]) return false;
          r.rail[i] = 1; r.zoneDirty = true;
          sfx("place");
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
  let audio = null, audioOn = false, ambient = null;
  function initAudio() {
    if (audio) return audio;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio = new AC();
    return audio;
  }
  // ---------------------------------------------------------------- sound bank
  // Small synthesised set: a tone for pitch, a noise burst for texture.
  let noiseBuf = null;
  function noiseBuffer(ac) {
    if (noiseBuf && noiseBuf.sampleRate === ac.sampleRate) return noiseBuf;
    const len = Math.floor(ac.sampleRate * 0.4);
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    return noiseBuf;
  }
  function sfxGain() { return (OPT.sfx / 100) * (OPT.master / 100); }
  function tone(ac, when, f0, f1, dur, gain, type) {
    gain *= sfxGain();
    if (gain <= 0) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || "triangle";
    o.frequency.setValueAtTime(f0, when);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), when + dur);
    g.gain.setValueAtTime(Math.max(0.0002, gain), when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(when); o.stop(when + dur + 0.03);
  }
  function burst(ac, when, dur, cutoff, gain) {
    gain *= sfxGain();
    if (gain <= 0) return;
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac);
    const filt = ac.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = cutoff;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filt); filt.connect(g); g.connect(ac.destination);
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
      default:
        tone(ac, t0, 880, 880, 0.03, 0.03, "sine");
    }
  }

  // ---------------------------------------------------------------- ambience
  // CC0 city ambience loops from freesound.org and other CC0 sources.
  // No synthesis - just layered loops that blend naturally.
  // Layers:
  //   - distant_city: constant low hum of a city at distance
  //   - traffic_pass: occasional car/truck passing by (bandpassed)
  //   - birds_day: morning/afternoon birdsong
  //   - crickets_night: evening/night insects
  //   - wind: subtle wind in trees
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

  // CC0 audio URLs - these are placeholder URLs, replace with actual hosted files
  // For production, host these files locally or on a CDN
  const AMBIENCE_URLS = {
    distant_city: "assets/audio/ambience/distant_city_loop.mp3",
    traffic_pass: "assets/audio/ambience/traffic_pass.mp3",
    birds_day: "assets/audio/ambience/birds_day_loop.mp3",
    crickets_night: "assets/audio/ambience/crickets_night_loop.mp3",
    wind: "assets/audio/ambience/wind_loop.mp3",
  };

  function loadAmbience(ac) {
    const promises = [];
    Object.keys(AMBIENCE_URLS).forEach((key) => {
      const url = AMBIENCE_URLS[key];
      const src = ac.createBufferSource();
      const gain = ac.createGain();
      gain.connect(ac.destination);
      ambienceGains[key] = gain;

      const promise = fetch(url)
        .then(r => r.arrayBuffer())
        .then(buf => ac.decodeAudioData(buf))
        .then(audioBuf => {
          src.buffer = audioBuf;
          src.loop = key !== "traffic_pass"; // traffic_pass is one-shot
          src.connect(gain);
          ambienceSources[key] = src;
        })
        .catch(err => {
          console.warn("Failed to load ambience:", key, err);
          // Fallback to synthetic if file not found
          ambienceSources[key] = null;
        });
      promises.push(promise);
    });
    return Promise.all(promises);
  }

  function startAmbient() {
    const ac = initAudio(); if (!ac || ambient) return;

    const master = ac.createGain();
    master.gain.value = 0.5 * (OPT.ambience / 100) * (OPT.master / 100);
    master.connect(ac.destination);

    // Rewire gains to go through master
    Object.values(ambienceGains).forEach(g => {
      g.disconnect();
      g.connect(master);
    });

    loadAmbience(ac).then(() => {
      // Start constant layers
      if (ambienceSources.distant_city) {
        ambienceSources.distant_city.start();
      }
      if (ambienceSources.wind) {
        ambienceSources.wind.start();
      }
      // Day/night layers
      updateTimeLayers(ac);

      // Schedule traffic passes
      scheduleTrafficPass(ac);

      // Schedule bird/cricket chirps
      scheduleChirps(ac);

      ambient = { master, ...ambienceSources, ...ambienceGains };
    }).catch(err => {
      console.warn("Ambience load failed, falling back to synthetic:", err);
      startSyntheticAmbient(ac, master);
    });
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
    c.addEventListener("pointerdown", (e) => {
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
    c.addEventListener("contextmenu", (e) => e.preventDefault());
    c.addEventListener("wheel", (e) => {
      e.preventDefault();
      zoomAt(e.offsetX, e.offsetY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    }, { passive: false });
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") { spaceDown = true; c.style.cursor = "grab"; }
      if (e.key === "Escape") { el("modal").classList.add("hidden"); el("inspector").classList.add("hidden"); }
      if (e.key === "q" || e.key === "Q") rotateCamera(-1);
      if (e.key === "e" || e.key === "E") rotateCamera(1);
      if (e.key === "+" || e.key === "=") zoomBy(1.25);
      if (e.key === "-") zoomBy(1 / 1.25);
      if (e.key === "o" || e.key === "O") optionsModal();
    });
    window.addEventListener("keyup", (e) => { if (e.code === "Space") { spaceDown = false; c.style.cursor = "crosshair"; } });
    window.addEventListener("resize", resize);
  }

  function setSpeed() {
    // kept for callers that used to change pace; the city runs on real time now
    return false;
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
              terrain: rle(r.terrain), road: rle(r.road), rail: rle(r.rail), zone: rle(r.zone), level: rle(r.level),
              landmarks: (r.landmarks || []).map(l => l.key + "@" + l.i).join(","),
              bldg: rle(r.bldg), svc: rle(r.svc),
            });
    });
    const data = { v: 3, seed: S.seed, cash: S.cash, day: S.day, unlocked: S.unlocked, regions,
          savedAt: Date.now(), cam: { x: cam.x, y: cam.y, zoom: cam.zoom },
          fireTrucks: fireTrucks.map(t => ({ id: t.id, x: t.x, y: t.y, state: t.state, targetFire: t.targetFire, routeIdx: t.routeIdx, stationId: t.stationId })),
          ambulances: ambulances.map(a => ({ id: a.id, x: a.x, y: a.y, state: a.state, targetCall: a.targetCall, routeIdx: a.routeIdx, clinicId: a.clinicId })),
          policeCars: policeCars.map(c => ({ id: c.id, x: c.x, y: c.y, state: c.state, targetCall: c.targetCall, routeIdx: c.routeIdx, stationId: c.stationId })),
          activeFires: activeFires.map(f => ({ id: f.id, gx: f.gx, gy: f.gy, severity: f.severity, contained: f.contained, damage: f.damage })),
          medicalCalls: medicalCalls.map(m => ({ id: m.id, type: m.type, gx: m.gx, gy: m.gy, status: m.status, assignedAmbulance: m.assignedAmbulance })),
          policeCalls: policeCalls.map(p => ({ id: p.id, type: p.type, gx: p.gx, gy: p.gy, status: p.status, assignedUnit: p.assignedUnit })),
        };
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
      S.seed = d.seed; S.cash = d.cash; S.day = d.day || 0; S.unlocked = d.unlocked || 0;
      S.hour = localHour();   // the sky belongs to the player's clock, not the save
      d.regions.forEach((r) => {
        const reg = makeRegion(r.rx, r.ry);
        reg.claimed = true;
        reg.terrain = unrle(r.terrain, RS * RS);
                reg.road = unrle(r.road, RS * RS);
                reg.rail = unrle(r.rail || new Uint8Array(RS * RS), RS * RS);
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
        reg.value = new Uint8Array(RS * RS);
        reg.zoneDirty = true;
        buildDecor(reg);
        reg.theme = pickTheme(reg.terrain, reg.rx, reg.ry);
        reg.name = (THEMES[reg.theme] || THEMES.oldtown).label;
        S.regions[regionKey(r.rx, r.ry)] = reg;
        recomputeRegion(reg);
      });
      S.peds = []; S.cars = []; S.boats = []; S.smoke = []; S.ferries = []; S.trains = [];
            if (!S.clouds || !S.clouds.length) seedClouds();
            S.homes = null; S.workplaces = null; S.roadSpots = null; S.waterSpots = null;

            // Restore emergency vehicles and calls
            if (d.fireTrucks) d.fireTrucks.forEach(t => { const nt = { ...t, route: null }; fireTrucks.push(nt); });
            if (d.ambulances) d.ambulances.forEach(a => { const nt = { ...a, route: null }; ambulances.push(nt); });
            if (d.policeCars) d.policeCars.forEach(c => { const nt = { ...c, route: null }; policeCars.push(nt); });
            if (d.activeFires) d.activeFires.forEach(f => activeFires.push(f));
            if (d.medicalCalls) d.medicalCalls.forEach(m => medicalCalls.push(m));
            if (d.policeCalls) d.policeCalls.forEach(p => policeCalls.push(p));

            initializeFireTrucks(); initializeAmbulances(); initializePoliceCars();      refreshLinks(); recalcWorld(); updateDemand();
      renderTools(); refreshHud();
      if (d.cam && typeof d.cam.zoom === "number") {
        cam.x = d.cam.x; cam.y = d.cam.y; cam.zoom = clamp(d.cam.zoom, 0.16, 2.4);
        // a saved camera can point at land that is no longer yours
        const c = screenToTile(getCanvas().clientWidth / 2, getCanvas().clientHeight / 2);
        if (!regionOf(c.gx, c.gy)) focusCity();
      } else focusCity();
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
      inp.addEventListener("input", () => {
        const key = inp.dataset.opt;
        OPT[key] = inp.type === "checkbox" ? inp.checked : Number(inp.value);
        const out = document.querySelector('[data-optout="' + key + '"]');
        if (out) out.textContent = inp.value;
        saveOpts();
      });
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

  const GEN_SPRITES = ["gen_mtn_peak", "gen_mtn_snow", "gen_hill", "gen_ridge"];
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
      GEN_SPRITES.forEach((key) => {
        const img = new Image();
        img.src = "assets/tiles/gen/" + key.replace("gen_", "") + ".png";
        SPRITES[key] = img;
        jobs.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
      });
      return Promise.all(jobs);
    });
  }

  window.LC = {
    S, cam, RS, GW, GH, tick, paint, paintLine, claimRegion, regionOf, regionAt, startEvent,
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
    initTTS();
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

  loadSprites().then(() => { buildTextures(); }).then(boot).catch((err) => {
    // a boot failure must say so rather than leave a black canvas
    console.error(err);
    try {
      modal("Lattice City could not start", "<p>" + String(err && err.message || err) + "</p><p>Reload the page; if it repeats, the saved world can be replaced with the New map button.</p>");
    } catch (e) {}
  });
})();
