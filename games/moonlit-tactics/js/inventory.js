const STATS = ["hp", "mp", "atk", "def", "mag", "res", "spd", "mov", "jump", "hum", "accord", "eva", "luck", "acc"];
const SLOTS = ["weapon", "off", "head", "body", "accessory"];
const DELTA = {
  maxHp: "hp", maxMp: "mp", hp: "hp", mp: "mp",
  atk: "atk", def: "def", mag: "mag", res: "res", spd: "spd",
  mov: "mov", jump: "jump", hum: "hum", accord: "accord", eva: "eva", luck: "luck", acc: "acc"
};
const MODMAP = {
  HP: "hp", MP: "mp", ATK: "atk", DEF: "def", MAG: "mag", RES: "res", SPD: "spd",
  MOV: "mov", JUMP: "jump", HUM: "hum", ACCORD: "accord", EVA: "eva", LUCK: "luck", ACC: "acc"
};

export function indexById(rows) {
  const map = {};
  (rows || []).forEach((row) => { map[row.id] = row; });
  return map;
}

export function emptyEquip() {
  return { weapon: null, off: null, head: null, body: null, accessory: null };
}

export function familiesOf(member) {
  if (!member || member.id === "shade") return [];
  if (member.id === "emberion") return ["claw"];
  return member.weaponFamilies || [];
}

export function nakedStats(unit, stage) {
  const out = {};
  STATS.forEach((key) => { out[key] = unit && unit[key] != null ? unit[key] : 0; });
  if (unit && Array.isArray(unit.stages)) {
    const row = unit.stages.find((s) => s.stage === stage) || unit.stages[0];
    if (row) STATS.forEach((key) => { if (row[key] != null) out[key] = row[key]; });
  }
  return out;
}

export function applyDelta(stats, delta) {
  const out = Object.assign({}, stats);
  if (!delta) return out;
  Object.keys(delta).forEach((key) => {
    const dest = DELTA[key];
    if (dest) out[dest] += delta[key];
  });
  return out;
}

export function applyGear(stats, equip, itemsById) {
  const out = Object.assign({}, stats);
  SLOTS.forEach((slot) => {
    const item = equip && equip[slot] && itemsById[equip[slot]];
    if (!item || !item.mods) return;
    Object.keys(item.mods).forEach((key) => {
      const dest = MODMAP[key];
      if (dest) out[dest] += item.mods[key];
    });
  });
  out.hum = Math.max(0, Math.min(100, out.hum));
  out.accord = Math.max(0, Math.min(100, out.accord));
  return out;
}

export function applyTaken(stats, member, nodesById) {
  const out = Object.assign({}, stats);
  if (!member || !nodesById) return out;
  (member.taken || []).forEach((id) => {
    const node = nodesById[id];
    (node && node.ops || []).forEach((op) => {
      if (op.op !== "stat") return;
      const dest = DELTA[op.stat];
      if (dest) out[dest] += op.n;
    });
  });
  return out;
}

export function layers(member, unit, calling, itemsById, nodesById) {
  const body = nakedStats(unit, member && member.stage != null ? member.stage : 0);
  const called = member && member.calling && calling ? applyDelta(body, calling.delta) : Object.assign({}, body);
  const built = applyTaken(called, member, nodesById);
  const worn = applyGear(built, member && member.equip, itemsById);
  return { body, called, worn };
}

export function newCoreSlot(calling) {
  return {
    version: 2,
    rng: { alg: "mulberry32", state: 1 },
    chapterIndex: 0,
    chapterId: "core",
    playtimeMs: 0,
    embers: 80,
    bag: [],
    flags: {
      roads: false,
      fastTravel: false,
      miralisTaken: false,
      lyraFallen: false,
      book1Clear: false
    },
    respecAtChapter: -1,
    visitedStones: [],
    huntsCleared: [],
    pos: null,
    pendingPlate: null,
    shadeAlive: true,
    page: null,
    cleared: [],
    party: [
      {
        id: "serenya",
        name: "Serenya",
        calling: calling.id,
        anchor: calling.anchor,
        weaponFamilies: [calling.family],
        measures: 0,
        taken: [],
        known: calling.known.slice(),
        grants: [],
        hp: null,
        mp: null,
        equip: { weapon: calling.weapon, off: null, head: null, body: null, accessory: null },
        statuses: []
      },
      {
        id: "emberion",
        name: "Emberion",
        calling: null,
        anchor: null,
        stage: 0,
        measures: 0,
        taken: [],
        known: ["claw-rend"],
        grants: [],
        hp: null,
        mp: null,
        equip: { weapon: "bronze-claw", off: null, head: null, body: null, accessory: null },
        statuses: []
      }
    ],
    bench: [],
    battle: null,
    battleCheckpoint: null
  };
}

