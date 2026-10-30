/**
 * Tactical Gunmetal & Amber Armory — Real Rigged Skeletal-Animated .GLB Characters, Enemies,
 * Two-Handed Shoulder-Mounted Weapons, Card-Gated Light Mods / Light Guns & Solid 3D Arena Colliders.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";
import { standardMaterial, bakeTexture } from "./materials.js?v=202610323y";
import { PALETTE, hexInt } from "./theme.js?v=202610323y";
import { mapById, PROP_COLLIDERS } from "./maps.js?v=202610323y";

export const PLAYER_SKINS = [
  {
    id: "olive",
    name: "FORGE-1 // OLIVE SPEC-OPS",
    shortName: "OLIVE SPEC-OPS",
    badge: "SPEC-OPS",
    clothPalette: [0x2a3123, 0x4b5340, 0x6b755b],
    armorPalette: [0x1c2224, 0x394345, 0x566366],
    bodyTint: 0xd8e4c8,
    visorHex: 0xffb347,
    accentHex: "#ffb347",
    desc: "Standard perimeter infantry rig · olive drab weave & amber optics",
  },
  {
    id: "nightfall",
    name: "NIGHTFALL // STEALTH RECON",
    shortName: "NIGHTFALL RECON",
    badge: "RECON",
    clothPalette: [0x0f1419, 0x1c252e, 0x2c3947],
    armorPalette: [0x141a1f, 0x263038, 0x3d4c59],
    bodyTint: 0x9fc5e8,
    visorHex: 0x4deeea,
    accentHex: "#4deeea",
    desc: "Low-signature night-ops chassis · carbon weave & cyan tri-optic NVG",
  },
  {
    id: "hazmat",
    name: "HAZMAT // BREACH ENGINEER",
    shortName: "HAZMAT BREACH",
    badge: "BREACHER",
    clothPalette: [0x5e3410, 0xb86b1e, 0xe09038],
    armorPalette: [0x1f2226, 0x3a3f47, 0x575e69],
    bodyTint: 0xffcf96,
    visorHex: 0x7ce6a8,
    accentHex: "#7ce6a8",
    desc: "Heavy demolition suit · hazard ochre plating & emerald respirator",
  },
  {
    id: "crimson",
    name: "CRIMSON // VANGUARD EXO",
    shortName: "CRIMSON EXO",
    badge: "VANGUARD",
    clothPalette: [0x380b0f, 0x6e1820, 0x9e2832],
    armorPalette: [0x2b3236, 0x525d63, 0x7c8b94],
    bodyTint: 0xf49a9a,
    visorHex: 0xffffff,
    accentHex: "#ff8d95",
    desc: "Experimental alloy exo-frame · chitin-weave & white-hot targeting visor",
  },
];

export const STARTER_LOADOUTS = [
  { id: "spray", name: "SMG // SPRAY", role: "BALLISTIC SUPPRESSION", color: "#ffd57a", isLightGun: false },
  { id: "cone", name: "SHOTGUN // CONE", role: "BREACH BUCKSHOT", color: "#ff8a4a", isLightGun: false },
  { id: "pierce", name: "MARKSMAN // PIERCE", role: "ARMOR-PIERCING RODS", color: "#6fe3ff", isLightGun: false },
  { id: "ricochet", name: "CARBINE // RICOCHET", role: "REBOUNDING BANK SHOTS", color: "#a6ff7a", isLightGun: false },
  { id: "burst", name: "BATTLE RIFLE // BURST", role: "3-ROUND PRECISION", color: "#ffe36f", isLightGun: false },
  { id: "beam", name: "NEON LASER // BEAM [LIGHT GUN]", role: "PHOTON LASER + LIGHT BLAST", color: "#4deeea", isLightGun: true },
  { id: "chain", name: "TESLA ARC // CHAIN [LIGHT GUN]", role: "ARC LIGHTNING + FLASH", color: "#c6a6ff", isLightGun: true },
  { id: "spinup", name: "MINIGUN // SPIN-UP", role: "ROTARY GATLING BARRAGE", color: "#ff5a5a", isLightGun: false },
  { id: "rail", name: "PHOTON RAIL // RAIL [LIGHT GUN]", role: "HYPER-LIGHT SLUG + NOVA", color: "#ffffff", isLightGun: true },
  { id: "flamer", name: "SOLAR PLASMA // FLAMER [LIGHT GUN]", role: "SOLAR FLARE IGNITER", color: "#ff6a2a", isLightGun: true },
  { id: "arc", name: "THUMPER // ARC", role: "LOBBED BLAST GRENADES", color: "#ff6fd6", isLightGun: false },
  { id: "sentry", name: "DEPLOYER // SENTRY", role: "AUTONOMOUS TURRET LINK", color: "#6fff9a", isLightGun: false },
  { id: "flak", name: "AA FLAK // FLAK", role: "AIRBURST - AIR ONLY", color: "#ffb347", isLightGun: false },
  { id: "breach", name: "BREACHER // BREACH", role: "CLOSE RANGE, SHIELD PIERCE", color: "#ff8a4a", isLightGun: false },
  { id: "rail2", name: "SIEGE RAIL // RAIL2", role: "3-TARGET PENETRATION", color: "#f2f8ff", isLightGun: true },
];

export function isLightGunStyle(styleKey) {
  return styleKey === "beam" || styleKey === "chain" || styleKey === "rail" || styleKey === "flamer";
}

const STYLE_COLORS = {
  spray: 0xffd57a,
  cone: 0xff8a4a,
  pierce: 0x6fe3ff,
  ricochet: 0xa6ff7a,
  arc: 0xff6fd6,
  beam: 0x4deeea,
  chain: 0xc6a6ff,
  burst: 0xffe36f,
  spinup: 0xff5a5a,
  rail: 0xffffff,
  flamer: 0xff6a2a,
  sentry: 0x6fff9a,
  flak: 0xffb347,
  breach: 0xff8a4a,
  rail2: 0xf2f8ff,
};

const gltfLoader = new GLTFLoader();
const gltfCache = new Map();
const gltfPromises = new Map();

// ?rig=photo swaps the operator's skinned mesh for the photo-character rig exported by the
// photo_pipeline (same Mixamo skeleton and Idle/Run/Walk actions).
// The photo character is the default operator now; ?rig=classic keeps the placeholder for A/B.
const USE_PHOTO_RIG = (() => {
  try {
    const rig = new URLSearchParams(globalThis.location?.search || "").get("rig");
    return rig !== "classic";
  } catch (_) { return true; }
})();
const OPERATOR_RIG_ASSET = USE_PHOTO_RIG ? "soldier-rig-photo" : "soldier-rig";

const ALL_GLB_NAMES = [
  "soldier-rig",
  "cesium-man",
  "robot-rig",
  "xbot-rig",
  "soldier-rig-photo",
  "hostile-rig",
  "hostile-cesium-man",
  "hostile-robot-rig",
  "hostile-xbot-rig",
  "damaged-helmet",
  "brain-stem",
  "gunship",
  "arena-ruins",
  "milk-truck",
  "watchtower",
  "container",
  "barrier",
  "turret",
];

function ensureBakedMaterial(mat, assetName, slotIdx = 1) {
  if (!mat) return mat;
  mat.userData.asset = assetName;
  if (!mat.map && !mat.userData.baked) {
    const base = mat.color ? mat.color.clone() : new THREE.Color(0x88929a);
    const dark = base.clone().multiplyScalar(0.75);
    const light = base.clone().multiplyScalar(1.15);
    const baked = bakeTexture({
      kind: (mat.metalness ?? 0) >= 0.45 ? "metal" : "plaster",
      seed: (assetName.length * 97 + slotIdx * 31) % 10000,
      size: 256,
      palette: [dark.getHex(), base.getHex(), light.getHex()],
      repeat: 2,
    });
    mat.map = baked.map;
    if (!mat.roughnessMap) mat.roughnessMap = baked.roughnessMap;
    if ("bumpMap" in mat && !mat.bumpMap) {
      mat.bumpMap = baked.bumpMap;
      mat.bumpScale = 0.08;
    }
    mat.userData.baked = true;
    mat.needsUpdate = true;
  }
  return mat;
}

function loadRawGltf(name) {
  if (gltfCache.has(name)) {
    return Promise.resolve(gltfCache.get(name));
  }
  if (gltfPromises.has(name)) {
    return gltfPromises.get(name);
  }
  const p = gltfLoader
    .loadAsync(`assets/${name}.glb`)
    .then((gltf) => {
      let idx = 0;
      gltf.scene.traverse((child) => {
        if (!child.isMesh) return;
        child.userData.asset = name;
        child.castShadow = true;
        child.receiveShadow = true;
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) => ensureBakedMaterial(m, name, ++idx));
        } else if (child.material) {
          child.material = ensureBakedMaterial(child.material, name, ++idx);
        }
      });
      gltfCache.set(name, gltf);
      return gltf;
    })
    .catch(() => null);
  gltfPromises.set(name, p);
  return p;
}

function withGltf(name, cb) {
  const cached = gltfCache.get(name);
  if (cached) {
    cb(cached);
    return;
  }
  loadRawGltf(name).then((gltf) => {
    if (gltf) cb(gltf);
  });
}

export function warmGlbAssets() {
  for (const name of ALL_GLB_NAMES) {
    loadRawGltf(name);
  }
}

function makePart(geo, mat, tag, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  m.userData.tag = tag;
  return m;
}

function findClip(animations, preferredNames) {
  if (!animations || animations.length === 0) return null;
  for (const want of preferredNames) {
    const found = animations.find((c) => c.name.toLowerCase() === want.toLowerCase());
    if (found) return found;
  }
  for (const want of preferredNames) {
    const found = animations.find((c) => c.name.toLowerCase().includes(want.toLowerCase()));
    if (found) return found;
  }
  return animations[0];
}

function cacheHumanoidArmBones(rig) {
  const bones = {};
  rig.traverse((b) => {
    if (!b.isBone) return;
    const n = b.name || "";
    if (n.endsWith("RightArm")) bones.rArm = b;
    else if (n.endsWith("RightForeArm")) bones.rFore = b;
    else if (n.endsWith("RightHand")) bones.rHand = b;
    else if (n.endsWith("LeftArm")) bones.lArm = b;
    else if (n.endsWith("LeftForeArm")) bones.lFore = b;
    else if (n.endsWith("LeftHand")) bones.lHand = b;
    else if (n.endsWith("Spine1")) bones.spine1 = b;
    else if (n.endsWith("Spine2")) bones.spine2 = b;
  });
  return bones;
}

/**
 * Pose a Mixamo humanoid skeleton's upper arms & forearms into a two-handed shoulder-level
 * tactical rifle firing stance right after `mixer.update(dt)`, so the legs/hips run naturally
 * while both hands grip the weapon at shoulder height (`y = 1.45m`).
 */
