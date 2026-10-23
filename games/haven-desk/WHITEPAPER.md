# The Long Lost PC — Whitepaper

## Thesis

The most interesting game about time travel is not a machine that changes history. It is a **record** that changes the player.

A computer left on is an intimate object. It holds a person's unfinished work, their public claims, their private failures, and the dates they could not say out loud. This game makes the desktop itself the mystery.

## Player promise

You will not be told the owner's life. You will reconstruct it from rooms, documents, public links and one private date. You will be trusted to notice the difference between a fact and a story.

## Loop

```text
read a room -> solve its gate -> light a new date -> follow the thread
```

The map is the story graph. The calendar is the index. The casebook is memory. The Wire is a voice that is not always reliable.

## Systems and content

- 24 recovered dates from 1969 to 2045.
- One hidden private room (1980-12-31) behind a three-part clue chain and an eight-digit recovery.
- Five gate types: code, byte, sequence, packet minigame, emotional choice.
- Month view, casebook, public sources, real Signal audio, public TV link.
- Live Hugging Face Wire with local archive fallback.
- Remastered LYGO 98 screen saver: archive rings, candle glow, private-date whisper.

## Art and audio direction

1998 desk chrome, teal field, amber archive, cyan public record. One generated hero image; CSS-only rooms otherwise. Audio is streamed from the public Signal episode, never copied.

## Technical approach

Static HTML/CSS/JS over the existing desk. No framework, no build step, no server account. `localStorage` save under `haven-desk-v1`. One engine (Gemma 12B) remains the local AI; the public HF Space is a separate Wire endpoint.

## Scope and non-goals

This is a **playable narrative slice**, not a 3D character game. It does not include a full voice cast, cloud save, localization, store packaging, or multiplayer. It does not present invented private scenes as fact.

## Milestones and evidence

See `PLAN.md` and `QA.md`. The current slice has 24 rooms, a first-session gate chain, a hidden birthday room, a live/archived chat, a tested mobile layout, and a Forge-recorded playtest.

## Licences and credits

- Generated art: Qwen-Image 2.1 local; no third-party image rights.
- Public text/audio: linked to their sources; not republished.
- Existing LYGO 98 code: original chatagent.ca game.
- The fictionalized owner is a character; the public work is real and linked.
