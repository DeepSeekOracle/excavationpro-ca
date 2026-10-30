/**
 * Tactical Gunmetal & Amber Armory — Real Rigged Skeletal-Animated .GLB Characters, Enemies,
 * Two-Handed Shoulder-Mounted Weapons, Card-Gated Light Mods / Light Guns & Solid 3D Arena Colliders.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";
import { standardMaterial, bakeTexture } from "./materials.js?v=202610327h";
import { PALETTE, hexInt } from "./theme.js?v=202610327h";
import { mapById, PROP_COLLIDERS } from "./maps.js?v=202610327h";

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
  // vendored Kenney city kits (CC0) used by the level kit
  "ki/building-a", "ki/building-b", "ki/building-c", "ki/building-d", "ki/building-e",
  "ki/building-f", "ki/building-g", "ki/building-h", "ki/building-i", "ki/building-j",
  "ki/water-tower", "ki/chimney-large", "ki/detail-tank-large", "ki/detail-tank",
  "ki/shipping-container-a", "ki/shipping-container-b",
  "kc/building-a", "kc/building-b", "kc/building-c", "kc/building-d", "kc/building-e",
  "kc/building-f", "kc/building-g", "kc/building-h", "kc/building-i", "kc/building-j",
  "kc/low-detail-building-a", "kc/low-detail-building-b", "kc/low-detail-building-c", "kc/low-detail-building-d",
  "kr/dumpster", "kr/construction-light", "kr/electricity-pole",
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

  const previousSkinId = soldier.userData.skinId;
  soldier.userData.skinId = skin.id;
  soldier.userData.clothMat = clothMat;
  soldier.userData.armorMat = armorMat;
  soldier.userData.visorMat = visorMat;
  soldier.userData.skin = skin;

  if (gunPivot) {
    // the actual carry anchor is solved every frame in updateOperatorAnimation (WEAPON_ANCHOR)
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
    // Re-cloning every material on every run start cost a visible stall (each new material is a
    // fresh shader compile). Only repaint when the suit actually changed.
    if (previousSkinId !== skin.id) {
      applyOperatorSkinToRig(soldier.userData.glbRig, skin, clothMat, armorMat, visorMat);
    }
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
    }
  });

  return { clothMat, armorMat, visorMat, skin };
}

/**
 * Step the Operator's skeletal AnimationMixer (`Idle` <-> `Run`) and solve both arms onto the
 * weapon so the rifle is actually held.
 *
 * The old code let the Mixamo clip swing the arms while the gun was parented to the right hand
 * bone, so the rifle hung at the hip and the hands never touched it. A two-bone IK solve per arm
 * (shoulder -> elbow -> hand) is the only version that survives every clip: the animation still
 * drives hips, legs and torso, and the arms are then aimed at the weapon's two grips.
 */
const _gunV1 = new THREE.Vector3();
const _gunV2 = new THREE.Vector3();
const _ikS = new THREE.Vector3();
const _ikE = new THREE.Vector3();
const _ikH = new THREE.Vector3();
const _ikT = new THREE.Vector3();
const _ikDir = new THREE.Vector3();
const _ikPole = new THREE.Vector3();
const _ikPerp = new THREE.Vector3();
const _ikTmp = new THREE.Vector3();
const _ikV1 = new THREE.Vector3();
const _ikV2 = new THREE.Vector3();
const _ikTargetR = new THREE.Vector3();
const _ikTargetL = new THREE.Vector3();
const _ikPoleR = new THREE.Vector3();
const _ikPoleL = new THREE.Vector3();
const _ikQ = new THREE.Quaternion();
const _ikParentQ = new THREE.Quaternion();
const _ikOldQ = new THREE.Quaternion();
const _ikNewQ = new THREE.Quaternion();
const _ikParentInv = new THREE.Quaternion();

/** Rotate `bone` in world space so its current (from) direction becomes (to). */
function rotateBoneWorld(bone, fromDir, toDir) {
  if (!bone || !bone.parent) return;
  if (fromDir.lengthSq() < 1e-8 || toDir.lengthSq() < 1e-8) return;
  _ikQ.setFromUnitVectors(fromDir.normalize(), toDir.normalize());
  bone.parent.getWorldQuaternion(_ikParentQ);
  bone.getWorldQuaternion(_ikOldQ);
  _ikNewQ.copy(_ikQ).multiply(_ikOldQ);
  _ikParentInv.copy(_ikParentQ).invert();
  bone.quaternion.copy(_ikParentInv).multiply(_ikNewQ);
  bone.updateMatrixWorld(true);
}

/**
 * Two-bone analytic IK for one arm. Puts `handBone` on `target` with the elbow pushed toward
 * `pole` (a world-space direction). Lengths are measured from the live pose, so it works for any
 * humanoid rig without hard-coded bone lengths.
 */
function solveArm(shoulder, elbowBone, handBone, target, pole) {
  if (!shoulder || !elbowBone || !handBone || !target) return;
  shoulder.getWorldPosition(_ikS);
  elbowBone.getWorldPosition(_ikE);
  handBone.getWorldPosition(_ikH);
  const l1 = _ikS.distanceTo(_ikE) || 0.28;
  const l2 = _ikE.distanceTo(_ikH) || 0.27;
  _ikDir.copy(target).sub(_ikS);
  const d = _ikDir.length();
  if (d < 1e-5) return;
  const dClamped = Math.min(l1 + l2 - 0.015, Math.max(Math.abs(l1 - l2) + 0.015, d));
  _ikDir.multiplyScalar(1 / d);
  const a = (l1 * l1 - l2 * l2 + dClamped * dClamped) / (2 * dClamped);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  // perpendicular part of the pole, so the elbow lands on the side the pole asks for
  _ikPerp.copy(pole).addScaledVector(_ikDir, -pole.dot(_ikDir));
  if (_ikPerp.lengthSq() < 1e-6) _ikPerp.set(0, -1, 0);
  _ikPerp.normalize();
  _ikTmp.copy(_ikS).addScaledVector(_ikDir, a).addScaledVector(_ikPerp, h);   // elbow target
  // 1) upper arm points at the elbow target
  _ikV1.copy(_ikE).sub(_ikS);
  _ikV2.copy(_ikTmp).sub(_ikS);
  rotateBoneWorld(shoulder, _ikV1, _ikV2);
  // 2) forearm points at the hand target (recomputed after the upper arm moved)
  elbowBone.getWorldPosition(_ikE);
  handBone.getWorldPosition(_ikH);
  _ikV1.copy(_ikH).sub(_ikE);
  _ikV2.copy(target).sub(_ikE);
  rotateBoneWorld(elbowBone, _ikV1, _ikV2);
}

