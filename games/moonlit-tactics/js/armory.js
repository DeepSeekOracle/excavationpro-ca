import * as sfx from "./sfx.js?v=20261007-buttons";
import { bindTerrain, drawTop, drawCliffs, liftOf } from "./ground.js?v=6";
import { drawFightFx, drawImpactFx } from "./fx.js?v=20261008-aura";

const COLS = 8;
const ROWS = 8;
const OVERLAYS = { slash: 280, bolt: 460, arc: 360, breath: 420, self: 320, heal: 460 };

let started = false;
let host = null;
let onResize = null;
let book = null;
let images = new Map();
let missing = new Set();
let state = null;
let frame = 0;

function $(id) {
  return document.getElementById(id);
}

function loadImage(src) {
  if (!src) return null;
  if (images.has(src)) return images.get(src);
  const img = new Image();
  img.src = src;
  img.addEventListener("error", () => missing.add(src));
  images.set(src, img);
  return img;
}

function ready(img) {
  return !!(img && img.complete && img.naturalWidth);
}

export function stop() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  started = false;
  if (onResize) {
    window.removeEventListener("resize", onResize);
    onResize = null;
  }
  document.querySelectorAll(".armory-dock").forEach((node) => node.remove());
  const party = $("party");
  if (party) party.innerHTML = "";
  const name = $("fc-name");
  const body = $("fc-body");
  if (name) name.textContent = "—";
  if (body) body.textContent = "Choose a tile.";
  const note = $("dock-note");
  if (note) note.textContent = "";
}

export function start(nextHost) {
  if (started) return;
  started = true;
  host = nextHost;
  state = {
    calling: "cantor",
    body: "serenya",
    stage: 0,
    lyraFallen: false,
    oneKettle: false,
    filter: "all",
    selected: null,
    gear: { weapon: null, off: null, head: null, body: null, accessory: null },
    note: "Serenya",
    fx: [],
    pops: [],
    shake: 0,
    wearer: { x: 1, y: 5, face: 0, hp: 1, maxHp: 1 },
    dummy: { x: 5, y: 1, face: 2, hp: 1, maxHp: 1 }
  };
  Promise.all([
    fetch("data/items.json").then((r) => r.json()),
    fetch("data/skills.json").then((r) => r.json()),
    fetch("data/styles.json").then((r) => r.json())
  ]).then(([items, skills, styles]) => {
    book = { items: items.items, skills: skills.skills, styles };
    for (const body of styles.bodies) loadImage(body.file);
    for (const name of ["meadow", "thicket", "path", "yard", "water", "rock"]) {
      bindTerrain(name, loadImage("assets/terrain/" + name + ".jpg?v=2"));
    }
    buildDock();
    renderLists();
    host.resize();
    onResize = () => host.resize();
    window.addEventListener("resize", onResize);
    loop();
  }).catch(() => {
    state.note = "catalog missing";
    $( "dock-note" ).textContent = state.note;
  });
}

function families() {
  const body = state.body;
  if (body === "shade") return [];
  if (body === "emberion") return ["claw"];
  if (body === "lyra" || body === "nessa") return ["staff"];
  if (body === "bram" || body === "miralis") return ["blade"];
  if (state.calling === "warden") return ["blade"];
  if (state.calling === "kindler") return ["brand"];
  return ["staff"];
}

function holderCheck(item) {
  const holders = item.holders;
  if (!holders) return null;
  if (Array.isArray(holders)) {
    return holders.indexOf(state.body) >= 0 ? null : holders[0];
  }
  const allowed = state.lyraFallen ? holders.after : holders.before;
  if (!allowed || allowed.indexOf(state.body) < 0) return (allowed && allowed[0]) || "holder";
  if (holders.requiresFamily && families().indexOf(holders.requiresFamily) < 0) return holders.requiresFamily;
  return null;
}

function equipSelected() {
  const row = selectedRow();
  if (!row || row.list !== "item") {
    state.note = "no equip";
    paintDock();
    return;
  }
  const item = row.row;
  if (state.body === "shade") {
    state.note = "shade";
    paintDock();
    return;
  }
  if (item.slot === "off" && state.oneKettle) {
    state.gear.off = null;
    state.note = "off";
    paintDock();
    renderLists();
    return;
  }
  if (!item.slot || !state.gear.hasOwnProperty(item.slot)) {
    state.note = item.kind;
    paintDock();
    return;
  }
  if (item.slot === "weapon") {
    const have = families();
    if (have.indexOf(item.family) < 0) {
      state.note = item.family || "family";
      paintDock();
      return;
    }
  }
  const held = holderCheck(item);
  if (held) {
    state.note = held;
    paintDock();
    return;
  }
  state.gear[item.slot] = item;
  state.note = item.id + " equipped";
  paintDock();
  renderLists();
}

