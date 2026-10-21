/* ============================================================================
   LYGO Arena — the pre-stage (formations).

   Every other file in this folder answers one question: what does a body do once
   the fight is ON. This one answers the question before that one, and it is a
   different question. Five bodies walking in as five individuals lose to five
   bodies that walked in as a squad, and the difference is not the fighting — it is
   that one side picked a shape, gave every body a post, named a target for each of
   them, and only then pushed.

   So this is a layer on top of the brain, not a brain. It owns three things and
   then it gets out of the way:

     1. THE SHAPE. Five formations, each with a temper (defensive, balanced or
        aggressive). A formation is a set of posts — a row for the front, the
        shooters behind it, the menders behind them, the gankers out on the wings —
        laid out along the line between the two teams, so a team always faces the
        fight it is walking into.

     2. THE MARCH. While the announcer reads the teams in, the bodies walk to their
        posts. Fifteen seconds is the house's intro slot and it is plenty: at full
        speed a body covers about three tiles a second, and no post is more than
        twelve tiles from a spawn. Nothing is in reach yet, so nothing is being hit
        and no cooldown is being spent — what the crowd sees is a team setting up.
        The booth can name the shape at the bell because by then the shape is real.

     3. THE OPENING. At the bell every body has a post and the team has claims: this
        enemy is yours. The front rank goes first, the shooters take their band, the
        gankers wait for the opening the shape says to wait for, the menders stay
        behind whatever is in front of them. If a body gets jumped by somebody its
        claim did not account for, the whole team re-plans on the spot — a hard
        switch, not a drift.

   After OPEN_S, or the first death, or when the fight has clearly left the posts,
   this file releases every body back to the personal brain. From then on the kit
   fights with the style and the personality it always had. That is the whole point
   of a layer: it sets the opening, and then for that body it stops existing.
   ========================================================================== */
