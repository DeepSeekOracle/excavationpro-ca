(function () {
  var KEY = 'lygo_tv_ads_consent_v1';
  var SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0646320966060599';
  var banner = document.getElementById('adConsent');
  var slots = Array.prototype.slice.call(document.querySelectorAll('.ad-slot'));

  function markReady() {
    setTimeout(function () {
      slots.forEach(function (el) { el.classList.add('ads-ready'); });
    }, 4500);
  }
  function pushUnits() {
    document.querySelectorAll('ins.adsbygoogle').forEach(function (el) {
      if (el.getAttribute('data-adsbygoogle-status')) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        el.setAttribute('data-adsbygoogle-status', 'done');
      } catch (e) { /* no-op */ }
    });
  }
  function loadAds() {
    if (window.__lygoTvAdsLoaded) return;
    window.__lygoTvAdsLoaded = true;
    slots.forEach(function (el) { el.classList.add('ads-visible'); });
    if (document.querySelector('script[src*="adsbygoogle.js"]')) {
      pushUnits();
      markReady();
      return;
    }
    var s = document.createElement('script');
    s.async = true;
    s.src = SRC;
    s.crossOrigin = 'anonymous';
    s.onload = function () { pushUnits(); markReady(); };
    s.onerror = markReady;
    document.head.appendChild(s);
  }
  function hideBanner() { if (banner) banner.hidden = true; }

  var saved = localStorage.getItem(KEY);
  if (saved === 'yes') {
    loadAds();
  } else if (saved !== 'no') {
    setTimeout(function () { if (banner) banner.hidden = false; }, 1200);
  }

  var accept = document.getElementById('adAccept');
  var decline = document.getElementById('adDecline');
  if (accept) accept.addEventListener('click', function () {
    localStorage.setItem(KEY, 'yes'); hideBanner(); loadAds();
  });
  if (decline) decline.addEventListener('click', function () {
    localStorage.setItem(KEY, 'no'); hideBanner();
  });
})();
