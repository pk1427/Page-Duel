#!/usr/bin/env python3
"""Heuristic content-candidate analysis for Book People source discovery.

This script performs SOURCE DISCOVERY and QUALITY ANALYSIS only.
It does NOT do authoritative people counting.

Metrics produced are HEURISTIC ESTIMATES and must be labeled as such.
The purpose is to compare candidates, not to produce final gameplay data.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import fitz

# Caption/OCR hints only. They are a source-screening signal, not people detection.
PEOPLE_KEYWORDS = [
    "people", "person", "man", "woman", "child", "boy", "girl",
    "native", "hindu", "mohammedan", "muslim", "british", "english",
    "european", "officer", "governor", "nawab", "maharaja", "raja",
    "brahman", "priest", "servant", "peasant", "farmer", "fisherman",
    "weaver", "merchant", "trader", "bride", "groom", "school",
    "children", "girl", "boy", "family", "group", "crowd", "villagers",
    "pilgrims", "fakirs", "pundit", "pandit", "portrait", "portraits",
    "costume", "dress", "zenana", "hawker", "hawkers", "merchant",
    "soldier", "army", "troops", "parade", "festival", "dance",
    "dancers", "performer", "performers", "audience", "spectators",
]

ARCHITECTURE_KEYWORDS = [
    "temple", "fort", "palace", "mosque", "tomb", "minaret", "gopura",
    "pagoda", "building", "architecture", "ruins", "monument", "gate",
    "wall", "tower", "dome", "arch", "column", "verandah", "bungalow",
    "residency", "church", "stupa", "dagoba", "shrine",
    "museum", "college", "library", "market", "shop",
    "bridge", "road", "street", "canal", "river", "lake", "sea",
    "ocean", "coast", "beach", "mountain", "hill", "valley", "forest",
    "jungle", "garden", "plain", "desert", "waterfall", "rock", "cave",
    "grotto", "bas-relief", "sculpture", "carving", "ornament",
    "pattern", "design",
]

ILLUSTRATION_KEYWORDS = [
    "plate", "illustration", "portrait", "frontispiece", "figure",
    "fig.", "from a painting", "from a photograph", "engraving",
    "etching", "lithograph", "sketch", "drawing", "view of",
    "scene", "panorama", "heading", "initial", "tailpiece",
]


def analyze_pdf(pdf_path: Path) -> dict:
    """Return reproducible source-screening metrics, never final people counts."""
    doc = fitz.open(pdf_path)
    total_pages = doc.page_count
    pages_with_people_hints = 0
    pages_with_illustration_hints = 0
    text_heavy_pages = 0
    low_text_pages = 0
    total_words = 0

    for i in range(total_pages):
        page = doc.load_page(i)
        text = page.get_text().lower()
        word_count = len(text.split())
        total_words += word_count
        if any(kw in text for kw in ILLUSTRATION_KEYWORDS):
            pages_with_illustration_hints += 1
        if any(kw in text for kw in PEOPLE_KEYWORDS):
            pages_with_people_hints += 1
        if word_count > 200:
            text_heavy_pages += 1
        if word_count <= 40:
            low_text_pages += 1

    result = {
        "total_pdf_pages": total_pages,
        "fixed_candidate_spreads": total_pages // 2,
        "ocr_word_count": total_words,
        "ocr_words_per_page": round(total_words / total_pages, 1) if total_pages else 0,
        "text_heavy_pages": text_heavy_pages,
        "text_heavy_page_rate": round(text_heavy_pages / total_pages, 4) if total_pages else 0,
        "low_text_pages": low_text_pages,
        "low_text_page_rate": round(low_text_pages / total_pages, 4) if total_pages else 0,
        "illustration_caption_hint_pages": pages_with_illustration_hints,
        "people_caption_hint_pages": pages_with_people_hints,
    }
    doc.close()
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path, help="Source PDF")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    if not args.pdf.is_file():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 2

    metrics = analyze_pdf(args.pdf)

    if args.json:
        print(json.dumps(metrics, indent=2))
    else:
        print(f"=== {args.pdf.name} ===")
        print("All metrics are source-screening heuristics, not authoritative people counts.")
        for key, value in metrics.items():
            print(f"  {key}: {value}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
