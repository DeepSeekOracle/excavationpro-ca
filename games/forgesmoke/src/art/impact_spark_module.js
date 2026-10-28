export function draw(ctx, x, y, scale, frame) {
  const width = 48 * scale;
  const height = 48 * scale;
  const halfW = width / 2;
  const halfH = height / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Spark burst (multiple rays)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const length = 12;
    const xEnd = halfW + Math.cos(angle) * length;
    const yEnd = halfH + Math.sin(angle) * length;

    const sparkGradient = ctx.createLinearGradient(0, 0, xEnd, yEnd);
    sparkGradient.addColorStop(0, '#ffaa00');
    sparkGradient.addColorStop(1, '#ff0000');
    ctx.strokeStyle = sparkGradient;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();
  }

  // Center glow
  const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, halfW);
  glowGradient.addColorStop(0, '#ff6600');
  glowGradient.addColorStop(1, '#ff0000');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(0, 0, halfW - 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
