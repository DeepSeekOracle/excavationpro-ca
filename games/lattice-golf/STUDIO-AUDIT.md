# Lattice Golf — Studio Audit

**Build:** `index.html` (game.js v37 · game.css v25 · golf3d.js v18)
**Scope of this pass:** coarse layout, first-time legibility, and a graphics floor — the skeleton
(2.5D course renderer, club puzzle gameplay, campaign/live/endless modes) was sound and stays.

---

## 1. What was actually wrong

Found by playing the shipped build at full window size and reading the renderer, not by reading
the design notes.

| # | Finding | Root cause | Fix |
|---|---------|-----------|-----|
| 1 | The whole course read as **near-black ink with one green ribbon** | the turf materials multiplied an already dark procedural map (`tex.grass` ≈ rgb 28/62/32) by a dark tint (`th.grass` 0x2a4a30) → final albedo ≈ 0.02–0.07. Only the fairway ribbon (`0x5ec46a`) survived. | lifted every turf texture to real grass values and moved the per-course tint to ~0.8 white (`th.turf/roughT/cutT`); hemi 0.72 → 0.95, ambient 0.22 → 0.34, exposure 1.08 → 1.14 |
| 2 | Water was a **flat dark disc** | `tex.water` was generated (and its UV offset animated every frame) but **no mesh ever used it** — the water meshes had a plain colour material | wired `tex.water` into the water material (repeat 4×4), raised albedo, added sheen (roughness 0.2 / metalness 0.12) and a lighter basin |
| 3 | Floating HUD text **vanished over bright turf** | `.hint` / `.keys` were bare text with a text-shadow, fine over black, unreadable over grass | every viewport label sits on a glass plinth (border + blur + shadow) |
| 4 | Shot result was **only in the rail log** | nothing surfaced the outcome where the player is looking | new `#shotChip` — tone-coded result plate over the course: `CUP`, `WATER`, `OUT OF BOUNDS`, `TREES · BALL STOPS`, `268 yd · FAIRWAY`, `ON THE GREEN`, with club / power / roll / distance to pin |
| 5 | Title screen was a **one-column wall**: radios, stream links, name, 6 golfer cards, 8 mode cards, donate row in one 480px scroll | single undifferentiated `.title-panel` | hero + four labelled sections (`Operator` · `Choose golfer` · `Courses` · `Ways to play`) and a footer row |
| 6 | Art panel showed a **cropped “ATTICE”** | title art `object-position: 38% center` on a column narrower than the image ratio | `object-position: 50% 30%`, wider art column |
| 7 | Hero content sat **below the fold on any long panel** | art column stretched to the panel's full height, so a bottom-anchored overlay landed off-screen | art column is now `position: sticky; height: 100vh; align-self: start` — the art holds while the picker scrolls |
| 8 | Club list gave **no sense of distance** | ten identical text rows | each club row carries a carry bar (`--bar` set in `paintClubs()`), gold when selected |
| 9 | Radio cluster was an **unlabelled strip of Play/Next/Mute + a running title** jammed against the dock | `.radio-inline` had no grouping | grouped into one bordered chip with a truncating title |
| 10 | No reason to replay a course | `save.rounds` / `save.bestHole` were written but never shown on the title screen | records surfaced: hero strip (last card / best / lifetime) and a per-course `best +2 · 38 strokes · 3 rounds` chip |

## 2. What changed, file by file

**`golf3d.js`** — graphics floor
- `makeTextures()`: grass / rough / fairway / green / sand / water lifted out of ink range; fairway keeps its mow stripes and edge falloff, green keeps its rotation stripes.
- `themeOf()`: every course now carries its own turf set — `turf`, `roughT` (first cut), `cutT` (approach), `fairTop`, `greenTop`, plus a brighter `pine`. Singularity Nine stays a dusk palette rather than becoming daylight.
- `rebuild()`: rough / first-cut / fairway / green materials read those tints; ground plane unchanged (same tint key).
- Water: textured, sheened, lighter basin.
- Lighting: hemisphere + ambient + exposure raised; ball radius 0.16 → 0.24 so it reads at hole-fit zoom.
- Untouched: hole geometry, `heightAt`, camera/orbit maths, OOB stakes, bunkers, cart paths, trees, ghosts, picking.

