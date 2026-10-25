# Haven Desk — Goals and Scope

**Status:** incomplete  
**Source of truth:** `ACCEPTANCE.json`  
**Game:** *Haven Desk: The Long Lost PC*  
**Runtime:** static browser game under `games/haven-desk/`

---

## 1. Product goal

Build a deep, finished time-travel adventure that a new player can sit down and play without the interface explaining that it is a game.

The player starts at a warm 1998 PC, discovers a calendar whose dates are rooms, solves gates, recovers images, and reaches the private 1980 room and the 2045 ending. The game must feel like a recovered machine, not a demo of one.

### Product pillars

1. **The desk is the interface.** Files, folders, chat, audio and dates are presented as objects on a 1998 machine.
2. **Every date is a room.** A date is not a page of exposition; it is an image, a document, a gate and a consequence.
3. **The archive is visual.** Every date has a canonical scene and four additional visual passes.
4. **The room remembers.** Username, password, theme, wallpaper, solved dates and the candle choice persist.
5. **No build voice.** No legal disclaimers, provider notes, worker labels, “this is a game” copy or prompt explanations in player-facing text.
6. **No dead ends.** A locked room names what opens it; a solved room leaves a record; the journal reflects the archive.

---

## 2. Forge goal

The Forge is the only execution path for generated game content. It must be able to produce, validate, record and integrate content without hand-made substitutes.

### Forge responsibilities

- Compile prompts from a style contract.
- Queue jobs with stable names and seeds.
- Route each job to a provider.
- Validate every artifact before acceptance.
- Record job id, provider, seed, hash, dimensions and output path.
- Sync accepted artifacts into the game manifest.
- Update the acceptance counts from measured artifacts, not hand-written numbers.
- Fail visibly; never write a bad image or claim a missing one.

### Forge components

```text
D:\LYGO\asset-foundry\
  contracts\haven-desk.json        style/palette/negative contract
  forge.py                         CLI, prompt compiler, queue, providers
  nvidia_image.py                  NVIDIA FLUX provider
  queue\jobs.json                  NVIDIA queue
  queue\jobs-qwen.json             Qwen queue
  packs\haven-desk\raw\            provider output
  packs\haven-desk\build\
    queue_300.py                   creates the 300 story jobs
    sync_story.py                  validates + writes game story JPGs
    sync_backgrounds.py            writes starter/birthday backgrounds
    update_acceptance.py           measures both queues
    watch_forge.py                 continuous sync loop
```

### Provider policy

| Provider | Work | Reason |
|---|---|---|
| **Qwen 2.1 local** | Selected canonical scene passes | Best local atmosphere; slower |
| **NVIDIA FLUX.1 Dev** | Remaining variant passes | ~5–11s per render; free API |
| **Stream PC Qwen** | Text/content assistance only | GTX 1060 6 GB; cannot host Qwen Image 2.1 |
| **Stream PC NVIDIA** | Optional second image worker | Cloud API; no image model install needed |

A job may fail over to Qwen when NVIDIA returns a blank frame. A blank frame is never accepted.

### Queue rules

- One worker per queue file.
- Separate locks: `jobs.worker.lock`, `jobs-qwen.worker.lock`.
- A worker must re-read the queue before saving a finished job.
- No direct `generate_image.ps1` calls outside Forge.
- No hand-copied image substitutes.
- A job is accepted only when:
  - the queue says `done`;
  - the output file exists;
  - dimensions are `1024×576` or `1344×768`;
  - luminance mean ≥ 5 and standard deviation ≥ 4;
  - the sync writes the game JPG and manifest entry.

---

## 3. Scope — in

### 3.1 Story and dates

- **60 authored dates**: 24 core + 36 atlas.
- Each date has a title, summary, body, epigraph, gate, document(s), public links where relevant.
- Dates 1969–2045, with the private 1980 room and the 2045 Deadman/Lightfather chapter.
- No player-facing build/legal/meta copy.

### 3.2 Story images

- **300 actual story images**: 60 dates × 5 passes.
- Passes: `scene`, `object`, `afterimage`, `document`, `future`.
- The `scene` pass becomes the room hero.
- All five passes feed the Photo Journal.
- Images are generated through Forge, validated, and written to `assets/story/<date>/`.

### 3.3 Photo Journal

- Displays **300** story images, not abstract SVG plates.
- Locked images name the date that opens them.
- Unlocked images can be set as the desktop field.
- Current field persists across reload.

