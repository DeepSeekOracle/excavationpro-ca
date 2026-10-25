#!/usr/bin/env python3
"""Verify the Haven Desk story image grid and the Photo Journal manifest."""
from __future__ import annotations
import json
from pathlib import Path

from PIL import Image, ImageStat

PACK = Path(r"D:\LYGO\asset-foundry\packs\haven-desk")
DAYS = PACK / "build" / "days.json"
GAME = Path(r"C:\Users\justi\source\chatagent\games\haven-desk")
STORY = GAME / "assets" / "story"
MANIFEST = GAME / "veil-story-manifest.js"
PASSES = ["1-scene", "2-object", "3-afterimage", "4-document", "5-future"]

days = json.loads(DAYS.read_text(encoding="utf-8"))
text = MANIFEST.read_text(encoding="utf-8")
entries = json.loads(text[text.index("["):text.rindex("]") + 1])
manifest_src = {e["src"] for e in entries}

missing, bad, ok = [], [], 0
for day in days:
    date = day["date"]
    for p in PASSES:
        rel = f"assets/story/{date}/{p}.jpg"
        path = GAME / rel
        if not path.exists():
            missing.append(rel)
            continue
        if rel not in manifest_src:
            missing.append(rel + " (not in manifest)")
            continue
        try:
            im = Image.open(path).convert("L")
            st = ImageStat.Stat(im)
            if im.size != (1344, 768):
                bad.append((rel, f"size {im.size}"))
            elif st.mean[0] < 8 or st.stddev[0] < 8:
                bad.append((rel, f"flat mean={st.mean[0]:.0f} sd={st.stddev[0]:.0f}"))
            else:
                ok += 1
        except Exception as exc:
            bad.append((rel, type(exc).__name__))

print(json.dumps({
    "expected": len(days) * len(PASSES),
    "valid": ok,
    "missing": len(missing),
    "bad": len(bad),
    "manifest_entries": len(entries),
    "first_missing": missing[:6],
    "first_bad": bad[:6],
}, indent=1))
