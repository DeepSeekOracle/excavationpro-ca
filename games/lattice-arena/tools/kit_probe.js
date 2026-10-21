/* Cast every move on every kit and check the thing the move claims to do.
   node tools/kit_probe.js
*/
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.join(__dirname, "..");

function stubEl() {
  return {
    style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} },
    getContext: () => ({
      imageSmoothingEnabled: false, fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1,
      font: "", textAlign: "", globalCompositeOperation: "",
      fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {}, arc() {}, ellipse() {},
      moveTo() {}, lineTo() {}, stroke() {}, fill() {}, save() {}, restore() {}, translate() {},
      scale() {}, setTransform() {}, setLineDash() {}, drawImage() {}, clearRect() {}
    }),
    toDataURL: () => "",
    appendChild() {}, addEventListener() {}, removeEventListener() {},
    getBoundingClientRect: () => ({ width: 900, height: 600, left: 0, top: 0 }),
    querySelector: () => null, querySelectorAll: () => [], setAttribute() {}, focus() {}
  };
}
const document = {
  createElement: () => stubEl(), getElementById: () => stubEl(),
  querySelector: () => null, querySelectorAll: () => [], addEventListener() {},
  body: stubEl(), documentElement: stubEl()
};
const win = {
  devicePixelRatio: 1, document, requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  Image: function () {}, fetch: () => Promise.resolve({ json: () => Promise.resolve({}) }),
  setTimeout, clearTimeout, console
};
win.window = win;
const ctx = vm.createContext(win);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
["roster.js", "banter.js", "director.js", "attacks.js", "brain.js", "arena.js"].forEach(load);
const R = win.LYGO_ARENA, E = win.ArenaEngine;

function scrub(e) {
  ["stun", "root", "silence", "slowT", "slowV", "swiftT", "swiftV", "hasteT", "hasteV",
    "rageT", "rageV", "weakT", "weakV", "burnT", "burnDps", "burnBank", "bleedT", "bleedDps", "bleedBank",
    "regenT", "regenHps", "thornsT", "thornsV", "reflectT", "reflectV", "veilT", "veilV",
    "lifestealT", "lifestealV", "tauntT", "shieldWallT", "woundT", "woundV", "armorBuff", "armorBuffT", "shd"
  ].forEach((k) => { e[k] = 0; });
  e.dead = false;
}
function freeze(S) { S.your.concat(S.foe).forEach((e) => { e.stun = 40; }); }
function has(st, key) { return !!(st && st[key] != null && st[key] !== 0); }

