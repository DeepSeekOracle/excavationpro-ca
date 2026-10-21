export function styleRgb(style) {
  if (style === "fracture") return "186, 140, 232";
  if (style === "seal") return "143, 208, 200";
  if (style === "claw") return "232, 164, 96";
  if (style === "moon") return "215, 211, 240";
  return "228, 194, 122";
}

export function strikeKind(att) {
  const overlay = att && att.overlay;
  if (overlay === "slash" || overlay === "bolt" || overlay === "arc" || overlay === "breath") return overlay;
  if (att && (att.style === "claw" || att.family === "claw")) return "slash";
  return att && (att.reach || 1) > 1 ? "bolt" : "slash";
}

export function strikeDur(kind) {
  if (kind === "bolt" || kind === "breath" || kind === "heal") return 460;
  if (kind === "arc") return 360;
  return 280;
}

export function drawFightFx(ctx, fx, p, tw, th) {
  if (fx.kind === "bolt") drawBolt(ctx, fx, p);
  else if (fx.kind === "arc") drawArc(ctx, fx, p, tw, th);
  else if (fx.kind === "breath") drawBreath(ctx, fx, p);
  else if (fx.kind === "heal") drawHeal(ctx, fx, p);
  else if (fx.kind === "self" || fx.kind === "veil" || fx.kind === "oath" || fx.kind === "haste") drawBurst(ctx, fx, p, tw);
  else drawSlash(ctx, fx, p, tw, th);
}

