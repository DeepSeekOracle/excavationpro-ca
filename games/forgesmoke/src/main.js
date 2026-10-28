import * as THREE from "three";
import { FlowPhase, installStudio, makeRng } from "./studio.js?v=20261030j";
import { standardMaterial } from "./materials.js?v=20261030j";
import { makeBush, makeLog, makeTree, swayTree } from "./foliage.js?v=20261030j";
import { generateWeaponIconAtlas, getWeaponIconUV, createWeaponIconMesh, STYLE_ICON_INDEX, generateWeaponIconDataUrls, loadWeaponIconSheetDataUrls } from "./icons.js?v=20261030j";
import {
  PALETTE,
  TYPE_SCALE,
  HUD_ICONOGRAPHY,
  MATERIAL_RECIPES,
  ARENA_BY_BEAT,
  ARENA_LIGHTING,
  POINT_LIGHT_SCALE,
  hexInt,
} from "./theme.js?v=20261030j";
import { TUNING } from "./tuning.js?v=20261030j";
import { WeaponManager, CardSystem, Weapon, STYLE_VFX, GRENADE_STYLES } from "./weapons.js?v=20261030j";
import { createCardTray } from "./cardsui.js?v=20261030j";
import { createSummary } from "./summaryui.js?v=20261030j";
import { createBarks } from "./barks.js?v=20261030j";
import { EnemyManager, ENEMY_TYPES } from "./enemies.js?v=20261030j";
import { BeatDirector, ScoreSystem, ResultsScreen } from "./director.js?v=20261030j";
import { loadSave, saveSave, updateBestScore, updateBestTime, getSettings, DEFAULT_SAVE, addProfileXp, grantLegacy, saveProfile } from "./save.js?v=20261030j";
import { pilot } from "./autopilot.js?v=20261030j";
import { createManager, statsForLevel, applyStatsToRun, LIGHT_MODS, PERKS } from "./manager.js?v=20261030j";
import { createStartMenu } from "./startmenu.js?v=20261030j";
import { createGamepad } from "./gamepad.js?v=20261030j";
import { createTalentWindow } from "./talentui.js?v=20261030j";
import { aggregate, toRunMods } from "./talents.js?v=20261030j";
import { bakeProceduralArtSprites, PROCEDURAL_ART_MODULES } from "./art/index.js?v=20261030j";
import {
  PLAYER_SKINS,
  STARTER_LOADOUTS,
  isLightGunStyle,
  buildOperatorRig,
  updateOperatorAnimation,
  rebuildWeaponMesh,
  createEnemyMaterialBank,
  populateArenaProps,
  arenaColliders,
  resolveObstacleCollision,
  steerAroundObstacles,
  buildBossMesh,
  segmentHitsCollider,
  warmGlbAssets,
} from "./models.js?v=20261030j";
import * as levelModule from "./level.js?v=20261030j";
import * as menuModule from "./menu.js?v=20261030j";
import * as audioModule from "./audio.js?v=20261030j";
import * as fxModule from "./fx.js?v=20261030j";

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
  audioModule.initAudio().then((ctrl) => {
  audioController = ctrl;
  window.__fsSfx = (key, opts) => { try { return ctrl.playSfx(key, opts); } catch (e) { return false; } };
  window.__fsPad = () => gamepad.status();
  ctrl.preload().then((n) => { window.__fsSfxLoaded = n; }).catch(() => {});
  // the browser will not start audio before a gesture: arm it on the first click/key
  const arm = () => { try { ctrl.playSfx("click", { volume: 0.0001 }); } catch (e) {} window.removeEventListener("pointerdown", arm); window.removeEventListener("keydown", arm); };
  window.addEventListener("pointerdown", arm, { once: true });
  window.addEventListener("keydown", arm, { once: true });
}).catch(() => {});
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
const steel = standardMaterial({ ...MATERIAL_RECIPES.playerSteel, size: TEX_SIZE });
const gunPivot = new THREE.Group();
gunPivot.position.set(-0.08, 1.46, 0.16);

// Weapon-Mounted Tactical Flashlight (SpotLight + Target) attached to gunPivot — OFF by default until card/light-gun unlocked
const gunFlashlight = new THREE.SpotLight(0xffe8a3, 0, 22, 0.46, 0.45, 1.3);
gunFlashlight.position.set(0, -0.02, 0.72);
gunFlashlight.castShadow = false;
gunFlashlight.userData.tag = "gun-flashlight";
gunFlashlight.userData.preserveOnRebuild = true;
const gunFlashlightTarget = new THREE.Object3D();
gunFlashlightTarget.position.set(0, -0.25, 14);
gunFlashlightTarget.userData.preserveOnRebuild = true;
gunPivot.add(gunFlashlight);
gunPivot.add(gunFlashlightTarget);
gunFlashlight.target = gunFlashlightTarget;

buildOperatorRig(soldier, gunPivot, TEX_SIZE, 0);
let rifle = rebuildWeaponMesh(gunPivot, "spray", steel);
const operatorKeyLight = new THREE.PointLight(0xffd699, 5.2, 15, 1.4);
operatorKeyLight.position.set(0.9, 2.6, 1.9);
operatorKeyLight.userData.tag = "operator-key-light";
soldier.add(operatorKeyLight);

// Solar Strobe 360° Aura Light & Ground Halo (ONLY active when Solar Halo Aura card is picked)
const solarAuraLight = new THREE.PointLight(0x6fe3ff, 0, 16, 1.5);
solarAuraLight.position.set(0, 1.6, 0);
solarAuraLight.userData.tag = "solar-aura-light";
soldier.add(solarAuraLight);

const solarAuraRing = new THREE.Mesh(
  new THREE.RingGeometry(1.3, 1.65, 28),
  new THREE.MeshBasicMaterial({ color: 0x6fe3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
);
solarAuraRing.rotation.x = -Math.PI / 2;
solarAuraRing.position.y = 0.04;
solarAuraRing.visible = false;
solarAuraRing.userData.tag = "solar-aura-ring";
soldier.add(solarAuraRing);

// Helios Orbiting Light-Drone (ONLY active when Light-Drone card is picked)
const lightDroneGroup = new THREE.Group();
lightDroneGroup.visible = false;
lightDroneGroup.userData.tag = "light-drone";
const droneCore = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 12, 12),
  new THREE.MeshBasicMaterial({ color: 0x55f2ff }),
);
const droneHalo = new THREE.Mesh(
  new THREE.TorusGeometry(0.32, 0.04, 8, 20),
  new THREE.MeshBasicMaterial({ color: 0xffe484 }),
);
droneHalo.rotation.x = Math.PI / 2;
const lightDronePoint = new THREE.PointLight(0x55f2ff, 0, 14, 1.5);
lightDroneGroup.add(droneCore, droneHalo, lightDronePoint);
scene.add(lightDroneGroup);

// Flare-Drop Ground Beacons (ONLY spawned when Ground Beacons card is picked)
const beaconList = [];
const lightBlastRings = [];
const enemyProjectiles = [];
const chargeZones = [];
const mortarZones = [];

scene.add(soldier);

const arenaPropsGroup = new THREE.Group();
arenaPropsGroup.userData.tag = "arena-props";
scene.add(arenaPropsGroup);
warmGlbAssets();

const enemyGeo = new THREE.BoxGeometry(1.05, 1.05, 1.05);
const enemyMat = standardMaterial({ ...MATERIAL_RECIPES.enemyChitin, size: TEX_SIZE });
enemyMat.emissive = new THREE.Color(hexInt(PALETTE.enemyEmissive));
enemyMat.emissiveIntensity = 0.75;
const enemyMaterials = createEnemyMaterialBank(enemyMat, TEX_SIZE);

