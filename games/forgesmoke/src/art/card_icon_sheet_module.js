export function draw(ctx, x, y, scale, frame) {
  const width = 64 * scale;
  const height = 64 * scale;
  const tileW = 16 * scale;
  const tileH = 16 * scale;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, -height);
  gradient.addColorStop(0, '#221100');
  gradient.addColorStop(1, '#442211');
  ctx.fillStyle = gradient;
  ctx.fillRect(-width/2, -height/2, width, height);

  // Icon tiles
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const xTile = i * tileW;
      const yTile = j * tileH;
      const iconGradient = ctx.createLinearGradient(xTile, yTile, xTile + tileW, yTile + tileH);
      iconGradient.addColorStop(0, '#663300');
      iconGradient.addColorStop(1, '#996633');
      ctx.fillStyle = iconGradient;
      ctx.fillRect(xTile, yTile, tileW, tileH);

      // Add inner shape
      ctx.beginPath();
      ctx.moveTo(xTile + 2, yTile + 2);
      ctx.lineTo(xTile + tileW - 2, yTile + 2);
      ctx.lineTo(xTile + tileW - 2, yTile + tileH - 2);
      ctx.lineTo(xTile + 2, yTile + tileH - 2);
      ctx.closePath();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.restore();
}
