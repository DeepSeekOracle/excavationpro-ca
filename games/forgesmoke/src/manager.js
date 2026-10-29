/**
 * FORGE SMOKE — CYBORG MANAGER
 *
 * The game no longer starts in combat. Before every run the player manages the cyborg here:
 * loadout, light mods, perks, arena — then LAUNCHES it. The cyborg fights on its own; the player
 * supplies power-up cards during the match and manages between runs.
 *
 * This module is pure DOM. It never touches the renderer: the 3D operator turntable keeps running
 * behind it, so the character model IS the preview.
 */
import { ARENAS, isArenaUnlocked } from "./menu.js?v=202610322n";
import { STARTER_LOADOUTS, PLAYER_SKINS } from "./models.js?v=202610322n";
import { addProfileXp, grantLegacy, saveProfile, xpForLevel } from "./save.js?v=202610322n";
import { TUNING } from "./tuning.js?v=202610322n";

/** Light mods are cards. `starter` ones can be taken as equipped cards; the rest are found/earned. */
export const LIGHT_MODS = [
  { id: "tac_flashlight", name: "LUMEN-X FLOODLIGHT", icon: "🔦", desc: "+85% beam width & range, +25% damage to lit enemies" },
  { id: "light_orb_rounds", name: "PHOSPHOR ORB ROUNDS", icon: "◎", desc: "+120% light-orb size, +20% reload, +10% fire rate" },
  { id: "flare_rig", name: "SOLAR AURA RIG", icon: "✷", desc: "360° cyan aura in the dark, +30% reload" },
  { id: "light_drone", name: "LIGHT DRONE", icon: "⌁", desc: "a drone companion that follows and lights the ground" },
  { id: "light_beacon", name: "GROUND BEACON", icon: "▽", desc: "drop a fixed beacon that keeps an area lit" },
];

export const PERKS = [
  { id: "perk_armor", name: "REINFORCED PLATING", desc: "+20 max integrity" },
  { id: "perk_reload", name: "AUTOLOADER", desc: "+18% reload speed" },
  { id: "perk_speed", name: "SERVO BOOST", desc: "+12% move speed" },
  { id: "perk_luck", name: "FORTUNE CORE", desc: "better card offers" },
];

const STAT_KEYS = ["POWER", "ARMOR", "AGILITY", "HANDLING", "TECH", "SIGNAL"];

/** D&D-style stat block derived from the cyborg's permanent level. */
export function statsForLevel(level = 1, equipped = {}) {
  const lvl = Math.max(1, level | 0);
  const base = {
    POWER: 10 + lvl * 2,
    ARMOR: 10 + Math.round(lvl * 1.6),
    AGILITY: 10 + lvl,
    HANDLING: 10 + Math.round(lvl * 1.2),
    TECH: 10 + lvl,
    SIGNAL: 8 + Math.round(lvl * 0.9),
  };
  if ((equipped.perks || []).includes("perk_armor")) base.ARMOR += 4;
  if ((equipped.perks || []).includes("perk_speed")) base.AGILITY += 3;
  if ((equipped.perks || []).includes("perk_reload")) base.HANDLING += 3;
  if ((equipped.perks || []).includes("perk_luck")) base.SIGNAL += 3;
  if ((equipped.lightMods || []).length) base.TECH += (equipped.lightMods || []).length * 2;
  return base;
}

/** Map a manager stat block onto actual gameplay tuning multipliers. */
export function applyStatsToRun(state, stats) {
  if (!state || !stats) return;
  state.cyborgStats = { ...stats };
  const armorBonus = Math.max(0, Math.round((stats.ARMOR - 10) * 0.9));
  state.maxHealth = 100 + armorBonus;
  state.health = state.maxHealth;
  state.statSpeedMult = 1 + Math.max(0, stats.AGILITY - 10) * 0.006;
  state.statReloadMult = 1 - Math.min(0.45, Math.max(0, stats.HANDLING - 10) * 0.004);
  state.statDamageMult = 1 + Math.max(0, stats.POWER - 10) * 0.012;
  state.statCritChance = Math.min(0.35, Math.max(0, stats.SIGNAL - 8) * 0.004);
  state.statTechMult = 1 + Math.max(0, stats.TECH - 10) * 0.01;
}