const problems = [];
R.ROSTER.forEach((f) => {
  const allyId = f.id === "kael" ? "vale" : "kael";
  E.newMatch({ you: [f.id, allyId], foe: ["brute"] }, 2, 3);
  const S = E.state();
  S.phase = "live";
  const me = S.your[0], ally = S.your[1], foe = S.foe[0];
  foe.max = 250000; foe.hp = foe.max;
  me.b.crit = 0; foe.b.crit = 0; ally.b.crit = 0;
  foe.b.mods.veil = 0; foe.b.mods.bulwark = 0; foe.b.mods.execute = 0;
  const kitBad = [];

  if (me.b.mods.startShield && me.shd <= 0) kitBad.push("warded shield missing at the bell");

  me.b.moves.forEach((mv, idx) => {
    scrub(me); scrub(ally); scrub(foe);
    foe.hp = foe.max; ally.hp = ally.max; me.hp = me.max;
    me.mana = me.b.manaMax;
    me.cds = me.b.moves.map(() => 0);
    S.projectiles = []; S.pending = []; S.over = false; S.phase = "live";
    const gap = (mv.shape === "melee" || mv.shape === "arc") ? 34
      : (mv.shape === "aura" && !mv.atRange) ? 48
      : 150;
    me.x = 480; me.y = 340;
    foe.x = me.x + gap; foe.y = me.y;
    ally.x = me.x - 28; ally.y = me.y;
    if (mv.aim === "allylow" || (mv.st && mv.st.heal) || (mv.selfSt && mv.selfSt.heal) || mv.shape === "allies") {
      ally.hp = Math.round(ally.max * 0.45);
      me.hp = Math.round(me.max * 0.7);
    }
    if (mv.drain || (mv.st && mv.st.lifesteal)) me.hp = Math.round(me.max * 0.45);
    if (mv.strips) foe.shd = 800;
    if (mv.shape === "revive") { ally.dead = true; ally.hp = 0; }
    if (mv.execute) { foe.hp = Math.round(foe.max * 0.2); }
    const before = {
      foeHp: foe.hp, foeTaken: foe.taken, meHp: me.hp, allyHp: ally.hp,
      dist: Math.hypot(foe.x - me.x, foe.y - me.y), n: S.your.length
    };
    me.cds = me.b.moves.map(() => 8);
    const ok = E.forceCast(me, idx);
    if (!ok) { kitBad.push(mv.name + " refused to cast"); return; }
    const instant = () => {
      const st = mv.st || {};
      const onFoe = mv.shape === "melee" || mv.shape === "arc" || mv.shape === "aura" || mv.shape === "beam" || mv.shape === "blink";
      if (onFoe && mv.dmg && foe.taken <= before.foeTaken && foe.hp >= before.foeHp) kitBad.push(mv.name + " dealt no damage");
      if (onFoe && has(st, "stun") && foe.stun <= 0) kitBad.push(mv.name + " did not stun");
      if (onFoe && has(st, "root") && foe.root <= 0) kitBad.push(mv.name + " did not root");
      if (onFoe && has(st, "silence") && foe.silence <= 0) kitBad.push(mv.name + " did not silence");
      if (onFoe && has(st, "weak") && foe.weakT <= 0) kitBad.push(mv.name + " did not weaken");
      if (onFoe && has(st, "bleed") && foe.bleedT <= 0) kitBad.push(mv.name + " did not bleed");
      if (onFoe && has(st, "burn") && foe.burnT <= 0) kitBad.push(mv.name + " did not burn");
      if (onFoe && has(st, "wound") && foe.woundT <= 0) kitBad.push(mv.name + " did not wound");
      if (onFoe && has(st, "slow") && foe.slowT <= 0) kitBad.push(mv.name + " did not slow");
      if (has(st, "knock")) {
        const d2 = Math.hypot(foe.x - me.x, foe.y - me.y);
        if (d2 < before.dist + 12) kitBad.push(mv.name + " did not knock back");
      }
      if (has(st, "pull")) {
        const d2 = Math.hypot(foe.x - me.x, foe.y - me.y);
        if (d2 > before.dist - 12) kitBad.push(mv.name + " did not pull");
      }
      if (mv.shape === "self" || mv.selfSt) {
        const ss = mv.shape === "self" ? st : (mv.selfSt || {});
        if (has(ss, "aegis") && me.shd <= 0) kitBad.push(mv.name + " did not raise aegis");
        if (has(ss, "swift") && me.swiftT <= 0) kitBad.push(mv.name + " did not grant swift");
        if (has(ss, "rage") && me.rageT <= 0) kitBad.push(mv.name + " did not grant rage");
        if (has(ss, "veil") && me.veilT <= 0) kitBad.push(mv.name + " did not grant veil");
        if (has(ss, "haste") && me.hasteT <= 0) kitBad.push(mv.name + " did not grant haste");
        if (has(ss, "reflect") && me.reflectT <= 0) kitBad.push(mv.name + " did not reflect");
        if (has(ss, "thorns") && me.thornsT <= 0) kitBad.push(mv.name + " did not thorn");
        if (has(ss, "lifesteal") && me.lifestealT <= 0) kitBad.push(mv.name + " did not drink");
        if (has(ss, "taunt") && me.tauntT <= 0) kitBad.push(mv.name + " did not taunt");
        if (ss.cdReset && me.cds.some((c) => c > 1)) kitBad.push(mv.name + " did not reset cooldowns");
        if (has(ss, "heal") && me.hp <= before.meHp) kitBad.push(mv.name + " did not heal the caster");
      }
      if (mv.shape === "ally" && mv.st && mv.st.aegis && ally.shd <= 0) kitBad.push(mv.name + " did not shield the ally");
      if (mv.shape === "allies" && mv.st) {
        if (mv.st.heal && ally.hp <= before.allyHp && me.hp <= before.meHp) kitBad.push(mv.name + " did not heal the line");
        if (mv.st.armor && ally.armorBuff <= 0 && me.armorBuff <= 0) kitBad.push(mv.name + " did not armor the line");
        if (mv.st.haste && ally.hasteT <= 0 && me.hasteT <= 0) kitBad.push(mv.name + " did not haste the line");
        if (mv.st.swift && ally.swiftT <= 0 && me.swiftT <= 0) kitBad.push(mv.name + " did not stride the line");
        if (mv.st.regen && ally.regenT <= 0 && me.regenT <= 0) kitBad.push(mv.name + " did not bloom the line");
      }
      if (mv.shape === "summon" && S.your.length < before.n + (mv.n || 1)) kitBad.push(mv.name + " summoned nobody");
      if (mv.shape === "revive" && (ally.dead || ally.hp <= 0)) kitBad.push(mv.name + " did not raise the ally");
      if (mv.drain && me.hp <= before.meHp) kitBad.push(mv.name + " did not drain");
    };
    const delayed = mv.shape === "blast" || mv.shape === "bolt" || mv.shape === "multi" || mv.shape === "lob";
    if (!delayed) instant();
    freeze(S);
    E.stepHeadless(1.5);
    if (delayed) {
      const st = mv.st || {};
      if (mv.dmg && foe.taken <= before.foeTaken) kitBad.push(mv.name + " shot dealt no damage");
      if (has(st, "burn") && foe.burnT <= 0 && foe.taken <= before.foeTaken) kitBad.push(mv.name + " burn never landed");
      if (has(st, "slow") && foe.slowT <= 0) kitBad.push(mv.name + " slow never landed");
      if (has(st, "root") && foe.root <= 0) kitBad.push(mv.name + " root never landed");
      if (has(st, "weak") && foe.weakT <= 0) kitBad.push(mv.name + " weak never landed");
      if (has(st, "silence") && foe.silence <= 0) kitBad.push(mv.name + " silence never landed");
      if (has(st, "wound") && foe.woundT <= 0) kitBad.push(mv.name + " wound never landed");
      if (mv.strips && foe.shd > 0) kitBad.push(mv.name + " did not strip the shield");
      if (mv.selfSt && mv.selfSt.swift && me.swiftT <= 0) kitBad.push(mv.name + " self swift missing");
    }
    if (mv.lob && !S.events.some((ev) => ev.text.indexOf(mv.name) >= 0)) kitBad.push(mv.name + " never announced");
  });

  /* the basic, with moves locked so only the weapon fires */
  scrub(me); scrub(foe);
  foe.hp = foe.max; foe.b.armor = 0; foe.armorBuff = 0;
  me.x = 480; me.y = 340; foe.x = 480 + Math.min(40, me.b.range * 0.45); foe.y = 340;
  if (me.b.range > 120) foe.x = 480 + 100;
  me.mana = 0; me.cds = me.b.moves.map(() => 30); me.stun = 0; me.atkCd = 0; me.silence = 0;
  if (me.b.atk.drain) me.hp = Math.round(me.max * 0.5);
  const spd = me.b.speed; me.b.speed = 0;
  const taken0 = foe.taken;
  E.stepHeadless(me.b.atk.type === "bolt" || me.b.range > 100 ? 0.7 : 0.05);
  me.b.speed = spd;
  if (foe.taken <= taken0) kitBad.push("basic " + me.b.atk.name + " dealt nothing");
  if (me.b.atk.burn && foe.burnT <= 0) kitBad.push("basic did not burn");
  if (me.b.atk.drain && me.hp >= me.max) kitBad.push("basic drain healed nothing");

  if (kitBad.length) problems.push(f.name + " — " + kitBad.join("; "));
});

