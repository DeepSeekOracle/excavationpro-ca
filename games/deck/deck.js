/* Arcade Deck — chatagent.ca/games/deck/
   Progressive enhancement over server-rendered cards:
   hero preview, category filter, search, keyboard + gamepad nav, theater modal,
   and a live reconcile against /games/catalog.json (the site's source of truth). */
(function () {
  "use strict";

  var SOUND_KEY = "lygo_deck_sound";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- data island ---------- */
  var dataEl = $("deck-data");
  var CATALOG = [];
  try {
    CATALOG = JSON.parse(dataEl ? dataEl.textContent : "[]");
  } catch (e) {
    CATALOG = [];
  }
  if (!Array.isArray(CATALOG)) CATALOG = [];

  var INDEX_OF = {};
  CATALOG.forEach(function (g, i) { INDEX_OF[g.id] = i; });

  var currentIndex = 0;
  var activeFilter = "all";
  var searchQuery = "";

  var stage = $("ambient-stage");
  var heroBg = $("hero-bg");
  var heroTitle = $("hero-title");
  var heroDesc = $("hero-desc");
  var heroCat = $("hero-cat");
  var heroBtnPlay = $("hero-btn-play");
  var heroBtnExt = $("hero-btn-ext");
  var heroBtnHall = $("hero-btn-hall");
  var gamesGrid = $("games-grid");
  var catalogCounter = $("catalog-counter");
  var searchInput = $("search-input");
  var filterContainer = $("filter-container");
  var pillAll = $("pill-all");
  var navModuleCount = $("nav-module-count");
  var navHallCount = $("nav-hall-count");
  var tabsNote = $("deck-live-note");

  var theaterModal = $("theater-modal");
  var gameIframe = $("game-iframe");
  var modalTitle = $("modal-game-title");
  var modalCat = $("modal-game-cat");
  var modalOpenNew = $("modal-open-new");
  var modalCloseBtn = $("modal-close-btn");
  var btnSound = $("btn-sound");
  var gamepadBadge = $("gamepad-badge");
  var gamepadName = $("gamepad-name");
  var lastFocused = null;

  /* ---------- audio (opt-in, remembered) ---------- */
  var audioEnabled = false;
  try { audioEnabled = window.localStorage.getItem(SOUND_KEY) === "on"; } catch (e) {}
  var audioCtx = null;

  function playTone(freq, type, duration) {
    if (!audioEnabled) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended" && audioCtx.resume) audioCtx.resume();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (duration || 0.08));
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + (duration || 0.08));
    } catch (e) {}
  }

  function paintSoundButton() {
    if (!btnSound) return;
    btnSound.classList.toggle("active", audioEnabled);
    btnSound.setAttribute("aria-pressed", audioEnabled ? "true" : "false");
    btnSound.title = audioEnabled ? "Sound effects: on" : "Sound effects: off";
    var use = btnSound.querySelector("use");
    if (use) use.setAttribute("href", audioEnabled ? "#i-volume" : "#i-volume-x");
  }

  if (btnSound) {
    paintSoundButton();
    btnSound.addEventListener("click", function () {
      audioEnabled = !audioEnabled;
      try { window.localStorage.setItem(SOUND_KEY, audioEnabled ? "on" : "off"); } catch (e) {}
      paintSoundButton();
      if (audioEnabled) playTone(600, "sine", 0.1);
    });
  }

  /* ---------- hero ---------- */
  function cards() {
    return Array.prototype.slice.call(gamesGrid ? gamesGrid.querySelectorAll(".game-card") : []);
  }

  function updateHero(index) {
    var game = CATALOG[index];
    if (!game) return;
    currentIndex = index;

    if (stage) {
      stage.style.background =
        "radial-gradient(circle 800px at 75% 20%, " + (game.glow || "rgba(56,189,248,0.25)") + ", transparent 70%)," +
        "radial-gradient(circle 600px at 20% 80%, rgba(99, 102, 241, 0.12), transparent 60%)," +
        "linear-gradient(180deg, #060810 0%, #030407 100%)";
    }
    if (heroBg) heroBg.style.backgroundImage = "url('" + game.img + "')";
    if (heroTitle) heroTitle.textContent = game.title;
    if (heroCat) heroCat.textContent = game.badge || "";
    if (heroDesc) heroDesc.textContent = game.desc || "";

    if (heroBtnPlay) {
      heroBtnPlay.onclick = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        launchTheater(game);
      };
      heroBtnPlay.setAttribute("aria-label", "Play " + game.title + " in the deck theater");
    }
    if (heroBtnExt) heroBtnExt.href = game.url;

    if (heroBtnHall) {
      if (game.ledger) {
        heroBtnHall.style.display = "inline-flex";
        heroBtnHall.href = game.ledger;
      } else {
        heroBtnHall.style.display = "none";
        heroBtnHall.removeAttribute("href");
      }
    }

    cards().forEach(function (c) {
      c.classList.toggle("active-preview", Number(c.dataset.index) === index);
    });
  }

  /* ---------- theater ---------- */
  function launchTheater(game) {
    if (!game) return;
    playTone(520, "triangle", 0.15);
    lastFocused = document.activeElement;
    if (modalTitle) modalTitle.textContent = game.title;
    if (modalCat) modalCat.textContent = game.badge || "";
    if (modalOpenNew) modalOpenNew.href = game.url;
    if (gameIframe) gameIframe.src = game.url;
    if (theaterModal) {
      theaterModal.classList.add("active");
      theaterModal.setAttribute("aria-hidden", "false");
    }
    document.body.style.overflow = "hidden";
    if (modalCloseBtn) modalCloseBtn.focus();
  }

  function closeTheater() {
    if (!theaterModal) return;
    theaterModal.classList.remove("active");
    theaterModal.setAttribute("aria-hidden", "true");
    if (gameIframe) gameIframe.src = "about:blank";
    document.body.style.overflow = "";
    playTone(280, "sine", 0.1);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    lastFocused = null;
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeTheater);
  if (theaterModal) {
    theaterModal.addEventListener("click", function (e) {
      if (e.target === theaterModal) closeTheater();
    });
  }

  /* ---------- filtering ---------- */
  function visibleCards() {
    return cards().filter(function (c) { return !c.hidden; });
  }

  function applyFilter() {
    var q = searchQuery.trim().toLowerCase();
    var shown = 0;
    cards().forEach(function (card) {
      var g = CATALOG[Number(card.dataset.index)];
      if (!g) { card.hidden = true; return; }
      var catOk = activeFilter === "all" || g.cat === activeFilter;
      var text = (g.title + " " + g.desc + " " + (g.badge || "") + " " + (g.tech || "")).toLowerCase();
      var searchOk = !q || text.indexOf(q) !== -1;
      var ok = catOk && searchOk;
      card.hidden = !ok;
      if (ok) shown++;
    });

    if (catalogCounter) catalogCounter.textContent = shown + (shown === 1 ? " TITLE" : " TITLES");

    var empty = $("grid-empty");
    if (empty) empty.hidden = shown !== 0;

    var visible = visibleCards();
    if (visible.length && !visible.some(function (c) { return Number(c.dataset.index) === currentIndex; })) {
      updateHero(Number(visible[0].dataset.index));
    }
  }

  if (filterContainer) {
    filterContainer.addEventListener("click", function (e) {
      var pill = e.target.closest(".pill");
      if (!pill) return;
      filterContainer.querySelectorAll(".pill").forEach(function (p) {
        p.classList.remove("active");
        p.setAttribute("aria-pressed", "false");
      });
      pill.classList.add("active");
      pill.setAttribute("aria-pressed", "true");
      activeFilter = pill.dataset.cat || "all";
      playTone(360, "sine", 0.05);
      applyFilter();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      searchQuery = e.target.value || "";
      applyFilter();
    });
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        searchInput.value = "";
        searchQuery = "";
        applyFilter();
        searchInput.blur();
      }
    });
  }

  /* ---------- card interaction (delegated) ---------- */
  if (gamesGrid) {
    gamesGrid.addEventListener("mouseover", function (e) {
      var card = e.target.closest(".game-card");
      if (!card || !gamesGrid.contains(card)) return;
      var index = Number(card.dataset.index);
      if (index === currentIndex) return;
      playTone(440, "sine", 0.04);
      updateHero(index);
    });

    gamesGrid.addEventListener("click", function (e) {
      var hall = e.target.closest(".card-btn-hall");
      if (hall) return; /* real link, let it through */
      var card = e.target.closest(".game-card");
      if (!card) return;
      var game = CATALOG[Number(card.dataset.index)];
      if (!game) return;
      /* the title and play links stay real links: honour ctrl/meta/middle clicks */
      var link = e.target.closest("a");
      if (link && (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0)) return;
      e.preventDefault();
      launchTheater(game);
    });

    /* keyboard: cards are buttons in spirit */
    gamesGrid.addEventListener("keydown", function (e) {
      var card = e.target.closest(".game-card");
      if (!card) return;
      if (e.key === "Enter" || e.key === " ") {
        if (e.target.closest("a")) return;
        e.preventDefault();
        launchTheater(CATALOG[Number(card.dataset.index)]);
      }
    });

    if (!reduceMotion) {
      gamesGrid.addEventListener("mousemove", function (e) {
        var card = e.target.closest(".game-card");
        if (!card) return;
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var rotX = -((y - rect.height / 2) / 16);
        var rotY = (x - rect.width / 2) / 16;
        card.style.transform =
          "perspective(800px) rotateX(" + rotX + "deg) rotateY(" + rotY + "deg) translateY(-4px)";
      });
      gamesGrid.addEventListener("mouseout", function (e) {
        var card = e.target.closest(".game-card");
        if (!card || card.contains(e.relatedTarget)) return;
        card.style.transform = "";
      });
    }
  }

  /* ---------- keyboard ---------- */
  function navigateFiltered(direction) {
    var visible = visibleCards();
    if (!visible.length) return;
    var pos = visible.findIndex(function (c) { return Number(c.dataset.index) === currentIndex; });
    if (pos === -1) pos = 0;
    var next = pos + direction;
    if (next >= visible.length) next = 0;
    if (next < 0) next = visible.length - 1;
    var card = visible[next];
    updateHero(Number(card.dataset.index));
    playTone(320, "sine", 0.05);
    card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }

  window.addEventListener("keydown", function (e) {
    if (theaterModal && theaterModal.classList.contains("active")) {
      if (e.key === "Escape") { e.preventDefault(); closeTheater(); }
      return;
    }
    var typing = document.activeElement === searchInput;

    if (e.key === "/" && !typing) {
      e.preventDefault();
      if (searchInput) searchInput.focus();
      return;
    }
    if (typing) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      navigateFiltered(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      navigateFiltered(-1);
    } else if (e.key === "Enter") {
      if (CATALOG[currentIndex]) launchTheater(CATALOG[currentIndex]);
    }
  });

  /* ---------- gamepad ---------- */
  var padLoopStarted = false;
  var lastPadNav = 0;
  var padButtons = {};

  function pollGamepad() {
    var pads = [];
    try {
      pads = navigator.getGamepads ? navigator.getGamepads() : [];
    } catch (e) {
      pads = [];
    }
    var pad = null;
    for (var i = 0; i < pads.length; i++) {
      if (pads[i]) { pad = pads[i]; break; }
    }

    if (pad && gamepadBadge && gamepadName) {
      gamepadBadge.classList.add("active");
      gamepadName.textContent = String(pad.id || "GAMEPAD").slice(0, 16).toUpperCase();
      var now = Date.now();
      var modalOpen = theaterModal && theaterModal.classList.contains("active");

      var left = pad.buttons[14] && pad.buttons[14].pressed;
      var right = pad.buttons[15] && pad.buttons[15].pressed;
      var stickX = pad.axes[0] || 0;

      if (!modalOpen && now - lastPadNav > 240) {
        if (right || stickX > 0.5) { navigateFiltered(1); lastPadNav = now; }
        else if (left || stickX < -0.5) { navigateFiltered(-1); lastPadNav = now; }
      }

      var a = pad.buttons[0] && pad.buttons[0].pressed;
      var b = pad.buttons[1] && pad.buttons[1].pressed;
      if (a && !padButtons.a && !modalOpen && CATALOG[currentIndex]) launchTheater(CATALOG[currentIndex]);
      if (b && !padButtons.b && modalOpen) closeTheater();
      padButtons.a = a;
      padButtons.b = b;
    } else if (gamepadBadge) {
      gamepadBadge.classList.remove("active");
      padButtons = {};
    }

    window.requestAnimationFrame(pollGamepad);
  }

  if (typeof window.requestAnimationFrame === "function") {
    window.addEventListener("gamepadconnected", function () {
      if (!padLoopStarted) { padLoopStarted = true; }
    });
    window.requestAnimationFrame(pollGamepad);
  }

  /* ---------- live ledger ticker ---------- */
  var LEDGER_URL = "https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins/raw/main/arcade.json";

  function renderTicker(entries) {
    var wrap = $("ticker-content");
    if (!wrap || !entries.length) return;
    wrap.textContent = "";
    entries.slice(0, 8).forEach(function (entry) {
      var item = document.createElement("div");
      item.className = "ticker-item";

      var dot = document.createElement("span");
      dot.className = "highlight";
      dot.textContent = entry.game || "Module";
      item.appendChild(dot);
      item.appendChild(document.createTextNode(" · "));

      var name = document.createElement("span");
      name.textContent = entry.name || "Anonymous";
      item.appendChild(name);

      item.appendChild(document.createTextNode(" · " + (entry.score || entry.result || "logged")));
      wrap.appendChild(item);
    });
  }

  function fetchLedger() {
    if (!window.fetch) return;
    fetch(LEDGER_URL, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (Array.isArray(data) && data.length) {
          renderTicker(data);
          if (tabsNote) tabsNote.textContent = "Ticker live from the Hugging Face arcade ledger.";
        }
      })
      .catch(function () { /* offline or blocked: the static ticker stands in */ });
  }

  /* ---------- reconcile with /games/catalog.json ---------- */
  function cardFor(game) {
    var index = INDEX_OF[game.id];
    var found = gamesGrid && gamesGrid.querySelector('.game-card[data-index="' + index + '"]');
    if (found) return found;
    if (!gamesGrid) return null;

    var el = document.createElement("article");
    el.className = "game-card";
    el.dataset.index = String(index);
    el.dataset.cat = game.cat || "action";
    el.innerHTML =
      '<div class="card-thumb-wrap">' +
        '<img class="card-thumb" src="' + esc(game.img) + '" alt="' + esc(game.title) + ' key art" loading="lazy" width="640" height="336">' +
        '<div class="card-badge-row">' +
          '<span class="card-cat-badge">' + esc((game.badge || "").split("·")[0].trim()) + "</span>" +
        "</div>" +
      "</div>" +
      '<div class="card-body">' +
        '<h3 class="card-title"><a href="' + esc(game.url) + '">' + esc(game.title) + "</a></h3>" +
        '<p class="card-desc">' + esc(game.desc) + "</p>" +
        '<div class="card-footer">' +
          '<a class="card-btn-play" href="' + esc(game.url) + '">Play</a>' +
          '<a class="card-btn-hall" href="' + esc(game.ledger) + '">Hall</a>' +
        "</div>" +
      "</div>";
    gamesGrid.appendChild(el);
    return el;
  }

  function reconcile() {
    if (!window.fetch) return;
    fetch("/games/catalog.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !Array.isArray(data.games)) return;
        var liveGames = data.games.filter(function (g) { return g.status === "live" && g.href; });
        var seen = 0;

        liveGames.forEach(function (g) {
          var index = INDEX_OF[g.id];
          if (index === undefined) {
            /* a title added to catalog.json without a rebuild: append it */
            if (!g.title) return;
            var entry = {
              id: g.id,
              title: g.title,
              cat: "action",
              badge: (g.genre && g.genre[0] ? String(g.genre[0]).charAt(0).toUpperCase() + String(g.genre[0]).slice(1) : "Arcade") + " · Live",
              desc: g.blurb || g.tagline || "",
              url: String(g.href),
              ledger: (g.links && g.links[0] && g.links[0].href) ? String(g.links[0].href) : "",
              img: g.cover ? String(g.cover) : SVG_FALLBACK(),
              glow: "rgba(56, 189, 248, 0.3)",
              tech: "Browser · No install"
            };
            INDEX_OF[g.id] = CATALOG.length;
            CATALOG.push(entry);
            cardFor(entry);
            return;
          }
          seen++;

          var game = CATALOG[index];
          var url = String(g.href);
          if (g.title && g.title !== game.title) game.title = g.title;
          if (url !== game.url) game.url = url;
          var ledger = (g.links && g.links[0] && g.links[0].href) ? String(g.links[0].href) : "";
          game.ledger = ledger;
          if (!game.desc && g.blurb) game.desc = g.blurb;

          var card = cardFor(game);
          if (!card) return;
          var titleLink = card.querySelector(".card-title a");
          if (titleLink) { titleLink.href = game.url; titleLink.textContent = game.title; }
          var playLink = card.querySelector(".card-btn-play");
          if (playLink) { playLink.href = game.url; }
          var desc = card.querySelector(".card-desc");
          if (desc && !desc.textContent.trim()) desc.textContent = game.desc;

          var hall = card.querySelector(".card-btn-hall");
          if (ledger && !hall) {
            var footer = card.querySelector(".card-footer");
            if (footer) {
              var a = document.createElement("a");
              a.className = "card-btn-hall";
              a.href = ledger;
              a.textContent = "Hall";
              footer.appendChild(a);
            }
          } else if (hall) {
            if (ledger) hall.href = ledger;
            else hall.remove();
          }
        });

        /* refresh counts from the reconciled set */
        if (navModuleCount) navModuleCount.textContent = String(CATALOG.length);
        if (pillAll) {
          pillAll.textContent = "All Modules (" + CATALOG.length + ")";
          pillAll.dataset.cat = "all";
        }
        var halls = CATALOG.filter(function (g) { return g.ledger; }).length;
        if (navHallCount) navHallCount.textContent = String(halls);
        if (tabsNote) tabsNote.textContent = "Catalog synced: " + seen + " live titles from catalog.json.";
        applyFilter();
      })
      .catch(function () { /* the server-rendered catalog stands in */ });
  }

  function SVG_FALLBACK() {
    return "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">' +
      '<rect width="100%" height="100%" fill="#0b1329"/>' +
      '<line x1="0" y1="0" x2="400" y2="225" stroke="rgba(56,189,248,0.15)" stroke-width="1.5"/>' +
      '<line x1="400" y1="0" x2="0" y2="225" stroke="rgba(56,189,248,0.15)" stroke-width="1.5"/>' +
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#38bdf8" ' +
      'font-family="monospace" font-size="14">[ LATTICE MODULE ]</text></svg>'
    );
  }

  /* ---------- boot ---------- */
  if (pillAll) pillAll.textContent = "All Modules (" + CATALOG.length + ")";
  if (navModuleCount) navModuleCount.textContent = String(CATALOG.length);
  if (navHallCount) navHallCount.textContent = String(CATALOG.filter(function (g) { return g.ledger; }).length);

  var starting = 0;
  for (var i = 0; i < CATALOG.length; i++) {
    if (CATALOG[i].id === "lattice-marines") { starting = i; break; }
  }
  updateHero(starting);
  applyFilter();
  fetchLedger();
  reconcile();
})();
