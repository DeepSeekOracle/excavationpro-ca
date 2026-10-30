/**
 * FORGE SMOKE — CARD TRAY
 *
 * A real card picker: three physical-looking cards dealt at the bottom of the screen, rarity frames,
 * art panel, effect lines, keyboard 1/2/3 or click, deal-in and hover animation. Replaces the old
 * three lines of canvas text.
 *
 * The card faces are drawn in CSS (no image requests) so they stay crisp at any resolution and cost
 * nothing to ship.
 */

const RARITY = {
  common: { name: "STANDARD", a: "#3E4A57", b: "#5A6B7C", glow: "rgba(159,179,200,.35)", ink: "#cfdced" },
  rare: { name: "SPECIAL ISSUE", a: "#3E7FA8", b: "#6FE3FF", glow: "rgba(111,227,255,.55)", ink: "#bfeaff" },
  epic: { name: "CLASSIFIED", a: "#7B5BD6", b: "#B79CFF", glow: "rgba(183,156,255,.6)", ink: "#ddd0ff" },
};

/**
 * Procedural card plates (brief 01). Qwen generation is blocked on this 8 GB card (the diffusion
 * model fails to allocate), so the six effect-family plates are drawn locally on a canvas instead:
 * 768x512, dark military palette, no text baked in.
 */
