/**
 * FORGE SMOKE — START SCREEN
 *
 * Full-bleed key art with a solid instrument panel on the left (the pattern the other excavationpro
 * games use). The panel holds the wordmark, the three actions and the profile readout; the art keeps
 * the right two thirds clean.
 *
 * Pure DOM. The 3D turntable still runs behind, so if the art is missing the screen still looks alive.
 */
import { xpForLevel } from "./save.js";

const ART = "./assets/start-bg-v1.jpg";

const CSS = `
#fs-start{position:fixed;inset:0;z-index:50;display:none;align-items:stretch;
  font:14px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#E8F1F8;
  background:
    radial-gradient(1200px 700px at 68% 38%,rgba(255,179,71,.10),transparent 62%),
    radial-gradient(900px 600px at 88% 90%,rgba(111,227,255,.08),transparent 65%),
    linear-gradient(160deg,#0A0F14,#06080B 60%,#070A0E);
  background-size:cover;background-position:center right;background-repeat:no-repeat}
#fs-start.open{display:flex}
#fs-start.art{background-image:linear-gradient(90deg,rgba(5,7,10,.96) 0%,rgba(5,7,10,.86) 26%,rgba(5,7,10,.35) 52%,rgba(5,7,10,.12) 100%),url("${ART}")}
#fs-start .artwrap{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(5,7,10,.55),transparent 22%,transparent 72%,rgba(5,7,10,.75))}

#fs-start .panel{position:relative;width:min(462px,46vw);display:flex;flex-direction:column;justify-content:center;
  gap:0;padding:0 clamp(26px,3.4vw,54px);pointer-events:auto;
  background:linear-gradient(90deg,rgba(7,10,14,.94) 0%,rgba(7,10,14,.90) 74%,rgba(7,10,14,.55) 100%);
  border-right:1px solid rgba(255,179,71,.18);box-shadow:24px 0 60px -30px #000}
#fs-start .kicker{display:flex;align-items:center;gap:10px;font:700 9.5px ui-monospace,Consolas,monospace;
  letter-spacing:.3em;color:#FFB347;margin-bottom:22px;white-space:nowrap}
#fs-start .kicker i{display:block;width:26px;height:1px;background:#FFB347;opacity:.85}
#fs-start h1{margin:0;font:800 clamp(46px,5.2vw,74px)/0.9 "Barlow Condensed","Oswald",ui-sans-serif,sans-serif;
  letter-spacing:.015em;text-transform:uppercase;color:#F5F9FD;
  text-shadow:0 0 48px rgba(255,179,71,.18),0 2px 0 rgba(0,0,0,.65)}
#fs-start h1 em{display:block;font-style:normal;color:#FFB347}
#fs-start .tag{margin:16px 0 0;font:600 10px ui-monospace,Consolas,monospace;letter-spacing:.24em;color:#8FA3B8}
#fs-start .blurb{margin:14px 0 0;font:400 12.5px/1.6 ui-sans-serif,system-ui,sans-serif;color:#9FB3C8;max-width:330px}
#fs-start .rule{height:1px;background:linear-gradient(90deg,rgba(255,179,71,.55),rgba(30,42,53,0));margin:22px 0 20px}

#fs-start .menu{display:flex;flex-direction:column;gap:8px}
#fs-start button{position:relative;text-align:left;padding:14px 18px;border-radius:3px;cursor:pointer;
  border:1px solid #1E2A35;background:linear-gradient(180deg,rgba(19,26,34,.94),rgba(12,17,23,.94));
  color:#E8F1F8;font:700 12.5px ui-sans-serif,system-ui,sans-serif;letter-spacing:.18em;
  transition:border-color .12s,transform .12s,box-shadow .12s}
#fs-start button .sub{display:block;margin-top:4px;font:600 8.5px ui-monospace,Consolas,monospace;letter-spacing:.2em;color:#7E93A6}
#fs-start button:hover{border-color:#FFB347;transform:translateX(3px);box-shadow:0 0 26px -10px rgba(255,179,71,.55)}
#fs-start button:focus-visible{outline:2px solid #6FE3FF;outline-offset:2px}
#fs-start button.primary{border-color:rgba(255,179,71,.9);background:linear-gradient(180deg,#FFC463,#E79531);color:#0A0D11;
  box-shadow:0 0 34px -12px rgba(255,179,71,.65),inset 0 1px 0 rgba(255,255,255,.42)}
#fs-start button.primary .sub{color:rgba(10,13,17,.6)}
#fs-start button.primary:hover{transform:translateX(4px);box-shadow:0 0 46px -12px rgba(255,179,71,.8)}

#fs-start .stats{margin-top:26px;display:flex;gap:20px;font:600 8px ui-monospace,Consolas,monospace;
  letter-spacing:.18em;color:#7E93A6}
#fs-start .stats b{display:block;font:700 19px/1 ui-monospace,Consolas,monospace;letter-spacing:0;color:#E8F1F8;margin-bottom:3px}
#fs-start .stats .gold b{color:#FFD166}
#fs-start .foot{margin-top:30px;font:600 8px ui-monospace,Consolas,monospace;letter-spacing:.2em;color:rgba(126,147,166,.55)}

#fs-start .right b{display:block;color:rgba(255,179,71,.75);margin-bottom:4px}

/* how to play */
#fs-start .modal{position:absolute;inset:0;display:none;place-items:center;background:rgba(4,6,9,.72);z-index:2}
#fs-start .modal.open{display:grid}
#fs-start .card{width:min(560px,84vw);background:linear-gradient(180deg,#101720,#0B1017);border:1px solid #1E2A35;
  border-radius:4px;padding:24px 26px;box-shadow:0 30px 80px -30px #000}
#fs-start .card h2{margin:0 0 6px;font:800 13px ui-monospace,Consolas,monospace;letter-spacing:.22em;color:#FFB347}
#fs-start .card ol{margin:14px 0 0;padding-left:18px;color:#B9CBDC;font-size:12.5px;line-height:1.75}
#fs-start .card li b{color:#E8F1F8}
#fs-start .card .close{margin-top:18px;width:100%;text-align:center}
`;

