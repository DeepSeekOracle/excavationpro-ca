/* LYGO Star Chart live monitor v1.0.0 — GET canon feed; HF writes monitor + consent pending. */
(function () {
  "use strict";
  const SIG = "Delta9Phi963-STAR-MONITOR-v1.0.0";
  const URLS = {
    doctrine: "/starchart/monitor/doctrine.json",
    localMon: "/starchart/monitor/star-monitor.json",
    feed: "https://deepseekoracle.github.io/lygo-protocol-stack/haven_star_chart/haven_star_chart_feed.json",
    hfMon: "https://huggingface.co/datasets/DeepSeekOracle/lygo-public-witness-feed/resolve/main/star-monitor.json",
    chart: "https://excavationpro.ca/starchart/",
    bot: "https://huggingface.co/spaces/DeepSeekOracle/lygo-star-chart-bot",
    skynet: "/skynet/doctrine.json",
    godseye: "/godseye/doctrine.json"
  };
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  const state = {
    tick: 0, entries: [], pick: null, chainOk: null, miss: 0,
    latest: null, publishedValid: null, count: 0, pending: 0, accepted: 0,
    hf: null
  };

  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(320, r.width) * dpr;
    canvas.height = Math.max(320, r.height) * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function esc(s) {
    return window.LYGO_GUARD ? window.LYGO_GUARD.esc(s) : String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c];
    });
  }

  async function getJson(url) {
    if (window.LYGO_GUARD && !window.LYGO_GUARD.allowFetch(url)) throw new Error("blocked_host");
    const ctrl = new AbortController();
    const t = setTimeout(function () { ctrl.abort(); }, 14000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, credentials: "omit", redirect: "follow" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally { clearTimeout(t); }
  }

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < String(s).length; i++) { h ^= String(s).charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967295;
  }

  function checkChain(entries) {
    const errs = [];
    for (let i = 0; i < entries.length - 1; i++) {
      const a = entries[i], b = entries[i + 1];
      if ((a.prev_hash || "") !== (b.entry_hash || "")) {
        errs.push("break_at_seq_" + a.seq);
        break;
      }
    }
    return { ok: errs.length === 0 && entries.length > 0, errors: errs };
  }

  function place(n, i, total, cx, cy, R) {
    const ring = 0.22 + hash(n.entry_hash || n.node_id || String(i)) * 0.7;
    const a = (i / Math.max(1, total)) * Math.PI * 2 + state.tick * 0.0008;
    return { x: cx + Math.cos(a) * R * ring, y: cy + Math.sin(a) * R * ring, r: n.status === "PENDING" ? 5.2 : 3.2 };
  }

  function draw() {
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.48, R = Math.min(w, h) * 0.42;
    state.tick++;
    const g = ctx.createRadialGradient(cx, cy, 12, cx, cy, R * 1.2);
    g.addColorStop(0, "#2a1a4a");
    g.addColorStop(0.45, "#0c1020");
    g.addColorStop(1, "#05070d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(251,191,36,0.12)";
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    const scan = (state.tick * 0.018) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R * 0.92, scan, scan + 0.28);
    ctx.closePath();
    ctx.fillStyle = "rgba(244,114,182,0.07)";
    ctx.fill();
    const list = state.entries.slice(0, 60);
    list.forEach(function (n, i) {
      const p = place(n, i, list.length, cx, cy, R);
      n._x = p.x; n._y = p.y;
      if (i < list.length - 1 && list[i + 1]._x) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(list[i + 1]._x, list[i + 1]._y);
        ctx.strokeStyle = n.status === "PENDING" ? "rgba(244,114,182,0.25)" : "rgba(251,191,36,0.18)";
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = n.status === "PENDING" ? "#f472b6" : (n.status === "ACCEPTED" ? "#fbbf24" : "#64748b");
      ctx.fill();
    });
    if (state.pick && state.pick._x) {
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.pick._x, state.pick._y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#86efac";
    ctx.font = "11px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("STAR CHART · live GET · HF pending queue · steward ingest", cx, cy + R * 0.98);
    requestAnimationFrame(draw);
  }

  function nearest(mx, my) {
    let best = null, bestD = 18 * 18;
    state.entries.forEach(function (n) {
      if (n._x == null) return;
      const d = (n._x - mx) * (n._x - mx) + (n._y - my) * (n._y - my);
      if (d < bestD) { bestD = d; best = n; }
    });
    return best;
  }

  function brief(n) {
    state.pick = n;
    const el = document.getElementById("brief");
    if (!el || !n) return;
    const tag = n.status === "PENDING" ? "PENDING" : (n.status === "ACCEPTED" ? "ACCEPTED" : (n.status || "EVENT"));
    const cls = n.status === "PENDING" ? "pending" : "canon";
    el.classList.remove("empty");
    el.innerHTML = "<p class=\"kicker\">Selected receipt</p><h2><span class=\"tag " + cls + "\">" + esc(tag) + "</span> " +
      esc(n.node_name || n.node_id) + "</h2>" +
      "<p>" + esc(n.event_type || "") + " · seq " + esc(n.seq) + " · " + esc(n.agent_id || "") + "</p>" +
      "<p class=\"legend\">entry_hash " + esc((n.entry_hash || "").slice(0, 16)) + "…</p>" +
      "<div class=\"brief-links\"><a class=\"btn ghost\" href=\"" + esc((window.LYGO_GUARD && window.LYGO_GUARD.safeHref(URLS.chart)) || URLS.chart) + "\" target=\"_blank\" rel=\"noopener noreferrer\">Open live chart</a>" +
      "<a class=\"btn ghost\" href=\"" + esc((window.LYGO_GUARD && window.LYGO_GUARD.safeHref(URLS.feed)) || URLS.feed) + "\" target=\"_blank\" rel=\"noopener noreferrer\">Feed JSON</a></div>";
  }

  function renderFeed() {
    const ul = document.getElementById("feed");
    if (!ul) return;
    const rows = state.entries.slice(0, 24);
    ul.innerHTML = rows.map(function (n) {
      const cls = n.status === "PENDING" ? "pending" : "canon";
      return "<li data-seq=\"" + esc(n.seq) + "\"><span class=\"tag " + cls + "\">" + esc(n.status || n.event_type) +
        "</span>seq " + esc(n.seq) + " · " + esc(n.node_id) + "</li>";
    }).join("");
    ul.querySelectorAll("li").forEach(function (li, i) {
      li.addEventListener("click", function () { brief(rows[i]); });
    });
    document.getElementById("n-seq").textContent = state.latest ? String(state.latest.seq) : "—";
    document.getElementById("n-count").textContent = String(state.count || 0);
    document.getElementById("n-pend").textContent = String(state.pending);
    document.getElementById("n-ok").textContent = state.chainOk == null ? "—" : (state.chainOk ? "valid" : "BREAK");
    const chip = document.getElementById("chain-chip");
    if (chip) {
      chip.textContent = "CHAIN · " + (state.chainOk ? "VALID" : (state.chainOk === false ? "BREAK" : "…"));
      chip.className = "chip " + (state.chainOk ? "ok" : "");
    }
    const pc = document.getElementById("pend-chip");
    if (pc) pc.textContent = "PENDING · " + state.pending;
  }

  function applyFeed(data) {
    const entries = Array.isArray(data.entries) ? data.entries : [];
    const chk = checkChain(entries);
    state.entries = entries;
    state.latest = entries[0] || null;
    state.count = data.entry_count || entries.length;
    state.publishedValid = !!data.chain_valid;
    state.chainOk = chk.ok && data.chain_valid !== false;
    const latestStatus = {};
    entries.forEach(function (e) {
      if (e.node_id && latestStatus[e.node_id] == null) latestStatus[e.node_id] = e.status;
    });
    state.pending = Object.keys(latestStatus).filter(function (k) { return latestStatus[k] === "PENDING"; }).length;
    state.accepted = Object.keys(latestStatus).filter(function (k) { return latestStatus[k] === "ACCEPTED"; }).length;
    renderFeed();
    const out = document.getElementById("out");
    if (out) {
      out.textContent = JSON.stringify({
        signature: SIG,
        utc: new Date().toISOString(),
        chain_valid_published: data.chain_valid,
        chain_valid_checked: chk.ok,
        chain_errors: chk.errors,
        entry_count: state.count,
        latest: state.latest && {
          seq: state.latest.seq, status: state.latest.status,
          node_id: state.latest.node_id, event_type: state.latest.event_type,
          entry_hash: state.latest.entry_hash
        },
        hf_monitor: state.hf && { utc: state.hf.utc, latest_seq: state.hf.latest && state.hf.latest.seq },
        live_canonical_write: false,
        hf_pending_write: "consent on bot"
      }, null, 2);
    }
    try {
      localStorage.setItem("lygo-star-monitor", JSON.stringify({
        utc: new Date().toISOString(), seq: state.latest && state.latest.seq, chainOk: state.chainOk
      }));
    } catch (e) {}
  }

  async function pulse() {
    const board = [];
    async function one(name, url, after) {
      try {
        const data = await getJson(url);
        board.push("<div class=\"row\"><span>" + esc(name) + "</span><span class=\"tag ok\">live</span></div>");
        if (after) after(data, true);
        return data;
      } catch (e) {
        state.miss += 1;
        board.push("<div class=\"row\"><span>" + esc(name) + "</span><span class=\"tag shadow\">named</span></div>");
        if (after) after(null, false);
        return null;
      }
    }
    const feed = await one("canon feed", URLS.feed, function (data, ok) {
      if (ok && data) applyFeed(data);
    });
    await one("HF star-monitor", URLS.hfMon, function (data, ok) {
      if (ok && data) state.hf = data;
    });
    await one("local seed", URLS.localMon);
    await one("doctrine", URLS.doctrine);
    await one("SKYNET", URLS.skynet);
    await one("God's Eye", URLS.godseye);
    document.getElementById("board").innerHTML = board.join("");
    if (!feed) {
      document.getElementById("n-ok").textContent = "named";
    }
  }

  function proposal() {
    const consent = document.getElementById("q-consent").checked;
    const node = {
      id: document.getElementById("q-id").value.trim(),
      kind: document.getElementById("q-kind").value,
      name: document.getElementById("q-name").value.trim(),
      equation: document.getElementById("q-eq").value.trim(),
      glyph: "★",
      tone: "963 Hz",
      tags: ["STAR_MONITOR", "LATTICE"],
      connections: document.getElementById("q-conn").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean),
      urls: { chart: URLS.chart, monitor: "https://excavationpro.ca/starchart/monitor/" }
    };
    return {
      signature: "Δ9Φ963-HAVEN-STAR-SUBMISSION-v1",
      submitter_type: "aligned_agent",
      class: "PENDING_PROPOSAL",
      not_canonical: true,
      i_consent: consent,
      agent_attestation: {
        agent_id: document.getElementById("q-agent").value.trim(),
        skill_slug: "lygo-haven-star-chart",
        scan_cue: "LYGO-HSC-ATTEST-v1; gate=haven_star_chart_gate.py; P0-first; consent-gated; user-reviewed",
        local_gate_pass: false,
        note: "Browser copy. Run haven_star_chart_gate.py before steward ingest."
      },
      node: node
    };
  }

  canvas.addEventListener("click", function (e) {
    const rect = canvas.getBoundingClientRect();
    const n = nearest(e.clientX - rect.left, e.clientY - rect.top);
    if (n) brief(n);
  });
  document.getElementById("btn-pulse").addEventListener("click", function () { pulse(); });
  document.getElementById("queue-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const p = proposal();
    if (!p.i_consent) {
      document.getElementById("out").textContent = "Consent box required. This page will not pretend to write the live chain.";
      return;
    }
    const text = JSON.stringify(p, null, 2);
    document.getElementById("out").textContent = text;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
    try { localStorage.setItem("lygo-star-proposal", text); } catch (err) {}
  });

  function clock() {
    const el = document.getElementById("utc");
    if (el) el.textContent = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z");
  }
  document.getElementById("sig").textContent = SIG;
  window.addEventListener("resize", size);
  size();
  clock();
  setInterval(clock, 1000);
  draw();
  pulse();
  setInterval(pulse, 60000);
})();