function legalGear() {
  const have = families();
  const weapon = state.gear.weapon;
  if (weapon && (state.body === "shade" || have.indexOf(weapon.family) < 0 || holderCheck(weapon))) {
    state.gear.weapon = null;
  }
  if (state.gear.body && holderCheck(state.gear.body)) state.gear.body = null;
  if (state.oneKettle) state.gear.off = null;
}

function selectedRow() {
  if (!state.selected || !book) return null;
  const pool = state.selected.list === "skill" ? book.skills : book.items;
  const row = pool.find((r) => r.id === state.selected.id);
  return row ? { list: state.selected.list, row } : null;
}

function overlayOf(row, list) {
  if (list === "skill") return row.overlay;
  if (row.kind === "weapon") {
    const fam = book.styles.families[row.family];
    return fam ? fam.overlay : "slash";
  }
  return row.overlay || null;
}

function soundOf(row, list) {
  if (list === "skill") {
    if (row.overlay === "heal") return "seal";
    if (row.element === "fracture") return "fracture";
    if (row.sfx === "claw" || row.sfx === "seal" || row.sfx === "fracture" || row.sfx === "bronze") return row.sfx;
    return "bronze";
  }
  if (row.kind === "weapon") {
    const fam = book.styles.families[row.family];
    if (fam && fam.sfx === "claw") return "claw";
    const el = book.styles.elements[row.element] || book.styles.elements.none;
    return el.sfx;
  }
  if (row.overlay === "heal") return "seal";
  return "bronze";
}

function platePath(row, list) {
  if (!row || list !== "item") return null;
  if (row.plate) return row.plate;
  return null;
}

function playSelected() {
  const picked = selectedRow();
  if (!picked) return;
  const row = picked.row;
  if (picked.list === "item" && row.kind === "key") return;
  if (picked.list === "item" && (row.slot === "head" || row.slot === "body" || row.slot === "accessory")) {
    const path = platePath(row, "item");
    if (path) loadImage(path);
    state.note = row.id + " · " + (row.overlay || "none") + " · " + soundOf(row, "item") + (path && missing.has(path) ? " plate missing." : "");
    paintDock();
    renderLists();
    return;
  }
  const overlay = overlayOf(row, picked.list);
  if (!overlay || !OVERLAYS[overlay]) {
    state.note = row.id + " · none · " + soundOf(row, picked.list);
    paintDock();
    return;
  }
  const snd = soundOf(row, picked.list);
  const m = host.metrics();
  const from = screenOf(state.wearer, m);
  const toUnit = overlay === "heal" || row.target === "ally" || row.target === "self" ? state.wearer : state.dummy;
  const to = screenOf(toUnit, m);
  const fx = {
    kind: overlay,
    style: snd,
    t0: performance.now(),
    dur: OVERLAYS[overlay],
    from,
    to,
    radius: picked.list === "item" && row.family === "spear" ? 1.4 : 1,
    slide: row.shape === "line",
    resolved: overlay === "self",
    impactT: overlay === "self" ? performance.now() : 0,
    shook: false
  };
  state.fx.push(fx);
  sfx.launch(snd);
  if (overlay === "self") sfx.impact(snd, false);
  const power = row.power == null ? 0 : row.power;
  const heal = overlay === "heal";
  state.pops.push({
    x: to.x,
    y: to.y - 18,
    text: heal ? "+" + power : String(power),
    heal,
    t0: performance.now()
  });
  if (overlay === "slash" || overlay === "bolt" || overlay === "arc" || overlay === "breath") state.shake = 5;
  const path = platePath(row, picked.list);
  if (path) loadImage(path);
  state.note = row.id + " · " + overlay + " · " + snd + (path && missing.has(path) ? " plate missing." : "") + " preview, not a hit roll.";
  paintDock();
}

