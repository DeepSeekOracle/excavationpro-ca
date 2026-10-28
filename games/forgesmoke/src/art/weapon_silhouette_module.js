export function draw(ctx, x, y, scale, frame) {
  const width = 64 * scale;
  const height = 32 * scale;
  const halfW = width / 2;
  const halfH = height / 2;

  // Base silhouette using ART_BIBLE palette
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Draw body (gradient from dark to light)
  const gradient = ctx.createLinearGradient(0, 0, 0, -height);
  gradient.addColorStop(0, '#442211');
  gradient.addColorStop(1, '#885533');
  ctx.fillStyle = gradient;
  ctx.fillRect(-halfW, -halfH, width, height);

  // Draw blade (sharp edge)
  ctx.beginPath();
  ctx.moveTo(halfW, -halfH);
  ctx.lineTo(halfW + 16, -halfH - 8);
  ctx.lineTo(halfW + 16, -halfH - 8);
  ctx.lineTo(halfW + 32, -halfH - 8);
  ctx.lineTo(halfW + 32, -halfH);
  ctx.lineTo(halfW, -halfH);
  ctx.strokeStyle = '#663300';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}
