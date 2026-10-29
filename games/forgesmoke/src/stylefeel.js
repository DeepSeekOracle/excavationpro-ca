/**
 * FORGE SMOKE — PER-STYLE FEEL (FX-03)
 *
 * Two things vary by weapon style and by nothing else:
 *   1. the camera kick when the trigger breaks (a shotgun jolts the frame; an SMG barely moves it),
 *   2. how the tracer tapers over its life (a rail round is a needle that thins to nothing; a spray
 *      round is a short fat streak that fades quickly).
 *
 * Kicks are in SCREEN PIXELS at 1080p, and the renderer converts them to world units at the current
 * camera distance. That is deliberate: the acceptance criterion is "shake <= 2 px", so the numbers
 * here are the thing that gets checked, not a world-unit guess that changes with FOV.
 *
 * Pure data + pure functions so the numbers can be asserted without a renderer.
 */

export const STYLE_FEEL = {
  spray:  { kickX: 0.50, kickY: 0.35, roll: 0.0006, recover: 12, taper: 0.55, taperPow: 1.5 },
  pierce: { kickX: 1.10, kickY: 0.60, roll: 0.0005, recover: 7,  taper: 0.30, taperPow: 2.4 },
  cone:   { kickX: 1.60, kickY: 0.90, roll: 0.0012, recover: 6,  taper: 0.45, taperPow: 1.3 },
  flak:   { kickX: 1.20, kickY: 0.70, roll: 0.0010, recover: 7,  taper: 0.40, taperPow: 1.6 },
  breach: { kickX: 1.90, kickY: 1.10, roll: 0.0015, recover: 5,  taper: 0.50, taperPow: 1.2 },
  rail2:  { kickX: 2.00, kickY: 1.20, roll: 0.0006, recover: 4,  taper: 0.18, taperPow: 3.0 },
  burst:  { kickX: 0.70, kickY: 0.40, roll: 0.0007, recover: 9,  taper: 0.58, taperPow: 1.5 },
  spinup: { kickX: 0.35, kickY: 0.25, roll: 0.0004, recover: 14, taper: 0.62, taperPow: 1.4 },
  chain:  { kickX: 0.60, kickY: 0.35, roll: 0.0005, recover: 10, taper: 0.50, taperPow: 1.7 },
  ricochet: { kickX: 0.80, kickY: 0.45, roll: 0.0006, recover: 9, taper: 0.45, taperPow: 1.8 },
  default: { kickX: 0.60, kickY: 0.40, roll: 0.0006, recover: 10, taper: 0.50, taperPow: 1.5 },
};

/** Feel block for a style key; unknown styles fall back to the default block. */
export function feelFor(styleKey) {
  return STYLE_FEEL[String(styleKey)] || STYLE_FEEL.default;
}

/**
 * Tracer width multiplier at `progress` (0 = just fired, 1 = expired). The tracer starts at full
 * width and tapers to `feel.taper`; `taperPow` shapes the curve so heavy rounds thin late and hard.
 */
export function tracerTaper(styleKey, progress) {
  const feel = feelFor(styleKey);
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  return 1 - (1 - feel.taper) * Math.pow(p, feel.taperPow);
}

/**
 * One trigger pull's camera impulse for a style, in screen pixels (x, y) plus roll in radians.
 * `rng` is the run's RNG so the jitter is deterministic per seed. The caller scales px to world
 * units using the live camera distance and viewport height.
 */
export function kickImpulse(styleKey, rng = Math.random) {
  const feel = feelFor(styleKey);
  return {
    x: (rng() - 0.5) * feel.kickX * 2,
    y: feel.kickY * (0.75 + rng() * 0.5),
    roll: (rng() - 0.5) * feel.roll * 2,
    recover: feel.recover,
  };
}
