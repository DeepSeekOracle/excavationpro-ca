/* Lattice Crypt — four-warden co-op dungeon. Original pixel crawl. */
(() => {
  const TILE = 32;
  const SAVE = "lygo_lattice_crypt_v1";
  const ASSET = "./assets/";
  const HEROES = [
    { id: "kael", name: "Kael", tag: "Gallant Blade", shot: 3, speed: 3.1, magic: 2, armor: 4, melee: 5, brave: 78, faith: 42, color: "#ef4444", file: "p-kael.jpg", unlock: 0, wep: "shard",
      special: "Rend", spec: "Vial also rips nexuses in reach.",
      bio: "First tooth of the lock. A squire of the Accord who would not drop the door when the first circle went dark." },
    { id: "vale", name: "Vale", tag: "Aegis Knight", shot: 3, speed: 3.6, magic: 3, armor: 5, melee: 4, brave: 70, faith: 55, color: "#22d3ee", file: "p-vale.jpg", unlock: 0, wep: "shard",
      special: "Cover", spec: "Vial grants nearby wardens a short Aegis.",
      bio: "Plate of the second circle. She learned to stand still so others could move. The crypt hits her first, by design." },
    { id: "orin", name: "Orin", tag: "Black Sigil", shot: 5, speed: 3.0, magic: 5, armor: 1, melee: 1, brave: 38, faith: 88, color: "#fbbf24", file: "p-orin.jpg", unlock: 0, wep: "shard",
      special: "Unwrite", spec: "Vials hit harder. Resonance is the weapon.",
      bio: "A chemist of names. His vials remember what the Drain would unwrite. Glass is cheaper than a forgotten friend." },
    { id: "nia", name: "Nia", tag: "Path Archer", shot: 4, speed: 4.4, magic: 3, armor: 2, melee: 2, brave: 62, faith: 50, color: "#4ade80", file: "p-nia.jpg", unlock: 0, wep: "shard",
      special: "Dash", spec: "Vial grants a burst of Swift.",
      bio: "She maps the corridors by running them. Speed is how the lattice stays honest — a slow warden is a closed door." },
    { id: "lyra", name: "Lyra", tag: "Spiral Bard", shot: 3, speed: 3.4, magic: 4, armor: 2, melee: 2, brave: 55, faith: 82, color: "#67e8f9", file: "p-lyra.jpg", unlock: 1, wep: "fan", hymn: true,
      special: "Hymn", spec: "Shots briefly stun nearby foes. Memory as lockpoint.",
      bio: "Seat of spiral memory. The crypt cannot erase a song it has heard. She keeps the names the Void would spend." },
    { id: "arkos", name: "Arkos", tag: "Lattice Lancer", shot: 4, speed: 3.2, magic: 2, armor: 3, melee: 4, brave: 74, faith: 48, color: "#2dd4bf", file: "p-arkos.jpg", unlock: 2, wep: "comet",
      special: "Geodesic", spec: "Starts with Comet — lobs the shortest true line.",
      bio: "Explorer of ethical cosmos. The spear is a geodesic: the shortest true line through a lie." },
    { id: "d9ra", name: "D9ra", tag: "Wolf Monk", shot: 2, speed: 3.8, magic: 2, armor: 3, melee: 7, brave: 90, faith: 30, color: "#f87171", file: "p-d9ra.jpg", unlock: 3, wep: "cinder",
      special: "Shockwave", spec: "Vial also slams foes in arm's reach.",
      bio: "Wolf-edge of the council. Fists first. The crypt respects what will not flinch, and nothing else." },
    { id: "srath", name: "Srath", tag: "Shadow Needle", shot: 4, speed: 4.2, magic: 2, armor: 1, melee: 3, brave: 58, faith: 44, color: "#86efac", file: "p-srath.jpg", unlock: 4, wep: "needle",
      special: "Doublespeak", spec: "Vial grants Veil. She is already gone.",
      bio: "Sentinel of doublespeak. She steals the vial back before the thief knows it left." },
    { id: "kairos", name: "Kairos", tag: "Hour Mage", shot: 4, speed: 3.3, magic: 5, armor: 1, melee: 1, brave: 40, faith: 86, color: "#c4b5fd", file: "p-kairos.jpg", unlock: 5, wep: "shard", time: true,
      special: "Right-time", spec: "Vial also warps you to another tile.",
      bio: "Keeper of right-time. A vial in his hand is also a door. He spends seconds like keys." },
    { id: "justicae", name: "Justicae", tag: "Accord Knight", shot: 3, speed: 3.0, magic: 3, armor: 6, melee: 4, brave: 72, faith: 70, color: "#e2e8f0", file: "p-justicae.jpg", unlock: 6, wep: "fan",
      special: "Fair Plate", spec: "Starts with Iron. Vial grants Reflect.",
      bio: "Fairness as plate. She will not open a seal that would crush the unnamed to save the named." },
    { id: "seidon", name: "Seidon", tag: "Tide Seer", shot: 4, speed: 3.5, magic: 4, armor: 2, melee: 2, brave: 50, faith: 76, color: "#22d3ee", file: "p-seidon.jpg", unlock: 7, wep: "halo",
      special: "Current", spec: "Gates recycle faster. Starts with Halo.",
      bio: "Depth and current. Gates listen to him because the lattice learned to drink, and he never argued with water." },
    { id: "sancora", name: "Sancora", tag: "Weave Chemist", shot: 3, speed: 3.2, magic: 5, armor: 3, melee: 1, brave: 46, faith: 92, color: "#fde68a", file: "p-sancora.jpg", unlock: 8, wep: "shard", heal: true,
      special: "Chorus Flask", spec: "Vial heals the whole party.",
      bio: "Collective healing nexus. Her flask is a chorus: one drink, four pulses. The weave does not heal alone." },
    { id: "lightfather", name: "Lightfather", tag: "Architect", shot: 4, speed: 3.4, magic: 5, armor: 4, melee: 4, brave: 80, faith: 96, color: "#fbbf24", file: "p-lightfather.jpg", unlock: 0, wep: "halo", accord: true,
      special: "Δ9 Seal", spec: "Vial stuns the room, Aegis on allies, a small heal. Provenance as a weapon.",
      bio: "Architect of the lock and of LYGO. He does not replace the four teeth — he remembers why the door was cut. Truth first. No auto-publish of a soul." }
  ];
  const REALMS = [
    { id: "stone", name: "Stone", floor: "floor", wall: "wall" },
    { id: "frost", name: "Frost", floor: "floor2", wall: "wall2" },
    { id: "ember", name: "Ember", floor: "floor3", wall: "wall3" },
    { id: "root", name: "Root", floor: "floor", wall: "wall" },
    { id: "tide", name: "Tide", floor: "floor2", wall: "wall2" },
    { id: "gold", name: "Gold", floor: "floor3", wall: "wall3" },
    { id: "void", name: "Void", floor: "floor2", wall: "wall4" },
    { id: "lattice", name: "Lattice", floor: "floor", wall: "wall4" }
  ];
  const FOE = {
    wraith: { hp: 1, dmg: 12, speed: 1.7, melee: false, pts: 10 },
    brute: { hp: 1, dmg: 7, speed: 1.5, melee: true, pts: 8 },
    imp: { hp: 1, dmg: 9, speed: 1.3, melee: true, shoot: true, pts: 12 },
    hurler: { hp: 1, dmg: 10, speed: 1.1, melee: true, lob: true, pts: 14 },
    shade: { hp: 2, dmg: 11, speed: 1.6, melee: true, flicker: true, pts: 16 },
    thief: { hp: 2, dmg: 4, speed: 2.4, melee: true, steal: true, pts: 50 },
    burst: { hp: 2, dmg: 8, speed: 1.65, melee: true, explode: true, pts: 18, spr: "brute" },
    spawnling: { hp: 1, dmg: 6, speed: 2.05, melee: true, split: true, pts: 14, spr: "wraith" },
    mend: { hp: 2, dmg: 5, speed: 1.15, melee: true, heal: true, pts: 16, spr: "shade" },
    drain: { hp: 99, dmg: 4, speed: 1.35, melee: true, drain: true, ghost: true, pts: 250 },
    gate: { hp: 28, dmg: 16, speed: 0.85, melee: true, pts: 400, boss: true },
    crown: { hp: 30, dmg: 15, speed: 0.9, melee: true, lob: true, pts: 450, boss: true },
    smith: { hp: 32, dmg: 18, speed: 0.8, melee: true, shoot: true, pts: 500, boss: true },
    heartboss: { hp: 34, dmg: 14, speed: 0.95, melee: true, pts: 520, boss: true },
    levi: { hp: 36, dmg: 16, speed: 1.05, melee: true, ghost: true, pts: 560, boss: true },
    tithe: { hp: 30, dmg: 12, speed: 1.2, melee: true, steal: true, pts: 540, boss: true },
    unnamer: { hp: 40, dmg: 10, speed: 1.1, melee: true, drain: true, ghost: true, pts: 800, boss: true },
    lock: { hp: 48, dmg: 18, speed: 0.75, melee: true, shoot: true, pts: 1000, boss: true },
    unspool: { hp: 96, dmg: 22, speed: 0.68, melee: true, radial: true, shoot: true, pts: 2800, boss: true, super: true, spr: "lock" },
    titheking: { hp: 88, dmg: 17, speed: 0.92, melee: true, pull: true, lob: true, steal: true, pts: 2600, boss: true, super: true, spr: "tithe" },
    nameeater: { hp: 110, dmg: 15, speed: 1.12, melee: true, blink: true, silence: true, drain: true, ghost: true, pts: 3200, boss: true, super: true, spr: "unnamer" },
    stitch: { hp: 2, dmg: 6, speed: 1.22, melee: true, slow: true, pts: 18, spr: "brute" },
    echoer: { hp: 1, dmg: 8, speed: 1.38, melee: true, shoot: true, echo: true, pts: 16, spr: "imp" },
    veilkin: { hp: 2, dmg: 10, speed: 1.88, melee: true, flicker: true, ghost: true, pts: 20, spr: "shade" },
    knot: { hp: 2, dmg: 9, speed: 0.92, melee: true, lob: true, root: true, pts: 18, spr: "hurler" },
    choir: { hp: 2, dmg: 5, speed: 1.18, melee: true, hymn: true, pts: 17, spr: "wraith" }
  };
  const BOSS_NAME = {
    lock: "The Lock", unspool: "The Unspooler", titheking: "The Tithe-King", nameeater: "The Name-Eater"
  };
  const KEYS_P = [
    { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD", fire: ["KeyJ"], mag: ["KeyK", "ShiftLeft"], cycle: ["KeyQ"] },
    { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", fire: ["Semicolon", "Numpad1"], mag: ["Quote", "Numpad2"], cycle: ["Period"] },
    { up: "KeyT", down: "KeyG", left: "KeyF", right: "KeyH", fire: ["KeyR"], mag: ["KeyY"], cycle: ["KeyU"] },
    { up: "Numpad8", down: "Numpad5", left: "Numpad4", right: "Numpad6", fire: ["Numpad0"], mag: ["NumpadEnter"], cycle: ["Numpad7"] }
  ];
  const PLAY_CODES = new Set([
    "KeyW", "KeyA", "KeyS", "KeyD", "KeyJ", "KeyK", "ShiftLeft", "Space",
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Semicolon", "Quote",
    "KeyT", "KeyG", "KeyF", "KeyH", "KeyR", "KeyY",
    "Numpad8", "Numpad5", "Numpad4", "Numpad6", "Numpad0", "Numpad1", "Numpad2", "NumpadEnter", "Enter", "KeyL",
    "KeyQ", "Period", "KeyU", "Numpad7", "KeyC"
  ]);
  const RITES = [
    { id: "", name: "Open door", need: 0, line: "No rite. The crypt as it stands." },
    { id: "ember", name: "Ember Step", need: 2, line: "Start with Swift and one stride." },
    { id: "well", name: "Deeper Well", need: 3, line: "+40 max health at the door." },
    { id: "glass", name: "Second Glass", need: 3, line: "One extra vial in hand." },
    { id: "lens", name: "Keen Lens", need: 5, line: "Bolts pierce one body deeper." },
    { id: "lantern", name: "Quiet Lantern", need: 5, line: "The fog starts a step thinner." },
    { id: "tithe", name: "Tithe Pocket", need: 8, line: "Kills score 12% more." }
  ];
  const touchIn = { x: 0, y: 0, fire: false, mag: false, dash: false };
  const PICK = {
    food: { heal: 85, score: 100, say: "rations.", glow: "rgba(196,70,50,0.5)" },
    flask: { heal: 165, score: 100, say: "flask.", glow: "rgba(56,189,248,0.5)", smash: "flask" },
    poison: { special: "poison", glow: "rgba(74,222,128,0.45)", smash: "poison" },
    key: { keys: 1, score: 50, glow: "rgba(250,204,21,0.5)", spin: 1 },
    latch: { keys: 1, score: 70, say: "latch-key.", glow: "rgba(186,230,253,0.5)", spin: 1 },
    chest: { special: "chest", score: 200, glow: "rgba(251,191,36,0.55)", rare: 1 },
    vial: { vials: 1, score: 50, say: "Vial.", glow: "rgba(192,132,252,0.5)", smash: "vial" },
    phial: { vials: 2, score: 90, say: "Phial — two vials.", glow: "rgba(45,212,191,0.5)" },
    chalice: { vials: 3, score: 110, say: "Chalice — three vials.", glow: "rgba(168,85,247,0.55)", rare: 1 },
    trap: { special: "trap", glow: "rgba(127,29,29,0.4)" },
    codex: { shotBoost: 14, score: 80, say: "Shot Codex.", glow: "rgba(250,204,21,0.5)" },
    tome: { shotBoost: 20, vialPow: 1, score: 100, say: "Accord tome.", glow: "rgba(192,132,252,0.55)", rare: 1 },
    swift: { swift: 12, score: 80, say: "Swift.", glow: "rgba(74,222,128,0.5)" },
    boot: { stride: 1, swift: 8, score: 90, say: "Stride boots.", glow: "rgba(74,222,128,0.5)" },
    aegis: { aegis: 14, score: 80, say: "Aegis.", glow: "rgba(34,211,238,0.5)" },
    ward: { aegis: 22, score: 90, say: "Ward.", glow: "rgba(34,211,238,0.55)" },
    grit: { aegis: 10, iron: 1, score: 80, say: "Grit — plate holds.", glow: "rgba(148,163,184,0.45)" },
    veil: { veil: 8, score: 80, say: "Veil.", glow: "rgba(226,232,240,0.45)" },
    moon: { veil: 12, swift: 8, score: 100, say: "Moon veil.", glow: "rgba(191,219,254,0.5)", rare: 1 },
    reflect: { reflect: 10, score: 80, say: "Reflect.", glow: "rgba(147,197,253,0.5)" },
    ring: { reflect: 10, aegis: 10, score: 110, say: "Accord ring.", glow: "rgba(250,204,21,0.55)", spin: 1, rare: 1 },
    pulse: { special: "pulse", score: 80, glow: "rgba(250,204,21,0.5)" },
    frostorb: { special: "frostorb", score: 90, glow: "rgba(125,211,252,0.55)", rare: 1 },
    hymnstone: { special: "hymn", score: 90, glow: "rgba(103,232,249,0.55)" },
    sun: { special: "sun", score: 100, glow: "rgba(251,191,36,0.55)", rare: 1 },
    storm: { special: "storm", score: 100, glow: "rgba(147,197,253,0.55)", rare: 1 },
    bomb: { special: "bomb", score: 80, glow: "rgba(239,68,68,0.5)", smash: "bomb" },
    warp: { special: "warp", score: 40, glow: "rgba(147,51,234,0.5)" },
    scroll: { special: "scroll", score: 70, glow: "rgba(253,230,138,0.5)" },
    lantern: { special: "lantern", score: 80, glow: "rgba(251,191,36,0.55)" },
    dice: { special: "dice", score: 40, glow: "rgba(248,250,252,0.45)", spin: 1 },
    core: { cores: 1, score: 120, say: "Core.", glow: "rgba(255,80,60,0.55)", rare: 1 },
    crystal: { cores: 1, score: 100, say: "Crystal core.", glow: "rgba(34,211,238,0.55)", spin: 1 },
    spark: { cores: 1, score: 80, say: "Spark.", glow: "rgba(253,224,71,0.5)", spin: 1 },
    heart: { max: 80, score: 100, say: "Heart — deeper well.", glow: "rgba(239,68,68,0.55)", rare: 1 },
    soul: { max: 50, heal: 50, score: 90, say: "Soul-well.", glow: "rgba(191,219,254,0.5)", rare: 1 },
    iron: { iron: 1, score: 100, say: "Iron.", glow: "rgba(148,163,184,0.45)" },
    anvil: { iron: 1, score: 110, say: "Anvil-iron.", glow: "rgba(148,163,184,0.5)" },
    lens: { pierce: 1, score: 90, say: "Lens — bolts pass deeper.", glow: "rgba(186,230,253,0.5)" },
    quiver: { extraCap: 1, score: 90, say: "Quiver — one more live bolt.", glow: "rgba(251,146,60,0.5)" },
    magnet: { magnet: 0.5, score: 80, say: "Pull.", glow: "rgba(248,113,113,0.5)" },
    thorns: { thorns: 14, score: 80, say: "Thorns — bumpers bleed.", glow: "rgba(74,222,128,0.5)" },
    fury: { fury: 12, score: 90, say: "Fury — shots bite.", glow: "rgba(239,68,68,0.55)" },
    echo: { echo: 14, score: 90, say: "Echo — bolts linger.", glow: "rgba(147,197,253,0.5)" },
    moss: { regen: 14, score: 70, say: "Moss — the well seeps back.", glow: "rgba(74,222,128,0.5)" },
    weave: { regen: 22, score: 90, say: "Weave — slow mend.", glow: "rgba(253,224,71,0.5)", rare: 1 },
    berry: { heal: 32, score: 40, say: "lattice berry.", glow: "rgba(190,40,70,0.45)" },
    bread: { heal: 120, score: 80, say: "bread.", glow: "rgba(217,160,70,0.45)" },
    feast: { heal: 240, max: 20, score: 120, say: "a feast of the Accord.", glow: "rgba(251,191,36,0.55)", rare: 1 },
    nectar: { heal: 65, vials: 1, score: 90, say: "nectar of the weave.", glow: "rgba(250,204,21,0.5)" },
    elixir: { heal: 9999, score: 140, say: "elixir — well restored.", glow: "rgba(45,212,191,0.55)", rare: 1 },
    scrap: { heal: 40, score: 30, say: "scrap rations.", glow: "rgba(148,163,184,0.35)" },
    seed: { heal: 32, stride: 1, score: 60, say: "seed-stride.", glow: "rgba(74,222,128,0.45)" },
    coin: { score: 50, say: "coin.", glow: "rgba(250,204,21,0.5)", spin: 2 },
    gem: { score: 180, say: "gem.", glow: "rgba(56,189,248,0.55)", spin: 2, rare: 1 },
    crown: { cores: 1, score: 200, say: "Crown of the lock.", glow: "rgba(251,191,36,0.6)", rare: 1 },
    fan: { glow: "rgba(249,115,22,0.5)", spin: 1 },
    needle: { glow: "rgba(34,211,238,0.5)" },
    cinder: { glow: "rgba(249,115,22,0.5)" },
    comet: { glow: "rgba(96,165,250,0.5)" },
    halo: { glow: "rgba(253,224,71,0.5)", spin: 1 },
    cleave: { glow: "rgba(248,113,113,0.5)" },
    orbit: { glow: "rgba(226,232,240,0.45)", spin: 2 },
    aura: { glow: "rgba(74,222,128,0.5)" },
    prism: { glow: "rgba(251,191,36,0.55)", spin: 1, rarity: 1, say: "Prism — five-way light." },
    thornlance: { glow: "rgba(74,222,128,0.55)", rarity: 1, say: "Thornlance — the beam does not stop." },
    sunbolt: { glow: "rgba(249,115,22,0.6)", rarity: 2, say: "Sunbolt — a coal of the first fire." },
    voidlob: { glow: "rgba(124,58,237,0.6)", rarity: 2, say: "Voidlob — ice that unnames." },
    starwheel: { glow: "rgba(253,224,71,0.6)", spin: 2, rarity: 1, say: "Starwheel — more wards in orbit." },
    riftcleave: { glow: "rgba(248,113,113,0.6)", rarity: 1, say: "Riftcleave — a longer tooth." },
    gyre: { glow: "rgba(226,232,240,0.6)", spin: 2, rarity: 2, say: "Gyre — the blades remember a wider ring." },
    hymnfield: { glow: "rgba(103,232,249,0.55)", rarity: 1, say: "Hymnfield — the song has reach." },
    truthseek: { glow: "rgba(196,181,253,0.6)", rarity: 2, say: "Truthseek — it will not miss a lie." },
    latticearc: { glow: "rgba(34,211,238,0.7)", spin: 1, rarity: 3, say: "Lattice Arc — a legendary jump of light." },
    sigilplate: { iron: 2, aegis: 18, score: 160, rarity: 1, say: "Sigilplate — two irons, a held Aegis." },
    wellcrown: { max: 140, vials: 2, score: 220, rarity: 2, say: "Wellcrown — a deeper well, two vials." },
    namelamp: { lamp: 2, score: 150, rarity: 1, say: "Namelamp — the fog yields twice." },
    truthlens: { pierce: 2, cores: 1, score: 180, rarity: 2, say: "Truthlens — bolts pass, a core wakes." },
    stormquill: { extraCap: 2, shotBoost: 16, score: 160, rarity: 1, say: "Stormquill — more live bolts, faster hand." },
    weaveheart: { regen: 28, max: 60, score: 200, rarity: 2, say: "Weaveheart — the well seeps and deepens." },
    triadkey: { keys: 3, score: 140, rarity: 1, say: "Triad key — three teeth for the lock." },
    voidcloak: { veil: 16, swift: 14, score: 200, rarity: 2, say: "Voidcloak — unseen, already gone." },
    titheband: { magnet: 1.1, score: 150, rarity: 1, say: "Titheband — the floor pays you." },
    starbread: { heal: 400, max: 40, score: 160, rarity: 1, say: "Starbread — a rare feast." },
    chorusflask: { vials: 4, heal: 80, score: 210, rarity: 2, say: "Chorus flask — four vials, a sip of chorus." },
    geodesic: { special: "geodesic", score: 160, rarity: 1, glow: "rgba(45,212,191,0.55)", say: "Geodesic — the shortest true line." },
    unwriteink: { special: "unwrite", score: 220, rarity: 2, glow: "rgba(192,132,252,0.65)", say: "Unwrite-ink — names come off the stone." },
    accordseal: { special: "accordseal", score: 400, rarity: 3, glow: "rgba(251,191,36,0.75)", spin: 2, say: "Accord Seal — legendary Δ9 lock." },
    originwell: { heal: 9999, max: 200, vials: 3, lamp: 1, score: 450, rarity: 3, glow: "rgba(253,224,71,0.8)", spin: 2, say: "Origin Well — legendary restoration." }
  };
  const BAG = [
    "food", "berry", "scrap", "flask", "coin", "key",
    "chest", "chest", "key", "key", "latch", "vial", "vial", "poison", "poison",
    "codex", "swift", "aegis", "veil", "pulse", "warp", "reflect", "ward", "grit",
    "coin", "coin", "coin", "gem", "boot", "lens", "magnet", "fury", "thorns", "moss", "echo",
    "core", "heart", "iron", "phial", "crystal", "spark", "seed", "scroll", "lantern", "dice",
    "bomb", "frostorb", "hymnstone", "quiver",
    "fan", "needle", "cinder", "comet", "halo", "cleave", "orbit", "aura", "seek", "chain", "barrage", "nova",
    "feast", "elixir", "chalice", "tome", "ring", "moon", "sun", "storm", "crown", "soul", "anvil", "weave"
  ];
  const CHEST_DROP = ["fan", "needle", "cinder", "core", "heart", "cleave", "orbit", "aura", "comet", "halo", "seek", "chain", "barrage", "nova", "elixir", "crown", "chalice", "tome", "ring", "crystal", "phial", "iron", "prism", "thornlance", "riftcleave", "starwheel", "hymnfield", "sigilplate", "starbread", "triadkey"];
  const LOOT_RARE = ["prism", "thornlance", "starwheel", "riftcleave", "hymnfield", "sigilplate", "namelamp", "stormquill", "triadkey", "titheband", "starbread", "geodesic"];
  const LOOT_SUPER = ["sunbolt", "voidlob", "gyre", "truthseek", "wellcrown", "truthlens", "weaveheart", "voidcloak", "chorusflask", "unwriteink"];
  const LOOT_LEGEN = ["latticearc", "accordseal", "originwell"];
  function rollLoot(R) {
    const rnd = R || Math.random;
    const u = rnd();
    let k;
    if (u < 0.012) k = LOOT_LEGEN[(rnd() * LOOT_LEGEN.length) | 0];
    else if (u < 0.05) k = LOOT_SUPER[(rnd() * LOOT_SUPER.length) | 0];
    else if (u < 0.18) k = LOOT_RARE[(rnd() * LOOT_RARE.length) | 0];
    else k = BAG[(rnd() * BAG.length) | 0];
    const heal = k === "food" || k === "flask" || k === "berry" || k === "bread" || k === "scrap" || k === "nectar" || k === "feast" || k === "elixir" || k === "soul" || k === "seed" || k === "starbread" || k === "heart" || k === "chorusflask";
    if (heal && rnd() < 0.34) {
      const swap = ["coin", "key", "moss", "iron", "vial"];
      k = swap[(rnd() * swap.length) | 0];
    }
    return k;
  }
  const WEAPONS = {
    shard: { name: "Shard", cap: 2, spd: 12, life: 1.2, cool: 0.2, dmg: 0 },
    fan: { name: "Fan", cap: 3, spd: 11, life: 0.55, cool: 0.2, dmg: -1, spread: 0.38 },
    needle: { name: "Needle", cap: 2, spd: 16, life: 1.3, cool: 0.16, dmg: 1, pierce: 2 },
    cinder: { name: "Cinder", cap: 2, spd: 9, life: 0.55, cool: 0.16, dmg: 1, flame: 1.8 },
    comet: { name: "Comet", cap: 1, spd: 7.6, life: 1.5, cool: 0.32, dmg: 3, lob: true },
    halo: { name: "Halo", cap: 2, spd: 12, life: 1.15, cool: 0.22, dmg: 0, halo: true },
    cleave: { name: "Cleave", melee: true, cool: 0.42, dmg: 2, range: 1.5 },
    orbit: { name: "Orbit", melee: true, cool: 0, dmg: 2 },
    aura: { name: "Aura", melee: true, cool: 0, dmg: 3 },
    seek: { name: "Seek", cap: 2, spd: 9.5, life: 1.35, cool: 0.24, dmg: 1, seek: true },
    chain: { name: "Chain", cap: 2, spd: 13, life: 0.9, cool: 0.2, dmg: 0, chain: true, pierce: 1 },
    barrage: { name: "Barrage", cap: 4, spd: 13, life: 0.45, cool: 0.1, dmg: -1 },
    nova: { name: "Nova", cap: 1, spd: 8, life: 0.7, cool: 0.36, dmg: 2, nova: true },
    prism: { name: "Prism", cap: 5, spd: 12, life: 0.5, cool: 0.22, dmg: 0, spread: 0.52 },
    thornlance: { name: "Thornlance", cap: 2, spd: 18, life: 1.45, cool: 0.15, dmg: 2, pierce: 4 },
    sunbolt: { name: "Sunbolt", cap: 2, spd: 10, life: 0.7, cool: 0.14, dmg: 3, flame: 2.8 },
    voidlob: { name: "Voidlob", cap: 1, spd: 8.2, life: 1.55, cool: 0.3, dmg: 4, lob: true, nova: true },
    starwheel: { name: "Starwheel", cap: 2, spd: 12, life: 1.2, cool: 0.2, dmg: 1, halo: true, haloN: 2 },
    riftcleave: { name: "Riftcleave", melee: true, cleave: true, cool: 0.36, dmg: 4, range: 2.15 },
    gyre: { name: "Gyre", melee: true, orbit: true, cool: 0, dmg: 3 },
    hymnfield: { name: "Hymnfield", melee: true, aura: true, cool: 0, dmg: 4 },
    truthseek: { name: "Truthseek", cap: 3, spd: 11, life: 1.5, cool: 0.18, dmg: 2, seek: true, pierce: 2 },
    latticearc: { name: "Lattice Arc", cap: 3, spd: 15, life: 1.05, cool: 0.16, dmg: 3, chain: true, pierce: 2 }
  };
  const SEAL_GIFT = ["fan", "comet", "cinder", "needle", "halo", "core", "phial", "iron"];
  const KINDS = ["wraith", "brute", "imp", "hurler", "shade"];
  const KINDS_NEW = ["stitch", "echoer", "veilkin", "knot", "choir"];
  const KINDS_HOT = ["wraith", "brute", "imp", "hurler", "shade", "burst", "spawnling", "mend", "stitch", "echoer", "veilkin", "knot", "choir"];
  const PETS = {
    wolf: { name: "Ashmane", tag: "Dash · Bite", hp: 96, armor: 2, speed: 3.9, col: "#94a3b8" },
    lion: { name: "Solstride", tag: "Jump · Roar · Claw", hp: 110, armor: 2, speed: 3.55, col: "#fbbf24" },
    bear: { name: "Ironhide", tag: "Swipe · Maul", hp: 180, armor: 5, speed: 2.35, col: "#fb923c" },
    elephant: { name: "Tuskward", tag: "Stomp", hp: 155, armor: 4, speed: 2.15, col: "#67e8f9" },
    scorpion: { name: "Glassbarb", tag: "Clamp · Tail", hp: 88, armor: 3, speed: 2.95, col: "#c4b5fd" }
  };
  const INV_BAG = 24;
  const INV_WEP = 6;
  const INV_RELIC = 4;
  function itemCat(kind) {
    if (WEAPONS[kind]) return "wep";
    if (["food", "flask", "berry", "bread", "feast", "elixir", "scrap", "nectar", "soul", "vial", "phial", "chalice", "bomb", "warp", "scroll", "dice", "starbread", "chorusflask", "originwell", "geodesic", "unwriteink", "accordseal"].indexOf(kind) >= 0) return "use";
    if (kind === "coin" || kind === "gem") return "gold";
    if (kind === "key" || kind === "latch") return "pack";
    return "relic";
  }
  function itemLabel(kind) {
    if (WEAPONS[kind]) return WEAPONS[kind].name;
    const s = PICK[kind];
    if (s && s.say) return s.say.replace(/\.$/, "").replace(/^./, function (c) { return c.toUpperCase(); });
    return kind;
  }

  const $ = (id) => document.getElementById(id);
  const canvas = $("crypt");
  const bgCanvas = $("cryptBg");
  const ctx = canvas.getContext("2d", { alpha: !!bgCanvas });
  ctx.imageSmoothingEnabled = false;
  let drawTarget = ctx;
  const blitCache = new Map();
  function blit(img, sx, sy, sw, sh, dx, dy, dw, dh) {
    const dest = drawTarget || ctx;
    if (!img || !dest) return;
    dw = dw | 0; dh = dh | 0;
    const key = (img.src || "x") + ":" + sx + "," + sy + "," + sw + ":" + dw;
    let c = blitCache.get(key);
    if (!c) {
      c = document.createElement("canvas");
      c.width = Math.max(1, dw); c.height = Math.max(1, dh);
      const cctx = c.getContext("2d");
      cctx.imageSmoothingEnabled = false;
      cctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
      blitCache.set(key, c);
      if (blitCache.size > 420) blitCache.delete(blitCache.keys().next().value);
    }
    dest.drawImage(c, Math.round(dx), Math.round(dy));
  }
  function emit(ev, p) { if (window.CryptStudio) CryptStudio.emit(ev, p); }
  function pushShot(init) {
    const s = window.CryptStudio ? CryptStudio.pool.shot.alloc() : {};
    s.x = init.x; s.y = init.y; s.px = init.px != null ? init.px : init.x; s.py = init.py != null ? init.py : init.y;
    s.vx = init.vx || 0; s.vy = init.vy || 0;
    s.dmg = init.dmg || 1; s.owner = init.owner || null; s.life = init.life; s.maxLife = init.maxLife || init.life;
    s.grace = init.grace || 0; s.hero = init.hero || "kael"; s.wep = init.wep || "shard";
    s.foe = !!init.foe; s.bounced = false; s.pierce = init.pierce || 0; s.lob = !!init.lob;
    s.flame = init.flame || 0; s.echo = !!init.echo; s.air = !!init.air;
    s.seek = !!init.seek; s.chain = !!init.chain; s.nova = !!init.nova;
    s._chained = false;
    s.trail = init.trail || [{ x: s.x, y: s.y }];
    s.isActive = true;
    G.shots.push(s);
    return s;
  }

  let atlas = null, names = {}, cell = 32, cols = 16;
  let foeAtlas = null, foeNames = {}, foeCell = 64, foeCols = 8;
  let heroAtlas = null, heroNames = {}, heroCell = 64, heroCols = 8;
  let tileAtlas = null, tileNames = {}, tileCell = 32, tileCols = 16;
  let fxAtlas = null, fxNames = {}, fxCell = 32, fxCols = 8;
  let itemAtlas = null, itemNames = {}, itemCell = 32, itemCols = 8;
  let petAtlas = null, petNames = {}, petCell = 64, petCols = 8;
  const WEP_LOOK = {
    shard: { size: 28, col: "#fbbf24", glow: "rgba(251,191,36,0.38)" },
    fan: { size: 26, col: "#fb923c", glow: "rgba(249,115,22,0.38)" },
    needle: { size: 32, col: "#22d3ee", glow: "rgba(34,211,238,0.4)" },
    cinder: { size: 28, col: "#f97316", glow: "rgba(239,68,68,0.4)" },
    comet: { size: 30, col: "#60a5fa", glow: "rgba(96,165,250,0.4)" },
    halo: { size: 30, col: "#fde68a", glow: "rgba(253,224,71,0.42)" },
    imp: { size: 22, col: "#f87171", glow: "rgba(239,68,68,0.4)" },
    hurler: { size: 24, col: "#94a3b8", glow: "rgba(148,163,184,0.35)" },
    cleave: { size: 26, col: "#f87171", glow: "rgba(248,113,113,0.4)" },
    orbit: { size: 22, col: "#e2e8f0", glow: "rgba(226,232,240,0.35)" },
    aura: { size: 24, col: "#4ade80", glow: "rgba(74,222,128,0.35)" },
    seek: { size: 26, col: "#c4b5fd", glow: "rgba(196,181,253,0.4)" },
    chain: { size: 30, col: "#67e8f9", glow: "rgba(103,232,249,0.4)" },
    barrage: { size: 22, col: "#fdba74", glow: "rgba(253,186,116,0.38)" },
    nova: { size: 30, col: "#f472b6", glow: "rgba(244,114,182,0.4)" },
    prism: { size: 26, col: "#fde68a", glow: "rgba(253,224,71,0.45)" },
    thornlance: { size: 34, col: "#4ade80", glow: "rgba(74,222,128,0.45)" },
    sunbolt: { size: 30, col: "#fb923c", glow: "rgba(251,146,60,0.5)" },
    voidlob: { size: 32, col: "#a78bfa", glow: "rgba(167,139,250,0.5)" },
    starwheel: { size: 30, col: "#facc15", glow: "rgba(250,204,21,0.48)" },
    riftcleave: { size: 28, col: "#fb7185", glow: "rgba(251,113,133,0.45)" },
    gyre: { size: 24, col: "#e0f2fe", glow: "rgba(224,242,254,0.45)" },
    hymnfield: { size: 26, col: "#67e8f9", glow: "rgba(103,232,249,0.45)" },
    truthseek: { size: 28, col: "#c4b5fd", glow: "rgba(196,181,253,0.5)" },
    latticearc: { size: 34, col: "#22d3ee", glow: "rgba(34,211,238,0.55)" }
  };
  const BOSS_LOOT = {
    gate: ["core", "heart", "ward"],
    crown: ["comet", "swift", "frostorb"],
    smith: ["cinder", "iron", "fury"],
    heartboss: ["heart", "phial", "moss"],
    levi: ["halo", "aegis", "echo"],
    tithe: ["chest", "core", "gem"],
    unnamer: ["vial", "phial", "soul"],
    lock: ["iron", "codex", "crown"],
    unspool: ["latticearc", "sunbolt", "accordseal"],
    titheking: ["wellcrown", "voidlob", "titheband"],
    nameeater: ["originwell", "voidcloak", "truthseek"]
  };
  let keys = {};
  let keyEdge = {};
  let bindWait = null;
  let tileCache = null, tileCacheKey = "";
  let G = null;
  let overlayMode = "menu";
  let announce = { t: "", life: 0 };
  let persist = { name: "Warden", best: 0, runs: 0, hero: "kael", autoShot: false, autoUp: false, campaignBest: 0, unlocked: ["kael", "vale", "orin", "nia"] };
  let cam = { x: 0, y: 0 };
  let actx = null;

  function loadPersist() {
    try { Object.assign(persist, JSON.parse(localStorage.getItem(SAVE) || "{}")); } catch (_) {}
    if (!Array.isArray(persist.unlocked) || persist.unlocked.length < 4) persist.unlocked = ["kael", "vale", "orin", "nia"];
    HEROES.forEach((h) => {
      if (h.unlock === 0 && persist.unlocked.indexOf(h.id) < 0) persist.unlocked.push(h.id);
    });
    if (persist.cb) document.documentElement.setAttribute("data-cb", persist.cb);
    else document.documentElement.removeAttribute("data-cb");
    if (persist.comp == null) persist.comp = "";
    if (persist.pet == null) persist.pet = "";
    if (persist.autoUp == null) persist.autoUp = false;
    if (persist.seals == null) persist.seals = 0;
    if (persist.rite == null) persist.rite = "";
    if (persist.touchPad == null) persist.touchPad = "auto";
    if (!riteOwned(riteDef(persist.rite))) persist.rite = "";
  }
  function savePersist() { localStorage.setItem(SAVE, JSON.stringify(persist)); }

  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function heroOf(id) { return HEROES.find((h) => h.id === id) || HEROES[0]; }

  function beep(kind) {
    if (window.CryptStudio) { CryptStudio.sfx(kind); return; }
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.connect(g); g.connect(actx.destination);
      const now = actx.currentTime;
      const map = { shot: [620, 0.05], hit: [180, 0.07], vial: [240, 0.18], pick: [880, 0.06], hurt: [90, 0.12], pad: [320, 0.08] };
      const m = map[kind] || [440, 0.05];
      o.frequency.value = m[0];
      o.type = kind === "shot" ? "square" : "triangle";
      g.gain.setValueAtTime(0.04, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + m[1]);
      o.start(now); o.stop(now + m[1] + 0.02);
    } catch (_) {}
  }
  function say(t) { announce = { t: t, life: 2.4 }; log(t); }
  function log(t) {
    if (!G) return;
    G.log.unshift(t);
    G.log = G.log.slice(0, 40);
    const el = $("log");
    if (el) el.innerHTML = G.log.slice(0, 12).map((x) => "<div>" + String(x).replace(/</g, "") + "</div>").join("");
  }

  function spr(name) {
    const i = names[name];
    if (i == null) return null;
    return { sx: (i % cols) * cell, sy: Math.floor(i / cols) * cell };
  }
  function drawSpr(name, x, y, w) {
    let s = spr(name);
    if (!s && name.indexOf("hero_") === 0) s = spr(name.replace(/hero_[^_]+/, "hero_kael"));
    if (!s || !atlas) return;
    w = w || TILE;
    blit(atlas, s.sx, s.sy, cell, cell, x, y, w, w);
  }
  function drawTile(name, x, y) {
    const i = tileNames[name];
    const dw = TILE + 1;
    if (i == null || !tileAtlas) {
      drawSpr(name, x, y, dw);
      return;
    }
    const sx = (i % tileCols) * tileCell, sy = Math.floor(i / tileCols) * tileCell;
    blit(tileAtlas, sx, sy, tileCell, tileCell, x, y, dw, dw);
  }
  function floorName(z, x, y) {
    return z + "_f" + ((x & 3) + ((y & 3) << 2));
  }
  function drawFxSpr(name, x, y, w) {
    const i = fxNames[name];
    w = w || 32;
    if (i == null || !fxAtlas) {
      drawSpr(name, x, y, w);
      return;
    }
    const sx = (i % fxCols) * fxCell, sy = Math.floor(i / fxCols) * fxCell;
    blit(fxAtlas, sx, sy, fxCell, fxCell, x, y, w, w);
  }
  function drawItemSpr(name, x, y, w) {
    const i = itemNames[name];
    w = w || 32;
    if (i == null || !itemAtlas) {
      const base = name.replace(/_[01]$/, "");
      drawSpr(base, x, y, w);
      return;
    }
    const sx = (i % itemCols) * itemCell, sy = Math.floor(i / itemCols) * itemCell;
    blit(itemAtlas, sx, sy, itemCell, itemCell, x, y, w, w);
  }
  function drawItem(it) {
    const spec = PICK[it.kind] || {};
    const t = (G ? G.t : 0) + it.x * 0.73 + it.y * 0.41;
    const bob = Math.sin(t * 3.6) * 3.6;
    const fr = ((t * 5.4) | 0) % 2;
    const cx = it.x * TILE + TILE / 2 - cam.x;
    const cy = it.y * TILE + TILE / 2 - cam.y;
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 11, 9, 3.2, 0, 0, 6.28);
    ctx.fill();
    const rarity = spec.rarity || spec.rare || 0;
    ctx.globalAlpha = 0.2 + 0.18 * (0.5 + 0.5 * Math.sin(t * 5.1));
    ctx.fillStyle = spec.glow || "rgba(251,191,36,0.4)";
    ctx.beginPath();
    ctx.arc(cx, cy + bob, rarity >= 3 ? 20 : (rarity >= 2 ? 17 : (rarity ? 16 : 13)), 0, 6.28);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (rarity || spec.spin) {
      const sparks = rarity >= 3 ? 6 : (rarity >= 2 ? 5 : 3);
      for (let n = 0; n < sparks; n++) {
        const a = t * (2.4 + rarity) + n * (6.28 / sparks);
        ctx.fillStyle = rarity >= 3 ? "#fde68a" : "rgba(255,255,230,0.75)";
        ctx.fillRect(Math.round(cx + Math.cos(a) * (13 + rarity * 2)), Math.round(cy + bob + Math.sin(a) * (10 + rarity)), rarity >= 2 ? 3 : 2, rarity >= 2 ? 3 : 2);
      }
    }
    ctx.save();
    ctx.translate(cx, cy + bob);
    if (spec.spin) ctx.rotate(t * (spec.spin === 2 ? 3.6 : 1.8));
    const vis = { seek: "comet", chain: "needle", barrage: "fan", nova: "pulse",
      prism: "fan", thornlance: "needle", sunbolt: "cinder", voidlob: "comet", starwheel: "halo",
      riftcleave: "cleave", gyre: "orbit", hymnfield: "aura", truthseek: "comet", latticearc: "needle",
      sigilplate: "iron", wellcrown: "heart", namelamp: "lantern", truthlens: "lens", stormquill: "quiver",
      weaveheart: "weave", triadkey: "key", voidcloak: "veil", titheband: "magnet", starbread: "feast",
      chorusflask: "chalice", geodesic: "warp", unwriteink: "pulse", accordseal: "crown", originwell: "soul" };
    drawItemSpr((vis[it.kind] || it.kind) + "_" + fr, -16, -16, 32);
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
  }
  function wepKey(s) {
    if (s.foe) return s.hero === "hurler" ? "hurler" : "imp";
    return s.wep && WEP_LOOK[s.wep] ? s.wep : "shard";
  }
  function drawShot(s) {
    const wep = wepKey(s);
    const L = WEP_LOOK[wep] || WEP_LOOK.shard;
    const px = s.x * TILE - cam.x, py = s.y * TILE - cam.y;
    if (px < -40 || py < -40 || px > canvas.clientWidth + 40 || py > canvas.clientHeight + 40) return;
    const u = 1 - s.life / Math.max(0.05, s.maxLife || 1.2);
    const lift = s.lob ? Math.sin(u * Math.PI) * 22 : 0;
    if (s.lob) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(px, py + 5, 8, 3.2, 0, 0, 6.28);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const tr = lodOn() ? [] : (s.trail || []);
    tr.forEach((t, i) => {
      const a = (i + 1) / tr.length;
      ctx.globalAlpha = a * 0.55;
      const tx = t.x * TILE - cam.x, ty = t.y * TILE - cam.y;
      if (wep === "needle" && i) {
        const p = tr[i - 1];
        ctx.strokeStyle = L.col;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(p.x * TILE - cam.x, p.y * TILE - cam.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      } else {
        ctx.fillStyle = L.col;
        const r = wep === "cinder" ? 3.4 + a * 2 : (wep === "comet" ? 3 : 2.1);
        ctx.beginPath();
        ctx.arc(tx, ty, r, 0, 6.28);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = L.glow;
    ctx.beginPath();
    ctx.arc(px, py - lift, L.size * 0.42, 0, 6.28);
    ctx.fill();
    const fr = ((G.t * 14) | 0) % 4;
    const sz = L.size;
    const ang = Math.atan2(s.vy, s.vx);
    ctx.save();
    ctx.translate(px, py - lift);
    if (wep === "halo") ctx.rotate(G.t * 7);
    else if (wep === "cinder") ctx.rotate(G.t * 5);
    else if (wep !== "imp") ctx.rotate(ang);
    const fxW = { seek: "comet", chain: "needle", barrage: "fan", nova: "cinder", cleave: "shard", orbit: "shard", aura: "shard",
      prism: "fan", thornlance: "needle", sunbolt: "cinder", voidlob: "comet", starwheel: "halo",
      riftcleave: "shard", gyre: "shard", hymnfield: "shard", truthseek: "comet", latticearc: "needle" };
    drawFxSpr("bolt_" + (fxW[wep] || wep) + "_" + fr, -sz / 2, -sz / 2, sz);
    ctx.restore();
    ctx.imageSmoothingEnabled = false;
  }
  function drawVfx(f) {
    const px = f.x * TILE - cam.x, py = f.y * TILE - cam.y;
    const max = f.max || f.life;
    const u = 1 - f.life / Math.max(0.05, max);
    if (f.kind === "pick") {
      ctx.globalAlpha = Math.max(0, 1 - u);
      ctx.strokeStyle = f.col || "#fde68a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 6 + u * 18, 0, 6.28);
      ctx.stroke();
      for (let n = 0; n < 5; n++) {
        const a = u * 6 + n * 1.26;
        ctx.fillStyle = "rgba(255,255,220,0.85)";
        ctx.fillRect(Math.round(px + Math.cos(a) * (8 + u * 14)), Math.round(py + Math.sin(a) * (8 + u * 14)), 2, 2);
      }
      ctx.globalAlpha = 1;
      return;
    }
    if (f.kind === "puff") {
      const pf = Math.min(3, 3 - ((f.life * 8) | 0));
      ctx.globalAlpha = Math.max(0, f.life * 3);
      drawSpr("puff_" + pf, px - 16, py - 16);
      ctx.globalAlpha = 1;
      return;
    }
    if (f.kind === "cinder") {
      ctx.globalAlpha = Math.min(1, f.life);
      drawFxSpr("bolt_cinder_" + (((G.t * 10) | 0) % 4), px - 16, py - 18, 28);
      ctx.fillStyle = "rgba(249,115,22,0.35)";
      ctx.beginPath();
      ctx.arc(px, py, 10 + (G.t * 8 % 4), 0, 6.28);
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }
    if (f.kind === "muzzle") {
      const wep = f.wep && WEP_LOOK[f.wep] ? f.wep : "shard";
      ctx.globalAlpha = Math.max(0, f.life * 8);
      ctx.save();
      ctx.translate(px, py);
      if (f.ang) ctx.rotate(f.ang);
      drawFxSpr("mz_" + wep + "_" + (f.life > 0.06 ? 0 : 1), -18, -18, 36);
      ctx.restore();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 1;
      return;
    }
    if (f.kind === "hit") {
      const wep = f.wep && WEP_LOOK[f.wep] ? f.wep : "shard";
      const L = WEP_LOOK[wep];
      ctx.globalAlpha = Math.max(0, 1 - u);
      ctx.strokeStyle = L.col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 6 + u * 16, 0, 6.28);
      ctx.stroke();
      drawFxSpr("hit_" + wep + "_" + (u > 0.45 ? 1 : 0), px - 16, py - 16, 32);
      ctx.globalAlpha = 1;
      return;
    }
    if (f.kind === "nova") {
      const col = f.col || "#5eead4";
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.globalAlpha = (1 - u) * 0.85;
      ctx.lineWidth = 3;
      const r = 18 + u * 120;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, 6.28);
      ctx.stroke();
      ctx.globalAlpha = (1 - u) * 0.25;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.72, 0, 6.28);
      ctx.fill();
      ctx.globalAlpha = (1 - u) * 0.7;
      ctx.lineWidth = 1.5;
      const spokes = f.job === "lightfather" || f.job === "orin" ? 8 : (f.job === "kael" ? 4 : 6);
      for (let i = 0; i < spokes; i++) {
        const a = (i / spokes) * 6.28 + u * 0.8;
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(a) * 8, py + Math.sin(a) * 8);
        ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      return;
    }
    if (f.kind === "shield") {
      ctx.strokeStyle = "#22d3ee";
      ctx.globalAlpha = (1 - u) * 0.8;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px, py, 14 + u * 10, 0, 6.28);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }
    if (f.kind === "warp") {
      ctx.strokeStyle = "#c4b5fd";
      ctx.globalAlpha = (1 - u) * 0.85;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 6 + u * 22, u * 6.28, u * 6.28 + 4);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }
    if (f.kind === "slash") {
      const r = (f.r || 1.5) * TILE;
      ctx.strokeStyle = "rgba(248,113,113,0.9)";
      ctx.lineWidth = 5;
      ctx.globalAlpha = Math.max(0, f.life * 7);
      ctx.beginPath();
      ctx.arc(px, py, r, (f.ang || 0) - 0.85, (f.ang || 0) + 0.85);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }
    if (f.kind === "note") {
      ctx.fillStyle = "#67e8f9";
      ctx.globalAlpha = 1 - u;
      ctx.beginPath();
      ctx.arc(px + Math.sin(u * 8) * 8, py - u * 22, 3, 0, 6.28);
      ctx.fill();
      ctx.fillRect(px + 6, py - u * 18, 2, 8);
      ctx.globalAlpha = 1;
      return;
    }
    if (f.kind === "stomp") {
      ctx.strokeStyle = "rgba(251,191,36,0.85)";
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1 - u;
      ctx.beginPath();
      ctx.ellipse(px, py + 6, 10 + u * 38, 5 + u * 14, 0, 0, 6.28);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }
    if (f.kind === "roar") {
      ctx.strokeStyle = "rgba(251,191,36,0.7)";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1 - u;
      ctx.beginPath();
      ctx.arc(px, py, 12 + u * 36, 0, 6.28);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }
    if (f.kind === "poison") {
      ctx.fillStyle = "rgba(74,222,128,0.28)";
      ctx.globalAlpha = 1 - u * 0.4;
      ctx.beginPath();
      ctx.ellipse(px, py + 4, 16, 8, 0, 0, 6.28);
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }
    ctx.globalAlpha = Math.max(0, f.life * 2);
    ctx.strokeStyle = "#5eead4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, (1 - f.life) * 80, 0, 6.28);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function solidAt(lv, x, y) {
    const t = tileAt(lv, x, y);
    return t === "wall" || t === "door" || t === "exit_lock";
  }
  function drawFoeSpr(name, x, y, w) {
    const i = foeNames[name];
    if (i == null || !foeAtlas) {
      drawSpr(name, x, y, w);
      return;
    }
    const sx = (i % foeCols) * foeCell, sy = Math.floor(i / foeCols) * foeCell;
    w = w || foeCell;
    blit(foeAtlas, sx, sy, foeCell, foeCell, x, y, w, w);
  }
  function drawPetSpr(kind, fr, x, y, w, flip) {
    const name = "pet_" + kind + "_" + fr;
    const i = petNames[name];
    w = w || 44;
    if (i == null || !petAtlas) return;
    const sx = (i % petCols) * petCell, sy = Math.floor(i / petCols) * petCell;
    if (flip) {
      ctx.save();
      ctx.translate(Math.round(x + w), Math.round(y));
      ctx.scale(-1, 1);
      blit(petAtlas, sx, sy, petCell, petCell, 0, 0, w, w);
      ctx.restore();
      ctx.imageSmoothingEnabled = false;
    } else {
      blit(petAtlas, sx, sy, petCell, petCell, x, y, w, w);
    }
  }
  function drawHeroSpr(p, camx, camy) {
    const fr = (p.walk | 0) % 2;
    let face = p.facing;
    const flip = face === 1;
    if (face === 1) face = 2;
    let name = "hero_" + p.hero.id + "_" + face + "_" + fr;
    if (heroAtlas && heroNames[name] == null) name = "hero_" + p.hero.id + "_0_" + fr;
    const sz = 48;
    const dx = p.x * TILE - sz / 2 - camx, dy = p.y * TILE - sz / 2 - camy;
    if (heroAtlas && heroNames[name] != null) {
      const i = heroNames[name];
      const sx = (i % heroCols) * heroCell, sy = Math.floor(i / heroCols) * heroCell;
      if (flip) {
        ctx.save();
        ctx.translate(Math.round(dx + sz), Math.round(dy));
        ctx.scale(-1, 1);
        blit(heroAtlas, sx, sy, heroCell, heroCell, 0, 0, sz, sz);
        ctx.restore();
        ctx.imageSmoothingEnabled = false;
      } else {
        blit(heroAtlas, sx, sy, heroCell, heroCell, dx, dy, sz, sz);
      }
      return;
    }
    drawSpr("hero_" + p.hero.id + "_" + p.facing + "_" + fr, p.x * TILE - TILE / 2 - camx, p.y * TILE - TILE / 2 - camy);
  }
  function nearestWalk(lv, x, y) {
    const tx = Math.floor(x), ty = Math.floor(y);
    function ok(ix, iy) {
      if (!inB(lv, ix, iy)) return false;
      const t = lv.tiles[iy][ix];
      return t && t !== "wall" && t !== "door";
    }
    if (ok(tx, ty)) return { x: tx + 0.5, y: ty + 0.5 };
    for (let r = 1; r < 24; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (ok(tx + dx, ty + dy)) return { x: tx + dx + 0.5, y: ty + dy + 0.5 };
        }
      }
    }
    if (lv.start) return { x: lv.start.x + 0.5, y: lv.start.y + 0.5 };
    return { x: tx + 0.5, y: ty + 0.5 };
  }
  function unstick(ent) {
    if (!G || !blocked(G.level, ent.x, ent.y)) return;
    const p = nearestWalk(G.level, ent.x, ent.y);
    ent.x = p.x; ent.y = p.y;
  }
  function dropItemNear(x, y, kind) {
    const p = nearestWalk(G.level, x, y);
    G.level.items.push({ x: Math.floor(p.x), y: Math.floor(p.y), kind });
  }
  function dropBoss(f) {
    const loot = BOSS_LOOT[f.kind];
    if (!loot) return;
    loot.forEach((k, i) => dropItemNear(f.x + (i ? 0.35 : -0.15), f.y, k));
    say((f.kind === "lock" ? "The Lock" : "The guardian") + " yields relics.");
  }

  function surviveKind(w) {
    const L = Math.max(1, (G && G.lvl) || 1);
    if (L <= 2) return Math.random() < 0.58 ? "brute" : "wraith";
    if (L <= 4) {
      const early = ["brute", "wraith", "imp", "hurler"];
      return early[(Math.random() * early.length) | 0];
    }
    if (L >= 8 && w > 10 && Math.random() < 0.07) return "thief";
    if (L >= 6 && w > 7 && Math.random() < 0.1) return "burst";
    if (L >= 5 && w > 6 && Math.random() < 0.1) return "spawnling";
    if (L >= 6 && w > 7 && Math.random() < 0.08) return "mend";
    if (L >= 5 && Math.random() < 0.14) return KINDS_NEW[(Math.random() * KINDS_NEW.length) | 0];
    if (L >= 5 && Math.random() < 0.12) return "shade";
    const pool = L >= 5 ? KINDS_HOT : KINDS;
    return pool[(Math.random() * pool.length) | 0];
  }
  function foeHas(f, key) {
    if (!f) return false;
    if (f.mut && f.mut.indexOf(key) >= 0) return true;
    const d = FOE[f.kind];
    return !!(d && d[key]);
  }
  function rollFoeMut(f) {
    if (!f || f.boss || f.super || f.kind === "drain" || f.kind === "thief") return;
    const L = Math.max(1, (G && G.lvl) || 1);
    if (G && G.mode === "survive" && L < 3) return;
    const t = G ? threatIndex() : 0;
    /* Mutant density climbs on the same clock, so a late horde is not just more fodder: it is
       fodder that shoots, splits, heals and runs. This is where a weak build stops coping. */
    const over = Math.max(0, (rampTime() - PACING.knee) / 60);
    const p1 = G && G.mode === "survive" ? Math.min(0.6, 0.05 * (L - 2) + 0.035 * over) : (0.18 + Math.min(0.45, t * 0.014 + 0.03 * over));
    const p2 = G && G.mode === "survive" ? Math.min(0.3, 0.015 * (L - 4) + 0.025 * over) : (0.05 + Math.min(0.28, t * 0.007 + 0.02 * over));
    const bag = [["shoot", 3], ["lob", 2], ["flicker", 2], ["explode", 2], ["heal", 2], ["haste", 3], ["tough", 3], ["ghost", 1], ["blink", 1], ["pull", 1], ["split", 1], ["hymn", 1], ["slow", 2], ["root", 1]];
    function one() {
      let s = 0; bag.forEach(function (x) { s += x[1]; });
      let r = Math.random() * s;
      for (let i = 0; i < bag.length; i++) { r -= bag[i][1]; if (r <= 0) return bag[i][0]; }
      return "haste";
    }
    const n = Math.random() < p1 ? (Math.random() < p2 ? 2 : 1) : 0;
    f.mut = [];
    for (let i = 0; i < n; i++) {
      const m = one();
      if (f.mut.indexOf(m) >= 0) continue;
      f.mut.push(m);
      if (m === "explode") f.explode = true;
      if (m === "split") f.split = true;
      if (m === "heal") f.heal = true;
      if (m === "haste") f.spdBonus = 1.28;
      if (m === "tough") { f.hp = Math.max(f.hp + 1, Math.round(f.hp * 1.4)); f.max = f.hp; }
    }
  }
  function spawnSurviveAround(kind, boss, n, loose) {
    n = Math.max(1, n || 1);
    const live = G.players.find((p) => !p.dead) || G.players[0];
    if (!live) return 0;
    const cap = surviveCap(surviveWave());
    const visR = visionRange(live);
    const minD = boss ? visR + 1.1 : (loose ? 3.0 : 3.5);
    const maxD = boss ? visR + 9 : (loose ? visR + 11 : visR + 3.2);
    const minSep = boss ? 1.35 : (loose ? 0.48 : 0.7);
    const tries = Math.max(56, n * 10);
    let made = 0;
    const spin = Math.random() * 6.28;
    for (let t = 0; t < tries && made < n; t++) {
      if (G.level.foes.length >= cap) break;
      const ang = spin + (made / Math.max(1, n)) * 6.28 + (Math.random() - 0.5) * 0.85;
      const dist = minD + Math.random() * Math.max(0.5, maxD - minD);
      let x = live.x + Math.cos(ang) * dist;
      let y = live.y + Math.sin(ang) * dist;
      x = Math.max(4, Math.min(G.level.W - 5, x));
      y = Math.max(4, Math.min(G.level.H - 5, y));
      const tx = Math.floor(x), ty = Math.floor(y);
      let p;
      if (G.level.tiles[ty] && G.level.tiles[ty][tx] === "floor") p = { x: tx + 0.5, y: ty + 0.5 };
      else p = nearestWalk(G.level, x, y);
      if (blocked(G.level, p.x, p.y)) continue;
      const d = Math.hypot(p.x - live.x, p.y - live.y);
      if (d < 3.1) continue;
      if (d > maxD + 4) continue;
      if (!boss && d < 4.2 && hasLos(live.x, live.y, p.x, p.y)) continue;
      let packed = false;
      const foes = G.level.foes;
      for (let i = 0; i < foes.length; i++) {
        if (Math.hypot(foes[i].x - p.x, foes[i].y - p.y) < minSep) { packed = true; break; }
      }
      if (packed) continue;
      const rank = 1 + Math.min(8, (surviveWave() / 4) | 0);
      const f = makeFoe(kind, rank, p.x, p.y);
      if (boss) f.boss = true;
      G.level.foes.push(f);
      made++;
    }
    return made;
  }
  /* Survive ramp: player level L first, wave W second (W = 1+t/28).
     Cap 14+(L-1)*7+(W-1)*2.4, grown by the pacing curve, clamped at 520. Pulse 2+L+(W/5) ≤22,
     gap 0.62-0.02L ≥0.16s. Horde 5+2L+0.7W ≤72, gap 13.5-0.22L ≥6.2s. Fodder HP
     1+0.28(W-1)+0.48(L-1), scaled by pressure() past the knee.
     Cadence rides PACING so the tide arrives in step with the slower level curve; pressure()
     is what makes a long run end — it lifts their damage, their health and how many of them
     carry mutations, without a ceiling, so a warden who cannot out-kill it is buried. */
  function surviveCap(w) {
    /* The ceiling IS the wave's target: the field may hold exactly what the minute has paid for
       — wave 1 ends at 100 fodder, wave 8 at 800, and from wave 9 the fodder is pinned at 800
       for the rest of the run. What rises after that is the named band (waveBosses), because
       more fodder past 800 buys nothing but frame time. */
    const t = G ? (G.t || 0) : 0;
    return Math.max(1, Math.min(WAVE.normCap, waveNormals(t)));
  }
  /* How much fodder is standing. The named ones and the set-piece bosses are not the crowd:
     they are budgeted by the wave band and have to be able to bypass the crowd ceiling. */
  function surviveField() {
    const foes = (G && G.level && G.level.foes) || [];
    let n = 0;
    for (let i = 0; i < foes.length; i++) if (!foes[i].roster && !foes[i].boss) n++;
    return n;
  }
  /* The cadence chases the wave's target rather than pushing at a fixed rate: behind by a lot it
     pours, level with it it tops up. That is what makes a wave LAND on the number the minute
     paid for instead of drifting under it or flooding past it. */
  function survivePulseN() {
    const gap = surviveCap() - surviveField();
    return Math.max(3, Math.min(48, 3 + Math.round(gap * 0.18)));
  }
  function survivePulseGap() {
    const gap = surviveCap() - surviveField();
    if (gap > 80) return 0.12;
    if (gap > 30) return 0.28;
    return 0.5;
  }
  function surviveHordePack() {
    const L = Math.max(1, G.lvl || 1);
    const W = surviveWave();
    return pacePack(Math.min(72, 5 + L * 2 + ((W * 0.7) | 0)));
  }
  function surviveHordeGap() {
    const L = Math.max(1, G.lvl || 1);
    return paceGap(Math.max(6.2, 13.5 - L * 0.22));
  }
  function surviveTick(dt) {
    if (!G || G.mode !== "survive" || G.over) return;
    const w = surviveWave();
    if (w !== G.wave) {
      emit("onWaveComplete", { w: G.wave });
      G.wave = w;
      G._wavePulse = 1;
      say(w === WAVE.bossAt ? ("Wave " + w + " — the named ones wake.") : ("Wave " + w + " — the lattice floods."));
      $("holePill").textContent = "SURVIVE · WAVE " + w;
      emit("onWaveStart", { w: w });
      feel("wave");
      G._spawnQ = (G._spawnQ || 0) + pacePack(Math.min(90, 8 + G.lvl * 3 + w * 2));
      G.score += 50 + w * 10;
      if (w % 5 === 0) {
        G.players.forEach(function (p) {
          if (!p.dead) p.hp = Math.min(p.max, p.hp + Math.round(p.max * 0.12));
        });
        hallMark("wave");
        say("Wave " + w + " sealed — hall takes the mark. A sip for holding.");
      }
    }
    const cap = surviveCap(w);
    G.spawnT -= dt;
    if (G.spawnT <= 0 && G.level.foes.length < cap) {
      G.spawnT = survivePulseGap();
      const n = survivePulseN();
      if (!spawnSurviveAround(surviveKind(w), false, n)) {
        spawnSurviveAround(surviveKind(w), false, n, true);
      }
    }
    G.hordeT = (G.hordeT == null ? 12 : G.hordeT) - dt;
    if (G.hordeT <= 0) {
      G.hordeT = surviveHordeGap();
      const pack = surviveHordePack();
      G._spawnQ = (G._spawnQ || 0) + pack;
      if (G.lvl >= 3) say("A flood — " + pack + " more.");
    }
    let drain = 0;
    while ((G._spawnQ || 0) > 0 && G.level.foes.length < cap && drain < 64) {
      const k = surviveKind(w);
      const want = Math.min(10, G._spawnQ);
      let got = spawnSurviveAround(k, false, want);
      if (!got) got = spawnSurviveAround(k, false, want, true);
      if (!got) {
        G._spawnQ = Math.max(0, G._spawnQ - 8);
        break;
      }
      G._spawnQ = Math.max(0, G._spawnQ - got);
      drain += got;
    }
    if (w >= 10 && w % 5 === 0 && G.bossAt !== w) {
      G.bossAt = w;
      const nB = 1 + (w >= 15 ? 1 : 0) + (w >= 25 ? 1 : 0);
      for (let i = 0; i < nB; i++) {
        const bk = SURVIVE_BOSSES[(((w / 5) | 0) + i) % SURVIVE_BOSSES.length];
        if (!spawnSurviveAround(bk, true)) spawnSurviveAround(bk, true, 1, true);
        emit("onBossSpawn", { w: w });
      }
      say(nB > 1 ? "Named guardians enter the long crypt." : "A named guardian enters the long crypt.");
    }
    const superWave = w === 12 || w === 18 || w === 24 || w === 36 || (w >= 30 && w % 6 === 0);
    if (superWave && G.bossAt !== w + 0.5) {
      G.bossAt = w + 0.5;
      const sk = (w === 12 || w === 36) ? "unspool" : (w === 18 ? "titheking" : (w === 24 ? "nameeater" : SUPER_BOSSES[(((w / 6) | 0) + 1) % 3]));
      spawnSurviveAround(sk, true);
      /* Two of them once the run has legs: one super is a set piece, two is a problem the
         warden has to solve while the fodder keeps coming. */
      if (w >= 30) spawnSurviveAround(SUPER_BOSSES[(((w / 6) | 0) + 2) % 3], true, 1, true);
      emit("onBossSpawn", { w: w, super: true });
      say(BOSS_NAME[sk] + " walks the Long Crypt.");
    }
    if (G.pendingLvl > 0 && overlayMode == null) offerSurviveUp();
  }
  function killXpValue(f) {
    /* The same body is worth the same points in every mode — leveling is measured in kills, so a
       survive wave and a campaign floor pay the same rate for the same work. A named one is
       worth fourteen fodder (it takes about that long to put down), a set-piece thirty. */
    const d = FOE[f.kind] || {};
    if (f.roster) return 14 * KILL_XP;
    if (d.super) return 30 * KILL_XP;
    if (d.boss) return 12 * KILL_XP;
    if (f.kind === "drain") return 14 * KILL_XP;
    if (f.kind === "thief") return 6 * KILL_XP;
    return ((d.pts >= 18) ? 3 : 2) * KILL_XP;
  }
  /* Every mode feeds the same ladder now: Survival, Endless and Campaign all bank XP per
     kill and all draft a card on level-up. */
  function onKillCommon(f) {
    G.kills = (G.kills || 0) + 1;
    if (G.mode === "survive") scoreKill(6 + surviveWave() * 2);
    G.xp += killXpValue(f);
    /* Leech and tithe are card stats, but the party drinks together: the best leech at the
       table mends everyone standing, the best tithe sense lifts the drop roll. */
    let leech = 0, bounty = 0;
    G.players.forEach((p) => {
      if (p.dead) return;
      leech = Math.max(leech, p.leech || 0);
      bounty = Math.max(bounty, p.bounty || 0);
    });
    if (leech) {
      const heal = leech * (f.boss ? 4 : 1);
      G.players.forEach((p) => {
        if (p.dead || p.hp >= p.max) return;
        p.hp = Math.min(p.max, p.hp + heal);
      });
    }
    const dropChance = 0.07 + bounty * 0.03;
    if ((G.mode === "survive" || bounty) && Math.random() < dropChance && G.level.items.length < 90) {
      dropItemNear(f.x, f.y, Math.random() < 0.2 ? rollLoot() : ["coin", "coin", "berry", "scrap", "core", "moss", "vial", "fury", "magnet", "key"][(Math.random() * 10) | 0]);
    }
    while (G.xp >= xpNeed(G.lvl)) {
      G.xp -= xpNeed(G.lvl);
      G.lvl++;
      G.pendingLvl = (G.pendingLvl || 0) + 1;
      levelUpParty();
    }
  }
  function rollSurviveUps() {
    function okArm(u) {
      if (!WEAPONS[u.id]) return true;
      let mx = 0;
      G.players.forEach((p) => { mx = Math.max(mx, wepLv(p, u.id)); });
      return mx < 8;
    }
    const hasPet = !!(G.pets && G.pets.length);
    const hasAi = G.players.some(function (p) { return p.ai; });
    function okBond(u) {
      if (u.kind !== "bond") return true;
      if (u.need === "pet" && !hasPet) return false;
      if (u.need === "ai" && !hasAi) return false;
      if (u.need === "any" && !hasPet && !hasAi) return false;
      if (u.id === "callpack" && hasPet) return false;
      return true;
    }
    /* Legends are earned, not rolled on the first card: they surface once the run has
       teeth — level 6, or past the knee where the horde wakes up. */
    function okTier(u) {
      if (u.tier >= 3 && !(G.lvl >= 6 || rampTime() > PACING.knee)) return false;
      return true;
    }
    /* Variety is the fun: the draft leans toward cards the warden has *not* tried yet, so a
       long run keeps opening new toys instead of deepening the same three. */
    function stacks(u) {
      const p = G.players[0];
      if (!p) return 0;
      if (WEAPONS[u.id]) return wepLv(p, u.id);
      if (u.stack) return p[u.stack] || 0;
      return 0;
    }
    const stats = SURVIVE_UP.filter((u) => u.kind === "stat" && okTier(u));
    const gifts = SURVIVE_UP.filter((u) => u.kind === "gift" && okTier(u));
    const arms = SURVIVE_UP.filter((u) => u.kind === "arm" && okTier(u) && okArm(u));
    const bonds = SURVIVE_UP.filter((u) => u.kind === "bond" && okTier(u) && okBond(u));
    function pick(arr) {
      if (!arr.length) return null;
      const w = arr.map((u) => {
        const base = u.tier >= 3 ? 3 : (u.tier === 2 ? 5 : 6);
        return base / (1 + stacks(u) * 0.55);
      });
      let t = 0; w.forEach((n) => { t += n; });
      let r = Math.random() * t;
      for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; }
      return arr[arr.length - 1];
    }
    const buckets = [stats, gifts, arms, bonds].filter(function (b) { return b.length; }).sort(function () { return Math.random() - 0.5; });
    const out = [];
    const used = {};
    buckets.forEach(function (b) {
      const u = pick(b.filter(function (x) { return !used[x.id]; }));
      if (u) { out.push(u); used[u.id] = 1; }
    });
    while (out.length < 3) {
      const u = pick(SURVIVE_UP.filter(function (x) { return !used[x.id] && okArm(x) && okTier(x); }));
      if (!u) break;
      out.push(u); used[u.id] = 1;
    }
    /* At least one card the warden has never taken, whenever one exists. */
    if (out.length && !out.some(function (u) { return stacks(u) === 0; })) {
      const fresh = SURVIVE_UP.filter(function (x) { return !used[x.id] && okArm(x) && okTier(x) && stacks(x) === 0; });
      if (fresh.length) {
        const u = fresh[(Math.random() * fresh.length) | 0];
        out[out.length - 1] = u;
        used[u.id] = 1;
      }
    }
    while (out.length < 3) out.push(SURVIVE_UP[out.length % SURVIVE_UP.length]);
    return out;
  }
  function upNowLine(u) {
    const p = G.players[0];
    if (!p) return u.bonus;
    if (WEAPONS[u.id]) {
      const lv = wepLv(p, u.id);
      return lv ? "ARM LV " + lv + " → " + (lv + 1) : "NEW ARM";
    }
    if (u.stack) {
      const n = p[u.stack] || 0;
      return "NOW " + n + "  →  " + (n + 1);
    }
    if (u.maxHp) return "MAX " + (p.max | 0) + "  →  " + ((p.max | 0) + u.maxHp);
    if (u.kind === "bond") {
      const b = G.bond || {};
      if (u.addPetDmg) return "PET DMG ×" + (1 + (b.dmg || 0)).toFixed(2) + " → ×" + (1 + (b.dmg || 0) + u.addPetDmg).toFixed(2);
      if (u.addPetSpd) return "PET SPD +" + Math.round((b.spd || 0) * 100) + "%";
      const pet = G.pets && G.pets[0];
      if (u.addPetHp && pet) return "PET HP " + (pet.max | 0) + " → " + ((pet.max | 0) + u.addPetHp);
    }
    return u.bonus;
  }
  function bondState() {
    if (!G) return { dmg: 0, spd: 0, cd: 0, armor: 0, aoe: 0, sleep: 0 };
    if (!G.bond) G.bond = { dmg: 0, spd: 0, cd: 0, armor: 0, aoe: 0, sleep: 0 };
    return G.bond;
  }
  function petSleepLen() { return Math.max(12, 20 - (bondState().sleep || 0)); }
  function applyBondUp(u) {
    if (!u || u.kind !== "bond") return;
    const b = bondState();
    if (u.addPetDmg) b.dmg += u.addPetDmg;
    if (u.addPetSpd) b.spd += u.addPetSpd;
    if (u.addPetCd) b.cd += u.addPetCd;
    if (u.addPetArmor) b.armor += u.addPetArmor;
    if (u.addPetAoe) b.aoe += u.addPetAoe;
    if (u.addSleepCut) b.sleep += u.addSleepCut;
    (G.pets || []).forEach(function (pet) {
      if (u.addPetHp) {
        pet.max += u.addPetHp;
        pet.hp = Math.min(pet.max, pet.hp + u.addPetHp);
      }
      if (u.addPetArmor) pet.armor = (pet.armor || 0) + u.addPetArmor;
      if (u.id === "packwake" && (pet.sleepT || 0) > 0) {
        pet.sleepT = 0;
        pet.hp = Math.round(pet.max * 0.6);
      }
      if (u.id === "sharedcup" && (pet.sleepT || 0) <= 0) pet.hp = Math.min(pet.max, pet.hp + pet.max * 0.4);
    });
    G.players.forEach(function (p) {
      if (!p.ai) return;
      if (u.id === "secondvoice" || u.id === "latticeleash") {
        p.might = (p.might || 0) + 1;
        if (u.id === "secondvoice") {
          p.haste = (p.haste || 0) + 1;
          p.shotBoost = Math.max(p.shotBoost || 0, 4);
        }
      }
      if (u.id === "followtight") {
        p.stride = (p.stride || 0) + 2;
        p.shotBoost = Math.max(p.shotBoost || 0, 5);
      }
      if (u.id === "packwake" && (p.sleepT || 0) > 0) {
        p.sleepT = 0;
        p.hp = Math.round(p.max * 0.6);
      }
      if (u.id === "sharedcup" && (p.sleepT || 0) <= 0) p.hp = Math.min(p.max, p.hp + p.max * 0.4);
    });
    if (u.id === "callpack" && !(G.pets && G.pets.length)) {
      const kinds = Object.keys(PETS);
      spawnPet(persist.pet && PETS[persist.pet] ? persist.pet : kinds[(Math.random() * kinds.length) | 0]);
    }
  }
  function applySurviveUp(u) {
    /* The companion trains with you: every card that lands on the warden lands on the AI
       companion (and the pack, through applyBondUp) in the same breath. */
    G.players.forEach((p) => {
      if (p.dead) return;
      if (u.id === "might") p.might = (p.might || 0) + 1;
      else if (u.id === "haste") { p.haste = (p.haste || 0) + 1; p.shotBoost = Math.max(p.shotBoost || 0, 4); }
      else if (u.id === "iron") { p.iron = (p.iron || 0) + 1; p.aegis = Math.max(p.aegis || 0, 4); }
      else if (u.id === "heart") { p.max += 80; p.hp = Math.min(p.max, p.hp + 80); }
      else if (u.id === "core") p.cores = (p.cores || 0) + 1;
      else if (u.id === "phial") { p.vials += 2; p.vialPow = (p.vialPow || 0) + 1; }
      else if (u.id === "pierce") p.pierce = (p.pierce || 0) + 1;
      else if (u.id === "cap") p.extraCap = (p.extraCap || 0) + 1;
      else if (u.id === "magnet") p.magnet = (p.magnet || 0) + 0.45;
      else if (u.id === "leech") p.leech = (p.leech || 0) + 1;
      else if (u.id === "bounty") p.bounty = (p.bounty || 0) + 1;
      else if (u.id === "swift") { p.stride = (p.stride || 0) + 1; p.swift = Math.max(p.swift || 0, 3); }
      else if (u.id === "vialpow") p.vialPow = (p.vialPow || 0) + 1;
      else if (u.id === "secondwind") p.hp = Math.min(p.max, p.hp + p.max * 0.4);
      else if (u.id === "overclock") { p.shotBoost = Math.max(p.shotBoost || 0, 8); p.haste = (p.haste || 0) + 1; }
      else if (u.id === "latticeward") p.aegis = Math.max(p.aegis || 0, 7);
      else if (u.id === "goldrush") {}
      else if (u.id === "namelight") p.lamp = (p.lamp || 0) + 1;
      else if (u.id === "thornmail") p.thorns = Math.max(p.thorns || 0, 10);
      else if (u.id === "echoround") p.echo = Math.max(p.echo || 0, 10);
      else if (u.id === "fairmirror") p.reflect = Math.max(p.reflect || 0, 8);
      else if (u.id === "veilstep") { p.veil = Math.max(p.veil || 0, 6); p.stride = (p.stride || 0) + 1; }
      else if (u.id === "furyhour") { p.fury = Math.max(p.fury || 0, 10); p.might = (p.might || 0) + 1; }
      else if (WEAPONS[u.id]) giveWep(p, u.id);
      if (u.maxHp) {
        p.max += u.maxHp;
        p.hp = Math.min(p.max, p.hp + (u.fill != null ? u.fill : u.maxHp));
      }
      if (u.addIron) p.iron = (p.iron || 0) + u.addIron;
      if (u.addVials) p.vials += u.addVials;
      if (u.addCore) p.cores = (p.cores || 0) + u.addCore;
      if (u.addMight) p.might = (p.might || 0) + u.addMight;
      if (u.addHaste) p.haste = (p.haste || 0) + u.addHaste;
      if (u.addPierce) p.pierce = (p.pierce || 0) + u.addPierce;
      if (u.addCap) p.extraCap = (p.extraCap || 0) + u.addCap;
      if (u.addStride) p.stride = (p.stride || 0) + u.addStride;
      if (u.addMagnet) p.magnet = (p.magnet || 0) + u.addMagnet;
      if (u.addVialPow) p.vialPow = (p.vialPow || 0) + u.addVialPow;
      if (u.addLamp) p.lamp = (p.lamp || 0) + u.addLamp;
      if (u.addLeech) p.leech = (p.leech || 0) + u.addLeech;
      if (u.addBounty) p.bounty = (p.bounty || 0) + u.addBounty;
      if (u.tFury) p.fury = Math.max(p.fury || 0, u.tFury);
      if (u.tRegen) p.regen = Math.max(p.regen || 0, u.tRegen);
      if (u.tThorns) p.thorns = Math.max(p.thorns || 0, u.tThorns);
      if (u.tAegis) p.aegis = Math.max(p.aegis || 0, u.tAegis);
      if (u.tSwift) p.swift = Math.max(p.swift || 0, u.tSwift);
      if (u.tVeil) p.veil = Math.max(p.veil || 0, u.tVeil);
      if (u.tReflect) p.reflect = Math.max(p.reflect || 0, u.tReflect);
      if (u.tShot) p.shotBoost = Math.max(p.shotBoost || 0, u.tShot);
    });
    applyBondUp(u);
    if (u.id === "goldrush") G.score += 500;
    if (u.addScore) G.score += u.addScore;
    if (u.stunR && G.players[0]) novaStun(G.players[0].x, G.players[0].y, 7, 1.6, "#7dd3fc");
    say("LEVEL " + G.lvl + " · " + u.name + " — " + u.bonus);
    const p0 = G.players[0];
    feel("upgrade", p0 && p0.x, p0 && p0.y);
  }
  function markUpgradeSel() {
    const cards = document.querySelectorAll("[data-up]");
    cards.forEach((el) => el.classList.toggle("on", +el.getAttribute("data-up") === (G._upSel || 0)));
  }
  function confirmSurviveUp(i) {
    if (!G || !G._ups || G._upLock) return;
    const u = G._ups[i];
    if (!u) return;
    G._upLock = true;
    const card = document.querySelector("[data-up='" + i + "']");
    if (card) card.classList.add("taken");
    applySurviveUp(u);
    G._ups = null;
    G._upTaken = 0.34;
    G._upPending = G.pendingLvl > 0;
  }
  function pollUpgradePick() {
    if (!G || !G._ups) return;
    const n = G._ups.length;
    if (G._upSel == null) G._upSel = 0;
    let dir = 0, ok = false;
    if (keyEdge.ArrowLeft || keyEdge.KeyA || keyEdge.KeyQ) dir = -1;
    if (keyEdge.ArrowRight || keyEdge.KeyD || keyEdge.KeyE) dir = 1;
    if (keyEdge.Digit1 || keyEdge.Numpad1) { confirmSurviveUp(0); keyEdge = {}; return; }
    if (keyEdge.Digit2 || keyEdge.Numpad2) { confirmSurviveUp(1); keyEdge = {}; return; }
    if (keyEdge.Digit3 || keyEdge.Numpad3) { confirmSurviveUp(2); keyEdge = {}; return; }
    if (keyEdge.Enter || keyEdge.KeyJ || keyEdge.Space || keyEdge.Numpad0) ok = true;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let anyHold = false;
    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      if (!pad) continue;
      const ax = pad.axes[0] || 0;
      const left = ax < -0.55 || (pad.buttons[14] && pad.buttons[14].pressed);
      const right = ax > 0.55 || (pad.buttons[15] && pad.buttons[15].pressed);
      const confirm = (pad.buttons[0] && pad.buttons[0].pressed) ||
        (pad.buttons[7] && pad.buttons[7].pressed) ||
        (pad.buttons[9] && pad.buttons[9].pressed);
      if (left || right || confirm) anyHold = true;
      if (G._upHold) continue;
      if (left && !G._upPadL) dir = -1;
      if (right && !G._upPadR) dir = 1;
      G._upPadL = left;
      G._upPadR = right;
      if (confirm) ok = true;
    }
    if (G._upHold) {
      if (!anyHold && !keys.Enter && !keys.KeyJ && !keys.Space && !keys.Numpad0) G._upHold = false;
      keyEdge = {};
      return;
    }
    if (dir) {
      G._upSel = (G._upSel + dir + n) % n;
      markUpgradeSel();
      beep("pick");
    }
    if (ok) confirmSurviveUp(G._upSel);
    keyEdge = {};
  }
  function autoPickUp(picks) {
    const p = G.players && G.players[0];
    const hasBond = (G.pets && G.pets.length) || G.players.some(function (x) { return x.ai; });
    let best = 0, score = -1;
    picks.forEach(function (u, i) {
      let s = (u.tier || 0) * 10;
      if (WEAPONS[u.id] && p && wepLv(p, u.id)) s += 7;
      if (u.kind === "bond" && hasBond) s += 5;
      if (u.maxHp && p && p.hp < p.max * 0.42) s += 6;
      if (u.kind === "stat") s += 2;
      if (s > score) { score = s; best = i; }
    });
    return best;
  }
  function offerSurviveUp() {
    const picks = rollSurviveUps();
    if (persist.autoUp) {
      let batch = picks;
      while (G.pendingLvl > 0) {
        G.pendingLvl--;
        const u = batch[autoPickUp(batch)];
        if (u) applySurviveUp(u);
        if (G.pendingLvl > 0) batch = rollSurviveUps();
      }
      return;
    }
    G._ups = picks;
    G._upSel = 0;
    G._upHold = true;
    G._upPadL = true;
    G._upPadR = true;
    G._upLock = false;
    G._upTaken = 0;
    G.pendingLvl--;
    overlayMode = "sheet";
    const tiers = ["COMMON", "RARE", "SUPER", "LEGEND"];
    showSheet(
      "<div class='up-cabinet'>" +
      "<p class='up-marquee'>★ THE LATTICE GROWS ★ BONUS STAGE ★</p>" +
      "<h2 class='up-title'>LEVEL " + G.lvl + "</h2>" +
      "<p class='up-sub'>" + (G.mode === "survive" ? "WAVE " + surviveWave() : modeFloorLabel()) + " · PICK ONE · STACKS KEEP</p>" +
      "<div class='up-grid'>" + picks.map(function (u, i) {
        const t = u.tier || 0;
        return "<button type='button' class='up-card tier-" + t + (i === 0 ? " on" : "") + "' data-up='" + i + "'>" +
          "<span class='up-num'>" + (i + 1) + "</span>" +
          "<span class='up-tier'>" + (u.tag || tiers[t]) + "</span>" +
          "<span class='up-glyph g-" + (u.glyph || "core") + "' aria-hidden='true'></span>" +
          "<b>" + u.name + "</b>" +
          "<span class='up-spec'>" + u.spec + "</span>" +
          "<span class='up-now'>" + upNowLine(u) + "</span>" +
          "<span class='up-bonus'>" + u.bonus + "</span>" +
          "</button>";
      }).join("") + "</div>" +
      "<p class='up-hint'>1 · 2 · 3 &nbsp;|&nbsp; ← → &nbsp;|&nbsp; ENTER / A / J</p>" +
      "</div>"
    );
    $("overlay").classList.add("upgrade-pick");
    const sh = document.querySelector("#overlay .sheet");
    if (sh) sh.classList.add("up-sheet");
    $("overlay").onclick = function (e) {
      const b = e.target.closest("[data-up]");
      if (!b || !G._ups) return;
      confirmSurviveUp(+b.getAttribute("data-up"));
    };
  }

  function fillRect(tiles, W, H, x, y, w, h, t) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (xx > 0 && yy > 0 && xx < W - 1 && yy < H - 1) tiles[yy][xx] = t;
      }
    }
  }

  function carveLayout(tiles, W, H, R, kind) {
    const rooms = [];
    function addRoom(rx, ry, rw, rh) {
      fillRect(tiles, W, H, rx, ry, rw, rh, "floor");
      rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: rx + (rw >> 1), cy: ry + (rh >> 1) });
    }
    function tunnel(a, b) {
      let x = a.cx, y = a.cy;
      while (x !== b.cx) {
        tiles[y][x] = "floor";
        if (tiles[y][x - 1] === "wall") tiles[y][x - 1] = "floor";
        x += x < b.cx ? 1 : -1;
      }
      while (y !== b.cy) {
        tiles[y][x] = "floor";
        if (tiles[y - 1] && tiles[y - 1][x] === "wall") tiles[y - 1][x] = "floor";
        y += y < b.cy ? 1 : -1;
      }
    }
    /* Every stroke scales with the map. These layouts began as thin lines on a small grid, and a
       literal reading on a 140x120 continent gives ~90% solid rock crossed by a few corridors —
       a maze, which is the opposite of what an Endless floor is for. Lanes are sized as a
       fraction of the region and so are the blocks each layout stands on, so a cross is a
       highway, a ring is a circuit around a real vault, and a spiral is a ramp you can run. */
    const T = Math.max(3, Math.round(Math.min(W, H) * 0.06));
    const BW = Math.round(W * 0.17), BH = Math.round(H * 0.17);
    const CX = Math.round(W * 0.11), CY = Math.round(H * 0.11);
    if (kind === "cross") {
      addRoom(2, (H >> 1) - (T >> 1), W - 4, T);
      addRoom((W >> 1) - (T >> 1), 2, T, H - 4);
    } else if (kind === "ring") {
      addRoom(2, 2, W - 4, H - 4);
      const ix = Math.round(W * 0.16), iy = Math.round(H * 0.16);
      fillRect(tiles, W, H, ix, iy, W - ix * 2, H - iy * 2, "wall");
      /* Four gaps, not two: a ring is a circuit, and a circuit you can only enter from the
         north and south is a corridor with a long way round. */
      tiles[iy][W >> 1] = "floor";
      tiles[H - iy - 1][W >> 1] = "floor";
      tiles[H >> 1][ix] = "floor";
      tiles[H >> 1][W - ix - 1] = "floor";
    } else if (kind === "halls") {
      const rowGap = Math.max(4, Math.round(H / 13)), colGap = Math.max(5, Math.round(W / 13));
      for (let y = 3; y < H - T; y += rowGap) addRoom(2, y, W - 4, T);
      for (let x = 4; x < W - T; x += colGap) addRoom(x, 2, T, H - 4);
    } else if (kind === "cells") {
      for (let y = 2; y < H - CY; y += CY + 1) {
        for (let x = 2; x < W - CX; x += CX + 1) addRoom(x, y, CX - 1, CY - 1);
      }
      for (let i = 1; i < rooms.length; i++) tunnel(rooms[i - 1], rooms[i]);
    } else if (kind === "arena") {
      addRoom(3, 2, W - 6, H - 4);
    } else if (kind === "vault") {
      addRoom(2, 2, BW, BH);
      addRoom(W - BW - 2, 2, BW, BH);
      addRoom(4, H - BH - 2, W - 8, BH);
      addRoom((W >> 1) - (BW >> 1), (H >> 1) - (BH >> 1), BW, BH);
      for (let i = 1; i < rooms.length; i++) tunnel(rooms[i - 1], rooms[i]);
    } else if (kind === "spiral") {
      const s = T, in1 = T * 3;
      addRoom(2, 2, W - 4, s);
      addRoom(W - 2 - s, 2, s, H - 4);
      addRoom(2, H - 2 - s, W - 4, s);
      addRoom(2, 2 + in1, s, H - 4 - in1);
      addRoom(2, 2 + in1, W - 4 - in1, s);
      addRoom(W - 2 - in1, 2 + in1, s, H - 4 - in1 * 2);
      addRoom(2 + in1, H - 2 - in1, W - 4 - in1 * 2, s);
      /* Turns are tunnelled in order: a spiral drawn as parallel arms can leave its inner turn
         sealed, and loot sealed behind stone is loot the floor is lying about. */
      for (let i = 1; i < rooms.length; i++) tunnel(rooms[i - 1], rooms[i]);
    } else {
      /* Open plan: rooms scale with the map, not against it. A 140x120 continent wants a
         sprawl of big overlapping rooms to fight across, not a dozen closets in a wall field. */
      const area = W * H;
      const nR = 10 + ((R() * 6) | 0) + Math.round(area / 700);
      for (let n = 0; n < nR; n++) {
        const rw = Math.max(8, Math.min(W - 4, 6 + ((R() * (W * 0.22)) | 0)));
        const rh = Math.max(8, Math.min(H - 4, 6 + ((R() * (H * 0.22)) | 0)));
        const rx = 1 + ((R() * (W - rw - 2)) | 0);
        const ry = 1 + ((R() * (H - rh - 2)) | 0);
        addRoom(rx, ry, rw, rh);
      }
      for (let i = 1; i < rooms.length; i++) tunnel(rooms[i - 1], rooms[i]);
    }
    for (let x = 0; x < W; x++) { tiles[0][x] = "wall"; tiles[H - 1][x] = "wall"; }
    for (let y = 0; y < H; y++) { tiles[y][0] = "wall"; tiles[y][W - 1] = "wall"; }
    return rooms;
  }

  function contentBox(lv) {
    let x0 = lv.W, y0 = lv.H, x1 = 0, y1 = 0;
    for (let y = 0; y < lv.H; y++) {
      for (let x = 0; x < lv.W; x++) {
        if (lv.tiles[y][x] === "wall") continue;
        if (x < x0) x0 = x; if (y < y0) y0 = y;
        if (x > x1) x1 = x; if (y > y1) y1 = y;
      }
    }
    lv.box = { x0, y0, x1, y1 };
    return lv;
  }

  function floorsOf(tiles, W, H) {
    const out = [];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        if (tiles[y][x] === "floor") out.push({ x, y });
      }
    }
    return out;
  }

  const SURVIVE_UP = [
    { id: "might", kind: "stat", tier: 0, glyph: "tooth", name: "Tooth of the Door", tag: "MIGHT", bonus: "+1 MIGHT", stack: "might", spec: "Every bolt bites harder. The lock keeps a sharper tooth." },
    { id: "haste", kind: "stat", tier: 0, glyph: "clock", name: "Right-Time Hands", tag: "HASTE", bonus: "+1 HASTE · COD 4s", stack: "haste", spec: "The magazine cycles like a clock. A short Codex surge on take." },
    { id: "iron", kind: "stat", tier: 0, glyph: "plate", name: "Fair Plate", tag: "IRON", bonus: "+1 IRON · AEGIS 4s", stack: "iron", spec: "Fairness as armor. A brief Aegis while the plate settles." },
    { id: "heart", kind: "stat", tier: 1, glyph: "well", name: "Wellspring", tag: "WELL", bonus: "+80 MAX & HEAL", spec: "The well deepens and fills. You drink what you just cut." },
    { id: "core", kind: "stat", tier: 1, glyph: "core", name: "Named Core", tag: "CORE", bonus: "+1 CORE", stack: "cores", spec: "A named coal in the shot. Damage that does not unwrite." },
    { id: "phial", kind: "stat", tier: 0, glyph: "flask", name: "Chorus Charge", tag: "VIAL", bonus: "+2 VIALS · +1 RES", spec: "Two flasks and a louder resonance. The chorus drinks with you." },
    { id: "pierce", kind: "stat", tier: 0, glyph: "lens", name: "Truth Lens", tag: "PIERCE", bonus: "+1 PIERCE", stack: "pierce", spec: "Bolts pass a lie and keep going. The floor cannot hide behind a body." },
    { id: "cap", kind: "stat", tier: 0, glyph: "volley", name: "Open Volley", tag: "VOLLEY", bonus: "+1 LIVE BOLT", stack: "extraCap", spec: "One more bolt allowed in the air. The lattice likes a crowded line." },
    { id: "magnet", kind: "stat", tier: 0, glyph: "pull", name: "Tithe Pull", tag: "PULL", bonus: "+PULL RANGE", stack: "magnet", spec: "Relics lean toward you. The floor pays its tithe." },
    { id: "swift", kind: "stat", tier: 0, glyph: "boot", name: "Path Stride", tag: "STRIDE", bonus: "+8% MOVE · SWIFT 3s", stack: "stride", spec: "The corridor shortens. A burst of Swift as the path agrees." },
    { id: "vialpow", kind: "stat", tier: 1, glyph: "sigil", name: "Black Sigil", tag: "RES", bonus: "+1 RESONANCE", stack: "vialPow", spec: "Vials hit like names. Resonance is the weapon." },
    { id: "secondwind", kind: "gift", tier: 1, glyph: "wind", name: "Second Wind", tag: "GIFT", bonus: "HEAL 40% MAX", spec: "The well remembers you. Instant drink — forty percent of the cistern." },
    { id: "overclock", kind: "gift", tier: 2, glyph: "spark", name: "Overclock", tag: "GIFT", bonus: "COD 8s · +1 HASTE", spec: "Hands too fast for the Drain. Codex surge and a lasting Haste." },
    { id: "latticeward", kind: "gift", tier: 1, glyph: "ward", name: "Lattice Ward", tag: "GIFT", bonus: "PARTY AEGIS 7s", spec: "A door held for everyone living. Cover, then keep moving." },
    { id: "goldrush", kind: "gift", tier: 1, glyph: "coin", name: "Hall Mark", tag: "GIFT", bonus: "+500 SCORE", spec: "The hall stamps a mark now. Score is a name it cannot unwrite." },
    { id: "namelight", kind: "gift", tier: 2, glyph: "lamp", name: "Name-Light", tag: "GIFT", bonus: "+FOG RANGE", spec: "The dark yields a step. Lantern without the relic — the fog recedes." },
    { id: "thornmail", kind: "gift", tier: 1, glyph: "thorn", name: "Bumper Thorn", tag: "GIFT", bonus: "THORNS 10s", spec: "What bumps you bleeds. A short hedge of thorns." },
    { id: "echoround", kind: "gift", tier: 1, glyph: "echo", name: "Echo Round", tag: "GIFT", bonus: "ECHO 10s", spec: "Bolts linger in the stone. Pierce that does not ask permission." },
    { id: "fairmirror", kind: "gift", tier: 1, glyph: "mirror", name: "Fair Mirror", tag: "GIFT", bonus: "REFLECT 8s", spec: "Shots that would unname you turn around. Fairness as plate." },
    { id: "veilstep", kind: "gift", tier: 2, glyph: "veil", name: "Veil Step", tag: "GIFT", bonus: "VEIL 6s · +STRIDE", spec: "You are already gone. A lasting Stride under the veil." },
    { id: "furyhour", kind: "gift", tier: 2, glyph: "fury", name: "Fury Hour", tag: "GIFT", bonus: "FURY 10s · +1 MIGHT", spec: "The hour is red. Bolts bite, and they keep the bite." },
    { id: "fan", kind: "arm", tier: 0, glyph: "fan", name: "Three-Way Crescent", tag: "ARM", bonus: "ARM / STACK FAN", spec: "A crescent of three. Stacks split wider." },
    { id: "needle", kind: "arm", tier: 0, glyph: "needle", name: "Piercing Beam", tag: "ARM", bonus: "ARM / STACK NEEDLE", spec: "A thin true line. Stacks pass more bodies." },
    { id: "cinder", kind: "arm", tier: 0, glyph: "cinder", name: "Coal of Ember", tag: "ARM", bonus: "ARM / STACK CINDER", spec: "A fireball that leaves a burn. Stacks hotter." },
    { id: "comet", kind: "arm", tier: 0, glyph: "comet", name: "Shortest Ice", tag: "ARM", bonus: "ARM / STACK COMET", spec: "A lob over walls. The geodesic of frost." },
    { id: "halo", kind: "arm", tier: 0, glyph: "halo", name: "Orbiting Wards", tag: "ARM", bonus: "ARM / STACK HALO", spec: "Wards that circle you. Stacks add seats at the table." },
    { id: "cleave", kind: "arm", tier: 0, glyph: "cleave", name: "Door Tooth", tag: "ARM", bonus: "ARM / STACK CLEAVE", spec: "Auto slash in front. Stacks reach farther." },
    { id: "orbit", kind: "arm", tier: 0, glyph: "orbit", name: "Spinning Blades", tag: "ARM", bonus: "ARM / STACK ORBIT", spec: "Blades on a ring. Stacks more teeth." },
    { id: "aura", kind: "arm", tier: 0, glyph: "aura", name: "Arm's Reach", tag: "ARM", bonus: "ARM / STACK AURA", spec: "Hurt anything in reach. Stacks the radius." },
    { id: "seek", kind: "arm", tier: 1, glyph: "seek", name: "Homing Bolt", tag: "ARM", bonus: "ARM / STACK SEEK", spec: "It will find a name. Stacks the hunt." },
    { id: "chain", kind: "arm", tier: 1, glyph: "chain", name: "Jumping Arc", tag: "ARM", bonus: "ARM / STACK CHAIN", spec: "Light that jumps. Stacks the bite." },
    { id: "barrage", kind: "arm", tier: 1, glyph: "barrage", name: "Rapid Stream", tag: "ARM", bonus: "ARM / STACK BARRAGE", spec: "A stream, not a shot. Stacks the flood." },
    { id: "nova", kind: "arm", tier: 1, glyph: "nova", name: "Bursting Shell", tag: "ARM", bonus: "ARM / STACK NOVA", spec: "Dies in a bloom. Stacks the bloom." },
    { id: "prism", kind: "arm", tier: 1, glyph: "prism", name: "Five-Way Light", tag: "RARE ARM", bonus: "ARM / STACK PRISM", spec: "Rare crescent of five. The lock likes a crowd of lines." },
    { id: "thornlance", kind: "arm", tier: 1, glyph: "lance", name: "Thornlance", tag: "RARE ARM", bonus: "ARM / STACK LANCE", spec: "The beam does not stop. A rare pierce." },
    { id: "sunbolt", kind: "arm", tier: 2, glyph: "sun", name: "Sunbolt", tag: "SUPER ARM", bonus: "ARM / STACK SUNBOLT", spec: "A coal of the first fire. Super heat." },
    { id: "voidlob", kind: "arm", tier: 2, glyph: "void", name: "Voidlob", tag: "SUPER ARM", bonus: "ARM / STACK VOIDLOB", spec: "Ice that unnames on death. Super lob." },
    { id: "starwheel", kind: "arm", tier: 1, glyph: "wheel", name: "Starwheel", tag: "RARE ARM", bonus: "ARM / STACK WHEEL", spec: "More wards in orbit. Rare halo." },
    { id: "riftcleave", kind: "arm", tier: 1, glyph: "rift", name: "Riftcleave", tag: "RARE ARM", bonus: "ARM / STACK RIFT", spec: "A longer tooth. Rare slash." },
    { id: "gyre", kind: "arm", tier: 2, glyph: "gyre", name: "Gyre", tag: "SUPER ARM", bonus: "ARM / STACK GYRE", spec: "The blades remember a wider ring." },
    { id: "hymnfield", kind: "arm", tier: 1, glyph: "hymn", name: "Hymnfield", tag: "RARE ARM", bonus: "ARM / STACK HYMN", spec: "The song has reach. Rare aura." },
    { id: "truthseek", kind: "arm", tier: 2, glyph: "truth", name: "Truthseek", tag: "SUPER ARM", bonus: "ARM / STACK TRUTH", spec: "It will not miss a lie. Super hunt." },
    { id: "latticearc", kind: "arm", tier: 3, glyph: "arc", name: "Lattice Arc", tag: "LEGEND ARM", bonus: "ARM / STACK ARC", spec: "A legendary jump of light. The hall will remember." },
    { id: "cistern", kind: "gift", tier: 0, glyph: "well", name: "Cistern", tag: "WELL", bonus: "+25 MAX HP", spec: "A cistern cut in the floor. The well is 25 deeper and you drink it.", maxHp: 25 },
    { id: "deepwell", kind: "gift", tier: 1, glyph: "well", name: "Deep Well", tag: "WELL", bonus: "+40 MAX HP", spec: "Stone remembers a deeper cup. Forty more, filled now.", maxHp: 40 },
    { id: "marrow", kind: "gift", tier: 0, glyph: "plate", name: "Marrow Plate", tag: "WELL", bonus: "+15 MAX · +1 IRON", spec: "Bone in the plate. A little well, a little fairness.", maxHp: 15, addIron: 1 },
    { id: "secondcup", kind: "gift", tier: 0, glyph: "flask", name: "Second Cup", tag: "WELL", bonus: "+20 MAX · +1 VIAL", spec: "Another flask in the belt, and room to drink it.", maxHp: 20, addVials: 1 },
    { id: "latticeblood", kind: "gift", tier: 1, glyph: "wind", name: "Lattice Blood", tag: "WELL", bonus: "+30 MAX · REGEN 8s", spec: "The weave seeps. Thirty more, then a short mend.", maxHp: 30, tRegen: 8 },
    { id: "doorflesh", kind: "gift", tier: 0, glyph: "thorn", name: "Door Flesh", tag: "WELL", bonus: "+12 MAX · THORNS 8s", spec: "The door grows a hide. Bumpers bleed.", maxHp: 12, tThorns: 8 },
    { id: "namedpulse", kind: "gift", tier: 1, glyph: "spark", name: "Named Pulse", tag: "WELL", bonus: "+20 MAX · COD 6s", spec: "The name in the well fires with you.", maxHp: 20, tShot: 6 },
    { id: "fairwell", kind: "gift", tier: 1, glyph: "ward", name: "Fair Well", tag: "WELL", bonus: "+12 MAX (PARTY)", spec: "Everyone living drinks. Fairness as a cistern.", maxHp: 12 },
    { id: "frostmarrow", kind: "gift", tier: 1, glyph: "void", name: "Frost Marrow", tag: "WELL", bonus: "+18 MAX · STUN PULSE", spec: "Cold in the cup. A pulse that stills, then you drink.", maxHp: 18, stunR: 1 },
    { id: "emberwell", kind: "gift", tier: 1, glyph: "cinder", name: "Ember Well", tag: "WELL", bonus: "+18 MAX · +1 HASTE", spec: "The forge in the well. Hands quicker after the drink.", maxHp: 18, addHaste: 1 },
    { id: "rootdrink", kind: "gift", tier: 0, glyph: "pull", name: "Root Drink", tag: "WELL", bonus: "+22 MAX · PULL", spec: "Living stone in the cup. Relics lean harder.", maxHp: 22, addMagnet: 0.4 },
    { id: "tidecup", kind: "gift", tier: 0, glyph: "boot", name: "Tide Cup", tag: "WELL", bonus: "+16 MAX · SWIFT 5s", spec: "The lattice learned to drink. You learned to run.", maxHp: 16, tSwift: 5 },
    { id: "goldsip", kind: "gift", tier: 0, glyph: "coin", name: "Gold Sip", tag: "WELL", bonus: "+10 MAX · +250 HALL", spec: "Tithe in the cup. A mark and a little well.", maxHp: 10, addScore: 250 },
    { id: "voidsip", kind: "gift", tier: 1, glyph: "veil", name: "Void Sip", tag: "WELL", bonus: "+14 MAX · VEIL 4s", spec: "A sip where names go. You are harder to hold.", maxHp: 14, tVeil: 4 },
    { id: "lanternsip", kind: "gift", tier: 1, glyph: "lamp", name: "Lantern Sip", tag: "WELL", bonus: "+10 MAX · +FOG", spec: "Light in the cup. The fog yields a step.", maxHp: 10, addLamp: 1 },
    { id: "corewell", kind: "gift", tier: 1, glyph: "core", name: "Core Well", tag: "WELL", bonus: "+15 MAX · +1 CORE", spec: "A named coal in the cistern. Shot and well together.", maxHp: 15, addCore: 1 },
    { id: "phialheart", kind: "gift", tier: 1, glyph: "sigil", name: "Phial Heart", tag: "WELL", bonus: "+20 MAX · +1 RES", spec: "Resonance in the blood. Vials hit, the well holds.", maxHp: 20, addVialPow: 1 },
    { id: "longstride", kind: "gift", tier: 0, glyph: "boot", name: "Long Stride", tag: "WELL", bonus: "+10 MAX · +2 STRIDE", spec: "The corridor shortens and the cup is a little deeper.", maxHp: 10, addStride: 2 },
    { id: "volleywell", kind: "gift", tier: 0, glyph: "volley", name: "Volley Well", tag: "WELL", bonus: "+10 MAX · +1 VOLLEY", spec: "One more bolt in the air, and room to stand it.", maxHp: 10, addCap: 1 },
    { id: "piercevein", kind: "gift", tier: 0, glyph: "lens", name: "Pierce Vein", tag: "WELL", bonus: "+10 MAX · +1 PIERCE", spec: "The well is a lens. Bolts pass; you last.", maxHp: 10, addPierce: 1 },
    { id: "mightwell", kind: "gift", tier: 0, glyph: "tooth", name: "Might Well", tag: "WELL", bonus: "+12 MAX · +1 MIGHT", spec: "A sharper tooth and a deeper cup.", maxHp: 12, addMight: 1 },
    { id: "reboundcup", kind: "gift", tier: 1, glyph: "mirror", name: "Rebound Cup", tag: "WELL", bonus: "+8 MAX · REFLECT 6s", spec: "Fairness in the drink. Shots turn for a short hour.", maxHp: 8, tReflect: 6 },
    { id: "choruswell", kind: "gift", tier: 1, glyph: "flask", name: "Chorus Well", tag: "WELL", bonus: "+24 MAX · +2 VIALS", spec: "The chorus fills the cistern. Two flasks, twenty-four more.", maxHp: 24, addVials: 2 },
    { id: "originpulse", kind: "gift", tier: 2, glyph: "sun", name: "Origin Pulse", tag: "WELL", bonus: "+50 MAX HP", spec: "A taste of the Origin Well. Fifty more, filled.", maxHp: 50 },
    { id: "packhide", kind: "bond", tier: 0, glyph: "plate", name: "Pack Hide", tag: "BOND", bonus: "PET +24 HP", spec: "The beast drinks. Hide thickens; the cup fills.", need: "pet", addPetHp: 24 },
    { id: "sharptooth", kind: "bond", tier: 0, glyph: "tooth", name: "Sharp Tooth", tag: "BOND", bonus: "PET +28% DMG", spec: "The pack keeps a sharper tooth. Arts bite harder.", need: "pet", addPetDmg: 0.28 },
    { id: "quickpad", kind: "bond", tier: 0, glyph: "boot", name: "Quick Pad", tag: "BOND", bonus: "PET +SPD · FASTER ARTS", spec: "Paws find the corridor. Arts cycle sooner.", need: "pet", addPetSpd: 0.12, addPetCd: 0.12 },
    { id: "packiron", kind: "bond", tier: 0, glyph: "plate", name: "Pack Iron", tag: "BOND", bonus: "PET +2 ARMOR", spec: "Fair plate on the beast. Bumps land softer.", need: "pet", addPetArmor: 2 },
    { id: "stompwider", kind: "bond", tier: 1, glyph: "ward", name: "Wider Ring", tag: "BOND", bonus: "PET +18% AOE", spec: "Stomp, bite, roar — the ring grows a step.", need: "pet", addPetAoe: 0.18 },
    { id: "packfury", kind: "bond", tier: 2, glyph: "fury", name: "Pack Fury", tag: "BOND", bonus: "PET DMG + ARTS", spec: "The hour is red for the pack. Bite and haste together.", need: "pet", addPetDmg: 0.35, addPetCd: 0.14 },
    { id: "shortnap", kind: "bond", tier: 1, glyph: "wind", name: "Short Nap", tag: "BOND", bonus: "SLEEP −15s", spec: "They wake sooner. Sleep cannot hold the pack a full minute.", need: "any", addSleepCut: 15 },
    { id: "packwake", kind: "bond", tier: 1, glyph: "wind", name: "Pack Wake", tag: "BOND", bonus: "WAKE · 60% WELL", spec: "A hand on the flank. Sleeping helpers rise now.", need: "any" },
    { id: "sharedcup", kind: "bond", tier: 0, glyph: "flask", name: "Shared Cup", tag: "BOND", bonus: "PET+AI HEAL 40%", spec: "The well remembers the pack. Everyone beside you drinks.", need: "any" },
    { id: "secondvoice", kind: "bond", tier: 1, glyph: "core", name: "Second Voice", tag: "BOND", bonus: "AI +1 MIGHT · +1 HASTE", spec: "The companion's bolts keep a sharper clock.", need: "ai" },
    { id: "followtight", kind: "bond", tier: 0, glyph: "boot", name: "Tight Follow", tag: "BOND", bonus: "AI +STRIDE · COD 5s", spec: "They keep your heel. A short Codex for the helper.", need: "ai" },
    { id: "latticeleash", kind: "bond", tier: 1, glyph: "pull", name: "Lattice Leash", tag: "BOND", bonus: "PET DMG · AI +MIGHT", spec: "The leash is a name. Beast and warden bite together.", need: "any", addPetDmg: 0.2 },
    { id: "callpack", kind: "bond", tier: 1, glyph: "ward", name: "Call the Pack", tag: "BOND", bonus: "SUMMON PET", spec: "If you walked in alone, a mythic pads in now.", need: "" },

    /* --- variety pass: cards that add a *behaviour*, not another number --------- */
    { id: "leech", kind: "stat", tier: 1, glyph: "wind", name: "Drink the Cut", tag: "LEECH", bonus: "+1 LEECH", stack: "leech", spec: "Every kill you are near pours a mouthful back. The well is fed by the horde." },
    { id: "bounty", kind: "stat", tier: 1, glyph: "pull", name: "Tithe Sense", tag: "TITHE", bonus: "+RELICS DROP", stack: "bounty", spec: "You smell where the floor keeps its coin. More relics break loose per kill." },
    { id: "momentum", kind: "stat", tier: 1, glyph: "boot", name: "Momentum", tag: "STRIDE", bonus: "+1 STRIDE · +1 HASTE", stack: "stride", spec: "Run and fire are one motion now.", addStride: 1, addHaste: 1 },
    { id: "thickhide", kind: "stat", tier: 1, glyph: "plate", name: "Thick Hide", tag: "IRON", bonus: "+2 IRON", stack: "iron", spec: "The stone learns your shape and stops arguing with it.", addIron: 2 },
    { id: "volleyloop", kind: "stat", tier: 2, glyph: "volley", name: "Loop Volley", tag: "VOLLEY", bonus: "+2 LIVE BOLTS · +1 PIERCE", stack: "extraCap", spec: "The line never empties. Two more bolts in the air, and they pass a body.", addPierce: 1 },
    { id: "vialstorm", kind: "stat", tier: 2, glyph: "sigil", name: "Vial Storm", tag: "VIAL", bonus: "+3 VIALS · +2 RES", stack: "vialPow", spec: "The chorus arrives all at once. Three flasks, and each one is a name.", addVials: 3 },

    /* --- legends: jackpots that only surface once the run has teeth ----------- */
    { id: "fournames", kind: "gift", tier: 3, glyph: "core", name: "The Four Names", tag: "LEGEND", bonus: "+1 MIGHT · +1 IRON · +1 HASTE", spec: "Song, memory, flame, continuum. The gate opens for all four, and the warden carries them.", addMight: 1, addIron: 1, addHaste: 1, maxHp: 30 },
    { id: "newaccord", kind: "gift", tier: 3, glyph: "ward", name: "A New Accord", tag: "LEGEND", bonus: "+40 MAX · AEGIS 10s · PARTY", spec: "Everyone living signs it. The door holds because you all agreed it would.", maxHp: 40, tAegis: 10 },
    { id: "havenheart", kind: "gift", tier: 3, glyph: "well", name: "Haven Heart", tag: "LEGEND", bonus: "+60 MAX · REGEN 12s · HEAL", spec: "The haven kept a cup for the end of the world. It is still full.", maxHp: 60, tRegen: 12 },
    { id: "emberion", kind: "gift", tier: 3, glyph: "fury", name: "Emberion's Coal", tag: "LEGEND", bonus: "FURY 14s · +2 MIGHT · +2 CORES", spec: "A bronze dragon's last warm coal. Bolt and bite keep the promise.", tFury: 14, addMight: 2, addCore: 2 }
  ];
  const SURVIVE_BOSSES = ["gate", "crown", "smith", "heartboss", "levi", "tithe", "unnamer", "lock"];
  const SUPER_BOSSES = ["unspool", "titheking", "nameeater"];

  /* Pacing: one curve, three jobs.
       · Levels cost real time — `xp` is what a level costs, so the run stays long.
       · The first `knee` seconds are deliberately quiet (opening cadence is a fraction of
         `spawn`), so a player has room to read the map and stack a few cards.
       · Past the knee the horde climbs on a power curve — the survival-roguelite shape: a
         slow stalk, then a flood that does not stop growing.
     Campaign and Endless use time-on-this-floor for the same curve, so a floor has its own
     quiet opening and its own flood if the warden dawdles. */
  /* ---- The wave clock ---------------------------------------------------
     One wave is one minute, so the wave NUMBER is the minute the warden is in: a run on wave 13
     has survived thirteen minutes. A wave is not a spawn rate, it is a standing target — what
     the field is allowed to have on it right now — and the cadence below just chases that number.

       waves 1-8    fodder ramps 100 per wave, ramped ACROSS the wave: wave 1 runs 1 → 100,
                    wave 2 100 → 200, and on to wave 8 ending at 800.
       wave 8+      the fodder field is pinned at 800 for the rest of the run.
       wave 9+      the ramp moves to the named ones: wave 9 runs 1 → 25, wave 10 25 → 50, rising
                    25 a wave after that. They are the expensive ones — big health pools, their
                    own abilities — and they are capped for the machine's sake, not the warden's.

     So the difficulty curve is: a bigger crowd for eight minutes, then a crowd that never gets
     bigger while the things standing in it get harder. */
  const WAVE = {
    sec: 60,        /* one wave per minute */
    norm: 100,      /* fodder added per wave, ramped across the wave */
    normCap: 800,   /* the fodder field tops out here... */
    normWaves: 8,   /* ...at the end of wave 8 */
    bossAt: 9,      /* the named ones are a wave band from here */
    boss: 25,       /* named added per wave, ramped across the wave */
    bossCap: 120,   /* hard ceiling on the named ones: frame budget, not fairness */
    entCap: 1100    /* everything alive at once */
  };
  function waveOf(t) { return 1 + Math.floor(Math.max(0, t || 0) / WAVE.sec); }
  function waveFrac(t) { return (Math.max(0, t || 0) % WAVE.sec) / WAVE.sec; }
  /* What the fodder field is allowed to hold right now. */
  function waveNormals(t) {
    const w = waveOf(t);
    if (w > WAVE.normWaves) return WAVE.normCap;
    /* Wave 1 is a floor of one: the hall is never empty, it just opens with a single foe. */
    return Math.max(1, Math.min(WAVE.normCap, Math.round(WAVE.norm * (w - 1 + waveFrac(t)))));
  }
  /* What the named band is allowed to hold right now — nothing at all before wave 9. */
  function waveBosses(t) {
    const w = waveOf(t);
    if (w < WAVE.bossAt) return 0;
    return Math.min(WAVE.bossCap, Math.round(WAVE.boss * (w - WAVE.bossAt + waveFrac(t))));
  }

  const PACING = {
    xp: 1.5,      /* level cost multiplier — slower levels, longer run */
    spawn: 1.0,   /* fleet rate at the first breath — a busy hall, not an empty one */
    gate: 1.45,   /* fleet rate at the knee (the pre-knee climb stays deliberately gentle) */
    base: 0.7,    /* the old knee rate, kept as the reference the field cap grows from */
    knee: 180,    /* seconds of the slow climb before the flood starts */
    rosterAt: 120, /* the random-boss roster opens here, on top of every other spawner */
    rise: 0.98,   /* absolute climb per minute past the knee (same slope as before) */
    exp: 1.3
  };
  const KILL_XP = 1;      /* one body, one point: the level curve below is measured in kills */
  function rampTime() {
    if (!G) return 0;
    return G.mode === "survive" ? (G.t || 0) : (G.floorT != null ? G.floorT : (G.t || 0));
  }
  /* The hall is BUSY from the first breath, then climbs GENTLY to the knee (1.0 → 1.45×), and
     only past the knee goes up on a power curve. A quiet opening read as empty — a handful of
     foes with nothing to shoot between them — so the floor now sits near the old full rate
     instead of under half of it. "Slow climb, then flood" is kept by flattening the pre-knee
     slope, not by starving the opening. */
  function paceRamp() {
    const t = rampTime(), k = PACING.knee;
    if (t < k) { const u = t / k; return PACING.spawn + (PACING.gate - PACING.spawn) * Math.pow(u, 1.6); }
    const over = (t - k) / 60;
    return PACING.gate + PACING.rise * Math.pow(over, PACING.exp);
  }
  function paceXp(n) { return Math.round(n * PACING.xp); }
  function paceGap(sec) { return sec / paceRamp(); }
  function pacePack(n) { return Math.max(1, Math.round(n * paceRamp())); }
  /* ---- The roster: random bosses on the crypt's own clock -------------------------------
     From PACING.rosterAt (two minutes) named things start arriving ON TOP of the wave spawns
     and the fodder: one at first, then two, then three, and closer together the longer the run
     has gone. They are deliberate bullet sponges — several times a super's health, a heavier
     hand than the fodder, and not part of the crowd budget, so a saturated floor still spawns
     them. The answer is never to stand and trade: break off, walk them down, and do NOT let
     them pile up, because three or more alive at once press together and hit 25% harder. */
  function rosterOver() { return Math.max(0, rampTime() - PACING.rosterAt) / 60; }
  function rosterN() { return 1 + Math.floor(rosterOver() / 3.2); }
  function rosterGap() { return Math.max(9, 32 - rosterOver() * 1.7); }
  function rosterBuff() { return 2.6 + rosterOver() * 0.22; }
  /* A walkable spot at least `minD` from the live warden, ignoring the crowd cap. */
  function rosterSpot(live, minD) {
    const lv = G.level;
    if (!lv || !lv.tiles) return null;
    for (let t = 0; t < 300; t++) {
      const tx = (4 + Math.random() * Math.max(8, lv.W - 8)) | 0;
      const ty = (4 + Math.random() * Math.max(8, lv.H - 8)) | 0;
      if (!lv.tiles[ty] || lv.tiles[ty][tx] !== "floor") continue;
      if (Math.hypot(tx + 0.5 - live.x, ty + 0.5 - live.y) < minD) continue;
      return { x: tx + 0.5, y: ty + 0.5 };
    }
    return null;
  }
  function rosterSpawn() {
    const lv = G.level;
    const live = G.players.find(function (p) { return !p.dead; }) || G.players[0];
    if (!lv || !live) return 0;
    const minD = G.mode === "survive" ? visionRange(live) + 1.5 : 8;
    const sp = rosterSpot(live, minD);
    if (!sp) return 0;
    const pool = Math.random() < 0.18 ? SUPER_BOSSES : SURVIVE_BOSSES;
    const kind = pool[(Math.random() * pool.length) | 0];
    const rank = G.mode === "survive"
      ? 1 + Math.min(6, ((G.lvl || 1) / 3) | 0)
      : Math.max(1, Math.round((threatIndex() || 1) * 0.4));
    lv.foes.push(makeFoe(kind, rank, sp.x, sp.y));
    const f = lv.foes[lv.foes.length - 1];
    f.roster = true;
    f.hp = Math.round(f.hp * rosterBuff());
    f.max = f.hp;
    f.rage = 1;
    return 1;
  }
  function rosterTick(dt) {
    /* In the wave modes the named ones ARE the wave band: nothing named walks before wave 9, and
       after that their number is the wave's business — wave 9 fills from 1 to 25, wave 10 from
       25 to 50, rising until the frame budget stops it. A campaign floor is short and authored,
       so it keeps its own clock: the floor gets nastier the longer the warden dawdles on it. */
    const waves = G.mode === "survive" || G.mode === "endless";
    if (!waves && rampTime() < PACING.rosterAt) return;
    const live = (G.rosCount = G.level.foes.filter(function (f) { return f.roster; }).length);
    /* Stacking is the punishment: three or more on the floor at once press together. */
    const stacked = live >= 3;
    if (stacked) {
      G.level.foes.forEach(function (f) { if (f.roster) f.rage = 1.25; });
      if (!G.rosSaid) { G.rosSaid = 1; say("The named ones press together. Break the pile."); }
    } else {
      G.level.foes.forEach(function (f) { if (f.roster) f.rage = 1; });
    }
    /* The band is a standing population, so the clock only decides how fast it fills. */
    const want = waves ? waveBosses(G.t || 0) : Infinity;
    if (waves && live >= want) return;
    G.rosT = (G.rosT == null ? 3 : G.rosT) - dt;
    if (G.rosT > 0) return;
    G.rosT = waves ? 1.1 : rosterGap();
    let made = 0;
    const bite = waves ? Math.max(1, Math.min(8, want - live)) : rosterN();
    for (let i = 0; i < bite; i++) made += rosterSpawn();
    if (made) {
      const list = G.level.foes.filter(function (f) { return f.roster; });
      const last = list[list.length - 1];
      if (last) say((BOSS_NAME[last.kind] || "A named one") + (made > 1 ? " and " + (made - 1) + " more walk the floor." : " walks the floor."));
    }
  }
  /* Pressure: what the tide does to a warden who is still standing. The ramp decides how MANY
     arrive; pressure decides how hard each one hits and how much it takes to put down, and it
     has no ceiling on purpose — a build that cannot kill faster than this climbs is eventually
     buried, however good it is. 1x at the knee, ~3x five minutes past it, ~8x at ten, ~15x at
     fifteen. Good play and a good build buy time; they do not buy forever. */
  function pressure() {
    const over = Math.max(0, (rampTime() - PACING.knee) / 60);
    return 1 + 0.14 * over + 0.055 * over * over;
  }

  function surviveWave() { return G ? waveOf(G.t || 0) : 1; }
  /* One curve for every mode: campaign and endless level a touch slower than Survival,
     because a floor is a fixed amount of stone rather than an endless tide. */
  function modeXpMul() {
    if (!G) return 1;
    if (G.mode === "survive") return 1;
    return G.mode === "campaign" ? 1.16 : 1.08;
  }
  function xpNeed(lv) {
    /* Measured in BODIES, not minutes. The cost of the next level is a kill count, so two
       wardens playing the same way level at the same rate whatever the tide happens to be
       doing, and the wave ramp and the level ramp cannot drift apart: a run that reaches wave
       13 has killed roughly what a wave-13 run kills, and is therefore roughly the level it
       should be. A named one is worth fourteen fodder and a set-piece thirty, which is what
       keeps a boss wave from being a level-up desert. */
    lv = Math.max(1, lv | 0);
    return Math.max(4, Math.round(paceXp(14 * Math.pow(lv, 1.55)) * modeXpMul()));
  }
  function surviveXpNeed(lv) { return xpNeed(lv); }
  function levelUpParty() {
    G.players.forEach(function (p) {
      if (p.dead) return;
      p.max += 10;
      p.hp = Math.min(p.max, p.hp + 10);
    });
    /* The pack grows with the wardens — a companion that scales with you is a companion. */
    (G.pets || []).forEach(function (pet) {
      pet.max += 8;
      pet.hp = Math.min(pet.max, pet.hp + 8);
    });
  }
  function threatIndex() {
    if (!G) return 0;
    if (G.mode === "survive") {
      const L = Math.max(1, G.lvl || 1);
      const W = surviveWave();
      return Math.max(0, (L - 1) + 0.55 * (W - 1));
    }
    return Math.max(0, G.floor || 0);
  }
  function hpScale() {
    const t = threatIndex();
    /* Depth, then time on the floor: dawdling in a deep hall is punished on both axes. */
    return (1 + 0.11 * t + (0.007 * t * t) / (t + 14)) * Math.pow(pressure(), 0.75);
  }
  function spdScale() {
    return Math.min(1.38, 1 + 0.012 * threatIndex());
  }
  function dmgScale() {
    const t = threatIndex();
    return (1 + 0.055 * t + (0.0035 * t * t) / (t + 18)) * pressure();
  }
  function hallMark(kind) {
    if (!G || !window.ArcadeLedger) return;
    const posted = Math.max(0, (G.score / Math.max(1, G.credits)) | 0);
    ArcadeLedger.crypt({
      name: (persist.name || "Warden").slice(0, 18),
      score: posted,
      raw: G.score,
      floor: G.mode === "survive" ? surviveWave() : (G.floor + 1),
      credits: G.credits,
      mode: G.mode,
      lvl: G.lvl || 1,
      mark: kind || "run",
      date: new Date().toISOString().slice(0, 10)
    });
  }

  function genSurvive(seed) {
    const R = rng(seed ^ 0x51A11);
    const W = 256, H = 224;
    const tiles = Array.from({ length: H }, () => Array(W).fill("floor"));
    for (let x = 0; x < W; x++) {
      for (let k = 0; k < 3; k++) { tiles[k][x] = "wall"; tiles[H - 1 - k][x] = "wall"; }
    }
    for (let y = 0; y < H; y++) {
      for (let k = 0; k < 3; k++) { tiles[y][k] = "wall"; tiles[y][W - 1 - k] = "wall"; }
    }
    const nRuin = 110 + ((R() * 50) | 0);
    for (let n = 0; n < nRuin; n++) {
      const rw = 2 + ((R() * 9) | 0), rh = 2 + ((R() * 8) | 0);
      const rx = 8 + ((R() * (W - rw - 16)) | 0);
      const ry = 8 + ((R() * (H - rh - 16)) | 0);
      fillRect(tiles, W, H, rx, ry, rw, rh, "wall");
      if (R() < 0.75) {
        const side = (R() * 4) | 0;
        if (side === 0) tiles[ry][rx + (rw >> 1)] = "floor";
        else if (side === 1) tiles[ry + rh - 1][rx + (rw >> 1)] = "floor";
        else if (side === 2) tiles[ry + (rh >> 1)][rx] = "floor";
        else tiles[ry + (rh >> 1)][rx + rw - 1] = "floor";
      }
    }
    for (let n = 0; n < 22; n++) {
      if (R() < 0.5) {
        const x = 10 + ((R() * (W - 20)) | 0);
        const y0 = 10 + ((R() * (H - 50)) | 0);
        const len = 22 + ((R() * 50) | 0);
        for (let y = y0; y < y0 + len && y < H - 8; y++) {
          tiles[y][x] = R() < 0.14 ? "floor" : "wall";
          if (R() < 0.35 && x + 1 < W - 4) tiles[y][x + 1] = tiles[y][x];
        }
      } else {
        const y = 10 + ((R() * (H - 20)) | 0);
        const x0 = 10 + ((R() * (W - 50)) | 0);
        const len = 22 + ((R() * 50) | 0);
        for (let x = x0; x < x0 + len && x < W - 8; x++) {
          tiles[y][x] = R() < 0.14 ? "floor" : "wall";
          if (R() < 0.35 && y + 1 < H - 4) tiles[y + 1][x] = tiles[y][x];
        }
      }
    }
    const start = { x: W >> 1, y: H >> 1 };
    /* The middle of a continent is a plaza, not a landing pad: wide enough to fight a horde
       across with the cross-lanes running out of it. */
    fillRect(tiles, W, H, start.x - 24, start.y - 17, 48, 34, "floor");
    for (let x = 3; x < W - 3; x++) {
      tiles[start.y][x] = "floor";
      tiles[start.y - 1][x] = "floor";
      tiles[start.y + 1][x] = "floor";
    }
    for (let y = 3; y < H - 3; y++) {
      tiles[y][start.x] = "floor";
      tiles[y][start.x - 1] = "floor";
      tiles[y][start.x + 1] = "floor";
    }
    tiles[start.y][start.x] = "floor";
    function stampPlaza(cx, cy, r) {
      fillRect(tiles, W, H, cx - r, cy - r, r * 2, r * 2, "floor");
      [[cx - 4, cy - 4], [cx + 3, cy - 4], [cx - 4, cy + 3], [cx + 3, cy + 3]].forEach(function (pt) {
        if (tiles[pt[1]] && tiles[pt[1]][pt[0]] !== undefined) tiles[pt[1]][pt[0]] = "wall";
      });
    }
    /* Plaza radius, and the reach of the four corners, both scale with the region so the open
       ground stays open on a 140x120 map instead of thinning into corridors. */
    const PR = Math.round(Math.min(W, H) * 0.14);
    stampPlaza(start.x - 48, start.y - 40, PR);
    stampPlaza(start.x + 48, start.y - 40, PR);
    stampPlaza(start.x - 48, start.y + 40, PR);
    stampPlaza(start.x + 48, start.y + 40, PR);
    stampPlaza(18 + ((R() * 20) | 0), 18 + ((R() * 20) | 0), Math.round(PR * 0.8));
    stampPlaza(W - 28 - ((R() * 16) | 0), H - 28 - ((R() * 16) | 0), Math.round(PR * 0.8));
    /* Four more rooms at the edge midpoints: the difference between "a corridor runs through
       the region" and "there are places in the region to fight", which is the whole feel. */
    stampPlaza(Math.round(W * 0.5), Math.round(H * 0.12), Math.round(PR * 0.85));
    stampPlaza(Math.round(W * 0.5), Math.round(H * 0.88), Math.round(PR * 0.85));
    stampPlaza(Math.round(W * 0.12), Math.round(H * 0.5), Math.round(PR * 0.85));
    stampPlaza(Math.round(W * 0.88), Math.round(H * 0.5), Math.round(PR * 0.85));
    const pads = [];
    const plazas = [
      { x: start.x - 48, y: start.y - 40 }, { x: start.x + 48, y: start.y - 40 },
      { x: start.x - 48, y: start.y + 40 }, { x: start.x + 48, y: start.y + 40 }
    ];
    plazas.forEach(function (p, i) {
      const n = plazas[(i + 1) % plazas.length];
      tiles[p.y][p.x] = "pad";
      pads.push({ x: p.x, y: p.y, tx: n.x + 0.5, ty: n.y + 0.5 });
    });
    const items = [];
    const bag = ["food", "berry", "coin", "flask", "vial", "chest", "core", "coin", "moss", "scrap", "magnet", "fury", "echo", "fan", "cleave", "seek", "gem", "iron"];
    for (let i = 0; i < 108; i++) {
      let p = null;
      for (let k = 0; k < 40; k++) {
        const x = 6 + ((R() * (W - 12)) | 0), y = 6 + ((R() * (H - 12)) | 0);
        if (tiles[y][x] === "floor" && (x !== start.x || y !== start.y)) { p = { x, y }; break; }
      }
      if (p) items.push({ x: p.x, y: p.y, kind: R() < 0.22 ? rollLoot(R) : bag[(R() * bag.length) | 0] });
    }
    /* The lanes ARE the gauntlets, and they are data rather than lore: the ring that joins the
       four corner courts, and the two runs through the middle where the region is thinnest.
       Declared so the shape of a survive map can be measured — an open lane is the entire
       reason running and shooting works on a continent this size. */
    const gauntlets = plazas.map(function (p, i) {
      const n = plazas[(i + 1) % plazas.length];
      const wide = 7;
      return {
        ax: p.x, ay: p.y, bx: n.x, by: n.y, wide,
        x: Math.max(1, Math.min(p.x, n.x) - (wide >> 1)),
        y: Math.max(1, Math.min(p.y, n.y) - (wide >> 1)),
        w: Math.abs(n.x - p.x) + wide, h: Math.abs(n.y - p.y) + wide
      };
    });
    gauntlets.push({
      ax: Math.max(6, start.x - 60), ay: start.y, bx: Math.min(W - 7, start.x + 60), by: start.y, wide: 7,
      x: Math.max(1, start.x - 64), y: start.y - 4, w: 128, h: 8
    });
    gauntlets.push({
      ax: start.x, ay: Math.max(6, start.y - 50), bx: start.x, by: Math.min(H - 7, start.y + 50), wide: 7,
      x: start.x - 4, y: Math.max(1, start.y - 54), w: 8, h: 108
    });
    return contentBox({
      W, H, tiles, start, items, gens: [], foes: [], doors: [], pads: pads, gauntlets,
      realm: REALMS[seed % 8],
      layout: "The Long Crypt",
      lore: "No exit. A continent of stone. The lattice pours. Grow or be unnamed.",
      treasure: 0, quiet: 0, survive: true, chunkSize: 16
    });
  }

  function genLevel(seed, floor, mode) {
    if (mode === "survive") return genSurvive(seed);
    if (mode === "campaign" && window.LatticeCampaign && floor < window.LatticeCampaign.LEN) {
      return window.LatticeCampaign.build(floor, makeFoe, rollLoot);
    }
    const R = rng(seed ^ (floor * 7919));
    /* Endless is a region, not a room: 140x120 of open stone, big enough that running and
       shooting reads as the point of the floor. The layout is carved first and the open ground
       is then stamped as a fraction of the region — four corner courts, four edge rooms, two
       odd courtyards — so a cross is a highway with places to fight on it and a vault is a
       storehouse you can circle, instead of either being thin lines across a field of rock. */
    const W = 140, H = 120;
    const tiles = Array.from({ length: H }, () => Array(W).fill("wall"));
    const layouts = ["rooms", "cross", "cells", "halls", "arena", "ring", "vault", "spiral"];
    const kind = floor % 8 === 0 && floor > 0 ? "vault" : layouts[floor % 8];
    const rooms = carveLayout(tiles, W, H, R, kind);
    const PR = Math.max(6, Math.round(Math.min(W, H) * 0.09));
    const courts = [];
    function stampPlaza(cx, cy, r) {
      fillRect(tiles, W, H, cx - r, cy - r, r * 2, r * 2, "floor");
      courts.push({ x: cx, y: cy });
    }
    const cx0 = W >> 1, cy0 = H >> 1;
    stampPlaza(cx0 - 48, cy0 - 40, PR);
    stampPlaza(cx0 + 48, cy0 - 40, PR);
    stampPlaza(cx0 - 48, cy0 + 40, PR);
    stampPlaza(cx0 + 48, cy0 + 40, PR);
    stampPlaza(cx0, Math.round(H * 0.11), Math.round(PR * 0.9));
    stampPlaza(cx0, Math.round(H * 0.89), Math.round(PR * 0.9));
    stampPlaza(Math.round(W * 0.11), cy0, Math.round(PR * 0.9));
    stampPlaza(Math.round(W * 0.89), cy0, Math.round(PR * 0.9));
    stampPlaza(16 + ((R() * 18) | 0), 16 + ((R() * 18) | 0), Math.round(PR * 0.8));
    stampPlaza(W - 26 - ((R() * 14) | 0), H - 26 - ((R() * 14) | 0), Math.round(PR * 0.8));
    /* Walk each court back to the layout. A court dropped beside a seven-tile lane is an
       island, and a floor that seeds loot and nexuses onto ground the warden cannot reach is
       a floor that lies about itself. Lanes are cut three tiles wide so a court is a place you
       walk into, not a slot you squeeze down. */
    function link(ax, ay, bx, by) {
      let x = ax, y = ay;
      while (x !== bx) {
        x += x < bx ? 1 : -1;
        for (let d = -1; d <= 1; d++) if (tiles[y + d]) tiles[y + d][x] = "floor";
      }
      while (y !== by) {
        y += y < by ? 1 : -1;
        for (let d = -1; d <= 1; d++) if (tiles[y] && tiles[y][x + d] !== undefined) tiles[y][x + d] = "floor";
      }
    }
    courts.forEach(function (c) {
      let best = null, bd = Infinity;
      rooms.forEach(function (r) {
        const d = Math.abs(r.cx - c.x) + Math.abs(r.cy - c.y);
        if (d < bd) { bd = d; best = r; }
      });
      if (best) link(c.x, c.y, best.cx, best.cy);
    });
    const spots = floorsOf(tiles, W, H);
    const pickSpot = () => spots[(R() * spots.length) | 0] || { x: 2, y: 2 };
    const start = rooms[0] ? { x: rooms[0].cx, y: rooms[0].cy } : pickSpot();
    if (tiles[start.y][start.x] === "wall") Object.assign(start, pickSpot());
    let exit = rooms.length ? { x: rooms[rooms.length - 1].cx, y: rooms[rooms.length - 1].cy } : pickSpot();
    let best = 0;
    spots.forEach((p) => {
      const d = Math.abs(p.x - start.x) + Math.abs(p.y - start.y);
      if (d > best) { best = d; exit = p; }
    });
    const treasure = floor % 8 === 0 && floor > 0;
    if (treasure) {
      const corners = [
        { x: 2, y: 2 }, { x: W - 3, y: 2 }, { x: 2, y: H - 3 }, { x: W - 3, y: H - 3 }
      ].filter((p) => tiles[p.y] && tiles[p.y][p.x] === "floor");
      if (corners.length) exit = corners[(R() * corners.length) | 0];
    }
    tiles[exit.y][exit.x] = "exit";

    /* --- the gauntlet -----------------------------------------------------
       One long lane cut clear between the two rooms furthest apart, so a floor has a main
       street: open ground with the horde pouring down it and cover on the flanks to break a
       charge on. Cut after the layout passes so nothing re-seals it, and never over the exit.
       Doors are NOT cut here — a door on a procedural floor has nothing behind it worth a
       key, and one dropped in a one-tile corridor seals the way forward. Doors are authored,
       on campaign floors, where a vault and its key are designed together. */
    const gauntlets = [];
    {
      const horiz = W >= H;
      const wide = 5;
      let bestA = rooms[0], bestB = rooms[0], bestD = -1;
      rooms.forEach((r) => rooms.forEach((q) => {
        const d = Math.abs(r.cx - q.cx) + Math.abs(r.cy - q.cy);
        if (d > bestD) { bestD = d; bestA = r; bestB = q; }
      }));
      if (bestA && bestB && bestD > wide * 3) {
        const ax = bestA.cx, ay = bestA.cy, bx = bestB.cx, by = bestB.cy;
        const open = (x, y) => {
          if (x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1) return;
          const t = tiles[y][x];
          if (t === "exit" || t === "exit_lock" || t === "pad" || t === "door") return;
          tiles[y][x] = "floor";
        };
        if (horiz) {
          for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
            for (let d = -(wide >> 1); d <= (wide >> 1); d++) open(x, ay + d);
          }
        } else {
          for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
            for (let d = -(wide >> 1); d <= (wide >> 1); d++) open(ax + d, y);
          }
        }
        gauntlets.push({
          x: Math.min(ax, bx) - (wide >> 1), y: Math.min(ay, by) - (wide >> 1),
          w: Math.abs(bx - ax) + wide, h: Math.abs(by - ay) + wide, ax, ay, bx, by, wide
        });
      }
    }
    /* Cover on alternating flanks, never on the centre line, and the centre channel re-cut last
       so no stub can ever seal the road: a gauntlet you can block is just a corridor. */
    gauntlets.forEach((gt) => {
      const horiz = Math.abs(gt.bx - gt.ax) >= Math.abs(gt.by - gt.ay);
      const len = horiz ? Math.abs(gt.bx - gt.ax) : Math.abs(gt.by - gt.ay);
      const half = (gt.wide >> 1) + 1;
      const n = Math.max(3, Math.round(len / 16));
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const cx = Math.round(gt.ax + (gt.bx - gt.ax) * t);
        const cy = Math.round(gt.ay + (gt.by - gt.ay) * t);
        const off = (k % 2 ? 1 : -1) * half;
        const bx = horiz ? cx : cx + off;
        const by = horiz ? cy + off : cy;
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
          const tx = bx + dx, ty = by + dy;
          if (tx > 0 && ty > 0 && tx < W - 1 && ty < H - 1 && tiles[ty][tx] === "floor") tiles[ty][tx] = "wall";
        }
      }
      const clear = (x, y) => {
        if (x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1) return;
        if (tiles[y][x] === "wall") tiles[y][x] = "floor";
      };
      if (horiz) {
        for (let x = Math.min(gt.ax, gt.bx); x <= Math.max(gt.ax, gt.bx); x++) {
          for (let d = -1; d <= 1; d++) clear(x, gt.ay + d);
        }
      } else {
        for (let y = Math.min(gt.ay, gt.by); y <= Math.max(gt.ay, gt.by); y++) {
          for (let d = -1; d <= 1; d++) clear(gt.ax + d, y);
        }
      }
    });

    const items = [];
    const gens = [];
    const foes = [];
    const doors = [];
    const pads = [];
    const rank = 1 + Math.min(2, (floor / (mode === "endless" ? 6 : 12)) | 0);
    const used = {};
    function mark(x, y) { used[x + "," + y] = 1; }
    mark(start.x, start.y); mark(exit.x, exit.y);
    function empty() {
      for (let k = 0; k < 120; k++) {
        const x = 1 + ((R() * (W - 2)) | 0), y = 1 + ((R() * (H - 2)) | 0);
        if (tiles[y][x] === "floor" && !used[x + "," + y]) { mark(x, y); return { x, y }; }
      }
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          if (tiles[y][x] === "floor" && !used[x + "," + y]) { mark(x, y); return { x, y }; }
        }
      }
      return null;
    }
    const gN = 8 + ((R() * 5) | 0) + Math.min(14, (floor / 2) | 0);
    for (let i = 0; i < gN; i++) {
      const p = empty();
      if (!p) break;
      const gk = (floor >= 5 && R() < 0.4) ? KINDS_HOT[(R() * KINDS_HOT.length) | 0] : KINDS[(R() * KINDS.length) | 0];
      gens.push({ x: p.x, y: p.y, kind: gk, rank, hp: 3 * rank, t: R() * 0.6 });
    }
    const itemN = treasure ? 90 : Math.max(38, 58 + ((R() * 20) | 0) - (mode === "endless" ? (floor / 4) | 0 : 0));
    for (let i = 0; i < itemN; i++) {
      const p = empty();
      if (!p) break;
      let k = treasure ? (R() < 0.55 ? "chest" : rollLoot(R)) : rollLoot(R);
      /* No procedural floor cuts a door, so a key here would open nothing: pay a coin instead. */
      if (k === "key" || k === "latch" || k === "triadkey") k = "coin";
      items.push({ x: p.x, y: p.y, kind: k });
    }
    if (R() < 0.45 || floor % 5 === 4) {
      const p = empty();
      if (p) items.push({ x: p.x, y: p.y, kind: "vial", hidden: true });
    }
    /* The lane's teeth: a nexus every stretch of it so it pours from the far side, and a prize
       at the far end where the run finishes. Placement stays inside the lane — a nexus that
       wanders off the lane is a nexus on the wrong side of its own cover. */
    function gSpot(p, r) {
      const x = Math.max(r.x + 1, Math.min(r.x + r.w - 2, p.x));
      const y = Math.max(r.y + 1, Math.min(r.y + r.h - 2, p.y));
      const free = (nx, ny) => tiles[ny][nx] === "floor" && !used[nx + "," + ny];
      if (free(x, y)) { mark(x, y); return { x, y }; }
      for (let rad = 1; rad < 10; rad++) {
        for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
          const nx = x + dx, ny = y + dy;
          if (nx <= r.x || ny <= r.y || nx >= r.x + r.w - 1 || ny >= r.y + r.h - 1) continue;
          if (free(nx, ny)) { mark(nx, ny); return { x: nx, y: ny }; }
        }
      }
      return null;
    }
    gauntlets.forEach((gt) => {
      const horiz = Math.abs(gt.bx - gt.ax) >= Math.abs(gt.by - gt.ay);
      const len = horiz ? Math.abs(gt.bx - gt.ax) : Math.abs(gt.by - gt.ay);
      const n = Math.max(3, Math.round(len / 22));
      const pool = floor >= 4 ? KINDS_HOT : KINDS;
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const cx = Math.round(gt.ax + (gt.bx - gt.ax) * t);
        const cy = Math.round(gt.ay + (gt.by - gt.ay) * t);
        const p = gSpot({ x: cx, y: cy }, gt);
        if (!p) continue;
        gens.push({ x: p.x, y: p.y, kind: pool[(R() * pool.length) | 0], rank, hp: 3 * rank, t: R() * 0.6, gauntlet: 1 });
      }
      const far = horiz
        ? { x: gt.bx >= gt.ax ? gt.bx - 2 : gt.ax - 2, y: gt.by }
        : { x: gt.bx, y: gt.by >= gt.ay ? gt.by - 2 : gt.ay - 2 };
      const pz = gSpot(far, gt);
      if (pz) items.push({ x: pz.x, y: pz.y, kind: R() < 0.5 ? "chest" : rollLoot(R) });
    });
    if (R() < 0.4) {
      const a = empty(), b = empty();
      if (a && b) {
        tiles[a.y][a.x] = "pad";
        tiles[b.y][b.x] = "pad";
        pads.push({ x: a.x, y: a.y, tx: b.x + 0.5, ty: b.y + 0.5 });
        pads.push({ x: b.x, y: b.y, tx: a.x + 0.5, ty: a.y + 0.5 });
      }
    }
    if (R() < 0.35) {
      const p = empty();
      if (p) items.push({ x: p.x, y: p.y, kind: "trap" });
    }
    const idle = 18 + ((R() * 14) | 0);
    for (let i = 0; i < idle; i++) {
      const p = empty();
      if (!p) break;
      const pool = floor >= 4 ? KINDS_HOT : KINDS;
      foes.push(makeFoe(pool[(R() * pool.length) | 0], rank, p.x + 0.5, p.y + 0.5));
    }
    if (floor >= (mode === "endless" ? 3 : 6) && R() < 0.22 + floor * 0.01) {
      foes.push(makeFoe("drain", 1, exit.x + 0.5, exit.y + 0.5));
    }
    if (floor >= (mode === "endless" ? 8 : 11) && R() < 0.16 + floor * 0.008) {
      const sk = SUPER_BOSSES[floor % 3];
      foes.push(makeFoe(sk, 1, exit.x + 0.5, exit.y + 0.5));
    }
    return contentBox({
      W, H, tiles, start, items, gens, foes, doors, pads, gauntlets,
      realm: REALMS[floor % 8],
      layout: kind,
      treasure: treasure ? 30 : 0,
      quiet: 0
    });
  }

  function makeFoe(kind, rank, x, y) {
    const d = FOE[kind] || FOE.brute;
    const k = FOE[kind] ? kind : "brute";
    let hp = k === "drain" ? 99 : (d.boss ? d.hp : d.hp * rank);
    if (G) {
      if (G.mode === "survive") {
        const w = surviveWave();
        const L = Math.max(1, G.lvl || 1);
        /* Fodder take the full pressure, named things a little under it so a strong build can
           still break them open instead of standing in a wall of sponge. */
        const press = pressure();
        const heavy = Math.pow(press, 0.9);
        if (k === "drain") hp = Math.round((28 + w * 4 + (L - 1) * 3) * heavy);
        else if (d.super) hp = Math.round((36 + w * 7 + (L - 1) * 5) * heavy);
        else if (d.boss) hp = Math.round((8 + w * 3.2 + (L - 1) * 2.4) * heavy);
        else hp = Math.max(1, Math.round((1 + 0.28 * (w - 1) + 0.48 * (L - 1)) * press));
        rank = 1 + Math.min(6, ((L + w) / 6) | 0);
      } else {
        hp = Math.max(1, Math.round(hp * hpScale()));
        if (k === "drain") hp = Math.round(70 + (G.floor || 0) * 7 * hpScale());
      }
    }
    const f = window.CryptStudio && CryptStudio.pool.foe ? CryptStudio.pool.foe.alloc() : {};
    f.kind = k; f.rank = rank; f.x = x; f.y = y;
    f.hp = hp; f.max = hp;
    f.boss = !!d.boss || !!d.super;
    f.super = !!d.super;
    f.explode = !!d.explode; f.split = !!d.split; f.heal = !!d.heal; f.spr = d.spr || k;
    f.vx = 0; f.vy = 0; f.t = 0; f.hurt = 0; f.flicker = 0; f.stun = 0;
    f.phase = 1; f._splitDone = false; f._sip = 0; f.isActive = true;
    f.mut = []; f.spdBonus = 1;
    rollFoeMut(f);
    return f;
  }

  function inB(lv, x, y) { return x >= 0 && y >= 0 && x < lv.W && y < lv.H; }
  function tileAt(lv, x, y) {
    const tx = Math.floor(x), ty = Math.floor(y);
    if (!inB(lv, tx, ty)) return "wall";
    return lv.tiles[ty][tx];
  }
  function blocked(lv, x, y) {
    const t = tileAt(lv, x, y);
    return t === "wall" || t === "door" || t === "exit_lock";
  }
  function firstWallOnSeg(x0, y0, x1, y1) {
    const lv = G.level;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist * (lodOn() ? 6 : 12)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (blocked(lv, x, y) && tileAt(lv, x, y) !== "door_open") return { x, y };
    }
    return null;
  }
  function hasLos(x0, y0, x1, y1) {
    const lv = G.level;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist * 10));
    const sx = Math.floor(x0), sy = Math.floor(y0);
    const tx = Math.floor(x1), ty = Math.floor(y1);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      const gx = Math.floor(x), gy = Math.floor(y);
      if ((gx === sx && gy === sy) || (gx === tx && gy === ty)) continue;
      if (blocked(lv, x, y) && tileAt(lv, x, y) !== "door_open") return false;
    }
    return true;
  }
  function shadeHidden(f) {
    return foeHas(f, "flicker") && ((f.flicker || 0) % 1.2) < 0.5;
  }
  function initFog(lv) {
    if (!lv) return;
    lv.seen = Array.from({ length: lv.H }, function () { return new Uint8Array(lv.W); });
    lv.vis = Array.from({ length: lv.H }, function () { return new Uint8Array(lv.W); });
    lv._visMarks = [];
  }
  function tileSeen(x, y) {
    const lv = G && G.level;
    if (!lv || !lv.seen) return true;
    const tx = Math.floor(x), ty = Math.floor(y);
    return !!(lv.seen[ty] && lv.seen[ty][tx]);
  }
  function tileVis(x, y) {
    const lv = G && G.level;
    if (!lv || !lv.vis) return true;
    const tx = Math.floor(x), ty = Math.floor(y);
    return !!(lv.vis[ty] && lv.vis[ty][tx]);
  }
  function visionRange(p) {
    let r = G.mode === "survive" ? 9.2 : 8.2;
    r += (p.lamp || 0) * 2.4;
    if (p.hero && p.hero.id === "lightfather") r += 1.6;
    if (p.cores) r += Math.min(1.8, p.cores * 0.3);
    return r;
  }
  function stampVis(tx, ty) {
    const lv = G.level;
    if (!lv.vis || ty < 0 || tx < 0 || ty >= lv.H || tx >= lv.W) return;
    if (!lv.vis[ty][tx]) {
      lv.vis[ty][tx] = 1;
      lv._visMarks.push(tx, ty);
    }
    if (!lv.seen[ty][tx]) {
      lv.seen[ty][tx] = 1;
      if (lv._mapNew) lv._mapNew.push(tx, ty);
    }
  }
  function updateFog() {
    if (!G || !G.level) return;
    const lv = G.level;
    if (!lv.seen) initFog(lv);
    const marks = lv._visMarks;
    for (let i = 0; i < marks.length; i += 2) {
      const tx = marks[i], ty = marks[i + 1];
      if (lv.vis[ty]) lv.vis[ty][tx] = 0;
    }
    marks.length = 0;
    const live = G.players.filter(function (p) { return !p.dead; });
    const coarse = lodOn();
    live.forEach(function (p) {
      const r = visionRange(p);
      const r2 = r * r;
      const x0 = Math.max(0, Math.floor(p.x - r));
      const y0 = Math.max(0, Math.floor(p.y - r));
      const x1 = Math.min(lv.W - 1, Math.ceil(p.x + r));
      const y1 = Math.min(lv.H - 1, Math.ceil(p.y + r));
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const dx = tx + 0.5 - p.x, dy = ty + 0.5 - p.y;
          if (dx * dx + dy * dy > r2) continue;
          if (Math.abs(dx) <= 1.15 && Math.abs(dy) <= 1.15) { stampVis(tx, ty); continue; }
          if (coarse && ((tx + ty) & 1) && dx * dx + dy * dy > 16) {
            if (hasLos(p.x, p.y, tx + 0.5, ty + 0.5)) stampVis(tx, ty);
            continue;
          }
          if (hasLos(p.x, p.y, tx + 0.5, ty + 0.5)) stampVis(tx, ty);
        }
      }
    });
  }
  function drawFog(dest, x0, y0, x1, y1) {
    const lv = G.level;
    if (!lv.seen) return;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const vis = lv.vis[y] && lv.vis[y][x];
        const seen = lv.seen[y] && lv.seen[y][x];
        const px = Math.round(x * TILE - cam.x), py = Math.round(y * TILE - cam.y);
        if (!seen) {
          dest.fillStyle = "#020308";
          dest.fillRect(px, py, TILE + 1, TILE + 1);
        } else if (!vis) {
          dest.fillStyle = "rgba(2,4,10,0.72)";
          dest.fillRect(px, py, TILE + 1, TILE + 1);
        }
      }
    }
  }

  /* ─── Phase 9 — Lantern: radar map, objective compass, dynamic light, danger read ─── */

  const MAP_MODES = ["radar", "full", "off"];
  const MAP_SPECIAL = {
    chest: 1, core: 1, phial: 1, chalice: 1, gem: 1, heart: 1, soul: 1, crown: 1,
    codex: 1, originwell: 1, accordseal: 1, wellcrown: 1, titheband: 1, voidcloak: 1
  };
  const glowCache = {};
  let vigCache = null, vigKey = "";

  function mapMode() {
    const m = persist.mapMode;
    return MAP_MODES.indexOf(m) >= 0 ? m : "radar";
  }
  function cycleMapMode() {
    const i = MAP_MODES.indexOf(mapMode());
    persist.mapMode = MAP_MODES[(i + 1) % MAP_MODES.length];
    savePersist();
    if (persist.mapMode === "off") say("Map off.");
    else say("Map: " + persist.mapMode + ".");
    paintHud();
  }
  function mapTileColor(t) {
    if (t === "wall") return "#2b3652";
    if (t === "door") return "#22d3ee";
    if (t === "door_open") return "#155e75";
    if (t === "exit") return "#fde047";
    if (t === "pad") return "#0ea5e9";
    return "#121b2d";
  }
  function mapCacheFor(lv) {
    if (lv._mapCache) return lv._mapCache;
    const cv = document.createElement("canvas");
    cv.width = lv.W; cv.height = lv.H;
    const g = cv.getContext("2d");
    g.fillStyle = "#05070e";
    g.fillRect(0, 0, lv.W, lv.H);
    if (lv.seen) {
      for (let y = 0; y < lv.H; y++) {
        const row = lv.seen[y];
        if (!row) continue;
        for (let x = 0; x < lv.W; x++) {
          if (!row[x]) continue;
          g.fillStyle = mapTileColor(lv.tiles[y][x]);
          g.fillRect(x, y, 1, 1);
        }
      }
    }
    lv._exitTile = null;
    for (let y = 0; y < lv.H && !lv._exitTile; y++) {
      const row = lv.tiles[y];
      for (let x = 0; x < lv.W; x++) {
        if (row[x] === "exit") { lv._exitTile = { x: x, y: y }; break; }
      }
    }
    lv._mapNew = [];
    lv._mapCache = cv;
    return cv;
  }
  function mapSync(lv) {
    const cv = mapCacheFor(lv);
    const arr = lv._mapNew;
    if (!arr || !arr.length) return;
    const g = cv.getContext("2d");
    for (let i = 0; i < arr.length; i += 2) {
      const x = arr[i], y = arr[i + 1];
      g.fillStyle = mapTileColor(lv.tiles[y][x]);
      g.fillRect(x, y, 1, 1);
    }
    arr.length = 0;
  }
  function localWarden() {
    return G ? (G.players.find(function (p) { return !p.dead && !p.ai; }) || G.players[0]) : null;
  }
  function drawMap() {
    const c = $("cryptMap");
    if (!c) return;
    const mode = mapMode();
    if (mode === "off" || !G || !G.level) { c.classList.add("hidden"); return; }
    const lv = G.level;
    mapSync(lv);
    c.classList.remove("hidden");
    const dpr = lodOn() ? 1 : Math.min(2, window.devicePixelRatio || 1);
    const size = c.clientWidth || 168;
    if (c.width !== ((size * dpr) | 0) || c.height !== ((size * dpr) | 0)) {
      c.width = (size * dpr) | 0; c.height = (size * dpr) | 0;
    }
    const g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, size, size);
    const p0 = localWarden() || { x: lv.W / 2, y: lv.H / 2, aimX: 1, aimY: 0 };
    const span = mode === "full" ? Math.max(lv.W, lv.H) : Math.min(88, Math.max(lv.W, lv.H));
    const cx = mode === "full" ? lv.W / 2 : p0.x, cy = mode === "full" ? lv.H / 2 : p0.y;
    let sx = Math.round(cx - span / 2), sy = Math.round(cy - span / 2);
    let sw = span, sh = span, dx = 0, dy = 0, dw = size, dh = size;
    const px = size / span;
    if (sx < 0) { const cut = -sx; sx = 0; sw -= cut; dx += cut * px; dw -= cut * px; }
    if (sy < 0) { const cut = -sy; sy = 0; sh -= cut; dy += cut * px; dh -= cut * px; }
    if (sx + sw > lv.W) { const cut = sx + sw - lv.W; sw -= cut; dw -= cut * px; }
    if (sy + sh > lv.H) { const cut = sy + sh - lv.H; sh -= cut; dh -= cut * px; }
    g.fillStyle = "rgba(3,5,10,0.78)";
    g.fillRect(0, 0, size, size);
    if (sw > 0 && sh > 0) g.drawImage(lv._mapCache, sx, sy, sw, sh, dx, dy, dw, dh);
    const mx = (wx) => dx + (wx - sx) * px;
    const my = (wy) => dy + (wy - sy) * px;
    function blip(wx, wy, col, r, ring) {
      const x = mx(wx), y = my(wy);
      if (x < -4 || y < -4 || x > size + 4 || y > size + 4) return;
      g.fillStyle = col;
      if (r <= 2) g.fillRect(x - r, y - r, r * 2, r * 2);
      else { g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill(); }
      if (ring) {
        g.strokeStyle = col; g.lineWidth = 1;
        g.beginPath(); g.arc(x, y, r + 2.4, 0, 6.28); g.stroke();
      }
    }
    lv.gens.forEach(function (gn) {
      if (gn.hp > 0 && tileSeen(gn.x + 0.5, gn.y + 0.5)) blip(gn.x + 0.5, gn.y + 0.5, "#f59e0b", 3.2, true);
    });
    if (lv._exitTile && tileSeen(lv._exitTile.x + 0.5, lv._exitTile.y + 0.5)) {
      blip(lv._exitTile.x + 0.5, lv._exitTile.y + 0.5, "#fde047", 3.4, true);
    }
    (lv.doors || []).forEach(function (d) {
      if (tileSeen(d.x + 0.5, d.y + 0.5)) blip(d.x + 0.5, d.y + 0.5, "#22d3ee", 2.2, false);
    });
    (lv.pads || []).forEach(function (d) {
      if (tileSeen(d.x + 0.5, d.y + 0.5)) blip(d.x + 0.5, d.y + 0.5, "#0ea5e9", 2, false);
    });
    lv.items.forEach(function (it) {
      if (MAP_SPECIAL[it.kind] && tileSeen(it.x + 0.5, it.y + 0.5)) blip(it.x + 0.5, it.y + 0.5, "#fbbf24", 1.4, false);
    });
    lv.foes.forEach(function (f) {
      if (!tileVis(f.x, f.y)) return;
      if (f.boss) blip(f.x, f.y, "#ef4444", 3.6, true);
      else blip(f.x, f.y, "#f87171", 1.5, false);
    });
    (G.pets || []).forEach(function (pt) {
      if (tileVis(pt.x, pt.y)) blip(pt.x, pt.y, (PETS[pt.kind] && PETS[pt.kind].col) || "#4ade80", 2, false);
    });
    G.players.forEach(function (p) {
      if (p.dead) return;
      blip(p.x, p.y, p.ai ? "#93c5fd" : p.hero.color, p.ai ? 1.8 : 2.6, false);
    });
    const ang = Math.atan2(p0.aimY || 0, p0.aimX || 1);
    const px0 = mx(p0.x), py0 = my(p0.y);
    g.strokeStyle = "rgba(241,245,249,0.9)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(px0, py0);
    g.lineTo(px0 + Math.cos(ang) * 8, py0 + Math.sin(ang) * 8);
    g.stroke();
    g.strokeStyle = "rgba(148,163,184,0.35)";
    g.lineWidth = 1;
    g.strokeRect(0.5, 0.5, size - 1, size - 1);
    g.font = "9px 'IBM Plex Mono', monospace";
    g.fillStyle = "rgba(148,163,184,0.8)";
    g.fillText((mode === "full" ? "MAP" : "RADAR") + " · N", 5, 11);
    g.fillText((p0.x | 0) + "," + (p0.y | 0), 5, size - 5);
  }

  function compassTargets() {
    const out = [];
    if (!G || !G.level) return out;
    const lv = G.level;
    const p0 = localWarden();
    if (!p0) return out;
    const dist = (x, y) => Math.hypot(x - p0.x, y - p0.y);
    lv.gens.forEach(function (gn) {
      if (gn.hp <= 0 || !tileSeen(gn.x + 0.5, gn.y + 0.5)) return;
      out.push({ x: gn.x + 0.5, y: gn.y + 0.5, col: "#f59e0b", label: "NEXUS", rank: 0, d: dist(gn.x + 0.5, gn.y + 0.5) });
    });
    if (lv._exitTile && tileSeen(lv._exitTile.x + 0.5, lv._exitTile.y + 0.5)) {
      const et = lv._exitTile;
      out.push({ x: et.x + 0.5, y: et.y + 0.5, col: "#fde047", label: "EXIT", rank: 0, d: dist(et.x + 0.5, et.y + 0.5) });
    }
    lv.foes.forEach(function (f) {
      if (!f.boss || f.hp <= 0 || !tileSeen(f.x, f.y)) return;
      out.push({ x: f.x, y: f.y, col: "#ef4444", label: "BOSS", rank: 0, d: dist(f.x, f.y) });
    });
    const loose = [];
    lv.items.forEach(function (it) {
      if (!MAP_SPECIAL[it.kind] || !tileSeen(it.x + 0.5, it.y + 0.5)) return;
      loose.push({ x: it.x + 0.5, y: it.y + 0.5, col: "#fbbf24", label: "PRIZE", rank: 1, d: dist(it.x + 0.5, it.y + 0.5) });
    });
    if (G.mode === "survive") {
      (lv.pads || []).forEach(function (d) {
        if (!tileSeen(d.x + 0.5, d.y + 0.5)) return;
        loose.push({ x: d.x + 0.5, y: d.y + 0.5, col: "#22d3ee", label: "GATE", rank: 1, d: dist(d.x + 0.5, d.y + 0.5) });
      });
    }
    loose.sort(function (a, b) { return a.d - b.d; });
    if (loose.length) out.push(loose[0]);
    out.sort(function (a, b) { return (a.rank - b.rank) || (a.d - b.d); });
    return out.slice(0, 3);
  }
  function drawCompass(dest, w, h) {
    if (!G || !G.level || mapMode() === "off") return;
    const p0 = localWarden();
    if (!p0) return;
    const list = compassTargets();
    if (!list.length) return;
    const cxs = p0.x * TILE - cam.x, cys = p0.y * TILE - cam.y;
    const inset = 30;
    const room = window.CryptStudio && CryptStudio.reduced;
    dest.save();
    dest.font = "10px 'IBM Plex Mono', monospace";
    dest.textAlign = "center";
    list.forEach(function (t) {
      const wx = t.x * TILE - cam.x, wy = t.y * TILE - cam.y;
      if (wx > inset && wx < w - inset && wy > inset && wy < h - inset) return;
      const ang = Math.atan2(wy - cys, wx - cxs);
      const hw = w / 2 - inset, hh = h / 2 - inset;
      const cx = w / 2, cy = h / 2;
      const ca = Math.abs(Math.cos(ang)) < 1e-4 ? 1e-4 : Math.abs(Math.cos(ang));
      const sa = Math.abs(Math.sin(ang)) < 1e-4 ? 1e-4 : Math.abs(Math.sin(ang));
      const k = Math.min(hw / ca, hh / sa);
      const px = cx + Math.cos(ang) * k, py = cy + Math.sin(ang) * k;
      dest.save();
      dest.translate(Math.round(px), Math.round(py));
      dest.rotate(ang);
      dest.globalAlpha = room ? 0.85 : 0.72 + 0.22 * Math.sin(G.t * 6);
      dest.fillStyle = t.col;
      dest.beginPath();
      dest.moveTo(10, 0);
      dest.lineTo(-5, 6);
      dest.lineTo(-5, -6);
      dest.closePath();
      dest.fill();
      dest.restore();
      dest.globalAlpha = 0.8;
      dest.fillStyle = t.col;
      dest.fillText(t.label + " " + (t.d | 0), Math.round(cx + Math.cos(ang) * (k - 24)), Math.round(cy + Math.sin(ang) * (k - 24)) + 3);
    });
    dest.restore();
  }

  function glowSprite(rgb) {
    if (glowCache[rgb]) return glowCache[rgb];
    const s = 128, cv = document.createElement("canvas");
    cv.width = s; cv.height = s;
    const g = cv.getContext("2d");
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, "rgba(" + rgb + ",0.95)");
    grd.addColorStop(0.3, "rgba(" + rgb + ",0.4)");
    grd.addColorStop(0.65, "rgba(" + rgb + ",0.12)");
    grd.addColorStop(1, "rgba(" + rgb + ",0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    glowCache[rgb] = cv;
    return cv;
  }
  function lightAt(dest, spr, wx, wy, r, alpha) {
    if (r <= 0 || alpha <= 0) return;
    dest.globalAlpha = alpha;
    dest.drawImage(spr, wx - r, wy - r, r * 2, r * 2);
  }
  function drawLights(dest, w, h) {
    if (!G || !G.level) return;
    const lv = G.level;
    const live = G.players.filter(function (p) { return !p.dead && (p.sleepT || 0) <= 0; });
    if (!live.length && !lv.gens.length) return;
    const room = window.CryptStudio && CryptStudio.reduced;
    const flick = room ? 1 : 1 + Math.sin(G.t * 7.1) * 0.03 + Math.sin(G.t * 2.3) * 0.02;
    dest.save();
    dest.globalCompositeOperation = "lighter";
    live.forEach(function (p) {
      const r = visionRange(p) * TILE * 1.08 * flick;
      lightAt(dest, glowSprite(p.ai ? "150,190,255" : "255,224,170"),
        p.x * TILE - cam.x, p.y * TILE - cam.y, r, p.ai ? 0.24 : 0.42);
    });
    lv.gens.forEach(function (gn) {
      if (gn.hp <= 0 || !tileSeen(gn.x + 0.5, gn.y + 0.5)) return;
      const vis = tileVis(gn.x + 0.5, gn.y + 0.5);
      const r = TILE * (2.7 + (room ? 0 : 0.22 * Math.sin((G.t + gn.x) * 3.1)));
      lightAt(dest, glowSprite("196,120,255"),
        gn.x * TILE + TILE / 2 - cam.x, gn.y * TILE + TILE / 2 - cam.y, r, vis ? 0.3 : 0.12);
    });
    lv.items.forEach(function (it) {
      if (!MAP_SPECIAL[it.kind] || !tileVis(it.x + 0.5, it.y + 0.5)) return;
      const r = TILE * 1.6;
      lightAt(dest, glowSprite("255,214,130"),
        it.x * TILE + TILE / 2 - cam.x, it.y * TILE + TILE / 2 - cam.y, r, 0.15 + (room ? 0 : 0.06 * Math.sin((G.t + it.x) * 4)));
    });
    (G.pets || []).forEach(function (pt) {
      if (!tileVis(pt.x, pt.y) || (pt.sleepT || 0) > 0) return;
      lightAt(dest, glowSprite("130,255,190"), pt.x * TILE - cam.x, pt.y * TILE - cam.y, TILE * 2.1, 0.15);
    });
    lv.foes.forEach(function (f) {
      if (!f.boss || f.hp <= 0 || !tileVis(f.x, f.y)) return;
      lightAt(dest, glowSprite("255,110,110"), f.x * TILE - cam.x, f.y * TILE - cam.y, TILE * 3.4, 0.3);
    });
    dest.restore();
  }
  function vignetteSprite(w, h) {
    const key = (w | 0) + "x" + (h | 0);
    if (vigCache && vigKey === key) return vigCache;
    const cv = document.createElement("canvas");
    cv.width = Math.max(2, w | 0); cv.height = Math.max(2, h | 0);
    const g = cv.getContext("2d");
    const grd = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.26, w / 2, h / 2, Math.max(w, h) * 0.64);
    grd.addColorStop(0, "rgba(120,0,10,0)");
    grd.addColorStop(0.55, "rgba(132,8,18,0.5)");
    grd.addColorStop(1, "rgba(92,0,8,0.92)");
    g.fillStyle = grd;
    g.fillRect(0, 0, cv.width, cv.height);
    vigCache = cv; vigKey = key;
    return cv;
  }
  function noteHitDir(p, f) {
    if (!G || !p || !f || !p.hero || p.ai) return;
    const list = G.hitDirs || (G.hitDirs = []);
    list.push({ ang: Math.atan2(f.y - p.y, f.x - p.x), life: 0.9 });
    if (list.length > 6) list.shift();
  }
  function drawDangerEdge(dest, w, h) {
    if (!G) return;
    const p0 = G.players.find(function (p) { return !p.dead && !p.ai; }) || G.players[0];
    if (p0 && !p0.dead) {
      const frac = p0.hp / Math.max(1, p0.max);
      if (frac < 0.45) {
        const a = (0.45 - frac) / 0.45;
        const room = window.CryptStudio && CryptStudio.reduced;
        const pulse = room ? 0.7 : 0.58 + 0.42 * Math.sin(G.t * (5.2 + (1 - frac) * 4));
        dest.save();
        dest.globalAlpha = Math.min(0.62, a * (1 - frac * 0.3) * (0.55 + 0.45 * pulse));
        dest.drawImage(vignetteSprite(w, h), 0, 0, w, h);
        dest.restore();
      }
    }
    const dirs = G.hitDirs;
    if (dirs && dirs.length) {
      const cx = w / 2, cy = h / 2, rad = Math.min(w, h) * 0.41;
      dest.save();
      dest.lineCap = "round";
      dest.lineWidth = 4.5;
      dest.strokeStyle = "#ef4444";
      dirs.forEach(function (d) {
        dest.globalAlpha = Math.max(0, Math.min(0.85, d.life / 0.9)) * 0.8;
        dest.beginPath();
        dest.arc(cx, cy, rad, d.ang - 0.26, d.ang + 0.26);
        dest.stroke();
      });
      dest.restore();
    }
  }

  /* ─── kill streak (score multiplier) ─── */

  function comboMult() { return 1 + Math.min(4, Math.floor((G && G.combo || 0) / 8)); }
  function comboStreak() { return (G && G.combo) || 0; }
  function bumpCombo() {
    if (!G) return 1;
    G.combo = (G.combo || 0) + 1;
    G.comboT = 3.2;
    const m = comboMult();
    if (m !== G.comboTier) {
      G.comboTier = m;
      const p0 = G.players[0];
      if (m > 1 && p0 && window.CryptStudio) {
        CryptStudio.floater(p0.x, p0.y - 0.9, "×" + m, m >= 5 ? "#fbbf24" : "#e2e8f0");
      }
    }
    return m;
  }
  function scoreKill(base) {
    const m = bumpCombo();
    let tithe = 0;
    if (G && G.players) G.players.forEach(function (p) { if (p.tithe) tithe = Math.max(tithe, p.tithe); });
    G.score += Math.round(base * m * (1 + tithe));
    return m;
  }
  function riteDef(id) {
    for (let i = 0; i < RITES.length; i++) if (RITES[i].id === (id || "")) return RITES[i];
    return RITES[0];
  }
  function riteOwned(r) { return !r || !r.need || (persist.seals || 0) >= r.need; }
  function grantSeals() {
    if (!G || G._sealed) return 0;
    G._sealed = true;
    const depth = G.mode === "survive" ? Math.max(0, surviveWave() - 1) : (G.floor | 0);
    const gain = Math.min(4, 1 + ((depth / 4) | 0));
    persist.seals = (persist.seals || 0) + gain;
    return gain;
  }
  function applyRite(p) {
    if (!p || p.ai || p._rited) return;
    const def = riteDef(persist.rite);
    if (!riteOwned(def)) return;
    p._rited = 1;
    if (def.id === "ember") { p.swift = Math.max(p.swift || 0, 4); p.stride = (p.stride || 0) + 1; }
    else if (def.id === "well") { p.max += 40; p.hp += 40; }
    else if (def.id === "glass") p.vials = (p.vials || 0) + 1;
    else if (def.id === "lens") p.pierce = (p.pierce || 0) + 1;
    else if (def.id === "lantern") p.lamp = (p.lamp || 0) + 1;
    else if (def.id === "tithe") p.tithe = 0.12;
  }
  function wantTouchPad() {
    const mode = persist.touchPad || "auto";
    if (mode === "off") return false;
    if (mode === "on") return true;
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    return !!(coarse || window.innerWidth < 900);
  }
  function touchPadLive() {
    return !!(G && !G.over && overlayMode == null && wantTouchPad());
  }
  function syncTouchPad() {
    const el = $("cryptPad");
    if (!el) return;
    const live = touchPadLive();
    el.classList.toggle("hidden", !live);
    el.setAttribute("aria-hidden", live ? "false" : "true");
    document.body.classList.toggle("pad-live", live);
    if (!live) {
      touchIn.x = 0; touchIn.y = 0; touchIn.fire = false; touchIn.mag = false; touchIn.dash = false;
      const knob = $("padKnob");
      if (knob) knob.style.transform = "translate(0,0)";
    }
  }
  function streakHtml() {
    if (!G || (G.combo || 0) < 4) return "";
    const m = comboMult();
    const col = m >= 5 ? "#fbbf24" : (m >= 3 ? "#fb923c" : "#e2e8f0");
    return "<span>Streak <b style='color:" + col + "'>×" + m + "</b> " + G.combo + " kills</span>";
  }

  function rebuildFoeGrid() {
    if (!G || !G.level) return;
    const cell = 2, map = new Map();
    const foes = G.level.foes;
    for (let i = 0; i < foes.length; i++) {
      const f = foes[i];
      const k = ((f.x / cell) | 0) + "," + ((f.y / cell) | 0);
      let a = map.get(k);
      if (!a) { a = []; map.set(k, a); }
      a.push(f);
    }
    G._fgrid = { cell: cell, map: map };
  }
  function queryFoes(x, y, r) {
    const foes = G.level.foes;
    if (foes.length < 40 || !G._fgrid) return foes;
    const g = G._fgrid, out = [], c = g.cell;
    const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
    const y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
    for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
      const a = g.map.get(gx + "," + gy);
      if (!a) continue;
      for (let i = 0; i < a.length; i++) out.push(a[i]);
    }
    return out;
  }
  function nearestFoe(x, y, r) {
    let best = null, bd = r;
    const foes = (G && G.level && G.level.foes) || [];
    for (let i = 0; i < foes.length; i++) {
      const f = foes[i];
      if (!f || f.hp <= 0) continue;
      const d = Math.hypot(f.x - x, f.y - y);
      if (d < bd) { bd = d; best = f; }
    }
    return best;
  }
  function spawnPet(kind) {
    const d = PETS[kind];
    if (!d || !G) return null;
    const lead = G.players[0];
    const pet = {
      kind, x: (lead ? lead.x : 2) - 0.85, y: (lead ? lead.y : 2) + 0.45,
      hp: d.hp, max: d.hp, armor: d.armor + (bondState().armor || 0), facing: 2, walk: 0,
      sleepT: 0, hurtT: 0, atk: 0, t: 0, cd: {}
    };
    G.pets = G.pets || [];
    G.pets.push(pet);
    say(d.name + " pads beside you.");
    return pet;
  }
  function petStrike(pet, r, dmg, fx) {
    const b = bondState();
    r *= 1 + (b.aoe || 0);
    dmg = Math.max(1, Math.round(dmg * (1 + (b.dmg || 0))));
    queryFoes(pet.x, pet.y, r).forEach(function (f) {
      if (Math.hypot(f.x - pet.x, f.y - pet.y) <= r) hitFoe(f, dmg, true);
    });
    if (fx) { fx.r = r; G.fx.push(fx); }
  }
  function tickPets(dt) {
    if (!G || G.over) return;
    G.pets = G.pets || [];
    G.pools = G.pools || [];
    const lead = G.players.find(function (p) { return !p.ai && !p.dead; }) || G.players[0];
    G.pets.forEach(function (pet) {
      const spec = PETS[pet.kind];
      if (!spec) return;
      pet.t += dt;
      pet.hurtT = Math.max(0, (pet.hurtT || 0) - dt);
      pet.atk = Math.max(0, (pet.atk || 0) - dt);
      if (pet.sleepT > 0) {
        pet.sleepT -= dt;
        if (pet.sleepT <= 0) {
          pet.hp = Math.round(pet.max * 0.45);
          say(spec.name + " wakes.");
        }
        return;
      }
      const foe = nearestFoe(pet.x, pet.y, 7.6);
      let tx, ty;
      if (foe) { tx = foe.x; ty = foe.y; }
      else if (lead) {
        tx = lead.x + (lead.facing === 1 ? 1.2 : (lead.facing === 2 ? -1.2 : 0.4));
        ty = lead.y + (lead.facing === 0 ? 1.2 : (lead.facing === 3 ? -1.2 : 0.5));
      } else return;
      let dx = tx - pet.x, dy = ty - pet.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > 0.58) {
        dx /= dist; dy /= dist;
        tryMove(pet, dx, dy, spec.speed * (1 + (bondState().spd || 0)) * (foe && dist < 1.15 ? 0.45 : 1), dt, false);
        pet.facing = dirFrom(dx, dy);
        pet.walk += dt * 9;
      }
      pet.cd = pet.cd || {};
      function ready(id, gap) {
        pet.cd[id] = (pet.cd[id] == null ? 0 : pet.cd[id]) - dt;
        if (pet.cd[id] > 0) return false;
        pet.cd[id] = gap * Math.max(0.55, 1 - (bondState().cd || 0));
        pet.atk = 0.32;
        return true;
      }
      const ang = foe ? Math.atan2(foe.y - pet.y, foe.x - pet.x) : 0;
      if (pet.kind === "wolf") {
        if (foe && dist < 4.3 && ready("dash", 1.55)) {
          tryMove(pet, (foe.x - pet.x) / dist, (foe.y - pet.y) / dist, 20, 0.11, false);
          petStrike(pet, 1.2, 3, { x: pet.x, y: pet.y, life: 0.2, kind: "slash", ang: ang, r: 1.2 });
        } else if (foe && dist < 1.4 && ready("bite", 2.2)) {
          petStrike(pet, 1.3, 2, { x: pet.x, y: pet.y, life: 0.22, kind: "slash", ang: ang, r: 1.3 });
        }
      } else if (pet.kind === "lion") {
        if (foe && dist < 4.1 && ready("jump", 2.1)) {
          tryMove(pet, (foe.x - pet.x) / dist, (foe.y - pet.y) / dist, 18, 0.13, false);
          petStrike(pet, 1.25, 4, { x: pet.x, y: pet.y, life: 0.22, kind: "slash", ang: ang, r: 1.25 });
        }
        if (ready("roar", 3.4)) {
          const rr = 2.15 * (1 + (bondState().aoe || 0));
          queryFoes(pet.x, pet.y, rr).forEach(function (f) {
            if (Math.hypot(f.x - pet.x, f.y - pet.y) < rr) f.stun = Math.max(f.stun || 0, 0.55);
          });
          G.fx.push({ x: pet.x, y: pet.y, life: 0.4, kind: "roar" });
        }
        if (foe && dist < 1.25 && ready("claw", 1.35)) {
          petStrike(pet, 1.15, 3, { x: pet.x, y: pet.y, life: 0.16, kind: "slash", ang: ang, r: 1.15 });
        }
      } else if (pet.kind === "bear") {
        if (foe && dist < 1.55 && ready("swipe", 1.7)) {
          const ax = foe.x - pet.x, ay = foe.y - pet.y, al = Math.hypot(ax, ay) || 1;
          const rr = 1.45 * (1 + (bondState().aoe || 0));
          const dd = Math.max(1, Math.round(3 * (1 + (bondState().dmg || 0))));
          queryFoes(pet.x, pet.y, rr).forEach(function (f) {
            const dx2 = f.x - pet.x, dy2 = f.y - pet.y, d2 = Math.hypot(dx2, dy2);
            if (d2 < rr && (dx2 * ax + dy2 * ay) / (d2 * al) > 0.1) hitFoe(f, dd, true);
          });
          G.fx.push({ x: pet.x, y: pet.y, life: 0.18, kind: "slash", ang: ang, r: rr });
        }
        if (foe && dist < 1.05 && ready("maul", 2.5)) {
          petStrike(pet, 1.05, 5, { x: pet.x, y: pet.y, life: 0.24, kind: "slash", ang: ang, r: 1.05 });
        }
      } else if (pet.kind === "elephant") {
        if (ready("stomp", 3)) {
          petStrike(pet, 1.9, 4, { x: pet.x, y: pet.y, life: 0.38, kind: "stomp" });
          feel("hit", pet.x, pet.y);
        }
      } else if (pet.kind === "scorpion") {
        if (foe && dist < 1.15 && ready("clamp", 1.4)) {
          hitFoe(foe, 2, true);
          G.fx.push({ x: foe.x, y: foe.y, life: 0.16, kind: "slash", ang: ang, r: 0.7 });
        }
        if (foe && dist < 3.4 && ready("tail", 2.8)) {
          hitFoe(foe, 2, true);
          G.pools.push({ x: foe.x, y: foe.y, r: 1.15 * (1 + (bondState().aoe || 0)), life: 2.2, dps: 2.4, tick: 0 });
          G.fx.push({ x: foe.x, y: foe.y, life: 0.35, kind: "poison" });
        }
      }
    });
    G.pools.forEach(function (pool) {
      pool.life -= dt;
      pool.tick = (pool.tick || 0) + dt;
      if (pool.tick >= 0.28) {
        pool.tick = 0;
        queryFoes(pool.x, pool.y, pool.r).forEach(function (f) {
          if (Math.hypot(f.x - pool.x, f.y - pool.y) <= pool.r) hitFoe(f, 1, true);
        });
      }
    });
    G.pools = G.pools.filter(function (p) { return p.life > 0; });
  }
  function aiInput(p) {
    if ((p.sleepT || 0) > 0) return { dx: 0, dy: 0, fire: false, mag: false, cycle: false };
    const lead = G.players.find(function (x) { return !x.ai && !x.dead; }) || G.players[0];
    const foe = nearestFoe(p.x, p.y, 8.2);
    let tx, ty;
    if (foe && lead && Math.hypot(foe.x - lead.x, foe.y - lead.y) < 9.5) {
      tx = foe.x; ty = foe.y;
    } else if (lead) {
      tx = lead.x + (lead.facing === 1 ? 1.25 : (lead.facing === 2 ? -1.25 : 0.4));
      ty = lead.y + (lead.facing === 0 ? 1.2 : (lead.facing === 3 ? -1.2 : 0.5));
    } else {
      return { dx: 0, dy: 0, fire: false, mag: false, cycle: false };
    }
    let dx = tx - p.x, dy = ty - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.58) { dx = 0; dy = 0; }
    else { dx /= d; dy /= d; }
    if (dx || dy) { p.facing = dirFrom(dx, dy); p.aimX = dx; p.aimY = dy; }
    else if (foe) {
      p.aimX = foe.x - p.x; p.aimY = foe.y - p.y;
      p.facing = dirFrom(p.aimX, p.aimY);
    }
    const near = foe && Math.hypot(foe.x - p.x, foe.y - p.y) < 6.4;
    const mag = p.hp < p.max * 0.34 && p.vials > 0 && G.level.foes.filter(function (f) {
      return Math.hypot(f.x - p.x, f.y - p.y) < 2.8;
    }).length >= 4;
    return { dx: dx, dy: dy, fire: !!near, mag: mag, cycle: false };
  }
  function lodOn() { return !!(window.CryptStudio && CryptStudio.fps.lod); }
  function feel(kind, x, y, col) {
    let pan = 0;
    if (x != null && canvas && canvas.clientWidth) {
      pan = Math.max(-1, Math.min(1, ((x * TILE - cam.x) / canvas.clientWidth - 0.5) * 2));
    }
    if (window.CryptStudio && CryptStudio.feel) CryptStudio.feel(kind, x, y, col, pan);
  }
  function p1Map() {
    const b = persist.binds || {};
    const d = KEYS_P[0];
    return {
      up: b.up || d.up, down: b.down || d.down, left: b.left || d.left, right: b.right || d.right,
      fire: [b.fire || d.fire[0]], mag: [b.mag || d.mag[0], "ShiftLeft"], cycle: [b.cycle || d.cycle[0]]
    };
  }
  function showCoach(mode) {
    const el = $("coach");
    if (!el) return;
    el.classList.remove("hidden");
    const pad = wantTouchPad();
    el.innerHTML = pad
      ? "<b>Stick</b> move · <b>Fire</b> · <b>Vial</b> · <b>Dash</b> slips through · <b>Map</b>"
      : (mode === "survive"
        ? "<b>WASD</b> move · auto-fire on · <b>K</b> vial · <b>C</b> dash · <b>N</b> map · <b>P</b> pause"
        : "<b>WASD</b> move · <b>J</b> fire · <b>K</b> vial · <b>C</b> dash · <b>N</b> map · cyan exit");
    if (G) G._coach = 10;
  }
  function hideCoach() {
    const el = $("coach");
    if (el) el.classList.add("hidden");
    if (G) G._coach = 0;
  }
  function cleanupGameState() {
    if (G && window.CryptStudio) {
      if (G.shots) G.shots.forEach((s) => CryptStudio.pool.shot.free(s));
      if (G.level && G.level.foes) G.level.foes.forEach((f) => CryptStudio.pool.foe.free(f));
    }
    if (window.CryptStudio) CryptStudio.cleanup();
    if (G) {
      G.shots = []; G.fx = []; G._fgrid = null;
      if (G.level) G.level.foes = [];
    }
    keys = {}; keyEdge = {};
    announce = { t: "", life: 0 };
    hideCoach();
    if (overlayMode === "char") hideOverlay();
    const pl = $("pauseLayer"); if (pl) pl.classList.add("hidden");
  }
  function newRun(opts) {
    opts = opts || {};
    gateBusy = true;      // board is live from here: no reminder until this run ends
    gateHold(true);
    cleanupGameState();
    const seed = ((opts.seed != null ? opts.seed : (Math.random() * 0xFFFFFFFF)) ^ Date.now()) >>> 0;
    G = {
      seed, floor: 0, score: 0, credits: 1, t: 0, log: [],
      level: null, shots: [], fx: [],
      players: [],
      thiefT: 24,
      over: false,
      pets: [], pools: [],
      bond: { dmg: 0, spd: 0, cd: 0, armor: 0, aoe: 0, sleep: 0 },
      mode: opts.mode || "campaign",
      xp: 0, lvl: 1, kills: 0, wave: 1, spawnT: 0.7, bossAt: 0, pendingLvl: 0, hordeT: 14,
      rosT: 3, rosCount: 0, rosSaid: 0
    };
    joinHero(opts.hero || persist.hero, 0);
    if (persist.comp) {
      const c = joinHero(persist.comp);
      if (c) {
        c.ai = true;
        c.vials = G.mode === "survive" ? 2 : 1;
        c.magnet = 0.12;
      }
    }
    if (G.mode === "survive") {
      G.surviveAuto = true;
      G.players.forEach((p) => { if (!p.ai) { p.vials = 2; p.magnet = 0.35; } });
    }
    loadFloor(0);
    if (persist.pet && PETS[persist.pet]) spawnPet(persist.pet);
    overlayMode = null;
    hideOverlay();
    const pl = $("pauseLayer"); if (pl) pl.classList.add("hidden");
    $("app").classList.remove("hidden");
    $("app").classList.toggle("survive-mode", G.mode === "survive");
    $("app").classList.add("hud-all");
    const sh = $("studioHud");
    if (sh) sh.classList.remove("hidden");
    showCoach(G.mode);
    if (G.mode === "campaign") say("Campaign — WASD, J fire, smash nexuses, find the cyan exit.");
    else if (G.mode === "survive") {
      say("Survival — auto-fire is on. Start small. The lattice grows with you.");
      spawnSurviveAround("brute", false, 6);
      spawnSurviveAround("wraith", false, 5);
      G._spawnQ = 0;
    }
    else say("Endless — WASD, J fire. The crypt does not end.");
    if (opts.coop) {
      credit();
      say("Cabinet co-op — P2 arrows · ; fire · ' vial.");
    }
    G.players.forEach(function (p) { if (!p.ai) applyRite(p); });
    const rite = riteDef(persist.rite);
    if (rite.id) say(rite.name + " — " + rite.line);
    paintUI();
  }

  function joinHero(id, slot) {
    if (!G || G.players.length >= 4) return null;
    const h = heroOf(id);
    const s = slot != null ? slot : G.players.length;
    const p = {
      slot: s, hero: h, x: 2, y: 2, hp: 200, max: 200,
      keys: 0, vials: 1, facing: 2, aimX: 1, aimY: 0, walk: 0, fireT: 0, magT: 0,
      shotBoost: 0, swift: 0, aegis: 0, veil: 0, reflect: 0, fury: 0, thorns: 0, echo: 0, regen: 0, stun: 0, padT: 0, hurtT: 0,
      weapon: (h.wep && WEAPONS[h.wep]) ? h.wep : "shard",
      arsenal: ["shard"].concat(h.wep && h.wep !== "shard" && WEAPONS[h.wep] ? [h.wep] : []),
      wepLv: {}, coolT: {},
      cores: 0, iron: (h.id === "justicae" || h.id === "lightfather") ? 1 : 0,
      might: 0, haste: 0, stride: 0, pierce: 0, extraCap: 0, vialPow: 0, magnet: 0, lamp: 0,
      dead: false, pad: -1, hurtBeep: 0, halo: null, orbit: null, cleaveT: 0,
      inv: { bag: [], relic: [], gold: 0 }
    };
    p.wepLv.shard = 1;
    if (p.weapon !== "shard") p.wepLv[p.weapon] = 1;
    G.players.push(p);
    return p;
  }

  function loadFloor(n) {
    G.floor = n;
    G.floorT = 0; /* each floor gets its own quiet opening before its own flood */
    G.rosT = 3; G.rosCount = 0; G.rosSaid = 0;
    G.level = genLevel(G.seed, n, G.mode);
    const st = G.level.start;
    G.players.forEach((p, i) => {
      if (p.dead) return;
      p.x = st.x + 0.5 + (i % 2) * 0.4;
      p.y = st.y + 0.5 + ((i / 2) | 0) * 0.4;
      p.padT = 0;
    });
    (G.pets || []).forEach(function (pet, i) {
      pet.x = st.x + 0.15;
      pet.y = st.y + 0.5 + i * 0.45;
    });
    G.level.foes.forEach((f) => {
      const p = nearestWalk(G.level, f.x, f.y);
      f.x = p.x; f.y = p.y;
    });
    G.level.items.forEach((it) => {
      const p = nearestWalk(G.level, it.x + 0.5, it.y + 0.5);
      it.x = Math.floor(p.x); it.y = Math.floor(p.y);
    });
    if (window.CryptStudio && G.shots) G.shots.forEach((s) => CryptStudio.pool.shot.free(s));
    G.shots = [];
    G.fx = [];
    tileCacheKey = "";
    initFog(G.level);
    updateFog();
    G.thiefT = 24 + (Math.random() * 16);
    if (G.mode === "campaign") {
      $("holePill").textContent = G.level.realm.name.toUpperCase() + " " + (n + 1) + "/" + (window.LatticeCampaign ? window.LatticeCampaign.LEN : 24);
    } else if (G.mode === "survive") {
      $("holePill").textContent = "SURVIVE · WAVE 1";
    } else {
      $("holePill").textContent = (G.mode === "endless" ? "ENDLESS " : "") + G.level.realm.name.toUpperCase() + " " + (n + 1);
    }
    if (G.level.layout) say(G.level.layout + (G.level.seal ? " — smash the nexuses." : "."));
    else if (G.level.treasure) say("Treasure rush — grab and go.");
    else if (G.level.items.some((it) => it.hidden)) say("A hidden vial waits.");
    if (G.level.foes.some((f) => f.kind === "drain")) say("The Drain walks.");
    if (G.level.foes.some((f) => FOE[f.kind] && FOE[f.kind].super)) say((BOSS_NAME[G.level.foes.find(function (x) { return FOE[x.kind] && FOE[x.kind].super; }).kind] || "A super guardian") + " holds this seal.");
    else if (G.level.foes.some((f) => FOE[f.kind] && FOE[f.kind].boss)) say("A named guardian holds this seal.");
    const foc = G.players.find((p) => !p.dead && !p.ai) || G.players.find((p) => !p.dead) || G.players[0];
    const cw = canvas.clientWidth || 800, ch = canvas.clientHeight || 480;
    cam.x = foc.x * TILE - cw / 2;
    cam.y = foc.y * TILE - ch / 2;
    paintUI();
  }

  function dirFrom(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 1 : 2;
    return dy < 0 ? 3 : 0;
  }

  function claimedPads() {
    const s = new Set();
    G.players.forEach((p) => { if (p.pad >= 0) s.add(p.pad); });
    return s;
  }

  function bindIdlePads() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const claimed = claimedPads();
    G.players.forEach((p) => {
      if (p.dead || p.pad >= 0) return;
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i];
        if (!pad || claimed.has(i)) continue;
        const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
        const used = Math.hypot(ax, ay) > 0.5 || (pad.buttons[0] && pad.buttons[0].pressed) ||
          (pad.buttons[7] && pad.buttons[7].pressed);
        if (used) { p.pad = i; claimed.add(i); break; }
      }
    });
  }

  function inputFor(p) {
    if (p.ai) return aiInput(p);
    const map = p.slot === 0 ? p1Map() : (KEYS_P[p.slot] || KEYS_P[0]);
    let dx = 0, dy = 0;
    if (keys[map.up]) dy -= 1;
    if (keys[map.down]) dy += 1;
    if (keys[map.left]) dx -= 1;
    if (keys[map.right]) dx += 1;
    let fire = persist.autoShot || G.surviveAuto || map.fire.some((k) => keys[k] || keyEdge[k]);
    let mag = map.mag.some((k) => keyEdge[k]);
    let cycle = (map.cycle || []).some((k) => keyEdge[k]);
    let dash = p.slot === 0 && !!keyEdge.KeyC;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = p.pad >= 0 ? pads[p.pad] : null;
    if (pad) {
      const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
      if (Math.abs(ax) > 0.35) dx += ax;
      if (Math.abs(ay) > 0.35) dy += ay;
      if (pad.buttons[12] && pad.buttons[12].pressed) dy -= 1;
      if (pad.buttons[13] && pad.buttons[13].pressed) dy += 1;
      if (pad.buttons[14] && pad.buttons[14].pressed) dx -= 1;
      if (pad.buttons[15] && pad.buttons[15].pressed) dx += 1;
      if (pad.buttons[0] && pad.buttons[0].pressed) fire = true;
      if (pad.buttons[7] && pad.buttons[7].pressed) fire = true;
      const magBtn = (pad.buttons[1] && pad.buttons[1].pressed) || (pad.buttons[2] && pad.buttons[2].pressed) || (pad.buttons[6] && pad.buttons[6].pressed);
      if (magBtn && !p._magLatch) { mag = true; p._magLatch = true; }
      if (!magBtn) p._magLatch = false;
      if (pad.buttons[4] && pad.buttons[4].pressed && !p._lbLatch) { cycle = true; p._lbLatch = true; }
      if (pad.buttons[4] && !pad.buttons[4].pressed) p._lbLatch = false;
      if (pad.buttons[5] && pad.buttons[5].pressed && !p._rbLatch) { dash = true; p._rbLatch = true; }
      if (!(pad.buttons[5] && pad.buttons[5].pressed)) p._rbLatch = false;
    }
    if (p.slot === 0) {
      if (touchIn.x || touchIn.y) { dx += touchIn.x; dy += touchIn.y; }
      if (touchIn.fire) fire = true;
      if (touchIn.mag) { mag = true; touchIn.mag = false; }
      if (touchIn.dash) { dash = true; touchIn.dash = false; }
    }
    if (dx || dy) {
      const l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      p.facing = dirFrom(dx, dy);
      p.aimX = dx; p.aimY = dy;
    }
    return { dx, dy, fire, mag, cycle, dash };
  }
  function beginDash(p, inn) {
    if ((p.dashCd || 0) > 0 || (p.dashT || 0) > 0) return;
    let dx = inn.dx, dy = inn.dy;
    if (!dx && !dy) { dx = p.aimX || 1; dy = p.aimY || 0; }
    const len = Math.hypot(dx, dy) || 1;
    p.dashX = dx / len;
    p.dashY = dy / len;
    p.dashT = 0.15;
    p.dashCd = 1.2;
    p._dashBump = true;
    p.facing = dirFrom(p.dashX, p.dashY);
    emit("onDash", { p: p });
    feel("dash", p.x, p.y);
  }
  function bumpDash(p) {
    const foes = G.level.foes;
    for (let i = 0; i < foes.length; i++) {
      const f = foes[i];
      if (Math.hypot(f.x - p.x, f.y - p.y) > 0.62) continue;
      f.stun = Math.max(f.stun || 0, 0.16);
      f.x += p.dashX * 0.28;
      f.y += p.dashY * 0.28;
    }
  }

  function resolveCircle(lv, x, y, r) {
    const tx = Math.floor(x), ty = Math.floor(y);
    for (let iy = ty - 1; iy <= ty + 1; iy++) {
      for (let ix = tx - 1; ix <= tx + 1; ix++) {
        if (!blocked(lv, ix + 0.5, iy + 0.5)) continue;
        const cx = Math.max(ix, Math.min(ix + 1, x));
        const cy = Math.max(iy, Math.min(iy + 1, y));
        const ox = x - cx, oy = y - cy;
        const d = Math.hypot(ox, oy);
        if (d < 1e-4) {
          const p = nearestWalk(lv, x, y);
          x = p.x; y = p.y;
          continue;
        }
        if (d < r) {
          const s = (r - d) / d;
          x += ox * s;
          y += oy * s;
        }
      }
    }
    return { x, y };
  }
  function tryMove(ent, dx, dy, speed, dt, ghost) {
    const mx = dx * speed * dt, my = dy * speed * dt;
    if (ghost) {
      ent.x += mx; ent.y += my;
      if (ent.keys != null) bumpDoor(ent);
      return;
    }
    const lv = G.level;
    const lead = 0.14;
    if (mx) {
      const nx = ent.x + mx;
      const lx = nx + (mx > 0 ? lead : -lead);
      if (!blocked(lv, nx, ent.y) && !blocked(lv, lx, ent.y)) ent.x = nx;
    }
    if (my) {
      const ny = ent.y + my;
      const ly = ny + (my > 0 ? lead : -lead);
      if (!blocked(lv, ent.x, ny) && !blocked(lv, ent.x, ly)) ent.y = ny;
    }
    if (blocked(lv, ent.x, ent.y)) unstick(ent);
    if (ent.keys != null) bumpDoor(ent);
  }

  function bumpDoor(ent) {
    const tx = Math.floor(ent.x), ty = Math.floor(ent.y);
    const near = [[tx, ty], [tx + 1, ty], [tx - 1, ty], [tx, ty + 1], [tx, ty - 1]];
    for (const [x, y] of near) {
      if (!inB(G.level, x, y)) continue;
      if (G.level.tiles[y][x] !== "door") continue;
      if (Math.hypot(ent.x - (x + 0.5), ent.y - (y + 0.5)) > 0.72) continue;
      if (ent.keys > 0) {
        ent.keys--;
        G.level.tiles[y][x] = "door_open";
        log("Door opens.");
      }
    }
  }

  function wepOf(p) { return WEAPONS[p.weapon] || WEAPONS.shard; }
  function wepLv(p, id) {
    if (!p.arsenal || p.arsenal.indexOf(id) < 0) return 0;
    return (p.wepLv && p.wepLv[id]) || 1;
  }
  function shotDmg(p, w) {
    return Math.max(1, p.hero.shot + (p.cores || 0) + (p.might || 0) + (w.dmg || 0) + (p.fury > 0 ? 2 : 0));
  }
  function distSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 < 1e-8) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function spawnBolt(p, ax, ay, id) {
    const w = WEAPONS[id] || WEAPONS.shard;
    const lv = wepLv(p, id);
    let sx = p.x + ax * 0.35, sy = p.y + ay * 0.35;
    if (blocked(G.level, sx, sy)) { sx = p.x; sy = p.y; }
    pushShot({
      x: sx, y: sy, px: sx, py: sy, vx: ax * w.spd, vy: ay * w.spd,
      dmg: shotDmg(p, w) + Math.max(0, lv - 1), owner: p, life: w.life, maxLife: w.life, grace: 0.12,
      hero: p.hero.id, wep: id,
      pierce: (w.pierce || 0) + (p.pierce || 0) + Math.max(0, lv - 1) + (p.echo > 0 ? 1 : 0), lob: !!w.lob, flame: w.flame || 0, echo: p.echo > 0,
      seek: !!w.seek, chain: !!w.chain, nova: !!w.nova,
      trail: [{ x: sx, y: sy }]
    });
    emit("onFire", { p: p, wep: id });
  }

  function fireWeapon(p, id) {
    const w = WEAPONS[id];
    if (!w || w.melee) return false;
    p.coolT = p.coolT || {};
    if ((p.coolT[id] || 0) > 0) return false;
    const lv = wepLv(p, id);
    const live = G.shots.filter((s) => s.owner === p && s.wep === id).length;
    const cap = (p.shotBoost > 0 ? Math.max(3, w.cap) : w.cap) + (p.extraCap || 0) + Math.max(0, lv - 1);
    if (live >= cap) return false;
    let ax = p.aimX, ay = p.aimY;
    const len = Math.hypot(ax, ay) || 1;
    ax /= len; ay /= len;
    if (w.halo) {
      const n = (w.haloN || 2) + Math.min(4, lv);
      if (!p.halo || p.halo.length !== n) {
        p.halo = [];
        for (let i = 0; i < n; i++) p.halo.push({ ang: (i / n) * Math.PI * 2, r: 0.82 + lv * 0.04 });
      }
    }
    if (w.spread) {
      const ang = Math.atan2(ay, ax);
      const offs = lv >= 3 ? [-w.spread * 1.5, -w.spread, 0, w.spread, w.spread * 1.5] : [-w.spread, 0, w.spread];
      offs.forEach((off) => spawnBolt(p, Math.cos(ang + off), Math.sin(ang + off), id));
    } else {
      spawnBolt(p, ax, ay, id);
    }
    G.fx.push({ x: p.x + ax * 0.45, y: p.y + ay * 0.45, life: 0.1, kind: "muzzle", wep: id, ang: Math.atan2(ay, ax) });
    const cool = (p.shotBoost > 0 ? Math.min(0.12, w.cool) : w.cool) / (1 + (p.haste || 0) * 0.1);
    p.coolT[id] = Math.max(0.08, cool);
    return true;
  }
  function fireArsenal(p) {
    if ((p.muteT || 0) > 0 || (p.stun || 0) > 0) return;
    let any = false;
    (p.arsenal || [p.weapon]).forEach((id) => { if (fireWeapon(p, id)) any = true; });
    if (any && p.hero.hymn) {
      G.level.foes.forEach((f) => { if (Math.hypot(f.x - p.x, f.y - p.y) < 3.2) f.stun = Math.max(f.stun || 0, 0.35); });
      G.fx.push({ x: p.x, y: p.y, life: 0.35, kind: "note" });
    }
    if (any) beep("shot");
  }
  function tickMelee(p, dt) {
    const lvC = wepLv(p, "cleave") + wepLv(p, "riftcleave");
    if (lvC) {
      p.cleaveT = (p.cleaveT || 0) - dt;
      if (p.cleaveT <= 0) {
        p.cleaveT = Math.max(0.18, 0.4 / (1 + (p.haste || 0) * 0.1));
        const range = 1.42 + lvC * 0.2 + (wepLv(p, "riftcleave") ? 0.55 : 0);
        const ax = p.aimX || 1, ay = p.aimY || 0;
        const dmg = shotDmg(p, WEAPONS.cleave) + lvC;
        queryFoes(p.x, p.y, range).forEach((f) => {
          const dx = f.x - p.x, dy = f.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d > range || d < 0.04) return;
          if ((dx * ax + dy * ay) / d < 0.12) return;
          hitFoe(f, dmg, true);
        });
        G.fx.push({ x: p.x, y: p.y, life: 0.14, kind: "slash", ang: Math.atan2(ay, ax), r: range });
      }
    }
    const lvO = wepLv(p, "orbit") + wepLv(p, "gyre");
    if (lvO) {
      const n = 2 + Math.min(5, lvO);
      const r = 0.92 + lvO * 0.08;
      if (!p.orbit || p.orbit.length !== n) {
        p.orbit = [];
        for (let i = 0; i < n; i++) p.orbit.push({ ang: (i / n) * Math.PI * 2, r });
      }
      p.orbit.forEach((o) => {
        o.r = r;
        o.ang += dt * (4.4 + lvO * 0.35);
        const hx = p.x + Math.cos(o.ang) * o.r, hy = p.y + Math.sin(o.ang) * o.r;
        queryFoes(hx, hy, 0.7).forEach((f) => {
          if (Math.hypot(f.x - hx, f.y - hy) < 0.62) hitFoe(f, Math.max(2, 2 + lvO + (p.might || 0)), true);
        });
      });
    }
    const lvA = wepLv(p, "aura") + wepLv(p, "hymnfield");
    if (lvA) {
      const rad = 1.18 + lvA * 0.2;
      const dps = 3.2 + lvA * 1.4 + (p.might || 0);
      queryFoes(p.x, p.y, rad).forEach((f) => {
        if (Math.hypot(f.x - p.x, f.y - p.y) < rad) hitFoe(f, dps * dt, true);
      });
    }
  }

  function giveWep(p, id) {
    if (!WEAPONS[id]) return false;
    p.wepLv = p.wepLv || {};
    if (p.arsenal.includes(id)) {
      p.wepLv[id] = (p.wepLv[id] || 1) + 1;
      say(WEAPONS[id].name + " stacks to " + p.wepLv[id] + ".");
      return true;
    }
    if (p.arsenal.length >= INV_WEP) {
      addInv(p, id, 1);
      say(WEAPONS[id].name + " → bag. Tab · unequip an arm to wear it.");
      return true;
    }
    p.arsenal.push(id);
    p.wepLv[id] = 1;
    p.weapon = id;
    say(p.hero.name + " arms " + WEAPONS[id].name + " — all arms fire.");
    return true;
  }
  function ensureInv(p) {
    if (!p.inv) p.inv = { bag: [], relic: [], gold: 0 };
    if (!p.inv.bag) p.inv.bag = [];
    if (!p.inv.relic) p.inv.relic = [];
    if (p.inv.gold == null) p.inv.gold = 0;
  }
  function addInv(p, kind, qty) {
    ensureInv(p);
    qty = qty || 1;
    if (itemCat(kind) === "gold") {
      p.inv.gold += (kind === "gem" ? 180 : 50) * qty;
      return true;
    }
    const hit = p.inv.bag.find(function (it) { return it.kind === kind; });
    if (hit) { hit.qty += qty; return true; }
    if (p.inv.bag.length >= INV_BAG) { say("Bag full."); return false; }
    p.inv.bag.push({ kind: kind, cat: itemCat(kind), qty: qty });
    return true;
  }
  function noteRelic(p, kind) {
    ensureInv(p);
    const hit = p.inv.relic.find(function (it) { return it.kind === kind; });
    if (hit) { hit.qty++; return; }
    if (p.inv.relic.length < INV_RELIC) p.inv.relic.push({ kind: kind, qty: 1 });
    else addInv(p, kind, 1);
  }
  function takeInv(p, i, n) {
    ensureInv(p);
    const it = p.inv.bag[i];
    if (!it) return null;
    n = n || 1;
    it.qty -= n;
    const kind = it.kind;
    if (it.qty <= 0) p.inv.bag.splice(i, 1);
    return kind;
  }
  function unequipWep(p, id) {
    if (!id || id === "shard") { say("Shard stays in hand."); return; }
    const ix = p.arsenal.indexOf(id);
    if (ix < 0) return;
    if (!addInv(p, id, 1)) return;
    p.arsenal.splice(ix, 1);
    if (p.weapon === id) p.weapon = p.arsenal[0] || "shard";
    if (id === "halo" || id === "starwheel") p.halo = null;
    if (id === "orbit" || id === "gyre") p.orbit = null;
    say(WEAPONS[id].name + " → bag.");
  }
  function useBag(p, i) {
    ensureInv(p);
    const it = p.inv.bag[i];
    if (!it) return;
    if (it.cat === "wep") {
      const k = takeInv(p, i, 1);
      if (k) giveWep(p, k);
      return;
    }
    if (it.cat === "use" || it.cat === "pack" || it.cat === "relic") {
      const k = takeInv(p, i, 1);
      if (k) applyPickup(p, { kind: k, x: p.x, y: p.y }, true);
      return;
    }
  }

  function cycleWep(p) {
    if (!p.arsenal || p.arsenal.length < 2) { say("Only Shard — find a relic."); return; }
    const i = p.arsenal.indexOf(p.weapon);
    p.weapon = p.arsenal[(i + 1) % p.arsenal.length];
    say("Focus " + WEAPONS[p.weapon].name + " · all still fire.");
  }

  function faithMul(p) {
    return 0.7 + (p.hero.faith || 50) / 200;
  }
  function braveMul(p) {
    return 0.7 + (p.hero.brave || 50) / 200;
  }
  function jobVial(p, pow) {
    const id = p.hero.id;
    if (id === "kael") {
      G.level.gens.forEach((g) => { g.hp -= 2; });
    }
    if (id === "vale") {
      G.players.forEach((o) => {
        if (!o.dead && Math.hypot(o.x - p.x, o.y - p.y) < 6.5) {
          o.aegis = Math.max(o.aegis, 4.8);
          G.fx.push({ x: o.x, y: o.y, life: 0.4, max: 0.4, kind: "shield" });
        }
      });
    }
    if (id === "nia") {
      p.swift = Math.max(p.swift, 3.4);
      emit("onDash", { p: p });
      feel("dash", p.x, p.y);
    }
    if (id === "d9ra") {
      const md = Math.max(4, (p.hero.melee || 7) * 1.4 * braveMul(p));
      G.level.foes.forEach((f) => {
        if (Math.hypot(f.x - p.x, f.y - p.y) < 2.6) hitFoe(f, md, true);
      });
    }
    if (id === "srath") p.veil = Math.max(p.veil, 2.4);
    if (p.hero.time) {
      G.fx.push({ x: p.x, y: p.y, life: 0.35, kind: "warp" });
      randomFloor(p);
      G.fx.push({ x: p.x, y: p.y, life: 0.35, kind: "warp" });
    }
    if (id === "justicae") p.reflect = Math.max(p.reflect, 5.2);
    if (p.hero.heal) {
      G.players.forEach((o) => { if (!o.dead) o.hp = Math.min(o.max, o.hp + Math.round(70 * faithMul(p))); });
      emit("onHeal", { p: p });
      feel("heal", p.x, p.y);
    }
    if (p.hero.accord) {
      G.level.foes.forEach((f) => {
        if (Math.hypot(f.x - p.x, f.y - p.y) < 11) f.stun = Math.max(f.stun || 0, 1.7);
      });
      G.players.forEach((o) => {
        if (o.dead) return;
        o.aegis = Math.max(o.aegis, 5.2);
        o.hp = Math.min(o.max, o.hp + Math.round(36 * faithMul(p)));
      });
    }
    return pow;
  }
  function useVial(p) {
    if (p.vials < 1 || p.magT > 0) return;
    p.vials--;
    p.magT = 0.22;
    feel("vial", p.x, p.y);
    const pow = Math.round(20 * p.hero.magic * faithMul(p) * (1 + (p.vialPow || 0) * 0.15));
    say(p.hero.name + " — " + (p.hero.special || "vial") + ".");
    G.level.foes.forEach((f) => {
      if (Math.hypot(f.x - p.x, f.y - p.y) > 11) return;
      if (f.kind === "drain") { f.hp = 0; G.score += 250; say("The Drain is unmade."); }
      else f.hp -= pow;
    });
    G.level.gens.forEach((g) => { g.hp -= Math.max(1, (pow / 20) | 0); });
    G.fx.push({ x: p.x, y: p.y, life: 0.58, max: 0.58, kind: "nova", col: p.hero.color, job: p.hero.id });
    jobVial(p, pow);
  }

  function randomFloor(p) {
    const lv = G.level;
    for (let k = 0; k < 80; k++) {
      const x = 1 + ((Math.random() * (lv.W - 2)) | 0);
      const y = 1 + ((Math.random() * (lv.H - 2)) | 0);
      if (lv.tiles[y][x] === "floor") { p.x = x + 0.5; p.y = y + 0.5; return; }
    }
  }

  function novaStun(x, y, r, t, col) {
    G.level.foes.forEach((f) => { if (Math.hypot(f.x - x, f.y - y) < r) f.stun = Math.max(f.stun || 0, t); });
    G.fx.push({ x, y, life: 0.42, max: 0.42, kind: "nova", col: col || "#93c5fd", job: "pulse" });
  }
  function blastFoes(x, y, r, dmg) {
    G.level.foes.forEach((f) => { if (Math.hypot(f.x - x, f.y - y) < r) hitFoe(f, dmg, false); });
    G.level.gens.forEach((g) => { if (Math.hypot(g.x + 0.5 - x, g.y + 0.5 - y) < r) g.hp -= 1; });
    G.fx.push({ x, y, life: 0.45, max: 0.45, kind: "nova", col: "#fb923c", job: "bomb" });
  }
  function applyPickup(p, it, fromBag) {
    const k = it.kind;
    const spec = PICK[k] || {};
    const cat = itemCat(k);
    if (!fromBag && cat === "use" && spec.heal && spec.heal < 9999 && p.hp >= p.max * 0.9) {
      if (addInv(p, k, 1)) {
        emit("onPickup", { p: p, kind: k });
        G.score += spec.score || 0;
        say("Bagged " + itemLabel(k) + " · Tab.");
        return;
      }
    }
    if (!fromBag && cat === "relic") {
      ensureInv(p);
      const worn = p.inv.relic.some(function (r) { return r.kind === k; });
      if (!worn && p.inv.relic.length >= INV_RELIC) {
        if (addInv(p, k, 1)) {
          emit("onPickup", { p: p, kind: k });
          if (spec.score) G.score += spec.score;
          say("Bagged " + itemLabel(k) + " — relic slots full. Tab.");
          return;
        }
      }
    }
    emit("onPickup", { p: p, kind: k });
    if (window.CryptStudio) CryptStudio.burst(p.x, p.y, "#fde68a", 6);
    G.fx.push({ x: p.x, y: p.y, life: 0.3, kind: "pick", col: spec.glow || "#fde68a" });
    if (WEAPONS[k]) { giveWep(p, k); if (!fromBag) G.score += spec.score || 90; return; }
    if (spec.heal) {
      p.hp = Math.min(9999, (spec.heal >= 9999 ? p.max : p.hp + spec.heal));
      emit("onHeal", { p: p, n: spec.heal });
      feel("heal", p.x, p.y);
    }
    if (spec.max) { p.max += spec.max; p.hp = Math.min(p.max, p.hp + spec.max); }
    if (spec.vials) p.vials += spec.vials;
    if (spec.keys) p.keys += spec.keys;
    if (spec.cores) p.cores = (p.cores || 0) + spec.cores;
    if (spec.iron) p.iron = (p.iron || 0) + spec.iron;
    if (spec.pierce) p.pierce = (p.pierce || 0) + spec.pierce;
    if (spec.extraCap) p.extraCap = (p.extraCap || 0) + spec.extraCap;
    if (spec.magnet) p.magnet = (p.magnet || 0) + spec.magnet;
    if (spec.stride) p.stride = (p.stride || 0) + spec.stride;
    if (spec.vialPow) p.vialPow = (p.vialPow || 0) + spec.vialPow;
    if (spec.shotBoost) p.shotBoost = Math.max(p.shotBoost || 0, spec.shotBoost);
    if (spec.swift) p.swift = Math.max(p.swift || 0, spec.swift);
    if (spec.aegis) p.aegis = Math.max(p.aegis || 0, spec.aegis);
    if (spec.veil) p.veil = Math.max(p.veil || 0, spec.veil);
    if (spec.reflect) p.reflect = Math.max(p.reflect || 0, spec.reflect);
    if (spec.fury) p.fury = Math.max(p.fury || 0, spec.fury);
    if (spec.thorns) p.thorns = Math.max(p.thorns || 0, spec.thorns);
    if (spec.echo) p.echo = Math.max(p.echo || 0, spec.echo);
    if (spec.regen) p.regen = Math.max(p.regen || 0, spec.regen);
    if (spec.lamp) p.lamp = (p.lamp || 0) + spec.lamp;
    if (spec.score && !fromBag) G.score += spec.score;
    const sp = spec.special;
    if (sp === "poison") {
      p.hp -= 100; p.shotBoost = 0; p.swift = 0; p.aegis = 0; p.veil = 0; p.reflect = 0; p.fury = 0; p.echo = 0;
      say(p.hero.name + " drank blight.");
      return;
    }
    if (sp === "chest") {
      if (Math.random() < 0.42) {
        const drop = Math.random() < 0.28 ? rollLoot() : CHEST_DROP[(Math.random() * CHEST_DROP.length) | 0];
        G.level.items.push({ x: it.x, y: it.y, kind: drop });
      }
    }
    if (sp === "pulse") { novaStun(p.x, p.y, 8, 3, "#93c5fd"); say("Pulse — foes freeze."); }
    if (sp === "frostorb") { novaStun(p.x, p.y, 9, 4.2, "#7dd3fc"); say("Frost — the room stills."); }
    if (sp === "hymn") { novaStun(p.x, p.y, 7, 2.4, "#67e8f9"); p.hp = Math.min(p.max, p.hp + 40); say("Hymnstone."); }
    if (sp === "sun") { novaStun(p.x, p.y, 7, 2.2, "#fbbf24"); p.hp = Math.min(p.max, p.hp + 80); say("Sun — light and heat."); }
    if (sp === "storm") { blastFoes(p.x, p.y, 10, 8); say("Storm walks the floor."); }
    if (sp === "bomb") { blastFoes(p.x, p.y, 5.5, 12); say("The charge blooms."); }
    if (sp === "warp") { randomFloor(p); say(p.hero.name + " warps."); }
    if (sp === "scroll") { randomFloor(p); p.shotBoost = Math.max(p.shotBoost || 0, 10); say("Scroll — elsewhere, armed."); }
    if (sp === "lantern") {
      G.level.items.forEach((o) => { o.hidden = false; });
      p.lamp = (p.lamp || 0) + 1;
      p.shotBoost = Math.max(p.shotBoost || 0, 8);
      say("Lantern — the dark yields.");
    }
    if (sp === "geodesic") {
      randomFloor(p);
      p.aegis = Math.max(p.aegis, 5);
      say("Geodesic — you take the true line.");
    }
    if (sp === "unwrite") {
      blastFoes(p.x, p.y, 8, 16);
      novaStun(p.x, p.y, 8, 2.4, "#c4b5fd");
      say("Unwrite — the stone forgets them.");
    }
    if (sp === "accordseal") {
      novaStun(p.x, p.y, 12, 3.2, "#fbbf24");
      p.iron = (p.iron || 0) + 2;
      p.cores = (p.cores || 0) + 1;
      p.lamp = (p.lamp || 0) + 1;
      p.aegis = Math.max(p.aegis, 8);
      G.players.forEach(function (o) { if (!o.dead) o.hp = Math.min(o.max, o.hp + 120); });
      say("Accord Seal — the lock remembers.");
    }
    if (sp === "trap") { p.stun = 0.8; p.hp -= 15; }
    if (sp === "dice") {
      const pool = ["fury", "moss", "coin", "heart", "swift", "bomb", "elixir", "warp", "thorns", "echo", "prism", "starbread", "sigilplate"];
      say("The die turns.");
      applyPickup(p, { x: it.x, y: it.y, kind: pool[(Math.random() * pool.length) | 0] });
      return;
    }
    if (cat === "gold" && !fromBag) addInv(p, k, 1);
    if (cat === "relic") noteRelic(p, k);
    if (spec.say) say(p.hero.name + " — " + spec.say);
  }
  function pickup(p) {
    G.level.items = G.level.items.filter((it) => {
      if (Math.hypot(it.x + 0.5 - p.x, it.y + 0.5 - p.y) > 0.72 + (p.magnet || 0)) return true;
      G.level.quiet = 0;
      feel("pick", p.x, p.y);
      applyPickup(p, it);
      return false;
    });
  }

  function hitFoe(f, dmg, melee) {
    if (!f || f.isActive === false) return;
    if (f.kind === "wraith" && melee) return;
    if (shadeHidden(f)) return;
    if (f.kind === "drain") return;
    f.hp -= dmg;
    f.hurt = 0.12;
    emit("onEnemyHit", { f: f, dmg: dmg, melee: melee });
    if (f.boss) emit("onBossHit", { f: f, dmg: dmg });
    if (dmg >= 1 && G) {
      const src = G.players.find((p) => !p.dead);
      if (src) {
        const dx = f.x - src.x, dy = f.y - src.y, d = Math.hypot(dx, dy) || 1;
        const kb = f.boss ? 0.04 : 0.14;
        f.x += (dx / d) * kb; f.y += (dy / d) * kb;
      }
    }
    if (window.CryptStudio && dmg >= 1) {
      CryptStudio.floater(f.x, f.y - 0.3, Math.max(1, dmg | 0), f.boss ? "#fbbf24" : "#e2e8f0");
      if (f.boss) feel("boss", f.x, f.y);
      else if (!G._hitSfx) { feel("hit", f.x, f.y); G._hitSfx = true; }
    }
    if (f.hp <= 0 && G.mode !== "survive") scoreKill(((FOE[f.kind] && FOE[f.kind].pts) || 10) * (f.rank || 1));
  }

  function stepPad(p) {
    if (p.padT > 0) return;
    if (tileAt(G.level, p.x, p.y) !== "pad") return;
    const tx = Math.floor(p.x), ty = Math.floor(p.y);
    const pad = (G.level.pads || []).find((d) => d.x === tx && d.y === ty);
    if (!pad) return;
    p.x = pad.tx; p.y = pad.ty; p.padT = p.hero.id === "seidon" ? 0.35 : 0.85;
    feel("pad", p.x, p.y);
    say("Lattice gate.");
  }

  function update(dt) {
    if (!G || G.over || overlayMode === "menu" || overlayMode === "sheet" || overlayMode === "char") { keyEdge = {}; return; }
    G._hitSfx = false;
    G._killSfx = false;
    G.t += dt;
    G.floorT = (G.floorT || 0) + dt;
    if (G.combo > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) { G.combo = 0; G.comboTier = 0; }
    }
    if (G.hitDirs && G.hitDirs.length) {
      for (let i = G.hitDirs.length - 1; i >= 0; i--) {
        G.hitDirs[i].life -= dt;
        if (G.hitDirs[i].life <= 0) G.hitDirs.splice(i, 1);
      }
    }
    announce.life -= dt;
    if (G._coach > 0) {
      G._coach -= dt;
      if (G._coach <= 0) hideCoach();
    }
    if (G._wavePulse) G._wavePulse = Math.max(0, G._wavePulse - dt * 1.6);
    const lv = G.level;
    if (lv.treasure > 0) {
      lv.treasure -= dt;
      if (lv.treasure <= 0) { say("Rush over."); nextFloor(); return; }
    }
    lv.quiet += dt;
    if (lv.quiet > 14 && G.mode !== "survive") {
      for (let y = 0; y < lv.H; y++) for (let x = 0; x < lv.W; x++) {
        if (lv.tiles[y][x] === "door") lv.tiles[y][x] = "door_open";
      }
    }
    if (lv.quiet > 180 && !lv._stallExit && !lv.seal && G.mode !== "survive") {
      lv._stallExit = true;
      const live = G.players.find((p) => !p.dead);
      if (live) {
        const tx = Math.floor(live.x), ty = Math.floor(live.y);
        const near = [[tx + 1, ty], [tx - 1, ty], [tx, ty + 1], [tx, ty - 1]];
        for (const [x, y] of near) {
          if (inB(lv, x, y) && lv.tiles[y][x] === "wall") { lv.tiles[y][x] = "exit"; say("A wall yawns open."); break; }
        }
      }
    }

    G.thiefT -= dt;
    if (G.mode !== "survive" && G.thiefT <= 0) {
      G.thiefT = 52 + Math.random() * 22;
      lv.foes.push(makeFoe("thief", 1, lv.start.x + 0.5, lv.start.y + 0.5));
      say("A thief slips the gate.");
    }
    rosterTick(dt);
    if (G.mode === "survive") {
      surviveTick(dt);
      if (overlayMode === "sheet") { paintHud(); keyEdge = {}; return; }
    }

    lv.gens.forEach((g) => {
      if (g.hp <= 0) return;
      g.t += dt;
      /* A nexus holds a standing crowd, and that budget rides the same curve as the cadence:
         one or two at the top of a floor while the warden reads the map, a real horde once the
         knee passes. Without this the ramp could only make spawns come *faster* than the cap
         could absorb, which is why campaign pressure used to feel flat after the opening. */
      const grow = Math.min(4, Math.max(1, paceRamp() / PACING.base));
      /* On an ENDLESS floor the standing budget rides the wave too, because endless is one of the
         modes the wave clock governs: the same target the wave states, split across the floor's
         live nexuses and held under the mode's own frame budget. A campaign floor is authored and
         short, so its nexuses keep the pacing curve alone (band stays 1 and nothing changes). */
      const band = (G.mode === "endless" && G.t > WAVE.sec)
        ? Math.min(6, waveNormals(G.t) / WAVE.norm)
        : 1;
      const want = G.mode === "endless" ? Math.max(1, Math.min(220, waveNormals(G.t || 0))) : Infinity;
      const cap = Math.round((1 + g.rank) * grow * band);
      const live = lv.foes.filter((f) => f.kind === g.kind && Math.hypot(f.x - g.x, f.y - g.y) < 8).length;
      /* Nexus cadence rides the same curve as everything else: quiet at the top of a floor,
         then a steady pour once the knee passes — and on endless, faster as the wave climbs. */
      if (g.t > paceGap(2.1 / Math.max(1, g.rank * 0.7) / band) && live < cap && lv.foes.length < want) {
        g.t = 0;
        const sp = nearestWalk(lv, g.x + 0.5, g.y + 0.5);
        lv.foes.push(makeFoe(g.kind, g.rank, sp.x, sp.y));
      }
    });
    lv.gens = lv.gens.filter((g) => g.hp > 0);
    if (lv.seal && lv.gens.length === 0) unlockSeal();

    bindIdlePads();
    rebuildFoeGrid();
    G.players.forEach((p) => {
      if (p.dead) return;
      if ((p.sleepT || 0) > 0) {
        p.sleepT -= dt;
        if (p.sleepT <= 0) {
          p.hp = Math.round(p.max * 0.4);
          say(p.hero.name + " wakes.");
        }
        return;
      }
      const drain = G.mode === "survive"
        ? ((G._coach > 0 ? 0.05 : 0.11))
        : (G.mode === "endless" ? 0.22 + Math.min(0.28, G.floor * 0.008) : (0.16 + G.floor * 0.007));
      p.hp -= dt * drain * (p.ai ? 0.42 : 1);
      p.fireT = Math.max(0, p.fireT - dt);
      p.coolT = p.coolT || {};
      Object.keys(p.coolT).forEach((k) => { p.coolT[k] = Math.max(0, p.coolT[k] - dt); });
      p.hurtT = Math.max(0, (p.hurtT || 0) - dt);
      p.magT = Math.max(0, p.magT - dt);
      p.stun = Math.max(0, p.stun - dt);
      p.muteT = Math.max(0, (p.muteT || 0) - dt);
      p.slowT = Math.max(0, (p.slowT || 0) - dt);
      p.rootT = Math.max(0, (p.rootT || 0) - dt);
      p.padT = Math.max(0, p.padT - dt);
      p.shotBoost = Math.max(0, p.shotBoost - dt);
      p.swift = Math.max(0, p.swift - dt);
      p.aegis = Math.max(0, p.aegis - dt);
      p.veil = Math.max(0, p.veil - dt);
      p.reflect = Math.max(0, p.reflect - dt);
      p.fury = Math.max(0, (p.fury || 0) - dt);
      p.thorns = Math.max(0, (p.thorns || 0) - dt);
      p.echo = Math.max(0, (p.echo || 0) - dt);
      p.regen = Math.max(0, (p.regen || 0) - dt);
      if (p.regen > 0) p.hp = Math.min(p.max, p.hp + dt * 18);
      p.hurtBeep = Math.max(0, (p.hurtBeep || 0) - dt);
      if (p.hp <= 0) {
        p.hp = 0;
        if (p.ai) {
          p.sleepT = petSleepLen();
          say(p.hero.name + " sleeps — one minute.");
          return;
        }
        p.dead = true;
        emit("onPlayerDeath", { p: p });
        say(p.hero.name + " falls. Credit to rise.");
        return;
      }
      const inn = inputFor(p);
      p.dashCd = Math.max(0, (p.dashCd || 0) - dt);
      if ((p.dashT || 0) > 0) p.dashT = Math.max(0, p.dashT - dt);
      if (p.stun <= 0 && (p.rootT || 0) <= 0) {
        if (inn.dash) beginDash(p, inn);
        let mdx = inn.dx, mdy = inn.dy;
        let spd = (2.55 + p.hero.speed * 0.6) * (p.swift > 0 ? 1.32 : 1) * (1 + (p.stride || 0) * 0.08) * ((p.slowT || 0) > 0 ? 0.52 : 1);
        if ((p.dashT || 0) > 0) {
          mdx = p.dashX; mdy = p.dashY;
          spd *= 2.7;
          if (p._dashBump) { p._dashBump = false; bumpDash(p); }
        }
        tryMove(p, mdx, mdy, spd, dt, false);
        if (mdx || mdy) p.walk += dt * 8;
      }
      if (inn.fire) fireArsenal(p);
      tickMelee(p, dt);
      if (inn.mag) useVial(p);
      if (inn.cycle) cycleWep(p);
      pickup(p);
      if (p.halo) {
        p.halo.forEach((h) => {
          h.ang += dt * 5.2;
          const hx = p.x + Math.cos(h.ang) * h.r, hy = p.y + Math.sin(h.ang) * h.r;
          G.level.foes.forEach((f) => {
            if (Math.hypot(f.x - hx, f.y - hy) < 0.56) hitFoe(f, Math.max(2, 2 + (p.cores || 0) + wepLv(p, "halo")), false);
          });
        });
      }
      stepPad(p);
      unstack(p);
      unstick(p);
      if (G.mode !== "survive" && tileAt(lv, p.x, p.y) === "exit") G._exit = true;
    });
    tickPets(dt);
    if (G._exit) { G._exit = false; nextFloor(); return; }

    const humans = G.players.filter((p) => !p.ai);
    if ((humans.length ? humans : G.players).every((p) => p.dead)) {
      G.over = true;
      gateRest();          // run closed: hand the reminder back after a quiet window
      const gained = grantSeals();
      persist.runs++;
      persist.best = Math.max(persist.best, G.score);
      if (G.mode === "survive") persist.surviveBest = Math.max(persist.surviveBest || 0, G.score);
      savePersist();
      const posted = Math.max(0, (G.score / Math.max(1, G.credits)) | 0);
      hallMark("run");
      const rec = G.mode === "survive"
        ? "Wave " + surviveWave() + " · " + (G.kills || 0) + " kills · lv " + G.lvl
        : "Floor " + (G.floor + 1) + " · hall " + posted;
      const pb = G.mode === "survive" ? (persist.surviveBest || persist.best) : persist.best;
      const hook = G.score >= pb ? "New mark on the hall. The door is still open." : "The crypt remembers. One more descent.";
      showSheet(
        "<p class='kicker'>Run closed</p><h2>" + G.score + (G.mode === "survive" ? " · wave " + surviveWave() : " · floor " + (G.floor + 1)) + "</h2>" +
        "<p class='lore'>" + rec + " · Best " + persist.best + " · credits " + G.credits + " · +" + gained + " seals (" + (persist.seals || 0) + ")</p>" +
        "<p class='lore'>" + hook + "</p>" +
        "<div class='modes'><button class='btn gold' id='again'>Descend again</button><button class='btn' id='mm'>Menu</button></div>"
      );
      $("again").onclick = () => newRun({ hero: persist.hero, mode: G.mode });
      $("mm").onclick = menu;
      return;
    }

    const liveP = G.players.filter((p) => !p.dead && (p.sleepT || 0) <= 0);
    liveP.forEach((p) => { p._touch = 0; });
    (G.pets || []).forEach(function (pet) { if ((pet.sleepT || 0) <= 0) pet._touch = 0; });
    rebuildFoeGrid();
    lv.foes.forEach((f) => {
      f.t += dt; f.hurt = Math.max(0, f.hurt - dt); f.flicker += dt;
      f.stun = Math.max(0, (f.stun || 0) - dt);
      if (f.stun > 0) return;
      const def = FOE[f.kind];
      if (!def) return;
      let tgt = null, bd = 1e9;
      function consider(ent) {
        if (!ent || ent.hp <= 0 || ent.dead || (ent.sleepT || 0) > 0) return;
        if (ent.veil > 0 && Math.hypot(ent.x - f.x, ent.y - f.y) > 0.42) return;
        const d = Math.hypot(ent.x - f.x, ent.y - f.y);
        if (d < bd) { bd = d; tgt = ent; }
      }
      liveP.forEach(consider);
      if (!tgt) return;
      const ang = Math.atan2(tgt.y - f.y, tgt.x - f.x);
      const ghost = foeHas(f, "ghost");
      if (f.boss && f.hp < f.max * 0.5 && (f.phase || 1) < 2) {
        f.phase = 2;
        emit("onBossPhase", { f: f, phase: 2 });
        say(f.kind === "unspool" ? "The Unspooler rips the ring wider."
          : (f.kind === "titheking" ? "The Tithe-King drinks the room."
            : (f.kind === "nameeater" ? "The Name-Eater unwrites your shot."
              : "The guardian breaks its first seal.")));
        if (f.kind === "unspool") {
          for (let i = 0; i < 4; i++) lv.foes.push(makeFoe("spawnling", 1, f.x + (i - 1.5) * 0.5, f.y + 0.4));
        }
        if (f.kind === "nameeater") {
          for (let i = 0; i < 3; i++) lv.foes.push(makeFoe("shade", 1, f.x + Math.cos(i * 2.1) * 1.2, f.y + Math.sin(i * 2.1) * 1.2));
        }
      }
      const spdMul = (f.phase >= 2 ? 1.32 : 1);
      if (lodOn() && bd > 22 && !def.boss) {
        tryMove(f, Math.cos(ang), Math.sin(ang), def.speed * 0.85 * spdMul, dt, ghost);
        return;
      }
      let mx = Math.cos(ang), my = Math.sin(ang);
      if (foeHas(f, "shoot")) {
        if (bd < 3.2) { mx = -mx; my = -my; }
        else if (bd < 5.2) { mx = -my; my = mx; }
      }
      tryMove(f, mx, my, def.speed * (0.9 + f.rank * 0.15) * spdMul * spdScale() * (f.spdBonus || 1), dt, ghost);
      if (!ghost) unstick(f);
      else if (blocked(lv, f.x, f.y)) unstick(f);
      if (foeHas(f, "heal")) {
        lv.foes.forEach((o) => {
          if (o === f || o.hp <= 0) return;
          if (Math.hypot(o.x - f.x, o.y - f.y) < 2.4) o.hp = Math.min(o.max, o.hp + dt * 1.4);
        });
      }
      const hitR = def.boss ? 0.72 : 0.48;
      if (bd < hitR) {
        const arm = tgt.hero
          ? ((tgt.aegis > 0 ? tgt.hero.armor + 2 : tgt.hero.armor) + (tgt.iron || 0))
          : (tgt.armor || 0);
        /* Contact hurts more the longer the run has gone. This is the lever that ends runs: no
           HP pool outlasts it, because it grows without a ceiling while the pool does not. */
        const dmgMul = (G.mode === "survive"
          ? (0.48 + 0.035 * Math.max(0, (G.lvl || 1) - 1) + 0.018 * Math.max(0, surviveWave() - 1))
          : (f.rank * dmgScale())) * pressure();
        const dmg = Math.max(1, def.dmg * dmgMul * (f.rage || 1) - arm);
        const iframe = (tgt.hurtT || 0) > 0.12;
        if (f.kind === "drain") tgt.hp -= dmg * dt * 6.5;
        else if (G.mode === "survive") {
          /* The hurt window stops a crowd stacking five hits into a single frame; it is not
             immunity. Reading hurtT > 0 as immunity made contact damage impossible to land in
             Survival — a foe in contact re-armed the window every frame — so a warden standing
             in a horde took no damage at all and a run could not end. */
          tgt._touch = (tgt._touch || 0) + 1;
          if (tgt._touch <= 5) tgt.hp -= dmg * dt * 1.85;
          if (!iframe) {
            tgt.hurtT = 0.46;
            tryMove(tgt, -Math.cos(ang), -Math.sin(ang), 6, 0.04, false);
          }
        } else {
          tgt.hp -= dmg * dt * (iframe ? 1.15 : 2.35);
          if (!iframe) {
            tgt.hurtT = 0.38;
            tryMove(tgt, -Math.cos(ang), -Math.sin(ang), 6, 0.04, false);
          }
        }
        lv.quiet = 0;
        if (!tgt.hero && tgt.hp <= 0) {
          tgt.hp = 0;
          if (!(tgt.sleepT > 0)) {
            tgt.sleepT = petSleepLen();
            const nm = PETS[tgt.kind] && PETS[tgt.kind].name;
            if (nm) say(nm + " sleeps — 20s.");
          }
        }
        if (!tgt.hurtBeep) {
          feel("hurt", tgt.x, tgt.y); tgt.hurtBeep = 0.25;
          noteHitDir(tgt, f);
          if (tgt.hero) emit("onPlayerHit", { p: tgt, f: f });
        }
        if (tgt.reflect > 0) f.hp -= 14 * dt;
        if (tgt.thorns > 0) f.hp -= 22 * dt;
        if (foeHas(f, "slow")) tgt.slowT = Math.max(tgt.slowT || 0, 1.55);
        if (foeHas(f, "root")) tgt.rootT = Math.max(tgt.rootT || 0, 0.5);
        if (f.kind === "thief" && tgt.vials > 0 && !iframe) { tgt.vials--; f.hp = 0; say("Thief stole a vial!"); }
        if (f.kind === "drain") {
          f._sip = (f._sip || 0) + dmg * dt * 8;
          if (f._sip > 200) { f.hp = 0; say("The Drain leaves, sated."); }
        }
        if (def.melee && f.kind !== "wraith" && tgt.hero) f.hp -= tgt.hero.melee * dt * 2.2 * braveMul(tgt);
      }
      if (foeHas(f, "hymn") && bd < 3.3 && bd > 0.5) {
        tgt.hp -= Math.max(1, def.dmg * 0.35) * dt * (G.mode === "survive" ? 1.1 : 1.4);
      }
      if (foeHas(f, "shoot") && f.t > (f.phase >= 2 ? 0.7 : 1.1) && bd < 9 && hasLos(f.x, f.y, tgt.x, tgt.y)) {
        f.t = 0;
        pushShot({ x: f.x, y: f.y, px: f.x, py: f.y, vx: Math.cos(ang) * 6, vy: Math.sin(ang) * 6, dmg: 8, foe: true, life: 1.4, maxLife: 1.4, hero: "imp", wep: "imp", air: true, grace: 0, trail: [{ x: f.x, y: f.y }] });
        if (foeHas(f, "echo")) f._echo = 0.18;
      }
      if ((f._echo || 0) > 0) {
        f._echo -= dt;
        if (f._echo <= 0) {
          pushShot({ x: f.x, y: f.y, px: f.x, py: f.y, vx: Math.cos(ang) * 6.4, vy: Math.sin(ang) * 6.4, dmg: 6, foe: true, life: 1.1, maxLife: 1.1, hero: "imp", wep: "imp", air: true, grace: 0, trail: [{ x: f.x, y: f.y }] });
        }
      }
      if (foeHas(f, "lob") && f.t > (f.phase >= 2 && def.super ? 0.7 : 1.4) && hasLos(f.x, f.y, tgt.x, tgt.y)) {
        f.t = 0;
        const nLob = def.super && f.phase >= 2 ? 3 : 1;
        for (let i = 0; i < nLob; i++) {
          const a = ang + (i - (nLob - 1) / 2) * 0.28;
          pushShot({ x: f.x, y: f.y, px: f.x, py: f.y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, dmg: def.super ? 14 : 10, foe: true, life: 1.6, maxLife: 1.6, lob: true, hero: "hurler", wep: "hurler", air: true, grace: 0, trail: [{ x: f.x, y: f.y }] });
        }
      }
      if (foeHas(f, "radial") && f.t > (f.phase >= 2 ? 0.8 : 1.25)) {
        f.t = 0;
        const n = f.phase >= 2 ? 12 : 8;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 6.28 + G.t * 0.4;
          pushShot({ x: f.x, y: f.y, px: f.x, py: f.y, vx: Math.cos(a) * 7.2, vy: Math.sin(a) * 7.2, dmg: 13, foe: true, life: 1.45, maxLife: 1.45, hero: "imp", wep: "imp", air: true, grace: 0, trail: [{ x: f.x, y: f.y }] });
        }
      }
      if (foeHas(f, "pull") && bd < 8.5 && bd > 0.8) {
        const pull = (f.phase >= 2 ? 2.6 : 1.6) * dt;
        tgt.x -= Math.cos(ang) * pull;
        tgt.y -= Math.sin(ang) * pull;
        if (f.phase >= 2 && def.heal) { /* no */ }
        if (f.phase >= 2) f.hp = Math.min(f.max, f.hp + dt * 2.2);
      }
      if (foeHas(f, "blink") && f.t > (f.phase >= 2 ? 1.35 : 2.1)) {
        f.t = 0;
        const ox = tgt.x + (Math.random() - 0.5) * 5;
        const oy = tgt.y + (Math.random() - 0.5) * 5;
        const np = nearestWalk(lv, ox, oy);
        G.fx.push({ x: f.x, y: f.y, life: 0.35, kind: "warp" });
        f.x = np.x; f.y = np.y;
        G.fx.push({ x: f.x, y: f.y, life: 0.35, kind: "warp" });
      }
      if (def.silence && bd < 5 && (f._sil || 0) <= 0) {
        f._sil = f.phase >= 2 ? 2.4 : 3.2;
        tgt.muteT = Math.max(tgt.muteT || 0, f.phase >= 2 ? 2.4 : 1.5);
        say(tgt.hero.name + " — shot unnamed.");
        G.fx.push({ x: tgt.x, y: tgt.y, life: 0.4, kind: "nova", col: "#c4b5fd" });
      }
      if (def.silence) f._sil = Math.max(0, (f._sil || 0) - dt);
    });
    const born = [];
    lv.foes = lv.foes.filter((f) => {
      if (f.hp > 0) return true;
      emit("onEnemyDeath", { f: f });
      emit("onKill", { f: f });
      if (f.boss) emit("onBossDeath", { f: f });
      if (window.CryptStudio) {
        if (f.boss) feel("boss", f.x, f.y);
        else {
          if (!G._killSfx) { feel("kill", f.x, f.y); G._killSfx = true; }
          else CryptStudio.burst(f.x, f.y, "#fb923c", lodOn() ? 3 : 8);
        }
      }
      if (f.explode) {
        blastFoes(f.x, f.y, 2.1, 7);
        if (window.CryptStudio) CryptStudio.burst(f.x, f.y, "#fb923c", 14);
      }
      if (f.split && !f._splitDone) {
        f._splitDone = true;
        for (let i = 0; i < 2; i++) {
          const n = makeFoe("wraith", 1, f.x + (i ? 0.35 : -0.35), f.y);
          n.split = false; n.hp = 1; n.max = 1;
          born.push(n);
        }
      }
      if (f.boss) dropBoss(f);
      onKillCommon(f);
      G.fx.push({ x: f.x, y: f.y, life: 0.35, kind: "puff" });
      if (window.CryptStudio) CryptStudio.pool.foe.free(f);
      return false;
    });
    /* The split-spawn path is still the wave's business: an endless floor may not exceed the
       budget the minute paid for either, while a campaign floor keeps its flat frame budget. */
    const capNow = G.mode === "survive" ? surviveCap(surviveWave())
      : (G.mode === "endless" ? Math.max(1, Math.min(220, waveNormals(G.t || 0))) : 220);
    born.forEach((n) => { if (lv.foes.length < capNow) lv.foes.push(n); });

    G.shots.forEach((s) => {
      s.life -= dt;
      s.px = s.x; s.py = s.y;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.seek && !s.foe && lv.foes.length) {
        let best = null, bd = 9;
        queryFoes(s.x, s.y, 9).forEach((f) => {
          const d = Math.hypot(f.x - s.x, f.y - s.y);
          if (d < bd) { bd = d; best = f; }
        });
        if (best) {
          const ang = Math.atan2(best.y - s.y, best.x - s.x);
          const spd = Math.hypot(s.vx, s.vy) || 10;
          s.vx = s.vx * 0.8 + Math.cos(ang) * spd * 0.2;
          s.vy = s.vy * 0.8 + Math.sin(ang) * spd * 0.2;
        }
      }
      s.grace = Math.max(0, (s.grace || 0) - dt);
      if (!lodOn()) {
        s.trail = s.trail || [];
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > (s.wep === "needle" ? 12 : 8)) s.trail.shift();
      } else s.trail = s.trail && s.trail.length ? [s.trail[s.trail.length - 1]] : [];
      const wallHit = (s.foe || !s.lob) ? firstWallOnSeg(s.px || s.x, s.py || s.y, s.x, s.y) : null;
      if (!wallHit) s.air = true;
      if (wallHit && (s.air || (s.grace || 0) <= 0)) {
        if (!s.foe && ((s.owner && s.owner.reflect > 0) || s.echo) && !s.bounced) {
          s.vx *= -1; s.vy *= -1; s.bounced = true; s.x = (s.px || s.x); s.y = (s.py || s.y);
        } else {
          s.x = wallHit.x; s.y = wallHit.y;
          smashItem(s);
          G.fx.push({ x: s.x, y: s.y, life: 0.16, kind: "hit", wep: wepKey(s) });
          s.life = 0; return;
        }
      }
      if (s.foe) {
        liveP.forEach((p) => {
          if (p.veil > 0) return;
          if (Math.hypot(p.x - s.x, p.y - s.y) > 0.7 && firstWallOnSeg(s.px || s.x, s.py || s.y, p.x, p.y)) return;
          if (distSeg(p.x, p.y, s.px || s.x, s.py || s.y, s.x, s.y) < 0.46) {
            p.hp -= Math.max(3, s.dmg - p.hero.armor - (p.iron || 0));
            G.fx.push({ x: s.x, y: s.y, life: 0.18, kind: "hit", wep: wepKey(s) });
            s.life = 0;
          }
        });
      } else {
        lv.gens.forEach((g) => {
          if (s.life <= 0) return;
          if (distSeg(g.x + 0.5, g.y + 0.5, s.px || s.x, s.py || s.y, s.x, s.y) <= 0.78) {
            g.hp -= 1; G.score += 5; lv.quiet = 0; beep("hit");
            G.fx.push({ x: s.x, y: s.y, life: 0.2, kind: "hit", wep: wepKey(s) });
            if (s.pierce > 0) s.pierce--; else s.life = 0;
          }
        });
        if (s.life > 0) {
          queryFoes(s.x, s.y, 1.2).forEach((f) => {
            if (s.life <= 0) return;
            if (distSeg(f.x, f.y, s.px || s.x, s.py || s.y, s.x, s.y) < ((FOE[f.kind] && FOE[f.kind].boss) ? 0.9 : 0.66)) {
              hitFoe(f, s.dmg, false);
              G.fx.push({ x: s.x, y: s.y, life: 0.22, kind: "hit", wep: wepKey(s) });
              if (s.flame) G.fx.push({ x: f.x, y: f.y, life: s.flame, kind: "cinder", dmg: Math.max(2, s.dmg - 1) });
              if (s.chain && !s._chained) {
                s._chained = true;
                let nx = null, nd = 3.4;
                lv.foes.forEach((o) => {
                  if (o === f || o.hp <= 0) return;
                  const d = Math.hypot(o.x - f.x, o.y - f.y);
                  if (d < nd) { nd = d; nx = o; }
                });
                if (nx) {
                  const ang = Math.atan2(nx.y - f.y, nx.x - f.x);
                  pushShot({
                    x: f.x + Math.cos(ang) * 0.55, y: f.y + Math.sin(ang) * 0.55,
                    vx: Math.cos(ang) * 14, vy: Math.sin(ang) * 14,
                    dmg: Math.max(1, s.dmg - 1), owner: s.owner, life: 0.35, maxLife: 0.35,
                    hero: s.hero, wep: s.wep, pierce: 0, chain: false, grace: 0.05
                  });
                }
              }
              if (s.pierce > 0) s.pierce--; else s.life = 0;
            }
          });
        }
        if (s.life > 0) smashItem(s);
      }
      if (s.life <= 0 && s.flame) G.fx.push({ x: s.x, y: s.y, life: s.flame, kind: "cinder", dmg: Math.max(2, s.dmg - 1) });
      if (s.life <= 0 && s.nova) blastFoes(s.x, s.y, 1.85, Math.max(2, s.dmg));
    });
    G.shots = G.shots.filter((s) => {
      if (s.life > 0) return true;
      if (window.CryptStudio) CryptStudio.pool.shot.free(s);
      return false;
    });
    G.fx.forEach((f) => {
      if (f.kind !== "cinder") return;
      lv.foes.forEach((foe) => {
        if (Math.hypot(foe.x - f.x, foe.y - f.y) < 0.55) hitFoe(foe, (f.dmg || 2) * dt * 3.5, false);
      });
    });
    G.fx = G.fx.filter((f) => { f.life -= dt; return f.life > 0; });
    pollJoin();
    G.score = Math.min(999999999, G.score);
    if (window.CryptStudio) {
      const p0 = liveP[0];
      CryptStudio.musicTick(
        Math.max(0.18, G.mode === "survive" ? Math.min(1, surviveWave() / 20) : Math.min(1, (G.floor + 3) / 18)),
        {
          danger: p0 ? 1 - (p0.hp / Math.max(1, p0.max)) : 0,
          horde: Math.min(1, lv.foes.length / 1000),
          boss: lv.foes.some((f) => f.boss && f.hp > 0)
        }
      );
    }
    if (lodOn() && G.fx.length > 48) G.fx = G.fx.slice(-48);
    G._hudT = (G._hudT || 0) + dt;
    if (G._hudT > 0.1) { G._hudT = 0; paintHud(); }
    /* Campaign and Endless draft cards on level-up too — same cabinet as Survival. */
    if (G.pendingLvl > 0 && overlayMode == null && !G.over) offerSurviveUp();
    keyEdge = {};
  }

  function pollJoin() {
    if (!G || G.over) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let start = false;
    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      if (!pad || !pad.buttons[9] || !pad.buttons[9].pressed) continue;
      start = true;
      if (G._startLatch) return;
      G._startLatch = true;
      const owned = G.players.some((p) => p.pad === i);
      if (!owned && G.players.length < 4) {
        credit();
        const p = G.players[G.players.length - 1];
        if (p) p.pad = i;
      } else credit();
      return;
    }
    if (!start) G._startLatch = false;
  }
  function pollSelectChar() {
    if (!G || G.over || G._ups) return;
    if (overlayMode === "menu" || overlayMode === "options" || overlayMode === "sheet") return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let sel = false;
    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      if (!pad || !pad.buttons) continue;
      const b = pad.buttons[8];
      if (b && (b.pressed || b.value > 0.5)) { sel = true; break; }
    }
    if (sel) {
      if (G._selectLatch) return;
      G._selectLatch = true;
      toggleChar();
      return;
    }
    G._selectLatch = false;
  }

  function unstack(p) {
    G.players.forEach((o) => {
      if (o === p || o.dead) return;
      const dx = p.x - o.x, dy = p.y - o.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.001) { p.x += 0.22; return; }
      if (d < 0.38) {
        p.x += (dx / d) * 0.04;
        p.y += (dy / d) * 0.04;
        if (blocked(G.level, p.x, p.y)) { p.x -= (dx / d) * 0.04; p.y -= (dy / d) * 0.04; }
      }
    });
  }

  function smashItem(s) {
    G.level.items = G.level.items.filter((it) => {
      if (Math.hypot(it.x + 0.5 - s.x, it.y + 0.5 - s.y) > 0.4) return true;
      const smash = (PICK[it.kind] && PICK[it.kind].smash) || (it.kind === "flask" ? "flask" : (it.kind === "vial" ? "vial" : null));
      if (smash === "flask") { say("Shot the flask."); return false; }
      if (smash === "poison") { say("Blight bursts."); return false; }
      if (smash === "vial") {
        G.level.foes.forEach((f) => { if (Math.hypot(f.x - it.x, f.y - it.y) < 6) f.hp -= 12; });
        say("Floor vial bursts.");
        return false;
      }
      if (smash === "bomb") {
        blastFoes(it.x + 0.5, it.y + 0.5, 5.5, 10);
        say("Shot the charge.");
        return false;
      }
      return true;
    });
  }

  function unlockSeal() {
    const lv = G.level;
    if (!lv.seal) return;
    for (let y = 0; y < lv.H; y++) for (let x = 0; x < lv.W; x++) {
      if (lv.tiles[y][x] === "exit_lock") lv.tiles[y][x] = "exit";
    }
    lv.seal = false;
    say("The seal cracks. The exit wakes.");
    if (G.mode === "campaign" && lv.index != null) {
      const gift = SEAL_GIFT[(lv.index / 3) | 0];
      if (gift) {
        G.players.forEach((p) => {
          if (p.dead) return;
          if (WEAPONS[gift]) giveWep(p, gift);
          else if (gift === "core") { p.cores++; say("Seal core."); }
          else if (gift === "phial") { p.vials += 2; say("Seal phial."); }
          else if (gift === "iron") { p.iron++; say("Seal iron."); }
        });
      }
      const recruit = ["lyra", "arkos", "d9ra", "srath", "kairos", "justicae", "seidon", "sancora"][(lv.index / 3) | 0];
      if (recruit && persist.unlocked.indexOf(recruit) < 0) {
        persist.unlocked.push(recruit);
        savePersist();
        const rh = heroOf(recruit);
        say(rh.name + " the " + rh.tag + " joins the roster.");
      }
    }
  }

  function winCampaign() {
    G.over = true;
    gateRest();            // level-complete sheet: 'Enter endless' re-holds in newRun
    const gained = grantSeals();
    persist.runs++;
    persist.best = Math.max(persist.best, G.score);
    persist.campaignBest = Math.max(persist.campaignBest || 0, G.score);
    savePersist();
    const posted = Math.max(0, (G.score / Math.max(1, G.credits)) | 0);
    hallMark("win");
    showSheet(
      "<p class='kicker'>The lock opens</p><h2>First Descent complete</h2>" +
      "<p class='lore'>Four names held the door. Score " + G.score + " · hall " + posted + " · credits " + G.credits + " · +" + gained + " seals (" + (persist.seals || 0) + ").</p>" +
      "<p class='lore'>The crypt still goes down. Endless does not keep a last floor.</p>" +
      "<div class='modes'><button class='btn gold' id='toEndless'>Enter endless</button><button class='btn' id='mm'>Menu</button></div>"
    );
    $("toEndless").onclick = () => newRun({ hero: persist.hero, mode: "endless" });
    $("mm").onclick = menu;
  }

  function nextFloor() {
    if (G.mode === "survive") return;
    if (G.mode === "campaign" && window.LatticeCampaign && G.floor + 1 >= window.LatticeCampaign.LEN) {
      say("Floor " + (G.floor + 1) + " sealed.");
      winCampaign();
      return;
    }
    const live = G.players.filter((p) => !p.dead);
    const sip = live.reduce((n, p) => n + Math.min(50, (p.hp / 14) | 0), 0);
    const bonus = 140 + G.floor * 22 + sip;
    G.score += bonus;
    live.forEach((p) => {
      p.max += 10;
      p.hp = Math.min(p.max, p.hp + 10 + Math.round(p.max * 0.08));
    });
    hallMark("floor");
    say("Floor " + (G.floor + 1) + " sealed · +10 well · +" + bonus + " hall · a relic at the door.");
    feel("exit");
    loadFloor(G.floor + 1);
    dropItemNear(G.level.start.x, G.level.start.y, rollLoot());
  }

  function credit() {
    if (!G || G.over) return;
    if (overlayMode === "pause" || overlayMode === "menu" || overlayMode === "char" || overlayMode === "options") return;
    feel("credit", G.players[0] && G.players[0].x, G.players[0] && G.players[0].y);
    const down = G.players.find((p) => p.dead);
    if (!down) {
      if (G.players.length < 4) {
        const used = G.players.map((p) => p.hero.id);
        const pool = HEROES.filter((h) => (persist.unlocked || ["kael"]).indexOf(h.id) >= 0);
        const next = pool.find((h) => !used.includes(h.id)) || pool[G.players.length % pool.length];
        const p = joinHero(next.id);
        if (!p) return;
        applyRite(p);
        const st = G.level.start;
        p.x = st.x + 0.5; p.y = st.y + 0.5;
        G.credits++;
        say(p.hero.name + " joins the lattice.");
      }
      return;
    }
    down.dead = false; down.hp = down.max; G.credits++;
    if (!down._rited) applyRite(down);
    say(down.hero.name + " rises.");
  }

  function paintTileCache(lv, z, x0, y0, x1, y1, key) {
    const tw = Math.max(1, (x1 - x0) * TILE + 2);
    const th = Math.max(1, (y1 - y0) * TILE + 2);
    if (!tileCache) tileCache = document.createElement("canvas");
    if (tileCacheKey === key && tileCache.width === tw && tileCache.height === th) return;
    tileCacheKey = key;
    tileCache.width = tw;
    tileCache.height = th;
    const tctx = tileCache.getContext("2d", { alpha: false });
    tctx.imageSmoothingEnabled = false;
    tctx.fillStyle = "#05060a";
    tctx.fillRect(0, 0, tw, th);
    const prev = drawTarget;
    drawTarget = tctx;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const px = (x - x0) * TILE, py = (y - y0) * TILE;
      const t = lv.tiles[y][x];
      if (t === "wall") {
        const N = !solidAt(lv, x, y - 1), S = !solidAt(lv, x, y + 1);
        const E = !solidAt(lv, x + 1, y), W = !solidAt(lv, x - 1, y);
        if (!N && !S && !E && !W) { drawTile("void", px, py); continue; }
        drawTile(z + "_top", px, py);
        if (S) drawTile(z + "_face", px, py);
      } else {
        drawTile(floorName(z, x, y), px, py);
        if (t === "door") drawSpr("door", px, py);
        if (t === "door_open") drawSpr("door_open", px, py);
        if (t === "exit") drawSpr("exit", px, py);
        if (t === "exit_lock") { tctx.globalAlpha = 0.32; drawSpr("exit", px, py); tctx.globalAlpha = 1; }
        if (t === "pad") drawSpr("pad", px, py);
      }
    }
    drawTarget = prev;
  }
  function draw() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const dpr = lodOn() ? 1 : Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== (w * dpr | 0) || canvas.height !== (h * dpr | 0)) {
      canvas.width = w * dpr | 0; canvas.height = h * dpr | 0;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (!bgCanvas) {
      ctx.fillStyle = "#05060a";
      ctx.fillRect(0, 0, w, h);
    }
    if (!G || !G.level) { drawMap(); return; }
    const lv = G.level;
    const live = G.players.filter((p) => !p.dead && (p.sleepT || 0) <= 0);
    const camSrc = live.filter((p) => !p.ai);
    const follow = camSrc.length ? camSrc : live;
    let fx = 0, fy = 0, fn = 0;
    follow.forEach((p) => { fx += p.x; fy += p.y; fn++; });
    const focus = fn ? { x: fx / fn, y: fy / fn } : (G.players[0] || { x: 2, y: 2 });
    const bb = lv.box || { x0: 1, y0: 1, x1: lv.W - 2, y1: lv.H - 2 };
    const pad = TILE * 2.4;
    const minX = bb.x0 * TILE - pad, maxX = (bb.x1 + 1) * TILE + pad - w;
    const minY = bb.y0 * TILE - pad, maxY = (bb.y1 + 1) * TILE + pad - h;
    let tx = focus.x * TILE - w / 2, ty = focus.y * TILE - h / 2;
    if (maxX < minX) tx = ((bb.x0 + bb.x1 + 1) * TILE - w) / 2;
    else tx = Math.max(minX, Math.min(maxX, tx));
    if (maxY < minY) ty = ((bb.y0 + bb.y1 + 1) * TILE - h) / 2;
    else ty = Math.max(minY, Math.min(maxY, ty));
    cam.x += (tx - cam.x) * 0.42;
    cam.y += (ty - cam.y) * 0.42;
    if (window.CryptStudio && !CryptStudio.reduced) {
      cam.x += CryptStudio.juice.sx;
      cam.y += CryptStudio.juice.sy;
    }
    const z = lv.realm.id || "stone";
    const x0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
    const y0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
    const x1 = Math.min(lv.W, Math.ceil((cam.x + w) / TILE) + 2);
    const y1 = Math.min(lv.H, Math.ceil((cam.y + h) / TILE) + 2);
    const CHUNK = 16;
    const chunkKey = G.seed + ":" + G.floor + ":" + ((x0 / CHUNK) | 0) + "," + ((y0 / CHUNK) | 0) + ":" + ((x1 / CHUNK) | 0) + "," + ((y1 / CHUNK) | 0) + ":" + x0 + "," + y0 + "," + x1 + "," + y1 + ":" + z;
    paintTileCache(lv, z, x0, y0, x1, y1, chunkKey);
    const tileDest = bgCanvas ? bgCanvas.getContext("2d", { alpha: false }) : ctx;
    if (bgCanvas) {
      if (bgCanvas.width !== canvas.width || bgCanvas.height !== canvas.height) {
        bgCanvas.width = canvas.width; bgCanvas.height = canvas.height;
      }
      tileDest.setTransform(dpr, 0, 0, dpr, 0, 0);
      tileDest.imageSmoothingEnabled = false;
      tileDest.fillStyle = "#05060a";
      tileDest.fillRect(0, 0, w, h);
      ctx.clearRect(0, 0, w, h);
    }
    if (tileCache) tileDest.drawImage(tileCache, Math.round(x0 * TILE - cam.x), Math.round(y0 * TILE - cam.y));
    updateFog();
    drawFog(tileDest, x0, y0, x1, y1);
    drawTarget = ctx;
    lv.gens.forEach((g) => {
      if (!tileVis(g.x + 0.5, g.y + 0.5) && !tileSeen(g.x + 0.5, g.y + 0.5)) return;
      const pulse = 0.78 + 0.22 * Math.sin((G.t + g.x) * 7);
      ctx.globalAlpha = tileVis(g.x + 0.5, g.y + 0.5) ? pulse : 0.28;
      drawSpr("gen_" + g.kind + "_" + g.rank, g.x * TILE + TILE / 2 - 16 - cam.x, g.y * TILE + TILE / 2 - 16 - cam.y);
      ctx.globalAlpha = 1;
    });
    lv.items.forEach((it) => {
      const ipx = it.x * TILE - cam.x, ipy = it.y * TILE - cam.y;
      if (ipx < -48 || ipy < -48 || ipx > w + 48 || ipy > h + 48) return;
      if (!tileVis(it.x + 0.5, it.y + 0.5) && !tileSeen(it.x + 0.5, it.y + 0.5)) return;
      if (it.hidden) {
        const near = live.some((p) => Math.hypot(p.x - (it.x + 0.5), p.y - (it.y + 0.5)) < 0.85);
        if (!near) return;
      }
      const prevA = ctx.globalAlpha;
      if (!tileVis(it.x + 0.5, it.y + 0.5)) ctx.globalAlpha = 0.4;
      drawItem(it);
      ctx.globalAlpha = prevA;
    });
    lv.foes.forEach((f) => {
      const fpx = f.x * TILE - cam.x, fpy = f.y * TILE - cam.y;
      if (fpx < -72 || fpy < -72 || fpx > w + 72 || fpy > h + 72) return;
      if (!tileVis(f.x, f.y)) return;
      const hid = shadeHidden(f);
      const rate = f.kind === "drain" || f.kind === "wraith" || f.kind === "unnamer" ? 5 : 8;
      const fr = ((f.t * rate) | 0) % 4;
      ctx.globalAlpha = f.hurt > 0 ? 0.6 : (hid ? 0.32 : (f.stun > 0 ? 0.7 : 1));
      const boss = FOE[f.kind] && FOE[f.kind].boss;
      const sz = boss ? 64 : 48;
      const dx = f.x * TILE - sz / 2 - cam.x, dy = f.y * TILE - sz / 2 - cam.y;
      const sprName = "foe_" + (f.spr || f.kind) + "_" + fr;
      if (f.hurt > 0 && !(window.CryptStudio && CryptStudio.reduced)) {
        ctx.save();
        ctx.translate(Math.round(dx + sz / 2), Math.round(dy + sz / 2));
        ctx.scale(1.14, 0.86);
        drawFoeSpr(sprName, -sz / 2, -sz / 2, sz);
        ctx.restore();
      } else {
        drawFoeSpr(sprName, dx, dy, sz);
      }
      const marked = (f.mut && f.mut.length) || (f.rank >= 3 && !boss && G.mode !== "survive");
      if (marked) {
        const mx = Math.round(dx + sz / 2), my = Math.round(dy + sz * 0.86);
        ctx.save();
        ctx.globalAlpha *= 0.7;
        ctx.fillStyle = (f.mut && f.mut.length) ? "rgba(251,191,36,0.45)" : "rgba(253,224,71,0.28)";
        ctx.beginPath();
        ctx.ellipse(mx, my, sz * 0.26, sz * 0.09, 0, 0, 6.28);
        ctx.fill();
        ctx.restore();
        if (f.mut && f.mut.length) {
          const n = Math.min(3, f.mut.length);
          for (let mi = 0; mi < n; mi++) {
            ctx.fillStyle = "#fde68a";
            ctx.beginPath();
            ctx.arc(mx + (mi - (n - 1) / 2) * 5, Math.round(dy) + 4, 1.6, 0, 6.28);
            ctx.fill();
          }
        }
      }
      if (boss) {
        const bx = Math.round(f.x * TILE - 22 - cam.x), by = Math.round(dy - 7);
        ctx.fillStyle = "#111";
        ctx.fillRect(bx, by, 44, 5);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(bx, by, 44 * Math.max(0, f.hp / f.max), 5);
        ctx.strokeStyle = "#fbbf24";
        ctx.strokeRect(bx, by, 44, 5);
      }
      ctx.globalAlpha = 1;
    });
    G.shots.forEach((s) => drawShot(s));
    G.fx.forEach((f) => drawVfx(f));
    G.players.forEach((p) => {
      if (p.dead) return;
      ctx.globalAlpha = (p.sleepT || 0) > 0 ? 0.38 : (p.veil > 0 ? 0.45 : 1);
      if (p.reflect > 0) {
        ctx.strokeStyle = "#93c5fd";
        ctx.beginPath();
        ctx.arc(p.x * TILE - cam.x, p.y * TILE - cam.y, 16, 0, 6.28);
        ctx.stroke();
      }
      drawHeroSpr(p, cam.x, cam.y);
      if (p.aegis > 0) {
        ctx.strokeStyle = "rgba(34,211,238,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x * TILE - cam.x, p.y * TILE - cam.y, 20, 0, 6.28);
        ctx.stroke();
      }
      if (p.fury > 0) {
        ctx.strokeStyle = "rgba(239,68,68,0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x * TILE - cam.x, p.y * TILE - cam.y, 17, G.t * 6, G.t * 6 + 4.2);
        ctx.stroke();
      }
      if (p.thorns > 0) {
        ctx.strokeStyle = "rgba(74,222,128,0.5)";
        ctx.beginPath();
        ctx.arc(p.x * TILE - cam.x, p.y * TILE - cam.y, 15, -G.t * 5, -G.t * 5 + 3.5);
        ctx.stroke();
      }
      if (p.regen > 0 && ((G.t * 8) | 0) % 2) {
        ctx.fillStyle = "rgba(74,222,128,0.45)";
        ctx.beginPath();
        ctx.arc(p.x * TILE - cam.x, p.y * TILE - 18 - cam.y, 3, 0, 6.28);
        ctx.fill();
      }
      const lvA = wepLv(p, "aura");
      if (lvA) {
        const rad = (1.18 + lvA * 0.2) * TILE;
        ctx.strokeStyle = "rgba(74,222,128," + (0.3 + 0.14 * Math.sin(G.t * 6)) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x * TILE - cam.x, p.y * TILE - cam.y, rad, 0, 6.28);
        ctx.stroke();
      }
      if (p.orbit) {
        p.orbit.forEach((o) => {
          const ox = p.x + Math.cos(o.ang) * o.r, oy = p.y + Math.sin(o.ang) * o.r;
          const sx = ox * TILE - cam.x, sy = oy * TILE - cam.y;
          ctx.fillStyle = "#e2e8f0";
          ctx.beginPath();
          ctx.arc(sx, sy, 5, 0, 6.28);
          ctx.fill();
          ctx.strokeStyle = "#f87171";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx - 8, sy);
          ctx.lineTo(sx + 8, sy);
          ctx.stroke();
        });
      }
      if (p.halo) {
        p.halo.forEach((h) => {
          const hx = p.x + Math.cos(h.ang) * h.r, hy = p.y + Math.sin(h.ang) * h.r;
          const sx = hx * TILE - cam.x, sy = hy * TILE - cam.y;
          ctx.fillStyle = "rgba(253,224,71,0.28)";
          ctx.beginPath();
          ctx.arc(sx, sy, 12, 0, 6.28);
          ctx.fill();
          drawFxSpr("bolt_halo_" + ((G.t * 10 | 0) % 4), sx - 14, sy - 14, 28);
        });
      }
      if ((p.sleepT || 0) > 0) {
        ctx.fillStyle = "#fde68a";
        ctx.globalAlpha = 0.8;
        ctx.font = "12px sans-serif";
        ctx.fillText("z", p.x * TILE + 6 - cam.x, p.y * TILE - 18 - cam.y - Math.sin(G.t * 4) * 3);
      }
      ctx.globalAlpha = 1;
    });
    (G.pools || []).forEach(function (pool) {
      const px = pool.x * TILE - cam.x, py = pool.y * TILE - cam.y;
      ctx.fillStyle = "rgba(74,222,128," + (0.18 + 0.12 * Math.sin(G.t * 6)) + ")";
      ctx.beginPath();
      ctx.ellipse(px, py + 4, pool.r * TILE, pool.r * TILE * 0.45, 0, 0, 6.28);
      ctx.fill();
    });
    (G.pets || []).forEach(function (pet) {
      const spec = PETS[pet.kind];
      if (!spec) return;
      if (!tileVis(pet.x, pet.y)) return;
      const sz = pet.kind === "elephant" ? 54 : (pet.kind === "bear" ? 50 : 44);
      const dx = pet.x * TILE - sz / 2 - cam.x, dy = pet.y * TILE - sz / 2 - cam.y;
      const fr = (pet.atk || 0) > 0 ? 2 : [0, 1, 3][(pet.walk | 0) % 3];
      ctx.globalAlpha = (pet.sleepT || 0) > 0 ? 0.36 : ((pet.hurtT || 0) > 0 ? 0.62 : 1);
      drawPetSpr(pet.kind, fr, dx, dy, sz, pet.facing === 1);
      if ((pet.sleepT || 0) > 0) {
        ctx.fillStyle = "#fde68a";
        ctx.globalAlpha = 0.85;
        ctx.font = "11px sans-serif";
        ctx.fillText("z", pet.x * TILE + 8 - cam.x, pet.y * TILE - 16 - cam.y);
      } else {
        const bx = Math.round(pet.x * TILE - 14 - cam.x), by = Math.round(dy - 5);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#111";
        ctx.fillRect(bx, by, 28, 3);
        ctx.fillStyle = spec.col;
        ctx.fillRect(bx, by, 28 * Math.max(0, pet.hp / pet.max), 3);
      }
      ctx.globalAlpha = 1;
    });
    drawCompass(ctx, w, h);
    $("announce").textContent = announce.life > 0 ? announce.t : "";
    if (window.CryptStudio) {
      CryptStudio.fps.draws = (x1 - x0) * (y1 - y0) + lv.foes.length + G.shots.length + lv.items.length;
      const fxC = $("cryptFx");
      if (fxC) {
        const dpr2 = dpr;
        if (fxC.width !== (w * dpr2 | 0) || fxC.height !== (h * dpr2 | 0)) {
          fxC.width = w * dpr2 | 0; fxC.height = h * dpr2 | 0;
        }
        const fxCtx = fxC.getContext("2d");
        fxCtx.setTransform(dpr2, 0, 0, dpr2, 0, 0);
        fxCtx.clearRect(0, 0, w, h);
        drawLights(fxCtx, w, h);
        drawDangerEdge(fxCtx, w, h);
        CryptStudio.juiceDraw(fxCtx, cam, TILE, w, h);
        CryptStudio.fpsDraw(fxCtx, w);
      } else {
        drawLights(ctx, w, h);
        drawDangerEdge(ctx, w, h);
        CryptStudio.juiceDraw(ctx, cam, TILE, w, h);
        CryptStudio.fpsDraw(ctx, w);
      }
    }
    drawMap();
  }

  function buffs(p) {
    let s = "";
    if (p.shotBoost > 0) s += " · COD";
    if (p.swift > 0) s += " · SWT";
    if (p.aegis > 0) s += " · AEG";
    if (p.veil > 0) s += " · VEIL";
    if (p.reflect > 0) s += " · REF";
    if (p.fury > 0) s += " · FURY";
    if (p.thorns > 0) s += " · THORN";
    if (p.echo > 0) s += " · ECHO";
    if (p.regen > 0) s += " · MEND";
    return s;
  }

  function paintHud() {
    if (!G) return;
    const autoOn = persist.autoShot || G.surviveAuto;
    $("hudMeta").innerHTML = "<span>Score <b>" + G.score + "</b></span><span>" +
      (G.mode === "survive" ? "Survive <b>W" + surviveWave() + "</b> · lv " + G.lvl : ((G.mode === "campaign" ? "Campaign" : "Endless") + " <b>" + (G.floor + 1) + (G.mode === "campaign" && window.LatticeCampaign ? "/" + window.LatticeCampaign.LEN : "") + "</b>")) +
      "</span><span>Credits <b>" + G.credits + "</b></span>" + streakHtml();
    if (G.mode !== "survive") {
      $("pips").innerHTML = G.players.map((p) =>
        "<div class='pip'><div class='nm' style='color:" + p.hero.color + "'>" + p.hero.name + (p.ai ? " · AI" : "") + " · " + (p.hero.special || p.hero.tag) + ((p.sleepT || 0) > 0 ? " · SLEEP" : "") + (p.dead ? " · DOWN" : "") + "</div>" +
        "<div class='bar'><i style='width:" + Math.max(0, Math.min(100, 100 * p.hp / Math.max(1, p.max))) + "%;background:" + p.hero.color + "'></i></div>" +
        "<div class='st'>HP " + Math.max(0, p.hp | 0) + "/" + (p.max | 0) + " · " + (WEAPONS[p.weapon] ? WEAPONS[p.weapon].name : "Shard") +
        (p.cores ? " · CORE" + p.cores : "") + (p.iron ? " · IRN" + p.iron : "") +
        " · " + (p.arsenal || []).map((id) => {
          const n = (WEAPONS[id] && WEAPONS[id].name) || id;
          const lv = wepLv(p, id);
          return n.slice(0, 3) + (lv > 1 ? lv : "");
        }).join("/") +
        " · keys " + p.keys + " · vials " + p.vials + buffs(p) + "</div></div>"
      ).join("") + (G.pets || []).map(function (pet) {
        const spec = PETS[pet.kind];
        if (!spec) return "";
        return "<div class='pip'><div class='nm' style='color:" + spec.col + "'>" + spec.name + " · " + spec.tag + ((pet.sleepT || 0) > 0 ? " · SLEEP" : "") + "</div>" +
          "<div class='bar'><i style='width:" + Math.max(0, Math.min(100, 100 * pet.hp / Math.max(1, pet.max))) + "%;background:" + spec.col + "'></i></div></div>";
      }).join("");
    }
    $("dockStatus").textContent = G.players.some((p) => p.dead) ? "Space / Start — credit in" : (G.mode === "survive" ? (autoOn ? "AUTO · Tab sheet · survive" : "Fire · vial · Tab · survive") : (autoOn ? "AUTO · Tab character · exit" : "Fire · vial · Tab character · exit"));
    const autoBtn = $("btnAuto");
    if (autoBtn) autoBtn.textContent = autoOn ? "Auto shot ON" : "Auto shot";
    if ($("holeCard")) {
      const xpLine = "<p class='lore'>" + modeFloorLabel() + " · " + (G.t | 0) + "s · kills " + (G.kills || 0) +
        " · XP " + (G.xp | 0) + "/" + xpNeed(G.lvl) + "</p><div class='bar'><i style='width:" +
        Math.max(0, Math.min(100, 100 * G.xp / xpNeed(G.lvl))) + "%;background:#fbbf24'></i></div>";
      $("holeCard").innerHTML = "<p><b>" + G.level.realm.name + "</b>" + (G.level.layout ? " · " + G.level.layout : " floor " + (G.floor + 1)) + "</p>" +
        xpLine +
        (G.level.chapterTitle ? "<p class='lore'><b>" + G.level.chapterTitle + "</b>" + (G.level.chapterBook ? " · " + G.level.chapterBook : "") + "</p>" : "") +
        "<p class='lore'>" + (G.level.story || G.level.lore || ("Seed " + G.seed + " · " + (G.level.layout || "rooms"))) + (G.level.treasure > 0 ? " · rush " + G.level.treasure.toFixed(0) + "s" : "") + (G.level.seal ? " · SEAL" : "") + "</p>";
    }
    paintStudioHud();
  }
  function modeFloorLabel() {
    if (!G) return "";
    if (G.mode === "survive") return "SURVIVE · WAVE " + surviveWave();
    if (G.mode === "campaign") return "CAMPAIGN · " + (G.floor + 1) + "/" + (window.LatticeCampaign ? window.LatticeCampaign.LEN : 24);
    return "ENDLESS · FLOOR " + (G.floor + 1);
  }
  /* Authored floors carry an `exit` point; generated floors only paint the tile. Resolve
     the door from either, so nothing in the HUD can depend on which builder made the map. */
  function levelExit(lv) {
    if (!lv) return null;
    if (lv.exit) return lv.exit;
    if (lv._exitTile) return lv._exitTile;
    for (let y = 0; y < (lv.H || 0); y++) {
      const row = lv.tiles[y];
      if (!row) continue;
      for (let x = 0; x < (lv.W || 0); x++) {
        const t = row[x];
        if (t === "exit" || t === "exit_lock") return { x, y };
      }
    }
    return null;
  }
  /* One objective line for every mode, read off the live level rather than a slogan. */
  function objectiveText() {
    const lv = G.level;
    if (!lv) return "";
    const gens = lv.gens ? lv.gens.length : 0;
    if (G.mode === "survive") return "next wave " + Math.max(0, 28 - (G.t % 28)).toFixed(0) + "s";
    if (lv.seal) return gens > 0 ? gens + " nexus" + (gens === 1 ? "" : "es") + " hold the seal" : "seal cracked — take the exit";
    const ex = levelExit(lv);
    const p0 = G.players[0];
    if (ex && p0) {
      const d = Math.abs(p0.x - ex.x) + Math.abs(p0.y - ex.y);
      return "exit " + Math.round(d) + " tiles" + (gens ? " · " + gens + " nexus" + (gens === 1 ? "" : "es") + " awake" : "");
    }
    return "reach the exit";
  }
  function paintStudioHud() {
    const w = surviveWave();
    const need = xpNeed(G.lvl);
    const t = G.t | 0;
    const mm = (t / 60) | 0, ss = t % 60;
    const waveLeft = Math.max(0, WAVE.sec - ((G.t || 0) % WAVE.sec));
    if ($("hudWaveLab")) $("hudWaveLab").textContent = G.mode === "survive" ? "WAVE" : "FLOOR";
    if ($("hudWave")) {
      $("hudWave").textContent = G.mode === "survive" ? w : (G.floor + 1);
      $("hudWave").classList.toggle("pulse", !!(G._wavePulse));
    }
    G._scoreShow = G._scoreShow == null ? G.score : G._scoreShow + (G.score - G._scoreShow) * 0.28;
    if (Math.abs(G.score - G._scoreShow) < 1) G._scoreShow = G.score;
    if ($("hudScore")) $("hudScore").textContent = G._scoreShow | 0;
    const boss = G.level.foes.find((f) => f.boss && f.hp > 0);
    const bh = $("bossHud");
    if (bh) {
      bh.classList.toggle("hidden", !boss);
      if (boss) {
        if ($("bossName")) $("bossName").textContent = (BOSS_NAME[boss.kind] || "Named guardian") + (boss.super ? " · SUPER" : "") + (boss.phase >= 2 ? " · II" : "");
        if ($("bossHpFill")) $("bossHpFill").style.width = Math.max(0, Math.min(100, 100 * boss.hp / Math.max(1, boss.max))) + "%";
      }
    }
    if ($("hudXpFill")) $("hudXpFill").style.width = Math.max(0, Math.min(100, 100 * G.xp / need)) + "%";
    if ($("hudXpLab")) $("hudXpLab").textContent = "LV " + G.lvl + "  ·  " + Math.floor(G.xp) + "/" + need;
    if ($("hudClock")) {
      $("hudClock").textContent = mm + ":" + (ss < 10 ? "0" : "") + ss + "  ·  " +
        (G.mode === "survive" ? "next wave " + waveLeft.toFixed(0) + "s" + (waveBosses(G.t || 0) ? " · named " + (G.rosCount || 0) + "/" + waveBosses(G.t || 0) : "") : (G.mode === "endless" ? objectiveText() + " · wave " + surviveWave() : objectiveText()));
    }
    if ($("hudKills")) {
      $("hudKills").textContent = "KILLS " + (G.kills || 0) + "  ·  " +
        (G.mode === "survive" ? "HORDE " + G.level.foes.length + "/" + surviveCap(w) : "FOES " + G.level.foes.length) +
        (comboStreak() >= 4 ? "  ·  ×" + comboMult() + " STREAK" : "");
    }
    const p0 = G.players[0];
    if ($("hudPlayers")) {
      $("hudPlayers").innerHTML = G.players.map((p) => {
        const hp = Math.max(0, Math.min(100, 100 * p.hp / Math.max(1, p.max)));
        p._ghost = p._ghost == null ? hp : p._ghost + (hp - p._ghost) * 0.18;
        if (hp > p._ghost) p._ghost = hp;
        const ghost = Math.max(hp, p._ghost);
        const hpCol = hp < 25 ? "#ef4444" : (hp < 50 ? "#fbbf24" : p.hero.color);
        return "<div class='hud-ward'><div class='nm' style='color:" + p.hero.color + "'>" + p.hero.name + (p.ai ? " · AI" : "") + (p.sleepT > 0 ? " · SLEEP" : "") + (p.dead ? " · DOWN" : "") + "</div>" +
          "<div class='hud-hp'><b style='width:" + ghost + "%'></b><i style='width:" + hp + "%;background:" + hpCol + "'></i></div>" +
          "<div class='hud-meta-row'>HP " + Math.max(0, p.hp | 0) + "/" + (p.max | 0) +
          " · vials " + p.vials + " · keys " + p.keys +
          "<span class='hud-buffs'>" + buffs(p) + "</span></div></div>";
      }).join("") + (G.pets || []).map(function (pet) {
        const spec = PETS[pet.kind];
        if (!spec) return "";
        const hp = Math.max(0, Math.min(100, 100 * pet.hp / Math.max(1, pet.max)));
        return "<div class='hud-ward'><div class='nm' style='color:" + spec.col + "'>" + spec.name + ((pet.sleepT || 0) > 0 ? " · SLEEP" : " · PET") + "</div>" +
          "<div class='hud-hp'><i style='width:" + hp + "%;background:" + spec.col + "'></i></div></div>";
      }).join("");
    }
    if ($("hudArms") && p0) {
      $("hudArms").innerHTML = (p0.arsenal || []).map((id) => {
        const n = (WEAPONS[id] && WEAPONS[id].name) || id;
        const lv = wepLv(p0, id);
        return "<span class='chip'>" + n + (lv > 1 ? "<i> " + lv + "</i>" : "") + "</span>";
      }).join("");
    }
    if ($("hudStats") && p0) {
      const pills = [];
      if (p0.might) pills.push("MIGHT " + p0.might);
      if (p0.haste) pills.push("HASTE " + p0.haste);
      if (p0.iron) pills.push("IRON " + p0.iron);
      if (p0.cores) pills.push("CORE " + p0.cores);
      if (p0.stride) pills.push("STRIDE " + p0.stride);
      if (p0.pierce) pills.push("PIERCE " + p0.pierce);
      if (p0.extraCap) pills.push("VOLLEY " + p0.extraCap);
      if (p0.magnet) pills.push("PULL");
      if (p0.vialPow) pills.push("RES " + p0.vialPow);
      if (p0.leech) pills.push("LEECH " + p0.leech);
      if (p0.bounty) pills.push("TITHE " + p0.bounty);
      if (G.rosCount) pills.push("BOSSES " + G.rosCount);
      $("hudStats").innerHTML = pills.map((t) => "<span class='pill'>" + t + "</span>").join("");
    }
  }
  function paintUI() { if (G) paintHud(); }

  function showSheet(html, studio) {
    const o = $("overlay");
    o.className = "overlay" + (studio ? " studio" : "");
    o.setAttribute("role", "dialog");
    o.setAttribute("aria-modal", "true");
    o.innerHTML = studio ? html : "<div class='sheet'>" + html + "</div>";
    overlayMode = studio ? "menu" : "sheet";
  }
  function hideOverlay() {
    $("overlay").className = "overlay hidden";
    $("overlay").onclick = null;
    overlayMode = null;
  }

  function charHtml(p) {
    ensureInv(p);
    const h = p.hero;
    const wepSlots = [];
    for (let i = 0; i < INV_WEP; i++) {
      const id = p.arsenal[i];
      if (!id) wepSlots.push("<button type='button' class='eq-slot empty' disabled>—</button>");
      else {
        const lv = wepLv(p, id);
        wepSlots.push("<button type='button' class='eq-slot" + (p.weapon === id ? " on" : "") + "' data-wep='" + id + "'>" +
          WEAPONS[id].name + (lv > 1 ? " " + lv : "") + "</button>");
      }
    }
    const relicSlots = [];
    for (let i = 0; i < INV_RELIC; i++) {
      const r = p.inv.relic[i];
      relicSlots.push(r
        ? "<div class='eq-slot relic'>" + itemLabel(r.kind) + (r.qty > 1 ? " ×" + r.qty : "") + "</div>"
        : "<div class='eq-slot empty'>—</div>");
    }
    const bag = [];
    for (let i = 0; i < INV_BAG; i++) {
      const it = p.inv.bag[i];
      if (!it) bag.push("<button type='button' class='bag-cell empty' disabled></button>");
      else bag.push("<button type='button' class='bag-cell " + it.cat + "' data-bag='" + i + "'>" +
        itemLabel(it.kind).slice(0, 9) + (it.qty > 1 ? "<i>×" + it.qty + "</i>" : "") + "</button>");
    }
    const party = G.players.map(function (o, i) {
      return "<button type='button' class='btn ghost" + (o === p ? " on" : "") + "' data-who='" + i + "'" + (o.dead ? " disabled" : "") + ">" + o.hero.name + "</button>";
    }).join("");
    const shot = h.shot + (p.cores || 0) + (p.might || 0);
    return "<div class='char-sheet'>" +
      "<div class='char-hero'><img src='" + ASSET + h.file + "' alt='" + h.name + "'>" +
      "<b style='color:" + h.color + "'>" + h.name + "</b><span>" + h.tag + "</span>" +
      "<em>" + h.special + "</em><p class='lore'>" + h.spec + "</p>" +
      "<p class='char-meta'>HP " + (p.hp | 0) + "/" + (p.max | 0) + " · keys " + p.keys + " · vials " + p.vials + " · gold " + (p.inv.gold | 0) + "</p></div>" +
      "<div class='char-stats'><p class='kicker'>Stats</p><dl>" +
      "<dt>Shot</dt><dd>" + attrBar(shot, 12) + shot + "</dd>" +
      "<dt>Speed</dt><dd>" + attrBar(h.speed + (p.stride || 0), 8) + (h.speed + (p.stride || 0)) + "</dd>" +
      "<dt>Magic</dt><dd>" + attrBar(h.magic + (p.vialPow || 0), 8) + (h.magic + (p.vialPow || 0)) + "</dd>" +
      "<dt>Armor</dt><dd>" + attrBar(h.armor + (p.iron || 0), 10) + (h.armor + (p.iron || 0)) + "</dd>" +
      "<dt>Melee</dt><dd>" + attrBar(h.melee, 7) + h.melee + "</dd>" +
      "<dt>Brave</dt><dd>" + attrBar(h.brave, 100) + h.brave + "</dd>" +
      "<dt>Faith</dt><dd>" + attrBar(h.faith, 100) + h.faith + "</dd>" +
      "</dl><p class='char-pass'>" + (buffs(p) || " · no timed buffs") + "</p></div>" +
      "<div class='char-eq'><p class='kicker'>Arms " + p.arsenal.length + "/" + INV_WEP + "</p><div class='eq-grid wep'>" + wepSlots.join("") + "</div>" +
      "<p class='kicker'>Relics " + p.inv.relic.length + "/" + INV_RELIC + "</p><div class='eq-grid'>" + relicSlots.join("") + "</div>" +
      "<p class='kicker'>Spell</p><div class='eq-slot spell'><b>" + h.special + "</b><span>Vial (K) · " + h.spec + "</span></div></div>" +
      "<div class='char-bag'><p class='kicker'>Bag " + p.inv.bag.length + "/" + INV_BAG + "</p>" +
      "<p class='lore'>Bag: click to use or equip. Armed slot (not Shard): click to unequip into the bag. Extra rations stash when your well is full.</p>" +
      "<div class='bag-grid'>" + bag.join("") + "</div>" +
      "<div class='modes char-party'>" + party + "</div>" +
      "<button type='button' class='btn gold' id='charClose'>Close (Tab / Select)</button></div></div>";
  }
  function openChar(slot) {
    if (!G || G.over) return;
    if (G._ups) return;
    G._charSlot = slot != null ? slot : (G._charSlot || 0);
    if (!G.players[G._charSlot] || G.players[G._charSlot].dead) G._charSlot = G.players.findIndex(function (x) { return !x.dead; });
    if (G._charSlot < 0) G._charSlot = 0;
    const p = G.players[G._charSlot];
    if (!p) return;
    showSheet(charHtml(p));
    overlayMode = "char";
    const wrap = document.querySelector(".overlay .sheet");
    if (wrap) wrap.classList.add("char-wrap");
    $("overlay").onclick = function (e) {
      const who = e.target.closest("[data-who]");
      if (who) { e.stopPropagation(); openChar(+who.getAttribute("data-who")); return; }
      const me = G.players[G._charSlot];
      if (!me) return;
      const bag = e.target.closest("[data-bag]");
      if (bag) {
        e.stopPropagation();
        useBag(me, +bag.getAttribute("data-bag"));
        openChar(G._charSlot);
        return;
      }
      const wep = e.target.closest("[data-wep]");
      if (wep && wep.getAttribute("data-wep")) {
        e.stopPropagation();
        const id = wep.getAttribute("data-wep");
        if (me.weapon === id) unequipWep(me, id);
        else { me.weapon = id; say("Focus " + (WEAPONS[id] ? WEAPONS[id].name : id) + "."); }
        openChar(G._charSlot);
      }
    };
    const cl = $("charClose");
    if (cl) cl.onclick = function (e) { e.stopPropagation(); closeChar(); };
  }
  function closeChar() {
    const fromPause = G && G._charFrom === "pause";
    hideOverlay();
    if (fromPause && G && !G.over) {
      overlayMode = "pause";
      const pl = $("pauseLayer");
      if (pl) pl.classList.remove("hidden");
    }
    if (G) G._charFrom = null;
  }
  function toggleChar() {
    if (overlayMode === "char") { closeChar(); return; }
    if (!G || G.over || G._ups) return;
    if (overlayMode === "menu" || overlayMode === "options" || overlayMode === "sheet") return;
    if (overlayMode === "pause") {
      G._charFrom = "pause";
      const pl = $("pauseLayer");
      if (pl) pl.classList.add("hidden");
      openChar();
      return;
    }
    if (overlayMode != null) return;
    G._charFrom = "run";
    openChar();
  }
  function attrBar(n, max) {
    const v = Math.max(0, Math.min(100, 100 * n / max));
    return "<span class='stat'><i style='width:" + v + "%'></i></span>";
  }
  function heroSheet(h) {
    return "<div class='dossier' id='heroLore'><b>" + h.name + "</b> · " + h.tag + " · <em>" + h.special + "</em>" +
      "<p class='spec'>" + h.spec + "</p><p>" + h.bio + "</p>" +
      "<dl>" +
      "<dt>Shot</dt><dd>" + attrBar(h.shot, 5) + h.shot + "</dd>" +
      "<dt>Speed</dt><dd>" + attrBar(h.speed, 5) + h.speed + "</dd>" +
      "<dt>Magic</dt><dd>" + attrBar(h.magic, 5) + h.magic + "</dd>" +
      "<dt>Armor</dt><dd>" + attrBar(h.armor, 6) + h.armor + "</dd>" +
      "<dt>Melee</dt><dd>" + attrBar(h.melee, 7) + h.melee + "</dd>" +
      "<dt>Brave</dt><dd>" + attrBar(h.brave, 100) + h.brave + "</dd>" +
      "<dt>Faith</dt><dd>" + attrBar(h.faith, 100) + h.faith + "</dd>" +
      "</dl></div>";
  }
  let optionsFrom = "menu";
  function bindCode(id) {
    const map = p1Map();
    const code = id === "fire" ? map.fire[0] : (id === "mag" ? map.mag[0] : (id === "cycle" ? map.cycle[0] : map[id]));
    return String(code || "").replace("Key", "").replace("Digit", "");
  }
  function wireOptions() {
    const stop = (el, fn) => {
      if (!el) return;
      el.onclick = (e) => { e.stopPropagation(); if (fn) fn(e); };
    };
    stop($("autoBox"), () => { persist.autoShot = !!$("autoBox").checked; savePersist(); });
    stop($("autoUpBox"), () => { persist.autoUp = !!$("autoUpBox").checked; savePersist(); });
    const padSel = $("padSel");
    if (padSel) {
      padSel.value = persist.touchPad || "auto";
      padSel.onclick = (e) => e.stopPropagation();
      padSel.onchange = (e) => {
        e.stopPropagation();
        persist.touchPad = padSel.value || "auto";
        savePersist();
        syncTouchPad();
      };
    }
    stop($("redBox"), () => { if (window.CryptStudio) CryptStudio.setReduced($("redBox").checked); });
    stop($("musBox"), () => { if (window.CryptStudio) CryptStudio.setMusic($("musBox").checked); });
    const sv = $("sfxVol");
    if (sv) {
      sv.onclick = (e) => e.stopPropagation();
      sv.oninput = (e) => { e.stopPropagation(); if (window.CryptStudio) CryptStudio.setSfxVol(sv.value / 100); };
    }
    const mv = $("musVol");
    if (mv) {
      mv.onclick = (e) => e.stopPropagation();
      mv.oninput = (e) => { e.stopPropagation(); if (window.CryptStudio) CryptStudio.setMusicVol(mv.value / 100); };
    }
    if (window.LatticeRadio) {
      document.querySelectorAll("[data-radio-vol]").forEach(LatticeRadio.bindVol);
    }
    document.querySelectorAll("[data-bind]").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        bindWait = btn.getAttribute("data-bind");
        btn.textContent = btn.getAttribute("data-bind") + ": …";
      };
    });
    const cb = $("cbSel");
    if (cb) {
      cb.onclick = (e) => e.stopPropagation();
      cb.onchange = (e) => {
        e.stopPropagation();
        persist.cb = cb.value || "";
        if (persist.cb) document.documentElement.setAttribute("data-cb", persist.cb);
        else document.documentElement.removeAttribute("data-cb");
        savePersist();
      };
      if (persist.cb) cb.value = persist.cb;
    }
    stop($("optFull"), () => toggleFull());
    stop($("optMute"), () => {
      if (!window.CryptStudio) return;
      CryptStudio.setMute(!CryptStudio.muted);
      $("optMute").textContent = CryptStudio.muted ? "Unmute SFX" : "Mute SFX";
    });
    const back = $("optBack");
    if (back) back.onclick = (e) => { e.stopPropagation(); closeOptions(); };
  }
  function optionsHtml() {
    const radioV = window.LatticeRadio ? Math.round(LatticeRadio.vol() * 100) : 55;
    return "<div class='options-screen'>" +
      "<p class='kicker'>Δ9Φ963</p><h2>Options</h2>" +
      "<p class='lore'>Play, audio, display, and P1 keys. Radio volume lives here and on the dock.</p>" +
      "<p class='kicker'>Play</p>" +
      "<label class='auto-lab'><input type='checkbox' id='autoBox'" + (persist.autoShot ? " checked" : "") + "> Auto-shoot — always fire</label>" +
      "<label class='auto-lab'><input type='checkbox' id='autoUpBox'" + (persist.autoUp ? " checked" : "") + "> Auto-pick upgrades — Survival cards take themselves</label>" +
      "<label class='auto-lab'>On-screen pad <select id='padSel'><option value='auto'>auto</option><option value='on'>always</option><option value='off'>off</option></select></label>" +
      "<p class='kicker'>Audio</p>" +
      "<label class='auto-lab'><input type='checkbox' id='musBox'" + (window.CryptStudio && CryptStudio.music === false ? "" : " checked") + "> Synth bed (in-run only)</label>" +
      "<label class='auto-lab'>SFX <input type='range' id='sfxVol' min='0' max='100' value='" + Math.round((window.CryptStudio ? CryptStudio.sfxVol : 1) * 100) + "'></label>" +
      "<label class='auto-lab'>Bed <input type='range' id='musVol' min='0' max='100' value='" + Math.round((window.CryptStudio ? CryptStudio.musicVol : 1) * 100) + "'></label>" +
      "<label class='auto-lab'>Radio <input type='range' data-radio-vol min='0' max='100' value='" + radioV + "'></label>" +
      "<div class='modes' style='margin:.35rem 0 .6rem'><button type='button' class='btn' id='optMute'>" + (window.CryptStudio && CryptStudio.muted ? "Unmute SFX" : "Mute SFX") + "</button></div>" +
      "<p class='kicker'>Display</p>" +
      "<label class='auto-lab'><input type='checkbox' id='redBox'" + (window.CryptStudio && CryptStudio.reduced ? " checked" : "") + "> Reduced motion</label>" +
      "<label class='auto-lab'>Color <select id='cbSel'><option value=''>default</option><option value='deut'>deuteranopia</option><option value='prot'>protanopia</option><option value='trit'>tritanopia</option></select></label>" +
      "<div class='modes' style='margin:.35rem 0 .6rem'><button type='button' class='btn' id='optFull'>Fullscreen</button></div>" +
      "<p class='kicker'>P1 keys — click then press</p>" +
      "<div class='bind-row'>" +
      ["up","down","left","right","fire","mag","cycle"].map(function (id) {
        return "<button type='button' class='btn ghost bind-btn' data-bind='" + id + "' aria-label='Rebind " + id + "'>" + id + ": " + bindCode(id) + "</button>";
      }).join("") + "</div>" +
      "<div class='modes'><button type='button' class='btn gold' id='optBack'>Back</button></div></div>";
  }
  function options(from) {
    optionsFrom = from || (G && !G.over && overlayMode !== "menu" ? "pause" : "menu");
    const pl = $("pauseLayer");
    if (pl) pl.classList.add("hidden");
    showSheet(optionsHtml(), true);
    overlayMode = "options";
    $("overlay").onclick = function (e) { e.stopPropagation(); };
    wireOptions();
  }
  function closeOptions() {
    if (optionsFrom === "pause" && G && !G.over) {
      hideOverlay();
      overlayMode = "pause";
      const pl = $("pauseLayer");
      if (pl) pl.classList.remove("hidden");
      return;
    }
    menu();
  }
  /* Every job is open from the first run: the roster is a choice, not a ladder. The `unlock`
     numbers survive in HEROES as lore only, so a later season can gate what it likes. */
  function heroOpen() { return true; }
  function bondPickHtml() {
    let h = "<p class='kicker' style='margin-top:.55rem'>AI companion — any job, follows you</p><div class='cast-grid bond'>";
    h += "<button type='button' class='cast" + (!persist.comp ? " on" : "") + "' data-comp=''><b>None</b><span>Solo</span></button>";
    HEROES.forEach(function (x) {
      if (!heroOpen(x)) return;
      h += "<button type='button' class='cast" + (persist.comp === x.id ? " on" : "") + "' data-comp='" + x.id + "'>" +
        "<span class='cast-art'><img src='" + ASSET + x.file + "' alt=''></span><b>" + x.name + "</b><span>AI follow</span></button>";
    });
    h += "</div><p class='kicker'>Mythic pet — sleeps 60s if downed</p><div class='cast-grid bond pets'>";
    h += "<button type='button' class='cast" + (!persist.pet ? " on" : "") + "' data-pet=''><b>None</b><span>No pet</span></button>";
    Object.keys(PETS).forEach(function (id) {
      const d = PETS[id];
      h += "<button type='button' class='cast" + (persist.pet === id ? " on" : "") + "' data-pet='" + id + "'>" +
        "<span class='cast-art pet-art'><img src='./assets/pets/64/pet_" + id + "_0.png' alt=''></span><b>" + d.name + "</b><span>" + d.tag + "</span></button>";
    });
    return h + "</div>";
  }
  function riteHtml() {
    const seals = persist.seals || 0;
    let h = "<p class='kicker' style='margin-top:.55rem'>Accord rite — one blessing (" + seals + " seals)</p><div class='cast-grid rites'>";
    RITES.forEach(function (r) {
      const owned = riteOwned(r);
      const on = (persist.rite || "") === r.id;
      h += "<button type='button' class='cast rite" + (on ? " on" : "") + (owned ? "" : " locked") + "' data-rite='" + r.id + "' data-own='" + (owned ? "1" : "0") + "'>" +
        "<b>" + r.name + "</b><span>" + (r.need ? (r.need + " seals") : "free") + "</span><span class='spec-tag'>" + r.line + "</span></button>";
    });
    return h + "</div>";
  }
  /* ---- supporter gate ----------------------------------------------------------------
     The shared gate (games/lygo-gate.js) is loaded with `defer`, so window.LYGO_GATE may
     not exist yet when this script runs — gateHold retries until it shows up. Two things
     the gate cannot know on its own: a donation reminder must never land on a live board,
     and a player who has just come out of a run should get a beat before the next one.
     So every run holds the reminder (frame of the board) and every way out of a run
     releases it with a two-minute quiet window. nextFloor() deliberately touches neither:
     the next floor is the same run. */
  let gateBusy = false;   // a run is on the board
  function gate() { return window.LYGO_GATE || null; }
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
  /* Release the hold if a run put one up. Idempotent and independent of G on purpose:
     menu() marks the run over on its way in, and the death/win sheets fire in the same
     frame as the board teardown, so an `if (G ...)` guard here is exactly the bug that
     leaves the reminder held forever. */
  function gateRest() {
    if (!gateBusy) return;
    gateBusy = false;
    gateHold(false, 2 * 60 * 1000);
  }
  function menu() {
    gateRest();
    if (G) { G.over = true; cleanupGameState(); }
    overlayMode = "menu";
    const pl = $("pauseLayer"); if (pl) pl.classList.add("hidden");
    if (window.CryptStudio && CryptStudio.stopBed) CryptStudio.stopBed();
    if (window.LatticeRadio) LatticeRadio.play();
    $("app").classList.add("hidden");
    const taleEl = $("tale");
    if (taleEl) taleEl.classList.add("hidden");
    document.body.classList.remove("tale-on");
    $("app").classList.remove("survive-mode");
    $("app").classList.remove("hud-all");
    const sh = $("studioHud");
    if (sh) sh.classList.add("hidden");
    showSheet(
      "<div class='title-screen'><div class='title-art'><img src='./assets/menu.jpg' alt='Lattice Crypt'><div class='title-art-fade'></div></div>" +
      "<div class='title-panel'><p class='kicker'>Δ9Φ963 · Excavationpro</p><h1>LATTICE CRYPT</h1>" +
      "<p class='ctrl-hint'><b>WASD</b> move · <b>J</b> fire · <b>K</b> vial · pick a door</p>" +
      "<p class='lore'>The crypt is a lock. Four wardens are the teeth. The Architect remembers why it was cut. Smash nexuses. Don't shoot the flask.</p>" +
      "<label>Callsign</label><input class='name' id='nm' maxlength='18' value='" + String(persist.name).replace(/[<>]/g, "") + "'>" +
      "<p class='kicker' style='margin-top:.7rem'>Roster — jobs of the Accord</p><div class='cast-grid roster'>" +
      HEROES.map((x) => {
        const open = heroOpen(x);
        return "<button type='button' class='cast" + (x.id === persist.hero ? " on" : "") + (open ? "" : " locked") + "' data-h='" + x.id + "' data-open='" + (open ? "1" : "0") + "'>" +
          "<span class='cast-art'><img src='" + ASSET + x.file + "' alt='" + x.name + "'></span><b>" + x.name + "</b><span>" + x.tag + "</span><span class='spec-tag'>" + x.special + "</span>" + (open ? "" : "<i>Seal " + x.unlock + "</i>") + "</button>";
      }).join("") +
      "</div>" + heroSheet(heroOf(persist.hero)) + bondPickHtml() + riteHtml() +
      "<div class='mode-grid'>" +
      "<button type='button' class='mode-card' data-go='campaign'><b>Campaign</b><span>First Descent. 24 authored floors, eight seals, rising heat.</span></button>" +
      "<button type='button' class='mode-card' data-go='endless'><b>Endless</b><span>No last floor. Rank climbs. The hall wants score.</span></button>" +
      "<button type='button' class='mode-card' data-go='survive'><b>Survival</b><span>A continent of stone. Start small — the lattice grows with you. Stack arms or drown.</span></button>" +
      "<button type='button' class='mode-card' data-go='coop'><b>Cabinet co-op</b><span>Campaign with a second warden. Pads and keyboards, up to four.</span></button>" +
      "<button type='button' class='mode-card' data-go='tale'><b>Complete</b><span>A living realm. Company of wardens, no classes, stance battles, towns that war and ally.</span></button>" +
      "</div><div class='modes' style='margin-top:.6rem'><button class='btn gold' id='menuOpt'>Options</button>" +
      "<button class='btn' id='menuRadio'>Radio</button></div>" +
      "<div class='donate-row'><a class='donate-paypal' href='https://www.paypal.com/paypalme/ExcavationPro' target='_blank' rel='noopener'>PayPal.me/ExcavationPro</a>" +
      "<a class='donate-patreon' href='https://www.patreon.com/Excavationpro/posts/chatagent-ca-api-170485961' target='_blank' rel='noopener'>Patreon</a></div>" +
      "<p class='lore' style='margin-top:.6rem'>Best " + persist.best + " · Survive " + (persist.surviveBest || 0) + " · Descent " + (persist.campaignBest || 0) + " · Runs " + persist.runs + " · Seals " + (persist.seals || 0) + " · <a href='./ledger.html'>Live hall</a> · <a href='/games/'>Hub</a></p>" +
      "<p class='hall-peek' id='hallPeek'>Hall loading…</p></div></div>",
      true
    );
    $("overlay").onclick = function (e) {
      if (window.LatticeRadio && !LatticeRadio.playing()) LatticeRadio.play();
      const c = e.target.closest("[data-h]");
      if (c) {
        if (c.getAttribute("data-open") === "0") return;
        persist.hero = c.getAttribute("data-h"); savePersist();
        document.querySelectorAll(".cast[data-h]").forEach((el) => el.classList.toggle("on", el.getAttribute("data-h") === persist.hero));
        const lore = $("heroLore");
        if (lore) lore.outerHTML = heroSheet(heroOf(persist.hero));
        return;
      }
      const cp = e.target.closest("[data-comp]");
      if (cp) {
        persist.comp = cp.getAttribute("data-comp") || "";
        savePersist();
        document.querySelectorAll("[data-comp]").forEach(function (el) {
          el.classList.toggle("on", (el.getAttribute("data-comp") || "") === persist.comp);
        });
        return;
      }
      const rt = e.target.closest("[data-rite]");
      if (rt) {
        if (rt.getAttribute("data-own") !== "1") return;
        persist.rite = rt.getAttribute("data-rite") || "";
        savePersist();
        document.querySelectorAll("[data-rite]").forEach(function (el) {
          el.classList.toggle("on", (el.getAttribute("data-rite") || "") === (persist.rite || ""));
        });
        return;
      }
      const pt = e.target.closest("[data-pet]");
      if (pt) {
        persist.pet = pt.getAttribute("data-pet") || "";
        savePersist();
        document.querySelectorAll("[data-pet]").forEach(function (el) {
          el.classList.toggle("on", (el.getAttribute("data-pet") || "") === persist.pet);
        });
        return;
      }
      const b = e.target.closest("[data-go]");
      if (!b) return;
      persist.name = ($("nm").value || "Warden").slice(0, 18);
      savePersist();
      const go = b.getAttribute("data-go");
      if (go === "tale") {
        if (window.LatticeTale) LatticeTale.open();
        return;
      }
      newRun({ hero: persist.hero, mode: go === "survive" ? "survive" : (go === "endless" ? "endless" : "campaign"), coop: go === "coop" });
    };
    const mo = $("menuOpt");
    if (mo) mo.onclick = (e) => { e.stopPropagation(); options("menu"); };
    const mr = $("menuRadio");
    if (mr) mr.onclick = (e) => { e.stopPropagation(); if (window.LatticeRadio) LatticeRadio.play(); };
    paintHallPeek();
  }
  function paintHallPeek() {
    const el = $("hallPeek");
    if (!el) return;
    const feeds = [
      "https://deepseekoracle-lattice-marines-ledger.hf.space/crypt/ledger.json",
      "https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins/resolve/main/arcade.json"
    ];
    (async function () {
      let rows = [];
      try {
        const q = JSON.parse(localStorage.getItem("lygo-lattice-crypt-ledger-q") || "[]");
        rows = rows.concat(q);
      } catch (e) {}
      for (let i = 0; i < feeds.length; i++) {
        try {
          const r = await fetch(feeds[i], { cache: "no-store" });
          if (!r.ok) continue;
          const data = await r.json();
          const list = data.rounds || data.runs || (data.books && data.books["lattice-crypt"] && (data.books["lattice-crypt"].rows || data.books["lattice-crypt"].runs)) || (Array.isArray(data) ? data : []);
          if (list && list.length) { rows = rows.concat(list); break; }
        } catch (e) {}
      }
      rows.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
      const top = rows.slice(0, 3);
      el.innerHTML = top.length
        ? ("LIVE HALL · " + top.map(function (r, i) { return (i + 1) + ". " + String(r.name || "Warden").replace(/[<>]/g, "") + " " + (r.score || 0); }).join(" · "))
        : "LIVE HALL · empty (honest). Finish a floor or wave to inscribe.";
    })();
  }

  function help() {
    showSheet("<h2>How to play</h2><ol class='lore'>" +
      "<li>Health ticks down. Smash <b>nexuses</b> or the floor fills. Find the cyan exit. The crypt is dark — lanterns push the fog.</li>" +
      "<li>P1 WASD · <b>J fire</b> · K/Shift vial. P2 arrows · ; fire · ' vial. P3 TFGH · R/Y. P4 numpad.</li>" +
      "<li>Pads: stick, A/RT fire, B/Y/LT vial, Start join, Select/Back/View character sheet. Survival upgrades: D-pad / stick to choose, A to take (1–3 or Enter on keyboard). Space / Enter credit a fallen warden.</li>" +
      "<li>Keys open doors. Don't shoot flasks. Vials clear a room — only they stop the Drain.</li>" +
      "<li>Campaign is 24 hand-built floors. Seals hide the exit until nexuses die. Endless never stops. Survival is a vast crypt (256×224): fog-band hordes that grow with your level, stacking upgrades, bosses every five waves, hall score.</li>" +
      "<li>Every armed weapon fires at once and can stack. Q only changes focus. Cleave / Orbit / Aura are short-range auto melee. Relics bob and glow — rations, coins, fury, moss, bombs, tomes, and more. Chests can spill rare arms.</li>" +
      "<li>Each job has a named special on vial (K). Super bosses drop rare–legendary arms. Brave scales bump damage. Faith scales vial power.</li>" +
      "<li>Title: pick an <b>AI companion</b> (unlocked job follows and auto-fires) and a <b>mythic pet</b> (Ashmane dash-bite, Solstride jump-roar-claw, Ironhide swipe-maul, Tuskward stomp, Glassbarb clamp-tail poison). Pets draw no agro and sleep 20s if downed. AI helpers sleep if they fall — they do not end the run.</li>" +
      "<li><b>Complete</b> is the living realm. Build a company of up to four wardens, any skills, any look. The map has day, night, seasons, weather, towns, ruins, obelisks, Evil Centers, and caves that do not end. Battles are turn-based: Strike beats Weave, Weave beats Ward, Ward beats Strike.</li>" +
      "<li><b>C</b> or pad <b>RB</b> sidesteps. A short dash shoves whoever you clip. It does not grant immunity. Phones get a stick, Fire, Vial, Dash, and Map. Options can force the pad on or off.</li>" +
      "<li><b>Accord rites</b> on the title spend nothing: seals from a closed run unlock one blessing (Swift, a deeper well, a vial, pierce, lantern, or a score tithe). One rite at the door.</li>" +
      "<li><b>Tab</b> or pad <b>Select / Back / View</b> — character sheet (model, stats, arms, spell, bag). Click bag to use/equip. Auto-shoot (Options or L). Options: auto-pick Survival upgrades. <b>P</b> pause. <b>F3</b> FPS. <b>N</b> map (radar / full / off). <b>M</b> mute. <b>F11</b> fullscreen.</li>" +
      "<li><b>Streak</b> — chained kills raise a score multiplier up to ×5; it breaks after three seconds with no kill. The map (N) paints only stone you have walked: nexuses, doors, gates, chests, and named bosses. Edge arrows point to the nearest known nexus, the exit, and any boss you have seen.</li></ol>" +
      "<button class='btn gold' id='hk'>Close</button>");
    $("hk").onclick = () => { hideOverlay(); overlayMode = null; };
  }

  const STEP = (window.CryptStudio && CryptStudio.STEP) || (1 / 60);
  let last = performance.now();
  let acc = 0;
  function loop(now) {
    syncTouchPad();
    const raw = Math.min(0.08, (now - last) / 1000);
    last = now;
    if (window.CryptStudio) CryptStudio.fpsTick(raw);
    const paused = overlayMode === "pause";
    const blocked = overlayMode === "menu" || overlayMode === "sheet" || overlayMode === "options" || overlayMode === "char" || paused;
    if (!paused && window.CryptStudio) CryptStudio.juiceTick(raw);
    if (G && G._ups) pollUpgradePick();
    pollSelectChar();
    if (G && G._upTaken > 0) {
      G._upTaken -= raw;
      if (G._upTaken <= 0) {
        G._upTaken = 0;
        hideOverlay();
        overlayMode = null;
        $("overlay").onclick = null;
        if (G._upPending) { G._upPending = false; offerSurviveUp(); }
      }
    }
    if (!blocked && G && !G.over) {
      acc += raw;
      let n = 0;
      while (acc >= STEP && n < 3) {
        const frozen = window.CryptStudio && CryptStudio.juice.hitstop > 0;
        if (!frozen) update(STEP);
        acc -= STEP;
        n++;
      }
      if (acc > STEP * 4) acc = 0;
    } else acc = 0;
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    if (bindWait) {
      e.preventDefault();
      if (e.code !== "Escape") {
        persist.binds = persist.binds || {};
        persist.binds[bindWait] = e.code;
        savePersist();
      }
      const btn = document.querySelector("[data-bind='" + bindWait + "']");
      if (btn) btn.textContent = bindWait + ": " + (e.code === "Escape" ? "—" : e.code.replace("Key", "").replace("Digit", ""));
      bindWait = null;
      return;
    }
    if (!keys[e.code]) keyEdge[e.code] = true;
    keys[e.code] = true;
    if (document.body.classList.contains("tale-on")) {
      if (e.code === "Escape" && keyEdge.Escape && window.LatticeTale) LatticeTale.back();
      return;
    }
    if (e.code === "F3") {
      if (keyEdge.F3 && window.CryptStudio) CryptStudio.fps.show = !CryptStudio.fps.show;
      return;
    }
    if (e.code === "KeyN" && overlayMode !== "menu") {
      if (keyEdge.KeyN) cycleMapMode();
      return;
    }
    if (e.code === "KeyM" && overlayMode !== "menu") {
      if (keyEdge.KeyM && window.CryptStudio) {
        CryptStudio.setMute(!CryptStudio.muted);
        say(CryptStudio.muted ? "SFX mute." : "SFX on.");
      }
      return;
    }
    if (e.code === "Tab") {
      if (overlayMode === "menu" || overlayMode === "options") return;
      e.preventDefault();
      if (keyEdge.Tab) toggleChar();
      return;
    }
    if (e.code === "KeyP" && G && !G.over && overlayMode !== "menu" && overlayMode !== "options" && overlayMode !== "char" && !G._ups) {
      if (keyEdge.KeyP) togglePause();
      return;
    }
    if (e.code === "F11") {
      e.preventDefault();
      if (keyEdge.F11) toggleFull();
      return;
    }
    if (e.code === "Escape") {
      if (G && G._ups) return;
      if (!keyEdge.Escape) return;
      if (overlayMode === "options") { closeOptions(); return; }
      if (overlayMode === "char") { closeChar(); return; }
      menu();
      return;
    }
    if (overlayMode === "menu" || overlayMode === "sheet" || overlayMode === "pause" || overlayMode === "options" || overlayMode === "char") return;
    const b = persist.binds || {};
    if (PLAY_CODES.has(e.code) || b.up === e.code || b.down === e.code || b.left === e.code || b.right === e.code || b.fire === e.code || b.mag === e.code || b.cycle === e.code) e.preventDefault();
    if (e.code === "KeyL" && G && keyEdge.KeyL) {
      G.surviveAuto = false;
      persist.autoShot = !persist.autoShot; savePersist(); paintHud();
      say(persist.autoShot ? "Auto-shoot on." : "Auto-shoot off.");
      return;
    }
    if ((e.code === "Space" || e.code === "Enter") && G && keyEdge[e.code]) {
      if (e.code === "Space" && !G.players.some((p) => p.dead)) return;
      credit();
    }
  });
  window.addEventListener("keyup", (e) => { keys[e.code] = false; });
  window.addEventListener("blur", () => { keys = {}; keyEdge = {}; });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && G && !G.over && overlayMode == null) togglePause();
  });

  function togglePause() {
    if (!G || G.over) return;
    const layer = $("pauseLayer");
    if (overlayMode === "pause") {
      overlayMode = null;
      if (layer) layer.classList.add("hidden");
      return;
    }
    if (overlayMode != null) return;
    overlayMode = "pause";
    if (layer) layer.classList.remove("hidden");
    feel("pause");
  }
  function toggleFull() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
    } else if (document.exitFullscreen) document.exitFullscreen();
  }
  function toggleAuto() {
    if (G) G.surviveAuto = false;
    persist.autoShot = !persist.autoShot; savePersist();
    if (G) { paintHud(); say(persist.autoShot ? "Auto-shoot on." : "Auto-shoot off."); }
  }
  $("btnHelp").onclick = () => {
    if (G && G._ups) return;
    if (overlayMode === "pause") togglePause();
    help();
  };
  $("btnMenu").onclick = () => { if (G && G._ups) return; menu(); };
  $("btnCredit").onclick = () => { if (G) credit(); };
  if ($("btnAuto")) $("btnAuto").onclick = toggleAuto;
  if ($("btnFull")) $("btnFull").onclick = toggleFull;
  const pr = $("btnResume"); if (pr) pr.onclick = () => togglePause();
  const po = $("btnPauseOpt"); if (po) po.onclick = () => options("pause");
  const pm = $("btnPauseMenu"); if (pm) pm.onclick = () => { const l = $("pauseLayer"); if (l) l.classList.add("hidden"); menu(); };

  window.LatticeCrypt = {
    get: () => G,
    credit,
    fire: (i) => { if (G && G.players[i || 0]) fireArsenal(G.players[i || 0]); },
    nextFloor: () => { if (G) nextFloor(); },
    cleanup: cleanupGameState,
    menu: menu,
    debug: () => ({
      over: !!(G && G.over),
      mode: G && G.mode,
      foes: G && G.level ? G.level.foes.length : 0,
      shots: G ? G.shots.length : 0,
      studio: window.CryptStudio ? CryptStudio.counts() : null
    })
  };

  async function boot() {
    loadPersist();
    const bootEl = document.querySelector(".boot-msg");
    function bootSay(t) { if (bootEl) bootEl.textContent = t; }
    bootSay("Loading sprites…");
    try {
      const [img, meta] = await Promise.all([
        new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = ASSET + "sprites.png?v=9"; }),
        fetch(ASSET + "sprites.json").then((r) => r.json())
      ]);
      atlas = img; names = meta.names; cell = meta.cell; cols = meta.cols;
    } catch (_) {}
    bootSay("Loading wardens…");
    try {
      const [cimg, cmeta] = await Promise.all([
        new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = ASSET + "creatures.png?v=2"; }),
        fetch(ASSET + "creatures.json").then((r) => r.json())
      ]);
      foeAtlas = cimg; foeNames = cmeta.names; foeCell = cmeta.cell; foeCols = cmeta.cols;
    } catch (_) {}
    try {
      const [himg, hmeta] = await Promise.all([
        new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = ASSET + "heroes.png?v=1"; }),
        fetch(ASSET + "heroes.json").then((r) => r.json())
      ]);
      heroAtlas = himg; heroNames = hmeta.names; heroCell = hmeta.cell; heroCols = hmeta.cols;
    } catch (_) {}
    try {
      const [timg, tmeta] = await Promise.all([
        new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = ASSET + "tiles.png?v=2"; }),
        fetch(ASSET + "tiles.json").then((r) => r.json())
      ]);
      tileAtlas = timg; tileNames = tmeta.names; tileCell = tmeta.cell; tileCols = tmeta.cols;
    } catch (_) {}
    try {
      const [fximg, fxmeta] = await Promise.all([
        new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = ASSET + "fx.png?v=1"; }),
        fetch(ASSET + "fx.json").then((r) => r.json())
      ]);
      fxAtlas = fximg; fxNames = fxmeta.names; fxCell = fxmeta.cell; fxCols = fxmeta.cols;
    } catch (_) {}
    try {
      const [iimg, imeta] = await Promise.all([
        new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = ASSET + "items.png?v=1"; }),
        fetch(ASSET + "items.json").then((r) => r.json())
      ]);
      itemAtlas = iimg; itemNames = imeta.names; itemCell = imeta.cell; itemCols = imeta.cols;
    } catch (_) {}
    try {
      const [pimg, pmeta] = await Promise.all([
        new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = ASSET + "pets.png?v=1"; }),
        fetch(ASSET + "pets.json").then((r) => r.json())
      ]);
      petAtlas = pimg; petNames = pmeta.names; petCell = pmeta.cell; petCols = pmeta.cols;
    } catch (_) {}
    $("boot").classList.add("hidden");
    if (window.ArcadeLedger) ArcadeLedger.boot();
    menu();
    requestAnimationFrame(loop);
  }
  function bindCryptPad() {
    const stick = $("padStick");
    if (!stick) return;
    let pid = null;
    function setStick(ev) {
      const r = stick.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let x = ev.clientX - cx, y = ev.clientY - cy;
      const max = r.width * 0.36;
      const d = Math.hypot(x, y) || 1;
      const cl = Math.min(d, max);
      const knob = $("padKnob");
      if (knob) knob.style.transform = "translate(" + (x / d * cl).toFixed(1) + "px," + (y / d * cl).toFixed(1) + "px)";
      if (d < 14) { touchIn.x = 0; touchIn.y = 0; return; }
      touchIn.x = x / d;
      touchIn.y = y / d;
    }
    function clearStick() {
      pid = null;
      touchIn.x = 0; touchIn.y = 0;
      const knob = $("padKnob");
      if (knob) knob.style.transform = "translate(0,0)";
    }
    stick.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      pid = e.pointerId;
      try { stick.setPointerCapture(e.pointerId); } catch (_) {}
      setStick(e);
    });
    stick.addEventListener("pointermove", function (e) { if (pid === e.pointerId) setStick(e); });
    stick.addEventListener("pointerup", function (e) { if (pid === e.pointerId) clearStick(); });
    stick.addEventListener("pointercancel", clearStick);
    function hold(btn, down, up) {
      if (!btn) return;
      btn.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        try { btn.setPointerCapture(e.pointerId); } catch (_) {}
        down();
      });
      const end = function () { if (up) up(); };
      btn.addEventListener("pointerup", end);
      btn.addEventListener("pointercancel", end);
    }
    hold($("padFire"), function () { touchIn.fire = true; }, function () { touchIn.fire = false; });
    hold($("padVial"), function () { touchIn.mag = true; });
    hold($("padDash"), function () { touchIn.dash = true; });
    hold($("padMap"), function () { if (G && !G.over) cycleMapMode(); });
  }
  bindCryptPad();
  boot();
})();
