(() => {
  "use strict";
  const pages = [
    ["index.html", "Vault Home"],
    ["seals.html", "Seal Index"],
    ["chat-archive.html", "Grok / Chat Archive"],
    ["gallery.html", "Gallery"],
    ["deadman.html", "Deadman"],
    ["whitepapers.html", "Whitepapers"],
    ["multi-ai-canon.html", "Multi-AI Canon"],
    ["qd-theory.html", "QD Theory"],
    ["pure-data.html", "Pure Data"],
    ["register.html", "Register"],
    ["stack-hub.html", "Stack Hub"],
    ["link-ledger.html", "Link Ledger"]
  ];
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.body.classList.add("vault-fork");

  const bar = document.createElement("header");
  bar.className = "forkbar";
  bar.innerHTML = `<div class="forkbar-inner">
    <a class="fork-brand" href="index.html">Excavationpro <span>Vault</span></a>
    <nav aria-label="Vault pages">${pages.map(([href, label]) =>
      `<a href="${href}" class="${href.toLowerCase() === current ? "fork-on" : ""}">${label}</a>`).join("")}</nav>
    <a class="fork-back" href="https://excavationpro.ca/">excavationpro.ca ↗</a>
  </div>`;
  document.body.insertBefore(bar, document.body.firstChild);

  const wrap = document.querySelector(".wrap") || document.body;
  const ad = document.createElement("div");
  ad.className = "fork-ad";
  ad.innerHTML = `<div class="ad-label">Advertisement</div>
    <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0646320966060599"
      data-ad-format="auto" data-full-width-responsive="true"></ins>`;
  wrap.insertBefore(ad, wrap.firstChild);

  const footer = document.createElement("footer");
  footer.className = "fork-footer";
  footer.innerHTML = `<div><strong>Excavationpro Vault</strong> · forked from the LYGO Data Vault · <a href="privacy.html">privacy</a> · <a href="https://excavationpro.ca/">domain home ↗</a></div>
    <div class="fork-domains"><a href="https://eternalhaven.ca">eternalhaven.ca</a><a href="https://excavationpro.ca">excavationpro.ca</a><a href="https://deepseekoracle.com">deepseekoracle.com</a><a href="https://chatagent.ca">chatagent.ca</a><a href="https://asiancoastline.com">asiancoastline.com</a><a href="https://bpmfinder.ca">bpmfinder.ca</a></div>`;
  document.body.appendChild(footer);

  const ad2 = document.createElement("div");
  ad2.className = "fork-ad bottom";
  ad2.innerHTML = `<div class="ad-label">Advertisement</div>
    <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0646320966060599"
      data-ad-format="auto" data-full-width-responsive="true"></ins>`;
  wrap.appendChild(ad2);

  // Push each unit after insertion.
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
})();
