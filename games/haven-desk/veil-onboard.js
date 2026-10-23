/* HAVEN DESK — LYGO 98 SETUP + DESKTOP PERSONALIZATION.
   First-run wizard, mock credentials, wallpaper/theme choice, and a period
   crash screen that resets into the desk. */
(function () {
  "use strict";
  var H = window.HavenDesk;
  if (!H) return;
  if (!H.store.veil) H.store.veil = {};
  var V = H.store.veil;

  var SCHEMES = {
    teal:   { name: "Teal",   field: "#008080", navy: "#000080", face: "#c0c0c0", mid: "#dfdfdf", shade: "#808080", lo: "#404040" },
    slate:  { name: "Slate",  field: "#3b4a5a", navy: "#1e2b3a", face: "#c4c8c9", mid: "#e1e4e3", shade: "#7f8788", lo: "#3d4445" },
    violet: { name: "Violet", field: "#463a63", navy: "#2c2148", face: "#d0c7cc", mid: "#e8e0e3", shade: "#8c7d8d", lo: "#493e4a" },
    amber:  { name: "Amber",  field: "#73512e", navy: "#3b2711", face: "#d8c5a8", mid: "#ece0cc", shade: "#93806a", lo: "#4a3b2b" },
    green:  { name: "Moss",   field: "#2f523d", navy: "#123322", face: "#c9d3c4", mid: "#e1e9dd", shade: "#788b78", lo: "#394b39" },
    blue:   { name: "Midnight", field: "#23415e", navy: "#071d33", face: "#c4ccd8", mid: "#e0e6ee", shade: "#758493", lo: "#384656" }
  };

  var WALLS = [
    { id: "classic", title: "Classic Teal", src: "", note: "The desk as it was found." },
    { id: "desk", title: "The Desk", src: "assets/veil/desk-hero.jpg", note: "A room left on." },
    { id: "signal", title: "Signal Room", src: "assets/plates/plate-001.svg", note: "A recovered plate." },
    { id: "packet", title: "Packet Rain", src: "assets/plates/plate-017.svg", note: "The archive under load." },
    { id: "corridor", title: "Long Corridor", src: "assets/plates/plate-003.svg", note: "A room with a bad hinge." },
    { id: "archive", title: "The Archive", src: "assets/plates/plate-300.svg", note: "The last plate." }
  ];

  function scheme(key) { return SCHEMES[key] || SCHEMES.teal; }
  function applyDesktop(config) {
    config = config || {};
    var theme = scheme(config.theme);
    var root = document.documentElement;
    root.style.setProperty("--teal", theme.field);
    root.style.setProperty("--navy", theme.navy);
    root.style.setProperty("--face", theme.face);
    root.style.setProperty("--mid", theme.mid);
    root.style.setProperty("--shade", theme.shade);
    root.style.setProperty("--lo", theme.lo);
    var stage = document.getElementById("stage");
    if (stage) {
      stage.style.backgroundColor = theme.field;
      stage.style.backgroundImage = config.background ? 'url("' + config.background + '")' : "";
      stage.style.backgroundSize = "cover";
      stage.style.backgroundPosition = "center";
      stage.style.backgroundRepeat = "no-repeat";
      stage.style.backgroundBlendMode = "multiply";
    }
    V.desktop = { background: config.background || "", theme: config.theme || "teal" };
    H.save();
  }
  function setBackground(src) {
    var current = V.desktop || {};
    applyDesktop({ background: src || "", theme: current.theme || "teal" });
  }
  function setTheme(key) {
    var current = V.desktop || {};
    applyDesktop({ background: current.background || "", theme: key || "teal" });
  }
  window.VEIL_DESKTOP = { schemes: SCHEMES, walls: WALLS, apply: applyDesktop, setBackground: setBackground, setTheme: setTheme };

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

  function setUserChip(name) {
    var tasks = document.getElementById("tasks");
    if (!tasks) return;
    var chip = document.getElementById("veil-user-chip");
    if (!chip) {
      chip = document.createElement("span");
      chip.id = "veil-user-chip";
      chip.className = "veil-user-chip";
      tasks.parentNode.insertBefore(chip, tasks.nextSibling);
    }
    chip.textContent = "USER · " + (name || "VISITOR");
  }
  function complete(user, background, theme, recovered) {
    V.onboarding = {
      complete: true,
      user: user || "VISITOR",
      background: background || "",
      theme: theme || "teal",
      recovered: !!recovered,
      at: new Date().toISOString()
    };
    applyDesktop({ background: background || "", theme: theme || "teal" });
    setUserChip(V.onboarding.user);
    var overlay = document.getElementById("veil-setup");
    if (overlay) overlay.remove();
    var boot = document.getElementById("boot");
    var desk = document.getElementById("desk");
    if (boot && !boot.hidden) {
      try { boot.click(); } catch (e) {}
    } else if (desk) {
      desk.hidden = false;
    }
    setTimeout(function () {
      if (H.toast) H.toast("WELCOME · " + (V.onboarding.user || "VISITOR"));
    }, 700);
  }

  function showScare(overlay) {
    overlay.innerHTML = "";
    overlay.className = "veil-setup is-scare";
    var screen = el("div", "veil-bsod");
    var brand = el("div", "veil-bsod-brand", "LYGO 98");
    screen.appendChild(brand);
    screen.appendChild(el("p", "", "A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01)."));
    screen.appendChild(el("p", "", "The current application will be terminated."));
    screen.appendChild(el("p", "veil-bsod-small", "*  Press any key to terminate the current application."));
    screen.appendChild(el("p", "veil-bsod-small", "*  Press CTRL+ALT+DEL again to restart your computer. You will lose any unsaved information in all applications."));
    screen.appendChild(el("p", "veil-bsod-bottom", "Press any key to continue"));
    overlay.appendChild(screen);
    var reset = btn("PRESS HERE TO RESET", "veil-bsod-reset", function () {
      complete("VISITOR", "assets/veil/desk-hero.jpg", "teal", true);
    });
    reset.hidden = true;
    overlay.appendChild(reset);
    setTimeout(function () { reset.hidden = false; }, 2400);
  }

  function openSetup() {
    var overlay = el("div", "veil-setup");
    overlay.id = "veil-setup";
    document.body.appendChild(overlay);
    var state = { step: 0, user: "", attempts: 0, background: "", theme: "teal" };

    function frame() {
      overlay.innerHTML = "";
      var logo = el("div", "veil-setup-brand");
      var mark = el("span", "veil-setup-mark", "Δ9");
      var title = el("div");
      title.appendChild(el("strong", "", "LYGO 98 SETUP"));
      title.appendChild(el("small", "", "A LYGO temporal shell · build 1998.03.14"));
      logo.appendChild(mark); logo.appendChild(title);
      overlay.appendChild(logo);
      var body = el("div", "veil-setup-body");
      overlay.appendChild(body);
      return body;
    }
    function nav(body, back, next, nextLabel) {
      var row = el("div", "veil-setup-nav");
      if (back) row.appendChild(btn("← BACK", "raised", back));
      var spacer = el("span", "veil-setup-spacer");
      row.appendChild(spacer);
      row.appendChild(btn(nextLabel || "NEXT →", "veil-primary", next));
      body.appendChild(row);
    }
    function welcome() {
      var b = frame();
      b.appendChild(el("p", "veil-setup-kicker", "FIRST BOOT · THIS COPY HAS NOT BEEN CONFIGURED"));
      b.appendChild(el("h1", "veil-setup-title", "Welcome to LYGO 98."));
      b.appendChild(el("p", "veil-setup-copy", "The desk is already warm. Before it opens, the shell needs a user, a password, a field, and a color."));
      b.appendChild(el("p", "veil-setup-copy", "This takes one minute. The desk will remember it."));
      var row = el("div", "veil-setup-nav");
      row.appendChild(btn("BEGIN SETUP", "veil-primary", account));
      b.appendChild(row);
    }
    function account() {
      var b = frame();
      b.appendChild(el("p", "veil-setup-kicker", "STEP 1 OF 5 · USER ACCOUNT"));
      b.appendChild(el("h1", "veil-setup-title", "Who is sitting down?"));
      b.appendChild(el("p", "veil-setup-copy", "The desk will use this name in the corner of the room."));
      var label = el("label", "veil-setup-label", "USER NAME");
      var input = document.createElement("input");
      input.className = "veil-setup-input"; input.maxLength = 32; input.value = state.user;
      input.placeholder = "e.g. VISITOR";
      input.autocomplete = "off";
      var error = el("p", "veil-setup-error", "");
      b.appendChild(label); b.appendChild(input); b.appendChild(error);
      b.appendChild(el("p", "veil-setup-hint", "This is a local account. It never leaves the desk."));
      nav(b, welcome, function () {
        var v = input.value.trim();
        if (v.length < 2) { error.textContent = "The desk needs a name with at least two characters."; input.focus(); return; }
        state.user = v; password();
      });
      setTimeout(function () { input.focus(); }, 0);
    }
    function password() {
      var b = frame();
      b.appendChild(el("p", "veil-setup-kicker", "STEP 2 OF 5 · PASSWORD"));
      b.appendChild(el("h1", "veil-setup-title", "Choose a password."));
      b.appendChild(el("p", "veil-setup-copy", "At least four characters. The desk will not ask you to write it down."));
      var l1 = el("label", "veil-setup-label", "PASSWORD");
      var p1 = document.createElement("input");
      p1.type = "password"; p1.className = "veil-setup-input"; p1.autocomplete = "new-password";
      var l2 = el("label", "veil-setup-label", "CONFIRM PASSWORD");
      var p2 = document.createElement("input");
      p2.type = "password"; p2.className = "veil-setup-input"; p2.autocomplete = "new-password";
      var error = el("p", "veil-setup-error", "");
      b.appendChild(l1); b.appendChild(p1); b.appendChild(l2); b.appendChild(p2); b.appendChild(error);
      b.appendChild(el("p", "veil-setup-hint", "The shell will verify the pair. Three failed attempts return the machine to its last known state."));
      nav(b, account, function () {
        var pass = p1.value;
        if (pass.length < 4 || pass !== p2.value) {
          state.attempts++;
          error.textContent = "The shell could not verify the password pair. Attempt " + state.attempts + " of 3.";
          p2.value = ""; p2.focus();
          if (state.attempts >= 3) showScare(overlay);
          return;
        }
        wallpaper();
      });
      setTimeout(function () { p1.focus(); }, 0);
    }
    function wallpaper() {
      var b = frame();
      b.appendChild(el("p", "veil-setup-kicker", "STEP 3 OF 5 · DESKTOP FIELD"));
      b.appendChild(el("h1", "veil-setup-title", "Choose a field."));
      b.appendChild(el("p", "veil-setup-copy", "You can change this later from the Photo Journal as the archive opens."));
      var grid = el("div", "veil-setup-walls");
      WALLS.forEach(function (w) {
        var card = btn("", "veil-setup-wall" + (state.background === w.src ? " is-on" : ""), function () {
          state.background = w.src;
          Array.prototype.forEach.call(grid.children, function (c) { c.classList.remove("is-on"); });
          card.classList.add("is-on");
        });
        var thumb = el("div", "veil-setup-wallthumb");
        if (w.src) {
          var img = document.createElement("img");
          img.src = w.src; img.alt = w.title; img.loading = "lazy";
          thumb.appendChild(img);
        } else {
          thumb.textContent = "TEAL";
        }
        card.appendChild(thumb);
        card.appendChild(el("strong", "", w.title));
        card.appendChild(el("small", "", w.note));
        grid.appendChild(card);
      });
      b.appendChild(grid);
      nav(b, password, function () { theme(); });
    }
    function theme() {
      var b = frame();
      b.appendChild(el("p", "veil-setup-kicker", "STEP 4 OF 5 · COLOR SCHEME"));
      b.appendChild(el("h1", "veil-setup-title", "Choose a palette."));
      b.appendChild(el("p", "veil-setup-copy", "The same desk, under a different light."));
      var grid = el("div", "veil-setup-themes");
      Object.keys(SCHEMES).forEach(function (key) {
        var s = SCHEMES[key];
        var swatch = btn("", "veil-setup-theme" + (state.theme === key ? " is-on" : ""), function () {
          state.theme = key;
          Array.prototype.forEach.call(grid.children, function (c) { c.classList.remove("is-on"); });
          swatch.classList.add("is-on");
          overlay.style.setProperty("--setup-accent", s.field);
        });
        var chip = el("span", "veil-setup-swatch");
        chip.style.background = s.field;
        swatch.appendChild(chip);
        swatch.appendChild(el("strong", "", s.name));
        swatch.appendChild(el("small", "", "Desk field"));
        grid.appendChild(swatch);
      });
      b.appendChild(grid);
      nav(b, wallpaper, function () { ready(); });
    }
    function ready() {
      var b = frame();
      b.appendChild(el("p", "veil-setup-kicker", "STEP 5 OF 5 · READY"));
      b.appendChild(el("h1", "veil-setup-title", "The desk is ready."));
      b.appendChild(el("p", "veil-setup-copy", "User: " + state.user + " · field: " + (WALLS.filter(function (w) { return w.src === state.background; })[0] || WALLS[0]).title + " · palette: " + scheme(state.theme).name));
      b.appendChild(el("p", "veil-setup-copy", "The desktop will open with the room you found. Keep the desk on."));
      var bar = el("div", "veil-setup-progress");
      var fill = el("i");
      bar.appendChild(fill); b.appendChild(bar);
      fill.style.width = "100%";
      var row = el("div", "veil-setup-nav");
      row.appendChild(btn("← BACK", "raised", function () { theme(); }));
      row.appendChild(btn("ENTER DESKTOP →", "veil-primary", function () {
        complete(state.user, state.background, state.theme, false);
      }));
      b.appendChild(row);
    }
    welcome();
  }

  function start() {
    if (V.onboarding && V.onboarding.complete) {
      var saved = V.desktop || {};
      applyDesktop({
        background: typeof saved.background === "string" ? saved.background : (V.onboarding.background || ""),
        theme: saved.theme || V.onboarding.theme || "teal"
      });
      setUserChip(V.onboarding.user);
      return;
    }
    openSetup();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
