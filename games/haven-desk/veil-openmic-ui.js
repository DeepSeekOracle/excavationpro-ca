/* HAVEN DESK — OPEN MIC UI.
   Ten recovered tapes, transcript + audio. No autoplay. */
(function () {
  "use strict";
  var H = window.HavenDesk;
  var TAPES = window.VEIL_OPENMIC || [];
  if (!H || !TAPES.length) return;
  if (!H.store.veil) H.store.veil = {};
  var V = H.store.veil;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function btn(label, cls, fn) {
    var b = el("button", cls || "raised", label);
    b.type = "button";
    if (fn) b.addEventListener("click", fn);
    return b;
  }
  function speakerName(v) {
    if (v === "female") return "LYRA";
    if (v === "archivist") return "THE ARCHIVE";
    return "J.H.";
  }
  function stopAll() {
    var audios = document.querySelectorAll("#win-openmic audio");
    for (var i = 0; i < audios.length; i++) { try { audios[i].pause(); audios[i].currentTime = 0; } catch (e) {} }
  }

  H.register("openmic", function (body) {
    var app = el("div", "veil-app");
    body.appendChild(app);
    var state = { index: 0 };
    function head(sub) {
      var top = el("div", "veil-top");
      var brand = el("div", "veil-brand");
      brand.appendChild(el("span", "veil-mark", "Δ9"));
      var copy = el("div");
      copy.appendChild(el("strong", "", "OPEN MIC"));
      copy.appendChild(el("small", "", sub));
      brand.appendChild(copy); top.appendChild(brand);
      top.appendChild(el("span", "veil-progress", TAPES.length + " TAPES"));
      app.appendChild(top);
    }
    function list() {
      stopAll();
      app.innerHTML = "";
      head("RECOVERED FROM THE DESK · NO ONE REMEMBERS RECORDING THESE");
      app.appendChild(el("p", "veil-hint", "The desk records when the room is empty. The files are dated after the microphone should have been off."));
      var grid = el("div", "veil-openmic-grid");
      TAPES.forEach(function (t, i) {
        var card = btn("", "veil-openmic-card", function () { state.index = i; detail(); });
        card.appendChild(el("span", "veil-node-date", t.id.toUpperCase() + " · " + Number(t.seconds).toFixed(1) + "S"));
        card.appendChild(el("strong", "", t.title));
        card.appendChild(el("small", "", t.speaker));
        grid.appendChild(card);
      });
      app.appendChild(grid);
      app.appendChild(el("p", "veil-hint", "No autoplay. Headphones recommended. The room bed is part of the recording."));
    }
    function detail() {
      stopAll();
      app.innerHTML = "";
      var t = TAPES[state.index];
      head(t.id.toUpperCase() + " · " + t.title);
      app.appendChild(btn("← TAPES", "veil-back", list));
      var hero = el("div", "veil-hero red");
      hero.appendChild(el("span", "veil-kicker", "OPEN MIC · " + t.speaker));
      hero.appendChild(el("h1", "", t.title));
      hero.appendChild(el("p", "veil-summary", "Recovered tape · " + Number(t.seconds).toFixed(1) + " seconds · room bed audible"));
      app.appendChild(hero);
      var vbox = el("div", "veil-voice");
      vbox.appendChild(el("b", "", "PLAY TAPE"));
      var audio = document.createElement("audio");
      audio.controls = true; audio.preload = "none"; audio.src = t.src;
      vbox.appendChild(audio);
      app.appendChild(vbox);
      var transcript = el("div", "veil-transcript");
      transcript.appendChild(el("b", "", "TRANSCRIPT · RECOVERED"));
      t.transcript.forEach(function (line) {
        var row = el("p", "veil-transcript-line");
        row.appendChild(el("strong", "", speakerName(line[0]) + ": "));
        row.appendChild(document.createTextNode(line[1]));
        transcript.appendChild(row);
      });
      app.appendChild(transcript);
      var nav = el("div", "veil-actions");
      nav.appendChild(btn("← PREVIOUS TAPE", "raised", function () { if (state.index > 0) { state.index--; detail(); } }));
      nav.appendChild(btn("NEXT TAPE →", "veil-primary", function () { if (state.index + 1 < TAPES.length) { state.index++; detail(); } else list(); }));
      app.appendChild(nav);
      app.appendChild(el("p", "veil-hint", "The transcript and the audio disagree in one place. The room does not say which is right."));
    }
    list();
  });

  H.addFile({ id: "openmic", name: "Open Mic", kind: "app", icon: "discs", x: 872, y: 476, wide: 900, high: 680 });
})();
