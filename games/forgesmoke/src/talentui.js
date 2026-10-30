/**
 * FORGE SMOKE — SPECIAL OPERATIONS (talent tree window)
 *
 * Its own full-screen window, opened from the bay. A render of the command board sits underneath;
 * the tree is drawn on top of it in the board's own palette so nodes look etched into the plate.
 *
 * No trials, no free points: nodes are bought with points earned from runs (and the in-arena boss).
 *
 * TREE  — pan / zoom, click a node to buy the cheapest chain, right-click to refund.
 */
import { TREE, BRANCHES, aggregate, toRunMods, pathTo, refund, nodeById, countAllocated } from "./talents.js?v=202610327g";

const ART = "./assets/tree/tree-bg.jpg";

const CSS = `
#fs-talents{position:fixed;inset:0;z-index:45;display:none;font:13px/1.45 ui-sans-serif,system-ui,sans-serif;color:#E8F1F8;
  background:#07090C center/cover no-repeat}
#fs-talents.open{display:block}
#fs-talents.art{background-image:linear-gradient(rgba(5,7,10,.72),rgba(5,7,10,.82)),url("${ART}")}
#fs-talents .bar{position:absolute;top:0;left:0;right:0;height:60px;display:flex;align-items:center;gap:16px;padding:0 22px;
  background:linear-gradient(180deg,rgba(4,7,12,.95),rgba(4,7,12,.55));border-bottom:1px solid rgba(159,179,200,.18);z-index:3}
#fs-talents .ttl{font:800 15px "Barlow Condensed",ui-sans-serif,sans-serif;letter-spacing:.22em}
#fs-talents .ttl span{color:#FFB347}
#fs-talents .pts{font:700 11px ui-monospace,Consolas,monospace;letter-spacing:.16em;color:#FFB347}
#fs-talents .pts b{font-size:19px;color:#FFD166}
#fs-talents .search{width:190px;padding:7px 10px;border-radius:3px;border:1px solid #1E2A35;background:#0B1017;
  color:#E8F1F8;font:700 10px ui-monospace,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase}
#fs-talents .search::placeholder{color:#4A5A6B}
#fs-talents .search:focus{outline:none;border-color:#6FE3FF}
#fs-talents .node.dim{opacity:.16}
#fs-talents .node.hit{border-color:#FFD166;box-shadow:0 0 12px rgba(255,209,102,.8)}
#fs-talents .tabs{display:flex;gap:6px;margin-left:14px}
#fs-talents .tab{background:rgba(19,26,34,.9);border:1px solid #1E2A35;color:#9FB3C8;border-radius:3px;padding:7px 12px;
  font:700 10px ui-monospace,Consolas,monospace;letter-spacing:.18em;cursor:pointer}
#fs-talents .tab[aria-selected="true"]{color:#0A0D11;background:linear-gradient(180deg,#FFC463,#E79531);border-color:transparent}
#fs-talents .close{margin-left:auto;background:transparent;border:1px solid #1E2A35;color:#9FB3C8;border-radius:3px;
  padding:8px 14px;font:700 10px ui-monospace,Consolas,monospace;letter-spacing:.18em;cursor:pointer}
#fs-talents .close:hover{border-color:#F2545B;color:#F2545B}

#fs-talents .stage{position:absolute;inset:60px 0 0 0;overflow:hidden;cursor:grab}
#fs-talents .stage.drag{cursor:grabbing}
#fs-talents .world{position:absolute;left:50%;top:50%;width:0;height:0;transform-origin:0 0}
#fs-talents svg.edges{position:absolute;left:-2000px;top:-2000px;width:4000px;height:4000px;overflow:visible;pointer-events:none}
#fs-talents .edge{stroke:rgba(159,179,200,.22);stroke-width:1.4}
#fs-talents .edge.on{stroke:#FFB347;stroke-width:2.2;filter:drop-shadow(0 0 4px rgba(255,179,71,.85));
  stroke-dasharray:5 9;animation:dash 1.6s linear infinite}
@keyframes dash{to{stroke-dashoffset:-28}}

#fs-talents .node{position:absolute;transform:translate(-50%,-50%);border-radius:999px;cursor:pointer;
  display:grid;place-items:center;transition:transform .12s,box-shadow .12s,border-color .12s;
  background:radial-gradient(circle at 42% 36%,#1d2836,#0a1017 72%);
  border:1px solid #33465a;color:#9FB3C8;
  box-shadow:inset 0 0 6px rgba(0,0,0,.8), 0 0 6px rgba(0,0,0,.5)}
#fs-talents .node:before{content:"";position:absolute;inset:2px;border-radius:inherit;border:1px solid rgba(159,179,200,.12)}
#fs-talents .node.small{width:13px;height:13px}
#fs-talents .node.notable{width:25px;height:25px;border-width:2px;border-color:#4d6żół}
#fs-talents .node.notable:after{content:"";position:absolute;inset:-4px;border-radius:inherit;border:1px solid rgba(159,179,200,.28)}
#fs-talents .node.mastery{width:19px;height:19px;border-radius:4px;transform:translate(-50%,-50%) rotate(45deg);
  border-color:#8b6cff;background:radial-gradient(circle,#221a3a,#0d0a18 72%)}
#fs-talents .node.mastery > *{transform:rotate(-45deg)}
#fs-talents .node.mastery.ready{border-color:#b59cff;box-shadow:0 0 12px rgba(139,108,255,.7)}
#fs-talents .node.mastery.on{background:radial-gradient(circle,#b59cff,#6a4fd0 74%);border-color:#e0d4ff;box-shadow:0 0 20px rgba(139,108,255,.95)}
#fs-talents .node.mastery.locked{opacity:.4;border-style:dashed;cursor:not-allowed}
#fs-talents .node.keystone{width:44px;height:44px;border-radius:10px;transform:translate(-50%,-50%) rotate(45deg);
  border:2px solid #7d8ea2;background:radial-gradient(circle at 42% 36%,#2a3646,#0a1017 74%);
  box-shadow:inset 0 0 14px rgba(0,0,0,.9), 0 0 16px rgba(0,0,0,.6)}
#fs-talents .node.keystone:before{content:"";position:absolute;inset:-7px;border-radius:14px;border:1px solid rgba(159,179,200,.3)}
#fs-talents .node.keystone > i{transform:rotate(-45deg);font-style:normal;font-size:16px}
#fs-talents .node.hub{width:52px;height:52px;border:2px solid #FFB347;color:#FFB347;
  background:radial-gradient(circle at 42% 36%,#3a2a12,#0b0d12 74%);box-shadow:0 0 26px rgba(255,179,71,.45)}
#fs-talents .node.hub > i{font-style:normal;font-size:20px}
#fs-talents .node:hover{transform:translate(-50%,-50%) scale(1.35);border-color:#6FE3FF;z-index:5;
  box-shadow:0 0 16px rgba(111,227,255,.8)}
#fs-talents .node.keystone:hover,#fs-talents .node.mastery:hover{transform:translate(-50%,-50%) rotate(45deg) scale(1.25)}
#fs-talents .node.ready{border-color:#6FE3FF;box-shadow:0 0 12px rgba(111,227,255,.55)}
#fs-talents .node.on{background:radial-gradient(circle at 42% 36%,#ffd98f,#d98a2b 74%);border-color:#FFE0A8;
  color:#0A0D11;box-shadow:0 0 18px rgba(255,179,71,.85);animation:nodeGlow 2.6s ease-in-out infinite}
#fs-talents .node.on.k{background:radial-gradient(circle at 42% 36%,#ffe9a8,#d9a92b 74%);border-color:#ffe9a8;
  box-shadow:0 0 26px rgba(255,209,102,.95);animation-duration:1.8s}
@keyframes nodeGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}
#fs-talents .edge{fill:none;stroke:rgba(140,160,180,.20);stroke-width:1.1;stroke-linecap:round}
#fs-talents .edge.on{stroke:#FFC463;stroke-width:2;stroke-dasharray:4 8;filter:drop-shadow(0 0 3px rgba(255,180,71,.9));
  animation:dash 1.8s linear infinite}
#fs-talents .node canvas{display:none}

#fs-talents .tip{position:fixed;z-index:6;max-width:290px;padding:11px 13px;border-radius:4px;pointer-events:none;
  background:linear-gradient(180deg,rgba(9,14,20,.98),rgba(7,10,15,.98));border:1px solid #2C3A47;
  box-shadow:0 18px 40px -20px #000;display:none}
#fs-talents .tip h4{margin:0 0 4px;font:800 12px ui-monospace,Consolas,monospace;letter-spacing:.12em;color:#FFD166}
#fs-talents .tip p{margin:0 0 7px;font-size:12px;color:#B9CBDC}
#fs-talents .tip .meta{font:600 9px ui-monospace,Consolas,monospace;letter-spacing:.16em;color:#7E93A6}
#fs-talents .tip .cost{color:#FFB347}
#fs-talents .tip .ref{color:#F2545B}

#fs-talents .bossrow{display:grid;grid-template-columns:1fr 140px 130px;gap:12px;align-items:center;max-width:900px;
  padding:14px 16px;margin-bottom:10px;border:1px solid #1E2A35;border-radius:4px;background:rgba(10,15,21,.86)}
#fs-talents .bossrow h3{margin:0 0 4px;font:800 13px ui-monospace,Consolas,monospace;letter-spacing:.14em;color:#E8F1F8}
#fs-talents .bossrow p{margin:0;font-size:11.5px;color:#8FA3B8}
#fs-talents .bossrow .num{font:700 12px ui-monospace,Consolas,monospace;color:#FFD166}
#fs-talents .fight{background:linear-gradient(180deg,#FFC463,#E79531);border:0;border-radius:3px;color:#0A0D11;
  font:800 11px ui-monospace,Consolas,monospace;letter-spacing:.16em;padding:11px 16px;cursor:pointer}
#fs-talents .fight:hover{filter:brightness(1.08)}
#fs-talents .result{margin-top:18px;max-width:900px;border:1px solid #1E2A35;border-radius:4px;padding:16px;
  background:rgba(8,12,18,.9);font:600 11px/1.7 ui-monospace,Consolas,monospace;color:#B9CBDC;white-space:pre-wrap;max-height:38vh;overflow:auto}
#fs-talents .result b{color:#7CE6A8}
#fs-talents .result .lose{color:#F2545B}
#fs-talents .bars{display:flex;gap:10px;margin:10px 0}
#fs-talents .bar2{flex:1;height:10px;background:#131A22;border-radius:3px;overflow:hidden;border:1px solid #1E2A35}
#fs-talents .bar2 i{display:block;height:100%;background:linear-gradient(90deg,#7CE6A8,#6FE3FF)}
#fs-talents .bar2.boss i{background:linear-gradient(90deg,#F2545B,#FF9A5C)}
`;

