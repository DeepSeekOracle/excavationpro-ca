export function draw(ctx, x, y, scale, frame) {
  const width = 32 * scale;
  const height = 32 * scale;
  const halfW = width / 2;
  const halfH = height / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Flash burst
  const flashGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.sqrt(width * width + height * height));
  flashGradient.addColorStop(0, '#ffaa00');
  flashGradient.addColorStop(0.5, '#ffdd66');
  flashGradient.addColorStop(1, '#ff0000');
  ctx.fillStyle = flashGradient;
  ctx.beginPath();
  ctx.arc(0, 0, halfW, 0, Math.PI * 2);
  ctx.fill();

  // Inner glow
  const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, halfW);
  glowGradient.addColorStop(0, '#ff6600');
  glowGradient.addColorStop(1, '#ff0000');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(0, 0, halfW - 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
