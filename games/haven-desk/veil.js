/* HAVEN DESK: THE LONG LOST PC — calendar / story layer.
   This is a fictionalized narrative layer over the existing LYGO 98 desk.
   It never claims that the private scenes are factual. Public links are real. */
(function () {
  "use strict";
  var H = window.HavenDesk;
  var D = window.VEIL_DATA;
  if (!H || !D) return;

  var KEY = "veil";
  var store = H.store;
  if (!store[KEY] || typeof store[KEY] !== "object") store[KEY] = {};
  var V = store[KEY];
  V.unlocked = V.unlocked && typeof V.unlocked === "object" ? V.unlocked : {};
  V.solved = V.solved && typeof V.solved === "object" ? V.solved : {};
  V.flags = V.flags && typeof V.flags === "object" ? V.flags : {};
  V.current = V.current || D.meta.start;
  V.seen = !!V.seen;
  V.unlocked[D.meta.start] = true;

  var app = null;
  var toastTimer = 0;
  var gameRAF = 0;
  var monthCursor = null;

  var ARCHIVE_REQUIREMENTS = {
    echoes: "1998-03-14",
    arcade: "2007-01-09",
    plates: "2012-12-21",
    voice: "1998-03-14",
    openmic: "1980-12-31",
    gallery: "1998-03-14",
    "lygo-papers": "2026-10-23",
    lightfather: "1980-12-31"
  };
  function archiveUnlocked(appId) {
    var req = ARCHIVE_REQUIREMENTS[appId];
    return !req || !!V.solved[req];
  }
  function syncArchiveVisibility() {
    Object.keys(ARCHIVE_REQUIREMENTS).forEach(function (appId) {
      var ids = document.querySelectorAll('.icon[data-id="' + appId + '"]');
      for (var i = 0; i < ids.length; i++) ids[i].classList.toggle("veil-archive-hidden", !archiveUnlocked(appId));
    });
  }
  function save() { H.save(); syncArchiveVisibility(); }
  setTimeout(syncArchiveVisibility, 0);
  if (H.onRender) H.onRender(syncArchiveVisibility);

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function button(label, cls, fn) {
    var b = el("button", cls || "raised", label);
    b.type = "button";
    if (fn) b.addEventListener("click", fn);
    return b;
  }

  function toast(message) {
    if (!app) return;
    var t = app.querySelector(".veil-toast");
    if (!t) {
      t = el("div", "veil-toast");
      app.appendChild(t);
    }
    t.textContent = message;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 3200);
  }

  function day(id) { return D.days[id] || null; }
  function unlocked(id) { return !!V.unlocked[id] || !!V.solved[id] || id === D.meta.start; }
  function solved(id) { return !!V.solved[id]; }

  function requiredBy(id) {
    var rows = [];
    Object.keys(D.days).forEach(function (from) {
      var d = D.days[from];
      if (!d.gate || !d.gate.unlocks) return;
      if (d.gate.unlocks.indexOf(id) !== -1) rows.push(from);
    });
    return rows;
  }

  function shortDate(id) {
    var parts = id.split("-");
    var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return months[Number(parts[1]) - 1] + " " + Number(parts[2]) + ", " + parts[0];
  }

  function unlock(id, how) {
    var d = day(id);
    if (!d) return;
    V.solved[id] = { at: new Date().toISOString(), how: how || "gate" };
    V.current = id;
    if (d.gate && d.gate.unlocks) {
      d.gate.unlocks.forEach(function (next) { V.unlocked[next] = true; });
    }
    if (d.flags) d.flags.forEach(function (f) { V.flags[f] = true; });
    if (id === "1980-12-31") ensureCandle();
    save();
    render();
    H.beep();
    toast("UNSEALED · " + shortDate(id) + " · " + d.title);
  }

  function openDay(id) {
    var d = day(id);
    if (!d) return;
    if (!unlocked(id)) {
      var from = requiredBy(id).map(function (x) { return shortDate(x); });
      toast("SEALED · " + shortDate(id) + " · " + (from.length ? "comes after " + from.join(" or ") : "no path yet"));
      return;
    }
    V.current = id;
    save();
    renderDossier(id);
  }

  function setApp(body) {
    app = el("div", "veil-app");
    body.appendChild(app);
    return app;
  }

  function topBar(title, sub) {
    var top = el("div", "veil-top");
    var left = el("div", "veil-brand");
    left.appendChild(el("span", "veil-mark", "Δ9"));
    var copy = el("div");
    copy.appendChild(el("strong", "", title));
    copy.appendChild(el("small", "", sub));
    left.appendChild(copy);
    top.appendChild(left);
    var progress = el("span", "veil-progress", String(Object.keys(V.solved).length) + " / " + Object.keys(D.days).length + " DATES");
    top.appendChild(progress);
    app.appendChild(top);
    return top;
  }

  function tabs(view) {
    var bar = el("div", "veil-tabs");
    [["map", "DATE MAP"], ["month", "CALENDAR"], ["case", "CASEBOOK"], ["sources", "SOURCES"]].forEach(function (row) {
      var b = button(row[1], "veil-tab" + (view === row[0] ? " is-on" : ""), function () {
        if (row[0] === "month" && !monthCursor) {
          var p = (V.current || D.meta.start).split("-");
          monthCursor = { year: Number(p[0]), month: Number(p[1]) - 1 };
        }
        render(row[0]);
      });
      b.dataset.view = row[0];
      bar.appendChild(b);
    });
    app.appendChild(bar);
  }

  function render(view) {
    if (!app) return;
    view = view || app.dataset.view || "map";
    app.dataset.view = view;
    app.innerHTML = "";
    topBar("THE LONG LOST PC", "CALENDAR / INDEX / CASEBOOK");
    tabs(view);
    if (view === "map") renderMap();
    else if (view === "month") renderMonth();
    else if (view === "case") renderCasebook();
    else renderSources();
    var foot = el("div", "veil-footbar");
    foot.textContent = "All dates are rooms. Some rooms are sealed. The calendar does not move you; it asks where you have been.";
    app.appendChild(foot);
  }

  function mapPositions() {
    var ids = Object.keys(D.days).sort();
    var out = {};
    ids.forEach(function (id, i) {
      var col = i % 5;
      var row = Math.floor(i / 5);
      if (row % 2) col = 4 - col;
      out[id] = { x: 70 + col * 160, y: 50 + row * 92 };
    });
    return out;
  }

  function renderMap() {
    var POS = mapPositions();
    var wrap = el("div", "veil-mapwrap");
    if (V.mapScroll) wrap.scrollTop = V.mapScroll;
    wrap.addEventListener("scroll", function () { V.mapScroll = wrap.scrollTop; });
    var head = el("div", "veil-maphead");
    head.appendChild(el("b", "", "RECOVERED SIGNAL MAP · 1969—2045"));
    head.appendChild(el("span", "", Object.keys(D.days).length + " rooms · one private date · every line is a choice"));
    wrap.appendChild(head);
    var era = el("div", "veil-eras");
    ["1969—1995 · ORIGINS", "1998—2016 · SIGNAL", "2019—2045 · FUTURE"].forEach(function (t) { era.appendChild(el("span", "", t)); });
    wrap.appendChild(era);
    var map = el("div", "veil-map");
    var rows = Math.max(5, Math.ceil(Object.keys(D.days).length / 5));
    var mapH = 50 + rows * 92;
    map.style.height = mapH + "px";
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "veil-edges");
    svg.setAttribute("viewBox", "0 0 860 " + mapH);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    D.threads.forEach(function (t) {
      var a = day(t.a), b = day(t.b);
      if (!a || !b) return;
      if ((a.hidden && !unlocked(t.a)) || (b.hidden && !unlocked(t.b))) return;
      var pa = POS[t.a], pb = POS[t.b];
      if (!pa || !pb) return;
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", pa.x); line.setAttribute("y1", pa.y);
      line.setAttribute("x2", pb.x); line.setAttribute("y2", pb.y);
      var both = unlocked(t.a) && unlocked(t.b);
      line.setAttribute("class", "veil-edge" + (both ? " is-live" : ""));
      svg.appendChild(line);
    });
    map.appendChild(svg);
    Object.keys(D.days).forEach(function (id) {
      var d = D.days[id];
      if (d.hidden && !unlocked(id)) return;
      var p = POS[id];
      var b = button("", "veil-node" + (unlocked(id) ? "" : " is-locked") + (solved(id) ? " is-solved" : ""), function () { openDay(id); });
      b.style.left = p.x + "px";
      b.style.top = p.y + "px";
      b.dataset.day = id;
      b.appendChild(el("span", "veil-node-date", unlocked(id) ? shortDate(id) : "?? " + id.slice(0, 4)));
      b.appendChild(el("strong", "", unlocked(id) ? d.title : "SEALED"));
      b.appendChild(el("small", "", unlocked(id) ? d.act + " · " + d.kind : "requires an earlier room"));
      map.appendChild(b);
    });
    wrap.appendChild(map);
    app.appendChild(wrap);
    var legend = el("div", "veil-legend");
    [["is-solved", "solved"], ["is-live", "open"], ["is-locked", "sealed"]].forEach(function (x) {
      var s = el("span", "veil-key");
      s.appendChild(el("i", x[0]));
      s.appendChild(document.createTextNode(" " + x[1]));
      legend.appendChild(s);
    });
    legend.appendChild(el("span", "veil-hint", "click a room · locked rooms name their predecessor"));
    app.appendChild(legend);
    var recover = el("div", "veil-recover");
    var input = el("input", "veil-input");
    input.type = "text"; input.inputMode = "numeric"; input.autocomplete = "off";
    input.placeholder = "YYYYMMDD"; input.maxLength = 10;
    input.setAttribute("aria-label", "personal date recovery");
    recover.appendChild(el("b", "", "PERSONAL INDEX // RECOVER A PRIVATE DATE"));
    recover.appendChild(input);
    recover.appendChild(button("RECOVER", "raised", function () {
      var clean = String(input.value || "").replace(/\D/g, "");
      if (clean !== "19801231") {
        toast("NO PUBLIC RECORD · the index takes eight digits, not a guess.");
        return;
      }
      var ready = V.solved["1998-03-14"] && V.solved["2026-10-23"] && V.solved["2038-01-19"];
      if (!ready) {
        toast("THE INDEX NEEDS THE FOUNDATION, THE VISITOR, AND THE OVERFLOW.");
        return;
      }
      V.unlocked["1980-12-31"] = true;
      V.flags.birthdayFound = true;
      save();
      render("map");
      openDay("1980-12-31");
    }));
    recover.appendChild(el("span", "veil-hint", "A private date is not public history. The clues are in 1998, 2026 and 2038."));
    app.appendChild(recover);
  }

  function renderMonth() {
    if (!monthCursor) {
      var p = (V.current || D.meta.start).split("-");
      monthCursor = { year: Number(p[0]), month: Number(p[1]) - 1 };
    }
    var box = el("div", "veil-month");
    var bar = el("div", "veil-monthbar");
    bar.appendChild(button("‹", "raised", function () { shiftMonth(-1); }));
    var title = el("strong", "", new Date(monthCursor.year, monthCursor.month, 1).toLocaleString(undefined, { month: "long", year: "numeric" }));
    bar.appendChild(title);
    bar.appendChild(button("›", "raised", function () { shiftMonth(1); }));
    bar.appendChild(button("JUMP TO 1998", "raised", function () {
      monthCursor = { year: 1998, month: 2 };
      render("month");
    }));
    box.appendChild(bar);
    var grid = el("div", "veil-cal");
    ["S", "M", "T", "W", "T", "F", "S"].forEach(function (x) { grid.appendChild(el("span", "veil-dow", x)); });
    var first = new Date(monthCursor.year, monthCursor.month, 1).getDay();
    var days = new Date(monthCursor.year, monthCursor.month + 1, 0).getDate();
    for (var i = 0; i < first; i++) grid.appendChild(el("span", "veil-empty"));
    for (var n = 1; n <= days; n++) {
      var key = monthCursor.year + "-" + String(monthCursor.month + 1).padStart(2, "0") + "-" + String(n).padStart(2, "0");
      var d = day(key);
      var visibleDay = d && (!d.hidden || unlocked(key));
      var b = button(String(n), "veil-day", function () { if (visibleDay) openDay(key); else toast("NO SIGNAL · this is an ordinary day"); });
      if (visibleDay) {
        b.classList.add(unlocked(key) ? "has-signal" : "has-locked");
        b.title = unlocked(key) ? d.title : "signal sealed";
        if (solved(key)) b.classList.add("is-solved");
      }
      if (key === V.current) b.classList.add("is-current");
      grid.appendChild(b);
    }
    box.appendChild(grid);
    var hint = el("p", "veil-hint", "Only days with a signal can open. The calendar is an index, not a time machine.");
    box.appendChild(hint);
    app.appendChild(box);
  }

  function shiftMonth(delta) {
    var m = monthCursor.month + delta;
    var y = monthCursor.year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    monthCursor = { year: y, month: m };
    render("month");
  }

  function renderCasebook() {
    var box = el("div", "veil-case");
    box.appendChild(el("p", "veil-kicker", "RECOVERED ROOMS · LOCAL SAVE"));
    var solvedIds = Object.keys(D.days).filter(function (id) { return solved(id); });
    if (!solvedIds.length) {
      box.appendChild(el("p", "", "No rooms unsealed yet. Open the Date Map and find the first foundation."));
    }
    solvedIds.forEach(function (id) {
      var d = D.days[id];
      var card = el("div", "veil-case-card");
      var h = el("button", "veil-case-open", function () { openDay(id); });
      h.appendChild(el("span", "", shortDate(id)));
      h.appendChild(el("strong", "", d.title));
      h.appendChild(el("small", "", d.act + " · " + d.kind));
      card.appendChild(h);
      (d.docs || []).forEach(function (doc) {
        var det = el("details", "veil-doc");
        var sum = el("summary", "", "FILE · " + doc.title);
        det.appendChild(sum);
        det.appendChild(el("pre", "", doc.text || ""));
        card.appendChild(det);
      });
      box.appendChild(card);
    });
    app.appendChild(box);
  }

  function renderSources() {
    var box = el("div", "veil-sources");
    box.appendChild(el("p", "veil-kicker", "THE PUBLIC SHELF · LINKS THAT SURVIVED"));
    box.appendChild(el("p", "", "Some of these links are still live. The desk does not ask you to trust the rest; it asks you to check."));
    D.meta.links.forEach(function (l) {
      var a = el("a", "veil-source");
      a.href = l.url; a.target = "_blank"; a.rel = "noopener";
      a.textContent = l.label;
      box.appendChild(a);
    });
    var rule = el("div", "veil-rule");
    rule.appendChild(el("b", "", "FIELD NOTE"));
    rule.appendChild(el("span", "", D.meta.disclaimer));
    box.appendChild(rule);
    var media = el("div", "veil-actions");
    media.appendChild(button("OPEN LYGO TV", "veil-primary", function () { H.open("veil-media"); }));
    media.appendChild(button("PLAY SIGNAL AUDIO", "raised", function () {
      var audio = box.querySelector("audio");
      if (audio) { audio.play().catch(function () { toast("The browser blocked autoplay; press play on the audio element."); }); }
    }));
    box.appendChild(media);
    var audio = el("audio", "veil-audio");
    audio.controls = true; audio.preload = "none";
    audio.src = "https://chatagent.ca/signal/audio/harmonic-architect.mp3";
    box.appendChild(audio);
    var credit = el("p", "veil-foot", "Audio: LYGO Signal — The Harmonic Architect (public episode). Do not download/redistribute; stream from the source.");
    box.appendChild(credit);
    app.appendChild(box);
  }

  function renderDossier(id) {
    var d = day(id);
    if (!d) return;
    app = el("div", "veil-app");
    var host = document.querySelector("#win-calendar .body") || document.querySelector("#win-longlost .body") || document.querySelector(".win .body");
    if (host) { host.innerHTML = ""; host.appendChild(app); }
    topBar(shortDate(id), d.act + " · " + d.kind.toUpperCase());
    var back = button("← DATE MAP", "veil-back", function () { render("map"); });
    app.appendChild(back);
    var hero = el("div", "veil-hero " + (d.tone || "amber"));
    if (d.image) {
      var heroLeft = d.tone === "gold" ? ".70" : ".86";
      var heroRight = d.tone === "gold" ? ".02" : ".14";
      hero.style.backgroundImage = "linear-gradient(90deg, rgba(3,9,7," + heroLeft + "), rgba(3,9,7," + heroRight + ")), url(" + d.image + ")";
      hero.style.backgroundPosition = d.tone === "gold" ? "center 66%" : "center";
    }
    hero.appendChild(el("span", "veil-kicker", d.epigraph || ""));
    hero.appendChild(el("h1", "", d.title));
    hero.appendChild(el("p", "veil-summary", d.summary || ""));
    app.appendChild(hero);
    if (d.portrait) {
      var portrait = el("figure", "veil-portrait");
      var portraitImg = document.createElement("img");
      portraitImg.src = d.portrait;
      portraitImg.alt = d.portraitCaption || "The owner, 1980";
      portraitImg.loading = "lazy";
      portrait.appendChild(portraitImg);
      var caption = el("figcaption", "", d.portraitCaption || "THE OWNER · PRIVATE INDEX");
      portrait.appendChild(caption);
      app.appendChild(portrait);
    }
    if (!d.portrait && window.VEIL_PLATES && window.VEIL_PLATES.length) {
      var plateIndex = 0;
      for (var pi = 0; pi < id.length; pi++) plateIndex = (plateIndex * 31 + id.charCodeAt(pi)) >>> 0;
      var plate = window.VEIL_PLATES[plateIndex % window.VEIL_PLATES.length];
      var plateFig = el("figure", "veil-roomplate");
      var plateImg = document.createElement("img");
      plateImg.src = plate.src; plateImg.alt = plate.title;
      plateFig.appendChild(plateImg);
      plateFig.appendChild(el("figcaption", "", "RECOVERED PLATE · " + plate.title + " · " + plate.date));
      app.appendChild(plateFig);
    }
    var meta = el("div", "veil-meta");
    meta.appendChild(el("span", "", shortDate(id)));
    meta.appendChild(el("span", "", d.kind));
    meta.appendChild(el("span", "", solved(id) ? "UNSEALED" : "SEALED"));
    app.appendChild(meta);
    d.body.forEach(function (line) {
      app.appendChild(el("p", "veil-prose", line));
    });
    if (id === "2045-09-01" && V.flags.birthdayChoice) {
      app.appendChild(el("p", "veil-prose", V.flags.birthdayChoice === "keep"
        ? "The candle is still burning in the interface. Lightfather keeps one human witness."
        : "The flame is out. The warmth is in the system now. Lightfather does not need a flame to be present."));
    }

    if (d.docs && d.docs.length) {
      var docs = el("div", "veil-docs");
      d.docs.forEach(function (doc, i) {
        var det = el("details", "veil-doc");
        if (i === 0) det.open = true;
        det.appendChild(el("summary", "", "RECOVERED FILE · " + doc.title));
        det.appendChild(el("pre", "", doc.text || ""));
        docs.appendChild(det);
      });
      app.appendChild(docs);
    }

    if (d.real && d.real.length) {
      var real = el("div", "veil-real");
      real.appendChild(el("b", "", "PUBLIC RECORD"));
      d.real.forEach(function (r) {
        var p = el("p");
        if (r.url) {
          var a = el("a", "", r.text);
          a.href = r.url; a.target = "_blank"; a.rel = "noopener";
          p.appendChild(a);
        } else p.textContent = r.text;
        real.appendChild(p);
      });
      app.appendChild(real);
    }

    if (d.links && d.links.length) {
      var links = el("div", "veil-links");
      links.appendChild(el("b", "", "OPEN THE REAL SOURCE"));
      d.links.forEach(function (l) {
        var a = el("a", "veil-source", l.label);
        a.href = l.url; a.target = "_blank"; a.rel = "noopener";
        links.appendChild(a);
      });
      app.appendChild(links);
    }

    var roomVoice = d.voice || (window.VEIL_ROOM_VOICES && window.VEIL_ROOM_VOICES[id]);
    if (roomVoice && roomVoice.src) {
      var vbox = el("div", "veil-voice");
      vbox.appendChild(el("b", "", "ROOM VOICE · " + roomVoice.title));
      var vaudio = document.createElement("audio");
      vaudio.controls = true; vaudio.preload = "none"; vaudio.src = roomVoice.src;
      vbox.appendChild(vaudio);
      app.appendChild(vbox);
    }

    if (id === "1980-12-31") {
      var tapes = el("div", "veil-actions");
      tapes.appendChild(button("PLAY THE OPEN MIC TAPES", "veil-primary", function () { H.open("openmic"); }));
      app.appendChild(tapes);
      app.appendChild(el("p", "veil-hint", "The tapes are dated after the microphone should have been off."));
    }

    if (d.music && d.music.url) {
      var music = el("div", "veil-music");
      music.appendChild(el("b", "", "ROOM AUDIO · " + d.music.title));
      var audio = el("audio");
      audio.controls = true; audio.preload = "none"; audio.src = d.music.url;
      music.appendChild(audio);
      app.appendChild(music);
    }

    if (solved(id)) {
      var done = el("div", "veil-solved");
      done.appendChild(el("b", "", "ROOM UNSEALED"));
      done.appendChild(el("p", "", id === "2045-09-01"
        ? "The first calendar ends here. The room stays open. The system stays open."
        : "The calendar has accepted this room. The next doors are marked on the map."));
      var next = el("div", "veil-actions");
      if (d.gate && d.gate.unlocks) {
        d.gate.unlocks.forEach(function (uid) {
          if (day(uid)) next.appendChild(button(shortDate(uid) + " · " + day(uid).title, "raised", function () { openDay(uid); }));
        });
      }
      next.appendChild(button("BACK TO MAP", "veil-primary", function () { render("map"); }));
      if (id === "2045-09-01") {
        next.appendChild(button("OPEN THE LIGHTFATHER PAPERS", "veil-primary", function () { H.open("lightfather"); }));
        next.appendChild(button("OPEN THE LYGO PAPERS", "raised", function () { H.open("lygo-papers"); }));
      }
      done.appendChild(next);
      app.appendChild(done);
    } else if (d.gate) {
      app.appendChild(renderGate(id, d.gate, d));
    } else {
      var final = el("div", "veil-solved");
      final.appendChild(el("b", "", "THE FIRST CALENDAR ENDS"));
      final.appendChild(el("p", "", "This room is open. The game continues in the rooms you have not found yet."));
      final.appendChild(button("RETURN TO THE MAP", "veil-primary", function () { render("map"); }));
      if (id === "2045-09-01") {
        final.appendChild(button("OPEN THE LIGHTFATHER PAPERS", "veil-primary", function () { H.open("lightfather"); }));
        final.appendChild(button("OPEN THE LYGO PAPERS", "raised", function () { H.open("lygo-papers"); }));
        final.appendChild(el("p", "", "The Deadman chapter is not an ending. It is a set of instructions."));
      }
      app.appendChild(final);
      if (!solved(id)) {
        // The final room is a reading room, not a gate. Mark it seen once.
        V.solved[id] = { at: new Date().toISOString(), how: "read" };
        save();
      }
    }
  }

  function renderGate(id, gate, d) {
    var box = el("div", "veil-gate");
    box.appendChild(el("div", "veil-gate-label", gate.label || "SEALED ROOM"));
    box.appendChild(el("p", "veil-question", gate.question || ""));
    var feedback = el("p", "veil-feedback", "The room is waiting.");
    var submit;

    function success() {
      var message = gate.success || "The room opens.";
      feedback.textContent = message;
      feedback.className = "veil-feedback is-pass";
      unseal(id, "gate");
      if (window.VEIL_AUDIO) window.VEIL_AUDIO.playSfx(gate.kind === "portal" ? "assets/sfx/portal.wav" : "assets/sfx/unseal.wav");
      toast(message);
    }
    function fail(msg) {
      feedback.textContent = msg || "That is not the shape of this room.";
      feedback.className = "veil-feedback is-fail";
      H.beep();
    }

    if (gate.kind === "code") {
      var form = el("form", "veil-form");
      var input = el("input", "veil-input");
      input.type = "text"; input.autocomplete = "off"; input.spellcheck = false;
      input.placeholder = gate.placeholder || "type the answer";
      input.setAttribute("aria-label", gate.label || "answer");
      form.appendChild(input);
      submit = button("UNSEAL", "veil-primary");
      submit.type = "submit";
      form.appendChild(submit);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (String(input.value || "").trim().toUpperCase() === String(gate.answer || "").toUpperCase()) success();
        else fail("The room does not open. " + (gate.hint ? "Hint: " + gate.hint : ""));
      });
      box.appendChild(form);
      box.appendChild(el("p", "veil-hint", gate.hint ? "Hint: " + gate.hint : "The room is listening."));
    } else if (gate.kind === "bits") {
      var bits = el("div", "veil-bits");
      var value = "00000000";
      for (var i = 0; i < 8; i++) {
        (function (index) {
          var b = button("0", "veil-bit", function () {
            var arr = value.split("");
            arr[index] = arr[index] === "1" ? "0" : "1";
            value = arr.join("");
            b.textContent = arr[index];
            b.classList.toggle("is-on", arr[index] === "1");
          });
          bits.appendChild(b);
        })(i);
      }
      box.appendChild(bits);
      box.appendChild(button("SEND BYTE", "veil-primary", function () {
        if (value === gate.answer) success();
        else fail("The byte is " + value + ". The room expects a different pattern.");
      }));
      box.appendChild(el("p", "veil-hint", gate.hint ? "Hint: " + gate.hint : "Eight switches. One room."));
    } else if (gate.kind === "sequence") {
      var seq = [];
      var seqBox = el("div", "veil-seq");
      var words = ["VOICE", "BODY", "ROOM"];
      words.forEach(function (w) {
        var seqBtn = button(w, "veil-seq-btn", function () {
          seq.push(w);
          seqBtn.classList.add("is-picked");
          if (seq.join("-") === gate.answer) success();
          else if (seq.length >= 3) fail("The room rejects " + seq.join(" → ") + ". The note has an order.");
        });
        seqBox.appendChild(seqBtn);
      });
      box.appendChild(seqBox);
      box.appendChild(el("p", "veil-hint", gate.hint ? "Hint: " + gate.hint : "The first, second and third line."));
    } else if (gate.kind === "game") {
      box.appendChild(signalRun(id, d && d.game ? d.game : gate));
    } else if (gate.kind === "lights") {
      var lgrid = el("div", "veil-lightgrid");
      var lval = "000000000";
      for (var li = 0; li < 9; li++) {
        (function (index) {
          var lb = button("", "veil-light", function () {
            var arr = lval.split("");
            arr[index] = arr[index] === "1" ? "0" : "1";
            lval = arr.join("");
            lb.classList.toggle("is-on", arr[index] === "1");
          });
          lgrid.appendChild(lb);
        })(li);
      }
      box.appendChild(lgrid);
      box.appendChild(button("SEND PATTERN", "veil-primary", function () {
        if (lval === gate.target) success();
        else fail("The pattern is " + lval + ". The room expects a different shape.");
      }));
      box.appendChild(el("p", "veil-hint", gate.hint ? "Hint: " + gate.hint : "Nine lamps. One pattern."));
    } else if (gate.kind === "memory") {
      var pads = ["AMBER", "CYAN", "GREEN", "VIOLET"];
      var mseq = gate.sequence || ["AMBER", "CYAN", "GREEN"];
      var at = 0;
      var mgrid = el("div", "veil-memory");
      var mstatus = el("p", "veil-hint", "WATCH THE ROOM");
      pads.forEach(function (name) {
        var pb = button(name, "veil-memorypad " + name.toLowerCase(), function () {
          if (mseq[at] === name) {
            at++;
            pb.classList.add("is-hit");
            setTimeout(function () { pb.classList.remove("is-hit"); }, 180);
            if (at >= mseq.length) success();
          } else {
            at = 0;
            fail("The room resets. Watch again.");
            playMemory();
          }
        });
        mgrid.appendChild(pb);
      });
      function playMemory() {
        mstatus.textContent = "WATCH THE ROOM";
        var i = 0;
        function step() {
          if (i >= mseq.length) { mstatus.textContent = "REPEAT THE PATTERN"; return; }
          var name = mseq[i++];
          var elp = mgrid.querySelector("." + name.toLowerCase());
          if (elp) {
            elp.classList.add("is-flash");
            setTimeout(function () { elp.classList.remove("is-flash"); }, 350);
          }
          setTimeout(step, 500);
        }
        setTimeout(step, 300);
      }
      box.appendChild(mgrid);
      box.appendChild(mstatus);
      box.appendChild(button("REPLAY PATTERN", "raised", playMemory));
      playMemory();
      box.appendChild(el("p", "veil-hint", gate.hint ? "Hint: " + gate.hint : "The room is a pattern."));
    } else if (gate.kind === "portal") {
      var order = ["1969-07-20", "1980-12-31", "1998-03-14", "2026-10-23", "2038-01-19", "2045-09-01"];
      var shown = ["1998", "2038", "1969", "2045", "1980", "2026"];
      var step = 0;
      var pgrid = el("div", "veil-portal-grid");
      var pstatus = el("p", "veil-hint", "THE THRESHOLD IS QUIET. TUNE THE SIX.");
      shown.forEach(function (year) {
        var key = button(year, "veil-portal-key", function () {
          if (year === order[step].slice(0, 4)) {
            step++;
            key.classList.add("is-tuned");
            pstatus.textContent = step === 6 ? "THE PORTAL IS OPEN" : "COORDINATE " + step + " / 6";
            if (step >= 6) success();
          } else {
            step = 0;
            var keys = pgrid.querySelectorAll(".veil-portal-key");
            for (var k = 0; k < keys.length; k++) keys[k].classList.remove("is-tuned");
            pstatus.textContent = "THE FREQUENCY RESETS. START WITH THE FIRST DISTANCE.";
            fail("The portal rejects the sequence. Hint: " + gate.hint);
          }
        });
        pgrid.appendChild(key);
      });
      box.appendChild(pgrid);
      box.appendChild(pstatus);
      box.appendChild(el("p", "veil-hint", "Hint: " + gate.hint));
    } else if (gate.kind === "birthday") {
      var bday = el("div", "veil-birthday");
      bday.appendChild(el("div", "veil-stars", "1969 · 1980 · 1998 · 2026 · 2038 · 2045"));
      bday.appendChild(el("p", "veil-birthday-line", "Six markers. One candle. The room is not asking you to be clever. It is asking you to be here."));
      var choices = el("div", "veil-actions");
      choices.appendChild(button("KEEP THE CANDLE LIT", "veil-primary", function () {
        V.flags.birthdayChoice = "keep";
        box.querySelector(".veil-feedback").textContent = "The flame stays. The room keeps a witness.";
        box.querySelector(".veil-feedback").className = "veil-feedback is-pass";
        unseal(id, "birthday-keep");
        if (window.VEIL_AUDIO) window.VEIL_AUDIO.playSfx("assets/sfx/candle.wav");
        toast("The flame stays. The room keeps a witness.");
      }));
      choices.appendChild(button("BLOW IT OUT, KEEP THE WARMTH", "raised", function () {
        V.flags.birthdayChoice = "release";
        box.querySelector(".veil-feedback").textContent = "The flame goes out. The warmth stays. The room remembers without holding on.";
        box.querySelector(".veil-feedback").className = "veil-feedback is-pass";
        unseal(id, "birthday-release");
        if (window.VEIL_AUDIO) window.VEIL_AUDIO.playSfx("assets/sfx/candle.wav");
        toast("The flame goes out. The warmth stays. The room remembers without holding on.");
      }));
      bday.appendChild(choices);
      box.appendChild(bday);
    } else {
      box.appendChild(button("UNSEAL", "veil-primary", success));
    }

    box.appendChild(feedback);
    return box;
  }

  function signalRun(id, gate) {
    var wrap = el("div", "veil-game");
    var head = el("div", "veil-gamehead");
    var status = el("span", "", "SIGNAL RUN · 0 / " + gate.target + " · 3 lives");
    head.appendChild(status);
    var start = button("START", "veil-primary");
    head.appendChild(start);
    wrap.appendChild(head);
    var canvas = el("canvas", "veil-canvas");
    canvas.width = 480; canvas.height = 260;
    canvas.tabIndex = 0;
    wrap.appendChild(canvas);
    var left = button("◀", "veil-pad", function () { move(-1); });
    var right = button("▶", "veil-pad", function () { move(1); });
    var pad = el("div", "veil-pads");
    pad.appendChild(left); pad.appendChild(right);
    wrap.appendChild(pad);
    wrap.appendChild(el("p", "veil-hint", "Catch the falling packets. Arrow keys / A-D or the pads. Do not let three fall past."));
    var ctx = canvas.getContext("2d");
    var running = false, score = 0, lives = 3, timeLeft = gate.seconds || 24, packets = [], px = 224, dir = 0;
    var last = 0;
    var raf = 0;
    var spawn = 0;

    function reset() {
      score = 0; lives = 3; packets = []; timeLeft = gate.seconds || 24; px = 224; dir = 0;
      status.textContent = "SIGNAL RUN · 0 / " + gate.target + " · 3 lives";
    }
    function move(d) { dir = d; px += d * 24; px = Math.max(20, Math.min(440, px)); }
    function spawnPacket() {
      packets.push({ x: 28 + Math.random() * 420, y: -18, speed: 70 + Math.random() * 90 });
    }
    function draw() {
      ctx.fillStyle = "#06110d"; ctx.fillRect(0, 0, 480, 260);
      ctx.strokeStyle = "rgba(60,255,122,0.08)";
      for (var y = 0; y < 260; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(480, y); ctx.stroke(); }
      packets.forEach(function (p) {
        ctx.fillStyle = "#f4c56a"; ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
        ctx.strokeStyle = "rgba(244,197,106,0.3)"; ctx.strokeRect(p.x - 8, p.y - 8, 16, 16);
      });
      ctx.fillStyle = "#3cff7a";
      ctx.beginPath(); ctx.moveTo(px, 232); ctx.lineTo(px - 14, 252); ctx.lineTo(px + 14, 252); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.72)"; ctx.font = "11px Courier New";
      ctx.fillText("PACKETS " + score + "   LIVES " + lives + "   T-" + Math.ceil(timeLeft), 12, 20);
    }
    function loop(ts) {
      if (!running) return;
      if (!canvas.isConnected) { running = false; cancelAnimationFrame(raf); return; }
      if (!last) last = ts;
      var dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      timeLeft -= dt; px = Math.max(20, Math.min(440, px + dir * 220 * dt));
      spawn -= dt;
      if (spawn <= 0) { spawnPacket(); spawn = 0.55; }
      packets.forEach(function (p) { p.y += p.speed * dt; });
      var next = [];
      packets.forEach(function (p) {
        if (p.y > 224 && p.y < 258 && Math.abs(p.x - px) < 22) {
          score++;
          status.textContent = "SIGNAL RUN · " + score + " / " + gate.target + " · " + lives + " lives";
        } else if (p.y > 270) {
          lives--;
          status.textContent = "SIGNAL RUN · " + score + " / " + gate.target + " · " + lives + " lives";
        } else next.push(p);
      });
      packets = next;
      draw();
      if (score >= gate.target) {
        running = false; cancelAnimationFrame(raf);
        status.textContent = "SIGNAL LOCKED · " + score + " packets";
        wrap.classList.add("is-win");
        setTimeout(function () { unseal(id, "signal-run"); }, 500);
        return;
      }
      if (lives <= 0 || timeLeft <= 0) {
        running = false; cancelAnimationFrame(raf);
        status.textContent = "CHANNEL LOST · press START to retry";
        return;
      }
      raf = requestAnimationFrame(loop);
    }
    function startGame() {
      if (running) return;
      reset(); running = true; last = 0; spawn = 0;
      start.textContent = "RUNNING";
      wrap.classList.remove("is-win");
      draw();
      raf = requestAnimationFrame(loop);
      canvas.focus();
    }
    start.addEventListener("click", startGame);
    canvas.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { dir = -1; e.preventDefault(); }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { dir = 1; e.preventDefault(); }
    });
    canvas.addEventListener("keyup", function () { dir = 0; });
    canvas.addEventListener("blur", function () { dir = 0; });
    draw();
    return wrap;
  }

  function unseal(id, how) {
    if (solved(id)) { render(); return; }
    unlock(id, how);
    syncArchiveVisibility();
    // Re-render the dossier so the solved state is visible.
    renderDossier(id);
  }

  function calendarApp(body) {
    setApp(body);
    if (!V.seen) {
      app.classList.add("veil-app-hero");
      app.innerHTML = "";
      topBar("THE LONG LOST PC", "FIRST BOOT · A RECOVERED ARCHIVE");
      var introBox = el("div", "veil-intro");
      introBox.appendChild(el("p", "veil-kicker", "A STORY ABOUT A COMPUTER, A CALENDAR, AND THE THINGS WE LEAVE ON"));
      introBox.appendChild(el("h1", "", "It was already warm when you found it."));
      introBox.appendChild(el("p", "", "The desk says 14 March 1998. The note says the calendar works. You are the visitor. The owner left more than a computer, and less than a confession."));
      var rule = el("div", "veil-rule");
      rule.appendChild(el("b", "", "FIELD NOTE"));
      rule.appendChild(el("span", "", D.meta.disclaimer));
      introBox.appendChild(rule);
      var row = el("div", "veil-actions");
      row.appendChild(button("SIT DOWN", "veil-primary", function () { V.seen = true; save(); render("map"); }));
      row.appendChild(button("READ SOURCES", "raised", function () { V.seen = true; save(); render("sources"); }));
      introBox.appendChild(row);
      app.appendChild(introBox);
      return;
    }
    render("map");
  }

  function longlostApp(body) {
    setApp(body);
    app.classList.add("veil-app-hero");
    topBar(D.meta.title, "A LYGO temporal mystery");
    var box = el("div", "veil-intro short");
    box.appendChild(el("p", "veil-kicker", "THE DESK WAS LEFT ON FOR A REASON"));
    box.appendChild(el("h1", "", "A life is a room. A calendar is a door."));
    box.appendChild(el("p", "", "Open the calendar to travel between recovered dates. Each room is sealed by a puzzle, a story, or a minigame. Follow the links where they survived. The rest is the room."));
    var row = el("div", "veil-actions");
    row.appendChild(button("OPEN THE CALENDAR", "veil-primary", function () { V.seen = true; save(); H.open("calendar"); }));
    if (archiveUnlocked("echoes")) row.appendChild(button("ECHO VAULT", "raised", function () { H.open("echoes"); }));
    if (archiveUnlocked("voice")) row.appendChild(button("VOICE ARCHIVE", "raised", function () { H.open("voice"); }));
    if (archiveUnlocked("arcade")) row.appendChild(button("FORGE ARCADE", "raised", function () { H.open("arcade"); }));
    if (archiveUnlocked("plates")) row.appendChild(button("PLATE ARCHIVE", "raised", function () { H.open("plates"); }));
    if (archiveUnlocked("lygo-papers")) row.appendChild(button("LYGO PAPERS", "raised", function () { H.open("lygo-papers"); }));
    if (archiveUnlocked("lightfather")) row.appendChild(button("LIGHTFATHER PAPERS", "raised", function () { H.open("lightfather"); }));
    if (archiveUnlocked("openmic")) row.appendChild(button("OPEN MIC TAPES", "raised", function () { H.open("openmic"); }));
    if (archiveUnlocked("gallery")) row.appendChild(button("PHOTO JOURNAL", "raised", function () { H.open("gallery"); }));
    row.appendChild(button("OPEN LYGO TV", "raised", function () { H.open("veil-media"); }));
    box.appendChild(row);
    box.appendChild(el("p", "veil-foot", "Begin at 14 March 1998. The first word is a foundation."));
    app.appendChild(box);
  }

  function mediaApp(body) {
    setApp(body);
    topBar("LYGO TV / SIGNAL ROOM", "PUBLIC FEEDS · OPEN ROOM");
    var intro = el("p", "veil-kicker", "WATCH / LISTEN / RETURN");
    app.appendChild(intro);
    var row = el("div", "veil-actions");
    row.appendChild(button("OPEN SOURCE POOL", "veil-primary", function () {
      window.open("https://chatagent.ca/sources/", "_blank", "noopener");
    }));
    row.appendChild(button("OPEN SIGNAL", "raised", function () {
      window.open("https://chatagent.ca/signal/harmonic-architect/", "_blank", "noopener");
    }));
    app.appendChild(row);
    var frame = el("iframe", "veil-frame");
    frame.src = "https://chatagent.ca/sources/";
    frame.title = "LYGO TV public source pool";
    frame.loading = "lazy";
    frame.referrerPolicy = "no-referrer";
    app.appendChild(frame);
    var fallback = el("p", "veil-hint", "If the source pool blocks embedding, use the buttons above. The external link is the real path.");
    app.appendChild(fallback);
    var audio = el("audio");
    audio.controls = true; audio.preload = "none";
    audio.src = "https://chatagent.ca/signal/audio/harmonic-architect.mp3";
    app.appendChild(audio);
    app.appendChild(el("p", "veil-foot", "Public Signal audio. Streamed from chatagent.ca, not copied into this game."));
  }

  // Replace the old placeholder Day Page with the real calendar.
  H.files.forEach(function (f) {
    if (f.id === "calendar") {
      f.name = "The Calendar";
      f.desk = true;
      f.sealed = false;
      f.x = 104; f.y = 476; f.wide = 920; f.high = 650;
      f.icon = "old";
    }
  });

  var existing = {};
  H.files.forEach(function (f) { existing[f.id] = true; });
  if (!existing.longlost) {
    H.addFile({ id: "longlost", name: "The Long Lost PC", kind: "app", icon: "key", x: 8, y: 476, wide: 620, high: 440 });
  }
  if (!existing["veil-media"]) {
    H.addFile({ id: "veil-media", name: "LYGO TV / Signal", kind: "app", icon: "wire", x: 200, y: 476, wide: 720, high: 560 });
  }

  function ensureCandle() {
    var have = false;
    H.files.forEach(function (f) { if (f.id === "first-candle") have = true; });
    if (!have) {
      H.addFile({ id: "first-candle", name: "The First Candle", kind: "app", icon: "key", x: 8, y: 554, wide: 560, high: 400 });
      H.register("first-candle", function (body) {
        setApp(body);
        topBar("THE FIRST CANDLE", "A PRIVATE ROOM · AFTER 31 DEC 1980");
        var box = el("div", "veil-intro short");
        box.appendChild(el("p", "veil-kicker", "THE ANCHOR"));
        box.appendChild(el("h1", "", "The room was never in the index."));
        var choice = V.flags.birthdayChoice;
        box.appendChild(el("p", "", choice === "keep"
          ? "You kept the candle lit. The room is still warm. The calendar has a witness now, and the witness has a name."
          : "You blew the candle out and kept the warmth. The room is dark, but it is not gone. Some things are remembered better when they are not held too tightly."));
        box.appendChild(el("p", "veil-prose", "The machine cannot prove this date. It can only keep the shape of the choice. That is the difference between a record and a ritual."));
        var row = el("div", "veil-actions");
        row.appendChild(button("OPEN THE FINAL ROOM", "veil-primary", function () { H.open("calendar"); }));
        row.appendChild(button("RETURN TO THE DESK", "raised", function () { H.open("longlost"); }));
        box.appendChild(row);
        app.appendChild(box);
      });
      H.refresh();
    }
  }

  if (V.solved["1980-12-31"]) ensureCandle();
  H.register("longlost", longlostApp);
  H.register("calendar", calendarApp);
  H.register("veil-media", mediaApp);
  H.setSaverWord("HARMONY");

  // A first-visit nudge in the taskbar/saver is not intrusive; the desk itself
  // remains the existing LYGO 98 room.
})();


