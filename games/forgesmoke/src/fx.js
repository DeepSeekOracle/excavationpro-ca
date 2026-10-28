/**
 * FX Module Contract & Particle/Shake/Flash Controller
 * Responsibilities: Particle systems, screen shake, flash, post-process effects
 * @module fx
 */

export const ParticlePresets = {
  explosion: { color: "#ffb347", size: [4, 12], speed: [50, 200], gravity: 200 },
  spark: { color: "#ffd57a", size: [1, 3], speed: [100, 300], gravity: 0 },
  dust: { color: "#3a3f47", size: [2, 6], speed: [20, 80], gravity: 50 },
  hit: { color: "#ffedb0", size: [3, 8], speed: [80, 150], gravity: 100 },
};

const MAX_PARTICLES = 160;

/**
 * Initialize FX system
 * @param {HTMLCanvasElement} [canvas] - Render target
 * @returns {FxController} Controller instance
 */
export function createFx(canvas = null) {
  let nextId = 1;
  const particles = [];
  let activeShake = { intensity: 0, duration: 0, elapsed: 0, offsetX: 0, offsetY: 0 };
  let activeFlash = { color: "#ffedb0", duration: 0, elapsed: 0, alpha: 0 };

  const controller = {
    canvas,
    particles,
    get shakeOffset() {
      return { x: activeShake.offsetX, y: activeShake.offsetY };
    },
    get flashState() {
      return { color: activeFlash.color, alpha: activeFlash.alpha };
    },
    emit(config = {}) {
      const preset = ParticlePresets[config.preset] || ParticlePresets.spark;
      const count = Math.min(32, Math.max(1, config.count ?? 10));
      const life = Math.max(50, config.life ?? 400);
      const color = config.color || preset.color;
      const id = nextId++;
      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        const angle = (i / count) * Math.PI * 2;
        const speed = preset.speed[0] + ((i % 5) / 5) * (preset.speed[1] - preset.speed[0]);
        particles.push({
          id,
          x: Number(config.x) || 0,
          y: Number(config.y) || 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: preset.gravity || 0,
          size: preset.size[0],
          color,
          life,
          maxLife: life,
        });
      }
      return id;
    },
    shake(config = {}) {
      activeShake = {
        intensity: Math.max(0, Number(config.intensity) || 4),
        duration: Math.max(0, Number(config.duration) || 180),
        elapsed: 0,
        offsetX: 0,
        offsetY: 0,
      };
    },
    flash(config = {}) {
      activeFlash = {
        color: config.color || "#ffedb0",
        duration: Math.max(1, Number(config.duration) || 160),
        elapsed: 0,
        alpha: 1,
      };
    },
    update(dtMs = 16.67) {
      const dt = Math.max(0, dtMs) / 1000;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dtMs;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
      }
      if (activeShake.duration > 0) {
        activeShake.elapsed += dtMs;
        if (activeShake.elapsed >= activeShake.duration) {
          activeShake.duration = 0;
          activeShake.offsetX = 0;
          activeShake.offsetY = 0;
        } else {
          const damp = 1 - activeShake.elapsed / activeShake.duration;
          activeShake.offsetX = Math.sin(activeShake.elapsed * 0.08) * activeShake.intensity * damp;
          activeShake.offsetY = Math.cos(activeShake.elapsed * 0.11) * activeShake.intensity * damp;
        }
      }
      if (activeFlash.duration > 0) {
        activeFlash.elapsed += dtMs;
        if (activeFlash.elapsed >= activeFlash.duration) {
          activeFlash.duration = 0;
          activeFlash.alpha = 0;
        } else {
          activeFlash.alpha = Math.max(0, 1 - activeFlash.elapsed / activeFlash.duration);
        }
      }
    },
    render(ctx2d) {
      if (!ctx2d || typeof ctx2d.fillRect !== "function") return;
      ctx2d.save();
      for (const p of particles) {
        ctx2d.fillStyle = p.color;
        ctx2d.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
        ctx2d.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
      }
      ctx2d.restore();
    },
    clear() {
      particles.length = 0;
      activeShake.duration = 0;
      activeShake.offsetX = 0;
      activeShake.offsetY = 0;
      activeFlash.duration = 0;
      activeFlash.alpha = 0;
    },
    destroy() {
      controller.clear();
    },
  };
  return controller;
}

export function emit(fx, config) {
  return fx && typeof fx.emit === "function" ? fx.emit(config) : 0;
}

export function shake(fx, config) {
  if (fx && typeof fx.shake === "function") fx.shake(config);
}

export function flash(fx, config) {
  if (fx && typeof fx.flash === "function") fx.flash(config);
}
