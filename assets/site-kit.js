(function () {
  var load = document.getElementById("lygoLoad");
  function hideLoad() { if (load) load.hidden = true; }
  if (document.readyState === "complete") hideLoad();
  else window.addEventListener("load", hideLoad);
  setTimeout(hideLoad, 1800);

  var banner = document.getElementById("cookieBanner");
  var key = document.documentElement.getAttribute("data-cookie-key") || "chatagent_cookies";
  try {
    var v = localStorage.getItem(key);
    if (banner && v !== "accepted" && v !== "declined") banner.classList.add("show");
    document.getElementById("cookieOk")?.addEventListener("click", function () {
      localStorage.setItem(key, "accepted");
      banner?.classList.remove("show");
    });
    document.getElementById("cookieNo")?.addEventListener("click", function () {
      localStorage.setItem(key, "declined");
      banner?.classList.remove("show");
    });
  } catch (_) {}

  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (el) {
        var field = el.closest(".field") || el.parentElement;
        var bad = !String(el.value || "").trim();
        if (el.type === "email" && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) bad = true;
        field.classList.toggle("bad", bad);
        if (bad) ok = false;
      });
      if (!ok) return;
      window.location.href = "/thanks.html";
    });
  }

  document.querySelectorAll(".y").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

/* LYGO Discord lattice — one canonical invite + official widget.
   Loaded by the shared site-kit.js on every domain. */