/* living aura: Lyra's standard leaves when she does */
E.newMatch({ you: ["lyra", "kael"], foe: ["brute"] }, 2, 11);
{
  const S = E.state(); S.phase = "live";
  const lyra = S.your[0], kael = S.your[1], foe = S.foe[0];
  foe.max = 250000; foe.hp = foe.max; foe.b.armor = 0; foe.armorBuff = 0;
  kael.b.crit = 0; kael.b.mods.execute = 0; kael.b.mods.fury = 0;
  kael.x = 480; kael.y = 340; foe.x = 520; foe.y = 340;
  kael.mana = 0; kael.cds = kael.b.moves.map(() => 30); kael.atkCd = 0; kael.stun = 0; kael.b.speed = 0;
  lyra.stun = 50;
  const t0 = foe.taken;
  E.stepHeadless(0.45);
  const withAura = foe.taken - t0;
  lyra.hp = 0;
  E.stepHeadless(0.02);
  foe.taken = 0; kael.atkCd = 0; kael.stun = 0; lyra.stun = 50;
  E.stepHeadless(0.45);
  const without = foe.taken;
  if (!(withAura > without + 1)) problems.push("Lyra's Hall Standard did not raise Kael's hit (" + withAura + " vs " + without + ")");
}

/* Unwrite Ink, even though no current kit is drafted with it */
E.newMatch({ you: ["lyra"], foe: ["brute"] }, 1, 12);
{
  const S = E.state(); S.phase = "live";
  const lyra = S.your[0], brute = S.foe[0];
  brute.b.cards.push(R.CARDS.cleanse);
  brute.usedCleanse = false;
  lyra.x = 480; lyra.y = 340; brute.x = 520; brute.y = 340;
  brute.max = 250000; brute.hp = brute.max;
  if (!E.forceCast(lyra, 0)) problems.push("cleanse setup: hymn refused");
  else if (brute.stun > 0 || !brute.usedCleanse) problems.push("Unwrite Ink did not shrug the first stun");
}

