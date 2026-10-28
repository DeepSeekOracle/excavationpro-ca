/**
 * FORGE SMOKE — EVENT BARKS
 *
 * A speech bubble above the operator's head with a voiced one-liner, fired on beats that matter:
 * a boss walking in, integrity dropping, a close call, a streak, the boss dying, the run ending.
 * Lines are original deadpan military swagger - not quotes from anything.
 *
 * Voice: en_GB-northern_english_male-medium (Piper, local, CC0 model) rendered to WAV in assets/voice.
 */

const LINES = {
  boss_spawn: "Big one coming. Pick a god and pray.",
  boss_hit: "That's a boss. Bring a bigger gun.",
  low_health: "I'm leaking. Not ideal.",
  close_call: "That was close. Do it again and I'm billing you.",
  kill_streak: "Ten down. Keep 'em coming.",
  boss_kill: "Big one's down. Somebody get a mop.",
  clear_dead: "Arena's clear. I'm taking a shower.",
  died: "Well. That happened.",
  upgrade: "Upgrade accepted. Try to keep up.",
  reload: "Reloading. Cover me, if you can.",
  shield: "Shielded. Shoot it with something that goes bang.",
  last_stand: "Just me and the rain. Perfect.",
};

/** Per-event cooldown (ms) so a bark cannot machine-gun, plus a global floor. */
const COOLDOWN = {
  boss_spawn: 999999, boss_kill: 999999, clear_dead: 999999, died: 999999,
  low_health: 18000, close_call: 12000, kill_streak: 15000, upgrade: 8000,
  reload: 20000, shield: 10000, last_stand: 30000, boss_hit: 20000,
};
const GLOBAL_FLOOR = 4500;

const CSS = `
#fs-bark{position:fixed;z-index:42;transform:translate(-50%,-100%);pointer-events:none;
  max-width:300px;padding:9px 13px;border-radius:10px;
  background:linear-gradient(180deg,#F6E7C8,#E4C892);color:#211a10;
  border:2px solid #2A2118;box-shadow:0 12px 28px -12px rgba(0,0,0,.9);
  font:600 13px/1.35 ui-sans-serif,system-ui,sans-serif;
  opacity:0;transition:opacity .16s,transform .16s}
#fs-bark.on{opacity:1;transform:translate(-50%,-100%) translateY(-4px)}
#fs-bark:after{content:"";position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);
  width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;
  border-top:10px solid #2A2118}
#fs-bark:before{content:"";position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);z-index:1;
  width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;
  border-top:8px solid #E4C892}
`;

export function createBarks() {
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  const el = document.createElement("div");
  el.id = "fs-bark";
  document.body.appendChild(el);

  let lastAt = 0;
  let hideAt = 0;
  const stamps = {};
  let current = null;

  function place(x, y) {
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(y - 46)}px`;
  }

  function trigger(event, opts = {}) {
    const text = opts.text || LINES[event];
    if (!text) return false;
    if (!opts.force) {
      const now = Date.now();
      if (now - lastAt < GLOBAL_FLOOR) return false;
      const cd = COOLDOWN[event] ?? 12000;
      if (now - (stamps[event] || 0) < cd) return false;
      stamps[event] = now;
      lastAt = now;
    }
    current = event;
    el.textContent = text;
    el.classList.add("on");
    hideAt = Date.now() + Math.max(2600, text.length * 55);

    if (opts.voice !== false) {
      try {
        const a = new Audio(`./assets/voice/${event}.wav`);
        a.volume = 0.9;
        a.play().catch(() => {});
      } catch (e) { /* audio is optional */ }
    }
    return true;
  }

  function update() {
    if (hideAt && Date.now() > hideAt) {
      el.classList.remove("on");
      hideAt = 0;
      current = null;
    }
  }

  function hide() {
    el.classList.remove("on");
    hideAt = 0;
    current = null;
  }

  return { trigger, place, update, hide, el, get current() { return current; }, LINES };
}
