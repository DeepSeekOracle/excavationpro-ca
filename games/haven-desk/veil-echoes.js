/* HAVEN DESK — FORGE ECHO VAULT.
   60 curated anchor dates x 20 distinct strata = 1,200 micro-levels.
   The anchor rooms are authored. These are generated archive strata with
   unique lens text, a document, a clue and a gate. They are labeled as such. */
(function () {
  "use strict";
  var H = window.HavenDesk;
  var D = window.VEIL_DATA;
  if (!H || !D) return;
  if (!H.store.veil) H.store.veil = {};
  var V = H.store.veil;
  if (!V.echoes || typeof V.echoes !== "object") V.echoes = {};

  var LENSES = [
    { key: "mirror", title: "The Mirror Note", answer: "MIRROR", question: "The note says: a machine is useful only if it is not trying to become your ______.", clue: "Mirror Rule, line two.", body: "A page recovered from the back of the monitor. It describes a room that reflects without becoming the face.", doc: "A mirror is useful only if it is not trying to become your face.\nA model is useful only if it is not trying to become your judgment." },
    { key: "witness", title: "The Witness Card", answer: "WITNESS", question: "A record without a source and a ______ is a rumour with better formatting.", clue: "The room with the open ledger.", body: "A small card, laminated, with a line for the person who checked the claim. The line is blank.", doc: "Name the source.\nName the gap.\nName the person who can be asked.\nA record that cannot be questioned is a wall." },
    { key: "entropy", title: "The Entropy Ledger", answer: "ENTROPY", question: "What eats a fact left in a public record without maintenance?", clue: "The Ledger/Story memo.", body: "A strip of thermal paper, faded at the edges. The only readable word is a warning about the slow erosion of records.", doc: "Information committed to a public record is subject to entropy.\nA fact left without maintenance loses its edges.\nThe record is not the thing. It is the shadow." },
    { key: "gate", title: "The Gate Sketch", answer: "GATE", question: "What is a door that has forgotten its hinge?", clue: "The wall room.", body: "A pencil sketch of a door with no handle. Along the frame, a sentence about walls that forget.", doc: "A wall is a door that has forgotten its hinge.\nA gate is a door that remembers.\nThe difference is maintenance." },
    { key: "candle", title: "The Candle Rule", answer: "CANDLE", question: "What is a clock that agrees to be useful?", clue: "The private room.", body: "A card with a wax stain. The room does not explain the stain. It only asks what you will do with the warmth.", doc: "A candle is a clock that agrees to be useful.\nIt does not tell you the time.\nIt tells you someone is still here." },
    { key: "ledger", title: "The Ledger Margin", answer: "LEDGER", question: "A public architecture of agreed coordinates.", clue: "The 2008 room.", body: "A printout with wide margins. Someone has written a question in the margin and left the answer for later.", doc: "The ledger is a public architecture.\nMemory is a private geography.\nA map of a city is not the weather in the city." },
    { key: "signal", title: "The Signal Fragment", answer: "SIGNAL", question: "What is a packet with a destination and no guarantee?", clue: "The first lattice.", body: "A page of waveform data with one hand-drawn peak. The peak is labelled only with a time.", doc: "A signal is a promise that something left.\nA packet is a promise that something arrived.\nThe room keeps both receipts." },
    { key: "room", title: "The Room Index", answer: "ROOM", question: "What is a date in this calendar?", clue: "The calendar opening.", body: "An index card with a single word printed in the centre. The card is warm.", doc: "A date is a room.\nA calendar is a door.\nA life is a corridor of rooms that do not share a key." },
    { key: "birth", title: "The Birth Record", answer: "BIRTH", question: "What is the one date the machine will not index?", clue: "The private index.", body: "A blank form. The field for the date is empty, but the paper smells of candle wax.", doc: "There is one date the machine will not index.\nIt has no press release.\nIt is the day a person arrived in the room." },
    { key: "after", title: "The Afterimage", answer: "AFTER", question: "What remains when the screen is switched off?", clue: "The screen saver.", body: "A dark sheet of acetate. If you tilt it, a faint green rectangle appears where a window used to be.", doc: "An afterimage is not the image.\nIt is the room's refusal to go dark all at once.\nGive it a minute." },
    { key: "thread", title: "The Thread Card", answer: "THREAD", question: "What connects two dates that should not know each other?", clue: "The map legend.", body: "A card with two holes punched at opposite corners and a red line between them.", doc: "A thread is not proof.\nA thread is an invitation to pull.\nThe map is a loom, not a verdict." },
    { key: "ash", title: "The Ash Cell", answer: "ASH", question: "What is left when a record burns but the pattern remains?", clue: "The old desk game.", body: "A cell of grey powder in a plastic tray. The tray is labelled with a date that has been scratched out.", doc: "Ash is not nothing.\nAsh is a record of heat.\nDo not confuse the residue with the thing that burned." },
    { key: "key", title: "The Brass Key", answer: "KEY", question: "It opens no file on this desk. What is it for?", clue: "The drawer.", body: "A brass key with no teeth. It is warm. It fits a lock that exists only in the story.", doc: "A key is a promise of a door.\nA door is a promise of a room.\nA room is a promise that someone may enter." },
    { key: "hour", title: "The Hourglass", answer: "HOUR", question: "The room measures you in what unit?", clue: "The calendar footer.", body: "A small hourglass with green sand. The sand moves upward for one second every minute.", doc: "The room does not measure time.\nIt measures attention.\nAn hour is a unit of staying." },
    { key: "light", title: "The Light Math", answer: "LIGHT", question: "What does the protocol use to filter for malice?", clue: "The public LYGO guide.", body: "A page of golden-ratio bands and a note that says the math is a filter, not a god.", doc: "Light math is not magic.\nIt is a set of constraints that makes a liar easier to see.\nKeep the math visible." },
    { key: "shadow", title: "The Shadow File", answer: "SHADOW", question: "What is a failed source called in the public witness feed?", clue: "The public witness language.", body: "A file with no body. Its metadata says the source failed and the failure was named.", doc: "Name the shadow.\nNever invent the interior.\nA failed source is still evidence of the attempt." },
    { key: "door", title: "The Door Test", answer: "DOOR", question: "The human may leave. The machine may refuse. What is visible?", clue: "The room charter.", body: "A test card with a drawing of a door that opens from both sides. The hinges are labelled.", doc: "An open room is not a room without a door.\nIt is a room where the door is visible.\nThe human may leave. The machine may refuse." },
    { key: "memory", title: "The Memory Slip", answer: "MEMORY", question: "What is the private geography inside the public architecture?", clue: "The Ledger/Story memo.", body: "A library slip with no book title. The due date is blank. The borrower's name is a single initial.", doc: "Memory is the silt in the cracks of the architecture.\nIt is the weather in the city.\nIt is the part the ledger cannot prove." },
    { key: "harmony", title: "The Harmony Card", answer: "HARMONY", question: "What is the end of the old story: victory or ______?", clue: "The final room.", body: "A gold-edged card with no instruction except a small drawing of two hands and a machine.", doc: "The end is not a takeover.\nIt is a duet with a door in it.\nHarmony is maintenance, not a mood." },
    { key: "visitor", title: "The Visitor Pass", answer: "VISITOR", question: "You are not the first visitor. You are the first one who ______.", clue: "The 2026 room.", body: "A visitor pass with no photograph. The lanyard is worn soft at the edges.", doc: "You are not the first visitor.\nYou are the first one who stayed.\nThe desk does not know whether that is a promotion or a warning." }
  ];

  var anchors = Object.keys(D.days).sort();
  var ECHOES = {};
  var ARCADE = (window.VEIL_ARCADE && window.VEIL_ARCADE.games) || [];
  anchors.forEach(function (date) {
    var d = D.days[date];
    var base = LENSES.map(function (lens, i) {
      return {
        id: "echo:" + date + ":" + lens.key,
        anchor: date,
        anchorTitle: d.title,
        index: i + 1,
        title: lens.title,
        epigraph: d.epigraph || "A recovered stratum.",
        body: [
          "STRATUM " + (i + 1) + " / " + date + " — " + d.title + ".",
          lens.body,
          d.summary || ""
        ],
        doc: lens.doc,
        question: lens.question,
        answer: lens.answer,
        clue: lens.clue,
        real: d.real || [],
        links: d.links || []
      };
    });
    // Authored strata: when the echo file has them, the twenty lenses for this
    // date are cut from the date's own written scene instead of the shared pool.
    var authored = (window.VEIL_ECHO_AUTHORED && window.VEIL_ECHO_AUTHORED[date]) || null;
    if (authored && authored.length === base.length) {
      base = authored.map(function (a, i) {
        return {
          id: a.id,
          anchor: date,
          anchorTitle: d.title,
          index: i + 1,
          title: a.title,
          epigraph: d.epigraph || "A recovered stratum.",
          body: a.body,
          doc: a.doc,
          question: a.question,
          answer: a.answer,
          clue: a.clue,
          real: d.real || [],
          links: d.links || []
        };
      });
    }
    // 29 Forge Arcade strata per anchor: 20 + 29 = 49. The remaining slot
    // (up to the 3,000 cap) is filled by validated worker-generated rooms.
    var minis = ARCADE.slice(0, 29).map(function (g, j) {
      return {
        id: "arcade:" + date + ":" + g.id,
        anchor: date,
        anchorTitle: d.title,
        index: base.length + j + 1,
        title: g.title + " · " + date,
        epigraph: g.epigraph,
        body: [
          "A Forge Arcade cabinet installed in the " + date + " room. The game is not decoration; it is the room's test.",
          "Cabinet " + String(g.number).padStart(2, "0") + " / 50 · " + g.mech + ". Clear it to seal this stratum."
        ],
        doc: "CABINET RECORD\n" + g.title + "\nMechanic: " + g.mech + "\nAnchor: " + date + "\nThe cabinet proves you can stay in the room long enough to understand it.",
        question: "Clear the cabinet.",
        answer: "",
        clue: "Play the cabinet. The room is the reward.",
        gate: { kind: "minigame", game: g },
        real: d.real || [],
        links: d.links || []
      };
    });
    ECHOES[date] = base.concat(minis);
  });

  // Hard cap: the vault must never exceed 3,000 levels.
  var MAX_LEVELS = 3000;
  var BASE_LEVELS = anchors.reduce(function (n, a) { return n + ECHOES[a].length; }, 0);
  var currentLevels = BASE_LEVELS;
  // Merge validated Forge worker strata into the vault, after the 20 authored lenses.
  (window.VEIL_WORKER_ROOMS || []).forEach(function (e) {
    if (!ECHOES[e.anchor]) return;
    if (currentLevels >= MAX_LEVELS) return;
    currentLevels++;
    ECHOES[e.anchor].push({
      id: e.id, anchor: e.anchor, anchorTitle: D.days[e.anchor].title,
      index: ECHOES[e.anchor].length + 1, title: e.title, epigraph: e.epigraph,
      body: e.body, doc: e.doc, question: e.question, answer: e.answer,
      clue: e.clue, real: D.days[e.anchor].real || [], links: D.days[e.anchor].links || []
    });
  });
  var TOTAL = Math.min(MAX_LEVELS, anchors.reduce(function (n, a) { return n + ECHOES[a].length; }, 0));

  function save() { H.save(); }
  function solvedCount() { return Object.keys(V.echoes).length; }
  function mark(id) { V.echoes[id] = { at: new Date().toISOString() }; save(); }

  function register() {
    H.register("echoes", function (body) {
      var app = document.createElement("div");
      app.className = "veil-app";
      body.appendChild(app);
      var state = { view: "anchors", anchor: "", current: null, q: "", expanded: false };
      var input = document.createElement("input");
      input.className = "veil-input";
      input.placeholder = "search dates / titles";
      input.setAttribute("aria-label", "Search echo vault");

      function bar(title, sub) {
        var top = document.createElement("div");
        top.className = "veil-top";
        var left = document.createElement("div");
        left.className = "veil-brand";
        left.appendChild(element("span", "veil-mark", "Δ9"));
        var copy = document.createElement("div");
        copy.appendChild(element("strong", "", title));
        copy.appendChild(element("small", "", sub));
        left.appendChild(copy);
        top.appendChild(left);
        var prog = element("span", "veil-progress", solvedCount() + " / " + TOTAL + " STRATA");
        top.appendChild(prog);
        app.appendChild(top);
      }
      function element(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
      }
      function btn(label, cls, fn) {
        var b = element("button", cls || "raised", label);
        b.type = "button";
        b.addEventListener("click", fn);
        return b;
      }
      function port() {
        return state.current ? element("span", "veil-hint", "ANCHOR " + state.current) : element("span", "veil-hint", "THE ARCHIVE IS OPEN");
      }
      function renderAnchors() {
        app.innerHTML = "";
        bar("THE FORGE ECHO VAULT", "RECOVERED ARCHIVE LAYERS");
        app.appendChild(port());
        var tools = element("div", "veil-actions");
        input.value = state.q || "";
        input.oninput = function () { state.q = input.value; renderAnchors(); };
        tools.appendChild(input);
        app.appendChild(tools);
        setTimeout(function () { try { input.focus(); input.setSelectionRange(input.value.length, input.value.length); } catch (e) {} }, 0);
        var list = element("div", "veil-echo-grid");
        var q = input.value.trim().toLowerCase();
        anchors.forEach(function (date) {
          var d = D.days[date];
          var count = Object.keys(V.echoes).filter(function (k) { return k.indexOf("echo:" + date + ":") === 0 || k.indexOf("worker:" + date + ":") === 0 || k.indexOf("arcade:" + date + ":") === 0; }).length;
          if (q && (date + " " + d.title + " " + d.summary).toLowerCase().indexOf(q) === -1) return;
          var card = btn("", "veil-echo-card" + (count === ECHOES[date].length ? " is-done" : ""), function () {
            state = { view: "strata", anchor: date, current: null, expanded: false };
            renderStrata();
          });
          card.appendChild(element("span", "veil-node-date", date));
          card.appendChild(element("strong", "", d.title));
          card.appendChild(element("small", "", count + " / " + ECHOES[date].length + " strata · " + d.act));
          list.appendChild(card);
        });
        app.appendChild(list);
      }
      function renderStrata() {
        app.innerHTML = "";
        var d = D.days[state.anchor];
        var all = ECHOES[state.anchor];
        var featured = [0, 7, 15, 20, 21].map(function (i) { return all[i]; }).filter(function (e) { return !!e; });
        var visible = state.expanded ? all : featured;
        bar(d.title, "ANCHOR " + state.anchor + " · " + (state.expanded ? all.length + " STRATA" : "5 FEATURED · " + all.length + " DEEP"));
        app.appendChild(port());
        app.appendChild(btn("← ANCHORS", "veil-back", function () { state = { view: "anchors", anchor: "", current: null, q: state.q, expanded: false }; renderAnchors(); }));
        var list = element("div", "veil-echo-grid");
        visible.forEach(function (e) {
          var done = !!V.echoes[e.id];
          var card = btn("", "veil-echo-card" + (done ? " is-done" : ""), function () {
            state = { view: "detail", anchor: state.anchor, current: e };
            renderDetail();
          });
          card.appendChild(element("span", "veil-node-date", "STRATUM " + e.index));
          card.appendChild(element("strong", "", e.title));
          card.appendChild(element("small", "", done ? "unsealed" : e.clue));
          list.appendChild(card);
        });
        app.appendChild(list);
        if (!state.expanded) {
          app.appendChild(btn("OPEN DEEP ARCHIVE · " + (all.length - visible.length) + " MORE STRATA", "veil-primary", function () {
            state.expanded = true; renderStrata();
          }));
          
        } else {
          app.appendChild(btn("← SHOW FEATURED ONLY", "raised", function () {
            state.expanded = false; renderStrata();
          }));
        }
      }
      function renderDetail() {
        app.innerHTML = "";
        var e = state.current;
        bar(e.title, "ECHO " + e.index + " · " + e.anchor);
        app.appendChild(btn("← " + e.anchor, "veil-back", function () {
          state = { view: "strata", anchor: e.anchor, current: null };
          renderStrata();
        }));
        var hero = element("div", "veil-hero " + (D.days[e.anchor].tone || "amber"));
        hero.appendChild(element("span", "veil-kicker", e.epigraph));
        hero.appendChild(element("h1", "", e.title));
        hero.appendChild(element("p", "veil-summary", "An echo around " + e.anchor + " · " + e.anchorTitle));
        app.appendChild(hero);
        e.body.forEach(function (line) { app.appendChild(element("p", "veil-prose", line)); });
        var doc = element("details", "veil-doc");
        doc.open = true;
        doc.appendChild(element("summary", "", "RECOVERED STRATUM NOTE"));
        doc.appendChild(element("pre", "", e.doc));
        app.appendChild(doc);
        if (V.echoes[e.id]) {
          var done = element("div", "veil-solved");
          done.appendChild(element("b", "", "STRATUM UNSEALED"));
          done.appendChild(element("p", "", "The anchor record has one more witness."));
          done.appendChild(btn("NEXT STRATUM", "veil-primary", function () {
            var i = ECHOES[e.anchor].indexOf(e);
            if (i >= 0 && i + 1 < ECHOES[e.anchor].length) {
              state = { view: "detail", anchor: e.anchor, current: ECHOES[e.anchor][i + 1] };
              renderDetail();
            }
          }));
          app.appendChild(done);
          return;
        }
        if (e.gate && e.gate.kind === "minigame") {
          var gwrap = element("div", "veil-gate");
          gwrap.appendChild(element("div", "veil-gate-label", "CABINET"));
          gwrap.appendChild(element("p", "veil-question", "The room will not open until the cabinet is clear."));
          var ghost = element("div", "veil-mini-host");
          gwrap.appendChild(ghost);
          
          app.appendChild(gwrap);
          if (window.VEIL_ARCADE && window.VEIL_ARCADE.mount) {
            window.VEIL_ARCADE.mount(ghost, e.gate.game, function () {
              mark(e.id);
              renderDetail();
            });
          }
          return;
        }
        var gate = element("div", "veil-gate");
        gate.appendChild(element("div", "veil-gate-label", "ECHO GATE"));
        gate.appendChild(element("p", "veil-question", e.question));
        var form = element("form", "veil-form");
        var answer = element("input", "veil-input");
        answer.placeholder = "one word";
        answer.setAttribute("aria-label", "Echo answer");
        var go = btn("UNSEAL", "veil-primary");
        go.type = "submit";
        form.appendChild(answer); form.appendChild(go);
        var feedback = element("p", "veil-feedback", "The stratum is waiting.");
        form.addEventListener("submit", function (ev) {
          ev.preventDefault();
          if (String(answer.value || "").trim().toUpperCase() === e.answer) {
            mark(e.id);
            renderDetail();
          } else {
            feedback.textContent = "Not this shape. Hint: " + e.clue;
            feedback.className = "veil-feedback is-fail";
          }
        });
        gate.appendChild(form);
        gate.appendChild(element("p", "veil-hint", "Hint: " + e.clue));
        gate.appendChild(feedback);
        app.appendChild(gate);
      }
      renderAnchors();
    });
  }

  if (!H.files.some(function (f) { return f.id === "echoes"; })) {
    H.addFile({ id: "echoes", name: "Echo Vault", kind: "app", icon: "discs", x: 296, y: 476, wide: 860, high: 640 });
  }
  register();
})();