const tracerGeo = new THREE.BoxGeometry(0.055, 0.055, 1);
const tracerMat = new THREE.MeshBasicMaterial({ color: hexInt(PALETTE.tracerDefault), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
const orbGeo = new THREE.SphereGeometry(0.14, 10, 10);
const tracers = [];
for (let i = 0; i < TUNING.feel.tracerPoolSize; i++) {
  const mesh = new THREE.Mesh(tracerGeo, tracerMat.clone());
  mesh.visible = false;
  mesh.userData.tag = "tracer";
  scene.add(mesh);

  const orbMat = new THREE.MeshBasicMaterial({ color: hexInt(PALETTE.tracerDefault), transparent: true, opacity: 0.96, blending: THREE.AdditiveBlending, depthWrite: false });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  orb.visible = false;
  orb.userData.tag = "tracer-orb";
  scene.add(orb);

  tracers.push({
    mesh,
    orb,
    life: 0,
    maxLife: 0.1,
    start: new THREE.Vector3(),
    end: new THREE.Vector3(),
    color: 0xffd57a,
  });
}

// Pool of 8 dynamic travelling PointLights that ride along with Light-Orb Tracer Bullets
const ORB_LIGHT_COUNT = lowEnd ? 3 : 8;
const orbLights = [];
for (let i = 0; i < ORB_LIGHT_COUNT; i++) {
  const pt = new THREE.PointLight(0xffd57a, 0, 14, 1.6);
  pt.visible = false;
  pt.userData.tag = "tracer-orb-light";
  scene.add(pt);
  orbLights.push(pt);
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
  populateArenaProps(arenaKey, arenaPropsGroup, TEX_SIZE);
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
const enemyManager = new EnemyManager(rng, scene, enemyMaterials, ENEMY_CAP);
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
  enemyManager,
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
  darknessFactor: 0,
  darknessForced: false,
  darknessWaveActive: false,
  airdropState: null,
  showResults: false,
  skinIndex: 0,
  loadoutIndex: 0,
  selectedArenaIndex: 0,
  selectedOptionIndex: 0,
  optionsCaller: "title",
  menuCooldown: 0,
  lastRenderedWeaponStyle: "spray",
};

if (testMode) {
  window.__forgeSmokeTest = {
    getState: () => state,
    getScene: () => scene,
    getSoldier: () => soldier,
    getGunPivot: () => gunPivot,
    getWeapons: () => weaponManager,
    getCards: () => cardSystem,
    getManager: () => managerUI,
    getRainY: () => +rainPos[1].toFixed(3),
    getTreeSway: () => (trees[0] ? +trees[0].rotation.z.toFixed(4) : null),
    getGrenades: () => grenades.length,
    getTracerColors: () => tracers.filter((t) => t.life > 0).map((t) => t.mesh.material.color.getHex()),
    getCruise: () => ({ style: weaponManager.active.styleKey, vfx: STYLE_VFX[weaponManager.active.styleKey] || null }),
    getEnemies: () => enemyManager,
    getColliders: () => arenaColliders.map((c) => ({ tag: c.tag, shape: c.shape, hx: +(c.hx || c.radius || 0).toFixed(1), hz: +(c.hz || 0).toFixed(1), x: +c.x.toFixed(1), z: +c.z.toFixed(1) })),
    testPush: (x, z, r = 0.55) => {
      const probe = { x, z };
      const hit = resolveObstacleCollision(probe, r, arenaColliders);
      return { start: { x, z }, end: { x: +probe.x.toFixed(2), z: +probe.z.toFixed(2) }, pushed: hit };
    },
    getSoldierTint: () => {
      let hex = 0, n = 0;
      soldier.traverse((o) => {
        if (o.isMesh && o.material && o.material.color) { hex = (hex + o.material.color.getHex()) % 0xffffff; n++; }
      });
      return { hex, meshes: n };
    },
    getCardSystem: () => cardSystem,
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

// ── CYBORG MANAGER ─────────────────────────────────────────────────────────────────────────
// Between runs the player manages the fighter here; the run itself is autonomous.
state.cyborgProfile = loadSave().profile;
state.autopilot = true;
const startMenuUI = createStartMenu({
  getProfile: () => state.cyborgProfile,
  onEnter: () => {
    state.phase = "loadout";
    state._managerShown = false;
    state.menuCooldown = 0.25;
    hudPhase = null;
  },
  onOptions: () => {
    state.optionsCaller = "title";
    state.phase = "options";
    state.menuCooldown = 0.25;
    hudPhase = null;
  },
});

// ── GAMEPAD ───────────────────────────────────────────────────────────────────
// The pad feeds the same key path as the keyboard through studio.injectInput.
const gamepad = createGamepad({
  inject: (input) => { try { studioApi?.injectInput?.(input); } catch (e) {} },
  getPhase: () => state.phase,
  onConfirm: () => {
    if (state.phase === "title") document.querySelector("#fs-start [data-enter]")?.click();
    else if (state.phase === "loadout") document.querySelector("#cyborg-manager [data-launch]")?.click();
    else if (state.phase === "results" || state.phase === "dead") {
      state.phase = "loadout";
      state._managerShown = false;
      state.menuCooldown = 0.25;
      hudPhase = null;
    }
  },
  onBack: () => {
    if (state.phase === "playing") { state.phase = "paused"; state.menuCooldown = 0.22; hudPhase = null; }
    else if (state.phase === "options") { state.phase = "title"; state.menuCooldown = 0.22; hudPhase = null; }
  },
  onPause: () => {
    if (state.phase === "playing") { state.phase = "paused"; state.menuCooldown = 0.22; hudPhase = null; }
    else if (state.phase === "paused") { state.phase = "playing"; state.menuCooldown = 0.22; hudPhase = null; }
  },
});

const talentUI = createTalentWindow({
  getProfile: () => state.cyborgProfile,
  saveProfile: (p) => { state.cyborgProfile = saveProfile(p); return state.cyborgProfile; },
  onChange: (p) => { state.cyborgProfile = p; },
});

const summaryUI = createSummary();
const barks = createBarks();

const cardTray = createCardTray({ onPick: (i) => pickCard(i) });

const managerUI = createManager({
  getProfile: () => state.cyborgProfile,
  arenaId: "arena1",
  onLaunch: ({ arenaId, equipped, profile }) => {
    state.cyborgProfile = profile;
    state.cyborgEquipped = equipped;
    state.banked = false;
    state.autopilot = true;
    state.attractSim = false;
    state.attractTime = 0;
    state.nextAttractSpawn = 0;
    if (typeof clearEnemies === "function") clearEnemies();
    const idx = STARTER_LOADOUTS.findIndex((w) => w.id === equipped.weapon);
    state.loadoutIndex = idx >= 0 ? idx : 0;
    state.skinIndex = Number.isInteger(equipped.skin) ? equipped.skin : 0;
    state.controlMode = equipped.mode === "manual" ? "manual" : "autonomous";
    const arenaIdx = menuModule.ARENAS.findIndex((a) => a.id === arenaId);
    if (arenaIdx >= 0) state.selectedArenaIndex = arenaIdx;
    startRun(arenaId);
  },
  onChange: (prof) => { state.cyborgProfile = prof; },
  onOpenTalents: () => talentUI.show(),
  onSkinChange: (idx) => {
    // picking a suit in the bay must change the model immediately, not only on the next run
    state.skinIndex = Number.isInteger(idx) ? idx : 0;
    buildOperatorRig(soldier, gunPivot, TEX_SIZE, state.skinIndex);
    const style = STARTER_LOADOUTS[state.loadoutIndex || 0]?.id || "spray";
    rifle = rebuildWeaponMesh(gunPivot, style, steel);
  },
});

const vMuzzle = new THREE.Vector3(), vTarget = new THREE.Vector3(), vDesired = new THREE.Vector3();
let hudPhase = null, hudHealth = null, hudKills = null, hudAmmo = null, hudBeat = null, hudScore = null, hudAirdrop = null, hudCards = null, hudBoss = null, hudDarkness = null;

function syncHud() {
  // The DOM manager is the loadout screen now: clear the canvas HUD so its text does not bleed
  // through the overlay, and let the 3D operator turntable show behind the panels.
  if (state.phase === "title" && state._startShown) {
    const hs = globalThis.__studio?.hud;
    if (hs) { try { hs.clear(); } catch (e) {} try { hs.compose?.(); } catch (e) {} }
    hudPhase = null;
    return;
  }

  if (state.phase === "loadout" && state._managerShown) {
    const h = globalThis.__studio?.hud;
    if (h) {
      try { h.clear(); } catch (e) { /* hud may not expose clear in older builds */ }
      try { h.compose?.(); } catch (e) { /* compose is optional */ }
    }
    hudPhase = null;
    return;
  }
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
    hudCards = null;
    hudBoss = null;
    hudDarkness = null;
  }

  const activeSkin = PLAYER_SKINS[state.skinIndex || 0] || PLAYER_SKINS[0];
  const activeLoadout = STARTER_LOADOUTS[state.loadoutIndex || 0] || STARTER_LOADOUTS[0];

  if (state.phase === "playing") {
    const color = state.health > 60 ? PALETTE.healthOk : state.health > 30 ? PALETTE.healthWarn : PALETTE.healthCrit;
    if (hudHealth !== state.health) {
      hudHealth = state.health;
      P("vitals", { x: 0.022, y: 0.03, w: 0.68, h: 0.165, radius: 0.014, fill: PALETTE.panels.status, stroke: PALETTE.strokes.status, width: 0.002 });
      T("vitals-title", `FORGE SMOKE // ${activeSkin.name}`, { x: 0.032, y: 0.042, size: TYPE_SCALE.label, color: PALETTE.hudLabel, weight: 700 });
      B("health", state.health / state.maxHealth, { x: 0.032, y: 0.069, w: 0.18, h: 0.023, color, back: PALETTE.strokes.barBack });
      T("health-num", String(state.health), { x: 0.218, y: 0.064, size: TYPE_SCALE.numeral, color, weight: 800 });
    }
    const killsKey = `${state.kills}:${cardSystem.level}`;
    if (hudKills !== killsKey) {
      hudKills = killsKey;
      weaponManager.syncReloadMeta(cardSystem.level, weaponManager.reloadUpgradesCount);
      T("kills", `THREATS DOWN  ${state.kills}   ·   LV ${cardSystem.level}`, { x: 0.032, y: 0.125, size: TYPE_SCALE.small, color: PALETTE.hudSecondary });
    }

    const activeConfig = weaponManager.getActiveConfig();
    const inactiveConfig = weaponManager.getInactiveConfig();
    const activeWeapon = weaponManager.active;
    const rldSpd = activeWeapon.reloadSpeedMultiplier || 1;

    let ammoText = activeWeapon.isReloading
      ? `AUTO-RELOAD ${Math.round(activeWeapon.reloadProgress * 100)}%  ·  RLD ${rldSpd.toFixed(2)}x`
      : `MAG  ${activeWeapon.magazine} / ${activeWeapon.maxMagazine}  ·  RLD ${rldSpd.toFixed(2)}x`;
    if (activeWeapon.isHeatWeapon) {
      ammoText = activeWeapon.isReloading
        ? `VENTING ${Math.round(activeWeapon.reloadProgress * 100)}%  ·  RLD ${rldSpd.toFixed(2)}x`
        : `HEAT  ${Math.round(activeWeapon.heat)} / ${activeWeapon.maxHeat}  ·  RLD ${rldSpd.toFixed(2)}x`;
    }
    if (hudAmmo !== ammoText) {
      hudAmmo = ammoText;
      T("ammo", ammoText, { x: 0.032, y: 0.151, size: TYPE_SCALE.label, color: activeWeapon.isReloading ? PALETTE.healthWarn : PALETTE.ui, weight: 700 });
      const barFrac = activeWeapon.isReloading
        ? activeWeapon.reloadProgress
        : activeWeapon.isHeatWeapon
          ? Math.max(0, 1 - activeWeapon.heat / Math.max(1, activeWeapon.maxHeat))
          : activeWeapon.magazine / Math.max(1, activeWeapon.maxMagazine);
      B("reload-bar", barFrac, { x: 0.032, y: 0.098, w: 0.18, h: 0.012, color: activeWeapon.isReloading ? PALETTE.healthWarn : PALETTE.ui, back: PALETTE.strokes.barBack });
    }

    // Weapon plates (ART-01 iconography): name + 48 px silhouette, one per style.
    const activeStyle = activeConfig?.style || activeWeapon?.styleKey || "spray";
    const inactiveStyle = inactiveConfig?.style || weaponManager.inactive?.styleKey || "pierce";
    const activeName = String(activeStyle).toUpperCase();
    const inactiveName = String(inactiveStyle).toUpperCase();
    T("weapon-active", `${activeName}`, { x: 0.325, y: 0.045, size: TYPE_SCALE.micro, color: PALETTE.ui, weight: 700 });
    T("weapon-inactive", `${inactiveName}`, { x: 0.325, y: 0.088, size: TYPE_SCALE.micro, color: PALETTE.hudLabel, weight: 500 });

    // Weapon icons, drawn at 28 px from the 48 px sheet cells.
    const activeIconSrc = weaponIconDataUrls[activeStyle];
    const inactiveIconSrc = weaponIconDataUrls[inactiveStyle];
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

    // Boss HP readout when Mech or Gunship is active
    const boss = enemyManager.getEnemies().find((e) => e.type === "gunship" || e.type === "mech");
    if (boss) {
      const bossKey = `${boss.type}:${Math.round(boss.hp)}`;
      if (hudBoss !== bossKey) {
        hudBoss = bossKey;
        const bossLabel = boss.type === "gunship" ? "BOSS // ASSAULT GUNSHIP" : "ELITE // SIEGE MECH";
        T("boss-label", `${bossLabel}  (${Math.max(0, Math.round(boss.hp))} HP)`, { x: 0.5, y: 0.11, size: TYPE_SCALE.micro, color: PALETTE.deadPrompt, weight: 700, align: "center" });
        B("boss-bar", Math.max(0, boss.hp / boss.maxHp), { x: 0.39, y: 0.132, w: 0.22, h: 0.014, color: PALETTE.healthCrit, back: PALETTE.strokes.barBack });
      }
    } else if (hudBoss !== null) {
      hudBoss = null;
      h.remove("boss-label");
      h.remove("boss-bar");
    }

    // "THE DARKNESS COMES" status banner when ambient light dims
    const darkPct = Math.round((state.darknessFactor || 0) * 100);
    const darkKey = darkPct >= 15 ? `DARK:${Math.round(darkPct / 5) * 5}:${weaponManager.lightModLevel}` : null;
    if (darkKey !== hudDarkness) {
      hudDarkness = darkKey;
      if (darkKey) {
        const modTag = weaponManager.lightModLevel > 0 ? `LIGHT MODS LV ${weaponManager.lightModLevel} (+25% LIT DMG)` : "GUN FLOODLIGHT & LIGHT-ORB ROUNDS ENGAGED";
        T("darkness-alert", `THE DARKNESS COMES (${darkPct}% DIM)  ·  ${modTag}`, { x: 0.5, y: 0.162, size: TYPE_SCALE.micro, color: "#ffd57a", weight: 800, align: "center" });
      } else {
        h.remove("darkness-alert");
      }
    }

    // 3-Choice Tactical Upgrade Card Overlay
    // (legacy canvas card banner removed: the DOM card tray owns card presentation)
 else if (hudCards !== null) {
      hudCards = null;
      h.remove("card-panel");
      h.remove("card-hdr");
      h.remove("card-options");
    }

    if (!changed) return;
  }

  if (changed) {
    const hint = state.phase === "dead"
      ? "R / SPACE / ENTER  ·  REDEPLOY"
      : state.phase === "results"
        ? "R / SPACE / ENTER  ·  REDEPLOY"
        : state.phase === "title"
          ? "[C] CYCLE SUIT SKIN  ·  [V] CYCLE STARTER WEAPON  ·  [W / SPACE] DEPLOY"
          : (state.controlMode === "manual"
            ? "STICK / WASD MOVE  ·  AUTO-FIRE  ·  X RELOAD  ·  Y SWAP  ·  1/2/3 CARDS"
            : "AUTONOMOUS  ·  YOU PLAY THE CARDS 1/2/3  ·  [L] DARKNESS WAVE  ·  Q SWAP");
    P("hint-panel", { x: 0.012, y: 0.902, w: 0.68, h: 0.048, radius: 0.008, fill: PALETTE.panels.hint, stroke: PALETTE.strokes.hint, width: 0.0015 });
    T("hint", hint, { x: 0.022, y: 0.916, size: TYPE_SCALE.micro, color: PALETTE.hudSecondary, weight: 600 });
  }

  if (state.phase === "title") {
    // Top-Center Tactical Command Header (leaves center viewport clear for 3D Operator turntable)
    P("title-panel", { anchor: "top", x: 0, y: 0.025, w: 0.78, h: 0.25, radius: 0.018, fill: PALETTE.panels.title, stroke: PALETTE.strokes.title, width: 0.002 });
    T("title-kicker", "LYGO FORGE TACTICAL DIVISION // SECTOR 09", { anchor: "top", x: 0, y: 0.042, size: TYPE_SCALE.micro, color: PALETTE.hudLabel, weight: 700 });
    T("title", "FORGE SMOKE", { anchor: "top", x: 0, y: 0.072, size: TYPE_SCALE.display, color: PALETTE.titleText, weight: 800 });
    T("title-sub", "Hold the perimeter. 3 Arenas · 8 Hostile Classes · 12 Weapons.", { anchor: "top", x: 0, y: 0.165, size: TYPE_SCALE.small, color: PALETTE.hudSubtitle });
    T("title-prompt", "PRESS  W, SPACE OR ENTER TO CONTINUE  ·  [O] OPTIONS", { anchor: "top", x: 0, y: 0.212, size: TYPE_SCALE.prompt, color: PALETTE.healthOk, weight: 700 });
    if (saved.bestScore > 0) {
      T("best-score", `BEST  ${saved.bestScore}`, { anchor: "top", x: 0, y: 0.248, size: TYPE_SCALE.micro, color: PALETTE.hudSecondary });
    }

    // Left Flank Operator Suit Selector Panel
    P("skin-panel", { x: 0.022, y: 0.32, w: 0.54, h: 0.20, radius: 0.014, fill: PALETTE.panels.status, stroke: PALETTE.strokes.status, width: 0.002 });
    T("skin-hdr", "OPERATOR SUIT  [PRESS C]", { x: 0.034, y: 0.338, size: TYPE_SCALE.micro, color: PALETTE.hudLabel, weight: 700 });
    T("skin-name", activeSkin.name, { x: 0.034, y: 0.374, size: TYPE_SCALE.subhead, color: PALETTE.titleText, weight: 800 });
    T("skin-role", activeSkin.desc, { x: 0.034, y: 0.418, size: TYPE_SCALE.micro, color: PALETTE.healthOk, weight: 700 });
    T("skin-idx", `SUIT ${(state.skinIndex || 0) + 1} / ${PLAYER_SKINS.length}  ·  ARMORED RIG READY`, { x: 0.034, y: 0.458, size: TYPE_SCALE.micro, color: PALETTE.hudSecondary });

    // Right Flank Starter Weapon Loadout Selector Panel
    P("loadout-panel", { anchor: "top-right", x: 0.022, y: 0.32, w: 0.56, h: 0.20, radius: 0.014, fill: PALETTE.panels.status, stroke: PALETTE.strokes.status, width: 0.002 });
    T("loadout-hdr", "PRIMARY LOADOUT  [PRESS V]", { anchor: "top-right", x: 0.034, y: 0.338, size: TYPE_SCALE.micro, color: PALETTE.hudLabel, weight: 700 });
    T("loadout-name", `${activeLoadout.name}`, { anchor: "top-right", x: 0.034, y: 0.374, size: TYPE_SCALE.subhead, color: PALETTE.ui, weight: 800 });
    T("loadout-role", `ROLE: ${activeLoadout.role}  ·  SEC: PIERCE RAIL`, { anchor: "top-right", x: 0.034, y: 0.418, size: TYPE_SCALE.micro, color: PALETTE.hudSubtitle, weight: 700 });
    T("loadout-idx", `WEAPON ${(state.loadoutIndex || 0) + 1} / ${STARTER_LOADOUTS.length}  ·  12 STYLES ARMED`, { anchor: "top-right", x: 0.034, y: 0.458, size: TYPE_SCALE.micro, color: PALETTE.hudSecondary });

    // Bottom-Right Threat & Campaign Briefing Panel
    P("briefing-panel", { anchor: "bottom-right", x: 0.022, y: 0.048, w: 0.72, h: 0.145, radius: 0.012, fill: PALETTE.panels.hint, stroke: PALETTE.strokes.status, width: 0.0018 });
    T("briefing-1", "ARENAS: PERIMETER RAIN -> BREACH YARD -> GUNSHIP HELIPAD", { anchor: "bottom-right", x: 0.034, y: 0.142, size: TYPE_SCALE.micro, color: PALETTE.hudLabel, weight: 700 });
    T("briefing-2", "HOSTILES: RIFLEMAN · SAPPER · SHIELD · SPOTTER · DRONE · MORTAR · MECH · GUNSHIP", { anchor: "bottom-right", x: 0.034, y: 0.105, size: TYPE_SCALE.micro, color: PALETTE.hudSecondary });
    T("briefing-3", "ARMORY READY: 3D OPERATOR SKINS & WEAPON ATTACHMENTS ACTIVE", { anchor: "bottom-right", x: 0.034, y: 0.068, size: TYPE_SCALE.micro, color: PALETTE.healthOk, weight: 700 });
  } else if (state.phase === "arenaSelect") {
    P("as-panel", { anchor: "center", x: 0, y: 0, w: 0.82, h: 0.62, radius: 0.02, fill: PALETTE.panels.title, stroke: PALETTE.strokes.title, width: 0.002 });
    T("as-title", "TACTICAL ARENA SELECTION", { anchor: "center", x: 0, y: -0.26, size: TYPE_SCALE.h2, color: PALETTE.titleText, weight: 800 });
    T("as-sub", "[UP / DOWN] SELECT ARENA  ·  [ENTER / SPACE] CONFIRM  ·  [ESC] TITLE", { anchor: "center", x: 0, y: -0.19, size: TYPE_SCALE.micro, color: PALETTE.hudSecondary });
    
    menuModule.ARENAS.forEach((a, i) => {
      const unlocked = menuModule.isArenaUnlocked(a.id, loadSave());
      const selected = state.selectedArenaIndex === i;
      const color = selected ? PALETTE.titleText : unlocked ? PALETTE.ui : PALETTE.hudSubtitle;
      const status = unlocked ? "UNLOCKED" : `LOCKED (REQ ${a.reqScore} PTS)`;
      const prefix = selected ? "▶ " : "  ";
      const y = -0.06 + i * 0.11;
      T(`as-arena-${i}`, `${prefix}${a.name.toUpperCase()} — ${a.desc}  [${status}]`, { anchor: "center", x: 0, y, size: TYPE_SCALE.subhead, color, weight: selected ? 800 : 600 });
    });
  } else if (state.phase === "loadout") {
    P("ld-panel", { anchor: "center", x: 0, y: 0, w: 0.75, h: 0.55, radius: 0.02, fill: PALETTE.panels.title, stroke: PALETTE.strokes.title, width: 0.002 });
    T("ld-title", "ARMORY LOADOUT & DEPLOY", { anchor: "center", x: 0, y: -0.22, size: TYPE_SCALE.h2, color: PALETTE.titleText, weight: 800 });
    T("ld-arena", `ARENA: ${menuModule.ARENAS[state.selectedArenaIndex].name.toUpperCase()}`, { anchor: "center", x: 0, y: -0.12, size: TYPE_SCALE.subhead, color: PALETTE.healthOk, weight: 700 });
    T("ld-skin", `OPERATOR SUIT: ${activeSkin.name} [PRESS C TO CYCLE]`, { anchor: "center", x: 0, y: -0.04, size: TYPE_SCALE.label, color: PALETTE.ui });
    T("ld-weapon", `PRIMARY WEAPON: ${activeLoadout.name} [PRESS V TO CYCLE]`, { anchor: "center", x: 0, y: 0.02, size: TYPE_SCALE.label, color: PALETTE.hudSecondary });
    T("ld-prompt", "[1 / 2 / 3 / ENTER] DEPLOY INTO COMBAT  ·  [ESC] BACK", { anchor: "center", x: 0, y: 0.20, size: TYPE_SCALE.prompt, color: PALETTE.healthOk, weight: 700 });
  } else if (state.phase === "paused") {
    P("p-panel", { anchor: "center", x: 0, y: 0, w: 0.6, h: 0.45, radius: 0.02, fill: PALETTE.panels.title, stroke: PALETTE.strokes.title, width: 0.002 });
    T("p-title", "TACTICAL PAUSE", { anchor: "center", x: 0, y: -0.16, size: TYPE_SCALE.h2, color: PALETTE.titleText, weight: 800 });
    T("p-res", "[ESC / ENTER]  RESUME COMBAT", { anchor: "center", x: 0, y: -0.06, size: TYPE_SCALE.body, color: PALETTE.healthOk, weight: 700 });
    T("p-rst", "[R]  RESTART RUN", { anchor: "center", x: 0, y: -0.01, size: TYPE_SCALE.body, color: PALETTE.ui, weight: 700 });
    T("p-opt", "[O]  SETTINGS & OPTIONS", { anchor: "center", x: 0, y: 0.04, size: TYPE_SCALE.body, color: PALETTE.hudSecondary, weight: 700 });
    T("p-quit", "[Q / BACKSPACE]  ABANDON TO TITLE", { anchor: "center", x: 0, y: 0.09, size: TYPE_SCALE.body, color: PALETTE.healthCrit, weight: 700 });
  } else if (state.phase === "options") {
    const currentSettings = getSettings();
    P("opt-panel", { anchor: "center", x: 0, y: 0, w: 0.78, h: 0.68, radius: 0.02, fill: PALETTE.panels.title, stroke: PALETTE.strokes.title, width: 0.002 });
    T("opt-title", "SETTINGS & OPTIONS", { anchor: "center", x: 0, y: -0.28, size: TYPE_SCALE.h2, color: PALETTE.titleText, weight: 800 });
    T("opt-sub", "[UP / DOWN] SELECT  ·  [LEFT / RIGHT] ADJUST  ·  [ESC] BACK", { anchor: "center", x: 0, y: -0.21, size: TYPE_SCALE.micro, color: PALETTE.hudSecondary });

    const optItems = [
      { label: "Master Volume", val: `${Math.round((currentSettings.masterVolume ?? 0.8) * 100)}%` },
      { label: "SFX Volume", val: `${Math.round((currentSettings.sfxVolume ?? 1.0) * 100)}%` },
      { label: "Music Volume", val: `${Math.round((currentSettings.musicVolume ?? 0.6) * 100)}%` },
      { label: "Aim Sensitivity", val: `${(currentSettings.sensitivity ?? 1.0).toFixed(1)}x` },
      { label: "Graphics Quality", val: (currentSettings.quality ?? "low").toUpperCase() },
      { label: "Show FPS Overlay", val: currentSettings.showFPS ? "ON" : "OFF" }
    ];

    optItems.forEach((o, i) => {
      const selected = state.selectedOptionIndex === i;
      const color = selected ? PALETTE.titleText : PALETTE.ui;
      const prefix = selected ? "▶ " : "  ";
      const y = -0.12 + i * 0.07;
      T(`opt-item-${i}`, `${prefix}${o.label.padEnd(20, ' ')} :  [${o.val}]`, { anchor: "center", x: 0, y, size: TYPE_SCALE.body, color, weight: selected ? 800 : 600 });
    });
  } else if (state.phase === "dead") {
    P("dead-panel", { anchor: "center", x: 0, y: 0, w: 0.62, h: 0.27, radius: 0.02, fill: PALETTE.panels.dead, stroke: PALETTE.strokes.dead, width: 0.002 });
    T("dead-title", "PERIMETER LOST", { anchor: "center", x: 0, y: -0.065, size: TYPE_SCALE.deathTitle, color: PALETTE.deadTitle, weight: 800 });
    T("dead-sub", `THREATS DOWN  ${state.kills}`, { anchor: "center", x: 0, y: 0.005, size: TYPE_SCALE.subhead, color: PALETTE.deadSub });
    T("dead-prompt", "PRESS  R  TO REDEPLOY  ·  [T] TITLE", { anchor: "center", x: 0, y: 0.072, size: TYPE_SCALE.prompt, color: PALETTE.deadPrompt, weight: 700 });
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
    T("results-prompt", "PRESS  R  TO REDEPLOY  ·  [T] TITLE", { anchor: "center", x: 0, y: 0.32, size: TYPE_SCALE.prompt, color: PALETTE.deadPrompt, weight: 700 });
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
    if (tracer.orb) tracer.orb.visible = false;
  }
  for (const pt of orbLights) {
    pt.visible = false;
    pt.intensity = 0;
  }
  state.flash = 0;
  flash.visible = false;
}

function placeCamera() {
  camera.position.set(state.pos.x, 6.4, state.pos.z + 9);
  camera.lookAt(state.pos.x, 1.25, state.pos.z);
}

function startRun(arenaId = "arena1") {
  clearEnemies();
  clearEffects();
  const seed = state.seed;
  state.rng = makeRng(seed);
  const chosenStyle = STARTER_LOADOUTS[state.loadoutIndex || 0]?.id || "spray";
  const secondaryStyle = chosenStyle === "pierce" ? "spray" : "pierce";
  
  const arenaKeyMap = { arena1: "perimeter", arena2: "breach", arena3: "gunship" };
  const targetArenaKey = arenaKeyMap[arenaId] || "perimeter";

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
    lastRenderedWeaponStyle: chosenStyle,
    // -- CYBORG MANAGER: the fighter is autonomous, the player plays cards --
    autopilot: state.autopilot !== false,
    runXp: 0,
    pilotClock: 0,
    pilotMode: "hold",
    cardsPlayed: 0,
    bossSpawned: false,
    bossPaid: false,
    bossEnemy: null,
  });
  audioController?.playSfx("launch", { volume: 0.7 });
  // manager stat block -> real gameplay multipliers (integrity, speed, reload, damage, crit, tech)
  // special operations tree: fold its modifiers into this run
  state.talentMods = toRunMods(aggregate((state.cyborgProfile && state.cyborgProfile.talents) || []));
  const baseStats = statsForLevel((state.cyborgProfile && state.cyborgProfile.level) || 1,
    (state.cyborgProfile && state.cyborgProfile.equipped) || {});
  // attribute points are permanent and stack on top of the level block
  const at = (state.cyborgProfile && state.cyborgProfile.attrs) || {};
  baseStats.POWER += (at.power || 0) * 2;
  baseStats.ARMOR += (at.armor || 0) * 2;
  baseStats.AGILITY += (at.agility || 0);
  baseStats.HANDLING += (at.handling || 0);
  baseStats.TECH += (at.tech || 0);
  baseStats.SIGNAL += (at.signal || 0);
  state.cyborgStats = baseStats;
  applyStatsToRun(state, baseStats);
  if (state.talentMods) {
    const tm = state.talentMods;
    state.maxHealth = Math.round(state.maxHealth * (tm.hpMult || 1));
    state.health = state.maxHealth;
    state.statSpeedMult = (state.statSpeedMult || 1) * (tm.speedMult || 1);
    state.talentCrit = tm.critAdd || 0;
  }
  state.pos.set(0, 0, 0);
  soldier.position.set(0, 0, 0);
  soldier.rotation.y = 0;
  gunPivot.rotation.y = 0;
  buildOperatorRig(soldier, gunPivot, TEX_SIZE, state.skinIndex || 0);
  rifle = rebuildWeaponMesh(gunPivot, chosenStyle, steel);
  weaponManager.rng = state.rng;
  weaponManager.primary = new Weapon(chosenStyle);
  weaponManager.secondary = new Weapon(secondaryStyle);
  weaponManager.activeSlot = "primary";
  // equipped light cards are spent in the manager, so the run starts with them already installed
  for (const modId of ((state.cyborgEquipped && state.cyborgEquipped.lightMods) || [])) {
    try { weaponManager.applyPart("primary", { id: modId }); } catch (e) { /* unknown mod id */ }
  }
  weaponManager.isSwapping = false;
  weaponManager.swapTimer = 0;
  cardSystem.rng = state.rng;
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
  
  applyArenaLighting(targetArenaKey);
  setLightsEnabled(true);
  placeCamera();
  hudPhase = null;
  syncHud();
}

function reset(seed) {
  state.seed = seed || 1;
  state.rng = makeRng(state.seed);
  clearEnemies();
  clearEffects();
  const chosenStyle = STARTER_LOADOUTS[state.loadoutIndex || 0]?.id || "spray";
  const secondaryStyle = chosenStyle === "pierce" ? "spray" : "pierce";
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
    lastRenderedWeaponStyle: chosenStyle,
  });
  state.pos.set(0, 0, 0);
  soldier.position.set(0, 0, 0);
  soldier.rotation.y = 0;
  gunPivot.rotation.y = 0;
  buildOperatorRig(soldier, gunPivot, TEX_SIZE, state.skinIndex || 0);
  rifle = rebuildWeaponMesh(gunPivot, chosenStyle, steel);
  weaponManager.rng = state.rng;
  weaponManager.primary = new Weapon(chosenStyle);
  weaponManager.secondary = new Weapon(secondaryStyle);
  weaponManager.activeSlot = "primary";
  weaponManager.isSwapping = false;
  weaponManager.swapTimer = 0;
  cardSystem.rng = state.rng;
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
  applyArenaLighting("perimeter");
  setLightsEnabled(true);
  placeCamera();
  syncHud();
}

