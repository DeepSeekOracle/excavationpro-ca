import { closeWindow, isOpen, openWindow } from "./window.js";
import { freshDocument, readSave, writeSave } from "./save.js";
import {
  bindCalling, equip, familiesOf, fillVitals, hold, indexById, layers, modText, newCoreSlot, sell, unequip, wearBlock
} from "./inventory.js";
import { deriveMember, mountWheel, offLocked, prepareTree, unmountWheel } from "./tree.js";

const SHOWN = ["hp", "mp", "atk", "def", "mag", "res"];
const SLOT_NAMES = [
  ["weapon", "Weapon"],
  ["off", "Off"],
  ["head", "Head"],
  ["body", "Body"],
  ["accessory", "Accessory"]
];

let books = null;
const sessionRef = { current: null };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

async function loadBooks() {
  if (books) return books;
  const [units, callings, items, skills, tree] = await Promise.all([
    fetch("data/units.json").then((res) => res.json()),
    fetch("data/callings.json").then((res) => res.json()),
    fetch("data/items.json").then((res) => res.json()),
    fetch("data/skills.json").then((res) => res.json()),
    fetch("data/tree.json").then((res) => res.json()).catch(() => null)
  ]);
  books = {
    units: indexById(units.units),
    callings: indexById(callings.callings),
    callingList: callings.callings,
    items: indexById(items.items),
    skills: indexById(skills.skills),
    tree: tree ? prepareTree(tree) : null
  };
  return books;
}

function paintWheel(session, root) {
  const serenya = session.slot.party.find((row) => row.id === "serenya");
  mountWheel(root, {
    book: books.tree,
    slot: session.slot,
    units: books.units,
    callings: books.callings,
    items: books.items,
    skills: books.skills,
    note: session.note,
    backId: "wheel-back",
    memberOf() { return session.slot.party.find((row) => row.id === "serenya") || serenya; },
    onLeave() {
      session.view = "card";
      session.paint();
    },
    onChange(note) { session.note = note; }
  });
}

function skillName(id) {
  const row = books.skills[id];
  return row ? row.name : id;
}

function itemName(id) {
  if (!id) return "Empty";
  const row = books.items[id];
  return row ? row.name : id;
}

function nodesOf() {
  return books.tree ? books.tree.byId : null;
}

function statGrid(member, unit, calling) {
  const view = layers(member, unit, calling, books.items, nodesOf());
  const grid = el("div", "card-stat");
  grid.appendChild(el("span", "card-stat-h", ""));
  ["Body", "Calling", "Worn"].forEach((label) => grid.appendChild(el("span", "card-stat-h", label)));
  SHOWN.forEach((key) => {
    grid.appendChild(el("span", "card-stat-k", key.toUpperCase()));
    ["body", "called", "worn"].forEach((layer) => {
      grid.appendChild(el("span", null, String(view[layer][key])));
    });
  });
  return grid;
}

function slotRow(session, member, slotName, label) {
  const row = el("div", "card-slot");
  const worn = member.equip[slotName];
  row.appendChild(el("span", null, label + " · " + itemName(worn)));
  if (worn) {
    const button = el("button", "cmd", "Stow");
    button.type = "button";
    button.addEventListener("click", () => {
      const result = unequip(session.slot, member.id, slotName);
      session.note = result.ok ? result.note : result.note;
      session.paint();
    });
    row.appendChild(button);
  }
  return row;
}

