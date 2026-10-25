/* HAVEN DESK — STORY IMAGE BRIDGE.
   Reads the manifest written by the Forge sync step. The scene pass becomes
   the room image; the other four passes feed the Photo Journal. */
(function () {
  "use strict";
  var D = window.VEIL_DATA;
  if (!D || !D.days) return;
  var entries = window.VEIL_STORY_ENTRIES || [];
  var priority = { scene: 0, object: 1, afterimage: 2, document: 3, future: 4 };
  var byDate = {};
  entries.forEach(function (entry) {
    if (!entry || !D.days[entry.date]) return;
    var current = byDate[entry.date];
    if (!current || (priority[entry.pass] || 9) < (priority[current.pass] || 9)) {
      byDate[entry.date] = entry;
    }
  });
  Object.keys(byDate).forEach(function (date) {
    D.days[date].image = byDate[date].src;
  });
  window.VEIL_STORY = {
    entries: entries,
    byDate: byDate,
    count: entries.length
  };
})();
