const SLICE_COLS = 14;
const SLICE_ROWS = 10;

function key(x, y) {
  return x + "," + y;
}

function addLine(into, x0, y0, x1, y1) {
  let x = x0;
  let y = y0;
  into.add(key(x, y));
  while (x !== x1 || y !== y1) {
    if (x !== x1) x += Math.sign(x1 - x);
    else y += Math.sign(y1 - y);
    into.add(key(x, y));
  }
}

export function roadKeys() {
  const cells = new Set();
  addLine(cells, 8, 19, 8, 10);
  addLine(cells, 8, 10, 18, 10);
  addLine(cells, 18, 10, 18, 4);
  addLine(cells, 18, 4, 28, 4);
  addLine(cells, 28, 4, 28, 11);
  addLine(cells, 28, 11, 25, 12);
  return cells;
}

export function roadSteps() {
  return roadKeys().size - 1;
}

function roll(x, y) {
  return Math.abs(x * 17 + y * 31) % 997;
}

function roadDist(road, x, y) {
  let best = 99;
  for (const id of road) {
    const comma = id.indexOf(",");
    const rx = Number(id.slice(0, comma));
    const ry = Number(id.slice(comma + 1));
    const dist = Math.max(Math.abs(x - rx), Math.abs(y - ry));
    if (dist < best) best = dist;
    if (best === 0) return 0;
  }
  return best;
}

export function buildOpeningMap() {
  const road = roadKeys();
  const cells = [];
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 40; x++) {
      const onRoad = road.has(key(x, y));
      const water = x >= 34 || y === 0;
      const shore = x === 33 && y > 0;
      const door = x === 8 && y === 20;
      const mine = x === 30 && y === 8;
      const mineYard = x === 30 && y === 9;
      const shade = x === 26 && y === 12;
      const yard = x >= 4 && x <= 14 && y >= 16 && y <= 26;
      const cottage = (x === 5 || x === 6) && (y === 22 || y === 23);
      const well = x === 12 && y === 21;
      const glade = x >= 3 && x <= 7 && y >= 5 && y <= 9;
      const shrine = x === 4 && y === 2;
      const ridgeCut = (x === 6 && y >= 1 && y <= 3) || (y === 2 && x >= 4 && x <= 6);
      const stair = x === 6 && y === 4;
      const ridge = y >= 2 && y <= 3 && x >= 2 && x <= 18;
      const plateau = x >= 29 && x <= 32 && y >= 6 && y <= 9;
      const bankWalk = x === 32 && y > 0;
      const shoreApproach = x >= 28 && x <= 32 && y >= 10 && y <= 16;
      let ground = "moss";
      let block = false;
      let place = "thicket";
      let scenic = "thicket";
      let elev = 1;
      let prop = "";
      if (water) {
        ground = "water";
        block = true;
        place = "bank";
        scenic = "water";
        elev = 0;
      } else if (shore) {
        block = true;
        place = "bank";
        scenic = "meadow";
        if (y % 4 === 1) prop = "reed";
      } else if (shade) {
        block = true;
        place = "thicket";
      } else if (mine) {
        ground = "stone";
        place = "mine mouth";
        scenic = "rock";
        elev = 2;
        prop = "mine";
      } else if (mineYard) {
        place = "mine mouth";
        scenic = "rock";
        elev = 2;
      } else if (onRoad) {
        place = "road";
        scenic = "path";
      } else if (cottage) {
        ground = "stone";
        block = true;
        place = "yard";
        scenic = "yard";
        if (x === 6 && y === 23) prop = "cottage";
      } else if (well) {
        ground = "stone";
        block = true;
        place = "yard";
        scenic = "yard";
        prop = "well";
      } else if (door || yard) {
        ground = "stone";
        place = "yard";
        scenic = "yard";
      } else if (shrine) {
        place = "standing stone";
        scenic = "meadow";
        elev = 2;
        prop = "stone";
      } else if (ridgeCut) {
        place = "ridge";
        scenic = "path";
        elev = 2;
      } else if (stair) {
        place = "ridge";
        scenic = "path";
      } else if (glade) {
        place = "glade";
        scenic = "meadow";
        if ((x === 5 && y === 7) || (x === 7 && y === 8)) prop = "flowers";
      } else if (plateau) {
        place = "mine mouth";
        scenic = "rock";
        elev = 2;
        if ((x === 29 && y === 6) || (x === 32 && y === 6) || (x === 32 && y === 9)) block = true;
      } else if (ridge) {
        place = "ridge";
        scenic = "thicket";
        elev = 2;
      } else if (bankWalk || shoreApproach) {
        place = "bank";
        scenic = "meadow";
        if (bankWalk && y % 6 === 0) prop = "reed";
      }
      if (!prop && !block && scenic === "thicket" && roadDist(road, x, y) > 1) {
        const n = roll(x, y);
        if (n % 4 === 0) {
          block = true;
          const kind = n % 3;
          prop = kind === 0 ? "oak" : kind === 1 ? "birch" : "pine";
        }
      }
      const cell = { x, y, ground, place, scenic, elev };
      if (block) cell.block = true;
      if (onRoad && !water) cell.road = true;
      if (door) cell.trigger = "hatchery-door";
      if (mine) cell.trigger = "mine-mouth";
      if (prop) cell.prop = prop;
      cells.push(cell);
    }
  }
  return {
    id: "opening",
    cols: 40,
    rows: 28,
    leave: { x: 8, y: 19 },
    actors: [{ id: "thicket-shade", x: 26, y: 12, sprite: "shade" }],
    reward: { id: "opening-thicket", row: "road", embers: 20, measures: 0, salve: 0.15, item: "mend-salve" },
    cells
  };
}

