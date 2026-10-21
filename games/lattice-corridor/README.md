# Lattice Corridor

Browser campaign room for chatagent.ca. It wraps Dwasm (PrBoom+ / PrBoomX, WebAssembly) and ships Freedoom Phase 1, Phase 2, and FreeDM, plus the Lotan's Tomb fork (Jailbreak, Judgment, and the short Demonstration episode). Rules on the briefing can start a run with fast monsters, respawning monsters, cooperative item and enemy placement, or no monsters. A visitor can also load a WAD they already own, or play the 1993 shareware episode from the original `doom19s.zip` archive, extracted only in the browser.

Open `index.html` through a web server. The engine fetches `engine/index.wasm` and `engine/index.data` next to `engine/index.js`.

```
python -m http.server 8765
```

Then open `http://127.0.0.1:8765/games/lattice-corridor/` from the chatagent site root.

GPL-2.0-or-later for the page and the engine. Freedoom, FreeDM, and Lotan's Tomb data are BSD. See `SOURCE.md`.
