/**
 * FORGE SMOKE — SPECIAL OPERATIONS TREE
 *
 * A military passive tree in the shape of the PoE tree: a hub, eight branch spokes that follow the
 * conduits etched into the command board, small passives, notables, and a keystone at the end of
 * every branch. Allocation is cheapest-chain: clicking a far node buys the nodes between it and
 * whatever you already hold, exactly like the reference system.
 *
 * Nodes cost 1 point. Points come from runs (generous) and from boss trials.
 *
 * Effects are plain modifiers; `aggregate()` folds them into the multipliers the run reads.
 */

export const BRANCHES = [
  {
    id: "so", name: "SPEC OPS", angle: -90, color: "#8fd8ff", icon: "◈",
    blurb: "Long-range precision. Punish from outside their reach.",
    nodes: [
      { n: "Marksmanship", k: "small", m: { dmg: 6, rangeDmg: 4 }, d: "6% damage, 4% more at 12m+" },
      { n: "Trigger Discipline", k: "small", m: { crit: 3, rangeDmg: 4 }, d: "3% crit chance, 4% range damage" },
      { n: "Ballistic Table", k: "small", m: { dmg: 8 }, d: "8% damage" },
      { n: "Optic Zero", k: "notable", m: { rangeDmg: 18, crit: 4 }, d: "18% range damage, 4% crit" },
      { n: "Breath Control", k: "small", m: { crit: 4, rate: -2 }, d: "4% crit, 2% slower fire" },
      { n: "Cold Bore", k: "small", m: { rangeDmg: 8 }, d: "8% range damage" },
      { n: "Overwatch',", k: "small", m: { dmg: 6, armor: 4 }, d: "6% damage, 4% armour" },
      { n: "Spotter Team", k: "notable", m: { crit: 8, dmg: 10 }, d: "8% crit, 10% damage" },
      { n: "Suppressor", k: "small", m: { rate: 4 }, d: "4% fire rate" },
      { n: "Dead Man's Click", k: "keystone", m: { rangeDmg: 60, crit: 15, dmg: -15 }, d: "60% range damage, +15% crit, -15% close damage" },
    ],
  },
  {
    id: "as", name: "ASSAULT", angle: -45, color: "#ffc46b", icon: "❖",
    blurb: "Sustained machine-gun fire. Volume beats precision.",
    nodes: [
      { n: "Squad Automatic", k: "small", m: { rate: 5 }, d: "5% fire rate" },
      { n: "Belt Fed", k: "small", m: { mag: 8 }, d: "8% magazine" },
      { n: "Muzzle Brake", k: "small", m: { dmg: 5, rate: 3 }, d: "5% damage, 3% rate" },
      { n: "Sustained Fire", k: "notable", m: { rate: 14, mag: 12 }, d: "14% fire rate, 12% magazine" },
      { n: "Barrel Shroud", k: "small", m: { rate: 4 }, d: "4% fire rate" },
      { n: "Gunner's Mate", k: "small", m: { dmg: 7 }, d: "7% damage" },
      { n: "Bipod Stance", k: "small", m: { dmg: 6, armor: 4 }, d: "6% damage, 4% armour" },
      { n: "Suppression Drill", k: "notable", m: { rate: 12, dmg: 8 }, d: "12% rate, 8% damage" },
      { n: "Brass Everywhere", k: "small", m: { mag: 10 }, d: "10% magazine" },
      { n: "Wall of Lead", k: "keystone", m: { rate: 45, dmg: -18, reload: 10 }, d: "45% fire rate, -18% damage, +10% reload" },
    ],
  },
  {
    id: "de", name: "DEMOLITION", angle: 0, color: "#ff8a5c", icon: "✸",
    blurb: "Explosives. Go over, around and through shields.",
    nodes: [
      { n: "Demo Basic", k: "small", m: { blast: 6 }, d: "6% blast damage" },
      { n: "Frag Pack", k: "small", m: { blast: 5, shieldPierce: 4 }, d: "5% blast, 4% shield pierce" },
      { n: "Primer Cord", k: "small", m: { blast: 7 }, d: "7% blast damage" },
      { n: "Satchel Charge", k: "notable", m: { blast: 16, shieldPierce: 12 }, d: "16% blast, 12% shield pierce" },
      { n: "Shaped Charge", k: "small", m: { shieldPierce: 8 }, d: "8% shield pierce" },
      { n: "Cook Off", k: "small", m: { blast: 6, rate: 3 }, d: "6% blast, 3% rate" },
      { n: "Thermobaric", k: "small", m: { blast: 8 }, d: "8% blast damage" },
      { n: "Breach Kit", k: "notable", m: { shieldPierce: 18, dmg: 6 }, d: "18% shield pierce, 6% damage" },
      { n: "Demo NCO", k: "small", m: { blast: 7, armor: 3 }, d: "7% blast, 3% armour" },
      { n: "Sapper's Oath", k: "keystone", m: { shieldPierce: 100, blast: 40, dmg: -12 }, d: "explosions ignore shields, 40% blast, -12% damage" },
    ],
  },
  {
    id: "ar", name: "ARMOUR", angle: 45, color: "#a9b6c4", icon: "▰",
    blurb: "Plate and nerve. Live through what kills the rest.",
    nodes: [
      { n: "Plate Carrier", k: "small", m: { armor: 8 }, d: "8% armour" },
      { n: "Ceramic Inserts", k: "small", m: { armor: 6, hp: 4 }, d: "6% armour, 4% integrity" },
      { n: "Blast Diaper", k: "small", m: { armor: 5, blast: 4 }, d: "5% armour, 4% blast resist" },
      { n: "Hard Point", k: "notable", m: { armor: 16, hp: 8 }, d: "16% armour, 8% integrity" },
      { n: "Trauma Plate", k: "small", m: { hp: 6 }, d: "6% integrity" },
      { n: "Webbing", k: "small", m: { armor: 7 }, d: "7% armour" },
      { n: "Neck Guard", k: "small", m: { armor: 5, hp: 4 }, d: "5% armour, 4% integrity" },
      { n: "Combat Medic", k: "notable", m: { hp: 14, heal: 3 }, d: "14% integrity, small regen" },
      { n: "Reinforced Visor", k: "small", m: { armor: 6 }, d: "6% armour" },
      { n: "Last Stand", k: "keystone", m: { hp: 45, armor: 30, speed: -10 }, d: "45% integrity, 30% armour, -10% speed" },
    ],
  },
  {
    id: "rc", name: "RECON", angle: 90, color: "#7ce6a8", icon: "◇",
    blurb: "Move quiet, move fast, see it first.",
    nodes: [
      { n: "Ruck March", k: "small", m: { speed: 5 }, d: "5% move speed" },
      { n: "Light Kit", k: "small", m: { speed: 4, reload: 3 }, d: "4% speed, 3% reload" },
      { n: "Low Crawl", k: "small", m: { speed: 6 }, d: "6% move speed" },
      { n: "Pathfinder", k: "notable", m: { speed: 14, reload: 6 }, d: "14% speed, 6% reload" },
      { n: "Silent Boots", k: "small", m: { speed: 5, crit: 2 }, d: "5% speed, 2% crit" },
      { n: "Field Craft", k: "small", m: { xp: 8 }, d: "8% run XP" },
      { n: "Sprint Cycle", k: "small", m: { speed: 5 }, d: "5% move speed" },
      { n: "Recon Screen", k: "notable", m: { speed: 10, crit: 5 }, d: "10% speed, 5% crit" },
      { n: "Escape Route", k: "small", m: { speed: 6, armor: 2 }, d: "6% speed, 2% armour" },
      { n: "Ghost Protocol", k: "keystone", m: { speed: 35, crit: 10, armor: -12 }, d: "35% speed, +10% crit, -12% armour" },
    ],
  },
  {
    id: "dr", name: "DRONE OPS", angle: 135, color: "#9fb3ff", icon: "⌁",
    blurb: "Machines that fight beside you.",
    nodes: [
      { n: "Ground Station", k: "small", m: { drone: 1 }, d: "+1 drone power" },
      { n: "Telemetry", k: "small", m: { drone: 1, crit: 2 }, d: "+1 drone power, 2% crit" },
      { n: "Loiter Time", k: "small", m: { drone: 1 }, d: "+1 drone power" },
      { n: "Orbit Pattern", k: "notable", m: { drone: 3, rate: 4 }, d: "+3 drone power, 4% rate" },
      { n: "Swarm Logic", k: "small", m: { drone: 2 }, d: "+2 drone power" },
      { n: "Laser Designator", k: "small", m: { crit: 4, drone: 1 }, d: "4% crit, +1 drone" },
      { n: "Relay Hop", k: "small", m: { drone: 1, xp: 4 }, d: "+1 drone, 4% XP" },
      { n: "Wing Pair", k: "notable", m: { drone: 4, dmg: 6 }, d: "+4 drone power, 6% damage" },
      { n: "Autonomous Kill", k: "small", m: { drone: 2, crit: 3 }, d: "+2 drone, 3% crit" },
      { n: "Drone Mother", k: "keystone", m: { drone: 12, dmg: -8 }, d: "+12 drone power, -8% personal damage" },
    ],
  },
  {
    id: "lo", name: "LOGISTICS", angle: 180, color: "#ffd166", icon: "▣",
    blurb: "Ammo, time, and the points to spend.",
    nodes: [
      { n: "Ammo Crate", k: "small", m: { mag: 8 }, d: "8% magazine" },
      { n: "Speed Loader", k: "small", m: { reload: 6 }, d: "6% reload" },
      { n: "Spare Barrel", k: "small", m: { reload: 5, rate: 2 }, d: "5% reload, 2% rate" },
      { n: "Supply Chain", k: "notable", m: { reload: 14, points: 1 }, d: "14% reload, +1 point per arena clear" },
      { n: "Pallet Drop", k: "small", m: { mag: 6, xp: 4 }, d: "6% magazine, 4% XP" },
      { n: "NAFI Run", k: "small", m: { points: 1 }, d: "+1 point per run" },
      { n: "Ordnance Handler", k: "small", m: { reload: 5, blast: 3 }, d: "5% reload, 3% blast" },
      { n: "Quartermaster", k: "notable", m: { xp: 14, points: 1 }, d: "14% XP, +1 point per clear" },
      { n: "Combat Resupply", k: "small", m: { mag: 7 }, d: "7% magazine" },
      { n: "War Chest", k: "keystone", m: { points: 3, xp: 25, dmg: -10 }, d: "+3 points per run, 25% XP, -10% damage" },
    ],
  },
  {
    id: "cm", name: "COMMAND", angle: 225, color: "#ff9ad5", icon: "✦",
    blurb: "Lead from the front. Everything is a little better.",
    nodes: [
      { n: "Briefing", k: "small", m: { dmg: 4, xp: 4 }, d: "4% damage, 4% XP" },
      { n: "NCO School", k: "small", m: { rate: 3, armor: 3 }, d: "3% rate, 3% armour" },
      { n: "Battle Drill", k: "small", m: { dmg: 5 }, d: "5% damage" },
      { n: "Command Presence", k: "notable", m: { dmg: 12, xp: 8 }, d: "12% damage, 8% XP" },
      { n: "Cross Training", k: "small", m: { rate: 3, reload: 3 }, d: "3% rate, 3% reload" },
      { n: "Staff Officer", k: "small", m: { xp: 10 }, d: "10% XP" },
      { n: "Rules of Engagement", k: "small", m: { crit: 3, dmg: 4 }, d: "3% crit, 4% damage" },
      { n: "War College", k: "notable", m: { crit: 10, dmg: 8 }, d: "10% crit, 8% damage" },
      { n: "AAR Loop", k: "small", m: { xp: 8, points: 1 }, d: "8% XP, +1 point/run" },
      { n: "Supreme Command", k: "keystone", m: { dmg: 20, crit: 12, rate: 8, hp: -10 }, d: "20% damage, +12% crit, +8% rate, -10% integrity" },
    ],
  },
];

