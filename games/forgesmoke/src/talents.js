/**
 * FORGE SMOKE — SPECIAL OPERATIONS TREE
 *
 * Structure follows the reference games (PoE2 passive tree, per poe2ref.com and the Maxroll beginner
 * guide), reskinned military:
 *
 *   CLUSTER  = a ring of small passives capped by one NOTABLE, with a MASTERY at the cluster centre
 *              that only opens once that cluster's notable is taken.
 *   REGION   = a spoke of eight clusters (Spec Ops, Assault, Demolition, Armour, Recon, Drone Ops,
 *              Logistics, Command), ending in a KEYSTONE with a real drawback.
 *   HUB      = the bay; every region begins there.
 *
 * No jewel sockets (by request).
 *
 * 8 regions x 16 clusters x (8 small + 1 notable + 1 mastery) = 1,280, plus 8 keystones and the
 * hub = 1,289 nodes, ~1,540 edges. Masteries gate on their cluster notable.
 * Allocation is cheapest-chain (Dijkstra); masteries are gated on their cluster notable; refunds
 * prune anything only reachable through the node.
 */

const D2R = Math.PI / 180;

/* ── content pools (military, not fantasy) ─────────────────────────────────── */

const REGIONS = [
  {
    id: "so", name: "SPEC OPS", angle: -90, color: "#8fd8ff",
    blurb: "Long-range precision. Punish from outside their reach.",
    small: [["Marksmanship", { dmg: 3, rangeDmg: 3 }], ["Breath Control", { crit: 2, rangeDmg: 2 }],
      ["Zeroing", { rangeDmg: 5 }], ["Ballistic Table", { dmg: 4 }], ["Spotter Drill", { crit: 2, dmg: 2 }],
      ["Cold Bore", { rangeDmg: 4 }], ["Trigger Discipline", { crit: 3 }], ["Optic Housing", { dmg: 2, armor: 2 }]],
    notable: [["Zeroed Optic", { rangeDmg: 16, crit: 4 }], ["Overwatch Post", { dmg: 12, armor: 6 }],
      ["Kill Zone", { rangeDmg: 14 }], ["Cold Shot", { crit: 10 }], ["Recon by Fire", { dmg: 10, rangeDmg: 8 }],
      ["Long Watch", { rangeDmg: 12, xp: 8 }], ["One Shot Doctrine", { dmg: 14, rate: -4 }], ["Spotter Team", { crit: 8, dmg: 8 }]],
    mastery: [["Range Mastery", { rangeDmg: 28 }, "Range damage is what you build around."],
      ["Precision Mastery", { crit: 12 }, "Crit chance, no strings."]],
    keystone: { n: "Dead Man's Click", m: { rangeDmg: 60, crit: 15, dmg: -15 },
      d: "60% range damage and +15% crit, but 15% less damage up close." },
  },
  {
    id: "as", name: "ASSAULT", angle: -45, color: "#ffc46b",
    blurb: "Sustained machine-gun fire. Volume beats precision.",
    small: [["Squad Automatic", { rate: 3 }], ["Belt Fed", { mag: 4 }], ["Muzzle Brake", { dmg: 2, rate: 2 }],
      ["Barrel Shroud", { rate: 3 }], ["Gunner's Mate", { dmg: 3 }], ["Bipod Stance", { dmg: 2, armor: 2 }],
      ["Brass Call", { mag: 5 }], ["Sustained Fire Drill", { rate: 4 }]],
    notable: [["Wall of Lead", { rate: 14, mag: 10 }], ["Gunner's Nest", { dmg: 12, rate: 6 }],
      ["Suppression Drill", { rate: 12 }], ["Ammo Bearer", { mag: 16 }], ["Heat Discipline", { rate: 10, dmg: 6 }],
      ["Squad Automatic", { dmg: 10, mag: 8 }], ["Volume of Fire", { rate: 16, dmg: -4 }], ["Belt Team", { mag: 12, reload: 6 }]],
    mastery: [["Rate Mastery", { rate: 26 }, "Cyclic rate, flat."],
      ["Sustain Mastery", { mag: 30 }, "Magazine size, flat."]],
    keystone: { n: "Wall of Lead", m: { rate: 45, dmg: -18, reload: 10 },
      d: "45% fire rate at the cost of 18% damage — volume, not quality." },
  },
  {
    id: "de", name: "DEMOLITION", angle: 0, color: "#ff8a5c",
    blurb: "Explosives. Go over, around and through shields.",
    small: [["Demo Basic", { blast: 4 }], ["Primer Cord", { blast: 3, rate: 2 }], ["Shaped Charge", { shieldPierce: 5 }],
      ["Frag Pack", { blast: 3, shieldPierce: 3 }], ["Cook Off", { blast: 4 }], ["Thermobaric", { blast: 5 }],
      ["Breach Math", { shieldPierce: 6 }], ["Sapper's Hands", { blast: 3, armor: 2 }]],
    notable: [["Satchel Charge", { blast: 16, shieldPierce: 10 }], ["Breach Kit", { shieldPierce: 18, dmg: 6 }],
      ["Cluster Munition", { blast: 14 }], ["Thermobaric Fill", { blast: 12, shieldPierce: 8 }],
      ["Demo NCO", { blast: 10, armor: 6 }], ["Shaped Penetrator", { shieldPierce: 20 }],
      ["Cook-Off Charge", { blast: 12, rate: 6 }], ["Crater Analysis", { dmg: 8, blast: 10 }]],
    mastery: [["Blast Mastery", { blast: 30 }, "Explosive damage, flat."],
      ["Breach Mastery", { shieldPierce: 30 }, "Shield pierce, flat."]],
    keystone: { n: "Sapper's Oath", m: { shieldPierce: 100, blast: 40, dmg: -12 },
      d: "Explosions ignore shields entirely and hit 40% harder; everything else is 12% weaker." },
  },
  {
    id: "ar", name: "ARMOUR", angle: 45, color: "#a9b6c4",
    blurb: "Plate and nerve. Live through what kills the rest.",
    small: [["Plate Carrier", { armor: 4 }], ["Ceramic Inserts", { armor: 3, hp: 3 }], ["Trauma Plate", { hp: 4 }],
      ["Webbing", { armor: 3 }], ["Neck Guard", { armor: 2, hp: 2 }], ["Blast Diaper", { armor: 3, blast: 2 }],
      ["Reinforced Visor", { armor: 3 }], ["Field Dressing", { hp: 5 }]],
    notable: [["Hard Point", { armor: 16, hp: 8 }], ["Combat Medic", { hp: 14, heal: 3 }],
      ["Blast Suit", { armor: 12, blast: 8 }], ["Trauma Kit", { hp: 12 }], ["Ablative Layer", { armor: 14 }],
      ["Nerve Staples", { hp: 10, armor: 6 }], ["Walking Wall", { armor: 18, speed: -5 }], ["Triage Drill", { hp: 12, heal: 2 }]],
    mastery: [["Armour Mastery", { armor: 30 }, "Armour, flat."],
      ["Integrity Mastery", { hp: 30 }, "Maximum integrity, flat."]],
    keystone: { n: "Last Stand", m: { hp: 45, armor: 30, speed: -10 },
      d: "45% integrity and 30% armour; you move 10% slower for it." },
  },
  {
    id: "rc", name: "RECON", angle: 90, color: "#7ce6a8",
    blurb: "Move quiet, move fast, see it first.",
    small: [["Ruck March", { speed: 3 }], ["Light Kit", { speed: 2, reload: 2 }], ["Low Crawl", { speed: 3 }],
      ["Silent Boots", { speed: 2, crit: 2 }], ["Field Craft", { xp: 5 }], ["Sprint Cycle", { speed: 3 }],
      ["Escape Route", { speed: 2, armor: 2 }], ["Route Recall", { xp: 4, speed: 2 }]],
    notable: [["Pathfinder", { speed: 14, reload: 6 }], ["Recon Screen", { speed: 10, crit: 5 }],
      ["Ghost Walk", { speed: 12 }], ["Field Notes", { xp: 16 }], ["Terrain Read", { speed: 8, armor: 4 }],
      ["Exfil Drill", { speed: 10, hp: 5 }], ["Sight Picture", { crit: 8, speed: 6 }], ["Long Patrol", { xp: 12, speed: 6 }]],
    mastery: [["Mobility Mastery", { speed: 28 }, "Movement, flat."],
      ["Fieldcraft Mastery", { xp: 30 }, "Run XP, flat."]],
    keystone: { n: "Ghost Protocol", m: { speed: 35, crit: 10, armor: -12 },
      d: "35% speed and +10% crit; you give up 12% armour." },
  },
  {
    id: "dr", name: "DRONE OPS", angle: 135, color: "#9fb3ff",
    blurb: "Machines that fight beside you.",
    small: [["Ground Station", { drone: 1 }], ["Telemetry", { drone: 1, crit: 2 }], ["Loiter Time", { drone: 1 }],
      ["Swarm Logic", { drone: 2 }], ["Relay Hop", { drone: 1, xp: 3 }], ["Orbit Math", { drone: 1, rate: 2 }],
      ["Laser Designator", { crit: 3 }], ["Autonomy Bit", { drone: 2 }]],
    notable: [["Orbit Pattern", { drone: 3, rate: 4 }], ["Wing Pair", { drone: 4, dmg: 6 }],
      ["Kill Box Link", { drone: 4, crit: 4 }], ["Autonomous Kill", { drone: 3, crit: 5 }],
      ["Relay Chain", { drone: 3, xp: 8 }], ["Swarm Lead", { drone: 5 }], ["Designator Net", { crit: 10, drone: 2 }],
      ["Machine Trust", { drone: 4, dmg: 4 }]],
    mastery: [["Drone Mastery", { drone: 20 }, "Drone power, flat."],
      ["Companion Mastery", { drone: 12, dmg: 8 }, "Drones and your own damage."]],
    keystone: { n: "Drone Mother", m: { drone: 12, dmg: -8 },
      d: "The swarm does the work: +12 drone power, 8% less personal damage." },
  },
  {
    id: "lo", name: "LOGISTICS", angle: 180, color: "#ffd166",
    blurb: "Ammo, time, and the points to spend.",
    small: [["Ammo Crate", { mag: 4 }], ["Speed Loader", { reload: 3 }], ["Spare Barrel", { reload: 2, rate: 2 }],
      ["Pallet Drop", { mag: 3, xp: 3 }], ["Ordnance Handler", { reload: 3, blast: 2 }],
      ["Combat Resupply", { mag: 4 }], ["Manifest Sign", { xp: 4 }], ["Rack Drill", { reload: 4 }]],
    notable: [["Supply Chain", { reload: 14, points: 1 }], ["Quartermaster", { xp: 14, points: 1 }],
      ["NAFI Run", { points: 1 }], ["Fast Rack", { reload: 12, mag: 8 }], ["Deep Pockets", { mag: 16 }],
      ["Ordnance Depot", { reload: 10, blast: 6 }], ["Night Drop", { xp: 10, mag: 8 }], ["War Stocks", { points: 1, reload: 8 }]],
    mastery: [["Reload Mastery", { reload: 30 }, "Reload speed, flat."],
      ["Logistics Mastery", { points: 2 }, "Two more points per run."]],
    keystone: { n: "War Chest", m: { points: 3, xp: 25, dmg: -10 },
      d: "+3 points every run and 25% XP; your damage drops 10%." },
  },
  {
    id: "cm", name: "COMMAND", angle: 225, color: "#ff9ad5",
    blurb: "Lead from the front. Everything is a little better.",
    small: [["Briefing", { dmg: 2, xp: 3 }], ["NCO School", { rate: 2, armor: 2 }], ["Battle Drill", { dmg: 3 }],
      ["Cross Training", { rate: 2, reload: 2 }], ["Staff Officer", { xp: 4 }], ["Rules of Engagement", { crit: 2, dmg: 2 }],
      ["AAR Loop", { xp: 3, points: 1 }], ["Command Voice", { dmg: 2, hp: 2 }]],
    notable: [["Command Presence", { dmg: 12, xp: 8 }], ["War College", { crit: 10, dmg: 8 }],
      ["Battle Rhythm", { rate: 8, dmg: 6 }], ["Officer's Eye", { crit: 8, rangeDmg: 6 }],
      ["Staff Work", { xp: 14 }], ["Mentor", { xp: 10, hp: 6 }], ["Iron Example", { dmg: 10, armor: 6 }],
      ["Campaign Log", { points: 1, xp: 8 }]],
    mastery: [["Command Mastery", { dmg: 22 }, "Damage, flat."],
      ["Doctrine Mastery", { crit: 10, dmg: 10 }, "Crit and damage together."]],
    keystone: { n: "Supreme Command", m: { dmg: 20, crit: 12, rate: 8, hp: -10 },
      d: "20% damage, +12% crit, 8% rate — at 10% less integrity." },
  },
];

