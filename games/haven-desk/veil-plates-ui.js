/* HAVEN DESK — THE PLATE ARCHIVE.
   300 generated SVG archive plates from veil-plates.js. This app is the
   in-world proof that the archive is not just two hero images. */
(function () {
  "use strict";
  var H = window.HavenDesk;
  if (!H || !window.VEIL_PLATES) return;
  var ALL = window.VEIL_PLATES;
  var PAGE = 48;

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

  H.register("plates", function (body) {
    var app = el("div", "veil-app");
    body.appendChild(app);
    var state = { q: "", page: 0, plate: null };

    function head(title, sub) {
      var top = el("div", "veil-top");
      var brand = el("div", "veil-brand");
      brand.appendChild(el("span", "veil-mark", "Δ9"));
      var copy = el("div");
      copy.appendChild(el("strong", "", title));
      copy.appendChild(el("small", "", sub));
      brand.appendChild(copy); top.appendChild(brand);
      top.appendChild(el("span", "veil-progress", ALL.length + " PLATES"));
      app.appendChild(top);
    }
    function grid() {
      app.innerHTML = "";
      head("THE PLATE ARCHIVE", "300 RECOVERED PLATES · TEMPORAL STACK");
      var tools = el("div", "veil-actions");
      var input = document.createElement("input");
      input.className = "veil-input";
      input.placeholder = "search plates / dates";
      input.value = state.q;
      input.oninput = function () { state.q = input.value; state.page = 0; grid(); };
      tools.appendChild(input);
      tools.appendChild(btn("CLEAR", "raised", function () { state.q = ""; state.page = 0; grid(); }));
      app.appendChild(tools);
      setTimeout(function () { try { input.focus(); input.setSelectionRange(input.value.length, input.value.length); } catch (e) {} }, 0);

      var q = state.q.trim().toLowerCase();
      var rows = ALL.filter(function (p) {
        return !q || (p.id + " " + p.title + " " + p.date).toLowerCase().indexOf(q) >= 0;
      });
      var pages = Math.max(1, Math.ceil(rows.length / PAGE));
      state.page = Math.min(state.page, pages - 1);
      var slice = rows.slice(state.page * PAGE, state.page * PAGE + PAGE);
      var g = el("div", "veil-plate-grid");
      slice.forEach(function (p) {
        var card = btn("", "veil-plate-card", function () {
          state.plate = p; detail();
        });
        var img = document.createElement("img");
        img.src = p.src; img.alt = p.title; img.loading = "lazy";
        card.appendChild(img);
        card.appendChild(el("strong", "", p.title));
        card.appendChild(el("small", "", p.date + " · " + p.id));
        g.appendChild(card);
      });
      app.appendChild(g);
      var nav = el("div", "veil-plate-nav");
      nav.appendChild(btn("← PREV", "raised", function () { if (state.page > 0) { state.page--; grid(); } }));
      nav.appendChild(el("span", "veil-hint", "PAGE " + (state.page + 1) + " / " + pages + " · " + rows.length + " PLATES"));
      nav.appendChild(btn("NEXT →", "raised", function () { if (state.page + 1 < pages) { state.page++; grid(); } }));
      app.appendChild(nav);
    }
    function detail() {
      app.innerHTML = "";
      var p = state.plate;
      head(p.title, p.date + " · " + p.id + " · ORIGINAL PLATE");
      app.appendChild(btn("← ARCHIVE", "veil-back", function () { state.plate = null; grid(); }));
      var frame = el("div", "veil-plate-frame");
      var img = document.createElement("img");
      img.src = p.src; img.alt = p.title;
      frame.appendChild(img);
      app.appendChild(frame);
      app.appendChild(el("p", "veil-hint", "Recovered from the temporal stack. No third-party imagery."));
      var a = document.createElement("a");
      a.className = "veil-primary";
      a.href = p.src; a.download = p.id + ".svg"; a.textContent = "DOWNLOAD PLATE";
      app.appendChild(a);
    }
    grid();
  });

  H.addFile({ id: "plates", name: "Plate Archive", kind: "app", icon: "grid", x: 392, y: 476, wide: 920, high: 660 });
})();