const CSS = `
#cyborg-manager{position:fixed;inset:0;z-index:40;display:none;font:13px/1.45 ui-sans-serif,system-ui,-apple-system,sans-serif;color:#cfd6e4;pointer-events:none}
#cyborg-manager.open{display:block}
#cyborg-manager .mg-top{position:absolute;top:0;left:0;right:0;height:74px;display:flex;align-items:center;gap:18px;padding:0 26px;
  background:linear-gradient(180deg,rgba(4,7,12,.94),rgba(4,7,12,.55));border-bottom:1px solid rgba(159,179,200,.18);pointer-events:auto}
#cyborg-manager .mg-name{font-size:19px;font-weight:800;letter-spacing:.14em;color:#f2f6ff}
#cyborg-manager .mg-sub{font-size:11px;letter-spacing:.16em;color:#7f8fa3}
#cyborg-manager .mg-xp{flex:1;max-width:420px}
#cyborg-manager .mg-xpbar{height:9px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:5px}
#cyborg-manager .mg-xpfill{height:100%;background:linear-gradient(90deg,#6fe3ff,#a6ff7a);width:0%}
#cyborg-manager .mg-lvl{font-size:30px;font-weight:900;color:#ffd57a;min-width:64px;text-align:center;line-height:1}
#cyborg-manager .mg-lvl small{display:block;font-size:9px;letter-spacing:.2em;color:#8a97a8;font-weight:700}
#cyborg-manager .mg-col{position:absolute;top:86px;bottom:124px;width:352px;padding:16px;overflow:auto;pointer-events:auto;
  background:linear-gradient(180deg,rgba(6,10,16,.9),rgba(6,10,16,.72));border:1px solid rgba(159,179,200,.16);border-radius:14px}
#cyborg-manager .mg-left{left:22px}
#cyborg-manager .mg-right{right:22px;width:330px}
#cyborg-manager h3{margin:0 0 10px;font-size:11px;letter-spacing:.2em;color:#8a97a8;font-weight:800}
#cyborg-manager .mg-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px}
#cyborg-manager .mg-stat{padding:8px 10px;border:1px solid rgba(159,179,200,.14);border-radius:10px;background:rgba(255,255,255,.02)}
#cyborg-manager .mg-stat b{display:block;font-size:20px;font-weight:900;color:#f2f6ff;line-height:1.1}
#cyborg-manager .mg-stat span{font-size:9px;letter-spacing:.16em;color:#8a97a8;font-weight:700}
#cyborg-manager .mg-item{display:flex;gap:9px;align-items:flex-start;padding:9px 10px;margin-bottom:6px;cursor:pointer;
  border:1px solid rgba(159,179,200,.14);border-radius:10px;background:rgba(255,255,255,.02);transition:border-color .12s,background .12s}
#cyborg-manager .mg-item:hover{border-color:rgba(111,227,255,.5)}
#cyborg-manager .mg-item.on{border-color:#6fe3ff;background:rgba(111,227,255,.10)}
#cyborg-manager .mg-item.locked{opacity:.4;cursor:not-allowed}
#cyborg-manager .mg-item .ic{font-size:15px;line-height:1.2}
#cyborg-manager .mg-item .nm{font-weight:700;font-size:12px;color:#e6edf8}
#cyborg-manager .mg-item .ds{font-size:10.5px;color:#8a97a8}
#cyborg-manager .mg-skin{display:flex;gap:10px;align-items:center}
#cyborg-manager .mg-skin img{width:46px;height:58px;object-fit:cover;border-radius:2px;flex:0 0 auto;
  border:1px solid rgba(159,179,200,.25);background:#0b1017}
#cyborg-manager .mg-skin.on img{border-color:#6fe3ff;box-shadow:0 0 12px rgba(111,227,255,.35)}
#cyborg-manager .mg-skin .txt{min-width:0}
#cyborg-manager .mg-weap{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#cyborg-manager .mg-weap .mg-item{margin:0;flex-direction:column;gap:2px;padding:7px}
#cyborg-manager .mg-bot{position:absolute;left:22px;right:22px;bottom:50px;display:flex;gap:12px;align-items:center;pointer-events:auto}
#cyborg-manager .mg-arena{display:flex;gap:8px;flex:1}
#cyborg-manager .mg-arena .mg-item{flex:1;margin:0}
#cyborg-manager .mg-launch{padding:15px 34px;border:0;border-radius:12px;cursor:pointer;font-weight:900;letter-spacing:.16em;font-size:14px;
  color:#04070c;background:linear-gradient(180deg,#a6ff7a,#4fd18a);box-shadow:0 10px 30px rgba(79,209,138,.28)}
#cyborg-manager .mg-launch:hover{filter:brightness(1.08)}
#cyborg-manager .mg-hint{font-size:11px;color:#8a97a8;letter-spacing:.06em}
#cyborg-manager .mg-tag{font-size:9px;letter-spacing:.16em;padding:2px 7px;border-radius:99px;border:1px solid rgba(159,179,200,.3);color:#9fb3c8}
#cyborg-manager .mg-namewrap{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
#cyborg-manager .mg-nameinput{width:100%;box-sizing:border-box;padding:9px 11px;border-radius:3px;
  border:1px solid #1E2A35;background:#0B1017;color:#E8F1F8;
  font:700 14px ui-monospace,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;-webkit-appearance:none;appearance:none}
#cyborg-manager .mg-nameinput::placeholder{color:#4A5A6B}
#cyborg-manager .mg-nameinput:focus{outline:none;border-color:#6FE3FF;box-shadow:0 0 12px rgba(111,227,255,.25)}
#cyborg-manager .mg-namehint{display:block;font:600 8px ui-monospace,Consolas,monospace;letter-spacing:.18em;color:#54626F}
#cyborg-manager .mg-board{font:600 10.5px ui-monospace,Consolas,monospace;color:#9FB3C8;margin-bottom:6px}
#cyborg-manager .mg-board ol{margin:0;padding:0;list-style:none;counter-reset:r}
#cyborg-manager .mg-board li{counter-increment:r;display:flex;gap:8px;align-items:baseline;padding:3px 0;
  border-bottom:1px dashed rgba(44,58,71,.55)}
#cyborg-manager .mg-board li:before{content:counter(r,decimal-leading-zero);color:#54626F;min-width:18px}
#cyborg-manager .mg-board b{color:#FFD166;min-width:30px;text-align:right}
#cyborg-manager .mg-board span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#E8F1F8}
#cyborg-manager .mg-board em{color:#7E93A6;font-style:normal;font-size:9px}
#cyborg-manager .mg-talwrap{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
#cyborg-manager .mg-talent{width:100%;padding:11px 14px;border-radius:3px;cursor:pointer;
  border:1px solid rgba(255,179,71,.7);background:linear-gradient(180deg,rgba(255,196,99,.16),rgba(231,149,49,.10));
  color:#FFB347;font:800 11px ui-monospace,Consolas,monospace;letter-spacing:.18em;text-align:left}
#cyborg-manager .mg-talent b{color:#FFD166;font-size:14px}
#cyborg-manager .mg-talent:hover{border-color:#FFD166;box-shadow:0 0 18px -6px rgba(255,179,71,.6)}
#cyborg-manager .mg-attrs{display:grid;grid-template-columns:1fr auto;gap:4px 8px;margin-bottom:14px}
#cyborg-manager .mg-attrs b{font:700 11px ui-monospace,Consolas,monospace;color:#E8F1F8}
#cyborg-manager .mg-attrs span{font:600 10px ui-monospace,Consolas,monospace;color:#7E93A6}
#cyborg-manager .mg-attrs button{width:22px;height:22px;border:1px solid #2C3A47;background:#0B1017;color:#9FB3C8;
  border-radius:3px;cursor:pointer;font:700 12px/1 ui-monospace,Consolas,monospace}
#cyborg-manager .mg-attrs button:hover:not(:disabled){border-color:#FFB347;color:#FFB347}
#cyborg-manager .mg-attrs button:disabled{opacity:.35;cursor:not-allowed}
#cyborg-manager .mg-pad{margin-top:8px;font:600 8.5px ui-monospace,Consolas,monospace;letter-spacing:.16em;color:#7E93A6}
#cyborg-manager .mg-pad.on{color:#7CE6A8}

`;

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