export function indexMap(doc) {
  const byKey = new Map();
  for (const cell of doc.cells) {
    byKey.set(key(cell.x, cell.y), {
      x: cell.x,
      y: cell.y,
      ground: cell.ground,
      block: cell.block === true,
      road: cell.road === true,
      trigger: cell.trigger || null,
      place: cell.place || "",
      scenic: cell.scenic || "meadow",
      elev: cell.elev == null ? 1 : cell.elev,
      prop: cell.prop || ""
    });
  }
  return { cols: doc.cols, rows: doc.rows, tiles: [...byKey.values()], byKey };
}

export function makeSliceWorld() {
  const tiles = [];
  const byKey = new Map();
  for (let y = 0; y < SLICE_ROWS; y++) {
    for (let x = 0; x < SLICE_COLS; x++) {
      const water = y === 0 || x === SLICE_COLS - 1 || (x > 9 && y > 7);
      const tile = { x, y, ground: water ? "water" : "moss", block: water, road: false, trigger: null, place: water ? "bank" : "thicket" };
      tiles.push(tile);
      byKey.set(key(x, y), tile);
    }
  }
  return {
    mode: "slice",
    cols: SLICE_COLS,
    rows: SLICE_ROWS,
    tiles,
    byKey,
    hero: { x: 2, y: 6, face: 0, sprite: "serenya" },
    pet: { x: 1, y: 7, face: 0, sprite: "emberion" },
    shade: { x: 10, y: 3, face: 2, sprite: "shade", alive: true },
    hover: null,
    fighting: false,
    suppress: null,
    camX: 0,
    camY: 0,
    camReady: true
  };
}

function parkPet(world) {
  const spots = [[0, -1], [-1, 0], [1, 0], [0, 1]];
  for (const [dx, dy] of spots) {
    const x = world.hero.x + dx;
    const y = world.hero.y + dy;
    const tile = world.byKey.get(key(x, y));
    if (!tile || tile.block || tile.trigger) continue;
    if (world.shade.alive && world.shade.x === x && world.shade.y === y) continue;
    world.pet.x = x;
    world.pet.y = y;
    return;
  }
}

export function makeRegionWorld(doc, spawn) {
  const map = indexMap(doc);
  const actor = (doc.actors || []).find((row) => row.id === "thicket-shade") || { x: 26, y: 12 };
  const world = {
    mode: "region",
    cols: map.cols,
    rows: map.rows,
    tiles: map.tiles,
    byKey: map.byKey,
    hero: { x: spawn.x, y: spawn.y, face: spawn.facing == null ? 2 : spawn.facing, sprite: "serenya" },
    pet: { x: spawn.x, y: spawn.y, face: 2, sprite: "emberion" },
    shade: { x: actor.x, y: actor.y, face: 2, sprite: "shade", alive: spawn.shadeAlive !== false },
    hover: null,
    fighting: false,
    suppress: { x: spawn.x, y: spawn.y },
    camX: 0,
    camY: 0,
    camReady: false
  };
  parkPet(world);
  return world;
}

export function isBlocked(world, x, y) {
  if (x < 0 || y < 0 || x >= world.cols || y >= world.rows) return true;
  const tile = world.byKey.get(key(x, y));
  if (!tile || tile.block) return true;
  if (world.shade.alive && world.shade.x === x && world.shade.y === y) return true;
  return false;
}