export function drawImpactFx(ctx, fx, now) {
  if (fx.impactT == null) return;
  const age = (now - fx.impactT) / 420;
  if (age < 0 || age >= 1) return;
  const rgb = burstRgb(fx);
  ctx.save();
  ctx.strokeStyle = "rgba(" + rgb + "," + (1 - age) + ")";
  ctx.lineWidth = fx.kind === "self" ? 3 : 2;
  ctx.beginPath();
  if (fx.kind === "self") shieldPath(ctx, fx.to.x, fx.to.y - 8, 10 + age * 28);
  else ctx.arc(fx.to.x, fx.to.y, 8 + age * 36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(" + rgb + "," + (0.22 * (1 - age)) + ")";
  ctx.fill();
  ctx.restore();
}

export function drawBodyAura(ctx, spec) {
  const pulse = spec.quiet ? 0.85 : (0.55 + 0.45 * Math.sin(performance.now() / 280));
  const cx = spec.cx;
  const mid = spec.footY - spec.h * 0.46;
  if (spec.preview) {
    ctx.save();
    ctx.globalAlpha = 0.45 + pulse * 0.25;
    ctx.strokeStyle = "rgba(228, 194, 122, 0.95)";
    ctx.lineWidth = 2;
    shieldPath(ctx, cx, mid, spec.h * 0.22);
    ctx.stroke();
    ctx.restore();
  }
  if (spec.guard) {
    ctx.save();
    ctx.globalAlpha = 0.55 + pulse * 0.4;
    ctx.fillStyle = "rgba(228, 194, 122, 0.16)";
    ctx.strokeStyle = "rgba(244, 239, 228, 0.95)";
    ctx.lineWidth = 2.5;
    shieldPath(ctx, cx, mid, spec.h * 0.26);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  (spec.boons || []).forEach((boon) => {
    if (boon.kind === "veil") {
      ctx.save();
      ctx.globalAlpha = 0.35 + pulse * 0.35;
      ctx.strokeStyle = "rgba(143, 208, 200, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, mid, spec.tw * 0.34, spec.h * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (boon.kind === "oath") {
      ctx.save();
      ctx.strokeStyle = "rgba(196, 132, 60," + (0.45 + pulse * 0.5) + ")";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      for (let i = -1; i <= 1; i++) {
        const y = spec.quiet ? mid - spec.h * 0.2 : mid - spec.h * (0.12 + pulse * 0.16);
        ctx.beginPath();
        ctx.moveTo(cx + i * 8, y);
        ctx.lineTo(cx + i * 8, y - 12);
        ctx.stroke();
      }
      ctx.restore();
    } else if (boon.kind === "haste") {
      ctx.save();
      ctx.strokeStyle = "rgba(228, 194, 122, 0.7)";
      ctx.lineWidth = 1.5;
      const slip = spec.quiet ? 8 : 6 + pulse * 10;
      ctx.beginPath();
      ctx.ellipse(cx - slip, mid, spec.tw * 0.22, spec.h * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.ellipse(cx - slip * 1.8, mid, spec.tw * 0.16, spec.h * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  });
}

function burstRgb(fx) {
  if (fx.kind === "heal" || fx.kind === "veil") return "143, 208, 200";
  if (fx.kind === "oath") return "196, 132, 60";
  if (fx.kind === "self") return "228, 194, 122";
  return styleRgb(fx.style);
}

function shieldPath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.95, y - r * 0.15, x + r * 0.7, y + r * 0.2);
  ctx.quadraticCurveTo(x, y + r * 1.15, x - r * 0.7, y + r * 0.2);
  ctx.quadraticCurveTo(x - r * 0.95, y - r * 0.15, x, y - r);
  ctx.closePath();
}

function drawSlash(ctx, fx, p, tw, th) {
  const claw = fx.style === "claw" || fx.family === "claw";
  if (claw) {
    drawClaw(ctx, fx, p, tw);
    return;
  }
  const ang = Math.atan2(fx.to.y - fx.from.y, fx.to.x - fx.from.x);
  const along = 0.55 + 0.3 * Math.min(1, p);
  const mx = fx.from.x + (fx.to.x - fx.from.x) * along;
  const my = fx.from.y + (fx.to.y - fx.from.y) * along;
  const rgb = styleRgb(fx.style);
  const swing = (p - 0.15) * 1.4;
  const radius = tw * 0.34 * (fx.radius || 1);
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(ang);
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(" + rgb + ",0.95)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(0, 0, radius, -1.15 + swing, -0.15 + swing);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(tw * 0.08, th * 0.12, tw * 0.26 * (fx.radius || 1), -1.05 + swing, -0.2 + swing);
  ctx.stroke();
  ctx.strokeStyle = "rgba(244, 239, 228, 0.92)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, -0.7 + swing, -0.28 + swing);
  ctx.stroke();
  ctx.restore();
}

function drawClaw(ctx, fx, p, tw) {
  const ang = Math.atan2(fx.to.y - fx.from.y, fx.to.x - fx.from.x);
  const along = 0.62 + 0.28 * Math.min(1, p);
  const mx = fx.from.x + (fx.to.x - fx.from.x) * along;
  const my = fx.from.y + (fx.to.y - fx.from.y) * along;
  const len = tw * 0.34 * (0.45 + Math.min(1, p));
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(ang);
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(232, 164, 96, 0.95)";
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-6, i * 6);
    ctx.lineTo(len, i * 5 - 6);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(244, 239, 228, 0.8)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len * 0.85, -4);
  ctx.stroke();
  ctx.restore();
}

function drawBolt(ctx, fx, p) {
  if (fx.style === "fracture") {
    drawCrack(ctx, fx, p);
    return;
  }
  const rgb = styleRgb(fx.style);
  ctx.save();
  for (let i = 7; i >= 0; i--) {
    const t = Math.max(0, p - i * 0.035);
    const x = fx.from.x + (fx.to.x - fx.from.x) * t;
    const y = fx.from.y + (fx.to.y - fx.from.y) * t;
    ctx.fillStyle = "rgba(" + rgb + "," + (0.12 + (1 - i / 7) * 0.55) + ")";
    ctx.beginPath();
    ctx.arc(x, y, 10 - i * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  const x = fx.from.x + (fx.to.x - fx.from.x) * p;
  const y = fx.from.y + (fx.to.y - fx.from.y) * p;
  ctx.strokeStyle = "rgba(" + rgb + ",0.95)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, fx.style === "seal" ? 9 : 5, 0, Math.PI * 2);
  ctx.stroke();
  if (fx.style === "seal") {
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x + 6, y);
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y + 6);
    ctx.stroke();
  }
  ctx.fillStyle = "#f4efe4";
  ctx.beginPath();
  ctx.arc(x, y, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCrack(ctx, fx, p) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(186, 140, 232, 0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fx.from.x, fx.from.y);
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * p;
    const x = fx.from.x + (fx.to.x - fx.from.x) * t;
    const y = fx.from.y + (fx.to.y - fx.from.y) * t;
    const wob = Math.sin(i * 2.1 + p * 5) * 9;
    ctx.lineTo(x + wob, y - wob * 0.35);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(244, 239, 228, 0.7)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

function drawArc(ctx, fx, p, tw, th) {
  const ang = Math.atan2(fx.to.y - fx.from.y, fx.to.x - fx.from.x);
  const along = fx.slide ? p : 0.55;
  const mx = fx.from.x + (fx.to.x - fx.from.x) * along;
  const my = fx.from.y + (fx.to.y - fx.from.y) * along;
  const rgb = styleRgb(fx.style);
  const swing = (p - 0.15) * 1.5;
  const radius = tw * 0.46 * (fx.radius || 1);
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(ang);
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(" + rgb + ",0.35)";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(0, 0, radius, -2.15 + swing, 0.15 + swing);
  ctx.stroke();
  ctx.strokeStyle = "rgba(" + rgb + ",0.95)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = "rgba(244, 239, 228, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(tw * 0.04, th * 0.08, radius * 0.72, -1.8 + swing, -0.1 + swing);
  ctx.stroke();
  ctx.restore();
}

function drawBreath(ctx, fx, p) {
  const rgb = styleRgb(fx.style);
  const radii = [8, 14, 20, 16, 10];
  ctx.save();
  for (let i = 0; i < radii.length; i++) {
    const t = ((i + 1) / 6) * p;
    const x = fx.from.x + (fx.to.x - fx.from.x) * t;
    const y = fx.from.y + (fx.to.y - fx.from.y) * t;
    const spread = 1 + i * 0.35;
    ctx.fillStyle = "rgba(" + rgb + "," + (0.18 + 0.12 * (1 - i / 5)) + ")";
    ctx.beginPath();
    ctx.ellipse(x, y, radii[i] * spread, radii[i], 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeal(ctx, fx, p) {
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const rise = ((p + i * 0.16) % 1) * 36;
    const x = fx.to.x + Math.sin(i * 1.7) * 10;
    const y = fx.to.y - rise;
    ctx.fillStyle = "rgba(143, 208, 200," + (0.85 - rise / 48) + ")";
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(143, 208, 200," + (1 - Math.min(1, p)) + ")";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(fx.to.x, fx.to.y, 8 + p * 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBurst(ctx, fx, p, tw) {
  const rgb = burstRgb(fx);
  const r = tw * (0.12 + Math.min(1, p) * 0.28);
  ctx.save();
  ctx.translate(fx.to.x, fx.to.y - 18);
  ctx.globalAlpha = 1 - Math.max(0, p - 0.65) / 0.35;
  if (fx.kind === "self") {
    ctx.strokeStyle = "rgba(" + rgb + ",0.95)";
    ctx.fillStyle = "rgba(" + rgb + ",0.18)";
    ctx.lineWidth = 2.5;
    shieldPath(ctx, 0, 0, r);
    ctx.fill();
    ctx.stroke();
  } else if (fx.kind === "veil") {
    ctx.strokeStyle = "rgba(" + rgb + ",0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.1, r * 1.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (fx.kind === "haste") {
    ctx.strokeStyle = "rgba(" + rgb + ",0.85)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-r + i * 8, 8);
      ctx.lineTo(-4 + i * 8, -r * 0.2);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = "rgba(" + rgb + ",0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