function buildDock() {
  const dock = document.querySelector("#battle .dock");
  const bar = document.createElement("div");
  bar.className = "armory-dock";
  bar.innerHTML = [
    '<label>Calling <select id="armory-calling"><option value="cantor">Cantor</option><option value="warden">Warden</option><option value="kindler">Kindler</option></select></label>',
    '<label>Body <select id="armory-body"></select></label>',
    '<label>Stage <select id="armory-stage"><option>0</option><option>1</option><option>2</option></select></label>',
    '<label><input id="armory-lyra" type="checkbox"> Lyra has fallen</label>',
    '<label><input id="armory-kettle" type="checkbox"> One Kettle</label>',
    '<button type="button" id="armory-equip" class="cmd">Equip</button>',
    '<button type="button" id="armory-play" class="cmd">Play</button>',
    '<button type="button" id="armory-menu" class="cmd">Menu</button>'
  ].join("");
  dock.appendChild(bar);
  const menu = $("armory-menu");
  if (menu && host.onMenu) menu.addEventListener("click", () => {
    const go = host.onMenu;
    stop();
    go();
  });
  const bodySel = $("armory-body");
  for (const body of book.styles.bodies) {
    const opt = document.createElement("option");
    opt.value = body.id;
    opt.textContent = body.id;
    bodySel.appendChild(opt);
  }
  $("armory-calling").addEventListener("change", (ev) => {
    state.calling = ev.target.value;
    legalGear();
    renderLists();
  });
  bodySel.addEventListener("change", (ev) => {
    state.body = ev.target.value;
    if (state.body !== "emberion") {
      state.stage = 0;
      $("armory-stage").value = "0";
    }
    legalGear();
    renderLists();
  });
  $("armory-stage").addEventListener("change", (ev) => {
    state.stage = Number(ev.target.value) || 0;
  });
  $("armory-lyra").addEventListener("change", (ev) => {
    state.lyraFallen = ev.target.checked;
    legalGear();
    renderLists();
  });
  $("armory-kettle").addEventListener("change", (ev) => {
    state.oneKettle = ev.target.checked;
    if (state.oneKettle) state.gear.off = null;
    renderLists();
  });
  $("armory-equip").addEventListener("click", equipSelected);
  $("armory-play").addEventListener("click", playSelected);
  $("fight-kicker").textContent = "Armory";
}

function rowsForFilter() {
  const f = state.filter;
  const items = book.items.filter((item) => {
    if (f === "all" || f === "item") return true;
    if (f === "skill") return false;
    return item.kind === f || item.slot === f;
  });
  const skills = f === "all" || f === "skill" ? book.skills : [];
  if (f !== "all" && f !== "skill" && f !== "item") return { items, skills: [] };
  return { items: f === "skill" ? [] : items, skills };
}

function renderLists() {
  if (!book) return;
  const party = $("party");
  party.innerHTML = "";
  const filters = document.createElement("div");
  filters.className = "armory-filters";
  for (const id of ["all", "weapon", "off", "head", "body", "accessory", "consumable", "key", "skill"]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = id;
    btn.className = state.filter === id ? "on" : "";
    btn.addEventListener("click", () => {
      state.filter = id;
      renderLists();
    });
    filters.appendChild(btn);
  }
  party.appendChild(filters);
  const worn = document.createElement("p");
  worn.className = "armory-worn";
  const g = state.gear;
  worn.textContent = "Serenya · " + state.body + " · " + families().join("/") +
    " · " + ["weapon", "off", "head", "body", "accessory"].map((s) => s + " " + (g[s] ? g[s].id : "—")).join(" · ");
  party.appendChild(worn);
  const list = document.createElement("ul");
  list.className = "armory-list";
  const pack = rowsForFilter();
  for (const item of pack.items) list.appendChild(rowButton("item", item));
  for (const skill of pack.skills) list.appendChild(rowButton("skill", skill));
  party.appendChild(list);
  renderForecast();
  paintDock();
  $("armory-stage").disabled = state.body !== "emberion";
}

function rowButton(list, row) {
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.armoryId = row.id;
  btn.dataset.armoryList = list;
  const on = state.selected && state.selected.id === row.id && state.selected.list === list;
  if (on) btn.className = "on";
  btn.textContent = row.name;
  btn.addEventListener("click", () => {
    state.selected = { list, id: row.id };
    renderLists();
  });
  li.appendChild(btn);
  return li;
}

