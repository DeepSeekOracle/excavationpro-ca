/* LYGO portal — the one-time entrance.
   The portal is free and ads pay for it, so this file does one job: the intro that covers the page on a
   first visit — LYGO-branded matrix, the terms of the page, and one deliberate click to enter (the click
   also marks the intro as seen for this browser). There is no code, no unlock and no reminder timer any
   more; the monthly-code gate was retired when the domain moved to AdSense. */
(function (g) {
  "use strict";

  var INTRO_STORE = "lygo_portal_intro";
  var INTRO_VERSION = "2026-10-18";        // bump to show the entrance again after a real redesign

  var introEl = null;
  var lastFocus = null;
  var rains = {};              // one backdrop per layer that wants one, keyed by canvas id

  function el(id) { return document.getElementById(id); }
  function store(key) { try { return g.localStorage.getItem(key); } catch (_) { return null; } }
  function save(key, value) { try { g.localStorage.setItem(key, String(value)); } catch (_) {} }

  /* ---- the entrance ------------------------------------------------------------ */

  function introDue() {
    var skip = /[?&]intro=(0|off|skip)\b/.test(location.search);
    if (skip) return false;
    return store(INTRO_STORE) !== INTRO_VERSION;
  }

  function introSeen() { save(INTRO_STORE, INTRO_VERSION); }

  function reducedMotion() {
    return !!(g.matchMedia && g.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function startRain(canvasId) {
    var canvas = el(canvasId);
    if (!canvas || rains[canvasId]) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var GLYPHS = "Δ9Φ963ΛΞΣΩ01⊹⟡✕⌘アカサタナハマヤラワ";
    var size = 16;
    var drops = [];
    var raf = 0, last = 0, still = reducedMotion();

    function resize() {
      canvas.width = canvas.clientWidth * Math.min(g.devicePixelRatio || 1, 2);
      canvas.height = canvas.clientHeight * Math.min(g.devicePixelRatio || 1, 2);
      var cols = Math.ceil(canvas.width / size);
      drops = [];
      for (var i = 0; i < cols; i++) drops.push({ y: Math.random() * canvas.height, sp: 0.6 + Math.random() * 1.8 });
      if (still) draw(true);                    // the still backdrop survives a resize or a rotation
    }

    function draw(advance) {
      ctx.fillStyle = "rgba(6, 5, 4, 0.16)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = size + "px 'IBM Plex Mono', monospace";
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        var ch = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        var head = Math.random() < 0.06;
        ctx.fillStyle = head ? "rgba(240, 226, 190, 0.95)" : "rgba(224, 179, 106, " + (0.28 + Math.random() * 0.5) + ")";
        ctx.fillText(ch, i * size, d.y);
        if (advance) {
          d.y += d.sp * size * 0.6;
          if (d.y > canvas.height + size) { d.y = -size * (1 + Math.random() * 12); d.sp = 0.6 + Math.random() * 1.8; }
        }
      }
    }

    function frame(t) {
      raf = g.requestAnimationFrame(frame);
      if (t - last < 55) return;                // ~18 fps: readable, and cheap on a phone
      last = t;
      draw(true);
    }

    resize();
    g.addEventListener("resize", resize);
    if (still) {                                // no animation to run: the frame above is the entrance
      rains[canvasId] = { stop: function () {}, still: true };
      return;
    }
    rains[canvasId] = { stop: function () { if (raf) g.cancelAnimationFrame(raf); raf = 0; } };
    raf = g.requestAnimationFrame(frame);
  }

  function stopRain(canvasId) {
    if (rains[canvasId]) { rains[canvasId].stop(); delete rains[canvasId]; }
  }

  var LINES = [
    "> Δ9Φ963 // LYGO LATTICE · PUBLIC GATE",
    "> handshake ......... ok",
    "> kernel eggs ....... sealed (consent required)",
    "> visitor key ....... stays in this tab, never sent to chatagent.ca",
    "> P0 gate ........... armed",
    "> you are clear to enter."
  ];

  function typeLines(done) {
    var box = el("introTerm");
    if (!box) { done(); return; }
    box.textContent = "";
    if (reducedMotion() || !LINES.length) {
      box.textContent = LINES.join("\n");
      done();
      return;
    }
    var i = 0, j = 0, text = "";
    (function step() {
      if (i >= LINES.length) { done(); return; }
      text = LINES[i].slice(0, ++j);
      box.textContent = LINES.slice(0, i).join("\n") + (i ? "\n" : "") + text;
      if (j >= LINES[i].length) { i++; j = 0; g.setTimeout(step, 190); }
      else { g.setTimeout(step, 16); }
    })();
  }

  function openIntro() {
    if (!introEl) return;
    lastFocus = document.activeElement;
    introEl.hidden = false;
    introEl.classList.add("is-open");
    document.documentElement.classList.add("sup-modal");
    startRain("introCanvas");
    var cta = el("introEnter");
    if (cta) { cta.disabled = true; cta.textContent = "Entering…"; }
    typeLines(function () {
      if (cta) { cta.disabled = false; cta.textContent = "Enter the portal →"; cta.focus(); }
    });
  }

  function closeIntro() {
    if (!introEl) return;
    introSeen();
    introEl.hidden = true;
    introEl.classList.remove("is-open");
    document.documentElement.classList.remove("sup-modal");
    stopRain("introCanvas");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    try { document.dispatchEvent(new CustomEvent("lygo-intro-entered")); } catch (_) {}
  }

  function trapTab(e, root) {
    if (e.key !== "Tab" || !root) return;
    var list = root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])');
    var vis = Array.prototype.filter.call(list, function (n) { return n.offsetParent !== null || n === document.activeElement; });
    if (!vis.length) return;
    var first = vis[0], last = vis[vis.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---- wiring ------------------------------------------------------------------ */

  function boot() {
    introEl = el("introLayer");

    if (introEl && introDue()) openIntro();
    else if (introEl) { introEl.hidden = true; introEl.classList.remove("is-open"); }

    var enter = el("introEnter");
    if (enter) enter.addEventListener("click", closeIntro);

    var guide = el("introGuide");
    if (guide) guide.addEventListener("click", closeIntro);

    document.addEventListener("keydown", function (e) {
      if (introEl && !introEl.hidden) {
        if (e.key === "Escape") { e.preventDefault(); closeIntro(); return; }
        trapTab(e, introEl);
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