export function bindCalling(slot, calling, unitsById, callingsById, itemsById, nodesById) {
  const member = slot.party.find((row) => row.id === "serenya");
  if (!member || !calling) return member;
  const previous = member.calling ? callingsById[member.calling] : null;
  const oldWorn = layers(member, unitsById.serenya, previous, itemsById, nodesById).worn;
  const hpRatio = member.hp == null || !oldWorn.hp ? 1 : member.hp / oldWorn.hp;
  const mpRatio = member.mp == null || !oldWorn.mp ? 1 : member.mp / oldWorn.mp;
  if (member.calling !== calling.id) member.taken = [];
  member.calling = calling.id;
  member.anchor = calling.anchor;
  member.weaponFamilies = [calling.family];
  member.known = calling.known.slice();
  if (member.equip.weapon && member.equip.weapon !== calling.weapon) {
    const worn = itemsById[member.equip.weapon];
    if (!worn || familiesOf(member).indexOf(worn.family) < 0) unequip(slot, "serenya", "weapon");
  }
  if (member.equip.weapon !== calling.weapon) {
    if (slot.bag.some((row) => row.id === calling.weapon && row.n > 0)) {
      equip(slot, "serenya", calling.weapon, itemsById);
    } else {
      member.equip.weapon = calling.weapon;
    }
  }
  const next = layers(member, unitsById.serenya, calling, itemsById, member.calling === calling.id ? nodesById : null).worn;
  member.hp = Math.min(next.hp, Math.max(1, Math.round(hpRatio * next.hp)));
  member.mp = Math.min(next.mp, Math.max(0, Math.round(mpRatio * next.mp)));
  return member;
}

export function fillVitals(slot, unitsById, callingsById, itemsById, nodesById) {
  slot.party.forEach((member) => {
    const unit = unitsById[member.id];
    const calling = member.calling ? callingsById[member.calling] : null;
    const worn = layers(member, unit, calling, itemsById, nodesById).worn;
    if (member.hp == null) member.hp = worn.hp;
    if (member.mp == null) member.mp = worn.mp;
    if (member.hp > worn.hp) member.hp = worn.hp;
    if (member.mp > worn.mp) member.mp = worn.mp;
  });
}

function memberOf(slot, memberId) {
  return slot.party.find((row) => row.id === memberId) || null;
}

function addOne(bag, id) {
  const row = bag.find((item) => item.id === id);
  if (row) row.n += 1;
  else bag.push({ id, n: 1 });
}

export function grantStack(slot, id, n) {
  const count = n || 1;
  for (let i = 0; i < count; i++) addOne(slot.bag, id);
}

function takeOne(bag, id) {
  const index = bag.findIndex((item) => item.id === id && item.n > 0);
  if (index < 0) return false;
  bag[index].n -= 1;
  if (bag[index].n <= 0) bag.splice(index, 1);
  return true;
}

function holderNote(item, member, flags) {
  const holders = item.holders;
  if (!holders) return null;
  if (Array.isArray(holders)) return holders.indexOf(member.id) >= 0 ? null : holders[0];
  const fallen = flags && flags.lyraFallen;
  const list = fallen ? (holders.after || []) : (holders.before || []);
  if (list.indexOf(member.id) < 0) return (list[0]) || (fallen ? "serenya" : "lyra");
  if (holders.requiresFamily && familiesOf(member).indexOf(holders.requiresFamily) < 0) return holders.requiresFamily;
  return null;
}

export function wearBlock(slot, memberId, itemId, itemsById) {
  const member = memberOf(slot, memberId);
  const item = itemsById[itemId];
  if (!member || !item) return "missing";
  if (item.kind === "consumable") return "use";
  if (item.kind === "key" || !item.slot) return "key";
  if (!Object.prototype.hasOwnProperty.call(member.equip, item.slot)) return item.kind || "slot";
  if (item.slot === "weapon") {
    const have = familiesOf(member);
    if (have.indexOf(item.family) < 0) return item.family || "family";
  }
  return holderNote(item, member, slot.flags) || "";
}

export function modText(item) {
  if (!item || !item.mods) return "";
  const parts = [];
  Object.keys(item.mods).forEach((key) => {
    const n = item.mods[key];
    if (!n) return;
    parts.push((n > 0 ? "+" : "") + n + " " + key);
  });
  if (item.resist && item.resist.element) parts.push("fracture resist");
  if (item.immune && item.immune.length) parts.push("silence immune");
  return parts.join(" ");
}