function spawnEnemy() {
  const beat = beatDirector.getCurrentBeat();
  const types = beat.enemyTypes || ["rifleman"];
  const type = types[Math.floor(state.rng() * types.length)];
  const enemy = enemyManager.spawn(type, state.pos, beatDirector.runTime / 60);
  // DUAL RAMP: base level rises with the cyborg's profile, then climbs inside the arena
  if (enemy && typeof enemy.hp === "number") {
    const baseLevel = (state.cyborgProfile?.level || 1);
    const baseScale = 1 + Math.max(0, baseLevel - 1) * 0.07;
    const rampScale = 1 + Math.min(2.2, beatDirector.runTime / 240);
    const scale = baseScale * rampScale;
    enemy.hp = Math.round(enemy.hp * scale);
    enemy.maxHp = enemy.hp;
    enemy.scaleMult = scale;
  }
}

/** Lobbed grenades: a visible charge that arcs to the target, then a blast ring. */
const grenades = [];
function spawnGrenade(from, to, color) {
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 8, 8),
    new THREE.MeshBasicMaterial({ color })
  );
  orb.position.copy(from);
  scene.add(orb);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.52, 26),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);
  grenades.push({ orb, ring, from: from.clone(), to: to.clone(), t: 0, life: 0.42, boom: 0 });
}

