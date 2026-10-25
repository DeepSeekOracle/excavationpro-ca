/* HAVEN DESK — PHOTO JOURNAL.
   Forge story images first; the legacy plate set remains a fallback. */
(function () {
  "use strict";
  var H = window.HavenDesk;
  var D = window.VEIL_DATA;
  var PLATES = window.VEIL_PLATES || [];
  var STORY = window.VEIL_STORY_ENTRIES || [];
  if (!H || !D) return;
  if (!STORY.length && !PLATES.length) return;
  if (!H.store.veil) H.store.veil = {};
  var V = H.store.veil;

  var anchors = Object.keys(D.days).sort();
  var PASS_LABEL = { scene: "Scene", object: "Object", afterimage: "Afterimage", document: "Document", future: "Future" };
  function photoFor(date, i) {
    return PLATES[(i * 5 + 3) % PLATES.length];
  }
  function buildStory() {
    if (!STORY.length) return [];
    return STORY.map(function (e) {
      var d = D.days[e.date];
      return {
        id: "story-" + e.date + "-" + e.index + "-" + e.pass,
        title: (d ? d.title : e.date) + " · " + (PASS_LABEL[e.pass] || e.pass),
        date: e.date,
        src: e.src,
        note: "Recovered story image · " + (PASS_LABEL[e.pass] || e.pass),
        anchor: e.date
      };
    });
  }
  function build() {
    var story = buildStory();
    if (story.length) return story;
    var out = [];
    (window.VEIL_DESKTOP ? window.VEIL_DESKTOP.walls : []).forEach(function (w) {
      out.push({ id: "bundle-" + w.id, title: w.title, date: "BUNDLED", src: w.src, note: w.note, always: true });
    });
    anchors.forEach(function (date, i) {
      var d = D.days[date];
      var p = photoFor(date, i);
      out.push({
        id: "photo-" + date, title: d.title, date: date, src: p.src,
        note: "Recovered plate · " + p.title, anchor: date
      });
    });
    out.push({ id: "photo-owner-1980", title: "The Owner · 1980", date: "1980-12-31", src: "assets/veil/owner-1980.jpg", note: "A private photograph.", anchor: "1980-12-31", portrait: true });
    out.push({ id: "photo-2045", title: "The Lightfather Plate", date: "2045-09-01", src: "assets/plates/plate-300.svg", note: "The last recovered plate.", anchor: "2045-09-01" });
    return out;
  }
  var GALLERY = build();

  function unlocked(item) {
    return item.always || !!V.solved[item.anchor];
  }
  function current() { return (V.desktop && V.desktop.background) || ""; }

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

  H.register("gallery", function (body) {
    var app = el("div", "veil-app");
    body.appendChild(app);
    var state = { current: null };
    function head(sub) {
      var top = el("div", "veil-top");
      var brand = el("div", "veil-brand");
      brand.appendChild(el("span", "veil-mark", "Δ9"));
      var copy = el("div");
      copy.appendChild(el("strong", "", "PHOTO JOURNAL"));
      copy.appendChild(el("small", "", sub));
      brand.appendChild(copy); top.appendChild(brand);
      var n = GALLERY.filter(unlocked).length;
      top.appendChild(el("span", "veil-progress", n + " / " + GALLERY.length + " PHOTOS"));
      app.appendChild(top);
    }
    function list() {
      app.innerHTML = "";
      head("THE IMAGES THE DESK KEPT · SET ANY ONE AS THE FIELD");
      app.appendChild(el("p", "veil-hint", "The desk keeps one image from every room that opens."));
      var grid = el("div", "veil-gallery-grid");
      GALLERY.forEach(function (p) {
        var ok = unlocked(p);
        var card = btn("", "veil-gallery-card" + (ok ? " is-open" : " is-locked") + (current() === p.src ? " is-current" : ""), function () {
          if (!ok) return;
          state.current = p; detail();
        });
        if (ok && p.src) {
          var img = document.createElement("img");
          img.src = p.src; img.alt = p.title; img.loading = "lazy";
          card.appendChild(img);
        } else {
          var lock = el("div", "veil-gallery-lock");
          lock.appendChild(el("span", "", "??"));
          lock.appendChild(el("small", "", "LOCKED"));
          card.appendChild(lock);
        }
        card.appendChild(el("strong", "", ok ? p.title : "Sealed Photograph"));
        card.appendChild(el("small", "", ok ? p.date + " · " + p.note : "solve " + p.date));
        grid.appendChild(card);
      });
      app.appendChild(grid);
    }
    function detail() {
      app.innerHTML = "";
      var p = state.current;
      head(p.title);
      app.appendChild(btn("← PHOTO JOURNAL", "veil-back", list));
      var frame = el("div", "veil-gallery-frame");
      var img = document.createElement("img");
      img.src = p.src; img.alt = p.title;
      frame.appendChild(img);
      app.appendChild(frame);
      app.appendChild(el("p", "veil-hint", p.date + " · " + p.note));
      var row = el("div", "veil-actions");
      row.appendChild(btn("SET AS DESKTOP", "veil-primary", function () {
        if (!window.VEIL_DESKTOP) return;
        window.VEIL_DESKTOP.setBackground(p.src || "");
        if (H.toast) H.toast("DESKTOP FIELD · " + p.title);
        detail();
      }));
      row.appendChild(btn("CLASSIC TEAL", "raised", function () {
        if (window.VEIL_DESKTOP) window.VEIL_DESKTOP.setBackground("");
        if (H.toast) H.toast("DESKTOP FIELD · Classic Teal");
        detail();
      }));
      app.appendChild(row);
      if (current() === p.src) app.appendChild(el("p", "veil-gallery-current", "CURRENT DESKTOP FIELD"));
    }
    list();
  });

  H.addFile({ id: "gallery", name: "Photo Journal", kind: "app", icon: "grid", x: 968, y: 476, wide: 920, high: 680 });
})();
