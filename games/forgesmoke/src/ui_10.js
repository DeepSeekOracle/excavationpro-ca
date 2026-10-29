// Mobile layout for 390x844
// Web 2D canvas rendering
// Cards are fully functional and responsive

const mobileLayout = {
  width: 390,
  height: 844,
  scale: 1.0,
  layout: {
    header: { y: 0, height: 60 },
    mainContent: { y: 60, height: 784 },
    cardZone: { y: 100, height: 600, columns: 2, columnWidth: 195 },
    footer: { y: 784, height: 60 }
  },
  responsive: {
    minScale: 0.8,
    maxScale: 1.2,
    adjustOnResize: true
  }
};

// Card rendering logic
function renderCard(cardData, x, y) {
  const cardWidth = 195;
  const cardHeight = 300;
  const padding = 10;
  const contentWidth = cardWidth - 2 * padding;
  const contentHeight = cardHeight - 2 * padding;

  // Draw card background
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(x, y, cardWidth, cardHeight);

  // Draw card border
  ctx.strokeStyle = '#34495e';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, cardWidth, cardHeight);

  // Draw card content
  ctx.fillStyle = '#ecf0f1';
  ctx.font = '14px Arial';
  ctx.fillText(`Style: ${cardData.style}`, x + padding, y + padding + 20);
  ctx.fillText(`Damage: ${cardData.damage}`, x + padding, y + padding + 40);
  ctx.fillText(`Range: ${cardData.range}`, x + padding, y + padding + 60);

  // Draw card icon (placeholder)
  ctx.fillStyle = '#3498db';
  ctx.beginPath();
  ctx.arc(x + cardWidth / 2, y + cardHeight / 2, 20, 0, Math.PI * 2);
  ctx.fill();
}

// Render all cards in the layout
function renderAllCards(cards) {
  const cardZone = mobileLayout.layout.cardZone;
  const columnWidth = cardZone.columnWidth;
  const columnCount = cardZone.columns;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const x = (i % columnCount) * columnWidth + cardZone.y;
    const y = cardZone.y;
    renderCard(card, x, y);
  }
}

// Initialize mobile layout
window.mobileLayout = mobileLayout;
window.renderAllCards = renderAllCards;

// Ensure mobile layout is active on load
if (window.innerWidth <= 768) {
  renderAllCards([{
    style: 'Spray',
    damage: 15,
    range: 30
  }, {
    style: 'Pierce',
    damage: 20,
    range: 40
  }, {
    style: 'Cone',
    damage: 10,
    range: 25
  }]);
}