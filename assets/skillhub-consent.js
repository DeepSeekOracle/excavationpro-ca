(function () {
  var KEY = 'excavationpro_skillhub_ads_v1';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', wait_for_update: 500
  });
  function update(granted) {
    gtag('consent', 'update', {
      ad_storage: granted ? 'granted' : 'denied',
      ad_user_data: granted ? 'granted' : 'denied',
      ad_personalization: granted ? 'granted' : 'denied',
      analytics_storage: granted ? 'granted' : 'denied'
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    var banner = document.getElementById('adConsent');
    var accept = document.getElementById('adAccept');
    var decline = document.getElementById('adDecline');
    function hide() { if (banner) banner.hidden = true; }
    var saved = localStorage.getItem(KEY);
    if (saved === 'yes') { update(true); hide(); }
    else if (saved !== 'no') setTimeout(function () { if (banner) banner.hidden = false; }, 1200);
    if (accept) accept.addEventListener('click', function () { localStorage.setItem(KEY, 'yes'); update(true); hide(); });
    if (decline) decline.addEventListener('click', function () { localStorage.setItem(KEY, 'no'); update(false); hide(); });
  });
})();
