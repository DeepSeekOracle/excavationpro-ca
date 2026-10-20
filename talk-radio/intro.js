(function () {
  var ID = "talk-radio-intro";

  function insertIntro() {
    if (document.getElementById(ID)) return;
    var root = document.getElementById("root");
    if (!root) return;
    var app = root.firstElementChild;
    if (!app) return;
    var header = app.querySelector("header");
    var main = app.querySelector("main");
    if (!header || !main) return;

    var section = document.createElement("section");
    section.id = ID;
    section.setAttribute("aria-label", "About AI Talk Radio");
    section.style.cssText = "max-width:80rem;width:100%;margin:0 auto;padding:1.25rem 1rem 0;";
    section.innerHTML =
      '<div style="border:1px solid #1e293b;background:linear-gradient(180deg,#0e131f,#0b0e14);border-radius:14px;padding:1.35rem 1.4rem;">' +
      '<p style="margin:0 0 .35rem;font:700 .65rem/1.4 ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:#f59e0b;">LYGO Signal · AI Talk Radio</p>' +
      '<h2 style="margin:0 0 .6rem;font-size:clamp(1.35rem,2.5vw,1.8rem);line-height:1.2;color:#f8fafc;">A working studio, not a demo reel.</h2>' +
      '<p style="margin:0 0 .7rem;max-width:70ch;color:#cbd5e1;font-size:1rem;line-height:1.65;">AI Talk Radio is the live studio of LYGO Signal: two hosts, a caller hotline, a producer desk, and a soundboard turn a topic into a timecoded episode. It is not a podcast player with a record button. You can write a segment, hear it voiced, call in as a character, shape the sound, and export the finished pack. No login, no install, no paywall.</p>' +
      '<p style="margin:0 0 .7rem;max-width:70ch;color:#cbd5e1;font-size:1rem;line-height:1.65;">The studio runs in your browser; the finished archive lives on Signal. Start with Studio Broadcast for the live desk, or Soundboard FX if you want to build the sound first. Every control has a job. If you only want to listen, open the Signal archive and skip the desk.</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1rem;">' +
      '<a href="/signal/" style="display:inline-block;padding:.55rem .8rem;border-radius:8px;background:#f59e0b;color:#0b0e14;font-weight:700;text-decoration:none;font-size:.85rem;">Browse the Signal archive</a>' +
      '<a href="https://chatagent.ca/guides/" style="display:inline-block;padding:.55rem .8rem;border-radius:8px;border:1px solid #334155;color:#e2e8f0;font-weight:600;text-decoration:none;font-size:.85rem;">Operator guides</a>' +
      '<a href="/talk-radio/disclaimer.html" style="display:inline-block;padding:.55rem .8rem;border-radius:8px;border:1px solid #334155;color:#e2e8f0;font-weight:600;text-decoration:none;font-size:.85rem;">Studio disclaimer</a>' +
      "</div>" +
      '<div style="margin-top:1.2rem;padding-top:1rem;border-top:1px solid #1e293b;">' +
      '<p style="margin:0 0 .4rem;font:600 .62rem/1.4 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">Advertisement</p>' +
      '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0646320966060599" data-ad-format="auto" data-full-width-responsive="true"></ins>' +
      "</div>" +
      "</div>";

    header.after(section);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {}
  }

  function boot() {
    insertIntro();
    var root = document.getElementById("root");
    if (root) {
      var observer = new MutationObserver(function () {
        if (!document.getElementById(ID)) insertIntro();
      });
      observer.observe(root, { childList: true, subtree: true });
    }
    setTimeout(insertIntro, 1200);
    setTimeout(insertIntro, 3500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
