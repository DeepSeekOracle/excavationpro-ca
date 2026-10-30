import * as THREE from "three";
import { FlowPhase, installStudio, makeRng } from "./studio.js?v=202610326u";
import { standardMaterial } from "./materials.js?v=202610326u";
import { makeBush, makeLog, makeTree, swayTree } from "./foliage.js?v=202610326u";
import { generateWeaponIconAtlas, getWeaponIconUV, createWeaponIconMesh, STYLE_ICON_INDEX, generateWeaponIconDataUrls, loadWeaponIconSheetDataUrls } from "./icons.js?v=202610326u";
import {
  PALETTE,
  TYPE_SCALE,
  HUD_ICONOGRAPHY,
  MATERIAL_RECIPES,
  ARENA_BY_BEAT,
  ARENA_LIGHTING,
  POINT_LIGHT_SCALE,
  hexInt,
} from "./theme.js?v=202610326u";
import { TUNING } from "./tuning.js?v=202610326u";
import { spawnDamageNumber, updateDamageNumbers, clearDamageNumbers } from "./damageNumbers.js?v=202610326u";
import { WeaponManager, CardSystem, Weapon, STYLE_VFX, GRENADE_STYLES } from "./weapons.js?v=202610326u";
import { createCardTray } from "./cardsui.js?v=202610326u";
import { buildBrandProps } from "./branding.js?v=202610326u";
import { createSummary } from "./summaryui.js?v=202610326u";
import { createBarks } from "./barks.js?v=202610326u";
import { EnemyManager, ENEMY_TYPES } from "./enemies.js?v=202610326u";
import { BeatDirector, ScoreSystem, ResultsScreen } from "./director.js?v=202610326u";
import { bossHp } from "./balance.js?v=202610326u";
import { loadSave, saveSave, updateBestScore, updateBestTime, getSettings, updateSettings, DEFAULT_SAVE, addProfileXp, grantLegacy, saveProfile } from "./save.js?v=202610326u";
import { pilot } from "./autopilot.js?v=202610326u";
import { createManager, statsForLevel, applyStatsToRun, LIGHT_MODS, PERKS } from "./manager.js?v=202610326u";
import { createStartMenu } from "./startmenu.js?v=202610326u";
import { createGamepad } from "./gamepad.js?v=202610326u";
import { createTalentWindow } from "./talentui.js?v=202610326u";
import { aggregate, toRunMods } from "./talents.js?v=202610326u";
import { bakeProceduralArtSprites, PROCEDURAL_ART_MODULES } from "./art/index.js?v=202610326u";
import {
  PLAYER_SKINS,
  STARTER_LOADOUTS,
  isLightGunStyle,
  buildOperatorRig,
  updateOperatorAnimation,
  rebuildWeaponMesh,
  createEnemyMaterialBank,
  buildEnemyMesh,
  populateArenaProps,
  arenaColliders,
  resolveObstacleCollision,
  steerAroundObstacles,
  buildBossMesh,
  segmentHitsCollider,
  warmGlbAssets,
  setWeaponAnchor as setWeaponAnchorModel,
} from "./models.js?v=202610326u";
import * as levelModule from "./level.js?v=202610326u";
import * as menuModule from "./menu.js?v=202610326u";
import * as audioModule from "./audio.js?v=202610326u";
import * as fxModule from "./fx.js?v=202610326u";
import { MAPS, mapById, selectMap } from "./maps.js?v=202610326u";
import { PICKUP_DEFS, planPickupSites, choosePickup, speedMultiplier, powerMultiplier, HEALTH_SPACING } from "./pickups.js?v=202610326u";

// D3: one readable build stamp, so a stale module in the console is obvious.
const BUILD = new URL(import.meta.url).searchParams.get("v") || "dev";
window.__forgeBuild = BUILD;
console.info("[forge] BUILD " + BUILD);
import { createCasings } from "./casings.js?v=202610326u";
import { feelFor, kickImpulse, tracerTaper } from "./stylefeel.js?v=202610326u";

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

/** HUD vertical slots (fraction of viewport height): one block lays out every overlay. */
const HUD_SLOTS = {
  weaponActive: 0.045,
  title: 0.072,
  bossLabel: 0.110,
  bossBar: 0.132,
  statusBanner: 0.196,
};

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

// ── IMAGE-BASED LIGHTING ──────────────────────────────────────────────────────────────────────
// A MeshStandardMaterial with metalness > 0.5 and no environment map has nothing to reflect, so
// every steel surface in the game rendered black: the operator's rifle, enemy armour, the prop
// gantries. That is why the gun "wasn't there" and why a lit arena still read as a void. A tiny
// procedural equirect (sky / warm horizon / ground + six arena lanterns) is pre-filtered once at
// boot and becomes the scene environment; it costs one texture and zero draw calls.
function buildEnvironmentMap(rendererRef) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  const sky = g.createLinearGradient(0, 0, 0, 128);
  sky.addColorStop(0.0, "#2a3c52");
  sky.addColorStop(0.38, "#4a5566");
  sky.addColorStop(0.50, "#8a7b64");
  sky.addColorStop(0.56, "#41382d");
  sky.addColorStop(0.75, "#1b1a1a");
  sky.addColorStop(1.0, "#0a0b0d");
  g.fillStyle = sky;
  g.fillRect(0, 0, 256, 128);
  // arena lanterns along the horizon: small bright sources for specular highlights
  for (let i = 0; i < 6; i += 1) {
    const x = 18 + i * 42;
    const lamp = g.createRadialGradient(x, 58, 0, x, 58, 22);
    lamp.addColorStop(0, "rgba(255,232,182,0.95)");
    lamp.addColorStop(0.4, "rgba(255,210,140,0.35)");
    lamp.addColorStop(1, "rgba(255,210,140,0)");
    g.fillStyle = lamp;
    g.fillRect(x - 22, 36, 44, 44);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(rendererRef);
  pmrem.compileEquirectangularShader();
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}
scene.environment = buildEnvironmentMap(renderer);
const ENV_INTENSITY = 0.6;
scene.environmentIntensity = ENV_INTENSITY;

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

// ── ARENA PERIMETER ──────────────────────────────────────────────────────────────────────────
// The play space used to be a 108 m-wide plane fading into fog: the fighter stood in an empty
// parking lot and enemies 20 m out were invisible. A walled ring at 34 m plus four light towers
// gives the arena an edge, a horizon and something for the broadcast camera to frame. Two
// InstancedMeshes for the wall and its light strip keep it at four draw calls.
function buildArenaRing() {
  const group = new THREE.Group();
  group.userData.tag = "arena-ring";
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x39424c, metalness: 0.42, roughness: 0.68, envMapIntensity: 0.9,
    emissive: 0x0e1216, emissiveIntensity: 0.55,
  });
  const stripMat = new THREE.MeshStandardMaterial({
    color: 0x14262b, emissive: 0xffb347, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.2,
  });
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x3a3f45, metalness: 0.6, roughness: 0.45 });
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xfff0cf, emissive: 0xffd9a0, emissiveIntensity: 2.6, roughness: 0.3,
  });
  const N = 30;
  const R = (TUNING.player.arenaRadius || 54) + 2.5;
  const H = 8.0;
  const W = ((2 * Math.PI * R) / N) * 1.04;
  const dummy = new THREE.Object3D();
  const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(W, H, 0.8), wallMat, N);
  const strip = new THREE.InstancedMesh(new THREE.BoxGeometry(W * 0.9, 0.14, 0.2), stripMat, N);
  const rail = new THREE.InstancedMesh(new THREE.BoxGeometry(W * 0.98, 0.22, 0.28), stripMat, N);
  const inner = R - 0.45;
  for (let i = 0; i < N; i += 1) {
    const a = (i / N) * TAU;
    dummy.position.set(Math.cos(a) * R, H / 2, Math.sin(a) * R);
    dummy.rotation.set(0, a - Math.PI / 2, 0);
    dummy.updateMatrix();
    wall.setMatrixAt(i, dummy.matrix);
    // strips sit on the INNER face; at the wall's centre line they were buried inside it
    dummy.position.set(Math.cos(a) * inner, H - 0.5, Math.sin(a) * inner);
    dummy.updateMatrix();
    strip.setMatrixAt(i, dummy.matrix);
    dummy.position.set(Math.cos(a) * inner, 1.55, Math.sin(a) * inner);
    dummy.updateMatrix();
    rail.setMatrixAt(i, dummy.matrix);
  }
  rail.instanceMatrix.needsUpdate = true;
  rail.userData.tag = "arena-wall-rail";
  wall.instanceMatrix.needsUpdate = true;
  strip.instanceMatrix.needsUpdate = true;
  rail.instanceMatrix.needsUpdate = true;
  wall.userData.tag = "arena-wall";
  strip.userData.tag = "arena-wall-strip";
  group.add(wall, strip, rail);

  // four corner light towers with an emissive lamp head
  const poleGeo = new THREE.CylinderGeometry(0.16, 0.26, 11.5, 8);
  const headGeo = new THREE.BoxGeometry(2.4, 0.7, 0.9);
  for (let i = 0; i < 4; i += 1) {
    const a = Math.PI / 4 + (i / 4) * TAU;
    const x = Math.cos(a) * (R - 4.5);
    const z = Math.sin(a) * (R - 4.5);
    const pole = new THREE.Mesh(poleGeo, towerMat);
    pole.position.set(x, 5.75, z);
    const head = new THREE.Mesh(headGeo, lampMat);
    head.position.set(x, 11.3, z);
    head.rotation.y = -a;
    pole.userData.tag = "light-tower";
    head.userData.tag = "light-tower-head";
    group.add(pole, head);
  }
  scene.add(group);
  return group;
}
const arenaRing = buildArenaRing();

// ── SKY DOME ────────────────────────────────────────────────────────────────────────────────
// Above the perimeter wall the frame was flat black, which is what made the edge read as a void.
// A two-colour vertical gradient on a back-side sphere costs one draw call and gives the arena a
// horizon. The colours follow the active lighting preset.
const skyUniforms = {
  top: { value: new THREE.Color(0x0a0d12) },
  horizon: { value: new THREE.Color(0x2a2f38) },
};
const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(170, 24, 14),
  new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 top;
      uniform vec3 horizon;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y * 1.15 + 0.06, 0.0, 1.0);
        vec3 c = mix(horizon, top, pow(h, 0.62));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  }),
);
skyDome.renderOrder = -2;
skyDome.frustumCulled = false;
scene.add(skyDome);

const trees = [];
const sharedBarkMat = standardMaterial({ ...MATERIAL_RECIPES.bark, size: TEX_SIZE });
const sharedLeafMat = standardMaterial({ ...MATERIAL_RECIPES.leaf, size: TEX_SIZE });
const sharedBushMat = standardMaterial({ ...MATERIAL_RECIPES.bush, size: TEX_SIZE });
// a faint emissive keeps low bushes readable in the dark instead of reading as black shards
sharedBushMat.emissive = new THREE.Color(0x101c0c);
sharedBushMat.emissiveIntensity = 0.55;

for (let i = 0; i < TREE_COUNT; i++) {
  const a = worldRng() * TAU, r = 26 + worldRng() * 24; // keep trunks out of the fighting ring: a tree at r=10 put the camera inside a leaf card
  const tree = makeTree({ height: 5.5 + worldRng() * 3.5, spread: 2.7 + worldRng() * 1.5, seed: 20 + i, cards: TREE_CARDS, bark: sharedBarkMat, leaf: sharedLeafMat, texSize: TEX_SIZE });
  tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  tree.rotation.y = worldRng() * TAU;
  scene.add(tree);
  trees.push(tree);
}
// Shrubs are low-poly clumps, not single leaf cards: a flat card read as a black shard at ground level.
for (let i = 0; i < BUSH_COUNT; i++) {
  const a = worldRng() * TAU, r = 12 + worldRng() * 28;
  const clump = new THREE.Group();
  const parts = 2 + Math.floor(worldRng() * 3);
  for (let k = 0; k < parts; k += 1) {
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45 + worldRng() * 0.45, 0), sharedBushMat);
    blob.position.set((worldRng() - 0.5) * 0.9, 0.28 + worldRng() * 0.25, (worldRng() - 0.5) * 0.9);
    blob.scale.set(1, 0.62 + worldRng() * 0.2, 1);
    blob.castShadow = true;
    clump.add(blob);
  }
  clump.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  clump.rotation.y = worldRng() * TAU;
  scene.add(clump);
}
for (let i = 0; i < LOG_COUNT; i++) {
  const a = worldRng() * TAU, r = 12 + worldRng() * 20;
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
let lastDmgFrame = 0;
const fxController = typeof fxModule?.createFx === "function" ? fxModule.createFx(renderer.domElement) : null;
const casings = createCasings(scene);
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
// Contact shadow + cyan rim light: without them the operator reads as a floating low-poly blob.
const playerShadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.74, 28),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.36, depthWrite: false })
);
playerShadow.rotation.x = -Math.PI / 2;
playerShadow.position.y = 0.02;
playerShadow.renderOrder = 1;
scene.add(playerShadow);
const playerRim = new THREE.PointLight(0x6fe3ff, 2.4, 8.5, 2);
playerRim.position.set(0, 2.35, -1.45);
soldier.add(playerRim);
const steel = standardMaterial({ ...MATERIAL_RECIPES.playerSteel, size: TEX_SIZE });
const gunPivot = new THREE.Group();
gunPivot.position.set(-0.2, 1.42, 0.3);

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
// A soft, shadowless fill riding with the operator: in a dark wave the key light can sit outside a
// shadowed pocket and the torso reads as missing ("invisible from the waist up" on BREACH YARD).
const operatorFill = new THREE.PointLight(0xfff0d6, 3.2, 7, 2);
operatorFill.position.set(0, 1.35, 0.85);
operatorFill.userData.tag = "operator-fill";
soldier.add(operatorFill);
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
  new THREE.RingGeometry(0.86, 1.02, 32),
  new THREE.MeshBasicMaterial({ color: 0x8fe6ff, side: THREE.DoubleSide, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false }),
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