/* The sheet's own numbers: cooldown, mana, bleed, armor, the first move. */
{
  const vale = R.build(R.byId.vale, [], null, Math.random);
  const kairos = R.build(R.byId.kairos, [], null, Math.random);
  const orinB = R.build(R.byId.orin, [], null, Math.random);
  if (Math.abs(vale.cdMul - 0.82) > 0.001) problems.push("Vale cooldown mul " + vale.cdMul + " (sheet is 0.82)");
  if (kairos.cdMul !== 0.4) problems.push("Kairos cooldown mul " + kairos.cdMul + " (capped at 0.4)");
  if (orinB.manaMax !== 180) problems.push("Orin mana max " + orinB.manaMax + " (150 and +20%)");
  if (Math.abs(orinB.manaRegen - 19.2) > 0.05) problems.push("Orin mana regen " + orinB.manaRegen + " (12 and +60%)");
}

E.newMatch({ you: ["kael"], foe: ["brute"] }, 1, 31);
{
  const S = E.state(); S.phase = "live";
  if (S.lv) S.lv.realm = "stone";
  const kael = S.your[0], foe = S.foe[0];
  foe.max = 250000; foe.hp = foe.max; foe.b.armor = 0; foe.armorBuff = 0; foe.shd = 0;
  kael.b.crit = 0; kael.b.mods.execute = 0; kael.b.mods.fury = 0;
  kael.x = 480; kael.y = 340; foe.x = 520; foe.y = 340;
  if (!E.forceCast(kael, 0)) problems.push("Rend refused");
  else {
    const before = foe.taken;
    freeze(S);
    E.stepHeadless(2);
    const bled = foe.taken - before;
    if (bled < 12) problems.push("Rend bleed dealt " + bled + " over 2s (10 a second)");
  }
}

