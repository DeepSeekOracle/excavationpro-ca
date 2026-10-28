/**
 * Enemy system — types, spawning, behavior, damage.
 * Pure logic, no rendering. Rendering handled by main.js.
 */

import * as THREE from "three";
import { TUNING } from "./tuning.js";
import { enemyHpAt, enemySpeedAt, damageAfterArmour } from "./balance.js";
import {
  buildEnemyMesh,
  animateEnemyMesh,
  arenaColliders,
  resolveObstacleCollision,
  steerAroundObstacles,
} from "./models.js";

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

  updateRifleman(dt, dirX, dirZ, distance) {
    const meleeRange = this.config.meleeRange || 1.6;
    const carbineRange = 10.5;
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
      if (this.specialCooldown <= 0) {
        this.specialCooldown = 1.6 + (this.phase % 0.5);
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
    // Shield faces player
    this.shieldAngle = Math.atan2(dirX, dirZ);
    // Check if flanked (player behind shield)
    const toPlayer = Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z);
    // strict frontal arc: the wall covers the front 220 degrees, so only a genuine flank (or an
    // explosive / grenade) gets through. Walking around him takes real effort.
    const angleDiff = Math.abs(toPlayer - this.shieldAngle);
    this.flanked = angleDiff > Math.PI / 2 && angleDiff < 3 * Math.PI / 2;
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
      if (this.specialCooldown <= 0) {
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
      this.velocity.x = 0;
      this.velocity.z = 0;
      if (this.specialCooldown <= 0) {
        this.specialCooldown = this.config.minigunCycle || 0.1;
        return { type: "minigun", damage: this.config.minigunDamage, dirX, dirZ };
      }
    }
    return null;
  }

  updateGunship(dt, dirX, dirZ, distance) {
    // Gunship handled specially - strafing pattern
    return { type: "strafe" };
  }

  /** Take damage. Returns true if killed. */
  takeDamage(amount, isFlank = false, armour = 0, pierce = 0) {
    let dmg = amount;
    if (this.type === ENEMY_TYPES.shieldbearer && this.isShielded && !isFlank) {
      // The wall tracks the player, so there is no "front" to shoot around. Only an explosive
      // charge punches a fraction through it; a lobbed grenade (isFlank) goes over the top.
      dmg = pierce > 0 ? damageAfterArmour(amount * pierce, armour) : 0;
    } else {
      dmg = damageAfterArmour(amount, armour);
    }
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
    this.enemies = [];
    this.enemyMeshes = new Map(); // enemy -> mesh
    this.spawnTimer = 0;
    this.timeMinutes = 0;
    this.spawnInterval = TUNING.director.baseSpawnInterval;
    this.currentBeat = null;
  }

  /** Spawn an enemy of given type at random angle around player. */
  spawn(type, playerPos, timeMinutes = 0) {
    if (this.enemies.length >= this.maxConcurrent) return null;
    const angle = this.rng() * Math.PI * 2;
    const radius = 18 + this.rng() * 30;
    const position = {
      x: playerPos.x + Math.cos(angle) * radius,
      z: playerPos.z + Math.sin(angle) * radius,
      clone() { return { x: this.x, z: this.z }; },
    };
    resolveObstacleCollision(position, 0.85, arenaColliders);
    const enemy = new Enemy(type, position, this.rng, timeMinutes);
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
  update(dt, playerPos, timeMinutes) {
    this.timeMinutes = timeMinutes;
    this.spawnTimer -= dt;
    const actions = [];

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const action = enemy.update(dt, playerPos, timeMinutes);
      if (action) actions.push({ enemy, action });

      // Update position with obstacle pathfinding / steering + solid collider pushback
      const isAerial = enemy.type === "drone" || enemy.type === "gunship";
      if (!isAerial) {
        const vx = enemy.velocity.x;
        const vz = enemy.velocity.z;
        const spd = Math.hypot(vx, vz);
        const colRadius = enemy.type === "mech" ? 1.05 : enemy.type === "shieldbearer" ? 0.75 : 0.55;
        if (spd > 0.01) {
          const steered = steerAroundObstacles(enemy.position, vx / spd, vz / spd, colRadius, arenaColliders);
          enemy.position.x += steered.x * spd * dt;
          enemy.position.z += steered.z * spd * dt;
        }
        resolveObstacleCollision(enemy.position, colRadius, arenaColliders);

      // stuck-breaker: cover can wedge an enemy against a wall, which reads as a frozen AI. If it
      // has not actually moved for a second while it is still far from you, slide it sideways.
      const movedNow = Math.hypot(enemy.position.x - (enemy._lastX ?? enemy.position.x),
                                  enemy.position.z - (enemy._lastZ ?? enemy.position.z));
      enemy._lastX = enemy.position.x;
      enemy._lastZ = enemy.position.z;
      enemy._stuck = enemy._stuck || 0;
      const distNow = Math.hypot(playerPos.x - enemy.position.x, playerPos.z - enemy.position.z);
      if (movedNow < 0.02 && distNow > 6) enemy._stuck += dt;
      else enemy._stuck = 0;
      if (enemy._stuck > 1.0) {
        const side = Math.sin((enemy.phase || 0) * 3.1) > 0 ? 1 : -1;
        const tdx = playerPos.x - enemy.position.x;
        const tdz = playerPos.z - enemy.position.z;
        const tlen = Math.hypot(tdx, tdz) || 1;
        enemy.position.x += (-tdz / tlen) * side * 1.6 * dt * 6;
        enemy.position.z += (tdx / tlen) * side * 1.6 * dt * 6;
        enemy._stuck = 0;
      }
      } else {
        enemy.position.x += enemy.velocity.x * dt;
        enemy.position.z += enemy.velocity.z * dt;
      }
      const AIR_ALT = { gunship: 6.4, drone: 4.6 };
    const alt = AIR_ALT[enemy.type] ?? (isAerial ? 3.4 : 0.72);
    enemy.position.y = alt + Math.sin(Date.now() * 0.001 * 4.5 + enemy.phase) * (isAerial ? 0.35 : 0);

      // Update mesh if exists
      const mesh = this.enemyMeshes.get(enemy);
      if (mesh) {
        mesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
        mesh.rotation.y = Math.atan2(playerPos.x - enemy.position.x, playerPos.z - enemy.position.z);
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

  /** Find nearest enemy to position within angle. */
  findNearest(playerPos, playerYaw, maxDistance = 19, angle = Math.PI * 2 / 3) {
    let best = null;
    let bestDist = maxDistance;
    for (const enemy of this.enemies) {
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

  /** Set max concurrent (for difficulty scaling). */
  setMaxConcurrent(max) {
    this.maxConcurrent = max;
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