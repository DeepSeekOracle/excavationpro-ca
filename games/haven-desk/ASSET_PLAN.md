# The Long Lost PC — Asset Plan

Every visible asset has a source, licence, format and status.

## Core assets

| ID | Asset | Type | Use | Source / licence | Format | Status |
|---|---|---|---|---|---|---|
| A001 | `assets/veil/desk-hero.jpg` | image | 1998 room hero | Qwen-Image 2.1 local; generated | JPEG 1400×788 | verified |
| A002 | `assets/veil/desk-hero.png` | source | source render | Qwen-Image 2.1 local | PNG 1536×864 | kept |
| A003 | `veil.css` | CSS | temporal theme + saver | original | text | verified |
| A004 | desk icons | SVG | host shell | existing LYGO 98 | inline SVG | existing |
| A005 | public Signal audio | audio link | room / sources | `chatagent.ca/signal/audio/harmonic-architect.mp3` | stream only | linked |
| A006 | public pages | links | facts/sources | chatagent.ca, Wikipedia, NASA, IBM, CERN, OpenAI | external | linked |

## Generated assets

| ID | Prompt / model | Seed | Output | Verified |
|---|---|---|---|---|
| A001 | dark 1990s office, CRT teal, amber lamp, papers, rain, no people/text | Qwen-Image 2.1 / 19801231 | `desk-hero.png` → JPEG | visual check |
| A002 | single candle, concrete table, six brass markers, dark archive, teal CRT | Qwen-Image 2.1 / 19801231 | `birthday-room.*` | pending final render |

## Sourcing rules

- CC0 / public domain / explicitly compatible only for packaged media.
- Record source URL, author, licence and SHA-256.
- Prefer local generated assets before downloads.
- No Microsoft/Windows icons or screenshots.
- No copied YouTube/Twitch video; link out or embed only where the platform permits.
- No downloaded Signal MP3; stream from source.

## Third-party links

- NASA Voyager/Apollo/Curiosity: public information; link only.
- Britannica, IBM, CERN, OpenAI: link only.
- LYGO public pages: link only; no bulk copying.
- HF Space: public endpoint used by Wire Chat; no private data.

## Rejected

- Foundry-generated birthday card: `JOB-8C404AA5` failed after 353.5 s under GPU contention. Do not claim it.
- NVIDIA lore job `JOB-EF60C5D6` returned metadata but no documents. Not used.
