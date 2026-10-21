/* Lattice Crypt studio kernel — pools, 60Hz, juice, 3-layer bed, feel. */
(function (root) {
  "use strict";
  const SAVE_AUDIO = "lygo_lattice_crypt_audio";
  const STEP = 1 / 60;
  const bus = Object.create(null);
  let restarts = 0;
  let reduced = false;
  let muted = false;
  let musicOn = true;
  let sfxVol = 1;
  let musicVol = 0.42;
  try {
    const a = JSON.parse(localStorage.getItem(SAVE_AUDIO) || "{}");
    muted = !!a.muted;
    reduced = !!a.reduced;
    if (a.music === false) musicOn = false;
    if (typeof a.sfxVol === "number") sfxVol = Math.max(0, Math.min(1, a.sfxVol));
    if (typeof a.musicVol === "number") musicVol = Math.max(0, Math.min(1, a.musicVol));
  } catch (_) {}

  function on(ev, fn) {
    (bus[ev] || (bus[ev] = [])).push(fn);
    return function off() {
      bus[ev] = (bus[ev] || []).filter(function (f) { return f !== fn; });
    };
  }
  function emit(ev, payload) {
    const list = bus[ev];
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      try { list[i](payload); } catch (_) {}
    }
  }
  function clearBus() {
    Object.keys(bus).forEach(function (k) { bus[k] = []; });
  }

  function makePool(reset, n) {
    const free = [];
    let live = 0, born = 0;
    function alloc() {
      live++;
      if (free.length) {
        const o = free.pop();
        reset(o);
        o.isActive = true;
        return o;
      }
      born++;
      const o = {};
      reset(o);
      o.isActive = true;
      return o;
    }
    function freeOne(o) {
      if (!o || !o.isActive) return;
      o.isActive = false;
      live = Math.max(0, live - 1);
      if (free.length < n) free.push(o);
    }
    function drain() {
      live = 0;
    }
    return {
      alloc: alloc, free: freeOne, drain: drain,
      live: function () { return live; },
      born: function () { return born; },
      freeN: function () { return free.length; }
    };
  }

  function resetShot(s) {
    s.x = s.y = s.px = s.py = s.vx = s.vy = 0;
    s.dmg = 0; s.life = 0; s.maxLife = 0; s.grace = 0;
    s.owner = null; s.hero = ""; s.wep = "shard"; s.foe = false;
    s.bounced = false; s.pierce = 0; s.lob = false; s.flame = 0; s.echo = false;
    s.air = false; s.seek = false; s.chain = false; s.nova = false;
    s._chained = false;
    s.trail = [];
  }
  function resetPart(p) {
    p.x = p.y = p.vx = p.vy = 0;
    p.life = 0; p.max = 0.3; p.r = 2; p.col = "#fbbf24";
  }
  function resetFloat(p) {
    p.x = p.y = 0; p.life = 0; p.max = 0.7; p.text = ""; p.col = "#fff";
  }
  function resetFoe(f) {
    f.kind = "brute"; f.rank = 1; f.x = 0; f.y = 0;
    f.hp = 1; f.max = 1; f.boss = false;
    f.explode = false; f.split = false; f.heal = false; f.spr = "brute";
    f.vx = 0; f.vy = 0; f.t = 0; f.hurt = 0; f.flicker = 0; f.stun = 0;
    f.phase = 1; f._splitDone = false; f._sip = 0;
  }

  const pool = {
    shot: makePool(resetShot, 640),
    particle: makePool(resetPart, 420),
    floater: makePool(resetFloat, 96),
    foe: makePool(resetFoe, 1100)
  };
  const particles = [];
  const floaters = [];
  const juice = { hitstop: 0, sx: 0, sy: 0, sMag: 0, flash: 0 };

  function shake(mag) {
    if (reduced) return;
    juice.sMag = Math.min(12, Math.max(juice.sMag, mag || 3));
  }
  function hitstop(ms) {
    if (reduced) return;
    juice.hitstop = Math.max(juice.hitstop, (ms || 40) / 1000);
  }
  function burst(x, y, col, n) {
    if (reduced) n = Math.min(n || 8, 3);
    const cap = fps.lod ? 70 : 280;
    const count = Math.min(n || 8, cap - particles.length);
    for (let i = 0; i < count; i++) {
      const p = pool.particle.alloc();
      const a = Math.random() * 6.28;
      const sp = 1.2 + Math.random() * 3.4;
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
      p.life = 0.16 + Math.random() * 0.24; p.max = p.life;
      p.r = 1.4 + Math.random() * 2.2;
      p.col = col || "#fde68a";
      particles.push(p);
    }
  }
  function floater(x, y, text, col) {
    if (fps.lod && floaters.length > 36) return;
    const p = pool.floater.alloc();
    p.x = x; p.y = y; p.text = String(text);
    p.col = col || "#fff"; p.life = 0.7; p.max = 0.7;
    floaters.push(p);
  }
  function juiceTick(dt) {
    if (juice.hitstop > 0) juice.hitstop = Math.max(0, juice.hitstop - dt);
    if (juice.sMag > 0.05) {
      juice.sMag *= Math.pow(0.002, dt);
      juice.sx = (Math.random() - 0.5) * 2 * juice.sMag;
      juice.sy = (Math.random() - 0.5) * 2 * juice.sMag;
    } else { juice.sMag = 0; juice.sx = 0; juice.sy = 0; }
    juice.flash = Math.max(0, juice.flash - dt * 4);
    const pCap = fps.value < 48 ? 70 : (fps.value < 55 ? 140 : 280);
    if (particles.length > pCap) {
      while (particles.length > pCap) pool.particle.free(particles.pop());
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt; p.x += p.vx * dt * 18; p.y += p.vy * dt * 18;
      p.vy += dt * 8;
      if (p.life <= 0) { pool.particle.free(p); particles.splice(i, 1); }
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const p = floaters[i];
      p.life -= dt; p.y -= dt * 1.4;
      if (p.life <= 0) { pool.floater.free(p); floaters.splice(i, 1); }
    }
  }
  function juiceDraw(ctx, cam, TILE, w, h) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const px = Math.round(p.x * TILE - cam.x), py = Math.round(p.y * TILE - cam.y);
      if (px < -8 || py < -8 || px > w + 8 || py > h + 8) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.col;
      ctx.fillRect(px, py, p.r, p.r);
    }
    ctx.font = "700 11px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    for (let i = 0; i < floaters.length; i++) {
      const p = floaters[i];
      const px = Math.round(p.x * TILE - cam.x), py = Math.round(p.y * TILE - cam.y);
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.col;
      ctx.fillText(p.text, px, py);
    }
    ctx.globalAlpha = 1;
    if (juice.flash > 0) {
      ctx.fillStyle = "rgba(255,80,80," + (juice.flash * 0.22) + ")";
      ctx.fillRect(0, 0, w, h);
    }
  }

  let actx = null;
  function resumeAudio() {
    try {
      if (!actx) actx = new (root.AudioContext || root.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
    } catch (_) {}
  }
  function sfx(kind, pitch) {
    if (muted) return;
    resumeAudio();
    if (!actx) return;
    try {
      const o = actx.createOscillator(), g = actx.createGain(), f = actx.createBiquadFilter();
      o.connect(f); f.connect(g);
      const pan = arguments[2];
      if (typeof pan === "number" && actx.createStereoPanner) {
        const pn = actx.createStereoPanner();
        pn.pan.value = Math.max(-1, Math.min(1, pan));
        g.connect(pn); pn.connect(actx.destination);
      } else g.connect(actx.destination);
      const now = actx.currentTime;
      const table = {
        shot: { f: 620, t: 0.045, type: "square", q: 800 },
        hit: { f: 190, t: 0.06, type: "triangle", q: 400 },
        kill: { f: 140, t: 0.11, type: "sawtooth", q: 220 },
        boss: { f: 80, t: 0.22, type: "sawtooth", q: 120 },
        pick: { f: 880, t: 0.07, type: "sine", q: 1200 },
        hurt: { f: 90, t: 0.14, type: "square", q: 180 },
        vial: { f: 240, t: 0.16, type: "triangle", q: 500 },
        pad: { f: 320, t: 0.08, type: "sine", q: 700 },
        wave: { f: 420, t: 0.2, type: "triangle", q: 600 },
        upgrade: { f: 520, t: 0.14, type: "sine", q: 900 },
        credit: { f: 360, t: 0.12, type: "triangle", q: 700 },
        pause: { f: 180, t: 0.08, type: "sine", q: 400 },
        exit: { f: 300, t: 0.18, type: "triangle", q: 500 },
        heal: { f: 520, t: 0.12, type: "sine", q: 900 },
        dash: { f: 740, t: 0.08, type: "square", q: 1100 },
        heart: { f: 70, t: 0.09, type: "sine", q: 160 }
      };
      const m = table[kind] || table.hit;
      const varp = 1 + ((Math.random() - 0.5) * 0.1);
      o.type = m.type;
      o.frequency.setValueAtTime((m.f * varp) * (pitch || 1), now);
      f.type = "lowpass";
      f.frequency.value = m.q;
      const amp = 0.045 * (muted ? 0 : sfxVol);
      g.gain.setValueAtTime(Math.max(0.0001, amp), now);
      g.gain.exponentialRampToValueAtTime(0.001, now + m.t);
      o.start(now); o.stop(now + m.t + 0.02);
    } catch (_) {}
  }

  function feel(kind, x, y, col) {
    const T = {
      shot: { sfx: "shot" },
      hit: { sfx: "hit", burst: 3, shake: 1.4, col: "#e2e8f0" },
      kill: { sfx: "kill", burst: 8, shake: 2.6, stop: 32, col: "#fb923c" },
      hurt: { sfx: "hurt", shake: 4, stop: 45, flash: 1 },
      pick: { sfx: "pick", burst: 6, col: "#fde68a" },
      vial: { sfx: "vial", burst: 14, shake: 5, stop: 70, col: "#c4b5fd" },
      pad: { sfx: "pad", burst: 5, col: "#67e8f9" },
      wave: { sfx: "wave", shake: 3 },
      boss: { sfx: "boss", burst: 16, shake: 9, stop: 120, col: "#fbbf24" },
      upgrade: { sfx: "upgrade", burst: 10, shake: 2, col: "#fbbf24" },
      credit: { sfx: "credit", burst: 8, col: "#5eead4" },
      pause: { sfx: "pause" },
      exit: { sfx: "exit", burst: 10, shake: 3, col: "#22d3ee" },
      heal: { sfx: "heal", burst: 6, col: "#4ade80" },
      dash: { sfx: "dash", burst: 4, col: "#86efac" }
    };
    const m = T[kind] || T.hit;
    if (m.sfx) sfx(m.sfx, 1, arguments[4]);
    if (m.burst && x != null) burst(x, y, col || m.col, m.burst);
    if (m.shake) shake(m.shake);
    if (m.stop) hitstop(m.stop);
    if (m.flash) juice.flash = 1;
    emit("feel", { kind: kind, x: x, y: y });
  }

  const fps = { frames: 0, acc: 0, value: 60, ms: 16, show: false, draws: 0, lod: false, mem: 0, lowAcc: 0 };
  function fpsTick(dt) {
    fps.frames++;
    fps.acc += dt;
    fps.ms = dt * 1000;
    if (fps.acc >= 0.5) {
      fps.value = Math.round(fps.frames / fps.acc);
      fps.lod = fps.value < 50;
      if (fps.value < 55) fps.lowAcc += fps.acc; else fps.lowAcc = 0;
      if (fps.lowAcc >= 2) fps.lod = true;
      fps.frames = 0; fps.acc = 0;
      try {
        if (root.performance && performance.memory) {
          fps.mem = performance.memory.usedJSHeapSize;
          if (fps.mem > 150 * 1048576 && !fps._memWarn) {
            fps._memWarn = true;
            try { console.warn("Lattice Crypt heap > 150MB"); } catch (_) {}
          }
        }
      } catch (_) {}
    }
  }
  function fpsDraw(ctx, w) {
    if (!fps.show) return;
    ctx.fillStyle = "rgba(7,8,14,0.72)";
    ctx.fillRect(w - 168, 8, 158, 66);
    ctx.fillStyle = fps.value < 50 ? "#f87171" : "#86efac";
    ctx.font = "700 11px IBM Plex Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("FPS " + fps.value + "  " + fps.ms.toFixed(1) + "ms", w - 160, 24);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("E " + counts().entities + "  P " + particles.length, w - 160, 40);
    ctx.fillText("R " + restarts + "  shots " + (pool.shot.live()), w - 160, 54);
    ctx.fillText("D " + (fps.draws || 0) + "  " + ((fps.mem / 1048576) | 0) + "MB", w - 160, 68);
  }

  function counts() {
    return {
      restarts: restarts,
      shotsLive: pool.shot.live(),
      shotsBorn: pool.shot.born(),
      shotFree: pool.shot.freeN(),
      particles: particles.length,
      floaters: floaters.length,
      foesLive: pool.foe.live(),
      foesBorn: pool.foe.born(),
      entities: pool.shot.live() + pool.foe.live() + particles.length + floaters.length
    };
  }

  function cleanup() {
    restarts++;
    juice.hitstop = 0; juice.sMag = 0; juice.sx = 0; juice.sy = 0; juice.flash = 0;
    while (particles.length) pool.particle.free(particles.pop());
    while (floaters.length) pool.floater.free(floaters.pop());
    pool.shot.drain();
    pool.foe.drain();
    emit("cleanup", { restarts: restarts });
  }

  let musicGain = null, musicOsc = null, musicLfo = null;
  let pulseOsc = null, pulseGain = null, tenseOsc = null, tenseGain = null;
  let drumOsc = null, drumGain = null, drumLfo = null;
  function stopBed() {
    if (!actx) return;
    try {
      const t = actx.currentTime;
      if (musicGain) musicGain.gain.setTargetAtTime(0.0001, t, 0.08);
      if (pulseGain) pulseGain.gain.setTargetAtTime(0.0001, t, 0.08);
      if (tenseGain) tenseGain.gain.setTargetAtTime(0.0001, t, 0.08);
      if (drumGain) drumGain.gain.setTargetAtTime(0.0001, t, 0.08);
    } catch (_) {}
  }
  function duckMusic() {
    if (!actx) return;
    const silent = muted || !musicOn || reduced;
    try {
      if (silent) stopBed();
    } catch (_) {}
  }
  function setMusic(on) {
    musicOn = !!on;
    duckMusic();
    saveAudio();
  }
  function ensureBed() {
    if (musicOsc || !actx) return;
    musicOsc = actx.createOscillator();
    musicLfo = actx.createOscillator();
    musicGain = actx.createGain();
    const f = actx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = 420;
    musicOsc.type = "triangle"; musicOsc.frequency.value = 98;
    musicLfo.type = "sine"; musicLfo.frequency.value = 0.28;
    const lfoG = actx.createGain(); lfoG.gain.value = 7;
    musicLfo.connect(lfoG); lfoG.connect(musicOsc.frequency);
    musicOsc.connect(f); f.connect(musicGain); musicGain.connect(actx.destination);
    musicGain.gain.value = 0.0001;
    f.frequency.value = 260;

    pulseOsc = actx.createOscillator();
    pulseGain = actx.createGain();
    const pf = actx.createBiquadFilter();
    pf.type = "lowpass"; pf.frequency.value = 240;
    pulseOsc.type = "sine"; pulseOsc.frequency.value = 128;
    pulseGain.gain.value = 0.0001;
    pulseOsc.connect(pf); pf.connect(pulseGain); pulseGain.connect(actx.destination);

    tenseOsc = actx.createOscillator();
    tenseGain = actx.createGain();
    tenseOsc.type = "sawtooth"; tenseOsc.frequency.value = 73;
    tenseGain.gain.value = 0.0001;
    const tf = actx.createBiquadFilter();
    tf.type = "lowpass"; tf.frequency.value = 280;
    tenseOsc.connect(tf); tf.connect(tenseGain); tenseGain.connect(actx.destination);

    drumOsc = actx.createOscillator();
    drumGain = actx.createGain();
    drumLfo = actx.createOscillator();
    drumOsc.type = "square"; drumOsc.frequency.value = 72;
    drumGain.gain.value = 0.0001;
    drumLfo.type = "square"; drumLfo.frequency.value = 2.1;
    const dmod = actx.createGain(); dmod.gain.value = 48;
    drumLfo.connect(dmod); dmod.connect(drumOsc.frequency);
    const df = actx.createBiquadFilter();
    df.type = "lowpass"; df.frequency.value = 140;
    drumOsc.connect(df); df.connect(drumGain); drumGain.connect(actx.destination);

    musicOsc.start(); musicLfo.start(); pulseOsc.start(); tenseOsc.start();
    drumOsc.start(); drumLfo.start();
  }
  function radioPlaying() {
    try {
      const a = root.document && root.document.getElementById("radioEl");
      return !!(a && !a.paused && !a.muted && a.volume > 0);
    } catch (_) { return false; }
  }
  function musicTick(intensity, extra) {
    extra = extra || {};
    if (extra.menu || extra.off) { stopBed(); return; }
    if (muted || !musicOn || reduced) { duckMusic(); return; }
    const i = Math.max(0, Math.min(1, intensity || 0));
    if (i <= 0) { stopBed(); return; }
    resumeAudio();
    if (!actx) return;
    try {
      ensureBed();
      const danger = Math.max(0, Math.min(1, extra.danger || 0));
      const horde = Math.max(0, Math.min(1, extra.horde || 0));
      const now = actx.currentTime;
      const duck = extra.boss ? 0.45 : 1;
      const underRadio = radioPlaying() ? 0.28 : 1;
      const mv = musicVol * duck * underRadio;
      musicOsc.frequency.setTargetAtTime(78 + i * 36, now, 0.5);
      musicGain.gain.setTargetAtTime((0.0032 + i * 0.0045) * mv, now, 0.35);
      pulseOsc.frequency.setTargetAtTime(110 + i * 40, now, 0.45);
      pulseGain.gain.setTargetAtTime((0.0004 + i * 0.0022 + horde * 0.0015) * mv, now, 0.3);
      tenseOsc.frequency.setTargetAtTime(58 + danger * 50 + horde * 18, now, 0.4);
      tenseGain.gain.setTargetAtTime((danger * 0.005 + horde * 0.003) * mv, now, 0.32);
      if (drumGain && drumLfo) {
        drumLfo.frequency.setTargetAtTime(1.2 + i * 1.1, now, 0.5);
        drumGain.gain.setTargetAtTime((i > 0.28 ? (0.0008 + i * 0.002 + horde * 0.0015) : 0.0001) * mv, now, 0.35);
      }
      if (danger > 0.68 && !muted) {
        const beat = ((now * 2) | 0);
        if (beat !== musicTick._beat) {
          musicTick._beat = beat;
          sfx("heart");
        }
      }
    } catch (_) {}
  }
  function saveAudio() {
    try { localStorage.setItem(SAVE_AUDIO, JSON.stringify({ muted: muted, reduced: reduced, music: musicOn, sfxVol: sfxVol, musicVol: musicVol })); } catch (_) {}
  }
  function setMute(v) {
    muted = !!v;
    duckMusic();
    saveAudio();
  }
  function setReduced(v) {
    reduced = !!v;
    duckMusic();
    saveAudio();
  }
  function setSfxVol(v) {
    sfxVol = Math.max(0, Math.min(1, +v || 0));
    saveAudio();
  }
  function setMusicVol(v) {
    musicVol = Math.max(0, Math.min(1, +v || 0));
    duckMusic();
    saveAudio();
  }

  root.CryptStudio = {
    STEP: STEP,
    on: on, emit: emit, clearBus: clearBus,
    pool: pool, juice: juice,
    shake: shake, hitstop: hitstop, burst: burst, floater: floater, feel: feel,
    juiceTick: juiceTick, juiceDraw: juiceDraw,
    sfx: sfx, resumeAudio: resumeAudio, setMute: setMute, setReduced: setReduced,
    setMusic: setMusic, setSfxVol: setSfxVol, setMusicVol: setMusicVol,
    musicTick: musicTick, stopBed: stopBed,
    get muted() { return muted; },
    get reduced() { return reduced; },
    get music() { return musicOn; },
    get sfxVol() { return sfxVol; },
    get musicVol() { return musicVol; },
    fps: fps, fpsTick: fpsTick, fpsDraw: fpsDraw,
    cleanup: cleanup, counts: counts,
    get restarts() { return restarts; }
  };

  root.addEventListener("pointerdown", resumeAudio, { once: true });
  root.addEventListener("keydown", resumeAudio, { once: true });
})(typeof window !== "undefined" ? window : globalThis);
