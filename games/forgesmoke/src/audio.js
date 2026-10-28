/**
 * Audio Module Contract & Procedural Web Audio Implementation
 * Responsibilities: Web Audio context, sound pooling, music crossfade, SFX playback
 * @module audio
 */

function createSynthSfx(ctx, masterGain, sfxGain, key, options = {}) {
  if (!ctx || ctx.state === "suspended") {
    try { ctx.resume(); } catch (_) {}
  }
  const now = ctx ? ctx.currentTime + (options.delay || 0) : 0;
  let playing = true;
  let osc = null;
  let gain = null;
  if (ctx) {
    try {
      osc = ctx.createOscillator();
      gain = ctx.createGain();
      const vol = Math.max(0, Math.min(1, options.volume ?? 1));
      const pitch = Math.max(0.25, Math.min(4, options.pitch ?? 1));
      const presets = {
        fire: { type: "sawtooth", freq: 220 * pitch, endFreq: 55, dur: 0.09 },
        reload: { type: "triangle", freq: 340 * pitch, endFreq: 520, dur: 0.14 },
        hit: { type: "square", freq: 180 * pitch, endFreq: 90, dur: 0.06 },
        pickup: { type: "sine", freq: 440 * pitch, endFreq: 880, dur: 0.18 },
        hurt: { type: "sawtooth", freq: 130 * pitch, endFreq: 45, dur: 0.22 },
      };
      const p = presets[key] || presets.hit;
      osc.type = p.type;
      osc.frequency.setValueAtTime(p.freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, p.endFreq), now + p.dur);
      gain.gain.setValueAtTime(0.18 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + p.dur);
      osc.connect(gain);
      gain.connect(sfxGain || masterGain || ctx.destination);
      osc.start(now);
      osc.stop(now + p.dur);
      osc.onended = () => { playing = false; };
    } catch (_) {
      playing = false;
    }
  } else {
    playing = false;
  }
  return {
    get playing() { return playing; },
    stop() {
      playing = false;
      try { if (osc) osc.stop(); } catch (_) {}
    },
    setVolume(v) {
      try { if (gain) gain.gain.value = Math.max(0, Math.min(1, v)); } catch (_) {}
    },
    setPitch(p) {
      try { if (osc) osc.frequency.value = 220 * Math.max(0.25, Math.min(4, p)); } catch (_) {}
    },
  };
}

/**
 * Initialize audio system (safe before or after user gesture)
 * @returns {Promise<AudioController>} Ready controller
 */
/**
 * Real samples, all already in this repo (lattice-arena SFX + the talk-radio laser bank), copied
 * into ./assets/sfx at build time. The synth below stays as the fallback for anything missing or
 * still loading, so a slow network never means silence.
 */
export const SAMPLE_MAP = {
  fire: "./assets/sfx/fire.wav",
  laser: "./assets/sfx/laser.mp3",
  hit: "./assets/sfx/hit.wav",
  kill: "./assets/sfx/kill.wav",
  reload: "./assets/sfx/reload.wav",
  click: "./assets/sfx/click.wav",
  hurt: "./assets/sfx/hurt.wav",
  launch: "./assets/sfx/launch.wav",
  levelup: "./assets/sfx/levelup.wav",
  death: "./assets/sfx/death.wav",
};