function applyTwoHandedRiflePose(bones, aimYaw = 0, reloadTilt = 0, recoil = 0) {
  if (!bones || !bones.rArm || !bones.rFore || !bones.lArm || !bones.lFore) return;
  const yawIn = Number.isFinite(aimYaw) ? aimYaw : 0;
  const tiltIn = Number.isFinite(reloadTilt) ? reloadTilt : 0;
  const clampedYaw = Math.max(-0.55, Math.min(0.55, yawIn));
  const clampedTilt = Math.max(-1.4, Math.min(1.4, tiltIn));
  const kick = Math.max(0, Math.min(0.35, Number.isFinite(recoil) ? recoil : 0));
  if (bones.spine2) {
    // ABSOLUTE, not +=: this runs every frame and the old accumulation twisted the spine without
    // bound, swinging the head and arms out of the torso ("invisible from the waist up").
    bones.spine2.rotation.y = clampedYaw * 0.45;
    bones.spine2.rotation.x = -kick * 0.55;   // shoulders rock back on the shot
  }
  // Right hand grips pistol grip at [-0.14, 1.45, 0.25]; Left hand cradles barrel at [0.00, 1.48, 0.36]
  bones.rArm.rotation.set(0.63 + clampedTilt * 0.5 - kick * 1.1, 0.17 - clampedYaw * 0.35, 1.35);
  bones.rFore.rotation.set(1.01 - kick * 0.8, -0.95, 0);
  bones.lArm.rotation.set(-0.79 - clampedTilt * 0.6 + kick * 0.7, -0.92 - clampedYaw * 0.35, 1.31);
  bones.lFore.rotation.set(-0.48, -1.76, -0.32);
}

function applyOperatorSkinToRig(rigRoot, skin, clothMat, armorMat, visorMat) {
  rigRoot.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = false;
    child.userData.asset = "soldier-rig";
    const mName = (child.name || "").toLowerCase();
    if (mName.includes("visor")) {
      child.material = visorMat;
      child.userData.tag = "visor";
    } else if (child.material) {
      const srcMat = Array.isArray(child.material) ? child.material[0] : child.material;
      const cloned = srcMat.clone();
      cloned.userData.asset = "soldier-rig";
      cloned.color = new THREE.Color(skin.bodyTint || 0xffffff);
      cloned.emissive = new THREE.Color(0x000000);
      cloned.emissiveIntensity = 0;
      cloned.roughness = 0.52;
      cloned.metalness = 0.35;
      ensureBakedMaterial(cloned, "soldier-rig", 1);
      child.material = cloned;
      child.userData.tag = "player-body";
    } else {
      child.material = clothMat;
      child.userData.tag = "player-body";
    }
  });
}

/**
 * Upgrade the Operator group with the rigged `soldier-rig.glb` Vanguard Soldier
 * and position `gunPivot` directly in the Soldier's two-handed shoulder rifle grip.
 */
export function buildOperatorRig(soldier, gunPivot, texSize = 256, skinIndex = 0) {
  const skin = PLAYER_SKINS[skinIndex % PLAYER_SKINS.length] || PLAYER_SKINS[0];
  const clothMat = standardMaterial({
    kind: "cloth",
    seed: 105 + skinIndex * 17,
    size: texSize,
    palette: skin.clothPalette,
    roughness: 0.82,
    metalness: 0.08,
    bump: 0.08,
  });
  const armorMat = standardMaterial({
    kind: "metal",
    seed: 212 + skinIndex * 19,
    size: texSize,
    palette: skin.armorPalette,
    roughness: 0.36,
    metalness: 0.78,
    bump: 0.05,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: skin.visorHex,
    emissive: new THREE.Color(skin.visorHex),
    emissiveIntensity: 1.85,
    roughness: 0.15,
    metalness: 0.9,
  });
  ensureBakedMaterial(visorMat, "soldier-rig", 2);

  soldier.userData.skinId = skin.id;
  soldier.userData.clothMat = clothMat;
  soldier.userData.armorMat = armorMat;
  soldier.userData.visorMat = visorMat;
  soldier.userData.skin = skin;

  if (gunPivot) {
    // Positioned at the Vanguard Soldier's shoulder/hands rifle grip (rHand=[-0.14, 1.45, 0.25], lHand=[0.0, 1.48, 0.36])
    gunPivot.position.set(-0.08, 1.46, 0.16);
    if (gunPivot.parent !== soldier) {
      soldier.add(gunPivot);
    }
  }

  if (!soldier.userData.fallbackGroup && !soldier.userData.glbRig) {
    const fb = new THREE.Group();
    fb.userData.tag = "operator-fallback";
    fb.add(makePart(new THREE.BoxGeometry(0.75, 1.15, 0.48), clothMat, "player-body", 0, 1.0, 0));
    fb.add(makePart(new THREE.BoxGeometry(0.46, 0.46, 0.46), armorMat, "player-head", 0, 1.82, 0));
    fb.add(makePart(new THREE.BoxGeometry(0.42, 0.14, 0.08), visorMat, "visor", 0, 1.84, 0.24));
    soldier.add(fb);
    soldier.userData.fallbackGroup = fb;
  }

  if (soldier.userData.glbRig) {
    applyOperatorSkinToRig(soldier.userData.glbRig, skin, clothMat, armorMat, visorMat);
    return { clothMat, armorMat, visorMat, skin };
  }

  withGltf(OPERATOR_RIG_ASSET, (gltf) => {
    if (soldier.userData.glbRig) {
      if (!USE_PHOTO_RIG) {
        applyOperatorSkinToRig(
          soldier.userData.glbRig,
          soldier.userData.skin || skin,
          soldier.userData.clothMat || clothMat,
          soldier.userData.armorMat || armorMat,
          soldier.userData.visorMat || visorMat,
        );
      }
      return;
    }
    const rig = skeletonClone(gltf.scene);
    rig.name = "OperatorVanguardRig";
    rig.userData.tag = "operator-rig";
    rig.userData.asset = OPERATOR_RIG_ASSET;
    rig.scale.setScalar(1.32);
    rig.position.set(0, 0, 0);
    rig.rotation.set(0, Math.PI, 0);

    if (!USE_PHOTO_RIG) {
      applyOperatorSkinToRig(
        rig,
        soldier.userData.skin || skin,
        soldier.userData.clothMat || clothMat,
        soldier.userData.armorMat || armorMat,
        soldier.userData.visorMat || visorMat,
      );
    }

    if (soldier.userData.fallbackGroup) {
      soldier.remove(soldier.userData.fallbackGroup);
      soldier.userData.fallbackGroup = null;
    }
    soldier.add(rig);
    soldier.userData.glbRig = rig;
    soldier.userData.armBones = cacheHumanoidArmBones(rig);

    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(rig);
      const idleClip = findClip(gltf.animations, ["Idle"]);
      const runClip = findClip(gltf.animations, ["Run", "Walk"]);
      const walkClip = findClip(gltf.animations, ["Walk", "Run"]);
      const actions = {};
      if (idleClip) {
        actions.idle = mixer.clipAction(idleClip);
        actions.idle.play();
      }
      if (runClip) {
        actions.run = mixer.clipAction(runClip);
      }
      if (walkClip) {
        actions.walk = mixer.clipAction(walkClip);
      }
      soldier.userData.mixer = mixer;
      soldier.userData.actions = actions;
      soldier.userData.activeAnim = "idle";
      mixer.update(0.01);
      applyTwoHandedRiflePose(soldier.userData.armBones, 0, 0);
    }
  });

  return { clothMat, armorMat, visorMat, skin };
}

