#!/usr/bin/env python3
"""Reconcile the story image grid with the Photo Journal manifest, then verify.

Adds a manifest entry for every story image that exists on disk and is missing
from the manifest. Verifies size, aspect and non-flatness of every plate.
"""
from __future__ import annotations
import json
from pathlib import Path

from PIL import Image, ImageStat

PACK = Path(r"D:\LYGO\asset-foundry\packs\haven-desk")
DAYS = PACK / "build" / "days.json"
GAME = Path(r"C:\Users\justi\source\chatagent\games\haven-desk")
STORY = GAME / "assets" / "story"
MANIFEST = GAME / "veil-story-manifest.js"
PASSES = ["scene", "object", "afterimage", "document", "future"]

days = json.loads(DAYS.read_text(encoding="utf-8"))
text = MANIFEST.read_text(encoding="utf-8")
entries = json.loads(text[text.index("["):text.rindex("]") + 1])
have = {e.get("src") for e in entries}

added = 0
files = []
for day in days:
    date = day["date"]
    for idx, pass_name in enumerate(PASSES, start=1):
        rel = f"assets/story/{date}/{idx}-{pass_name}.jpg"
        path = GAME / rel
        if not path.exists():
            continue
        files.append((date, idx, pass_name, rel, path))
        if rel not in have:
            entries.append({"date": date, "index": idx, "pass": pass_name, "src": rel,
                            "title": f"{date} · {pass_name}", "note": "Recovered story image."})
            have.add(rel)
            added += 1

entries.sort(key=lambda e: (e.get("date", ""), e.get("index", 0)))
MANIFEST.write_text("window.VEIL_STORY_ENTRIES = " + json.dumps(entries, indent=2, ensure_ascii=False) + ";\n",
                    encoding="utf-8")

flat, small = [], []
for date, idx, pass_name, rel, path in files:
    im = Image.open(path)
    w, h = im.size
    if w < 1000 or abs((w / h) - (16 / 9)) > 0.02:
        small.append((rel, f"{w}x{h}"))
        continue
    st = ImageStat.Stat(im.convert("L"))
    if st.stddev[0] < 8:
        flat.append((rel, round(st.stddev[0], 1)))

print(json.dumps({
    "on_disk": len(files),
    "expected": len(days) * len(PASSES),
    "manifest_added": added,
    "manifest_total": len(entries),
    "wrong_shape": small[:5],
    "wrong_shape_count": len(small),
    "flat_count": len(flat),
    "flat": flat[:5],
}, indent=1))
