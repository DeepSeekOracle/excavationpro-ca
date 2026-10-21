/* Lattice Crypt — Complete. A living realm directed by the company.
   Procedural map, free builds, stance triangle, animated clashes.
   Heroes and foes are the cabinet's own art. Skills are a grammar, not a class list. */
(function () {
  "use strict";

  const SAVE = "lygo_lattice_crypt_tale_v1";
  const BOOK = "lygo_lattice_crypt_tale_book_v1";
  const W = 16, H = 10;
  const BEATS = { strike: "weave", weave: "ward", ward: "strike" };
  const COUNTER = { strike: "ward", weave: "strike", ward: "weave" };
  const SEASONS = ["spring", "summer", "autumn", "winter"];
  const BIOME_INK = {
    stone: "#94a3b8", frost: "#7dd3fc", ember: "#fb923c", root: "#4ade80",
    tide: "#22d3ee", gold: "#fbbf24", void: "#c4b5fd", lattice: "#5eead4"
  };

  const HEROES = [
    { id: "kael", name: "Kael", tag: "Gallant Blade", file: "p-kael.jpg", color: "#ef4444", special: "Rend", stance: "strike" },
    { id: "vale", name: "Vale", tag: "Aegis Knight", file: "p-vale.jpg", color: "#22d3ee", special: "Cover", stance: "ward" },
    { id: "orin", name: "Orin", tag: "Black Sigil", file: "p-orin.jpg", color: "#fbbf24", special: "Unwrite", stance: "weave" },
    { id: "nia", name: "Nia", tag: "Path Archer", file: "p-nia.jpg", color: "#4ade80", special: "Dash", stance: "strike" },
    { id: "lyra", name: "Lyra", tag: "Spiral Bard", file: "p-lyra.jpg", color: "#67e8f9", special: "Hymn", stance: "weave" },
    { id: "arkos", name: "Arkos", tag: "Lattice Lancer", file: "p-arkos.jpg", color: "#2dd4bf", special: "Geodesic", stance: "strike" },
    { id: "d9ra", name: "D9ra", tag: "Wolf Monk", file: "p-d9ra.jpg", color: "#f87171", special: "Shockwave", stance: "strike" },
    { id: "srath", name: "Srath", tag: "Shadow Needle", file: "p-srath.jpg", color: "#86efac", special: "Doublespeak", stance: "weave" },
    { id: "kairos", name: "Kairos", tag: "Hour Mage", file: "p-kairos.jpg", color: "#c4b5fd", special: "Right-time", stance: "weave" },
    { id: "justicae", name: "Justicae", tag: "Accord Knight", file: "p-justicae.jpg", color: "#e2e8f0", special: "Fair Plate", stance: "ward" },
    { id: "seidon", name: "Seidon", tag: "Tide Seer", file: "p-seidon.jpg", color: "#22d3ee", special: "Current", stance: "ward" },
    { id: "sancora", name: "Sancora", tag: "Weave Chemist", file: "p-sancora.jpg", color: "#fde68a", special: "Chorus", stance: "weave" },
    { id: "lightfather", name: "Lightfather", tag: "Architect", file: "p-lightfather.jpg", color: "#fbbf24", special: "Seal", stance: "ward" }
  ];

  const SCHOOLS = [
    { id: "strike", name: "Strike", stance: "strike" },
    { id: "ward", name: "Ward", stance: "ward" },
    { id: "weave", name: "Weave", stance: "weave" },
    { id: "hymn", name: "Hymn", stance: "weave" },
    { id: "tide", name: "Tide", stance: "ward" },
    { id: "ember", name: "Ember", stance: "strike" },
    { id: "frost", name: "Frost", stance: "ward" },
    { id: "root", name: "Root", stance: "weave" },
    { id: "void", name: "Void", stance: "weave" },
    { id: "gold", name: "Gold", stance: "strike" },
    { id: "lattice", name: "Lattice", stance: "ward" },
    { id: "beast", name: "Beast", stance: "strike" }
  ];
  const FORMS = [
    { id: "bolt", name: "Bolt", note: "one true line" },
    { id: "arc", name: "Arc", note: "the blow reaches a neighbour" },
    { id: "field", name: "Field", note: "a shell on the company" },
    { id: "mark", name: "Mark", note: "a wound that keeps" },
    { id: "hymn", name: "Hymn", note: "the well answers" },
    { id: "step", name: "Step", note: "already aside" },
    { id: "bond", name: "Bond", note: "the company strikes as one" },
    { id: "rite", name: "Rite", note: "you name their next stance" }
  ];
  const RANK_NAME = { 1: "Spark", 2: "Seal", 3: "Crown" };

  const MARKS = [
    { id: "bare", name: "Bare", text: "No ornament. The face is the claim." },
    { id: "cloak", name: "Road Cloak", text: "Travel-stained. Ward holds a little longer.", ward: 1 },
    { id: "helm", name: "Accord Helm", text: "A thicker well.", hp: 10 },
    { id: "sigil", name: "Named Sigil", text: "One more point of focus.", focus: 1 },
    { id: "veil", name: "Night Veil", text: "Weave cuts cleaner.", weave: 2 },
    { id: "crown", name: "Thin Crown", text: "Strike lands heavier.", strike: 2 }
  ];

  const GEAR = [
    { id: "shardblade", slot: "hand", name: "Shard Blade", power: 3, stance: "strike", text: "A tooth of the lock." },
    { id: "fanbow", slot: "hand", name: "Fan Bow", power: 2, stance: "strike", text: "Three lines, one aim." },
    { id: "needle", slot: "hand", name: "Shadow Needle", power: 2, stance: "weave", text: "Already gone when it lands." },
    { id: "censer", slot: "hand", name: "Chorus Censer", power: 2, stance: "weave", text: "Hymns travel farther." },
    { id: "comet", slot: "hand", name: "Comet Spear", power: 4, stance: "strike", text: "The shortest true line." },
    { id: "tideglass", slot: "hand", name: "Tide Glass", power: 2, stance: "ward", text: "The current answers." },
    { id: "aegis", slot: "plate", name: "Aegis Plate", power: 1, hp: 16, stance: "ward", text: "She stands so others move." },
    { id: "wolfhide", slot: "plate", name: "Wolf Hide", power: 2, hp: 6, stance: "strike", text: "Fists first." },
    { id: "mail", slot: "plate", name: "Fair Mail", power: 1, hp: 14, stance: "ward", text: "The plate does not play favourites." },
    { id: "weavewrap", slot: "plate", name: "Weave Wrap", power: 1, hp: 8, stance: "weave", text: "Cloth that remembers." },
    { id: "rime", slot: "plate", name: "Rime Coat", power: 1, hp: 10, stance: "ward", text: "Winter stays outside." },
    { id: "core", slot: "relic", name: "Seal Core", power: 3, text: "A heart of the lock." },
    { id: "phial", slot: "relic", name: "Chorus Phial", power: 1, focus: 1, text: "One more verse." },
    { id: "lantern", slot: "relic", name: "Name Lantern", power: 1, text: "Fog yields a step." },
    { id: "ring", slot: "relic", name: "Accord Ring", power: 2, text: "The company counts as one." },
    { id: "hourkey", slot: "relic", name: "Hour Key", power: 2, text: "A second, spent like a key." },
    { id: "thorn", slot: "relic", name: "Thorn Relic", power: 2, stance: "strike", text: "What touches you pays." },
    { id: "well", slot: "relic", name: "Pocket Well", power: 0, hp: 12, text: "A deeper drink." }
  ];

  const FOES = [
    { id: "wraith", name: "Wraith", hp: 26, power: 7, file: "wraith" },
    { id: "brute", name: "Brute", hp: 34, power: 8, file: "brute" },
    { id: "imp", name: "Imp", hp: 24, power: 8, file: "imp" },
    { id: "hurler", name: "Hurler", hp: 30, power: 9, file: "hurler" },
    { id: "shade", name: "Shade", hp: 28, power: 8, file: "shade" },
    { id: "thief", name: "Thief", hp: 22, power: 6, file: "thief" },
    { id: "drain", name: "Drain", hp: 40, power: 7, file: "drain" },
    { id: "gate", name: "Gate-Warden", hp: 56, power: 11, file: "gate", boss: 1 },
    { id: "crown", name: "Frost-Crown", hp: 58, power: 11, file: "crown", boss: 1 },
    { id: "smith", name: "Ember-Smith", hp: 62, power: 12, file: "smith", boss: 1 },
    { id: "heartboss", name: "Root-Heart", hp: 60, power: 11, file: "heartboss", boss: 1 },
    { id: "levi", name: "Tide-Levi", hp: 64, power: 12, file: "levi", boss: 1 },
    { id: "tithe", name: "Gold-Tithe", hp: 54, power: 10, file: "tithe", boss: 1 },
    { id: "unnamer", name: "The Unnamer", hp: 70, power: 12, file: "unnamer", boss: 1 },
    { id: "lock", name: "The Lock", hp: 78, power: 13, file: "lock", boss: 1 }
  ];

  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c];
    });
  }
  function clash(a, b) {
    if (a === b) return "tie";
    if (BEATS[a] === b) return "win";
    return "lose";
  }
  function heroById(id) { return HEROES.filter(function (h) { return h.id === id; })[0] || HEROES[0]; }
  function skillById(id) {
    if (!id) return null;
    for (let i = 0; i < SKILLS.length; i++) if (SKILLS[i].id === id) return SKILLS[i];
    return null;
  }
  function gearById(id) {
    if (!id) return null;
    for (let i = 0; i < GEAR.length; i++) if (GEAR[i].id === id) return GEAR[i];
    return null;
  }
  function markById(id) {
    for (let i = 0; i < MARKS.length; i++) if (MARKS[i].id === id) return MARKS[i];
    return MARKS[0];
  }
  function foeById(id) {
    for (let i = 0; i < FOES.length; i++) if (FOES[i].id === id) return FOES[i];
    return FOES[0];
  }

  function buildSkills() {
    const list = [];
    SCHOOLS.forEach(function (school, si) {
      FORMS.forEach(function (form) {
        for (let rank = 1; rank <= 3; rank++) {
          const power = Math.round((7 + (si % 4)) * (rank === 1 ? 1 : rank === 2 ? 1.35 : 1.75));
          list.push({
            id: school.id + "-" + form.id + "-" + rank,
            name: RANK_NAME[rank] + " " + school.name + " " + form.name,
            school: school.id,
            schoolName: school.name,
            form: form.id,
            rank: rank,
            stance: school.stance,
            power: power,
            cost: rank,
            sig: false,
            text: RANK_NAME[rank] + " " + school.name.toLowerCase() + " " + form.name.toLowerCase() + " — " + form.note + ". Plays as " + school.stance + "."
          });
        }
      });
    });
    HEROES.forEach(function (h) {
      [2, 3].forEach(function (rank) {
        list.push({
          id: "sig-" + h.id + "-" + rank,
          name: (rank === 3 ? "Crown " : "") + h.name + " " + h.special,
          school: "sig",
          schoolName: h.name,
          form: h.stance === "weave" ? "hymn" : h.stance === "ward" ? "field" : "bolt",
          rank: rank,
          stance: h.stance,
          power: rank === 3 ? 18 : 12,
          cost: rank === 3 ? 3 : 2,
          sig: true,
          hero: h.id,
          text: h.name + " remembers " + h.special + ". Any warden may learn it. Plays as " + h.stance + "."
        });
      });
    });
    return list;
  }
  const SKILLS = buildSkills();
  if (SKILLS.length < 300) throw new Error("Complete skill book short: " + SKILLS.length);
  (function () {
    const ids = {};
    SKILLS.forEach(function (s) {
      if (ids[s.id]) throw new Error("duplicate skill " + s.id);
      ids[s.id] = 1;
    });
  })();

  function maxHp(m) {
    const mk = markById(m.mark);
    let hp = 46 + (m.lv || 1) * 10 + (mk.hp || 0);
    ["hand", "plate", "relic"].forEach(function (slot) {
      const g = gearById(m[slot]);
      if (g && g.hp) hp += g.hp;
    });
    return hp;
  }
  function maxFocus(m) {
    const mk = markById(m.mark);
    let f = 3 + (mk.focus || 0);
    const g = gearById(m.relic);
    if (g && g.focus) f += g.focus;
    return f;
  }
  function powerOf(m) {
    const mk = markById(m.mark);
    let p = 6 + (m.lv || 1) * 2;
    ["hand", "plate", "relic"].forEach(function (slot) {
      const g = gearById(m[slot]);
      if (g) p += g.power || 0;
    });
    if (m.plan && mk.strike && m.plan.stance === "strike") p += mk.strike;
    if (m.plan && mk.ward && m.plan.stance === "ward") p += mk.ward;
    if (m.plan && mk.weave && m.plan.stance === "weave") p += mk.weave;
    return p;
  }

  function genWorld(seed) {
    const R = rng(seed);
    const biomes = ["stone", "frost", "ember", "root", "tide", "gold", "void", "lattice"];
    const nodes = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const biome = biomes[(x + y * 2 + ((R() * 2) | 0)) % biomes.length];
        nodes.push({
          x: x, y: y, biome: biome, kind: "wild",
          name: biome.charAt(0).toUpperCase() + biome.slice(1) + " reach",
          seen: false, threat: 0, blight: false, cleared: false, owner: ""
        });
      }
    }
    const used = new Set();
    function claim() {
      for (let n = 0; n < 100; n++) {
        const x = (R() * W) | 0, y = (R() * H) | 0;
        const id = y * W + x;
        if (used.has(id)) continue;
        let ok = true;
        used.forEach(function (u) {
          const ux = u % W, uy = (u / W) | 0;
          if (Math.abs(ux - x) + Math.abs(uy - y) < 2) ok = false;
        });
        if (!ok) continue;
        used.add(id);
        return nodes[id];
      }
      return nodes[(R() * nodes.length) | 0];
    }
    const townNames = ["Gatehold", "Rime Market", "Ember Quay", "Rootmoot"];
    const towns = [];
    townNames.forEach(function (name, i) {
      const node = claim();
      node.kind = "town";
      node.name = name;
      node.owner = name;
      towns.push({ id: "t" + i, name: name, x: node.x, y: node.y, prosperity: 3, rel: {}, war: {} });
    });
    towns.forEach(function (a) {
      towns.forEach(function (b) {
        if (a === b || a.rel[b.id] != null) return;
        const rel = (R() * 3 | 0) - 1;
        a.rel[b.id] = rel;
        b.rel[a.id] = rel;
      });
    });
    [
      ["ruin", "First Tooth"], ["ruin", "Unwritten Stair"], ["ruin", "Tithe Vault"],
      ["obelisk", "Hour Needle"], ["obelisk", "Chorus Stone"], ["obelisk", "Lock Spire"],
      ["evil", "Drain Heart"], ["evil", "Name Pit"], ["evil", "Unspool Nest"],
      ["cave", "Infinite Stair"], ["cave", "Quiet Deep"]
    ].forEach(function (pair) {
      const node = claim();
      node.kind = pair[0];
      node.name = pair[1];
      if (pair[0] === "evil") node.threat = 2;
    });
    const start = towns[0];
    const home = nodeAt(nodes, start.x, start.y);
    home.seen = true;
    neighborsOf(nodes, home).forEach(function (n) { n.seen = true; });
    return {
      seed: seed >>> 0,
      day: 1,
      hour: 8,
      season: 0,
      weather: "clear",
      gold: 24,
      company: "The Accord",
      party: [],
      stash: [],
      chronicle: [],
      rumors: [],
      nodes: nodes,
      towns: towns,
      x: start.x,
      y: start.y,
      cave: null,
      shop: [],
      pending: null,
      battle: null
    };
  }
  function nodeAt(nodes, x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    return nodes[y * W + x];
  }
  function neighborsOf(nodes, n) {
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(function (d) {
      return nodeAt(nodes, n.x + d[0], n.y + d[1]);
    }).filter(Boolean);
  }
  function here() { return nodeAt(state.nodes, state.x, state.y); }
  function night() { return state.hour < 6 || state.hour >= 20; }
  function phaseName() {
    if (state.hour < 6) return "night";
    if (state.hour < 17) return "day";
    if (state.hour < 20) return "dusk";
    return "night";
  }

  let state = null;
  let screen = "charter";
  let draft = null;
  let toast = "";
  let saveLabel = "";
  let screenBeforeSaves = "realm";
  let root = null;
  let frame = 0;
  let frameTimer = 0;
  let busy = false;

  function freshDraft() {
    const builds = {};
    HEROES.forEach(function (h) {
      builds[h.id] = { name: h.name, mark: "bare", skills: [] };
    });
    return { company: "The Accord", ids: ["kael", "vale", "orin", "nia"], focus: "kael", builds: builds };
  }
  function defaultSkills(hero) {
    const want = [
      ["strike", "bolt"],
      ["ward", "field"],
      ["weave", "hymn"],
      [hero.stance === "ward" ? "lattice" : hero.stance === "weave" ? "hymn" : "ember", "bolt"]
    ];
    const ids = [];
    want.forEach(function (pair) {
      const s = SKILLS.filter(function (x) { return x.school === pair[0] && x.form === pair[1] && x.rank === 1; })[0];
      if (s && ids.indexOf(s.id) < 0) ids.push(s.id);
    });
    const sig = SKILLS.filter(function (x) { return x.sig && x.hero === hero.id && x.rank === 2; })[0];
    if (sig) ids[3] = sig.id;
    return ids.slice(0, 4);
  }
  function makeMember(id, build) {
    const h = heroById(id);
    const b = build || { name: h.name, mark: "bare", skills: [] };
    const known = (b.skills && b.skills.length ? b.skills : defaultSkills(h)).slice(0, 4);
    const m = {
      id: id,
      name: String(b.name || h.name).slice(0, 16),
      mark: b.mark || "bare",
      known: known.slice(),
      equipped: known.slice(0, 4),
      hand: null, plate: null, relic: null,
      lv: 1, xp: 0, bond: {}
    };
    m.max = maxHp(m);
    m.hp = m.max;
    m.maxFocus = maxFocus(m);
    m.focus = m.maxFocus;
    return m;
  }
  function retune(m) {
    const hpRatio = m.max ? m.hp / m.max : 1;
    m.max = maxHp(m);
    m.hp = Math.max(1, Math.min(m.max, Math.round(m.max * hpRatio)));
    m.maxFocus = maxFocus(m);
    m.focus = Math.min(m.maxFocus, m.focus == null ? m.maxFocus : m.focus);
  }

  function storage() {
    try { return typeof localStorage === "undefined" ? null : localStorage; } catch (_) { return null; }
  }
  function validRun(data) {
    return !!(data && data.nodes && data.nodes.length && data.party && data.party.length);
  }
  function readBook() {
    const box = storage();
    if (!box) return [];
    let slots = [];
    try {
      const raw = JSON.parse(box.getItem(BOOK) || "[]");
      if (Array.isArray(raw)) slots = raw;
    } catch (_) { slots = []; }
    slots = slots.filter(function (slot) { return slot && slot.id && validRun(slot.state); });
    if (!slots.length) {
      try {
        const legacy = JSON.parse(box.getItem(SAVE) || "null");
        if (validRun(legacy)) {
          slots = [{
            id: "auto", kind: "auto", name: legacy.company || "Autosave",
            at: "", day: legacy.day || 1, company: legacy.company || "",
            where: "", screen: "realm", state: legacy
          }];
          box.setItem(BOOK, JSON.stringify(slots));
        }
      } catch (_) {}
    }
    return slots;
  }
  function writeBook(slots) {
    const box = storage();
    if (!box) return false;
    const auto = slots.filter(function (s) { return s.kind === "auto"; }).slice(0, 1);
    const manuals = slots.filter(function (s) { return s.kind !== "auto"; }).slice(0, 8);
    try {
      box.setItem(BOOK, JSON.stringify(auto.concat(manuals)));
      return true;
    } catch (_) { return false; }
  }
  function save() {
    if (!state || !validRun(state)) return false;
    return writeSlot(state.company || "Autosave", "auto", "auto");
  }
  function writeSlot(name, kind, replaceId) {
    if (!state || !validRun(state)) return false;
    let copy;
    try { copy = JSON.parse(JSON.stringify(state)); } catch (_) { return false; }
    const node = here();
    const slot = {
      id: replaceId || (kind === "auto" ? "auto" : ("s" + Date.now().toString(36))),
      kind: kind === "auto" ? "auto" : "manual",
      name: String(name || copy.company || "Company").slice(0, 24),
      at: new Date().toISOString(),
      day: copy.day || 1,
      company: copy.company || "",
      where: node ? node.name : "",
      screen: resumeScreen(),
      state: copy
    };
    const slots = readBook().filter(function (s) { return s.id !== slot.id; });
    slots.unshift(slot);
    const ok = writeBook(slots);
    const box = storage();
    if (ok && box && slot.kind === "auto") {
      try { box.setItem(SAVE, JSON.stringify(copy)); } catch (_) {}
    }
    return ok;
  }
  function resumeScreen() {
    let resume = screen === "saves" ? (screenBeforeSaves || "realm") : screen;
    if (resume === "charter" || resume === "saves" || resume === "book") resume = "realm";
    if (resume === "battle" && !(state && state.battle)) resume = "realm";
    if (resume === "grow" && !(state && state.pending)) resume = "node";
    return resume;
  }
  function loadSlot(id) {
    const slot = readBook().filter(function (s) { return s.id === id; })[0];
    if (!slot) return null;
    let copy;
    try { copy = JSON.parse(JSON.stringify(slot.state)); } catch (_) { return null; }
    return { slot: slot, state: copy };
  }
  function dropSlot(id) {
    const slots = readBook().filter(function (s) { return s.id !== id; });
    writeBook(slots);
    if (id === "auto") {
      const box = storage();
      if (box) { try { box.removeItem(SAVE); } catch (_) {} }
    }
  }
  function loadState() {
    const auto = readBook().filter(function (s) { return s.kind === "auto"; })[0] || readBook()[0];
    return auto ? auto.state : null;
  }

  function logLine(t) {
    state.chronicle.unshift(t);
    state.chronicle = state.chronicle.slice(0, 48);
  }
  function townByName(name) {
    return state.towns.filter(function (t) { return t.name === name; })[0] || null;
  }
  function politicsLine() {
    const bits = [];
    const towns = state.towns;
    for (let i = 0; i < towns.length; i++) {
      for (let j = i + 1; j < towns.length; j++) {
        const a = towns[i], b = towns[j];
        if (a.war[b.id]) bits.push(a.name + " at war with " + b.name);
        else if ((a.rel[b.id] || 0) >= 2) bits.push(a.name + " allied with " + b.name);
      }
    }
    return bits.length ? bits.join(" · ") : "The towns are watching each other.";
  }
  function dawn() {
    state.day++;
    state.season = ((state.day / 12) | 0) % 4;
    const R = rng((state.seed ^ (state.day * 997)) >>> 0);
    const weathers = ["clear", "clear", "rain", "fog", state.season === 3 ? "fog" : "clear"];
    state.weather = weathers[(R() * weathers.length) | 0];
    state.towns.forEach(function (a) {
      state.towns.forEach(function (b) {
        if (a.id >= b.id) return;
        let rel = a.rel[b.id] || 0;
        rel += (R() < 0.5 ? -1 : 1) * (R() < 0.35 ? 1 : 0);
        rel = Math.max(-3, Math.min(3, rel));
        a.rel[b.id] = rel;
        b.rel[a.id] = rel;
        if (rel <= -2 && !a.war[b.id]) {
          a.war[b.id] = 1;
          b.war[a.id] = 1;
          logLine(a.name + " declares war on " + b.name + ".");
        }
        if (rel >= 2 && a.war[b.id]) {
          delete a.war[b.id];
          delete b.war[a.id];
          logLine(a.name + " and " + b.name + " strike a peace.");
        }
      });
    });
    state.towns.forEach(function (t) {
      const warring = Object.keys(t.war).length > 0;
      const allied = state.towns.some(function (o) { return o !== t && (t.rel[o.id] || 0) >= 2 && !t.war[o.id]; });
      if (warring) t.prosperity = Math.max(0, t.prosperity - 1);
      else if (allied) t.prosperity = Math.min(8, t.prosperity + 1);
    });
    state.nodes.forEach(function (n) {
      if (n.kind === "evil" && !n.cleared) n.threat = (n.threat || 0) + 1;
    });
    state.nodes.forEach(function (n) {
      if (n.kind !== "wild") return;
      const hot = neighborsOf(state.nodes, n).some(function (m) {
        return m.kind === "evil" && !m.cleared && m.threat >= 3;
      });
      if (hot && !n.blight) {
        n.blight = true;
        logLine(n.name + " blights. An Evil Center is feeding it.");
      }
      if (!hot) n.blight = false;
    });
    rollShop(R);
    rollRumors(R);
    logLine("Day " + state.day + " · " + SEASONS[state.season] + " · " + state.weather + ".");
  }
  function rollShop(R) {
    const owned = {};
    state.stash.forEach(function (id) { owned[id] = 1; });
    state.party.forEach(function (p) {
      ["hand", "plate", "relic"].forEach(function (s) { if (p[s]) owned[p[s]] = 1; });
    });
    const pool = GEAR.filter(function (g) { return !owned[g.id]; });
    state.shop = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const g = pool.splice((R() * pool.length) | 0, 1)[0];
      state.shop.push({ id: g.id, price: 22 + g.power * 14 + (g.hp || 0) });
    }
  }
  function rollRumors(R) {
    state.rumors = [];
    const evils = state.nodes.filter(function (n) { return n.kind === "evil" && !n.cleared; });
    const ruins = state.nodes.filter(function (n) { return n.kind === "ruin" && !n.cleared; });
    const ob = state.nodes.filter(function (n) { return n.kind === "obelisk" && !n.cleared; });
    if (evils.length) {
      const n = evils[(R() * evils.length) | 0];
      state.rumors.push({ x: n.x, y: n.y, text: n.name + " is feeding the wilds. Break it or bargain." });
    }
    if (ruins.length) {
      const n = ruins[(R() * ruins.length) | 0];
      state.rumors.push({ x: n.x, y: n.y, text: n.name + " still holds a relic. Delve, or only map it." });
    }
    if (ob.length) {
      const n = ob[(R() * ob.length) | 0];
      state.rumors.push({ x: n.x, y: n.y, text: n.name + " will teach a Crown if you offer a skill you already know." });
    }
  }
  function passHours(n) {
    state.hour += n;
    let wrapped = 0;
    while (state.hour >= 24) {
      state.hour -= 24;
      dawn();
      wrapped++;
      if (wrapped > 3) break;
    }
  }
  function travelCost() {
    let c = 5;
    if (night()) c += 3;
    if (state.weather === "rain" || state.weather === "fog") c += 2;
    if (SEASONS[state.season] === "winter") c += 1;
    return c;
  }

  function scaleHp(base, node) {
    const n = Math.max(1, state.party.length);
    const day = 1 + (state.day || 1) * 0.04;
    const threat = 1 + ((node && node.threat) || 0) * 0.08;
    const nightMul = night() ? 1.12 : 1;
    return Math.max(8, Math.round(base * (0.7 + 0.18 * n) * day * threat * nightMul));
  }
  function packFor(node) {
    const R = rng((state.seed ^ (node.x * 50 + node.y) ^ (state.day * 13)) >>> 0);
    function pick(pool) { return pool[(R() * pool.length) | 0]; }
    const fodder = ["wraith", "brute", "imp", "hurler", "shade", "thief"];
    const list = [];
    const push = function (id, boss) {
      const def = foeById(id);
      list.push({
        uid: "f" + list.length + "-" + id,
        kind: id,
        name: def.name,
        file: def.file,
        hp: scaleHp(def.hp, node) + (boss ? 10 : 0),
        max: 0,
        power: def.power + (boss ? 3 : 0) + ((node && node.blight) ? 2 : 0),
        boss: !!boss,
        bleed: 0,
        stance: "strike",
        lock: null
      });
    };
    if (node.kind === "evil") {
      push(pick(["lock", "unnamer", "heartboss", "levi"]), true);
      push(pick(fodder));
      push(pick(fodder));
      if ((node.threat || 0) >= 4) push(pick(fodder));
    } else if (node.kind === "ruin") {
      push(pick(["gate", "crown", "smith", "tithe"]), true);
      push(pick(fodder));
    } else if (node.kind === "obelisk") {
      push(pick(["shade", "drain", "hurler"]));
      push("imp");
    } else if (node.kind === "cave") {
      const depth = (state.cave && state.cave.depth) || 1;
      push(pick(fodder));
      push(pick(fodder));
      if (depth >= 3) push(pick(["drain", "shade", "brute"]));
      if (depth % 5 === 0) push(pick(["gate", "smith", "levi"]), true);
    } else if (node.kind === "town") {
      push("brute");
      push("imp");
      push(pick(fodder));
    } else {
      push(pick(fodder));
      if (node.blight || night()) push(pick(fodder));
      if (node.blight && night()) push(pick(fodder));
    }
    list.forEach(function (f) { f.max = f.hp; });
    return list;
  }

  function startBattle(node, reason) {
    state.battle = {
      nodeX: node.x, nodeY: node.y, reason: reason || node.kind,
      foes: packFor(node),
      round: 1,
      log: [reason || ("The " + node.name + " answers.")],
      choice: {},
      lastStance: null
    };
    state.party.forEach(function (p) {
      state.battle.choice[p.id] = { stance: "strike", skill: p.equipped[0] || "" };
    });
    screen = "battle";
    busy = false;
    render();
  }

  function skillOk(m, id) {
    const s = skillById(id);
    if (!s) return false;
    if (m.equipped.indexOf(s.id) < 0 && m.known.indexOf(s.id) < 0) return false;
    return m.focus >= s.cost;
  }

  function previewRound() {
    const heroes = state.party.filter(function (p) { return p.hp > 0; });
    const foes = state.battle.foes.filter(function (f) { return f.hp > 0; });
    const events = [];
    foes.forEach(function (f) {
      if (f.bleed > 0) {
        events.push({ kind: "bleed", foe: f.uid, amount: 4 + f.bleed });
      }
    });
    const tally = { strike: 0, ward: 0, weave: 0 };
    heroes.forEach(function (h) {
      const ch = state.battle.choice[h.id] || { stance: "strike", skill: "" };
      const sk = skillById(ch.skill);
      h.plan = {
        stance: ch.stance || "strike",
        skill: sk && h.focus >= sk.cost && h.equipped.indexOf(sk.id) >= 0 ? sk.id : null
      };
      tally[h.plan.stance]++;
    });
    const last = state.battle.lastStance;
    foes.forEach(function (f) {
      if (f.lock) { f.stance = f.lock; f.lock = null; return; }
      if (last && Math.random() < 0.62) f.stance = COUNTER[last];
      else f.stance = ["strike", "ward", "weave"][(Math.random() * 3) | 0];
    });
    state.battle.lastStance = Object.keys(tally).sort(function (a, b) { return tally[b] - tally[a]; })[0];
    if (!foes.length || !heroes.length) return events;
    const pairs = [];
    heroes.forEach(function (h, i) { pairs.push([h, foes[i % foes.length]]); });
    foes.forEach(function (f, i) {
      if (i >= heroes.length) pairs.push([heroes[i % heroes.length], f]);
    });
    const spent = {};
    pairs.forEach(function (pair) {
      const h = pair[0], f = pair[1];
      if (h.hp <= 0 || f.hp <= 0) return;
      const sk = skillById(h.plan.skill);
      const adv = clash(h.plan.stance, f.stance);
      let dmg = powerOf(h) + (sk ? sk.power : 0);
      let back = f.power + 4;
      if (adv === "win") dmg *= 1.45;
      else if (adv === "tie") { dmg *= 0.75; back *= 0.75; }
      else { dmg *= 0.55; back *= 1.15; }
      if (h.plan.stance === "ward") back *= 0.55;
      if (f.stance === "ward") dmg *= 0.55;
      if (h.guard) { back *= 0.8; h.guard = false; }
      const notes = [];
      if (sk && sk.form === "step" && Math.random() < 0.55) { back = 0; notes.push("steps aside"); }
      if (sk && sk.form === "bond") {
        const linked = state.party.some(function (o) {
          return o !== h && o.hp > 0 && (h.bond[o.id] || 0) >= 2 && o.plan && o.plan.stance === h.plan.stance;
        });
        if (linked) { dmg *= 1.25; notes.push("bond"); }
      }
      if (state.weather === "rain" && h.plan.stance === "weave") dmg *= 1.1;
      if (state.weather === "fog" && Math.random() < 0.12) { dmg *= 0.5; notes.push("fog"); }
      if (SEASONS[state.season] === "winter" && f.kind === "crown") back *= 0.85;
      dmg = Math.max(1, Math.round(dmg));
      back = Math.max(0, Math.round(back));
      const ev = {
        kind: "hit",
        hero: h.id,
        foe: f.uid,
        dmg: dmg,
        back: back,
        adv: adv,
        skill: sk ? sk.id : "",
        notes: notes,
        hs: h.plan.stance,
        fs: f.stance
      };
      if (sk && sk.form === "arc") ev.arc = Math.max(1, Math.round(dmg * 0.5));
      if (sk && sk.form === "mark") ev.mark = 2;
      if (sk && sk.form === "hymn") ev.hymn = Math.max(4, Math.round((sk.power || 8) * 0.85));
      if (sk && sk.form === "field") ev.field = 1;
      if (sk && sk.form === "rite" && adv !== "lose") ev.rite = BEATS[h.plan.stance];
      if (sk && !spent[h.id]) { ev.cost = sk.cost; spent[h.id] = 1; }
      events.push(ev);
    });
    return events;
  }
  function applyEvent(ev) {
    if (ev.kind === "bleed") {
      const f = foeUid(ev.foe);
      if (f && f.hp > 0) {
        f.hp = Math.max(0, f.hp - ev.amount);
        f.bleed = Math.max(0, (f.bleed || 0) - 1);
        state.battle.log.unshift(f.name + " bleeds " + ev.amount + ".");
      }
      return;
    }
    const h = member(ev.hero);
    const f = foeUid(ev.foe);
    if (!h || !f) return;
    if (ev.cost) h.focus = Math.max(0, h.focus - ev.cost);
    f.hp = Math.max(0, f.hp - ev.dmg);
    h.hp = Math.max(0, h.hp - ev.back);
    if (ev.arc) {
      const other = state.battle.foes.filter(function (o) { return o.uid !== f.uid && o.hp > 0; })[0];
      if (other) other.hp = Math.max(0, other.hp - ev.arc);
    }
    if (ev.mark && f.hp > 0) f.bleed = (f.bleed || 0) + ev.mark;
    if (ev.hymn) {
      const ally = state.party.filter(function (p) { return p.hp > 0; }).sort(function (a, b) { return a.hp / a.max - b.hp / b.max; })[0];
      if (ally) ally.hp = Math.min(ally.max, ally.hp + ev.hymn);
    }
    if (ev.field) state.party.forEach(function (p) { if (p.hp > 0) p.guard = true; });
    if (ev.rite && f.hp > 0) f.lock = ev.rite;
    const sk = skillById(ev.skill);
    const how = ev.adv === "win" ? "breaks" : ev.adv === "lose" ? "is caught by" : "clashes with";
    state.battle.log.unshift(
      h.name + " " + ev.hs + (sk ? " · " + sk.name : "") + " " + how + " " + f.name + " " + ev.fs +
      " — " + ev.dmg + " / " + ev.back + (ev.notes && ev.notes.length ? " · " + ev.notes.join(", ") : "") + "."
    );
  }
  function member(id) { return state.party.filter(function (p) { return p.id === id; })[0]; }
  function foeUid(uid) { return state.battle.foes.filter(function (f) { return f.uid === uid; })[0]; }

  function endBattle(won) {
    const node = nodeAt(state.nodes, state.battle.nodeX, state.battle.nodeY);
    state.battle = null;
    busy = false;
    if (!won) {
      const loss = Math.min(state.gold, 8 + state.day);
      state.gold -= loss;
      const town = state.towns.slice().sort(function (a, b) { return b.prosperity - a.prosperity; })[0];
      state.party.forEach(function (p) {
        p.hp = Math.max(1, Math.round(p.max * 0.35));
        p.focus = p.maxFocus;
      });
      if (town) { state.x = town.x; state.y = town.y; }
      logLine("The company falls and is dragged back. Lost " + loss + " gold.");
      if (state.cave) state.cave = null;
      screen = "node";
      save();
      render();
      return;
    }
    const gold = 8 + ((Math.random() * 10) | 0) + (node && node.kind === "evil" ? 14 : 0);
    state.gold += gold;
    state.party.forEach(function (p) {
      if (p.hp <= 0) return;
      p.xp += 8 + (node && node.kind === "evil" ? 6 : 0);
      p.focus = Math.min(p.maxFocus, p.focus + 1);
      state.party.forEach(function (o) {
        if (o !== p && o.hp > 0) p.bond[o.id] = Math.min(5, (p.bond[o.id] || 0) + 1);
      });
    });
    if (node && (node.kind === "evil" || node.kind === "ruin" || node.kind === "town")) {
      if (node.kind !== "town") node.cleared = true;
      if (node.kind === "evil") {
        node.threat = 0;
        neighborsOf(state.nodes, node).forEach(function (n) { n.blight = false; });
        state.towns.forEach(function (t) { t.prosperity = Math.min(8, t.prosperity + 1); });
        logLine(node.name + " is broken. The towns breathe.");
      }
    }
    if (node && node.kind === "cave" && state.cave) {
      state.cave.depth += 1;
      logLine("Depth " + state.cave.depth + " of " + node.name + ".");
    }
    const gearDrop = (node && (node.kind === "ruin" || node.kind === "evil" || (state.cave && state.cave.depth % 4 === 0))) ? dropGear() : null;
    if (gearDrop) {
      state.stash.push(gearDrop);
      logLine("The company lifts " + gearById(gearDrop).name + ".");
    }
    logLine("Won. +" + gold + " gold.");
    const grew = state.party.filter(function (p) { return p.hp > 0 && p.xp >= p.lv * 24; })[0];
    if (grew) {
      grew.xp -= grew.lv * 24;
      grew.lv += 1;
      retune(grew);
      grew.hp = grew.max;
      state.pending = { hero: grew.id, choices: offerSkills(grew) };
      screen = "grow";
    } else screen = "node";
    save();
    render();
  }
  function dropGear() {
    const owned = {};
    state.stash.forEach(function (id) { owned[id] = 1; });
    state.party.forEach(function (p) { ["hand", "plate", "relic"].forEach(function (s) { if (p[s]) owned[p[s]] = 1; }); });
    const pool = GEAR.filter(function (g) { return !owned[g.id]; });
    if (!pool.length) return null;
    return pool[(Math.random() * pool.length) | 0].id;
  }
  function offerSkills(m) {
    const R = rng((state.seed ^ (m.lv * 131) ^ state.day) >>> 0);
    const known = {};
    m.known.forEach(function (id) { known[id] = 1; });
    const pool = SKILLS.filter(function (s) { return !known[s.id] && s.rank <= Math.min(3, 1 + ((m.lv / 2) | 0)); });
    const out = [];
    while (out.length < 3 && pool.length) {
      const s = pool.splice((R() * pool.length) | 0, 1)[0];
      out.push(s.id);
    }
    return out;
  }

  function wait(ms) {
    if (state && state.skip) return Promise.resolve();
    return new Promise(function (res) { setTimeout(res, ms); });
  }
  async function playRound() {
    if (busy || !state || !state.battle || screen !== "battle") return;
    busy = true;
    const evs = previewRound();
    for (let i = 0; i < evs.length; i++) {
      if (!state || !state.battle) { busy = false; return; }
      applyEvent(evs[i]);
      state.battle.round += (i === 0 ? 1 : 0);
      const ev = evs[i];
      if (screen === "battle") {
        render();
        if (ev.kind === "hit") {
          const a = document.querySelector("[data-unit='h-" + ev.hero + "']");
          const b = document.querySelector("[data-unit='f-" + ev.foe + "']");
          if (a) a.classList.add(ev.hs === "ward" ? "warding" : ev.hs === "weave" ? "weaving" : "lunge");
          if (b) b.classList.add("hit");
        }
        await wait(ev.kind === "hit" ? 280 : 120);
      }
      const upH = state.party.some(function (p) { return p.hp > 0; });
      const upF = state.battle && state.battle.foes.some(function (f) { return f.hp > 0; });
      if (!upH || !upF) break;
    }
    if (!state || !state.battle || screen !== "battle") { busy = false; return; }
    const heroesUp = state.party.some(function (p) { return p.hp > 0; });
    const foesUp = state.battle.foes.some(function (f) { return f.hp > 0; });
    busy = false;
    if (!heroesUp) { endBattle(false); return; }
    if (!foesUp) { endBattle(true); return; }
    state.party.forEach(function (p) {
      if (p.hp > 0) p.focus = Math.min(p.maxFocus, (p.focus || 0) + 1);
    });
    render();
  }

  function arrive(node) {
    state.x = node.x;
    state.y = node.y;
    node.seen = true;
    neighborsOf(state.nodes, node).forEach(function (n) { n.seen = true; });
    passHours(travelCost());
    const ambush = node.kind === "wild" && !node.cleared && (node.blight || night()) && Math.random() < (node.blight && night() ? 0.72 : 0.42);
    save();
    if (ambush) startBattle(node, (night() ? "Night" : "Blight") + " on " + node.name + ".");
    else { screen = "node"; render(); }
  }

  function portrait(id, mark) {
    const h = heroById(id);
    return "<span class='tale-face mark-" + esc(mark || "bare") + "' style='--ink:" + h.color + "'>" +
      "<img src='./assets/" + h.file + "' alt=''></span>";
  }
  function foeImg(file) {
    const src = "./assets/foes/64/foe_" + file + "_" + (frame % 4) + ".png";
    return "<img class='tale-foe' data-frame='./assets/foes/64/foe_" + file + "_{f}.png' src='" + src + "' alt=''>";
  }
  function bars(id, hp, max, ink) {
    const pct = Math.max(0, Math.min(100, max ? (hp / max) * 100 : 0));
    return "<div class='tale-bar'><i data-bar='" + esc(id) + "' style='width:" + pct + "%;background:" + ink + "'></i></div>";
  }

  function render() {
    if (!root) root = document.getElementById("tale");
    if (!root) return;
    const phase = state ? phaseName() : "day";
    const season = state ? SEASONS[state.season] || "spring" : "spring";
    const weather = state ? state.weather : "clear";
    root.className = "tale phase-" + phase + " season-" + season + " weather-" + weather;
    document.body.classList.add("tale-on");
    let body = "";
    if (screen === "charter") body = viewCharter();
    else if (!state) body = viewCharter();
    else if (screen === "realm") body = viewRealm();
    else if (screen === "node") body = viewNode();
    else if (screen === "battle") body = state.battle ? viewBattle() : (screen = "realm", viewRealm());
    else if (screen === "camp") body = viewCamp();
    else if (screen === "book") body = viewBook();
    else if (screen === "grow") body = viewGrow();
    else if (screen === "saves") body = viewSaves();
    else body = viewRealm();
    root.innerHTML = topbar() + "<div class='tale-body'>" + body + "</div>";
    paintFrames();
  }
  function topbar() {
    if (!state || screen === "charter") {
      return "<header class='tale-top'><p class='kicker'>Δ9Φ963 · Complete</p><h1>Lattice Tale</h1><span class='grow'></span>" +
        "<button type='button' class='btn' data-act='exit'>Menu</button></header>";
    }
    const node = here();
    return "<header class='tale-top'><p class='kicker'>Complete · " + esc(state.company) + "</p>" +
      "<b>" + esc(node ? node.name : "") + "</b>" +
      "<span class='tale-clock'>Day " + state.day + " · " + SEASONS[state.season] + " · " + phaseName() + " " + state.hour + "h · " + state.weather + "</span>" +
      "<span class='tale-gold'>" + state.gold + " gold</span>" +
      "<span class='grow'></span>" +
      "<button type='button' class='btn ghost' data-act='realm'>Realm</button>" +
      "<button type='button' class='btn ghost' data-act='camp'>Camp</button>" +
      "<button type='button' class='btn ghost' data-act='book'>Skills</button>" +
      "<button type='button' class='btn gold' data-act='saves'>Save</button>" +
      "<button type='button' class='btn' data-act='exit'>Menu</button></header>";
  }

  function viewCharter() {
    if (!draft) draft = freshDraft();
    const saved = loadState();
    const focus = heroById(draft.focus);
    const build = draft.builds[focus.id];
    if (!build.skills.length) build.skills = defaultSkills(focus);
    let roster = HEROES.map(function (h) {
      const on = draft.ids.indexOf(h.id) >= 0;
      return "<button type='button' class='tale-hero" + (on ? " on" : "") + (draft.focus === h.id ? " focus" : "") + "' data-act='pick-hero' data-id='" + h.id + "'>" +
        portrait(h.id, draft.builds[h.id].mark) + "<b>" + esc(h.name) + "</b><span>" + esc(h.tag) + "</span></button>";
    }).join("");
    const marks = MARKS.map(function (mk) {
      return "<button type='button' class='btn ghost" + (build.mark === mk.id ? " gold" : "") + "' data-act='mark' data-id='" + mk.id + "'>" + esc(mk.name) + "</button>";
    }).join("");
    const chosen = build.skills.map(function (id) {
      const s = skillById(id);
      return s ? "<b>" + esc(s.name) + "</b>" : "";
    }).join(" · ");
    const saves = readBook();
    return "<section class='tale-charter'>" +
      "<p class='lore'>Direct a company through a realm that keeps moving. No classes — any warden may learn any skill. Gear and marks decide the fight. Strike beats Weave. Weave beats Ward. Ward beats Strike. Saves stay in this browser.</p>" +
      (saves.length ? "<p class='kicker'>Saved in this browser</p>" + saves.map(slotCard).join("") : "") +
      "<label>Company</label><input class='name' id='taleCompany' maxlength='22' value='" + esc(draft.company) + "'>" +
      "<p class='kicker'>Company — up to four</p><div class='tale-roster'>" + roster + "</div>" +
      "<div class='tale-build'><h2>" + portrait(focus.id, build.mark) + " " + esc(build.name) + "</h2>" +
      "<label>Called</label><input class='name' id='taleCall' maxlength='16' value='" + esc(build.name) + "'>" +
      "<p class='kicker'>Look</p><div class='tale-row'>" + marks + "</div><p class='lore'>" + esc(markById(build.mark).text) + "</p>" +
      "<p class='kicker'>Four skills to start — click the book to swap</p><p class='lore'>" + (chosen || "None yet.") + "</p>" +
      skillBrowser(build.skills, "draft-skill") +
      "</div><button type='button' class='btn gold' data-act='begin'>Open the realm</button></section>";
  }
  function slotCard(slot) {
    const when = slot.at ? String(slot.at).slice(0, 16).replace("T", " ") : "earlier";
    return "<article class='tale-card tale-save'><div><b>" + esc(slot.name || slot.company || "Save") + "</b>" +
      "<span>" + esc(slot.company || "") + " · day " + (slot.day || 1) +
      (slot.where ? " · " + esc(slot.where) : "") +
      (slot.kind === "auto" ? " · autosave" : " · kept save") + " · " + esc(when) + "</span>" +
      "<div class='tale-row'><button type='button' class='btn gold' data-act='load-slot' data-id='" + esc(slot.id) + "'>Load</button>" +
      (state ? "<button type='button' class='btn' data-act='overwrite' data-id='" + esc(slot.id) + "'>Overwrite</button>" : "") +
      "<button type='button' class='btn' data-act='drop-slot' data-id='" + esc(slot.id) + "'>Delete</button></div></div></article>";
  }
  function viewSaves() {
    const slots = readBook();
    return "<section class='tale-charter'><h2>Saves</h2>" +
      "<p class='lore'>Saves stay on this computer, in this browser. No account. Autosave updates as you walk. A kept save stays until you delete it. Eight kept saves, plus the autosave.</p>" +
      (toast ? "<p class='lore'>" + esc(toast) + "</p>" : "") +
      (state ? "<label>Name this save</label><input class='name' id='taleSaveName' maxlength='24' value='" + esc(saveLabel || state.company || "Company") + "'>" +
        "<div class='tale-row'><button type='button' class='btn gold' data-act='save-now'>Save in this browser</button></div>" : "") +
      (slots.length ? slots.map(slotCard).join("") : "<p class='lore'>No saves yet.</p>") +
      "<button type='button' class='btn' data-act='saves-back'>Back</button></section>";
  }
  function skillBrowser(selected, act) {
    const q = (draft && draft.q ? draft.q : "").toLowerCase();
    const school = (draft && draft.school) || "strike";
    const tabs = SCHOOLS.map(function (s) {
      return "<button type='button' class='btn ghost" + (school === s.id ? " gold" : "") + "' data-act='school' data-id='" + s.id + "'>" + esc(s.name) + "</button>";
    }).join("") + "<button type='button' class='btn ghost" + (school === "sig" ? " gold" : "") + "' data-act='school' data-id='sig'>Names</button>";
    const list = SKILLS.filter(function (s) {
      if (school === "sig") { if (!s.sig) return false; }
      else if (s.school !== school || s.rank !== 1) return false;
      if (q && s.name.toLowerCase().indexOf(q) < 0 && s.text.toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).slice(0, school === "sig" ? 40 : 16);
    const buttons = list.map(function (s) {
      const on = selected.indexOf(s.id) >= 0;
      return "<button type='button' class='tale-skill" + (on ? " on" : "") + "' data-act='" + act + "' data-id='" + s.id + "'><b>" + esc(s.name) + "</b><span>" + esc(s.stance) + " · " + s.cost + " focus · " + esc(s.text) + "</span></button>";
    }).join("");
    return "<input class='name' id='taleQ' placeholder='Find a skill' value='" + esc(q) + "'>" +
      "<div class='tale-row tale-schools'>" + tabs + "</div><div class='tale-skills'>" + buttons + "</div>" +
      "<p class='lore'>" + SKILLS.length + " skills in the book. A warden carries four. Higher seals are learned on the road.</p>";
  }

  function viewRealm() {
    const cells = state.nodes.map(function (n) {
      const fog = n.seen ? "seen" : neighborsOf(state.nodes, n).some(function (m) { return m.seen; }) ? "edge" : "far";
      const hereCls = n.x === state.x && n.y === state.y ? " here" : "";
      const label = fog === "far" ? "" : fog === "edge" ? "?" : n.name;
      const glyph = { town: "T", ruin: "R", obelisk: "O", evil: "E", cave: "C", wild: "" }[n.kind] || "";
      return "<button type='button' class='tale-cell " + fog + " kind-" + n.kind + hereCls + (n.blight ? " blight" : "") + (n.cleared ? " cleared" : "") + "' data-act='go' data-x='" + n.x + "' data-y='" + n.y + "' style='--biome:" + (BIOME_INK[n.biome] || "#94a3b8") + "' title='" + esc(label) + "'>" +
        (fog === "seen" ? "<i>" + glyph + "</i><em>" + esc(n.biome) + "</em>" : fog === "edge" ? "?" : "") + "</button>";
    }).join("");
    const rumors = state.rumors.map(function (r) {
      return "<button type='button' class='tale-rumor' data-act='go' data-x='" + r.x + "' data-y='" + r.y + "'>" + esc(r.text) + "</button>";
    }).join("") || "<p class='lore'>No rumors. The realm is quiet — for a morning.</p>";
    const party = state.party.map(function (p) {
      return "<div class='tale-pip'>" + portrait(p.id, p.mark) + "<b>" + esc(p.name) + "</b><span>lv " + p.lv + " · " + p.hp + "/" + p.max + "</span>" + bars(p.id, p.hp, p.max, heroById(p.id).color) + "</div>";
    }).join("");
    return "<div class='tale-realm'><div class='tale-map'>" + cells + "</div><aside class='tale-side'>" +
      "<p class='kicker'>Politics</p><p class='lore'>" + esc(politicsLine()) + "</p>" +
      "<p class='kicker'>Rumors — you may ignore them</p>" + rumors +
      "<p class='kicker'>Company</p><div class='tale-pips'>" + party + "</div>" +
      "<p class='lore'>Strike beats Weave. Weave beats Ward. Ward beats Strike. Same stance is a clash. Towns trade, wage war, and ally while you walk. Evil Centers blight their neighbours if left alone.</p>" +
      "<button type='button' class='btn' data-act='sleep'>Sleep until dawn</button></aside></div>";
  }

  function viewNode() {
    const n = here();
    if (!n) return viewRealm();
    const town = n.kind === "town" ? townByName(n.name) : null;
    let acts = "";
    if (n.kind === "town" && town) {
      const war = Object.keys(town.war).length;
      acts += "<p class='lore'>" + esc(n.name) + " · prosperity " + town.prosperity + (war ? " · at war" : " · at peace") + ".</p>";
      acts += "<div class='tale-row'><button type='button' class='btn gold' data-act='rest'>Rest</button>" +
        "<button type='button' class='btn' data-act='train'>Train — 30 gold, learn a skill</button>" +
        "<button type='button' class='btn' data-act='ally'>Ally this town</button>" +
        (war ? "<button type='button' class='btn' data-act='fight-town'>Stand in their war</button>" : "") +
        "</div>";
      acts += "<p class='kicker'>Market</p>";
      acts += state.shop.map(function (s) {
        const g = gearById(s.id);
        return "<button type='button' class='tale-skill' data-act='buy' data-id='" + s.id + "'><b>" + esc(g.name) + " · " + s.price + "</b><span>" + esc(g.slot) + " · " + esc(g.text) + "</span></button>";
      }).join("") || "<p class='lore'>The stalls are empty today.</p>";
    } else if (n.kind === "ruin") {
      acts += "<p class='lore'>A ruin. Delve for a fight and a relic, salvage gold and leave the danger, or map a far tile.</p>";
      acts += "<div class='tale-row'><button type='button' class='btn gold' data-act='fight'>Delve</button>" +
        "<button type='button' class='btn' data-act='salvage'>Salvage</button>" +
        "<button type='button' class='btn' data-act='mapit'>Map a far reach</button></div>";
    } else if (n.kind === "obelisk") {
      acts += "<p class='lore'>An obelisk. Offer a known skill and it teaches a higher one. Refuse it and the nearest Evil Center grows. Study and it grants a Spark.</p>";
      acts += "<div class='tale-row'><button type='button' class='btn gold' data-act='offer'>Offer a skill</button>" +
        "<button type='button' class='btn' data-act='study'>Study</button>" +
        "<button type='button' class='btn' data-act='refuse'>Refuse</button></div>";
      if (state.offer) {
        acts += "<p class='kicker'>Offer from " + esc(member(state.offer).name) + "</p>";
        acts += member(state.offer).known.map(function (id) {
          const s = skillById(id);
          return "<button type='button' class='tale-skill' data-act='give' data-id='" + id + "'><b>" + esc(s ? s.name : id) + "</b></button>";
        }).join("");
      }
    } else if (n.kind === "evil") {
      acts += "<p class='lore'>" + (n.cleared ? "The center is quiet." : "An Evil Center. Threat " + (n.threat || 0) + ". Break it, bargain for three quiet days, or leave it to feed the wilds.") + "</p>";
      if (!n.cleared) {
        acts += "<div class='tale-row'><button type='button' class='btn gold' data-act='fight'>Break it</button>" +
          "<button type='button' class='btn' data-act='bargain'>Bargain — 20 gold</button></div>";
      }
    } else if (n.kind === "cave") {
      const depth = state.cave && state.cave.x === n.x ? state.cave.depth : 0;
      acts += "<p class='lore'>The caves do not end. Depth " + depth + ". Descend, or surface.</p>";
      acts += "<div class='tale-row'><button type='button' class='btn gold' data-act='descend'>Descend</button>" +
        "<button type='button' class='btn' data-act='surface'>Surface</button></div>";
    } else {
      acts += "<p class='lore'>" + esc(n.biome) + " wild" + (n.blight ? ", blighted by a nearby Evil Center" : "") + ". Hunt, camp, or walk on.</p>";
      acts += "<div class='tale-row'><button type='button' class='btn gold' data-act='fight'>Hunt</button>" +
        "<button type='button' class='btn' data-act='camp'>Camp</button></div>";
    }
    const recent = state.chronicle.slice(0, 5).map(function (t) { return "<div>" + esc(t) + "</div>"; }).join("");
    return "<section class='tale-node'><p class='kicker'>" + esc(n.biome) + " · " + esc(n.kind) + "</p><h2>" + esc(n.name) + "</h2>" +
      acts + "<p class='kicker'>Chronicle</p><div class='tale-log'>" + recent + "</div></section>";
  }

  function viewBattle() {
    const b = state.battle;
    const party = state.party.map(function (p) {
      const ch = b.choice[p.id] || { stance: "strike", skill: "" };
      const dead = p.hp <= 0;
      const stances = ["strike", "ward", "weave"].map(function (s) {
        return "<button type='button' class='btn ghost" + (ch.stance === s ? " gold" : "") + "' data-act='stance' data-id='" + p.id + "' data-stance='" + s + "'" + (dead ? " disabled" : "") + ">" + s + "</button>";
      }).join("");
      const skills = ["<button type='button' class='tale-mini" + (!ch.skill ? " on" : "") + "' data-act='pick-skill' data-id='" + p.id + "' data-skill=''>Basic</button>"].concat(p.equipped.map(function (id) {
        const s = skillById(id);
        if (!s) return "";
        const poor = p.focus < s.cost;
        return "<button type='button' class='tale-mini" + (ch.skill === id ? " on" : "") + "' data-act='pick-skill' data-id='" + p.id + "' data-skill='" + id + "'" + (dead || poor ? " disabled" : "") + ">" + esc(s.name) + " · " + s.cost + "</button>";
      })).join("");
      return "<article class='tale-unit" + (dead ? " dead" : "") + "' data-unit='h-" + p.id + "'>" +
        portrait(p.id, p.mark) + "<div><b>" + esc(p.name) + "</b><span> " + p.hp + "/" + p.max + " · focus " + p.focus + "</span>" +
        bars("h-" + p.id, p.hp, p.max, heroById(p.id).color) +
        "<div class='tale-row'>" + stances + "</div><div class='tale-skills tight'>" + skills + "</div></div></article>";
    }).join("");
    const foes = b.foes.map(function (f) {
      return "<article class='tale-unit foe" + (f.hp <= 0 ? " dead" : "") + "' data-unit='f-" + f.uid + "'>" +
        foeImg(f.file) + "<div><b>" + esc(f.name) + "</b><span> " + f.hp + "/" + f.max + (f.boss ? " · named" : "") + "</span>" +
        bars(f.uid, f.hp, f.max, "#f87171") + "</div></article>";
    }).join("");
    const log = b.log.slice(0, 8).map(function (t) { return "<div>" + esc(t) + "</div>"; }).join("");
    return "<section class='tale-battle'><div class='tale-units'>" + party + "</div><div class='tale-units foes'>" + foes + "</div>" +
      "<div class='tale-clash'><p class='lore'>Strike beats Weave. Weave beats Ward. Ward beats Strike.</p>" +
      "<button type='button' class='btn gold' data-act='clash'" + (busy ? " disabled" : "") + ">Clash</button>" +
      "<button type='button' class='btn' data-act='flee'>Flee to the last town</button></div>" +
      "<div class='tale-log'>" + log + "</div></section>";
  }

  function viewCamp() {
    const cards = state.party.map(function (p) {
      const bonds = state.party.filter(function (o) { return o !== p; }).map(function (o) {
        return esc(o.name) + " " + (p.bond[o.id] || 0);
      }).join(" · ");
      const gear = ["hand", "plate", "relic"].map(function (slot) {
        const g = gearById(p[slot]);
        return "<span>" + slot + ": " + esc(g ? g.name : "—") + "</span>";
      }).join(" ");
      const stash = state.stash.map(function (id) {
        const g = gearById(id);
        return "<button type='button' class='btn ghost' data-act='equip' data-id='" + p.id + "' data-gear='" + id + "'>" + esc(g.name) + "</button>";
      }).join("");
      const known = p.known.map(function (id) {
        const s = skillById(id);
        const on = p.equipped.indexOf(id) >= 0;
        return "<button type='button' class='tale-mini" + (on ? " on" : "") + "' data-act='equip-skill' data-id='" + p.id + "' data-skill='" + id + "'>" + esc(s ? s.name : id) + "</button>";
      }).join("");
      const marks = MARKS.map(function (mk) {
        return "<button type='button' class='btn ghost" + (p.mark === mk.id ? " gold" : "") + "' data-act='remark' data-id='" + p.id + "' data-mark='" + mk.id + "'>" + esc(mk.name) + "</button>";
      }).join("");
      return "<article class='tale-card'>" + portrait(p.id, p.mark) + "<div><b>" + esc(p.name) + "</b> <span>lv " + p.lv + "</span>" +
        "<p class='lore'>" + gear + "</p><p class='lore'>Bonds " + (bonds || "—") + "</p>" +
        "<div class='tale-row'>" + marks + "</div><div class='tale-skills tight'>" + known + "</div>" +
        "<div class='tale-row'>" + stash + "</div>" +
        "<button type='button' class='btn ghost' data-act='watch' data-id='" + p.id + "'>Share a watch</button></div></article>";
    }).join("");
    return "<section class='tale-camp'><h2>Camp</h2><p class='lore'>Looks can change. Four skills stay equipped. Bonds rise when you win together, and Bond skills notice.</p>" + cards +
      "<button type='button' class='btn' data-act='realm'>Back to the realm</button></section>";
  }

  function viewBook() {
    draft = draft || { q: "", school: "strike" };
    return "<section class='tale-charter'><h2>The book — " + SKILLS.length + "</h2>" +
      "<p class='lore'>Every skill is a school, a form, and a rank. Schools set the stance. Forms set the trick. No warden is barred from any of them.</p>" +
      skillBrowser([], "noop") + "</section>";
  }

  function viewGrow() {
    const p = state.pending && member(state.pending.hero);
    if (!p) return viewNode();
    const choices = state.pending.choices.map(function (id) {
      const s = skillById(id);
      return "<button type='button' class='tale-skill' data-act='learn' data-id='" + id + "'><b>" + esc(s.name) + "</b><span>" + esc(s.text) + "</span></button>";
    }).join("");
    return "<section class='tale-charter'><h2>" + esc(p.name) + " reaches level " + p.lv + "</h2>" +
      "<p class='lore'>Choose one skill. The other two stay in the world for someone else.</p>" + choices + "</section>";
  }

  function paintFrames() {
    document.querySelectorAll("[data-frame]").forEach(function (img) {
      img.src = img.getAttribute("data-frame").replace("{f}", String(frame % 4));
    });
  }

  function onClick(e) {
    const t = e.target.closest("[data-act]");
    if (!t || !root || !root.contains(t)) return;
    const act = t.getAttribute("data-act");
    const id = t.getAttribute("data-id");
    if (act === "exit") { close(); return; }
    if (act === "saves") {
      if (busy) return;
      if (screen !== "saves") screenBeforeSaves = screen;
      if (state) saveLabel = saveLabel || state.company || "Company";
      screen = "saves";
      render();
      return;
    }
    if (act === "saves-back") {
      screen = screenBeforeSaves && screenBeforeSaves !== "saves" ? screenBeforeSaves : (state ? "realm" : "charter");
      if (!state) screen = "charter";
      render();
      return;
    }
    if (act === "save-now") {
      const typed = document.getElementById("taleSaveName");
      const name = (typed && typed.value) || saveLabel || (state && state.company) || "Company";
      saveLabel = name;
      toast = writeSlot(name, "manual") ? "Saved in this browser." : "This browser refused the save.";
      render();
      return;
    }
    if (act === "load-slot") {
      const got = loadSlot(id);
      if (!got) { toast = "That save is gone."; render(); return; }
      state = harden(got.state);
      screen = got.slot.screen || "realm";
      if (screen === "battle" && !state.battle) screen = "realm";
      if (screen === "grow" && !state.pending) screen = "node";
      if (screen === "saves" || screen === "charter" || screen === "book") screen = "realm";
      busy = false;
      draft = null;
      toast = "Loaded " + (got.slot.name || "save") + ".";
      render();
      return;
    }
    if (act === "overwrite") {
      if (!state) return;
      const existing = readBook().filter(function (s) { return s.id === id; })[0];
      if (!existing) return;
      toast = writeSlot(existing.name, existing.kind, existing.id) ? "Overwrote " + existing.name + "." : "This browser refused the save.";
      render();
      return;
    }
    if (act === "drop-slot") {
      dropSlot(id);
      toast = "Deleted that save from this browser.";
      render();
      return;
    }
    if (act === "pick-hero") {
      const ix = draft.ids.indexOf(id);
      if (ix >= 0 && draft.ids.length > 1) draft.ids.splice(ix, 1);
      else if (ix < 0 && draft.ids.length < 4) draft.ids.push(id);
      draft.focus = id;
      render();
      return;
    }
    if (act === "mark") { draft.builds[draft.focus].mark = id; render(); return; }
    if (act === "school") { draft.school = id; render(); return; }
    if (act === "draft-skill") {
      const list = draft.builds[draft.focus].skills;
      const ix = list.indexOf(id);
      if (ix >= 0) list.splice(ix, 1);
      else if (list.length < 4) list.push(id);
      render();
      return;
    }
    if (act === "begin") { begin(); return; }
    if (!state) return;
    if (act === "realm") { screen = "realm"; render(); return; }
    if (act === "camp") { screen = "camp"; render(); return; }
    if (act === "book") { screen = "book"; if (!draft) draft = { q: "", school: "strike" }; render(); return; }
    if (act === "sleep") {
      state.hour = 6;
      dawn();
      logLine("The company sleeps. The realm does not.");
      save();
      screen = "realm";
      render();
      return;
    }
    if (act === "go") {
      const x = +t.getAttribute("data-x"), y = +t.getAttribute("data-y");
      const n = nodeAt(state.nodes, x, y);
      if (!n) return;
      const cur = here();
      const near = Math.abs(n.x - cur.x) + Math.abs(n.y - cur.y) === 1;
      const known = n.seen || neighborsOf(state.nodes, n).some(function (m) { return m.seen; });
      if (!near || !known) {
        if (known && near === false && (n.seen || fogEdge(n))) {
          logLine(n.name + " is not the next step. Walk the neighbouring tiles.");
          render();
        }
        return;
      }
      arrive(n);
      return;
    }
    if (act === "fight" || act === "fight-town") { startBattle(here(), act === "fight-town" ? "You stand in the war." : here().name); return; }
    if (act === "rest") {
      state.party.forEach(function (p) { p.hp = p.max; p.focus = p.maxFocus; });
      passHours(8);
      logLine("Rested at " + here().name + ".");
      save(); render(); return;
    }
    if (act === "train") {
      if (state.gold < 30) { logLine("Training costs 30 gold."); save(); render(); return; }
      state.gold -= 30;
      const who = state.party[(Math.random() * state.party.length) | 0];
      const choices = offerSkills(who);
      if (!choices.length) { logLine("Nothing left to teach " + who.name + "."); }
      else {
        state.pending = { hero: who.id, choices: choices };
        screen = "grow";
      }
      save(); render(); return;
    }
    if (act === "ally") {
      const town = townByName(here().name);
      if (!town) return;
      state.towns.forEach(function (o) {
        if (o === town) return;
        const rel = Math.max(-3, (town.rel[o.id] || 0) - 1);
        town.rel[o.id] = rel;
        o.rel[town.id] = rel;
      });
      state.towns.forEach(function (o) {
        if (o !== town) return;
      });
      town.prosperity = Math.min(8, town.prosperity + 1);
      logLine("You bind the company to " + town.name + ". The other towns cool.");
      save(); render(); return;
    }
    if (act === "buy") {
      const offer = state.shop.filter(function (s) { return s.id === id; })[0];
      const g = gearById(id);
      if (!offer || !g || state.gold < offer.price) { logLine("Not enough gold."); save(); render(); return; }
      state.gold -= offer.price;
      state.stash.push(g.id);
      state.shop = state.shop.filter(function (s) { return s.id !== id; });
      logLine("Bought " + g.name + ".");
      save(); render(); return;
    }
    if (act === "salvage") {
      const n = here();
      const got = 12 + ((Math.random() * 14) | 0);
      state.gold += got;
      n.threat = (n.threat || 0) + 1;
      logLine("Salvaged " + got + " gold from " + n.name + ". It stays dangerous.");
      save(); render(); return;
    }
    if (act === "mapit") {
      const hidden = state.nodes.filter(function (n) { return !n.seen && n.kind !== "wild"; });
      const n = hidden[(Math.random() * hidden.length) | 0] || state.nodes.filter(function (m) { return !m.seen; })[0];
      if (n) {
        n.seen = true;
        neighborsOf(state.nodes, n).forEach(function (m) { m.seen = true; });
        logLine("The ruin maps " + n.name + ".");
      }
      save(); screen = "realm"; render(); return;
    }
    if (act === "offer") {
      state.offer = state.party[0].id;
      render(); return;
    }
    if (act === "give") {
      const who = member(state.offer || state.party[0].id);
      const sk = skillById(id);
      if (!who || !sk) return;
      who.known = who.known.filter(function (k) { return k !== id; });
      who.equipped = who.equipped.filter(function (k) { return k !== id; });
      const crowns = SKILLS.filter(function (s) {
        return s.rank === 3 && who.known.indexOf(s.id) < 0 && s.stance === sk.stance;
      });
      const crown = crowns.length ? crowns[(Math.random() * crowns.length) | 0] : null;
      if (crown) {
        who.known.push(crown.id);
        if (who.equipped.length < 4) who.equipped.push(crown.id);
        logLine(who.name + " offers " + sk.name + " and learns " + crown.name + ".");
      }
      here().cleared = true;
      state.offer = null;
      save(); render(); return;
    }
    if (act === "study") {
      const who = state.party[0];
      const pool = SKILLS.filter(function (s) { return s.rank === 1 && who.known.indexOf(s.id) < 0 && !s.sig; });
      const spark = pool.length ? pool[(Math.random() * pool.length) | 0] : null;
      if (spark) {
        who.known.push(spark.id);
        logLine(who.name + " studies " + here().name + " and learns " + spark.name + ".");
      }
      here().cleared = true;
      save(); render(); return;
    }
    if (act === "refuse") {
      const evil = state.nodes.filter(function (n) { return n.kind === "evil" && !n.cleared; })[0];
      if (evil) evil.threat = (evil.threat || 0) + 2;
      logLine("You refuse " + here().name + ". An Evil Center swells.");
      save(); render(); return;
    }
    if (act === "bargain") {
      const n = here();
      if (state.gold < 20) { logLine("The bargain wants 20 gold."); save(); render(); return; }
      state.gold -= 20;
      n.threat = Math.max(0, (n.threat || 0) - 2);
      logLine(n.name + " sleeps. Threat falls. It will wake.");
      save(); render(); return;
    }
    if (act === "descend") {
      const n = here();
      if (!state.cave || state.cave.x !== n.x) state.cave = { x: n.x, y: n.y, depth: 1 };
      startBattle(n, n.name + " depth " + state.cave.depth);
      return;
    }
    if (act === "surface") {
      state.cave = null;
      logLine("You surface. The stair keeps your depth only while you stay.");
      save(); screen = "realm"; render(); return;
    }
    if (act === "stance") {
      const ch = state.battle.choice[id] || { stance: "strike", skill: "" };
      ch.stance = t.getAttribute("data-stance");
      state.battle.choice[id] = ch;
      render(); return;
    }
    if (act === "pick-skill") {
      const ch = state.battle.choice[id] || { stance: "strike", skill: "" };
      ch.skill = t.getAttribute("data-skill") || "";
      const sk = skillById(ch.skill);
      if (sk) ch.stance = sk.stance;
      state.battle.choice[id] = ch;
      render(); return;
    }
    if (act === "clash") { playRound(); return; }
    if (act === "flee") { if (!busy) endBattle(false); return; }
    if (act === "learn") {
      const p = member(state.pending.hero);
      const sk = skillById(id);
      if (p && sk && p.known.indexOf(sk.id) < 0) {
        p.known.push(sk.id);
        if (p.equipped.length < 4) p.equipped.push(sk.id);
        else p.equipped[p.equipped.length - 1] = sk.id;
        logLine(p.name + " learns " + sk.name + ".");
      }
      state.pending = null;
      screen = "node";
      save(); render(); return;
    }
    if (act === "remark") {
      const p = member(id);
      if (!p) return;
      p.mark = t.getAttribute("data-mark");
      retune(p);
      save(); render(); return;
    }
    if (act === "equip-skill") {
      const p = member(id);
      const sid = t.getAttribute("data-skill");
      if (!p) return;
      const ix = p.equipped.indexOf(sid);
      if (ix >= 0) p.equipped.splice(ix, 1);
      else if (p.equipped.length < 4) p.equipped.push(sid);
      else { p.equipped.shift(); p.equipped.push(sid); }
      save(); render(); return;
    }
    if (act === "equip") {
      const p = member(id);
      const g = gearById(t.getAttribute("data-gear"));
      if (!p || !g) return;
      if (p[g.slot]) state.stash.push(p[g.slot]);
      p[g.slot] = g.id;
      state.stash = state.stash.filter(function (gid) { return gid !== g.id; });
      retune(p);
      save(); render(); return;
    }
    if (act === "watch") {
      const p = member(id);
      const other = state.party.filter(function (o) { return o !== p && o.hp > 0; })[0];
      if (p && other) {
        p.bond[other.id] = Math.min(5, (p.bond[other.id] || 0) + 1);
        other.bond[p.id] = Math.min(5, (other.bond[p.id] || 0) + 1);
        logLine(p.name + " and " + other.name + " share a watch.");
      }
      passHours(4);
      save(); render(); return;
    }
  }
  function onInput(e) {
    if (e.target.id === "taleSaveName") { saveLabel = e.target.value; return; }
    if (!draft) return;
    if (e.target.id === "taleCompany") draft.company = e.target.value;
    if (e.target.id === "taleCall" && draft.focus) draft.builds[draft.focus].name = e.target.value;
    if (e.target.id === "taleQ") {
      draft.q = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const el = document.getElementById("taleQ");
      if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (_) {} }
    }
  }
  function begin() {
    const seed = (Math.random() * 0xFFFFFFFF) >>> 0;
    state = genWorld(seed);
    state.company = String((draft && draft.company) || "The Accord").slice(0, 22) || "The Accord";
    const ids = (draft && draft.ids.length ? draft.ids : ["kael"]).slice(0, 4);
    state.party = ids.map(function (hid) { return makeMember(hid, draft.builds[hid]); });
    rollShop(rng(seed ^ 99));
    rollRumors(rng(seed ^ 17));
    logLine(state.company + " steps into a realm that has not been walked.");
    logLine(politicsLine());
    draft = null;
    screen = "realm";
    save();
    render();
  }

  function open() {
    root = document.getElementById("tale");
    if (!root) return;
    const overlay = document.getElementById("overlay");
    if (overlay) { overlay.className = "overlay hidden"; overlay.onclick = null; }
    const app = document.getElementById("app");
    if (app) app.classList.add("hidden");
    document.body.classList.add("tale-on");
    root.classList.remove("hidden");
    state = null;
    draft = freshDraft();
    screen = "charter";
    if (!frameTimer) frameTimer = setInterval(function () { frame++; if (screen === "battle") paintFrames(); }, 180);
    render();
  }
  function close() {
    if (busy) return;
    if (state && validRun(state) && screen !== "charter") save();
    if (root) root.classList.add("hidden");
    document.body.classList.remove("tale-on");
    if (window.LatticeCrypt && LatticeCrypt.menu) LatticeCrypt.menu();
  }
  function fogEdge(n) {
    return neighborsOf(state.nodes, n).some(function (m) { return m.seen; });
  }
  function harden(data) {
    if (!data) return data;
    data.stash = data.stash || [];
    data.shop = data.shop || [];
    data.chronicle = data.chronicle || [];
    data.rumors = data.rumors || [];
    data.towns = data.towns || [];
    data.party = data.party || [];
    data.party.forEach(function (p) {
      p.bond = p.bond || {};
      p.known = p.known || [];
      p.equipped = p.equipped || p.known.slice(0, 4);
    });
    return data;
  }
  function back() {
    if (busy) return;
    if (screen === "battle" || screen === "grow") return;
    if (screen === "saves") {
      screen = screenBeforeSaves && screenBeforeSaves !== "saves" ? screenBeforeSaves : (state ? "realm" : "charter");
      if (!state) screen = "charter";
      render();
      return;
    }
    if (screen === "camp" || screen === "book" || screen === "node") { screen = "realm"; render(); return; }
    if (screen === "realm") {
      if (state) save();
      screen = "charter";
      render();
      return;
    }
    close();
  }

  function dryBattle(seed) {
    state = genWorld(seed || 1);
    state.party = ["kael", "vale", "orin", "nia"].map(function (id) {
      return makeMember(id, { name: id, mark: "helm", skills: [] });
    });
    const node = state.nodes.filter(function (n) { return n.kind === "evil"; })[0];
    state.x = node.x;
    state.y = node.y;
    state.battle = {
      nodeX: node.x, nodeY: node.y, reason: "dry",
      foes: packFor(node), round: 1, log: [], choice: {}, lastStance: null
    };
    state.party.forEach(function (p) {
      state.battle.choice[p.id] = { stance: heroById(p.id).stance, skill: p.equipped[0] || "" };
    });
    const evs = previewRound();
    evs.forEach(applyEvent);
    const heroHp = state.party.reduce(function (n, p) { return n + p.hp; }, 0);
    const foeHp = state.battle.foes.reduce(function (n, f) { return n + f.hp; }, 0);
    state.battle = null;
    return { events: evs.length, heroHp: heroHp, foeHp: foeHp };
  }

  const api = {
    open: open,
    close: close,
    back: back,
    skills: SKILLS,
    debug: {
      clash: clash, genWorld: genWorld, buildSkills: buildSkills, dryBattle: dryBattle,
      writeSlot: writeSlot, loadSlot: loadSlot, dropSlot: dropSlot, readBook: readBook,
      SKILL_COUNT: SKILLS.length
    }
  };
  if (typeof window !== "undefined") {
    window.LatticeTale = api;
    document.addEventListener("click", onClick);
    document.addEventListener("input", onInput);
  }
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
