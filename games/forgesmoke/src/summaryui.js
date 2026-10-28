/**
 * FORGE SMOKE — RUN SUMMARY
 *
 * Shown on the results screen: what the run actually earned. bankRun() already computes all of it
 * (state.lastBank, state.lastTalentGain, state.bossPaid) - this only presents it.
 */

const CSS = `
#fs-sum{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:43;display:none;
  min-width:380px;max-width:min(620px,92vw);padding:18px 22px;border-radius:6px;
  background:linear-gradient(180deg,rgba(10,15,21,.97),rgba(7,10,15,.97));
  border:1px solid #2C3A47;box-shadow:0 30px 80px -30px #000;
  font:13px/1.5 ui-sans-serif,system-ui,sans-serif;color:#E8F1F8}
#fs-sum.open{display:block;animation:sumIn .26s cubic-bezier(.2,.9,.2,1)}
@keyframes sumIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
#fs-sum h3{margin:0 0 10px;font:800 12px ui-monospace,Consolas,monospace;letter-spacing:.24em;color:#FFB347}
#fs-sum .row{display:flex;justify-content:space-between;gap:20px;padding:5px 0;border-bottom:1px dashed rgba(44,58,71,.6)}
#fs-sum .row:last-child{border-bottom:0}
#fs-sum .k{font:600 9.5px ui-monospace,Consolas,monospace;letter-spacing:.18em;color:#7E93A6;align-self:center}
#fs-sum .v{font:800 13px ui-monospace,Consolas,monospace;color:#E8F1F8}
#fs-sum .v.good{color:#7CE6A8}
#fs-sum .v.gold{color:#FFD166}
#fs-sum .v.bad{color:#F2545B}
`;

export function createSummary() {
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "fs-sum";
  document.body.appendChild(root);

  function row(k, v, cls = "") {
    return `<div class="row"><span class="k">${k}</span><span class="v ${cls}">${v}</span></div>`;
  }

  function show(data) {
    const d = data || {};
    const bank = d.bank || {};
    const time = Number(d.time || 0);
    const mm = Math.floor(time / 60);
    const ss = Math.floor(time % 60);
    const rows = [
      row("TIME SURVIVED", `${mm}:${String(ss).padStart(2, "0")}`),
      row("THREATS DOWN", String(d.kills ?? 0)),
      row("XP EARNED", `+${bank.gained ?? 0}`, "good"),
      row("LEVEL", d.level != null ? `LV ${d.level}` : "—", "gold"),
      row("LEVEL UPS", `+${bank.levelled ?? 0}`, (bank.levelled ?? 0) > 0 ? "good" : ""),
      row("TALENT POINTS", `+${d.talentGain ?? 0}`, (d.talentGain ?? 0) > 0 ? "gold" : ""),
      row("ATTRIBUTE POINTS", `+${bank.levelled ?? 0}`, (bank.levelled ?? 0) > 0 ? "gold" : ""),
      row("BOSS", d.bossDown ? "DESTROYED" : "STILL STANDING", d.bossDown ? "good" : "bad"),
      row("ARENA", bank.cleared ? "CLEARED" : "NOT CLEARED", bank.cleared ? "good" : ""),
    ];
    if (bank.legendary) rows.push(row("LEGENDARY", String(bank.legendary).toUpperCase(), "gold"));
    root.innerHTML = `<h3>RUN REPORT</h3>${rows.join("")}`;
    root.classList.add("open");
  }

  function hide() { root.classList.remove("open"); }

  return { show, hide, root, get open() { return root.classList.contains("open"); } };
}
