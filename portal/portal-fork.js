(() => {
  "use strict";
  const KEY = "excavationpro_portal_ads_v1";

  const badge = document.createElement("div");
  badge.className = "xp-fork-badge";
  badge.innerHTML = `<b>Excavationpro fork</b>
    <a href="https://excavationpro.ca/">domain</a>
    <a href="https://excavationpro.ca/data-vault/">data vault</a>
    <a href="https://excavationpro.ca/portal/legal.html">legal / privacy</a>`;
  document.body.appendChild(badge);

  const existingConsent = document.getElementById("adConsent");
  if (!existingConsent) {
    const box = document.createElement("div");
    box.className = "xp-consent";
    box.id = "adConsent";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Advertising consent");
    box.innerHTML = `<p><strong>Ads &amp; privacy.</strong> This page can show Google AdSense ads. You can accept ad cookies or use essential storage only. <a href="https://excavationpro.ca/portal/legal.html">Legal &amp; privacy</a>.</p>
      <div class="row"><button type="button" class="ok" id="adAccept">Accept ads</button><button type="button" id="adDecline">Essential only</button></div>`;
    document.body.appendChild(box);

    const update = (granted) => {
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          ad_storage: granted ? "granted" : "denied",
          ad_user_data: granted ? "granted" : "denied",
          ad_personalization: granted ? "granted" : "denied",
          analytics_storage: granted ? "granted" : "denied"
        });
      }
    };
    const saved = localStorage.getItem(KEY);
    if (saved === "yes") { update(true); }
    else if (saved !== "no") { setTimeout(() => { box.hidden = false; }, 1000); }
    box.querySelector("#adAccept").addEventListener("click", () => {
      localStorage.setItem(KEY, "yes"); update(true); box.hidden = true;
    });
    box.querySelector("#adDecline").addEventListener("click", () => {
      localStorage.setItem(KEY, "no"); update(false); box.hidden = true;
    });
  }

  // Add one responsive unit to pages that do not already carry portal ad slots.
  if (!document.querySelector("ins.adsbygoogle")) {
    const wrap = document.createElement("div");
    wrap.className = "xp-ad";
    wrap.innerHTML = `<div class="xp-ad-label">Advertisement</div>
      <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0646320966060599"
        data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    document.body.appendChild(wrap);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
  }
})();
