class WeaponManager {
  constructor() {
    this.points = 10;
    this.level = 1;
    this.weapons = {
      'spray': { damage: 10, rate: 0.5, reload: 2.0, tooltip: 'Spray pattern - wide coverage, low rate' },
      'cone': { damage: 12, rate: 0.4, reload: 1.8, tooltip: 'Cone spread - focused cone, medium rate' },
      'pierce': { damage: 15, rate: 0.3, reload: 3.0, tooltip: 'Pierce - high damage, slow rate, hits through' },
      'ricochet': { damage: 8, rate: 0.6, reload: 1.5, tooltip: 'Ricochet - bounces off walls, low damage' },
      'arc': { damage: 14, rate: 0.45, reload: 2.2, tooltip: 'Arc - curved trajectory, balanced rate' },
      'beam': { damage: 20, rate: 0.2, reload: 5.0, tooltip: 'Beam - high damage, very slow rate' },
      'chain': { damage: 18, rate: 0.35, reload: 2.5, tooltip: 'Chain - multiple shots in sequence' },
      'burst': { damage: 25, rate: 0.25, reload: 4.0, tooltip: 'Burst - high damage burst, very slow rate' },
      'spin-up': { damage: 16, rate: 0.4, reload: 2.0, tooltip: 'Spin-up - increases damage over time' },
      'rail': { damage: 19, rate: 0.3, reload: 3.5, tooltip: 'Rail - continuous fire, moderate rate' },
      'flamer': { damage: 11, rate: 0.7, reload: 6.0, tooltip: 'Flamer - area damage, slow rate' },
      'sentry': { damage: 13, rate: 0.5, reload: 1.0, tooltip: 'Sentry - automatic, low damage' }
    };
    this.currentWeapon = 'spray';
  }

  spendPoints(amount) {
    if (amount <= 0) return;
    if (this.points < amount) {
      console.warn('Not enough points to spend');
      return;
    }
    this.points -= amount;
    this.level += 1;
    this.updateWeaponStats();
  }

  updateWeaponStats() {
    const weapon = this.weapons[this.currentWeapon];
    if (!weapon) return;
    console.log(`Weapon stats updated: Damage=${weapon.damage}, Rate=${weapon.rate}, Reload=${weapon.reload}`);
  }

  getWeaponStats() {
    return this.weapons[this.currentWeapon];
  }

  selectWeapon(weaponName) {
    if (this.weapons[weaponName]) {
      this.currentWeapon = weaponName;
      this.updateWeaponStats();
    }
  }
}

// Initialize manager
const weaponManager = new WeaponManager();