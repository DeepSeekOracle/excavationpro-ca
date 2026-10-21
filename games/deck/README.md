# Arcade Deck — `/games/deck/`

Console view of the arcade. One card per live title, a featured stage with
preview, category filter, search, keyboard and gamepad navigation, and a
theater modal that embeds the game in an iframe with a "Pop out" escape hatch.

## Files

| File | What it is |
| --- | --- |
| `index.template.html` | Hand-edited source. `{{CARDS}}`, `{{PILLS}}`, `{{COUNT}}`, `{{HALL_COUNT}}`, `{{DATA}}`, `{{JSONLD}}` are filled by the builder. |
| `build_deck.py` | Reads `/games/catalog.json`, merges the `EXTRAS` presentation table, writes `index.html`. |
| `index.html` | **Generated — do not hand-edit.** Regenerate after any catalog or template change. |
| `deck.css` | Self-contained dark console skin (this page does not load `/assets/site.css`). |
| `deck.js` | Hero, filter, search, keys, gamepad, theater, ledger ticker, catalog reconcile. |
| `og-deck.jpg` | 1200×630 social card. |

## Add a game

1. Add it to `/games/catalog.json` with `status: "live"`, `href`, `cover` and a
   `links[0]` entry if it has a hall.
2. Add an `EXTRAS` entry in `build_deck.py` (category pill, badge, tech chip,
   glow colour, one-line copy). Without it the build still works, using
   `genre[0]` and the catalog blurb.
3. `python games/deck/build_deck.py` and commit both `index.html` and the
   source change.

The page also reconciles at runtime: it re-fetches `/games/catalog.json` and
appends any live title it does not already render, so a new game appears even
before the deck is rebuilt. The rebuild is still what gives it curated copy.

## Verify

    python games/deck/build_deck.py --check     # fails if index.html is stale
    node --check games/deck/deck.js
    # serve the repo root and open http://127.0.0.1:<port>/games/deck/

Check: 18 cards, pill counts (strategy 6, racing 2, action 5, cards 2, sports 3),
`/` focuses search, arrows move the featured title, Enter opens the theater,
Esc closes it, no console errors.

## Things that bit us

- The JS looks up `#games-grid`; renaming that id silently disables every
  filter and pins the counter at 0.
- `.game-card` is `display:flex`, which beats the `hidden` attribute — the
  `[hidden]` rule in `deck.css` is what makes filtering work.
- The hero overlay is taller than a fixed-height stage on small screens; the
  mobile rule uses `height:auto` so the badges do not clip.
