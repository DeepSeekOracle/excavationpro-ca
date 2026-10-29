function renderBetweenRunSummary() {
  const xpGained = 1450;
  const levelUp = 3;
  const legendaryRoll = 'Flamer Core';

  const summary = [
    `XP Gained: ${xpGained}`,
    `Level Up: ${levelUp}`,
    `Legendary Roll: ${legendaryRoll}`
  ].join("\n");

  document.getElementById('summary-screen').innerHTML = summary;
}

// Initialize on load
window.addEventListener('load', renderBetweenRunSummary);
