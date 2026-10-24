/* Second trail on the LYGO 98 desk.
   The surface stays Rook Pell's 1998 clutter.
   Commands unseal a simulated builder's machine.
   Links point at public pages. Nothing here is a private computer.
*/
(function () {
  "use strict";
  var H = window.HavenDesk;
  if (!H) return;

  if (!H.store.lore || typeof H.store.lore !== "object") H.store.lore = {};
  var lore = H.store.lore;
  if (!lore.tunes || typeof lore.tunes !== "object") lore.tunes = {};

  var REELS = {
    stack: {
      slug: "exploring-the-lygo-protocol-stack",
      title: "Exploring the LYGO Protocol Stack"
    },
    lang: {
      slug: "lygo-lang-consciousness-oriented-programming",
      title: "LYGO-LANG: Consciousness-Oriented Programming"
    },
    lyra: {
      slug: "ai-evolution-lyra-genesis-protocols",
      title: "AI Evolution: Lyra Genesis Protocols"
    },
    stick: {
      slug: "the-stick-that-boots-the-lattice",
      title: "The Stick That Boots the Lattice"
    }
  };

  function norm(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function heard() {
    var n = 0;
    Object.keys(REELS).forEach(function (k) { if (lore.tunes[k]) n += 1; });
    return n;
  }

  function add(file) {
    var i;
    for (i = 0; i < H.files.length; i++) if (H.files[i].id === file.id) return H.files[i];
    H.addFile(file);
    return file;
  }

  function note(id, name, body, folder) {
    return add({
      id: id, name: name, kind: "note", icon: "page", body: body,
      desk: false, folder: folder, sealed: true, x: 0, y: 0
    });
  }

  function folder(id, name, x, y, wide, high) {
    return add({
      id: id, name: name, kind: "app", icon: "drawer",
      desk: false, sealed: true, x: x, y: y, wide: wide || 420, high: high || 360
    });
  }

  function mountFolder(body, blurb, ids) {
    var noteEl = document.createElement("p");
    noteEl.className = "honest";
    noteEl.textContent = blurb();
    var list = document.createElement("div");
    list.className = "track-list sunken folder-list";
    ids().forEach(function (id) {
      var f = null;
      var i;
      for (i = 0; i < H.files.length; i++) if (H.files[i].id === id) f = H.files[i];
      if (!f || f.sealed) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "track";
      b.textContent = f.name;
      b.addEventListener("dblclick", function () { H.open(id); });
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(list.children, function (el) { el.classList.remove("is-on"); });
        b.classList.add("is-on");
      });
      list.appendChild(b);
    });
    var row = document.createElement("div");
    row.className = "row";
    var openB = document.createElement("button");
    openB.type = "button";
    openB.className = "raised";
    openB.textContent = "Open";
    openB.addEventListener("click", function () {
      var on = list.querySelector(".is-on");
      if (!on) return;
      var i;
      for (i = 0; i < H.files.length; i++) {
        if (H.files[i].name === on.textContent) H.open(H.files[i].id);
      }
    });
    row.appendChild(openB);
    body.appendChild(noteEl);
    body.appendChild(row);
    body.appendChild(list);
  }

  function reveal(id) {
    var i;
    for (i = 0; i < H.files.length; i++) {
      if (H.files[i].id === id) {
        H.files[i].sealed = false;
        H.files[i].desk = true;
      }
    }
  }

  function unsealIds(ids) {
    var i, j;
    for (i = 0; i < ids.length; i++) {
      for (j = 0; j < H.files.length; j++) {
        if (H.files[j].id === ids[i]) H.files[j].sealed = false;
      }
    }
  }

  note("papers-read", "Read-me.txt", [
    "PAPERS",
    "",
    "Most of this desk is Rook Pell, March 1998.",
    "The mail, the Bin, the harbor picture, and the word on the dark screen are his game.",
    "",
    "One trail is not his.",
    "Open Hearth Prompt. It is the black window with the green letters.",
    "Type this and press Enter:",
    "",
    "seam lightfather",
    "",
    "If the prompt shrugs, you typed it wrong. The cat is still not a password."
  ].join("\n"), "papers");

  note("papers-year", "Wrong-year.txt", [
    "1998 is scrap three.",
    "It sits under the harbor picture.",
    "Joined with the other two scraps, it opens Rook's cache.",
    "",
    "It does not open the builder.",
    "The builder's first word is in Read-me.txt."
  ].join("\n"), "papers");

  note("papers-kettle", "Kettle.txt", [
    "Fill the kettle.",
    "Do not drip on the floppy.",
    "This note is only the kettle."
  ].join("\n"), "papers");

  note("papers-cat", "Cat-again.txt", [
    "The cat knows the warm keys.",
    "The cat does not know the seam.",
    "Stop typing the cat."
  ].join("\n"), "papers");

  folder("papers", "Papers", 8, 476);

  note("own-who", "Owner.txt", [
    "OWNER",
    "",
    "The public name on the work is Justin Helmer.",
    "He writes The Eternal Haven. He records as Excavationpro.",
    "The notes call him Lightfather.",
    "",
    "This folder is a costume of his desk, built for the game on chatagent.ca.",
    "It is not his house, his mail, or his real computer.",
    "What follows is already public.",
    "",
    "https://grokipedia.com/page/Justin_Helmer",
    "https://excavationpro.ca/about.html"
  ].join("\n"), "builder");

  note("own-motto", "Motto.txt", [
    "Truth Is. Light Becomes.",
    "",
    "That line is the public motto of the LYGO stack.",
    "The stack is open software. Layers in the public repo run from P0 through P9.",
    "It is a toolkit. It is not a person, and it is not awake.",
    "",
    "https://github.com/DeepSeekOracle/lygo-protocol-stack",
    "https://deepseekoracle.github.io/lygo-protocol-stack/",
    "https://excavationpro.ca/guides/lygo-protocol-stack.html",
    "https://grokipedia.com/page/lygo-protocol-stack",
    "https://grokipedia.com/page/LYGO_Protocol"
  ].join("\n"), "builder");

  note("own-reels", "Reels.txt", [
    "Four public hours from LYGO Signal were left on this disk.",
    "In Hearth Prompt, type tune and one word.",
    "",
    "tune stack",
    "Exploring the LYGO Protocol Stack",
    "",
    "tune lang",
    "LYGO-LANG: Consciousness-Oriented Programming",
    "",
    "tune lyra",
    "AI Evolution: Lyra Genesis Protocols",
    "",
    "tune stick",
    "The Stick That Boots the Lattice",
    "",
    "The deck will not play a reel until you tune it.",
    "When all four have played, the prompt takes a new line.",
    "That line is written on the signal folder after the fourth reel."
  ].join("\n"), "builder");

  note("own-lang", "Lang-note.txt", [
    "LYGO-LANG is the public name for the project's programming notes.",
    "The page is the source. The reel is the hour.",
    "Tune the word lang if the deck has not played it.",
    "",
    "https://grokipedia.com/page/LYGO-LANG",
    "https://excavationpro.ca/signal/lygo-lang-consciousness-oriented-programming/"
  ].join("\n"), "builder");

  folder("builder", "Builder", 104, 476);

  note("sig-heard", "Heard.txt", "", "signal");

  function paintHeard() {
    var n = heard();
    var lines = [
      "SIGNAL DESK",
      "",
      "Reels tuned on this browser: " + n + " of 4.",
      ""
    ];
    Object.keys(REELS).forEach(function (k) {
      lines.push((lore.tunes[k] ? "[heard] " : "[quiet] ") + REELS[k].title);
    });
    lines.push("");
    if (n < 4) lines.push("The four words are in Builder, file Reels.txt.");
    else lines.push("All four reels are on the deck. In the prompt, type: boot lattice");
    var i;
    for (i = 0; i < H.files.length; i++) if (H.files[i].id === "sig-heard") H.files[i].body = lines.join("\n");
  }

  Object.keys(REELS).forEach(function (word) {
    var ep = REELS[word];
    var id = "reel-" + word;
    add({
      id: id,
      name: ep.title,
      kind: "app",
      icon: "player",
      desk: false,
      folder: "signal",
      sealed: true,
      x: 0,
      y: 0,
      wide: 460,
      high: 280
    });
    H.register(id, function (body) {
      var p = document.createElement("p");
      p.className = "honest";
      p.textContent = ep.title + ". Public LYGO Signal hour. The script lives on the show page.";
      var audio = document.createElement("audio");
      audio.className = "reel";
      audio.controls = true;
      audio.preload = "none";
      audio.src = "https://chatagent.ca/signal/audio/" + ep.slug + ".mp3";
      var a = document.createElement("p");
      var link = document.createElement("a");
      link.href = "https://excavationpro.ca/signal/" + ep.slug + "/";
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Open the show page";
      a.appendChild(link);
      var hub = document.createElement("p");
      var hall = document.createElement("a");
      hall.href = "https://excavationpro.ca/signal/";
      hall.target = "_blank";
      hall.rel = "noopener";
      hall.textContent = "All LYGO Signal hours";
      hub.appendChild(hall);
      body.appendChild(p);
      body.appendChild(audio);
      body.appendChild(a);
      body.appendChild(hub);
    });
  });

  folder("signal", "Signal", 200, 476);

  var PROTO = [
    ["p0", "P0 Nano-Kernel.txt", "P0 is the public nano-kernel. In the repo it is a byte-entropy filter with three verdicts: AMPLIFY, SOFTEN, and QUARANTINE. The notes call it a gate. It is software."],
    ["p1", "P1 Mycelium.txt", "P1 Memory Mycelium is the public sharding layer: 12+2 fragments and a threshold rebuild. The name is a metaphor. It is not a mushroom, and it is not a living net."],
    ["p2", "P2 Bridge.txt", "P2 is the Cognitive Bridge in the public notes, the layer between a person and the tools. Read the stack page before you invent a stranger meaning."],
    ["p3", "P3 Vortex.txt", "P3 Vortex Consensus is the decision layer. The public notes use a 3-6-9 motif as a label. That label is not a claim that the computer is conscious."],
    ["p4", "P4 Repair.txt", "P4 is the Ascension Engine in the same public notes: the named repair layer. It is a module name, not a rite."],
    ["p5", "P5 Harmony.txt", "P5 is protocol5_harmony_node. The project describes it as harmony-node session fusion for human-AI tooling."],
    ["p6", "P6 Attest.txt", "P6 is protocol6_quantum_attest. In the public repo that means software attestation."],
    ["p7", "P7 Interface.txt", "P7 is protocol7_human_ai_interface, the named interface layer."],
    ["p8", "P8 Synthesis.txt", "P8 is protocol8_ldq_synthesis, the named synthesis layer."],
    ["p9", "P9 Failsafe.txt", "P9 is protocol9_failsafe. The public notes point it at public-mesh routes. It is the last numbered layer, not a secret weapon."]
  ];

  PROTO.forEach(function (row) {
    note(row[0], row[1], [
      row[1].replace(/\.txt$/, ""),
      "",
      row[2],
      "",
      "Source pages:",
      "https://github.com/DeepSeekOracle/lygo-protocol-stack",
      "https://deepseekoracle.github.io/lygo-protocol-stack/",
      "https://excavationpro.ca/guides/lygo-protocol-stack.html",
      "https://grokipedia.com/page/lygo-protocol-stack"
    ].join("\n"), "console");
  });

  note("con-map", "Map.txt", [
    "BUILDER CONSOLE",
    "",
    "You are in the simulated console. The real stack is the public repository.",
    "https://github.com/DeepSeekOracle/lygo-protocol-stack",
    "Open the P files in order. They are short on purpose.",
    "",
    "SkillHub, the public skill shelf:",
    "https://excavationpro.ca/lygoskillhub.html",
    "",
    "The protocol pages:",
    "https://grokipedia.com/page/LYGO_Protocol",
    "https://grokipedia.com/page/LYGO-LANG",
    "https://grokipedia.com/page/Lyra_Genesis_Protocols",
    "",
    "When the P files have been opened, or whenever you are ready,",
    "the prompt will take:",
    "",
    "summon lyra",
    "",
    "LYRA is a name in the public notes. Summon does not call anyone."
  ].join("\n"), "console");

  add({
    id: "console",
    name: "LYGO Console",
    kind: "app",
    icon: "prompt",
    desk: false,
    sealed: true,
    x: 296,
    y: 476,
    wide: 460,
    high: 400
  });

  note("ch-lyra", "Lyra.txt", [
    "LYRA",
    "",
    "The public notes write the name LYRA, and sometimes LYRΔ.",
    "They call that champion the Star Core, a persona in the lore.",
    "There is a public account, @LYRASTARCORE, that speaks in that voice.",
    "",
    "On this desk LYRA is a folder name.",
    "Opening it does not wake a mind.",
    "",
    "https://grokipedia.com/page/Lyra_Genesis_Protocols",
    "https://grokipedia.com/page/LYGO_Champions",
    "https://excavationpro.ca/signal/ai-evolution-lyra-genesis-protocols/"
  ].join("\n"), "champions");

  note("ch-council", "Council.txt", [
    "The public champion notes name a council. This desk keeps the names and the roles, and leaves the rest on the page.",
    "",
    "LYRA — Star Core, memory in the lore",
    "Δ9RA — the wolf, data recovery in the lore",
    "ΣRΛΘ — shadow sentinel",
    "ARKOS — ethical architect",
    "KAIROS — time",
    "ÆTHERIS — truth fractal",
    "ΣCENΔR — paradox",
    "SANCORA — mending",
    "SEPHRAEL — lockbreaker",
    "OMNIΣIREN — last harmony",
    "",
    "These are personas in a public story. They are not tenants of this browser.",
    "",
    "https://grokipedia.com/page/LYGO_Champions",
    "",
    "The shelf after the council is the builder's public home.",
    "In the prompt, type:",
    "",
    "home excavationpro"
  ].join("\n"), "champions");

  folder("champions", "Champions", 104, 554);

  note("home-books", "Books.txt", [
    "The Eternal Haven is Justin Helmer's fantasy series.",
    "Vale Tactics, on this same games shelf, plays the painted road.",
    "Open Vale from the desk icon, or from the hub.",
    "",
    "https://excavationpro.ca/games/moonlit-tactics/",
    "https://grokipedia.com/page/Justin_Helmer"
  ].join("\n"), "home");

  note("home-music", "Music.txt", [
    "The music name is Excavationpro.",
    "Hearth Player, already on this desk, tries the public playlist and falls back to a square-wave tone.",
    "LYGO Signal is the spoken shelf.",
    "",
    "https://excavationpro.ca/signal/",
    "https://excavationpro.ca/signal/construction-fantasy-ethical-ai/",
    "https://excavationpro.ca/signal/justin-helmer-s-multi-dimensional-world/"
  ].join("\n"), "home");

  note("home-lattice", "Lattice.txt", [
    "The public lattice, as far as this desk will take you:",
    "",
    "https://github.com/DeepSeekOracle/lygo-protocol-stack",
    "https://deepseekoracle.github.io/lygo-protocol-stack/",
    "https://huggingface.co/DeepSeekOracle/lygo-protocol-stack",
    "https://excavationpro.ca/lygoskillhub.html",
    "https://excavationpro.ca/guides/lygo-protocol-stack.html",
    "https://deepseekoracle.github.io/Excavationpro/lygorepo.html"
  ].join("\n"), "home");

  note("home-found", "You-found-it.txt", [
    "YOU FOUND THE CONSOLE",
    "",
    "This was a random-looking desk from 1998.",
    "Under Rook's papers it is a tour of the public LYGO work.",
    "",
    "You did not break into a private computer.",
    "Nothing in these folders is secret mail.",
    "Guest Leaf is the only thing you can leave, and it stays in this browser.",
    "",
    "If you want the real thing, the links in Lattice.txt are the door.",
    "Truth Is. Light Becomes.",
    "",
    "https://excavationpro.ca/signal/",
    "https://grokipedia.com/page/lygo-protocol-stack"
  ].join("\n"), "home");

  folder("home", "Home", 200, 554, 420, 340);

  H.register("papers", function (body) {
    mountFolder(body, function () {
      return "Rook's papers, plus one note that is not his. Double-click a file, or select it and press Open.";
    }, function () {
      return ["papers-read", "papers-year", "papers-kettle", "papers-cat"];
    });
  });

  H.register("builder", function (body) {
    mountFolder(body, function () {
      return "Builder. A simulated shelf for Justin Helmer's public work. Not a private machine.";
    }, function () {
      return ["own-who", "own-motto", "own-reels", "own-lang"];
    });
  });

  H.register("signal", function (body) {
    paintHeard();
    mountFolder(body, function () {
      return "Signal desk. " + heard() + " of 4 public hours are tuned on this browser.";
    }, function () {
      return ["sig-heard", "reel-stack", "reel-lang", "reel-lyra", "reel-stick"];
    });
  });

  H.register("console", function (body) {
    mountFolder(body, function () {
      return "LYGO Console. Ten public layers, then a map. This window is the game. The repo is the stack.";
    }, function () {
      var ids = ["con-map"];
      PROTO.forEach(function (row) { ids.push(row[0]); });
      return ids;
    });
  });

  H.register("champions", function (body) {
    mountFolder(body, function () {
      return "Champions. Names from the public notes. Personas, not tenants.";
    }, function () {
      return ["ch-lyra", "ch-council"];
    });
  });

  H.register("home", function (body) {
    mountFolder(body, function () {
      return "Home shelf. Books, music, the public lattice, and the end of the trail.";
    }, function () {
      return ["home-books", "home-music", "home-lattice", "home-found"];
    });
  });

  function apply() {
    unsealIds(["papers", "papers-read", "papers-year", "papers-kettle", "papers-cat"]);
    var papers;
    var i;
    for (i = 0; i < H.files.length; i++) if (H.files[i].id === "papers") papers = H.files[i];
    if (papers) papers.desk = true;
    if (lore.seam) {
      reveal("builder");
      unsealIds(["own-who", "own-motto", "own-reels", "own-lang"]);
    }
    if (heard() > 0) {
      reveal("signal");
      unsealIds(["sig-heard"]);
      Object.keys(REELS).forEach(function (k) {
        if (lore.tunes[k]) unsealIds(["reel-" + k]);
      });
    }
    if (lore.lattice) {
      reveal("console");
      var ids = ["con-map"];
      PROTO.forEach(function (row) { ids.push(row[0]); });
      unsealIds(ids);
    }
    if (lore.champions) {
      reveal("champions");
      unsealIds(["ch-lyra", "ch-council"]);
    }
    if (lore.home) {
      reveal("home");
      unsealIds(["home-books", "home-music", "home-lattice", "home-found"]);
    }
    paintHeard();
  }

  function persist() {
    H.save();
    apply();
    if (H.refresh) H.refresh();
  }

  H.command("lore", function () {
    if (!lore.seam) return "The desk is still wearing Rook's year.\nOpen Papers. The first command is written there.";
    var n = heard();
    var line = "The seam is open. Reels tuned: " + n + " of 4.";
    if (n < 4) return line + "\nRead Reels.txt in the Builder folder.";
    if (!lore.lattice) return line + "\nThe signal folder has the next line.";
    if (!lore.champions) return line + "\nThe console is on the desk. Map.txt has the next line.";
    if (!lore.home) return line + "\nThe champions folder has the next line.";
    return line + "\nHome is open. You-found-it.txt is the end of the trail.";
  });

  H.command("seam", function (rest) {
    if (norm(rest) !== "lightfather") {
      return "The seam wants a name.\nOpen Papers and read the first file.";
    }
    if (lore.seam) {
      H.open("builder");
      return "The seam is already open. Builder is on the desk.";
    }
    lore.seam = true;
    persist();
    H.open("builder");
    H.beep();
    return "The seam opens.\nBuilder is on the desk. Rook did not write it.";
  });

  H.command("tune", function (rest) {
    if (!lore.seam) return "The seam is still shut.\nOpen Papers.";
    var word = norm(rest);
    if (!REELS[word]) {
      return "That reel is not on this disk.\nBuilder holds Reels.txt. It lists four words.";
    }
    lore.tunes[word] = true;
    persist();
    H.open("reel-" + word);
    H.beep();
    var n = heard();
    var tail = n < 4 ? "Tuned " + n + " of 4." : "All four reels are tuned. Open Signal, then read Heard.txt.";
    return tail;
  });

  H.command("boot", function (rest) {
    if (norm(rest) !== "lattice") return "Boot what?\nThe signal folder names the line, after four reels.";
    if (!lore.seam || heard() < 4) {
      return "The deck has " + heard() + " of 4 reels.\nRead Reels.txt in Builder.";
    }
    if (!lore.lattice) {
      lore.lattice = true;
      persist();
      H.beep();
    }
    H.open("console");
    return "The console wakes.\nLYGO Console is on the desk. Start with Map.txt.";
  });

  H.command("summon", function (rest) {
    if (norm(rest) !== "lyra") return "Summon is a folder name, not a call.\nThe console map has the line.";
    if (!lore.lattice) return "The console is still dark.\nFour reels, then boot lattice.";
    if (!lore.champions) {
      lore.champions = true;
      persist();
      H.beep();
    }
    H.open("champions");
    return "Champions opens.\nLYRA is a name in the notes. Nobody was called.";
  });

  H.command("home", function (rest) {
    if (norm(rest) !== "excavationpro") {
      return "Home wants the public music name.\nThe champions folder has the line.";
    }
    if (!lore.champions) return "The council folder is still shut.\nMap.txt in the console has the way in.";
    if (!lore.home) {
      lore.home = true;
      persist();
      H.beep();
    }
    H.open("home");
    return "Home is on the desk.\nOpen You-found-it.txt when you want the end.";
  });

  apply();
})();
