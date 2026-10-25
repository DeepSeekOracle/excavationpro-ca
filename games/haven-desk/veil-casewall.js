/* HAVEN DESK — CASE WALL.
   Every room the calendar keeps, pinned to one wall:
   search it, filter it, open the date. */
(function () {
  "use strict";
  var H = window.HavenDesk;
  var D = window.VEIL_DATA;
  if (!H || !D || !D.days) return;
  if (!H.store.veil || typeof H.store.veil !== "object") H.store.veil = {};
  var V = H.store.veil;
  V.unlocked = V.unlocked && typeof V.unlocked === "object" ? V.unlocked : {};
  V.solved = V.solved && typeof V.solved === "object" ? V.solved : {};

  var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  function shortDate(id) {
    var p = id.split("-");
    return MONTHS[Number(p[1]) - 1] + " " + Number(p[2]) + ", " + p[0];
  }
  function visible(id) {
    var d = D.days[id];
    return !!d && (!d.hidden || !!V.unlocked[id] || !!V.solved[id]);
  }
  function isSolved(id) { return !!V.solved[id]; }
  function truncate(text, n) {
    text = String(text || "");
    if (text.length <= n) return text;
    return text.slice(0, n - 1).replace(/\s+\S*$/, "") + "…";
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function btn(label, cls, fn) {
    var b = el("button", cls || "raised", label);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }

  function actList() {
    var seen = {};
    var out = [];
    Object.keys(D.days).forEach(function (id) {
      if (!visible(id)) return;
      var a = D.days[id].act || "—";
      if (!seen[a]) { seen[a] = true; out.push(a); }
    });
    out.sort(function (a, b) {
      var na = parseFloat(a), nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a < b ? -1 : a > b ? 1 : 0;
    });
    return out;
  }

  // Open the calendar, then turn it to this exact date. The calendar window
  // renders asynchronously, so poll for the node briefly before giving up.
  function openDate(id, say) {
    H.open("calendar");
    var tries = 0;
    var turned = 0;
    var timer = 0;
    function stop() { if (timer) { clearTimeout(timer); timer = 0; } }
    function find() {
      var node = document.querySelector('.veil-node[data-day="' + id + '"]');
      if (node) { node.click(); return; }
      tries++;
      if (tries === 5 && turned < 2) {
        var tab = document.querySelector('#win-calendar .veil-tab[data-view="map"]');
        var back = document.querySelector('#win-calendar .veil-back');
        if (tab) { tab.click(); turned++; }
        else if (back) { back.click(); turned++; }
      }
      if (tries > 40) {
        stop();
        say("THE CALENDAR WOULD NOT TURN TO " + shortDate(id) + ". OPEN THE DATE MAP AND TRY AGAIN.");
        return;
      }
      timer = setTimeout(find, 50);
    }
    find();
  }

  H.register("casewall", function (body) {
    var app = el("div", "veil-app veil-casewall");
    body.appendChild(app);
    var state = { q: "", status: "all", act: "all" };
    var grid = null;
    var shown = null;
    var count = null;
    var toastNode = null;
    var toastTimer = 0;

    function say(msg) {
      if (!toastNode) {
        toastNode = el("div", "veil-toast");
        app.appendChild(toastNode);
      }
      toastNode.textContent = msg;
      toastNode.classList.add("is-on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastNode.classList.remove("is-on"); }, 3200);
    }

    function rooms() {
      return Object.keys(D.days).filter(function (id) { return visible(id); }).sort();
    }
    function matches(id) {
      var d = D.days[id];
      if (state.status === "open" && !isSolved(id)) return false;
      if (state.status === "locked" && isSolved(id)) return false;
      if (state.act !== "all" && (d.act || "—") !== state.act) return false;
      var q = state.q.trim().toLowerCase();
      if (q) {
        var hay = ((d.title || "") + " " + (d.summary || "")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }

    function refresh() {
      if (!grid) return;
      grid.innerHTML = "";
      var all = rooms();
      var rows = all.filter(matches);
      rows.forEach(function (id) { grid.appendChild(card(id)); });
      if (!rows.length) {
        grid.appendChild(el("p", "veil-casewall-empty", "No rooms on the wall match. Clear the search or widen the filters."));
      }
      if (shown) shown.textContent = rows.length + " OF " + all.length + " SHOWN";
      if (count) count.textContent = all.filter(isSolved).length + " / " + all.length + " ROOMS";
    }

    function card(id) {
      var d = D.days[id];
      var open = isSolved(id);
      var cardEl = el("article", "veil-casewall-card " + (open ? "is-solved" : "is-locked"));
      var head = el("div", "veil-casewall-cardhead");
      head.appendChild(el("span", "veil-casewall-date", shortDate(id)));
      head.appendChild(el("span", "veil-casewall-state", open ? "UNSEALED" : "SEALED"));
      cardEl.appendChild(head);
      cardEl.appendChild(el("strong", "veil-casewall-title", d.title || shortDate(id)));
      cardEl.appendChild(el("p", "veil-casewall-sum", truncate(d.summary, 130)));
      var meta = el("div", "veil-casewall-meta");
      meta.appendChild(el("span", "", "ACT " + (d.act || "—")));
      if (d.kind) meta.appendChild(el("span", "", String(d.kind).toUpperCase()));
      cardEl.appendChild(meta);
      cardEl.appendChild(btn("OPEN", "veil-casewall-open", function () { openDate(id, say); }));
      return cardEl;
    }

    var top = el("div", "veil-top");
    var brand = el("div", "veil-brand");
    brand.appendChild(el("span", "veil-mark", "Δ9"));
    var copy = el("div");
    copy.appendChild(el("strong", "", "CASE WALL"));
    copy.appendChild(el("small", "", "EVERY ROOM · ONE WALL"));
    brand.appendChild(copy);
    top.appendChild(brand);
    count = el("span", "veil-progress", "");
    top.appendChild(count);
    app.appendChild(top);

    var bar = el("div", "veil-casewall-bar");
    var search = el("input", "veil-casewall-search");
    search.type = "text";
    search.autocomplete = "off";
    search.spellcheck = false;
    search.placeholder = "SEARCH TITLE OR SUMMARY";
    search.setAttribute("aria-label", "search the case wall");
    search.addEventListener("input", function () {
      state.q = search.value;
      refresh();
    });
    search.addEventListener("keydown", function (e) {
      if (e.key === "Enter") e.preventDefault();
    });
    bar.appendChild(search);

    var statusGroup = el("div", "veil-casewall-status");
    [["all", "ALL"], ["open", "OPEN"], ["locked", "LOCKED"]].forEach(function (row) {
      var b = btn(row[1], "veil-casewall-filter" + (state.status === row[0] ? " is-on" : ""), function () {
        state.status = row[0];
        Array.prototype.forEach.call(statusGroup.children, function (c) {
          c.classList.toggle("is-on", c.dataset.status === row[0]);
        });
        refresh();
      });
      b.dataset.status = row[0];
      statusGroup.appendChild(b);
    });
    bar.appendChild(statusGroup);

    var actSel = el("select", "veil-casewall-act");
    actSel.setAttribute("aria-label", "filter by act");
    actSel.appendChild(new Option("ALL ACTS", "all"));
    actList().forEach(function (a) { actSel.appendChild(new Option("ACT " + a, a)); });
    actSel.addEventListener("change", function () {
      state.act = actSel.value;
      refresh();
    });
    bar.appendChild(actSel);

    shown = el("span", "veil-casewall-shown", "");
    bar.appendChild(shown);
    app.appendChild(bar);

    grid = el("div", "veil-casewall-grid");
    app.appendChild(grid);

    app.appendChild(el("p", "veil-casewall-foot", "Sealed rooms open when the calendar says so. Every OPEN turns the calendar to that exact date."));

    app.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && state.q) {
        e.preventDefault();
        state.q = "";
        search.value = "";
        refresh();
      }
    });

    refresh();
  });

  H.addFile({ id: "casewall", name: "Case Wall", kind: "app", icon: "grid", x: 1064, y: 476, wide: 960, high: 680 });
})();
