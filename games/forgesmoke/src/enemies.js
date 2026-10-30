/**
 * Enemy system — types, spawning, behavior, damage.
 * Pure logic, no rendering. Rendering handled by main.js.
 */

import * as THREE from "three";
import { TUNING } from "./tuning.js?v=202610327q";
import { enemyHpAt, enemySpeedAt, damageAfterArmour, shieldGate } from "./balance.js?v=202610327q";
import {
  buildEnemyMesh,
  animateEnemyMesh,
  arenaColliders,
  resolveObstacleCollision,
  steerAroundObstacles,
  segmentHitsCollider,
  navStep,
  navDirection,
} from "./models.js?v=202610327q";

export const ENEMY_TYPES = {
  rifleman: "rifleman",
  sapper: "sapper",
  shieldbearer: "shieldbearer",
  spotter: "spotter",
  drone: "drone",
  mortar: "mortar",
  mech: "mech",
  gunship: "gunship",
};

/** MOV-02 slot bias: 0 is the front slot (where the player's gun points), PI is the rear. */
const SLOT_BIAS = {
  shieldbearer: 0,
  rifleman: (Math.PI * 2) / 3,
  spotter: Math.PI / 2,
  sapper: Math.PI,
  mortar: -Math.PI / 2,
  mech: 0.35,
  drone: 0,
  gunship: 0,
};

export class Enemy {
  constructor(type, position, rng, timeMinutes = 0) {
    this.type = type;
    this.config = TUNING.enemies[type] || (TUNING.boss && TUNING.boss[type]);
    this.mesh = null; // Set by main.js
    this.position = position.clone();
    this.velocity = { x: 0, z: 0 };
    this.hp = enemyHpAt(this.config.hp, timeMinutes);
    this.maxHp = this.hp;
    this.speed = enemySpeedAt(this.config.speed, timeMinutes);
    this.phase = rng() * Math.PI * 2;
    this.meleeCooldown = this.config.meleeCooldown || 0;
    this.specialCooldown = 0;
    this.isElite = false;
    this.painted = false;
    this.paintTimer = 0;
    this.shieldAngle = 0; // For shieldbearer facing
    this.isShielded = type === "shieldbearer";
    this.flanked = false;
    this.rng = rng;
  }

  /** Update enemy AI and movement. Returns action if any. */
  update(dt, playerPos, timeMinutes) {
    this.meleeCooldown = Math.max(0, this.meleeCooldown - dt);
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.paintTimer = Math.max(0, this.paintTimer - dt);
    if (this.paintTimer <= 0) this.painted = false;

    // Update HP scaling for elapsed time (if not already applied)
    // Note: base HP already scaled at spawn; this handles dynamic scaling if needed

    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const distance = Math.hypot(dx, dz) || 1;
    const dirX = dx / distance;
    const dirZ = dz / distance;

    // An unarmed rifle-carrier orbiting at carbine range did nothing for the rest of the run.
    if (this.canShoot === false && (this.type === "rifleman" || this.type === "spotter")) {
      return this.updateCharger(dt, dirX, dirZ, distance);
    }

    // Type-specific behavior
    switch (this.type) {
      case ENEMY_TYPES.rifleman:
        return this.updateRifleman(dt, dirX, dirZ, distance);
      case ENEMY_TYPES.sapper:
        return this.updateSapper(dt, dirX, dirZ, distance);
      case ENEMY_TYPES.shieldbearer:
        return this.updateShieldbearer(dt, dirX, dirZ, distance, playerPos);
      case ENEMY_TYPES.spotter:
        return this.updateSpotter(dt, dirX, dirZ, distance);
      case ENEMY_TYPES.drone:
        return this.updateDrone(dt, dirX, dirZ, distance);
      case ENEMY_TYPES.mortar:
        return this.updateMortar(dt, dirX, dirZ, distance);
      case ENEMY_TYPES.mech:
        return this.updateMech(dt, dirX, dirZ, distance);
      case ENEMY_TYPES.gunship:
        return this.updateGunship(dt, dirX, dirZ, distance);
    }
    return null;
  }

