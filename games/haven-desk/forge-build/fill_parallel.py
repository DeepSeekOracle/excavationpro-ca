#!/usr/bin/env python3
"""Render the remaining Haven Desk story images in parallel, fail-fast.

NVIDIA FLUX returns a pure black frame when a prompt contains a colon, quote or
brand string, so every prompt is sanitized and has a plain fallback. Four
threads, two seeds per prompt, no queue and no supervisor.
"""
from __future__ import annotations
import io
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, r"D:\LYGO\asset-foundry")
import nvidia_image as NV
from PIL import Image

PACK = Path(r"D:\LYGO\asset-foundry\packs\haven-desk")
DAYS = PACK / "build" / "days.json"
RAW = PACK / "raw"
GAME = Path(r"C:\Users\justi\source\chatagent\games\haven-desk")
STORY = GAME / "assets" / "story"
MANIFEST = GAME / "veil-story-manifest.js"
LOG = PACK / "build" / "fill3.log"

PASSES = [
    ("scene", "Wide cinematic still of {title}. {summary}. A room in the LYGO 98 archive. No people. No readable text."),
    ("object", "A recovered object from {title}. {summary}. Close still life on a worn concrete table, teal and amber light. No people. No readable text."),
    ("afterimage", "The same room as {title} after everyone left. {summary}. Empty, quiet, dust in the air. No people. No readable text."),
    ("document", "A recovered desk document for {title}. {summary}. Paper, tape and CRT glow on a dark table, abstract marks only. No people. No readable text."),
    ("future", "A future echo of {title}. {summary}. Late-1990s archive dissolving into a thin seam of teal light. No people. No readable text."),
]

BRANDS = [
    ("IBM Personal Computer", "an early business desktop computer"), ("IBM PC", "an early business desktop computer"),
    ("IBM", "a business machine company"), ("Apple I", "a hand-built home computer"), ("Apple", "a computer company"),
    ("Microsoft", "a software company"), ("Windows 1.0", "an early desktop system"), ("Windows", "a desktop system"),
    ("Intel 4004", "a ceramic microprocessor"), ("Intel", "a chip company"), ("Google", "a search company"),
    ("Facebook", "a profile page service"), ("Twitter", "a short message service"), ("YouTube", "a video page"),
    ("Bitcoin", "a public ledger"), ("Hotmail", "a free mail service"), ("Wikipedia", "a shared encyclopedia"),
    ("Deep Blue", "a chess machine"), ("AlphaGo", "a game-playing machine"), ("OpenAI", "a research laboratory"),
    ("GPT-4o", "a fast text model"), ("GPT-3", "a large text model"), ("GPT-1", "a pretrained text model"),
    ("GPT", "a text model"), ("DALL-E", "a picture-making model"), ("Stable Diffusion", "an image model"),
    ("ImageNet", "an image dataset"), ("AlexNet", "an image network"), ("Altair 8800", "a hobbyist computer kit"),
    ("Altair", "a hobbyist computer kit"), ("Mosaic", "an early browser"), ("NCSA", "a university centre"),
    ("iPad", "a glass tablet"), ("iPhone", "a glass telephone"), ("Siri", "a voice assistant"),
    ("Morris worm", "a network worm"), ("TCP/IP", "a network protocol"), ("NVIDIA", "a chip company"),
]


def clean(text: str) -> str:
    out = text
    for brand, plain in BRANDS:
        out = out.replace(brand, plain)
    for ch in (":", "\u2019", "'", '"', "\u201c", "\u201d", "(", ")", "?", "!", ";"):
        out = out.replace(ch, " ")
    return " ".join(out.split())


def attempt(prompt: str, seed: int, jpg: Path) -> bool:
    raw = RAW / (jpg.stem + f"_{seed}.png")
    try:
        NV.generate(prompt, raw, seed=seed)
    except Exception:
        return False
    im = Image.open(raw).convert("RGB")
    if im.size != (1344, 768):
        im = im.resize((1344, 768), Image.Resampling.LANCZOS)
    jpg.parent.mkdir(parents=True, exist_ok=True)
    im.save(jpg, format="JPEG", quality=88, optimize=True)
    return jpg.stat().st_size > 20000


def job(date: str, title: str, summary: str, idx: int, pass_name: str, template: str) -> dict:
    jpg = STORY / date / f"{idx+1}-{pass_name}.jpg"
    if jpg.exists() and jpg.stat().st_size > 20000:
        return {"date": date, "pass": pass_name, "index": idx + 1, "state": "exists"}
    seed = int(date.replace("-", "")) + idx
    full = clean(template.format(title=title, summary=summary))
    plain = clean(f"An archive room, {pass_name} pass, worn surfaces, dust, teal and amber light, no people, no readable text")
    summary_only = clean(f"{summary} A quiet room in a recovered archive, {pass_name} pass, teal and amber light, no people, no readable text")
    for prompt, label in ((full, "full"), (summary_only, "summary"), (plain, "plain")):
        for bump in (0, 1):
            if attempt(prompt, seed + bump * 7919, jpg):
                return {"date": date, "pass": pass_name, "index": idx + 1, "state": "made",
                        "prompt": label, "bytes": jpg.stat().st_size}
    return {"date": date, "pass": pass_name, "index": idx + 1, "state": "error"}


def main() -> int:
    days = json.loads(DAYS.read_text(encoding="utf-8"))
    text = MANIFEST.read_text(encoding="utf-8")
    entries = json.loads(text[text.index("["):text.rindex("]") + 1])
    have = {e["src"] for e in entries}
    tasks = []
    for day in days:
        for idx, (pass_name, template) in enumerate(PASSES):
            jpg = STORY / day["date"] / f"{idx+1}-{pass_name}.jpg"
            if jpg.exists() and jpg.stat().st_size > 20000:
                continue
            tasks.append((day["date"], day["title"], day["summary"], idx, pass_name, template))
    print(json.dumps({"todo": len(tasks)}), flush=True)
    made = errors = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(job, *t) for t in tasks]
        for fut in as_completed(futures):
            row = fut.result()
            if row["state"] == "made":
                made += 1
                idx = row["index"]
                src = f"assets/story/{row['date']}/{idx}-{row['pass']}.jpg"
                if src not in have:
                    entries.append({"date": row["date"], "index": idx,
                                    "pass": row["pass"], "src": src,
                                    "title": f"{row['date']} · {row['pass']}",
                                    "note": "Recovered story image."})
                    have.add(src)
            elif row["state"] == "error":
                errors += 1
            with LOG.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(row) + "\n")
            print(json.dumps(row), flush=True)
    entries.sort(key=lambda e: (e.get("date", ""), e.get("index", 0)))
    MANIFEST.write_text("window.VEIL_STORY_ENTRIES = " + json.dumps(entries, indent=2, ensure_ascii=False) + ";\n",
                        encoding="utf-8")
    print(json.dumps({"made": made, "errors": errors, "manifest": len(entries)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
