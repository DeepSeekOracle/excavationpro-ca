(function () {
  "use strict";
  if (!window.ArcadeLedger) return;

  function arcadeName() {
    try {
      var s = JSON.parse(localStorage.getItem("lattice-swarm-v1") || "{}");
      if (s.name) return String(s.name).slice(0, 18);
      var e = JSON.parse(localStorage.getItem("lygo-eternal-lattice-v1") || "{}");
      if (e.playerName) return String(e.playerName).slice(0, 18);
      var r = JSON.parse(localStorage.getItem("lygo-haven-rally-v1") || "{}");
      if (r.name) return String(r.name).slice(0, 18);
      var g = JSON.parse(localStorage.getItem("lygo-lattice-golf-v1") || "{}");
      if (g.name) return String(g.name).slice(0, 18);
      var m = JSON.parse(localStorage.getItem("lygo_lattice_marines_v1") || "{}");
      if (m.name) return String(m.name).slice(0, 18);
    } catch (err) {}
    return "Operator";
  }

  var lastSwarm = -1;
  var lastEternal = "";

  function onSwarm(raw) {
    /* The game itself submits a richer record for each finished run (name, turns,
       harmony, outcome) and sets this flag; posting here as well would double it. */
    if (window.__swarmOwnsLedger) return;
    var j = JSON.parse(raw);
    var score = Math.round(Number(j.bestScore) || 0);
    if (score < 1 || score === lastSwarm) return;
    lastSwarm = score;
    ArcadeLedger.swarm({
      name: arcadeName(),
      score: score,
      date: new Date().toISOString().slice(0, 10)
    });
  }

  function onEternal(raw) {
    var j = JSON.parse(raw);
    var name = String(j.playerName || "").trim().slice(0, 18);
    var games = Math.round(Number(j.games) || 0);
    if (!name || games < 1) return;
    var rec = {
      name: name,
      rating: Math.round(Number(j.rating) || 1000),
      wins: Math.round(Number(j.wins) || 0),
      losses: Math.round(Number(j.losses) || 0),
      games: games,
      date: new Date().toISOString().slice(0, 10)
    };
    var key = [rec.name, rec.rating, rec.wins, rec.losses, rec.games].join("|");
    if (key === lastEternal) return;
    lastEternal = key;
    ArcadeLedger.eternal(rec);
  }

  var orig = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    orig.call(this, k, v);
    if (this !== localStorage) return;
    try {
      if (k === "lattice-swarm-v1") onSwarm(v);
      if (k === "lygo-eternal-lattice-v1") onEternal(v);
    } catch (err) {}
  };

  try {
    var sw = localStorage.getItem("lattice-swarm-v1");
    if (sw) onSwarm(sw);
    var el = localStorage.getItem("lygo-eternal-lattice-v1");
    if (el) onEternal(el);
  } catch (err) {}

  ArcadeLedger.boot();
})();
