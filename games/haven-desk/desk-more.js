/* Rook Pell's clutter. Fiction from a made-up 1998 desk.
   Add another note with HavenDesk.addFile({ id, name, kind, icon, body, x, y, desk }).
*/
(function () {
  "use strict";
  var H = window.HavenDesk;
  if (!H) return;

  var SCRAP = "marrow glass 1998";

  function textFile(id, name, body, x, y, desk) {
    H.addFile({
      id: id,
      name: name,
      kind: "text",
      icon: "page",
      body: body,
      x: x || 0,
      y: y || 0,
      desk: desk !== false ? true : false
    });
  }

  textFile("diary", "Diary.txt", [
    "ROOK PELL  —  night board, Hearth Line",
    "March 1998. The cat sleeps on the warm keys.",
    "",
    "Mar 3. Lin says I hide things in too many places.",
    "I split a drawer code into three scraps.",
    "If the three scraps sit on one line, the prompt will join them.",
    "",
    "Mar 8. Grocery: oats, dish soap, a blank floppy, tuna for the cat.",
    "The password file is a joke. Do not type the cat.",
    "",
    "Mar 12. Harbor was gray. Boats late. I kept the picture.",
    "The map with the red X is the picnic, not a mystery.",
    "",
    "Mar 19. Threw one scrap in the Bin on purpose.",
    "The other scrap waits in the dark, after the desk goes quiet.",
    "",
    "Mar 27. If you are reading this, the chair is yours.",
    "Sit as long as you want."
  ].join("\n"), 8, 398, true);

  textFile("grocery", "Grocery.txt", [
    "oats",
    "dish soap",
    "tuna (the cat)",
    "blank floppies, 10 pack",
    "postage",
    "one orange",
    "",
    "not a clue. just dinner."
  ].join("\n"), 0, 0, false);

  textFile("bookmarks", "Bookmarks.txt", [
    "hearth://home",
    "hearth://board",
    "hearth://build",
    "hearth://picnic",
    "",
    "Open these in Hearth Browse. The wire does not leave the desk."
  ].join("\n"), 0, 0, false);

  textFile("passwords", "Passwords.txt", [
    "rook",
    "password",
    "the cat",
    "MARROW",
    "",
    "None of these open the cache.",
    "Lin said the prompt joins three scraps.",
    "Stop guessing the cat."
  ].join("\n"), 0, 0, false);

  textFile("bbslog", "Bbs-log.txt", [
    "HEARTH LINE NIGHT BOARD",
    "28800 on a good evening.",
    "",
    "02:14  rook   the cat unplugged the keyboard again",
    "02:16  lin    read your mail",
    "02:41  rook   map X is a picnic. stop asking.",
    "03:02  board  downtime sunday for the dish soap incident",
    "",
    "No real people. No real board. Rook made this up."
  ].join("\n"), 0, 0, false);

  textFile("letter", "Letter-to-lin.txt", [
    "Lin,",
    "",
    "The harbor picture is the one with the boats.",
    "I will not write the year here. You already know where I put scrap three.",
    "If the Bin is empty, I lost my nerve and fished the scrap back out.",
    "",
    "Stew on Sunday if the board stays up.",
    "Rook"
  ].join("\n"), 0, 0, false);

  textFile("recipe", "Night-stew.txt", [
    "Night stew, one pot",
    "onion, carrot, the end of the oats if you are desperate,",
    "a bay leaf from the jar with no label,",
    "salt, pepper, enough water.",
    "Eat at the desk. Do not drip on the floppy."
  ].join("\n"), 0, 0, false);

  textFile("scores", "Ash-scores.txt", [
    "ASH CELLS  —  Rook's field",
    "Rook     84 seconds",
    "Lin     112 seconds",
    "the cat   did not play",
    "",
    "Your own games stay in this browser."
  ].join("\n"), 0, 0, false);

  textFile("playlist", "Night-reel.txt", [
    "Not a real track list. The player uses Excavationpro",
    "when the wire reaches it, and a hearth tone when it does not.",
    "",
    "1. kettle",
    "2. rain on the aerial",
    "3. cat on the number row",
    "4. boats coming in late"
  ].join("\n"), 0, 0, false);

  textFile("homework", "Margin-notes.txt", [
    "History margin, never turned in.",
    "The teal years were loud and square.",
    "People kept whole lives on floppies and called it enough.",
    "I would like a slower modem and a louder kettle."
  ].join("\n"), 0, 0, false);

  textFile("jokes", "Jokes.txt", [
    "How many archivists does it take to label a floppy?",
    "One, but they will write the year under a different picture.",
    "",
    "What does the cat know?",
    "Where the warm keys are. Nothing else."
  ].join("\n"), 0, 0, false);

  textFile("harbor-note", "Harbor.txt", [
    "March 12. The boats were late.",
    "scrap three is 1998.",
    "The map X is only the picnic spot."
  ].join("\n"), 0, 0, false);

  var scrap = {
    id: "scrap-two",
    name: "Scrap-two.txt",
    kind: "text",
    icon: "page",
    startsInBin: true,
    desk: false,
    x: 0,
    y: 0,
    body: [
      "I threw this out on purpose.",
      "Leave the desk. Hit Off.",
      "Watch the dark until a word shows.",
      "That word is scrap two."
    ].join("\n")
  };
  H.addFile(scrap);

  function photo(id, name, src, body, x, y, desk) {
    H.addFile({
      id: id, name: name, kind: "photo", icon: "photo",
      src: src, body: body, x: x, y: y, desk: desk !== false
    });
  }
  photo("shot-desk", "Desk at night.jpg", "assets/shots/desk.jpg", "The chair faces the window. Rook left the kettle on.", 296, 8, true);
  photo("shot-harbor", "Harbor.jpg", "assets/shots/harbor.jpg", "March 12. The boats were late. scrap three is 1998.", 296, 86, true);
  photo("shot-floppy", "Blank floppy.jpg", "assets/shots/floppy.jpg", "The label never stuck. The year is under the harbor picture.", 296, 164, true);
  photo("shot-cat", "Cat on keys.jpg", "assets/shots/cat.jpg", "Not a password. Warm, and in the way.", 392, 8, true);
  photo("shot-map", "Picnic map.jpg", "assets/shots/map.jpg", "Red X is the picnic. Lin already knows.", 392, 86, false);
  photo("shot-discs", "Disc pile.jpg", "assets/shots/discs.jpg", "Nothing written on the discs. The reel is in Night-reel.txt.", 392, 164, false);
  photo("shot-drawer", "Drawer.jpg", "assets/shots/drawer.jpg", "A brass key that opens no file on this desk.", 392, 242, false);
  photo("shot-rain", "Rain window.jpg", "assets/shots/rain.jpg", "The aerial hates this weather. Dial Tone will still pretend.", 392, 320, false);

  [
    ["calc", "Hearth Calc", "calc", 0, 0],
    ["mail", "Leaf Mail", "mail", 104, 86],
    ["chat", "Wire Chat", "chat", 104, 164],
    ["cards", "Hearth Stack", "cards", 104, 242],
    ["photos", "Picture Box", "photo", 104, 320],
    ["bin", "The Bin", "bin", 104, 398],
    ["browse", "Hearth Browse", "browse", 200, 8],
    ["dial", "Dial Tone", "dial", 200, 86],
    ["wireweb", "Night Wire", "wire", 296, 398, 560, 460],
    ["swap", "Night Swap", "swap", 392, 398, 520, 420],
    ["lime", "Lime Line", "lime", 488, 8, 520, 420],
    ["oldlines", "Old Lines", "old", 488, 86, 460, 440],
    ["bbs", "Harbor Board", "bbs", 0, 0, 520, 440],
    ["ftp", "File Pier", "ftp", 0, 0, 520, 420],
    ["news", "News Spool", "news", 0, 0, 520, 420],
    ["relay", "Relay Room", "irc", 0, 0, 520, 420],
    ["discs", "Basement Discs", "discs", 0, 0, 480, 420],
    ["tidy", "Disk Tidy", "tidy", 0, 0],
    ["find", "Find", "find", 0, 0],
    ["calendar", "Day Page", "about", 0, 0],
    ["cache", "Rook's cache", "key", 0, 0]
  ].forEach(function (row) {
    H.addFile({
      id: row[0], name: row[1], kind: "app", icon: row[2], x: row[3], y: row[4],
      desk: row[3] !== 0, wide: row[5], high: row[6]
    });
  });

  H.setSaverWord("GLASS");

  H.command("join", function (rest) {
    var n = String(rest || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    if (n === SCRAP) {
      H.open("cache");
      return "The scraps sit together. The cache opens.";
    }
    return "Those scraps do not sit together.\nTry the mail, the Bin, the saver, and the harbor picture.";
  });

  H.register("calc", function (body) {
    var acc = null;
    var op = null;
    var entry = "0";
    var fresh = true;
    var read = document.createElement("div");
    read.className = "calc-read sunken";
    read.textContent = "0";
    var grid = document.createElement("div");
    grid.className = "calc-grid";
    function show() { read.textContent = entry; }
    function apply(next) {
      var a = acc;
      var b = Number(entry);
      if (next === "+") return a + b;
      if (next === "-") return a - b;
      if (next === "*") return a * b;
      if (next === "/") return b === 0 ? "nope" : a / b;
      return b;
    }
    "789/456*123-0.=+C".split("").forEach(function (key) {
      if (key === "." && "789/456*123-0.=+C".indexOf(".") !== "0.=+C".indexOf(".")) {
        /* one dot key from the string below */
      }
    });
    ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+", "C"].forEach(function (key) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "raised";
      b.textContent = key;
      b.addEventListener("click", function () {
        if (key === "C") { acc = null; op = null; entry = "0"; fresh = true; show(); return; }
        if (key >= "0" && key <= "9" || key === ".") {
          if (fresh) { entry = key === "." ? "0." : key; fresh = false; }
          else if (!(key === "." && entry.indexOf(".") !== -1)) entry += key;
          show();
          return;
        }
        if (key === "=") {
          if (op) {
            var val = apply(op);
            entry = String(val);
            acc = null;
            op = null;
            fresh = true;
            show();
          }
          return;
        }
        var n = Number(entry);
        acc = op ? Number(apply(op)) : n;
        if (acc === "nope") { entry = "nope"; acc = null; op = null; fresh = true; show(); return; }
        op = key;
        fresh = true;
      });
      grid.appendChild(b);
    });
    body.appendChild(read);
    body.appendChild(grid);
  });

  var MAIL = [
    {
      from: "Lin Park",
      sub: "the drawer code",
      body: "rook,\n\nscrap one is MARROW.\nscrap two is in the Bin, and it will send you to the saver.\nscrap three is written under the harbor picture.\n\nPut the three scraps on one line in Hearth Prompt:\njoin scrap scrap scrap\n\nDo not use the cat.\n\nlin"
    },
    {
      from: "Night board",
      sub: "dish soap sunday",
      body: "Hearth Line will nap on Sunday.\nSomeone put dish soap in the kettle and called it maintenance.\nYour mail will still be here. The cat will not help."
    },
    {
      from: "Rook",
      sub: "note to self",
      body: "Call about Sunday stew.\nThe password file is a joke.\nThe picnic map is not the trail."
    },
    {
      from: "Unknown",
      sub: "the red X",
      body: "You left the map in the drawer.\nThe X is a picnic, not a secret.\nBring the orange."
    }
  ];

  H.register("mail", function (body) {
    var wrap = document.createElement("div");
    wrap.className = "mail-wrap";
    var list = document.createElement("div");
    list.className = "mail-list sunken";
    var view = document.createElement("pre");
    view.className = "mail-body sunken";
    view.textContent = "Leaf Mail\nFour notes. Nothing is sent anywhere.";
    MAIL.forEach(function (m) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "track";
      b.textContent = m.from + " — " + m.sub;
      b.addEventListener("click", function () {
        view.textContent = m.from + "\n" + m.sub + "\n\n" + m.body;
      });
      list.appendChild(b);
    });
    wrap.appendChild(list);
    wrap.appendChild(view);
    body.appendChild(wrap);
  });

  H.register("chat", function (body) {
    var WIRE = "https://deepseekoracle-lygo-public-witness-agent.hf.space";
    var log = document.createElement("div");
    log.className = "chat-log sunken";
    var history = [];
    var pending = false;
    var seed = [
      ["lin", "you up? read the mail before you guess."],
      ["rook", "the cat is on the keys again."],
      ["lin", "scrap one is already in the mail. I am not repeating the bin."]
    ];
    function line(who, text) {
      var p = document.createElement("p");
      var b = document.createElement("b");
      b.textContent = who + ": ";
      var span = document.createElement("span");
      span.textContent = text;
      p.appendChild(b);
      p.appendChild(span);
      log.appendChild(p);
      log.scrollTop = log.scrollHeight;
      return span;
    }
    function boardReply(text) {
      var low = text.toLowerCase();
      if (low.indexOf("cat") !== -1) return "the cat is not the password. lin was clear.";
      if (low.indexOf("marrow") !== -1) return "you have scrap one. the bin has the next errand.";
      if (low.indexOf("bin") !== -1) return "open The Bin. rook throws clues out on purpose.";
      if (low.indexOf("picnic") !== -1 || low.indexOf("map") !== -1) return "the red X is sandwiches. wrong trail.";
      if (low.indexOf("saver") !== -1 || low.indexOf("off") !== -1) return "hit Off and watch the dark.";
      if (low.indexOf("paper") !== -1 || low.indexOf("seam") !== -1) return "open Papers. the prompt line is seam lightfather.";
      return "mm. the kettle is loud.";
    }
    var wireFn = null;
    function askWire(text, transcript) {
      var timer;
      var timed = new Promise(function (_, reject) {
        timer = setTimeout(function () { reject(new Error("slow")); }, 150000);
      });
      var session = "desk" + Math.random().toString(16).slice(2) + Date.now().toString(16);
      var eventId = "";
      function fnIndex() {
        if (wireFn !== null) return Promise.resolve(wireFn);
        return fetch(WIRE + "/config").then(function (res) {
          if (!res.ok) throw new Error("config");
          return res.json();
        }).then(function (cfg) {
          var deps = cfg && cfg.dependencies ? cfg.dependencies : [];
          var i;
          for (i = 0; i < deps.length; i++) {
            if (deps[i] && deps[i].api_name === "wire") {
              wireFn = typeof deps[i].id === "number" ? deps[i].id : i;
              return wireFn;
            }
          }
          throw new Error("fn");
        });
      }
      var call = fnIndex().then(function (fn) {
        return fetch(WIRE + "/gradio_api/queue/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: [text.slice(0, 400), transcript.slice(0, 900)],
            fn_index: fn,
            session_hash: session
          })
        });
      }).then(function (res) {
        if (!res.ok) throw new Error("post");
        return res.json();
      }).then(function (started) {
        if (!started || !started.event_id) throw new Error("event");
        eventId = started.event_id;
        return fetch(WIRE + "/gradio_api/queue/data?session_hash=" + encodeURIComponent(session));
      }).then(function (res) {
        if (!res.ok || !res.body || !res.body.getReader) throw new Error("read");
        var reader = res.body.getReader();
        var dec = new TextDecoder();
        var buf = "";
        function pump() {
          return reader.read().then(function (part) {
            if (part.value) buf += dec.decode(part.value, { stream: !part.done });
            var lines = buf.split("\n");
            buf = lines.pop();
            var i;
            for (i = 0; i < lines.length; i++) {
              var ln = lines[i].replace(/\r$/, "");
              if (ln.indexOf("data:") !== 0) continue;
              var msg;
              try { msg = JSON.parse(ln.slice(5).trim()); } catch (ignore) { continue; }
              if (!msg || msg.msg !== "process_completed") continue;
              if (eventId && msg.event_id && msg.event_id !== eventId) continue;
              reader.cancel();
              if (!msg.success) throw new Error("drop");
              var reply = msg.output && msg.output.data && msg.output.data[0] ? String(msg.output.data[0]) : "";
              if (!reply || reply.indexOf("the wire dropped") === 0) throw new Error("drop");
              return reply.slice(0, 280);
            }
            if (part.done) throw new Error("end");
            return pump();
          });
        }
        return pump();
      });
      return Promise.race([call, timed]).then(function (reply) {
        clearTimeout(timer);
        return reply;
      }, function (err) {
        clearTimeout(timer);
        throw err;
      });
    }
    seed.forEach(function (row) {
      line(row[0], row[1]);
      history.push(row[0] + ": " + row[1]);
    });
    var note = document.createElement("p");
    note.className = "honest";
    note.textContent = "Lin answers on the public Hugging Face wire. The first line after a nap can take a minute. If the wire misses, the old board still answers.";
    var form = document.createElement("form");
    form.className = "prompt-row";
    var input = document.createElement("input");
    input.setAttribute("aria-label", "Say something");
    input.maxLength = 240;
    var go = document.createElement("button");
    go.className = "raised";
    go.type = "submit";
    go.textContent = "Send";
    form.appendChild(input);
    form.appendChild(go);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || pending) return;
      input.value = "";
      line("you", text);
      history.push("you: " + text);
      if (history.length > 8) history = history.slice(history.length - 8);
      var status = line("lin", "the wire is reaching the board...");
      pending = true;
      go.disabled = true;
      askWire(text, history.join("\n")).then(function (reply) {
        status.textContent = reply;
        history.push("lin: " + reply);
      }).catch(function () {
        var fallback = boardReply(text);
        status.textContent = fallback + " (the live wire missed.)";
        history.push("lin: " + fallback);
      }).then(function () {
        pending = false;
        go.disabled = false;
        log.scrollTop = log.scrollHeight;
      });
    });
    body.appendChild(log);
    body.appendChild(note);
    body.appendChild(form);
  });

  H.register("photos", function (body) {
    var album = document.createElement("div");
    album.className = "album";
    H.files.forEach(function (f) {
      if (f.kind !== "photo") return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "raised";
      var img = document.createElement("img");
      img.src = f.src;
      img.alt = "";
      var cap = document.createElement("span");
      cap.textContent = f.name;
      b.appendChild(img);
      b.appendChild(cap);
      b.addEventListener("click", function () { H.open(f.id); });
      album.appendChild(b);
    });
    body.appendChild(album);
  });

  H.register("bin", function (body) {
    var list = document.createElement("div");
    list.className = "track-list sunken";
    var note = document.createElement("p");
    note.className = "honest";
    note.textContent = "Things Rook threw out. Restore puts them back on the desk or in the drawer.";
    function paint() {
      list.innerHTML = "";
      var any = false;
      H.files.forEach(function (f) {
        if (!H.inBin(f)) return;
        any = true;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "track";
        b.textContent = f.name;
        b.addEventListener("click", function () {
          H.restore(f.id);
          paint();
          H.alert("The Bin", f.name + " is back.");
        });
        list.appendChild(b);
      });
      if (!any) list.textContent = "The Bin is empty.";
    }
    body.appendChild(note);
    body.appendChild(list);
    paint();
  });

  var PAGES = {
    "hearth://home": {
      title: "Hearth Line",
      build: function (box) {
        addP(box, "Hearth Line night board");
        addP(box, "A made-up page that never left this desk. Rook kept four doors.");
        link(box, "hearth://board");
        link(box, "hearth://build");
        link(box, "hearth://picnic");
      }
    },
    "hearth://board": {
      title: "Night board",
      build: function (box) {
        addP(box, "02:14 rook — cat on the keys");
        addP(box, "02:16 lin — read your mail");
        addP(box, "02:41 rook — the X is a picnic");
      }
    },
    "hearth://build": {
      title: "Under the cloth",
      build: function (box) {
        var s = document.createElement("div");
        s.className = "stripe";
        box.appendChild(s);
        addP(box, "This corner is still under a cloth. Come back after the stew.");
        var s2 = document.createElement("div");
        s2.className = "stripe";
        box.appendChild(s2);
      }
    },
    "hearth://picnic": {
      title: "Picnic",
      build: function (box) {
        addP(box, "Blankets, the orange, and the red X on the paper map.");
        addP(box, "This is not the drawer code. The harbor picture has a year on it.");
      }
    }
  };

  function addP(box, text) {
    var p = document.createElement("p");
    p.textContent = text;
    box.appendChild(p);
  }
  function link(box, href) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "track";
    b.textContent = href;
    b.addEventListener("click", function () { box.dispatchEvent(new CustomEvent("go", { detail: href, bubbles: true })); });
    box.appendChild(b);
  }

  H.register("browse", function (body) {
    var bar = document.createElement("form");
    bar.className = "page-bar";
    var back = document.createElement("button");
    back.type = "button";
    back.className = "raised";
    back.textContent = "Back";
    var input = document.createElement("input");
    input.value = "hearth://home";
    input.setAttribute("aria-label", "Address");
    var go = document.createElement("button");
    go.type = "submit";
    go.className = "raised";
    go.textContent = "Go";
    bar.appendChild(back);
    bar.appendChild(input);
    bar.appendChild(go);
    var view = document.createElement("div");
    view.className = "page-view sunken";
    var hist = [];
    function show(url) {
      view.innerHTML = "";
      var page = PAGES[url];
      if (!page) {
        addP(view, "The wire is busy outside this desk.");
        addP(view, "Try hearth://home");
        return;
      }
      var h = document.createElement("h2");
      h.textContent = page.title;
      view.appendChild(h);
      page.build(view);
      input.value = url;
    }
    view.addEventListener("go", function (e) {
      hist.push(input.value);
      show(e.detail);
    });
    bar.addEventListener("submit", function (e) {
      e.preventDefault();
      hist.push(input.value);
      show(input.value.trim());
    });
    back.addEventListener("click", function () {
      var prev = hist.pop();
      if (prev) show(prev);
    });
    body.appendChild(bar);
    body.appendChild(view);
    show("hearth://home");
  });

  var modem = { up: false, bbs: false, job: 0, ctx: null, nodes: [], timer: null, showBoard: null };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DTMF = {
    "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
    "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
    "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
    "0": [941, 1336]
  };
  var SHELF = [
    { title: "Kettle at 2am", peer: "Lin Park", kb: 840, notes: [523, 659, 784, 659, 523] },
    { title: "Harbor Late", peer: "Rook Pell", kb: 1204, notes: [392, 440, 494, 440, 349] },
    { title: "Glass Word", peer: "night board", kb: 640, notes: [880, 988, 1046, 880] },
    { title: "Picnic Wrong", peer: "Mara", kb: 990, notes: [330, 392, 330, 294] },
    { title: "Aerial Rain", peer: "harbor kids", kb: 1500, notes: [494, 523, 587, 523, 494, 440] },
    { title: "Marrow March", peer: "Lin Park", kb: 760, notes: [262, 330, 392, 330, 262] },
    { title: "Desk Lamp", peer: "Rook Pell", kb: 430, notes: [220, 247, 262, 220] },
    { title: "Seam Light", peer: "builder", kb: 2100, notes: [698, 784, 880, 784] }
  ];
  var LIME = [
    { name: "kettle-at-2am.mp3", kind: "tone", notes: [523, 659, 784, 659], blurb: "An original desk tone. Not a record from a real swap network." },
    { name: "glass-word.mp3", kind: "tone", notes: [880, 988, 1046, 880], blurb: "Another original tone." },
    { name: "note-from-lin.txt", kind: "note", blurb: "Lin says the cat is still not the password. The modem number on this desk is a story." },
    { name: "harbor-march.jpg", kind: "note", blurb: "That picture is already on the desk. Harbor.jpg." },
    { name: "free-money.exe", kind: "bad", blurb: "The desk quarantined this. It does not run." },
    { name: "picnic-map.exe", kind: "bad", blurb: "Quarantine. The red X was sandwiches." },
    { name: "night-wire-skin.zip", kind: "note", blurb: "A gray window. You already have one." },
    { name: "blank-floppy.bin", kind: "note", blurb: "The label never stuck." }
  ];

  function lineCtx() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!modem.ctx) modem.ctx = new AC();
    if (modem.ctx.state === "suspended") modem.ctx.resume();
    return modem.ctx;
  }

  function silence() {
    modem.nodes.forEach(function (node) {
      try { node.stop(); } catch (e) { /* already stopped */ }
    });
    modem.nodes = [];
  }

  function tone(ctx, freq, start, dur, type, gain) {
    var osc = ctx.createOscillator();
    var amp = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, start);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain || 0.03, start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.05, dur));
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.03);
    modem.nodes.push(osc);
  }

  function hiss(ctx, start, dur, gain) {
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var i;
    for (i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    var filter = ctx.createBiquadFilter();
    var amp = ctx.createGain();
    src.buffer = buf;
    filter.type = "bandpass";
    filter.frequency.value = 1700;
    filter.Q.value = 0.6;
    amp.gain.value = gain || 0.02;
    src.connect(filter);
    filter.connect(amp);
    amp.connect(ctx.destination);
    src.start(start);
    src.stop(start + dur);
    modem.nodes.push(src);
  }

  function handshake(number) {
    var ctx = lineCtx();
    if (!ctx || reduceMotion) {
      if (ctx) tone(ctx, 440, ctx.currentTime, 0.12, "square", 0.03);
      return;
    }
    var t = ctx.currentTime + 0.05;
    tone(ctx, 350, t, 0.55, "sine", 0.03);
    tone(ctx, 440, t, 0.55, "sine", 0.03);
    t += 0.65;
    String(number || "5550198").replace(/\D/g, "").split("").forEach(function (digit) {
      if (!DTMF[digit]) return;
      tone(ctx, DTMF[digit][0], t, 0.1, "sine", 0.035);
      tone(ctx, DTMF[digit][1], t, 0.1, "sine", 0.035);
      t += 0.16;
    });
    t += 0.2;
    tone(ctx, 440, t, 0.7, "sine", 0.03);
    tone(ctx, 480, t, 0.7, "sine", 0.03);
    t += 0.9;
    hiss(ctx, t, 0.08, 0.04);
    t += 0.12;
    [620, 1200, 1860, 900, 2200, 1480, 760, 2400].forEach(function (freq, i) {
      tone(ctx, freq, t, 0.08, i % 2 ? "square" : "sawtooth", 0.018);
      if (i % 3 === 0) hiss(ctx, t, 0.06, 0.018);
      t += 0.09;
    });
    tone(ctx, 2100, t, 0.35, "sine", 0.02);
  }

  function playNotes(notes) {
    var ctx = lineCtx();
    if (!ctx) return;
    var t = ctx.currentTime + 0.02;
    notes.forEach(function (freq) {
      tone(ctx, freq, t, 0.18, "square", 0.04);
      t += 0.2;
    });
  }

  function lineLabel() {
    if (modem.up) return "connected at 28800";
    if (modem.bbs) return "Harbor Board, no internet";
    return "on the hook";
  }

  function paintLine() {
    var busy = modem.up || modem.bbs;
    document.querySelectorAll("[data-modem-lamp]").forEach(function (el) {
      el.classList.toggle("is-on", busy);
    });
    document.querySelectorAll("[data-modem-state]").forEach(function (el) {
      el.textContent = lineLabel();
    });
    document.querySelectorAll("[data-modem-call]").forEach(function (el) {
      el.textContent = busy ? "Hang up" : "Call";
    });
    document.querySelectorAll("[data-modem-board]").forEach(function (el) {
      el.textContent = busy ? "Hang up" : "Harbor Board";
    });
  }

  function hangUp(quiet) {
    modem.job += 1;
    modem.up = false;
    modem.bbs = false;
    if (modem.timer) clearInterval(modem.timer);
    modem.timer = null;
    silence();
    paintLine();
    if (!quiet && modem.log && modem.log.isConnected) modem.log.textContent += "click. the line is down.\n";
    if (modem.showBoard) modem.showBoard();
  }

  function needLine(status) {
    if (modem.up) return true;
    status.textContent = modem.bbs
      ? "The phone is on the Harbor Board. Hang up, then call the wire."
      : "The modem is on the hook. Open Dial Tone and call.";
    return false;
  }

  function placeCall(mode) {
    if (modem.up || modem.bbs) {
      hangUp(false);
      return;
    }
    var board = mode === "bbs";
    var job = modem.job + 1;
    modem.job = job;
    if (modem.timer) clearInterval(modem.timer);
    silence();
    if (modem.log && modem.log.isConnected) modem.log.textContent = "";
    var lines = reduceMotion
      ? [[0, "off the hook"], [80, board ? "Harbor Board answered." : "carrier 28800"], [160, board ? "You are on the board." : "The Night Wire is up."]]
      : board
        ? [
          [0, "off the hook"],
          [500, "dial tone"],
          [1200, "dialing 555-0147"],
          [2500, "ringing a local board"],
          [3600, "answer"],
          [3900, "this call is direct, no internet"],
          [4500, "Harbor Board says hello."]
        ]
        : [
          [0, "off the hook"],
          [500, "dial tone"],
          [1200, "dialing 555-0198"],
          [2500, "ringing the night board"],
          [3600, "answer"],
          [3900, "handshake"],
          [5000, "carrier 28800"],
          [5400, "The Night Wire is up."]
        ];
    var step = 0;
    var started = Date.now();
    try { handshake(board ? "5550147" : "5550198"); } catch (e) { /* this browser has no tone */ }
    modem.timer = setInterval(function () {
      if (modem.job !== job) {
        clearInterval(modem.timer);
        return;
      }
      var elapsed = Date.now() - started;
      var log = modem.log;
      while (step < lines.length && elapsed >= lines[step][0]) {
        if (log && log.isConnected) {
          log.textContent += lines[step][1] + "\n";
          log.scrollTop = log.scrollHeight;
        }
        step += 1;
      }
      if (step >= lines.length) {
        clearInterval(modem.timer);
        modem.timer = null;
        if (modem.job !== job) return;
        modem.up = !board;
        modem.bbs = board;
        paintLine();
        if (board && modem.showBoard) modem.showBoard();
        else if (board) H.open("bbs");
      }
    }, 40);
  }

  function pour(bar, done) {
    if (reduceMotion) {
      bar.style.width = "100%";
      done();
      return;
    }
    var n = 0;
    var timer = setInterval(function () {
      n += 10 + Math.floor(Math.random() * 14);
      if (n > 100) n = 100;
      bar.style.width = n + "%";
      if (n >= 100) {
        clearInterval(timer);
        done();
      }
    }, 160);
  }

  var offEl = document.getElementById("off");
  if (offEl && window.MutationObserver) {
    new MutationObserver(function () {
      if (!offEl.hidden) hangUp(true);
    }).observe(offEl, { attributes: true, attributeFilter: ["hidden"] });
  }

  H.register("dial", function (body) {
    var log = document.createElement("pre");
    log.className = "prompt-out sunken";
    log.textContent = "Hearth modem. One phone line.\nCall reaches the internet at 555-0198.\nHarbor Board is a direct call at 555-0147. That one has no internet.\n";
    modem.log = log;
    var row = document.createElement("div");
    row.className = "row";
    var lamp = document.createElement("span");
    lamp.className = "modem-lamp";
    lamp.dataset.modemLamp = "1";
    var state = document.createElement("span");
    state.dataset.modemState = "1";
    state.textContent = modem.up ? "connected at 28800" : "on the hook";
    var call = document.createElement("button");
    call.type = "button";
    call.className = "raised";
    call.dataset.modemCall = "1";
    call.textContent = (modem.up || modem.bbs) ? "Hang up" : "Call";
    var boardBtn = document.createElement("button");
    boardBtn.type = "button";
    boardBtn.className = "raised";
    boardBtn.dataset.modemBoard = "1";
    boardBtn.textContent = (modem.up || modem.bbs) ? "Hang up" : "Harbor Board";
    var openWire = document.createElement("button");
    openWire.type = "button";
    openWire.className = "raised";
    openWire.textContent = "Night Wire";
    openWire.addEventListener("click", function () { H.open("wireweb"); });
    var openOld = document.createElement("button");
    openOld.type = "button";
    openOld.className = "raised";
    openOld.textContent = "Old Lines";
    openOld.addEventListener("click", function () { H.open("oldlines"); });
    call.addEventListener("click", function () { placeCall("net"); });
    boardBtn.addEventListener("click", function () { placeCall("bbs"); });
    paintLine();
    row.appendChild(call);
    row.appendChild(boardBtn);
    row.appendChild(lamp);
    row.appendChild(state);
    row.appendChild(openWire);
    row.appendChild(openOld);
    body.appendChild(row);
    body.appendChild(log);
  });

  H.register("wireweb", function (body) {
    var note = document.createElement("p");
    note.className = "honest";
    note.textContent = "Night Wire searches archive.org, which has been on the web since 1996. This window does not download those files. DuckDuckGo is newer than this room, so it opens beside the desk.";
    var state = document.createElement("p");
    state.dataset.modemState = "1";
    state.textContent = modem.up ? "connected at 28800" : "on the hook";
    var form = document.createElement("form");
    form.className = "page-bar";
    var input = document.createElement("input");
    input.setAttribute("aria-label", "Search the stacks");
    input.maxLength = 80;
    input.placeholder = "radio, moon, harbor";
    var go = document.createElement("button");
    go.type = "submit";
    go.className = "raised";
    go.textContent = "Search Archive";
    var duck = document.createElement("button");
    duck.type = "button";
    duck.className = "raised";
    duck.textContent = "DuckDuckGo";
    form.appendChild(input);
    form.appendChild(go);
    form.appendChild(duck);
    var view = document.createElement("div");
    view.className = "page-view sunken";
    var head = document.createElement("h2");
    head.textContent = "The Night Wire";
    view.appendChild(head);
    addP(view, "A fictional 1998 browser on Rook's desk. The line number is a story.");
    duck.addEventListener("click", function () {
      if (!needLine(state)) return;
      var q = input.value.trim();
      if (!q) {
        state.textContent = "Type a word first.";
        return;
      }
      window.open("https://duckduckgo.com/?q=" + encodeURIComponent(q), "_blank", "noopener");
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!needLine(state)) return;
      var q = input.value.trim();
      if (!q) {
        state.textContent = "Type a word. The stacks are large.";
        return;
      }
      state.textContent = "asking archive.org...";
      go.disabled = true;
      var url = "https://archive.org/advancedsearch.php?q=" + encodeURIComponent(q) +
        "&fl[]=identifier&fl[]=title&fl[]=year&fl[]=mediatype&rows=8&page=1&output=json";
      fetch(url).then(function (res) {
        if (!res.ok) throw new Error("archive");
        return res.json();
      }).then(function (data) {
        var docs = data && data.response && data.response.docs ? data.response.docs : [];
        view.innerHTML = "";
        var found = document.createElement("h2");
        found.textContent = docs.length ? "Stacks" : "Nothing under that word";
        view.appendChild(found);
        if (!docs.length) addP(view, "Try a plainer word, or open DuckDuckGo.");
        docs.forEach(function (doc) {
          var title = Array.isArray(doc.title) ? doc.title[0] : doc.title;
          var year = Array.isArray(doc.year) ? doc.year[0] : doc.year;
          var a = document.createElement("a");
          a.className = "wire-hit";
          a.target = "_blank";
          a.rel = "noopener";
          a.href = "https://archive.org/details/" + encodeURIComponent(doc.identifier || "");
          a.textContent = String(title || doc.identifier || "Untitled") +
            (year ? " (" + year + ")" : "") +
            (doc.mediatype ? " · " + doc.mediatype : "");
          view.appendChild(a);
        });
        state.textContent = modem.up ? "connected at 28800" : "on the hook";
      }).catch(function () {
        view.innerHTML = "";
        addP(view, "The stacks did not answer.");
        var a = document.createElement("a");
        a.href = "https://archive.org/search?query=" + encodeURIComponent(q);
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "Open this search on archive.org";
        view.appendChild(a);
        state.textContent = "the wire hiccuped. the link above still leaves the desk.";
      }).then(function () { go.disabled = false; });
    });
    body.appendChild(note);
    body.appendChild(state);
    body.appendChild(form);
    body.appendChild(view);
  });

  H.register("swap", function (body) {
    var note = document.createElement("p");
    note.className = "honest";
    note.textContent = "Night Swap is a pretend song board. It is not Napster. These tones were written for this desk. Nothing here is someone else's record.";
    var state = document.createElement("p");
    state.dataset.modemState = "1";
    state.textContent = modem.up ? "connected at 28800" : "on the hook";
    var form = document.createElement("form");
    form.className = "page-bar";
    var input = document.createElement("input");
    input.setAttribute("aria-label", "Find a tone");
    input.placeholder = "harbor, kettle, lin";
    var go = document.createElement("button");
    go.type = "submit";
    go.className = "raised";
    go.textContent = "Find";
    form.appendChild(input);
    form.appendChild(go);
    var list = document.createElement("div");
    list.className = "page-view sunken";
    var meter = document.createElement("div");
    meter.className = "meter";
    var fill = document.createElement("span");
    meter.appendChild(fill);
    function show(rows) {
      list.innerHTML = "";
      if (!rows.length) addP(list, "Nobody on the night board has that.");
      rows.forEach(function (row) {
        var line = document.createElement("div");
        line.className = "row";
        var label = document.createElement("span");
        label.textContent = row.title + " · " + row.peer + " · " + row.kb + " KB";
        var get = document.createElement("button");
        get.type = "button";
        get.className = "raised";
        get.textContent = "Get";
        get.addEventListener("click", function () {
          if (!needLine(state)) return;
          Array.prototype.forEach.call(line.querySelectorAll("button"), function (b) {
            if (b !== get) b.remove();
          });
          get.disabled = true;
          fill.style.width = "0";
          state.textContent = "pulling " + row.title + "...";
          pour(fill, function () {
            get.disabled = false;
            state.textContent = row.title + " is on the shelf.";
            var play = document.createElement("button");
            play.type = "button";
            play.className = "raised";
            play.textContent = "Play";
            play.addEventListener("click", function () { playNotes(row.notes); });
            line.appendChild(play);
          });
        });
        line.appendChild(label);
        line.appendChild(get);
        list.appendChild(line);
      });
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!needLine(state)) return;
      var q = input.value.trim().toLowerCase();
      show(SHELF.filter(function (row) {
        return !q || (row.title + " " + row.peer).toLowerCase().indexOf(q) !== -1;
      }));
    });
    show(SHELF);
    body.appendChild(note);
    body.appendChild(state);
    body.appendChild(form);
    body.appendChild(meter);
    body.appendChild(list);
  });

  H.register("lime", function (body) {
    var note = document.createElement("p");
    note.className = "honest";
    note.textContent = "Lime Line is a pretend file wire. It is not LimeWire. The files are jokes and original tones. Quarantine means the desk refuses to run them.";
    var state = document.createElement("p");
    state.dataset.modemState = "1";
    state.textContent = modem.up ? "connected at 28800" : "on the hook";
    var form = document.createElement("form");
    form.className = "page-bar";
    var input = document.createElement("input");
    input.setAttribute("aria-label", "Search the wire");
    input.placeholder = "mp3, exe, harbor";
    var go = document.createElement("button");
    go.type = "submit";
    go.className = "raised";
    go.textContent = "Search";
    form.appendChild(input);
    form.appendChild(go);
    var list = document.createElement("div");
    list.className = "page-view sunken lime-list";
    var meter = document.createElement("div");
    meter.className = "meter";
    var fill = document.createElement("span");
    fill.style.background = "#208040";
    meter.appendChild(fill);
    function show(rows) {
      list.innerHTML = "";
      if (!rows.length) addP(list, "The wire has no file by that name.");
      rows.forEach(function (row) {
        var line = document.createElement("div");
        line.className = "row";
        var label = document.createElement("span");
        label.textContent = row.name;
        var get = document.createElement("button");
        get.type = "button";
        get.className = "raised";
        get.textContent = "Get";
        get.addEventListener("click", function () {
          if (!needLine(state)) return;
          Array.prototype.forEach.call(line.querySelectorAll("button"), function (b) {
            if (b !== get) b.remove();
          });
          get.disabled = true;
          fill.style.width = "0";
          state.textContent = "receiving " + row.name + "...";
          pour(fill, function () {
            get.disabled = false;
            if (row.kind === "bad") {
              state.textContent = row.blurb;
              return;
            }
            if (row.kind === "tone") {
              state.textContent = row.name + " landed. It is a desk tone.";
              var play = document.createElement("button");
              play.type = "button";
              play.className = "raised";
              play.textContent = "Play";
              play.addEventListener("click", function () { playNotes(row.notes); });
              line.appendChild(play);
              return;
            }
            state.textContent = row.blurb;
          });
        });
        line.appendChild(label);
        line.appendChild(get);
        list.appendChild(line);
      });
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!needLine(state)) return;
      var q = input.value.trim().toLowerCase();
      show(LIME.filter(function (row) {
        return !q || row.name.toLowerCase().indexOf(q) !== -1;
      }));
    });
    show(LIME);
    body.appendChild(note);
    body.appendChild(state);
    body.appendChild(form);
    body.appendChild(meter);
    body.appendChild(list);
  });

  H.register("oldlines", function (body) {
    var note = document.createElement("p");
    note.className = "honest";
    note.textContent = "Before the pretend song boards, files moved in older ways. Harbor Board is a direct phone call. The other rooms need the internet from Dial Tone. These are desk fictions, not those old networks.";
    var list = document.createElement("div");
    list.className = "page-view sunken";
    [
      ["Harbor Board", "bbs", "A local board. Messages, a short file list, and a one-room text game."],
      ["File Pier", "ftp", "Walk a directory with dir, cd, and get. That is the old file-transfer shape."],
      ["News Spool", "news", "Public notes. One group splits a short file into parts you join."],
      ["Relay Room", "relay", "A chat room. A shelf bot hands you a tone if you ask."],
      ["Basement Discs", "discs", "One page of desk artists. The file comes from the site, not from a stranger's computer."]
    ].forEach(function (row) {
      var line = document.createElement("div");
      line.className = "row";
      var label = document.createElement("span");
      label.textContent = row[0] + " — " + row[2];
      var open = document.createElement("button");
      open.type = "button";
      open.className = "raised";
      open.textContent = "Open";
      open.addEventListener("click", function () { H.open(row[1]); });
      line.appendChild(label);
      line.appendChild(open);
      list.appendChild(line);
    });
    body.appendChild(note);
    body.appendChild(list);
  });

  H.register("bbs", function (body) {
    var note = document.createElement("p");
    note.className = "honest";
    note.textContent = "Harbor Board is a pretend local bulletin board. Calling it uses the phone by itself, so the internet drops. It does not carry anyone else's game or records.";
    var state = document.createElement("p");
    state.dataset.modemState = "1";
    state.textContent = lineLabel();
    var row = document.createElement("div");
    row.className = "row";
    var dial = document.createElement("button");
    dial.type = "button";
    dial.className = "raised";
    dial.dataset.modemBoard = "1";
    dial.textContent = (modem.up || modem.bbs) ? "Hang up" : "Harbor Board";
    row.appendChild(dial);
    dial.addEventListener("click", function () { placeCall("bbs"); });
    var screen = document.createElement("pre");
    screen.className = "term";
    var form = document.createElement("form");
    form.className = "page-bar";
    var input = document.createElement("input");
    input.className = "term-in";
    input.setAttribute("aria-label", "Board command");
    input.placeholder = "n, f, g, look, q";
    var go = document.createElement("button");
    go.type = "submit";
    go.className = "raised";
    go.textContent = "Send";
    form.appendChild(input);
    form.appendChild(go);
    var room = "office";
    var lampOn = false;
    function write(text) { screen.textContent = text; }
    function menuText() {
      return [
        "HARBOR BOARD",
        "March 1998. You are the only caller.",
        "",
        "N  notes",
        "F  files",
        "G  gate, a one-room game",
        "Q  goodbye",
        "",
        "Type a letter."
      ].join("\n");
    }
    function filesText() {
      return [
        "FILE LIST",
        "readme.txt     a note from the sysop",
        "kettle.ton     an original desk tone",
        "ash.txt        points at Ash Cells on this desk",
        "",
        "Type get readme, get kettle, or get ash."
      ].join("\n");
    }
    function draw() {
      state.textContent = lineLabel();
      dial.textContent = (modem.up || modem.bbs) ? "Hang up" : "Harbor Board";
      if (!modem.bbs) {
        write("The board is dark.\nPress Harbor Board.\n555-0147 is a story. One phone line.");
        return;
      }
      write(menuText());
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!modem.bbs) {
        state.textContent = "The board is not on the line.";
        return;
      }
      var cmd = input.value.trim().toLowerCase();
      input.value = "";
      if (cmd === "n" || cmd === "notes") {
        write("NOTES\nLin: the cat is still not a password.\nRook: I left the lamp on in the gate.\nSysop: files are desk fiction. Take one with get.");
        return;
      }
      if (cmd === "f" || cmd === "files") {
        write(filesText());
        return;
      }
      if (cmd === "get readme" || cmd === "get readme.txt") {
        write("SYSOP NOTE\nThis board hangs off one phone line.\nWhen you want the internet again, hang up and call 555-0198.");
        return;
      }
      if (cmd === "get kettle" || cmd === "get kettle.ton") {
        playNotes([523, 659, 784, 659, 523]);
        write("kettle.ton played. It was written for this desk.");
        return;
      }
      if (cmd === "get ash" || cmd === "get ash.txt") {
        write("ash.txt\nAsh Cells is already on the desk. Opening it.");
        H.open("ash");
        return;
      }
      if (cmd === "g" || cmd === "gate" || cmd === "game") {
        room = "office";
        lampOn = false;
        write("GATE\nYou are in a small office. A lamp is dark. A door leads to the pier.\nType look, lamp, pier, or leave.");
        return;
      }
      if (cmd === "look") {
        write(room === "pier"
          ? "The water is black. A bell buoy clanks. Type office or leave."
          : "The office is " + (lampOn ? "lit." : "dark.") + " The door faces the pier.\nType lamp, pier, or leave.");
        return;
      }
      if (cmd === "lamp") {
        lampOn = !lampOn;
        write(lampOn ? "You turn the lamp on." : "You turn the lamp off.");
        return;
      }
      if (cmd === "pier" || cmd === "door") {
        room = "pier";
        write("You step onto the pier. Type look, office, or leave.");
        return;
      }
      if (cmd === "office") {
        room = "office";
        write("Back in the office. Type look.");
        return;
      }
      if (cmd === "q" || cmd === "quit" || cmd === "leave" || cmd === "goodbye") {
        write("The board says goodbye.");
        hangUp(false);
        return;
      }
      write("The board does not know \"" + cmd + "\".\nTry n, f, g, or q.");
    });
    modem.showBoard = draw;
    draw();
    body.appendChild(note);
    body.appendChild(state);
    body.appendChild(row);
    body.appendChild(screen);
    body.appendChild(form);
  });

  H.register("ftp", function (body) {
    var note = document.createElement("p");
    note.className = "honest";
    note.textContent = "File Pier is a pretend file-transfer directory. The folders are fiction on this desk. Nothing is fetched from a university or a company.";
    var state = document.createElement("p");
    state.dataset.modemState = "1";
    state.textContent = lineLabel();
    var screen = document.createElement("pre");
    screen.className = "term";
    var form = document.createElement("form");
    form.className = "page-bar";
    var input = document.createElement("input");
    input.className = "term-in";
    input.setAttribute("aria-label", "File Pier command");
    input.placeholder = "dir, cd pub, get welcome.txt";
    var go = document.createElement("button");
    go.type = "submit";
    go.className = "raised";
    go.textContent = "Send";
    form.appendChild(input);
    form.appendChild(go);
    var cwd = "/";
    var dirs = {
      "/": ["pub"],
      "/pub": ["notes", "tones", "software"],
      "/pub/notes": [],
      "/pub/tones": [],
      "/pub/software": []
    };
    var files = {
      "/": [],
      "/pub": [],
      "/pub/notes": ["welcome.txt"],
      "/pub/tones": ["kettle.txt"],
      "/pub/software": ["ash.txt"]
    };
    function parentOf(path) {
      if (path === "/") return "/";
      var cut = path.lastIndexOf("/");
      return cut <= 0 ? "/" : path.slice(0, cut);
    }
    function listing() {
      var lines = ["ftp harbor.desk", "cwd " + cwd];
      (dirs[cwd] || []).forEach(function (name) { lines.push("dir   " + name); });
      (files[cwd] || []).forEach(function (name) { lines.push("file  " + name); });
      if (cwd !== "/") lines.push("dir   ..");
      lines.push("", "dir, cd name, cd .., get file");
      return lines.join("\n");
    }
    function draw() {
      state.textContent = lineLabel();
      screen.textContent = modem.up ? listing() : "The pier is closed.\nCall the wire from Dial Tone first.\nThis room needs the internet, not the Harbor Board.";
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!needLine(state)) {
        draw();
        return;
      }
      var parts = input.value.trim().toLowerCase().split(/\s+/);
      input.value = "";
      var cmd = parts[0] || "";
      var arg = parts.slice(1).join(" ");
      if (cmd === "dir" || cmd === "ls" || cmd === "") {
        draw();
        return;
      }
      if (cmd === "cd") {
        var next = arg === ".." ? parentOf(cwd) : (cwd === "/" ? "/" + arg : cwd + "/" + arg);
        if (!dirs[next]) {
          screen.textContent = listing() + "\n\nNo directory named " + (arg || "(blank)") + ".";
          return;
        }
        cwd = next;
        draw();
        return;
      }
      if (cmd === "get") {
        var have = (files[cwd] || []).indexOf(arg) !== -1;
        if (!have) {
          screen.textContent = listing() + "\n\nNo file named " + (arg || "(blank)") + ".";
          return;
        }
        if (arg === "welcome.txt") {
          screen.textContent = "welcome.txt\nPeople moved files this way before the web was common.\nOn this desk the files were written for the game.";
          return;
        }
        if (arg === "kettle.txt") {
          playNotes([523, 659, 784, 659]);
          screen.textContent = "kettle.txt\nPlayed an original tone. The pier did not send a record.";
          return;
        }
        screen.textContent = "ash.txt\nAsh Cells is on the desk already.";
        H.open("ash");
        return;
      }
      screen.textContent = listing() + "\n\nTry dir, cd, or get.";
    });
    draw();
    body.appendChild(note);
    body.appendChild(state);
    body.appendChild(screen);
    body.appendChild(form);
  });

  H.register("news", function (body) {
    var note = document.createElement("p");
    note.className = "honest";
    note.textContent = "News Spool is a pretend public note system. The posts were written for this desk. The split file is three lines of text, not someone else's program.";
    var state = document.createElement("p");
    state.dataset.modemState = "1";
    state.textContent = lineLabel();
    var view = document.createElement("div");
    view.className = "page-view sunken";
    var saved = {};
    var groups = [
      { id: "desk.talk", posts: ["Lin: the kettle is loud again.", "Rook: leave the board if you want the internet."] },
      { id: "desk.audio", posts: ["Sysop: tones on this desk are original. Do not look for other people's songs here."] },
      { id: "desk.parts", posts: [] }
    ];
    var parts = {
      a: "the board was here ",
      b: "before the swap. ",
      c: "the line is still one phone."
    };
    function barrier() {
      view.innerHTML = "";
      addP(view, modem.bbs ? "The phone is on the Harbor Board. Hang up, then call the wire." : "Call the wire from Dial Tone. The spool needs the internet.");
      var again = document.createElement("button");
      again.type = "button";
      again.className = "raised";
      again.textContent = "Look again";
      again.addEventListener("click", showGroups);
      view.appendChild(again);
    }
    function showGroups() {
      if (!modem.up) {
        barrier();
        return;
      }
      view.innerHTML = "";
      var h = document.createElement("h2");
      h.textContent = "Groups";
      view.appendChild(h);
      groups.forEach(function (group) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "track";
        b.textContent = group.id;
        b.addEventListener("click", function () { showGroup(group); });
        view.appendChild(b);
      });
    }
    function showGroup(group) {
      view.innerHTML = "";
      var h = document.createElement("h2");
      h.textContent = group.id;
      view.appendChild(h);
      group.posts.forEach(function (text) { addP(view, text); });
      if (group.id === "desk.parts") {
        addP(view, "Three text parts. Save each one, then join them.");
        Object.keys(parts).forEach(function (key) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "raised";
          b.textContent = saved[key] ? "part " + key + " saved" : "Save part " + key;
          b.addEventListener("click", function () {
            if (!needLine(state)) return;
            saved[key] = true;
            b.textContent = "part " + key + " saved";
          });
          view.appendChild(b);
        });
        var join = document.createElement("button");
        join.type = "button";
        join.className = "raised";
        join.textContent = "Join the parts";
        join.addEventListener("click", function () {
          if (!needLine(state)) return;
          if (!saved.a || !saved.b || !saved.c) {
            state.textContent = "Save part a, part b, and part c.";
            return;
          }
          addP(view, parts.a + parts.b + parts.c);
          state.textContent = "The parts sat back together.";
        });
        view.appendChild(join);
      }
      var back = document.createElement("button");
      back.type = "button";
      back.className = "raised";
      back.textContent = "Groups";
      back.addEventListener("click", showGroups);
      view.appendChild(back);
    }
    showGroups();
    body.appendChild(note);
    body.appendChild(state);
    body.appendChild(view);
  });

  H.register("relay", function (body) {
    var note = document.createElement("p");
    note.className = "honest";
    note.textContent = "Relay Room is a pretend chat. The shelf bot only has original desk tones. It is not a real relay network.";
    var state = document.createElement("p");
    state.dataset.modemState = "1";
    state.textContent = lineLabel();
    var screen = document.createElement("pre");
    screen.className = "term";
    var form = document.createElement("form");
    form.className = "page-bar";
    var input = document.createElement("input");
    input.className = "term-in";
    input.setAttribute("aria-label", "Say something");
    input.placeholder = "!list  or  !get kettle";
    var go = document.createElement("button");
    go.type = "submit";
    go.className = "raised";
    go.textContent = "Send";
    form.appendChild(input);
    form.appendChild(go);
    var lines = [];
    function push(text) {
      lines.push(text);
      if (lines.length > 14) lines = lines.slice(lines.length - 14);
      screen.textContent = lines.join("\n");
      screen.scrollTop = screen.scrollHeight;
    }
    function hello() {
      lines = [];
      if (!modem.up) {
        push(modem.bbs ? "The phone is on the Harbor Board." : "The relay is quiet. Call the wire first.");
        return;
      }
      push("* you join #harbor");
      push("<lin> you made it past the squeal");
      push("<shelfbot> tones: kettle, harbor, glass. say !get kettle");
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!needLine(state)) {
        hello();
        return;
      }
      var text = input.value.trim();
      input.value = "";
      if (!text) return;
      if (!lines.length || lines[0].indexOf("quiet") !== -1 || lines[0].indexOf("Harbor") !== -1) hello();
      push("<you> " + text);
      var low = text.toLowerCase();
      if (low === "!list" || low === "!help") {
        push("<shelfbot> !get kettle, !get harbor, !get glass");
        return;
      }
      if (low.indexOf("!get kettle") !== -1) {
        playNotes([523, 659, 784, 659]);
        push("<shelfbot> sent kettle. an original tone.");
        return;
      }
      if (low.indexOf("!get harbor") !== -1) {
        playNotes([392, 440, 494, 440]);
        push("<shelfbot> sent harbor.");
        return;
      }
      if (low.indexOf("!get glass") !== -1) {
        playNotes([880, 988, 1046, 880]);
        push("<shelfbot> sent glass.");
        return;
      }
      push("<rook> mm. the kettle is loud.");
    });
    hello();
    body.appendChild(note);
    body.appendChild(state);
    body.appendChild(screen);
    body.appendChild(form);
  });

  H.register("discs", function (body) {
    var note = document.createElement("p");
    note.className = "honest";
    note.textContent = "Basement Discs is a pretend artist page. The file comes from this one site. It is not a peer board, and it is not a real archive from that decade. The tones were written for this desk.";
    var state = document.createElement("p");
    state.dataset.modemState = "1";
    state.textContent = lineLabel();
    var list = document.createElement("div");
    list.className = "page-view sunken";
    var meter = document.createElement("div");
    meter.className = "meter";
    var fill = document.createElement("span");
    meter.appendChild(fill);
    var artists = [
      { who: "Lin Park", title: "Kettle at 2am", notes: [523, 659, 784, 659, 523] },
      { who: "Rook Pell", title: "Harbor Late", notes: [392, 440, 494, 440, 349] },
      { who: "Mara", title: "Picnic Wrong", notes: [330, 392, 330, 294] }
    ];
    artists.forEach(function (row) {
      var line = document.createElement("div");
      line.className = "row";
      var label = document.createElement("span");
      label.textContent = row.who + " — " + row.title;
      var get = document.createElement("button");
      get.type = "button";
      get.className = "raised";
      get.textContent = "Get";
      get.addEventListener("click", function () {
        if (!needLine(state)) return;
        Array.prototype.forEach.call(line.querySelectorAll("button"), function (b) {
          if (b !== get) b.remove();
        });
        get.disabled = true;
        fill.style.width = "0";
        state.textContent = "the site is sending " + row.title + "...";
        pour(fill, function () {
          get.disabled = false;
          state.textContent = row.title + " came from Basement Discs.";
          var play = document.createElement("button");
          play.type = "button";
          play.className = "raised";
          play.textContent = "Play";
          play.addEventListener("click", function () { playNotes(row.notes); });
          line.appendChild(play);
        });
      });
      line.appendChild(label);
      line.appendChild(get);
      list.appendChild(line);
    });
    body.appendChild(note);
    body.appendChild(state);
    body.appendChild(meter);
    body.appendChild(list);
  });

  H.register("tidy", function (body) {
    var colors = ["#000080", "#008080", "#808000", "#800000", "#008000"];
    var cells = [];
    var grid = document.createElement("div");
    grid.className = "tidy-grid";
    var status = document.createElement("p");
    status.className = "honest";
    status.textContent = "Rook's drive is fine. This animation is for show.";
    for (var i = 0; i < 64; i++) {
      cells.push(colors[i % colors.length]);
      var c = document.createElement("div");
      c.className = "tidy-cell";
      grid.appendChild(c);
    }
    function paint() {
      for (var n = 0; n < cells.length; n++) grid.children[n].style.background = cells[n];
    }
    function shuffle() {
      for (var n = cells.length - 1; n > 0; n--) {
        var j = Math.floor(Math.random() * (n + 1));
        var t = cells[n];
        cells[n] = cells[j];
        cells[j] = t;
      }
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "raised";
    btn.textContent = "Tidy the blocks";
    btn.addEventListener("click", function () {
      shuffle();
      paint();
      var step = 0;
      var timer = setInterval(function () {
        cells.sort();
        paint();
        step += 1;
        if (step > 8) {
          clearInterval(timer);
          status.textContent = "Blocks in a row. The cat is unimpressed.";
        }
      }, 180);
    });
    paint();
    body.appendChild(btn);
    body.appendChild(status);
    body.appendChild(grid);
  });

  H.register("find", function (body) {
    var form = document.createElement("form");
    form.className = "page-bar";
    var input = document.createElement("input");
    input.setAttribute("aria-label", "Find");
    input.placeholder = "mail, harbor, stew";
    var go = document.createElement("button");
    go.type = "submit";
    go.className = "raised";
    go.textContent = "Find";
    form.appendChild(input);
    form.appendChild(go);
    var list = document.createElement("div");
    list.className = "track-list sunken";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim().toLowerCase();
      list.innerHTML = "";
      if (!q) return;
      H.files.forEach(function (f) {
        var hay = (f.name + " " + (f.body || "")).toLowerCase();
        if (hay.indexOf(q) === -1) return;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "track";
        b.textContent = f.name + (H.inBin(f) ? "  (in the Bin)" : "");
        b.addEventListener("click", function () {
          if (H.inBin(f)) H.alert("Find", "That one is in the Bin.");
          else H.open(f.id);
        });
        list.appendChild(b);
      });
      if (!list.children.length) list.textContent = "Nothing on the desk matches.";
    });
    body.appendChild(form);
    body.appendChild(list);
  });

  H.register("calendar", function (body) {
    var now = new Date();
    var label = document.createElement("p");
    label.className = "honest";
    label.textContent = now.toLocaleString(undefined, { month: "long", year: "numeric" }) + "  —  today is a real day. Rook's notes are stuck in March 1998.";
    var grid = document.createElement("div");
    grid.className = "calc-grid";
    var year = now.getFullYear();
    var month = now.getMonth();
    var first = new Date(year, month, 1).getDay();
    var days = new Date(year, month + 1, 0).getDate();
    var i;
    for (i = 0; i < first; i++) grid.appendChild(document.createElement("span"));
    for (i = 1; i <= days; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "raised";
      b.textContent = String(i);
      if (i === now.getDate()) b.style.fontWeight = "700";
      b.addEventListener("click", function () {
        H.alert("Day Page", "Rook wrote nothing on this real-world day. The diary is March 1998.");
      });
      grid.appendChild(b);
    }
    var old = document.createElement("button");
    old.type = "button";
    old.className = "raised";
    old.textContent = "Open March 1998";
    old.addEventListener("click", function () { H.open("diary"); });
    body.appendChild(label);
    body.appendChild(grid);
    body.appendChild(old);
  });

  H.register("cache", function (body) {
    var box = document.createElement("div");
    box.className = "about-copy sunken";
    [
      "Rook's cache",
      "",
      "A blank floppy, a brass key, and a note in the drawer.",
      "You found the desk the way Rook left it in March 1998.",
      "The picnic was real. The cat is not a password.",
      "The papers on the desk are not all mine.",
      "Sit as long as you want.",
      "",
      "Hearth Line night board"
    ].forEach(function (line) {
      var p = document.createElement("p");
      p.textContent = line;
      box.appendChild(p);
    });
    body.appendChild(box);
    H.beep();
  });

  var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SUITS = ["\u2660", "\u2665", "\u2666", "\u2663"];
  var RED = { "\u2665": 1, "\u2666": 1 };

  H.register("cards", function (body) {
    var deck = [];
    SUITS.forEach(function (s) {
      RANKS.forEach(function (r) { deck.push({ r: r, s: s }); });
    });
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    var cols = [[], [], [], [], [], [], []];
    var nCol;
    for (nCol = 0; nCol < 7; nCol++) {
      for (var n = 0; n <= nCol; n++) {
        var card = deck.pop();
        card.up = n === nCol;
        cols[nCol].push(card);
      }
    }
    var stock = deck;
    var waste = [];
    var found = [[], [], [], []];
    var sel = null;
    var top = document.createElement("div");
    top.className = "card-top";
    var stockB = document.createElement("button");
    stockB.type = "button";
    stockB.className = "pile raised";
    var wasteB = document.createElement("button");
    wasteB.type = "button";
    wasteB.className = "pile";
    var foundEls = [];
    var board = document.createElement("div");
    board.className = "cols";
    var status = document.createElement("p");
    status.className = "honest";
    status.textContent = "Hearth Stack. Click the deck, then a column. Kings fill an empty column.";
    function rn(r) { return RANKS.indexOf(r); }
    function label(card) { return card.r + card.s; }
    function takeSel() {
      if (!sel) return null;
      if (sel.where === "waste") return waste.pop();
      var col = cols[sel.col];
      return col.pop();
    }
    function paint() {
      stockB.textContent = stock.length ? "Deck" : "Turn";
      wasteB.innerHTML = "";
      if (waste.length) {
        var w = document.createElement("b");
        w.textContent = label(waste[waste.length - 1]);
        if (RED[waste[waste.length - 1].s]) w.className = "red";
        wasteB.appendChild(w);
      }
      foundEls.forEach(function (el, fi) {
        el.innerHTML = "";
        var pile = found[fi];
        if (!pile.length) return;
        var b = document.createElement("b");
        b.textContent = label(pile[pile.length - 1]);
        if (RED[pile[pile.length - 1].s]) b.className = "red";
        el.appendChild(b);
      });
      board.innerHTML = "";
      cols.forEach(function (col, ci) {
        var hold = document.createElement("div");
        hold.className = "col";
        if (!col.length) {
          var empty = document.createElement("button");
          empty.type = "button";
          empty.className = "raised";
          empty.textContent = "";
          empty.addEventListener("click", function () { dropOn(ci); });
          hold.appendChild(empty);
        }
        col.forEach(function (card, idx) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "raised" + (card.up ? "" : " down") + (card.up && RED[card.s] ? " red" : "");
          if (sel && sel.where === "col" && sel.col === ci && sel.idx === idx) b.classList.add("is-on");
          b.textContent = card.up ? label(card) : "";
          b.addEventListener("click", function () {
            if (!card.up) return;
            if (idx !== col.length - 1) {
              sel = { where: "col", col: ci, idx: idx };
              paint();
              return;
            }
            sel = { where: "col", col: ci, idx: idx };
            paint();
          });
          hold.appendChild(b);
        });
        board.appendChild(hold);
      });
      var done = found.every(function (p) { return p.length === 13; });
      if (done) status.textContent = "The stack is clear. Rook would be unbearable about it.";
    }
    function dropOn(ci) {
      if (!sel) return;
      var moving = [];
      if (sel.where === "waste") {
        if (!waste.length) return;
        moving = [waste[waste.length - 1]];
      } else {
        moving = cols[sel.col].slice(sel.idx);
      }
      var dest = cols[ci];
      var ok = !dest.length ? moving[0].r === "K" : (!!RED[moving[0].s] !== !!RED[dest[dest.length - 1].s] && rn(moving[0].r) + 1 === rn(dest[dest.length - 1].r));
      if (!ok) { status.textContent = "That card will not sit there."; return; }
      if (sel.where === "waste") waste.pop();
      else cols[sel.col] = cols[sel.col].slice(0, sel.idx);
      moving.forEach(function (c) { dest.push(c); });
      var from = sel.where === "col" ? cols[sel.col] : null;
      if (from && from.length) from[from.length - 1].up = true;
      sel = null;
      paint();
    }
    stockB.addEventListener("click", function () {
      if (!stock.length) {
        stock = waste.reverse();
        waste = [];
      } else waste.push(stock.pop());
      sel = null;
      paint();
    });
    wasteB.addEventListener("click", function () {
      if (!waste.length) return;
      sel = { where: "waste" };
      paint();
    });
    for (var f = 0; f < 4; f++) {
      var pile = document.createElement("button");
      pile.type = "button";
      pile.className = "pile";
      (function (fi, el) {
        el.addEventListener("click", function () {
          if (!sel) return;
          var card = sel.where === "waste" ? waste[waste.length - 1] : cols[sel.col][sel.idx];
          if (!card || (sel.where === "col" && sel.idx !== cols[sel.col].length - 1)) return;
          var pileCards = found[fi];
          var ok = !pileCards.length ? card.r === "A" : (pileCards[pileCards.length - 1].s === card.s && rn(card.r) === rn(pileCards[pileCards.length - 1].r) + 1);
          if (!ok) return;
          if (sel.where === "waste") waste.pop();
          else {
            cols[sel.col].pop();
            if (cols[sel.col].length) cols[sel.col][cols[sel.col].length - 1].up = true;
          }
          pileCards.push(card);
          sel = null;
          paint();
        });
      })(f, pile);
      foundEls.push(pile);
      top.appendChild(pile);
    }
    top.insertBefore(wasteB, top.firstChild);
    top.insertBefore(stockB, top.firstChild);
    board.addEventListener("click", function (e) {
      var colEl = e.target.closest ? e.target.closest(".col") : null;
      if (!colEl || !sel) return;
      var ci = Array.prototype.indexOf.call(board.children, colEl);
      if (ci < 0) return;
      if (e.target === colEl || e.target.classList.contains("down")) dropOn(ci);
    });
    cols.forEach(function (_, ci) {
      /* drop targets painted in paint() */
      void ci;
    });
    body.appendChild(top);
    body.appendChild(board);
    body.appendChild(status);
    paint();
    board.addEventListener("dblclick", function () {});
    var hint = document.createElement("p");
    hint.className = "honest";
    hint.textContent = "Select a face-up card, then click a column or a top pile.";
    body.appendChild(hint);
    board.onclick = null;
    Array.prototype.forEach.call;
    body.addEventListener("click", function (e) {
      if (!e.target.classList || !e.target.closest(".col")) return;
    });
  });

  /* column drop: bind after paint by delegating once */
  var cardsBound = false;
  var oldCards = H.files;
  void oldCards;
  void cardsBound;

  H.onRender(function () {
    var desk = document.getElementById("desktop");
    if (!desk) return;
    var notes = [
      { id: "s1", text: "Lin called.\nRead the mail.", x: 500, y: 24, rot: -2 },
      { id: "s2", text: "The cat sat on\nthe keys AGAIN.", x: 620, y: 150, rot: 2 },
      { id: "s3", text: "Off sends you\ninto the dark.", x: 540, y: 300, rot: -1 },
      { id: "s4", text: "Open Papers.\nThen the prompt.", x: 500, y: 180, rot: 1 }
    ];
    notes.forEach(function (note) {
      var saved = H.store.sticks[note.id] || {};
      var el = document.createElement("p");
      el.className = "sticky";
      el.textContent = note.text;
      el.style.left = (saved.x != null ? saved.x : note.x) + "px";
      el.style.top = (saved.y != null ? saved.y : note.y) + "px";
      el.style.transform = "rotate(" + note.rot + "deg)";
      el.addEventListener("pointerdown", function (ev) {
        if (ev.button !== 0) return;
        var sx = ev.clientX;
        var sy = ev.clientY;
        var sl = el.offsetLeft;
        var st = el.offsetTop;
        function move(e) {
          el.style.left = (sl + e.clientX - sx) + "px";
          el.style.top = (st + e.clientY - sy) + "px";
        }
        function up() {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          H.store.sticks[note.id] = { x: el.offsetLeft, y: el.offsetTop };
          H.save();
        }
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      });
      desk.appendChild(el);
    });
  });

  /* Make column drops work: patch cards by re-registering a cleaner game. */
  H.register("cards", mountCards);

  function mountCards(body) {
    var deck = [];
    SUITS.forEach(function (s) {
      RANKS.forEach(function (r) { deck.push({ r: r, s: s, up: false }); });
    });
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    var cols = [[], [], [], [], [], [], []];
    for (var c = 0; c < 7; c++) {
      for (var n = 0; n <= c; n++) {
        var card = deck.pop();
        card.up = n === c;
        cols[c].push(card);
      }
    }
    var stock = deck;
    var waste = [];
    var found = [[], [], [], []];
    var sel = null;
    var top = document.createElement("div");
    top.className = "card-top";
    var stockB = document.createElement("button");
    stockB.type = "button";
    stockB.className = "pile raised";
    var wasteB = document.createElement("button");
    wasteB.type = "button";
    wasteB.className = "pile";
    var foundEls = [];
    var board = document.createElement("div");
    board.className = "cols";
    var status = document.createElement("p");
    status.className = "honest";
    function rn(r) { return RANKS.indexOf(r); }
    function lab(card) { return card.r + card.s; }
    function paint() {
      stockB.textContent = stock.length ? "Deck " + stock.length : "Turn";
      wasteB.innerHTML = "";
      if (waste.length) {
        var mark = document.createElement("b");
        mark.textContent = lab(waste[waste.length - 1]);
        if (RED[waste[waste.length - 1].s]) mark.className = "red";
        if (sel && sel.where === "waste") mark.style.outline = "2px solid #000";
        wasteB.appendChild(mark);
      }
      foundEls.forEach(function (el, fi) {
        el.innerHTML = "";
        if (!found[fi].length) { el.textContent = "A"; return; }
        var mark = document.createElement("b");
        mark.textContent = lab(found[fi][found[fi].length - 1]);
        if (RED[found[fi][found[fi].length - 1].s]) mark.className = "red";
        el.appendChild(mark);
      });
      board.innerHTML = "";
      cols.forEach(function (col, ci) {
        var hold = document.createElement("div");
        hold.className = "col";
        hold.dataset.col = String(ci);
        if (!col.length) {
          var empty = document.createElement("button");
          empty.type = "button";
          empty.className = "raised";
          empty.textContent = " ";
          empty.addEventListener("click", function () { dropOn(ci); });
          hold.appendChild(empty);
        }
        col.forEach(function (card, idx) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "raised" + (card.up ? "" : " down") + (card.up && RED[card.s] ? " red" : "");
          if (sel && sel.where === "col" && sel.col === ci && sel.idx === idx) b.classList.add("is-on");
          b.textContent = card.up ? lab(card) : "";
          b.addEventListener("click", function (ev) {
            ev.stopPropagation();
            if (!card.up) {
              if (idx === col.length - 1) { card.up = true; paint(); }
              return;
            }
            sel = { where: "col", col: ci, idx: idx };
            status.textContent = "Selected " + lab(card) + ". Click a column or a top pile.";
            paint();
          });
          hold.appendChild(b);
        });
        board.appendChild(hold);
      });
      if (found.every(function (p) { return p.length === 13; })) status.textContent = "The stack is clear.";
    }
    function movingCards() {
      if (!sel) return [];
      if (sel.where === "waste") return waste.length ? [waste[waste.length - 1]] : [];
      return cols[sel.col].slice(sel.idx);
    }
    function dropOn(ci) {
      var moving = movingCards();
      if (!moving.length) return;
      var dest = cols[ci];
      var ok = !dest.length ? moving[0].r === "K" : (!!RED[moving[0].s] !== !!RED[dest[dest.length - 1].s] && rn(moving[0].r) + 1 === rn(dest[dest.length - 1].r));
      if (!ok) { status.textContent = "That card will not sit there."; return; }
      if (sel.where === "waste") waste.pop();
      else cols[sel.col] = cols[sel.col].slice(0, sel.idx);
      moving.forEach(function (card) { dest.push(card); });
      if (sel.where === "col" && cols[sel.col].length) cols[sel.col][cols[sel.col].length - 1].up = true;
      sel = null;
      paint();
    }
    stockB.addEventListener("click", function () {
      if (!stock.length) { stock = waste.reverse(); waste = []; }
      else waste.push(stock.pop());
      sel = null;
      paint();
    });
    wasteB.addEventListener("click", function () {
      if (!waste.length) return;
      sel = { where: "waste" };
      status.textContent = "Selected " + lab(waste[waste.length - 1]) + ".";
      paint();
    });
    for (var f = 0; f < 4; f++) {
      (function (fi) {
        var pile = document.createElement("button");
        pile.type = "button";
        pile.className = "pile";
        pile.addEventListener("click", function () {
          var moving = movingCards();
          if (moving.length !== 1) return;
          var card = moving[0];
          var pileCards = found[fi];
          var ok = !pileCards.length ? card.r === "A" : (pileCards[pileCards.length - 1].s === card.s && rn(card.r) === rn(pileCards[pileCards.length - 1].r) + 1);
          if (!ok) { status.textContent = "The top piles take one suit, ace first."; return; }
          if (sel.where === "waste") waste.pop();
          else {
            cols[sel.col] = cols[sel.col].slice(0, sel.idx);
            if (cols[sel.col].length) cols[sel.col][cols[sel.col].length - 1].up = true;
          }
          pileCards.push(card);
          sel = null;
          paint();
        });
        foundEls.push(pile);
        top.appendChild(pile);
      })(f);
    }
    top.insertBefore(wasteB, top.firstChild);
    top.insertBefore(stockB, top.firstChild);
    body.appendChild(status);
    body.appendChild(top);
    body.appendChild(board);
    paint();
    board.addEventListener("click", function (e) {
      var hold = e.target.closest && e.target.closest(".col");
      if (!hold || !sel) return;
      if (e.target.classList && e.target.classList.contains("is-on")) return;
      dropOn(Number(hold.dataset.col));
    });
  }
})();
