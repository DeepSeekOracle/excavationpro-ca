/**
 * ART-01 - the art bible as data.
 *
 * ART_BIBLE.md is the written lock; this module is the same lock in the form the build consumes.
 * A new colour, material recipe, arena light or HUD size lands here first and is copied into the
 * bible in the same change. Pure data + tiny helpers: no THREE import, no side effects.
 */

/** Core palette. Every gameplay colour derives from this table (ART_BIBLE.md section 4). */
export const PALETTE = {
  background: "#0b0d11",
  concrete: "#3a3f47",
  olive: "#4b5340",
  ui: "#ffb347",
  hostile: "#ff4d4d",
  tracerDefault: "#ffd57a",
  muzzleFlash: "#ffedb0",
  rain: "#a9dcd2",
  damageFlash: "#e5313b",
  enemyEmissive: "#3a0406",

  steel: { dark: "#121718", mid: "#262e2e", light: "#424d4d" },
  flesh: { dark: "#57432f", mid: "#81664a", light: "#a88763" },
  enemyChitin: { dark: "#3d080b", mid: "#7d1419", light: "#c02a2a" },
  foliage: { dark: "#242a22", mid: "#333a2e", light: "#4b5340" },
  groundMoss: { dark: "#252a31", mid: "#363d46", light: "#4a525d" },

  healthOk: "#7ce6a8",
  healthWarn: "#e8c25a",
  healthCrit: "#f2545b",
  hudLabel: "#9fd9c0",
  hudSecondary: "#c4d9c9",
  hudSubtitle: "#a9cdbb",
  titleText: "#dcffe9",
  deadTitle: "#ff9ca2",
  deadSub: "#e4b9bb",
  deadPrompt: "#ff8d95",
  hemisphereSky: "#8fa6c0",
  sun: "#cfe0f5",

  panels: {
    status: "rgba(3,12,9,0.62)",
    hint: "rgba(2,10,8,0.62)",
    title: "rgba(2,10,8,0.78)",
    dead: "rgba(18,3,5,0.8)",
    results: "rgba(2,10,8,0.85)",
  },
  strokes: {
    status: "rgba(110,220,175,0.35)",
    hint: "rgba(120,230,185,0.22)",
    title: "rgba(120,230,185,0.4)",
    dead: "rgba(240,90,100,0.5)",
    results: "rgba(110,220,175,0.4)",
    barBack: "rgba(0,0,0,0.6)",
  },
};

/**
 * Type scale, CSS px at 1280x720. `micro` is the hard floor; no HUD text is smaller.
 * The HUD uses the harness system sans (A190) - no font file is shipped.
 */
export const TYPE_SCALE = {
  display: 40,
  deathTitle: 36,
  h2: 32,
  h3: 24,
  numeral: 20,
  title: 18,
  body: 16,
  prompt: 15,
  subhead: 14,
  label: 13,
  small: 12,
  micro: 11,
};

/** HUD iconography. Weapon plates come from the generated sheet; status is text/bar-first. */
export const HUD_ICONOGRAPHY = {
  weapon: {
    sheet: "assets/icons/hud-weapon-icons.png",
    format: "PNG",
    size: "256x256",
    cell: 48,
    columns: 5,
    rows: 3,
    usedCells: 12,
    readPx: 48,
    hudPx: 28,
    note: "One silhouette per style; fill uses the style tracer colour from ART_BIBLE section 3.",
  },
  status: {
    health: "bar + numeral (20 px), thresholds 60 / 30",
    armour: "segmented bar, 11 px label (reserved; no glyph before M2)",
    ammo: "text MAG / HEAT (13 px), amber",
    threat: "text count (12 px), no glyph",
    beat: "text name + timer (14 px), top centre",
    airdrop: "text countdown (12 px), health-green",
    cards: "numerals 1/2/3 (13 px), no glyph",
  },
  enemy: {
    approach: "in-world silhouette (A030), 32 px read; helmet / shield / rotor cues",
  },
};

