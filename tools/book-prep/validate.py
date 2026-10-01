#!/usr/bin/env python3
"""Validate a Book People working file and optionally produce engine-ready data."""
from __future__ import annotations

import argparse
import copy
import json
import math
from collections import Counter
from pathlib import Path
from typing import Any


def is_count(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value >= 0


def relative_missing(book_dir: Path, value: Any) -> bool:
    return isinstance(value, str) and not value.startswith(("http://", "https://", "/")) and not (book_dir / value).is_file()


def validate(book: dict[str, Any], book_dir: Path) -> tuple[list[str], list[str], list[dict[str, Any]]]:
    errors, warnings, eligible = [], [], []
    seen: set[Any] = set()
    for spread in book.get("spreads", []):
        spread_id = spread.get("id")
        if spread_id in seen:
            errors.append(f"duplicate spread id: {spread_id}")
        seen.add(spread_id)
        excluded = "excluded" in spread.get("flags", [])
        valid_counts = True
        for side_name in ("left", "right"):
            side = spread.get(side_name, {})
            people = side.get("people")
            if people is None:
                if not excluded:
                    errors.append(f"{spread_id} {side_name}: people is uncounted (null)")
                valid_counts = False
            elif not is_count(people):
                errors.append(f"{spread_id} {side_name}: people must be an integer >= 0")
                valid_counts = False
            if relative_missing(book_dir, side.get("image")):
                errors.append(f"{spread_id} {side_name}: missing image {side.get('image')}")
        if not excluded and valid_counts and not (spread["left"]["people"] == 0 and spread["right"]["people"] == 0):
            eligible.append(spread)
    if relative_missing(book_dir, book.get("coverImage")):
        errors.append(f"missing cover image {book.get('coverImage')}")
    if len(eligible) < 20:
        errors.append(f"fewer than 20 eligible spreads ({len(eligible)})")
    return errors, warnings, eligible


def print_stats(eligible: list[dict[str, Any]]) -> None:
    print(f"Eligible spreads: {len(eligible)}")
    for rounds in (5, 10, 15): print(f"{rounds} rounds: {'yes' if len(eligible) >= 2 * rounds else 'no'} (need {2 * rounds})")
    values = [side["people"] for spread in eligible for side in (spread["left"], spread["right"])]
    histogram = Counter(min(value, 9) for value in values)
    print("People/page histogram: " + ", ".join(f"{'9+' if bucket == 9 else bucket}: {histogram[bucket]}" for bucket in range(10)))
    if not eligible: return
    differences = [abs(s["left"]["people"] - s["right"]["people"]) for s in eligible]
    draw_rate, mean_diff, zero_share = sum(d == 0 for d in differences) / len(differences), sum(differences) / len(differences), values.count(0) / len(values)
    print(f"Draw rate: {draw_rate:.1%}; mean |left-right|: {mean_diff:.2f}; zero-people pages: {zero_share:.1%}")
    if draw_rate > .35: print("WARNING: draw rate exceeds 35%")
    if mean_diff < 1: print("WARNING: mean difference is below 1.0")
    if zero_share > .5: print("WARNING: more than 50% of pages have zero people")


def prefix(value: str, base: str) -> str:
    return value if value.startswith(("http://", "https://", "/")) else base + value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("book", type=Path)
    parser.add_argument("--write-final", action="store_true")
    parser.add_argument("--base-url", default="")
    args = parser.parse_args()
    try: book = json.loads(args.book.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc: print(f"Cannot read book: {exc}"); return 1
    errors, _, eligible = validate(book, args.book.parent)
    print_stats(eligible)
    for error in errors: print(f"ERROR: {error}")
    if errors: return 1
    if args.write_final:
        if not args.base_url: print("ERROR: --base-url is required with --write-final"); return 1
        base = args.base_url if args.base_url.endswith("/") else args.base_url + "/"
        final = copy.deepcopy(book)
        final["coverImage"] = prefix(final["coverImage"], base)
        for spread in final["spreads"]:
            excluded = "excluded" in spread.get("flags", [])
            for side in (spread["left"], spread["right"]):
                if side["people"] is None and excluded: side["people"] = 0
                side["image"] = prefix(side["image"], base)
        args.book.with_name("book.final.json").write_text(json.dumps(final, indent=2) + "\n", encoding="utf-8")
        print("Wrote book.final.json")
    return 0


if __name__ == "__main__": raise SystemExit(main())