/* ── geometry: a constellation disc, not spokes ────────────────────────────── */
/*
 * Reference layout: clusters are scattered across a disc like constellations, each a small irregular
 * group of passives, joined by short wandering links. Nothing radiates in a straight line. Branch
 * membership is decided by the SECTOR a cluster falls in, so colours still group into regions, but
 * the shape is a web.
 */

const CLUSTERS = 96;
const DISC_R = 620;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));   // sunflower distribution
const SECTOR_NAMES = REGIONS.map((r) => r.id);

/** Deterministic small PRNG so the layout is identical every load. */
function lcg(seed) {
  let a = seed >>> 0;
  return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
}

export function buildTree() {
  const rnd = lcg(77021);
  const nodes = [];
  const edges = [];
  const byId = new Map();

  const hub = {
    id: "hub", name: "COMMAND CORE", kind: "hub", branch: "hub",
    x: 0, y: 0, color: "#ffb347", desc: "The bay. Every region starts here.", mods: {},
  };
  nodes.push(hub); byId.set(hub.id, hub);

  const clusters = [];
  for (let i = 0; i < CLUSTERS; i += 1) {
    // sunflower: even coverage, no spokes
    const r = DISC_R * Math.sqrt((i + 0.6) / CLUSTERS);
    const a = i * GOLDEN;
    const cx = Math.cos(a) * r;
    const cy = Math.sin(a) * r;
    // sector decides the region (and therefore the colour)
    const sector = ((Math.round(((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI / 4))) % 8 + 8) % 8;
    const region = REGIONS[sector];
    clusters.push({ key: `${region.id}${i}`, cx, cy, region, idx: i });
  }
  // the hub joins the clusters closest to the middle
  clusters.sort((p1, p2) => Math.hypot(p1.cx, p1.cy) - Math.hypot(p2.cx, p2.cy));

  clusters.forEach((cl, ci) => {
    const { region } = cl;
    const key = cl.key;
    const ringR = 30 + rnd() * 16;
    const baseA = rnd() * Math.PI * 2;
    const ringIds = [];

    for (let k = 0; k < 8; k += 1) {
      const ang = baseA + (k / 8) * Math.PI * 2 + (rnd() - 0.5) * 0.34;
      const rr = ringR * (0.82 + rnd() * 0.36);
      const [nm, mods] = region.small[(ci * 8 + k) % region.small.length];
      const id = `${key}.s${k}`;
      const node = {
        id, name: nm, kind: "small", branch: region.id, cluster: key,
        x: +(cl.cx + Math.cos(ang) * rr).toFixed(2),
        y: +(cl.cy + Math.sin(ang) * rr).toFixed(2),
        color: region.color, mods, desc: describe(mods, nm),
      };
      nodes.push(node); byId.set(id, node); ringIds.push(id);
    }
    // the constellation's own path: a wandering chain, not a circle
    const order = ringIds.slice().sort(() => rnd() - 0.5);
    for (let k = 0; k < order.length - 1; k += 1) edges.push([order[k], order[k + 1]]);
    edges.push([order[order.length - 1], order[0]]);

    const [nn, nmods] = region.notable[ci % region.notable.length];
    const nAng = baseA + rnd() * Math.PI * 2;
    const nid = `${key}.n`;
    const notable = {
      id: nid, name: nn, kind: "notable", branch: region.id, cluster: key,
      x: +(cl.cx + Math.cos(nAng) * (ringR + 26)).toFixed(2),
      y: +(cl.cy + Math.sin(nAng) * (ringR + 26)).toFixed(2),
      color: region.color, mods: nmods, desc: describe(nmods, nn),
    };
    nodes.push(notable); byId.set(nid, notable);
    edges.push([nid, order[0]]);
    edges.push([nid, order[Math.floor(order.length / 2)]]);

    const [mn, mmods, mdesc] = region.mastery[ci % region.mastery.length];
    const mid = `${key}.m`;
    const mastery = {
      id: mid, name: mn, kind: "mastery", branch: region.id, cluster: key,
      requires: nid, x: +cl.cx.toFixed(2), y: +cl.cy.toFixed(2),
      color: region.color, mods: mmods, desc: `${mdesc} Opens with ${nn}.`,
    };
    nodes.push(mastery); byId.set(mid, mastery);
    edges.push([nid, mid]);

    cl.notableId = nid;
    cl.entryId = order[0];
  });

  // hub joins the nearest constellations (six short links, no long spokes)
  clusters.slice(0, 6).forEach((cl) => edges.push(["hub", cl.entryId]));

  // cross-links: each constellation joins its two nearest neighbours -> a real web
  for (let i = 0; i < clusters.length; i += 1) {
    const a = clusters[i];
    const near = clusters
      .map((b, j) => ({ b, j, d: Math.hypot(a.cx - b.cx, a.cy - b.cy) }))
      .filter((o) => o.j !== i)
      .sort((u, v) => u.d - v.d)
      .slice(0, 2);
    for (const n of near) edges.push([a.notableId, n.b.notableId]);
  }

  // eight keystones on the rim, one per region, each hanging off its outermost constellation
  REGIONS.forEach((region, ri) => {
    const own = clusters.filter((c) => c.region.id === region.id);
    if (!own.length) return;
    const far = own.reduce((best, c) => (Math.hypot(c.cx, c.cy) > Math.hypot(best.cx, best.cy) ? c : best), own[0]);
    const ang = Math.atan2(far.cy, far.cx);
    const kId = `${region.id}.key`;
    const ks = region.keystone;
    const key = {
      id: kId, name: ks.n, kind: "keystone", branch: region.id, cluster: `${region.id}key`,
      x: +(Math.cos(ang) * (DISC_R + 90)).toFixed(2),
      y: +(Math.sin(ang) * (DISC_R + 90)).toFixed(2),
      color: region.color, mods: ks.m, desc: ks.d,
    };
    nodes.push(key); byId.set(kId, key);
    edges.push([far.notableId, kId]);
  });

  return { nodes, edges, byId, hub };
}

/** Human-readable effect line from a modifier block. */
function describe(mods, fallback) {
  const names = {
    dmg: "damage", rate: "fire rate", reload: "reload speed", armor: "armour", hp: "integrity",
    crit: "critical chance", rangeDmg: "damage beyond 12m", blast: "explosive damage",
    shieldPierce: "shield pierce", drone: "drone power", xp: "run XP", points: "talent points per run",
    speed: "movement speed", heal: "integrity regen", mag: "magazine size",
  };
  const parts = Object.entries(mods || {}).map(([k, v]) => `${v > 0 ? "+" : ""}${v}% ${names[k] || k}`);
  return parts.length ? parts.join(", ") : fallback;
}

export const TREE = buildTree();
export const BRANCHES = REGIONS.map((r) => ({ id: r.id, name: r.name, color: r.color, blurb: r.blurb, angle: r.angle }));

export const TALENT_REWARD = { start: 6, perRun: 2, perClear: 6, perTwoLevels: 1, perBoss: 4 };

export function aggregate(allocated = []) {
  const acc = {
    dmg: 0, rate: 0, reload: 0, armor: 0, hp: 0, crit: 0, rangeDmg: 0,
    blast: 0, shieldPierce: 0, drone: 0, xp: 0, points: 0, speed: 0, heal: 0, mag: 0,
  };
  for (const id of allocated) {
    const n = TREE.byId.get(id);
    if (!n) continue;
    for (const [k, v] of Object.entries(n.mods || {})) acc[k] = (acc[k] || 0) + Number(v || 0);
  }
  return acc;
}

export function toRunMods(acc) {
  return {
    damageMult: 1 + acc.dmg / 100,
    rateMult: 1 + acc.rate / 100,
    reloadMult: Math.max(0.35, 1 - acc.reload / 100),
    hpMult: 1 + acc.hp / 100,
    armorMult: 1 + acc.armor / 100,
    critAdd: acc.crit / 100,
    rangeDamageMult: 1 + acc.rangeDmg / 100,
    blastMult: 1 + acc.blast / 100,
    shieldPierce: Math.min(1, acc.shieldPierce / 100),
    drone: acc.drone,
    xpMult: 1 + acc.xp / 100,
    pointsBonus: acc.points,
    speedMult: 1 + acc.speed / 100,
    magMult: 1 + acc.mag / 100,
  };
}

/** A mastery needs its cluster notable; everything else needs a path from the hub. */
export function requirementMet(node, allocatedSet) {
  if (!node) return false;
  if (node.requires) return allocatedSet.has(node.requires);
  return true;
}

/**
 * Cheapest chain to `id`. Masteries cost their own node only, once their notable is held -
 * you do not pay a path again for a node sitting in the middle of a cluster you already own.
 */
export function pathTo(id, allocatedSet) {
  const node = TREE.byId.get(id);
  if (!node) return null;
  if (allocatedSet.has(id)) return { path: [], cost: 0 };
  if (node.requires) {
    if (!allocatedSet.has(node.requires)) return null;
    return { path: [id], cost: allocatedSet.has(id) ? 0 : 1 };
  }
  const dist = new Map([["hub", 0]]);
  const prev = new Map();
  const open = ["hub"];
  while (open.length) {
    open.sort((a, b) => (dist.get(a) ?? 1e9) - (dist.get(b) ?? 1e9));
    const cur = open.shift();
    if (cur === id) break;
    for (const [a, b] of TREE.edges) {
      let next = null;
      if (a === cur) next = b;
      else if (b === cur) next = a;
      if (!next) continue;
      const stepCost = allocatedSet.has(next) || next === "hub" ? 0 : 1;
      const nd = (dist.get(cur) ?? 1e9) + stepCost;
      if (nd < (dist.get(next) ?? 1e9)) {
        dist.set(next, nd); prev.set(next, cur); open.push(next);
      }
    }
  }
  if (!dist.has(id)) return null;
  const path = [];
  let cur = id;
  while (cur && cur !== "hub") { if (!allocatedSet.has(cur)) path.unshift(cur); cur = prev.get(cur); }
  return { path, cost: path.length };
}

export function refund(id, allocatedSet) {
  const next = new Set(allocatedSet);
  const node = TREE.byId.get(id);
  next.delete(id);
  // masteries whose notable just went away are dropped too
  for (const n of [...next]) {
    const t = TREE.byId.get(n);
    if (t?.requires && !next.has(t.requires)) next.delete(n);
  }
  // prune anything no longer connected to the hub
  const reachable = new Set(["hub"]);
  const q = ["hub"];
  while (q.length) {
    const cur = q.shift();
    for (const [a, b] of TREE.edges) {
      const other = a === cur ? b : b === cur ? a : null;
      if (!other || reachable.has(other)) continue;
      if (other !== "hub" && !next.has(other)) continue;
      reachable.add(other); q.push(other);
    }
  }
  for (const n of [...next]) if (!reachable.has(n)) next.delete(n);
  // mastery nodes are reached via their notable, not the edge graph alone
  for (const n of [...next]) {
    const t = TREE.byId.get(n);
    if (t?.requires && !next.has(t.requires)) next.delete(n);
  }
  return next;
}

export function nodeById(id) { return TREE.byId.get(id) || null; }
export function countAllocated(allocated) { return allocated.filter((id) => id !== "hub").length; }