export function createManager(opts = {}) {
  const onLaunch = opts.onLaunch || (() => {});
  const onChange = opts.onChange || (() => {});
  const onSkinChange = opts.onSkinChange || (() => {});
  const onOpenTalents = opts.onOpenTalents || (() => {});
  let profile = opts.getProfile ? opts.getProfile() : null;

  const root = el("div");
  root.id = "cyborg-manager";
  root.innerHTML = `
    <div class="mg-top">
      <div><div class="mg-name">CYBORG // FORGE-1</div><div class="mg-sub">AUTONOMOUS FIGHTER · MANAGER TERMINAL</div></div>
      <div class="mg-lvl"><span data-lvl>1</span><small>LEVEL</small></div>
      <div class="mg-xp">
        <div class="mg-sub"><span data-xptext>0 / 110 XP</span> · <span data-record>0 runs · 0 arenas cleared</span></div>
        <div class="mg-xpbar"><div class="mg-xpfill" data-xpfill></div></div>
      </div>
    </div>
    <div class="mg-col mg-left">
      <h3>DESIGNATION</h3>
      <div class="mg-namewrap">
        <input class="mg-nameinput" data-name maxlength="18" spellcheck="false" autocomplete="off"
               placeholder="OPERATOR" aria-label="Cyborg name for the leaderboard" />
        <span class="mg-namehint">SHOWN ON THE PUBLIC BOARD</span>
      </div>
      <h3>LEADERBOARD <span class="mg-tag">HIGHEST LEVEL</span></h3>
      <div data-board class="mg-board">loading…</div>
      <h3 style="margin-top:16px">SPECIAL OPERATIONS</h3>
      <div class="mg-talwrap">
        <button class="mg-talent" data-talents>TALENT TREE <b data-tpoints>0</b> PTS</button>
        <span class="mg-namehint">SPEND POINTS · KEYSTONES · MASTERIES</span>
      </div>
      <h3>CHARACTER</h3>
      <div data-skins></div>
      <h3 style="margin-top:16px">ATTRIBUTE POINTS <span class="mg-tag" data-attrpts>0</span></h3>
      <div data-attrs class="mg-attrs"></div>
      <h3 style="margin-top:16px">CONTROL MODE</h3>
      <div data-modes></div>
      <div class="mg-pad" data-pad></div>
      <h3 style="margin-top:16px">ATTRIBUTES</h3>
      <div class="mg-stats" data-stats></div>
      <h3>LIGHT MODS <span class="mg-tag">CARD-GATED</span></h3>
      <div data-lightmods></div>
    </div>
    <div class="mg-col mg-right">
      <h3>PRIMARY WEAPON</h3>
      <div class="mg-weap" data-weapons></div>
      <h3 style="margin-top:16px">PERKS</h3>
      <div data-perks></div>
      <div class="mg-ad" data-ad></div>
      <h3 style="margin-top:16px">LEGACY</h3>
      <div data-legacy class="mg-hint">nothing unlocked yet</div>

    </div>
    <div class="mg-bot">
      <div class="mg-arena" data-arenas></div>
      <button class="mg-launch" data-launch>LAUNCH CYBORG</button>
    </div>
  `;
  document.body.appendChild(root);

  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  const q = (s) => root.querySelector(s);
  let selectedArena = opts.arenaId || "arena1";

  function owned(id) {
    return (profile?.legacy || []).includes(id);
  }

  function render() {
    const p = profile || { level: 1, xp: 0 };
    q("[data-lvl]").textContent = p.level;
    const need = xpForLevel(p.level);
    q("[data-xptext]").textContent = `${p.xp} / ${need} XP`;
    q("[data-xpfill]").style.width = `${Math.min(100, (p.xp / need) * 100)}%`;
    q("[data-record]").textContent = `${p.runs || 0} runs · ${p.arenasCleared || 0} arenas cleared`;

    // the board only accepts named cyborgs, so say so plainly
    const hint = q(".mg-namehint");
    if (hint) hint.textContent = (p.name || "").trim() ? "SHOWN ON THE PUBLIC BOARD" : "REQUIRED FOR THE PUBLIC BOARD";

    const tp = q("[data-tpoints]");
    if (tp) tp.textContent = String(p.talentPoints ?? 0);
    const talBtn = q("[data-talents]");
    if (talBtn && !talBtn.dataset.bound) { talBtn.dataset.bound = "1"; talBtn.onclick = () => onOpenTalents(); }

    // character roster: the suit the cyborg launches in
    q("[data-skins]").innerHTML = "";
    const skinIdx = p.equipped?.skin ?? 0;
    PLAYER_SKINS.forEach((skin, i) => {
      const on = i === skinIdx;
      const item = el("div", `mg-item mg-skin${on ? " on" : ""}`,
        `<img src="./assets/portraits/${skin.id}.jpg" alt="" loading="lazy" decoding="async"
              onerror="this.remove()">
         <div class="txt"><div class="nm">${skin.name}</div><div class="ds">${skin.badge}${on ? " · SELECTED" : ""}</div></div>`);
      item.onclick = () => { p.equipped.skin = i; persist(); onSkinChange(i); };
      q("[data-skins]").appendChild(item);
    });

    // designation (goes on the public board)
    const nameInput = q("[data-name]");
    if (nameInput && document.activeElement !== nameInput) nameInput.value = p.name || "";
    if (nameInput && !nameInput.dataset.bound) {
      nameInput.dataset.bound = "1";
      nameInput.addEventListener("input", (e) => {
        p.name = String(e.target.value || "").toUpperCase().replace(/[^A-Z0-9 _.-]/g, "").slice(0, 18);
        e.target.value = p.name;
      });
      nameInput.addEventListener("change", () => { if (p.name) persist(); });
    }

    // attribute points
    const ap = Number(p.attrPoints || 0);
    const aptsEl = q("[data-attrpts]");
    if (aptsEl) aptsEl.textContent = String(ap);
    const rows = [["power","POWER"],["armor","ARMOR"],["agility","AGILITY"],["handling","HANDLING"],["tech","TECH"],["signal","SIGNAL"]];
    const holder = q("[data-attrs]");
    if (holder && p.__attrRendered !== ap) {
      p.__attrRendered = ap;
      holder.innerHTML = "";
      for (const [k, label] of rows) {
        const cur = Number((p.attrs && p.attrs[k]) || 0);
        const b = el("div", "", `<b>${label}</b> <span>+${cur}</span>`);
        const btn = document.createElement("button");
        btn.textContent = "+";
        btn.disabled = ap <= 0;
        btn.onclick = () => {
          // mutate the live profile (persist() uses the closure), then save + re-render
          p.attrPoints = Math.max(0, ap - 1);
          p.attrs = { ...(p.attrs || {}), [k]: cur + 1 };
          p.__attrRendered = null;
          persist();
        };
        b.appendChild(btn);
        holder.appendChild(b);
      }
    }

    // control mode: autonomous by default (the game's focus), manual if the player wants the stick
    const modes = [
      { id: "autonomous", name: "AUTONOMOUS", desc: "cyborg flies itself · you play the cards" },
      { id: "manual", name: "MANUAL", desc: "you steer · the gun still auto-fires" },
    ];
    const currentMode = p.equipped?.mode || "autonomous";
    q("[data-modes]").innerHTML = "";
    for (const m of modes) {
      const on = m.id === currentMode;
      const item = el("div", `mg-item${on ? " on" : ""}`,
        `<div><div class="nm">${m.name}</div><div class="ds">${m.desc}</div></div>`);
      item.onclick = () => { p.equipped.mode = m.id; persist(); };
      q("[data-modes]").appendChild(item);
    }

    // gamepad readout
    const padEl = q("[data-pad]");
    if (padEl) {
      const pad = globalThis.__fsPad ? globalThis.__fsPad() : null;
      const on = Boolean(pad && pad.connected);
      padEl.classList.toggle("on", on);
      padEl.textContent = on ? "GAMEPAD: " + String(pad.id || "connected").slice(0, 30) : "GAMEPAD: press any button";
    }

    const stats = statsForLevel(p.level, p.equipped || {});
    q("[data-stats]").innerHTML = STAT_KEYS
      .map((k) => `<div class="mg-stat"><b>${stats[k]}</b><span>${k}</span></div>`)
      .join("");

    // light mods: owned ones are toggleable, others show as locked
    q("[data-lightmods]").innerHTML = "";
    for (const mod of LIGHT_MODS) {
      const has = owned(mod.id);
      const on = (p.equipped?.lightMods || []).includes(mod.id);
      const item = el("div", `mg-item${on ? " on" : ""}${has ? "" : " locked"}`,
        `<div class="ic">${mod.icon}</div><div><div class="nm">${mod.name}</div><div class="ds">${has ? mod.desc : "locked · earn it in an arena"}</div></div>`);
      if (has) {
        item.onclick = () => {
          const list = new Set(p.equipped.lightMods || []);
          on ? list.delete(mod.id) : list.add(mod.id);
          p.equipped.lightMods = [...list];
          persist();
        };
      }
      q("[data-lightmods]").appendChild(item);
    }

    // weapons
    q("[data-weapons]").innerHTML = "";
    for (const w of STARTER_LOADOUTS) {
      const on = (p.equipped?.weapon || "spray") === w.id;
      const cfg = TUNING.weapons[w.id] || {};
      const dmg = cfg.pellets ? `${cfg.damage}x${cfg.pellets}` : (cfg.damage ?? "-");
      const rpm = cfg.cycle ? Math.round(60 / cfg.cycle) : "-";
      const mag = cfg.magazine ?? "-";
      const item = el("div", `mg-item${on ? " on" : ""}`,
        `<div class="nm" style="color:${w.color}">${w.name}</div><div class="ds">${w.role}</div>`
        + `<div class="ds">DMG ${dmg} · ${rpm} RPM · MAG ${mag}</div>`);
      item.onclick = () => { p.equipped.weapon = w.id; persist(); };
      q("[data-weapons]").appendChild(item);
    }

    // perks
    q("[data-perks]").innerHTML = "";
    for (const perk of PERKS) {
      const has = owned(perk.id);
      const on = (p.equipped?.perks || []).includes(perk.id);
      const item = el("div", `mg-item${on ? " on" : ""}${has ? "" : " locked"}`,
        `<div><div class="nm">${perk.name}</div><div class="ds">${has ? perk.desc : "locked"}</div></div>`);
      if (has) {
        item.onclick = () => {
          const list = new Set(p.equipped.perks || []);
          on ? list.delete(perk.id) : list.add(perk.id);
          p.equipped.perks = [...list];
          persist();
        };
      }
      q("[data-perks]").appendChild(item);
    }

    q("[data-legacy]").textContent = (p.legacy || []).length
      ? (p.legacy || []).join(" · ")
      : "nothing unlocked yet";

    // arenas
    q("[data-arenas]").innerHTML = "";
    for (const a of ARENAS) {
      const unlocked = isArenaUnlocked(a.id);
      const on = selectedArena === a.id;
      const item = el("div", `mg-item${on ? " on" : ""}${unlocked ? "" : " locked"}`,
        `<div><div class="nm">${a.name}</div><div class="ds">${unlocked ? a.desc : `locked · needs ${a.reqScore} best score`}</div></div>`);
      if (unlocked) item.onclick = () => { selectedArena = a.id; render(); };
      q("[data-arenas]").appendChild(item);
    }
  }

  // ── public leaderboard (HF dataset book, written by the ledger Space) ──────
  const BOARD_FEEDS = [
    "https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins/resolve/main/arcade.json",
    "https://deepseekoracle-lattice-marines-ledger.hf.space/arcade.json",
  ];
  let boardCache = { at: 0, rows: null };

  async function loadBoard(force) {
    const box = q("[data-board]");
    if (!box) return;
    if (!force && boardCache.rows && Date.now() - boardCache.at < 120000) {
      paintBoard(box, boardCache.rows);
      return;
    }
    for (const url of BOARD_FEEDS) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) continue;
        const j = await r.json();
        const rows = (j?.books?.forgesmoke?.rows) || [];
        if (!rows.length) continue;
        boardCache = { at: Date.now(), rows };
        paintBoard(box, rows);
        return;
      } catch (e) { /* try the next feed */ }
    }
    if (!boardCache.rows) box.textContent = "no runs inscribed yet — set a name and launch one.";
  }

  function paintBoard(box, rows) {
    const top = [...rows]
      .sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0) || (Number(b.ms) || 0) - (Number(a.ms) || 0))
      .slice(0, 8);
    if (!top.length) { box.textContent = "no runs inscribed yet."; return; }
    box.innerHTML = "<ol>" + top.map((r) => {
      const ms = Number(r.ms) || 0;
      const mm = Math.floor(ms / 60000), ss = Math.floor((ms % 60000) / 1000);
      const time = ms ? `${mm}:${String(ss).padStart(2, "0")}` : "—";
      return `<li><b>${Number(r.level) || 1}</b><span>${String(r.name || "OPERATOR")}</span><em>${time} · ${String(r.mode || "auto").slice(0, 4)}</em></li>`;
    }).join("") + "</ol>";
  }

  function persist() {
    profile = saveProfile(profile);
    render();
    onChange(profile);
  }

  q("[data-launch]").onclick = () => { try { window.__fsSfx?.("click", { volume: 0.5 }); } catch (e) {}
    const equipped = { ...(profile.equipped || {}) };
    hide();
    onLaunch({ arenaId: selectedArena, equipped, stats: statsForLevel(profile.level, equipped), profile });
  };

  function mountAd() {
    const box = q("[data-ad]");
    if (!box || box.dataset.mounted === "1") return;
    box.dataset.mounted = "1";
    box.innerHTML = '<div class="ad-label">ADVERTISEMENT</div>' +
      '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0646320966060599" ' +
      'data-ad-format="auto" data-full-width-responsive="true"></ins>';
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked or offline */ }
  }

  function show(nextProfile) {
    if (nextProfile) profile = nextProfile;
    render();
    mountAd();
    loadBoard();
    root.classList.add("open");
  }
  function hide() { root.classList.remove("open"); }

  return { show, hide, render, root, get profile() { return profile; }, set profile(v) { profile = v; }, selectedArena: () => selectedArena };
}
