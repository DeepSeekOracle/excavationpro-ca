/* LYGO sources guard — HTTPS public hosts only. User-paste allowed; no private IP. */
(function (root) {
  "use strict";
  const BLOCK_SCHEMES = /^(javascript|data|vbscript|file|blob):/i;
  const PRIVATE_V4 = /^(127\.|10\.|192\.168\.|169\.254\.|0\.|255\.)/;

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c];
    });
  }

  function isPrivateHost(host) {
    const h = String(host || "").toLowerCase();
    if (!h) return true;
    if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]") return true;
    if (h.endsWith(".local") || h.endsWith(".internal")) return true;
    if (PRIVATE_V4.test(h)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
    if (/^(100\.64\.|198\.18\.|198\.51\.100\.|203\.0\.113\.)/.test(h)) return true;
    return false;
  }

  function parseHttps(raw, base) {
    const u = String(raw || "").trim();
    if (!u || BLOCK_SCHEMES.test(u.replace(/\s/g, ""))) return null;
    if (u.charAt(0) === "/" && u.charAt(1) !== "/") {
      try {
        return new URL(u, base || (root.location && root.location.origin) || "https://excavationpro.ca");
      } catch (e) {
        return null;
      }
    }
    try {
      const p = new URL(u);
      if (p.protocol !== "https:") return null;
      if (p.username || p.password) return null;
      if (isPrivateHost(p.hostname)) return null;
      return p;
    } catch (e) {
      return null;
    }
  }

  function parseStream(raw, base) {
    const u = String(raw || "").trim();
    if (!u || BLOCK_SCHEMES.test(u.replace(/\s/g, ""))) return null;
    try {
      const p = new URL(u, base || "https://excavationpro.ca");
      if (p.protocol !== "https:" && p.protocol !== "http:") return null;
      if (p.username || p.password) return null;
      if (isPrivateHost(p.hostname)) return null;
      return p;
    } catch (e) {
      return null;
    }
  }

  function safeHref(u) {
    const p = parseHttps(u);
    return p ? p.href : "";
  }

  function allowFetch(u) {
    return !!parseHttps(u);
  }

  root.LYGO_SRC_GUARD = {
    esc: esc,
    safeHref: safeHref,
    allowFetch: allowFetch,
    parseHttps: parseHttps,
    parseStream: parseStream,
    isPrivateHost: isPrivateHost
  };
})(window);
