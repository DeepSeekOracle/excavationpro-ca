import { PALETTE } from "../theme.js";

export function draw(ctx, x, y, scale = 1, frame = 0) {
  const width = 64 * scale;
  const height = 48 * scale;
  const halfW = width / 2;
  const halfH = height / 2;
  const rotorShift = (frame % 2) * 4;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Gunship / Heavy Boss chassis using ART_BIBLE palette
  const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
  bodyGrad.addColorStop(0, PALETTE.enemyChitin.light);
  bodyGrad.addColorStop(0.6, PALETTE.enemyChitin.mid);
  bodyGrad.addColorStop(1, PALETTE.enemyChitin.dark);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-24, -6);
  ctx.lineTo(24, -6);
  ctx.lineTo(18, 14);
  ctx.lineTo(-18, 14);
  ctx.closePath();
  ctx.fill();

  // Rotor blades
  ctx.strokeStyle = PALETTE.steel.light;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-28 + rotorShift, -14);
  ctx.lineTo(28 - rotorShift, -14);
  ctx.stroke();

  // Hostile red optic core
  ctx.fillStyle = PALETTE.hostile;
  ctx.beginPath();
  ctx.arc(0, 2, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
