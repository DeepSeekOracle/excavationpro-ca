# The Long Lost PC — Technical Spec

**Profile:** Web 2D / static desk  
**Host:** static HTML/CSS/JS in `games/haven-desk/`  
**Engine:** existing LYGO 98 desk, no framework, no build step.

## Architecture

```text
index.html
  desk.js        host shell, windows, icons, player, saver
  desk-more.js   extra desk apps (chat, calendar placeholder, etc.)
  desk-lore.js   existing public LYGO trail
  veil-data.js   24 date-room records, documents, links, gates
  veil-lore.js   accepted Forge worker documents, stitched
  veil.js        calendar / map / dossier / gates / minigame
  veil-chat.js   live HF Wire + local archive
  veil.css       temporal theme + remastered saver
```

The new layer **registers** files and app mounts through `window.HavenDesk`; it does not replace the host desk.

## Data

`window.VEIL_DATA.days[YYYY-MM-DD]`:

```text
title, act, kind, x, y, tone, image
epigraph, summary, body[], docs[], real[], links[], music
gate { kind, label, question, answer, hint, success, unlocks[] }
game { target, seconds }   // 2019 only
```

Save under `localStorage["haven-desk-v1"]`:

```json
{
  "veil": {
    "seen": true,
    "solved": {"1998-03-14": {"at": "..."}},
    "unlocked": {"1998-03-14": true},
    "flags": {"birthdayFound": true, "birthdayChoice": "keep"}
  }
}
```

No server-side account. A save is local to the browser.

## Input

- Double-click desktop icons (host behavior).
- Mouse/touch for map, tabs, gates, month.
- Code gate: keyboard.
- Byte gate: button toggles.
- Sequence gate: buttons, strict order.
- Packet minigame: Arrow/A-D or on-screen pads; canvas focus.
- Screensaver: any pointer/key wakes the desk.

## Audio

- External `chatagent.ca/signal/audio/*.mp3` via `<audio controls>`.
- No autoplay; user presses play.
- Existing host Hearth Player is untouched.
- No downloaded media in the repo.

## Rendering / performance budget

- Target 60fps; measured 61–62fps on the test desktop.
- No WebGL, no web fonts, no heavy framework.
- One generated hero JPEG (74 KB) + host assets.
- Map: SVG lines + DOM nodes; 24 rooms.
- Minigame: one 480×260 canvas, capped dt.

## Compatibility

- Chromium, Firefox, Safari current.
- Mobile 390×844 tested; no page-level horizontal overflow.
- `prefers-reduced-motion` lowers saver motion and disables decorative breathing.

## Public links / privacy

- Links open in new tab with `rel="noopener"`.
- No analytics, no token, no private data in chat.
- The Wire sends only the player's text and Lin's prior lines to the public HF Space.

## Test hooks

- `window.HavenDesk` — open/register/addFile.
- Playwright: boot → close readme → double-click longlost → calendar → gate.
- Forge workers: `playtest-web`, `triposr-local`, `blender-local`.

## Build / packaging

Static. No npm, no bundler. Serve `games/haven-desk/` from any HTTP origin. Deploy via the existing `chatagent.ca` Git/Pages flow; do not copy unrelated Signal changes.

## Risks

- HF Space model can echo the prompt; client trims/falls back to archive.
- localStorage can be cleared; no cloud save.
- Generated hero image has no semantic alt; alt text must describe the desk.
- Large content map needs a content budget per room to stay readable.
