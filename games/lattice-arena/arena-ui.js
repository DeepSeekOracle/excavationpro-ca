/* LYGO Arena — the shell.
   The menu, the draft, the fight HUD and the results board. The engine owns the battle;
   this file owns everything a spectator reads: who is on the floor, who is winning, what
   just happened, and what the champions actually do to each other. */
(function (w) {
  "use strict";
  const R = w.LYGO_ARENA;
  const E = w.ArenaEngine;
  const SAVE = "lygo_lattice_arena_v1";
  const $ = (id) => document.getElementById(id);
  const el = (t, cls, html) => { const e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  const persist = Object.assign(
    { team: ["kael", "vale", "lyra"], mode: 3, speed: 1, wins: 0, losses: 0, filter: "champ", name: "", books: {}, bestStreak: 0, talk: true },
    (() => { try { return JSON.parse(localStorage.getItem(SAVE) || "{}"); } catch (e) { return {}; } })()
  );
  function save() {
    if (!(battleTv && showHold)) persist.team = your.slice();
    const blob = Object.assign({}, persist);
    if (battleTv && showHold) {
      blob.team = showHold.team.slice();
      blob.mode = showHold.mode;
    }
    try { localStorage.setItem(SAVE, JSON.stringify(blob)); } catch (e) {}
  }

  let your = (persist.team || []).filter((id) => R.byId[id]).slice(0, 5);
  let foeIds = [];
  let lastMatch = null;
  let rows = { you: [], foe: [] };
  let feedLen = 0;
  let feedMark = null;
  let talkMark = null;
  let overlayMode = null;
  let gateHeld = false;
  let menuTab = "home";
  let inspectId = "kael";
  let hallRows = [];
  let gauntlet = false;
  let streak = 0;
  let battleTv = false;
  let showHold = null;
  let tvCore = null;
  let tvTimer = 0;
  let radioHold = null;
  let tvPostN = 0;
  const TV_WHEEL = [1, 2, 3, 5];
  let feedLog = 0, shownAir = null;

  /* --------------------------------------------------------------- voices ---
     The caster and the fighters are read out loud by the browser's voices. Joke voices
     (Bells, Zarvox, Bubbles) are skipped. The booth wants a human en-GB male — Google UK
     English Male, Ryan, George, Daniel — and it is not pitched down. "Female" used to match
     the old male test, and Microsoft David used to win, which is the robot at a dropped pitch.
     Each body keeps one voice for the whole match. */
  const VOICE_JUNK = /bells|boing|bubbles|cellos|deranged|good news|bad news|bahh|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|junior|rishi|novelty|robot|synth|effect/i;
  const VOICE_FEMALE = /\bfemale\b|\bzira\b|\bsusan\b|\bhazel\b|\bsonia\b|\blibby\b|\bsamantha\b|\bkaren\b|\bmoira\b|\btessa\b|\bfiona\b|\bava\b|\ballison\b|\bserena\b|\bjenny\b|\baria\b|\bmichelle\b|\bemma\b|\bamy\b|\bjoanna\b/i;
  function voiceName(v) { return (v && v.name) || ""; }
  function voiceUk(v) {
    const name = voiceName(v), lang = ((v && v.lang) || "").toLowerCase();
    return lang.indexOf("en-gb") === 0 || /united kingdom|british|en-gb|\buk\b/i.test(name);
  }
  function voiceMale(v) {
    const name = voiceName(v);
    if (VOICE_FEMALE.test(name)) return false;
    if (/\bmale\b/i.test(name)) return true;
    return /\bryan\b|\bgeorge\b|\bdaniel\b|\bbrian\b|\bthomas\b|\boliver\b|\balfie\b|\bguy\b|\bdavid\b|\bmark\b|\bjames\b|\bchristopher\b|\beric\b|\balex\b/i.test(name);
  }
  function voiceMachine(v) {
    const name = voiceName(v);
    return /\bdavid\b|\bzira\b|\bmark\b|\bhazel\b|desktop|espeak/i.test(name) && !/natural|neural|online/i.test(name);
  }
  function voiceScore(v, caster) {
    const name = voiceName(v);
    if (!name || VOICE_JUNK.test(name)) return -1;
    if (v.lang && !/^en/i.test(v.lang)) return -1;
    let s = 10;
    if (/natural|neural|online|google/i.test(name)) s += 80;
    if (voiceUk(v)) s += 60;
    if (voiceMale(v)) s += 30;
    if (voiceMachine(v)) s -= 70;
    if (caster) {
      if (/natural|neural/i.test(name)) s += 25;
      if (voiceUk(v) && voiceMale(v)) s += 40;
      if (VOICE_FEMALE.test(name)) s -= 40;
      if (/\bdavid\b/i.test(name)) s -= 20;
    }
    return s;
  }
  function pickVoice(list, caster, slot) {
    const ranked = list.slice().sort((a, b) => voiceScore(b, !!caster) - voiceScore(a, !!caster));
    if (!ranked.length) return null;
    if (caster) return ranked[0];
    return ranked[(slot || 0) % ranked.length];
  }
  let hvCache = null;
  function humanVoices() {
    if (hvCache && hvCache.length) return hvCache;
    if (typeof speechSynthesis === "undefined") return [];
    let all = [];
    try { all = speechSynthesis.getVoices() || []; } catch (e) { all = []; }
    if (!all.length) return [];
    const usable = all.filter((v) => !VOICE_JUNK.test(voiceName(v)) && (!v.lang || /^en/i.test(v.lang)));
    hvCache = usable.length ? usable : all.slice();
    return hvCache;
  }
  if (typeof speechSynthesis !== "undefined" && speechSynthesis.addEventListener) {
    speechSynthesis.addEventListener("voiceschanged", () => { hvCache = null; humanVoices(); });
  }
  let talking = 0, micHolder = "";
  /* ---------------------------------------------------------------- the director ---
     One microphone. Everything the ring wants to say is offered to the director, and the
     director decides who actually speaks: the floor is held for as long as the line takes, a
     beat of silence follows it, the bell opens a quiet window of three to five seconds, and the
     budget throws away the rest. Two voices at once is a fight nobody can hear, so the shell
     never speaks on its own -- it only says what the director hands it, and only while it holds
     the floor. */
  const DIR = (w.LYGO_DIRECTOR ? w.LYGO_DIRECTOR.create({
    now: () => performance.now() / 1000,
    say: (line, done) => sayLine(line, done),
    cancel: () => { try { speechSynthesis.cancel(); } catch (e) {} talking = 0; micHolder = ""; }
  }) : null);
  let onAir = null;
  let faceTalking = false;

  /* a read-only view of the talk: what has been said, who holds the floor, what was thrown away.
     The harness drives its own director, but this is how anyone can watch the real timeline. */
  w.ArenaTalk = {
    log: () => (DIR ? DIR.log() : []),
    onAir: () => (DIR ? DIR.onAir() : null),
    stats: () => (DIR ? DIR.stats() : null)
  };
  /* the director's estimate, repeated only for the voices-off path so the timing is identical */
  function durOf(line) { return Math.max(1.0, Math.min(6.5, 0.55 + String(line.text || "").length / 13.4)); }
  /* How a line is said. The director still holds the floor on its own clock. A slower
     voice can only make that hold longer. The booth stays at pitch 1. Bodies keep the
     pitch and pace written for that kit, leaned a little by what just happened. */
  function speakRate(line, prof, machine) {
    const floor = line.rate || (line.caster ? 0.96 : 1);
    const k = line.kind || "";
    if (line.caster) {
      if (k === "bell" || k.indexOf("intro") === 0) return floor;
      if (k === "kill" || k === "firstBlood" || k === "wipe" || k === "sudden" || k === "ace") return Math.min(1.14, floor * 1.06);
      if (k === "save" || k === "edge" || k === "recall" || k === "draw" || k === "law") return Math.max(0.88, floor * 0.94);
      return floor;
    }
    let mul = 1;
    if (k === "die" || k === "hurt" || k === "lose") mul = 0.9;
    else if (k === "kill" || k === "win" || k === "ace" || k === "crit") mul = 1.06;
    else if (k === "taunt" || k === "cc" || k === "miss") mul = 1.04;
    else if (k === "saved" || k === "ready" || k === "rise" || k === "block") mul = 0.96;
    const base = machine ? 1 : (prof.rate || 1);
    return Math.max(0.84, Math.min(1.16, base * mul));
  }

  /* Say one line the director accepted. The floor is held for the whole of it, the feed and the
     bubble are written now, and `done` hands the floor back -- by the voice itself when there is
     one, by the clock when voices are off. */
  function sayLine(line, done) {
    const started = performance.now() / 1000;
    const S = E.state();
    onAir = line;
    if (!line.caster && line.who) {
      /* a bubble over a body lives as long as the voice does, whatever the fight is running at */
      (S.bubbles || []).forEach((b) => {
        if (b.text === line.text && b.who && b.who.b && b.who.b.id === line.who) {
          b.life = Math.max(b.life, (line.dur || durOf(line)) * (S.speed || 1) + 0.5);
        }
      });
    }
    if (line.caster) { casterText(line.text); talkLog.push({ t: S.time, caster: true, text: line.text, kind: line.kind }); }
    else talkLog.push({ t: S.time, caster: false, who: line.whoName || "", text: line.text, kind: line.kind });
    if (talkLog.length > 40) talkLog.shift();
    const finish = () => { const held = performance.now() / 1000 - started; onAir = null; done(held); };
    const hv = humanVoices();
    if (!persist.talk || typeof speechSynthesis === "undefined" || !hv.length) {
      w.setTimeout(finish, (line.dur || durOf(line)) * 1000);
      return;
    }
    const B = w.LYGO_BANTER;
    const prof = (B && B.voiceFor) ? B.voiceFor(line.caster ? "caster" : line.who) : { pitch: 1, rate: 1, slot: 0 };
    const ut = new SpeechSynthesisUtterance(String(line.text).slice(0, 220));
    const chosen = pickVoice(hv, !!line.caster, prof.slot) || hv[0];
    ut.voice = chosen;
    const machine = voiceMachine(chosen);
    ut.lang = line.caster ? "en-GB" : ((chosen && chosen.lang) || "en");
    /* a human voice stays at its own pitch. Dropping the booth to 0.78 is what made David a robot. */
    ut.pitch = line.caster ? 1 : (machine ? Math.max(0.92, Math.min(1.12, prof.pitch)) : prof.pitch);
    ut.rate = speakRate(line, prof, machine);
    ut.volume = volOf("voiceVol", 0.9);
    micHolder = line.caster ? "cast" : "talk";
    ut.onend = ut.onerror = () => { talking = Math.max(0, talking - 1); if (!talking) micHolder = ""; finish(); };
    talking++;
    try { speechSynthesis.speak(ut); } catch (e) { talking = Math.max(0, talking - 1); micHolder = ""; finish(); }
  }
  function hush() {
    if (typeof speechSynthesis !== "undefined") { try { speechSynthesis.cancel(); } catch (e) {} }
    talking = 0; micHolder = ""; onAir = null;
    if (DIR) DIR.clear();
  }
  function paintTalk() {
    document.querySelectorAll("[data-act='talk']").forEach((b) => {
      b.classList.toggle("on", !!persist.talk);
      b.textContent = persist.talk ? "Voices on" : "Voices off";
    });
  }
  let talkSeq = 0, talkLog = [];
  function casterText(text) {
    if (!text) return;
    const box = $("casterSays");
    if (box) { box.textContent = text; box.classList.remove("said"); void box.offsetWidth; box.classList.add("said"); }
  }
  /* every line out of the arena is a real event: the engine names the bodies, this side says
     it, writes it into the feed and gives it a voice */
  /* The engine offers lines; the director decides. Nothing is written to the feed or said out
     loud here -- a line only becomes real when it wins the floor, which is what keeps the feed,
     the bubble and the voice telling the same story. */
  function pumpTalk() {
    const S = E.state();
    const list = S.talk || [];
    for (let i = 0; i < list.length; i++) {
      const x = list[i];
      if (!x || !x.seq || x.seq <= talkSeq) continue;
      talkSeq = x.seq;
      if (!DIR) continue;
      DIR.push({ caster: !!x.caster, who: x.caster ? "cast" : x.who, whoName: x.whoName || "",
        text: x.text, kind: x.kind, prio: x.prio, hot: !!x.hot });
    }
    /* the bell takes the floor the instant it rings: whatever a body was saying, he stops */
    /* The bell takes the floor and opens the silence by itself (director.js): the shell only has
       to notice that the fight has started, so it can move the UI into the live state. */
    if (S.bellAt && S.bellAt !== lastBell && DIR) {
      lastBell = S.bellAt;
    }
    if (DIR) DIR.tick();
  }
  let lastBell = 0, lastQuiet = 0;
  let nextSeed = 0;
  /* A match is a series of maps, not a single fight: three maps at most, and two wins in a
     row closes it early. The player drives it forward one map at a time from the recap. */
  let series = null;

  const MODE_LABEL = { 1: "1v1", 2: "2v2", 3: "3v3", 5: "5v5" };

  /* ------------------------------------------------------------------ sound --- */
  const SFX_NAMES = ["click", "count", "fight", "hit", "big", "cast", "heal", "summon", "kill", "warn", "win", "lose"];
  const SFX_GAIN = { click: 0.35, count: 0.4, hit: 0.32, cast: 0.38, big: 0.5, heal: 0.42, summon: 0.46, kill: 0.5, warn: 0.46, fight: 0.5, win: 0.55, lose: 0.5 };
  let audio = null, sfxBuf = {}, sfxReady = false, sfxGate = 0, lastCount = "", fought = false;
  function sfxOn() { return persist.sfx !== false; }
  function volOf(key, fallback) {
    const n = persist[key];
    return typeof n === "number" ? Math.max(0, Math.min(1, n)) : fallback;
  }
  function ensureAudio() {
    if (!audio) audio = new (w.AudioContext || w.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume().catch(() => {});
    return audio;
  }
  function loadSfx() {
    const ctx = ensureAudio();
    const kit = (w.LYGO_ATTACKS && w.LYGO_ATTACKS.sfxNames()) || [];
    const names = SFX_NAMES.concat(kit.filter((n) => SFX_NAMES.indexOf(n) < 0));
    return Promise.all(names.map((name) => fetch("./assets/sfx/" + name + ".wav")
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => { sfxBuf[name] = decoded; })
      .catch(() => {}))).then(() => { sfxReady = true; });
  }
  function blip(type, gain) {
    if (!sfxOn()) return;
    try {
      const ctx = ensureAudio();
      const buf = sfxBuf[type];
      if (buf) {
        const src = ctx.createBufferSource();
        const g = ctx.createGain();
        src.buffer = buf;
        g.gain.value = (gain || SFX_GAIN[type] || 0.36) * volOf("sfxVol", 0.85);
        src.connect(g); g.connect(ctx.destination);
        src.start();
        return;
      }
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(440, t);
      g.gain.setValueAtTime(0.04, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 0.09);
    } catch (e) {}
  }
  function unseenEvents(events, mark) {
    if (!mark) return events;
    const i = events.indexOf(mark);
    if (i < 0) return events;
    return events.slice(i + 1);
  }
  /* Newest nine by the clock of THIS card. Callers drop the previous card first. */
  function recentFeed(events, talk, n) {
    const evs = events.map((ev) => ({ t: ev.t, kind: ev.kind, text: esc(ev.text), raw: ev.text, caster: null }));
    const tk = talk.map((x) => ({ t: x.t, kind: x.caster ? "cast" : "talk", raw: x.text,
      who: x.who || "", caster: !!x.caster }));
    return evs.concat(tk).sort((p, q) => p.t - q.t).slice(-(n || 9));
  }
  function playEvent(ev) {
    const now = performance.now();
    if (ev.kind === "kill") { blip("kill"); return; }
    if (ev.kind === "gift") { blip("heal"); return; }
    if (ev.kind === "summon") { blip("summon"); return; }
    if (ev.kind === "warn") { blip("warn"); return; }
    if (ev.kind === "move") {
      if (ev.sfx) { blip(ev.sfx, 0.4); return; }
      if (now - sfxGate < 120) return;
      sfxGate = now;
      blip(/falls|cuts down|heavy|slam/i.test(ev.text || "") ? "big" : "cast");
    }
  }

  /* ------------------------------------------------------------ gate/hall --- */
  function gateHold(on, ms) {
    gateHeld = !!on;
    try {
      if (w.LYGO_GATE && w.LYGO_GATE.hold) w.LYGO_GATE.hold(on);
      if (on === false && ms && w.LYGO_GATE.suppress) w.LYGO_GATE.suppress(ms);
    } catch (e) {}
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  function teamKey() { return persist.mode + "|" + your.join(","); }
  function teamNames() { return your.map((id) => (R.byId[id] ? R.byId[id].name : id)); }
  /* The stream PC opts in with ?booth=1 once. Every other viewer stays quiet.
     The post stays on that machine. A miss does not touch the fight. */
  function boothOn() {
    try {
      const q = new URLSearchParams(location.search);
      if (q.get("booth") === "1") localStorage.setItem("lygo_booth", "1");
      if (q.get("booth") === "0") localStorage.removeItem("lygo_booth");
      return localStorage.getItem("lygo_booth") === "1";
    } catch (e) { return false; }
  }
  function tellBooth(kind, side) {
    if (!boothOn()) return;
    const right = foeIds.map((id) => (R.byId[id] ? R.byId[id].name : id));
    const body = JSON.stringify({
      kind: kind, side: side, left: teamNames(), right: right,
      mode: MODE_LABEL[persist.mode] || "", tv: !!battleTv,
      map: series ? series.played : 0
    });
    try {
      fetch("http://127.0.0.1:8791/arena", {
        method: "POST", mode: "cors",
        headers: { "Content-Type": "application/json" }, body: body
      }).catch(function () {});
    } catch (e) {}
  }
  function touchBook(won) {
    persist.books = persist.books || {};
    const key = teamKey();
    const row = persist.books[key] || { wins: 0, losses: 0 };
    row.names = teamNames();
    row.mode = MODE_LABEL[persist.mode];
    if (won) row.wins++;
    else row.losses++;
    persist.books[key] = row;
    return row;
  }
  function bookLines() {
    const books = persist.books || {};
    return Object.keys(books).map((k) => {
      const b = books[k];
      const modeN = k.split("|")[0];
      return {
        name: persist.name || "You",
        wins: b.wins || 0,
        losses: b.losses || 0,
        mode: b.mode || MODE_LABEL[modeN] || modeN,
        team: (b.names || []).join(" · "),
        teamKey: k.split("|")[1] || ""
      };
    }).filter((b) => b.wins || b.losses).sort((a, b) => (b.wins - a.wins) || (a.losses - b.losses));
  }
  function lineupBook() {
    return (persist.books || {})[teamKey()] || { wins: 0, losses: 0 };
  }
  function recordLine(r, local) {
    const team = r.team || "";
    return "<div class='hall-line" + (local ? " local" : "") + "'><b>" + esc(r.name || "Spectator") + "</b>" +
      "<span><span class='wins'>" + (r.wins || 0) + "W</span> / <span class='losses'>" + (r.losses || 0) + "L</span></span>" +
      "<em>" + esc(r.mode || "") + (team ? " · " + esc(team) : "") + "</em></div>";
  }
  function postResult(won, mode, mvp) {
    const name = (persist.name || "").trim().slice(0, 18);
    if (!name) return;
    const book = (persist.books || {})[teamKey()] || { wins: 0, losses: 0 };
    const match = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    try {
      if (w.ArcadeLedger && w.ArcadeLedger.arena) {
        w.ArcadeLedger.arena({
          name: name,
          score: book.wins,
          wins: book.wins,
          losses: book.losses,
          mode: MODE_LABEL[mode],
          team: teamNames().join(" · "),
          teamKey: your.join(","),
          outcome: won ? "win" : "loss",
          mvp: mvp || "",
          match: match,
          date: new Date().toISOString().slice(0, 10)
        });
      }
    } catch (e) {}
  }
  const HALL_FEEDS = [
    "https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins/resolve/main/arcade.json",
    "https://deepseekoracle-lattice-marines-ledger.hf.space/arcade.json",
    "https://deepseekoracle-lattice-marines-ledger.hf.space/arena/ledger.json"
  ];
  function rowsFromHall(data) {
    if (!data) return [];
    if (data.books && data.books["lattice-arena"]) {
      const book = data.books["lattice-arena"];
      return book.rows || book.standings || [];
    }
    if (Array.isArray(data.standings)) return data.standings;
    if (Array.isArray(data.rows)) return data.rows;
    return [];
  }
  async function pullHall() {
    for (let i = 0; i < HALL_FEEDS.length; i++) {
      try {
        const r = await fetch(HALL_FEEDS[i], { cache: "no-store" });
        if (!r.ok) continue;
        const list = rowsFromHall(await r.json());
        if (list && list.length) {
          hallRows = list.slice();
          if (overlayMode === "menu") {
            document.querySelectorAll(".hall-live").forEach((box) => { box.innerHTML = hallBlock(); });
          }
          return;
        }
      } catch (e) {}
    }
  }
  function hallBlock() {
    const pub = hallRows.slice().sort((a, b) => ((b.wins || 0) - (a.wins || 0)) || ((a.losses || 0) - (b.losses || 0)));
    const mine = bookLines();
    let html = "";
    if (pub.length) html += pub.slice(0, 12).map((r) => recordLine(r, false)).join("");
    else html += "<p class='muted'>The public hall is empty. A named finish is the first line.</p>";
    if (persist.tvBest && persist.tvBest.wins) {
      html += recordLine({
        name: "Battle TV",
        wins: persist.tvBest.wins,
        losses: 0,
        mode: "record",
        team: persist.tvBest.team || ""
      }, true);
    }
    if (mine.length) {
      html += "<p class='kicker' style='margin-top:.8rem'>This browser</p>";
      html += mine.slice(0, 8).map((r) => recordLine(r, true)).join("");
    }
    return html;
  }

  /* ---------------------------------------------------------------- menu --- */
  function modeCards() {
    return [1, 2, 3, 5].map((n) => {
      const on = persist.mode === n ? " on" : "";
      return "<button type='button' class='mode-card" + on + "' data-mode='" + n + "'>" +
        "<b>" + MODE_LABEL[n] + "</b><span>" +
        ({ 1: "one on one — the clean read", 2: "pairs, every kit matters", 3: "the classic team fight", 5: "a full roster war" }[n]) +
        "</span></button>";
    }).join("");
  }
  function artSrc(f) {
    return f.portrait ? "./assets/" + f.portrait : E.iconFor(f);
  }
  function stashRadio() {
    const dock = $("radioDock");
    const home = $("battleRadio");
    if (dock && home && dock.parentElement !== home) home.appendChild(dock);
  }
  function placeRadio() {
    const dock = $("radioDock");
    const opt = $("optRadio");
    const team = $("teamRadio");
    const home = $("battleRadio");
    const dest = menuTab === "options" && opt ? opt : menuTab === "team" && team ? team : home;
    if (dock && dest && dock.parentElement !== dest) dest.appendChild(dock);
  }
  /* The title screen has its own theme. The radio waits until team select or the fight. */
  function onStartPage() { return overlayMode === "menu" && menuTab === "home"; }
  function menuSongOn() { return persist.menuSong !== false; }
  function syncMenuSong() {
    const a = $("menuSong");
    if (!a) return;
    a.volume = 0.25;
    if (onStartPage() && menuSongOn()) {
      if (w.LatticeRadio && w.LatticeRadio.playing()) w.LatticeRadio.pause();
      const p = a.play();
      if (p && p.catch) p.catch(function () {});
    } else if (!a.paused) a.pause();
  }
  function paintMenuSong() {
    document.querySelectorAll("[data-act='menuSong']").forEach((b) => {
      b.classList.toggle("on", menuSongOn());
      b.textContent = menuSongOn() ? "Music on" : "Music off";
    });
  }
  function paintSfx() {
    document.querySelectorAll("[data-act='mute']").forEach((b) => {
      b.classList.toggle("on", sfxOn());
      b.textContent = sfxOn() ? "SFX on" : "SFX off";
    });
  }
  function mixRow(key, label, fallback) {
    const v = Math.round(volOf(key, fallback) * 100);
    return "<label class='mix'>" + label + "<input type='range' min='0' max='100' value='" + v + "' data-vol='" + key + "'><b>" + v + "</b></label>";
  }
  function lineupNames() {
    return your.map((id) => (R.byId[id] ? R.byId[id].name : id)).join(", ");
  }
  function rosterButton(f) {
    const on = inspectId === f.id ? " on" : "";
    const picked = your.includes(f.id) ? " picked" : "";
    return "<button type='button' class='rpick" + on + picked + "' data-id='" + f.id + "'>" +
      "<img src='" + artSrc(f) + "' alt=''><span><b>" + esc(f.name) + "</b><u>" + esc(f.tag) + "</u></span></button>";
  }
  function dossierHtml(f) {
    if (!f) return "<p class='muted'>Pick a name from the list.</p>";
    const mates = your.map((id) => R.byId[id]).filter(Boolean);
    const b = R.build(f, mates.length ? mates : [f], null, Math.random);
    const picked = your.includes(f.id);
    const full = !picked && your.length >= persist.mode;
    const stats = [
      ["Health", b.max], ["Damage", Math.round(b.dmg)], ["Attacks", b.rate.toFixed(2) + "/s"],
      ["Speed", f.speed.toFixed(1)], ["Armor", b.armor], ["Range", f.range.toFixed(1)],
      ["Mana", b.manaMax], ["Crit", Math.round(b.crit * 100) + "%"], ["Power", b.power]
    ];
    const moves = (b.moves || []).map((m) => "<li><b>" + esc(m.name) + "</b><span>" + esc(m.text || "") + "</span></li>").join("");
    const cards = (f.cards || []).map((id) => {
      const c = R.CARDS[id];
      if (!c) return "";
      return "<li><b>" + esc(c.name) + "</b><i>" + esc(c.tag) + "</i><span>" + esc(c.text || "") + "</span></li>";
    }).join("");
    const clsName = { champ: "Champion", beast: "Crypt creature", pet: "Beast" }[f.cls] || f.cls;
    return "<article class='dossier'>" +
      "<div class='dossier-hero'>" +
        "<img class='" + (f.portrait ? "" : "spr") + "' src='" + artSrc(f) + "' alt=''>" +
        "<div><p class='kicker'>" + esc(clsName) + "</p><h2>" + esc(f.name) + "</h2>" +
        "<p class='tagline'>" + esc(f.tag) + "</p>" +
        "<p>" + esc(f.bio) + "</p>" +
        "<p class='fcounter'>" + esc(f.counter) + "</p>" +
        (f.atk ? "<p class='muted'>Basic attack: " + esc(f.atk.name) + "</p>" : "") +
        "<button type='button' class='btn gold' data-add='" + f.id + "'" + (full ? " disabled" : "") + ">" +
          (picked ? "Remove from team" : full ? "Team is full" : "Add to team") + "</button></div></div>" +
      "<div class='stat-grid'>" + stats.map(([k, v]) => "<div><b>" + v + "</b><span>" + k + "</span></div>").join("") + "</div>" +
      "<h3>Moves</h3><ul class='kit-list'>" + (moves || "<li><span>No special moves.</span></li>") + "</ul>" +
      "<h3>Cards</h3><ul class='kit-list'>" + (cards || "<li><span>No cards.</span></li>") + "</ul></article>";
  }
  function screenTitle() {
    const line = lineupBook();
    const ready = your.length === persist.mode && !!(persist.name || "").trim();
    /* Why the button will not start a fight, said on the button. A click that does
       nothing is the one thing a player cannot read. */
    const need = persist.mode - your.length;
    const hold = need > 0 ? MODE_LABEL[persist.mode] + " needs " + persist.mode + " kits — you have " + your.length
      : need < 0 ? MODE_LABEL[persist.mode] + " takes " + persist.mode + " — you have " + your.length
      : (!(persist.name || "").trim() ? "put your name in to start" : "");
    const names = lineupNames() || "no one fielded";
    /* The menu film is 6.9 MB. A phone on a metered connection should get the
       poster still, not the loop: same first frame, one file instead of two. */
    const conn = navigator.connection || {};
    const wantFilm = !!(window.matchMedia && window.matchMedia("(min-width: 900px)").matches)
      && !conn.saveData && !/^(slow-)?2g$/.test(conn.effectiveType || "");
    return "<div class='title-screen'>" +
      "<div class='title-art'><img src='./assets/menu.jpg' alt='Four fighters at a cyan lattice gate in a torchlit stone crypt' width='1280' height='720'>" +
        (wantFilm ? "<video class='menu-film' src='./assets/menu-live.mp4' poster='./assets/menu.jpg' muted loop autoplay playsinline></video>" : "") +
        "<canvas class='menu-live' aria-hidden='true'></canvas></div>" +
      "<div class='title-panel'>" +
        "<p class='kicker'>Δ9Φ963 · Excavationpro</p><h1>LYGO Arena</h1>" +
        "<p class='lede'>Two AI teams. One stone ring. Name yourself, build a team, then watch them fight.</p>" +
        "<button type='button' class='btn ghost" + (menuSongOn() ? " on" : "") + "' data-act='menuSong' aria-pressed='" + (menuSongOn() ? "true" : "false") + "' title='Menu music'>" + (menuSongOn() ? "Music on" : "Music off") + "</button>" +
        "<label class='name-block'>Your name<input class='callsign' id='callSign' maxlength='18' value='" + esc(persist.name || "") + "' placeholder='What should the hall call you?' autocomplete='nickname'></label>" +
        "<div class='menu-actions'>" +
          "<button type='button' class='btn gold' id='btnFight' data-ready='" + (ready ? "1" : "0") + "'><b>Fight</b><span>" + (hold ? esc(hold) : MODE_LABEL[persist.mode] + " · " + esc(names)) + "</span></button>" +
          "<button type='button' class='btn tv' id='btnBattleTv'><b>BATTLE TV</b><span>One click. Endless card. The winner stays. Best reign " + ((persist.tvBest && persist.tvBest.wins) || 0) + ".</span></button>" +
          "<a class='btn unity' href='https://deepseekoracle.github.io/battle-tv-unity/'><b>BATTLE TV UNITY</b><span>Opens the side-view intro. Vale and Brute, both on their own.</span></a>" +
          "<button type='button' class='btn' id='btnGauntlet'><b>Gauntlet</b><span>Same team. A new ring after every win. Best streak " + (persist.bestStreak || 0) + ".</span></button>" +
          "<button type='button' class='btn' data-tab='team'><b>Team select</b><span>" + your.length + "/" + persist.mode + " picked · read a kit before you field it</span></button>" +
          "<button type='button' class='btn' data-tab='options'><b>Options</b><span>Announcer, fight sounds, and the radio</span></button>" +
          "<button type='button' class='btn' data-tab='how'><b>How to play</b><span>What the teams actually do</span></button>" +
          "<button type='button' class='btn' data-tab='hall'><b>Hall</b><span>Win / loss lines for named teams</span></button>" +
        "</div>" +
        "<p class='tally'><b>This lineup</b> <span class='wins'>" + (line.wins || 0) + "W</span> / <span class='losses'>" + (line.losses || 0) + "L</span>" +
          " · <b>This browser</b> <span class='wins'>" + persist.wins + "W</span> / <span class='losses'>" + persist.losses + "L</span>" +
          " · <b>Best gauntlet</b> " + (persist.bestStreak || 0) +
          " · <b>Battle TV</b> " + ((persist.tvBest && persist.tvBest.wins) || 0) + "</p>" +
        (ready ? "" : "<p class='muted'>" + (your.length < persist.mode ? "Team select still needs " + (persist.mode - your.length) + " more." : "Put your name in. The hall keeps it with this team.") + "</p>") +
        "<div class='donate-row'>" +
          "<a class='donate-paypal' href='https://www.paypal.com/paypalme/ExcavationPro' target='_blank' rel='noopener'>PayPal.me/ExcavationPro</a>" +
          "<a class='donate-patreon' href='https://www.patreon.com/Excavationpro/posts/chatagent-ca-api-170485961' target='_blank' rel='noopener'>Patreon</a>" +
        "</div>" +
        "<p class='muted'>Optional. The arena stays free.</p>" +
      "</div></div>";
  }
  function screenTeam() {
    const list = R.ROSTER.filter((f) => f.cls === persist.filter);
    const look = R.byId[inspectId] || list[0] || R.ROSTER[0];
    if (look) inspectId = look.id;
    const filters = [
      ["champ", "Champions"], ["beast", "Creatures"], ["pet", "Beasts"]
    ].map(([id, label]) => "<button type='button' class='tab" + (persist.filter === id ? " on" : "") + "' data-filter='" + id + "'>" + label + "</button>").join("");
    const tray = your.length ? your.map((id) => {
      const f = R.byId[id];
      return "<button type='button' class='slot' data-drop='" + f.id + "'><img src='" + artSrc(f) + "' alt=''><b>" + esc(f.name) + "</b></button>";
    }).join("") : "<p class='muted'>No one fielded yet.</p>";
    return "<div class='team-screen'>" +
      "<div class='team-head'><div class='team-title'><button type='button' class='btn' data-tab='home'>Back</button>" +
        "<h2>Team select <span>" + your.length + "/" + persist.mode + "</span>" +
          (your.length === persist.mode ? "" : "<em class='need'>" + (persist.mode - your.length > 0
            ? "pick " + (persist.mode - your.length) + " more to field " + MODE_LABEL[persist.mode]
            : "drop " + (your.length - persist.mode) + " to field " + MODE_LABEL[persist.mode]) + "</em>") + "</h2></div>" +
        "<div class='modes'>" + modeCards() + "</div></div>" +
      "<div class='team-body'><div class='roster-col'>" +
        "<div class='filters'>" + filters +
          "<button type='button' class='tab' data-draft='1'>Random</button>" +
          "<button type='button' class='tab' data-clear='1'>Clear</button></div>" +
        list.map(rosterButton).join("") +
      "</div>" + dossierHtml(look) + "</div>" +
      "<div class='team-foot'><div id='teamRadio' class='team-radio'></div><div class='tray'>" + tray + "</div>" +
        "<button type='button' class='btn gold' data-tab='home'>Done</button></div></div>";
  }
  function screenOptions() {
    const speeds = [1, 2, 4, 8].map((n) => "<button type='button' class='btn ghost" + (persist.speed === n ? " on" : "") + "' data-speed='" + n + "'>" + n + "×</button>").join("");
    return "<div class='plain-screen'>" +
      "<button type='button' class='btn' data-tab='home'>Back</button>" +
      "<p class='kicker'>Options</p><h1>Options</h1>" +
      "<h2>Title music</h2>" +
      "<p class='lede'>The start-page theme. Off leaves the title quiet. The radio is separate.</p>" +
      "<button type='button' class='btn" + (menuSongOn() ? " on" : "") + "' data-act='menuSong'>" + (menuSongOn() ? "Music on" : "Music off") + "</button>" +
      "<h2>Announcer</h2>" +
      "<p class='lede'>The booth and the fighters. Off keeps the words on screen and holds the same pauses.</p>" +
      "<button type='button' class='btn" + (persist.talk ? " on" : "") + "' data-act='talk'>" + (persist.talk ? "Voices on" : "Voices off") + "</button>" +
      mixRow("voiceVol", "Announcer", 0.9) +
      "<h2>Fight sounds</h2>" +
      "<p class='lede'>Hits, casts, and the result. The radio is its own mute.</p>" +
      "<button type='button' class='btn" + (sfxOn() ? " on" : "") + "' data-act='mute'>" + (sfxOn() ? "SFX on" : "SFX off") + "</button>" +
      mixRow("sfxVol", "Effects", 0.85) +
      "<h2>Battle speed</h2><div class='speed'>" + speeds + "</div>" +
      "<h2>Radio</h2>" +
      "<p class='lede'>Excavationpro, from the listen portal. The title screen plays its own theme. The radio is here, on team select, and in the fight.</p>" +
      "<div id='optRadio'></div>" +
      "<p style='margin-top:.8rem'><button type='button' class='btn' data-act='full'>Fullscreen</button></p>" +
      "</div>";
  }
  function screenHow() {
    return "<div class='plain-screen how'>" +
      "<button type='button' class='btn' data-tab='home'>Back</button>" +
      "<p class='kicker'>Guide</p><h1>How to play</h1><ol>" +
      "<li>Put your name in on the title screen. The hall keeps a win/loss line for that name and the exact team you field.</li>" +
      "<li>Team select is its own screen. Choose 1v1, 2v2, 3v3, or 5v5, then open a fighter and read the stats, moves, and cards. Add the ones you want.</li>" +
      "<li>Both sides are AI. Nobody is steered. Each kit swings its own attack: Ashmane bites, Tuskward tramples, and the champions do not share a swing.</li>" +
      "<li>Ranged kits kite, melee kits commit, healers wait for a wound, and a body that has not landed a hit in five seconds stops being careful and charges.</li>" +
      "<li>Every body has one long step on a thirty-second clock. A fist calls it Close and spends it to cross the last stretch. A gun calls it Slip and spends it to step off a fist. The shorter blinks and roots come first. The fight is who still has the long step.</li>" +
      "<li>Challengers are drawn from the full roster, so you never know what walks in.</li>" +
      "<li>The word on each health bar is what that body has decided to do about the fight: <b>press</b> to close, <b>hold</b> the ground it has, <b>overwatch</b> from cover, <b>choke</b> a doorway, <b>flank</b> the long way round, <b>screen</b> an ally, <b>bait</b> and step off, <b>aid</b> the wounded, <b>rally</b> the line, <b>withdraw</b> when it is losing, <b>repair</b> itself out of a corner. The map is three zones on whatever arena loaded: their own starting side is defensive, the centre is the fight, and the far side is offensive. Bodies stay off the walls.</li>" +
      "<li>Every ring has a law, named before the fight. Stone takes no side. Frost shortens every stride. Ember burns the centre. Gold sparks the killer. Lattice hurries cooldowns. Void leaves a slow pocket where a body falls. Tide shoves the floor. Root feeds whoever is still standing.</li>" +
      "<li>Sudden death starts at three minutes. It does not drain health. Every hit lands 25% harder, then another 25% each minute, until hits are doubled. At ten minutes, if both sides are still up, the map is a draw.</li>" +
      "<li>Gauntlet keeps this team and draws a new ring after each win. The streak stays on this browser. Each fight still posts as a normal hall line.</li>" +
      "<li>Battle TV is one click and it does not ask for a team. The card is random, best of three, and the format turns from one-on-one to pairs to three to five. The winner stays. The loser is replaced. The counter on the screen is this reign, and it starts over when a new team takes the title. The best reign is posted to the live hall under the name Battle TV. Leave the show from the menu, or with Escape. The radio comes up under the fights and the mute on the dock turns it off.</li>" +
      "<li>Options has the announcer and the fight sounds, each with its own switch and volume. <b>M</b> mutes the fight sounds only. The radio is separate.</li>" +
      "<li>Keys during a fight: <b>Space</b> pause · <b>1 2 3 4</b> speed · <b>M</b> fight sounds · <b>Esc</b> title · <b>R</b> rematch.</li>" +
      "</ol></div>";
  }
  function screenHall() {
    return "<div class='plain-screen'>" +
      "<button type='button' class='btn' data-tab='home'>Back</button>" +
      "<p class='kicker'>Live hall</p><h1>Hall</h1>" +
      "<p class='lede'>Each line is one player and one lineup. The public book is the shared hall. This browser keeps its own copy until that write lands.</p>" +
      "<div class='hall-live'>" + hallBlock() + "</div>" +
      "<p class='muted' style='margin-top:.8rem'><a href='./ledger.html'>Open the full hall</a></p></div>";
  }
  function renderMenu() {
    const root = $("menu");
    const keepScroll = (root.querySelector(".roster-col") || {}).scrollTop || 0;
    stashRadio();
    overlayMode = "menu";
    /* every route back to the menu — Escape, the Menu button, "change team" from the results
       board — lands here, so this is the one place the reminder hold has to be released.
       Leaving it held would keep the supporter card away for the rest of the visit. */
    if (gateHeld) gateHold(false, 120000);
    $("menu").classList.remove("hidden");
    $("battle").classList.add("hidden");
    document.body.classList.add("in-menu");
    document.body.classList.remove("in-battle");
    $("overlay").className = "overlay";
    const pages = { home: screenTitle, team: screenTeam, options: screenOptions, how: screenHow, hall: screenHall };
    root.innerHTML = (pages[menuTab] || screenTitle)();
    placeRadio();
    const named = $("callSign");
    if (named) {
      named.addEventListener("input", () => {
        persist.name = named.value.replace(/\s+/g, " ").trim().slice(0, 18);
        save();
        const fightBtn = $("btnFight");
        if (fightBtn) {
          const ready = your.length === persist.mode && !!persist.name;
          fightBtn.dataset.ready = ready ? "1" : "0";
          const label = fightBtn.querySelector("span");
          if (label) label.textContent = ready
            ? MODE_LABEL[persist.mode] + " · " + (lineupNames() || "no one fielded")
            : (your.length === persist.mode
              ? "put your name in to start"
              : MODE_LABEL[persist.mode] + " needs " + persist.mode + " kits — you have " + your.length);
        }
      });
    }
    const col = root.querySelector(".roster-col");
    if (col) col.scrollTop = keepScroll;
    const seen = root.querySelector(".rpick.on");
    if (seen && keepScroll === 0) seen.scrollIntoView({ block: "nearest" });
    if (menuTab === "home") startMenuLive();
    else stopMenuLive();
    syncMenuSong();
  }
  let menuRaf = 0;
  function stopMenuLive() { if (menuRaf) cancelAnimationFrame(menuRaf); menuRaf = 0; }
  /* The title photo stays the photo. Torches, the lattice gate, the staff gem and
     the drifting embers are drawn over it, so the menu is a scene and not a slide. */
  function startMenuLive() {
    stopMenuLive();
    const box = document.querySelector("#menu .title-art");
    const cv = box && box.querySelector(".menu-live");
    const film = box && box.querySelector(".menu-film");
    if (film) { film.muted = true; const p = film.play(); if (p && p.catch) p.catch(function () {}); }
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    const embers = Array.from({ length: 26 }, () => ({
      x: Math.random(), y: Math.random(), v: 0.012 + Math.random() * 0.028,
      s: 1 + Math.random() * 2.2, gold: Math.random() > 0.72, ph: Math.random() * 6
    }));
    const t0 = performance.now();
    const glow = (x, y, r, col, a) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = a; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    };
    const frame = (now) => {
      menuRaf = requestAnimationFrame(frame);
      const w = box.clientWidth, h = box.clientHeight;
      if (!w || !h) return;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const flick = 0.45 + 0.55 * Math.abs(Math.sin(t * 7.2) * Math.sin(t * 2.7));
      glow(w * 0.075, h * 0.64, w * 0.09, "rgba(251,146,60,0.95)", 0.42 * flick);
      glow(w * 0.47, h * 0.20, w * 0.055, "rgba(251,146,60,0.9)", 0.28 * (0.4 + 0.6 * Math.abs(Math.sin(t * 6.1))));
      glow(w * 0.93, h * 0.56, w * 0.07, "rgba(251,146,60,0.95)", 0.36 * (0.4 + 0.6 * Math.abs(Math.sin(t * 8.4))));
      glow(w * 0.20, h * 0.50, w * 0.24, "rgba(34,211,238,0.9)", 0.16 + 0.10 * (0.5 + 0.5 * Math.sin(t * 1.5)));
      glow(w * 0.63, h * 0.40, w * 0.04, "rgba(103,232,249,0.95)", 0.28 + 0.22 * (0.5 + 0.5 * Math.sin(t * 3.1)));
      embers.forEach((p) => {
        p.y -= p.v * 0.016;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        ctx.globalAlpha = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3 + p.ph));
        ctx.fillStyle = p.gold ? "#fde68a" : "#fb923c";
        ctx.fillRect(p.x * w, p.y * h, p.s, p.s);
      });
      ctx.globalAlpha = 1;
    };
    menuRaf = requestAnimationFrame(frame);
  }

  function onMenuClick(ev) {
    const t = ev.target.closest("[data-mode],[data-id],[data-drop],[data-filter],[data-draft],[data-clear],[data-tab],[data-add]");
    if (!t) return;
    blip("click");
    if (t.dataset.tab) { menuTab = t.dataset.tab; renderMenu(); return; }
    if (t.dataset.mode) {
      persist.mode = +t.dataset.mode;
      while (your.length > persist.mode) your.pop();
      menuTab = "team";
      save(); renderMenu(); return;
    }
    if (t.dataset.filter) { persist.filter = t.dataset.filter; menuTab = "team"; save(); renderMenu(); return; }
    if (t.dataset.draft) {
      your = R.draw(persist.mode).map((f) => f.id);
      inspectId = your[0] || inspectId;
      menuTab = "team";
      save(); renderMenu(); return;
    }
    if (t.dataset.clear) { your = []; menuTab = "team"; save(); renderMenu(); return; }
    if (t.dataset.drop) {
      your = your.filter((id) => id !== t.dataset.drop);
      inspectId = t.dataset.drop;
      menuTab = "team";
      save(); renderMenu(); return;
    }
    if (t.dataset.add) {
      const id = t.dataset.add;
      if (your.includes(id)) your = your.filter((x) => x !== id);
      else if (your.length < persist.mode) your = your.concat([id]);
      inspectId = id;
      menuTab = "team";
      save(); renderMenu(); return;
    }
    if (t.dataset.id) {
      inspectId = t.dataset.id;
      menuTab = "team";
      renderMenu();
    }
  }

  /* ------------------------------------------------------------------ VS --- */
  function renderVS() {
    const ov = $("overlay");
    overlayMode = "vs";
    const you = your.map((id) => R.byId[id]);
    const foe = foeIds.map((id) => R.byId[id]);
    const side = (list, cls) => "<div class='vside " + cls + "'>" + list.map((f) => {
      const b = R.build(f, [], null, Math.random);
      return "<div class='vcard'><img src='" + (f.portrait ? "./assets/" + f.portrait : E.iconFor(f)) + "' alt=''>" +
        "<div><b>" + f.name + "</b><u>" + f.tag + "</u>" + b.moves.map((m) => "<em>" + m.name + "</em>").join("") +
        "<span class='pw'>PWR " + b.power + "</span></div></div>";
    }).join("") + "</div>";
    ov.className = "overlay show";
    const ring = E.ringFor(nextSeed);
    const law = ring.law;
    ov.innerHTML = "<div class='sheet vs-sheet'><h1 class='vs'>" + (gauntlet ? "Gauntlet " + streak + " · " : "") + MODE_LABEL[persist.mode] + "</h1>" +
      "<p class='kicker'>" + esc(law.name) + " · " + esc(ring.kind) +
      (series ? " · " + seriesTag() + " · best of three" : "") + "</p>" +
      "<div class='vsgrid'>" + side(you, "you") + "<div class='vsmark'>vs</div>" + side(foe, "foe") + "</div>" +
      "<p class='lede center'>" + esc(law.line) + (gauntlet ? " Win, and the next ring draws new challengers." : " The challengers are drawn from the full roster.") + "</p>" +
      "<div class='modes'><button type='button' class='btn gold big' id='btnGo'>Open the arena</button>" +
      "<button type='button' class='btn' id='btnBackMenu'>Change team</button></div></div>";
    label = "vs";
    ov.onclick = (ev) => {
      /* the challengers shown on this sheet are the ones that fight: begin(false) keeps the
         set drawn when Fight was pressed, so the reveal is never a lie. */
      const go = ev.target.closest && ev.target.closest("#btnGo");
      const back = ev.target.closest && ev.target.closest("#btnBackMenu");
      if (go) begin(false);
      else if (back) leaveToMenu("team");
    };
  }
  let label = "vs";

  /* --------------------------------------------------------------- battle --- */
  function teamPanel(team) {
    const box = $("team" + (team === 0 ? "You" : "Foe"));
    const head = battleTv
      ? (team === 0 ? (streak > 0 ? "Defending" : "This side") : "Challengers")
      : (team === 0 ? "Your team" : "Challengers");
    box.innerHTML = "<div class='theading'><h3>" + head +
      "</h3><span class='tag' id='" + (team === 0 ? "youTag" : "foeTag") + "'></span></div>" +
      "<div class='trows' id='" + (team === 0 ? "youRows" : "foeRows") + "'></div>";
  }
  function buildRows() {
    const S = E.state();
    ["you", "foe"].forEach((side, i) => {
      const list = i === 0 ? S.your : S.foe;
      const box = $(side === "you" ? "youRows" : "foeRows");
      box.innerHTML = "";
      rows[side] = list.map((e) => {
        const b = e.b;
        const icon = b.spr.sheet ? R.byId[b.id] && R.byId[b.id].portrait : null;
        const src = b.portrait ? "./assets/" + b.portrait : iconForBuilt(b);
        const row = el("div", "trow");
        row.innerHTML =
          "<img class='tart' src='" + src + "' alt=''>" +
          "<div class='tmain'><div class='tname'><b>" + b.name + "</b><span class='tpw'>" + (b.power || "") + "</span></div>" +
          "<div class='tbar'><i class='hp'></i><i class='shd'></i></div>" +
          "<div class='tstatus'></div></div>" +
          "<div class='tcds'>" + b.moves.map((m) => "<i title='" + m.name + " · " + m.text.replace(/'/g, "") + "'>" + m.name.slice(0, 2) + "</i>").join("") + "</div>";
        box.appendChild(row);
        return {
          e, row, hp: row.querySelector(".hp"), shd: row.querySelector(".shd"),
          st: row.querySelector(".tstatus"), cds: Array.from(row.querySelectorAll(".tcds i"))
        };
      });
    });
  }
  const iconCacheBuilt = {};
  function iconForBuilt(b) {
    if (iconCacheBuilt[b.id]) return iconCacheBuilt[b.id];
    const tpl = R.byId[b.id];
    const src = tpl ? E.iconFor(tpl) : "";
    iconCacheBuilt[b.id] = src;
    return src;
  }
  function paintHud() {
    const S = E.state();
    if (!S.your.length) return;
    /* Rows are built at the bell. A summon, and only a summon, changes the length. */
    if (rows.you.length !== S.your.length || rows.foe.length !== S.foe.length) buildRows();
    ["you", "foe"].forEach((side) => {
      rows[side].forEach((r) => {
        const e = r.e;
        const frac = Math.max(0, Math.min(1, e.hp / e.max));
        r.hp.style.width = (frac * 100).toFixed(1) + "%";
        r.hp.className = "hp" + (e.team === 0 ? "" : " foe") + (e.dead ? " dead" : "") + (frac < 0.3 ? " low" : "");
        r.shd.style.width = (e.shd > 0 ? Math.min(100, (e.shd / e.max) * 100) : 0) + "%";
        r.row.classList.toggle("down", !!e.dead);
        /* THE CREW, ON THE CHIP. One chip said what a body was doing; a crew of three says
           why -- NAV picks the feet, GUN picks who it is hitting, MED picks who it is
           mending -- and because they are decided separately, a spectator can watch one
           body retreat, shoot and mend in the same second. Hover any chip for the reason. */
        const H = e.hem || {};
        /* before the bell the pre-stage is walking these bodies into their shape and the
           crew has not been asked yet, so it shows the task alone rather than three
           dashes pretending to be a decision */
        const chip = e.dead ? "" : (!H.gun ? "<i class='st task' title='" + esc(e.taskWhy || e.task || "") + "'>" + esc(e.task || "-") + "</i>" :
          "<i class='st task' title='" + esc("NAV: " + (e.taskWhy || e.task || "")) + "'>N:" + esc(e.task || "-") + "</i>" +
          "<i class='st hem gun' title='" + esc("GUN: " + (H.gun || "-")) + "'>G:" + esc(String(H.gun || "-").split(" (")[0]) + "</i>" +
          "<i class='st hem med' title='" + esc("MED: " + (H.med || "-")) + "'>M:" + esc(String(H.med || "-").split(" ")[0]) + "</i>" +
          (H.closer ? "<i class='st hem closer" + (H.ready ? " up" : "") + "' title='" +
            esc("CLOSER: " + H.closer + " — " + (H.ready ? "ready, burn in" : (H.cd || 0).toFixed(1) + "s, stay out of its reach")) +
            "'>" + esc((H.ready ? "▲ " : "▽ ") + H.closer) + "</i>" : ""));
        const st = chip + E.statusList(e).slice(0, 4).map(([k]) => "<i class='st " + k + "'>" + k + "</i>").join("");
        if (r.st.dataset.k !== st) { r.st.innerHTML = st; r.st.dataset.k = st; }
        e.b.moves.forEach((m, i) => {
          const c = r.cds[i];
          if (!c) return;
          const ready = e.cds[i] <= 0 && e.mana >= E.moveCost(m);
          c.className = "cd" + (ready ? " ready" : " cool") + (e.dead ? " off" : "");
          /* Close and Slip store a flat 30s. cdMul is for the rest of the kit. */
          const span = m.shape === "stride" ? m.cd : m.cd * (e.b.cdMul || 1);
          if (!ready && !e.dead && span > 0) c.style.setProperty("--p", (1 - Math.min(1, e.cds[i] / span)) * 100 + "%");
        });
      });
    });
    const clock = $("arenaClock");
    const dmgMul = E.suddenMul ? E.suddenMul(S.time) : 1;
    const hot = S.phase === "live" && dmgMul > 1;
    clock.textContent = clockOf(S.time) + (hot ? " +" + Math.round((dmgMul - 1) * 100) + "%" : "");
    clock.classList.toggle("hot", hot);
    $("youTag").textContent = alive(0) + " standing";
    $("foeTag").textContent = alive(1) + " standing";
    const cd = $("announce");
    if (S.phase === "count") {
      const n = String(Math.ceil(S.countdown));
      cd.textContent = n;
      cd.classList.add("show");
      if (n !== lastCount) { lastCount = n; blip("count"); }
      paintIntro();
    } else if (S.phase === "live" && S.time < 4) {
      cd.textContent = "FIGHT";
      cd.classList.add("show");
      if (!fought) { fought = true; blip("fight"); }
      hideIntro();
    } else { cd.classList.remove("show"); hideIntro(); }
    pumpTalk();
    paintFocus();
    /* Length is not a change. The fight log stops at 140 lines and then shifts, so a
       full card used to sit still. The last object is the change. A new card also
       has to drop the previous card's lines: those clocks are later than 0:00, and
       the newest-nine sort would keep showing the fight that already ended. */
    const evTail = S.events.length ? S.events[S.events.length - 1] : null;
    const tkTail = talkLog.length ? talkLog[talkLog.length - 1] : null;
    if (evTail !== feedMark || tkTail !== talkMark || onAir !== shownAir) {
      if (evTail !== feedMark) {
        unseenEvents(S.events, feedMark).forEach(playEvent);
        feedMark = evTail;
        feedLen = S.events.length;
      }
      if (tkTail !== talkMark) {
        talkMark = tkTail;
        feedLog = talkLog.length;
      }
      shownAir = onAir;
      const f = $("feed");
      if (f) f.innerHTML = recentFeed(S.events, talkLog, 9).slice().reverse()
        .map((x) => {
          const live = !!(onAir && x.raw === onAir.text && x.caster !== null && x.caster === !!onAir.caster);
          const body = x.caster === null ? x.text : (x.caster ? esc(x.raw) : "<b>" + esc(x.who) + "</b> " + esc(x.raw));
          return "<p class='" + x.kind + (live ? " live" : "") + "'><span>" + clockOf(x.t) + "</span>" + body + "</p>";
        }).join("");
    }
    const youBar = rows.you.reduce((s, r) => s + Math.max(0, r.e.hp), 0) / Math.max(1, rows.you.reduce((s, r) => s + r.e.max, 0));
    const foeBar = rows.foe.reduce((s, r) => s + Math.max(0, r.e.hp), 0) / Math.max(1, rows.foe.reduce((s, r) => s + r.e.max, 0));
    $("meterYou").style.width = (youBar * 100) + "%";
    $("meterFoe").style.width = (foeBar * 100) + "%";
    const note = $("dockStatus");
    if (note && S.lv) {
      const law = E.law();
      note.textContent = (S.lv && S.lv.kind ? S.lv.kind + " · " : "") + (law ? law.line : "") +
        (series && !series.over ? " · " + seriesTag() : "") +
        (battleTv ? " · Battle TV " + (streak > 0 ? streak + " straight" : "no champion yet") : "") +
        (gauntlet ? " · Gauntlet streak " + streak : "");
    paintTvBug();
    }
    if (S.phase === "over" && overlayMode === "battle") setTimeout(showResults, 1400);
  }
  /* The programme is on the screen as well as in the ear: the roster cards come in as the
     caster names each side, so a spectator can see who is being introduced. And whatever is
     being said, exactly one thing is marked as talking -- the booth panel, or one body. */
  function paintIntro() {
    const S = E.state(), box = $("intro");
    if (!box) return;
    box.classList.add("show");
    if (!box.dataset.filled) {
      box.dataset.filled = "1";
      const ul = (id, team) => { const n = $(id); if (n) n.innerHTML = team.map((e) => "<li>" + esc(e.b.name) + "</li>").join(""); };
      ul("introYouNames", S.your); ul("introFoeNames", S.foe);
    }
    const show = S.introShow || 0;
    const you = $("introYou"), foe = $("introFoe");
    if (you) you.classList.toggle("on", show >= 1);
    if (foe) foe.classList.toggle("on", show >= 2);
    /* The shape each side picked, so the crowd can see what it is about to watch. Set
       every tick rather than once: the overlay element outlives a single match. */
    const yf = $("introYouForm"), ff = $("introFoeForm");
    const FT = (window.LYGO_FORMATION && S.form && S.form.teams) || null;
    if (yf) yf.textContent = FT && FT[0] ? FT[0].name + " \u00b7 " + FT[0].temper : "";
    if (ff) ff.textContent = FT && FT[1] ? FT[1].name + " \u00b7 " + FT[1].temper : "";
    const ring = E.law(), lab = $("introRing");
    if (lab) lab.textContent = (S.lv && S.lv.kind ? S.lv.kind.toUpperCase() + " \u00b7 " : "") + (ring ? ring.name : "THE ARENA");
  }
  function hideIntro() {
    const box = $("intro");
    if (box) box.classList.remove("show");
  }
  function paintFocus() {
    const cb = $("caster");
    const talking = !!(onAir && onAir.caster);
    if (cb) cb.classList.toggle("onair", talking);
    if (talking !== faceTalking) {
      faceTalking = talking;
      const idle = $("cfaceIdle"), talk = $("cfaceTalk");
      if (idle && talk) {
        idle.classList.toggle("is-hidden", talking);
        talk.classList.toggle("is-hidden", !talking);
        if (talking) { try { talk.currentTime = 0; } catch (e) {} }
        const play = (talking ? talk : idle).play();
        if (play && play.catch) play.catch(function () {});
        if (!talking) { try { talk.pause(); } catch (e) {} }
      }
    }
    ["you", "foe"].forEach((side) => {
      (rows[side] || []).forEach((r) => {
        const hot = !!(onAir && !onAir.caster && onAir.who && r.e.b && r.e.b.id === onAir.who);
        r.row.classList.toggle("speaking", hot);
      });
    });
  }
  function skipIntro() { if (E.skipIntro()) hush(); }
  function alive(team) { return E.state()[(team === 0 ? "your" : "foe")].filter((e) => !e.dead).length; }
  function clockOf(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ":" + (s < 10 ? "0" : "") + s; }

  function begin(reset) {
    persist.name = (($("callSign") && $("callSign").value) || persist.name || "").replace(/\s+/g, " ").trim().slice(0, 18);
    save();
    stashRadio();
    document.body.classList.remove("in-menu");
    document.body.classList.add("in-battle");
    if (reset || !foeIds.length) foeIds = R.draw(persist.mode, your).map((f) => f.id);
    $("overlay").className = "overlay";
    overlayMode = "battle";
    $("menu").classList.add("hidden");
    $("battle").classList.remove("hidden");
    teamPanel(0); teamPanel(1);
    /* the programme: fifteen seconds, the booth introduces both teams, then the bell */
    if (DIR) DIR.clear();
    lastBell = 0;
    const ib = $("intro");
    if (ib) { ib.dataset.filled = ""; ib.classList.remove("show"); }
    const mapNo = series ? series.played + 1 : 1;
    E.newMatch({ you: your.slice(), foe: foeIds.slice() }, persist.mode, nextSeed,
      { map: mapNo, me: battleTv ? (streak > 0 ? "the champions" : "this side") : (persist.name || ""),
        score: series && series.played ? scoreLine() : "",
        tv: battleTv ? { card: MODE_LABEL[persist.mode], streak: streak } : null });
    paintShowTags();
    buildRows();
    feedLen = 0;
    feedLog = 0;
    feedMark = null;
    talkMark = null;
    talkLog.length = 0;
    shownAir = null;
    const feedBox = $("feed");
    if (feedBox) feedBox.innerHTML = "";
    lastCount = "";
    fought = false;
    gateHold(true);
    const lawNow = E.law();
    $("matchPill").textContent = (battleTv ? "BATTLE TV · " + (streak > 0 ? streak + " · " : "") : "") +
      (gauntlet ? "Gauntlet " + streak + " · " : "") +
      (series ? seriesTag() + " · " : "") +
      MODE_LABEL[persist.mode] + (lawNow ? " · " + lawNow.name : "");
    paintTvBug();
    lastMatch = { your: your.slice(), foe: foeIds.slice() };
    syncMenuSong();
    tellBooth("card", null);
  }

  function newSeries() { return { played: 0, you: 0, foe: 0, last: -1, over: false, draws: 0, log: [] }; }
  function needMore() { return "Two wins in a row takes the match."; }
  function mapLabel() { return "Map " + (series.played + 1) + " of 3"; }
  function seriesTag() {
    if (!series) return "";
    return mapLabel() + (series.played ? " \u00b7 " + scoreLine() : "");
  }
  function scoreLine() {
    if (!series || !series.played) return "";
    if (battleTv) {
      const home = streak > 0 ? "Champions" : "This side";
      return home + " " + series.you + " \u2013 " + series.foe + " Challengers";
    }
    return "You " + series.you + " \u2013 " + series.foe + " Them";
  }
  function statRows(all) {
    return all.map((a) => "<div class='trowline" + (a.team === 0 ? " you" : "") + (a.dead ? " ko" : "") + "'><span><b>" + esc(a.name) + "</b></span><span>" +
      (a.team === 0 ? "you" : "foe") + "</span><span>" + a.dmg + "</span><span>" + a.kills + "</span><span>" + a.heal + "</span><span>" +
      (a.dead ? "KO &mdash; " + esc(a.by || "the arena") : "up") + "</span></div>").join("");
  }
  function recapTable(S) {
    const all = S.your.concat(S.foe).map((e) => ({
      name: e.b.name, team: e.team, dead: !!e.dead, by: e.killedBy,
      dmg: Math.round(e.dmgDone), kills: e.kills || 0, heal: Math.round(e.healDone)
    })).sort((a, b) => b.dmg - a.dmg);
    return { all: all, html: "<div class='table'><div class='thead'><span>Fighter</span><span>Side</span><span>Damage</span><span>Kills</span><span>Healed</span><span>Fate</span></div>" + statRows(all) + "</div>" };
  }
  /* the death recap: every body that went down on this map, in the order it happened */
  function deathRecap(S) {
    const falls = S.events.filter((e) => e.kind === "kill").map((e) => e.text);
    if (!falls.length) return "<div class='deathroll'><b>Nobody went down</b><ul><li>Ten bodies, no kills. That does not happen often.</li></ul></div>";
    return "<div class='deathroll'><b>" + falls.length + " went down on this map</b><ul>" +
      falls.map((f) => "<li>" + esc(f) + "</li>").join("") + "</ul></div>";
  }

  function showResults() {
    const S = E.state();
    if (overlayMode === "results") return;
    overlayMode = "results";
    const won = S.winner;                                  // 0 you, 1 them, -1 a draw
    tellBooth("result", won);
    if (!series) series = newSeries();
    series.played++;
    if (won === 0 || won === 1) {
      if (won === 0) series.you++; else series.foe++;
      if (series.last === won) series.over = true;         // two in a row closes the match
      series.last = won;
    } else {
      series.draws++;
      series.last = -1;                                    // a draw breaks the run
    }
    const decided = series.played - series.draws;
    if (!series.over && decided >= 3) series.over = true;   // three maps at most
    const rec = recapTable(S);
    const mvp = rec.all.filter((a) => a.team === (won === 0 ? 0 : 1))[0] || rec.all[0];
    series.log.push({ map: series.played, won: won, time: S.time, falls: S.events.filter((e) => e.kind === "kill").length });
    const sWon = series.you > series.foe ? 0 : series.foe > series.you ? 1 : -1;
    const over = series.over;
    /* the caster calls the map that just ended, and the match when it is decided.
       On Battle TV the match call is the show line from settleShow. A second matchEnd
       holds the booth long enough that the reign line goes stale and is never said. */
    if (w.LYGO_BANTER && DIR && !(battleTv && over)) {
      DIR.push({ caster: true, kind: over ? "matchEnd" : "mapEnd",
        text: w.LYGO_BANTER.cast(over ? "matchEnd" : "mapEnd", {
          team: battleTv
            ? (sWon === 0 ? (streak > 0 ? "the champions" : "this side") : sWon === 1 ? "the challengers" : "nobody")
            : (sWon === 0 ? "your team" : sWon === 1 ? "the challengers" : "nobody"),
          score: series.you + " to " + series.foe, t: clockOf(S.time), n: series.played
        }, () => ((series.played * 977) % 100) / 100) });
    }
    let streakNote = "";
    let showNote = "";
    const playedLabel = MODE_LABEL[persist.mode];
    const foughtNames = teamNames().concat(foeIds.map((id) => (R.byId[id] ? R.byId[id].name : id)));
    if (over && battleTv) showNote = settleShow(sWon);
    else if (over) {
      if (sWon !== -1) {
        persist[sWon === 0 ? "wins" : "losses"]++;
        if (gauntlet) {
          if (sWon === 0) {
            streak += 1;
            if (streak > (persist.bestStreak || 0)) persist.bestStreak = streak;
            streakNote = "Gauntlet streak " + streak + ". Best " + persist.bestStreak + ".";
          } else {
            streakNote = "Gauntlet ends at " + streak + ". Best " + (persist.bestStreak || 0) + ".";
            streak = 0;
          }
        }
        touchBook(sWon === 0);
        save();
      }
    }
    const book = (persist.books || {})[teamKey()] || { wins: 0, losses: 0 };
    const mapLine = series.log.map((l) => "Map " + l.map + ": " +
      (l.won === 0 ? "you" : l.won === 1 ? "them" : "draw") + " (" + clockOf(l.time) + ", " + l.falls + " down)").join(" &middot; ");
    const tvSide = streak > 0 ? "Champions" : "This side";
    const tvHead = !battleTv ? ""
      : over
        ? (sWon === -1 ? "No decision on Battle TV" : streak <= 1 ? "New champions" : "The champions stay")
        : (won === 0 ? tvSide + " take map " + series.played : won === 1 ? "Challengers take map " + series.played : "Map " + series.played + " is a draw");
    const head = battleTv ? tvHead + " <span class='sscore'>" + (over ? (streak > 0 ? streak + " straight" : "fresh card") : series.you + "\u2013" + series.foe) + "</span>"
      : over
      ? (sWon === 0 ? "Your team takes the match" : sWon === 1 ? "The challengers take the match" : "The match is drawn") +
        " <span class='sscore'>" + series.you + "\u2013" + series.foe + "</span>"
      : (won === 0 ? "Your team takes map " + series.played : won === 1 ? "The challengers take map " + series.played : "Map " + series.played + " is a draw");
    const lede = battleTv
      ? (over
          ? esc(showNote || "The card turns.") + " " + (mvp ? esc(mvp.name) + " led the damage." : "") + " The next card starts itself."
          : scoreLine() + " — best of three, and the show does not wait.")
      : over
      ? "Best of three, " + series.played + " map" + (series.played === 1 ? "" : "s") + " played. " +
        (mvp ? esc(mvp.name) + " led the damage on the last map." : "")
      : needMore() + " " + scoreLine() + " \u2014 " +
        (sWon === 0 ? "you are one map from it." : sWon === 1 ? "they are one map from it." : "the next map decides who leads.");
    $("overlay").className = "overlay show";
    $("overlay").innerHTML = "<div class='sheet res-sheet " + (over ? (sWon === 0 ? "won" : sWon === 1 ? "lost" : "") : (won === 0 ? "won" : won === 1 ? "lost" : "")) + "'>" +
      "<p class='kicker'>" + (battleTv ? "BATTLE TV · " : "") + playedLabel + (gauntlet ? " \u00b7 Gauntlet " + streak : "") + " \u00b7 " + (over ? "best of three, " + series.played + " map" + (series.played === 1 ? "" : "s") + " played" : "map " + series.played + " done") + " \u00b7 " + clockOf(S.time) + "</p>" +
      "<h1>" + head + "</h1>" +
      "<p class='lede center'>" + lede + "</p>" +
      "<p class='mapsum'>" + mapLine + "</p>" +
      deathRecap(S) +
      recapTable(S).html +
      (battleTv
        ? "<div class='tally'>This reign: <span class='wins'>" + streak + " straight</span>" +
          " \u00b7 best " + ((persist.tvBest && persist.tvBest.wins) || 0) +
          "<br>" + esc(foughtNames.join(" \u00b7 ")) + "</div>"
        : "<div class='tally'>This lineup: <span class='wins'>" + book.wins + "W</span> / <span class='losses'>" + book.losses + "L</span>" +
      " \u00b7 " + esc(teamNames().join(" \u00b7 ")) +
      "<br>This browser: <span class='wins'>" + persist.wins + "W</span> / <span class='losses'>" + persist.losses + "L</span>" +
      (persist.name ? " \u00b7 " + esc(persist.name) : "") +
      (streakNote ? "<br>" + esc(streakNote) : "") + "</div>") +
      "<div class='modes'>" +
        (battleTv
          ? "<button type='button' class='btn gold big' id='btnTvNext'>" + (over ? "Next card" : "Next map") + "</button>" +
            "<button type='button' class='btn' id='btnMenu2'>Leave the show</button>"
          : (over
          ? (gauntlet && sWon === 0
            ? "<button type='button' class='btn gold big' id='btnAgain'>Next gauntlet match</button>" +
              "<button type='button' class='btn' id='btnNewFoe'>New challengers</button>"
            : gauntlet
            ? "<button type='button' class='btn gold big' id='btnAgain'>Run the gauntlet again</button>"
            : "<button type='button' class='btn gold big' id='btnAgain'>Rematch \u00b7 best of three</button>" +
              "<button type='button' class='btn' id='btnNewFoe'>New challengers</button>")
          : "<button type='button' class='btn gold big' id='btnNextMap'>Next map " + (series.played + 1) + " of 3 \u25b6</button>" +
            "<button type='button' class='btn' id='btnNewFoe'>New challengers</button>") +
        "<button type='button' class='btn' id='btnMenu2'>Change team</button>") +
      "</div></div>";
    gateHold(false, 120000);
    blip(over ? (sWon === 0 ? "win" : sWon === 1 ? "lose" : "click") : (won === 0 ? "win" : "click"));
    if (over && !battleTv) postResult(sWon === 0, persist.mode, mvp ? mvp.name : "");
    if (battleTv) tvLater(() => tvContinue(over), over ? 7200 : 5600);
    $("overlay").onclick = (ev) => {
      if (battleTv) {
        const go = ev.target.closest && ev.target.closest("#btnTvNext");
        const back = ev.target.closest && ev.target.closest("#btnMenu2");
        if (go) tvContinue(over);
        else if (back) { if (tvTimer) { clearTimeout(tvTimer); tvTimer = 0; } leaveToMenu("home"); }
        return;
      }
      const again = ev.target.closest && ev.target.closest("#btnAgain");
      const fresh = ev.target.closest && ev.target.closest("#btnNewFoe");
      const nextMap = ev.target.closest && ev.target.closest("#btnNextMap");
      const back = ev.target.closest && ev.target.closest("#btnMenu2");
      if (nextMap) { blip("click"); rollSeed(); begin(false); }
      else if (again) { blip("click"); series = newSeries(); renderVS(); }
      else if (fresh) { blip("click"); foeIds = R.draw(persist.mode, your).map((f) => f.id); series = newSeries(); rollSeed(); renderVS(); }
      else if (back) { $("battle").classList.add("hidden"); leaveToMenu("team"); }
    };
  }

  function rollSeed() { nextSeed = (Math.random() * 9999) | 0; }
  function tvNames(ids) {
    return ids.map((id) => (R.byId[id] ? R.byId[id].name : id));
  }
  function fitLine(ids, n) {
    const keep = [];
    ids.forEach((id) => { if (R.byId[id] && keep.indexOf(id) < 0) keep.push(id); });
    while (keep.length > n) keep.pop();
    if (keep.length < n) R.draw(n - keep.length, keep).forEach((f) => keep.push(f.id));
    return keep;
  }
  function nextCard() {
    const i = TV_WHEEL.indexOf(persist.mode);
    persist.mode = TV_WHEEL[(i + 1) % TV_WHEEL.length] || 1;
  }
  function paintShowTags() {
    const a = document.querySelector("#introYou .itag");
    const b = document.querySelector("#introFoe .itag");
    if (a) a.textContent = battleTv ? (streak > 0 ? "Defending" : "This side") : "Your team";
    if (b) b.textContent = battleTv ? "Challengers" : "The challengers";
  }
  function paintTvBug() {
    const bug = $("tvBug");
    if (!bug) return;
    bug.hidden = !battleTv;
    const n = $("tvBugN"), lab = $("tvBugL");
    if (!battleTv || !n || !lab) return;
    const best = (persist.tvBest && persist.tvBest.wins) || 0;
    n.textContent = String(streak);
    lab.textContent = streak > 0 ? "straight · record " + best : "no champion yet";
  }
  function sayShow(kind, vars) {
    if (!battleTv || !w.LYGO_BANTER || !DIR) return;
    const text = w.LYGO_BANTER.cast(kind, vars || {}, () => ((streak * 13 + persist.mode) % 100) / 100);
    if (!text) return;
    DIR.push({ caster: true, kind: kind, text: text, prio: 9 });
  }
  function postTv(won) {
    if (!tvCore || !w.ArcadeLedger || !w.ArcadeLedger.arena) return;
    tvPostN += 1;
    const match = (Date.now().toString(36) + tvPostN.toString(36) + Math.random().toString(36).slice(2, 6))
      .replace(/[^A-Za-z0-9]/g, "").slice(0, 40);
    try {
      w.ArcadeLedger.arena({
        name: "Battle TV",
        mode: tvCore.mode,
        team: tvCore.names.join(" · ").slice(0, 120),
        teamKey: tvCore.ids.join(","),
        outcome: won ? "win" : "loss",
        mvp: "",
        match: match,
        date: new Date().toISOString().slice(0, 10),
        score: won ? streak : 0,
        wins: won ? streak : 0,
        losses: won ? 0 : 1
      });
    } catch (e) {}
  }
  function rememberReign() {
    const best = (persist.tvBest && persist.tvBest.wins) || 0;
    if (!tvCore || streak <= best) return;
    persist.tvBest = {
      wins: streak,
      mode: tvCore.mode,
      team: tvCore.names.join(" · "),
      teamKey: tvCore.ids.join(",")
    };
  }
  function settleShow(sWon) {
    if (sWon === -1) {
      nextCard();
      if (streak > 0) your = fitLine(your, persist.mode);
      else your = R.draw(persist.mode).map((f) => f.id);
      foeIds = R.draw(persist.mode, your).map((f) => f.id);
      const card = MODE_LABEL[persist.mode];
      sayShow("tvDraw", { card: card, n: String(streak), champ: tvNames(your).join(", ") });
      save();
      return streak > 0
        ? "No decision. The champions stay. Next card is " + card + "."
        : "No decision. Fresh card. Next is " + card + ".";
    }
    const defending = streak > 0 && sWon === 0;
    const winnerIds = (sWon === 0 ? your : foeIds).slice();
    if (streak > 0 && sWon === 1 && tvCore) postTv(false);
    if (defending) {
      streak += 1;
      postTv(true);
    } else {
      streak = 1;
      tvCore = { ids: winnerIds.slice(), mode: MODE_LABEL[persist.mode], names: tvNames(winnerIds) };
      your = winnerIds.slice();
      postTv(true);
    }
    rememberReign();
    nextCard();
    your = fitLine(your, persist.mode);
    foeIds = R.draw(persist.mode, your).map((f) => f.id);
    const card = MODE_LABEL[persist.mode];
    const champ = tvNames(your).join(", ");
    sayShow(defending ? "tvKeep" : "tvCrown", { n: String(streak), card: card, champ: champ });
    save();
    return defending
      ? "Still the team to beat. " + streak + " straight. Next card is " + card + "."
      : "New champions. The counter starts at 1. Next card is " + card + ".";
  }
  function tvLater(fn, ms) {
    if (tvTimer) clearTimeout(tvTimer);
    tvTimer = setTimeout(() => {
      tvTimer = 0;
      if (!battleTv || overlayMode === "menu") return;
      fn();
    }, ms);
  }
  function tvContinue(matchOver) {
    if (tvTimer) { clearTimeout(tvTimer); tvTimer = 0; }
    if (!battleTv) return;
    if (matchOver) series = newSeries();
    rollSeed();
    begin(false);
  }
  function armShowRadio() {
    const radio = w.LatticeRadio;
    if (!radio) return;
    if (!radioHold) radioHold = { vol: radio.vol(), muted: !!radio.muted() };
    if (radio.setMuted) radio.setMuted(false, true);
    radio.setVol(0.2, true);
    radio.play();
  }
  function restoreShowRadio() {
    const radio = w.LatticeRadio;
    if (!radio || !radioHold) { radioHold = null; return; }
    /* write the listener's own level back. Mute and the volume slider save while the show is up. */
    radio.setVol(radioHold.vol);
    if (radio.setMuted) radio.setMuted(!!radioHold.muted);
    radioHold = null;
  }
  function endBattleTv() {
    if (tvTimer) { clearTimeout(tvTimer); tvTimer = 0; }
    const was = !!(battleTv || showHold);
    battleTv = false;
    if (showHold) {
      your = showHold.team.filter((id) => R.byId[id]);
      persist.mode = showHold.mode;
      showHold = null;
    }
    tvCore = null;
    if (was) streak = 0;
    restoreShowRadio();
    paintTvBug();
    if (was) save();
  }
  function startBattleTv() {
    blip("click");
    if (!showHold) showHold = { team: your.slice(), mode: persist.mode };
    gauntlet = false;
    battleTv = true;
    streak = 0;
    tvCore = null;
    persist.mode = TV_WHEEL[(Math.random() * TV_WHEEL.length) | 0];
    your = R.draw(persist.mode).map((f) => f.id);
    foeIds = R.draw(persist.mode, your).map((f) => f.id);
    series = newSeries();
    rollSeed();
    save();
    begin(false);
    armShowRadio();
  }
  function endGauntlet() { gauntlet = false; streak = 0; }
  function leaveToMenu(tab) {
    hush();
    endBattleTv();
    endGauntlet();
    menuTab = tab || "home";
    $("battle").classList.add("hidden");
    renderMenu();
    gateHold(false, 60000);
  }
  function startListed(asGauntlet) {
    const named = (($("callSign") && $("callSign").value) || persist.name || "").replace(/\s+/g, " ").trim().slice(0, 18);
    if (!named || your.length !== persist.mode) {
      menuTab = your.length === persist.mode ? "home" : "team";
      renderMenu();
      if (!named && $("callSign")) $("callSign").focus();
      return;
    }
    blip("click");
    persist.name = named;
    gauntlet = !!asGauntlet;
    streak = 0;
    save();
    foeIds = R.draw(persist.mode, your).map((f) => f.id);
    series = newSeries();
    rollSeed();
    renderVS();
  }

  /* ------------------------------------------------------------------ boot --- */
  async function boot() {
    const canvas = $("arena");
    await E.init(canvas);
    /* the menu should not show until the atlases are in, or cards come up blank */
    loadSfx();
    document.body.classList.add("ready");
    $("boot").classList.add("hidden");
    $("menu").addEventListener("click", onMenuClick);
    document.addEventListener("pointerdown", function () {
      syncMenuSong();
      const film = document.querySelector(".menu-film");
      if (film && film.paused) { film.muted = true; const p = film.play(); if (p && p.catch) p.catch(function () {}); }
    }, { passive: true });
    renderMenu();
    pullHall();
    setInterval(pullHall, 40000);
    E.setSpeed(persist.speed || 1);
    document.querySelectorAll("[data-speed]").forEach((b) => b.classList.toggle("on", +b.dataset.speed === (persist.speed || 1)));

    document.body.addEventListener("click", (ev) => {
      const t = ev.target.closest("[data-speed],[data-act]");
      if (!t) return;
      if (t.dataset.speed) {
        persist.speed = +t.dataset.speed; save();
        E.setSpeed(persist.speed);
        document.querySelectorAll("[data-speed]").forEach((b) => b.classList.toggle("on", +b.dataset.speed === persist.speed));
        return;
      }
      const act = t.dataset.act;
      if (act === "pause") { const s = E.state(); E.pause(!s.paused); $("btnPause").classList.toggle("on", !s.paused); }
      if (act === "menu") leaveToMenu("home");
      if (act === "rematch" && !battleTv) { series = newSeries(); begin(false); }
      if (act === "newfoe" && !battleTv) { foeIds = R.draw(persist.mode, your).map((f) => f.id); rollSeed(); renderVS(); }
      if (act === "mute") { persist.sfx = !sfxOn(); save(); paintSfx(); }
      if (act === "menuSong") { persist.menuSong = !menuSongOn(); save(); paintMenuSong(); syncMenuSong(); }
      if (act === "skip") skipIntro();
      if (act === "talk") { persist.talk = !persist.talk; save(); paintTalk(); if (!persist.talk) hush(); }
      if (act === "full") { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); }
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.target.tagName === "INPUT") return;
      if (ev.code === "Space" && overlayMode === "battle") { ev.preventDefault(); const s = E.state(); E.pause(!s.paused); $("btnPause").classList.toggle("on", !s.paused); }
      else if (ev.code === "Enter" && overlayMode === "battle") { ev.preventDefault(); skipIntro(); }
      else if (ev.code === "KeyM") { persist.sfx = !sfxOn(); save(); paintSfx(); }
      else if (ev.code === "KeyR" && overlayMode === "battle") {
        if (!battleTv) series = newSeries();
        begin(false);
      }
      else if (ev.code === "Escape") {
        if (overlayMode === "battle" || overlayMode === "results" || overlayMode === "vs") {
          leaveToMenu("home");
        } else if (overlayMode === "menu" && menuTab !== "home") {
          menuTab = "home";
          renderMenu();
        }
      }
      else if (["Digit1", "Digit2", "Digit3", "Digit4"].includes(ev.code)) {
        if (overlayMode !== "menu" && overlayMode !== "battle") return;
        const map = { Digit1: 1, Digit2: 2, Digit3: 4, Digit4: 8 };
        persist.speed = map[ev.code]; save(); E.setSpeed(persist.speed);
        document.querySelectorAll("[data-speed]").forEach((b) => b.classList.toggle("on", +b.dataset.speed === persist.speed));
      }
    });
    /* the fight button lives inside the sheet, so bind it here as well as the grid */
    paintTalk();
    paintSfx();
    document.body.addEventListener("input", (ev) => {
      const input = ev.target;
      if (!input || !input.dataset || !input.dataset.vol) return;
      persist[input.dataset.vol] = Number(input.value) / 100;
      const label = input.parentElement && input.parentElement.querySelector("b");
      if (label) label.textContent = input.value;
      save();
    });
    document.body.addEventListener("click", (ev) => {
      if (ev.target.closest && ev.target.closest("#btnFight")) startListed(false);
      else if (ev.target.closest && ev.target.closest("#btnBattleTv")) startBattleTv();
      else if (ev.target.closest && ev.target.closest("#btnGauntlet")) startListed(true);
    });
  }

  w.ArenaUI = { tick: paintHud, sfx: blip, voices: humanVoices, talk: () => talkLog, rows: () => rows, state: () => ({ overlayMode, your, foeIds, persist }), series: () => series, recentFeed: recentFeed, unseenEvents: unseenEvents };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