/**
 * Step the Operator's skeletal AnimationMixer (`Idle` <-> `Run`), pose both arms to hold
 * the weapon at shoulder height, and tilt the rifle during reload phases.
 */
const _gunV1 = new THREE.Vector3();
const _gunV2 = new THREE.Vector3();
const _gunDir = new THREE.Vector3();
const _gunUp = new THREE.Vector3();
const _gunX = new THREE.Vector3();
const _gunY = new THREE.Vector3();
const _gunM = new THREE.Matrix4();
const _gunQ = new THREE.Quaternion();
const _gunTilt = new THREE.Quaternion();
const _gunAxisX = new THREE.Vector3(1, 0, 0);
const _gunGrip = new THREE.Vector3();

export function updateOperatorAnimation(soldier, gunPivot, dt, isMoving = false, activeWeapon = null) {
  if (!soldier) return;
  const mixer = soldier.userData.mixer;
  const actions = soldier.userData.actions;
  if (mixer && actions) {
    const want = isMoving ? "run" : "idle";
    if (soldier.userData.activeAnim !== want && actions[want]) {
      const prev = actions[soldier.userData.activeAnim];
      const next = actions[want];
      next.reset().fadeIn(0.16).play();
      if (prev && prev !== next) prev.fadeOut(0.16);
      soldier.userData.activeAnim = want;
    }
    mixer.update(dt);
  }
  let reloadTilt = 0;
  if (gunPivot) {
    gunPivot.position.set(-0.08, 1.46, 0.16);
    if (activeWeapon && activeWeapon.isReloading) {
      const phase = activeWeapon.getReloadPhase();
      const rawAngle = phase && Number.isFinite(phase.angle) ? (phase.angle * Math.PI) / 180 : -0.38;
      const targetAngle = Number.isFinite(rawAngle) ? rawAngle : 0;
      if (!Number.isFinite(gunPivot.rotation.x)) gunPivot.rotation.x = 0;
      gunPivot.rotation.x += (targetAngle - gunPivot.rotation.x) * Math.min(1, dt * 14);
      // keep the reload tilt sane: larger angles swing the rifle through the torso and it reads as
      // "the gun disappeared"
      gunPivot.rotation.x = Math.max(-0.55, Math.min(0.55, gunPivot.rotation.x));
      reloadTilt = Number.isFinite(gunPivot.rotation.x) ? gunPivot.rotation.x : 0;
    } else {
      gunPivot.rotation.x += (0 - gunPivot.rotation.x) * Math.min(1, dt * 12);
    }

    const handBones = soldier.userData.armBones;
    if (handBones && handBones.rHand) {
      soldier.updateMatrixWorld(true);
      const hand = handBones.rHand.getWorldPosition(_gunV1);
      const fwd = _gunV2.set(0, 0, 1).applyQuaternion(soldier.quaternion).normalize();
      hand.addScaledVector(fwd, 0.16);
      hand.y += 0.02;
      const local = soldier.worldToLocal(hand.clone());
      gunPivot.position.lerp(local, Math.min(1, dt * 18));
      gunPivot.quaternion.slerp(soldier.quaternion, Math.min(1, dt * 12));
    }

  }
  // NOTE: the player's arms are left to the Mixamo run/idle clips. The old hand-authored Euler
  // pose sat the hands at the waist with the rifle inside the torso; the clips look correct and the
  // gun is anchored to the right hand below instead.
}

/**
 * Rebuild the 3D weapon mesh inside `gunPivot` to fit directly into the Vanguard Soldier's
 * shoulder & two-handed grip (`stock` at z=-0.12..0.04, `pistol-grip` at [-0.05, -0.06, 0.08],
 * `foregrip/barrel` at [0.05, 0.0, 0.20..0.68]).
 * Standard rifles have matte steel/polymer finishes; Light Guns (`beam`, `chain`, `rail`, `flamer`)
 * have glowing neon energy cores and emitters!
 */
