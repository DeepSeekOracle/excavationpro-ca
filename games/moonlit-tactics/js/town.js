import { closeWindow, isOpen, openWindow } from "./window.js";
import * as sfx from "./sfx.js?v=20261007-buttons";
import { freshDocument, readSave, UNKNOWN, writeSave } from "./save.js";
import {
  buy, ensureGrowth, equip, fillVitals, indexById, layers, modText, newCoreSlot, rest, sell, shopStock, spendOne, unequip, wearBlock
} from "./inventory.js";
import { mountWheel, offLocked, prepareTree, unmountWheel } from "./tree.js";

const SHOWN = ["hp", "mp", "atk", "def", "mag", "res", "spd"];
const WEAR_NOTE = {
  missing: "That piece is not in the book.",
  bag: "It is not in the bag.",
  empty: "That slot is empty.",
  sell: "This stays with her.",
  embers: "Not enough Embers.",
  kettle: "The kettle keeps the off hand.",
  use: "Used from the bag, or in a fight.",
  key: "This stays in the bag. It is not worn.",
  brand: "This calling does not wear a brand.",
  blade: "This calling does not wear a blade.",
  staff: "This calling does not wear a staff.",
  spear: "This calling does not wear a spear.",
  claw: "Only Emberion wears a claw.",
  lyra: "Lyra carries this until the song is spent.",
  serenya: "Only Serenya wears this."
};
const SLOT_NAMES = [
  ["weapon", "Weapon"],
  ["off", "Off"],
  ["head", "Head"],
  ["body", "Body"],
  ["accessory", "Accessory"]
];
const ROOMS = [
  ["talk", "Talk"],
  ["trade", "Trade"],
  ["equip", "Equip"],
  ["sleep", "Sleep"],
  ["wheel", "Wheel"]
];

let books = null;