/**
 * The weapon's carry pose in soldier-local space: muzzle forward (+Z), grip just in front of the
 * chest. Kept out of the torso so the rifle silhouette reads from every camera.
 */
export const WEAPON_ANCHOR = { x: 0.12, y: 1.56, z: 0.28 };

/** QA-only: move the carry anchor while tuning the hold pose (used by ?test=1 hooks). */
export function setWeaponAnchor(x, y, z) {
  if (Number.isFinite(x)) WEAPON_ANCHOR.x = x;
  if (Number.isFinite(y)) WEAPON_ANCHOR.y = y;
  if (Number.isFinite(z)) WEAPON_ANCHOR.z = z;
  return { ...WEAPON_ANCHOR };
}

function poseWeaponHold(soldier, gunPivot) {
  const bones = soldier.userData.armBones;
  if (!bones || !bones.rArm || !bones.lArm) return;
  soldier.updateMatrixWorld(true);
  const q = soldier.getWorldQuaternion(_ikParentQ);
  // right hand on the pistol grip, left hand on the foregrip
  const rightTarget = _ikTargetR.set(-0.03, -0.025, 0.07).applyMatrix4(gunPivot.matrixWorld);
  const leftTarget = _ikTargetL.set(0.0, 0.0, 0.34).applyMatrix4(gunPivot.matrixWorld);
  // elbows down and out, mirrored per side
  const poleR = _ikPoleR.set(1.1, -1.0, -0.15).applyQuaternion(q);
  const poleL = _ikPoleL.set(-1.1, -1.0, -0.15).applyQuaternion(q);
  solveArm(bones.rArm, bones.rFore, bones.rHand, rightTarget, poleR);
  solveArm(bones.lArm, bones.lFore, bones.lHand, leftTarget, poleL);
  // a small wrist cant so the palms face the grips instead of the sky
  if (bones.rHand) bones.rHand.rotation.z += (0.35 - bones.rHand.rotation.z) * 0.25;
  if (bones.lHand) bones.lHand.rotation.z += (-0.3 - bones.lHand.rotation.z) * 0.25;
}

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
  if (!gunPivot) return;
  // The weapon lives at a fixed chest anchor in soldier space: stable aim for the hitscan muzzle,
  // and always outside the torso. The arms are solved onto it afterwards.
  gunPivot.position.set(WEAPON_ANCHOR.x, WEAPON_ANCHOR.y, WEAPON_ANCHOR.z);
  // reload: cant the rifle instead of pitching it through the chest (which used to hide it)
  let cant = 0;
  if (activeWeapon && activeWeapon.isReloading) {
    const phase = activeWeapon.getReloadPhase();
    const rawAngle = phase && Number.isFinite(phase.angle) ? (phase.angle * Math.PI) / 180 : -0.38;
    cant = Number.isFinite(rawAngle) ? Math.max(-0.5, Math.min(0.5, rawAngle)) : 0;
  }
  gunPivot.rotation.z += (cant - gunPivot.rotation.z) * Math.min(1, dt * 12);
  poseWeaponHold(soldier, gunPivot);
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
  // The rifle gets its own steel: the shared world steel is 0.8 metalness with almost no specular
  // response, so the weapon read as a black stick against the deck. A lighter, rougher alloy plus
  // the scene environment makes the receiver, barrel and optic legible at 5-10 m.
  const gunSteel = steelMat?.clone ? steelMat.clone() : new THREE.MeshStandardMaterial({ color: 0x6c7783 });
  gunSteel.color = new THREE.Color(0x8a949e);
  gunSteel.metalness = 0.62;
  gunSteel.roughness = 0.34;
  gunSteel.envMapIntensity = 1.6;
  gunSteel.emissive = new THREE.Color(0x0a0d10);
  gunSteel.emissiveIntensity = 0.35;
  const trimMat = new THREE.MeshStandardMaterial({
    color: lightGun ? accentHex : 0x37434c,
    emissive: new THREE.Color(lightGun ? accentHex : 0x000000),
    emissiveIntensity: lightGun ? 1.85 : 0.0,
    roughness: lightGun ? 0.15 : 0.55,
    metalness: 0.85,
  });
  ensureBakedMaterial(trimMat, "operator", 3);
  ensureBakedMaterial(gunSteel, "operator", 5);
  // every part below that used to take the shared world steel now takes the readable gun alloy
  steelMat = gunSteel;

  const stockMat = new THREE.MeshStandardMaterial({
    color: 0x2a3238,
    roughness: 0.6,
    metalness: 0.4,
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

// Shared per (asset, source material, faction tint). Without this cache every spawned enemy cloned
// its rig materials and `ensureBakedMaterial` baked three fresh 256px textures for each clone — the
// renderer texture count climbed by ~10 per spawn for the life of the session.
const tintedMaterialCache = new Map();

function tintClonedRig(rig, assetName, tintHex, emissiveHex = null, emissiveIntensity = 0) {
  let slotCounter = 0;
  const styleOneMaterial = (origMat, meshName = "") => {
    if (!origMat) return origMat;
    const cacheKey = `${assetName}|${tintHex}|${emissiveHex}|${emissiveIntensity}|${origMat.uuid}`;
    const cached = tintedMaterialCache.get(cacheKey);
    if (cached) return cached;
    const m = origMat.clone();
    const mName = (origMat.name || "").toLowerCase();
    const cName = (meshName || "").toLowerCase();

    // Deterministic faction paint: body = the type's tint, joints = dark, and NO per-material
    // emissive guesswork. Guessing "this material looks like an eye" from a name turned whole
    // bodies into glowing red/magenta blobs (a material literally named "black" was the body suit).
    // The readable hostile cue is the ground ring plus the silhouette, not a glowing mesh.
    const isJoint = mName.includes("grey") || mName.includes("joint") || cName.includes("joint");
    if (isJoint) {
      m.color = new THREE.Color(0x1d242a);
      m.emissive = new THREE.Color(0x000000);
      m.emissiveIntensity = 0;
      m.metalness = 0.72;
      m.roughness = 0.38;
    } else {
      if (tintHex) m.color = new THREE.Color(tintHex);
      m.emissive = new THREE.Color(0x000000);
      m.emissiveIntensity = 0;
      m.metalness = Math.min(0.5, m.metalness ?? 0.3);
      m.roughness = Math.max(0.5, m.roughness ?? 0.6);
    }
    const finished = ensureBakedMaterial(m, assetName, ++slotCounter);
    tintedMaterialCache.set(cacheKey, finished);
    return finished;
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
    targetHeight = 0,
  } = opts;

  withGltf(gltfName, (gltf) => {
    const rig = skeletonClone(gltf.scene);
    rig.userData.tag = `${gltfName}-rig`;
    rig.userData.asset = gltfName;
    rig.scale.setScalar(scale);
    rig.position.set(0, 0, 0);
    rig.rotation.set(0, rotY, 0);
    rig.updateMatrixWorld(true);
    // HEIGHT NORMALISATION: every humanoid hostile is fitted to the same silhouette height, because
    // the role gear (shield, lance, carbine, scope) is authored in root space for a ~1.78 m body.
    // Without this the rigs arrived at 1.3-2.7 m and the gear floated at the wrong height.
    let rigBox = new THREE.Box3().setFromObject(rig);
    const rawHeight = rigBox.max.y - rigBox.min.y;
    if (targetHeight > 0.5 && Number.isFinite(rawHeight) && rawHeight > 0.4) {
      const fitted = scale * (targetHeight / rawHeight);
      rig.scale.setScalar(fitted);
      rig.updateMatrixWorld(true);
      rigBox = new THREE.Box3().setFromObject(rig);
    }
    // Measure the model and put its lowest point on the deck. Different Mixamo rigs have different
    // bind-pose origins, which is why some bodies stood sunk into the ground.
    const feet = Number.isFinite(rigBox.min.y) ? rigBox.min.y : 0;
    rig.position.set(0, offsetY - feet, 0);
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
      rotY: Math.PI,
      clipNames: ["Anim_0", "animation_0"],
      timeScale: 1.55,
      tintHex: 0x4a3a2c,
      emissiveHex: 0xff8a3a,
      emissiveIntensity: 1.0,
      fallbackGroup: fb,
      targetHeight: 1.78,
    });
  } else if (type === "shieldbearer") {
    // Rigged RobotExpressive heavy juggernaut carrying a Left-Arm Ballistic Riot Shield + Right-Arm Shock Mace
    fb.add(makePart(new THREE.BoxGeometry(1.14, 1.24, 0.88), chitin, "enemy-torso", 0, 0.22, 0));
    // Layered ballistic riot shield: back plate, face panel, viewport slit, hazard bars, rim.
    // Riot wall: fitted to the 1.88 m body and held in FRONT of it, which is exactly where the
    // front-arc damage gate lives. The old 1.78 m plate sat 0.74 m ahead of a 0.8 m rig.
    const shield = new THREE.Group();
    shield.position.set(0, 0.62, 0.62);
    shield.add(makePart(new THREE.BoxGeometry(1.16, 1.34, 0.12), armor, "enemy-shield", 0, 0, 0));
    shield.add(makePart(new THREE.BoxGeometry(1.02, 1.18, 0.04), chitin, "shield-face", 0, -0.02, 0.08));
    shield.add(makePart(new THREE.BoxGeometry(0.62, 0.075, 0.03), cyanTrim, "shield-slit", 0, 0.42, 0.11));
    for (let i = 0; i < 3; i += 1) {
      shield.add(makePart(new THREE.BoxGeometry(0.26, 0.04, 0.03), orangeTank, "shield-hazard", -0.28 + i * 0.28, -0.46, 0.11));
    }
    shield.add(makePart(new THREE.BoxGeometry(1.2, 0.06, 0.16), cyanTrim, "shield-rim-top", 0, 0.69, 0.01));
    shield.add(makePart(new THREE.BoxGeometry(1.2, 0.06, 0.16), armor, "shield-rim-bottom", 0, -0.69, 0.01));
    root.add(shield);
    // right-hand shock mace, sized to the fitted body
    const maceShaft = makePart(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), armor, "shock-mace", 0.5, 0.5, 0.3, Math.PI / 3, 0, 0);
    const maceHead = makePart(new THREE.CylinderGeometry(0.12, 0.12, 0.24, 8), redOptic, "shock-mace-head", 0.5, 0.72, 0.62, Math.PI / 3, 0, 0);
    root.add(maceShaft, maceHead);
    attachRiggedEnemyGltf(root, "hostile-robot-rig", {
      scale: 0.44,
      offsetY: -0.72,
      rotY: Math.PI,
      clipNames: ["Walking", "Running", "Idle"],
      timeScale: 0.95,
      tintHex: 0x39434c,
      emissiveHex: 0x6fe3ff,
      emissiveIntensity: 1.0,
      fallbackGroup: fb,
      targetHeight: 1.88,
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
    // a low recon antenna and a lens ring only: the old hood cone and cloak slab floated off the
    // rigged body and made the spotter read as a traffic cone on legs
    root.add(makePart(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 6), armor, "whip-antenna", 0.16, 1.42, -0.24));
    root.add(makePart(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), magentaOptic, "spotter-lens-ring", -0.06, 0.74, 0.50, Math.PI / 2, 0, 0));
    attachRiggedEnemyGltf(root, "hostile-xbot-rig", {
      scale: 1.08,
      offsetY: -0.72,
      rotY: Math.PI,
      clipNames: ["walk", "run", "idle"],
      timeScale: 1.15,
      tintHex: 0x2b3634,
      emissiveHex: 0xff6fd6,
      emissiveIntensity: 1.0,
      fallbackGroup: fb,
      targetHeight: 1.8,
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
      tintHex: 0x6a553f,
      emissiveHex: 0xff6a2a,
      emissiveIntensity: 0.6,
      fallbackGroup: fb,
      targetHeight: 1.62,
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
      rotY: Math.PI,
      clipNames: ["Walking", "Punch", "Running"],
      timeScale: 0.85,
      tintHex: 0x7a4a34,
      emissiveHex: 0xff3b3b,
      emissiveIntensity: 1.0,
      fallbackGroup: fb,
      targetHeight: 3.1,
    });
  } else if (type === "gunship") {
    const heli = buildGunshipModel(bank, { scale: 1.0 });
    root.add(heli);
    root.userData.rotors = heli.userData.rotors;
    root.userData.hoverGroup = heli;
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
      tintHex: 0x333a42,
      emissiveHex: 0xff2e2e,
      emissiveIntensity: 1.0,
      fallbackGroup: fb,
      targetHeight: 1.8,
    });
  }

  return root;
}

