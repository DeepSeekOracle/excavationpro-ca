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
  if (card.type === "weapon") return CARD_ART.weapon;
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
`;

export function createCardTray(opts = {}) {
  const onPick = opts.onPick || (() => {});

  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "fs-cards";
  document.body.appendChild(root);

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
    root.classList.add("open");
  }

  function hide() { root.classList.remove("open"); root.innerHTML = ""; }

  return { show: render, hide, root, get open() { return root.classList.contains("open"); } };
}
