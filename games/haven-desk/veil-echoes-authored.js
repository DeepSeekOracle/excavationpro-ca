/* HAVEN DESK — AUTHORED ECHO STRATA.
   Replaces the twenty repeated lens templates with twenty strata cut from each
   date's own written scene. Every stratum is a real sentence from the room, its
   gate is a missing word from that sentence, and the answer is the word the
   scene used. Nothing here is invented: the vault is made of the prose. */
(function () {
  "use strict";
  var S = window.VEIL_STORIES;
  var D = window.VEIL_DATA;
  if (!S || !D) return;

  var STOP = ("the and but for with that this from they have were was his her him she had been would could there their what when which while into over under after before about been being because him hers herself himself its itself just like more most only other some such than them then there these those through very well were what will your yours").split(" ");

  function sentences(text) {
    return text
      .replace(/\s+/g, " ")
      .split(/(?<=[.?!])\s+(?=["A-Z])/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.split(" ").length >= 6 && s.length > 40; });
  }

  function pickWord(sentence) {
    var words = sentence.match(/[A-Za-z][A-Za-z'-]{4,}/g) || [];
    var counts = {};
    words.forEach(function (w) {
      var k = w.toLowerCase();
      counts[k] = (counts[k] || 0) + 1;
    });
    var best = "";
    words.forEach(function (w) {
      var k = w.toLowerCase();
      if (counts[k] !== 1) return;
      if (STOP.indexOf(k) !== -1) return;
      if (k.length < 6) return;
      if (k.length > best.length) best = w;
    });
    return best;
  }

  function titleOf(sentence) {
    var words = sentence.split(" ");
    var slice = words.slice(0, 6).join(" ").replace(/[.,;:!?"']+$/, "");
    if (slice.length > 46) slice = slice.slice(0, 46).replace(/\s+\S*$/, "");
    return slice;
  }

  var OUT = {};
  Object.keys(S).forEach(function (date) {
    var row = S[date];
    var day = D.days[date];
    if (!row || !day || !row.body) return;
    var all = [];
    row.body.forEach(function (para, pi) {
      sentences(para).forEach(function (s) { all.push({ text: s, para: pi + 1 }); });
    });
    if (!all.length) return;
    var strata = [];
    for (var i = 0; i < 20; i++) {
      var at = Math.floor((i * all.length) / 20);
      var unit = all[Math.min(at, all.length - 1)];
      var word = pickWord(unit.text);
      if (!word) {
        unit = all[(at + 1) % all.length];
        word = pickWord(unit.text) || "ROOM";
      }
      var blanked = unit.text.replace(new RegExp("\\b" + word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b"), "______");
      var nextUnit = all[Math.min(all.indexOf(unit) + 1, all.length - 1)];
      strata.push({
        id: "authored:" + date + ":" + (i + 1),
        index: i + 1,
        key: "stratum-" + (i + 1),
        title: titleOf(unit.text),
        body: [
          "STRATUM " + (i + 1) + " / " + date + " — " + day.title + ".",
          unit.text,
          day.summary || ""
        ],
        doc: unit.text + "\n" + (nextUnit && nextUnit !== unit ? nextUnit.text : "") +
             "\n\nRecovered from the " + date + " scene, paragraph " + unit.para + ".",
        question: "Complete the line from " + day.title + ": " + blanked,
        answer: word.toUpperCase(),
        clue: "Stratum " + (i + 1) + " · read paragraph " + unit.para + " of " + date + "."
      });
    }
    OUT[date] = strata;
    // Titles must be unique inside a date; extend or number the collisions.
    var used = {};
    strata.forEach(function (s) {
      var t = s.title;
      if (used[t]) {
        var words = s.body[1].split(" ");
        var longer = words.slice(0, 9).join(" ").replace(/[.,;:!?"']+$/, "");
        t = used[longer] ? longer + " · " + s.index : longer;
      }
      used[t] = true;
      s.title = t;
    });
  });
  window.VEIL_ECHO_AUTHORED = OUT;
})();
