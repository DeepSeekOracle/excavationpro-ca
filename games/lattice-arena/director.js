/* LYGO Arena — the director.
   One microphone, one mouth at a time. The engine offers lines; this file decides whether a line
   is said at all, when it is said, and how long the floor is held.

   An announcer who talks over the fighters is not an announcer, it is noise. So every line has to
   earn the floor:

     * the floor is held for as long as the line takes to say, and the voice releases it -- if the
       voice runs long, the floor runs long with it and nothing else starts early
     * a beat of silence follows every line before the next may take the floor
     * the bell is a wall: when it is said the room goes quiet behind it for three to five seconds
     * a body cannot talk twice inside its own cooldown, and neither can the booth
     * the booth calls the fight and the bodies answer it: after one side has spoken, the other
       gets the next line if it has anything worth saying. Two monologues is not a bout
     * the room has a budget -- nine lines in twenty-four seconds, four in ten -- and a line that
       waits too long for its turn is dropped rather than said late about an old moment

   The clock and the voice are injected. That is what makes this testable: the harness runs the
   whole thing on a fake clock with a stub voice and then asserts the timeline it produced. */
(function (w) {
  "use strict";

  /* What a line is worth. A bell outranks everything; a body taking a hit outranks nothing.
     Anything at PRIO_URGENT or better ignores the cooldowns and the budget -- a wipe may not wait. */
  var PRIO = {
    die: 2, hurt: 2, lose: 2, miss: 2,
    taunt: 3, cc: 3, block: 3, crit: 3, hold: 3, ready: 4, cleanse: 4, tide: 4,
    save: 5, edge: 6, law: 6, rise: 6,
    kill: 7, draw: 7, recall: 7, ace: 8, mapEnd: 8, win: 8, wipe: 8, firstBlood: 8, sudden: 8,
    matchEnd: 9, intro: 9, bell: 10
  };
  var PRIO_DEFAULT = 3;
  var PRIO_URGENT = 8;

  function create(opts) {
    opts = opts || {};
    var now = opts.now || function () { return Date.now() / 1000; };
    /* say(line, done) — the caller speaks it and calls done(seconds) when the voice stops. A
       caller with no voice (voices off) still calls done, which keeps the floor honest. */
    var say = opts.say || function (line, done) { done(0); };
    var cancelVoice = opts.cancel || function () {};
    var cfg = {
      gap: 1.15,          /* a beat between lines, unless the next one is urgent */
      gapUrgent: 0.5,     /* how fast the bell may follow the line before it */
      fighterCd: 6.0,     /* a body does not speak twice inside this */
      casterCd: 3.4,      /* and neither does the booth */
      budgetWin: 24, budgetMax: 9,
      burstWin: 10, burstMax: 4,
      queueMax: 6,
      stale: 2.6,         /* a line about a moment that has passed is not worth saying late */
      staleBig: 4.7,
      staleUrgent: 5.7,
      minDur: 1.0, maxDur: 6.5,
      cps: 13.4,          /* characters per second at rate 1 -- what the floor is held for */
      quietLo: 3.2, quietHi: 5.0
    };
    for (var k in opts) if (opts.hasOwnProperty(k) && cfg[k] != null) cfg[k] = opts[k];

    var seq = 0, queue = [], current = null, log = [], spoken = [];
    var lastEndAt = -99, quietUntil = -99, lastAt = {}, lastCastAt = -99, forceAt = 0, lastWasCaster = null;
    var dropped = { stale: 0, cool: 0, budget: 0, queue: 0, dupe: 0, cut: 0 };
    var d = {};

    /* How long a line takes to say. The announcer reads a programme faster than he chats. */
    function est(text, rate) {
      var r = rate || 1;
      var s = 0.5 + String(text || "").length / (cfg.cps * r);
      return Math.max(cfg.minDur, Math.min(cfg.maxDur, s));
    }

    function inWindow(win) {
      var t = now(), n = 0;
      for (var i = 0; i < spoken.length; i++) if (t - spoken[i] < win) n++;
      return n;
    }
    function overBudget(prio) {
      if (prio >= PRIO_URGENT) return false;
      return inWindow(cfg.budgetWin) >= cfg.budgetMax || inWindow(cfg.burstWin) >= cfg.burstMax;
    }
    function cooling(c, t) {
      if (c.prio >= PRIO_URGENT) return false;
      if (c.caster) return t - lastCastAt < cfg.casterCd;
      var last = lastAt[c.who];
      return last == null ? false : t - last < cfg.fighterCd;
    }

    /* Offer a line. Nothing is spoken here -- tick() holds the floor. */
    d.push = function (cand) {
      if (!cand || !cand.text) return false;
      var kind = cand.kind || "taunt";
      var who = cand.who || (cand.caster ? "cast" : null);
      var line = {
        seq: ++seq, kind: kind, text: String(cand.text), caster: !!cand.caster,
        who: who, whoName: cand.whoName || "",
        prio: cand.prio != null ? cand.prio : (PRIO[kind] != null ? PRIO[kind] : PRIO_DEFAULT),
        rate: cand.rate || (cand.caster ? 0.99 : 1),
        at: now()
      };
      /* the same speaker saying the same thing twice in a row is a stutter, not a line */
      for (var i = 0; i < queue.length; i++) {
        if (queue[i].who === line.who && queue[i].text === line.text) { dropped.dupe++; return false; }
      }
      if (current && current.who === line.who && current.text === line.text) { dropped.dupe++; return false; }
      if (line.kind === "bell") {
        /* the bell takes the floor the moment it is offered: it is the bell */
        d.preempt(PRIO.bell);
        queue.unshift(line);
      } else {
        queue.push(line);
      }
      while (queue.length > cfg.queueMax) {
        var worst = 0;
        for (var j = 1; j < queue.length; j++) if (queue[j].prio < queue[worst].prio) worst = j;
        if (queue[worst].prio >= PRIO_URGENT) break;
        queue.splice(worst, 1); dropped.queue++;
      }
      return true;
    };

    d.setQuiet = function (sec) {
      quietUntil = Math.max(quietUntil, now() + (sec || 0));
      return Math.max(0, quietUntil - now());
    };
    /* between the bell and the next line there is a hole in the programme: three to five seconds
       of silence so the call lands before anything else is said. */
    d.bellQuiet = function (lo, hi) {
      var a = lo == null ? cfg.quietLo : lo, b = hi == null ? cfg.quietHi : hi;
      return d.setQuiet(a + Math.random() * Math.max(0, b - a));
    };
    d.quietFor = function () { return Math.max(0, quietUntil - now()); };

    /* Take the floor, now: a bell or a wipe is not allowed to sit behind a taunt. */
    d.preempt = function (prio) {
      if (!current || current.prio >= (prio == null ? PRIO_URGENT : prio)) return false;
      var cut = current;
      log.push({ seq: cut.seq, kind: cut.kind, caster: cut.caster, who: cut.who, whoName: cut.whoName,
        text: cut.text, start: cut.startedAt, end: now(), cut: true });
      dropped.cut++;
      cancelVoice();
      current = null;
      lastEndAt = now() - cfg.gapUrgent;              /* the floor is clear for the bell */
      return true;
    };

    /* the voice reports back with how long it really took: it may only make the floor longer */
    d.said = function (actual) {
      if (!current) return;
      var real = Math.max(now() - current.startedAt, actual || 0);
      current.endsAt = Math.max(current.endsAt, current.startedAt + real);
    };
    d.tickRelease = d.said;

    d.onAir = function () { return current; };
    d.holdsFloor = function () { return !!current || now() < quietUntil || now() < lastEndAt + cfg.gap; };
    d.log = function () { return log.slice(); };
    d.queueSize = function () { return queue.length; };
    d.dropped = function () { return dropped; };
    d.stats = function () { return { spoken: log.length, queued: queue.length, dropped: dropped, cfg: cfg }; };
    d.clear = function () {
      if (current) cancelVoice();
      queue.length = 0; current = null; lastEndAt = -99; quietUntil = -99;
      lastAt = {}; lastCastAt = -99; spoken.length = 0; lastWasCaster = null;
    };

    /* One frame of the scheduler. Returns the line it started, if any. */
    d.tick = function () {
      var t = now(), i, c;
      if (current) {
        if (t >= current.endsAt || t > forceAt) {
          var done = current;
          log.push({ seq: done.seq, kind: done.kind, caster: done.caster, who: done.who,
            whoName: done.whoName, text: done.text, start: done.startedAt, end: t, cut: false });
          current = null;
          lastEndAt = t;
          /* the bell is a wall: nothing follows it until the room has had its silence */
          if (done.kind === "bell") d.bellQuiet(cfg.quietLo, cfg.quietHi);
        }
        return null;
      }
      /* the floor is free: is the room ready for the next line? */
      if (t < lastEndAt + cfg.gapUrgent) return null;

      /* A line about something that stopped being true two seconds ago is not worth saying late:
         prune first, then choose. What is merely on cooldown is left alone -- it either gets its
         turn or goes stale on its own. */
      var kept = [];
      for (i = 0; i < queue.length; i++) {
        c = queue[i];
        var life = c.prio >= PRIO_URGENT ? cfg.staleUrgent : (c.prio >= 7 ? cfg.staleBig : cfg.stale);
        if (t - c.at > life) { dropped.stale++; continue; }
        kept.push(c);
      }
      queue = kept;

      var best = -1;
      for (i = 0; i < queue.length; i++) {
        c = queue[i];
        if (cooling(c, t)) continue;
        if (best < 0) best = i;
        else if (c.prio > queue[best].prio) best = i;
        else if (c.prio === queue[best].prio && c.caster && !queue[best].caster) best = i;
      }
      if (best < 0) return null;
      var pick = queue[best];

      /* the booth calls the fight and the bodies answer it */
      if (lastWasCaster != null && pick.caster === lastWasCaster && pick.prio < PRIO_URGENT) {
        var alt = -1;
        for (i = 0; i < queue.length; i++) {
          c = queue[i];
          if (c.caster === lastWasCaster || c.prio < 3 || cooling(c, t)) continue;
          if (alt < 0 || c.prio > queue[alt].prio) alt = i;
        }
        if (alt >= 0) { pick = queue[alt]; best = alt; }
      }

      /* the quiet window holds everything except the bell itself: the bell IS the moment */
      if (t < quietUntil && pick.kind !== "bell") return null;
      /* a normal line still owes the room the full beat */
      if (pick.prio < PRIO_URGENT && t < lastEndAt + cfg.gap) return null;
      if (overBudget(pick.prio)) { dropped.budget++; return null; }

      queue.splice(best, 1);
      var rate = pick.caster ? (pick.kind === "bell" || pick.kind.indexOf("intro") === 0 ? 1.22 : 0.99) : 1;
      var dur = est(pick.text, rate);
      pick.startedAt = t;
      pick.endsAt = t + dur;
      pick.dur = dur;
      pick.rate = rate;
      current = pick;
      forceAt = t + Math.max(cfg.maxDur, dur) + 1.4;      /* a stuck voice must not wedge the booth */
      if (pick.caster) lastCastAt = t; else lastAt[pick.who] = t;
      lastWasCaster = pick.caster;
      spoken.push(t);
      if (spoken.length > 60) spoken.shift();
      var started = pick;
      say(started, function (actual) { if (current === started) d.said(actual); });
      return started;
    };

    return d;
  }

  w.LYGO_DIRECTOR = { create: create, PRIO: PRIO, PRIO_URGENT: PRIO_URGENT };
  if (typeof module !== "undefined" && module.exports) module.exports = w.LYGO_DIRECTOR;
})(typeof window !== "undefined" ? window : this);
