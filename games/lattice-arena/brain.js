/* LYGO Arena — the brain.
   ---------------------------------------------------------------------------
   The engine moves bodies and fires their kits. This file decides what a body is
   TRYING to do: which enemy the team kills, who goes to the wound, who holds the
   line, who takes the long way round, who breaks contact, and who is standing
   between the enemy and somebody who cannot take a hit.

   Two layers, because a fight is two things at once:

     · the SQUAD brain (one per team, every few tenths of a second) — reads the
       whole field: both centroids, who is wounded, which enemy is worth killing
       first, where the line is, whether the ground is ours, and calls it.
     · the BODY brain (per fighter, cached) — each body reads the squad's call
       plus its own situation (health, what is shooting at it, cover next to it,
       who is next to it, which way it is facing relative to its own team) and
       picks ONE task.

   A task is an intent, not a script: { task, target, point, band, gait, why }.
   The engine does the walking and the pathing. The task says where the body
   wants to be. That place is always a zone on the live map: our starting third
   is defensive, the centre third is the fight, their starting third is offensive.
   No task aims a body at the border or a corner. A body already on the edge
   repairs inward unless it is in reach of a swing.

   The names are the real ones, because they are the real ideas: bounding
   overwatch, flanking, refusing a flank, enfilade, screening, choke control,
   rallying on the standard, breaking contact. They are also what the HUD shows,
   so a spectator can watch a team think.

   No engine internals are touched: the arena passes its state in (S) and the
   helpers it already has (clearLine). Everything here is readable on its own.
*/
(function (w) {
  "use strict";

  const TILE = 32;

  /* ------------------------------------------------------------- the styles ---
     A style is the SHAPE of a body's decisions, not its numbers: how far out it
     likes to fight, how quickly it leaves a losing exchange, how tightly it is
     leashed to its own line, how much it drifts while it fights, how long it
     commits before it stops dithering, whether it flanks, and which enemy it
     would rather have.

       band     the fraction of its reach it wants to stand at
       retreat  below this share of health it starts looking for a way out
       leash    px it will not stray past from its own line (0 = no leash)
       strafe   how much it drifts sideways while holding
       commit   seconds before it commits to the nearest body instead of dancing
       panic    px inside which a kiter steps back
       brave    seconds it will stand its ground while being closed on
       prefer   which enemy it favours: attack · nearest · weakest · clump · protect
       flank    it would rather arrive from the side
       recoil   px it steps back after throwing something (hit and run)
       screen   it will stand between the enemy and its own squishy
       aid      ally health share below which it goes to the wound
       wound    it closes as it bleeds instead of leaving
  */
  const STYLES = {
    rush:       { band: 0.86, retreat: 0.10, leash: 0,   strafe: 0.30, commit: 0.9, prefer: "attack",  brave: 2.0 },
    vanguard:   { band: 0.96, retreat: 0.24, leash: 150, strafe: 0.35, commit: 1.4, prefer: "attack",  brave: 1.6 },
    duelist:    { band: 0.94, retreat: 0.20, leash: 0,   strafe: 1.00, commit: 2.4, prefer: "attack",  brave: 2.0 },
    assassin:   { band: 0.88, retreat: 0.30, leash: 0,   strafe: 0.80, commit: 0.9, prefer: "weakest", brave: 0.9, flank: 1 },
    skirmish:   { band: 0.90, retreat: 0.34, leash: 0,   strafe: 0.70, commit: 0.7, prefer: "attack",  brave: 1.2, recoil: 1.15 },
    kite:       { band: 1.00, retreat: 0.40, leash: 0,   strafe: 1.10, commit: 0.6, prefer: "nearest", brave: 1.7, panic: 190 },
    artillery:  { band: 1.00, retreat: 0.28, leash: 240, strafe: 0.20, commit: 1.6, prefer: "clump",   brave: 1.4 },
    medic:      { band: 0.92, retreat: 0.30, leash: 130, strafe: 0.45, commit: 1.2, prefer: "protect", brave: 1.2, aid: 0.80 },
    controller: { band: 0.96, retreat: 0.28, leash: 0,   strafe: 1.25, commit: 1.0, prefer: "clump",   brave: 1.3 },
    berserker:  { band: 0.94, retreat: 0.06, leash: 0,   strafe: 0.55, commit: 1.8, prefer: "attack",  brave: 3.0, wound: 1 },
    hunter:     { band: 0.90, retreat: 0.24, leash: 0,   strafe: 0.50, commit: 1.0, prefer: "weakest", brave: 1.5, flank: 1 },
    bulwark:    { band: 0.88, retreat: 0.18, leash: 120, strafe: 0.30, commit: 3.0, prefer: "protect", brave: 1.4, screen: 1 }
  };
  /* The style is the doctrine. The tune is that one kit: band, leash, panic, retreat,
     strafe, commit. The roster already wrote a tune for every fighter. Reading it
     is what makes two bulwarks fight as two people. */
  function styleOf(b) {
    const base = STYLES[(b && b.style) || "duelist"] || STYLES.duelist;
    const tune = b && b.tune;
    if (!tune) return base;
    const st = Object.assign({}, base);
    const num = (k, lo, hi) => {
      if (typeof tune[k] === "number") st[k] = Math.max(lo, Math.min(hi, tune[k]));
    };
    num("band", 0.45, 1.05);
    num("retreat", 0, 0.55);
    num("leash", 0, 320);
    num("strafe", 0, 1.6);
    num("commit", 0.45, 3.6);
    num("brave", 0.4, 3.2);
    num("panic", 70, 240);
    num("recoil", 0.5, 2);
    num("aid", 0.45, 0.92);
    return st;
  }

  /* ------------------------------------------------------------------ helpers --- */
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function live(list) { return list.filter((e) => !e.dead); }
  function allies(S, e) { return live(e.team === 0 ? S.your : S.foe); }
  function enemies(S, e) { return live(e.team === 0 ? S.foe : S.your); }

  /* is a point inside stone? (the brain reads the level directly) */
  function stone(S, x, y) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (tx < 0 || ty < 0 || tx >= S.lv.W || ty >= S.lv.H) return true;
    return S.lv.tiles[ty][tx] === "wall";
  }
  /* a body standing here has stone on that side — the raw material of cover */
  function coverAt(S, x, y, tx2, ty2) {
    const a = Math.atan2(ty2 - y, tx2 - x);
    let n = 0;
    for (let s = -0.9; s <= 0.9; s += 0.9) {
      const px = x + Math.cos(a + s) * 24, py = y + Math.sin(a + s) * 24;
      if (stone(S, px, py)) n++;
    }
    return n;
  }
  /* how pinched is this tile? 0 = open field, 4 = a slot with one way in */
  function pinch(S, x, y) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    let n = 0;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= S.lv.W || ny >= S.lv.H) { n++; return; }
      if (S.lv.tiles[ny][nx] === "wall") n++;
    });
    return n;
  }
  /* is there a clear point between two bodies? raycast, coarse is enough */
  function sight(S, x0, y0, x1, y1) {
    const d = dist(x0, y0, x1, y1);
    const n = Math.max(2, Math.ceil(d / 16));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (stone(S, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
    }
    return true;
  }
  /* does this kit mend other people? the utility half of the roster */
  function isSupport(b) {
    return (b.moves || []).some((m) => m.aim === "allylow" || m.aim === "allies" || m.shape === "allies" || (m.st && m.st.heal));
  }
  function healMove(b) {
    return (b.moves || []).find((m) => m.st && m.st.heal && (m.aim === "allylow" || m.aim === "allies" || m.shape === "allies" || m.shape === "ally"));
  }

  /* --------------------------------------------------------------- the map ---
     Generic arenas. The only size that matters is the one this fight loaded
     (S.lv.W, S.lv.H, TILE). The border wall is the edge. Inside it the floor
     is three bands across the width:

       defensive  the third on the side this team started
       mid        the centre third — tactical ground, where a fight should live
       offensive  the third on the side the other team started

     Home is latched from the first centroid, so a team that crosses mid does
     not forget which side it is defending. Nothing here is a pixel layout. */
  function fieldOf(S) {
    const W = S.lv.W * TILE, H = S.lv.H * TILE;
    const m = Math.max(TILE * 2.35, Math.min(W, H) * 0.10);
    return { W: W, H: H, m: m, x0: m, y0: m, x1: W - m, y1: H - m, cx: W * 0.5, cy: H * 0.5 };
  }
  function clampBox(x, y, x0, y0, x1, y1) {
    return {
      x: Math.max(x0, Math.min(x1, x)),
      y: Math.max(y0, Math.min(y1, y))
    };
  }
  /* how far a point sits outside the playable inset. 0 means it is off the wall. */
  function rimPush(S, x, y) {
    const f = fieldOf(S);
    const dx = x < f.x0 ? f.x0 - x : (x > f.x1 ? x - f.x1 : 0);
    const dy = y < f.y0 ? f.y0 - y : (y > f.y1 ? y - f.y1 : 0);
    return Math.hypot(dx, dy);
  }
  function zoneAt(S, Q, x) {
    const f = fieldOf(S);
    const span = (f.x1 - f.x0) / 3;
    const home = (Q && Q.home) || -1;
    const third = x < f.x0 + span ? -1 : (x > f.x1 - span ? 1 : 0);
    if (third === 0) return "mid";
    return third === home ? "def" : "off";
  }
  /* defensive tasks fall in on the inner half of our third, not on the back wall.
     Offensive points may use mid or their third, and stop short of their wall. */
  function zoneRole(task) {
    if (task === "withdraw" || task === "rally") return "def";
    if (task === "flank" || task === "press" || task === "advance") return "off";
    return "any";
  }
  function zoneBox(S, Q, role) {
    const f = fieldOf(S);
    const home = (Q && Q.home) || -1;
    const span = (f.x1 - f.x0) / 3;
    let x0 = f.x0, x1 = f.x1;
    if (role === "def") {
      if (home < 0) { x0 = f.x0 + span * 0.38; x1 = f.x0 + span; }
      else { x0 = f.x1 - span; x1 = f.x1 - span * 0.38; }
    } else if (role === "off") {
      const pad = span * 0.28;
      if (home < 0) { x0 = f.x0 + span; x1 = f.x1 - pad; }
      else { x0 = f.x0 + pad; x1 = f.x1 - span; }
    } else if (role === "mid") {
      x0 = f.x0 + span;
      x1 = f.x1 - span;
    }
    return { x0: x0, x1: x1, y0: f.y0, y1: f.y1 };
  }
  function pullCorner(f, p) {
    const band = f.m * 0.55;
    const nearL = p.x < f.x0 + band, nearR = p.x > f.x1 - band;
    const nearT = p.y < f.y0 + band, nearB = p.y > f.y1 - band;
    if ((nearL || nearR) && (nearT || nearB)) {
      return clampBox(
        p.x + (nearL ? 1 : -1) * f.m * 0.85,
        p.y + (nearT ? 1 : -1) * f.m * 0.65,
        f.x0, f.y0, f.x1, f.y1
      );
    }
    return p;
  }
  function stepOpen(S, p) {
    const f = fieldOf(S);
    let x = p.x, y = p.y;
    for (let i = 0; i < 8 && stone(S, x, y); i++) {
      x += (f.cx - x) * 0.22;
      y += (f.cy - y) * 0.22;
    }
    return clampBox(x, y, f.x0, f.y0, f.x1, f.y1);
  }
  function settle(S, Q, point, role) {
    if (!point) return null;
    const f = fieldOf(S);
    let p = clampBox(point.x, point.y, f.x0, f.y0, f.x1, f.y1);
    p = pullCorner(f, p);
    if (role && role !== "any") {
      const box = zoneBox(S, Q, role);
      p = clampBox(p.x, p.y, box.x0, box.y0, box.x1, box.y1);
      p = pullCorner(f, p);
    }
    return stepOpen(S, p);
  }
  function defendPoint(S, Q) {
    const f = fieldOf(S);
    const home = (Q && Q.home) || -1;
    const span = (f.x1 - f.x0) / 3;
    const x = home < 0 ? f.x0 + span * 0.62 : f.x1 - span * 0.62;
    const y = Math.max(f.y0, Math.min(f.y1, Q.cy || f.cy));
    return stepOpen(S, { x: x, y: y });
  }
  /* a body already on the rim walks back into the zone its task belongs in.
     Attackers leave their own back wall for the centre. Defenders fall in on
     the inner side of their third. Nobody is sent at a corner to "get clear". */
  function repairPoint(S, Q, e, role) {
    const f = fieldOf(S);
    const home = (Q && Q.home) || (e.team === 0 ? -1 : 1);
    const span = (f.x1 - f.x0) / 3;
    const y = Math.max(f.y0, Math.min(f.y1, (e.y + f.cy) * 0.5));
    let x;
    if (role === "def") x = home < 0 ? f.x0 + span * 0.62 : f.x1 - span * 0.62;
    else if (role === "off") {
      const onHome = home < 0 ? e.x < f.cx : e.x > f.cx;
      x = onHome ? f.cx : (home < 0 ? f.x0 + span * 2.15 : f.x1 - span * 2.15);
    } else x = f.cx;
    return stepOpen(S, { x: x, y: (e.y < f.y0 || e.y > f.y1) ? f.cy : y });
  }

  /* ------------------------------------------------------------- squad brain ---
     One record per team. Recomputed on a timer because the shape of a fight does
     not change every frame, and a call that flickers is worse than a call that is
     slightly stale. */
  const SQ = [{}, {}];
  function blank() {
    return { focus: null, why: "", t: 0, cx: 0, cy: 0, ecx: 0, ecy: 0, axis: 0, rally: null,
      wounded: null, odds: 0, front: 0, back: 0, n: 0, en: 0, calls: 0 };
  }
  function squadTick(S, team, dt) {
    const Q = SQ[team];
    Q.t -= dt;
    const mine = live(team === 0 ? S.your : S.foe);
    const theirs = live(team === 0 ? S.foe : S.your);
    Q.n = mine.length; Q.en = theirs.length;
    /* the exchange, not the head count: five bodies on 10 health are not winning */
    const mSum = mine.reduce((s, e) => s + e.hp, 0), mMax = mine.reduce((s, e) => s + e.max, 0);
    Q.hpShare = mMax ? mSum / mMax : 1;
    Q.tilt = mSum - theirs.reduce((s, e) => s + e.hp, 0);
    if (!mine.length || !theirs.length) { Q.focus = null; return; }
    Q.cx = mine.reduce((s, e) => s + e.x, 0) / mine.length;
    Q.cy = mine.reduce((s, e) => s + e.y, 0) / mine.length;
    Q.ecx = theirs.reduce((s, e) => s + e.x, 0) / theirs.length;
    Q.ecy = theirs.reduce((s, e) => s + e.y, 0) / theirs.length;
    Q.axis = Math.atan2(Q.ecx - Q.cx, Q.ecy - Q.cy);
    Q.front = mine.filter((e) => e.b.range <= 100).length;
    Q.back = mine.length - Q.front;
    /* home is the side we spawned on. Relatch only while the fight is still
       on the start line, so crossing mid later does not flip defence and attack. */
    if (Q.home == null || S.time < 1.2) Q.home = Q.cx < S.lv.W * TILE * 0.5 ? -1 : 1;
    /* the standard sits on the inner side of our third. A point behind the
       centroid walks into the back wall the moment the line is already there. */
    Q.rally = defendPoint(S, Q);
    /* the wound */
    Q.wounded = mine.reduce((a, b) => (b.hp / b.max < a.hp / a.max ? b : a));
    if (Q.t > 0 && Q.focus && !Q.focus.dead) return;
    Q.t = 0.28;
    Q.calls++;
    /* who to kill: hurt bodies, the ones that mend, the ones that shoot from far,
       and anything the team is already standing on top of. Sticky — a new call
       has to be meaningfully better than the old one or the team never settles. */
    let best = null, bestScore = -1e9;
    theirs.forEach((o) => {
      const near = mine.filter((m) => dist(m.x, m.y, o.x, o.y) < 190).length;
      let sc = 0;
      sc += (1 - o.hp / o.max) * 130;                     // finish what is nearly done
      sc += isSupport(o.b) ? 22 : 0;                      // the menders are worth killing, not worth everything
      sc += o.b.range > 160 ? 22 : 0;                     // and the guns behind the line
      sc += near * 26;                                    // and what enough of us can reach
      /* A full-health door scores nothing on the wound term, so a team used to walk
         past it and shoot the back line while the door took none of the hits. If we
         are already standing on a boss, that boss is the fight. */
      if (o.b.boss && near >= 1) sc += 36;
      sc -= dist(Q.cx, Q.cy, o.x, o.y) * 0.16;            // without walking the arena
      if (o === Q.focus) sc += 45;                        // do not dither between targets
      if (sc > bestScore) { bestScore = sc; best = o; }
    });
    Q.focus = best;
    if (!best) { Q.why = ""; return; }
    Q.why = (isSupport(best.b) ? "the mender" : best.b.range > 160 ? "the gun" :
      (best.hp / best.max < 0.5 ? "the wounded one" : "the nearest knot"));
  }
  let CUR = null;
  function tick(S, dt) { CUR = S; squadTick(S, 0, dt); squadTick(S, 1, dt); }

  /* --------------------------------------------------------------- body brain ---
     A plan is cached per body and recomputed on its own clock, or earlier when
     something big changes (the called target dies, the body's health crosses a
     threshold, it gets a new patient). Everything below produces ONE task. */
  const PLAN_T = 0.18;
  function plan(S, e, dt) {
    const b = e.b;
    const st = styleOf(b);
    const en = enemies(S, e), al = allies(S, e);
    /* THE PRE-STAGE SPEAKS FIRST. While the formation layer owns this body -- the march
       to its post under the countdown, and the opening after the bell -- that is the
       plan. The moment the layer releases it (or never owned it: a ward, a stray, a
       body with no post) this returns null and the whole brain below runs exactly as it
       always did: style, personality, patience, the lot. The layer sets the opening; it
       does not fight the fight. */
    if (w.LYGO_FORMATION) {
      const fp = w.LYGO_FORMATION.planFor(S, e);
      if (fp) { e.task = fp.task; return fp; }
    }
    if (!en.length) { e.task = "hold"; return { task: "hold", target: null, point: null, band: 0, gait: 0, why: "" }; }
    const Q = SQ[e.team] || blank();
    e.planT = (e.planT == null ? 0 : e.planT) - dt;
    /* the knife's rhythm has to run on its own clock, or it darts in and out every frame */
    e.stepOutT = Math.max(0, (e.stepOutT == null ? 0 : e.stepOutT) - dt);
    const changed = !e.plan || !e.plan.target || e.plan.target.dead || e.planPatient !== Q.wounded;
    if (e.planT > 0 && !changed) return e.plan;
    e.planT = PLAN_T;

    const hp = e.hp / e.max;
    const range = b.range || 40;
    /* Close kits stand a shoulder apart. 26px put two bodies on the same pixel. */
    const band0 = Math.max(range * st.band, range <= 100 ? 42 : 60);
    const focus = Q.focus && !Q.focus.dead ? Q.focus : en[0];
    const dFocus = dist(e.x, e.y, focus.x, focus.y);
    /* what is actually on me right now */
    const near = en.filter((o) => dist(e.x, e.y, o.x, o.y) < 200);
    const localE = near.length;
    const localA = al.filter((o) => o !== e && dist(e.x, e.y, o.x, o.y) < 200).length;
    const shooters = near.filter((o) => dist(e.x, e.y, o.x, o.y) < (o.b.range || 40) + 30 && sight(S, o.x, o.y, e.x, e.y));
    /* A mending kit is a mending kit: a commander with a standard and a smith with a
       temper are as responsible for the line as the medic is. The style only decides
       how eager the threshold is. */
    /* The commander hands each hemisphere the same picture of the fight and takes all
       three answers back. None of them is consulted about the others' business: GUN says
       who, MED says who needs mending, and the feet are NAV's -- which is why a body can
       shoot while it retreats, and mend an ally while it is being shot at. */
    const healer = isSupport(b) || !!st.aid;
    const crew = { focus: focus, dFocus: dFocus, al: al, healer: healer };
    const GUN = hemisphereGun(S, e, st, crew);
    const MED = hemisphereMed(S, e, st, b, crew);
    let target = GUN.target;
    const patient = MED.patient;
    /* the one piece of kit both GUN and NAV need to know about: the closer. A contact kit
       with its dash or charge on cooldown cannot arrive at a gun, and the rhythm below is
       built on that fact. */
    /* A closer is not only a teleport. A heavy body that cannot chase reaches instead: a pull
       carrying the target in is the same idea from the other end, and it is the stronger of the
       two because it works on a body that is already running away. Both kinds join the same
       doctrine -- wait while it is down, spend the whole kit when it is up -- and that is
       decided here, once, for GUN and NAV alike. */
    const closerIdx = b.moves.findIndex((mv) => mv && (mv.shape === "stride" || mv.shape === "blink" || (mv.st && mv.st.pull)));
    const closerReady = closerIdx >= 0 && e.cds[closerIdx] <= 0;
    const closerName = closerIdx >= 0 ? b.moves[closerIdx].name : "";
    /* what the crew decided, for the thinking chip the spectator watches */
    e.hem = { gun: (target ? target.b.name : "nobody") + (GUN.why ? " (" + GUN.why + ")" : ""),
      med: MED.why || (healer ? "nobody bleeding" : "no mend"), nav: "", closer: closerName,
      ready: closerReady, cd: closerIdx >= 0 ? Math.max(0, e.cds[closerIdx]) : 0 };
    let task = "press", point = null, band = band0, gait = 1, why = Q.why;
    const wound = st.wound && hp < 0.55;                  // the berserker closes as it bleeds
    /* A last body standing has no line to fall back into — breaking contact in a 1v1
       is not a tactic, it is a forfeit, and both sides doing it ends a match with two
       people jogging at opposite walls until the floor kills them. Nor do you run
       from somebody who is in worse shape than you are. */
    const lastOne = al.filter((o) => o !== e && !o.dead).length === 0;
    const enemyWorse = focus.hp / focus.max < hp - 0.08;

    /* ---- GROUP DISCIPLINE — what a body can see of the fight beats what the
       scoreboard says. An enemy is lonely when none of its own stand within 165px
       of it: that one is fair game for a single knife. A clump is not, unless this
       body has the numbers standing with it. Bodies that arrive one at a time into
       three is how a team fight is lost — this is the whole difference between
       diving and attacking. */
    const knife = range <= 110 && !st.wound;                     // the contact kits: rush, assassin, skirmish, hunter
    /* A summoned ward is a gun on a timer, not a second knife. Counting it made a
       1v1 against Gate look like a crowd, and the fist spent the fight jogging
       away from a line that was never coming. */
    const realBody = (o) => o.b.cls !== "token";
    const foesNear = en.filter((o) => realBody(o) && dist(e.x, e.y, o.x, o.y) < 210);
    const matesNear = al.filter((o) => o !== e && realBody(o) && dist(e.x, e.y, o.x, o.y) < 210);
    const edgeHere = matesNear.length - foesNear.length;         // >0: we have the numbers here
    /* keep it next to the glass test below; both are read by the knife rules */
    const lonely = en.filter((o) => en.filter((q) => q !== o && dist(q.x, q.y, o.x, o.y) < 165).length === 0)
      .sort((q, r2) => dist(e.x, e.y, q.x, q.y) - dist(e.x, e.y, r2.x, r2.y))[0] || null;
    /* hunt with the pack: an enemy one of ours is already standing on is the one to hit */
    const packPrey = knife ? matesNear.map((m) => en.find((o) => dist(m.x, m.y, o.x, o.y) < 95))
      .filter(Boolean).sort((q, r2) => dist(e.x, e.y, q.x, q.y) - dist(e.x, e.y, r2.x, r2.y))[0] || null : null;
    /* two or more on it, nobody of ours near: a knife in that position left too late
       to matter. It breaks off early instead of at the style's last-third retreat. */
    const swarmed = knife && localE >= 2 && localA === 0 && hp < 0.72;
    /* a glass knife — the wolf, the imp, the thief — reads its own body against the
       line's. It has the health for one exchange, so it only takes fights it has the
       numbers for, and it steps out sooner than the heavy contact kits do. */
    const teamMax = al.reduce((s, o) => s + o.max, 0) / (al.length || 1);
    const glass = knife && e.max < teamMax * 0.82;

    const hurt = (hp < (wound ? 0.2 : st.retreat) || swarmed) && !lastOne && !enemyWorse && localE > localA + 0.5;
    /* the knives choose differently: pile on what a mate is already fighting, or take
       the one that wandered off, or trail the squad call — never stroll into the knot */
    if (knife && !hurt) {
      if (packPrey && dist(e.x, e.y, packPrey.x, packPrey.y) < 340) target = packPrey;
      else if (lonely && (matesNear.length === 0 || edgeHere < 0)) target = lonely;
    }
    /* A ward is a gun on a timer. It must not be the body a fist runs off to
       follow while the team is still called onto a real fighter. The summon
       stays the target only when it is already in the swing and the called
       body is not. */
    if (target && target.b && target.b.cls === "token" && focus && focus !== target && focus.b && focus.b.cls !== "token") {
      const dTok = dist(e.x, e.y, target.x, target.y);
      const dReal = dist(e.x, e.y, focus.x, focus.y);
      if (!(dTok < (range || 40) + 24 && dReal > dTok + 80)) target = focus;
    }
    const dTargetNow = dist(e.x, e.y, target.x, target.y);

    /* — 1. AID: somebody in this team is bleeding and I am the one who can mend.
           A body with a heal does not stand in the front rank while a friend dies. */
    if (patient && !hurt && (st.aid || isSupport(b))) {
      target = focus; task = "aid";
      const dP = dist(e.x, e.y, patient.x, patient.y);
      const m = healMove(b);
      const reach = m ? (m.range || 6) * TILE : 170;
      band = Math.min(reach * 0.8, 220);
      /* stand between the patient and the enemy, so the mending happens out of the line of fire */
      const ax = patient.x - e.x, ay = patient.y - e.y;
      const m2 = Math.hypot(ax, ay) || 1;
      const ux = (patient.x - Q.ecx) / (dist(patient.x, patient.y, Q.ecx, Q.ecy) || 1);
      const uy = (patient.y - Q.ecy) / (dist(patient.x, patient.y, Q.ecx, Q.ecy) || 1);
      point = dP > band ? { x: patient.x + ux * band * 0.55, y: patient.y + uy * band * 0.55 } : null;
      gait = dP > band ? 1 : 0;
      why = "mending " + patient.b.name;
      e.planPatient = patient;
      if (!point && m && e.cds[b.moves.indexOf(m)] <= 0) e.task = "aid";
      return set(e, { task, target, point, band, gait, why, patient }, S);
    }

    /* — 2. BREAK CONTACT: outnumbered and nearly gone is not a fight, it is a gift. */
    /* — THE QUIET ARENA. If no blow has landed on anybody for twelve seconds, the plan
       being followed is wrong, whoever is following it. Measured: about one battle in
       ninety ends at the sim cap with NO damage dealt by either side and nobody down --
       two lines holding their bands, each waiting on the other, forever. Withdrawing,
       leashing and holding are each a reasonable order, and the sum of them is a fight
       that never happens. Every rule below this one loses to it. */
    if ((S.time || 0) - (S.lastBloodAt || 0) > 12) {
      task = "advance"; point = null;
      band = Math.max(26, range * 0.5); gait = 1;
      why = "the arena has gone quiet — in";
      return set(e, { task, target, point, band, gait, why }, S);
    }
    if (hurt && (localE >= 1 || hp < st.retreat * 0.5)) {
      const R = Q.rally || { x: Q.cx, y: Q.cy };
      /* the nearest cover on the way home, so it does not retreat across open sand */
      let bestC = null, bestS = -1e9;
      for (let a = -Math.PI; a < Math.PI; a += 0.5) {
        const px = e.x + Math.cos(a) * 110, py = e.y + Math.sin(a) * 110;
        if (stone(S, px, py)) continue;
        const away = dist(px, py, Q.ecx, Q.ecy);
        const home = dist(px, py, R.x, R.y);
        const sc = coverAt(S, px, py, Q.ecx, Q.ecy) * 40 + away * 0.22 - home * 0.30;
        if (sc > bestS) { bestS = sc; bestC = { x: px, y: py }; }
      }
      task = "withdraw"; target = focus; gait = 1; band = 0;
      point = bestC || R;
      why = "breaking contact";
      return set(e, { task, target, point, band, gait, why }, S);
    }

    /* — 2b. WORK THE EDGE: a knife standing in the middle of the pack is a knife on a
           cooldown with three bodies hitting it. Dart in, then break back out to the
           edge of its own reach and come again — that rhythm, not the longest walk in,
           is what keeps a contact kit alive in a group fight. */
    if (knife && !hurt && !e.stepOutT && hp < (glass ? 0.92 : 0.86) &&
        foesNear.filter((o) => dist(e.x, e.y, o.x, o.y) < range + 26 + (glass ? 20 : 0)).length >= 2) {
      const n0 = foesNear.reduce((a, o) => (dist(e.x, e.y, o.x, o.y) < dist(e.x, e.y, a.x, a.y) ? o : a));
      const away = dist(e.x, e.y, n0.x, n0.y) || 1;
      const step = { x: n0.x + ((e.x - n0.x) / away) * (range + 34), y: n0.y + ((e.y - n0.y) / away) * (range + 34) };
      e.stepOutT = 1.3;
      task = "hold";
      point = stone(S, step.x, step.y) ? { x: Q.cx, y: Q.cy } : step;
      band = band0;
      gait = 1;
      why = "stepping out of the pack";
      return set(e, { task, target, point, band, gait, why }, S);
    }

    /* — 3. SCREEN: stand between the enemy and whoever cannot take the hit. */
    if (st.screen) {
      /* A summoned ward is a gun he placed. Standing in front of it is how Gate
         leaves the body he was hitting and spends the rest of the fight walking
         back to his own door. */
      const ward = al.filter((o) => o !== e && o.b.range > 160 && o.hp > 0 && o.b.cls !== "token")
        .sort((a, c) => a.hp / a.max - c.hp / c.max)[0];
      if (ward) {
        const dW = dist(ward.x, ward.y, Q.ecx, Q.ecy);
        const dM = dist(e.x, e.y, Q.ecx, Q.ecy);
        if (dW < dM - 10 || dW < 220) {
          const t = { x: ward.x + (Q.ecx - ward.x) * 0.30, y: ward.y + (Q.ecy - ward.y) * 0.30 };
          task = "screen"; target = focus; point = t; gait = 1;
          band = Math.max(30, range * 0.6);
          why = "screening " + ward.b.name;
          return set(e, { task, target, point, band, gait, why }, S);
        }
      }
    }

    /* — 3c. DO NOT FEED THE CLUMP: a knife with nobody standing with it does not walk
           into two or more bodies. It circles at the edge of its own reach until the
           line arrives or one of them steps out alone. A body shoving at the pack
           alone is not pressure, it is a free kill with a cooldown on it. */
    if (knife && !hurt && dTargetNow < 420 &&
        ((matesNear.length === 0 && foesNear.length >= 2) || edgeHere <= -2 || (glass && edgeHere < 0))) {
      /* The edge of reach is where the swing still lands. The old rim was a flat
         42px past the band, which for a short fist sits outside the hit, so the
         body stood there weaving and never swung. Anchor on the nearest body,
         not the middle of the pack — a spread clump was sending the fist across
         the ring to "wait". */
      const nearFoe = foesNear.reduce((a, o) => (dist(e.x, e.y, o.x, o.y) < dist(e.x, e.y, a.x, a.y) ? o : a));
      const away = dist(e.x, e.y, nearFoe.x, nearFoe.y) || 1;
      const ux = (e.x - nearFoe.x) / away, uy = (e.y - nearFoe.y) / away;
      const holdAt = (range || 40) + 8;
      const rim = { x: nearFoe.x + ux * holdAt, y: nearFoe.y + uy * holdAt };
      task = "hold";
      point = stone(S, rim.x, rim.y) ? { x: Q.cx, y: Q.cy } : rim;
      band = band0;
      gait = 1;
      why = "waiting for the line";
      return set(e, { task, target, point, band, gait, why }, S);
    }

    /* — 4. FLANK: do not walk into the same doorway as everybody else. */
    /* A lone body has nobody to arrive beside. Circling the only enemy is a walk, not a flank. */
    if (st.flank && dFocus > 150 && !lastOne) {
      const myBearing = Math.atan2(focus.y - e.y, focus.x - e.x);
      const off = Math.abs(((myBearing - Q.axis + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (off < 0.7) {
        const side = ((e.seq || 0) % 2) ? 1 : -1;
        const fa = Q.axis + side * 1.15;
        const behind = { x: focus.x - Math.cos(Q.axis) * 150, y: focus.y - Math.sin(Q.axis) * 150 };
        const arc = { x: behind.x + Math.cos(fa) * 170, y: behind.y + Math.sin(fa) * 170 };
        task = "flank";
        point = arc;
        gait = 1;
        band = band0;
        why = "taking the long way round";
        return set(e, { task, target, point, band, gait, why }, S);
      }
    }

    /* — 4b. NOBODY IS DYING: a body that has not landed a hit in six seconds stops
           holding its range and walks in. Two teams that both like their range will
           otherwise stand at their bands, behind cover, until the floor decides the
           match for them — a standoff is the one result nobody in the arena wants. */
    if (e.idleT > 6 && !hurt && dFocus > 90) {
      task = "advance"; point = null;
      band = Math.max(45, band0 * 0.45); gait = 1;
      why = "nothing landing — closing";
      return set(e, { task, target, point, band, gait, why }, S);
    }

    /* A gun with a fist inside its pocket steps straight back to the range it
       shoots from. Strafing that pocket draws a circle and the arrows miss. */
    if (range > 130 && target && (target.b.range || 40) <= 110 && dTargetNow < band0 * 0.78) {
      const away = dTargetNow || 1;
      const step = Math.min(100, Math.max(52, band0 * 0.78 - dTargetNow + 28));
      task = "bait";
      point = {
        x: e.x + ((e.x - target.x) / away) * step,
        y: e.y + ((e.y - target.y) / away) * step
      };
      gait = 1;
      band = band0;
      why = "keeping the shot";
      return set(e, { task, target, point, band, gait, why }, S);
    }

    /* — 4b. THE CONTACT KIT'S RHYTHM — back out, then burst. A body with a fist cannot
           trade with a body that reaches eight tiles: walking at it is how it dies with
           its health still on it, and the duel report has said so in numbers for weeks
           (contact kits win a third of these and spend the walk doing it). The rhythm is
           the one every arena game uses: while the closer is DOWN, stand outside the
           enemy's reach rather than inside your own, and let IT come to you -- and the
           moment the closer is UP, burn in and use the whole kit at once. Walking is not
           the approach; the cooldown is. */
    if (knife && target && closerIdx >= 0 && hp > st.retreat) {
      const out = (target.b.range || 40) > range + 60 && dTargetNow > range + 26;
      /* The wait is the last few seconds before the closer comes up, NOT the whole
         cooldown. Backing off the moment the dash goes on cooldown left a measured 1293
         seconds of "waiting on..." against 22 seconds of bursting -- a body that resets
         for fifteen seconds is not setting up a burst, it is watching. You only need to
         be out of the firing line when the burst is about to happen. */
      const closerIn = closerIdx >= 0 ? Math.max(0, e.cds[closerIdx]) : 0;
      if (out && !closerReady && closerIn <= 2.5) {
        const away = dTargetNow || 1;
        const keep = (target.b.range || 40) + 34;
        const step = Math.min(96, Math.max(26, keep - dTargetNow + 40));
        const back = { x: e.x + ((e.x - target.x) / away) * step, y: e.y + ((e.y - target.y) / away) * step };
        task = "withdraw";
        point = stone(S, back.x, back.y) ? null : back;
        band = 0; gait = 1;
        why = "waiting on " + closerName;
        return set(e, { task, target, point, band, gait, why }, S);
      }
      if (out && closerReady) {
        task = "advance";
        point = null;
        band = range * 0.8;
        gait = 1;
        why = closerName + " up — burning in";
        return set(e, { task, target, point, band, gait, why }, S);
      }
    }

    /* — 5. THE LINE: holding is a decision, and it is usually the right one for a
           body whose job is to be in the way. Front rank holds; the ones behind
           hold at band and shoot. Bounding: a pair takes turns. */
    const inBand = dFocus <= band + 18;
    const pinned = near.filter((o) => dist(e.x, e.y, o.x, o.y) < 60).length;
    if (inBand && !pinned) {
      const cover = coverAt(S, e.x, e.y, focus.x, focus.y);
      /* step to cover if the tile next door is better and the enemy has the line */
      let bestC = null, bestS = 0;
      for (let a = 0; a < Math.PI * 2; a += 0.7) {
        const px = e.x + Math.cos(a) * 34, py = e.y + Math.sin(a) * 34;
        if (stone(S, px, py)) continue;
        const sc = coverAt(S, px, py, focus.x, focus.y) * 3 + pinch(S, px, py) * 0.6;
        if (sc > bestS && sc > cover * 3) { bestS = sc; bestC = { x: px, y: py }; }
      }
      const shooting = !!shooters.length;
      if (bestC && shooting && range > 100) {
        task = "overwatch"; point = bestC; gait = 1; band = band0;
        why = "into cover";
      } else {
        task = "hold"; point = null; gait = 0; band = band0;
        why = Q.back && e.b.range > 160 ? "standing off" : "holding the line";
      }
      /* a kiter being closed on steps back — in bursts, not forever */
      if (st.panic && dFocus < st.panic && !e.braveT) {
        e.braveT = st.brave;
        task = "bait"; point = { x: e.x + (e.x - focus.x) * 0.6, y: e.y + (e.y - focus.y) * 0.6 };
        gait = 1; why = "giving ground";
      }
      return set(e, { task, target, point, band, gait, why }, S);
    }

    /* — 6. RALLY: the team is losing the ground it is standing on. Fall back
           together, do not die apart. */
    if (localE > localA + 0.5 && Q.tilt < 0 && hp < 0.62 && dFocus < 260 && !(e.rallyCd > 0)) {
      const R = Q.rally || { x: Q.cx, y: Q.cy };
      if (dist(e.x, e.y, R.x, R.y) > 60) {
        task = "rally"; gait = 0.9; band = 0;
        /* it takes a few seconds to reform — without that the line walks back and
           forth between "regroup" and "press" for the whole match */
        e.rallyCd = 6;
        point = { x: R.x, y: R.y };
        why = "regrouping";
        return set(e, { task, target, point, band, gait, why }, S);
      }
    }

    /* — 7. CHOKE: if this body's job is to be in the way, the doorway is better
           ground than the open. Only when the team is not the one pushing. */
    if ((st.leash || st.screen) && Q.n <= Q.en && dFocus < 420) {
      let bestC = null, bestS = 0;
      for (let a = 0; a < Math.PI * 2; a += 0.6) {
        for (let r = 40; r <= 120; r += 40) {
          const px = e.x + Math.cos(a) * r, py = e.y + Math.sin(a) * r;
          if (stone(S, px, py)) continue;
          const sc = pinch(S, px, py) * 2.2 - dist(px, py, Q.cx, Q.cy) * 0.004 - dist(px, py, focus.x, focus.y) * 0.004;
          if (sc > bestS && sc > 3.4) { bestS = sc; bestC = { x: px, y: py }; }
        }
      }
      if (bestC) {
        task = "choke"; point = bestC; gait = 1; band = band0;
        why = "holding the gap";
        return set(e, { task, target, point, band, gait, why }, S);
      }
    }

    /* — 8. PRESS: default. Close on the called target to your own band. A body
           that has not landed anything in a while stops being clever and commits. */
    const dTarget = dist(e.x, e.y, focus.x, focus.y);
    const stray = st.leash ? dist(e.x, e.y, Q.cx, Q.cy) : 0;
    if (st.leash && stray > st.leash && hp > 0.35) {
      /* leashed kits do not get dragged off their own line: run back to the rim of
         it, not to the middle of it (everybody walking to the centroid is a scrum) */
      /* back toward the line, never further toward the wall the body is already on */
      const ux = (Q.cx - e.x) / (stray || 1), uy = (Q.cy - e.y) / (stray || 1);
      const back = Math.max(0, stray - st.leash * 0.85);
      task = "hold"; point = { x: e.x + ux * back, y: e.y + uy * back };
      gait = 1; band = band0; why = "back on the line";
      return set(e, { task, target, point, band, gait, why }, S);
    }
    task = e.idleT > 4 ? "press" : (dTarget > band * 1.6 ? "advance" : "press");
    point = null;
    gait = 1;
    band = band0;
    why = task === "advance" ? "closing on " + focus.b.name : "on " + focus.b.name;
    return set(e, { task, target, point, band, gait, why }, S);
  }

  /* store the plan, count it (the check tool reads these), and hand it back */
  function set(e, plan, S) {
    /* every tactic names a point in a zone. Settle is the one gate: defensive
       tasks stay in our third, offensive tasks stay in mid or theirs, and no
       point is allowed to sit on the border or in a corner. */
    if (S && S.lv) {
      const Q = SQ[e.team] || blank();
      const role = zoneRole(plan.task);
      if (plan.point) plan.point = settle(S, Q, plan.point, role);
      const tg = plan.target;
      const melee = tg && !tg.dead && dist(e.x, e.y, tg.x, tg.y) < 78;
      /* A gun backing off a fist is allowed to use the rim. Pulling it
         back to centre is what turns the kite into a lap of the arena. */
      const gunBait = plan.task === "bait" && tg && (tg.b.range || 40) <= 110 && (e.b.range || 40) > 130;
      if (!melee && !gunBait && rimPush(S, e.x, e.y) > 8) {
        plan.point = repairPoint(S, Q, e, role);
        plan.task = "repair";
        plan.gait = 1;
        plan.band = 0;
        plan.why = "off the edge";
      }
    }
    plan.t = plan.task;
    e.task = plan.task;
    /* The axes a spectator can actually see, sampled as the plan is made, so the
       check tool can prove a style fights the way its name says instead of trusting
       the table. This is measurement, not behaviour — nothing below changes a fight. */
    if (!e.smp) e.smp = { n: 0, engage: 0, close: 0, far: 0, pick: 0, weak: 0, onFocus: 0, melee: 0 };
    const sp = e.smp, tg = plan.target;
    if (tg && !tg.dead) {
      sp.n++;
      const dd = dist(e.x, e.y, tg.x, tg.y);
      sp.engage += dd;
      if (dd <= 62) sp.close++; else if (dd > 150) sp.far++;
      /* WHAT THE DOCTRINE ASKED FOR, AGAINST WHAT HAPPENED. Every style is written in
         fractions of its own reach -- a kite that wants 100% of 224px and a berserker
         that wants 94% of 40px are asking for the same shape of fight at completely
         different distances. The two counters above are absolute (62px, 150px), which
         means they measure the kit's REACH and call it its style: a gun is scored as
         "backing off" for standing where its doctrine told it to stand. These keep the
         ratio instead, so the check tool can ask the only question that matters --
         did this body stand where its doctrine said, and how far off was it. */
      const reach = Math.max(40, (e.b && e.b.range) || 40);
      const want = e.bandNow || Math.max(28, reach * 0.9);
      sp.reach = (sp.reach || 0) + reach;
      sp.want = (sp.want || 0) + want;
      sp.offBand = (sp.offBand || 0) + Math.abs(dd - want) / reach;
      if (Math.abs(dd - want) <= Math.max(30, want * 0.3)) sp.atBand = (sp.atBand || 0) + 1;
      sp.pick++;
      const en = live(e.team === 0 ? S.foe : S.your);
      if (en.length) {
        const wk = en.reduce((a, c) => (c.hp / c.max < a.hp / a.max ? c : a));
        if (tg === wk) sp.weak++;
      }
      if (SQ[e.team] && SQ[e.team].focus && tg === SQ[e.team].focus) sp.onFocus++;
    }
    e.taskWhy = plan.why || "";
    if (!e.tk) e.tk = {};
    if (e.tkT !== plan.task) {
      e.tk[plan.task] = (e.tk[plan.task] || 0) + 1;
      /* how long this body has been doing this one thing — the check tool uses it
         to tell a body that is working from one that is stuck on a task */
      e.taskRun = 0;
      e.tkT = plan.task;
    }
    e.plan = plan;
    return plan;
  }

  /* =============== THE THREE HEMISPHERES ==========================================
     A body used to be one brain working out where to go, who to hit and whether to
     mend, all in a single chain of rules -- and every rule had to know about the other
     two, which is why a wounded mender could walk into a gun it had already decided to
     avoid. It is now a crew, the way a tank is a crew:

       GUN   who am I attacking, and am I allowed to shoot yet (the cooldown)
       MED   do I mend myself, run and mend, or stand a shield over somebody
       NAV   where do I stand while the other two are doing that, and why

     Each one answers its own question from the same picture of the fight, and none of
     them waits on another. NAV is the one that gets the last word on FEET -- a body has
     one pair of legs -- but GUN's target and MED's patient are decided before it runs,
     and a mending body moves to its patient instead of to its target. That is the whole
     difference between "one brain doing three jobs" and three bodies in one hull. */

  /* ---- GUN: the target, and the reason it is that one ---- */
  function hemisphereGun(S, e, st, ctx) {
    const { focus, dFocus } = ctx;
    const pref = preferTarget(S, e, st);
    let target = focus;
    let why = "the team's call";
    /* this guard is load-bearing and was nearly lost in the move: an "attack" style does
       not go looking for a private target, it fights the team's call. Dropping it let the
       chargers pick their own, and the knives stopped standing out from them. */
    if (st.prefer && st.prefer !== "attack" && pref && pref !== focus) {
      const dPref = dist(e.x, e.y, pref.x, pref.y);
      /* a knife that hunts the hurt goes further out of its way than the line does: that is
         the whole job, and only the flanking styles can afford the walk. */
      const reach = st.prefer === "weakest" ? Math.max(dFocus + 210, 420) : Math.max(dFocus + 130, 320);
      if (dPref < reach) { target = pref; why = st.prefer; }
    }
    /* The plan is rebuilt every 0.18s, and a preference that sits on the edge of its reach makes
       it alternate between the body the style wants and the squad's focus: the target changes
       1.9 times a second and the body turns on the spot. The damper is one-sided. A target the
       style asked for always lands -- that is doctrine, and the knives live on it. What is
       refused is the *focus* taking a target back off a body that had a reason for its own:
       it keeps what it holds unless the focus is a clear improvement. */
    const prevT = e.plan && e.plan.target;
    if (prevT && !prevT.dead && prevT !== target && target !== pref) {
      const dPrev = dist(e.x, e.y, prevT.x, prevT.y), dNew = dist(e.x, e.y, target.x, target.y);
      if (!(dNew < dPrev * 0.75 || dNew < dPrev - 60)) target = prevT;
    }
    return { target: target, why: why };
  }

  /* ---- MED: mend, run and mend, or shield ---- */
  function hemisphereMed(S, e, st, b, ctx) {
    const { al, healer } = ctx;
    const aidIdx = b.moves.findIndex((mv) => mv && (mv.shape === "mend" || mv.heal));
    const ready = aidIdx >= 0 && e.cds[aidIdx] <= 0;
    const patient = healer ? al.filter((o) => o !== e && o.hp / o.max < (st.aid || 0.78))
      .sort((a, c) => a.hp / a.max - c.hp / c.max)[0] : null;
    return { patient: patient, ready: ready, aidIdx: aidIdx, why: patient ? "mending " + patient.b.name : "" };
  }

  /* how long the current task has been running (bodies call this every frame) */
  function age(e, dt) {
    e.taskRun = (e.taskRun || 0) + dt;
    if (e.tgtHold > 0) e.tgtHold -= dt;
    if (e.rallyCd > 0) e.rallyCd -= dt;
    /* where this body actually stood. The check reads rim against the fight,
       not a single stuck frame. */
    if (!CUR || !CUR.lv || e.dead) return;
    if (!e.smp) e.smp = { n: 0, engage: 0, close: 0, far: 0, pick: 0, weak: 0, onFocus: 0, melee: 0 };
    const sp = e.smp;
    sp.pos = (sp.pos || 0) + 1;
    if (rimPush(CUR, e.x, e.y) > 8) sp.rim = (sp.rim || 0) + 1;
    const z = zoneAt(CUR, SQ[e.team], e.x);
    if (z === "def") sp.zDef = (sp.zDef || 0) + 1;
    else if (z === "off") sp.zOff = (sp.zOff || 0) + 1;
    else sp.zMid = (sp.zMid || 0) + 1;
  }

  /* which enemy a style would rather have, given the squad's call */
  function preferTarget(S, e, st) {
    const Q = SQ[e.team] || blank();
    const en = enemies(S, e);
    if (!en.length) return null;
    switch (st.prefer) {
      case "weakest": return en.reduce((a, b) => (b.hp / b.max < a.hp / a.max ? b : a));
      case "clump": {
        let best = null, bestS = -1;
        en.forEach((c) => {
          let n = 0;
          en.forEach((o) => { if (dist(o.x, o.y, c.x, c.y) < 120) n++; });
          const sc = n * 100 - dist(e.x, e.y, c.x, c.y) * 0.2;
          if (sc > bestS) { bestS = sc; best = c; }
        });
        return best;
      }
      case "protect": {
        const w = Q.wounded;
        if (w && w.team !== e.team) return w;
        return en.reduce((a, b) => (dist(b.x, b.y, Q.ecx, Q.ecy) < dist(a.x, a.y, Q.ecx, Q.ecy) ? b : a));
      }
      case "nearest": return en.reduce((a, b) => (dist(e.x, e.y, b.x, b.y) < dist(e.x, e.y, a.x, a.y) ? b : a));
      default: {
        /* attack: the squad's call if it is reachable, else the closest thing */
        if (Q.focus && !Q.focus.dead) return Q.focus;
        return en.reduce((a, b) => (dist(e.x, e.y, b.x, b.y) < dist(e.x, e.y, a.x, a.y) ? b : a));
      }
    }
  }

  w.LYGO_BRAIN = {
    STYLES: STYLES,
    styleOf: styleOf,
    tick: tick,
    plan: plan,
    age: age,
    preferTarget: preferTarget,
    squad: (team) => SQ[team],
    isSupport: isSupport,
    /* the check tool's windows */
    styles: () => Object.keys(STYLES),
    tasks: () => ["advance", "press", "flank", "hold", "choke", "screen", "aid", "rally", "withdraw", "overwatch", "bait", "repair"],
    help: () => ({ styles: Object.keys(STYLES).length })
  };
})(window);
