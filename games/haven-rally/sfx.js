/* Haven Rally — procedural engine, shifts, tire screech, city bed. No sampled engines. */
(function (global) {
  "use strict";
  var ctx = null, master, engGain, oscA, oscB, oscC, engFilt, exhaust;
  var tireGain, tireFilt, tireSrc;
  var ambGain, ambFilt, ambLfo, ambSrc;
  var noiseBuf = null, started = false, lastGear = 1, lastShiftAt = 0, lastGunAt = 0;
  var voGain = null, voBuf = {}, voDuckUntil = 0;
  var VO_IDS = [
    "first-blood", "double-kill", "multi-kill", "mega-kill", "ultra-kill",
    "monster-kill", "ludicrous-kill", "killing-spree", "rampage", "dominating",
    "unstoppable", "godlike", "wicked-sick", "beyond-godlike", "shut-down"
  ];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function makeNoise(seconds) {
    var n = Math.floor(ctx.sampleRate * seconds);
    var b = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = b.getChannelData(0), i, acc = 0;
    for (i = 0; i < n; i++) {
      acc = acc * 0.96 + (Math.random() * 2 - 1) * 0.04;
      d[i] = acc * 3 + (Math.random() * 2 - 1) * 0.25;
    }
    return b;
  }

  function loopSrc(buf, dest, rate) {
    var s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.playbackRate.value = rate || 1;
    s.connect(dest);
    s.start();
    return s;
  }

  function boot() {
    if (started) {
      if (ctx && ctx.state === "suspended") ctx.resume();
      return true;
    }
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.42;
    master.connect(ctx.destination);

    noiseBuf = makeNoise(1.6);

    engGain = ctx.createGain();
    engGain.gain.value = 0;
    engFilt = ctx.createBiquadFilter();
    engFilt.type = "lowpass";
    engFilt.frequency.value = 900;
    engFilt.Q.value = 1.1;
    engGain.connect(engFilt);
    engFilt.connect(master);

    oscA = ctx.createOscillator();
    oscA.type = "sawtooth";
    oscA.frequency.value = 40;
    oscB = ctx.createOscillator();
    oscB.type = "sawtooth";
    oscB.frequency.value = 80.4;
    oscC = ctx.createOscillator();
    oscC.type = "square";
    oscC.frequency.value = 20;
    var mixA = ctx.createGain(); mixA.gain.value = 0.22;
    var mixB = ctx.createGain(); mixB.gain.value = 0.12;
    var mixC = ctx.createGain(); mixC.gain.value = 0.06;
    oscA.connect(mixA); mixA.connect(engGain);
    oscB.connect(mixB); mixB.connect(engGain);
    oscC.connect(mixC); mixC.connect(engGain);
    oscA.start(); oscB.start(); oscC.start();

    exhaust = ctx.createGain();
    exhaust.gain.value = 0.04;
    var exFilt = ctx.createBiquadFilter();
    exFilt.type = "lowpass";
    exFilt.frequency.value = 280;
    loopSrc(noiseBuf, exFilt, 0.7);
    exFilt.connect(exhaust);
    exhaust.connect(master);

    tireFilt = ctx.createBiquadFilter();
    tireFilt.type = "bandpass";
    tireFilt.frequency.value = 1400;
    tireFilt.Q.value = 3.2;
    tireGain = ctx.createGain();
    tireGain.gain.value = 0;
    tireSrc = loopSrc(noiseBuf, tireFilt, 1.35);
    tireFilt.connect(tireGain);
    tireGain.connect(master);

    ambFilt = ctx.createBiquadFilter();
    ambFilt.type = "lowpass";
    ambFilt.frequency.value = 420;
    ambGain = ctx.createGain();
    ambGain.gain.value = 0.07;
    ambSrc = loopSrc(noiseBuf, ambFilt, 0.45);
    ambFilt.connect(ambGain);
    ambLfo = ctx.createOscillator();
    ambLfo.frequency.value = 0.07;
    var lfoG = ctx.createGain();
    lfoG.gain.value = 80;
    ambLfo.connect(lfoG);
    lfoG.connect(ambFilt.frequency);
    ambLfo.start();
    ambGain.connect(master);

    started = true;
    if (ctx.state === "suspended") ctx.resume();
    loadVo();
    return true;
  }

  function loadVo() {
    if (!ctx || voGain) return;
    voGain = ctx.createGain();
    voGain.gain.value = 1.05;
    voGain.connect(master);
    VO_IDS.forEach(function (id) {
      fetch("./assets/vo/" + id + ".ogg").then(function (r) { return r.arrayBuffer(); }).then(function (ab) {
        return ctx.decodeAudioData(ab);
      }).then(function (buf) { voBuf[id] = buf; }).catch(function () { /* missing line */ });
    });
  }

  function announce(id) {
    if (!id) return;
    boot();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    var t = ctx.currentTime;
    if (voBuf[id] && voGain) {
      var src = ctx.createBufferSource();
      src.buffer = voBuf[id];
      var g = ctx.createGain();
      g.gain.setValueAtTime(1.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.35, voBuf[id].duration + 0.05));
      src.connect(g);
      g.connect(voGain);
      src.start(t);
      voDuckUntil = t + 1.15;
      if (engGain) {
        engGain.gain.setTargetAtTime(0.012, t, 0.03);
      }
      return;
    }
    if (global.speechSynthesis) {
      var u = new SpeechSynthesisUtterance(String(id).replace(/-/g, " "));
      u.rate = 0.88;
      u.pitch = 0.55;
      u.volume = 1;
      try { global.speechSynthesis.cancel(); global.speechSynthesis.speak(u); } catch (e) { /* */ }
    }
  }

  function clunk() {
    if (!ctx) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.07);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.1);
    var n = ctx.createBufferSource();
    n.buffer = noiseBuf;
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.12, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    var nf = ctx.createBiquadFilter();
    nf.type = "highpass";
    nf.frequency.value = 800;
    n.connect(nf); nf.connect(ng); ng.connect(master);
    n.start(t); n.stop(t + 0.06);
  }

  function tick(s) {
    if (!started || !ctx) return;
    if (ctx.state === "suspended") return;
    s = s || {};
    var now = ctx.currentTime;
    var racing = !!s.racing;
    var rpm = clamp(s.rpm || 900, 700, 9000);
    var thr = clamp(s.thr || 0, 0, 1);
    var gear = s.gear == null ? 1 : s.gear;
    var slip = clamp(s.slip || 0, 0, 1);
    var radio = !!s.radio;
    var reduce = !!s.reduceFx;

    var fund = (rpm / 60) * (gear >= 4 ? 1.5 : 2);
    oscA.frequency.setTargetAtTime(fund, now, 0.04);
    oscB.frequency.setTargetAtTime(fund * 2.02, now, 0.04);
    oscC.frequency.setTargetAtTime(fund * 0.5, now, 0.05);
    engFilt.frequency.setTargetAtTime(380 + rpm * 0.42 + thr * 500, now, 0.05);
    var engVol = racing ? (0.035 + thr * 0.2 + clamp((rpm - 900) / 8000, 0, 1) * 0.08) : 0;
    if (gear === 0) engVol *= 0.45;
    if (now < voDuckUntil) engVol *= 0.28;
    engGain.gain.setTargetAtTime(engVol, now, 0.06);
    exhaust.gain.setTargetAtTime(racing ? (0.03 + thr * 0.07) : 0, now, 0.08);

    if (racing && gear !== lastGear && now - lastShiftAt > 0.08) {
      clunk();
      lastShiftAt = now;
      engGain.gain.setValueAtTime(engVol * 0.25, now);
      engGain.gain.linearRampToValueAtTime(engVol, now + 0.11);
    }
    lastGear = gear;

    var tire = racing ? Math.max(0, slip - 0.12) * (reduce ? 0.25 : 1) : 0;
    tireFilt.frequency.setTargetAtTime(900 + slip * 1600, now, 0.05);
    tireGain.gain.setTargetAtTime(tire * 0.22, now, 0.04);

    ambGain.gain.setTargetAtTime(radio ? 0.012 : (racing ? 0.05 : 0.08), now, 0.25);

    if (s.guns) gunFire(s.gunKind || "mg", s.gunPower || 1, reduce, now);
  }

  function gunFire(kind, power, reduce, now) {
    var p = clamp(power || 1, 0.5, 5);
    var vol = (reduce ? 0.035 : 0.12) * (0.72 + 0.1 * p);
    var gap = kind === "cannon" ? 0.1 : (kind === "needle" ? 0.022 : (kind === "rail" ? 0.078 : 0.052));
    if (now - lastGunAt < gap) return;
    lastGunAt = now;
    var burst = ctx.createBufferSource();
    burst.buffer = noiseBuf;
    var filt = ctx.createBiquadFilter();
    var gg = ctx.createGain();
    burst.connect(filt); filt.connect(gg); gg.connect(master);
    if (kind === "cannon") {
      filt.type = "lowpass";
      filt.frequency.value = 420 + Math.random() * 180;
      filt.Q.value = 0.9;
      gg.gain.setValueAtTime(vol * 1.35, now);
      gg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(160 + Math.random() * 50, now);
      o.frequency.exponentialRampToValueAtTime(46, now + 0.11);
      var og = ctx.createGain();
      og.gain.setValueAtTime(vol * 0.9, now);
      og.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      o.connect(og); og.connect(master);
      o.start(now); o.stop(now + 0.13);
      burst.start(now); burst.stop(now + 0.12);
    } else if (kind === "needle") {
      filt.type = "bandpass";
      filt.frequency.value = 3800 + Math.random() * 1400;
      filt.Q.value = 7.5;
      gg.gain.setValueAtTime(vol * 0.72, now);
      gg.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
      burst.start(now); burst.stop(now + 0.03);
    } else if (kind === "rail") {
      filt.type = "highpass";
      filt.frequency.value = 900;
      filt.Q.value = 0.7;
      gg.gain.setValueAtTime(vol * 0.95, now);
      gg.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      var r = ctx.createOscillator();
      r.type = "sawtooth";
      r.frequency.setValueAtTime(720 + Math.random() * 480, now);
      r.frequency.exponentialRampToValueAtTime(1800 + Math.random() * 400, now + 0.07);
      var rg = ctx.createGain();
      rg.gain.setValueAtTime(vol * 0.45, now);
      rg.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      r.connect(rg); rg.connect(master);
      r.start(now); r.stop(now + 0.085);
      burst.start(now); burst.stop(now + 0.09);
    } else {
      filt.type = "bandpass";
      filt.frequency.value = 2200 + Math.random() * 900;
      filt.Q.value = 4.5;
      gg.gain.setValueAtTime(vol, now);
      gg.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      burst.start(now); burst.stop(now + 0.05);
    }
  }

  function arm() {
    boot();
  }

  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
    global.addEventListener(ev, arm, { once: true, passive: true });
  });

  global.HavenSfx = { boot: boot, tick: tick, arm: arm, announce: announce };
})(window);
