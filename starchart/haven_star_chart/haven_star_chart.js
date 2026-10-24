/* Eternal Haven Star Chart — D3 engine (Δ9Φ963) + live lattice pulse v2.5 */
(function () {
  const DATA_REL = "haven_star_chart/haven_star_chart_data.json";
  const DATA_ABS = "/starchart/haven_star_chart/haven_star_chart_data.json";
  const META_REL = "haven_star_chart/haven_star_chart_meta.json";
  const META_ABS = "/starchart/haven_star_chart/haven_star_chart_meta.json";
  const QUEUE_REL = "haven_star_chart/haven_star_chart_queue.json";
  const QUEUE_ABS = "/starchart/haven_star_chart/haven_star_chart_queue.json";
  const MANIFEST_REL = "public_verify_manifest.json";
  const MANIFEST_ABS = "/starchart/public_verify_manifest.json";
  const DATA_PAGES =
    "https://deepseekoracle.github.io/lygo-protocol-stack/haven_star_chart/haven_star_chart_data.json";
  const DATA_FALLBACK =
    "https://raw.githubusercontent.com/DeepSeekOracle/lygo-protocol-stack/main/docs/haven_star_chart/haven_star_chart_data.json";
  const META_PAGES =
    "https://deepseekoracle.github.io/lygo-protocol-stack/haven_star_chart/haven_star_chart_meta.json";
  const META_FALLBACK =
    "https://raw.githubusercontent.com/DeepSeekOracle/lygo-protocol-stack/main/docs/haven_star_chart/haven_star_chart_meta.json";
  const PULSE_MS = 45000;

  let chartData = null;
  let lastMeta = null;
  let lastSha = "";
  let simulation = null;
  let zoomBehavior = null;
  let svgSel = null;
  let gRoot, gCosmos, linkSel, nodeSel;
  let visibleNodes = [];
  let chartW = 0;
  let chartH = 0;
  let activeConstellation = "all";
  let activeGalaxy = "all";
  let activeNebula = "all";
  let activeKind = "all";
  let showCosmosLayers = true;
  let includeTracks = false;
  let selectedNodeId = null;
  let pulseTimer = null;
  let tourTimer = null;
  let uiBound = false;

  const KIND_CHIPS = [
    { id: "all", label: "All kinds" },
    { id: "seal", label: "Seals" },
    { id: "champion", label: "Champions" },
    { id: "lattice", label: "Lattice" },
    { id: "portal", label: "Portals" },
    { id: "node", label: "Nodes" },
    { id: "music_track", label: "Tracks" },
  ];

  const el = (id) => document.getElementById(id);

  function parseSealId(id) {
    const s = String(id || "");
    if (s === "SEAL_000" || s === "GAB_SEAL_000") return { isCore: true };
    return { isCore: false };
  }

  function isTrack(n) {
    return n.kind === "music_track" || (n.cosmos || {}).star_role === "music_track";
  }

  function wantTracks() {
    if (includeTracks) return true;
    if (activeKind === "music_track") return true;
    if (activeConstellation === "music_codex") return true;
    if (activeGalaxy === "GALAXY_EXCAVATIONPRO_MUSIC") return true;
    return false;
  }

  function layerForNode(n) {
    if (n.layer != null) return n.layer;
    const t = n.tags || [];
    if (parseSealId(n.id).isCore) return 0;
    if (n.kind === "champion" || t.includes("CHAMPION")) return 1;
    if (n.kind === "portal") return 2;
    if (n.kind === "lattice") return 3;
    return 2;
  }

  async function fetchJson(urls) {
    for (const u of urls) {
      try {
        const r = await fetch(u, { cache: "no-store" });
        if (!r.ok) continue;
        return await r.json();
      } catch (e) {
        console.warn("fetch fail", u, e);
      }
    }
    return null;
  }

  async function loadData() {
    const data = await fetchJson([DATA_REL, DATA_ABS, DATA_PAGES, DATA_FALLBACK]);
    if (!data) throw new Error("Star chart data unavailable");
    chartData = data;
    lastSha = data.registry_sha256 || "";
    return chartData;
  }

  function nodeMatchesConstellation(n, cid) {
    if (cid === "all") return true;
    const c = (chartData.constellations || []).find((x) => x.id === cid);
    if (!c) return true;
    const tags = (n.tags || []).map((t) => String(t).toUpperCase());
    const ft = (c.filter_tags || []).map((t) => String(t).toUpperCase());
    if (n.kind === "champion" && cid === "council_ring") return true;
    if (cid === "council_ring" && (n.kind === "champion_egg" || n.id === "PORTAL_CHATAGENT" || n.id === "LATTICE_CHAMPION_EGG_VAULT"))
      return true;
    if (n.kind === "lattice" && cid === "lattice_growth") return true;
    if (n.kind === "portal" && cid === "guardian_veil") return true;
    if (cid === "music_codex") {
      if (n.id === "CHAMPION_LIGHTFATHER" || n.id === "CHAMPION_EGG_LIGHTFATHER") return true;
      if ((n.kind || "").startsWith("music") || tags.includes("MUSIC_CODEX") || tags.includes("MUSIC"))
        return true;
    }
    return ft.some((t) => tags.includes(t)) || parseSealId(n.id).isCore;
  }

  function nodeMatchesGalaxy(n, gid) {
    if (gid === "all") return true;
    if (gid === "GALAXY_EXCAVATIONPRO_MUSIC" && n.id === "CHAMPION_LIGHTFATHER") return true;
    return (n.cosmos || {}).galaxy_id === gid;
  }

  function nodeMatchesNebula(n, nid) {
    if (nid === "all") return true;
    return (n.cosmos || {}).nebula_id === nid;
  }

  function nodeMatchesKind(n, kind) {
    if (kind === "all") return true;
    if (kind === "seal") return (n.kind || "").startsWith("seal") || String(n.id || "").startsWith("SEAL_");
    if (kind === "music_track") return isTrack(n);
    if (kind === "node") return n.kind === "node" || String(n.id || "").startsWith("NODE_");
    if (kind === "champion") return n.kind === "champion" || n.kind === "champion_egg";
    return n.kind === kind;
  }

  function galaxyMap() {
    const m = new Map();
    (chartData.cosmos?.galaxies || []).forEach((g) => m.set(g.id, g));
    return m;
  }

  function nebulaMap() {
    const m = new Map();
    (chartData.cosmos?.nebulae || []).forEach((n) => m.set(n.id, n));
    return m;
  }

  function galaxyRadius(gid, half, gMap) {
    gid = String(gid || "");
    if (gid === "GALAXY_SINGULARITY") return 0;
    if (gid === "GALAXY_PRIMORDIAL_VAULT") return half * 0.2;
    if (gid === "GALAXY_PURE_DATA_ARCHIVE") return half * 0.34;
    if (gid === "GALAXY_GUARDIAN_VEIL") return half * 0.38;
    if (gid === "GALAXY_EXCAVATIONPRO_MUSIC") return half * 0.46;
    if (gid.startsWith("GALAXY_CHAMPION_")) {
      const deg = (gMap && gMap.get(gid) && gMap.get(gid).angle_deg) || 0;
      return half * (Math.round(deg / 24) % 2 ? 0.5 : 0.78);
    }
    if (gid === "GALAXY_ETERNAL_HAVEN") return half * 0.7;
    if (gid === "GALAXY_LATTICE") return half * 0.86;
    if (gid === "GALAXY_DEADMAN_FAILSAFE") return half * 0.8;
    if (gid === "GALAXY_AGENT_GROWTH") return half * 0.92;
    return half * 0.58;
  }

  function hash01(s) {
    let h = 2166136261;
    const t = String(s || "");
    for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
    return ((h >>> 0) % 10000) / 10000;
  }

  function isCoreId(id) {
    return id === "SEAL_000" || id === "GAB_SEAL_000";
  }

  function isAnchorNode(d) {
    if (!d) return false;
    if (isCoreId(d.id) || parseSealId(d.id).isCore) return true;
    return d.kind === "champion" || (d.cosmos || {}).star_role === "champion_anchor";
  }

  function layoutParentId(d, idMap) {
    if (!d || isCoreId(d.id)) return null;
    const conns = (d.connections || []).filter((c) => idMap.has(c) && c !== d.id);
    const champ = conns.find((c) => {
      const n = idMap.get(c);
      return n && (n.kind === "champion" || n.kind === "champion_egg");
    });
    if (champ) return champ;
    if (d.kind === "champion" || d.kind === "champion_egg") return idMap.has("SEAL_000") ? "SEAL_000" : null;
    const gid = String((d.cosmos || {}).galaxy_id || "");
    if (gid.startsWith("GALAXY_CHAMPION_")) {
      const cid = "CHAMPION_" + gid.slice("GALAXY_CHAMPION_".length);
      if (idMap.has(cid) && cid !== d.id) return cid;
    }
    if (idMap.has("SEAL_000")) return "SEAL_000";
    return null;
  }

  function seedOriginLayout(nodes, CX, CY, half, gMap) {
    const idMap = new Map(nodes.map((n) => [n.id, n]));
    nodes.forEach((d) => {
      d.originParent = layoutParentId(d, idMap);
      d.placed = false;
    });

    function assign(d, x, y) {
      d.homeX = x;
      d.homeY = y;
      d.x = x;
      d.y = y;
      d.vx = 0;
      d.vy = 0;
      d.fx = x;
      d.fy = y;
      d.placed = true;
    }

    function polar(ox, oy, i, n, r0, jit) {
      const a = -Math.PI / 2 + ((i + 0.5) / Math.max(n, 1)) * Math.PI * 2;
      const r = r0 + (hash01(String(i) + ":" + r0) - 0.5) * jit;
      return { x: ox + r * Math.cos(a), y: oy + r * Math.sin(a) };
    }

    nodes.forEach((d) => {
      if (d.id === "SEAL_000") assign(d, CX, CY);
      else if (d.id === "GAB_SEAL_000") assign(d, CX + 26, CY - 12);
    });

    nodes
      .filter((d) => d.kind === "champion")
      .forEach((d) => {
        const gid = (d.cosmos || {}).galaxy_id || "GALAXY_" + d.id;
        const g = gMap.get(gid);
        const ang = (((g && g.angle_deg) || 0) * Math.PI) / 180;
        const r = galaxyRadius(gid, half, gMap);
        assign(d, CX + r * Math.cos(ang), CY + r * Math.sin(ang));
      });

    let guard = 0;
    while (nodes.some((d) => !d.placed) && guard++ < 24) {
      const groups = new Map();
      nodes
        .filter((d) => !d.placed)
        .forEach((d) => {
          const p = d.originParent && idMap.get(d.originParent);
          const key = p && p.placed ? "P:" + p.id : "G:" + ((d.cosmos || {}).galaxy_id || "NA");
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(d);
        });
      groups.forEach((mems, key) => {
        let ox = CX;
        let oy = CY;
        let r0 = 52;
        if (key.startsWith("P:")) {
          const p = idMap.get(key.slice(2));
          ox = p.homeX;
          oy = p.homeY;
          r0 = 28 + Math.min(mems.length * 1.6, 52);
        } else {
          const gid = key.slice(2);
          const g = gMap.get(gid);
          const ang = (((g && g.angle_deg) || 0) * Math.PI) / 180;
          const r = galaxyRadius(gid, half, gMap);
          ox = CX + r * Math.cos(ang);
          oy = CY + r * Math.sin(ang);
          r0 = 36 + Math.min(mems.length * 1.1, 56);
        }
        mems.forEach((d, i) => {
          const pt = polar(ox, oy, i, mems.length, r0, 12);
          assign(d, pt.x, pt.y);
        });
      });
    }

    nodes.forEach((d) => {
      if (d.placed) return;
      const gid = (d.cosmos || {}).galaxy_id || "";
      const g = gMap.get(gid);
      const ang = (((g && g.angle_deg) || hash01(d.id) * 360) * Math.PI) / 180;
      const r = galaxyRadius(gid, half, gMap) || half * 0.5;
      assign(d, CX + r * Math.cos(ang), CY + r * Math.sin(ang));
    });
  }

  function isOriginationLink(l) {
    const a = l.source;
    const b = l.target;
    if (!a || !b) return false;
    const k = String(l.kind || "").toLowerCase();
    if (k === "fork" || k === "lineage" || k === "gravity") return true;
    if (a.originParent === b.id || b.originParent === a.id) return true;
    if (k === "canon" && (isCoreId(a.id) || isCoreId(b.id))) return true;
    if (k === "canon" && (a.kind === "champion" || b.kind === "champion")) return true;
    return false;
  }

  function fitToNodes(nodes, svg, zoomBehavior, W, H) {
    if (!nodes.length || !svg || !zoomBehavior) return;
    let minx = Infinity;
    let miny = Infinity;
    let maxx = -Infinity;
    let maxy = -Infinity;
    nodes.forEach((d) => {
      if (!Number.isFinite(d.x) || !Number.isFinite(d.y)) return;
      if (d.x < minx) minx = d.x;
      if (d.y < miny) miny = d.y;
      if (d.x > maxx) maxx = d.x;
      if (d.y > maxy) maxy = d.y;
    });
    if (!Number.isFinite(minx) || !Number.isFinite(miny)) return;
    const bw = Math.max(maxx - minx, 120);
    const bh = Math.max(maxy - miny, 120);
    const k = Math.min(W / (bw + 96), H / (bh + 96), 1.2);
    if (!Number.isFinite(k) || k <= 0) return;
    const tx = W / 2 - (k * (minx + maxx)) / 2;
    const ty = H / 2 - (k * (miny + maxy)) / 2;
    svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
  }

  function drawCosmosHalos(gCosmosGroup, nodes, CX, CY, R) {
    gCosmosGroup.selectAll("*").remove();
    if (!showCosmosLayers || !chartData.cosmos) return;

    const gMap = galaxyMap();
    const byGalaxy = d3.group(nodes, (d) => (d.cosmos || {}).galaxy_id || "unknown");
    const byNebula = d3.group(
      nodes.filter((d) => (d.cosmos || {}).nebula_id),
      (d) => d.cosmos.nebula_id
    );

    const galaxyLayer = gCosmosGroup.append("g").attr("class", "galaxy-halos");
    byGalaxy.forEach((members, gid) => {
      if (!gid || gid === "unknown" || gid === "GALAXY_SINGULARITY") return;
      const g = gMap.get(gid);
      const angle = ((g?.angle_deg || 0) * Math.PI) / 180;
      const r = galaxyRadius(gid, R, gMap);
      const cx = CX + r * Math.cos(angle);
      const cy = CY + r * Math.sin(angle);
      const rx = 55 + Math.min(members.length * 2.2, 180);
      const ry = 40 + Math.min(members.length * 1.6, 140);
      galaxyLayer
        .append("ellipse")
        .attr("class", "galaxy-halo")
        .attr("data-galaxy", gid)
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("rx", rx)
        .attr("ry", ry)
        .attr("transform", `rotate(${(g?.angle_deg || 0) * 0.35} ${cx} ${cy})`)
        .attr("fill", g?.color || "#7d00ff")
        .attr("opacity", activeGalaxy === "all" || activeGalaxy === gid ? 0.1 : 0.04)
        .attr("stroke", g?.color || "#7d00ff")
        .attr("stroke-opacity", activeGalaxy === "all" || activeGalaxy === gid ? 0.28 : 0.12)
        .attr("stroke-width", 1.4)
        .attr("cursor", "pointer")
        .on("click", (ev) => {
          ev.stopPropagation();
          setView({ galaxy: gid, nebula: "all" });
        });

      galaxyLayer.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 3).attr("fill", g?.color || "#7d00ff").attr("opacity", 0.35);

      const label = `${g?.glyph || "◈"} ${g?.name || gid}`;
      const labelY = cy - ry - 8;
      const labelW = Math.min(label.length * 5.8 + 14, 200);
      galaxyLayer
        .append("rect")
        .attr("class", "galaxy-label-bg")
        .attr("x", cx - labelW / 2)
        .attr("y", labelY - 11)
        .attr("width", labelW)
        .attr("height", 14)
        .attr("rx", 3);
      galaxyLayer
        .append("text")
        .attr("class", "galaxy-label-text")
        .attr("x", cx)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("fill", g?.color || "#c8b8ff")
        .attr("font-size", "10px")
        .attr("opacity", activeGalaxy === "all" || activeGalaxy === gid ? 0.88 : 0.45)
        .attr("cursor", "pointer")
        .text(label)
        .on("click", (ev) => {
          ev.stopPropagation();
          setView({ galaxy: gid, nebula: "all" });
        });
    });

    const nebulaLayer = gCosmosGroup.append("g").attr("class", "nebula-halos");
    byNebula.forEach((members, nebId) => {
      if (members.length < 2) return;
      const neb = nebulaMap().get(nebId);
      const xs = members.map((d) => d.x || 0);
      const ys = members.map((d) => d.y || 0);
      const cx = d3.mean(xs);
      const cy = d3.mean(ys);
      const spread = Math.sqrt(d3.mean(xs.map((x, i) => (x - cx) ** 2 + (ys[i] - cy) ** 2)) || 20);
      const rx = Math.max(22, spread * 1.35 + 12);
      const ry = Math.max(16, spread * 1.05 + 10);
      const g = gMap.get(members[0]?.cosmos?.galaxy_id);
      nebulaLayer
        .append("ellipse")
        .attr("class", "nebula-halo")
        .attr("data-nebula", nebId)
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("rx", rx)
        .attr("ry", ry)
        .attr("fill", g?.color || "#00f0ff")
        .attr("opacity", 0.055)
        .attr("stroke", g?.color || "#00f0ff")
        .attr("stroke-opacity", 0.16)
        .attr("stroke-dasharray", "4,6")
        .attr("stroke-width", 0.9)
        .attr("cursor", "pointer")
        .on("click", (ev) => {
          ev.stopPropagation();
          const gid = members[0]?.cosmos?.galaxy_id;
          setView({ galaxy: gid || activeGalaxy, nebula: nebId });
        });
      if (members.length >= 4 && neb?.name) {
        const short = neb.name.length > 28 ? neb.name.slice(0, 26) + "…" : neb.name;
        const nw = short.length * 4.6 + 10;
        nebulaLayer
          .append("rect")
          .attr("class", "galaxy-label-bg")
          .attr("x", cx - nw / 2)
          .attr("y", cy - 2)
          .attr("width", nw)
          .attr("height", 11)
          .attr("rx", 2)
          .attr("opacity", 0.85);
        nebulaLayer
          .append("text")
          .attr("class", "nebula-label-text")
          .attr("x", cx)
          .attr("y", cy + 6)
          .attr("text-anchor", "middle")
          .attr("fill", "#a8a8cc")
          .attr("font-size", "8px")
          .attr("opacity", 0.65)
          .text(short);
      }
    });
  }

  function setPulse(state, text) {
    const led = el("pulseLed");
    const msg = el("pulseText");
    if (led) {
      led.className = "pulse-led " + (state || "idle");
      led.title = text || state || "";
    }
    if (msg) msg.textContent = text || "";
    const shaEl = el("pulseSha");
    if (shaEl) shaEl.textContent = lastSha ? lastSha.slice(0, 12) + "…" : "—";
  }

  function updateStatusLine() {
    const total = chartData?.node_count || chartData?.nodes?.length || 0;
    const shown = visibleNodes.length;
    const folded = wantTracks() ? 0 : (chartData?.nodes || []).filter(isTrack).length;
    const sig = chartData?.signature || "v2";
    let line = `Live — ${shown} on sky`;
    if (folded) line += ` · ${folded} tracks folded (Music Codex or ♪ Tracks to expand)`;
    else if (shown !== total) line += ` / ${total} registry`;
    else line += ` / ${total} registry`;
    line += ` · ${sig}`;
    if (el("loadStatus")) el("loadStatus").textContent = line;
    if (el("statHidden")) el("statHidden").textContent = folded ? String(folded) : "0";
  }

  function fillQueue(meta) {
    if (!meta) return;
    const p = el("portalPending");
    const a = el("portalAccepted");
    const q = meta.submission_queue || meta;
    if (p && q.pending != null) p.textContent = String(q.pending);
    if (a && q.accepted != null) a.textContent = String(q.accepted);
  }

  function initChart() {
    const container = el("starmap");
    if (!container || !chartData) return;
    if (typeof d3 === "undefined") {
      if (el("loadStatus")) el("loadStatus").textContent = "D3 engine missing";
      setPulse("err", "D3 failed to load");
      return;
    }
    if (simulation) simulation.stop();
    const wrap = el("starmap-wrap");
    let W = container.clientWidth || wrap?.clientWidth || 0;
    let H =
      container.clientHeight ||
      wrap?.clientHeight ||
      0;
    if (W < 40 || H < 40) {
      initChart._tries = (initChart._tries || 0) + 1;
      if (initChart._tries < 10) {
        requestAnimationFrame(initChart);
        return;
      }
      W = W || 900;
      H = H || Math.max(520, Math.floor((window.innerHeight || 800) * 0.72));
    }
    initChart._tries = 0;
    chartW = W;
    chartH = H;
    const CX = W / 2;
    const CY = H / 2;
    const R = Math.max(140, Math.min(W, H) / 2 - 36);
    const tracksOn = wantTracks();

    const svg = d3.select("#starmap").attr("width", W).attr("height", H);
    svgSel = svg;
    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    const glow = defs
      .append("filter")
      .attr("id", "star-glow")
      .attr("x", "-80%")
      .attr("y", "-80%")
      .attr("width", "260%")
      .attr("height", "260%");
    glow.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "blur");
    const merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    gRoot = svg.append("g");
    gCosmos = gRoot.append("g").attr("class", "cosmos-layer");
    zoomBehavior = d3.zoom().scaleExtent([0.08, 12]).on("zoom", (ev) => {
      if (gRoot) gRoot.attr("transform", ev.transform);
    });
    svg.call(zoomBehavior);

    const stars = d3.range(220).map(() => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.1 + 0.15,
      o: Math.random() * 0.22 + 0.06,
    }));
    gRoot
      .append("g")
      .attr("class", "starfield")
      .selectAll("circle")
      .data(stars)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("fill", "#fff")
      .attr("opacity", (d) => d.o);

    let nodes = chartData.nodes.map((n) => ({ ...n, depth: layerForNode(n) }));
    nodes = nodes.filter(
      (n) =>
        nodeMatchesConstellation(n, activeConstellation) &&
        nodeMatchesGalaxy(n, activeGalaxy) &&
        nodeMatchesNebula(n, activeNebula) &&
        nodeMatchesKind(n, activeKind) &&
        (tracksOn || !isTrack(n))
    );
    visibleNodes = nodes;
    const idSet = new Set(nodes.map((n) => n.id));
    const idMap = new Map(nodes.map((n) => [n.id, n]));
    const gMap = galaxyMap();
    seedOriginLayout(nodes, CX, CY, R, gMap);

    const seen = new Set();
    const raw = [];
    function pushLink(src, tgt, kind) {
      if (!src || !tgt || src === tgt) return;
      if (!idSet.has(src) || !idSet.has(tgt)) return;
      const key = src < tgt ? src + ">" + tgt : tgt + ">" + src;
      if (seen.has(key)) return;
      seen.add(key);
      raw.push({ source: src, target: tgt, kind: kind || "canon" });
    }
    (chartData.links || []).forEach((l) => {
      const s = typeof l.source === "string" ? l.source : l.source && l.source.id;
      const t = typeof l.target === "string" ? l.target : l.target && l.target.id;
      pushLink(s, t, l.kind);
    });
    nodes.forEach((n) => {
      (n.connections || []).forEach((c) => {
        const kind =
          n.kind === "champion" || String(c).startsWith("CHAMPION_")
            ? "fork"
            : isCoreId(c) || isCoreId(n.id)
              ? "canon"
              : "canon";
        pushLink(n.id, c, kind);
      });
      if (n.originParent) {
        const pk = n.kind === "champion" || String(n.originParent).startsWith("CHAMPION_") ? "fork" : "canon";
        pushLink(n.id, n.originParent, pk);
      }
    });

    const links = raw
      .map((l) => ({
        source: idMap.get(l.source),
        target: idMap.get(l.target),
        kind: l.kind,
      }))
      .filter((l) => isOriginationLink(l));

    drawCosmosHalos(gCosmos, nodes, CX, CY, R);

    const heavy = false;
    linkSel = gRoot
      .append("g")
      .attr("class", "link-layer")
      .attr("stroke-opacity", 0.38)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "chart-link")
      .attr("stroke", (d) => {
        if (d.kind === "fork" || d.kind === "lineage") return "#ffd76a";
        if (d.kind === "gravity") return "#5a4a7a";
        return "#00d8e8";
      })
      .attr("stroke-width", (d) => {
        if (d.kind === "fork" || d.kind === "lineage") return 2.6;
        if (d.kind === "gravity") return 0.55;
        return heavy ? 0.7 : 1.1;
      })
      .attr("stroke-opacity", (d) => {
        if (d.kind === "fork" || d.kind === "lineage") return 0.9;
        if (d.kind === "canon") return 0.55;
        if (d.kind === "gravity") return 0.28;
        return 0.18;
      })
      .attr("stroke-dasharray", (d) => {
        if (d.kind === "gravity") return "5,7";
        if (d.kind === "fork" || d.kind === "lineage") return "2,3";
        return null;
      })
      .attr("stroke-linecap", "round");

    nodeSel = gRoot
      .append("g")
      .selectAll("g")
      .data(nodes, (d) => d.id)
      .join("g")
      .attr("class", (d) => "star-node" + (selectedNodeId === d.id ? " selected" : ""))
      .style("cursor", "pointer")
      .on("click", (ev, d) => {
        ev.stopPropagation();
        showDetail(d, true);
      })
      .on("mouseenter", (_, d) => {
        linkSel.classed("link-highlight", (l) => (l.source && l.source.id === d.id) || (l.target && l.target.id === d.id));
        nodeSel.classed("hover", (n) => n.id === d.id);
      })
      .on("mouseleave", () => {
        linkSel.classed("link-highlight", false);
        nodeSel.classed("hover", false);
      })
      .call(
        d3
          .drag()
          .on("start", (ev, d) => {
            if (!ev.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (ev, d) => {
            d.fx = ev.x;
            d.fy = ev.y;
          })
          .on("end", (ev, d) => {
            if (!ev.active) simulation.alphaTarget(0);
            d.homeX = d.x;
            d.homeY = d.y;
            d.fx = d.x;
            d.fy = d.y;
          })
      );

    function nodeFill(d) {
      const gcol = gMap.get((d.cosmos || {}).galaxy_id)?.color;
      if (parseSealId(d.id).isCore) return "#ffcc00";
      if (d.kind === "champion") return gcol || "#7d00ff";
      if (d.kind === "lattice") return "#00ff88";
      if (d.kind === "portal") return "#ff6600";
      if (d.kind === "music_track") return "#66e0ff";
      if ((d.cosmos || {}).star_role === "agent_growth") return "#e94560";
      return gcol ? d3.color(gcol)?.brighter(0.5)?.formatHex?.() || "#00f0ff" : "#00f0ff";
    }

    function nodeRadius(d) {
      if (parseSealId(d.id).isCore) return 22;
      if (d.kind === "champion") return 14;
      if (d.kind === "lattice") return 8;
      if (d.kind === "music_track") return 5;
      return 10;
    }

    nodeSel
      .append("circle")
      .attr("class", "star-glow")
      .attr("r", (d) => nodeRadius(d) * 1.55)
      .attr("fill", (d) => nodeFill(d))
      .attr("opacity", (d) => (parseSealId(d.id).isCore ? 0.35 : 0.22))
      .attr("filter", heavy ? null : "url(#star-glow)");

    nodeSel
      .append("circle")
      .attr("class", "star-core")
      .attr("r", nodeRadius)
      .attr("fill", nodeFill)
      .attr("stroke", (d) => (parseSealId(d.id).isCore ? "#fff8d0" : "#e8e8ff"))
      .attr("stroke-width", (d) => (parseSealId(d.id).isCore ? 1.2 : 0.65))
      .attr("stroke-opacity", 0.85);

    nodeSel
      .filter((d) => d.kind === "champion" && !parseSealId(d.id).isCore)
      .append("circle")
      .attr("class", "star-ring")
      .attr("r", (d) => nodeRadius(d) + 4)
      .attr("fill", "none")
      .attr("stroke", (d) => nodeFill(d))
      .attr("stroke-opacity", 0.45)
      .attr("stroke-width", 1);

    nodeSel
      .append("text")
      .attr("class", "star-glyph")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .attr("fill", (d) => (parseSealId(d.id).isCore ? "#1a1200" : "#f0f0ff"))
      .attr("font-size", (d) => (parseSealId(d.id).isCore ? "17px" : d.kind === "music_track" ? "0px" : "11px"))
      .attr("font-weight", (d) => (parseSealId(d.id).isCore ? "700" : "500"))
      .attr("pointer-events", "none")
      .text((d) => (d.kind === "music_track" ? "" : (d.glyph || "✦").split(" ")[0]));

    nodeSel.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
    linkSel
      .attr("x1", (d) => (d.source && d.source.x) || 0)
      .attr("y1", (d) => (d.source && d.source.y) || 0)
      .attr("x2", (d) => (d.target && d.target.x) || 0)
      .attr("y2", (d) => (d.target && d.target.y) || 0);

    let haloTick = 0;
    simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((l) => {
            if (l.kind === "gravity") return 150;
            if (l.kind === "fork" || l.kind === "lineage") return 64;
            if (l.kind === "canon") return 48;
            return 26;
          })
          .strength((l) => {
            if (l.kind === "gravity") return 0.12;
            if (l.kind === "canon" || l.kind === "fork" || l.kind === "lineage") return 0.75;
            return 0.18;
          })
      )
      .force("charge", d3.forceManyBody().strength(-22).distanceMax(90))
      .force("collide", d3.forceCollide().radius((d) => (parseSealId(d.id).isCore ? 28 : d.kind === "champion" ? 18 : 11)).strength(0.85))
      .force("home", (alpha) => {
        const k = alpha * 0.42;
        nodes.forEach((d) => {
          if (d.fx != null || d.homeX == null || d.homeY == null) return;
          d.vx += (d.homeX - d.x) * k;
          d.vy += (d.homeY - d.y) * k;
        });
      })
      .alpha(0.7)
      .alphaDecay(0.04)
      .alphaMin(0.018)
      .on("tick", () => {
        linkSel
          .attr("x1", (d) => (d.source && d.source.x) || 0)
          .attr("y1", (d) => (d.source && d.source.y) || 0)
          .attr("x2", (d) => (d.target && d.target.x) || 0)
          .attr("y2", (d) => (d.target && d.target.y) || 0);
        nodeSel.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
        haloTick += 1;
        if (showCosmosLayers && haloTick % 12 === 0) drawCosmosHalos(gCosmos, nodes, CX, CY, R);
      })
      .on("end", () => {
        if (showCosmosLayers) drawCosmosHalos(gCosmos, nodes, CX, CY, R);
      });

    if (el("statNodes")) el("statNodes").textContent = `${nodes.length}` + (chartData.node_count && chartData.node_count !== nodes.length ? ` / ${chartData.node_count}` : "");
    if (el("statLinks")) el("statLinks").textContent = String(links.length);
    if (el("statSha")) el("statSha").textContent = (chartData.registry_sha256 || "").slice(0, 12) + "…";
    if (el("statSync")) el("statSync").textContent = chartData.generated_utc || "—";
    const cg = chartData.cosmos?.galaxy_count;
    if (el("statGalaxies") && cg != null) el("statGalaxies").textContent = String(cg);
    if (el("statNebulae") && chartData.cosmos?.nebula_count != null) {
      el("statNebulae").textContent = String(chartData.cosmos.nebula_count);
    }
    updateStatusLine();
    const tracksBtn = el("toggleTracks");
    if (tracksBtn) tracksBtn.textContent = tracksOn ? "Fold tracks" : "♪ Tracks";
    populateRoster();
    syncNavChrome();
    if (activeGalaxy !== "all" || activeNebula !== "all") {
      simulation?.on("end.navfly", () => {
        simulation.on("end.navfly", null);
        flyToVisibleCentroid(activeNebula !== "all" ? 2.6 : 1.55);
      });
    } else {
      fitToNodes(nodes, svg, zoomBehavior, W, H);
    }
  }

  function showDetail(d, writeHash) {
    if (!d) return;
    selectedNodeId = d.id;
    if (nodeSel) nodeSel.attr("class", (n) => "star-node" + (n.id === selectedNodeId ? " selected" : ""));
    if (el("detailTitle")) el("detailTitle").textContent = d.name || d.id;
    if (el("detailId")) el("detailId").textContent = d.id;
    if (el("detailEq")) el("detailEq").textContent = d.equation || "—";
    if (el("detailTone")) el("detailTone").textContent = d.tone || "—";
    if (el("detailTags")) el("detailTags").textContent = (d.tags || []).join(" · ") || "—";
    const urls = d.urls || {};
    const live =
      urls.summon ||
      urls.council ||
      urls.listen ||
      urls.stream ||
      urls.live ||
      urls.clawhub ||
      urls.repo ||
      d.url ||
      "";
    const link = el("detailLink");
    if (live && link) {
      link.href = live;
      if (urls.summon && (d.kind === "champion" || d.kind === "champion_egg")) {
        link.textContent = "Summon at chatagent.ca →";
      } else if (urls.stream || d.kind === "music_track") {
        link.textContent = "Listen / stream →";
      } else if (urls.council && d.kind === "champion") {
        link.textContent = "Council roster →";
      } else {
        link.textContent = "Open anchor →";
      }
      link.style.display = "inline";
    } else if (link) {
      link.style.display = "none";
    }
    if (el("detailKind")) el("detailKind").textContent = d.kind || "star";
    const c = d.cosmos || {};
    if (el("detailGalaxy")) el("detailGalaxy").textContent = c.galaxy_name || "—";
    if (el("detailNebula")) el("detailNebula").textContent = c.nebula_name || "—";
    if (el("detailCluster")) el("detailCluster").textContent = c.cluster_name || "—";
    if (el("detailStarRole")) el("detailStarRole").textContent = c.star_role || "—";
    const lin = d.lineage || {};
    if (el("detailLineage")) {
      if (!lin.lineage_root && lin.generation == null) {
        el("detailLineage").textContent = "—";
      } else {
        const parts = [];
        if (lin.public_mask) parts.push(lin.public_mask);
        if (lin.generation != null) parts.push(`gen ${lin.generation}`);
        if (lin.parent_public_id) parts.push(`← ${lin.parent_public_id}`);
        if (lin.relation) parts.push(lin.relation);
        el("detailLineage").textContent = parts.join(" · ") || (lin.lineage_root || "").slice(0, 16) + "…";
      }
    }
    if (writeHash !== false) {
      const next = "#star=" + encodeURIComponent(d.id);
      if (location.hash !== next) history.replaceState(null, "", next);
    }
  }

  function flyTo(d) {
    if (!d || d.x == null || !zoomBehavior || !svgSel) return;
    const k = 2.4;
    const t = d3.zoomIdentity.translate(chartW / 2 - d.x * k, chartH / 2 - d.y * k).scale(k);
    svgSel.transition().duration(700).call(zoomBehavior.transform, t);
  }

  function findNode(id) {
    const needle = String(id || "").trim();
    if (!needle || !chartData?.nodes) return null;
    const up = needle.toUpperCase();
    return (
      chartData.nodes.find((n) => n.id === needle) ||
      chartData.nodes.find((n) => String(n.id).toUpperCase() === up) ||
      null
    );
  }

  function focusStar(id, opts) {
    const d0 = findNode(id);
    if (!d0) return false;
    const needTracks = isTrack(d0) && !wantTracks();
    if (needTracks) {
      includeTracks = true;
      initChart();
    }
    const apply = () => {
      const live = visibleNodes.find((n) => n.id === d0.id);
      showDetail(live || d0, opts?.writeHash !== false);
      if (live) flyTo(live);
    };
    if (simulation && simulation.alpha() > 0.04) {
      simulation.on("end.focus", () => {
        simulation.on("end.focus", null);
        apply();
      });
      setTimeout(apply, 900);
    } else {
      apply();
    }
    return true;
  }

  function parseHash() {
    const h = (location.hash || "").replace(/^#/, "");
    if (!h) return { star: "" };
    if (h.includes("=") && (h.includes("galaxy=") || h.includes("constellation=") || h.includes("nebula=") || h.includes("star=") || h.includes("id="))) {
      const q = new URLSearchParams(h.replace(/;/g, "&"));
      return {
        star: q.get("star") || q.get("id") || "",
        galaxy: q.get("galaxy") || "",
        constellation: q.get("constellation") || "",
        nebula: q.get("nebula") || "",
      };
    }
    if (h.startsWith("star=")) return { star: decodeURIComponent(h.slice(5)) };
    if (h.startsWith("id=")) return { star: decodeURIComponent(h.slice(3)) };
    if (h.startsWith("galaxy=")) return { star: "", galaxy: decodeURIComponent(h.slice(7)) };
    if (h.startsWith("constellation=")) return { star: "", constellation: decodeURIComponent(h.slice(14)) };
    if (/^(SEAL_|CHAMPION_|MUSIC_|LATTICE_|PORTAL_|NODE_|HERO_|LORE_|GAB_)/i.test(h)) return { star: decodeURIComponent(h) };
    return { star: "" };
  }

  function applyHashView() {
    const parsed = parseHash();
    const patch = {};
    if (parsed.galaxy) patch.galaxy = parsed.galaxy;
    if (parsed.constellation) patch.constellation = parsed.constellation;
    if (parsed.nebula) patch.nebula = parsed.nebula;
    if (Object.keys(patch).length) setView(patch, { rebuild: true });
    if (parsed.star) focusStar(parsed.star, { writeHash: false });
    return parsed.star || "";
  }

  function searchStars(q) {
    const s = String(q || "").trim().toLowerCase();
    const box = el("searchHits");
    if (!box) return;
    if (s.length < 2 || !chartData?.nodes) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    const hits = [];
    for (const n of chartData.nodes) {
      const blob = `${n.id} ${n.name || ""} ${(n.tags || []).join(" ")} ${n.kind || ""}`.toLowerCase();
      if (blob.includes(s)) hits.push(n);
      if (hits.length >= 18) break;
    }
    if (!hits.length) {
      box.hidden = false;
      box.innerHTML = '<div class="search-empty">No stars match</div>';
      return;
    }
    box.hidden = false;
    box.innerHTML = hits
      .map(
        (n) =>
          `<button type="button" class="search-hit" data-star="${n.id.replace(/"/g, "")}"><span>${escapeHtml(
            n.id
          )}</span><small>${escapeHtml(n.name || n.kind || "")}</small></button>`
      )
      .join("");
    box.querySelectorAll("[data-star]").forEach((btn) => {
      btn.addEventListener("click", () => {
        focusStar(btn.getAttribute("data-star"));
        box.hidden = true;
      });
    });
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function shortGlyph(g) {
    const raw = String(g?.glyph || "◈").trim();
    if (!raw || raw.includes("(") || raw.length > 8) {
      if (g?.champion_id) return "Δ9";
      if (String(g?.id || "").includes("MUSIC")) return "♪";
      return "◈";
    }
    return raw.split(" ")[0];
  }

  function galaxyGroupName(g) {
    const id = g.id || "";
    if (id === "GALAXY_SINGULARITY" || id === "GALAXY_PRIMORDIAL_VAULT") return "Core";
    if (id.startsWith("GALAXY_CHAMPION_")) return "Δ9 Council";
    if (id === "GALAXY_LATTICE" || id === "GALAXY_GUARDIAN_VEIL") return "Infrastructure";
    if (id === "GALAXY_EXCAVATIONPRO_MUSIC") return "Music Codex";
    return "Haven & archive";
  }

  function galaxiesForTour() {
    return [...(chartData?.cosmos?.galaxies || [])].sort((a, b) => (a.angle_deg || 0) - (b.angle_deg || 0));
  }

  function constellationsForTour() {
    return chartData?.constellations || [];
  }

  function nebulaeForGalaxy(gid) {
    if (!gid || gid === "all") return [];
    return (chartData?.cosmos?.nebulae || [])
      .filter((n) => n.galaxy_id === gid)
      .sort((a, b) => (b.star_count || 0) - (a.star_count || 0));
  }

  function galaxyById(id) {
    return (chartData?.cosmos?.galaxies || []).find((g) => g.id === id) || null;
  }

  function constellationById(id) {
    return (chartData?.constellations || []).find((c) => c.id === id) || null;
  }

  function nebulaById(id) {
    return (chartData?.cosmos?.nebulae || []).find((n) => n.id === id) || null;
  }

  function stopTour() {
    if (tourTimer) {
      clearInterval(tourTimer);
      tourTimer = null;
    }
    const t = el("galTour");
    if (t) t.textContent = "Tour";
  }

  function setView(partial, opts) {
    const rebuild = opts?.rebuild !== false;
    if (partial.galaxy != null) {
      activeGalaxy = partial.galaxy;
      if (partial.nebula == null) activeNebula = "all";
    }
    if (partial.constellation != null) activeConstellation = partial.constellation;
    if (partial.nebula != null) activeNebula = partial.nebula;
    if (partial.kind != null) activeKind = partial.kind;
    if (partial.galaxy === "all") activeNebula = "all";
    if (!opts?.keepTour) stopTour();
    populateGalaxyFilters();
    populateConstellationFilters();
    populateNebulaFilters();
    populateKindChips();
    syncNavChrome();
    if (rebuild) initChart();
  }

  function cycleList(list, current, dir) {
    if (!list.length) return current;
    const ids = list.map((x) => x.id);
    let i = ids.indexOf(current);
    if (i < 0) i = dir > 0 ? -1 : 0;
    i = (i + dir + ids.length) % ids.length;
    return ids[i];
  }

  function cycleGalaxy(dir) {
    const items = [{ id: "all" }, ...galaxiesForTour()];
    setView({ galaxy: cycleList(items, activeGalaxy, dir), nebula: "all" }, { keepTour: !!tourTimer });
  }

  function cycleConstellation(dir) {
    const items = [{ id: "all" }, ...constellationsForTour()];
    setView({ constellation: cycleList(items, activeConstellation, dir) }, { keepTour: !!tourTimer });
  }

  function cycleNebula(dir) {
    const items = [{ id: "all" }, ...nebulaeForGalaxy(activeGalaxy)];
    if (items.length < 2) return;
    setView({ nebula: cycleList(items, activeNebula, dir) }, { keepTour: !!tourTimer });
  }

  function toggleTour() {
    if (tourTimer) {
      stopTour();
      return;
    }
    const t = el("galTour");
    if (t) t.textContent = "Stop";
    cycleGalaxy(1);
    tourTimer = setInterval(() => cycleGalaxy(1), 6500);
  }

  function flyToVisibleCentroid(k) {
    const pts = visibleNodes.filter((d) => d.x != null && d.y != null);
    if (!pts.length || !zoomBehavior || !svgSel) return;
    const cx = d3.mean(pts, (d) => d.x);
    const cy = d3.mean(pts, (d) => d.y);
    const scale = k || 1.6;
    const t = d3.zoomIdentity.translate(chartW / 2 - cx * scale, chartH / 2 - cy * scale).scale(scale);
    svgSel.transition().duration(650).call(zoomBehavior.transform, t);
  }

  function syncNavChrome() {
    const g = galaxyById(activeGalaxy);
    const c = constellationById(activeConstellation);
    const n = nebulaById(activeNebula);
    const galLabel = activeGalaxy === "all" ? "All galaxies" : `${shortGlyph(g)} ${g?.name || activeGalaxy}`;
    const conLabel = activeConstellation === "all" ? "All constellations" : `${c?.glyph || "✦"} ${c?.name || activeConstellation}`;
    const nebLabel = activeNebula === "all" ? "All nebulae" : n?.name || activeNebula;
    if (el("galNow")) el("galNow").textContent = galLabel;
    if (el("conNow")) el("conNow").textContent = conLabel;
    if (el("nebNow")) el("nebNow").textContent = nebLabel;
    const crumbs = ["All sky"];
    if (activeConstellation !== "all") crumbs.push(c?.name || activeConstellation);
    if (activeGalaxy !== "all") crumbs.push(g?.name || activeGalaxy);
    if (activeNebula !== "all") crumbs.push(n?.name || activeNebula);
    if (activeKind !== "all") crumbs.push(KIND_CHIPS.find((k) => k.id === activeKind)?.label || activeKind);
    if (el("skyCrumb")) el("skyCrumb").textContent = crumbs.join(" · ");
    const nebRow = el("nebulaCycleRow");
    const nebBlock = el("nebulaBlock");
    const showNeb = activeGalaxy !== "all" && nebulaeForGalaxy(activeGalaxy).length > 0;
    if (nebRow) nebRow.hidden = !showNeb;
    if (nebBlock) nebBlock.hidden = !showNeb;
  }

  function populateKindChips() {
    const wrap = el("kindChips");
    if (!wrap) return;
    wrap.innerHTML = KIND_CHIPS.map(
      (k) =>
        `<button type="button" data-kind="${k.id}" class="${activeKind === k.id ? "active" : ""}">${k.label}</button>`
    ).join("");
    wrap.querySelectorAll("[data-kind]").forEach((btn) => {
      btn.addEventListener("click", () => setView({ kind: btn.getAttribute("data-kind") || "all" }));
    });
  }

  function populateConstellationFilters() {
    const wrap = el("constellationBtns");
    if (!wrap) return;
    const items = [{ id: "all", name: "All sky", glyph: "✦" }, ...constellationsForTour()];
    wrap.innerHTML = items
      .map((c) => {
        const label = c.id === "all" ? "All sky" : `${c.glyph || "✦"} ${c.name}`;
        return `<button type="button" data-constellation="${c.id}" class="${
          activeConstellation === c.id ? "active" : ""
        }" title="${escapeHtml(c.description || c.name || "")}">${escapeHtml(label)}</button>`;
      })
      .join("");
    wrap.querySelectorAll("[data-constellation]").forEach((btn) => {
      btn.addEventListener("click", () => setView({ constellation: btn.getAttribute("data-constellation") || "all" }));
    });
  }

  function populateNebulaFilters() {
    const wrap = el("nebulaBtns");
    if (!wrap) return;
    const items = nebulaeForGalaxy(activeGalaxy);
    wrap.innerHTML =
      `<button type="button" data-nebula="all" class="${activeNebula === "all" ? "active" : ""}">All nebulae</button>` +
      items
        .map((n) => {
          const name = n.name || n.id;
          const short = name.length > 28 ? name.slice(0, 26) + "…" : name;
          return `<button type="button" data-nebula="${n.id}" class="${
            activeNebula === n.id ? "active" : ""
          }" title="${escapeHtml(name)}">${escapeHtml(short)} <span class="count">${n.star_count || ""}</span></button>`;
        })
        .join("");
    wrap.querySelectorAll("[data-nebula]").forEach((btn) => {
      btn.addEventListener("click", () => setView({ nebula: btn.getAttribute("data-nebula") || "all" }));
    });
  }

  function populateGalaxyFilters() {
    const wrap = el("galaxyBtns");
    if (!wrap || !chartData?.cosmos?.galaxies) return;
    const q = String(el("galaxyFilter")?.value || "")
      .trim()
      .toLowerCase();
    const groups = new Map();
    const order = ["Core", "Δ9 Council", "Infrastructure", "Haven & archive", "Music Codex"];
    galaxiesForTour().forEach((g) => {
      const blob = `${g.id} ${g.name} ${g.champion_id || ""}`.toLowerCase();
      if (q && !blob.includes(q)) return;
      const gn = galaxyGroupName(g);
      if (!groups.has(gn)) groups.set(gn, []);
      groups.get(gn).push(g);
    });
    let html = `<div class="galaxy-group"><div class="galaxy-group-btns"><button type="button" data-galaxy="all" class="${
      activeGalaxy === "all" ? "active" : ""
    }">All galaxies</button></div></div>`;
    order.forEach((gn) => {
      const list = groups.get(gn);
      if (!list?.length) return;
      html += `<div class="galaxy-group"><h3>${gn}</h3><div class="galaxy-group-btns">`;
      list.forEach((g) => {
        html += `<button type="button" data-galaxy="${g.id}" class="${
          activeGalaxy === g.id ? "active" : ""
        }" title="${escapeHtml(g.description || g.name)}">${escapeHtml(shortGlyph(g) + " " + g.name)} <span class="count">${
          g.star_count || 0
        }</span></button>`;
      });
      html += `</div></div>`;
    });
    wrap.innerHTML = html;
    wrap.querySelectorAll("[data-galaxy]").forEach((btn) => {
      btn.addEventListener("click", () => setView({ galaxy: btn.getAttribute("data-galaxy") || "all", nebula: "all" }));
    });
  }

  function populateRoster() {
    const box = el("starRoster");
    if (!box) return;
    const q = String(el("rosterFilter")?.value || "")
      .trim()
      .toLowerCase();
    let rows = visibleNodes.slice();
    if (q) {
      rows = rows.filter((n) => `${n.id} ${n.name || ""} ${n.kind || ""}`.toLowerCase().includes(q));
    }
    rows.sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
    const total = rows.length;
    const shown = rows.slice(0, 140);
    if (!shown.length) {
      box.innerHTML = '<div class="search-empty">No stars in this view</div>';
      return;
    }
    box.innerHTML =
      shown
        .map((n) => {
          const active = n.id === selectedNodeId ? " active" : "";
          return `<button type="button" class="${active.trim()}" data-star="${escapeHtml(n.id)}"><span>${escapeHtml(
            n.name || n.id
          )}</span><span>${escapeHtml(n.kind || "")}</span><small>${escapeHtml(n.id)}</small></button>`;
        })
        .join("") +
      (total > shown.length ? `<div class="search-empty">${total - shown.length} more — refine the filter</div>` : "");
    box.querySelectorAll("[data-star]").forEach((btn) => {
      btn.addEventListener("click", () => {
        focusStar(btn.getAttribute("data-star"));
      });
    });
  }

  async function pulseOnce() {
    const meta = await fetchJson([META_REL, META_ABS, META_PAGES, META_FALLBACK]);
    if (!meta) {
      setPulse("stale", "Pulse: meta unreachable — showing last loaded registry");
      return;
    }
    lastMeta = meta;
    fillQueue(meta);
    const sha = meta.registry_sha256 || "";
    const built = meta.generated_utc || "";
    const q = meta.submission_queue || {};
    const pending = q.pending ?? 0;
    if (sha && lastSha && sha !== lastSha) {
      setPulse("live", "Registry SHA changed — resyncing sky…");
      try {
        await loadData();
        populateGalaxyFilters();
        populateConstellationFilters();
        populateNebulaFilters();
        populateKindChips();
        initChart();
        setPulse("live", `Resynced · ${chartData.node_count} stars · ${built}`);
      } catch (e) {
        setPulse("err", "Resync failed");
      }
      return;
    }
    if (sha) lastSha = sha;
    const ageMin = built ? Math.max(0, (Date.now() - Date.parse(built)) / 60000) : null;
    const age =
      ageMin == null || Number.isNaN(ageMin)
        ? ""
        : ageMin < 90
          ? Math.round(ageMin) + "m old"
          : Math.round(ageMin / 60) + "h old";
    setPulse("live", `Public C mirror live · ${pending} pending · ${age}`);
    const man = await fetchJson([MANIFEST_REL, MANIFEST_ABS]);
    if (man && el("layerPulse")) {
      const a = man.layers?.A_classic?.registry_merkle_root || "";
      const b = man.layers?.B_sovereign?.registry_merkle_root || "";
      el("layerPulse").textContent =
        `A ${a.slice(0, 8) || "—"} · B ${b.slice(0, 8) || "—"} · chart ${lastSha.slice(0, 8) || "—"}`;
    }
  }

  function startPulse() {
    if (pulseTimer) clearInterval(pulseTimer);
    pulseOnce();
    pulseTimer = setInterval(pulseOnce, PULSE_MS);
  }

  function bindUI() {
    if (uiBound) return;
    uiBound = true;
    el("zoomIn")?.addEventListener("click", () => {
      if (zoomBehavior && svgSel) svgSel.transition().duration(200).call(zoomBehavior.scaleBy, 1.25);
    });
    el("zoomOut")?.addEventListener("click", () => {
      if (zoomBehavior && svgSel) svgSel.transition().duration(200).call(zoomBehavior.scaleBy, 0.8);
    });
    el("resetZoom")?.addEventListener("click", () => {
      if (zoomBehavior && svgSel) svgSel.transition().duration(350).call(zoomBehavior.transform, d3.zoomIdentity);
    });
    el("btnResync")?.addEventListener("click", async () => {
      if (el("loadStatus")) el("loadStatus").textContent = "Resyncing…";
      setPulse("idle", "Manual Δ9 resync…");
      try {
        await loadData();
        populateGalaxyFilters();
        populateConstellationFilters();
        populateNebulaFilters();
        populateKindChips();
        initChart();
        await pulseOnce();
      } catch (e) {
        if (el("loadStatus")) el("loadStatus").textContent = "Resync failed";
        setPulse("err", "Resync failed");
      }
    });
    el("toggleCosmos")?.addEventListener("click", () => {
      showCosmosLayers = !showCosmosLayers;
      if (el("toggleCosmos")) el("toggleCosmos").textContent = showCosmosLayers ? "Hide nebulae" : "Show nebulae";
      initChart();
    });
    el("toggleTracks")?.addEventListener("click", () => {
      includeTracks = !includeTracks;
      initChart();
    });
    el("btnAllSky")?.addEventListener("click", () => {
      setView({ galaxy: "all", constellation: "all", nebula: "all", kind: "all" });
      if (zoomBehavior && svgSel) svgSel.transition().duration(350).call(zoomBehavior.transform, d3.zoomIdentity);
    });
    el("galPrev")?.addEventListener("click", () => cycleGalaxy(-1));
    el("galNext")?.addEventListener("click", () => cycleGalaxy(1));
    el("galTour")?.addEventListener("click", toggleTour);
    el("conPrev")?.addEventListener("click", () => cycleConstellation(-1));
    el("conNext")?.addEventListener("click", () => cycleConstellation(1));
    el("nebPrev")?.addEventListener("click", () => cycleNebula(-1));
    el("nebNext")?.addEventListener("click", () => cycleNebula(1));
    el("galaxyFilter")?.addEventListener("input", () => populateGalaxyFilters());
    el("rosterFilter")?.addEventListener("input", () => populateRoster());
    document.querySelectorAll("[data-aside]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-aside");
        document.querySelectorAll("[data-aside]").forEach((b) => b.classList.toggle("active", b === btn));
        const layers = el("panelLayers");
        const roster = el("panelRoster");
        if (layers) layers.hidden = id !== "layers";
        if (roster) roster.hidden = id !== "roster";
        if (id === "roster") populateRoster();
      });
    });
    window.addEventListener("keydown", (ev) => {
      const tag = (ev.target && ev.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      if (ev.key === "[") {
        ev.preventDefault();
        cycleGalaxy(-1);
      } else if (ev.key === "]") {
        ev.preventDefault();
        cycleGalaxy(1);
      } else if (ev.key === ",") {
        ev.preventDefault();
        cycleConstellation(-1);
      } else if (ev.key === ".") {
        ev.preventDefault();
        cycleConstellation(1);
      } else if (ev.key === "n" || ev.key === "N") {
        ev.preventDefault();
        cycleNebula(1);
      } else if (ev.key === "Escape") {
        setView({ galaxy: "all", constellation: "all", nebula: "all", kind: "all" });
      }
    });
    const search = el("starSearch");
    if (search) {
      search.addEventListener("input", () => searchStars(search.value));
      search.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          const first = el("searchHits")?.querySelector("[data-star]");
          if (first) {
            ev.preventDefault();
            focusStar(first.getAttribute("data-star"));
            el("searchHits").hidden = true;
          }
        }
        if (ev.key === "Escape") {
          search.value = "";
          searchStars("");
        }
      });
    }
    el("copyStarId")?.addEventListener("click", async () => {
      if (!selectedNodeId) return;
      try {
        await navigator.clipboard.writeText(selectedNodeId);
        el("copyStarId").textContent = "Copied";
        setTimeout(() => {
          if (el("copyStarId")) el("copyStarId").textContent = "Copy id";
        }, 1200);
      } catch (_) {}
    });
    window.addEventListener("hashchange", () => {
      applyHashView();
    });
    window.addEventListener("haven-star-focus", (ev) => {
      const id = ev.detail && ev.detail.id;
      if (id) focusStar(id);
    });
    window.addEventListener("resize", () => {
      if (!chartData) return;
      if (window.__hscResize) clearTimeout(window.__hscResize);
      window.__hscResize = setTimeout(() => initChart(), 180);
    });
    const wrap = el("starmap-wrap");
    if (wrap && typeof ResizeObserver !== "undefined" && !wrap.__hscRo) {
      wrap.__hscRo = new ResizeObserver(() => {
        if (!chartData) return;
        const w = el("starmap")?.clientWidth || 0;
        if (w < 40) return;
        if (Math.abs(w - chartW) < 8) return;
        if (window.__hscResize) clearTimeout(window.__hscResize);
        window.__hscResize = setTimeout(() => initChart(), 180);
      });
      wrap.__hscRo.observe(wrap);
    }
  }

  async function boot() {
    if (el("loadStatus")) el("loadStatus").textContent = "Loading constellation registry…";
    setPulse("idle", "Loading public C mirror…");
    if (typeof d3 === "undefined") {
      if (el("loadStatus")) el("loadStatus").textContent = "D3 engine missing — /starchart/lib/d3.v7.min.js";
      setPulse("err", "D3 failed to load");
      return;
    }
    try {
      await loadData();
      bindUI();
      populateGalaxyFilters();
      populateConstellationFilters();
      populateNebulaFilters();
      populateKindChips();
      syncNavChrome();
      const parsed = parseHash();
      if (parsed.galaxy || parsed.constellation || parsed.nebula) {
        if (parsed.galaxy) activeGalaxy = parsed.galaxy;
        if (parsed.constellation) activeConstellation = parsed.constellation;
        if (parsed.nebula) activeNebula = parsed.nebula;
        populateGalaxyFilters();
        populateConstellationFilters();
        populateNebulaFilters();
        syncNavChrome();
      }
      initChart();
      if (parsed.star && findNode(parsed.star)) {
        focusStar(parsed.star, { writeHash: false });
      } else if (visibleNodes.length) {
        const core = visibleNodes.find((n) => n.id === "SEAL_000") || visibleNodes[0];
        showDetail(core, false);
      }
      startPulse();
      const q = await fetchJson([QUEUE_REL, QUEUE_ABS]);
      if (q) fillQueue(q);
    } catch (e) {
      if (el("loadStatus")) el("loadStatus").textContent = "Sync failed — check data JSON";
      setPulse("err", "Registry fetch failed");
      console.error(e);
    }
  }

  window.HavenStarChart = {
    focus: focusStar,
    view: setView,
    cycleGalaxy,
    cycleConstellation,
    resync: () => el("btnResync")?.click(),
    data: () => chartData,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
