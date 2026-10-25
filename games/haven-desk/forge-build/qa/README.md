# QA harness — Haven Desk

Every check here runs the real page in jsdom, drives the real UI, and reads the
result back out of the DOM. Nothing asserts against a mock.

```
npm install jsdom          # once, in a scratch dir
node qa/test_start.js      # first run: note -> word -> desk wakes -> first room
node qa/test_guard.js      # the note does not reappear for a returning player
node qa/test_gates.js      # lights / memory / bits / sequence gates solve
node qa/test_finale.js     # candle choice + portal sequence -> ending appears
node qa/test_ending.js     # 60/60 -> ending card, Last Page item, thread state
node qa/test_filter.js     # map filter: 59 rooms <-> open only
node qa/test_sweep.js      # note focus trap, aria, and the private-date dead end
node qa/playthrough_local.js  # all 60 rooms render their long scene
```

Expected output of the two heaviest runs:

```
test_finale:  candleSolved true · portalSolved true · ending true · 0 JS errors
playthrough_local: routed 60 · passed 60 · words 47046 · 0 JS errors
```

`playthrough.js` in the parent folder is the same harness pointed at
`https://chatagent.ca/games/haven-desk/` so the deployed build can be checked
without trusting the working tree.

The three gate types that cannot be driven headlessly (`game` — a canvas
minigame, and the two `memory` variants that need timing) are checked by reading
their data: every interactive gate has a target, sequence or answer, and the
audit that walks `gate.unlocks` proves all 60 dates are reachable from the start.