export function rebuildWeaponMesh(gunPivot, styleKey, steelMat) {
  const preservedLights = gunPivot.children.filter((c) => c.isLight || c.userData?.preserveOnRebuild);
  if (gunPivot.userData.currentStyle === styleKey && gunPivot.children.length > preservedLights.length) {
    return;
  }
  gunPivot.userData.currentStyle = styleKey;
  while (gunPivot.children.length > 0) {
    gunPivot.remove(gunPivot.children[0]);
  }
  for (const l of preservedLights) {
    gunPivot.add(l);
  }

  const lightGun = isLightGunStyle(styleKey);
  const accentHex = STYLE_COLORS[styleKey] || 0xffb347;
  const trimMat = new THREE.MeshStandardMaterial({
    color: lightGun ? accentHex : 0x2b333a,
    emissive: new THREE.Color(lightGun ? accentHex : 0x000000),
    emissiveIntensity: lightGun ? 1.85 : 0.0,
    roughness: lightGun ? 0.15 : 0.55,
    metalness: 0.85,
  });
  ensureBakedMaterial(trimMat, "operator", 3);

  const stockMat = new THREE.MeshStandardMaterial({
    color: 0x1c2226,
    roughness: 0.65,
    metalness: 0.35,
  });
  ensureBakedMaterial(stockMat, "operator", 4);

  // Common shoulder buttstock + pistol grip so the weapon sits anchored against the right shoulder & hands
  gunPivot.add(makePart(new THREE.BoxGeometry(0.065, 0.11, 0.22), stockMat, "buttstock", -0.04, -0.01, -0.04));
  gunPivot.add(makePart(new THREE.BoxGeometry(0.055, 0.13, 0.07), stockMat, "pistol-grip", -0.04, -0.08, 0.09, 0.28, 0, 0));

  if (styleKey === "cone") {
    // Tactical Breach Shotgun
    gunPivot.add(makePart(new THREE.BoxGeometry(0.085, 0.10, 0.44), steelMat, "rifle", 0, 0.01, 0.24));
    gunPivot.add(makePart(new THREE.CylinderGeometry(0.036, 0.036, 0.34, 8), steelMat, "barrel", 0, 0.03, 0.56, Math.PI / 2, 0, 0));
    gunPivot.add(makePart(new THREE.BoxGeometry(0.095, 0.065, 0.22), stockMat, "pump", 0.02, -0.03, 0.42));
  } else if (styleKey === "pierce" || styleKey === "rail") {
    // Marksman / Photon Railgun
    gunPivot.add(makePart(new THREE.BoxGeometry(0.08, 0.105, 0.52), steelMat, "rifle", 0, 0.01, 0.28));
    gunPivot.add(makePart(new THREE.CylinderGeometry(0.026, 0.032, 0.48, 8), steelMat, "barrel", 0, 0.02, 0.72, Math.PI / 2, 0, 0));
    gunPivot.add(makePart(new THREE.BoxGeometry(0.095, 0.055, 0.46), trimMat, "rail-coil", 0, 0.02, 0.56));
    gunPivot.add(makePart(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), trimMat, "scope", 0, 0.085, 0.24, Math.PI / 2, 0, 0));
  } else if (styleKey === "spinup") {
    // Multi-Barrel Rotary Minigun
    gunPivot.add(makePart(new THREE.BoxGeometry(0.13, 0.13, 0.34), steelMat, "rifle", 0, -0.01, 0.20));
    gunPivot.add(makePart(new THREE.CylinderGeometry(0.075, 0.075, 0.52, 10), steelMat, "rotary-cluster", 0, -0.01, 0.56, Math.PI / 2, 0, 0));
    gunPivot.add(makePart(new THREE.CylinderGeometry(0.082, 0.082, 0.06, 10), trimMat, "muzzle-clamp", 0, -0.01, 0.78, Math.PI / 2, 0, 0));
  } else if (lightGun) {
    // Neon Laser / Tesla Arc / Solar Plasma Light Gun with glowing energy core & emitter rings
    gunPivot.add(makePart(new THREE.BoxGeometry(0.095, 0.115, 0.46), steelMat, "rifle", 0, 0.01, 0.25));
    gunPivot.add(makePart(new THREE.CylinderGeometry(0.048, 0.048, 0.38, 12), trimMat, "neon-core", 0, 0.01, 0.52, Math.PI / 2, 0, 0));
    gunPivot.add(makePart(new THREE.TorusGeometry(0.062, 0.014, 8, 16), trimMat, "emitter-ring-1", 0, 0.01, 0.48));
    gunPivot.add(makePart(new THREE.TorusGeometry(0.062, 0.014, 8, 16), trimMat, "emitter-ring-2", 0, 0.01, 0.64));
  } else {
    // Standard Tactical Assault Carbine / SMG / Burst Rifle
    gunPivot.add(makePart(new THREE.BoxGeometry(0.078, 0.105, 0.46), steelMat, "rifle", 0, 0.01, 0.25));
    gunPivot.add(makePart(new THREE.CylinderGeometry(0.025, 0.028, 0.28, 8), steelMat, "barrel", 0, 0.02, 0.58, Math.PI / 2, 0, 0));
    gunPivot.add(makePart(new THREE.BoxGeometry(0.055, 0.16, 0.095), stockMat, "magazine", 0, -0.10, 0.24, 0.18, 0, 0));
    gunPivot.add(makePart(new THREE.BoxGeometry(0.05, 0.045, 0.14), trimMat, "optic-sight", 0, 0.075, 0.22));
  }

  // Underbarrel Tactical Flashlight Housing + Volumetric Beam Cone (ONLY turns on when `tac_flashlight` card or Light Gun is active!)
  const lampHousing = makePart(new THREE.CylinderGeometry(0.02, 0.022, 0.12, 8), steelMat, "tac-lamp-body", 0, -0.04, 0.48, Math.PI / 2, 0, 0);
  const coneGeo = new THREE.ConeGeometry(0.5, 5.4, 24, 1, true);
  coneGeo.translate(0, -2.7, 0);
  coneGeo.rotateX(-Math.PI / 2);
  const coneMat = new THREE.MeshBasicMaterial({
    color: lightGun ? accentHex : 0xffe6a3,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beamCone = new THREE.Mesh(coneGeo, coneMat);
  beamCone.position.set(0, -0.04, 0.54);
  beamCone.visible = false;
  beamCone.userData.tag = "flashlight-cone";
  gunPivot.add(lampHousing, beamCone);
  gunPivot.userData.beamCone = beamCone;
}

export function createEnemyMaterialBank(baseEnemyMat, texSize = 256) {
  const darkArmor = standardMaterial({
    kind: "metal",
    seed: 301,
    size: texSize,
    palette: [0x14181c, 0x283038, 0x424d54],
    roughness: 0.38,
    metalness: 0.78,
    bump: 0.05,
  });
  const sapperSuit = standardMaterial({
    kind: "cloth",
    seed: 302,
    size: texSize,
    palette: [0x261710, 0x4a2c1d, 0x70422b],
    roughness: 0.78,
    metalness: 0.12,
    bump: 0.07,
  });
  const spotterCamo = standardMaterial({
    kind: "cloth",
    seed: 303,
    size: texSize,
    palette: [0x14201a, 0x26382e, 0x3b5446],
    roughness: 0.82,
    metalness: 0.1,
    bump: 0.07,
  });
  const redOptic = new THREE.MeshStandardMaterial({
    color: 0xff4d4d,
    emissive: new THREE.Color(0xff4d4d),
    emissiveIntensity: 1.9,
    roughness: 0.15,
    metalness: 0.8,
  });
  ensureBakedMaterial(redOptic, "enemy-optic", 1);
  const orangeTank = new THREE.MeshStandardMaterial({
    color: 0xff6a2a,
    emissive: new THREE.Color(0xff6a2a),
    emissiveIntensity: 1.65,
    roughness: 0.25,
    metalness: 0.5,
  });
  ensureBakedMaterial(orangeTank, "sapper-tank", 2);
  const magentaOptic = new THREE.MeshStandardMaterial({
    color: 0xff6fd6,
    emissive: new THREE.Color(0xff6fd6),
    emissiveIntensity: 2.0,
    roughness: 0.15,
    metalness: 0.85,
  });
  ensureBakedMaterial(magentaOptic, "spotter-optic", 3);

  return {
    enemyMat: baseEnemyMat,
    chitin: baseEnemyMat,
    darkArmor,
    sapperSuit,
    spotterCamo,
    redOptic,
    orangeTank,
    magentaOptic,
  };
}

function tintClonedRig(rig, assetName, tintHex, emissiveHex = null, emissiveIntensity = 0) {
  let slotCounter = 0;
  const styleOneMaterial = (origMat, meshName = "") => {
    if (!origMat) return origMat;
    const m = origMat.clone();
    const mName = (origMat.name || "").toLowerCase();
    const cName = (meshName || "").toLowerCase();

    const isVisorOrEye = mName.includes("visor") || mName.includes("eye") || mName.includes("black");
    const isJoint = mName.includes("grey") || mName.includes("joint") || cName.includes("joint");

    if (isVisorOrEye && emissiveHex) {
      m.color = new THREE.Color(emissiveHex);
      m.emissive = new THREE.Color(emissiveHex);
      m.emissiveIntensity = Math.max(1.4, emissiveIntensity);
    } else if (isJoint) {
      m.color = new THREE.Color(0x222a30);
      m.emissive = new THREE.Color(0x000000);
      m.emissiveIntensity = 0;
      m.metalness = 0.75;
      m.roughness = 0.35;
    } else {
      if (tintHex) m.color = new THREE.Color(tintHex);
      if (emissiveHex && emissiveIntensity > 0) {
        m.emissive = new THREE.Color(emissiveHex);
        m.emissiveIntensity = Math.min(0.08, emissiveIntensity * 0.2);
      } else {
        m.emissive = new THREE.Color(0x000000);
        m.emissiveIntensity = 0;
      }
    }
    return ensureBakedMaterial(m, assetName, ++slotCounter);
  };

  rig.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = false;
    child.userData.asset = assetName;
    if (!child.userData.tag) child.userData.tag = `${assetName}-mesh`;
    if (Array.isArray(child.material)) {
      child.material = child.material.map((mat) => styleOneMaterial(mat, child.name));
    } else if (child.material) {
      child.material = styleOneMaterial(child.material, child.name);
    }
  });
}

function attachRiggedEnemyGltf(root, gltfName, opts = {}) {
  const {
    scale = 1,
    offsetY = -0.72,
    rotY = 0,
    clipNames = ["Run", "Walking", "walk", "run", "animation_0", "Idle"],
    timeScale = 1.0,
    tintHex = null,
    emissiveHex = null,
    emissiveIntensity = 0.25,
    fallbackGroup = null,
    twoHandedRiflePose = false,
  } = opts;

  withGltf(gltfName, (gltf) => {
    const rig = skeletonClone(gltf.scene);
    rig.userData.tag = `${gltfName}-rig`;
    rig.userData.asset = gltfName;
    rig.scale.setScalar(scale);
    rig.position.set(0, offsetY, 0);
    rig.rotation.set(0, rotY, 0);
    tintClonedRig(rig, gltfName, tintHex, emissiveHex, emissiveIntensity);

    if (fallbackGroup && fallbackGroup.parent === root) {
      root.remove(fallbackGroup);
    }
    root.add(rig);
    root.userData.glbRig = rig;
    if (twoHandedRiflePose) {
      root.userData.armBones = cacheHumanoidArmBones(rig);
    }

    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(rig);
      let clip = findClip(gltf.animations, clipNames);
      // A rig whose clip names do not match would otherwise stand in its bind pose while the body
      // slides around — the "enemy glides / does not move" look. Fall back to its first clip.
      if (!clip && gltf.animations.length) clip = gltf.animations[0];
      if (clip) {
        const action = mixer.clipAction(clip);
        action.timeScale = timeScale;
        action.play();
        root.userData.primaryAction = action;
      }
      root.userData.mixer = mixer;
      mixer.update(0.01);
      if (root.userData.armBones) {
        applyTwoHandedRiflePose(root.userData.armBones, 0, 0);
      }
    }
  });
}

/**
 * Build a distinct, rigged & skeletal-animated 3D Group for each of the 8 enemy types,
 * complete with visible 3D role weapons held at shoulder/hand height!
 */
