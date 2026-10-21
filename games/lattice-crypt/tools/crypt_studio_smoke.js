/* Node smoke: 100 restarts, pool recycle, studio strings. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "..", "studio.js"), "utf8");
const g = {
  addEventListener: function () {},
  AudioContext: function () { throw new Error("no audio"); },
  localStorage: { getItem: function () { return "{}"; }, setItem: function () {} }
};
g.window = g;
g.globalThis = g;
vm.runInNewContext(src, g);
const S = g.CryptStudio;
if (!S) throw new Error("no CryptStudio");
if (S.STEP !== 1 / 60) throw new Error("STEP not 60Hz");
if (typeof S.feel !== "function") throw new Error("no feel");
if (!S.pool.foe) throw new Error("no foe pool");
if (typeof S.setSfxVol !== "function" || typeof S.setMusicVol !== "function") throw new Error("no volume");

const a = S.pool.shot.alloc();
const b = S.pool.shot.alloc();
if (!a.isActive || !b.isActive) throw new Error("alloc inactive");
a._chained = true;
S.pool.shot.free(a);
S.pool.shot.free(b);
const recycled = S.pool.shot.alloc();
if (recycled._chained) throw new Error("sticky _chained on pooled shot");
S.pool.shot.free(recycled);
if (S.pool.shot.live() !== 0) throw new Error("live after free " + S.pool.shot.live());
S.burst(1, 1, "#fff", 12);
S.floater(1, 1, "9", "#fff");
S.cleanup();
const c = S.counts();
if (c.particles !== 0 || c.floaters !== 0) throw new Error("cleanup leak " + JSON.stringify(c));
if (S.restarts < 1) throw new Error("restarts");

const born0 = S.counts().shotsBorn;
for (let i = 0; i < 100; i++) {
  const s = S.pool.shot.alloc();
  S.burst(0, 0, "#fff", 6);
  S.floater(0, 0, "1", "#fff");
  S.feel("kill", 0, 0);
  S.pool.shot.free(s);
  S.cleanup();
}
if (S.counts().particles !== 0) throw new Error("restart leak");
if (S.restarts < 100) throw new Error("restart count " + S.restarts);
if (S.counts().shotsBorn > born0 + 2) throw new Error("shot born grew " + S.counts().shotsBorn + " from " + born0);

const game = fs.readFileSync(path.join(__dirname, "..", "game.js"), "utf8");
["seek", "chain", "barrage", "nova", "burst", "spawnling", "mend"].forEach(function (k) {
  if (game.indexOf(k) < 0) throw new Error("missing " + k);
});
["togglePause", "cleanupGameState", "keyEdge.KeyP", "pool.shot.free", "s._chained = false",
  "queryFoes", "rebuildFoeGrid", "showCoach", "lodOn", "CryptStudio.STEP",
  "onBossSpawn", "onWaveComplete", "onPlayerDeath", "onHeal", "onDash",
  "setSfxVol", "cryptFx", "visibilitychange", "p1Map", "persist.binds",
  "paintTileCache", "blit(", "cryptBg", "createStereoPanner"].forEach(function (k) {
  if (game.indexOf(k) < 0 && src.indexOf(k) < 0) throw new Error("missing " + k);
});
if (game.indexOf("normCap: 800") < 0) throw new Error("the fodder field must ramp to a hard 800");
if (game.indexOf("function waveBosses") < 0 || game.indexOf("sec: 60") < 0) throw new Error("wave clock missing: one minute a wave, named bands from wave 9");
if (game.indexOf("function pressure()") < 0) throw new Error("no late-game pressure curve");
if (game.indexOf("function rosterTick") < 0) throw new Error("no random boss roster");
if (game.indexOf("navigator.getGamepads") < 0) throw new Error("no gamepad polling");
const foe = S.pool.foe.alloc();
S.pool.foe.free(foe);
const bornF = S.counts().foesBorn;
for (let i = 0; i < 40; i++) {
  const f = S.pool.foe.alloc();
  S.pool.foe.free(f);
  S.cleanup();
}
if (S.counts().foesBorn > bornF + 1) throw new Error("foe born grew");
console.log("crypt_studio_smoke ok", S.counts());