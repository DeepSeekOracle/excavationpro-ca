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
  tracer: { color: "#0000ff", size: [0.5, 1], speed: [10, 50], gravity: 0 },
  blackout: { color: "#000000", size: [1, 1], speed: [0, 0], gravity: 0 },
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
  let activeBlackout = { color: "#000000", duration: 0, elapsed: 0, alpha: 0 };
  let activeWeather = { type: null, intensity: 0, duration: 0, elapsed: 0 };

  const controller = {
    canvas,
    particles,
    get shakeOffset() {
      return { x: activeShake.offsetX, y: activeShake.offsetY };
    },
    get flashState() {
      return {
        color: activeFlash.color,
        duration: activeFlash.duration,
        alpha: activeFlash.alpha,
        elapsed: activeFlash.elapsed
      };
    },
    get blackoutState() {
      return {
        color: activeBlackout.color,
        duration: activeBlackout.duration,
        alpha: activeBlackout.alpha,
        elapsed: activeBlackout.elapsed
      };
    },
    get weatherState() {
      return {
        type: activeWeather.type,
        intensity: activeWeather.intensity,
        duration: activeWeather.duration,
        elapsed: activeWeather.elapsed
      };
    },
    // --- Particle System ---
    addParticle(particle) {
      if (this.particles.length >= MAX_PARTICLES) {
        // Cap at MAX_PARTICLES; remove oldest if full
        this.particles.shift();
      }
      this.particles.push(particle);
    },
    clearParticles() {
      this.particles.length = 0;
    },
    // --- Screen Shake ---
    shake(config) {
      if (config.intensity === undefined || config.duration === undefined) {
        return;
      }
      const intensity = config.intensity ?? 0.5;
      const duration = config.duration ?? 100;
      const offsetX = config.offsetX ?? 0;
      const offsetY = config.offsetY ?? 0;
      
      activeShake.intensity = intensity;
      activeShake.duration = duration;
      activeShake.offsetX = offsetX;
      activeShake.offsetY = offsetY;
      activeShake.elapsed = 0;
      
      // Apply shake to canvas if available
      if (this.canvas) {
        this.canvas.style.transform = `translate(${activeShake.offsetX}px, ${activeShake.offsetY}px)`;
      }
    },
    // --- Flash Effects ---
    flash(fx, config) {
      if (fx && typeof fx.flash === "function") {
        fx.flash({
          color: config.color ?? "#ffedb0",
          duration: config.duration ?? 100,
        });
      }
    },
    // --- Blackout Effects ---
    blackout(fx, config) {
      if (fx && typeof fx.blackout === "function") {
        fx.blackout({
          color: config.color ?? "#000000",
          duration: config.duration ?? 100,
        });
      }
    },
    // --- Weather Effects ---
    weather(fx, config) {
      if (fx && typeof fx.weather === "function") {
        fx.weather({
          type: config.type ?? 'none',
          intensity: config.intensity ?? 0,
          duration: config.duration ?? 100,
        });
      }
    },
    // --- Internal Update ---
    update(dt) {
      // Update shake
      if (activeShake.duration > 0) {
        activeShake.elapsed += dt;
        if (activeShake.elapsed >= activeShake.duration) {
          activeShake.elapsed = 0;
          activeShake.intensity = 0;
          activeShake.offsetX = 0;
          activeShake.offsetY = 0;
        } else {
          const ratio = activeShake.elapsed / activeShake.duration;
          const intensity = activeShake.intensity * (1 - ratio);
          activeShake.offsetX = Math.sin(Math.PI * 2 * ratio) * intensity * 10;
          activeShake.offsetY = Math.cos(Math.PI * 2 * ratio) * intensity * 10;
        }
      }
      
      // Update flash
      if (activeFlash.duration > 0) {
        activeFlash.elapsed += dt;
        if (activeFlash.elapsed >= activeFlash.duration) {
          activeFlash.elapsed = 0;
          activeFlash.alpha = 0;
        } else {
          activeFlash.alpha = activeFlash.elapsed / activeFlash.duration;
        }
      }
      
      // Update blackout
      if (activeBlackout.duration > 0) {
        activeBlackout.elapsed += dt;
        if (activeBlackout.elapsed >= activeBlackout.duration) {
          activeBlackout.elapsed = 0;
          activeBlackout.alpha = 0;
        } else {
          activeBlackout.alpha = activeBlackout.elapsed / activeBlackout.duration;
        }
      }
      
      // Update weather
      if (activeWeather.duration > 0) {
        activeWeather.elapsed += dt;
        if (activeWeather.elapsed >= activeWeather.duration) {
          activeWeather.elapsed = 0;
          activeWeather.intensity = 0;
        } else {
          activeWeather.intensity = activeWeather.intensity * (1 - (activeWeather.elapsed / activeWeather.duration));
        }
      }
    }
  };

  return controller;
}

// --- Effect Functions ---
export function createMuzzleFlash(fx, config) {
  if (!fx || !fx.flash) return;
  const color = config.color ?? "#ff0000";
  const intensity = config.intensity ?? 1;
  const duration = config.duration ?? 100;
  
  fx.flash({
    color,
    duration,
  });
}

export function createImpactSparks(fx, config) {
  if (!fx || !fx.particles) return;
  const count = config.count ?? 10;
  const color = config.color ?? "#ffd57a";
  
  for (let i = 0; i < count; i++) {
    const particle = {
      id: `spark-${Date.now()}-${i}`,
      x: config.x ?? 0,
      y: config.y ?? 0,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      life: 100,
      color,
      size: 1,
      gravity: 0
    };
    fx.particles.add(particle);
  }
}

export function createTracer(fx, config) {
  if (!fx || !fx.tracer) return;
  const color = config.color ?? "#0000ff";
  const length = config.length ?? 10;
  const width = config.width ?? 0.5;
  
  fx.tracer({
    color,
    length,
    width,
  });
}

export function createBlackoutRedOptics(fx, config) {
  if (!fx || !fx.blackout) return;
  const duration = config.duration ?? 100;
  const color = config.color ?? "#ff0000";
  
  fx.blackout({
    color,
    duration,
  });
}

export function createScreenShake(fx, config) {
  if (!fx || !fx.shake) return;
  const intensity = config.intensity ?? 0.5;
  const duration = config.duration ?? 100;
  
  fx.shake({
    intensity,
    duration,
    offsetX: config.offsetX ?? 0,
    offsetY: config.offsetY ?? 0,
  });
}

export function createWeather(fx, config) {
  if (!fx || !fx.weather) return;
  const type = config.type ?? 'none';
  const intensity = config.intensity ?? 0;
  const duration = config.duration ?? 100;
  
  fx.weather({
    type,
    intensity,
    duration,
  });
}