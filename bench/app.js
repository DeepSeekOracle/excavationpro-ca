/* LYGO Bench — HTTPS GET card, local hash, local redact. No POST. No chart write. */
(function () {
  "use strict";
  const SIG = "Delta9Phi963-LYGO-BENCH-v1.0.0";
  const MAX_BODY = 400000;
  const MAX_HASH = 8000000;
  const PRESETS = [
    { id: "join", url: "https://excavationpro.ca/join/" },
    { id: "lattice", url: "https://excavationpro.ca/lattice/" },
    { id: "tv", url: "https://excavationpro.ca/sources/" },
    { id: "pages", url: "https://deepseekoracle.github.io/lygo-protocol-stack/" },
    { id: "anchors", url: "https://deepseekoracle.github.io/lygo-protocol-stack/network_builder/IMMUTABLE_ANCHORS.json" },
    { id: "feed", url: "https://deepseekoracle.github.io/lygo-protocol-stack/haven_star_chart/haven_star_chart_feed.json" },
    { id: "agora", url: "https://deepseekoracle.github.io/lygo-protocol-stack/agent-agora/api/pulse.json" }
  ];
  const SECRET = [
    ["openai_sk", /\bsk-[A-Za-z0-9]{20,}\b/g],
    ["anthropic_key", /\bsk-ant-[A-Za-z0-9\-_]{20,}\b/g],
    ["xai_key", /\bxai-[A-Za-z0-9]{20,}\b/g],
    ["hf_token", /\bhf_[A-Za-z0-9]{20,}\b/g],
    ["github_pat", /\bghp_[A-Za-z0-9]{20,}\b/g],
    ["github_fine", /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g],
    ["aws_access", /\bAKIA[0-9A-Z]{16}\b/g],
    ["slack", /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g],
    ["bearer", /bearer\s+[A-Za-z0-9\-._~+/]+=*/gi],
    ["generic_api_key", /(api[_-]?key|access[_-]?token|secret[_-]?key)\s*[=:]\s*['"]?[^\s'"]{16,}/gi],
    ["private_key_block", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
    ["jwt", /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g],
    ["password_assign", /(password|passwd|pwd)\s*[=:]\s*['"]?[^\s'"]{6,}/gi]
  ];

  const $ = function (id) { return document.getElementById(id); };

  function utcNow() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  }

  function hex(buf) {
    const a = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < a.length; i++) s += a[i].toString(16).padStart(2, "0");
    return s;
  }

  async function sha256(buf) {
    const d = await crypto.subtle.digest("SHA-256", buf);
    return hex(d);
  }

  function isPrivateHost(host) {
    const h = String(host || "").toLowerCase().replace(/^\[|\]$/g, "");
    if (!h || h === "localhost" || h === "::1" || h.endsWith(".local") || h.endsWith(".internal")) return true;
    const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (!m) return false;
    const a = +m[1], b = +m[2];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }

  function allowUrl(raw) {
    try {
      const u = new URL(String(raw || "").trim());
      if (u.protocol !== "https:") return { ok: false, error: "https_only" };
      if (u.username || u.password) return { ok: false, error: "userinfo_blocked" };
      if (isPrivateHost(u.hostname)) return { ok: false, error: "private_host" };
      return { ok: true, url: u.href };
    } catch (e) {
      return { ok: false, error: "bad_url" };
    }
  }

  function parseHtml(text) {
    const doc = new DOMParser().parseFromString(text, "text/html");
    const title = (doc.querySelector("title") && doc.querySelector("title").textContent || "").replace(/\s+/g, " ").trim().slice(0, 240);
    let desc = "";
    let htmlCsp = null;
    let htmlRef = null;
    doc.querySelectorAll("meta").forEach(function (m) {
      const name = (m.getAttribute("name") || m.getAttribute("property") || "").toLowerCase();
      const equiv = (m.getAttribute("http-equiv") || "").toLowerCase();
      const c = (m.getAttribute("content") || "").trim();
      if (!c) return;
      if (name === "description" || (name === "og:description" && !desc)) desc = c.slice(0, 400);
      if (equiv === "content-security-policy") htmlCsp = c.slice(0, 500);
      if (name === "referrer") htmlRef = c.slice(0, 120);
    });
    const can = doc.querySelector("link[rel='canonical']");
    const types = [];
    doc.querySelectorAll("script[type='application/ld+json']").forEach(function (s) {
      try {
        const obj = JSON.parse(s.textContent || "");
        const rows = Array.isArray(obj) ? obj : [obj];
        rows.forEach(function (row) {
          if (row && row["@type"]) types.push(String(row["@type"]));
        });
      } catch (e) {}
    });
    return {
      title: title || null,
      description: desc || null,
      canonical: can ? can.getAttribute("href") : null,
      json_ld_types: types.slice(0, 8),
      html_csp: htmlCsp,
      html_referrer: htmlRef
    };
  }

  function headerMap(headers) {
    const keys = [
      "content-security-policy", "content-security-policy-report-only",
      "strict-transport-security", "x-frame-options", "x-content-type-options",
      "referrer-policy", "permissions-policy", "cross-origin-opener-policy",
      "content-type", "cache-control", "access-control-allow-origin"
    ];
    const out = {};
    keys.forEach(function (k) {
      out[k] = headers.get(k);
    });
    return out;
  }

  function yieldCard(card) {
    if (!card.ok) return "SHADOW";
    const hdr = card.security_headers || {};
    const hasCsp = !!(hdr["content-security-policy"] || hdr["content-security-policy-report-only"]);
    const hasRef = !!hdr["referrer-policy"];
    if (card.status !== 200 || !card.title) return "DRIFT";
    if (!hasCsp && !hasRef) return "DRIFT";
    return "ALIGNED";
  }

  async function cardFromBody(url, status, headers, buf, ok, error) {
    const sample = buf && buf.byteLength > MAX_BODY ? buf.slice(0, MAX_BODY) : (buf || new ArrayBuffer(0));
    const bytes = buf ? buf.byteLength : 0;
    let parsed = { title: null, description: null, canonical: null, json_ld_types: [], html_csp: null, html_referrer: null };
    const ct = headers && headers.get ? (headers.get("content-type") || "") : "";
    if (ok && sample.byteLength) {
      const text = new TextDecoder("utf-8").decode(sample);
      if (/html/i.test(ct) || /<html/i.test(text.slice(0, 800))) parsed = parseHtml(text);
      else if (/json/i.test(ct) || /^\s*[{\[]/.test(text)) {
        try {
          const data = JSON.parse(text);
          parsed.title = data.name || data.title || data.signature || url.split("/").pop();
          parsed.description = data.description || data.doctrine && data.doctrine.is || null;
        } catch (e) {}
      }
    }
    const hdr = headers ? headerMap(headers) : {};
    if (!hdr["content-security-policy"] && parsed.html_csp) hdr["content-security-policy"] = "meta " + parsed.html_csp.slice(0, 240);
    if (!hdr["referrer-policy"] && parsed.html_referrer) hdr["referrer-policy"] = "meta " + parsed.html_referrer;
    const out = {
      signature: SIG,
      command: "card",
      utc: utcNow(),
      ok: ok,
      url: url,
      status: status,
      error: error || null,
      bytes: bytes,
      sha256: sample.byteLength ? await sha256(sample) : null,
      title: parsed.title,
      description: parsed.description,
      canonical: parsed.canonical,
      json_ld_types: parsed.json_ld_types,
      security_headers: hdr,
      live_star_chart_write: false
    };
    out.yield = yieldCard(out);
    return out;
  }

  async function fetchCard(url, withCompanions) {
    const gate = allowUrl(url);
    if (!gate.ok) {
      return cardFromBody(url, 0, null, null, false, gate.error);
    }
    try {
      const r = await fetch(gate.url, { method: "GET", credentials: "omit", cache: "no-store" });
      const buf = await r.arrayBuffer();
      const card = await cardFromBody(r.url || gate.url, r.status, r.headers, buf, r.status >= 200 && r.status < 400, null);
      if (withCompanions) {
        const origin = new URL(gate.url).origin;
        card.companions = {};
        const paths = ["/.well-known/security.txt", "/security.txt", "/robots.txt"];
        for (let i = 0; i < paths.length; i++) {
          const u = origin + paths[i];
          try {
            const c = await fetch(u, { method: "GET", credentials: "omit", cache: "no-store" });
            card.companions[paths[i]] = { ok: c.status === 200, status: c.status, url: u };
          } catch (e) {
            card.companions[paths[i]] = { ok: false, status: 0, url: u, error: "cors_or_network" };
          }
        }
      }
      return card;
    } catch (e) {
      return cardFromBody(gate.url, 0, null, null, false, "cors_or_network");
    }
  }

  function paintCard(card) {
    const y = card.yield;
    $("c-yield").textContent = y;
    $("c-yield-box").className = "stat " + y.toLowerCase();
    $("c-status").textContent = card.status || "—";
    $("c-bytes").textContent = String(card.bytes || 0);
    $("c-sha").textContent = card.sha256 ? card.sha256.slice(0, 16) : "—";
    $("card-out").textContent = JSON.stringify(card, null, 2);
    $("status").textContent = card.ok
      ? ("Card " + y + (card.error ? "" : "."))
      : ("SHADOW · " + (card.error || "miss"));
  }

  async function runCard(url) {
    $("status").innerHTML = "<span class=\"spin\"></span> GET…";
    const card = await fetchCard(url, $("companions").checked);
    paintCard(card);
    return card;
  }

  async function cardFile(file) {
    if (!file) return;
    $("status").innerHTML = "<span class=\"spin\"></span> Read local HTML…";
    const buf = await file.arrayBuffer();
    const fakeHeaders = { get: function () { return file.type || "text/html"; } };
    const card = await cardFromBody("file:" + file.name, 200, fakeHeaders, buf, true, null);
    card.source = "local_file";
    card.filename = file.name;
    paintCard(card);
  }

  function redact(text) {
    let out = text;
    const hits = [];
    SECRET.forEach(function (pair) {
      const name = pair[0];
      const rx = pair[1];
      rx.lastIndex = 0;
      const found = out.match(rx);
      if (!found) return;
      hits.push({ pattern: name, count: found.length });
      out = out.replace(rx, "[REDACTED:" + name + "]");
    });
    const chars = text.length;
    const words = (text.match(/\S+/g) || []).length;
    const est = Math.max(Math.round(chars / 4), Math.round(words / 0.75) || 0);
    return { redacted: out, hits: hits, total_hits: hits.reduce(function (n, h) { return n + h.count; }, 0), tokens_estimate: est, chars: chars };
  }

  function copy(id) {
    const t = $(id).textContent || $(id).value || "";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { $("status").textContent = "Copied."; }).catch(function () { window.prompt("Copy:", t); });
    } else window.prompt("Copy:", t);
  }

  function showTab(name) {
    ["card", "compare", "hash", "redact"].forEach(function (t) {
      $("panel-" + t).classList.toggle("on", t === name);
      $("tab-" + t).classList.toggle("on", t === name);
    });
  }

  $("tab-card").addEventListener("click", function () { showTab("card"); });
  $("tab-compare").addEventListener("click", function () { showTab("compare"); });
  $("tab-hash").addEventListener("click", function () { showTab("hash"); });
  $("tab-redact").addEventListener("click", function () { showTab("redact"); });

  $("go-card").addEventListener("click", function () { runCard($("url").value); });
  $("copy-card").addEventListener("click", function () { copy("card-out"); });
  function addChip(id, url) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = id;
    b.addEventListener("click", function () {
      $("url").value = url;
      runCard(url);
    });
    $("presets").appendChild(b);
  }
  PRESETS.forEach(function (p) { addChip(p.id, p.url); });
  fetch("/lattice/map.json", { credentials: "omit", cache: "no-store" }).then(function (r) {
    return r.ok ? r.json() : null;
  }).then(function (map) {
    if (!map || !map.doors) return;
    const have = {};
    PRESETS.forEach(function (p) { have[p.url] = true; });
    map.doors.forEach(function (d) {
      if (!d.url || have[d.url]) return;
      if (d.class === "CANON") return;
      have[d.url] = true;
      addChip(d.id, d.url);
    });
  }).catch(function () {});

  const drop = $("drop");
  drop.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add("hot"); });
  drop.addEventListener("dragleave", function () { drop.classList.remove("hot"); });
  drop.addEventListener("drop", function (e) {
    e.preventDefault();
    drop.classList.remove("hot");
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) cardFile(f);
  });
  $("file-card").addEventListener("change", function (e) {
    const f = e.target.files && e.target.files[0];
    if (f) cardFile(f);
  });

  $("go-hash").addEventListener("click", async function () {
    const t = $("hash-in").value || "";
    const buf = new TextEncoder().encode(t);
    if (buf.byteLength > MAX_HASH) {
      $("hash-out").textContent = "Too large (cap " + MAX_HASH + " bytes).";
      return;
    }
    const d = await sha256(buf);
    $("hash-out").textContent = JSON.stringify({
      signature: SIG, command: "hash", utc: utcNow(), bytes: buf.byteLength, sha256: d, source: "text"
    }, null, 2);
    $("h-sha").textContent = d.slice(0, 16);
    $("h-bytes").textContent = String(buf.byteLength);
  });
  $("copy-hash").addEventListener("click", function () { copy("hash-out"); });
  $("file-hash").addEventListener("change", async function (e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > MAX_HASH) {
      $("hash-out").textContent = "Too large (cap " + MAX_HASH + " bytes).";
      return;
    }
    const buf = await f.arrayBuffer();
    const d = await sha256(buf);
    $("hash-out").textContent = JSON.stringify({
      signature: SIG, command: "hash", utc: utcNow(), bytes: buf.byteLength, sha256: d, source: "file", filename: f.name
    }, null, 2);
    $("h-sha").textContent = d.slice(0, 16);
    $("h-bytes").textContent = String(buf.byteLength);
  });

  $("go-compare").addEventListener("click", async function () {
    $("status").innerHTML = "<span class=\"spin\"></span> Compare…";
    const a = await fetchCard($("url-a").value, false);
    const b = await fetchCard($("url-b").value, false);
    $("a-yield").textContent = a.yield;
    $("b-yield").textContent = b.yield;
    $("a-yield-box").className = "stat " + String(a.yield).toLowerCase();
    $("b-yield-box").className = "stat " + String(b.yield).toLowerCase();
    $("ab-same").textContent = a.yield === b.yield ? "YES" : "NO";
    $("compare-out").textContent = JSON.stringify({
      signature: SIG,
      command: "compare",
      utc: utcNow(),
      a: a,
      b: b,
      same_yield: a.yield === b.yield,
      live_star_chart_write: false
    }, null, 2);
    $("status").textContent = "A " + a.yield + " · B " + b.yield;
  });
  $("copy-compare").addEventListener("click", function () { copy("compare-out"); });

  $("go-redact").addEventListener("click", function () {
    const r = redact($("redact-in").value || "");
    $("redact-out").value = r.redacted;
    $("r-hits").textContent = String(r.total_hits);
    $("r-tok").textContent = String(r.tokens_estimate);
    $("r-chars").textContent = String(r.chars);
    $("status").textContent = r.total_hits ? (r.total_hits + " secret hits redacted.") : "No listed secret patterns.";
  });
  $("copy-redact").addEventListener("click", function () {
    const t = $("redact-out").value || "";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { $("status").textContent = "Copied redacted text."; });
    }
  });

  $("utc").textContent = utcNow();
  $("url").value = "https://excavationpro.ca/join/";
  runCard($("url").value);
})();
