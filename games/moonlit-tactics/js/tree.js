import { familiesOf, layers, unequip } from "./inventory.js";

const STATS = ["hp", "mp", "atk", "def", "mag", "res", "spd", "acc", "eva", "luck", "hum", "accord"];
const STAT_LABEL = {
  maxHp: "HP", maxMp: "MP", hp: "HP", mp: "MP", atk: "ATK", def: "DEF", mag: "MAG", res: "RES",
  spd: "SPD", acc: "ACC", eva: "EVA", luck: "LUCK", hum: "HUM", accord: "ACCORD"
};
const OPS = ["stat", "grantSkill", "powerOverride", "family", "silenceExempt", "lockOffhand"];

let mounted = null;

export function unmountWheel() {
  if (mounted) mounted();
}

function owns(member, id) {
  if (!member || !id) return false;
  if (member.anchor === id) return true;
  return (member.taken || []).indexOf(id) >= 0;
}

export function unspent(member) {
  if (!member) return 0;
  return (member.measures || 0) - ((member.taken || []).length);
}

export function validateTree(json) {
  if (!json || !Array.isArray(json.nodes) || !Array.isArray(json.anchors)) return "shape";
  if (json.nodes.length !== 90 || json.anchors.length !== 3) return "count";
  const kinds = { small: 0, notable: 0, keystone: 0 };
  const ids = {};
  json.anchors.forEach((row) => {
    if (!row.id || ids[row.id]) return;
    ids[row.id] = "anchor";
  });
  if (Object.keys(ids).length !== 3) return "anchor";
  for (const row of json.nodes) {
    if (!row.id || ids[row.id] || !kinds.hasOwnProperty(row.kind)) return "id";
    ids[row.id] = row.kind;
    kinds[row.kind] += 1;
    if (!Array.isArray(row.requires) || !row.requires.length) return "requires";
    if (!Array.isArray(row.ops)) return "ops";
    for (const op of row.ops) {
      if (!op || OPS.indexOf(op.op) < 0) return "op";
      if (op.op === "stat") {
        if (STATS.indexOf(op.stat) < 0 && op.stat !== "maxHp" && op.stat !== "maxMp") return "stat";
        if (!Number.isInteger(op.n) || op.n < -8 || op.n > 8) return "stat-n";
      }
      if (op.op === "powerOverride" && (!op.id || !Number.isInteger(op.n) || op.n < 1 || op.n > 200)) return "power";
      if ((op.op === "grantSkill" || op.op === "family" || op.op === "silenceExempt") && !op.id) return "id-op";
    }
  }
  if (kinds.small !== 68 || kinds.notable !== 18 || kinds.keystone !== 4) return "kinds";
  for (const row of json.nodes) {
    if (row.requires.some((id) => !ids[id])) return "missing";
  }
  return "";
}

export function prepareTree(json) {
  if (validateTree(json)) return null;
  const byId = {};
  json.anchors.forEach((row) => {
    byId[row.id] = { id: row.id, name: row.name, kind: "anchor", x: row.x, y: row.y, calling: row.calling, requires: [], ops: [] };
  });
  json.nodes.forEach((row) => { byId[row.id] = row; });
  const extra = [];
  (json.extensions || []).forEach((ext) => {
    if (!ext || ext.locked !== false || !Array.isArray(ext.nodes)) return;
    ext.nodes.forEach((row) => {
      if (!row || !row.id || byId[row.id]) return;
      if (row.kind !== "small" && row.kind !== "notable" && row.kind !== "keystone") return;
      if (!Array.isArray(row.requires) || !row.requires.length) return;
      if (row.requires.some((id) => !byId[id])) return;
      if (!Array.isArray(row.ops)) return;
      byId[row.id] = row;
      extra.push(row);
    });
  });
  return { id: json.id, anchors: json.anchors, nodes: json.nodes, extra, byId, list: json.nodes.concat(extra) };
}

export function route(book, anchorId, goalId) {
  if (!book || !book.byId[anchorId] || !book.byId[goalId]) return null;
  const dist = {};
  const prev = {};
  const queue = [];
  book.list.forEach((row) => {
    if (row.requires.indexOf(anchorId) >= 0) {
      dist[row.id] = 1;
      prev[row.id] = anchorId;
      queue.push(row.id);
    }
  });
  while (queue.length) {
    const id = queue.shift();
    if (id === goalId) break;
    book.list.forEach((row) => {
      if (dist[row.id] != null) return;
      if (row.requires.indexOf(id) >= 0) {
        dist[row.id] = dist[id] + 1;
        prev[row.id] = id;
        queue.push(row.id);
      }
    });
  }
  if (dist[goalId] == null) return null;
  const out = [];
  let cursor = goalId;
  while (cursor && cursor !== anchorId) {
    out.push(cursor);
    cursor = prev[cursor];
  }
  out.reverse();
  return out;
}

