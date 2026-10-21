---
title: Lattice Golf Lobby
emoji: ⛳
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Live 1–4 player WebSocket lobby for Lattice Golf
---

# Lattice Golf live lobby

Stdlib asyncio WebSocket server. No pip deps.

```
python server.py
```

Listens on `ws://127.0.0.1:8768/ws` (or `$PORT` / 7860 on Hugging Face).

Health: `GET /health` → `{"ok":true}`.

The game client uses localhost when you open the page from 127.0.0.1, otherwise `wss://deepseekoracle-lattice-golf-lobby.hf.space/ws`. Override with `?lobby=ws://host:port/ws`.
