/* One question: can three bodies put a mark on Gate. */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
function stubEl() {
  return { style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} },
    getContext: () => ({ imageSmoothingEnabled: false, fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1,
      font: "", textAlign: "", globalCompositeOperation: "", fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {},
      arc() {}, ellipse() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, save() {}, restore() {}, translate() {},
      scale() {}, setTransform() {}, setLineDash() {}, drawImage() {}, clearRect() {} }),
    toDataURL: () => "", appendChild() {}, addEventListener() {}, removeEventListener() {},
    getBoundingClientRect: () => ({ width: 900, height: 600, left: 0, top: 0 }), querySelector: () => null,
    querySelectorAll: () => [], setAttribute() {}, focus() {} };
}
const document = { createElement: () => stubEl(), getElementById: () => stubEl(), querySelector: () => null,
  querySelectorAll: () => [], addEventListener() {}, body: stubEl(), documentElement: stubEl() };
const win = { devicePixelRatio: 1, document, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  Image: function () {}, fetch: () => Promise.resolve({ json: () => Promise.resolve({}) }), setTimeout, clearTimeout, console };
win.window = win;
vm.runInContext([ "roster.js", "attacks.js", "brain.js", "arena.js" ].map((f) => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n"), vm.createContext(win));
const E = win.ArenaEngine;
function fight(foe, seed) {
  const S = E.runHeadless({ you: ["gate"], foe }, 3, 0.01, seed);
  let t = 0;
  while (!S.over && t < 140) { E.stepHeadless(0.25); t += 0.25; }
  const g = S.your.find((e) => e.b && e.b.id === "gate");
  const foes = S.foe.filter((e) => e.b && e.b.cls !== "token");
  return { win: S.winner === 0, dead: !!(g && g.dead), taken: g ? g.taken : 0, hp: g ? g.hp / g.max : 0,
    foeDead: foes.filter((e) => e.dead).length, shd: g ? g.shd : 0, t: S.time };
}
const walls = [
  ["vale", "justicae", "bear"],
  ["vale", "elephant", "brute"],
  ["kael", "vale", "arkos"],
  ["nia", "srath", "wraith"],
  ["sancora", "lyra", "lightfather"],
  ["orin", "kairos", "nia"],
  ["wolf", "lion", "scorpion"]
];
walls.forEach((foe) => {
  let win = 0, taken = 0, hp = 0, dead = 0, foeDead = 0;
  for (let k = 0; k < 6; k++) {
    const r = fight(foe, 2000 + k * 17 + foe.length);
    if (r.win) win++;
    if (r.dead) dead++;
    taken += r.taken; hp += r.hp; foeDead += r.foeDead;
  }
  console.log(foe.join(",").padEnd(34) + " gate " + win + "/6  died " + dead +
    "  taken " + Math.round(taken / 6) + "  hp " + Math.round(100 * hp / 6) +
    "%  foes down " + (foeDead / 6).toFixed(1));
});