/** Stable numeric key for a node. */
export const nodeKey = (branchId, i) => `${branchId}.${i}`;

/** Radius (in tree units) for ring index. */
const RING = (i) => 118 + i * 46;

/**
 * Build the graph: positions, edges, hub. Eight spokes at 45° steps, matching the board's conduits,
 * with cross-links between neighbouring branches mid-way so hybrid builds are possible.
 */
export function buildTree() {
  const nodes = [];
  const edges = [];
  const byId = new Map();

  const hub = {
    id: "hub", name: "COMMAND CORE", kind: "hub", branch: "hub",
    x: 0, y: 0, color: "#ffb347",
    desc: "The bay. Every branch starts here.",
    mods: {},
  };
  nodes.push(hub);
  byId.set(hub.id, hub);

  for (const b of BRANCHES) {
    const a0 = (b.angle * Math.PI) / 180;
    let prevId = "hub";
    b.nodes.forEach((n, i) => {
      const id = nodeKey(b.id, i);
      // gentle angular drift so the spokes read as forged, not stamped
      const drift = Math.sin(i * 1.7 + b.angle) * 0.055;
      const ang = a0 + drift;
      const r = RING(i);
      const node = {
        id, name: n.n, kind: n.k || "small", branch: b.id,
        x: Math.cos(ang) * r, y: Math.sin(ang) * r,
        color: b.color, desc: n.d,
        mods: n.m || {},
        index: i,
      };
      nodes.push(node);
      byId.set(id, node);
      edges.push([prevId, id]);
      prevId = id;
    });
  }

  // cross-links: mid-branch to mid-branch, one ring step at a time (hybrid paths)
  const order = BRANCHES.map((b) => b.id);
  for (let i = 0; i < order.length; i += 1) {
    const a = order[i];
    const b = order[(i + 1) % order.length];
    for (const ring of [3, 6]) {
      edges.push([nodeKey(a, ring), nodeKey(b, ring)]);
    }
  }

  return { nodes, edges, byId, hub };
}

