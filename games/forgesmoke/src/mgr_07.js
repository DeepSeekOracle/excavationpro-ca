class EnemyArchetype {
  constructor(type) {
    this.type = type;
    this.behavior = this.getBehavior(type);
  }

  getBehavior(type) {
    switch (type) {
      case 'ranged_squad':
        return {
          strategy: 'flank',
          action: 'engage from long range',
          loadoutImpact: 'forces player to prioritize cover and suppressive fire',
          aiResponse: 'flank to break line of sight'
        };
      case 'shield_wall':
        return {
          strategy: 'line-of-sight denial',
          action: 'form solid front line',
          loadoutImpact: 'forces player to choose high-damage, high-accuracy weapons',
          aiResponse: 'retreat if line of sight is broken'
        };
      case 'artillery_denial':
        return {
          strategy: 'area denial',
          action: 'deploy in chokepoints',
          loadoutImpact: 'forces player to balance mobility and firepower',
          aiResponse: 'avoid engagement, seek alternative routes'
        };
      default:
        return null;
    }
  }
}

// Example usage
const rangedSquad = new EnemyArchetype('ranged_squad');
console.log(rangedSquad.behavior);