function updateGrenades(dt) {
  for (let i = grenades.length - 1; i >= 0; i -= 1) {
    const g = grenades[i];
    if (g.boom === 0) {
      g.t += dt;
      const k = Math.min(1, g.t / g.life);
      g.orb.position.lerpVectors(g.from, g.to, k);
      g.orb.position.y += Math.sin(k * Math.PI) * 1.7;
      if (k >= 1) {
        g.boom = 1e-3;
        g.orb.visible = false;
        g.ring.position.copy(g.to);
        g.ring.visible = true;
      }
    } else {
      g.boom += dt;
      const k = Math.min(1, g.boom / 0.42);
      g.ring.scale.setScalar(1 + k * 7);
      g.ring.material.opacity = 0.9 * (1 - k);
      if (k >= 1) {
        scene.remove(g.orb);
        scene.remove(g.ring);
        g.orb.geometry.dispose();
        g.ring.geometry.dispose();
        grenades.splice(i, 1);
      }
    }
  }
}

/** Weather + foliage tick. Runs in EVERY phase, because a frozen rainfield in the bay looked
 *  exactly like a broken game: the camera turned but nothing in the world moved. */
function updateEnvironment(dt) {
  for (let i = 0; i < RAIN; i++) {
    rainPos[i * 6 + 1] -= 17 * dt;
    rainPos[i * 6 + 4] -= 17 * dt;
    if (rainPos[i * 6 + 1] < 0) seedDrop(i, state.pos.x, state.pos.z);
  }
  rainGeo.attributes.position.needsUpdate = true;
  for (const tree of trees) swayTree(tree, state.t, { dir: [0.8, 0.35], strength: 0.55 });
}

