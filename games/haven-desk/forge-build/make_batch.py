#!/usr/bin/env python3
"""Turn a plain-text scene file into a gated inbox batch.

Source format (story/inbox_src/batch-NN.txt):
    ### 1971-11-15
    first paragraph on one line
    second paragraph on one line
    ### 1973-04-03
    ...

Output: story/inbox/batch-NN.json  ({date: [paragraph, ...]})
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(r"D:\LYGO\asset-foundry\packs\haven-desk\story")
SRC = ROOT / "inbox_src"
OUT = ROOT / "inbox"


def parse(text: str) -> dict:
    batch: dict[str, list[str]] = {}
    current = None
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("###"):
            current = line.lstrip("#").strip()
            batch[current] = []
            continue
        if current is None:
            raise SystemExit("paragraph before any ### date header")
        batch[current].append(line)
    return batch


def main() -> int:
    if len(sys.argv) < 2:
        raise SystemExit("usage: make_batch.py batch-01.txt")
    src = SRC / sys.argv[1]
    batch = parse(src.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / (src.stem + ".json")
    dest.write_text(json.dumps(batch, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    for date, paras in batch.items():
        words = len(" ".join(paras).split())
        print(f"{date}  {words}w  {len(paras)}p")
    print("WROTE", dest)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
