/* LYGO Arena — one attack language per kit.
   The sim still resolves the shared move shapes. What a spectator sees and hears is stamped
   per fighter: a name, a drawn swing, and a sound file. Nothing here changes damage. */
(function (w) {
  "use strict";

  const KITS = {
    kael: {
      atk: { vis: "shard", sfx: "kael_shard" },
      rend: { vis: "slash", sfx: "kael_rend" },
      shieldwall: { vis: "ward", sfx: "kael_wall", name: "Door Teeth", text: "The first tooth of the lock comes up, and every eye turns." },
      charge: { vis: "charge", sfx: "kael_charge", name: "Gallant Charge", text: "He crosses the ring and the strike lands with the last stride." }
    },
    vale: {
      shieldhook: { vis: "ward", sfx: "vale_cleave", name: "Shield Hook", text: "The shield's edge catches and turns you into her reach." },
      atk: { vis: "cleave", sfx: "vale_cleave" },
      cover: { vis: "ward", sfx: "vale_cover", name: "Aegis Cover", text: "Her shield leaves her arm and sits on the ally who needs it." },
      bulwark: { vis: "ward", sfx: "vale_line", name: "Line Bulwark", text: "The second circle hardens everyone standing in her shadow." },
      shieldwall: { vis: "ward", sfx: "vale_wall", name: "Aegis Wall", text: "She plants the wall and dares the other team to swing at it." }
    },
    orin: {
      atk: { vis: "sigil", sfx: "orin_sigil" },
      unwrite: { vis: "blast", sfx: "orin_unwrite" },
      resonance: { vis: "flask", sfx: "orin_flask", name: "Name Flask", text: "A black-sigil flask breaks and the names inside bite." },
      chorusflask: { vis: "heal", sfx: "orin_drink", name: "Sigil Drink", text: "One careful sip. The glass remembers who is hurt." }
    },
    nia: {
      atk: { vis: "arrow", sfx: "nia_arrow" },
      pinvolley: { vis: "rain", sfx: "nia_pin" },
      dash: { vis: "charge", sfx: "nia_dash", name: "Path Dash", text: "The corridor shortens under her feet." },
      needlerain: { vis: "rain", sfx: "nia_rain", name: "Path Rain", text: "A fan of path-arrows. Each one keeps going." }
    },
    lyra: {
      atk: { vis: "note", sfx: "lyra_note" },
      hymn: { vis: "howl", sfx: "lyra_hymn" },
      chorus: { vis: "heal", sfx: "lyra_chorus" },
      weavebloom: { vis: "bloom", sfx: "lyra_bloom", name: "Spiral Bloom", text: "A verse takes root and the line grows back." }
    },
    arkos: {
      atk: { vis: "thrust", sfx: "arkos_thrust" },
      geodesic: { vis: "stone", sfx: "arkos_geo" },
      trueline: { vis: "beam", sfx: "arkos_line" },
      dash: { vis: "charge", sfx: "arkos_step", name: "Lance Step", text: "The spear leads. The feet agree." }
    },
    d9ra: {
      atk: { vis: "fist", sfx: "d9ra_fist" },
      shockwave: { vis: "quake", sfx: "d9ra_shock" },
      wolffury: { vis: "rage", sfx: "d9ra_fury" },
      charge: { vis: "charge", sfx: "d9ra_rush", name: "Monk Rush", text: "Fists first, across whatever distance is left." }
    },
    srath: {
      atk: { vis: "needle", sfx: "srath_needle" },
      doublespeak: { vis: "veil", sfx: "srath_veil" },
      needlerain: { vis: "rain", sfx: "srath_rain", name: "Shadow Rain", text: "Needles from the angle you were not watching." },
      dash: { vis: "charge", sfx: "srath_step", name: "Needle Step", text: "She is already past the spot you aimed at." }
    },
    kairos: {
      atk: { vis: "hour", sfx: "kairos_hour" },
      righttime: { vis: "clock", sfx: "kairos_time" },
      borrow: { vis: "clock", sfx: "kairos_borrow" },
      seal9: { vis: "seal", sfx: "kairos_seal", name: "Hour Seal", text: "He spends a second as a door and shuts the room." }
    },
    justicae: {
      writpursuit: { vis: "charge", sfx: "just_blade", name: "Writ of Pursuit", text: "The writ runs faster than the guilty." },
      atk: { vis: "slash", sfx: "just_blade" },
      fairplate: { vis: "ward", sfx: "just_plate" },
      verdict: { vis: "slash", sfx: "just_verdict" },
      bulwark: { vis: "ward", sfx: "just_wall", name: "Accord Wall", text: "Fairness, worn as plate, shared with the line." }
    },
    seidon: {
      atk: { vis: "tide", sfx: "seidon_tide" },
      undertow: { vis: "tide", sfx: "seidon_tow" },
      current: { vis: "tide", sfx: "seidon_current" },
      geodesic: { vis: "tide", sfx: "seidon_lob", name: "Tide Lob", text: "A crest thrown on the shortest line across the ring." }
    },
    sancora: {
      atk: { vis: "flask", sfx: "sancora_vial" },
      chorusflask: { vis: "heal", sfx: "sancora_flask" },
      weavebloom: { vis: "bloom", sfx: "sancora_bloom", name: "Weave Bloom", text: "The flask roots. Four pulses follow." },
      cover: { vis: "ward", sfx: "sancora_cover", name: "Chem Cover", text: "A pane of brew between an ally and the next hit." }
    },
    lightfather: {
      atk: { vis: "seal", sfx: "lf_bolt" },
      seal9: { vis: "seal", sfx: "lf_seal" },
      provenance: { vis: "heart", sfx: "lf_prove" },
      standard: { vis: "ward", sfx: "lf_cover", name: "Standard Raised", text: "The standard goes up and the line stands round it." },
      cover: { vis: "ward", sfx: "lf_cover", name: "Remembered Cover", text: "He puts the shield back on the one the crypt already counted out." }
    },
    wraith: {
      atk: { vis: "wisp", sfx: "wraith_bolt" },
      wail: { vis: "howl", sfx: "wraith_wail" },
      draincloud: { vis: "drain", sfx: "wraith_cloud", name: "Wraith Cloud", text: "A scrap of unwriting, thrown because it has no hands." }
    },
    brute: {
      irongrip: { vis: "quake", sfx: "brute_sweep", name: "Iron Grip", text: "It reaches. The reach ends the argument." },
      atk: { vis: "cleave", sfx: "brute_sweep" },
      pound: { vis: "quake", sfx: "brute_pound", name: "Brute Pound", text: "Both fists. The floor answers in a straight line." },
      wardfield: { vis: "ward", sfx: "brute_ward", name: "Brute Ward", text: "It hunches, and the crypt's ward sits on its shoulders." }
    },
    imp: {
      atk: { vis: "fire", sfx: "imp_claw", name: "Coal Claw", text: "A hot grab. The coal was never meant to stay in its hand." },
      impfire: { vis: "fire", sfx: "imp_fire" },
      flicker: { vis: "veil", sfx: "imp_flick", name: "Coal Blink", text: "It steps through the heat and comes out beside you." }
    },
    hurler: {
      atk: { vis: "fist", sfx: "hurler_fist", name: "Stone Fist" },
      lobstone: { vis: "stone", sfx: "hurler_lob" },
      pound: { vis: "quake", sfx: "hurler_pound", name: "Hurler Pound", text: "The same arms that throw, brought down on the stone." }
    },
    shade: {
      atk: { vis: "claw", sfx: "shade_claw" },
      flicker: { vis: "veil", sfx: "shade_flick", name: "Veil Step", text: "One of its two places stops being the real one." },
      snatch: { vis: "drain", sfx: "shade_snatch", name: "Shade Snatch", text: "A claw through the rib. It keeps what spills." }
    },
    thief: {
      atk: { vis: "thrust", sfx: "thief_stab" },
      snatch: { vis: "drain", sfx: "thief_snatch", name: "Tithe Snatch", text: "The cut and the coin leave in the same motion." },
      flicker: { vis: "veil", sfx: "thief_flick", name: "Coin Flicker", text: "Gone before the roll finishes." }
    },
    drain: {
      gravstep: { vis: "charge", sfx: "drain_touch", name: "Grave Step", text: "It is behind you before the light changes." },
      atk: { vis: "drain", sfx: "drain_touch" },
      unmake: { vis: "drain", sfx: "drain_unmake" },
      draincloud: { vis: "drain", sfx: "drain_cloud", name: "Unwriting", text: "The sentence you were in comes apart in the air." }
    },
    gate: {
      gate_haul: { vis: "quake", sfx: "gate_slam", name: "Gate Haul", text: "The gate does not come to you. The gate decides." },
      atk: { vis: "stomp", sfx: "gate_slam" },
      gateslam: { vis: "quake", sfx: "gate_quake" },
      gateward: { vis: "ward", sfx: "gate_ward", name: "Gate Ward", text: "The door closes its own ward around itself." },
      callwards: { vis: "summon", sfx: "gate_call" }
    },
    crown: {
      decree: { vis: "quake", sfx: "crown_fist", name: "Decree", text: "The crown does not chase. It summons." },
      atk: { vis: "fist", sfx: "crown_fist" },
      regalvolley: { vis: "crown", sfx: "crown_volley" },
      lobstone: { vis: "stone", sfx: "crown_stone", name: "Crown Stone", text: "A flagstone off its own shoulders, lobbed on an arc." }
    },
    smith: {
      atk: { vis: "forge", sfx: "smith_bolt" },
      anvil: { vis: "fire", sfx: "smith_anvil" },
      temperwork: { vis: "ward", sfx: "smith_anvil", name: "Temper Work", text: "He re-tempers what the fight has bent." },
      gatecannon: { vis: "beam", sfx: "smith_cannon", name: "Forge Cannon", text: "The workbench speaks in a straight white-hot line." }
    },
    heartboss: {
      cryptsurge: { vis: "charge", sfx: "heart_strike", name: "Crypt Surge", text: "The floor carries it forward." },
      atk: { vis: "heart", sfx: "heart_strike" },
      heartbeat: { vis: "heart", sfx: "heart_beat" },
      cryptward: { vis: "ward", sfx: "heart_ward" }
    },
    levi: {
      atk: { vis: "deep", sfx: "levi_bolt" },
      tidecrush: { vis: "tide", sfx: "levi_crush" },
      undertow: { vis: "tide", sfx: "levi_tow", name: "Deep Undertow", text: "The depth reaches up and keeps the ankles." }
    },
    tithe: {
      collection: { vis: "charge", sfx: "tithe_claw", name: "Collection", text: "The tithe is taken where it stands." },
      atk: { vis: "claw", sfx: "tithe_claw" },
      tithe: { vis: "drain", sfx: "tithe_tax" },
      snatch: { vis: "drain", sfx: "tithe_snatch", name: "King's Snatch", text: "The toll, taken by hand." }
    },
    unnamer: {
      atk: { vis: "unname", sfx: "unnamer_bolt" },
      nameless: { vis: "seal", sfx: "unnamer_name" },
      unmake: { vis: "drain", sfx: "unnamer_eat", name: "Eat the Name", text: "It is not interested in the body. The name comes off first." }
    },
    lock: {
      atk: { vis: "lock", sfx: "lock_bolt" },
      lockseal: { vis: "seal", sfx: "lock_seal" },
      gatecannon: { vis: "beam", sfx: "lock_cannon", name: "Lock Cannon", text: "The unfinished door fires the line it was built to keep." }
    },
    wolf: {
      atk: { vis: "bite", sfx: "wolf_bite" },
      bite: { vis: "lunge", sfx: "wolf_pack" },
      roar: { vis: "howl", sfx: "wolf_howl", name: "Ash Howl", text: "The pack answers. The nearest line flinches." }
    },
    lion: {
      atk: { vis: "claw", sfx: "lion_claw", name: "Sun Claw" },
      soljump: { vis: "charge", sfx: "lion_leap" },
      roar: { vis: "howl", sfx: "lion_roar", name: "Sun Roar", text: "It picks the wounded one out loud, then leaves the ground." }
    },
    bear: {
      maulgrip: { vis: "quake", sfx: "bear_swipe", name: "Maul Grip", text: "It takes your feet out and holds you where it wants you." },
      atk: { vis: "cleave", sfx: "bear_swipe", name: "Iron Swipe" },
      maul: { vis: "quake", sfx: "bear_swipe" },
      wardfield: { vis: "ward", sfx: "bear_ward", name: "Iron Ward", text: "Ironhide sets its shoulders and becomes the door." }
    },
    elephant: {
      tuskcharge: { vis: "charge", sfx: "elephant_tusk", name: "Tusk Charge", text: "The whole weight arrives at once." },
      atk: { vis: "tusk", sfx: "elephant_tusk" },
      stomp: { vis: "trample", sfx: "elephant_trample", name: "Trample", text: "Tusks first, then the whole weight. The floor does not get a vote." },
      pound: { vis: "quake", sfx: "elephant_quake", name: "Tusk Quake", text: "Both tusks hit the stone and the ring jumps." }
    },
    scorpion: {
      atk: { vis: "barb", sfx: "scorp_barb" },
      clamp: { vis: "clamp", sfx: "scorp_clamp" },
      flicker: { vis: "veil", sfx: "scorp_flick", name: "Barb Flicker", text: "The tail is already where the body is going." }
    }
  };

  function kit(id) {
    const raw = KITS[id] || {};
    const moves = {};
    Object.keys(raw).forEach((k) => { if (k !== "atk") moves[k] = raw[k]; });
    return { atk: raw.atk || {}, moves: moves };
  }

  function sfxNames() {
    const out = [];
    const seen = {};
    Object.keys(KITS).forEach((id) => {
      Object.keys(KITS[id]).forEach((k) => {
        const s = KITS[id][k].sfx;
        if (s && !seen[s]) { seen[s] = 1; out.push(s); }
      });
    });
    return out;
  }

  function saltOf(id) {
    let h = 2166136261;
    const s = String(id || "");
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function cast(S, e, vis, x2, y2) {
    if (!S.swings) S.swings = [];
    S.swings.push({
      vis: vis || "slash",
      x: e.x, y: e.y - 10,
      x2: x2 == null ? e.x : x2, y2: y2 == null ? e.y : y2,
      a: Math.atan2((y2 == null ? e.y : y2) - e.y, (x2 == null ? e.x : x2) - e.x),
      life: 0.46, max: 0.46,
      col: (e.b && e.b.color) || "#e8eef5",
      salt: saltOf(e.b && e.b.id) % 5
    });
  }

  function pose(e) {
    if (!e.animT || !e.animVis) return null;
    const k = e.animT / (e.animMax || 0.34);
    const a = e.aimA || 0;
    const v = e.animVis;
    const melee = { bite: 1, lunge: 1, charge: 1, tusk: 1, thrust: 1, claw: 1, slash: 1, cleave: 1, fist: 1, barb: 1, clamp: 1, stomp: 1 };
    const hop = melee[v] ? 12 * k : 5 * k;
    const heavy = v === "trample" || v === "stomp" || v === "quake";
    const sy = heavy ? 1 - 0.22 * Math.sin(k * Math.PI) : 1;
    /* A slam squats on the feet that threw it. Hopping along a heading that is
       still settling is the lunge that reads as a spin. */
    if (heavy) return { dx: 0, dy: 0, sx: 1.12, sy: sy };
    return { dx: Math.cos(a) * hop, dy: Math.sin(a) * hop * 0.72, sx: 1, sy: sy };
  }

  /* A stomp, a quake and a trample belong under the body that threw them.
     Drawn on the target, Gate's slam played on somebody else while he twitched. */
  const AT_TARGET = { blast: 1, heal: 1, bloom: 1, rain: 1, crown: 1, stone: 1, flask: 1, fire: 1, heart: 1 };

  /* A soft halo under a hard core. The halo is what reads on a broadcast. */
  function halo(ctx, draw) {
    ctx.save();
    ctx.globalAlpha *= 0.34;
    ctx.lineWidth = (ctx.lineWidth || 3) + 7;
    draw();
    ctx.restore();
    draw();
  }
  function arc(ctx, p, wide) {
    const reach = 22 + p * 26;
    const sweep = () => {
      ctx.beginPath();
      ctx.arc(0, 0, reach, -wide, wide);
      ctx.stroke();
    };
    halo(ctx, sweep);
    ctx.lineWidth = 1.5;
    ctx.globalAlpha *= 0.85;
    ctx.beginPath();
    ctx.arc(0, 0, reach * 0.62, -wide * 0.7, wide * 0.7);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = -wide + (i / 5) * wide * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * reach, Math.sin(a) * reach, 1.7, 0, 6.2832);
      ctx.fill();
    }
  }
  function rings(ctx, p, n) {
    for (let i = 0; i < n; i++) {
      const rad = 8 + p * (20 + i * 16);
      const ring = () => {
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, 6.2832);
        ctx.stroke();
      };
      halo(ctx, ring);
    }
  }
  function motes(ctx, p, n, spread) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.2832 + p * 2.4;
      const r = spread * (0.25 + p);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r - p * 6, 1.5 + (1 - p) * 1.4, 0, 6.2832);
      ctx.fill();
    }
  }
  function jaws(ctx, p) {
    const open = 0.5 + Math.sin(p * Math.PI) * 0.55;
    const tooth = (sign) => {
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(24, sign * 11 * open);
      ctx.lineTo(15, sign * 2);
      ctx.closePath();
    };
    ctx.save();
    ctx.globalAlpha *= 0.4;
    ctx.lineWidth = 7;
    tooth(-1); ctx.stroke();
    tooth(1); ctx.stroke();
    ctx.restore();
    tooth(-1); ctx.fill();
    tooth(1); ctx.fill();
    ctx.beginPath();
    ctx.arc(22, 0, 2.2, 0, 6.2832);
    ctx.fill();
  }
  function tusks(ctx, p) {
    const reach = 16 + p * 20;
    const horns = () => {
      ctx.beginPath(); ctx.moveTo(2, -4); ctx.quadraticCurveTo(reach * 0.6, -16, reach, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, 4); ctx.quadraticCurveTo(reach * 0.6, 16, reach, 2); ctx.stroke();
    };
    ctx.lineWidth = 4;
    halo(ctx, horns);
    ctx.beginPath(); ctx.arc(reach, -2, 2.2, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(reach, 2, 2.2, 0, 6.2832); ctx.fill();
  }
  function cracks(ctx, p) {
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = i * 1.047 + 0.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
      ctx.lineTo(Math.cos(a) * (12 + p * 22), Math.sin(a) * (8 + p * 14));
      ctx.stroke();
    }
  }

  function paint(ctx, s) {
    const p = 1 - s.life / s.max;
    const v = s.vis;
    ctx.save();
    if (AT_TARGET[v]) ctx.translate(s.x2, s.y2);
    else { ctx.translate(s.x, s.y); ctx.rotate(s.a || 0); }
    const ground = v === "trample" || v === "stomp" || v === "quake";
    if (ground) {
      ctx.restore();
      ctx.save();
      ctx.translate(s.x, s.y + 6);
    }
    ctx.globalAlpha = Math.max(0.08, (1 - p) * 0.98);
    ctx.strokeStyle = s.col;
    ctx.fillStyle = s.col;
    ctx.lineWidth = 3;
    if (ground) {
      ctx.save();
      ctx.globalAlpha *= 0.45;
      ctx.scale(1, 0.42);
      rings(ctx, p, v === "trample" ? 3 : 2);
      ctx.restore();
      cracks(ctx, p);
      motes(ctx, p, 8, 28);
    }
    else if (v === "bite" || v === "lunge") jaws(ctx, p);
    else if (v === "tusk") tusks(ctx, p);
    else if (v === "clamp" || v === "barb") {
      const gap = 12 * (1 - Math.sin(p * Math.PI));
      const claws = () => {
        ctx.strokeRect(-4, -14 - gap, 18, 6);
        ctx.strokeRect(-4, 8 + gap, 18, 6);
      };
      ctx.lineWidth = 3;
      halo(ctx, claws);
      if (v === "barb") {
        const tail = () => { ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(36, -4 + p * 8); ctx.stroke(); };
        halo(ctx, tail);
      }
      motes(ctx, p, 5, 20);
    }
    else if (v === "cleave") { arc(ctx, p, 1.35); motes(ctx, p, 5, 26); }
    else if (v === "slash" || v === "claw") {
      arc(ctx, p, v === "claw" ? 0.7 : 0.95);
      if (v === "claw") { ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(24, -12); ctx.moveTo(8, 0); ctx.lineTo(26, 0); ctx.moveTo(8, 6); ctx.lineTo(24, 12); ctx.stroke(); }
      motes(ctx, p, 4, 20);
    }
    else if (v === "thrust" || v === "beam") {
      const len = 34 + p * 48;
      const shaft = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke(); };
      ctx.lineWidth = v === "beam" ? 6 : 3;
      halo(ctx, shaft);
      ctx.beginPath(); ctx.arc(len, 0, v === "beam" ? 5 : 3, 0, 6.2832); ctx.fill();
    }
    else if (v === "fist" || v === "rage") {
      rings(ctx, p, v === "rage" ? 3 : 2);
      motes(ctx, p, v === "rage" ? 8 : 5, 22);
    }
    else if (v === "ward" || v === "seal" || v === "howl" || v === "clock") {
      rings(ctx, p, v === "howl" ? 3 : 2);
      ctx.save();
      ctx.rotate(p * 1.4);
      ctx.strokeRect(-8, -8, 16, 16);
      ctx.restore();
      motes(ctx, p, 6, 24);
    }
    else if (v === "heal" || v === "bloom" || v === "heart") {
      rings(ctx, p, 2);
      ctx.globalAlpha *= 0.9;
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05 + s.salt;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 10, -6 - p * (12 + i * 3), 2.2, 0, 6.2832);
        ctx.fill();
      }
    }
    else if (v === "rain" || v === "crown") {
      for (let i = -3; i <= 3; i++) {
        const x = i * 8;
        const y0 = -30 + ((i + 3) % 2) * 6;
        const y1 = -2 + p * 20;
        ctx.save();
        ctx.globalAlpha *= 0.9;
        ctx.lineWidth = v === "crown" ? 2.5 : 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x + (v === "rain" ? 2 : 0), y1);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y1, 2, 0, 6.2832);
        ctx.fill();
        ctx.restore();
      }
      if (v === "crown") {
        ctx.beginPath();
        ctx.arc(0, -16, 11, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
      }
      motes(ctx, p, 5, 18);
    }
    else if (v === "stone") {
      ctx.lineWidth = 3;
      ctx.strokeRect(-8, -22 + p * 24, 16, 16);
      cracks(ctx, p);
    }
    else if (v === "flask" || v === "fire") {
      for (let i = 0; i < 8; i++) {
        const a = i * 0.78 + s.salt;
        const rise = p * (10 + (i % 3) * 6);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * (6 + p * 18), Math.sin(a) * (5 + p * 12) - rise, 2.4 + (i % 2), 0, 6.2832);
        ctx.fill();
      }
      rings(ctx, p, 1);
    }
    else if (v === "tide" || v === "deep") {
      for (let i = 0; i < 3; i++) {
        const wave = () => {
          ctx.beginPath();
          ctx.moveTo(-26, 6 + i * 5);
          ctx.quadraticCurveTo(-8, -12 - p * 10 - i * 3, 4, 4);
          ctx.quadraticCurveTo(14, 14 + p * 8, 28, 2);
          ctx.stroke();
        };
        halo(ctx, wave);
      }
    }
    else if (v === "drain" || v === "unname") {
      for (let i = 0; i < 3; i++) {
        /* A ring that has collapsed is SKIPPED, never handed to arc(). At i=2 with p near
           1 this radius is 18 - 12 - 8: negative, and a negative radius makes the canvas
           throw IndexSizeError. The throw kills the rest of the frame, and the crowd ring
           is drawn at the very end of the frame, so on every late frame of a Drain Cloud
           or an Unname the stands were never drawn and the dark base coat was left around
           the arena. That is the whole bug report: the crowd flickering out when something
           happens in the fight. */
        const r = 18 - p * 12 - i * 4;
        if (r <= 0.6) continue;
        ctx.beginPath();
        ctx.arc(0, 0, r, p * 5 + i, p * 5 + i + 3.4);
        ctx.stroke();
      }
      motes(ctx, p, 5, 14);
    }
    else if (v === "veil") {
      ctx.globalAlpha *= 0.75;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc((i - 1) * 12 * p, -4 + i * 3, 12 - i * 2, 0, 6.2832);
        ctx.stroke();
      }
    }
    else if (v === "summon") { rings(ctx, p, 3); motes(ctx, p, 8, 20); }
    else if (v === "note") {
      for (let i = 0; i < 3; i++) {
        const y = -4 - i * 8 - p * 6;
        ctx.beginPath(); ctx.ellipse(8 + i * 4, y, 5, 3.5, -0.5, 0, 6.2832); ctx.fill();
        ctx.fillRect(12 + i * 4, y - 12, 2, 12);
      }
    }
    else if (v === "blast") { rings(ctx, p, 3); motes(ctx, p, 10, 30); cracks(ctx, p); }
    else if (v === "shard") {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(28 + p * 18, -8); ctx.lineTo(14, 0); ctx.lineTo(28 + p * 18, 8); ctx.closePath();
      ctx.fill();
      ctx.globalAlpha *= 0.55;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(20 + p * 12, -4); ctx.lineTo(10, 0); ctx.lineTo(20 + p * 12, 4); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    else if (v === "sigil") {
      ctx.save();
      ctx.rotate(p * 0.8);
      const mark = () => {
        ctx.strokeRect(-10, -10, 20, 20);
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.stroke();
      };
      halo(ctx, mark);
      ctx.restore();
      motes(ctx, p, 6, 18);
    }
    else if (v === "charge") {
      const dash = () => {
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(22 + p * 46, 0);
        ctx.stroke();
      };
      ctx.lineWidth = 4;
      halo(ctx, dash);
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-6 - i * 8, -5 + i);
        ctx.lineTo(8 + p * 20 - i * 6, 0);
        ctx.stroke();
      }
    }
    /* A gun's basic already flies as a shot. The flourish at the hand was a sword arc. */
    else if (v === "arrow" || v === "needle" || v === "hour" || v === "wisp" || v === "forge" || v === "lock") {
      ctx.globalAlpha *= 0.8;
      ctx.beginPath(); ctx.arc(8 + p * 6, 0, 3.5 + p * 2.5, 0, 6.2832); ctx.stroke();
    }
    else arc(ctx, p, 0.9);
    ctx.restore();
  }

  function draw(ctx, S) {
    (S.swings || []).forEach((s) => paint(ctx, s));
  }

  function shot(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a || 0);
    ctx.fillStyle = p.col || "#fbbf24";
    ctx.strokeStyle = p.col || "#fbbf24";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.95;
    const v = p.vis || "shard";
    ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-4, 0); ctx.stroke();
    ctx.globalAlpha = 0.95;
    if (v === "arrow" || v === "needle" || v === "rain") {
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-11, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(4, 4); ctx.lineTo(4, -4); ctx.fill();
    } else if (v === "note") {
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 4, -0.4, 0, 6.2832); ctx.fill();
      ctx.fillRect(5, -12, 2, 12);
    } else if (v === "hour" || v === "clock") {
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, 6.2832); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -5); ctx.lineTo(4, 0); ctx.stroke();
    } else if (v === "tide" || v === "deep") {
      ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, 6.2832); ctx.fill();
    } else if (v === "flask" || v === "forge" || v === "fire") {
      ctx.fillRect(-3, -5, 6, 8);
      ctx.beginPath(); ctx.arc(0, -6, 3, 0, 6.2832); ctx.fill();
    } else if (v === "seal" || v === "lock" || v === "sigil") {
      ctx.strokeRect(-5, -5, 10, 10);
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();
    } else if (v === "wisp" || v === "unname" || v === "drain") {
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.arc(-6, 1, 3, 0, 6.2832); ctx.fill();
    } else if (v === "stone" || v === "crown") {
      ctx.fillRect(-5, -5, 10, 10);
    } else {
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, 5); ctx.lineTo(-2, 0); ctx.lineTo(-5, -5); ctx.fill();
    }
    ctx.restore();
  }

  w.LYGO_ATTACKS = { kit: kit, sfxNames: sfxNames, cast: cast, pose: pose, draw: draw, shot: shot, kits: KITS };
})(window);
