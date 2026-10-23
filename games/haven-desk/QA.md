# The Long Lost PC — QA

## Target

- Machine: GAMEPC, Windows 11, RTX 4060 Ti 8 GB, 31.8 GB RAM.
- Browser: Chromium via Playwright 1.62.x.
- Desktop: 1600×1000; mobile: 390×844 @2x.
- Build: static files served locally on 127.0.0.1:8777; production path `chatagent.ca/games/haven-desk/`.
- Audio: external public MP3, user-initiated.

## Test matrix

| Area | Test | Expected | Result | Evidence |
|---|---|---|---|---|
| Boot | load, click boot, desk appears | no errors | PASS | Playwright |
| Icons | longlost + calendar visible, dblclick opens | window opens | PASS | screenshot |
| Intro | lost-PC hub → calendar | map opens | PASS | Playwright |
| Map | 24 records, 23 visible until secret | count correct | PASS | 23 nodes, 0/24 |
| First gate | FOUNDATION | unlock branch | PASS | solved, progress |
| Byte gate | 11100111 | 1999 solved | PASS | Playwright |
| Sequence | VOICE → BODY → ROOM | 2007 solved | PASS | Playwright |
| Minigame | START signal run | 0/12 lives shown, no errors | PASS | canvas test |
| Month | tab renders month grid | 30 cells | PASS | Playwright |
| Casebook | solved rooms/docs | cards render | PASS | 5 cards test |
| Sources | public links + audio | 6 links, 1 audio | PASS | Playwright |
| Birthday | recovery 19801231 after 1998/2026/2038 | hidden room | PASS | room + choice |
| Candle | keep/release choice | artifact + flag | PASS | first-candle |
| Saver | Off, archive, wake | themed, no errors | PASS | screenshot |
| Wire | live HF + archive fallback | status and reply | PASS | live/archive |
| Mobile | 390×844 | no page overflow | PASS | 374px windows |
| Performance | desktop UI | ≥60fps | PASS | 61–62fps |
| Forge | playtest-web job | PLAYTEST_OK | PASS | JOB-ED37AA74 |
| Forge | Blender job | FORGE_BLENDER_OK | PASS | JOB-FA651183 |
| Forge | local lore | returned docs | PARTIAL | JOB-61FF941E; stitched |
| Forge | Foundry art | image | FAIL | GPU contention/timeout |
| Forge | NVIDIA lore | returned but empty docs | FAIL | no documents in result |

## Known issues

- HF Space can echo a transcript or emit `(none)`; client filters and falls back to the archive.
- Foundry was killed after 353s because `--no-offload` plus the shared engine stalled.
- The public Signal Space instructions still describe the older LYGO 98 trail; client replaces two phrases and uses local canon for game-mechanic questions.
- No human playtest yet.
- No code signing; static site does not need an installer.

## Blockers

- None for the web slice.
- Animation/3D character volume is out of scope for this slice.

## Final Forge worker record (2026-10-23)

```text
JOB-FA651183  blender-local   FORGE_BLENDER_OK, calibration GLB
JOB-ED37AA74  playtest-web    PLAYTEST_OK, 62 fps, 0 errors
JOB-B86433CA  playtest-web    PLAYTEST_OK, 62 fps, 0 errors, final URL
JOB-61FF941E  local-qwen      returned two lore documents; stitched into 2008 + 2023
JOB-6945C090  local-qwen      timed out at old 180 s worker limit
JOB-EF60C5D6  nvidia-glm      returned metadata but no documents; not used
JOB-8C404AA5  foundry-local   failed after 353.5 s under GPU contention; not used
```

The local worker timeout is now 600 s for long-form generation. The Foundry image job was
stopped rather than allowed to hold the GPU indefinitely; the birthday image was generated
locally with Qwen-Image 2.1 instead.