export function createTalentWindow(opts = {}) {
  const getProfile = opts.getProfile || (() => ({}));
  const saveProfile = opts.saveProfile || (() => {});
  const onChange = opts.onChange || (() => {});

  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "fs-talents";
  root.innerHTML = `
    <div class="bar">
      <div class="ttl">SPECIAL <span>OPERATIONS</span> TREE</div>
      <div class="pts"><b data-points>0</b> POINTS · <span data-spent>0</span> SPENT</div>
      <input class="search" data-search placeholder="SEARCH NODES…" spellcheck="false" />
      <div class="tabs" role="tablist">
        <button class="tab" role="tab" aria-selected="true" data-tab="tree">TREE</button>
      </div>
      <button class="close" data-close>CLOSE</button>
    </div>
    <div class="stage" data-stage>
      <div class="world" data-world>
        <svg class="edges" data-edges></svg>
        <div class="nodes" data-nodes></div>
      </div>
    </div>
    <div class="tip" data-tip></div>
  `;
  document.body.appendChild(root);

  const q = (s) => root.querySelector(s);
  const stage = q("[data-stage]");
  const world = q("[data-world]");
  const tip = q("[data-tip]");

  let view = { x: 0, y: 0, s: 0.62 };

  const profile = () => getProfile() || {};
  const allocated = () => new Set(profile().talents || []);

  function applyView() {
    world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`;
  }

  function renderPoints() {
    const p = profile();
    const alloc = allocated();
    q("[data-points]").textContent = String(p.talentPoints ?? 0);
    q("[data-spent]").textContent = String(countAllocated([...alloc]));
  }

  function renderEdges() {
    const alloc = allocated();
    const svg = q("[data-edges]");
    // svg is centred on the world origin
    // every link bows slightly, and the bow direction/amount is derived from the node ids, so the
    // web looks drawn by hand instead of printed as a ruler grid
    const bowOf = (id) => {
      let h = 0;
      for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 997;
      return ((h % 15) - 7) * 0.9;
    };
    svg.innerHTML = TREE.edges.map(([a, b]) => {
      const na = TREE.byId.get(a), nb = TREE.byId.get(b);
      if (!na || !nb) return "";
      const x1 = 2000 + na.x, y1 = 2000 + na.y, x2 = 2000 + nb.x, y2 = 2000 + nb.y;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const bow = bowOf(a + b);
      const cx = mx - (dy / len) * bow, cy = my + (dx / len) * bow;
      const on = alloc.has(a) && (alloc.has(b) || b === "hub");
      return `<path class="edge${on ? " on" : ""}" d="M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" />`;
    }).join("");
  }

  function renderNodes() {
    const alloc = allocated();
    const box = q("[data-nodes]");
    box.innerHTML = "";
    for (const n of TREE.nodes) {
      const el = document.createElement("button");
      const isOn = alloc.has(n.id);
      const cls = ["node", n.kind, isOn ? "on" : ""];
      if (isOn && n.kind === "notable") cls.push("b");
      if (isOn && n.kind === "keystone") cls.push("k");
      if (n.kind === "mastery" && n.requires && !alloc.has(n.requires)) cls.push("locked");
      el.className = cls.filter(Boolean).join(" ");
      el.style.left = `${n.x}px`;
      el.style.top = `${n.y}px`;
      el.dataset.id = n.id;
      el.title = "";
      if (n.kind === "keystone" || n.kind === "hub") el.innerHTML = `<i>${n.kind === "hub" ? "◈" : "✦"}</i>`;
      else if (n.kind === "notable") el.innerHTML = `<i style="font-style:normal;font-size:10px">◆</i>`;
      el.addEventListener("mouseenter", (e) => showTip(n, e));
      el.addEventListener("mousemove", (e) => moveTip(e));
      el.addEventListener("mouseleave", hideTip);
      el.addEventListener("click", (e) => { e.stopPropagation(); buy(n); });
      el.addEventListener("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); sell(n); });
      box.appendChild(el);
    }
  }

  function showTip(node, e) {
    const p = profile();
    const alloc = allocated();
    const isOn = alloc.has(node.id);
    const path = pathTo(node.id, alloc);
    const kindLabel = node.kind === "keystone" ? "KEYSTONE" : node.kind === "notable" ? "NOTABLE" : node.kind === "hub" ? "CORE" : "PASSIVE";
    const branch = BRANCHES.find((b) => b.id === node.branch);
    const cost = isOn ? 0 : (path ? path.cost : null);
    tip.innerHTML = `
      <h4>${node.name}</h4>
      <p>${node.desc || ""}</p>
      <div class="meta">${kindLabel}${branch ? " · " + branch.name : ""}</div>
      <div class="meta">${node.requires && !alloc.has(node.requires)
        ? `<span style="color:#8b6cff">OPENS WITH ${TREE.byId.get(node.requires)?.name || "ITS NOTABLE"}</span>`
        : isOn ? '<span class="ref">RIGHT-CLICK TO REFUND</span>'
        : cost == null ? "UNREACHABLE"
        : `<span class="cost">${cost} POINT${cost === 1 ? "" : "S"}</span>${cost > 1 ? " (chain included)" : ""}`}</div>`;
    tip.style.display = "block";
    moveTip(e);
  }
  function moveTip(e) {
    const pad = 14;
    tip.style.left = `${Math.min(window.innerWidth - 300, e.clientX + pad)}px`;
    tip.style.top = `${Math.min(window.innerHeight - 120, e.clientY + pad)}px`;
  }
  function hideTip() { tip.style.display = "none"; }

  function buy(node) {
    if (node.id === "hub") return;
    const p = profile();
    const alloc = allocated();
    if (alloc.has(node.id)) return;
    const path = pathTo(node.id, alloc);
    if (!path || !path.cost) return;
    if ((p.talentPoints ?? 0) < path.cost) return;
    for (const id of path.path) alloc.add(id);
    p.talents = [...alloc];
    p.talentPoints = (p.talentPoints ?? 0) - path.cost;
    saveProfile(p);
    onChange(p);
    render();
    hideTip();
  }

  function sell(node) {
    if (node.id === "hub") return;
    const p = profile();
    const alloc = allocated();
    if (!alloc.has(node.id)) return;
    const next = refund(node.id, alloc);
    const refunded = alloc.size - next.size;
    p.talents = [...next];
    p.talentPoints = (p.talentPoints ?? 0) + refunded;
    saveProfile(p);
    onChange(p);
    render();
    hideTip();
  }



  function render() {
    renderPoints();
    renderEdges();
    renderNodes();
  }

  // ── search (the tree is too big to hunt through by eye) ──────────────────
  const searchEl = q("[data-search]");
  if (searchEl) {
    searchEl.addEventListener("input", () => {
      const term = searchEl.value.trim().toLowerCase();
      root.querySelectorAll(".node").forEach((el) => {
        const n = TREE.byId.get(el.dataset.id);
        if (!n) return;
        const hit = term && (`${n.name} ${n.desc || ""}`.toLowerCase().includes(term));
        el.classList.toggle("dim", Boolean(term) && !hit);
        el.classList.toggle("hit", Boolean(hit));
      });
    });
  }

  // ── tabs ──────────────────────────────────────────────────────────────────
  q("[data-tab='tree']").onclick = () => setMode("tree");
  q("[data-close]").onclick = () => hide();

  function setMode(next) {
    q("[data-stage]").style.display = "block";
    root.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === next)));
    render();
    if (window.__fsSfx) window.__fsSfx("click", { volume: 0.4 });
  }

  // ── pan / zoom ────────────────────────────────────────────────────────────
  let drag = null;
  stage.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX - view.x, y: e.clientY - view.y };
    stage.classList.add("drag");
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    view.x = e.clientX - drag.x;
    view.y = e.clientY - drag.y;
    applyView();
  });
  window.addEventListener("pointerup", () => { drag = null; stage.classList.remove("drag"); });
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const next = Math.max(0.12, Math.min(2.6, view.s * (e.deltaY > 0 ? 0.92 : 1.08)));
    view.s = next;
    applyView();
  }, { passive: false });

  function show() {
    const img = new Image();
    img.onload = () => root.classList.add("art");
    img.onerror = () => root.classList.remove("art");
    img.src = ART;
    root.classList.add("open");
    setMode("tree");
    applyView();
  }
  function hide() {
    root.classList.remove("open");
    tip.style.display = "none";
  }

  return { show, hide, render, root, get open() { return root.classList.contains("open"); } };
}
