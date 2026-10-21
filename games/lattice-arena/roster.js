/* LYGO Arena — the roster.
   Thirty-three fighters: the thirteen champions, the fifteen crypt creatures and the five
   beasts. Every one of them is a real kit — its own stat line, its own three moves, its own
   three cards — derived from the numbers Lattice Crypt already gives them (shot / speed /
   magic / armor / melee / brave / faith for the champions, the FOE table for the creatures,
   the PETS table for the pack).

   Sprite atlases are lifted straight out of Lattice Crypt:
     heroes.png    cell 64, cols 8   hero_<id>_<face>_<frame>   face 0 front · 2 side · 3 side · 1 = 2 mirrored
     creatures.png cell 64, cols 8   foe_<kind>_<frame>         4-frame walk
     pets.png      cell 64, cols 8   pet_<kind>_<frame>         4-frame walk
     tiles.png     cell 32, cols 16  <realm>_f0..f15 | <realm>_face | <realm>_top
     fx.png        cell 32, cols 8   bolt_<w>_<f> · hit_<w>_<f> · mz_<w>_<f> · nova_<f>
*/
(function (w) {
  "use strict";

  /* ---------------------------------------------------------------- cards ---
     Cards are the warden's draft, turned into a pre-game build. Three per fighter.
     `mods` are read once when the fighter is built; `hook` cards fire at a moment. */
  const CARDS = {
    might:      { name: "Tooth of the Door", tag: "MIGHT", text: "+25% damage on every attack and move.", mods: { dmgMul: 0.25 } },
    iron:       { name: "Fair Plate",        tag: "IRON",  text: "+3 armor.", mods: { armorAdd: 3 } },
    heart:      { name: "Wellspring",        tag: "WELL",  text: "+25% maximum health.", mods: { hpMul: 0.25 } },
    haste:      { name: "Right-Time Hands",  tag: "HASTE", text: "+22% attack speed and move cooldowns −15%.", mods: { rateMul: 0.22, cdMul: -0.15 } },
    swift:      { name: "Path Stride",       tag: "STRIDE",text: "+18% move speed.", mods: { spdMul: 0.18 } },
    leech:      { name: "Drink the Cut",     tag: "LEECH", text: "Heal for 15% of all damage dealt.", mods: { leech: 0.15 } },
    thorns:     { name: "Bumper Thorn",      tag: "THORN", text: "Melee attackers take 30% of the damage back.", mods: { thorns: 0.30 } },
    regen:      { name: "Lattice Blood",     tag: "REGEN", text: "Regenerate 2.2 health a second.", mods: { regen: 2.2 } },
    veil:       { name: "Veil Step",         tag: "VEIL",  text: "18% of incoming attacks miss.", mods: { veil: 0.18 } },
    fury:       { name: "Fury Hour",         tag: "FURY",  text: "+45% damage once below 40% health.", mods: { fury: 0.45 } },
    laststand:  { name: "Second Wind",       tag: "GIFT",  text: "The first time you drop below 30%, heal 35% of maximum.", hook: "lastStand", mods: {} },
    warded:     { name: "Lattice Ward",      tag: "GIFT",  text: "Enter the arena under a shield worth 30% of maximum health.", mods: { startShield: 0.30 } },
    secondlife: { name: "Name Recall",       tag: "GIFT",  text: "Rise once more at 40% health after being cut down.", hook: "secondLife", mods: {} },
    pierce:     { name: "Truth Lens",        tag: "PIERCE",text: "Attacks carry through one extra body.", mods: { pierceAdd: 1 } },
    volley:     { name: "Open Volley",       tag: "VOLLEY",text: "+1 shot on every multi-shot move.", mods: { volleyAdd: 1 } },
    echo:       { name: "Echo Round",        tag: "ECHO",  text: "Every attack echoes for 40% after a beat.", mods: { echo: 0.40 } },
    bulwark:    { name: "Door Flesh",        tag: "BULWARK",text: "Take 22% less damage while above 60% health.", mods: { bulwark: 0.22 } },
    executioner:{ name: "Verdict Edge",      tag: "EXEC",  text: "+70% damage against targets below 32% health.", mods: { execute: 0.70 } },
    giant:      { name: "Deeper Well",       tag: "GIANT", text: "+40% maximum health, −12% move speed.", mods: { hpMul: 0.40, spdMul: -0.12 } },
    nimble:     { name: "Ember Step",        tag: "NIMBLE",text: "−15% maximum health, +25% move speed.", mods: { hpMul: -0.15, spdMul: 0.25 } },
    vampiric:   { name: "Cup of the Cut",    tag: "VAMP",  text: "Recover 22% of maximum health on every kill.", mods: { vamp: 0.22 } },
    manaflow:   { name: "Chorus Charge",     tag: "RES",   text: "+60% magic regeneration, +20% maximum magic.", mods: { manaMul: 0.60, manaMaxMul: 0.20, cdMul: -0.08 } },
    overclock:  { name: "Overclock",         tag: "CLOCK", text: "All move cooldowns −32%, −10% maximum health.", mods: { cdMul: -0.32, hpMul: -0.10 } },
    aegisgift:  { name: "A New Accord",      tag: "AURA",  text: "Allies gain +2 armor while you live.", mods: { auraArmor: 2 } },
    standard:   { name: "Hall Standard",     tag: "AURA",  text: "Allies deal +12% damage while you live.", mods: { auraDmg: 0.12 } },
    focus:      { name: "Named Pulse",       tag: "FOCUS", text: "Your first move of the fight hits for double.", mods: { firstDouble: 1 } },
    lucky:      { name: "Tithe Sense",       tag: "LUCK",  text: "+18% critical chance.", mods: { critAdd: 0.18 } },
    brutal:     { name: "Rift Edge",         tag: "BRUTAL",text: "Critical hits strike for +80% instead of +50%.", mods: { critMulAdd: 0.30 } },
    cleanse:    { name: "Unwrite Ink",       tag: "CLEANSE",text: "Shrug off the first stun, root or silence laid on you.", hook: "cleanse", mods: {} }
  };

  /* ---------------------------------------------------------------- moves ---
     shape:  melee  instant, single target in reach
             arc    inst>ant cone in front (hits every enemy inside)
             aura   instant, everything around the caster
             bolt   one travelling shot
             multi  n travelling shots, fanned
             lob    travelling shot that clears walls, blasts where it lands
             beam   instant line through everything up to reach
             blast  instant burst on the chosen point
             self / allies / revive / summon / none
     st:     statuses laid on whatever the shape reaches */
  const MOVES = {
    /* --- champions ------------------------------------------------------- */
    rend:      { name: "Rend",           text: "Tear the nearest foe and leave it bleeding.", cd: 7,  range: 2.1, aim: "enemy",  shape: "arc",  dmg: 1.35, fx: "hit_shard", st: { bleed: [10, 5] } },
    shieldwall:{ name: "Shield Wall",    text: "Raise the door: shield yourself and pull every eye onto you.", cd: 15, range: 0, aim: "self", shape: "self", st: { aegis: 0.35, taunt: 4 } },
    charge:    { name: "Squire's Charge",text: "Close the gap in one stride and strike on arrival.",   cd: 7,  range: 9, aim: "enemy", shape: "blink", dmg: 1.1, fx: "hit_shard" },
    cover:     { name: "Cover",          text: "Throw a shield over the ally in the worst shape.",      cd: 11, range: 9, aim: "allylow", shape: "ally", st: { aegis: 0.34 } },
    bulwark:   { name: "Bulwark",        text: "Harden the whole line: nearby allies gain armor.",      cd: 17, range: 6, aim: "allies", shape: "allies", st: { armor: [3, 8] } },
    unwrite:   { name: "Unwrite",        text: "A blast that eats shields and hits them twice as hard.",cd: 8,  range: 8, aim: "enemy", shape: "blast", dmg: 1.5, radius: 2.0, fx: "hit_halo", strips: true },
    resonance: { name: "Resonance Flask",text: "Break a flask of names: burst plus a weakness.",        cd: 13, range: 8, aim: "clump", shape: "blast", dmg: 1.2, radius: 2.4, fx: "nova", st: { weak: [0.25, 6] } },
    dash:      { name: "Dash",           text: "A burst of Swift — the corridor shortens.",             cd: 6,  range: 0, aim: "self", shape: "self", st: { swift: [0.35, 3] } },
    pinvolley: { name: "Pinning Volley", text: "Three arrows that root whatever they find.",            cd: 11, range: 9, aim: "enemy", shape: "multi", n: 3, dmg: 0.75, w: "needle", st: { root: 1.6 } },
    hymn:      { name: "Hymn",           text: "The song the crypt cannot erase: stuns everything near.",cd: 14, range: 5.5, aim: "self", shape: "aura", dmg: 0.5, radius: 5.5, fx: "nova", st: { stun: 1.3 } },
    chorus:    { name: "Spiral Chorus",  text: "Mend the line and hurry it along.",                     cd: 15, range: 7, aim: "allies", shape: "allies", st: { heal: 0.18, haste: [0.25, 6] } },
    geodesic:  { name: "Geodesic",       text: "Lob the shortest true line over the stone, then blast.",cd: 10, range: 10, aim: "clump", shape: "lob", dmg: 1.45, radius: 2.2, w: "comet", fx: "nova" },
    trueline:  { name: "True Line",      text: "A spear of the shortest true line — it ignores armor.", cd: 12, range: 9, aim: "enemy", shape: "beam", dmg: 1.6, ignoreArmor: true, fx: "hit_needle" },
    shockwave: { name: "Shockwave",      text: "Slam the floor: everything in reach is thrown back.",   cd: 9,  range: 0, aim: "self", shape: "aura", dmg: 1.1, radius: 3.4, fx: "nova", st: { knock: 2.4, stun: 0.4 } },
    wolffury:  { name: "Wolf Fury",      text: "Fists first: rage and drink what you cut.",             cd: 18, range: 0, aim: "self", shape: "self", st: { rage: [0.4, 8], lifesteal: [0.35, 8] } },
    doublespeak:{ name: "Doublespeak",   text: "You are already gone — veil, and the next cut doubles.",cd: 11, range: 0, aim: "self", shape: "self", st: { veil: [0.55, 5], rage: [0.8, 3] } },
    needlerain:{ name: "Needle Rain",    text: "A spread of needles that pass one body each.",          cd: 14, range: 9, aim: "enemy", shape: "multi", n: 5, dmg: 0.6, w: "needle", pierce: 1 },
    righttime: { name: "Right-Time",     text: "Warp the hour: foes slow, you hurry.",                  cd: 12, range: 8, aim: "clump", shape: "blast", dmg: 0.8, radius: 2.6, fx: "nova", st: { slow: [0.45, 5] }, selfSt: { swift: [0.3, 5] } },
    borrow:    { name: "Borrowed Second",text: "Spend a second as a key: every cooldown resets.",       cd: 24, range: 0, aim: "self", shape: "self", st: { cdReset: 1, haste: [0.3, 6] } },
    fairplate: { name: "Fair Plate",     text: "Fairness as plate: reflect and thorn up.",              cd: 14, range: 0, aim: "self", shape: "self", st: { reflect: [0.45, 6], thorns: [0.35, 6] } },
    verdict:   { name: "Verdict",        text: "Strike where the plate is already cracked.", cd: 12, range: 2.4, aim: "weakest", shape: "melee", dmg: 1.3, execute: true, fx: "hit_shard" },
    current:   { name: "Current",        text: "The tide behind the line: allies hurry and stride.",    cd: 13, range: 7, aim: "allies", shape: "allies", st: { haste: [0.3, 7], swift: [0.2, 7] } },
    undertow:  { name: "Undertow",       text: "Drag them in and slow what has no footing.",            cd: 15, range: 7, aim: "clump", shape: "aura", atRange: true, radius: 3.2, dmg: 0.7, fx: "nova", st: { pull: 3.2, slow: [0.4, 4] } },
    chorusflask:{ name: "Chorus Flask",  text: "One drink, four pulses: the whole line heals.",         cd: 13, range: 7, aim: "allies", shape: "allies", st: { heal: 0.24 } },
    weavebloom:{ name: "Weave Bloom",    text: "Plant a bloom of regrowth under your team.",            cd: 16, range: 7, aim: "allies", shape: "allies", st: { regen: [6.5, 6] } },
    seal9:     { name: "Δ9 Seal",        text: "The architect's seal: stuns the room, shields his own.", cd: 20, range: 6, aim: "self", shape: "aura", dmg: 0.9, radius: 6, fx: "nova", st: { stun: 0.9 }, selfSt: { aegis: 0.18, heal: 0.06 } },
    provenance:{ name: "Provenance",     text: "Remember the name: a fallen ally rises again.",          cd: 40, range: 30, aim: "deadally", shape: "revive", heal: 0.30 },

    /* --- creatures ------------------------------------------------------- */
    wail:      { name: "Wail",           text: "A thin cry that weakens what hears it and nails its feet down.", cd: 12, range: 6, aim: "self", shape: "aura", dmg: 0.6, radius: 6, fx: "nova", st: { weak: [0.3, 6], root: 0.9, wound: [0.3, 4] } },
    pound:     { name: "Ground Pound",   text: "Both fists down: the floor answers.",                    cd: 10, range: 0, aim: "self", shape: "aura", dmg: 1.15, radius: 3.0, fx: "nova", st: { knock: 2.0, stun: 0.5 } },
    impfire:   { name: "Imp Fire",       text: "A coal of ember that burns and leaves them limping.",   cd: 8,  range: 8, aim: "enemy", shape: "bolt", dmg: 1.2, w: "cinder", st: { burn: [6, 4], slow: [0.4, 4], wound: [0.35, 4] } },
    lobstone:  { name: "Lob Stone",      text: "Hurled over the walls. It does not need a line.",        cd: 9,  range: 11, aim: "clump", shape: "lob", dmg: 1.4, radius: 2.2, w: "hurler", fx: "nova" },
    flicker:   { name: "Flicker",        text: "Blink through the stone, hard to hold — and arrive before they are ready.", cd: 8, range: 8, aim: "enemy", shape: "blink", st: { stun: 0.55 }, selfSt: { veil: [0.6, 4] } },
    snatch:    { name: "Snatch",         text: "Steal the cut — and the stride — and drink it.",        cd: 9,  range: 2.0, aim: "enemy", shape: "melee", dmg: 1.3, drain: 0.75, fx: "hit_needle", st: { slow: [0.35, 3], weak: [0.15, 4], wound: [0.35, 3] } },
    unmake:    { name: "Unmake",         text: "Silence a name mid-sentence and hold it there while it burns.", cd: 13, range: 2.2, aim: "weakest", shape: "melee", dmg: 1.55, fx: "hit_halo", st: { silence: 4, burn: [7, 5], root: 1.1, wound: [0.45, 5] } },
    gateslam:  { name: "Gate Slam",      text: "The gate answers. Nothing near it keeps its footing.",  cd: 11, range: 0, aim: "self", shape: "aura", dmg: 1.5, radius: 3.6, fx: "nova", st: { stun: 1.0, knock: 2.2 } },
    wardfield: { name: "Ward Field",     text: "The crypt closes its ward around the gate.",             cd: 16, range: 0, aim: "self", shape: "self", st: { aegis: 0.4, thorns: [0.4, 6] } },
    /* The Heart is the biggest body in the roster, so the shared plate scaled into the
       biggest shield in the game: 0.4 of 1320 is 528, and at 68% absorption that is still a
       full fight worth of nullification every sixteen seconds. He gets his own, smaller. */
    cryptward: { name: "Crypt Ward",     text: "The beat puts a ward on everything that shares its blood.", cd: 18, range: 0, aim: "self", shape: "self", st: { aegis: 0.22, thorns: [0.25, 5] } },
    gateward:  { name: "Gate Ward",      text: "The door sets a ward. It is a pause, not a second life.", cd: 18, range: 0, aim: "self", shape: "self", st: { aegis: 0.16, thorns: [0.2, 5] } },
    callwards: { name: "Call the Wards", text: "Two wardens step out of the dark.",                     cd: 22, range: 0, aim: "self", shape: "summon", n: 2, token: "ward" },
    regalvolley:{ name: "Regal Volley",  text: "A crown's three shells, lobbed wide.",                   cd: 10, range: 10, aim: "clump", shape: "multi", n: 3, dmg: 0.9, lob: true, radius: 1.4, w: "comet", fx: "nova" },
    anvil:     { name: "Anvil",          text: "Bring the anvil down and let the coal do the rest.",     cd: 11, range: 2.4, aim: "enemy", shape: "blast", dmg: 1.4, radius: 2.0, fx: "hit_cinder", st: { burn: [8, 5] } },
    standard:  { name: "Standard Raised", text: "Plants the standard: the line mends and moves quicker.", cd: 16, range: 6, aim: "allies", shape: "allies", st: { heal: 0.15, haste: [0.2, 5] } },
    temperwork:{ name: "Temper Work",     text: "The smith re-tempers what the fight has bent.",        cd: 17, range: 6, aim: "allies", shape: "allies", st: { heal: 0.16, haste: [0.15, 4] } },
    heartbeat: { name: "Heartbeat",      text: "The heart of the crypt beats: it mends its own.",        cd: 12, range: 6, aim: "allies", shape: "allies", st: { heal: 0.20 } },
    tidecrush: { name: "Tide Crush",     text: "The depth takes the room and drags it in.",              cd: 14, range: 6, aim: "clump", shape: "aura", atRange: true, radius: 3.4, dmg: 1.2, fx: "nova", st: { pull: 3.6, slow: [0.35, 4] } },
    tithe:     { name: "Tithe",          text: "The tithe-king is paid in what you were saving.",        cd: 12, range: 2.2, aim: "enemy", shape: "melee", dmg: 1.2, drain: 0.6, fx: "hit_needle", st: { weak: [0.22, 5], wound: [0.3, 5] } },
    nameless:  { name: "Nameless",       text: "Names go where it looks.",                               cd: 15, range: 8, aim: "clump", shape: "blast", dmg: 1.3, radius: 2.8, fx: "hit_halo", st: { silence: 5 } },
    lockseal:  { name: "The Lock Seals", text: "The whole arena is the door and it is closing.",         cd: 18, range: 0, aim: "self", shape: "aura", dmg: 1.35, radius: 4.4, fx: "nova", st: { stun: 1.2, burn: [9, 5] } },
    gatecannon:{ name: "Gate Cannon",    text: "A shell of cold light from the gate itself.",            cd: 12, range: 10, aim: "enemy", shape: "beam", dmg: 1.5, fx: "hit_cinder" },

    /* --- the pack -------------------------------------------------------- */
    bite:      { name: "Pack Bite",      text: "Dash in and hamstring — the pack is faster than you.",  cd: 7,  range: 8, aim: "weakest", shape: "blink", dmg: 1.2, fx: "hit_needle", st: { root: 1.2, wound: [0.45, 4] } },
    roar:      { name: "Roar",           text: "A roar that shakes the line and throws it back off its feet.", cd: 12, range: 5.5, aim: "self", shape: "aura", dmg: 0.8, radius: 5.5, fx: "nova", st: { weak: [0.25, 5], knock: 1.8 } },
    soljump:   { name: "Solstride",      text: "A long leap onto the one already hurt.", cd: 8, range: 10, aim: "weakest", shape: "blink", dmg: 1.25, fx: "hit_shard" },
    maul:      { name: "Maul",           text: "Ironhide comes down on everything in reach.",            cd: 11, range: 0, aim: "self", shape: "aura", dmg: 1.2, radius: 2.8, fx: "nova", st: { knock: 1.4 } },
    stomp:     { name: "Stomp",          text: "The ground answers the tusk.",                           cd: 12, range: 0, aim: "self", shape: "aura", dmg: 1.1, radius: 3.2, fx: "nova", st: { stun: 0.8 } },
    clamp:     { name: "Glassbarb Clamp",text: "A clamp of glass barb and a tail you did not see.",      cd: 9,  range: 2.0, aim: "enemy", shape: "melee", dmg: 1.3, fx: "hit_needle", st: { burn: [5, 4] } },

    /* One committed step on a flat clock. build() renames it Close or Slip.
       cost is mana, not cd * 1.1 — a 30s button must stay pressable on a small pool.
       The engine ignores cdMul on this shape so the clock stays thirty seconds. */
    stride:    { name: "Stride", text: "One committed step. Fists close the gap. Guns take the step back. Thirty seconds before it is yours again.", cd: 30, cost: 8, range: 7, aim: "enemy", shape: "stride", vis: "charge", sfx: "cast" },
    /* --- closers for the ten that had none -------------------------------------
       The audit that started this: the 18 contact kits reach 45-51px, the guns they
       are sent against reach 256-275px, there is no cover left, and the kiter walks
       faster than the fist -- so a contact kit with no way in is a body sent at rifles
       with a walk. The heavy ones (bulwark, artillery; speed 1.6-2.0) cannot chase, so
       they DRAG: a pull is the stronger closer of the two because it works on a body
       already running away, so it sits on the longer clock. The fast ones (hunter,
       vanguard, rush) run the prey down with a blink, and the landing sticks for a beat
       -- the slight edge the style is built around. */
    gate_haul:  { name: "Gate Haul",         text: "The gate does not come to you. The gate decides.", cd: 8, range: 6.0, aim: "enemy", shape: "blast", dmg: 0.6, fx: "nova", st: { pull: 3.1, slow: [0.35, 3] } },
    decree:     { name: "Decree",            text: "The crown does not chase. It summons.", cd: 8, range: 6.5, aim: "enemy", shape: "blast", dmg: 0.6, fx: "nova", st: { pull: 3.1, slow: [0.35, 3] } },
    maulgrip:   { name: "Maul Grip",         text: "It takes your feet out and holds you where it wants you.", cd: 8, range: 5.5, aim: "enemy", shape: "blast", dmg: 0.6, fx: "nova", st: { pull: 3.1, slow: [0.35, 3] } },
    shieldhook: { name: "Shield Hook",       text: "The shield's edge catches and turns you into her reach.", cd: 8, range: 5.5, aim: "enemy", shape: "blast", dmg: 0.6, fx: "nova", st: { pull: 3.1, slow: [0.35, 3] } },
    irongrip:   { name: "Iron Grip",         text: "It reaches. The reach ends the argument.", cd: 8, range: 5.5, aim: "enemy", shape: "blast", dmg: 0.6, fx: "nova", st: { pull: 3.1, slow: [0.35, 3] } },
    gravstep:   { name: "Grave Step",        text: "It is behind you before the light changes.", cd: 7, range: 8.0, aim: "weakest", shape: "blink", dmg: 1.15, fx: "hit_shard", st: { slow: [0.3, 2.5] } },
    collection: { name: "Collection",        text: "The tithe is taken where it stands.", cd: 7, range: 8.0, aim: "weakest", shape: "blink", dmg: 1.15, fx: "hit_shard", st: { slow: [0.3, 2.5] } },
    tuskcharge: { name: "Tusk Charge",       text: "The whole weight arrives at once.", cd: 7, range: 9.0, aim: "enemy", shape: "blink", dmg: 1.15, fx: "hit_shard", st: { slow: [0.3, 2.5] } },
    cryptsurge: { name: "Crypt Surge",       text: "The floor carries it forward.", cd: 7, range: 8.0, aim: "enemy", shape: "blink", dmg: 1.15, fx: "hit_shard", st: { slow: [0.3, 2.5] } },
    writpursuit: { name: "Writ of Pursuit",   text: "The writ runs faster than the guilty.", cd: 7, range: 9.0, aim: "weakest", shape: "blink", dmg: 1.15, fx: "hit_shard", st: { slow: [0.3, 2.5] } },

  };

  /* tokens summoned into the arena (moves that call allies) */
  const TOKENS = {
    ward: { name: "Warden of the Gate", spr: { sheet: "creatures", key: "foe_wraith" }, hp: 170, dmg: 16, rate: 0.9, speed: 2.4, armor: 1, range: 7, atk: "bolt", w: "shard", class: "token", ttl: 22 }
  };

  /* ------------------------------------------------------------- fighters ---
     `counter` is the line the pick screen shows: what this kit eats and what eats it. */
  const F = [];
  function add(f) { F.push(f); }

  /* the thirteen champions -------------------------------------------------- */
  add({ id: "kael", name: "Kael", tag: "Gallant Blade", cls: "champ", spr: { sheet: "heroes", key: "hero_kael" }, portrait: "p-kael.jpg", color: "#ef4444",
    bio: "First tooth of the lock. Would not drop the door when the first circle went dark.",
    style: "vanguard", tune: { band: 1.0, leash: 170, commit: 1.5, strafe: 0.3, retreat: 0 }, temper: "Walks in first and does not look back for permission.",
    hp: 805, dmg: 30, rate: 0.80, speed: 3.1, armor: 6, range: 1.5, mana: 70, manaRegen: 5, crit: 0.20, cdMul: 0.86,
    atk: { name: "Shard Volley", type: "bolt", w: "shard" },
    moves: ["rend", "shieldwall", "charge"], cards: ["might", "iron", "vampiric"],
    counter: "Holds a line. Melted by artillery that never lets him close." });

  add({ id: "vale", name: "Vale", tag: "Aegis Knight", cls: "champ", spr: { sheet: "heroes", key: "hero_vale" }, portrait: "p-vale.jpg", color: "#22d3ee",
    bio: "Plate of the second circle. She learned to stand still so others could move.",
    style: "bulwark", tune: { band: 0.95, leash: 85, commit: 2.2, strafe: 0.1 }, temper: "Picks the spot nobody else will hold, and holds it.",
    hp: 895, dmg: 26, rate: 0.72, speed: 3.3, armor: 8, range: 1.6, mana: 60, manaRegen: 4, crit: 0.15, cdMul: 0.82,
    atk: { name: "Cleave", type: "melee", w: "shard", splash: 1.4 },
    moves: ["cover", "bulwark", "shieldwall", "shieldhook"], cards: ["bulwark", "thorns", "iron"],
    counter: "The wall of the roster. Kills nothing fast — punishes anything that tries." });

  add({ id: "orin", name: "Orin", tag: "Black Sigil", cls: "champ", spr: { sheet: "heroes", key: "hero_orin" }, portrait: "p-orin.jpg", color: "#fbbf24",
    bio: "A chemist of names. Glass is cheaper than a forgotten friend.",
    style: "artillery", tune: { band: 1.0, panic: 165, commit: 1.0, strafe: 0.45 }, temper: "Keeps the whole fight at arm's length and lets it come to him.",
    hp: 600, dmg: 34, rate: 0.86, speed: 2.9, armor: 2, range: 8.2, mana: 150, manaRegen: 12, crit: 0.12, cdMul: 0.78,
    atk: { name: "Sigil Shard", type: "bolt", w: "shard" },
    moves: ["unwrite", "resonance", "chorusflask"], cards: ["might", "focus", "manaflow"],
    counter: "Eats shields. Dies to anything that reaches him." });

  add({ id: "nia", name: "Nia", tag: "Path Archer", cls: "champ", spr: { sheet: "heroes", key: "hero_nia" }, portrait: "p-nia.jpg", color: "#4ade80",
    bio: "She maps the corridors by running them. A slow warden is a closed door.",
    style: "kite", tune: { band: 0.95, panic: 140, retreat: 0.3, strafe: 1.1, commit: 0.6 }, temper: "Never stands where the last shot landed.",
    hp: 707, dmg: 27, rate: 0.92, speed: 4.4, armor: 4, range: 8.6, mana: 70, manaRegen: 6, crit: 0.22, cdMul: 0.84,
    atk: { name: "Path Arrow", type: "bolt", w: "needle", pierce: 1 },
    moves: ["pinvolley", "dash", "needlerain"], cards: ["swift", "lucky", "volley"],
    counter: "Fastest feet in the arena. Rooted once and she is only an archer." });

  add({ id: "lyra", name: "Lyra", tag: "Spiral Bard", cls: "champ", spr: { sheet: "heroes", key: "hero_lyra" }, portrait: "p-lyra.jpg", color: "#67e8f9",
    bio: "Seat of spiral memory. The crypt cannot erase a song it has heard.",
    style: "medic", tune: { band: 0.82, leash: 200, retreat: 0.45, strafe: 0.7 }, temper: "Watches who is bleeding before she watches who is winning.",
    hp: 645, dmg: 28, rate: 0.84, speed: 3.4, armor: 3, range: 7.8, mana: 135, manaRegen: 11, crit: 0.16, cdMul: 0.76,
    atk: { name: "Spiral Note", type: "bolt", w: "halo" },
    moves: ["hymn", "chorus", "weavebloom"], cards: ["manaflow", "regen", "standard"],
    counter: "Stuns a crowd and heals a crowd. No burst at all." });

  add({ id: "arkos", name: "Arkos", tag: "Lattice Lancer", cls: "champ", spr: { sheet: "heroes", key: "hero_arkos" }, portrait: "p-arkos.jpg", color: "#2dd4bf",
    bio: "The spear is a geodesic: the shortest true line through a lie.",
    style: "duelist", tune: { band: 0.9, commit: 1.6, strafe: 0.95 }, temper: "One name, one line, until one of them is finished.",
    hp: 918, dmg: 35.34, rate: 0.78, speed: 3.2, armor: 10, range: 1.9, mana: 80, manaRegen: 6, crit: 0.18, cdMul: 0.84,
    atk: { name: "Lance Thrust", type: "melee", w: "shard", reach: 1.9 },
    moves: ["geodesic", "trueline", "dash"], cards: ["pierce", "might", "nimble"],
    counter: "Ignores walls and armor. Weak to being swarmed." });

  add({ id: "d9ra", name: "D9ra", tag: "Wolf Monk", cls: "champ", spr: { sheet: "heroes", key: "hero_d9ra" }, portrait: "p-d9ra.jpg", color: "#f87171",
    bio: "Wolf-edge of the council. Fists first. The crypt respects what will not flinch.",
    style: "berserker", tune: { band: 0.55, commit: 1.5, strafe: 0.35 }, temper: "Wants it close and wants it now.",
    hp: 830, dmg: 38, rate: 0.88, speed: 3.8, armor: 5, range: 1.4, mana: 50, manaRegen: 4, crit: 0.24, cdMul: 0.88,
    atk: { name: "Wolf Fist", type: "melee", w: "shard" },
    moves: ["shockwave", "wolffury", "charge"], cards: ["fury", "brutal", "leech"],
    counter: "Highest damage per second on the roster. No answer at range." });

  add({ id: "srath", name: "Srath", tag: "Shadow Needle", cls: "champ", spr: { sheet: "heroes", key: "hero_srath" }, portrait: "p-srath.jpg", color: "#86efac",
    bio: "Sentinel of doublespeak. She steals the vial back before the thief knows it left.",
    style: "skirmish", tune: { band: 0.85, recoil: 1.2, retreat: 0.35, strafe: 1.15 }, temper: "Touches you once, then is somewhere else entirely.",
    hp: 550, dmg: 29, rate: 0.90, speed: 4.2, armor: 2, range: 7.6, mana: 80, manaRegen: 7, crit: 0.20, cdMul: 0.82,
    atk: { name: "Needle", type: "bolt", w: "needle", pierce: 2 },
    moves: ["doublespeak", "needlerain", "dash"], cards: ["veil", "lucky", "echo"],
    counter: "Hard to hit, hits through a line. The softest body in the roster." });

  add({ id: "kairos", name: "Kairos", tag: "Hour Mage", cls: "champ", spr: { sheet: "heroes", key: "hero_kairos" }, portrait: "p-kairos.jpg", color: "#c4b5fd",
    bio: "Keeper of right-time. A vial in his hand is also a door.",
    style: "controller", tune: { band: 0.95, strafe: 1.25, commit: 0.8 }, temper: "Slows the room down until the room belongs to him.",
    hp: 600, dmg: 33, rate: 0.82, speed: 3.3, armor: 2, range: 8.4, mana: 155, manaRegen: 13, crit: 0.14, cdMul: 0.74,
    atk: { name: "Hour Bolt", type: "bolt", w: "halo" },
    moves: ["righttime", "borrow", "seal9"], cards: ["haste", "manaflow", "overclock"],
    counter: "Slows the whole arena and never runs out of cooldowns. Thin as paper." });

  add({ id: "justicae", name: "Justicae", tag: "Accord Knight", cls: "champ", spr: { sheet: "heroes", key: "hero_justicae" }, portrait: "p-justicae.jpg", color: "#e2e8f0",
    bio: "Fairness as plate. She will not open a seal that would crush the unnamed.",
    style: "hunter", tune: { band: 0.9, commit: 1.9, strafe: 0.5 }, temper: "Hunts whatever is already carrying a wound.",
    hp: 1049, dmg: 27, rate: 0.74, speed: 3.0, armor: 11, range: 1.7, mana: 90, manaRegen: 6, crit: 0.17, cdMul: 0.80,
    atk: { name: "Accord Blade", type: "melee", w: "shard" },
    moves: ["fairplate", "verdict", "bulwark", "writpursuit"], cards: ["executioner", "bulwark", "thorns"],
    counter: "Reflects everything thrown at her and finishes what is already hurt." });

  add({ id: "seidon", name: "Seidon", tag: "Tide Seer", cls: "champ", spr: { sheet: "heroes", key: "hero_seidon" }, portrait: "p-seidon.jpg", color: "#22d3ee",
    bio: "Depth and current. Gates listen to him because the lattice learned to drink.",
    style: "controller", tune: { band: 0.98, strafe: 0.9, commit: 1.0, retreat: 0.18 }, temper: "Waits for them to stand together, then takes the whole group.",
    hp: 725, dmg: 30, rate: 0.80, speed: 3.5, armor: 5, range: 8.0, mana: 120, manaRegen: 10, crit: 0.15, cdMul: 0.78,
    atk: { name: "Tide Bolt", type: "bolt", w: "halo", nova: 1.1 },
    moves: ["undertow", "current", "geodesic"], cards: ["standard", "manaflow", "warded"],
    counter: "Drags a team out of position. Wants a crowd, does badly alone." });

  add({ id: "sancora", name: "Sancora", tag: "Weave Chemist", cls: "champ", spr: { sheet: "heroes", key: "hero_sancora" }, portrait: "p-sancora.jpg", color: "#fde68a",
    bio: "Collective healing nexus. Her flask is a chorus: one drink, four pulses.",
    style: "medic", tune: { band: 0.8, leash: 175, retreat: 0.5, strafe: 0.45 }, temper: "Follows whoever is hurt most and pours them back together.",
    hp: 580, dmg: 28, rate: 0.78, speed: 3.2, armor: 4, range: 8.0, mana: 145, manaRegen: 13, crit: 0.13, cdMul: 0.72,
    atk: { name: "Chemist Vial", type: "bolt", w: "cinder", nova: 1.0 },
    moves: ["chorusflask", "weavebloom", "cover"], cards: ["regen", "giant", "aegisgift"],
    counter: "Keeps four bodies standing. Brings no damage of her own." });

  add({ id: "lightfather", name: "Lightfather", tag: "Architect · Δ9", cls: "champ", spr: { sheet: "heroes", key: "hero_lightfather" }, portrait: "p-lightfather.jpg", color: "#fbbf24",
    bio: "He does not replace the four teeth — he remembers why the door was cut.",
    style: "vanguard", tune: { band: 0.92, leash: 140, commit: 1.3, strafe: 0.4 }, temper: "Stands a step in front of his own and remembers who fell.",
    hp: 660, dmg: 27, rate: 0.84, speed: 3.4, armor: 4, range: 8.0, mana: 160, manaRegen: 10, crit: 0.19, cdMul: 0.82,
    atk: { name: "Seal Bolt", type: "bolt", w: "halo" },
    moves: ["seal9", "provenance", "cover", "standard"], cards: ["standard", "secondlife", "warded"],
    counter: "Raises the dead and shuts a room down. Slow to come online." });

  /* the fifteen creatures --------------------------------------------------- */
  add({ id: "wraith", name: "Wraith", tag: "Crypt Fodder", cls: "beast", spr: { sheet: "creatures", key: "foe_wraith" }, color: "#c4b5fd",
    bio: "The crypt's first draft of a soldier. It throws what it has no hand for.",
    style: "kite", tune: { band: 0.9, panic: 130, retreat: 0.2, strafe: 0.55, commit: 0.75 }, temper: "Drifts at the edge of the fight and throws from there.",
    hp: 650, dmg: 31, rate: 0.86, speed: 2.6, armor: 4, range: 8.0, mana: 60, manaRegen: 7, crit: 0.10, cdMul: 0.88, ghost: true,
    atk: { name: "Wraith Bolt", type: "bolt", w: "shard" },
    moves: ["wail", "draincloud"], cards: ["haste", "nimble", "leech"],
    counter: "Cheap ranged bodies that nail your feet down. Two are a headache, five are a wall." });
  MOVES.draincloud = { name: "Drain Cloud", text: "A cloud of unwriting — it hurts, it stays, and everything in it wades.", cd: 12, range: 7, aim: "clump", shape: "blast", dmg: 1.05, radius: 2.4, fx: "hit_halo", st: { burn: [6, 5], slow: [0.4, 5] } };

  add({ id: "brute", name: "Brute", tag: "Crypt Fodder", cls: "beast", spr: { sheet: "creatures", key: "foe_brute" }, color: "#94a3b8",
    bio: "Slow, wide and certain. It walks the shortest path to whatever it was told to want.",
    style: "bulwark", tune: { band: 0.9, leash: 55, commit: 2.4, strafe: 0.05 }, temper: "Picks a doorway and becomes one.",
    hp: 805, dmg: 34, rate: 0.66, speed: 2.0, armor: 6, range: 1.5, mana: 40, manaRegen: 3, crit: 0.08, cdMul: 0.92,
    atk: { name: "Heavy Sweep", type: "melee", w: "shard", splash: 1.5 },
    moves: ["pound", "wardfield", "irongrip"], cards: ["iron", "giant", "thorns"],
    counter: "Soaks a lane. Outrun and outranged by nearly everyone." });

  add({ id: "imp", name: "Imp", tag: "Crypt Fodder", cls: "beast", spr: { sheet: "creatures", key: "foe_imp" }, color: "#fb923c",
    bio: "Fast, small, and holding a coal it intends to give you.",
    style: "skirmish", tune: { band: 0.8, recoil: 0.9, strafe: 0.95 , retreat: 0.38}, temper: "In, a coal, out — before the swing finishes.",
    hp: 724, dmg: 34.8, rate: 1.01, speed: 2.9, armor: 6, range: 7.4, mana: 60, manaRegen: 8, crit: 0.12, cdMul: 0.86,
    atk: { name: "Ember Spit", type: "bolt", w: "cinder" },
    moves: ["impfire", "flicker"], cards: ["swift", "lucky", "nimble"],
    counter: "Fast, burns, and leaves you limping after it. Still dies to one good hit." });

  add({ id: "hurler", name: "Hurler", tag: "Crypt Artillery", cls: "beast", spr: { sheet: "creatures", key: "foe_hurler" }, color: "#a3a3a3",
    bio: "It never wants a line of sight. The stone goes over the wall or not at all.",
    style: "artillery", tune: { band: 1.0, panic: 175, commit: 0.9, strafe: 0.15 }, temper: "Hurls from the back of the ring, then wades in to finish what it started.",
    hp: 815, dmg: 33, rate: 0.72, speed: 2.4, armor: 5, range: 5.6, mana: 70, manaRegen: 6, crit: 0.10, cdMul: 0.9,
    atk: { name: "Stone Toss", type: "bolt", w: "shard" },
    moves: ["lobstone", "pound"], cards: ["might", "bulwark", "giant"],
    counter: "Hits the back line from behind stone. Helpless up close." });

  add({ id: "shade", name: "Shade", tag: "Veilkin", cls: "beast", spr: { sheet: "creatures", key: "foe_shade" }, color: "#818cf8",
    bio: "It is in two places and only one of them is real.",
    style: "assassin", tune: { band: 0.7, strafe: 1.3, commit: 1.0 , retreat: 0.36}, temper: "Looks for the softest body in the enemy line and starts there.",
    hp: 781, dmg: 35, rate: 0.92, speed: 3.2, armor: 5, range: 1.6, mana: 60, manaRegen: 7, crit: 0.16, cdMul: 0.82, ghost: true,
    atk: { name: "Shade Claw", type: "melee", w: "needle" },
    moves: ["flicker", "snatch"], cards: ["veil", "leech", "nimble"],
    counter: "Blinks onto you before you are ready and out again. Fragile when caught in a corner." });

  add({ id: "thief", name: "Thief", tag: "Tithe-Thief", cls: "beast", spr: { sheet: "creatures", key: "foe_thief" }, color: "#facc15",
    bio: "It takes the vial, the coin, and the courage, and is gone before the roll.",
    style: "skirmish", tune: { band: 0.72, recoil: 1.5, strafe: 1.4 , retreat: 0.34}, temper: "Takes one cut and leaves; the leaving is the trick.",
    hp: 790, dmg: 36, rate: 1.05, speed: 3.6, armor: 6, range: 1.6, mana: 50, manaRegen: 6, crit: 0.20, cdMul: 0.8,
    atk: { name: "Quick Stab", type: "melee", w: "needle" },
    moves: ["snatch", "flicker"], cards: ["swift", "vampiric", "lucky"],
    counter: "The fastest creature alive — it takes your stride with your coin. Never wins a stand-up fight." });

  add({ id: "drain", name: "Drain", tag: "The Unwriting", cls: "beast", spr: { sheet: "creatures", key: "foe_drain" }, color: "#7c3aed",
    bio: "It does not kill you. It takes the sentence you were in.",
    style: "rush", tune: { band: 0.6, commit: 1.25, strafe: 0.35 }, temper: "Walks into your face because it eats the contact.",
    hp: 875, dmg: 37, rate: 0.78, speed: 2.9, armor: 7, range: 2.0, mana: 90, manaRegen: 8, crit: 0.12, cdMul: 0.88, ghost: true,
    atk: { name: "Drain Touch", type: "melee", w: "halo", drain: 0.35 },
    moves: ["unmake", "draincloud", "gravstep"], cards: ["leech", "regen", "might"],
    counter: "Heals off everything it touches and holds it in place while it does. Bring armor and burst." });

  add({ id: "gate", name: "Gate", tag: "Nexus Guardian", cls: "beast", spr: { sheet: "creatures", key: "foe_gate" }, color: "#38bdf8",
    bio: "Half door, half animal, entirely unwilling.",
    style: "bulwark", tune: { band: 0.95, leash: 120, commit: 2.6, strafe: 0.05 }, temper: "Everything it does happens slowly, on purpose.",
    hp: 1020, dmg: 40, rate: 0.60, speed: 1.6, armor: 7, range: 1.9, mana: 80, manaRegen: 5, crit: 0.08, cdMul: 0.94, boss: true,
    atk: { name: "Gate Slam", type: "melee", w: "shard", splash: 1.7 },
    moves: ["gateslam", "gateward", "callwards", "gate_haul"], cards: ["iron", "thorns", "giant"],
    counter: "The anvil of the roster. Everything it does happens slowly." });

  add({ id: "crown", name: "Crown", tag: "Nexus Guardian", cls: "beast", spr: { sheet: "creatures", key: "foe_crown" }, color: "#fbbf24",
    bio: "It wears the floor it was built on and lobs the rest at you.",
    style: "artillery", tune: { band: 1.0, panic: 185, commit: 1.7, strafe: 0.3 }, temper: "Bombards the ring, and answers with a closed fist when you cross it.",
    hp: 1125, dmg: 36, rate: 0.62, speed: 1.9, armor: 6, range: 1.8, mana: 110, manaRegen: 9, crit: 0.10, cdMul: 0.9, boss: true,
    atk: { name: "Regal Fist", type: "melee", w: "shard" },
    moves: ["regalvolley", "lobstone", "decree"], cards: ["might", "bulwark", "heart"],
    counter: "Bombards a whole team from behind cover. Needs its own cover gone." });

  add({ id: "smith", name: "Smith", tag: "Nexus Guardian", cls: "beast", spr: { sheet: "creatures", key: "foe_smith" }, color: "#f97316",
    bio: "It forges in the dark. What it makes is mostly for you.",
    style: "artillery", tune: { band: 1.0, panic: 155, commit: 1.15, strafe: 0.5 }, temper: "One enormous hit, then the wait.",
    hp: 1175, dmg: 42, rate: 0.64, speed: 1.7, armor: 7, range: 7.8, mana: 100, manaRegen: 8, crit: 0.11, cdMul: 0.9, boss: true,
    atk: { name: "Forge Bolt", type: "bolt", w: "cinder" },
    moves: ["anvil", "gatecannon", "temperwork"], cards: ["might", "brutal", "iron"],
    counter: "Highest single-hit damage on the roster. Slow as a workbench." });

  add({ id: "heartboss", name: "Heart of the Crypt", tag: "Nexus Guardian", cls: "beast", spr: { sheet: "creatures", key: "foe_heartboss" }, color: "#ef4444",
    bio: "Ten thousand feet of the crypt, and it beats.",
    style: "vanguard", tune: { band: 0.95, leash: 95, commit: 1.6, strafe: 0.2, retreat: 0.1 }, temper: "Mends its own in the middle of the brawl.",
    hp: 1320, dmg: 38, rate: 0.68, speed: 2.0, armor: 7, range: 1.8, mana: 90, manaRegen: 7, crit: 0.09, cdMul: 0.92, boss: true,
    atk: { name: "Heart Strike", type: "melee", w: "shard", splash: 1.6 },
    moves: ["heartbeat", "cryptward", "cryptsurge"], cards: ["giant", "regen", "vampiric"],
    counter: "Heals its own team while it fights. Kill it first or not at all." });

  add({ id: "levi", name: "Leviathan", tag: "Nexus Guardian", cls: "beast", spr: { sheet: "creatures", key: "foe_levi" }, color: "#22d3ee",
    bio: "The depth stood up and walked into the arena because it was invited.",
    style: "controller", tune: { band: 0.95, strafe: 0.6, commit: 1.1, retreat: 0.22 }, temper: "Drags the whole line out of position, one body at a time.",
    hp: 1240, dmg: 40, rate: 0.72, speed: 2.1, armor: 6, range: 7.6, mana: 120, manaRegen: 9, crit: 0.11, cdMul: 0.9, boss: true, ghost: true,
    atk: { name: "Deep Bolt", type: "bolt", w: "halo" },
    moves: ["tidecrush", "undertow"], cards: ["might", "swift", "leech"],
    counter: "Pulls a team apart one body at a time. Fragile for a guardian." });

  add({ id: "tithe", name: "Tithe-King", tag: "Nexus Guardian", cls: "beast", spr: { sheet: "creatures", key: "foe_tithe" }, color: "#facc15",
    bio: "Every hall pays it. It collects in the middle of the fight.",
    style: "hunter", tune: { band: 0.85, commit: 1.5, strafe: 0.4 }, temper: "Collects from whoever is closest to the floor.",
    hp: 1150, dmg: 39, rate: 0.98, speed: 2.3, armor: 5, range: 2.0, mana: 90, manaRegen: 8, crit: 0.15, cdMul: 0.86, boss: true,
    atk: { name: "Toll Claw", type: "melee", w: "needle" },
    moves: ["tithe", "snatch", "collection"], cards: ["vampiric", "executioner", "swift"],
    counter: "Turns your own health into its health. Burst it or bleed." });

  add({ id: "unnamer", name: "Name-Eater", tag: "Nexus Guardian", cls: "beast", spr: { sheet: "creatures", key: "foe_unnamer" }, color: "#a855f7",
    bio: "It has no interest in your body. It is here for the name on it.",
    style: "assassin", tune: { band: 0.9, retreat: 0.25, strafe: 0.8, commit: 1.2 }, temper: "Goes straight for the ones holding the team together.",
    hp: 1290, dmg: 37, rate: 0.76, speed: 2.4, armor: 6, range: 8.2, mana: 130, manaRegen: 10, crit: 0.13, cdMul: 0.88, boss: true, ghost: true,
    atk: { name: "Unname", type: "bolt", w: "halo" },
    moves: ["nameless", "unmake"], cards: ["might", "overclock", "leech"],
    counter: "Silences healers and casters. No answer to plain damage." });

  add({ id: "lock", name: "The Lock", tag: "Super Boss", cls: "beast", spr: { sheet: "creatures", key: "foe_lock" }, color: "#e2e8f0",
    bio: "The door was never finished. The last thing the Accord built is this.",
    style: "duelist", tune: { band: 0.95, commit: 3.2, strafe: 0.2 }, temper: "Holds the middle and will not be moved off it.",
    hp: 1725, dmg: 46, rate: 0.66, speed: 1.8, armor: 11, range: 8.4, mana: 120, manaRegen: 8, crit: 0.12, cdMul: 0.94, boss: true,
    atk: { name: "Lock Bolt", type: "bolt", w: "needle", pierce: 1 },
    moves: ["lockseal", "gatecannon"], cards: ["iron", "bulwark", "giant"],
    counter: "The strongest single body in the game. One body still loses to five." });

  /* the five beasts -------------------------------------------------------- */
  add({ id: "wolf", name: "Ashmane", tag: "Wolf", cls: "pet", spr: { sheet: "pets", key: "pet_wolf" }, color: "#94a3b8",
    bio: "Dash · bite. It arrives before the decision does.",
    style: "hunter", tune: { band: 0.8, commit: 1.0, strafe: 0.7, retreat: 0.36 }, temper: "Arrives before the decision does.",
    hp: 860, dmg: 38, rate: 0.96, speed: 3.9, armor: 7, range: 1.5, mana: 40, manaRegen: 4, crit: 0.18, cdMul: 0.84,
    atk: { name: "Bite", type: "melee", w: "needle" },
    moves: ["bite", "roar"], cards: ["swift", "fury", "leech"],
    counter: "Jumps the weakest body and hamstrings it for the pack. Still too eager to survive long." });

  add({ id: "lion", name: "Solstride", tag: "Lion", cls: "pet", spr: { sheet: "pets", key: "pet_lion" }, color: "#fbbf24",
    bio: "Jump · roar · claw. It picks its fight out loud.",
    style: "hunter", tune: { band: 0.9, commit: 1.35, strafe: 0.55 }, temper: "Picks out the wounded and does not get distracted.",
    hp: 855, dmg: 34, rate: 0.90, speed: 3.5, armor: 10, range: 1.6, mana: 50, manaRegen: 5, crit: 0.19, cdMul: 0.84,
    atk: { name: "Claw", type: "melee", w: "needle" },
    moves: ["soljump", "roar"], cards: ["lucky", "brutal", "might"],
    counter: "Hunts the wounded all match. Ignores the healthy one." });

  add({ id: "bear", name: "Ironhide", tag: "Bear", cls: "pet", spr: { sheet: "pets", key: "pet_bear" }, color: "#fb923c",
    bio: "Swipe · maul. The pack's door.",
    style: "bulwark", tune: { band: 0.9, leash: 70, commit: 1.9, strafe: 0.1 }, temper: "The pack's door — nothing walks past him.",
    hp: 790, dmg: 36.96, rate: 0.74, speed: 2.3, armor: 9, range: 1.7, mana: 40, manaRegen: 4, crit: 0.14, cdMul: 0.88,
    atk: { name: "Swipe", type: "melee", w: "shard" },
    moves: ["maul", "wardfield", "maulgrip"], cards: ["iron", "giant", "thorns"],
    counter: "A second wall for the price of a beast. No reach and no tricks." });

  add({ id: "elephant", name: "Tuskward", tag: "Elephant", cls: "pet", spr: { sheet: "pets", key: "pet_elephant" }, color: "#67e8f9",
    bio: "Stomp. It does not need a second move.",
    style: "vanguard", tune: { band: 0.95, leash: 60, commit: 2.0, strafe: 0.12 }, temper: "Moves with the herd and lands where the herd lands.",
    hp: 886, dmg: 35, rate: 0.68, speed: 2.5, armor: 8, range: 1.9, mana: 40, manaRegen: 4, crit: 0.12, cdMul: 0.9,
    atk: { name: "Tusk", type: "melee", w: "shard", splash: 1.6 },
    moves: ["stomp", "pound", "tuskcharge"], cards: ["iron", "bulwark", "heart"],
    counter: "The heaviest thing on legs. Everything outruns it." });

  add({ id: "scorpion", name: "Glassbarb", tag: "Scorpion", cls: "pet", spr: { sheet: "pets", key: "pet_scorpion" }, color: "#c4b5fd",
    bio: "Clamp · tail. The barb is the part that matters.",
    style: "rush", tune: { band: 0.65, commit: 1.2, strafe: 0.45 }, temper: "Gets in your face and leaves poison there.",
    hp: 560, dmg: 33, rate: 1.02, speed: 2.9, armor: 6, range: 1.6, mana: 60, manaRegen: 6, crit: 0.20, cdMul: 0.82,
    atk: { name: "Tail Barb", type: "melee", w: "needle", burn: 4 },
    moves: ["clamp", "flicker"], cards: ["thorns", "fury", "veil"],
    counter: "Poisons everything it touches. Will lose a long fight." });

  /* ------------------------------------------------------------- derived --- */
  /* The champions' arena numbers come off their own crypt sheet; the creatures come off the
     FOE table; but every fighter above states them outright so a kit is readable in one place.
     What is derived is the stuff a build should move: armor aura, shields, crit multipliers. */
  function build(fighter, allies, enemies, rng) {
    const cards = fighter.cards.map((c) => CARDS[c]).filter(Boolean);
    const mods = { armorAdd: 0, hpMul: 0, dmgMul: 0, rateMul: 0, spdMul: 0, critAdd: 0, critMulAdd: 0, cdMul: 0, pierceAdd: 0, volleyAdd: 0,
      leech: 0, thorns: 0, regen: 0, veil: 0, fury: 0, bulwark: 0, execute: 0, vamp: 0, manaMul: 0, manaMaxMul: 0, auraArmor: 0, auraDmg: 0, echo: 0, startShield: 0, firstDouble: 0 };
    cards.forEach((c) => { const m = c.mods || {}; for (const k in m) if (k in mods) mods[k] += m[k]; });

    /* auras from living teammates, resolved after every fighter is built (two passes) */
    let auraArmor = 0, auraDmg = 0;
    (allies || []).forEach((a) => {
      if (a === fighter) return;
      (a.cards || []).forEach((cid) => {
        const c = CARDS[cid];
        if (!c) return;
        if (c.mods.auraArmor) auraArmor += c.mods.auraArmor;
        if (c.mods.auraDmg) auraDmg += c.mods.auraDmg;
      });
    });

    const hpMul = 1 + mods.hpMul;
    const critMul = 1.5 + mods.critMulAdd;
    /* Two systemic levers, both learned from the headless ladder:
       · melee kits pay a walk-in tax (they eat shots closing), so they carry more body;
       · paper casters under 560 health get a little more, or burst deletes them outright.
       Damage is scaled once for everyone so a fight resolves inside a spectator's patience. */
    const kit = (w.LYGO_ATTACKS && w.LYGO_ATTACKS.kit(fighter.id)) || { atk: {}, moves: {} };
    const melee = fighter.range <= 1.95 && fighter.atk.type !== "bolt";
    let hp = fighter.hp * hpMul;
    if (melee) hp *= 1.18;
    if (!melee && fighter.range > 1.95 && fighter.hp < 560) hp += 80;
    const out = {
      id: fighter.id, name: fighter.name, tag: fighter.tag, cls: fighter.cls, bio: fighter.bio, counter: fighter.counter,
      spr: fighter.spr, portrait: fighter.portrait || null, color: fighter.color,
      boss: !!fighter.boss, ghost: !!fighter.ghost,
      style: fighter.style || null, temper: fighter.temper || null, tune: fighter.tune || null,
      max: Math.max(120, Math.round(hp)),
      dmg: fighter.dmg * 1.15 * (1 + mods.dmgMul),
      rate: fighter.rate * (1 + mods.rateMul),
      speed: fighter.speed * (1 + mods.spdMul) * 32,
      armor: fighter.armor + mods.armorAdd + (melee ? 1 : 0),
      range: fighter.range * 32,
      minRange: fighter.minRange ? fighter.minRange * 32 : 0,
      manaMax: Math.round(fighter.mana * (1 + mods.manaMaxMul)),
      manaRegen: fighter.manaRegen * (1 + mods.manaMul),
      crit: Math.min(0.75, fighter.crit + mods.critAdd),
      critMul: critMul,
      cdMul: Math.max(0.4, (fighter.cdMul || 1) * (1 + mods.cdMul)),
      pierce: (fighter.atk.pierce || 0) + mods.pierceAdd,
      atk: Object.assign({}, fighter.atk, (kit.atk || {})),
      cards, cardIds: fighter.cards.slice(), mods,
      moves: fighter.moves.map((m) => {
        const base = MOVES[m];
        if (!base) return null;
        return Object.assign({ moveId: m }, base, (kit.moves && kit.moves[m]) || {});
      }).filter(Boolean),
      moveIds: fighter.moves.slice(),
      ttl: fighter.ttl || 0,
      auraArmor, auraDmg, logic: fighter.logic || null
    };
    /* Every kit carries one long step. A fist announces Close. A gun announces Slip.
       Tokens stay on the moves they were summoned with. */
    if (fighter.cls !== "token") {
      const gun = out.range > 110;
      out.moves.push(Object.assign({ moveId: "stride" }, MOVES.stride, {
        name: gun ? "Slip" : "Close",
        text: gun
          ? "One step off the fist. Thirty seconds before it is yours again."
          : "One step onto them. Thirty seconds before it is yours again."
      }));
    }
    out.dps = out.dmg * out.rate * (1 + out.crit * (out.critMul - 1));
    out.power = Math.round(out.max / 14 + out.dps * 1.15 + out.armor * 7 + (out.range > 100 ? 14 : 0) + out.moves.length * 3 + (out.max >= 900 ? 12 : 0));
    return out;
  }

  /* build a whole team at once so the auras can see the whole team */
  function buildTeam(list) {
    return list.map((f) => build(f, list, null, Math.random));
  }

  const byId = {};
  F.forEach((f) => { byId[f.id] = f; });

  w.LYGO_ARENA = {
    CARDS: CARDS,
    MOVES: MOVES,
    TOKENS: TOKENS,
    ROSTER: F,
    byId: byId,
    build: build,
    buildTeam: buildTeam,
    /* pick n at random, optionally without a set of ids */
    draw(n, avoid) {
      const pool = F.filter((f) => !(avoid || []).includes(f.id));
      const out = [];
      while (out.length < n && pool.length) out.push(pool.splice((Math.random() * pool.length) | 0, 1)[0]);
      return out;
    }
  };
})(window);