/**
 * Attack helicopter. The old "gunship" was a box airframe with a damaged-helmet nose, and the arena
 * BOSS used `buildBossMesh`, which was a 2.1x brain-stem model — the red mass flying at 6 m that
 * never looked like an aircraft. This is a proper silhouette: hull, canopy, tail boom, tail rotor,
 * four-blade main rotor, stub wings with rocket pods, chin gun, skids and nav lights.
 */
export function buildGunshipModel(bank, opts = {}) {
  const scale = opts.scale || 1;
  const root = new THREE.Group();
  root.userData.tag = "gunship-model";
  const armor = bank.darkArmor || bank.enemyMat;
  const chitin = bank.chitin || bank.enemyMat;
  const red = bank.redOptic || armor;
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x2f363d, metalness: 0.72, roughness: 0.4, emissive: 0x120709, emissiveIntensity: 0.3,
  });
  ensureBakedMaterial(hullMat, "gunship", 11);
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x7a1f22, metalness: 0.5, roughness: 0.45, emissive: 0x3a0406, emissiveIntensity: 0.5,
  });
  ensureBakedMaterial(accentMat, "gunship", 12);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0a1a22, metalness: 0.95, roughness: 0.08, emissive: 0x0d3446, emissiveIntensity: 0.65,
  });
  const lampRed = new THREE.MeshBasicMaterial({ color: 0xff2b2b });
  const lampGreen = new THREE.MeshBasicMaterial({ color: 0x39ff88 });

  // hull: slab with a tapered nose
  root.add(makePart(new THREE.BoxGeometry(1.75, 1.45, 4.6), hullMat, "gs-hull", 0, 0.9, 0.1));
  const nose = makePart(new THREE.CylinderGeometry(0.18, 0.92, 2.4, 10), hullMat, "gs-nose", 0, 0.86, 3.0, Math.PI / 2, 0, 0);
  root.add(nose);
  root.add(makePart(new THREE.BoxGeometry(1.5, 0.55, 1.6), accentMat, "gs-spine", 0, 1.62, -0.4));
  // canopy
  root.add(makePart(new THREE.BoxGeometry(1.18, 0.72, 1.9), glassMat, "gs-canopy", 0, 1.28, 1.7, -0.12, 0, 0));
  root.add(makePart(new THREE.BoxGeometry(1.24, 0.12, 1.95), hullMat, "gs-canopy-frame", 0, 1.62, 1.65, -0.12, 0, 0));
  // tail boom + fin
  const boom = makePart(new THREE.CylinderGeometry(0.2, 0.36, 4.6, 8), hullMat, "gs-boom", 0, 1.02, -3.9, Math.PI / 2, 0, 0);
  root.add(boom);
  root.add(makePart(new THREE.BoxGeometry(0.16, 1.2, 0.9), accentMat, "gs-tail-fin", 0, 1.55, -6.0));
  root.add(makePart(new THREE.BoxGeometry(1.5, 0.12, 0.55), hullMat, "gs-stabiliser", 0, 1.05, -5.95));
  // skids
  for (const sx of [-0.95, 0.95]) {
    root.add(makePart(new THREE.BoxGeometry(0.1, 0.1, 3.3), hullMat, "gs-skid", sx, 0.06, 0.2));
    root.add(makePart(new THREE.BoxGeometry(0.08, 0.5, 0.08), hullMat, "gs-skid-leg", sx, 0.32, 1.1));
    root.add(makePart(new THREE.BoxGeometry(0.08, 0.5, 0.08), hullMat, "gs-skid-leg", sx, 0.32, -0.8));
  }
  // stub wings + rocket pods
  root.add(makePart(new THREE.BoxGeometry(4.9, 0.16, 1.0), hullMat, "gs-wings", 0, 1.0, 0.35));
  for (const sx of [-2.15, 2.15]) {
    root.add(makePart(new THREE.CylinderGeometry(0.28, 0.28, 1.0, 10), chitin, "gs-pod", sx, 0.92, 0.45, Math.PI / 2, 0, 0));
    root.add(makePart(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 10), accentMat, "gs-pod-face", sx, 0.92, 0.98, Math.PI / 2, 0, 0));
  }
  // chin gun
  root.add(makePart(new THREE.CylinderGeometry(0.1, 0.12, 1.1, 8), armor, "gs-chin-gun", 0, 0.32, 2.2, Math.PI / 2, 0, 0));
  root.add(makePart(new THREE.BoxGeometry(0.3, 0.3, 0.4), hullMat, "gs-chin-mount", 0, 0.42, 1.85));
  // engine exhausts + nav lights
  for (const sx of [-0.55, 0.55]) {
    root.add(makePart(new THREE.CylinderGeometry(0.13, 0.17, 0.5, 8), armor, "gs-exhaust", sx, 1.35, -1.55, Math.PI / 2, 0, 0));
  }
  root.add(makePart(new THREE.SphereGeometry(0.07, 8, 8), lampRed, "gs-nav-l", -0.9, 1.15, 0.5));
  root.add(makePart(new THREE.SphereGeometry(0.07, 8, 8), lampGreen, "gs-nav-r", 0.9, 1.15, 0.5));
  root.add(makePart(new THREE.SphereGeometry(0.06, 8, 8), lampRed, "gs-nav-tail", 0, 2.0, -6.05));
  // main rotor
  const mast = makePart(new THREE.CylinderGeometry(0.11, 0.13, 0.5, 8), armor, "gs-mast", 0, 1.95, 0.1);
  root.add(mast);
  const mainRotor = new THREE.Group();
  mainRotor.position.set(0, 2.2, 0.1);
  mainRotor.add(makePart(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 10), accentMat, "gs-hub", 0, 0, 0));
  for (let i = 0; i < 4; i += 1) {
    const blade = makePart(new THREE.BoxGeometry(0.34, 0.05, 7.4), hullMat, "gs-blade", 0, 0, 0);
    blade.rotation.y = (i / 4) * Math.PI * 2;
    blade.position.set(Math.sin(blade.rotation.y) * 3.3, 0, Math.cos(blade.rotation.y) * 3.3);
    mainRotor.add(blade);
  }
  root.add(mainRotor);
  // tail rotor (disc in the XZ plane, mounted sideways)
  const tailRotor = new THREE.Group();
  tailRotor.position.set(0.28, 1.6, -6.0);
  tailRotor.rotation.z = Math.PI / 2;
  tailRotor.add(makePart(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 8), accentMat, "gs-tail-hub", 0, 0, 0));
  for (let i = 0; i < 2; i += 1) {
    const blade = makePart(new THREE.BoxGeometry(0.16, 0.04, 2.1), hullMat, "gs-tail-blade", 0, 0, 0);
    blade.rotation.y = i * Math.PI;
    tailRotor.add(blade);
  }
  root.add(tailRotor);
  root.userData.rotors = [mainRotor, tailRotor];
  root.scale.setScalar(scale);
  return root;
}