function paint(session, root) {
  unmountWheel();
  if (session.view === "wheel") {
    root.textContent = "";
    paintWheel(session, root);
    return;
  }
  const slot = session.slot;
  const serenya = slot.party.find((row) => row.id === "serenya");
  const emberion = slot.party.find((row) => row.id === "emberion");
  const calling = serenya.calling ? books.callings[serenya.calling] : null;
  root.textContent = "";

  const sheet = el("div", "card-sheet");
  const identity = el("div", "card-identity");
  const hero = el("div", "card-hero");
  const portrait = document.createElement("img");
  portrait.className = "card-portrait";
  portrait.src = "assets/serenya.png";
  portrait.alt = "";
  hero.appendChild(portrait);
  const who = el("div");
  who.appendChild(el("p", "kicker", "Nameplate"));
  who.appendChild(el("h3", "card-name", "Serenya"));
  who.appendChild(el("p", "card-line", "The name stays. The calling is the kit."));
  hero.appendChild(who);
  identity.appendChild(hero);

  const field = el("fieldset", "card-callings");
  const legend = el("legend", "kicker", "Calling");
  field.appendChild(legend);
  books.callingList.forEach((row) => {
    const label = el("label", "card-calling");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "calling";
    radio.value = row.id;
    radio.checked = serenya.calling === row.id;
    radio.addEventListener("change", () => {
      if (session.started) return;
      session.started = true;
      bindCalling(slot, row, books.units, books.callings, books.items, nodesOf());
      const hero = slot.party.find((unit) => unit.id === "serenya");
      if (books.tree) deriveMember(slot, hero, row, books.tree, books.items);
      session.chosen = row.id;
      commit(session);
    });
    label.appendChild(radio);
    label.appendChild(el("span", null, "Start as " + row.name));
    field.appendChild(label);
  });
  identity.appendChild(field);

  const known = calling ? calling.known.map(skillName).join(" · ") : "—";
  const family = calling && calling.family ? calling.family.charAt(0).toUpperCase() + calling.family.slice(1) : "";
  identity.appendChild(el("p", "card-line", calling ? "Weapon · " + itemName(calling.weapon) + " · " + family : "Choose a calling."));
  identity.appendChild(el("p", "card-line", "Moves · " + known));
  identity.appendChild(statGrid(serenya, books.units.serenya, calling));
  identity.appendChild(el("p", "card-growth", "No level. The wheel takes Measures. Serenya can put 27 points on this tree, not all of it. The prologue fight pays none."));
  const roots = el("div", "card-roots");
  books.callingList.forEach((row) => {
    const lit = serenya.anchor === row.anchor;
    const name = row.anchor.charAt(0).toUpperCase() + row.anchor.slice(1);
    roots.appendChild(el("span", lit ? "on" : "", name));
  });
  identity.appendChild(roots);
  identity.appendChild(el("p", "card-line", "Unspent Measures: " + ((serenya.measures || 0) - (serenya.taken || []).length) + "."));
  const wheel = el("button", "cmd", books.tree ? "Wheel" : "The wheel is not hung.");
  wheel.type = "button";
  wheel.id = "card-wheel";
  wheel.disabled = !books.tree || !serenya.calling;
  wheel.addEventListener("click", () => {
    session.view = "wheel";
    session.note = "";
    session.paint();
  });
  identity.appendChild(wheel);

  const chick = el("div", "card-companion");
  const chickRow = el("div", "card-hero");
  const chickImg = document.createElement("img");
  chickImg.className = "card-portrait card-portrait-small";
  chickImg.src = "assets/emberion.png";
  chickImg.alt = "";
  chickRow.appendChild(chickImg);
  const chickText = el("div");
  chickText.appendChild(el("p", "kicker", "Companion"));
  chickText.appendChild(el("h3", "card-sub", "Emberion"));
  chickText.appendChild(el("p", "card-line", "Bondwright · stage 0 · " + (emberion.known || []).map(skillName).join(" · ")));
  chickText.appendChild(el("p", "card-line", "Bronze Claw is his stage weapon. It is not a shop line."));
  chickRow.appendChild(chickText);
  chick.appendChild(chickRow);
  const worn = layers(emberion, books.units.emberion, null, books.items, nodesOf()).worn;
  chick.appendChild(el("p", "card-line", worn.hp + " HP · " + worn.mp + " MP · ATK " + worn.atk + " · MAG " + worn.mag));
  identity.appendChild(chick);
  sheet.appendChild(identity);

  const pack = el("div", "card-pack");
  pack.appendChild(el("p", "kicker", "Inventory"));
  pack.appendChild(el("p", "card-purse", slot.embers + " Embers"));
  pack.appendChild(el("p", "card-line", slot.bag.length ? "Bag" : "The bag is empty. The weapon is equipped, not duplicated."));

  if (slot.bag.length) {
    const list = el("div", "card-bag");
    slot.bag.forEach((row) => {
      const line = el("div", "card-row");
      const item = books.items[row.id];
      const mods = item ? modText(item) : "";
      line.appendChild(el("span", null, itemName(row.id) + " · " + row.n + (mods ? " · " + mods : "")));
      const actions = el("span", "card-row-actions");
      const fit = slot.party.map((person) => person.id).find((id) => !wearBlock(slot, id, row.id, books.items));
      const wear = el("button", "cmd", "Equip");
      wear.type = "button";
      wear.disabled = !fit;
      wear.addEventListener("click", () => {
        if (!fit) return;
        const person = slot.party.find((unit) => unit.id === fit);
        if (item && item.slot === "off" && offLocked(person, books.tree)) {
          session.note = "kettle";
          session.paint();
          return;
        }
        const result = equip(slot, fit, row.id, books.items);
        session.note = result.ok ? person.name + " wears " + itemName(result.note) + "." : result.note;
        session.paint();
      });
      const cash = el("button", "cmd", "Sell");
      cash.type = "button";
      cash.addEventListener("click", () => {
        const result = sell(slot, row.id, books.items);
        session.note = result.ok ? "Sold for " + result.note : result.note;
        session.paint();
      });
      actions.appendChild(wear);
      actions.appendChild(cash);
      line.appendChild(actions);
      list.appendChild(line);
    });
    pack.appendChild(list);
  }

  pack.appendChild(el("p", "kicker", "Serenya"));
  SLOT_NAMES.forEach(([key, label]) => pack.appendChild(slotRow(session, serenya, key, label)));
  const families = familiesOf(serenya).map((id) => id.charAt(0).toUpperCase() + id.slice(1)).join(" ");
  pack.appendChild(el("p", "card-line", "Families · " + families));
  pack.appendChild(el("p", "kicker", "Emberion"));
  SLOT_NAMES.forEach(([key, label]) => pack.appendChild(slotRow(session, emberion, key, label)));

  const note = el("p", "card-note", session.note || "");
  note.id = "card-note";
  pack.appendChild(note);
  sheet.appendChild(pack);
  root.appendChild(sheet);

  const dock = document.getElementById("place-note");
  if (dock) dock.textContent = session.note || (slot.embers + " Embers");
  const confirm = document.getElementById("card-confirm");
  if (confirm) confirm.disabled = !session.chosen;
}

