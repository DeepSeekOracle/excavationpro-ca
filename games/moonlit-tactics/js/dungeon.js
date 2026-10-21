import { closeWindow, isOpen, openWindow } from "./window.js";

let mineLeave = { x: 30, y: 9, facing: 2 };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function mineLeaveCell() {
  return mineLeave;
}

function paint(place) {
  const floor = (place.floors && place.floors[0]) || { name: "The mouth", descend: null, encounters: [] };
  const root = document.getElementById("place-body");
  root.textContent = "";
  const column = el("div", "town-rooms");
  column.appendChild(el("p", "kicker", floor.name || "The mouth"));
  column.appendChild(el("p", "town-say", "A stair is cut. Nothing is placed on it yet."));
  const descend = el("button", "cmd", "Descend");
  descend.type = "button";
  descend.id = "mine-descend";
  descend.disabled = floor.descend == null;
  column.appendChild(descend);
  const leave = el("button", "cmd", "Leave");
  leave.type = "button";
  leave.id = "mine-leave";
  leave.addEventListener("click", () => closeWindow({ result: "leave", embers: 0 }));
  column.appendChild(leave);
  root.appendChild(column);
  const dockLeave = document.getElementById("place-leave");
  if (dockLeave) dockLeave.hidden = true;
  const note = document.getElementById("place-note");
  if (note) note.textContent = floor.name || "The mouth";
  leave.focus();
}

export function openDungeon() {
  if (isOpen()) return Promise.resolve(null);
  return fetch("data/places/mine-mouth.json").then((res) => res.json()).then((place) => {
    if (!place || place.kind !== "dungeon" || !place.leave) return null;
    mineLeave = { x: place.leave.x, y: place.leave.y, facing: 2 };
    const pending = openWindow({
      id: place.id,
      kind: "dungeon",
      title: place.name,
      kicker: "Dungeon",
      placeId: place.id,
      suspendTravel: true,
      allowsLeave: true
    });
    paint(place);
    return pending;
  }).catch(() => null);
}