/** Update per-enemy skeletal `AnimationMixer` + two-handed rifle grip pose + rotors/shields each frame. */
export function animateEnemyMesh(enemy, mesh, dt) {
  if (!mesh) return;
  if (mesh.userData.mixer) {
    // Arms stay with the clip. The old hard-coded two-handed Euler pose was authored for one rig and
    // produced a T-pose / arms-out silhouette on every other one.
    mesh.userData.mixer.update(dt);
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
// ── LEVEL KIT ────────────────────────────────────────────────────────────────────────────────
// Buildings, streets and street furniture for the three maps. Everything here is deliberately
// placed from a layout table in maps.js — no random scatter, no repeated signage, and every solid
// box registers a matching collider so the fighter and the AI can path around it.
const LEVEL_MATERIALS = { ready: false };

function levelMaterials(texSize) {
  if (LEVEL_MATERIALS.ready) return LEVEL_MATERIALS;
  const size = Math.min(512, texSize * 2);
  // fbm noise, not stone blocks: the old ground read as a giant tiled chessboard
  LEVEL_MATERIALS.asphalt = standardMaterial({
    kind: "dirt", seed: 811, size: 512, palette: [0x13171b, 0x1c2127, 0x272d34],
    repeat: 18, roughness: 0.86, metalness: 0.1, bump: 0.05,
  });
  LEVEL_MATERIALS.concrete = standardMaterial({
    kind: "dirt", seed: 812, size: 512, palette: [0x2c3137, 0x3b4249, 0x4c545d],
    repeat: 16, roughness: 0.92, metalness: 0.05, bump: 0.04,
  });
  LEVEL_MATERIALS.dirt = standardMaterial({
    kind: "dirt", seed: 813, size: 512, palette: [0x241f18, 0x342c21, 0x453b2c],
    repeat: 40, roughness: 0.95, metalness: 0.02, bump: 0.1,
  });
  LEVEL_MATERIALS.hazard = standardMaterial({
    kind: "metal", seed: 814, size: 512, palette: [0x3a2a10, 0x6b4a12, 0xa8761a],
    repeat: 6, roughness: 0.6, metalness: 0.3,
  });
  LEVEL_MATERIALS.facade = [
    standardMaterial({ kind: "plaster", seed: 821, size, palette: [0x3c352c, 0x5a5142, 0x7a6e59], repeat: 3, roughness: 0.86, metalness: 0.05 }),
    standardMaterial({ kind: "masonry", seed: 822, size, palette: [0x2e333a, 0x464d56, 0x606974], repeat: 3, roughness: 0.88, metalness: 0.06 }),
    standardMaterial({ kind: "metal", seed: 823, size, palette: [0x252b31, 0x39424b, 0x515c67], repeat: 4, roughness: 0.62, metalness: 0.55 }),
  ];
  LEVEL_MATERIALS.roof = standardMaterial({
    kind: "stone", seed: 824, size: 256, palette: [0x14181d, 0x1f242a, 0x2b3138], repeat: 4, roughness: 0.9, metalness: 0.1,
  });
  LEVEL_MATERIALS.window = (() => {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 64;
    const g = c.getContext("2d");
    g.fillStyle = "#0c0f13"; g.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 8; i += 1) {
      const lit = (i * 7 + 3) % 5 !== 0;
      g.fillStyle = lit ? "#ffd9a0" : "#141a20";
      g.fillRect(6 + i * 31, 12, 22, 40);
      if (lit) { g.fillStyle = "rgba(255,217,160,0.22)"; g.fillRect(3 + i * 31, 9, 28, 46); }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  })();
  LEVEL_MATERIALS.lampGlow = new THREE.MeshStandardMaterial({
    color: 0xfff1cf, emissive: 0xffd9a0, emissiveIntensity: 2.2, roughness: 0.3, metalness: 0.2,
  });
  LEVEL_MATERIALS.lampPole = new THREE.MeshStandardMaterial({ color: 0x23282e, metalness: 0.75, roughness: 0.4 });
  LEVEL_MATERIALS.ready = true;
  return LEVEL_MATERIALS;
}

const KENNEY_SIZE = {
  "ki/building-a": [2.08, 1.47, 1.24], "ki/building-b": [2.08, 1.47, 1.26],
  "ki/building-c": [1.88, 1.25, 2.11], "ki/building-d": [0.88, 1.41, 1.42],
  "ki/building-e": [1.68, 1.65, 1.29], "ki/building-f": [1.79, 1.92, 1.28],
  "ki/building-g": [1.68, 1.28, 1.28], "ki/building-h": [1.32, 0.73, 1.31],
  "ki/building-i": [1.03, 0.73, 1.30], "ki/building-j": [1.03, 0.86, 1.30],
  "ki/chimney-large": [1.08, 1.70, 1.08], "ki/detail-tank-large": [1.51, 0.96, 1.65],
  "ki/detail-tank": [0.85, 0.42, 0.52], "ki/water-tower": [0.85, 2.14, 0.83],
  "ki/shipping-container-a": [0.37, 0.35, 0.82], "ki/shipping-container-b": [0.37, 0.35, 0.82],
  "kc/building-a": [0.88, 1.29, 0.94], "kc/building-b": [0.97, 1.29, 0.94],
  "kc/building-c": [0.88, 0.89, 1.09], "kc/building-d": [0.84, 1.29, 0.90],
  "kc/building-e": [1.64, 0.89, 1.01], "kc/building-f": [0.84, 1.69, 1.03],
  "kc/building-g": [0.97, 1.69, 0.92], "kc/building-h": [0.88, 1.29, 1.01],
  "kc/building-i": [1.24, 1.68, 1.30], "kc/building-j": [2.08, 1.69, 1.34],
  "kc/low-detail-building-a": [0.5, 2.00, 0.5], "kc/low-detail-building-b": [0.5, 2.23, 0.5],
  "kc/low-detail-building-c": [0.5, 2.25, 0.5], "kc/low-detail-building-d": [0.5, 1.75, 0.5],
  "kr/dumpster": [0.28, 0.21, 0.37], "kr/construction-light": [0.08, 0.23, 0.08],
  "kr/construction-barrier": [0.14, 0.13, 0.22], "kr/construction-fence": [0.5, 0.3, 0.2],
  "kr/electricity-pole": [0.58, 0.52, 0.21], "kr/electricity-pole-single": [0.08, 0.52, 0.21],
  "kr/electricity-pole-wide": [1.08, 0.52, 0.21],
};

/**
 * Place a vendored Kenney model at a target HEIGHT. The native kits are ~0.5 m per unit, so every
 * placement is scaled by targetHeight / nativeHeight; the collider is registered from the same
 * table immediately (before the GLB resolves) so the nav grid is correct on the first flood.
 */
function addKenneyModel(group, name, x, z, rotY, targetHeight, addBox, addCircle, tag) {
  const size = KENNEY_SIZE[name];
  if (!size) return false;
  const scale = (targetHeight || size[1] * 6) / size[1];
  const hw = (size[0] * scale) / 2;
  const hd = (size[2] * scale) / 2;
  withGltf(name, (gltf) => {
    const wrap = new THREE.Group();
    wrap.position.set(x, 0, z);
    wrap.rotation.y = rotY || 0;
    wrap.userData.tag = tag || name;
    const inst = gltf.scene.clone(true);
    inst.scale.setScalar(scale);
    inst.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      // night-grade the flat Kenney palette; the lit windows are added as bands below
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m || !m.color) continue;
        m.color.multiplyScalar(0.72);
        m.roughness = Math.min(0.92, (m.roughness ?? 0.7) + 0.06);
        if (m.emissive) { m.emissive.set(0x05070a); m.emissiveIntensity = 1; }
      }
    });
    wrap.add(inst);
    // warm lit-window bands on the long faces: the atlas windows are unlit, which is why the first
    // pass read as grey boxes in the dark
    const windowMat = LEVEL_MATERIALS.window;
    // only actual buildings get window bands (the water tower and chimney were sprouting them)
    if (windowMat && tag !== "skyline" && name.includes("building")) {
      const faceW = size[0] * scale * 0.9;
      const bandH = Math.min(1.5, targetHeight * 0.13);
      for (const side of [1, -1]) {
        for (const fy of [0.38, 0.7]) {
          const band = new THREE.Mesh(new THREE.PlaneGeometry(faceW, bandH), windowMat.clone());
          band.material.map = windowMat.map.clone();
          band.material.map.needsUpdate = true;
          band.material.map.repeat.set(Math.max(1, Math.round(faceW / 2.4)), 1);
          band.position.set(0, targetHeight * fy, side * (size[2] * scale * 0.5 + 0.06));
          band.rotation.y = side > 0 ? 0 : Math.PI;
          wrap.add(band);
        }
      }
    }
    group.add(wrap);
  });
  if (addBox) addBox(x, z, hw * 0.9, hd * 0.9, rotY || 0, true, tag || name);
  return true;
}

