export const SAVE_KEY = "moonlit-tactics-save-v1";
export const UNKNOWN = "This save is from an unknown version and was not loaded.";

export function validDoc(doc) {
  if (!doc || doc.version !== 2 || !doc.settings || !Array.isArray(doc.slots) || doc.slots.length !== 3) return false;
  return doc.slots.every((slot) => slot === null || slot.version === 2);
}

export function readSave(storage) {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return { ok: true, doc: null };
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: UNKNOWN };
  }
  if (!validDoc(doc)) return { ok: false, error: UNKNOWN };
  return { ok: true, doc };
}

export function writeSave(storage, doc) {
  if (!validDoc(doc)) return false;
  storage.setItem(SAVE_KEY, JSON.stringify(doc));
  return true;
}

export const OPTIONS_KEY = "moonlit-tactics-options";
export const RADIO_KEY = "lygo_moonlit_tactics_radio";

export function defaultSettings() {
  return { music: 0.6, sfx: 0.8, reducedMotion: false, textSpeed: 1 };
}

export function readSettings(storage) {
  const settings = defaultSettings();
  const read = readSave(storage);
  if (read.ok && read.doc && read.doc.settings) Object.assign(settings, read.doc.settings);
  try {
    const extra = JSON.parse(storage.getItem(OPTIONS_KEY) || "null");
    if (extra && typeof extra === "object") Object.assign(settings, extra);
  } catch (err) { /* keep the document settings */ }
  return settings;
}

export function writeSettings(storage, patch) {
  const settings = Object.assign(defaultSettings(), readSettings(storage), patch || {});
  storage.setItem(OPTIONS_KEY, JSON.stringify(settings));
  storage.setItem(RADIO_KEY, String(settings.music));
  const read = readSave(storage);
  if (read.ok && read.doc) {
    read.doc.settings = settings;
    writeSave(storage, read.doc);
  }
  return settings;
}

export function callingSlot(doc) {
  if (!doc || !Array.isArray(doc.slots)) return -1;
  return doc.slots.findIndex((row) => row && row.party && row.party.some((unit) => unit.id === "serenya" && unit.calling));
}

export function editCallingSlot(storage, change) {
  const read = readSave(storage);
  if (!read.ok || !read.doc) return null;
  const index = callingSlot(read.doc);
  if (index < 0) return null;
  change(read.doc.slots[index]);
  writeSave(storage, read.doc);
  return read.doc.slots[index];
}

export function rememberCheckpoint(slot, pos) {
  const copy = JSON.parse(JSON.stringify(slot));
  copy.battleCheckpoint = null;
  copy.pendingPlate = null;
  copy.shadeAlive = true;
  copy.pos = { map: "opening", x: pos.x, y: pos.y, facing: pos.facing };
  slot.battleCheckpoint = copy;
  slot.pendingPlate = null;
  slot.pos = copy.pos;
}

export function restoreCheckpoint(slot, pos) {
  const saved = slot.battleCheckpoint;
  if (!saved) return false;
  slot.embers = saved.embers;
  slot.bag = saved.bag;
  slot.party = saved.party;
  slot.rng = saved.rng;
  slot.shadeAlive = true;
  slot.pendingPlate = null;
  slot.battleCheckpoint = null;
  slot.pos = pos || saved.pos;
  return true;
}

export function storeRoadWin(slot, roll, reward) {
  const pay = reward || { embers: 20, salve: 0.15, item: "mend-salve" };
  const salve = roll < pay.salve;
  slot.shadeAlive = false;
  slot.battleCheckpoint = null;
  slot.pendingPlate = {
    id: "opening-thicket",
    row: "road",
    embers: pay.embers,
    measures: [],
    items: salve ? [{ id: pay.item, n: 1 }] : [],
    applied: false
  };
}

export function confirmRoadPlate(slot, vitals) {
  const plate = slot.pendingPlate;
  if (!plate || plate.applied !== false) return null;
  slot.embers += plate.embers || 0;
  (plate.items || []).forEach((item) => {
    const row = slot.bag.find((entry) => entry.id === item.id);
    if (row) row.n += item.n || 1;
    else slot.bag.push({ id: item.id, n: item.n || 1 });
  });
  (vitals || []).forEach((row) => {
    const member = slot.party.find((unit) => unit.id === row.id);
    if (!member) return;
    member.hp = row.hp;
    member.mp = row.mp;
  });
  const paid = { embers: plate.embers || 0, items: plate.items || [] };
  slot.pendingPlate = null;
  return paid;
}

export function freshDocument(slot) {
  return {
    version: 2,
    settings: defaultSettings(),
    slots: [slot, null, null]
  };
}
