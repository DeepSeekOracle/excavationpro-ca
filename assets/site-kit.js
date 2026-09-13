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
