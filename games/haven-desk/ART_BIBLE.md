# The Long Lost PC — Art Bible

## Look in one sentence

A 1998 beige-and-teal archive desk that has been left on too long, interrupted by an amber temporal index and a dark CRT room where the private date burns like a candle.

## Shape language

- **Desk:** literal 1998 chrome, bevels, title bars, taskbar, pixel icons. No modern cards or soft gradients in the host shell.
- **Temporal layer:** flat, archival panels; thin rules; monospace labels; square nodes; a spiderweb that looks drawn by a machine, not a designer.
- **Rooms:** one strong focal image per room, then text. The page is a recovered dossier, not a landing page.
- **Birthday room:** radial, warm, quiet; the only room allowed to feel like a shrine.

## Palette

| Role | Hex | Use |
|---|---|---|
| Background | `#07110f` | temporal shell |
| Panel | `#0b1714` | room/dossier surface |
| Desk teal | `#008080` | original LYGO 98 field |
| Parchment | `#e9e2cf` | headings and paper text |
| Amber | `#e0b35a` | gate, private date, solved |
| Cyan | `#72e0d1` | public record, links, map edge |
| Green | `#9fe58c` | live Wire status, pass |
| Red | `#e8785e` | danger, overflow, fail |
| Muted | `#9bb2a8` | labels, secondary copy |

## Type

- Host: Tahoma / MS Sans Serif / Verdana, 11–13px.
- Temporal labels: Courier New, uppercase, tracked +0.08em to +0.2em.
- Body: Tahoma or system sans, 12–13px, line-height 1.5.
- No display font. The period is the style.

## Lighting and composition

- Hero photographs: a single warm source against a cold field; rain, dust, CRT bloom, film grain.
- UI: high contrast, thin amber rules, no glassmorphism.
- Map: dark field, faint 24px grid, amber live edges, cyan dormant lines.
- Birthday: amber radial glow, teal CRT distance, six brass year markers.

## Character and prop rules

- No generated photoreal person used as a game character.
- The PC, candle, papers, floppy disks, brass markers and desk are the characters.
- Real public figures are referenced by public links only, never recreated as likenesses.

## VFX

- CRT scanlines: 1px at 4px intervals, low opacity.
- Slow scan bar; no strobing.
- Candle flicker: two sine layers, max 10% opacity change.
- Respect `prefers-reduced-motion` by lowering motion and disabling decorative animation.

## UI language

- Every control is a real button with a visible label.
- Locked rooms say “SEALED” and name the predecessor, never a fake timer.
- Solved rooms are amber; open rooms are cyan; sealed rooms are dashed.
- A gate always has: label, question, clue, feedback, and a way back.

## Low-end fallback

- No WebGL requirement.
- One generated hero image, CSS backgrounds elsewhere.
- Canvas minigame capped at 480×260 and 60fps via `requestAnimationFrame`.
- No web fonts; no autoplay audio.

## References and licences

- Generated hero: Qwen-Image 2.1, local, seed 19801231. No third-party image rights.
- Audio: streamed from `chatagent.ca` public Signal; not copied into the repo.
- No Microsoft/Windows logos or icons; the desk is an original late-90s visual language.