function commit(session) {
  const storage = localStorage;
  const loaded = readSave(storage);
  if (!loaded.ok) {
    session.note = loaded.error;
    session.paint();
    return;
  }
  const snapshot = JSON.parse(JSON.stringify(session.slot));
  let doc = loaded.doc;
  if (!doc) {
    doc = freshDocument(snapshot);
  } else if (session.sourceIndex == null) {
    const open = doc.slots.findIndex((row) => row === null);
    if (open < 0) {
      session.note = "The slots are full.";
      session.paint();
      return;
    }
    doc.slots[open] = snapshot;
  } else {
    doc.slots[session.sourceIndex] = snapshot;
  }
  if (!writeSave(storage, doc)) {
    session.note = "This save is from an unknown version and was not loaded.";
    session.paint();
    return;
  }
  closeWindow({ result: "confirm", retreat: false });
}

function freshCard(loaded) {
  const slot = newCoreSlot(loaded.callingList[0]);
  const serenya = slot.party[0];
  serenya.calling = null;
  serenya.anchor = null;
  serenya.weaponFamilies = [];
  serenya.known = [];
  serenya.equip.weapon = null;
  serenya.hp = null;
  serenya.mp = null;
  fillVitals(slot, loaded.units, loaded.callings, loaded.items);
  return slot;
}

