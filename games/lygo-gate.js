/* LYGO games — the donation gate and the supporter code.
   The same system as the portal, byte-for-byte the same code list and the same check:
     * a donation reminder every ten minutes, pointing at PayPal or at the Patreon post;
     * a Supporter access row at the bottom of the game's menu where a monthly code from that
       Patreon post switches the reminders off in this browser;
     * the unlock is stored under the same key the portal uses (lygo_portal_supporter), so one
       code quiets the whole site — enter it in a game or in the portal, either way.
   What this check is, honestly: the code is verified inside the browser against a SHA-256 in this
   file, so it proves "you were given this month's code" and nothing more. It is a thank-you gate,
   not a licence and not a locked door: every game plays exactly the same without it. It cannot be
   DRM — anything a browser can check, a determined visitor can bypass. Monthly rotation is what
   keeps a shared code from spreading, and the grace window (codes run to the 5th) keeps an honest
   supporter from being locked out on rotation day. The plaintext code is never stored: localStorage
   keeps only {label, until, at}.
   Generated table: written by portal/supporter/rotate.py. Do not hand-edit — run the tool. */
(function (g) {
  "use strict";

  var UNLOCK_STORE = "lygo_portal_supporter";
  var GATE_VERSION = "2026-09-24";
  var NAG_MS = 10 * 60 * 1000;            // a reminder every ten minutes
  var PATREON = "https://www.patreon.com/Excavationpro/posts/chatagent-ca-api-170485961";
  var PAYPAL = "https://www.paypal.com/paypalme/ExcavationPro";

  /* @supporter-hashes:start */
  var CODE_HASHES = [
    {"label": "2026-08", "sha256": "5d29c090b2e2ee7796cc7cbbffa78ec50544cc1e45df8e9224b557704fcf0f5d", "until": "2026-09-05", "note": "rotated out"},
    {"label": "2026-09", "sha256": "d48807895bb635e4cfb43f81df947f631eb15e1b5786d53841f3e65a880607ca", "until": "2026-10-05", "note": "monthly rotation"},
    {"label": "steward", "sha256": "9dc55ba3412edfbaedd8c62140cb23168bb613934983f8c4b7337f36f3026e16", "until": null, "permanent": true, "note": "steward: never expires \u2014 keep the plaintext private"},
    {"label": "2026-10", "sha256": "b4ea080e10df75951e2d9120ee412e0a9ada09038b3a36b5259fc2cd1477fd57", "until": "2026-11-05", "note": "monthly rotation"},
    {"label": "2026-11", "sha256": "be6bb77e4d380f2587d492b409ab472e30032ec9f6c70501d5587a5d1ab9a749", "until": "2026-12-05", "note": "monthly rotation"},
    {"label": "2026-12", "sha256": "fa189e576f1015099a44d145beb524e297095ccb63ae54d46a8121b761efa41e", "until": "2027-01-05", "note": "monthly rotation"},
    {"label": "2027-01", "sha256": "606a5f191cb458fa77a020e20b517eed0d2b9e484756ffe266f2c3c26c69f4fb", "until": "2027-02-05", "note": "monthly rotation"},
    {"label": "2027-02", "sha256": "6d8865d89a96bcb02e763b98b7a4b6e79a1cada96f8d549d36d3fd001d30ebaf", "until": "2027-03-05", "note": "monthly rotation"},
    {"label": "2027-03", "sha256": "121d79a7eff18cfbcebf1b5e9ca8c060083555862680685bd2099c519ba8c45d", "until": "2027-04-05", "note": "monthly rotation"},
    {"label": "2027-04", "sha256": "64cd662cb7ef70c7919161f8f1dfd7fb7d0f50c59c81debf9291fc25843fe05c", "until": "2027-05-05", "note": "monthly rotation"},
    {"label": "2027-05", "sha256": "b5a0735243fd535de9d1091bf3fcf173e24369471d0d7d9eb2c195da5d42ecbe", "until": "2027-06-05", "note": "monthly rotation"},
    {"label": "2027-06", "sha256": "3d3a1d7769d53d345ee4137eeedd03bf1d0f43f920d9d40462a7617e5728e08f", "until": "2027-07-05", "note": "monthly rotation"},
    {"label": "2027-07", "sha256": "91428a254186748f03e4b039fd486c6a5ba9a4e94ab18e7435362e5e081c0ff5", "until": "2027-08-05", "note": "monthly rotation"},
    {"label": "2027-08", "sha256": "70f6be76b78b920decfe98accd394049bff305307a9d7d418f725eb653f89f12", "until": "2027-09-05", "note": "monthly rotation"},
    {"label": "2027-09", "sha256": "f876d4d5e474d14bab8c2edcbe0f0d7155d634ae8566bc869db1f7d7b8c4f1d7", "until": "2027-10-05", "note": "monthly rotation"},
    {"label": "2027-10", "sha256": "35152cc4955e42bbfe21771b9228cedbb483e2f8eb3da755bb5b53cb2d9eb5b5", "until": "2027-11-05", "note": "monthly rotation"},
    {"label": "2027-11", "sha256": "d54a4c933e50e1669d2a589217bd5681ff2c336a74a71b7d7c2db4d9f9800dae", "until": "2027-12-05", "note": "monthly rotation"},
    {"label": "2027-12", "sha256": "15cdd3053c149b7a5d9497bdac8b54d7328a49c5c30dfadb28f6b513c8571758", "until": "2028-01-05", "note": "monthly rotation"},
    {"label": "2028-01", "sha256": "65d02f0b0e1472f7442d875c330c9e969c315149825da61897f9c9746828c8a4", "until": "2028-02-05", "note": "monthly rotation"},
    {"label": "2028-02", "sha256": "f10c84f9f6a3aa4626fa91355b01b35adcbd8901549f004ec1f542d4f3b21177", "until": "2028-03-05", "note": "monthly rotation"},
    {"label": "2028-03", "sha256": "07e155a380d470c58f77a7fcfd733202bf91396acab226359ff8ad9a3cc6ed07", "until": "2028-04-05", "note": "monthly rotation"},
    {"label": "2028-04", "sha256": "87e475176858d35f834d3c0946c67ee1713c1752d89bba39e64c2a153719c81c", "until": "2028-05-05", "note": "monthly rotation"},
    {"label": "2028-05", "sha256": "dc13ae0aa8d69298c041223badcea1ec41b13b40f866d627501e71eead0e8637", "until": "2028-06-05", "note": "monthly rotation"},
    {"label": "2028-06", "sha256": "be47da95d72bea7e9e62c4d1e01a31def7b604829cad7d848f3db5e5707aaa12", "until": "2028-07-05", "note": "monthly rotation"},
    {"label": "2028-07", "sha256": "1a4ef1b545343d95750cf4cbc86f6e166f480803429ccd9b6b9b957fb71e08c7", "until": "2028-08-05", "note": "monthly rotation"},
    {"label": "2028-08", "sha256": "777deb41704af5e1d673c6df0286c378691df050598c61054858cb5b9a3118fb", "until": "2028-09-05", "note": "monthly rotation"},
    {"label": "2028-09", "sha256": "ba3cc691f441a282629d8d797e64e848a45747a5f3e8d9f5aa20a471d9547dab", "until": "2028-10-05", "note": "monthly rotation"},
    {"label": "2028-10", "sha256": "c37d6ac627ac4a575761160c7785814a32d8b127de89f28aa8b00d15f6caa735", "until": "2028-11-05", "note": "monthly rotation"},
    {"label": "2028-11", "sha256": "43984fe35ad6c73dd592b2bb934e1cb33a25188d09d74faed8f672415d9468b7", "until": "2028-12-05", "note": "monthly rotation"},
    {"label": "2028-12", "sha256": "e7229b1be22cf851d1e31db35a40e9089f523f6ffe54b8dcac7c8b48f405a11d", "until": "2029-01-05", "note": "monthly rotation"},
    {"label": "2029-01", "sha256": "1c258e6c9dcdcf1eec5414b1a9ce55401ade9bc7e9ce98f16e4d85dbd68995b8", "until": "2029-02-05", "note": "monthly rotation"},
    {"label": "2029-02", "sha256": "70e62f115f3b836d487a740d57a7cf2563cacdfa71c66a45679976e41dd82221", "until": "2029-03-05", "note": "monthly rotation"},
    {"label": "2029-03", "sha256": "eba09a6f2e96631ca23fcb18de99a18cc537de2fc59c6a06c4433ccacaf06b14", "until": "2029-04-05", "note": "monthly rotation"}
  ];
  /* @supporter-hashes:end */

  var card = null, rain = null, rainTimer = null, row = null, rowHost = null, lastFocus = null;
  var nagTimer = null, suppressUntil = 0, held = false;

  /* A host that renders its own supporter UI (a compiled app with no menu root
     to anchor a row to, e.g. games/eternal-lattice) sets window.LYGO_GATE_EMBED
     before this file runs. Then nothing is injected into the page at all: the
     reminder still exists, it just arrives with no furniture of ours on the
     board, and its "enter the code" door asks the host to open its own pane
     instead of dropping a fixed bar over the host's controls. */
  var EMBED = !!(g.LYGO_GATE_EMBED ||
    (document.documentElement && document.documentElement.hasAttribute("data-lygo-gate-embed")));

  function el(id) { return document.getElementById(id); }
  function store(k) { try { return g.localStorage.getItem(k); } catch (_) { return null; } }
  function save(k, v) { try { g.localStorage.setItem(k, String(v)); } catch (_) {} }
  function drop(k) { try { g.localStorage.removeItem(k); } catch (_) {} }

  function normalize(code) { return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function endOfDay(day) { var d = new Date(String(day) + "T23:59:59"); return isNaN(d.getTime()) ? 0 : d.getTime(); }

  async function sha256hex(text) {
    if (!g.crypto || !g.crypto.subtle) throw new Error("no_webcrypto");
    var buf = await g.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }

  function record() {
    var raw = store(UNLOCK_STORE);
    if (!raw) return null;
    try { var r = JSON.parse(raw); return (r && typeof r === "object") ? r : null; } catch (_) { return null; }
  }

  function state() {
    var r = record();
    if (!r) return { unlocked: false, label: "", until: "", lapsed: false };
    var live = !r.until || Date.now() <= endOfDay(r.until);
    return { unlocked: live, label: String(r.label || ""), until: String(r.until || ""), lapsed: !live && !!r.until };
  }

  function announce() {
    try { document.dispatchEvent(new CustomEvent("lygo-supporter", { detail: state() })); } catch (_) {}
    paintRow();
    if (state().unlocked) hideCard();
  }

  async function tryCode(code) {
    var n = normalize(code);
    if (n.length < 12) return { ok: false, why: "That looks too short. The code looks like LYGO-2609-XXXX-XXXX." };
    var h;
    try { h = await sha256hex(n); }
    catch (_) { return { ok: false, why: "This browser will not hash outside a secure page (https). The live games are https." }; }
    var hit = null;
    for (var i = 0; i < CODE_HASHES.length; i++) { if (CODE_HASHES[i].sha256 === h) { hit = CODE_HASHES[i]; break; } }
    if (!hit) return { ok: false, why: "That code is not one of this lattice's codes. Codes rotate every month — the current one is on the Patreon post." };
    if (!hit.permanent && hit.until && Date.now() > endOfDay(hit.until)) {
      return { ok: false, why: "That code was valid through " + hit.until + " and has been rotated out. The current month's code is on the Patreon post." };
    }
    save(UNLOCK_STORE, JSON.stringify({
      label: hit.label, until: hit.permanent ? "" : (hit.until || ""), at: new Date().toISOString()
    }));
    announce();
    return { ok: true, label: hit.label, until: hit.permanent ? "" : (hit.until || "") };
  }

  function relock() { drop(UNLOCK_STORE); announce(); }

  /* ---- palette: read the game's own colours so the module belongs there ----------------
     Where the colours come from, in order:
       * surfaces  — the background of the container the row sits in, then the game's --panel;
       * accents   — the game's --gold and --cyan (all eight publish gold; six publish cyan);
       * lines and
         text      — --line, --text, --mute;
       * geometry  — corner radius, font family and font size measured from the game's own links
                     and buttons, so the row is the same shape as the things beside it.
     A button's fill is never used as a surface: a gold button must not turn the whole module gold.
     Nothing is written back to the game — the values land on the row and the card only. */

  function cssVar(name) {
    try { return (getComputedStyle(document.documentElement).getPropertyValue(name) || "").trim(); }
    catch (_) { return ""; }
  }
  function opaque(c) { return !!c && c !== "transparent" && !/rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(c); }
  function common(list) {
    var seen = {}, best = "", bestN = 0;
    for (var i = 0; i < list.length; i++) {
      seen[list[i]] = (seen[list[i]] || 0) + 1;
      if (seen[list[i]] > bestN) { bestN = seen[list[i]]; best = list[i]; }
    }
    return best;
  }

  /* A menu item is a button, a link, or something the game made clickable — never an h1, a kicker
     line or a lore paragraph, which is what a plain size test picks up. */
  function isItem(k) {
    if (!k || k === row) return false;
    if (k.className && String(k.className).indexOf("lyg-") === 0) return false;
    var b = k.getBoundingClientRect();
    if (b.width < 90 || b.height < 18 || b.height > 340) return false;
    var tag = k.tagName.toLowerCase();
    if (tag === "button" || tag === "a" || tag === "input") return true;
    if (k.getAttribute && k.getAttribute("role") === "button") return true;
    return getComputedStyle(k).cursor === "pointer";
  }
  function itemScore(node) {
    var kids = node.children, n = 0;
    for (var i = 0; i < kids.length; i++) if (isItem(kids[i])) n++;
    return n;
  }

  /* A container the row can live in: panel-wide, tall enough, and stacking its children downwards.
     A horizontal .row would squash the row into a strip of buttons, and the app shell or a nav bar
     is no place for it either, so both are rejected rather than guessed at. */
  function stacksDown(n) {
    var cs = getComputedStyle(n);
    if (cs.display === "flex") return cs.flexDirection.indexOf("column") === 0 || cs.flexWrap === "wrap";
    if (cs.display === "grid") return true;
    return cs.display === "block" || cs.display === "flow-root" || cs.display === "inline-block" || cs.display === "";
  }
  function acceptsRow(n) {
    if (!n || n === document.body) return false;
    var b = n.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    return b.width >= 280 && b.width <= Math.max(320, vw * 0.9) && b.height >= 60 && n.children.length >= 1 && stacksDown(n);
  }

  /* The deepest container holding at least two item-sized children, inside the menu. */
  function findItemHost(menu) {
    if (!menu) return null;
    var best = null, bestScore = 1, bestDepth = -1, vw = document.documentElement.clientWidth;
    var list = [menu].concat(Array.prototype.slice.call(menu.querySelectorAll("div, section, nav, ul, aside, form")));
    for (var i = 0; i < list.length; i++) {
      var node = list[i];
      if (node.contains(row)) continue;
      if (!stacksDown(node) && node !== menu) continue;
      var s = itemScore(node);
      if (s < 2) continue;
      if (node.getBoundingClientRect().width > vw * 0.92) s -= 1;
      var depth = 0, p = node;
      while (p && p !== menu) { depth++; p = p.parentElement; }
      if (s > bestScore || (s === bestScore && depth > bestDepth)) { best = node; bestScore = s; bestDepth = depth; }
    }
    return best;
  }

  /* The best home for the row is the one the games already made for it: every hand-written menu
     carries a .donate-row, so the code row sits beside it at exactly the same width; failing that,
     the panel that holds the h1, then the block around the game's own PayPal/Patreon link.
     Only inside a recognised menu root — the two compiled games have none, and for them the fixed
     tab at the bottom of the screen is the right answer (the row must not live inside a bundle
     that re-renders and would take it with it). */
  function anchorSpot() {
    var menu = findMenu();
    if (!menu) return null;
    var d = menu.querySelector('[class*="donate-row"], [class*="donateRow"], [id*="donate-row"]');
    if (d && acceptsRow(d.parentElement)) return { host: d.parentElement, after: d };
    var h = menu.querySelector("h1, h2");
    if (h && acceptsRow(h.parentElement)) return { host: h.parentElement, after: null };
    var link = menu.querySelector('a[href*="paypal"], a[href*="patreon"], [class*="paypal-mini"], [class*="donate-paypal"]');
    if (link) {
      var n = link, hops = 0;
      while (n && n !== menu.parentElement && hops++ < 10) {
        if (acceptsRow(n) && n.children.length >= 2) return { host: n, after: null };
        n = n.parentElement;
      }
    }
    return null;
  }

  function measureMenu(host) {
    var out = { items: 0 }, bags = { r: [], fs: [], ff: [] }, seen = 0;
    if (host) {
      var cand = host.querySelectorAll("button, a, [role='button'], input[type='button'], input[type='submit']");
      for (var i = 0; i < cand.length && seen < 40; i++) {
        var k = cand[i];
        if (row && row.contains(k)) continue;
        var b = k.getBoundingClientRect();
        if (b.width < 60 || b.height < 16 || b.height > 340) continue;
        var s = getComputedStyle(k);
        if (s.borderTopLeftRadius && s.borderTopLeftRadius !== "0px") bags.r.push(s.borderTopLeftRadius);
        if (s.fontSize) bags.fs.push(s.fontSize);
        if (s.fontFamily) bags.ff.push(s.fontFamily);
        seen++;
      }
    }
    out.items = seen;
    out.radius = common(bags.r); out.size = common(bags.fs); out.font = common(bags.ff);
    return out;
  }

  function applyTheme(host) {
    var m = measureMenu(host);
    var hostBg = "";
    if (host && host !== document.body) {
      var hb = getComputedStyle(host).backgroundColor;
      if (opaque(hb)) hostBg = hb;
    }
    var size = parseFloat(m.size || "");
    var vars = {
      "--lyg-panel": hostBg || cssVar("--panel"),
      "--lyg-well": cssVar("--bg"),
      "--lyg-line": cssVar("--line"),
      "--lyg-text": cssVar("--text"),
      "--lyg-mute": cssVar("--mute"),
      "--lyg-gold": cssVar("--gold"),
      "--lyg-cyan": cssVar("--cyan"),
      "--lyg-radius": m.radius,
      "--lyg-font": m.font,
      "--lyg-size": (size >= 10 && size <= 17) ? (size + "px") : "",
      "--lyg-title": (size >= 10 && size <= 17) ? (Math.round(size * 1.08) + "px") : ""
    };
    [row, card].forEach(function (n) {
      if (!n) return;
      for (var k in vars) { if (vars[k]) n.style.setProperty(k, vars[k]); }
    });
    if (row && host) {                       // alignment: sit like the menu's own items
      var hs = getComputedStyle(host);
      var gap = parseFloat(hs.rowGap || hs.gap || "0") || 0;
      if (hs.display.indexOf("flex") === 0 || hs.display.indexOf("grid") === 0) {
        row.style.marginTop = gap > 0 ? "0px" : "0.6rem";
        row.style.alignSelf = "stretch";
      } else {
        row.style.marginTop = "0.7rem";
      }
    }
  }

  /* ---- the supporter row, at the bottom of the game menu ------------------------------ */

  var MENU_SELECTORS = ["#menu", "#pauseMenu", "#pause", "[data-lygo-menu]", ".game-menu", "#overlay"];

  function findMenu() {
    for (var i = 0; i < MENU_SELECTORS.length; i++) {
      var n = document.querySelector(MENU_SELECTORS[i]);
      if (n && n !== rowHost && n.offsetParent !== null) return n;
    }
    for (var j = 0; j < MENU_SELECTORS.length; j++) {
      var m = document.querySelector(MENU_SELECTORS[j]);
      if (m) return m;
    }
    return null;
  }

  function buildRow() {
    var box = document.createElement("div");
    box.className = "lyg-row";
    box.id = "lygSupporterRow";
    box.innerHTML =
      '<button class="lyg-row-tab" type="button">\u26bf Supporter access \u2014 enter this month\'s code</button>' +
      '<div class="lyg-row-head"><span class="lyg-row-title">Supporter access</span>' +
      '<span class="lyg-row-chip" id="lygChip" hidden></span></div>' +
      '<p class="lyg-row-note" id="lygState"></p>' +
      '<div class="lyg-row-fields">' +
      '<input id="lygCode" class="lyg-input" type="text" inputmode="latin" autocomplete="off" ' +
      'spellcheck="false" placeholder="LYGO-2609-XXXX-XXXX" aria-label="Supporter code">' +
      '<button id="lygGo" class="lyg-btn" type="button">Unlock</button>' +
      '<button id="lygRelock" class="lyg-btn lyg-btn-quiet" type="button" hidden>Lock again</button>' +
      '</div>' +
      '<p class="lyg-row-msg" id="lygMsg" role="status" aria-live="polite"></p>' +
      '<a class="lyg-row-get" id="lygGet" href="' + PATREON + '" target="_blank" rel="noopener">' +
      "Get this month's code — Patreon post &rarr;</a>";
    box.addEventListener("click", function (ev) { ev.stopPropagation(); });
    var tab = box.querySelector(".lyg-row-tab");
    if (tab) tab.addEventListener("click", function () { box.classList.toggle("is-open"); });
    var go = box.querySelector("#lygGo");
    var inp = box.querySelector("#lygCode");
    go.addEventListener("click", function () { submit(); });
    inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); submit(); } });
    box.querySelector("#lygRelock").addEventListener("click", function () {
      relock(); say("Locked again in this browser. The reminders will come back.");
    });
    async function submit() {
      var v = inp.value;
      var res = await tryCode(v);
      if (res.ok) {
        inp.value = "";
        say("Unlocked — the reminders stay off in this browser" + (res.until ? " through " + res.until : "") + ". Thank you for keeping the lattice lit.");
      } else { say(res.why); }
    }
    return box;
  }

  function say(msg) { var m = el("lygMsg"); if (m) m.textContent = msg || ""; }

  function paintRow() {
    var chip = el("lygChip"), st = el("lygState"), go = el("lygGo"), rl = el("lygRelock"), inp = el("lygCode");
    if (!chip && !st) return;
    var s = state();
    if (chip) { chip.hidden = !s.unlocked; chip.textContent = s.until ? "through " + s.until : (s.unlocked ? "permanent" : ""); }
    if (st) {
      st.textContent = s.unlocked
        ? ("Active in this browser" + (s.label ? " · code " + s.label : "") + (s.until ? " · through " + s.until : " · permanent") +
           (s.until ? " — after that the reminders come back and this month's code is on Patreon." : ""))
        : (s.lapsed
            ? ("The code from " + s.label + " was valid through " + s.until + " and has lapsed, so the reminders are back.")
            : "One monthly code from Patreon switches the donation reminders off in this browser. Every game plays the same without it.");
    }
    if (go) go.hidden = s.unlocked;
    if (rl) rl.hidden = !s.unlocked;
    if (inp) inp.disabled = s.unlocked;
  }

  function mountRow() {
    if (EMBED) return;                       // the host owns the door
    if (!row) row = buildRow();
    var spot = anchorSpot();
    var host = (spot && spot.host) || findItemHost(findMenu());
    if (host) {
      if (spot && spot.after) {
        if (spot.after.nextSibling !== row) spot.after.insertAdjacentElement("afterend", row);
      } else if (row.parentNode !== host) {
        host.appendChild(row);
      }
      row.classList.remove("lyg-row-fixed");
      rowHost = host;
    } else {
      if (row.parentNode !== document.body) document.body.appendChild(row);
      row.classList.add("lyg-row-fixed");
      rowHost = document.body;
    }
    applyTheme(host);
    paintRow();
  }

  /* ---- the reminder --------------------------------------------------------------- */

  function hexToRgba(hex, a) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || "").trim());
    if (m) return "rgba(" + parseInt(m[1], 16) + "," + parseInt(m[2], 16) + "," + parseInt(m[3], 16) + "," + a + ")";
    return "rgba(251,191,36," + a + ")";
  }
  function accentOf(node) {
    try { return (getComputedStyle(node).getPropertyValue("--lyg-gold") || "").trim() || "#fbbf24"; }
    catch (_) { return "#fbbf24"; }
  }
  function paintRain(cv, accent) {
    if (!cv || !cv.getContext) return;
    var c = cv.getContext("2d"), dpr = Math.min(2, g.devicePixelRatio || 1);
    cv.width = Math.floor(cv.clientWidth * dpr); cv.height = Math.floor(cv.clientHeight * dpr);
    var glyphs = "\u0394\u03a6\u03a9\u03a3\u03a8\u2317\u25b3\u25bd\u25cf\u2022\u00b7\u03b1\u03b2\u2207\u2211\u221a\u221e\u2295\u2731\u2732\u2733";
    var fs = 18 * dpr, cols = Math.ceil(cv.width / fs);
    c.clearRect(0, 0, cv.width, cv.height);       // the layer's own themed backdrop shows through
    c.font = Math.floor(15 * dpr) + "px monospace";
    for (var i = 0; i < cols; i++) {
      var x = i * fs + fs * 0.2, y = -fs;
      var runs = 4 + Math.floor(Math.random() * 9);
      for (var j = 0; j < runs; j++) {
        var ch = glyphs.charAt(Math.floor(Math.random() * glyphs.length));
        var lead = j === runs - 1;
        c.fillStyle = lead ? (accent || "#fbbf24") : hexToRgba(accent, (j / runs * 0.5).toFixed(2));
        c.fillText(ch, x, y); y += fs * 1.05;
      }
    }
  }

  function buildCard() {
    var lay = document.createElement("div");
    lay.className = "lyg-layer";
    lay.id = "lygLayer";
    lay.hidden = true;
    lay.innerHTML =
      '<canvas class="lyg-rain" id="lygRain" aria-hidden="true"></canvas>' +
      '<div class="lyg-card" role="dialog" aria-modal="true" aria-labelledby="lygTitle">' +
      '<p class="lyg-kicker">\u03949\u03a6963 \u00b7 CHATAGENT.CA \u00b7 PUBLIC RESOURCE</p>' +
      '<h2 class="lyg-title" id="lygTitle">KEEP THE LATTICE LIT</h2>' +
      '<p class="lyg-lead">This game is free and stays free — there is nothing behind this card to buy.</p>' +
      '<ul class="lyg-list">' +
      "<li><strong>You do not have to donate.</strong> Opening PayPal or the Patreon post unlocks Continue — even if you give $0.</li>" +
      "<li><strong>Supporters get this month's code</strong> from the <a href=\"" + PATREON + "\" target=\"_blank\" rel=\"noopener\">Patreon post</a>. " +
      "Enter it in the Supporter access row at the bottom of the game menu and these reminders stop in this browser.</li>" +
      "<li><strong>Everything works without it</strong> — every level, every mode, the leaderboards and the whole arcade.</li>" +
      "</ul>" +
      '<div class="lyg-actions">' +
      '<a class="lyg-btn lyg-btn-gold" id="lygPaypal" href="' + PAYPAL + '" target="_blank" rel="noopener">Open PayPal.me/ExcavationPro</a>' +
      '<a class="lyg-btn lyg-btn-gold" id="lygPatreon" href="' + PATREON + '" target="_blank" rel="noopener">Patreon post — donate or get this month\'s code</a>' +
      '<button class="lyg-btn lyg-btn-cta" id="lygContinue" type="button" disabled>Open a donate page to continue</button>' +
      '<button class="lyg-btn lyg-btn-door" id="lygDoor" type="button">I am a supporter — enter this month\'s code</button>' +
      '</div>' +
      '<p class="lyg-foot">Code and support: <a href="' + PATREON + '" target="_blank" rel="noopener">chatagent-ca-api</a> \u00b7 ' +
      '<a href="/legal.html">Legal &amp; disclaimers</a></p>' +
      '</div>';
    var cta = lay.querySelector("#lygContinue");
    function opened() { cta.disabled = false; cta.textContent = "Continue"; }
    lay.querySelector("#lygPaypal").addEventListener("click", opened);
    lay.querySelector("#lygPatreon").addEventListener("click", opened);
    cta.addEventListener("click", function () { hideCard(NAG_MS); });
    lay.querySelector("#lygDoor").addEventListener("click", function () {
      hideCard(NAG_MS);
      openRow();
    });
    lay.addEventListener("click", function (ev) { if (ev.target === lay) ev.stopPropagation(); });
    return lay;
  }

  /* Where the door leads differs by host: normally the row we injected, and on
     an embedded host its own pane, which hears the event and opens it. */
  function openRow() {
    if (EMBED) {
      try { document.dispatchEvent(new CustomEvent("lygo-gate-door")); } catch (_) {}
      return;
    }
    mountRow();
    if (row) {
      row.classList.add("lyg-flash");
      setTimeout(function () { row.classList.remove("lyg-flash"); }, 1600);
      row.scrollIntoView({ block: "center", behavior: "smooth" });
      var inp = el("lygCode");
      if (inp && !inp.disabled) setTimeout(function () { inp.focus(); }, 350);
    }
  }

  function showCard() {
    if (state().unlocked) return;
    if (held || Date.now() < suppressUntil) return;
    if (!card) { card = buildCard(); document.body.appendChild(card); }
    applyTheme(rowHost);
    card.hidden = false;
    card.classList.add("lyg-open");
    lastFocus = document.activeElement;
    rain = el("lygRain");
    paintRain(rain, accentOf(card));
    clearInterval(rainTimer);
    rainTimer = setInterval(function () { paintRain(rain, accentOf(card)); }, 900);
    try { document.dispatchEvent(new CustomEvent("lygo-gate-open")); } catch (_) {}
  }

  function hideCard(nextMs) {
    if (card) { card.hidden = true; card.classList.remove("lyg-open"); }
    clearInterval(rainTimer); rainTimer = null;
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (_) {} }
    if (nextMs) schedule(nextMs);
  }

  function schedule(ms) {
    clearTimeout(nagTimer);
    nagTimer = setTimeout(function () {
      if (state().unlocked) return schedule(NAG_MS);
      if (document.hidden) return schedule(60 * 1000);
      // A held or suppressed reminder is not a dropped one: come back for it.
      if (held) return schedule(30 * 1000);
      if (Date.now() < suppressUntil) return schedule(Math.min(60 * 1000, suppressUntil - Date.now() + 1000));
      if (!card || card.hidden) showCard();
      schedule(NAG_MS);
    }, ms);
  }

  /* Hold the reminder (a live match, a modal flow) and let it go again; the
     gate is the only thing that knows when it may interrupt. */
  function hold(on) {
    held = !!on;
    if (held) hideCard();
    else schedule(1500);
  }

  /* Suspended for a while (a match just ended, a first-run tour is open). */
  function suppress(ms) {
    suppressUntil = ms ? Date.now() + ms : 0;
    if (card && !card.hidden) hideCard(ms ? ms : undefined);
  }

  function boot() {
    mountRow();
    [400, 1500, 4000, 9000].forEach(function (t) { setTimeout(mountRow, t); });
    schedule(NAG_MS);
  }

  g.LYGO_GATE = {
    version: GATE_VERSION, storeKey: UNLOCK_STORE, patreon: PATREON, paypal: PAYPAL,
    nagMs: NAG_MS, codeCount: CODE_HASHES.length, embed: EMBED,
    state: state, unlock: tryCode, relock: relock, open: showCard, close: hideCard,
    mount: mountRow, host: function () { return rowHost; },
    hold: hold, suppress: suppress, openRow: openRow,
    hashes: function () { return CODE_HASHES.map(function (c) { return c.sha256; }); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