E.newMatch({ you: ["vale"], foe: ["brute"] }, 1, 32);
{
  const S = E.state(); S.phase = "live";
  if (S.lv) S.lv.realm = "stone";
  const vale = S.your[0], brute = S.foe[0];
  vale.b.armor = 40; vale.armorBuff = 0; vale.b.mods.bulwark = 0; vale.b.mods.veil = 0;
  vale.hp = vale.max; vale.stun = 30; vale.mana = 0; vale.b.speed = 0;
  brute.b.crit = 0; brute.b.mods.execute = 0; brute.b.mods.fury = 0; brute.b.dmg = 8; brute.b.speed = 0;
  brute.x = 480; brute.y = 340; vale.x = 510; vale.y = 340;
  brute.mana = 0; brute.cds = brute.b.moves.map(() => 30); brute.atkCd = 0; brute.stun = 0;
  const hp0 = vale.hp;
  E.stepHeadless(0.2);
  if (vale.hp !== hp0 || vale.taken > 0) problems.push("armor 40 let a chip of " + vale.taken + " through");
}

E.newMatch({ you: ["sancora", "vale"], foe: ["brute"] }, 2, 33);
{
  const S = E.state(); S.phase = "live";
  if (S.lv) S.lv.realm = "stone";
  const sancora = S.your[0], vale = S.your[1], brute = S.foe[0];
  vale.b.armor = 0; vale.armorBuff = 0; vale.b.mods.bulwark = 0; vale.b.mods.veil = 0;
  brute.b.crit = 0; brute.b.mods.execute = 0; brute.b.mods.fury = 0; brute.b.dmg = 40; brute.b.speed = 0;
  const place = () => {
    brute.x = 480; brute.y = 340; vale.x = 510; vale.y = 340; sancora.x = 80; sancora.y = 80;
    brute.mana = 0; brute.cds = brute.b.moves.map(() => 40); brute.atkCd = 0; brute.stun = 0;
    vale.stun = 40; vale.mana = 0; vale.b.speed = 0; sancora.stun = 40;
    vale.taken = 0; vale.hp = vale.max;
  };
  place();
  E.stepHeadless(0.2);
  const withAura = vale.taken;
  sancora.dead = true; sancora.hp = 0;
  place();
  E.stepHeadless(0.2);
  const without = vale.taken;
  if (!(withAura + 1 < without)) problems.push("Sancora's armor aura did not cut the hit (" + withAura + " vs " + without + ")");
}

E.newMatch({ you: ["orin"], foe: ["brute"] }, 1, 34);
{
  const S = E.state(); S.phase = "live";
  if (S.lv) S.lv.realm = "stone";
  const orin = S.your[0], foe = S.foe[0];
  foe.max = 250000; foe.hp = foe.max; foe.b.armor = 0; foe.armorBuff = 0; foe.shd = 0;
  foe.b.mods.bulwark = 0; foe.b.mods.veil = 0; foe.b.mods.thorns = 0;
  orin.b.crit = 0; orin.b.mods.execute = 0; orin.b.mods.fury = 0; orin.b.speed = 0;
  orin.x = 400; orin.y = 340; foe.x = 500; foe.y = 340;
  orin.mana = 0; orin.cds = orin.b.moves.map(() => 30); orin.atkCd = 0; orin.stun = 0; orin.silence = 0;
  foe.stun = 40;
  E.stepHeadless(0.7);
  if (orin.firstUsed) problems.push("Orin's basic spent Named Pulse");
  const land = () => {
    foe.taken = 0; foe.hp = foe.max; foe.shd = 0; foe.stun = 40; foe.b.armor = 0;
    if (!E.forceCast(orin, 0)) { problems.push("Unwrite refused"); return 0; }
    orin.silence = 30; orin.atkCd = 30;
    E.stepHeadless(0.5);
    return foe.taken;
  };
  const first = land();
  const second = land();
  if (!(first > second * 1.85 && first < second * 2.15)) problems.push("Named Pulse " + first + " then " + second);
}

if (problems.length) {
  problems.forEach((p) => console.log("FAIL  " + p));
  console.log("FAILED — " + problems.length + " kit problems");
  process.exit(1);
}
console.log("ok    all " + R.ROSTER.length + " kits: moves, buffs and basics resolved");
