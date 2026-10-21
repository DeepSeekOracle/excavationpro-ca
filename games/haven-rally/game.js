/* Haven Rally — follows ./whitepaper.html */
(function () {
  "use strict";
  const SAVE_KEY = "lygo-haven-rally-v1";
  const YD = 0.9144;
  const G0 = 9.81;
  const RHO = 1.225;
  const DEFAULT_GEARS = [3.28, 2.08, 1.48, 1.16, 0.97, 0.84];
  const COMBO_MPH = 5;
  const BOOST_TQ = 0.78;
  const BOOST_VMAX = 0.28;
  const REV_CAP = 11;
  const DEFAULT_CRAFT = {
    id: "apex", name: "Apex Mk I", tag: "Lattice GT",
    src: "./assets/apex-plate.jpg", hero: "./assets/apex-hero.jpg",
    lore: "Base chassis. RWD GT. Slide charges boost. Endless: twin lattice MG — combo stokes the fire.",
    color: "#165e66",
    massKg: 1380,
    hp: 470,
    torque: 420,
    idle: 900,
    redline: 7800,
    tqRpm: 4200,
    hpRpm: 7200,
    gears: DEFAULT_GEARS.slice(),
    finalDrive: 3.73,
    wheelRadius: 0.33,
    drive: "rwd",
    cd: 0.52,
    area: 2.1,
    crr: 0.015,
    mu: 1.32,
    brakeMu: 1.58,
    turn: 2.05,
    boost: 1.1,
    boostPower: 1,
    boostTank: 1,
    body: "apex",
    gun: { id: "mg", name: "Lattice MG", kind: "mg", color: "#ffe08a", dps: 2.2, rate: 0.052, range: 52, barrels: 2, width: 0.07, spread: 1.05, pierce: 1 },
    eta: 0.88,
    upgHp: 0,
    upgTq: 0
  };
  const BOXCUT = {
    id: "boxcut", name: "Boxcut Mk I", tag: "Short-box race truck",
    src: "./assets/boxcut-plate.jpg", hero: "./assets/boxcut-hero.jpg",
    lore: "Haven short-box. C10 short-fleetside stance, original lattice. Heavier, bigger boost tank, 25% harder boost hit. Endless: box cannons — slow, fat, mean.",
    color: "#8b1e1e",
    massKg: 1520,
    hp: 405,
    torque: 495,
    idle: 850,
    redline: 6800,
    tqRpm: 3600,
    hpRpm: 6000,
    gears: DEFAULT_GEARS.slice(),
    finalDrive: 3.90,
    wheelRadius: 0.35,
    drive: "rwd",
    cd: 0.62,
    area: 2.55,
    crr: 0.017,
    mu: 1.40,
    brakeMu: 1.52,
    turn: 2.22,
    boost: 1.28,
    boostPower: 1.25,
    boostTank: 1.42,
    body: "boxcut",
    gun: { id: "cannon", name: "Box cannons", kind: "cannon", color: "#ff6b3d", dps: 2.35, rate: 0.11, range: 46, barrels: 2, width: 0.22, spread: 2.1, pierce: 1 },
    eta: 0.86,
    upgHp: 0,
    upgTq: 0
  };
  const FLICK = {
    id: "flick", name: "Flick Mk I", tag: "Pocket hatch",
    src: "./assets/flick-plate.jpg", hero: "./assets/flick-hero.jpg",
    lore: "FWD pocket rocket. Light, peaky, tightest turn. Biggest boost tank, 50% harder hit than Apex. Endless: flick needles — a spray of hot pins.",
    color: "#c2410c",
    massKg: 1120,
    hp: 355,
    torque: 318,
    idle: 950,
    redline: 7600,
    tqRpm: 4800,
    hpRpm: 7100,
    gears: [3.58, 2.24, 1.58, 1.22, 0.98, 0.82],
    finalDrive: 4.05,
    wheelRadius: 0.31,
    drive: "fwd",
    cd: 0.37,
    area: 1.98,
    crr: 0.014,
    mu: 1.38,
    brakeMu: 1.64,
    turn: 2.42,
    boost: 1.05,
    boostPower: 1.5,
    boostTank: 1.85,
    body: "flick",
    gun: { id: "needle", name: "Flick needles", kind: "needle", color: "#fb923c", dps: 2.08, rate: 0.026, range: 48, barrels: 3, width: 0.04, spread: 0.7, pierce: 1 },
    eta: 0.87,
    upgHp: 0,
    upgTq: 0
  };
  const SLEET = {
    id: "sleet", name: "Sleet Mk I", tag: "AWD rally coupe",
    src: "./assets/sleet-plate.jpg", hero: "./assets/sleet-hero.jpg",
    lore: "AWD rally coupe. Hooks out of the hole, almost no burnout. Rain already has a home here. Endless: sleet rails — twin blue lances that can pierce.",
    color: "#1d4ed8",
    massKg: 1340,
    hp: 438,
    torque: 468,
    idle: 850,
    redline: 7200,
    tqRpm: 3800,
    hpRpm: 6400,
    gears: [3.20, 2.02, 1.46, 1.14, 0.94, 0.82],
    finalDrive: 3.85,
    wheelRadius: 0.33,
    drive: "awd",
    cd: 0.48,
    area: 2.22,
    crr: 0.016,
    mu: 1.50,
    brakeMu: 1.55,
    turn: 2.18,
    boost: 1.18,
    boostPower: 1.08,
    boostTank: 1.15,
    body: "sleet",
    gun: { id: "rail", name: "Sleet rails", kind: "rail", color: "#93c5fd", dps: 2.22, rate: 0.084, range: 64, barrels: 2, width: 0.14, spread: 0.12, pierce: 2 },
    eta: 0.89,
    upgHp: 0,
    upgTq: 0
  };
  const CRAFTS = [
    Object.assign({}, DEFAULT_CRAFT),
    Object.assign({}, BOXCUT),
    Object.assign({}, FLICK),
    Object.assign({}, SLEET)
  ];
  const LOCKED_BAYS = [];
  const DRIVERS = [
    {
      id: "mira", name: "Mira Quinn", tag: "Line cutter",
      src: "./assets/d-mira.jpg",
      lore: "Reads the ribbon a beat early. Smooth hands, mean exits. Stacks a quarter more speed and shove on any chassis.",
      bonus: "+25% top speed · +25% acceleration",
      mul: { vmax: 1.25, accel: 1.25 }
    },
    {
      id: "reed", name: "Reed Hollow", tag: "Hole-shot",
      src: "./assets/d-reed.jpg",
      lore: "Lives in first gear. Leaves like the tree owes him money. Fifty percent more acceleration on whatever you seat him in.",
      bonus: "+50% acceleration",
      mul: { accel: 1.5 }
    },
    {
      id: "kai", name: "Kai Park", tag: "Horizon",
      src: "./assets/d-kai.jpg",
      lore: "Won't lift. The trap is a suggestion. Fifty percent more top speed once the road opens.",
      bonus: "+50% top speed",
      mul: { vmax: 1.5 }
    },
    {
      id: "vesper", name: "Vesper Kane", tag: "Bottle",
      src: "./assets/d-vesper.jpg",
      lore: "Tunes the charge like a second throttle. Harder boost hit, bigger tank. The gold bar lasts and bites.",
      bonus: "+50% boost hit · +40% boost tank",
      mul: { boostPower: 1.5, boostTank: 1.4 }
    },
    {
      id: "joss", name: "Joss Hale", tag: "Gunner",
      src: "./assets/d-joss.jpg",
      lore: "Endless is a shooting gallery. Stronger guns, extra pierce, longer reach. Traffic comes apart.",
      bonus: "+60% gun power · +1 pierce · +25% range",
      mul: { gunDps: 1.6, gunPierce: 1, gunRange: 1.25 }
    },
    {
      id: "nima", name: "Nima Sol", tag: "Sustain",
      src: "./assets/d-nima.jpg",
      lore: "Keeps the bottle full. Larger tank and a faster fill from the slide. Boost is a loop, not a panic.",
      bonus: "+50% boost tank · +50% boost fill",
      mul: { boostTank: 1.5, boostFill: 1.5 }
    }
  ];
  const LANE_W = 4.4;
  const TRACK_LANES = 4;
  const TRACK_HALF = LANE_W * TRACK_LANES * 0.5;
  const CAM_NAMES = ["Chase", "Close", "Hood", "Bumper", "Cockpit", "TV"];
  const WX_NAMES = ["Clear", "Dusk", "Overcast", "Rain", "Storm"];
  const BOT_ROSTER = [
    { name: "Reed", skill: 0.98, color: "#1d4ed8", body: "sleet", driver: "reed" },
    { name: "Mira", skill: 0.96, color: "#c2410c", body: "flick", driver: "mira" },
    { name: "Kai", skill: 0.94, color: "#0f766e", body: "apex", driver: "kai" }
  ];

  function mulberry(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function fmt(ms) {
    if (ms == null || !isFinite(ms)) return "—";
    const s = ms / 1000;
    const m = Math.floor(s / 60);
    const r = s - m * 60;
    return m + ":" + r.toFixed(3).padStart(6, "0");
  }
  function speedVal(yds) {
    const v = Math.abs(yds || 0);
    return opt("metric") ? v * 3.29184 : v * 2.04545;
  }
  function speedUnit() {
    return opt("metric") ? "km/h" : "mph";
  }
  function fmtSpeed(yds) {
    return Math.round(speedVal(yds)) + " " + speedUnit();
  }
  function fmtSpeedMph(mph) {
    if (mph == null || !isFinite(mph)) return "—";
    if (opt("metric")) return Math.round(mph * 1.60934) + " km/h";
    return Math.round(mph) + " mph";
  }
  function craftNorm(raw) {
    const c = Object.assign({}, DEFAULT_CRAFT, raw || {});
    c.gears = (c.gears && c.gears.length) ? c.gears.slice() : DEFAULT_GEARS.slice();
    c.hp = (c.hp || 0) + (c.upgHp || 0);
    c.torque = (c.torque || 0) + (c.upgTq || 0);
    c.upgHp = 0;
    c.upgTq = 0;
    c.drive = c.drive === "fwd" || c.drive === "awd" ? c.drive : "rwd";
    c.boostTank = c.boostTank > 0 ? c.boostTank : 1;
    c.boostPower = c.boostPower > 0 ? c.boostPower : 1;
    c.body = c.body || c.id || "apex";
    c.gun = Object.assign({
      id: "mg", name: "Lattice MG", kind: "mg", color: "#ffe08a",
      dps: 2.2, rate: 0.052, range: 52, barrels: 2, width: 0.07, spread: 1.05, pierce: 1
    }, c.gun || {});
    return c;
  }
  function activeGun() {
    return (G.craft && G.craft.gun) || liveCraft(G.save && G.save.craft, G.save && G.save.driver).gun;
  }
  function gunDps() {
    const n = G.combo || 0;
    const g = activeGun();
    const scale = 1 + 0.45 * n + 0.18 * n * n;
    const bp = (G.craft && G.craft.boostPower) || 1;
    return (g.dps || 2.2) * scale * (0.88 + 0.12 * bp);
  }
  function craftOf(id) {
    return craftNorm(CRAFTS.find(function (c) { return c.id === id; }) || CRAFTS[0]);
  }
  function driverOf(id) {
    return DRIVERS.find(function (d) { return d.id === id; }) || DRIVERS[0];
  }
  function liveCraft(craftId, driverId) {
    const c = craftOf(craftId || (G.save && G.save.craft));
    const d = driverOf(driverId || (G.save && G.save.driver));
    const m = d.mul || {};
    c.accelMul = m.accel || 1;
    c.vmaxMul = m.vmax || 1;
    c.boostFillMul = m.boostFill || 1;
    c.boostTank = (c.boostTank || 1) * (m.boostTank || 1);
    c.boostPower = (c.boostPower || 1) * (m.boostPower || 1);
    if (c.gun) {
      c.gun = Object.assign({}, c.gun);
      c.gun.dps = (c.gun.dps || 2.2) * (m.gunDps || 1);
      c.gun.pierce = (c.gun.pierce || 1) + (m.gunPierce || 0);
      if (m.gunRange) c.gun.range = (c.gun.range || 52) * m.gunRange;
    }
    c.driver = d;
    return c;
  }
  function driveFrac(c) {
    if (c.drive === "fwd") return { f: 1, r: 0 };
    if (c.drive === "awd") return { f: 0.4, r: 0.6 };
    return { f: 0, r: 1 };
  }
  function engineTorqueNm(c, rpm) {
    const peak = c.torque * 1.35582;
    if (rpm >= c.redline) return peak * 0.12;
    if (rpm <= c.idle * 0.6) return peak * 0.2 * (rpm / (c.idle * 0.6));
    const s = 2100;
    const bell = Math.exp(-Math.pow((rpm - c.tqRpm) / s, 2));
    return peak * (0.42 + 0.58 * bell);
  }
  function roadRpm(c, speedYd, gearIndex) {
    const v = Math.abs(speedYd) * YD;
    const ratio = (c.gears[gearIndex] || c.gears[0]) * c.finalDrive;
    return (v / c.wheelRadius) * ratio * 60 / (Math.PI * 2);
  }
  function comboVmaxBonusYd() {
    return (G.combo || 0) * (COMBO_MPH / 2.04545);
  }
  function baseTopSpeedYd(c) {
    const P = Math.max(1, c.hp) * 745.7;
    const k = 0.5 * RHO * c.cd * c.area;
    return Math.pow(P / Math.max(k, 0.05), 1 / 3) / YD;
  }
  function topSpeedYd(c) {
    return (baseTopSpeedYd(c) + comboVmaxBonusYd()) * ((c && c.vmaxMul) || 1);
  }

  const OPTIONS = [
    { key: "ghost", group: "Race", type: "toggle", label: "Show ghost", hint: "Best heat for this circuit + craft rides with you.", def: true },
    { key: "countdown", group: "Race", type: "toggle", label: "Countdown lights", hint: "3–2–1 before green.", def: true },
    { key: "manual", group: "Controls", type: "toggle", label: "Manual transmission", hint: "Z toggles. Auto is default. On: ↑ upshift · ↓ downshift. Split: P1 Q/E, P2 O/P. Pad: D-pad up/down.", def: false },
    { key: "invertSteer", group: "Controls", type: "toggle", label: "Invert steer", hint: "Swap A/D and the arrow keys.", def: false },
    { key: "camView", group: "Camera", type: "range", label: "Camera", hint: "C cycles views.", min: 0, max: 5, step: 1, def: 0 },
    { key: "camDist", group: "Camera", type: "range", label: "Chase distance", min: 0.7, max: 1.7, step: 0.05, def: 1 },
    { key: "camHeight", group: "Camera", type: "range", label: "Chase height", min: 0.7, max: 1.8, step: 0.05, def: 1 },
    { key: "showPilot", group: "HUD", type: "toggle", label: "Pilot plate", def: true },
    { key: "showHint", group: "HUD", type: "toggle", label: "On-track hint", def: true },
    { key: "metric", group: "HUD", type: "toggle", label: "Speed in km/h", hint: "Off: mph (US). On: km/h (Canada).", def: false },
    { key: "reduceFx", group: "Graphics", type: "toggle", label: "Reduce effects", hint: "Hides drift sparks, rain streaks, and underglow.", def: false },
    { key: "weather", group: "Race", type: "range", label: "Weather", hint: "Clear, Dusk, Overcast, Rain, Storm. Wet cuts grip; AWD keeps more of it.", min: 0, max: 4, step: 1, def: 1 },
    { key: "assist", group: "Controls", type: "soon", label: "Steering assist", hint: "Coming with the handling pack." },
    { key: "abs", group: "Controls", type: "soon", label: "Brake assist", hint: "Coming with the handling pack." }
  ];

  function defaultOptions() {
    const o = {};
    OPTIONS.forEach(function (s) {
      if (s.type !== "soon") o[s.key] = s.def;
    });
    return o;
  }
  function opt(key) {
    const spec = OPTIONS.find(function (s) { return s.key === key; });
    const o = (G.save && G.save.options) || {};
    if (o[key] == null) return spec ? spec.def : false;
    return o[key];
  }
  function setOpt(key, val) {
    if (!G.save.options) G.save.options = defaultOptions();
    G.save.options[key] = val;
    writeSave(G.save);
    if (key === "metric") G.hudSpd = speedVal(G.car.speed || 0);
    applyOptions();
  }
  function applyOptions() {
    if ($("pilotPlate")) $("pilotPlate").classList.toggle("hidden", !opt("showPilot"));
    if ($("hint")) $("hint").classList.toggle("hidden", !opt("showHint"));
    if (window.Rally3D && Rally3D.setCam) {
      Rally3D.setCam({
        dist: Number(opt("camDist")) || 1,
        height: Number(opt("camHeight")) || 1,
        view: Math.round(Number(opt("camView")) || 0),
        view2: G.camView2 || 0
      });
    }
    if ($("rhUnit")) $("rhUnit").textContent = opt("metric") ? "km/h" : "MPH";
    if (window.Rally3D && Rally3D.setWeather) {
      Rally3D.setWeather(Math.round(Number(opt("weather")) || 0), opt("reduceFx"));
    }
  }
  function weatherGrip(c) {
    const w = Math.round(Number(opt("weather")) || 1);
    if (w < 3) return 1;
    const wet = w >= 4 ? 0.68 : 0.82;
    if (c && c.drive === "awd") return wet + (1 - wet) * 0.55;
    return wet;
  }
  function optRowHtml(s) {
    const hint = s.hint ? "<p class='lore'>" + s.hint + "</p>" : "";
    const left = "<div><b>" + s.label + "</b>" + hint + "</div>";
    let right = "";
    if (s.type === "toggle") {
      const on = !!opt(s.key);
      right = "<button type='button' class='opt-toggle" + (on ? " on" : "") + "' data-opt='" + s.key + "'>" +
        (on ? "On" : "Off") + "</button>";
    } else if (s.type === "range") {
      const v = Number(opt(s.key));
      const shown = s.key === "camView" ? (CAM_NAMES[Math.round(v)] || String(v))
        : s.key === "weather" ? (WX_NAMES[Math.round(v)] || String(v))
        : v.toFixed(2);
      right = "<label class='opt-range'><span data-opt-val='" + s.key + "'>" + shown + "</span>" +
        "<input type='range' data-opt='" + s.key + "' min='" + s.min + "' max='" + s.max +
        "' step='" + s.step + "' value='" + v + "'></label>";
    } else {
      right = "<span class='opt-soon'>Soon</span>";
    }
    return "<div class='opt-row'>" + left + right + "</div>";
  }
  function optionsMenu() {
    G._sheet = "options";
    const groups = [];
    OPTIONS.forEach(function (s) {
      if (!groups.length || groups[groups.length - 1].name !== s.group) {
        groups.push({ name: s.group, rows: [] });
      }
      groups[groups.length - 1].rows.push(s);
    });
    const body = groups.map(function (g) {
      return "<p class='opt-group'>" + g.name + "</p>" + g.rows.map(optRowHtml).join("");
    }).join("");
    showSheet(
      "<p class='kicker'>Configuration</p><h2>Options</h2>" +
      "<p class='lore'>Saved with the local ledger. New settings drop in as extra rows — this sheet is the fill-as-we-go panel.</p>" +
      body +
      "<div class='modes'><button type='button' class='btn gold' id='optBack'>Back</button>" +
      "<button type='button' class='btn' id='optControls'>Controls</button>" +
      "<button type='button' class='btn' id='optReset'>Reset defaults</button></div>",
      false,
      "sheet-opts"
    );
    $("optBack").onclick = function () {
      G._sheet = "";
      if (G.mode === "menu") menu();
      else hideOverlay();
    };
    $("optReset").onclick = function () {
      G.save.options = defaultOptions();
      writeSave(G.save);
      applyOptions();
      optionsMenu();
    };
    if ($("optControls")) $("optControls").onclick = function () { help("options"); };
    const ov = $("overlay");
    ov.querySelectorAll("[data-opt]").forEach(function (el) {
      const key = el.getAttribute("data-opt");
      const spec = OPTIONS.find(function (s) { return s.key === key; });
      if (!spec || spec.type === "soon") return;
      if (spec.type === "toggle") {
        el.onclick = function () {
          setOpt(key, !opt(key));
          const on = !!opt(key);
          el.classList.toggle("on", on);
          el.textContent = on ? "On" : "Off";
        };
      } else if (spec.type === "range") {
        el.oninput = function () {
          const n = Number(el.value);
          setOpt(key, n);
          const valEl = ov.querySelector("[data-opt-val='" + key + "']");
          if (valEl) {
            valEl.textContent = spec.key === "camView" ? (CAM_NAMES[Math.round(n)] || String(n))
              : spec.key === "weather" ? (WX_NAMES[Math.round(n)] || String(n))
              : n.toFixed(2);
          }
        };
      }
    });
  }

  function densifyPath(pts, step, closed) {
    const out = [];
    const segs = closed ? pts.length : Math.max(0, pts.length - 1);
    for (let i = 0; i < segs; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const len = dist(a, b) || 1;
      const n = Math.max(1, Math.ceil(len / step));
      for (let k = 0; k < n; k++) {
        const t = k / n;
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
    if (!closed && pts.length) out.push(pts[pts.length - 1]);
    return out;
  }
  function pathLen(pts, closed) {
    let n = 0;
    const segs = closed ? pts.length : Math.max(0, pts.length - 1);
    for (let i = 0; i < segs; i++) n += dist(pts[i], pts[(i + 1) % pts.length]);
    return n;
  }
  function wrapDelta(ds, len) {
    if (ds > len * 0.5) ds -= len;
    if (ds < -len * 0.5) ds += len;
    return ds;
  }
  function project(p, samples, lastS, closed) {
    if (closed == null) closed = true;
    let best = 1e15, lat = 0, s = 0, hx = 1, hy = 0, acc = 0;
    const segs = closed ? samples.length : Math.max(0, samples.length - 1);
    let total = 0;
    for (let i = 0; i < segs; i++) total += dist(samples[i], samples[(i + 1) % samples.length]);
    for (let i = 0; i < segs; i++) {
      const a = samples[i], b = samples[(i + 1) % samples.length];
      const dx = b.x - a.x, dy = b.y - a.y;
      const l2 = dx * dx + dy * dy || 1;
      let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
      t = clamp(t, 0, 1);
      const qx = a.x + dx * t, qy = a.y + dy * t;
      const d = Math.hypot(p.x - qx, p.y - qy);
      const len = Math.sqrt(l2);
      const sHere = acc + t * len;
      const jump = lastS == null ? 0 : Math.abs(closed ? wrapDelta(sHere - lastS, total || 1) : (sHere - lastS));
      const score = d + 0.12 * jump;
      if (score < best) {
        best = score;
        hx = dx / (len || 1); hy = dy / (len || 1);
        lat = (p.x - qx) * (-hy) + (p.y - qy) * hx;
        s = sHere;
      }
      acc += len;
    }
    return { d: best, lat: lat, s: s, hx: hx, hy: hy, len: acc };
  }

  function makeTrack(spec) {
    const pts = chaikin(spec.ctrl.slice(), 2, true);
    const samples = densifyPath(pts, 6, true);
    const len = pathLen(samples, true);
    return {
      id: spec.id,
      name: spec.name,
      theme: spec.theme || spec.id,
      lore: spec.lore || "",
      width: TRACK_HALF,
      laneW: LANE_W,
      lanes: TRACK_LANES,
      laps: spec.laps || 3,
      pts: pts,
      samples: samples,
      len: len,
      closed: true,
      kind: "circuit",
      sectors: [0.28, 0.55, 0.82],
      seed: spec.seed || null,
      style: spec.style || null,
      design: spec.design || null
    };
  }

  function makeDragTrack(spec) {
    const race = spec.yards;
    const pad = 48;
    const shut = Math.max(160, race * 0.42);
    const total = pad + race + shut;
    const pts = [];
    for (let x = 0; x <= total; x += 6) pts.push({ x: x, y: 0 });
    if (pts[pts.length - 1].x < total) pts.push({ x: total, y: 0 });
    const samples = densifyPath(pts, 4, false);
    return {
      id: spec.id,
      name: spec.name,
      theme: "drag-strip",
      lore: spec.lore,
      width: TRACK_HALF,
      laneW: LANE_W,
      lanes: TRACK_LANES,
      lane: LANE_W * 0.5,
      laps: 1,
      pts: pts,
      samples: samples,
      len: pathLen(samples, false),
      closed: false,
      kind: "drag",
      startX: pad,
      finishX: pad + race,
      yards: race,
      feet: spec.feet,
      sectors: []
    };
  }
  function loopFromPolar(n, radius, jitter, rng, spin, squash) {
    const pts = [];
    const sq = squash == null ? 0.7 : squash;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (spin || 0);
      const r = Math.max(radius * 0.38, 90, radius + Math.sin(a * 2.2) * jitter * 0.45 + Math.sin(a * 5.1) * jitter * 0.16 + (rng() * 2 - 1) * jitter);
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * sq });
    }
    return pts;
  }

  /* ---- course designer -------------------------------------------------
     A designed racing line instead of a lumpy oval.

     The base is a closed polar loop: an ellipse squashed and shaped with a
     couple of harmonics, which is closed by definition. Every design move
     then reshapes one *stretch* of that loop between two anchors that stay
     put, so the loop is still closed afterwards:

       lineStretch   - straighten a stretch (a real straight)
       bendStretch   - pull a stretch in, or push it out (sweeper, esse)
       hairpinStretch- splice in a solved 180: a biarc of two tangent-
                       continuous arcs that leaves the entry anchor on its
                       own heading and arrives at the exit anchor on its
                       own heading, at a radius the circuit can be proud of

     Because the anchors are the loop's own points, the splice is exact and
     the loop never has to be sheared shut. The finished line is relaxed,
     checked for self-overlap, and scaled to the circuit's target length. */
  const COURSE_STYLES = ["flow", "technical", "hairpin", "ring"];

  function courseStyleOf(seed) {
    return COURSE_STYLES[(seed >>> 0) % COURSE_STYLES.length];
  }

  function courseProfile(style) {
    if (style === "technical") return { r0: 260, sx: 0.98, sy: 0.8, spin: -0.5, harm: [[3, 0.1, 1.3], [5, 0.04, 0.3]] };
    if (style === "hairpin") return { r0: 300, sx: 1.15, sy: 0.6, spin: 0, harm: [[2, 0.05, 0.9]] };
    if (style === "ring") return { r0: 240, sx: 1.0, sy: 0.92, spin: 0.35, harm: [[4, -0.13, 0.8], [3, 0.03, 2.0]] };
    return { r0: 285, sx: 1.02, sy: 0.72, spin: 0.05, harm: [[2, 0.08, 0.5], [3, 0.09, 0.2]] };
  }

  function polarLoop(prof, n) {
    var out = [], i, a, r, k, h;
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2 + prof.spin;
      r = 1;
      for (k = 0; k < prof.harm.length; k++) {
        h = prof.harm[k];
        r += h[1] * Math.cos(h[0] * a + h[2]);
      }
      r *= prof.r0;
      out.push({ x: Math.cos(a) * r * prof.sx, y: Math.sin(a) * r * prof.sy });
    }
    return out;
  }

  function courseHeadingAt(p, i) {
    var n = p.length, a = p[(i - 1 + n) % n], b = p[(i + 1) % n];
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  /* a straight between two anchors: the anchors do not move, so the loop stays shut.
     The straight is blended into the curve at both ends, so it has no kink. */
  function lineStretch(p, f0, f1) {
    var n = p.length, i0 = Math.round(f0 * n), i1 = Math.round(f1 * n), i, t, w, e = 0.26, u, lin, q;
    var a = p[i0 % n], b = p[i1 % n];
    var span = i1 - i0;
    if (span < 4) return p;
    for (i = i0 + 1; i < i1; i++) {
      t = (i - i0) / span;
      u = t < e ? t / e : (t > 1 - e ? (1 - t) / e : 1);
      w = u * u * (3 - 2 * u);
      lin = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      q = p[i % n];
      p[i % n] = { x: q.x + (lin.x - q.x) * w, y: q.y + (lin.y - q.y) * w };
    }
    return p;
  }

  /* k > 0 pulls a stretch toward its own centroid (tighter), k < 0 pushes it out.
     The window has zero slope at the anchors, so no kink is left behind. */
  function bendStretch(p, f0, f1, k) {
    var n = p.length, i0 = Math.round(f0 * n), i1 = Math.round(f1 * n), i, t, w, cx = 0, cy = 0, m = 0;
    if (i1 - i0 < 4) return p;
    for (i = i0; i <= i1; i++) { cx += p[i % n].x; cy += p[i % n].y; m += 1; }
    cx /= m; cy /= m;
    for (i = i0 + 1; i < i1; i++) {
      t = (i - i0) / (i1 - i0);
      w = Math.sin(Math.PI * t);
      w = w * w;
      p[i % n] = { x: p[i].x + (cx - p[i].x) * k * w, y: p[i].y + (cy - p[i].y) * k * w };
    }
    return p;
  }

  /* two tangent-continuous arcs from (p1,h1) to (p2,h2), with the radii held near wantR */
  function biarcSolve(p1, h1, p2, h2, wantR, slack) {
    var t1 = { x: Math.cos(h1), y: Math.sin(h1) };
    var t2 = { x: Math.cos(h2), y: Math.sin(h2) };
    var n1 = { x: -t1.y, y: t1.x }, n2 = { x: -t2.y, y: t2.x };
    var spread = slack || [0.75, 1.0, 1.35, 1.8, 2.4];
    var best = null, i, sg, r1, w, den, r2, c1, c2, jp, d1, d2, s1, s2, minR, turn, k;
    for (i = 0; i < spread.length; i++) {
      for (sg = -1; sg <= 1; sg += 2) {
        r1 = sg * wantR * spread[i];
        c1 = { x: p1.x + n1.x * r1, y: p1.y + n1.y * r1 };
        w = { x: c1.x - p2.x, y: c1.y - p2.y };
        den = 2 * (w.x * n2.x + w.y * n2.y - r1);
        if (Math.abs(den) < 1e-6) continue;
        r2 = (w.x * w.x + w.y * w.y - r1 * r1) / den;
        if (!isFinite(r2) || Math.abs(r2) < wantR * 0.35 || Math.abs(r2) > wantR * 9) continue;
        if (Math.abs(r1 - r2) < 1e-6) continue;
        c2 = { x: p2.x + n2.x * r2, y: p2.y + n2.y * r2 };
        k = r1 / (r1 - r2);
        jp = { x: c1.x + (c2.x - c1.x) * k, y: c1.y + (c2.y - c1.y) * k };
        s1 = wrapDelta(Math.atan2(jp.y - c1.y, jp.x - c1.x) - Math.atan2(p1.y - c1.y, p1.x - c1.x), Math.PI * 2);
        s2 = wrapDelta(Math.atan2(p2.y - c2.y, p2.x - c2.x) - Math.atan2(jp.y - c2.y, jp.x - c2.x), Math.PI * 2);
        if (s1 * (r1 > 0 ? 1 : -1) <= 0.02 || s2 * (r2 > 0 ? 1 : -1) <= 0.02) continue;
        d1 = dist(p1, jp);
        d2 = dist(jp, p2);
        if (d1 < 3 || d2 < 3) continue;
        minR = Math.min(Math.abs(r1), Math.abs(r2));
        turn = Math.abs(s1) + Math.abs(s2);
        var sc = -Math.abs(turn - Math.PI) * 60 - Math.abs(minR - wantR) * 3;
        if (!best || sc > best.score) best = { r1: r1, r2: r2, c1: c1, c2: c2, jp: jp, s1: s1, s2: s2, minR: minR, turn: turn, score: sc, p1: p1, p2: p2, h1: h1 };
      }
    }
    return best;
  }

  function biarcPath(b) {
    var out = [{ x: b.p1.x, y: b.p1.y }], st;
    st = arcPts(b.p1.x, b.p1.y, b.h1, b.r1, b.s1, out, 0.16);
    arcPts(b.jp.x, b.jp.y, st.h, b.r2, b.s2, out, 0.16);
    return out;
  }

  function arcPts(x, y, h, r, a, out, step) {
    var n = Math.max(2, Math.ceil(Math.abs(a) / (step || 0.2)));
    var s = a / n, d = r * s, mh, i;
    for (i = 0; i < n; i++) {
      mh = h + s * 0.5;
      x += Math.cos(mh) * d;
      y += Math.sin(mh) * d;
      h += s;
      out.push({ x: x, y: y });
    }
    return { x: x, y: y, h: h };
  }

  /* replace the stretch between two anchors with a solved hairpin */
  function hairpinStretch(p, f0, f1, R) {
    var n = p.length, i0 = Math.round(f0 * n), i1 = Math.round(f1 * n), i;
    if (i1 - i0 < 4) return { p: p, ok: false };
    var A = p[i0 % n], B = p[i1 % n];
    var hA = courseHeadingAt(p, i0), hB = courseHeadingAt(p, i1);
    var b = biarcSolve(A, hA, B, hB, R);
    if (!b) return { p: p, ok: false };
    var path = biarcPath(b);
    var out = [];
    for (i = 0; i < i0; i++) out.push(p[i]);
    for (i = 1; i < path.length - 1; i++) out.push(path[i]);
    for (i = i1; i < n; i++) out.push(p[i]);
    return { p: out, ok: true, minR: b.minR };
  }

  function courseOps(p, rng, style) {
    var R = function (a, b) { return a + rng() * (b - a); };
    var res = { ok: 0, fail: 0 };
    var hp = function (f0, f1, r) {
      var o = hairpinStretch(p, f0, f1, r);
      if (o.ok) { p = o.p; res.ok += 1; } else res.fail += 1;
    };
    if (style === "technical") {
      lineStretch(p, 0.86, 1.1);
      hp(0.16, 0.3, R(52, 62));
      bendStretch(p, 0.34, 0.42, R(0.16, 0.24));
      bendStretch(p, 0.44, 0.5, R(-0.16, -0.1));
      bendStretch(p, 0.54, 0.62, R(0.2, 0.28));
      lineStretch(p, 0.66, 0.74);
      hp(0.76, 0.84, R(58, 70));
      bendStretch(p, 0.05, 0.12, R(-0.2, -0.12));
    } else if (style === "hairpin") {
      lineStretch(p, 0.87, 1.13);
      hp(0.22, 0.36, R(44, 52));
      lineStretch(p, 0.4, 0.63);
      bendStretch(p, 0.66, 0.72, R(-0.14, -0.08));
      bendStretch(p, 0.74, 0.8, R(0.08, 0.14));
      hp(0.82, 0.96, R(46, 56));
    } else if (style === "ring") {
      lineStretch(p, 0.88, 1.12);
      lineStretch(p, 0.16, 0.32);
      hp(0.34, 0.42, R(52, 62));
      lineStretch(p, 0.44, 0.58);
      hp(0.6, 0.68, R(50, 60));
      lineStretch(p, 0.7, 0.82);
      bendStretch(p, 0.05, 0.12, R(-0.2, -0.12));
    } else {
      lineStretch(p, 0.86, 1.14);
      bendStretch(p, 0.16, 0.3, R(-0.28, -0.18));
      bendStretch(p, 0.32, 0.4, R(0.2, 0.28));
      bendStretch(p, 0.42, 0.48, R(-0.24, -0.16));
      lineStretch(p, 0.52, 0.62);
      hp(0.64, 0.76, R(56, 68));
      bendStretch(p, 0.8, 0.86, R(-0.2, -0.12));
    }
    return res;
  }

  function smoothClosed(p, k, iters) {
    var n = p.length, out = p, it, i, a, b, cc, q;
    for (it = 0; it < iters; it++) {
      q = out.slice();
      for (i = 0; i < n; i++) {
        a = out[(i - 1 + n) % n]; b = out[i]; cc = out[(i + 1) % n];
        q[i] = { x: b.x + k * ((a.x + cc.x) * 0.5 - b.x), y: b.y + k * ((a.y + cc.y) * 0.5 - b.y) };
      }
      out = q;
    }
    return out;
  }

  function radProfile(p) {
    var n = p.length, out = [], i, a, b, cc, ds, dh;
    for (i = 0; i < n; i++) {
      a = p[(i - 1 + n) % n]; b = p[i]; cc = p[(i + 1) % n];
      ds = (dist(a, b) + dist(b, cc)) * 0.5 || 1e-6;
      dh = wrapDelta(Math.atan2(cc.y - b.y, cc.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x), Math.PI * 2);
      out.push(Math.abs(dh) > 1e-9 ? ds / Math.abs(dh) : 1e9);
    }
    return out;
  }

  /* round off anything sharper than the circuit's own minimum radius */
  function relaxKinks(p, target, iters) {
    var n = p.length, it, i, r, k, a, b, cc, q;
    for (it = 0; it < (iters || 80); it++) {
      r = radProfile(p);
      k = 0;
      for (i = 0; i < n; i++) if (r[i] < target) k += 1;
      if (!k) break;
      q = p.slice();
      for (i = 0; i < n; i++) {
        if (r[i] >= target) continue;
        a = p[(i - 1 + n) % n]; b = p[i]; cc = p[(i + 1) % n];
        q[i] = { x: b.x + 0.5 * ((a.x + cc.x) * 0.5 - b.x), y: b.y + 0.5 * ((a.y + cc.y) * 0.5 - b.y) };
      }
      p = q;
    }
    return p;
  }

  function sepClosed(p, minSep, frac, skip) {
    var n = p.length, i, j, dx, dy, dd, push, hits = 0;
    for (i = 0; i < n; i++) {
      for (j = i + skip; j < n; j++) {
        if (i === 0 && j >= n - skip) continue;
        dx = p[j].x - p[i].x; dy = p[j].y - p[i].y;
        dd = Math.hypot(dx, dy);
        if (dd >= minSep || dd < 1e-6) continue;
        push = (minSep - dd) * 0.5 * frac;
        dx /= dd; dy /= dd;
        p[i].x -= dx * push; p[i].y -= dy * push;
        p[j].x += dx * push; p[j].y += dy * push;
        hits += 1;
      }
    }
    p.hits = hits;
    return p;
  }

  function decimate(p, step) {
    var n = p.length, out = [], i, acc = 0, last = p[0];
    out.push({ x: p[0].x, y: p[0].y });
    for (i = 1; i <= n; i++) {
      acc += dist(last, p[i % n]);
      last = p[i % n];
      if (acc >= step && i < n) { out.push({ x: p[i].x, y: p[i].y }); acc = 0; }
    }
    return out.length >= 8 ? out : p.slice();
  }

  function courseMeta(path, closed) {
    var n = path.length, nSeg = closed === false ? n - 1 : n, i, len = 0, ds, dh;
    var r = radProfile(path), minR = 1e9;
    var corners = 0, hairpins = 0, inRun = false, runTurn = 0, runMin = 1e9, runLen = 0;
    for (i = 0; i < nSeg; i++) len += dist(path[i], path[(i + 1) % n]);
    for (i = 0; i < n; i++) {
      var a = path[(i - 1 + n) % n], b = path[i], cc = path[(i + 1) % n];
      ds = (dist(a, b) + dist(b, cc)) * 0.5 || 1e-6;
      dh = wrapDelta(Math.atan2(cc.y - b.y, cc.x - b.x) - Math.atan2(b.y - a.y, b.x - a.x), Math.PI * 2);
      if (r[i] < 260) {
        if (!inRun) { inRun = true; runTurn = 0; runLen = 0; runMin = 1e9; }
        runTurn += Math.abs(dh);
        runLen += ds;
        if (r[i] < runMin) runMin = r[i];
        if (r[i] < minR) minR = r[i];
      } else if (inRun) {
        if (runTurn > 0.24 && runLen > 16) { corners += 1; if (runTurn > 1.9 && runMin < 80) hairpins += 1; }
        inRun = false;
      }
    }
    if (inRun && runTurn > 0.24 && runLen > 16) { corners += 1; if (runTurn > 1.9 && runMin < 80) hairpins += 1; }
    if (minR > 1e8) minR = 0;
    return { yards: len, mi: len / 1760, corners: corners, hairpins: hairpins, minR: minR };
  }

  function scaleLoop(p, k) {
    var out = [], i;
    for (i = 0; i < p.length; i++) out.push({ x: p[i].x * k, y: p[i].y * k });
    return out;
  }

  function buildCourse(seed, style, wantYards, minSep) {
    var rng = mulberry(seed >>> 0);
    var want = wantYards || 1600;
    var sep = minSep || (2 * TRACK_HALF + 13);
    var loop = polarLoop(courseProfile(style), 260);
    loop = densifyPath(loop, 8, true);
    var ops = courseOps(loop, rng, style);
    loop = ops.p || loop;
    var built = smoothClosed(loop, 0.13, 2);
    built = relaxKinks(built, 44, 90);
    var k = want / courseMeta(built, true).yards, g, m, i;
    for (g = 0; g < 4; g++) {
      m = courseMeta(scaleLoop(built, k), true);
      if (Math.abs(m.yards - want) < want * 0.01) break;
      k *= want / m.yards;
    }
    var fitted = scaleLoop(built, k);
    var overlap = 0;
    for (i = 0; i < 6; i++) {
      sepClosed(fitted, sep, 0.7, 10);
      overlap = fitted.hits || 0;
      fitted = smoothClosed(fitted, 0.05, 1);
    }
    fitted = relaxKinks(fitted, 40, 60);
    var ctrl = decimate(fitted, 13);
    return { ctrl: ctrl, dense: fitted, style: style, meta: courseMeta(fitted, true), overlap: overlap, opsOk: ops.ok, opsFail: ops.fail };
  }

  /* retry the jitter draws until the design lands on something driveable */
  function designCourse(seed, style, wantYards, minSep) {
    var st = style || courseStyleOf(seed);
    var best = null, i, r;
    for (i = 0; i < 5; i++) {
      r = buildCourse((seed >>> 0) + i * 7919, st, wantYards, minSep);
      if (!r || !r.ctrl || r.ctrl.length < 12) continue;
      r.score = r.meta.minR + r.meta.corners * 6 - r.overlap * 0.2 + r.opsOk * 3;
      if (!best || r.score > best.score) best = r;
      if (r.meta.minR >= 44 && r.meta.corners >= 6 && r.overlap < 6) break;
    }
    return best;
  }

  function courseTag(style) {
    return { flow: "fast sweepers", technical: "technical esses", hairpin: "two hairpins", ring: "city blocks" }[style] || "mixed";
  }


  const C_PINE = designCourse(0x70696e65, "flow", 1574);
  const C_CORAL = designCourse(0x636f7261, "hairpin", 2009);
  const C_STAR = designCourse(0x73746172, "ring", 1435);

  const PINE = makeTrack({
    id: "pine-coil", name: "Pine Coil", theme: "pine-coil", laps: 24,
    lore: "Golden-hour parkland highway. 24-lap heat. Four lanes, chain the esses, slide to fill boost.",
    ctrl: (C_PINE.ctrl), style: "flow", design: C_PINE.meta
  });
  const CORAL = makeTrack({
    id: "coral-coast", name: "Coral Coast", theme: "coral-coast", laps: 20,
    lore: "Sunset coast highway. 20-lap heat. Four lanes, long straights, then don't overcook the hairpin.",
    ctrl: (C_CORAL.ctrl), style: "hairpin", design: C_CORAL.meta
  });
  const STAR = makeTrack({
    id: "singularity-ring", name: "Singularity Ring", theme: "singularity-ring", laps: 30,
    lore: "Night city ring. 30-lap heat. Four lanes of neon. Boost on the slide, don't miss the apex.",
    ctrl: (C_STAR.ctrl), style: "ring", design: C_STAR.meta
  });
  const DRAG_EIGHTH = makeDragTrack({
    id: "drag-eighth", name: "Drag · 1/8 mile", feet: 660, yards: 220,
    lore: "NHRA eighth-mile. 660 ft. Short tree, short trap."
  });
  const DRAG_THOU = makeDragTrack({
    id: "drag-1000", name: "Drag · 1000 ft", feet: 1000, yards: 1000 / 3,
    lore: "1000-foot trap. Same length NHRA used for Top Fuel."
  });
  const DRAG_QUARTER = makeDragTrack({
    id: "drag-quarter", name: "Drag · 1/4 mile", feet: 1320, yards: 440,
    lore: "Classic quarter-mile. 1320 ft. Full sportsman tree vs AI."
  });

  const RUN_NAMES = ["Gold Hour Coast", "Lattice Bypass", "Neon Harbor", "Coral Overpass", "Apex Line", "Haven Run"];
  const CUSTOM_NAMES = ["Seed Coil", "Haven Loop", "Lattice Ring", "Whisper Oval", "Mercy Circuit", "Night Fold"];
  const CUSTOM_THEMES = ["pine-coil", "coral-coast", "singularity-ring"];

  function parseSeed(raw) {
    const s = String(raw || "").trim();
    if (!s) return (Date.now() ^ ((Math.random() * 0x100000000) | 0)) >>> 0;
    if (/^[0-9]+$/.test(s)) return (parseInt(s, 10) || 1) >>> 0;
    if (/^[0-9a-f]+$/i.test(s)) return (parseInt(s, 16) || 1) >>> 0;
    let h = 2166136261;
    let i;
    for (i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function clampLaps(n) {
    const v = Math.round(Number(n) || 12);
    return v < 1 ? 1 : v > 60 ? 60 : v;
  }
  function makeCustomCircuit(seed, laps) {
    seed = seed >>> 0;
    laps = clampLaps(laps);
    const theme = CUSTOM_THEMES[seed % CUSTOM_THEMES.length];
    const name = CUSTOM_NAMES[seed % CUSTOM_NAMES.length];
    const hex = seed.toString(16).padStart(8, "0");
    const style = courseStyleOf(seed);
    const want = 1450 + (seed % 9) * 85;
    const course = designCourse(seed, style, want);
    const tr = makeTrack({
      id: "custom-" + hex,
      name: name,
      theme: theme,
      laps: laps,
      lore: "Custom seed " + hex + ". " + laps + "-lap heat. Four lanes, " + courseTag(style) + ", " +
        (want / 1760).toFixed(2) + " mi designed closed highway.",
      ctrl: course.ctrl,
      style: style,
      design: course.meta,
      seed: seed
    });
    tr.custom = true;
    return tr;
  }

  function ridgeCtrl(seed) {
    const rng = mulberry(seed >>> 0);
    const st = { x: 0, y: 0, h: 0 };
    const pts = [{ x: 0, y: 0 }];
    function add(dist, dH) {
      st.h += dH;
      st.x += Math.cos(st.h) * dist;
      st.y += Math.sin(st.h) * dist;
      pts.push({ x: st.x, y: st.y });
    }
    add(320 + rng() * 80, 0);
    let n = 0;
    while (pathLen(pts, false) < 28000 && n < 220) {
      n += 1;
      const roll = rng();
      const dir = rng() < 0.5 ? -1 : 1;
      if (roll < 0.36) add(560 + rng() * 820, (rng() - 0.5) * 0.06);
      else if (roll < 0.54) add(260 + rng() * 200, dir * (0.2 + rng() * 0.26));
      else if (roll < 0.68) {
        add(110, dir * 0.16);
        add(140, -dir * 0.32);
        add(110, dir * 0.16);
      } else if (roll < 0.78) {
        add(90, dir * 0.18);
        add(160 + rng() * 40, dir * (0.52 + rng() * 0.2));
        add(90, dir * 0.14);
      } else if (roll < 0.9) {
        add(200 + rng() * 90, dir * 0.24);
        add(180 + rng() * 70, dir * 0.16);
      } else {
        add(180 + rng() * 90, 0);
        add(100, dir * (0.24 + rng() * 0.12));
      }
      st.h += wrapDelta(0 - st.h, Math.PI * 2) * 0.05;
    }
    add(360, wrapDelta(0 - st.h, Math.PI * 2) * 0.2);
    add(200, 0);
    return chaikin(pts, 3);
  }

  function chaikin(pts, rounds, closed) {
    let p = pts, r, i, out, a, b;
    for (r = 0; r < rounds; r++) {
      out = [];
      if (closed) {
        for (i = 0; i < p.length; i++) {
          a = p[i];
          b = p[(i + 1) % p.length];
          out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
          out.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
        }
      } else {
        out = [p[0]];
        for (i = 0; i < p.length - 1; i++) {
          a = p[i]; b = p[i + 1];
          out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
          out.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
        }
        out.push(p[p.length - 1]);
      }
      p = out;
    }
    return p;
  }

  function makeRidgeTrack(seed) {
    seed = seed >>> 0;
    const pts = ridgeCtrl(seed);
    const samples = densifyPath(pts, 8, false);
    const sAcc = [0];
    let i;
    for (i = 0; i < samples.length - 1; i++) sAcc.push(sAcc[i] + dist(samples[i], samples[i + 1]));
    const len = sAcc[sAcc.length - 1] || pathLen(samples, false);
    const name = RUN_NAMES[seed % RUN_NAMES.length];
    return {
      id: "ridge-" + seed.toString(16),
      name: name,
      theme: "endless",
      lore: "Four-lane start-to-finish. Light traffic. Right Shift boosts and fires the guns while the bar lasts. Wrecks refill boost and score.",
      width: TRACK_HALF,
      laneW: LANE_W,
      lanes: TRACK_LANES,
      laps: 1,
      pts: pts,
      samples: samples,
      len: len,
      closed: false,
      kind: "ridge",
      sectors: [0.22, 0.48, 0.74],
      seed: seed,
      sAcc: sAcc
    };
  }

  function poseAtS(track, s, lat) {
    const samples = track.samples;
    const acc = track.sAcc;
    if (!samples || !acc || samples.length < 2) return { x: 0, y: 0, h: 0, s: 0 };
    const total = acc[acc.length - 1] || 1;
    let t = track.closed !== false ? ((s % total) + total) % total : clamp(s, 0, total - 0.02);
    let lo = 0, hi = acc.length - 1, mid;
    while (lo < hi - 1) {
      mid = (lo + hi) >> 1;
      if (acc[mid] <= t) lo = mid;
      else hi = mid;
    }
    const a = samples[lo];
    const b = samples[Math.min(samples.length - 1, lo + 1)];
    const span = (acc[lo + 1] - acc[lo]) || 1;
    const u = clamp((t - acc[lo]) / span, 0, 1);
    const h = Math.atan2(b.y - a.y, b.x - a.x);
    const px = -Math.sin(h), py = Math.cos(h);
    const lat0 = lat || 0;
    return {
      x: a.x + (b.x - a.x) * u + px * lat0,
      y: a.y + (b.y - a.y) * u + py * lat0,
      h: h,
      s: t
    };
  }
  function laneLat(lane) {
    return (lane - (TRACK_LANES - 1) * 0.5) * LANE_W;
  }
  function spawnTraffic(track) {
    const rng = mulberry((track.seed || 1) ^ 0x91c3e);
    const cars = [];
    const cols = [0xb45309, 0x1d4ed8, 0x0f766e, 0x7c3aed, 0xb91c1c, 0x365314, 0x0e7490, 0x854d0e];
    let s = 28 + rng() * 12;
    let i = 0;
    let nTractor = 0;
    while (s < track.len - 90 && i < 64) {
      const pack = rng() < 0.28 ? 2 : 1;
      let p, lane, pose, along, roll, kind, spec;
      for (p = 0; p < pack && i < 64; p++) {
        lane = (rng() * TRACK_LANES) | 0;
        if (i < 2) lane = i === 0 ? 2 : 0;
        along = s + p * (8 + rng() * 6);
        pose = poseAtS(track, along, laneLat(lane));
        roll = rng();
        if (s > 900 && nTractor < 4 && roll < 0.055) {
          kind = "tractor";
          nTractor += 1;
          spec = { speed: 6.5 + rng() * 3.2, hp: 12, hitW: 1.22, hitL: 2.35, ptsMul: 4, boostMul: 4, color: 0x65a30d };
        } else if (roll < 0.2) {
          kind = "hauler";
          spec = { speed: 11 + rng() * 10, hp: 3.2, hitW: 1.12, hitL: 2.55, ptsMul: 1.5, boostMul: 1.2, color: cols[i % cols.length] };
        } else if (roll < 0.42) {
          kind = "van";
          spec = { speed: 13 + rng() * 14, hp: 1.8, hitW: 1.02, hitL: 2.2, ptsMul: 1.2, boostMul: 1, color: cols[(i + 3) % cols.length] };
        } else {
          kind = "sedan";
          spec = { speed: 15 + rng() * 22, hp: 1, hitW: 0.92, hitL: 2.05, ptsMul: 1, boostMul: 1, color: cols[i % cols.length] };
        }
        cars.push({
          id: i,
          kind: kind,
          s: along,
          lane: lane,
          speed: spec.speed,
          hp: spec.hp,
          maxHp: spec.hp,
          hitW: spec.hitW,
          hitL: spec.hitL,
          ptsMul: spec.ptsMul,
          boostMul: spec.boostMul,
          alive: true,
          wreck: 0,
          hitT: 0,
          x: pose.x,
          y: pose.y,
          h: pose.h,
          color: spec.color
        });
        i += 1;
      }
      s += s < 420 ? (36 + rng() * 28) : s < 1600 ? (70 + rng() * 50) : (130 + rng() * 90);
    }
    return cars;
  }
  function resetArcade() {
    G.traffic = [];
    G.gunOn = false;
    G.gunCool = 0;
    G.gunKind = (G.craft && G.craft.gun && G.craft.gun.kind) || "mg";
    G.tracers = [];
    G.gunHits = [];
    G.score = 0;
    G.combo = 0;
    G.mult = 0;
    G.comboT = 0;
    G.kills = 0;
    G.bestCombo = 1;
    G.multPulse = 0;
    G.pops = [];
  }
  function arcadePop(text, kind) {
    const host = $("arcPops");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "arc-pop" + (kind ? " " + kind : "");
    el.textContent = text;
    host.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, kind === "vo" ? 1400 : 780);
  }
  const PLAYER_HIT_W = 0.86;
  const PLAYER_HIT_L = 1.92;
  function trafficCrash(c, dx, dy) {
    const fx = Math.cos(c.h || 0), fy = Math.sin(c.h || 0);
    const along = Math.abs(dx * fx + dy * fy);
    const perp = Math.abs(dx * -fy + dy * fx);
    return along < (c.hitL || 2.05) + PLAYER_HIT_L && perp < (c.hitW || 0.92) + PLAYER_HIT_W;
  }
  function wreckTraffic(car) {
    if (!car || !car.alive) return;
    car.alive = false;
    car.wreck = 1;
    car.hp = 0;
    G.kills += 1;
    G.combo += 1;
    G.mult = G.combo;
    if (G.combo > G.bestCombo) G.bestCombo = G.combo;
    const mul = car.ptsMul || 1;
    const bmul = car.boostMul || 1;
    const pts = Math.round(100 * G.mult * mul);
    G.score += pts;
    G.car.boost = Math.min((G.craft && G.craft.boostTank) || 1, (G.car.boost || 0) + 0.11 * bmul);
    G.multPulse = 1;
    arcadePop("+" + pts, "pts");
    if (car.kind === "tractor") arcadePop("TRACTOR  x4", "mult");
    arcadePop("x" + G.combo + "  +" + (G.combo * COMBO_MPH) + " MPH", "mult");
    const call = comboCallout(G.combo, G.kills);
    if (call) {
      arcadePop(call.label, "vo");
      if (window.HavenSfx && HavenSfx.announce) HavenSfx.announce(call.id);
    }
    log("Wreck · +" + pts + " · x" + G.combo + (call ? " · " + call.label : "") + " · vmax +" + (G.combo * COMBO_MPH) + " mph");
    const el = $("arcMult");
    if (el) {
      el.classList.remove("pop");
      void el.offsetWidth;
      el.classList.add("pop");
    }
    const sc = $("arcScore");
    if (sc) {
      sc.classList.remove("pop");
      void sc.offsetWidth;
      sc.classList.add("pop");
    }
  }
  function stepTraffic(dt) {
    const tr = G.track;
    if (!tr || tr.kind !== "ridge" || !G.traffic) return;
    const cars = G.traffic;
    const px = G.car.x, py = G.car.y;
    let i, c, pose, dx, dy;
    for (i = 0; i < cars.length; i++) {
      c = cars[i];
      if (c.alive) {
        c.s += c.speed * dt;
        if (c.s > tr.len - 40) c.s = tr.len * 0.08 + (i * 17) % 400;
        pose = poseAtS(tr, c.s, laneLat(c.lane));
        c.x = pose.x; c.y = pose.y; c.h = pose.h;
        dx = c.x - px; dy = c.y - py;
        c.hitT = Math.max(0, (c.hitT || 0) - dt);
        if (trafficCrash(c, dx, dy) && G.phase === "race" && c.hitT <= 0) {
          G.car.speed *= 0.62;
          G.car.x -= Math.cos(G.car.vh) * 0.55;
          G.car.y -= Math.sin(G.car.vh) * 0.55;
          G.sparks = 1;
          c.s += 6;
          c.hitT = 0.5;
          breakCombo("HIT");
        }
      } else if (c.wreck > 0) {
        c.wreck = Math.max(0, c.wreck - dt * 0.35);
        c.h += dt * 1.8;
      }
    }
  }
  function comboCallout(n, kills) {
    if (kills === 1) return { id: "first-blood", label: "FIRST BLOOD" };
    if (n === 2) return { id: "double-kill", label: "DOUBLE KILL" };
    if (n === 3) return { id: "multi-kill", label: "MULTI KILL" };
    if (n === 4) return { id: "mega-kill", label: "MEGA KILL" };
    if (n === 5) return { id: "ultra-kill", label: "ULTRA KILL" };
    if (n === 6) return { id: "monster-kill", label: "MONSTER KILL" };
    if (n === 7) return { id: "ludicrous-kill", label: "LUDICROUS KILL" };
    if (n === 8) return { id: "killing-spree", label: "KILLING SPREE" };
    if (n === 9) return { id: "rampage", label: "RAMPAGE" };
    if (n === 10) return { id: "dominating", label: "DOMINATING" };
    if (n === 12) return { id: "unstoppable", label: "UNSTOPPABLE" };
    if (n === 15) return { id: "godlike", label: "GODLIKE" };
    if (n === 18) return { id: "wicked-sick", label: "WICKED SICK" };
    if (n >= 20 && n % 5 === 0) return { id: "beyond-godlike", label: "BEYOND GODLIKE" };
    return null;
  }
  function breakCombo(why) {
    if ((G.combo || 0) <= 0) return;
    if (G.combo >= 3 && window.HavenSfx && HavenSfx.announce) HavenSfx.announce("shut-down");
    arcadePop("COMBO BREAK", "break");
    log("Combo break · " + why + " · was x" + G.combo);
    G.combo = 0;
    G.mult = 0;
    G.comboT = 0;
    const el = $("arcMult");
    if (el) {
      el.classList.remove("pop");
      el.classList.remove("hot");
    }
  }
  function stepGuns(dt) {
    G.gunOn = false;
    G.tracers = [];
    G.gunHits = [];
    const tr = G.track;
    if (!tr || tr.kind !== "ridge" || G.phase !== "race") return;
    if (G.multPulse > 0) G.multPulse = Math.max(0, G.multPulse - dt * 3);
    const car = G.car;
    if (!car) return;
    const boostOn = !!car.boostOn || (!!G.keys.ShiftRight && car.boost > 0.04 && !G.keys.ShiftLeft);
    if (!boostOn) return;
    const g = activeGun();
    G.gunOn = true;
    G.gunKind = g.kind || "mg";
    G.gunCool -= dt;
    const fx = Math.cos(car.h), fy = Math.sin(car.h);
    const rx = -fy, ry = fx;
    const nose = g.kind === "cannon" ? 2.55 : (g.kind === "needle" ? 1.95 : 2.3);
    const ox = car.x + fx * nose, oy = car.y + fy * nose;
    const range = g.range || 52;
    const cone = g.kind === "cannon" ? 3.4 : (g.kind === "rail" ? 2.15 : 2.5);
    const hits = [];
    let i, c, dx, dy, along, perp;
    for (i = 0; i < (G.traffic || []).length; i++) {
      c = G.traffic[i];
      if (!c.alive) continue;
      dx = c.x - ox; dy = c.y - oy;
      along = dx * fx + dy * fy;
      perp = Math.abs(dx * rx + dy * ry);
      if (along > 2.2 && along < range && perp < (c.kind === "tractor" ? cone + 0.7 : cone) + along * 0.03) {
        hits.push({ car: c, along: along, perp: perp });
      }
    }
    hits.sort(function (a, b) { return a.along - b.along; });
    const pierce = Math.max(1, g.pierce || 1);
    const dmg = gunDps() * dt;
    let marked = 0;
    for (i = 0; i < hits.length && marked < pierce; i++) {
      c = hits[i].car;
      c.hp -= dmg;
      G.gunHits.push({ x: c.x, y: c.y, kind: g.kind, along: hits[i].along });
      marked += 1;
      if (c.hp <= 0) wreckTraffic(c);
    }
    if (G.gunCool <= 0) {
      G.gunCool = g.rate || 0.052;
      const nBar = g.barrels || 2;
      const reach = hits.length ? hits[0].along : range * 0.72;
      const spread = g.spread || 1;
      const col = g.color || "#ffe08a";
      for (i = 0; i < nBar; i++) {
        const t = nBar === 1 ? 0 : (i / (nBar - 1)) * 2 - 1;
        const jitter = (Math.random() - 0.5) * spread * (hits.length ? 0.25 : 1);
        const lat = rx * (t * 0.42 + jitter * 0.18) ;
        const sx = ox + lat, sy = oy + ry * (t * 0.42 + jitter * 0.18);
        const wob = hits.length ? 0 : (Math.random() - 0.5) * spread;
        G.tracers.push({
          x: sx, y: sy,
          x2: sx + fx * reach + rx * wob,
          y2: sy + fy * reach + ry * wob,
          kind: g.kind,
          color: col,
          width: g.width || 0.07
        });
      }
    }
  }

  function randomTrack(seed) {
    return makeRidgeTrack(seed);
  }

  function defaultSave() {
    return {
      name: "", craft: "apex", driver: "mira", ghosts: {}, rounds: [], options: defaultOptions(),
      arcade: { bestScore: 0, bestCombo: 0, runs: [] },
      custom: { laps: 12, seed: "" }
    };
  }
  function loadSave() {
    try {
      const s = Object.assign(defaultSave(), JSON.parse(localStorage.getItem(SAVE_KEY) || "{}"));
      s.options = Object.assign(defaultOptions(), s.options || {});
      s.arcade = Object.assign({ bestScore: 0, bestCombo: 0, runs: [] }, s.arcade || {});
      s.custom = Object.assign({ laps: 12, seed: "" }, s.custom || {});
      if (!Array.isArray(s.arcade.runs)) s.arcade.runs = [];
      if (!CRAFTS.some(function (c) { return c.id === s.craft; })) s.craft = "apex";
      if (!DRIVERS.some(function (d) { return d.id === s.driver; })) s.driver = "mira";
      return s;
    } catch (e) { return defaultSave(); }
  }
  function writeSave(s) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* private */ }
  }

  const G = {
    save: loadSave(),
    mode: "menu",
    track: null,
    craft: CRAFTS[0],
    phase: "idle",
    car: { x: 0, y: 0, h: 0, vh: 0, speed: 0, steer: 0, boost: 1, gear: 1, rpm: 900, thr: 0, brk: 0, shiftT: 0, wheelSlip: 0 },
    ai: null,
    tree: { phase: "off" },
    keys: {},
    lap: 0,
    laps: 3,
    t0: 0,
    lastS: 0,
    gates: [false, false, false],
    splits: [],
    ghost: null,
    rec: [],
    sparks: 0,
    log: [],
    bestMs: null,
    lastLap: null,
    bestLap: null,
    lapStartMs: 0,
    lapTimes: [],
    traffic: [],
    gunOn: false,
    gunCool: 0,
    gunKind: "mg",
    gunHits: [],
    tracers: [],
    score: 0,
    combo: 0,
    mult: 1,
    comboT: 0,
    kills: 0,
    bestCombo: 1,
    hudSpd: 0,
    hudRpm: 800,
    _sheet: "",
    field: "solo",
    racers: [],
    camView2: 0,
    pendingTrack: null,
    _firstFinish: 0
  };
  const $ = function (id) { return document.getElementById(id); };
  const canvas = $("circuit");
  const use3d = !!(window.Rally3D && window.THREE && window.Rally3D.init(canvas));
  const ctx = use3d ? null : canvas.getContext("2d");

  /* ---- donation gate: hold the reminder while a heat is on the board ----
     games/lygo-gate.js is deferred, so window.LYGO_GATE may not exist yet —
     gateHold retries. gateBusy is the source of truth for "in play": it is set
     on the way in and read on the way out, so the order of a teardown cannot
     strand the hold (every exit — finish, restart, quit, game over — calls
     gateLeavePlay). */
  let gateBusy = false;
  function gate() { return window.LYGO_GATE || null; }
  function gateHold(on, relaxMs) {
    let tries = 0;
    const apply = () => {
      const g = gate();
      if (!g || !g.hold) { if (tries++ < 24) setTimeout(apply, 250); return; }
      g.hold(on);
      if (!on && relaxMs) g.suppress(relaxMs);
    };
    apply();
  }
  function gateEnterPlay() { gateBusy = true; gateHold(true); }
  function gateLeavePlay() {
    if (!gateBusy) return;
    gateBusy = false;
    gateHold(false, 2 * 60 * 1000);   // back at a menu/results: quiet for two minutes
  }

  function log(t) {
    G.log.unshift(t);
    if (G.log.length > 24) G.log.length = 24;
    const el = $("log");
    if (el) el.innerHTML = G.log.slice(0, 10).map(function (x) {
      return "<div>" + String(x).replace(/</g, "") + "</div>";
    }).join("");
  }

  function overlayOpen() {
    const ov = $("overlay");
    return !!(ov && !ov.classList.contains("hidden"));
  }
  function hideOverlay() {
    const ov = $("overlay");
    if (!ov) return;
    ov.classList.add("hidden");
    ov.classList.remove("studio");
    G._sheet = "";
    if (window.HavenCar) HavenCar.closeStudio();
  }
  function showSheet(html, studio, sheetClass) {
    const ov = $("overlay");
    ov.classList.remove("hidden");
    ov.classList.toggle("studio", !!studio);
    ov.innerHTML = studio ? html : "<div class='sheet" + (sheetClass ? " " + sheetClass : "") + "'>" + html + "</div>";
    G._sheet = sheetClass === "sheet-opts" ? "options" : (studio ? "menu" : "");
  }
  function donateHtml() {
    return "<div class='donate-row'>" +
      "<a class='donate-paypal' href='https://www.paypal.com/paypalme/ExcavationPro' target='_blank' rel='noopener noreferrer'>PayPal.me/ExcavationPro</a>" +
      "<a class='donate-patreon' href='https://www.patreon.com/Excavationpro/posts/chatagent-ca-api-170485961' target='_blank' rel='noopener noreferrer'>Patreon</a></div>";
  }

  function paintPilot() {
    const d = driverOf(G.save && G.save.driver);
    const c = G.craft || liveCraft();
    if ($("pilotImg")) {
      $("pilotImg").src = d.src;
      $("pilotImg").alt = d.name;
    }
    if ($("pilotName")) $("pilotName").textContent = d.name;
    if ($("pilotTag")) $("pilotTag").textContent = d.tag;
    if ($("pilotCraft")) $("pilotCraft").textContent = c.name + " · " + d.bonus;
  }

  function kickChaseCam() {
    if (!(use3d && window.Rally3D)) return;
    if (Rally3D.resize) Rally3D.resize();
    if (Rally3D.setCam) Rally3D.setCam({ snap: true });
  }

  function spawnOnGrid() {
    gateEnterPlay();
    if (G.track && G.track.kind === "drag") {
      G.field = "solo";
      G.racers = [];
      if (use3d && window.Rally3D && Rally3D.setSplit) Rally3D.setSplit(false);
      spawnDrag(false);
      return;
    }
    const tr = G.track;
    if (tr.kind === "ridge") G.field = "solo";
    const p1craft = liveCraft(G.save.craft, G.save.driver);
    const p1ix = Math.max(0, CRAFTS.findIndex(function (c) { return c.id === p1craft.id; }));
    const p2craft = craftOf(CRAFTS[(p1ix + 1) % CRAFTS.length].id);
    const wantSplit = isSplit() && tr.kind !== "ridge";
    const wantBots = (G.field === "bots" || G.field === "splitbots") && tr.kind !== "ridge";
    G.racers = [];
    G.racers.push(makeRacer({
      id: "p1", name: (G.save.name || "P1").slice(0, 16), kind: "human", slot: 0,
      craft: p1craft, lane: wantSplit || wantBots ? 0 : 1, stagger: 0, seed: 11
    }));
    if (wantSplit) {
      G.racers.push(makeRacer({
        id: "p2", name: "P2", kind: "human", slot: 1,
        craft: p2craft, lane: 1, stagger: 0, seed: 23
      }));
    }
    if (wantBots) {
      const nBot = wantSplit ? 2 : 3;
      for (let i = 0; i < nBot; i++) {
        const bot = BOT_ROSTER[i];
        const lane = wantSplit ? 2 + i : 1 + i;
        const botCraft = liveCraft(bot.body, bot.driver);
        botCraft.color = bot.color;
        G.racers.push(makeRacer({
          id: "bot" + i, name: bot.name, kind: "bot", slot: 2 + i,
          craft: botCraft,
          lane: lane, stagger: 1 + (i % 2), skill: bot.skill, seed: 40 + i * 17,
          laneBias: (i % 2 ? 0.55 : -0.4)
        }));
      }
    }
    syncP1();
    G.ai = null;
    G.aiCraft = null;
    G._firstFinish = 0;
    if (use3d && window.Rally3D && Rally3D.setSplit) Rally3D.setSplit(wantSplit);
    if ($("raceHud")) $("raceHud").classList.toggle("hidden", wantSplit);
    if ($("splitHud")) $("splitHud").classList.toggle("hidden", !wantSplit);
    if ($("splitBar")) $("splitBar").classList.toggle("hidden", !wantSplit);
    G.lap = 0;
    /* Seed the lap origin from where the car actually sits on the grid. lastS = 0 read
       as "just past the line", so the first frame stamped every sector and the next
       crossing counted a phantom lap 1 (and wrote a ghost a lap short). */
    G.lastS = (G.car && G.car.s0 != null) ? G.car.s0
      : ((G.car && tr.samples) ? project(G.car, tr.samples, null, tr.closed !== false).s : 0);
    G.gates = (tr.sectors || [0, 0, 0]).map(function () { return false; });
    const flashOff = $("countFlash");
    if (flashOff) flashOff.classList.add("hidden");
    G.splits = [];
    G.rec = [];
    G.lastLap = null;
    G.lapStartMs = 0;
    G.lapTimes = [];
    G.lapSegs = [];
    G.segAnchor = 0;
    G.segFracs = segFracsFor(tr);
    const rec = tr.kind === "ridge" ? null : loadBest();
    G.bestLap = rec ? rec.ms : null;
    G.bestSegs = rec && rec.segs && rec.segs.length ? rec.segs.slice() : null;
    G.recordMs = rec ? rec.ms : null;
    G.staleGhost = null;
    G.hudSpd = 0;
    G.hudRpm = 800;
    G._ridgeDone = false;
    resetArcade();
    if (tr.kind === "ridge") {
      G.traffic = spawnTraffic(tr);
      const nTr = G.traffic.filter(function (c) { return c.kind === "tractor"; }).length;
      log("Traffic · " + G.traffic.length + " · " + nTr + " tractor" + (nTr === 1 ? "" : "s"));
    }
    if ($("arcadeHud")) $("arcadeHud").classList.toggle("hidden", tr.kind !== "ridge");
    G.phase = opt("countdown") ? "count" : "race";
    G.countN = 3;
    G.countT = performance.now();
    G.t0 = opt("countdown") ? 0 : performance.now();
    G._last = 0;
    applyOptions();
    const gk = tr.id + "|" + G.craft.id;
    G.ghost = (!isFieldRace() && G.save.ghosts && G.save.ghosts[gk]) || null;
    if (G.ghost && !ghostCoversHeat(G.ghost, tr.laps, tr.len)) {
      /* Pre-fix ghosts are ~one lap short. Drop and forget them so "beat the ghost"
         stays winnable, and record the old time in the log. */
      G.staleGhost = G.ghost.ms;
      delete G.save.ghosts[gk];
      G.ghost = null;
      writeSave(G.save);
      log("Dropped a stale ghost · " + fmt(G.staleGhost) + " · written before the lap fix.");
    }
    G.bestMs = G.ghost && G.ghost.ms;
    paintPilot();
    showDragUi(false);
    if (use3d && window.Rally3D) Rally3D.setTrack(tr);
    G._camSnap = 8;
    const pads = livePads();
    log(tr.name + " · " + (isFieldRace()
      ? (G.racers.map(function (r) { return r.name; }).join(" / ") + (pads.length ? " · " + pads.length + " pad" : ""))
      : G.craft.name) + " · " + (tr.kind === "ridge" ? Math.round(tr.len) + " yd to FINISH" : tr.laps + " laps"));
    if ($("hint")) {
      $("hint").textContent = wantSplit
        ? (opt("manual")
          ? "P1 WASD · Q/E shift · P2 arrows · O/P shift · pad D-pad shift"
          : "P1 WASD · P2 arrows (Ctrl drift, Enter boost) · pad: stick + RT/LT, A gas, B e-brake, RB boost · V P2 cam")
        : (opt("manual")
          ? "W throttle · Space brake · ↑↓ shift · L-Shift drift · R-Shift boost"
          : "W throttle · Space brake/reverse · L-Shift drift · R-Shift boost/guns · F drag tree");
    }
    $("app").classList.remove("hidden");
    hideOverlay();
    canvas.focus();
    kickChaseCam();
    draw(performance.now());
    requestAnimationFrame(function () {
      kickChaseCam();
      if (G.mode === "race") draw(performance.now());
    });
  }

  function startHeat(track) {
    G.mode = "race";
    G.track = track;
    G.laps = track.laps;
    G.craft = liveCraft(G.save.craft, G.save.driver);
    spawnOnGrid();
  }
  function pickField(track) {
    G.pendingTrack = track;
    showSheet(
      "<p class='kicker'>Grid</p><h2>" + track.name + "</h2>" +
      "<p class='lore'>" + track.laps + " laps. How do you want this heat?</p>" +
      "<div class='mode-grid'>" +
        "<button type='button' class='mode-card' data-field='solo'><b>Solo · ghost</b><span>Time trial. Beat your ghost for this chassis.</span></button>" +
        "<button type='button' class='mode-card' data-field='split'><b>2P Split</b><span>Left P1 WASD. Right P2 arrows or a gamepad.</span></button>" +
        "<button type='button' class='mode-card' data-field='bots'><b>vs AI</b><span>Reed, Mira, and Kai on stacked chassis. They brake for the ribbon and dump boost on the straight.</span></button>" +
        "<button type='button' class='mode-card' data-field='splitbots'><b>2P + AI</b><span>Split screen with two of those bots filling the grid.</span></button>" +
      "</div>" +
      "<p class='lore'>Pad: left stick steer, RT throttle, LT brake, A throttle, B / LB e-brake, RB / Y boost. One pad rides with P2; two pads are P1 then P2.</p>" +
      "<div class='modes'><button type='button' class='btn' data-go='title'>Back</button></div>"
    );
    G._sheet = "field";
  }

  function customMenu() {
    if (!G.save.custom) G.save.custom = { laps: 12, seed: "" };
    let seed = parseSeed(G.save.custom.seed);
    let laps = clampLaps(G.save.custom.laps);
    let track = makeCustomCircuit(seed, laps);
    function paint() {
      const mi = (track.len / 1760);
      if ($("custLapsVal")) $("custLapsVal").textContent = String(track.laps);
      if ($("custSeed")) $("custSeed").value = (track.seed >>> 0).toString(16).padStart(8, "0");
      if ($("custStat")) {
        $("custStat").innerHTML = "<b>" + track.name + "</b> · seed <code>" +
          (track.seed >>> 0).toString(16).padStart(8, "0") + "</code><br>" +
          Math.round(track.len) + " yd / lap · " + mi.toFixed(2) + " mi · " +
          track.laps + " laps · ~" + Math.round(mi * track.laps) + " mi heat · " +
          (track.theme === "pine-coil" ? "parkland" : track.theme === "coral-coast" ? "coast" : "night city");
      }
    }
    function readForm() {
      laps = clampLaps($("custLaps") && $("custLaps").value);
      seed = parseSeed($("custSeed") && $("custSeed").value);
      track = makeCustomCircuit(seed, laps);
      G.save.custom = { laps: laps, seed: (seed >>> 0).toString(16) };
      writeSave(G.save);
      G.pendingTrack = track;
      paint();
    }
    showSheet(
      "<p class='kicker'>Custom race</p><h2>Seed the ribbon</h2>" +
      "<p class='lore'>Pick laps. Roll a seed (or type one). The lattice builds a closed four-lane circuit from that number — same seed is the same track.</p>" +
      "<label>Laps <b id='custLapsVal'>" + laps + "</b></label>" +
      "<input id='custLaps' class='cust-range' type='range' min='1' max='60' step='1' value='" + laps + "'>" +
      "<label style='margin-top:.65rem;display:block'>Seed</label>" +
      "<input class='name' id='custSeed' maxlength='16' spellcheck='false' value='" + (seed >>> 0).toString(16).padStart(8, "0") + "'>" +
      "<p class='lore' id='custStat' style='margin-top:.55rem'></p>" +
      "<div class='modes'>" +
        "<button type='button' class='btn' id='custRoll'>Roll seed</button>" +
        "<button type='button' class='btn gold' id='custGo'>Choose grid</button>" +
      "</div>" +
      "<div class='modes'><button type='button' class='btn' data-go='title'>Back</button></div>"
    );
    G._sheet = "custom";
    G.pendingTrack = track;
    paint();
    if ($("custLaps")) $("custLaps").oninput = readForm;
    if ($("custSeed")) $("custSeed").onchange = readForm;
    if ($("custRoll")) {
      $("custRoll").onclick = function (ev) {
        if (ev) ev.stopPropagation();
        if ($("custSeed")) $("custSeed").value = "";
        G.save.custom.seed = "";
        readForm();
      };
    }
    if ($("custGo")) {
      $("custGo").onclick = function (ev) {
        if (ev) ev.stopPropagation();
        readForm();
        if (track) pickField(track);
      };
    }
  }

  function showDragUi(on) {
    if ($("dragTree")) $("dragTree").classList.toggle("hidden", !on);
    if ($("dragHud")) $("dragHud").classList.toggle("hidden", !on);
  }

  function beginTree(now) {
    const foulAi = Math.random() < 0.055;
    return {
      t0: now,
      phase: "ready",
      foul: false,
      rt: null,
      launched: false,
      aiFoul: foulAi,
      aiRt: foulAi ? -(0.05 + Math.random() * 0.14) : (0.018 + Math.random() * 0.042),
      aiLeft: false,
      aiGoAt: 0,
      greenAt: 0,
      playerDone: false,
      aiDone: false,
      playerMs: null,
      aiMs: null,
      trapMph: null,
      aiMph: null,
      ft60: null
    };
  }

  function spawnDrag(runTree) {
    gateEnterPlay();
    const tr = G.track;
    const lane = tr.lane;
    const x0 = runTree ? tr.startX : tr.startX - 22;
    G.craft = liveCraft(G.save.craft, G.save.driver);
    G.car = { x: x0, y: -lane, h: 0, vh: 0, speed: 0, steer: 0, boost: (G.craft && G.craft.boostTank) || 1, gear: 1, rpm: 900, thr: 0, brk: 0, shiftT: 0, wheelSlip: 0 };
    const opp = craftNorm(CRAFTS[(Math.random() * CRAFTS.length) | 0]);
    G.aiCraft = opp;
    G.ai = blankCar({ x: x0, y: lane, h: 0 }, opp.boostTank);
    G.ai.y = lane;
    G.ai.h = 0;
    G.ai.vh = 0;
    G.ai.skill = 0.9 + Math.random() * 0.1;
    G.ai.name = "Lane 2";
    G.ai.shiftPlan = dragAiShiftPlan(opp);
    G.ai._over = 0;
    G.lap = 0;
    G.lastS = x0;
    G.gates = [];
    G.splits = [];
    G.rec = [];
    G.ghost = null;
    G.bestMs = null;
    (G.save.rounds || []).forEach(function (r) {
      if (r.trackId === tr.id && r.ms && !r.foul && (G.bestMs == null || r.ms < G.bestMs)) G.bestMs = r.ms;
    });
    G.lastLap = null;
    G.bestLap = G.bestMs;
    G.lapStartMs = 0;
    G.hudSpd = 0;
    G.hudRpm = 800;
    G._last = 0;
    G.t0 = 0;
    G.sparks = 0;
    applyOptions();
    paintPilot();
    showDragUi(true);
    if (runTree) {
      G.phase = "tree";
      G.tree = beginTree(performance.now());
      log("Staged · Lane 2 " + opp.name + " · wait for the tree · " + tr.feet + " ft");
    } else {
      G.phase = "drag_idle";
      G.tree = { phase: "off", foul: false };
      log(tr.name + " · roll to the tree · F stages and runs the lights");
    }
    if (use3d && window.Rally3D) Rally3D.setTrack(tr);
    G._camSnap = 8;
    $("app").classList.remove("hidden");
    hideOverlay();
    canvas.focus();
    kickChaseCam();
    draw(performance.now());
    requestAnimationFrame(function () {
      kickChaseCam();
      if (G.mode === "race") draw(performance.now());
    });
  }

  function treeLights(st) {
    const p = st && st.phase;
    return {
      pre: p === "pre" || p === "stage" || p === "a1" || p === "a2" || p === "a3" || p === "green" || p === "red",
      stage: p === "stage" || p === "a1" || p === "a2" || p === "a3" || p === "green" || p === "red",
      a1: p === "a1" || p === "a2" || p === "a3" || p === "green" || p === "red",
      a2: p === "a2" || p === "a3" || p === "green" || p === "red",
      a3: p === "a3" || p === "green" || p === "red",
      green: p === "green",
      redL: !!(st && st.foul),
      redR: !!(st && st.aiFoul && (p === "green" || p === "red" || p === "a3" || st.aiLeft))
    };
  }

  function paintTreeDom(st) {
    const el = $("dragTree");
    if (!el) return;
    el.classList.toggle("is-ready", st && st.phase === "ready");
    const L = treeLights(st);
    el.querySelectorAll("[data-bulb]").forEach(function (b) {
      const id = b.getAttribute("data-bulb");
      let on = false;
      if (id === "pre") on = L.pre;
      if (id === "stage") on = L.stage;
      if (id === "a1") on = L.a1;
      if (id === "a2") on = L.a2;
      if (id === "a3") on = L.a3;
      if (id === "green") on = L.green;
      if (id === "redL") on = L.redL;
      if (id === "redR") on = L.redR;
      b.classList.toggle("on", on);
    });
  }

  function dragAiShiftPlan(c) {
    const red = (c && c.redline) || 7800;
    const nG = (c && c.gears && c.gears.length) || 6;
    const plan = [];
    let g;
    for (g = 1; g < nG; g++) {
      const roll = Math.random();
      let kind = "ok";
      let rpmMul = 0.92 + (Math.random() - 0.5) * 0.05;
      let hold = 0;
      if (roll < 0.08) {
        kind = "late";
        rpmMul = 1.01 + Math.random() * 0.04;
        hold = 0.12 + Math.random() * 0.22;
      } else if (roll < 0.2) {
        kind = "early";
        rpmMul = 0.74 + Math.random() * 0.09;
      }
      plan[g] = { kind: kind, rpm: red * rpmMul, hold: hold };
    }
    return plan;
  }

  function stepAi(dt, now) {
    const ai = G.ai;
    if (!ai || !G.craft) return;
    const st = G.tree || {};
    const lane = G.track.lane;
    const greenGuess = st.greenAt || ((st.t0 || now) + 4600);
    const leaveAt = greenGuess + (st.aiRt || 0) * 1000;
    const canGo = (G.phase === "race" || G.phase === "tree") && now >= leaveAt;
    if (canGo && !st.aiLeft && G.phase === "tree" && (!st.greenAt || now < st.greenAt)) {
      st.aiFoul = true;
      st.aiLeft = true;
      log("Lane 2 red light.");
    } else if (canGo && !st.aiLeft) {
      st.aiLeft = true;
    }
    const go = canGo && !st.aiDone;
    if (!go) {
      if (!st.aiLeft) ai.speed = 0;
      else ai.x += ai.speed * dt;
      ai.h = 0;
      ai.vh = 0;
      ai.y = lane;
      return;
    }
    const c = G.aiCraft || G.craft;
    const skill = ai.skill || 1;
    const launchedAgo = (now - leaveAt) / 1000;
    const dumpBoost = launchedAgo >= (skill > 0.96 ? 0 : 0.05);
    const boostOn = dumpBoost && ai.boost > 0.04;
    if (boostOn) ai.boost = Math.max(0, ai.boost - dt * 0.42);
    const nG = (c.gears && c.gears.length) || 6;
    const plan = (ai.shiftPlan && ai.shiftPlan[ai.gear]) || null;
    if (plan && ai.gear >= 1 && ai.gear < nG && (ai.shiftT || 0) <= 0) {
      if ((ai.rpm || 0) >= plan.rpm) {
        ai._over = (ai._over || 0) + dt;
        if (ai._over >= (plan.hold || 0)) {
          manualShift(ai, c, 1);
          ai._over = 0;
        }
      } else {
        ai._over = 0;
      }
    }
    stepPowertrain(c, ai, dt, {
      throttle: 1,
      brake: 0,
      ebrake: false,
      boostOn: boostOn,
      onTrack: true,
      fx: false,
      ignoreCombo: true,
      manual: true
    });
    ai.h = 0;
    ai.vh = 0;
    ai.y = lane;
    ai.x += ai.speed * dt;
    ai.boostOn = boostOn;
  }

  function finishDrag() {
    if (G.phase === "done") return;
    G.phase = "done";
    gateLeavePlay();
    const st = G.tree;
    const pMs = st.playerMs;
    const aMs = st.aiMs;
    const win = !st.foul && (st.aiFoul || (pMs != null && (aMs == null || pMs < aMs)));
    if (!Array.isArray(G.save.rounds)) G.save.rounds = [];
    G.save.rounds.unshift({
      name: (G.save.name || "Operator").slice(0, 24),
      craft: G.craft.name,
      track: G.track.name,
      trackId: G.track.id,
      ms: pMs,
      rt: st.rt,
      aiMs: aMs,
      win: win,
      foul: !!st.foul,
      at: Date.now()
    });
    G.save.rounds = G.save.rounds.slice(0, 40);
    writeSave(G.save);
    if (window.ArcadeLedger && pMs) {
      ArcadeLedger.rally({
        name: (G.save.name || "Operator").slice(0, 18),
        event: "drag",
        track: String(G.track.name || "Drag").slice(0, 40),
        trackId: String(G.track.id || "drag").slice(0, 32),
        craft: String(G.craft.name || "Apex Mk I").slice(0, 32),
        ms: Math.round(pMs),
        score: 0,
        kills: 0,
        combo: 1,
        laps: 0,
        field: "solo",
        foul: !!st.foul,
        date: new Date().toISOString().slice(0, 10)
      });
    }
    const title = st.foul ? "Red light" : (win ? "Lane 1 wins" : "Lane 2 wins");
    log(title + " · ET " + fmt(pMs) + " vs " + fmt(aMs));
    showSheet(
      "<p class='kicker'>Drag · " + G.track.feet + " ft</p><h2>" + title + "</h2>" +
      "<p class='lore'>You RT <b>" + (st.rt != null ? (st.rt / 1000).toFixed(3) + "s" : "—") + "</b> · ET <b>" + fmt(pMs) + "</b>" +
      (st.trapMph != null ? " · " + fmtSpeedMph(st.trapMph) : "") + "</p>" +
      "<p class='lore'>Lane 2 <b>" + ((G.aiCraft && G.aiCraft.name) || "AI") + "</b> · RT <b>" +
      (st.aiFoul ? "foul" : (st.aiRt != null ? st.aiRt.toFixed(3) + "s" : "—")) +
      "</b> · ET <b>" + fmt(aMs) + "</b>" +
      (st.aiMph != null ? " · " + fmtSpeedMph(st.aiMph) : "") + "</p>" +
      donateHtml() +
      "<div class='modes'><button class='btn gold' id='again'>Restage (F)</button><button class='btn' id='toMenu'>Menu</button><a class='btn' href='./ledger.html'>Live hall</a></div>"
    );
    $("again").onclick = function () { spawnDrag(true); };
    $("toMenu").onclick = menu;
  }

  function tickDrag(now) {
    if (G.phase === "done") {
      heatHud(now);
      draw(now);
      return;
    }
    const tr = G.track;
    const st = G.tree || { phase: "off" };
    const inp = humanInput(0);
    const throttle = inp.throttle > 0.35;
    if (overlayOpen() && (G.phase === "race" || G.phase === "tree")) {
      if (G._last && G.phase === "race" && G.t0) G.t0 += now - G._last;
      G._last = now;
      heatHud(now);
      draw(now);
      return;
    }
    if (G.phase === "tree") {
      const t = (now - st.t0) / 1000;
      if (t < 2.15) st.phase = "ready";
      else if (t < 2.6) st.phase = "pre";
      else if (t < 3.1) st.phase = "stage";
      else if (t < 3.6) st.phase = "a1";
      else if (t < 4.1) st.phase = "a2";
      else if (t < 4.6) st.phase = "a3";
      else if (st.phase !== "green" && st.phase !== "red") {
        st.phase = st.foul ? "red" : "green";
        st.greenAt = now;
        st.aiGoAt = now + st.aiRt * 1000;
        G.phase = "race";
        G.t0 = now;
        log(st.foul ? "Red-light start." : "Green.");
      }
      const flash = $("countFlash");
      if (flash) {
        if (st.phase === "ready") {
          flash.classList.remove("hidden");
          flash.textContent = "READY";
        } else if (flash.textContent === "READY") flash.classList.add("hidden");
      }
      if (throttle && (st.phase === "a1" || st.phase === "a2" || st.phase === "a3")) {
        st.foul = true;
      }
    }
    const dt = Math.min(0.033, G._last ? (now - G._last) / 1000 : 0.016);
    G._last = now;
    const locked = G.phase === "tree" && !st.foul;
    if (G.phase === "drag_idle" || G.phase === "race" || (G.phase === "tree" && st.foul)) {
      const proj = stepCar(dt);
      if (proj) G.lastS = proj.s;
    } else if (locked) {
      G.car.speed = 0;
      G.car.x = tr.startX;
      G.car.y = -tr.lane;
      G.car.h = 0;
      G.car.vh = 0;
    }
    if (G.phase === "race" && st.greenAt && !st.launched && throttle) {
      st.launched = true;
      st.rt = now - st.greenAt;
    }
    stepAi(dt, now);
    if (G.phase === "race") {
      const px = G.car.x - tr.startX;
      if (st.ft60 == null && px >= 20) st.ft60 = now - G.t0;
      if (!st.playerDone && G.car.x >= tr.finishX) {
        st.playerDone = true;
        st.playerMs = now - G.t0;
        st.trapMph = Math.abs(G.car.speed) * 2.04545;
        log("Trap · " + fmt(st.playerMs) + " · " + fmtSpeedMph(st.trapMph));
      }
      if (G.ai && !st.aiDone && G.ai.x >= tr.finishX) {
        st.aiDone = true;
        st.aiMs = now - G.t0;
        st.aiMph = Math.abs(G.ai.speed) * 2.04545;
        log("Lane 2 trap · " + fmt(st.aiMs));
      }
      if ((st.playerDone && st.aiDone) ||
          ((st.playerDone || st.aiDone) && now - G.t0 > 14000) ||
          (now - G.t0 > 28000)) finishDrag();
    }
    paintTreeDom(st);
    if (use3d && window.Rally3D && Rally3D.setTree) Rally3D.setTree(treeLights(st));
    heatHud(now);
    draw(now);
  }

  function isSplit() {
    return G.field === "split" || G.field === "splitbots";
  }
  function isFieldRace() {
    return G.field && G.field !== "solo";
  }
  function livePads() {
    const raw = navigator.getGamepads ? navigator.getGamepads() : [];
    const out = [];
    for (let i = 0; i < raw.length; i++) if (raw[i]) out.push(raw[i]);
    return out;
  }
  function deadAxis(v) {
    return Math.abs(v) < 0.18 ? 0 : v;
  }
  function btnVal(b) {
    if (!b) return 0;
    if (typeof b === "object") return b.value != null ? b.value : (b.pressed ? 1 : 0);
    return b ? 1 : 0;
  }
  function padInput(pad) {
    if (!pad) return null;
    const ax = pad.axes || [];
    const bt = pad.buttons || [];
    const sx = deadAxis(ax[0] || 0);
    const sy = deadAxis(ax[1] || 0);
    const dL = btnVal(bt[14]);
    const dR = btnVal(bt[15]);
    const dU = btnVal(bt[12]);
    const dD = btnVal(bt[13]);
    const manual = !!opt("manual");
    let steerIn = sx + (dR - dL);
    let throttle = Math.max(btnVal(bt[7]), sy < 0 ? -sy : 0, manual ? 0 : dU);
    let brake = Math.max(btnVal(bt[6]), sy > 0 ? sy : 0, manual ? 0 : dD);
    if (btnVal(bt[0]) > 0.4 && throttle < 0.2 && brake < 0.2) throttle = 1;
    return {
      throttle: clamp(throttle, 0, 1),
      brake: clamp(brake, 0, 1),
      ebrake: btnVal(bt[1]) > 0.4 || btnVal(bt[2]) > 0.4 || btnVal(bt[4]) > 0.4,
      boost: btnVal(bt[5]) > 0.4 || btnVal(bt[3]) > 0.4,
      shiftUp: manual && dU > 0.45,
      shiftDown: manual && dD > 0.45,
      steerIn: clamp(steerIn, -1, 1),
      pad: true
    };
  }
  function humanInput(slot) {
    const k = G.keys;
    const pads = livePads();
    const split = isSplit();
    let pad = null;
    if (split) {
      pad = pads.length >= 2 ? pads[slot] : (slot === 1 ? pads[0] : null);
    } else {
      pad = pads[0] || null;
    }
    const manual = !!opt("manual");
    const p = padInput(pad) || { throttle: 0, brake: 0, ebrake: false, boost: false, steerIn: 0, shiftUp: false, shiftDown: false };
    if (slot === 0) {
      if (!split) {
        if (k.KeyW || (!manual && k.ArrowUp)) p.throttle = 1;
        if (k.KeyS || k.Space || (!manual && k.ArrowDown)) p.brake = 1;
        if (k.KeyA || k.ArrowLeft) p.steerIn -= 1;
        if (k.KeyD || k.ArrowRight) p.steerIn += 1;
      } else {
        if (k.KeyW) p.throttle = 1;
        if (k.KeyS || k.Space) p.brake = 1;
        if (k.KeyA) p.steerIn -= 1;
        if (k.KeyD) p.steerIn += 1;
      }
      if (k.ShiftLeft) p.ebrake = true;
      if (k.ShiftRight) p.boost = true;
      if (manual) {
        if (k.ArrowUp || k.KeyE) p.shiftUp = true;
        if (k.ArrowDown || k.KeyQ) p.shiftDown = true;
      }
    } else {
      if (k.ArrowUp) p.throttle = 1;
      if (k.ArrowDown) p.brake = 1;
      if (k.ArrowLeft) p.steerIn -= 1;
      if (k.ArrowRight) p.steerIn += 1;
      if (k.ControlRight || k.Period || k.KeyK) p.ebrake = true;
      if (k.Enter || k.NumpadEnter || k.Slash || k.KeyL) p.boost = true;
      if (manual) {
        if (k.KeyP || k.BracketRight) p.shiftUp = true;
        if (k.KeyO || k.BracketLeft) p.shiftDown = true;
      }
    }
    p.manual = manual;
    p.steerIn = clamp(p.steerIn, -1, 1);
    if (opt("invertSteer")) p.steerIn *= -1;
    return p;
  }
  function pointAtS(samples, sWant, closed) {
    const segs = closed ? samples.length : Math.max(0, samples.length - 1);
    let total = 0;
    const lens = [];
    for (let i = 0; i < segs; i++) {
      const L = dist(samples[i], samples[(i + 1) % samples.length]);
      lens.push(L);
      total += L;
    }
    if (total < 1) return { x: samples[0].x, y: samples[0].y, hx: 1, hy: 0 };
    let s = closed ? ((sWant % total) + total) % total : clamp(sWant, 0, total);
    let acc = 0;
    for (let i = 0; i < segs; i++) {
      if (acc + lens[i] >= s || i === segs - 1) {
        const t = lens[i] ? (s - acc) / lens[i] : 0;
        const a = samples[i], b = samples[(i + 1) % samples.length];
        const hx = (b.x - a.x) / (lens[i] || 1), hy = (b.y - a.y) / (lens[i] || 1);
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, hx: hx, hy: hy };
      }
      acc += lens[i];
    }
    return { x: samples[0].x, y: samples[0].y, hx: 1, hy: 0 };
  }
  function headingAtS(samples, sWant, closed) {
    const p = pointAtS(samples, sWant, closed);
    return Math.atan2(p.hy, p.hx);
  }
  function kappaWindow(samples, s0, closed, horizon) {
    let maxAbs = 0, signed = 0, distTo = horizon, d, k, h0, h1, span;
    span = 18;
    for (d = 6; d <= horizon; d += 8) {
      h0 = headingAtS(samples, s0 + d, closed);
      h1 = headingAtS(samples, s0 + d + span, closed);
      k = wrapDelta(h1 - h0, Math.PI * 2) / span;
      if (Math.abs(k) > maxAbs) {
        maxAbs = Math.abs(k);
        signed = k;
        distTo = d;
      }
    }
    return { k: maxAbs, signed: signed, distTo: distTo };
  }
  function botCornerSpeed(c, kappa, pace) {
    const k = Math.max(kappa, 0.00035);
    const rYd = 1 / k;
    const grip = (c.mu || 1.32) * weatherGrip(c) * 0.82;
    const vMs = Math.sqrt(Math.max(4, grip * G0 * rYd * YD));
    return clamp((vMs / YD) * pace, 11, topSpeedYd(c) * 1.02);
  }
  function botAhead(racer) {
    const list = G.racers || [];
    const mine = raceAlong(racer);
    let best = null, gap = 40, i, o, g;
    for (i = 0; i < list.length; i++) {
      o = list[i];
      if (o === racer || o.done) continue;
      g = raceAlong(o) - mine;
      if (g > 0.8 && g < gap) {
        gap = g;
        best = o;
      }
    }
    return best ? { racer: best, gap: gap } : null;
  }
  function botInput(racer) {
    const tr = G.track;
    const car = racer && racer.car;
    if (!tr || !tr.samples || !car) {
      return { throttle: 0, brake: 0, ebrake: false, boost: false, steerIn: 0 };
    }
    const c = racer.craft || craftOf("apex");
    const closed = tr.closed !== false;
    const proj = project(car, tr.samples, racer.lastS, closed);
    const sk = clamp(racer.skill || 0.9, 0.55, 1.12);
    const pace = 0.86 + 0.12 * sk;
    const spd = Math.abs(car.speed);
    const hw = tr.width || TRACK_HALF;
    const look = 14 + spd * (0.48 + 0.22 * sk);
    const horizon = 28 + spd * 1.15;
    const win = kappaWindow(tr.samples, proj.s, closed, horizon);
    const vTgt = botCornerSpeed(c, win.k, pace);
    const apex = clamp(win.signed * 22, -1, 1);
    let targetLat = -apex * hw * (0.22 + 0.38 * sk);
    if (win.distTo < 18 + spd * 0.2) targetLat = apex * hw * (0.28 + 0.34 * sk);
    else if (win.distTo > 40 + spd * 0.35) targetLat *= 0.35;
    targetLat += (racer.laneBias || 0);
    const block = botAhead(racer);
    if (block && block.gap < 16) {
      const their = project(block.racer.car, tr.samples, block.racer.lastS, closed);
      if (Math.abs(their.lat - targetLat) < 2.4) {
        const roomL = hw - proj.lat;
        const roomR = hw + proj.lat;
        targetLat += (roomL > roomR ? 1 : -1) * LANE_W * 0.92;
      }
    }
    targetLat = clamp(targetLat, -hw * 0.72, hw * 0.72);
    const off = Math.abs(proj.lat) > hw * 0.92;
    if (off) targetLat = 0;
    const tgt = pointAtS(tr.samples, proj.s + look, closed);
    const nx = -tgt.hy, ny = tgt.hx;
    const aimX = tgt.x + nx * targetLat;
    const aimY = tgt.y + ny * targetLat;
    const desired = Math.atan2(aimY - car.y, aimX - car.x);
    let err = wrapDelta(desired - car.h, Math.PI * 2);
    err += (proj.lat - targetLat) * (0.05 + 0.04 * sk);
    err += (racer.rng() - 0.5) * (1 - sk) * 0.07;
    const decel = Math.max(8, (c.brakeMu || 1.5) * G0 * 0.64 / YD);
    let throttle = 1;
    let brake = 0;
    if (spd > vTgt + 0.6) {
      const distNeed = (spd * spd - vTgt * vTgt) / (2 * decel);
      if (win.distTo < distNeed + 7 + spd * 0.1) {
        brake = clamp((spd - vTgt) / 14, 0.22, 1);
        throttle = 0;
      } else if (spd > vTgt + 6) {
        throttle = 0.35;
      }
    } else if (spd > vTgt - 1.2 && win.k > 0.012) {
      throttle = 0.72 + 0.22 * sk;
    }
    if (off) {
      throttle = Math.min(throttle, 0.4);
      brake = Math.max(brake, 0.2);
    }
    const straight = win.k < 0.008 || win.distTo > 36 + spd * 0.25;
    const aligned = Math.abs(err) < 0.11;
    const boost = !brake && !off && aligned && (car.boost || 0) > 0.1 &&
      ((straight && spd > 18) || (win.distTo > 22 && spd > 24 && spd < vTgt + 4));
    const ebrake = !off && Math.abs(err) > 0.82 && spd > 26 && win.k > 0.02;
    return {
      throttle: throttle,
      brake: brake,
      ebrake: ebrake,
      boost: boost,
      steerIn: clamp(err * (1.85 + 1.15 * sk), -1, 1)
    };
  }
  function blankCar(pose, tank) {
    return {
      x: pose.x, y: pose.y, h: pose.h, vh: pose.h, speed: 0, steer: 0,
      s0: pose.s == null ? null : pose.s,
      boost: tank || 1, gear: 1, rpm: 900, thr: 0, brk: 0, shiftT: 0, wheelSlip: 0
    };
  }
  const GRID_BACK = 11;
  function poseOnGrid(laneIdx, stagger) {
    const tr = G.track;
    const a = tr.pts[0], b = tr.pts[1];
    const h = Math.atan2(b.y - a.y, b.x - a.x);
    const tlen = dist(a, b) || 1;
    const lat = (laneIdx - 1.5) * LANE_W;
    const closed = tr.closed !== false;
    /* Standing start: leave the line behind the grid so the first crossing starts lap 1
       instead of ending it. Open ribbons have no road behind the first sample. */
    const back = (closed ? GRID_BACK : 0) + (stagger || 0) * 5.5;
    const total = tr.len || 0;
    /* Arc position of the grid, from geometry. Never from a projection: the start/finish
       seam is equidistant to both ends of the lap and project() flips between s=0 and
       s=len there, which stamped every sector in the first frame. */
    const s = (closed && total) ? ((total - back) % total + total) % total : 0;
    return {
      x: a.x + (-(b.y - a.y) / tlen) * lat - Math.cos(h) * back,
      y: a.y + ((b.x - a.x) / tlen) * lat - Math.sin(h) * back,
      h: h, s: s, back: back
    };
  }
  function makeRacer(spec) {
    const craft = craftNorm(spec.craft);
    const pose = poseOnGrid(spec.lane, spec.stagger || 0);
    const r = {
      id: spec.id,
      name: spec.name,
      kind: spec.kind,
      slot: spec.slot || 0,
      craft: craft,
      car: blankCar(pose, craft.boostTank),
      lastS: 0,
      lap: 0,
      gates: (G.track.sectors || [0, 0, 0]).map(function () { return false; }),
      splits: [],
      lastLap: null,
      bestLap: null,
      lapStartMs: 0,
      lapSegs: [],
      bestSegs: null,
      segAnchor: 0,
      done: false,
      finishMs: null,
      skill: spec.skill || 1,
      laneBias: spec.laneBias != null ? spec.laneBias : ((spec.lane - 1.5) * LANE_W * 0.55),
      rng: mulberry(spec.seed || 7),
      sparks: 0
    };
    if (r.car.s0 != null) r.lastS = r.car.s0;
    else if (G.track && G.track.samples) {
      r.lastS = project(r.car, G.track.samples, null, G.track.closed !== false).s;
    }
    return r;
  }
  function raceAlong(r) {
    return (r.lap || 0) * ((G.track && G.track.len) || 1) + (r.lastS || 0);
  }
  function standings() {
    return (G.racers || []).slice().sort(function (a, b) {
      if (a.done && b.done) return (a.finishMs || 0) - (b.finishMs || 0);
      if (a.done) return -1;
      if (b.done) return 1;
      return raceAlong(b) - raceAlong(a);
    });
  }
  function posLabel(racer) {
    const st = standings();
    const i = st.indexOf(racer);
    return "P" + (i < 0 ? 1 : i + 1);
  }
  function bumpRacers() {
    const list = G.racers || [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i].car, b = list[j].car;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d >= 1.88 || d < 0.05) continue;
        const nx = dx / d, ny = dy / d;
        const push = (1.88 - d) * 0.5;
        a.x -= nx * push; a.y -= ny * push;
        b.x += nx * push; b.y += ny * push;
        a.speed *= 0.9; b.speed *= 0.9;
        if (list[i].kind === "human" && list[i].slot === 0) G.sparks = Math.max(G.sparks, 0.55);
      }
    }
  }
  function stepVehicle(dt, racer, inp) {
    const c = racer.craft;
    const car = racer.car;
    const throttle = inp.throttle || 0;
    const brake = inp.brake || 0;
    const ebrake = !!inp.ebrake;
    car.thr = throttle;
    car.brk = brake || (ebrake ? 1 : 0);
    const spd = Math.abs(car.speed);
    const vmaxEst = topSpeedYd(c);
    const spd01 = clamp(spd / (vmaxEst + 6), 0, 1);
    const steerRate = (2.15 + 1.35 * (c.turn / 2.4)) * (1.12 - 0.58 * spd01);
    car.steer += ((inp.steerIn || 0) - car.steer) * clamp(dt * steerRate, 0, 1);
    const tank = c.boostTank || 1;
    const boostOn = !!inp.boost && car.boost > 0.04 && !ebrake;
    const proj0 = project(car, G.track.samples, racer.lastS, G.track.closed !== false);
    const on0 = Math.abs(proj0.lat) <= G.track.width;
    const ridge = G.track && G.track.kind === "ridge";
    if (boostOn) car.boost = Math.max(0, car.boost - dt * (ridge ? 0.5 : 0.42));
    else if (on0) car.boost = Math.min(tank, car.boost + dt * (ridge ? 0.065 : 0.18) * c.boost * (c.boostFillMul || 1));
    const fx = racer.kind === "human" && racer.slot === 0;
    const manual = !!inp.manual && racer.kind === "human";
    if (manual) {
      if (inp.shiftUp && !racer._shiftUp) manualShift(car, c, 1);
      if (inp.shiftDown && !racer._shiftDown) manualShift(car, c, -1);
      racer._shiftUp = !!inp.shiftUp;
      racer._shiftDown = !!inp.shiftDown;
    }
    stepPowertrain(c, car, dt, {
      throttle: throttle,
      brake: brake,
      ebrake: ebrake,
      boostOn: boostOn,
      onTrack: on0,
      fx: fx,
      ignoreCombo: !fx,
      manual: manual,
      human: racer.kind === "human"
    });
    if (car.vh == null) car.vh = car.h;
    const turnAuth = c.turn * 0.62 * (1.08 - 0.58 * spd01);
    let yaw = car.steer * turnAuth;
    if (ebrake && spd > 9) {
      yaw += car.steer * (0.95 + 0.7 * c.turn) * (0.35 + 0.65 * spd01);
    }
    const wslip = car.wheelSlip || 0;
    if (wslip > 0.28 && c.drive === "rwd") yaw += car.steer * wslip * 1.15;
    if (wslip > 0.28 && c.drive === "fwd") yaw *= (1 - 0.5 * wslip);
    yaw = clamp(yaw, -2.05, 2.05);
    car.h += yaw * dt;
    car.gLat = clamp(0.9144 * car.speed * yaw / G0, -2, 2);
    let latGrip = (c.mu * 0.74) * (on0 ? 1 : 0.3) * weatherGrip(c);
    if (ebrake && spd > 10) latGrip *= 0.16;
    else latGrip *= 0.82 + 0.18 * (1 - spd01);
    const slip = wrapDelta(car.h - car.vh, Math.PI * 2);
    const counter = (car.steer * slip) < -0.04;
    let align = latGrip * (ebrake ? 4.2 : 8.4);
    if (ebrake && counter) align *= 1.85;
    else if (ebrake && Math.abs(car.steer) > 0.25) align *= 0.62;
    car.vh += slip * clamp(align * dt, 0, 1);
    const slipAbs = Math.abs(wrapDelta(car.h - car.vh, Math.PI * 2));
    if (slipAbs > 0.16 && spd > 12) {
      racer.sparks = clamp(slipAbs * 1.5, 0, 1);
      if (fx) G.sparks = Math.max(G.sparks, racer.sparks);
      if (ebrake) car.speed *= (1 - 0.12 * dt);
      if (on0 && !boostOn) car.boost = Math.min(tank, car.boost + dt * 0.42 * c.boost * (c.boostFillMul || 1) * clamp(slipAbs, 0, 0.8));
    } else if ((car.wheelSlip || 0) < 0.25) {
      racer.sparks = (racer.sparks || 0) * 0.88;
      if (fx) G.sparks *= 0.88;
    }
    car.x += Math.cos(car.vh) * car.speed * dt;
    car.y += Math.sin(car.vh) * car.speed * dt;
    let proj = project(car, G.track.samples, racer.lastS, G.track.closed !== false);
    const hw = G.track.width;
    if (Math.abs(proj.lat) > hw) {
      const extra = Math.abs(proj.lat) - hw;
      const dir = proj.lat >= 0 ? 1 : -1;
      car.x -= (-proj.hy) * dir * extra;
      car.y -= proj.hx * dir * extra;
      const trackH = Math.atan2(proj.hy, proj.hx);
      /* How square the car is to the barrier: 0 = sliding along it, 1 = nose-first.
         The old flat x0.972/frame grind balanced engine thrust at ~3 mph, so a clip
         became a trap. Charge an angle-scaled thump once, then let the car scrape. */
      const into = Math.abs(Math.sin(wrapDelta(car.vh - trackH, Math.PI * 2)));
      if ((car.wallCool || 0) <= 0) car.speed *= 1 - 0.34 * into;
      car.wallCool = 0.16;
      car.speed *= Math.max(0.62, 1 - (0.09 + 0.8 * into) * dt);
      car.h += wrapDelta(trackH - car.h, Math.PI * 2) * (0.08 + 0.22 * into);
      car.vh += wrapDelta(trackH - car.vh, Math.PI * 2) * 0.18;
      car.scrape = 1;
      if (fx && spd > 10) G.sparks = Math.max(G.sparks || 0, 0.3 + 0.35 * into);
      if (ridge && fx) breakCombo("WALL");
      proj = project(car, G.track.samples, racer.lastS, G.track.closed !== false);
    }
    if ((car.wallCool || 0) > 0) car.wallCool -= dt;
    else if (car.scrape) car.scrape *= 0.86;
    racer.boostOn = boostOn;
    racer.ebrake = ebrake;
    car.boostOn = boostOn;
    return proj;
  }
  function stepCar(dt) {
    if (G.racers && G.racers.length) {
      const r = G.racers[0];
      const proj = stepVehicle(dt, r, humanInput(0));
      G.car = r.car;
      G.craft = r.craft;
      r.lastS = proj.s;
      return proj;
    }
    const racer = {
      kind: "human", slot: 0, craft: G.craft, car: G.car, lastS: G.lastS, sparks: G.sparks || 0
    };
    const proj = stepVehicle(dt, racer, humanInput(0));
    G.sparks = racer.sparks;
    G.lastS = proj.s;
    return proj;
  }
  function syncP1() {
    const r = G.racers && G.racers[0];
    if (!r) return;
    G.car = r.car;
    G.craft = r.craft;
    G.lastS = r.lastS;
    G.lap = r.lap;
    G.gates = r.gates;
    G.lastLap = r.lastLap;
    G.bestLap = r.bestLap;
    G.lapStartMs = r.lapStartMs;
    G.lapSegs = r.lapSegs || [];
    G.bestSegs = r.bestSegs || null;
    G.segAnchor = r.segAnchor || 0;
  }

  function stepPowertrain(c, car, dt, inp) {
    const gears = c.gears;
    const nG = gears.length;
    if (car.gear == null) car.gear = 1;
    if (car.shiftT == null) car.shiftT = 0;
    if (car.wheelSlip == null) car.wheelSlip = 0;
    const vMs = car.speed * YD;
    const vAbs = Math.abs(vMs);
    if (car.shiftT > 0) car.shiftT -= dt;
    if (!inp.manual) {
      if (vMs < -1.6) car.gear = -1;
      else if (vAbs < 0.9 && !inp.throttle) car.gear = 0;
      else if (car.gear <= 0 && inp.throttle) {
        car.gear = 1;
        car.shiftT = 0.1;
      }
    }
    /* Brake at a standstill backs a human car up. Without it, being pinned on a barrier
       at 3 mph was a dead end in auto: the old stop-clamp ate every inch of reverse. */
    const revOn = !!inp.human && !inp.manual && inp.brake > 0.35 && inp.throttle < 0.2 &&
      car.speed < 1.4 && car.speed > -REV_CAP;
    if (revOn) {
      car.rev = true;
      car.gear = -1;
      car.shiftT = 0;
    } else if (car.rev && (inp.throttle > 0.2 || inp.brake < 0.2)) {
      car.rev = false;
      if (car.gear < 0) car.gear = 0;
      car.shiftT = 0.08;
    }
    let gIdx = car.gear < 1 ? 0 : car.gear - 1;
    if (gIdx > nG - 1) gIdx = nG - 1;
    const clutch = (car.gear === 0 || car.shiftT > 0) ? 0 : 1;
    const ratio = clutch === 0 ? 0 : (car.gear < 0 ? -gears[0] * 0.82 : gears[gIdx]) * c.finalDrive;
    let rpm = c.idle;
    if (ratio !== 0) rpm = (vAbs / c.wheelRadius) * Math.abs(ratio) * 60 / (Math.PI * 2);
    if (vAbs < 7.5 && car.gear === 1 && inp.throttle && clutch) {
      rpm = Math.max(rpm, c.idle + inp.throttle * (c.tqRpm - c.idle) * 1.02);
    }
    rpm = rpm + car.wheelSlip * (c.redline - rpm) * (car.gear <= 1 ? 0.92 : 0.55);
    rpm = clamp(rpm, c.idle * 0.7, c.redline + 200);
    if (!inp.manual && car.shiftT <= 0 && car.gear > 0) {
      const shiftRpm = car.gear <= 3 ? c.redline * 0.965 : c.redline * 0.915;
      if (rpm > shiftRpm && car.gear < nG) {
        car.gear += 1;
        car.shiftT = car.gear <= 3 ? 0.09 : 0.14;
        if (car.gear === 2 || car.gear === 3) car.speed += 2.4;
      } else if (rpm < Math.max(c.idle + 900, c.tqRpm * 0.48) && car.gear > 1 && inp.throttle < 0.55) {
        const low = roadRpm(c, car.speed, car.gear - 2);
        if (low < c.redline * 0.88) {
          car.gear -= 1;
          car.shiftT = 0.09;
        }
      }
    }
    const bp = c.boostPower || 1;
    const tq = engineTorqueNm(c, rpm) * (inp.boostOn ? 1 + BOOST_TQ * bp : 1);
    const drvIn = car.rev ? inp.brake : inp.throttle;
    let Fdrive = clutch * drvIn * tq * ratio * c.eta / c.wheelRadius;
    if (car.gear === 1) Fdrive *= 1.55;
    else if (car.gear === 2) Fdrive *= 3.05;
    else if (car.gear === 3) Fdrive *= 2.72;
    else if (car.gear === 4) Fdrive *= 0.9;
    else if (car.gear >= 5) Fdrive *= 0.84;
    Fdrive *= (c.accelMul || 1);
    const axEst = car.speed >= 0 ? 1 : -1;
    const df = driveFrac(c);
    const rearLoad = clamp(0.47 + 0.16 * clamp(-axEst * inp.throttle + inp.brake, -1, 1), 0.28, 0.72);
    const frontLoad = 1 - rearLoad;
    const drivenN = c.massKg * G0 * (df.r * rearLoad + df.f * frontLoad);
    const surf = inp.onTrack ? 1 : 0.32;
    let Fmax = Math.max(400, c.mu * drivenN * surf * weatherGrip(c));
    if (inp.boostOn) Fmax *= 1 + 0.22 * bp;
    if (car.gear === 1) Fmax *= 1.18;
    else if (car.gear === 2) Fmax *= 1.82;
    else if (car.gear === 3) Fmax *= 1.68;
    else if (car.gear >= 4) Fmax *= 1.08;
    Fmax *= Math.min(1.35, 0.85 + 0.15 * (c.accelMul || 1));
    const want = Math.abs(Fdrive);
    if (want > Fmax && clutch && drvIn > 0.2) {
      car.wheelSlip = clamp(car.wheelSlip + dt * ((want - Fmax) / (Fmax + 1)) * 2.4, 0, 1);
      Fdrive = Math.sign(Fdrive) * Fmax * (1 - 0.35 * car.wheelSlip);
      if (inp.fx) G.sparks = Math.max(G.sparks || 0, 0.4 + car.wheelSlip * 0.7);
    } else {
      car.wheelSlip = Math.max(0, car.wheelSlip - dt * 1.8);
    }
    let Fdrag = 0.5 * RHO * c.cd * c.area * vMs * vMs * (vMs >= 0 ? 1 : -1);
    const bonusYd = inp.ignoreCombo ? 0 : comboVmaxBonusYd();
    if (bonusYd > 0) {
      const v0 = baseTopSpeedYd(c);
      const v1 = v0 + bonusYd;
      Fdrag *= (v0 * v0) / (v1 * v1);
    }
    if (inp.boostOn) {
      const vBoost = 1 + BOOST_VMAX * bp;
      Fdrag /= (vBoost * vBoost);
    }
    const vMul = c.vmaxMul || 1;
    if (vMul > 1) Fdrag /= (vMul * vMul);
    const Froll = c.crr * c.massKg * G0 * (vAbs < 0.15 ? 0 : (vMs >= 0 ? 1 : -1));
    const Fbrk = (car.rev ? 0 : inp.brake) * c.brakeMu * c.massKg * G0 * 0.72 * (vAbs < 0.2 && !inp.throttle ? (vMs >= 0 ? 1 : -1) : (vMs >= 0 ? 1 : -1));
    const Feb = inp.ebrake ? c.mu * c.massKg * G0 * 0.28 * (vMs >= 0 ? 1 : -1) : 0;
    let Fnet = Fdrive - Fdrag - Froll;
    if (vAbs > 0.25 || inp.brake || inp.ebrake) Fnet -= Fbrk * (vAbs > 0.25 ? 1 : 0) + Feb;
    if (bonusYd > 0 && inp.throttle && !inp.ignoreCombo) Fnet += (G.combo || 0) * 190;
    const a = Fnet / c.massKg;
    car.gLon = clamp(a / G0, -1.8, 1.8);
    car.speed += (a / YD) * dt;
    let vmax = topSpeedYd(c);
    if (inp.boostOn) vmax *= 1 + BOOST_VMAX * bp;
    if (car.speed > vmax) car.speed = vmax;
    if (car.rev) {
      if (car.speed < -REV_CAP) car.speed = -REV_CAP;
    } else if (inp.brake && !inp.throttle && car.speed < 0 && car.speed > -5) car.speed = 0;
    if (!inp.throttle && !car.rev && Math.abs(car.speed) < 0.35) car.speed = 0;
    car.rpm = rpm;
    car.wheelSlip = car.wheelSlip || 0;
  }

  function gearLabel(g) {
    if (g < 0) return "R";
    if (!g) return "N";
    return String(g);
  }
  function manualShift(car, c, dir) {
    if (!car || !c) return;
    if ((car.shiftT || 0) > 0.05) return;
    const nG = (c.gears && c.gears.length) || 6;
    let g = car.gear;
    if (g == null) g = 1;
    if (dir > 0) {
      if (g < 0) g = 0;
      else if (g === 0) g = 1;
      else if (g < nG) g += 1;
    } else {
      if (g > 1) g -= 1;
      else if (g === 1) g = 0;
      else if (g === 0) g = -1;
    }
    if (g === car.gear) return;
    car.gear = g;
    car.shiftT = 0.12;
  }

  function fmtDelta(ms) {
    if (ms == null || !isFinite(ms)) return "DELTA —";
    const s = ms / 1000;
    const sign = s >= 0 ? "+" : "−";
    return "DELTA " + sign + Math.abs(s).toFixed(3);
  }

  let veilEl = null;
  /* The car crossed `target` this frame iff the target sits inside the stretch covered
     from prev to now, measured forward around the lap. Comparing the two numbers
     separately (the old form) stamped every sector at once whenever the car or the
     projector stepped backwards across the start/finish seam: a single frame then reads
     as "past" all three gates. */
  function crossed(prev, now, target, total) {
    if (!(total > 8)) return false;
    let step = now - prev;
    if (step < 0) step += total;
    if (step > total * 0.5) return false;
    let ahead = target - prev;
    if (ahead < 0) ahead += total;
    return ahead <= step;
  }

  function fmtSigned(ms) {
    if (ms == null || !isFinite(ms)) return "—";
    const s = ms / 1000;
    return (s >= 0 ? "+" : "\u2212") + Math.abs(s).toFixed(3);
  }

  /* Lap record book. A heat is only written to the ghost once it is finished, so a
     recording from an older build that counted a phantom opening lap comes back a lap
     short and can never be beaten: check its path length before trusting it. */
  function ghostCoversHeat(g, laps, len) {
    if (!g || !Array.isArray(g.samples) || g.samples.length < 3 || !laps || !len) return false;
    let d = 0;
    for (let i = 1; i < g.samples.length; i++) {
      const a = g.samples[i - 1], b = g.samples[i];
      d += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return d >= (laps - 0.3) * len;
  }

  function bestKey() {
    return (G.track && G.track.id ? G.track.id : "track") + "|" + ((G.craft && G.craft.id) || "apex");
  }
  function loadBest() {
    const b = G.save && G.save.bests && G.save.bests[bestKey()];
    return b && b.ms ? b : null;
  }
  function saveLapRecord(ms, segs) {
    if (!G.track || !G.save || !ms) return;
    if (!G.save.bests) G.save.bests = {};
    const k = bestKey();
    const cur = G.save.bests[k];
    if (!cur || ms < cur.ms) {
      G.save.bests[k] = { ms: ms, segs: (segs || []).slice(), at: Date.now() };
      G.recordMs = ms;
      writeSave(G.save);
    }
  }
  function segFracsFor(tr) {
    const s = (tr && tr.sectors) || [];
    return s.length ? s.concat([1]) : [];
  }
  /* Expected elapsed time at a fraction of the record lap, read off that lap's own
     sector splits — replaces extrapolating a whole lap time off the first few percent. */
  function expectedAt(frac) {
    const segs = G.bestSegs, fracs = G.segFracs;
    if (!segs || !segs.length || !fracs || !fracs.length) return null;
    const f = clamp(frac, 0, 1);
    let cum = 0, prevF = 0;
    for (let i = 0; i < Math.min(segs.length, fracs.length); i++) {
      const f1 = fracs[i];
      if (f <= f1 && f1 > prevF) return cum + ((f - prevF) / (f1 - prevF)) * (segs[i] || 0);
      cum += segs[i] || 0;
      prevF = f1;
    }
    return cum;
  }

  let flashUntil = 0;
  function flashMsg(text, tone) {
    const el = $("countFlash");
    if (!el) return;
    el.textContent = text;
    el.classList.remove("hidden");
    el.classList.add("msg");
    el.classList.toggle("good", tone === "good");
    el.classList.toggle("bad", tone === "bad");
    flashUntil = performance.now() + 1500;
  }
  function flashTick(now) {
    if (!flashUntil || now < flashUntil) return;
    flashUntil = 0;
    const el = $("countFlash");
    if (!el) return;
    el.classList.add("hidden");
    el.classList.remove("good", "bad", "msg");
  }

  function paintRaceHud(now) {
    const racing = G.phase === "race";
    const elapsed = racing && G.t0 ? now - G.t0 : 0;
    const lapMs = racing ? elapsed - (G.lapStartMs || 0) : 0;
    const drag = G.track && G.track.kind === "drag";
    const ridge = G.track && G.track.kind === "ridge";
    const laps = G.track ? G.laps : 3;
    const lapN = Math.min(laps, (G.lap || 0) + 1);
    if ($("rhLap")) {
      $("rhLap").textContent = drag ? (G.track.feet + "′") : (ridge ? "RUN" : (lapN + "/" + laps));
    }
    if ($("rhLapT")) $("rhLapT").textContent = fmt(drag ? elapsed : lapMs);
    if ($("rhSess")) $("rhSess").textContent = fmt(elapsed);
    if ($("rhBest")) $("rhBest").textContent = fmt(G.bestLap);
    if ($("rhLast")) $("rhLast").textContent = fmt(G.lastLap);
    const beat = G.bestMs;
    if ($("rhBeat")) $("rhBeat").textContent = fmt(beat);
    const len = G.track && G.track.len ? G.track.len : 1;
    let prog = 0;
    if (drag && G.track && G.car) prog = clamp((G.car.x - G.track.startX) / Math.max(1, G.track.finishX - G.track.startX), 0, 1);
    else prog = clamp((G.lastS || 0) / len, 0, 1);
    if ($("rhProg")) $("rhProg").style.width = Math.round(prog * 100) + "%";
    const deltaEl = $("rhDelta");
    if (deltaEl) {
      let d = null;
      if (drag && beat && racing && prog > 0.15) d = elapsed / prog - beat;
      else if (!drag && racing && G.bestSegs) {
        const want = expectedAt(prog);
        d = want == null ? null : lapMs - want;
      } else if (beat && racing && laps) d = elapsed - beat * ((G.lap + prog) / laps);
      deltaEl.textContent = d == null ? "DELTA —" : fmtDelta(d);
      deltaEl.classList.toggle("up", d != null && d < -8);
      deltaEl.classList.toggle("down", d != null && d > 12);
    }
    let pos = "P1";
    if (G.racers && G.racers.length > 1) pos = posLabel(G.racers[0]);
    else if (drag && G.ai && G.car) pos = G.ai.x > G.car.x + 1.2 ? "P2" : "P1";
    else if (racing && G.ghost && G.ghost.samples && G.track) {
      const gh = ghostAt(elapsed);
      if (gh) {
        const gs = project(gh, G.track.samples, null, G.track.closed !== false).s;
        pos = gs > (G.lastS || 0) + 3 ? "P2" : "P1";
      }
    }
    if ($("rhPos")) $("rhPos").textContent = pos;
    const disp = Math.max(0, speedVal((G.car && G.car.speed) || 0));
    const dtHud = clamp(((now || 0) - (G._hudT || now || 0)) / 1000, 0.008, 0.05);
    G._hudT = now || G._hudT;
    const follow = 1 - Math.exp(-10 * dtHud);
    G.hudSpd += (disp - (G.hudSpd || 0)) * follow;
    G.hudRpm += (((G.car && G.car.rpm) || 800) - (G.hudRpm || 800)) * follow;
    if ($("rhSpd")) $("rhSpd").textContent = String(Math.round(Math.max(0, G.hudSpd)));
    if ($("rhUnit")) $("rhUnit").textContent = opt("metric") ? "km/h" : "MPH";
    if ($("rhRpm")) $("rhRpm").textContent = String(Math.round(G.hudRpm)).padStart(4, "0");
    const gearEl = $("rhGear");
    if (gearEl) {
      gearEl.textContent = gearLabel(G.car && G.car.gear);
      gearEl.classList.toggle("shift", ((G.car && G.car.shiftT) || 0) > 0);
      gearEl.classList.toggle("mt", !!opt("manual"));
    }
    const red = (G.craft && G.craft.redline) || 7800;
    const rpmN = clamp((G.hudRpm || 0) / red, 0, 1);
    const needle = $("rhNeedle");
    if (needle) needle.setAttribute("transform", "rotate(" + (-90 + rpmN * 180).toFixed(2) + ")");
    if ($("rhArc")) $("rhArc").style.strokeDashoffset = String((289 * (1 - rpmN)).toFixed(1));
    const leds = document.querySelectorAll("#rhShift i");
    const nOn = Math.round(rpmN * 7);
    const flash = rpmN > 0.92 && Math.floor(now / 70) % 2 === 0;
    leds.forEach(function (el, i) { el.classList.toggle("on", i < nOn); });
    if ($("rhShift")) $("rhShift").classList.toggle("flash", flash);
    if ($("rhThr")) $("rhThr").style.width = Math.round(((G.car && G.car.thr) || 0) * 100) + "%";
    if ($("rhBrk")) $("rhBrk").style.width = Math.round(((G.car && G.car.brk) || 0) * 100) + "%";
    if ($("rhBoost")) {
      const tank = (G.craft && G.craft.boostTank) || 1;
      $("rhBoost").style.width = Math.round(clamp(((G.car && G.car.boost) || 0) / tank, 0, 1) * 100) + "%";
    }
    if ($("arcadeHud")) {
      const on = !!(G.track && G.track.kind === "ridge" && G.mode === "race");
      $("arcadeHud").classList.toggle("hidden", !on);
      if (on) {
        if ($("arcScore")) $("arcScore").textContent = String(G.score || 0);
        if ($("arcMult")) {
          $("arcMult").textContent = "x" + (G.combo || 0);
          $("arcMult").classList.toggle("hot", (G.combo || 0) > 0);
          $("arcMult").classList.toggle("guns", !!G.gunOn);
          $("arcMult").classList.toggle("gun-cannon", !!G.gunOn && G.gunKind === "cannon");
          $("arcMult").classList.toggle("gun-needle", !!G.gunOn && G.gunKind === "needle");
          $("arcMult").classList.toggle("gun-rail", !!G.gunOn && G.gunKind === "rail");
        }
        if ($("arcCombo")) {
          const bonus = (G.combo || 0) * COMBO_MPH;
          const gn = activeGun();
          const gunTxt = G.gunOn ? ((gn && gn.name) || "GUNS") + " LIVE" : "HOLD R-SHIFT";
          const bonusTxt = bonus ? ("+" + Math.round(opt("metric") ? bonus * 1.60934 : bonus) + " " + (opt("metric") ? "km/h" : "MPH") + " · " + (G.gunOn ? gunTxt : "guns scale w/ x")) : "";
          $("arcCombo").textContent = bonusTxt || gunTxt;
        }
        if ($("arcBest")) $("arcBest").textContent = "BEST " + ((G.save.arcade && G.save.arcade.bestScore) || 0);
        if ($("arcKills")) $("arcKills").textContent = (G.kills || 0) + " WRECKS";
      }
    }
    if ($("rhSectors")) {
      if (drag) {
        const st = G.tree || {};
        $("rhSectors").textContent = "60' " + fmt(st.ft60) + " · TRAP " + (st.trapMph != null ? fmtSpeedMph(st.trapMph) : "—");
      } else {
        $("rhSectors").textContent = (G.gates || [false, false, false]).map(function (g, i) {
          return "S" + (i + 1) + " " + (g ? "■" : "□");
        }).join(" · ");
      }
    }
  }

  function heatHud(now) {
    if (G.track && G.track.kind === "drag") {
      const st = G.tree || {};
      const elapsed = G.phase === "race" && G.t0 ? now - G.t0 : 0;
      if ($("lapPill")) $("lapPill").textContent = (G.track.feet || "") + " FT";
      if ($("hudMeta")) {
        $("hudMeta").innerHTML =
          "<span>RT <b>" + (st.rt != null ? (st.rt / 1000).toFixed(3) : "—") + "</b></span>" +
          "<span>ET <b>" + fmt(st.playerMs != null ? st.playerMs : elapsed) + "</b></span>";
      }
      if ($("speedo")) {
        $("speedo").innerHTML = Math.round(speedVal((G.car && G.car.speed) || 0)) + "<small>" + (opt("metric") ? "km/h" : "MPH") + "</small>";
      }
      if ($("boostFill")) {
        const tank = (G.craft && G.craft.boostTank) || 1;
        $("boostFill").style.width = Math.round(clamp((G.car.boost || 0) / tank, 0, 1) * 100) + "%";
      }
      if ($("heatCard")) {
        $("heatCard").innerHTML = "<p><b>" + G.track.name + "</b></p><p>" +
          (G.phase === "drag_idle" ? "Roll to the tree · press F" : (G.tree && G.tree.phase === "ready") ? "READY · wait for the tree" : G.phase === "tree" ? "Tree · hold" : G.phase) +
          "</p><p>60' <b>" + fmt(st.ft60) + "</b></p>";
      }
      if ($("rhBigLabel")) $("rhBigLabel").textContent = "ELAPSED";
      if ($("secCard")) {
        $("secCard").innerHTML = "You " + fmt(st.playerMs) + (st.foul ? " FOUL" : "") +
          "<br>AI " + fmt(st.aiMs) + (st.aiFoul ? " FOUL" : "");
      }
      if ($("ghostHead")) $("ghostHead").textContent = "Rival";
      if ($("ghostCard")) {
        $("ghostCard").innerHTML = G.ai
          ? "Lane 2 · " + ((G.aiCraft && G.aiCraft.name) || "AI") +
            " · RT " + (st.aiFoul ? "foul" : (st.aiRt != null && G.phase !== "drag_idle" ? st.aiRt.toFixed(3) + "s" : "—"))
          : "No opponent.";
      }
      if ($("dragHud")) {
        $("dragHud").innerHTML = "RT " + (st.rt != null ? (st.rt / 1000).toFixed(3) : "—") +
          " · ET " + fmt(st.playerMs != null ? st.playerMs : elapsed) +
          " · AI " + fmt(st.aiMs);
      }
      if ($("dockStatus")) {
        $("dockStatus").textContent = G.phase === "drag_idle" ? "F to stage" :
          (G.phase === "tree" ? "Tree…" : (st.foul ? "Red light" : "On the power"));
      }
      if ($("hint") && G.phase === "drag_idle") {
        $("hint").textContent = "Drive to the tree · F stages · Lane 2 is " + ((G.aiCraft && G.aiCraft.name) || "random");
      }
      paintRaceHud(now);
      return;
    }
    const elapsed = G.phase === "race" ? now - G.t0 : 0;
    if ($("lapPill")) $("lapPill").textContent = "LAP " + Math.min(G.laps, G.lap + 1) + "/" + G.laps;
    if ($("rhBigLabel")) $("rhBigLabel").textContent = (G.track && G.track.kind === "ridge") ? "RUN TIME" : "CURRENT LAP";
    if ($("hudMeta")) {
      $("hudMeta").innerHTML =
        "<span>Time <b>" + fmt(elapsed) + "</b></span>" +
        "<span>Lap <b>" + fmt(elapsed - (G.lapStartMs || 0)) + "</b></span>" +
        "<span>Best lap <b>" + fmt(G.bestLap) + "</b></span>";
    }
    if ($("speedo")) $("speedo").innerHTML = Math.round(speedVal((G.car && G.car.speed) || 0)) + "<small>" + (opt("metric") ? "km/h" : "MPH") + "</small>";
    if ($("boostFill")) {
      const tank = (G.craft && G.craft.boostTank) || 1;
      $("boostFill").style.width = Math.round(clamp((G.car.boost || 0) / tank, 0, 1) * 100) + "%";
    }
    if ($("heatCard")) {
      $("heatCard").innerHTML = "<p><b>" + G.track.name + "</b></p><p>" + G.craft.name + " · " +
        (G.phase === "count" ? "countdown" : G.phase) + "</p><p>Lap <b>" + fmt(elapsed - (G.lapStartMs || 0)) + "</b></p>" +
        (G.recordMs ? "<p>Record lap <b>" + fmt(G.recordMs) + "</b></p>" : "") +
        (G.staleGhost ? "<p class='lore'>Stale ghost dropped</p>" : "");
    }
    if ($("secCard")) {
      const bs = G.bestSegs || [];
      $("secCard").innerHTML = (G.gates || []).map(function (g, i) {
        const seg = G.lapSegs && G.lapSegs[i];
        const d = (g && seg != null && bs[i] != null) ? " " + fmtSigned(seg - bs[i]) : "";
        return "S" + (i + 1) + " " + (g ? "■" : "□") + d;
      }).join(" · ") + (G.bestLap ? "<br>Best " + fmt(G.bestLap) : "");
    }
    if ($("ghostHead")) {
      $("ghostHead").textContent = (G.track && G.track.kind === "ridge") ? "Arcade"
        : ((G.racers && G.racers.length > 1) ? "Standings" : "Ghost");
    }
    if ($("ghostCard")) {
      if (G.track && G.track.kind === "ridge") {
        $("ghostCard").innerHTML = "Arcade · " + (G.score || 0) + " pts · x" + (G.mult || 1) +
          "<br>Browser best <b>" + ((G.save.arcade && G.save.arcade.bestScore) || 0) + "</b>";
      } else if (G.racers && G.racers.length > 1) {
        $("ghostCard").innerHTML = standings().map(function (r, i) {
          return "P" + (i + 1) + " " + r.name + (r.done ? " · " + fmt(r.finishMs) : "");
        }).join("<br>");
      } else {
        $("ghostCard").innerHTML = G.ghost
          ? "Ghost on · " + fmt(G.ghost.ms)
          : "No ghost for this craft yet.";
      }
    }
    if ($("dockStatus")) $("dockStatus").textContent = G.phase === "count" ? "Lights…" : (G.sparks > 0.4 ? "Drifting" : "On line");
    paintRaceHud(now);
    paintSplitHud(now);
  }
  function paintSplitHud(now) {
    const on = isSplit() && G.mode === "race";
    if ($("splitHud")) $("splitHud").classList.toggle("hidden", !on);
    if ($("splitBar")) $("splitBar").classList.toggle("hidden", !on);
    if (!on) return;
    const unit = opt("metric") ? "km/h" : "MPH";
    [0, 1].forEach(function (slot) {
      const r = (G.racers || []).find(function (x) { return x.kind === "human" && x.slot === slot; });
      if (!r) return;
      const pref = slot === 0 ? "sp1" : "sp2";
      if ($(pref + "Name")) $(pref + "Name").textContent = r.name + " · " + posLabel(r);
      if ($(pref + "Spd")) $(pref + "Spd").textContent = String(Math.round(speedVal(r.car.speed || 0)));
      if ($(pref + "Unit")) $(pref + "Unit").textContent = unit;
      if ($(pref + "Gear")) $(pref + "Gear").textContent = gearLabel(r.car.gear);
      if ($(pref + "Lap")) $(pref + "Lap").textContent = Math.min(G.laps, (r.lap || 0) + 1) + "/" + G.laps;
      if ($(pref + "Bst")) {
        const tank = (r.craft && r.craft.boostTank) || 1;
        $(pref + "Bst").style.width = Math.round(clamp((r.car.boost || 0) / tank, 0, 1) * 100) + "%";
      }
    });
    if ($("splitStand")) {
      $("splitStand").textContent = standings().map(function (r, i) {
        return "P" + (i + 1) + " " + r.name;
      }).join(" · ");
    }
  }

  function ghostAt(elapsed) {
    const g = G.ghost;
    if (!g || !g.samples || !g.samples.length) return null;
    const t = elapsed / 1000;
    const sm = g.samples;
    if (t <= sm[0].t) return sm[0];
    if (t >= sm[sm.length - 1].t) return sm[sm.length - 1];
    for (let i = 1; i < sm.length; i++) {
      if (sm[i].t >= t) {
        const a = sm[i - 1], b = sm[i];
        const u = (t - a.t) / Math.max(0.001, b.t - a.t);
        const dh = wrapDelta(b.h - a.h, Math.PI * 2);
        return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, h: a.h + dh * u };
      }
    }
    return sm[sm.length - 1];
  }

  function finishHeat(ms) {
    if (G.phase === "done") return;
    G.phase = "done";
    gateLeavePlay();
    const key = G.track.id + "|" + G.craft.id;
    let beat = false;
    const fieldOn = G.racers && G.racers.length > 1;
    if (!fieldOn) {
      if (!G.save.ghosts) G.save.ghosts = {};
      if (!G.save.ghosts[key] || ms < G.save.ghosts[key].ms) {
        G.save.ghosts[key] = { ms: ms, samples: G.rec.slice() };
        beat = true;
      }
    }
    if (!Array.isArray(G.save.rounds)) G.save.rounds = [];
    G.save.rounds.unshift({
      name: (G.save.name || "Operator").slice(0, 24),
      craft: G.craft.name,
      track: G.track.name,
      trackId: G.track.id,
      ms: ms,
      laps: G.laps,
      at: Date.now(),
      beat: beat,
      field: G.field || "solo",
      score: G.track.kind === "ridge" ? (G.score || 0) : null,
      kills: G.track.kind === "ridge" ? (G.kills || 0) : null,
      combo: G.track.kind === "ridge" ? (G.bestCombo || 1) : null
    });
    G.save.rounds = G.save.rounds.slice(0, 40);
    let high = false;
    if (G.track.kind === "ridge") {
      if (!G.save.arcade) G.save.arcade = { bestScore: 0, bestCombo: 0, runs: [] };
      if ((G.score || 0) > (G.save.arcade.bestScore || 0)) {
        G.save.arcade.bestScore = G.score;
        high = true;
      }
      if ((G.bestCombo || 1) > (G.save.arcade.bestCombo || 0)) G.save.arcade.bestCombo = G.bestCombo;
      if (!Array.isArray(G.save.arcade.runs)) G.save.arcade.runs = [];
      G.save.arcade.runs.unshift({
        name: (G.save.name || "Operator").slice(0, 24),
        craft: G.craft.name,
        track: G.track.name,
        ms: ms,
        score: G.score || 0,
        kills: G.kills || 0,
        combo: G.bestCombo || 1,
        at: Date.now()
      });
      G.save.arcade.runs = G.save.arcade.runs.slice(0, 20);
    }
    writeSave(G.save);
    if (window.ArcadeLedger) {
      const ev = G.track.kind === "ridge" ? "arcade" : "heat";
      if (ev === "arcade" ? (G.score || 0) > 0 : (ms || 0) > 0) {
        ArcadeLedger.rally({
          name: (G.save.name || "Operator").slice(0, 18),
          event: ev,
          track: String(G.track.name || "Heat").slice(0, 40),
          trackId: String(G.track.id || "heat").slice(0, 32),
          craft: String(G.craft.name || "Apex Mk I").slice(0, 32),
          ms: Math.round(ms || 0),
          score: ev === "arcade" ? Math.round(G.score || 0) : 0,
          kills: ev === "arcade" ? Math.round(G.kills || 0) : 0,
          combo: ev === "arcade" ? Math.round(G.bestCombo || 1) : 1,
          laps: Math.round(G.laps || 0),
          field: String(G.field || "solo").slice(0, 16),
          date: new Date().toISOString().slice(0, 10)
        });
      }
    }
    log((beat ? "New ghost. " : "Heat closed. ") + fmt(ms) + (G.track.kind === "ridge" ? " · " + (G.score || 0) + " pts" : ""));
    const arcadeLine = G.track.kind === "ridge"
      ? "<p class='lore arc-result'>" + (G.score || 0) + " pts · " + (G.kills || 0) + " wrecks · x" + (G.bestCombo || 1) +
        " combo" + (high ? " · NEW HIGH" : "") + "</p>" +
        "<p class='lore'>Browser best <b>" + (G.save.arcade.bestScore || 0) + "</b></p>"
      : "";
    const board = fieldOn ? "<ol class='lore'>" + standings().map(function (r, i) {
      const t = r.finishMs != null ? fmt(r.finishMs) : ("lap " + Math.min(G.laps, (r.lap || 0) + 1));
      return "<li>P" + (i + 1) + " " + r.name + " · " + r.craft.name + " · " + t + "</li>";
    }).join("") + "</ol>" : "";
    showSheet(
      "<p class='kicker'>Heat closed</p><h2>" + (G.track.kind === "ridge" ? String(G.score || 0) : fmt(ms)) + "</h2>" +
      (G.track.kind === "ridge" ? "<p class='lore'>" + fmt(ms) + "</p>" : "") +
      "<p class='lore'>" + G.track.name + " · " + (fieldOn ? (G.field === "split" || G.field === "splitbots" ? "split" : "grid") : G.craft.name) + (beat ? " · ghost rewritten" : "") + "</p>" +
      board +
      arcadeLine +
      donateHtml() +
      "<div class='modes'><button class='btn gold' id='again'>Replay</button><button class='btn' id='toMenu'>Menu</button><a class='btn' href='./ledger.html'>Live hall</a></div>"
    );
    $("again").onclick = function () { spawnOnGrid(); };
    $("toMenu").onclick = menu;
  }

  function tick(now) {
    requestAnimationFrame(tick);
    if (window.HavenSfx) {
      const radioEl = $("radioEl");
      const radioOn = !!(radioEl && !radioEl.paused && !radioEl.muted && radioEl.volume > 0.02);
      const slipLat = G.car && G.car.h != null && G.car.vh != null
        ? Math.abs(wrapDelta(G.car.h - G.car.vh, Math.PI * 2))
        : 0;
      HavenSfx.tick({
        racing: G.mode === "race" && G.phase !== "done" && G.phase !== "idle",
        rpm: G.car && G.car.rpm,
        gear: G.car && G.car.gear,
        thr: G.car && G.car.thr,
        slip: Math.max((G.car && G.car.wheelSlip) || 0, G.sparks || 0, slipLat > 0.14 ? slipLat : 0),
        speed: Math.abs((G.car && G.car.speed) || 0),
        radio: radioOn,
        reduceFx: opt("reduceFx"),
        guns: !!(G.gunOn && G.track && G.track.kind === "ridge"),
        gunKind: G.gunKind || "mg",
        gunPower: 1 + 0.12 * (G.combo || 0)
      });
    }
    if (G.mode !== "race" || !G.track) return;
    if (G.track.kind === "drag") { tickDrag(now); return; }
    if (overlayOpen() && G.phase === "race") {
      if (G._last) G.t0 += now - G._last;
      G._last = now;
      heatHud(now);
      draw(now);
      return;
    }
    if (G.phase === "count") {
      const u = (now - G.countT) / 700;
      const n = 3 - Math.floor(u);
      const flash = $("countFlash");
      if (flash) {
        flash.classList.remove("hidden");
        flash.textContent = n > 0 ? String(n) : "GO";
      }
      if (u >= 4) {
        if (flash) flash.classList.add("hidden");
        G.phase = "race";
        G.t0 = now;
        log("Green.");
      }
      heatHud(now);
      draw(now);
      return;
    }
    if (G.phase !== "race") {
      heatHud(now);
      draw(now);
      return;
    }
    const dt = Math.min(0.033, G._last ? (now - G._last) / 1000 : 0.016);
    G._last = now;
    const elapsed = now - G.t0;
    const fieldOn = G.racers && G.racers.length > 1;
    let proj = null;
    if (fieldOn) {
      G.racers.forEach(function (r) {
        const prevS = r.lastS || 0;
        let inp = r.kind === "bot" || r.done ? botInput(r) : humanInput(r.slot);
        if (r.done) { inp.throttle = Math.min(inp.throttle, 0.28); inp.boost = false; }
        const p = stepVehicle(dt, r, inp);
        if (r.slot === 0) proj = p;
        (G.track.sectors || []).forEach(function (frac, i) {
          const target = frac * p.len;
          if (!r.gates[i] && crossed(prevS, p.s, target, p.len)) {
            r.gates[i] = true;
            r.lapSegs[i] = elapsed - (r.segAnchor || r.lapStartMs || 0);
            r.segAnchor = elapsed;
            if (r.slot === 0) {
              G.splits.push(elapsed);
              const bs = r.bestSegs && r.bestSegs[i];
              log((G.track.kind === "ridge" ? "Checkpoint " : "Sector ") + (i + 1) + " · " + fmt(elapsed) +
                (bs ? " · " + fmtSigned(r.lapSegs[i] - bs) : ""));
              if (bs) flashMsg("S" + (i + 1) + " " + fmtSigned(r.lapSegs[i] - bs), r.lapSegs[i] - bs < 0 ? "good" : "bad");
            }
          }
        });
        if (!r.done && G.track.kind !== "ridge" && r.gates.every(Boolean) && crossed(prevS, p.s, 0, p.len) && prevS > p.len * 0.7) {
          r.lap += 1;
          r.gates = (G.track.sectors || [0, 0, 0]).map(function () { return false; });
          const lapMs = elapsed - (r.lapStartMs || 0);
          r.lastLap = lapMs;
          const nSeg = (G.track.sectors || []).length + 1;
          r.lapSegs[nSeg - 1] = Math.max(0, elapsed - (r.segAnchor || elapsed));
          r.segAnchor = elapsed;
          if (r.bestLap == null || lapMs < r.bestLap) {
            r.bestLap = lapMs;
            r.bestSegs = r.lapSegs.slice(0, nSeg);
            if (r.slot === 0) {
              G.bestSegs = r.bestSegs;
              G.recordMs = lapMs;
              log("Best lap · " + fmt(lapMs));
            }
          }
          r.lapSegs = [];
          r.lapStartMs = elapsed;
          log(r.name + " lap " + r.lap + " · " + fmt(elapsed));
          if (r.lap >= G.laps) {
            r.done = true;
            r.finishMs = elapsed;
            log(r.name + " finished · " + fmt(elapsed));
            if (r.kind === "human" && !G._firstFinish) G._firstFinish = now;
          }
        }
        r.lastS = p.s;
      });
      bumpRacers();
      syncP1();
      if (!proj) proj = project(G.car, G.track.samples, G.lastS, G.track.closed !== false);
      const humans = G.racers.filter(function (r) { return r.kind === "human"; });
      const humansDone = humans.every(function (r) { return r.done; });
      const waitUp = G._firstFinish && now - G._firstFinish > 18000;
      if (humansDone || waitUp) {
        const winner = standings()[0];
        const p1 = humans[0];
        finishHeat((p1 && p1.finishMs != null) ? p1.finishMs : (winner && winner.finishMs != null ? winner.finishMs : elapsed));
      }
    } else {
      proj = stepCar(dt);
    }
    if (G.track.kind === "ridge") {
      stepTraffic(dt);
      stepGuns(dt);
    }
    if ((G.rec.length < 2 || elapsed / 1000 - G.rec[G.rec.length - 1].t > 0.05) && G.rec.length < 60000) {
      G.rec.push({ t: elapsed / 1000, x: G.car.x, y: G.car.y, h: G.car.h });
    }
    if (!fieldOn) {
      (G.track.sectors || []).forEach(function (frac, i) {
        const target = frac * proj.len;
        if (!G.gates[i] && crossed(G.lastS, proj.s, target, proj.len)) {
          G.gates[i] = true;
          G.splits.push(elapsed);
          G.lapSegs[i] = elapsed - (G.segAnchor || G.lapStartMs || 0);
          G.segAnchor = elapsed;
          const bs = G.bestSegs && G.bestSegs[i];
          log((G.track.kind === "ridge" ? "Checkpoint " : "Sector ") + (i + 1) + " · " + fmt(elapsed) +
            (bs ? " · " + fmtSigned(G.lapSegs[i] - bs) : ""));
          if (bs) flashMsg("S" + (i + 1) + " " + fmtSigned(G.lapSegs[i] - bs), G.lapSegs[i] - bs < 0 ? "good" : "bad");
        }
      });
      if (G.track.kind === "ridge") {
        if (!G._ridgeDone && proj.s >= proj.len * 0.982) {
          G._ridgeDone = true;
          G.lap = 1;
          const lapMs = elapsed - (G.lapStartMs || 0);
          G.lastLap = lapMs;
          if (G.bestLap == null || lapMs < G.bestLap) G.bestLap = lapMs;
          finishHeat(elapsed);
        }
      } else if (G.gates.every(Boolean) && crossed(G.lastS, proj.s, 0, proj.len) && G.lastS > proj.len * 0.7) {
        G.lap += 1;
        G.gates = (G.track.sectors || [0, 0, 0]).map(function () { return false; });
        const lapMs = elapsed - (G.lapStartMs || 0);
        G.lastLap = lapMs;
        G.lapTimes.unshift(lapMs);
        const nSeg = (G.track.sectors || []).length + 1;
        G.lapSegs[nSeg - 1] = Math.max(0, elapsed - (G.segAnchor || elapsed));
        G.segAnchor = elapsed;
        const had = G.bestLap;
        if (had == null || lapMs < had) {
          G.bestLap = lapMs;
          G.bestSegs = G.lapSegs.slice(0, nSeg);
          G.segFracs = segFracsFor(G.track);
          saveLapRecord(lapMs, G.bestSegs);
          log((had == null ? "Best lap · " : "New best lap · ") + fmt(lapMs));
          if (had != null) flashMsg("BEST LAP " + fmt(lapMs), "good");
        }
        G.lapSegs = [];
        G.lapStartMs = elapsed;
        log("Lap " + G.lap + " · " + fmt(elapsed));
        if (G.lap >= G.laps) {
          finishHeat(elapsed);
        }
      }
      G.lastS = proj.s;
      if (G.racers && G.racers[0]) G.racers[0].lastS = proj.s;
    }
    wrongWayTick(dt, now, proj);
    flashTick(now);
    heatHud(now);
    draw(now);
  }

  /* Driving the ribbon backwards had no feedback at all. */
  function wrongWayTick(dt, now, proj) {
    const car = G.car;
    if (!car || !proj || !G.track || G.track.kind === "drag") return;
    const tang = Math.atan2(proj.hy, proj.hx);
    const along = Math.cos(wrapDelta(car.h - tang, Math.PI * 2)) * (car.speed >= 0 ? 1 : -1);
    if (along < -0.35 && Math.abs(car.speed) > 4) G.wrongT = (G.wrongT || 0) + dt;
    else G.wrongT = 0;
    if (G.wrongT > 1.1 && now - (G.wrongShown || 0) > 2200) {
      G.wrongShown = now;
      flashMsg("WRONG WAY", "bad");
    }
  }

  function draw(now) {
    const elapsed = G.phase === "race" ? now - G.t0 : 0;
    const gh = opt("ghost") ? ghostAt(elapsed) : null;
    if (use3d && window.Rally3D && Rally3D.active()) {
      const spdAbs = Math.abs(G.car.speed || 0);
      const p1r = G.racers && G.racers[0];
      const thrHeld = !!(G.car.thr > 0.35);
      const drive = (G.craft && G.craft.drive) || "rwd";
      const slip = G.car.wheelSlip || 0;
      let launchBurn = (G.car.gear === 1 || G.car.gear === 2) && thrHeld && spdAbs < 42 &&
        (slip > 0.05 || spdAbs < 24);
      if (drive === "awd") launchBurn = G.car.gear === 1 && thrHeld && slip > 0.18;
      if (drive === "fwd") launchBurn = launchBurn && (slip > 0.1 || spdAbs < 16);
      const ebrakeOn = !!(p1r && p1r.ebrake) || !!G.keys.ShiftLeft;
      const driftBurn = (G.sparks || 0) > 0.28 || (ebrakeOn && spdAbs > 8);
      const burnout = G.mode === "race" && G.phase !== "done" && G.phase !== "idle" && (launchBurn || driftBurn);
      const boostOn = !!(G.car && G.car.boostOn) || (!!G.keys.ShiftRight && (G.car.boost || 0) > 0.04 && !G.keys.ShiftLeft);
      if (veilEl === null) veilEl = $("boostVeil");
      if (veilEl) veilEl.classList.toggle("on", boostOn && !opt("reduceFx"));
      const field = (G.racers || []).slice(1).map(function (r) {
        return {
          car: r.car,
          body: (r.craft && r.craft.body) || "apex",
          paint: parseInt(String((r.craft && r.craft.color) || "#334155").replace("#", ""), 16),
          slot: r.slot,
          boostOn: !!r.boostOn
        };
      });
      const p2r = (G.racers || []).find(function (r) { return r.kind === "human" && r.slot === 1; });
      const p2 = p2r ? p2r.car : null;
      Rally3D.setState({
        car: G.car, ghost: isFieldRace() ? null : gh, ai: G.ai, sparks: G.sparks, reduceFx: opt("reduceFx"),
        aiBody: (G.aiCraft && G.aiCraft.body) || "apex",
        aiPaint: parseInt(String((G.aiCraft && G.aiCraft.color) || "#b45309").replace("#", ""), 16),
        traffic: G.track && G.track.kind === "ridge" ? G.traffic : null,
        gun: {
          on: G.gunOn,
          tracers: G.tracers || [],
          hits: G.gunHits || [],
          kind: G.gunKind || ((G.craft && G.craft.gun && G.craft.gun.kind) || "mg"),
          power: 1 + 0.18 * (G.combo || 0),
          color: (G.craft && G.craft.gun && G.craft.gun.color) || "#ffe08a"
        },
        burnout: burnout,
        boostOn: boostOn,
        body: (G.craft && G.craft.body) || "apex",
        paint: parseInt(String((G.craft && G.craft.color) || "#165e66").replace("#", ""), 16),
        field: field,
        p2: p2,
        cam2: G.camView2 || 0,
        snap: G._camSnap > 0
      });
      if (G._camSnap > 0) G._camSnap -= 1;
      return;
    }
    if (!ctx || !G.track) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const c = ctx;
    c.fillStyle = "#071018";
    c.fillRect(0, 0, w, h);
    const view = Math.round(Number(opt("camView")) || 0);
    const scales = [2.1, 2.85, 3.7, 4.4, 5.2, 1.15];
    const scale = scales[view] || 2.1;
    c.save();
    c.translate(w / 2, h * (view === 5 ? 0.5 : 0.62));
    c.rotate(-G.car.h + Math.PI / 2);
    c.translate(-G.car.x * scale, -G.car.y * scale);
    c.strokeStyle = "#1a3a28";
    c.lineWidth = (G.track.width + 4.5) * 2 * scale;
    c.lineJoin = "round";
    c.beginPath();
    G.track.pts.forEach(function (p, i) {
      if (i === 0) c.moveTo(p.x * scale, p.y * scale);
      else c.lineTo(p.x * scale, p.y * scale);
    });
    if (G.track.closed !== false) c.closePath();
    c.stroke();
    c.strokeStyle = "#334";
    c.lineWidth = G.track.width * 2 * scale;
    c.stroke();
    c.strokeStyle = "#fbbf24";
    c.lineWidth = 2;
    c.stroke();
    const nLn = G.track.lanes || TRACK_LANES;
    const lw = G.track.laneW || LANE_W;
    const nDiv = nLn - 1;
    let di, dlat, prevP, nextP, tx, tz, ln, px, pz;
    c.strokeStyle = "#e2e8f0";
    c.lineWidth = 1.4;
    for (di = 0; di < nDiv; di++) {
      dlat = (di - (nDiv - 1) / 2) * lw;
      c.beginPath();
      G.track.pts.forEach(function (p, i) {
        prevP = G.track.pts[(i - 1 + G.track.pts.length) % G.track.pts.length];
        nextP = G.track.pts[(i + 1) % G.track.pts.length];
        if (G.track.closed === false && i === 0) prevP = p;
        if (G.track.closed === false && i === G.track.pts.length - 1) nextP = p;
        tx = nextP.x - prevP.x; tz = nextP.y - prevP.y;
        ln = Math.hypot(tx, tz) || 1;
        px = -tz / ln; pz = tx / ln;
        const x = (p.x + px * dlat) * scale, y = (p.y + pz * dlat) * scale;
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      });
      if (G.track.closed !== false) c.closePath();
      c.stroke();
    }
    if (gh) {
      c.fillStyle = "rgba(192,132,252,.7)";
      c.beginPath();
      c.arc(gh.x * scale, gh.y * scale, 6, 0, Math.PI * 2);
      c.fill();
    }
    if (G.ai) {
      c.fillStyle = (G.aiCraft && G.aiCraft.color) || "rgba(251,191,36,.85)";
      c.beginPath();
      c.arc(G.ai.x * scale, G.ai.y * scale, 7, 0, Math.PI * 2);
      c.fill();
    }
    (G.racers || []).slice(1).forEach(function (r) {
      c.fillStyle = (r.craft && r.craft.color) || "#94a3b8";
      c.beginPath();
      c.arc(r.car.x * scale, r.car.y * scale, 7, 0, Math.PI * 2);
      c.fill();
    });
    c.fillStyle = G.craft.color;
    c.beginPath();
    c.arc(G.car.x * scale, G.car.y * scale, 7, 0, Math.PI * 2);
    c.fill();
    if (G.traffic && G.track && G.track.kind === "ridge") {
      G.traffic.forEach(function (tc) {
        if (tc.wreck <= 0 && !tc.alive) return;
        c.fillStyle = tc.alive ? "#f59e0b" : "#64748b";
        c.beginPath();
        c.arc(tc.x * scale, tc.y * scale, 6, 0, Math.PI * 2);
        c.fill();
      });
    }
    if (G.gunOn && G.tracers) {
      G.tracers.forEach(function (tr) {
        c.strokeStyle = tr.color || "#fde68a";
        c.lineWidth = tr.kind === "cannon" ? 5 : (tr.kind === "rail" ? 3 : (tr.kind === "needle" ? 1.2 : 2));
        c.beginPath();
        c.moveTo(tr.x * scale, tr.y * scale);
        c.lineTo(tr.x2 * scale, tr.y2 * scale);
        c.stroke();
      });
    }
    c.restore();
  }

  function help(from) {
    G._helpFrom = from || (G.mode === "menu" ? "menu" : "hud");
    showSheet(
      "<p class='kicker'>Controls</p><h2>Haven Rally</h2>" +
      "<ol class='lore'><li>W throttle, Space or S brake, A D steer. Left Shift is e-brake / drift. Right Shift boosts while the gold bar lasts — on Endless it also fires the front guns. Empty bar = no boost, no guns. C cycles camera. V cycles P2 camera in split.</li>" +
      "<li>Auto is normal. Z toggles manual. Then ↑ upshift, ↓ downshift (through N and R). Split: P1 Q/E, P2 O/P. Pad: D-pad up/down, RT/LT still gas and brake.</li>" +
      "<li>Circuits open a grid: Solo ghost, 2P split, vs AI (Reed/Mira/Kai on stacked chassis), or 2P+AI. P2 uses arrows (Ctrl drift, Enter boost) or a pad: stick, RT/LT, A, B, RB.</li>" +
      "<li>Options → Weather: Clear, Dusk, Overcast, Rain, Storm. Wet roads cut grip; Sleet’s AWD keeps more of it.</li>" +
      "<li>Drag: F at the tree stages both lanes. Lane 2 rolls a random live chassis (Apex, Boxcut, Flick, Sleet) with that car’s boost and drive bonuses. It can red-light or miss a shift.</li>" +
      "<li>Stay on the four-lane ribbon. Off-track dumps speed. Drift when you ask more turn than grip. Clip a barrier and the hit costs speed by how square it lands, then the car scrapes along instead of pinning at walking pace. Held brake walks you back out.</li>" +
      "<li>Records: your best lap for each circuit + chassis is kept with its sector splits. The rail shows live split deltas, the bar shows your lap against the record, and a new record flashes on the HUD.</li>" +
      "<li>Driving the ribbon backwards flashes WRONG WAY.</li>" +
      "<li>Endless: wreck traffic to chain combo. Each combo point is +5 mph top speed and stokes the guns. x3 pops vans and trucks. x6 pops a tractor. Apex MG, Boxcut cannons, Flick needles, Sleet rails. Ram a car or leave the asphalt and the chain dumps.</li>" +
      "<li>Hold a slide to charge boost. Right Shift spends it.</li>" +
      "<li>A faster finish writes the ghost for this circuit + craft.</li>" +
      "<li>Garage: pick a chassis and a driver. Driver bonuses stack on the car — accel, top speed, boost tank, boost hit, guns. The in-run plate shows who is driving.</li>" +
      "<li>Options (title card or dock) holds ghost, camera, HUD. New rows land there as the game grows.</li></ol>" +
      "<p class='lore'><a href='./whitepaper.html'>Whitepaper</a> is the spec.</p>" +
      "<button class='btn gold' id='hk'>Back</button>"
    );
    $("hk").onclick = function () {
      if (G._helpFrom === "options") optionsMenu();
      else if (G._helpFrom === "menu" || G.mode === "menu") menu();
      else hideOverlay();
    };
  }

  function statRow(label, val, max) {
    const pct = Math.round(clamp(val / max, 0, 1) * 100);
    return "<div class='stat-row'><span>" + label + "</span><div class='stat-bar'><i style='width:" + pct + "%'></i></div><b>" + val + "</b></div>";
  }

  function garage() {
    if (window.HavenCar) HavenCar.closeStudio();
    const c = craftOf(G.save.craft);
    const d = driverOf(G.save.driver);
    const live = liveCraft(c.id, d.id);
    G.save.craft = c.id;
    writeSave(G.save);
    showSheet(
      "<div class='title-screen garage-screen'>" +
        "<div class='garage-stage'>" +
          "<canvas id='garageCanvas'></canvas>" +
          "<img class='garage-fallback' id='garageFallback' src='" + (c.hero || c.src) + "' alt='" + c.name + "'>" +
          "<div class='garage-stage-fade'></div>" +
          "<p class='garage-hint'>Drag to orbit · pick a bay and a driver</p>" +
        "</div>" +
        "<div class='title-panel'>" +
          "<p class='kicker'>Garage · chassis + driver</p>" +
          "<h1>" + c.name + "</h1>" +
          "<p class='title-tag'>" + c.tag + " · " + d.name + "</p>" +
          "<p class='lore'>" + c.lore + "</p>" +
          "<p class='lore'><b>" + d.name + "</b> — " + d.lore + "</p>" +
          "<p class='lore' style='color:#fbbf24'>" + d.bonus + " stacked on this car.</p>" +
          "<div class='stat-block'>" +
            "<p class='lore'>" + String(live.drive || "rwd").toUpperCase() +
            " · tank " + live.boostTank.toFixed(2) +
            " · boost ×" + live.boostPower.toFixed(2) +
            " · accel ×" + (live.accelMul || 1).toFixed(2) +
            " · vmax ×" + (live.vmaxMul || 1).toFixed(2) + "</p>" +
            statRow("Power", c.hp, 850) +
            statRow("Torque", c.torque, 750) +
            statRow("Grip μ", c.mu, 2) +
            statRow("Turn", c.turn, 2.6) +
            statRow("Boost tank", live.boostTank, 3) +
            "<p class='lore' style='margin-top:.35rem'>Endless gun · <b>" + ((live.gun && live.gun.name) || "Lattice MG") +
            "</b> · dps " + (live.gun && live.gun.dps ? live.gun.dps.toFixed(1) : "—") + "</p>" +
          "</div>" +
          "<p class='kicker' style='margin-top:.85rem'>Bays</p>" +
          "<div class='cast-grid garage-bays'>" +
            CRAFTS.map(function (cr) {
              return "<button type='button' class='cast" + (cr.id === c.id ? " on" : "") + "' data-cast='" + cr.id + "'>" +
                "<img src='" + cr.src + "' alt='" + cr.name + "'><b>" + cr.name + "</b><span>" + cr.tag + "</span></button>";
            }).join("") +
          "</div>" +
          "<p class='kicker' style='margin-top:.85rem'>Drivers</p>" +
          "<div class='cast-grid garage-drivers'>" +
            DRIVERS.map(function (dr) {
              return "<button type='button' class='cast" + (dr.id === d.id ? " on" : "") + "' data-driver='" + dr.id + "'>" +
                "<img src='" + dr.src + "' alt='" + dr.name + "'><b>" + dr.name + "</b><span>" + dr.bonus + "</span></button>";
            }).join("") +
          "</div>" +
          "<div class='modes'>" +
            "<button type='button' class='btn gold' data-go='confirmCraft'>Lock in pair</button>" +
            "<button type='button' class='btn' data-go='title'>Back</button>" +
          "</div>" +
          donateHtml() +
        "</div></div>",
      true
    );
    G._sheet = "garage";
    const cv = $("garageCanvas");
    const fb = $("garageFallback");
    const paint = parseInt(String(c.color).replace("#", ""), 16);
    const ok3 = cv && window.THREE && window.HavenCar && HavenCar.openStudio(cv, { paint: paint, body: c.body || c.id });
    if (ok3) {
      requestAnimationFrame(function () {
        HavenCar.resizeStudio();
        requestAnimationFrame(function () {
          HavenCar.resizeStudio();
          if (fb && HavenCar.studioReady && HavenCar.studioReady()) fb.classList.add("hidden");
        });
      });
    } else if (cv) cv.classList.add("hidden");
  }

  function courseStat(t, short) {
    const d = t.design || {};
    const mi = ((t.len || 0) / 1760).toFixed(2);
    const bits = [mi + " mi", (d.corners || 0) + " corners"];
    if (d.hairpins) bits.push(d.hairpins + (d.hairpins === 1 ? " hairpin" : " hairpins"));
    if (!short && t.style) bits.push(courseTag(t.style));
    return bits.join(" \u00b7 ");
  }

  function thumbPath(ctx, p, w, h) {
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, j, q;
    for (j = 0; j < p.length; j++) {
      q = p[j];
      if (q.x < minx) minx = q.x;
      if (q.x > maxx) maxx = q.x;
      if (q.y < miny) miny = q.y;
      if (q.y > maxy) maxy = q.y;
    }
    const pad = 9;
    const sc = Math.min((w - pad * 2) / Math.max(1, maxx - minx), (h - pad * 2) / Math.max(1, maxy - miny));
    const ox = (w - (maxx - minx) * sc) / 2 - minx * sc;
    const oy = (h - (maxy - miny) * sc) / 2 - miny * sc;
    ctx.beginPath();
    for (j = 0; j <= p.length; j++) {
      q = p[j % p.length];
      const X = q.x * sc + ox, Y = q.y * sc + oy;
      if (j === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.closePath();
    return { sc: sc, ox: ox, oy: oy };
  }

  function paintThumbs() {
    const list = document.querySelectorAll("canvas.track-thumb");
    for (let i = 0; i < list.length; i++) {
      const cv = list[i];
      const key = cv.getAttribute("data-thumb");
      let t = key === "pine" ? PINE : key === "coral" ? CORAL : key === "star" ? STAR : null;
      const ctx = cv.getContext("2d");
      const w = cv.width, h = cv.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#08111a";
      ctx.fillRect(0, 0, w, h);
      if (!t) {
        // custom seed: show the designer's default ribbon as a teaser
        t = makeCustomCircuit((Date.now() / 997) | 0, 4);
      }
      const p = t.ctrl || t.pts;
      if (!p || p.length < 3) continue;
      const m = thumbPath(ctx, p, w, h);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "#38505f";
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.strokeStyle = "#cdd9e4";
      ctx.lineWidth = 4.2;
      ctx.stroke();
      ctx.strokeStyle = "#f0b429";
      ctx.lineWidth = 1.15;
      ctx.setLineDash([3, 4.2]);
      ctx.stroke();
      ctx.setLineDash([]);
      const a = p[0];
      ctx.fillStyle = "#7dd3fc";
      ctx.beginPath();
      ctx.arc(a.x * m.sc + m.ox, a.y * m.sc + m.oy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function menu() {
    G.mode = "menu";
    G.phase = "idle";
    gateLeavePlay();
    G.keys = {};
    G.gunOn = false;
    G.field = "solo";
    G.racers = [];
    showDragUi(false);
    if (use3d && window.Rally3D && Rally3D.setSplit) Rally3D.setSplit(false);
    if ($("splitHud")) $("splitHud").classList.add("hidden");
    if ($("splitBar")) $("splitBar").classList.add("hidden");
    if ($("raceHud")) $("raceHud").classList.remove("hidden");
    if ($("arcadeHud")) $("arcadeHud").classList.add("hidden");
    const flash = $("countFlash");
    if (flash) flash.classList.add("hidden");
    if (window.HavenCar) HavenCar.closeStudio();
    $("app").classList.add("hidden");
    $("boot").classList.add("hidden");
    const name = (G.save.name || "").replace(/[<>]/g, "");
    const c = craftOf(G.save.craft);
    const d = driverOf(G.save.driver);
    showSheet(
      "<div class='title-screen'>" +
        "<div class='title-art'><img src='" + (c.hero || c.src) + "' alt='" + c.name + "'><div class='title-art-fade'></div></div>" +
        "<div class='title-panel'>" +
          "<p class='kicker'>Δ9Φ963 · Excavationpro</p>" +
          "<h1>HAVEN RALLY</h1>" +
          "<p class='title-tag'>Slide the corner. Charge the boost. Beat the ghost.</p>" +
          "<p class='lore'>W throttle · Space brake · A D steer · Z manual · L-Shift drift · R-Shift boost/guns · C camera</p>" +
          "<div class='radio-menu'>" +
            "<button type='button' class='btn' id='menuRadio'>Play radio</button>" +
            "<label class='radio-vol' title='Radio volume'>" +
              "<span>Vol</span>" +
              "<input type='range' id='menuRadioVol' min='0' max='100' step='1' value='" + (window.HavenRadio && HavenRadio.vol ? Math.round(HavenRadio.vol() * 100) : 50) + "' aria-label='Radio volume'>" +
              "<span id='menuRadioVolPct'>" + (window.HavenRadio && HavenRadio.vol ? Math.round(HavenRadio.vol() * 100) : 50) + "%</span>" +
            "</label>" +
          "</div>" +
          "<p class='lore' style='margin:.35rem 0 0'><a href='https://ffm.to/eovnvo9' target='_blank' rel='noopener noreferrer'>Stream Excavationpro</a> · <a href='https://asiancoastline.com/listen.html' target='_blank' rel='noopener'>Free listen</a></p>" +
          "<label style='margin-top:.85rem;display:block'>Operator name</label>" +
          "<input class='name' id='nm' maxlength='24' value='" + name.replace(/'/g, "") + "' placeholder='Operator'>" +
          "<p class='kicker' style='margin-top:.75rem'>Pair</p>" +
          "<div class='garage-chip'>" +
            "<img src='" + d.src + "' alt='" + d.name + "'>" +
            "<div><b>" + d.name + "</b><span>" + d.bonus + "</span></div>" +
            "<img src='" + c.src + "' alt='" + c.name + "'>" +
            "<div><b>" + c.name + "</b><span>" + c.tag + "</span></div>" +
            "<button type='button' class='btn gold' data-go='garage'>Garage</button>" +
          "</div>" +
          "<p class='menu-sec'>Heats · pick a ribbon</p>" +
          "<div class='mode-grid'>" +
            "<button type='button' class='mode-card race-card' data-go='pine'>" +
              "<canvas class='track-thumb' width='104' height='78' data-thumb='pine'></canvas>" +
              "<span class='rc-body'><b>Pine Coil</b><em>" + PINE.laps + " laps · " + courseStat(PINE, true) + "</em>" +
              "<span>" + PINE.lore + "</span></span>" +
            "</button>" +
            "<button type='button' class='mode-card race-card' data-go='coral'>" +
              "<canvas class='track-thumb' width='104' height='78' data-thumb='coral'></canvas>" +
              "<span class='rc-body'><b>Coral Coast</b><em>" + CORAL.laps + " laps · " + courseStat(CORAL, true) + "</em>" +
              "<span>" + CORAL.lore + "</span></span>" +
            "</button>" +
            "<button type='button' class='mode-card race-card' data-go='star'>" +
              "<canvas class='track-thumb' width='104' height='78' data-thumb='star'></canvas>" +
              "<span class='rc-body'><b>Singularity Ring</b><em>" + STAR.laps + " laps · " + courseStat(STAR, true) + "</em>" +
              "<span>" + STAR.lore + "</span></span>" +
            "</button>" +
            "<button type='button' class='mode-card race-card' data-go='custom'>" +
              "<canvas class='track-thumb' width='104' height='78' data-thumb='custom'></canvas>" +
              "<span class='rc-body'><b>Custom race</b><em>Roll a seed · a fresh ribbon every time</em>" +
              "<span>Choose laps and a seed number — the designer builds a closed four-lane circuit from it.</span></span>" +
            "</button>" +
          "</div>" +
          "<p class='menu-sec'>Arcade</p>" +
          "<div class='mode-grid'>" +
            "<button type='button' class='mode-card' data-go='endless'><b>Endless run</b><span>Traffic, boost-guns, combos. Wrecks refill the bar. High score posts to the live hall.</span></button>" +
            "<button type='button' class='mode-card' data-go='drag8'><b>Drag · 1/8 mile</b><span>660 ft. Lane 2 rolls a random live chassis. F runs the tree.</span></button>" +
            "<button type='button' class='mode-card' data-go='drag1k'><b>Drag · 1000 ft</b><span>1000-foot trap vs a random live chassis on the tree.</span></button>" +
            "<button type='button' class='mode-card' data-go='drag14'><b>Drag · 1/4 mile</b><span>1320 ft. Sportsman tree. Beat Lane 2 on the stripe.</span></button>" +
          "</div>" +
          "<p class='menu-sec'>Garage &amp; info</p>" +
          "<div class='mode-grid'>" +
            "<button type='button' class='mode-card' data-go='garage'><b>Garage</b><span>Pick a chassis and a driver. Bonuses stack.</span></button>" +
            "<button type='button' class='mode-card' data-go='options'><b>Options</b><span>Ghost, camera, HUD. Extra rows as the game grows.</span></button>" +
            "<button type='button' class='mode-card' data-go='controls'><b>Controls</b><span>Keys, pad, manual, cameras.</span></button>" +
            "<a class='mode-card' href='./ledger.html'><b>Live hall</b><span>Public heats and endless scores. Names only.</span></a>" +
            "<a class='mode-card' href='./whitepaper.html'><b>Whitepaper</b><span>Physics, circuits, out of scope.</span></a>" +
          "</div>" +
          donateHtml() +
          "<p class='lore' style='margin-top:.8rem'><button type='button' class='btn' id='menuControls'>Controls</button> · <a href='/games/'>All games</a> · Support keeps the arcade on.</p>" +
        "</div></div>",
      true
    );
    if (typeof paintThumbs === "function") paintThumbs();
    if (window.HavenRadio) {
      if (HavenRadio.paint) HavenRadio.paint();
      if (HavenRadio.ensurePlay) HavenRadio.ensurePlay();
    }
    if ($("menuControls")) $("menuControls").onclick = function (e) { e.stopPropagation(); help("menu"); };
    $("overlay").onclick = function (e) {
      const pick = e.target.closest("[data-cast]");
      if (pick) {
        G.save.craft = pick.getAttribute("data-cast");
        writeSave(G.save);
        G.craft = liveCraft(G.save.craft, G.save.driver);
        if (G._sheet === "garage") garage();
        return;
      }
      const drv = e.target.closest("[data-driver]");
      if (drv) {
        G.save.driver = drv.getAttribute("data-driver");
        writeSave(G.save);
        G.craft = liveCraft(G.save.craft, G.save.driver);
        if (G._sheet === "garage") garage();
        return;
      }
      if (e.target.closest("#menuRadio")) {
        const rp = $("radioPlay");
        if (rp) rp.click();
        return;
      }
      const fld = e.target.closest("[data-field]");
      if (fld) {
        G.field = fld.getAttribute("data-field") || "solo";
        const tr = G.pendingTrack;
        if (tr) startHeat(tr);
        return;
      }
      const b = e.target.closest("[data-go]");
      if (!b) return;
      const nm = ($("nm") && $("nm").value || "").replace(/[<>]/g, "").trim().slice(0, 24);
      if (nm) { G.save.name = nm; writeSave(G.save); }
      const go = b.getAttribute("data-go");
      if (go === "options") { optionsMenu(); return; }
      if (go === "controls") { help("menu"); return; }
      if (go === "garage") { garage(); return; }
      if (go === "confirmCraft" || go === "title") { menu(); return; }
      if (go === "custom") { customMenu(); return; }
      if (go === "pine") pickField(PINE);
      if (go === "coral") pickField(CORAL);
      if (go === "star") pickField(STAR);
      if (go === "endless") startHeat(randomTrack((Date.now() ^ (Math.random() * 1e9)) >>> 0));
      if (go === "drag8") startHeat(DRAG_EIGHTH);
      if (go === "drag1k") startHeat(DRAG_THOU);
      if (go === "drag14") startHeat(DRAG_QUARTER);
    };
  }

  window.addEventListener("keydown", function (e) {
    if (e.target && e.target.tagName === "INPUT") return;
    if (e.key === "Escape") {
      if (overlayOpen() && G.mode !== "menu") { hideOverlay(); return; }
      if (overlayOpen() && (G._sheet === "options" || G._sheet === "garage" || G._sheet === "custom")) { menu(); return; }
      menu();
      return;
    }
    if (G.mode === "menu") return;
    if ((e.key === "f" || e.key === "F") && G.track && G.track.kind === "drag" && G.mode === "race") {
      if (!overlayOpen() || $("again")) {
        e.preventDefault();
        spawnDrag(true);
        return;
      }
    }
    if (overlayOpen()) return;
    G.keys[e.code] = true;
    if (e.key === "r" || e.key === "R") { e.preventDefault(); spawnOnGrid(); }
    if (e.key === "z" || e.key === "Z") {
      e.preventDefault();
      const on = !opt("manual");
      setOpt("manual", on);
      log(on ? "Manual · ↑ upshift · ↓ downshift" : "Auto");
    }
    if (e.key === "c" || e.key === "C") {
      e.preventDefault();
      const n = (Math.round(Number(opt("camView")) || 0) + 1) % CAM_NAMES.length;
      setOpt("camView", n);
      log("P1 camera · " + CAM_NAMES[n]);
    }
    if ((e.key === "v" || e.key === "V") && isSplit()) {
      e.preventDefault();
      G.camView2 = ((G.camView2 || 0) + 1) % CAM_NAMES.length;
      if (use3d && window.Rally3D && Rally3D.setCam) Rally3D.setCam({ view2: G.camView2 });
      log("P2 camera · " + CAM_NAMES[G.camView2]);
    }
    if (e.key === " " || e.key === "Enter" || e.key.indexOf("Arrow") === 0) e.preventDefault();
  });
  window.addEventListener("keyup", function (e) { G.keys[e.code] = false; });
  window.addEventListener("blur", function () { G.keys = {}; });
  window.addEventListener("gamepadconnected", function (e) {
    log("Pad " + ((e.gamepad && e.gamepad.index) + 1) + " · " + ((e.gamepad && e.gamepad.id) || "controller"));
  });

  if ($("btnHelp")) $("btnHelp").onclick = help;
  if ($("btnOptions")) $("btnOptions").onclick = optionsMenu;
  if ($("btnPaper")) $("btnPaper").onclick = function () { location.href = "./whitepaper.html"; };
  if ($("btnRestart")) $("btnRestart").onclick = function () { if (G.mode === "race") spawnOnGrid(); };
  if ($("btnMenu")) $("btnMenu").onclick = menu;
  window.addEventListener("resize", function () {
    if (use3d && window.Rally3D) Rally3D.resize();
    if (window.HavenCar) HavenCar.resizeStudio();
  });

  $("boot").classList.add("hidden");
  G.craft = liveCraft(G.save.craft, G.save.driver);
  applyOptions();
  if (window.ArcadeLedger) ArcadeLedger.boot();
  menu();
  requestAnimationFrame(tick);
})();
