/* Complete mode — skill book, stance triangle, realm features. */
const path = require("path");
const tale = require(path.join(__dirname, "..", "tale.js"));
if (!tale || !tale.skills || tale.skills.length < 300) {
  throw new Error("skill book " + (tale && tale.skills && tale.skills.length));
}
const ids = new Set(tale.skills.map(function (s) { return s.id; }));
if (ids.size !== tale.skills.length) throw new Error("duplicate skill ids");
const d = tale.debug;
if (d.clash("strike", "weave") !== "win") throw new Error("strike should beat weave");
if (d.clash("weave", "ward") !== "win") throw new Error("weave should beat ward");
if (d.clash("ward", "strike") !== "win") throw new Error("ward should beat strike");
if (d.clash("strike", "strike") !== "tie") throw new Error("same stance should clash");
[1, 2, 7, 99, 404].forEach(function (seed) {
  const world = d.genWorld(seed);
  if (!world || world.nodes.length !== 160) throw new Error("map " + seed);
  const kinds = {};
  world.nodes.forEach(function (n) { kinds[n.kind] = (kinds[n.kind] || 0) + 1; });
  if (kinds.town !== 4 || kinds.ruin !== 3 || kinds.obelisk !== 3 || kinds.evil !== 3 || kinds.cave !== 2) {
    throw new Error("features " + seed + " " + JSON.stringify(kinds));
  }
  if (world.towns.length !== 4) throw new Error("town ledger");
});
const bout = tale.debug.dryBattle(3);
if (!bout || bout.events < 1 || bout.heroHp <= 0 && bout.foeHp <= 0) throw new Error("dry battle " + JSON.stringify(bout));
const mem = {};
global.localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
  setItem: function (k, v) { mem[k] = String(v); },
  removeItem: function (k) { delete mem[k]; }
};
if (!tale.debug.writeSlot("Gatehold dusk", "manual")) throw new Error("manual save failed");
if (!tale.debug.writeSlot("Autosave", "auto", "auto")) throw new Error("autosave failed");
const book = tale.debug.readBook();
if (book.length !== 2) throw new Error("book " + book.length);
const loaded = tale.debug.loadSlot(book.filter(function (s) { return s.kind === "manual"; })[0].id);
if (!loaded || !loaded.state.party.length) throw new Error("load failed");
tale.debug.dropSlot("auto");
if (tale.debug.readBook().some(function (s) { return s.kind === "auto"; })) throw new Error("autosave remained");
console.log("crypt_tale_smoke ok", { skills: tale.skills.length, map: "16x10", bout: bout, saves: book.length });
