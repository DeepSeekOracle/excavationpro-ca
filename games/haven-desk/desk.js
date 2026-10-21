/* LYGO 98
   Add a later desktop file by inserting one object in FILES:
   { id, name, kind: "text" | "app" | "frame", icon, x, y, body or href }
   kind "app" also needs a branch in mountApp().
*/
(function () {
  "use strict";

  var STORE_KEY = "haven-desk-v1";
  var README = [
    "LYGO 98",
    "",
    "An original desk by Justin Helmer.",
    "Teal field. Gray windows. A Desk button.",
    "The pictures and the program names are new.",
    "",
    "Double-click a picture to open it.",
    "Drag a window by its blue bar.",
    "The Desk button lists every program.",
    "",
    "Lattice Corridor and Vale Tactics open in a window.",
    "They are the same games as on the games hub.",
    "",
    "Notes and guest leaves stay in this browser.",
    "Type help in Hearth Prompt.",
    "",
    "This copy of the desk was left on by Rook Pell,",
    "a night archivist who invented the notes.",
    "The scraps are fiction. Poke around."
  ].join("\n");

  var FILES = [
    { id: "readme", name: "Read Me.txt", kind: "text", icon: "page", x: 8, y: 8, body: README },
    { id: "note", name: "Hearth Note", kind: "app", icon: "note", x: 8, y: 86 },
    { id: "prompt", name: "Hearth Prompt", kind: "app", icon: "prompt", x: 8, y: 164 },
    { id: "paint", name: "Hearth Paint", kind: "app", icon: "paint", x: 8, y: 242 },
    { id: "player", name: "Hearth Player", kind: "app", icon: "player", x: 8, y: 320 },
    { id: "drawer", name: "The Drawer", kind: "app", icon: "drawer", x: 200, y: 320 },
    { id: "ash", name: "Ash Cells", kind: "app", icon: "ash", x: 104, y: 8 },
    { id: "pairs", name: "Ember Pairs", kind: "app", icon: "pairs", x: 104, y: 86, desk: false },
    { id: "leaf", name: "Guest Leaf", kind: "app", icon: "leaf", x: 296, y: 242 },
    { id: "corridor", name: "Lattice Corridor", kind: "frame", icon: "door", href: "/games/lattice-corridor/", x: 200, y: 164 },
    { id: "vale", name: "Vale Tactics", kind: "frame", icon: "moon", href: "/games/moonlit-tactics/", x: 200, y: 242 },
    { id: "games", name: "All Games", kind: "frame", icon: "grid", href: "/games/", x: 296, y: 320, desk: false },
    { id: "about", name: "About LYGO", kind: "app", icon: "about", x: 200, y: 398 }
  ];

  var PLAYLISTS = [
    "https://asiancoastline.com/data/public_stream_playlist.json",
    "https://deepseekoracle.github.io/Excavationpro/data/public_stream_playlist.json"
  ];

  var COLORS = ["#000000", "#800000", "#008000", "#808000", "#000080", "#800080", "#008080", "#c0c0c0", "#808080", "#ff0000", "#00ff00", "#ffff00", "#0000ff", "#ff00ff", "#00ffff", "#ffffff"];
  var NUMC = { 1: "#0000ff", 2: "#008000", 3: "#ff0000", 4: "#000080", 5: "#800000", 6: "#008080", 7: "#000000", 8: "#808080" };
  var PAIR_FACES = ["\u25B2", "\u25CF", "\u2606", "\u25C6", "\u263E", "\u266A", "\u25A0", "\u2726"];

  var store = loadStore();
  var zTop = 10;
  var selected = "";
  var promptLog = "LYGO 98\nType help and press Enter.\n";
  var promptHist = [];
  var histAt = -1;
  var tracks = [];
  var trackAt = 0;

  var audioCtx = null;
  var msgN = 0;
  var booted = false;
  var APP_MOUNT = {};
  var EXTRA_CMD = {};
  var renderHooks = [];
  var saverWord = "GLASS";
  var saverRAF = 0;
  var saverResize = null;
  var idleAt = Date.now();
  var bootClicked = false;

  var desktop = document.getElementById("desktop");
  var windows = document.getElementById("windows");
  var tasks = document.getElementById("tasks");
  var menu = document.getElementById("desk-menu");
  var deskBtn = document.getElementById("desk-btn");
  var clock = document.getElementById("clock");

  function loadStore() {
    var blank = { icons: {}, leaves: [], note: "", vol: 0.7, seen: false, bin: {}, sticks: {} };
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!raw || typeof raw !== "object") return blank;
      raw.icons = raw.icons && typeof raw.icons === "object" ? raw.icons : {};
      raw.leaves = Array.isArray(raw.leaves) ? raw.leaves.slice(0, 40) : [];
      raw.note = typeof raw.note === "string" ? raw.note : "";
      raw.vol = typeof raw.vol === "number" ? raw.vol : 0.7;
      raw.seen = !!raw.seen;
      raw.bin = raw.bin && typeof raw.bin === "object" ? raw.bin : {};
      raw.sticks = raw.sticks && typeof raw.sticks === "object" ? raw.sticks : {};
      return raw;
    } catch (e) {
      return blank;
    }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* private mode */ }
  }

  function fileById(id) {
    for (var i = 0; i < FILES.length; i++) if (FILES[i].id === id) return FILES[i];
    return null;
  }

  function findFile(q) {
    q = String(q || "").trim().toLowerCase();
    if (!q) return null;
    var exact = null;
    var partial = [];
    FILES.forEach(function (f) {
      var name = f.name.toLowerCase();
      if (q === f.id || q === name || q === name.replace(/\.txt$/, "")) exact = f;
      else if (name.indexOf(q) !== -1 || f.id.indexOf(q) !== -1) partial.push(f);
    });
    if (exact) return exact;
    if (partial.length === 1) return partial[0];
    return partial.length ? partial : null;
  }

  function iconSvg(name) {
    var common = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges"';
    var body = {
      page: '<rect x="6" y="3" width="16" height="22" fill="#fff" stroke="#000"/><rect x="6" y="3" width="16" height="4" fill="#000080"/><rect x="9" y="11" width="10" height="2" fill="#000"/><rect x="9" y="15" width="10" height="2" fill="#000"/><rect x="9" y="19" width="7" height="2" fill="#000"/>',
      note: '<rect x="6" y="4" width="18" height="22" fill="#fff8c8" stroke="#000"/><rect x="8" y="8" width="14" height="2" fill="#404040"/><rect x="8" y="12" width="14" height="2" fill="#404040"/><rect x="8" y="16" width="10" height="2" fill="#404040"/>',
      prompt: '<rect x="4" y="6" width="24" height="18" fill="#000" stroke="#c0c0c0"/><rect x="8" y="10" width="6" height="2" fill="#00ff66"/><rect x="8" y="14" width="12" height="2" fill="#00ff66"/><rect x="10" y="24" width="12" height="3" fill="#808080"/>',
      paint: '<rect x="4" y="8" width="18" height="14" fill="#fff" stroke="#000"/><rect x="6" y="12" width="6" height="4" fill="#0000ff"/><rect x="18" y="4" width="4" height="16" fill="#c45a12"/><rect x="16" y="3" width="8" height="4" fill="#808080"/>',
      player: '<rect x="4" y="8" width="24" height="16" fill="#202020" stroke="#c0c0c0"/><rect x="8" y="14" width="3" height="6" fill="#3cff7a"/><rect x="13" y="11" width="3" height="9" fill="#3cff7a"/><rect x="18" y="13" width="3" height="7" fill="#3cff7a"/><rect x="23" y="15" width="3" height="5" fill="#3cff7a"/>',
      drawer: '<rect x="5" y="4" width="22" height="8" fill="#d8d0c0" stroke="#000"/><rect x="5" y="13" width="22" height="8" fill="#c8b898" stroke="#000"/><rect x="5" y="22" width="22" height="6" fill="#b8a888" stroke="#000"/><rect x="13" y="15" width="6" height="2" fill="#000080"/>',
      ash: '<rect x="4" y="4" width="24" height="24" fill="#c0c0c0" stroke="#000"/><rect x="7" y="7" width="6" height="6" fill="#fff" stroke="#808080"/><rect x="14" y="7" width="6" height="6" fill="#000080"/><rect x="21" y="7" width="4" height="6" fill="#fff" stroke="#808080"/><rect x="7" y="14" width="6" height="6" fill="#fff" stroke="#808080"/><rect x="14" y="14" width="6" height="6" fill="#5a1a12"/><rect x="21" y="14" width="4" height="6" fill="#fff" stroke="#808080"/>',
      pairs: '<rect x="4" y="6" width="11" height="16" fill="#000080" stroke="#fff"/><rect x="17" y="10" width="11" height="16" fill="#fff" stroke="#000"/><rect x="20" y="16" width="5" height="5" fill="#c45a12"/>',
      leaf: '<rect x="6" y="5" width="18" height="22" fill="#f4f0e0" stroke="#000"/><rect x="14" y="8" width="2" height="14" fill="#208040"/><rect x="8" y="12" width="8" height="4" fill="#30a050"/><rect x="16" y="16" width="6" height="4" fill="#30a050"/>',
      door: '<rect x="8" y="3" width="16" height="24" fill="#303038" stroke="#c0c0c0"/><rect x="11" y="8" width="10" height="14" fill="#1a140c"/><rect x="18" y="14" width="2" height="2" fill="#e0b050"/>',
      moon: '<rect x="5" y="5" width="22" height="22" fill="#0c1830" stroke="#c0c0c0"/><rect x="12" y="8" width="8" height="8" fill="#f0e6c0"/><rect x="16" y="8" width="6" height="8" fill="#0c1830"/><rect x="8" y="20" width="16" height="3" fill="#208060"/>',
      grid: '<rect x="4" y="4" width="10" height="10" fill="#000080" stroke="#fff"/><rect x="18" y="4" width="10" height="10" fill="#008080" stroke="#fff"/><rect x="4" y="18" width="10" height="10" fill="#808000" stroke="#fff"/><rect x="18" y="18" width="10" height="10" fill="#800000" stroke="#fff"/>',
      about: '<rect x="6" y="4" width="20" height="24" fill="#fff" stroke="#000"/><rect x="14" y="8" width="4" height="8" fill="#000080"/><rect x="14" y="18" width="4" height="4" fill="#000080"/>',
      calc: '<rect x="6" y="3" width="20" height="26" fill="#d0d0d0" stroke="#000"/><rect x="9" y="6" width="14" height="5" fill="#b7d7b0"/><rect x="9" y="14" width="4" height="3" fill="#404040"/><rect x="15" y="14" width="4" height="3" fill="#404040"/><rect x="21" y="14" width="4" height="3" fill="#000080"/><rect x="9" y="19" width="4" height="3" fill="#404040"/><rect x="15" y="19" width="4" height="3" fill="#404040"/><rect x="21" y="19" width="4" height="3" fill="#800000"/>',
      mail: '<rect x="4" y="8" width="24" height="16" fill="#f4f0e0" stroke="#000"/><path d="M4 8 L16 18 L28 8" fill="none" stroke="#000080" stroke-width="2"/>',
      chat: '<rect x="4" y="6" width="18" height="14" fill="#fff" stroke="#000"/><rect x="10" y="14" width="16" height="12" fill="#e7f0ff" stroke="#000080"/>',
      cards: '<rect x="6" y="4" width="14" height="20" fill="#fff" stroke="#000"/><rect x="12" y="8" width="14" height="20" fill="#000080" stroke="#fff"/><rect x="16" y="14" width="6" height="8" fill="#c45a12"/>',
      bin: '<rect x="8" y="8" width="16" height="16" fill="#c0c0c0" stroke="#000"/><rect x="6" y="6" width="20" height="3" fill="#808080"/><rect x="12" y="12" width="8" height="2" fill="#000"/><rect x="12" y="16" width="8" height="2" fill="#000"/>',
      photo: '<rect x="5" y="5" width="22" height="18" fill="#203040" stroke="#fff"/><rect x="8" y="14" width="16" height="6" fill="#208060"/><rect x="16" y="8" width="5" height="5" fill="#f0e6a0"/><rect x="7" y="24" width="18" height="3" fill="#c0c0c0"/>',
      dial: '<rect x="5" y="8" width="22" height="14" fill="#202020" stroke="#c0c0c0"/><rect x="8" y="12" width="10" height="2" fill="#3cff7a"/><rect x="12" y="22" width="8" height="4" fill="#808080"/>',
      tidy: '<rect x="4" y="6" width="24" height="18" fill="#000" stroke="#808080"/><rect x="6" y="8" width="4" height="4" fill="#000080"/><rect x="11" y="8" width="4" height="4" fill="#008080"/><rect x="16" y="8" width="4" height="4" fill="#808000"/><rect x="21" y="8" width="4" height="4" fill="#800000"/><rect x="6" y="14" width="8" height="4" fill="#000080"/><rect x="15" y="14" width="10" height="4" fill="#008080"/>',
      find: '<rect x="6" y="6" width="14" height="14" fill="none" stroke="#000" stroke-width="2"/><rect x="17" y="17" width="8" height="3" fill="#000"/>',
      browse: '<rect x="4" y="5" width="24" height="20" fill="#fff" stroke="#000"/><rect x="4" y="5" width="24" height="5" fill="#000080"/><rect x="7" y="13" width="18" height="2" fill="#404040"/><rect x="7" y="17" width="12" height="2" fill="#000080"/>',
      wire: '<rect x="4" y="6" width="24" height="18" fill="#fff" stroke="#000"/><rect x="4" y="6" width="24" height="5" fill="#000080"/><rect x="7" y="14" width="8" height="2" fill="#008080"/><rect x="7" y="18" width="16" height="2" fill="#404040"/>',
      swap: '<rect x="5" y="7" width="9" height="16" fill="#000080" stroke="#fff"/><rect x="18" y="7" width="9" height="16" fill="#000080" stroke="#fff"/><rect x="7" y="12" width="5" height="6" fill="#3cff7a"/><rect x="20" y="12" width="5" height="6" fill="#3cff7a"/>',
      lime: '<rect x="6" y="4" width="20" height="24" fill="#d8ffc8" stroke="#000"/><rect x="9" y="8" width="14" height="2" fill="#208040"/><rect x="9" y="12" width="14" height="2" fill="#208040"/><rect x="9" y="16" width="10" height="2" fill="#208040"/><rect x="9" y="22" width="8" height="3" fill="#208040"/>',
      old: '<rect x="5" y="5" width="22" height="22" fill="#f4f0e0" stroke="#000"/><rect x="8" y="8" width="16" height="2" fill="#000080"/><rect x="8" y="12" width="16" height="2" fill="#404040"/><rect x="8" y="16" width="12" height="2" fill="#404040"/><rect x="8" y="20" width="8" height="2" fill="#008080"/>',
      bbs: '<rect x="4" y="6" width="24" height="16" fill="#06120c" stroke="#3cff7a"/><rect x="7" y="10" width="10" height="2" fill="#3cff7a"/><rect x="7" y="14" width="14" height="2" fill="#3cff7a"/><rect x="10" y="22" width="12" height="3" fill="#808080"/>',
      ftp: '<rect x="6" y="4" width="14" height="10" fill="#d8d0c0" stroke="#000"/><rect x="12" y="14" width="14" height="10" fill="#c8b898" stroke="#000"/><rect x="8" y="8" width="6" height="2" fill="#000080"/>',
      news: '<rect x="5" y="4" width="22" height="24" fill="#fff" stroke="#000"/><rect x="8" y="7" width="16" height="3" fill="#000080"/><rect x="8" y="13" width="16" height="2" fill="#404040"/><rect x="8" y="17" width="12" height="2" fill="#404040"/>',
      irc: '<rect x="4" y="6" width="24" height="16" fill="#000" stroke="#c0c0c0"/><rect x="7" y="10" width="8" height="2" fill="#3cff7a"/><rect x="7" y="14" width="14" height="2" fill="#7ee0d0"/>',
      discs: '<rect x="8" y="6" width="16" height="16" fill="#c0c0c0" stroke="#000"/><rect x="14" y="12" width="4" height="4" fill="#000"/><rect x="10" y="23" width="12" height="3" fill="#808080"/>',
      key: '<rect x="6" y="12" width="12" height="8" fill="#e0b050" stroke="#000"/><rect x="16" y="14" width="10" height="3" fill="#e0b050"/><rect x="22" y="14" width="2" height="6" fill="#e0b050"/>',
      floppy: '<rect x="7" y="3" width="18" height="24" fill="#204080" stroke="#000"/><rect x="10" y="5" width="12" height="8" fill="#f4f0e0"/><rect x="12" y="18" width="8" height="6" fill="#c0c0c0"/>'
    };
    return "<svg " + common + ">" + (body[name] || body.page) + "</svg>";
  }

  function posOf(file) {
    var saved = store.icons[file.id];
    var x = saved && typeof saved.x === "number" ? saved.x : file.x;
    var y = saved && typeof saved.y === "number" ? saved.y : file.y;
    return { x: x, y: y };
  }

  function inBin(file) {
    if (store.bin && Object.prototype.hasOwnProperty.call(store.bin, file.id)) return !!store.bin[file.id];
    return !!file.startsInBin;
  }

  function renderIcons() {
    desktop.innerHTML = "";
    FILES.forEach(function (file) {
      if (inBin(file) || file.desk === false) return;
      var p = posOf(file);
      var el = document.createElement("button");
      el.type = "button";
      el.className = "icon" + (selected === file.id ? " is-pick" : "");
      el.style.left = p.x + "px";
      el.style.top = p.y + "px";
      el.dataset.id = file.id;
      el.innerHTML = iconSvg(file.icon) + "<span>" + escapeHtml(file.name) + "</span>";
      el.setAttribute("aria-label", file.name);
      el.addEventListener("pointerdown", function (ev) { onIconDown(ev, file, el); });
      el.addEventListener("contextmenu", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        selectIcon(file.id);
        showCtx(ev.clientX, ev.clientY, [
          ["Open", function () { openFile(file.id); }],
          ["Send to the Bin", function () { sendToBin(file.id); }],
          ["Properties", function () { showProps(file); }]
        ]);
      });
      desktop.appendChild(el);
    });
    renderHooks.forEach(function (fn) { fn(); });
  }

  function sendToBin(id) {
    store.bin[id] = true;
    save();
    closeWin(id);
    renderIcons();
  }

  function restoreFile(id) {
    store.bin[id] = false;
    save();
    renderIcons();
  }

  function showProps(file) {
    openWindow("prop-" + file.id, "Properties", 300, 180, function (body) {
      var pre = document.createElement("pre");
      pre.className = "sheet sunken";
      pre.textContent = [
        file.name,
        "Kind: " + (file.kind || "file"),
        inBin(file) ? "Place: The Bin" : "Place: the desk",
        "",
        "LYGO 98 keeps this on this computer only."
      ].join("\n");
      body.appendChild(pre);
    });
  }

  function fillPhoto(file, body) {
    var img = document.createElement("img");
    img.src = file.src;
    img.alt = file.name;
    img.className = "shot";
    var cap = document.createElement("p");
    cap.className = "about-copy";
    cap.textContent = file.body || "";
    body.appendChild(img);
    body.appendChild(cap);
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function selectIcon(id) {
    selected = id;
    Array.prototype.forEach.call(desktop.querySelectorAll(".icon"), function (el) {
      el.classList.toggle("is-pick", el.dataset.id === id);
    });
  }

  var armClick = "";
  var armAt = 0;

  function onIconDown(ev, file, el) {
    if (ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    closeMenu();
    selectIcon(file.id);
    var startX = ev.clientX;
    var startY = ev.clientY;
    var orig = posOf(file);
    var moved = false;
    function move(e) {
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      if (!moved) return;
      var x = Math.max(0, orig.x + dx);
      var y = Math.max(0, orig.y + dy);
      el.style.left = x + "px";
      el.style.top = y + "px";
      store.icons[file.id] = { x: x, y: y };
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (moved) { save(); return; }
      var now = Date.now();
      if (armClick === file.id && now - armAt < 450) {
        armClick = "";
        openFile(file.id);
      } else {
        armClick = file.id;
        armAt = now;
      }
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function openFile(id) {
    var file = fileById(id);
    if (!file) return "No such file.";
    if (inBin(file)) {
      deskAlert("The Bin", file.name + " is in the Bin. Open The Bin to put it back.");
      return "That file is in the Bin.";
    }
    if (file.sealed) {
      deskAlert("LYGO 98", "That file is still shut. The papers on the desk know the next command.");
      return "That file is sealed.";
    }
    var wide = file.wide || (file.kind === "frame" ? 760 : 460);
    var high = file.high || (file.kind === "frame" ? 520 : 360);
    if (file.id === "ash" || file.id === "pairs") { wide = 320; high = 340; }
    if (file.id === "about" || file.id === "readme") { wide = 420; high = 340; }
    if (file.kind === "photo") { wide = 460; high = 480; }
    if (file.id === "mail" || file.id === "browse" || file.id === "cards") { wide = 560; high = 420; }
    openWindow(file.id, file.name, wide, high, function (body) {
      if (file.kind === "text") fillText(file, body);
      else if (file.kind === "note") fillNote(file, body);
      else if (file.kind === "photo") fillPhoto(file, body);
      else if (file.kind === "frame") fillFrame(file, body);
      else mountApp(file, body);
    });
    return "Opened " + file.name + ".";
  }

  function fillText(file, body) {
    var pre = document.createElement("pre");
    pre.className = "sheet sunken";
    pre.textContent = file.body || "";
    body.appendChild(pre);
  }

  function fillNote(file, body) {
    var box = document.createElement("div");
    box.className = "about-copy sunken";
    String(file.body || "").split("\n").forEach(function (line) {
      var p = document.createElement("p");
      var rest = line;
      var match = rest.match(/https?:\/\/[^\s]+/);
      if (!match) {
        p.textContent = line === "" ? " " : line;
      } else {
        var at = match.index;
        if (at > 0) p.appendChild(document.createTextNode(rest.slice(0, at)));
        var a = document.createElement("a");
        a.href = match[0];
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = match[0];
        p.appendChild(a);
        var after = rest.slice(at + match[0].length);
        if (after) p.appendChild(document.createTextNode(after));
      }
      box.appendChild(p);
    });
    body.appendChild(box);
  }

  function fillFrame(file, body) {
    body.classList.add("frame-body");
    var frame = document.createElement("iframe");
    frame.src = file.href;
    frame.title = file.name;
    body.appendChild(frame);
  }

  function openWindow(id, title, w, h, fill) {
    var have = document.getElementById("win-" + id);
    if (have) {
      have.classList.remove("is-min");
      focusWin(id);
      return;
    }
    var win = document.createElement("section");
    win.className = "win";
    win.id = "win-" + id;
    win.dataset.win = id;
    var n = windows.children.length;
    win.style.left = (28 + (n % 8) * 22) + "px";
    win.style.top = (24 + (n % 8) * 20) + "px";
    win.style.width = w + "px";
    win.style.height = h + "px";
    var bar = document.createElement("div");
    bar.className = "titlebar";
    var label = document.createElement("b");
    label.textContent = title;
    var minB = tinyBtn("_", "Shrink");
    var maxB = tinyBtn("\u25A1", "Fill");
    var closeB = tinyBtn("\u00D7", "Close");
    bar.appendChild(label);
    bar.appendChild(minB);
    bar.appendChild(maxB);
    bar.appendChild(closeB);
    var body = document.createElement("div");
    body.className = "body";
    var grip = document.createElement("div");
    grip.className = "grip";
    grip.setAttribute("aria-hidden", "true");
    win.appendChild(bar);
    win.appendChild(body);
    win.appendChild(grip);
    windows.appendChild(win);
    fill(body, win);
    wireWindow(win, bar, minB, maxB, closeB, grip);
    addTask(id, title);
    focusWin(id);
  }

  function tinyBtn(text, label) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tbtn raised";
    b.textContent = text;
    b.setAttribute("aria-label", label);
    return b;
  }

  function wireWindow(win, bar, minB, maxB, closeB, grip) {
    var id = win.dataset.win;
    win.addEventListener("pointerdown", function () { focusWin(id); });
    minB.addEventListener("click", function (e) {
      e.stopPropagation();
      win.classList.add("is-min");
      markTasks();
    });
    maxB.addEventListener("click", function (e) {
      e.stopPropagation();
      if (win.dataset.max === "1") {
        win.style.left = win.dataset.px;
        win.style.top = win.dataset.py;
        win.style.width = win.dataset.pw;
        win.style.height = win.dataset.ph;
        win.dataset.max = "0";
      } else {
        win.dataset.px = win.style.left;
        win.dataset.py = win.style.top;
        win.dataset.pw = win.style.width;
        win.dataset.ph = win.style.height;
        win.style.left = "0px";
        win.style.top = "0px";
        win.style.width = "100%";
        win.style.height = "100%";
        win.dataset.max = "1";
      }
      focusWin(id);
    });
    closeB.addEventListener("click", function (e) {
      e.stopPropagation();
      closeWin(id);
    });
    dragHandle(bar, win, function (ev) { return ev.target.closest("button"); });
    grip.addEventListener("pointerdown", function (ev) {
      if (ev.button !== 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      var sx = ev.clientX;
      var sy = ev.clientY;
      var sw = win.offsetWidth;
      var sh = win.offsetHeight;
      function move(e) {
        win.style.width = Math.max(220, sw + e.clientX - sx) + "px";
        win.style.height = Math.max(140, sh + e.clientY - sy) + "px";
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  function dragHandle(handle, win, skip) {
    handle.addEventListener("pointerdown", function (ev) {
      if (ev.button !== 0 || (skip && skip(ev))) return;
      ev.preventDefault();
      var sx = ev.clientX;
      var sy = ev.clientY;
      var sl = win.offsetLeft;
      var st = win.offsetTop;
      function move(e) {
        win.style.left = (sl + e.clientX - sx) + "px";
        win.style.top = (st + e.clientY - sy) + "px";
        win.dataset.max = "0";
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  function focusWin(id) {
    var win = document.getElementById("win-" + id);
    if (!win) return;
    Array.prototype.forEach.call(windows.children, function (el) { el.classList.remove("is-on"); });
    win.classList.add("is-on");
    zTop += 1;
    win.style.zIndex = String(zTop);
    markTasks();
  }

  function closeWin(id) {
    var win = document.getElementById("win-" + id);
    if (win) win.remove();
    var task = document.getElementById("task-" + id);
    if (task) task.remove();
    if (id === "player") stopTone();
  }

  function addTask(id, title) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "task raised";
    b.id = "task-" + id;
    b.textContent = title;
    b.addEventListener("click", function () {
      var win = document.getElementById("win-" + id);
      if (!win) return;
      if (win.classList.contains("is-on") && !win.classList.contains("is-min")) {
        win.classList.add("is-min");
        markTasks();
        return;
      }
      win.classList.remove("is-min");
      focusWin(id);
    });
    tasks.appendChild(b);
  }

  function markTasks() {
    Array.prototype.forEach.call(tasks.children, function (b) {
      var id = b.id.replace(/^task-/, "");
      var win = document.getElementById("win-" + id);
      var on = win && win.classList.contains("is-on") && !win.classList.contains("is-min");
      b.classList.toggle("is-on", !!on);
    });
  }

  function mountApp(file, body) {
    if (file.id === "note") return mountNote(body);
    if (file.id === "prompt") return mountPrompt(body);
    if (file.id === "paint") return mountPaint(body);
    if (file.id === "player") return mountPlayer(body);
    if (file.id === "drawer") return mountDrawer(body);
    if (file.id === "ash") return mountAsh(body);
    if (file.id === "pairs") return mountPairs(body);
    if (file.id === "leaf") return mountLeaf(body);
    if (file.id === "about") return mountAbout(body);
    if (APP_MOUNT[file.id]) return APP_MOUNT[file.id](body, file);
    body.textContent = "This program is not on the desk yet.";
  }

  function mountNote(body) {
    var ta = document.createElement("textarea");
    ta.className = "note-box sunken";
    ta.value = store.note;
    ta.setAttribute("aria-label", "Hearth Note");
    ta.addEventListener("input", function () {
      store.note = ta.value;
      save();
    });
    body.appendChild(ta);
  }

  function mountPrompt(body) {
    var out = document.createElement("pre");
    out.className = "prompt-out sunken";
    out.id = "prompt-out";
    out.textContent = promptLog;
    var row = document.createElement("form");
    row.className = "prompt-row";
    var tag = document.createElement("span");
    tag.textContent = "HAVEN:\\>";
    var input = document.createElement("input");
    input.setAttribute("aria-label", "Prompt");
    input.autocomplete = "off";
    input.spellcheck = false;
    row.appendChild(tag);
    row.appendChild(input);
    row.addEventListener("submit", function (e) {
      e.preventDefault();
      var line = input.value;
      input.value = "";
      if (line.trim()) {
        promptHist.push(line);
        histAt = promptHist.length;
      }
      execLine(line);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp" && promptHist.length) {
        e.preventDefault();
        histAt = Math.max(0, histAt - 1);
        input.value = promptHist[histAt] || "";
      } else if (e.key === "ArrowDown" && promptHist.length) {
        e.preventDefault();
        histAt = Math.min(promptHist.length, histAt + 1);
        input.value = promptHist[histAt] || "";
      }
    });
    body.appendChild(out);
    body.appendChild(row);
    setTimeout(function () { input.focus(); }, 30);
  }

  function execLine(line) {
    var text = runCommand(line);
    if (String(line || "").trim().toLowerCase() === "cls") {
      promptLog = "";
      var cleared = document.getElementById("prompt-out");
      if (cleared) cleared.textContent = "";
      return "";
    }
    promptLog += "HAVEN:\\> " + line + "\n" + (text ? text + "\n" : "");
    var view = document.getElementById("prompt-out");
    if (view) {
      view.textContent = promptLog;
      view.scrollTop = view.scrollHeight;
    }
    return text;
  }

  function runCommand(line) {
    var raw = String(line || "").trim();
    if (!raw) return "";
    var bits = raw.split(/\s+/);
    var cmd = bits[0].toLowerCase();
    var rest = raw.slice(bits[0].length).trim();
    if (cmd === "help") {
      return [
        "help     this list",
        "dir      files on the desk",
        "ver      desk version",
        "date     today's date",
        "time     the clock",
        "cls      clear the prompt",
        "echo     repeat the rest of the line",
        "open     open a file or program",
        "type     print a text file",
        "games    list the games",
        "desk     where you are",
        "beep     a short tone",
        "lore     how far the second trail has gone",
        "shutdown leave the desk"
      ].join("\n");
    }
    if (cmd === "dir") {
      var shown = FILES.filter(function (f) { return !inBin(f) && !f.sealed && !f.folder; });
      return shown.map(function (f) { return f.name; }).join("\n") + "\n" + shown.length + " file(s)";
    }
    if (cmd === "ver") return "LYGO 98\nHearth build 3";
    if (cmd === "date") return new Date().toDateString();
    if (cmd === "time") return new Date().toLocaleTimeString();
    if (cmd === "cls") return "";
    if (cmd === "echo") return rest;
    if (cmd === "desk") return "You are at LYGO 98.";
    if (cmd === "beep") { beep(); return "Beep."; }
    if (cmd === "shutdown") { askLeave(); return "The desk is asking."; }
    if (cmd === "games") {
      return FILES.filter(function (f) {
        return f.id === "ash" || f.id === "pairs" || f.id === "corridor" || f.id === "vale" || f.id === "games";
      }).map(function (f) { return f.id + "    " + f.name; }).join("\n");
    }
    if (cmd === "open") {
      if (!rest) return "open readme, note, prompt, ash, corridor, vale, ...";
      var found = findFile(rest);
      if (Array.isArray(found)) return "More than one match:\n" + found.map(function (f) { return f.id; }).join("\n");
      if (!found) return "No file named " + rest + ".";
      return openFile(found.id);
    }
    if (cmd === "type") {
      var file = findFile(rest);
      if (Array.isArray(file)) return "More than one match.";
      if (!file) return "No file named " + rest + ".";
      if (inBin(file)) return file.name + " is in the Bin.";
      if (file.sealed) return "That file is sealed. The papers on the desk know the next command.";
      if (file.kind !== "text" && file.kind !== "photo" && file.kind !== "note") return file.name + " is a program. Use open.";
      return file.body || "";
    }
    if (EXTRA_CMD[cmd]) return EXTRA_CMD[cmd](rest);
    deskAlert("Hearth Prompt", "The prompt does not know \"" + cmd + "\". Type help.");
    return "Unknown command.";
  }

  function beep() {
    try {
      var ctx = getCtx();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 880;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.08);
    } catch (e) { /* no audio */ }
  }

  function getCtx() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function deskAlert(title, text) {
    msgN += 1;
    var id = "msg-" + msgN;
    openWindow(id, title, 300, 150, function (body) {
      var p = document.createElement("p");
      p.className = "about-copy";
      p.textContent = text;
      var ok = document.createElement("button");
      ok.type = "button";
      ok.className = "raised";
      ok.textContent = "OK";
      ok.addEventListener("click", function () { closeWin(id); });
      body.appendChild(p);
      body.appendChild(ok);
    });
  }

  function mountDrawer(body) {
    var list = document.createElement("div");
    list.className = "track-list sunken";
    FILES.forEach(function (f) {
      if (f.sealed || f.folder) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "track";
      b.textContent = f.name;
      b.addEventListener("dblclick", function () { openFile(f.id); });
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
      var name = on.textContent;
      var file = FILES.filter(function (f) { return f.name === name; })[0];
      if (file) openFile(file.id);
    });
    row.appendChild(openB);
    body.appendChild(row);
    body.appendChild(list);
  }

  function mountPaint(body) {
    var color = "#000000";
    var wrap = document.createElement("div");
    wrap.className = "paint-wrap";
    var row = document.createElement("div");
    row.className = "row";
    var sw = document.createElement("div");
    sw.className = "swatches";
    var canvas = document.createElement("canvas");
    canvas.className = "paint-canvas sunken";
    canvas.width = 400;
    canvas.height = 240;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineCap = "square";
    COLORS.forEach(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "swatch" + (i === 0 ? " is-on" : "");
      b.style.background = c;
      b.setAttribute("aria-label", "Ink " + c);
      b.addEventListener("click", function () {
        color = c;
        Array.prototype.forEach.call(sw.children, function (el) { el.classList.remove("is-on"); });
        b.classList.add("is-on");
      });
      sw.appendChild(b);
    });
    var clear = document.createElement("button");
    clear.type = "button";
    clear.className = "raised";
    clear.textContent = "Clear";
    clear.addEventListener("click", function () {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    var drawing = false;
    function xy(ev) {
      var r = canvas.getBoundingClientRect();
      var scaleX = canvas.width / r.width;
      var scaleY = canvas.height / r.height;
      return { x: (ev.clientX - r.left) * scaleX, y: (ev.clientY - r.top) * scaleY };
    }
    canvas.addEventListener("pointerdown", function (ev) {
      drawing = true;
      canvas.setPointerCapture(ev.pointerId);
      var p = xy(ev);
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    });
    canvas.addEventListener("pointermove", function (ev) {
      if (!drawing) return;
      var p = xy(ev);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });
    function stop() { drawing = false; }
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);
    row.appendChild(sw);
    row.appendChild(clear);
    wrap.appendChild(row);
    wrap.appendChild(canvas);
    body.appendChild(wrap);
  }

  function mountPlayer(body) {
    var title = document.createElement("div");
    title.className = "sunken ash-status";
    title.textContent = "Looking for the Excavationpro stream\u2026";
    var row = document.createElement("div");
    row.className = "row";
    var play = document.createElement("button");
    play.type = "button";
    play.className = "raised";
    play.textContent = "Play";
    var stop = document.createElement("button");
    stop.type = "button";
    stop.className = "raised";
    stop.textContent = "Stop";
    var next = document.createElement("button");
    next.type = "button";
    next.className = "raised";
    next.textContent = "Next";
    var vol = document.createElement("input");
    vol.type = "range";
    vol.min = "0";
    vol.max = "100";
    vol.value = String(Math.round((store.vol || 0.7) * 100));
    vol.setAttribute("aria-label", "Volume");
    var audio = document.createElement("audio");
    audio.preload = "none";
    var list = document.createElement("div");
    list.className = "track-list sunken";
    function paintList() {
      list.innerHTML = "";
      tracks.forEach(function (t, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "track" + (i === trackAt ? " is-on" : "");
        b.textContent = t.title;
        b.addEventListener("click", function () {
          trackAt = i;
          startAudio();
        });
        list.appendChild(b);
      });
    }
    function setTitle(text) { title.textContent = text; }
    function startAudio() {
      stopTone();
      if (!tracks.length) {
        setTitle("No stream reached this desk.");
        return;
      }
      var t = tracks[trackAt % tracks.length];
      audio.src = t.url;
      audio.volume = store.vol;
      setTitle(t.title);
      paintList();
      var played = audio.play();
      if (played && played.catch) {
        played.catch(function () {
          if (!audio.paused) return;
          setTitle("The stream did not start.");
        });
      }
    }
    play.addEventListener("click", function () {
      if (!tracks.length) {
        setTitle("No stream reached this desk.");
        return;
      }
      startAudio();
    });
    stop.addEventListener("click", function () {
      audio.pause();
      stopTone();
      setTitle("Stopped");
    });
    next.addEventListener("click", function () {
      if (!tracks.length) {
        setTitle("No stream reached this desk.");
        return;
      }
      trackAt = (trackAt + 1) % tracks.length;
      startAudio();
    });
    audio.addEventListener("ended", function () {
      if (!tracks.length) return;
      trackAt = (trackAt + 1) % tracks.length;
      startAudio();
    });
    audio.addEventListener("error", function () {
      if (audio.error && audio.error.code === 1) return;
      if (!audio.paused) return;
      setTitle("That track did not load.");
    });
    vol.addEventListener("input", function () {
      store.vol = Number(vol.value) / 100;
      audio.volume = store.vol;
      save();
    });
    row.appendChild(play);
    row.appendChild(stop);
    row.appendChild(next);
    row.appendChild(vol);
    body.appendChild(title);
    body.appendChild(row);
    body.appendChild(audio);
    body.appendChild(list);
    loadTracks(function () {
      if (tracks.length) {
        setTitle(tracks.length + " tracks from Excavationpro. Press Play.");
        paintList();
      } else {
        setTitle("No stream reached this desk.");
      }
    });
  }

  function stopTone() {}

  function loadTracks(done) {
    var i = 0;
    function next() {
      if (i >= PLAYLISTS.length) { done(); return; }
      var url = PLAYLISTS[i++];
      fetch(url).then(function (res) {
        if (!res.ok) throw new Error("no");
        return res.json();
      }).then(function (data) {
        var raw = Array.isArray(data) ? data : (data.tracks || []);
        var out = [];
        raw.forEach(function (t) {
          var link = t.stream_url || t.url;
          if (!link) return;
          var name = t.title || t.name || "Excavationpro";
          if (/sfx|bass drop/i.test(name)) return;
          out.push({ title: name, url: link });
        });
        if (!out.length) { next(); return; }
        tracks = out;
        done();
      }).catch(function () { next(); });
    }
    next();
  }

  function mountAsh(body) {
    var W = 9;
    var H = 9;
    var N = 10;
    var placed = false;
    var pockets = {};
    var open = {};
    var marked = {};
    var dead = false;
    var won = false;
    var markMode = false;
    var grid = document.createElement("div");
    grid.className = "ash-grid";
    var status = document.createElement("div");
    status.className = "ash-status sunken";
    var row = document.createElement("div");
    row.className = "row";
    var markBtn = document.createElement("button");
    markBtn.type = "button";
    markBtn.className = "raised";
    markBtn.textContent = "Leaf mark";
    var again = document.createElement("button");
    again.type = "button";
    again.className = "raised";
    again.textContent = "New field";
    function key(x, y) { return x + "," + y; }
    function neighbors(x, y) {
      var out = [];
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          var nx = x + dx;
          var ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < W && ny < H) out.push([nx, ny]);
        }
      }
      return out;
    }
    function count(x, y) {
      var n = 0;
      neighbors(x, y).forEach(function (p) { if (pockets[key(p[0], p[1])]) n += 1; });
      return n;
    }
    function place(sx, sy) {
      var ban = {};
      ban[key(sx, sy)] = true;
      neighbors(sx, sy).forEach(function (p) { ban[key(p[0], p[1])] = true; });
      var spots = [];
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) if (!ban[key(x, y)]) spots.push([x, y]);
      }
      for (var i = spots.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = spots[i];
        spots[i] = spots[j];
        spots[j] = tmp;
      }
      pockets = {};
      spots.slice(0, N).forEach(function (p) { pockets[key(p[0], p[1])] = true; });
      placed = true;
    }
    function reveal(x, y) {
      var k = key(x, y);
      if (open[k] || marked[k] || pockets[k]) return;
      open[k] = true;
      if (count(x, y) === 0) neighbors(x, y).forEach(function (p) { reveal(p[0], p[1]); });
    }
    function openedCount() {
      var n = 0;
      Object.keys(open).forEach(function () { n += 1; });
      return n;
    }
    function statusText() {
      if (won) return "The field is clear.";
      if (dead) return "A pocket opened.";
      var marks = Object.keys(marked).length;
      return "Pockets " + N + "    marks " + marks;
    }
    function paint() {
      grid.innerHTML = "";
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          (function (x, y) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "cell raised";
            var k = key(x, y);
            var show = open[k] || dead || won;
            if (show && pockets[k]) b.className = "cell pocket";
            else if (open[k]) {
              b.className = "cell open";
              var n = count(x, y);
              if (n) {
                b.textContent = String(n);
                b.style.color = NUMC[n] || "#000";
              }
            } else if (marked[k]) b.textContent = "\u25B2";
            b.addEventListener("click", function () { hit(x, y, false); });
            b.addEventListener("contextmenu", function (ev) {
              ev.preventDefault();
              hit(x, y, true);
            });
            grid.appendChild(b);
          })(x, y);
        }
      }
      status.textContent = statusText();
      markBtn.textContent = markMode ? "Leaf mark on" : "Leaf mark";
    }
    function hit(x, y, alt) {
      if (dead || won) return;
      var k = key(x, y);
      if (alt || markMode) {
        if (open[k]) return;
        if (marked[k]) delete marked[k];
        else marked[k] = true;
        paint();
        return;
      }
      if (marked[k] || open[k]) return;
      if (!placed) place(x, y);
      if (pockets[k]) {
        dead = true;
        paint();
        return;
      }
      reveal(x, y);
      if (openedCount() >= W * H - N) won = true;
      paint();
    }
    markBtn.addEventListener("click", function () {
      markMode = !markMode;
      paint();
    });
    again.addEventListener("click", function () {
      placed = false;
      pockets = {};
      open = {};
      marked = {};
      dead = false;
      won = false;
      paint();
    });
    row.appendChild(markBtn);
    row.appendChild(again);
    body.appendChild(row);
    body.appendChild(grid);
    body.appendChild(status);
    paint();
  }

  function mountPairs(body) {
    var deck = [];
    PAIR_FACES.forEach(function (face) { deck.push(face, face); });
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    var up = [];
    var matched = {};
    var lock = false;
    var moves = 0;
    var grid = document.createElement("div");
    grid.className = "pairs";
    var status = document.createElement("div");
    status.className = "pairs-status sunken";
    function paintStatus() {
      var left = 8 - Object.keys(matched).length / 2;
      status.textContent = left ? ("Moves " + moves + "    pairs left " + left) : ("All pairs found in " + moves + " moves.");
    }
    deck.forEach(function (face, idx) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "card raised";
      b.textContent = "";
      b.addEventListener("click", function () {
        if (lock || matched[idx] || up.indexOf(idx) !== -1) return;
        b.textContent = face;
        b.classList.add("up");
        up.push(idx);
        if (up.length < 2) return;
        moves += 1;
        var a = up[0];
        var c = up[1];
        if (deck[a] === deck[c]) {
          matched[a] = true;
          matched[c] = true;
          grid.children[a].classList.add("matched");
          grid.children[c].classList.add("matched");
          up = [];
          paintStatus();
          return;
        }
        lock = true;
        setTimeout(function () {
          up.forEach(function (n) {
            if (matched[n]) return;
            grid.children[n].textContent = "";
            grid.children[n].classList.remove("up");
          });
          up = [];
          lock = false;
          paintStatus();
        }, 650);
      });
      grid.appendChild(b);
    });
    var again = document.createElement("button");
    again.type = "button";
    again.className = "raised";
    again.textContent = "Shuffle";
    again.addEventListener("click", function () {
      body.innerHTML = "";
      mountPairs(body);
    });
    body.appendChild(again);
    body.appendChild(grid);
    body.appendChild(status);
    paintStatus();
  }

  function mountLeaf(body) {
    var honest = document.createElement("p");
    honest.className = "honest";
    honest.textContent = "Leaves stay in this browser. Nothing is posted.";
    var name = document.createElement("input");
    name.maxLength = 40;
    name.placeholder = "Name";
    name.setAttribute("aria-label", "Name");
    var text = document.createElement("textarea");
    text.maxLength = 280;
    text.rows = 3;
    text.placeholder = "A note for the desk";
    text.setAttribute("aria-label", "Note");
    var row = document.createElement("div");
    row.className = "row";
    var leave = document.createElement("button");
    leave.type = "button";
    leave.className = "raised";
    leave.textContent = "Leave a leaf";
    var list = document.createElement("ul");
    list.className = "leaf-list sunken";
    function paint() {
      list.innerHTML = "";
      if (!store.leaves.length) {
        var empty = document.createElement("li");
        empty.textContent = "No leaves yet.";
        list.appendChild(empty);
        return;
      }
      store.leaves.forEach(function (leaf) {
        var li = document.createElement("li");
        var b = document.createElement("b");
        b.textContent = leaf.name + "  " + leaf.at;
        var p = document.createElement("div");
        p.textContent = leaf.text;
        li.appendChild(b);
        li.appendChild(p);
        list.appendChild(li);
      });
    }
    leave.addEventListener("click", function () {
      var who = name.value.trim().slice(0, 40) || "Guest";
      var msg = text.value.trim().slice(0, 280);
      if (!msg) return;
      store.leaves.unshift({ name: who, text: msg, at: new Date().toLocaleString() });
      store.leaves = store.leaves.slice(0, 40);
      name.value = "";
      text.value = "";
      save();
      paint();
    });
    body.appendChild(honest);
    body.appendChild(name);
    body.appendChild(text);
    body.appendChild(row);
    row.appendChild(leave);
    body.appendChild(list);
    paint();
  }

  function mountAbout(body) {
    var box = document.createElement("div");
    box.className = "about-copy sunken";
    var lines = [
      "LYGO 98 is a late-90s desk made for chatagent.ca by Justin Helmer (Excavationpro / Lightfather).",
      "The teal field and gray windows follow that era. The LYGO mark, the names, and the pictures are original. This is an unofficial spin-off. It is not Windows, and it does not use Microsoft's flag, pictures, or font files.",
      "Lattice Corridor and Vale Tactics are the same games as on the hub. They open in a window here.",
      "Notes and guest leaves stay in this browser."
    ];
    lines.forEach(function (line) {
      var p = document.createElement("p");
      p.textContent = line;
      box.appendChild(p);
    });
    var links = document.createElement("p");
    function addLink(href, label) {
      var a = document.createElement("a");
      a.href = href;
      a.textContent = label;
      links.appendChild(a);
      links.appendChild(document.createTextNode("  "));
    }
    addLink("/games/", "All games");
    addLink("/games/lattice-corridor/", "Lattice Corridor");
    addLink("/games/moonlit-tactics/", "Vale Tactics");
    addLink("./ledger.html", "Hall");
    addLink("https://www.paypal.com/paypalme/ExcavationPro", "PayPal");
    addLink("https://www.patreon.com/Excavationpro", "Patreon");
    box.appendChild(links);
    body.appendChild(box);
  }

  function buildMenu() {
    menu.innerHTML = "";
    function label(text) {
      var d = document.createElement("div");
      d.className = "menu-label";
      d.textContent = text;
      menu.appendChild(d);
    }
    function item(text, fn) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "menu-item";
      b.textContent = text;
      b.addEventListener("click", function () { closeMenu(); fn(); });
      menu.appendChild(b);
    }
    label("Programs");
    item("Hearth Note", function () { openFile("note"); });
    item("Hearth Prompt", function () { openFile("prompt"); });
    item("Hearth Paint", function () { openFile("paint"); });
    item("Hearth Player", function () { openFile("player"); });
    item("Hearth Calc", function () { openFile("calc"); });
    item("Leaf Mail", function () { openFile("mail"); });
    item("Wire Chat", function () { openFile("chat"); });
    item("Picture Box", function () { openFile("photos"); });
    item("Hearth Browse", function () { openFile("browse"); });
    item("Dial Tone", function () { openFile("dial"); });
    item("Night Wire", function () { openFile("wireweb"); });
    item("Night Swap", function () { openFile("swap"); });
    item("Lime Line", function () { openFile("lime"); });
    label("Before the swap");
    item("Old Lines", function () { openFile("oldlines"); });
    item("Harbor Board", function () { openFile("bbs"); });
    item("File Pier", function () { openFile("ftp"); });
    item("News Spool", function () { openFile("news"); });
    item("Relay Room", function () { openFile("relay"); });
    item("Basement Discs", function () { openFile("discs"); });
    item("Disk Tidy", function () { openFile("tidy"); });
    item("Find", function () { openFile("find"); });
    item("The Drawer", function () { openFile("drawer"); });
    item("The Bin", function () { openFile("bin"); });
    item("Guest Leaf", function () { openFile("leaf"); });
    item("Papers", function () { openFile("papers"); });
    item("About LYGO", function () { openFile("about"); });
    label("Games");
    item("Ash Cells", function () { openFile("ash"); });
    item("Ember Pairs", function () { openFile("pairs"); });
    item("Hearth Stack", function () { openFile("cards"); });
    item("Lattice Corridor", function () { openFile("corridor"); });
    item("Vale Tactics", function () { openFile("vale"); });
    var rule = document.createElement("div");
    rule.className = "menu-rule";
    menu.appendChild(rule);
    var link = document.createElement("a");
    link.className = "menu-item games-mini";
    link.href = "/games/";
    link.textContent = "All games";
    menu.appendChild(link);
    item("Arrange icons", arrange);
    item("Cascade windows", cascade);
    item("Run", openRun);
    item("Screen saver", function () { power(false); });
    item("Shut down", askLeave);
  }

  function arrange() {
    store.icons = {};
    save();
    renderIcons();
  }

  function closeMenu() {
    menu.hidden = true;
    deskBtn.classList.remove("is-open");
    deskBtn.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    var open = menu.hidden;
    if (open) {
      menu.hidden = false;
      deskBtn.classList.add("is-open");
      deskBtn.setAttribute("aria-expanded", "true");
    } else closeMenu();
  }

  function showCtx(x, y, rows) {
    hideCtx();
    var box = document.createElement("div");
    box.className = "ctx raised";
    box.style.left = Math.min(x, window.innerWidth - 180) + "px";
    box.style.top = Math.min(y, window.innerHeight - 80) + "px";
    rows.forEach(function (row) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = row[0];
      b.addEventListener("click", function () {
        hideCtx();
        row[1]();
      });
      box.appendChild(b);
    });
    document.body.appendChild(box);
  }

  function hideCtx() {
    var old = document.querySelector(".ctx");
    if (old) old.remove();
  }

  function askLeave() {
    openWindow("leave-ask", "Leave the desk", 280, 140, function (body) {
      var p = document.createElement("p");
      p.className = "about-copy";
      p.textContent = "Shut the desk down?";
      var row = document.createElement("div");
      row.className = "row";
      var yes = document.createElement("button");
      yes.type = "button";
      yes.className = "raised";
      yes.textContent = "Leave";
      var no = document.createElement("button");
      no.type = "button";
      no.className = "raised";
      no.textContent = "Stay";
      yes.addEventListener("click", function () { power(false); });
      no.addEventListener("click", function () { closeWin("leave-ask"); });
      row.appendChild(yes);
      row.appendChild(no);
      body.appendChild(p);
      body.appendChild(row);
    });
  }

  function cascade() {
    var i = 0;
    Array.prototype.forEach.call(windows.children, function (win) {
      win.classList.remove("is-min");
      win.style.left = (20 + (i % 8) * 26) + "px";
      win.style.top = (12 + (i % 8) * 22) + "px";
      win.dataset.max = "0";
      i += 1;
    });
  }

  function openRun() {
    openWindow("run-box", "Run", 320, 140, function (body) {
      var p = document.createElement("p");
      p.className = "about-copy";
      p.textContent = "Type a name on the desk. Try mail, bin, or diary.";
      var form = document.createElement("form");
      form.className = "prompt-row";
      var input = document.createElement("input");
      input.setAttribute("aria-label", "Run");
      var go = document.createElement("button");
      go.type = "submit";
      go.className = "raised";
      go.textContent = "OK";
      form.appendChild(input);
      form.appendChild(go);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var found = findFile(input.value);
        closeWin("run-box");
        if (Array.isArray(found)) deskAlert("Run", "More than one match.");
        else if (!found) deskAlert("Run", "LYGO 98 cannot find that.");
        else openFile(found.id);
      });
      body.appendChild(p);
      body.appendChild(form);
      setTimeout(function () { input.focus(); }, 30);
    });
  }

  function power(on) {
    document.getElementById("desk").hidden = !on;
    document.getElementById("off").hidden = on;
    document.getElementById("boot").hidden = true;
    if (!on) {
      stopTone();
      var audio = document.querySelector("#win-player audio");
      if (audio) audio.pause();
      startSaver();
    } else stopSaver();
  }

  function startSaver() {
    stopSaver();
    var canvas = document.getElementById("saver");
    var word = document.getElementById("saver-word");
    if (!canvas) return;
    if (word) word.textContent = "";
    var ctx = canvas.getContext("2d");
    var stars = [];
    var dust = [];
    var i;
    var banner = "LYGO 98    ·    a late-90s desk    ·    Truth Is. Light Becomes.    ·    ";
    function fit() {
      var host = canvas.parentElement;
      var nextW = host ? host.clientWidth : window.innerWidth;
      var nextH = host ? host.clientHeight : window.innerHeight;
      if (nextW < 1) nextW = window.innerWidth;
      if (nextH < 1) nextH = window.innerHeight;
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
    }
    fit();
    for (i = 0; i < 180; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        tint: i % 7 === 0 ? "#d4b483" : (i % 3 === 0 ? "#5eead4" : "#d7fff8")
      });
    }
    for (i = 0; i < 40; i++) dust.push({ x: Math.random(), y: Math.random(), v: 0.00015 + Math.random() * 0.00035 });
    var t0 = Date.now();
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function ring(cx, cy, radius, count, spin, color) {
      var n;
      var pts = [];
      for (n = 0; n < count; n++) {
        var a = spin + (Math.PI * 2 * n) / count;
        pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius * 0.62]);
      }
      ctx.beginPath();
      pts.forEach(function (p, idx) {
        if (idx === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      pts.forEach(function (p) {
        ctx.fillStyle = color;
        ctx.fillRect(p[0] - 2, p[1] - 2, 4, 4);
      });
    }
    function frame() {
      fit();
      var w = canvas.width;
      var h = canvas.height;
      var now = Date.now() - t0;
      var sky = ctx.createRadialGradient(w / 2, h * 0.42, 40, w / 2, h / 2, Math.max(w, h) * 0.72);
      sky.addColorStop(0, "#062c32");
      sky.addColorStop(0.45, "#021018");
      sky.addColorStop(1, "#000008");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      var motion = reduce ? 0.55 : 1;
      stars.forEach(function (s) {
        s.z -= 0.014 * motion;
        if (s.z <= 0) { s.x = Math.random(); s.y = Math.random(); s.z = 1; }
        var k = (1 - s.z) * 2.4;
        var x = (s.x - 0.5) * k * w + w / 2;
        var y = (s.y - 0.5) * k * h + h / 2;
        var size = 1 + (1 - s.z) * 2.2;
        ctx.globalAlpha = 0.35 + (1 - s.z) * 0.65;
        ctx.fillStyle = s.tint;
        ctx.fillRect(x, y, size, size);
      });
      ctx.globalAlpha = 0.45;
      dust.forEach(function (d) {
        d.x += d.v * 8 * motion;
        if (d.x > 1) d.x = 0;
        ctx.fillStyle = "#7ee0d0";
        ctx.fillRect(d.x * w, d.y * h, 1.5, 1.5);
      });
      ctx.globalAlpha = 0.7;
      var cx = w / 2;
      var cy = h * 0.46;
      var pulse = Math.sin(now / 700) * 14 * motion;
      ring(cx, cy, Math.min(w, h) * 0.34 + pulse, 18, now / 1400 * motion, "rgba(212,180,131,0.9)");
      ring(cx, cy, Math.min(w, h) * 0.22, 11, -now / 900 * motion, "rgba(94,234,212,0.95)");
      var spark;
      ctx.globalAlpha = 1;
      for (spark = 0; spark < 8; spark++) {
        var ang = now / 700 * motion + spark * 0.8;
        var rad = Math.min(w, h) * (0.16 + (spark % 4) * 0.07);
        ctx.fillStyle = spark % 2 ? "#d4b483" : "#5eead4";
        ctx.fillRect(cx + Math.cos(ang) * rad - 3, cy + Math.sin(ang) * rad * 0.62 - 3, 6, 6);
      }
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#5eead4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.min(w, h) * 0.16, Math.min(w, h) * 0.1, now / 2200 * motion, 0, Math.PI * 1.35);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.font = "13px Tahoma, Verdana, sans-serif";
      ctx.fillStyle = "rgba(232,255,251,0.72)";
      var bw = ctx.measureText(banner).width;
      var shift = (now / 22 * motion) % bw;
      var bx = -shift;
      while (bx < w) {
        ctx.fillText(banner, bx, h - 22);
        bx += bw;
      }
      if (word && (reduce || now > 3200)) word.textContent = saverWord;
      saverRAF = requestAnimationFrame(frame);
    }
    saverResize = function () { frame(); };
    window.addEventListener("resize", saverResize);
    frame();
  }

  function stopSaver() {
    if (saverRAF) cancelAnimationFrame(saverRAF);
    saverRAF = 0;
    if (saverResize) {
      window.removeEventListener("resize", saverResize);
      saverResize = null;
    }
  }

  function wake() {
    if (document.getElementById("off").hidden) return;
    stopSaver();
    document.getElementById("off").hidden = true;
    document.getElementById("boot").hidden = false;
    booted = false;
    idleAt = Date.now();
    setTimeout(sitDown, bootClicked ? 600 : 400);
  }

  function tick() {
    var d = new Date();
    clock.textContent = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function sitDown() {
    if (booted) return;
    booted = true;
    document.getElementById("boot").hidden = true;
    document.getElementById("desk").hidden = false;
    renderIcons();
    buildMenu();
    tick();
    if (!store.seen) {
      store.seen = true;
      save();
      openFile("readme");
    }
    if (bootClicked) chime();
  }

  function chime() {
    try {
      var ctx = getCtx();
      [523, 659, 784, 1046].forEach(function (freq, i) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = "square";
        o.frequency.value = freq;
        g.gain.value = 0.03;
        o.connect(g);
        g.connect(ctx.destination);
        var t = ctx.currentTime + i * 0.12;
        o.start(t);
        o.stop(t + 0.1);
      });
    } catch (e) { /* silent boot */ }
  }

  deskBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleMenu();
  });
  document.addEventListener("pointerdown", function (e) {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== deskBtn && !deskBtn.contains(e.target)) closeMenu();
    if (!e.target.closest(".ctx") && !e.target.closest(".icon")) hideCtx();
  });
  desktop.addEventListener("pointerdown", function (e) {
    if (e.target === desktop) selectIcon("");
  });
  desktop.addEventListener("contextmenu", function (e) {
    if (e.target.closest(".icon")) return;
    e.preventDefault();
    showCtx(e.clientX, e.clientY, [
      ["Arrange icons", arrange],
      ["Cascade windows", cascade],
      ["Run", openRun],
      ["Screen saver", function () { power(false); }],
      ["About LYGO", function () { openFile("about"); }]
    ]);
  });
  document.addEventListener("keydown", function (e) {
    if (!document.getElementById("off").hidden) {
      if (e.key === "Tab") return;
      wake();
      return;
    }
    poke();
    if (e.key === "Escape") {
      if (!menu.hidden) { closeMenu(); return; }
      hideCtx();
    }
    if (e.altKey && e.key === "Tab") {
      e.preventDefault();
      var list = Array.prototype.filter.call(windows.children, function (win) {
        return !win.classList.contains("is-min");
      });
      if (!list.length) return;
      var on = 0;
      list.forEach(function (win, i) { if (win.classList.contains("is-on")) on = i; });
      var next = list[(on + 1) % list.length];
      focusWin(next.dataset.win);
    }
    if (e.key === "Enter" && selected && (document.activeElement === document.body || document.activeElement === desktop)) {
      openFile(selected);
    }
  });
  document.getElementById("boot").addEventListener("click", function (e) {
    if (e.target.closest("a")) return;
    bootClicked = true;
    sitDown();
  });
  document.getElementById("off").addEventListener("click", function (e) {
    if (e.target.closest("a")) return;
    wake();
  });
  document.getElementById("power-btn").addEventListener("click", function () { power(false); });
  clock.addEventListener("click", function () { openFile("calendar"); });
  document.getElementById("vol-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    var pop = document.getElementById("vol-pop");
    pop.hidden = !pop.hidden;
  });
  document.getElementById("vol-slider").addEventListener("input", function (e) {
    store.vol = Number(e.target.value) / 100;
    var audio = document.querySelector("#win-player audio");
    if (audio) audio.volume = store.vol;
    save();
  });
  document.getElementById("vol-slider").value = String(Math.round((store.vol || 0.7) * 100));
  function poke() { idleAt = Date.now(); }
  ["pointerdown", "pointermove", "keydown"].forEach(function (name) {
    document.addEventListener(name, poke);
  });
  setInterval(function () {
    var deskOn = document.getElementById("desk") && !document.getElementById("desk").hidden;
    var saverOn = !document.getElementById("off").hidden;
    if (deskOn && !saverOn && Date.now() - idleAt > 75000) power(false);
  }, 4000);
  setInterval(tick, 1000);

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(sitDown, reduce ? 350 : 1400);

  window.HavenDesk = {
    open: openFile,
    exec: execLine,
    files: FILES,
    key: STORE_KEY,
    addFile: function (file) { FILES.push(file); },
    register: function (id, fn) { APP_MOUNT[id] = fn; },
    command: function (name, fn) { EXTRA_CMD[name] = fn; },
    onRender: function (fn) { renderHooks.push(fn); },
    alert: deskAlert,
    save: save,
    store: store,
    beep: beep,
    restore: restoreFile,
    inBin: inBin,
    refresh: renderIcons,
    setSaverWord: function (word) { saverWord = word; }
  };
})();