**`game.js`** — loop and feedback
- `flashResult(tone, main, sub)` + hooks on all four shot outcomes (cup / water-or-OOB / trees / carry).
- `paintClubs()`: per-club carry bars.
- `menuRecords()`, `bestRoundFor()`, `roundsFor()`, `fmtPar()`, `recChip()` — records read from the existing `save.rounds` / `save.bestHole`; nothing new is persisted.
- `menu()`: rebuilt markup (hero + sections), keeping every id (`nm`, `menuRadio`) and data attribute (`data-cast`, `data-go`) so the existing overlay click handler and key handler are untouched.

**`index.html`** — `#shotChip` element; shortened the keys line; cache-busts `game.css?v=25`, `golf3d.js?v=18`, `game.js?v=37`.

**`game.css`** — one appended “Studio pass” block (plus a narrow-screen section) that overrides by source order: glass plinths, chip-style HUD meta, the power bar turned into a single bottom control bar (readout chip + slider), sectioned glass rail panels, title screen hero/sections/records, clamped lore lines, 3-up golfer cards.

## 3. Verification

- `node --check` clean on both edited scripts.
- Live local playthrough (`http://127.0.0.1:8791/games/lattice-golf/`): menu → Pine Haven 9 → shot → chip, `errs: []` at every step.
- Shot feedback observed end to end: `220 yd · FAIRWAY / Driver 75% · roll 11 yd · 464 yd to pin`, and the rail log line agreeing (`Driver 75% → 220.3 yd carry + 11 yd roll · fairway → fairway`).
- Records path exercised with a seeded save: hero read `Pine Haven Championship · +5 (41 over 9)` / `Best Coral Lattice Links · +2 (38)` / `Lifetime 7 rounds · 36 holes walked`; course chips read `best +5 · 41 strokes · 1 round`, `best +2 · 38 strokes · 1 round`, `no card saved yet` for unplayed courses.
- Before/after captures: `lg-hole1.jpg` (ink course) → `lg-hole2.jpg` (turf + water + trees), `lg-menu2.jpg` → `lg-menu3.jpg` (wall → hero + sections).

## 4. Open items (not done, on purpose)

- Scorecard sheet and the live-match rail keep their previous styling; they were legible and the pass was scoped to the round loop and the title screen.
- The 2D fallback path (`use3d === false`) keeps its original palette: the same albedo reasoning applies, but it is not the shipped path.
- `--bar` carry bars are proportional to the longest club, not to the current club's *usable* range from the ball's lie; the caddie panel remains the authority on that.
- No automated harness exists for this game (unlike `tools/haven_rally_qa.js`); verification was browser-driven.

## 5. Landing

Committed locally only. Nothing pushed — per standing rule, this waits on an explicit ask.

---

# Phase: maths pass (putting, aiming, par)

## 1. What was wrong (measured, not guessed)

The graphics were fine; the arithmetic behind them was not. Every number below was read
off the running game through a throwaway debug copy of `game.js` (deleted before commit).

- **The aim marker pointed backwards.** `nextAim()` returned *the first waypoint more
  than 36 yd away*. The moment the ball passed the first corner, that corner was still
  >36 yd away, so the gold marker snapped behind the ball and the default shot line led
  back down the fairway. Measured on Pine Haven 1: from 41% of the hole onward the marker
  sat 453 yd from the pin (the tee-side elbow) while the ball was 393 yd out. Par 3s hid
  it — a one-leg hole only ever aimed at the pin.
- **Par was unmakable.** Pine Haven 1 read `Par 4 · 751 yd`; Twin Pines read par 5 at 1052
  yd. A 751 yd par 4 needs three perfect 250 yd shots *plus* two putts to make bogey, so
  every card ran +2…+5 and the campaign rival (`par ± 1`) could never be beaten. The
  endless generator authors par 4 at 350–450 and par 5 at 510–610, so the authored courses
  were contradicting the game's own doctrine.
- **The putter had no weight to judge.** `intendedCarry()` measured the putter off the
  *marker distance*, and the marker parks on the cup — so 100% power was always exactly the
  distance to the pin. A pin-seeking magnet nudged the ball toward the cup, the "cup" was a
  1.2 yd radius, and the roll sim dropped a ball that so much as passed within 2 yd of the
  pin. Putting was: aim at the flag, drag to 100%, press space.