  /** No gun? Close the distance and swing. Used by any rifle-carrier that rolled "unarmed". */
  updateCharger(dt, dirX, dirZ, distance) {
    const meleeRange = (this.config.meleeRange || 1.6) * 0.9;
    if (distance > meleeRange) {
      this.velocity.x = dirX * this.speed * 1.15;
      this.velocity.z = dirZ * this.speed * 1.15;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      if (this.meleeCooldown <= 0) {
        this.meleeCooldown = this.config.meleeCooldown || 1.0;
        return { type: "melee", damage: this.config.meleeDamage || 9 };
      }
    }
    return null;
  }

  updateRifleman(dt, dirX, dirZ, distance) {
    const meleeRange = this.config.meleeRange || 1.6;
    const carbineRange = 14;
    const strafeSign = this.phase > Math.PI ? 1 : -1;
    if (distance > carbineRange) {
      this.velocity.x = dirX * this.speed;
      this.velocity.z = dirZ * this.speed;
    } else if (distance > meleeRange) {
      // Tactical strafing at carbine range while firing crimson bursts
      const perpX = -dirZ * strafeSign;
      const perpZ = dirX * strafeSign;
      this.velocity.x = (dirX * 0.35 + perpX * 0.75) * this.speed;
      this.velocity.z = (dirZ * 0.35 + perpZ * 0.75) * this.speed;
      if (this.specialCooldown <= 0 && this.canShoot !== false) {
        this.specialCooldown = 1.15 + (this.phase % 0.4);
        return {
          type: "rangedShot",
          dirX,
          dirZ,
          speed: 14.5,
          damage: 6,
          color: 0xff3b3b,
        };
      }
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      if (this.meleeCooldown <= 0) {
        this.meleeCooldown = this.config.meleeCooldown || 1.0;
        return { type: "melee", damage: this.config.meleeDamage || 9 };
      }
    }
    return null;
  }

  updateSapper(dt, dirX, dirZ, distance) {
    const chargeRange = 2.8;
    if (distance > chargeRange) {
      // High-speed serpentine weave toward player
      const weave = Math.sin(Date.now() * 0.005 + this.phase) * 0.55;
      const wx = dirX - dirZ * weave;
      const wz = dirZ + dirX * weave;
      const len = Math.hypot(wx, wz) || 1;
      this.velocity.x = (wx / len) * this.speed;
      this.velocity.z = (wz / len) * this.speed;
    } else if (this.specialCooldown <= 0) {
      // Plant proximity charge and leap back
      this.velocity.x = -dirX * this.speed * 1.2;
      this.velocity.z = -dirZ * this.speed * 1.2;
      this.specialCooldown = (this.config.chargeFuse || 2.0) + 1.5;
      return {
        type: "charge",
        x: this.position.x + dirX * 0.8,
        z: this.position.z + dirZ * 0.8,
        fuse: this.config.chargeFuse || 2.0,
        radius: 3.4,
        damage: this.config.chargeDamage || 32,
      };
    } else {
      this.velocity.x = -dirX * this.speed * 0.4;
      this.velocity.z = -dirZ * this.speed * 0.4;
    }
    return null;
  }

  updateShieldbearer(dt, dirX, dirZ, distance, playerPos) {
    const meleeRange = this.config.meleeRange || 1.8;
    // The wall turns toward the player at a limited rate. Snapping it instantly made `flanked`
    // unreachable by position (angleDiff was always 0), so the shield could never be outmanoeuvred.
    const want = Math.atan2(dirX, dirZ);
    let turn = want - this.shieldAngle;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    const maxTurn = 0.75 * dt; // ~43 deg/s: a heavy shield, a fighter can beat it on the outside
    this.shieldAngle += Math.max(-maxTurn, Math.min(maxTurn, turn));
    // Check if flanked (player behind shield)
    const toPlayer = Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z);
    // strict frontal arc: the wall covers the front 220 degrees, so only a genuine flank (or an
    // explosive / grenade) gets through. Walking around him takes real effort.
    let angleDiff = toPlayer - this.shieldAngle;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    this.flanked = Math.abs(angleDiff) > Math.PI / 2;
    this.isShielded = !this.flanked;