export function buildEnemyMesh(type, bank) {
  const root = new THREE.Group();
  root.userData.tag = "enemy";
  root.userData.enemyType = type;

  const chitin = bank.chitin || bank.enemyMat;
  const armor = bank.darkArmor || chitin;
  const redOptic = bank.redOptic || chitin;
  const orangeTank = bank.orangeTank || redOptic;
  const magentaOptic = bank.magentaOptic || redOptic;
  const cyanTrim = bank.cyanTrim || new THREE.MeshStandardMaterial({ color: 0x0b2a30, emissive: 0x6fe3ff, emissiveIntensity: 1.7, roughness: 0.35, metalness: 0.2 });
  const sapperSuit = bank.sapperSuit || chitin;
  const spotterCamo = bank.spotterCamo || chitin;

  const fb = new THREE.Group();
  fb.userData.tag = "enemy-fallback";
  root.add(fb);

  if (type === "sapper") {
    // Rigged CesiumMan sprinter carrying a glowing Thermal Breach Lance + twin volatile back tanks
    fb.add(makePart(new THREE.BoxGeometry(0.78, 0.92, 0.62), sapperSuit, "enemy-torso", 0, 0.1, 0));
    const tankL = makePart(new THREE.CylinderGeometry(0.15, 0.15, 0.68, 10), orangeTank, "sapper-tank", -0.18, 0.36, -0.24);
    const tankR = makePart(new THREE.CylinderGeometry(0.15, 0.15, 0.68, 10), orangeTank, "sapper-tank", 0.18, 0.36, -0.24);
    // Handheld Thermal Breach Lance
    const lanceBody = makePart(new THREE.CylinderGeometry(0.04, 0.05, 0.85, 8), armor, "sapper-lance", -0.24, 0.38, 0.36, Math.PI / 2, 0, 0);
    const lanceTip = makePart(new THREE.ConeGeometry(0.08, 0.26, 8), orangeTank, "sapper-lance-tip", -0.24, 0.38, 0.84, Math.PI / 2, 0, 0);
    root.add(tankL, tankR, lanceBody, lanceTip);
    // hazard shoulder plates, amber goggles, tank hazard bands (sapper faction trim)
    root.add(makePart(new THREE.IcosahedronGeometry(0.17, 1), armor, "sapper-pauldron-l", -0.46, 0.56, 0.02));
    root.add(makePart(new THREE.IcosahedronGeometry(0.17, 1), armor, "sapper-pauldron-r", 0.46, 0.56, 0.02));
    root.add(makePart(new THREE.BoxGeometry(0.34, 0.11, 0.06), orangeTank, "sapper-goggles", 0, 0.62, 0.31));
    root.add(makePart(new THREE.BoxGeometry(0.32, 0.04, 0.03), orangeTank, "sapper-hazard-l", -0.18, 0.10, 0.32));
    root.add(makePart(new THREE.BoxGeometry(0.32, 0.04, 0.03), orangeTank, "sapper-hazard-r", 0.18, 0.10, 0.32));
    root.userData.pulseParts = [tankL, tankR, lanceTip];
    attachRiggedEnemyGltf(root, "hostile-cesium-man", {
      scale: 1.24,
      offsetY: -0.72,
      rotY: 0,
      clipNames: ["Anim_0", "animation_0"],
      timeScale: 1.55,
      tintHex: 0xffffff,
      emissiveHex: null,
      emissiveIntensity: 0,
      fallbackGroup: fb,
    });
  } else if (type === "shieldbearer") {
    // Rigged RobotExpressive heavy juggernaut carrying a Left-Arm Ballistic Riot Shield + Right-Arm Shock Mace
    fb.add(makePart(new THREE.BoxGeometry(1.14, 1.24, 0.88), chitin, "enemy-torso", 0, 0.22, 0));
    // Layered ballistic riot shield: back plate, face panel, viewport slit, hazard bars, rim.
    const shield = new THREE.Group();
    shield.position.set(-0.18, 0.24, 0.74);
    shield.rotation.y = 0.12;
    shield.add(makePart(new THREE.BoxGeometry(1.52, 1.78, 0.13), armor, "enemy-shield", 0, 0, 0));
    shield.add(makePart(new THREE.BoxGeometry(1.34, 1.58, 0.05), chitin, "shield-face", 0, -0.02, 0.10));
    shield.add(makePart(new THREE.BoxGeometry(0.82, 0.10, 0.04), cyanTrim, "shield-slit", 0, 0.56, 0.14));
    for (let i = 0; i < 3; i += 1) {
      shield.add(makePart(new THREE.BoxGeometry(0.34, 0.05, 0.03), orangeTank, "shield-hazard", -0.36 + i * 0.36, -0.62, 0.14));
    }
    shield.add(makePart(new THREE.BoxGeometry(1.58, 0.07, 0.19), cyanTrim, "shield-rim-top", 0, 0.92, 0.01));
    shield.add(makePart(new THREE.BoxGeometry(1.58, 0.07, 0.19), armor, "shield-rim-bottom", 0, -0.92, 0.01));
    root.add(shield);
    // Heavy pauldrons + helmet so the juggernaut reads as a juggernaut
    root.add(makePart(new THREE.IcosahedronGeometry(0.30, 1), armor, "shield-pauldron-l", -0.66, 0.80, 0.02));
    root.add(makePart(new THREE.IcosahedronGeometry(0.30, 1), armor, "shield-pauldron-r", 0.66, 0.80, 0.02));
    root.add(makePart(new THREE.BoxGeometry(0.44, 0.40, 0.42), armor, "shield-helm", 0, 0.92, 0.02));
    root.add(makePart(new THREE.BoxGeometry(0.30, 0.06, 0.03), cyanTrim, "shield-visor", 0, 0.94, 0.23));
    // Heavy Shock Mace / Sidearm Cannon on right flank
    const maceShaft = makePart(new THREE.CylinderGeometry(0.06, 0.06, 0.92, 8), armor, "shock-mace", 0.56, 0.42, 0.44, Math.PI / 3, 0, 0);
    const maceHead = makePart(new THREE.CylinderGeometry(0.14, 0.14, 0.28, 8), redOptic, "shock-mace-head", 0.56, 0.64, 0.78, Math.PI / 3, 0, 0);
    root.add(maceShaft, maceHead);
    attachRiggedEnemyGltf(root, "hostile-robot-rig", {
      scale: 0.44,
      offsetY: -0.72,
      rotY: 0,
      clipNames: ["Walking", "Running", "Idle"],
      timeScale: 0.95,
      tintHex: 0xffffff,
      emissiveHex: null,
      emissiveIntensity: 0,
      fallbackGroup: fb,
    });
  } else if (type === "spotter") {
    // Rigged Xbot cybernetic sniper holding a Long-Barrel Marksman Laser Rifle at shoulder height
    fb.add(makePart(new THREE.BoxGeometry(0.8, 1.08, 0.58), spotterCamo, "enemy-torso", 0, 0.16, 0));
    root.add(makePart(new THREE.BoxGeometry(0.42, 0.50, 0.24), armor, "comms-pack", 0, 0.56, -0.22));
    root.add(makePart(new THREE.CylinderGeometry(0.018, 0.026, 1.35, 6), armor, "whip-antenna", -0.18, 1.28, -0.26));
    // Shoulder-held Marksman Laser Rifle + Magenta Optic Scope (y = 0.66 in root = 1.38m world height)
    root.add(makePart(new THREE.BoxGeometry(0.075, 0.10, 0.96), armor, "spotter-sniper", -0.06, 0.66, 0.44));
    root.add(makePart(new THREE.CylinderGeometry(0.032, 0.032, 0.28, 8), magentaOptic, "spotter-scope", -0.06, 0.74, 0.36, Math.PI / 2, 0, 0));
    root.add(makePart(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 8), magentaOptic, "spotter-muzzle", -0.06, 0.66, 0.96, Math.PI / 2, 0, 0));
    // recon hood + cloak + lens ring (spotter faction trim)
    root.add(makePart(new THREE.ConeGeometry(0.30, 0.40, 7), spotterCamo, "spotter-hood", 0, 0.94, -0.01, 0.12, 0, 0));
    root.add(makePart(new THREE.BoxGeometry(0.52, 0.92, 0.07), spotterCamo, "spotter-cloak", 0, 0.38, -0.34, -0.08, 0, 0));
    root.add(makePart(new THREE.CylinderGeometry(0.075, 0.075, 0.025, 10), magentaOptic, "spotter-lens-ring", -0.06, 0.74, 0.495, Math.PI / 2, 0, 0));
    attachRiggedEnemyGltf(root, "hostile-xbot-rig", {
      scale: 1.08,
      offsetY: -0.72,
      rotY: 0,
      clipNames: ["walk", "run", "idle"],
      timeScale: 1.15,
      tintHex: 0xffffff,
      emissiveHex: null,
      emissiveIntensity: 0,
      fallbackGroup: fb,
      twoHandedRiflePose: true,
    });
  } else if (type === "drone") {
    const chassis = new THREE.Group();
    chassis.position.y = 0.95;
    fb.add(makePart(new THREE.BoxGeometry(0.78, 0.32, 0.96), armor, "drone-core", 0, 0.95, 0));
    chassis.add(makePart(new THREE.SphereGeometry(0.18, 10, 10), redOptic, "drone-eye", 0, -0.14, 0.42));
    // Twin under-slung micro-blasters
    chassis.add(makePart(new THREE.CylinderGeometry(0.035, 0.035, 0.48, 8), armor, "drone-gun-l", -0.24, -0.18, 0.28, Math.PI / 2, 0, 0));
    chassis.add(makePart(new THREE.CylinderGeometry(0.035, 0.035, 0.48, 8), armor, "drone-gun-r", 0.24, -0.18, 0.28, Math.PI / 2, 0, 0));
    const rotors = [];
    for (const sx of [-0.68, 0.68]) {
      for (const sz of [-0.68, 0.68]) {
        chassis.add(makePart(new THREE.BoxGeometry(0.72, 0.06, 0.09), armor, "drone-arm", sx * 0.5, 0.04, sz * 0.5, 0, Math.atan2(sx, sz), 0));
        const blade = makePart(new THREE.BoxGeometry(0.82, 0.025, 0.11), chitin, "drone-rotor", sx, 0.14, sz);
        chassis.add(blade);
        rotors.push(blade);
      }
    }
    root.add(chassis);
    root.userData.rotors = rotors;
    root.userData.hoverGroup = chassis;
    withGltf("damaged-helmet", (gltf) => {
      const core = gltf.scene.clone(true);
      core.scale.setScalar(0.52);
      core.userData.asset = "damaged-helmet";
      tintClonedRig(core, "damaged-helmet", 0xffffff, 0xff3b3b, 0.35);
      if (fb.parent === root) root.remove(fb);
      chassis.add(core);
    });
  } else if (type === "mortar") {
    fb.add(makePart(new THREE.CylinderGeometry(0.82, 0.9, 0.16, 10), armor, "mortar-base", 0, -0.52, 0));
    root.add(makePart(new THREE.CylinderGeometry(0.20, 0.24, 1.55, 12), armor, "mortar-tube", 0.42, 0.22, 0.24, -0.48, 0, 0));
    root.add(makePart(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 10), orangeTank, "mortar-muzzle", 0.42, 0.88, 0.58, -0.48, 0, 0));
    root.add(makePart(new THREE.CylinderGeometry(0.09, 0.09, 0.44, 8), orangeTank, "mortar-beacon", -0.52, -0.2, 0.28));
    attachRiggedEnemyGltf(root, "brain-stem", {
      scale: 1.04,
      offsetY: -0.72,
      rotY: 0,
      clipNames: ["animation_0"],
      timeScale: 0.85,
      tintHex: 0xe6994d,
      emissiveHex: 0xff6a2a,
      emissiveIntensity: 0.3,
      fallbackGroup: fb,
    });
  } else if (type === "mech") {
    fb.add(makePart(new THREE.BoxGeometry(1.62, 1.18, 1.15), chitin, "mech-hull", 0, 0.88, 0));
    root.add(makePart(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 12), redOptic, "mech-core", 0, 0.92, 0.56, Math.PI / 2, 0, 0));
    root.add(makePart(new THREE.BoxGeometry(0.48, 0.52, 0.64), armor, "mech-pod-l", -0.88, 1.68, -0.06));
    root.add(makePart(new THREE.BoxGeometry(0.48, 0.52, 0.64), armor, "mech-pod-r", 0.88, 1.68, -0.06));
    const minigun = makePart(new THREE.CylinderGeometry(0.22, 0.22, 1.42, 10), armor, "mech-minigun", 1.02, 0.86, 0.62, Math.PI / 2, 0, 0);
    const plasmaCannon = makePart(new THREE.BoxGeometry(0.34, 0.34, 1.28), armor, "mech-plasma", -1.02, 0.86, 0.54);
    const plasmaGlow = makePart(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 10), redOptic, "mech-plasma-tip", -1.02, 0.86, 1.20, Math.PI / 2, 0, 0);
    root.add(minigun, plasmaCannon, plasmaGlow);
    root.userData.rotors = [minigun];
    attachRiggedEnemyGltf(root, "robot-rig", {
      scale: 0.68,
      offsetY: -0.72,
      rotY: 0,
      clipNames: ["Walking", "Punch", "Running"],
      timeScale: 0.85,
      tintHex: 0xd96b43,
      emissiveHex: 0xff3b3b,
      emissiveIntensity: 1.6,
      fallbackGroup: fb,
    });
  } else if (type === "gunship") {
    const airframe = new THREE.Group();
    airframe.position.y = 2.6;
    airframe.add(makePart(new THREE.BoxGeometry(1.42, 1.12, 3.95), armor, "gunship-hull", 0, 0, 0));
    airframe.add(makePart(new THREE.BoxGeometry(3.45, 0.2, 0.86), chitin, "gunship-wings", 0, 0.08, 0.24));
    airframe.add(makePart(new THREE.CylinderGeometry(0.26, 0.26, 1.28, 10), armor, "gunship-pod-l", -1.38, -0.18, 0.3, Math.PI / 2, 0, 0));
    airframe.add(makePart(new THREE.CylinderGeometry(0.26, 0.26, 1.28, 10), armor, "gunship-pod-r", 1.38, -0.18, 0.3, Math.PI / 2, 0, 0));
    const mainRotor = makePart(new THREE.BoxGeometry(5.2, 0.06, 0.34), chitin, "gunship-rotor", 0, 0.82, 0);
    airframe.add(mainRotor);
    root.add(airframe);
    root.userData.rotors = [mainRotor];
    root.userData.hoverGroup = airframe;
    withGltf("damaged-helmet", (gltf) => {
      const nose = gltf.scene.clone(true);
      nose.scale.setScalar(0.82);
      nose.position.set(0, -0.05, 1.85);
      tintClonedRig(nose, "damaged-helmet", 0xffffff, 0xff3b3b, 0.55);
      airframe.add(nose);
    });
  } else {
    // Rifleman (default): Rigged Vanguard Soldier (`soldier-rig.glb`) holding a Crimson Assault Carbine at shoulder height
    fb.add(makePart(new THREE.BoxGeometry(0.88, 0.92, 0.58), chitin, "enemy-torso", 0, 0.22, 0));
    // Carbine positioned at shoulder height (y = 0.54 in root = 1.26m world height for 1.08 scale soldier)
    root.add(makePart(new THREE.BoxGeometry(0.08, 0.11, 0.68), armor, "enemy-carbine", -0.06, 0.54, 0.36));
    root.add(makePart(new THREE.BoxGeometry(0.05, 0.14, 0.09), armor, "enemy-mag", -0.06, 0.43, 0.34, 0.2, 0, 0));
    root.add(makePart(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8), redOptic, "enemy-muzzle", -0.06, 0.55, 0.72, Math.PI / 2, 0, 0));
    attachRiggedEnemyGltf(root, "hostile-rig", {
      scale: 1.08,
      offsetY: -0.72,
      rotY: Math.PI,
      clipNames: ["Run", "Walk", "Idle"],
      timeScale: 1.15,
      tintHex: 0xffffff,
      emissiveHex: 0xff2e2e,
      emissiveIntensity: 1.8,
      fallbackGroup: fb,
      twoHandedRiflePose: true,
    });
  }

  return root;
}