function groundPatch(group, mat, x, z, w, d, rotY = 0, y = 0.012) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = rotY;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.userData.tag = "ground-patch";
  group.add(mesh);
  return mesh;
}

function laneStripe(group, mat, x, z, w, d, rotY = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, d), mat);
  mesh.position.set(x, 0.02, z);
  mesh.rotation.y = rotY;
  mesh.userData.tag = "lane-stripe";
  group.add(mesh);
  return mesh;
}

/**
 * One building: body, roof, a lit window band on every face, a door and roof vents.
 * Registers an OBB collider so the nav grid and the fighter both treat it as solid.
 */
function addBuilding(group, b, addBox, mats) {
  const { x, z, w, d, h } = b;
  const rotY = b.rot || 0;
  const style = b.style || 0;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  g.userData.tag = "building";
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.facade[style % mats.facade.length]);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.35, d + 0.5), mats.roof);
  roof.position.y = h + 0.15;
  g.add(roof);
  // parapet
  for (const [px, pz, pw, pd] of [[0, -d / 2, w + 0.5, 0.3], [0, d / 2, w + 0.5, 0.3], [-w / 2, 0, 0.3, d + 0.5], [w / 2, 0, 0.3, d + 0.5]]) {
    const pp = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.5, pd), mats.roof);
    pp.position.set(px, h + 0.5, pz);
    g.add(pp);
  }
  // window bands: two floors, on all four faces
  const bands = Math.max(1, Math.min(3, Math.floor(h / 3.4)));
  for (let floor = 0; floor < bands; floor += 1) {
    const y = 1.6 + floor * 2.6;
    for (const [nx, nz, len, ry] of [[0, d / 2 + 0.03, w * 0.86, 0], [0, -d / 2 - 0.03, w * 0.86, Math.PI], [w / 2 + 0.03, 0, d * 0.86, Math.PI / 2], [-w / 2 - 0.03, 0, d * 0.86, -Math.PI / 2]]) {
      const band = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.85), mats.window.clone());
      band.material.map = mats.window.map.clone();
      band.material.map.needsUpdate = true;
      band.material.map.repeat.set(Math.max(1, Math.round(len / 2.4)), 1);
      band.position.set(nx, y, nz);
      band.rotation.y = ry;
      g.add(band);
    }
  }
  // door + roof vents
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.16), mats.roof);
  door.position.set(0, 1.1, d / 2 + 0.06);
  g.add(door);
  for (let i = 0; i < 2; i += 1) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.0), mats.lampPole);
    vent.position.set((i === 0 ? -1 : 1) * w * 0.22, h + 0.75, -d * 0.18);
    g.add(vent);
  }
  group.add(g);
  const c = Math.abs(Math.cos(rotY)), s0 = Math.abs(Math.sin(rotY));
  addBox(x, z, (w / 2) * c + (d / 2) * s0, (d / 2) * c + (w / 2) * s0, 0, true, "building");
  return g;
}