export async function initAudio() {
  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
  let ctx = null;
  let masterGain = null;
  let sfxGain = null;
  let musicGain = null;
  let musicOsc = null;
  let masterVol = 0.8;
  let sfxVol = 1.0;
  let musicVol = 0.6;
  const buffers = new Map();
  let loadPromise = null;

  function ensureContext() {
    if (!ctx && AudioCtx) {
      try {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        sfxGain = ctx.createGain();
        musicGain = ctx.createGain();
        masterGain.gain.value = masterVol;
        sfxGain.gain.value = sfxVol;
        musicGain.gain.value = musicVol * 0.12;
        sfxGain.connect(masterGain);
        musicGain.connect(masterGain);
        masterGain.connect(ctx.destination);
      } catch (_) {
        ctx = null;
      }
    }
    return ctx;
  }

  async function loadSamples() {
    const c = ensureContext();
    if (!c) return buffers.size;
    const jobs = Object.entries(SAMPLE_MAP).map(async ([key, url]) => {
      try {
        const res = await fetch(url, { cache: "force-cache" });
        if (!res.ok) return;
        const data = await res.arrayBuffer();
        const buf = await c.decodeAudioData(data);
        buffers.set(key, buf);
      } catch (_) { /* fall back to the synth for this key */ }
    });
    await Promise.all(jobs);
    return buffers.size;
  }

  function playSample(key, options = {}) {
    const c = ensureContext();
    const buf = buffers.get(key);
    if (!c || !buf) return false;
    try {
      const src = c.createBufferSource();
      src.buffer = buf;
      const g = c.createGain();
      const vol = Math.max(0, Math.min(1, options.volume ?? 1)) * 0.85;
      const pitch = Math.max(0.4, Math.min(2.4, options.pitch ?? 1));
      src.playbackRate.value = pitch;
      const t0 = c.currentTime + (options.delay || 0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.min(1.4, buf.duration / pitch));
      src.connect(g); g.connect(sfxGain);
      src.start(t0);
      src.stop(t0 + Math.min(1.5, buf.duration / pitch) + 0.02);
      return true;
    } catch (_) { return false; }
  }

  const controller = {
    playSfx(key, options = {}) {
      const c = ensureContext();
      if (playSample(key, options)) return true;      // real sample first
      return createSynthSfx(c, masterGain, sfxGain, key, options);
    },
    playMusic(key, options = {}) {
      const c = ensureContext();
      if (!c) return;
      controller.stopMusic();
      try {
        musicOsc = c.createOscillator();
        musicOsc.type = key === "blackout" ? "sawtooth" : "sine";
        musicOsc.frequency.value = key === "blackout" ? 48 : 64;
        musicOsc.connect(musicGain);
        musicOsc.start();
      } catch (_) {
        musicOsc = null;
      }
    },
    stopMusic() {
      if (musicOsc) {
        try { musicOsc.stop(); musicOsc.disconnect(); } catch (_) {}
        musicOsc = null;
      }
    },
    setMasterVolume(v) {
      masterVol = Math.max(0, Math.min(1, Number(v) || 0));
      if (masterGain) masterGain.gain.value = masterVol;
    },
    setSfxVolume(v) {
      sfxVol = Math.max(0, Math.min(1, Number(v) || 0));
      if (sfxGain) sfxGain.gain.value = sfxVol;
    },
    setMusicVolume(v) {
      musicVol = Math.max(0, Math.min(1, Number(v) || 0));
      if (musicGain) musicGain.gain.value = musicVol * 0.12;
    },
    async preload() {
      if (!loadPromise) loadPromise = loadSamples();
      await loadPromise;
      return buffers.size;
    },
    sampleCount() { return buffers.size; },
    sampleKeys() { return [...buffers.keys()]; },
    suspend() {
      if (ctx && ctx.state === "running") {
        try { return ctx.suspend(); } catch (_) {}
      }
    },
    resume() {
      const c = ensureContext();
      if (c && c.state === "suspended") {
        try { return c.resume(); } catch (_) {}
      }
    },
    destroy() {
      controller.stopMusic();
      if (ctx) {
        try { ctx.close(); } catch (_) {}
        ctx = null;
      }
    },
  };
  return controller;
}

export function playSfx(audio, key, options = {}) {
  if (audio && typeof audio.playSfx === "function") {
    return audio.playSfx(key, options);
  }
  return { playing: false, stop() {}, setVolume() {}, setPitch() {} };
}

export function playMusic(audio, key, options = {}) {
  if (audio && typeof audio.playMusic === "function") {
    return audio.playMusic(key, options);
  }
}