/** Update per-enemy skeletal `AnimationMixer` + two-handed rifle grip pose + rotors/shields each frame. */
export function animateEnemyMesh(enemy, mesh, dt) {
  if (!mesh) return;
  if (mesh.userData.mixer) {
    mesh.userData.mixer.update(dt);
    if (mesh.userData.armBones) {
      if (enemy._recoil > 0) enemy._recoil = Math.max(0, enemy._recoil - dt * 1.6);
      applyTwoHandedRiflePose(mesh.userData.armBones, 0, 0, enemy._recoil || 0);
    }
  }
  if (mesh.userData.rotors) {
    for (const r of mesh.userData.rotors) {
      if (enemy.type === "mech") {
        r.rotation.z += dt * 14;
      } else {
        r.rotation.y += dt * 22;
      }
    }
  }
  if (enemy.type === "shieldbearer" && typeof enemy.shieldAngle === "number") {
    mesh.rotation.y = enemy.shieldAngle;
  }
}

function spawnGlbProp(propGroup, gltfName, placements) {
  withGltf(gltfName, (gltf) => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const minY = isFinite(box.min.y) ? box.min.y : 0;

    for (const p of placements) {
      const inst = gltf.scene.clone(true);
      const scale = p.scale ?? 1;
      inst.scale.setScalar(scale);
      if (p.centerAndGround) {
        inst.position.set(
          p.x - center.x * scale,
          (p.y ?? 0) - minY * scale,
          p.z - center.z * scale,
        );
      } else {
        inst.position.set(p.x, p.y ?? 0, p.z);
      }
      if (p.rotY) inst.rotation.y = p.rotY;
      // fitCollider: one solid box per visible PIECE of the asset, measured from its own geometry.
      // A single box around a whole ruined complex became an invisible wall across open ground.
      if (p.fitCollider) {
        inst.updateMatrixWorld(true);
        let pieces = 0;
        inst.traverse((child) => {
          if (!child.isMesh || pieces >= 24) return;
          const cb = new THREE.Box3().setFromObject(child);
          const sx = cb.max.x - cb.min.x;
          const sz = cb.max.z - cb.min.z;
          const sy = cb.max.y - cb.min.y;
          // skip flat ground/decal pieces (they are not walls) and anything absurdly large
          if (!isFinite(sx) || !isFinite(sz) || !isFinite(sy)) return;
          if (sx < 1.2 || sz < 1.2) return;
          if (sy < 1.0) return;
          if (sx > 26 || sz > 26) return;
          arenaColliders.push({
            shape: "obb",
            x: (cb.min.x + cb.max.x) / 2,
            z: (cb.min.z + cb.max.z) / 2,
            hx: sx * 0.5 * 0.95,
            hz: sz * 0.5 * 0.95,
            rotY: 0,
            blocksProjectiles: true,
            tag: "auto-piece",
          });
          pieces += 1;
        });
      }
      inst.userData.tag = p.tag || gltfName;
      inst.userData.asset = gltfName;
      if (p.tintHex) {
        tintClonedRig(inst, gltfName, p.tintHex, p.emissiveHex || null, p.emissiveIntensity || 0.15);
      }
      propGroup.add(inst);
    }
  });
}

