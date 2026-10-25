/* HAVEN DESK — forged story bodies.
   Only accepted, gated stories from the Forge are present in veil-stories.js. */
(function () {
  "use strict";
  var D = window.VEIL_DATA;
  var S = window.VEIL_STORIES;
  if (!D || !D.days || !S) return;
  var count = 0;
  Object.keys(S).forEach(function (date) {
    var row = S[date];
    var day = D.days[date];
    if (!day || !row || !row.body || !row.body.length) return;
    day.body = row.body.slice();
    day.storyWords = row.words || 0;
    day.storyParagraphs = row.paragraphs || row.body.length;
    day.storySource = "forge";
    count += 1;
  });
  window.VEIL_STORY_CONTENT_COUNT = count;
})();
