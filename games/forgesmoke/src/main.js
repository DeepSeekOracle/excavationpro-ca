import * as THREE from "three";
import { FlowPhase, installStudio, makeRng } from "./studio.js";
import { standardMaterial } from "./materials.js";
import { makeBush, makeLog, makeTree, swayTree } from "./foliage.js";
import { generateWeaponIconAtlas, getWeaponIconUV, createWeaponIconMesh, STYLE_ICON_INDEX, generateWeaponIconDataUrls, loadWeaponIconSheetDataUrls } from "./icons.js";
import {
  PALETTE,
  TYPE_SCALE,
  HUD_ICONOGRAPHY,
  MATERIAL_RECIPES,
  ARENA_BY_BEAT,
  ARENA_LIGHTING,
  POINT_LIGHT_SCALE,
  hexInt,
} from "./theme.js";
import { TUNING } from "./tuning.js";
import { WeaponManager, CardSystem, Weapon } from "./weapons.js";
import { EnemyManager, ENEMY_TYPES } from "./enemies.js";
import { BeatDirector, ScoreSystem, ResultsScreen } from "./director.js";
import { loadSave, saveSave, updateBestScore, updateBestTime, getSettings, DEFAULT_SAVE } from "./save.js";
import { bakeProceduralArtSprites, PROCEDURAL_ART_MODULES } from "./art/index.js";
import * as levelModule from "./level.js";
import * as menuModule from "./menu.js";
import * as audioModule from "./audio.js";
import * as fxModule from "./fx.js";

const TAU = Math.PI * 2;
const urlParams = new URLSearchParams(window.location.search);
const lowEnd = urlParams.has("low");
const testMode = urlParams.has("test");
const renderer = new THREE.WebGLRenderer({ antialias: !lowEnd });
renderer.setPixelRatio(lowEnd ? 1 : Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = !lowEnd;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const TEX_SIZE = lowEnd ? 128 : 512;
const RAIN_COUNT = lowEnd ? 60 : 420;
const TREE_COUNT = lowEnd ? 6 : 16;
const BUSH_COUNT = lowEnd ? 6 : 20;
const LOG_COUNT = lowEnd ? 1 : 4;
const TREE_CARDS = lowEnd ? 6 : 13;
const BUSH_CARDS = lowEnd ? 8 : 22;
const ENEMY_CAP = lowEnd ? 10 : 20;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = ARENA_LIGHTING.perimeter.exposure;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(hexInt(ARENA_LIGHTING.perimeter.background));
scene.fog = new THREE.FogExp2(hexInt(ARENA_LIGHTING.perimeter.fog.color), ARENA_LIGHTING.perimeter.fog.density);
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 240);
function resize() {
  const width = Math.max(1, innerWidth), height = Math.max(1, innerHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const hemi = new THREE.HemisphereLight(
  hexInt(ARENA_LIGHTING.perimeter.hemisphere.sky),
  hexInt(ARENA_LIGHTING.perimeter.hemisphere.ground),
  ARENA_LIGHTING.perimeter.hemisphere.intensity,
);
scene.add(hemi);
const sun = new THREE.DirectionalLight(hexInt(ARENA_LIGHTING.perimeter.sun.color), ARENA_LIGHTING.perimeter.sun.intensity);
sun.position.set(...ARENA_LIGHTING.perimeter.sun.position);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 90 });
sun.shadow.bias = -0.0006;
scene.add(sun);

// Floodlight rig (A070). One rig is reused across arenas; only position/colour/power change.
const floodlightRig = new THREE.Group();
floodlightRig.userData.tag = "floodlights";
scene.add(floodlightRig);
const floodlightHousingGeo = new THREE.CylinderGeometry(0.24, 0.34, 0.55, 8);
const floodlightHousingMat = standardMaterial({
  ...MATERIAL_RECIPES.floodlightHousing,
  size: TEX_SIZE,
});
const floodlights = [];
for (let i = 0; i < 3; i++) {
  const light = new THREE.PointLight(hexInt(ARENA_LIGHTING.perimeter.floodlights[0].color), 0, 18, 2);
  light.visible = false;
  const housing = new THREE.Mesh(floodlightHousingGeo, floodlightHousingMat);
  housing.rotation.z = Math.PI / 2;
  housing.castShadow = false;
  housing.userData.tag = "floodlight";
  housing.visible = false;
  floodlightRig.add(light);
  floodlightRig.add(housing);
  floodlights.push({ light, housing });
}

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 240),
  standardMaterial({ ...MATERIAL_RECIPES.ground, size: TEX_SIZE }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.userData.tag = "ground";
scene.add(ground);

const puddleMat = standardMaterial({ ...MATERIAL_RECIPES.puddle, size: TEX_SIZE });
const puddleGeo = new THREE.CircleGeometry(1, 28);
const worldRng = makeRng(4242);
for (let i = 0; i < 22; i++) {
  const a = worldRng() * TAU, r = 5 + worldRng() * 46;
  const puddle = new THREE.Mesh(puddleGeo, puddleMat);
  puddle.position.set(Math.cos(a) * r, 0.015, Math.sin(a) * r);
  puddle.rotation.set(-Math.PI / 2, 0, worldRng() * TAU);
  puddle.scale.set(0.9 + worldRng() * 2.6, 0.6 + worldRng() * 1.6, 1);
  puddle.userData.tag = "puddle";
  scene.add(puddle);
}

const trees = [];
const sharedBarkMat = standardMaterial({ ...MATERIAL_RECIPES.bark, size: TEX_SIZE });
const sharedLeafMat = standardMaterial({ ...MATERIAL_RECIPES.leaf, size: TEX_SIZE });
const sharedBushMat = standardMaterial({ ...MATERIAL_RECIPES.bush, size: TEX_SIZE });

for (let i = 0; i < TREE_COUNT; i++) {
  const a = worldRng() * TAU, r = 10 + worldRng() * 38;
  const tree = makeTree({ height: 5.5 + worldRng() * 3.5, spread: 2.7 + worldRng() * 1.5, seed: 20 + i, cards: TREE_CARDS, bark: sharedBarkMat, leaf: sharedLeafMat, texSize: TEX_SIZE });
  tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  tree.rotation.y = worldRng() * TAU;
  scene.add(tree);
  trees.push(tree);
}
for (let i = 0; i < BUSH_COUNT; i++) {
  const a = worldRng() * TAU, r = 4 + worldRng() * 30;
  const bush = makeBush({ radius: 0.65 + worldRng() * 0.9, seed: 90 + i, leaf: sharedBushMat, texSize: TEX_SIZE });
  bush.position.set(Math.cos(a) * r, bush.position.y, Math.sin(a) * r);
  scene.add(bush);
}
for (let i = 0; i < LOG_COUNT; i++) {
  const a = worldRng() * TAU, r = 8 + worldRng() * 24;
  const log = makeLog({ length: 2 + worldRng() * 1.6, radius: 0.18 + worldRng() * 0.1, seed: 140 + i, bark: sharedBarkMat, texSize: TEX_SIZE });
  log.position.x = Math.cos(a) * r;
  log.position.z = Math.sin(a) * r;
  log.rotation.y = worldRng() * TAU;
  scene.add(log);
}

const RAIN = RAIN_COUNT;
const rainPos = new Float32Array(RAIN * 6);
const rainRng = makeRng(9090);
function seedDrop(i, cx, cz) {
  const x = cx + (rainRng() - 0.5) * 38, z = cz + (rainRng() - 0.5) * 38, y = 8 + rainRng() * 12;
  rainPos.set([x, y, z, x - 0.12, y - 0.95, z - 0.06], i * 6);
}
for (let i = 0; i < RAIN; i++) seedDrop(i, 0, 0);
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: hexInt(PALETTE.rain), transparent: true, opacity: ARENA_LIGHTING.perimeter.rainOpacity, depthWrite: false }));
rain.frustumCulled = false;
rain.userData.tag = "rain";
scene.add(rain);

