let pending = null;
let travel = { suspend() {}, resume() {} };
let hooks = { onFightClose() {} };

function $(id) {
  return document.getElementById(id);
}

function log(line) {
  if (globalThis.__moonlitDebug) console.log(line);
}

export function bindTravel(api) {
  travel = api;
}

export function bindHooks(api) {
  hooks = api;
}

export function isOpen() {
  return pending !== null;
}

function payloadFrom(request, extra) {
  const src = extra || {};
  return {
    id: src.id || request.id,
    kind: src.kind || request.kind,
    result: src.result || "leave",
    embers: src.embers || 0,
    items: src.items || [],
    measures: src.measures || [],
    flags: src.flags || {},
    restore: src.restore === true,
    retreat: src.retreat === true
  };
}

export function openWindow(request) {
  if (pending) {
    if (globalThis.__moonlitDebug) throw new Error("window open");
    return pending.promise;
  }
  let resolve;
  const promise = new Promise((ok) => { resolve = ok; });
  pending = { request, resolve, promise, allowsLeave: request.allowsLeave !== false };
  travel.suspend();
  log("window open");
  if (request.kind === "fight") {
    if (hooks.onFight) hooks.onFight(request);
    const move = $("cmd-move");
    if (move) move.focus();
  } else if (request.quiet) {
    $("place-window").hidden = true;
  } else {
    const frame = $("place-window");
    frame.hidden = false;
    frame.classList.add("fight-window");
    $("place-kicker").textContent = request.kicker || "Place";
    $("place-title").textContent = request.title || "Room";
    $("place-body").textContent = "";
    if (request.kind !== "town" && request.kind !== "adventure" && request.kind !== "dungeon") {
      const note = document.createElement("p");
      note.textContent = "The room is quiet.";
      $("place-body").appendChild(note);
    }
    $("place-note").textContent = request.placeId || "";
    const end = $("end");
    if (end) end.hidden = true;
    const leave = $("place-leave");
    leave.hidden = !pending.allowsLeave;
    if (!leave.hidden) {
      try { leave.focus({ preventScroll: true }); } catch (_) { /* focus is optional */ }
    }
  }
  return promise;
}

export function showPlate(model) {
  if (!pending) return;
  pending.plate = payloadFrom(pending.request, model);
  $("end-kicker").textContent = model.kicker || "";
  $("end-title").textContent = model.title || "";
  $("end-body").textContent = model.body || "";
  const again = $("end-again");
  again.hidden = !model.retry;
  const leave = $("end-leave");
  const win = model.result === "win";
  if (model.fromWorld) {
    leave.hidden = false;
    leave.textContent = win ? "Return to the road" : "Step back";
  } else if (win) {
    leave.hidden = false;
    leave.textContent = "Close";
  } else {
    leave.hidden = false;
    leave.textContent = "Menu";
  }
  if (model.leave) leave.textContent = model.leave;
  $("end").hidden = false;
  (leave.hidden ? again : leave).focus();
}

export function closeWindow(extra) {
  if (!pending) return;
  const request = pending.request;
  const body = pending.plate ? Object.assign({}, pending.plate, extra || {}) : payloadFrom(request, extra);
  if (extra && extra.result) body.result = extra.result;
  if (extra && extra.retreat != null) body.retreat = extra.retreat === true;
  const resolve = pending.resolve;
  pending = null;
  log("window close");
  $("end").hidden = true;
  travel.resume();
  if (request.kind === "fight") {
    hooks.onFightClose(body);
  } else {
    const frame = $("place-window");
    frame.hidden = true;
    frame.classList.remove("fight-window");
  }
  resolve(body);
}

export function escapeWindow() {
  if (!pending || pending.request.kind === "fight" || !pending.allowsLeave) return false;
  closeWindow({ result: "leave", retreat: false });
  return true;
}