/**
 * Material recipes. Spread into `standardMaterial({ ...recipe, size })`; every field is either a
 * `materials.js` bake option or a MeshStandardMaterial option. Seeds are fixed so the bake is
 * deterministic (materials.js mulberry32).
 */
export const MATERIAL_RECIPES = {
  ground: {
    kind: "moss", seed: 17, palette: [PALETTE.groundMoss.dark, PALETTE.groundMoss.mid, PALETTE.groundMoss.light],
    repeat: 24, roughness: 0.62, metalness: 0.14,
  },
  puddle: {
    // Wet tarmac, not a hole: a mirror-ish surface picks up the environment map and reads as water.
    // The old near-black disc read as a crater punched in the deck (playtest 2026-10-30).
    kind: "metal", seed: 33, palette: ["#54657a", "#68798c", "#7d8fa2"],
    repeat: 2, roughness: 0.07, metalness: 0.92,
  },
  bark: {
    kind: "wood", seed: 999, palette: ["#3b2f24", "#5a4a3a", "#746152"],
    repeat: 2, roughness: 0.96, metalness: 0,
  },
  leaf: {
    kind: "moss", seed: 888, palette: ["#2a2f28", "#3a3f34", "#4b5042"],
    repeat: 1, roughness: 0.92, metalness: 0,
  },
  bush: {
    kind: "moss", seed: 777, palette: [PALETTE.foliage.dark, PALETTE.foliage.mid, "#444b38"],
    repeat: 1, roughness: 0.92, metalness: 0,
  },
  crate: {
    kind: "wood", seed: 555, palette: ["#3b2f24", "#5a4a3a", "#746152"],
    repeat: 1, roughness: 0.9, metalness: 0,
  },
  crateLid: {
    kind: "metal", seed: 556, palette: [PALETTE.steel.dark, PALETTE.steel.mid, PALETTE.steel.light],
    repeat: 1, roughness: 0.3, metalness: 0.8,
  },
  crateStrap: {
    kind: "cloth", seed: 557, palette: ["#2d3521", "#465234", "#5f7046"],
    repeat: 1, roughness: 0.95, metalness: 0,
  },
  parachute: {
    kind: "cloth", seed: 558, palette: [PALETTE.olive, "#5f7046", "#6c7d52"],
    repeat: 2, roughness: 0.95, metalness: 0,
  },
  playerCloth: {
    kind: "cloth", seed: 5, palette: ["#2d3521", "#465234", "#5f7046"],
    repeat: 2, roughness: 0.9, metalness: 0,
  },
  playerFlesh: {
    kind: "plaster", seed: 8, palette: [PALETTE.flesh.dark, PALETTE.flesh.mid, PALETTE.flesh.light],
    roughness: 0.82, metalness: 0,
  },
  playerSteel: {
    kind: "metal", seed: 12, palette: [PALETTE.steel.dark, PALETTE.steel.mid, PALETTE.steel.light],
    roughness: 0.38, metalness: 0.8,
  },
  enemyChitin: {
    kind: "chitin", seed: 77, palette: [PALETTE.enemyChitin.dark, PALETTE.enemyChitin.mid, PALETTE.enemyChitin.light],
    roughness: 0.55, metalness: 0.18,
  },
  floodlightHousing: {
    kind: "metal", seed: 559, palette: [PALETTE.steel.dark, PALETTE.steel.mid, PALETTE.steel.light],
    repeat: 1, roughness: 0.42, metalness: 0.7,
  },
};

/**
 * Per-arena lighting. `intensity` is the art-bible value; the renderer uses
 * `intensity * pointLightScale` for PointLights because three.js r155+ uses physical light units.
 * `ARENA_BY_BEAT` maps the eight director beats onto the three arenas.
 */
export const POINT_LIGHT_SCALE = 48;