function shoot(target) {
  soldier.updateMatrixWorld(true);
  vMuzzle.set(0, 0, 1.05);
  gunPivot.localToWorld(vMuzzle);
  vTarget.set(target.mesh.position.x, target.mesh.position.y + 0.15, target.mesh.position.z);

  const fireData = weaponManager.fire(state.aimMode);
  if (!fireData) return;
  const vfx = STYLE_VFX[weaponManager.active?.styleKey] || STYLE_VFX.spray;
  const isGrenade = GRENADE_STYLES.has(weaponManager.active?.styleKey);
  if (!state.attractSim) {
    audioController?.playSfx(vfx.sound, { volume: 0.5, pitch: vfx.pitch * (0.96 + state.rng() * 0.08) });
  }

  // Spawn tracers + Travelling Light-Orb Projectiles
  const pelletCount = fireData.pellets || 1;
  const darkBoost = Math.max(state.darknessFactor || 0, state.blackoutActive ? 1 : 0);
  const orbScaleBase = (weaponManager.hasLightOrbMod ? 1.75 : 1.0) * (1 + darkBoost * 0.85);
  const orbLife = Math.max(fireData.tracerLife, 0.16 + darkBoost * 0.12 + (weaponManager.hasLightOrbMod ? 0.08 : 0));

  for (let p = 0; p < pelletCount; p++) {
    const tracer = tracers.find((t) => t.life <= 0);
    if (tracer) {
      const spreadAngle = (state.rng() - 0.5) * fireData.spread * (Math.PI / 180);
      const dir = new THREE.Vector3().subVectors(vTarget, vMuzzle).normalize();
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
      const travelDist = Math.min(26, Math.max(5, vMuzzle.distanceTo(vTarget) + 3.5));
      const endPos = vMuzzle.clone().add(dir.clone().multiplyScalar(travelDist));
      tracer.start.copy(vMuzzle);
      tracer.end.copy(endPos);
      tracer.color = fireData.tracerColor;
      tracer.maxLife = orbLife;
      tracer.life = orbLife;

      tracer.mesh.position.copy(vMuzzle).add(endPos).multiplyScalar(0.5);
      tracer.mesh.lookAt(endPos);
      const tracerWidth = state.attractSim ? 0.42 : (1 + darkBoost * 0.6) * vfx.tracer;
      tracer.mesh.scale.set(tracerWidth, tracerWidth, Math.max(0.4, vMuzzle.distanceTo(endPos)));
      tracer.mesh.material.color.setHex(vfx.color);
      tracer.mesh.visible = true;

      if (tracer.orb) {
        tracer.orb.position.copy(vMuzzle);
        tracer.orb.scale.setScalar(orbScaleBase);
        tracer.orb.material.color.setHex(fireData.tracerColor);
        tracer.orb.visible = !state.attractSim;   // the shop window gets tracers, not orbs
      }
    }
  }

  flash.position.copy(vMuzzle);
  if (flash.material && flash.material.color) flash.material.color.setHex(vfx.color);
  flash.scale.setScalar((fireData.muzzleFlashSize / 0.24) * vfx.flash);
  flash.visible = !state.attractSim;   // no blown-out flash ball in the bay demo
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

  // Grenade styles throw a real object: a lobbed charge that arcs to the target and detonates.
  if (isGrenade && !state.attractSim) {
    spawnGrenade(vMuzzle.clone(), vTarget.clone(), vfx.color);
  }

  // Apply recoil
  gunPivot.rotation.y += (state.rng() - 0.5) * fireData.recoilYaw * 2;
  gunPivot.rotation.x -= Math.abs(fireData.recoilPitch);

  // Deal damage (+25% bonus when target is illuminated in Darkness or with Floodlight/Light-Orb mods)
  const litBonusMult = (state.darknessFactor > 0.25 || weaponManager.hasFloodlightMod || weaponManager.hasLightOrbMod) ? 1.25 : 1.0;
  const explosive = Boolean(weaponManager.hasExplosiveMod);
  const shieldPierce = isGrenade ? 1 : (explosive ? 0.55 : 0);
  const talentDmg = state.talentMods?.damageMult || 1;
  const effectiveDamage = Math.round(fireData.damage * litBonusMult * (explosive ? 1.15 : 1) * talentDmg);
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
      const result = enemyManager.damageEnemy(enemy, effectiveDamage, isGrenade, 0, shieldPierce);
      damageDealt += effectiveDamage;
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
        const result = enemyManager.damageEnemy(best, dmg, isGrenade, 0, shieldPierce);
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
    const result = enemyManager.damageEnemy(target, Math.round(fireData.damage * (explosive ? 1.15 : 1)), isGrenade, 0, shieldPierce);
    damageDealt = fireData.damage;
    if (result.killed) {
      state.kills++;
      audioController?.playSfx("kill", { volume: 0.6, pitch: 0.95 + state.rng() * 0.1 });
      scoreSystem.recordKill(target.getScoreValue());
      cardSystem.addXp(target.getXpValue());
      state.runXp = (state.runXp || 0) + target.getXpValue() * 1.5;
    }
  }

  scoreSystem.recordDamage(damageDealt);
}

function nearest(maxDistance = 24) {
  return enemyManager.findNearest(state.pos, state.yaw, maxDistance, TAU); // Full 360° threat acquisition
}

/** Roll one legendary the profile does not own yet (light mods + perks are the drop pool). */
function rollLegendary(profile) {
  const pool = [...LIGHT_MODS.map((m) => m.id), ...PERKS.map((k) => k.id)]
    .filter((id) => !(profile.legacy || []).includes(id));
  if (!pool.length) return null;
  return pool[Math.floor(state.rng() * pool.length)];
}

