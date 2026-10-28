(function () {
  "use strict";
  var CATALOG = "/games/catalog.json";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function sorted(games) {
    return games.slice().sort(function (a, b) {
      return (a.order || 99) - (b.order || 99);
    });
  }

  function live(games) {
    return sorted(games).filter(function (g) { return g.status === "live"; });
  }

  function coverHtml(g) {
    if (g.cover) {
      return '<img class="gcard-cover" src="' + esc(g.cover) + '" alt="' + esc(g.coverAlt || g.title) + '" width="640" height="336" loading="lazy">';
    }
    return '<div class="gcard-cover gcard-cover-empty" aria-hidden="true"></div>';
  }

  function linksHtml(g) {
    var coming = g.status !== "live" || !g.href;
    var bits = [];
    if (coming) bits.push('<span class="gcard-soon">Coming next</span>');
    else bits.push('<a class="btn primary" href="' + esc(g.href) + '">Play</a>');
    (g.links || []).forEach(function (l) {
      bits.push('<a class="btn" href="' + esc(l.href) + '">' + esc(l.label) + "</a>");
    });
    return bits.join("");
  }

  function cardHtml(g) {
    var coming = g.status !== "live";
    var genre = (g.genre || []).join(" · ");
    return (
      '<article class="gcard' + (coming ? " is-coming" : "") + '" data-id="' + esc(g.id) + '" data-genre="' + esc((g.genre || []).join(" ")) + '">' +
        '<div class="gmod-stage">' + coverHtml(g) + "</div>" +
        '<div class="gcard-body">' +
          '<p class="gcard-kicker">' + esc(genre || (coming ? "upcoming" : "game")) + "</p>" +
          "<h2>" + esc(g.title) + "</h2>" +
          "<p>" + esc(g.blurb || g.tagline || "") + "</p>" +
          '<div class="cta-row">' + linksHtml(g) + "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function miniHtml(g) {
    return (
      '<div class="mini"><h3><a href="' + esc(g.href) + '">' + esc(g.title) + "</a></h3>" +
      "<p>" + esc(g.tagline || g.blurb || "") + "</p></div>"
    );
  }

  function jsonLd(data) {
    var items = live(data.games).map(function (g, i) {
      return {
        "@type": "ListItem",
        position: i + 1,
        url: (location.origin || "") + g.href,
        name: g.title
      };
    });
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Games",
      numberOfItems: items.length,
      itemListElement: items
    };
  }

  function applyFilter(root, key) {
    root.querySelectorAll(".gcard").forEach(function (card) {
      if (key === "all") {
        card.hidden = false;
        return;
      }
      if (key === "coming") {
        card.hidden = !card.classList.contains("is-coming");
        return;
      }
      var genre = (card.getAttribute("data-genre") || "").toLowerCase();
      card.hidden = genre.indexOf(key) === -1;
    });
  }

  function renderArcade(root, data) {
    var games = sorted(data.games || []);
    var nLive = live(games).length;
    var count = root.querySelector("[data-games-count]");
    if (count) count.textContent = String(nLive);
    var grid = root.querySelector("[data-games-grid]");
    if (!grid) return;
    grid.innerHTML = games.map(cardHtml).join("");
    var filters = root.querySelector("[data-games-filters]");
    if (filters) {
      filters.addEventListener("click", function (ev) {
        var btn = ev.target.closest("button[data-filter]");
        if (!btn) return;
        filters.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        applyFilter(grid, btn.getAttribute("data-filter"));
      });
    }
    var ld = document.getElementById("games-jsonld");
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "games-jsonld";
      document.head.appendChild(ld);
      ld.textContent = JSON.stringify(jsonLd(data));
    }
  }

  function renderFeatured(root, data) {
    var games = live(data.games || []).filter(function (g) {
      return g.featured !== false;
    });
    var extras = root.getAttribute("data-games-extra") !== "off";
    var html = games.map(miniHtml).join("");
    if (extras) {
      html += '<div class="mini"><h3><a href="/games/">All games</a></h3><p>' +
        games.length + " live titles. New games appear in the arcade first.</p></div>";
    }
    root.innerHTML = html;
  }

  function bestJson(urls, pick) {
    return Promise.all(urls.map(function (url) {
      return fetch(url, { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    })).then(function (all) {
      var best = null, n = -1;
      all.forEach(function (j) {
        var rows = pick(j);
        if (rows.length > n) {
          n = rows.length;
          best = j;
        }
      });
      return best;
    });
  }

  function lsJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; }
  }

  function fmtMs(ms) {
    if (ms == null || !isFinite(ms)) return "—";
    var s = ms / 1000, m = Math.floor(s / 60), r = s - m * 60;
    return m + ":" + r.toFixed(3).padStart(6, "0");
  }

  function vsPar(n) {
    if (n == null || n === 0) return "E";
    return n > 0 ? "+" + n : String(n);
  }

  function dollars(c) {
    var n = Number(c);
    if (!isFinite(n)) return "—";
    return (n / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  function paintHall(id, meta, rows) {
    var root = document.querySelector('[data-hall="' + id + '"]');
    if (!root) return;
    var metaEl = root.querySelector(".hall-meta");
    var list = root.querySelector(".hall-rows");
    if (metaEl) metaEl.textContent = meta;
    if (!list) return;
    if (!rows || !rows.length) {
      list.innerHTML = "";
      return;
    }
    list.innerHTML = rows.map(function (r) {
      return "<li><b>" + esc(r.score) + "</b><span>" + esc(r.name) + "</span><em>" + esc(r.meta || "") + "</em></li>";
    }).join("");
  }

  function bookRows(book) {
    if (!book) return [];
    if (Array.isArray(book.rows)) return book.rows;
    if (book.key && Array.isArray(book[book.key])) return book[book.key];
    if (Array.isArray(book.wins)) return book.wins;
    if (Array.isArray(book.cashouts)) return book.cashouts;
    if (Array.isArray(book.rounds)) return book.rounds;
    if (Array.isArray(book.scores)) return book.scores;
    if (Array.isArray(book.ladder)) return book.ladder;
    if (Array.isArray(book.runs)) return book.runs;
    if (Array.isArray(book.lives)) return book.lives;
    if (Array.isArray(book.standings)) return book.standings;
    return [];
  }

  // Fish Tank life rows: {id, name (keeper), fish, species, event "life"|"tank",
  // score (hours lived), hours, tankHours, gen, dna, theme, stage, date, iso}.
  // Missing field -> "" so a thin row never breaks the card.
  function fishField(r, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = r[keys[i]];
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return "";
  }

  function fishNorm(raw) {
    var r = raw || {};
    var event = r.event === "tank" ? "tank" : "life";
    function hours(v) { var n = Number(v); return isFinite(n) && n > 0 ? Math.round(n) : 0; }
    var score = hours(fishField(r, ["score", "hours"]));
    var tankHours = hours(r.tankHours);
    var iso = String(fishField(r, ["iso"]) || "");
    return {
      keeper: fishField(r, ["name"]),
      fish: fishField(r, ["fish"]),
      species: fishField(r, ["species"]),
      event: event,
      tankHours: tankHours,
      // The book's own number ranks: score = hours lived. A whole-tank row with no life score
      // yet falls back to its own age and says "h tank", never "h lived".
      hours: score > 0 ? score : (event === "tank" && tankHours > 0 ? tankHours : 0),
      hoursFrom: score > 0 ? "score" : (event === "tank" && tankHours > 0 ? "tankHours" : ""),
      gen: fishField(r, ["gen"]),
      dna: String(fishField(r, ["dna"]) || ""),
      date: fishField(r, ["date"]) || (iso ? iso.slice(0, 10) : ""),
      /* a life that only exists in this browser must never read as if the book held it */
      local: !!r.local
    };
  }

  var FISH_EMPTY = "No lives inscribed yet — the first keeper to inscribe a long life owns the hall.";
  // bestJson resolves null only when no feed answered at all, so an unreachable book never
  // masquerades as an empty one.
  var FISH_OFFLINE = "The life book did not answer — retrying shortly.";

  // Longest life first: rows the book scored (hours lived) outrank a whole-tank row that has
  // posted no life score yet, and tanks rank among themselves by tank age. Same order as the
  // Fish Tank hall page, so the card and the hall never disagree.
  function fishRanked(list) {
    return (list || []).map(fishNorm)
      .filter(function (r) { return r.hours > 0 || r.fish || r.keeper; })
      .sort(function (a, b) {
        return (b.hoursFrom === "score" ? 1 : 0) - (a.hoursFrom === "score" ? 1 : 0) ||
          b.hours - a.hours ||
          String(b.date).localeCompare(String(a.date));
      });
  }

  function fishCardRows(list) {
    return (list || []).slice(0, 6).map(function (r) {
      return { name: r.fish || r.keeper || "Unnamed fish", score: fishScore(r), meta: fishMeta(r) };
    });
  }

  function fishScore(r) {
    if (!r.hours) return "—";
    return r.hours.toLocaleString("en-US") + (r.hoursFrom === "tankHours" ? "h tank" : "h");
  }

  function fishMeta(r) {
    return [
      r.keeper ? "kept by " + r.keeper : "",
      r.species,
      r.gen ? "gen " + r.gen : "",
      r.dna ? r.dna.slice(0, 8) + (r.dna.length > 8 ? "…" : "") : "",
      // when the tank's own age is already the ranking number, do not say it twice
      r.event === "tank" ? (r.hoursFrom === "tankHours" ? "whole tank" : (r.tankHours ? "tank " + r.tankHours + "h" : "tank age")) : "",
      r.local ? "unsynced · this browser" : "",
      r.date
    ].filter(Boolean).join(" · ");
  }

  var fishLoadingShown = false;

  var FISH_FEEDS = [
    "https://deepseekoracle-lattice-marines-ledger.hf.space/fish/ledger.json",
    "https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins/resolve/main/fish/ledger.json",
    "/games/fish-tank/ledger.json"
  ];

  function fishOnly() {
    bestJson(FISH_FEEDS, function (j) {
      return (j && j.lives) || [];
    }).then(function (data) {
      var rows = fishRanked((data && data.lives) || []);
      paintHall(
        "fish",
        rows.length
          ? (rows.length + (rows.length === 1 ? " life" : " lives") + " · longest first · life book")
          : (data ? FISH_EMPTY : FISH_OFFLINE),
        fishCardRows(rows)
      );
    });
  }

  function renderHalls() {
    if (!fishLoadingShown) {
      fishLoadingShown = true;
      var froot = document.querySelector('[data-hall="fish"]');
      var fmeta = froot && froot.querySelector(".hall-meta");
      var flist = froot && froot.querySelector(".hall-rows");
      if (fmeta && (!flist || !flist.children.length)) fmeta.textContent = "Reading the life book…";
    }
    bestJson([
      "https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins/resolve/main/arcade.json",
      "https://deepseekoracle-lattice-marines-ledger.hf.space/arcade.json",
      "/games/arcade.json"
    ], function (j) {
      return (j && j.books) ? Object.keys(j.books) : [];
    }).then(function (arcade) {
      if (arcade && arcade.books) {
        paintArcadeBooks(arcade);
        return;
      }
      // No arcade book at all: the fish card still reads its own life book.
      fishOnly();
      renderHallsLegacy();
    });
  }

  function paintArcadeBooks(arcade) {
    var books = arcade.books || {};
    var stamp = arcade.updated ? ("board " + arcade.updated + " · ") : "live board · ";
    var el = document.querySelector("[data-board-stamp]");
    if (el) el.textContent = stamp + Object.keys(books).length + " titles";

    var wins = bookRows(books["lattice-marines"]).concat(lsJson("lygo_lattice_marines_ledger_q") || []);
    paintHall("marines", wins.length ? (stamp + wins.length + " AI wins") : "No inscribed AI wins yet.", wins.slice(0, 12).map(function (w) {
      return { name: w.name || "Commander", score: w.score != null ? String(w.score) : "—", meta: [w.diff, w.mapN ? w.mapN + "×" + w.mapN : "", w.date || ""].filter(Boolean).join(" · ") };
    }));

    var cash = bookRows(books["stock-market-masters"]).concat(lsJson("smm-queue") || []);
    cash.sort(function (a, b) { return (b.worth || 0) - (a.worth || 0); });
    paintHall("smm", cash.length ? (stamp + cash.length + " cashouts") : "No cashouts yet.", cash.slice(0, 12).map(function (x) {
      return { name: x.name || "Desk", score: dollars(x.worth), meta: [x.rounds != null ? x.rounds + " rounds" : "", x.date || ""].filter(Boolean).join(" · ") };
    }));

    var rally = bookRows(books["haven-rally"]).concat(lsJson("lygo-haven-rally-ledger-q") || []);
    var arcadeRows = rally.filter(function (r) { return r.event === "arcade" || r.score; }).sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
    var heats = rally.filter(function (r) { return r.event !== "arcade" && !r.score; }).sort(function (a, b) { return (a.ms || 1e12) - (b.ms || 1e12); });
    var show = arcadeRows.slice(0, 6).map(function (r) {
      return { name: r.name || "Operator", score: (r.score || 0) + " pts", meta: [r.track, r.craft].filter(Boolean).join(" · ") };
    }).concat(heats.slice(0, 6).map(function (r) {
      return { name: r.name || "Operator", score: fmtMs(r.ms), meta: [r.track, r.craft].filter(Boolean).join(" · ") };
    }));
    paintHall("rally", show.length ? (stamp + rally.length + " lines") : "No heats yet.", show.slice(0, 12));

    var golf = bookRows(books["lattice-golf"]).concat(lsJson("lygo-lattice-golf-ledger-q") || []);
    golf.sort(function (a, b) { return (a.vsPar == null ? 99 : a.vsPar) - (b.vsPar == null ? 99 : b.vsPar); });
    paintHall("golf", golf.length ? (stamp + golf.length + " rounds") : "No rounds yet.", golf.slice(0, 12).map(function (r) {
      return { name: r.name || "Operator", score: (r.total != null ? r.total : "—") + " · " + vsPar(r.vsPar), meta: [r.course || r.mode, r.holes ? r.holes + " holes" : ""].filter(Boolean).join(" · ") };
    }));

    var swarm = bookRows(books["lattice-swarm"]).concat(lsJson("lygo-swarm-ledger-q") || []);
    swarm = swarm.filter(function (r) { return (r.score || 0) > 0; }).sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
    paintHall("swarm", swarm.length ? (stamp + swarm.length + " scores") : "No scores yet.", swarm.slice(0, 12).map(function (r) {
      return { name: r.name || "Operator", score: String(r.score), meta: r.date || "" };
    }));

    var etern = bookRows(books["eternal-lattice"]).concat(lsJson("lygo-eternal-ledger-q") || []);
    etern = etern.filter(function (r) { return !!r.name; }).sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
    paintHall("eternal", etern.length ? (stamp + etern.length + " sealed names") : "No sealed names yet.", etern.slice(0, 12).map(function (r) {
      return { name: r.name, score: String(r.rating || 1000) + " rt", meta: (r.wins || 0) + "W / " + (r.losses || 0) + "L" };
    }));

    var crypt = bookRows(books["lattice-crypt"]).concat(lsJson("lygo-lattice-crypt-ledger-q") || []);
    crypt = crypt.filter(function (r) { return (r.score || 0) > 0; }).sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
    paintHall("crypt", crypt.length ? (stamp + crypt.length + " runs") : "No crypt runs yet.", crypt.slice(0, 12).map(function (r) {
      return { name: r.name || "Warden", score: String(r.score), meta: cryptLine(r) };
    }));

    var arenaSeen = {};
    var arena = bookRows(books["lattice-arena"]).concat(lsJson("lygo-lattice-arena-ledger-q") || []);
    arena.sort(function (a, b) { return (b.wins || 0) - (a.wins || 0) || (a.losses || 0) - (b.losses || 0); });
    arena = arena.filter(function (r) {
      var k = (r.name || "") + "|" + (r.mode || "") + "|" + (r.teamKey || r.team || "");
      if (!k || arenaSeen[k]) return false;
      arenaSeen[k] = true;
      return !!(r.name || r.team);
    });
    var fsRows = bookRows(books["forgesmoke"]).concat(lsJson("lygo-forgesmoke-ledger-q") || []);
    fsRows.sort(function (a, b) { return (Number(b.level) || 0) - (Number(a.level) || 0); });
    paintHall("forgesmoke", fsRows.length ? (stamp + fsRows.length + " cyborgs") : "No cyborgs inscribed yet.", fsRows.slice(0, 12).map(function (r) {
      var ms = Number(r.ms) || 0, m = Math.floor(ms / 60000), sec = Math.floor((ms % 60000) / 1000);
      return {
        name: r.name || "Operator",
        score: "LV " + (Number(r.level) || 1),
        meta: [(ms ? m + ":" + String(sec).padStart(2, "0") : "—"), r.mode || "auto"].join(" · ")
      };
    }));

    paintHall("arena", arena.length ? (stamp + arena.length + " lineups") : "No named lineups yet.", arena.slice(0, 12).map(function (r) {
      var wins = r.wins != null ? r.wins : (r.outcome === "win" ? (r.score || 1) : 0);
      var losses = r.losses != null ? r.losses : (r.outcome === "loss" ? 1 : 0);
      return { name: r.name || "Spectator", score: wins + "W / " + losses + "L", meta: [r.mode, r.team].filter(Boolean).join(" · ") };
    }));

    /* the book first, then this browser's own unsynced lives: the outbox, and the tank's
       own cemetery. They are shown because a keeper wants to see them, but every row that
       is not in the book is tagged unsynced so the public board never overstates itself. */
    var fish = bookRows(books["fish-tank"]).concat((lsJson("lygo-fish-tank-ledger-q") || []).map(function (r) {
      r.local = true; return r;
    }));
    try {
      var tank = JSON.parse(localStorage.getItem("lygo_fish_tank_v1") || "{}");
      if (tank.cemetery) fish = fish.concat(tank.cemetery.map(function (r) { r.local = true; return r; }));
    } catch (e) {}
    if (tank && tank.openedAt) {
      var lead = (tank.fish || []).slice().sort(function (a, b) { return (a.born || 0) - (b.born || 0); })[0];
      fish.push({
        local: true,
        name: tank.owner || "Keeper",
        event: "tank",
        tankHours: Math.round((Date.now() - tank.openedAt) / 3600000),
        score: lead && lead.born ? Math.round((Date.now() - lead.born) / 3600000) : 0,
        species: lead ? lead.species : "",
        theme: ({ river: "River garden", coral: "Coral shelf", bog: "Blackwater" })[tank.theme] || tank.theme || "River garden",
        stage: "living",
        fish: lead ? lead.name : ""
      });
    }
    var seenFish = {};
    fish = fishRanked(fish).filter(function (r) {
      var k = [r.fish, r.keeper, r.hours, r.date, r.event].join("|");
      if (seenFish[k]) return false;
      seenFish[k] = 1;
      return true;
    });
    var fishPublic = fish.filter(function (r) { return !r.local; }).length;
    var fishLocal = fish.length - fishPublic;
    paintHall(
      "fish",
      fish.length
        ? (stamp + fishPublic + (fishPublic === 1 ? " life" : " lives") + " in the book" +
          (fishLocal ? " · " + fishLocal + " unsynced here" : "") + " · longest first")
        : FISH_EMPTY,
      fishCardRows(fish)
    );
  }

  function cryptLine(r) {
    var mode = r.mode === "survive" ? "Survive" : r.mode === "endless" ? "Endless" : r.mode === "campaign" ? "Campaign" : (r.mark || "");
    var fw = r.floor != null ? ((r.mode === "survive" || r.mark === "wave") ? "wave " + r.floor : "floor " + r.floor) : "";
    return [mode, fw, r.date || ""].filter(Boolean).join(" · ");
  }

  function renderHallsLegacy() {
    bestJson([
      "https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins/resolve/main/ledger.json",
      "https://deepseekoracle-lattice-marines-ledger.hf.space/ledger.json",
      "/games/lattice-marines/ledger.json"
    ], function (j) { return (j && j.wins) || []; }).then(function (data) {
      var wins = (data && data.wins) || [];
      var q = lsJson("lygo_lattice_marines_ledger_q") || [];
      var seen = {};
      var mix = wins.concat(q).filter(function (w) {
        var k = (w.name || "") + "|" + (w.score || "") + "|" + (w.date || "") + "|" + (w.seed || "");
        if (seen[k]) return false;
        seen[k] = 1;
        return true;
      });
      paintHall(
        "marines",
        mix.length ? (mix.length + " AI wins · public book") : "No inscribed AI wins yet.",
        mix.slice(0, 12).map(function (w) {
          return {
            name: w.name || "Commander",
            score: w.score != null ? String(w.score) : "—",
            meta: [w.diff, w.mapN ? w.mapN + "×" + w.mapN : "", w.date || ""].filter(Boolean).join(" · ")
          };
        })
      );
    });

    bestJson([
      "/games/stock-market-masters/ledger.json",
      "https://huggingface.co/datasets/DeepSeekOracle/stock-market-masters-cashouts/resolve/main/ledger.json",
      "https://deepseekoracle-lattice-marines-ledger.hf.space/smm/ledger.json"
    ], function (j) { return (j && (j.cashouts || j.wins)) || []; }).then(function (data) {
      var rows = ((data && (data.cashouts || data.wins)) || []).slice();
      var q = lsJson("smm-queue") || [];
      var seen = {};
      rows.concat(q).forEach(function (x) {
        var k = (x.name || "") + "|" + (x.worth || 0) + "|" + (x.date || "");
        seen[k] = x;
      });
      var list = Object.keys(seen).map(function (k) { return seen[k]; })
        .sort(function (a, b) { return (b.worth || 0) - (a.worth || 0); });
      paintHall(
        "smm",
        list.length ? (list.length + " cashouts · public book") : "No cashouts yet.",
        list.slice(0, 12).map(function (x) {
          return {
            name: x.name || "Desk",
            score: dollars(x.worth),
            meta: [x.rounds != null ? x.rounds + " rounds" : "", x.date || ""].filter(Boolean).join(" · ")
          };
        })
      );
    });

    bestJson([
      "https://deepseekoracle-lattice-marines-ledger.hf.space/rally/ledger.json",
      "https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins/resolve/main/haven-rally.json",
      "/games/haven-rally/ledger.json"
    ], function (j) { return (j && j.rows) || []; }).then(function (data) {
      var rows = ((data && data.rows) || []).slice();
      var q = lsJson("lygo-haven-rally-ledger-q") || [];
      var local = lsJson("lygo-haven-rally-v1") || {};
      rows = rows.concat(q).concat(local.rounds || []).concat((local.arcade && local.arcade.runs) || []);
      var seen = {};
      rows = rows.filter(function (r) {
        var k = (r.name || "") + "|" + (r.event || "") + "|" + (r.score || 0) + "|" + (r.ms || 0) + "|" + (r.track || "");
        if (seen[k]) return false;
        seen[k] = 1;
        return true;
      });
      var arcade = rows.filter(function (r) { return r.event === "arcade" || r.score; })
        .sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
      var heats = rows.filter(function (r) { return r.event !== "arcade" && !r.score; })
        .sort(function (a, b) { return (a.ms || 1e12) - (b.ms || 1e12); });
      var show = arcade.slice(0, 6).map(function (r) {
        return { name: r.name || "Operator", score: (r.score || 0) + " pts", meta: [r.track, r.craft].filter(Boolean).join(" · ") };
      }).concat(heats.slice(0, 6).map(function (r) {
        return { name: r.name || "Operator", score: fmtMs(r.ms), meta: [r.track, r.craft].filter(Boolean).join(" · ") };
      }));
      paintHall(
        "rally",
        show.length ? (rows.length + " lines · public book") : "No heats yet.",
        show.slice(0, 12)
      );
    });

    bestJson([
      "https://deepseekoracle-lattice-marines-ledger.hf.space/golf/ledger.json",
      "https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins/resolve/main/lattice-golf.json",
      "/games/lattice-golf/ledger.json"
    ], function (j) { return (j && j.rounds) || []; }).then(function (data) {
      var rows = ((data && data.rounds) || []).slice();
      var q = lsJson("lygo-lattice-golf-ledger-q") || [];
      var local = lsJson("lygo-lattice-golf-v1") || {};
      rows = rows.concat(q).concat(local.rounds || []);
      var seen = {};
      rows = rows.filter(function (r) {
        var k = (r.name || "") + "|" + (r.total || "") + "|" + (r.vsPar || "") + "|" + (r.course || "");
        if (seen[k]) return false;
        seen[k] = 1;
        return true;
      }).sort(function (a, b) {
        return (a.vsPar == null ? 99 : a.vsPar) - (b.vsPar == null ? 99 : b.vsPar);
      });
      paintHall(
        "golf",
        rows.length ? (rows.length + " rounds · public book") : "No rounds yet.",
        rows.slice(0, 12).map(function (r) {
          return {
            name: r.name || "Operator",
            score: (r.total != null ? r.total : "—") + " · " + vsPar(r.vsPar),
            meta: [r.course || r.mode, r.holes ? r.holes + " holes" : ""].filter(Boolean).join(" · ")
          };
        })
      );
    });

    bestJson([
      "https://deepseekoracle-lattice-marines-ledger.hf.space/swarm/ledger.json",
      "https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins/resolve/main/lattice-swarm.json",
      "/games/lattice-swarm/ledger.json"
    ], function (j) { return (j && j.scores) || []; }).then(function (data) {
      var rows = ((data && data.scores) || []).slice();
      var q = lsJson("lygo-swarm-ledger-q") || [];
      var local = lsJson("lattice-swarm-v1") || {};
      if (local.bestScore) rows.push({ name: "This browser", score: local.bestScore });
      rows = rows.concat(q);
      var seen = {};
      rows = rows.filter(function (r) {
        var k = (r.name || "") + "|" + (r.score || 0);
        if (seen[k] || !(r.score > 0)) return false;
        seen[k] = 1;
        return true;
      }).sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
      paintHall(
        "swarm",
        rows.length ? (rows.length + " scores · public book") : "No scores yet.",
        rows.slice(0, 12).map(function (r) {
          return { name: r.name || "Operator", score: String(r.score), meta: r.date || "" };
        })
      );
    });

    bestJson([
      "https://deepseekoracle-lattice-marines-ledger.hf.space/eternal/ledger.json",
      "https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins/resolve/main/eternal-lattice.json",
      "/games/eternal-lattice/ledger.json"
    ], function (j) { return (j && j.ladder) || []; }).then(function (data) {
      var rows = ((data && data.ladder) || []).slice();
      var q = lsJson("lygo-eternal-ledger-q") || [];
      var local = lsJson("lygo-eternal-lattice-v1") || {};
      rows = rows.concat(q).concat(local.leaderboard || []);
      if (local.playerName && local.games) {
        rows.push({ name: local.playerName, rating: local.rating, wins: local.wins, losses: local.losses });
      }
      var seen = {};
      rows = rows.filter(function (r) {
        var k = (r.name || "") + "|" + (r.rating || 0) + "|" + (r.wins || 0);
        if (!r.name || seen[k]) return false;
        seen[k] = 1;
        return true;
      }).sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
      paintHall(
        "eternal",
        rows.length ? (rows.length + " sealed names · public book") : "No sealed names yet.",
        rows.slice(0, 12).map(function (r) {
          return {
            name: r.name,
            score: String(r.rating || 1000) + " rt",
            meta: (r.wins || 0) + "W / " + (r.losses || 0) + "L"
          };
        })
      );
    });

    bestJson([
      "https://deepseekoracle-lattice-marines-ledger.hf.space/crypt/ledger.json",
      "https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins/resolve/main/arcade.json",
      "/games/lattice-crypt/ledger.json"
    ], function (j) {
      if (!j) return [];
      if (Array.isArray(j.runs)) return j.runs;
      if (Array.isArray(j.rounds)) return j.rounds;
      if (j.books && j.books["lattice-crypt"]) return bookRows(j.books["lattice-crypt"]);
      return [];
    }).then(function (data) {
      var rows = [];
      if (data) {
        if (Array.isArray(data.runs)) rows = data.runs.slice();
        else if (Array.isArray(data.rounds)) rows = data.rounds.slice();
        else if (data.books && data.books["lattice-crypt"]) rows = bookRows(data.books["lattice-crypt"]).slice();
      }
      var q = lsJson("lygo-lattice-crypt-ledger-q") || [];
      rows = rows.concat(q).filter(function (r) { return (r.score || 0) > 0; });
      var seen = {};
      rows = rows.filter(function (r) {
        var k = (r.name || "") + "|" + (r.score || 0) + "|" + (r.floor || "") + "|" + (r.date || "");
        if (seen[k]) return false;
        seen[k] = 1;
        return true;
      }).sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
      paintHall(
        "crypt",
        rows.length ? (rows.length + " runs · public book") : "No crypt runs yet.",
        rows.slice(0, 12).map(function (r) {
          return { name: r.name || "Warden", score: String(r.score), meta: cryptLine(r) };
        })
      );
    });
  }

  function bootPortalFx() {
    var c = document.getElementById("portalCanvas");
    if (!c || !c.getContext) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var ctx = c.getContext("2d");
    var pts = [];
    var i, w, h, dpr;
    function resize() {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = c.clientWidth || window.innerWidth;
      h = c.clientHeight || window.innerHeight;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn() {
      pts = [];
      for (i = 0; i < 48; i++) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          v: 0.15 + Math.random() * 0.45,
          r: 0.6 + Math.random() * 1.8,
          a: 0.12 + Math.random() * 0.28,
          gold: Math.random() < 0.28
        });
      }
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.y -= p.v;
        if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
        ctx.beginPath();
        ctx.fillStyle = p.gold ? "rgba(251,191,36," + p.a + ")" : "rgba(94,234,212," + p.a + ")";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    resize();
    spawn();
    window.addEventListener("resize", function () { resize(); spawn(); });
    requestAnimationFrame(tick);
  }

  function boot() {
    bootPortalFx();
    fetch(CATALOG, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (data) {
        document.querySelectorAll("[data-games-catalog]").forEach(function (n) {
          renderArcade(n, data);
        });
        document.querySelectorAll("[data-games-featured]").forEach(function (n) {
          renderFeatured(n, data);
        });
        if (document.querySelector("[data-games-halls]")) renderHalls();
      })
      .catch(function () {
        if (document.querySelector("[data-games-halls]")) renderHalls();
      });
    if (document.querySelector("[data-live-board]")) {
      setInterval(function () { renderHalls(); }, 40000);
    }
    if (window.ArcadeLedger) ArcadeLedger.boot();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
