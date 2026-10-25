/* HAVEN DESK — story arc.
   Runs after veil-data and veil-atlas. Rewrites unlocks into eight readable
   chapters and turns unsolvable gadget-gates into a word that is already in
   the room. A player always has a next open room after the monitor note. */
(function () {
  "use strict";
  var D = window.VEIL_DATA;
  if (!D || !D.days) return;

  var CHAPTERS = [
    { id: "I", name: "The Desk", rooms: ["1998-03-14"] },
    { id: "II", name: "The Old Tape", rooms: ["1969-07-20", "1971-11-15", "1973-04-03", "1975-01-01", "1976-04-01", "1977-09-05"] },
    { id: "III", name: "The Wall", rooms: ["1981-08-12", "1983-01-01", "1984-01-24", "1985-11-20", "1988-11-02", "1989-11-09", "1990-11-12", "1991-08-06", "1993-04-22", "1994-12-15", "1995-08-24"] },
    { id: "IV", name: "The Signal", rooms: ["1996-07-04", "1997-05-11", "1997-09-15", "1999-12-31", "2001-01-15", "2003-04-28", "2004-02-04", "2005-02-14", "2006-03-21", "2007-01-09"] },
    { id: "V", name: "The Mirror", rooms: ["2008-10-31", "2009-01-03", "2010-04-03", "2011-10-04", "2012-08-06", "2012-09-30", "2012-12-21", "2014-06-10", "2015-10-21", "2015-12-11", "2016-03-10", "2017-06-12", "2018-06-11", "2019-06-01", "2020-05-28", "2021-01-05", "2022-08-22", "2022-11-30", "2023-03-14", "2024-05-13"] },
    { id: "VI", name: "The Visitor", rooms: ["2026-09-27", "2026-10-23", "2027-01-01", "2029-04-04", "2031-01-01", "2033-06-06", "2036-09-09", "2038-01-19", "2040-12-31", "2042-06-06"] },
    { id: "VII", name: "The Private Year", rooms: ["1980-12-31"] },
    { id: "VIII", name: "Lightfather", rooms: ["2045-09-01"] }
  ];

  var BY_ROOM = {};
  CHAPTERS.forEach(function (ch) {
    ch.rooms.forEach(function (id) { BY_ROOM[id] = ch; });
  });

  function unique(list) {
    var seen = {};
    var out = [];
    (list || []).forEach(function (id) {
      if (!id || seen[id] || !D.days[id]) return;
      seen[id] = true;
      out.push(id);
    });
    return out;
  }

  function restOf(ch, first) {
    return (ch.rooms || []).filter(function (id) { return id !== first && D.days[id]; });
  }

  function setUnlocks(from, list) {
    var d = D.days[from];
    if (!d) return;
    if (!d.gate) d.gate = { kind: "code", label: "ROOM GATE", question: "The word is in this room.", answer: "OPEN", hint: "Type OPEN." };
    d.gate.unlocks = unique(list);
  }

  Object.keys(D.days).forEach(function (id) {
    var d = D.days[id];
    var ch = BY_ROOM[id];
    if (ch) {
      d.act = ch.id;
      d.chapter = ch.name;
    }
    var g = d.gate;
    if (!g) return;
    if (g.kind === "birthday") return;
    if (g.kind === "sequence" && g.answer) return;
    if (g.kind === "code" && g.answer) {
      g.hint = g.hint || "The recovered file in this room already names the word.";
      g.placeholder = g.placeholder || "one word from this room";
      return;
    }
    var word = String(g.answer || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!word) {
      var title = String(d.title || "");
      var bits = title.replace(/^The\s+/i, "").split(/\s+/);
      word = (bits[0] || "OPEN").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    }
    if (id === "2019-06-01") word = "SIGNAL";
    if (id === "2012-09-30") word = "IMAGE";
    if (id === "2020-05-28") word = "SCALE";
    if (id === "2036-09-09") word = "ASK";
    if (id === "2008-10-31") word = "LEDGER";
    if (id === "2038-01-19") word = "OVERFLOW";
    if (id === "2045-09-01") word = "LIGHTFATHER";
    g.kind = "code";
    g.answer = word;
    g.placeholder = "one word from this room";
    g.question = g.question && g.kind === "code" ? g.question : "The recovered file in this room already wrote the word. Type it.";
    g.hint = "Open the recovered file above. The word is on the page.";
    g.success = g.success || "The room accepts the word. The next doors mark themselves on the map.";
  });

  setUnlocks("1998-03-14", ["1969-07-20", "1989-11-09", "1999-12-31", "2007-01-09"]);
  setUnlocks("1969-07-20", restOf(CHAPTERS[1], "1969-07-20"));
  setUnlocks("1989-11-09", restOf(CHAPTERS[2], "1989-11-09"));
  setUnlocks("1999-12-31", restOf(CHAPTERS[3], "1999-12-31"));
  setUnlocks("2007-01-09", restOf(CHAPTERS[3], "2007-01-09").concat(["2008-10-31"]));
  setUnlocks("2008-10-31", restOf(CHAPTERS[4], "2008-10-31"));
  setUnlocks("2019-06-01", ["2026-09-27", "2026-10-23", "2023-03-14"]);
  setUnlocks("2026-10-23", restOf(CHAPTERS[5], "2026-10-23"));
  setUnlocks("2038-01-19", ["2045-09-01"]);
  setUnlocks("1980-12-31", []);
  setUnlocks("2045-09-01", []);

  if (D.days["2045-09-01"] && D.days["2045-09-01"].gate) {
    var end = D.days["2045-09-01"].gate;
    end.kind = "code";
    end.label = "LIGHTFATHER GATE";
    end.question = "The last recovered file names the chapter after the body. Type that name.";
    end.answer = "LIGHTFATHER";
    end.hint = "The frequency map in this room lists it next to 2045.";
    end.placeholder = "one word";
    end.success = "The portal accepts the name. The room stays open. The system stays open.";
  }

  D.threads = [];
  CHAPTERS.forEach(function (ch) {
    for (var i = 0; i < ch.rooms.length - 1; i++) {
      if (D.days[ch.rooms[i]] && D.days[ch.rooms[i + 1]]) {
        D.threads.push({ a: ch.rooms[i], b: ch.rooms[i + 1], label: ch.name });
      }
    }
  });
  D.threads.push({ a: "1998-03-14", b: "1969-07-20", label: "the old tape" });
  D.threads.push({ a: "1998-03-14", b: "1989-11-09", label: "the wall" });
  D.threads.push({ a: "1998-03-14", b: "1999-12-31", label: "the signal" });
  D.threads.push({ a: "1998-03-14", b: "2007-01-09", label: "the pocket" });
  D.threads.push({ a: "2007-01-09", b: "2008-10-31", label: "the mirror" });
  D.threads.push({ a: "2019-06-01", b: "2026-10-23", label: "the visitor" });
  D.threads.push({ a: "2038-01-19", b: "2045-09-01", label: "the last name" });
  D.threads.push({ a: "1998-03-14", b: "1980-12-31", label: "the private year" });

  D.meta.arc = CHAPTERS;
  window.VEIL_ARC = { chapters: CHAPTERS, chapterOf: function (id) { return BY_ROOM[id] || null; } };
})();