(function (w) {
  const TILE = 32;
  /* How long the team owns the opening. Long enough for the first clash to be a
     clash of shapes; short enough that a rout or a rout-avoidance is the brain's
     business and not this file's. */
  const OPEN_S = 9.0;
  /* How far apart the waves are released, and how long a ganker waits for a seam. */
  const WAVE_GAP = 1.25;
  const GANK_HOLD = 2.6;
  /* "Rushed" is somebody hostile, inside this many pixels, whom the plan did not
     name for this body. That is the trigger for the hard switch. */
  const RUSH_PX = 96;

  /* ---------------------------------------------------------------- the shapes.
     row: tiles along the team's own axis, signed -- 0 is the front line, NEGATIVE is
     behind it, positive is past it (a wing that leans into the fight).
     lat: lateral position, -1 to 1 across the team's own width.
     Each shape is a set of posts per role, plus how it opens the fight. */
  const FORMATIONS = [
    {
      id: "hammer", name: "The Hammer", temper: "aggressive",
      line: "the whole weight on one shoulder, and nothing held back",
      rows: { front: [0, 0], mid: [-1.6, 0], flank: [0.2, 0.85], back: [-3.4, 0] },
      width: 5.2, wave: { front: 0, mid: 1, flank: 1, back: 2 }, gank: 2.4,
      claim: "back",        /* kill the shooters and the menders first */
      note: "the front rank takes the door and the rest follow it in"
    },
    {
      id: "line", name: "The Shield Line", temper: "defensive",
      line: "a wall of the widest bodies, and the guns behind the wall",
      rows: { front: [0, 0], mid: [-2.2, 0], flank: [-1.0, 0.7], back: [-4.2, 0] },
      width: 7.0, wave: { front: 0, mid: 2, flank: 2, back: 3 }, gank: 4.0,
      claim: "front",       /* take the door first, then walk through it */
      note: "nobody steps past the wall until the wall has something to hold"
    },
    {
      id: "crescent", name: "The Crescent", temper: "balanced",
      line: "the middle held back, the tips forward, the whole thing closing",
      rows: { front: [0, 0], mid: [-1.2, 0], flank: [0.8, 0.8], back: [-2.8, 0] },
      width: 6.2, wave: { front: 0, mid: 1, flank: 0, back: 2 }, gank: 1.8,
      claim: "hurt",        /* the shape decides who is nearest the wounded */
      note: "the tips close first and the middle follows the fight it makes"
    },
    {
      id: "pincer", name: "The Split", temper: "aggressive",
      line: "two groups, one either side, both aimed at the soft middle",
      rows: { front: [0.6, 0.55], mid: [-1.4, -0.55], flank: [1.4, 0.85], back: [-2.6, -0.7] },
      width: 8.0, wave: { front: 0, mid: 1, flank: 0, back: 2 }, gank: 1.6,
      claim: "back",
      note: "the wings are told to arrive at the same moment as the fists"
    },
    {
      id: "anchor", name: "The Anchor", temper: "defensive",
      line: "a tight core that does not move, and wings that punish anybody who walks into it",
      rows: { front: [0, 0], mid: [-1.4, 0], flank: [-0.4, 0.9], back: [-2.4, 0] },
      width: 4.0, wave: { front: 0, mid: 2, flank: 3, back: 3 }, gank: 4.6,
      claim: "nearest",
      note: "the core holds its ground and the wings take whatever overcommits"
    }
  ];

  const F = [{}, {}];

  function live(list) { return (list || []).filter((e) => e && !e.dead); }
  function team(S, i) { return i === 0 ? S.your : S.foe; }
  function enemies(S, i) { return team(S, 1 - i); }

  /* ------------------------------------------------------------------- roles.
     What a body IS in a formation, which is not the same question as what it is in
     a fight. A body that mends belongs behind whatever takes hits, whatever else it
     can do; a body that fights from a long barrel belongs behind the fists; a body
     built to jump the back line is a wing, not a rank. */
  function isMender(b) { return !!(b && (b.moves || []).some((m) => m.st && m.st.heal)); }
  function isGunner(b) { return !!b && b.range > 160; }
  function roleOf(e) {
    const b = e.b || {};
    const cls = b.cls || "";
    const range = b.range || 0;
    if (cls === "token") return "back";                       /* a ward follows its holder */
    if (isMender(b)) return "back";
    if (cls === "artillery" || cls === "medic") return "back";
    if (range > 260) return "back";
    if (cls === "assassin" || cls === "berserker") return "flank";
    if (cls === "rush" && (b.max || 0) < 620) return "flank";
    if (cls === "bulwark" || cls === "vanguard") return "front";
    if (range <= 100) return "front";
    if (range <= 160) return "mid";
    return "mid";
  }

  /* A body is not a rank, it is a body: the toughest of the front takes the middle
     of the front, because that is where the fight arrives. */
  function order(list, role) {
    const arr = list.slice();
    if (role === "front") arr.sort((a, b) => (b.b.max + (b.b.armor || 0) * 40) - (a.b.max + (a.b.armor || 0) * 40));
    else if (role === "back") arr.sort((a, b) => (a.b.range || 0) - (b.b.range || 0));
    else arr.sort((a, b) => (b.b.range || 0) - (a.b.range || 0));
    return arr;
  }

  /* ------------------------------------------------------------------- pick.
     The team picks a shape, not the other way round. A squad of four fists in a
     shield line is a squad standing in a queue; a squad of gunners in a hammer is a
     squad with nothing to hammer with. Composition decides, and the temper decides
     the rest, so two teams can meet in the same ring with different plans. */
  function pick(S, i, rnd) {
    const mine = live(team(S, i));
    const roles = mine.map(roleOf);
    const fists = roles.filter((r) => r === "front").length;
    const guns = roles.filter((r) => r === "back").length;
    const wings = roles.filter((r) => r === "flank").length;
    const want = [];
    if (fists >= 2 && guns <= 1) want.push("hammer", "pincer", "crescent");         /* it can only close */
    else if (guns >= 2 && fists === 0) want.push("line", "anchor", "crescent");      /* it can only hold */
    else if (wings >= 2) want.push("pincer", "crescent", "hammer");                  /* it was built to split */
    else if (guns >= 2) want.push("anchor", "line", "crescent");
    else want.push("crescent", "hammer", "line");
    if (mine.length <= 2) want.push("anchor", "line");                               /* small squads hold */
    const pool = want.concat(FORMATIONS.map((f) => f.id)).filter((v, k, a) => a.indexOf(v) === k);
    const id = pool[Math.min(pool.length - 1, Math.floor(rnd() * Math.min(3, pool.length)))];
    return FORMATIONS.find((f) => f.id === id) || FORMATIONS[0];
  }

  /* ------------------------------------------------------------------- stage.
     Called once per match, before the countdown starts. Everything the layer needs
     to know is computed here, once: the axis the team is facing, the post each body
     owns, the order the waves are released in, and who is claiming whom. */
  function stage(S, seed) {
    if (!S || !S.your || !S.foe) return null;
    const rnd = mulberry(seed == null ? 12345 : seed);
    S.form = { mode: S.mode || 0, contactAt: null, openedAt: null, teams: [] };
    for (let i = 0; i < 2; i++) {
      const F0 = F[i];
      F0.active = true;
      F0.t = 0;
      F0.released = false;
      F0.liveT = null;              /* the opening clock starts at the BELL, not the countdown */
      F0.switches = 0;
      F0.rnd = mulberry(Math.floor((seed == null ? 12345 : seed) * 7 + i * 977));
      F0.pick = pick(S, i, F0.rnd);
      F0.mine = live(team(S, i));
      F0.theirs = live(team(S, 1 - i));
      const mineC = centroid(F0.mine), foeC = centroid(F0.theirs);
      /* The axis is latched ONCE, from the two starting lines. A formation that
         re-aims every frame is not a formation, it is a rumour. */
      const dx = (foeC.x - mineC.x), dy = (foeC.y - mineC.y);
      const len = Math.hypot(dx, dy) || 1;
      F0.dir = { x: dx / len, y: dy / len };
      F0.perp = { x: -F0.dir.y, y: F0.dir.x };
      F0.anchor = { x: mineC.x + F0.dir.x * TILE * 1.6, y: mineC.y + F0.dir.y * TILE * 1.6 };
      F0.spread0 = spread(F0.mine);
      /* posts */
      const byRole = { front: [], mid: [], flank: [], back: [] };
      F0.mine.forEach((e) => byRole[roleOf(e)].push(e));
      F0.slot = {};
      Object.keys(byRole).forEach((role) => {
        const list = order(byRole[role], role);
        const spec = F0.pick.rows[role] || [0, 0];
        list.forEach((e, k) => {
          /* a rank of one stands in the middle of its rank; a rank of many spreads
             across the team's width, and every rank is centred on the same axis */
          const n = list.length;
          const lat = n === 1 ? 0 : (k / (n - 1)) * 2 - 1;
          const w = F0.pick.width * spec[1];
          const row = spec[0];
          /* rows are signed: 0 is the front line, negative is behind it. The offset is
             therefore ADDED to the anchor -- subtracting it (as this did) put every back
             rank in front of the front rank and every ganker on the wrong shoulder. */
          const px = F0.anchor.x + F0.dir.x * row * TILE + F0.perp.x * lat * w * TILE * 0.5;
          const py = F0.anchor.y + F0.dir.y * row * TILE + F0.perp.y * lat * w * TILE * 0.5;
          e.slot = { x: px, y: py };
          e.role = role;
          e.wave = F0.pick.wave[role] == null ? 1 : F0.pick.wave[role];
          F0.slot[e.b && e.b.id ? e.b.id : "body"] = e.slot;
          /* the post has to be somewhere a body may stand */
          const m = 1.6 * TILE;
          e.slot.x = Math.max(m, Math.min((S.lv.W * TILE) - m, e.slot.x));
          e.slot.y = Math.max(m, Math.min((S.lv.H * TILE) - m, e.slot.y));
        });
      });
      /* claims: every enemy is somebody's job, and the temper says who gets the pick */
      planClaims(S, i);
      S.form.teams.push({
        pick: F0.pick.id, name: F0.pick.name, temper: F0.pick.temper, note: F0.pick.note,
        axis: { x: F0.dir.x, y: F0.dir.y }, anchor: { x: F0.anchor.x, y: F0.anchor.y },
        spread0: Math.round(F0.spread0), spreadAtBell: null, firstContact: null,
        frontFirst: null, flankFirst: null, releasedAt: null, switches: 0, claims: 0
      });
    }
    return S.form;
  }

  function centroid(list) {
    let x = 0, y = 0;
    list.forEach((e) => { x += e.x; y += e.y; });
    const n = list.length || 1;
    return { x: x / n, y: y / n };
  }
  function spread(list) {
    if (!list.length) return 0;
    let s = 0;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        s += Math.hypot(list[i].x - list[j].x, list[i].y - list[j].y);
      }
    }
    return s / Math.max(1, (list.length * (list.length - 1)) / 2);
  }
  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------------ claims.
     A claim is not a target lock: it is the answer to "whose job is that one". The
     front rank takes the enemy front for a defensive shape because you cannot walk
     to the soft middle through a door; an aggressive shape puts its wings on the
     menders and the guns, because that is what the shape is FOR. Every enemy gets
     at least one name on it, or the team has a body nobody is dealing with. */
  function planClaims(S, i) {
    const F0 = F[i];
    const mine = live(team(S, i));
    const theirs = live(team(S, 1 - i));
    F0.claim = {};
    mine.forEach((e) => { e.claim = null; });
    if (!mine.length || !theirs.length) return;
    const temper = F0.pick.claim;
    const weight = (o) => {
      let sc = 0;
      if (isMender(o.b)) sc += 46;
      if ((o.b.range || 0) > 160) sc += 30;
      sc += (1 - o.hp / Math.max(1, o.max)) * 40;
      if (temper === "back") { sc += isMender(o.b) ? 30 : 0; sc += (o.b.range || 0) > 160 ? 22 : 0; }
      if (temper === "front") { sc += (o.b.range || 0) <= 100 ? 40 : 0; sc += (o.b.max || 0) >= 800 ? 26 : 0; }
      if (temper === "nearest") sc -= Math.hypot(o.x - F0.anchor.x, o.y - F0.anchor.y) * 0.22;
      sc += (o.b.boss ? 30 : 0);
      return sc;
    };
    /* NOBODY IS UNACCOUNTED FOR. Every enemy has to have at least one name on it, so
       the assignment is done by need: whoever has the fewest attackers takes the next
       body, and the temper only decides the ORDER the enemies are considered in. The
       version before this walked a fixed list, which meant a wide enemy team ended with
       bodies nobody had been told to deal with. */
    const count = new Map();
    theirs.forEach((o) => { count.set(o, 0); });
    const styleOfBody = (e) => (w.LYGO_BRAIN && w.LYGO_BRAIN.styleOf ? (w.LYGO_BRAIN.styleOf(e.b) || {}) : {});
    /* THE HUNTERS PICK FIRST, THEN THE WINGS, THEN THE RANKS. A kit built to finish the
       wounded has to choose before the marching kits have taken the wounds off the
       board, or the team's call quietly turns every knife into another rank-and-file
       body -- which is what the census showed: the knives were only a few points ahead
       of the chargers at picking the weak. Order of choice is what a hunting pack is. */
    const rank = (e) => ((styleOfBody(e).prefer || "") === "weakest" ? 0 : (e.role === "flank" ? 1 : 2));
    const queue = mine.slice().sort((a, b) => rank(a) - rank(b));
    queue.forEach((e) => {
      const hunts = (styleOfBody(e).prefer || "") === "weakest";
      let pool = theirs;
      /* the front rank of a defensive shape stays on the door it has to walk through */
      if (e.role === "front" && temper === "front") {
        const doors = theirs.filter((o) => (o.b.range || 0) <= 100 || (o.b.max || 0) >= 900);
        if (doors.length) pool = doors;
      }
      const chosen = pool.slice().sort((a, b) => {
        const ca = count.get(a) || 0, cb = count.get(b) || 0;
        /* COVER THE FIELD FIRST. An enemy nobody has taken outranks an enemy somebody
           already has, whatever the kit would rather be doing -- otherwise four knives
           all take the same bleeding body and the fifth enemy walks the ring unbothered.
           Only when both are equally claimed (or equally free) does the kit get to be
           itself, which is where a hunter's instinct for the wound belongs: the team
           names the job, the kit decides which body it is. */
        if ((ca === 0) !== (cb === 0)) return ca - cb;
        if (hunts) {
          const d = (a.hp / Math.max(1, a.max)) - (b.hp / Math.max(1, b.max));
          if (Math.abs(d) > 0.02) return d;
        }
        if (ca !== cb) return ca - cb;
        return weight(b) - weight(a);
      })[0];
      e.claim = chosen || null;
      if (chosen) count.set(chosen, (count.get(chosen) || 0) + 1);
    });
    F0.claims = mine.filter((e) => !!e.claim).length;
  }
  function near(e, a, b) { return dist2(e, a) < dist2(e, b); }
  function dist2(e, o) { return (e.x - o.x) * (e.x - o.x) + (e.y - o.y) * (e.y - o.y); }

  /* ------------------------------------------------------------------- march.
     Called every frame while the countdown runs. It moves the body to its post and
     nothing else: no target is shot at, no move is cast, because nothing is in reach
     and this is not the fight yet. It is the team setting up in front of a crowd. */
  function march(S, dt) {
    if (!S || !S.form || S.phase !== "count") return false;
    for (let i = 0; i < 2; i++) {
      const F0 = F[i];
      if (!F0.active) continue;
      F0.t += dt;
      /* THE MARCH IS WALKED HERE, not asked for. The brain has a dozen preconditions
         before it will take a step (a target, a band, a plan it trusts) and a body
         standing on its own spawn with nothing in reach satisfies none of them -- which
         is exactly how a pre-stage ends up as five bodies frozen on their marks while
         the announcer reads. So the layer moves its own bodies: a straight walk to the
         post at the body's own speed, in the open half of the ring, before anything is
         in reach. Nothing else about the body is touched. */
      live(team(S, i)).forEach((e) => {
        if (!e.slot || e.stun > 0 || e.root > 0) return;
        const dx = e.slot.x - e.x, dy = e.slot.y - e.y;
        const d = Math.hypot(dx, dy);
        if (d < 9) { e.walk = 0; return; }
        const step = Math.min(d, (e.b.speed || 90) * 0.9 * dt);
        e.x += (dx / d) * step;
        e.y += (dy / d) * step;
        e.face = Math.atan2(dy, dx) >= -Math.PI / 2 && Math.atan2(dy, dx) <= Math.PI / 2 ? 3 : 2;
        e.walk = (e.walk || 0) + dt * 9;
      });
      F0.staged = live(team(S, i)).filter((e) => e.slot).length;
    }
    return true;
  }

  /* -------------------------------------------------------------------- tick.
     Called at the top of every live step, before the squad brain makes its call.
     It runs the release clock, notices a team that has been jumped on, and stamps
     the telemetry the house measures the opening with. */
  function tick(S, dt) {
    if (!S || !S.form) return;
    for (let i = 0; i < 2; i++) {
      const F0 = F[i];
      if (!F0.active) continue;
      F0.t += dt;
      /* F0.t is the wall clock of the whole pre-stage (it runs under the countdown).
         F0.liveT is the age of the OPENING and starts the moment the bell rings --
         every wave and the release are measured against that one, never the other. */
      /* Any phase that is not the countdown is the fight running. The browser says
         "live" and a headless run says whatever it likes; a clock that only understands
         one of those names is a clock that never starts in the other. */
      if (S.phase !== "count") F0.liveT = (F0.liveT == null ? 0 : F0.liveT) + dt;
      else F0.liveT = null;
      const mine = live(team(S, i));
      if (!mine.length) { F0.active = false; continue; }
      /* the first moment the two sides are actually trading */
      if (S.form.contactAt == null) {
        const foe = live(team(S, 1 - i));
        const touching = mine.some((e) => foe.some((o) => dist2(e, o) < 150 * 150));
        if (touching) {
          S.form.contactAt = S.time;
          S.form.teams[i].spreadAtBell = Math.round(spread(mine));
        }
      }
      const rec = S.form.teams[i];
      mine.forEach((e) => {
        const reached = foeReached(S, e, i);
        if (rec.firstContact == null && reached) rec.firstContact = S.time;
        if (e.role === "front" && rec.frontFirst == null && reached) rec.frontFirst = S.time;
        if (e.role === "flank" && rec.flankFirst == null && reached) rec.flankFirst = S.time;
      });
      /* rushed: a hostile body inside the guard radius that nobody claimed for us */
      let jumped = false;
      mine.forEach((e) => {
        live(team(S, 1 - i)).forEach((o) => {
          if (dist2(e, o) > RUSH_PX * RUSH_PX) return;
          if (e.claim && e.claim === o) return;
          if (o.claim && o.claim === e) return;
          jumped = true;
        });
      });
      if (jumped) { planClaims(S, i); rec.switches++; F0.switchedAt = S.time; }
      /* release: the opening is over, the brain owns the body again */
      const dead = team(S, i).some((e) => e.dead);
      const liveT = F0.liveT || 0;
      if (!F0.released && (liveT > OPEN_S || dead || (S.form.contactAt != null && S.time - S.form.contactAt > 6.5))) {
        F0.released = true;
        F0.active = false;
        rec.releasedAt = S.time;
        rec.switches = F0.switches;
        if (!S.form.openedAt) S.form.openedAt = S.time;
      }
    }
  }
  function foeReached(S, e, i) {
    if ((e.taken || 0) > 0) return true;                       /* it has been hit */
    if ((e.dmgDone || 0) > 0) return true;                     /* it has hit somebody */
    return live(team(S, 1 - i)).some((o) => dist2(e, o) < 110 * 110);
  }

  /* ---------------------------------------------------------------- planFor.
     The hook the arena brain calls first. Returns a plan while this layer owns the
     body and NULL the moment it does not, which is how the personal brain gets the
     body back without either file having to know about the other. */
  function planFor(S, e) {
    if (!S || !S.form || !e || e.dead) return null;
    const F0 = F[e.team == null ? 0 : e.team];
    if (!F0 || !F0.active) return null;
    if (e.b && e.b.cls === "token") return null;              /* a ward follows its holder, not a post */
    const slot = e.slot;
    if (!slot) return null;
    const held = (F0.liveT == null ? 0 : F0.liveT) < (e.wave || 0) * WAVE_GAP;
    const foe = e.claim && !e.claim.dead ? e.claim : null;
    /* THE MARCH: walk the post, hold the post. Nothing else until the bell. */
    if (S.phase === "count") {
      const d = Math.hypot(e.x - slot.x, e.y - slot.y);
      if (d > 14) return { task: "press", band: 0, gait: 1, point: slot, target: null, why: "post" };
      return { task: "hold", band: 0, gait: 0, point: slot, target: null, why: "post" };
    }
    /* THE OPENING: the front goes, the shooters take their band, the wings wait for
       the seam their shape says to wait for, and the menders stay behind the wall. */
    if (held) return { task: "hold", band: 0, gait: 0, point: slot, target: null, why: "wave" };
    if (!foe) {
      /* nothing claimed and alive: advance on the enemy centre, in formation */
      const c = centroid(live(e.team === 0 ? S.foe : S.your));
      return { task: "press", band: 0, gait: 1, point: { x: c.x, y: c.y }, target: null, why: "advance" };
    }
    if (e.role === "flank") {
      /* a ganker does not walk into the front. It waits for the seam and then takes
         the body it was pointed at, from the side, when the front is already busy. */
      /* The seam is not a timer alone: it is the front being busy, or the body it
         was pointed at already bleeding. A ganker that walks in first is just a
         smaller front-rank body, and it dies like one. */
      const enemySide = live(team(S, 1 - i));
      const engaged = live(team(S, i)).some((m) => m.role !== "flank" &&
        enemySide.some((o) => dist2(m, o) < 150 * 150));
      const seam = (F0.liveT || 0) > GANK_HOLD || engaged || (foe.hp / Math.max(1, foe.max) < 0.7);
      if (!seam) return { task: "hold", band: 0, gait: 0, point: slot, target: null, why: "seam" };
      return { task: "press", band: e.b.range, gait: 1, point: { x: foe.x, y: foe.y }, target: foe, why: "gank" };
    }
    if (e.role === "back") {
      /* the menders and the guns do not advance past the front. They walk to their
         band and stop there, which is what keeps them behind the wall. */
      const band = Math.max(58, (e.b.range || 120) * 0.86);
      return { task: "press", band: band, gait: 1, point: null, target: foe, why: "back" };
    }
    return { task: "press", band: e.b.range, gait: 1, point: null, target: foe, why: "rank" };
  }

  /* -------------------------------------------------------------------- call.
     What the booth says at the bell. One line per team, naming the shape and the
     thing the shape is trying to do, because a formation nobody can see is just a
     spawn offset. */
  function call(S) {
    if (!S || !S.form) return null;
    return S.form.teams.map((t, i) => ({
      side: i === 0 ? "yours" : "theirs",
      team: i === 0 ? 0 : 1,
      name: t.name, temper: t.temper, note: t.note
    }));
  }

  /* ---------------------------------------------------------------- telemetry. */
  function report(S) {
    if (!S || !S.form) return null;
    return {
      teams: S.form.teams.slice(),
      contactAt: S.form.contactAt == null ? null : +S.form.contactAt.toFixed(2),
      openedAt: S.form.openedAt == null ? null : +S.form.openedAt.toFixed(2)
    };
  }

  w.LYGO_FORMATION = {
    FORMATIONS: FORMATIONS, OPEN_S: OPEN_S,
    stage: stage, march: march, tick: tick, planFor: planFor, call: call, report: report,
    roleOf: roleOf, state: F, pick: pick
  };
})(window);