/**
 * Active Arena Solid Colliders (`{ x, z, hx, hz, rotY, radius, shape: "obb"|"circle", blocksProjectiles }`).
 */
export const arenaColliders = [];

/**
 * Resolve circle (`pos.x, pos.z`, `radius`) against all solid `colliders` in the arena
 * with smooth wall-sliding so neither the Player nor Enemies can walk through 3D map assets!
 */
export function resolveObstacleCollision(pos, radius = 0.55, colliders = arenaColliders) {
  if (!pos || !colliders || colliders.length === 0) return false;
  let collided = false;
  for (let pass = 0; pass < 2; pass++) {
    for (const c of colliders) {
      if (c.shape === "circle") {
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        const minDist = radius + (c.radius || 1.0);
        const distSq = dx * dx + dz * dz;
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          const overlap = minDist - dist;
          pos.x += (dx / dist) * overlap;
          pos.z += (dz / dist) * overlap;
          collided = true;
        }
      } else {
        // Oriented Bounding Box (OBB) in XZ plane
        const cos = Math.cos(-(c.rotY || 0));
        const sin = Math.sin(-(c.rotY || 0));
        const relX = pos.x - c.x;
        const relZ = pos.z - c.z;
        const lx = relX * cos - relZ * sin;
        const lz = relX * sin + relZ * cos;
        const hx = c.hx || 1.5;
        const hz = c.hz || 1.5;
        const clampedX = Math.max(-hx, Math.min(hx, lx));
        const clampedZ = Math.max(-hz, Math.min(hz, lz));
        const dlx = lx - clampedX;
        const dlz = lz - clampedZ;
        const distSq = dlx * dlx + dlz * dlz;
        if (distSq < radius * radius) {
          let nx = 0, nz = 0, push = 0;
          if (distSq > 1e-6) {
            const dist = Math.sqrt(distSq);
            nx = dlx / dist;
            nz = dlz / dist;
            push = radius - dist;
          } else {
            // Center inside box: push out along nearest face
            const ox = hx - Math.abs(lx);
            const oz = hz - Math.abs(lz);
            if (ox < oz) {
              nx = lx >= 0 ? 1 : -1;
              push = ox + radius;
            } else {
              nz = lz >= 0 ? 1 : -1;
              push = oz + radius;
            }
          }
          // Rotate local push vector back to world XZ
          const wCos = Math.cos(c.rotY || 0);
          const wSin = Math.sin(c.rotY || 0);
          pos.x += (nx * wCos - nz * wSin) * push;
          pos.z += (nx * wSin + nz * wCos) * push;
          collided = true;
        }
      }
    }
  }
  return collided;
}

function pointHitsCollider(px, pz, margin = 0.5, colliders = arenaColliders) {
  for (const c of colliders) {
    if (c.shape === "circle") {
      const r = (c.radius || 1.0) + margin;
      if ((px - c.x) ** 2 + (pz - c.z) ** 2 < r * r) return c;
    } else {
      const cos = Math.cos(-(c.rotY || 0));
      const sin = Math.sin(-(c.rotY || 0));
      const rx = px - c.x;
      const rz = pz - c.z;
      const lx = Math.abs(rx * cos - rz * sin);
      const lz = Math.abs(rx * sin + rz * cos);
      if (lx < (c.hx || 1.5) + margin && lz < (c.hz || 1.5) + margin) return c;
    }
  }
  return null;
}

/**
 * Ray/Segment vs Solid Cover check so containers, trucks, watchtowers, and barriers block projectiles!
 */
export function segmentHitsCollider(x0, z0, x1, z1, colliders = arenaColliders) {
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const px = x0 + (x1 - x0) * t;
    const pz = z0 + (z1 - z0) * t;
    const hit = pointHitsCollider(px, pz, 0.1, colliders);
    if (hit && hit.blocksProjectiles !== false) {
      return { x: px, z: pz, collider: hit };
    }
  }
  return null;
}

/**
 * Steer an enemy's desired movement vector `(dirX, dirZ)` smoothly around solid map obstacles
 * using forward look-ahead and left/right whisker feelers.
 */
export function steerAroundObstacles(pos, dirX, dirZ, radius = 0.55, colliders = arenaColliders) {
  if (!colliders || colliders.length === 0 || (dirX === 0 && dirZ === 0)) {
    return { x: dirX, z: dirZ };
  }
  const lookDist = 2.2;
  const hitAhead =
    pointHitsCollider(pos.x + dirX * lookDist, pos.z + dirZ * lookDist, radius, colliders) ||
    pointHitsCollider(pos.x + dirX * (lookDist * 0.55), pos.z + dirZ * (lookDist * 0.55), radius, colliders);
  if (!hitAhead) {
    return { x: dirX, z: dirZ };
  }

  // Test candidate steering angles (±35°, ±65°, ±90°) and pick the first unobstructed tangent
  const baseAngle = Math.atan2(dirX, dirZ);
  const cross = (hitAhead.x - pos.x) * dirZ - (hitAhead.z - pos.z) * dirX;
  const prefSign = cross >= 0 ? -1 : 1;
  const testAngles = [
    prefSign * 0.62,
    -prefSign * 0.62,
    prefSign * 1.12,
    -prefSign * 1.12,
    prefSign * 1.55,
    -prefSign * 1.55,
  ];
  for (const offset of testAngles) {
    const a = baseAngle + offset;
    const sx = Math.sin(a);
    const sz = Math.cos(a);
    if (!pointHitsCollider(pos.x + sx * lookDist, pos.z + sz * lookDist, radius * 0.9, colliders)) {
      return { x: sx, z: sz };
    }
  }
  return { x: -dirZ * prefSign, z: dirX * prefSign };
}

/**
 * Populate each of the 3 Arenas (`perimeter`, `breach`, `gunship`) with real 3D `.glb` map geometry
 * AND register solid 2D OBB/circle colliders in `arenaColliders`.
 */
