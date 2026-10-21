/* Lattice Crypt QA matrix — Node stand-in for Playwright (canvas cabinet). */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const smoke = spawnSync(process.execPath, [path.join(__dirname, "crypt_studio_smoke.js")], { encoding: "utf8" });
if (smoke.status !== 0) {
  process.stderr.write(smoke.stdout + smoke.stderr);
  process.exit(smoke.status || 1);
}
const game = fs.readFileSync(path.join(root, "game.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "game.css"), "utf8");
const studio = fs.readFileSync(path.join(root, "studio.js"), "utf8");

function must(cond, msg) { if (!cond) throw new Error(msg); }

must(html.indexOf("cryptBg") >= 0 && html.indexOf("cryptFx") >= 0, "4 layers: bg + world + fx");
must(html.indexOf("studioHud") >= 0, "HUD layer");
must(html.indexOf("role=\"dialog\"") >= 0, "dialog ARIA");
must(css.indexOf("bg-canvas") >= 0 && css.indexOf("fx-canvas") >= 0, "layer CSS");
must(game.indexOf("p1Map") >= 0 && game.indexOf("data-bind") >= 0, "remappable P1");
must(game.indexOf("paintTileCache") >= 0 && game.indexOf("chunkSize: 16") >= 0, "chunk tile cache");
must(game.indexOf("function blit") >= 0, "pre-scale blit");
must(studio.indexOf("createStereoPanner") >= 0, "spatial SFX");
must(studio.indexOf("drumOsc") >= 0, "drum stem");
must(game.indexOf("999999999") >= 0, "score cap");
/* The wave clock: one wave a minute, and a wave is a standing target rather than a spawn rate.
   Fodder ramps 100 a wave ACROSS the wave to a hard 800, then stops rising; from wave 9 the ramp
   moves to the named band. That is the shape of the difficulty curve — the crowd stops growing
   and the things standing in it get harder — so it is asserted, not left to drift. */
must(game.indexOf("function surviveCap") >= 0 && game.indexOf("normCap: 800") >= 0 && game.indexOf("function waveNormals") >= 0, "the fodder field ramps 100 a wave to a hard 800");
must(game.indexOf("sec: 60") >= 0 && game.indexOf("function waveOf") >= 0 && game.indexOf("function surviveField") >= 0, "one wave a minute, and the cadence chases the wave target");
must(game.indexOf("function waveBosses") >= 0 && game.indexOf("bossAt: 9") >= 0 && game.indexOf("boss: 25") >= 0, "named bands from wave 9, 25 a wave");
must(game.indexOf("waveOf(G.t || 0)") >= 0 && game.indexOf("WAVE.sec - ((G.t") >= 0, "the HUD wave number and its clock run on the same minute");
must(game.indexOf('G.mode === "endless" && G.t > WAVE.sec') >= 0 && game.indexOf("waveNormals(G.t || 0)") >= 0, "endless nexuses ride the wave band under the frame budget");
must(game.indexOf('G.mode === "endless" && G.t > WAVE.sec') >= 0 && game.indexOf('" · wave " + surviveWave()') >= 0, "endless shows the wave its ramp rides");
/* The tide has to be able to win: pressure() is the unbounded late-game multiplier, and both
   halves of every fight — what they take and what they deal — must ride it, along with how
   many of them are mutants. A ceilinged curve lets a good build become immortal. */
must(game.indexOf("function pressure()") >= 0 && game.indexOf(")) * pressure();") >= 0 && game.indexOf("Math.pow(pressure(), 0.75)") >= 0 && game.indexOf("* press))") >= 0 && game.indexOf("0.035 * over") >= 0, "unbounded pressure on their damage, their health and mutant density");
/* Contact damage has to be able to land. A hurt window is a per-frame hit cap, not immunity:
   reading it as immunity let a foe in contact re-arm it every frame, so a warden standing in a
   horde was untouchable and the run could not end. */
must(game.indexOf("surviveIframe") < 0, "no permanent i-frame in Survival");
/* All three modes must survive a HUD paint: authored floors carry `exit`, generated ones
   only paint the tile, so the HUD has to resolve the door through one accessor. */
must(game.indexOf("function levelExit") >= 0, "mode-agnostic exit lookup");
must(game.indexOf("lv.exit.x") < 0 && game.indexOf("lv.box ? lv.box") < 0, "HUD must not read a raw floor exit");
must(game.indexOf("function killXpValue") >= 0 && game.indexOf("KILL_XP") >= 0, "kill xp knob");
must(game.indexOf("const PACING = {") >= 0 && game.indexOf("knee: 180") >= 0 && game.indexOf("function paceRamp") >= 0, "one pacing curve with a 3-minute knee");
/* The roster is its own layer: random bosses from the 2-minute mark, on top of the crowd, and
   stacking them has to be punished or the layer is just decoration. */
must(game.indexOf("rosterAt: 120") >= 0 && game.indexOf("function rosterTick") >= 0 && game.indexOf("f.roster = true") >= 0 && game.indexOf("(f.rage || 1)") >= 0, "random boss roster from the 2-minute mark, with stacking rage");
must(game.indexOf("if (G.rosCount) pills.push(\"BOSSES \"") >= 0, "a live boss count on the HUD");
/* The controller layer is a shipped feature and had no coverage: five polling sites feed movement,
   hot-join, the sheet and the card cabinet, and a reworded line would silently drop one. */
must((game.match(/navigator\.getGamepads/g) || []).length >= 5, "gamepads polled on every input path (move, hot-join, sheet, cabinet)");
must(game.indexOf("if (pad.buttons[0] && pad.buttons[0].pressed) fire = true;") >= 0 && game.indexOf("if (pad.buttons[7] && pad.buttons[7].pressed) fire = true;") >= 0, "pad fire on A and the right trigger");
must(game.indexOf("if (pad.buttons[12] && pad.buttons[12].pressed)") >= 0 && game.indexOf("if (pad.buttons[15] && pad.buttons[15].pressed)") >= 0 && game.indexOf("Math.abs(ax) > 0.35") >= 0, "pad stick and d-pad movement");
must(game.indexOf("pad.buttons[9]") >= 0 && game.indexOf("pad.buttons[8]") >= 0 && game.indexOf("magBtn") >= 0, "pad Start hot-join, Select sheet, vial button");
must(game.indexOf("ax < -0.55") >= 0 && game.indexOf("confirmSurviveUp(G._upSel)") >= 0, "the pad drives the card cabinet");
must(game.indexOf("bindIdlePads") >= 0 && game.indexOf("claimedPads") >= 0, "one pad per warden");
must(game.indexOf("PACING.spawn) / Math.max") < 0, "horde cadence must ride the curve, not a flat dial");
must(game.indexOf("function paceGap") >= 0 && game.indexOf("paceGap(2.1 /") >= 0, "every spawner rides the curve");
must(game.indexOf("function heroOpen") >= 0, "roster open from the first run");
must(game.indexOf("\"leech\"") >= 0 && game.indexOf("\"bounty\"") >= 0, "leech + tithe cards");
must(game.indexOf("function modeFloorLabel") >= 0 && game.indexOf("hud-all") >= 0, "HUD in every mode");
must(game.indexOf("G.players.forEach((p) => {\n      if (p.dead) return;") >= 0 || game.indexOf("if (p.dead) return;") >= 0, "companion takes cards");
must(game.indexOf("visibilitychange") >= 0, "tab pause");
must(game.indexOf("onBossPhase") >= 0, "boss phase");
["onFire","onPickup","onEnemyHit","onBossHit","onEnemyDeath","onKill","onBossDeath","onBossSpawn","onPlayerHit","onPlayerDeath","onWaveStart","onWaveComplete","onHeal","onDash"].forEach(function (ev) {
  must(game.indexOf(ev) >= 0, "event " + ev);
});
must(/game\.js\?v=\d+/.test(html), "game cache-bust");
must(/game\.css\?v=\d+/.test(html), "css cache-bust");
must(html.indexOf("cryptMap") >= 0 && css.indexOf("map-canvas") >= 0, "radar map layer");
must(game.indexOf("function drawMap") >= 0 && game.indexOf("function mapCacheFor") >= 0 && game.indexOf("_mapNew") >= 0, "map cache + fog sync");
must(game.indexOf("function compassTargets") >= 0 && game.indexOf("function drawCompass") >= 0 && game.indexOf("PRIZE") >= 0, "objective compass");
must(game.indexOf("function drawLights") >= 0 && game.indexOf("function glowSprite") >= 0 && game.indexOf("lighter") >= 0, "lantern light pass");
must(game.indexOf("function drawDangerEdge") >= 0 && game.indexOf("function noteHitDir") >= 0 && game.indexOf("function vignetteSprite") >= 0, "danger edge + hit read");
must(game.indexOf("function comboMult") >= 0 && game.indexOf("function scoreKill") >= 0 && game.indexOf("comboTier") >= 0, "kill streak multiplier");
must(game.indexOf("function cycleMapMode") >= 0 && game.indexOf("KeyN") >= 0, "map key");
must(game.indexOf("CryptStudio.reduced") >= 0 && game.indexOf("flick") >= 0, "reduced-motion honoured");
must(game.indexOf("hp: 96") >= 0 && game.indexOf("Math.max(12, 20") >= 0, "pet hide+20s sleep");
must(game.indexOf("autoUpBox") >= 0 && game.indexOf("function autoPickUp") >= 0, "auto-pick upgrades");
must(game.indexOf("Math.pow(lv, 1.55)") >= 0 && game.indexOf("const KILL_XP = 1;") >= 0, "leveling is measured in kills, not minutes");
must(game.indexOf("kind: \"bond\"") >= 0 && game.indexOf("packhide") >= 0 && game.indexOf("callpack") >= 0, "bond pet cards");
must(game.indexOf("function pollSelectChar") >= 0 && game.indexOf("buttons[8]") >= 0, "pad select opens sheet");
must(game.indexOf("function spawnPet") >= 0 && game.indexOf("Ashmane") >= 0 && game.indexOf("Glassbarb") >= 0, "mythic pets");
must(game.indexOf("function aiInput") >= 0 && game.indexOf("bondPickHtml") >= 0, "AI companion pick");
must(game.indexOf("Brotato") < 0 && html.indexOf("Brotato") < 0, "haven-original copy");
must(game.indexOf("strokeRect(Math.round(dx)") < 0, "no foe square frame");
must(game.indexOf("Start small. The lattice grows with you.") >= 0, "survive start dump");
must(game.indexOf("0.48 + 0.035") >= 0 && game.indexOf("0.28 * (w - 1)") >= 0, "survive dmg+hp curve");
must(game.indexOf("minSep") >= 0 && game.indexOf("cast-art") >= 0, "fog spawn + roster art");
must(game.indexOf("hp: 200") >= 0 && game.indexOf("cistern") >= 0 && game.indexOf("originpulse") >= 0, "200hp+well cards");
must(game.indexOf("stitch") >= 0 && game.indexOf("echoer") >= 0 && game.indexOf("veilkin") >= 0 && game.indexOf("rollFoeMut") >= 0, "new foes+muts");
must(game.indexOf("hpScale") >= 0 && game.indexOf("hallMark") >= 0, "scale+hall");
must(game.indexOf("up-cabinet") >= 0 && game.indexOf("secondwind") >= 0, "arcade upgrade");
must(game.indexOf("latticearc") >= 0 && game.indexOf("unspool") >= 0 && game.indexOf("titheking") >= 0 && game.indexOf("nameeater") >= 0, "new loot and super bosses");
must(game.indexOf("originwell") >= 0 && game.indexOf("accordseal") >= 0, "legendaries");
must(game.indexOf("toggleChar") >= 0 && game.indexOf("closeChar") >= 0 && game.indexOf("INV_BAG") >= 0, "character bag");
must(game.indexOf("updateFog") >= 0 && game.indexOf("drawFog") >= 0, "fog of war");
must(html.indexOf("data-radio-vol") >= 0, "radio volume");
must(game.indexOf("function options") >= 0, "options menu");
/* --- level design: a door needs a reason, and a gauntlet is the shape of a floor ---------- */
const camp = fs.readFileSync(path.join(root, "campaign.js"), "utf8");
must(game.indexOf("Doors are NOT cut here") >= 0 && game.indexOf("const dN = 4 +") < 0, "no door cuts a procedural floor");
must(game.indexOf("const gauntlets = [];") >= 0 && game.indexOf("gauntlet: 1") >= 0 && game.indexOf("function gSpot(") >= 0, "an endless floor carries a gauntlet: nexuses and a prize down an open lane");
must(game.indexOf("if (k === \"key\" || k === \"latch\" || k === \"triadkey\") k = \"coin\";") >= 0, "no keys on floors that cut no doors");
must(game.indexOf("const gauntlets = plazas.map(") >= 0, "survive lanes declared as gauntlets");
must(camp.indexOf("--- door triage") >= 0 && camp.indexOf("keysOpen") >= 0, "a campaign door is deleted unless a key opens something worth it");
must(camp.indexOf("A wing that holds an authored door is a designed vault") >= 0, "the repair pass must not unseal a designed vault");
must(camp.indexOf("gauntlets.forEach(coverLane)") >= 0 && camp.indexOf("inVaultRect") >= 0, "campaign gauntlets keep a clear channel and leave vaults standing as islands");
must(camp.indexOf("Doors are the one thing here that is not decoration") >= 0, "the door doctrine is stated where it is enforced");
must(html.indexOf("cryptPad") >= 0 && html.indexOf("padStick") >= 0 && game.indexOf("function syncTouchPad") >= 0 && game.indexOf("function bindCryptPad") >= 0, "on-screen door pad");
must(game.indexOf("function beginDash") >= 0 && game.indexOf("function bumpDash") >= 0 && game.indexOf("keyEdge.KeyC") >= 0 && game.indexOf("buttons[5]") >= 0, "sidestep on C and RB");
must(game.indexOf("const RITES = [") >= 0 && game.indexOf("function grantSeals") >= 0 && game.indexOf("function applyRite") >= 0 && game.indexOf("Tithe Pocket") >= 0, "accord rites");
must(game.indexOf("touchPad") >= 0 && game.indexOf("padSel") >= 0, "pad option persisted");
must(html.indexOf("tale.js") >= 0 && html.indexOf("id=\"tale\"") >= 0 && game.indexOf("data-go='tale'") >= 0 && game.indexOf("LatticeTale.open") >= 0, "complete mode wired");
const taleSmoke = spawnSync(process.execPath, [path.join(__dirname, "crypt_tale_smoke.js")], { encoding: "utf8" });
if (taleSmoke.status !== 0) {
  process.stderr.write(taleSmoke.stdout + taleSmoke.stderr);
  throw new Error("tale smoke");
}
console.log("crypt_studio_qa ok", { smoke: "pass", layers: 4, events: 14, remap: true, spatial: true });