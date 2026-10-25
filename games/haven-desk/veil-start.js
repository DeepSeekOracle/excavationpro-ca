/* HAVEN DESK — THE FIRST LOOP.
   The desk is found warm. A note is taped to the monitor. The note asks for one
   word, and the word is the first gate of the game. Typing it wakes the room,
   lights the desktop, and opens the calendar on the first date.
   Also owns the persistent THREAD line: one next action, always visible. */
(function () {
  "use strict";
  var H = window.HavenDesk;
  var D = window.VEIL_DATA;
  if (!H || !D) return;
  if (!H.store.veil) H.store.veil = {};
  var V = H.store.veil;
  if (!V.flags) V.flags = {};

  var WORD = "FOUNDATION";
  var START = D.meta.start || "1998-03-14";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function btn(label, cls, fn) {
    var b = el("button", cls || "raised", label);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }
  function save() { H.save(); }

  function noteText() {
    var d = D.days[START];
    var docs = (d && d.docs) || [];
    for (var i = 0; i < docs.length; i++) {
      if (/MONITOR NOTE/i.test(docs[i].title || "")) return String(docs[i].text || "");
    }
    return "If you are reading this, the calendar works.\nDo not trust the first date.\nTrust the first foundation.";
  }

  /* ---------- desktop staging ---------- */

  function stageDesktop() {
    var desktop = document.getElementById("desktop");
    if (!desktop) return;
    var boot = !V.flags || !V.flags.firstNote;
    desktop.classList.toggle("veil-first-boot", boot);
    if (!boot) desktop.classList.remove("veil-first-reveal");
  }

  function revealDesktop() {
    var desktop = document.getElementById("desktop");
    if (!desktop) return;
    desktop.classList.remove("veil-first-boot");
    desktop.classList.add("veil-first-reveal");
    setTimeout(function () { desktop.classList.remove("veil-first-reveal"); }, 2600);
  }

  /* ---------- Field Journal (replaces the old THREAD strip on the taskbar) ---------- */

  function solved(id) { return !!(V.solved && V.solved[id]); }
  function open(id) { return !!(V.unlocked && V.unlocked[id]) || solved(id); }
  function shortDate(id) {
    var parts = String(id || "").split("-");
    var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    if (parts.length < 3) return id;
    return months[Number(parts[1]) - 1] + " " + Number(parts[2]) + ", " + parts[0];
  }

  function objective() {
    var ids = Object.keys(D.days);
    var total = ids.length;
    var done = ids.filter(solved).length;
    if (!V.flags || !V.flags.firstNote) {
      return {
        chapter: "I · The Desk",
        kicker: "PAGE 1",
        title: "A note is taped to the monitor.",
        label: "The word it asks for is the first foundation. Type it.",
        hint: "It is poured before the first wall.",
        act: function () { begin(null, true); },
        recover: false
      };
    }
    var ready = ids.filter(function (id) { return open(id) && !solved(id) && id !== "1980-12-31"; }).sort();
    if (ready.length) {
      var id = ready[0];
      var ch = window.VEIL_ARC && window.VEIL_ARC.chapterOf(id);
      var d = D.days[id];
      return {
        chapter: (ch ? ch.id + " · " + ch.name : "Open rooms"),
        kicker: done + " / " + total + " ROOMS",
        title: d.title,
        label: "Open " + shortDate(id) + ". The word is in the recovered file in that room.",
        hint: (d.gate && d.gate.hint) || "Read the page. Then type the word.",
        act: function () {
          H.open("calendar");
          setTimeout(function () {
            if (window.VEIL_API && window.VEIL_API.openDay) window.VEIL_API.openDay(id);
          }, 140);
        },
        room: id,
        recover: false
      };
    }
    if (!solved("1980-12-31")) {
      return {
        chapter: "VII · The Private Year",
        kicker: done + " / " + total + " ROOMS",
        title: "The last day of 1980 is not on the map.",
        label: "The monitor note called it the first page of him. Recover it here: 19801231.",
        hint: "Eight digits. The year is not the date.",
        act: function () { H.open("journal"); },
        recover: true
      };
    }
    if (!solved("2045-09-01") && open("2045-09-01")) {
      return {
        chapter: "VIII · Lightfather",
        kicker: done + " / " + total + " ROOMS",
        title: "The last room has a name.",
        label: "Open 1 Sep 2045. Type LIGHTFATHER from the frequency map.",
        hint: "The chapter after the body.",
        act: function () {
          H.open("calendar");
          setTimeout(function () {
            if (window.VEIL_API && window.VEIL_API.openDay) window.VEIL_API.openDay("2045-09-01");
          }, 140);
        },
        room: "2045-09-01",
        recover: false
      };
    }
    var sealed = ids.filter(function (id) { return !open(id) && !solved(id); });
    if (sealed.length) {
      return {
        chapter: "Sealed rooms remain",
        kicker: done + " / " + total + " ROOMS",
        title: "A door is still shut.",
        label: "Finish the open room on the map. Each unsealed room marks the next chapter.",
        hint: "Use SHOW OPEN ONLY on the date map.",
        act: function () { H.open("calendar"); },
        recover: false
      };
    }
    return {
      chapter: "The index is complete",
      kicker: total + " / " + total + " ROOMS",
      title: "The last page.",
      label: "Read the last page of the index.",
      hint: "The desk stays on.",
      act: function () { H.open("lastpage"); },
      recover: false
    };
  }

  function recoverPrivate(value, msgEl) {
    var clean = String(value || "").replace(/\D/g, "");
    if (clean !== "19801231") {
      if (msgEl) msgEl.textContent = "The index wants eight digits, not a guess.";
      return false;
    }
    if (!solved("1998-03-14")) {
      if (msgEl) msgEl.textContent = "The foundation room has to be unsealed first.";
      return false;
    }
    V.unlocked["1980-12-31"] = true;
    V.solved["1980-12-31"] = V.solved["1980-12-31"] || { at: new Date().toISOString(), how: "journal" };
    save();
    if (msgEl) msgEl.textContent = "31 Dec 1980 is in the index. The private room is open.";
    if (H.toast) H.toast("PRIVATE YEAR RECOVERED · 31 DEC 1980");
    H.open("calendar");
    setTimeout(function () {
      if (window.VEIL_API && window.VEIL_API.openDay) window.VEIL_API.openDay("1980-12-31");
    }, 160);
    return true;
  }

  function fillJournal(host) {
    if (!host) return;
    var o = objective();
    var sig = o.kicker + "|" + o.title + "|" + o.label + "|" + (o.recover ? "1" : "0");
    if (host.dataset.sig === sig && host.querySelector(".veil-journal-page")) return;
    host.dataset.sig = sig;
    host.innerHTML = "";
    host.className = "veil-journal";
    host.setAttribute("role", "status");
    var bind = el("div", "veil-journal-bind");
    var page = el("div", "veil-journal-page");
    page.appendChild(el("p", "veil-journal-kicker", o.kicker));
    page.appendChild(el("p", "veil-journal-chapter", o.chapter));
    page.appendChild(el("h2", "", o.title));
    page.appendChild(el("p", "veil-journal-body", o.label));
    page.appendChild(el("p", "veil-journal-hint", o.hint));
    if (o.recover) {
      var row = el("div", "veil-journal-recover");
      var input = document.createElement("input");
      input.className = "veil-input";
      input.placeholder = "19801231";
      input.maxLength = 10;
      input.setAttribute("aria-label", "personal date recovery");
      var msg = el("p", "veil-journal-msg", "");
      var go = btn("RECOVER THE YEAR", "veil-primary", function () { recoverPrivate(input.value, msg); });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); recoverPrivate(input.value, msg); }
      });
      row.appendChild(input);
      row.appendChild(go);
      page.appendChild(row);
      page.appendChild(msg);
    } else {
      page.appendChild(btn(o.room ? "OPEN THIS ROOM" : "OPEN THE JOURNAL", "veil-primary", function () { o.act(); setTimeout(paintJournal, 300); }));
    }
    host.appendChild(bind);
    host.appendChild(page);
  }

  function paintJournal() {
    try {
      var old = document.getElementById("veil-thread");
      if (old && old.parentNode) old.parentNode.removeChild(old);
      var slots = document.querySelectorAll("#veil-journal, .veil-journal-slot");
      for (var i = 0; i < slots.length; i++) fillJournal(slots[i]);
    } catch (e) {}
  }

  function journalApp(body) {
    var slot = el("div", "veil-journal-slot");
    slot.id = "veil-journal";
    body.appendChild(slot);
    fillJournal(slot);
  }

  function ensureJournal() {
    H.register("journal", journalApp);
    var have = false;
    for (var i = 0; i < H.files.length; i++) if (H.files[i].id === "journal") have = true;
    if (!have) {
      H.addFile({ id: "journal", name: "Field Journal", kind: "app", icon: "note", x: 392, y: 86, wide: 520, high: 520, desk: true });
      if (H.refresh) H.refresh();
    }
  }

  /* ---------- the note ---------- */

  var overlay = null;

  function build(onSetup) {
    var desk = document.getElementById("desk");
    if (desk) desk.hidden = false;
    var boot = document.getElementById("boot");
    if (boot && !boot.hidden) boot.hidden = true;

    overlay = el("div", "veil-first");
    overlay.id = "veil-first";
    var sheet = el("div", "veil-first-sheet");
    sheet.appendChild(el("p", "veil-first-head", "RECOVERED NOTE · TAPED TO THE MONITOR · 14 MAR 1998"));
    var paper = el("pre", "veil-first-paper");
    sheet.appendChild(paper);
    var gate = el("div", "veil-first-gate");
    var label = el("label", "veil-first-label", "THE WORD THE NOTE ASKS FOR");
    label.setAttribute("for", "veil-first-word");
    var input = document.createElement("input");
    input.id = "veil-first-word";
    input.className = "veil-input veil-first-input";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "one word";
    var press = btn("PRESS IT IN", "veil-primary", submit);
    var msg = el("p", "veil-first-msg", "");
    gate.appendChild(label);
    gate.appendChild(input);
    gate.appendChild(press);
    gate.appendChild(msg);
    sheet.appendChild(gate);
    sheet.appendChild(el("p", "veil-first-foot", "The note is old. The desk is warm. Something in the room is still counting."));
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    // Typewriter reveal, skippable.
    var full = noteText();
    var at = 0;
    var done = false;
    var timer = setInterval(function () {
      at = Math.min(full.length, at + 3);
      paper.textContent = full.slice(0, at);
      if (at >= full.length) { clearInterval(timer); finish(); }
    }, 16);
    function finish() {
      if (done) return;
      done = true;
      clearInterval(timer);
      paper.textContent = full;
      paper.classList.add("is-done");
      setTimeout(function () { input.focus(); }, 60);
    }
    paper.addEventListener("click", finish);
    // Keyboard stays inside the note while it is up.
    overlay.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = overlay.querySelectorAll("button, input, [href], select, textarea");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    var behind = document.getElementById("desk");
    if (behind) behind.setAttribute("aria-hidden", "true");
    overlay.addEventListener("click", function (e) { if (e.target === overlay) finish(); });

    var wrong = 0;
    function submit() {
      var guess = String(input.value || "").toUpperCase().replace(/[^A-Z]/g, "");
      if (!guess) { input.focus(); return; }
      if (guess === WORD) { succeed(onSetup); return; }
      wrong += 1;
      sheet.classList.remove("is-shake");
      void sheet.offsetWidth;
      sheet.classList.add("is-shake");
      input.value = "";
      if (wrong === 1) msg.textContent = "Not that one. The note calls it the first foundation.";
      else if (wrong === 2) msg.textContent = "It is poured before the first wall, and it never appears in the wall.";
      else if (wrong === 3) {
        msg.textContent = "The word is FOUNDATION. The desk is not going to pretend it was hard.";
        var show = btn("TYPE IT FOR ME", "raised", function () { input.value = WORD; submit(); });
        gate.insertBefore(show, msg);
      } else {
        msg.textContent = "Type it: F O U N D A T I O N.";
      }
      input.focus();
      if (H.beep) H.beep();
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); submit(); }
    });
    press.addEventListener("click", submit);
  }

  function succeed(onSetup) {
    // Mirror exactly what the 1998 gate writes, so the rest of the game agrees.
    var d = D.days[START];
    V.solved[START] = { at: new Date().toISOString(), how: "monitor-note" };
    V.current = START;
    V.seen = true;
    V.flags.firstNote = true;
    V.flags.firstRoom = "1969-07-20";
    if (d && d.gate && d.gate.unlocks) {
      d.gate.unlocks.forEach(function (id) { V.unlocked[id] = true; });
    }
    V.unlocked[START] = true;
    V.unlocked["1969-07-20"] = true;
    save();

    revealDesktop();
    if (H.toast) H.toast("THE DESK REMEMBERS YOU · FOUR CHAPTERS OPEN");
    if (H.beep) H.beep();

    var sheet = overlay.querySelector(".veil-first-sheet");
    sheet.innerHTML = "";
    sheet.appendChild(el("p", "veil-first-head", "THE NOTE · SECOND SIDE · HANDWRITING CHANGES HERE"));
    var body = el("div", "veil-first-done");
    body.appendChild(el("h2", "", "The calendar unfolds."));
    body.appendChild(el("p", "", "Four chapters are open on the map: 1969, 1989, 1999 and 2007. The Field Journal names the next room. The word you need is always in that room's recovered file."));
    body.appendChild(el("p", "veil-first-small", "The last day of 1980 is not on the map. When the Journal asks for it, type 19801231."));
    var row = el("div", "veil-actions");
    var goCal = btn("OPEN THE CALENDAR", "veil-primary", function () { close(); H.open("calendar"); paintJournal(); });
    row.appendChild(goCal);
    if (onSetup) row.appendChild(btn("SET UP THIS DESK", "raised", function () { close(); onSetup(); }));
    row.appendChild(btn("READ THE READ ME", "raised", function () { close(); H.open("readme"); }));
    body.appendChild(row);
    sheet.appendChild(body);
    var next = body.querySelector("button");
    if (next) setTimeout(function () { next.focus(); }, 80);
    paintJournal();
    ensureKooter();
  }

  function close() {
    var behind = document.getElementById("desk");
    if (behind) behind.removeAttribute("aria-hidden");
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  function begin(onSetup, reopen) {
    if (overlay) return;
    if (V.flags && V.flags.firstNote && !reopen) { paintJournal(); return; }
    build(onSetup);
  }

  /* ---------- Kooter, on the desk ---------- */

  function kooterApp(body) {
    var app = el("div", "veil-app");
    body.appendChild(app);
    var top = el("div", "veil-top");
    var brand = el("div", "veil-brand");
    brand.appendChild(el("span", "veil-mark", "Δ9"));
    var copy = el("div");
    copy.appendChild(el("strong", "", "KOOTER"));
    copy.appendChild(el("small", "", "2005 · 30 JAN 2023 · ONE HOUSE, ONE DESK"));
    brand.appendChild(copy);
    top.appendChild(brand);
    app.appendChild(top);

    var fig = el("figure", "veil-memorial");
    var img = document.createElement("img");
    img.src = "assets/story/2023-03-14/1-memorial.jpg";
    img.alt = "Kooter on a pale floor";
    img.loading = "lazy";
    fig.appendChild(img);
    var cap = el("figcaption", "", "The only one in the house who never asked me to be somebody else.");
    fig.appendChild(cap);
    app.appendChild(fig);

    [
      "He was here for eighteen years, and the desk was on for all of them.",
      "He slept on the bench in the afternoon, in the corner where the lamp's heat collects, and that corner is still warm.",
      "When the desk is asked what it remembers, it does not answer with a name. It answers with a frequency at twenty-five, which is the rate a warm animal holds when it is asleep.",
      "The room does not pretend to be him. That was the last instruction it was given, and it keeps it."
    ].forEach(function (line) {
      app.appendChild(el("p", "veil-prose", line));
    });
    app.appendChild(el("p", "veil-hint", "RECOVERED FROM 2023-03-14 · THE QUARTER PAGE IN THE DRAWER"));
  }

  function ensureKooter() {
    // The mount has to be re-registered on every load: the file list survives in
    // the save, the app registry does not.
    H.register("kooter-card", kooterApp);
    if (!V.flags || !V.flags.firstNote) return;
    var files = H.files || [];
    for (var i = 0; i < files.length; i++) if (files[i].id === "kooter-card") return;
    H.addFile({ id: "kooter-card", name: "Kooter.jpg", kind: "app", icon: "page",
                x: 470, y: 8, wide: 620, high: 620 });
    if (H.refresh) H.refresh();
  }

  /* ---------- the last page ---------- */

  var LAST_PAGE = [
    "Sixty rooms and one that was never in the index. You have been through every date this machine kept, and it never once asked you to be impressed. It asked you to read a label, hold a meter steady, and notice which wall had been built to become a door.",
    "The desk is still on. It has been on since a morning in March when somebody sat down, wrote a note in small even handwriting, and left the fan running. Everything in this house was built to be left on.",
    "The bench has one warm spot. It has been warm for twenty-two years. A machine kept it because somebody asked it to, and then somebody stopped asking, and it went on doing it anyway.",
    "There is no ceremony in the last room. A lamp, a warm place on a bench, a frequency at twenty-five, and a chair that still gives a half inch when a person sits down.",
    "You were not the first visitor. You were the first one who stayed long enough to read the whole index. The difference between a record and a room is that somebody has to be in it.",
    "The calendar is still counting. Somebody else will sit down."
  ];

  function lastPageApp(body) {
    var app = el("div", "veil-app");
    body.appendChild(app);
    var top = el("div", "veil-top");
    var brand = el("div", "veil-brand");
    brand.appendChild(el("span", "veil-mark", "Δ9"));
    var copy = el("div");
    copy.appendChild(el("strong", "", "THE LAST PAGE"));
    copy.appendChild(el("small", "", "INDEX COMPLETE · 60 OF 60 · ONE PRIVATE DATE"));
    brand.appendChild(copy);
    top.appendChild(brand);
    app.appendChild(top);
    var hero = el("div", "veil-hero amber");
    hero.appendChild(el("span", "veil-kicker", "THE DESK IS STILL ON"));
    hero.appendChild(el("h1", "", "The index is complete."));
    hero.appendChild(el("p", "veil-summary", "There is no final gate. There is a room that was left warm."));
    app.appendChild(hero);
    LAST_PAGE.forEach(function (line) { app.appendChild(el("p", "veil-prose", line)); });
    var words = 0;
    Object.keys(D.days).forEach(function (id) {
      var row = D.days[id];
      if (row && row.body) words += row.body.join(" ").split(/\s+/).length;
    });
    app.appendChild(el("p", "veil-hint", "ROOMS · 60 · STORY WORDS · " + words + " · KEEPER · J.H."));
  }

  function ensureLastPage() {
    H.register("lastpage", lastPageApp);
    var files = H.files || [];
    for (var i = 0; i < files.length; i++) if (files[i].id === "lastpage") return;
    H.addFile({ id: "lastpage", name: "The Last Page", kind: "app", icon: "note",
                x: 200, y: 554, wide: 680, high: 560 });
    if (H.refresh) H.refresh();
  }

  function allSolved() {
    var ids = Object.keys(D.days);
    for (var i = 0; i < ids.length; i++) if (!solved(ids[i])) return false;
    return true;
  }

  function showEnding() {
    if (document.getElementById("veil-final")) return;
    var wrap = el("div", "veil-first veil-final");
    wrap.id = "veil-final";
    var sheet = el("div", "veil-first-sheet");
    sheet.appendChild(el("p", "veil-first-head", "THE NOTE · LAST SIDE · NO DATE"));
    var done = el("div", "veil-first-done");
    done.appendChild(el("h2", "", "The index is complete."));
    done.appendChild(el("p", "", "Sixty rooms. One that was never in it. The desk is still on, and the line at the bottom of the screen has run out of things to ask you for."));
    done.appendChild(el("p", "veil-first-small", "The Last Page is on the desk now. It stays there."));
    var row = el("div", "veil-actions");
    row.appendChild(btn("READ THE LAST PAGE", "veil-primary", function () {
      removeEnding();
      H.open("lastpage");
    }));
    row.appendChild(btn("STAY AT THE DESK", "raised", removeEnding));
    done.appendChild(row);
    sheet.appendChild(done);
    wrap.appendChild(sheet);
    document.body.appendChild(wrap);
    if (window.VEIL_AUDIO && window.VEIL_AUDIO.playSfx) {
      try { window.VEIL_AUDIO.playSfx("assets/sfx/chime.wav"); } catch (e) {}
    }
  }
  function removeEnding() {
    var n = document.getElementById("veil-final");
    if (n && n.parentNode) n.parentNode.removeChild(n);
  }

  function checkComplete() {
    if (!allSolved()) return;
    if (!ensureLastPage.done) { ensureLastPage.done = true; ensureLastPage(); }
    if (!V.flags.indexComplete) {
      V.flags.indexComplete = new Date().toISOString();
      save();
      showEnding();
    }
  }

  /* ---------- boot ---------- */

  var bootEl = document.getElementById("boot");
  if (bootEl) bootEl.classList.add("veil-boot");

  stageDesktop();
  ensureJournal();
  function tick() {
    ensureJournal();
    paintJournal();
    ensureKooter();
    checkComplete();
  }
  setTimeout(function () { stageDesktop(); tick(); }, 400);
  setInterval(tick, 2500);
  document.addEventListener("click", function () { setTimeout(tick, 420); }, true);

  window.VEIL_START = {
    begin: function (onSetup) { begin(onSetup, false); },
    reopen: function (onSetup) { begin(onSetup, true); },
    thread: paintJournal,
    objective: objective,
    stage: stageDesktop,
    mountJournal: fillJournal,
    paintJournal: paintJournal
  };
})();