export function nearShade(world) {
  if (!world.shade.alive) return false;
  const d = Math.max(Math.abs(world.hero.x - world.shade.x), Math.abs(world.hero.y - world.shade.y));
  return d === 1;
}

export function stepWorld(world, x, y) {
  const prev = { x: world.hero.x, y: world.hero.y };
  world.hero.x = x;
  world.hero.y = y;
  if (!isBlocked(world, prev.x, prev.y)) {
    world.pet.x = prev.x;
    world.pet.y = prev.y;
  }
  const held = world.suppress && world.suppress.x === x && world.suppress.y === y;
  if (!held) world.suppress = null;
  const tile = world.byKey.get(key(x, y));
  return {
    town: !held && !!(tile && tile.trigger === "hatchery-door"),
    dungeon: !held && !!(tile && tile.trigger === "mine-mouth"),
    fight: !held && nearShade(world)
  };
}

export function placeHero(world, x, y, facing) {
  world.hero.x = x;
  world.hero.y = y;
  if (facing != null) world.hero.face = facing;
  world.suppress = { x, y };
  parkPet(world);
}

export function worldPath(world, tx, ty) {
  const start = key(world.hero.x, world.hero.y);
  const goal = key(tx, ty);
  if (start === goal) return [];
  const q = [{ x: world.hero.x, y: world.hero.y }];
  const prev = new Map();
  prev.set(start, null);
  while (q.length) {
    const n = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = n.x + dx;
      const y = n.y + dy;
      const id = key(x, y);
      if (prev.has(id) || isBlocked(world, x, y)) continue;
      prev.set(id, n);
      if (id === goal) {
        const path = [];
        let cur = { x, y };
        while (cur) {
          path.push(cur);
          cur = prev.get(key(cur.x, cur.y));
        }
        path.pop();
        path.reverse();
        return path;
      }
      q.push({ x, y });
    }
  }
  return null;
}

export function worldPathHome(world) {
  const spots = [];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = world.hero.x + dx;
    const y = world.hero.y + dy;
    if (isBlocked(world, x, y)) continue;
    const away = Math.abs(x - world.shade.x) + Math.abs(y - world.shade.y);
    spots.push({ x, y, away });
  }
  spots.sort((a, b) => b.away - a.away);
  return spots[0] || null;
}

export function diamondAABB(x, y, wTW, wTH, originX, originY) {
  const cx = originX + (x - y) * (wTW / 2);
  const cy = originY + (x + y) * (wTH / 2);
  return {
    cx,
    cy,
    left: cx - wTW / 2,
    right: cx + wTW / 2,
    top: cy - wTH / 2,
    bottom: cy + wTH / 2
  };
}

export function mapBounds(world, wTW, wTH, originX, originY) {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const tile of world.tiles) {
    const box = diamondAABB(tile.x, tile.y, wTW, wTH, originX, originY);
    if (box.left < left) left = box.left;
    if (box.right > right) right = box.right;
    if (box.top < top) top = box.top;
    if (box.bottom > bottom) bottom = box.bottom;
  }
  return { left, right, top, bottom };
}

export function clampCamera(camX, camY, bounds, viewW, viewH) {
  let x = camX;
  let y = camY;
  const maxX = bounds.right - viewW;
  const maxY = bounds.bottom - viewH;
  if (bounds.left <= maxX) x = Math.min(maxX, Math.max(bounds.left, x));
  else x = (bounds.left + bounds.right) / 2 - viewW / 2;
  if (bounds.top <= maxY) y = Math.min(maxY, Math.max(bounds.top, y));
  else y = (bounds.top + bounds.bottom) / 2 - viewH / 2;
  return { x, y };
}

export function heroCamera(world, wTW, wTH, originX, originY, viewW, viewH) {
  const hero = diamondAABB(world.hero.x, world.hero.y, wTW, wTH, originX, originY);
  const bounds = mapBounds(world, wTW, wTH, originX, originY);
  return clampCamera(hero.cx - viewW / 2, hero.cy - viewH / 2, bounds, viewW, viewH);
}

export function visibleTiles(world, wTW, wTH, originX, originY, camX, camY, viewW, viewH) {
  const out = [];
  for (const tile of world.tiles) {
    const box = diamondAABB(tile.x, tile.y, wTW, wTH, originX, originY);
    const left = box.left - camX;
    const right = box.right - camX;
    const top = box.top - camY;
    const bottom = box.bottom - camY;
    if (right < 0 || left > viewW || bottom < 0 || top > viewH) continue;
    out.push(tile);
  }
  return out;
}