export const ARENA_BY_BEAT = [
  "perimeter", "perimeter", "perimeter",
  "breach", "breach", "breach",
  "gunship", "gunship",
];

export const ARENA_LIGHTING = {
  perimeter: {
    id: "arena1",
    name: "Perimeter",
    // READABILITY PASS: the old values (exposure 1.28 / hemi 0.85 / fog 0.028) rendered the arena
    // as a black void on a real GPU; enemies 20 m out were invisible. These are the measured
    // replacements — see .forge/STATE.md and the playtest shots in docs/QA.
    exposure: 1.55,
    background: "#141a22",
    fog: { color: "#161d26", density: 0.015 },
    hemisphere: { sky: "#a8bed6", ground: "#262a24", intensity: 1.25 },
    sun: { color: "#dbe8fb", intensity: 2.4, position: [16, 30, 12] },
    floodlights: [
      { x: 0, z: -6, height: 8, color: "#ffe7c2", intensity: 2.1, distance: 34 },
      { x: -22, z: 14, height: 7, color: "#ffd9a0", intensity: 1.6, distance: 30 },
      { x: 22, z: 14, height: 7, color: "#ffd9a0", intensity: 1.6, distance: 30 },
    ],
    rainOpacity: 0.26,
    blackout: {
      duration: 8.0,
      sun: 0,
      hemisphere: 0,
      floodlights: 0,
      hostileEmissive: { color: "#ff4d4d", intensity: 0.9 },
      shotLight: { color: "#ffedb0", seconds: 0.2, power: 220, distance: 20 },
    },
  },
  breach: {
    id: "arena2",
    name: "Breach Yard",
    exposure: 1.52,
    background: "#1a150f",
    fog: { color: "#1d1811", density: 0.018 },
    hemisphere: { sky: "#c0ad8f", ground: "#2c241b", intensity: 1.15 },
    sun: { color: "#f2d6a8", intensity: 2.3, position: [-18, 26, -8] },
    floodlights: [
      { x: -20, z: -14, height: 7, color: "#ffd9a0", intensity: 2.0, distance: 32 },
      { x: 20, z: -14, height: 7, color: "#ffd9a0", intensity: 2.0, distance: 32 },
      { x: 0, z: 22, height: 8, color: "#ffe7c2", intensity: 1.7, distance: 34 },
    ],
    rainOpacity: 0.24,
    blackout: {
      duration: 8.0,
      sun: 0,
      hemisphere: 0,
      floodlights: 0,
      hostileEmissive: { color: "#ff4d4d", intensity: 1.0 },
      shotLight: { color: "#ffedb0", seconds: 0.2, power: 220, distance: 20 },
    },
  },
  gunship: {
    id: "arena3",
    name: "Gunship Pad",
    exposure: 1.55,
    background: "#121a26",
    fog: { color: "#141d29", density: 0.013 },
    hemisphere: { sky: "#a6bcdc", ground: "#1c222a", intensity: 1.3 },
    sun: { color: "#d6e6ff", intensity: 2.5, position: [20, 34, 0] },
    floodlights: [
      { x: 0, z: 0, height: 8, color: "#eaf3ff", intensity: 2.2, distance: 36 },
      { x: -26, z: -10, height: 6, color: "#ffd9a0", intensity: 1.5, distance: 28 },
      { x: 26, z: -10, height: 6, color: "#ffd9a0", intensity: 1.5, distance: 28 },
    ],

    rainOpacity: 0.24,
    blackout: {
      duration: 8.0,
      sun: 0,
      hemisphere: 0,
      floodlights: 0,
      hostileEmissive: { color: "#ff4d4d", intensity: 1.0 },
      shotLight: { color: "#ffedb0", seconds: 0.2, power: 220, distance: 20 },
    },
  },
};

/** Convert `#rrggbb` to the integer three.js constructors expect. */
export function hexInt(hex) {
  return Number.parseInt(String(hex).replace("#", ""), 16);
}