const weaponIconAtlas = generateWeaponIconAtlas();
weaponIconAtlas.userData.tag = "weapon-icon-atlas";

const proceduralArtSprites = typeof bakeProceduralArtSprites === "function" ? bakeProceduralArtSprites() : {};
const fxController = typeof fxModule?.createFx === "function" ? fxModule.createFx(renderer.domElement) : null;
const menuController = typeof menuModule?.createMenu === "function" ? menuModule.createMenu(renderer.domElement, {}) : null;
let audioController = null;
if (typeof audioModule?.initAudio === "function") {
  audioModule.initAudio().then((ctrl) => { audioController = ctrl; }).catch(() => {});
}
if (typeof levelModule?.loadLevel === "function") {
  levelModule.loadLevel("arena1").catch(() => {});
}

const weaponIconDataUrls = generateWeaponIconDataUrls();
// ART-01 HUD iconography: prefer the shipped, transparent sheet; the runtime sheet above is the fallback.
loadWeaponIconSheetDataUrls(`./${HUD_ICONOGRAPHY.weapon.sheet}`).then((sheet) => {
  if (sheet) Object.assign(weaponIconDataUrls, sheet);
});

const crateGeo = new THREE.BoxGeometry(1.2, 1.0, 1.2);
const crateMat = standardMaterial({ ...MATERIAL_RECIPES.crate, size: TEX_SIZE });
const crateGroup = new THREE.Group();
crateGroup.userData.tag = "airdrop-crate";
const crateBody = new THREE.Mesh(crateGeo, crateMat);
crateBody.position.y = 0.5;
crateBody.castShadow = true;
crateBody.userData.tag = "crate-body";
crateGroup.add(crateBody);
const lidGeo = new THREE.BoxGeometry(1.3, 0.15, 1.3);
const lidMat = standardMaterial({ ...MATERIAL_RECIPES.crateLid, size: TEX_SIZE });
const crateLid = new THREE.Mesh(lidGeo, lidMat);
crateLid.position.y = 1.075;
crateLid.castShadow = true;
crateLid.userData.tag = "crate-lid";
crateGroup.add(crateLid);
const strapGeo = new THREE.BoxGeometry(1.3, 0.05, 0.1);
const strapMat = standardMaterial({ ...MATERIAL_RECIPES.crateStrap, size: TEX_SIZE });
for (let i = 0; i < 2; i++) {
  const strap = new THREE.Mesh(strapGeo, strapMat);
  strap.position.set(i === 0 ? -0.5 : 0.5, 0.55, 0);
  strap.castShadow = true;
  strap.userData.tag = "crate-strap";
  crateGroup.add(strap);
}
const crateParachuteGeo = new THREE.ConeGeometry(2.5, 3, 16, 1, true);
const crateParachuteMat = standardMaterial({
  ...MATERIAL_RECIPES.parachute,
  size: TEX_SIZE,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.9,
});
const crateParachute = new THREE.Mesh(crateParachuteGeo, crateParachuteMat);
crateParachute.position.y = 4.5;
crateParachute.userData.tag = "crate-parachute";
crateGroup.add(crateParachute);
crateGroup.visible = false;
scene.add(crateGroup);

function part(geo, mat, tag, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.userData.tag = tag;
  return mesh;
}
const soldier = new THREE.Group();
soldier.userData.tag = "soldier";
const cloth = standardMaterial({ ...MATERIAL_RECIPES.playerCloth, size: TEX_SIZE });
const flesh = standardMaterial({ ...MATERIAL_RECIPES.playerFlesh, size: TEX_SIZE });
const steel = standardMaterial({ ...MATERIAL_RECIPES.playerSteel, size: TEX_SIZE });
soldier.add(part(new THREE.BoxGeometry(1.2, 1.5, 1.2), cloth, "player-body", 0, 0.8, 0));
soldier.add(part(new THREE.BoxGeometry(0.8, 0.95, 0.4), cloth, "pack", 0, 0.95, -0.78));
soldier.add(part(new THREE.BoxGeometry(0.72, 0.66, 0.72), flesh, "player-head", 0, 1.87, 0));
soldier.add(part(new THREE.BoxGeometry(0.54, 0.16, 0.08), steel, "visor", 0, 1.91, 0.37));
const gunPivot = new THREE.Group();
gunPivot.position.set(0.46, 1.24, 0.34);
soldier.add(gunPivot);
const rifle = part(new THREE.BoxGeometry(0.2, 0.22, 1.35), steel, "rifle", 0, 0, 0.52);
gunPivot.add(part(new THREE.BoxGeometry(0.28, 0.28, 0.22), steel, "muzzle-brake", 0, 0, 1.22));
gunPivot.add(part(new THREE.BoxGeometry(0.16, 0.3, 0.34), steel, "magazine", 0, -0.26, 0.18));
gunPivot.add(rifle);
scene.add(soldier);

const enemyGeo = new THREE.BoxGeometry(1.05, 1.05, 1.05);
const enemyMat = standardMaterial({ ...MATERIAL_RECIPES.enemyChitin, size: TEX_SIZE });
enemyMat.emissive = new THREE.Color(hexInt(PALETTE.enemyEmissive));
enemyMat.emissiveIntensity = 0.75;

