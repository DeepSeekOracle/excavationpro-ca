/* HAVEN DESK — Kooter memorial entry.
   Kept in its own file because the Forge regenerates veil-story-manifest.js from
   the pack's asset queue, which would drop a hand-added entry.
   Loaded after veil-story-manifest.js, appends one plate to the Photo Journal. */
(function () {
  "use strict";
  var entries = window.VEIL_STORY_ENTRIES;
  if (!entries || !entries.length) return;
  var src = "assets/story/2023-03-14/1-memorial.jpg";
  for (var i = 0; i < entries.length; i += 1) {
    if (entries[i] && entries[i].src === src) return;
  }
  entries.push({
    date: "2023-03-14",
    index: 1,
    pass: "memorial",
    src: src,
    title: "2023-03-14 · Kooter",
    note: "Kooter. 2005 to 30 January 2023. He was here the whole time."
  });
})();
