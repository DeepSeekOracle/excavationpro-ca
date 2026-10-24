/* LYGO fetch/href guard — HTTPS allowlist, no javascript: hrefs. */
(function (root) {
  "use strict";
  const FETCH_HOSTS = [
    "deepseekoracle.github.io",
    "raw.githubusercontent.com",
    "chatagent.ca",
    "www.chatagent.ca",
    "asiancoastline.com",
    "eternalhaven.ca",
    "bpmfinder.ca",
    "clawhub.ai"
  ];
  const BLOCK_SCHEMES = /^(javascript|data|vbscript|file|blob):/i;

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c];
    });
  }

  function safeHref(u) {
    const raw = String(u || "").trim();
    if (!raw || BLOCK_SCHEMES.test(raw.replace(/\s/g, ""))) return "";
    if (raw.charAt(0) === "/" && raw.charAt(1) !== "/") return raw;
    try {
      const p = new URL(raw, (root.location && root.location.origin) || "https://excavationpro.ca");
      if (p.protocol !== "https:" && p.protocol !== "http:") return "";
      if (p.username || p.password) return "";
      return p.href;
    } catch (e) {
      return "";
    }
  }

  function allowFetch(u) {
    const raw = String(u || "").trim();
    if (!raw || BLOCK_SCHEMES.test(raw.replace(/\s/g, ""))) return false;
    if (raw.charAt(0) === "/" && raw.charAt(1) !== "/") return true;
    try {
      const p = new URL(raw, (root.location && root.location.origin) || "https://excavationpro.ca");
      if (p.protocol !== "https:") return false;
      if (p.username || p.password) return false;
      const host = (p.hostname || "").toLowerCase();
      return FETCH_HOSTS.indexOf(host) !== -1;
    } catch (e) {
      return false;
    }
  }

  root.LYGO_GUARD = { esc: esc, safeHref: safeHref, allowFetch: allowFetch, FETCH_HOSTS: FETCH_HOSTS };
})(window);
