/* HAVEN DESK — FORGE ARCADE.
   50 playable configurations across five real mechanics. The shared engine
   keeps the rules honest; each configuration has its own title, pressure and
   visual mood. No external libraries. */
(function () {
  "use strict";
  var H = window.HavenDesk;
  if (!H) return;
  if (!H.store.veil) H.store.veil = {};
  var V = H.store.veil;
  if (!V.arcade || typeof V.arcade !== "object") V.arcade = {};

  var MECHANICS = ["catch", "lights", "memory", "tuner", "timing"];
  var NAMES = {
    catch: ["Packet Run", "Carrier Wave", "Dead Drop", "Night Relay", "Last Packet", "Signal Sweep", "The Handoff", "Wire Runner", "Ghost Route", "Hold the Line"],
    lights: ["Lamp Logic", "Nine Lamps", "The Pattern Room", "Grid Memory", "Switchboard", "Cold Cathode", "The Corner Test", "Room Lights", "Relay Panel", "Afterimage"],
    memory: ["Echo Repeat", "The Witness", "Room Sequence", "Four Notes", "Candle Order", "Machine Recall", "The Long Pattern", "Signal Return", "Visitor Rhythm", "Memory Silt"],
    tuner: ["Dead Frequency", "Carrier Lock", "The Quiet Band", "Number Station", "Analog Drift", "The Tuning Fork", "Signal Floor", "Harmonic Gate", "Cold Tuner", "The Last Band"],
    timing: ["The Green Window", "One Beat", "Deadline", "The Clock Test", "Stop the Room", "Last Train", "Mercy Window", "The Hinge", "One Second", "Candle Flicker"]
  };
  var EPIGRAPHS = {
    catch: "A packet is a promise that something left.",
    lights: "The room is a pattern before it is a place.",
    memory: "A witness is a pattern that agrees to return.",
    tuner: "The signal is not the noise. It is the part that survives it.",
    timing: "The door opens for a moment, not forever."
  };

  var GAMES = [];
  MECHANICS.forEach(function (mech, mi) {
    for (var i = 0; i < 10; i++) {
      var n = mi * 10 + i;
      GAMES.push({
        id: "arcade-" + String(n + 1).padStart(2, "0"),
        number: n + 1,
        mech: mech,
        title: NAMES[mech][i],
        epigraph: EPIGRAPHS[mech],
        level: i + 1,
        goal: mech === "catch" ? 6 + i % 5 : 1,
        speed: 1 + i * 0.12,
        target: mech === "lights" ? ["010111010", "111010111", "101111101", "011111110", "110101011", "001111100", "111000111", "100111001", "011010110", "101010101"][i] : "",
        sequence: mech === "memory" ? [
          ["AMBER", "CYAN", "GREEN"],
          ["GREEN", "AMBER", "CYAN", "GREEN"],
          ["CYAN", "VIOLET", "AMBER", "CYAN"],
          ["AMBER", "GREEN", "VIOLET", "CYAN", "AMBER"],
          ["VIOLET", "CYAN", "GREEN", "AMBER"],
          ["GREEN", "GREEN", "AMBER", "CYAN", "VIOLET"],
          ["AMBER", "VIOLET", "CYAN", "GREEN", "AMBER", "CYAN"],
          ["CYAN", "AMBER", "GREEN", "GREEN", "VIOLET"],
          ["VIOLET", "GREEN", "AMBER", "CYAN", "GREEN"],
          ["AMBER", "CYAN", "AMBER", "VIOLET", "GREEN", "CYAN"]
        ][i] : [],
        tune: mech === "tuner" ? 30 + i * 6 : 0,
        tolerance: mech === "tuner" ? 5 - Math.floor(i / 3) : 0,
        zone: mech === "timing" ? 14 - i * 0.7 : 0,
        speedMs: mech === "timing" ? 1200 - i * 55 : 0
      });
    }
  });

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function btn(label, cls, fn) {
    var b = el("button", cls || "raised", label);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }
  function save() { H.save(); }

  function mount(host, game, onWin) {
    host.innerHTML = "";
    var wrap = el("div", "veil-mini");
    var status = el("p", "veil-mini-status", game.epigraph);
    var won = false;
    function win() {
      if (won) return;
      won = true;
      status.textContent = "GAME CLEARED · " + game.title;
      status.className = "veil-mini-status is-win";
      try { H.beep(660, 0.06); } catch (e) {}
      setTimeout(function () { if (onWin) onWin(game); }, 280);
    }
    function fail(msg) {
      status.textContent = msg || "The room resets.";
      status.className = "veil-mini-status is-fail";
    }

    if (game.mech === "catch") {
      var left = game.goal;
      var board = el("div", "veil-catchgrid");
      var cells = [];
      var timer = null;
      var target = -1;
      var score = el("p", "veil-mini-hint", "CATCH THE SIGNAL · " + left + " LEFT");
      for (var c = 0; c < 9; c++) {
        (function (idx) {
          var cell = btn("", "veil-catchcell", function () {
            if (won) return;
            if (idx === target) {
              left--; score.textContent = "CATCH THE SIGNAL · " + left + " LEFT";
              cell.classList.remove("is-target");
              target = -1;
              if (left <= 0) win();
            } else {
              fail("Wrong cell. The packet is elsewhere.");
            }
          });
          cells.push(cell); board.appendChild(cell);
        })(c);
      }
      function tick() {
        if (!wrap.isConnected) { clearInterval(timer); return; }
        if (target >= 0) cells[target].classList.remove("is-target");
        target = Math.floor(Math.random() * 9);
        cells[target].classList.add("is-target");
      }
      timer = setInterval(tick, Math.max(320, 760 - game.level * 38));
      wrap.appendChild(score); wrap.appendChild(board); wrap.appendChild(status);
      tick();
    } else if (game.mech === "lights") {
      var lval = "000000000";
      var grid = el("div", "veil-lightgrid");
      var lamps = [];
      for (var li = 0; li < 9; li++) {
        (function (index) {
          var lb = btn("", "veil-light", function () {
            var arr = lval.split("");
            arr[index] = arr[index] === "1" ? "0" : "1";
            lval = arr.join("");
            lb.classList.toggle("is-on", arr[index] === "1");
          });
          lamps.push(lb); grid.appendChild(lb);
        })(li);
      }
      wrap.appendChild(grid);
      wrap.appendChild(btn("SEND PATTERN", "veil-primary", function () {
        if (lval === game.target) win(); else fail("The pattern is " + lval + ". The room expected another shape.");
      }));
      var patternLabel = game.target.slice(0, 3) + " / " + game.target.slice(3, 6) + " / " + game.target.slice(6, 9);
      wrap.appendChild(el("p", "veil-mini-hint", "TARGET ROWS (1 = ON): " + patternLabel));
      wrap.appendChild(status);
    } else if (game.mech === "memory") {
      var pads = ["AMBER", "CYAN", "GREEN", "VIOLET"];
      var mseq = game.sequence;
      var at = 0;
      var mgrid = el("div", "veil-memory");
      var mstatus = el("p", "veil-mini-hint", "WATCH THE ROOM");
      pads.forEach(function (name) {
        var pb = btn(name, "veil-memorypad " + name.toLowerCase(), function () {
          if (won) return;
          if (mseq[at] === name) {
            at++; pb.classList.add("is-hit");
            setTimeout(function () { pb.classList.remove("is-hit"); }, 180);
            if (at >= mseq.length) win();
          } else {
            at = 0; fail("The pattern resets. Watch again."); play();
          }
        });
        mgrid.appendChild(pb);
      });
      function play() {
        var i = 0; mstatus.textContent = "WATCH THE ROOM";
        (function step() {
          if (!wrap.isConnected) return;
          if (i >= mseq.length) { mstatus.textContent = "REPEAT THE PATTERN"; return; }
          var name = mseq[i++];
          var p = mgrid.querySelector("." + name.toLowerCase());
          if (p) { p.classList.add("is-flash"); setTimeout(function () { p.classList.remove("is-flash"); }, 340); }
          setTimeout(step, 520);
        })();
      }
      wrap.appendChild(mgrid); wrap.appendChild(mstatus);
      wrap.appendChild(btn("REPLAY PATTERN", "raised", play));
      wrap.appendChild(status); play();
    } else if (game.mech === "tuner") {
      var range = document.createElement("input");
      range.type = "range"; range.min = "1"; range.max = "100"; range.value = "1";
      range.className = "veil-tuner";
      var reading = el("p", "veil-mini-hint", "CARRIER · 01");
      range.oninput = function () { reading.textContent = "CARRIER · " + String(range.value).padStart(2, "0"); };
      wrap.appendChild(range); wrap.appendChild(reading);
      wrap.appendChild(btn("LOCK CARRIER", "veil-primary", function () {
        if (Math.abs(Number(range.value) - game.tune) <= game.tolerance) win();
        else fail("The carrier is at " + range.value + ". The room is at " + game.tune + " ± " + game.tolerance + ".");
      }));
      wrap.appendChild(el("p", "veil-mini-hint", "Find the quiet band. The room will tell you."));
      wrap.appendChild(status);
    } else if (game.mech === "timing") {
      var bar = el("div", "veil-timingbar");
      var marker = el("div", "veil-timingmarker");
      var zone = el("div", "veil-timingzone");
      var pos = 0, dir = 1, raf = 0, last = 0;
      zone.style.left = (50 - game.zone / 2) + "%";
      zone.style.width = game.zone + "%";
      bar.appendChild(zone); bar.appendChild(marker);
      var tstatus = el("p", "veil-mini-hint", "STOP THE MARKER IN THE GREEN");
      function frame(t) {
        if (!wrap.isConnected || won) { cancelAnimationFrame(raf); return; }
        if (!last) last = t;
        var dt = Math.min(50, t - last); last = t;
        pos += dir * dt / game.speedMs * 100;
        if (pos >= 100) { pos = 100; dir = -1; }
        if (pos <= 0) { pos = 0; dir = 1; }
        marker.style.left = pos + "%";
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      wrap.appendChild(bar); wrap.appendChild(tstatus);
      wrap.appendChild(btn("STOP", "veil-primary", function () {
        if (Math.abs(pos - 50) <= game.zone / 2) win();
        else fail("The marker was at " + Math.round(pos) + ". The window is 50 ± " + (game.zone / 2).toFixed(1) + ".");
      }));
      wrap.appendChild(status);
    }
    host.appendChild(wrap);
    return wrap;
  }

  function solved() { return Object.keys(V.arcade).length; }
  function mark(id) { V.arcade[id] = { at: new Date().toISOString() }; save(); }

  H.register("arcade", function (body) {
    var app = el("div", "veil-app");
    body.appendChild(app);
    var state = { view: "list", game: null };
    function head(title, sub) {
      var top = el("div", "veil-top");
      var brand = el("div", "veil-brand");
      brand.appendChild(el("span", "veil-mark", "Δ9"));
      var copy = el("div");
      copy.appendChild(el("strong", "", title));
      copy.appendChild(el("small", "", sub));
      brand.appendChild(copy); top.appendChild(brand);
      top.appendChild(el("span", "veil-progress", solved() + " / " + GAMES.length + " CLEARED"));
      app.appendChild(top);
    }
    function list() {
      app.innerHTML = "";
      head("THE FORGE ARCADE", "50 GAMES · FIVE MECHANICS · NO FILLER");
      app.appendChild(el("p", "veil-hint", "Each cabinet is a room. Clear them for the archive; they do not unlock dates."));
      var grid = el("div", "veil-arcade-grid");
      GAMES.forEach(function (g) {
        var done = !!V.arcade[g.id];
        var card = btn("", "veil-arcade-card" + (done ? " is-done" : ""), function () {
          state = { view: "play", game: g }; play();
        });
        card.appendChild(el("span", "veil-node-date", String(g.number).padStart(2, "0") + " · " + g.mech));
        card.appendChild(el("strong", "", g.title));
        card.appendChild(el("small", "", done ? "cleared" : g.epigraph));
        grid.appendChild(card);
      });
      app.appendChild(grid);
    }
    function play() {
      app.innerHTML = "";
      var g = state.game;
      head(g.title, "CABINET " + String(g.number).padStart(2, "0") + " · " + g.mech.toUpperCase());
      app.appendChild(btn("← ARCADE", "veil-back", function () { state = { view: "list", game: null }; list(); }));
      app.appendChild(el("p", "veil-prose", g.epigraph));
      var host = el("div", "veil-mini-host");
      app.appendChild(host);
      mount(host, g, function () {
        mark(g.id);
        state = { view: "play", game: g };
        play();
      });
    }
    list();
  });

  H.addFile({ id: "arcade", name: "Forge Arcade", kind: "app", icon: "pairs", x: 488, y: 476, wide: 900, high: 660 });
  window.VEIL_ARCADE = { games: GAMES, mount: mount, mark: mark };
})();