### 3.4 Starter desktop and onboarding

- Five Forge-built starter backgrounds:
  - desk
  - signal
  - packet
  - corridor
  - archive
- Birthday room uses a Forge-built 1980 candle image.
- Forced first-run setup: username, mock password, wallpaper, palette, enter desktop.
- Three failed password attempts trigger the 1998 crash screen; reset always proceeds.

### 3.5 Arcade and archive

- **50 playable cabinets**.
- **3,000 deep-archive strata**.
- Strata must eventually be authored content, not only a capped/templated count.
- Echoes and arcade remain in-world; no “filler” or mechanics-explainer copy.

### 3.6 Audio and Open Mic

- 88 voice/sound clips.
- 10 Open Mic tapes with transcripts.
- No autoplay copy; audio is user-triggered.

### 3.7 Copy

- In-world voice throughout:
  - README
  - setup
  - intro
  - app empty states
  - folder descriptions
  - gates
  - dates
  - journal
  - errors
- No “unofficial”, “not affiliated”, “local account”, “no third-party imagery”, “worker”, “generated locally”, “this window is the game”, or legal disclaimers inside the game.

### 3.8 Quality and QA

- Fresh-profile onboarding completes.
- All desktop apps open.
- Calendar, dates, gates, journal, arcade and echoes are usable.
- Mobile layout is checked.
- No console errors except known third-party ad/CSP noise.
- Full playthrough from 1998 to 2045.
- No publish until all acceptance gates are true.

---

## 4. Scope — out

- 3D, Unity, multiplayer, VR.
- Real private data, real mail, real credentials.
- Paid APIs or paid asset services.
- Auto-publishing to GitHub, social, or hosting without explicit approval.
- Claiming Qwen Image 2.1 is running on the stream PC; its 6 GB card and missing weights do not support that.
- Treating the stream copy bot as an image worker.
- Treating the 300 abstract SVG plates as the 300 story images.
- Treating a hard-coded “3000” cap as 3000 authored levels.

---

## 5. Milestones and gates

### M0 — Manifest and Forge skeleton

- [x] `ACCEPTANCE.json`
- [x] `haven-desk` contract
- [x] queue/provider split
- [x] queue race fixed
- [x] blank-frame rejection
- [x] dual-queue acceptance measurement

### M1 — Story images

- [ ] 300 validated story images
- [ ] 5 passes for every date
- [ ] no black, blank, letterboxed or wrong-size accepted image

### M2 — Game integration

- [ ] Photo Journal is 300 images
- [ ] every date's `scene` is its dossier hero
- [ ] journal unlock rules match solved dates
- [ ] desktop field selection persists

### M3 — Copy and lore

- [ ] 60 date bodies line-edited
- [ ] no build/legal/safety/meta strings in player-facing UI
- [ ] setup and README are fully in-world
- [ ] 3,000 strata are authored or explicitly scoped

### M4 — Quality

- [ ] fresh-profile onboarding
- [ ] all apps open
- [ ] full 1998 → 2045 playthrough
- [ ] mobile pass
- [ ] no uncaught console errors

### M5 — Publish

- [ ] all hard gates true
- [ ] explicit publish approval
- [ ] live URL and cache verification

---

## 6. Current measured state

From `ACCEPTANCE.json`:

```text
Dates:                 60 / 60
Story images:          71 / 300
Starter backgrounds:   5 / 5
Arcade cabinets:       50 / 50
Deep levels:           3000 / 3000 (templated; authored gate false)
Photo Journal:         71 / 300
Open Mic tapes:        10 / 10
Voice clips:           88 / 88
Forge queue open:      226
Forge errors:          0
```

Hard gates:

```text
dates_complete:              true
images_complete:             false
levels_are_authored:         false
photo_journal_matches:       false
copy_pass_complete:          false
full_playthrough_verified:   false
live_publish_approved:       false
```

---

## 7. Definition of done

The build is complete only when:

1. `ACCEPTANCE.json` reports every target at or above target.
2. Every story image is Forge-generated, validated and present in the game.
3. The Photo Journal has 300 usable images.
4. All 60 dates use their scene pass.
5. The 3,000 strata are authored content or the scope is explicitly revised.
6. The copy gate passes on all player-facing text.
7. A full playthrough passes on desktop and mobile.
8. The live build is verified after an explicit publish approval.

Until then, the status is **incomplete**.