export const TREE = buildTree();

/** Points a fresh profile starts with, and what a run is worth. */
export const TALENT_REWARD = { start: 6, perRun: 2, perClear: 6, perTwoLevels: 1, perBoss: 4 };

/** Fold allocated nodes into one modifier block. */
export function aggregate(allocated = []) {
  const acc = {
    dmg: 0, rate: 0, reload: 0, armor: 0, hp: 0, crit: 0, rangeDmg: 0,
    blast: 0, shieldPierce: 0, drone: 0, xp: 0, points: 0, speed: 0, heal: 0, mag: 0,
  };
  for (const id of allocated) {
    const n = TREE.byId.get(id);
    if (!n) continue;
    for (const [k, v] of Object.entries(n.mods || {})) {
      acc[k] = (acc[k] || 0) + Number(v || 0);
    }
  }
  return acc;
}

/** Multipliers the run actually reads. */
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

/** Is `id` adjacent to something already allocated (or the hub)? */
export function isFrontier(id, allocatedSet) {
  if (id === "hub") return false;
  const adj = TREE.edges.filter(([a, b]) => a === id || b === id);
  return adj.some(([a, b]) => (a === id ? b : a) === "hub" || allocatedSet.has(a) || allocatedSet.has(b));
}

/**
 * Cheapest chain from anything already allocated (the hub counts) to `id`.
 * Returns { path: [ids to buy, excluding owned], cost } or null when unreachable.
 */