export function shortest(book, anchorId, goalId) {
  const steps = route(book, anchorId, goalId);
  return steps ? steps.length : null;
}

export function lit(node, member) {
  if (!node || !member) return false;
  if (node.kind === "anchor") return member.anchor === node.id;
  if ((member.taken || []).indexOf(node.id) >= 0) return true;
  return (node.requires || []).some((id) => owns(member, id));
}

export function offLocked(member, book) {
  if (!member || !book) return false;
  return (member.taken || []).some((id) => {
    const node = book.byId[id];
    return node && (node.ops || []).some((op) => op.op === "lockOffhand");
  });
}

export function powerOf(member, book, skillId, base) {
  let power = base;
  if (!member || !book) return power;
  (member.taken || []).forEach((id) => {
    const node = book.byId[id];
    (node && node.ops || []).forEach((op) => {
      if (op.op === "powerOverride" && op.id === skillId) power = op.n;
    });
  });
  return power;
}

function addUnique(list, id) {
  if (id && list.indexOf(id) < 0) list.push(id);
}

export function deriveMember(slot, member, calling, book, itemsById) {
  if (!member) return member;
  const families = [];
  const known = [];
  if (calling && calling.family) addUnique(families, calling.family);
  (calling && calling.known || []).forEach((id) => addUnique(known, id));
  (member.grants || []).forEach((id) => addUnique(known, id));
  (member.taken || []).forEach((id) => {
    const node = book && book.byId[id];
    (node && node.ops || []).forEach((op) => {
      if (op.op === "family") addUnique(families, op.id);
      if (op.op === "grantSkill") addUnique(known, op.id);
    });
  });
  member.weaponFamilies = families;
  member.known = known;
  const locked = offLocked(member, book);
  ["weapon", "off", "head", "body", "accessory"].forEach((slotName) => {
    const worn = member.equip && member.equip[slotName];
    if (!worn) return;
    if (slotName === "off" && locked) {
      unequip(slot, member.id, slotName);
      return;
    }
    const item = itemsById && itemsById[worn];
    if (item && item.family && familiesOf(member).indexOf(item.family) < 0) unequip(slot, member.id, slotName);
  });
  return member;
}

export function clampMember(slot, member, unit, calling, itemsById, book) {
  if (!member || !unit) return;
  const worn = layers(member, unit, calling, itemsById, book && book.byId).worn;
  if (member.hp != null && member.hp > worn.hp) member.hp = worn.hp;
  if (member.mp != null && member.mp > worn.mp) member.mp = worn.mp;
}

function fightOpen() {
  if (typeof document === "undefined") return false;
  const battle = document.getElementById("battle");
  return !!(battle && !battle.hidden && document.body.classList.contains("in-fight"));
}

export function canSpend(node, member, book) {
  if (!node || !member || !book || fightOpen()) return false;
  if (node.kind === "anchor") return false;
  if ((member.taken || []).indexOf(node.id) >= 0) return false;
  if (unspent(member) < 1) return false;
  return lit(node, member);
}

export function spend(slot, member, calling, node, book, itemsById, unit) {
  if (!canSpend(node, member, book)) return { ok: false, note: fightOpen() ? "fight" : "closed" };
  member.taken = (member.taken || []).concat(node.id);
  deriveMember(slot, member, calling, book, itemsById);
  clampMember(slot, member, unit, calling, itemsById, book);
  return { ok: true, note: node.name };
}

export function respec(slot, member, calling, book, itemsById, unit, cost) {
  if (fightOpen()) return { ok: false, note: "fight" };
  if (slot.embers < cost) return { ok: false, note: "embers" };
  if (slot.respecAtChapter === slot.chapterIndex) return { ok: false, note: "chapter" };
  slot.embers -= cost;
  slot.respecAtChapter = slot.chapterIndex;
  member.taken = [];
  deriveMember(slot, member, calling, book, itemsById);
  clampMember(slot, member, unit, calling, itemsById, book);
  return { ok: true, note: "Respec" };
}