/** A street lamp: pole, arm, emissive head. Lights are emissive only — no extra PointLights. */
function addLamp(group, x, z, rotY, mats) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 5.6, 8), mats.lampPole);
  pole.position.y = 2.8;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.5), mats.lampPole);
  arm.position.set(0, 5.5, 0.7);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.8), mats.lampGlow);
  head.position.set(0, 5.4, 1.4);
  g.add(pole, arm, head);
  group.add(g);
  return g;
}

/** Ground treatment + buildings + lamps for each map. */
function buildMapLevel(map, group, addBox, addCircle, texSize) {
  const mats = levelMaterials(texSize);
  const level = map.level;
  if (!level) return false;
  // base surface
  const base = level.ground === "concrete" ? mats.concrete : level.ground === "dirt" ? mats.dirt : mats.asphalt;
  groundPatch(group, base, 0, 0, 132, 132, 0, 0.008);
  // roads / pads
  for (const r of level.roads || []) groundPatch(group, mats[r.mat || "asphalt"], r.x, r.z, r.w, r.d, r.rot || 0, 0.018);
  for (const p of level.pads || []) groundPatch(group, mats[p.mat || "concrete"], p.x, p.z, p.w, p.d, p.rot || 0, 0.02);
  // lane paint
  const paint = new THREE.MeshBasicMaterial({ color: 0xd8d2c4 });
  for (const s0 of level.stripes || []) laneStripe(group, paint, s0.x, s0.z, s0.w, s0.d, s0.rot || 0);
  // buildings: a vendored Kenney model when the layout names one, otherwise the procedural block
  for (const b of level.buildings || []) {
    if (b.model && addKenneyModel(group, b.model, b.x, b.z, b.rot || 0, b.h, addBox, addCircle, "building")) continue;
    addBuilding(group, b, addBox, mats);
  }
  // distant skyline (no colliders: it lives outside the wall)
  for (const sb of level.skyline || []) {
    addKenneyModel(group, sb.model, sb.x, sb.z, sb.rot || 0, sb.h, null, null, "skyline");
  }
  // small street props
  for (const pr of level.streetProps || []) {
    addKenneyModel(group, pr.model, pr.x, pr.z, pr.rot || 0, pr.h, (x, z, hx, hz, ry) => addCircle(x, z, Math.max(hx, hz) * 0.8), null, "street-prop");
  }
  // silos (foundry)
  for (const s0 of level.silos || []) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(s0.r, s0.r, s0.h, 16), mats.facade[2]);
    body.position.set(s0.x, s0.h / 2, s0.z);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(s0.r * 0.55, s0.r, 1.2, 16), mats.roof);
    cap.position.set(s0.x, s0.h + 0.6, s0.z);
    group.add(cap);
    addCircle(s0.x, s0.z, s0.r);
  }
  // machinery blocks
  for (const m of level.machines || []) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(m.w, m.h, m.d), mats.facade[2]);
    body.position.set(m.x, m.h / 2, m.z);
    body.rotation.y = m.rot || 0;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    const hatch = new THREE.Mesh(new THREE.BoxGeometry(m.w * 0.6, 0.18, m.d * 0.6), mats.hazard);
    hatch.position.set(m.x, m.h + 0.09, m.z);
    hatch.rotation.y = m.rot || 0;
    group.add(hatch);
    addBox(m.x, m.z, m.w / 2, m.d / 2, m.rot || 0, true, "machine");
  }
  // street furniture
  for (const l of level.lamps || []) addLamp(group, l.x, l.z, l.rot || 0, mats);
  return true;
}