function cue(name) {
  try {
    const fn = sfx[name];
    if (typeof fn === "function") fn();
  } catch (_) { /* sound is optional */ }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

async function loadBooks() {
  if (books) return books;
  const [place, units, callings, items, skills, tree] = await Promise.all([
    fetch("data/places/hatchery.json").then((res) => res.json()),
    fetch("data/units.json").then((res) => res.json()),
    fetch("data/callings.json").then((res) => res.json()),
    fetch("data/items.json").then((res) => res.json()),
    fetch("data/skills.json").then((res) => res.json()),
    fetch("data/tree.json").then((res) => res.json()).catch(() => null)
  ]);
  books = {
    place,
    units: indexById(units.units),
    callings: indexById(callings.callings),
    callingList: callings.callings,
    items: indexById(items.items),
    skills: indexById(skills.skills),
    tree: tree ? prepareTree(tree) : null
  };
  return books;
}

function itemName(id) {
  const row = books.items[id];
  return row ? row.name : id;
}

function wornOf(member) {
  const calling = member.calling ? books.callings[member.calling] : null;
  return layers(member, books.units[member.id], calling, books.items, books.tree && books.tree.byId).worn;
}

function wornLine(member) {
  const worn = wornOf(member);
  return SHOWN.map((key) => (key === "hp" || key === "mp" ? worn[key] + " " + key.toUpperCase() : key.toUpperCase() + " " + worn[key])).join(" · ");
}

function plainNote(note) {
  return WEAR_NOTE[note] || note;
}

function keep(session) {
  if (session.sourceIndex == null) return true;
  const error = commitSlot(localStorage, session);
  if (error) session.note = error;
  return !error;
}

export function commitSlot(storage, session) {
  const loaded = readSave(storage);
  if (!loaded.ok) return loaded.error;
  const snapshot = JSON.parse(JSON.stringify(session.slot));
  let doc = loaded.doc;
  let index = session.sourceIndex;
  if (!doc) {
    doc = freshDocument(snapshot);
    index = 0;
  } else if (index == null) {
    index = doc.slots.findIndex((row) => row === null);
    if (index < 0) return "The slots are full.";
    doc.slots[index] = snapshot;
  } else {
    doc.slots[index] = snapshot;
  }
  if (!writeSave(storage, doc)) return UNKNOWN;
  session.sourceIndex = index;
  return "";
}

function remember(session) {
  const backup = JSON.parse(JSON.stringify(session.slot));
  return {
    backup,
    undo() {
      session.slot = backup;
    }
  };
}

function paintRooms(session, root) {
  const home = el("div", "town-home");
  const list = el("div", "town-rooms");
  ROOMS.forEach(([id, label]) => {
    const button = el("button", "cmd", label);
    button.type = "button";
    button.id = "town-" + id;
    if (id === "wheel" && !books.tree) {
      button.textContent = "The wheel is not hung.";
      button.disabled = true;
    }
    button.addEventListener("click", () => {
      cue("ui");
      session.room = id;
      session.note = "";
      session.paint();
    });
    list.appendChild(button);
  });
  if (session.place.chainLock !== true) {
    const leave = el("button", "cmd", "Leave");
    leave.type = "button";
    leave.id = "town-leave";
    leave.addEventListener("click", () => {
      cue("page");
      if (!keep(session)) {
        session.paint();
        return;
      }
      closeWindow({ result: "leave", embers: 0 });
    });
    list.appendChild(leave);
  }
  home.appendChild(list);
  const party = el("div", "town-party");
  [["assets/serenya.png", "Serenya"], ["assets/emberion.png", "Emberion"]].forEach(([src, name]) => {
    const figure = el("figure", "town-figure");
    const img = document.createElement("img");
    img.className = "town-portrait";
    img.src = src;
    img.alt = "";
    figure.appendChild(img);
    figure.appendChild(el("figcaption", null, name));
    party.appendChild(figure);
  });
  home.appendChild(party);
  root.appendChild(home);
}

function paintTalk(session, root) {
  const keeper = (session.place.talk && session.place.talk[0]) || { name: "Keeper", text: "" };
  root.appendChild(el("p", "kicker", keeper.name));
  root.appendChild(el("p", "town-say", keeper.text));
  root.appendChild(backButton(session));
}

function paintTrade(session, root) {
  const chapter = session.slot.chapterIndex || 0;
  root.appendChild(el("p", "town-purse", session.slot.embers + " Embers · chapter " + chapter));
  root.appendChild(el("p", "town-line", "The counter keeps every piece this chapter has reached. The next book adds the next shelf."));
  const shop = el("div", "town-list gear-list");
  shopStock(books.items, chapter).forEach((item) => {
    const row = el("div", "town-row gear-row");
    const copy = el("span", "gear-copy");
    copy.appendChild(el("b", null, item.name));
    copy.appendChild(el("i", null, item.price + " Embers" + (modText(item) ? " · " + modText(item) : "")));
    row.appendChild(copy);
    const button = el("button", "cmd", "Buy");
    button.type = "button";
    button.disabled = session.slot.embers < item.price;
    button.addEventListener("click", () => {
      const result = buy(session.slot, item.id, books.items);
      if (result.ok) {
        keep(session);
        session.note = "Bought " + item.name + ".";
        cue("coin");
      } else {
        session.note = plainNote(result.note);
        cue("ui");
      }
      session.paint();
    });
    row.appendChild(button);
    shop.appendChild(row);
  });
  root.appendChild(shop);
  root.appendChild(el("p", "kicker", "Bag"));
  root.appendChild(bagList(session, "sell"));
  root.appendChild(backButton(session));
}

function bagList(session, mode) {
  if (!session.slot.bag.length) return el("p", "town-line", "The bag is empty.");
  const bag = el("div", "town-list gear-list");
  session.slot.bag.forEach((row) => {
    const item = books.items[row.id];
    const line = el("div", "town-row gear-row");
    const copy = el("span", "gear-copy");
    copy.appendChild(el("b", null, itemName(row.id) + " · " + row.n));
    const extra = item && item.sellable === false ? "Kept" : (item ? Math.floor((item.price || 0) / 2) + " if sold" : "");
    const mods = item ? modText(item) : "";
    copy.appendChild(el("i", null, [mods, extra].filter(Boolean).join(" · ")));
    line.appendChild(copy);
    if (mode === "sell") {
      const button = el("button", "cmd", item && item.sellable === false ? "Kept" : "Sell");
      button.type = "button";
      button.disabled = !item || item.sellable === false;
      button.addEventListener("click", () => {
        const result = sell(session.slot, row.id, books.items);
        if (result.ok) {
          keep(session);
          session.note = "Sold for " + result.note + ".";
          cue("coin");
        } else {
          session.note = plainNote(result.note);
          cue("ui");
        }
        session.paint();
      });
      line.appendChild(button);
    }
    bag.appendChild(line);
  });
  return bag;
}

function useInTown(session, member, item) {
  const worn = wornOf(member);
  if (member.hp == null) member.hp = worn.hp;
  if (member.mp == null) member.mp = worn.mp;
  if (item.effect === "hp40") {
    if (member.hp <= 0) return "A salve does not close an interval.";
    const add = Math.min(40, Math.max(0, worn.hp - member.hp));
    if (!add) return "Already at full health.";
    member.hp += add;
    return "Mended " + add + ".";
  }
  if (item.effect === "mp20") {
    const add = Math.min(20, Math.max(0, worn.mp - member.mp));
    if (!add) return "Already at full focus.";
    member.mp += add;
    return "Restored " + add + " focus.";
  }
  if (item.effect === "revive30") {
    if (member.hp > 0) return "They are still standing.";
    member.hp = Math.max(1, Math.floor(worn.hp * 0.3));
    return "The interval opens at " + member.hp + ".";
  }
  return "Smoke chalk, bronze scale, and haste ash are used in a fight.";
}

function paintEquip(session, root) {
  ensureGrowth(session.slot);
  const who = el("div", "town-who");
  session.slot.party.forEach((member) => {
    const button = el("button", "cmd" + (session.memberId === member.id ? " on" : ""), member.name);
    button.type = "button";
    button.addEventListener("click", () => {
      cue("ui");
      session.memberId = member.id;
      session.paint();
    });
    who.appendChild(button);
  });
  root.appendChild(who);
  const member = session.slot.party.find((row) => row.id === session.memberId) || session.slot.party[0];
  root.appendChild(el("p", "town-line", wornLine(member)));
  const doll = el("div", "gear-list");
  SLOT_NAMES.forEach(([key, label]) => {
    const row = el("div", "town-row gear-row");
    const worn = member.equip[key];
    const item = worn ? books.items[worn] : null;
    const copy = el("span", "gear-copy");
    copy.appendChild(el("b", null, label + " · " + (item ? item.name : "Empty")));
    copy.appendChild(el("i", null, item ? (modText(item) || "No stat change") : "Open slot"));
    row.appendChild(copy);
    if (worn) {
      const stow = el("button", "cmd", "Stow");
      stow.type = "button";
      stow.addEventListener("click", () => {
        cue("ui");
        const result = unequip(session.slot, member.id, key);
        if (result.ok) {
          keep(session);
          session.note = "Stowed " + itemName(result.note) + ".";
        } else session.note = plainNote(result.note);
        session.paint();
      });
      row.appendChild(stow);
    }
    doll.appendChild(row);
  });
  root.appendChild(doll);
  root.appendChild(el("p", "kicker", "Bag"));
  if (!session.slot.bag.length) root.appendChild(el("p", "town-line", "The bag is empty."));
  const bag = el("div", "town-list gear-list");
  session.slot.bag.forEach((row) => {
    const item = books.items[row.id];
    const block = wearBlock(session.slot, member.id, row.id, books.items);
    const line = el("div", "town-row gear-row");
    const copy = el("span", "gear-copy");
    copy.appendChild(el("b", null, itemName(row.id) + " · " + row.n));
    copy.appendChild(el("i", null, block ? plainNote(block) : (modText(item) || "Fits this slot")));
    line.appendChild(copy);
    if (!block) {
      const button = el("button", "cmd", "Wear");
      button.type = "button";
      button.addEventListener("click", () => {
        cue("ui");
        if (item && item.slot === "off" && offLocked(member, books.tree)) {
          session.note = plainNote("kettle");
          session.paint();
          return;
        }
        const result = equip(session.slot, member.id, row.id, books.items);
        if (result.ok) {
          keep(session);
          session.note = member.name + " wears " + itemName(result.note) + ".";
        } else session.note = plainNote(result.note);
        session.paint();
      });
      line.appendChild(button);
    } else if (item && (item.effect === "hp40" || item.effect === "mp20" || item.effect === "revive30")) {
      const button = el("button", "cmd", "Use");
      button.type = "button";
      button.addEventListener("click", () => {
        const said = useInTown(session, member, item);
        if (said.indexOf("Mended") === 0 || said.indexOf("Restored") === 0 || said.indexOf("The interval") === 0) {
          spendOne(session.slot, row.id);
          keep(session);
          cue("settle");
        } else cue("ui");
        session.note = said;
        session.paint();
      });
      line.appendChild(button);
    }
    bag.appendChild(line);
  });
  if (session.slot.bag.length) root.appendChild(bag);
  root.appendChild(backButton(session));
}

function paintSleep(session, root) {
  const cost = session.place.sleep.restCost;
  root.appendChild(el("p", "town-line", "Rest costs " + cost + " Embers and fills the party. Save writes the slot and leaves them as they are."));
  const restBtn = el("button", "cmd", "Rest");
  restBtn.type = "button";
  restBtn.id = "town-rest";
  restBtn.disabled = session.slot.embers < cost;
  restBtn.addEventListener("click", () => {
    cue("settle");
    const mark = remember(session);
    const result = rest(session.slot, cost, books.units, books.callings, books.items, books.tree && books.tree.byId);
    if (!result.ok) {
      session.note = result.note;
      session.paint();
      return;
    }
    const error = commitSlot(localStorage, session);
    if (error) {
      mark.undo();
      session.note = error;
    } else {
      session.note = "Rested";
    }
    session.paint();
  });
  const saveBtn = el("button", "cmd", "Save");
  saveBtn.type = "button";
  saveBtn.id = "town-save";
  saveBtn.addEventListener("click", () => {
    cue("ui");
    const error = commitSlot(localStorage, session);
    session.note = error || "Saved";
    session.paint();
  });
  const row = el("div", "town-who");
  row.appendChild(restBtn);
  row.appendChild(saveBtn);
  root.appendChild(row);
  root.appendChild(backButton(session));
}

function paintWheel(session, root) {
  if (!books.tree) {
    root.appendChild(el("p", "town-say", "The wheel is not hung."));
    root.appendChild(backButton(session));
    return;
  }
  const serenya = session.slot.party.find((row) => row.id === "serenya");
  mountWheel(root, {
    book: books.tree,
    slot: session.slot,
    units: books.units,
    callings: books.callings,
    items: books.items,
    skills: books.skills,
    respec: session.place.respec,
    chainLock: session.place.chainLock === true,
    note: session.note,
    memberOf() { return session.slot.party.find((row) => row.anchor) || serenya; },
    commit() { return commitSlot(localStorage, session); },
    onLeave() {
      session.room = "rooms";
      session.note = "";
      session.paint();
    },
    onChange(note) {
      session.note = note;
      const dock = document.getElementById("place-note");
      if (dock) dock.textContent = session.slot.embers + " Embers";
    }
  });
}

function backButton(session) {
  const button = el("button", "cmd", "Back");
  button.type = "button";
  button.id = "town-back";
  button.addEventListener("click", () => {
    cue("ui");
    leaveRoom(session);
  });
  return button;
}

function leaveRoom(session) {
  session.room = "rooms";
  session.note = "";
  session.paint();
}

function syncDock(session) {
  const leave = document.getElementById("place-leave");
  const dock = document.getElementById("place-note");
  if (leave) {
    leave.hidden = session.place.chainLock === true;
    leave.disabled = false;
  }
  let back = document.getElementById("town-dock-back");
  if (session.room === "rooms") {
    if (back) back.remove();
  } else if (!back && leave && leave.parentNode) {
    back = el("button", "cmd", "Back");
    back.type = "button";
    back.id = "town-dock-back";
    back.addEventListener("click", () => {
      cue("ui");
      leaveRoom(session);
    });
    leave.parentNode.insertBefore(back, leave);
  }
  if (dock) {
    const embers = session.slot && session.slot.embers != null ? session.slot.embers + " Embers" : "";
    dock.textContent = session.note || embers;
  }
  const focus = document.getElementById(session.room === "rooms" ? "town-talk" : "town-dock-back");
  if (focus && document.activeElement !== focus) {
    try { focus.focus({ preventScroll: true }); } catch (_) { /* focus is optional */ }
  }
}

function paint(session) {
  const root = document.getElementById("place-body");
  try {
    unmountWheel();
    if (!root) return;
    root.textContent = "";
    const sheet = el("div", "town-sheet");
    if (session.room === "talk") paintTalk(session, sheet);
    else if (session.room === "trade") paintTrade(session, sheet);
    else if (session.room === "equip") paintEquip(session, sheet);
    else if (session.room === "sleep") paintSleep(session, sheet);
    else if (session.room === "wheel") paintWheel(session, sheet);
    else paintRooms(session, sheet);
    const note = el("p", "town-note", session.note || "");
    note.id = "town-note";
    sheet.appendChild(note);
    root.appendChild(sheet);
  } catch (err) {
    if (root) {
      root.textContent = "";
      root.appendChild(el("p", "town-say", "The room did not open. Back returns to the hall."));
    }
  } finally {
    syncDock(session);
  }
}

function takeSession(loaded) {
  const read = readSave(localStorage);
  if (!read.ok) {
    const slot = newCoreSlot(loaded.callingList[0]);
    fillVitals(slot, loaded.units, loaded.callings, loaded.items, loaded.tree && loaded.tree.byId);
    return { slot, sourceIndex: null, note: read.error };
  }
  if (read.doc) {
    const sourceIndex = read.doc.slots.findIndex((row) => row);
    if (sourceIndex >= 0) {
      return {
        slot: JSON.parse(JSON.stringify(read.doc.slots[sourceIndex])),
        sourceIndex,
        note: ""
      };
    }
  }
  const slot = newCoreSlot(loaded.callingList[0]);
  fillVitals(slot, loaded.units, loaded.callings, loaded.items, loaded.tree && loaded.tree.byId);
  return { slot, sourceIndex: null, note: "" };
}

export function openTown() {
  if (isOpen()) return Promise.resolve(null);
  return loadBooks().then((loaded) => {
    const place = loaded.place;
    const title = document.getElementById("title-card");
    if (title) title.hidden = true;
    const pending = openWindow({
      id: place.id,
      kind: "town",
      title: place.name,
      kicker: "Town",
      placeId: place.id,
      suspendTravel: true,
      allowsLeave: place.chainLock !== true
    });
    const leave = document.getElementById("place-leave");
    leave.textContent = "Leave";
    delete leave.dataset.result;
    const taken = takeSession(loaded);
    ensureGrowth(taken.slot);
    const session = {
      place,
      slot: taken.slot,
      sourceIndex: taken.sourceIndex,
      room: "rooms",
      memberId: "serenya",
      note: taken.note,
      paint() { paint(session); }
    };
    if (globalThis.__moonlitDebug) {
      globalThis.__moonlitTown = session;
    }
    session.paint();
    return pending;
  }).catch(() => {
    if (isOpen()) closeWindow({ result: "cancel" });
    const title = document.getElementById("title-card");
    if (title) title.hidden = false;
    return null;
  });
}
