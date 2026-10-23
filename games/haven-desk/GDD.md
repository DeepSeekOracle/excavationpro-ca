# HAVEN DESK: THE LONG LOST PC — Game Design Document

**Version:** 0.1.0-foundation  
**Profile:** Web 2D / narrative desk  
**Host:** existing `LYGO 98` desk at `chatagent.ca/games/haven-desk/`  
**Target:** 20–60 minute first sitting; expandable by date rooms.

## Player fantasy

You find a computer that was left on. It is not a game console. It is a room: a late-1990s desktop full of private-feeling documents, public records, strange tools and a calendar that should not work. You are the visitor the owner never met.

You are not here to save the world with a gun. You are here to reconstruct a life by opening dates, reading documents, solving gates, and deciding what to do with the one private room that cannot be indexed.

## Non-negotiable frame

This is a **fictionalized story built around a real public creative life**. Justin Helmer is a character in the fiction, not a factual record. Public events and links are real. Private scenes, invented documents and future dates are explicitly fiction. No private data is used.

## Pillars

1. **The desk is the world.** No separate game shell. LYGO 98 is the interface; the new time layer lives inside it.
2. **A date is a room.** Every recovered date has a story, documents, a gate, and a consequence.
3. **The gate must mean something.** Codes, bytes, sequences, a packet minigame, and one emotional choice — not arbitrary lock screens.
4. **The web is the map.** Dates unlock other dates. The player sees the shape of the mystery before they see the ending.
5. **Public facts, private fiction.** Every real claim is linked; every invented room is labeled.
6. **One more day.** Each room should end with a new question, not a checklist.

## Core loop

1. Open **The Long Lost PC**.
2. Open **The Calendar**.
3. Choose an unlocked date; read the room and its recovered files.
4. Solve the gate.
5. A new branch of dates lights up.
6. Return to the map and follow the thread that feels wrong, sad, or impossible.
7. At the end, choose what the private room means.

## Time rules

- The calendar is an **index**, not a physical time machine.
- The machine can only hold dates it has a record of. The player unlocks records by solving rooms.
- A locked date is not a failure; it is a direction.
- The private date `1980-12-31` is hidden from the map and the public index. It requires the 1998 foundation, the 2026 visitor and the 2038 overflow, then an eight-digit recovery.
- The birthday room does not ask for a code. It asks for a choice: keep the candle lit, or blow it out and keep the warmth. That choice colors the final room.

## Systems

| System | Rule |
|---|---|
| Save | `localStorage` key `haven-desk-v1`, namespace `veil` |
| Unlocks | `solved` days add their `gate.unlocks` to `unlocked` |
| Flags | `birthdayFound`, `birthdayChoice` |
| Gates | code, 8-bit byte, sequence, canvas packet game, birthday choice |
| Map | 24 rooms, chronological snake grid, spiderweb edges |
| Month | Real calendar grid; only signal dates open |
| Casebook | Every solved room and its recovered docs |
| Sources | Public links, audio, TV, fiction/fact rule |
| Wire | Live HF Space + local archive fallback |

## Content structure

```text
1969 Moon          1977 Golden Record   1984 Macintosh
1989 Wall          1991 Public Web      1995 Start
1997 Deep Blue     1998 The Room        1999 Y2K
2003 Store         2007 Glass           2008 Genesis
2012 Long Count    2012 Curiosity       2015 Future Brand
2016 Move 37       2019 Lattice         2022 Mirror
2023 Shadow Score  2026 Signal          2026 Visitor
2038 Overflow      2045 Harmony
1980-12-31 The Room With One Candle (hidden)
```

## Session targets

- First 10 minutes: boot, intro, first foundation, map opens.
- First 30 minutes: 4–6 rooms, one branch, at least one non-code gate.
- 60 minutes: 8–10 rooms, the public Signal room, the birthday recovery clue chain.
- Completionist: all 24 rooms, both birthday choices observed, casebook read.

## Non-goals

- No Windows/Microsoft asset copying or branding.
- No paid API, subscription, credits or store requirement.
- No private-life claims presented as fact.
- No open world, multiplayer, or 3D action combat in this slice.
- No download of copyrighted video/audio into the repo.
- No automatic publishing from within the game.

## Success metrics

- No console/page errors in the first 10 minutes.
- 60 fps on the test desktop.
- Mobile layout at 390px with no horizontal page overflow.
- Every gate has a readable clue in the room's own files.
- A new player can solve the first gate without external help.
- The birthday room is discoverable from in-game clues, not a walkthrough.