const tracerGeo = new THREE.BoxGeometry(0.055, 0.055, 1);
const tracerMat = new THREE.MeshBasicMaterial({ color: hexInt(PALETTE.tracerDefault), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
const tracers = [];
for (let i = 0; i < TUNING.feel.tracerPoolSize; i++) {
  const mesh = new THREE.Mesh(tracerGeo, tracerMat);
  mesh.visible = false;
  mesh.userData.tag = "tracer";
  scene.add(mesh);
  tracers.push({ mesh, life: 0 });
}
const flash = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshBasicMaterial({ color: hexInt(PALETTE.muzzleFlash), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
flash.visible = false;
flash.userData.tag = "muzzle-flash";
scene.add(flash);

// Blackout room-light: every shot lights the room for 0.2 s (ART_BIBLE.md section 5).
const shotLight = new THREE.PointLight(hexInt(PALETTE.muzzleFlash), 0, 20, 2);
shotLight.visible = false;
shotLight.userData.tag = "blackout-shot-light";
scene.add(shotLight);
let shotLightTimer = 0;

// ART-01 per-arena lighting. The arena switches at beat 3 (Breach Yard) and beat 6 (Gunship Pad).
let arenaKey = "perimeter";
let lightsOff = false;

function applyArenaLighting(key) {
  const cfg = ARENA_LIGHTING[key] ? ARENA_LIGHTING[key] : ARENA_LIGHTING.perimeter;
  arenaKey = ARENA_LIGHTING[key] ? key : "perimeter";
  renderer.toneMappingExposure = cfg.exposure;
  scene.background.set(hexInt(cfg.background));
  scene.fog.color.set(hexInt(cfg.fog.color));
  scene.fog.density = cfg.fog.density;
  hemi.color.set(hexInt(cfg.hemisphere.sky));
  hemi.groundColor.set(hexInt(cfg.hemisphere.ground));
  hemi.intensity = cfg.hemisphere.intensity;
  sun.color.set(hexInt(cfg.sun.color));
  sun.intensity = cfg.sun.intensity;
  sun.position.set(...cfg.sun.position);
  rain.material.color.set(hexInt(PALETTE.rain));
  rain.material.opacity = cfg.rainOpacity;
  floodlights.forEach((fixture, index) => {
    const spec = cfg.floodlights[index];
    if (!spec) {
      fixture.light.visible = false;
      fixture.housing.visible = false;
      return;
    }
    fixture.light.position.set(spec.x, spec.height, spec.z);
    fixture.light.color.set(hexInt(spec.color));
    fixture.light.distance = spec.distance;
    fixture.light.intensity = spec.intensity * POINT_LIGHT_SCALE;
    fixture.light.visible = !lightsOff;
    fixture.housing.position.set(spec.x, spec.height, spec.z);
    fixture.housing.visible = true;
  });
}

function setLightsEnabled(on) {
  lightsOff = !on;
  hemi.visible = on;
  sun.visible = on;
  const cfg = ARENA_LIGHTING[arenaKey];
  floodlights.forEach((fixture, index) => {
    fixture.light.visible = on && Boolean(cfg.floodlights[index]);
  });
}

function setBlackout(on) {
  setLightsEnabled(!on);
  const blackout = ARENA_LIGHTING[arenaKey].blackout;
  if (on) {
    enemyMat.emissive.set(hexInt(blackout.hostileEmissive.color));
    enemyMat.emissiveIntensity = blackout.hostileEmissive.intensity;
  } else {
    enemyMat.emissive.set(hexInt(PALETTE.enemyEmissive));
    enemyMat.emissiveIntensity = 0.75;
  }
  shotLight.visible = false;
  shotLightTimer = 0;
}

applyArenaLighting("perimeter");
setLightsEnabled(true);

const saved = loadSave();
const settings = getSettings();
const initialSeed = 1;
const rng = makeRng(initialSeed);

const weaponManager = new WeaponManager(rng);
const cardSystem = new CardSystem(rng);
const enemyManager = new EnemyManager(rng, scene, { enemyMat, enemyGeo }, ENEMY_CAP);
const beatDirector = new BeatDirector(rng);
const scoreSystem = new ScoreSystem();

const state = {
  phase: "title",
  health: 100,
  maxHealth: 100,
  kills: 0,
  t: 0,
  fire: 0,
  spawn: 1,
  flash: 0,
  orbit: 0,
  yaw: 0,
  pos: new THREE.Vector3(),
  enemies: [],
  rng,
  seed: initialSeed,
  weaponManager,
  cardSystem,
  beatDirector,
  scoreSystem,
  resultsScreen: null,
  aimMode: false,
  aimModeWindup: 0,
  isSwapping: false,
  swapProgress: 0,
  showCards: false,
  currentCardOptions: null,
  cardPickWindow: false,
  blackoutActive: false,
  blackoutTimer: 0,
  airdropState: null,
  showResults: false,
};

if (testMode) {
  window.__forgeSmokeTest = {
    getState: () => state,
    setBeat(index) {
      const beats = beatDirector.beats;
      const i = Math.max(0, Math.min(beats.length - 1, Math.floor(index)));
      beatDirector.currentBeatIndex = i;
      beatDirector.beatTimer = 0;
      beatDirector.runTime = beats[i].start;
      beatDirector.blackoutActive = false;
      beatDirector.blackoutTimer = 0;
      state.blackoutActive = false;
      state.blackoutTimer = 0;
      setBlackout(false);
      applyArenaLighting(ARENA_BY_BEAT[i] || "gunship");
      syncHud();
    },
    getLighting: () => ({
      arena: arenaKey,
      arenaName: ARENA_LIGHTING[arenaKey].name,
      blackout: state.blackoutActive,
      exposure: renderer.toneMappingExposure,
      fogDensity: scene.fog ? scene.fog.density : null,
      background: `#${scene.background.getHexString()}`,
      sun: sun.visible ? sun.intensity : 0,
      hemisphere: hemi.visible ? hemi.intensity : 0,
      floodlights: floodlights
        .filter((fixture) => fixture.light.visible)
        .map((fixture) => Number(fixture.light.intensity.toFixed(1))),
      hostileEmissive: Number(enemyMat.emissiveIntensity.toFixed(2)),
      shotLight: shotLight.visible ? Number(shotLight.intensity.toFixed(1)) : 0,
    }),
  };
}

const vMuzzle = new THREE.Vector3(), vTarget = new THREE.Vector3(), vDesired = new THREE.Vector3();
let hudPhase = null, hudHealth = null, hudKills = null, hudAmmo = null, hudBeat = null, hudScore = null, hudAirdrop = null;

function syncHud() {
  const h = globalThis.__studio?.hud;
  if (!h) return;
  const T = (id, text, o) => h.text(id, text, o), P = (id, o) => h.panel(id, o), B = (id, f, o) => h.bar(id, f, o);
  const changed = hudPhase !== state.phase;
  if (changed) {
    h.clear();
    hudPhase = state.phase;
    hudHealth = null;
    hudKills = null;
    hudAmmo = null;
    hudBeat = null;
    hudScore = null;
    hudAirdrop = null;
  }

  if (state.phase === "playing") {
    const color = state.health > 60 ? PALETTE.healthOk : state.health > 30 ? PALETTE.healthWarn : PALETTE.healthCrit;
    if (hudHealth !== state.health) {
      hudHealth = state.health;
      P("vitals", { x: 0.022, y: 0.03, w: 0.55, h: 0.155, radius: 0.014, fill: PALETTE.panels.status, stroke: PALETTE.strokes.status, width: 0.002 });
      T("vitals-title", "FORGE SMOKE // ARMORY", { x: 0.032, y: 0.042, size: TYPE_SCALE.label, color: PALETTE.hudLabel, weight: 700 });
      B("health", state.health / state.maxHealth, { x: 0.032, y: 0.069, w: 0.18, h: 0.023, color, back: PALETTE.strokes.barBack });
      T("health-num", String(state.health), { x: 0.218, y: 0.064, size: TYPE_SCALE.numeral, color, weight: 800 });
    }
    if (hudKills !== state.kills) {
      hudKills = state.kills;
      T("kills", `THREATS DOWN  ${state.kills}`, { x: 0.032, y: 0.125, size: TYPE_SCALE.small, color: PALETTE.hudSecondary });
    }

    const activeConfig = weaponManager.getActiveConfig();
    const inactiveConfig = weaponManager.getInactiveConfig();
    const activeWeapon = weaponManager.active;
    const inactiveWeapon = weaponManager.inactive;

    let ammoText = activeWeapon.isReloading ? "RELOADING..." : `MAG  ${activeWeapon.magazine} / ${activeWeapon.maxMagazine}`;
    if (activeWeapon.isHeatWeapon) {
      ammoText = activeWeapon.isReloading ? "VENTING..." : `HEAT  ${Math.round(activeWeapon.heat)} / ${activeWeapon.maxHeat}`;
    }
    if (hudAmmo !== ammoText) {
      hudAmmo = ammoText;
      T("ammo", ammoText, { x: 0.032, y: 0.151, size: TYPE_SCALE.label, color: PALETTE.ui, weight: 700 });
    }

    // Weapon plates (ART-01 iconography): name + 48 px silhouette, one per style.
    const activeName = activeConfig.style.toUpperCase();
    const inactiveName = inactiveConfig.style.toUpperCase();
    T("weapon-active", `${activeName}`, { x: 0.325, y: 0.045, size: TYPE_SCALE.micro, color: PALETTE.ui, weight: 700 });
    T("weapon-inactive", `${inactiveName}`, { x: 0.325, y: 0.088, size: TYPE_SCALE.micro, color: PALETTE.hudLabel, weight: 500 });

    // Weapon icons, drawn at 28 px from the 48 px sheet cells.
    const activeIconSrc = weaponIconDataUrls[activeConfig.style];
    const inactiveIconSrc = weaponIconDataUrls[inactiveConfig.style];
    if (activeIconSrc && h.get("weapon-icon-active")?.src !== activeIconSrc) {
      h.image("weapon-icon-active", activeIconSrc, { x: 0.278, y: 0.038, h: 0.039 });
    }
    if (inactiveIconSrc && h.get("weapon-icon-inactive")?.src !== inactiveIconSrc) {
      h.image("weapon-icon-inactive", inactiveIconSrc, { x: 0.278, y: 0.082, h: 0.033 });
    }

    // Beat name + timer
    const beat = beatDirector.getCurrentBeat();
    const beatText = `${beat.name}  ${beatDirector.getBeatTimeRemaining().toFixed(1)}s`;
    if (hudBeat !== beatText) {
      hudBeat = beatText;
      T("beat", beatText, { x: 0.5, y: 0.03, size: TYPE_SCALE.subhead, color: PALETTE.ui, weight: 700, align: "center" });
    }

    // Score
    const currentScore = scoreSystem.getCurrentScore(beatDirector.runTime);
    if (hudScore !== currentScore) {
      hudScore = currentScore;
      T("score", `SCORE  ${currentScore}`, { x: 0.5, y: 0.055, size: TYPE_SCALE.small, color: PALETTE.hudSecondary, align: "center" });
    }

    // Airdrop countdown
    const airdropState = beatDirector.getAirdropState();
    if (airdropState.pending && !airdropState.picked) {
      const nextAirdrop = beatDirector.getCurrentBeat().airdropAt;
      if (nextAirdrop) {
        const timeLeft = Math.max(0, nextAirdrop - beatDirector.runTime);
        const airdropText = `AIRDROP  ${timeLeft.toFixed(1)}s`;
        if (hudAirdrop !== airdropText) {
          hudAirdrop = airdropText;
          T("airdrop", airdropText, { x: 0.5, y: 0.08, size: TYPE_SCALE.small, color: PALETTE.healthOk, weight: 700, align: "center" });
        }
      }
    } else if (hudAirdrop !== null) {
      hudAirdrop = null;
      h.remove("airdrop");
    }

    if (!changed) return;
  }

  if (changed) {
    const hint = state.phase === "dead" ? "R / SPACE / ENTER  ·  REDEPLOY" : state.phase === "results" ? "R / SPACE / ENTER  ·  REDEPLOY" : "WASD MOVE  ·  AUTO-FIRE  ·  R RELOAD  ·  Q SWAP  ·  M2 AIM  ·  1/2/3 CARDS";
    P("hint-panel", { x: 0.012, y: 0.902, w: 0.40, h: 0.045, radius: 0.008, fill: PALETTE.panels.hint, stroke: PALETTE.strokes.hint, width: 0.0015 });
    T("hint", hint, { x: 0.022, y: 0.928, size: TYPE_SCALE.small, color: PALETTE.hudSecondary, weight: 600 });
  }

  if (state.phase === "title") {
    P("title-panel", { anchor: "center", x: 0, y: 0, w: 0.72, h: 0.3, radius: 0.02, fill: PALETTE.panels.title, stroke: PALETTE.strokes.title, width: 0.002 });
    T("title", "FORGE SMOKE", { anchor: "center", x: 0, y: -0.075, size: TYPE_SCALE.display, color: PALETTE.titleText, weight: 800 });
    T("title-sub", "Hold the perimeter. The armory is winning.", { anchor: "center", x: 0, y: 0.002, size: TYPE_SCALE.subhead, color: PALETTE.hudSubtitle });
    T("title-prompt", "PRESS  W  OR  SPACE  TO DEPLOY", { anchor: "center", x: 0, y: 0.075, size: TYPE_SCALE.prompt, color: PALETTE.healthOk, weight: 700 });
    if (saved.bestScore > 0) {
      T("best-score", `BEST  ${saved.bestScore}`, { anchor: "center", x: 0, y: 0.12, size: TYPE_SCALE.label, color: PALETTE.hudSecondary });
    }
  } else if (state.phase === "dead") {
    P("dead-panel", { anchor: "center", x: 0, y: 0, w: 0.62, h: 0.27, radius: 0.02, fill: PALETTE.panels.dead, stroke: PALETTE.strokes.dead, width: 0.002 });
    T("dead-title", "PERIMETER LOST", { anchor: "center", x: 0, y: -0.065, size: TYPE_SCALE.deathTitle, color: PALETTE.deadTitle, weight: 800 });
    T("dead-sub", `THREATS DOWN  ${state.kills}`, { anchor: "center", x: 0, y: 0.005, size: TYPE_SCALE.subhead, color: PALETTE.deadSub });
    T("dead-prompt", "PRESS  R  TO REDEPLOY", { anchor: "center", x: 0, y: 0.072, size: TYPE_SCALE.prompt, color: PALETTE.deadPrompt, weight: 700 });
  } else if (state.phase === "results" && state.resultsScreen) {
    const r = state.resultsScreen.getFormatted();
    P("results-panel", { anchor: "center", x: 0, y: 0, w: 0.8, h: 0.85, radius: 0.02, fill: PALETTE.panels.results, stroke: PALETTE.strokes.results, width: 0.002 });
    T("results-title", r.title, { anchor: "center", x: 0, y: -0.35, size: TYPE_SCALE.h2, color: PALETTE.deadTitle, weight: 800 });
    T("results-time", `TIME  ${r.timeSurvived}`, { anchor: "center", x: 0, y: -0.28, size: TYPE_SCALE.body, color: PALETTE.hudSecondary });
    T("results-threats", `THREATS DOWN  ${r.threatsDown}`, { anchor: "center", x: 0, y: -0.22, size: TYPE_SCALE.subhead, color: PALETTE.deadSub });

    let y = -0.12;
    T("results-kills", r.scoreBreakdown.kills, { anchor: "center", x: 0, y, size: TYPE_SCALE.label, color: PALETTE.hudSecondary }); y += 0.04;
    T("results-damage", r.scoreBreakdown.damage, { anchor: "center", x: 0, y, size: TYPE_SCALE.label, color: PALETTE.hudSecondary }); y += 0.04;
    T("results-time-score", r.scoreBreakdown.time, { anchor: "center", x: 0, y, size: TYPE_SCALE.label, color: PALETTE.hudSecondary }); y += 0.04;
    T("results-base", `BASE  ${r.scoreBreakdown.base}`, { anchor: "center", x: 0, y, size: TYPE_SCALE.label, color: PALETTE.ui, weight: 700 }); y += 0.05;
    T("results-mult", `${r.scoreBreakdown.multiplier}  =  ${r.scoreBreakdown.final}`, { anchor: "center", x: 0, y, size: TYPE_SCALE.title, color: PALETTE.titleText, weight: 800 }); y += 0.07;
    T("results-unlocks", `UNLOCK TOKENS  +${r.unlockTokens}`, { anchor: "center", x: 0, y, size: TYPE_SCALE.subhead, color: PALETTE.healthOk, weight: 700 }); y += 0.05;
    T("results-prompt", "PRESS  R  TO REDEPLOY", { anchor: "center", x: 0, y: 0.32, size: TYPE_SCALE.prompt, color: PALETTE.deadPrompt, weight: 700 });
  }
}

function clearEnemies() {
  enemyManager.clear();
  if (state.airdropState) {
    state.airdropState = null;
  }
}

function clearEffects() {
  for (const tracer of tracers) {
    tracer.life = 0;
    tracer.mesh.visible = false;
  }
  state.flash = 0;
  flash.visible = false;
}

function placeCamera() {
  camera.position.set(state.pos.x, 6.4, state.pos.z + 9);
  camera.lookAt(state.pos.x, 1.25, state.pos.z);
}

function startRun() {
  clearEnemies();
  clearEffects();
  const seed = state.seed;
  state.rng = makeRng(seed);
  Object.assign(state, {
    phase: "playing",
    health: 100,
    maxHealth: 100,
    kills: 0,
    t: 0,
    fire: 0,
    spawn: 1,
    yaw: 0,
    orbit: 0,
    aimMode: false,
    aimModeWindup: 0,
    isSwapping: false,
    swapProgress: 0,
    showCards: false,
    currentCardOptions: null,
    cardPickWindow: false,
    blackoutActive: false,
    blackoutTimer: 0,
    airdropState: null,
    showResults: false,
    resultsScreen: null,
  });
  state.pos.set(0, 0, 0);
  soldier.position.set(0, 0, 0);
  soldier.rotation.y = 0;
  gunPivot.rotation.y = 0;
  weaponManager.primary = new (weaponManager.primary.constructor)("spray");
  weaponManager.secondary = new (weaponManager.secondary.constructor)("pierce");
  weaponManager.activeSlot = "primary";
  weaponManager.isSwapping = false;
  weaponManager.swapTimer = 0;
  cardSystem.xp = 0;
  cardSystem.level = 1;
  cardSystem.nextLevelXp = TUNING.progression.levelBaseXp;
  cardSystem.queuedCards = [];
  enemyManager.clear();
  enemyManager.timeMinutes = 0;
  enemyManager.spawnTimer = 0;
  beatDirector.currentBeatIndex = 0;
  beatDirector.beatTimer = 0;
  beatDirector.runTime = 0;
  beatDirector.blackoutActive = false;
  beatDirector.blackoutTimer = 0;
  beatDirector.airdropTimer = 0;
  beatDirector.airdropWarningGiven = false;
  beatDirector.airdropPending = false;
  beatDirector.airdropPicked = false;
  beatDirector.airdropOptions = null;
  beatDirector.killsThisBeat = 0;
  beatDirector.damageThisBeat = 0;
  scoreSystem.kills = 0;
  scoreSystem.damageDealt = 0;
  scoreSystem.blackoutsSurvived = 0;
  scoreSystem.evolutions = 0;
  scoreSystem.airdropsTaken = 0;
  scoreSystem.runStartTime = Date.now();
  placeCamera();
  syncHud();
  weaponManager.rng = state.rng;
  weaponManager.primary = new Weapon("spray");
  weaponManager.secondary = new Weapon("pierce");
  weaponManager.activeSlot = "primary";
  weaponManager.isSwapping = false;
  weaponManager.swapTimer = 0;
  cardSystem.rng = state.rng;
  cardSystem.xp = 0;
  cardSystem.level = 1;
  cardSystem.nextLevelXp = TUNING.progression.levelBaseXp;
  cardSystem.queuedCards = [];
}

function reset(seed) {
  state.seed = seed || 1;
  state.rng = makeRng(state.seed);
  clearEnemies();
  clearEffects();
  Object.assign(state, {
    phase: "title",
    health: 100,
    maxHealth: 100,
    kills: 0,
    t: 0,
    fire: 0,
    spawn: 1,
    yaw: 0,
    orbit: 0,
    aimMode: false,
    aimModeWindup: 0,
    isSwapping: false,
    swapProgress: 0,
    showCards: false,
    currentCardOptions: null,
    cardPickWindow: false,
    blackoutActive: false,
    blackoutTimer: 0,
    airdropState: null,
    showResults: false,
    resultsScreen: null,
  });
  state.pos.set(0, 0, 0);
  soldier.position.set(0, 0, 0);
  soldier.rotation.y = 0;
  gunPivot.rotation.y = 0;
  weaponManager.rng = state.rng;
  weaponManager.primary = new Weapon("spray");
  weaponManager.secondary = new Weapon("pierce");
  weaponManager.activeSlot = "primary";
  weaponManager.isSwapping = false;
  weaponManager.swapTimer = 0;
  cardSystem.rng = state.rng;
  cardSystem.xp = 0;
  cardSystem.level = 1;
  cardSystem.nextLevelXp = TUNING.progression.levelBaseXp;
  cardSystem.queuedCards = [];
  weaponManager.swapTimer = 0;
  cardSystem.xp = 0;
  cardSystem.level = 1;
  cardSystem.nextLevelXp = TUNING.progression.levelBaseXp;
  cardSystem.queuedCards = [];
  enemyManager.clear();
  enemyManager.timeMinutes = 0;
  enemyManager.spawnTimer = 0;
  beatDirector.currentBeatIndex = 0;
  beatDirector.beatTimer = 0;
  beatDirector.runTime = 0;
  beatDirector.blackoutActive = false;
  beatDirector.blackoutTimer = 0;
  beatDirector.airdropTimer = 0;
  beatDirector.airdropWarningGiven = false;
  beatDirector.airdropPending = false;
  beatDirector.airdropPicked = false;
  beatDirector.airdropOptions = null;
  beatDirector.killsThisBeat = 0;
  beatDirector.damageThisBeat = 0;
  scoreSystem.kills = 0;
  scoreSystem.damageDealt = 0;
  scoreSystem.blackoutsSurvived = 0;
  scoreSystem.evolutions = 0;
  scoreSystem.airdropsTaken = 0;
  placeCamera();
  syncHud();
}

function spawnEnemy() {
  const beat = beatDirector.getCurrentBeat();
  const types = beat.enemyTypes || ["rifleman"];
  const type = types[Math.floor(state.rng() * types.length)];
  const angle = state.rng() * TAU;
  const radius = 18 + state.rng() * 10;
  const position = new THREE.Vector3(state.pos.x + Math.cos(angle) * radius, 0.72, state.pos.z + Math.sin(angle) * radius);
  const enemy = enemyManager.spawn(type, state.pos, beatDirector.runTime / 60);
  if (enemy) {
    enemy.position.copy(position);
    // Create mesh
    const mesh = new THREE.Mesh(enemyGeo, enemyMat);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.userData.tag = "enemy";
    scene.add(mesh);
    enemy.mesh = mesh;
    enemyManager.enemyMeshes.set(enemy, mesh);
  }
}

function shoot(target) {
  soldier.updateMatrixWorld(true);
  vMuzzle.set(0, 0, 0.52);
  rifle.localToWorld(vMuzzle);
  vTarget.set(target.mesh.position.x, target.mesh.position.y + 0.15, target.mesh.position.z);

  const fireData = weaponManager.fire(state.aimMode);
  if (!fireData) return;

  // Spawn tracers
  const pelletCount = fireData.pellets || 1;
  for (let p = 0; p < pelletCount; p++) {
    const tracer = tracers.find((t) => t.life <= 0);
    if (tracer) {
      const spreadAngle = (state.rng() - 0.5) * fireData.spread * (Math.PI / 180);
      const dir = new THREE.Vector3().subVectors(vTarget, vMuzzle).normalize();
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
      const endPos = vMuzzle.clone().add(dir.clone().multiplyScalar(fireData.range * 30)); // Convert to px
      tracer.mesh.position.copy(vMuzzle).add(endPos).multiplyScalar(0.5);
      tracer.mesh.lookAt(endPos);
      tracer.mesh.scale.set(1, 1, Math.max(0.4, vMuzzle.distanceTo(endPos)));
      tracer.mesh.material.color.setHex(fireData.tracerColor);
      tracer.mesh.visible = true;
      tracer.life = fireData.tracerLife;
    }
  }

  flash.position.copy(vMuzzle);
  flash.scale.setScalar(fireData.muzzleFlashSize / 0.24);
  flash.visible = true;
  state.flash = fireData.muzzleFlashLife;

  if (state.blackoutActive) {
    const blackout = ARENA_LIGHTING[arenaKey].blackout;
    shotLight.color.set(hexInt(blackout.shotLight.color));
    shotLight.position.copy(vMuzzle);
    shotLight.distance = blackout.shotLight.distance;
    shotLight.intensity = blackout.shotLight.power;
    shotLight.visible = true;
    shotLightTimer = blackout.shotLight.seconds;
  }

  // Apply recoil
  gunPivot.rotation.y += (state.rng() - 0.5) * fireData.recoilYaw * 2;
  gunPivot.rotation.x -= Math.abs(fireData.recoilPitch);

  // Deal damage
  let damageDealt = 0;
  if (fireData.pierceCount > 0) {
    // Pierce: hit target and up to pierceCount enemies behind
    const dir = new THREE.Vector3().subVectors(target.mesh.position, vMuzzle).normalize();
    const enemiesInLine = enemyManager.getEnemies().filter(e => {
      const toEnemy = new THREE.Vector3().subVectors(e.mesh.position, target.mesh.position);
      const proj = toEnemy.dot(dir);
      const perp = toEnemy.clone().sub(dir.clone().multiplyScalar(proj)).length();
      return proj > 0 && perp < 1.0;
    }).slice(0, fireData.pierceCount);

    for (const enemy of enemiesInLine) {
      const result = enemyManager.damageEnemy(enemy, fireData.damage, false, 0);
      damageDealt += fireData.damage;
      if (result.killed) {
        state.kills++;
        scoreSystem.recordKill(enemy.getScoreValue());
        cardSystem.addXp(enemy.getXpValue());
      }
    }
  } else if (pelletCount > 1) {
    // Cone: spread pellets
    for (let p = 0; p < pelletCount; p++) {
      const spreadAngle = (state.rng() - 0.5) * fireData.spread * (Math.PI / 180);
      const dir = new THREE.Vector3().subVectors(vTarget, vMuzzle).normalize();
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
      // Find closest enemy in this direction
      let best = null, bestDist = Infinity;
      for (const enemy of enemyManager.getEnemies()) {
        const toEnemy = new THREE.Vector3().subVectors(enemy.mesh.position, vMuzzle);
        const proj = toEnemy.dot(dir);
        const perp = toEnemy.clone().sub(dir.clone().multiplyScalar(proj)).length();
        if (proj > 0 && perp < 1.5 && proj < bestDist) {
          bestDist = proj;
          best = enemy;
        }
      }
      if (best) {
        const falloff = Math.max(0, Math.min(1, 1 - (bestDist - fireData.falloffStart * 30) / ((fireData.falloffEnd - fireData.falloffStart) * 30)));
        const dmg = Math.round(fireData.damage * falloff);
        const result = enemyManager.damageEnemy(best, dmg, false, 0);
        damageDealt += dmg;
        if (result.killed) {
          state.kills++;
          scoreSystem.recordKill(best.getScoreValue());
          cardSystem.addXp(best.getXpValue());
        }
      }
    }
  } else {
    // Single shot
    const result = enemyManager.damageEnemy(target, fireData.damage, false, 0);
    damageDealt = fireData.damage;
    if (result.killed) {
      state.kills++;
      scoreSystem.recordKill(target.getScoreValue());
      cardSystem.addXp(target.getXpValue());
    }
  }

  scoreSystem.recordDamage(damageDealt);
}

function nearest(maxDistance = 19) {
  return enemyManager.findNearest(state.pos, state.yaw, maxDistance, TAU / 3); // 120° arc
}

function hurt(amount) {
  if (state.phase !== "playing") return;
  state.health = Math.max(0, state.health - amount);
  globalThis.__studio?.hud?.flash("#e5313b", 0.22);
  if (state.health <= 0) {
    state.phase = "dead";
    globalThis.__studio?.hud?.flash("#e5313b", 0.55);
    syncHud();
  }
}

const held = (ctx, names) => names.some((name) => ctx.keys.has(name));

function update(dt, ctx) {
  if (state.phase === "title") {
    if (held(ctx, ["KeyW", "w", "W", "KeyA", "a", "A", "KeyS", "s", "S", "KeyD", "d", "D", "Space", "Enter"])) startRun();
  } else if (state.phase === "dead" || state.phase === "results") {
    if (held(ctx, ["KeyR", "r", "R", "Space", "Enter", "Mouse1"])) {
      if (state.phase === "results") {
        updateBestScore(scoreSystem.getCurrentScore(beatDirector.runTime));
        updateBestTime(beatDirector.runTime);
      }
      startRun();
    }
  }

  if (state.phase === "playing") {
    state.t += dt;
    beatDirector.runTime += dt;

    // Orbit
    state.orbit -= ctx.look.x * 0.0042;

    // Movement
    let mx = 0, mz = 0;
    if (held(ctx, ["KeyW", "w", "W", "ArrowUp"])) { mx -= Math.sin(state.orbit); mz -= Math.cos(state.orbit); }
    if (held(ctx, ["KeyS", "s", "S", "ArrowDown"])) { mx += Math.sin(state.orbit); mz += Math.cos(state.orbit); }
    if (held(ctx, ["KeyA", "a", "A", "ArrowLeft"])) { mx -= Math.cos(state.orbit); mz += Math.sin(state.orbit); }
    if (held(ctx, ["KeyD", "d", "D", "ArrowRight"])) { mx += Math.cos(state.orbit); mz -= Math.sin(state.orbit); }
    if (mx !== 0 || mz !== 0) {
      const length = Math.hypot(mx, mz);
      mx /= length; mz /= length;
      const speed = weaponManager.active.styleKey === "spinup" && weaponManager.active.spinupProgress > 0
        ? TUNING.player.baseSpeed * TUNING.player.aimModeSpeedMult * TUNING.player.spinupSpeedMult
        : state.aimMode
          ? TUNING.player.baseSpeed * TUNING.player.aimModeSpeedMult
          : TUNING.player.baseSpeed;
      state.pos.x += mx * speed * dt;
      state.pos.z += mz * speed * dt;
      const radius = Math.hypot(state.pos.x, state.pos.z);
      if (radius > TUNING.player.arenaRadius) {
        state.pos.x *= TUNING.player.arenaRadius / radius;
        state.pos.z *= TUNING.player.arenaRadius / radius;
      }
      let turn = Math.atan2(mx, mz) - state.yaw;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      state.yaw += turn * Math.min(1, dt * TUNING.player.bodyYawSmoothing);
    }
    soldier.position.copy(state.pos);
    soldier.rotation.y = state.yaw;

    // Aim mode
    if (held(ctx, ["Mouse2"])) {
      if (!state.aimMode) {
        state.aimMode = true;
        state.aimModeWindup = 0;
      }
      state.aimModeWindup = Math.min(TUNING.aimMode.windUp, state.aimModeWindup + dt);
    } else {
      if (state.aimMode) {
        state.aimModeWindup = Math.max(0, state.aimModeWindup - dt / TUNING.aimMode.windDown * TUNING.aimMode.windUp);
        if (state.aimModeWindup <= 0) state.aimMode = false;
      }
    }

    // Swap
    if (held(ctx, ["KeyQ", "q", "Q"]) && !weaponManager.isSwapping) {
      weaponManager.trySwap();
    }
    weaponManager.updateSwap(dt);
    state.isSwapping = weaponManager.isSwapping;
    state.swapProgress = weaponManager.getSwapProgress();

    // Reload
    if (held(ctx, ["KeyR", "r", "R"])) {
      weaponManager.tryReload();
    }
    weaponManager.updateReload(dt);

    // Card pick
    if (state.cardPickWindow && state.currentCardOptions) {
      if (held(ctx, ["Digit1", "Key1"])) { pickCard(0); }
      else if (held(ctx, ["Digit2", "Key2"])) { pickCard(1); }
      else if (held(ctx, ["Digit3", "Key3"])) { pickCard(2); }
    }

    // Update beat director
    const events = beatDirector.update(dt, state.pos, enemyManager, weaponManager);
    for (const event of events) {
      if (event.type === "beatChange") {
        showBeatTransition(event.beat.name);
        applyArenaLighting(ARENA_BY_BEAT[beatDirector.currentBeatIndex] || "gunship");
      } else if (event.type === "blackoutStart") {
        state.blackoutActive = true;
        state.blackoutTimer = event.duration;
        scoreSystem.recordBlackout();
        setBlackout(true);
      } else if (event.type === "blackoutEnd") {
        state.blackoutActive = false;
        state.blackoutTimer = 0;
        setBlackout(false);
      } else if (event.type === "airdropWarning") {
        // B03 bark would play here
      } else if (event.type === "airdropSpawn") {
        state.airdropState = beatDirector.getAirdropState();
        state.currentCardOptions = event.options;
        state.cardPickWindow = true;
        // Spawn crate visual
        const crate = scene.getObjectByProperty("userData.tag", "airdrop-crate");
        if (crate) {
          const a = state.rng() * TAU, r = 12 + state.rng() * 18;
          crate.position.set(state.pos.x + Math.cos(a) * r, 20, state.pos.z + Math.sin(a) * r);
          crate.visible = true;
          crate.children.find(c => c.userData.tag === "crate-parachute").visible = true;
        }
      } else if (event.type === "airdropLanded") {
        const crate = scene.getObjectByProperty("userData.tag", "airdrop-crate");
        if (crate) {
          crate.position.y = 0.55;
          crate.children.find(c => c.userData.tag === "crate-parachute").visible = false;
          const lid = crate.children.find(c => c.userData.tag === "crate-lid");
          lid.position.y = 1.075;
        }
      }
    }

    // Update enemies
    const enemyActions = enemyManager.update(dt, state.pos, beatDirector.runTime / 60);
    for (const { enemy, action } of enemyActions) {
      if (action.type === "melee") {
        hurt(action.damage);
      } else if (action.type === "charge") {
        // Create charge visual
      } else if (action.type === "paint") {
        // Mark player as painted
      } else if (action.type === "dive") {
        // Dive attack
      } else if (action.type === "shell") {
        // Mortar shell
      } else if (action.type === "stomp") {
        // Mech stomp
      } else if (action.type === "minigun") {
        // Mech minigun
      }
    }

    // Handle spawning
    const beat = beatDirector.getCurrentBeat();
    enemyManager.updateSpawning(dt, state.pos, beat);

    // Targeting
    const target = state.phase === "playing" ? nearest() : null;
    if (target) {
      let turn = Math.atan2(target.mesh.position.x - state.pos.x, target.mesh.position.z - state.pos.z) - state.yaw;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      const smoothing = state.aimMode ? TUNING.player.gunPivotYawSmoothing * 1.5 : TUNING.player.gunPivotYawSmoothing;
      gunPivot.rotation.y += (turn - gunPivot.rotation.y) * Math.min(1, dt * smoothing);
    }

    // Fire
    state.fire -= dt;
    if (state.fire <= 0 && target && weaponManager.active.canFire) {
      shoot(target);
      state.fire = weaponManager.active.currentCycle;
    }

    // Check for card queue
    if (cardSystem.queuedCards.length > 0 && !state.cardPickWindow) {
      state.currentCardOptions = cardSystem.queuedCards[0];
      state.cardPickWindow = true;
      state.showCards = true;
    }

    // Camera
    vDesired.set(state.pos.x + Math.sin(state.orbit) * 9, 6.4, state.pos.z + Math.cos(state.orbit) * 9);
    const lerpFactor = 1 - Math.exp(-dt * 5.5);
    camera.position.lerp(vDesired, lerpFactor);
    camera.lookAt(state.pos.x, 1.25, state.pos.z);

    // Check death
    if (state.health <= 0) {
      state.phase = "results";
      state.showResults = true;
      state.resultsScreen = new ResultsScreen(scoreSystem, beatDirector.runTime, state.health, beatDirector.currentBeatIndex);
      state.cardPickWindow = false;
      state.showCards = false;
      syncHud();
    }
  }

  // Blackout timer
  if (state.blackoutActive) {
    state.blackoutTimer -= dt;
    if (state.blackoutTimer <= 0) {
      state.blackoutActive = false;
    }
  }

  // Animate crate
  const crate = scene.getObjectByProperty("userData.tag", "airdrop-crate");
  if (crate && crate.visible) {
    const airdropState = beatDirector.getAirdropState();
    if (airdropState.pending && !airdropState.picked) {
      if (crate.position.y > 0.55) {
        crate.position.y = Math.max(0.55, crate.position.y - 2.5 * dt);
      } else {
        crate.position.y = 0.55;
        const lid = crate.children.find(c => c.userData.tag === "crate-lid");
        if (lid.position.y < 1.5) {
          lid.position.y += dt * 3;
        }
      }
    } else if (airdropState.picked) {
      // Fold crate
      crate.visible = false;
    }
  }

  // Tracers
  for (const tracer of tracers) {
    if (tracer.life <= 0) continue;
    tracer.life -= dt;
    if (tracer.life <= 0) tracer.mesh.visible = false;
  }
  if (state.flash > 0) {
    state.flash -= dt;
    if (state.flash <= 0) flash.visible = false;
  }

  // Rain
  for (let i = 0; i < RAIN; i++) {
    rainPos[i * 6 + 1] -= 17 * dt;
    rainPos[i * 6 + 4] -= 17 * dt;
    if (rainPos[i * 6 + 1] < 0) seedDrop(i, state.pos.x, state.pos.z);
  }
  rainGeo.attributes.position.needsUpdate = true;

  // Tree sway
  for (const tree of trees) swayTree(tree, state.t, { dir: [0.8, 0.35], strength: 0.55 });

  syncHud();
}

function pickCard(index) {
  if (!state.currentCardOptions) return;
  const option = cardSystem.pickCard(index);
  if (!option) return;

  state.cardPickWindow = false;
  state.showCards = false;
  state.currentCardOptions = null;

  if (option.type === "weapon") {
    const inactiveSlot = weaponManager.activeSlot === "primary" ? "secondary" : "primary";
    weaponManager.replaceWeapon(inactiveSlot, option.style);
  } else if (option.type === "part") {
    weaponManager.applyPart(weaponManager.activeSlot, option.part);
  }

  // Check for evolution
  const activeWeapon = weaponManager.active;
  const evoId = activeWeapon.parts.length >= 2 ? checkEvolution(activeWeapon.styleKey, activeWeapon.parts.map(p => p.id)) : null;
  if (evoId) {
    scoreSystem.recordEvolution();
    // Apply evolution effect
  }

  // Remove from queue
  cardSystem.queuedCards.shift();
}

function checkEvolution(styleKey, partIds) {
  const evos = TUNING.progression.evolutions;
  for (const [id, evo] of Object.entries(evos)) {
    if (evo.requires.style === styleKey) {
      const hasParts = evo.requires.parts.every(p => partIds.includes(p));
      if (hasParts) return id;
    }
  }
  return null;
}

function showBeatTransition(beatName) {
  // Visual beat transition would go here
  console.log(`BEAT: ${beatName}`);
}

installStudio({
  canvas: renderer.domElement,
  scene,
  renderer,
  camera,
  reset,
  update,
  begin: startRun,
  flow: () => (state.phase === "playing" ? FlowPhase.Playing : state.phase === "dead" || state.phase === "results" ? FlowPhase.Results : FlowPhase.Menu),
  player: () => ({ x: state.pos.x, y: 0, z: state.pos.z, yaw: state.yaw }),
  probes: () => ({ health: state.health, kills: state.kills, enemies: enemyManager.getCount(), phase: state.phase, score: scoreSystem.getCurrentScore(beatDirector.runTime), multiplier: scoreSystem.getMultiplier() }),
  cameras: { default: placeCamera },
  render() {
    renderer.render(scene, camera);
  },
});