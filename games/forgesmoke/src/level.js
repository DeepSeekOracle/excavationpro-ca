/**
 * Level Module Contract & Arena Data Loader
 * Responsibilities: level loading from assets/levels/*.json, collision data, spawn points, bounds
 * @module level
 */

const FALLBACK_LEVELS = {
  arena1: {
    id: "arena1",
    name: "Perimeter",
    bounds: { width: 120, depth: 120, radius: 52 },
    playerSpawn: { x: 0, y: 0, z: 0 },
    spawns: [
      { id: "N", x: 0, z: -42, type: "enemy" },
      { id: "NE", x: 32, z: -28, type: "enemy" },
      { id: "NW", x: -32, z: -28, type: "enemy" },
      { id: "E", x: 42, z: 8, type: "enemy" },
      { id: "W", x: -42, z: 8, type: "enemy" },
    ],
    cover: [
      { id: "c1", x: -8, z: -10, w: 3.2, d: 1.2 },
      { id: "c2", x: 8, z: -10, w: 3.2, d: 1.2 },
      { id: "c3", x: 0, z: 10, w: 4.0, d: 1.4 },
    ],
  },
  arena2: {
    id: "arena2",
    name: "Breach Yard",
    bounds: { width: 130, depth: 130, radius: 56 },
    playerSpawn: { x: 0, y: 0, z: 0 },
    spawns: [
      { id: "N", x: 0, z: -46, type: "enemy" },
      { id: "S", x: 0, z: 46, type: "enemy" },
      { id: "E", x: 46, z: 0, type: "enemy" },
      { id: "W", x: -46, z: 0, type: "enemy" },
    ],
    cover: [
      { id: "b1", x: -12, z: -6, w: 3.5, d: 1.5 },
      { id: "b2", x: 12, z: 6, w: 3.5, d: 1.5 },
    ],
  },
  arena3: {
    id: "arena3",
    name: "Gunship Pad",
    bounds: { width: 140, depth: 140, radius: 60 },
    playerSpawn: { x: 0, y: 0, z: 0 },
    spawns: [
      { id: "N", x: 0, z: -50, type: "enemy" },
      { id: "NE", x: 38, z: -38, type: "enemy" },
      { id: "NW", x: -38, z: -38, type: "enemy" },
      { id: "SE", x: 38, z: 38, type: "enemy" },
      { id: "SW", x: -38, z: 38, type: "enemy" },
    ],
    cover: [
      { id: "p1", x: -14, z: -14, w: 3.0, d: 3.0 },
      { id: "p2", x: 14, z: -14, w: 3.0, d: 3.0 },
      { id: "p3", x: 0, z: 16, w: 4.5, d: 1.5 },
    ],
  },
};

const KEY_ALIASES = {
  "level-1": "arena1",
  perimeter: "arena1",
  arena1: "arena1",
  "level-2": "arena2",
  breach: "arena2",
  arena2: "arena2",
  "level-3": "arena3",
  gunship: "arena3",
  arena3: "arena3",
};

/**
 * Load a level by key from assets/levels/<key>.json with synchronous fallback
 * @param {string} key - Level identifier (e.g., 'arena1', 'perimeter', 'level-1')
 * @returns {Promise<Object>} Parsed level data
 */
export async function loadLevel(key = "arena1") {
  const canonical = KEY_ALIASES[String(key).toLowerCase()] || "arena1";
  if (typeof fetch === "function") {
    try {
      const res = await fetch(`./assets/levels/${canonical}.json`);
      if (res.ok) {
        const data = await res.json();
        return { key: canonical, ...data };
      }
    } catch (_) {}
  }
  return { key: canonical, ...(FALLBACK_LEVELS[canonical] || FALLBACK_LEVELS.arena1) };
}

/**
 * Get collision tilemap / cover boxes for physics
 * @param {Object} levelData - Data from loadLevel
 * @returns {Object} Collision data
 */
export function getCollisionMap(levelData = {}) {
  const bounds = getLevelBounds(levelData);
  const cols = 24;
  const rows = 24;
  const tileWidth = bounds.width / cols;
  const tileHeight = bounds.height / rows;
  const solid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const cover = Array.isArray(levelData.cover) ? levelData.cover : [];
  return { solid, tileWidth, tileHeight, cover };
}

/**
 * Get spawn points for entities
 * @param {Object} levelData - Data from loadLevel
 * @returns {Array} Array of {x, y, z, type} objects
 */
export function getSpawnPoints(levelData = {}) {
  const out = [];
  if (levelData.playerSpawn) {
    out.push({
      x: Number(levelData.playerSpawn.x) || 0,
      y: Number(levelData.playerSpawn.y) || 0,
      z: Number(levelData.playerSpawn.z) || 0,
      type: "player",
    });
  }
  const spawns = Array.isArray(levelData.spawns) ? levelData.spawns : [];
  for (const s of spawns) {
    out.push({
      id: s.id || "spawn",
      x: Number(s.x) || 0,
      y: Number(s.y ?? s.z) || 0,
      z: Number(s.z ?? s.y) || 0,
      type: s.type || "enemy",
    });
  }
  return out;
}

/**
 * Get level bounds
 * @param {Object} levelData - Data from loadLevel
 * @returns {{width: number, height: number, radius: number}} Level dimensions
 */
export function getLevelBounds(levelData = {}) {
  const b = levelData.bounds || {};
  const width = Number(b.width || b.w) || 120;
  const height = Number(b.depth || b.height || b.h) || 120;
  const radius = Number(b.radius) || Math.min(width, height) * 0.45;
  return { width, height, radius };
}
