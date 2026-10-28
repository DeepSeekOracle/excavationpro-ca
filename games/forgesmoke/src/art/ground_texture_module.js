export function draw(ctx, x, y, scale, frame) {
  const width = 128 * scale;
  const height = 128 * scale;
  const tileW = 16 * scale;
  const tileH = 16 * scale;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  for (let i = 0; i < width; i += tileW) {
    for (let j = 0; j < height; j += tileH) {
      const gradient = ctx.createLinearGradient(i, j, i + tileW, j + tileH);
      gradient.addColorStop(0, '#332211');
      gradient.addColorStop(1, '#554433');
      ctx.fillStyle = gradient;
      ctx.fillRect(i, j, tileW, tileH);

      // Add small texture detail
      ctx.beginPath();
      ctx.moveTo(i + 2, j + 2);
      ctx.lineTo(i + 4, j + 2);
      ctx.lineTo(i + 4, j + 4);
      ctx.lineTo(i + 2, j + 4);
      ctx.closePath();
      ctx.strokeStyle = '#221100';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
  ctx.restore();
}