export function populateArenaProps(arenaKey, propGroup, texSize = 256) {
  // rebuilding an arena must not stack its colliders on top of the previous arena's
  arenaColliders.length = 0;
  while (propGroup.children.length > 0) {
    propGroup.remove(propGroup.children[0]);
  }
  arenaColliders.length = 0;

  const stoneMat = standardMaterial({
    kind: "stone",
    seed: 401,
    size: texSize,
    palette: [0x23272e, 0x3a3f47, 0x565d68],
    roughness: 0.88,
    metalness: 0.08,
    bump: 0.09,
  });
  const hazardMat = new THREE.MeshStandardMaterial({
    color: hexInt(PALETTE.ui),
    emissive: new THREE.Color(hexInt(PALETTE.ui)),
    emissiveIntensity: 0.65,
    roughness: 0.35,
    metalness: 0.4,
  });
  ensureBakedMaterial(hazardMat, "barrier", 1);

  const addBoxCollider = (x, z, hx, hz, rotY = 0, blocksProjectiles = true, tag = "prop") => {
    arenaColliders.push({ shape: "obb", x, z, hx, hz, rotY, blocksProjectiles, tag });
  };
  const addCircleCollider = (x, z, radius, blocksProjectiles = true, tag = "prop") => {
    arenaColliders.push({ shape: "circle", x, z, radius, blocksProjectiles, tag });
  };

  // ── MAP-01/02/03: the three named layouts live in src/maps.js ────────────────────────────────
  const map = mapById(arenaKey);
  if (map) {
    // ruin clusters first (their colliders are fitted from the geometry)
    (map.ruins || []).forEach((r, i) => {
      spawnGlbProp(propGroup, "arena-ruins", [{
        x: r.x, y: -0.2, z: r.z, scale: r.scale || 0.5, rotY: r.rotY || 0,
        centerAndGround: true, tintHex: 0x4b5663, tag: `${map.id}-ruins-${i}`, fitCollider: true,
      }]);
    });

    const byKind = new Map();
    for (const p of map.props) {
      if (!byKind.has(p.kind)) byKind.set(p.kind, []);
      byKind.get(p.kind).push(p);
    }
    for (const [kind, list] of byKind) {
      spawnGlbProp(propGroup, kind, list.map((p) => ({
        x: p.x, y: 0, z: p.z, scale: p.scale || 1.15, rotY: p.rotY || 0,
      })));
      for (const p of list) {
        const c = PROP_COLLIDERS[kind] || { shape: "obb", hx: 1.2, hz: 1.2 };
        if (c.shape === "circle") addCircleCollider(p.x, p.z, c.radius, true, kind);
        else addBoxCollider(p.x, p.z, c.hx, c.hz, p.rotY || 0, true, kind);
      }
    }

    // FOUNDRY's hazard ring is paint on the floor, deliberately not a collider
    if (map.hazardRing) {
      const ring = makePart(new THREE.RingGeometry(map.hazardRing - 0.25, map.hazardRing, 40), hazardMat,
        "foundry-hazard-ring", 0, 0.03, 0, -Math.PI / 2, 0, 0);
      propGroup.add(ring);
      for (let i = 0; i < 4; i += 1) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const strip = makePart(new THREE.BoxGeometry(0.35, 0.04, 2.4), hazardMat, "foundry-hazard-strip",
          Math.cos(a) * map.hazardRing, 0.03, Math.sin(a) * map.hazardRing, 0, -a, 0);
        propGroup.add(strip);
      }
    }
    return arenaColliders;
  }

  if (arenaKey === "perimeter") {
    spawnGlbProp(propGroup, "arena-ruins", [
      { x: 0, y: -0.2, z: -32, scale: 0.62, rotY: 0, centerAndGround: true, tintHex: 0x4b5663, tag: "perimeter-ruins-north", fitCollider: true },
      { x: 0, y: -0.2, z: 32, scale: 0.62, rotY: Math.PI, centerAndGround: true, tintHex: 0x4b5663, tag: "perimeter-ruins-south", fitCollider: true },
    ]);

    const towers = [
      { x: -20, y: 0, z: -18, scale: 1.15, rotY: 0.6 },
      { x: 20, y: 0, z: -18, scale: 1.15, rotY: -0.6 },
    ];
    spawnGlbProp(propGroup, "watchtower", towers);
    for (const t of towers) addBoxCollider(t.x, t.z, 1.75, 1.75, t.rotY, true, "watchtower");

    const trucks = [
      { x: -15, y: 0, z: 6, scale: 1.15, rotY: 0.45, tintHex: 0x6d7b68 },
      { x: 16, y: 0, z: -5, scale: 1.15, rotY: -2.1, tintHex: 0x6d7b68 },
    ];
    spawnGlbProp(propGroup, "milk-truck", trucks);
    for (const tr of trucks) addBoxCollider(tr.x, tr.z, 1.65, 2.85, tr.rotY, true, "milk-truck");

    const turrets = [
      { x: -8, y: 0, z: -15, scale: 1.1, rotY: 0 },
      { x: 8, y: 0, z: 15, scale: 1.1, rotY: Math.PI },
    ];
    spawnGlbProp(propGroup, "turret", turrets);
    for (const tu of turrets) addCircleCollider(tu.x, tu.z, 1.35, true, "turret");
  } else if (arenaKey === "breach") {
    spawnGlbProp(propGroup, "arena-ruins", [
      { x: -30, y: -0.2, z: 0, scale: 0.58, rotY: Math.PI / 2, centerAndGround: true, tintHex: 0x5c4a3e, tag: "breach-ruins-west", fitCollider: true },
      { x: 30, y: -0.2, z: 0, scale: 0.58, rotY: -Math.PI / 2, centerAndGround: true, tintHex: 0x5c4a3e, tag: "breach-ruins-east", fitCollider: true },
    ]);


    const containers = [
      { x: -14, y: 0, z: -8, scale: 1.15, rotY: 0.15 },
      { x: 14, y: 0, z: -9, scale: 1.15, rotY: -0.2 },
      { x: -15, y: 0, z: 11, scale: 1.15, rotY: -0.35 },
      { x: 15, y: 0, z: 10, scale: 1.15, rotY: 0.25 },
    ];
    spawnGlbProp(propGroup, "container", containers);
    for (const c of containers) addBoxCollider(c.x, c.z, 1.65, 3.3, c.rotY, true, "container");

    const trucks = [
      { x: 0, y: 0, z: -18, scale: 1.25, rotY: Math.PI / 2, tintHex: 0x8c6239 },
      { x: 0, y: 0, z: 18, scale: 1.25, rotY: -Math.PI / 2, tintHex: 0x8c6239 },
    ];
    spawnGlbProp(propGroup, "milk-truck", trucks);
    for (const tr of trucks) addBoxCollider(tr.x, tr.z, 1.75, 3.0, tr.rotY, true, "milk-truck");
  } else {
    const padRing = makePart(new THREE.RingGeometry(8.5, 9.1, 32), hazardMat, "helipad-ring", 0, 0.03, 0, -Math.PI / 2, 0, 0);
    const hLeft = makePart(new THREE.BoxGeometry(0.55, 0.04, 5.2), hazardMat, "helipad-h", -1.8, 0.03, 0);
    const hRight = makePart(new THREE.BoxGeometry(0.55, 0.04, 5.2), hazardMat, "helipad-h", 1.8, 0.03, 0);
    const hCross = makePart(new THREE.BoxGeometry(3.6, 0.04, 0.55), hazardMat, "helipad-h", 0, 0.03, 0);
    propGroup.add(padRing, hLeft, hRight, hCross);

    const towers = [
      { x: -21, y: 0, z: -21, scale: 1.2, rotY: 0.78 },
      { x: 21, y: 0, z: -21, scale: 1.2, rotY: -0.78 },
      { x: -21, y: 0, z: 21, scale: 1.2, rotY: 2.35 },
      { x: 21, y: 0, z: 21, scale: 1.2, rotY: -2.35 },
    ];
    spawnGlbProp(propGroup, "watchtower", towers);
    for (const t of towers) addBoxCollider(t.x, t.z, 1.8, 1.8, t.rotY, true, "watchtower");

    const turrets = [
      { x: -13, y: 0, z: -13, scale: 1.25, rotY: 0.78 },
      { x: 13, y: 0, z: -13, scale: 1.25, rotY: -0.78 },
      { x: -13, y: 0, z: 13, scale: 1.25, rotY: 2.35 },
      { x: 13, y: 0, z: 13, scale: 1.25, rotY: -2.35 },
    ];
    spawnGlbProp(propGroup, "turret", turrets);
    for (const tu of turrets) addCircleCollider(tu.x, tu.z, 1.45, true, "turret");
  }

  // Solid Tactical Jersey Barriers around the inner perimeter
  const barrierCoords = [
    [-11, -9, 0.4],
    [11, -10, -0.5],
    [-12, 11, 1.1],
    [12, 11, -1.2],
  ];
  spawnGlbProp(
    propGroup,
    "barrier",
    barrierCoords.map(([x, z, rotY]) => ({ x, y: 0, z, scale: 1.15, rotY })),
  );
  for (const [x, z, rot] of barrierCoords) {
    const b = makePart(new THREE.BoxGeometry(2.6, 0.95, 0.65), stoneMat, "arena-barrier", x, 0.48, z, 0, rot, 0);
    const s = makePart(new THREE.BoxGeometry(2.64, 0.12, 0.68), hazardMat, "barrier-stripe", x, 0.82, z, 0, rot, 0);
    propGroup.add(b, s);
    addBoxCollider(x, z, 1.55, 0.55, rot, true, "barrier");
  }

  return arenaColliders;
}


/** The arena boss: the imported animated BrainStem rig, scaled up and tinted hostile. */
export function buildBossMesh(materials) {
  const root = new THREE.Group();
  root.userData.tag = "boss";
  attachRiggedEnemyGltf(root, "brain-stem", {
    scale: 2.1,
    tintHex: 0x7d1419,
    emissiveHex: 0x3a0406,
    emissiveIntensity: 0.45,
  });
  return root;
}
