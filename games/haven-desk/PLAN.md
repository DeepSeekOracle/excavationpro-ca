# The Long Lost PC — Plan

## Phase

**Playable vertical slice shipped as a static web game.** Content expansion is date-room based.

## Current work

- 60 recovered anchors.
- One hidden private room (1980-12-31).
- Calendar map, month, casebook, sources.
- Four gate types + packet minigame.
- Live HF Wire with local archive fallback.
- Remastered idle screen saver.
- Generated desk hero + generated candle-room art (in progress/if present).

## Milestones

| Phase | Gate | State |
|---|---|---|
| Intake | brief | done |
| Concept | loop/pillars | done |
| Design | GDD | done |
| Art | bible/assets | done |
| Tech | spec/budget | done |
| Slice | playable | done |
| Production | 60 anchors / 3,000 strata / 50 cabinets / 300 plates | done |
| QA | verified | web pass |
| Release | pushed | pending final test |

## Next content blocks

1. Add 6–8 rooms around the public `Eternal Haven` books and music catalogue.
2. Add a second minigame: a calendar-cipher lock with real date arithmetic.
3. Add a "signal room" visualizer tied to the public MP3 (no copied audio).
4. Add a **Casebook export** to a downloadable `.txt` dossier.
5. Add a **New Game+** timeline that reveals the 1980 room's other choice.
6. Add a small 3D artifact viewer for the Blender calibration GLB (optional).

## Rules

1. Every room needs: story, one document, one gate, one real link or explicit fiction label.
2. No room may require an external walkthrough for its own clue.
3. Public facts stay linked; private scenes stay labeled fiction.
4. Test the first 10 minutes after every content block.
5. Do not push unrelated Signal changes with a game commit.

## Release state

- 24 date rooms, hidden 1980 room, five gate types, map/month/casebook/sources.
- Generated desk + birthday hero images.
- Local lore from Forge stitched; NVIDIA/Foundry failures documented.
- Final Forge playtest: 62 fps, 0 errors.
