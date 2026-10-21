# Engine source

Lattice Corridor ships a WebAssembly build of [Dwasm](https://github.com/GMH-Code/Dwasm) 2.2.0, Gregory Maynard-Hoare's browser port of PrBoom+ and PrBoomX.

- Upstream: https://github.com/GMH-Code/Dwasm
- Commit the live binaries were taken from, by build date 17 April 2026: `ddf0347a4fc115b11ffb1c5710768b7c47c46698`
- License: GNU GPL-2.0-or-later. Full text is `COPYING` in this folder.
- Files: `engine/index.js`, `engine/index.wasm`, `engine/index.data` (includes `prboomx.wad` and the default config), `engine/oly.js`, `engine/oly.css`
- Archive reader used only to open the original shareware zip in the browser: `engine/libarchive.js`, `engine/libarchive.wasm`, `engine/worker-bundle.js` (Apache-2.0, Copyright 2019 Google LLC)

The page shell (`index.html`, `corridor.css`, `corridor.js`) is also GPL-2.0-or-later, so it can sit in the same tree as the engine.

Freedoom Phase 1, Phase 2, and FreeDM are `wads/freedoom1.wad.gz`, `wads/freedoom2.wad.gz`, and `wads/freedm.wad.gz`, Freedoom 0.13.0, BSD. See `FREEDOOM-COPYING.txt`. FreeDM is the project's 32-map deathmatch IWAD from https://github.com/freedoom/freedoom/releases/download/v0.13.0/freedm-0.13.0.zip.

Lotan's Tomb is a BSD fork of Freedoom: `wads/lt1.wad.gz` (Phase I, Jailbreak), `wads/lt2.wad.gz` (Phase II, Judgment), and `wads/ltdemo.wad.gz` (Demonstration). The build packed here is the 2026-09-30 pre-build from https://lotanstomb.rip/lt-betabuild.7z. See `LOTAN-COPYING.txt`. The page does not use the Freedoom or Lotan's Tomb names to endorse this site.

This page does not include `doom1.wad` or any registered id Software WAD. Shareware play downloads the unmodified `doom19s.zip` archive into the browser from https://gmh-code.github.io/dwasm/doom19s.zip and extracts it in memory.