/** Bank a finished run: XP by survival time + kills, optional legendary on an arena clear. */
function bankRun(cleared = false) {
  const base = state.cyborgProfile || loadSave().profile;
  const gained = Math.round((state.runXp || 0) + beatDirector.runTime * 2.5);
  const res = addProfileXp(base, gained);
  let prof = { ...res.profile };
  prof.runs = (prof.runs || 0) + 1;
  const legendary = cleared ? rollLegendary(prof) : null;
  if (cleared) {
    prof.arenasCleared = (prof.arenasCleared || 0) + 1;
  }
  if (legendary) prof = grantLegacy(prof, legendary);
  prof.bestRunTime = Math.max(prof.bestRunTime || 0, beatDirector.runTime);
  if (res.levelled > 0) {
    audioController?.playSfx("levelup", { volume: 0.7 });
    prof.attrPoints = (prof.attrPoints ?? 0) + res.levelled;   // one attribute point per level
  }
  state.cyborgProfile = saveProfile(prof);

  // ── special operations points (generous by design) ────────────────────────
  {
    // stingy on purpose: 1 for dying, 5 for clearing - and a death only pays after a real run,
    // otherwise you farm points by dying at 5 seconds.
    const MIN_PAY_SECONDS = 60;
    const gained = cleared ? 5 : (beatDirector.runTime >= MIN_PAY_SECONDS ? 1 : 0);
    prof.talentPoints = (prof.talentPoints ?? 0) + gained;
    state.lastTalentGain = gained;
    state.cyborgProfile = saveProfile(prof);
  }

  // ── public leaderboard: highest level, written to the arcade ledger ───────
  const cyName = String(prof.name || "").trim();
  if (cyName && globalThis.ArcadeLedger?.forgesmoke) {
    try {
      globalThis.ArcadeLedger.forgesmoke({
        name: cyName,
        level: Math.max(1, Math.floor(prof.level)),
        ms: Math.round(beatDirector.runTime * 1000),
        mode: state.controlMode || "autonomous",
        date: new Date().toISOString().slice(0, 10),
      });
      state.lastSubmit = { name: cyName, level: prof.level };
    } catch (e) { state.lastSubmit = { error: "ledger unavailable" }; }
  } else {
    state.lastSubmit = { error: cyName ? "ledger unavailable" : "no name set" };
  }
  state.lastBank = { gained, levelled: res.levelled, legendary, cleared };
  return state.lastBank;
}

function hurt(amount) {
  if (amount >= 22) barks.trigger("close_call");   // a big single hit is a close call
  if (state.phase !== "playing") return;
  state.health = Math.max(0, state.health - amount);
  audioController?.playSfx("hurt", { volume: 0.45, pitch: 1.0 });
  globalThis.__studio?.hud?.flash("#e5313b", 0.22);
  if (state.health <= 0) {
    state.phase = "dead";
    if (!state.banked) { state.banked = true; bankRun(false); }
    globalThis.__studio?.hud?.flash("#e5313b", 0.55);
    syncHud();
  }
}

const held = (ctx, names) => names.some((name) => ctx.keys.has(name));