export function pathTo(id, allocatedSet) {
  if (allocatedSet.has(id)) return { path: [], cost: 0 };
  const dist = new Map([["hub", 0]]);
  const prev = new Map();
  const queue = ["hub"];
  while (queue.length) {
    queue.sort((a, b) => (dist.get(a) ?? 1e9) - (dist.get(b) ?? 1e9));
    const cur = queue.shift();
    if (cur === id) break;
    for (const [a, b] of TREE.edges) {
      let next = null;
      if (a === cur) next = b;
      else if (b === cur) next = a;
      if (!next) continue;
      const stepCost = allocatedSet.has(next) || next === "hub" ? 0 : 1;
      const nd = (dist.get(cur) ?? 1e9) + stepCost;
      if (nd < (dist.get(next) ?? 1e9)) {
        dist.set(next, nd);
        prev.set(next, cur);
        queue.push(next);
      }
    }
    if (dist.size > TREE.nodes.length + 4) break;
  }
  if (!dist.has(id)) return null;
  const path = [];
  let cur = id;
  while (cur && cur !== "hub") {
    if (!allocatedSet.has(cur)) path.unshift(cur);
    cur = prev.get(cur);
  }
  return { path, cost: path.length };
}

/** Remove a node and anything that is only reachable through it. */
export function refund(id, allocatedSet) {
  const next = new Set(allocatedSet);
  next.delete(id);
  // re-derive reachability from the hub
  const reachable = new Set(["hub"]);
  const queue = ["hub"];
  while (queue.length) {
    const cur = queue.shift();
    for (const [a, b] of TREE.edges) {
      const other = a === cur ? b : b === cur ? a : null;
      if (!other || reachable.has(other)) continue;
      if (!next.has(other) && other !== "hub") continue;
      reachable.add(other);
      queue.push(other);
    }
  }
  for (const n of [...next]) if (!reachable.has(n)) next.delete(n);
  return next;
}

export function nodeById(id) { return TREE.byId.get(id) || null; }
export function branchOf(id) { return TREE.byId.get(id)?.branch || null; }
export function countAllocated(allocated) { return allocated.filter((id) => id !== "hub").length; }
