/* Stitched Forge lore.
   Source: Forge local worker JOB-61FF941E (text result, inspected by hand).
   The worker claimed it wrote files; it did not. These are the accepted
   documents, deliberately folded into the existing rooms by the editor. */
(function () {
  "use strict";
  var D = window.VEIL_DATA;
  if (!D || !D.days) return;
  function add(id, doc) {
    var d = D.days[id];
    if (!d) return;
    d.docs = d.docs || [];
    for (var i = 0; i < d.docs.length; i++) {
      if (d.docs[i].title === doc.title) return;
    }
    d.docs.push(doc);
  }
  add("2008-10-31", {
    title: "LEDGER / STORY",
    kind: "forge",
    text: "The ledger is a public architecture: a series of agreed coordinates where facts are placed so that others may find them.\n\nMemory is a private geography. It is the silt that settles in the cracks of the architecture, the weight of experience that remains after the fact is recorded.\n\nA ledger is a map of a city. Memory is the weather in that city. You can map the boulevard; you cannot map the way the fog feels against the skin.\n\nInformation committed to a public record is subject to entropy. A fact left without maintenance loses its edges. It becomes a ghost of itself, then static.\n\nWe record to preserve. The record is not the thing itself. It is the shadow the thing casts.\n\nThe shadow is not the light.\nLightfather is the operator layer that casts it.\n\n— J.H."
  });
  add("2023-03-14", {
    title: "THE SHADOW SCORE",
    kind: "forge",
    text: "We are increasingly obsessed with the shadow score: the number used to quantify a system's output.\n\nWe treat the score as if it were a measure of a soul, or at least of competence. It is neither.\n\nA benchmark is a shadow of capability. It is a snapshot of a machine performing a specific task under specific constraints. It is not a portrait of a person.\n\nThe machine does not know that it has succeeded. It has satisfied a condition.\n\nIf a result is technically correct and functionally disastrous, who is accountable? A machine cannot feel guilt. A score cannot be held responsible.\n\nWe are building mirrors that reflect our demands. When the mirror cracks, we still look for a throat to hold.\n\nThe score is a shadow. The operator is the layer.\nThe Deadman chapter is not a number.\n\n— Night Archivist, Ref: 09-X"
  });
})();
