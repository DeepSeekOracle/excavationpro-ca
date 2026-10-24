/* LYGO SKYNET v1.1.0 — lattice-wired AETHONΔ9 sentinel. No live Star Chart write. */
(function () {
  "use strict";
  const SIG = "Delta9Phi963-LYGO-SKYNET-v1.1.0";
  const STALE_DAYS = 10;
  const NEWS = "/witness/news-monitor.json";
  const SLOTS = "/lattice/slots.json";
  const KERNEL = "/lattice/doctrine.json";
  const MAP = "/lattice/map.json";
  const HF_PULSE = "https://huggingface.co/datasets/DeepSeekOracle/lygo-public-witness-feed/resolve/main/skynet-pulse.json";
  const canvas = document.getElementById("net");
  const ctx = canvas.getContext("2d");
  const LIMBS = [
    { id: "PULSE", title: "PULSE", why: "Allowlisted HTTPS GET of every lattice kernel slot.", url: "/lattice/" },
    { id: "AETHON", title: "AETHONΔ9", why: "Discourse heuristics on public Witness titles. Not identity.", url: "/skynet/" },
    { id: "YIELD", title: "YIELD", why: "ALIGNED / REVIEW / SHADOW from kernel health + AETHON. Human remains publisher.", url: "/lattice/" },
    { id: "WIRE", title: "WIRE", why: "Lattice kernel + God's Eye + Witness + Agora + Haven Star Chart.", url: "/godseye/" }
  ];
  const state = {
    tick: 0, yield: "ALIGNED", latticeYield: "…",
    live: 0, miss: 0, future: 0, queue: [], board: [],
    maxOps: 0, pick: null, lastPulse: null,
    slots: [], results: {}, extras: {}, claims: [], hf: null
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

  async function getAny(url) {
    if (window.LYGO_GUARD && !window.LYGO_GUARD.allowFetch(url)) {
      return { ok: false, status: 0, json: null, text: "blocked_host", bytes: 0 };
    }
    const ctrl = new AbortController();
    const t = setTimeout(function () { ctrl.abort(); }, 14000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, credentials: "omit", redirect: "follow" });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (e) { json = null; }
      return { ok: res.ok, status: res.status, json: json, text: text.slice(0, 400), bytes: text.length };
    } finally { clearTimeout(t); }
  }

  function ringOf(s) {
    if (!s) return "canon";
    if (s.class === "FUTURE" || s.era === "future") return "future";
    if (s.class === "RESOURCE") return "resource";
    return "canon";
  }

  function hex(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function limbPos(i, cx, cy, R) {
    const a = -Math.PI / 2 + (i * Math.PI) / 2 + state.tick * 0.002;
    return { x: cx + Math.cos(a) * R * 0.48, y: cy + Math.sin(a) * R * 0.48 };
  }

  function draw() {
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.48, R = Math.min(w, h) * 0.4;
    state.tick++;
    const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, R * 1.2);
    g.addColorStop(0, "#14220c");
    g.addColorStop(1, "#05070d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(52,211,153,0.15)";
    ctx.lineWidth = 1;
    for (let r = 0.2; r <= 1; r += 0.2) {
      hex(cx, cy, R * r);
      ctx.stroke();
    }
    const slots = state.slots || [];
    slots.forEach(function (s, i) {
      const a = (i / Math.max(1, slots.length)) * Math.PI * 2 + state.tick * 0.0012;
      const rr = R * 0.86;
      const p = { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
      s._sx = p.x; s._sy = p.y;
      const res = state.results[s.id];
      const ring = ringOf(s);
      ctx.beginPath();
      ctx.arc(p.x, p.y, ring === "canon" ? 4.5 : 3.5, 0, Math.PI * 2);
      if (ring === "future") {
        ctx.strokeStyle = "#67e8f9";
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (res && res.live) { ctx.fillStyle = "#67e8f9"; ctx.fill(); }
      } else if (res && res.live) {
        ctx.fillStyle = ring === "canon" ? "#fbbf24" : "#f59e0b";
        ctx.fill();
      } else if (res && res.live === false) {
        ctx.strokeStyle = "#a78bfa";
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = "#334155";
        ctx.fill();
      }
    });
    LIMBS.forEach(function (L, i) {
      const p = limbPos(i, cx, cy, R);
      L._x = p.x; L._y = p.y;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = "rgba(251,191,36,0.35)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      hex(p.x, p.y, 26);
      ctx.fillStyle = "#0b1220";
      ctx.fill();
      ctx.strokeStyle = i === 2 && state.yield !== "ALIGNED" ? "#a78bfa" : "#34d399";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "10px IBM Plex Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(L.title, p.x, p.y + 4);
    });
    hex(cx, cy, 36);
    ctx.fillStyle = state.yield === "SHADOW" ? "#c4b5fd" : (state.yield === "REVIEW" ? "#fbbf24" : "#fde68a");
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.font = "11px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("SKYNET", cx, cy + 4);
    ctx.fillStyle = "#86efac";
    ctx.font = "11px IBM Plex Mono, monospace";
    ctx.fillText("wired to lattice kernel · AETHONΔ9 · never steal payload", cx, cy + R * 0.98);
    if (state.pick && state.pick._x) {
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      hex(state.pick._x, state.pick._y, 32);
      ctx.stroke();
    }
    requestAnimationFrame(draw);
  }

  function setHfChip(doc, src) {
    const el = document.getElementById("hf-chip");
    if (!el) return;
    if (!doc) {
      el.textContent = "HF overlay · named miss";
      el.className = "chip";
      return;
    }
    el.textContent = "HF · " + (doc.yield || "…") + " · " + String(doc.utc || "").replace("T", " ").slice(0, 19) + "Z";
    el.className = "chip " + (doc.yield === "ALIGNED" ? "ok" : (doc.yield === "REVIEW" ? "review" : "shadow"));
    el.title = src || "huggingface overlay";
  }

  function applyHfDoc(doc) {
    if (!doc || !doc.signature) return false;
    state.hf = doc;
    (doc.slots || []).forEach(function (row) {
      if (!row || !row.id) return;
      state.results[row.id] = {
        live: !!row.live,
        note: row.note || "",
        future: row.era === "future" || row.class === "FUTURE"
      };
    });
    if (!state.slots.length && doc.slots && doc.slots.length) {
      state.slots = doc.slots.map(function (row) {
        return {
          id: row.id, title: row.title, class: row.class, era: row.era, url: row.url,
          why: row.note
        };
      });
    }
    state.live = doc.live || 0;
    state.miss = doc.miss || 0;
    state.future = doc.future || 0;
    state.latticeYield = doc.lattice_yield || "…";
    state.maxOps = doc.max_ops || 0;
    state.queue = doc.queue || [];
    state.claims = doc.claims || [];
    state.extras = doc.extras || {};
    setYield(doc.yield || "ALIGNED");
    const rows = (doc.slots || []).map(function (s) {
      const future = s.era === "future" || s.class === "FUTURE";
      const tag = future ? "future" : (s.live ? "ok" : "shadow");
      return "<div class=\"row\" data-slot=\"" + esc(s.id) + "\"><span>" + esc(s.title) + "</span><span class=\"tag " + tag + "\">" +
        (future ? "future" : (s.live ? "live" : "named")) + "</span></div>";
    });
    const board = document.getElementById("board");
    if (board) {
      board.innerHTML = rows.join("");
      board.querySelectorAll("[data-slot]").forEach(function (row) {
        row.style.cursor = "pointer";
        row.addEventListener("click", function () {
          const s = state.slots.filter(function (x) { return x.id === row.getAttribute("data-slot"); })[0];
          if (s) briefSlot(s);
        });
      });
    }
    renderQueue();
    setHfChip(doc, "huggingface");
    return true;
  }

  function setYield(y) {
    state.yield = y;
    const chip = document.getElementById("yield-chip");
    if (!chip) return;
    chip.textContent = "YIELD · " + y;
    chip.className = "chip " + (y === "ALIGNED" ? "ok" : (y === "REVIEW" ? "review" : "shadow"));
  }

  function persist() {
    const pulse = {
      signature: SIG,
      utc: new Date().toISOString(),
      yield: state.yield,
      lattice_yield: state.latticeYield,
      live: state.live,
      miss: state.miss,
      future: state.future,
      max_ops: state.maxOps,
      claims: state.claims,
      extras: state.extras,
      queue: state.queue.slice(0, 12),
      slots: state.slots.map(function (s) {
        const r = state.results[s.id] || {};
        return { id: s.id, class: s.class, live: !!r.live, note: r.note || null };
      }),
      live_star_chart_write: "consent_pending_only"
    };
    try { localStorage.setItem("lygo-skynet-pulse", JSON.stringify(pulse)); } catch (e) {}
    state.lastPulse = pulse;
  }

  function briefLimb(L) {
    state.pick = L;
    const el = document.getElementById("brief");
    if (!el) return;
    el.classList.remove("empty");
    const href = window.LYGO_GUARD ? window.LYGO_GUARD.safeHref(L.url) : L.url;
    el.innerHTML = "<p class=\"kicker\">Limb</p><h2><span class=\"tag canon\">SKYNET</span> " + esc(L.title) + "</h2><p>" + esc(L.why) + "</p>" +
      (href ? "<div class=\"brief-links\"><a class=\"btn ghost\" href=\"" + esc(href) + "\">Open wire</a></div>" : "");
  }

  function briefSlot(s) {
    state.pick = { _x: s._sx, _y: s._sy, title: s.title };
    const el = document.getElementById("brief");
    if (!el || !s) return;
    const r = state.results[s.id] || {};
    const ring = ringOf(s);
    const tag = ring === "future" ? "FUTURE" : (r.live ? (ring === "canon" ? "CANON" : "RESOURCE") : "SHADOW");
    const cls = tag === "FUTURE" ? "future" : (tag === "SHADOW" ? "shadow" : (tag === "RESOURCE" ? "ref" : "canon"));
    el.classList.remove("empty");
    const href = window.LYGO_GUARD ? window.LYGO_GUARD.safeHref(s.url) : s.url;
    el.innerHTML = "<p class=\"kicker\">Lattice slot</p><h2><span class=\"tag " + cls + "\">" + tag + "</span> " + esc(s.title) + "</h2>" +
      "<p>" + esc(s.why || r.note || (r.live ? "Public GET succeeded." : "Named miss. Payload not invented.")) + "</p>" +
      "<p class=\"legend\">" + esc(s.url) + "</p>" +
      (href ? "<div class=\"brief-links\"><a class=\"btn ghost\" href=\"" + esc(href) + "\" target=\"_blank\" rel=\"noopener noreferrer\">Open</a></div>" : "");
  }

  function renderQueue() {
    const ul = document.getElementById("queue");
    if (!ul) return;
    ul.innerHTML = (state.queue.length ? state.queue : [{ title: "No REVIEW titles this pulse.", yield: "ALIGNED", ops_score: 0 }]).map(function (q) {
      const cls = q.yield === "SHADOW" ? "shadow" : (q.yield === "REVIEW" ? "ref" : "canon");
      return "<li><span class=\"tag " + cls + "\">" + esc(q.yield) + "</span>" + esc(q.title) +
        "<div class=\"legend\">ops " + q.ops_score + (q.url ? " · public headline" : "") + "</div></li>";
    }).join("");
    const nRev = document.getElementById("n-rev");
    const nSh = document.getElementById("n-sh");
    const nOps = document.getElementById("n-ops");
    const nPulse = document.getElementById("n-pulse");
    if (nRev) nRev.textContent = String(state.queue.filter(function (q) { return q.yield === "REVIEW"; }).length);
    if (nSh) nSh.textContent = String(state.queue.filter(function (q) { return q.yield === "SHADOW"; }).length);
    if (nOps) nOps.textContent = state.maxOps ? String(state.maxOps) : "—";
    if (nPulse) nPulse.textContent = String(state.live);
    const nMiss = document.getElementById("n-miss");
    if (nMiss) nMiss.textContent = String(state.miss);
    const nLat = document.getElementById("n-lat");
    if (nLat) nLat.textContent = state.latticeYield;
  }

  function checkChain(entries) {
    if (!entries || !entries.length) return { ok: false, errors: ["empty"] };
    const errs = [];
    for (let i = 0; i < entries.length - 1; i++) {
      if ((entries[i].prev_hash || "") !== (entries[i + 1].entry_hash || "")) {
        errs.push("break_at_seq_" + entries[i].seq);
        break;
      }
    }
    return { ok: errs.length === 0, errors: errs };
  }

  function daysSince(iso) {
    if (!iso) return null;
    const t = Date.parse(iso);
    if (!t) return null;
    return (Date.now() - t) / 86400000;
  }

  async function pingSlot(s) {
    const future = ringOf(s) === "future";
    try {
      const got = await getAny(s.url);
      let live = !!got.ok;
      let note = "HTTP " + got.status;
      if (s.expect === "json" && live && !got.json) {
        live = false;
        note = "expected JSON";
      }
      if (s.expect_sig && got.json && live) {
        const blob = JSON.stringify(got.json);
        const sig = String(got.json.signature || got.json.name || "");
        if (sig.indexOf(s.expect_sig) === -1 && blob.indexOf(s.expect_sig) === -1) note = "signature miss";
      }
      return { s: s, live: live, note: note, future: future, json: got.json };
    } catch (e) {
      return { s: s, live: false, note: String(e).slice(0, 80), future: future, json: null };
    }
  }

  async function mapLimit(list, n, fn) {
    const out = new Array(list.length);
    let i = 0;
    async function worker() {
      while (i < list.length) {
        const idx = i++;
        out[idx] = await fn(list[idx], idx);
      }
    }
    const pool = [];
    for (let k = 0; k < Math.min(n, list.length); k++) pool.push(worker());
    await Promise.all(pool);
    return out;
  }

  async function pulse() {
    state.queue = [];
    state.maxOps = 0;
    state.claims = [];
    state.extras = {};
    state.results = {};
    if (!state.slots.length) {
      const spec = await getAny(SLOTS);
      state.slots = (spec.json && spec.json.slots) || [];
    }
    const rows = [];
    let star = null, agora = null, overview = null, news = null;
    const pings = await mapLimit(state.slots, 6, pingSlot);
    pings.forEach(function (p) {
      const s = p.s;
      state.results[s.id] = { live: p.live, note: p.note, future: p.future };
      if (s.id === "star_feed" && p.json) {
        star = p.json;
        const chk = checkChain(p.json.entries || []);
        state.extras.star = {
          chain_valid_published: p.json.chain_valid,
          chain_valid_checked: chk.ok,
          chain_root: p.json.chain_root
        };
        if (!chk.ok || p.json.chain_valid === false) {
          p.live = false;
          p.note = "chain break";
          state.results[s.id].live = false;
          state.results[s.id].note = p.note;
        }
        state.claims.push({ claim: "star_chain_valid", pass: !!(chk.ok && p.json.chain_valid) });
      }
      if (s.id === "agora" && p.json) {
        agora = p.json;
        state.extras.agora = { feed_root: p.json.feed_root, nodes: p.json.chart_nodes };
      }
      if (s.id === "overview" && p.json) {
        overview = p.json;
        const age = daysSince(p.json.generated_utc);
        state.extras.overview_age_days = age == null ? null : Math.round(age * 10) / 10;
        if (age != null && age > STALE_DAYS) {
          p.note = "stale " + Math.round(age) + "d";
          state.results[s.id].note = p.note;
        }
      }
      if (s.id === "witness_news" && p.json) news = p.json;
      const tag = p.future ? "future" : (p.live ? "ok" : "shadow");
      rows.push("<div class=\"row\" data-slot=\"" + esc(s.id) + "\"><span>" + esc(s.title) + "</span><span class=\"tag " + tag + "\">" +
        (p.future ? "future" : (p.live ? "live" : "named")) + "</span></div>");
    });
    const extraNews = await getAny(NEWS);
    if (extraNews.json) news = extraNews.json;
    await getAny(KERNEL);
    await getAny(MAP);

    const canon = state.slots.filter(function (s) { return ringOf(s) === "canon"; });
    const canonLive = canon.filter(function (s) { return state.results[s.id] && state.results[s.id].live; }).length;
    const canonMiss = canon.length - canonLive;
    state.live = state.slots.filter(function (s) { return ringOf(s) !== "future" && state.results[s.id] && state.results[s.id].live; }).length;
    state.miss = state.slots.filter(function (s) { return ringOf(s) !== "future" && (!state.results[s.id] || !state.results[s.id].live); }).length;
    state.future = state.slots.filter(function (s) { return ringOf(s) === "future"; }).length;
    const chainOk = !!(state.extras.star && state.extras.star.chain_valid_checked && state.extras.star.chain_valid_published);
    const rootsMatch = !!(star && agora && star.chain_root && agora.feed_root && star.chain_root === agora.feed_root);
    if (star && agora) state.claims.push({ claim: "agora_feed_root_matches_star_chain_root", pass: rootsMatch });
    const stale = state.extras.overview_age_days != null && state.extras.overview_age_days > STALE_DAYS;
    if (overview) state.claims.push({ claim: "overview_fresh_10d", pass: !stale });
    state.claims.push({ claim: "canon_slots_live", pass: canonMiss === 0, live: canonLive, total: canon.length });

    let ly = "ALIGNED";
    if (stale || !rootsMatch || canonMiss >= 1) ly = "DRIFT";
    if (!chainOk || canonLive < Math.ceil(Math.max(1, canon.length) / 2)) ly = "SHADOW";
    if (canonMiss === 0 && chainOk && rootsMatch && !stale) ly = "ALIGNED";
    if (!state.slots.length) ly = "SHADOW";
    state.latticeYield = ly;

    const titles = [];
    if (news) {
      (news.severe || []).concat(news.world || []).forEach(function (r) {
        if (r && r.title) titles.push({ title: r.title, url: r.url });
      });
    }
    const scan = window.AETHON9 && window.AETHON9.scan;
    titles.slice(0, 40).forEach(function (t) {
      if (!scan) return;
      const s = scan(t.title);
      if (s.ops_score > state.maxOps) state.maxOps = s.ops_score;
      if (s.yield !== "ALIGNED") {
        state.queue.push({ title: t.title, url: t.url, yield: s.yield, ops_score: s.ops_score, hits: s.hits });
      }
    });
    let y = "ALIGNED";
    if (ly === "DRIFT" || state.queue.some(function (q) { return q.yield === "REVIEW"; })) y = "REVIEW";
    if (ly === "SHADOW" || state.queue.some(function (q) { return q.yield === "SHADOW"; })) y = "SHADOW";
    setYield(y);
    const board = document.getElementById("board");
    if (board) {
      board.innerHTML = rows.join("");
      board.querySelectorAll("[data-slot]").forEach(function (row) {
        row.style.cursor = "pointer";
        row.addEventListener("click", function () {
          const s = state.slots.filter(function (x) { return x.id === row.getAttribute("data-slot"); })[0];
          if (s) briefSlot(s);
        });
      });
    }
    renderQueue();
    persist();
    const el = document.getElementById("brief");
    if (el && el.classList.contains("empty")) {
      el.classList.remove("empty");
      el.innerHTML = "<p class=\"kicker\">Yield</p><h2>" + y + "</h2><p>Lattice kernel " + ly + " · live " + state.live +
        " · named " + state.miss + " · future " + state.future + " · AETHON max ops " + state.maxOps +
        ". Same slots as <a href=\"/lattice/\">/lattice/</a>. Human remains publisher.</p>";
    }
  }

  canvas.addEventListener("click", function (e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let bestLimb = null, bestLD = 40 * 40;
    LIMBS.forEach(function (L) {
      if (L._x == null) return;
      const d = (L._x - mx) * (L._x - mx) + (L._y - my) * (L._y - my);
      if (d < bestLD) { bestLD = d; bestLimb = L; }
    });
    let bestSlot = null, bestSD = 16 * 16;
    state.slots.forEach(function (s) {
      if (s._sx == null) return;
      const d = (s._sx - mx) * (s._sx - mx) + (s._sy - my) * (s._sy - my);
      if (d < bestSD) { bestSD = d; bestSlot = s; }
    });
    if (bestLimb && bestLD <= bestSD) briefLimb(bestLimb);
    else if (bestSlot) briefSlot(bestSlot);
    else if (bestLimb) briefLimb(bestLimb);
  });
  const btn = document.getElementById("btn-pulse");
  if (btn) btn.addEventListener("click", function () { pulse(); });

  function clock() {
    const el = document.getElementById("utc");
    if (el) el.textContent = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z");
  }

  async function boot() {
    const sig = document.getElementById("sig");
    if (sig) sig.textContent = SIG;
    size();
    clock();
    setInterval(clock, 1000);
    draw();
    const spec = await getAny(SLOTS);
    state.slots = (spec.json && spec.json.slots) || [];
    const hf = await getAny(HF_PULSE);
    if (hf.json && hf.json.signature) applyHfDoc(hf.json);
    else setHfChip(null);
    await pulse();
    setInterval(pulse, 90000);
  }
  window.addEventListener("resize", size);
  boot();
})();
