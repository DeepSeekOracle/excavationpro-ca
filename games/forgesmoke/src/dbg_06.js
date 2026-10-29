function onLevelUp() {
  const player = getPlayer();
  const currentStyle = player.currentWeaponStyle;
  const nextStyle = player.nextWeaponStyle;

  // Trigger card tray animation only on real level-up
  if (nextStyle && nextStyle !== currentStyle) {
    showCardTray(nextStyle);
    playLevelUpSound();
    updateWeaponUI(nextStyle);
  }
}

function showCardTray(style) {
  const tray = document.getElementById('card-tray');
  if (tray) {
    tray.style.display = 'block';
    tray.dataset.style = style;
    animateTrayOpen();
  }
}

function animateTrayOpen() {
  const tray = document.getElementById('card-tray');
  if (tray) {
    tray.style.transition = 'transform 0.3s ease';
    tray.style.transform = 'translateY(0)';
  }
}

function playLevelUpSound() {
  const sound = new Audio('sounds/level-up.mp3');
  sound.play().catch(() => {});
}

function updateWeaponUI(style) {
  const weaponElement = document.getElementById('weapon-ui');
  if (weaponElement) {
    weaponElement.textContent = `Style: ${style}`;
  }
}

// Listen for level-up events
window.addEventListener('level-up', onLevelUp);

// Initialize
onLevelUp();