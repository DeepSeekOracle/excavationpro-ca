/* ============================================================================
   LYGO DUNGEON ADVENTURES — DUNGEONBOUND EDITION ENGINE
   Full Steam #5200620 Game Loop: Hub, Equipment Board, Auto-Merge/Hybrid Fuse,
   7-Floor x 5-Step Descents, Speed-Driven Equipment Sweep Auto-Battler,
   Rival Ghost Boards, 6 Interactive Event Rooms, 18 Upgrades, 28 Quests,
   and 49-Square Haven Gate & Underworks World.
   ============================================================================ */
(function () {
  "use strict";

  const SAVE_KEY = "lygo_dungeonbound_save_v2";

  // ---------------------------------------------------------------------------
  // 1. HEROES, DESCENTS, MONSTERS, ITEMS, RELICS, UPGRADES, MILESTONES
  // ---------------------------------------------------------------------------
  const HEROES = [
    {
      id: "justin",
      name: "Justin",
      title: "Warden of the Gate",
      portrait: "assets/Portraits/justin.jpg",
      blink: "assets/Portraits/justin_blink.jpg",
      talk: "assets/Portraits/justin_talk.jpg",
      spellName: "Iron Ward & Cleave",
      spellMp: 8,
      spellDesc: "Grants +18 Block, +4 Thorns, and strikes target for 160% Power.",
      baseStats: { power: 8, speed: 6, magic: 6, vitality: 10, defense: 8, luck: 6 },
      quote: "Stone holds when the oath is kept. Fill the board, check your steel, and step into the dark."
    },
    {
      id: "lyra",
      name: "Lyra",
      title: "Starblade Ranger",
      portrait: "assets/Portraits/lyra.jpg",
      blink: "assets/Portraits/lyra_blink.jpg",
      talk: "assets/Portraits/lyra_talk.jpg",
      spellName: "Starblade Volley",
      spellMp: 7,
      spellDesc: "Fires 3 rapid astral arrows at all foes (+4 Bleed & +25% Crit).",
      baseStats: { power: 9, speed: 10, magic: 7, vitality: 7, defense: 5, luck: 9 },
      quote: "Speed kills before armor even wakes. Stack Beast & Frost tags and watch the sweep bar fly."
    },
    {
      id: "lightfather",
      name: "Lightfather",
      title: "Steward of the Lattice",
      portrait: "assets/Portraits/lightfather.jpg",
      blink: "assets/Portraits/lightfather_blink.jpg",
      talk: "assets/Portraits/lightfather_talk.jpg",
      spellName: "Lattice Judgement",
      spellMp: 9,
      spellDesc: "Heals +22 HP and blasts all enemies with Arcane & Ember fire.",
      baseStats: { power: 7, speed: 7, magic: 11, vitality: 9, defense: 7, luck: 8 },
      quote: "Every relic in the deep remembers its maker. Merge wisely and claim the milestones."
    },
    {
      id: "sephrael",
      name: "Sephrael",
      title: "Ash Knight of the Seal",
      portrait: "assets/Portraits/sephrael.jpg",
      blink: "assets/Portraits/sephrael_blink.jpg",
      talk: "assets/Portraits/sephrael_talk.jpg",
      spellName: "Crimson Reckoning",
      spellMp: 8,
      spellDesc: "Deals 220% Power + 6 Burn + 5 Poison and leeches 30% as HP.",
      baseStats: { power: 11, speed: 7, magic: 8, vitality: 8, defense: 7, luck: 6 },
      quote: "Cursed steel hits twice as hard if you have the nerve to carry it to Floor 7."
    }
  ];

  const MONSTERS = {
    wolf:         { id: "wolf",         name: "Ash Timber Wolf",      sprite: "assets/Enemies/WOLF.png",         hp: 34, atk: 6,  def: 2, spd: 6 },
    hound:        { id: "hound",        name: "Blighted Hound",       sprite: "assets/Enemies/HOUND.png",        hp: 42, atk: 8,  def: 3, spd: 8 },
    skeleton:     { id: "skeleton",     name: "Crypt Skeleton",       sprite: "assets/Enemies/SKELETON.png",     hp: 46, atk: 7,  def: 4, spd: 5 },
    acolyte:      { id: "acolyte",      name: "Cinder Acolyte",       sprite: "assets/Enemies/ACOLYTE.png",      hp: 44, atk: 9,  def: 3, spd: 6 },
    sentinel:     { id: "sentinel",     name: "Iron Vault Sentinel",  sprite: "assets/Enemies/SENTINEL.png",     hp: 62, atk: 10, def: 7, spd: 4 },
    shade:        { id: "shade",        name: "Hollow Shade",         sprite: "assets/Enemies/SHADE.png",        hp: 48, atk: 11, def: 3, spd: 9 },
    raider:       { id: "raider",       name: "Grave Raider",         sprite: "assets/Enemies/RAIDER.png",       hp: 54, atk: 10, def: 5, spd: 7 },
    effigy:       { id: "effigy",       name: "Cursed Effigy",        sprite: "assets/Enemies/EFFIGY.png",       hp: 68, atk: 11, def: 8, spd: 4 },
    cantor:       { id: "cantor",       name: "Blood Choir Cantor",   sprite: "assets/Enemies/CANTOR.png",       hp: 60, atk: 13, def: 5, spd: 7 },
    corvath:      { id: "corvath",      name: "Corvath Duskwing",     sprite: "assets/Enemies/CORVATH.png",      hp: 76, atk: 14, def: 6, spd: 9 },
    // Bosses
    warden:       { id: "warden",       name: "Warden of the Seal",   sprite: "assets/Enemies/WARDEN.png",       hp: 135, atk: 14, def: 8,  spd: 6, boss: true },
    smith:        { id: "smith",        name: "Malakor Iron-Smith",   sprite: "assets/Enemies/SMITH.png",        hp: 175, atk: 17, def: 11, spd: 5, boss: true },
    tithe:        { id: "tithe",        name: "The Tithe Collector",  sprite: "assets/Enemies/TITHE.png",        hp: 215, atk: 20, def: 12, spd: 7, boss: true },
    emberion:     { id: "emberion",     name: "Emberion Flame-Lord",  sprite: "assets/Enemies/EMBERION.png",     hp: 260, atk: 24, def: 14, spd: 8, boss: true },
    leviathan:    { id: "leviathan",    name: "Abyssal Leviathan",    sprite: "assets/Enemies/LEVIATHAN.png",    hp: 320, atk: 28, def: 16, spd: 8, boss: true },
    ashlord:      { id: "ashlord",      name: "Sovereign Ashlord",    sprite: "assets/Enemies/ASHLORD.png",      hp: 290, atk: 26, def: 15, spd: 8, boss: true },
    heartboss:    { id: "heartboss",    name: "Heart of the Crypt",   sprite: "assets/Enemies/HEARTBOSS.png",    hp: 350, atk: 30, def: 18, spd: 7, boss: true },
    lockboss:     { id: "lockboss",     name: "The Eternal Lock",     sprite: "assets/Enemies/LOCKBOSS.png",     hp: 380, atk: 32, def: 20, spd: 9, boss: true },
    // Rivals (Carry 6-slot Rival Equipment Boards!)
    rival_knight: { id: "rival_knight", name: "Sir Vane the Iron",    sprite: "assets/Enemies/RIVAL_KNIGHT.png", hp: 95,  atk: 12, def: 8,  spd: 6, rival: true, archetype: "STEEL" },
    rival_warden: { id: "rival_warden", name: "Kaelen Thornshield",   sprite: "assets/Enemies/RIVAL_WARDEN.png", hp: 105, atk: 11, def: 10, spd: 5, rival: true, archetype: "CRYPT" },
    rival_ranger: { id: "rival_ranger", name: "Vespera Shadebow",     sprite: "assets/Enemies/RIVAL_RANGER.png", hp: 88,  atk: 15, def: 5,  spd: 10, rival: true, archetype: "BEAST" },
    rival_mage:   { id: "rival_mage",   name: "Malakor Ashweaver",    sprite: "assets/Enemies/RIVAL_MAGE.png",   hp: 92,  atk: 16, def: 6,  spd: 8, rival: true, archetype: "EMBER" }
  };

  const DESCENTS = [
    {
      index: 0,
      roman: "I",
      name: "The Mudking Warrens",
      subtitle: "Floors 1–7 · Standard Descent · Entry Tier",
      tagline: "Feral packs, rusted traps, and the Warden of the Outer Seal.",
      dpReward: 25,
      scale: 1.0,
      bgVision: "assets/Vision/DUNGEON_HALL_MOVE_STRAIGHT.jpg",
      bossVision: "assets/Vision/DUNGEON_BOSS.jpg",
      regulars: ["wolf", "skeleton", "hound", "raider"],
      elites: ["sentinel", "shade"],
      rivals: ["rival_knight", "rival_ranger"],
      boss: "warden"
    },
    {
      index: 1,
      roman: "II",
      name: "The Bonevault Crypts",
      subtitle: "Floors 1–7 · +35% Monster Power · +40% Rare Drops",
      tagline: "Ancient ossuaries guarded by Crypt Sentinels and Malakor the Smith.",
      dpReward: 40,
      scale: 1.35,
      bgVision: "assets/Vision/DUNGEON_OSSUARY.jpg",
      bossVision: "assets/Vision/DUNGEON_VAULT.jpg",
      regulars: ["skeleton", "acolyte", "shade", "effigy"],
      elites: ["sentinel", "cantor"],
      rivals: ["rival_warden", "rival_knight"],
      boss: "smith"
    },
    {
      index: 2,
      roman: "III",
      name: "The Chittering Deep",
      subtitle: "Floors 1–7 · +75% Monster Power · High Status Hazard",
      tagline: "Venomous corridors where the Tithe Collector weighs every coin.",
      dpReward: 60,
      scale: 1.75,
      bgVision: "assets/Vision/DUNGEON_CAGE.jpg",
      bossVision: "assets/Vision/DUNGEON_SHRINE.jpg",
      regulars: ["hound", "shade", "raider", "cantor"],
      elites: ["effigy", "corvath"],
      rivals: ["rival_ranger", "rival_mage"],
      boss: "tithe"
    },
    {
      index: 3,
      roman: "IV",
      name: "The Infernal Ash Court",
      subtitle: "Floors 1–7 · +120% Monster Power · Epic & Cursed Gear",
      tagline: "Burning halls beneath the forge where Emberion and the Ashlord reign.",
      dpReward: 85,
      scale: 2.2,
      bgVision: "assets/Vision/DUNGEON_ARMORY.jpg",
      bossVision: "assets/Vision/DUNGEON_BOSS.jpg",
      regulars: ["acolyte", "cantor", "effigy", "corvath"],
      elites: ["sentinel", "ashlord"],
      rivals: ["rival_mage", "rival_warden"],
      boss: "emberion"
    },
    {
      index: 4,
      roman: "V",
      name: "The Abyssal Wyrmroost",
      subtitle: "Floors 1–7 · +175% Monster Power · Legendary Endgame",
      tagline: "The deepest vault of the Lattice. Only fused & high-synergy boards survive.",
      dpReward: 120,
      scale: 2.75,
      bgVision: "assets/Vision/DUNGEON_BRIDGE.jpg",
      bossVision: "assets/Vision/DUNGEON_VAULT.jpg",
      regulars: ["cantor", "effigy", "corvath", "sentinel"],
      elites: ["smith", "tithe"],
      rivals: ["rival_knight", "rival_mage", "rival_ranger", "rival_warden"],
      boss: "leviathan"
    },
    {
      index: 5,
      roman: "DAILY",
      name: "The Daily Seeded Climb",
      subtitle: "7 Floors · Rotating Modifier: +25% Speed & Double Relic Draft",
      tagline: "A special seeded gauntlet against The Eternal Lock for bonus DP.",
      dpReward: 75,
      scale: 1.55,
      bgVision: "assets/Vision/DUNGEON_SHRINE.jpg",
      bossVision: "assets/Vision/DUNGEON_BOSS.jpg",
      regulars: ["wolf", "shade", "acolyte", "raider", "cantor"],
      elites: ["corvath", "effigy"],
      rivals: ["rival_ranger", "rival_knight"],
      boss: "lockboss"
    }
  ];

  const ITEMS = [
    // Weapons
    { id: "iron_shortsword", name: "Iron Shortsword",   slot: "weapon", set: "STEEL",  icon: "assets/Items/SWORD.png",      atk: 7,  blk: 2,  spd: 6, procs: { bleed: 2 }, desc: "Balanced steel blade. Grants +2 Bleed on hit." },
    { id: "sun_greatsword",  name: "Sun Greatsword",    slot: "weapon", set: "EMBER",  icon: "assets/Items/GREATSWORD.png", atk: 13, blk: 0,  spd: 4, procs: { burn: 4 },  desc: "Heavy two-handed cleaver that ignites foes for +4 Burn." },
    { id: "fang_dagger",     name: "Viper Fang Dagger", slot: "weapon", set: "BEAST",  icon: "assets/Items/DAGGER.png",     atk: 6,  blk: 0,  spd: 10, procs: { poison: 4, bleed: 2 }, desc: "Ultra-fast twin fang. Applies +4 Poison & +2 Bleed." },
    { id: "executioner_axe", name: "Executioner's Axe", slot: "weapon", set: "BEAST",  icon: "assets/Items/AXE.png",        atk: 12, blk: 0,  spd: 5, procs: { bleed: 5 }, desc: "Brutal cleaver. Inflicts heavy +5 Bleed." },
    { id: "forge_hammer",    name: "Forge War-Hammer",  slot: "weapon", set: "STEEL",  icon: "assets/Items/HAMMER.png",     atk: 11, blk: 4,  spd: 5, procs: { stun: 1 },  desc: "Crushes armor and bolsters +4 Block per swing." },
    { id: "glacial_spear",   name: "Glacial Pike",      slot: "weapon", set: "FROST",  icon: "assets/Items/SPEAR.png",      atk: 9,  blk: 3,  spd: 7, procs: { freeze: 4 }, desc: "Chills the target with +4 Freeze, slowing enemy turns." },
    { id: "star_longbow",    name: "Starwood Longbow",  slot: "weapon", set: "BEAST",  icon: "assets/Items/BOW.png",        atk: 10, blk: 0,  spd: 8, procs: { crit: 12, bleed: 3 }, desc: "Precision bow with +12% Crit bonus and +3 Bleed." },
    { id: "lattice_staff",   name: "Lattice Arch-Staff",slot: "weapon", set: "ARCANE", icon: "assets/Items/STAFF.png",      atk: 9,  blk: 2,  spd: 7, procs: { burn: 3, mana: 3 }, desc: "Channels arcane fire and restores +3 Mana on sweep." },
    { id: "crypt_reaver",    name: "Ossuary Scythe",    slot: "weapon", set: "CRYPT",  icon: "assets/Items/AXE.png",        atk: 11, blk: 0,  spd: 6, procs: { poison: 5, heal: 3 }, desc: "Reaps +5 Poison and drains +3 HP on every sweep." },
    // Shields & Armor
    { id: "warden_buckler",  name: "Warden's Buckler",  slot: "armor",  set: "STEEL",  icon: "assets/Items/SHIELD.png",     atk: 2,  blk: 10, spd: 6, procs: { thorns: 3 }, desc: "Sturdy iron shield. Grants +10 Block & +3 Thorns." },
    { id: "thorn_bulwark",   name: "Thornwall Bulwark", slot: "armor",  set: "CRYPT",  icon: "assets/Items/SHIELD.png",     atk: 3,  blk: 12, spd: 5, procs: { thorns: 7 }, desc: "Spiked crypt shield. Reflects +7 Thorns to attackers." },
    { id: "iron_greathelm",  name: "Citadel Greathelm", slot: "armor",  set: "STEEL",  icon: "assets/Items/HELM.png",       atk: 0,  blk: 9,  spd: 5, procs: { thorns: 2 }, desc: "Heavy plate helm. Grants +9 Block per cycle." },
    { id: "frost_crown",     name: "Rime-Forged Crown", slot: "armor",  set: "FROST",  icon: "assets/Items/HELM.png",       atk: 4,  blk: 8,  spd: 7, procs: { freeze: 3 }, desc: "Radiates winter chill: +8 Block & +3 Freeze." },
    { id: "plate_cuirass",   name: "Vanguard Cuirass",  slot: "armor",  set: "STEEL",  icon: "assets/Items/ARMOR.png",      atk: 0,  blk: 14, spd: 4, procs: { heal: 2 },   desc: "Full steel breastplate. +14 Block and +2 HP mend." },
    { id: "ember_mail",      name: "Cinder-Scale Mail", slot: "armor",  set: "EMBER",  icon: "assets/Items/ARMOR.png",      atk: 4,  blk: 10, spd: 6, procs: { burn: 4, thorns: 4 }, desc: "Searing armor: +10 Block, +4 Burn, +4 Thorns." },
    { id: "shadow_cloak",    name: "Nightstalker Cloak",slot: "armor",  set: "BEAST",  icon: "assets/Items/CLOAK.png",      atk: 4,  blk: 7,  spd: 9, procs: { dodge: 8, bleed: 2 }, desc: "Swift猎cloak: +7 Block, +8% Dodge, high speed." },
    { id: "strider_boots",   name: "Windstrider Greaves",slot: "armor", set: "FROST",  icon: "assets/Items/BOOTS.png",      atk: 3,  blk: 7,  spd: 10, procs: { freeze: 2 }, desc: "Accelerates board sweep speed while granting +7 Block." },
    { id: "signet_ring",     name: "Steward's Signet",  slot: "armor",  set: "ARCANE", icon: "assets/Items/RING.png",       atk: 6,  blk: 5,  spd: 8, procs: { mana: 4, heal: 3 }, desc: "Ancient LYGO ring: +6 Atk, +5 Block, +4 Mana, +3 Heal." },
    // Potions / Belt Utility (also equippable on board!)
    { id: "crimson_vial",    name: "Crimson Draught",   slot: "potion", set: "CRYPT",  icon: "assets/Items/POTION_HP.png",   atk: 0,  blk: 4,  spd: 8, procs: { heal: 11 }, desc: "Restores +11 HP & +4 Block every sweep cycle." },
    { id: "azure_elixir",    name: "Azure Mana Elixir", slot: "potion", set: "ARCANE", icon: "assets/Items/POTION_MANA.png", atk: 5,  blk: 4,  spd: 8, procs: { mana: 6 },  desc: "Restores +6 Mana and fires a +5 Arcane bolt." },
    { id: "blight_flask",    name: "Blight Alchemist Flask", slot: "potion", set: "CRYPT", icon: "assets/Items/POTION_VENOM.png", atk: 7, blk: 0, spd: 8, procs: { poison: 6, burn: 3 }, desc: "Hurls corrosive venom: +6 Poison & +3 Burn." },
    // Cursed Shrine Signature Items
    { id: "cursed_bloodblade", name: "Cursed Blood-Reaver", slot: "weapon", set: "CRYPT", icon: "assets/Items/GREATSWORD.png", atk: 20, blk: 0, spd: 8, cursed: true, curseNote: "Drains 2 HP per sweep for massive 20 base Attack + 6 Bleed.", procs: { bleed: 6, selfDmg: 2 }, desc: "[CURSED] +20 Attack & +6 Bleed, costs 2 HP on sweep." },
    { id: "cursed_doomplate",  name: "Cursed Doom-Aegis",   slot: "armor",  set: "STEEL", icon: "assets/Items/ARMOR.png",      atk: 6,  blk: 22, spd: 4, cursed: true, curseNote: "Grants massive +22 Block & +9 Thorns, -2 Speed.", procs: { thorns: 9 }, desc: "[CURSED] +22 Block & +9 Thorns per cycle." },
    { id: "cursed_voidstaff",  name: "Cursed Void Scepter", slot: "weapon", set: "ARCANE", icon: "assets/Items/STAFF.png",     atk: 18, blk: 4, spd: 8, cursed: true, curseNote: "Inflicts +6 Burn & +6 Poison, costs 2 Mana per sweep.", procs: { burn: 6, poison: 6 }, desc: "[CURSED] +18 Attack, +6 Burn, +6 Poison." }
  ];

  const SET_DEFS = {
    STEEL:  { name: "Steel Bastion",  b2: "+25% Block & +4 Thorns",           b4: "Shield Slam: Every Block proc deals 45% as bonus Damage" },
    BEAST:  { name: "Beast Pack",     b2: "+3 Bleed on hit & +15% Sweep Spd", b4: "Predator Frenzy: +25% Crit Chance & 20% Lifesteal" },
    CRYPT:  { name: "Crypt Covenant", b2: "+4 Poison on hit & +14 Start Block", b4: "Undying Seal: Heal +5 HP per kill & Poison ticks 2x" },
    EMBER:  { name: "Ember Forge",    b2: "+4 Burn on hit & +20% Weapon Atk", b4: "Inferno Core: Burn deals 2x damage & splashes all foes" },
    FROST:  { name: "Frost Sovereign",b2: "+4 Freeze on hit & +12% Dodge",    b4: "Absolute Zero: Frozen foes take +35% Damage" },
    ARCANE: { name: "Arcane Lattice", b2: "+4 Mana Regen & +25% Spell Power", b4: "Omnibus Pulse: Spells fire an extra arcane wave" }
  };

  const RELICS = [
    { id: "vampiric_fang",   name: "Vampiric Fang",      icon: "assets/Items/RELIC_TOOTH.png", desc: "Heal +3 HP whenever your Weapons deal critical or bleed damage." },
    { id: "merchants_coin",  name: "Merchant's Gold Seal", icon: "assets/Items/RELIC_COIN.png", desc: "+35% Gold from all battles & Chests; Shop prices reduced by 20%." },
    { id: "loaded_dice",     name: "Loaded Ivory Dice",  icon: "assets/Items/RELIC_DICE.png",  desc: "+15% Crit Chance and +12% Dodge Chance across all floors." },
    { id: "thorn_idol",      name: "Idol of Iron Thorns",icon: "assets/Items/RELIC_TOTEM.png", desc: "Start every battle with +16 Block and +8 Thorns." },
    { id: "cinder_core",     name: "Cinder Heartstone",  icon: "assets/Items/RELIC_TOTEM.png", desc: "All Weapons apply +3 Burn; Burn ticks deal +50% damage." },
    { id: "frost_shackle",   name: "Glacial Shackle",    icon: "assets/Items/RELIC_DICE.png",  desc: "Start combat by inflicting 4 Freeze on all enemies." },
    { id: "anvil_charm",     name: "Master Smith's Charm", icon: "assets/Items/HAMMER.png",    desc: "All Equipped Board items act at +1 Level higher in combat." },
    { id: "phoenix_plume",   name: "Phoenix Ash Plume",  icon: "assets/Items/RELIC_TOOTH.png", desc: "Once per run, fatal damage revives you at 50% Max HP + 25 Block." },
    { id: "mana_prism",      name: "Starlight Prism",    icon: "assets/Items/RING.png",        desc: "Start each battle with full Mana; Spells cost 2 less Mana." },
    { id: "execution_crest", name: "Executioner's Crest",icon: "assets/Items/AXE.png",         desc: "Deal +40% damage to enemies below 50% HP and to Floor Bosses." },
    { id: "alchemy_satchel", name: "Alchemist's Satchel",icon: "assets/Items/POTION_HP.png",   desc: "Potions on your Equipment Board trigger 50% stronger effects." },
    { id: "chronos_spur",    name: "Chronos Wind-Spur",  icon: "assets/Items/BOOTS.png",       desc: "+25% Equipment Sweep Speed across your entire board." }
  ];

  const UPGRADES = [
    // Damage
    { id: "sharp_steel",     tab: "Damage",  name: "Keen Edge Mastery",    max: 5, costSp: 1, costDp: 0, desc: "+10% Weapon Attack per rank across all equipped weapons." },
    { id: "killer_instinct", tab: "Damage",  name: "Killer Instinct",      max: 5, costSp: 1, costDp: 10, desc: "+4% Crit Chance & +15% Crit Damage per rank." },
    { id: "venom_alchemy",   tab: "Damage",  name: "Venom & Cinder Arts",  max: 5, costSp: 1, costDp: 10, desc: "+2 Poison, Burn, and Bleed potency per rank." },
    { id: "giant_slayer",    tab: "Damage",  name: "Boss & Rival Slayer",  max: 5, costSp: 2, costDp: 15, desc: "+12% Damage against Elites, Rivals, and Dungeon Bosses per rank." },
    // Defense
    { id: "iron_bastion",    tab: "Defense", name: "Iron Bastion",         max: 5, costSp: 1, costDp: 0, desc: "+8 Starting Block at the start of every room per rank." },
    { id: "shield_wall",     tab: "Defense", name: "Shieldwall Discipline",max: 5, costSp: 1, costDp: 10, desc: "+12% Block generated by Armor & Shields per rank." },
    { id: "bramble_carapace",tab: "Defense", name: "Bramble Carapace",     max: 5, costSp: 1, costDp: 10, desc: "+3 permanent Thorns per rank." },
    { id: "shadow_reflex",   tab: "Defense", name: "Shadow Reflexes",      max: 4, costSp: 2, costDp: 15, desc: "+4% Dodge Chance and +1 Speed per rank." },
    // Sustain
    { id: "titan_vitality",  tab: "Sustain", name: "Titan's Vitality",     max: 5, costSp: 1, costDp: 0, desc: "+16 Max HP per rank." },
    { id: "blood_siphon",    tab: "Sustain", name: "Crimson Siphon",       max: 5, costSp: 1, costDp: 12, desc: "Heal +3 HP after every combat room cleared per rank." },
    { id: "well_of_stars",   tab: "Sustain", name: "Well of Stars",        max: 4, costSp: 1, costDp: 10, desc: "+8 Max Mana & +2 starting Mana regen per rank." },
    // Economy
    { id: "golden_tithe",    tab: "Economy", name: "Golden Tithe",         max: 5, costSp: 1, costDp: 0, desc: "+15% Gold dropped from all monsters & chests per rank." },
    { id: "treasure_hunter", tab: "Economy", name: "Treasure Eye",         max: 5, costSp: 1, costDp: 15, desc: "+12% chance for Rare, Epic, and Legendary item drops per rank." },
    { id: "haggler",         tab: "Economy", name: "Guild Haggler",        max: 3, costSp: 1, costDp: 10, desc: "+25% Gold when selling items & -10% Merchant prices per rank." },
    // Unlocks
    { id: "board_row_3",     tab: "Unlocks", name: "Board Expansion III",  max: 1, costSp: 2, costDp: 20, desc: "Unlocks Row 3 on your Equipment Board (+4 Equipped Slots = 12 Total)." },
    { id: "board_row_4",     tab: "Unlocks", name: "Board Expansion IV",   max: 1, costSp: 3, costDp: 40, desc: "Unlocks Row 4 on your Equipment Board (+4 Equipped Slots = 16 Total)." },
    { id: "starting_relic",  tab: "Unlocks", name: "Relic Inheritance",    max: 1, costSp: 2, costDp: 30, desc: "Begin every new Dungeon Run with 1 random Relic already active." },
    { id: "auto_temper",     tab: "Unlocks", name: "Masterwork Tempering", max: 3, costSp: 2, costDp: 25, desc: "Merged items gain +1 bonus Attack & +1 bonus Block per rank." }
  ];

  const MILESTONES = [
    // Combat
    { id: "kill_5",      cat: "Combat",  title: "First Blood in the Dark",   stat: "enemiesKilled", target: 5,   sp: 1, dp: 10, gold: 30 },
    { id: "kill_25",     cat: "Combat",  title: "Cull the Warrens (25 Foes)",stat: "enemiesKilled", target: 25,  sp: 2, dp: 20, gold: 60 },
    { id: "kill_75",     cat: "Combat",  title: "Bane of the Deep (75 Foes)",stat: "enemiesKilled", target: 75,  sp: 3, dp: 35, gold: 120 },
    { id: "elite_3",     cat: "Combat",  title: "Elite Hunter",              stat: "elitesKilled",  target: 3,   sp: 1, dp: 15, gold: 45 },
    { id: "rival_1",     cat: "Combat",  title: "Defeat a Rival Adventurer", stat: "rivalsKilled",  target: 1,   sp: 2, dp: 20, gold: 50 },
    { id: "rival_5",     cat: "Combat",  title: "Conqueror of Rivals",       stat: "rivalsKilled",  target: 5,   sp: 3, dp: 35, gold: 100 },
    { id: "boss_1",      cat: "Combat",  title: "Slay a Floor 7 Boss",       stat: "bossesKilled",  target: 1,   sp: 3, dp: 30, gold: 100 },
    { id: "boss_3",      cat: "Combat",  title: "Lords of the Lattice",      stat: "bossesKilled",  target: 3,   sp: 4, dp: 50, gold: 200 },
    { id: "dmg_500",     cat: "Combat",  title: "Deal 500 Total Damage",     stat: "totalDamageDealt", target: 500, sp: 1, dp: 10, gold: 35 },
    { id: "dmg_2500",    cat: "Combat",  title: "Deal 2,500 Total Damage",   stat: "totalDamageDealt", target: 2500, sp: 2, dp: 25, gold: 90 },
    // Items
    { id: "merge_1",     cat: "Items",   title: "Apprentice Merger",         stat: "itemsMerged",   target: 1,   sp: 1, dp: 10, gold: 25 },
    { id: "merge_5",     cat: "Items",   title: "Seasoned Artificer (5x)",   stat: "itemsMerged",   target: 5,   sp: 2, dp: 20, gold: 60 },
    { id: "merge_15",    cat: "Items",   title: "Master of Forging (15x)",   stat: "itemsMerged",   target: 15,  sp: 3, dp: 35, gold: 130 },
    { id: "forge_1",     cat: "Items",   title: "Use the Blacksmith Forge",  stat: "itemsForged",   target: 1,   sp: 1, dp: 15, gold: 40 },
    { id: "forge_4",     cat: "Items",   title: "Hybrid Alchemist (4x)",     stat: "itemsForged",   target: 4,   sp: 2, dp: 25, gold: 85 },
    { id: "curse_1",     cat: "Items",   title: "Bearer of a Cursed Gift",   stat: "cursesTaken",   target: 1,   sp: 2, dp: 20, gold: 55 },
    // General
    { id: "run_1",       cat: "General", title: "Step Into the Archway",     stat: "totalRuns",     target: 1,   sp: 1, dp: 10, gold: 25 },
    { id: "run_5",       cat: "General", title: "Veteran Delver (5 Runs)",   stat: "totalRuns",     target: 5,   sp: 2, dp: 20, gold: 70 },
    { id: "chest_2",     cat: "General", title: "Plunder 2 Forgotten Chests",stat: "chestsOpened",  target: 2,   sp: 1, dp: 15, gold: 45 },
    { id: "wheel_1",     cat: "General", title: "Spin the Wheel of Fortune", stat: "wheelSpins",    target: 1,   sp: 1, dp: 15, gold: 40 },
    { id: "status_25",   cat: "General", title: "Inflict 25 Status Stacks",  stat: "statusInflicted", target: 25, sp: 2, dp: 20, gold: 65 },
    { id: "haven_visit", cat: "General", title: "Walk Haven Gate Square",    stat: "havenSquaresVisited", target: 3, sp: 1, dp: 15, gold: 40 },
    { id: "world_10",    cat: "General", title: "Explore 10 Haven Squares",   stat: "havenSquaresVisited", target: 10, sp: 1, dp: 15, gold: 45 },
    { id: "world_25",    cat: "General", title: "Cartographer of the Deep",   stat: "havenSquaresVisited", target: 25, sp: 2, dp: 30, gold: 90 },
    { id: "world_50",    cat: "General", title: "Master of the Atlas",        stat: "havenSquaresVisited", target: 50, sp: 4, dp: 60, gold: 200 }
  ];

  // 49-Square Haven Gate & Underworks Interactive World Summary Nodes
  const HAVEN_NODES = [
    { id: "town",     name: "Haven Gate",       zone: "town",  vision: "assets/Vision/HAVEN_GATE.jpg",    npc: "Ilen, Keeper of the Gate",     female: true,  quote: "You came up from the Underworks with your board intact. Take this blessing and keep the outer hall clear.", questId: "h_gate",   questTitle: "Keep Haven Gate Clear", rewardGold: 35, rewardSp: 1 },
    { id: "market",   name: "Haven Market",     zone: "town",  vision: "assets/Vision/HAVEN_MARKET.jpg",  npc: "Sela, Market Provisioner",     female: true,  quote: "Fresh loaves and draughts before you descend. The Dungeon Merchant below trades in heavier steel.", questId: "h_market", questTitle: "Provision at Sela's Stall", rewardGold: 30, rewardSp: 1 },
    { id: "smith",    name: "Bram's Forge",     zone: "town",  vision: "assets/Vision/HAVEN_FORGE.jpg",   npc: "Bram, Haven Ironsmith",        female: false, quote: "Three hall marks or two matching blades — either way, tempered steel never lies in the dark.", questId: "h_smith",  questTitle: "Bring Iron to Bram's Anvil", rewardGold: 45, rewardSp: 1 },
    { id: "archive",  name: "The Archive",      zone: "town",  vision: "assets/Vision/HAVEN_ARCHIVE.jpg", npc: "Nim, Keeper of the Record",    female: true,  quote: "We record every Descent from the Mudking Warrens to the Wyrmroost. Speak when you have seen the Warden Door.", questId: "h_archive",questTitle: "Inscribe the Archive Ledger", rewardGold: 40, rewardSp: 1 },
    { id: "board",    name: "Contract Board",   zone: "town",  vision: "assets/Vision/HAVEN_BOARD.jpg",   npc: "Odell, Contract Warden",       female: false, quote: "Rivals have been spotted on Floor 5 carrying full set boards. Put one down and the Board pays double.", questId: "h_board",  questTitle: "Claim Odell's Rival Bounty", rewardGold: 50, rewardSp: 1 },
    { id: "square",   name: "Haven Square",     zone: "town",  vision: "assets/Vision/HAVEN_SQUARE.jpg",  npc: "Hess, Crier of the Square",    female: false, quote: "Walk the market, the forge, the archive, and the lanes so you remember what stands above the dark.", questId: "h_square", questTitle: "Walk the Haven Ring", rewardGold: 35, rewardSp: 1 },
    { id: "shrine",   name: "Underworks Shrine",zone: "crypt", vision: "assets/Vision/DUNGEON_SHRINE.jpg",npc: "Wenn's Shrine Lamp",           female: false, quote: "The lamp still burns in the stone. Even cursed steel can be purified here before the deep floors.", questId: "h_shrine", questTitle: "Light the Underworks Lamp", rewardGold: 45, rewardSp: 1 },
    { id: "wolfpath", name: "North Wolf Road",  zone: "wild",  vision: "assets/Vision/OUTSIDE_FOREST_MOVE_STRAIGHT.jpg", npc: "Reed, North Watch", female: true, quote: "The timber wolves grow bolder near the gate. Test your board's sweep speed on the trail.", questId: "h_wolf", questTitle: "Patrol the North Wolf Road", rewardGold: 40, rewardSp: 1 }
  ];

  // ---------------------------------------------------------------------------
  // HAVEN WORLD — 64 squares. Walk the roads. Fights use the sweep board.
  // ---------------------------------------------------------------------------
  const WORLD_SQUARES = [];
  const WORLD_MAP = {};
  const WORLD_LINK_ERRORS = [];
  const WORLD_WAYPOINTS = ["home", "town", "crypt", "shrine", "northgate", "abyssgate", "waystone"];

  function addSq(id, name, region, zone, x, y, vision, arrive, hint, extra) {
    const plate = vision === "DUNGEON_FORGE" ? "HAVEN_FORGE" : vision;
    const sq = {
      id: id, name: name, region: region, zone: zone, x: x, y: y,
      vision: "assets/Vision/" + plate + ".jpg",
      arrive: arrive, hint: hint,
      n: null, s: null, e: null, w: null,
      pack: null, areaLevel: 1, npc: null, service: null,
      eventKind: null, eventNote: "", portalDescent: null
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) { sq[k] = extra[k]; });
    }
    WORLD_SQUARES.push(sq);
    WORLD_MAP[id] = sq;
  }

  function linkSq(id, n, s, e, w) {
    const sq = WORLD_MAP[id];
    if (!sq) { WORLD_LINK_ERRORS.push("missing square " + id); return; }
    sq.n = n; sq.s = s; sq.e = e; sq.w = w;
  }

  function buildWorldGraph() {
    WORLD_SQUARES.length = 0;
    Object.keys(WORLD_MAP).forEach(function (k) { delete WORLD_MAP[k]; });

    addSq("home", "Wayhouse Bench", "Haven Gate & Town", "home", 0, 0, "HOME_INSIDE_ROOM_WORKBENCH", "The Wayhouse bench. Rest here and the road will still be there.", "North leads to Haven Cross. East of the Cross is Haven Town.", { service: "wayhouse" });
    addSq("stoop", "Wayhouse Road", "Haven Gate & Town", "wilds", 0, 1, "OUTSIDE_ROAD_MOVE_STRAIGHT", "The road from the Wayhouse.", "Haven Cross is north. The bench is south.");
    addSq("cross", "Haven Cross", "Haven Gate & Town", "wilds", 0, 2, "OUTSIDE_ROAD_MOVE_INTERSECTION", "Haven Cross. East is the town. West is the First Hall. North is the wolf road.", "Go east for Haven Gate, or west for the First Hall.");
    addSq("forest", "North Pines", "Haven Gate & Town", "wilds", 0, 3, "OUTSIDE_FOREST_MOVE_STRAIGHT", "The dark pines on the north road.", "North is the wolf that holds the frontier.");
    addSq("wolfpath", "North Wolf Road", "Haven Gate & Town", "wilds", 0, 4, "OUTSIDE_FOREST_MOVE_STRAIGHT", "An Ash Timber Wolf holds the northern pass.", "Clear the wolf and Northwatch opens.", { pack: ["wolf"], areaLevel: 1 });
    addSq("eastroad", "East Gate Road", "Haven Gate & Town", "wilds", 1, 2, "OUTSIDE_ROAD_MOVE_STRAIGHT", "The east road into Haven.", "Haven Gate is ahead.");
    addSq("town", "Haven Gate", "Haven Gate & Town", "town", 2, 2, "HAVEN_GATE", "Haven Gate. Ilen counts who comes back.", "Market is east. The square is north.", { npc: "ilen" });
    addSq("market", "Haven Market", "Haven Gate & Town", "town", 3, 2, "HAVEN_MARKET", "Sela keeps bread, draughts, and a rotating counter of steel.", "Buy from the counter. East is Mara's yard.", { npc: "sela", service: "shop" });
    addSq("square", "Haven Square", "Haven Gate & Town", "town", 2, 3, "HAVEN_SQUARE", "Hess sits where the four ways meet.", "Forge north, archive east, contracts west, gate south.", { npc: "hess" });
    addSq("smith", "Bram's Forge", "Haven Gate & Town", "town", 2, 4, "HAVEN_FORGE", "Bram tempers board steel and will fuse two pieces into one.", "The forge is open. The shed is north.", { npc: "bram", service: "forge" });
    addSq("archive", "The Archive", "Haven Gate & Town", "town", 3, 3, "HAVEN_ARCHIVE", "Nim keeps one true line at a time.", "Read the Haven record. The lamps are east.", { npc: "nim", service: "archive" });
    addSq("board", "Contract Board", "Haven Gate & Town", "town", 1, 3, "HAVEN_BOARD", "Odell pays for halls you have actually cleared.", "Claim a contract after a crypt fight. Calder's row is north.", { npc: "odell", service: "bounties" });
    addSq("yard", "Mara's Yard", "Haven Gate & Town", "town", 4, 2, "HAVEN_YARD", "Mara's morning loaf is racked here.", "Carry her word to Sela, then come back through the market.", { npc: "mara" });
    addSq("lamps", "Wenn's Lamp House", "Haven Gate & Town", "town", 4, 3, "HAVEN_LAMPS", "Wenn trims a lamp for anyone who has not come back.", "He wants the Underworks shrine seen. Reed's post is north.", { npc: "wenn" });
    addSq("post", "Reed's Horse Post", "Haven Gate & Town", "town", 4, 4, "HAVEN_POST", "The horse stops where the town stops.", "Reed wants the wolf road scouted. The loft is west.", { npc: "reed" });
    addSq("loft", "Tavia's Loft", "Haven Gate & Town", "town", 3, 4, "HAVEN_LOFT", "Tavia widens equipment boards and cleans cursed steel.", "The Astral Waystone is north.", { npc: "tavia", service: "artificer" });
    addSq("shed", "Pell's Shed", "Haven Gate & Town", "town", 2, 5, "HAVEN_SHED", "Pell keeps the forge coals banked.", "Ask him for a ward before the next fight.", { npc: "pell" });
    addSq("row", "Calder's Row", "Haven Gate & Town", "town", 1, 4, "HAVEN_ROW", "Calder watches the hall from a single step.", "He wants you standing in the Mouth of the First Hall.", { npc: "calder" });
    addSq("waystone", "Astral Waystone", "Haven Gate & Town", "town", 3, 5, "DUNGEON_SHRINE", "The waystone hums with places you have already stood.", "It only throws you to a waypoint you have seen.", { service: "waystone" });

    addSq("westroad", "West Hall Road", "The First Hall", "wilds", -1, 2, "OUTSIDE_ROAD_MOVE_STRAIGHT", "The west road to the First Hall.", "A ward-stone sits on the verge.", { eventKind: "shrine", eventNote: "A roadside ward-stone. Heal, or take a cursed blade." });
    addSq("crypt", "Mouth of First Hall", "The First Hall", "crypt", -2, 2, "DUNGEON_HALL_MOVE_STRAIGHT", "The stone mouth of the First Hall.", "West is the Outer Hall. The Mudking gauntlet starts here.", { portalDescent: 0 });
    addSq("outer", "The Outer Hall", "The First Hall", "crypt", -3, 2, "DUNGEON_HALL_MOVE_STRAIGHT", "The Outer Hall. This is Ilen's first test.", "Clear the skeleton, then go deeper.", { pack: ["skeleton"], areaLevel: 1 });
    addSq("mid", "The Mid Hall", "The First Hall", "crypt", -4, 2, "DUNGEON_HALL_MOVE_STRAIGHT", "Two skeletons keep the Mid Hall.", "South is the Underworks crack. West is the Deep Hall.", { pack: ["skeleton", "skeleton"], areaLevel: 2 });
    addSq("deep", "The Deep Hall", "The First Hall", "crypt", -5, 2, "DUNGEON_HALL_MOVE_STRAIGHT", "A wolf and a hound den in the deep stone.", "North is the ossuary. South is the den. West is the Warden Door.", { pack: ["wolf", "hound"], areaLevel: 2 });
    addSq("ward", "The Warden Door", "The First Hall", "crypt", -6, 2, "DUNGEON_BOSS", "The Warden of the Seal stands with one honour guard.", "Sighting this door is Nim's work. Beating the Warden opens the deep wing.", { pack: ["warden", "skeleton"], areaLevel: 3, portalDescent: 0 });

    addSq("boneN", "North Ossuary", "The Underworks", "crypt", -5, 3, "DUNGEON_OSSUARY", "Bones stacked like shelving.", "West is the choir loft.", { pack: ["skeleton", "skeleton"], areaLevel: 2 });
    addSq("choirN", "Upper Choir Loft", "The Underworks", "crypt", -6, 3, "DUNGEON_HALL_MOVE_STRAIGHT", "A choir loft above the Warden Door.", "West is the Wheel Room.", { pack: ["acolyte", "acolyte"], areaLevel: 3 });
    addSq("whisper", "The Wheel Room", "The Underworks", "crypt", -7, 3, "DUNGEON_TRAP", "An iron wheel is set in the wall.", "Spin it, or walk on to the Rook.", { eventKind: "wheel", eventNote: "The Wheel of Fortune. 25 gold a spin." });
    addSq("rook", "The Hanging Rook", "The Underworks", "crypt", -8, 3, "DUNGEON_CAGE", "Iron cages hang over a dry drop.", "South is the Ash Gate.", { pack: ["sentinel", "sentinel"], areaLevel: 3 });
    addSq("seal", "The Vault Seal", "The Underworks", "crypt", -7, 2, "DUNGEON_VAULT", "A runed seal blocks the west passage.", "The Vault Key is in the Relic Niche, south and east of here. Or pay 40 gold to break it.", { eventKind: "seal", eventNote: "Shut until you hold the Vault Key." });
    addSq("ashgate", "The Ash Gate", "The Underworks", "crypt", -8, 2, "DUNGEON_HALL_MOVE_STRAIGHT", "The Ashlord's wing starts here.", "South is the Vault Throne.", { pack: ["sentinel", "acolyte"], areaLevel: 3 });
    addSq("cracks", "Split-Flag Crack", "The Underworks", "crypt", -4, 1, "DUNGEON_HALL_MOVE_STRAIGHT", "A crack off the Mid Hall. A chest is wedged in the flags.", "Open it, then take the stair south.", { eventKind: "chest", eventNote: "A stash chest between the split flags.", areaLevel: 2 });
    addSq("den", "Hound Side-Den", "The Underworks", "crypt", -5, 1, "DUNGEON_CAGE", "A side den under the Deep Hall.", "West is the black-drop span.", { pack: ["hound", "hound"], areaLevel: 2 });
    addSq("bridge", "Black-Drop Span", "The Underworks", "crypt", -6, 1, "DUNGEON_BRIDGE", "A stone span over a black drop.", "West is the Cold Forge.", { pack: ["shade", "skeleton"], areaLevel: 3 });
    addSq("forgedead", "The Cold Forge", "The Underworks", "crypt", -7, 1, "DUNGEON_ARMORY", "An anvil under the halls still holds heat.", "Clear the guards, then temper or fuse.", { pack: ["skeleton", "skeleton", "acolyte"], areaLevel: 3, eventKind: "forge" });
    addSq("throne", "The Vault Throne", "The Underworks", "crypt", -8, 1, "DUNGEON_BOSS", "The Sovereign Ashlord stands with two sentinels.", "Beat the Ashlord and the Abyssal Breach opens west.", { pack: ["ashlord", "sentinel", "sentinel"], areaLevel: 4, portalDescent: 3 });
    addSq("stair", "Tight Stone Stair", "The Underworks", "crypt", -4, 0, "DUNGEON_HALL_MOVE_STRAIGHT", "A tight stair between the crack and the shrine.", "South is Wenn's lamp.", { pack: ["skeleton", "skeleton"], areaLevel: 2 });
    addSq("pit", "Flagged Spike Pit", "The Underworks", "crypt", -5, 0, "DUNGEON_TRAP", "Iron spikes wait under the plates.", "Disarm the cache, then go south to the niches.", { eventKind: "chest", areaLevel: 2, eventNote: "A trapped cache under the spike plates." });
    addSq("armory", "Hall Armory", "The Underworks", "crypt", -6, 0, "DUNGEON_ARMORY", "Hall iron, still racked.", "West is the Blade Hall.", { pack: ["sentinel", "sentinel", "raider"], areaLevel: 3 });
    addSq("spike", "The Blade Hall", "The Underworks", "crypt", -7, 0, "DUNGEON_TRAP", "The floor is one long pressure plate.", "The wheel here pays in relics or gold.", { eventKind: "wheel", areaLevel: 3, eventNote: "A blade-wheel. 25 gold a spin." });
    addSq("hoard", "The Vault Hoard", "The Underworks", "crypt", -8, 0, "DUNGEON_VAULT", "The Ashlord's hoard. Coin, draughts, and rare steel.", "North is the throne. South is the named graves.", { eventKind: "chest", areaLevel: 4, eventNote: "The royal hoard chest." });
    addSq("shrine", "Underworks Shrine", "The Underworks", "crypt", -4, -1, "DUNGEON_SHRINE", "A quiet shrine. The lamp still burns for Wenn.", "Pray, or take the cursed gift. Seeing this lamp is Wenn's quest.", { eventKind: "shrine", areaLevel: 2 });
    addSq("ossuary", "Bone Niches", "The Underworks", "crypt", -5, -1, "DUNGEON_OSSUARY", "Something hunts between the niches.", "South is the Relic Niche and the Vault Key.", { pack: ["hound", "hound"], areaLevel: 2 });
    addSq("cage", "Cage Row", "The Underworks", "crypt", -6, -1, "DUNGEON_CAGE", "Three of the dead are loose.", "South is the hymn hall.", { pack: ["skeleton", "skeleton", "shade"], areaLevel: 2 });
    addSq("well", "The Dry Well", "The Underworks", "crypt", -7, -1, "DUNGEON_VAULT", "A dry well used as a smuggler's chest.", "Open it. South is the hound nest.", { eventKind: "chest", areaLevel: 3 });
    addSq("crypts", "Named Graves", "The Underworks", "crypt", -8, -1, "DUNGEON_OSSUARY", "Cinder acolytes chant over the named graves.", "South is the cistern.", { pack: ["acolyte", "acolyte", "acolyte"], areaLevel: 3 });
    addSq("relic", "Relic Vault Niche", "The Underworks", "crypt", -5, -2, "DUNGEON_VAULT", "The Vault Key rests on this altar.", "Take the key, then draft a relic if you want one.", { eventKind: "relic", areaLevel: 3 });
    addSq("choir", "Lower Hymn Hall", "The Underworks", "crypt", -6, -2, "DUNGEON_HALL_MOVE_STRAIGHT", "A Blood Choir Cantor leads the hymn.", "West is the hound nest.", { pack: ["cantor", "acolyte", "acolyte"], areaLevel: 3 });
    addSq("nest", "Chain-Hound Nest", "The Underworks", "crypt", -7, -2, "DUNGEON_CAGE", "Blighted hounds strain at their chains.", "West is the cistern.", { pack: ["hound", "hound", "hound"], areaLevel: 3 });
    addSq("cistern", "The Slam Cistern", "The Underworks", "crypt", -8, -2, "DUNGEON_TRAP", "The bottom of the Underworks. Cold water and a locked cache.", "Fight, then open the chest.", { pack: ["effigy", "shade"], areaLevel: 3, eventKind: "chest" });

    addSq("northgate", "Northwatch Palisade", "Northern Frontier", "frontier", 0, 5, "OUTSIDE_ROAD_MOVE_INTERSECTION", "Past the wolf, the northern frontier opens.", "Captain Lyra keeps a field counter. North, east, and west are new roads.", { npc: "lyra_watch", service: "shop" });
    addSq("pinecrest", "Rime-Pine Ridge", "Northern Frontier", "frontier", 0, 6, "OUTSIDE_FOREST_MOVE_STRAIGHT", "Corvath Duskwing hunts the snow pines.", "West is the Glacial Watchtower.", { pack: ["corvath", "wolf", "wolf"], areaLevel: 3 });
    addSq("frostwatch", "Glacial Watchtower", "Northern Frontier", "frontier", -1, 6, "DUNGEON_OSSUARY", "Vespera Shadebow guards the Bonevault entrance.", "Duel her, or enter Descent II.", { pack: ["rival_ranger"], areaLevel: 4, portalDescent: 1 });
    addSq("miregate", "Chittering Mire Causeway", "Northern Frontier", "frontier", -1, 5, "OUTSIDE_ROAD_MOVE_LEFT", "A mist causeway west of Northwatch.", "West is the Collector's Tollhouse.", { pack: ["shade", "hound", "raider"], areaLevel: 3 });
    addSq("tithecourt", "Collector's Tollhouse", "Northern Frontier", "frontier", -2, 5, "DUNGEON_CAGE", "The Tithe Collector weighs every coin in blood.", "Fight him, browse his counter, or enter Descent III.", { pack: ["tithe", "raider"], areaLevel: 4, portalDescent: 2, eventKind: "shop" });
    addSq("ironpass", "Iron-Tooth Pass", "Northern Frontier", "frontier", 1, 5, "OUTSIDE_ROAD_MOVE_RIGHT", "A jagged pass east of Northwatch.", "North is the proving ring. East is the caldera.", { pack: ["sentinel", "raider"], areaLevel: 3 });
    addSq("rivalring", "Challengers' Proving Ring", "Northern Frontier", "frontier", 1, 6, "DUNGEON_ARMORY", "Rival crawlers stand here with full set boards.", "Pick a rival. Both boards sweep at once.", { pack: ["rival_knight"], areaLevel: 4, service: "rival_arena" });
    addSq("cinderfeld", "Cinderfeld Caldera", "Northern Frontier", "frontier", 2, 6, "HAVEN_FORGE", "Cinder acolytes temper cursed steel in the slag.", "Clear them, then use the caldera forge. East is the Ash Court.", { pack: ["effigy", "acolyte", "cantor"], areaLevel: 4, eventKind: "forge" });
    addSq("ashkeep", "Citadel of the Ash Court", "Northern Frontier", "frontier", 3, 6, "DUNGEON_BOSS", "Emberion rules the burning ramparts.", "Slay Emberion, or launch Descent IV.", { pack: ["emberion", "cantor"], areaLevel: 5, portalDescent: 3 });

    addSq("abyssgate", "The Abyssal Breach", "Abyssal Breach", "abyss", -9, 1, "DUNGEON_BRIDGE", "A rift west of the Ashlord's throne.", "The wyrmbone causeway continues west.", { pack: ["corvath", "effigy"], areaLevel: 5 });
    addSq("wyrmbridge", "Wyrmbone Causeway", "Abyssal Breach", "abyss", -10, 1, "DUNGEON_BRIDGE", "A bridge of wyrm-bone over the void.", "North is a sanctuary. South is the Eternal Lock. West is the roost.", { pack: ["cantor", "cantor", "sentinel"], areaLevel: 5 });
    addSq("starshrine", "Sanctuary of the Lattice", "Abyssal Breach", "abyss", -10, 2, "DUNGEON_SHRINE", "An astral sanctuary above the abyss.", "Draft a relic and restore yourself before the roost.", { eventKind: "relic", areaLevel: 5 });
    addSq("wyrmroost", "The Abyssal Wyrmroost", "Abyssal Breach", "abyss", -11, 1, "DUNGEON_VAULT", "The Abyssal Leviathan coils around the sunken spire.", "Defeat the leviathan, or enter Descent V.", { pack: ["leviathan", "corvath"], areaLevel: 6, portalDescent: 4 });
    addSq("heartvault", "Sanctum of the Eternal Lock", "Abyssal Breach", "abyss", -10, 0, "DUNGEON_BOSS", "The Eternal Lock and the Heart of the Crypt pulse as one.", "This is the bottom of the atlas. The daily climb starts here too.", { pack: ["lockboss", "heartboss"], areaLevel: 7, portalDescent: 5 });

    linkSq("home", "stoop", null, null, null);
    linkSq("stoop", "cross", "home", null, null);
    linkSq("cross", "forest", "stoop", "eastroad", "westroad");
    linkSq("forest", "wolfpath", "cross", null, null);
    linkSq("wolfpath", "northgate", "forest", null, null);
    linkSq("eastroad", null, null, "town", "cross");
    linkSq("town", "square", null, "market", "eastroad");
    linkSq("market", null, null, "yard", "town");
    linkSq("square", "smith", "town", "archive", "board");
    linkSq("smith", "shed", "square", "loft", "row");
    linkSq("archive", "loft", null, "lamps", "square");
    linkSq("board", "row", null, "square", null);
    linkSq("yard", "lamps", null, null, "market");
    linkSq("lamps", "post", "yard", null, "archive");
    linkSq("post", null, "lamps", null, "loft");
    linkSq("loft", "waystone", "archive", "post", "smith");
    linkSq("waystone", null, "loft", null, null);
    linkSq("shed", null, "smith", null, null);
    linkSq("row", null, "board", "smith", null);

    linkSq("westroad", null, null, "cross", "crypt");
    linkSq("crypt", null, null, "westroad", "outer");
    linkSq("outer", null, null, "crypt", "mid");
    linkSq("mid", null, "cracks", "outer", "deep");
    linkSq("deep", "boneN", "den", "mid", "ward");
    linkSq("ward", "choirN", "bridge", "deep", "seal");

    linkSq("boneN", null, "deep", null, "choirN");
    linkSq("choirN", null, "ward", "boneN", "whisper");
    linkSq("whisper", null, "seal", "choirN", "rook");
    linkSq("rook", null, "ashgate", "whisper", null);
    linkSq("seal", "whisper", "forgedead", "ward", "ashgate");
    linkSq("ashgate", "rook", "throne", "seal", null);
    linkSq("cracks", "mid", "stair", null, "den");
    linkSq("den", "deep", "pit", "cracks", "bridge");
    linkSq("bridge", "ward", "armory", "den", "forgedead");
    linkSq("forgedead", "seal", "spike", "bridge", "throne");
    linkSq("throne", "ashgate", "hoard", "forgedead", "abyssgate");
    linkSq("stair", "cracks", "shrine", null, "pit");
    linkSq("pit", "den", "ossuary", "stair", "armory");
    linkSq("armory", "bridge", "cage", "pit", "spike");
    linkSq("spike", "forgedead", "well", "armory", "hoard");
    linkSq("hoard", "throne", "crypts", "spike", null);
    linkSq("shrine", "stair", null, null, "ossuary");
    linkSq("ossuary", "pit", "relic", "shrine", "cage");
    linkSq("cage", "armory", "choir", "ossuary", "well");
    linkSq("well", "spike", "nest", "cage", "crypts");
    linkSq("crypts", "hoard", "cistern", "well", null);
    linkSq("relic", "ossuary", null, null, "choir");
    linkSq("choir", "cage", null, "relic", "nest");
    linkSq("nest", "well", null, "choir", "cistern");
    linkSq("cistern", "crypts", null, "nest", null);

    linkSq("northgate", "pinecrest", "wolfpath", "ironpass", "miregate");
    linkSq("pinecrest", null, "northgate", "rivalring", "frostwatch");
    linkSq("frostwatch", null, "miregate", "pinecrest", null);
    linkSq("miregate", "frostwatch", null, "northgate", "tithecourt");
    linkSq("tithecourt", null, null, "miregate", null);
    linkSq("ironpass", "rivalring", null, "cinderfeld", "northgate");
    linkSq("rivalring", null, "ironpass", null, "pinecrest");
    linkSq("cinderfeld", null, null, "ashkeep", "ironpass");
    linkSq("ashkeep", null, null, null, "cinderfeld");

    linkSq("abyssgate", null, null, "throne", "wyrmbridge");
    linkSq("wyrmbridge", "starshrine", "heartvault", "abyssgate", "wyrmroost");
    linkSq("starshrine", null, "wyrmbridge", null, null);
    linkSq("wyrmroost", null, null, "wyrmbridge", null);
    linkSq("heartvault", "wyrmbridge", null, null, null);

    const back = { n: "s", s: "n", e: "w", w: "e" };
    WORLD_SQUARES.forEach(function (sq) {
      ["n", "s", "e", "w"].forEach(function (dir) {
        const to = sq[dir];
        if (!to) return;
        const other = WORLD_MAP[to];
        if (!other) WORLD_LINK_ERRORS.push(sq.id + " " + dir + " missing " + to);
        else if (other[back[dir]] !== sq.id) WORLD_LINK_ERRORS.push(sq.id + " " + dir + " -> " + to + " back is " + other[back[dir]]);
      });
    });
  }

  buildWorldGraph();

  const HAVEN_NPCS = {
    ilen: { id: "ilen", name: "Ilen, Gate Warden", female: true, portrait: "assets/Portraits/lyra.jpg", line: "You came up from the bench with your board intact. Clear the Outer Hall and I will know your name." },
    sela: { id: "sela", name: "Sela, Market Provisioner", female: true, portrait: "assets/Portraits/lyra_talk.jpg", line: "Bread, draughts, and steel with a price. If Mara sent you, say so. The counter is open either way." },
    hess: { id: "hess", name: "Hess, Speaker of the Square", female: false, portrait: "assets/Portraits/lightfather.jpg", line: "Walk the market, the forge, the archive, and the board. Then the six lanes. The town is the part you come back to." },
    bram: { id: "bram", name: "Bram, Haven Ironsmith", female: false, portrait: "assets/Portraits/justin.jpg", line: "Matching pieces merge on their own. Different pieces I can fuse. Put the lead item at the top of the board." },
    nim: { id: "nim", name: "Nim, Keeper of the Archive", female: true, portrait: "assets/Portraits/lyra.jpg", line: "I do not need the Warden dead. I need you to have stood at the Warden Door and come back with the truth of it." },
    odell: { id: "odell", name: "Odell, Contract Warden", female: false, portrait: "assets/Portraits/sephrael.jpg", line: "I pay for crypt rooms you have cleared since the last chit. No story. No advance." },
    mara: { id: "mara", name: "Mara, Baker of the Yard", female: true, portrait: "assets/Portraits/lyra_talk.jpg", line: "Tell Sela the morning loaf is racked. Ugly and honest. Then the errand is done." },
    wenn: { id: "wenn", name: "Wenn, Lamp Trimmer", female: false, portrait: "assets/Portraits/lightfather.jpg", line: "There is a shrine under the stair in the Underworks. If the lamp is still burning, I can stop counting you among the missing." },
    reed: { id: "reed", name: "Reed, North Post Rider", female: true, portrait: "assets/Portraits/lyra.jpg", line: "Ride as far as the wolf road and leave the north shut if you must. I only need to know the road is still a road." },
    tavia: { id: "tavia", name: "Tavia, Loft Artificer", female: true, portrait: "assets/Portraits/sephrael.jpg", line: "Eighty gold opens four more slots on the board. Twenty-five gold pulls the curse off one piece you have selected." },
    pell: { id: "pell", name: "Pell, Keeper of Coals", female: false, portrait: "assets/Portraits/justin.jpg", line: "Take a coal ward. The next fight starts with sixteen extra block. It spends itself." },
    calder: { id: "calder", name: "Calder, Watcher of the Row", female: false, portrait: "assets/Portraits/lightfather.jpg", line: "Stand in the Mouth of the First Hall. You do not have to go in. You have to know the door." },
    lyra_watch: { id: "lyra_watch", name: "Captain Lyra, Northwatch", female: true, portrait: "assets/Portraits/lyra.jpg", line: "The wolf is behind you, so the frontier is in front of you. Pine ridge, mire, iron pass. Do not skip the proving ring." }
  };

  const HAVEN_LORE_BOOK = [
    { title: "I. The Bench", lines: ["You wake on the Wayhouse bench. Death brings you back here.", "Gear, level, and the squares you have seen stay with you.", "North is the cross. East of the cross is Haven. West is the First Hall."] },
    { title: "II. The Board", lines: ["Every piece on the equipment board fires in sweep order.", "Two identical pieces of the same level merge to the next level.", "Bram, the Cold Forge, and the caldera can fuse two different pieces."] },
    { title: "III. The First Hall", lines: ["Mouth, Outer Hall, Mid Hall, Deep Hall, Warden Door.", "Ilen's work is the Outer Hall. Nim's work is seeing the door.", "The Underworks branch off the mid hall, the deep hall, and the door."] },
    { title: "IV. The Vault Key", lines: ["The Relic Niche in the south Underworks holds the Vault Key.", "The key opens the seal west of the Warden Door.", "Beyond that seal is the Ashlord. Beyond the Ashlord is the Breach."] },
    { title: "V. The North", lines: ["The timber wolf holds the road at the pines.", "Clear that square and Northwatch, the mire, the proving ring, and the Ash Court open.", "Descent gates on the frontier launch the seven-floor gauntlet."] }
  ];

  const WORLD_QUESTS = [
    { id: "road", title: "Reach Haven Gate", detail: "Walk east from the cross to the gate.", gold: 12, xp: 10, ready: function () { return seenHas("town"); } },
    { id: "outer", title: "Clear the Outer Hall", detail: "Beat the skeleton in the Outer Hall for Ilen.", gold: 22, xp: 16, sp: 1, ready: function () { return clearCount("outer") > 0; } },
    { id: "marks", title: "Three hall marks", detail: "Clear Outer, Mid, and Deep.", gold: 36, xp: 24, sp: 1, ready: function () { return clearCount("outer") && clearCount("mid") && clearCount("deep"); } },
    { id: "door", title: "See the Warden Door", detail: "Stand at the Warden Door for Nim.", gold: 18, xp: 12, ready: function () { return seenHas("ward"); } },
    { id: "circuit", title: "Walk the Haven ring", detail: "Market, forge, archive, and contract board.", gold: 16, xp: 12, ready: function () { return seenHas("market") && seenHas("smith") && seenHas("archive") && seenHas("board"); } },
    { id: "lanes", title: "Walk the six lanes", detail: "Yard, lamps, post, loft, shed, and row.", gold: 18, xp: 14, ready: function () { return ["yard", "lamps", "post", "loft", "shed", "row"].every(seenHas); } },
    { id: "loaf", title: "Mara's loaf", detail: "Speak to Mara, then speak to Sela.", gold: 10, xp: 8, ready: function () { return flagOn("loaf_mara") && flagOn("loaf_sela"); } },
    { id: "lamp", title: "Wenn's shrine", detail: "Stand in the Underworks shrine.", gold: 14, xp: 10, ready: function () { return seenHas("shrine"); } },
    { id: "rein", title: "Scout the wolf road", detail: "Stand on the North Wolf Road for Reed.", gold: 10, xp: 8, ready: function () { return seenHas("wolfpath"); } },
    { id: "eaves", title: "The hall mouth", detail: "Stand in the Mouth of the First Hall for Calder.", gold: 12, xp: 8, ready: function () { return seenHas("crypt"); } },
    { id: "wolf", title: "Open the north road", detail: "Defeat the Ash Timber Wolf.", gold: 28, xp: 20, sp: 1, ready: function () { return clearCount("wolfpath") > 0; } },
    { id: "key", title: "Take the Vault Key", detail: "Claim the key in the Relic Niche.", gold: 20, xp: 16, ready: function () { return flagOn("vault_key"); } },
    { id: "ash", title: "Fell the Ashlord", detail: "Clear the Vault Throne.", gold: 70, xp: 48, sp: 2, dp: 15, ready: function () { return clearCount("throne") > 0; } },
    { id: "frontier", title: "Reach Northwatch", detail: "Walk through the opened wolf road.", gold: 30, xp: 20, sp: 1, ready: function () { return seenHas("northgate"); } },
    { id: "abyss", title: "Cross the Breach", detail: "Step into the Abyssal Breach west of the throne.", gold: 48, xp: 30, sp: 1, dp: 10, ready: function () { return seenHas("abyssgate"); } }
  ];

  function seenHas(id) {
    return !!(state.seen && state.seen.indexOf(id) >= 0);
  }
  function clearCount(id) {
    return (state.cleared && state.cleared[id]) || 0;
  }
  function flagOn(id) {
    return !!(state.flags && state.flags[id]);
  }
  function currentSquare() {
    return WORLD_MAP[state.squareId] || WORLD_MAP.home;
  }
  function noteSeen(id) {
    if (!state.seen) state.seen = [];
    if (state.seen.indexOf(id) < 0) state.seen.push(id);
    state.havenSquaresVisited = state.seen.length;
  }
  function ensureWorldState() {
    if (!state.seen) state.seen = ["home"];
    if (!state.cleared) state.cleared = {};
    if (!state.flags) state.flags = {};
    if (!state.questDone) state.questDone = [];
    if (!state.squareId || !WORLD_MAP[state.squareId]) state.squareId = "home";
    noteSeen(state.squareId);
    const stats = getHeroComputedStats();
    if (typeof state.worldHp !== "number" || state.worldHp <= 0) state.worldHp = stats.maxHp;
    if (typeof state.worldMp !== "number" || state.worldMp < 0) state.worldMp = stats.maxMp;
    state.worldHp = Math.max(1, Math.min(stats.maxHp, state.worldHp));
    state.worldMp = Math.max(0, Math.min(stats.maxMp, state.worldMp));
    if (!ui.atlasRegion) ui.atlasRegion = currentSquare().region;
  }
  function travelBlocked(from, toId) {
    if (!toId || !WORLD_MAP[toId]) return "No road that way.";
    if (from.id === "wolfpath" && toId === "northgate" && clearCount("wolfpath") < 1) {
      return "The Ash Timber Wolf still holds the north road. Fight it on this square.";
    }
    if (from.id === "seal" && toId === "ashgate" && !flagOn("vault_key")) {
      return "The Vault Seal is shut. The key is in the Relic Niche, or break the seal for 40 gold.";
    }
    return "";
  }
  function markSquareCleared(id) {
    if (!id || !WORLD_MAP[id]) return;
    if (!state.cleared) state.cleared = {};
    state.cleared[id] = (state.cleared[id] || 0) + 1;
  }
  function applyWorldVitalsToRun() {
    const stats = getHeroComputedStats();
    ensureWorldState();
    run.heroMaxHp = stats.maxHp;
    run.heroMaxMp = stats.maxMp;
    run.heroHp = Math.min(stats.maxHp, state.worldHp);
    run.heroMp = Math.min(stats.maxMp, state.worldMp);
    run.heroBlock = stats.startBlk;
    run.heroThorns = stats.thorns + (run.relicIds && run.relicIds.indexOf("thorn_idol") >= 0 ? 8 : 0);
  }
  function parkOnRoad(message) {
    if (run.heroHp > 0) {
      state.worldHp = run.heroHp;
      state.worldMp = run.heroMp;
    }
    run.launchedFromWorld = false;
    run.worldSkirmish = false;
    run.worldEvent = false;
    ui.mode = "world";
    ui.modal = null;
    ui.bannerMsg = message;
    saveState();
    render();
  }
  function returnFromWorldEncounter(markClear) {
    const id = run.returnSquare || state.squareId || "home";
    if (markClear) markSquareCleared(id);
    if (run.heroHp > 0) {
      state.worldHp = run.heroHp;
      state.worldMp = run.heroMp;
    }
    run.worldSkirmish = false;
    run.worldEvent = false;
    run.combatWon = false;
    ui.mode = "world";
    ui.modal = null;
    const sq = WORLD_MAP[id];
    ui.bannerMsg = markClear && sq ? (sq.name + " is clear. Pick a road.") : (sq ? sq.arrive : "Back on the road.");
    saveState();
    render();
  }
  function wakeAtWayhouse(reason) {
    const stats = getHeroComputedStats();
    state.squareId = "home";
    noteSeen("home");
    state.worldHp = Math.max(1, Math.round(stats.maxHp * 0.5));
    state.worldMp = Math.max(0, Math.round(stats.maxMp * 0.5));
    run.heroHp = state.worldHp;
    run.worldSkirmish = false;
    run.worldEvent = false;
    run.launchedFromWorld = false;
    run.combatWon = false;
    ui.mode = "world";
    ui.modal = null;
    ui.bannerMsg = reason;
    playSfx("hurt", 0.4);
    saveState();
    render();
  }
  function travelDir(dir) {
    ensureWorldState();
    const sq = currentSquare();
    const toId = sq[dir];
    const block = travelBlocked(sq, toId);
    if (block) {
      ui.bannerMsg = block;
      playSfx("miss", 0.28);
      render();
      return;
    }
    state.squareId = toId;
    noteSeen(toId);
    ui.atlasRegion = WORLD_MAP[toId].region;
    ui.bannerMsg = WORLD_MAP[toId].arrive;
    playSfx("stone", 0.22);
    saveState();
    render();
  }
  function teleportTo(id) {
    const here = currentSquare();
    const dest = WORLD_MAP[id];
    if (!dest || !seenHas(id)) {
      ui.bannerMsg = "The waystone only knows places you have stood.";
      render();
      return;
    }
    if (here.service !== "waystone") {
      ui.bannerMsg = "Use the Astral Waystone, north of Tavia's loft.";
      render();
      return;
    }
    if (WORLD_WAYPOINTS.indexOf(id) < 0) {
      ui.bannerMsg = "That place is not a waypoint.";
      render();
      return;
    }
    state.squareId = id;
    ui.atlasRegion = dest.region;
    ui.bannerMsg = "The waystone sets you down at " + dest.name + ".";
    playSfx("spell", 0.35);
    saveState();
    render();
  }
  function beginWorldEncounter(kind, pack) {
    const sq = currentSquare();
    ensureWorldState();
    run.active = true;
    run.dead = false;
    run.worldSkirmish = kind === "combat";
    run.worldEvent = kind !== "combat";
    run.launchedFromWorld = true;
    run.returnSquare = sq.id;
    run.descentIndex = state.selectedDescent;
    run.floor = Math.max(1, sq.areaLevel || 1);
    run.step = 1;
    run.autoBattle = true;
    run.speedMult = run.speedMult || 1.5;
    run.phoenixUsed = false;
    if (!run.relicIds || !run.relicIds.length) run.relicIds = ["loaded_dice"];
    run.log = ["=== " + sq.name.toUpperCase() + " ==="];
    ui.modal = null;
    if (kind === "combat") {
      applyWorldVitalsToRun();
      if (state.flags.pellWardCharges > 0) {
        run.heroBlock += 16;
        state.flags.pellWardCharges -= 1;
        addRunLog("Pell's coal ward grants +16 Block.");
      }
      run.roomKind = "combat";
      run.floorPlan = ["combat", "combat", "combat", "combat", "combat"];
      run.combatWon = false;
      run.enemies = [];
      run.targetIndex = 0;
      run.sweepIndex = 0;
      run.sweepProgress = 0;
      run.enemyTurnProgress = 0;
      run.rivalSweepProgress = 0;
      run.rivalSweepIndex = 0;
      const scale = 0.9 + (sq.areaLevel || 1) * 0.16;
      (pack || []).forEach(function (id) {
        const def = MONSTERS[id] || MONSTERS.wolf;
        const flags = {};
        if (def.boss) flags.isBoss = true;
        if (def.rival) {
          flags.isRival = true;
          flags.rivalBoard = generateRivalBoard(def.archetype || "STEEL", sq.areaLevel || 2);
        }
        run.enemies.push(makeEnemyInstance(def, sq.areaLevel || 1, scale, flags));
      });
      if (!run.enemies.length) {
        run.worldSkirmish = false;
        ui.mode = "world";
        ui.bannerMsg = "Nothing here will fight.";
        render();
        return;
      }
      addRunLog("Encountered " + run.enemies.map(function (e) { return e.def.name; }).join(", ") + ".");
      ui.mode = "run";
      saveState();
      render();
      return;
    }
    ui.mode = "run";
    applyWorldVitalsToRun();
    enterRunStep(run.floor, 1, kind);
    saveState();
  }
  function talkToNpc(id) {
    const npc = HAVEN_NPCS[id];
    if (!npc) return;
    if (!state.flags) state.flags = {};
    if (id === "mara") state.flags.loaf_mara = true;
    if (id === "sela" && state.flags.loaf_mara) state.flags.loaf_sela = true;
    if (id === "pell" && !state.flags.pellWardGiven) {
      state.flags.pellWardGiven = true;
      state.flags.pellWardCharges = 1;
    }
    ui.bannerMsg = npc.name + ": " + npc.line;
    if (window.lygoSpeak) window.lygoSpeak(npc.line, npc.female);
    playSfx("spell", 0.2);
    saveState();
    render();
  }
  function claimWorldQuest(id) {
    const q = WORLD_QUESTS.filter(function (item) { return item.id === id; })[0];
    if (!q || !state.questDone) return;
    if (state.questDone.indexOf(id) >= 0 || !q.ready()) return;
    state.questDone.push(id);
    state.coins += q.gold || 0;
    state.xp += q.xp || 0;
    state.skillPoints += q.sp || 0;
    state.dungeonPoints += q.dp || 0;
    checkLevelUp();
    ui.bannerMsg = "Quest complete: " + q.title + ".";
    playSfx("spell", 0.45);
    saveState();
    render();
  }
  function cryptClearTotal() {
    let n = 0;
    WORLD_SQUARES.forEach(function (sq) {
      if (sq.zone === "crypt" && clearCount(sq.id) > 0) n += 1;
    });
    return n;
  }
  function handleWorldAction(act) {
    if (act === "enter-world") {
      ensureWorldState();
      ui.mode = "world";
      ui.modal = null;
      ui.bannerMsg = currentSquare().arrive;
      render();
      return true;
    }
    if (act === "open-gauntlet") {
      ui.mode = "hub";
      ui.modal = null;
      ui.bannerMsg = "Gauntlet hub. Pick a descent, or press H to return to the road.";
      render();
      return true;
    }
    if (act === "rest-wayhouse") {
      const stats = getHeroComputedStats();
      state.worldHp = stats.maxHp;
      state.worldMp = stats.maxMp;
      ui.bannerMsg = "You rest on the bench. Health and mana are full.";
      playSfx("spell", 0.3);
      saveState();
      render();
      return true;
    }
    if (act === "take-vault-key") {
      if (!state.flags) state.flags = {};
      state.flags.vault_key = true;
      ui.bannerMsg = "The Vault Key is yours. The seal west of the Warden Door will open.";
      playSfx("spell", 0.4);
      saveState();
      render();
      return true;
    }
    if (act === "break-seal") {
      if (flagOn("vault_key")) {
        ui.bannerMsg = "You already hold the Vault Key.";
        render();
        return true;
      }
      if (state.coins < 40) {
        ui.bannerMsg = "Breaking the seal costs 40 gold.";
        render();
        return true;
      }
      state.coins -= 40;
      state.flags.vault_key = true;
      ui.bannerMsg = "The seal cracks. West is open.";
      playSfx("hit", 0.45);
      saveState();
      render();
      return true;
    }
    if (act === "open-record") {
      ui.modal = "record";
      ui.lorePage = ui.lorePage || 0;
      render();
      return true;
    }
    if (act === "lore-prev") {
      ui.lorePage = Math.max(0, (ui.lorePage || 0) - 1);
      render();
      return true;
    }
    if (act === "lore-next") {
      ui.lorePage = Math.min(HAVEN_LORE_BOOK.length - 1, (ui.lorePage || 0) + 1);
      render();
      return true;
    }
    if (act === "world-fight") {
      const sq = currentSquare();
      if (!sq.pack || !sq.pack.length) return true;
      beginWorldEncounter("combat", sq.pack);
      return true;
    }
    if (act === "world-shop") { beginWorldEncounter("shop"); return true; }
    if (act === "world-forge") { beginWorldEncounter("forge"); return true; }
    if (act === "world-shrine") { beginWorldEncounter("shrine"); return true; }
    if (act === "world-chest") { beginWorldEncounter("chest"); return true; }
    if (act === "world-relic") { beginWorldEncounter("relic"); return true; }
    if (act === "world-wheel") { beginWorldEncounter("wheel"); return true; }
    if (act === "world-descent") {
      const sq = currentSquare();
      const idx = typeof sq.portalDescent === "number" ? sq.portalDescent : state.selectedDescent;
      startDungeonRun(idx);
      return true;
    }
    if (act === "odell-contract") {
      const now = cryptClearTotal();
      const paid = state.flags.odellPaid || 0;
      if (now <= paid) {
        ui.bannerMsg = "Odell has no new hall marks to pay.";
        render();
        return true;
      }
      const gained = (now - paid) * 12;
      state.coins += gained;
      state.xp += (now - paid) * 6;
      state.flags.odellPaid = now;
      checkLevelUp();
      ui.bannerMsg = "Odell pays " + gained + " gold for " + (now - paid) + " cleared crypt rooms.";
      playSfx("stone", 0.4);
      saveState();
      render();
      return true;
    }
    if (act === "purify-cursed") {
      const item = findSelectedItem();
      if (!item || !item.cursed) {
        ui.bannerMsg = "Select a cursed piece on the board or in the stash.";
        render();
        return true;
      }
      if (state.coins < 25) {
        ui.bannerMsg = "Purifying costs 25 gold.";
        render();
        return true;
      }
      state.coins -= 25;
      item.cursed = false;
      item.rarityTier = Math.min(4, item.rarityTier || 0);
      ui.bannerMsg = "Tavia draws the curse out of " + getItemDef(item.id).name + ".";
      playSfx("spell", 0.4);
      saveState();
      render();
      return true;
    }
    if (act === "pell-ward") {
      talkToNpc("pell");
      return true;
    }
    return false;
  }

  function renderRecordModal() {
    const page = HAVEN_LORE_BOOK[ui.lorePage || 0] || HAVEN_LORE_BOOK[0];
    const lines = page.lines.map(function (line) {
      return "<p style=\"margin:0 0 8px;line-height:1.45\">" + escapeHtml(line) + "</p>";
    }).join("");
    return "<div class=\"db-modal-backdrop\" data-close-backdrop=\"1\">" +
      "<div class=\"db-modal-window\">" +
      "<div class=\"db-section-hdr\" style=\"padding:10px 14px;font-size:15px\">" +
      "<span>HAVEN RECORD</span>" +
      "<button type=\"button\" class=\"db-btn db-btn-crimson\" data-close-modal=\"1\">CLOSE</button></div>" +
      "<div class=\"db-modal-body\"><h2 style=\"margin:0 0 10px;color:var(--db-text-gold);font-family:Georgia,serif\">" +
      escapeHtml(page.title) + "</h2>" + lines +
      "<div style=\"display:flex;gap:8px;margin-top:12px\">" +
      "<button type=\"button\" class=\"db-btn\" data-act=\"lore-prev\">EARLIER</button>" +
      "<button type=\"button\" class=\"db-btn\" data-act=\"lore-next\">LATER</button>" +
      "<span style=\"align-self:center;color:#9e9482\">" + ((ui.lorePage || 0) + 1) + " / " + HAVEN_LORE_BOOK.length + "</span>" +
      "</div></div></div></div>";
  }

  function renderWorldScreen() {
    ensureWorldState();
    const sq = currentSquare();
    const stats = getHeroComputedStats();
    const npc = sq.npc ? HAVEN_NPCS[sq.npc] : null;
    const hpPct = Math.round((state.worldHp / Math.max(1, stats.maxHp)) * 100);
    const mpPct = Math.round((state.worldMp / Math.max(1, stats.maxMp)) * 100);
    const regionName = ui.atlasRegion || sq.region;
    const regionSquares = WORLD_SQUARES.filter(function (s) { return s.region === regionName; });
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    regionSquares.forEach(function (s, i) {
      if (i === 0) { minX = maxX = s.x; minY = maxY = s.y; }
      minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x);
      minY = Math.min(minY, s.y); maxY = Math.max(maxY, s.y);
    });
    const cols = Math.max(1, maxX - minX + 1);
    const rows = Math.max(1, maxY - minY + 1);
    const grid = [];
    for (let i = 0; i < cols * rows; i++) grid.push("<div class=\"db-mini-cell empty\"></div>");
    regionSquares.forEach(function (s) {
      const col = s.x - minX;
      const row = maxY - s.y;
      const idx = row * cols + col;
      const seen = seenHas(s.id);
      const here = s.id === sq.id;
      const foe = s.pack && clearCount(s.id) < 1;
      let cls = "db-mini-cell";
      if (here) cls += " here";
      else if (seen) cls += " seen";
      if (foe) cls += " foe";
      const label = seen || here ? escapeHtml(s.name.split(" ")[0]) : "?";
      grid[idx] = "<button type=\"button\" class=\"" + cls + "\" data-goto=\"" + s.id + "\" title=\"" + escapeHtml(s.name) + "\">" + label + "</button>";
    });
    const regions = [];
    WORLD_SQUARES.forEach(function (s) {
      if (regions.indexOf(s.region) < 0) regions.push(s.region);
    });
    const regionButtons = regions.map(function (name) {
      const known = WORLD_SQUARES.some(function (s) { return s.region === name && seenHas(s.id); });
      const cls = name === regionName ? "db-btn db-btn-gold" : "db-btn";
      return "<button type=\"button\" class=\"" + cls + "\" data-atlas-region=\"" + escapeHtml(name) + "\"" + (known ? "" : " disabled") + ">" + escapeHtml(name) + "</button>";
    }).join("");
    const readyQuests = WORLD_QUESTS.filter(function (q) {
      return state.questDone.indexOf(q.id) < 0;
    }).slice(0, 8);
    const questHtml = readyQuests.map(function (q) {
      const ready = q.ready();
      return "<div class=\"db-quest-card" + (ready ? " ready" : "") + "\">" +
        "<div><div style=\"font-weight:700;color:var(--db-text-gold)\">" + escapeHtml(q.title) + "</div>" +
        "<div style=\"font-size:11.5px;color:#c7bca8;margin-top:2px\">" + escapeHtml(q.detail) + "</div></div>" +
        "<button type=\"button\" class=\"db-btn" + (ready ? " db-btn-gold" : "") + "\" data-claim-road=\"" + q.id + "\"" + (ready ? "" : " disabled") + ">" +
        (ready ? "CLAIM" : "OPEN") + "</button></div>";
    }).join("");
    const dirs = [
      dirButtonHtml("n", "NORTH"),
      dirButtonHtml("w", "WEST"),
      dirButtonHtml("e", "EAST"),
      dirButtonHtml("s", "SOUTH")
    ].join("");
    let actions = "";
    if (sq.pack && sq.pack.length) {
      const again = clearCount(sq.id) > 0 ? "FIGHT AGAIN" : "FIGHT THIS SQUARE";
      actions += "<button type=\"button\" class=\"db-btn db-btn-crimson\" data-act=\"world-fight\">" + again + "</button>";
    }
    if (npc) actions += "<button type=\"button\" class=\"db-btn\" data-talk-npc=\"" + npc.id + "\">SPEAK TO " + escapeHtml(npc.name.split(",")[0]).toUpperCase() + "</button>";
    if (sq.service === "wayhouse") actions += "<button type=\"button\" class=\"db-btn db-btn-green\" data-act=\"rest-wayhouse\">REST (FULL HEAL)</button>";
    if (sq.service === "shop" || sq.eventKind === "shop") actions += "<button type=\"button\" class=\"db-btn db-btn-gold\" data-act=\"world-shop\">OPEN THE COUNTER</button>";
    if (sq.service === "forge" || sq.eventKind === "forge") actions += "<button type=\"button\" class=\"db-btn db-btn-gold\" data-act=\"world-forge\">OPEN THE FORGE</button>";
    if (sq.service === "archive") actions += "<button type=\"button\" class=\"db-btn\" data-act=\"open-record\">READ THE HAVEN RECORD</button>";
    if (sq.service === "bounties") actions += "<button type=\"button\" class=\"db-btn db-btn-gold\" data-act=\"odell-contract\">CLAIM HALL CONTRACT</button>";
    if (sq.service === "artificer") {
      actions += "<button type=\"button\" class=\"db-btn db-btn-purple\" data-act=\"unlock-row\">+4 BOARD SLOTS (80G)</button>";
      actions += "<button type=\"button\" class=\"db-btn\" data-act=\"purify-cursed\">PURIFY SELECTED CURSE (25G)</button>";
    }
    if (sq.eventKind === "shrine") actions += "<button type=\"button\" class=\"db-btn db-btn-green\" data-act=\"world-shrine\">APPROACH THE SHRINE</button>";
    if (sq.eventKind === "chest") actions += "<button type=\"button\" class=\"db-btn db-btn-gold\" data-act=\"world-chest\">OPEN THE CACHE</button>";
    if (sq.eventKind === "relic") actions += "<button type=\"button\" class=\"db-btn db-btn-purple\" data-act=\"world-relic\">DRAFT A RELIC</button>";
    if (sq.eventKind === "wheel") actions += "<button type=\"button\" class=\"db-btn db-btn-gold\" data-act=\"world-wheel\">SPIN THE WHEEL</button>";
    if (sq.id === "relic") actions += "<button type=\"button\" class=\"db-btn db-btn-green\" data-act=\"take-vault-key\">" + (flagOn("vault_key") ? "VAULT KEY TAKEN" : "TAKE THE VAULT KEY") + "</button>";
    if (sq.id === "seal" && !flagOn("vault_key")) actions += "<button type=\"button\" class=\"db-btn db-btn-crimson\" data-act=\"break-seal\">BREAK SEAL (40G)</button>";
    if (typeof sq.portalDescent === "number") {
      const d = DESCENTS[sq.portalDescent] || DESCENTS[0];
      actions += "<button type=\"button\" class=\"db-btn db-btn-purple\" data-act=\"world-descent\">ENTER DESCENT " + escapeHtml(d.roman) + " (7 FLOORS)</button>";
    }
    if (sq.service === "rival_arena") {
      ["rival_knight", "rival_warden", "rival_ranger", "rival_mage"].forEach(function (id) {
        const m = MONSTERS[id];
        actions += "<button type=\"button\" class=\"db-btn\" data-rival=\"" + id + "\">DUEL " + escapeHtml(m.name.split(" ")[0]).toUpperCase() + "</button>";
      });
    }
    if (sq.service === "waystone") {
      WORLD_WAYPOINTS.forEach(function (id) {
        if (!seenHas(id) || id === sq.id) return;
        actions += "<button type=\"button\" class=\"db-btn\" data-waystone=\"" + id + "\">WAYSTONE: " + escapeHtml(WORLD_MAP[id].name).toUpperCase() + "</button>";
      });
    }
    const foeLine = (sq.pack || []).map(function (id) {
      const m = MONSTERS[id] || MONSTERS.wolf;
      return escapeHtml(m.name);
    }).join(", ");
    return "<div class=\"db-workspace\">" +
      "<div class=\"db-col\">" +
      "<div class=\"db-panel\"><div class=\"db-section-hdr\"><span>ATLAS</span><span>" + (state.seen ? state.seen.length : 1) + " / " + WORLD_SQUARES.length + "</span></div>" +
      "<div class=\"db-world-scroll\"><div style=\"display:flex;flex-direction:column;gap:4px\">" + regionButtons + "</div>" +
      "<div class=\"db-mini-grid\" style=\"grid-template-columns:repeat(" + cols + ",minmax(0,1fr))\">" + grid.join("") + "</div>" +
      "<div style=\"font-size:11px;color:#9e9482\">Gold marks where you stand. A red edge is an uncleared fight. Click a neighbouring square to walk there.</div></div></div>" +
      "<div class=\"db-panel\" style=\"flex:1;min-height:0;display:flex;flex-direction:column\"><div class=\"db-section-hdr\"><span>ROAD QUESTS</span></div>" +
      "<div class=\"db-world-scroll\">" + (questHtml || "<div style=\"color:#9e9482\">Every road quest is claimed.</div>") + "</div></div></div>" +
      "<div class=\"db-col\"><div class=\"db-panel db-panel-gold db-world-center\">" +
      "<img class=\"db-world-plate\" src=\"" + sq.vision + "\" alt=\"" + escapeHtml(sq.name) + "\">" +
      "<div><div style=\"font-family:Georgia,serif;font-size:22px;color:var(--db-text-gold)\">" + escapeHtml(sq.name) + "</div>" +
      "<div style=\"font-size:12px;color:#b5a890\">" + escapeHtml(sq.region) + " · " + escapeHtml(sq.zone) + (clearCount(sq.id) ? " · cleared " + clearCount(sq.id) + "×" : "") + "</div></div>" +
      "<div style=\"font-size:13.5px;line-height:1.4;color:#f4ead5\">" + escapeHtml(sq.arrive) + "</div>" +
      "<div style=\"font-size:12.5px;color:#d6cbb8\">" + escapeHtml(sq.hint) + "</div>" +
      (foeLine ? "<div style=\"font-size:12px;color:#ffb4be\">Present: " + foeLine + "</div>" : "") +
      "<div class=\"db-bar-wrap\"><div class=\"db-bar-fill\" style=\"width:" + hpPct + "%;background:var(--db-hp-red)\"></div><div class=\"db-bar-text\">" + state.worldHp + " / " + stats.maxHp + " HP</div></div>" +
      "<div class=\"db-bar-wrap\"><div class=\"db-bar-fill\" style=\"width:" + mpPct + "%;background:var(--db-mp-blue)\"></div><div class=\"db-bar-text\">" + state.worldMp + " / " + stats.maxMp + " MP</div></div>" +
      "<div style=\"background:rgba(12,10,18,0.88);border:1px solid #473c59;border-radius:5px;padding:7px 10px;font-size:12px;color:#f5deb3\">" + escapeHtml(ui.bannerMsg) + "</div>" +
      "<div class=\"db-compass\">" + dirs + "</div>" +
      "<div class=\"db-world-actions\">" + actions + "</div>" +
      "</div></div>" +
      renderRightEquipmentAndStashColumn() +
      "</div>";
  }

  function dirButtonHtml(dir, label) {
    const sq = currentSquare();
    const toId = sq[dir];
    if (!toId || !WORLD_MAP[toId]) {
      return "<button type=\"button\" class=\"db-btn\" disabled>" + label + " · —</button>";
    }
    const dest = WORLD_MAP[toId];
    const block = travelBlocked(sq, toId);
    const known = seenHas(toId) || !block;
    const name = (seenHas(toId) || !block) ? dest.name : "Unmapped road";
    const cls = block ? "db-btn db-btn-crimson" : "db-btn db-btn-green";
    return "<button type=\"button\" class=\"" + cls + "\" data-travel=\"" + dir + "\" title=\"" + escapeHtml(block || dest.hint || "") + "\">" + label + " · " + escapeHtml(known ? name : "Unknown") + (block ? " (SHUT)" : "") + "</button>";
  }

  // ---------------------------------------------------------------------------
  // 2. STATE & PERSISTENCE
  // ---------------------------------------------------------------------------
  let uidCounter = 100;
  function nextUid() {
    uidCounter += 1;
    return "itm_" + Date.now().toString(36) + "_" + (uidCounter++);
  }

  function makeBoardItem(id, level = 1, rarityTier = 0, extra = {}) {
    const def = ITEMS.find(x => x.id === id) || ITEMS[0];
    return {
      uid: nextUid(),
      id: def.id,
      level: level,
      rarityTier: def.cursed ? 5 : rarityTier,
      hybridId: extra.hybridId || "",
      cursed: !!def.cursed || !!extra.cursed,
      curseNote: def.curseNote || extra.curseNote || "",
      bonusAtk: extra.bonusAtk || 0,
      bonusBlk: extra.bonusBlk || 0,
      bonusSpd: extra.bonusSpd || 0
    };
  }

  function createDefaultState() {
    const s = {
      heroId: "justin",
      level: 2,
      xp: 35,
      coins: 140,
      skillPoints: 3,
      dungeonPoints: 30,
      selectedDescent: 0,
      highestDescentUnlocked: 2,
      unlockedRows: 2, // 2 rows = 8 slots; up to 4 rows = 16 slots
      board: [
        makeBoardItem("iron_shortsword", 2, 1),
        makeBoardItem("warden_buckler", 2, 1),
        makeBoardItem("plate_cuirass", 1, 1),
        makeBoardItem("fang_dagger", 1, 1),
        makeBoardItem("crimson_vial", 1, 0),
        makeBoardItem("signet_ring", 1, 2)
      ],
      stash: [
        makeBoardItem("iron_shortsword", 2, 1), // Ready to merge with board[0]!
        makeBoardItem("sun_greatsword", 1, 2),
        makeBoardItem("star_longbow", 1, 1),
        makeBoardItem("glacial_spear", 1, 1),
        makeBoardItem("thorn_bulwark", 1, 2),
        makeBoardItem("ember_mail", 1, 1),
        makeBoardItem("shadow_cloak", 1, 0),
        makeBoardItem("strider_boots", 1, 0),
        makeBoardItem("azure_elixir", 1, 0),
        makeBoardItem("blight_flask", 1, 1)
      ],
      upgrades: {
        sharp_steel: 1,
        iron_bastion: 1
      },
      milestonesClaimed: [],
      havenClaimed: [],
      havenSquaresVisited: 1,
      totalRuns: 1,
      enemiesKilled: 6,
      elitesKilled: 1,
      rivalsKilled: 0,
      bossesKilled: 0,
      totalDamageDealt: 540,
      totalDamageTaken: 110,
      itemsMerged: 1,
      itemsForged: 0,
      cursesTaken: 0,
      chestsOpened: 1,
      wheelSpins: 0,
      statusInflicted: 14,
      sfxEnabled: true,
      squareId: "home",
      seen: ["home"],
      cleared: {},
      flags: {},
      questDone: []
    };
    return s;
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Object.assign(createDefaultState(), parsed);
      }
    } catch (e) {}
    return createDefaultState();
  }

  function saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  // Runtime UI & Run state
  let ui = {
    mode: "world", // "hub" | "run" | "world"
    modal: null, // null | "upgrades" | "quests" | "haven" | "record"
    upgradeTab: "Damage",
    questTab: "Combat",
    stashFilter: "all",
    selectedUid: state.board[0] ? state.board[0].uid : null,
    selectedFromBoard: true,
    runLeftTab: "stash", // "stash" | "stats" | "relics"
    havenNodeId: "town",
    bannerMsg: "You wake on the Wayhouse bench. North is the road into Haven.",
    atlasRegion: "Haven Gate & Town",
    lorePage: 0,
    unityVisible: false
  };

  let run = {
    active: false,
    descentIndex: 0,
    floor: 1,
    step: 1, // 1..5
    floorPlan: ["combat", "shop", "combat", "relic", "elite"],
    roomKind: "combat", // "combat" | "shop" | "relic" | "chest" | "shrine" | "forge" | "wheel" | "conquered"
    autoBattle: true,
    speedMult: 1.5,
    heroHp: 120,
    heroMaxHp: 120,
    heroMp: 30,
    heroMaxMp: 30,
    heroBlock: 16,
    heroThorns: 4,
    phoenixUsed: false,
    activeRelics: ["Loaded Ivory Dice"],
    relicIds: ["loaded_dice"],
    sweepIndex: 0,
    sweepProgress: 0, // 0..100
    enemyTurnProgress: 0,
    rivalSweepProgress: 0,
    rivalSweepIndex: 0,
    enemies: [],
    targetIndex: 0,
    combatWon: false,
    log: [],
    // Event room payloads
    shopItems: [],
    relicChoices: [],
    relicPicked: false,
    chestOpened: false,
    chestDrop: null,
    chestGold: 45,
    shrineResolved: false,
    shrineOffer: null,
    forgeUsed: false,
    wheelText: "Spend 25G to spin the Wheel of Fortune for Jackpot Gold, +1 Item Level, Epic Gear, or a Free Relic!",
    worldSkirmish: false,
    worldEvent: false,
    launchedFromWorld: false,
    returnSquare: null
  };

  // ---------------------------------------------------------------------------
  // 3. AUDIO HELPER (Uses local WAVs in assets/Audio/)
  // ---------------------------------------------------------------------------
  const audioCache = {};
  function playSfx(name, vol = 0.4) {
    if (!state.sfxEnabled) return;
    try {
      const path = "assets/Audio/" + name + ".wav";
      if (!audioCache[path]) {
        audioCache[path] = new Audio(path);
      }
      const a = audioCache[path].cloneNode();
      a.volume = Math.min(1, Math.max(0, vol));
      a.play().catch(() => {});
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 4. ITEM & STAT CALCULATIONS
  // ---------------------------------------------------------------------------
  function getHeroDef() {
    return HEROES.find(h => h.id === state.heroId) || HEROES[0];
  }

  function getItemDef(id) {
    return ITEMS.find(x => x.id === id) || ITEMS[0];
  }

  function getUpgradeRank(id) {
    return (state.upgrades && state.upgrades[id]) || 0;
  }

  function getMaxBoardSlots() {
    let rows = 2;
    if (getUpgradeRank("board_row_3") > 0) rows += 1;
    if (getUpgradeRank("board_row_4") > 0) rows += 1;
    rows = Math.max(rows, state.unlockedRows || 2);
    return Math.min(16, rows * 4);
  }

  function getRarityClass(tier, cursed) {
    if (cursed || tier === 5) return "rar-cursed";
    if (tier <= 0) return "rar-common";
    if (tier === 1) return "rar-uncommon";
    if (tier === 2) return "rar-rare";
    if (tier === 3) return "rar-epic";
    return "rar-legendary";
  }

  function getRarityName(tier, cursed) {
    if (cursed || tier === 5) return "Cursed";
    return ["Common", "Uncommon", "Rare", "Epic", "Legendary"][Math.min(4, Math.max(0, tier))];
  }

  function getEffectiveItemStats(bi, inCombat = false) {
    const def = getItemDef(bi.id);
    const hybrid = bi.hybridId ? getItemDef(bi.hybridId) : null;
    const anvilBonus = (inCombat && run.relicIds.includes("anvil_charm")) ? 1 : 0;
    const lv = (bi.level || 1) + anvilBonus;
    const rarMult = 1 + (bi.rarityTier || 0) * 0.18 + (lv - 1) * 0.28;
    const sharpMult = 1 + getUpgradeRank("sharp_steel") * 0.10;
    const shieldMult = 1 + getUpgradeRank("shield_wall") * 0.12;

    let atk = Math.round(((def.atk || 0) + (hybrid ? Math.round((hybrid.atk || 0) * 0.6) : 0)) * rarMult * sharpMult) + (bi.bonusAtk || 0);
    let blk = Math.round(((def.blk || 0) + (hybrid ? Math.round((hybrid.blk || 0) * 0.6) : 0)) * rarMult * shieldMult) + (bi.bonusBlk || 0);
    let spd = (def.spd || 5) + (bi.bonusSpd || 0) + (hybrid ? 1 : 0);

    const procs = Object.assign({}, def.procs || {});
    if (hybrid && hybrid.procs) {
      for (const [k, v] of Object.entries(hybrid.procs)) {
        procs[k] = (procs[k] || 0) + Math.max(1, Math.round(v * 0.75));
      }
    }
    const venomRank = getUpgradeRank("venom_alchemy");
    if (venomRank > 0) {
      if (procs.poison) procs.poison += venomRank * 2;
      if (procs.burn)   procs.burn   += venomRank * 2;
      if (procs.bleed)  procs.bleed  += venomRank * 2;
    }
    return { def, hybrid, lv, atk, blk, spd, procs };
  }

  function getSetCounts(boardList) {
    const counts = { STEEL: 0, BEAST: 0, CRYPT: 0, EMBER: 0, FROST: 0, ARCANE: 0 };
    (boardList || state.board).forEach(bi => {
      const def = getItemDef(bi.id);
      if (def && counts[def.set] !== undefined) counts[def.set] += 1;
      if (bi.hybridId) {
        const hDef = getItemDef(bi.hybridId);
        if (hDef && hDef.set !== def.set && counts[hDef.set] !== undefined) counts[hDef.set] += 1;
      }
    });
    return counts;
  }

  function getHeroComputedStats() {
    const h = getHeroDef();
    const sets = getSetCounts(state.board);
    const maxHp = 85 + h.baseStats.vitality * 6 + state.level * 12 + getUpgradeRank("titan_vitality") * 16;
    const maxMp = 20 + h.baseStats.magic * 2 + getUpgradeRank("well_of_stars") * 8;

    let cycleAtk = 0;
    let cycleBlk = 0;
    let avgSpd = h.baseStats.speed + getUpgradeRank("shadow_reflex");
    let thorns = getUpgradeRank("bramble_carapace") * 3 + (sets.STEEL >= 2 ? 4 : 0);

    state.board.forEach(bi => {
      const st = getEffectiveItemStats(bi, ui.mode === "run");
      cycleAtk += st.atk;
      cycleBlk += st.blk;
      avgSpd += Math.round(st.spd * 0.25);
      if (st.procs.thorns) thorns += st.procs.thorns;
    });

    if (sets.EMBER >= 2) cycleAtk = Math.round(cycleAtk * 1.20);
    if (sets.STEEL >= 2) cycleBlk = Math.round(cycleBlk * 1.25);

    const startBlk = 8 + getUpgradeRank("iron_bastion") * 8 + (sets.CRYPT >= 2 ? 14 : 0) + (run.relicIds.includes("thorn_idol") ? 16 : 0);
    const critPct = Math.min(75, 8 + h.baseStats.luck + getUpgradeRank("killer_instinct") * 4 + (sets.BEAST >= 4 ? 25 : 0) + (run.relicIds.includes("loaded_dice") ? 15 : 0));
    const critDmg = 150 + getUpgradeRank("killer_instinct") * 15;
    const dodgePct = Math.min(55, 5 + getUpgradeRank("shadow_reflex") * 4 + (sets.FROST >= 2 ? 12 : 0) + (run.relicIds.includes("loaded_dice") ? 12 : 0));

    return {
      maxHp,
      maxMp,
      cycleAtk,
      cycleBlk,
      startBlk,
      thorns,
      critPct,
      critDmg,
      dodgePct,
      power: h.baseStats.power + state.level * 2,
      speed: avgSpd,
      magic: h.baseStats.magic + state.level,
      vitality: h.baseStats.vitality + state.level,
      defense: h.baseStats.defense + state.level,
      luck: h.baseStats.luck + state.level,
      sets
    };
  }

  function getSellValue(bi) {
    const base = 12 + (bi.level || 1) * 9 + (bi.rarityTier || 0) * 11;
    const mult = 1 + getUpgradeRank("haggler") * 0.25;
    return Math.round(base * mult);
  }

  // ---------------------------------------------------------------------------
  // 5. INVENTORY & BOARD OPERATIONS (EQUIP, MERGE, HYBRID FUSE, SELL, SORT)
  // ---------------------------------------------------------------------------
  function findSelectedItem() {
    if (!ui.selectedUid) return null;
    let found = state.board.find(x => x.uid === ui.selectedUid);
    if (found) {
      ui.selectedFromBoard = true;
      return found;
    }
    found = state.stash.find(x => x.uid === ui.selectedUid);
    if (found) {
      ui.selectedFromBoard = false;
      return found;
    }
    return null;
  }

  function toggleEquipSelected() {
    const item = findSelectedItem();
    if (!item) return;
    if (ui.selectedFromBoard) {
      if (state.board.length <= 1) {
        ui.bannerMsg = "Keep at least 1 item on your Equipment Board!";
        render();
        return;
      }
      state.board = state.board.filter(x => x.uid !== item.uid);
      state.stash.push(item);
      ui.selectedFromBoard = false;
      ui.bannerMsg = "Moved " + getItemDef(item.id).name + " to Inventory Stash.";
    } else {
      const maxSlots = getMaxBoardSlots();
      if (state.board.length >= maxSlots) {
        ui.bannerMsg = "Equipment Board is full (" + maxSlots + " slots). Unequip an item or unlock a new row!";
        render();
        return;
      }
      state.stash = state.stash.filter(x => x.uid !== item.uid);
      state.board.push(item);
      ui.selectedFromBoard = true;
      ui.bannerMsg = "Equipped " + getItemDef(item.id).name + " onto your Equipment Board!";
    }
    playSfx("stone", 0.35);
    saveState();
    render();
  }

  function mergeSingleItem(targetItem) {
    if (!targetItem) return false;
    const all = [...state.board, ...state.stash];
    const partner = all.find(x => x.uid !== targetItem.uid && x.id === targetItem.id && x.level === targetItem.level);
    if (!partner) {
      ui.bannerMsg = "Need another " + getItemDef(targetItem.id).name + " of Lv" + targetItem.level + " to merge!";
      render();
      return false;
    }
    // Remove partner
    state.board = state.board.filter(x => x.uid !== partner.uid);
    state.stash = state.stash.filter(x => x.uid !== partner.uid);

    const temperRank = getUpgradeRank("auto_temper");
    targetItem.level = Math.min(10, (targetItem.level || 1) + 1);
    if (!targetItem.cursed) {
      targetItem.rarityTier = Math.min(4, Math.max(targetItem.rarityTier || 0, Math.floor(targetItem.level / 2)));
    }
    targetItem.bonusAtk = (targetItem.bonusAtk || 0) + temperRank;
    targetItem.bonusBlk = (targetItem.bonusBlk || 0) + temperRank;
    state.itemsMerged = (state.itemsMerged || 0) + 1;
    ui.bannerMsg = "★ Merged " + getItemDef(targetItem.id).name + " to Lv" + targetItem.level + " (" + getRarityName(targetItem.rarityTier, targetItem.cursed) + ")!";
    playSfx("hit", 0.45);
    saveState();
    render();
    return true;
  }

  function autoMergeAll() {
    let merges = 0;
    let changed = true;
    const temperRank = getUpgradeRank("auto_temper");

    while (changed) {
      changed = false;
      const all = [...state.board, ...state.stash];
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const a = all[i];
          const b = all[j];
          if (a.id === b.id && a.level === b.level && a.level < 10) {
            // Keep 'a' (prefer keeping on board)
            state.board = state.board.filter(x => x.uid !== b.uid);
            state.stash = state.stash.filter(x => x.uid !== b.uid);
            a.level += 1;
            if (!a.cursed) a.rarityTier = Math.min(4, Math.max(a.rarityTier || 0, Math.floor(a.level / 2)));
            a.bonusAtk = (a.bonusAtk || 0) + temperRank;
            a.bonusBlk = (a.bonusBlk || 0) + temperRank;
            merges += 1;
            state.itemsMerged = (state.itemsMerged || 0) + 1;
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
    }

    if (merges > 0) {
      ui.bannerMsg = "★ Auto-Merged " + merges + " item pair(s) into higher-level gear!";
      playSfx("spell", 0.45);
    } else {
      ui.bannerMsg = "No duplicate same-level items available to merge right now.";
    }
    saveState();
    render();
    return merges;
  }

  function fuseSelectedWithStash() {
    const primary = findSelectedItem();
    if (!primary) return;
    const partner = state.stash.find(x => x.uid !== primary.uid && x.id !== primary.id);
    if (!partner) {
      ui.bannerMsg = "Keep at least 1 different item in your Stash to Hybrid Fuse with " + getItemDef(primary.id).name + "!";
      render();
      return;
    }
    state.stash = state.stash.filter(x => x.uid !== partner.uid);
    primary.hybridId = partner.id;
    primary.level = Math.min(10, primary.level + 1);
    if (!primary.cursed) primary.rarityTier = Math.min(4, Math.max(2, (primary.rarityTier || 0) + 1));
    state.itemsForged = (state.itemsForged || 0) + 1;
    ui.bannerMsg = "★ HYBRID FUSED: " + getItemDef(primary.id).name + " + " + getItemDef(partner.id).name + " (Lv" + primary.level + ")!";
    playSfx("spell", 0.5);
    saveState();
    render();
  }

  function sellSelectedItem() {
    const item = findSelectedItem();
    if (!item) return;
    if (ui.selectedFromBoard && state.board.length <= 1) {
      ui.bannerMsg = "Cannot sell your last equipped board item!";
      render();
      return;
    }
    const gold = getSellValue(item);
    state.coins += gold;
    state.board = state.board.filter(x => x.uid !== item.uid);
    state.stash = state.stash.filter(x => x.uid !== item.uid);
    const next = state.board[0] || state.stash[0] || null;
    ui.selectedUid = next ? next.uid : null;
    ui.bannerMsg = "Sold " + getItemDef(item.id).name + " for +" + gold + "G.";
    playSfx("stone", 0.35);
    saveState();
    render();
  }

  function sellAllCommonStash() {
    const toKeep = [];
    let count = 0;
    let earned = 0;
    state.stash.forEach(bi => {
      if ((bi.rarityTier || 0) <= 0 && !bi.cursed && !bi.hybridId) {
        count += 1;
        earned += getSellValue(bi);
      } else {
        toKeep.push(bi);
      }
    });
    if (count === 0) {
      ui.bannerMsg = "No Common (Tier 0) items in Stash to bulk-sell.";
      render();
      return;
    }
    state.stash = toKeep;
    state.coins += earned;
    ui.bannerMsg = "Sold " + count + " Common stash item(s) for +" + earned + "G!";
    playSfx("stone", 0.4);
    saveState();
    render();
  }

  function sortStash() {
    state.stash.sort((a, b) => {
      if ((b.rarityTier || 0) !== (a.rarityTier || 0)) return (b.rarityTier || 0) - (a.rarityTier || 0);
      if ((b.level || 1) !== (a.level || 1)) return (b.level || 1) - (a.level || 1);
      return a.id.localeCompare(b.id);
    });
    ui.bannerMsg = "Sorted Stash by Rarity & Item Level.";
    saveState();
    render();
  }

  function rollDungeonDrop(floor = 1, bonusRarity = false) {
    const pool = ITEMS.filter(x => !x.cursed);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const lv = Math.max(1, Math.min(8, Math.floor((floor + 1) / 2) + (Math.random() < 0.35 ? 1 : 0)));
    const luckBoost = getUpgradeRank("treasure_hunter") * 0.08 + (bonusRarity ? 0.35 : 0);
    const r = Math.random() + luckBoost;
    let tier = 0;
    if (r > 1.15) tier = 4;
    else if (r > 0.92) tier = 3;
    else if (r > 0.65) tier = 2;
    else if (r > 0.35) tier = 1;
    return makeBoardItem(pick.id, lv, tier);
  }

  // ---------------------------------------------------------------------------
  // 6. MULTI-FLOOR DUNGEON RUN & AUTO-BATTLER LOOP
  // ---------------------------------------------------------------------------
  function buildFloorPlan(floor) {
    const even = floor % 2 === 0;
    return [
      "combat",
      even ? "shop" : "chest",
      "combat",
      even ? "forge" : (floor === 3 || floor === 5 ? "shrine" : "relic"),
      floor === 7 ? "boss" : (even ? "rival" : "elite")
    ];
  }

  function startDungeonRun(descentIdx) {
    const fromWorld = ui.mode === "world";
    if (typeof descentIdx === "number") state.selectedDescent = descentIdx;
    const stats = getHeroComputedStats();
    state.totalRuns = (state.totalRuns || 0) + 1;

    run.active = true;
    run.worldSkirmish = false;
    run.worldEvent = false;
    run.launchedFromWorld = fromWorld;
    run.returnSquare = state.squareId || "home";
    run.descentIndex = state.selectedDescent;
    run.floor = 1;
    run.step = 1;
    run.floorPlan = buildFloorPlan(1);
    run.autoBattle = true;
    run.heroMaxHp = stats.maxHp;
    run.heroHp = stats.maxHp;
    run.heroMaxMp = stats.maxMp;
    run.heroMp = stats.maxMp;
    run.phoenixUsed = false;
    run.relicIds = ["loaded_dice"];
    if (getUpgradeRank("starting_relic") > 0) {
      const extraRelic = RELICS[Math.floor(Math.random() * RELICS.length)];
      if (!run.relicIds.includes(extraRelic.id)) run.relicIds.push(extraRelic.id);
    }
    run.log = [
      "=== ENTERED DESCENT " + DESCENTS[run.descentIndex].roman + ": " + DESCENTS[run.descentIndex].name.toUpperCase() + " ===",
      "Floor 1 of 7 begins. Equipment Sweep Auto-Battler active!"
    ];

    ui.mode = "run";
    ui.modal = null;
    enterRunStep(1, 1);
    saveState();
    render();
  }

  function generateRivalBoard(archetype, floor) {
    const setItems = ITEMS.filter(x => x.set === archetype && !x.cursed);
    const fallback = ITEMS.filter(x => !x.cursed);
    const board = [];
    for (let i = 0; i < 6; i++) {
      const src = setItems[i % setItems.length] || fallback[i % fallback.length];
      board.push(makeBoardItem(src.id, Math.max(1, Math.floor((floor + 1) / 2)), Math.min(3, Math.floor(floor / 2))));
    }
    return board;
  }

  function spawnRoomEnemies(floor, step, stepTag) {
    const d = DESCENTS[run.descentIndex] || DESCENTS[0];
    const scale = d.scale * (1 + (floor - 1) * 0.22);
    run.enemies = [];
    run.targetIndex = 0;

    if (stepTag === "boss" || (floor === 7 && step === 5)) {
      const m = MONSTERS[d.boss] || MONSTERS.warden;
      run.enemies.push(makeEnemyInstance(m, floor + 2, scale * 1.15, { isBoss: true }));
    } else if (stepTag === "rival") {
      const rId = d.rivals[(floor + run.descentIndex) % d.rivals.length];
      const m = MONSTERS[rId] || MONSTERS.rival_knight;
      const rivalBoard = generateRivalBoard(m.archetype || "STEEL", floor);
      run.enemies.push(makeEnemyInstance(m, floor + 1, scale * 1.08, { isRival: true, rivalBoard }));
    } else if (stepTag === "elite") {
      const eId = d.elites[(floor + run.descentIndex) % d.elites.length];
      const m = MONSTERS[eId] || MONSTERS.sentinel;
      const gId = d.regulars[floor % d.regulars.length];
      run.enemies.push(makeEnemyInstance(m, floor + 1, scale * 1.05, { isElite: true }));
      run.enemies.push(makeEnemyInstance(MONSTERS[gId] || MONSTERS.skeleton, floor, scale * 0.85, {}));
    } else {
      const count = step === 3 && floor >= 2 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const mId = d.regulars[(floor + step + i) % d.regulars.length];
        const m = MONSTERS[mId] || MONSTERS.wolf;
        run.enemies.push(makeEnemyInstance(m, floor, scale, {}));
      }
    }
  }

  function makeEnemyInstance(def, level, scale, flags) {
    const maxHp = Math.round(def.hp * scale);
    return {
      uid: "foe_" + Math.random().toString(36).slice(2, 7),
      def: def,
      level: level,
      hp: maxHp,
      maxHp: maxHp,
      atk: Math.max(4, Math.round(def.atk * scale)),
      defense: Math.round(def.def * scale),
      spd: def.spd,
      block: flags.isBoss ? 14 : (flags.isRival ? 10 : 0),
      thorns: flags.isBoss ? 3 : 0,
      poison: 0,
      burn: 0,
      bleed: 0,
      freeze: run.relicIds.includes("frost_shackle") ? 4 : 0,
      isBoss: !!flags.isBoss,
      isRival: !!flags.isRival,
      isElite: !!flags.isElite,
      rivalBoard: flags.rivalBoard || null
    };
  }

  function enterRunStep(floor, step, overrideKind = null) {
    run.floor = floor;
    run.step = step;
    run.floorPlan = buildFloorPlan(floor);
    const planned = overrideKind || run.floorPlan[step - 1] || "combat";

    const stats = getHeroComputedStats();
    run.heroMaxHp = stats.maxHp;
    run.heroMaxMp = stats.maxMp;
    run.heroHp = Math.min(run.heroMaxHp, Math.max(1, run.heroHp));
    if (run.relicIds.includes("mana_prism")) {
      run.heroMp = run.heroMaxMp;
    } else {
      run.heroMp = Math.min(run.heroMaxMp, run.heroMp + 4 + getUpgradeRank("well_of_stars") * 2);
    }
    run.heroBlock = stats.startBlk;
    run.heroThorns = stats.thorns + (run.relicIds.includes("thorn_idol") ? 8 : 0);
    run.sweepIndex = 0;
    run.sweepProgress = 0;
    run.enemyTurnProgress = 0;
    run.rivalSweepProgress = 0;
    run.rivalSweepIndex = 0;
    run.combatWon = false;

    if (planned === "combat" || planned === "elite" || planned === "rival" || planned === "boss") {
      run.roomKind = "combat";
      spawnRoomEnemies(floor, step, planned);
      const names = run.enemies.map(e => e.def.name + " (Lv" + e.level + ")").join(", ");
      addRunLog("Floor " + floor + " · Step " + step + ": Encountered " + names + "!");
    } else {
      run.enemies = [];
      if (planned === "shop") {
        run.roomKind = "shop";
        setupShopRoom();
        addRunLog("Floor " + floor + " · Step " + step + ": Entered the Dungeon Merchant's Shop.");
      } else if (planned === "relic") {
        run.roomKind = "relic";
        setupRelicRoom();
        addRunLog("Floor " + floor + " · Step " + step + ": Ancient Relic Altar discovered!");
      } else if (planned === "chest") {
        run.roomKind = "chest";
        run.chestOpened = false;
        run.chestGold = Math.round((30 + floor * 14) * (1 + getUpgradeRank("golden_tithe") * 0.15));
        run.chestDrop = rollDungeonDrop(floor + 1, true);
        addRunLog("Floor " + floor + " · Step " + step + ": Found a Forgotten Chest!");
      } else if (planned === "shrine") {
        run.roomKind = "shrine";
        run.shrineResolved = false;
        const cursedPool = ITEMS.filter(x => x.cursed);
        const cPick = cursedPool[Math.floor(Math.random() * cursedPool.length)];
        run.shrineOffer = makeBoardItem(cPick.id, Math.max(2, Math.floor((floor + 1) / 2)), 5, { cursed: true });
        addRunLog("Floor " + floor + " · Step " + step + ": A Cursed Shrine hums with dark power.");
      } else if (planned === "forge") {
        run.roomKind = "forge";
        run.forgeUsed = false;
        addRunLog("Floor " + floor + " · Step " + step + ": Reached the Blacksmith's Deep Forge.");
      } else if (planned === "wheel") {
        run.roomKind = "wheel";
        addRunLog("Floor " + floor + " · Step " + step + ": The Wheel of Fortune awaits your spin!");
      } else if (planned === "conquered") {
        run.roomKind = "conquered";
      }
    }
    render();
  }

  function setupShopRoom() {
    const discount = 1 - getUpgradeRank("haggler") * 0.10 - (run.relicIds.includes("merchants_coin") ? 0.20 : 0);
    run.shopItems = [];
    for (let i = 0; i < 4; i++) {
      const itm = rollDungeonDrop(run.floor + (i === 3 ? 2 : 0), i >= 2);
      const baseCost = 28 + itm.level * 12 + itm.rarityTier * 16;
      run.shopItems.push({
        item: itm,
        cost: Math.max(12, Math.round(baseCost * discount)),
        bought: false
      });
    }
  }

  function setupRelicRoom() {
    run.relicPicked = false;
    const available = RELICS.filter(r => !run.relicIds.includes(r.id));
    const pool = available.length >= 3 ? available : RELICS;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    run.relicChoices = shuffled.slice(0, 3);
  }

  function advanceToNextNode() {
    if (run.worldSkirmish || run.worldEvent) {
      const won = run.worldSkirmish && run.roomKind === "combat" && run.combatWon;
      run.worldSkirmish = false;
      run.worldEvent = false;
      run.combatWon = false;
      returnFromWorldEncounter(won);
      return;
    }
    if (run.roomKind === "conquered") {
      ui.mode = "hub";
      render();
      return;
    }
    if (run.step < 5) {
      enterRunStep(run.floor, run.step + 1);
    } else if (run.floor < 7) {
      enterRunStep(run.floor + 1, 1);
    } else {
      // Floor 7 Step 5 cleared -> Conquered!
      const d = DESCENTS[run.descentIndex] || DESCENTS[0];
      state.dungeonPoints += d.dpReward;
      state.skillPoints += 2;
      state.highestDescentUnlocked = Math.min(DESCENTS.length - 1, Math.max(state.highestDescentUnlocked || 1, run.descentIndex + 1));
      run.roomKind = "conquered";
      addRunLog("👑 VICTORY! Conquered " + d.name + " (Floor 7/7)! Earned +" + d.dpReward + " DP & +2 SP!");
      playSfx("spell", 0.55);
      saveState();
      render();
    }
  }

  function addRunLog(msg) {
    run.log.unshift(msg);
    if (run.log.length > 28) run.log.length = 28;
  }

  function spawnFloatText(selector, text, color = "#ffd966") {
    const target = document.querySelector(selector);
    if (!target) return;
    const el = document.createElement("div");
    el.className = "db-float-text";
    el.style.color = color;
    el.style.left = (25 + Math.random() * 45) + "%";
    el.style.top = (18 + Math.random() * 25) + "%";
    el.textContent = text;
    target.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 950);
  }

  // ---------------------------------------------------------------------------
  // 7. REAL-TIME EQUIPMENT SWEEP & COMBAT TICKER
  // ---------------------------------------------------------------------------
  function getActiveTarget() {
    let t = run.enemies[run.targetIndex];
    if (t && t.hp > 0) return t;
    t = run.enemies.find(e => e.hp > 0);
    if (t) run.targetIndex = run.enemies.indexOf(t);
    return t || null;
  }

  function applyDamageToEnemy(enemy, rawDmg, label = "", isCrit = false) {
    if (!enemy || enemy.hp <= 0) return;
    const sets = getSetCounts(state.board);
    let dmg = rawDmg;
    if (enemy.freeze > 0 && sets.FROST >= 4) dmg = Math.round(dmg * 1.35);
    if ((enemy.isBoss || enemy.isElite || enemy.isRival) && getUpgradeRank("giant_slayer") > 0) {
      dmg = Math.round(dmg * (1 + getUpgradeRank("giant_slayer") * 0.12));
    }
    if ((enemy.hp < enemy.maxHp * 0.5 || enemy.isBoss) && run.relicIds.includes("execution_crest")) {
      dmg = Math.round(dmg * 1.40);
    }

    let blocked = 0;
    if (enemy.block > 0) {
      blocked = Math.min(enemy.block, dmg);
      enemy.block -= blocked;
      dmg -= blocked;
    }
    enemy.hp = Math.max(0, enemy.hp - dmg);
    state.totalDamageDealt = (state.totalDamageDealt || 0) + dmg;

    const idx = run.enemies.indexOf(enemy);
    spawnFloatText(
      `[data-enemy-idx="${idx}"]`,
      (isCrit ? "💥 -" : "-") + dmg + (label ? " " + label : ""),
      isCrit ? "#ffba3b" : "#ff5e6c"
    );

    if (enemy.hp <= 0) {
      handleEnemyKilled(enemy);
    }
  }

  function handleEnemyKilled(enemy) {
    state.enemiesKilled = (state.enemiesKilled || 0) + 1;
    if (enemy.isElite) state.elitesKilled = (state.elitesKilled || 0) + 1;
    if (enemy.isRival) state.rivalsKilled = (state.rivalsKilled || 0) + 1;
    if (enemy.isBoss)  state.bossesKilled = (state.bossesKilled || 0) + 1;

    const sets = getSetCounts(state.board);
    if (sets.CRYPT >= 4) {
      run.heroHp = Math.min(run.heroMaxHp, run.heroHp + 5);
    }

    const goldMult = 1 + getUpgradeRank("golden_tithe") * 0.15 + (run.relicIds.includes("merchants_coin") ? 0.35 : 0);
    const goldGain = Math.round((12 + enemy.level * 6 + (enemy.isBoss ? 55 : enemy.isRival ? 32 : enemy.isElite ? 22 : 0)) * goldMult);
    const xpGain = 18 + enemy.level * 10 + (enemy.isBoss ? 70 : enemy.isRival ? 40 : 0);

    state.coins += goldGain;
    state.xp += xpGain;
    checkLevelUp();

    addRunLog("★ Slain " + enemy.def.name + "! +" + goldGain + "G, +" + xpGain + " XP.");

    // Roll loot drop on Elite/Rival/Boss or 55% on normal foes
    if (enemy.isBoss || enemy.isRival || enemy.isElite || Math.random() < 0.55) {
      const drop = rollDungeonDrop(run.floor + (enemy.isBoss ? 2 : 0), enemy.isBoss || enemy.isRival || enemy.isElite);
      state.stash.push(drop);
      addRunLog("🎁 Looted: " + getItemDef(drop.id).name + " Lv" + drop.level + " (" + getRarityName(drop.rarityTier, drop.cursed) + ")!");
    }

    // Check if all enemies in room are dead
    if (run.enemies.every(e => e.hp <= 0)) {
      run.combatWon = true;
      const siphon = getUpgradeRank("blood_siphon") * 3;
      if (siphon > 0) {
        run.heroHp = Math.min(run.heroMaxHp, run.heroHp + siphon);
      }
      playSfx("spell", 0.45);
      saveState();
      // Auto-advance after brief pause if autoBattle is on
      setTimeout(() => {
        if (ui.mode === "run" && run.roomKind === "combat" && run.combatWon) {
          advanceToNextNode();
        }
      }, 950);
    }
  }

  function checkLevelUp() {
    let need = 40 + state.level * 35;
    while (state.xp >= need) {
      state.xp -= need;
      state.level += 1;
      state.skillPoints += 1;
      run.heroMaxHp += 12;
      run.heroHp = run.heroMaxHp;
      addRunLog("🌟 LEVEL UP! Reached Level " + state.level + " (+1 SP, Full HP Restore)!");
      need = 40 + state.level * 35;
    }
  }

  function triggerBoardSlotSweep(slotIdx) {
    if (state.board.length === 0) return;
    const bi = state.board[slotIdx % state.board.length];
    if (!bi) return;
    const target = getActiveTarget();
    if (!target) return;

    const st = getEffectiveItemStats(bi, true);
    const stats = getHeroComputedStats();
    const sets = stats.sets;
    const potionMult = (st.def.slot === "potion" && run.relicIds.includes("alchemy_satchel")) ? 1.5 : 1.0;

    // Self-damage curse check
    if (st.procs.selfDmg) {
      run.heroHp = Math.max(1, run.heroHp - st.procs.selfDmg);
    }

    // Block & Thorns & Heal & Mana
    if (st.blk > 0) {
      const blkGain = Math.round(st.blk * potionMult);
      run.heroBlock += blkGain;
      if (sets.STEEL >= 4) {
        applyDamageToEnemy(target, Math.max(2, Math.round(blkGain * 0.45)), "SLAM", false);
      }
    }
    if (st.procs.thorns) {
      run.heroThorns += st.procs.thorns;
    }
    if (st.procs.heal) {
      const hGain = Math.round(st.procs.heal * potionMult);
      run.heroHp = Math.min(run.heroMaxHp, run.heroHp + hGain);
    }
    if (st.procs.mana) {
      const mGain = Math.round(st.procs.mana * potionMult);
      run.heroMp = Math.min(run.heroMaxMp, run.heroMp + mGain);
    }

    // Attack Damage
    if (st.atk > 0) {
      const isCrit = Math.random() * 100 < (stats.critPct + (st.procs.crit || 0));
      let dmg = st.atk + Math.round(stats.power * 0.35);
      if (isCrit) dmg = Math.round(dmg * (stats.critDmg / 100));
      applyDamageToEnemy(target, dmg, "", isCrit);
      playSfx(isCrit ? "hit" : "swing", 0.32);

      if (sets.BEAST >= 4) {
        run.heroHp = Math.min(run.heroMaxHp, run.heroHp + Math.max(1, Math.round(dmg * 0.20)));
      }
      if (isCrit && run.relicIds.includes("vampiric_fang")) {
        run.heroHp = Math.min(run.heroMaxHp, run.heroHp + 3);
      }
    }

    // Status Procs
    let statusAdded = 0;
    const addPoison = (st.procs.poison || 0) + (sets.CRYPT >= 2 && st.atk > 0 ? 3 : 0);
    const addBurn   = (st.procs.burn   || 0) + (sets.EMBER >= 2 && st.atk > 0 ? 3 : 0) + (run.relicIds.includes("cinder_core") && st.atk > 0 ? 3 : 0);
    const addBleed  = (st.procs.bleed  || 0) + (sets.BEAST >= 2 && st.atk > 0 ? 2 : 0);
    const addFreeze = (st.procs.freeze || 0) + (sets.FROST >= 2 && st.atk > 0 ? 2 : 0);

    if (target.hp > 0) {
      if (addPoison > 0) { target.poison += addPoison; statusAdded += addPoison; }
      if (addBurn > 0)   { target.burn   += addBurn;   statusAdded += addBurn; }
      if (addBleed > 0)  { target.bleed  += addBleed;  statusAdded += addBleed; }
      if (addFreeze > 0) { target.freeze += addFreeze; statusAdded += addFreeze; }
    }
    if (statusAdded > 0) {
      state.statusInflicted = (state.statusInflicted || 0) + statusAdded;
    }
  }

  function triggerEnemyTurn() {
    const sets = getSetCounts(state.board);
    const stats = getHeroComputedStats();

    run.enemies.forEach(e => {
      if (e.hp <= 0) return;

      // Status ticks on enemy
      if (e.poison > 0) {
        const pDmg = sets.CRYPT >= 4 ? e.poison * 2 : e.poison;
        applyDamageToEnemy(e, pDmg, "☠PSN", false);
        e.poison = Math.max(0, e.poison - 1);
      }
      if (e.hp <= 0) return;

      if (e.burn > 0) {
        let bDmg = sets.EMBER >= 4 ? e.burn * 2 : e.burn;
        if (run.relicIds.includes("cinder_core")) bDmg = Math.round(bDmg * 1.5);
        applyDamageToEnemy(e, bDmg, "🔥BRN", false);
        e.burn = Math.max(0, e.burn - 1);
      }
      if (e.hp <= 0) return;

      if (e.bleed > 0) {
        applyDamageToEnemy(e, e.bleed, "🩸BLD", false);
        e.bleed = Math.max(0, e.bleed - 1);
      }
      if (e.hp <= 0) return;

      // Freeze slows enemy attack
      if (e.freeze >= 6) {
        e.freeze -= 4;
        addRunLog("❄ " + e.def.name + " is Frozen solid and skips a strike!");
        return;
      }

      // Dodge check
      if (Math.random() * 100 < stats.dodgePct) {
        addRunLog("💨 Dodged " + e.def.name + "'s attack!");
        return;
      }

      let incoming = Math.max(2, e.atk - Math.floor(stats.defense * 0.25));
      if (run.heroBlock > 0) {
        const absorbed = Math.min(run.heroBlock, incoming);
        run.heroBlock -= absorbed;
        incoming -= absorbed;
      }
      if (incoming > 0) {
        run.heroHp = Math.max(0, run.heroHp - incoming);
        state.totalDamageTaken = (state.totalDamageTaken || 0) + incoming;
        playSfx("hurt", 0.35);
      }

      if (run.heroThorns > 0 && e.hp > 0) {
        applyDamageToEnemy(e, run.heroThorns, "🌵THN", false);
      }

      // Check Hero Death / Phoenix Revive
      if (run.heroHp <= 0) {
        if (run.relicIds.includes("phoenix_plume") && !run.phoenixUsed) {
          run.phoenixUsed = true;
          run.heroHp = Math.round(run.heroMaxHp * 0.5);
          run.heroBlock += 25;
          addRunLog("🔥 PHOENIX PLUME TRIGGERED! Revived at 50% HP + 25 Block!");
        } else if (run.worldSkirmish || run.worldEvent || run.launchedFromWorld) {
          wakeAtWayhouse("You fell. The Wayhouse bench brought you back with your gear and your level.");
        } else {
          const consolationDp = Math.max(5, run.floor * 4);
          state.dungeonPoints += consolationDp;
          addRunLog("Fallen on Floor " + run.floor + ". Returned to the gauntlet hub with +" + consolationDp + " DP.");
          ui.bannerMsg = "Run ended on Floor " + run.floor + ". Earned +" + consolationDp + " DP.";
          ui.mode = "hub";
          saveState();
          render();
        }
      }
    });
  }

  function manualStrike() {
    if (ui.mode !== "run" || run.roomKind !== "combat" || run.combatWon) return;
    const t = getActiveTarget();
    if (!t) return;
    const stats = getHeroComputedStats();
    const d20 = 1 + Math.floor(Math.random() * 20);
    const isCrit = d20 >= 18;
    const dmg = Math.round((stats.power * 1.4 + d20 * 0.6) * (isCrit ? 1.6 : 1));
    addRunLog("⚔ Manual Strike (d20=" + d20 + ") hits " + t.def.name + " for " + dmg + " dmg!");
    applyDamageToEnemy(t, dmg, "STRIKE", isCrit);
    playSfx("hit", 0.45);
    render();
  }

  function castHeroSpell() {
    if (ui.mode !== "run" || run.roomKind !== "combat" || run.combatWon) return;
    const h = getHeroDef();
    const cost = Math.max(3, h.spellMp - (run.relicIds.includes("mana_prism") ? 2 : 0));
    if (run.heroMp < cost) {
      addRunLog("Not enough Mana for " + h.spellName + " (Needs " + cost + " MP)!");
      render();
      return;
    }
    run.heroMp -= cost;
    const stats = getHeroComputedStats();
    const sets = stats.sets;
    const waves = sets.ARCANE >= 4 ? 2 : 1;

    for (let w = 0; w < waves; w++) {
      if (h.id === "justin") {
        run.heroBlock += 18;
        run.heroThorns += 4;
        const t = getActiveTarget();
        if (t) applyDamageToEnemy(t, Math.round(stats.power * 1.8 + stats.magic), "WARD", true);
      } else if (h.id === "lyra") {
        run.enemies.forEach(e => {
          if (e.hp > 0) {
            e.bleed += 4;
            applyDamageToEnemy(e, Math.round(stats.power * 1.35 + stats.speed), "STAR", true);
          }
        });
      } else if (h.id === "lightfather") {
        run.heroHp = Math.min(run.heroMaxHp, run.heroHp + 22);
        run.enemies.forEach(e => {
          if (e.hp > 0) {
            e.burn += 5;
            applyDamageToEnemy(e, Math.round(stats.magic * 1.75), "LATTICE", true);
          }
        });
      } else {
        const t = getActiveTarget();
        if (t) {
          t.burn += 6;
          t.poison += 5;
          const dmg = Math.round(stats.power * 2.2 + stats.magic);
          applyDamageToEnemy(t, dmg, "ASH", true);
          run.heroHp = Math.min(run.heroMaxHp, run.heroHp + Math.round(dmg * 0.30));
        }
      }
    }
    addRunLog("✨ Cast " + h.spellName + "!" + (waves > 1 ? " (Arcane 4pc Double Cast!)" : ""));
    playSfx("spell", 0.5);
    render();
  }

  function drinkQuickDraught() {
    if (ui.mode !== "run") return;
    if (state.coins < 15 && run.heroHp >= run.heroMaxHp) return;
    const heal = Math.round(run.heroMaxHp * 0.35);
    run.heroHp = Math.min(run.heroMaxHp, run.heroHp + heal);
    run.heroMp = Math.min(run.heroMaxMp, run.heroMp + 10);
    run.heroBlock += 10;
    addRunLog("🧪 Field Draught: Restored +" + heal + " HP, +10 MP, and +10 Block!");
    playSfx("spell", 0.4);
    render();
  }

  // Main 80ms Ticker for Equipment Sweep Auto-Battler
  setInterval(() => {
    if (ui.mode !== "run" || run.roomKind !== "combat" || !run.autoBattle || run.combatWon) return;
    if (state.board.length === 0) return;

    const stats = getHeroComputedStats();
    const chronos = run.relicIds.includes("chronos_spur") ? 1.25 : 1.0;
    const beastSpd = stats.sets.BEAST >= 2 ? 1.15 : 1.0;
    const stepInc = (9 + stats.speed * 0.85) * run.speedMult * chronos * beastSpd;

    run.sweepProgress += stepInc;
    if (run.sweepProgress >= 100) {
      run.sweepProgress = 0;
      triggerBoardSlotSweep(run.sweepIndex);
      run.sweepIndex = (run.sweepIndex + 1) % state.board.length;
    }

    // Rival Equipment Sweep if fighting a Rival!
    const rival = run.enemies.find(e => e.hp > 0 && e.rivalBoard && e.rivalBoard.length > 0);
    if (rival) {
      run.rivalSweepProgress += 11 * run.speedMult;
      if (run.rivalSweepProgress >= 100) {
        run.rivalSweepProgress = 0;
        const rItem = rival.rivalBoard[run.rivalSweepIndex % rival.rivalBoard.length];
        const rDef = getItemDef(rItem.id);
        rival.block += Math.round((rDef.blk || 0) * 0.8);
        run.rivalSweepIndex = (run.rivalSweepIndex + 1) % rival.rivalBoard.length;
      }
    }

    // Enemy attack turn timer
    run.enemyTurnProgress += 5.5 * run.speedMult;
    if (run.enemyTurnProgress >= 100) {
      run.enemyTurnProgress = 0;
      triggerEnemyTurn();
    }

    updateLiveCombatBarsOnly();
  }, 85);

  function updateLiveCombatBarsOnly() {
    // Lightweight DOM updates during 85ms ticks so clicks on buttons never get interrupted
    const sweepBars = document.querySelectorAll("[data-board-slot-idx]");
    sweepBars.forEach(el => {
      const idx = parseInt(el.getAttribute("data-board-slot-idx"), 10);
      const bar = el.querySelector(".db-sweep-bar");
      if (idx === run.sweepIndex % Math.max(1, state.board.length)) {
        el.classList.add("sweeping");
        if (bar) bar.style.width = Math.min(100, Math.round(run.sweepProgress)) + "%";
      } else {
        el.classList.remove("sweeping");
        if (bar) bar.style.width = "0%";
      }
    });

    // Update Hero HP/MP/Block bars in Run view
    const hpFill = document.getElementById("db-run-hp-fill");
    const hpTxt  = document.getElementById("db-run-hp-txt");
    if (hpFill && hpTxt) {
      hpFill.style.width = Math.round((run.heroHp / Math.max(1, run.heroMaxHp)) * 100) + "%";
      hpTxt.textContent = `HP ${run.heroHp} / ${run.heroMaxHp}` + (run.heroBlock > 0 ? `  [🛡 +${run.heroBlock} BLK]` : "");
    }
    const mpFill = document.getElementById("db-run-mp-fill");
    const mpTxt  = document.getElementById("db-run-mp-txt");
    if (mpFill && mpTxt) {
      mpFill.style.width = Math.round((run.heroMp / Math.max(1, run.heroMaxMp)) * 100) + "%";
      mpTxt.textContent = `MP ${run.heroMp} / ${run.heroMaxMp}  ·  🌵 Thorns ${run.heroThorns}`;
    }

    // Update Enemy cards HP/status
    run.enemies.forEach((e, idx) => {
      const card = document.querySelector(`[data-enemy-idx="${idx}"]`);
      if (!card) return;
      if (e.hp <= 0) card.classList.add("dead");
      const eFill = card.querySelector(".db-enemy-hp-fill");
      const eTxt  = card.querySelector(".db-enemy-hp-txt");
      if (eFill) eFill.style.width = Math.round((e.hp / Math.max(1, e.maxHp)) * 100) + "%";
      if (eTxt)  eTxt.textContent = `${e.hp} / ${e.maxHp} HP` + (e.block > 0 ? ` [🛡${e.block}]` : "");
      const sRow = card.querySelector(".db-status-row");
      if (sRow) sRow.innerHTML = renderEnemyStatusPills(e);
    });

    const logBox = document.getElementById("db-combat-log-box");
    if (logBox) {
      logBox.innerHTML = run.log.slice(0, 10).map(l => `<div>${escapeHtml(l)}</div>`).join("");
    }
  }

  function renderEnemyStatusPills(e) {
    const pills = [];
    if (e.poison > 0) pills.push(`<span class="db-status-pill" style="color:#6ee76e;border-color:#2d7a2d">☠ PSN ${e.poison}</span>`);
    if (e.burn > 0)   pills.push(`<span class="db-status-pill" style="color:#ff944d;border-color:#9e4716">🔥 BRN ${e.burn}</span>`);
    if (e.bleed > 0)  pills.push(`<span class="db-status-pill" style="color:#ff6678;border-color:#8f1d2c">🩸 BLD ${e.bleed}</span>`);
    if (e.freeze > 0) pills.push(`<span class="db-status-pill" style="color:#7ad7ff;border-color:#226b8f">❄ FRZ ${e.freeze}</span>`);
    if (pills.length === 0) {
      pills.push(`<span class="db-status-pill" style="color:#b8ae99">⚔ ATK ${e.atk} · 🛡 DEF ${e.defense}</span>`);
    }
    return pills.join("");
  }

  // ---------------------------------------------------------------------------
  // 8. RENDER ENGINE (TOPBAR, HUB, RUN, EVENT ROOMS, MODALS)
  // ---------------------------------------------------------------------------
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function countReadyMilestones() {
    let n = 0;
    MILESTONES.forEach(m => {
      const cur = state[m.stat] || 0;
      if (cur >= m.target && !state.milestonesClaimed.includes(m.id)) n += 1;
    });
    return n;
  }

  function renderItemSlotHtml(bi, idx, isBoard = false, showSweep = false) {
    if (!bi) {
      return `<div class="db-item-slot" style="opacity:0.35;cursor:default">
        <span style="font-size:10px;color:#6e657f">EMPTY</span>
      </div>`;
    }
    const st = getEffectiveItemStats(bi, ui.mode === "run");
    const rarClass = getRarityClass(bi.rarityTier, bi.cursed);
    const isSel = ui.selectedUid === bi.uid;
    const isSweeping = showSweep && (idx === run.sweepIndex % Math.max(1, state.board.length));
    const statLabel = st.atk > 0 && st.blk > 0 ? `⚔${st.atk} 🛡${st.blk}` : st.atk > 0 ? `⚔ ${st.atk}` : `🛡 ${st.blk}`;
    const setBadge = bi.hybridId ? `${st.def.set.slice(0,3)}+${st.hybrid.set.slice(0,3)}` : st.def.set;

    return `<div class="db-item-slot ${rarClass} ${isSel ? "selected" : ""} ${isSweeping ? "sweeping" : ""}"
                 data-item-uid="${bi.uid}"
                 data-from-board="${isBoard ? "1" : "0"}"
                 ${isBoard ? `data-board-slot-idx="${idx}"` : ""}
                 title="${escapeHtml(st.def.name)} Lv${bi.level} (${getRarityName(bi.rarityTier, bi.cursed)})">
      <span class="db-slot-lv">Lv${bi.level}${bi.hybridId ? "★" : ""}</span>
      <span class="db-slot-set">${escapeHtml(setBadge)}</span>
      <img src="${st.def.icon}" alt="${escapeHtml(st.def.name)}">
      <span class="db-slot-stat">${statLabel}</span>
      ${showSweep ? `<div class="db-sweep-bar" style="width:${isSweeping ? Math.round(run.sweepProgress) : 0}%"></div>` : ""}
    </div>`;
  }

  function renderTopBar() {
    const needXp = 40 + state.level * 35;
    const readyMs = countReadyMilestones();

    const heroPills = HEROES.map(h => `
      <button type="button" class="db-hero-pill ${state.heroId === h.id ? "active" : ""}" data-select-hero="${h.id}">
        <img src="${h.portrait}" alt="${h.name}">
        <span>${h.name}</span>
      </button>
    `).join("");

    const descentTabs = DESCENTS.map((d, idx) => `
      <button type="button"
              class="db-descent-tab ${state.selectedDescent === idx ? "active" : ""}"
              data-select-descent="${idx}"
              title="Descent ${d.roman}: ${escapeHtml(d.name)} (+${d.dpReward} DP)">
        ${d.roman}
      </button>
    `).join("");

    return `<div class="db-topbar">
      <div class="db-hero-switcher">
        ${heroPills}
        <div class="db-curr-badge" style="color:#f3e1b6;border-color:#574726">
          Lv ${state.level} <span style="color:#9e9482;font-size:11px">(${state.xp}/${needXp} XP)</span>
        </div>
      </div>

      <div class="db-descent-bar">
        <span style="font-size:11px;color:#b5a890;font-weight:700;margin-right:3px">DESCENT:</span>
        ${descentTabs}
      </div>

      <div class="db-currencies">
        <div class="db-curr-badge db-curr-gold" title="Gold Coins">🪙 ${state.coins}G</div>
        <div class="db-curr-badge db-curr-sp" title="Skill Points for Upgrades">✦ ${state.skillPoints} SP</div>
        <div class="db-curr-badge db-curr-dp" title="Dungeon Points for Deep Unlocks">🔮 ${state.dungeonPoints} DP</div>
        <button type="button" class="db-btn db-btn-purple" data-open-modal="upgrades">UPGRADES</button>
        <button type="button" class="db-btn db-btn-gold" data-open-modal="quests">
          QUESTS ${readyMs > 0 ? `<span style="background:#d92638;color:#fff;padding:1px 5px;border-radius:8px;font-size:10px">${readyMs}!</span>` : ""}
        </button>
        <button type="button" class="db-btn ${ui.mode === "world" ? "db-btn-gold" : "db-btn-green"}" data-act="${ui.mode === "world" ? "open-gauntlet" : "enter-world"}">${ui.mode === "world" ? "GAUNTLET HUB (H)" : "HAVEN WORLD (H)"}</button>
        <button type="button" class="db-btn" data-toggle-unity="1" title="Switch to classic Unity 3D still-frame view">UNITY 3D</button>
      </div>
    </div>`;
  }

  function renderInspectorPanel() {
    const sel = findSelectedItem() || state.board[0] || state.stash[0];
    if (!sel) {
      return `<div class="db-inspector">
        <div class="db-inspector-title"><span>No Item Selected</span></div>
        <div class="db-inspector-desc">Click any item on your Equipment Board or Inventory Stash to inspect, equip, merge, or fuse.</div>
      </div>`;
    }
    ui.selectedUid = sel.uid;
    const st = getEffectiveItemStats(sel, ui.mode === "run");
    const rarName = getRarityName(sel.rarityTier, sel.cursed);
    const sellGold = getSellValue(sel);
    const procList = [];
    for (const [k, v] of Object.entries(st.procs)) {
      if (k === "selfDmg") continue;
      procList.push(`+${v} ${k.toUpperCase()}`);
    }

    return `<div class="db-inspector">
      <div class="db-inspector-title">
        <span style="color:var(--db-text-gold)">
          ${escapeHtml(st.def.name)} ${sel.hybridId ? `+ ${escapeHtml(st.hybrid.name)}` : ""} · Lv${sel.level}
        </span>
        <span style="font-size:11px;color:#d1c5b0">[${rarName.toUpperCase()} · ${st.def.set}]</span>
      </div>
      <div class="db-inspector-desc">
        <b>⚔ Attack: ${st.atk}</b> &nbsp;·&nbsp; <b>🛡 Block: ${st.blk}</b> &nbsp;·&nbsp; <b>⚡ Speed: ${st.spd}</b>
        ${procList.length ? ` &nbsp;·&nbsp; <span style="color:#7ce893">${procList.join(", ")}</span>` : ""}
        <br>${escapeHtml(sel.cursed ? sel.curseNote : st.def.desc)}
      </div>
      <div class="db-inspector-actions">
        <button type="button" class="db-btn db-btn-green" data-act="toggle-equip">
          ${ui.selectedFromBoard ? "UNEQUIP TO STASH" : "EQUIP TO BOARD"}
        </button>
        <button type="button" class="db-btn db-btn-gold" data-act="merge-selected">MERGE (LV+1)</button>
        <button type="button" class="db-btn db-btn-purple" data-act="fuse-selected">HYBRID FUSE</button>
        <button type="button" class="db-btn db-btn-crimson" data-act="sell-selected">SELL (+${sellGold}G)</button>
      </div>
    </div>`;
  }

  function renderRightEquipmentAndStashColumn() {
    const maxSlots = getMaxBoardSlots();
    const boardCells = [];
    for (let i = 0; i < maxSlots; i++) {
      boardCells.push(renderItemSlotHtml(state.board[i] || null, i, true, false));
    }

    const filteredStash = state.stash.filter(bi => {
      if (ui.stashFilter === "all") return true;
      return getItemDef(bi.id).slot === ui.stashFilter;
    });
    const stashCells = filteredStash.map((bi, idx) => renderItemSlotHtml(bi, idx, false, false));
    while (stashCells.length < 12) {
      stashCells.push(renderItemSlotHtml(null, stashCells.length, false, false));
    }

    return `<div class="db-col">
      <div class="db-panel db-panel-gold" style="display:flex;flex-direction:column">
        <div class="db-section-hdr">
          <span>⚔ EQUIPMENT BOARD (${state.board.length} / ${maxSlots} SLOTS)</span>
          ${maxSlots < 16 ? `<button type="button" class="db-btn" style="padding:2px 7px;font-size:10.5px" data-act="unlock-row">+4 SLOTS (80G)</button>` : `<span style="font-size:10.5px;color:#7ce893">MAX 16 SLOTS</span>`}
        </div>
        <div class="db-board-grid">
          ${boardCells.join("")}
        </div>
      </div>

      <div class="db-panel" style="flex:1;display:flex;flex-direction:column;min-height:0">
        <div class="db-section-hdr">
          <span>🎒 INVENTORY STASH (${state.stash.length})</span>
          <div style="display:flex;gap:4px">
            <button type="button" class="db-btn" style="padding:2px 6px;font-size:10px" data-act="sort-stash">SORT</button>
            <button type="button" class="db-btn db-btn-gold" style="padding:2px 6px;font-size:10px" data-act="auto-merge">AUTO MERGE (M)</button>
            <button type="button" class="db-btn db-btn-crimson" style="padding:2px 6px;font-size:10px" data-act="sell-common">SELL COMMON</button>
          </div>
        </div>
        <div style="display:flex;gap:4px;padding:6px 8px 0">
          ${["all", "weapon", "armor", "potion"].map(f => `
            <button type="button" class="db-btn ${ui.stashFilter === f ? "db-btn-gold" : ""}"
                    style="flex:1;padding:3px 6px;font-size:10.5px"
                    data-stash-filter="${f}">
              ${f.toUpperCase()}
            </button>
          `).join("")}
        </div>
        <div class="db-stash-grid">
          ${stashCells.join("")}
        </div>
        ${renderInspectorPanel()}
      </div>
    </div>`;
  }

  function renderHubScreen() {
    const h = getHeroDef();
    const d = DESCENTS[state.selectedDescent] || DESCENTS[0];
    const stats = getHeroComputedStats();
    const readyMs = countReadyMilestones();

    const setCardsHtml = Object.entries(SET_DEFS).map(([key, sDef]) => {
      const cnt = stats.sets[key] || 0;
      const cls = cnt >= 4 ? "active-4" : cnt >= 2 ? "active-2" : "";
      return `<div class="db-set-card ${cls}">
        <div style="display:flex;justify-content:space-between;font-weight:700;color:${cnt >= 2 ? "#f4d06f" : "#c4baaa"}">
          <span>${sDef.name} (${key})</span>
          <span>${cnt} / 4 Equipped</span>
        </div>
        <div style="color:${cnt >= 2 ? "#9ef0b0" : "#887f72"};margin-top:2px">(2) ${sDef.b2}</div>
        <div style="color:${cnt >= 4 ? "#ffd970" : "#756d61"}">(4) ${sDef.b4}</div>
      </div>`;
    }).join("");

    const previewFoes = [...d.regulars.slice(0, 3), d.elites[0], d.rivals[0], d.boss].map(id => {
      const m = MONSTERS[id] || MONSTERS.wolf;
      const isBoss = id === d.boss;
      return `<div class="db-foe-mini ${isBoss ? "boss" : ""}" title="${escapeHtml(m.name)}">
        <img src="${m.sprite}" alt="${escapeHtml(m.name)}">
        <span>${escapeHtml(m.name.split(" ")[0])}</span>
      </div>`;
    }).join("");

    return `<div class="db-workspace">
      <!-- LEFT COLUMN: CHARACTER STATS & SET SYNERGIES -->
      <div class="db-col">
        <div class="db-panel">
          <div class="db-section-hdr">
            <span>🛡 ${escapeHtml(h.name)} · ${escapeHtml(h.title)}</span>
          </div>
          <div class="db-stat-grid">
            <div class="db-stat-box"><span>Max HP</span><b>${stats.maxHp}</b></div>
            <div class="db-stat-box"><span>Max Mana</span><b>${stats.maxMp}</b></div>
            <div class="db-stat-box"><span>Sweep Attack</span><b>${stats.cycleAtk}/cyc</b></div>
            <div class="db-stat-box"><span>Sweep Block</span><b>${stats.cycleBlk}/cyc</b></div>
            <div class="db-stat-box"><span>Start Block</span><b>+${stats.startBlk}</b></div>
            <div class="db-stat-box"><span>Thorns</span><b>${stats.thorns}</b></div>
            <div class="db-stat-box"><span>Crit Chance</span><b>${stats.critPct}%</b></div>
            <div class="db-stat-box"><span>Crit Damage</span><b>${stats.critDmg}%</b></div>
            <div class="db-stat-box"><span>Dodge</span><b>${stats.dodgePct}%</b></div>
            <div class="db-stat-box"><span>Sweep Speed</span><b>${stats.speed}</b></div>
            <div class="db-stat-box"><span>Runs / Kills</span><b>${state.totalRuns} / ${state.enemiesKilled}</b></div>
            <div class="db-stat-box"><span>Merges / Forges</span><b>${state.itemsMerged} / ${state.itemsForged}</b></div>
          </div>
        </div>

        <div class="db-panel" style="flex:1;display:flex;flex-direction:column;min-height:0">
          <div class="db-section-hdr">
            <span>✦ EQUIPMENT SET SYNERGIES</span>
          </div>
          <div class="db-set-list">
            ${setCardsHtml}
          </div>
        </div>
      </div>

      <!-- CENTER COLUMN: DUNGEON ARCHWAY & MAIN LOOP CTA -->
      <div class="db-col">
        <div class="db-archway-stage" style="background-image:url('${d.bgVision}')">
          <div class="db-archway-overlay">
            <div class="db-descent-banner">
              <h2>DESCENT ${d.roman}: ${escapeHtml(d.name.toUpperCase())}</h2>
              <p>${escapeHtml(d.subtitle)} &nbsp;·&nbsp; <b style="color:#ffd86b">Reward: +${d.dpReward} DP</b></p>
              <p style="color:#bfb39f;font-style:italic;margin-top:3px">"${escapeHtml(d.tagline)}"</p>
            </div>

            <div class="db-hero-shrine-center">
              <div class="db-hero-portrait-frame">
                <img src="${h.portrait}" alt="${escapeHtml(h.name)}" id="db-hub-portrait-img">
              </div>
              <div class="db-descent-foe-preview">
                <div style="font-size:12px;font-weight:700;color:var(--db-text-gold)">
                  ⚡ Signature Spell: ${escapeHtml(h.spellName)} (${h.spellMp} MP)
                </div>
                <div style="font-size:11.5px;color:#d6cbb8;margin-top:3px">${escapeHtml(h.spellDesc)}</div>
                <div style="font-size:11px;color:#9e9482;margin-top:8px;font-weight:700;text-transform:uppercase">
                  Descent Denizens & Floor 7 Boss:
                </div>
                <div class="db-foe-Roster-row">
                  ${previewFoes}
                </div>
              </div>
            </div>

            <div>
              <div style="background:rgba(12,10,18,0.88);border:1px solid #473c59;border-radius:5px;padding:7px 12px;margin-bottom:8px;font-size:12px;color:#f5deb3;text-align:center">
                ${escapeHtml(ui.bannerMsg)}
              </div>
              <div class="db-hub-cta-bar">
                <button type="button" class="db-btn db-btn-green" data-act="enter-dungeon">
                  ⚔ ENTER DUNGEON (7 FLOORS)
                </button>
                <button type="button" class="db-btn db-btn-purple" data-open-modal="upgrades">
                  ✦ UPGRADES (${state.skillPoints} SP)
                </button>
                <button type="button" class="db-btn db-btn-gold" data-open-modal="quests">
                  📜 QUESTS ${readyMs > 0 ? `(${readyMs}!)` : ""}
                </button>
                <button type="button" class="db-btn db-btn-green" data-act="enter-world">
                  HAVEN WORLD
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: EQUIPMENT BOARD + STASH + INSPECTOR -->
      ${renderRightEquipmentAndStashColumn()}
    </div>`;
  }

  // ---------------------------------------------------------------------------
  // 9. DUNGEON RUN SCREEN RENDERER (COMBAT + 6 EVENT ROOMS + RIVAL BOARD)
  // ---------------------------------------------------------------------------
  function renderRunCenterStage() {
    const d = DESCENTS[run.descentIndex] || DESCENTS[0];
    const h = getHeroDef();
    let bgUrl = (run.floor === 7 && run.step === 5) ? d.bossVision : d.bgVision;
    if ((run.worldSkirmish || run.worldEvent) && run.returnSquare && WORLD_MAP[run.returnSquare]) {
      bgUrl = WORLD_MAP[run.returnSquare].vision;
    }
    const leaveWord = (run.worldSkirmish || run.worldEvent) ? "RETURN TO THE ROAD" : "CONTINUE FLOOR";
    const stepWord = (run.worldSkirmish || run.worldEvent) ? "RETURN TO THE ROAD" : "NEXT STEP";
    const retreatWord = (run.worldSkirmish || run.worldEvent || run.launchedFromWorld) ? "RETREAT TO ROAD" : "RETREAT TO HUB";

    // 5-Step Floor Stepper
    const stepLabels = ["1: FIGHT", "2: " + run.floorPlan[1].toUpperCase(), "3: FIGHT", "4: " + run.floorPlan[3].toUpperCase(), run.floor === 7 ? "5: BOSS" : (run.floor % 2 === 0 ? "5: RIVAL" : "5: ELITE")];
    const stepperHtml = stepLabels.map((lbl, idx) => {
      const sNum = idx + 1;
      const cls = sNum === run.step ? "current" : (sNum < run.step ? "done" : "");
      return `<div class="db-step-node ${cls}" data-jump-step="${sNum}" title="Click to jump/preview Step ${sNum}">
        Floor ${run.floor} · ${lbl}
      </div>`;
    }).join("");

    let stageBodyHtml = "";

    if (run.roomKind === "combat") {
      const enemyCards = run.enemies.map((e, idx) => {
        const badge = e.isBoss ? "👑 BOSS" : e.isRival ? "⚔ RIVAL GHOST" : e.isElite ? "★ ELITE" : "FOE";
        const hpPct = Math.round((e.hp / Math.max(1, e.maxHp)) * 100);
        return `<div class="db-enemy-card ${idx === run.targetIndex ? "targeted" : ""} ${e.hp <= 0 ? "dead" : ""}"
                     data-enemy-idx="${idx}">
          <div style="font-size:10px;font-weight:800;color:${e.isBoss ? "#ffd966" : e.isRival ? "#7ad7ff" : "#c7bca8"}">${badge} · LV ${e.level}</div>
          <div style="font-size:13px;font-weight:700;color:#fff;margin-top:1px">${escapeHtml(e.def.name)}</div>
          <div class="db-bar-wrap">
            <div class="db-bar-fill db-enemy-hp-fill" style="width:${hpPct}%;background:var(--db-hp-red)"></div>
            <div class="db-bar-text db-enemy-hp-txt">${e.hp} / ${e.maxHp} HP ${e.block > 0 ? `[🛡${e.block}]` : ""}</div>
          </div>
          <div class="db-enemy-sprite-wrap">
            <img src="${e.def.sprite}" alt="${escapeHtml(e.def.name)}">
          </div>
          <div class="db-status-row">${renderEnemyStatusPills(e)}</div>
        </div>`;
      }).join("");

      stageBodyHtml = `
        <div class="db-enemy-lineup">${enemyCards}</div>
      `;
    } else if (run.roomKind === "shop") {
      const cards = run.shopItems.map((entry, idx) => {
        const st = getEffectiveItemStats(entry.item, true);
        return `<div class="db-choice-box">
          <img src="${st.def.icon}" alt="${escapeHtml(st.def.name)}">
          <div style="font-weight:700;font-size:12.5px;color:var(--db-text-gold)">${escapeHtml(st.def.name)} Lv${entry.item.level}</div>
          <div style="font-size:11px;color:#b8ae99">${getRarityName(entry.item.rarityTier, entry.item.cursed)} · ${st.def.set}</div>
          <div style="font-size:11px">⚔ ${st.atk} &nbsp; 🛡 ${st.blk} &nbsp; ⚡ ${st.spd}</div>
          <button type="button" class="db-btn db-btn-gold" style="width:100%;margin-top:auto"
                  data-buy-shop="${idx}" ${entry.bought || state.coins < entry.cost ? "disabled" : ""}>
            ${entry.bought ? "PURCHASED" : `BUY (${entry.cost}G)`}
          </button>
        </div>`;
      }).join("");

      stageBodyHtml = `<div class="db-event-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3 style="margin:0;color:var(--db-text-gold);font-family:Georgia,serif">🛒 THE DUNGEON MERCHANT (Gold: ${state.coins}G)</h3>
          <div style="display:flex;gap:6px">
            <button type="button" class="db-btn" data-act="reroll-shop">REROLL SHOP (15G)</button>
            <button type="button" class="db-btn db-btn-green" data-act="next-room">${leaveWord}</button>
          </div>
        </div>
        <p style="margin:6px 0 0;font-size:12px;color:#c7bca8">Purchase scaled gear to trigger Auto-Merges on your Equipment Board.</p>
        <div class="db-choice-grid" style="grid-template-columns:repeat(4,1fr)">${cards}</div>
      </div>`;
    } else if (run.roomKind === "relic") {
      const rCards = run.relicChoices.map((r, idx) => `
        <div class="db-choice-box">
          <img src="${r.icon}" alt="${escapeHtml(r.name)}">
          <div style="font-weight:700;font-size:13px;color:var(--db-text-gold)">${escapeHtml(r.name)}</div>
          <div style="font-size:11.5px;color:#d1c6b2;line-height:1.35">${escapeHtml(r.desc)}</div>
          <button type="button" class="db-btn db-btn-purple" style="width:100%;margin-top:auto"
                  data-pick-relic="${idx}" ${run.relicPicked ? "disabled" : ""}>
            ${run.relicPicked ? "RELIC CLAIMED" : "CHOOSE RELIC"}
          </button>
        </div>
      `).join("");

      stageBodyHtml = `<div class="db-event-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3 style="margin:0;color:var(--db-text-gold);font-family:Georgia,serif">🏺 CHOOSE A RUN RELIC</h3>
          <button type="button" class="db-btn db-btn-green" data-act="next-room">${leaveWord}</button>
        </div>
        <p style="margin:6px 0 0;font-size:12px;color:#c7bca8">Relics grant passive combat modifiers for the remainder of this Descent.</p>
        <div class="db-choice-grid">${rCards}</div>
      </div>`;
    } else if (run.roomKind === "chest") {
      const dropDef = run.chestDrop ? getItemDef(run.chestDrop.id) : ITEMS[0];
      stageBodyHtml = `<div class="db-event-card" style="text-align:center">
        <h3 style="margin:0;color:var(--db-text-gold);font-family:Georgia,serif">📦 A FORGOTTEN TREASURE CHEST</h3>
        <img src="assets/Items/CHEST.png" alt="Chest" style="width:84px;height:84px;image-rendering:pixelated;margin:12px auto;display:block">
        <p style="font-size:13px;color:#e8dec8">
          ${run.chestOpened
            ? `Opened! Claimed <b>+${run.chestGold} Gold</b> and <b>${escapeHtml(dropDef.name)} Lv${run.chestDrop.level}</b>!`
            : `An iron-bound chest rests in the torchlight. Open it for Gold & high-rarity equipment!`}
        </p>
        <div style="display:flex;justify-content:center;gap:10px;margin-top:12px">
          <button type="button" class="db-btn db-btn-gold" data-act="open-chest" ${run.chestOpened ? "disabled" : ""}>
            ${run.chestOpened ? "CHEST LOOTED" : "🔓 OPEN FORGOTTEN CHEST"}
          </button>
          <button type="button" class="db-btn db-btn-green" data-act="next-room">${leaveWord}</button>
        </div>
      </div>`;
    } else if (run.roomKind === "shrine") {
      const cItem = run.shrineOffer || makeBoardItem("cursed_bloodblade", 2, 5, { cursed: true });
      const cDef = getItemDef(cItem.id);
      stageBodyHtml = `<div class="db-event-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3 style="margin:0;color:#ff6b81;font-family:Georgia,serif">⛩ A CURSED SHRINE OF THE DEEP</h3>
          <button type="button" class="db-btn db-btn-green" data-act="next-room">${leaveWord}</button>
        </div>
        <div class="db-choice-grid" style="grid-template-columns:1fr 1fr">
          <div class="db-choice-box" style="border-color:#d92638">
            <img src="${cDef.icon}" alt="${escapeHtml(cDef.name)}">
            <div style="font-weight:700;color:#ff7a8a">${escapeHtml(cDef.name)} Lv${cItem.level} [CURSED]</div>
            <div style="font-size:11.5px;color:#d6cbb8">${escapeHtml(cDef.desc)}</div>
            <button type="button" class="db-btn db-btn-crimson" style="width:100%;margin-top:auto"
                    data-act="shrine-curse" ${run.shrineResolved ? "disabled" : ""}>
              ACCEPT CURSED GIFT
            </button>
          </div>
          <div class="db-choice-box" style="border-color:#35b557">
            <img src="assets/Items/POTION_HP.png" alt="Purify">
            <div style="font-weight:700;color:#7ce893">Purify at the Shrine</div>
            <div style="font-size:11.5px;color:#d6cbb8">Restore +40% Max HP, full Mana, and cleanse fatigue.</div>
            <button type="button" class="db-btn db-btn-green" style="width:100%;margin-top:auto"
                    data-act="shrine-purify" ${run.shrineResolved ? "disabled" : ""}>
              PURIFY &amp; HEAL (+40% HP)
            </button>
          </div>
        </div>
      </div>`;
    } else if (run.roomKind === "forge") {
      const topItem = state.board[0];
      const secondItem = state.stash[0] || state.board[1];
      stageBodyHtml = `<div class="db-event-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3 style="margin:0;color:var(--db-text-gold);font-family:Georgia,serif">⚒ THE BLACKSMITH'S DEEP FORGE</h3>
          <button type="button" class="db-btn db-btn-green" data-act="next-room">${leaveWord}</button>
        </div>
        <div class="db-choice-grid" style="grid-template-columns:1fr 1fr">
          <div class="db-choice-box">
            <img src="assets/Items/HAMMER.png" alt="Temper">
            <div style="font-weight:700;color:var(--db-text-gold)">Masterwork Temper</div>
            <div style="font-size:11.5px;color:#d6cbb8">
              Upgrade <b>${topItem ? escapeHtml(getItemDef(topItem.id).name) : "Lead Item"}</b> by +1 Level &amp; +1 Rarity Tier.
            </div>
            <button type="button" class="db-btn db-btn-gold" style="width:100%;margin-top:auto"
                    data-act="forge-temper" ${run.forgeUsed ? "disabled" : ""}>
              TEMPER LEAD ITEM (+1 LV)
            </button>
          </div>
          <div class="db-choice-box">
            <img src="assets/Items/GREATSWORD.png" alt="Fuse">
            <div style="font-weight:700;color:#d58aff">Hybrid Item Fusion</div>
            <div style="font-size:11.5px;color:#d6cbb8">
              Fuse <b>${topItem ? escapeHtml(getItemDef(topItem.id).name) : "Board[0]"}</b> with <b>${secondItem ? escapeHtml(getItemDef(secondItem.id).name) : "Stash[0]"}</b> into a Dual-Tag Hybrid!
            </div>
            <button type="button" class="db-btn db-btn-purple" style="width:100%;margin-top:auto"
                    data-act="forge-fuse" ${run.forgeUsed || !secondItem ? "disabled" : ""}>
              HYBRID FUSE ITEMS
            </button>
          </div>
        </div>
      </div>`;
    } else if (run.roomKind === "wheel") {
      stageBodyHtml = `<div class="db-event-card" style="text-align:center">
        <h3 style="margin:0;color:var(--db-text-gold);font-family:Georgia,serif">🎡 WHEEL OF FORTUNE (25G / SPIN)</h3>
        <p style="font-size:13px;color:#ffe6a3;margin:10px 0">${escapeHtml(run.wheelText)}</p>
        <div style="display:flex;justify-content:center;gap:10px;margin-top:12px">
          <button type="button" class="db-btn db-btn-gold" data-act="spin-wheel" ${state.coins < 25 ? "disabled" : ""}>
            🎲 SPIN THE WHEEL (25G)
          </button>
          <button type="button" class="db-btn db-btn-green" data-act="next-room">${leaveWord}</button>
        </div>
      </div>`;
    } else if (run.roomKind === "conquered") {
      stageBodyHtml = `<div class="db-event-card" style="text-align:center">
        <h2 style="margin:0;color:var(--db-text-gold);font-family:Georgia,serif">👑 DESCENT ${d.roman} CONQUERED!</h2>
        <p style="font-size:14px;color:#d8f5de;margin:10px 0">
          You defeated the Floor 7 Boss of <b>${escapeHtml(d.name)}</b>!<br>
          Earned <b>+${d.dpReward} Dungeon Points (DP)</b> and <b>+2 Skill Points (SP)</b>!
        </p>
        <button type="button" class="db-btn db-btn-gold" style="padding:10px 24px;font-size:14px" data-act="return-hub">
          ${run.launchedFromWorld ? "RETURN TO THE ROAD" : "RETURN TO DUNGEON HUB"}
        </button>
      </div>`;
    }

    return `<div class="db-col">
      <div class="db-panel db-panel-gold" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
        ${(run.worldSkirmish || run.worldEvent) ? "" : `<div class="db-floor-stepper">${stepperHtml}</div>`}
        <div class="db-combat-stage" style="background-image:url('${bgUrl}')">
          <div class="db-combat-top-controls">
            <div style="display:flex;gap:6px;align-items:center">
              <button type="button" class="db-btn ${run.autoBattle ? "db-btn-green" : "db-btn-gold"}" data-act="toggle-auto">
                ${run.autoBattle ? "|| PAUSE AUTO" : "▶ RESUME AUTO"}
              </button>
              <button type="button" class="db-btn" data-act="cycle-speed">SPEED: ${run.speedMult}x</button>
              <button type="button" class="db-btn db-btn-crimson" data-act="manual-strike" title="Instant d20 Weapon Strike">⚔ STRIKE</button>
              <button type="button" class="db-btn db-btn-purple" data-act="cast-spell" title="${escapeHtml(h.spellDesc)}">✨ ${escapeHtml(h.spellName)} (${h.spellMp}MP)</button>
              <button type="button" class="db-btn" data-act="quick-draught">🧪 DRAUGHT</button>
            </div>
            <div style="display:flex;gap:6px">
              <button type="button" class="db-btn" data-act="next-room">${stepWord}</button>
              <button type="button" class="db-btn db-btn-crimson" data-act="return-hub">${retreatWord}</button>
            </div>
          </div>

          ${stageBodyHtml}

          <div class="db-combat-footer">
            <div class="db-combat-log" id="db-combat-log-box">
              ${run.log.slice(0, 10).map(l => `<div>${escapeHtml(l)}</div>`).join("")}
            </div>
            <div style="display:flex;flex-direction:column;justify-content:space-between;gap:5px">
              <div style="font-size:11px;color:#b8ae99;display:flex;justify-content:space-between">
                <span>ROOM EVENT SHORTCUTS:</span>
                <span>FL ${run.floor}/7 · STEP ${run.step}/5</span>
              </div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">
                <button type="button" class="db-btn" style="padding:3px;font-size:10px" data-debug-room="shop">🛒 SHOP</button>
                <button type="button" class="db-btn" style="padding:3px;font-size:10px" data-debug-room="relic">🏺 RELIC</button>
                <button type="button" class="db-btn" style="padding:3px;font-size:10px" data-debug-room="chest">📦 CHEST</button>
                <button type="button" class="db-btn" style="padding:3px;font-size:10px" data-debug-room="shrine">⛩ SHRINE</button>
                <button type="button" class="db-btn" style="padding:3px;font-size:10px" data-debug-room="forge">⚒ FORGE</button>
                <button type="button" class="db-btn" style="padding:3px;font-size:10px" data-debug-room="wheel">🎡 WHEEL</button>
              </div>
              <button type="button" class="db-btn db-btn-gold" style="padding:4px;font-size:10.5px" data-debug-room="rival">
                ⚔ CHALLENGE RIVAL ADVENTURER (3-BOARD DUEL)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderRunScreen() {
    const h = getHeroDef();
    const maxSlots = getMaxBoardSlots();
    const boardCells = [];
    for (let i = 0; i < maxSlots; i++) {
      boardCells.push(renderItemSlotHtml(state.board[i] || null, i, true, run.roomKind === "combat"));
    }

    const hpPct = Math.round((run.heroHp / Math.max(1, run.heroMaxHp)) * 100);
    const mpPct = Math.round((run.heroMp / Math.max(1, run.heroMaxMp)) * 100);
    const activeRival = run.enemies.find(e => e.rivalBoard && e.rivalBoard.length > 0);

    let leftBottomHtml = "";
    if (ui.runLeftTab === "stash") {
      const cells = state.stash.slice(0, 12).map((bi, idx) => renderItemSlotHtml(bi, idx, false, false));
      leftBottomHtml = `
        <div class="db-stash-grid" style="grid-template-columns:repeat(4,1fr);max-height:150px">${cells.join("")}</div>
        <div style="display:flex;gap:5px;padding:6px 8px">
          <button type="button" class="db-btn db-btn-gold" style="flex:1;font-size:10.5px" data-act="auto-merge">AUTO MERGE (M)</button>
          <button type="button" class="db-btn db-btn-green" style="flex:1;font-size:10.5px" data-act="toggle-equip">EQUIP / UNEQUIP</button>
        </div>
      `;
    } else if (ui.runLeftTab === "relics") {
      const rList = run.relicIds.map(id => RELICS.find(r => r.id === id)).filter(Boolean);
      leftBottomHtml = `<div style="padding:8px;overflow-y:auto;font-size:11.5px">
        ${rList.map(r => `<div style="margin-bottom:6px"><b style="color:var(--db-text-gold)">★ ${escapeHtml(r.name)}:</b> ${escapeHtml(r.desc)}</div>`).join("")}
      </div>`;
    } else {
      const stats = getHeroComputedStats();
      leftBottomHtml = `<div class="db-stat-grid">
        <div class="db-stat-box"><span>Sweep Atk</span><b>${stats.cycleAtk}</b></div>
        <div class="db-stat-box"><span>Sweep Blk</span><b>${stats.cycleBlk}</b></div>
        <div class="db-stat-box"><span>Crit</span><b>${stats.critPct}%</b></div>
        <div class="db-stat-box"><span>Dodge</span><b>${stats.dodgePct}%</b></div>
        <div class="db-stat-box"><span>Thorns</span><b>${run.heroThorns}</b></div>
        <div class="db-stat-box"><span>Speed</span><b>${stats.speed}</b></div>
      </div>`;
    }

    // 3rd Right-Hand Column: RIVAL GHOST BOARD when fighting a Rival, or Full Stash & Inspector!
    let rightColHtml = "";
    if (activeRival) {
      const rivalCells = activeRival.rivalBoard.map((bi, idx) => renderItemSlotHtml(bi, idx, false, false)).join("");
      rightColHtml = `<div class="db-col">
        <div class="db-panel db-panel-gold" style="flex:1;display:flex;flex-direction:column">
          <div class="db-section-hdr">
            <span>⚔ ${escapeHtml(activeRival.def.name.toUpperCase())}'S BOARD</span>
            <span style="font-size:10px;color:#7ad7ff">${activeRival.def.archetype} SET</span>
          </div>
          <div style="padding:8px;font-size:11.5px;color:#d6cbb8">
            Rival Adventurers carry their own 6-slot Equipment Board &amp; Set Synergies into battle!
          </div>
          <div class="db-board-grid" style="grid-template-columns:repeat(2,1fr)">
            ${rivalCells}
          </div>
          ${renderInspectorPanel()}
        </div>
      </div>`;
    } else {
      rightColHtml = renderRightEquipmentAndStashColumn();
    }

    return `<div class="db-workspace ${activeRival ? "run-rival-active" : ""}">
      <!-- LEFT RUN COLUMN: HERO VITALS + LIVE SWEEPING EQUIPMENT BOARD -->
      <div class="db-col">
        <div class="db-panel db-panel-gold" style="padding:8px">
          <div style="display:flex;gap:10px;align-items:center">
            <img src="${h.portrait}" alt="${escapeHtml(h.name)}" style="width:52px;height:52px;border-radius:6px;border:2px solid var(--db-border-gold);object-fit:cover">
            <div style="flex:1">
              <div style="font-weight:700;font-size:13px;color:var(--db-text-gold)">${escapeHtml(h.name)} · Lv${state.level}</div>
              <div class="db-bar-wrap">
                <div class="db-bar-fill" id="db-run-hp-fill" style="width:${hpPct}%;background:var(--db-hp-red)"></div>
                <div class="db-bar-text" id="db-run-hp-txt">HP ${run.heroHp} / ${run.heroMaxHp} ${run.heroBlock > 0 ? `[🛡 +${run.heroBlock} BLK]` : ""}</div>
              </div>
              <div class="db-bar-wrap">
                <div class="db-bar-fill" id="db-run-mp-fill" style="width:${mpPct}%;background:var(--db-mp-blue)"></div>
                <div class="db-bar-text" id="db-run-mp-txt">MP ${run.heroMp} / ${run.heroMaxMp} · 🌵 Thorns ${run.heroThorns}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="db-panel" style="display:flex;flex-direction:column">
          <div class="db-section-hdr">
            <span>⚡ ACTIVE SWEEP BOARD (${state.board.length}/${maxSlots})</span>
            <span style="font-size:10px;color:#ffd966">LIVE SWEEP</span>
          </div>
          <div class="db-board-grid">
            ${boardCells.join("")}
          </div>
        </div>

        <div class="db-panel" style="flex:1;display:flex;flex-direction:column;min-height:0">
          <div style="display:flex;gap:4px;padding:6px 8px;border-bottom:1px solid #2e283d">
            ${["stash", "relics", "stats"].map(t => `
              <button type="button" class="db-btn ${ui.runLeftTab === t ? "db-btn-gold" : ""}"
                      style="flex:1;padding:3px 6px;font-size:10.5px"
                      data-run-left-tab="${t}">
                ${t.toUpperCase()}
              </button>
            `).join("")}
          </div>
          ${leftBottomHtml}
        </div>
      </div>

      <!-- CENTER RUN COLUMN: COMBAT / EVENT STAGE -->
      ${renderRunCenterStage()}

      <!-- RIGHT RUN COLUMN: RIVAL BOARD OR FULL STASH & INSPECTOR -->
      ${rightColHtml}
    </div>`;
  }

  // ---------------------------------------------------------------------------
  // 10. MODALS (UPGRADES, QUESTS, HAVEN WORLD 49-SQUARE EXPLORER)
  // ---------------------------------------------------------------------------
  function renderModal() {
    if (!ui.modal) return "";
    if (ui.modal === "record") return renderRecordModal();

    if (ui.modal === "upgrades") {
      const tabs = ["Damage", "Defense", "Sustain", "Economy", "Unlocks"];
      const list = UPGRADES.filter(u => u.tab === ui.upgradeTab);
      const cards = list.map(u => {
        const rank = getUpgradeRank(u.id);
        const maxed = rank >= u.max;
        const canBuy = !maxed && state.skillPoints >= u.costSp && state.dungeonPoints >= u.costDp;
        return `<div class="db-upgrade-card">
          <div>
            <div style="display:flex;justify-content:space-between;font-weight:700;color:var(--db-text-gold)">
              <span>${escapeHtml(u.name)}</span>
              <span>Rank ${rank} / ${u.max}</span>
            </div>
            <div style="font-size:12px;color:#d6cbb8;margin-top:5px">${escapeHtml(u.desc)}</div>
          </div>
          <button type="button" class="db-btn ${maxed ? "" : "db-btn-purple"}"
                  data-buy-upgrade="${u.id}" ${!canBuy ? "disabled" : ""}>
            ${maxed ? "MAX RANK REACHED" : `UPGRADE (${u.costSp} SP${u.costDp ? ` + ${u.costDp} DP` : ""})`}
          </button>
        </div>`;
      }).join("");

      return `<div class="db-modal-backdrop" data-close-backdrop="1">
        <div class="db-modal-window">
          <div class="db-section-hdr" style="padding:10px 14px;font-size:15px">
            <span>✦ PERMANENT DUNGEONBOUND UPGRADES (SP: ${state.skillPoints} · DP: ${state.dungeonPoints})</span>
            <button type="button" class="db-btn db-btn-crimson" data-close-modal="1">✕ CLOSE (ESC)</button>
          </div>
          <div style="display:flex;gap:6px;padding:10px 14px;border-bottom:1px solid #302940">
            ${tabs.map(t => `
              <button type="button" class="db-btn ${ui.upgradeTab === t ? "db-btn-gold" : ""}" data-upgrade-tab="${t}">
                ${t.toUpperCase()}
              </button>
            `).join("")}
            <button type="button" class="db-btn" style="margin-left:auto" data-act="respec-upgrades">↺ RESPEC ALL SP</button>
          </div>
          <div class="db-modal-body">
            <div class="db-upgrade-grid">${cards}</div>
          </div>
        </div>
      </div>`;
    }

    if (ui.modal === "quests") {
      const tabs = ["Combat", "Items", "General"];
      const list = MILESTONES.filter(m => m.cat === ui.questTab);
      const cards = list.map(m => {
        const cur = state[m.stat] || 0;
        const done = cur >= m.target;
        const claimed = state.milestonesClaimed.includes(m.id);
        const cls = claimed ? "claimed" : (done ? "ready" : "");
        return `<div class="db-quest-card ${cls}">
          <div>
            <div style="font-weight:700;color:var(--db-text-gold)">${escapeHtml(m.title)}</div>
            <div style="font-size:11.5px;color:#c7bca8;margin-top:2px">
              Progress: <b>${Math.min(cur, m.target)} / ${m.target}</b> &nbsp;·&nbsp;
              Reward: <span style="color:#67d4ff">+${m.sp} SP</span>, <span style="color:#d58aff">+${m.dp} DP</span>, <span style="color:#f6c84c">+${m.gold}G</span>
            </div>
          </div>
          <button type="button" class="db-btn ${done && !claimed ? "db-btn-gold" : ""}"
                  data-claim-milestone="${m.id}" ${!done || claimed ? "disabled" : ""}>
            ${claimed ? "CLAIMED ✓" : (done ? "CLAIM REWARD!" : "IN PROGRESS")}
          </button>
        </div>`;
      }).join("");

      return `<div class="db-modal-backdrop" data-close-backdrop="1">
        <div class="db-modal-window">
          <div class="db-section-hdr" style="padding:10px 14px;font-size:15px">
            <span>📜 DUNGEONBOUND MILESTONE QUESTS &amp; REWARDS</span>
            <button type="button" class="db-btn db-btn-crimson" data-close-modal="1">✕ CLOSE (ESC)</button>
          </div>
          <div style="display:flex;gap:6px;padding:10px 14px;border-bottom:1px solid #302940">
            ${tabs.map(t => `
              <button type="button" class="db-btn ${ui.questTab === t ? "db-btn-gold" : ""}" data-quest-tab="${t}">
                ${t.toUpperCase()}
              </button>
            `).join("")}
            <button type="button" class="db-btn db-btn-green" style="margin-left:auto" data-act="claim-all-quests">
              ★ CLAIM ALL READY MILESTONES
            </button>
          </div>
          <div class="db-modal-body">
            <div class="db-quest-list">${cards}</div>
          </div>
        </div>
      </div>`;
    }

    if (ui.modal === "haven") {
      const node = HAVEN_NODES.find(n => n.id === ui.havenNodeId) || HAVEN_NODES[0];
      const claimed = state.havenClaimed.includes(node.questId);

      return `<div class="db-modal-backdrop" data-close-backdrop="1">
        <div class="db-modal-window">
          <div class="db-section-hdr" style="padding:10px 14px;font-size:15px">
            <span>🏰 HAVEN GATE &amp; UNDERWORKS WORLD (49-SQUARE ATLAS &amp; VOICED NPCS)</span>
            <div style="display:flex;gap:6px">
              <button type="button" class="db-btn" data-toggle-unity="1">OPEN FULL UNITY 3D ATLAS</button>
              <button type="button" class="db-btn db-btn-crimson" data-close-modal="1">✕ BACK TO DUNGEON HUB</button>
            </div>
          </div>
          <div class="db-modal-body" style="display:grid;grid-template-columns:280px 1fr;gap:14px">
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="font-size:12px;font-weight:700;color:var(--db-text-gold)">HAVEN &amp; UNDERWORKS DISTRICTS:</div>
              ${HAVEN_NODES.map(n => `
                <button type="button" class="db-btn ${n.id === node.id ? "db-btn-gold" : ""}"
                        style="justify-content:space-between;padding:8px 10px"
                        data-haven-node="${n.id}">
                  <span>${escapeHtml(n.name)}</span>
                  <span style="font-size:10px;opacity:0.8">${state.havenClaimed.includes(n.questId) ? "✓" : "QUEST"}</span>
                </button>
              `).join("")}
            </div>
            <div class="db-panel" style="padding:14px;display:flex;flex-direction:column;gap:10px">
              <img src="${node.vision}" alt="${escapeHtml(node.name)}" style="width:100%;height:230px;object-fit:cover;border-radius:6px;border:2px solid var(--db-border-gold)">
              <div style="font-size:16px;font-weight:700;color:var(--db-text-gold);font-family:Georgia,serif">
                ${escapeHtml(node.name)} — ${escapeHtml(node.npc)}
              </div>
              <div style="font-size:13px;color:#eee3ce;line-height:1.45;background:#100d17;padding:10px 12px;border-radius:6px;border-left:3px solid var(--db-border-gold)">
                "${escapeHtml(node.quote)}"
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto">
                <button type="button" class="db-btn" data-speak-npc="${node.id}">🔊 SPEAK ALOUD (VOICE)</button>
                <button type="button" class="db-btn ${claimed ? "" : "db-btn-green"}"
                        data-claim-haven="${node.questId}" ${claimed ? "disabled" : ""}>
                  ${claimed ? "TOWN TASK COMPLETED ✓" : `COMPLETE '${escapeHtml(node.questTitle)}' (+${node.rewardGold}G, +${node.rewardSp} SP)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    }

    return "";
  }

  // ---------------------------------------------------------------------------
  // 11. MAIN RENDER & EVENT DELEGATION
  // ---------------------------------------------------------------------------
  function render() {
    const root = document.getElementById("db-app");
    if (!root) return;
    root.style.display = ui.unityVisible ? "none" : "flex";

    root.innerHTML = `
      ${renderTopBar()}
      ${ui.mode === "run" ? renderRunScreen() : (ui.mode === "world" ? renderWorldScreen() : renderHubScreen())}
      ${renderModal()}
    `;
  }

  function handleAction(act) {
    if (handleWorldAction(act)) return;
    if (act === "enter-dungeon") {
      startDungeonRun(state.selectedDescent);
    } else if (act === "toggle-equip") {
      toggleEquipSelected();
    } else if (act === "merge-selected") {
      mergeSingleItem(findSelectedItem());
    } else if (act === "auto-merge") {
      autoMergeAll();
    } else if (act === "fuse-selected") {
      fuseSelectedWithStash();
    } else if (act === "sell-selected") {
      sellSelectedItem();
    } else if (act === "sell-common") {
      sellAllCommonStash();
    } else if (act === "sort-stash") {
      sortStash();
    } else if (act === "unlock-row") {
      if (state.coins < 80) {
        ui.bannerMsg = "Need 80G to unlock the next +4 Equipment Board row!";
        render();
        return;
      }
      state.coins -= 80;
      state.unlockedRows = Math.min(4, (state.unlockedRows || 2) + 1);
      ui.bannerMsg = "★ Unlocked +4 Equipment Board Slots (" + getMaxBoardSlots() + " Total)!";
      playSfx("spell", 0.45);
      saveState();
      render();
    } else if (act === "toggle-auto") {
      run.autoBattle = !run.autoBattle;
      render();
    } else if (act === "cycle-speed") {
      const speeds = [1, 1.5, 2, 3];
      const next = speeds[(speeds.indexOf(run.speedMult) + 1) % speeds.length];
      run.speedMult = next;
      render();
    } else if (act === "manual-strike") {
      manualStrike();
    } else if (act === "cast-spell") {
      castHeroSpell();
    } else if (act === "quick-draught") {
      drinkQuickDraught();
    } else if (act === "next-room") {
      advanceToNextNode();
    } else if (act === "return-hub") {
      if (run.worldSkirmish || run.worldEvent) {
        run.worldSkirmish = false;
        run.worldEvent = false;
        run.combatWon = false;
        returnFromWorldEncounter(false);
      } else if (run.launchedFromWorld) {
        parkOnRoad("You step back onto the road at " + (WORLD_MAP[state.squareId] ? WORLD_MAP[state.squareId].name : "Haven") + ".");
      } else {
        ui.mode = "hub";
        render();
      }
    } else if (act === "reroll-shop") {
      if (state.coins < 15) return;
      state.coins -= 15;
      setupShopRoom();
      saveState();
      render();
    } else if (act === "open-chest") {
      if (run.chestOpened) return;
      run.chestOpened = true;
      state.chestsOpened = (state.chestsOpened || 0) + 1;
      state.coins += run.chestGold;
      if (run.chestDrop) state.stash.push(run.chestDrop);
      addRunLog("📦 Opened Chest: +" + run.chestGold + "G & " + getItemDef(run.chestDrop.id).name + " Lv" + run.chestDrop.level + "!");
      playSfx("spell", 0.5);
      saveState();
      render();
    } else if (act === "shrine-curse") {
      if (run.shrineResolved) return;
      run.shrineResolved = true;
      state.cursesTaken = (state.cursesTaken || 0) + 1;
      if (run.shrineOffer) state.stash.push(run.shrineOffer);
      addRunLog("⛩ Accepted Cursed Gift into Stash!");
      playSfx("hit", 0.5);
      saveState();
      render();
    } else if (act === "shrine-purify") {
      if (run.shrineResolved) return;
      run.shrineResolved = true;
      run.heroHp = Math.min(run.heroMaxHp, run.heroHp + Math.round(run.heroMaxHp * 0.40));
      run.heroMp = run.heroMaxMp;
      addRunLog("⛩ Purified at Shrine: Restored +40% HP & full Mana!");
      playSfx("spell", 0.45);
      saveState();
      render();
    } else if (act === "forge-temper") {
      if (run.forgeUsed || state.board.length === 0) return;
      run.forgeUsed = true;
      state.itemsForged = (state.itemsForged || 0) + 1;
      state.board[0].level = Math.min(10, state.board[0].level + 1);
      if (!state.board[0].cursed) state.board[0].rarityTier = Math.min(4, state.board[0].rarityTier + 1);
      addRunLog("⚒ Tempered " + getItemDef(state.board[0].id).name + " to Lv" + state.board[0].level + "!");
      playSfx("hit", 0.5);
      saveState();
      render();
    } else if (act === "forge-fuse") {
      if (run.forgeUsed || state.board.length === 0) return;
      const partner = state.stash[0] || state.board[1];
      if (!partner) return;
      run.forgeUsed = true;
      state.itemsForged = (state.itemsForged || 0) + 1;
      state.board[0].hybridId = partner.id;
      state.board[0].level = Math.min(10, state.board[0].level + 1);
      state.stash = state.stash.filter(x => x.uid !== partner.uid);
      if (state.board[1] && state.board[1].uid === partner.uid && state.board.length > 1) {
        state.board.splice(1, 1);
      }
      addRunLog("⚒ Hybrid Fused " + getItemDef(state.board[0].id).name + " + " + getItemDef(partner.id).name + "!");
      playSfx("spell", 0.5);
      saveState();
      render();
    } else if (act === "spin-wheel") {
      if (state.coins < 25) return;
      state.coins -= 25;
      state.wheelSpins = (state.wheelSpins || 0) + 1;
      const roll = Math.floor(Math.random() * 5);
      if (roll === 0) {
        state.coins += 95;
        run.wheelText = "🎉 JACKPOT! Won +95 Gold Coins!";
      } else if (roll === 1 && state.board[0]) {
        state.board[0].level = Math.min(10, state.board[0].level + 1);
        run.wheelText = "⚒ ANVIL BLESSING! " + getItemDef(state.board[0].id).name + " upgraded to Lv" + state.board[0].level + "!";
      } else if (roll === 2) {
        const drop = rollDungeonDrop(run.floor + 2, true);
        drop.rarityTier = Math.max(3, drop.rarityTier);
        state.stash.push(drop);
        run.wheelText = "🎁 EPIC PRIZE! Won " + getItemDef(drop.id).name + " Lv" + drop.level + "!";
      } else if (roll === 3) {
        const r = RELICS[Math.floor(Math.random() * RELICS.length)];
        if (!run.relicIds.includes(r.id)) run.relicIds.push(r.id);
        run.wheelText = "🏺 RELIC PRIZE! Gained " + r.name + "!";
      } else {
        run.heroHp = run.heroMaxHp;
        run.heroMp = run.heroMaxMp;
        state.skillPoints += 1;
        run.wheelText = "🌟 STAR BLESSING! Full HP/MP Restore + 1 Skill Point!";
      }
      addRunLog("[WHEEL] " + run.wheelText);
      playSfx("spell", 0.5);
      saveState();
      render();
    } else if (act === "respec-upgrades") {
      let refundedSp = 0;
      let refundedDp = 0;
      UPGRADES.forEach(u => {
        const r = getUpgradeRank(u.id);
        if (r > 0) {
          refundedSp += r * u.costSp;
          refundedDp += r * u.costDp;
        }
      });
      state.upgrades = {};
      state.skillPoints += refundedSp;
      state.dungeonPoints += refundedDp;
      saveState();
      render();
    } else if (act === "claim-all-quests") {
      let claimedCount = 0;
      MILESTONES.forEach(m => {
        const cur = state[m.stat] || 0;
        if (cur >= m.target && !state.milestonesClaimed.includes(m.id)) {
          state.milestonesClaimed.push(m.id);
          state.skillPoints += m.sp;
          state.dungeonPoints += m.dp;
          state.coins += m.gold;
          claimedCount += 1;
        }
      });
      if (claimedCount > 0) playSfx("spell", 0.5);
      saveState();
      render();
    }
  }

  function bindEvents() {
    document.addEventListener("click", (ev) => {
      const t = ev.target.closest("[data-act],[data-select-hero],[data-select-descent],[data-open-modal],[data-close-modal],[data-close-backdrop],[data-item-uid],[data-stash-filter],[data-run-left-tab],[data-upgrade-tab],[data-buy-upgrade],[data-quest-tab],[data-claim-milestone],[data-buy-shop],[data-pick-relic],[data-jump-step],[data-debug-room],[data-enemy-idx],[data-haven-node],[data-claim-haven],[data-speak-npc],[data-toggle-unity],[data-travel],[data-goto],[data-atlas-region],[data-waystone],[data-rival],[data-claim-road],[data-talk-npc]");
      if (!t) return;

      if (t.hasAttribute("data-toggle-unity")) {
        toggleUnityView();
        return;
      }
      if (t.hasAttribute("data-close-backdrop") && ev.target !== t) return;
      if (t.hasAttribute("data-close-modal") || t.hasAttribute("data-close-backdrop")) {
        ui.modal = null;
        render();
        return;
      }
      if (t.hasAttribute("data-open-modal")) {
        ui.modal = t.getAttribute("data-open-modal");
        render();
        return;
      }
      if (t.hasAttribute("data-select-hero")) {
        state.heroId = t.getAttribute("data-select-hero");
        const h = getHeroDef();
        ui.bannerMsg = h.name + " (" + h.title + ") ready: \"" + h.quote + "\"";
        saveState();
        render();
        return;
      }
      if (t.hasAttribute("data-select-descent")) {
        state.selectedDescent = parseInt(t.getAttribute("data-select-descent"), 10) || 0;
        saveState();
        render();
        return;
      }
      if (t.hasAttribute("data-item-uid")) {
        const uid = t.getAttribute("data-item-uid");
        const fromBoard = t.getAttribute("data-from-board") === "1";
        if (ui.selectedUid === uid) {
          // Clicking an already-selected item toggles equip/unequip!
          toggleEquipSelected();
        } else {
          ui.selectedUid = uid;
          ui.selectedFromBoard = fromBoard;
          render();
        }
        return;
      }
      if (t.hasAttribute("data-stash-filter")) {
        ui.stashFilter = t.getAttribute("data-stash-filter");
        render();
        return;
      }
      if (t.hasAttribute("data-run-left-tab")) {
        ui.runLeftTab = t.getAttribute("data-run-left-tab");
        render();
        return;
      }
      if (t.hasAttribute("data-upgrade-tab")) {
        ui.upgradeTab = t.getAttribute("data-upgrade-tab");
        render();
        return;
      }
      if (t.hasAttribute("data-buy-upgrade")) {
        const uId = t.getAttribute("data-buy-upgrade");
        const u = UPGRADES.find(x => x.id === uId);
        if (!u) return;
        const r = getUpgradeRank(u.id);
        if (r < u.max && state.skillPoints >= u.costSp && state.dungeonPoints >= u.costDp) {
          state.skillPoints -= u.costSp;
          state.dungeonPoints -= u.costDp;
          state.upgrades[u.id] = r + 1;
          playSfx("spell", 0.45);
          saveState();
          render();
        }
        return;
      }
      if (t.hasAttribute("data-quest-tab")) {
        ui.questTab = t.getAttribute("data-quest-tab");
        render();
        return;
      }
      if (t.hasAttribute("data-claim-milestone")) {
        const mId = t.getAttribute("data-claim-milestone");
        const m = MILESTONES.find(x => x.id === mId);
        if (m && (state[m.stat] || 0) >= m.target && !state.milestonesClaimed.includes(m.id)) {
          state.milestonesClaimed.push(m.id);
          state.skillPoints += m.sp;
          state.dungeonPoints += m.dp;
          state.coins += m.gold;
          playSfx("spell", 0.5);
          saveState();
          render();
        }
        return;
      }
      if (t.hasAttribute("data-buy-shop")) {
        const idx = parseInt(t.getAttribute("data-buy-shop"), 10);
        const entry = run.shopItems[idx];
        if (entry && !entry.bought && state.coins >= entry.cost) {
          state.coins -= entry.cost;
          entry.bought = true;
          state.stash.push(entry.item);
          addRunLog("🛒 Purchased " + getItemDef(entry.item.id).name + " Lv" + entry.item.level + "!");
          playSfx("stone", 0.4);
          saveState();
          render();
        }
        return;
      }
      if (t.hasAttribute("data-pick-relic")) {
        const idx = parseInt(t.getAttribute("data-pick-relic"), 10);
        const r = run.relicChoices[idx];
        if (r && !run.relicPicked) {
          run.relicPicked = true;
          if (!run.relicIds.includes(r.id)) run.relicIds.push(r.id);
          addRunLog("🏺 Claimed Relic: " + r.name + "!");
          playSfx("spell", 0.5);
          saveState();
          render();
        }
        return;
      }
      if (t.hasAttribute("data-jump-step")) {
        const sNum = parseInt(t.getAttribute("data-jump-step"), 10);
        if (sNum >= 1 && sNum <= 5) {
          enterRunStep(run.floor, sNum);
        }
        return;
      }
      if (t.hasAttribute("data-debug-room")) {
        const rk = t.getAttribute("data-debug-room");
        if (rk === "rival") {
          enterRunStep(run.floor, 5, "rival");
        } else {
          enterRunStep(run.floor, run.step, rk);
        }
        return;
      }
      if (t.hasAttribute("data-enemy-idx")) {
        const idx = parseInt(t.getAttribute("data-enemy-idx"), 10);
        if (run.enemies[idx] && run.enemies[idx].hp > 0) {
          run.targetIndex = idx;
          render();
        }
        return;
      }
      if (t.hasAttribute("data-haven-node")) {
        ui.havenNodeId = t.getAttribute("data-haven-node");
        state.havenSquaresVisited = (state.havenSquaresVisited || 1) + 1;
        saveState();
        render();
        return;
      }
      if (t.hasAttribute("data-claim-haven")) {
        const qId = t.getAttribute("data-claim-haven");
        const node = HAVEN_NODES.find(n => n.questId === qId);
        if (node && !state.havenClaimed.includes(qId)) {
          state.havenClaimed.push(qId);
          state.coins += node.rewardGold;
          state.skillPoints += node.rewardSp;
          state.havenSquaresVisited = (state.havenSquaresVisited || 1) + 1;
          playSfx("spell", 0.45);
          saveState();
          render();
        }
        return;
      }
      if (t.hasAttribute("data-speak-npc")) {
        const nId = t.getAttribute("data-speak-npc");
        const node = HAVEN_NODES.find(n => n.id === nId);
        if (node && window.lygoSpeak) {
          window.lygoSpeak(node.quote, node.female);
        }
        return;
      }
      if (t.hasAttribute("data-travel")) {
        travelDir(t.getAttribute("data-travel"));
        return;
      }
      if (t.hasAttribute("data-goto")) {
        const id = t.getAttribute("data-goto");
        const here = currentSquare();
        const dirs = ["n", "s", "e", "w"];
        let found = "";
        dirs.forEach(function (d) { if (here[d] === id) found = d; });
        if (!found) {
          ui.bannerMsg = "Step onto a neighbouring square. The waystone, north of the loft, jumps farther.";
          render();
          return;
        }
        travelDir(found);
        return;
      }
      if (t.hasAttribute("data-atlas-region")) {
        ui.atlasRegion = t.getAttribute("data-atlas-region");
        render();
        return;
      }
      if (t.hasAttribute("data-waystone")) {
        teleportTo(t.getAttribute("data-waystone"));
        return;
      }
      if (t.hasAttribute("data-rival")) {
        beginWorldEncounter("combat", [t.getAttribute("data-rival")]);
        return;
      }
      if (t.hasAttribute("data-claim-road")) {
        claimWorldQuest(t.getAttribute("data-claim-road"));
        return;
      }
      if (t.hasAttribute("data-talk-npc")) {
        talkToNpc(t.getAttribute("data-talk-npc"));
        return;
      }
      if (t.hasAttribute("data-act")) {
        handleAction(t.getAttribute("data-act"));
      }
    });

    window.addEventListener("keydown", (ev) => {
      if (ui.unityVisible) return;
      if (ev.key === "Escape") {
        if (ui.modal) {
          ui.modal = null;
          render();
        }
      } else if (ev.key === "m" || ev.key === "M") {
        autoMergeAll();
      } else if (ev.key === "h" || ev.key === "H") {
        if (ui.modal) { ui.modal = null; render(); return; }
        if (ui.mode === "world") { ui.mode = "hub"; ui.bannerMsg = "Gauntlet hub. Press H to return to the road."; }
        else if (ui.mode === "hub") { ui.mode = "world"; ui.bannerMsg = currentSquare().arrive; }
        render();
      } else if (!ui.modal && ui.mode === "world" && (ev.key === "ArrowUp" || ev.key === "ArrowDown" || ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
        ev.preventDefault();
        const keyDir = { ArrowUp: "n", ArrowDown: "s", ArrowLeft: "w", ArrowRight: "e" };
        travelDir(keyDir[ev.key]);
      } else if (ev.key === "u" || ev.key === "U") {
        ui.modal = ui.modal === "upgrades" ? null : "upgrades";
        render();
      } else if (ev.key === "q" || ev.key === "Q") {
        ui.modal = ui.modal === "quests" ? null : "quests";
        render();
      } else if (ev.key === " ") {
        if (ui.mode === "run" && run.roomKind !== "combat") {
          ev.preventDefault();
          advanceToNextNode();
        }
      }
    });
  }

  function toggleUnityView() {
    ui.unityVisible = !ui.unityVisible;
    const dbApp = document.getElementById("db-app");
    if (dbApp) dbApp.style.display = ui.unityVisible ? "none" : "flex";
    const backBtn = document.getElementById("db-return-from-unity");
    if (backBtn) backBtn.style.display = ui.unityVisible ? "inline-flex" : "none";
    if (ui.unityVisible && typeof window.bootClassicUnityIfNeeded === "function") {
      window.bootClassicUnityIfNeeded();
    }
  }

  // Deterministic Debug & Test Bridge (compatible with Unity SendMessage & Playwright)
  function executeDebugCommand(cmd) {
    if (cmd === "hub") {
      ui.mode = "hub";
      ui.modal = null;
    } else if (cmd === "run") {
      startDungeonRun(state.selectedDescent);
    } else if (cmd === "upgrades") {
      ui.modal = "upgrades";
    } else if (cmd === "quests") {
      ui.modal = "quests";
    } else if (cmd === "haven" || cmd === "world") {
      ui.mode = "world";
      ui.modal = null;
      ensureWorldState();
    } else if (cmd === "world_fight") {
      const sq = currentSquare();
      if (sq.pack) beginWorldEncounter("combat", sq.pack);
    } else if (cmd === "close_modal") {
      ui.modal = null;
    } else if (cmd === "room_shop") {
      if (ui.mode !== "run") startDungeonRun(state.selectedDescent);
      enterRunStep(run.floor, 2, "shop");
    } else if (cmd === "room_relic") {
      if (ui.mode !== "run") startDungeonRun(state.selectedDescent);
      enterRunStep(run.floor, 4, "relic");
    } else if (cmd === "room_chest") {
      if (ui.mode !== "run") startDungeonRun(state.selectedDescent);
      enterRunStep(run.floor, 2, "chest");
    } else if (cmd === "room_shrine") {
      if (ui.mode !== "run") startDungeonRun(state.selectedDescent);
      enterRunStep(run.floor, 4, "shrine");
    } else if (cmd === "room_forge") {
      if (ui.mode !== "run") startDungeonRun(state.selectedDescent);
      enterRunStep(run.floor, 4, "forge");
    } else if (cmd === "room_wheel") {
      if (ui.mode !== "run") startDungeonRun(state.selectedDescent);
      enterRunStep(run.floor, 4, "wheel");
    } else if (cmd === "room_rival") {
      if (ui.mode !== "run") startDungeonRun(state.selectedDescent);
      enterRunStep(run.floor, 5, "rival");
    } else if (cmd === "room_boss") {
      if (ui.mode !== "run") startDungeonRun(state.selectedDescent);
      enterRunStep(7, 5, "boss");
    }
    render();
    return true;
  }

  window.LYGODungeonbound = {
    getState: () => state,
    getRun: () => run,
    getUi: () => ui,
    exec: executeDebugCommand,
    toggleUnityView: toggleUnityView,
    travel: travelDir,
    squareCount: () => WORLD_SQUARES.length,
    linkErrors: () => WORLD_LINK_ERRORS.slice()
  };

  window.lygoGameInstance = {
    SendMessage: function (_go, method, arg) {
      if (method === "ExecuteDebugCommand") executeDebugCommand(arg);
    }
  };

  // Boot on DOMContentLoaded
  function init() {
    if (!document.getElementById("db-app")) {
      const appDiv = document.createElement("div");
      appDiv.id = "db-app";
      document.body.appendChild(appDiv);
    }
    ensureWorldState();
    bindEvents();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
