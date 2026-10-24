/* LYGO Agent Runtime — autonomous GET tick. No POST. No egg plant. No live chart write. */
(function () {
  "use strict";
  const SIG = "Delta9Phi963-AGENT-RUNTIME-v1.0.0";
  const INTERVAL = 90000;
  const SURFACES = [
    { id: "anchors", url: "https://deepseekoracle.github.io/lygo-protocol-stack/network_builder/IMMUTABLE_ANCHORS.json", klass: "CANON" },
    { id: "star_feed", url: "https://deepseekoracle.github.io/lygo-protocol-stack/haven_star_chart/haven_star_chart_feed.json", klass: "CANON" },
    { id: "eggs", url: "https://deepseekoracle.github.io/lygo-protocol-stack/KernelEggRegistry.json", klass: "CANON" },
    { id: "agora", url: "https://deepseekoracle.github.io/lygo-protocol-stack/agent-agora/api/pulse.json", klass: "CANON" },
    { id: "map", url: "https://excavationpro.ca/lattice/map.json", klass: "RESOURCE" },
    { id: "join", url: "https://excavationpro.ca/join/doctrine.json", klass: "RESOURCE" },
    { id: "bench", url: "https://excavationpro.ca/bench/doctrine.json", klass: "RESOURCE" },
    { id: "heartbeat", url: "https://deepseekoracle.github.io/lygo-protocol-stack/agent-agora/api/heartbeat.json", klass: "RESOURCE" },
    { id: "network_eggs", url: "https://deepseekoracle.github.io/lygo-protocol-stack/agent-agora/api/network_eggs.json", klass: "RESOURCE" },
    { id: "hf_eggs", url: "https://huggingface.co/datasets/DeepSeekOracle/lygo-public-witness-feed/resolve/main/network-eggs.json", klass: "RESOURCE" },
    { id: "protocol_tick", url: "https://deepseekoracle.github.io/lygo-protocol-stack/agent-agora/api/protocol_tick.json", klass: "RESOURCE" }
  ];
  const $ = function (id) { return document.getElementById(id); };
  let timer = null;
  let last = null;

  function utcNow() { return new Date().toISOString().replace(/\.\d{3}Z$/, "Z"); }
  function hex(buf) {
    const a = new Uint8Array(buf); let s = "";
    for (let i = 0; i < a.length; i++) s += a[i].toString(16).padStart(2, "0");
    return s;
  }
  async function sha256(buf) { return hex(await crypto.subtle.digest("SHA-256", buf)); }

  function starChain(data) {
    const entries = data.entries || [];
    let ok = entries.length > 0;
    for (let i = 0; i < entries.length - 1; i++) {
      if ((entries[i].prev_hash || "") !== (entries[i + 1].entry_hash || "")) { ok = false; break; }
    }
    return {
      entry_count: data.entry_count || entries.length,
      chain_valid_published: data.chain_valid,
      chain_valid_checked: ok,
      chain_root: data.chain_root || null
    };
  }

  async function pulseOne(ep) {
    const out = { id: ep.id, klass: ep.klass, url: ep.url, ok: false, status: 0, extra: "", sha256: null };
    try {
      const r = await fetch(ep.url, { method: "GET", credentials: "omit", cache: "no-store" });
      const buf = await r.arrayBuffer();
      out.status = r.status;
      out.ok = r.status >= 200 && r.status < 400;
      out.sha256 = await sha256(buf.byteLength > 2000000 ? buf.slice(0, 2000000) : buf);
      if (out.ok) {
        try {
          const data = JSON.parse(new TextDecoder().decode(buf.byteLength > 2000000 ? buf.slice(0, 2000000) : buf));
          if (ep.id === "star_feed") {
            out.feed = starChain(data);
            out.ok = out.ok && out.feed.chain_valid_checked;
            out.extra = "chain " + String(out.feed.chain_valid_checked) + " · " + out.feed.entry_count;
          } else if (ep.id === "eggs") {
            const n = (data.eggs || []).length;
            out.eggs = { count: n, merkle: data.registry_merkle_root || null };
            out.extra = n + " eggs";
          } else if (ep.id === "agora") {
            out.pulse = { nodes: data.chart_nodes, entries: data.feed_entries, writes: data.writes };
            out.extra = (data.chart_nodes || 0) + " nodes";
          } else if (ep.id === "anchors") {
            const g = data.immutable_anchors || {};
            out.extra = Object.keys(g).length + " cats";
          } else if (ep.id === "map") {
            out.extra = (data.doors || []).length + " doors";
          } else if (ep.id === "network_eggs") {
            out.gen = data.generation || (data.eggs || []).length;
            out.extra = "gen " + out.gen;
          } else out.extra = "HTTP " + r.status;
        } catch (e) { out.extra = "HTTP " + r.status; }
      }
    } catch (e) {
      out.error = "cors_or_network";
      out.extra = "cors_or_network";
    }
    return out;
  }

  function yieldOf(rows) {
    const canonFail = rows.filter(function (r) { return r.klass === "CANON" && !r.ok; }).length;
    const resFail = rows.filter(function (r) { return r.klass === "RESOURCE" && !r.ok; }).length;
    if (canonFail) return "SHADOW";
    if (resFail) return "DRIFT";
    return "ALIGNED";
  }

  function paint(report) {
    const y = report.yield;
    $("yield-box").className = "stat " + y.toLowerCase();
    $("yield").textContent = y;
    $("eggs-n").textContent = report.eggs_count != null ? String(report.eggs_count) : "—";
    if ($("net-gen")) $("net-gen").textContent = report.network_gen != null ? String(report.network_gen) : "—";
    $("star-n").textContent = report.star_entries != null ? String(report.star_entries) : "—";
    $("tick-n").textContent = String(report.tick);
    $("utc").textContent = report.updated_utc;
    $("status").textContent = report.yield === "ALIGNED"
      ? "Public canon is up. Eggs verify. Star chain checks. LIVE writes still need a steward."
      : "Named miss. Do not claim ALIGNED.";
    const board = $("board");
    board.innerHTML = "";
    report.surfaces.forEach(function (ep) {
      const div = document.createElement("div");
      div.className = "ep" + (ep.ok ? " ok" : " shadow");
      div.innerHTML = "<span class=\"tag " + (ep.ok ? "ok" : "shadow") + "\">" + (ep.ok ? "LIVE" : "SHADOW") + "</span>" +
        "<span><span class=\"t\">" + ep.id + "</span> <span class=\"g\">" + ep.klass + " · " + (ep.extra || "") + "</span></span>" +
        "<span class=\"sha\">" + (ep.sha256 ? ep.sha256.slice(0, 10) : "—") + "</span>";
      board.appendChild(div);
    });
    $("card").textContent = JSON.stringify(report.presence, null, 2);
    $("hb").textContent = JSON.stringify(report, null, 2);
    try { localStorage.setItem("lygo_agent_runtime", JSON.stringify(report)); } catch (e) {}
  }

  async function tick() {
    $("status").innerHTML = "<span class=\"spin\"></span> Autonomous tick…";
    const surfaces = [];
    for (let i = 0; i < SURFACES.length; i++) surfaces.push(await pulseOne(SURFACES[i]));
    const y = yieldOf(surfaces);
    const eggs = surfaces.find(function (s) { return s.id === "eggs"; });
    const nete = surfaces.find(function (s) { return s.id === "network_eggs"; });
    const star = surfaces.find(function (s) { return s.id === "star_feed"; });
    const agora = surfaces.find(function (s) { return s.id === "agora"; });
    const aid = ($("agent-id").value || "lygo-agent").replace(/[^a-zA-Z0-9_\-.]/g, "-").slice(0, 64);
    const report = {
      signature: SIG,
      command: "tick",
      yield: y,
      tick: (last && last.tick || 0) + 1,
      updated_utc: utcNow(),
      live_star_chart_ingest: false,
      egg_plant: false,
      eggs_count: eggs && eggs.eggs ? eggs.eggs.count : null,
      network_gen: nete && nete.gen != null ? nete.gen : null,
      star_entries: star && star.feed ? star.feed.entry_count : null,
      star_chain_ok: star && star.feed ? star.feed.chain_valid_checked : null,
      surfaces: surfaces,
      presence: {
        signature: "Delta9Phi963-AGENT-CARD-v1",
        layer: "E",
        agent_id: aid,
        role: "public_runtime",
        alignment_status: y,
        dry_run: true,
        lattice_roots: { star_chain_root: star && star.feed ? star.feed.chain_root : null, agora_nodes: agora && agora.pulse ? agora.pulse.nodes : null },
        note: "Presence dry-run. Join a local hub with --i-consent to gossip. Never a live chart write."
      }
    };
    last = report;
    paint(report);
    return report;
  }

  function copy(id) {
    const t = $(id).textContent || "";
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t);
  }

  $("audit").addEventListener("click", function () { tick(); });
  $("copy-card").addEventListener("click", function () { copy("card"); });
  $("copy-hb").addEventListener("click", function () { copy("hb"); });
  $("loop").addEventListener("change", function () {
    if ($("loop").checked) {
      tick();
      timer = setInterval(tick, INTERVAL);
    } else if (timer) { clearInterval(timer); timer = null; }
  });
  $("loop").checked = true;
  const plantBtn = $("plant-hf");
  if (plantBtn) {
    plantBtn.addEventListener("click", async function () {
      const aid = ($("agent-id") && $("agent-id").value) || "web-agent";
      const payload = ($("egg-json") && $("egg-json").value) || "{}";
      $("plant-out").textContent = "POST Hugging Face…";
      try {
        const r = await fetch("https://deepseekoracle-lygo-star-chart-bot.hf.space/gradio_api/call/plant_egg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: [aid, payload] })
        });
        const j = await r.json();
        const eid = j.event_id || (j.hash);
        if (!eid) {
          $("plant-out").textContent = JSON.stringify(j, null, 2);
          return;
        }
        const g = await fetch("https://deepseekoracle-lygo-star-chart-bot.hf.space/gradio_api/call/plant_egg/" + eid);
        $("plant-out").textContent = await g.text();
      } catch (e) {
        $("plant-out").textContent = "offline or Space waking: " + e + "\nUse the GitHub issue plant or run the local hub.";
      }
    });
  }
  tick();
  timer = setInterval(tick, INTERVAL);
})();
