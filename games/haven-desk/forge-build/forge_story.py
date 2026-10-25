#!/usr/bin/env python3
"""Haven Desk story Forge.

Staged pipeline:
  board -> long draft (OpenCode/NVIDIA GLM) -> quality gate -> accepted JSON.

The model never writes directly into the game. Only accepted JSON is synced.
"""
from __future__ import annotations
import argparse
import json
import re
import shutil
import subprocess
import time
from datetime import date as date_cls
from pathlib import Path

ROOT = Path(r"D:\LYGO\asset-foundry\packs\haven-desk")
STORY = ROOT / "story"
BOARDS = STORY / "boards"
DRAFTS = STORY / "drafts"
ACCEPTED = STORY / "accepted"
BIBLE = STORY / "bible.json"
DAYS = ROOT / "build" / "days.json"
GAME = Path(r"C:\Users\justi\source\chatagent\games\haven-desk")
MODEL = "nvidia/z-ai/glm-5.3-flash"
OPENCODE = shutil.which("opencode") or r"C:\Users\justi\AppData\Local\Programs\opencode\opencode.exe"

SYSTEM = """You write literary fiction for a recovered-memory computer game. Return prose only.
No title. No markdown. No analysis. No meta commentary. No AI phrases.
Concrete objects, short dialogue, physical consequences. Never explain the game or the archive.
Never use em dashes. Never use the phrase "not just".
Write in close third person. J.H. is a repair technician, not a hero.
"""


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def days() -> dict:
    rows = load_json(DAYS)
    return {row["date"]: row for row in rows}


def board_for(day: dict) -> dict:
    body = day.get("body") or []
    return {
        "date": day["date"],
        "title": day["title"],
        "summary": day["summary"],
        "existing_facts": body,
        "act": day.get("act", ""),
        "kind": day.get("kind", ""),
        "beat_sheet": [
            "Arrival: J.H. enters a room that is already occupied by one ordinary object.",
            "Wrong detail: one detail refuses the era's normal behaviour.",
            "Inspection: J.H. tests it with a tool; the test produces a small wrong result.",
            "Human pressure: the Woman or another voice gives an instruction that withholds the reason.",
            "Label/trace: a handwritten or machine-printed label points to an earlier absence.",
            "Choice: J.H. can leave the object alone or turn it on; both choices have a cost.",
            "Consequence: the room changes in a way that follows him to the next date.",
            "Turn: end on a concrete image or line that makes the next room harder, without explaining it."
        ],
        "continuity": [
            "Keep J.H. consistent: practical, observant, uncomfortable with praise.",
            "Use one recurring object from the existing facts.",
            "The Woman can speak through a wall speaker but never explains the room fully.",
            "Do not resolve the 1969 moon anomaly, the owner's disappearance, or the 2045 protocol.",
            "The next date should feel earned by a cost paid here."
        ]
    }


def extract_text(output: str) -> str:
    """OpenCode --format json emits newline-delimited events."""
    texts = []
    for line in output.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            event = json.loads(line)
        except Exception:
            continue
        if event.get("type") == "text":
            part = event.get("part") or {}
            if isinstance(part.get("text"), str):
                texts.append(part["text"])
    if texts:
        return texts[-1]
    # Fallback: any JSON with a text field.
    try:
        data = json.loads(output)
        if isinstance(data, dict):
            return data.get("text", "")
    except Exception:
        pass
    return ""


def opencode(prompt: str, timeout: int = 600) -> str:
    prompt_dir = STORY / "prompts"
    prompt_dir.mkdir(parents=True, exist_ok=True)
    prompt_path = prompt_dir / "last.txt"
    prompt_path.write_text(prompt, encoding="utf-8")
    cmd = [OPENCODE, "run", "--agent", "story", "--model", MODEL, "--dir", str(GAME),
           "--pure", "--variant", "minimal", "--format", "json",
           "Follow the writing instructions in the attached file. Return only the requested prose.",
           "--file", str(prompt_path)]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                          creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    raw_dir = STORY / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    (raw_dir / "last.jsonl").write_text(proc.stdout + "\n---STDERR---\n" + proc.stderr, encoding="utf-8")
    if proc.returncode != 0:
        raise RuntimeError(f"OpenCode failed {proc.returncode}: {proc.stderr[:300]}")
    text = extract_text(proc.stdout)
    if not text:
        raise RuntimeError("OpenCode returned no text")
    return text


def normalize(text: str, title: str) -> list[str]:
    text = text.strip()
    # Strip a leading markdown title if the model adds one.
    text = re.sub(r"^\s*#\s+" + re.escape(title) + r"\s*\n+", "", text, flags=re.I)
    text = re.sub(r"^\s*#.*\n+", "", text, count=1)
    paras = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    return [p for p in paras if p]


def gate(day: dict, paras: list[str], bible: dict) -> dict:
    text = "\n\n".join(paras)
    words = len(text.split())
    issues = []
    q = bible.get("quality", {})
    if words < q.get("min_words", 700):
        issues.append(f"too short: {words} words")
    if words > q.get("max_words", 1200):
        issues.append(f"too long: {words} words")
    if len(paras) < q.get("min_paragraphs", 8):
        issues.append(f"too few paragraphs: {len(paras)}")
    lower = text.lower()
    for phrase in q.get("banned_phrases", []):
        if phrase.lower() in lower:
            issues.append(f"banned phrase: {phrase}")
    if "\u2014" in text:
        issues.append("em dash present")
    if re.search(r"\bnot just\b", lower):
        issues.append("negative parallelism")
    if any(len(p.split()) < 10 for p in paras):
        issues.append("paragraph under 10 words")
    openings = [p.split()[0].lower() for p in paras if p.split()]
    if len(openings) != len(set(openings)):
        issues.append("repeated paragraph opening word")
    return {"ok": not issues, "issues": issues, "words": words, "paragraphs": len(paras),
            "date": day["date"], "title": day["title"], "body": paras}


