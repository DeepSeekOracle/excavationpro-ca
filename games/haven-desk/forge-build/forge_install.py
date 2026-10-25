#!/usr/bin/env python3
"""Haven Desk story installer: inbox JSON -> hard gate -> accepted -> game.

No agent, no subprocess model call. The prose is written once, then this script
is the only path into the game. Anything that fails the gate never lands.

Usage:
    python forge_install.py            # install every inbox/*.json
    python forge_install.py --check    # gate only, write nothing
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import forge_story as F

INBOX = F.STORY / "inbox"
REPORT = F.STORY / "gate-report.json"

MIN_WORDS = 740
MAX_WORDS = 1150
MIN_PARAS = 8
MIN_PARA_WORDS = 40
BANNED_EXTRA = ["in this room, the", "little did", "he could not help",
                "a testament", "the weight of", "something shifted"]
DASHES = re.compile(r"[\u2014\u2013]")


def clean(paras: list) -> list[str]:
    out = []
    for p in paras:
        p = re.sub(r"\s+", " ", str(p)).strip()
        if p:
            out.append(p)
    return out


def extra_issues(paras: list[str]) -> list[str]:
    issues = []
    text = "\n\n".join(paras)
    if DASHES.search(text):
        issues.append("em/en dash present")
    low = text.lower()
    for phrase in BANNED_EXTRA:
        if phrase in low:
            issues.append(f"banned phrase: {phrase}")
    if re.search(r"(?m)^\s*(#|[-*]\s|\d+\.\s)", text):
        issues.append("markdown or list syntax")
    if re.search(r"\b(TODO|PLACEHOLDER|XXX)\b", text):
        issues.append("placeholder token")
    if not re.search(r'"', text):
        issues.append("no dialogue")
    thin = [i + 1 for i, p in enumerate(paras) if len(p.split()) < MIN_PARA_WORDS]
    if thin:
        issues.append(f"thin paragraphs: {thin}")
    if paras and len(paras[0].split()) < 30:
        issues.append("weak opening paragraph")
    return issues


def gate(day: dict, paras: list[str], bible: dict) -> dict:
    report = F.gate(day, paras, bible)
    issues = list(report["issues"])
    words = report["words"]
    if words < MIN_WORDS:
        issues = [i for i in issues if not i.startswith("too short")]
        issues.append(f"too short: {words} words (needs {MIN_WORDS})")
    if words > MAX_WORDS:
        issues = [i for i in issues if not i.startswith("too long")]
        issues.append(f"too long: {words} words (max {MAX_WORDS})")
    if report["paragraphs"] < MIN_PARAS:
        issues = [i for i in issues if not i.startswith("too few")]
        issues.append(f"too few paragraphs: {report['paragraphs']}")
    issues.extend(extra_issues(paras))
    seen = set()
    deduped = []
    for i in issues:
        if i not in seen:
            seen.add(i)
            deduped.append(i)
    return {**report, "ok": not deduped, "issues": deduped}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    bible = F.load_json(F.BIBLE)
    all_days = F.days()
    results = []
    installed = 0
    for path in sorted(INBOX.glob("*.json")):
        try:
            batch = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            print(f"BATCH_ERROR {path.name}: {exc}")
            continue
        for date, paras in batch.items():
            if date not in all_days:
                print(f"UNKNOWN_DATE {date} in {path.name}")
                results.append({"date": date, "ok": False, "issues": ["unknown date"], "batch": path.name})
                continue
            day = all_days[date]
            body = clean(paras)
            report = gate(day, body, bible)
            row = {"date": date, "title": day["title"], "batch": path.name,
                   "ok": report["ok"], "words": report["words"],
                   "paragraphs": report["paragraphs"], "issues": report["issues"]}
            results.append(row)
            if not report["ok"]:
                print(f"REJECTED {date} {report['words']}w/{report['paragraphs']}p :: {'; '.join(report['issues'])}")
                continue
            print(f"PASS     {date} {report['words']}w/{report['paragraphs']}p")
            if not args.check:
                F.save_json(F.ACCEPTED / f"{date}.json", {
                    **report, "body": body,
                    "source": "hermes-authored:" + path.name,
                    "accepted_at": "2026-10-24",
                })
                installed += 1
    ok = [r for r in results if r["ok"]]
    summary = {
        "checked": len(results), "passed": len(ok), "installed": installed,
        "words": sum(r.get("words", 0) for r in ok),
        "remaining": len([d for d in all_days if not (F.ACCEPTED / f"{d}.json").exists()]),
        "results": results,
    }
    REPORT.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({k: summary[k] for k in ("checked", "passed", "installed", "words", "remaining")}))
    return 0 if len(ok) == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
