/* LYGO Arena — the impact layer.
   Every effect here is a small piece of code drawn in whole pixels, in the arena's own
   palette. Nothing in this file moves a body, spends a point of damage, changes a cooldown
   or decides a target: the sim decides the fight, this decides how it lands.

   The acting is the point, not the sparks. A blow gets a streak where it came from, a
   freeze on contact, a shove, and a recovery. A death gets a dissolve. A body that is
   burning shows it, quietly, under everything else. */
(function (w) {
  "use strict";

  const MAXP = 620;          // hard ceiling; past this we simply stop spawning
  const GRAV = 340;
  const parts = [];
  let q = 1;                 // 0 = off, 1 = full. Set from Options.

  /* ------------------------------------------------------------------ colour --- */
  function toRgb(hex) {
    const s = String(hex || "#e8eef5").replace("#", "");
    const n = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
    const v = parseInt(n, 16);
    if (!isFinite(v)) return [232, 238, 245];
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function toHex(r, g, b) {
    const c = (v) => ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2);
    return "#" + c(r) + c(g) + c(b);
  }
  /* t > 0 burns toward white, t < 0 sinks toward the dark of the ring. */
  function shade(hex, t) {
    const c = toRgb(hex);
    if (t >= 0) return toHex(c[0] + (255 - c[0]) * t, c[1] + (255 - c[1]) * t, c[2] + (255 - c[2]) * t);
    const k = 1 + t;
    return toHex(c[0] * k, c[1] * k, c[2] * k);
  }
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------------------------------------------------------------- emitters --- */
  function dot(x, y, vx, vy, life, col, size, grav, hot) {
    if (parts.length >= MAXP) return;
    parts.push({ k: 0, x: x, y: y, vx: vx, vy: vy, life: life, max: life,
      col: col, size: size || 2, grav: grav == null ? GRAV : grav, hot: !!hot, drag: 2.6 });
  }
  function ring(x, y, r0, r1, life, col, lw, flat) {
    if (parts.length >= MAXP) return;
    parts.push({ k: 1, x: x, y: y, r0: r0, r1: r1, life: life, max: life, col: col, lw: lw || 2, flat: !!flat });
  }
  function streak(x0, y0, x1, y1, life, col, wide) {
    if (parts.length >= MAXP) return;
    parts.push({ k: 2, x0: x0, y0: y0, x1: x1, y1: y1, life: life, max: life, col: col, w: wide || 3 });
  }
  function flash(a, life, col) {
    parts.push({ k: 3, a: a, life: life, max: life, col: col || "#ffffff" });
  }

  /* ------------------------------------------------------------------- events --- */

  /* A blow landed. dir is the angle from the striker to the body that took it. */
  function impact(S, o) {
    if (!q || !S || !o || !o.target) return;
    const t = o.target, src = o.src;
    const col = (o.col) || (src && src.b && src.b.color) || "#f8fafc";
    const share = t.max > 0 ? Math.min(1, (o.dmg || 0) / t.max) : 0.08;
    let dir = o.dir;
    if (dir == null) dir = src ? Math.atan2(t.y - src.y, t.x - src.x) : -Math.PI / 2;
    const hy = t.y - 12;

    /* the shove: presentation only, drawn as an offset, never written to the sim */
    if (src) {
      const push = Math.min(9, 2.2 + share * 26) * (o.crit ? 1.5 : 1) * (o.kind === "shot" ? 0.55 : 1);
      t.rx = (t.rx || 0) + Math.cos(dir) * push;
      t.ry = (t.ry || 0) + Math.sin(dir) * push * 0.55 - push * 0.18;
      /* A body that is hit is briefly wider than it is tall. It is one number and it is
         the difference between a sprite that was struck and a sprite that was not. */
      t.squash = Math.min(1.2, 0.55 + share * 2.2) * (o.crit ? 1.35 : 1);
    }

    /* The contact itself: one hot square, gone in a tenth of a second. Without it a
       burst reads as a cloud that was always there; with it there is a point the blow
       came from and everything else is what came off that point. */
    dot(t.x + Math.cos(dir) * 4, hy + Math.sin(dir) * 3, 0, 0, 0.1, "#ffffff", 4, 0, true);

    /* sparks: a narrow fan down the line of the blow, hot at the core. Narrow and fast,
       because a wide slow spray is the blob that reads as a spell and not as a hit. */
    const n = Math.round((o.crit ? 17 : 10) * (0.55 + share * 1.5) * q);
    for (let i = 0; i < n; i++) {
      const a = dir + rnd(-0.6, 0.6);
      const sp = rnd(70, 250) * (o.crit ? 1.3 : 1);
      const life = rnd(0.18, 0.42);
      dot(t.x + rnd(-3, 3), hy + rnd(-4, 4), Math.cos(a) * sp, Math.sin(a) * sp - rnd(10, 50),
        life, i < 3 ? "#ffffff" : i % 3 ? col : shade(col, 0.45), i < 3 ? 3 : 1 + (i % 2), GRAV, i < 4);
    }
    /* two cold chips of the ring itself, thrown back past the body */
    dot(t.x, hy, -Math.cos(dir) * 30, -40, 0.5, "#6b7280", 2, 420, false);
    dot(t.x + 2, hy + 2, -Math.cos(dir) * 18 + 20, -28, 0.42, "#4b5563", 1, 420, false);

    ring(t.x, t.y - 2, 4, 12 + share * 34, 0.26, shade(col, 0.35), 2, false);
    if (o.kind === "melee" || o.kind === "shot") streak(t.x - Math.cos(dir) * 26, hy - Math.sin(dir) * 12, t.x, hy, 0.13, shade(col, 0.55), o.kind === "melee" ? 4 : 2);

    if (o.crit) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.2832 + rnd(-0.2, 0.2);
        dot(t.x, hy, Math.cos(a) * 120, Math.sin(a) * 120 - 30, 0.3, "#fde68a", 2, 120, true);
      }
      flash(0.08, 0.1, "#fde68a");
      S.shake = Math.max(S.shake || 0, 0.22);
      S.hitStop = Math.max(S.hitStop || 0, 0.035 / Math.max(1, S.speed || 1));
    }
    if (share > 0.16 && !o.dot) {
      S.shake = Math.max(S.shake || 0, 0.12 + share * 0.42);
      S.hitStop = Math.max(S.hitStop || 0, (0.02 + share * 0.05) / Math.max(1, S.speed || 1));
    }
  }

  /* A cast went off. The hand glows and the ring answers. */
  function cast(S, e, vis) {
    if (!q || !e || !e.b) return;
    const col = e.b.color || "#e8eef5";
    for (let i = 0; i < Math.round(5 * q); i++) {
      const a = rnd(0, 6.2832);
      dot(e.x + Math.cos(a) * rnd(2, 8), e.y - 14 + Math.sin(a) * rnd(2, 8),
        Math.cos(a) * rnd(6, 26), -rnd(20, 60), rnd(0.2, 0.45), shade(col, 0.5), rnd(1, 3) | 0, -40, true);
    }
  }

  /* A body is gone. It comes apart into its own colours. */
  function death(S, e) {
    if (!q || !e || !e.b) return;
    const col = e.b.color || "#e8eef5";
    const n = Math.round(20 * q);
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI, 0);
      dot(e.x + rnd(-8, 8), e.y - rnd(6, 28), Math.cos(a) * rnd(10, 80), Math.sin(a) * rnd(40, 150),
        rnd(0.35, 0.85), i % 4 ? col : shade(col, 0.55), rnd(1, 3) | 0, 300, i % 3 === 0);
    }
    /* the part that leaves, slowly */
    for (let i = 0; i < 4; i++) {
      dot(e.x + rnd(-5, 5), e.y - 16, rnd(-10, 10), -rnd(30, 55), rnd(0.8, 1.4), "#e0f2fe", 2, -60, true);
    }
    ring(e.x, e.y, 6, 46, 0.5, shade(col, 0.3), 2, true);
    flash(0.06, 0.09, shade(col, 0.5));
  }

  function clear() { parts.length = 0; }

  /* -------------------------------------------------------------------- frame --- */

  /* Real seconds, never sim seconds: at 8× the fight is quick, the sparks are not. */
  function update(S, dt) {
    if (!parts.length && !S) return;
    const d = Math.min(0.05, Math.max(0, dt || 0));
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= d;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.k === 0) {
        p.vy += p.grav * d;
        const drift = Math.exp(-p.drag * d);
        p.vx *= drift; p.vy *= drift;
        p.x += p.vx * d; p.y += p.vy * d;
      }
    }
    if (!S) return;
    /* the shove springs back, and a burning, bleeding or frozen body keeps saying so */
    const k = 1 - Math.exp(-13 * d);
    (S.your || []).concat(S.foe || []).forEach((e) => {
      if (e.rx) e.rx -= e.rx * k;
      if (e.ry) e.ry -= e.ry * k;
      if (Math.abs(e.rx || 0) < 0.05) e.rx = 0;
      if (Math.abs(e.ry || 0) < 0.05) e.ry = 0;
      if (e.squash) { e.squash -= e.squash * (1 - Math.exp(-17 * d)); if (e.squash < 0.02) e.squash = 0; }
      if (e.dead || !q) return;
      e.fxT = (e.fxT || 0) + d;
      const every = 0.09 / q;
      if (e.fxT < every) return;
      e.fxT = 0;
      if (e.burnT > 0) {
        dot(e.x + rnd(-7, 7), e.y - rnd(10, 30), rnd(-6, 6), -rnd(26, 52), rnd(0.3, 0.6), Math.random() < 0.5 ? "#f97316" : "#fbbf24", Math.random() < 0.4 ? 3 : 2, -50, true);
      }
      if (e.bleedT > 0) {
        dot(e.x + rnd(-6, 6), e.y - rnd(8, 24), rnd(-4, 4), rnd(10, 30), rnd(0.2, 0.45), "#dc2626", 2, 380, false);
      }
      if (e.slowT > 0) {
        dot(e.x + rnd(-8, 8), e.y - rnd(8, 26), rnd(-8, 8), rnd(4, 18), rnd(0.25, 0.55), "#a5f3fc", 1, 40, true);
      }
      if (e.regenT > 0 || e.lifestealT > 0) {
        dot(e.x + rnd(-7, 7), e.y - rnd(2, 16), rnd(-4, 4), -rnd(18, 34), rnd(0.3, 0.55), "#86efac", 2, -30, true);
      }
    });
  }

  /* pass: "under" the bodies (ground rings, dust) or "over" them (sparks, streaks). */
  function draw(ctx, S, pass) {
    if (!ctx || !parts.length) return;
    try {
      const over = pass !== "under";
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const a = Math.max(0, Math.min(1, p.life / p.max));
        if (p.k === 1) {
          if (over) continue;
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.col;
          ctx.lineWidth = p.lw;
          const r = p.r0 + (p.r1 - p.r0) * (1 - a);
          ctx.beginPath();
          if (p.flat) { ctx.ellipse(p.x, p.y, Math.max(1, r), Math.max(1, r * 0.42), 0, 0, 6.2832); }
          else { ctx.arc(p.x, p.y, Math.max(1, r), 0, 6.2832); }
          ctx.stroke();
          ctx.restore();
        } else if (p.k === 2) {
          if (!over) continue;
          ctx.save();
          ctx.globalAlpha = a * 0.92;
          ctx.strokeStyle = p.col;
          ctx.lineCap = "round";
          const steps = 3;
          for (let s = 0; s < steps; s++) {
            const t = s / steps;
            ctx.globalAlpha = a * (0.55 - t * 0.16);
            ctx.lineWidth = Math.max(1, p.w * (1 - t * 0.55));
            ctx.beginPath();
            ctx.moveTo(p.x0 + (p.x1 - p.x0) * t, p.y0 + (p.y1 - p.y0) * t);
            const mx = (p.x0 + p.x1) / 2, my = (p.y0 + p.y1) / 2;
            ctx.quadraticCurveTo(mx, my - p.w * (1 - t) * 1.6, p.x1, p.y1);
            ctx.stroke();
          }
          ctx.restore();
        } else if (p.k === 3) {
          if (!over || !S || !S.lv) continue;
          ctx.save();
          ctx.globalAlpha = a * p.a;
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = p.col;
          ctx.fillRect(0, 0, S.lv.W * 32, S.lv.H * 32);
          ctx.restore();
        } else {
          if (!over) continue;
          ctx.save();
          ctx.globalAlpha = a;
          if (p.hot) ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = p.col;
          const s = Math.max(1, Math.round(p.size));
          /* A cold speck carries a one-pixel dark edge. On the frost and sand floors a
             bright chip in a pale colour was invisible; the edge is what makes it a
             spark on any ring rather than only on the dark ones. */
          if (!p.hot) {
            ctx.save();
            ctx.globalAlpha = a * 0.5;
            ctx.fillStyle = "#0a0f16";
            ctx.fillRect(Math.round(p.x - s / 2) - 1, Math.round(p.y - s / 2) - 1, s + 2, s + 2);
            ctx.restore();
          }
          /* a fast speck leaves a smear: a two-frame line where a square would be a
             dot that teleports between frames */
          const sp = Math.hypot(p.vx, p.vy);
          if (sp > 110) {
            ctx.strokeStyle = p.col;
            ctx.lineWidth = s;
            ctx.beginPath();
            ctx.moveTo(Math.round(p.x - p.vx * 0.028), Math.round(p.y - p.vy * 0.028));
            ctx.lineTo(Math.round(p.x), Math.round(p.y));
            ctx.stroke();
          }
          ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
          ctx.restore();
        }
      }
      if (over) { drawStates(ctx, S); drawReady(ctx, S); }
    } catch (err) {
      parts.length = 0;
      if (w.console) w.console.warn("impact layer skipped:", err && err.message);
    }
  }

  /* What is on a body, drawn on the body. A stun is three stars going round the head, a
     ward is a ring that brightens and dims, a root is a grip at the feet. These are the
     states a spectator has to be able to read without opening the panel. */
  function drawStates(ctx, S) {
    if (!S || !S.lv) return;
    const t = S.time || 0;
    (S.your || []).concat(S.foe || []).forEach((e) => {
      if (e.dead || !e.b) return;
      if (e.stun > 0) {
        for (let i = 0; i < 3; i++) {
          const a = t * 5 + i * 2.094;
          const x = e.x + Math.cos(a) * 10;
          const y = e.y - 32 + Math.sin(a) * 3;
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = i === 1 ? "#fde68a" : "#fbbf24";
          ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
          ctx.restore();
        }
      }
      if (e.shd > 0) {
        ctx.save();
        ctx.globalAlpha = 0.2 + 0.1 * Math.sin(t * 6 + e.uid);
        ctx.strokeStyle = "#7dd3fc";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(e.x, e.y - 10, 17, 0, 6.2832);
        ctx.stroke();
        ctx.restore();
      }
      if (e.root > 0) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "#a16207";
        for (let i = 0; i < 4; i++) {
          const a = i * 1.571 + 0.4;
          ctx.fillRect(Math.round(e.x + Math.cos(a) * 11), Math.round(e.y + Math.sin(a) * 4), 2, 2);
        }
        ctx.restore();
      }
    });
  }

  /* The half second before a blow: a small glint at the hand of a body whose swing has
     come back and whose target is in reach. It is the only wind-up the sim can honestly
     show, because the sim resolves a basic attack on the frame it fires. */
  function drawReady(ctx, S) {
    if (!S || !S.lv) return;
    (S.your || []).concat(S.foe || []).forEach((e) => {
      if (e.dead || !e.target || e.target.dead) return;
      if (!(e.atkCd > 0 && e.atkCd < 0.2) || e.stun > 0 || e.silence > 0) return;
      const a = Math.atan2(e.target.y - e.y, e.target.x - e.x);
      const px = e.x + Math.cos(a) * 11, py = e.y - 14 + Math.sin(a) * 6;
      const k = 1 - e.atkCd / 0.2;
      ctx.save();
      ctx.globalAlpha = 0.25 + k * 0.6;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = shade(e.b.color || "#e8eef5", 0.55);
      const s = 2 + Math.round(k * 2);
      ctx.fillRect(Math.round(px) - s / 2, Math.round(py) - s / 2, s, s);
      ctx.restore();
    });
  }

  function setQuality(v) { q = v ? 1 : 0; if (!q) parts.length = 0; }
  function count() { return parts.length; }

  w.LYGO_FX = { impact: impact, cast: cast, death: death, update: update, draw: draw,
    clear: clear, setQuality: setQuality, quality: () => q, count: count, shade: shade };
})(window);