export function openCard() {
  if (isOpen()) return Promise.resolve(null);
  const pending = openWindow({
    id: "player-card",
    kind: "card",
    title: "Hearth",
    kicker: "Card",
    placeId: "card",
    suspendTravel: true
  });
  const leave = document.getElementById("place-leave");
  const confirm = el("button", "cmd card-confirm", "Confirm");
  confirm.type = "button";
  confirm.id = "card-confirm";
  confirm.disabled = true;
  confirm.addEventListener("click", () => {
    if (sessionRef.current) commit(sessionRef.current);
  });
  leave.parentNode.insertBefore(confirm, leave);
  leave.textContent = "Back";
  leave.dataset.result = "cancel";
  try { leave.blur(); } catch (_) { /* focus stays on the page */ }
  pending.then(() => {
    confirm.remove();
    leave.textContent = "Leave";
    delete leave.dataset.result;
  });
  const root = document.getElementById("place-body");
  loadBooks().then((loaded) => {
    const read = readSave(localStorage);
    let slot;
    let sourceIndex = null;
    let note = "";
    if (!read.ok) {
      note = read.error;
      slot = freshCard(loaded);
    } else if (read.doc) {
      const at = read.doc.slots.findIndex((row) => row);
      sourceIndex = at >= 0 ? at : null;
      slot = freshCard(loaded);
      if (sourceIndex != null) note = "Pick a calling. That replaces the saved story and starts at the loft. Back keeps the save.";
    } else {
      slot = freshCard(loaded);
    }
    const serenya = slot.party.find((row) => row.id === "serenya");
    const session = {
      slot,
      sourceIndex,
      chosen: serenya && serenya.calling ? serenya.calling : "",
      note,
      paint() { paint(session, root); }
    };
    sessionRef.current = session;
    if (globalThis.__moonlitDebug) {
      globalThis.__moonlitCard = {
        slot,
        hold(id) { hold(slot, id); session.paint(); },
        equip(id) {
          const item = loaded.items[id];
          const serenya = slot.party.find((row) => row.id === "serenya");
          if (item && item.slot === "off" && offLocked(serenya, loaded.tree)) {
            session.note = "kettle";
            session.paint();
            return { ok: false, note: "kettle" };
          }
          const result = equip(slot, "serenya", id, loaded.items);
          session.note = result.note;
          session.paint();
          return result;
        },
        sell(id) {
          const result = sell(slot, id, loaded.items);
          session.note = result.ok ? "Sold for " + result.note : result.note;
          session.paint();
          return result;
        },
        unequip(slotName) {
          const result = unequip(slot, "serenya", slotName);
          session.note = result.note;
          session.paint();
          return result;
        }
      };
    }
    session.paint();
  }).catch(() => {
    root.textContent = "";
    root.appendChild(el("p", null, "The card could not be read."));
  });
  return pending;
}

export function writeFresh(callingId) {
  const allowed = { cantor: true, warden: true, kindler: true };
  if (!allowed[callingId]) return Promise.resolve(false);
  return loadBooks().then((loaded) => {
    const calling = loaded.callings[callingId];
    if (!calling) return false;
    const slot = newCoreSlot(calling);
    fillVitals(slot, loaded.units, loaded.callings, loaded.items);
    const read = readSave(localStorage);
    if (!read.ok) return false;
    const doc = read.doc ? read.doc : freshDocument(slot);
    if (read.doc) {
      const at = doc.slots.findIndex((row) => row);
      doc.slots[at >= 0 ? at : 0] = slot;
    }
    return writeSave(localStorage, doc);
  });
}
