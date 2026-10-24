/* Share controls for the /books/ section: copy-link plus the native sheet where
   the browser has one. Loaded by all five pages of the reading room. */
(function () {
  function closest(el, sel) {
    while (el && el.nodeType === 1) {
      if (el.matches ? el.matches(sel) : false) return el;
      el = el.parentNode;
    }
    return null;
  }

  function flash(btn, text) {
    if (!btn.dataset.original) btn.dataset.original = btn.textContent;
    btn.textContent = text;
    window.setTimeout(function () { btn.textContent = btn.dataset.original; }, 1800);
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyLink(btn) {
    var text = btn.getAttribute("data-share-url") || location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        flash(btn, "Copied");
      }, function () {
        flash(btn, fallbackCopy(text) ? "Copied" : "Copy failed");
      });
      return;
    }
    flash(btn, fallbackCopy(text) ? "Copied" : "Copy failed");
  }

  function nativeShare(btn) {
    var title = document.title;
    var text = btn.getAttribute("data-share-text") || title;
    navigator.share({ title: title, text: text, url: location.href }).catch(function () {});
  }

  document.addEventListener("click", function (e) {
    var copyBtn = closest(e.target, "[data-copy-link]");
    if (copyBtn) {
      e.preventDefault();
      copyLink(copyBtn);
      return;
    }
    var shareBtn = closest(e.target, "[data-native-share]");
    if (shareBtn) {
      e.preventDefault();
      nativeShare(shareBtn);
    }
  });

  var native = document.querySelector("[data-native-share]");
  if (native) {
    if (navigator.share) {
      native.hidden = false;
      native.setAttribute("data-share-text", document.title);
    } else {
      native.parentNode.removeChild(native);
    }
  }
})();
