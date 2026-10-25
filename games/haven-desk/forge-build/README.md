# Haven Desk story + image pipeline

These are the scripts that produced the live story layer. They are copies of the
working files in `D:\LYGO\asset-foundry\packs\haven-desk\build\` so the build is
reproducible from the repository.

Paths are absolute on purpose: the pack, the accepted scenes and the Forge all
live under `D:\LYGO\asset-foundry\`, and the game lives in this repo.

## Order of operations

1. `forge_install.py` — reads `story/inbox/*.json`, runs the hard gate, writes
   `story/accepted/<date>.json`. Nothing reaches the game without passing.
2. `make_batch.py <file.txt>` — turns a plain-text scene file (`### DATE`, one
   paragraph per line) into `story/inbox/<name>.json`.
3. `forge_story.py` — the pack's story model, bible loader, gate and day index.
   `forge_install.py` imports it.
4. `reconcile_images.py` — adds a Photo Journal manifest entry for every story
   image on disk, then verifies size, aspect and non-flatness.
5. `fill_parallel.py` — renders missing plates through the NVIDIA FLUX endpoint.
   Prompts are sanitized first: FLUX returns a pure black frame for prompts that
   contain brand strings, colons or quotes, which is what made the Forge look
   broken. Four threads, two seeds, then a plain fallback.
6. `verify_story_images.py` — checks the 60 x 5 grid against the manifest.
7. `playthrough.js` — loads `index.html` in jsdom as a browser, unlocks the
   calendar, clicks all 60 map nodes and reads the rendered dossier back.
   Requires `npm install jsdom`. Last run: `playthrough-report.json`
   (60/60 dates, 740–939 words, 0 JS errors).

## Gate

740–1150 words, 8+ paragraphs, 40-word paragraph floor, no em or en dashes, no
banned phrases (`not just`, `prompt`, `player`, `narrative`, `significance`,
`testament`, `the weight of`), no repeated paragraph opening word, dialogue
required, no markdown, no placeholders.

## Deploying

The live site builds from `origin/main`. `home-full` is a separate line and does
not deploy. Pushing to main takes about two to three minutes to appear.

## Why the old Forge failed

The watcher, supervisor and three duplicate queue workers all wrote the same
generated files, so `veil-story-manifest.js` was rewritten under the editor and
hand-added entries vanished. Separately, the image provider silently returned
blank frames for prompts containing brand names or punctuation that look like
prompt syntax, and the queue retried those requests forever. The workers were
stopped, the prompt bug was proved with controlled requests, and both fixes are
in `fill_parallel.py`.
