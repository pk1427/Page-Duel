#!/usr/bin/env python3
"""Report whether a Book People working book is complete enough to publish."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from validate import validate


def is_counted(spread: dict[str, Any]) -> bool:
    """Excluded spreads are complete without counts; other spreads need both values."""
    if "excluded" in spread.get("flags", []):
        return True
    return spread.get("left", {}).get("people") is not None and spread.get("right", {}).get("people") is not None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("book", type=Path, help="Path to a working book.json")
    args = parser.parse_args()

    try:
        book = json.loads(args.book.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"Cannot read book: {error}")
        return 1

    spreads = book.get("spreads", [])
    errors, _, _ = validate(book, args.book.parent)
    counted = sum(is_counted(spread) for spread in spreads)
    excluded = sum("excluded" in spread.get("flags", []) for spread in spreads)
    ambiguous = sum("ambiguous" in spread.get("flags", []) for spread in spreads)

    print(book.get("title", args.book.stem))
    print()
    print(f"Spreads: {len(spreads)}")
    print(f"Fully counted: {counted}")
    print(f"Remaining: {len(spreads) - counted}")
    print(f"Excluded: {excluded}")
    print(f"Ambiguous: {ambiguous}")
    # `validate` deliberately reports uncounted normal pages as errors before finalization.
    # For a progress report they belong under Remaining, not Invalid. The eligible-spread
    # minimum is also not meaningful until annotation has finished.
    invalid = [
        error
        for error in errors
        if "people is uncounted (null)" not in error
        and not (counted != len(spreads) and error.startswith("fewer than 20 eligible spreads"))
    ]
    print(f"Invalid: {len(invalid)}")
    for error in invalid:
        print(f"ERROR: {error}")

    ready = counted == len(spreads) and not invalid
    print()
    print(f"Status: {'READY' if ready else 'INCOMPLETE'}")
    return 0 if ready else 1


if __name__ == "__main__":
    raise SystemExit(main())
