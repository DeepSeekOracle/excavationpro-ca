class LegendaryLoadoutManager {
  constructor() {
    this.items = {
      jetpack: {
        name: 'Jetpack Thrust Surge',
        effect: 'Increases jetpack vertical thrust by 20% during movement',
        dropChance: 0.15,
        condition: 'arenaClearCount >= 3'
      },
      vehicle: {
        name: 'Turret Shield Field',
        effect: 'Grants 15% defense boost to vehicle when under attack',
        dropChance: 0.12,
        condition: 'arenaClearCount >= 5'
      },
      droneSwarm: {
        name: 'Swarm Defense Grid',
        effect: 'Drone swarm gains 20% defense and 10% movement speed boost',
        dropChance: 0.18,
        condition: 'arenaClearCount >= 4'
      }
    };
  }

  getDropTable() {
    const clearCount = this.getArenaClearCount();
    const table = [];

    Object.entries(this.items).forEach(([type, item]) => {
      if (clearCount >= parseInt(item.condition.split('>=')[1])) {
        table.push({
          type: type,
          name: item.name,
          effect: item.effect,
          chance: item.dropChance
        });
      }
    });

    return table;
  }

  getArenaClearCount() {
    // Simulated from game state
    return Math.floor(Math.random() * 10) + 1;
  }
}

// Initialize
const legendaryManager = new LegendaryLoadoutManager();