    if (distance > meleeRange) {
      this.velocity.x = dirX * this.speed;
      this.velocity.z = dirZ * this.speed;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      if (this.meleeCooldown <= 0) {
        this.meleeCooldown = this.config.meleeCooldown || 1.2;
        return { type: "melee", damage: this.config.meleeDamage || 12 };
      }
    }
    return null;
  }

  updateSpotter(dt, dirX, dirZ, distance) {
    const paintRange = 18.0;
    const minRange = 10.0;
    if (distance > paintRange) {
      this.velocity.x = dirX * this.speed;
      this.velocity.z = dirZ * this.speed;
    } else if (distance < minRange) {
      this.velocity.x = -dirX * this.speed * 0.7;
      this.velocity.z = -dirZ * this.speed * 0.7;
    } else {
      const strafe = this.phase > Math.PI ? 0.55 : -0.55;
      this.velocity.x = -dirZ * strafe * this.speed;
      this.velocity.z = dirX * strafe * this.speed;
      if (this.specialCooldown <= 0) {
        this.specialCooldown = 2.4;
        if (this.canShoot === false) return null;
        this.painted = true;
        this.paintTimer = 2.4;
        return {
          type: "rangedShot",
          dirX,
          dirZ,
          speed: 21.0,
          damage: 10,
          color: 0xff6fd6,
          isSniper: true,
        };
      }
    }
    return null;
  }

  updateDrone(dt, dirX, dirZ, distance) {
    const orbitRadius = 8.0;
    const diveRange = 12.0;
    if (distance > orbitRadius) {
      // Orbit player
      const orbitDir = Math.atan2(dirX, dirZ) + Math.PI / 2;
      this.velocity.x = Math.sin(orbitDir) * this.speed;
      this.velocity.z = Math.cos(orbitDir) * this.speed;
    } else if (distance < diveRange && this.specialCooldown <= 0) {
      // Dive attack
      this.specialCooldown = this.config.diveCooldown || 3.0;
      this.velocity.x = dirX * this.speed * 2;
      this.velocity.z = dirZ * this.speed * 2;
      return { type: "dive", damage: this.config.diveDamage };
    } else {
      this.velocity.x = dirX * this.speed * 0.5;
      this.velocity.z = dirZ * this.speed * 0.5;
    }
    return null;
  }

  updateMortar(dt, dirX, dirZ, distance) {
    const minRange = 5.0;
    const maxRange = 30.0;
    if (distance < minRange) {
      // Move away
      this.velocity.x = -dirX * this.speed;
      this.velocity.z = -dirZ * this.speed;
    } else if (distance > maxRange) {
      // Move closer
      this.velocity.x = dirX * this.speed;
      this.velocity.z = dirZ * this.speed;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
      if (this.specialCooldown <= 0 && this.canShoot !== false) {
        this.specialCooldown = this.config.shellCooldown || 4.0;
        return {
          type: "shell",
          targetX: this.position.x + dirX * distance,
          targetZ: this.position.z + dirZ * distance,
          damage: this.config.shellDamage,
          radius: this.config.shellRadius,
          fuse: this.config.shellFuse,
        };
      }
    }
    return null;
  }

  updateMech(dt, dirX, dirZ, distance) {
    const minigunRange = 25.0;
    const stompRange = 4.0;
    if (distance > minigunRange) {
      this.velocity.x = dirX * this.speed;
      this.velocity.z = dirZ * this.speed;
    } else if (distance < stompRange && this.specialCooldown <= 0) {
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.specialCooldown = this.config.stompCooldown || 5.0;
      return { type: "stomp", radius: this.config.stompRadius, damage: this.config.stompDamage };
    } else {
      // keep a firing line: close to 14 m, open to 9 m, otherwise strafe across the operator
      const sign = this.phase > Math.PI ? 1 : -1;
      if (distance > 14) {
        this.velocity.x = dirX * this.speed * 0.5;
        this.velocity.z = dirZ * this.speed * 0.5;
      } else if (distance < 9) {
        this.velocity.x = -dirX * this.speed * 0.5;
        this.velocity.z = -dirZ * this.speed * 0.5;
      } else {
        this.velocity.x = -dirZ * sign * this.speed * 0.6;
        this.velocity.z = dirX * sign * this.speed * 0.6;
      }
      if (this.specialCooldown <= 0 && this.canShoot !== false) {
        this.specialCooldown = this.config.minigunCycle || 0.1;
        return { type: "minigun", damage: this.config.minigunDamage, dirX, dirZ };
      }
    }
    return null;
  }

  updateGunship(dt, dirX, dirZ, distance) {
    // The gunship used to return {type:"strafe"} and never write a velocity, so the boss hovered
    // in one spot for the whole fight. It now holds a 14-24 m ring around the operator.
    const speed = this.config.strafeSpeed || 4.0;
    const sign = this.phase > Math.PI ? 1 : -1;
    const perpX = -dirZ;
    const perpZ = dirX;
    if (distance > 24) {
      this.velocity.x = dirX * speed;
      this.velocity.z = dirZ * speed;
    } else if (distance < 14) {
      this.velocity.x = -dirX * speed * 0.85;
      this.velocity.z = -dirZ * speed * 0.85;
    } else {
      this.velocity.x = perpX * sign * speed;
      this.velocity.z = perpZ * sign * speed;
    }
    return { type: "strafe" };
  }

  /** Take damage. Returns true if killed. */
  takeDamage(amount, isFlank = false, armour = 0, pierce = 0) {
    const dmg = shieldGate(amount, {
      shielded: this.type === ENEMY_TYPES.shieldbearer && this.isShielded,
      flanked: Boolean(isFlank),
      pierce,
      armour,
    });
    this.hp -= dmg;
    return this.hp <= 0;
  }

  /** Get score value for this enemy. */
  getScoreValue() {
    return this.config.scoreValue || 12;
  }

  /** Get XP value for this enemy. */
  getXpValue() {
    return this.config.xpValue || 10;
  }

  /** Serialize for save. */
  serialize() {
    return {
      type: this.type,
      position: { x: this.position.x, z: this.position.z },
      hp: this.hp,
      maxHp: this.maxHp,
      speed: this.speed,
      phase: this.phase,
      meleeCooldown: this.meleeCooldown,
      specialCooldown: this.specialCooldown,
      painted: this.painted,
      paintTimer: this.paintTimer,
      isElite: this.isElite,
      isShielded: this.isShielded,
      flanked: this.flanked,
      shieldAngle: this.shieldAngle,
    };
  }

  /** Deserialize from save. */
  static deserialize(data, rng) {
    const enemy = new Enemy(data.type, { x: data.position.x, z: data.position.z, clone() { return this; } }, rng);
    enemy.hp = data.hp;
    enemy.maxHp = data.maxHp;
    enemy.speed = data.speed;
    enemy.phase = data.phase;
    enemy.meleeCooldown = data.meleeCooldown;
    enemy.specialCooldown = data.specialCooldown;
    enemy.painted = data.painted;
    enemy.paintTimer = data.paintTimer;
    enemy.isElite = data.isElite;
    enemy.isShielded = data.isShielded;
    enemy.flanked = data.flanked;
    enemy.shieldAngle = data.shieldAngle;
    return enemy;
  }
}

