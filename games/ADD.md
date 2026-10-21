# Add a game to the arcade

The arcade is driven by `catalog.json`. HTML pages that list titles read that file.

## Checklist

1. Create a playable folder: `/games/<slug>/index.html` (relative assets inside that folder).
2. Add a 1200×630 cover at `/games/<slug>/og.jpg` (or `assets/og.jpg`).
3. Append one object to `games` in `catalog.json`:
   - `id` / `slug` matching the folder
   - `status`: `"live"` when playable, `"coming"` for a teaser card
   - `href`: `/games/<slug>/`
   - `featured`: `true` to also show on the homepage
   - `order`: lower numbers first
4. Add `<loc>https://excavationpro.ca/games/<slug>/</loc>` to `sitemap.xml` (and the eternalhaven sitemap if mirrored).
5. On the game page, put **All games** in the header, footer, or title menu — not a floating overlay. HTML5 titles: `<a class="games-mini" href="/games/">All games</a>` in the header plus a footer/menu link. Bundled (Vite) titles: a `.games-chrome` bar in `index.html` plus `/games/hub.css`.

6. Mirror the folder + catalog to eternalhaven when the title ships on both hosts.
7. Leave `slot-next` in the catalog (or replace it) so the arcade always shows an open slot.
8. Wire the title to the live board: POST finishes through `arcade-ledger.js` to `POST /arcade/submit` with `{ "game": "<slug>", ... }`. The Space writes the per-game file and snapshots `arcade.json` on the HF dataset. Add `ledger.html`. List the title in `catalog.json` and `/games/live.json`. Hub + `/games/board.html` read `arcade.json` (dataset first, Space second). New games grow the board without a new Space.

Do not put secrets, tokens, or PayPal credentials in game folders.
