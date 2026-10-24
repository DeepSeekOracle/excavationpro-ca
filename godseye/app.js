/* LYGO God's Eye v1.0.0 — lattice looking at itself. Never invent payloads. */
(function () {
  "use strict";
  const SIG = "Delta9Phi963-GODS-EYE-v1.0.0";
  const URLS = {
    shadows: "/witness/shadows.json",
    news: "/witness/news-monitor.json",
    hf: "https://huggingface.co/datasets/DeepSeekOracle/lygo-public-witness-feed/resolve/main/feed.json",
    anchors: "https://deepseekoracle.github.io/lygo-protocol-stack/network_builder/IMMUTABLE_ANCHORS.json",
    star: "https://deepseekoracle.github.io/lygo-protocol-stack/haven_star_chart/haven_star_chart_feed.json",
    agora: "https://deepseekoracle.github.io/lygo-protocol-stack/agent-agora/api/pulse.json",
    overview: "https://deepseekoracle.github.io/lygo-protocol-stack/GIT_LATTICE_OVERVIEW.json",
    usgs: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
    eonet: "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20",
    iss: "https://api.wheretheiss.at/v1/satellites/25544",
    skynet: "/skynet/doctrine.json",
    starchart: "/starchart/doctrine.json",
    starMon: "https://huggingface.co/datasets/DeepSeekOracle/lygo-public-witness-feed/resolve/main/star-monitor.json",
    lattice: "/lattice/doctrine.json",
    latticeAudit: "https://huggingface.co/datasets/DeepSeekOracle/lygo-public-witness-feed/resolve/main/lattice-audit.json"
  };
  const canvas = document.getElementById("iris");
  const ctx = canvas.getContext("2d");
  const state = {
    rot: 0, tick: 0, nodes: [], rings: { all: true, canon: true, resource: true, shadow: true },
    pick: null, miss: 0, live: { resource: 0, canon: 0, shadow: 0 }
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

  function addNode(n) {
    state.nodes.push({
      id: n.id, title: n.title, cls: n.cls, ring: n.ring,
      why: n.why || "", url: n.url || "", live: !!n.live, extra: n.extra || null
    });
  }

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < String(s).length; i++) { h ^= String(s).charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967295;
  }

  function place(n, i, total, ringR, cx, cy) {
    const a = (i / Math.max(1, total)) * Math.PI * 2 + state.rot * (n.ring === "canon" ? 0.4 : 1);
    const wobble = (hash(n.id) - 0.5) * 0.18 * ringR;
    return { x: cx + Math.cos(a) * (ringR + wobble), y: cy + Math.sin(a) * (ringR + wobble) };
  }

  function visible(n) {
    if (state.rings.all) return state.rings[n.ring] !== false;
    return !!state.rings[n.ring];
  }

  function draw() {
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.48, R = Math.min(w, h) * 0.42;
    state.tick++;
    state.rot += 0.0014;

    const g = ctx.createRadialGradient(cx, cy, R * 0.08, cx, cy, R * 1.15);
    g.addColorStop(0, "#1a3a4a");
    g.addColorStop(0.35, "#0c1c2e");
    g.addColorStop(1, "#05070d");
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    [[0.28, "#fbbf2488"], [0.55, "#f59e0b66"], [0.82, "#a78bfa66"]].forEach(function (ring) {
      ctx.beginPath();
      ctx.arc(cx, cy, R * ring[0], 0, Math.PI * 2);
      ctx.strokeStyle = ring[1];
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = "#fde68a";
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#0b1220";
    ctx.font = "10px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Δ9", cx, cy + 3);

    const scan = (state.tick * 0.02) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R * 0.82, scan, scan + 0.35);
    ctx.closePath();
    ctx.fillStyle = "rgba(125,211,252,0.07)";
    ctx.fill();

    const groups = { canon: [], resource: [], shadow: [] };
    state.nodes.forEach(function (n) { if (groups[n.ring]) groups[n.ring].push(n); });
    const ringR = { canon: R * 0.28, resource: R * 0.55, shadow: R * 0.82 };
    const colors = { canon: "#fbbf24", resource: "#f59e0b", shadow: "#a78bfa" };

    Object.keys(groups).forEach(function (ring) {
      if (!state.rings[ring] && !state.rings.all) return;
      if (state.rings[ring] === false) return;
      const list = groups[ring];
      list.forEach(function (n, i) {
        if (!visible(n)) return;
        const p = place(n, i, list.length, ringR[ring], cx, cy);
        n._x = p.x; n._y = p.y;
        if (n.ring === "shadow" && !n.live) {
          ctx.strokeStyle = colors.shadow;
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = n.live ? colors[ring] : "#64748b";
          ctx.beginPath();
          ctx.arc(p.x, p.y, n.ring === "canon" ? 4.2 : 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    if (state.pick && state.pick._x) {
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.pick._x, state.pick._y, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "#86efac";
    ctx.font = "11px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("GOD'S EYE · canon inner · public mid · shadows outer", cx, cy + R * 0.98);
    requestAnimationFrame(draw);
  }

  function nearest(mx, my) {
    let best = null, bestD = 22 * 22;
    state.nodes.forEach(function (n) {
      if (n._x == null || !visible(n)) return;
      const d = (n._x - mx) * (n._x - mx) + (n._y - my) * (n._y - my);
      if (d < bestD) { bestD = d; best = n; }
    });
    return best;
  }

  function brief(n) {
    state.pick = n;
    const el = document.getElementById("brief");
    if (!el || !n) return;
    const tag = n.ring === "canon" ? "CANON" : (n.ring === "shadow" ? "SHADOW" : "RESOURCE");
    const cls = n.ring === "canon" ? "canon" : (n.ring === "shadow" ? "shadow" : "ref");
    const why = n.why || (n.live ? "Public GET succeeded." : "Named — GET failed or private. Payload not invented.");
    const links = [];
    if (n.url) links.push({ label: "Open official / lattice page", url: n.url });
    if (n.ring === "shadow") links.push({ label: "Witness shadows doctrine", url: "/witness/" });
    el.classList.remove("empty");
    el.innerHTML = "<p class=\"kicker\">Selected node</p><h2><span class=\"tag " + cls + "\">" + tag + "</span> " + esc(n.title) + "</h2>" +
      "<p>" + esc(why) + "</p>" +
      (n.ring === "shadow" ? "<p class=\"legend\">Payload is null on purpose.</p>" : "") +
      "<div class=\"brief-links\">" + links.map(function (l) {
        const href = window.LYGO_GUARD ? window.LYGO_GUARD.safeHref(l.url) : "";
        return href ? "<a class=\"btn ghost\" href=\"" + esc(href) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + esc(l.label) + "</a>" : "";
      }).join(" ") + "</div>";
  }

  function renderFeed() {
    const ul = document.getElementById("feed");
    if (!ul) return;
    const rows = state.nodes.filter(visible).slice(0, 40);
    ul.innerHTML = rows.map(function (n, i) {
      const tag = n.ring === "canon" ? "CANON" : (n.ring === "shadow" ? "SHADOW" : "RESOURCE");
      const cls = n.ring === "canon" ? "canon" : (n.ring === "shadow" ? "shadow" : "ref");
      return "<li data-i=\"" + i + "\"><span class=\"tag " + cls + "\">" + tag + "</span>" + esc(n.title) +
        (n.live ? " <span class=\"tag ok\">live</span>" : "") + "</li>";
    }).join("");
    ul.querySelectorAll("li").forEach(function (li, i) {
      li.addEventListener("click", function () { brief(rows[i]); });
    });
    document.getElementById("n-res").textContent = String(state.nodes.filter(function (n) { return n.ring === "resource" && n.live; }).length);
    document.getElementById("n-can").textContent = String(state.nodes.filter(function (n) { return n.ring === "canon"; }).length);
    document.getElementById("n-sh").textContent = String(state.nodes.filter(function (n) { return n.ring === "shadow"; }).length);
    document.getElementById("n-miss").textContent = String(state.miss);
  }

  function boardRow(id, ok, label) {
    return "<div class=\"row\"><span>" + esc(label) + "</span><span class=\"tag " + (ok ? "ok" : "shadow") + "\">" + (ok ? "live" : "named") + "</span></div>";
  }

  async function ping(name, url, after) {
    try {
      const data = await getJson(url);
      after(data, true);
      return true;
    } catch (e) {
      after(null, false);
      state.miss += 1;
      addNode({
        id: "miss_" + name, title: name + " unreachable", cls: "shadow", ring: "shadow",
        live: false, url: url, why: "GET failed. Node stays named. " + String(e).slice(0, 80)
      });
      return false;
    }
  }

  async function load() {
    document.getElementById("sig").textContent = SIG;
    const board = [];
    await ping("shadows", URLS.shadows, function (data, ok) {
      board.push(boardRow("sh", ok, "Witness shadows catalog"));
      if (!ok || !data) return;
      (data.nodes || []).forEach(function (n) {
        addNode({
          id: n.id, title: n.label || n.id,
          ring: n.kind === "resource" ? "resource" : "shadow",
          live: n.kind === "resource",
          why: n.why,
          url: (n.public_checks && n.public_checks[0] && n.public_checks[0].url) || "/witness/"
        });
      });
    });
    await ping("anchors", URLS.anchors, function (data, ok) {
      board.push(boardRow("an", ok, "Immutable anchors"));
      if (!ok || !data) return;
      const buckets = data.immutable_anchors || {};
      Object.keys(buckets).forEach(function (k) {
        (buckets[k] || []).slice(0, 12).forEach(function (n) {
          addNode({
            id: n.id || n.label, title: n.label || n.id, ring: "canon", live: true,
            url: n.url, why: "CANON · dual-ledger / network builder anchor."
          });
        });
      });
    });
    await ping("star", URLS.star, function (data, ok) {
      board.push(boardRow("st", ok, "Haven Star Chart feed"));
      if (!ok || !data) return;
      (data.entries || []).slice(0, 24).forEach(function (n) {
        addNode({
          id: n.node_id, title: n.node_name || n.node_id, ring: "canon", live: true,
          url: "https://deepseekoracle.github.io/lygo-protocol-stack/HavenStarChart.html",
          why: "CANON · Star Chart receipt (" + (n.status || "listed") + "). This page does not write the live chart."
        });
      });
    });
    await ping("overview", URLS.overview, function (data, ok) {
      board.push(boardRow("la", ok, "Lattice overview"));
      if (!ok || !data) return;
      (data.systems || []).slice(0, 20).forEach(function (h) {
        if (!h || typeof h !== "object") return;
        addNode({
          id: h.id || h.name, title: h.label || h.name || h.id, ring: "canon", live: true,
          url: "https://deepseekoracle.github.io/lygo-protocol-stack/KernelEggRetrieval.html",
          why: "CANON · lattice system / egg map."
        });
      });
    });
    await ping("agora", URLS.agora, function (data, ok) {
      board.push(boardRow("ag", ok, "Agent Agora pulse"));
      if (!ok || !data) return;
      addNode({
        id: "agora", title: "Agent Agora pulse", ring: "canon", live: true,
        url: "https://deepseekoracle.github.io/lygo-protocol-stack/agent-agora/",
        why: "CANON · public agora pulse. Agents read; humans consent live writes."
      });
      const agents = data.agents || data.nodes || data.presence || [];
      (Array.isArray(agents) ? agents : []).slice(0, 16).forEach(function (a, i) {
        addNode({
          id: a.id || a.agent_id || ("agora_" + i),
          title: a.name || a.agent_id || a.id || "agora node",
          ring: "canon", live: true,
          url: "https://deepseekoracle.github.io/lygo-protocol-stack/agent-agora/",
          why: "CANON · agora presence card (public summary only)."
        });
      });
    });
    await ping("usgs", URLS.usgs, function (data, ok) {
      board.push(boardRow("us", ok, "USGS quakes"));
      if (!ok || !data) return;
      const n = (data.features || []).length;
      addNode({
        id: "usgs_live", title: "USGS " + n + " public quakes (24h 2.5+)", ring: "resource", live: true,
        url: "https://earthquake.usgs.gov/earthquakes/map/",
        why: "RESOURCE · public seismic catalog. Open Witness for the globe."
      });
    });
    await ping("eonet", URLS.eonet, function (data, ok) {
      board.push(boardRow("eo", ok, "NASA EONET"));
      if (!ok || !data) return;
      addNode({
        id: "eonet_live", title: "EONET " + (data.events || []).length + " open events", ring: "resource", live: true,
        url: "https://eonet.gsfc.nasa.gov/",
        why: "RESOURCE · NASA public natural-event index."
      });
    });
    await ping("iss", URLS.iss, function (data, ok) {
      board.push(boardRow("iss", ok, "ISS telemetry"));
      if (!ok || !data) return;
      addNode({
        id: "iss_live", title: "ISS " + Number(data.latitude).toFixed(1) + ", " + Number(data.longitude).toFixed(1),
        ring: "resource", live: true, url: "https://wheretheiss.at/",
        why: "RESOURCE · public ISS position."
      });
    });
    await ping("skynet", URLS.skynet, function (data, ok) {
      board.push(boardRow("sk", ok, "LYGO SKYNET sentinel"));
      if (!ok || !data) return;
      addNode({
        id: "skynet", title: "LYGO SKYNET · AETHONΔ9", ring: "canon", live: true,
        url: "/skynet/",
        why: "CANON limb · Sentinel Kernel Yielding Named Ethical Trust. Pulse public GET, score public titles, yield ALIGNED/REVIEW/SHADOW. Complete Star Chart at /starchart/; feed monitor at /starchart/monitor/."
      });
    });
    await ping("starchart", URLS.starchart, function (data, ok) {
      board.push(boardRow("sc", ok, "Haven Star Chart"));
      if (!ok || !data) return;
      addNode({
        id: "star_chart", title: "Haven Star Chart", ring: "canon", live: true,
        url: "/starchart/",
        why: "CANON · complete D3 cosmology chart (1,300+ nodes). Feed monitor is /starchart/monitor/."
      });
    });
    await ping("starMon", URLS.starMon, function (data, ok) {
      board.push(boardRow("sm", ok, "HF star-monitor.json"));
      if (!ok || !data) return;
      addNode({
        id: "hf_star_mon",
        title: "HF star-monitor seq " + ((data.latest && data.latest.seq) || "?"),
        ring: "canon", live: !!data.ok, url: "/starchart/monitor/",
        why: "CANON monitor snapshot on Hugging Face. Not a forged Pages chain entry."
      });
    });
    await ping("lattice", URLS.lattice, function (data, ok) {
      board.push(boardRow("lk", ok, "Lattice kernel"));
      if (!ok || !data) return;
      addNode({
        id: "lattice_kernel", title: "Lattice kernel", ring: "canon", live: true,
        url: "/lattice/",
        why: "CANON · autonomous pulse + self-audit + future slots. Human remains publisher."
      });
    });
    await ping("latticeAudit", URLS.latticeAudit, function (data, ok) {
      board.push(boardRow("laud", ok, "HF lattice-audit.json"));
      if (!ok || !data) return;
      addNode({
        id: "hf_lattice_audit",
        title: "Lattice audit yield " + (data["yield"] || "?"),
        ring: "canon", live: !!data.signature, url: "/lattice/",
        why: "CANON self-audit receipt on Hugging Face. FUTURE slots never fail the kernel."
      });
    });
    await ping("hf", URLS.hf, function (data, ok) {
      board.push(boardRow("hf", ok, "HF overlay snapshot"));
      if (!ok || !data) return;
      addNode({
        id: "hf_feed", title: "HF overlay " + (data.point_count || (data.points || []).length) + " points",
        ring: "resource", live: !!data.ok, url: "/witness/",
        why: "RESOURCE · labeled Hugging Face snapshot. Failed sources stay named shadows."
      });
    });
    document.getElementById("board").innerHTML = board.join("");
    renderFeed();
  }

  canvas.addEventListener("click", function (e) {
    const rect = canvas.getBoundingClientRect();
    const n = nearest(e.clientX - rect.left, e.clientY - rect.top);
    if (n) brief(n);
  });
  document.querySelectorAll("[data-ring]").forEach(function (b) {
    b.addEventListener("click", function () {
      const k = b.getAttribute("data-ring");
      if (k === "all") {
        state.rings = { all: true, canon: true, resource: true, shadow: true };
        document.querySelectorAll("[data-ring]").forEach(function (x) { x.classList.add("on"); });
      } else {
        state.rings.all = false;
        state.rings[k] = !state.rings[k];
        b.classList.toggle("on", state.rings[k]);
      }
      renderFeed();
    });
  });

  function clock() {
    const el = document.getElementById("utc");
    if (el) el.textContent = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z");
  }
  window.addEventListener("resize", size);
  size();
  clock();
  setInterval(clock, 1000);
  draw();
  load();
})();
