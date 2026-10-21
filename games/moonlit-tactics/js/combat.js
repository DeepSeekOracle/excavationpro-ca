/* Charge-time resolver. No DOM. Loaded as a classic script in the browser
   and evaluated with vm.runInNewContext in tools/battle_smoke.js. */
(function (root) {
  "use strict";

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function createRng(seed) {
    let s = seed >>> 0;
    return {
      next: function () {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      state: function () {
        return s >>> 0;
      }
    };
  }

  function spdEff(unit) {
    return unit.spd;
  }

  function addCharge(unit, steps) {
    const n = steps == null ? 1 : steps;
    unit.ct += spdEff(unit) * n;
    return unit.ct;
  }

  function advanceClock(units) {
    let steps = Infinity;
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u.hp <= 0) continue;
      if (u.ct >= 100) return 0;
      const need = Math.ceil((100 - u.ct) / spdEff(u));
      if (need < steps) steps = need;
    }
    if (!isFinite(steps) || steps < 1) steps = 1;
    for (let i = 0; i < units.length; i++) {
      if (units[i].hp > 0) addCharge(units[i], steps);
    }
    return steps;
  }

  function pickReady(units) {
    for (let i = 0; i < units.length; i++) {
      if (units[i].hp > 0 && units[i].ct >= 100) return units[i];
    }
    return null;
  }

  function facingMod(facing) {
    if (facing === "back") return 30;
    if (facing === "side") return 15;
    return 0;
  }

  function heightMod(tiles) {
    return clamp((tiles || 0) * 5, -15, 15);
  }

  function previewHit(attacker, target, facing, heightTiles, kind) {
    const face = facingMod(facing);
    const h = heightMod(heightTiles);
    let hit;
    if (kind === "magical") {
      hit = (attacker.ACC + Math.floor(attacker.ACCORD / 2)) - target.EVA + face + h;
    } else {
      hit = (attacker.ACC + Math.floor(attacker.HUM / 2)) - (target.EVA + Math.floor(target.HUM / 4)) + face + h;
    }
    return clamp(hit, 5, 99);
  }

  function elementFactor(mult) {
    if (mult == null) return 1;
    return mult;
  }

  function applyAction(state, action, rng) {
    const attacker = action.attacker;
    const target = action.target;
    const kind = action.kind || "physical";
    const power = action.power == null ? 100 : action.power;
    const facing = action.facing || "front";
    const heightTiles = action.heightTiles || 0;
    const hitPercent = previewHit(attacker, target, facing, heightTiles, kind);
    const hit = Math.floor(rng.next() * 100) < hitPercent;
    if (!hit) return { hit: false, crit: false, dmg: 0, hp: target.hp };
    const luck = attacker.LUCK || 0;
    const critChance = Math.min(30, Math.floor(luck / 5));
    const crit = Math.floor(rng.next() * 100) < critChance;
    const variance = 0.9 + 0.2 * rng.next();
    let raw;
    if (kind === "magical") {
      const faith = Math.min(1.35, (attacker.ACCORD / 100) * (1 + target.ACCORD / 200));
      let resIn = target.RES * (crit ? 0.75 : 1);
      raw = attacker.MAG * (power / 100) * faith - resIn / 2;
    } else {
      let defIn = target.DEF * (crit ? 0.75 : 1);
      raw = attacker.ATK * (power / 100) - defIn / 2;
      raw = Math.max(1, raw);
      raw = raw * variance;
      raw = raw * (attacker.HUM / 100 * 0.5 + 0.5);
      if (crit) raw = raw * 1.5;
      raw = raw * elementFactor(action.elementFactor);
      const dmg = Math.max(1, Math.round(raw));
      target.hp = Math.max(0, target.hp - dmg);
      return { hit: true, crit: crit, dmg: dmg, hp: target.hp };
    }
    raw = Math.max(1, raw);
    raw = raw * variance;
    if (crit) raw = raw * 1.5;
    raw = raw * elementFactor(action.elementFactor);
    const dmg = Math.max(1, Math.round(raw));
    target.hp = Math.max(0, target.hp - dmg);
    return { hit: true, crit: crit, dmg: dmg, hp: target.hp };
  }

  function noteAllyTurnEnded(state, id) {
    if (!Array.isArray(state.downSet)) return;
    const i = state.downSet.indexOf(id);
    if (i >= 0) state.downSet.splice(i, 1);
  }

  function checkOutcome(state) {
    const units = state.units || [];
    const uid = state.clauseId;
    if (Array.isArray(state.downSet)) {
      const clause = units.find(function (u) { return u.id === uid; });
      if (clause && clause.hp <= 0 && state.downSet.length === 0) {
        return { result: "lose", reason: uid };
      }
    }
    const allies = units.filter(function (u) { return u.team === "ally"; });
    const foes = units.filter(function (u) { return u.team === "foe"; });
    if (allies.length && allies.every(function (u) { return u.hp <= 0; })) {
      return { result: "lose", reason: "wipe" };
    }
    if (foes.length && foes.every(function (u) { return u.hp <= 0; })) {
      return { result: "win", reason: "eliminate" };
    }
    return { result: "continue" };
  }

  function phaseIndex(hp, max) {
    const r = hp / max;
    if (r > 0.7) return 1;
    if (r > 0.35) return 2;
    return 3;
  }

  function spendTurn(unit) {
    unit.ct -= 100;
  }

  root.MoonlitCombat = {
    createRng: createRng,
    addCharge: addCharge,
    advanceClock: advanceClock,
    pickReady: pickReady,
    previewHit: previewHit,
    applyAction: applyAction,
    noteAllyTurnEnded: noteAllyTurnEnded,
    checkOutcome: checkOutcome,
    phaseIndex: phaseIndex,
    spendTurn: spendTurn
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
