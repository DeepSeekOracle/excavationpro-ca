/**
 * FORGE SMOKE — GAMEPAD
 *
 * Standard-mapping gamepad support (Xbox / PlayStation / Switch Pro / 8BitDo …).
 *
 * Design note: this does NOT add a parallel input system. It translates the pad into the same key
 * names the keyboard produces and pushes them through the studio's `injectInput`, so the human
 * keyboard path, a gamepad and the harness check all drive one code path. Menus are DOM, so
 * confirm/back/pause are callbacks the host wires to real buttons.
 *
 * Buttons (standard mapping)
 *   Left stick  move            Right stick  look / orbit
 *   A            confirm        B            back
 *   X            reload         Y            swap weapon
 *   LT           aim            RT           fire (the game auto-fires; kept for completeness)
 *   D-pad        power-up cards (up 1 · right 2 · down 3)
 *   Start        pause/launch
 */

const DEADZONE = 0.26;

export function createGamepad(opts = {}) {
  const inject = opts.inject || (() => {});
  const onConfirm = opts.onConfirm || (() => {});
  const onBack = opts.onBack || (() => {});
  const onPause = opts.onPause || (() => {});
  const getPhase = opts.getPhase || (() => "title");

  const state = {
    connected: false,
    id: "",
    index: -1,
    keys: new Set(),
    lastKeys: new Set(),
    confirmedAt: 0,
    backedAt: 0,
    pausedAt: 0,
    look: { x: 0, y: 0 },
  };

  const prev = {};

  function padList() {
    const nav = globalThis.navigator;
    if (!nav?.getGamepads) return [];
    try { return [...nav.getGamepads()].filter(Boolean); } catch (e) { return []; }
  }

  function pressed(p, i) {
    const b = p.buttons?.[i];
    if (!b) return false;
    return typeof b === "object" ? (b.pressed || b.value > 0.5) : Boolean(b);
  }

  /** Rising edge helper: true once per press. */
  function edge(p, i, key) {
    const now = pressed(p, i);
    const was = Boolean(prev[key]);
    prev[key] = now;
    return now && !was;
  }

  function poll(isGameplay) {
    const pads = padList();
    const p = pads[0];
    const wasConnected = state.connected;
    state.connected = Boolean(p);
    state.id = p ? (p.id || "gamepad").slice(0, 48) : "";
    state.index = p ? p.index : -1;

    if (!p) {
      if (wasConnected) {
        // release anything we were holding so the fighter doesn't run forever
        const up = [...state.keys];
        state.keys.clear();
        if (up.length) inject({ up });
      }
      return state;
    }

    // ── menus ────────────────────────────────────────────────────────────────
    if (!isGameplay) {
      const now = performance.now();
      if ((edge(p, 0, "confirm") || edge(p, 9, "startC")) && now - state.confirmedAt > 320) {
        state.confirmedAt = now;
        onConfirm();
      }
      if (edge(p, 1, "back") && now - state.backedAt > 320) {
        state.backedAt = now;
        onBack();
      }
      if (edge(p, 9, "startP") && now - state.pausedAt > 320) {
        state.pausedAt = now;
        onPause();
      }
      return state;
    }

    // ── gameplay ─────────────────────────────────────────────────────────────
    const ax = p.axes || [];
    const lx = ax[0] || 0;
    const ly = ax[1] || 0;
    const rx = ax[2] || 0;
    const ry = ax[3] || 0;

    const want = new Set();
    if (ly < -DEADZONE) want.add("KeyW");
    if (ly > DEADZONE) want.add("KeyS");
    if (lx < -DEADZONE) want.add("KeyA");
    if (lx > DEADZONE) want.add("KeyD");
    if (pressed(p, 7)) want.add("Mouse1");          // fire (auto-fire already on)
    if (pressed(p, 6)) want.add("Mouse2");          // aim
    if (pressed(p, 12)) want.add("Digit1");         // d-pad: cards
    if (pressed(p, 15)) want.add("Digit2");
    if (pressed(p, 13)) want.add("Digit3");

    const down = [...want].filter((k) => !state.keys.has(k));
    const up = [...state.keys].filter((k) => !want.has(k));
    if (down.length || up.length) {
      inject({ down, up });
      state.keys = want;
    }
    state.lastKeys = want;

    // edges that are one-shot rather than held
    if (edge(p, 2, "reload")) inject({ down: ["KeyR"], up: ["KeyR"] });
    if (edge(p, 3, "swap")) inject({ down: ["KeyQ"], up: ["KeyQ"] });
    if (edge(p, 9, "startPlay")) onPause();

    // right stick feeds the same look accumulator the mouse uses
    if (Math.abs(rx) > DEADZONE || Math.abs(ry) > DEADZONE) {
      inject({ look: { dx: rx * 9, dy: ry * 6 } });
    }
    return state;
  }

  function status() {
    return { connected: state.connected, id: state.id, phase: getPhase() };
  }

  return { poll, status, state };
}