const PLATE_CACHE = new Map();
function plate(kind) {
  if (PLATE_CACHE.has(kind)) return PLATE_CACHE.get(kind);
  const c = document.createElement("canvas");
  c.width = 768; c.height = 512;
  const g = c.getContext("2d");
  const bg = g.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, "#121b26");
  bg.addColorStop(0.55, "#0b121a");
  bg.addColorStop(1, "#060a0f");
  g.fillStyle = bg;
  g.fillRect(0, 0, 768, 512);
  g.strokeStyle = "rgba(159,179,200,0.07)";
  g.lineWidth = 1;
  for (let x = 0; x <= 768; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  for (let y = 0; y <= 512; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(768, y); g.stroke(); }
  let seed = 96;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  g.fillStyle = "rgba(0,0,0,0.25)";
  for (let i = 0; i < 160; i += 1) {
    const r = 1 + rnd() * 3;
    g.beginPath(); g.arc(rnd() * 768, rnd() * 512, r, 0, Math.PI * 2); g.fill();
  }
  const amber = "#ffb347", cyan = "#6fe3ff", green = "#a6ff7a", violet = "#b79cff", red = "#f2545b";
  g.save();
  g.translate(384, 256);
  g.shadowBlur = 26;
  if (kind === "pierce") {
    g.shadowColor = cyan;
    g.strokeStyle = cyan;
    for (let i = -2; i <= 2; i += 1) {
      g.lineWidth = 7;
      g.beginPath(); g.moveTo(-260, 120 + i * 40); g.lineTo(240, -120 + i * 40); g.stroke();
    }
    g.fillStyle = "rgba(10,16,22,0.9)";
    g.fillRect(-70, -150, 140, 300);
    g.strokeStyle = "rgba(255,179,71,0.5)"; g.lineWidth = 2; g.strokeRect(-70, -150, 140, 300);
  } else if (kind === "chain") {
    g.shadowColor = violet;
    g.strokeStyle = violet;
    g.lineWidth = 6;
    g.beginPath(); g.moveTo(-240, -40);
    let x = -240, y = -40;
    for (let i = 0; i < 9; i += 1) { x += 55; y = -40 + (i % 2 ? -55 : 55); g.lineTo(x, y); }
    g.stroke();
    g.fillStyle = amber;
    g.fillRect(-270, -60, 30, 40); g.fillRect(210, -60, 30, 40);
  } else if (kind === "spinup") {
    g.shadowColor = amber;
    g.strokeStyle = amber;
    g.lineWidth = 10;
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      g.beginPath(); g.moveTo(Math.cos(a) * 40, Math.sin(a) * 40); g.lineTo(Math.cos(a) * 150, Math.sin(a) * 150); g.stroke();
    }
    g.fillStyle = "rgba(255,179,71,0.18)";
    g.beginPath(); g.arc(0, 0, 70, 0, Math.PI * 2); g.fill();
  } else if (kind === "ricochet") {
    g.shadowColor = green;
    g.strokeStyle = green;
    g.lineWidth = 5;
    g.beginPath(); g.moveTo(-260, 150); g.lineTo(-40, -40); g.lineTo(190, 120); g.stroke();
    g.fillStyle = green;
    for (const p of [[-40, -40], [190, 120], [-150, 60], [80, 40]]) { g.beginPath(); g.arc(p[0], p[1], 5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "rgba(10,16,22,0.9)"; g.fillRect(-90, -210, 180, 64);
  } else if (kind === "drone") {
    g.shadowColor = cyan;
    g.fillStyle = "#1a2531"; g.strokeStyle = cyan; g.lineWidth = 4;
    g.beginPath(); g.ellipse(0, 0, 70, 40, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    for (const s of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.beginPath(); g.arc(s[0] * 110, s[1] * 70, 34, 0, Math.PI * 2); g.stroke();
    }
    const beam = g.createLinearGradient(0, 40, 0, 230);
    beam.addColorStop(0, "rgba(111,227,255,0.55)"); beam.addColorStop(1, "rgba(111,227,255,0)");
    g.fillStyle = beam;
    g.beginPath(); g.moveTo(-24, 40); g.lineTo(24, 40); g.lineTo(150, 240); g.lineTo(-150, 240); g.closePath(); g.fill();
  } else {
    g.shadowColor = amber;
    g.strokeStyle = amber; g.lineWidth = 4;
    for (let i = 0; i < 3; i += 1) {
      const w = 220 - i * 34;
      g.beginPath();
      for (let k = 0; k < 6; k += 1) {
        const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
        const px = Math.cos(a) * (w * 0.5), py = Math.sin(a) * (w * 0.42);
        if (k === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.closePath(); g.stroke();
    }
    g.fillStyle = "rgba(255,179,71,0.12)"; g.fillRect(-110, -110, 220, 220);
  }
  g.restore();
  g.strokeStyle = "rgba(255,179,71,0.35)";
  g.lineWidth = 3;
  g.strokeRect(10, 10, 748, 492);
  g.fillStyle = "rgba(255,179,71,0.5)";
  for (const p of [[22, 22], [746, 22], [22, 490], [746, 490]]) { g.fillRect(p[0] - 2, p[1] - 2, 4, 4); }
  const url = c.toDataURL("image/jpeg", 0.86);
  PLATE_CACHE.set(kind, url);
  return url;
}

const CARD_ART = {
  weapon: "./assets/cards/weapon.jpg",
  explosive: "./assets/cards/explosive.jpg",
  light: "./assets/cards/light.jpg",
  armour: "./assets/cards/armour.jpg",
  logistics: "./assets/cards/logistics.jpg",
};

/** Which artwork a card earns, from what it actually does. */
function cardArt(card) {
  const e = card.part?.effect || {};
  const id = String(card.part?.id || "");
  const style = String(card.style || "");
  if (card.type === "weapon") {
    if (style === "chain" || style === "arc") return plate("chain");
    if (style === "spinup") return plate("spinup");
    if (style === "ricochet") return plate("ricochet");
    if (style === "rail" || style === "rail2" || style === "pierce" || style === "flak") return plate("pierce");
    return CARD_ART.weapon;
  }
  if (/ap_rounds|pierce|rail|penetr/.test(id) || e.pierceCount) return plate("pierce");
  if (/chain|tesla|arc_|overload/.test(id)) return plate("chain");
  if (/spinup|minigun|gatling|drum/.test(id)) return plate("spinup");
  if (/ricochet|bank/.test(id)) return plate("ricochet");
  if (/drone/.test(id) || e.lightDrone) return plate("drone");
  if (/plate|ceramic|reactive|armour|armor/.test(id) || e.armor) return plate("armour");
  if (e.explosive || e.blast || e.shieldPierce || /frag|breach|grenade|satchel/.test(id)) return CARD_ART.explosive;
  if (e.lightBeamMult || e.lightOrbMult || e.solarAura || e.lightDrone || e.lightBeacon || /light|flare|lumen|phosphor/.test(id)) return CARD_ART.light;
  if (e.reloadMult || e.magMult || /mag|ammo|supply|quartermaster|rack/.test(id)) return CARD_ART.logistics;
  if (e.hp || e.armor || /perk_armor|plate|trauma/.test(id)) return CARD_ART.armour;
  return CARD_ART.weapon;
}

const ICONS = {
  weapon: "⌁", part: "✦", perk: "◈",
};

const CSS = `
#fs-cards{position:fixed;left:0;right:0;bottom:0;z-index:44;display:none;justify-content:center;align-items:flex-end;
  gap:18px;padding:0 20px 74px;pointer-events:none;
  background:linear-gradient(180deg,transparent,rgba(4,6,9,.55) 42%,rgba(4,6,9,.86));
  font:13px/1.4 ui-sans-serif,system-ui,sans-serif;color:#E8F1F8}
#fs-cards.open{display:flex}
#fs-cards-scrim{position:fixed;inset:0;z-index:43;display:none;pointer-events:none;
  background:radial-gradient(ellipse at 50% 68%,rgba(2,5,9,.18) 0%,rgba(2,5,9,.62) 62%,rgba(2,5,9,.82) 100%)}
#fs-cards-scrim.open{display:block}
#fs-cards .hdr{position:absolute;left:0;right:0;top:calc(100% - 100%);text-align:center;font:800 11px ui-monospace,Consolas,monospace;
  letter-spacing:.3em;color:#FFB347;pointer-events:none}
#fs-cards .card{pointer-events:auto;position:relative;width:212px;min-height:286px;border-radius:8px;cursor:pointer;
  background:linear-gradient(180deg,#0F151C,#0A0F15);border:2px solid transparent;padding:2px;
  transform:translateY(26px) scale(.94);opacity:0;animation:dealIn .28s cubic-bezier(.2,.9,.2,1) forwards;
  transition:transform .14s,box-shadow .14s}
#fs-cards .card:nth-child(2){animation-delay:.06s}
#fs-cards .card:nth-child(3){animation-delay:.12s}
@keyframes dealIn{to{transform:translateY(0) scale(1);opacity:1}}
#fs-cards .card:hover{transform:translateY(-8px) scale(1.02)}
#fs-cards .card.common{border-image:linear-gradient(180deg,#3E4A57,#5A6B7C) 1}
#fs-cards .card.rare{border-image:linear-gradient(180deg,#3E7FA8,#6FE3FF) 1}
#fs-cards .card.epic{border-image:linear-gradient(180deg,#7B5BD6,#B79CFF) 1}
#fs-cards .card.rare{box-shadow:0 0 22px -6px rgba(111,227,255,.45)}
#fs-cards .card.epic{box-shadow:0 0 26px -6px rgba(183,156,255,.5)}
#fs-cards .card:hover{box-shadow:0 0 34px -4px var(--glow,rgba(255,179,71,.5))}

#fs-cards .face{position:relative;height:100%;border-radius:6px;overflow:hidden;
  background:radial-gradient(120% 80% at 50% 0%,rgba(255,255,255,.06),transparent 60%),linear-gradient(180deg,#101822,#0A1018)}
#fs-cards .art{position:relative;height:118px;display:grid;place-items:center;
  background:radial-gradient(circle at 50% 42%,var(--a,rgba(255,179,71,.22)),rgba(8,12,18,.9) 68%);
  border-bottom:1px solid rgba(159,179,200,.16)}
#fs-cards .artimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.92;
  filter:saturate(1.05) contrast(1.05);mask-image:linear-gradient(180deg,#000 62%,rgba(0,0,0,.35))}
#fs-cards .art .glyph{position:relative;z-index:2;text-shadow:0 0 14px rgba(0,0,0,.9),0 0 26px var(--glow)}
#fs-cards .art:after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
  background:radial-gradient(120% 90% at 50% 20%,transparent 40%,rgba(6,10,16,.85)),linear-gradient(0deg,rgba(8,12,18,.9),transparent 55%);
  mix-blend-mode:multiply}
#fs-cards .art .rarity{position:relative;z-index:2}
#fs-cards .art:before{content:"";position:absolute;inset:0;
  background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.045) 0 1px,transparent 1px 9px),
    repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 9px);
  mask-image:radial-gradient(circle at 50% 45%,#000 30%,transparent 78%)}
#fs-cards .art b{position:relative;font:800 40px/1 ui-monospace,Consolas,monospace;color:var(--b,#FFB347);
  text-shadow:0 0 18px var(--glow,rgba(255,179,71,.6))}
#fs-cards .rarity{position:absolute;top:8px;left:10px;right:10px;display:flex;justify-content:space-between;
  font:700 8px ui-monospace,Consolas,monospace;letter-spacing:.22em;color:var(--ink,#cfdced);opacity:.85}
#fs-cards .body{padding:11px 12px 14px}
#fs-cards h4{margin:0 0 5px;font:800 13px ui-sans-serif,system-ui,sans-serif;letter-spacing:.02em;color:#F2F7FD;line-height:1.25}
#fs-cards ul{margin:0;padding:0;list-style:none}
#fs-cards li{font:600 10px/1.55 ui-monospace,Consolas,monospace;color:#9FB3C8;padding-left:11px;position:relative}
#fs-cards li:before{content:"▸";position:absolute;left:0;color:var(--b,#FFB347);opacity:.8}
#fs-cards .key{position:absolute;bottom:8px;right:10px;font:800 10px ui-monospace,Consolas,monospace;
  color:#0A0D11;background:var(--b,#FFB347);border-radius:3px;padding:2px 7px;letter-spacing:.1em}
#fs-cards .tag{font:700 8px ui-monospace,Consolas,monospace;letter-spacing:.2em;color:#6F8296;margin-top:7px}
@media (max-width:900px){#fs-cards{gap:10px;padding-bottom:64px}#fs-cards .card{width:170px;min-height:240px}
  #fs-cards .art{height:92px}}
/* UI-10: a 390x844 phone must show all three cards without clipping or horizontal scroll.
   3 x 116 + 2 x 6 gap + 16 padding = 376 of 390 available. */
@media (max-width:480px){
  #fs-cards{gap:6px;padding:0 8px 52px}
  #fs-cards .card{width:min(29.5vw,116px);min-height:0;padding:1px;border-width:1px}
  #fs-cards .card:hover{transform:none}
  #fs-cards .art{height:66px}
  #fs-cards .art b{font-size:24px}
  #fs-cards .rarity{top:4px;left:5px;right:5px;font-size:5.5px;letter-spacing:.08em}
  #fs-cards .body{padding:6px 6px 9px}
  #fs-cards h4{font-size:9px;line-height:1.2;margin-bottom:2px}
  #fs-cards li{font-size:6.8px;line-height:1.4;padding-left:7px}
  #fs-cards li:before{font-size:6px}
  #fs-cards .key{font-size:7px;padding:1px 4px;bottom:4px;right:5px}
  #fs-cards .tag{display:none}
  #fs-cards .hdr{display:none}
}
@media (max-width:340px){
  #fs-cards{gap:4px;padding:0 5px 46px}
  #fs-cards .card{width:min(30vw,100px)}
  #fs-cards .art{height:58px}
}
`;

export function createCardTray(opts = {}) {
  const onPick = opts.onPick || (() => {});

  const style = document.createElement("style");
  style.textContent = CSS + `
#fs-cards-timer{position:fixed;top:15vh;left:50%;transform:translateX(-50%);z-index:60;
  font-family:"Arial Black",Impact,system-ui,sans-serif;font-weight:900;letter-spacing:2px;
  font-size:17px;color:#ffd27a;background:rgba(6,10,16,.86);border:1px solid rgba(255,179,71,.55);
  border-radius:999px;padding:9px 20px;text-shadow:0 2px 0 rgba(0,0,0,.6);
  box-shadow:0 6px 24px rgba(0,0,0,.45);pointer-events:none;transition:color .15s,border-color .15s}
#fs-cards-timer.urgent{color:#ff5a5a;border-color:rgba(255,90,90,.75)}
#fs-cards-timer b{color:#ffffff}`;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "fs-cards";
  document.body.appendChild(root);

  let timerEl = null;
  function ensureTimer() {
    if (!timerEl) {
      timerEl = document.createElement("div");
      timerEl.id = "fs-cards-timer";
      document.body.appendChild(timerEl);
    }
    timerEl.style.display = "block";
    return timerEl;
  }
  function setCountdown(seconds) {
    const el = ensureTimer();
    const s = Math.max(0, Number(seconds) || 0);
    el.innerHTML = `AUTO-PICK IN <b>${s.toFixed(1)}s</b>`;
    el.classList.toggle("urgent", s <= 3);
  }

  function effectLines(card) {
    const p = card.part || null;
    const e = p?.effect || {};
    const lines = [];
    if (e.damageMult) lines.push(`+${Math.round((e.damageMult - 1) * 100)}% damage`);
    if (e.cycleMult) lines.push(`${e.cycleMult < 1 ? "+" : "-"}${Math.abs(Math.round((1 - e.cycleMult) * 100))}% fire rate`);
    if (e.reloadMult) lines.push(`+${Math.round((1 - e.reloadMult) * 100)}% reload speed`);
    if (e.magMult) lines.push(`+${Math.round((e.magMult - 1) * 100)}% magazine`);
    if (e.lightBeamMult) lines.push("weapon floodlight");
    if (e.lightOrbMult) lines.push("light-orb rounds");
    if (e.solarAura) lines.push("360° solar aura");
    if (e.lightDrone) lines.push("orbiting light drone");
    if (e.lightBeacon) lines.push("ground beacons");
    if (e.explosive) lines.push("explosive — ignores shields");
    if (e.shieldPierce) lines.push(`+${e.shieldPierce}% shield pierce`);
    if (e.blast) lines.push(`+${e.blast}% blast damage`);
    if (card.type === "weapon") lines.push(`new weapon: ${String(card.style || "").toUpperCase()}`);
    return lines.length ? lines : ["field upgrade"];
  }

  function render(cards) {
    root.innerHTML = "";
    cards.forEach((card, i) => {
      const rarity = RARITY[card.part?.rarity] || RARITY.common;
      const el = document.createElement("div");
      el.className = `card ${card.part?.rarity || "common"}`;
      el.style.setProperty("--a", rarity.glow);
      el.style.setProperty("--b", rarity.b);
      el.style.setProperty("--glow", rarity.glow);
      el.innerHTML = `
        <div class="face">
          <div class="art">
            <img class="artimg" src="${cardArt(card)}" alt="" loading="lazy" decoding="async" onerror="this.remove()" />
            <div class="rarity"><span>${rarity.name}</span><span>${ICONS[card.type] || "✦"} ${String(card.type).toUpperCase()}</span></div>
            <b class="glyph">${card.type === "weapon" ? "⌁" : (card.part?.id?.startsWith("light") || card.part?.effect?.lightBeamMult ? "✷" : "✦")}</b>
          </div>
          <div class="body">
            <h4>${card.name || "Field Upgrade"}</h4>
            <ul>${effectLines(card).slice(0, 3).map((l) => `<li>${l}</li>`).join("")}</ul>
            <div class="tag">${card.type === "weapon" ? "ARMORY" : "TACTICAL"}</div>
          </div>
          <span class="key">${i + 1}</span>
        </div>`;
      el.addEventListener("click", () => onPick(i));
      root.appendChild(el);
    });
    let scrim = document.getElementById("fs-cards-scrim");
    if (!scrim) { scrim = document.createElement("div"); scrim.id = "fs-cards-scrim"; document.body.appendChild(scrim); }
    scrim.classList.add("open");
    root.classList.add("open");
    setCountdown(10);
  }

  function hide() {
    root.classList.remove("open");
    root.innerHTML = "";
    if (timerEl) timerEl.style.display = "none";
    const scrim = document.getElementById("fs-cards-scrim");
    if (scrim) scrim.classList.remove("open");
  }

  return { show: render, hide, setCountdown, root, get open() { return root.classList.contains("open"); } };
}