// ── NAV GRID (flow field) ─────────────────────────────────────────────────────────────────────
// Buildings are big; local whisker steering alone walks enemies into corners. A 2.5 m grid marks
// everything solid, a BFS from the operator produces a distance field, and a walker reads the
// steepest descent. Rebuilt on map change, re-flooded ~3x a second.
const NAV = {
  cell: 2.5, min: -58, size: 47, blocked: null, dist: null, queue: null,
  timer: 0, curIx: -1, curIz: -1, ready: false,
};

/** Mark solid cells from the current collider set. Call after a map is built. */
export function rebuildNavGrid(colliders = arenaColliders) {
  const N = NAV.size;
  const n = N * N;
  if (!NAV.blocked) {
    NAV.blocked = new Uint8Array(n);
    NAV.dist = new Int16Array(n);
    NAV.queue = new Int16Array(n);
  }
  NAV.blocked.fill(0);
  for (let iz = 0; iz < N; iz += 1) {
    for (let ix = 0; ix < N; ix += 1) {
      const cx = NAV.min + (ix + 0.5) * NAV.cell;
      const cz = NAV.min + (iz + 0.5) * NAV.cell;
      const i = iz * N + ix;
      if (Math.hypot(cx, cz) > 56 || pointHitsCollider(cx, cz, 0.7, colliders)) NAV.blocked[i] = 1;
    }
  }
  NAV.ready = true;
  NAV.timer = 0;
  NAV.curIx = -1;
}

const NAV_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Re-flood the field toward `target` when it moves a cell (or every 0.35 s). */
export function navStep(dt, target) {
  if (!NAV.ready || !target) return;
  const N = NAV.size;
  const ix = Math.floor((target.x - NAV.min) / NAV.cell);
  const iz = Math.floor((target.z - NAV.min) / NAV.cell);
  if (ix < 0 || iz < 0 || ix >= N || iz >= N) return;
  NAV.timer -= dt;
  if (NAV.timer > 0 && ix === NAV.curIx && iz === NAV.curIz) return;
  NAV.timer = 0.35;
  NAV.curIx = ix;
  NAV.curIz = iz;
  NAV.dist.fill(9999);
  const q = NAV.queue;
  let head = 0;
  let tail = 0;
  const start = iz * N + ix;
  NAV.dist[start] = 0;
  q[tail++] = start;
  while (head < tail) {
    const idx = q[head++];
    const d = NAV.dist[idx];
    const cx = idx % N;
    const cz = (idx / N) | 0;
    for (const [dx, dz] of NAV_DIRS) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (nx < 0 || nz < 0 || nx >= N || nz >= N) continue;
      const ni = nz * N + nx;
      if (NAV.blocked[ni]) continue;
      if (dx !== 0 && dz !== 0 && (NAV.blocked[cz * N + nx] || NAV.blocked[nz * N + cx])) continue;
      if (NAV.dist[ni] <= d + 1) continue;
      NAV.dist[ni] = d + 1;
      q[tail++] = ni;
    }
  }
}