def draft_prompt(day: dict, board: dict, bible: dict) -> str:
    return SYSTEM + "\n\nSTORY BIBLE:\n" + json.dumps(bible, indent=2, ensure_ascii=False) + \
        "\n\nBOARD:\n" + json.dumps(board, indent=2, ensure_ascii=False) + \
        f"\n\nWrite the scene for {day['date']}, \"{day['title']}\". " \
        "Return only 9 to 11 paragraphs of prose, 800 to 1100 words. " \
        "Do not include a title or headings. Follow every beat, but do not label the beats. " \
        "The first paragraph must put J.H. in the room with the object. " \
        "The final paragraph must end on a concrete consequence. " \
        "No explanation of what the scene means."


def expand_prompt(day: dict, board: dict, bible: dict, paras: list[str], issues: list[str]) -> str:
    return SYSTEM + "\n\nSTORY BIBLE:\n" + json.dumps(bible, indent=2, ensure_ascii=False) + \
        "\n\nBOARD:\n" + json.dumps(board, indent=2, ensure_ascii=False) + \
        "\n\nCURRENT DRAFT:\n" + "\n\n".join(paras) + \
        "\n\nREJECTION:\n" + "; ".join(issues) + \
        "\n\nRewrite this as a complete scene in 9 to 11 paragraphs, 800 to 1000 words. " \
        "Keep the strongest existing sentences and concrete details, but expand the middle: " \
        "give J.H. a longer inspection, let the Woman's instruction cost him something, " \
        "add a physical test with a wrong result, and make the final consequence specific. " \
        "Do not add a title, headings, summary, or explanation. Return prose only."


SECTIONS = [
    ("paragraphs 1-4", "beats 1 through 3: arrival, wrong detail, and inspection", "350 to 430 words", 4),
    ("paragraphs 5-8", "beats 4 through 6: the voice, the label, and the choice", "350 to 430 words", 4),
    ("paragraphs 9-11", "beats 7 and 8: consequence and the final turn", "250 to 350 words", 3),
]


def section_prompt(day: dict, board: dict, bible: dict, index: int, prior: list[str]) -> str:
    label, beats, budget, count = SECTIONS[index]
    return SYSTEM + "\n\nSTORY BIBLE:\n" + json.dumps(bible, indent=2, ensure_ascii=False) + \
        "\n\nBOARD:\n" + json.dumps(board, indent=2, ensure_ascii=False) + \
        ("\n\nALREADY WRITTEN:\n" + "\n\n".join(prior) if prior else "") + \
        f"\n\nWrite only {label} of this scene, covering {beats}. " \
        f"Write {count} paragraphs, {budget}. Do not repeat the prior prose. " \
        "Do not summarize. Do not add a title or headings. " \
        "Do not explain the room. Continue the same scene directly. " \
        "Return only the new paragraphs."


def run_date(date: str, force: bool = False) -> dict:
    all_days = days()
    if date not in all_days:
        raise SystemExit(f"unknown date: {date}")
    day = all_days[date]
    bible = load_json(BIBLE)
    board = board_for(day)
    save_json(BOARDS / f"{date}.json", board)
    sections = []
    for index in range(len(SECTIONS)):
        part = opencode(section_prompt(day, board, bible, index, sections))
        section_paras = normalize(part, day["title"])
        if not section_paras:
            raise SystemExit(f"empty section {index} for {date}")
        sections.extend(section_paras)
    paras = sections
    report = gate(day, paras, bible)
    if not report["ok"]:
        draft = opencode(expand_prompt(day, board, bible, paras, report["issues"]))
        paras = normalize(draft, day["title"])
        report = gate(day, paras, bible)
    save_json(DRAFTS / f"{date}.json", {**report, "raw_chars": sum(len(p) for p in paras)})
    if not report["ok"]:
        raise SystemExit("REJECTED " + date + ": " + "; ".join(report["issues"]))
    save_json(ACCEPTED / f"{date}.json", {**report, "source": "opencode:" + MODEL,
                                          "accepted_at": date_cls.today().isoformat()})
    print(json.dumps({k: report[k] for k in ("date", "title", "words", "paragraphs", "ok")}))
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date")
    parser.add_argument("--board-only", action="store_true")
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()
    for p in (BOARDS, DRAFTS, ACCEPTED):
        p.mkdir(parents=True, exist_ok=True)
    if args.board_only and args.date:
        all_days = days()
        save_json(BOARDS / f"{args.date}.json", board_for(all_days[args.date]))
        print("BOARD", args.date)
        return 0
    if args.date:
        run_date(args.date)
        return 0
    if args.all:
        for date in sorted(days()):
            if (ACCEPTED / f"{date}.json").exists():
                continue
            try:
                run_date(date)
            except Exception as exc:
                print("STORY_FAIL", date, type(exc).__name__, str(exc)[:200])
        return 0
    parser.error("use --date DATE or --all")


if __name__ == "__main__":
    raise SystemExit(main())