export function shopStock(itemsById, chapterIndex) {
  const chapter = Math.max(1, chapterIndex || 0);
  return Object.keys(itemsById).map((id) => itemsById[id]).filter((item) => {
    return item && item.sellable !== false && item.price > 0 && (item.chapter || 0) <= chapter && item.kind !== "key";
  }).sort((a, b) => (a.chapter - b.chapter) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

const CLAW_LADDER = ["bronze-claw", "grown-claw", "ascended-claw"];

export function ensureGrowth(slot) {
  const ember = slot && slot.party && slot.party.find((row) => row.id === "emberion");
  if (!ember || !ember.equip) return false;
  const stage = ember.stage || 0;
  const claw = stage >= 2 ? "ascended-claw" : stage >= 1 ? "grown-claw" : "bronze-claw";
  const worn = ember.equip.weapon;
  const at = CLAW_LADDER.indexOf(worn);
  const next = CLAW_LADDER.indexOf(claw);
  if (!worn || (at >= 0 && next > at)) {
    ember.equip.weapon = claw;
    return worn !== claw;
  }
  return false;
}

export function grantPage(slot, pageId, itemsById, drops) {
  const ids = drops && drops.pages && drops.pages[pageId];
  if (!ids || !ids.length) return [];
  if (!Array.isArray(slot.found)) slot.found = [];
  if (slot.found.indexOf(pageId) >= 0) return [];
  const names = [];
  ids.forEach((id) => {
    const item = itemsById[id];
    if (!item) return;
    const who = drops.equipIfEmpty && drops.equipIfEmpty[id];
    const member = who && slot.party.find((row) => row.id === who);
    if (member && item.slot && member.equip && !member.equip[item.slot] && !wearBlock(slot, who, id, itemsById)) {
      member.equip[item.slot] = id;
    } else addOne(slot.bag, id);
    names.push(item.name);
  });
  if (names.length) slot.found.push(pageId);
  return names;
}

export function spendOne(slot, itemId) {
  return takeOne(slot.bag, itemId);
}

export function hold(slot, itemId) {
  addOne(slot.bag, itemId);
}

export function unequip(slot, memberId, slotName) {
  const member = memberOf(slot, memberId);
  if (!member || !member.equip || !member.equip[slotName]) return { ok: false, note: "empty" };
  const prev = member.equip[slotName];
  member.equip[slotName] = null;
  addOne(slot.bag, prev);
  return { ok: true, note: prev };
}

export function equip(slot, memberId, itemId, itemsById) {
  const member = memberOf(slot, memberId);
  const item = itemsById[itemId];
  if (!member || !item) return { ok: false, note: "missing" };
  if (!slot.bag.some((row) => row.id === itemId && row.n > 0)) return { ok: false, note: "bag" };
  const block = wearBlock(slot, memberId, itemId, itemsById);
  if (block) return { ok: false, note: block };
  const prev = member.equip[item.slot];
  takeOne(slot.bag, itemId);
  if (prev) addOne(slot.bag, prev);
  member.equip[item.slot] = itemId;
  return { ok: true, note: itemId };
}

export function buy(slot, itemId, itemsById) {
  const item = itemsById[itemId];
  if (!item) return { ok: false, note: "missing" };
  const price = item.price || 0;
  if (slot.embers < price) return { ok: false, note: "embers" };
  slot.embers -= price;
  addOne(slot.bag, itemId);
  return { ok: true, note: String(price), embers: slot.embers };
}

export function restoreVitals(slot, unitsById, callingsById, itemsById, nodesById) {
  slot.party.forEach((member) => {
    const unit = unitsById[member.id];
    const calling = member.calling ? callingsById[member.calling] : null;
    const worn = layers(member, unit, calling, itemsById, nodesById).worn;
    member.hp = worn.hp;
    member.mp = worn.mp;
  });
}

export function rest(slot, cost, unitsById, callingsById, itemsById, nodesById) {
  if (slot.embers < cost) return { ok: false, note: "embers" };
  slot.embers -= cost;
  restoreVitals(slot, unitsById, callingsById, itemsById, nodesById);
  return { ok: true, note: String(cost), embers: slot.embers };
}

export function sell(slot, itemId, itemsById) {
  const item = itemsById[itemId];
  if (!slot.bag.some((row) => row.id === itemId && row.n > 0)) return { ok: false, note: "bag" };
  if (!item || item.sellable === false) return { ok: false, note: "sell" };
  const price = Math.floor((item.price || 0) / 2);
  takeOne(slot.bag, itemId);
  slot.embers += price;
  return { ok: true, note: String(price), embers: slot.embers };
}