export function createStartMenu(opts = {}) {
  const onEnter = opts.onEnter || (() => {});
  const onOptions = opts.onOptions || (() => {});
  const getProfile = opts.getProfile || (() => null);

  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "fs-start";
  root.innerHTML = `
    <div class="artwrap"></div>
    <div class="panel">
      <div class="kicker"><i></i> Δ9Φ963 · EXCAVATIONPRO · BAY 01</div>
      <h1>FORGE<em>SMOKE</em></h1>
      <p class="tag">CYBORG MANAGER · AUTONOMOUS ARENA</p>
      <p class="blurb">You do not fight. You build a fighter, launch it into the smoke, and keep it alive
        with power-up cards while it fights for you.</p>
      <div class="rule"></div>
      <div class="menu">
        <button class="primary" data-enter>ENTER THE BAY<span class="sub">MANAGE · LOADOUT · LAUNCH</span></button>
        <button data-help>HOW TO PLAY<span class="sub">THE LOOP · CARDS · LEGENDARIES</span></button>
        <button data-options>OPTIONS<span class="sub">AUDIO · CONTROLS · VIDEO</span></button>
      </div>
      <div class="adwrap" data-ad></div>
      <div class="stats">
        <div><b data-level>1</b>LEVEL</div>
        <div><b data-runs>0</b>RUNS</div>
        <div><b data-cleared>0</b>ARENAS</div>
        <div class="gold"><b data-legacy>0</b>LEGENDARY</div>
      </div>
      <div class="foot">[ENTER] ENTER THE BAY · [ESC] OPTIONS</div>
    </div>
    <div class="modal" data-modal>
      <div class="card">
        <h2>HOW THE BAY WORKS</h2>
        <ol>
          <li><b>Build the fighter.</b> Character, weapon, light mods, perks — in the bay.</li>
          <li><b>Launch.</b> The cyborg fights on its own. You do not move it.</li>
          <li><b>Support.</b> Play power-up cards mid-fight; they change how it survives.</li>
          <li><b>Bank.</b> When it dies you keep the XP. Levels raise its stats.</li>
          <li><b>Survive an arena</b> and you roll a <b>legendary</b> — jetpacks, vehicles, things you cannot buy.</li>
        </ol>
        <button class="close" data-close>BACK</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const q = (s) => root.querySelector(s);
  const modal = q("[data-modal]");

  function render() {
    const p = getProfile() || { level: 1, xp: 0, runs: 0, arenasCleared: 0, legacy: [] };
    q("[data-level]").textContent = p.level || 1;
    q("[data-runs]").textContent = p.runs || 0;
    q("[data-cleared]").textContent = p.arenasCleared || 0;
    q("[data-legacy]").textContent = (p.legacy || []).length;
  }

  // AdSense kit: auto-format unit, mounted only when the screen is actually visible
  function mountAd() {
    const box = q("[data-ad]");
    if (!box || box.dataset.mounted === "1") return;
    box.dataset.mounted = "1";
    box.innerHTML = '<div class="ad-label">ADVERTISEMENT</div>' +
      '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0646320966060599" ' +
      'data-ad-format="auto" data-full-width-responsive="true"></ins>';
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked or offline */ }
  }

  const sfx = (k) => { try { window.__fsSfx?.(k, { volume: 0.5 }); } catch (e) {} };

  q("[data-enter]").onclick = () => { sfx("click"); onEnter(); };
  q("[data-options]").onclick = () => { sfx("click"); onOptions(); };
  q("[data-help]").onclick = () => { sfx("click"); modal.classList.add("open"); };
  q("[data-close]").onclick = () => modal.classList.remove("open");
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });

  function show() {
    render();
    mountAd();
    root.classList.add("open");
    // probe the art once; if it is missing the gradient stands in
    const img = new Image();
    img.onload = () => root.classList.add("art");
    img.onerror = () => root.classList.remove("art");
    img.src = ART;
  }
  function hide() { root.classList.remove("open"); modal.classList.remove("open"); }

  return { show, hide, render, root, get open() { return root.classList.contains("open"); } };
}
