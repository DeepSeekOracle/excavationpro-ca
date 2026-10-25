/* HAVEN DESK — recovered floppies.
   Each live excavationpro.ca game leaked into one calendar room that shares
   its theme. The disk sits in that dossier. The Disk Shelf is the collection
   of disks you have actually found. Opening a disk mounts it in a desk window. */
(function () {
  "use strict";
  var H = window.HavenDesk;
  if (!H) return;
  if (!H.store.veil) H.store.veil = {};
  var V = H.store.veil;
  if (!V.cabinets || typeof V.cabinets !== "object") V.cabinets = {};

  var DISKS = [
    { slug: "lattice-grand-prix", title: "Lattice Grand Prix", file: "PRIX.DSK", href: "/games/lattice-grand-prix/", cover: "/games/lattice-grand-prix/assets/og.jpg", date: "1969-07-20", found: "A vehicle leaving Earth. The first distance is a lap." },
    { slug: "lattice-swarm", title: "Lattice Swarm", file: "SWARM.DSK", href: "/games/lattice-swarm/", cover: "/games/lattice-swarm/og.jpg", date: "1971-11-15", found: "Four bits, then a hex of machines that have to stay in phase." },
    { slug: "lattice-tennis", title: "Lattice Tennis", file: "TENNIS.DSK", href: "/games/lattice-tennis/", cover: "/games/lattice-tennis/og.jpg", date: "1973-04-03", found: "The first handheld call is two people across a net of signal." },
    { slug: "lygo-dungeon", title: "LYGO Dungeon", file: "DUNGEON.DSK", href: "/games/lygo-dungeon/", cover: "/games/lygo-dungeon/assets/og.jpg", date: "1977-09-05", found: "A golden record for a still-frame road into the dark." },
    { slug: "lattice-city", title: "Lattice City", file: "CITY.DSK", href: "/games/lattice-city/", cover: "/games/lattice-city/og.jpg", date: "1984-01-24", found: "The friendly machine turns windows into a city." },
    { slug: "lattice-marines", title: "Lattice Marines", file: "MARINES.DSK", href: "/games/lattice-marines/", cover: "/games/lattice-marines/assets/og.jpg", date: "1989-11-09", found: "A wall comes down. Two sides still have to be placed." },
    { slug: "lattice-arcade", title: "Lattice Arcade", file: "ARCADE.DSK", href: "/games/lattice-arcade/", cover: "/games/lattice-arcade/og.jpg", date: "1991-08-06", found: "The web makes a photograph into a fighter." },
    { slug: "lattice-corridor", title: "Lattice Corridor", file: "CORRIDOR.WAD", href: "/games/lattice-corridor/", cover: "/games/lattice-corridor/assets/og.jpg", date: "1993-04-22", found: "Shareware year. A corridor the desk kept as a WAD." },
    { slug: "haven-rally", title: "Haven Rally", file: "RALLY.DSK", href: "/games/haven-rally/", cover: "/games/haven-rally/assets/apex-hero.jpg", date: "1995-08-24", found: "A consumer PC learns to race a ghost." },
    { slug: "lattice-golf", title: "Lattice Golf", file: "GOLF.DSK", href: "/games/lattice-golf/", cover: "/games/lattice-golf/assets/og.jpg", date: "1996-07-04", found: "A summer holiday the calendar refused to throw away." },
    { slug: "lattice-chess", title: "Lattice Chess 3D", file: "CHESS.DSK", href: "/games/lattice-chess/", cover: "/games/lattice-chess/og.jpg", date: "1997-05-11", found: "A machine that plays. Deep Blue's year, in stone." },
    { slug: "lattice-crypt", title: "Lattice Crypt", file: "CRYPT.DSK", href: "/games/lattice-crypt/", cover: "/games/lattice-crypt/assets/og.jpg", date: "1999-12-31", found: "A countdown with a horde behind it." },
    { slug: "stock-market-masters", title: "Stock Market Masters", file: "TICKER.DSK", href: "/games/stock-market-masters/", cover: "/games/stock-market-masters/assets/og.jpg", date: "2003-04-28", found: "The store becomes a quotation floor." },
    { slug: "lattice-arena", title: "LYGO Arena", file: "ARENA.DSK", href: "/games/lattice-arena/", cover: "/games/lattice-arena/assets/og.jpg?v=ring", date: "2019-06-01", found: "Catch the signal. Two crews already in the ring." },
    { slug: "moonlit-tactics", title: "Vale Tactics", file: "VALE.DSK", href: "/games/moonlit-tactics/", cover: "/games/moonlit-tactics/assets/og.jpg", date: "2012-12-21", found: "A painted road at the end of a calendar." },
    { slug: "eternal-lattice", title: "Eternal Lattice", file: "CARDS.DSK", href: "/games/eternal-lattice/", cover: "/games/eternal-lattice/og.jpg", date: "2022-11-30", found: "Champion cards for a year that started talking back." },
    { slug: "fish-tank", title: "Fish Tank", file: "TANK.DSK", href: "/games/fish-tank/", cover: "/games/fish-tank/assets/og.jpg?v=2", date: "2023-03-14", found: "A life kept in glass. Kooter's year." }
  ];
  var BY_DATE = {};
  DISKS.forEach(function (d) { BY_DATE[d.date] = d; });

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function btn(label, cls, fn) {
    var b = el("button", cls || "raised", label);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }
  function fileId(slug) { return "disk-" + slug; }
  function ensureFiles() {
    DISKS.forEach(function (d) {
      var id = fileId(d.slug);
      var have = false;
      for (var i = 0; i < H.files.length; i++) if (H.files[i].id === id) have = true;
      if (!have) {
        H.addFile({
          id: id, name: d.file, kind: "frame", icon: "pairs",
          href: d.href, desk: false, wide: 980, high: 700
        });
      }
    });
    var shelf = false;
    for (var j = 0; j < H.files.length; j++) if (H.files[j].id === "diskshelf") shelf = true;
    if (!shelf) {
      H.addFile({
        id: "diskshelf", name: "Disk Shelf", kind: "app", icon: "drawer",
        x: 584, y: 398, wide: 920, high: 660, desk: true
      });
    }
  }
  function mark(slug, date) {
    if (V.cabinets[slug]) return;
    V.cabinets[slug] = { at: new Date().toISOString(), date: date };
    H.save();
    try { H.beep(520, 0.05); } catch (e) {}
  }
  function insert(disk) {
    mark(disk.slug, disk.date);
    ensureFiles();
    H.open(fileId(disk.slug));
    if (H.toast) H.toast("DISK MOUNTED · " + disk.file);
  }
  function paint(id) {
    var disk = BY_DATE[id];
    if (!disk) return;
    var app = document.querySelector("#win-calendar .veil-app") || document.querySelector("#win-longlost .veil-app");
    if (!app || !app.querySelector(".veil-hero")) return;
    if (app.querySelector(".veil-disk")) return;
    var box = el("div", "veil-disk");
    box.appendChild(el("b", "", "RECOVERED FLOPPY · " + disk.file));
    var row = el("div", "veil-disk-row");
    var img = document.createElement("img");
    img.src = disk.cover;
    img.alt = disk.title;
    img.loading = "lazy";
    row.appendChild(img);
    var copy = el("div", "veil-disk-copy");
    copy.appendChild(el("strong", "", disk.title));
    copy.appendChild(el("p", "", disk.found));
    copy.appendChild(el("small", "", "The calendar stored a playable copy. Mounting it does not unseal the room. The gate is still the prose."));
    var actions = el("div", "veil-actions");
    actions.appendChild(btn("INSERT DISK", "veil-primary", function () { insert(disk); }));
    actions.appendChild(btn("DISK SHELF", "raised", function () { H.open("diskshelf"); }));
    copy.appendChild(actions);
    row.appendChild(copy);
    box.appendChild(row);
    var voice = app.querySelector(".veil-voice");
    var docs = app.querySelector(".veil-docs");
    var anchor = voice || docs || app.querySelector(".veil-meta");
    if (anchor && anchor.nextSibling) app.insertBefore(box, anchor.nextSibling);
    else app.appendChild(box);
  }

  H.register("diskshelf", function (body) {
    ensureFiles();
    var app = el("div", "veil-app");
    body.appendChild(app);
    function head() {
      var top = el("div", "veil-top");
      var brand = el("div", "veil-brand");
      brand.appendChild(el("span", "veil-mark", "Δ9"));
      var copy = el("div");
      copy.appendChild(el("strong", "", "DISK SHELF"));
      copy.appendChild(el("small", "", "FLOPPIES THE CALENDAR KEPT"));
      brand.appendChild(copy); top.appendChild(brand);
      var n = Object.keys(V.cabinets).length;
      top.appendChild(el("span", "veil-progress", n + " / " + DISKS.length + " DISKS"));
      app.appendChild(top);
    }
    app.innerHTML = "";
    head();
    app.appendChild(el("p", "veil-hint", "Each live game on excavationpro.ca leaked into one year. Unseal that room to find its floppy. Inserting a disk opens the game in a desk window."));
    var grid = el("div", "veil-disk-grid");
    DISKS.forEach(function (d) {
      var found = !!V.cabinets[d.slug];
      var card = btn("", "veil-disk-card" + (found ? " is-open" : " is-locked"), function () {
        if (!found) return;
        insert(d);
      });
      if (found) {
        var img = document.createElement("img");
        img.src = d.cover; img.alt = d.title; img.loading = "lazy";
        card.appendChild(img);
        card.appendChild(el("strong", "", d.title));
        card.appendChild(el("small", "", d.date + " · " + d.file));
      } else {
        var lock = el("div", "veil-gallery-lock");
        lock.appendChild(el("span", "", "3.5\""));
        lock.appendChild(el("small", "", "SEALED ROOM"));
        card.appendChild(lock);
        card.appendChild(el("strong", "", "Unlabeled disk"));
        card.appendChild(el("small", "", "Still in the calendar"));
      }
      grid.appendChild(card);
    });
    app.appendChild(grid);
  });

  function hook() {
    ensureFiles();
    if (H.refresh) H.refresh();
    var api = window.VEIL_API;
    if (api && !api._cabinetsHooked) {
      var orig = api.openDay;
      api.openDay = function (id) {
        orig(id);
        setTimeout(function () { paint(id); }, 0);
      };
      api._cabinetsHooked = true;
    }
  }
  hook();
  setTimeout(hook, 0);
  if (H.onRender) H.onRender(function () {
    var api = window.VEIL_API;
    if (api && api.state && api.state.current) paint(api.state.current);
  });
  window.VEIL_CABINETS = { disks: DISKS, paint: paint, insert: insert };
})();
