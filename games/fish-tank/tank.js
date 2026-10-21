/* Fish Tank — autonomous aquarium. Age is real time. Saves stay in this browser. */
(() => {
  const SAVE = "lygo_fish_tank_v1";
  const HOUR = 3600000;
  const DAY = 24 * HOUR;
  const STAGES = [
    ["baby", 0],
    ["infant", 2 * HOUR],
    ["child", 6 * HOUR],
    ["teen", 12 * HOUR],
    ["adult", DAY],
    ["elder", 4 * DAY]
  ];
  const STAGE_DRAW = { baby: 0.42, infant: 0.55, child: 0.7, teen: 0.84, adult: 1, elder: 0.95 };
  const FACE_RIGHT = { veil: false };
  const LIFE = 7 * DAY;
  const STARVE = 36 * HOUR;
  const FED_FAST = 6 * HOUR;
  const SPECIES = [
    { id: "glimmer", name: "Glimmer", play: "jump", temper: "lively", social: "school", bulk: 1, blurb: "Happy. Schools, and jumps." },
    { id: "azure", name: "Azure", play: "flare", temper: "lively", social: "loner", bulk: 0.92, blurb: "Happy loner. Keeps its own water." },
    { id: "dart", name: "Dart", play: "race", temper: "lively", social: "school", bulk: 0.78, blurb: "Happy. Schools and rarely stops." },
    { id: "puff", name: "Puff", play: "boop", temper: "chill", social: "loner", bulk: 0.88, blurb: "Relaxed loner. A soft bump, then space." },
    { id: "lantern", name: "Lantern", play: "glow", temper: "lively", social: "school", bulk: 0.74, blurb: "Happy. Schools, and glows at dusk." },
    { id: "moss", name: "Moss", play: "clean", temper: "chill", social: "loner", bulk: 0.96, blurb: "Relaxed loner. Stays low." },
    { id: "ruby", name: "Ruby", play: "school", temper: "chill", social: "school", bulk: 1, blurb: "Relaxed. Holds the school together." },
    { id: "veil", name: "Veil", play: "dance", temper: "chill", social: "loner", bulk: 1.05, blurb: "Relaxed loner. Long, slow arcs." },
    { id: "sunscale", name: "Sunscale", play: "lap", temper: "chill", social: "loner", bulk: 1.12, blurb: "Relaxed loner. One slow lap." },
    { id: "pearl", name: "Pearl", play: "flash", temper: "lively", social: "school", bulk: 0.7, blurb: "Happy. Schools and flashes." },
    { id: "claw", name: "LYGO Claw", play: "snap", temper: "chill", social: "loner", bulk: 1.28, blurb: "The lobster. Walks the sand. Gold claws." },
    { id: "crab", name: "Pincer", play: "scuttle", temper: "chill", social: "loner", bulk: 1.05, blurb: "Reef crab. Sideways on the bottom." },
    { id: "octo", name: "Octopus", play: "curl", temper: "lively", social: "loner", bulk: 1.15, blurb: "One in the tank. Jets, and inks when a hunter chases." },
    { id: "mandarin", name: "Mandarin", play: "pulse", temper: "chill", social: "loner", bulk: 0.62, blurb: "Dragonet. Hides on the rockwork and ignores most flakes." },
    { id: "pepper", name: "Peppermint", play: "hover", temper: "chill", social: "loner", bulk: 0.84, blurb: "Deep angel. Stays low and leaves when the water runs hot." },
    { id: "tusk", name: "Tusk", play: "flare", temper: "lively", social: "loner", bulk: 1.18, blurb: "Harlequin tusk. Clears a little algae and shoves smaller fish aside." },
    { id: "dragon", name: "Seadragon", play: "drift", temper: "chill", social: "loner", bulk: 1.22, blurb: "Leafy seadragon. Drifts in the plants. Hard for a hunter to pick out." },
    { id: "mask", name: "Masked angel", play: "school", temper: "chill", social: "school", bulk: 0.9, blurb: "Schools only with its own kind, and gives a tusk room." }
  ];
  const VITALS = {
    glimmer: { hp: 100, regen: 8, hurt: 10, food: 14 },
    azure: { hp: 90, regen: 5, hurt: 12, food: 11 },
    dart: { hp: 70, regen: 9, hurt: 14, food: 8 },
    puff: { hp: 120, regen: 4, hurt: 8, food: 18 },
    lantern: { hp: 65, regen: 10, hurt: 13, food: 9 },
    moss: { hp: 130, regen: 3, hurt: 6, food: 22 },
    ruby: { hp: 140, regen: 5, hurt: 7, food: 20 },
    veil: { hp: 110, regen: 4, hurt: 8, food: 17 },
    sunscale: { hp: 150, regen: 3, hurt: 6, food: 24 },
    pearl: { hp: 60, regen: 11, hurt: 15, food: 7 },
    claw: { hp: 160, regen: 3, hurt: 5, food: 26 },
    crab: { hp: 110, regen: 5, hurt: 7, food: 16 },
    octo: { hp: 130, regen: 5, hurt: 7, food: 18 },
    mandarin: { hp: 72, regen: 4, hurt: 9, food: 20 },
    pepper: { hp: 96, regen: 3, hurt: 8, food: 22 },
    tusk: { hp: 150, regen: 4, hurt: 6, food: 16 },
    dragon: { hp: 110, regen: 2, hurt: 7, food: 28 },
    mask: { hp: 84, regen: 5, hurt: 8, food: 14 }
  };
  const PREDATORS = {
    pike: { id: "pike", name: "Reed", blurb: "Long bill. A boss if the tank is quiet for an hour." },
    cinder: { id: "cinder", name: "Cinder", blurb: "Orange hunter. A lucky bite leaves a baby." },
    gar: { id: "gar", name: "Sable", blurb: "Dark gar. Two misses in a row and it dies." },
    eel: { id: "eel", name: "Volt", blurb: "Electric eel. A boss. The zap stuns whoever is close." },
    shark: { id: "shark", name: "Greymaw", blurb: "Reef shark. Three clean meals in a row and it becomes JAWS." }
  };
  /* Hours to infant, child, teen, adult, elder, then death. One tank hour is one tick. */
  const LIFE_CYCLE = {
    glimmer: [3, 8, 16, 28, 110, 180],
    azure: [4, 10, 20, 36, 140, 220],
    dart: [2, 5, 10, 18, 70, 120],
    puff: [4, 12, 24, 40, 150, 240],
    lantern: [2, 6, 12, 22, 80, 140],
    moss: [5, 14, 28, 48, 170, 280],
    ruby: [4, 12, 22, 36, 140, 230],
    veil: [4, 12, 26, 42, 160, 250],
    sunscale: [6, 16, 32, 56, 200, 320],
    pearl: [2, 5, 9, 16, 60, 100],
    claw: [6, 18, 36, 64, 220, 360],
    crab: [4, 10, 20, 36, 130, 210],
    octo: [5, 14, 30, 52, 180, 300],
    mandarin: [4, 12, 24, 40, 140, 220],
    pepper: [8, 20, 40, 72, 240, 400],
    tusk: [5, 14, 28, 48, 180, 300],
    dragon: [8, 24, 48, 80, 260, 420],
    mask: [5, 14, 28, 46, 170, 280]
  };
  const PRED_STAT = {
    pike: { hp: 90, dmg: 78 },
    cinder: { hp: 80, dmg: 70 },
    gar: { hp: 100, dmg: 84 },
    eel: { hp: 110, dmg: 96 },
    shark: { hp: 120, dmg: 80 },
    jaws: { hp: 200, dmg: 110 }
  };
  /* ---------------------------------------------------------------
     Phase 2 — living water.
     MOTION: how each species moves. DECOR: what it steers around.
     TEMP_BAND: the water each species is built for.
     GOALS: first-time marks that pay points.
     --------------------------------------------------------------- */
  const MOTION = {
    glimmer: { cruise: 0.085, burst: 0.40, turn: 2.4, vision: 0.20, band: [0.24, 0.60], tail: 15, glide: 0.50 },
    azure: { cruise: 0.070, burst: 0.30, turn: 1.9, vision: 0.17, band: [0.26, 0.68], tail: 13, glide: 0.70 },
    dart: { cruise: 0.125, burst: 0.62, turn: 3.4, vision: 0.24, band: [0.16, 0.52], tail: 23, glide: 0.25 },
    puff: { cruise: 0.048, burst: 0.15, turn: 1.4, vision: 0.14, band: [0.32, 0.74], tail: 9, glide: 0.85 },
    lantern: { cruise: 0.078, burst: 0.38, turn: 2.6, vision: 0.22, band: [0.34, 0.68], tail: 17, glide: 0.55, glow: true },
    moss: { cruise: 0.042, burst: 0.13, turn: 1.3, vision: 0.13, band: [0.60, 0.88], tail: 8, glide: 0.90 },
    ruby: { cruise: 0.072, burst: 0.34, turn: 2.2, vision: 0.25, band: [0.24, 0.62], tail: 15, glide: 0.60 },
    veil: { cruise: 0.055, burst: 0.20, turn: 1.6, vision: 0.18, band: [0.22, 0.70], tail: 10, glide: 0.80 },
    sunscale: { cruise: 0.050, burst: 0.26, turn: 1.5, vision: 0.18, band: [0.30, 0.80], tail: 9, glide: 0.85 },
    pearl: { cruise: 0.092, burst: 0.46, turn: 2.9, vision: 0.22, band: [0.14, 0.48], tail: 21, glide: 0.35 },
    claw: { cruise: 0.024, burst: 0.08, turn: 0.95, vision: 0.15, band: [0.82, 0.86], tail: 4, glide: 0.08, walk: true },
    crab: { cruise: 0.046, burst: 0.18, turn: 2.1, vision: 0.16, band: [0.82, 0.86], tail: 9, glide: 0.05, walk: true },
    octo: { cruise: 0.05, burst: 0.36, turn: 1.7, vision: 0.22, band: [0.22, 0.74], tail: 7, glide: 0.72, jet: true },
    mandarin: { cruise: 0.032, burst: 0.12, turn: 1.3, vision: 0.12, band: [0.58, 0.84], tail: 6, glide: 0.82 },
    pepper: { cruise: 0.04, burst: 0.14, turn: 1.2, vision: 0.14, band: [0.64, 0.88], tail: 7, glide: 0.8 },
    tusk: { cruise: 0.062, burst: 0.22, turn: 1.8, vision: 0.18, band: [0.42, 0.78], tail: 10, glide: 0.55 },
    dragon: { cruise: 0.02, burst: 0.06, turn: 0.7, vision: 0.12, band: [0.36, 0.72], tail: 4, glide: 0.95 },
    mask: { cruise: 0.055, burst: 0.18, turn: 1.6, vision: 0.2, band: [0.32, 0.64], tail: 11, glide: 0.62 }
  };
  /* Soft obstacles read off the painted tank, per theme. rx/ry are real
     stretches in screen fractions, so a rock blocks as tall as it is wide.
     kind "weed" is cover: fish swim in and through it, solid rock they round. */
  const DECOR = {
    river: [
      { x: 0.08, y: 0.45, rx: 0.11, ry: 0.36, kind: "weed", shelter: 1 },
      { x: 0.14, y: 0.68, rx: 0.07, ry: 0.10, kind: "weed", shelter: 1 },
      { x: 0.32, y: 0.47, rx: 0.055, ry: 0.13, kind: "solid", egg: 1 },
      { x: 0.50, y: 0.47, rx: 0.06, ry: 0.14, kind: "solid", egg: 1 },
      { x: 0.68, y: 0.45, rx: 0.11, ry: 0.14, kind: "solid" },
      { x: 0.82, y: 0.33, rx: 0.06, ry: 0.09, kind: "solid" },
      { x: 0.92, y: 0.45, rx: 0.10, ry: 0.34, kind: "weed", shelter: 1 },
      { x: 0.88, y: 0.68, rx: 0.08, ry: 0.10, kind: "weed", shelter: 1 },
      { x: 0.13, y: 0.70, rx: 0.10, ry: 0.07, kind: "solid" },
      { x: 0.78, y: 0.71, rx: 0.14, ry: 0.06, kind: "solid" }
    ],
    coral: [
      { x: 0.10, y: 0.26, rx: 0.12, ry: 0.18, kind: "solid" },
      { x: 0.19, y: 0.42, rx: 0.10, ry: 0.10, kind: "solid" },
      { x: 0.09, y: 0.56, rx: 0.10, ry: 0.09, kind: "weed", shelter: 1, egg: 1 },
      { x: 0.44, y: 0.57, rx: 0.11, ry: 0.14, kind: "solid", egg: 1 },
      { x: 0.68, y: 0.46, rx: 0.12, ry: 0.12, kind: "solid" },
      { x: 0.88, y: 0.24, rx: 0.12, ry: 0.18, kind: "solid" },
      { x: 0.94, y: 0.46, rx: 0.08, ry: 0.09, kind: "solid" },
      { x: 0.86, y: 0.64, rx: 0.10, ry: 0.08, kind: "weed", shelter: 1, egg: 1 }
    ],
    bog: [
      { x: 0.08, y: 0.42, rx: 0.10, ry: 0.34, kind: "weed", shelter: 1 },
      { x: 0.18, y: 0.60, rx: 0.07, ry: 0.09, kind: "weed", shelter: 1 },
      { x: 0.31, y: 0.60, rx: 0.055, ry: 0.14, kind: "solid", egg: 1 },
      { x: 0.50, y: 0.60, rx: 0.06, ry: 0.15, kind: "solid", egg: 1 },
      { x: 0.69, y: 0.52, rx: 0.12, ry: 0.13, kind: "solid" },
      { x: 0.82, y: 0.40, rx: 0.07, ry: 0.10, kind: "solid" },
      { x: 0.93, y: 0.45, rx: 0.09, ry: 0.32, kind: "weed", shelter: 1 }
    ]
  };
  const TEMP_BAND = {
    glimmer: [23, 28], azure: [22, 27], dart: [22, 27], puff: [23, 28], lantern: [23, 28],
    moss: [20, 26], ruby: [23, 28], veil: [22, 27], sunscale: [21, 26], pearl: [23, 28],
    claw: [16, 24], crab: [22, 29], octo: [20, 27],
    mandarin: [24, 28], pepper: [22, 25], tusk: [24, 28], dragon: [16, 22], mask: [23, 27]
  };
  const BIOS = {
    glimmer: { niche: "Upper school", text: "An original tank fish. It keeps to the bright middle water, schools with the other lively fish, and jumps when the glass is kind." },
    azure: { niche: "Loner", text: "An original betta-like fish. It keeps its own patch of water, flares when another fish crowds it, and does not join a school." },
    dart: { niche: "Fast school", text: "An original dash fish. It lives high in the water, races the school, and burns hunger faster than the slow fish." },
    puff: { niche: "Soft loner", text: "An original round fish. It drifts, bumps a neighbor, then wants space again. Dirty water bothers it less than a dart." },
    lantern: { niche: "Night light", text: "An original schooling fish. It glows once the tank goes dark and stays with the other small swimmers." },
    moss: { niche: "Low grazer", text: "An original bottom fish. It stays near the sand, picks at the green, and grows on a slow clock." },
    ruby: { niche: "School anchor", text: "An original calm fish. It holds the school together and does not sprint unless the food is close." },
    veil: { niche: "Slow arc", text: "An original long-finned fish. It takes wide slow turns and likes a little room around those fins." },
    sunscale: { niche: "Lap swimmer", text: "An original koi-like fish. It cruises a long lap, lives a long time, and does not school." },
    pearl: { niche: "Flash school", text: "An original small fish. It flashes in the school, eats often, and has the shortest life of the originals." },
    claw: { niche: "Sand walker", text: "LYGO Claw, the lobster. It walks the sand, takes food after it settles, and sidesteps a hunter instead of swimming up. It likes cooler water." },
    crab: { niche: "Sand walker", text: "Pincer, a reef crab. It scuttles the bottom, lifts a little waste, and stays on the sand even when the fish above bolt." },
    octo: { niche: "Jet and ink", text: "One octopus in the glass. It jets through the middle water. When a hunter chases, the ink takes 10% off that bite. It does not share the tank with a second octopus." },
    mandarin: { latin: "Synchiropus splendidus", niche: "Cryptic grazer", text: "A real mandarin dragonet. It picks tiny life off the rockwork, skips most flakes unless it is starving, and keeps away from the open school. The bitter skin makes a hunter 8% less likely to finish the bite." },
    pepper: { latin: "Centropyge boylei", niche: "Deep reef", text: "A real peppermint angelfish, one of the rare deep angels. It stays low, wants cooler water than the goldfish, and backs off when a tusk comes through. It grows slowly and lives a long time." },
    tusk: { latin: "Choerodon fasciatus", niche: "Territory", text: "A real harlequin tusk. It pushes smaller neighbors aside, takes food with confidence, and scrapes a little algae while it patrols. Masked angels, peppermints, and seadragons give it room." },
    dragon: { latin: "Phycodurus eques", niche: "Plant drift", text: "A real leafy seadragon. It barely swims, drifts into the plants, and is poor at chasing flakes. In the weeds a hunter is 12% less likely to land the bite. This tank does not hatch extra dragons from eggs." },
    mask: { latin: "Genicanthus personatus", niche: "Own-kind school", text: "A real masked angelfish from deep Hawaiian water. It schools only with other masked angels and slides away from a tusk. It does not join the glimmer school." }
  };
  const TRAIT_WORDS = {
    bold: ["timid", "wary", "steady", "bold", "fearless"],
    social: ["solitary", "private", "easy", "sociable", "inseparable"],
    appetite: ["picky", "light", "steady", "greedy", "ravenous"],
    vigor: ["frail", "delicate", "sound", "hardy", "vigorous"]
  };
  const GOALS = [
    { id: "adult", text: "One fish grows to adult", pay: 20 },
    { id: "court", text: "A pair courts in good water", pay: 20 },
    { id: "hatch", text: "A fry hatches in the tank", pay: 30 },
    { id: "dodge", text: "A hunter's bite misses", pay: 25 },
    { id: "eight", text: "Eight fish in the glass at once", pay: 25 },
    { id: "crew5", text: "Five cleaners at work", pay: 25 },
    { id: "school", text: "Six of one species at once", pay: 30 },
    { id: "elder", text: "A fish reaches elder", pay: 45 },
    { id: "hundred", text: "A fish lives a hundred hours", pay: 50 },
    { id: "twenty", text: "Twenty fish at once", pay: 40 },
    { id: "clear", text: "Quality 95 with twelve fish", pay: 35 },
    { id: "gen3", text: "A third generation is born here", pay: 60 },
    { id: "thirty", text: "Thirty fish at once", pay: 60 },
    { id: "allten", text: "All eighteen species at once", pay: 70 }
  ];
  const STALK_LEAD = 22000;
  const STRIKE_WINDOW = 40000;
  const HATCH_MS = 20 * 60000;
  const EGG_CAP = 6;

  const FISH_CAP = 50;
  const HUNTER_CAP = 10;
  /* The water is a chemistry, not three dials. Plants and the surface make
     oxygen, fish and waste spend it, and warm water holds less. Algae carries
     its own momentum and breathes all night. */
  const OX = {
    fish: 1.7,                                   // oxygen one fish spends each hour
    plant: { river: 8.5, coral: 6.5, bog: 10 },   // what the plants in each theme make
    exchange: 4.5,                               // air working in at the surface
    waste: 0.05,
    algaeNight: 4,
    thin: 55,                                    // fish start to feel it here
    gasp: 44                                     // and gulp at the surface here
  };
  const WASTE = { fish: 0.14, meal: 1.4, lift: 0.7, grazer: 0.16, settle: 1.7 };
  /* ---- the feeding loop, end to end ----
     A flake a fish eats is the only thing that pays. A fish that is still full refuses it,
     so that flake sinks and rots into waste instead. What a fish does eat works through it
     over the next hours and comes back out as waste. Cleaners lift that waste and pay for
     it in algae, and the only creature that eats algae - the final cleaner - is an algae
     eater. Nothing closes that loop but an otto, which is why every tank needs one, the
     shop will only sell two, and the rest have to be bred. */
  const LOOP = {
    full: 0.72,          // a fish will not take a flake while this much of its meal is left
    flakeRot: 60,        // seconds an uneaten flake floats before it turns to garbage
    rotAlgae: 1.2,       // algae one uneaten flake turns into where it settled
    algaeBits: 26,       // patches of green on the sand at 100% algae: the number, made visible
    bitEat: 0.6,         // algae an algae eater takes with each patch it clears
    bitSpawnMs: 700,     // how fast the green fills back in behind a grazer
    digest: 0.85,        // share of a meal that comes back as waste
    digestHours: 3,      // how long a meal takes to work through
    cleanPerHour: 1.1,   // waste one cleaner lifts each hour
    algaePerLift: 0.22,  // algae a cleaner makes per unit of waste it lifts
    bloomPerHour: 0.9,   // the water's own slow bloom, per hour
    ottoAlgae: 6.5,      // algae one algae eater clears an hour - the only real sink
    snailAlgae: 2.4,     // a nerite eats the green too - slower than an otto, but it counts
    ottoBought: 2,       // algae eaters the shop will sell at a time
    /* an RPG run rations the clock: the food window is squeezed so a fish that is not fed
       inside the hour is a dead fish. Bred pairs also have to have eaten recently. */
    rpgFoodScale: 1 / 36,
    rpgFedForBreed: 20 * 60000,
    ottoClutch: 5,       // hours between clutches for a settled algae eater
    rpgBreedMin: 30,     // an RPG run breeds on a 30 minute window, not on the species clock
    ottoHatch: 0.35      // hours in the egg before an otto hatches
  };
  const KEEPERS = {
    mara: {
      id: "mara", name: "Mara", tag: "Water", pitch: 1.05, rate: 0.94, cast: "hand", ext: "png", talk: true,
      bio: "Mara has kept glass boxes for twenty years. She talks softly and notices the water before anyone else.",
      greet: "The water is yours now. I will tell you when it changes.",
      idle: ["Nothing needs doing. That is the goal, you know.", "I will sit with them a while.", "Quiet water. Good water."],
      lines: {
        night: ["The plants breathe slower at night. Watch the fish come down off the surface.", "Night glass. I keep my voice low for it."],
        dawn: ["Dawn. They will want food before the light is fully up.", "First light on the sand. This is my hour."],
        full: ["This is a full glass. The water is working, not resting.", "More fish, more waste. I will stay close to the filter."],
        variety: ["Mixed tank. One kind likes it warm, one likes it cool — I split the difference.", "Different kinds, different water. That is the whole trick."],
        crew: ["The cleaners are earning their keep. Let them work.", "Snails and corys. Between them the sand stays pale."]
      }
    },
    ellis: {
      id: "ellis", name: "Ellis", tag: "Mood", pitch: 0.96, rate: 0.92, cast: "hand", ext: "png", talk: true,
      bio: "Ellis names every fish and remembers who ate. He thinks a happy tank is a noisy one, in a quiet way.",
      greet: "Hello, all of you. I already know your names.",
      idle: ["They are all awake. I checked twice.", "I know every one of them by the way they turn.", "A tank with names in it behaves better. I stand by that."],
      lines: {
        night: ["The shy ones come out at night. Look at the far water.", "I like the night shift. They are braver after dark."],
        dawn: ["Morning. Everyone is looking up at once.", "Dawn chorus, fish edition. Watch them rise."],
        variety: ["Six kinds and I can still tell who is who.", "A mix is more work to name. Worth it."],
        few: ["Only a few in there. I talk to them more than I should.", "Small population. I know what each one ate."],
        crew: ["The cleaners have names too, you know.", "That snail has opinions about the glass."]
      }
    },
    ren: {
      id: "ren", name: "Ren", tag: "Watch", pitch: 0.9, rate: 0.88, cast: "hand", ext: "png", talk: true,
      bio: "Ren likes the long watch. Hunters do not surprise Ren. Ren just says when one is coming.",
      greet: "I have the glass. Nothing gets past this chair.",
      idle: ["Nothing on the water. I am still watching.", "The glass is clear. I stay anyway.", "Quiet hours are when you learn a tank."],
      lines: {
        night: ["Hunters move better at night. I will be here.", "Dark water. I do not blink at this hour."],
        dusk: ["Dusk is when they start hunting. Watch the far water.", "The light is going. This is the dangerous hour."],
        full: ["A full glass is a menu for a hunter. Keep the weak ones fed.", "Crowds hide a stalk. I count the fish twice."],
        few: ["Thin tank. A hunter would starve in here. Good.", "Few fish. Less to lose. I still count."],
        crew: ["The turtle is the calmest thing in the water.", "Cleaners keep working while the hunters sleep."]
      }
    },
    june: {
      id: "june", name: "June", tag: "Sanctuary", pitch: 1.08, rate: 0.95, cast: "hand", ext: "png", talk: true,
      bio: "June keeps a peaceful room. She would rather have more fish and no hunters at all.",
      greet: "No hunters, quiet water. That is what we are building.",
      idle: ["Nobody is frightened in here. That is the whole point.", "Peaceful water. I could watch this all day.", "No hunters, no hurry."],
      lines: {
        night: ["Night in a quiet tank. Nothing cruises the dark.", "They rest properly here. No one is watching them."],
        dawn: ["They wake slowly when nothing hunts them.", "Good morning, all of you. Nobody is coming."],
        variety: ["All these kinds and not one of them scared. That is sanctuary.", "Different fish living side by side. That is what I want."],
        full: ["Even full, they are calm. I would still rather they had room.", "A crowd is fine when nobody is hunting."],
        crew: ["The cleaners and the fish have an understanding.", "Look at the turtle. Nothing bothers it."]
      }
    },
    mateo: {
      id: "mateo", name: "Mateo", tag: "Meals", pitch: 0.93, rate: 0.9, cast: "hand", ext: "png", talk: true,
      bio: "Mateo feeds by hand and hates a wasted flake. Meals last longer when he is on the glass.",
      greet: "Everyone eats on my watch. Nobody goes thin here.",
      idle: ["Everyone has eaten. That is all I wanted.", "A fed tank is a bold tank.", "The flakes go fast. That is a good sign."],
      lines: {
        dawn: ["Breakfast is the best meal in a tank. Watch them rise.", "Dawn feeding. They have been waiting for me."],
        night: ["Nothing at night. A full fish sleeps better.", "Night feeding only makes waste. I will wait for light."],
        few: ["Few mouths, so every flake matters.", "I feed by hand so I know who got what."],
        full: ["This many fish need feeding twice. I will keep up.", "A crowd eats a pinch in seconds. I bring more."],
        crew: ["The cory gets what the others drop. Nothing wasted.", "Corys are the cleanup crew for a bad feeder. Good worker."]
      }
    },
    nia: {
      id: "nia", name: "Nia", tag: "Mix", pitch: 1.1, rate: 0.97, cast: "hand", ext: "png", talk: true,
      bio: "Nia likes a mixed tank. One kind of fish makes her nervous. A crowd of different kinds makes her relax.",
      greet: "A mixed tank then. That is how it should be.",
      idle: ["Now this is a tank. Look at the variety.", "Same kind everywhere would bore me.", "A mix. That is the good stuff."],
      lines: {
        mono: ["Almost one kind in there. I would add something different.", "A single school is pretty, and fragile."],
        night: ["Even at night, a mixed tank is busy.", "Different kinds keep different hours. Listen to it."],
        dawn: ["Dawn in a mixed tank — everyone wakes at their own pace.", "Watch how differently they start the day."],
        full: ["A full mixed glass. This is what I like to see.", "Crowded, but varied. That is the trick."],
        crew: ["Even the cleaners come in different shapes.", "A varied clean-up crew for a varied tank."]
      }
    },
    mira: {
      id: "mira", name: "Mira Quinn", tag: "Parkland", pitch: 1.02, rate: 0.95, cast: "lattice", ext: "jpg", talk: false,
      bio: "Mira came off the fairways to keep glass. She reads a tank the way she read a green: grass, light, and patience.",
      greet: "Give it light, give it time, and it will grow on you.",
      idle: ["Green water, green plants. Feels like home.", "Let the plants do the work. They usually will.", "I have watched grass grow for a living. This is faster."],
      lines: {
        dawn: ["First light hits the plants and the whole tank turns gold.", "Early light. This is when the green moves."],
        variety: ["Different plants for different fish. Same as a course needs different cuts.", "A varied tank holds its own water. I like that."],
        night: ["At night the plants breathe the other way. Most keepers never notice.", "The dark water is doing work you cannot see."],
        full: ["Full glass. The plants are carrying the oxygen load now.", "A crowd leans hard on the greenery. Watch it."]
      }
    },
    sancora: {
      id: "sancora", name: "Sancora Vale", tag: "Links", pitch: 0.95, rate: 0.9, cast: "lattice", ext: "jpg", talk: false,
      bio: "Sancora kept links on the coast and keeps water the same way: read the wind, read the tide, then decide.",
      greet: "Read the water before you touch it. Then we start.",
      idle: ["Salt on the air once. Now it is just glass and patience.", "Water tells you what it needs. You have to sit still long enough.", "A tank is a tide you control. Mostly."],
      lines: {
        full: ["A crowded tank is a tide with nowhere to go. Give it a change.", "Too much life in too little water. I have seen that on a shore."],
        variety: ["Mixed water, mixed needs. You cannot please all of them at once.", "Different kinds want different temperatures. Split the difference and watch."],
        dawn: ["Morning is the honest hour for water.", "Dawn on a links, dawn on a tank — same light, same lesson."],
        crew: ["Cleaners are your current. They move what the fish leave.", "Let the workers work. You only steer."]
      }
    },
    lyra: {
      id: "lyra", name: "Lyra Helmer", tag: "Night green", pitch: 1.07, rate: 0.93, cast: "lattice", ext: "jpg", talk: false,
      bio: "Lyra plays the night round. She keeps the lantern fish lit and would happily sleep all day to sit up with the tank.",
      greet: "Low light tonight and I am not sleeping. Good.",
      idle: ["Midnight is the best tee time and the best water.", "I keep the light low and the glass close.", "Everyone is braver at night. Fish included."],
      lines: {
        night: ["The lanterns are doing the work now. This is my hour.", "Night glass, low light, and something glowing in the weeds.", "I came for this. Everyone else is asleep."],
        dusk: ["The light is going. Watch who starts moving first.", "Dusk. The tank changes hands about now."],
        dawn: ["I stay up for the dawn. Then I sleep through the day.", "First light. I have been here the whole time."],
        variety: ["Different fish wake at different hours. Night shows you who is who.", "The mix only makes sense after dark."]
      }
    },
    reed: {
      id: "reed", name: "Reed Hollow", tag: "Pines", pitch: 0.92, rate: 0.88, cast: "lattice", ext: "jpg", talk: false,
      bio: "Reed came out of the pine woods and prefers a dark tank. Blackwater, leaf litter, and fish that have seen a few winters.",
      greet: "Dark water, deep cover. Nothing here needs fussing.",
      idle: ["Dark water is honest water.", "Tea-coloured glass, leaf litter, and no fuss.", "I like a tank that looks like it grew there."],
      lines: {
        night: ["Blackwater at night. You can barely see them. They like that.", "No light, no noise. This is how a tank should sleep."],
        variety: ["Leaf litter and roots. Different fish for different cover.", "A varied tank is a forest. Everyone finds a layer."],
        few: ["Few fish, deep cover. Like a quiet pond.", "Not many in here. The ones that are, are calm."],
        full: ["A crowd in blackwater. Mind the oxygen, it goes quick.", "Full and dark means you check the water more often."]
      }
    },
    calder: {
      id: "calder", name: "Justin", tag: "Steward", pitch: 0.98, rate: 0.92, cast: "lattice", ext: "jpg", talk: false,
      bio: "Justin built this glass and still checks the water himself. He keeps the long watch, feeds by hand, and likes a tank that is alive at midnight.",
      greet: "I am here. We will take this slow.",
      idle: ["This one is mine. I still check the water myself.", "Built it, fed it, watched it. Still watching.", "Long watch tonight. Suits me."],
      lines: {
        night: ["Midnight and the tank is still working. That is the part I like.", "Night shift. The fish do not know I am here."],
        dawn: ["Dawn feeding. I never miss it if I can help it.", "First light. Good start to a build day."],
        full: ["Full glass. If the water holds, I will believe the maths.", "Crowded. This is where the numbers earn their keep."],
        variety: ["Different kinds in one glass. Harder to run, better to watch.", "A mixed tank shows you everything at once."],
        crew: ["The workers are on it. I just keep the books.", "Snails, corys, a turtle. That is a full crew."],
        eggs: ["Eggs on the rockwork. That is a generation I did not buy.", "Fry coming. That is the tank making its own decisions."]
      }
    },
    kai: {
      id: "kai", name: "Kai Park", tag: "Lights", pitch: 1.0, rate: 0.95, cast: "lattice", ext: "jpg", talk: false,
      bio: "Kai lights courses for a living and treats a tank like a stage. He wants the light right, the timing right, and a bit of a show.",
      greet: "Lights on low to start. Watch what the fish do with it.",
      idle: ["Light makes the tank. Everything else is plumbing.", "Right now the mood is blue. Later it will be gold.", "Give me a good lamp and a clean glass and I can sell this."],
      lines: {
        dusk: ["This is the show hour. Watch the light drop.", "Dusk cue. The tank turns over about now."],
        dawn: ["Dawn run. Best light of the day and it lasts ten minutes.", "First light. I would put this on a poster."],
        night: ["Night lighting on. Low, warm, and just enough to see them move.", "The dark tank is a different room. I like what it does."],
        variety: ["Different colours under different light. That is the trick.", "A varied tank lights beautifully, if you know where to put the lamp."],
        crew: ["The jelly catches the light better than any fish.", "Watch the turtle in the late light. That is a shot."]
      }
    }
  };
  const CAST_ORDER = ["mara", "ellis", "ren", "june", "mateo", "nia", "mira", "sancora", "lyra", "reed", "calder", "kai"];
  function keeperOf(id) { return KEEPERS[id] || KEEPERS.mara; }
  /* Static art has no talking frame: the bubble, the tag and the voice carry it instead. */
  function keeperArt(id, beat) {
    const k = keeperOf(id);
    const use = beat && k.talk ? "_talk.png" : "." + k.ext;
    return "./assets/keepers/" + id + use + "?v=4";
  }
  function keeperCardArt(id) { return "./assets/keepers/" + id + "." + keeperOf(id).ext + "?v=4"; }

  const PERKS = [
    { id: "clear", name: "Clear glass", text: "Algae grows slower and the water holds its quality." },
    { id: "bright", name: "Bright mood", text: "Fish stay content a little longer when the water is off." },
    { id: "shortwatch", name: "Short watch", text: "A hunter can enter after 30 quiet minutes, not a full hour." },
    { id: "sanctuary", name: "Sanctuary", text: "The tank holds 70 fish. No hunters enter. Short watch does nothing." },
    { id: "meals", name: "Long meals", text: "A feeding lasts about a quarter longer." },
    { id: "pockets", name: "Full pockets", text: "Start with 40 points." },
    { id: "years", name: "Long years", text: "Every fish lives about a fifth longer." },
    { id: "keen", name: "Keen eye", text: "Hunters miss a little more often. Five points off the bite." },
    { id: "crowd", name: "Roomy glass", text: "Crowding starts later, nearer 42 fish than 30." },
    { id: "quickfry", name: "Quick fry", text: "Eggs hatch sooner." }
  ];
  const CREW = [
    { id: "snail", name: "Nerite", cost: 20, blurb: "Walks the sand and eats the green. Expels nothing." },
    { id: "otto", name: "Algae eater", cost: 28, blurb: "Lives on the green film." },
    { id: "cory", name: "Cory", cost: 28, blurb: "Bottom feeder. Lifts the waste." },
    { id: "jelly", name: "Moon jelly", cost: 36, blurb: "Pulses in the top and middle water only." },
    { id: "turtle", name: "Pond turtle", cost: 50, blurb: "Stays on the sand. Naps in its shell." }
  ];
  const CREW_LIFE = 30 * DAY;
  const HANDS = { f: new Image(), m: new Image() };
  HANDS.f.src = "./assets/crew/hand-f.png";
  HANDS.m.src = "./assets/crew/hand-m.png";
  const CREW_SPRITES = {};
  const CREW_H = { snail: 0.12, otto: 0.075, cory: 0.1, jelly: 0.2, turtle: 0.16 };
  const SPRITES = {};
  const THEMES = {
    river: { id: "river", name: "River garden", blurb: "Clear water, plants, and a stone arch.", temp: 25, algae: 1, day: "tank-day.jpg", night: "tank-night.jpg" },
    coral: { id: "coral", name: "Coral shelf", blurb: "Warm shallows, corals, and an anemone.", temp: 27, algae: 1.15, day: "coral-day.jpg", night: "coral-night.jpg" },
    bog: { id: "bog", name: "Blackwater", blurb: "Tea-stained water, roots, and leaf litter.", temp: 23, algae: 0.7, day: "bog-day.jpg", night: "bog-night.jpg" }
  };
  const THEME_ART = {};
  Object.keys(THEMES).forEach(function (id) {
    THEME_ART[id] = { day: new Image(), night: new Image() };
    THEME_ART[id].day.src = "./assets/" + THEMES[id].day;
    THEME_ART[id].night.src = "./assets/" + THEMES[id].night;
  });
  CREW.forEach(function (c) {
    const img = new Image();
    img.src = "./assets/crew/" + c.id + ".png";
    CREW_SPRITES[c.id] = img;
  });
  CREW_SPRITES.turtleSleep = new Image();
  CREW_SPRITES.turtleSleep.src = "./assets/crew/turtle-sleep.png";
  STAGES.forEach(function (pair) {
    SPECIES.forEach(function (sp) {
      if (sp.id === "claw" || sp.id === "crab" || sp.id === "octo" || sp.id === "mandarin" || sp.id === "pepper" || sp.id === "tusk" || sp.id === "dragon" || sp.id === "mask") return;
      const img = new Image();
      img.src = "./assets/fish/" + sp.id + "_" + pair[0] + ".png";
      SPRITES[sp.id + "_" + pair[0]] = img;
    });
    ["l", "r"].forEach(function (dir) {
      const img = new Image();
      img.src = "./assets/fish/azure_" + pair[0] + "_" + dir + ".png";
      SPRITES["azure_" + pair[0] + "_" + dir] = img;
    });
  });
  const PRED_SPRITES = {};
  ["pike", "cinder", "gar", "eel", "shark"].forEach(function (id) {
    ["baby", "adult"].forEach(function (age) {
      const img = new Image();
      img.src = "./assets/fish/" + id + "_" + age + ".png";
      PRED_SPRITES[id + "_" + age] = img;
    });
  });
  ["eel_adult_zap", "eel_adult_zap2", "eel_baby_zap", "shark_elder", "shark_elder_stalk"].forEach(function (key) {
    const img = new Image();
    img.src = "./assets/fish/" + key + ".png";
    PRED_SPRITES[key] = img;
  });
  ["octo_r", "octo_r_swim", "ink_1", "ink_2", "ink_3", "mandarin_r", "mandarin_r_swim", "pepper_r", "pepper_r_swim", "tusk_r", "tusk_r_swim", "dragon_r", "dragon_r_swim", "mask_r", "mask_r_swim"].forEach(function (key) {
    const img = new Image();
    img.src = "./assets/fish/" + key + ".png";
    SPRITES[key] = img;
  });
  ["claw", "crab"].forEach(function (id) {
    ["l", "r"].forEach(function (dir) {
      ["", "_walk"].forEach(function (step) {
        const img = new Image();
        img.src = "./assets/fish/" + id + "_" + dir + step + ".png";
        SPRITES[id + "_" + dir + step] = img;
      });
    });
  });
  ["baby", "child", "adult"].forEach(function (stage) {
    ["l", "r"].forEach(function (dir) {
      const img = new Image();
      img.src = "./assets/fish/sunscale_" + stage + "_" + dir + ".png";
      SPRITES["sunscale_" + stage + "_" + dir] = img;
    });
  });

  const canvas = document.getElementById("tank");
  const ctx = canvas.getContext("2d");
  let state = null;
  let selected = null;
  /* which cleaner the card is showing, if any - the rail manages both */
  let selectedCrew = null;
  /* the management list is rebuilt only when its contents actually change, so a tank with
     a hundred names does not rebuild a hundred rows on every rail render */
  let railSig = "";
  /* where each fish was actually drawn, in canvas pixels - the click test reads this */
  const hitBoxes = {};
  const HIT_PAD = 0.008;
  const HIT_FAR = 0.1;
  const HIT_LABEL = 0.05;
  let bubbles = [];
  let flakes = [];
  let inks = [];
  let motes = [];
  let ripples = [];
  let AR = 1.7;
  let hand = null;
  let last = performance.now();

  function specOf(id) { return SPECIES.filter(function (s) { return s.id === id; })[0] || SPECIES[0]; }
  function cycleOf(species) { return LIFE_CYCLE[species] || [2, 6, 12, 24, 96, 168]; }
  function stageName(age, species) {
    const hours = age > 5000 ? age / HOUR : age;
    const marks = cycleOf(species);
    const names = ["baby", "infant", "child", "teen", "adult", "elder"];
    let name = "baby";
    for (let i = 0; i < 5; i += 1) if (hours >= marks[i]) name = names[i + 1];
    return name;
  }
  function moodOf(f, now) {
    if (state && state.quality < (hasPerk("bright") ? 22 : 32)) return "sad";
    if (f && comfort(f) > (hasPerk("bright") ? 2.4 : 1.6)) return "sad";
    if (now - f.lastFed > 8 * HOUR) return "sad";
    if (now - f.lastPlay < 20 * 60000 && (!state || state.quality >= 55)) return "happy";
    return "normal";
  }
  function vitals(f) { return VITALS[f.species] || { hp: 100, regen: 5, hurt: 10, food: 16 }; }
  /* true while a fish still has enough of its last meal to turn a flake down */
  function isFull(f, now) {
    return foodLeft(f, now) > LOOP.full * foodWindow(f);
  }
  /* what a fish has eaten and not yet put back into the water, shed over the next hours */
  function shed(f, span) {
    if (!f.digest) return 0;
    const out = Math.min(f.digest, (f.digest / Math.max(0.25, LOOP.digestHours)) * span);
    f.digest -= out;
    return out;
  }
  /* how long a fish's meal lasts. An RPG run scales the whole clock down to the hour. */
  function foodWindow(f) {
    return vitals(f).food * HOUR * (RPG() ? LOOP.rpgFoodScale : 1);
  }
  function foodLeft(f, now) {
    const hours = vitals(f).food * (hasPerk("meals") ? 1.28 : 1) * (RPG() ? LOOP.rpgFoodScale : 1);
    return hours * HOUR - (now - (f.lastFed || f.born));
  }
  function lifeOf(f) {
    const base = cycleOf(f.species)[5] * HOUR;
    return base * (hasPerk("years") ? 1.2 : 1) + (f.bonus || 0);
  }
  function keeperInfo() {
    const k = state && state.keeper;
    return k && KEEPERS[k.id] ? k : { id: "mara", name: (state && state.owner) || "Keeper", perks: [] };
  }
  function hasPerk(id) {
    const k = state && state.keeper;
    return !!(k && k.perks && k.perks.indexOf(id) >= 0);
  }
  /* ---- room in the glass ----
     A tank is not a count of bodies. A school of glimmers costs the water far less than
     a tusk and an octopus, so every species carries a biomass and the glass carries a
     load budget. That budget gates the shop, the hatchery and the crowding slope, which
     is what lets a community tank of small schooling fish hold far more bodies than a
     tank of giants - and what stops the giants from being free. */
  const BIOMASS = {
    glimmer: 0.7, dart: 0.7, moss: 0.7, azure: 0.8, pearl: 0.8, lantern: 0.9,
    ruby: 1.0, veil: 1.0, sunscale: 1.1, mask: 1.2, mandarin: 1.2, pepper: 1.2,
    crab: 1.2, claw: 1.3, tusk: 1.35, dragon: 1.6, octo: 2.2
  };
  const LOAD_BASE = 56;
  const LOAD_PERK = 8;
  const LOAD_SANCTUARY = 16;
  const EGG_LOAD = 0.5;
  const HARD_CAP = 84;
  function biomassOf(species) {
    const b = BIOMASS[species];
    return b == null ? 1 : b;
  }
  function loadCap() {
    return LOAD_BASE + (hasPerk("crowd") ? LOAD_PERK : 0) + (hasPerk("sanctuary") ? LOAD_SANCTUARY : 0);
  }
  function fishLoad(list) {
    const fish = list || (state && state.fish) || [];
    let n = 0;
    fish.forEach(function (f) { n += biomassOf(f.species); });
    n += ((state && state.eggs ? state.eggs.length : 0)) * EGG_LOAD;
    return Math.round(n * 10) / 10;
  }
  /* is there room for one more of this species? small schoolers fit long after giants do not */
  function canAdd(species, list) {
    const fish = list || (state && state.fish) || [];
    if (fish.length >= HARD_CAP) return false;
    return fishLoad() + biomassOf(species) <= loadCap() + 0.001;
  }
  function loadRatio() { return clamp(fishLoad() / loadCap(), 0, 2.6); }
  /* Crowding is a slope, not a cliff, and it follows the load: the water cares about
     what is in it, not how many noses are pressed against the glass. */
  function crowdLoad() { return clamp(loadRatio(), 0, 2.4); }
  function fishCap() { return HARD_CAP; }
  function quietNeed() { return hasPerk("shortwatch") && !hasPerk("sanctuary") ? HOUR / 2 : HOUR; }
  /* Warm water rides the surface, cold sits on the sand. */
  function stratNow() {
    const heater = !state || !state.opts || state.opts.heater !== false;
    return (heater ? 0.85 : 0.45) + crowdLoad() * 0.3;
  }
  function tempAt(y) {
    if (y == null) return (state && state.temp) || 25;
    return ((state && state.temp) || 25) + (0.45 - clamp(y, 0.1, 0.92)) * stratNow() * 1.6;
  }
  /* Dawn, day, dusk, night: the tank keeps a rhythm even when the light is set. */
  function rhythm() {
    const mode = state && state.opts && state.opts.clock;
    if (mode === "day") return "day";
    if (mode === "night") return "night";
    const h = new Date().getHours();
    if (h >= 5 && h < 8) return "dawn";
    if (h >= 8 && h < 17) return "day";
    if (h >= 17 && h < 20) return "dusk";
    return "night";
  }
  function oxygenNote() {
    const o = state.oxygen == null ? 88 : state.oxygen;
    if (o < OX.gasp) return "The water is thin. Fish are gulping at the surface.";
    if (o < OX.thin) return "Oxygen is low. Keep the glass open and the plants bright.";
    if (o > 92) return "The water is bright with oxygen.";
    return "";
  }
  function wasteNote() {
    const w = state.waste || 0;
    if (w > 62) return "Waste is piling on the sand. A cory or the turtle would lift it.";
    if (w > 34) return "A little waste on the bottom.";
    return "";
  }
  function mixScale() {
    const fish = (state && state.fish) || [];
    const n = fish.length;
    if (n < 2) return { temp: 1.2, dirt: 1.12, share: 1, kinds: n };
    const counts = {};
    fish.forEach(function (f) { counts[f.species] = (counts[f.species] || 0) + 1; });
    let max = 0;
    Object.keys(counts).forEach(function (id) { if (counts[id] > max) max = counts[id]; });
    const share = max / n;
    const kinds = Object.keys(counts).length;
    return {
      temp: clamp(0.4 + share * 1.4 - Math.min(kinds, 8) * 0.035, 0.4, 1.9),
      dirt: clamp(0.7 + share * 0.9, 0.7, 1.35),
      share: share,
      kinds: kinds
    };
  }
  function ageOf(f, now) { return Math.max(0, now - f.born); }
  function bodyAge(f) { return f.growth || 0; }
  function accrueGrowth(f, now) {
    if (f.growthHours == null) {
      const elapsed = Math.max(0, (f.growth || 0) > 0 ? f.growth : (now - (f.born || now)));
      f.growthHours = Math.floor(elapsed / HOUR);
    }
    f.growth = f.growthHours * HOUR;
    f.growthAt = now;
  }
  function addGrowthHours(f, n) {
    f.growthHours = Math.max(0, (f.growthHours || 0) + n);
    f.growth = f.growthHours * HOUR;
  }
  function hours(ms) { return Math.round(ms / HOUR * 10) / 10; }
  function price() { return 30 + state.fish.length * 18; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function depthOf(o) {
    if (!o) return 0.7;
    if (o.kind && o.depth != null) return o.depth;
    if (o.z != null) return o.z;
    return 0.86;
  }
  function span3(ax, ay, az, bx, by, bz) {
    return Math.hypot(ax - bx, (ay - by) * AR, (az - bz) * 0.82);
  }
  function apart(a, b) {
    return span3(a.x, a.y, depthOf(a), b.x, b.y, depthOf(b));
  }
  function depthBand(f) {
    const m = motionOf(f);
    if (m.walk) return [0.7, 0.94];
    if (f.species === "dragon" || f.species === "mandarin") return [0.18, 0.52];
    if (f.species === "pepper") return [0.24, 0.58];
    if (m.band && m.band[1] < 0.55) return [0.4, 0.88];
    return [0.16, 0.92];
  }
  function crewOf(id) { return CREW.filter(function (c) { return c.id === id; })[0]; }
  function uid() { return "f" + Math.random().toString(36).slice(2, 8); }
  function log(t) {
    state.log.unshift(t);
    state.log = state.log.slice(0, 30);
    readEvent(t);
  }
  /* Every notable thing already writes a line. The announcer reads those lines,
     pulls the names and numbers out of them, and says it in the keeper's voice. */
  const LOG_EVENTS = [
    { key: "death", re: /^(.+) is eaten\./ },
    { key: "death", re: /^(.+) dies unfed after (\d+) hours\./ },
    { key: "death", re: /^(.+) dies in a dirty tank after (\d+) hours\./ },
    { key: "death", re: /^(.+) rests of old age after (\d+) hours\./ },
    { key: "bite", re: /^(.+) rolls (\d+) against \d+% and eats ([^.]+)\./, pick: function (m) { return { hunter: m[1], roll: m[2], name: m[3] }; } },
    { key: "repel", re: /(spines draw blood|venom burns|scales turn the bite)/,
      pick: function (m) { return { how: m[1], name: "" }; } },
    { key: "contest", re: /^(.+) and (.+) both want (.+)\./,
      pick: function (m) { return { name: m[1], other: m[2], fish: m[3] }; } },
    { key: "dodge", re: /^(.+) rolls (\d+) against (\d+)% and misses (.+) at the last moment/, pick: function (m) { return { hunter: m[1], roll: m[2], chance: m[3], name: m[4] }; } },
    { key: "stalk", re: /^(.+) turns toward (.+), the weakest/, pick: function (m) { return { hunter: m[1], name: m[2] }; } },
    { key: "hunt", re: /^Boss (.+) enters\./ },
    { key: "ink", re: /^(.+) throws a cloud of black ink\./ },
    { key: "jaws", re: /becomes JAWS/ },
    { key: "battle", re: /spent the hour fighting|^One predator battle/ },
    { key: "shock", re: /^(.+) cracks the water\./ },
    { key: "leave", re: /^(.+) slips into the far water\./ },
    { key: "grow", re: /^(.+) is grown\. It hunts/ },
    { key: "court", re: /^(.+) and (.+) turn slow circles/ },
    { key: "egg", re: /^(.+) and (.+) leave (\d+) (\w+) eggs/ },
    { key: "birth", re: /^A fry hatches by the rockwork: ([^,]+), generation (\d+)/ },
    { key: "first", re: /^First time — (.+)\. \+(\d+) pts\./ },
    { key: "water", re: /^You change a third of the water/ },
    { key: "buy", re: /^(.+) joins\. A baby\./ },
    { key: "crew", re: /^(.+) starts work\./ },
    { key: "retire", re: /^(.+) finishes a month of work\./ },
    { key: "feed", re: /reaches over the glass|offers one pellet/ },
    { key: "empty", re: /^The glass was empty/ },
    { key: "starve", re: /^(.+) has not eaten in a while\./, pick: function (m) { return { name: m[1] }; } }
  ];
  function readEvent(text) {
    for (let i = 0; i < LOG_EVENTS.length; i += 1) {
      const e = LOG_EVENTS[i];
      const m = e.re.exec(text);
      if (!m) continue;
      const vars = e.pick ? e.pick(m) : { name: m[1] || "", other: m[2] || "", n: m[3] || "" };
      vars.line = text;
      if (e.key === "death" && /old age/.test(text)) vars.how = "rests of old age";
      else if (e.key === "death" && /unfed/.test(text)) vars.how = "starved";
      else if (e.key === "death" && /dirty/.test(text)) vars.how = "the dirty water took it";
      else if (e.key === "death") vars.how = "a hunter took it";
      announce(e.key, vars);
      return;
    }
  }
  const SFX = {};
  let sfxReady = false;
  function ensureSfx() {
    if (sfxReady) return;
    sfxReady = true;
    ["pump", "death", "chase", "omen", "bite", "battle", "feed", "nibble"].forEach(function (name) {
      const a = new Audio("./assets/sfx/" + name + ".wav?v=3");
      a.preload = "auto";
      if (name === "pump" || name === "omen") a.loop = true;
      SFX[name] = a;
    });
  }
  const SFX_KIND = { pump: "ambient", omen: "ambient", death: "fx", chase: "fx", bite: "fx", battle: "fx", feed: "fx", nibble: "fish" };
  function channelOn(kind) {
    const o = (state && state.opts) || {};
    const key = { talk: "soundTalk", ambient: "soundAmbient", fx: "soundFx", fish: "soundFish" }[kind];
    if (o[key] != null) return !!o[key];
    return o.sound !== false;
  }
  /* the air pump and the low water bed have their own dial now, inside the tank sound */
  function ambientVol() {
    const o = state && state.opts ? state.opts : null;
    if (!o) return 1;
    const v = o.soundAmbientVol;
    if (v == null) return 1;
    return Math.max(0, Math.min(1.5, Number(v) || 0));
  }
  function sfxVol() {
    const v = state && state.opts ? state.opts.soundVol : null;
    return v == null ? 0.4 : clamp(v, 0, 1);
  }
  function playSfx(name) {
    const kind = SFX_KIND[name] || "fx";
    if (!channelOn(kind) || sfxVol() < 0.02) return;
    ensureSfx();
    const a = SFX[name];
    if (!a || a.loop) return;
    try {
      a.pause();
      a.currentTime = 0;
      a.volume = sfxVol() * (name === "nibble" ? 0.28 : (name === "death" || name === "bite" ? 0.45 : 0.62));
      const go = a.play();
      if (go && go.catch) go.catch(function () {});
    } catch (_) {}
  }
  function tuneLoop(a, on, vol) {
    if (!a) return;
    a.volume = vol;
    if (on) {
      const go = a.play();
      if (go && go.catch) go.catch(function () {});
    } else {
      a.pause();
    }
  }
  function syncLoops() {
    const ambient = !!(playing && state && channelOn("ambient") && sfxVol() >= 0.02);
    if (!sfxReady && !ambient) return;
    ensureSfx();
    const jaws = ambient && (state.predators || []).some(function (p) { return p.elder; });
    tuneLoop(SFX.pump, ambient, sfxVol() * 0.42 * ambientVol());
    tuneLoop(SFX.omen, jaws, sfxVol() * 0.4 * ambientVol());
    if (!channelOn("talk") && typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }
  function tickFishNoise(now) {
    if (!playing || !state || !channelOn("fish") || !state.fish.length) return;
    if (now < (state._fishNoise || 0)) return;
    state._fishNoise = now + (32000 + Math.random() * 38000);
    playSfx("nibble");
  }
  function save() {
    try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (_) {}
  }
  /* ---------------- DNA ----------------
     Every fish carries a short hash of its own genome: species, generation, sex, the four
     traits, the hashes of both parents, and a birth salt. Offspring inherit their parents'
     hashes, so the lineage is a chain anyone can walk again and re-check. It is a
     fingerprint, not a security primitive - the point is that a fish's identity and its
     parentage can be recomputed from what the tank recorded, and a tampered one fails. */
  const DNA_SALT = "lygo-fish-tank-v1";
  const DNA_BANK_CAP = 260;
  function fnv1a(str, seed) {
    let h = seed >>> 0;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }
  function dnaCode(species) {
    return String(species || "fish").replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase();
  }
  function traitCode(t) {
    t = t || {};
    return [t.bold, t.social, t.appetite, t.vigor].map(function (q) {
      return String(Math.round(clamp(q == null ? 0.5 : q, 0, 1) * 99)).padStart(2, "0");
    }).join("");
  }
  function genomeOf(species, gen, sex, traits, parents, born, salt) {
    return [DNA_SALT, species, gen || 1, sex || "?",
      traitCode(traits), (parents || []).slice(0, 2).join("+"),
      Math.round(born || 0), salt || ""].join("|");
  }
  function dnaFor(species, gen, sex, traits, parents, born, salt) {
    const g = genomeOf(species, gen, sex, traits, parents, born, salt);
    const hex = (fnv1a(g, 0x811c9dc5).toString(16).padStart(8, "0") +
      fnv1a(g, 0x1b873593).toString(16).padStart(8, "0")).toUpperCase();
    return "LG1-" + dnaCode(species) + "-" + hex.slice(0, 12);
  }
  function dnaSalt() {
    return fnv1a(String(Date.now()) + ":" + String(Math.random()) + ":" + String(uid()), 0x9e3779b9)
      .toString(16).padStart(8, "0");
  }
  function isDna(v) { return String(v || "").indexOf("LG1-") === 0; }
  /* Every fish is born on the real clock: `born` is a browser timestamp in milliseconds and
     it is already part of the genome (see genomeOf), so the hash commits to the very second
     the fish arrived. These two only say it out loud, in the same shape a card can print. */
  function bornStamp(ms) {
    const d = new Date(ms || 0);
    const p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " +
      p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }
  /* the gene bank is the part of the ledger that survives a fish: hashes, parents, names */
  function bankFish(f) {
    if (!f || !f.dna) return;
    if (!state) return;   /* the menu builds starter fish before the tank exists */
    state.bank = state.bank || {};
    const cur = state.bank[f.dna];
    if (!cur) {
      state.bank[f.dna] = {
        species: f.species || "", name: f.name || "",
        gen: (f.genes && f.genes.gen) || f.gen || 1, sex: (f.genes && f.genes.sex) || f.sex || "?",
        parents: (f.parents || []).filter(isDna).slice(0, 2),
        born: (f.genes && f.genes.born) || f.born || 0,
        at: Date.now()
      };
      const keys = Object.keys(state.bank);
      if (keys.length > DNA_BANK_CAP) {
        keys.sort(function (a, b) { return (state.bank[a].at || 0) - (state.bank[b].at || 0); });
        keys.slice(0, keys.length - DNA_BANK_CAP).forEach(function (k) { delete state.bank[k]; });
      }
    } else {
      if (f.name) cur.name = f.name;
      if (f.species) cur.species = f.species;
    }
  }
  /* A fish's DNA is the genome it was BORN with. The four traits, sex and generation are
     snapshotted into genes at birth, so a later edit to the live fish - by a feature or by
     someone poking at the save - cannot silently change its identity, and a hash that no
     longer matches its own birth genome is real evidence of a tamper rather than drift. */
  function geneTraits(f) {
    const t = (f.genes && f.genes.traits) || f.traits || {};
    return {
      bold: t.bold == null ? 0.5 : t.bold,
      social: t.social == null ? 0.5 : t.social,
      appetite: t.appetite == null ? 0.5 : t.appetite,
      vigor: t.vigor == null ? 0.5 : t.vigor
    };
  }
  function giveDna(f, force) {
    if (!f || !f.species) return f;
    f.genes = f.genes || {};
    if (!f.genes.born) f.genes.born = f.born || f.growthAt || Date.now();
    if (!f.genes.salt) f.genes.salt = dnaSalt();
    if (force || !f.genes.traits) {
      f.genes.traits = geneTraits(f);
      f.genes.sex = f.sex || "?";
      f.genes.gen = f.gen || 1;
    }
    if (force || !f.dna) {
      f.dna = dnaFor(f.species, f.genes.gen, f.genes.sex, f.genes.traits, (f.parents || []).filter(isDna),
        f.genes.born, f.genes.salt);
    }
    bankFish(f);
    return f;
  }
  /* recompute the hash from the birth genome the tank is holding */
  function verifyDna(f) {
    if (!f || !f.dna) return { ok: false, dna: "", want: "", reason: "no dna on this fish" };
    const g = f.genes || {};
    const want = dnaFor(f.species, g.gen || f.gen || 1, g.sex || f.sex, geneTraits(f),
      (f.parents || []).filter(isDna), g.born || f.born, g.salt);
    return {
      ok: want === f.dna, dna: f.dna, want: want,
      reason: want === f.dna ? "genome matches the hash" : "hash does not match the genome"
    };
  }
  /* walk the chain through the gene bank: how far back the tank can still prove */
  function lineageOf(f) {
    const out = { found: 0, missing: 0, chain: [], root: null };
    if (!f || !state || !state.bank) return out;
    const seen = {};
    const walk = function (hash, depth) {
      if (!hash) return;
      if (seen[hash]) return;
      seen[hash] = 1;
      const rec = state.bank[hash];
      if (!rec) { out.missing += 1; return; }
      out.found += 1;
      out.chain.push({ depth: depth, name: rec.name, gen: rec.gen, species: rec.species, dna: hash });
      (rec.parents || []).forEach(function (q) { walk(q, depth + 1); });
    };
    (f.parents || []).filter(isDna).forEach(function (q) { walk(q, 1); });
    out.root = out.chain.length ? out.chain[out.chain.length - 1] : null;
    out.deepest = out.chain.reduce(function (n, c) { return Math.max(n, c.depth); }, 0);
    return out;
  }
  function dnaLine(f) {
    const v = verifyDna(f);
    const lin = lineageOf(f);
    if (!v.ok) return "unverified";
    const from = (f.parentNames || []).length ? " · from " + f.parentNames.join(" × ")
      : (f.parents || []).length ? " · bred from " + (f.parents || []).length + " banked parent" + (f.parents.length > 1 ? "s" : "")
        : " · founder";
    return "verified" + (lin.found ? " · " + lin.found + " ancestor" + (lin.found > 1 ? "s" : "") : "") + from;
  }

  function makeFish(species, name) {
    const now = Date.now();
    const band = (MOTION[species] || MOTION.glimmer).band;
    const f = {
      id: uid(),
      species: species,
      name: String(name || specOf(species).name).slice(0, 16),
      born: now,
      bonus: 0,
      growth: 0,
      growthAt: now,
      /* born hungry: the first pinch has to be worth something, or no tank can earn */
      lastFed: now - Math.round(((VITALS[species] || { food: 16 }).food * HOUR) *
        (RPG() ? LOOP.rpgFoodScale * 0.5 : 0.8)),
      lastPlay: now,
      x: 0.2 + Math.random() * 0.6,
      y: clamp(band[0] + Math.random() * (band[1] - band[0]), 0.12, 0.86),
      vx: (Math.random() < 0.5 ? -1 : 1) * (0.02 + Math.random() * 0.02),
      vy: 0,
      action: "",
      actionT: 0,
      tx: 0,
      ty: 0,
      state: "cruise",
      stateT: 0,
      idleT: 0,
      phase: Math.random() * 6.283,
      heading: Math.random() < 0.5 ? 0 : Math.PI,
      bank: 0,
      pitch: 0,
      z: 0.25 + Math.random() * 0.6,
      zTarget: 0.25 + Math.random() * 0.6,
      sex: Math.random() < 0.5 ? "m" : "f",
      gen: 1,
      parents: [],
      traits: makeTraits(),
      startleT: 0,
      courtT: 0,
      speed: 0,
      wseed: Math.random() * 90,
      dna: "",
      genes: null,
      parentNames: []
    };
    return giveDna(f);
  }
  const STARTER_NAMES = { glimmer: "Sunny", dart: "Stripe", puff: "Coral", azure: "Veilblue", lantern: "Wick", moss: "Pebble", ruby: "Disc", veil: "Ribbon", sunscale: "Koi", pearl: "Fan", claw: "Claw", crab: "Pincer", octo: "Eight", mandarin: "Mandy", pepper: "Mint", tusk: "Tusk", dragon: "Leaf", mask: "Mask" };
  let playing = false;
  let hasSave = false;
  let menuMode = "standard";
  let menuKeeper = "mara";
  let menuPerks = [];
  let menuTheme = "river";
  let menuPicks = ["glimmer", "dart", "puff"];
  let heldOpts = null;
  /* ---- donation gate -------------------------------------------------------
     games/lygo-gate.js rides in with defer, so window.LYGO_GATE can land after
     this script has already run: every call is guarded and retried. The gate
     cannot know when a tank is live, so the keeper holds the reminder while a
     tank is on screen and gets two quiet minutes after coming back out.
     The flag is separate from `playing` on purpose: showMenu() clears `playing`
     before anything else in it runs, so an `if (playing) relax(...)` would
     never fire and the reminder would stay held for the rest of the session. */
  let gateBusy = false;   // a tank is on screen (showMenu() nulls `playing` first)
  function gate() { return window.LYGO_GATE || null; }
  function gateHold(on, relaxMs) {
    let tries = 0;
    const apply = () => {
      const g = gate();
      if (!g || !g.hold) { if (tries++ < 24) setTimeout(apply, 250); return; }
      g.hold(on);
      if (!on && relaxMs) g.suppress(relaxMs);
    };
    apply();
  }
  function themeOf(id) { return THEMES[id] || THEMES.river; }
  function tankAge(now) { return Math.max(0, now - (state.openedAt || now)); }
  function fresh(picks, mode, ownerName, themeId) {
    const ids = (picks && picks.length ? picks : ["glimmer", "dart", "puff"]).slice(0, 3);
    const theme = themeOf(themeId);
    const now = Date.now();
    state = {
      points: 0,
      keeper: menuKeeperPick(ownerName),
      mode: mode || "standard",
      /* an RPG run is a run: it is timed from the first fish and it can be lost */
      run: (mode === "rpg")
        ? { start: now || Date.now(), added: 0, lost: 0, seen: 0, collapsed: false, ended: 0 }
        : null,
      theme: theme.id,
      openedAt: now,
      fish: ids.map(function (id) { return makeFish(id, STARTER_NAMES[id] || specOf(id).name); }),
      cemetery: [],
      log: ["Three fish settle into the " + theme.name + ". Mode: " + (mode || "standard") + "."],
      lastTick: now,
      owner: String(ownerName || "Keeper").slice(0, 18)
    };
    ensureState();
    if (hasPerk("pockets")) state.points = 40;
    if (heldOpts) state.opts = Object.assign(state.opts, heldOpts);
    state.oxygen = 92;
    state.waste = 8;
    state.temp = theme.temp;
    state.opts.temp = theme.temp;
    save();
    hasSave = true;
  }
  function ensureState() {
    state.crew = state.crew || [];
    state.predators = state.predators || [];
    state.cemetery = state.cemetery || [];
    state.bank = state.bank || {};
    state.log = state.log || [];
    state.eggs = state.eggs || [];
    state.goals = state.goals || {};
    state.simV = 3;
    if (state.oxygen == null) state.oxygen = 88;
    if (state.waste == null) state.waste = 10;
    if (state.hatched == null) state.hatched = 0;
    if (state.court == null) state.court = 0;
    if (state.dodge == null) state.dodge = 0;
    if (state.gen == null) state.gen = 1;
    if (state.algae == null) state.algae = 8;
    if (state.quality == null) state.quality = 86;
    if (state.temp == null) state.temp = 25;
    if (!state.waterAt) state.waterAt = Date.now();
    if (!state.theme) state.theme = "river";
    if (!state.keeper) state.keeper = { id: "mara", name: state.owner || "Mara", perks: [] };
    (state.predators || []).forEach(function (p) {
      if (p.pending == null) p.pending = false;
      if (p.victim == null) p.victim = null;
      if (p.heading == null) p.heading = (p.vx || 0) < 0 ? Math.PI : 0;
    });
    (state.fish || []).forEach(function (f) {
      if (f.growth == null) f.growth = Math.max(0, Date.now() - (f.born || Date.now()));
      if (!f.growthAt) f.growthAt = Date.now();
      if (!f.lastFed) f.lastFed = f.born || Date.now();
      const v = vitals(f);
      if (f.hp == null) f.hp = v.hp;
      f.maxHp = v.hp;
      if (!f.hpAt) f.hpAt = Date.now();
      if (!f.traits) f.traits = makeTraits();
      if (!f.sex) f.sex = Math.random() < 0.5 ? "m" : "f";
      if (f.gen == null) f.gen = 1;
      if (!f.parents) f.parents = [];
      /* saves written before DNA kept parent NAMES in this field: move them, do not hash them */
      if (f.parents.some(function (q) { return !isDna(q); })) {
        f.parentNames = (f.parentNames || []).concat(f.parents.filter(function (q) { return !isDna(q); })).slice(0, 2);
        f.parents = f.parents.filter(isDna);
      }
      if (!f.parentNames) f.parentNames = [];
      if (!f.genes) f.genes = { born: f.born || Date.now(), salt: dnaSalt() };
      if (!f.dna) f.dna = dnaFor(f.species, f.gen || 1, f.sex, f.traits, f.parents, f.genes.born, f.genes.salt);
      /* a save from before birth snapshots existed gets one, and one re-hash to match it;
         from then on a mismatch is evidence, not drift, so it is never repaired again */
      if (!f.genes.traits) giveDna(f, true);
      bankFish(f);
      if (!f.state) f.state = "cruise";
      if (f.phase == null) f.phase = Math.random() * 6.283;
      if (f.heading == null) f.heading = (f.vx || 0) < 0 ? Math.PI : 0;
      if (f.bank == null) f.bank = 0;
      if (f.pitch == null) f.pitch = 0;
      if (f.z == null) f.z = 0.25 + Math.random() * 0.6;
      if (f.zTarget == null) f.zTarget = f.z;
      if (f.wseed == null) f.wseed = Math.random() * 90;
      if (f.startleT == null) f.startleT = 0;
      if (f.courtT == null) f.courtT = 0;
      const band = (MOTION[f.species] || MOTION.glimmer).band;
      const ymid = (band[0] + band[1]) / 2;
      if (!(f.x >= 0.02 && f.x <= 0.98)) f.x = 0.5;
      if (!(f.y >= 0.1 && f.y <= 0.9)) f.y = ymid;
      f.y = clamp(f.y, 0.1, 0.88);
    });
    if (!state.openedAt) {
      const births = (state.fish || []).map(function (f) { return f.born; }).filter(Boolean);
      state.openedAt = births.length ? Math.min.apply(null, births) : Date.now();
    }
    if (!state.predators.length && !state.clearSince) state.clearSince = state.openedAt || Date.now();
    state.opts = Object.assign({
      names: true, board: true, motion: true, heater: true, temp: 25, clock: "real",
      sound: true, soundVol: 0.4, soundAmbientVol: 1, soundTalk: true, soundAmbient: true, soundFx: true, soundFish: true
    }, state.opts || {});
  }
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE) || "null");
      if (raw && Array.isArray(raw.fish)) {
        state = raw;
        state.cemetery = state.cemetery || [];
        state.log = state.log || [];
        state.points = state.points || 0;
        state.owner = state.owner || "Keeper";
        ensureState();
        if (!state.mode) state.mode = "standard";
        hasSave = true;
        return true;
      }
    } catch (_) {}
    hasSave = false;
    return false;
  }
  function makeCrew(role) {
    const spec = crewOf(role);
    return {
      id: uid(),
      role: role,
      name: spec ? spec.name : role,
      bought: true,
      bred: false,
      born: Date.now(),
      x: 0.15 + Math.random() * 0.7,
      y: role === "jelly" ? 0.28 : 0.8,
      vx: (Math.random() < 0.5 ? -1 : 1) * 0.02,
      wobble: Math.random() * 6
    };
  }

  /* ---------------- the public life hall ----------------
     The board lives on the Hugging Face space; everything here is read-only and none of
     it is needed for the tank to run. No account, no login: a name, a species and hours. */
  const HALL_URL = "https://deepseekoracle-lattice-marines-ledger.hf.space/fish/ledger.json";
  function fetchHall(force) {
    if (!state || typeof fetch !== "function") return;
    if (!force && Date.now() - (state._hallAt || 0) < 4 * 60000) return;
    if (Date.now() - (state._hallAt || 0) < 20000) return;
    state._hallAt = Date.now();
    fetch(HALL_URL, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        const rows = (d && d.lives) || [];
        state.hallPublic = {
          updated: (d && d.updated) || null,
          rows: rows.slice(0, 5).map(function (r) {
            return {
              keeper: r.name || "Keeper", fish: r.fish || r.name || "—",
              hours: r.score || 0, species: r.species || "", dna: r.dna || "", gen: r.gen || 1
            };
          })
        };
        renderRail();
      })
      .catch(function () {});
  }
  function hallBest() {
    const rows = (state && state.hallPublic && state.hallPublic.rows) || [];
    return rows.length ? rows[0] : null;
  }
  function bury(f, now) {
    const age = ageOf(f, now);
    const row = {
      name: f.name,
      species: f.species || f.role || "",
      score: Math.round(age / HOUR),
      tankHours: Math.round(tankAge(now) / HOUR),
      theme: themeOf(state.theme).name,
      stage: f.species ? stageName(bodyAge(f), f.species) : "crew",
      date: new Date(now).toISOString().slice(0, 10),
      gen: f.gen || 1,
      dna: f.dna || "",
      keeper: state.owner || "Keeper"
    };
    state.cemetery.unshift(row);
    state.cemetery = state.cemetery.slice(0, 40);
    log(f.cause === "hunt"
      ? (f.name + " is eaten.")
      : f.cause === "filth"
        ? (f.name + " dies in a dirty tank after " + row.score + " hours.")
        : f.cause === "hunger"
          ? (f.name + " dies unfed after " + row.score + " hours.")
          : (f.name + " rests of old age after " + row.score + " hours."));
    if (window.ArcadeLedger && ArcadeLedger.fish && row.score >= 1) {
      ArcadeLedger.fish({
        name: state.owner || "Keeper",
        fish: row.name,
        score: row.score,
        hours: row.score,
        tankHours: row.tankHours,
        theme: row.theme,
        species: row.species,
        stage: row.stage,
        gen: row.gen,
        dna: row.dna,
        date: row.date,
        event: "life"
      });
      /* the public hall is other keepers' fish. Beating it is the point of keeping one
         alive this long, so say so out loud when it happens. */
      const best = state.hallPublic && state.hallPublic.rows && state.hallPublic.rows[0];
      if (best && row.score > (best.hours || 0)) {
        log(row.name + " lived " + row.score + " hours. That is the longest life on the public hall.");
        keeperNote("The hall says " + (best.hours || 0) + " hours from " + (best.keeper || "another keeper") +
          ". " + row.name + " just beat it.");
      }
      fetchHall();
    }
  }
  function predOf(id) { return PREDATORS[id] || PREDATORS.pike; }
  function makePredator(kind, boss) {
    const spec = predOf(kind);
    const now = Date.now();
    return {
      id: uid(),
      kind: kind,
      name: boss ? (spec.name + " boss") : (spec.name + " fry"),
      boss: !!boss,
      adult: !!boss,
      adultAt: boss ? now : now + HOUR,
      nextRoll: now + HOUR,
      fails: 0,
      streak: 0,
      elder: false,
      depth: 0.16,
      away: 0,
      backAt: now + 45000,
      hp: (PRED_STAT[kind] || PRED_STAT.pike).hp,
      maxHp: (PRED_STAT[kind] || PRED_STAT.pike).hp,
      born: now,
      x: 0.15 + Math.random() * 0.7,
      y: 0.28 + Math.random() * 0.3,
      vx: 0.03,
      face: 1
    };
  }
  function tickHealth(f, now) {
    const v = vitals(f);
    if (f.hp == null) f.hp = v.hp;
    const from = f.hpAt || f.born || now;
    const span = Math.min(48, Math.max(0, (now - from) / HOUR));
    f.hpAt = now;
    if (span <= 0) return;
    const unfed = now - (f.lastFed || f.born) > foodWindow(f);
    const dirty = (state.quality || 100) < 45 || (state.algae || 0) > 68;
    const crowded = loadRatio() >= 0.85;
    const load = crowdLoad();
    const thin = (state.oxygen || 100) < OX.thin;
    let delta = 0;
    if (!unfed && !dirty && !crowded && !thin) delta += v.regen * span;
    else if (!unfed && !dirty && !thin) delta += v.regen * 0.4 * span;
    else if (!unfed && !dirty) delta += v.regen * 0.1 * span;
    if (unfed) delta -= v.hurt * span;
    if (dirty) delta -= (5 + (crowded ? 4 : 0)) * span;
    else if (crowded) delta -= 2 * span;
    if (load > 0.85) delta -= (load - 0.85) * 5 * span;
    if (thin) delta -= (1.6 + (OX.thin - (state.oxygen || 0)) * 0.08) * span;
    const off = comfort(f);
    if (off > 2.5) delta -= (1.1 + (off - 2.5) * 1.5) * span;
    f.hp = clamp((f.hp || 0) + delta, 0, v.hp);
  }
  const AUTO_CAST = ["dart", "ruby", "lantern", "pearl", "glimmer", "moss", "veil", "puff", "sunscale", "azure", "crab", "claw", "octo", "mandarin", "pepper", "tusk", "dragon", "mask"];
  function autoSpecies() {
    let best = AUTO_CAST[0];
    let bestN = 99;
    AUTO_CAST.forEach(function (id) {
      const n = state.fish.filter(function (f) { return f.species === id; }).length;
      if (n < bestN) { bestN = n; best = id; }
    });
    return best;
  }
  function tickAuto(now) {
    if (!state.auto || !playing) return;
    if (state._autoAt && now - state._autoAt < 20000) return;
    state._autoAt = now;
    const soon = state.fish.some(function (f) { return foodLeft(f, now) < 3 * HOUR; });
    if ((soon || !state.fish.length) && !hand && !flakes.length) startHand("flakes");
    /* A run has no points to spend, so the run's own rules stand in: the water and the
       cleaners are free, and the keeper never stocks the glass - the shelf is the keeper's
       own pick and past it only a pair breeding adds anything. Gating on points here left
       Automatic doing nothing at all in a run, because a run's purse is always empty. */
    if ((state.quality < 60 || state.algae > 45) && (RPG() || state.points >= 10)) {
    if (!RPG()) state.points -= 10;
      state.algae = clamp(state.algae - 28, 0, 100);
      state.quality = clamp(state.quality + 24, 0, 100);
      log("Auto keeper changes some water.");
    }
    const crewN = (state.crew || []).length;
    if (crewN < 2 && (RPG() || state.points >= 20) && state.algae > 25) {
    if (!RPG()) state.points -= 20;
      state.crew.push(makeCrew("snail"));
      log("Auto keeper adds a nerite.");
    } else if (crewN < 4 && (RPG() || state.points >= 28) && state.quality < 65) {
      if (!RPG()) state.points -= 28;
      state.crew.push(makeCrew("cory"));
      log("Auto keeper adds a cory.");
    }
    const goal = (state.predators || []).length ? 16 : 12;
    const cost = price();
    if (!RPG() && state.fish.length < goal && state.quality >= 50 && state.points >= cost) {
      let id = autoSpecies();
      if (!canAdd(id)) return;
      if (id === "octo" && hasOcto()) id = "dart";
      if (!RPG()) state.points -= cost;
      const fish = makeFish(id, specOf(id).name);
      state.fish.push(fish);
      log("Auto keeper adds " + fish.name + ". Hunters are not touched.");
    }
    /* a run leans on Automatic: it keeps them fed, and makes no promises */
    const rpgHungry = RPG() && !hand && !flakes.length &&
      state.fish.some(function (f) { return !isFull(f, now); });
    if (rpgHungry && Math.random() < 0.5) startHand("flakes");
    const weak = state.fish.slice().sort(function (a, b) { return (a.hp || 0) - (b.hp || 0); })[0];
    if (weak && (weak.hp || 0) < vitals(weak).hp * 0.35 &&
      (RPG() || state.points >= 15) && !hand && !flakes.length) {
      if (!RPG()) state.points -= 15;
      if (!startHand("pellet")) state.points += 15;
    }
  }
  /* ---- what a fish brings to a fight ----
     spines  a bite can be repelled, and the hunter pays for trying
     venom   even a bite that lands costs the hunter
     armor   thick, hard to get a grip on
     speed   a burst that steals the strike
     hide    reads the weed and the rockwork
     ink     the octopus's escape, already in the water */
  const DEFENSE = {
    glimmer:  { speed: 0.15, hide: 0.1 },
    dart:     { speed: 0.45 },
    azure:    { speed: 0.3, hide: 0.15 },
    moss:     { hide: 0.45 },
    lantern:  { hide: 0.35, speed: 0.1 },
    ruby:     { armor: 0.25 },
    veil:     { armor: 0.2, speed: 0.2 },
    sunscale: { armor: 0.3 },
    pearl:    { armor: 0.35 },
    puff:     { spines: 0.5, armor: 0.1 },
    mask:     { venom: 0.35, hide: 0.2 },
    mandarin: { venom: 0.4, hide: 0.25 },
    pepper:   { spines: 0.45, hide: 0.2 },
    tusk:     { spines: 0.55 },
    dragon:   { hide: 0.6 },
    claw:     { venom: 0.5, armor: 0.3 },
    crab:     { armor: 0.55, venom: 0.15 },
    octo:     { venom: 0.3, hide: 0.4 }
  };
  function defenseOf(species) { return DEFENSE[species] || {}; }
  function dval(species, key) { return defenseOf(species)[key] || 0; }
  function defenseLine(f) {
    if (!f) return "";
    const d = defenseOf(f.species);
    const bits = [];
    if (d.spines) bits.push("spines");
    if (d.venom) bits.push("venom");
    if (d.armor) bits.push("armor");
    if (d.speed) bits.push("burst speed");
    if (d.hide) bits.push("cover");
    const mates = schoolMates(f, 0.13);
    if (mates) bits.push("shoal of " + (mates + 1));
    return bits.length ? bits.join(" · ") : "no defences worth naming";
  }
  /* how many of its own kind are within reach - the oldest defence there is */
  function schoolMates(f, r) {
    const reach = r == null ? 0.13 : r;
    let n = 0;
    ((state && state.fish) || []).forEach(function (o) {
      if (o === f || o.species !== f.species) return;
      if (apart(o, f) <= reach) n += 1;
    });
    return n;
  }
  function schoolSafety(f) { return clamp(schoolMates(f, 0.13) / 5, 0, 1); }
  function huntChance(f, now) {
    const v = vitals(f);
    const hpRatio = clamp((f.hp || 0) / (v.hp || 1), 0, 1);
    const fedRatio = clamp(foodLeft(f, now) / foodWindow(f), 0, 1);
    let chance = clamp(0.25 + (1 - hpRatio) * 0.4 + (1 - fedRatio) * 0.3, 0.25, 0.85);
    /* armour and spines blunt the strike, speed and cover steal it, and a fish inside
       its own shoal is a bad bet: the nearest of its kind is the one that gets seen */
    chance -= dval(f.species, "armor") * 0.12 + dval(f.species, "speed") * 0.10 +
      dval(f.species, "spines") * 0.08 + dval(f.species, "venom") * 0.05;
    chance -= schoolSafety(f) * 0.22;
    if (f.species === "octo" && (f.inkUntil || 0) > now) chance -= 0.10;
    if (f.species === "mandarin") chance -= 0.08;
    if (f.species === "dragon" && nearWeed(f)) chance -= 0.12;
    if (hasPerk("keen")) chance -= 0.05;
    return clamp(chance, 0.05, 0.85);
  }
  function nearWeed(f) {
    let close = false;
    decorOf().forEach(function (d) {
      if (d.kind === "weed" && Math.hypot(f.x - d.x, f.y - d.y) < 0.16) close = true;
    });
    return close;
  }
  function hasOcto(exceptId) {
    return (state.fish || []).some(function (f) { return f.species === "octo" && f.id !== exceptId; });
  }
  function releaseInk(f, now) {
    f.inkUntil = now + 14000;
    if ((f.inkCd || 0) > now) return;
    f.inkCd = now + 700;
    for (let i = 0; i < 3; i += 1) {
      inks.push({
        x: clamp(f.x - (f.face || 1) * 0.04 + (Math.random() - 0.5) * 0.06, 0.04, 0.96),
        y: clamp(f.y + (Math.random() - 0.5) * 0.05, 0.12, 0.86),
        born: now,
        life: 2200 + Math.random() * 900,
        drift: (Math.random() - 0.5) * 0.03
      });
    }
    if (!f.inkSaid || now - f.inkSaid > 8000) {
      f.inkSaid = now;
      log(f.name + " throws a cloud of black ink.");
    }
  }
  /* How exposed a fish is. A hunter that only ever takes the hungriest fish wastes its
     hours on the ones its prey's friends are guarding; this is the number that decides
     which fish is worth the strike: weak, hungry, alone, and soft. */
  function preyScore(f, now) {
    const v = vitals(f);
    const hpRatio = clamp((f.hp || 0) / (v.hp || 1), 0, 1);
    const fedRatio = clamp(foodLeft(f, now) / foodWindow(f), 0, 1);
    let s = (1 - hpRatio) * 1.0 + (1 - fedRatio) * 0.7;
    s += (1 - schoolSafety(f)) * 0.5;
    s -= dval(f.species, "armor") * 0.25 + dval(f.species, "spines") * 0.2 +
      dval(f.species, "venom") * 0.18 + dval(f.species, "speed") * 0.12;
    const stage = stageName(bodyAge(f), f.species);
    if (stage === "baby") s += 0.25;
    else if (stage === "child") s += 0.15;
    if (f.species === "octo" && (f.inkUntil || 0) > now) s -= 0.3;
    return Math.round(s * 1000) / 1000;
  }
  function weakestPrey(now, exact) {
    const prey = state.fish.slice();
    if (!prey.length) return null;
    let best = null, bestScore = -Infinity;
    prey.forEach(function (f) {
      /* murky water: the top of the list is not always the same fish */
      const s = preyScore(f, now) + (exact ? 0 : Math.random() * 0.12);
      if (s > bestScore) { bestScore = s; best = f; }
    });
    return best;
  }
  function stalkTarget(p) {
    if (!p.victim) return null;
    return state.fish.filter(function (f) { return f.id === p.victim; })[0] || null;
  }
  function predMax(p) { return p && p.elder ? PRED_STAT.jaws.hp : (PRED_STAT[p.kind] || PRED_STAT.pike).hp; }
  function predDmg(p) { return p && p.elder ? PRED_STAT.jaws.dmg : (PRED_STAT[p.kind] || PRED_STAT.pike).dmg; }
  function notePredator(p) {
    if (p.elder == null) p.elder = false;
    if (p.streak == null) p.streak = 0;
    p.maxHp = predMax(p);
    if (p.hp == null) p.hp = p.maxHp;
    p.hp = clamp(p.hp, 0, p.maxHp);
  }
  function becomeJaws(p) {
    p.elder = true;
    p.name = "JAWS";
    p.maxHp = PRED_STAT.jaws.hp;
    p.hp = Math.min(p.maxHp, Math.round((p.hp || PRED_STAT.shark.hp) + p.maxHp * 0.2));
    log("Greymaw becomes JAWS. It is larger, it stalks, and an eat hour can take two fish.");
    playSfx("omen");
  }
  function rollPredator(p, now, reason, allowBaby, countFail) {
    const victim = weakestPrey(now);
    /* two hunters in one glass see the same easy fish. The stronger one takes it, and
       the other loses the hour - which is how a hunter starves without ever missing. */
    if (victim && reason !== "contact") {
      const rival = (state.predators || []).filter(function (o) {
        return o !== p && o.adult && (o.fails || 0) < 2 && o.victim === victim.id;
      })[0];
      if (rival) {
        const mine = (p.hp || 1) / predMax(p) + (p.elder ? 0.4 : 0);
        const theirs = (rival.hp || 1) / predMax(rival) + (rival.elder ? 0.4 : 0);
        if (theirs > mine) {
          p.hp = clamp((p.hp || predMax(p)) - predMax(p) * 0.08, 0, predMax(p));
          p.victim = null;
          p.pending = false;
          p.nextRoll = now + HOUR;
          log(p.name + " and " + rival.name + " both want " + victim.name + ". " + rival.name +
            " is first to it. " + p.name + " loses the hour and takes a bite for trying.");
          return false;
        }
      }
    }
    p.pending = false;
    p.victim = null;
    p._stalkSaid = false;
    if (!victim) {
      if (countFail !== false) p.fails = (p.fails || 0) + 1;
      if (p.kind === "shark" && !p.elder) p.streak = 0;
      log(p.name + " finds no fish." + ((p.fails || 0) >= 2 ? " Two empty hours. It dies." : " It has one more hour."));
      p.nextRoll = now + HOUR;
      return false;
    }
    const chance = huntChance(victim, now);
    const roll = 1 + ((Math.random() * 100) | 0);
    const hit = roll <= Math.round(chance * 100);
    const shield = schoolSafety(victim);
    const def = defenseOf(victim.species);
    if (hit) {
      victim.cause = "hunt";
      bury(victim, now);
      state.fish = state.fish.filter(function (f) { return f !== victim; });
      if (selected === victim.id) selected = null;
      if (countFail !== false) p.fails = 0;
      let born = false;
      if (allowBaby && state.predators.length < HUNTER_CAP) {
        state.predators.push(makePredator(p.kind, false));
        born = true;
      } else if (allowBaby) {
        log("The hunter line is full at " + HUNTER_CAP + ". No baby this hour.");
      }
      if (p.elder) p.hp = Math.min(predMax(p), (p.hp || predMax(p)) + predMax(p) * 0.25);
      if (p.kind === "shark" && !p.elder) {
        p.streak = (p.streak || 0) + 1;
        if (p.streak >= 3) becomeJaws(p);
      }
      let bites = "";
      if (def.venom && Math.random() < def.venom * 0.35) {
        p.hp = clamp((p.hp || predMax(p)) - predMax(p) * 0.15, 0, predMax(p));
        bites = " The venom costs it.";
        if (p.hp <= 0) { p.fails = 2; bites += " It sinks."; }
      } else if (def.spines && Math.random() < def.spines * 0.3) {
        p.hp = clamp((p.hp || predMax(p)) - predMax(p) * 0.1, 0, predMax(p));
        bites = " The spines open a gill.";
        if (p.hp <= 0) { p.fails = 2; bites += " It sinks."; }
      }
      log(p.name + " rolls " + roll + " against " + Math.round(chance * 100) + "% and eats " + victim.name +
        (reason === "contact" ? " in the open" : shield > 0.25 ? ", cut out of the shoal" : ", the most exposed one") +
        (victim.species === "octo" && (victim.inkUntil || 0) > now ? " through the ink" : "") +
        (born ? ". A baby hunter is born." : ".") + bites);
      if (p.elder) keeperNote(p.name + " just took " + victim.name + ". I am sorry. Stay with the others.");
      else keeperNote(p.name + " took " + victim.name + ". The rest are still here.");
      addRipple(victim.x, victim.y);
      playSfx("bite");
      playSfx("death");
      p.forwardUntil = now + 20000;
      p.nextRoll = now + HOUR;
      return true;
    }
    if (countFail !== false) p.fails = (p.fails || 0) + 1;
    if (p.kind === "shark" && !p.elder) p.streak = 0;
    if (reason === "contact") state.dodge = (state.dodge || 0) + 1;
    /* the prey gets its shot back: spines and venom are not just a lower chance to bite */
    let pay = "";
    if (def.spines && Math.random() < def.spines * 0.45) {
      p.hp = clamp((p.hp || predMax(p)) - predMax(p) * (0.22 + Math.random() * 0.2), 0, predMax(p));
      pay = " " + victim.name + "'s spines draw blood.";
    } else if (def.venom && Math.random() < def.venom * 0.4) {
      p.hp = clamp((p.hp || predMax(p)) - predMax(p) * (0.16 + Math.random() * 0.16), 0, predMax(p));
      pay = " The venom burns.";
    } else if (def.armor && Math.random() < def.armor * 0.3) {
      pay = " The scales turn the bite.";
    }
    if (p.hp <= 0) { p.fails = 2; pay += " " + p.name + " is finished."; }
    log(p.name + " rolls " + roll + " against " + Math.round(chance * 100) + "% and misses " + victim.name +
      (reason === "contact" ? " at the last moment" : reason === "away" ? "" : ", which reached cover") +
      (shield > 0.25 ? ". The shoal closes around it" : "") +
      (victim.species === "octo" && (victim.inkUntil || 0) > now ? ". The ink takes 10% off the bite" : "") +
      "." + pay + ((p.fails || 0) >= 2 ? " Two misses in a row. It dies." : " It has one more hour."));
    p.forwardUntil = now + 16000;
    p.nextRoll = now + HOUR;
    return false;
  }
  function predatorBattle(a, b) {
    notePredator(a);
    notePredator(b);
    const until = Date.now() + 22000;
    a.forwardUntil = until;
    b.forwardUntil = until;
    a.goneUntil = 0;
    b.goneUntil = 0;
    playSfx("battle");
    const bits = [a.name + " and " + b.name + " fight."];
    for (let round = 0; round < 2 && a.hp > 0 && b.hp > 0; round += 1) {
      const da = Math.round(predDmg(a) * (0.82 + Math.random() * 0.36));
      const db = Math.round(predDmg(b) * (0.82 + Math.random() * 0.36));
      b.hp = Math.max(0, b.hp - da);
      a.hp = Math.max(0, a.hp - db);
      if (b.hp <= 0 && a.hp > 0) a.hp = Math.max(0, a.hp - Math.round(db * 0.7));
      if (a.hp <= 0 && b.hp > 0) b.hp = Math.max(0, b.hp - Math.round(da * 0.35));
      bits.push(a.name + " deals " + da + ". " + b.name + " deals " + db + ".");
    }
    if (a.hp <= 0) a.fails = 2;
    if (b.hp <= 0) b.fails = 2;
    bits.push(a.name + " " + Math.round(a.hp) + "/" + a.maxHp + " hp. " + b.name + " " + Math.round(b.hp) + "/" + b.maxHp + " hp.");
    log(bits.join(" "));
  }
  function runPredatorHour(now) {
    let spawnLeft = 1;
    const jaws = state.predators.filter(function (p) { return p.elder && p.adult && (p.fails || 0) < 2; })[0];
    const foes = state.predators.filter(function (p) {
      return p.adult && !p.elder && p.kind !== "shark" && (p.fails || 0) < 2;
    });
    let jawsBattled = false;
    if (jaws && foes.length && Math.random() < 0.5) {
      predatorBattle(jaws, foes[(Math.random() * foes.length) | 0]);
      jawsBattled = true;
      log("One predator battle this tank hour.");
    }
    state.predators.slice().forEach(function (p) {
      if (!p.adult || (p.fails || 0) >= 2) return;
      if (p.elder && jawsBattled) {
        log(p.name + " spent the hour fighting. The eat waits.");
        return;
      }
      if (p.elder) {
        let ate = 0;
        for (let i = 0; i < 2; i += 1) {
          const before = state.predators.length;
          if (rollPredator(p, now, "hour", spawnLeft > 0, false)) {
            ate += 1;
            if (state.predators.length > before) spawnLeft = 0;
          }
        }
        if (ate) {
          p.fails = 0;
          log(p.name + " recovers " + (ate * 25) + "% from the meal.");
        } else {
          p.fails = (p.fails || 0) + 1;
          log(p.name + ((p.fails || 0) >= 2 ? " misses two eat hours and dies." : " misses the eat hour. One hour left."));
        }
        return;
      }
      const before = state.predators.length;
      rollPredator(p, now, "hour", spawnLeft > 0, true);
      if (state.predators.length > before) spawnLeft = 0;
    });
  }
  let thanksQueued = false;
  function queueThanks() {
    if (playing) openThanks();
    else thanksQueued = true;
  }
  function openThanks() {
    const el = document.getElementById("thanksLayer");
    if (!el) return;
    thanksQueued = false;
    el.classList.remove("hidden");
  }
  function closeThanks() {
    const el = document.getElementById("thanksLayer");
    if (el) el.classList.add("hidden");
    thanksQueued = false;
  }
  function armStalk(now) {
    const due = state.huntAt || ((state.hourAt || now) + HOUR);
    if (now < due - STALK_LEAD || now >= due) return;
    if (state._stalkedHour === state.hourAt) return;
    let any = false;
    state.predators.forEach(function (p) {
      if (!p.adult || (p.fails || 0) >= 2) return;
      const victim = weakestPrey(now);
      p.pending = true;
      p.stalkAt = now;
      p.victim = victim ? victim.id : null;
      any = true;
      if (victim && !p._stalkSaid) {
        log(p.name + " turns toward " + victim.name + ", the weakest. The shoal scatters.");
        victim.startleT = 2.5;
        p._stalkSaid = true;
      }
    });
    if (any) {
      state._stalkedHour = state.hourAt;
      playSfx("chase");
    }
  }
  function onTankHour(now) {
    state.fish.forEach(function (f) {
      const fed = now - (f.lastFed || f.born) < FED_FAST;
      addGrowthHours(f, fed ? 2 : 1);
    });
    const living = state.predators.filter(function (p) { return (p.fails || 0) < 2; });
    if (!living.length) {
      if (!state.clearSince) state.clearSince = state.openedAt || now;
      if (hasPerk("sanctuary")) return;
      if (now - state.clearSince >= quietNeed()) {
        const kinds = ["pike", "cinder", "gar", "eel", "shark"];
        const kind = kinds[(Math.random() * kinds.length) | 0];
        if (state.predators.length >= HUNTER_CAP) {
          log("The hunter line is full at " + HUNTER_CAP + ". No new boss this hour.");
          return;
        }
        state.predators.push(makePredator(kind, true));
        state.clearSince = 0;
        log("Boss " + predOf(kind).name + " enters. One hunter a tank hour. A full fish is 25%. Two misses and it dies. You cannot stop it.");
        playSfx("chase");
      }
      return;
    }
    runPredatorHour(now);
  }
  function tickPredators(now) {
    state.predators = state.predators || [];
    state.predators.forEach(function (p) {
      if (p.pending == null) p.pending = false;
      if (p.heading == null) p.heading = p.vx < 0 ? Math.PI : 0;
      notePredator(p);
      if (!p.adult && now >= (p.adultAt || 0)) {
        p.adult = true;
        if (!p.elder) p.name = predOf(p.kind).name;
        p.nextRoll = (p.adultAt || now) + HOUR;
        log(p.name + " is grown. It hunts on the next tank hour.");
      }
    });
    if (!state.hourAt) state.hourAt = now;
    /* ---- a hunter's hour is not a stopwatch ----
       Every tank hour draws its own moment to happen in, anywhere between the top of the
       hour and the next one, and the draw is thrown away when the hour is spent. Nothing is
       carried over and nothing is seeded from the hour number, so no hour can repeat the
       hour before it - the roll is a fresh Math.random() each time, and a hunter, its baby,
       or the next boss can arrive at any second of the hour rather than on the stroke. */
    if (state.huntAt == null) {
      state.huntAt = state.hourAt + Math.floor(Math.random() * HOUR);
    }
    let guard = 0;
    while (now >= state.huntAt && guard < 72) {
      guard += 1;
      onTankHour(state.huntAt);
      state.hourAt += HOUR;
      state.huntAt = state.hourAt + Math.floor(Math.random() * HOUR);
    }
    if (guard) queueThanks();
    armStalk(now);
    const before = state.predators.length;
    state.predators = state.predators.filter(function (p) { return (p.fails || 0) < 2; });
    if (state.predators.length > HUNTER_CAP) {
      state.predators.sort(function (a, b) {
        return (b.elder ? 2 : b.adult ? 1 : 0) - (a.elder ? 2 : a.adult ? 1 : 0);
      });
      state.predators = state.predators.slice(0, HUNTER_CAP);
    }
    if (before && !state.predators.length) state.clearSince = now;
    if (!state.predators.length) {
      if (!state.clearSince) state.clearSince = state.openedAt || now;
    } else state.clearSince = 0;
  }
  function predClose(p, now) {
    return !!(p && (p.pending || now < (p.forwardUntil || 0)));
  }
  function stepPredator(p, dt) {
    const now = Date.now();
    if (p.phase == null) p.phase = Math.random() * 6.28;
    if (p.depth == null) p.depth = 0.16;
    if (p.away == null) p.away = 0;
    if (p.backAt == null) p.backAt = now + 30000;
    const close = predClose(p, now);
    if (close) p.goneUntil = 0;
    else if (!(p.goneUntil > now) && now > p.backAt && Math.random() < dt * 0.01) {
      p.goneUntil = now + (120 + Math.random() * 180) * 1000;
      p.leaveX = Math.random() < 0.5 ? -0.28 : 1.28;
    }
    const leaving = !close && (p.goneUntil || 0) > now;
    if (leaving && !p._leftSaid) {
      p._leftSaid = true;
      log(p.name + " slips into the far water.");
    }
    if (!leaving) p._leftSaid = false;
    if (!leaving && p.away < 0.08 && p.goneUntil && now >= p.goneUntil) {
      p.backAt = now + (50 + Math.random() * 80) * 1000;
      p.goneUntil = 0;
    }
    p.depth += ((close ? 1 : 0.16) - p.depth) * Math.min(1, dt * (close ? 1.15 : 0.4));
    p.away += ((leaving ? 1 : 0) - p.away) * Math.min(1, dt * 0.35);
    const prey = p.pending ? stalkTarget(p) : null;
    if (p.pending && !prey) { p.pending = false; p.victim = null; }
    let sp = p.adult ? 0.13 : 0.07;
    let dx = 0, dy = 0;
    const leavingNow = !predClose(p, now) && (p.goneUntil || 0) > now;
    if (prey && !leavingNow) {
      const to = unitDir(p, prey.x, prey.y);
      dx = to.x * 2.2;
      dy = to.y * 2.2;
      sp = 0.58 * (p.adult ? 1 : 0.6);
      if (to.d < 0.3) sp *= 1.25;
      p.lunge = to.d < 0.16 ? 1 : 0;
      if (to.d < (p.elder ? 0.16 : (p.adult ? 0.11 : 0.05))) p.lunge = 1;
    } else if (leavingNow) {
      dx = (p.leaveX || 1.2) - p.x;
      dy = (0.42 - p.y) * 0.4;
      sp = 0.16;
    } else if ((p.away || 0) > 0.2) {
      dx = 0.5 - p.x;
      dy = 0.4 - p.y;
      sp = 0.1;
    } else if (Math.random() < dt * 0.4) {
      p.wanderA = (p.wanderA || 0) + (Math.random() - 0.5) * 1.6;
      dx = Math.cos(p.wanderA);
      dy = Math.sin(p.wanderA) * 0.5;
    } else {
      dx = Math.cos(p.wanderA == null ? 0 : p.wanderA);
      dy = Math.sin(p.wanderA == null ? 0 : p.wanderA) * 0.5;
    }
    const out = { x: dx, y: dy };
    if (!leavingNow && (p.away || 0) < 0.35) {
      decorSteer(p, out);
      wallSteer(p, out);
    }
    const mag = Math.hypot(out.x, out.y) || 1;
    const vx = out.x / mag * sp, vy = out.y / mag * sp * AR;
    const step = (sp * 3 + 0.05) * dt;
    p.vx += clamp(vx - p.vx, -step, step);
    p.vy += clamp(vy - (p.vy || 0), -step, step);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if ((p.away || 0) < 0.45) {
    if (p.x < 0.05) { p.x = 0.05; p.vx = Math.abs(p.vx) * 0.4; }
    if (p.x > 0.95) { p.x = 0.95; p.vx = -Math.abs(p.vx) * 0.4; }
    } else {
      p.x = clamp(p.x, -0.35, 1.35);
    }
    if (p.y < 0.1) { p.y = 0.1; p.vy = Math.abs(p.vy) * 0.4; }
    if (p.y > 0.86) { p.y = 0.86; p.vy = -Math.abs(p.vy) * 0.4; }
    const want = Math.atan2(p.vy / AR, p.vx);
    let diff = want - p.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    p.heading += clamp(diff, -1.6 * dt, 1.6 * dt);
    p.face = Math.cos(p.heading) >= 0 ? 1 : -1;
    p.bank = (p.bank || 0) + (clamp(clamp(diff, -1.6 * dt, 1.6 * dt) / Math.max(dt, 0.01) * 0.16, -0.3, 0.3) - (p.bank || 0)) * Math.min(1, dt * 4);
    p.phase += dt * (2.2 + Math.hypot(p.vx, p.vy / AR) * 22);
    if (p.kind === "eel") {
      if (!p.pending) p.zapSaid = false;
      p.zapT = Math.max(0, (p.zapT || 0) - dt);
      p.zapCd = (p.zapCd == null ? 0.6 : p.zapCd) - dt;
      if (p.zapCd <= 0) {
        p.zapT = p.pending ? 0.55 : 0.32;
        p.zapCd = p.pending ? 1.15 : (p.adult ? 3.1 : 4.6);
        if (p.adult) shockFish(p);
      }
    }
  }
  function shockFish(p) {
    const reach = p.pending ? 0.3 : 0.18;
    let hit = 0;
    state.fish.forEach(function (f) {
      const d = span3(f.x, f.y, depthOf(f), p.x, p.y, depthOf(p));
      if (d > reach) return;
      f.startleT = Math.max(f.startleT || 0, 1.6);
      f.hp = Math.max(1, (f.hp || 1) - (p.pending ? 5 : 2));
      const push = (f.x - p.x) || (Math.random() - 0.5);
      f.vx += push * 1.1;
      f.vy += (f.y - p.y) * 0.35;
      hit += 1;
    });
    if (hit && p.pending && !p.zapSaid) {
      p.zapSaid = true;
      log(p.name + " cracks the water. " + hit + (hit > 1 ? " fish jolt." : " fish jolts."));
    }
  }
  function drawPredator(p, w, h, now) {
    const age = p.adult ? "adult" : "baby";
    let key = p.kind + "_" + age;
    if (p.kind === "shark" && p.elder) {
      const stalking = p.pending && ((Math.floor(now / 280) % 2) === 1);
      key = stalking ? "shark_elder_stalk" : "shark_elder";
    } else if (p.kind === "eel" && (p.zapT || 0) > 0) {
      const alt = p.adult && ((Math.floor(now / 140) % 2) === 1);
      key = alt ? "eel_adult_zap2" : (key + "_zap");
    }
    const img = PRED_SPRITES[key] || PRED_SPRITES[p.kind + "_" + age];
    if ((p.away || 0) > 0.97) return;
    const depth = p.depth == null ? 0.2 : p.depth;
    const far = 0.36 + depth * 0.64;
    const sc = (p.elder ? 1.9 : (p.kind === "eel" ? (p.adult ? 0.72 : 0.4) : (p.adult ? 1.35 : 0.55))) * far;
    const bh = Math.min(h * (p.kind === "eel" ? 0.13 : 0.2), p.kind === "eel" ? 86 : 140) * sc;
    let bw = bh * 2.2;
    if (img && img.complete && img.naturalWidth) bw = bh * (img.naturalWidth / img.naturalHeight);
    if (p.kind === "eel") {
      bw = Math.min(w * 0.46, 520) * (p.adult ? 1 : 0.52) * far;
      bh = img && img.complete && img.naturalWidth ? bw * (img.naturalHeight / img.naturalWidth) : bw * 0.22;
    }
    const x = p.x * w;
    const y = (p.y * depth + 0.4 * (1 - depth)) * h;
    const alpha = (0.32 + depth * 0.68) * (1 - (p.away || 0) * 0.9);
    if (depth > 0.62) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#240608";
    ctx.beginPath();
    ctx.ellipse(x, h * 0.92, bw * 0.3, bh * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    }
    if (p.pending && depth > 0.55) {
      const pulse = state.opts.motion === false ? 0.5 : 0.45 + Math.sin(now / 300) * 0.35;
      const g = ctx.createRadialGradient(x, y, 2, x, y, bh * 1.6);
      g.addColorStop(0, "rgba(251,113,133," + (0.22 * pulse).toFixed(3) + ")");
      g.addColorStop(1, "rgba(251,113,133,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - bh * 1.7, y - bh * 1.7, bh * 3.4, bh * 3.4);
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    if (depth < 0.82) ctx.filter = "saturate(0.62) brightness(0.78)";
    ctx.translate(x, y);
    ctx.scale(p.face === -1 ? -1 : 1, 1);
    const wag = state.opts.motion === false ? 0 : Math.sin(p.phase || 0) * (p.kind === "eel" && p.zapT > 0 ? 0.02 : (p.pending ? 0.09 : 0.045));
    ctx.rotate(wag + (p.bank || 0) * 0.5);
    if (img && img.complete && img.naturalWidth) ctx.drawImage(img, -bw / 2, -bh / 2, bw, bh);
    ctx.restore();
    if (p.kind === "eel" && p.zapT > 0 && state.opts.motion !== false) {
      const pulse = 0.45 + Math.sin(now / 80) * 0.35;
      const glow = ctx.createRadialGradient(x, y, 2, x, y, Math.max(24, bw * 0.45));
      glow.addColorStop(0, "rgba(186,240,255," + (0.28 * pulse).toFixed(3) + ")");
      glow.addColorStop(1, "rgba(120,200,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - bw * 0.6, y - bh, bw * 1.2, bh * 2);
      ctx.save();
      ctx.globalAlpha = Math.min(0.9, p.zapT * 2);
      ctx.strokeStyle = "rgba(214,246,255,0.9)";
      ctx.lineWidth = 1.6;
      const face = p.face === -1 ? -1 : 1;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + face * bw * 0.18, y);
        let px = x + face * bw * 0.18;
        let py = y;
        for (let s = 1; s <= 5; s += 1) {
          px += face * bw * 0.07;
          py += Math.sin(now / 45 + s * 1.7 + i) * bh * 0.22;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    if (state.opts.names !== false && depth > 0.62 && (p.away || 0) < 0.35) {
      ctx.fillStyle = "#fb7185";
      ctx.font = "700 13px Syne, sans-serif";
      ctx.textAlign = "center";
      const wait = Math.max(0, (p.nextRoll || now) - now);
      ctx.fillText(p.name + (p.adult ? "" : " · baby"), x, y - bh / 2 - 8);
      ctx.font = "600 11px Source Sans 3, sans-serif";
      const hpLine = p.maxHp ? (Math.round(p.hp || 0) + "/" + p.maxHp + " hp") : "";
      ctx.fillText((p.pending ? "stalking" : (p.adult ? ("hunts in " + hours(wait) + "h") : ("grows " + hours(Math.max(0, (p.adultAt || now) - now)) + "h"))) + (hpLine ? " · " + hpLine : ""), x, y - bh / 2 + 6);
    }
  }
  /* ---------------- generations: courtship, eggs, fry ---------------- */
  function fryName(sp) {
    const base = specOf(sp).name;
    const taken = state.fish.filter(function (f) { return f.name.indexOf(base) === 0; }).length;
    return taken ? base + " " + (taken + 1) : base;
  }
  function eggSpot() {
    const spots = decorOf().filter(function (d) { return d.egg; });
    if (!spots.length) return { x: 0.5, y: 0.8 };
    return spots[(Math.random() * spots.length) | 0];
  }
  /* ---- who breeds, how fast, and how reliably ----
     cd    minutes before that species comes round again
     min   water quality it insists on
     eggs  the clutch it lays, low to high
     roll  the odds the courtship takes at all: the fast schoolers spawn often and miss
           often, the slow ones wait longer and almost never waste the trip
     mature  the stage it must reach first */
  const BREED = {
    glimmer:  { cd: 30, min: 52, eggs: [2, 4], roll: 0.55, mature: "adult" },
    dart:     { cd: 24, min: 50, eggs: [2, 4], roll: 0.5, mature: "adult" },
    moss:     { cd: 28, min: 50, eggs: [2, 4], roll: 0.55, mature: "adult" },
    azure:    { cd: 34, min: 56, eggs: [2, 3], roll: 0.6, mature: "adult" },
    pearl:    { cd: 38, min: 60, eggs: [1, 3], roll: 0.7, mature: "adult" },
    puff:     { cd: 40, min: 58, eggs: [1, 3], roll: 0.68, mature: "adult" },
    lantern:  { cd: 46, min: 62, eggs: [1, 2], roll: 0.72, mature: "adult" },
    mask:     { cd: 52, min: 66, eggs: [1, 3], roll: 0.75, mature: "adult" },
    veil:     { cd: 58, min: 68, eggs: [1, 2], roll: 0.8, mature: "adult" },
    ruby:     { cd: 60, min: 70, eggs: [1, 2], roll: 0.85, mature: "elder" },
    sunscale: { cd: 72, min: 74, eggs: [1, 2], roll: 0.92, mature: "elder" },
    tusk:     { cd: 80, min: 72, eggs: [1, 2], roll: 0.92, mature: "elder" },
    mandarin: { cd: 76, min: 76, eggs: [1, 2], roll: 0.9, mature: "elder" },
    pepper:   { cd: 84, min: 78, eggs: [1, 2], roll: 0.9, mature: "elder" },
    claw:     { cd: 92, min: 80, eggs: [1, 2], roll: 0.95, mature: "elder" },
    crab:     { cd: 98, min: 82, eggs: [1, 2], roll: 0.95, mature: "elder" },
    octo: null,     /* one octopus keeps this glass, and it does not breed in it */
    dragon: null    /* nor does the seadragon */
  };
  const BREED_RETRY = 4 * 60000;
  function breedOf(species) { return BREED[species] || null; }
  function breedReady(stage, b) {
    if (b.mature === "elder") return stage === "elder" || stage === "adult";
    return stage === "adult" || stage === "elder";
  }
  function layEggs(a, b, now) {
    const spot = eggSpot();
    const room = EGG_CAP - state.eggs.length;
    if (room <= 0) return;
    const clutch = (breedOf(a.species) || { eggs: [2, 3] }).eggs;
    const span = Math.max(0, clutch[1] - clutch[0]);
    const n = Math.min(room, clutch[0] + Math.round(Math.random() * span));
    const fast = (state.quality || 0) >= 82;
    for (let i = 0; i < n; i += 1) {
      state.eggs.push({
        id: uid(),
        species: a.species,
        x: clamp(spot.x + (Math.random() - 0.5) * 0.05, 0.06, 0.94),
        y: clamp(spot.y + (Math.random() - 0.5) * 0.04, 0.1, 0.86),
        laid: now,
        hatchAt: now + (fast ? HATCH_MS * 0.7 : HATCH_MS) * (hasPerk("quickfry") ? 0.65 : 1),
        gen: Math.max(a.gen || 1, b.gen || 1) + 1,
        traits: makeTraits(traits(a), traits(b)),
        parents: [a.dna, b.dna].filter(isDna),
        parentNames: [a.name, b.name]
      });
    }
    log(a.name + " and " + b.name + " leave " + n + " " + specOf(a.species).name + " eggs on the rockwork.");
    addRipple(clamp(spot.x, 0.06, 0.94), clamp(spot.y, 0.1, 0.86));
    save();
  }
  function tickEggs(now) {
    state.eggs = state.eggs || [];
    if (!state.eggs.length) return;
    const hatchList = [], lostList = [];
    const foul = (state.quality || 100) < 22;
    state.eggs.forEach(function (e) {
      if (now >= e.hatchAt) hatchList.push(e);
      else if (foul) lostList.push(e);
    });
    if (lostList.length) {
      state.eggs = state.eggs.filter(function (e) { return lostList.indexOf(e) < 0; });
      log(lostList.length + " egg" + (lostList.length > 1 ? "s" : "") + " never hatch. The water is foul.");
      save();
    }
    hatchList.forEach(function (e) {
      state.eggs = state.eggs.filter(function (o) { return o !== e; });
      if (!canAdd(e.species)) { log("An egg hatches but the glass has no room."); return; }
      if (e.species === "octo" && hasOcto()) { log("An octopus egg fades. One already keeps this glass."); return; }
      const fry = makeFish(e.species, fryName(e.species));
      fry.traits = e.traits || makeTraits();
      fry.gen = e.gen || 2;
      fry.parents = (e.parents || []).filter(isDna).slice(0, 2);
      fry.parentNames = (e.parentNames || []).slice(0, 2);
      fry.born = now;
      fry.genes = { born: now, salt: dnaSalt() };
      giveDna(fry, true);
      fry.x = e.x;
      fry.y = e.y;
      fry.vx = 0.01;
      state.fish.push(fry);
      state.hatched = (state.hatched || 0) + 1;
      state.gen = Math.max(state.gen || 1, fry.gen);
      if (!RPG()) state.points += 12;
      log("A fry hatches by the rockwork: " + fry.name + ", generation " + fry.gen + ", from " +
        (fry.parentNames.join(" and ") || "the pair") + ". DNA " + fry.dna + (RPG() ? ". A new line in the run." : ". +12"));
      addRipple(e.x, e.y);
      save();
    });
  }
  function breedCheck(now) {
    if (!playing || !state) return;
    state.eggs = state.eggs || [];
    if (typeof state._breedAt === "number") state._breedAt = {};
    if (typeof state._breedTry === "number") state._breedTry = {};
    state._breedAt = state._breedAt || {};
    state._breedTry = state._breedTry || {};
    if (state.eggs.length >= EGG_CAP) return;
    if (state.fish.length >= HARD_CAP) return;
    if ((state.quality || 0) < 50 || (state.algae || 0) > 65) return;
    /* each species is asked in turn, and only one pair courts per pass */
    const ids = Object.keys(BREED);
    for (let k = 0; k < ids.length; k += 1) {
      const id = ids[k];
      const b = breedOf(id);
      if (!b) continue;
      if ((state.quality || 0) < b.min) continue;
      if (!canAdd(id) && fishLoad() + EGG_LOAD * 2 > loadCap()) continue;
      /* An RPG run breeds on a window rather than a species clock, and the window picks its
         own moment: a fresh draw the second the last one bred, anywhere from the top of the
         window to its end, thrown away once it is spent. Nothing is carried over and nothing
         is seeded, so no window repeats the window before it. */
      const win = (RPG() ? Math.min(b.cd, LOOP.rpgBreedMin) : b.cd) * 60000;
      const wait = (RPG() && state._breedWait && state._breedWait[id] != null) ? state._breedWait[id] : win;
      if (now - (state._breedAt[id] || 0) < wait) continue;
      /* a missed courtship costs a short retry, never the whole cadence, and a species
         with no willing pair in the water does not burn its clock at all */
      if (now - (state._breedTry[id] || 0) < BREED_RETRY) continue;
      const ready = state.fish.filter(function (f) {
        const grown = stageName(bodyAge(f), f.species);
        return f.species === id && breedReady(grown, b) &&
          bodyAge(f) <= cycleOf(f.species)[5] * HOUR * 0.9 &&
          (f.hp || 0) >= vitals(f).hp * 0.7 &&
          now - (f.lastFed || f.born) < (RPG() ? LOOP.rpgFedForBreed : 3 * HOUR) &&
          now - (f.spawnCd || 0) > 30 * 60000;
      });
      if (ready.length < 2) continue;
      let pair = null;
      for (let i = 0; i < ready.length && !pair; i += 1) {
        for (let j = i + 1; j < ready.length; j += 1) {
          if (ready[i].sex !== ready[j].sex) { pair = [ready[i], ready[j]]; break; }
        }
      }
      if (!pair) continue;
      if (Math.random() > b.roll) { state._breedTry[id] = now; continue; }
      state._breedAt[id] = now;
      state._breedTry[id] = 0;
      if (RPG()) {
        state._breedWait = state._breedWait || {};
        state._breedWait[id] = Math.floor(Math.random() * win);
      }
      return court(pair, now);
    }
    return false;
  }
  function court(pair, now) {
    pair.forEach(function (f) {
      f.courtT = 7;
      f.spawnCd = now;
      mem(f).courtedAt = now;
      f.lastPlay = now;
      f.state = "court";
      f.idleT = 7;
      f.actionT = 0;
      f.action = "";
    });
    state.court = (state.court || 0) + 1;
    const layer = pair[0].sex === "f" ? pair[0] : pair[1];
    layer.layAt = now + 7000;
    log(pair[0].name + " and " + pair[1].name + " turn slow circles. " + specOf(pair[0].species).name + " eggs are coming.");
    return true;
  }
  function spawnLayCheck(now) {
    state.fish.forEach(function (f) {
      if (f.layAt && now >= f.layAt) {
        f.layAt = 0;
        const mate = state.fish.filter(function (o) {
          return o !== f && o.species === f.species && now - (o.spawnCd || 0) < 30000;
        })[0];
        if (mate) layEggs(f, mate, now);
      }
    });
  }
  /* ---------------- first-time marks ---------------- */
  function checkGoals(now) {
    state.goals = state.goals || {};
    const counts = {};
    state.fish.forEach(function (f) { counts[f.species] = (counts[f.species] || 0) + 1; });
    const anySpeciesAt = function (n) {
      return Object.keys(counts).some(function (k) { return counts[k] >= n; });
    };
    let oldest = 0;
    state.fish.forEach(function (f) { oldest = Math.max(oldest, bodyAge(f)); });
    const met = {
      adult: state.fish.some(function (f) {
        const s = stageName(bodyAge(f), f.species);
        return s === "adult" || s === "elder";
      }),
      court: (state.court || 0) >= 1,
      hatch: (state.hatched || 0) >= 1,
      dodge: (state.dodge || 0) >= 1,
      eight: state.fish.length >= 8,
      crew5: (state.crew || []).length >= 5,
      school: anySpeciesAt(6),
      elder: state.fish.some(function (f) { return stageName(bodyAge(f), f.species) === "elder"; }),
      hundred: state.fish.some(function (f) { return ageOf(f, now) >= 100 * HOUR; }),
      twenty: state.fish.length >= 20,
      clear: (state.quality || 0) >= 95 && state.fish.length >= 12,
      gen3: (state.gen || 1) >= 3,
      thirty: state.fish.length >= 30,
      allten: SPECIES.every(function (s) { return counts[s.id]; })
    };
    GOALS.forEach(function (g) {
      if (state.goals[g.id] || !met[g.id]) return;
      state.goals[g.id] = now;
      if (!RPG()) state.points += g.pay;
    log("First time — " + g.text + ". " + (RPG() ? "A mark for the run." : "+" + g.pay + " pts."));
      save();
    });
  }
  /* ---------------- ambient water: motes, ripples, air ---------------- */
  function seedMotes() {
    motes = [];
    for (let i = 0; i < 42; i += 1) {
      motes.push({
        x: Math.random(), y: Math.random(), z: 0.12 + Math.random() * 0.88,
        r: 0.6 + Math.random() * 1.7, ph: Math.random() * 6.28
      });
    }
  }
  function addRipple(x, y) {
    if (!state || state.opts.motion === false) return;
    if (ripples.length > 24) return;
    ripples.push({ x: x, y: y, r: 0.008, t: 0 });
  }
  function stepAmbient(dt, now) {
    if (!motes.length) seedMotes();
    if (state.opts.motion === false) return;
    motes.forEach(function (m) {
      m.ph += dt * (0.35 + m.z * 0.7);
      m.x += (0.004 + m.z * 0.01) * dt + Math.sin(m.ph) * 0.0035 * dt;
      m.y -= 0.0035 * dt;
      if (m.x > 1.02) m.x = -0.02;
      if (m.y < -0.02) m.y = 1.02;
    });
    ripples.forEach(function (r) { r.t += dt; r.r += dt * 0.2; });
    if (ripples.length) ripples = ripples.filter(function (r) { return r.t < 2.4; });
  }
  function catchUp(now) {
    const dead = [];
    state.fish.forEach(function (f) {
      accrueGrowth(f, now);
      tickHealth(f, now);
      const unfed = now - (f.lastFed || f.born) > foodWindow(f);
      const old = bodyAge(f) >= lifeOf(f);
      if ((f.hp || 0) <= 0 || old) {
        f.cause = old ? "age" : (unfed ? "hunger" : "filth");
        dead.push(f);
      }
    });
    const retired = [];
    (state.crew || []).forEach(function (c) {
      if (now - c.born >= CREW_LIFE) retired.push(c);
    });
    if (retired.length) {
      retired.forEach(function (c) { log(c.name + " finishes a month of work."); });
      state.crew = state.crew.filter(function (c) { return retired.indexOf(c) < 0; });
    }
    tickPredators(now);
    tickEggs(now);
    if (dead.length) {
      playSfx("death");
      dead.forEach(function (f) { bury(f, now); });
      state.fish = state.fish.filter(function (f) { return dead.indexOf(f) < 0; });
      if (selected && dead.some(function (f) { return f.id === selected; })) selected = null;
      if (!state.fish.length) {
        const sp = SPECIES[(Math.random() * SPECIES.length) | 0].id;
        const fry = makeFish(sp, "Fry");
        state.fish.push(fry);
        selected = fry.id;
        log("The glass was empty. A fry drifted in so the tank can go on.");
      }
      save();
    } else if (retired.length) save();
    state.fish.forEach(function (f) {
      const close = STARVE - (now - (f.lastFed || f.born)) < 6 * HOUR;
      if (close && !f.warned) {
        if (f.hp > 0) log(f.name + " has not eaten in a while.");
        f.warned = true;
      } else if (!close && f.warned) f.warned = false;
    });
    if (now - (state._lifeAt || 0) > 5000) {
      state._lifeAt = now;
      spawnLayCheck(now);
      breedCheck(now);
      checkGoals(now);
      fetchHall();
    }
  }
  function award(f, n, why) {
    const mood = moodOf(f, Date.now());
    const gain = Math.max(1, Math.round(n * (mood === "happy" ? 1.25 : mood === "sad" ? 0.5 : 1)));
    if (!RPG()) state.points += gain;
    f.lastPlay = Date.now();
    /* a run pays in hours, not points, so its log says what the fish did and nothing more */
    log(f.name + " " + why + (RPG() ? "" : " +" + gain));
  }
  function nearest(f) {
    let best = null, bd = 1e9;
    state.fish.forEach(function (o) {
      if (o === f) return;
      const d = Math.hypot(o.x - f.x, o.y - f.y);
      if (d < bd) { bd = d; best = o; }
    });
    return best;
  }
  function startPlay(f) {
    const kind = specOf(f.species).play;
    const other = nearest(f);
    f.action = kind;
    f.actionT = kind === "jump" ? 1.1 : kind === "race" ? 2.4 : 1.8;
    if (kind === "race" && other) {
      other.action = "race";
      other.actionT = 2.4;
      f.tx = 0.9; other.tx = 0.9;
      award(f, 8, "races " + other.name);
    } else if (kind === "boop" && other) {
      f.tx = other.x; f.ty = other.y;
      other.action = "boop";
      other.actionT = 1.2;
      award(f, 6, "play-bumps " + other.name);
    } else if (kind === "jump") {
      f.splashAt = Date.now() + 1150;
      award(f, 7, "jumps the surface");
    } else if (kind === "glow") {
      award(f, phase() === "night" ? 10 : 4, phase() === "night" ? "lights the night tank" : "glimmers");
    } else if (kind === "clean") {
      f.ty = 0.82;
      award(f, 6, "cleans the gravel");
    } else if (kind === "school") {
      award(f, 3 + Math.min(6, state.fish.length), "keeps the school together");
    } else if (kind === "dance") {
      award(f, 6, "dances a slow circle");
    } else if (kind === "lap") {
      award(f, 8, "finishes a long lap");
    } else if (kind === "flare") {
      award(f, 6, "flares");
    } else if (kind === "flash") {
      award(f, 5, "flashes a fan tail");
    } else if (kind === "snap") {
      award(f, 4, "clicks a gold claw");
    } else if (kind === "scuttle") {
      state.algae = clamp((state.algae || 0) - 1.5, 0, 100);
      award(f, 4, "scuttles the sand and lifts a little waste");
    } else {
      award(f, 4, "plays");
    }
  }

  function phase() {
    const mode = state && state.opts && state.opts.clock;
    if (mode === "day") return "day";
    if (mode === "night") return "night";
    const h = new Date().getHours();
    if (h >= 6 && h < 17) return "day";
    if (h >= 17 && h < 20) return "dusk";
    return "night";
  }

  function temperOf(f) { return specOf(f.species).temper === "chill" ? "chill" : "lively"; }
  function socialOf(f) { return specOf(f.species).social === "loner" ? "loner" : "school"; }
  function motionOf(f) { return MOTION[f.species] || MOTION.glimmer; }
  function bandOf(f) { return motionOf(f).band; }
  function traits(f) {
    if (!f.traits) f.traits = { bold: 0.5, social: 0.5, appetite: 0.5, vigor: 0.5 };
    const t = f.traits;
    ["bold", "social", "appetite", "vigor"].forEach(function (k) { if (t[k] == null) t[k] = 0.5; });
    return t;
  }
  function traitWord(k, v) { return TRAIT_WORDS[k][clamp(Math.round(v * 4), 0, 4)]; }
  function makeTraits(pa, pb) {
    const out = {};
    ["bold", "social", "appetite", "vigor"].forEach(function (k) {
      const base = pa ? (pa[k] + (pb ? pb[k] : pa[k])) / 2 : 0.5;
      out[k] = clamp(base + (Math.random() - 0.5) * 0.32, 0.05, 0.95);
    });
    return out;
  }
  function comfort(f) {
    const band = TEMP_BAND[f.species] || [22, 28];
    const t = tempAt(f ? f.y : null);
    let raw = 0;
    if (t < band[0]) raw = band[0] - t;
    else if (t > band[1]) raw = t - band[1];
    return raw * mixScale().temp;
  }
  function tempNote(f) {
    if (comfort(f) <= 1.5) return "";
    const band = TEMP_BAND[f.species] || [22, 28];
    return (state.temp || 25) > band[1] ? "too warm" : "too cold";
  }
  function decorOf() { return DECOR[themeOf(state.theme).id] || DECOR.river; }
  function nearestShelter(x, y, far) {
    let best = null, bd = 1e9;
    decorOf().forEach(function (d) {
      if (!d.shelter) return;
      const dist = Math.hypot((x - d.x) / d.rx, (y - d.y) / d.ry);
      if (dist < bd) { bd = dist; best = d; }
    });
    return best && bd < (far == null ? 1.7 : far) ? best : null;
  }
  function nearestBottomRock(f) {
    let best = null, bd = 1e9;
    decorOf().forEach(function (d) {
      if (d.kind !== "solid" || d.y < 0.4) return;
      const dist = Math.hypot(f.x - d.x, (f.y - d.y) * AR);
      if (dist < bd) { bd = dist; best = d; }
    });
    return best;
  }
  function stageSpeed(stage) {
    return stage === "baby" ? 0.55 : stage === "infant" ? 0.72 : stage === "child" ? 0.86 : stage === "teen" ? 0.96 : 1;
  }
  /* One place that decides how fast a fish may go right now. */
  function speedOf(f, now, mode) {
    const m = motionOf(f);
    const tr = traits(f);
    const stageF = stageSpeed(stageName(bodyAge(f), f.species)) * (1.14 - 0.24 * specOf(f.species).bulk);
    const hunger = clamp((now - (f.lastFed || f.born)) / Math.max(1, foodWindow(f)), 0, 1.2);
    const vigor = 0.84 + tr.vigor * 0.34;
    if (mode === "burst") return m.burst * stageF * (1 + hunger * 0.25) * vigor;
    if (mode === "panic") {
      const left = clamp(f.stamina == null ? 1 : f.stamina, 0, 1);
      return m.burst * stageF * 0.94 * (0.78 + tr.bold * 0.5) * vigor * (0.55 + 0.45 * left);
    }
    if (mode === "rest") return m.cruise * stageF * 0.28;
    const mood = moodOf(f, now);
    const moodF = mood === "happy" ? 1.18 : mood === "sad" ? 0.62 : 1;
    return m.cruise * stageF * (1 + hunger * 0.3) * moodF * vigor;
  }
  function fishSprint(f) {
    const now = Date.now();
    const starving = STARVE - (now - (f.lastFed || f.born)) < 8 * HOUR;
    return speedOf(f, now, starving ? "burst" : "cruise");
  }
  /* Food choice: distance over the fish's own top speed, tilted toward the
     depth the species feeds at, and off flakes a faster rival will reach first. */
  function nearestFlake(f) {
    if (!flakes.length) return null;
    const now = Date.now();
    const band = bandOf(f);
    const mid = (band[0] + band[1]) / 2;
    const starving = STARVE - (now - (f.lastFed || f.born)) < 8 * HOUR;
    const mine = Math.max(0.02, speedOf(f, now, starving ? "burst" : "cruise") * (1 + traits(f).appetite * 0.3));
    let best = null, bestScore = 1e9;
    flakes.forEach(function (fl) {
      if (fl.gone) return;
      const d = span3(fl.x, fl.y, 0.86, f.x, f.y, depthOf(f));
      let score = d / mine * (1 + Math.abs(fl.y - mid) * 1.5);
      const hour = rhythm();
      if (hour === "dawn" || hour === "dusk") score -= 0.35;
      if (band[0] > 0.5 && fl.y < 0.52) score += 0.9;
      if ((f.species === "mandarin" || f.species === "dragon") && !starving) score += 1.35;
      if (f.species === "tusk") score -= 0.2;
      if (band[1] < 0.48 && fl.y > 0.72) score += 0.7;
      if (!starving) {
        state.fish.forEach(function (o) {
          if (o === f) return;
          const od = span3(fl.x, fl.y, 0.86, o.x, o.y, depthOf(o));
          if (od / Math.max(0.02, fishSprint(o)) + 0.05 < d / mine) score += 0.5;
        });
      }
      if (score < bestScore) { bestScore = score; best = fl; }
    });
    return best;
  }
  function unitDir(f, tx, ty) {
    const dx = tx - f.x, dy = (ty - f.y) * AR;
    const d = Math.hypot(dx, dy) || 1;
    return { x: dx / d, y: dy / d, d: d };
  }
  function patrolPoint(f) {
    const band = bandOf(f);
    const t = traits(f);
    return {
      x: clamp(0.12 + Math.random() * 0.76, 0.1, 0.9),
      y: clamp(band[0] + (band[1] - band[0]) * (0.15 + Math.random() * 0.7) - t.bold * 0.05, 0.15, 0.86)
    };
  }
  /* Slow, smooth heading drift: why fish paths curve instead of jitter. */
  function wanderDir(f, now, dt) {
    if (f.wseed == null) f.wseed = Math.random() * 90;
    const w = f.wseed;
    if (f.wanderA == null) f.wanderA = f.vx < 0 ? Math.PI : 0;
    const n = Math.sin(now / 3300 + w) * 0.55 + Math.sin(now / 1100 + w * 1.7) * 0.3 + Math.sin(now / 470 + w * 2.1) * 0.15;
    f.wanderA += n * dt * 0.9;
    return { x: Math.cos(f.wanderA), y: Math.sin(f.wanderA) * 0.5 };
  }
  /* ---------------------------------------------------------------
     Brains. Each fish keeps a memory and a small social record:
     who it swims with, who pushed it, where it hid, when it last ate.
     --------------------------------------------------------------- */
  let simDt = 0.016;
  let frameId = 0;
  let anchorCache = { frame: -1, by: {} };
  function hashId(id) {
    let h = 7;
    const str = String(id || "");
    for (let i = 0; i < str.length; i += 1) h = (h * 131 + str.charCodeAt(i)) % 2147483647;
    /* avalanche: short ids like f0, f1 must not land on the same patch */
    h = (h ^ (h >>> 13)) * 1274126177 % 2147483647;
    return Math.abs(h ^ (h >>> 16)) % 1000003;
  }
  const BOND_KEEP = 8;
  function bond(f, o, delta) {
    if (!f.bonds) f.bonds = {};
    const next = clamp((f.bonds[o.id] || 0) + delta, -1, 1);
    if (next === 0) delete f.bonds[o.id];
    else f.bonds[o.id] = next;
    f._bondPrune = (f._bondPrune || 0) + 1;
    if (f._bondPrune > 900) { f._bondPrune = 0; pruneBonds(f); }
  }
  function pruneBonds(f) {
    if (!f.bonds) return;
    const keys = Object.keys(f.bonds);
    keys.forEach(function (k) { if (Math.abs(f.bonds[k]) < 0.01) delete f.bonds[k]; });
    const left = Object.keys(f.bonds);
    if (left.length <= BOND_KEEP) return;
    const keys2 = left;
    keys2.sort(function (a, b) { return Math.abs(f.bonds[b]) - Math.abs(f.bonds[a]); });
    keys2.slice(BOND_KEEP).forEach(function (k) { delete f.bonds[k]; });
  }
  function bondPick(f, want, min) {
    if (!f.bonds) return null;
    const floor = min == null ? 0.25 : min;
    let best = null, bestV = want > 0 ? floor : -floor;
    Object.keys(f.bonds).forEach(function (id) {
      const v = f.bonds[id];
      if (want > 0 ? v > bestV : v < bestV) { bestV = v; best = id; }
    });
    const o = state.fish.filter(function (x) { return x.id === best; })[0];
    return o ? { f: o, v: bestV } : null;
  }
  function mem(f) {
    if (!f.mem) f.mem = { shoves: 0, meals: 0 };
    return f.mem;
  }
  function hidingSpot(f) {
    if (!f.mem || !f.mem.hidSpot) return null;
    return Date.now() - (f.mem.hidAt || 0) > 240000 ? null : f.mem.hidSpot;
  }
  function wary(f, now) { return !!(f.mem && now - (f.mem.chasedAt || 0) < 150000); }
  /* The best social swimmer of a species leads the school; the rest keep slots. */
  function anchorOf(species) {
    if (anchorCache.frame !== frameId) anchorCache = { frame: frameId, by: {} };
    if (anchorCache.by[species] !== undefined) return anchorCache.by[species];
    let best = null, score = -1;
    const now = Date.now();
    state.fish.forEach(function (f) {
      if (f.species !== species || socialOf(f) !== "school") return;
      const t = traits(f);
      const sc = t.social * 0.6 + t.bold * 0.2 + specOf(f.species).bulk * 0.2 + Math.min(0.1, ageOf(f, now) / (10 * DAY) * 0.12);
      if (sc > score) { score = sc; best = f; }
    });
    anchorCache.by[species] = best;
    return best;
  }
  function isAnchor(f) { return anchorOf(f.species) === f; }
  function slotFor(f, anchor) {
    const i = (hashId(f.id) % 6) + 1;
    const h = anchor.heading == null ? (anchor.vx < 0 ? Math.PI : 0) : anchor.heading;
    const back = 0.045 + i * 0.03;
    const side = (i % 2 ? 1 : -1) * (0.015 + (i % 3) * 0.012);
    return {
      x: clamp(anchor.x - Math.cos(h) * back + Math.cos(h + Math.PI / 2) * side, 0.08, 0.92),
      y: clamp(anchor.y - Math.sin(h) * back * 0.4 + side * 0.7, 0.13, 0.87)
    };
  }
  function schoolSpread(f) {
    let far = 0;
    state.fish.forEach(function (o) { if (o !== f && o.species === f.species) far = Math.max(far, apart(f, o)); });
    return far;
  }
  /* Every fish keeps a patch of water. Loners hold theirs against their own kind. */
  function homeOf(f) {
    if (!f.home) {
      const band = bandOf(f);
      const h = hashId(f.id);
      const walker = !!motionOf(f).walk;
      f.home = {
        x: clamp(walker ? (h % 2 ? 0.22 : 0.78) : 0.14 + (h % 1000) / 1000 * 0.72, 0.12, 0.88),
        y: clamp(band[0] + (band[1] - band[0]) * (0.3 + (h % 100) / 100 * 0.4), 0.16, 0.86)
      };
    }
    return f.home;
  }
  function territorySteer(f, out) {
    if (motionOf(f).walk) return;
    const home = homeOf(f);
    const t = unitDir(f, home.x, home.y);
    const loner = socialOf(f) === "loner";
    if (t.d > (loner ? 0.26 : 0.42)) {
      const pull = loner ? 0.55 : 0.3;
      out.x += t.x * pull;
      out.y += t.y * pull;
    }
    if (!loner) return;
    state.fish.forEach(function (o) {
      if (o === f || o.species !== f.species) return;
      const d = apart(f, o);
      if (d > 0.13 || d < 0.0001) return;
      const oh = homeOf(o);
      if (Math.hypot(oh.x - home.x, (oh.y - home.y) * AR) < 0.22) return;
      const w = 0.95 * (1 - d / 0.13);
      const away = unitDir(f, o.x, o.y);
      out.x -= away.x * w;
      out.y -= away.y * w;
      if (Math.random() < 0.02) bond(f, o, -0.03);
    });
  }
  /* The cleaners are neighbours. Fish give the big ones room, follow the ones that
     stir the sand, and rest beside a sleeping turtle. */
  function crewSteer(f, out) {
    const crew = state.crew || [];
    if (!crew.length) return;
    const tr = traits(f);
    /* a fish that still has a meal in it will not chase a flake: that is what leaves food
       in the water to rot, and it is the whole reason over feeding costs a tank */
    const hungry = !isFull(f, Date.now());
    const floor = bandOf(f)[0] > 0.5;
    crew.forEach(function (c) {
      const d = Math.hypot(c.x - f.x, (c.y - f.y) * AR);
      if (d < 0.0001) return;
      if (c.role === "turtle" || c.role === "jelly") {
        const near = c.role === "turtle" ? 0.12 : (phase() === "night" ? 0.15 : 0.12);
        if (d < near) {
          const w = (near - d) / near * (c.role === "jelly" ? 1.5 : 1.2);
          out.x -= (c.x - f.x) / d * w;
          out.y -= (c.y - f.y) / d * w;
        }
      }
      if (floor && hungry && (c.role === "cory" || c.role === "turtle") && d < 0.3) {
        const pull = (0.3 - d) * (0.8 + tr.appetite * 0.7);
        out.x += (c.x - f.x) * pull * 2.4;
      }
      if (c.role === "turtle" && c.asleep && f.state === "rest" && d < 0.24) out.x += (c.x - f.x) * 0.6;
    });
  }
  /* Boids: separation always, alignment and cohesion by how social the fish is.
     A bigger fish shoves a smaller one aside, so the tank grows a pecking order. */
  function shoalSteer(f, out) {
    const m = motionOf(f);
    const tr = traits(f);
    const crowd = state.fish.length >= 30 ? 0.6 : 1;
    const hourF = rhythm() === "dusk" ? 1.3 : rhythm() === "dawn" ? 1.1 : 1;
    const social = (socialOf(f) === "school" ? 0.35 + tr.social * 0.7 : tr.social * 0.22) * crowd * hourF;
    const vision = m.vision * (0.8 + tr.social * 0.6);
    const sepR = (f.startleT > 0 ? 0.08 : 0.105) * (1.15 - tr.social * 0.25);
    const mineSize = Math.max(0.2, specOf(f.species).bulk * STAGE_DRAW[stageName(bodyAge(f), f.species)]);
    let ax = 0, ay = 0, cx = 0, cy = 0, vx = 0, vy = 0, n = 0;
    state.fish.forEach(function (o) {
      if (o === f) return;
      const dx = o.x - f.x, dy = (o.y - f.y) * AR;
      const d = apart(f, o);
      if (d > vision || d < 0.0001) return;
      const kin = f.species !== "mask" || o.species === "mask";
      if (kin && (socialOf(o) === "school" || o.species === f.species || d < sepR)) { n += 1; cx += o.x; cy += o.y; vx += o.vx; vy += o.vy / AR; }
      if (d < sepR) {
        const w = (sepR - d) / sepR;
        ax -= dx / d * w;
        ay -= dy / d * w;
      }
      if (d < 0.14) bond(f, o, (o.species === f.species ? 0.06 : 0.022) * simDt);
      else if (d < vision) bond(f, o, -0.012 * simDt);
      const sizeF = (specOf(o.species).bulk * STAGE_DRAW[stageName(bodyAge(o), o.species)]) / mineSize;
      if (sizeF > 1.12 && d < sepR * 1.8) {
        const w = (sizeF - 1.12) * (1 - d / (sepR * 1.8));
        ax -= dx / d * w * 1.5;
        ay -= dy / d * w * 1.5;
        /* it remembers the shove: a smaller fish keeps a wide berth from that one */
        if (sizeF > 1.25 && Math.random() < simDt * 0.7) {
          const mm = mem(f);
          if (mm.shovedBy !== o.id) { mm.shovedBy = o.id; mm.shoves += 1; }
          mm.shovedAt = Date.now();
          if (mm.shoves >= 3) { const tt = traits(f); tt.bold = clamp(tt.bold - 0.006, 0.05, 0.95); mm.shoves = 0; }
          mem(o).gave = (mem(o).gave || 0) + 1;
          if (Math.random() < 0.25) bond(f, o, -0.05);
        }
      }
      if (f.mem && f.mem.shovedBy === o.id && Date.now() - (f.mem.shovedAt || 0) < 60000) {
        const extra = 1 - d / (sepR * 2);
        if (extra > 0) { ax -= dx / d * extra * 1.3; ay -= dy / d * extra * 1.3; }
      }
    });
    if (n) {
      cx /= n; cy /= n;
      const coh = unitDir(f, cx, cy);
      ax += coh.x * social * 0.5;
      ay += coh.y * social * 0.5;
      const avx = vx / n, avy = vy / n;
      const av = Math.hypot(avx, avy) || 1;
      ax += avx / av * social * 0.65;
      ay += avy / av * social * 0.65;
      /* a school with a leader: the anchor holds the line, the rest keep slots */
      if (f.species !== "mask" && socialOf(f) === "school" && !isAnchor(f)) {
        const anchor = anchorOf(f.species);
        if (anchor && apart(f, anchor) < Math.max(0.5, vision * 3)) {
          const slot = slotFor(f, anchor);
          const sv = unitDir(f, slot.x, slot.y);
          const w = 1.05 * (0.5 + tr.social * 0.6);
          ax += sv.x * w;
          ay += sv.y * w;
        }
      }
      if (socialOf(f) === "school" && f.z != null) {
        let zs = 0, zn = 0;
        state.fish.forEach(function (o) {
          if (o !== f && o.species === f.species && o.z != null && apart(f, o) < vision) { zs += o.z; zn += 1; }
        });
        if (zn) f.z += ((zs / zn) - f.z) * 0.04;
      }
    }
    out.x += ax * 1.5;
    out.y += ay * 1.5;
  }
  function nicheSteer(f, out) {
    const id = f.species;
    state.fish.forEach(function (o) {
      if (o === f) return;
      const dx = o.x - f.x, dy = (o.y - f.y) * AR;
      const d = apart(f, o);
      if (d > 0.32 || d < 0.0001) return;
      if (id === "mandarin" && o.species === "mandarin") {
        out.x += dx / d * 0.35;
        out.y += dy / d * 0.2;
      } else if (id === "mandarin") {
        out.x -= dx / d * 0.45;
      }
      if (id === "mask" && o.species === "tusk") {
        out.x -= dx / d * 0.9;
        out.y -= dy / d * 0.35;
      }
      if ((id === "pepper" || id === "dragon") && o.species === "tusk") {
        out.x -= dx / d * 0.55;
      }
      if (id === "tusk" && o.species !== "tusk" && specOf(o.species).bulk <= fBulk(f)) {
        out.x += dx / d * 0.22;
        o.vx += (o.x - f.x) * 0.15;
      }
    });
    if (id === "dragon" || id === "mandarin" || id === "pepper") {
      let best = null, bd = 1e9;
      decorOf().forEach(function (d) {
        const want = id === "dragon" ? d.kind === "weed" : (d.kind === "solid" || d.shelter);
        if (!want) return;
        const dist = Math.hypot(f.x - d.x, f.y - d.y);
        if (dist < bd) { bd = dist; best = d; }
      });
      if (best) {
        const pull = id === "dragon" ? 0.7 : 0.28;
        out.x += (best.x - f.x) * pull;
        out.y += (best.y - f.y) * pull * 0.45;
      }
    }
  }
  function fBulk(f) {
    return specOf(f.species).bulk * (STAGE_DRAW[stageName(bodyAge(f), f.species)] || 1);
  }
  function decorSteer(f, out) {
    const push = 1.95 + traits(f).bold * 0.7 + (f.startleT > 0 ? 1.2 : 0);
    decorOf().forEach(function (d) {
      if (d.kind === "weed") return;
      const nx = (f.x - d.x) / d.rx, ny = (f.y - d.y) / d.ry;
      const dist = Math.hypot(nx, ny);
      const reach = 1.28;
      if (dist >= reach || dist < 0.0001) return;
      const w = (reach - dist) / reach;
      out.x += nx / dist * w * push;
      out.y += ny / dist * w * push * AR;
    });
  }
  function wallSteer(f, out) {
    const look = 0.05 + Math.hypot(f.vx, f.vy / AR) * 0.35;
    const px = f.x + f.vx * 0.7, py = f.y + f.vy * 0.7;
    if (px < 0.14) out.x += (0.14 - px) * 8;
    if (px > 0.86) out.x -= (px - 0.86) * 8;
    const top = f.action === "jump" ? 0.02 : 0.14;
    if (py < top) out.y += (top - py) * 10;
    if (py > 0.86) out.y -= (py - 0.86) * 10;
    out.x += clamp((0.5 - f.x) * 0.12, -0.1, 0.1);
  }
  function bandSteer(f, out, override) {
    const band = bandOf(f);
    const mid = (band[0] + band[1]) / 2;
    const span = Math.max(0.05, (band[1] - band[0]) / 2);
    const off = (f.y - (override != null ? override : mid)) / span;
    out.y += clamp(-off * 0.9, -1, 1) * 0.4 * (1.2 - traits(f).bold * 0.4);
  }
  /* Danger pressure: a hunter in the water, or a hand reaching over the glass. */
  function huntPressure(f) {
    let flee = null;
    const scared = wary(f, Date.now()) ? 1.25 : 1;
    (state.predators || []).forEach(function (p) {
      if (!p.adult) return;
      if ((p.away || 0) > 0.45) return;
      if (!p.pending && (p.depth || 0) < 0.55) return;
      const d = span3(p.x, p.y, depthOf(p), f.x, f.y, depthOf(f));
      const reach = (p.pending ? 0.46 : 0.30) * scared;
      if (d >= reach) return;
      const w = (1 - d / reach) * (p.pending ? 1.7 : 1);
      if (!flee || w > flee.w) flee = { x: p.x, y: p.y, w: w, stalk: !!p.pending };
    });
    if (hand && hand.dip > 0.2 && f.y < 0.38) {
      const d = Math.hypot(hand.x - f.x, (0.03 - f.y) * AR);
      if (d < 0.3) {
        const w = (1 - d / 0.3) * hand.dip * 0.95;
        if (!flee || w > flee.w) flee = { x: hand.x, y: 0.01, w: w, stalk: false };
      }
    }
    return flee && flee.w > 0.12 ? flee : null;
  }
  /* What the fish is doing, in priority order, for this frame. */
  function fishMind(f, now, dt, mood) {
    const m = motionOf(f);
    const tr = traits(f);
    const band = bandOf(f);
    const night = phase() === "night";
    const starving = STARVE - (now - (f.lastFed || f.born)) < 8 * HOUR;
    const danger = huntPressure(f);
    const flake0 = danger ? nearestFlake(f) : null;
    const desperate = !!(starving && flake0 && tr.bold > 0.45
      && span3(f.x, f.y, depthOf(f), flake0.x, flake0.y, 0.86) < 0.3);
    if (danger && tr.bold < 0.94 && !desperate) {
      if (f.species === "octo") releaseInk(f, now);
      f.state = "flee";
      f.stateT = 2.4;
      f.idleT = 0;
      return { mode: "flee", tx: danger.x, ty: danger.y, w: danger.w, stalk: danger.stalk,
        cap: speedOf(f, now, "panic") * (0.78 + tr.bold * 0.45) };
    }
    const flake = nearestFlake(f);
    if (flake) {
      f.state = "eat";
      f.stateT = 1.6;
      f.idleT = 0;
      return { mode: "eat", tx: flake.x, ty: flake.y, flake: flake,
        cap: speedOf(f, now, starving ? "burst" : "cruise") * (0.7 + tr.appetite * 0.5) };
    }
    if (comfort(f) > 2.5) {
      f.idleT = 0;
      if (m.walk) {
        f.state = "shelter";
        f.stateT = 1.6;
        const rock = nearestBottomRock(f);
        const floor = (band[0] + band[1]) / 2;
        return { mode: "shelter", tx: rock ? rock.x : clamp(f.x, 0.14, 0.86), ty: floor,
          cap: speedOf(f, now, "cruise") * 0.32 };
      }
      f.state = "gasp";
      f.stateT = 1.2;
      return { mode: "gasp", tx: clamp(f.x + Math.sin(now / 2600 + (f.wseed || 0)) * 0.04, 0.12, 0.88), ty: 0.12,
        cap: speedOf(f, now, "cruise") * 0.42 };
    }
    if ((state.oxygen == null ? 100 : state.oxygen) < OX.gasp && !motionOf(f).walk) {
      f.idleT = 0;
      f.state = "gasp";
      f.stateT = 1.2;
      f.thin = 1;
      return { mode: "gasp", tx: clamp(f.x + Math.sin(now / 2600 + (f.wseed || 0)) * 0.04, 0.12, 0.88), ty: 0.12,
        cap: speedOf(f, now, "cruise") * 0.38 };
    }
    if (f.actionT > 0) {
      f.state = "play";
      f.stateT = f.actionT;
      return { mode: "play", cap: m.burst * (f.action === "race" ? 0.8 : 0.5) * stageSpeed(stageName(bodyAge(f), f.species)) };
    }
    if (f.courtT > 0) {
      f.state = "court";
      f.stateT = f.courtT;
      return { mode: "court", cap: speedOf(f, now, "cruise") * 0.8 };
    }
    if (f.idleT == null || f.idleT <= 0 || !f.state || f.state === "play") scheduleIdle(f, now, night, mood);
    f.idleT -= dt;
    const mid = (band[0] + band[1]) / 2;
    if (f.state === "graze") {
      if (!f.grazeT || f.grazeT <= 0) f.grazeT = 2 + Math.random() * 4;
      return { mode: "graze", tx: clamp(f.x + Math.sin(now / 4000 + (f.wseed || 0)) * 0.1, 0.1, 0.9), ty: clamp(band[1] + 0.04, 0.3, 0.88),
        cap: speedOf(f, now, "cruise") * 0.5 };
    }
    if (f.state === "rest") {
      const restY = clamp(mid + 0.16, 0.2, 0.86);
      return { mode: "rest", tx: f.x + Math.sin(now / 9000 + (f.wseed || 0)) * 0.08, ty: restY, cap: speedOf(f, now, "rest") };
    }
    if (f.state === "shelter") {
      const s = nearestShelter(f.x, f.y, 2.2);
      if (s) return { mode: "shelter", tx: s.x + 0.05, ty: s.y, cap: speedOf(f, now, "cruise") * 0.6 };
      f.state = "cruise";
    }
    if (f.state === "hover") {
      return { mode: "hover", tx: f.x + Math.sin(now / 1500 + (f.wseed || 0)) * 0.03,
        ty: mid + Math.sin(now / 2100 + (f.wseed || 0)) * 0.03, cap: speedOf(f, now, "cruise") * 0.3 };
    }
    if (f.state === "glide") return { mode: "glide", cap: speedOf(f, now, "cruise") * 0.35, glide: true };
    f.state = "cruise";
    if (!f.cruise || unitDir(f, f.cruise.x, f.cruise.y).d < 0.06) f.cruise = patrolPoint(f);
    let cruiseCap = speedOf(f, now, "cruise");
    /* a leader slows for its school instead of leaving it behind */
    if (socialOf(f) === "school" && isAnchor(f) && schoolSpread(f) > 0.34) cruiseCap *= 0.72;
    return { mode: "cruise", tx: f.cruise.x, ty: f.cruise.y, cap: cruiseCap };
  }
  function scheduleIdle(f, now, night, mood) {
    if (motionOf(f).walk && Math.random() < 0.28) {
      startPlay(f);
      f.state = "play";
      f.stateT = f.actionT;
      f.idleT = f.actionT;
      return;
    }
    const tr = traits(f);
    const band = bandOf(f);
    const roll = Math.random();
    const hour = rhythm();
    const grazeT = (band[0] > 0.5 ? 0.5 : (f.species === "puff" ? 0.12 : 0.05)) * (hour === "dawn" ? 1.25 : hour === "day" ? 1 : 0.55);
    const restT = (night ? 0.36 : 0.05) + (1 - tr.bold) * (night ? 0.26 : 0.08) + (mood === "sad" ? 0.15 : 0);
    let rest = restT;
    if (hour === "dawn") rest *= 0.5;
    else if (hour === "dusk") rest *= 0.7;
    if (f.mem && Date.now() - (f.mem.ateAt || 0) < 25000) rest += 0.14;
    if (hour === "night" && nearestShelter(f.x, f.y, 1.7) && roll < rest + 0.28) {
      f.state = "shelter";
      f.stateT = 8 + Math.random() * 10;
      f.idleT = f.stateT;
      return;
    }
    if (roll < grazeT) { f.state = "graze"; f.stateT = 4 + Math.random() * 7; f.grazeT = f.stateT; }
    else if (roll < grazeT + rest) { f.state = "rest"; f.stateT = 6 + Math.random() * 12; }
    else if (roll < grazeT + restT + 0.11) { f.state = "hover"; f.stateT = 3 + Math.random() * 5; }
    else if (roll < grazeT + restT + 0.11 + motionOf(f).glide * 0.22) { f.state = "glide"; f.stateT = 0.7 + Math.random() * 1.6; }
    else { f.state = "cruise"; f.stateT = 4 + Math.random() * 9; f.cruise = patrolPoint(f); }
    f.idleT = f.stateT;
  }
  /* Speed is a force, not a snap: accelerate toward the wish, then integrate. */
  function applyVelocity(f, dt, wx, wy, cap, glide) {
    const mag = Math.hypot(wx, wy);
    let vx = 0, vy = 0;
    if (mag > 0.0001) {
      vx = wx / mag * cap;
      vy = wy / mag * cap * AR;
    }
    if (glide) {
      f.vx *= 1 - Math.min(0.9, dt * 0.9);
      f.vy *= 1 - Math.min(0.9, dt * 0.9);
    } else {
      const step = (cap * 3.6 + 0.06) * dt;
      f.vx += clamp(vx - f.vx, -step, step);
      f.vy += clamp(vy - f.vy, -step, step);
    }
  }
  /* Body: heading chases the velocity, heading drives bank, tail beat tracks effort. */
  function bodyUpdate(f, dt, cap) {
    const m = motionOf(f);
    const tr = traits(f);
    const sp = Math.hypot(f.vx, f.vy / AR);
    let want = f.heading || 0;
    if (sp > 0.002) want = Math.atan2(f.vy / AR, f.vx);
    let diff = want - (f.heading || 0);
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const rate = m.turn * (1 + tr.bold * 0.35) * clamp(1 + 0.45 / (0.3 + sp * 5), 1, 1.7);
    const turn = clamp(diff, -rate * dt, rate * dt);
    f.heading = (f.heading || 0) + turn;
    if (f.heading > Math.PI) f.heading -= Math.PI * 2;
    if (f.heading < -Math.PI) f.heading += Math.PI * 2;
    const turnRate = dt > 0.001 ? turn / dt : 0;
    f.bank = (f.bank || 0) + (clamp(turnRate * 0.22, -0.42, 0.42) - (f.bank || 0)) * Math.min(1, dt * 4);
    f.pitch = (f.pitch || 0) + (clamp((f.vy / AR) * 2.4, -0.5, 0.5) - (f.pitch || 0)) * Math.min(1, dt * 5);
    const strain = clamp(sp / Math.max(0.02, cap), 0, 1.4);
    const beat = f.state === "rest" ? 2.4 : f.state === "hover" ? 6.5 : 4.6 + strain * 11 * (m.tail / 14);
    f.phase = (f.phase || 0) + dt * beat;
    f.face = Math.cos(f.heading || 0) >= 0 ? 1 : -1;
    if (f.zTarget == null) f.zTarget = 0.25 + Math.random() * 0.6;
    if (!f.zUntil || Date.now() > f.zUntil) {
      const band = depthBand(f);
      f.zTarget = band[0] + Math.random() * (band[1] - band[0]);
      f.zUntil = Date.now() + 5000 + Math.random() * 8000;
    }
    f.zTarget = clamp(f.zTarget, 0.08, 0.96);
    f.z = f.z == null ? f.zTarget : f.z + (f.zTarget - f.z) * Math.min(1, dt * 0.35);
    if (m.walk) {
      f.pitch = (f.pitch || 0) * 0.15;
      f.bank = (f.bank || 0) * 0.25;
    }
    f.speed = sp;
  }
  function stepFish(f, dt) {
    const now = Date.now();
    const tr = traits(f);
    simDt = dt;
    if (f.phase == null) f.phase = Math.random() * 6.283;
    if (f.heading == null) f.heading = f.vx < 0 ? Math.PI : 0;
    if (f.state == null) f.state = "cruise";
    if (f.z == null) f.z = 0.25 + Math.random() * 0.6;
    f.startleT = Math.max(0, (f.startleT || 0) - dt);
    if (f.actionT > 0) {
      f.actionT = Math.max(0, f.actionT - dt);
      if (f.actionT === 0) f.action = "";
    }
    if (f.courtT) f.courtT = Math.max(0, f.courtT - dt);
    const spent = f.state === "flee" || f.startleT > 0.2;
    f.stamina = clamp((f.stamina == null ? 1 : f.stamina) + (spent ? -dt * 0.16 : dt * 0.09), 0, 1);
    const mood = moodOf(f, now);
    const mind = fishMind(f, now, dt, mood);
    const cap = Math.max(0.01, mind.cap || 0.05);
    if (mind.mode === "flee") {
      const z = f.z == null ? 0.5 : f.z;
      f.zTarget = clamp(z < 0.5 ? z + 0.42 : z - 0.42, 0.08, 0.95);
      f.zUntil = now + 2200;
    } else if (mind.mode === "eat" && !motionOf(f).walk) {
      f.zTarget = 0.86;
      f.zUntil = now + 1600;
    }
    const out = { x: 0, y: 0 };
    let glide = false;
    if (mind.mode === "flee") {
      const t = unitDir(f, mind.tx, mind.ty);
      if (motionOf(f).walk) {
        const away = f.x < mind.tx ? -1 : 1;
        out.x += away * (2.4 + mind.w * 1.6);
        const rock = nearestBottomRock(f);
        if (rock) out.x += (rock.x >= f.x ? 1 : -1) * 0.7;
      } else {
        out.x -= t.x * (2.6 + mind.w * 2);
        out.y -= t.y * (2.6 + mind.w * 2);
      }
      if (mind.stalk) {
        const s = nearestShelter(f.x, f.y, 1.4);
        if (s) {
          const sv = unitDir(f, s.x, s.y);
          out.x += sv.x * 1.6;
          out.y += sv.y * 1.6;
          f.state = "shelter";
          /* it learns the hiding place and comes back to it next time */
          if (sv.d < 0.09) { const mm = mem(f); mm.hidSpot = { x: s.x + 0.05, y: s.y }; mm.hidAt = now; }
        } else {
          const hid = hidingSpot(f);
          if (hid) { const hv = unitDir(f, hid.x, hid.y); out.x += hv.x * 1.2; out.y += hv.y * 1.2; }
        }
      }
      f.startleT = Math.max(f.startleT, 0.7);
    } else if (mind.mode === "eat") {
      const t = unitDir(f, mind.tx, mind.ty);
      out.x += t.x * 1.7;
      out.y += t.y * 1.7;
      if (temperOf(f) === "lively" || STARVE - (now - (f.lastFed || f.born)) < 8 * HOUR) {
        state.fish.forEach(function (o) {
          if (o === f) return;
          if (apart(f, o) < 0.09 && span3(o.x, o.y, depthOf(o), mind.tx, mind.ty, 0.86) < 0.18) {
            const back = unitDir(o, f.x, f.y);
            out.x += back.x * 1.2;
            out.y += back.y * 1.2;
          }
        });
      }
    } else if (mind.mode === "play") {
      const a = f.action;
      if (a === "race") { out.x += f.tx > f.x ? 1 : -1; out.y += (f.ty || f.y) > f.y ? 0.25 : -0.25; }
      else if (a === "dance") { out.x += Math.cos(f.actionT * 3); out.y += Math.sin(f.actionT * 3) * 0.8; }
      else if (a === "clean") { out.y += Math.max(0, 0.86 - f.y) * 3; out.x += Math.sin(now / 900 + (f.wseed || 0)) * 0.4; }
      else if (a === "jump") { out.x += f.face; out.y -= 0.6; }
      else if (a === "glow") { out.x += Math.cos(now / 3000 + (f.wseed || 0)) * 0.5; out.y += 0.2; }
      else if (a === "flare") { out.x += Math.sin(now / 1200 + (f.wseed || 0)) * 0.2; out.y += 0.1; }
      else if (a === "flash") { const t = unitDir(f, f.tx || f.x + f.face * 0.4, f.ty || f.y); out.x += t.x * 1.6; out.y += t.y * 1.6; }
      else if (a === "snap") { out.x += Math.sin(now / 220 + (f.wseed || 0)) * 0.3; }
      else if (a === "scuttle") { out.x += (f.face || 1) * 1.6; }
      else if (a === "lap") {
        const t = unitDir(f, f.tx, 0.34 + Math.sin(now / 5200 + (f.wseed || 0)) * 0.12);
        out.x += t.x * 1.1; out.y += t.y * 1.1;
      } else if (a === "boop" || a === "school") {
        if (f.tx) { const t = unitDir(f, f.tx, f.ty == null ? f.y : f.ty); out.x += t.x * 1.4; out.y += t.y * 1.4; }
      }
    } else if (mind.mode === "court") {
      const pair = state.fish.filter(function (o) { return o !== f && o.courtT > 0 && o.species === f.species; })[0];
      if (pair) {
        const rel = unitDir(f, pair.x, pair.y);
        const spin = f.id < pair.id ? 1 : -1;
        out.x += rel.x * 0.5 - rel.y * 0.9 * spin;
        out.y += rel.y * 0.5 + rel.x * 0.9 * spin;
      } else out.x += Math.cos(now / 1800 + (f.wseed || 0));
    } else if (mind.mode === "gasp") {
      const t = unitDir(f, mind.tx, mind.ty);
      out.x += t.x * 1.4;
      out.y += t.y * 1.4;
      out.x += Math.sin(now / 700 + (f.wseed || 0)) * 0.3;
    } else if (mind.mode === "graze") {
      const t = unitDir(f, mind.tx, mind.ty);
      out.x += t.x * 0.8;
      out.y += t.y * 1.2;
      out.x += Math.sin(now / 4000 + (f.wseed || 0)) * 0.25;
    } else if (mind.mode === "rest" || mind.mode === "hover") {
      const t = unitDir(f, mind.tx, mind.ty);
      out.x += t.x * 0.6;
      out.y += t.y * 0.6;
    } else if (mind.mode === "glide") {
      glide = true;
    } else if (mind.mode === "shelter") {
      const t = unitDir(f, mind.tx, mind.ty);
      out.x += t.x * 0.9;
      out.y += t.y * 0.9;
    } else {
      const t = unitDir(f, mind.tx, mind.ty);
      const w = wanderDir(f, now, dt);
      out.x += t.x * 1.1 + w.x * 0.5;
      out.y += t.y * 1.1 + w.y * 0.5;
    }
    if (mind.mode !== "glide") {
      shoalSteer(f, out);
      nicheSteer(f, out);
      territorySteer(f, out);
      crewSteer(f, out);
      decorSteer(f, out);
    }
    if (wary(f, now) && mind.mode !== "gasp") out.y += 0.34;
    bandSteer(f, out, mind.mode === "gasp" ? 0.12 : null);
    wallSteer(f, out);
    if (motionOf(f).walk) out.y *= 0.05;
    if (f.state === "rest" || f.state === "hover") { out.x *= 0.4; out.y *= 0.4; }
    applyVelocity(f, dt, out.x, out.y, cap, glide);
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    const top = mind.mode === "gasp" ? 0.08 : f.action === "jump" ? 0.02 : 0.11;
    if (f.x < 0.05) { f.x = 0.05; f.vx = Math.abs(f.vx) * 0.4; }
    if (f.x > 0.95) { f.x = 0.95; f.vx = -Math.abs(f.vx) * 0.4; }
    if (f.y < top) { f.y = top; f.vy = Math.abs(f.vy) * 0.4; }
    if (f.y > 0.88) { f.y = 0.88; f.vy = -Math.abs(f.vy) * 0.4; }
    if (motionOf(f).jet) {
      f.jetCd = (f.jetCd == null ? 0.4 : f.jetCd) - dt;
      f.jetT = Math.max(0, (f.jetT || 0) - dt);
      if (f.jetCd <= 0) {
        f.jetCd = (f.state === "flee" ? 0.48 : 1.2) + Math.random() * 0.4;
        f.jetT = f.state === "flee" ? 0.5 : 0.38;
        const burst = f.state === "flee" ? 0.26 : 0.11;
        const aim = f.heading == null ? (f.vx < 0 ? Math.PI : 0) : f.heading;
        f.vx += Math.cos(aim) * burst;
        f.vy += Math.sin(aim) * burst * 0.4;
      }
    }
    if (motionOf(f).walk) {
      const floor = (bandOf(f)[0] + bandOf(f)[1]) / 2;
      f.y += (floor - f.y) * Math.min(1, dt * 8);
      f.vy *= 0.12;
    }
    bodyUpdate(f, dt, cap);
    if (f.state === "graze" && Math.random() < dt * 0.5) state.algae = clamp((state.algae || 0) - 0.05, 0, 100);
    if (f.species === "tusk" && Math.random() < dt * 0.4) state.algae = clamp((state.algae || 0) - 0.09, 0, 100);
    if (f.species === "mandarin" && Math.random() < dt * 0.25) state.algae = clamp((state.algae || 0) - 0.03, 0, 100);
  }
  function stepInks(dt, now) {
    inks.forEach(function (k) {
      k.x += (k.drift || 0) * dt;
      k.y -= 0.02 * dt;
    });
    inks = inks.filter(function (k) { return now - k.born < k.life; });
    if (inks.length > 24) inks = inks.slice(inks.length - 24);
  }
  function drawInks(w, h, now) {
    inks.forEach(function (k) {
      const u = clamp((now - k.born) / k.life, 0, 1);
      const frame = u < 0.28 ? "ink_1" : (u < 0.62 ? "ink_2" : "ink_3");
      const img = SPRITES[frame];
      const size = (64 + u * 170) * (Math.min(w, 1100) / 900);
      ctx.save();
      ctx.globalAlpha = (u < 0.12 ? u / 0.12 : 1 - u) * 0.82;
      if (img && img.complete && img.naturalWidth) {
        const ih = size * (img.naturalHeight / img.naturalWidth);
        ctx.drawImage(img, k.x * w - size / 2, k.y * h - ih / 2, size, ih);
      } else {
        ctx.fillStyle = "rgba(6,6,8,0.45)";
        ctx.beginPath();
        ctx.arc(k.x * w, k.y * h, size * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }
  function startHand(kind) {
    if (!state.fish.length) { log("No one is home to feed."); return false; }
    if (hand || flakes.length) { log("The last pinch is still in the water."); return false; }
    const who = Math.random() < 0.5 ? "f" : "m";
    hand = {
      who: who,
      x: 0.12 + Math.random() * 0.76,
      tx: 0.12 + Math.random() * 0.76,
      dip: 0,
      wait: 0.2,
      kind: kind,
      drops: 0,
      max: kind === "pellet" ? 1 : 8,
      leave: false
    };
    log((who === "f" ? "A woman's hand" : "A man's hand") + (kind === "pellet" ? " offers one pellet." : " reaches over the glass."));
    playSfx("feed");
    return true;
  }
  function dropFlake() {
    flakes.push({
      x: Math.max(0.08, Math.min(0.92, hand.x + (Math.random() - 0.5) * 0.12)),
      y: 0.02 + hand.dip * 0.05,
      vy: 0.14 + Math.random() * 0.12,
      age: 0,
      pellet: hand.kind === "pellet"
    });
  }
  function stepHand(dt) {
    if (hand) {
      const dx = hand.tx - hand.x;
      hand.x += Math.max(-0.7, Math.min(0.7, dx * 2.2)) * dt;
      if (hand.leave) {
        if (hand.x < -0.28 || hand.x > 1.28) hand = null;
      } else if (Math.abs(dx) < 0.035) {
        hand.dip = Math.min(1, hand.dip + dt * 3.2);
        hand.wait -= dt;
        if (hand.dip > 0.8 && hand.wait <= 0 && hand.drops < hand.max) {
          dropFlake();
          hand.drops += 1;
          hand.wait = 0.28 + Math.random() * 0.25;
          hand.dip = 0;
          hand.tx = 0.1 + Math.random() * 0.8;
          if (hand.drops >= hand.max) {
            hand.leave = true;
            hand.tx = hand.x < 0.5 ? -0.35 : 1.35;
          }
        }
      } else {
        hand.dip = Math.max(0, hand.dip - dt * 2);
      }
    }
    flakes.forEach(function (fl) {
      fl.age += dt;
      fl.y += fl.vy * dt;
      fl.x += Math.sin(fl.age * 3) * 0.01 * dt;
      if (fl.y > 0.84) { fl.y = 0.84; fl.vy = 0; }
    });
  }
  function resolveBites() {
    const now = Date.now();
    flakes.forEach(function (fl) {
      if (fl.gone) return;
      const near = state.fish.filter(function (f) {
        return span3(f.x, f.y, depthOf(f), fl.x, fl.y, 0.86) < 0.07;
      }).sort(function (a, b) {
        return span3(a.x, a.y, depthOf(a), fl.x, fl.y, 0.86) - span3(b.x, b.y, depthOf(b), fl.x, fl.y, 0.86);
      });
      if (!near.length) {
        if (fl.age > 8) {
          fl.gone = true;
          /* food in the water does not make green any more: it rots, and the cleaners
             that lift the rot are what make it */
        }
        return;
      }
      const winner = near[0];
      near.slice(1).forEach(function (loser) {
        const push = (loser.x - winner.x) || (Math.random() - 0.5);
        loser.vx += push * 1.4;
        loser.vy += 0.08;
        loser.face = loser.vx >= 0 ? 1 : -1;
      });
      winner.lastFed = now;
      winner.lastPlay = now;
      const wm = mem(winner);
      wm.ateAt = now;
      wm.meals = (wm.meals || 0) + 1;
      accrueGrowth(winner, now);
      if (fl.pellet) {
        addGrowthHours(winner, 2);
        winner.bonus = Math.min(14 * DAY, (winner.bonus || 0) + DAY);
        log(near.length > 1
          ? (winner.name + " wins the pellet and grows. " + near[1].name + " is shoved off.")
          : (winner.name + " takes the pellet, grows faster, and gains a day."));
      } else {
        addGrowthHours(winner, 1);
        winner.bonus = Math.min(14 * DAY, (winner.bonus || 0) + 10 * HOUR);
        if (near.length > 1 && Math.random() < 0.45) log(winner.name + " snatches a flake from " + near[1].name + " and grows.");
      }
      /* the only thing that pays - and in an RPG run nothing pays at all */
      if (!RPG()) state.points += fl.pellet ? 2 : 1;
      /* and it comes back later, over the hours it takes to work through */
      winner.digest = (winner.digest || 0) + (fl.pellet ? WASTE.meal * 1.6 : WASTE.meal) * LOOP.digest;
      playSfx("nibble");
      fl.gone = true;
    });
    if (flakes.some(function (fl) { return fl.gone; })) {
      flakes = flakes.filter(function (fl) { return !fl.gone; });
      save();
    }
  }
  function drawHand(w, h) {
    if (!hand) return;
    const img = HANDS[hand.who];
    const bw = Math.min(w * 0.34, 260);
    const bh = img && img.complete && img.naturalWidth ? bw * (img.naturalHeight / img.naturalWidth) : bw * 1.1;
    const x = hand.x * w;
    const y = -bh * 0.08 + hand.dip * h * 0.07;
    ctx.save();
    ctx.translate(x, y);
    if (img && img.complete && img.naturalWidth) ctx.drawImage(img, -bw / 2, 0, bw, bh);
    ctx.restore();
  }
  /* the green sits on the sand, behind the fish, and grows in as it ages */
  function drawAlgaeBits(w, h) {
    if (!algaeBits.length) return;
    ctx.save();
    for (let i = 0; i < algaeBits.length; i += 1) {
      const b = algaeBits[i];
      const grow = Math.min(1, (b.age || 0) / 1.2);
      if (grow <= 0) continue;
      ctx.globalAlpha = 0.3 + grow * 0.3;
      ctx.fillStyle = i % 3 === 0 ? "#4f8f3a" : i % 3 === 1 ? "#3d752c" : "#5fa344";
      ctx.beginPath();
      ctx.ellipse(b.x * w, b.y * h, b.r * grow, b.r * 0.6 * grow, b.wob || 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  let algaeBits = [];
  function drawFlakes(w, h) {
    flakes.forEach(function (fl) {
      ctx.fillStyle = fl.pellet ? "#fbbf24" : "#d97706";
      ctx.beginPath();
      ctx.ellipse(fl.x * w, fl.y * h, fl.pellet ? 7 : 3.5, fl.pellet ? 5 : 2.2, fl.age, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(2, r.width * dpr);
    canvas.height = Math.max(2, r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function stateWord(f) {
    if (f.species === "octo" && (f.inkUntil || 0) > Date.now()) return "inking";
    const s = f.state;
    const walk = motionOf(f).walk;
    if (s === "flee") return walk ? "scuttling clear" : ((f.stamina != null && f.stamina < 0.35) ? "tiring" : "bolting");
    if (s === "shelter") return walk ? "under the rockwork" : "in the weeds";
    if (s === "gasp") return "gasping at the top";
    if (s === "rest") return walk ? "still on the sand" : "resting";
    if (s === "graze") return walk ? "picking the sand" : "grazing";
    if (s === "court") return "courting";
    if (s === "eat") return "feeding";
    if (s === "hover") return "holding still";
    if (s === "glide") return "gliding";
    if (s === "cruise") {
      if (isAnchor(f) && state.fish.some(function (o) { return o !== f && o.species === f.species; })) return "leading";
      const lead = anchorOf(f.species);
      if (lead && lead !== f && apart(f, lead) < 0.3) return "following";
      if (wary(f, Date.now())) return "keeping low";
    }
    return "";
  }
  /* Who this fish lives with, in one line for the rail and the card. */
  function socialLine(f) {
    const bits = [];
    const home = homeOf(f);
    if (socialOf(f) === "school") {
      const lead = anchorOf(f.species);
      if (lead === f) bits.push("leads the " + specOf(f.species).name.toLowerCase() + " school");
      else if (lead && apart(f, lead) < 0.35) bits.push("schools with " + lead.name);
      else bits.push("looking for its school");
    } else if (f.species !== "mask") {
      const side = home.x < 0.35 ? "left" : home.x > 0.65 ? "right" : "middle";
      bits.push("holds a patch on the " + side);
    }
    const pal = bondPick(f, 1, 0.3);
    if (pal) bits.push("usually near " + pal.f.name);
    const foe = bondPick(f, -1, 0.25);
    if (foe) bits.push("keeps clear of " + foe.f.name);
    const mm = f.mem || {};
    const now = Date.now();
    if (mm.chasedAt && now - mm.chasedAt < 180000) bits.push("wary since the last chase");
    if (mm.hidSpot && hidingSpot(f)) bits.push("hiding place in the weeds");
    if (mm.ateAt && now - mm.ateAt < 90000) bits.push("just ate");
    if (mm.shovedBy) {
      const bully = state.fish.filter(function (x) { return x.id === mm.shovedBy; })[0];
      if (bully) bits.push("gives " + bully.name + " room");
    }
    if (mm.meals) bits.push(mm.meals + " meals");
    return bits.join(" · ");
  }
  function drawFish(f, w, h, now) {
    const stage = stageName(bodyAge(f), f.species);
    const z = f.z == null ? 0.5 : f.z;
    const sp = f.speed == null ? Math.hypot(f.vx, f.vy / AR) : f.speed;
    const goingRight = (f.face || 1) !== -1;
    let img = SPRITES[f.species + "_" + stage];
    let useTurn = false;
    if (f.species === "octo" || f.species === "mandarin" || f.species === "pepper" || f.species === "tusk" || f.species === "dragon" || f.species === "mask") {
      const moving = f.species === "octo" ? (f.jetT || 0) > 0.05 : Math.abs(f.vx) > 0.01;
      const posed = SPRITES[f.species + "_r" + (moving ? "_swim" : "")] || SPRITES[f.species + "_r"];
      if (posed) img = posed;
    } else if (f.species === "claw" || f.species === "crab") {
      const dir = goingRight ? "r" : "l";
      const stepMs = f.species === "claw" ? 460 : 220;
      const stepping = Math.abs(f.vx) > 0.004 && ((Math.floor(now / stepMs) % 2) === 1);
      const turned = SPRITES[f.species + "_" + dir + (stepping ? "_walk" : "")] || SPRITES[f.species + "_" + dir];
      if (turned) { img = turned; useTurn = true; }
    } else if (f.species === "azure" || f.species === "sunscale") {
      const turnStage = f.species === "sunscale"
        ? (stage === "baby" || stage === "infant" ? "baby" : (stage === "child" || stage === "teen" ? "child" : "adult"))
        : stage;
      const turned = SPRITES[f.species + "_" + turnStage + "_" + (goingRight ? "r" : "l")];
      if (turned) { img = turned; useTurn = true; }
    }
    const flare = f.action === "flare" ? 1.16 : 1;
    const sc = STAGE_DRAW[stage] * specOf(f.species).bulk * (0.5 + z * 0.68) * flare;
    let bh = Math.min(h * 0.22, 150) * sc;
    let bw = bh;
    if (img && img.complete && img.naturalWidth) bw = bh * (img.naturalWidth / img.naturalHeight);
    if ((f.species === "octo" || f.species === "mandarin" || f.species === "pepper" || f.species === "tusk" || f.species === "dragon" || f.species === "mask") && img && img.complete && img.naturalWidth) {
      const wide = f.species === "dragon" ? 0.4 : (f.species === "octo" ? 0.32 : 0.26);
      bw = Math.min(w * wide, f.species === "dragon" ? 420 : 320) * STAGE_DRAW[stage] * (0.5 + z * 0.7);
      bh = bw * (img.naturalHeight / img.naturalWidth);
    }
    const breathe = state.opts.motion === false ? 0 : Math.sin(now / (f.state === "rest" ? 1700 : 900) + f.x * 10) * (f.state === "rest" ? 2.4 : 1.1);
    let y = f.y * h + breathe;
    if (motionOf(f).walk) {
      const bob = state.opts.motion === false || Math.abs(f.vx) < 0.004 ? 0 : Math.sin((f.phase || 0) * 2) * 1.6;
      y = h * 0.91 - bh * 0.46 + bob;
    }
    const x = f.x * w;
    if (f.action === "jump") {
      const u = Math.max(0, f.actionT / 1.1);
      y = h * 0.18 - Math.sin((1 - u) * Math.PI) * h * 0.12;
    }
    hitBoxes[f.id] = { x: x, y: y, bw: bw, bh: bh, z: z, at: now };
    if (motionOf(f).glow === true && phase() !== "day") {
      const pulse = state.opts.motion === false ? 0.6 : 0.55 + Math.sin(now / 700 + (f.wseed || 0)) * 0.2;
      const g = ctx.createRadialGradient(x, y, 1, x, y, Math.max(18, bh * 1.8));
      g.addColorStop(0, "rgba(186,238,255," + (0.3 * pulse).toFixed(3) + ")");
      g.addColorStop(1, "rgba(120,200,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - bh * 2, y - bh * 2, bh * 4, bh * 4);
    }
    ctx.save();
    ctx.globalAlpha = 0.08 + z * 0.12;
    ctx.fillStyle = "#04121c";
    ctx.beginPath();
    ctx.ellipse(x, h * 0.9, bw * 0.32, bh * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.38 + z * 0.62;
    if (z < 0.42) ctx.filter = "saturate(0.72) brightness(0.86)";
    ctx.translate(x, y);
    const artRight = FACE_RIGHT[f.species] !== false;
    const face = useTurn ? 1 : ((goingRight === artRight) ? 1 : -1);
    const strain = clamp(sp / Math.max(0.02, speedOf(f, now, "cruise")), 0, 1.5);
    const amp = motionOf(f).walk ? 0 : (temperOf(f) === "chill" ? 0.03 : 0.07) * (0.4 + strain * 0.8);
    const wag = state.opts.motion === false ? 0 : Math.sin(f.phase || 0) * amp * (f.state === "rest" ? 0.35 : 1);
    ctx.scale(face, 1);
    ctx.rotate(wag * (f.action === "flare" ? 2 : 1) + (f.bank || 0) * 0.5 - (f.pitch || 0) * 0.3);
    if (img && img.complete && img.naturalWidth) ctx.drawImage(img, -bw / 2, -bh / 2, bw, bh);
    else {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.ellipse(0, 0, bw / 2, bh / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (state.opts.motion !== false && f.startleT > 0.05) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.5, f.startleT);
      ctx.strokeStyle = "rgba(255,235,200,0.9)";
      ctx.beginPath();
      ctx.arc(x, y, bh * 0.75 + f.startleT * 10, -0.6, 0.6);
      ctx.stroke();
      ctx.restore();
    }
    if (f.id === selected) {
      ctx.strokeStyle = "#fbbf24";
      ctx.strokeRect(x - bw / 2 - 4, y - bh / 2 - 4, bw + 8, bh + 8);
    }
    if (state.opts.names !== false) {
      ctx.textAlign = "center";
      ctx.font = "600 13px Syne, sans-serif";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(3,10,18,0.72)";
      const label = f.name + (f.gen > 1 ? " ·" + f.gen : "");
      ctx.strokeText(label, x, y - bh / 2 - 8);
      ctx.fillStyle = moodOf(f, now) === "sad" ? "#fb7185" : "#e8eef5";
      ctx.fillText(label, x, y - bh / 2 - 8);
      const word = stateWord(f);
      if (word) {
        ctx.font = "600 11px Source Sans 3, sans-serif";
        ctx.lineWidth = 2.5;
        ctx.strokeText(word, x, y - bh / 2 + 5);
        ctx.fillStyle = f.stamina != null && f.stamina < 0.35 && f.state === "flee" ? "#fb7185" : "#9fd8e8";
        ctx.fillText(word, x, y - bh / 2 + 5);
      }
    }
  }
  function drawEggs(w, h, now) {
    (state.eggs || []).forEach(function (e) {
      const x = e.x * w, y = e.y * h;
      const left = clamp((e.hatchAt - now) / HATCH_MS, 0, 1);
      const jiggle = state.opts.motion === false ? 0 : Math.sin(now / 900 + x) * 0.6;
      ctx.save();
      ctx.globalAlpha = 0.6 + (1 - left) * 0.35;
      for (let i = 0; i < 4; i += 1) {
        const a = i * 1.57 + x;
        const ex = x + Math.cos(a) * 7, ey = y + Math.sin(a) * 5 + jiggle;
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.ellipse(ex, ey, 3.2, 2.5, a, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(18,28,38,0.55)";
        ctx.beginPath();
        ctx.arc(ex, ey, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      if (state.opts.names !== false) {
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = "#e8eef5";
        ctx.font = "600 10px Source Sans 3, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(specOf(e.species).name + " eggs · " + Math.ceil(left * 20) + "m", x, y - 14);
      }
      ctx.restore();
    });
  }
  function drawMotes(w, h, front) {
    motes.forEach(function (m) {
      if ((m.z >= 0.5) !== !!front) return;
      ctx.save();
      ctx.globalAlpha = (front ? 0.32 : 0.2) * (0.4 + m.z * 0.6);
      ctx.fillStyle = "#dff3ff";
      ctx.beginPath();
      ctx.arc(m.x * w, m.y * h, m.r * (0.6 + m.z * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
  function drawGlass(w, h) {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.45, Math.min(w, h) * 0.25, w * 0.5, h * 0.45, Math.max(w, h) * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(2,8,14,0.5)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#dff3ff";
    ctx.beginPath();
    ctx.moveTo(w * 0.02, h * 0.34);
    ctx.lineTo(w * 0.2, h * 0.02);
    ctx.lineTo(w * 0.3, h * 0.02);
    ctx.lineTo(w * 0.09, h * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function drawCrew(c, w, h, now) {
    const t = now / 1000 + c.wobble;
    let x = c.x * w;
    let y = c.y * h;
    const napping = c.role === "turtle" && c.asleep;
    if (state.opts.motion !== false && !napping) {
      if (c.role === "jelly") y += Math.sin(t) * 10;
      else if (c.role === "turtle") y += Math.sin(t * 0.5) * 2;
      else y += Math.sin(t * 1.4) * 3;
    }
    const img = napping ? CREW_SPRITES.turtleSleep : CREW_SPRITES[c.role];
    const bh = h * (CREW_H[c.role] || 0.12);
    let bw = bh;
    if (img && img.complete && img.naturalWidth) bw = bh * (img.naturalWidth / img.naturalHeight);
    ctx.save();
    ctx.translate(x, y);
    if (c.role !== "jelly") ctx.scale(c.vx >= 0 ? 1 : -1, 1);
    const wag = state.opts.motion === false || c.role === "jelly" || napping ? 0 : Math.sin(t * 3) * (c.role === "turtle" ? 0.02 : 0.06);
    ctx.rotate(wag);
    if (img && img.complete && img.naturalWidth) ctx.drawImage(img, -bw / 2, -bh / 2, bw, bh);
    ctx.restore();
    if (state.opts.names !== false) {
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 12px Syne, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(c.name, x, y - bh / 2 - 8);
    }
  }
  function stepCrew(c, dt) {
    const now = Date.now();
    if (c.role === "turtle") {
      if (c.asleep == null) c.asleep = false;
      if (!c.until) c.until = now + 14000 + Math.random() * 12000;
      if (now >= c.until) {
        c.asleep = !c.asleep;
        c.until = now + (c.asleep ? 22000 + Math.random() * 28000 : 16000 + Math.random() * 18000);
        c.vx = 0;
      }
      if (c.asleep) c.vx = 0;
      else if (Math.random() < dt * 0.12) c.vx = (Math.random() < 0.5 ? -1 : 1) * 0.01;
      c.x += c.vx * dt;
      c.y = 0.84;
      if (c.x < 0.1) { c.x = 0.1; c.vx = Math.abs(c.vx || 0.01); }
      if (c.x > 0.9) { c.x = 0.9; c.vx = -Math.abs(c.vx || 0.01); }
      return;
    }
    const slow = c.role === "snail" ? 0.35 : c.role === "jelly" ? 0.45 : 1;
    if (Math.random() < dt * 0.2) c.vx = (Math.random() < 0.5 ? -1 : 1) * 0.025 * slow;
    c.x += c.vx * dt;
    if (c.role === "jelly") {
      const wave = Math.sin(Date.now() / 3200 + c.wobble);
      c.y = Math.max(0.17, Math.min(0.5, 0.33 + wave * 0.15));
    }
    else if (c.role === "otto") c.y = 0.34 + Math.sin(Date.now() / 2200 + c.wobble) * 0.18;
    else c.y = 0.8 + Math.sin(Date.now() / 900 + c.wobble) * 0.03;
    if (c.x < 0.08) { c.x = 0.08; c.vx = Math.abs(c.vx); }
    if (c.x > 0.92) { c.x = 0.92; c.vx = -Math.abs(c.vx); }
  }
  function simWater(now) {
    const hour = new Date().getHours();
    const ambient = 23 + Math.sin(((hour - 6) / 24) * Math.PI * 2) * 1.5;
    const target = state.opts.heater ? (state.opts.temp || 25) : ambient;
    state.temp += (target - state.temp) * 0.02;
    const prev = state.waterAt || now;
    const span = Math.min(72, Math.max(0, (now - prev) / HOUR));
    if (span < 0.004) return;
    state.waterAt = now;
    const wasAlgae = state.algae || 0, wasOxy = state.oxygen == null ? 88 : state.oxygen, wasWaste = state.waste || 0;
    let wasteLifted = 0;
    let digestOut = 0;
    state.fish.forEach(function (f) { digestOut += shed(f, span); });
    const fishN = state.fish.length;
    /* the algae eaters: the otto, and the nerite, which is one too, only slower */
    const algalEaters = state.crew.filter(function (c) { return CLEAN_CREW[c.role]; }).length;
    const algalRate = state.crew.reduce(function (n, c) {
      return n + (c.role === "otto" ? LOOP.ottoAlgae : c.role === "snail" ? LOOP.snailAlgae : 0);
    }, 0);
    /* every other cleaner lifts waste and pays for it in algae. The algae eaters expel
       nothing at all, so they are not counted among the ones making the green. */
    const lifters = state.crew.filter(function (c) { return !CLEAN_CREW[c.role]; }).length;
    const bottoms = state.crew.filter(function (c) { return c.role === "cory" || c.role === "turtle"; }).length;
    const night = rhythm() === "night";
    const day = night ? 0.35 : 1;
    const light = night ? 0.55 : (rhythm() === "dawn" || rhythm() === "dusk" ? 0.8 : 1);
    const mix = mixScale();
    const clear = hasPerk("clear") ? 0.72 : 1;
    const pace = (state.mode === "calm" ? 0.62 : state.mode === "busy" ? 1.45 : 1) * themeOf(state.theme).algae * mix.dirt * clear;
    const load = crowdLoad();
    const algae0 = clamp((state.algae || 0) / 100, 0, 1);
    /* green film with momentum: slow to start, quick in the middle, capped by light */
    const bloom = 0.5 + algae0 * 1.05;
    /* the chain, in one place: cleaners lift waste out of the water and pay for it in
       algae; the water makes a little green of its own; and the only thing that eats that
       green is an algae eater. A tank with cleaners and no otto blooms, every time. */
    const lifted = Math.min(state.waste || 0, lifters * LOOP.cleanPerHour * span);
    wasteLifted = lifted;
    state.algae = clamp((state.algae || 0)
      + span * pace * bloom * LOOP.bloomPerHour * (0.35 + load)
      + lifted * LOOP.algaePerLift
      - span * algalRate, 0, 100);
    /* fish waste, the water's own die-off, what the fish are still digesting, and the
       flakes that rotted - less what the cleaners lifted out. The octopus dispels
       nothing, and neither does an algae eater, so they are not counted as dirty fish. */
    const dirtyFish = state.fish.filter(function (f) { return !CLEAN_SPECIES[f.species]; }).length;
    state.waste = clamp((state.waste || 0)
      + span * (dirtyFish * WASTE.fish * mix.dirt * (0.8 + load * 0.5) + (state.algae || 0) * 0.008)
      + digestOut - wasteLifted, 0, 100);
    /* oxygen: plants and the surface make it, the fish, the waste and the night
       algae spend it, and warm water simply holds less */
    const warm = clamp(1.22 - ((state.temp || 25) - 20) * 0.032, 0.55, 1.25);
    const made = (OX.plant[themeOf(state.theme).id] || OX.plant.river) * light * (hasPerk("clear") ? 0.9 : 1);
    const spent = fishN * OX.fish * (0.55 + load * 0.25) + (state.waste || 0) * OX.waste
      + (night ? (state.algae || 0) * OX.algaeNight * 0.008 : 0);
    state.oxygen = clamp((state.oxygen == null ? 88 : state.oxygen) + span * (made + OX.exchange * warm - spent), 0, 100);
    state.quality = clamp(state.quality + span * (bottoms * 1.8 + algalEaters * 0.4 + 1.6 - fishN * 0.3 * (0.55 + mix.dirt * 0.4) * clear
      - (state.waste || 0) * 0.03 - (state.algae || 0) * 0.02
      - Math.max(0, OX.thin - (state.oxygen || 100)) * 0.05), 0, 100);
    const dir = function (d) { return d > 0.06 ? 1 : d < -0.06 ? -1 : 0; };
    state.trend = {
      algae: dir((state.algae || 0) - wasAlgae),
      oxygen: dir((state.oxygen == null ? 88 : state.oxygen) - wasOxy),
      waste: dir((state.waste || 0) - wasWaste)
    };
    if ((state.oxygen == null ? 88 : state.oxygen) < OX.thin) state._oxyAt = state._oxyAt || now;
    else state._oxyAt = 0;
  }
  function draw() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const now = Date.now();
    const ph = phase();
    const motion = state.opts.motion !== false;
    const art = THEME_ART[themeOf(state.theme).id] || THEME_ART.river;
    const bg = ph === "night" ? art.night : art.day;
    if (bg.complete && bg.naturalWidth) ctx.drawImage(bg, 0, 0, w, h);
    else {
      ctx.fillStyle = ph === "night" ? "#071525" : "#0c3a48";
      ctx.fillRect(0, 0, w, h);
    }
    if (ph === "dusk") {
      ctx.fillStyle = "rgba(40,16,28,0.28)";
      ctx.fillRect(0, 0, w, h);
    }
    if (motion) {
      const shaftA = ph === "day" ? 0.09 : ph === "dusk" ? 0.12 : 0.04;
      const drift = Math.sin(now / 6200) * w * 0.02;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      [[0.30, 0.09], [0.44, 0.12], [0.66, 0.07], [0.86, 0.10]].forEach(function (s, i) {
        const g = ctx.createLinearGradient(0, 0, 0, h * 0.86);
        g.addColorStop(0, "rgba(222,242,255," + (shaftA * (1 + (i % 2) * 0.35) * (0.7 + Math.sin(now / 5200 + i * 1.4) * 0.3)).toFixed(3) + ")");
        g.addColorStop(1, "rgba(200,230,255,0)");
        ctx.fillStyle = g;
        const top = s[0] * w + drift * (1 + i * 0.25);
        const bw = s[1] * w * (1 + Math.sin(now / 4200 + i) * 0.12);
        ctx.beginPath();
        ctx.moveTo(top - bw * 0.14, 0);
        ctx.lineTo(top + bw * 0.14, 0);
        ctx.lineTo(top + bw, h * 0.9);
        ctx.lineTo(top - bw, h * 0.9);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
    }
    const fog = ctx.createLinearGradient(0, 0, 0, h);
    fog.addColorStop(0, ph === "night" ? "rgba(6,18,30,0.34)" : "rgba(118,188,208,0.10)");
    fog.addColorStop(0.55, "rgba(4,14,24,0.05)");
    fog.addColorStop(1, "rgba(2,8,16,0.32)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, w, h);
    if (motion) {
      [[0.42, 0.86], [0.6, 0.88]].forEach(function (a) {
        const g = ctx.createLinearGradient(0, a[1] * h, 0, h * 0.1);
        g.addColorStop(0, "rgba(255,255,255,0.10)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect((a[0] - 0.022) * w, h * 0.1, 0.044 * w, (a[1] - 0.1) * h);
      });
    }
    const film = (state.algae || 0) / 100;
    if (film > 0.02) {
      ctx.fillStyle = "rgba(34,92,28," + (0.1 + film * 0.52) + ")";
      ctx.fillRect(0, h * 0.72, w, h * 0.28);
      ctx.fillRect(0, h * 0.16, Math.max(4, w * film * 0.08), h * 0.62);
      ctx.fillRect(w - Math.max(4, w * film * 0.08), h * 0.16, Math.max(4, w * film * 0.08), h * 0.62);
    }
    drawAlgaeBits(w, h);
    if ((state.quality || 100) < 60) {
      ctx.fillStyle = "rgba(90,60,20," + ((60 - state.quality) / 180) + ")";
      ctx.fillRect(0, 0, w, h);
    }
    drawMotes(w, h, false);
    bubbles.forEach(function (b) {
      const bx = b.x * w, by = b.y * h;
      ctx.beginPath();
      ctx.fillStyle = "rgba(224,244,255,0.14)";
      ctx.arc(bx, by, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.arc(bx - b.r * 0.3, by - b.r * 0.35, Math.max(0.6, b.r * 0.26), 0, Math.PI * 2);
      ctx.fill();
    });
    drawEggs(w, h, now);
    const order = state.fish.slice().sort(function (a, b) {
      const az = a.z == null ? 0.5 : a.z, bz = b.z == null ? 0.5 : b.z;
      if (az !== bz) return az - bz;
      return a.y - b.y;
    });
    (state.predators || []).forEach(function (p) {
      if (!predClose(p, now)) drawPredator(p, w, h, now);
    });
    order.forEach(function (f) { drawFish(f, w, h, now); });
    Object.keys(hitBoxes).forEach(function (k) { if (hitBoxes[k].at !== now) delete hitBoxes[k]; });
    drawInks(w, h, now);
    (state.crew || []).forEach(function (c) { drawCrew(c, w, h, now); });
    (state.predators || []).forEach(function (p) {
      if (predClose(p, now)) drawPredator(p, w, h, now);
    });
    (state.predators || []).forEach(function (p) {
      if (!p.pending || !p.victim) return;
      const v = state.fish.filter(function (f) { return f.id === p.victim; })[0];
      if (!v) return;
      const pulse = motion ? 0.5 + Math.sin(now / 260) * 0.5 : 0.7;
      ctx.save();
      ctx.globalAlpha = 0.35 + pulse * 0.45;
      ctx.strokeStyle = "#fb7185";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(v.x * w, v.y * h, Math.min(h * 0.22, 140) * 0.5 + 10 + pulse * 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    drawFlakes(w, h);
    /* the water itself goes green as the algae climbs: the same number, over everything */
    const grime = clamp((state.algae || 0) / 100, 0, 1);
    if (grime > 0.02) {
      ctx.save();
      ctx.globalAlpha = 0.04 + grime * 0.1;
      ctx.fillStyle = "#5c8f3f";
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    drawMotes(w, h, true);
    ripples.forEach(function (r) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 0.4 - r.t * 0.18);
      ctx.strokeStyle = "#e8f6ff";
      ctx.beginPath();
      ctx.ellipse(r.x * w, r.y * h, r.r * w, r.r * w * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    if (motion) {
      const surf = Math.sin(now / 3400);
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.14 + surf * 3);
      ctx.bezierCurveTo(w * 0.3, h * 0.12 - surf * 4, w * 0.7, h * 0.16 + surf * 4, w, h * 0.13 - surf * 3);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.17 + surf * 2);
      ctx.bezierCurveTo(w * 0.35, h * 0.15 + surf * 3, w * 0.65, h * 0.19 - surf * 3, w, h * 0.16 + surf * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.14);
      ctx.bezierCurveTo(w * 0.3, h * 0.12, w * 0.7, h * 0.16, w, h * 0.13);
      ctx.stroke();
    }
    drawHand(w, h);
    drawGlass(w, h);
  }
  /* What is a cleaner doing right now? Only things the sim actually tracks. */
  function whatCrewIsDoing(c) {
    const algae = Math.round(state.algae == null ? 0 : state.algae);
    const waste = Math.round(state.waste || 0);
    const oxy = Math.round(state.oxygen == null ? 88 : state.oxygen);
    if (c.role === "snail" || c.role === "otto") return "Green film is at " + algae + "% right now.";
    if (c.role === "cory" || c.role === "turtle") return "Waste on the sand reads " + waste + " right now.";
    if (c.role === "jelly") return "Oxygen is " + oxy + "%, and a jelly only pulses when the water is kind.";
    return "";
  }
  /* A cleaner can be sent back: half its price returns as points, and the berth frees up. */
  function releaseCrew(id) {
    const c = (state.crew || []).filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    const cspec = crewOf(c.role) || {};
    const back = Math.floor((cspec.cost || 0) / 2);
    state.crew = (state.crew || []).filter(function (x) { return x.id !== id; });
    /* a run has nothing to pay back with */
    if (!RPG()) state.points = (state.points || 0) + back;
    if (selectedCrew === id) selectedCrew = null;
      log(c.name + " the " + (cspec.name || c.role) + " leaves the glass." +
        (RPG() ? " Nothing is bought in a run, so nothing comes back." : " Sent back to the shop. +" + back + " pts."));
    keeperNote(c.name + " has worked this glass for " + hours(ageOf(c, Date.now())) +
      " hours. " + (RPG() ? "The berth is free again." : "Half the price comes back and the berth is free again."));
    save();
    railSig = "";
    renderRail();
  }
  function pickCrew(id) {
    selectedCrew = id;
    selected = null;
    railSig = "";
    renderRail();
    hideFishCard();
  }
  /* ---- spawning, the RPG way ----
     Any fish may be put in the water and none of them cost anything, but the shelf holds two
     of each kind and that is the whole point of the mode: past your two, the only route to a
     bigger tank is a pair of them breeding in the water. */
  function spawnFish(id) {
    if (!RPG() || !state) return;
    const spec = specOf(id);
    if (!spec) return;
    const mine = state.fish.filter(function (f) { return f.species === id; });
    if (mine.length >= 2) {
      log("Two " + spec.name + " is the shelf. What is in the water has to breed.");
      keeperNote("Two of each kind is all the RPG gives you. Leave a male and a female and wait - the pair does the rest.");
      return;
    }
    if (state.fish.length >= FISH_CAP) { log("The water is full at " + FISH_CAP + "."); return; }
    const fish = makeFish(id, null);
    state.fish.push(fish);
    if (state.run) state.run.added += 1;
    log(spec.name + " goes in free. " + (mine.length + 1) + "/2 of its kind in the water.");
    save();
    paintRpg();
  }
  /* the panel: the shelf, the pairs, and the state of the run */
  function paintRpg() {
    if (!RPG() || !state) return;
    let box = document.getElementById("rpgPanel");
    if (!box) {
      /* the run's shelf stands in the paid shelf's own slot, under the same heading: it is
         the only way to add a fish in a run, so it belongs where the shop used to be */
      const anchor = document.getElementById("shop") || document.getElementById("crewShop");
      if (!anchor || !anchor.parentNode) return;
      box = document.createElement("div");
      box.id = "rpgPanel";
      box.className = "rpg-panel wgrid";
      anchor.parentNode.insertBefore(box, anchor);
    }
    const run = state.run || {};
    const k = state.fish.length;
    const kinds = {};
    state.fish.forEach(function (f) { kinds[f.species] = (kinds[f.species] || 0) + 1; });
    const rows = SPECIES.map(function (s) {
      const n = kinds[s.id] || 0;
      const hasM = state.fish.some(function (f) { return f.species === s.id && f.sex !== "f"; });
      const hasF = state.fish.some(function (f) { return f.species === s.id && f.sex === "f"; });
      /* short on purpose: the shelf's note column is about 86px wide and a wrapped note
         makes the whole row look broken */
      const pair = hasM && hasF ? "paired" : n ? "needs a mate" : "not here";
      return "<div class='wrow'><span class='wlabel'>" + esc(s.name) + "</span>" +
        "<b class='q-fair'>" + n + "/2</b><span class='wsub'>" + pair + "</span>" +
        "<button type='button' class='btn' data-spawn='" + s.id + "'" + (n >= 2 ? " disabled" : "") + ">" +
        (n >= 2 ? "full" : "spawn") + "</button></div>";
    }).join("");
    box.innerHTML =
      "<p class='kicker'>Fish Tank RPG</p>" +
      "<p class='lore'>No points, no shop. Two of each kind from the shelf, everything else from a pair breeding." +
      " A pair breeds once a 30 minute window, at a moment of its own, so watch and wait. A run that empties is over.</p>" +
      "<div class='wrow'><span class='wlabel'>run</span><b class='q-fair'>" +
      hours(Date.now() - (run.start || Date.now())) + "h</b><span class='wsub'>" + k + " fish · " +
      Object.keys(kinds).length + " kinds" + (run.collapsed ? " · over" : "") + "</span>" +
      "<span></span></div>" + rows;
  }
  /* the run, watched from the outside -
     Nothing here reaches into the simulation: it counts what appears and what is lost, and
     when the last fish is gone it calls the run, because a tank with nothing in it is over
     however good the water looks. */
  /* a run flagged at the menu becomes a run as soon as the water does */
  let menuRpg = false;
  /* once per page load, not once per save: the shell's markup is standard every time the page
     opens, so a flag kept in the tank would leave a resumed run reading like the other mode */
  let copiedFor = null;
  /* The shell's copy talks about points in a mode that has none. Swapped once, when the run
     starts: the keeper's own line, the how-to card, the paragraphs that promise points for
     feeding and for marks, and the two buttons that still advertise a price. */
  /* The two modes stand alone, copy included. This runs for whatever tank is on the glass,
     every time one starts, and writes that mode's own words: the standard originals or the
     run's. One-way swaps are what left a standard tank reading like a run. */
  function modeCopy() {
    const rpg = RPG();
    const swap = function (find, put) {
      const els = [].slice.call(document.querySelectorAll("p.lore, li, span, b"));
      for (let i = 0; i < els.length; i += 1) {
        if (els[i].children.length) continue;
        if (els[i].textContent.indexOf(find) < 0) continue;
        els[i].textContent = els[i].textContent.split(find).join(put);
      }
    };
    if (rpg) swap("Points come from every flake a fish actually eats — so feeding is the job.", "There is no shop in a run, so nothing is bought: every fish in the water came from your pick, the shelf, or a pair breeding. Feeding is still the job.");
    else swap("There is no shop in a run, so nothing is bought: every fish in the water came from your pick, the shelf, or a pair breeding. Feeding is still the job.", "Points come from every flake a fish actually eats — so feeding is the job.");
    if (rpg) swap("All of it earns points. Points buy more fish and cleaners. The Firsts list pays for milestones.", "The clock pays a run in hours survived, not points. Two of each kind is all the shelf gives you; the rest has to breed.");
    else swap("The clock pays a run in hours survived, not points. Two of each kind is all the shelf gives you; the rest has to breed.", "All of it earns points. Points buy more fish and cleaners. The Firsts list pays for milestones.");
    if (rpg) swap("A water change costs 10 points.", "A water change is free in a run.");
    else swap("A water change is free in a run.", "A water change costs 10 points.");
    if (rpg) swap("Marks pay points the first time they happen.", "Marks are what the run is measured on.");
    else swap("Marks are what the run is measured on.", "Marks pay points the first time they happen.");
    if (rpg) swap("About a day and a half with no food, and a fish dies.", "Feed them inside the hour: a fish with no food for an hour is a dead fish.");
    else swap("Feed them inside the hour: a fish with no food for an hour is a dead fish.", "About a day and a half with no food, and a fish dies.");
    if (rpg) swap("No food for about a day and a half, and that fish dies.", "No food for about an hour, and that fish dies.");
    else swap("No food for about an hour, and that fish dies.", "No food for about a day and a half, and that fish dies.");
    if (rpg) swap("A pellet adds a day to whoever reaches it first.", "A pellet fills whoever reaches it first for the hour.");
    else swap("A pellet fills whoever reaches it first for the hour.", "A pellet adds a day to whoever reaches it first.");
    if (rpg) swap("Buy one here, then pick it in the list above", "Nothing is bought in a run: take one and it starts work, then pick it in the list above");
    else swap("Nothing is bought in a run: take one and it starts work, then pick it in the list above", "Buy one here, then pick it in the list above");
    if (rpg) swap("The keeper picks the fish, feeds, and tends the water. Hunters still roll. You cannot stop them.", "The keeper keeps them fed and tends the water, and does its best. No promises. Hunters still roll; you cannot stop them.");
    else swap("The keeper keeps them fed and tends the water, and does its best. No promises. Hunters still roll; you cannot stop them.", "The keeper picks the fish, feeds, and tends the water. Hunters still roll. You cannot stop them.");
    const how = document.getElementById("howLine");
    if (how) how.textContent = rpg ? "Ages, food, water, cleaners, and the run." : "Ages, food, water, cleaners, points.";
    const wc = document.getElementById("change");
    if (wc) wc.textContent = rpg ? "Water change · free" : "Water change · 10";
    const pl = document.getElementById("pellet");
    if (pl) pl.textContent = rpg ? "Pellet · free" : "Pellet · 15";
  }
  function applyRpgRun() {
    if (!menuRpg || !state) return;
    menuRpg = false;
    state.opts = state.opts || {};
    state.opts.mode = "rpg";
    state.points = 0;
    /* the shell's welcome line announces a standard tank, because the run is only flagged
       here: the run's own first line has to say what the tank actually is */
    if (state.log && state.log[0]) state.log[0] = state.log[0].replace(/Mode: [a-z]+\.$/, "Mode: rpg.");
    if (!state.run) {
      state.run = { start: Date.now(), added: 0, lost: 0, seen: state.fish.length, collapsed: false, ended: 0 };
    }
    modeCopy();
    log("Fish Tank RPG. Three of your pick, two of a kind from the shelf, and the rest has to breed. Nothing can be bought.");
    keeperNote("Fish Tank RPG: feed them, watch the water, and let the pairs breed. There is no shop to fall back on, and an empty tank ends the run.");
    save();
  }
  /* the copy has to land for a standard tank too, which stepRpg never sees */
  function modeCopyTick() {
    if (!state) return;
    const key = state.openedAt || 1;
    if (copiedFor !== key) { copiedFor = key; modeCopy(); }
  }
  function stepRpg(now) {
    if (!RPG() || !state.run || state.run.collapsed) return;
    /* nothing can be bought, so nothing can be saved up */
    if (state.points) state.points = 0;
    if (now - (state._rpgDrew || 0) > 1000) { state._rpgDrew = now; paintRpg(); }
    const n = state.fish.length;
    if (n > (state.run.seen || 0)) state.run.added += n - (state.run.seen || 0);
    if (n < (state.run.seen || 0)) state.run.lost += (state.run.seen || 0) - n;
    state.run.seen = n;
    if (!n) {
      state.run.collapsed = true;
      state.run.ended = Date.now();
      const h = hours(state.run.ended - state.run.start);
      log("The tank is empty after " + h + "h. " + state.run.added + " fish came, " +
        state.run.lost + " went. The ecology did not hold.");
      keeperNote("Fish Tank RPG: that run is over. Three of your pick, two of a kind, and the rest has to breed - start another and see if the maths holds next time.");
      save();
    }
  }
  /* the octopus and the algae eater are the two that dispel nothing */
  const CLEAN_SPECIES = { octo: true };
  /* the crew that expel nothing: they eat the green instead of making it */
  const CLEAN_CREW = { otto: true, snail: true };
  /* ---- Fish Tank RPG ----
     The same tank, the same maths, without the shop. Nothing pays points, so nothing can be
     bought: every fish is free but the shelf only holds two of each kind, and past those two
     the only way to a bigger tank is a pair breeding in the water. Cleaners work the same
     way, which is why the algae eaters matter more here than anywhere. */
  function RPG() { return !!(state && state.opts && state.opts.mode === "rpg"); }

  /* ---- one beat of the feeding loop ----
     Flakes nobody took rot where they lie. The algae eater works the sand, because that is
     where the green settles. An algae eater that has food and kind water lays a clutch:
     that is the only way a tank ever gets a third one, because the shop stops at two. */
  function stepLoop(dt, now) {
    if (!state) return;
    let rotted = 0;
    flakes.forEach(function (fl) {
      fl.rot = (fl.rot || 0) + dt;
      if (!fl.gone && fl.rot > LOOP.flakeRot) {
        fl.gone = true;
        rotted += 1;
        /* it does not disappear: it turns green where it settled, and it waits there for
           an algae eater to come and take it off the sand */
        algaeBits.push({ x: fl.x, y: 0.88 + Math.random() * 0.06, r: 2.4 + Math.random() * 2.6,
          wob: Math.random() * 3, age: 0, pulse: Math.random() });
      }
    });
    if (rotted) {
      flakes = flakes.filter(function (fl) { return !fl.gone; });
      state.algae = clamp((state.algae || 0) + rotted * LOOP.rotAlgae, 0, 100);
      if (Math.random() < 0.5) {
        log(rotted === 1 ? "A flake nobody ate settles on the sand and turns green."
          : rotted + " flakes nobody ate settle on the sand and turn green.");
      }
    }
    /* The green on the sand is the algae readout made visible: the number decides how much
       of it there is, and it fills back in slowly behind anything that grazes. */
    const wantBits = Math.round(clamp((state.algae || 0) / 100, 0, 1) * LOOP.algaeBits);
    if (algaeBits.length < wantBits && now - (state._bitAt || 0) > LOOP.bitSpawnMs) {
      state._bitAt = now;
      algaeBits.push({ x: 0.04 + Math.random() * 0.92, y: 0.86 + Math.random() * 0.09,
        r: 2 + Math.random() * 3.4, wob: Math.random() * 3, age: 0, pulse: Math.random() });
    }
    while (algaeBits.length > wantBits) algaeBits.shift();
    algaeBits.forEach(function (b) { b.age = (b.age || 0) + dt; });
    /* the algae eater works through them, and the number comes down with each patch */
    if (algaeBits.length) {
      state.crew.forEach(function (c) {
        if (c.role !== "otto" && c.role !== "snail") return;
        const reach = c.role === "otto" ? 0.055 : 0.036;
        for (let i = algaeBits.length - 1; i >= 0; i -= 1) {
          const b = algaeBits[i];
          if (Math.abs(b.x - c.x) > reach || Math.abs(b.y - c.y) > 0.12) continue;
          algaeBits.splice(i, 1);
          state.algae = clamp((state.algae || 0) - LOOP.bitEat, 0, 100);
          if (Math.random() < 0.25) playSfx("nibble");
        }
      });
    }
    state.crew.forEach(function (c) {
      /* The nerite is a snail: it walks the sand and never floats. It steps, then creeps,
         then steps again, and it turns around at the glass instead of climbing it. */
      if (c.role === "snail") {
        if (!c.walkDir) c.walkDir = Math.random() < 0.5 ? -1 : 1;
        if (c.x < 0.07) c.walkDir = 1;
        if (c.x > 0.93) c.walkDir = -1;
        const step = Math.sin(now / 2800 + c.wobble) > 0.35 ? 0.03 : 0.006;
        c.vx = c.walkDir * step;
        c.x = clamp(c.x + c.vx * dt, 0.05, 0.95);
        c.y = clamp(0.88 + Math.sin(now / 9000 + c.wobble) * 0.015, 0.85, 0.92);
        c.vy = 0;
        return;
      }
      if (c.role === "otto") c.y = clamp(0.79 + Math.sin(now / 3400 + c.wobble) * 0.05, 0.72, 0.9);
      if (c.role !== "otto") return;
      if (c.eggs && now >= c.eggs) {
        c.eggs = 0;
        if (state.crew.length < 8) {
          const baby = makeCrew("otto");
          baby.bought = false;
          baby.bred = true;
          baby.name = "Otto fry";
          state.crew.push(baby);
          log("An algae eater fry hatches on the glass. " + state.crew.length + "/8 berths.");
          keeperNote("The algae eaters bred. That is the only way past two - buy the pair, then let them work.");
          save();
        }
        return;
      }
      if (state.crew.length >= 8) return;
      if ((state.algae || 0) < 12) return;
      /* the same window in a run: a clutch a window, at a moment of its own, and the fry
         follows within the window rather than hours later */
      const cwin = RPG() ? Math.min(LOOP.ottoClutch * HOUR, LOOP.rpgBreedMin * 60000) : LOOP.ottoClutch * HOUR;
      const cwait = (RPG() && c.clutchWait != null) ? c.clutchWait : cwin;
      if (now - (c.lastClutch || 0) < cwait) return;
      c.lastClutch = now;
      if (RPG()) c.clutchWait = Math.floor(Math.random() * cwin);
      c.eggs = now + (RPG() ? Math.min(LOOP.ottoHatch * HOUR, LOOP.rpgBreedMin * 60000) : LOOP.ottoHatch * HOUR);
      log(c.name + " lays a clutch on the glass.");
      save();
    });
  }
  function renderRail() {
    const now = Date.now();
    /* ---- every fish and every cleaner, in one box that scrolls ----
       Rows stay dense so the glass can hold a hundred names and the panel still reads.
       The full portrait - traits, social lines, parents, DNA - is expanded for the one
       fish that is picked, and always on its card above. */
    const list = document.getElementById("fishList");
    const findEl = document.getElementById("manageFind");
    const q = (findEl && findEl.value ? findEl.value : "").trim().toLowerCase();
    const matches = function (hay) { return !q || hay.toLowerCase().indexOf(q) >= 0; };
    const shown = state.fish.filter(function (f) {
      const spec = specOf(f.species);
      return matches(String(f.name) + " " + spec.name + " " + (spec.latin || "") +
        (f.gen > 1 ? " gen " + f.gen : "") + " " + stageName(bodyAge(f), f.species));
    });
    const crewAll = state.crew || [];
    const crewShown = crewAll.filter(function (c) {
      return matches(String(c.name) + " " + c.role + " " + ((crewOf(c.role) || {}).name || ""));
    });
    const fishHtml = (shown.length ? "<p class='group-head'>Fish <span>" + shown.length +
        (shown.length === state.fish.length ? "" : " of " + state.fish.length) +
        " · " + Math.round(fishLoad()) + "/" + loadCap() + " load</span></p>" : "") +
      shown.map(function (f) {
        const mood = moodOf(f, now);
        const word = stateWord(f);
        const spec = specOf(f.species);
        const rich = f.id === selected;
        const line = [spec.name, stageName(bodyAge(f), f.species),
          Math.round(f.hp || 0) + "/" + vitals(f).hp + " hp",
          isFull(f, now) ? "full" : "hungry",
          "feed " + hours(Math.max(0, foodLeft(f, now))) + "h"].join(" · ");
        let body = "<b>" + esc(f.name) + "</b>" + (f.gen > 1 ? " <span class='gen'>gen " + f.gen + "</span>" : "") +
          " <span class='mood-" + mood + "'>" + mood + "</span><br><span class='lore'>" + esc(line) +
          (word ? " · <b class='act'>" + word + "</b>" : "") + "</span>";
        if (rich) {
          const tr = traits(f);
          const mine = [traitWord("bold", tr.bold), traitWord("social", tr.social),
            traitWord("appetite", tr.appetite), traitWord("vigor", tr.vigor)].join(", ");
          const social = socialLine(f);
          body += "<br><span class='lore'>" + esc(mine) +
            (social ? "<br>" + esc(social) : "") +
            (tempNote(f) ? "<br>water: " + esc(tempNote(f)) : "") +
            (f.parentNames && f.parentNames.length ? "<br>from " + esc(f.parentNames.join(" and ")) : "") +
            (f.dna ? "<br><span class='dnabit'>" + esc(f.dna) + "</span>" : "") + "</span>";
        }
        return "<button type='button' class='fishline" + (rich ? " on" : "") + "' data-id='" + f.id + "'>" + body + "</button>";
      }).join("");
    const crewHtml = (crewAll.length ? "<p class='group-head'>Cleaners <span>" + crewShown.length + " of " +
        crewAll.length + " · " + crewAll.length + "/8 berths</span></p>" : "") +
      crewShown.map(function (c) {
        const cspec = crewOf(c.role) || { name: c.role, blurb: "" };
        const on = c.id === selectedCrew;
        const onJob = ageOf(c, now);
        return "<button type='button' class='fishline crewline" + (on ? " on" : "") + "' data-crew-id='" + c.id + "'>" +
          "<b>" + esc(c.name) + "</b> <span class='gen'>cleaner</span><br><span class='lore'>" + esc(cspec.name) +
          " · on the job " + hours(onJob) + "h · " + Math.round(Math.max(0, CREW_LIFE - onJob) / DAY) + "d left</span>" +
          (on && cspec.blurb ? "<br><span class='lore'>" + esc(cspec.blurb) + "</span>" : "") + "</button>";
      }).join("");
    const sig = [state.fish.length, crewAll.length, selected, selectedCrew, q].join("~") + "|" +
      shown.map(function (f) {
        return f.id + moodOf(f, now) + Math.round(f.hp || 0) + hours(Math.max(0, foodLeft(f, now))) +
          (stateWord(f) || "") + stageName(bodyAge(f), f.species);
      }).join(",") + "|" + crewShown.map(function (c) {
        return c.id + hours(ageOf(c, now)) + (c.id === selectedCrew ? "*" : "");
      }).join(",");
    if (sig !== railSig) {
      railSig = sig;
      const box = document.getElementById("manageScroll");
      const keep = box ? box.scrollTop : 0;
      list.innerHTML = fishHtml || (q ? "<p class='lore'>No fish matches that.</p>"
        : "<p class='lore'>" + (RPG() ? "The tank is empty. Spawn one from the shelf." : "The tank is empty. Buy a fish.") + "</p>");
      const crewList = document.getElementById("crewList");
      if (crewList) {
        crewList.innerHTML = crewHtml || (q && crewAll.length ? "<p class='lore'>No cleaner matches that.</p>" : "");
      }
      if (box) box.scrollTop = keep;
    }
    const countEl = document.getElementById("manageCount");
    if (countEl) countEl.textContent = state.fish.length + " fish" + (crewAll.length ? " · " + crewAll.length + " cl" : "");
    const footEl = document.getElementById("manageFoot");
    if (footEl) {
      footEl.textContent = (state.fish.length > 12 ? "The list scrolls — " + state.fish.length + " names in the glass. " : "") +
        "Click a name for its card.";
    }
    const graves = document.getElementById("graves");
    graves.innerHTML = state.cemetery.slice(0, 8).map(function (g) {
      return "<div class='grave'><b>" + esc(g.name) + "</b><br><span class='lore'>" + esc(g.species) +
        " · fish " + g.score + "h · tank " + (g.tankHours || 0) + "h · " + esc(g.theme || "") + "</span></div>";
    }).join("") || "<p class='lore'>No stones yet.</p>";
    document.getElementById("log").innerHTML = state.log.slice(0, 10).map(function (t) { return "<div>" + esc(t) + "</div>"; }).join("");
    document.getElementById("points").textContent = RPG() && state.run
      ? "run " + hours(Date.now() - state.run.start) + "h"
      : state.points + " pts";
    const clock = document.getElementById("clock");
    const d = new Date();
    clock.textContent = themeOf(state.theme).name + " · " + phase() + " · " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    /* A run has no points and no shop, so it gets no paid shelf: the run's own shelf (two of
       each kind, free) takes this slot instead. Leaving the paid row up put two sets of fish
       buttons in the rail, the top set wearing prices nobody in a run can pay. */
    const shop = document.getElementById("shop");
    const shopHead = document.getElementById("shopHead");
    const shelf = RPG();
    if (shopHead) shopHead.textContent = shelf ? "The shelf" : "Bring a baby";
    const cost = price();
    shop.innerHTML = shelf ? "" : SPECIES.map(function (s) {
      const taken = s.id === "octo" && hasOcto();
      return "<button type='button' class='btn' " + (taken ? "disabled " : "") + "data-buy='" + s.id + "'>" +
        esc(s.name) + (taken ? " · one already" : (" · " + cost)) +
        "<br><span class='lore'>" + esc(s.blurb) + "</span></button>";
    }).join("");
    shop.hidden = shelf;
    const f = state.fish.filter(function (x) { return x.id === selected; })[0];
    const name = document.getElementById("fishName");
    if (document.activeElement !== name) {
      const pickedCrew = selectedCrew ? (state.crew || []).filter(function (x) { return x.id === selectedCrew; })[0] : null;
      name.value = pickedCrew ? pickedCrew.name : (f ? f.name : "");
      name.placeholder = pickedCrew ? "Cleaner name" : "Name";
    }
    paintChar(f, now);
    const ranked = state.fish.slice().sort(function (a, b) { return ageOf(b, now) - ageOf(a, now); });
    const long = ranked.length ? ageOf(ranked[0], now) : 0;
    const hall = state.cemetery.reduce(function (m, g) { return Math.max(m, g.score || 0); }, 0);
    const liveEl = document.getElementById("mLiving");
    liveEl.textContent = state.fish.length + " · " + Math.round(fishLoad()) + "/" + loadCap();
    liveEl.title = "bodies · space used of the load this glass can carry. Small schooling fish cost less space than big solo fish.";
    const huntEl = document.getElementById("mHunters");
    if (huntEl) huntEl.textContent = (state.predators || []).length + "/" + HUNTER_CAP;
    const autoBtn = document.getElementById("btnAuto");
    if (autoBtn) {
      autoBtn.textContent = state.auto ? "Auto on" : "Auto";
      autoBtn.classList.toggle("gold", !!state.auto);
    }
    document.getElementById("mLong").textContent = hours(long) + " h";
    document.getElementById("mTank").textContent = hours(tankAge(now)) + " h";
    document.getElementById("mBest").textContent = hall + " h";
    const mTemp = document.getElementById("mTemp");
    mTemp.textContent = (Math.round(state.temp * 10) / 10) + "°";
    const offs = state.fish.map(function (x) { return comfort(x); });
    const worst = offs.length ? Math.max.apply(null, offs) : 0;
    mTemp.className = worst > 2.5 ? "q-poor" : worst > 1.5 ? "q-fair" : "q-good";
    document.getElementById("mAlgae").textContent = Math.round(state.algae) + "%";
    const oxyEl = document.getElementById("mOxy");
    if (oxyEl) {
      const oxy = Math.round(state.oxygen == null ? 88 : state.oxygen);
      oxyEl.textContent = oxy + "%";
      oxyEl.className = oxy >= OX.thin + 12 ? "q-good" : oxy >= OX.thin ? "q-fair" : "q-poor";
    }
    const qEl = document.getElementById("mQual");
    qEl.textContent = String(Math.round(state.quality));
    qEl.className = state.quality >= 70 ? "q-good" : state.quality >= 40 ? "q-fair" : "q-poor";
    const eg = document.getElementById("mEggs");
    if (eg) {
      eg.textContent = String((state.eggs || []).length);
      eg.className = (state.eggs || []).length ? "q-good" : "";
    }
    const gn = document.getElementById("mGen");
    if (gn) gn.textContent = "gen " + (state.gen || 1);
    document.getElementById("board").classList.toggle("hidden", state.opts.board === false);
    const boardTop = ranked.slice(0, 12);
    document.getElementById("boardRows").innerHTML = "<div class='rowline head'><span>Name</span><span>Kind</span><span>Age</span><span>Mood</span></div>" +
      (ranked.length > boardTop.length ? "<div class='rowline'><span>top " + boardTop.length + " of " + ranked.length +
        "</span><span>oldest first</span><span></span><span></span></div>" : "") +
      boardTop.map(function (fish) {
        return "<div class='rowline'><span>" + esc(fish.name) + "</span><span>" + esc(specOf(fish.species).name) +
          "</span><span>" + hours(ageOf(fish, now)) + "h</span><span class='mood-" + moodOf(fish, now) + "'>" + moodOf(fish, now) + "</span></div>";
      }).join("") +
      (state.crew || []).map(function (c) {
        return "<div class='rowline'><span>" + esc(c.name) + "</span><span>cleaner</span><span>" +
          hours(ageOf(c, now)) + "h</span><span>work</span></div>";
      }).join("");
    const crewShop = document.getElementById("crewShop");
    crewShop.innerHTML = CREW.map(function (c) {
      const owned = state.crew.filter(function (x) { return x.role === c.id; });
      const bought = owned.filter(function (x) { return x.bought !== false; }).length;
      const bred = owned.length - bought;
      /* the final cleaner is the one the shop rations: two from the shop, the rest bred */
      const rationed = c.id === "otto" || RPG();
      const soldOut = rationed && bought >= LOOP.ottoBought;
      return "<button type='button' class='btn' data-crew='" + c.id + "'" + (soldOut ? " disabled" : "") + ">" +
        esc(c.name) + " · " + (RPG() ? "free" : c.cost) + " <span class='lore'>(" + owned.length +
        (rationed ? " · " + bought + "/" + LOOP.ottoBought + " from the shop" : "") +
        (bred ? " · " + bred + " bred" : "") +
        (soldOut ? " - it has to breed now" : "") + ") " + esc(c.blurb) + "</span></button>";
    }).join("");
    const wp = document.getElementById("waterPanel");
    if (wp) {
      const oxy = Math.round(state.oxygen == null ? 88 : state.oxygen);
      const waste = Math.round(state.waste || 0);
      const trend = state.trend || { algae: 0, oxygen: 0, waste: 0 };
      /* what the tank makes in an hour against what the algae eaters can clear: a tank of
         cleaners with nothing eating the green is an open loop, however many are on it */
      const loadNow = loadCap() ? fishLoad() / loadCap() : 0;
      const madeRate = LOOP.bloomPerHour * (0.35 + loadNow) +
        (state.crew || []).filter(function (c) { return !CLEAN_CREW[c.role]; }).length *
          LOOP.cleanPerHour * LOOP.algaePerLift;
      const arrow = function (d) { return d > 0 ? "▲" : d < 0 ? "▼" : "·"; };
      const band = function (v, good, fair) { return v >= good ? "q-good" : v >= fair ? "q-fair" : "q-poor"; };
      let warm = 0, cold = 0, ok = 0;
      state.fish.forEach(function (x) {
        const t = tempNote(x);
        if (t === "too warm") warm += 1;
        else if (t === "too cold") cold += 1;
        else ok += 1;
      });
      /* the algae eaters: the otto, and the nerite, which is one too, only slower */
    const algalEaters = state.crew.filter(function (c) { return CLEAN_CREW[c.role]; }).length;
    const algalRate = state.crew.reduce(function (n, c) {
      return n + (c.role === "otto" ? LOOP.ottoAlgae : c.role === "snail" ? LOOP.snailAlgae : 0);
    }, 0);
    /* every other cleaner lifts waste and pays for it in algae. The algae eaters expel
       nothing at all, so they are not counted among the ones making the green. */
    const lifters = state.crew.filter(function (c) { return !CLEAN_CREW[c.role]; }).length;
      const bottoms = state.crew.filter(function (c) { return c.role === "cory" || c.role === "turtle"; }).length;
      const load = crowdLoad();
      const rows = [
        ["oxygen", oxy + "% " + arrow(-trend.oxygen), band(oxy, OX.thin + 12, OX.thin), oxy / 100, oxy < OX.thin ? "thin for " + elapsedWord(state._oxyAt) : "fine"],
        ["waste", waste + "% " + arrow(trend.waste), band(100 - waste, 55, 30), waste / 100, bottoms ? bottoms + " lifting" : "nobody lifting"],
        ["algae", Math.round(state.algae) + "% " + arrow(trend.algae), band(100 - state.algae, 55, 32), state.algae / 100,
          algalEaters
            ? algalEaters + " algae eater" + (algalEaters === 1 ? "" : "s") + " · " + algalRate.toFixed(1) + " algae/h"
            : "no algae eater"],
        ["the loop", algalRate >= madeRate ? "closed" : "open - add an algae eater",
          band(algalRate >= madeRate ? 70 : 18, 55, 32), Math.min(1, algalRate / Math.max(0.1, madeRate)),
          "makes " + madeRate.toFixed(1) + "/h · eats " + algalRate.toFixed(1) + "/h · " +
          state.crew.filter(function (x) { return x.role === "otto" && x.bought !== false; }).length + "/" + LOOP.ottoBought + " bought"],
        ["space used", Math.round(fishLoad()) + "/" + loadCap(), band(100 - load * 55, 60, 40), Math.min(1, load), load > 0.95 ? "healing slower" : "water is keeping up"],
        ["public hall", state.hallPublic
          ? (hallBest() ? (hallBest().hours + "h · " + hallBest().fish + " by " + hallBest().keeper) : "no lives inscribed yet")
          : "reading the hall", "q-fair", 0.5,
          Math.max(hallBest() ? hallBest().hours : 0, hall) > 0 ? "your best here " + hall + "h" : "longest life wins"]
      ];
      wp.innerHTML =
        "<div class='wgrid'>" + rows.map(function (r) {
          return "<div class='wrow'><span class='wlabel'>" + r[0] + "</span><b class='" + r[2] + "'>" + r[1] +
            "</b><em>" + r[4] + "</em><i class='bar'><u style='width:" + Math.round(clamp(r[3], 0, 1) * 100) + "%'></u></i></div>";
        }).join("") + "</div>" +
        "<p class='lore wline'>surface " + (Math.round(tempAt(0.12) * 10) / 10) + "° · bottom " + (Math.round(tempAt(0.88) * 10) / 10) +
        "° · " + rhythm() + "</p>" +
        "<p class='lore wline'>" + (ok + " comfortable") + (warm ? ", " + warm + " too warm" : "") + (cold ? ", " + cold + " too cold" : "") +
        " · cleaners " + ((state.crew || []).length) + "/8</p>";
    }
    const noteEl = document.getElementById("waterNote");
    if (noteEl) {
      const notes = [];
      let warm = 0, cold = 0, warmWalk = 0;
      state.fish.forEach(function (x) {
        if (tempNote(x) === "too warm") {
          if (motionOf(x).walk) warmWalk += 1;
          else warm += 1;
        } else if (tempNote(x) === "too cold") cold += 1;
      });
      if (warm) notes.push(warm + (warm > 1 ? " fish find" : " fish finds") + " the water too warm — they gulp at the surface.");
      if (warmWalk) notes.push(warmWalk + (warmWalk > 1 ? " on the sand tuck" : " on the sand tucks") + " against the rocks. The water is too warm.");
      if (cold) notes.push(cold + (cold > 1 ? " fish find" : " fish finds") + " it too cold — they hang low and slow.");
      if ((state.quality || 0) < 45) notes.push("The water is foul. Fish are listless and scratch on the rockwork.");
      if ((state.algae || 0) > 68) notes.push("Green film everywhere. The cleaners cannot keep up.");
      const oxyNote = oxygenNote();
      if (oxyNote) notes.push(oxyNote);
      const wNote = wasteNote();
      if (wNote) notes.push(wNote);
      if (state.fish.length >= (hasPerk("crowd") ? 42 : 30)) notes.push("Crowded. Everyone heals slower.");
      if (crowdLoad() > 0.85 && canAdd("glimmer")) notes.push("The glass is filling. Healing slows as it fills.");
      if ((state.eggs || []).length) notes.push((state.eggs || []).length + " egg" + ((state.eggs || []).length > 1 ? "s" : "") + " on the rockwork.");
      noteEl.textContent = notes.join(" ") || "Water is steady.";
    }
    const goalEl = document.getElementById("goals");
    if (goalEl) {
      /* a run's marks are what it is measured on, so they carry no price tag either */
      const pays = !RPG();
      goalEl.innerHTML = GOALS.map(function (g) {
        const done = state.goals && state.goals[g.id];
        return "<div class='goal" + (done ? " done" : "") + "'>" + (done ? "✓" : "·") + " " + esc(g.text) +
          (done || !pays ? "" : " <span class='lore'>+" + g.pay + "</span>") + "</div>";
      }).join("");
    }
  }
  function portraitSrc(id) {
    if (id === "octo" || id === "mandarin" || id === "pepper" || id === "tusk" || id === "dragon" || id === "mask") return "./assets/fish/" + id + "_r.png";
    if (id === "claw" || id === "crab") return "./assets/fish/" + id + "_r.png";
    return "./assets/fish/" + id + "_adult.png";
  }
  function paintChar(f, now) {
    const title = document.getElementById("charTitle");
    const latin = document.getElementById("charLatin");
    const niche = document.getElementById("charNiche");
    const bio = document.getElementById("charBio");
    const stats = document.getElementById("charStats");
    const pic = document.getElementById("charPic");
    if (!title) return;
    /* a cleaner the keeper is looking at: what it is, what it is doing, and the way out */
    if (selectedCrew) {
      const c = (state.crew || []).filter(function (x) { return x.id === selectedCrew; })[0];
      if (c) {
        const cspec = crewOf(c.role) || { name: c.role, blurb: "" };
        const onJob = ageOf(c, now);
        const card = document.getElementById("charCard");
        if (card) card.className = "char-card card-crew";
        title.textContent = c.name;
        latin.textContent = cspec.name + " · cleaner";
        niche.textContent = "Cleaners";
        bio.textContent = (cspec.blurb || "") + " " + whatCrewIsDoing(c) +
          (c.role === "otto"
            ? (RPG()
              ? " Algae eaters are the last link in the chain: the shelf holds two and no more, so the rest have to be bred."
              : " Algae eaters are the last link in the chain: the shop sells two and no more, so the rest have to be bred.")
            : c.role === "snail"
              ? (RPG()
                ? " A nerite is an algae eater too, only slower, and it expels nothing. The shelf holds two of these as well."
                : " A nerite is an algae eater too, only slower, and it expels nothing. The shop never runs out of them.")
              : "");
        pic.removeAttribute("src");
        pic.alt = "";
        const acts = document.getElementById("charActions");
        if (acts) {
          /* nothing was paid for this one in a run, so nothing comes back: the button sells
             the berth, not a refund */
          acts.innerHTML = "<button type='button' class='btn' data-release='" + c.id + "'>Release" +
            (RPG() ? " · frees the berth" : " · +" + Math.floor((cspec.cost || 0) / 2) + " pts") + "</button>";
        }
        stats.innerHTML = [
          ["From", c.bought === false ? "bred in this tank" : (RPG() ? "the shelf" : "the shop")],
          ["On the job", hours(onJob) + " h"],
          ["Service left", Math.round(Math.max(0, CREW_LIFE - onJob) / DAY) + " days"],
          ["Berths taken", ((state.crew || []).length) + " / 8"],
          ["Wage", RPG() ? "free in a run" : (cspec.cost || 0) + " pts"]
        ].map(function (r) {
          return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(String(r[1])) + "</dd></div>";
        }).join("");
        return;
      }
      selectedCrew = null;
    }
    const plainCard = document.getElementById("charCard");
    if (plainCard) plainCard.className = "char-card";
    const noActs = document.getElementById("charActions");
    if (noActs) noActs.innerHTML = "";
    if (!f) {
      title.textContent = "Choose a fish";
      latin.textContent = "";
      niche.textContent = "Character";
      bio.textContent = "Click a fish in the glass or the list. The card shows who they are, how they live, and the numbers on them right now.";
      stats.innerHTML = "";
      pic.removeAttribute("src");
      pic.alt = "";
      return;
    }
    const spec = specOf(f.species);
    const card = BIOS[f.species] || {};
    const cycle = cycleOf(f.species);
    const grown = f.growthHours || 0;
    const lifeH = cycle[5] + Math.round((f.bonus || 0) / HOUR);
    const left = Math.max(0, lifeH - grown);
    title.textContent = f.name;
    latin.textContent = (card.latin ? card.latin + " · " : "") + spec.name;
    niche.textContent = card.niche || "Fish";
    bio.textContent = card.text || spec.blurb;
    pic.src = portraitSrc(f.species);
    pic.alt = spec.name;
    const rows = [
      ["Born", bornStamp(f.born) + " · your clock"],
      ["Stamp", String(Math.round(f.born || 0)) + " ms"],
      ["DNA", f.dna ? f.dna + (verifyDna(f).ok ? " · matches" : " · does not match") : "none"],
      ["Stage", stageName(bodyAge(f), f.species)],
      ["Age", hours(ageOf(f, now)) + " h"],
      ["Growth", grown + " / " + lifeH + " h"],
      ["Life left", left + " h"],
      ["Health", Math.round(f.hp || 0) + " / " + vitals(f).hp],
      ["Fed for", hours(Math.max(0, foodLeft(f, now))) + " h"],
      ["Mood", moodOf(f, now)],
      ["Doing", stateWord(f) || "cruising"],
      ["Water", tempNote(f) || "comfortable"],
      ["Temper", spec.temper === "chill" ? "Relaxed" : "Swims a lot"],
      ["With others", spec.social === "loner" ? "Loner" : "School"],
      ["Line", "gen " + (f.gen || 1)],
      ["Depth", (f.z == null ? 0.5 : f.z) > 0.66 ? "near the glass" : ((f.z == null ? 0.5 : f.z) < 0.38 ? "far water" : "mid water")],
      ["Water here", (Math.round(tempAt(f.y) * 10) / 10) + "° at " + (f.y > 0.62 ? "the sand" : f.y < 0.3 ? "the surface" : "mid water")],
      ["Oxygen", Math.round(state.oxygen == null ? 88 : state.oxygen) + "%" + ((state.oxygen == null ? 88 : state.oxygen) < OX.thin ? " · thin" : "")]
    ];
    stats.innerHTML = rows.map(function (row) {
      return "<div><dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd></div>";
    }).join("");
    const socialEl = document.getElementById("charSocial");
    if (socialEl) {
      const home = homeOf(f);
      socialEl.innerHTML = "<b>With others:</b> " + esc(socialLine(f) || "quiet on its own") +
        " · home patch " + (home.x < 0.35 ? "left" : home.x > 0.65 ? "right" : "middle") +
        " " + (home.y > 0.6 ? "low" : home.y < 0.35 ? "high" : "mid");
    }
  }
  /* A placard for the glass: who this fish is, right now. It fades on its own and
     comes back the moment the fish is clicked again. */
  const FISH_CARD_MS = 9000;
  let fishCardTimer = 0;
  const FISH_VOICE = {
    mara: { fine: "Water suits this one. Nothing to fix.", watch: "I keep an eye on this one.", thin: "This one is due a meal." },
    ellis: { fine: "I know this one by the way it turns.", watch: "That one has been quiet. I noticed.", thin: "It has not eaten. I remember who eats." },
    ren: { fine: "Nothing hunting it. It can swim easy.", watch: "I am watching the far water for this one.", thin: "A thin fish is an easy target. Feed it." },
    june: { fine: "Peaceful as anything in here.", watch: "Nobody is chasing it. That is the point of this tank.", thin: "Feed it. I will not have hunger in my room." },
    mateo: { fine: "Fed and content. Exactly right.", watch: "Watching its weight for it.", thin: "Empty. That is on me, not the fish." },
    nia: { fine: "Holds its own in a mixed tank. Good.", watch: "Different fish, different habits. This one is being itself.", thin: "Even a mixed tank needs full bellies." },
    mira: { fine: "Growing clean, like it should.", watch: "Give it light and time. It is doing fine.", thin: "Thin growth. A meal and a week of light." },
    sancora: { fine: "Water is reading right for it.", watch: "I am reading the water around it.", thin: "Hungry water makes a thin fish. Feed it." },
    lyra: { fine: "Comes alive when the light drops.", watch: "I will see this one properly tonight.", thin: "Even the night ones need feeding." },
    reed: { fine: "Dark water suits this one.", watch: "It keeps to the cover. Sensible fish.", thin: "Thin. That water is not feeding it." },
    calder: { fine: "Numbers are right and the fish knows it.", watch: "Watching the tank, and this one with it.", thin: "Thin in the belly. Feeding it now." },
    kai: { fine: "Looks good under this light.", watch: "I want to see it in the low light later.", thin: "A thin fish does not photograph. Feed it." }
  };
  function fishVoice(f) {
    const who = keeperOf(keeperInfo().id);
    const book = FISH_VOICE[who.id] || FISH_VOICE.mara;
    const left = foodLeft(f, Date.now());
    const cat = (f.hp || 100) < 70 || left < 6 * HOUR ? "thin" : (left < 20 * HOUR ? "watch" : "fine");
    return book[cat] || book.fine;
  }
  function hideFishCard() {
    const card = document.getElementById("fishCard");
    if (!card) return;
    card.classList.add("fade");
    clearTimeout(fishCardTimer);
    fishCardTimer = setTimeout(function () { card.classList.add("hidden"); }, 600);
  }
  function showFishCard(f) {
    const card = document.getElementById("fishCard");
    if (!card || !f) return;
    const now = Date.now();
    const spec = specOf(f.species);
    const card2 = BIOS[f.species] || {};
    const cycle = cycleOf(f.species);
    const grown = f.growthHours || 0;
    const lifeH = cycle[5] + Math.round((f.bonus || 0) / HOUR);
    const ok = comfort(f) < 0.6;
    const temp = Math.round(tempAt(f.y) * 10) / 10;
    const oxy = Math.round(state.oxygen == null ? 88 : state.oxygen);
    const home = homeOf(f);
    const friend = bondPick(f, 1, 0.05);
    const avoid = bondPick(f, -1, -0.05);
    document.getElementById("fishCardSpecies").textContent = (card2.latin ? card2.latin + " · " : "") + spec.name;
    document.getElementById("fishCardName").textContent = f.name;
    document.getElementById("fishCardChips").innerHTML =
      "<span>" + esc(stageName(bodyAge(f), f.species)) + "</span>" +
      "<span>" + esc(spec.temper === "chill" ? "relaxed" : "busy") + "</span>" +
      "<span class='gold'>gen " + esc(f.gen || 1) + "</span>" +
      (verifyDna(f).ok ? "<span>dna ok</span>" : "<span>dna ?</span>");
    const pic = document.getElementById("fishCardPic");
    pic.src = portraitSrc(f.species);
    pic.alt = spec.name;
    document.getElementById("fishCardSocial").innerHTML =
      "<b>" + esc(f.name) + "</b> " + esc(socialLine(f) || "keeps to itself") +
      (friend ? " · closest to " + esc(friend.f.name) : "") +
      (avoid ? " · avoids " + esc(avoid.f.name) : "") +
      " · home patch " + (home.x < 0.35 ? "left" : home.x > 0.65 ? "right" : "middle") +
      " " + (home.y > 0.6 ? "low" : home.y < 0.35 ? "high" : "mid");
    const rows = [
      ["Doing", stateWord(f) || "cruising"],
      ["Mood", moodOf(f, now)],
      ["Health", Math.round(f.hp || 0) + " / " + vitals(f).hp],
      ["Fed for", hours(Math.max(0, foodLeft(f, now))) + " h"],
      ["Age", hours(ageOf(f, now)) + " h"],
      ["Growth", grown + " / " + lifeH + " h"],
      ["Life left", Math.max(0, lifeH - grown) + " h"],
      ["Depth", depthOf(f) > 0.66 ? "near the glass" : depthOf(f) < 0.38 ? "far water" : "mid water"],
      ["Water here", temp + "° " + (f.y > 0.62 ? "at the sand" : f.y < 0.3 ? "at the surface" : "mid water")],
      ["Keeping", ok ? "comfortable" : (tempNote(f) || "off its band")],
      ["Oxygen", oxy + "%" + (oxy < OX.thin ? " · thin" : "")],
      ["Born", bornStamp(f.born)],
      ["Stamp", String(Math.round(f.born || 0)) + " ms"],
      ["Line", "gen " + (f.gen || 1) + " · " + (f.sex === "f" ? "f" : "m")],
      ["DNA", f.dna || "—"],
      ["Genome", dnaLine(f)],
      ["Defense", defenseLine(f)]
    ];
    document.getElementById("fishCardRows").innerHTML = rows.map(function (r) {
      return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>";
    }).join("");
    document.getElementById("fishCardWord").textContent = fishVoice(f);
    const kp = document.getElementById("fishCardKeeperPic");
    const who = keeperOf(keeperInfo().id);
    kp.src = keeperCardArt(who.id);
    kp.alt = who.name;
    document.getElementById("fishCardKeeperNote").textContent = who.name + " · " + who.tag;
    card.classList.remove("hidden");
    card.classList.remove("fade");
    clearTimeout(fishCardTimer);
    fishCardTimer = setTimeout(function () { hideFishCard(); }, FISH_CARD_MS);
  }
  function elapsedWord(at) {
    if (!at) return "";
    const mins = Math.round((Date.now() - at) / 60000);
    return mins <= 0 ? "just now" : mins < 60 ? mins + "m" : Math.round(mins / 60) + "h";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  function menuKeeperPick(ownerName) {
    const who = keeperOf(menuKeeper);
    return {
      id: who.id,
      name: String(ownerName || who.name).slice(0, 18),
      perks: menuPerks.slice(0, 3)
    };
  }
  let keeperNext = 0;
  let keeperLast = "";
  let keeperHide = 0;
  let keeperDuck = 0;
  let radioWas = null;
  /* the keeper talks over the music, so the music steps back for the sentence */
  function duckRadio(on) {
    const R = window.LatticeRadio;
    if (!R || typeof R.vol !== "function" || typeof R.setVol !== "function") return;
    try {
      if (on) {
        if (!R.playing || !R.playing()) return;
        if (radioWas == null) radioWas = R.vol();
        R.setVol(Math.max(0, radioWas * 0.35));
      } else if (radioWas != null) {
        R.setVol(radioWas);
        radioWas = null;
      }
    } catch (_) {}
  }
  const KEEPER_LINES = {
    hot: [
      "Hey. It is getting warm in there for somebody.",
      "The water is a bit hot for the fish that need it cooler.",
      "If this tank is mostly one kind, the heat will bother them more."
    ],
    cold: [
      "It is a little cold for some of them.",
      "A few fish are hanging low. The water is under their range.",
      "Cool water is fine for a mix. One kind feels it more."
    ],
    dirty: [
      "The glass is getting green. A snail would help.",
      "Algae is climbing. Nothing angry about it. Just time for a scrape.",
      "One kind of fish dirties a tank faster. A mix stays cleaner."
    ],
    foul: [
      "The water is turning. A change would be kind.",
      "Quality is low. They will be listless until it clears."
    ],
    variety: [
      "A mixed tank. Temperature matters less when they are different.",
      "I like this. Lots of kinds. The water can wander a little."
    ],
    mono: [
      "Almost one kind in there. Keep the temperature close to what they like.",
      "A single school is beautiful, and fussier about the heat."
    ],
    calm: [
      "They look settled. I will leave them to it.",
      "Quiet hour. That is a good hour.",
      "Nothing to fix. Just watching."
    ],
    feed: [
      "There. Someone will get that flake.",
      "Food is in. Let them sort it out."
    ]
  };
  /* What each event reads like, and the keeper's own way of saying it. */
  const ANNOUNCE = {
    death: { tag: "loss", pri: 2, lines: ["{name} is gone. {how}.", "We lost {name} — {how}."] },
    bite: { tag: "hunter", pri: 2, lines: ["That bite landed. {name} is gone.", "{name} was taken."] },
    dodge: { tag: "hunter", pri: 1, lines: ["{name} slipped it. Rolled {roll} against {chance}%.", "A miss at the last moment — {name} is still here."] },
    repel: { tag: "hunter", pri: 1, lines: ["That one fought back. The hunter is hurt.", "Spines and venom. It paid for the try."] },
    contest: { tag: "hunter", pri: 1, lines: ["{name} and {other} wanted the same fish. {other} took it.", "Two hunters, one fish — {fish} was the prize."] },
    stalk: { tag: "hunter", pri: 1, lines: ["It has picked {name}.", "It is lining up {name}."] },
    hunt: { tag: "hunter", pri: 2, lines: ["A boss just entered the glass.", "One hunter is in. Watch the water."] },
    jaws: { tag: "hunter", pri: 2, lines: ["Greymaw is JAWS now. Bigger, and it takes two a meal.", "JAWS. Keep the weak ones fed."] },
    battle: { tag: "hunter", pri: 1, lines: ["Two hunters are fighting. Let them.", "A battle this hour. Something will lose."] },
    shock: { tag: "hunter", pri: 1, lines: ["Volt cracked the water. Everything jolted.", "The eel shocked the tank."] },
    ink: { tag: "octo", pri: 1, lines: ["The octopus inked. That bite just got harder.", "Black cloud. Good."] },
    court: { tag: "life", pri: 1, lines: ["{name} and {other} are courting. The water is right.", "A pair is turning."] },
    egg: { tag: "life", pri: 1, lines: ["{n} eggs on the rockwork now. {name} laid them.", "Eggs on the rock. Twenty minutes."] },
    birth: { tag: "life", pri: 1, lines: ["{name} hatched — generation {other}.", "A fry: {name}."] },
    first: { tag: "life", pri: 1, lines: ["First time for that one. {name}", "That has never happened in this glass before."] },
    water: { tag: "water", pri: 1, lines: ["Fresh water. The glass clears.", "A third changed. Breathe, all of you."] },
    oxygen: { tag: "water", pri: 2, lines: ["The water is too thin. They are at the surface for air.", "Oxygen is down. Open the light and let the plants work."] },
    waste: { tag: "water", pri: 1, lines: ["There is waste on the sand. Something should lift it.", "The bottom is dirty. A cory would help."] },
    crowd: { tag: "water", pri: 1, lines: ["This is a full glass. Everyone heals slower now.", "Busy tank. Mind the water."] },
    feed: { tag: "meals", pri: 0, lines: ["Food is in. Let them sort it out.", "Somebody will get that flake."] },
    buy: { tag: "life", pri: 1, lines: ["{name} is in the glass. A baby.", "New one: {name}."] },
    crew: { tag: "water", pri: 1, lines: ["{name} starts on the green.", "A new cleaner at work."] },
    retire: { tag: "water", pri: 0, lines: ["{name} has done its month.", "A cleaner retires."] },
    leave: { tag: "hunter", pri: 0, lines: ["One slipped into the far water. It will be back.", "A hunter stepped out of the light."] },
    grow: { tag: "hunter", pri: 0, lines: ["One of the babies grew up. It hunts next hour.", "A hunter fry is grown."] },
    starve: { tag: "meals", pri: 1, lines: ["{name} is getting thin. A meal would fix it.", "{name} has not eaten in a while."] },
    empty: { tag: "life", pri: 2, lines: ["The glass is empty. A fry drifted in. We start again.", "Everything is gone. One little fish arrived."] },
    school: { tag: "life", pri: 1, lines: ["Six of one kind. That is a school now.", "A real school in the water."] },
    calm: { tag: "water", pri: 0, lines: ["Quiet hour. Nothing to fix.", "They look settled."] }
  };
  const KEEPER_SAY = {
    mara: {
      repel: ["That fish had spines. The hunter is bleeding for its trouble — good."],
      contest: ["Two hunters went for the same fish. One of them goes hungry tonight."],
      waste: ["Waste on the sand. A cory or the turtle, and it lifts.", "That much waste spends the oxygen. Lift it early."],
      death: ["{name} is gone. {how}. Keep the water and the rest will hold."],
      oxygen: ["Oxygen is low. Plants and a water change, and they will come down off the surface."],
      court: ["{name} and {other} are courting. The water is right for it — that is the whole trick."],
      first: ["First time for that. Good water, good feeding, that is all it takes."]
    },
    ellis: {
      birth: ["A fry — {name}. Generation {other}. I will remember this one."],
      buy: ["{name}. I have already learned how they turn.", "{name} in the glass. Another name to keep straight."],
      death: ["{name}. I knew that one. {how}."],
      birth: ["A fry — {name}. Generation {other}. I will remember this one."],
      court: ["{name} and {other}, turning together. Watch them."],
      buy: ["{name}. Good name. Let us see who it becomes."]
    },
    ren: {
      jaws: ["JAWS is in. Two a meal, and it does not hurry.", "Greymaw is JAWS. Watch the far water tonight."],
      battle: ["Two hunters fighting. That is one less problem later.", "Let them fight. Something loses and it is not us."],
      hunt: ["Hunter in the glass. It is already looking at somebody."],
      stalk: ["It has chosen {name}. Watch the weeds."],
      bite: ["The bite landed. {name} is gone. It will hunt again next hour."],
      dodge: ["{name} made it. Rolled {roll} against {chance}% and lived."]
    },
    june: {
      starve: ["{name} has not eaten. Feed them — I will not lose one to hunger."],
      empty: ["The glass is empty. Then a fry arrived, and we start again, gently."],
      death: ["We lost {name}. {how}. I would rather have had more fish than this."],
      hunt: ["Another hunter. I did not want one tonight."],
      crowd: ["It is crowded. I would take fewer fish and quieter water."],
      court: ["{name} and {other} are courting. Nobody hunting, nothing wrong. This is the good hour."]
    },
    mateo: {
      feed: ["There. Someone will get that flake. Do not waste it.", "That pinch will not last long."],
      court: ["{name} and {other} are courting. They have been eating well."],
      death: ["{name} is gone. {how}. Hungry water, that is usually what it is."],
      water: ["Water change. That will clear the film off the glass."],
      egg: ["Eggs. They will want feeding the moment they hatch.", "{n} eggs on the rockwork. I will have food ready."],
      starve: ["{name} is thin. That is on me. Food now."]
    },
    nia: {
      crowd: ["Full glass, and a mix of kinds. That is how I like it."],
      buy: ["{name} is in. Different kind, different water. Good."],
      death: ["We lost {name}. {how}. A mix is harder to keep, and worth it."],
      first: ["First time in this glass. That is why I like a mixed tank."],
      school: ["That is a proper school now. Different kinds, same water.", "Six of one kind, and they hold together."],
      court: ["{name} and {other}. Different kinds courting in the same glass. This is why I mix."]
    },
    mira: {
      dawn: ["First light on the plants. Whole tank turns gold. I never miss it."],
      birth: ["A fry — {name}. New growth in a glass. That never gets old."],
      water: ["Fresh water. The plants will take it from here."],
      first: ["First time for that one. Give it light and time and it will grow."],
      crew: ["The grazers keep the leaves clean. That is light getting through.", "Clean glass, clean leaves, that is the whole job."],
      few: ["Thin planting and few fish. Quiet, but it works.", "Not much in here. The green will fill it."],
      mono: ["One kind of fish and a lot of green. Simple, that."]
    },
    sancora: {
      death: ["{name} is gone. {how}. Water decides these things. I only read it."],
      oxygen: ["The water is thin. That is a tide that turned against you."],
      water: ["Water change. Like a clean tide coming through."],
      crowd: ["Crowded. Too much life in too little water. Thin them or feed the plants."],
      dawn: ["Morning water on the coast reads the same as morning water in glass."],
      night: ["Night water is honest. No glare, just the truth of it."],
      crew: ["Your workers are the current in here. Let them run."],
      few: ["A small population holds its water easily. Enjoy it."]
    },
    lyra: {
      night: ["Low light and the glass close. This is my hour, not theirs."],
      birth: ["A fry hatched — {name}. I sat up for this."],
      court: ["{name} and {other}, turning in the low light. Nobody else is awake to see it."],
      death: ["{name} is gone. {how}. Small loss, quiet hour."],
      full: ["Full glass in low light. You see them better when they are crowded."],
      variety: ["Different kinds keep different hours. Night sorts them out for you."],
      crew: ["The jelly is the best thing in here once the light drops."],
      calm: ["Nothing moving but the water. I could sit here till dawn."]
    },
    reed: {
      death: ["{name} is gone. {how}. Dark water keeps its own accounts."],
      water: ["A water change. The tea goes lighter for a while."],
      crowd: ["Full and dark in here. Mind the air, it goes quick in blackwater."],
      first: ["First time in the leaf litter. Something new under the roots."],
      dawn: ["Dawn through blackwater. Grey light, grey fish, quiet."],
      few: ["Few fish and deep cover. That is a pond, not a tank."],
      crew: ["The cory works the leaf litter. Suits this water."],
      calm: ["Nothing wrong in here. Dark water and no fuss."]
    },
    calder: {
      death: ["{name} is gone. {how}. I will write it in the log and keep going.", "We lost {name}. {how}. That is the glass, not the water."],
      hunt: ["A hunter is in. This is the part none of my maths can stop."],
      jaws: ["JAWS. Bigger than the last one. Nobody touches it."],
      birth: ["A fry — {name}, generation {other}. The tank is building its own stock now.", "Hatched: {name}. That one I did not pay for."],
      first: ["First time in this glass. Good. That is the build working."],
      water: ["Fresh water in. Watch the numbers fall in the right direction.", "Third of the water, gone and replaced. Better already."],
      oxygen: ["Oxygen is down. Water change, and let the plants work.", "The water is thin. On a full glass that is the first thing to go."],
      crowd: ["Full glass. Everyone heals slower — that is the load, not the fish."],
      waste: ["Waste is up. The corys and the turtle will lift it.", "There is waste on the sand. That spends the oxygen too."],
      starve: ["{name} is thin. Feeding now."],
      school: ["Six of one kind, holding formation. That is a school, not a pile."],
      shock: ["Something cracked the water. Everyone jolted — I felt it from here."],
      ink: ["The octopus inked. That bite just got harder."],
      battle: ["Two hunters fighting this hour. Let them spend each other."],
      dodge: ["{name} slipped it — rolled {roll} against {chance}% and lived."],
      stalk: ["It has picked {name}. Watch the weeds."],
      bite: ["The bite landed. {name} is gone."],
      leave: ["One slipped into the far water. It will be back."],
      grow: ["A hunter fry is grown. It hunts next hour."],
      feed: ["Food in. Let them sort it out.", "A pinch in the water. Watch who gets there first."],
      buy: ["{name} is in the glass. A baby — the water will tell me if I got it right."],
      crew: ["{name} starts on the green. Good worker.", "New cleaner at work. That frees my hands."],
      retire: ["{name} has done its month. A month of work, and the berth is free again."],
      egg: ["{n} eggs on the rockwork. Twenty minutes and we have fry.", "Eggs. That is the tank making decisions without me."],
      mono: ["One kind in the glass. Easy to run, and it shows every mistake."],
      few: ["Thin tank. I would still rather watch four than none."],
      crew: ["The workers are covering the ground I cannot. Good trade."],
      empty: ["The glass went empty and a fry drifted in. We start again from one."],
      calm: ["Nothing needs doing. I still check.", "Quiet hour. The water is holding.", "All of them comfortable. That is the report."]
    },
    kai: {
      dusk: ["Dusk cue. The tank turns over about now — best light of the day."],
      night: ["Night lighting on. Low, warm, just enough to see them move."],
      dawn: ["Dawn run. Ten minutes of perfect light, then it is just day."],
      water: ["Fresh water. The glass goes clear and the light carries further."],
      battle: ["Two hunters under the lights. That is a scene, I will give them that."],
      crew: ["Even the cleaners look good under a low lamp."],
      variety: ["Different colours, different light. That is the whole craft."],
      calm: ["Nothing to do but watch the light move. Good shift."],
      full: ["A full glass is the best thing to light. More movement to catch."]
    }
  };
  let keeperTag = "";
  function fill(tpl, vars) {
    return String(tpl)
      .replace(/\{name\}/g, vars.name || "a fish")
      .replace(/\{other\}/g, vars.other || "another")
      .replace(/\{n\}/g, vars.n || "two")
      .replace(/\{how\}/g, vars.how || "gone")
      .replace(/\{roll\}/g, vars.roll || "?")
      .replace(/\{chance\}/g, vars.chance || "?");
  }
  function announce(key, vars) {
    if (!state) return;
    const spec = ANNOUNCE[key] || ANNOUNCE.calm;
    const who = keeperInfo().id;
    const own = (KEEPER_SAY[who] || {})[key];
    const list = own && own.length ? own : spec.lines;
    const tpl = list[(Math.random() * list.length) | 0];
    const text = fill(tpl, vars || {});
    keeperTag = spec.tag;
    const spoke = keeperSay(text, spec.pri >= 2);
    if (spoke) state._announce = { key: key, tag: spec.tag, at: Date.now(), text: text };
    else state._pendingAnnounce = { key: key, tag: spec.tag, at: Date.now() };
  }
  function keeperLine(key) {
    const list = KEEPER_LINES[key] || KEEPER_LINES.calm;
    return list[(Math.random() * list.length) | 0];
  }
  function paintKeeperBox() {
    const box = document.getElementById("keeperBox");
    if (!box || !state) return;
    const info = keeperInfo();
    const face = keeperOf(info.id);
    const pic = document.getElementById("keeperPic");
    const label = document.getElementById("keeperLabel");
    if (pic) { pic.alt = face.name; pic.setAttribute("data-keeper", face.id); pic.setAttribute("src", keeperCardArt(face.id)); }
    if (label) label.textContent = info.name || face.name;
  }
  function keeperSay(text, force) {
    if (!text) return false;
    const now = Date.now();
    if (!force && now < keeperNext) return false;
    if (text === keeperLast && now < keeperNext + 12000) return false;
    keeperLast = text;
    keeperNext = now + (force ? 30000 : 46000);
    const bubble = document.getElementById("keeperBubble");
    if (bubble) {
      bubble.textContent = text;
      bubble.classList.remove("hidden");
      clearTimeout(keeperHide);
      keeperHide = setTimeout(function () { bubble.classList.add("hidden"); }, 8500);
    }
    const tagEl = document.getElementById("keeperTag");
    if (tagEl) tagEl.textContent = keeperTag ? ("watching " + keeperTag) : "";
    if (!channelOn("talk") || typeof speechSynthesis === "undefined") return true;
    try {
      const face = keeperOf(keeperInfo().id);
      const u = new SpeechSynthesisUtterance(text);
      u.rate = face.rate || 0.94;
      u.pitch = face.pitch || 1;
      u.volume = Math.max(0.2, sfxVol());
      u.onend = function () { duckRadio(false); };
      u.onerror = function () { duckRadio(false); };
      speechSynthesis.cancel();
      duckRadio(true);
      speechSynthesis.speak(u);
      clearTimeout(keeperDuck);
      keeperDuck = setTimeout(function () { duckRadio(false); }, 1200 + text.length * 70);
    } catch (_) { duckRadio(false); }
    return true;
  }
  function keeperNote(text) {
    if (!state) return;
    state._keeperNote = { at: Date.now(), text: text };
  }
  function keeperPulse(now) {
    if (!playing || !state) return;
    const thanks = document.getElementById("thanksLayer");
    if (thanks && !thanks.classList.contains("hidden")) return;
    const note = state._keeperNote;
    if (note && now - note.at < 20000 && note.text !== keeperLast) {
      keeperSay(note.text, true);
      state._keeperNote = null;
      return;
    }
    if (now < keeperNext) return;
    if (now - (state._keeperLook || 0) < 13000) return;
    state._keeperLook = now;
    const mix = mixScale();
    let warm = 0, cold = 0;
    state.fish.forEach(function (f) {
      const noteWord = tempNote(f);
      if (noteWord === "too warm") warm += 1;
      else if (noteWord === "too cold") cold += 1;
    });
    if (warm >= 1 && mix.share > 0.45) { keeperSay(keeperLine("hot"), false); return; }
    if (cold >= 1 && mix.share > 0.45) { keeperSay(keeperLine("cold"), false); return; }
    if ((state.oxygen || 100) < OX.thin) { announce("oxygen", { line: oxygenNote() }); return; }
    if ((state.waste || 0) > 52) { announce("waste", { line: wasteNote() }); return; }
    if (crowdLoad() > 0.95) { announce("crowd", { line: "Crowded. Everyone heals slower." }); return; }
    if ((state.algae || 0) > 55) { keeperSay(keeperLine("dirty"), false); return; }
    if ((state.quality || 100) < 48) { keeperSay(keeperLine("foul"), false); return; }
    if (mix.kinds >= 5 && Math.random() < 0.35) { keeperSay(keeperLine("variety"), false); return; }
    if (mix.kinds === 1 && state.fish.length >= 4 && Math.random() < 0.4) { keeperSay(keeperLine("mono"), false); return; }
    keeperChatter(now);
  }
  /* Chit chat: the keeper reads the room and says something in their own voice.
     Every one of the twelve has their own lines for the hour and the state. */
  function keeperChatter(now) {
    const who = keeperOf(keeperInfo().id);
    const topics = [];
    const hour = rhythm();
    const mix = mixScale();
    if (hour === "night") topics.push("night");
    if (hour === "dawn") topics.push("dawn");
    if (hour === "dusk") topics.push("dusk");
    if (mix.kinds >= 5) topics.push("variety");
    if (mix.kinds === 1 && state.fish.length >= 4) topics.push("mono");
    if (crowdLoad() > 0.6) topics.push("full");
    if (state.fish.length && state.fish.length <= 4) topics.push("few");
    if ((state.crew || []).length) topics.push("crew");
    if ((state.eggs || []).length) topics.push("eggs");
    if ((state.oxygen || 100) > OX.thin + 20) topics.push("calm");
    const book = who.lines || {};
    const voice = KEEPER_SAY[who.id] || {};
    let pool = null;
    if (topics.length) {
      const want = topics[(Math.random() * topics.length) | 0];
      if (voice[want] && voice[want].length) pool = voice[want];
      else if (book[want] && book[want].length) pool = book[want];
    }
    if (!pool && who.idle && who.idle.length) pool = who.idle;
    if (!pool) pool = KEEPER_LINES.calm;
    keeperSay(pool[(Math.random() * pool.length) | 0], false);
  }
  function paintKeeperMenu() {
    const box = document.getElementById("menuKeepers");
    const perks = document.getElementById("menuPerks");
    const sheet = document.getElementById("keeperSheet");
    if (!box || !perks) return;
    box.innerHTML = CAST_ORDER.map(function (id) {
      const k = keeperOf(id);
      return "<button type='button' class='keeper-card " + k.cast + (menuKeeper === id ? " on" : "") + "' data-keeper='" + id +
        "'><img data-keeper='" + id + "' src='" + keeperCardArt(id) + "' alt='" + k.name + "'><b>" + k.name + "</b><span>" + k.tag + "</span></button>";
    }).join("");
    perks.innerHTML = PERKS.map(function (p) {
      const on = menuPerks.indexOf(p.id) >= 0;
      return "<button type='button' class='perk-card" + (on ? " on" : "") + "' data-perk='" + p.id + "'><b>" + p.name + "</b><span>" + p.text + "</span></button>";
    }).join("");
    const face = keeperOf(menuKeeper);
    const gifts = menuPerks.map(function (id) {
      const p = PERKS.filter(function (x) { return x.id === id; })[0];
      return p ? "<li><b>" + p.name + "</b> — " + p.text + "</li>" : "";
    }).join("");
    if (sheet) {
      sheet.innerHTML = "<img class='keeper-face' data-keeper='" + face.id + "' src='" + keeperCardArt(face.id) + "' alt='" + face.name + "'>" +
        "<div><p class='rpg-tag'>" + face.tag + "</p><h2>" + face.name + "</h2>" +
        "<p class='char-bio'>" + face.bio + "</p>" +
        "<ul class='rpg-gifts'>" + (gifts || "<li>No gifts yet. Choose three below.</li>") + "</ul></div>";
    }
    const note = document.getElementById("perkNote");
    if (note) note.textContent = menuPerks.length === 3 ? "Three gifts on the card." : ("Choose " + (3 - menuPerks.length) + " more.");
  }
  function keeperSrc(id, now) {
    const bubble = document.getElementById("keeperBubble");
    const talking = bubble && !bubble.classList.contains("hidden");
    const beat = talking ? (Math.floor(now / 170) % 2 === 1) : (Math.floor(now / 420) % 8 === 0);
    return keeperArt(id, beat);
  }
  function keeperAnim(now) {
    const liveId = (playing && state) ? keeperInfo().id : menuKeeper;
    const bubble = document.getElementById("keeperBubble");
    const talking = !!(bubble && !bubble.classList.contains("hidden"));
    document.querySelectorAll("img[data-keeper]").forEach(function (img) {
      const id = img.getAttribute("data-keeper") || liveId;
      if (id !== liveId && img.id !== "keeperPic") return;
      const src = keeperSrc(img.id === "keeperPic" ? liveId : id, now);
      if (img.getAttribute("data-src") !== src) {
        img.src = src;
        img.setAttribute("data-src", src);
      }
      /* no talking frame? then the picture itself leans in while they speak */
      img.classList.toggle("talking", talking && !keeperOf(id).talk);
    });
  }
  function loop(t) {
    if (!playing || !state) { keeperAnim(Date.now()); syncLoops(); requestAnimationFrame(loop); return; }
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    frameId += 1;
    const now = Date.now();
    AR = Math.max(0.5, canvas.clientWidth / Math.max(1, canvas.clientHeight));
    catchUp(now);
    simWater(now);
    tickAuto(now);
    stepHand(dt);
    state.fish.forEach(function (f) { stepFish(f, dt); });
    stepInks(dt, now);
    resolveBites();
    (state.crew || []).forEach(function (c) { stepCrew(c, dt); });
    stepLoop(dt, now);
    applyRpgRun();
    modeCopyTick();
    stepRpg(now);
    (state.predators || []).forEach(function (p) { stepPredator(p, dt); });
    stepAmbient(dt, now);
    state.fish.forEach(function (f) {
      if (f.splashAt && now >= f.splashAt) {
        f.splashAt = 0;
        addRipple(f.x, 0.08);
      }
    });
    if (!state._pts || now - state._pts > 45000) {
      state._pts = now;
      /* no points for leaving the page open any more: a keeper earns by feeding, and
         every flake a fish actually takes is paid for on the spot (see the meal). */
      if (state.fish.length) save();
      const lead = state.fish.slice().sort(function (a, b) { return ageOf(b, now) - ageOf(a, now); })[0];
      const leadHours = lead ? Math.round(ageOf(lead, now) / HOUR) : 0;
      if (window.ArcadeLedger && ArcadeLedger.fish && leadHours >= 1 &&
        (!state._tankPost || now - state._tankPost > HOUR)) {
        state._tankPost = now;
        ArcadeLedger.fish({
          name: state.owner || "Keeper",
          fish: lead ? lead.name : "",
          score: lead ? Math.round(ageOf(lead, now) / HOUR) : 0,
          hours: lead ? Math.round(ageOf(lead, now) / HOUR) : 0,
          tankHours: Math.round(tankAge(now) / HOUR),
          theme: themeOf(state.theme).name,
          species: lead ? lead.species : "",
          stage: lead ? stageName(bodyAge(lead), lead.species) : "",
          gen: lead ? (lead.gen || 1) : 1,
          dna: lead ? (lead.dna || "") : "",
          date: new Date(now).toISOString().slice(0, 10),
          event: "tank"
        });
        fetchHall();
      }
    }
    if (state.opts.motion !== false) {
      [0.42, 0.60].forEach(function (ax, i) {
        if (Math.random() < dt * (i ? 1.7 : 1.1)) {
          bubbles.push({ x: ax + (Math.random() - 0.5) * 0.018, y: 0.84, r: 1.5 + Math.random() * 3.2, v: 0.05 + Math.random() * 0.06, wob: Math.random() * 6.28, at: 0 });
        }
      });
      if (Math.random() < dt * 0.5) {
        bubbles.push({ x: 0.15 + Math.random() * 0.7, y: 0.84, r: 2 + Math.random() * 3, v: 0.04 + Math.random() * 0.04, wob: Math.random() * 6.28, at: 0 });
      }
      bubbles.forEach(function (b) {
        b.at = (b.at || 0) + dt;
        b.y -= b.v * dt;
        b.x += Math.sin(b.at * 2.2 + b.wob) * 0.004 * dt;
        b.r += dt * 0.18;
      });
      bubbles = bubbles.filter(function (b) { return b.y > 0.12 && b.x > 0.01 && b.x < 0.99; });
    }
    if (!state._paint || now - state._paint > 400) {
      state._paint = now;
      renderRail();
    }
    resize();
    draw();
    syncLoops();
    keeperAnim(now);
    keeperPulse(now);
    tickFishNoise(now);
    requestAnimationFrame(loop);
  }
  /* Click what you can see: the box the sprite was drawn in, its name plate above it,
     and if that misses, the nearest fish within reach. Ties go to the fish nearer the glass. */
  function fishAt(x, y, w, h) {
    let best = null, bestScore = 1e9;
    state.fish.forEach(function (f) {
      const box = hitBoxes[f.id];
      const cx = box ? box.x / w : f.x;
      const cy = box ? box.y / h : f.y;
      const z = box ? box.z : (f.z == null ? 0.5 : f.z);
      const hw = Math.max(0.016, (box ? box.bw / w : 0.05) * 0.5) + HIT_PAD;
      const hh = Math.max(0.02, (box ? box.bh / h : 0.06) * 0.5) + HIT_PAD;
      const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
      const inBox = dx <= hw && y >= cy - hh - HIT_LABEL && y <= cy + hh;
      const dist = Math.hypot(dx, dy);
      if (!inBox && dist > HIT_FAR) return;
      const score = (inBox ? 0 : 10) + (1 - z) + dist * 0.4;
      if (score < bestScore) { bestScore = score; best = f; }
    });
    return best;
  }
  function pick(id) {
    selected = id;
    selectedCrew = null;
    renderRail();
    const f = state.fish.filter(function (x) { return x.id === id; })[0];
    if (f) showFishCard(f); else hideFishCard();
  }
  const manageScrollEl = document.getElementById("manageScroll");
  if (manageScrollEl) manageScrollEl.onclick = function (e) {
    const crewBtn = e.target.closest("[data-crew-id]");
    if (crewBtn) { pickCrew(crewBtn.getAttribute("data-crew-id")); return; }
    const fishBtn = e.target.closest("[data-id]");
    if (fishBtn) pick(fishBtn.getAttribute("data-id"));
  };
  const findInput = document.getElementById("manageFind");
  if (findInput) findInput.addEventListener("input", function () { railSig = ""; renderRail(); });
  const charActionsEl = document.getElementById("charActions");
  if (charActionsEl) charActionsEl.onclick = function (e) {
    const b = e.target.closest("[data-release]");
    if (b) releaseCrew(b.getAttribute("data-release"));
  };
  /* The rail keeps itself current while the tank runs. This used to happen only when the
     keeper touched something, so a fish could sit at the wrong hunger number on the list.
     The management list rebuilds only when its contents actually changed, which is what
     makes a five second beat affordable with a hundred fish in the glass. */
  setInterval(function () {
    if (playing && state) renderRail();
  }, 5000);
  canvas.addEventListener("click", function (e) {
    if (!state || !state.fish) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const hit = fishAt(x, y, r.width, r.height);
    if (hit) pick(hit.id); else hideFishCard();
  });
  document.getElementById("fishName").addEventListener("change", function (e) {
    const c = selectedCrew ? (state.crew || []).filter(function (x) { return x.id === selectedCrew; })[0] : null;
    if (c) { c.name = String(e.target.value || c.name).slice(0, 16); save(); renderRail(); return; }
    const f = state.fish.filter(function (x) { return x.id === selected; })[0];
    if (!f) return;
    f.name = String(e.target.value || f.name).slice(0, 16);
    save();
    renderRail();
  });
  document.getElementById("feed").onclick = function () {
    if (!startHand("flakes")) return;
    state.algae = clamp((state.algae || 0) + 3, 0, 100);
    renderRail();
  };
  document.getElementById("pellet").onclick = function () {
    if (!state.fish.length) { log("No one is home to feed."); return; }
    if (!RPG() && state.points < 15) { log("A pellet costs 15 points."); return; }
      if (!RPG()) state.points -= 15;
    if (!startHand("pellet")) { state.points += 15; return; }
    save();
    renderRail();
  };
  document.getElementById("shop").onclick = function (e) {
    const b = e.target.closest("[data-buy]");
    if (!b) return;
    const sp = b.getAttribute("data-buy");
    /* a run has no shop, and the paid shelf is not even in the DOM there: a stale click
       must not buy a fish behind the shelf's back */
    if (RPG()) { log("There is no shop in a run. Spawn from the shelf."); return; }
    if (!canAdd(sp)) { log("No room in the glass for a " + specOf(sp).name + " yet. Space " + Math.round(fishLoad()) + " of " + loadCap() + "."); return; }
    if (sp === "octo" && hasOcto()) { log("One octopus already keeps this glass."); return; }
    const cost = price();
    if (state.points < cost) { log("Need " + cost + " points."); return; }
      if (!RPG()) state.points -= cost;
    const fish = makeFish(sp, specOf(sp).name);
    state.fish.push(fish);
    selected = fish.id;
    log(fish.name + " joins. A baby.");
    save();
    renderRail();
  };
  document.getElementById("owner").addEventListener("change", function (e) {
    state.owner = String(e.target.value || "Keeper").slice(0, 18);
    save();
  });
  document.getElementById("change").onclick = function () {
    if (!RPG() && state.points < 10) { log("A water change costs 10 points."); return; }
    if (!RPG()) state.points -= 10;
    state.algae = clamp(state.algae - 28, 0, 100);
    state.quality = clamp(state.quality + 24, 0, 100);
    state.oxygen = clamp((state.oxygen == null ? 88 : state.oxygen) + 18, 0, 100);
    state.waste = clamp((state.waste || 0) - 30, 0, 100);
    log("You change a third of the water. Algae drops. The glass clears.");
    save();
    renderRail();
  };
  document.addEventListener("click", function (e) {
    const b = e.target && e.target.closest ? e.target.closest("[data-spawn]") : null;
    if (b && !b.disabled) spawnFish(b.getAttribute("data-spawn"));
  });
  document.getElementById("crewShop").onclick = function (e) {
    const b = e.target && e.target.closest ? e.target.closest("[data-crew]") : null;
    if (!b) return;
    if (state.crew.length >= 8) { log("Eight cleaners fill the work."); return; }
    const spec = crewOf(b.getAttribute("data-crew"));
    if (!spec) return;
    /* the shelf is only rationed for the final cleaner, and only from the shop: what is
       bred here does not count against the two */
    if (spec.id === "otto" || RPG()) {
      const bought = state.crew.filter(function (x) { return x.role === spec.id && x.bought !== false; }).length;
      if (bought >= LOOP.ottoBought) {
        log("The shop will only sell two algae eaters. This tank has to breed the third.");
        keeperNote("Two algae eaters is the shop's limit. Keep the water kind and they will lay a clutch.");
        return;
      }
    }
    if (RPG()) {
      /* nothing to pay with: the shelf is the limit instead */
    } else if (state.points < spec.cost) { log(spec.name + " costs " + spec.cost + " points."); return; }
    /* an RPG run pays for nothing */
    if (!RPG()) state.points -= spec.cost;
    state.crew.push(makeCrew(spec.id));
    log(spec.name + " starts work.");
    save();
    renderRail();
  };
  function syncOpt() {
    const o = state.opts;
    document.getElementById("optNames").checked = o.names !== false;
    document.getElementById("optBoard").checked = o.board !== false;
    document.getElementById("optMotion").checked = o.motion !== false;
    document.getElementById("optHeater").checked = !!o.heater;
    document.getElementById("optSoundTalk").checked = o.soundTalk !== false && o.sound !== false;
    document.getElementById("optSoundAmbient").checked = o.soundAmbient !== false && o.sound !== false;
    document.getElementById("optSoundFx").checked = o.soundFx !== false && o.sound !== false;
    document.getElementById("optSoundFish").checked = o.soundFish !== false && o.sound !== false;
    document.getElementById("optAmbientVol").value = String(Math.round((o.soundAmbientVol == null ? 1 : o.soundAmbientVol) * 100));
    document.getElementById("optAmbientVal").textContent = Math.round((o.soundAmbientVol == null ? 1 : o.soundAmbientVol) * 100) + "%";
    document.getElementById("optSoundVol").value = String(Math.round((o.soundVol == null ? 0.4 : o.soundVol) * 100));
    document.getElementById("optSoundVal").textContent = Math.round((o.soundVol == null ? 0.4 : o.soundVol) * 100) + "%";
    document.getElementById("optClock").value = o.clock || "real";
    document.getElementById("optTemp").value = String(o.temp || 25);
    document.getElementById("optTempVal").textContent = (o.temp || 25) + "°";
  }
  function readOpt() {
    const o = state.opts;
    o.names = document.getElementById("optNames").checked;
    o.board = document.getElementById("optBoard").checked;
    o.motion = document.getElementById("optMotion").checked;
    o.heater = document.getElementById("optHeater").checked;
    o.sound = true;
    o.soundTalk = document.getElementById("optSoundTalk").checked;
    o.soundAmbient = document.getElementById("optSoundAmbient").checked;
    o.soundFx = document.getElementById("optSoundFx").checked;
    o.soundFish = document.getElementById("optSoundFish").checked;
    o.soundVol = (Number(document.getElementById("optSoundVol").value) || 0) / 100;
    o.soundAmbientVol = Math.max(0, Math.min(100, Number(document.getElementById("optAmbientVol").value) || 0)) / 100;
    document.getElementById("optAmbientVal").textContent = Math.round(o.soundAmbientVol * 100) + "%";
    document.getElementById("optSoundVal").textContent = Math.round(o.soundVol * 100) + "%";
    syncLoops();
    o.clock = document.getElementById("optClock").value || "real";
    o.temp = Number(document.getElementById("optTemp").value) || 25;
    document.getElementById("optTempVal").textContent = o.temp + "°";
    heldOpts = Object.assign({}, o);
    if (hasSave) save();
    if (playing) renderRail();
  }
  function showMenu() {
    playing = false;
    const cont = document.getElementById("menuContinue");
    if (cont) cont.disabled = !hasSave;
    /* the caretaker list is on the home tab now, so it has to be drawn with the cards, and
       the merged tab has to be opened as a pair - the boot lands on the markup's own classes
       otherwise, which hides the caretaker of a tank the keeper is about to start */
    paintKeeperMenu();
    const litTab = document.querySelector(".menu-tabs .tab.on");
    showPanel(litTab ? litTab.getAttribute("data-tab") : "panelHome");
    document.getElementById("menu").classList.remove("hidden");
    document.getElementById("app").classList.add("hidden");
    paintCast();
    /* back at the menu: reminders may return, but not for two minutes. `playing`
       is already false above, so the flag carries this instead. */
    if (gateBusy) { gateBusy = false; gateHold(false, 2 * 60 * 1000); }
  }
  function enterTank() {
    playing = true;
    gateBusy = true;
    gateHold(true);
    last = performance.now();
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    const ownerEl = document.getElementById("owner");
    if (ownerEl) ownerEl.value = state.owner || "Keeper";
    resize();
    renderRail();
    syncLoops();
    paintKeeperBox();
    if (thanksQueued) openThanks();
  }
  function paintCast() {
    const box = document.getElementById("menuCast");
    if (!box) return;
    box.innerHTML = SPECIES.map(function (s) {
      const on = menuPicks.indexOf(s.id) >= 0;
      return "<button type='button' data-pick='" + s.id + "' class='" + (on ? "on" : "") + "'>" + esc(s.name) + "<br><span class='lore'>" + (s.temper === "chill" ? "Relaxed" : "Swims a lot") + " · " + (s.social === "loner" ? "Loner" : "School") + "</span></button>";
    }).join("");
  }
  function showPanel(which) {
    /* Home and the caretaker are one tab now, so the caretaker panel rides with the home
       cards: opening either shows both, and the Home tab is the one that lights up. */
    const HOME_GROUP = ["panelHome", "panelKeep"];
    ["panelHome", "panelKeep", "panelTank", "panelHow"].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      if (HOME_GROUP.indexOf(id) >= 0) el.classList.toggle("hidden", HOME_GROUP.indexOf(which) < 0);
      else el.classList.toggle("hidden", id !== which);
    });
    document.querySelectorAll(".menu-tabs .tab").forEach(function (tab) {
      const t = tab.getAttribute("data-tab");
      tab.classList.toggle("on", t === which || (HOME_GROUP.indexOf(t) >= 0 && HOME_GROUP.indexOf(which) >= 0));
    });
  }
  document.getElementById("menuContinue").onclick = function () {
    menuRpg = false;
    if (!hasSave || !state) return;
    enterTank();
  };
  document.getElementById("menuNew").onclick = function () {
    /* a new tank is a standard tank: the run flag belongs to the run's own card alone */
    menuRpg = false;
    showPanel("panelKeep");
    paintKeeperMenu();
  };

  const rpgCard = document.getElementById("menuRpg");
  if (rpgCard) rpgCard.onclick = function () {
    /* the same road in as a new tank - caretaker, three gifts, then your pick of three
       fish - and the run begins the moment the water does */
    menuRpg = true;
    showPanel("panelKeep");
    paintKeeperMenu();
  };
  document.querySelectorAll(".menu-tabs .tab").forEach(function (tab) {
    tab.onclick = function () {
      const id = tab.getAttribute("data-tab");
      if (id === "panelKeep" || id === "panelHome") paintKeeperMenu();
      if (id === "panelTank") paintCast();
      showPanel(id);
    };
  });
  const toTank = document.getElementById("menuToTank");
  if (toTank) toTank.onclick = function () {
    if (menuPerks.length !== 3) {
      document.getElementById("perkNote").textContent = "Pick exactly three gifts.";
      return;
    }
    paintCast();
    showPanel("panelTank");
  };
  document.getElementById("menuHow").onclick = function () { showPanel("panelHow"); };
  document.getElementById("menuBack").onclick = function () { showPanel("panelKeep"); paintKeeperMenu(); };
  document.getElementById("howBack").onclick = function () { showPanel("panelHome"); };
  document.getElementById("menuOpt").onclick = function () {
    if (!state) {
      state = { fish: [], crew: [], cemetery: [], log: [], points: 0, owner: "Keeper", opts: heldOpts || {} };
      ensureState();
    }
    syncOpt();
    document.getElementById("optLayer").classList.remove("hidden");
  };
  document.getElementById("menuCast").onclick = function (e) {
    const b = e.target.closest("[data-pick]");
    if (!b) return;
    const id = b.getAttribute("data-pick");
    const ix = menuPicks.indexOf(id);
    if (ix >= 0) menuPicks.splice(ix, 1);
    else if (menuPicks.length < 3) menuPicks.push(id);
    paintCast();
    document.getElementById("menuNote").textContent = menuPicks.length === 3 ? "Three chosen." : ("Choose " + (3 - menuPicks.length) + " more.");
  };
  document.querySelectorAll("[data-theme]").forEach(function (btn) {
    btn.onclick = function () {
      menuTheme = btn.getAttribute("data-theme") || "river";
      document.querySelectorAll("[data-theme]").forEach(function (el) { el.classList.toggle("on", el === btn); });
    };
  });
  document.querySelectorAll("[data-mode]").forEach(function (btn) {
    btn.onclick = function () {
      menuRpg = false;
      menuMode = btn.getAttribute("data-mode");
      document.querySelectorAll("[data-mode]").forEach(function (el) { el.classList.toggle("on", el === btn); });
    };
  });
  document.getElementById("menuAuto").onclick = function () {
    menuRpg = false;
    const ownerName = document.getElementById("menuOwner") ? document.getElementById("menuOwner").value : "Keeper";
    if (menuPerks.length !== 3) menuPerks = ["clear", "bright", "meals"];
    fresh(["dart", "ruby", "azure"], "standard", ownerName || "Keeper", menuTheme || "river");
    state.auto = true;
    save();
    enterTank();
    log("Automatic keeper is on. It will stock, feed, and clean. It cannot stop a hunter.");
  };
  document.getElementById("btnAuto").onclick = function () {
    if (!state) return;
    state.auto = !state.auto;
    log(state.auto ? "Automatic keeper is on. Hunters still hunt." : "Automatic keeper is off.");
    save();
    renderRail();
  };
  document.getElementById("menuKeepers").onclick = function (e) {
    const b = e.target.closest("[data-keeper]");
    if (!b) return;
    menuKeeper = b.getAttribute("data-keeper");
    paintKeeperMenu();
  };
  document.getElementById("menuPerks").onclick = function (e) {
    const b = e.target.closest("[data-perk]");
    if (!b) return;
    const id = b.getAttribute("data-perk");
    const ix = menuPerks.indexOf(id);
    if (ix >= 0) menuPerks.splice(ix, 1);
    else if (menuPerks.length < 3) menuPerks.push(id);
    paintKeeperMenu();
  };
  document.getElementById("menuOpen").onclick = function () {
    if (menuPicks.length !== 3) {
      document.getElementById("menuNote").textContent = "Pick exactly three fish.";
      return;
    }
    if (menuPerks.length !== 3) {
      document.getElementById("perkNote").textContent = "Pick exactly three gifts.";
      return;
    }
    const ownerName = document.getElementById("menuOwner").value || keeperOf(menuKeeper).name;
    fresh(menuPicks.slice(), menuMode, ownerName, menuTheme);
    enterTank();
    keeperSay(keeperOf(keeperInfo().id).greet || "I am here. We will take this slow.", true);
  };
  document.getElementById("btnMenu").onclick = function () {
    if (state) save();
    showMenu();
  };
  document.getElementById("btnOpt").onclick = function () {
    syncOpt();
    document.getElementById("optLayer").classList.remove("hidden");
  };
  document.getElementById("thanksClose").onclick = function () { closeThanks(); };
  document.getElementById("thanksLayer").onclick = function (e) {
    if (e.target.id === "thanksLayer") closeThanks();
  };
  document.getElementById("optClose").onclick = function () {
    readOpt();
    document.getElementById("optLayer").classList.add("hidden");
  };
  ["optNames", "optBoard", "optMotion", "optHeater", "optClock", "optSoundTalk", "optSoundAmbient", "optAmbientVol", "optSoundFx", "optSoundFish", "optSoundVol"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", readOpt);
  });
  document.getElementById("optTemp").addEventListener("input", readOpt);
  document.getElementById("optSoundVol").addEventListener("input", readOpt);
  document.getElementById("optAmbientVol").addEventListener("input", readOpt);
  document.getElementById("optReset").onclick = function () {
    if (!window.confirm("Clear this tank, the cleaners, and the cemetery in this browser?")) return;
    fresh();
    const ownerEl = document.getElementById("owner");
    if (ownerEl) ownerEl.value = state.owner || "Keeper";
    document.getElementById("optLayer").classList.add("hidden");
    renderRail();
  };

  /* Read-only view: for the curious, and for the tools. Nothing here writes. */
  window.FishTank = {
    get: function () { return state; },
    /* recompute a fish's DNA from its genome; with no id, the whole tank */
    /* the real clock, for anyone asking a fish when it arrived */
    bornStamp: bornStamp,
    verify: function (id) {
      if (!state) return null;
      if (id) {
        const f = state.fish.filter(function (x) { return x.id === id || x.name === id || x.dna === id; })[0];
        if (!f) return null;
        const v = verifyDna(f);
        return { name: f.name, dna: v.dna, ok: v.ok, reason: v.reason, lineage: lineageOf(f), parents: f.parents || [],
          born: Math.round(f.born || 0), bornOn: bornStamp(f.born), stamp: Math.round(f.born || 0) };
      }
      const fish = state.fish.map(function (f) {
        const v = verifyDna(f);
        return { name: f.name, dna: v.dna, ok: v.ok, bornOn: bornStamp(f.born), stamp: Math.round(f.born || 0) };
      });
      return { fish: fish, ok: fish.filter(function (x) { return x.ok; }).length, bank: Object.keys(state.bank || {}).length };
    },
    debug: function () {
      const counts = {};
      (state && state.fish ? state.fish : []).forEach(function (f) { counts[f.state || "?"] = (counts[f.state || "?"] || 0) + 1; });
      const offs = (state && state.fish ? state.fish : []).map(function (f) { return comfort(f); });
      return {
        fish: state ? state.fish.length : 0,
        states: counts,
        crew: state ? (state.crew || []).length : 0,
        hunters: state ? (state.predators || []).length : 0,
        stalking: state ? (state.predators || []).filter(function (p) { return p.pending; }).length : 0,
        eggs: state ? (state.eggs || []).length : 0,
        gen: state ? (state.gen || 1) : 1,
        worstTempOff: offs.length ? Math.round(Math.max.apply(null, offs) * 10) / 10 : 0,
        temp: state ? Math.round((state.temp || 0) * 10) / 10 : 0,
        quality: state ? Math.round(state.quality || 0) : 0,
        algae: state ? Math.round(state.algae || 0) : 0,
        goals: state ? Object.keys(state.goals || {}).length : 0,
        motes: motes.length,
        aspect: Math.round(AR * 100) / 100,
        points: state ? state.points : 0,
        dna: state ? state.fish.filter(function (f) { return !!f.dna; }).length : 0,
        dnaOk: state ? state.fish.filter(function (f) { return verifyDna(f).ok; }).length : 0,
        bank: state ? Object.keys(state.bank || {}).length : 0,
        lineage: state ? state.fish.reduce(function (n, f) { return Math.max(n, lineageOf(f).deepest || 0); }, 0) : 0
      };
    }
  };
  load();
  showMenu();
  window.addEventListener("resize", resize);
  requestAnimationFrame(loop);
})();