/** Enemy manager — handles spawning, pooling, updates. */
export class EnemyManager {
  constructor(rng, scene, materials, maxConcurrent = 20) {
    this.rng = rng;
    this.scene = scene;
    this.materials = materials;
    this.maxConcurrent = maxConcurrent;
    // The director raises `maxConcurrent` with difficulty; this is the ceiling it may never pass.
    // Before, the budget (8 + 3.2/min, cap 400) overwrote the 20-body cap, so a long run could
    // field scores of full skeletal rigs and the frame rate fell off a cliff.
    this.hardCap = maxConcurrent;
    this.enemies = [];
    this.enemyMeshes = new Map(); // enemy -> mesh
    this.spawnTimer = 0;
    this.timeMinutes = 0;
    this.spawnInterval = TUNING.director.baseSpawnInterval;
    this.currentBeat = null;
  }

  /** Spawn an enemy of given type at random angle around player. `force` ignores the body cap. */
  spawn(type, playerPos, timeMinutes = 0, force = false) {
    if (!force && this.enemies.length >= this.maxConcurrent) return null;
    const arenaR = (TUNING.player && TUNING.player.arenaRadius) || 54;
    const maxR = arenaR - 4;
    const minFromPlayer = 9;
    let position = null;
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const angle = this.rng() * Math.PI * 2;
      const radius = 13 + this.rng() * 13;   // 13-26 m from the player
      const candidate = {
        x: playerPos.x + Math.cos(angle) * radius,
        z: playerPos.z + Math.sin(angle) * radius,
        clone() { return { x: this.x, z: this.z }; },
      };
      // A spawn is measured from the PLAYER, so at the arena edge it could land 20 m outside the
      // wall (that is how a boss ended up in the dark). Pull it back onto the deck first.
      const cr = Math.hypot(candidate.x, candidate.z);
      if (cr > maxR) {
        const k = maxR / cr;
        candidate.x *= k;
        candidate.z *= k;
      }
      // never spawn on top of the operator, or inside cover
      if (Math.hypot(candidate.x - playerPos.x, candidate.z - playerPos.z) < minFromPlayer) {
        if (!position) position = candidate;
        continue;
      }
      const ox = candidate.x;
      const oz = candidate.z;
      resolveObstacleCollision(candidate, 0.85, arenaColliders);
      if (Math.hypot(candidate.x - ox, candidate.z - oz) < 0.35) { position = candidate; break; }
      if (!position) position = candidate;
    }
    const enemy = new Enemy(type, position, this.rng, timeMinutes);
    // Shooter ramp: 12 % of bodies can fire at t=0, climbing to 85 % by ~110 s. The rest still
    // advance and melee; gating happens in the type updates via enemy.canShoot.
    // The ramp is for RIFLE-CARRIERS only. Applying it to a mortar meant 88 % of mortars could
    // never fire their only weapon, the same for mechs — their whole identity was switched off.
    const minutes = Number(timeMinutes) || 0;
    const alwaysArmed = type === "mortar" || type === "mech" || type === "gunship" || type === "sapper";
    // 12 % at t=0 meant a four-rifleman squad could fire ZERO shots (measured in fightlab). The ramp
    // starts at 35 % and reaches 85 % by ~1.5 min, so the first contact already shoots back.
    enemy.canShoot = alwaysArmed ? true : this.rng() < Math.min(0.85, 0.35 + minutes * 0.34);
    this.spawnBodies = (this.spawnBodies || 0) + 1;
    if (enemy.canShoot) this.spawnShooters = (this.spawnShooters || 0) + 1;
    enemy.slot = this.slotSeq || 0;
    this.slotSeq = ((this.slotSeq || 0) + 1) % 8;
    this.enemies.push(enemy);
    // Create role-specific 3D model & skin so each enemy class reads at 32px+
    const mat = this.materials?.enemyMat;
    if (mat && this.scene) {
      const mesh = buildEnemyMesh(type, this.materials);
      mesh.position.set(position.x, 0.72, position.z);
      this.scene.add(mesh);
      enemy.mesh = mesh;
      this.enemyMeshes.set(enemy, mesh);
    }
    return enemy;
  }

  /** Spawn multiple enemies for a beat. */
  spawnWave(types, count, playerPos, timeMinutes = 0) {
    const spawned = [];
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(this.rng() * types.length)];
      const enemy = this.spawn(type, playerPos, timeMinutes);
      if (enemy) spawned.push(enemy);
    }
    return spawned;
  }

  /** Update all enemies. Returns array of actions. */
  update(dt, playerPos, timeMinutes, playerYaw = 0) {
    this.timeMinutes = timeMinutes;
    navStep(dt, playerPos);
    this.spawnTimer -= dt;
    const actions = [];

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const action = enemy.update(dt, playerPos, timeMinutes);
      if (action) actions.push({ enemy, action });

      // Update position with obstacle pathfinding / steering + solid collider pushback
      const isAerial = enemy.type === "drone" || enemy.type === "gunship";
      if (!isAerial) {
        let vx = enemy.velocity.x;
        let vz = enemy.velocity.z;
        let spd = Math.hypot(vx, vz);
        const dToPlayer = Math.hypot(enemy.position.x - playerPos.x, enemy.position.z - playerPos.z) || 1;
        // A walker that has stalled far away (wedged branch of its behaviour, blocked by cover) gets
        // a floor approach speed so it never reads as a frozen prop.
        const WALKERS = enemy.type === "rifleman" || enemy.type === "sapper" || enemy.type === "shieldbearer" || enemy.type === "spotter";
        if (WALKERS && spd < 0.35 && dToPlayer > 3.2) {
          const ax = playerPos.x - enemy.position.x;
          const az = playerPos.z - enemy.position.z;
          const al = Math.hypot(ax, az) || 1;
          spd = Math.max(0.75, (Number(enemy.speed) || 1.2) * 0.8);
          vx = (ax / al) * spd;
          vz = (az / al) * spd;
        }
        // a body that has reached its standoff can have zero velocity; the slot ring still needs to
        // pull it round to its angle, so give the fan a floor speed to work with
        const inRing = this.enemies.length > 1 && dToPlayer < 5;
        if (inRing && spd < 0.4) {
          spd = Math.max(0.8, Number(enemy.speed) || 1.2);
          vx = 0;
          vz = 0;
        }
        // the shield repositions at a trot: the front slot moves with the player's facing, and a
        // shield that walks at 1.1 m/s can never catch a turning target
        if (inRing && enemy.type === "shieldbearer") spd = Math.max(spd, 2.8);

        // MOV-02: slot fanning + separation. The shield takes the front slot, riflemen the flanks,
        // sappers the rear, so the crowd spreads around the player instead of stacking on one line.
        if (spd > 0.01) {
          if (enemy.type === "shieldbearer" && inRing) {
            // the shield OWNS the front slot: it walks to the point in front of the player's gun
            const ang = (Number(playerYaw) || 0);
            const sx = playerPos.x + Math.sin(ang) * 1.35 - enemy.position.x;
            const sz = playerPos.z + Math.cos(ang) * 1.35 - enemy.position.z;
            const sl = Math.hypot(sx, sz) || 1;
            vx = (sx / sl) * spd;
            vz = (sz / sl) * spd;
          } else if (inRing) {
            const bias = SLOT_BIAS[enemy.type] ?? 0;
            const spread = ((enemy.slot % 3) - 1) * 0.45;
            const ang = (Number(playerYaw) || 0) + bias + spread;
            const tX = playerPos.x + Math.sin(ang) * 1.3;
            const tZ = playerPos.z + Math.cos(ang) * 1.3;
            const sx = tX - enemy.position.x;
            const sz = tZ - enemy.position.z;
            const sl = Math.hypot(sx, sz) || 1;
            vx = vx * 0.55 + (sx / sl) * spd * 0.45;
            vz = vz * 0.55 + (sz / sl) * spd * 0.45;
          }
          // bodies inside 2.2 m push each other apart
          let px = 0;
          let pz = 0;
          for (const other of this.enemies) {
            if (other === enemy || other.hp <= 0) continue;
            const ox = enemy.position.x - other.position.x;
            const oz = enemy.position.z - other.position.z;
            const od = Math.hypot(ox, oz);
            if (od > 0.001 && od < 1.5) {
              const w = (1.5 - od) / 1.5;
              px += (ox / od) * w;
              pz += (oz / od) * w;
            }
          }
          if (px !== 0 || pz !== 0) {
            const pl = Math.hypot(px, pz) || 1;
            vx += (px / pl) * spd * 0.7;
            vz += (pz / pl) * spd * 0.7;
          }
          const nl = Math.hypot(vx, vz) || 1;
          vx = (vx / nl) * spd;
          vz = (vz / nl) * spd;
        }

        // Active detour: slide tangentially around whatever has been blocking this body.
        if (enemy._detour && enemy._detour.t > 0) {
          enemy._detour.t -= dt;
          vx = enemy._detour.x * spd;
          vz = enemy._detour.z * spd;
        }

        const colRadius = enemy.type === "mech" ? 1.05 : enemy.type === "shieldbearer" ? 0.75 : 0.55;
        // NAV: if the straight line to the operator is blocked by a building, take the flow field;
        // otherwise blend a little of it in so the body rounds corners instead of scraping them.
        enemy._navActive = false;
        if (WALKERS && spd > 0.05 && dToPlayer > 3.5) {
          const flow = navDirection(enemy.position.x, enemy.position.z);
          if (flow) {
            const blocked = segmentHitsCollider(enemy.position.x, enemy.position.z, playerPos.x, playerPos.z, arenaColliders);
            // straight line clear -> walk straight. The old 35 % blend made every approach curve
            // even with nothing in the way. Only the raster path steers when cover is in the line.
            if (blocked) {
              vx = flow.x * spd;
              vz = flow.z * spd;
              enemy._navActive = true;
            }
          }
        }
        // FACING is computed after the step for every body (see below the movement block).
        enemy._move = { x: vx, z: vz, spd };
        const stepX0 = enemy.position.x;
        const stepZ0 = enemy.position.z;
        if (spd > 0.01) {
          const steered = steerAroundObstacles(enemy.position, vx / spd, vz / spd, colRadius, arenaColliders);
          const sl = Math.hypot(steered.x, steered.z) || 1;
          const cap = Math.min(1, sl);
          enemy.position.x += (steered.x / sl) * cap * spd * dt;
          enemy.position.z += (steered.z / sl) * cap * spd * dt;
        }
        resolveObstacleCollision(enemy.position, colRadius, arenaColliders);
        {
          // soft arena edge: walkers cannot wander off the deck (they used to chase a target the
          // player could not reach and disappear into the dark)
          const er = Math.hypot(enemy.position.x, enemy.position.z);
          const edge = ((TUNING.player && TUNING.player.arenaRadius) || 54) - 1.5;
          if (er > edge) {
            const k = edge / er;
            enemy.position.x *= k;
            enemy.position.z *= k;
          }
        }
        // If a body wanted to move but the world ate the step, remember it; 0.7 s of that is a wedge.
        const actualStep = Math.hypot(enemy.position.x - stepX0, enemy.position.z - stepZ0);
        const wantedStep = spd * dt;
        if (wantedStep > 1e-4 && actualStep < wantedStep * 0.35) enemy._blocked = (enemy._blocked || 0) + dt;
        else enemy._blocked = Math.max(0, (enemy._blocked || 0) - dt * 2);
        if (enemy._blocked > 0.7 && (!enemy._detour || enemy._detour.t <= 0)) {
          const tdx = playerPos.x - enemy.position.x;
          const tdz = playerPos.z - enemy.position.z;
          const tl = Math.hypot(tdx, tdz) || 1;
          const side = ((enemy.slot || 0) % 2 === 0) ? 1 : -1;
          enemy._detour = { x: (-tdz / tl) * side, z: (tdx / tl) * side, t: 1.2 };
          enemy._blocked = 0;
        }

      // stuck-breaker: cover wedges bodies into a steer/push loop that reads as vibrating in place.
      // A per-frame check cannot see that (the jitter moves > 2 cm every frame), so compare against a
      // 0.6 s reference point: if the net gain is tiny while it wanted to move, detour tangentially.
      const distNow = Math.hypot(playerPos.x - enemy.position.x, playerPos.z - enemy.position.z);
      enemy._movCheck = (enemy._movCheck || 0) + dt;
      if (enemy._movCheck >= 0.6) {
        enemy._movCheck = 0;
        const rx = enemy._movRefX ?? enemy.position.x;
        const rz = enemy._movRefZ ?? enemy.position.z;
        const net = Math.hypot(enemy.position.x - rx, enemy.position.z - rz);
        const wantsMove = spd > 0.6 && distNow > 2.4;
        if (wantsMove && net < 0.30) {
          const tdx = playerPos.x - enemy.position.x;
          const tdz = playerPos.z - enemy.position.z;
          const tl = Math.hypot(tdx, tdz) || 1;
          const side = ((enemy.slot || 0) % 2 === 0) ? 1 : -1;
          enemy._detour = { x: (-tdz / tl) * side, z: (tdx / tl) * side, t: 0.9 };
          enemy._stuckCount = (enemy._stuckCount || 0) + 1;

        } else {
          enemy._stuckCount = 0;
        }
        enemy._movRefX = enemy.position.x;
        enemy._movRefZ = enemy.position.z;
      }
      } else {
        enemy.position.x += enemy.velocity.x * dt;
        enemy.position.z += enemy.velocity.z * dt;
        const er = Math.hypot(enemy.position.x, enemy.position.z);
        const edge = ((TUNING.player && TUNING.player.arenaRadius) || 54) - 2.5;
        if (er > edge) {
          const k = edge / er;
          enemy.position.x *= k;
          enemy.position.z *= k;
        }
      }
      // FACING — every body, including mechs, mortars and aircraft. A body looks where it travels
      // whenever it is routing around cover, backpedalling, or flying; otherwise it squares up.
      {
        const mvx = isAerial ? enemy.velocity.x : (enemy._move ? enemy._move.x : 0);
        const mvz = isAerial ? enemy.velocity.z : (enemy._move ? enemy._move.z : 0);
        const moving = Math.hypot(mvx, mvz) > 0.5;
        const travelYaw = Math.atan2(mvx, mvz);
        const aimYaw = Math.atan2(playerPos.x - enemy.position.x, playerPos.z - enemy.position.z);
        const turn = Math.atan2(Math.sin(travelYaw - aimYaw), Math.cos(travelYaw - aimYaw));
        const backpedal = Math.abs(turn) > Math.PI * 0.5;
        if (isAerial) enemy.faceYaw = moving ? travelYaw : aimYaw;
        else enemy.faceYaw = (moving && (backpedal || enemy._navActive)) ? travelYaw : aimYaw;
      }
      const AIR_ALT = { gunship: 6.4, drone: 4.6 };
    const alt = AIR_ALT[enemy.type] ?? (isAerial ? 3.4 : 0.72);
    enemy.position.y = alt + Math.sin(Date.now() * 0.001 * 4.5 + enemy.phase) * (isAerial ? 0.35 : 0);

      // Update mesh if exists
      const mesh = this.enemyMeshes.get(enemy);
      if (mesh) {
        mesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
        const wantYaw = Number.isFinite(enemy.faceYaw)
          ? enemy.faceYaw
          : Math.atan2(playerPos.x - enemy.position.x, playerPos.z - enemy.position.z);
        let dYaw = wantYaw - mesh.rotation.y;
        dYaw = Math.atan2(Math.sin(dYaw), Math.cos(dYaw));
        mesh.rotation.y += dYaw * Math.min(1, dt * 9);
        animateEnemyMesh(enemy, mesh, dt);
      }

      // Remove dead enemies
      if (enemy.hp <= 0) {
        if (mesh) {
          this.scene.remove(mesh);
          this.enemyMeshes.delete(enemy);
        }
        this.enemies.splice(i, 1);
      }
    }

    return actions;
  }

  /** Handle spawn logic based on current beat. */
  updateSpawning(dt, playerPos, beat) {
    this.currentBeat = beat;
    if (!beat) return;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.enemies.length < this.maxConcurrent) {
      const types = beat.enemyTypes || ["rifleman"];
      const type = types[Math.floor(this.rng() * types.length)];
      this.spawn(type, playerPos, this.timeMinutes);
      this.spawnTimer = beat.spawnInterval || this.spawnInterval;
    }
  }

  /** Find nearest enemy to position within angle. Dead bodies are not targets. */
  findNearest(playerPos, playerYaw, maxDistance = 19, angle = Math.PI * 2 / 3) {
    let best = null;
    let bestDist = maxDistance;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const dx = enemy.position.x - playerPos.x;
      const dz = enemy.position.z - playerPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < bestDist) {
        const enemyAngle = Math.atan2(dx, dz);
        const diff = Math.abs(enemyAngle - playerYaw);
        const normalizedDiff = Math.min(diff, Math.PI * 2 - diff);
        if (normalizedDiff <= angle / 2) {
          bestDist = dist;
          best = enemy;
        }
      }
    }
    return best;
  }

  /** Apply damage to enemy, return score/XP if killed. */
  damageEnemy(enemy, amount, isFlank = false, armour = 0, pierce = 0) {
    const killed = enemy.takeDamage(amount, isFlank, armour, pierce);
    if (killed) {
      const score = enemy.getScoreValue();
      const xp = enemy.getXpValue();
      // Remove handled in update()
      return { killed: true, score, xp, enemyType: enemy.type };
    }
    return { killed: false };
  }

  /** Get all enemies for targeting. */
  getEnemies() {
    return this.enemies;
  }

  /** Get enemy count. */
  getCount() {
    return this.enemies.length;
  }

  /** Clear all enemies. */
  clear() {
    for (const enemy of this.enemies) {
      const mesh = this.enemyMeshes.get(enemy);
      if (mesh) this.scene.remove(mesh);
    }
    this.enemies.length = 0;
    this.enemyMeshes.clear();
  }

  /** Set max concurrent (for difficulty scaling). Never above the hard cap from the constructor. */
  setMaxConcurrent(max) {
    const n = Math.max(1, Math.floor(Number(max) || 1));
    this.maxConcurrent = Math.min(this.hardCap || n, n);
  }

  /** Serialize for save. */
  serialize() {
    return {
      enemies: this.enemies.map(e => e.serialize()),
      spawnTimer: this.spawnTimer,
      timeMinutes: this.timeMinutes,
      maxConcurrent: this.maxConcurrent,
    };
  }

  /** Deserialize from save. */
  static deserialize(data, rng, scene, materials) {
    const mgr = new EnemyManager(rng, scene, materials, data.maxConcurrent);
    mgr.spawnTimer = data.spawnTimer;
    mgr.timeMinutes = data.timeMinutes;
    // Enemies will be recreated with meshes in main.js
    return mgr;
  }
}