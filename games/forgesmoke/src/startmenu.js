/**
 * FORGE SMOKE — START SCREEN
 *
 * Full-bleed key art with a solid instrument panel on the left (the pattern the other excavationpro
 * games use). The panel holds the wordmark, the three actions and the profile readout; the art keeps
 * the right two thirds clean.
 *
 * Pure DOM. The 3D turntable still runs behind, so if the art is missing the screen still looks alive.
 */
import { xpForLevel } from "./save.js?v=202610322i";

const ART = "./assets/start-bg.gif";

const CSS = `
#fs-start{position:fixed;inset:0;z-index:50;display:none;align-items:stretch;
  font:14px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#E8F1F8;
  background:
    radial-gradient(1200px 700px at 68% 38%,rgba(255,179,71,.10),transparent 62%),
    radial-gradient(900px 600px at 88% 90%,rgba(111,227,255,.08),transparent 65%),
    linear-gradient(160deg,#0A0F14,#06080B 60%,#070A0E);
  background-size:cover;background-position:center right;background-repeat:no-repeat}
#fs-start.open{display:flex}
#fs-start.art:not(.vid){animation:fsStillDrift 30s ease-in-out infinite alternate}
@keyframes fsStillDrift{0%{background-position:center,50% 50%}100%{background-position:center,54% 47%}}
#fs-start .artvid{}  /* the supplied clip is already moving; do not reframe it */
@keyframes fsKenBurns{
  0%{transform:scale(1.03) translate3d(0,0,0)}
  50%{transform:scale(1.12) translate3d(-2.4%,1.8%,0)}
  100%{transform:scale(1.06) translate3d(2.2%,-1.8%,0)}
}
#fs-start.art{background-image:
    linear-gradient(90deg,rgba(5,7,10,.975) 0%,rgba(5,7,10,.94) 26%,rgba(5,7,10,.60) 44%,rgba(5,7,10,.18) 58%,rgba(5,7,10,0) 70%),
    url("${ART}");
  background-size:100% 100%,cover,cover;
  background-position:center,center;
  background-repeat:no-repeat,no-repeat}
#fs-start .artvid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;
  transition:opacity .7s ease;pointer-events:none}
#fs-start.vid .artvid{opacity:1}
#fs-start.vid .artfx .eyes,#fs-start.vid .artfx .lamp{display:none}
#fs-start .artwrap{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(5,7,10,.55),transparent 22%,transparent 72%,rgba(5,7,10,.75))}

/* ── living-photo treatment: the still breathes ───────────────────────────── */
#fs-start .artfx{position:absolute;top:0;right:0;height:100%;width:100vh;pointer-events:none;overflow:hidden;display:none}
#fs-start.art .artfx{display:block}
#fs-start .artfx .lamp{position:absolute;left:2.5%;top:-1%;width:26%;height:19%;border-radius:50%;
  background:radial-gradient(circle,rgba(255,214,140,.30),rgba(255,170,70,.10) 52%,transparent 74%);
  filter:blur(12px);animation:fsLamp 6.2s steps(1,end) infinite;mix-blend-mode:screen}
@keyframes fsLamp{
  0%,6%,8%,41%,43%,69%,71%,100%{opacity:.92}
  7%{opacity:.30} 42%{opacity:.52} 44%{opacity:.98} 70%{opacity:.38} 72%{opacity:.85}}
#fs-start .artfx .eyes{position:absolute;left:37%;top:9.6%;width:16%;height:6.6%;border-radius:50%;
  background:radial-gradient(ellipse at 50% 50%,rgba(255,228,158,.62),rgba(255,150,40,.20) 44%,transparent 70%);
  filter:blur(5px);animation:fsEyes 3.6s ease-in-out infinite;mix-blend-mode:screen}
@keyframes fsEyes{0%,100%{opacity:.62;transform:scale(1)}48%{opacity:1;transform:scale(1.045)}}
@keyframes fsSweep{0%{transform:translate3d(-42%,0,0)}100%{transform:translate3d(42%,0,0)}}
#fs-start .artfx .motes{position:absolute;inset:-10%;pointer-events:none;opacity:.55;
  background-image:radial-gradient(1.6px 1.6px at 12% 82%,rgba(255,226,180,.9) 50%,transparent 51%),
    radial-gradient(1.2px 1.2px at 28% 64%,rgba(255,214,150,.8) 50%,transparent 51%),
    radial-gradient(1.8px 1.8px at 47% 91%,rgba(255,236,200,.75) 50%,transparent 51%),
    radial-gradient(1.3px 1.3px at 63% 72%,rgba(255,214,150,.8) 50%,transparent 51%),
    radial-gradient(1.5px 1.5px at 79% 88%,rgba(255,226,180,.85) 50%,transparent 51%),
    radial-gradient(1.1px 1.1px at 91% 66%,rgba(255,214,150,.7) 50%,transparent 51%);
  animation:fsMotes 17s linear infinite}
@keyframes fsMotes{0%{transform:translate3d(0,6%,0)}100%{transform:translate3d(-4%,-14%,0)}}
#fs-start .artfx .rain{position:absolute;inset:-30% -10%;opacity:.5;
  background-image:repeating-linear-gradient(104deg,transparent 0 7px,rgba(169,220,210,.055) 7px 8px,transparent 8px 15px);
  animation:fsRain 1.5s linear infinite}
#fs-start .artfx .rain.r2{opacity:.26;animation-duration:2.4s;animation-delay:-.7s;
  background-image:repeating-linear-gradient(101deg,transparent 0 13px,rgba(200,235,230,.05) 13px 14px,transparent 14px 27px)}
@keyframes fsRain{from{transform:translate3d(0,-6%,0)}to{transform:translate3d(-2%,6%,0)}}
@media (prefers-reduced-motion:reduce){
  #fs-start .artfx .lamp,#fs-start .artfx .eyes,#fs-start .artfx .rain{animation:none}
  #fs-start .artfx .eyes{opacity:.8}
  /* ART-06: no movement means no GIF and no drift. The 1536x864 stills stand in. */
  #fs-start.art:not(.vid){animation:none}
  #fs-start.art{background-image:
    linear-gradient(90deg,rgba(5,7,10,.975) 0%,rgba(5,7,10,.94) 26%,rgba(5,7,10,.60) 44%,rgba(5,7,10,.18) 58%,rgba(5,7,10,0) 70%),
    url("./assets/start-still-a.jpg")}
}
@media (prefers-reduced-motion:reduce) and (max-aspect-ratio:1/1){
  #fs-start.art{background-image:
    linear-gradient(90deg,rgba(5,7,10,.975) 0%,rgba(5,7,10,.94) 26%,rgba(5,7,10,.60) 44%,rgba(5,7,10,.18) 58%,rgba(5,7,10,0) 70%),
    url("./assets/start-still-b.jpg")}
}

#fs-start .fs-build{position:absolute;right:14px;bottom:10px;font:700 9px ui-monospace,Consolas,monospace;
  letter-spacing:.2em;color:rgba(255,179,71,.55)}
#fs-start .panel{position:relative;width:min(462px,46vw);display:flex;flex-direction:column;justify-content:center;overflow-y:auto;max-height:100vh;padding-block:26px;
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

@media (max-height:860px){
  #fs-start h1{font-size:clamp(36px,4.2vw,54px)}
  #fs-start .blurb{display:none}
  #fs-start .kicker{margin-bottom:12px}
  #fs-start .tag{margin-top:10px}
  #fs-start .rule{margin:14px 0 12px}
  #fs-start button{padding:11px 16px}
  #fs-start .stats{margin-top:16px}
  #fs-start .foot{margin-top:14px}
}
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
    <video class="artvid" muted loop playsinline autoplay preload="auto" tabindex="-1"
           poster="./assets/start-bg-poster.jpg" aria-hidden="true">
      <source src="./assets/start-bg.mp4" type="video/mp4" />
      <source src="./assets/start-bg.webm" type="video/webm" />
    </video>
    <div class="artfx" aria-hidden="true">
      <i class="lamp"></i>
      <i class="eyes"></i>
      <i class="rain r1"></i>
      <i class="rain r2"></i>
      <i class="motes"></i>
    </div>
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
      <div class="fs-build" data-build>BUILD —</div>
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
    const tag = q("[data-build]");
    if (tag) {
      const src = [...document.querySelectorAll('script[type="module"]')].map((n) => n.src).join(" ");
      const m = src.match(/main\.js\?v=([\w]+)/);
      tag.textContent = "BUILD " + (m ? m[1].slice(-1).toUpperCase() : "?") + " · VIDEO";
    }
    render();
    mountAd();
    const vid = q(".artvid");
    const reduce = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (vid && !reduce) {
      // The video IS the background. Reveal it the moment it has a frame - do NOT gate that on
      // play() succeeding, or a browser with a strict autoplay policy leaves the still showing and
      // it looks like the video was never wired up.
      vid.muted = true;
      const reveal = () => root.classList.add("vid");
      if (vid.readyState >= 2) reveal();
      vid.addEventListener("loadeddata", reveal, { once: true });
      vid.addEventListener("canplay", reveal, { once: true });
      const tryPlay = () => {
        const pr = vid.play();
        if (pr && pr.catch) pr.catch(() => {});
      };
      tryPlay();
      // a blocked autoplay starts on the first gesture anywhere
      const kick = () => { if (vid.paused) tryPlay(); };
      globalThis.addEventListener?.("pointerdown", kick, { once: true });
      globalThis.addEventListener?.("keydown", kick, { once: true });
    }
    root.classList.add("open");
    // probe the art once; if it is missing the gradient stands in
    const img = new Image();
    img.onload = () => root.classList.add("art");
    img.onerror = () => root.classList.remove("art");
    img.src = ART;
  }
  function hide() {
    root.classList.remove("open");
    modal.classList.remove("open");
    const vid = q(".artvid");
    if (vid) { try { vid.pause(); } catch (e) {} }
  }

  return { show, hide, render, root, get open() { return root.classList.contains("open"); } };
}