- **A putt did not travel what the bar said.** The roll used the stated distance as an
  initial *velocity*, so the surface divided it: a 12 yd putt from the fringe rolled 2.1 yd
  on the fairway and a 38 yd putt from the rough travelled 8.7 yd on a 33 yd readout.
- **Cosmetic arithmetic.** The static HUD shipped `75% · 273 yd` and `220 yd` next to a
  driver whose 75% shot is 218 yd; the club rail said the putter ran "to marker"; Marsh Pin
  (248 yd) told the player to hit a 4-iron that carries 220.

## 2. What changed

**`game.js` — model**
- `nextAim()`: find the leg the ball is standing on, then aim at the next corner past it;
  past the last corner the pin is the aim. `landingCount()` / `parOf()` keep the authored
  par inside the real-golf bands (3→250, 4→480, 5→700) and otherwise score the routing:
  one club per landing plus two putts, capped at 7. `worldHole()` returns the derived par;
  `cardRows()` reads it too, so an unplayed row and a played one agree.
- Putting: `CUP` 1.2 → **0.55**, `GIMME` 2.0 → **1.1**, new `LIP` 1.2. `simulateRoll()`
  now captures on line *and* slow (`v <= LIP * mu`), so a blown putt lips out and keeps
  running; the roll step is 0.35 yd so a dead-on putt cannot hop the cup. The pin magnet is
  gone, replaced by one seeded tilt per green (`hole.break`) that curves a rolling ball on
  the green only.
- `rollSpeedFor()`: roll distance is the area under the friction curve, so the speed that
  stops a ball exactly `want` yards is the sum of `mu` along *that line* — sampled every
  half yard, so the collar is not counted as green. A stated 12 yd putt from the fringe now
  rolls 12 yd instead of 23.
- The putter reads like every other club: power × 40 yd roll, honoured on any lie. The
  marker is the line. `dialPutt()` hands the player a putt already dialled to the cup when
  they arrive on the green, so the skill is the read, not the arithmetic.
- `shotHolesOut()` is the flight test only — a putt never uses it, because a putt rolls.
- `puttRead()` feeds the caddie panel: `Break 0.2 yd right · on the cup line`, computed over
  the stretch that actually runs on the green.

**`index.html`** — static HUD numbers corrected to the model (`75% · 218 yd`, `chip`),
`game.js?v=41`.

## 3. Verification

- **`tools/golf_sim_check.js` (new, headless, permanent).** Loads the game module in a `vm`
  with stubbed globals and asserts, over all 27 authored holes, the Haven Open 18 and 200
  generated holes: par inside 3..7, par makeable (`ceil(straight/290) + 2 <= par`), authored
  bands respected, the aim marker always ahead, and on five real greens: the stated putt
  distance honoured (green, fringe, rough), a short putt missing, a dialled putt dropping, a
  putt blown 60% past lipping out, and the caddie's break matching the roll (magnitude and
  side). Latest run: **10383/10383 checks green.** Cards it reports: Pine Haven par 47 ·
  5639 yd, Coral Lattice par 47 · 5876 yd, Singularity Nine par 47 · 5649 yd.
- **Live local playthrough** (`http://127.0.0.1:8791/games/lattice-golf/`, no debug hook):
  card reads `Par 6 · 751 yd`; after the drive the marker is 204 yd away with the pin 464
  yd away (ahead, where it used to point back at the tee); a dialled 10 yd putt drops for
  `CUP · 2 strokes · par 6 · -4`; the scorecard sheet shows the full card — 751/218/1053/…,
  par 6/3/7/6/3/6/7/6/3 = 47, 5638 yd.
- `node --check` clean on `game.js`; `window.__lg` absent from the shipped file.

## 4. Open items (not done, on purpose)

- The authored 9s are long walks — a card par of 47 over 5639 yd, every hole 6/7 except the
  three par 3s. That is now *honest* (one club per landing + two putts), not short: the
  alternative was shrinking the routing, which would collapse the landings the marker
  doctrine and every hint are written around. Shortening them is a design decision, not a
  maths fix.
- `rollSpeedFor()` samples the line rather than solving for the final lie, so a putt whose
  line crosses three surfaces can still land a few tenths of a yard off its stated distance.
- The break is one plane per green (no two-tier or ridge read).

## 5. Landing

Committed and pushed on the steward's explicit ask.

## 6. Superseded

- "No automated harness exists for this game" — superseded: `tools/golf_sim_check.js`.