(function () {
  if (window.__LYGO_DISCORD_WIRED__) return;
  window.__LYGO_DISCORD_WIRED__ = true;

  var INVITE = "https://discord.gg/ktGcEkVN9";
  var WIDGET = "https://discord.com/widget?id=346781530246610944&theme=dark";

  var css = document.createElement("style");
  css.textContent = [
    "#lygoDiscordBtn{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;align-items:center;gap:.55rem;",
    "border:1px solid rgba(224,179,106,.55);background:#16120c;color:#f4ead9;border-radius:999px;",
    "padding:.68rem .95rem;font:600 .82rem/1 system-ui,-apple-system,Segoe UI,sans-serif;letter-spacing:.02em;",
    "box-shadow:0 12px 34px rgba(0,0,0,.45);cursor:pointer;transition:transform .18s ease,border-color .18s ease}",
    "#lygoDiscordBtn:hover{transform:translateY(-2px);border-color:#e0b36a}",
    "#lygoDiscordBtn .dot{width:8px;height:8px;border-radius:50%;background:#7ee2a8;box-shadow:0 0 0 4px rgba(126,226,168,.12)}",
    "#lygoDiscordModal{position:fixed;inset:0;z-index:2147483001;display:none;align-items:center;justify-content:center;",
    "padding:1rem;background:rgba(5,4,3,.78);backdrop-filter:blur(6px)}",
    "#lygoDiscordModal.show{display:flex}",
    "#lygoDiscordModal .panel{width:min(440px,100%);max-height:min(720px,92vh);overflow:hidden;display:flex;flex-direction:column;",
    "background:#120f0a;border:1px solid rgba(224,179,106,.35);border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.65);color:#f4ead9;",
    "font:400 .92rem/1.55 system-ui,-apple-system,Segoe UI,sans-serif}",
    "#lygoDiscordModal .head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1rem 1.1rem .8rem}",
    "#lygoDiscordModal h2{margin:0;font:700 1rem/1.25 Georgia,serif;color:#f4ead9}",
    "#lygoDiscordModal p{margin:.35rem 0 0;color:#b9ad9c;font-size:.78rem;line-height:1.45}",
    "#lygoDiscordClose{border:0;background:transparent;color:#b9ad9c;font-size:1.5rem;line-height:1;cursor:pointer;padding:.1rem .25rem}",
    "#lygoDiscordClose:hover{color:#f4ead9}",
    "#lygoDiscordModal iframe{width:100%;height:360px;border:0;background:#2b2d31;display:block}",
    "#lygoDiscordModal .join{margin:0;padding:.9rem 1.1rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;border-top:1px solid rgba(255,255,255,.08)}",
    "#lygoDiscordModal .join a{display:inline-flex;align-items:center;gap:.4rem;background:#e0b36a;color:#17120b;text-decoration:none;",
    "font-weight:700;border-radius:9px;padding:.55rem .8rem;font-size:.8rem}",
    "#lygoDiscordModal .join small{color:#8e8375;font-size:.7rem;max-width:20ch}",
    "@media(max-width:520px){#lygoDiscordBtn{right:12px;bottom:12px;padding:.6rem .8rem;font-size:.76rem}",
    "#lygoDiscordModal iframe{height:320px}}",
    "@media(prefers-reduced-motion:reduce){#lygoDiscordBtn{transition:none}}"
  ].join("");
  document.head.appendChild(css);

  function make(tag, attrs, text) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    if (text) el.textContent = text;
    return el;
  }

  var btn = make("button", { id: "lygoDiscordBtn", type: "button", "aria-haspopup": "dialog",
    "aria-controls": "lygoDiscordModal", "aria-label": "Open the LYGO Discord server" });
  btn.appendChild(make("span", { "class": "dot", "aria-hidden": "true" }));
  btn.appendChild(document.createTextNode("Discord"));

  var modal = make("div", { id: "lygoDiscordModal", role: "dialog", "aria-modal": "true",
    "aria-label": "LYGO Discord server", "aria-hidden": "true" });
  var panel = make("div", { "class": "panel" });
  var head = make("div", { "class": "head" });
  var titleWrap = make("div", {});
  titleWrap.appendChild(make("h2", {}, "The LYGO server"));
  titleWrap.appendChild(make("p", {}, "A9LYRA and Lightfather live here. Diaries, system receipts, streams, and the workbench."));
  var close = make("button", { id: "lygoDiscordClose", type: "button", "aria-label": "Close Discord dialog" }, "×");
  head.appendChild(titleWrap); head.appendChild(close);
  var frame = make("iframe", { title: "LYGO Discord live widget", loading: "lazy",
    allowtransparency: "true", frameborder: "0", sandbox: "allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts" });
  var join = make("div", { "class": "join" });
  var link = make("a", { href: INVITE, target: "_blank", rel: "noopener" }, "Join the server ↗");
  join.appendChild(link);
  join.appendChild(make("small", {}, "Same server across every LYGO domain."));
  panel.appendChild(head); panel.appendChild(frame); panel.appendChild(join);
  modal.appendChild(panel);
  document.body.appendChild(btn);
  document.body.appendChild(modal);

  var opened = false;
  function open() {
    if (!opened) { frame.src = WIDGET; opened = true; }
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    close.focus();
  }
  function shut() {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    btn.focus();
  }
  btn.addEventListener("click", open);
  close.addEventListener("click", shut);
  modal.addEventListener("click", function (e) { if (e.target === modal) shut(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("show")) shut(); });

  // Add a quiet footer link where the site already has a footer nav.
  var nav = document.querySelector("footer nav, footer.site nav, footer.foot nav, .foot nav");
  if (nav && !nav.querySelector("[data-lygo-discord]")) {
    var a = make("a", { href: INVITE, target: "_blank", rel: "noopener", "data-lygo-discord": "1" }, "Discord");
    nav.appendChild(a);
  }
})();


/* Keep the Discord launcher above the cookie consent bar. */
(function () {
  var style = document.createElement("style");
  style.textContent = [
    "body.lygo-cookie-open #lygoDiscordBtn{bottom:76px}",
    "@media(max-width:520px){body.lygo-cookie-open #lygoDiscordBtn{bottom:66px}}"
  ].join("");
  document.head.appendChild(style);
  var banner = document.getElementById("cookieBanner");
  if (!banner) return;
  function sync() {
    document.body.classList.toggle("lygo-cookie-open", banner.classList.contains("show"));
  }
  new MutationObserver(sync).observe(banner, { attributes: true, attributeFilter: ["class"] });
  sync();
})();

