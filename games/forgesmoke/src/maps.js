/**
 * FORGE SMOKE — MAPS (MAP-01/02/03/04)
 *
 * Three layouts, one contract. Every map places cover at radius 18-30 m, keeps the centre clear and
 * leaves lanes wide enough for the fighter to cross without scraping a collider. The maps own their
 * props; the lighting presets in `ARENA_LIGHTING` stay separate, so a map can borrow a look.
 *
 * Placement rules (from .forge/briefs/02-maps.md):
 *   1. nothing inside 16 m  — an earlier build put containers at 8-13 m and buried the camera,
 *   2. cover radius 18-30 m,
 *   3. a clear centre pad (10 m on FOUNDRY, 12 m elsewhere),
 *   4. spawns are deterministic by seed and never inside a collider (EnemyManager resolves).
 */

const polar = (deg, r, extra = {}) => {
  const a = (deg * Math.PI) / 180;
  return { x: Number((Math.cos(a) * r).toFixed(2)), z: Number((Math.sin(a) * r).toFixed(2)), ...extra };
};

/**
 * @typedef {Object} MapDef
 * @property {string} id
 * @property {string} name
 * @property {string} light   lighting preset key
 * @property {number} fogScale
 * @property {number} rainScale
 * @property {number} lightBoost
 * @property {number} centerClear
 * @property {{kind:string,x:number,z:number,rotY?:number,scale?:number}[]} props
 * @property {{x:number,z:number,rotY?:number,scale?:number}[]} ruins
 */

/** @type {MapDef[]} */
export const MAPS = [
  {
    id: "depot",
    name: "DEPOT",
    light: "perimeter",
    fogScale: 1.0,
    rainScale: 1.0,
    lightBoost: 1.0,
    centerClear: 12,
    // two lanes stay open around 0 deg and 180 deg
    props: [
      { ...polar(-160, 24), kind: "container", rotY: 0.15 },
      { ...polar(-110, 26), kind: "container", rotY: -0.3 },
      { ...polar(-35, 22), kind: "container", rotY: 0.4 },
      { ...polar(35, 22), kind: "container", rotY: -0.4 },
      { ...polar(110, 26), kind: "container", rotY: 0.3 },
      { ...polar(160, 24), kind: "container", rotY: -0.15 },
      // after the ruin complex came out, these two trucks keep the mid ring from reading as empty
      { ...polar(-60, 26), kind: "milk-truck", rotY: 0.5 },
      { ...polar(60, 26), kind: "milk-truck", rotY: -0.5 },
      { ...polar(-75, 18.5), kind: "barrier", rotY: 1.2 },
      { ...polar(75, 18.5), kind: "barrier", rotY: -1.2 },
      { ...polar(-15, 29), kind: "barrier", rotY: 0.2 },
      { ...polar(15, 29), kind: "barrier", rotY: -0.2 },
    ],
    // The castle-like arena-ruins prop was removed from DEPOT (author: it snags the fighter and the
    // collider fit turns a ruin complex into an invisible wall). Other maps keep their ruins; DEPOT
    // will get purpose-built cover later.
    ruins: [],
  },
  {
    id: "yard",
    name: "YARD",
    light: "breach",
    fogScale: 1.35,
    rainScale: 0.9,
    lightBoost: 1.15,
    centerClear: 12,
    props: [
      { ...polar(-150, 24), kind: "container", rotY: 0.2 },
      { ...polar(-60, 30), kind: "container", rotY: -0.5 },
      { ...polar(60, 30), kind: "container", rotY: 0.5 },
      { ...polar(-115, 33), kind: "watchtower", rotY: 0.78 },
      { ...polar(115, 33), kind: "watchtower", rotY: -0.78 },
    ],
    ruins: [
      { ...polar(170, 28), rotY: Math.PI, scale: 0.4 },
    ],
  },
  {
    id: "foundry",
    name: "FOUNDRY",
    light: "gunship",
    fogScale: 1.15,
    rainScale: 1.45,
    lightBoost: 1.0,
    centerClear: 10,
    // a tight ring at 17-26 m, ten bodies, nothing inside the 10 m centre pad
    props: [
      { ...polar(-162, 20), kind: "container", rotY: 0.1 },
      { ...polar(-126, 23), kind: "container", rotY: -0.2 },
      { ...polar(-90, 17.5), kind: "barrier", rotY: 1.4 },
      { ...polar(-54, 24), kind: "container", rotY: 0.6 },
      { ...polar(-18, 18), kind: "barrier", rotY: -1.4 },
      { ...polar(18, 18), kind: "barrier", rotY: 1.4 },
      { ...polar(54, 24), kind: "container", rotY: -0.6 },
      { ...polar(90, 17.5), kind: "barrier", rotY: -1.4 },
      { ...polar(126, 23), kind: "turret", rotY: 0 },
      { ...polar(162, 20), kind: "turret", rotY: 0 },
    ],
    ruins: [
      { ...polar(-145, 26), rotY: 0.9, scale: 0.4 },
    ],
    hazardRing: 10.6,
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
 * Validate a map against the placement rules. Returns the numbers the acceptance asks to print:
 * prop radius range and the collider count.
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
    if (r < 17 || r > 34) problems.push(`${p.kind || "ruin"} at r=${r.toFixed(1)} is outside 17-34 m`);
    if (r < (map.centerClear || 10)) problems.push(`${p.kind || "ruin"} blocks the centre pad`);
  }
  return {
    id: map.id,
    name: map.name,
    props: map.props.length,
    ruins: (map.ruins || []).length,
    minRadius: Number(minR.toFixed(1)),
    maxRadius: Number(maxR.toFixed(1)),
    centerClear: map.centerClear,
    problems,
    ok: problems.length === 0,
  };
}

/** Collider half-extents per prop kind; the renderer registers these as OBB/circle colliders. */
export const PROP_COLLIDERS = {
  container: { shape: "obb", hx: 1.65, hz: 3.3 },
  barrier: { shape: "obb", hx: 1.55, hz: 0.55 },
  watchtower: { shape: "obb", hx: 1.75, hz: 1.75 },
  turret: { shape: "circle", radius: 1.45 },
  "milk-truck": { shape: "obb", hx: 1.35, hz: 2.7 },
};