function effectLines(node, skills) {
  return (node.ops || []).map((op) => {
    if (op.op === "stat") {
      const sign = op.n > 0 ? "+" : "";
      return sign + op.n + " " + (STAT_LABEL[op.stat] || op.stat);
    }
    const skill = skills && skills[op.id];
    const skillName = skill ? skill.name : op.id;
    if (op.op === "grantSkill") return "Grants " + skillName;
    if (op.op === "powerOverride") return skillName + " power " + op.n;
    if (op.op === "family") return "Family " + op.id;
    if (op.op === "silenceExempt") return skillName + " ignores Silence";
    if (op.op === "lockOffhand") return "The off hand stays empty";
    return "";
  }).filter(Boolean);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function svgEl(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

export function mountWheel(parent, opts) {
  unmountWheel();
  const book = opts.book;
  const skills = opts.skills || {};
  let member = opts.member;
  let selected = member && member.anchor;
  const view = { x: 0, y: 0, w: 1000, h: 1000 };
  const layout = el("div", "wheel-layout");
  const frame = el("div", "wheel-frame");
  const svg = svgEl("svg");
  svg.setAttribute("class", "wheel-svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  frame.appendChild(svg);
  const tools = el("div", "wheel-tools");
  const zoomIn = el("button", "cmd", "Closer");
  const zoomOut = el("button", "cmd", "Farther");
  zoomIn.type = "button";
  zoomOut.type = "button";
  tools.appendChild(zoomIn);
  tools.appendChild(zoomOut);
  frame.appendChild(tools);
  const side = el("div", "wheel-side");
  layout.appendChild(frame);
  layout.appendChild(side);
  parent.appendChild(layout);

  function applyView() {
    svg.setAttribute("viewBox", view.x + " " + view.y + " " + view.w + " " + view.h);
  }
  function zoom(factor) {
    const next = Math.max(280, Math.min(1200, view.w * factor));
    view.x += (view.w - next) / 2;
    view.y += (view.h - next) / 2;
    view.w = next;
    view.h = next;
    applyView();
    drawGraph();
  }
  zoomIn.addEventListener("click", () => zoom(0.85));
  zoomOut.addEventListener("click", () => zoom(1.18));
  svg.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    zoom(ev.deltaY > 0 ? 1.1 : 0.9);
  }, { passive: false });
  let drag = null;
  svg.addEventListener("pointerdown", (ev) => {
    if (ev.target.closest && ev.target.closest(".wheel-node")) return;
    drag = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y };
  });
  svg.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    const rect = svg.getBoundingClientRect();
    view.x = drag.vx - (ev.clientX - drag.x) * (view.w / rect.width);
    view.y = drag.vy - (ev.clientY - drag.y) * (view.h / rect.height);
    applyView();
  });
  function endDrag() { drag = null; }
  window.addEventListener("pointerup", endDrag);

  function callingOf(row) {
    return row && row.calling ? opts.callings[row.calling] : null;
  }
  function unitOf(row) {
    return row ? opts.units[row.id] : null;
  }

  function ownedNode(row) {
    if (!row || !member) return false;
    if (row.kind === "anchor") return member.anchor === row.id;
    return (member.taken || []).indexOf(row.id) >= 0;
  }

  function polar(row) {
    return {
      r: Math.hypot(row.x - 500, row.y - 500),
      a: Math.atan2(row.y - 500, row.x - 500)
    };
  }

  function drawGuides() {
    const guides = svgEl("g");
    guides.setAttribute("class", "wheel-guides");
    [320, 210, 120].forEach((radius) => {
      const ring = svgEl("circle");
      ring.setAttribute("class", "orbit");
      ring.setAttribute("cx", "500");
      ring.setAttribute("cy", "500");
      ring.setAttribute("r", radius);
      guides.appendChild(ring);
    });
    const rim = svgEl("circle");
    rim.setAttribute("class", "rim");
    rim.setAttribute("cx", "500");
    rim.setAttribute("cy", "500");
    rim.setAttribute("r", "424");
    guides.appendChild(rim);
    [-90, 30, 150].forEach((deg) => {
      const angle = (deg * Math.PI) / 180;
      const ray = svgEl("line");
      ray.setAttribute("class", "ray");
      ray.setAttribute("x1", "500");
      ray.setAttribute("y1", "500");
      ray.setAttribute("x2", Math.round(500 + 452 * Math.cos(angle)));
      ray.setAttribute("y2", Math.round(500 + 452 * Math.sin(angle)));
      guides.appendChild(ray);
    });
    svg.appendChild(guides);
  }

  function drawEdge(row, other) {
    const here = polar(row);
    const there = polar(other);
    const sameOrbit = Math.abs(here.r - there.r) < 14 && here.r > 40;
    const edge = sameOrbit ? svgEl("path") : svgEl("line");
    if (sameOrbit) {
      const radius = (here.r + there.r) / 2;
      let delta = there.a - here.a;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      const sweep = delta >= 0 ? 1 : 0;
      edge.setAttribute("d", "M " + row.x + " " + row.y + " A " + radius + " " + radius + " 0 0 " + sweep + " " + other.x + " " + other.y);
    } else {
      edge.setAttribute("x1", row.x);
      edge.setAttribute("y1", row.y);
      edge.setAttribute("x2", other.x);
      edge.setAttribute("y2", other.y);
    }
    const aOwned = ownedNode(row);
    const bOwned = ownedNode(other);
    const aOpen = row.kind === "anchor" ? aOwned : lit(row, member);
    const bOpen = other.kind === "anchor" ? bOwned : lit(other, member);
    let tone = "";
    if (aOwned && bOwned) tone = " owned";
    else if ((aOwned && bOpen) || (bOwned && aOpen)) tone = " ready";
    edge.setAttribute("class", "wheel-edge" + tone);
    svg.appendChild(edge);
  }

  function addMark(group, tag, className, attrs) {
    const mark = svgEl(tag);
    mark.setAttribute("class", className);
    Object.keys(attrs).forEach((key) => mark.setAttribute(key, attrs[key]));
    group.appendChild(mark);
  }

  function diamondPoints(row, size) {
    return [
      row.x, row.y - size,
      row.x + size, row.y,
      row.x, row.y + size,
      row.x - size, row.y
    ].join(" ");
  }

  function drawNode(row) {
    const group = svgEl("g");
    const classes = ["wheel-node", "kind-" + row.kind];
    if (ownedNode(row)) classes.push(row.kind === "anchor" ? "anchor" : "taken", "lit");
    else if (row.kind !== "anchor" && lit(row, member)) classes.push("lit");
    if (row.id === selected) classes.push("on");
    group.setAttribute("class", classes.join(" "));
    group.setAttribute("tabindex", "0");
    group.setAttribute("role", "button");
    group.dataset.id = row.id;
    group.setAttribute("aria-label", row.name);
    const halo = row.kind === "keystone" ? 22 : row.kind === "notable" ? 16 : row.kind === "anchor" ? 30 : 11;
    addMark(group, "circle", "hit", { cx: row.x, cy: row.y, r: row.kind === "anchor" ? 22 : 13 });
    if (row.id === selected) addMark(group, "circle", "halo", { cx: row.x, cy: row.y, r: halo });
    if (row.kind === "keystone") {
      addMark(group, "polygon", "frame", { points: diamondPoints(row, 14) });
      addMark(group, "polygon", "frame-inner", { points: diamondPoints(row, 7) });
    } else if (row.kind === "notable") {
      addMark(group, "circle", "frame", { cx: row.x, cy: row.y, r: 10 });
      addMark(group, "circle", "frame-inner", { cx: row.x, cy: row.y, r: 5 });
    } else if (row.kind === "anchor") {
      addMark(group, "circle", "frame", { cx: row.x, cy: row.y, r: 20 });
      addMark(group, "circle", "frame-inner", { cx: row.x, cy: row.y, r: 12 });
      addMark(group, "circle", "core", { cx: row.x, cy: row.y, r: 4 });
      if (view.w > 640) {
        const dx = row.x - 500;
        const dy = row.y - 500;
        const len = Math.hypot(dx, dy) || 1;
        const label = svgEl("text");
        label.setAttribute("x", Math.round(row.x + (dx / len) * 42));
        label.setAttribute("y", Math.round(row.y + (dy / len) * 42));
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "middle");
        label.textContent = row.name;
        group.appendChild(label);
      }
    } else {
      addMark(group, "circle", "frame", { cx: row.x, cy: row.y, r: 5.5 });
    }
    group.addEventListener("click", () => {
      selected = row.id;
      paint();
    });
    group.addEventListener("focus", () => {
      selected = row.id;
      paintSide();
    });
    svg.appendChild(group);
  }

  function drawGraph() {
    member = opts.memberOf ? opts.memberOf() : member;
    if (!selected || !book.byId[selected]) selected = member && member.anchor;
    svg.textContent = "";
    drawGuides();
    const seen = {};
    book.list.forEach((row) => {
      row.requires.forEach((id) => {
        const other = book.byId[id];
        if (!other) return;
        const key = [row.id, id].sort().join("|");
        if (seen[key]) return;
        seen[key] = true;
        drawEdge(row, other);
      });
    });
    book.anchors.map((row) => book.byId[row.id]).concat(book.list).forEach(drawNode);
  }

  function paint() {
    drawGraph();
    paintSide();
  }

  function paintSide() {
    const node = selected && book.byId[selected];
    side.textContent = "";
    side.appendChild(el("p", "kicker", "Wheel"));
    side.appendChild(el("p", "wheel-unspent", "Unspent Measures: " + unspent(member)));
    const worn = layers(member, unitOf(member), callingOf(member), opts.items, book.byId).worn;
    side.appendChild(el("p", "wheel-worn", "HP " + worn.hp + " · MP " + worn.mp));
    side.appendChild(el("p", "wheel-worn", "ATK " + worn.atk + " · DEF " + worn.def));
    side.appendChild(el("p", "wheel-worn", "MAG " + worn.mag + " · RES " + worn.res));
    if (node) {
      side.appendChild(el("h3", "wheel-name", node.name));
      side.appendChild(el("p", "wheel-kind", node.kind === "anchor" ? "Start" : node.kind));
      effectLines(node, skills).forEach((line) => side.appendChild(el("p", "wheel-effect", line)));
      if (node.kind === "anchor") side.appendChild(el("p", "wheel-effect", "The calling stands here. It is not bought."));
    } else {
      side.appendChild(el("p", "wheel-effect", "Choose a node."));
    }
    const spendBtn = el("button", "cmd", "Spend");
    spendBtn.type = "button";
    spendBtn.id = "wheel-spend";
    spendBtn.disabled = !node || !canSpend(node, member, book);
    spendBtn.addEventListener("click", () => trySpend(selected));
    side.appendChild(spendBtn);
    if (opts.respec && !opts.chainLock) {
      const cost = opts.respec.cost;
      const refund = el("button", "cmd", "Respec · " + cost);
      refund.type = "button";
      refund.id = "wheel-respec";
      refund.disabled = slotPoor(cost) || opts.slot.respecAtChapter === opts.slot.chapterIndex;
      refund.addEventListener("click", () => tryRespec(cost));
      side.appendChild(refund);
    }
    const back = el("button", "cmd", "Back");
    back.type = "button";
    back.id = opts.backId || "town-back";
    back.addEventListener("click", () => opts.onLeave());
    side.appendChild(back);
    const note = el("p", "wheel-note", opts.note || "");
    note.id = "wheel-note";
    side.appendChild(note);
  }

  function slotPoor(cost) {
    return opts.slot.embers < cost;
  }

  function trySpend(id) {
    const node = book.byId[id];
    const result = spend(opts.slot, member, callingOf(member), node, book, opts.items, unitOf(member));
    opts.note = result.ok ? "Spent " + result.note : result.note;
    if (opts.onChange) opts.onChange(opts.note);
    selected = id;
    paint();
  }

  function tryRespec(cost) {
    const backup = JSON.parse(JSON.stringify(opts.slot));
    const result = respec(opts.slot, member, callingOf(member), book, opts.items, unitOf(member), cost);
    if (!result.ok) {
      opts.note = result.note;
      paintSide();
      return;
    }
    if (opts.commit) {
      const error = opts.commit();
      if (error) {
        const restored = JSON.parse(backup);
        Object.keys(opts.slot).forEach((key) => delete opts.slot[key]);
        Object.assign(opts.slot, restored);
        opts.note = error;
        paint();
        return;
      }
    }
    opts.note = "Respec";
    if (opts.onChange) opts.onChange(opts.note);
    paint();
  }

  function onKey(ev) {
    if (ev.key === "Escape") {
      ev.preventDefault();
      ev.stopPropagation();
      opts.onLeave();
      return;
    }
    if (ev.key !== "Enter") return;
    const host = ev.target.closest && ev.target.closest(".wheel-node");
    if (!host) return;
    ev.preventDefault();
    ev.stopPropagation();
    trySpend(host.dataset.id);
  }

  window.addEventListener("keydown", onKey, true);
  mounted = () => {
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("pointerup", endDrag);
    mounted = null;
  };
  paint();
  const anchor = svg.querySelector(".wheel-node.anchor");
  if (anchor) anchor.focus();
  return mounted;
}
