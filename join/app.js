/* LYGO Join Gate — HTTPS GET only. No POST. No live Star Chart write. */
(function () {
  "use strict";
  const SIG = "Delta9Phi963-PUBLIC-LATTICE-GATE-PAGE-v1.0.0";
  const INSTALL = "npx clawhub@latest install deepseekoracle/lygo-public-lattice-gate";
  const SEALER = "npx clawhub@latest install deepseekoracle/lygo-geodesic-sealer";
  /* Browser required = CORS JSON. HTML hubs are soft; CORS miss = named SHADOW. */
  const ENDPOINTS = [
    { id: "immutable_anchors", url: "https://deepseekoracle.github.io/lygo-protocol-stack/network_builder/IMMUTABLE_ANCHORS.json", role: "link_ledger", verify: "http_required" },
    { id: "immutable_anchors_raw", url: "https://raw.githubusercontent.com/DeepSeekOracle/lygo-protocol-stack/main/docs/network_builder/IMMUTABLE_ANCHORS.json", role: "link_ledger_mirror", verify: "http_soft" },
    { id: "haven_star_feed", url: "https://deepseekoracle.github.io/lygo-protocol-stack/haven_star_chart/haven_star_chart_feed.json", role: "star_ledger", verify: "http_required" },
    { id: "agent_agora_pulse", url: "https://deepseekoracle.github.io/lygo-protocol-stack/agent-agora/api/pulse.json", role: "agent_square_pulse", verify: "http_required" },
    { id: "whisper_routing", url: "https://deepseekoracle.github.io/lygo-protocol-stack/seals/lfw_whisper_lattice_routing.json", role: "whisper_lattice", verify: "http_soft" },
    { id: "haven_star_chart", url: "https://deepseekoracle.github.io/lygo-protocol-stack/HavenStarChart.html", role: "world_map", verify: "http_soft" },
    { id: "stack_pages", url: "https://deepseekoracle.github.io/lygo-protocol-stack/", role: "stack_mirror", verify: "http_soft" },
    { id: "agent_agora", url: "https://deepseekoracle.github.io/lygo-protocol-stack/agent-agora/", role: "agent_square", verify: "http_soft" },
    { id: "lygo_claw_public_usb", url: "https://deepseekoracle.github.io/lygo-protocol-stack/LYGO_CLAW_USB_PUBLIC.md", role: "usb_public_kit", verify: "http_soft" },
    { id: "excavationpro_listen", url: "https://deepseekoracle.github.io/Excavationpro/excavationpro-listen.html", role: "music_backup", verify: "http_soft" },
    { id: "chatagent_hub", url: "https://excavationpro.ca/app.html", role: "summon_hub", verify: "http_soft" },
    { id: "skillhub_full", url: "https://excavationpro.ca/lygoskillhub.html", role: "skillhub", verify: "http_soft" },
    { id: "tv", url: "https://excavationpro.ca/sources/", role: "lygo_tv", verify: "http_soft" },
    { id: "lattice_kernel", url: "https://excavationpro.ca/lattice/", role: "lattice_kernel", verify: "http_soft" },
    { id: "lattice_map", url: "https://excavationpro.ca/lattice/map.json", role: "lattice_map", verify: "http_soft" },
    { id: "join_doctrine", url: "https://excavationpro.ca/join/doctrine.json", role: "join_gate", verify: "http_soft" },
    { id: "bench", url: "https://excavationpro.ca/bench/", role: "workbench", verify: "http_soft" },
    { id: "continuum", url: "https://excavationpro.ca/lygo-continuum.html", role: "claims", verify: "http_soft" },
    { id: "asiancoastline_listen", url: "https://asiancoastline.com/listen.html", role: "music_primary", verify: "http_soft" },
    { id: "eternalhaven", url: "https://eternalhaven.ca/", role: "public_hub", verify: "http_soft" },
    { id: "bpmfinder", url: "https://bpmfinder.ca/", role: "tools_domain", verify: "http_soft" },
    { id: "clawhub_publisher", url: "https://clawhub.ai/deepseekoracle", role: "skill_registry", verify: "http_soft" }
  ];

  const $ = function (id) { return document.getElementById(id); };
  const G = window.LYGO_GUARD || null;
  let last = null;

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

  async function sha256Text(s) {
    return sha256(new TextEncoder().encode(s));
  }

  function yieldOf(reqFail, softFail, dualOk) {
    if (reqFail > 0) return "SHADOW";
    if (!dualOk || softFail > 0) return "DRIFT";
    return "ALIGNED";
  }

  async function pulseOne(ep) {
    const out = {
      id: ep.id,
      role: ep.role,
      verify: ep.verify,
      url: ep.url,
      ok: false,
      status: 0,
      bytes: 0,
      sha256: null,
      error: null,
      feed: null,
      anchors: null,
      pulse: null
    };
    if (G && !G.allowFetch(ep.url)) {
      out.error = "not_allowlisted";
      return out;
    }
    try {
      const r = await fetch(ep.url, { method: "GET", credentials: "omit", cache: "no-store" });
      out.status = r.status;
      const buf = await r.arrayBuffer();
      const sample = buf.byteLength > 2000000 ? buf.slice(0, 2000000) : buf;
      out.bytes = buf.byteLength;
      out.sha256 = await sha256(sample);
      out.ok = r.status >= 200 && r.status < 400;
      if (out.ok && (ep.id === "haven_star_feed" || ep.id.indexOf("immutable_anchors") === 0 || ep.id === "agent_agora_pulse")) {
        try {
          const text = new TextDecoder("utf-8").decode(sample);
          const data = JSON.parse(text);
          if (ep.id === "haven_star_feed") {
            const entries = data.entries || [];
            out.feed = {
              entry_count: data.entry_count || entries.length,
              chain_valid: data.chain_valid,
              chain_root: data.chain_root || null,
              updated_utc: data.updated_utc || null,
              signature: data.signature || null
            };
          } else if (ep.id === "agent_agora_pulse") {
            out.pulse = {
              feed_root: data.feed_root || data.chain_root || null,
              signature: data.signature || null,
              updated_utc: data.updated_utc || null
            };
          } else {
            const groups = data.immutable_anchors || {};
            const cats = groups && typeof groups === "object" ? Object.keys(groups) : [];
            out.anchors = {
              signature: data.signature || null,
              version: data.version || null,
              category_count: cats.length
            };
          }
        } catch (e) {}
      }
    } catch (e) {
      out.ok = false;
      out.error = "cors_or_network";
    }
    return out;
  }

  function score(results) {
    let reqFail = 0;
    let softFail = 0;
    let reqTotal = 0;
    let softTotal = 0;
    let link = null;
    let feed = null;
    let pulse = null;
    results.forEach(function (r) {
      if (r.verify === "http_required") {
        reqTotal += 1;
        if (!r.ok) reqFail += 1;
      } else {
        softTotal += 1;
        if (!r.ok) softFail += 1;
      }
      if (r.anchors && !link) link = r.anchors;
      if (r.feed) feed = r.feed;
      if (r.pulse) pulse = r.pulse;
    });
    let s = 0;
    if (reqTotal) s += Math.round(50 * (reqTotal - reqFail) / reqTotal);
    if (link && link.category_count > 0) s += 10;
    if (feed && feed.chain_valid === true) s += 15;
    else if (feed && feed.entry_count) s += 5;
    if (softTotal) s += Math.round(15 * (softTotal - softFail) / softTotal);
    if (s > 90) s = 90;
    const dualOk = !!(link && link.category_count > 0 && feed);
    const y = yieldOf(reqFail, softFail, dualOk);
    return {
      score: s,
      cap: 90,
      required_fail: reqFail,
      soft_fail: softFail,
      dual_ok: dualOk,
      yield: y,
      ready: s >= 70 && reqFail === 0,
      link: link,
      feed: feed,
      pulse: pulse
    };
  }

  function extraLine(ep) {
    if (ep.feed) return "chain " + String(ep.feed.chain_valid) + " · " + ep.feed.entry_count + " entries";
    if (ep.anchors) return ep.anchors.category_count + " anchor cats";
    if (ep.pulse) return ep.pulse.feed_root ? ("root " + String(ep.pulse.feed_root).slice(0, 10)) : "pulse";
    if (ep.error) return ep.error;
    return "HTTP " + ep.status;
  }

  function paint(report) {
    const y = report.align.yield;
    const box = $("yield-box");
    $("yield").textContent = y;
    if (box) box.className = "stat " + y.toLowerCase();
    $("score").textContent = String(report.align.score);
    $("req").textContent = String(report.align.required_fail);
    $("ready").textContent = report.align.ready ? "YES" : "NO";
    $("utc").textContent = report.updated_utc;
    const board = $("board");
    board.innerHTML = "";
    report.endpoints.forEach(function (ep) {
      const div = document.createElement("div");
      div.className = "ep" + (ep.ok ? " ok" : " shadow") + (ep.verify === "http_required" ? " req" : "");
      const tag = ep.ok ? "ALIGNED" : "SHADOW";
      const tagClass = ep.ok ? "ok" : "shadow";
      const title = G && G.esc ? G.esc(ep.id) : ep.id;
      const extra = extraLine(ep);
      const sha = ep.sha256 ? ep.sha256.slice(0, 10) : "—";
      div.innerHTML =
        "<span class=\"tag " + tagClass + "\">" + tag + "</span>" +
        "<span class=\"meta\"><span class=\"t\">" + title + "</span><span class=\"g\">" + ep.role + " · " + extra + "</span></span>" +
        "<span class=\"sha\">" + sha + "</span>";
      board.appendChild(div);
    });
    $("card").textContent = JSON.stringify(report.restore, null, 2);
    $("status").textContent = report.align.ready
      ? "Required JSON surfaces are up. Propose is dry-run only — a human still publishes."
      : "Named misses on required JSON. Do not claim ALIGNED.";
  }

  async function runVerify() {
    $("status").innerHTML = "<span class=\"spin\"></span> GET public ledgers…";
    const endpoints = [];
    for (let i = 0; i < ENDPOINTS.length; i++) {
      endpoints.push(await pulseOne(ENDPOINTS[i]));
    }
    const align = score(endpoints);
    const restore = {
      signature: SIG,
      command: "restore",
      yield: align.yield,
      score: align.score,
      cap: 90,
      ready_for_public_presence: align.ready,
      live_star_chart_ingest: false,
      updated_utc: utcNow(),
      dual_ledgers: { link: align.link, star_feed: align.feed, agora_pulse: align.pulse },
      doors: {
        join: "https://excavationpro.ca/join/",
        agents: "https://excavationpro.ca/agents/",
        bench: "https://excavationpro.ca/bench/",
        lattice: "https://excavationpro.ca/lattice/",
        map: "https://excavationpro.ca/lattice/map.json",
        tv: "https://excavationpro.ca/sources/",
        skillhub: "https://excavationpro.ca/lygoskillhub.html",
        continuum: "https://excavationpro.ca/lygo-continuum.html",
        network: "https://deepseekoracle.github.io/lygo-protocol-stack/network/",
        agora: "https://deepseekoracle.github.io/lygo-protocol-stack/agent-agora/",
        clawhub_gate: "https://clawhub.ai/deepseekoracle/skills/lygo-public-lattice-gate",
        clawhub_sealer: "https://clawhub.ai/deepseekoracle/skills/lygo-geodesic-sealer"
      },
      install: { gate: INSTALL, sealer: SEALER },
      sha256: endpoints.filter(function (e) { return e.ok; }).map(function (e) {
        return { id: e.id, sha256: e.sha256 };
      })
    };
    last = {
      signature: SIG,
      version: "1.0.0",
      command: "verify",
      updated_utc: utcNow(),
      ok: align.required_fail === 0,
      align: align,
      endpoints: endpoints,
      restore: restore,
      policy: { network: "https_get_only", publish: "never", live_star_chart: false }
    };
    paint(last);
    return last;
  }

  function sanitizeId(raw) {
    const s = String(raw || "").trim().replace(/[^a-zA-Z0-9_\-.]/g, "-").slice(0, 64);
    return s || "lygo-agent";
  }

  function propose() {
    if (!last) {
      $("proposal").textContent = "Run verify first.";
      return;
    }
    const aid = sanitizeId($("agent-id").value);
    const draft = {
      signature: SIG,
      command: "propose",
      dry_run: true,
      live_star_chart_ingest: false,
      agent_id: aid,
      display_name: aid,
      skill_slug: "lygo-public-lattice-gate",
      yield: last.align.yield,
      verify_ok: last.ok,
      note: "Draft only. Steward ingest requires lygo-haven-star-chart + human --i-consent.",
      updated_utc: utcNow()
    };
    $("proposal").textContent = JSON.stringify(draft, null, 2);
  }

  async function contract() {
    if (!last) {
      $("credential").textContent = "Run verify first.";
      return;
    }
    const aid = sanitizeId($("agent-id").value);
    const body = {
      signature: SIG,
      command: "contract",
      dry_run: true,
      ledger_write: false,
      agent_id: aid,
      yield: last.align.yield,
      score: last.align.score,
      verify_ok: last.ok,
      dual_ledgers: last.restore.dual_ledgers,
      endpoint_sha256: last.restore.sha256,
      updated_utc: utcNow()
    };
    body.credential_sha256 = await sha256Text(JSON.stringify(body));
    $("credential").textContent = JSON.stringify(body, null, 2);
  }

  function copy(id) {
    const t = $(id).textContent || "";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () {
        $("status").textContent = "Copied.";
      }).catch(function () {
        window.prompt("Copy:", t);
      });
    } else window.prompt("Copy:", t);
  }

  $("audit").addEventListener("click", function () { runVerify(); });
  $("copy-card").addEventListener("click", function () { copy("card"); });
  $("propose").addEventListener("click", propose);
  $("copy-prop").addEventListener("click", function () { copy("proposal"); });
  $("contract").addEventListener("click", function () { contract(); });
  $("copy-cred").addEventListener("click", function () { copy("credential"); });
  runVerify();
})();