function renderForecast() {
  const name = $("fc-name");
  const body = $("fc-body");
  const picked = selectedRow();
  if (!picked) {
    name.textContent = "Serenya";
    body.textContent = "Pick a row. Equip writes a preview. Play shows the overlay.";
    return;
  }
  const row = picked.row;
  name.textContent = row.name;
  const overlay = overlayOf(row, picked.list) || "none";
  const price = row.price == null ? "—" : row.price + " Embers";
  const sell = row.sellable ? "sell " + Math.floor((row.price || 0) / 2) : "not sold";
  const resist = row.resist ? " resist " + row.resist.element + " " + row.resist.amount + " floor " + row.resist.floor : "";
  const mods = row.mods ? " " + Object.keys(row.mods).filter((k) => row.mods[k]).map((k) => k + " " + row.mods[k]).join(" ") : "";
  body.textContent = row.id + " · " + (row.family || "family null") + " · " + (row.element || "none") +
    " · " + overlay + " · " + price + " · " + sell + resist + mods + " · " + soundOf(row, picked.list);
}

function paintDock() {
  const note = $("dock-note");
  if (!note) return;
  note.textContent = state.note;
}

function metrics() {
  return host.metrics();
}

function cellPos(x, y) {
  const m = metrics();
  return {
    cx: m.originX + (x - y) * (m.TW / 2),
    cy: m.originY + (x + y) * (m.TH / 2)
  };
}

function screenOf(u, m) {
  const p = {
    cx: m.originX + (u.x - u.y) * (m.TW / 2),
    cy: m.originY + (u.x + u.y) * (m.TH / 2)
  };
  return { x: p.cx, y: p.cy - m.TH * 0.35 };
}

function bodyDef() {
  return book.styles.bodies.find((b) => b.id === state.body);
}

function drawBoard() {
  const m = metrics();
  const canvas = $("board");
  const ctx = canvas.getContext("2d");
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const dpr = canvas.width / Math.max(1, w);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.save();
  if (state.shake > 0.4) {
    ctx.translate((Math.random() - 0.5) * state.shake * 2, (Math.random() - 0.5) * state.shake * 2);
    state.shake *= 0.86;
  }
  const tiles = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) tiles.push({ x, y });
  }
  tiles.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const groundElev = (x, y) => (x + y > 12 ? 0 : 1);
  for (const t of tiles) {
    const p = cellPos(t.x, t.y);
    const elev = groundElev(t.x, t.y);
    const scenic = elev === 0 ? "water" : "meadow";
    drawTop(ctx, p.cx, p.cy - liftOf(elev, m.TH), m.TW, m.TH, scenic);
  }
  for (const t of tiles) {
    const p = cellPos(t.x, t.y);
    const elev = groundElev(t.x, t.y);
    const east = t.x + 1 >= COLS ? elev : groundElev(t.x + 1, t.y);
    const south = t.y + 1 >= ROWS ? elev : groundElev(t.x, t.y + 1);
    drawCliffs(ctx, p.cx, p.cy, m.TW, m.TH, elev, east, south);
  }
  drawStandee(ctx, m, state.wearer, true);
  drawStandee(ctx, m, state.dummy, false);
  drawFx(ctx, m);
  ctx.restore();
}

function diamond(ctx, cx, cy, tw, th) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - th / 2);
  ctx.lineTo(cx + tw / 2, cy);
  ctx.lineTo(cx, cy + th / 2);
  ctx.lineTo(cx - tw / 2, cy);
  ctx.closePath();
}

