/* Original fight sounds. They sit beside the radio and do not duck it. */

let ctx = null;
let master = null;
let level = 0.8;

export function setVolume(value) {
  level = Math.max(0, Math.min(1, Number(value) || 0));
  if (master) master.gain.value = level;
}

function ac() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = level;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function env(peak, dur) {
  const a = ac();
  const g = a.createGain();
  const t = a.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(master);
  return g;
}

function noise(seconds, shape) {
  const a = ac();
  const frames = Math.max(1, Math.floor(a.sampleRate * seconds));
  const buf = a.createBuffer(1, frames, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    const n = Math.random() * 2 - 1;
    data[i] = n * (shape ? shape(i / frames) : 1);
  }
  const src = a.createBufferSource();
  src.buffer = buf;
  return src;
}

function tone(type, freq, peak, dur, slideTo) {
  const a = ac();
  const o = a.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), a.currentTime + dur);
  const g = env(peak, dur);
  o.connect(g);
  o.start();
  o.stop(a.currentTime + dur + 0.02);
}

export function launch(style) {
  try {
    const src = noise(style === "claw" ? 0.12 : 0.2, (t) => (1 - t) * (1 - t));
    const a = ac();
    const bp = a.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(style === "claw" ? 280 : 900, a.currentTime);
    bp.frequency.exponentialRampToValueAtTime(style === "fracture" ? 420 : 1800, a.currentTime + 0.18);
    bp.Q.value = 0.7;
    const g = env(style === "claw" ? 0.16 : 0.1, 0.2);
    src.connect(bp);
    bp.connect(g);
    src.start();
    if (style === "seal") tone("triangle", 640, 0.05, 0.12, 1180);
    if (style === "fracture") tone("sawtooth", 180, 0.04, 0.14, 90);
  } catch (_) { /* sound is optional */ }
}

export function impact(style, crit) {
  try {
    const body = style === "claw" ? 72 : style === "fracture" ? 128 : 246;
    const peak = crit ? 0.34 : 0.24;
    tone(style === "seal" ? "triangle" : "sine", body * (crit ? 1.12 : 1), peak, 0.28, body * 0.5);
    tone("square", style === "claw" ? 140 : 420, crit ? 0.05 : 0.03, 0.05, 80);
    const src = noise(0.16, (t) => 1 - t);
    const a = ac();
    const lp = a.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = style === "claw" ? 220 : style === "fracture" ? 700 : 1600;
    const g = env(crit ? 0.28 : 0.18, style === "claw" ? 0.22 : 0.14);
    src.connect(lp);
    lp.connect(g);
    src.start();
    if (style === "fracture") tone("sawtooth", body * 1.09, 0.05, 0.16, body);
    if (crit) tone("triangle", style === "seal" ? 880 : 220, 0.08, 0.2, 120);
  } catch (_) { /* sound is optional */ }
}

export function miss() {
  try {
    const src = noise(0.16, (t) => 1 - t);
    const a = ac();
    const hp = a.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1400;
    const g = env(0.06, 0.16);
    src.connect(hp);
    hp.connect(g);
    src.start();
  } catch (_) { /* sound is optional */ }
}

export function step() {
  try {
    const src = noise(0.07, (t) => 1 - t);
    const a = ac();
    const lp = a.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 180;
    const g = env(0.07, 0.08);
    src.connect(lp);
    lp.connect(g);
    src.start();
  } catch (_) { /* sound is optional */ }
}

export function ui() {
  try { tone("sine", 740, 0.035, 0.05, 480); } catch (_) { /* sound is optional */ }
}

export function page() {
  try {
    tone("triangle", 392, 0.03, 0.1, 588);
    const src = noise(0.08, (t) => 1 - t);
    const a = ac();
    const lp = a.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    const g = env(0.04, 0.09);
    src.connect(lp);
    lp.connect(g);
    src.start();
  } catch (_) { /* sound is optional */ }
}

export function talk() {
  try { tone("sine", 520, 0.025, 0.07, 660); } catch (_) { /* sound is optional */ }
}

export function coin() {
  try {
    tone("triangle", 880, 0.04, 0.06, 1320);
    setTimeout(() => tone("triangle", 1174, 0.03, 0.08, 1174), 70);
  } catch (_) { /* sound is optional */ }
}

export function settle() {
  try { tone("sine", 196, 0.04, 0.14, 140); } catch (_) { /* sound is optional */ }
}

export function sting(win) {
  try {
    if (win) {
      tone("triangle", 392, 0.08, 0.22, 392);
      setTimeout(() => tone("triangle", 523, 0.07, 0.28, 523), 150);
    } else {
      tone("sine", 164, 0.1, 0.32, 82);
      setTimeout(() => tone("sine", 110, 0.08, 0.4, 70), 160);
    }
  } catch (_) { /* sound is optional */ }
}
