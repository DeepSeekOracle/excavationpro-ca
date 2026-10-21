---
title: Lattice Marines Ledger
emoji: 🏝️
colorFrom: blue
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Eternal vs-AI win ledger for Lattice Marines
---

# Lattice Marines Eternal Ledger

Public JSON API. **AI wins only.** Commander name + match metadata are appended to the dataset [`DeepSeekOracle/lattice-marines-wins`](https://huggingface.co/datasets/DeepSeekOracle/lattice-marines-wins).

- Hall of records: [chatagent.ca/games/lattice-marines/ledger.html](https://excavationpro.ca/games/lattice-marines/ledger.html)
- Play: [chatagent.ca/games/lattice-marines/](https://excavationpro.ca/games/lattice-marines/)
- `GET /ledger.json` · `POST /submit` — Marines AI wins
- `GET /smm/ledger.json` · `POST /smm/submit` — Stock Market cashouts
- `GET /rally/ledger.json` · `POST /rally/submit` — Haven Rally heats
- `GET /golf/ledger.json` · `POST /golf/submit` — Lattice Golf rounds
- `GET /swarm/ledger.json` · `POST /swarm/submit` — Lattice Swarm scores
- `GET /eternal/ledger.json` · `POST /eternal/submit` — Eternal Lattice ladder
- `GET /crypt/ledger.json` · `POST /crypt/submit` — Lattice Crypt runs
- `GET /arena/ledger.json` · `POST /arena/submit` — LYGO Arena lineup win/loss (also `POST /arcade/submit` with `"game":"lattice-arena"`)
- `GET /arcade.json` · `POST /arcade/submit` — all titles; Space snapshots dataset `arcade.json`
- `GET /witness/feed.json` — LYGO Public Witness live RESOURCE overlay (public GET aggregator; failed sources stay named SHADOW)
- Hub: [chatagent.ca/games/](https://excavationpro.ca/games/) · Board: [chatagent.ca/games/board.html](https://excavationpro.ca/games/board.html)

Hot-seat and losses are rejected. No secrets in the game client — the Space secret writes the dataset.