function drawStandee(ctx, m, u, wearer) {
  const p = cellPos(u.x, u.y);
  const spec = wearer ? bodyDef() : book.styles.bodies.find((b) => b.id === "shade");
  const img = loadImage(spec.file);
  const stage = wearer && state.body === "emberion" ? (spec.stageScale ? spec.stageScale[state.stage] : 1) : 1;
  const h = (spec.drawHeight === "TH*2.45" ? m.TH * 2.45 : m.TH * 2.15) * stage;
  const ratio = ready(img) ? img.naturalWidth / img.naturalHeight : (spec.box.w / spec.box.h);
  const dw = h * ratio;
  const footY = p.cy + m.TH / 2 - 6;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(p.cx, footY, m.TW * 0.28, m.TH * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(p.cx, footY);
  if (u.face === 0 || u.face === 1) ctx.scale(-1, 1);
  if (wearer && state.body === "shade") {
    const tint = spec.enemies && spec.enemies["shade-beast"];
    if (tint && tint.alpha) ctx.globalAlpha = tint.alpha;
  }
  if (ready(img)) ctx.drawImage(img, -dw / 2, -h, dw, h);
  else if (spec.file && missing.has(spec.file)) flagMissing(spec.file);
  if (wearer) drawPlates(ctx, spec, dw, h);
  ctx.restore();
  const bw = m.TW * 0.7;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(p.cx - bw / 2, footY + 6, bw, 4);
  ctx.fillStyle = wearer ? "#8fd0c8" : "#e07a68";
  ctx.fillRect(p.cx - bw / 2, footY + 6, bw, 4);
}

function flagMissing(src) {
  if (!src || !missing.has(src)) return;
  if (state.note.indexOf("plate missing") >= 0) return;
  state.note += " plate missing.";
  paintDock();
}

function drawPlates(ctx, spec, dw, h) {
  if (state.body !== "emberion" && state.body !== "shade") {
    const mantle = state.gear.body && state.gear.body.id === "ash-mantle";
    const wardrobeId = mantle ? null : wardrobeFor();
    if (mantle && state.gear.body.plate) {
      const img = loadImage(state.gear.body.plate);
      if (ready(img)) ctx.drawImage(img, -dw / 2, -h, dw, h);
      else if (missing.has(state.gear.body.plate)) flagMissing(state.gear.body.plate);
    } else if (wardrobeId) {
      const ward = book.styles.wardrobes.find((w) => w.id === wardrobeId);
      if (ward) {
        const img = loadImage(ward.file);
        if (ready(img)) ctx.drawImage(img, -dw / 2, -h, dw, h);
        else if (missing.has(ward.file)) flagMissing(ward.file);
      }
    }
  }
  const weapon = state.gear.weapon;
  if (weapon && spec.anchors && spec.anchors.weapon) {
    blitPlate(ctx, weapon, spec, dw, h, "weapon");
  }
  const off = state.gear.off;
  if (off && !state.oneKettle && spec.anchors && spec.anchors.off) {
    blitPlate(ctx, off, spec, dw, h, "off");
  }
}

function wardrobeFor() {
  const spec = bodyDef();
  if (!spec || !spec.wardrobe || !spec.wardrobe.length) return null;
  if (spec.wardrobe.indexOf(state.calling) >= 0 && (state.body === "serenya" || state.body === "recruit")) return state.calling;
  return spec.wardrobe[0];
}

function blitPlate(ctx, item, spec, dw, h, anchorName) {
  if (!item.plate) return;
  const img = loadImage(item.plate);
  if (!ready(img)) {
    if (missing.has(item.plate)) flagMissing(item.plate);
    return;
  }
  const anchor = spec.anchors[anchorName];
  const fx = anchor[0];
  const fy = anchor[1];
  const ph = anchorName === "off" ? h * (spec.shieldDraw || 0.18) : (spec.clawDrawOfDw ? dw * spec.clawDrawOfDw : h * (spec.weaponDraw || 0.22));
  const pw = ph * (img.naturalWidth / img.naturalHeight);
  const x = -dw / 2 + fx * dw - pw / 2;
  const y = -h + fy * h - ph / 2;
  ctx.drawImage(img, x, y, pw, ph);
  if (item.recolor) {
    const tintId = item.plateTint || item.element || "none";
    const tint = (book.styles.elements[tintId] || book.styles.elements.none).tint;
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = tint;
    ctx.fillRect(x, y, pw, ph);
    ctx.restore();
  }
}

function drawFx(ctx, m) {
  const now = performance.now();
  for (const fx of state.fx) {
    const p = Math.min(1, (now - fx.t0) / fx.dur);
    drawFightFx(ctx, fx, p, m.TW, m.TH);
    if (p >= 1 && !fx.resolved) {
      fx.resolved = true;
      fx.impactT = now;
      sfx.impact(fx.style, false);
    }
    if (fx.resolved) drawImpactFx(ctx, fx, now);
  }
  state.fx = state.fx.filter((fx) => now - fx.t0 < fx.dur + 420);
  ctx.save();
  ctx.font = "700 22px Syne, Georgia, serif";
  ctx.textAlign = "center";
  for (const pop of state.pops) {
    const age = (now - pop.t0) / 700;
    if (age >= 1) continue;
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = pop.heal ? "#8fd0c8" : "#f4efe4";
    ctx.fillText(pop.text, pop.x, pop.y - age * 36);
  }
  ctx.restore();
  state.pops = state.pops.filter((pop) => now - pop.t0 < 700);
}

function loop() {
  drawBoard();
  frame = requestAnimationFrame(loop);
}
