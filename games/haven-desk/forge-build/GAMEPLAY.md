# Haven Desk — gameplay layer

The story layer is 60 rooms. This file covers the parts a player touches around
it: the opening loop, the thread line, the desktop staging, the ending, and the
personal items on the desk.

## The opening loop (first run)

`veil-start.js` owns it. Nothing else has to be true for it to work:

1. The boot screen fades its BIOS lines in, with a caret.
2. The desk appears with every icon asleep except Calendar, Read Me and Drawer.
3. A note taped to the monitor types itself out, then asks for one word.
4. The word is `FOUNDATION`. Wrong answers escalate through three hints; the
   desk then offers to type it.
5. Success mirrors the 1998 gate exactly (`solved['1998-03-14']`, unlocks 1969,
   1989, 1999, 2007), reveals the desktop in a wave, and turns the note over to
   a second side with three exits.
6. From then on the THREAD line at the bottom of the desk names the next room and
   routes to it. It is the only hint the desk gives twice.

The five-step setup wizard is still in `veil-onboard.js`, reachable from the
note's second side. It is no longer a gate in front of the story.

## The end

When all 60 dates are solved, `checkComplete()` fires once:

- a chime, and a card that reads "The index is complete"
- `THE LAST PAGE` becomes a permanent desk item (240 words, written to close the
  arc rather than summarise it)
- the thread line switches to "THREAD COMPLETE · 60 OF 60"

## Personal items

`Kooter.jpg` sits on the desk after the note. It opens the memorial photograph
and the four lines that go with it. The mount is re-registered on every load
because the save keeps the file list, not the app registry.

## Map

The map marks the next room with a teal pulse, and the legend carries a
`SHOW OPEN ONLY` toggle for players who do not want to scroll past 50 sealed
dates. Both are in `veil.js` (`is-next`, `V.mapFilter`).

## Tests

See `qa/README.md`. All of them run the real page in jsdom.
