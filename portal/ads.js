(function () {
  function pushUnits() {
    document.querySelectorAll('ins.adsbygoogle').forEach(function (el) {
      if (el.getAttribute('data-adsbygoogle-status')) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        el.setAttribute('data-adsbygoogle-status', 'done');
      } catch (e) { /* no-op */ }
    });
  }
  function markReady() {
    setTimeout(function () {
      document.querySelectorAll('.ad-slot').forEach(function (el) { el.classList.add('ads-ready'); });
    }, 4500);
  }
  function start() { pushUnits(); markReady(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
