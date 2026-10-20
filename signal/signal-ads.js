(function () {
  "use strict";
  var KEY = "excavationpro_signal_ads_v1";
  var loaded = false;
  function loadAds() {
    if (loaded) return;
    loaded = true;
    var existing = document.querySelector('script[src*="adsbygoogle.js"]');
    function push() {
      document.querySelectorAll("ins.adsbygoogle").forEach(function (el) {
        if (el.getAttribute("data-adsbygoogle-status")) return;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          el.setAttribute("data-adsbygoogle-status", "done");
        } catch (e) {}
      });
    }
    if (existing) { push(); return; }
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0646320966060599";
    s.crossOrigin = "anonymous";
    s.onload = push;
    document.head.appendChild(s);
  }
  function showConsent() {
    if (document.getElementById("signalAdConsent")) return;
    var box = document.createElement("div");
    box.id = "signalAdConsent";
    box.className = "signal-ad-consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Advertising consent");
    box.innerHTML = '<p><strong>Cookies &amp; ads.</strong> LYGO Signal can show Google AdSense ads after you accept. <a href="https://excavationpro.ca/privacy.html">Privacy</a>.</p><div><button type="button" class="sig-consent-ok">Accept ads</button><button type="button" class="sig-consent-no">Essential only</button></div>';
    document.body.appendChild(box);
    box.querySelector(".sig-consent-ok").addEventListener("click", function () {
      localStorage.setItem(KEY, "yes"); box.remove(); loadAds();
    });
    box.querySelector(".sig-consent-no").addEventListener("click", function () {
      localStorage.setItem(KEY, "no"); box.remove();
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    var saved = localStorage.getItem(KEY);
    if (saved === "yes") loadAds();
    else if (saved !== "no") setTimeout(showConsent, 900);
  });
})();