function update(dt, ctx) {
  gamepad.poll(state.phase === "playing");

  const dockEl = globalThis.document?.getElementById?.("siteDock");
  if (dockEl) dockEl.classList.toggle("bare", state.phase === "playing");

  // run report on the results screen, and nowhere else
  if (state.phase === "results") {
    if (!summaryUI.open) {
      summaryUI.show({
        time: beatDirector.runTime,
        kills: state.kills,
        level: state.cyborgProfile?.level,
        talentGain: state.lastTalentGain ?? 0,
        bossDown: Boolean(state.bossPaid),
        bank: state.lastBank || {},
      });
    }
  } else if (summaryUI.open) {
    summaryUI.hide();
  }

  // start menu is up exactly while the title phase is active
  if (state.phase === "title") {
    if (state._startShown !== true) { startMenuUI.show(); state._startShown = true; }
  } else if (state._startShown) {
    startMenuUI.hide(); state._startShown = false;
  }

  // manager terminal is up exactly while the loadout phase is active
  if (state.phase === "loadout") {
    if (state._managerShown !== true) { managerUI.show(state.cyborgProfile); state._managerShown = true; }
  } else if (state._managerShown) {
    managerUI.hide(); state._managerShown = false;
  }
  state.menuCooldown = Math.max(0, (state.menuCooldown || 0) - dt);
  if (state.phase === "title") {
    state.t += dt;
    state.orbit += dt * 0.26;
    soldier.rotation.y = Math.sin(state.t * 0.65) * 0.35;
    updateOperatorAnimation(soldier, gunPivot, dt, false, null);
    camera.position.set(Math.sin(state.orbit) * 5.6, 2.75, Math.cos(state.orbit) * 5.6);
    camera.lookAt(0, 1.25, 0);

    if (state.menuCooldown <= 0 && held(ctx, ["KeyC", "c", "C"])) {
      state.skinIndex = ((state.skinIndex || 0) + 1) % PLAYER_SKINS.length;
      buildOperatorRig(soldier, gunPivot, TEX_SIZE, state.skinIndex);
      const chosenStyle = STARTER_LOADOUTS[state.loadoutIndex || 0]?.id || "spray";
      rifle = rebuildWeaponMesh(gunPivot, chosenStyle, steel);
      state.menuCooldown = 0.22;
      hudPhase = null;
    } else if (state.menuCooldown <= 0 && held(ctx, ["KeyV", "v", "V"])) {
      state.loadoutIndex = ((state.loadoutIndex || 0) + 1) % STARTER_LOADOUTS.length;
      const chosenStyle = STARTER_LOADOUTS[state.loadoutIndex || 0]?.id || "spray";
      rifle = rebuildWeaponMesh(gunPivot, chosenStyle, steel);
      state.menuCooldown = 0.22;
      hudPhase = null;
    } else if (state.menuCooldown <= 0 && held(ctx, ["KeyO", "o", "O"])) {
      state.optionsCaller = "title";
      state.phase = "options";
      state.menuCooldown = 0.22;
      hudPhase = null;
    } else if (held(ctx, ["KeyW", "w", "W", "Space", "Enter", "ArrowRight"])) {
      state.phase = "loadout";   // straight into the cyborg manager
      state.menuCooldown = 0.22;
      hudPhase = null;
    }
  } else if (state.phase === "arenaSelect") {
    state.t += dt;
    state.orbit += dt * 0.26;
    soldier.rotation.y = Math.sin(state.t * 0.65) * 0.35;
    camera.position.set(Math.sin(state.orbit) * 5.6, 2.75, Math.cos(state.orbit) * 5.6);
    camera.lookAt(0, 1.25, 0);

    if (state.menuCooldown <= 0) {
      if (held(ctx, ["ArrowUp", "w", "W"])) {
        state.selectedArenaIndex = (state.selectedArenaIndex - 1 + menuModule.ARENAS.length) % menuModule.ARENAS.length;
        state.menuCooldown = 0.22;
        hudPhase = null;
      } else if (held(ctx, ["ArrowDown", "s", "S"])) {
        state.selectedArenaIndex = (state.selectedArenaIndex + 1) % menuModule.ARENAS.length;
        state.menuCooldown = 0.22;
        hudPhase = null;
      } else if (held(ctx, ["Digit1", "Key1"])) {
        state.selectedArenaIndex = 0;
        state.menuCooldown = 0.22;
        hudPhase = null;
      } else if (held(ctx, ["Digit2", "Key2"])) {
        state.selectedArenaIndex = 1;
        state.menuCooldown = 0.22;
        hudPhase = null;
      } else if (held(ctx, ["Digit3", "Key3"])) {
        state.selectedArenaIndex = 2;
        state.menuCooldown = 0.22;
        hudPhase = null;
      } else if (held(ctx, ["Enter", "Space"])) {
        const arena = menuModule.ARENAS[state.selectedArenaIndex];
        if (menuModule.isArenaUnlocked(arena.id, loadSave())) {
          state.phase = "loadout";
          state.menuCooldown = 0.22;
          hudPhase = null;
        } else {
          globalThis.__studio?.hud?.flash("#e5313b", 0.22);
          state.menuCooldown = 0.3;
        }
      } else if (held(ctx, ["Escape", "Backspace"])) {
        state.phase = "title";
        state.menuCooldown = 0.22;
        hudPhase = null;
      }
    }
  } else if (state.phase === "loadout") {
    // ── BAY IDLE ─────────────────────────────────────────────────────────────
    // The manager is a shop window, not a demo. The cyborg just stands there, facing the bay,
    // breathing. Enemies behind the panels looked glitchy and shield units never died, which
    // read as broken; a calm stance reads as a place.
    if (state._managerShown) {
      state.attractSim = true;
      state.t += dt;

      // clear anything a previous run left standing
      if (!state._bayCleared) {
        try { clearEnemies(); } catch (e) {}
        try { clearEffects(); } catch (e) {}
        state._bayCleared = true;
      }

      // The intro the game opened with - reused here, because it read as alive: the camera
      // orbits close (5.6 m) and the operator turns slowly side to side, so the whole frame moves.
      state.t += dt;
      state.orbit += dt * 0.26;
      state.pos.set(0, 0, 0);
      soldier.position.set(0, 0, 0);
      soldier.rotation.y = Math.PI + Math.sin(state.t * 0.65) * 0.42;
      gunPivot.rotation.y = Math.sin(state.t * 0.5 + 0.4) * 0.06;
      gunPivot.rotation.x = 0;
      updateOperatorAnimation(soldier, gunPivot, dt, false, weaponManager.active);
      camera.position.set(Math.sin(state.orbit) * 5.6, 2.75, Math.cos(state.orbit) * 5.6);
      camera.lookAt(0, 1.25, 0);

      updateEnvironment(dt);

      const h = globalThis.__studio?.hud;
      if (h && hudPhase !== "manager") {
        try { h.clear(); } catch (e) {}
        hudPhase = "manager";
      }
      return;
    }
    state._bayCleared = false;
    state.attractSim = false;
    state.t += dt;
    state.orbit += dt * 0.26;
    soldier.rotation.y = Math.sin(state.t * 0.65) * 0.35;
    camera.position.set(Math.sin(state.orbit) * 5.6, 2.75, Math.cos(state.orbit) * 5.6);
    camera.lookAt(0, 1.25, 0);

    if (state.menuCooldown <= 0) {
      if (held(ctx, ["KeyC", "c", "C"])) {
        state.skinIndex = ((state.skinIndex || 0) + 1) % PLAYER_SKINS.length;
        buildOperatorRig(soldier, gunPivot, TEX_SIZE, state.skinIndex);
        const chosenStyle = STARTER_LOADOUTS[state.loadoutIndex || 0]?.id || "spray";
        rifle = rebuildWeaponMesh(gunPivot, chosenStyle, steel);
        state.menuCooldown = 0.22;
        hudPhase = null;
      } else if (held(ctx, ["KeyV", "v", "V"])) {
        state.loadoutIndex = ((state.loadoutIndex || 0) + 1) % STARTER_LOADOUTS.length;
        const chosenStyle = STARTER_LOADOUTS[state.loadoutIndex || 0]?.id || "spray";
        rifle = rebuildWeaponMesh(gunPivot, chosenStyle, steel);
        state.menuCooldown = 0.22;
        hudPhase = null;
      } else if (held(ctx, ["Enter", "Space", "Digit1", "Key1", "Digit2", "Key2", "Digit3", "Key3"])) {
        startRun(menuModule.ARENAS[state.selectedArenaIndex].id);
      } else if (held(ctx, ["Escape", "Backspace"])) {
        state.phase = "arenaSelect";
        state.menuCooldown = 0.22;
        hudPhase = null;
      }
    }
  } else if (state.phase === "paused") {
    if (state.menuCooldown <= 0) {
      if (held(ctx, ["Escape", "Enter"])) {
        state.phase = "playing";
        state.menuCooldown = 0.22;
        hudPhase = null;
      } else if (held(ctx, ["KeyR", "r", "R"])) {
        startRun(menuModule.ARENAS[state.selectedArenaIndex].id);
      } else if (held(ctx, ["KeyO", "o", "O"])) {
        state.optionsCaller = "paused";
        state.phase = "options";
        state.menuCooldown = 0.22;
        hudPhase = null;
      } else if (held(ctx, ["KeyQ", "q", "Q", "Backspace"])) {
        state.phase = "title";
        state.menuCooldown = 0.22;
        hudPhase = null;
      }
    }
  } else if (state.phase === "options") {
    if (state.menuCooldown <= 0) {
      const currentSettings = getSettings();
      if (held(ctx, ["ArrowUp", "w", "W"])) {
        state.selectedOptionIndex = (state.selectedOptionIndex - 1 + 6) % 6;
        state.menuCooldown = 0.22;
        hudPhase = null;
      } else if (held(ctx, ["ArrowDown", "s", "S"])) {
        state.selectedOptionIndex = (state.selectedOptionIndex + 1) % 6;
        state.menuCooldown = 0.22;
        hudPhase = null;
      } else if (held(ctx, ["ArrowLeft", "a", "A", "ArrowRight", "d", "D", "Enter", "Space"])) {
        const dir = held(ctx, ["ArrowLeft", "a", "A"]) ? -1 : 1;
        if (state.selectedOptionIndex === 0) {
          currentSettings.masterVolume = Math.max(0, Math.min(1, (currentSettings.masterVolume ?? 0.8) + dir * 0.1));
        } else if (state.selectedOptionIndex === 1) {
          currentSettings.sfxVolume = Math.max(0, Math.min(1, (currentSettings.sfxVolume ?? 1.0) + dir * 0.1));
        } else if (state.selectedOptionIndex === 2) {
          currentSettings.musicVolume = Math.max(0, Math.min(1, (currentSettings.musicVolume ?? 0.6) + dir * 0.1));
        } else if (state.selectedOptionIndex === 3) {
          currentSettings.sensitivity = Math.max(0.5, Math.min(2.0, (currentSettings.sensitivity ?? 1.0) + dir * 0.1));
        } else if (state.selectedOptionIndex === 4) {
          const qMap = ["low", "medium", "high"];
          const qIdx = qMap.indexOf(currentSettings.quality ?? "low");
          currentSettings.quality = qMap[(qIdx + 1 + qMap.length) % qMap.length];
        } else if (state.selectedOptionIndex === 5) {
          currentSettings.showFPS = !currentSettings.showFPS;
        }
        updateSettings(currentSettings);
        state.menuCooldown = 0.22;
        hudPhase = null;
      } else if (held(ctx, ["Escape", "Backspace"])) {
        state.phase = state.optionsCaller || "title";
        state.menuCooldown = 0.22;
        hudPhase = null;
      }
    }
  } else if (state.phase === "dead" || state.phase === "results") {
    // after a run the cyborg goes back to the manager terminal, not straight into another fight
    if (held(ctx, ["KeyM", "m", "M", "KeyR", "r", "R", "Space", "Enter", "Mouse1"])) {
      if (state.phase === "results") {
        updateBestScore(scoreSystem.getCurrentScore(beatDirector.runTime));
        updateBestTime(beatDirector.runTime);
      }
      state.phase = "loadout";
      state._managerShown = false;
      state.menuCooldown = 0.25;
      hudPhase = null;
    } else if (held(ctx, ["KeyT", "t", "T", "Backspace", "Escape"])) {
      if (state.phase === "results") {
        updateBestScore(scoreSystem.getCurrentScore(beatDirector.runTime));
        updateBestTime(beatDirector.runTime);
      }
      state.phase = "title";
      state.menuCooldown = 0.22;
      hudPhase = null;
    }
  }

  if (state.phase === "playing") {
    if (state.menuCooldown <= 0 && held(ctx, ["Escape"])) {
      state.phase = "paused";
      state.menuCooldown = 0.22;
      hudPhase = null;
      return;
    }

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
    // CYBORG AUTOPILOT: the fighter flies itself, the player supplies power-ups
    if (state.autopilot && state.controlMode !== "manual") {
      const c = pilot(state, enemyManager, dt);
      // route the autopilot around props, otherwise it walks into cover and looks frozen
      const steered = steerAroundObstacles(state.pos, c.mx, c.mz, 0.55, arenaColliders);
      mx = steered.x; mz = steered.z;
      state.pilotMode = c.mode;
      state.pilotDistance = c.distance;
    }
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
      // Solid arena props block the player (colliders registered by populateArenaProps)
      resolveObstacleCollision(state.pos, 0.55, arenaColliders);
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
    if (state.lastRenderedWeaponStyle !== weaponManager.active.styleKey) {
      state.lastRenderedWeaponStyle = weaponManager.active.styleKey;
      rifle = rebuildWeaponMesh(gunPivot, weaponManager.active.styleKey, steel);
    }

    // Reload (manual R or automatic when magazine hits 0)
    if (held(ctx, ["KeyR", "r", "R"])) {
      if (weaponManager.tryReload()) audioController?.playSfx("reload", { volume: 0.5, pitch: 1.05 });
    }
    weaponManager.updateReload(dt);
    updateOperatorAnimation(soldier, gunPivot, dt, mx !== 0 || mz !== 0, weaponManager.active);

    // Toggle "THE DARKNESS COMES" on demand with [L] key or periodic cycle every 34s
    if (state.menuCooldown <= 0 && held(ctx, ["KeyL", "l", "L"])) {
      state.darknessForced = !state.darknessForced;
      state.menuCooldown = 0.28;
    }
    const darkCfg = TUNING.darkness || { firstWaveAt: 16, cycleSeconds: 32, durationSeconds: 14 };
    const cycleElapsed = beatDirector.runTime - darkCfg.firstWaveAt;
    const periodicDark = cycleElapsed >= 0 && (cycleElapsed % darkCfg.cycleSeconds) < darkCfg.durationSeconds;
    state.darknessWaveActive = Boolean(state.darknessForced || periodicDark || state.blackoutActive);
    const targetDarkness = state.darknessWaveActive ? 1.0 : 0.0;
    state.darknessFactor += (targetDarkness - (state.darknessFactor || 0)) * Math.min(1, dt * 1.8);

    // Apply smooth ambient dimming + gun floodlight & solar aura amplification during Darkness
    const cfg = ARENA_LIGHTING[arenaKey] || ARENA_LIGHTING.perimeter;
    const dimMult = 1 - (state.darknessFactor || 0) * 0.88;
    if (!lightsOff) {
      hemi.intensity = cfg.hemisphere.intensity * dimMult;
      sun.intensity = cfg.sun.intensity * dimMult;
      scene.fog.density = cfg.fog.density * (1 + (state.darknessFactor || 0) * 0.55);
    }
    // LIGHT MODS ARE CARD-GATED: no beam, no lamp housing, no aura until the player owns the card
    // (or is holding a light gun, whose identity *is* the light). Darkness only amplifies what you own.
    const dark = state.darknessFactor || 0;
    const ownsFlood = Boolean(weaponManager.hasFloodlightMod)
      || (typeof isLightGunStyle === "function" && isLightGunStyle(weaponManager.active?.styleKey));
    const floodMult = weaponManager.hasFloodlightMod ? 1.85 : 1.0;
    gunFlashlight.intensity = ownsFlood ? (5.5 + dark * 18.0) * floodMult : 0;
    gunFlashlight.distance = ownsFlood ? (20 + dark * 10) * floodMult : 0;
    gunFlashlight.angle = weaponManager.hasFloodlightMod ? 0.62 : 0.46;
    const beamCone = gunPivot.userData.beamCone;
    if (beamCone) {
      beamCone.visible = ownsFlood;
      if (ownsFlood) {
        beamCone.material.opacity = (0.045 + dark * 0.13) * (weaponManager.hasFloodlightMod ? 1.35 : 1.0);
      }
    }
    const lampBody = gunPivot.getObjectByName?.("tac-lamp-body")
      || gunPivot.children.find((c) => c.userData?.tag === "tac-lamp-body");
    if (lampBody) lampBody.visible = ownsFlood;
    solarAuraLight.intensity = weaponManager.hasSolarAuraMod ? 6.5 + dark * 8.0 : 0;
    if (solarAuraRing) solarAuraRing.visible = Boolean(weaponManager.hasSolarAuraMod) && dark > 0.15;

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

    // Targeting (auto-orient Operator & Gun Floodlight toward nearest threat)
    const target = state.phase === "playing" ? nearest() : null;
    if (target) {
      const targetYaw = Math.atan2(target.mesh.position.x - state.pos.x, target.mesh.position.z - state.pos.z);
      if (mx === 0 && mz === 0) {
        let bodyTurn = targetYaw - state.yaw;
        bodyTurn = Math.atan2(Math.sin(bodyTurn), Math.cos(bodyTurn));
        state.yaw += bodyTurn * Math.min(1, dt * TUNING.player.bodyYawSmoothing);
        soldier.rotation.y = state.yaw;
      }
      let turn = targetYaw - state.yaw;
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

    // ── BOSS WAVE ────────────────────────────────────────────────────────────
    // Later in a run a named boss walks in. It is a real enemy (scaled, tanky) with a HUD callout,
    // and killing it pays talent points. This is the only way to farm points besides finishing runs.
    if (!state.bossSpawned && (beatDirector.runTime > 75 || state.kills >= 18)) {
      state.bossSpawned = true;
      const kind = state.arenaBossKind || (state.kills % 2 === 0 ? "mech" : "gunship");
      const boss = enemyManager.spawn(kind, state.pos, beatDirector.runTime / 60);
      if (boss) {
        boss.hp = Math.round(boss.hp * 2 + 2600);   // hard, but a built cyborg can finish it
        boss.maxHp = boss.hp;
        boss.isBoss = true;
        barks.trigger("boss_spawn");
        // give it the imported animated rig, not just a scaled grunt
        try {
          const bossMesh = buildBossMesh(enemyManager.materials);
          bossMesh.position.set(boss.position.x, 0.9, boss.position.z);
          scene.add(bossMesh);
          if (boss.mesh) { scene.remove(boss.mesh); }
          boss.mesh = bossMesh;
          enemyManager.enemyMeshes.set(boss, bossMesh);
        } catch (e) { /* keep the original mesh if the rig fails */ }
        boss.bossName = kind === "gunship" ? "GUNSHIP OVERSEER" : "FOUNDRY WARDEN";
        state.bossEnemy = boss;
        globalThis.__studio?.hud?.flash("#FFB347", 0.35);
        audioController?.playSfx("launch", { volume: 0.6, pitch: 0.7 });
      }
    }
    // ── BOSS PATTERN ─────────────────────────────────────────────────────────
    // The boss telegraphs, then fires a salvo. Standing still in the open during the telegraph is
    // what kills you; the pilot answers it by breaking off to range.
    if (state.bossEnemy && state.bossEnemy.hp > 0) {
      const b = state.bossEnemy;
      const dist = Math.hypot(b.position.x - state.pos.x, b.position.z - state.pos.z);
      state.bossTimer = (state.bossTimer || 0) + dt;
      if (state.bossTimer > 6) {
        state.bossTimer = 0;
        state.bossWarning = 1.4;              // telegraph window
      }
      if (state.bossWarning > 0) {
        state.bossWarning = Math.max(0, state.bossWarning - dt);
        globalThis.__studio?.hud?.flash("#F2545B", 0.12);
        if (state.bossWarning === 0) {
          // salvo lands: heavy damage in a close band, lighter further out
          const dmg = dist < 8 ? 34 : dist < 14 ? 18 : 6;
          hurt(dmg);
          audioController?.playSfx("kill", { volume: 0.55, pitch: 0.7 });
        }
      }
    } else {
      state.bossWarning = 0;
      state.bossTimer = 0;
    }

    // boss down: pay the run
    if (state.bossEnemy) {
      const stillUp = enemyManager.enemies.includes(state.bossEnemy) && state.bossEnemy.hp > 0;
      if (!stillUp && !state.bossPaid) {
        state.bossPaid = true;
        barks.trigger("boss_kill");
        const prof = state.cyborgProfile || {};
        prof.talentPoints = (prof.talentPoints ?? 0) + 1;
        state.cyborgProfile = saveProfile(prof);
        globalThis.__studio?.hud?.flash("#7CE6A8", 0.4);
        audioController?.playSfx("levelup", { volume: 0.8 });
      }
    }

    updateGrenades(dt);

    // Check for card queue
    if (cardSystem.queuedCards.length > 0 && !state.cardPickWindow) {
      state.currentCardOptions = cardSystem.queuedCards[0];
      state.cardPickWindow = true;
      state.showCards = true;
      cardTray.show(state.currentCardOptions);
    }

    // Camera
    vDesired.set(state.pos.x + Math.sin(state.orbit) * 9, 6.4, state.pos.z + Math.cos(state.orbit) * 9);
    const lerpFactor = 1 - Math.exp(-dt * 5.5);
    camera.position.lerp(vDesired, lerpFactor);
    // keep the camera out of cover: a container swallowing the view reads as a broken game
    const camProbe = { x: camera.position.x, z: camera.position.z };
    if (resolveObstacleCollision(camProbe, 1.6, arenaColliders)) {
      camera.position.x = camProbe.x;
      camera.position.z = camProbe.z;
      camera.position.y = Math.max(camera.position.y, 4.6);
    }
    camera.lookAt(state.pos.x, 1.25, state.pos.z);

    // speech bubble tracks the operator's head in screen space
    const head = new THREE.Vector3(state.pos.x, 2.45, state.pos.z).project(camera);
    if (head.z < 1) {
      barks.place((head.x * 0.5 + 0.5) * globalThis.innerWidth, (-head.y * 0.5 + 0.5) * globalThis.innerHeight);
    }
    barks.update();

    // ARENA CLEAR: surviving past the final beat (the overtime line) rolls a legendary.
    // The run keeps going into overtime; the drop is banked once.
    if (!state.banked) {
      const beats = beatDirector.beats || [];
      const lastStart = beats.length ? beats[beats.length - 1].start : 660;
      if (beatDirector.runTime >= lastStart + 60) {
        state.banked = true;
        state.arenaCleared = true;
        const drop = bankRun(true);
        if (drop && drop.legendary) {
          globalThis.__studio?.hud?.flash("#a6ff7a", 0.4);
        }
      }
    }

    // Check death — this is the run's end, so the profile banks here
    if (state.health <= 0) {
      state.phase = "results";
  barks.trigger(state.health <= 0 ? "died" : "clear_dead");
      state.showResults = true;
      audioController?.playSfx("death", { volume: 0.8 });
      if (!state.banked) { state.banked = true; bankRun(false); }
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

  // Tracers & Travelling Light-Orb Bullets
  let activeOrbLights = 0;
  const darkBoost = Math.max(state.darknessFactor || 0, state.blackoutActive ? 1 : 0);
  for (const tracer of tracers) {
    if (tracer.life <= 0) continue;
    tracer.life -= dt;
    if (tracer.life <= 0) {
      tracer.mesh.visible = false;
      if (tracer.orb) tracer.orb.visible = false;
      continue;
    }
    const progress = 1 - tracer.life / Math.max(0.01, tracer.maxLife || 0.12);
    if (tracer.orb) {
      tracer.orb.position.lerpVectors(tracer.start, tracer.end, Math.min(1, progress));
      if (activeOrbLights < orbLights.length) {
        const pt = orbLights[activeOrbLights++];
        pt.position.copy(tracer.orb.position);
        pt.position.y = Math.max(0.6, pt.position.y);
        pt.color.setHex(tracer.color || 0xffd57a);
        pt.intensity = (3.8 + darkBoost * 11.5) * (weaponManager.hasLightOrbMod ? 1.65 : 1.0);
        pt.distance = (10 + darkBoost * 7) * (weaponManager.hasLightOrbMod ? 1.4 : 1.0);
        pt.visible = true;
      }
    }
  }
  for (let i = activeOrbLights; i < orbLights.length; i++) {
    orbLights[i].visible = false;
    orbLights[i].intensity = 0;
  }
  if (state.flash > 0) {
    state.flash -= dt;
    if (state.flash <= 0) flash.visible = false;
  }

  updateEnvironment(dt);

  syncHud();
}

function pickCard(index) {
  if (!state.currentCardOptions) return;
  const option = cardSystem.pickCard(index);
  if (!option) return;

  state.cardPickWindow = false;
  state.showCards = false;
  state.currentCardOptions = null;
  cardTray.hide();
  state.cardsPlayed = (state.cardsPlayed || 0) + 1;
  audioController?.playSfx("click", { volume: 0.5, pitch: 1.15 });
  barks.trigger("upgrade");

  if (option.type === "weapon") {
    const inactiveSlot = weaponManager.activeSlot === "primary" ? "secondary" : "primary";
    weaponManager.replaceWeapon(inactiveSlot, option.style);
  } else if (option.type === "part") {
    weaponManager.applyPart(weaponManager.activeSlot, option.part);
  }
  weaponManager.syncReloadMeta(cardSystem.level, weaponManager.reloadUpgradesCount);

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

const studioApi = installStudio({
  canvas: renderer.domElement,
  scene,
  renderer,
  camera,
  reset,
  update,
  begin: startRun,
  flow: () => (state.phase === "playing" ? FlowPhase.Playing : state.phase === "dead" || state.phase === "results" ? FlowPhase.Results : FlowPhase.Menu),
  player: () => ({ x: state.pos.x, y: 0, z: state.pos.z, yaw: state.yaw }),
  probes: () => ({
    health: state.health,
    kills: state.kills,
    enemies: enemyManager.getCount(),
    phase: state.phase,
    score: scoreSystem.getCurrentScore(beatDirector.runTime),
    multiplier: scoreSystem.getMultiplier(),
    skin: PLAYER_SKINS[state.skinIndex || 0]?.id || "olive",
    loadout: STARTER_LOADOUTS[state.loadoutIndex || 0]?.id || "spray",
    magazine: weaponManager.active.magazine,
    isReloading: weaponManager.active.isReloading,
    reloadSpeed: weaponManager.active.reloadSpeedMultiplier,
  }),
  cameras: { default: placeCamera },
  render() {
    renderer.render(scene, camera);
  },
});