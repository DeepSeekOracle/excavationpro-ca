export function draw(ctx, x, y, scale, frame) {
  const width = 48 * scale;
  const height = 48 * scale;
  const halfW = width / 2;
  const halfH = height / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Body gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, -height);
  gradient.addColorStop(0, '#221100');
  gradient.addColorStop(1, '#553311');
  ctx.fillStyle = gradient;
  ctx.fillRect(-halfW, -halfH, width, height);

  // Head (circle)
  ctx.beginPath();
  ctx.arc(0, -halfH, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#332211';
  ctx.fill();

  // Eyes (simple)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-6, -10, 2, 0, Math.PI * 2);
  ctx.arc(6, -10, 2, 0, Math.PI * 2);
  ctx.fill();

  // Arm (left)
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-12, 12);
  ctx.lineTo(-20, 12);
  ctx.lineTo(-20, 0);
  ctx.strokeStyle = '#442211';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}