/** Steepest-descent direction for a world point, or null when no route exists. */
export function navDirection(x, z) {
  if (!NAV.ready || !NAV.dist) return null;
  const N = NAV.size;
  const ix = Math.floor((x - NAV.min) / NAV.cell);
  const iz = Math.floor((z - NAV.min) / NAV.cell);
  if (ix < 0 || iz < 0 || ix >= N || iz >= N) return null;
  const here = NAV.dist[iz * N + ix];
  // A body can be pushed into a blocked cell (cover, silo, building overlap). Escape toward the
  // nearest reachable cell instead of returning "no route" and falling back to local steering,
  // which is exactly how a walker ends up vibrating against a wall.
  if (here >= 9999 || NAV.blocked[iz * N + ix]) {
    let best = null;
    let bestD = 9999;
    for (let r = 1; r <= 5 && !best; r += 1) {
      for (let dz = -r; dz <= r; dz += 1) {
        for (let dx = -r; dx <= r; dx += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const nx = ix + dx;
          const nz = iz + dz;
          if (nx < 0 || nz < 0 || nx >= N || nz >= N) continue;
          const ni = nz * N + nx;
          if (NAV.blocked[ni] || NAV.dist[ni] >= 9999) continue;
          if (NAV.dist[ni] < bestD) { bestD = NAV.dist[ni]; best = { nx, nz }; }
        }
      }
    }
    if (!best) return null;
    const tx0 = NAV.min + (best.nx + 0.5) * NAV.cell;
    const tz0 = NAV.min + (best.nz + 0.5) * NAV.cell;
    const dx0 = tx0 - x;
    const dz0 = tz0 - z;
    const len0 = Math.hypot(dx0, dz0) || 1;
    return { x: dx0 / len0, z: dz0 / len0 };
  }
  let bestD = here;
  let bx = 0;
  let bz = 0;
  for (const [dx, dz] of NAV_DIRS) {
    const nx = ix + dx;
    const nz = iz + dz;
    if (nx < 0 || nz < 0 || nx >= N || nz >= N) continue;
    const ni = nz * N + nx;
    if (NAV.blocked[ni]) continue;
    if (dx !== 0 && dz !== 0 && (NAV.blocked[iz * N + nx] || NAV.blocked[nz * N + ix])) continue;
    if (NAV.dist[ni] < bestD) { bestD = NAV.dist[ni]; bx = dx; bz = dz; }
  }
  if (bx === 0 && bz === 0) return null;
  const len = Math.hypot(bx, bz) || 1;
  return { x: bx / len, z: bz / len };
}

/** QA: report the nav grid so a test can prove routes exist. */
export function navInfo() {
  if (!NAV.ready) return { ready: false };
  let blocked = 0;
  for (let i = 0; i < NAV.blocked.length; i += 1) blocked += NAV.blocked[i];
  return { ready: true, cells: NAV.blocked.length, blocked, reachable: NAV.dist ? Array.from(NAV.dist).filter((d) => d < 9999).length : 0 };
}

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

    // the level kit: ground treatment, buildings, silos, machinery, street lamps
    buildMapLevel(map, propGroup, addBoxCollider, addCircleCollider, texSize);
    rebuildNavGrid(arenaColliders);
    // Kenney models arrive asynchronously on first load; re-flood the field once they exist
    setTimeout(() => { try { rebuildNavGrid(arenaColliders); } catch (e) {} }, 1600);

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
function buildMechBossModel(bank) {
  const root = new THREE.Group();
  root.userData.tag = "mech-boss";
  const armor = bank.darkArmor || bank.enemyMat;
  const chitin = bank.chitin || bank.enemyMat;
  const red = bank.redOptic || armor;
  const plate = new THREE.MeshStandardMaterial({
    color: 0x3a3038, metalness: 0.7, roughness: 0.42, emissive: 0x1a0507, emissiveIntensity: 0.4,
  });
  ensureBakedMaterial(plate, "mech-boss", 1);
  const core = new THREE.MeshStandardMaterial({
    color: 0xff3b3b, emissive: 0xff2a2a, emissiveIntensity: 2.0, roughness: 0.2, metalness: 0.5,
  });
  const leg = (sx) => {
    root.add(makePart(new THREE.BoxGeometry(0.62, 1.9, 0.72), plate, "mb-thigh", sx, 1.75, 0));
    root.add(makePart(new THREE.BoxGeometry(0.5, 1.7, 0.62), armor, "mb-shin", sx, 0.85, 0.06));
    root.add(makePart(new THREE.BoxGeometry(0.78, 0.3, 1.25), plate, "mb-foot", sx, 0.15, 0.22));
    root.add(makePart(new THREE.BoxGeometry(0.4, 0.4, 0.4), red, "mb-knee", sx, 1.15, 0.3));
  };
  leg(-0.85);
  leg(0.85);
  root.add(makePart(new THREE.BoxGeometry(2.0, 0.5, 1.1), plate, "mb-hips", 0, 2.75, 0));
  root.add(makePart(new THREE.BoxGeometry(2.3, 1.55, 1.35), plate, "mb-torso", 0, 3.8, 0));
  root.add(makePart(new THREE.BoxGeometry(1.15, 0.42, 0.2), core, "mb-visor", 0, 4.25, 0.72));
  root.add(makePart(new THREE.BoxGeometry(1.5, 0.35, 0.3), armor, "mb-collar", 0, 4.6, 0.1));
  for (const sx of [-1.5, 1.5]) {
    root.add(makePart(new THREE.BoxGeometry(0.7, 0.8, 0.9), armor, "mb-shoulder", sx, 4.2, 0));
    root.add(makePart(new THREE.BoxGeometry(0.45, 1.5, 0.45), plate, "mb-arm", sx, 3.3, 0.1));
    root.add(makePart(new THREE.BoxGeometry(0.55, 0.45, 0.7), plate, "mb-fist", sx, 2.55, 0.25));
  }
  // right arm rotary cannon
  for (let i = 0; i < 3; i += 1) {
    root.add(makePart(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 6), armor, "mb-barrel", 1.75 + (i - 1) * 0.16, 2.7, 0.85, Math.PI / 2, 0, 0));
  }
  root.add(makePart(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 8), plate, "mb-cannon", 1.75, 2.7, 0.2, Math.PI / 2, 0, 0));
  // left arm missile pod
  for (let i = 0; i < 4; i += 1) {
    const sx = -1.75 + (i % 2) * 0.3;
    const sy = 2.95 - Math.floor(i / 2) * 0.32;
    root.add(makePart(new THREE.CylinderGeometry(0.11, 0.11, 0.24, 8), red, "mb-missile", sx, sy, 0.62, Math.PI / 2, 0, 0));
  }
  root.add(makePart(new THREE.BoxGeometry(0.7, 0.75, 0.6), plate, "mb-pod", -1.75, 2.8, 0.35));
  // backpack vents + antenna
  root.add(makePart(new THREE.BoxGeometry(1.5, 0.9, 0.4), armor, "mb-pack", 0, 4.0, -0.8));
  root.add(makePart(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), armor, "mb-antenna", -0.8, 4.9, -0.6));
  root.scale.setScalar(1.15);
  return root;
}

/** The arena boss. `kind` picks the right body: the gunship flies, the warden walks. */
export function buildBossMesh(materials, kind = "mech") {
  if (kind === "gunship") {
    const heli = buildGunshipModel(materials, { scale: 1.3 });
    heli.userData.tag = "boss";
    return heli;
  }
  return buildMechBossModel(materials);
}
