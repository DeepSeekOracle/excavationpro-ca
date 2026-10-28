export function draw(ctx, x, y, scale, frame) {
  const width = 128 * scale;
  const height = 64 * scale;
  const tileW = 16 * scale;
  const tileH = 16 * scale;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  for (let i = 0; i < width; i += tileW) {
    for (let j = 0; j < height; j += tileH) {
      const gradient = ctx.createLinearGradient(i, j, i + tileW, j + tileH);
      gradient.addColorStop(0, '#110000');
      gradient.addColorStop(1, '#442211');
      ctx.fillStyle = gradient;
      ctx.fillRect(i, j, tileW, tileH);

      // Add vertical grooves
      ctx.beginPath();
      ctx.moveTo(i, j);
      ctx.lineTo(i + tileW, j);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
  ctx.restore();
}
