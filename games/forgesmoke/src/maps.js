/**
 * FORGE SMOKE — MAPS (MAP-01/02/03/04, rebuilt 2026-10-30)
 *
 * Three themed arenas built from a layout table: ground treatment, streets/pads, buildings, street
 * furniture and a curated prop list. No random scatter and no repeated signage — one brand board
 * per map (`sign`), placed at the entrance.
 *
 * The play radius is 54 m (TUNING.player.arenaRadius). Every solid object the level kit builds
 * registers a collider, so the enemy nav grid and the player both route around it.
 *
 * `props` are the GLB props (container / barrier / watchtower / turret / milk-truck); their
 * colliders come from PROP_COLLIDERS. `level` holds everything procedural.
 */

const polar = (deg, r, extra = {}) => {
  const a = (deg * Math.PI) / 180;
  return { x: Number((Math.cos(a) * r).toFixed(2)), z: Number((Math.sin(a) * r).toFixed(2)), ...extra };
};

/**
 * @typedef {Object} MapDef
 * @property {string} id
 * @property {string} name
 * @property {string} light
 * @property {number} centerClear
 * @property {{x:number,z:number,rot?:number}} sign
 * @property {Object[]} props
 * @property {Object} level
 */

/** @type {MapDef[]} */
export const MAPS = [
  {
    id: "depot",
    name: "DEPOT",
    light: "perimeter",
    fogScale: 0.85,
    rainScale: 1.0,
    lightBoost: 1.05,
    centerClear: 13,
    sign: { x: -16, z: -30, rot: 0.5 },
    // container terminal: two container walls frame an east-west avenue, stacks close the flanks
    props: [
      // north wall (long axis along X)
      { ...polar(180, 20), kind: "container", rotY: Math.PI / 2, scale: 1.15 },
      { ...polar(157, 20), kind: "container", rotY: Math.PI / 2, scale: 1.15 },
      { ...polar(203, 20), kind: "container", rotY: Math.PI / 2, scale: 1.15 },
      { ...polar(134, 20), kind: "container", rotY: Math.PI / 2, scale: 1.15 },
      { ...polar(226, 20), kind: "container", rotY: Math.PI / 2, scale: 1.15 },
      // south wall
      { ...polar(0, 20), kind: "container", rotY: Math.PI / 2, scale: 1.15 },
      { ...polar(23, 20), kind: "container", rotY: Math.PI / 2, scale: 1.15 },
      { ...polar(-23, 20), kind: "container", rotY: Math.PI / 2, scale: 1.15 },
      { ...polar(46, 20), kind: "container", rotY: Math.PI / 2, scale: 1.15 },
      { ...polar(-46, 20), kind: "container", rotY: Math.PI / 2, scale: 1.15 },
      // flank stacks
      { ...polar(90, 30), kind: "container", rotY: 0, scale: 1.15 },
      { ...polar(72, 32), kind: "container", rotY: 0, scale: 1.15 },
      { ...polar(-90, 30), kind: "container", rotY: 0, scale: 1.15 },
      { ...polar(-72, 32), kind: "container", rotY: 0, scale: 1.15 },
      // trucks parked off the avenue
      { ...polar(-150, 28), kind: "milk-truck", rotY: 0.5 },
      { ...polar(150, 28), kind: "milk-truck", rotY: -0.5 },
      // gate checkpoint
      { ...polar(-90, 44), kind: "barrier", rotY: 0.1 },
      { ...polar(-96, 40), kind: "barrier", rotY: 0.1 },
      { ...polar(90, 44), kind: "barrier", rotY: -0.1 },
      { ...polar(96, 40), kind: "barrier", rotY: -0.1 },
      { ...polar(150, 40), kind: "watchtower", rotY: -0.6 },
      { ...polar(-150, 40), kind: "watchtower", rotY: 0.6 },
    ],
    level: {
      ground: "asphalt",
      roads: [{ x: 0, z: 0, w: 96, d: 14 }],
      pads: [{ x: 0, z: 0, w: 28, d: 24 }],
      stripes: [
        { x: -26, z: -3.2, w: 5, d: 0.28 }, { x: -14, z: -3.2, w: 5, d: 0.28 },
        { x: -2, z: -3.2, w: 5, d: 0.28 }, { x: 10, z: -3.2, w: 5, d: 0.28 },
        { x: 22, z: -3.2, w: 5, d: 0.28 }, { x: -26, z: 3.2, w: 5, d: 0.28 },
        { x: -14, z: 3.2, w: 5, d: 0.28 }, { x: -2, z: 3.2, w: 5, d: 0.28 },
        { x: 10, z: 3.2, w: 5, d: 0.28 }, { x: 22, z: 3.2, w: 5, d: 0.28 },
        { x: 0, z: 16.4, w: 30, d: 0.3 }, { x: 0, z: -16.4, w: 30, d: 0.3 },
      ],
      buildings: [
        { model: "ki/building-h", x: 0, z: 40, h: 5, rot: 0 },
        { model: "ki/building-a", x: -35, z: -34, h: 10, rot: 0.15 },
        { model: "ki/building-e", x: 35, z: 33, h: 9, rot: -0.2 },
        { model: "ki/water-tower", x: -31, z: 30, h: 18, rot: 0.4 },
        { model: "ki/chimney-large", x: 36, z: -30, h: 20, rot: 0 },
      ],
      skyline: [
        { model: "kc/low-detail-building-a", x: -78, z: -46, h: 26 }, { model: "kc/low-detail-building-b", x: -58, z: -78, h: 32 },
        { model: "kc/low-detail-building-c", x: 0, z: -92, h: 30 }, { model: "kc/low-detail-building-d", x: 56, z: -80, h: 24 },
        { model: "kc/low-detail-building-a", x: 84, z: -40, h: 28 }, { model: "kc/low-detail-building-b", x: 90, z: 12, h: 34 },
        { model: "kc/low-detail-building-c", x: 74, z: 58, h: 25 }, { model: "kc/low-detail-building-d", x: 20, z: 92, h: 30 },
        { model: "kc/low-detail-building-a", x: -40, z: 86, h: 27 }, { model: "kc/low-detail-building-b", x: -86, z: 34, h: 31 },
      ],
      streetProps: [
        { model: "kr/dumpster", x: -14, z: 15, h: 1.4 }, { model: "kr/dumpster", x: 15, z: -15, h: 1.4 },
        { model: "kr/construction-light", x: 9, z: 18, h: 2.4 },
      ],
      lamps: [{ x: -12, z: 10 }, { x: 12, z: 10 }, { x: -12, z: -10, rot: Math.PI }, { x: 12, z: -10, rot: Math.PI }],
    },
    ruins: [],
  },
  {
    id: "yard",
    name: "TOWN",
    light: "breach",
    fogScale: 0.9,
    rainScale: 0.9,
    lightBoost: 1.2,
    centerClear: 13,
    sign: { x: 0, z: -22, rot: 0 },
    // a town square: roads cross at the plaza, ten buildings ring it with 20 m+ streets between
    props: [
      // parked at the kerb, not across the north street (a truck in the middle of the road
      // dead-stopped the fighter and every walker behind it)
      { x: 9.5, z: -18, kind: "milk-truck", rotY: 0.15 },
      { ...polar(135, 22), kind: "barrier", rotY: 0.6 },
      { ...polar(-135, 22), kind: "barrier", rotY: -0.6 },
      { ...polar(45, 24), kind: "barrier", rotY: -1.2 },
      { ...polar(-45, 24), kind: "barrier", rotY: 1.2 },
      { ...polar(160, 38), kind: "container", rotY: 0.2 },
      { ...polar(-160, 38), kind: "container", rotY: -0.2 },
    ],
    level: {
      ground: "asphalt",
      roads: [{ x: 0, z: 0, w: 120, d: 12 }, { x: 0, z: 0, w: 12, d: 120 }],
      pads: [{ x: 0, z: 0, w: 30, d: 24, mat: "concrete" }],
      stripes: [
        { x: -30, z: 0, w: 6, d: 0.3 }, { x: -18, z: 0, w: 6, d: 0.3 },
        { x: 18, z: 0, w: 6, d: 0.3 }, { x: 30, z: 0, w: 6, d: 0.3 },
        { x: 0, z: -30, w: 0.3, d: 6 }, { x: 0, z: -18, w: 0.3, d: 6 },
        { x: 0, z: 18, w: 0.3, d: 6 }, { x: 0, z: 30, w: 0.3, d: 6 },
        // crosswalks at the plaza corners
        { x: -10, z: 7, w: 0.5, d: 3 }, { x: -8.5, z: 7, w: 0.5, d: 3 }, { x: -7, z: 7, w: 0.5, d: 3 },
      ],
      buildings: [
        { model: "kc/building-a", x: -26, z: -34, h: 10, rot: 0 },
        { model: "kc/building-j", x: 0, z: -36, h: 12, rot: 0 },
        { model: "kc/building-f", x: 26, z: -34, h: 11, rot: 0 },
        { model: "kc/building-b", x: -26, z: 34, h: 9, rot: Math.PI },
        { model: "kc/building-e", x: 0, z: 36, h: 8, rot: Math.PI },
        { model: "kc/building-g", x: 26, z: 34, h: 10, rot: Math.PI },
        { model: "kc/building-i", x: 42, z: -10, h: 13, rot: -Math.PI / 2 },
        { model: "kc/building-h", x: 42, z: 14, h: 9, rot: -Math.PI / 2 },
        { model: "kc/building-c", x: -42, z: -10, h: 10, rot: Math.PI / 2 },
        { model: "kc/building-d", x: -42, z: 14, h: 11, rot: Math.PI / 2 },
      ],
      skyline: [
        { model: "kc/low-detail-building-a", x: -76, z: -44, h: 30 }, { model: "kc/low-detail-building-c", x: -52, z: -80, h: 38 },
        { model: "kc/low-detail-building-b", x: 4, z: -94, h: 34 }, { model: "kc/low-detail-building-d", x: 58, z: -78, h: 28 },
        { model: "kc/low-detail-building-a", x: 86, z: -34, h: 32 }, { model: "kc/low-detail-building-c", x: 92, z: 20, h: 40 },
        { model: "kc/low-detail-building-b", x: 70, z: 64, h: 29 }, { model: "kc/low-detail-building-d", x: 14, z: 92, h: 34 },
        { model: "kc/low-detail-building-a", x: -44, z: 88, h: 31 }, { model: "kc/low-detail-building-c", x: -88, z: 30, h: 36 },
      ],
      streetProps: [
        { model: "kr/dumpster", x: -18, z: -16, h: 1.4 }, { model: "kr/dumpster", x: 20, z: 17, h: 1.4 },
        { model: "kr/construction-light", x: -12, z: 18, h: 2.4 }, { model: "kr/construction-light", x: 13, z: -17, h: 2.4 },
      ],
      lamps: [
        { x: -9, z: -12 }, { x: 9, z: -12 }, { x: -9, z: 12, rot: Math.PI }, { x: 9, z: 12, rot: Math.PI },
        { x: -16, z: 9, rot: -Math.PI / 2 }, { x: 16, z: 9, rot: Math.PI / 2 },
        { x: -16, z: -9, rot: -Math.PI / 2 }, { x: 16, z: -9, rot: Math.PI / 2 },
      ],
    },
    ruins: [],
  },
  {
    id: "foundry",
    name: "FOUNDRY",
    light: "gunship",
    fogScale: 0.95,
    rainScale: 1.4,
    lightBoost: 1.05,
    centerClear: 13,
    hazardRing: 16,
    sign: { x: 14, z: -30, rot: 0.3 },
    // heavy plant: two sheds, silos, machinery and a control tower around a hazard pad
    props: [
      { ...polar(-90, 26), kind: "turret", rotY: 0 },
      { ...polar(90, 26), kind: "turret", rotY: 0 },
      { ...polar(135, 22), kind: "barrier", rotY: 0.6 },
      { ...polar(-135, 22), kind: "barrier", rotY: -0.6 },
      { ...polar(45, 26), kind: "barrier", rotY: -1.4 },
      { ...polar(-45, 26), kind: "barrier", rotY: 1.4 },
      { ...polar(-160, 38), kind: "container", rotY: 0.3 },
      { ...polar(160, 38), kind: "container", rotY: -0.3 },
      { ...polar(120, 40), kind: "watchtower", rotY: -0.9 },
    ],
    level: {
      ground: "concrete",
      roads: [],
      pads: [
        { x: 0, z: 0, w: 26, d: 26, mat: "hazard" },
        { x: 0, z: 0, w: 20, d: 20, mat: "concrete" },
      ],
      stripes: [
        { x: -8, z: 15, w: 14, d: 0.4 }, { x: 8, z: 15, w: 14, d: 0.4 },
        { x: 0, z: -15, w: 22, d: 0.4 },
      ],
      buildings: [
        { model: "ki/building-a", x: -33, z: -31, h: 13, rot: 0.1 },
        { model: "ki/building-c", x: 31, z: -31, h: 11, rot: -0.15 },
        { model: "ki/building-f", x: 37, z: 23, h: 15, rot: Math.PI },
        { model: "ki/building-e", x: -35, z: 27, h: 10, rot: Math.PI * 0.9 },
        { model: "ki/water-tower", x: -20, z: 34, h: 19, rot: 0.3 },
        { model: "ki/chimney-large", x: 23, z: 22, h: 22, rot: 0 },
        { model: "ki/detail-tank-large", x: -17, z: 20, h: 5, rot: 0.5 },
      ],
      skyline: [
        { model: "kc/low-detail-building-a", x: -80, z: -50, h: 34 }, { model: "kc/low-detail-building-b", x: -46, z: -86, h: 40 },
        { model: "kc/low-detail-building-c", x: 10, z: -94, h: 36 }, { model: "kc/low-detail-building-d", x: 62, z: -74, h: 30 },
        { model: "kc/low-detail-building-a", x: 88, z: -24, h: 38 }, { model: "kc/low-detail-building-b", x: 86, z: 34, h: 42 },
        { model: "kc/low-detail-building-c", x: 56, z: 78, h: 33 }, { model: "kc/low-detail-building-d", x: -6, z: 94, h: 37 },
        { model: "kc/low-detail-building-a", x: -62, z: 74, h: 35 }, { model: "kc/low-detail-building-b", x: -92, z: 8, h: 39 },
      ],
      streetProps: [
        { model: "kr/dumpster", x: -11, z: 16, h: 1.4 }, { model: "kr/construction-light", x: 12, z: 17, h: 2.4 },
      ],
      silos: [
        { x: 20, z: 14, r: 3.2, h: 12 },
        { x: 27, z: 19, r: 2.6, h: 10 },
      ],
      machines: [
        { x: -16, z: -10, w: 6, d: 4, h: 3.2, rot: 0.2 },
        { x: 17, z: -8, w: 5, d: 5, h: 2.6, rot: -0.3 },
        { x: -17, z: 13, w: 4, d: 8, h: 2.2, rot: 0.1 },
      ],
      lamps: [{ x: -12, z: 12 }, { x: 12, z: 12 }, { x: -12, z: -12, rot: Math.PI }, { x: 12, z: -12, rot: Math.PI }],
    },
    ruins: [],
  },
];

