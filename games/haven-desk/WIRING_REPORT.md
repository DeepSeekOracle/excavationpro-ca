# Haven Desk — Story Wiring Report

**Date:** 2026-10-23  
**Status:** partial integration, not complete  
**Source of truth:** `ACCEPTANCE.json`

## Wired

- `veil-story-manifest.js` generated from Forge outputs.
- `veil-story.js` reads the manifest and sets dossier hero images.
- Hero selection is now deterministic:
  - `scene` first;
  - then `object`;
  - then `afterimage`;
  - then `document`;
  - then `future`.
- This gives every date with **any** validated image a hero, not only dates with a finished `scene` pass.
- `veil-gallery.js` reads the same manifest. With all 60 dates solved, the Journal renders every manifest entry as a card.
- The legacy SVG plates remain a fallback only when no story manifest exists.

## Measured

```text
Manifest entries:        257
Story files:             257
Missing files:           0
Wrong dimensions:        0
Blank images:            0
Duplicate hashes:        0
Dates with any image:    54 / 60
Dates with all 5 passes: 40 / 60
Pass counts:
  scene:       42
  object:      52
  afterimage:  53
  document:    53
  future:      53
```

Dossier gap:

```text
1985-11-20
1988-11-02
1993-04-22
2014-06-10
2015-12-11
2016-03-10
2018-06-11
2019-06-01
2029-04-04
2036-09-09
2044-11-05
2045-09-01
```

Only 6 dates have **no** image at all; the list above includes dates with at least one fallback pass.

## Browser QA

Command run against `http://127.0.0.1:8777/`:

```text
Manifest entries:  257
Solved dates:      60
Journal cards:     257
Journal images:    257
Broken images:     0
Page errors:       0
```

The test set all 60 dates solved and opened the Photo Journal. It confirmed the Journal renders the full manifest, not a locked subset.

## Acceptance

`update_acceptance.py` now measures the actual game files, not the queue's `done` count.

```text
story_images:            257 / 300
photo_journal_photos:    257 / 300
starter_backgrounds:     5 / 5
dates_complete:          true
images_complete:         false
photo_journal_matches:   false
levels_are_authored:     false
copy_pass_complete:      false
full_playthrough:        false
```

## Not wired

- **Lore bot output:** `lore-content.json` contains model-empty responses, not usable lore. It was deliberately not wired.
- **Six storyless dates:** no fabricated images were added; they need Forge renders.
- **3,000-level authored gate:** still false; levels remain templated.
- **Copy audit:** still false.
- **Publish:** still false.

## Rules held

- No hand-built image substitutes.
- No SVG plates counted as story images.
- No failing or blank image entered the game.
- No lore text with errors entered the game.
- No publish action taken.