// ── enemy fire (visible bolts with travel time) ────────────────────────────────────────────────
// Enemy shots used to be instant damage rolls with no visual. They are now real projectiles: a
// muzzle flash at the shooter, a bolt in flight, a recoil pose, and a dodge window for the pilot.
const ENEMY_SHOT_CAP = 40;
const enemyShots = [];
const enemyMuzzles = [];
{
  const shotGeo = new THREE.BoxGeometry(0.05, 0.05, 1.0);
  const flashGeo = new THREE.SphereGeometry(0.17, 8, 8);
  for (let i = 0; i < ENEMY_SHOT_CAP; i += 1) {
    const mesh = new THREE.Mesh(shotGeo, new THREE.MeshBasicMaterial({
      color: 0xff7a4a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    mesh.visible = false;
    scene.add(mesh);
    enemyShots.push({ mesh, alive: false, vx: 0, vy: 0, vz: 0, dmg: 0, life: 0, x: 0, y: 0, z: 0 });
    const flash = new THREE.Mesh(flashGeo, new THREE.MeshBasicMaterial({
      color: 0xffd08a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    flash.visible = false;
    scene.add(flash);
    enemyMuzzles.push({ mesh: flash, life: 0 });
  }
}
let enemyShotCursor = 0;
let enemyMuzzleCursor = 0;

function spawnEnemyShot(enemy, damage, speed = 16, color = 0xff7a4a, sniper = false) {
  if (!enemy || !enemy.position) return;
  const slot = enemyShots[enemyShotCursor % enemyShots.length];
  enemyShotCursor += 1;
  const ox = enemy.position.x;
  const oz = enemy.position.z;
  const oy = (enemy.mesh ? enemy.mesh.position.y : enemy.position.y) + 0.35;
  // aim at where the player is, with a small lead and spread (a perfect aimbot is not dodgeable)
  const lead = 0.22;
  const tx = state.pos.x + (state.moveVel ? state.moveVel.x * lead : 0);
  const tz = state.pos.z + (state.moveVel ? state.moveVel.z * lead : 0);
  let dx = tx - ox;
  let dz = tz - oz;
  const len = Math.hypot(dx, dz) || 1;
  dx /= len; dz /= len;
  const spread = state.painted ? 0.022 : 0.055;
  const ang = (state.rng() - 0.5) * spread * 2;
  const ca = Math.cos(ang); const sa = Math.sin(ang);
  const nx = dx * ca - dz * sa;
  const nz = dx * sa + dz * ca;
  slot.alive = true;
  slot.x = ox + nx * 0.55;
  slot.y = oy;
  slot.z = oz + nz * 0.55;
  slot.vx = nx * speed;
  slot.vy = (1.15 - slot.y) / Math.max(0.15, len / speed);
  slot.vz = nz * speed;
  slot.dmg = Math.round(damage * (state.painted ? 1.15 : 1));
  // not every bolt is readable: a share of them arrive too fast / off-line to react to
  slot.dodgeable = state.rng() < 0.7;
  slot.sniper = Boolean(sniper);
  slot.life = 1.6 + len / speed;
  slot.mesh.position.set(slot.x, slot.y, slot.z);
  slot.mesh.lookAt(slot.x + nx, slot.y, slot.z + nz);
  slot.mesh.scale.set(1, 1, 0.6 + speed * 0.05);
  slot.mesh.material.color.setHex(color);
  slot.mesh.visible = true;

  const muzzle = enemyMuzzles[enemyMuzzleCursor % enemyMuzzles.length];
  enemyMuzzleCursor += 1;
  muzzle.mesh.position.set(slot.x, slot.y, slot.z);
  muzzle.mesh.material.color.setHex(color);
  muzzle.mesh.visible = true;
  muzzle.life = 0.06;
  if (enemy.mesh) enemy.mesh.visible = true;
  enemy._recoil = 0.2;
  state.enemyShotsFired = (state.enemyShotsFired || 0) + 1;
}

/** Advance bolts, apply hits, and publish the nearest incoming threat for the pilot. */
function updateEnemyShots(dt) {
  let threat = null;
  let bestT = 0.8;
  for (const s of enemyShots) {
    if (!s.alive) continue;
    s.life -= dt;
    const px = s.x;
    const pz = s.z;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.z += s.vz * dt;
    s.mesh.position.set(s.x, s.y, s.z);
    if (s.life <= 0) {
      s.alive = false;
      s.mesh.visible = false;
      continue;
    }
    // cover stops bolts
    if (segmentHitsCollider(px, pz, s.x, s.z, arenaColliders)) {
      s.alive = false;
      s.mesh.visible = false;
      continue;
    }
    // hit test against the operator capsule
    const d2 = Math.hypot(s.x - state.pos.x, s.z - state.pos.z);
    if (d2 < 0.55 && s.y > 0.3 && s.y < 2.1) {
      hurt(s.dmg);
      state.enemyShotsHit = (state.enemyShotsHit || 0) + 1;
      // a connected SPOTTER round is what paints the operator (the mark used to be free on every
      // shot, which kept the +15 % debuff up for most of the run)
      if (s.sniper) {
        state.painted = true;
        state.paintedTimer = 5;
        globalThis.__studio?.hud?.flash("#ff6fd6", 0.2);
      }
      s.alive = false;
      s.mesh.visible = false;
      globalThis.__studio?.hud?.flash("#ff5a4a", 0.14);
      continue;
    }
    // threat estimate: time to closest approach and miss distance at that moment
    // R points from the player to the bolt; closest approach t = -(R.v)/|v|^2.
    // (The old order flipped the sign, so an approaching bolt never registered as a threat.)
    const rx = s.x - state.pos.x;
    const rz = s.z - state.pos.z;
    const v2 = s.vx * s.vx + s.vz * s.vz;
    if (v2 < 1e-4) continue;
    const t = -(rx * s.vx + rz * s.vz) / v2;
    if (s.dodgeable === false) continue;
    if (t > 0 && t < bestT) {
      const cx = rx + s.vx * t;
      const cz = rz + s.vz * t;
      const miss = Math.hypot(cx, cz);
      if (miss < 1.3) {
        // step perpendicular to the bolt, to the side the player is already on
        const inv = 1 / Math.sqrt(v2);
        const perpX = -s.vz * inv;
        const perpZ = s.vx * inv;
        const side = (rx * perpX + rz * perpZ) >= 0 ? -1 : 1;
        threat = { x: perpX * side, z: perpZ * side, t };
        bestT = t;
      }
    }
  }
  state.incomingShot = threat;
  if (threat) state.incomingFrames = (state.incomingFrames || 0) + 1;
  for (const m of enemyMuzzles) {
    if (m.life <= 0) { m.mesh.visible = false; continue; }
    m.life -= dt;
    if (m.life <= 0) m.mesh.visible = false;
  }
}

function clearEnemyShots() {
  for (const s of enemyShots) { s.alive = false; s.mesh.visible = false; }
  for (const m of enemyMuzzles) { m.life = 0; m.mesh.visible = false; }
  state.incomingShot = null;
}

// ── ground pickups (health regen, speed, power) ─────────────────────────────────────────────────
// Auto-apply on touch, stack, respawn 60 s after being taken. Health sites are 68 m apart so a
// base-speed operator cannot chain them within the 10 s regen window; a speed buff closes that.
const pickupGroup = new THREE.Group();
scene.add(pickupGroup);
const pickupItems = [];
const pickupCoreGeo = new THREE.IcosahedronGeometry(0.26, 0);
const pickupRingGeo = new THREE.RingGeometry(0.52, 0.64, 24);

function blockedAt(x, z) {
  const probe = { x, z };
  resolveObstacleCollision(probe, 0.9, arenaColliders);
  return Math.hypot(probe.x - x, probe.z - z) > 0.01;
}

function buildPickup(site, rng) {
  const def = PICKUP_DEFS[site.type];
  // unlit core: a health pickup must read green at a glance, not pick up the arena's amber light
  const core = new THREE.Mesh(pickupCoreGeo, new THREE.MeshBasicMaterial({ color: def.color }));
  const ring = new THREE.Mesh(pickupRingGeo, new THREE.MeshBasicMaterial({
    color: def.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false,
  }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.7;
  const grp = new THREE.Group();
  grp.add(core, ring);
  grp.position.set(site.x, 0.85, site.z);
  pickupGroup.add(grp);
  return { type: site.type, x: site.x, z: site.z, mesh: grp, core, ring, alive: true, respawnAt: 0, phase: rng() * 6.28 };
}

function resetPickups() {
  while (pickupGroup.children.length) pickupGroup.remove(pickupGroup.children[0]);
  pickupItems.length = 0;
  const sites = planPickupSites({ rng: state.rng, blocked: blockedAt });
  for (const site of sites) pickupItems.push(buildPickup(site, state.rng));
  state.pickups = pickupItems;
  state.regenTicks = [];
  state.speedStacks = [];
  state.powerStacks = [];
  state.speedMult = 1;
  state.powerMult = 1;
  state.pickupGoal = null;
}

function respawnPickup(item) {
  const rng = state.rng;
  let spot = null;
  for (let attempt = 0; attempt < 30 && !spot; attempt += 1) {
    let x = null;
    let z = null;
    if (item.type === "health") {
      // opposite the other health site, jittered: keeps the 64-80 m gap intact
      const other = pickupItems.find((p) => p !== item && p.type === "health");
      if (other) {
        const a = Math.atan2(other.z, other.x) + Math.PI + (rng() - 0.5) * 0.16;
        x = Math.cos(a) * HEALTH_SPACING.radius;
        z = Math.sin(a) * HEALTH_SPACING.radius;
      }
    }
    if (x === null) {
      const a = rng() * Math.PI * 2;
      const r = 18 + rng() * 22;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
    }
    if (blockedAt(x, z)) continue;
    const crowded = pickupItems.some((p) => p !== item && p.alive && Math.hypot(p.x - x, p.z - z) < 16);
    if (crowded) continue;
    spot = { x, z };
  }
  if (!spot) spot = { x: 0, z: 0 };
  item.x = spot.x;
  item.z = spot.z;
  item.mesh.position.set(spot.x, 0.85, spot.z);
  item.alive = true;
  item.mesh.visible = true;
  item.respawnAt = 0;
}

function collectPickup(item) {
  const def = PICKUP_DEFS[item.type];
  if (item.type === "health") {
    state.regenTicks.push({ rate: (state.maxHealth * def.regen) / def.seconds, remaining: def.seconds });
  } else if (item.type === "speed") {
    state.speedStacks.push({ remaining: def.seconds });
  } else {
    state.powerStacks.push({ remaining: def.seconds });
  }
  state.pickupsTaken = (state.pickupsTaken || 0) + 1;
  // Detour, not a treadmill: after taking an item the pilot returns to the fight for a while.
  state.pickupCooldown = item.type === "health" ? 4 : 9;
  item.alive = false;
  item.mesh.visible = false;
  item.respawnAt = beatDirector.runTime + 60;
  audioController?.playSfx("pickup", { volume: 0.5 });
  globalThis.__studio?.hud?.flash(item.type === "health" ? "#7CE6A8" : "#6FE3FF", 0.12);
}

function updatePickups(dt) {
  const t = beatDirector.runTime;
  for (const item of pickupItems) {
    if (!item.alive) {
      if (t >= item.respawnAt) respawnPickup(item);
      continue;
    }
    item.mesh.rotation.y += dt * 1.5;
    item.mesh.position.y = 0.85 + Math.sin(t * 2.2 + item.phase) * 0.1;
    if (Math.hypot(item.x - state.pos.x, item.z - state.pos.z) < 1.15) collectPickup(item);
  }
  for (const tick of state.regenTicks) {
    tick.remaining -= dt;
    state.health = Math.min(state.maxHealth, state.health + tick.rate * dt);
  }
  state.regenTicks = state.regenTicks.filter((tick) => tick.remaining > 0);
  for (const s of state.speedStacks) s.remaining -= dt;
  for (const s of state.powerStacks) s.remaining -= dt;
  state.speedStacks = state.speedStacks.filter((s) => s.remaining > 0);
  state.powerStacks = state.powerStacks.filter((s) => s.remaining > 0);
  state.speedMult = speedMultiplier(state.speedStacks.length);
  state.powerMult = powerMultiplier(state.powerStacks.length);
  state.pickupCooldown = Math.max(0, (state.pickupCooldown || 0) - dt);
  state.pickupGoal = choosePickup(pickupItems, state.health / Math.max(1, state.maxHealth), { x: state.pos.x, z: state.pos.z, needHealthAt: 0.55 });
}



scene.add(soldier);

const arenaPropsGroup = new THREE.Group();
arenaPropsGroup.userData.tag = "arena-props";
scene.add(arenaPropsGroup);

// Ground detail: wet patches and tyre scars. No colliders - this is paint on the floor, and the
// flat arena was the biggest "cheap" read in the visual pass.
const groundDetailGroup = new THREE.Group();
groundDetailGroup.userData.tag = "ground-detail";
scene.add(groundDetailGroup);
// unlit and faint: a dark standard puddle read as a hole in the floor
const groundPuddleMat = new THREE.MeshBasicMaterial({
  color: 0x2a3d4f, transparent: true, opacity: 0.22, depthWrite: false,
});
const groundTyreMat = new THREE.MeshBasicMaterial({ color: 0x070c12, transparent: true, opacity: 0.55, depthWrite: false });
function buildGroundDetail() {
  while (groundDetailGroup.children.length) groundDetailGroup.remove(groundDetailGroup.children[0]);
  for (let i = 0; i < 12; i += 1) {
    const a = worldRng() * TAU;
    const r = 7 + worldRng() * 27;
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.35 + worldRng() * 0.6, 18), groundPuddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.rotation.z = worldRng() * Math.PI;
    puddle.scale.x = 1.4 + worldRng() * 0.9;
    puddle.position.set(Math.cos(a) * r, 0.015, Math.sin(a) * r);
    groundDetailGroup.add(puddle);
  }
  for (let i = 0; i < 7; i += 1) {
    const a = worldRng() * TAU;
    const r = 10 + worldRng() * 18;
    const cx = Math.cos(a) * r;
    const cz = Math.sin(a) * r;
    const len = 3 + worldRng() * 5;
    const ang = worldRng() * Math.PI;
    for (const side of [-0.42, 0.42]) {
      const scar = new THREE.Mesh(new THREE.PlaneGeometry(0.24, len), groundTyreMat);
      scar.rotation.x = -Math.PI / 2;
      scar.rotation.z = ang;
      scar.position.set(cx + Math.cos(ang + Math.PI / 2) * side, 0.012, cz + Math.sin(ang + Math.PI / 2) * side);
      groundDetailGroup.add(scar);
    }
  }

  // Cargo stencils painted on the floor beside the containers: the flat ground read as untextured.
  const texts = ["LYGO CARGO", "EXCAVATIONPRO.CA", "HANDLE WITH CARE", "EX-07", "LYGO"];
  const cache = new Map();
  const stencilTexture = (label) => {
    if (cache.has(label)) return cache.get(label);
    const c = document.createElement("canvas");
    c.width = 256; c.height = 128;
    const g = c.getContext("2d");
    g.clearRect(0, 0, 256, 128);
    g.strokeStyle = "rgba(255,179,71,0.85)";
    g.lineWidth = 5;
    g.strokeRect(6, 6, 244, 116);
    g.fillStyle = "rgba(255,214,120,0.92)";
    g.font = "800 30px ui-monospace, Consolas, monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, 128, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    cache.set(label, tex);
    return tex;
  };
  const props = (activeMap && activeMap.props) || [];
  props.forEach((prop, i) => {
    if (prop.kind !== "container" && prop.kind !== "barrier" && prop.kind !== "milk-truck") return;
    const len = Math.hypot(prop.x, prop.z) || 1;
    const outX = prop.x / len;
    const outZ = prop.z / len;
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3),
      new THREE.MeshBasicMaterial({ map: stencilTexture(texts[i % texts.length]), transparent: true,
        opacity: 0.78, depthWrite: false }));
    decal.rotation.x = -Math.PI / 2;
    decal.rotation.z = Math.atan2(outX, outZ) + Math.PI / 2;
    decal.position.set(prop.x + outX * 3.4, 0.02, prop.z + outZ * 3.4);
    groundDetailGroup.add(decal);
  });
}

// Enemy feet rings: a red ground ring makes hostiles readable at range without touching their rigs.
const enemyRings = [];
{
  const ringGeo = new THREE.RingGeometry(0.52, 0.68, 28);
  for (let i = 0; i < 24; i += 1) {
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: 0xf2545b, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    ring.visible = false;
    scene.add(ring);
    enemyRings.push(ring);
  }
}
// Foot dust: pooled soft discs that rise and fade behind a running operator.
const dustPool = [];
{
  const dustGeo = new THREE.CircleGeometry(0.26, 10);
  for (let i = 0; i < 18; i += 1) {
    const mesh = new THREE.Mesh(dustGeo, new THREE.MeshBasicMaterial({
      color: 0x9c8a6c, transparent: true, opacity: 0, depthWrite: false,
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    scene.add(mesh);
    dustPool.push({ mesh, life: 0 });
  }
}
let dustCursor = 0;
let dustTimer = 0;
function spawnDust(x, z) {
  const slot = dustPool[dustCursor % dustPool.length];
  dustCursor += 1;
  slot.life = 0.5;
  slot.mesh.visible = true;
  slot.mesh.position.set(x + (state.rng() - 0.5) * 0.25, 0.05, z + (state.rng() - 0.5) * 0.25);
  slot.mesh.scale.setScalar(0.7 + state.rng() * 0.6);
  slot.mesh.material.opacity = 0.32;
}
function updateDust(dt) {
  for (const d of dustPool) {
    if (d.life <= 0) continue;
    d.life -= dt;
    if (d.life <= 0) { d.mesh.visible = false; continue; }
    d.mesh.position.y += dt * 0.35;
    d.mesh.scale.multiplyScalar(1 + dt * 1.6);
    d.mesh.material.opacity = Math.max(0, d.life * 0.6);
  }
}

function updateEnemyRings() {
  const list = enemyManager.getEnemies();
  for (let i = 0; i < enemyRings.length; i += 1) {
    const e = list[i];
    if (!e || !e.position || e.hp <= 0) { enemyRings[i].visible = false; continue; }
    enemyRings[i].visible = e.position.y < 2.2;
    enemyRings[i].position.set(e.position.x, 0.03, e.position.z);
  }
}
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
    dir: new THREE.Vector3(),
    len: 0,
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
// ── IMPACT SPARKS ────────────────────────────────────────────────────────────────────────────
// A hit used to register only as a floating number: no spark, no flash, nothing on the body.
// A small pool of additive points at the impact makes every shot land.
const impactSparks = [];
{
  const sparkGeo = new THREE.SphereGeometry(0.028, 6, 6);
  for (let i = 0; i < 28; i += 1) {
    const mesh = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({
      color: 0xffd57a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    mesh.visible = false;
    mesh.userData.tag = "impact-spark";
    scene.add(mesh);
    impactSparks.push({ mesh, life: 0, maxLife: 0.2, vx: 0, vy: 0, vz: 0, size: 1 });
  }
}
let impactCursor = 0;
function spawnImpact(x, y, z, color = 0xffd57a, count = 4, power = 1) {
  state.impactsSpawned = (state.impactsSpawned || 0) + count;
  for (let i = 0; i < count; i += 1) {
    const s0 = impactSparks[impactCursor % impactSparks.length];
    impactCursor += 1;
    const a = state.rng() * TAU;
    const up = 0.4 + state.rng() * 1.6;
    const sp = (1.6 + state.rng() * 2.6) * power;
    // start each spark at a slightly different point, or a burst is one white blob
    s0.mesh.position.set(
      x + (state.rng() - 0.5) * 0.18 * power,
      y + (state.rng() - 0.5) * 0.18 * power,
      z + (state.rng() - 0.5) * 0.18 * power,
    );
    s0.mesh.material.color.setHex(color);
    s0.mesh.material.opacity = 0.62;
    s0.mesh.visible = true;
    s0.life = 0.16 + state.rng() * 0.14;
    s0.maxLife = s0.life;
    s0.vx = Math.cos(a) * sp;
    s0.vz = Math.sin(a) * sp;
    s0.vy = up * power;
    s0.size = (0.55 + state.rng() * 0.55) * power;
    s0.mesh.scale.setScalar(s0.size);
  }
}
function updateImpactSparks(dt) {
  for (const s0 of impactSparks) {
    if (s0.life <= 0) continue;
    s0.life -= dt;
    if (s0.life <= 0) { s0.mesh.visible = false; continue; }
    s0.vy -= 7.5 * dt;
    s0.mesh.position.x += s0.vx * dt;
    s0.mesh.position.y += s0.vy * dt;
    s0.mesh.position.z += s0.vz * dt;
    if (s0.mesh.position.y < 0.05) { s0.mesh.position.y = 0.05; s0.vy *= -0.25; }
    const k = s0.life / s0.maxLife;
    s0.mesh.material.opacity = Math.max(0, k * 0.62);
    s0.mesh.scale.setScalar(s0.size * (0.5 + k * 0.8));
  }
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
let activeMap = null;
let lightsOff = false;
let builtMapId = null;   // which map's props are currently in the scene (see applyArenaLighting)

// Signs and stadium boards that the camera may not sit inside (they are not movement colliders).
const cameraBlockers = [];
function collectCameraBlockers() {
  cameraBlockers.length = 0;
  const v = new THREE.Vector3();
  arenaPropsGroup.traverse((o) => {
    const b = o.userData && o.userData.cameraBlocker;
    if (!b) return;
    o.getWorldPosition(v);
    cameraBlockers.push({ x: v.x, z: v.z, y: v.y, hx: b.hx, hz: b.hz });
  });
}
function cameraTraceBlocked(x0, z0, x1, z1, camY = 2.5) {
  for (const b of cameraBlockers) {
    // a shot that passes under the board is fine; only a camera at board height is occluded
    if (camY < b.y - 1.5 || camY > b.y + 1.5) continue;
    const steps = 8;
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const px = x0 + (x1 - x0) * t;
      const pz = z0 + (z1 - z0) * t;
      if (Math.abs(px - b.x) < b.hx && Math.abs(pz - b.z) < b.hz) return true;
    }
  }
  return false;
}

function applyArenaLighting(key) {
  // a map id ("depot"/"yard"/"foundry") owns its props; the lighting preset is borrowed from it.
  // A beat transition passes a legacy lighting key ("gunship"): keep the map's props and only
  // relight, otherwise every beat would rebuild the arena and forget which map is loaded.
  const map = mapById(key);
  const keepMap = !map && activeMap ? activeMap : null;
  const lightKey = map ? map.light : (ARENA_LIGHTING[key] ? key : "perimeter");
  const cfg = ARENA_LIGHTING[lightKey];
  arenaKey = lightKey;
  activeMap = map || keepMap;
  // Rebuilding the props (and their procedural textures/materials) on every lighting change cost
  // a visible stall at run start and at every beat. Only rebuild when the MAP actually changed.
  const nextMapId = (map ? map.id : keepMap ? keepMap.id : lightKey);
  if (builtMapId !== nextMapId) {
    builtMapId = nextMapId;
    populateArenaProps(map ? map.id : keepMap ? keepMap.id : lightKey, arenaPropsGroup, TEX_SIZE);
    buildBrandProps(arenaPropsGroup, activeMap || map || keepMap || null);
    buildGroundDetail();
    collectCameraBlockers();
  }
  renderer.toneMappingExposure = cfg.exposure;
  scene.background.set(hexInt(cfg.background));
  // sky: a touch lighter than the fog at the horizon, darker overhead
  skyUniforms.top.value.set(hexInt(cfg.background)).multiplyScalar(0.9);
  skyUniforms.horizon.value.set(hexInt(cfg.fog.color)).multiplyScalar(2.6);
  scene.fog.color.set(hexInt(cfg.fog.color));
  scene.fog.density = cfg.fog.density * (activeMap?.fogScale || 1);
  hemi.color.set(hexInt(cfg.hemisphere.sky));
  hemi.groundColor.set(hexInt(cfg.hemisphere.ground));
  hemi.intensity = cfg.hemisphere.intensity;
  sun.color.set(hexInt(cfg.sun.color));
  sun.intensity = cfg.sun.intensity * (map?.lightBoost || 1);
  sun.position.set(...cfg.sun.position);
  rain.material.color.set(hexInt(PALETTE.rain));
  rain.material.opacity = cfg.rainOpacity * (map?.rainScale || 1);
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
  scene.environmentIntensity = lightsOff ? 0.06 : ENV_INTENSITY;
}

function setLightsEnabled(on) {
  lightsOff = !on;
  hemi.visible = on;
  sun.visible = on;
  scene.environmentIntensity = on ? ENV_INTENSITY : 0.06;
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
  // FX-03: camera kick accumulates from trigger pulls and decays; kickShots is the visible counter
  camKick: { x: 0, y: 0, roll: 0, recover: 10 },
  kickShots: 0,
};

if (testMode) {
  // Results-screen DOM button path: the keyboard redeploy lives in the ctx-based held() check, which a
// synthetic key event cannot satisfy, so the button asks main directly.
window.addEventListener("forge:redeploy", () => {
  if (state.phase === "results") startRun(menuModule.ARENAS[state.selectedArenaIndex].id);
});

window.__forgeSmokeTest = {
    getState: () => state,
    getScene: () => scene,
    getSoldier: () => soldier,
    getGunPivot: () => gunPivot,
    getScene: () => scene,
    getSoldier: () => soldier,
    getWeapons: () => weaponManager,
    getCards: () => cardSystem,
    getManager: () => managerUI,
    getRainY: () => +rainPos[1].toFixed(3),
    getTreeSway: () => (trees[0] ? +trees[0].rotation.z.toFixed(4) : null),
    getGrenades: () => grenades.length,
    getImpacts: () => state.impactsSpawned || 0,
    getBlasts: () => ({
      pending: pendingBlasts.length,
      detonated: state.blastsDetonated || 0,
      ringsVisible: blastRings.filter((b) => b.life > 0).length,
    }),
    spawnAir: (type = "gunship") => {
      const e = enemyManager.spawn(type, state.pos, 0);
      if (e) e.position.y = 9;
      return e ? { hp: e.hp, y: e.position.y } : null;
    },
    airState: () => enemyManager.enemies.filter((e) => e.mesh && e.mesh.position.y > 2)
      .map((e) => ({ type: e.type, hp: Math.round(e.hp), y: +e.mesh.position.y.toFixed(1) })),
    getTracerColors: () => tracers.filter((t) => t.life > 0).map((t) => t.mesh.material.color.getHex()),
    getCruise: () => ({ style: weaponManager.active.styleKey, vfx: STYLE_VFX[weaponManager.active.styleKey] || null }),
    // FX-02 / FX-03 evidence: live casings, cases thrown, and camera-kick trigger pulls
    getCasings: () => ({ live: casings.count(), total: casings.total(), cap: casings.cap }),
    getFeel: () => ({
      kickShots: state.kickShots || 0,
      kick: { x: +(state.camKick?.x || 0).toFixed(4), y: +(state.camKick?.y || 0).toFixed(4) },
      style: weaponManager.active?.styleKey || null,
      feel: feelFor(weaponManager.active?.styleKey),
    }),
    // FX-03 acceptance: the added per-frame CPU cost of casings + kick authoring, in ms
    benchFx: (n = 3000) => {
      const t0 = performance.now();
      for (let i = 0; i < n; i += 1) {
        casings.update(1 / 60);
        kickImpulse("cone", Math.random);
      }
      return (performance.now() - t0) / n;
    },
    getEnemies: () => enemyManager,
    // MOV-01..04 metrics: distance travelled, camera push, boss dodge, spacing, frozen frames
    getPilot: () => {
      const live = enemyManager.enemies.filter((e) => e.hp > 0 && e.mesh);
      let sum = 0;
      let pairs = 0;
      for (let i = 0; i < live.length; i += 1) {
        for (let j = i + 1; j < live.length; j += 1) {
          sum += Math.hypot(live[i].mesh.position.x - live[j].mesh.position.x,
            live[i].mesh.position.z - live[j].mesh.position.z);
          pairs += 1;
        }
      }
      return {
        mode: state.pilotMode,
        runTime: +beatDirector.runTime.toFixed(2),
        distance: +(state.pilotDistance || 0).toFixed(2),
        odometer: +(state.odometer || 0).toFixed(2),
        camPushMax: +(state.camPushMax || 0).toFixed(3),
        maxFrameAccel: +(state.maxFrameAccel || 0).toFixed(3),
        holdBeats: state.holdBeats || 0,
        moving: Boolean(state.pilotWantsMove),
        bossDodgeMax: +(state.bossDodgeMax || 0).toFixed(2),
        zeroMoveFrames: state.zeroMoveFrames || 0,
        enemies: live.length,
        spacing: pairs ? +(sum / pairs).toFixed(2) : 0,
      };
    },
    getEnemyTypes: () => Object.keys(ENEMY_TYPES),
    setPlayerPos: (x, z) => { state.pos.x = Number(x) || 0; state.pos.z = Number(z) || 0; return { x: state.pos.x, z: state.pos.z }; },
    getPickups: () => ({
      count: pickupItems.length,
      alive: pickupItems.filter((p) => p.alive).map((p) => ({ type: p.type, x: +p.x.toFixed(1), z: +p.z.toFixed(1) })),
      taken: state.pickupsTaken || 0,
      regen: state.regenTicks.length,
      speedStacks: state.speedStacks.length,
      powerStacks: state.powerStacks.length,
      speedMult: +(state.speedMult || 1).toFixed(2),
      powerMult: +(state.powerMult || 1).toFixed(2),
      goal: state.pickupGoal ? { type: state.pickupGoal.type, x: +state.pickupGoal.x.toFixed(1), z: +state.pickupGoal.z.toFixed(1) } : null,
    }),
    getBroadcast: () => ({ shot: broadcast.shot, name: broadcast.shotName, timer: +broadcast.timer.toFixed(1), look: [ +broadcast.look.x.toFixed(1), +broadcast.look.y.toFixed(1), +broadcast.look.z.toFixed(1) ] }),
    getCamera: () => ({ x: +camera.position.x.toFixed(2), y: +camera.position.y.toFixed(2), z: +camera.position.z.toFixed(2) }),
    setBroadcastShot: (shot) => {
      if (!SHOT_NAMES[shot]) return null;
      broadcast.shot = shot;
      broadcast.shotName = SHOT_NAMES[shot];
      broadcast.timer = 9;
      broadcast.lock = true;
      return broadcast.shot;
    },
    getRamp: () => ({
      bodies: enemyManager.spawnBodies || 0,
      shooters: enemyManager.spawnShooters || 0,
      share: enemyManager.spawnBodies ? +((enemyManager.spawnShooters || 0) / enemyManager.spawnBodies).toFixed(2) : 0,
      t: +beatDirector.runTime.toFixed(1),
    }),
    getCombat: () => ({
      fired: state.enemyShotsFired || 0,
      hit: state.enemyShotsHit || 0,
      incoming: state.incomingShot ? +state.incomingShot.t.toFixed(2) : null,
      incomingFrames: state.incomingFrames || 0,
      mode: state.pilotMode,
      health: Math.round(state.health),
    }),
    // MGR-07: nearest live body plus the state the pilot is reacting to
    getNearest: () => {
      const live = enemyManager.enemies.filter((e) => e.hp > 0);
      if (!live.length) return null;
      live.sort((a, b) => Math.hypot(a.position.x - state.pos.x, a.position.z - state.pos.z)
        - Math.hypot(b.position.x - state.pos.x, b.position.z - state.pos.z));
      const e = live[0];
      const dx = e.position.x - state.pos.x;
      const dz = e.position.z - state.pos.z;
      let a = Math.atan2(dx, dz) - (e.shieldAngle ?? 0);
      a = Math.atan2(Math.sin(a), Math.cos(a));
      return {
        type: e.type,
        d: +Math.hypot(dx, dz).toFixed(2),
        isShielded: Boolean(e.isShielded),
        flanked: Boolean(e.flanked),
        hp: Math.round(e.hp),
        angleToShield: +a.toFixed(2),
      };
    },
    // MOV-02 evidence: drop an archetype at a world point and read the live ring around the player
    spawnAt: (t, x, z) => {
      const e = enemyManager.spawn(String(t), { x, z }, 0);
      if (!e) return null;
      e.position.x = x;
      e.position.z = z;
      if (e.mesh) e.mesh.position.set(x, 0.72, z);
      return { type: e.type, slot: e.slot, hp: Math.round(e.hp) };
    },
    // MOV-04: skip to the boss threshold so the telegraph dodge can be measured without an 80 s run
    forceBoss: () => { state.kills = Math.max(state.kills || 0, 110); return state.kills; },
    // MGR-06/08 evidence: what each equipped item does to the run's stat block, and the clear drop
    getStatsFor: (equipped) => statsForLevel((state.cyborgProfile && state.cyborgProfile.level) || 1, equipped || {}),
    grantClear: () => bankRun(true),
    // TUNE-04 evidence hooks
    setWeapon: (style) => { try { weaponManager.replaceWeapon("primary", String(style)); } catch (e) { return null; } return weaponManager.active.styleKey; },
    forceBossKind: (kind) => { state.arenaBossKind = String(kind); return state.arenaBossKind; },
    setRunTime: (seconds) => { beatDirector.runTime = Math.max(0, Number(seconds) || 0); return +beatDirector.runTime.toFixed(1); },
    getCardsState: () => ({
      window: Boolean(state.cardPickWindow), source: state.cardPickSource || null,
      timer: +(state.cardPickTimer || 0).toFixed(1), queued: cardSystem.queuedCards.length,
      cardsPlayed: state.cardsPlayed || 0, airdrop: state.airdropState ? true : false,
      options: (state.currentCardOptions || []).map((o) => ({ type: o.type, name: o.name || null, style: o.style || null })),
    }),
    clearEnemies: () => { clearEnemies(); return true; },
    setSpawns: (on) => { state.spawnsEnabled = Boolean(on); return state.spawnsEnabled; },
    getBoss: () => (state.bossEnemy ? {
      type: state.bossEnemy.type,
      hp: Math.round(state.bossEnemy.hp),
      maxHp: Math.round(state.bossEnemy.maxHp),
      y: +(state.bossEnemy.mesh ? state.bossEnemy.mesh.position.y : state.bossEnemy.position.y).toFixed(2),
      x: +state.bossEnemy.position.x.toFixed(2),
      z: +state.bossEnemy.position.z.toFixed(2),
      r: +Math.hypot(state.bossEnemy.position.x, state.bossEnemy.position.z).toFixed(2),
      spawned: Boolean(state.bossSpawned),
      paid: Boolean(state.bossPaid),
    } : { spawned: Boolean(state.bossSpawned), hp: 0 }),
    getSlots: () => enemyManager.enemies.filter((e) => e.hp > 0).map((e) => {
      const dx = e.position.x - state.pos.x;
      const dz = e.position.z - state.pos.z;
      let a = Math.atan2(dx, dz) - state.yaw;
      a = Math.atan2(Math.sin(a), Math.cos(a));
      return { type: e.type, slot: e.slot, d: +Math.hypot(dx, dz).toFixed(2), angle: +a.toFixed(2) };
    }),
    // MGR-07: spawn a real archetype and report the stat block the run will fight
    spawnType: (t) => {
      const e = enemyManager.spawn(String(t), state.pos, 0);
      return e ? {
        type: e.type,
        hp: Math.round(e.hp),
        speed: Number((e.speed || 0).toFixed(2)),
        behaviour: (e.config && e.config.behaviour) || "",
      } : null;
    },
    // MGR-08: the legendary pool the manager can equip, plus what the profile already owns
    getLegendaryPool: () => ({
      lightMods: LIGHT_MODS.map((m) => m.id),
      perks: PERKS.map((p) => p.id),
      legacy: (state.cyborgProfile && state.cyborgProfile.legacy) || [],
      equipped: (state.cyborgProfile && state.cyborgProfile.equipped) || {},
    }),
    // QA: end a run on demand so the results/summary screen can be photographed
    hurt: (n = 9999) => { hurt(n); return state.phase; },
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
    // ── QA-ONLY CAMERA / TIME HOOKS ──────────────────────────────────────────
    // A fixed camera and a slow clock are the only way to photograph a rig or watch an animation
    // frame by frame. Both live behind ?test=1 and are inert in a normal page load.
    freeCam: (px, py, pz, tx, ty, tz) => {
      state.debugCam = {
        pos: [Number(px) || 0, Number(py) || 0, Number(pz) || 0],
        look: [Number(tx) || 0, Number(ty) || 0, Number(tz) || 0],
      };
      return state.debugCam;
    },
    clearCam: () => { state.debugCam = null; return true; },
    setWeaponAnchor: (x, y, z) => setWeaponAnchorModel(x, y, z),
    sparkAt: (x, y, z, color = 0xffd57a, count = 8, power = 1) => {
      spawnImpact(x, y, z, color, count, power);
      return { sparks: impactSparks.filter((s0) => s0.life > 0).length };
    },
    ringAt: (x, z, radius = 1, color = 0xff6a4a) => { showBlastRing(x, z, radius, 0.4, color, true); return true; },
    setTimeScale: (v) => {
      state.timeScale = Math.max(0.02, Math.min(2, Number(v) || 1));
      return state.timeScale;
    },
    getInfo: () => ({
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      programs: renderer.info.programs ? renderer.info.programs.length : null,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
    }),
    getRig: () => {
      const rig = soldier.userData.glbRig;
      const out = { hasRig: Boolean(rig), anim: soldier.userData.activeAnim, hasMixer: Boolean(soldier.userData.mixer) };
      if (rig) {
        const v = new THREE.Vector3();
        const p = new THREE.Vector3();
        gunPivot.getWorldPosition(p);
        soldier.getWorldPosition(v);
        out.rigYaw = +rig.rotation.y.toFixed(3);
        out.soldierYaw = +state.yaw.toFixed(3);
        out.gunWorld = p.toArray().map((n) => +n.toFixed(2));
        out.soldierWorld = v.toArray().map((n) => +n.toFixed(2));
        const head = rig.getObjectByName("mixamorigHead") || rig.getObjectByName("Head");
        if (head) {
          const q = new THREE.Quaternion();
          head.getWorldQuaternion(q);
          // head-local +Z in world space tells us which way the face points
          out.headFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q).toArray().map((n) => +n.toFixed(2));
        }
      }
      return out;
    },
    getLighting: () => ({
      arena: arenaKey,
      map: activeMap ? activeMap.id : null,
      mapName: activeMap ? activeMap.name : ARENA_LIGHTING[arenaKey].name,
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

const vMuzzle = new THREE.Vector3(), vTarget = new THREE.Vector3(), vDesired = new THREE.Vector3(), vShotDir = new THREE.Vector3();

// Arcade broadcast director: the camera cuts between sports-style shots that keep the operator and
// the nearest hostile in frame instead of sitting behind the player's shoulder.
const _camPrev = new THREE.Vector3();
const _moveProbe = new THREE.Vector3();
const broadcast = {
  shot: "chase",
  shotName: "CAM 2",
  timer: 0,
  cut: false,
  look: new THREE.Vector3(),
  lastKills: -1,
  number: 2,
};
const SHOT_NAMES = { chase: "CAM 1 // CHASE", orbit: "CAM 2 // ORBIT", sideline: "CAM 3 // SIDELINE", wide: "CAM 4 // WIDE", hero: "CAM 5 // HERO" };

function nearestHostileTo(x, z) {
  let best = null;
  let bestD = 1e9;
  for (const e of enemyManager.getEnemies()) {
    if (!e || e.dead) continue;
    const d = Math.hypot(e.position.x - x, e.position.z - z);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

function pickBroadcastShot() {
  const boss = state.bossEnemy && state.bossEnemy.hp > 0;
  const hurt = state.health / Math.max(1, state.maxHealth) < 0.35;
  const pool = boss || hurt
    ? ["hero", "sideline", "chase", "orbit"]
    : ["chase", "orbit", "sideline", "sideline", "chase", "orbit", "wide"];
  broadcast.shot = pool[Math.floor(state.rng() * pool.length)];
  broadcast.shotName = SHOT_NAMES[broadcast.shot] || "CAM 1";
  broadcast.timer = 8.0 + state.rng() * 5.0;
  return broadcast.shot;
}

let hudPhase = null, hudHealth = null, hudKills = null, hudAmmo = null, hudBeat = null, hudScore = null, hudAirdrop = null, hudCards = null, hudBoss = null, hudDarkness = null, hudObjective = null, hudPainted = null;

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
    const W2H = (globalThis.innerWidth || 1400) / (globalThis.innerHeight || 850);
    const pw = (f) => f * W2H; // HUD panels/images are sized in height units
    const ratio = Math.max(0, state.health / Math.max(1, state.maxHealth));
    const color = ratio > 0.6 ? PALETTE.healthOk : ratio > 0.3 ? PALETTE.healthWarn : PALETTE.healthCrit;

    // ── compact HUD for phones (the desktop layout is laid out in viewport-height units, so at
    // 390 px wide the right-hand modules run off-screen) ─────────────────────────────
    if ((globalThis.innerWidth || 1280) < 700) {
      const w = weaponManager.active;
      const beat = beatDirector.getCurrentBeat();
      const ammo = w.isHeatWeapon ? `${Math.round(w.heat)} HEAT` : `${w.magazine} / ${w.maxMagazine}`;
      T("vitals-title", activeSkin.name.toUpperCase(), { x: 0.012, y: 0.018, size: TYPE_SCALE.micro, color: "#aec2d6", weight: 800 });
      B("health", ratio, { x: 0.012, y: 0.033, w: 0.24, h: 0.013, color, back: "rgba(255,255,255,0.08)" });
      T("health-num", String(Math.round(state.health)), { x: 0.262, y: 0.028, size: TYPE_SCALE.numeral, color, weight: 800 });
      T("kills", `KILLS ${state.kills}   LV ${cardSystem.level}`, { x: 0.012, y: 0.052, size: TYPE_SCALE.micro, color: "#cfdeee", weight: 700 });
      T("beat", `${beat.name.toUpperCase()} ${beatDirector.getBeatTimeRemaining().toFixed(0)}s`, { x: 0.012, y: 0.070, size: TYPE_SCALE.micro, color: PALETTE.ui, weight: 800 });
      T("ammo-count", `${String(weaponManager.active.styleKey).toUpperCase()}  ${ammo}`, { x: 0.012, y: 0.088, size: TYPE_SCALE.small, color: "#eaf3ff", weight: 800 });
      const boss = enemyManager.getEnemies().find((e) => e.type === "gunship" || e.type === "mech");
      if (boss) {
        T("boss-label", `BOSS ${Math.max(0, Math.round(boss.hp))} HP`, { x: 0.012, y: 0.104, size: TYPE_SCALE.micro, color: "#ffb8bc", weight: 800 });
        B("boss-bar", Math.max(0, boss.hp / boss.maxHp), { x: 0.012, y: 0.116, w: 0.30, h: 0.008, color: PALETTE.healthCrit, back: "rgba(255,255,255,0.08)" });
      } else {
        h.remove("boss-label"); h.remove("boss-bar");
      }
      if (ratio < 0.5) h.flash("#7e0c14", Math.min(0.3, (0.5 - ratio) * 0.5));
      if (changed) hudPhase = state.phase;
      return;
    }
    if (hudHealth !== Math.round(state.health)) {
      hudHealth = Math.round(state.health);
      // ── operator status card: one grid, one photo skin, no overlapping rows ──
      const cx = 0.014, cy = 0.024, cw = pw(0.30), ch = 0.130;
      const px = cx + 0.018;
      h.image("vitals-photo", "./assets/start-still-a.jpg", { x: cx, y: cy, w: cw, h: ch });
      P("vitals", { x: cx, y: cy, w: cw, h: ch, radius: 0.009, fill: "rgba(4,8,13,0.55)", stroke: "rgba(214,178,94,0.45)", width: 0.0012 });
      const br = "rgba(255,196,104,0.92)";
      P("vitals-br-tl-h", { x: cx, y: cy, w: pw(0.026), h: 0.0022, fill: br });
      P("vitals-br-tl-v", { x: cx, y: cy, w: pw(0.0022), h: 0.014, fill: br });
      P("vitals-br-br-h", { x: cx + 0.30 - 0.026, y: cy + ch - 0.0022, w: pw(0.026), h: 0.0022, fill: br });
      P("vitals-br-br-v", { x: cx + 0.30 - 0.0022, y: cy + ch - 0.014, w: pw(0.0022), h: 0.014, fill: br });
      P("vitals-accent", { x: cx, y: cy, w: cw, h: 0.0035, radius: 0.002, fill: color, stroke: "rgba(0,0,0,0)", width: 0 });
      T("vitals-title", activeSkin.name.toUpperCase(), { x: px, y: 0.035, size: TYPE_SCALE.micro, color: "#e6eef7", weight: 800 });
      T("vitals-sub", "AUTONOMOUS COMBAT FRAME", { x: px, y: 0.050, size: TYPE_SCALE.micro, color: "#8fa3b6", weight: 700 });
      B("health", ratio, { x: px, y: 0.070, w: 0.200, h: 0.017, color, back: "rgba(255,255,255,0.10)" });
      T("health-num", String(Math.round(state.health)), { x: 0.252, y: 0.058, size: TYPE_SCALE.subhead, color, weight: 800, align: "right" });

      // ── weapon card: same grid, photo skin, ammo right-aligned inside the card ──
      const wx = 0.722, wy = 0.812, ww = pw(0.264), wh = 0.146;
      const wpx = wx + 0.014;
      h.image("weapon-photo", "./assets/art-05.jpg", { x: wx, y: wy, w: ww, h: wh });
      P("weapon-module", { x: wx, y: wy, w: ww, h: wh, radius: 0.009, fill: "rgba(4,8,13,0.55)", stroke: "rgba(214,178,94,0.45)", width: 0.0012 });
      P("weapon-br-tl-h", { x: wx, y: wy, w: pw(0.026), h: 0.0022, fill: br });
      P("weapon-br-tl-v", { x: wx, y: wy, w: pw(0.0022), h: 0.014, fill: br });
      P("weapon-br-br-h", { x: wx + 0.264 - 0.026, y: wy + wh - 0.0022, w: pw(0.026), h: 0.0022, fill: br });
      P("weapon-br-br-v", { x: wx + 0.264 - 0.0022, y: wy + wh - 0.014, w: pw(0.0022), h: 0.014, fill: br });
      P("weapon-accent", { x: wx, y: wy, w: ww, h: 0.0035, radius: 0.002, fill: PALETTE.ui, stroke: "rgba(0,0,0,0)", width: 0 });
      T("weapon-tag", "PRIMARY", { x: wpx, y: 0.822, size: TYPE_SCALE.micro, color: "#8fa3b6", weight: 700 });
    }
    const killsKey = `${state.kills}:${cardSystem.level}`;
    if (hudKills !== killsKey) {
      hudKills = killsKey;
      weaponManager.syncReloadMeta(cardSystem.level, weaponManager.reloadUpgradesCount);
      T("kills", `KILLS ${state.kills}`, { x: 0.032, y: 0.108, size: TYPE_SCALE.small, color: "#dbe7f2", weight: 700 });
      T("level-chip", `LV ${cardSystem.level}`, { x: 0.300, y: 0.108, size: TYPE_SCALE.small, color: PALETTE.ui, weight: 800, align: "right" });
    }

    const activeConfig = weaponManager.getActiveConfig();
    const inactiveConfig = weaponManager.getInactiveConfig();
    const activeWeapon = weaponManager.active;
    const rldSpd = activeWeapon.reloadSpeedMultiplier || 1;

    const activeStyle = activeConfig?.style || activeWeapon?.styleKey || "spray";
    const inactiveStyle = inactiveConfig?.style || weaponManager.inactive?.styleKey || "pierce";
    const activeName = String(activeStyle).toUpperCase();
    const inactiveName = String(inactiveStyle).toUpperCase();

    const ammoNow = activeWeapon.isHeatWeapon ? Math.round(activeWeapon.heat) : activeWeapon.magazine;
    const ammoMax = activeWeapon.isHeatWeapon ? Math.max(1, activeWeapon.maxHeat) : activeWeapon.maxMagazine;
    const ammoText = activeWeapon.isReloading
      ? `RLD ${Math.round(activeWeapon.reloadProgress * 100)}%`
      : `${ammoNow} / ${ammoMax}`;
    if (hudAmmo !== ammoText) {
      hudAmmo = ammoText;
      T("weapon-active", activeName, { x: 0.736, y: 0.838, size: TYPE_SCALE.label, color: "#f2f7ff", weight: 800 });
      T("weapon-inactive", `ALT  ${inactiveName}`, { x: 0.760, y: 0.903, size: TYPE_SCALE.micro, color: "#a9bccd", weight: 600 });
      T("ammo-tag", activeWeapon.isReloading ? "RELOADING" : (activeWeapon.isHeatWeapon ? "HEAT" : "MAGAZINE"), { x: 0.974, y: 0.862, size: TYPE_SCALE.micro, color: "#8fa3b6", weight: 700, align: "right" });
      T("ammo-count", ammoText, { x: 0.974, y: 0.834, size: TYPE_SCALE.subhead, color: activeWeapon.isReloading ? PALETTE.healthWarn : "#eaf3ff", weight: 800, align: "right" });
      const barFrac = activeWeapon.isReloading
        ? activeWeapon.reloadProgress
        : activeWeapon.isHeatWeapon
          ? Math.max(0, 1 - activeWeapon.heat / Math.max(1, activeWeapon.maxHeat))
          : activeWeapon.magazine / Math.max(1, activeWeapon.maxMagazine);
      B("reload-bar", barFrac, { x: 0.736, y: 0.890, w: 0.236, h: 0.006, color: activeWeapon.isReloading ? PALETTE.healthWarn : PALETTE.ui, back: "rgba(255,255,255,0.10)" });
    }

    // Weapon icons (ART-01 sheet), sized for the module.
    const activeIconSrc = weaponIconDataUrls[activeStyle];
    const inactiveIconSrc = weaponIconDataUrls[inactiveStyle];
    if (activeIconSrc && h.get("weapon-icon-active")?.src !== activeIconSrc) {
      h.image("weapon-icon-active", activeIconSrc, { x: 0.736, y: 0.928, h: 0.016 });
    }
    if (inactiveIconSrc && h.get("weapon-icon-inactive")?.src !== inactiveIconSrc) {
      h.image("weapon-icon-inactive", inactiveIconSrc, { x: 0.760, y: 0.932, h: 0.009 });
    }

    // Low-integrity wash: the HUD "flash" layer covers the whole frame (a panel is laid out in the
    // square HUD stage, so w:1 only covers one stage width, not the viewport).
    if (ratio < 0.5) {
      const pulse = ratio < 0.25 ? 0.03 * Math.sin(state.t * 7) : 0;
      const alpha = Math.min(0.34, (0.5 - ratio) * 0.55 + pulse + 0.05);
      h.flash("#7e0c14", alpha * 0.55);
      T("vitals-warning", ratio < 0.25 ? "INTEGRITY CRITICAL" : "INTEGRITY LOW", { x: 0.032, y: 0.126, size: TYPE_SCALE.micro, color: PALETTE.healthCrit, weight: 800 });
    } else {
      h.remove("vitals-warning");
    }

    // Arcade top-centre timer: no chip, outlined numerals with gold rules either side.
    const beat = beatDirector.getCurrentBeat();
    const beatText = beat.name.toUpperCase();
    const timeLeft = beatDirector.getBeatTimeRemaining();
    const timerText = timeLeft >= 10 ? timeLeft.toFixed(1) : `0${timeLeft.toFixed(1)}`;
    const timerColor = timeLeft <= 10 ? "#ff5a5a" : "#ffd27a";
    const timerFont = "ui-monospace, Consolas, monospace";
    const beatKey = `${beatText}:${timerText}`;
    if (hudBeat !== beatKey) {
      hudBeat = beatKey;
      // two hairlines flanking the numerals, like an arcade countdown rail
      P("timer-rule-l", { x: 0.330, y: 0.052, w: pw(0.070), h: 0.0016, fill: "rgba(255,196,104,0.55)" });
      P("timer-rule-r", { x: 0.600, y: 0.052, w: pw(0.070), h: 0.0016, fill: "rgba(255,196,104,0.55)" });
      T("beat-timer-shadow", timerText, { x: 0.5, y: 0.021, size: 54, color: "rgba(0,0,0,0.9)", weight: 900, align: "center", font: timerFont });
      T("beat-timer", timerText, { x: 0.5, y: 0.018, size: 54, color: timerColor, weight: 900, align: "center", font: timerFont });
    }
    T("cam-bug", `LIVE  ●  ${broadcast.shotName}`, { x: 0.985, y: 0.030, size: TYPE_SCALE.micro, color: "#ff8a8a", weight: 800, align: "right" });
    T("timer-cap", timeLeft <= 10 ? "CONTACT // CLOSING" : "CONTACT", { x: 0.5, y: 0.006, size: TYPE_SCALE.micro, color: timeLeft <= 10 ? "#ff8a8a" : "#ffb347", weight: 800, align: "center" });

    // Score under the timer, no frame.
    const currentScore = scoreSystem.getCurrentScore(beatDirector.runTime);
    if (hudScore !== currentScore) {
      hudScore = currentScore;
      T("score", `SCORE  ${currentScore}`, { x: 0.5, y: 0.094, size: TYPE_SCALE.small, color: "#b7c8d8", weight: 800, align: "center" });
      
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
          T("airdrop", airdropText, { x: 0.5, y: 0.128, size: TYPE_SCALE.small, color: PALETTE.healthOk, weight: 700, align: "center" });
        }
      }
    } else if (hudAirdrop !== null) {
      hudAirdrop = null;
      h.remove("airdrop");
    }

    // Boss HP readout — ONLY the actual arena boss. This used to match any mech or gunship in the
    // arena, so a routine mech spawn put a full boss bar on screen and the player read it as the
    // run's boss being up.
    const boss = state.bossEnemy && state.bossEnemy.hp > 0 && enemyManager.getEnemies().includes(state.bossEnemy)
      ? state.bossEnemy
      : null;
    if (boss) {
      const bossKey = `${boss.type}:${Math.round(boss.hp)}`;
      if (hudBoss !== bossKey) {
        hudBoss = bossKey;
        const bossLabel = boss.type === "gunship" ? "BOSS // ASSAULT GUNSHIP" : "BOSS // FOUNDRY WARDEN";
        P("boss-frame", { x: 0.352, y: 0.150, w: 0.296, h: 0.056, radius: 0.006, fill: "rgba(12,6,9,0.78)", stroke: "rgba(242,84,91,0.35)", width: 0.0012 });
        P("boss-pip", { x: 0.352, y: 0.150, w: 0.004, h: 0.056, radius: 0.002, fill: PALETTE.healthCrit, stroke: "rgba(0,0,0,0)", width: 0 });
        T("boss-label", `${bossLabel}   ${Math.max(0, Math.round(boss.hp))} HP`, { x: 0.5, y: 0.156, size: TYPE_SCALE.micro, color: "#ffb8bc", weight: 800, align: "center" });
        B("boss-bar", Math.max(0, boss.hp / boss.maxHp), { x: 0.362, y: 0.180, w: 0.276, h: 0.010, color: PALETTE.healthCrit, back: "rgba(255,255,255,0.08)" });
      }
    } else if (hudBoss !== null) {
      hudBoss = null;
      h.remove("boss-label");
      h.remove("boss-bar");
      h.remove("boss-frame");
      h.remove("boss-pip");
    }

    // Objective readout removed with the defend-location system: there are no capture zones.
    if (hudObjective !== null) {
      hudObjective = null;
      h.remove("obj-hud");
    }

    // ── radar (bottom-left, 26 m range, up = facing) ─────────────────────────
    {
      const cx = 0.098;
      const cy = 0.792;
      P("radar", { x: cx - 0.082, y: cy - 0.082, w: 0.164, h: 0.164, radius: 0.082, fill: "rgba(6,10,16,0.64)", stroke: "rgba(126,150,176,0.24)", width: 0.0012 });
      P("radar-ping", { x: cx - 0.030, y: cy - 0.030, w: 0.060, h: 0.060, radius: 0.030, fill: "rgba(111,227,255,0.05)", stroke: "rgba(111,227,255,0.12)", width: 0.0008 });
      T("radar-self", "+", { x: cx, y: cy, size: TYPE_SCALE.micro, color: "#6fe3ff", weight: 800, align: "center" });
      T("radar-label", "RADAR", { x: cx - 0.022, y: cy + 0.094, size: TYPE_SCALE.micro, color: "#576a7e", weight: 700 });
      const live = enemyManager.enemies.filter((e) => e.hp > 0 && e.mesh).slice(0, 14);
      for (let i = 0; i < 14; i += 1) {
        const id = `radar-dot-${i}`;
        const e = live[i];
        if (!e) { h.remove(id); continue; }
        const dx = e.position.x - state.pos.x;
        const dz = e.position.z - state.pos.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 26 || dist < 0.4) { h.remove(id); continue; }
        const rel = Math.atan2(dx, dz) - state.yaw;
        const rr = Math.min(1, dist / 26) * 0.074;
        P(id, {
          x: cx + Math.sin(rel) * rr - 0.004,
          y: cy - Math.cos(rel) * rr - 0.004,
          w: 0.008, h: 0.008, radius: 0.004,
          fill: (e.type === "gunship" || e.type === "mech") ? "#ffb347" : "#ff5a5a",
          stroke: "rgba(0,0,0,0)", width: 0,
        });
      }
      // pickups on the radar: green health, amber power, cyan speed
      for (let i = 0; i < 8; i += 1) {
        const id = "radar-pick-" + i;
        const item = pickupItems[i];
        if (!item || !item.alive) { h.remove(id); continue; }
        const dx = item.x - state.pos.x;
        const dz = item.z - state.pos.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 26) { h.remove(id); continue; }
        const rel = Math.atan2(dx, dz) - state.yaw;
        const rr = Math.min(1, dist / 26) * 0.074;
        P(id, {
          x: cx + Math.sin(rel) * rr - 0.003,
          y: cy - Math.cos(rel) * rr - 0.003,
          w: 0.006, h: 0.006, radius: 0.003,
          fill: item.type === "health" ? "#7ce6a8" : item.type === "speed" ? "#6fe3ff" : "#ffb347",
          stroke: "rgba(0,0,0,0)", width: 0,
        });
      }
    }

    // ── active buffs (under the operator card) ───────────────────────────────
    {
      const parts = [];
      if (state.regenTicks.length) {
        const left = Math.ceil(Math.max(...state.regenTicks.map((t) => t.remaining)));
        parts.push("REGEN " + left + "s x" + state.regenTicks.length);
      }
      if (state.speedStacks.length) {
        const left = Math.ceil(Math.max(...state.speedStacks.map((s) => s.remaining)));
        parts.push("SPEED +" + Math.round((state.speedMult - 1) * 100) + "% " + left + "s");
      }
      if (state.powerStacks.length) {
        const left = Math.ceil(Math.max(...state.powerStacks.map((s) => s.remaining)));
        parts.push("POWER +" + Math.round((state.powerMult - 1) * 100) + "% " + left + "s");
      }
      if (parts.length) T("buffs", parts.join("   ·   "), { x: 0.026, y: 0.168, size: TYPE_SCALE.micro, color: "#bcd2e6", weight: 700 });
      else h.remove("buffs");
    }

    // ── kill feed (top-right) ────────────────────────────────────────────────
    {
      const feed = state.killFeed || [];
      for (let i = 0; i < 3; i += 1) {
        const id = `killfeed-${i}`;
        const entry = feed[i];
        if (!entry) { h.remove(id); continue; }
        // right lane: the centre-right was sitting on top of floating damage numbers
      T(id, entry.text, { x: 0.745, y: 0.238 + i * 0.020, size: TYPE_SCALE.micro, color: i === 0 ? "#ffe9a8" : "#8ea3b8", weight: 800 });
      }
    }

    // ── painted (spotter mark) ───────────────────────────────────────────────
    {
      const paintedKey = state.painted ? `P${Math.ceil(state.paintedTimer || 0)}` : null;
      if (paintedKey !== hudPainted) {
        hudPainted = paintedKey;
        if (paintedKey) {
          T("painted-chip", `PAINTED · +15% INCOMING · ${Math.ceil(state.paintedTimer || 0)}s`, {
            x: 0.5, y: 0.30, size: TYPE_SCALE.micro, color: "#ff9ae1", weight: 800, align: "center",
          });
        } else {
          h.remove("painted-chip");
        }
      }
    }

    // ── hit marker (screen centre) ───────────────────────────────────────────
    if ((state.hitMarker || 0) > 0) {
      // four diagonal ticks, not a giant letter X
      const c = 0.5, i = 0.012, o = 0.026;
      const color = state.hitMarkerKill ? "#ff5a5a" : "#ffe9a8";
      const d = "M " + (c - o) + " " + (c - o) + " L " + (c - i) + " " + (c - i)
        + " M " + (c + i) + " " + (c - i) + " L " + (c + o) + " " + (c - o)
        + " M " + (c - i) + " " + (c + i) + " L " + (c - o) + " " + (c + o)
        + " M " + (c + o) + " " + (c + i) + " L " + (c + i) + " " + (c + o);
      P("hitmarker", { type: "path", x: 0.47, y: 0.47, w: 0.06, h: 0.06, d, viewBox: [0, 0, 1, 1], fill: null, stroke: color, width: 0.0035 });
    } else {
      h.remove("hitmarker");
    }

    // "THE DARKNESS COMES" status banner when ambient light dims
    const darkPct = Math.round((state.darknessFactor || 0) * 100);
    const darkKey = darkPct >= 15 ? `DARK:${Math.round(darkPct / 5) * 5}:${weaponManager.lightModLevel}` : null;
    if (darkKey !== hudDarkness) {
      hudDarkness = darkKey;
      if (darkKey) {
        const modTag = weaponManager.lightModLevel > 0 ? `LIGHT MODS LV ${weaponManager.lightModLevel} (+25% LIT DMG)` : "GUN FLOODLIGHT & LIGHT-ORB ROUNDS ENGAGED";
        T("darkness-alert", `DARKNESS · ${darkPct}% DIM  ·  ${modTag}`, { x: 0.5, y: 0.345, size: TYPE_SCALE.micro, color: "#ffd57a", weight: 800, align: "center" });
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
  casings.clear();
  clearEnemyShots();
  clearBlasts();
}

function placeCamera() {
  camera.position.set(state.pos.x, 5.9, state.pos.z + 8.0);
  camera.lookAt(state.pos.x, 1.25, state.pos.z);
}

function startRun(arenaId = "arena1") {
  clearEnemies();
  clearEffects();
  const seed = state.seed;
  state.rng = makeRng(seed);
  const chosenStyle = STARTER_LOADOUTS[state.loadoutIndex || 0]?.id || "spray";
  const secondaryStyle = chosenStyle === "pierce" ? "spray" : "pierce";
  
  // MAP-04: map selection. `?map=depot|yard|foundry` forces it (boot tests); otherwise rotate
  // deterministically by seed + how many runs this profile has banked.
  const forcedMap = urlParams.get("map");
  const runNo = (state.cyborgProfile && state.cyborgProfile.runs) || 0;
  const mapMode = TUNING.mapSelection || "rotate";
  const chosenMap = forcedMap
    ? (selectMap({ forced: forcedMap }) || MAPS[0])
    : mapMode === "rotate"
      ? selectMap({ seed, run: runNo })
      : (MAPS[Math.max(0, Math.min(MAPS.length - 1, Number(String(arenaId).replace(/\D/g, "")) - 1 || 0))] || MAPS[0]);
  state.mapId = chosenMap.id;
  state.mapName = chosenMap.name;

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
    pilotVel: { x: 0, z: 0 },
    moveVel: { x: 0, z: 0 },
    pilotMoving: false,
    pilotTimer: 0.4,
    pilotStrafe: 1,
    pilotWantsMove: false,
    enemyShotsFired: 0,
    spawnBodies: 0,
    spawnShooters: 0,
    enemyShotsHit: 0,
    incomingShot: null,
    odometer: 0,
    camPushMax: 0,
    bossDodgeMax: 0,
    bossDodgeAccum: 0,
    cardsPlayed: 0,
    bossSpawned: false,
    bossPaid: false,
    bossEnemy: null,
  });
  audioController?.playSfx("launch", { volume: 0.7 });
  audioController?.startAmbience?.();
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
    clearDamageNumbers();
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
  
  applyArenaLighting(chosenMap.id);
  setLightsEnabled(true);
  resetPickups();
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
  // Shooter ramp: early spawns are mostly melee-only bodies, and the share that can actually fire
  // climbs across the whole round (12 % at t=0, ~85 % by ~110 s).
  if (enemy) {
    // same rule as EnemyManager.spawn: never disarm a body whose only attack is its role
    const armedRole = enemy.type === "mortar" || enemy.type === "mech" || enemy.type === "gunship" || enemy.type === "sapper";
    enemy.canShoot = armedRole ? true : state.rng() < Math.min(0.85, 0.35 + beatDirector.runTime / 180);
    state.spawnBodies = (state.spawnBodies || 0) + 1;
    if (enemy.canShoot) state.spawnShooters = (state.spawnShooters || 0) + 1;
  }
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

// ── DELAYED ENEMY BLASTS ─────────────────────────────────────────────────────────────────────
// Mortar shells and planted sapper charges are the two enemy attacks with a fuse. They used to be
// resolved instantly against the distance to the ENEMY (so a shell could never land where it was
// aimed). A blast now carries its own ground position, a fuse, a radius, and a telegraph ring.
const pendingBlasts = [];
const blastRings = [];
{
  const geo = new THREE.RingGeometry(0.86, 1.0, 40);
  for (let i = 0; i < 10; i += 1) {
    const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xff7a4a, transparent: true, opacity: 0, depthWrite: false,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    ring.userData.tag = "blast-ring";
    scene.add(ring);
    blastRings.push({ mesh: ring, life: 0, maxLife: 1, expand: false, base: 1 });
  }
}
let blastRingCursor = 0;
function showBlastRing(x, z, radius, life, color, expand = false) {
  const slot = blastRings[blastRingCursor % blastRings.length];
  blastRingCursor += 1;
  slot.mesh.position.set(x, 0.035, z);
  slot.mesh.scale.setScalar(Math.max(0.3, radius));
  slot.mesh.material.color.setHex(color || 0xff7a4a);
  slot.mesh.material.opacity = expand ? 0.85 : 0.4;
  slot.mesh.visible = true;
  slot.life = life;
  slot.maxLife = life;
  slot.expand = expand;
}
function updateBlastRings(dt) {
  for (const slot of blastRings) {
    if (slot.life <= 0) continue;
    slot.life -= dt;
    if (slot.life <= 0) { slot.mesh.visible = false; continue; }
    const k = slot.life / slot.maxLife;
    if (slot.expand) {
      slot.mesh.scale.multiplyScalar(1 + dt * 3.2);
      slot.mesh.material.opacity = Math.min(0.85, k * 0.9);
    } else {
      slot.mesh.material.opacity = 0.18 + 0.28 * Math.abs(Math.sin(slot.life * 9));
    }
  }
}
/** Queue an explosion on the ground; damage is applied when the fuse reaches zero. */
function scheduleBlast(x, z, opts = {}) {
  const radius = Number(opts.radius) || 3;
  const fuse = Math.max(0.08, Number(opts.fuse) || 1.2);
  const color = opts.color || 0xff7a4a;
  pendingBlasts.push({ x, z, t: fuse, damage: Number(opts.damage) || 20, radius, color });
  showBlastRing(x, z, radius, fuse, color, false);
  return pendingBlasts[pendingBlasts.length - 1];
}
function updateBlasts(dt) {
  for (let i = pendingBlasts.length - 1; i >= 0; i -= 1) {
    const b = pendingBlasts[i];
    b.t -= dt;
    if (b.t > 0) continue;
    if (state.phase === "playing") {
      const d = Math.hypot(state.pos.x - b.x, state.pos.z - b.z);
      if (d <= b.radius) hurt(b.damage);
    }
    showBlastRing(b.x, b.z, b.radius, 0.45, b.color, true);
    state.blastsDetonated = (state.blastsDetonated || 0) + 1;
    audioController?.playSfx("impact_heavy", { volume: 0.35 });
    pendingBlasts.splice(i, 1);
  }
}
function clearBlasts() {
  pendingBlasts.length = 0;
  for (const slot of blastRings) { slot.life = 0; slot.mesh.visible = false; }
}

/** Weather + foliage tick. Runs in EVERY phase, because a frozen rainfield in the bay looked
 *  exactly like a broken game: the camera turned but nothing in the world moved. */
function updateEnvironment(dt) {  for (let i = 0; i < RAIN; i++) {
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
  const styleKey = weaponManager.active?.styleKey || "spray";
  if (!state.attractSim) {
    audioController?.playSfx(vfx.sound, { volume: 0.5, pitch: vfx.pitch * (0.96 + state.rng() * 0.08) });
  }

  // FX-03: per-style camera kick, authored in screen pixels (<=2 px) and converted to world units
  // at the live camera distance. The jitter comes from the run RNG, so it is reproducible per seed.
  const impulse = kickImpulse(styleKey, state.rng);
  if (state.camKick) {
    const camDist = Math.max(1, camera.position.distanceTo(state.pos));
    const worldPerPx = (2 * Math.tan((camera.fov * Math.PI) / 360) * camDist) / Math.max(1, globalThis.innerHeight || 1080);
    state.camKick.x += impulse.x * worldPerPx;
    state.camKick.y += impulse.y * worldPerPx;
    state.camKick.roll += impulse.roll;
    state.camKick.recover = impulse.recover;
  }
  state.kickShots = (state.kickShots || 0) + 1;

  // FX-02: ballistic styles throw a case out of the ejection port; energy/thrown styles no-op.
  // vShotDir is reused so a shot allocates no vector (the case pool is pre-built).
  if (!state.attractSim) {
    vShotDir.subVectors(vTarget, vMuzzle).normalize();
    casings.eject(vMuzzle, vShotDir, styleKey);
  }

  // Spawn tracers + Travelling Light-Orb Projectiles
  const pelletCount = fireData.pellets || 1;
  const darkBoost = Math.max(state.darknessFactor || 0, state.blackoutActive ? 1 : 0);
  // A travelling light orb is a weapon identity, not a bullet: only light-orb guns and the
  // light-orb mod get one. It used to be attached to every tracer, so an SMG fired 0.4 m glowing
  // spheres that read as a rendering glitch (see the playtest shots in docs/QA).
  const showsOrb = !state.attractSim
    && (weaponManager.hasLightOrbMod || isLightGunStyle(styleKey));
  const orbScaleBase = (weaponManager.hasLightOrbMod ? 1.25 : 0.85) * (1 + darkBoost * 0.45);
  // a tracer is a 70 ms flash, not a 160 ms beam; the long glow made every shot read as a laser
      const orbLife = Math.max(fireData.tracerLife, 0.07 + darkBoost * 0.05 + (weaponManager.hasLightOrbMod ? 0.04 : 0));

  for (let p = 0; p < pelletCount; p++) {
    const tracer = tracers.find((t) => t.life <= 0);
    if (tracer) {
      const spreadAngle = (state.rng() - 0.5) * fireData.spread * (Math.PI / 180);
      const dir = new THREE.Vector3().subVectors(vTarget, vMuzzle).normalize();
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
      const travelDist = Math.min(18, Math.max(4, vMuzzle.distanceTo(vTarget) + 0.6));
      const endPos = vMuzzle.clone().add(dir.clone().multiplyScalar(travelDist));
      tracer.start.copy(vMuzzle);
      tracer.end.copy(endPos);
      tracer.dir.subVectors(endPos, vMuzzle).normalize();
      tracer.color = fireData.tracerColor;
      tracer.maxLife = orbLife;
      tracer.life = orbLife;

      tracer.mesh.position.copy(vMuzzle).add(endPos).multiplyScalar(0.5);
      tracer.mesh.lookAt(endPos);
      const tracerWidth = state.attractSim ? 0.24 : (1 + darkBoost * 0.6) * vfx.tracer * 0.55;
      // BOLT LENGTH: a tracer is a short streak that crosses the gap, not a beam that appears
      // full-length for a frame. The head travels start -> end across the tracer's life.
      tracer.len = state.attractSim ? 2.6 : Math.min(3.6, Math.max(1.1, travelDist * 0.42));
      tracer.mesh.scale.set(tracerWidth, tracerWidth, tracer.len);
      tracer.baseWidth = tracerWidth;
      tracer.feelKey = weaponManager.active?.styleKey;
      tracer.mesh.material.color.setHex(vfx.color);
      tracer.mesh.visible = true;

      if (tracer.orb) {
        tracer.orb.position.copy(vMuzzle);
        tracer.orb.scale.setScalar(orbScaleBase);
        tracer.orb.material.color.setHex(fireData.tracerColor);
        tracer.orb.visible = showsOrb;
      }
    }
  }

  flash.position.copy(vMuzzle);
  if (flash.material && flash.material.color) flash.material.color.setHex(vfx.color);
  flash.scale.setScalar((fireData.muzzleFlashSize / 0.24) * vfx.flash * 0.6);
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
  const cfgPierce = Number(weaponManager.active?.config?.shieldPierce) || 0;
  const shieldPierce = isGrenade ? 1 : Math.max(explosive ? 0.55 : 0, cfgPierce);
  const talentDmg = state.talentMods?.damageMult || 1;
  let effectiveDamage = Math.round(fireData.damage * litBonusMult * (explosive ? 1.15 : 1) * talentDmg * (state.powerMult || 1));
  // WPN-01: anti-air rounds hurt what is overhead and barely scratch what is on the floor.
  // (Ordered after effectiveDamage is initialised — this used to read it a line too early.)
  const airMult = Number(weaponManager.active?.config?.airDamageMult) || 0;
  if (airMult > 0) {
    const isAirTarget = (target.mesh?.position?.y || 0) > 2.2;
    effectiveDamage = Math.round(effectiveDamage * (isAirTarget ? airMult : 0.45));
  }
  let damageDealt = 0;
  if (fireData.pierceCount > 0) {
    // Pierce: the target itself, then up to pierceCount enemies behind it. The old filter required
    // proj > 0 measured from the TARGET, so the target's own projection was 0 and got excluded —
    // a pierce weapon only ever damaged enemies lined up behind the thing it was aiming at.
    const dir = new THREE.Vector3().subVectors(target.mesh.position, vMuzzle).normalize();
    const enemiesInLine = enemyManager.getEnemies().filter((e) => {
      if (e === target) return true;
      const toEnemy = new THREE.Vector3().subVectors(e.mesh.position, target.mesh.position);
      const proj = toEnemy.dot(dir);
      const perp = toEnemy.clone().sub(dir.clone().multiplyScalar(proj)).length();
      return proj > 0.35 && perp < 1.1;
    }).slice(0, fireData.pierceCount + 1);

    for (const enemy of enemiesInLine) {
      const result = enemyManager.damageEnemy(enemy, effectiveDamage, isGrenade, 0, shieldPierce);
      if (!state.attractSim) {
        const hy = 1.05 + (enemy.mesh?.scale?.y || 1) * 0.2;
        spawnImpact(enemy.position.x, hy, enemy.position.z, vfx.color, result.killed ? 9 : 4, result.killed ? 1.3 : 1);
        if (result.killed) showBlastRing(enemy.position.x, enemy.position.z, 0.9, 0.32, 0xff6a4a, true);
      }
  // AUD-04 wiring: pick the impact timbre by what the shot actually hit
  if (result !== undefined && !state.attractSim) {
    const blocked = enemy.type === "shieldbearer" && enemy.isShielded && !isGrenade && shieldPierce === 0;
    audioController?.playSfx(blocked ? "impact_shield"
      : (effectiveDamage >= 40 ? "impact_heavy" : "impact_light"), { volume: blocked ? 0.5 : 0.3 });
  }
      damageDealt += effectiveDamage;
      if (!state.attractSim) spawnDamageNumber(enemy.position.x, 1.75 + (enemy.mesh?.scale?.y || 1) * 0.3, enemy.position.z, effectiveDamage, { crit: effectiveDamage >= 40, kill: result.killed });
      if (result.killed) {
        state.kills++;
        noteKill(enemy.type);
        scoreSystem.recordKill(enemy.getScoreValue());
        cardSystem.addXp(TUNING.progression.xpPerKill || 10);
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
        if (!state.attractSim) {
          spawnDamageNumber(best.position.x, 1.75, best.position.z, dmg, { kill: result.killed });
          spawnImpact(best.position.x, 1.15, best.position.z, vfx.color, result.killed ? 8 : 4, result.killed ? 1.3 : 1);
          if (result.killed) showBlastRing(best.position.x, best.position.z, 0.9, 0.32, 0xff6a4a, true);
        }
        if (result.killed) {
          state.kills++;
          noteKill(best.type);
          scoreSystem.recordKill(best.getScoreValue());
          cardSystem.addXp(TUNING.progression.xpPerKill || 10);
        }
      }
    }
  } else {
    // Single shot (uses effectiveDamage so anti-air/lit/explosive modifiers actually apply)
    const result = enemyManager.damageEnemy(target, effectiveDamage, isGrenade, 0, shieldPierce);
    damageDealt = effectiveDamage;
    if (!state.attractSim) {
      spawnDamageNumber(target.position.x, 1.8, target.position.z, effectiveDamage, { crit: effectiveDamage >= 40, kill: result.killed });
      spawnImpact(target.position.x, 1.15, target.position.z, vfx.color, result.killed ? 10 : 5, result.killed ? 1.4 : 1);
      if (result.killed) showBlastRing(target.position.x, target.position.z, 1.0, 0.34, 0xff6a4a, true);
    }
    if (result.killed) {
      state.kills++;
      noteKill(target.type);
      audioController?.playSfx("kill", { volume: 0.6, pitch: 0.95 + state.rng() * 0.1 });
      scoreSystem.recordKill(target.getScoreValue());
      cardSystem.addXp(TUNING.progression.xpPerKill || 10);
      state.runXp = (state.runXp || 0) + target.getXpValue() * 1.5;
    }
  }

  scoreSystem.recordDamage(damageDealt);
  state.lastShot = {
    style: weaponManager.active && weaponManager.active.styleKey,
    fireDamage: fireData.damage,
    effectiveDamage,
    dealt: damageDealt,
    target: target && target.type,
    pierceCount: fireData.pierceCount || 0,
    pellets: fireData.pellets || 1,
  };
  if (damageDealt > 0) {
    state.hitMarker = 0.12;
    state.hitMarkerKill = Boolean(state.killFlash);
    state.killFlash = false;
    // MATH-04: damage converts to card XP at the tuned rate (pacing constants live in tuning.js)
    cardSystem.addXp(damageDealt * (TUNING.progression.xpPerDamage || 0));
  }
}

/** Kill feed entry (HUD): newest first, at most three. */
function noteKill(type) {
  state.killFlash = true;
  state.killFeed = state.killFeed || [];
  state.killFeed.unshift({ text: String(type || "hostile").toUpperCase() + " DOWN", t: 2.6 });
  state.killFeed.length = Math.min(state.killFeed.length, 3);
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
  if (!state.attractSim) spawnDamageNumber(soldier.position.x + 0.6, 2.55, soldier.position.z, amount, { player: true });
  audioController?.playSfx("hurt", { volume: 0.45, pitch: 1.0 });
  globalThis.__studio?.hud?.flash("#e5313b", 0.22);
  if (state.health <= 0) {
    // The run ends here. It has to land on "results" (not "dead") or the results screen and the
    // between-run summary never appear — that is the MGR-09 path.
    state.phase = "results";
    audioController?.stopAmbience?.();
    barks.trigger("died");
    state.showResults = true;
    audioController?.playSfx("death", { volume: 0.8 });
    if (!state.banked) { state.banked = true; bankRun(Boolean(state.arenaCleared)); }
    state.resultsScreen = new ResultsScreen(scoreSystem, beatDirector.runTime, state.health, beatDirector.currentBeatIndex, Boolean(state.arenaCleared));
    state.cardPickWindow = false;
    state.showCards = false;
    if (state.currentCardOptions) cardTray.hide();
    globalThis.__studio?.hud?.flash("#e5313b", 0.55);
    syncHud();
  }
}

const held = (ctx, names) => names.some((name) => ctx.keys.has(name));

function update(dt, ctx) {
  // QA-only slow motion (?test=1 + __forgeSmokeTest.setTimeScale). A normal run never sets this.
  if (state.timeScale && state.timeScale !== 1) dt *= state.timeScale;
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
    // NOTE: beatDirector.update(dt) advances runTime itself. The extra += that used to be here made
    // the whole game clock run at 2x (beats, difficulty, XP/s, boss threshold); removed.

    // spotter paint wears off
    if (state.painted) {
      state.paintedTimer = (state.paintedTimer || 0) - dt;
      if (state.paintedTimer <= 0) state.painted = false;
    }

    updatePickups(dt);

    // HUD transients: hit marker and kill feed
    if (state.hitMarker > 0) state.hitMarker = Math.max(0, state.hitMarker - dt);
    if (state.killFeed && state.killFeed.length) {
      for (const entry of state.killFeed) entry.t -= dt;
      state.killFeed = state.killFeed.filter((entry) => entry.t > 0);
    }

    // MATH-04: a clean run still earns card XP from time survived (tuned in tuning.js)
    cardSystem.addXp(dt * (TUNING.progression.xpPerSecond || 0));

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
      if (c.wantsMove) {
        const steered = steerAroundObstacles(state.pos, c.mx, c.mz, 0.55, arenaColliders);
        mx = steered.x; mz = steered.z;
      } else {
        mx = 0; mz = 0;
      }
      state.pilotMode = c.mode;
      state.pilotDistance = c.distance;
      state.pilotThrottle = c.throttle ?? 0;
      state.pilotWantsMove = Boolean(c.wantsMove);
      // aim the body at the target, not at the strafe: a fighter that spins to face its movement
      // cannot hold a firing line, and it made the shield's front slot impossible to define
      state.pilotAimYaw = Number.isFinite(c.targetX)
        ? Math.atan2(c.targetX - state.pos.x, c.targetZ - state.pos.z)
        : null;
    }

    {
      // Smooth, eased movement: the pilot publishes a direction + throttle, the body accelerates
      // toward that velocity instead of snapping. A hold (throttle 0) eases to a stop.
      const speed = (weaponManager.active.styleKey === "spinup" && weaponManager.active.spinupProgress > 0
        ? TUNING.player.baseSpeed * TUNING.player.aimModeSpeedMult * TUNING.player.spinupSpeedMult
        : state.aimMode
          ? TUNING.player.baseSpeed * TUNING.player.aimModeSpeedMult
          : TUNING.player.baseSpeed) * (state.autopilot ? (state.pilotThrottle ?? 1) : 1) * (state.speedMult || 1);
      const len = Math.hypot(mx, mz);
      const wantX = len > 1e-6 ? (mx / len) * speed : 0;
      const wantZ = len > 1e-6 ? (mz / len) * speed : 0;
      const vel = state.moveVel || (state.moveVel = { x: 0, z: 0 });
      const prevX = vel.x;
      const prevZ = vel.z;
      const k = 1 - Math.exp(-dt * (state.autopilot ? 10 : 22));
      vel.x += (wantX - vel.x) * k;
      vel.z += (wantZ - vel.z) * k;
      // smoothness evidence: per-frame velocity change, and how many tactical holds happened
      const dv = Math.hypot(vel.x - prevX, vel.z - prevZ);
      state.maxFrameAccel = Math.max(state.maxFrameAccel || 0, dv);
      if (state.pilotMode === "hold" && state._lastPilotMode !== "hold") state.holdBeats = (state.holdBeats || 0) + 1;
      state._lastPilotMode = state.pilotMode;
      const mag = Math.hypot(vel.x, vel.z);
      if (mag > 0.02) {
        const step = mag * dt;
        // CONTACT SLIDE: walking straight into a container used to cancel the whole step, so the
        // fighter pinned himself on cover and read as stuck. Resolve the step, then re-apply the
        // part of the velocity that is tangential to the surface and take the slide.
        const wantX = state.pos.x + vel.x * dt;
        const wantZ = state.pos.z + vel.z * dt;
        const probe = _moveProbe.set(wantX, 0, wantZ);
        const hitObstacle = resolveObstacleCollision(probe, 0.55, arenaColliders);
        if (hitObstacle) {
          let nx = probe.x - wantX;
          let nz = probe.z - wantZ;
          const nl = Math.hypot(nx, nz);
          if (nl > 1e-4) {
            nx /= nl; nz /= nl;
            const into = vel.x * nx + vel.z * nz;
            if (into < 0) {
              vel.x -= nx * into;
              vel.z -= nz * into;
              state.pos.x = probe.x + vel.x * dt;
              state.pos.z = probe.z + vel.z * dt;
              resolveObstacleCollision(state.pos, 0.55, arenaColliders);
            } else {
              state.pos.x = probe.x;
              state.pos.z = probe.z;
            }
          } else {
            state.pos.x = probe.x;
            state.pos.z = probe.z;
          }
        } else {
          state.pos.x = wantX;
          state.pos.z = wantZ;
        }
        // RIM SLIDE: at the arena edge, keep the tangential component so a held key slides along
        // the boundary instead of shoving the fighter into an invisible wall.
        const radius = Math.hypot(state.pos.x, state.pos.z);
        if (radius > TUNING.player.arenaRadius) {
          const ux = state.pos.x / radius;
          const uz = state.pos.z / radius;
          const outward = vel.x * ux + vel.z * uz;
          if (outward > 0) {
            vel.x -= ux * outward;
            vel.z -= uz * outward;
          }
          state.pos.x = ux * TUNING.player.arenaRadius;
          state.pos.z = uz * TUNING.player.arenaRadius;
        }
        state.odometer = (state.odometer || 0) + step;
        if (state.bossWarning > 0) {
          state.bossDodgeAccum = (state.bossDodgeAccum || 0) + step;
          state.bossDodgeMax = Math.max(state.bossDodgeMax || 0, state.bossDodgeAccum);
        }
        dustTimer -= dt;
        if (dustTimer <= 0 && mag > 1.0 && state.phase === "playing") {
          dustTimer = 0.14;
          spawnDust(state.pos.x, state.pos.z);
        }
      }
      // the metric only counts a body that was told to move and still had not moved after 3 frames
      // (the easing makes the first frames after a hold legitimately slow)
      if (state.pilotWantsMove) state.pilotMoveFrames = (state.pilotMoveFrames || 0) + 1;
      else state.pilotMoveFrames = 0;
      if (state.autopilot && state.pilotWantsMove && state.pilotMoveFrames > 3 && mag < 0.05) {
        state.zeroMoveFrames = (state.zeroMoveFrames || 0) + 1;
      }
      // face the aim target while standing; face the move direction in manual control
      const desiredYaw = Number.isFinite(state.pilotAimYaw) && state.autopilot
        ? state.pilotAimYaw
        : (mag > 0.15 ? Math.atan2(vel.x, vel.z) : state.yaw);
      let turn = desiredYaw - state.yaw;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      state.yaw += turn * Math.min(1, dt * TUNING.player.bodyYawSmoothing);
    }
    soldier.position.copy(state.pos);
    soldier.rotation.y = state.yaw;
    playerShadow.position.set(state.pos.x, 0.02, state.pos.z);

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
    // darkness tops out at 70 % so the arena stays readable: 88 % turned the map into a black screen
  const dimMult = 1 - (state.darknessFactor || 0) * 0.7;
  // the operator stays readable in a wave: fill rises as the arena dims
  if (typeof operatorFill !== "undefined") operatorFill.intensity = 2.2 + (state.darknessFactor || 0) * 5.5;
    if (!lightsOff) {
      hemi.intensity = cfg.hemisphere.intensity * dimMult;
      sun.intensity = cfg.sun.intensity * dimMult;
      scene.fog.density = cfg.fog.density * (1 + (state.darknessFactor || 0) * 0.35);
      // the environment reflection dims with the lamps, or a blackout wave would still show steel
      scene.environmentIntensity = ENV_INTENSITY * (0.35 + 0.65 * dimMult);
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
        beamCone.material.opacity = (0.018 + dark * 0.05) * (weaponManager.hasFloodlightMod ? 1.2 : 1.0);
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
        // The airdrop used to set cardPickWindow WITHOUT a timer or a tray. The 10 s auto-pick then
        // called pickCard on an empty level-up queue, returned early, and left the card system
        // stuck for the rest of the run (no tray, no more cards). It is a full card window now.
        state.airdropState = beatDirector.getAirdropState();
        state.currentCardOptions = event.options;
        state.cardPickSource = "airdrop";
        state.cardPickWindow = true;
        state.showCards = true;
        state.cardPickTimer = 10;
        cardTray.show(event.options);
        cardTray.setCountdown(10);
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
    const enemyActions = enemyManager.update(dt, state.pos, beatDirector.runTime / 60, state.yaw);
    for (const { enemy, action } of enemyActions) {
      // Enemy attacks were all stubs before: only melee ever reached the player, so an autonomous
      // pilot that held range could never lose. Each action now does what its archetype promises,
      // with line-of-sight for ranged fire and a range gate for the close attacks.
      const d = Math.hypot(enemy.position.x - state.pos.x, enemy.position.z - state.pos.z);
      const los = !segmentHitsCollider(state.pos.x, state.pos.z, enemy.position.x, enemy.position.z);
      const cfg = enemy.config || {};
      if (action.type === "melee") {
        hurt(action.damage || cfg.meleeDamage || 9);
      } else if (action.type === "rangedShot") {
        if (los && d < 18) {
          spawnEnemyShot(enemy, action.damage || 9, action.speed || 12, action.color || 0xff7a4a, Boolean(action.isSniper));
        }
      } else if (action.type === "dive") {
        if (d < 3.2) hurt(cfg.diveDamage || 18);
      } else if (action.type === "shell") {
        // the shell lands where it was aimed, after its fuse; standing in the ring hurts
        scheduleBlast(action.targetX ?? state.pos.x, action.targetZ ?? state.pos.z, {
          damage: action.damage || cfg.shellDamage || 30,
          radius: action.radius || cfg.shellRadius || 4,
          fuse: action.fuse || cfg.shellFuse || 1.2,
          color: 0xff9a3c,
        });
      } else if (action.type === "stomp") {
        if (d < (cfg.stompRadius || 3)) hurt(cfg.stompDamage || 50);
      } else if (action.type === "minigun") {
        if (los && d < 18) spawnEnemyShot(enemy, cfg.minigunDamage || 12, 19, 0xffb347);
      } else if (action.type === "charge") {
        // planted charge: it detonates on its fuse at the planted point. The old code dealt the
        // damage instantly and only within 2.2 m of the sapper, so the fuse and radius were lies.
        scheduleBlast(action.x ?? enemy.position.x, action.z ?? enemy.position.z, {
          damage: action.damage || cfg.chargeDamage || 32,
          radius: action.radius || 3.4,
          fuse: action.fuse || cfg.chargeFuse || 2.0,
          color: 0xffb347,
        });
      } else if (action.type === "paint") {
        state.painted = true;
        state.paintedTimer = cfg.paintDuration || 5;
      }
    }

    // Handle spawning (a test can freeze the director to isolate one archetype)
    const beat = beatDirector.getCurrentBeat();
    if (state.spawnsEnabled !== false) enemyManager.updateSpawning(dt, state.pos, beat);

    // Targeting (auto-orient Operator & Gun Floodlight toward nearest threat)
    // anti-air: helicopters sit high, so acquire them from further out and pitch the gun at them
    const anyAir = state.phase === "playing" &&
      enemyManager.enemies.some((e) => e.mesh && e.mesh.position.y > 2.2);
    let target = state.phase === "playing" ? nearest(anyAir ? 36 : 24) : null;
    // A live boss outranks the adds — always. Gating this on distance made the gun drop the boss
    // whenever it drifted past the gate and go back to chewing riflemen, so a run could never clear.
    if (state.phase === "playing" && state.bossEnemy && state.bossEnemy.hp > 0
      && enemyManager.enemies.includes(state.bossEnemy)) {
      target = state.bossEnemy;
    }
    if (target) {
      const dy = target.mesh.position.y - 1.15;
      const dxz = Math.hypot(target.mesh.position.x - state.pos.x, target.mesh.position.z - state.pos.z) || 1;
      // three.js: negative X pitch tips the muzzle upward
      const wantPitch = dy > 2.0 ? -Math.atan2(dy, dxz) : 0;
      gunPivot.rotation.x += (wantPitch - gunPivot.rotation.x) * Math.min(1, dt * 6);
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
    // TUNE-02: boss threshold was 75 s / 18 kills, which every run reached (100 %). At 105 s / 70
    // kills it lands in roughly half of runs, which is the target, and it is still a mid-run event.
    // With the early shooter ramp the median run is now ~70-80 s, so a 75 s / 75 kill gate made
    // the boss a coin flip. 65 s / 60 kills keeps it a mid-run event without weakening the fight.
    if (!state.bossSpawned && (beatDirector.runTime > 65 || state.kills >= 60)) {
      state.bossSpawned = true;
      const kind = state.arenaBossKind || (state.kills % 2 === 0 ? "mech" : "gunship");
      // force: the boss must exist even when the arena is already at the body cap, or the run
      // silently never gets a boss and can never be cleared.
      const boss = enemyManager.spawn(kind, state.pos, beatDirector.runTime / 60, true);
      if (boss) {
        const bossLevel = (state.cyborgProfile && state.cyborgProfile.level) || 1;
        // TUNE-04: aerial boss uses its own HP budget (8-15 s TTK); ground bosses keep bossHp()
        if (kind === "gunship") {
          const gcfg = TUNING.boss.gunship;
          boss.hp = Math.round((gcfg.hp || 1100) * (1 + 0.12 * Math.max(0, bossLevel - 1)));
        } else {
          boss.hp = Math.round(bossHp(boss.config?.hp || boss.hp, bossLevel) * (TUNING.boss.hpScale ?? 0.4));
        }
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
      // TUNE-04: a gunship only fires inside its attack range, from altitude
      const isAirBoss = b.type === "gunship";
      const inAttackRange = !isAirBoss || dist <= (TUNING.boss.gunship.attackRange || 26);
      if (state.bossTimer > 6 && inAttackRange) {
        state.bossTimer = 0;
        state.bossWarning = 1.4;              // telegraph window
        state.bossDodgeAccum = 0;             // MOV-04: measure this telegraph's displacement
      }
      if (state.bossWarning > 0) {
        state.bossWarning = Math.max(0, state.bossWarning - dt);
        globalThis.__studio?.hud?.flash("#F2545B", 0.12);
        if (state.bossWarning === 0) {
          // salvo lands: heavy damage in a close band, lighter further out
          const dmg = dist < 8 ? 30 : dist < 14 ? 16 : 6;
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
        // Killing the boss IS the clear. The old definition (survive to the ~12 minute overtime
        // line) could never fire in a 100 s run, so clear% was pinned at 0 by construction.
        state.arenaCleared = true;
        barks.trigger("boss_kill");
        const prof = state.cyborgProfile || {};
        prof.talentPoints = (prof.talentPoints ?? 0) + 1;
        state.cyborgProfile = saveProfile(prof);
        globalThis.__studio?.hud?.flash("#7CE6A8", 0.4);
        audioController?.playSfx("levelup", { volume: 0.8 });
      }
    }

    updateEnemyShots(dt);
    updateImpactSparks(dt);
    updateBlasts(dt);
    updateBlastRings(dt);
    updateEnemyRings();
    updateDust(dt);
    updateGrenades(dt);
    casings.update(dt);

    // Check for card queue
    if (cardSystem.queuedCards.length > 0 && !state.cardPickWindow) {
      state.currentCardOptions = cardSystem.queuedCards[0];
      state.cardPickSource = "level";
      state.cardPickWindow = true;
      state.showCards = true;
      state.cardPickTimer = 10;
      cardTray.show(state.currentCardOptions);
      cardTray.setCountdown(10);
    }

    // Card timer: 10 s to choose, then auto-pick
    if (state.cardPickWindow && state.currentCardOptions) {
      state.cardPickTimer = Math.max(0, (state.cardPickTimer ?? 10) - dt);
      cardTray.setCountdown(state.cardPickTimer);
      if (state.cardPickTimer <= 0) {
        pickCard(0);
        globalThis.__studio?.hud?.flash("#ffb347", 0.12);
      }
    }

    // Camera — arcade broadcast director (cuts + slow pushes, always framing the action)
    {
      // the camera frames the BOSS when one is alive: an assault gunship at 6 m was never in
      // shot because the nearest ground body owned the framing
      const bossAlive = state.bossEnemy && state.bossEnemy.hp > 0 && enemyManager.getEnemies().includes(state.bossEnemy);
      const hostile = bossAlive ? state.bossEnemy : nearestHostileTo(state.pos.x, state.pos.z);
      broadcast.lastKills = state.kills;
      broadcast.timer -= dt;
      // Drone cam: hold a shot for a long time and glide to the next one; never cut on kills.
      if (!broadcast.lock && broadcast.timer <= 0) {
        pickBroadcastShot();
      }
      const fwdX = Math.sin(state.yaw || 0);
      const fwdZ = Math.cos(state.yaw || 0);
      // action point: between the operator and the nearest hostile (or the boss)
      let ax = state.pos.x;
      let az = state.pos.z;
      if (hostile) {
        // only let a hostile pull the frame if it is close enough to be in shot; a distant target
        // was dragging the look point off into the dark
        const hd = Math.hypot(hostile.position.x - state.pos.x, hostile.position.z - state.pos.z);
        const w = Math.min(0.34, Math.max(0.10, 0.34 - hd / 60));
        ax = state.pos.x * (1 - w) + hostile.position.x * w;
        az = state.pos.z * (1 - w) + hostile.position.z * w;
      }
      // CAMERA PASS: every shot pulled back from the old distances (7.4-12.5 m at 3-9.6 m of
      // height) which drew the fighter ~100 px tall in a dark arena. These keep the operator at
      // roughly a quarter of the frame height, so the rig, the weapon and the hit reactions read.
      if (broadcast.shot === "chase") {
        const a = (state.orbit || 0) + 0.6;
        vDesired.set(state.pos.x + Math.sin(a) * 5.4, 3.15, state.pos.z + Math.cos(a) * 5.4);
        broadcast.look.set(state.pos.x, 1.25, state.pos.z);
      } else if (broadcast.shot === "orbit") {
        const a = (state.orbit || 0) + 1.9;
        vDesired.set(state.pos.x + Math.sin(a) * 6.2, 2.5, state.pos.z + Math.cos(a) * 6.2);
        broadcast.look.set(ax, 1.15, az);
      } else if (broadcast.shot === "sideline") {
        // stand off perpendicular to the player→hostile axis, like a touchline camera
        let px = -fwdZ;
        let pz = fwdX;
        if (hostile) {
          const dx = hostile.position.x - state.pos.x;
          const dz = hostile.position.z - state.pos.z;
          const len = Math.hypot(dx, dz) || 1;
          px = -dz / len;
          pz = dx / len;
        }
        vDesired.set(ax + px * 6.6, 2.1, az + pz * 6.6);
        broadcast.look.set(ax, 1.1, az);
      } else if (broadcast.shot === "wide") {
        vDesired.set(ax + Math.sin(state.orbit || 0) * 9.2, 6.2, az + Math.cos(state.orbit || 0) * 9.2);
        broadcast.look.set(ax, 1.0, az);
      } else {
        // hero: low, in front of the operator, looking back at him
        vDesired.set(state.pos.x + fwdX * 4.1, 1.55, state.pos.z + fwdZ * 4.1);
        broadcast.look.set(state.pos.x, 1.35, state.pos.z);
      }
      // AERIAL FRAMING: an assault gunship sits at 6.4 m, above every ground shot. Frame the
      // midpoint between the operator and the aircraft so both are in the same picture.
      const hostileY = hostile && hostile.mesh ? hostile.mesh.position.y : 1.2;
      if (hostileY > 3.2) {
        // stand off PERPENDICULAR to the player->aircraft axis so both fit in one frame
        const mx = (state.pos.x + hostile.position.x) * 0.5;
        const mz = (state.pos.z + hostile.position.z) * 0.5;
        const axX = hostile.position.x - state.pos.x;
        const axZ = hostile.position.z - state.pos.z;
        const axis = Math.hypot(axX, axZ) || 1;
        const px = -axZ / axis;
        const pz = axX / axis;
        const dist = Math.max(9, Math.min(17, axis * 0.85));
        vDesired.set(mx + px * dist, 6.4, mz + pz * dist);
        broadcast.look.set(mx, 3.6, mz);
      }
      // the gentle float belongs on the TARGET, not added after the blend: adding 5 cm a frame to
      // a position that is then only 3 % blended back left the camera floating ~1.8 m high.
      vDesired.y += Math.sin((state.t || 0) * 0.7) * 0.12;
      // Keep the camera out of cover. Trace the player→camera line and pull in to the first
      // blocker; the old code let the hero shot sit inside a brand board (its back filled the view).
      {
        const dx = vDesired.x - state.pos.x;
        const dz = vDesired.z - state.pos.z;
        const full = Math.hypot(dx, dz) || 1;
        const hit = segmentHitsCollider(state.pos.x, state.pos.z, vDesired.x, vDesired.z, arenaColliders);
        const boardHit = !hit && cameraTraceBlocked(state.pos.x, state.pos.z, vDesired.x, vDesired.z, vDesired.y);
        if (hit || boardHit) {
          const hitDist = hit ? Math.hypot(hit.x - state.pos.x, hit.z - state.pos.z) : 0;
          const f = hit ? Math.max(0.34, (hitDist - 0.8) / full) : 0.42;
          vDesired.x = state.pos.x + dx * f;
          vDesired.z = state.pos.z + dz * f;
          vDesired.y = Math.max(1.35, vDesired.y * (0.6 + f * 0.4));
        }
        if (full < 2.2) vDesired.y = Math.max(vDesired.y, 1.2);
        // keep the camera inside the arena wall: at the rim the chase shot would otherwise sit
        // outside the ring and film the back of the wall
        const vr = Math.hypot(vDesired.x, vDesired.z);
        const camEdge = (TUNING.player.arenaRadius || 54) - 1.2;
        if (vr > camEdge) {
          vDesired.x *= camEdge / vr;
          vDesired.z *= camEdge / vr;
        }
      }
      // drone pacing: a sane follow rate and a speed ceiling that cannot teleport the view, but
      // also cannot take 4 s to catch a shot change while the fighter walks out of the frame.
      const follow = 1 - Math.exp(-dt * 3.4);
      camera.position.lerp(vDesired, follow);
      if (!broadcast.lookSmooth) broadcast.lookSmooth = broadcast.look.clone();
      broadcast.lookSmooth.lerp(broadcast.look, 1 - Math.exp(-dt * 4.2));
      if (_camPrev.lengthSq() > 0) {
        const dx = camera.position.x - _camPrev.x;
        const dy = camera.position.y - _camPrev.y;
        const dz = camera.position.z - _camPrev.z;
        const dist = Math.hypot(dx, dy, dz);
        const cap = Math.max(0.12, dt * 18);
        if (dist > cap) {
          const s = cap / dist;
          camera.position.set(_camPrev.x + dx * s, _camPrev.y + dy * s, _camPrev.z + dz * s);
        }
      }
      _camPrev.copy(camera.position);
      camera.lookAt(broadcast.lookSmooth);
      // QA-only fixed camera (see freeCam in the test hooks)
      if (state.debugCam) {
        camera.position.set(...state.debugCam.pos);
        camera.lookAt(...state.debugCam.look);
      }
    }

    // FX-03: camera kick — applied after lookAt so the roll survives, then decayed per style
    {
      const kick = state.camKick;
      if (kick) {
        camera.position.x += kick.x;
        camera.position.y += kick.y;
        camera.rotation.z += kick.roll;
        const kDecay = Math.exp(-dt * (kick.recover || 10));
        kick.x *= kDecay;
        kick.y *= kDecay;
        kick.roll *= kDecay;
      }
    }

    // speech bubble tracks the operator's head in screen space; it is a play-phase prop, so it is
    // hidden the moment the run ends (it used to float over the results panel)
    const head = new THREE.Vector3(state.pos.x, 2.45, state.pos.z).project(camera);
    if (head.z < 1 && state.phase === "playing") {
      barks.place((head.x * 0.5 + 0.5) * globalThis.innerWidth, (-head.y * 0.5 + 0.5) * globalThis.innerHeight);
    } else {
      barks.hide();
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

    // Check death — hurt() already ends the run, this covers direct health drains
    if (state.phase === "playing" && state.health <= 0) {
      state.phase = "results";
  audioController?.stopAmbience?.();
  barks.trigger(state.health <= 0 ? "died" : "clear_dead");
      state.showResults = true;
      audioController?.playSfx("death", { volume: 0.8 });
      if (!state.banked) { state.banked = true; bankRun(Boolean(state.arenaCleared)); }
      state.resultsScreen = new ResultsScreen(scoreSystem, beatDirector.runTime, state.health, beatDirector.currentBeatIndex, Boolean(state.arenaCleared));
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
    // FX-03: tracer taper — heavy styles thin to a needle, light styles stay fat and fade
    if (tracer.baseWidth) {
      const w = tracer.baseWidth * tracerTaper(tracer.feelKey, progress);
      tracer.mesh.scale.x = w;
      tracer.mesh.scale.y = w;
    }
    // the streak travels: its head crosses the gap in ~80 % of the tracer life, the tail trails
    if (tracer.len > 0) {
      const head = Math.min(1, progress * 1.25);
      tracer.mesh.position.lerpVectors(tracer.start, tracer.end, head);
      tracer.mesh.position.addScaledVector(tracer.dir, -tracer.len * 0.45);
    }
    if (tracer.orb) {
      tracer.orb.position.lerpVectors(tracer.start, tracer.end, Math.min(1, progress));
      if (activeOrbLights < orbLights.length && tracer.orb.visible) {
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

function closeCardWindow() {
  state.cardPickWindow = false;
  state.cardPickTimer = 0;
  state.showCards = false;
  state.currentCardOptions = null;
  state.cardPickSource = null;
  cardTray.hide();
}

function pickCard(index) {
  if (!state.currentCardOptions) return;
  const source = state.cardPickSource || "level";
  let option = null;

  if (source === "airdrop") {
    option = beatDirector.pickAirdrop(index, weaponManager);
    state.airdropState = null;
    if (!option) { closeCardWindow(); return; }
    // the director applies the part/weapon itself; the rig still has to show a new weapon
    if (option.type === "weapon" && option.style) {
      try {
        state.lastRenderedWeaponStyle = option.style;
        rifle = rebuildWeaponMesh(gunPivot, option.style, steel);
      } catch (e) { /* unknown style: keep the current rifle */ }
    }
  } else {
    option = cardSystem.pickCard(index);
    if (!option) { closeCardWindow(); return; }
    if (option.type === "weapon") {
      // The fighter is autonomous: it never presses Q, so a card that filled the inactive slot did
      // nothing at all. A weapon card now replaces the ACTIVE weapon and is rebuilt on the rig.
      try {
        weaponManager.replaceWeapon(weaponManager.activeSlot, option.style);
        state.lastRenderedWeaponStyle = option.style;
        rifle = rebuildWeaponMesh(gunPivot, option.style, steel);
      } catch (e) { /* keep the current weapon if the style is unknown */ }
    } else if (option.type === "part") {
      weaponManager.applyPart(weaponManager.activeSlot, option.part);
    }
    cardSystem.queuedCards.shift();
  }

  closeCardWindow();
  state.cardsPlayed = (state.cardsPlayed || 0) + 1;
  audioController?.playSfx("click", { volume: 0.5, pitch: 1.15 });
  barks.trigger("upgrade");
  weaponManager.syncReloadMeta(cardSystem.level, weaponManager.reloadUpgradesCount);

  // Check for evolution
  const activeWeapon = weaponManager.active;
  const evoId = activeWeapon.parts.length >= 2 ? checkEvolution(activeWeapon.styleKey, activeWeapon.parts.map(p => p.id)) : null;
  if (evoId) {
    scoreSystem.recordEvolution();
    // Apply evolution effect
  }
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

// ── COMBAT PREWARM ───────────────────────────────────────────────────────────────────────────
// Starting a run used to block the main thread for ~0.8 s: the first enemy rigs, the operator's
// weapon and the arena's prop materials all compiled their shaders on the launch frame. Build one
// of each body below the deck during the menu, render once, and throw the copies away.
function prewarmCombat() {
  if (state.phase === "playing") return;
  const warm = new THREE.Group();
  warm.position.set(0, -80, 0);
  warm.userData.tag = "prewarm";
  scene.add(warm);
  const built = [];
  for (const type of ["rifleman", "sapper", "shieldbearer", "spotter", "mech"]) {
    try {
      const mesh = buildEnemyMesh(type, enemyMaterials);
      warm.add(mesh);
      built.push(mesh);
    } catch (e) { /* a type that cannot pre-build simply warms the rest */ }
  }
  try {
    renderer.compile(scene, camera);
  } catch (e) { /* prewarm is best effort */ }
  scene.remove(warm);
  for (const mesh of built) {
    mesh.traverse((o) => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  }
}
setTimeout(prewarmCombat, 4500);

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
    const now = (globalThis.performance?.now?.() || 0) / 1000;
    const dmgDt = lastDmgFrame ? Math.min(0.05, Math.max(0.001, now - lastDmgFrame)) : 0.016;
    lastDmgFrame = now;
    updateDamageNumbers(camera, dmgDt);
    renderer.render(scene, camera);
  },
});