const BY_ID = new Map(MAPS.map((m) => [m.id, m]));

export function mapById(id) {
  return BY_ID.get(String(id)) || null;
}

/** Map for a run: explicit id wins, otherwise rotate deterministically by seed + run number. */
export function selectMap({ seed = 1, run = 0, forced = null } = {}) {
  const f = forced ? mapById(forced) : null;
  if (f) return f;
  const idx = Math.abs(Math.floor(Number(seed) || 0) + Math.floor(Number(run) || 0)) % MAPS.length;
  return MAPS[idx];
}

/**
 * Validate a map's placement. Cover lives at 17-52 m, the centre pad stays clear.
 */
export function validateMap(map) {
  const problems = [];
  let minR = Infinity;
  let maxR = 0;
  const all = [...map.props, ...(map.ruins || [])];
  for (const p of all) {
    const r = Math.hypot(p.x, p.z);
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    if (r < 16) problems.push(`${p.kind || "ruin"} at r=${r.toFixed(1)} is inside 16 m`);
    if (r < 17 || r > 52) problems.push(`${p.kind || "ruin"} at r=${r.toFixed(1)} is outside 17-52 m`);
    if (r < (map.centerClear || 10)) problems.push(`${p.kind || "ruin"} blocks the centre pad`);
  }
  for (const b of map.level?.buildings || []) {
    const r = Math.hypot(b.x, b.z);
    if (r < (map.centerClear || 10) + Math.max(b.w, b.d) / 2) problems.push(`building at r=${r.toFixed(1)} crowds the centre pad`);
  }
  return {
    id: map.id,
    name: map.name,
    props: map.props.length,
    ruins: (map.ruins || []).length,
    buildings: (map.level?.buildings || []).length,
    minRadius: Number.isFinite(minR) ? Number(minR.toFixed(1)) : 0,
    maxRadius: Number(maxR.toFixed(1)),
    centerClear: map.centerClear,
    problems,
    ok: problems.length === 0,
  };
}

/** Collider half-extents per GLB prop kind. */
export const PROP_COLLIDERS = {
  container: { shape: "obb", hx: 1.65, hz: 3.3 },
  barrier: { shape: "obb", hx: 1.55, hz: 0.55 },
  watchtower: { shape: "obb", hx: 1.75, hz: 1.75 },
  turret: { shape: "circle", radius: 1.45 },
  "milk-truck": { shape: "obb", hx: 1.35, hz: 2.7 },
};
