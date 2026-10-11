#!/usr/bin/env python3
"""Render a scanned book PDF into Book People working data."""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

import fitz
from PIL import Image


def render_page(document: fitz.Document, page_number: int, destination: Path, width: int, quality: int) -> None:
    page = document.load_page(page_number - 1)
    scale = width / page.rect.width
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    with Image.open(__import__("io").BytesIO(pixmap.tobytes("png"))) as image:
        image.convert("RGB").save(destination, "WEBP", quality=quality, method=6)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path, help="Source PDF")
    parser.add_argument("--id", required=True, help="Book slug")
    parser.add_argument("--title", required=True)
    parser.add_argument("--author", required=True)
    parser.add_argument("--year", type=int)
    parser.add_argument("--description")
    parser.add_argument("--version", default="1", help="Content-pack version (default: 1)")
    parser.add_argument("--illustrator")
    parser.add_argument("--source")
    parser.add_argument("--source-name", default="Source")
    parser.add_argument("--rights")
    parser.add_argument("--license", default="Public domain")
    parser.add_argument("--cover", type=int, default=1, help="1-based PDF cover page")
    parser.add_argument("--first-left", type=int, required=True, help="1-based first left page")
    parser.add_argument("--last", type=int, help="Last 1-based PDF page to use")
    parser.add_argument("--page-offset", type=int, default=0, help="Printed label = PDF page - offset")
    parser.add_argument("--width", type=int, default=800)
    parser.add_argument("--quality", type=int, default=80)
    parser.add_argument("--out", type=Path, default=Path("out"))
    parser.add_argument("--force", action="store_true", help="Overwrite an existing working book.json")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.width <= 0 or args.quality < 0 or args.quality > 100:
        print("--width must be positive and --quality must be 0..100", file=sys.stderr)
        return 2
    if not args.pdf.is_file():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 2
    with fitz.open(args.pdf) as document:
        total = document.page_count
        last = args.last if args.last is not None else total
        if not 1 <= args.cover <= total:
            print(f"--cover must be between 1 and {total}", file=sys.stderr)
            return 2
        if not 1 <= args.first_left <= total:
            print(f"--first-left must be between 1 and {total}", file=sys.stderr)
            return 2
        if not args.first_left <= last <= total:
            print(f"--last must be between --first-left ({args.first_left}) and {total}", file=sys.stderr)
            return 2
        output = args.out / args.id
        book_path = output / "book.json"
        if book_path.exists() and not args.force:
            print(f"Refusing to overwrite {book_path}; hand-counted data exists. Use --force.", file=sys.stderr)
            return 1
        pages = list(range(args.first_left, last + 1))
        if len(pages) % 2:
            pages.pop()
        output.joinpath("pages").mkdir(parents=True, exist_ok=True)
        render_page(document, args.cover, output / "cover.webp", 480, args.quality)
        spreads = []
        for index in range(0, len(pages), 2):
            left_pdf, right_pdf = pages[index], pages[index + 1]
            left_label, right_label = left_pdf - args.page_offset, right_pdf - args.page_offset
            left_image, right_image = f"pages/p{left_label:03d}.webp", f"pages/p{right_label:03d}.webp"
            render_page(document, left_pdf, output / left_image, args.width, args.quality)
            render_page(document, right_pdf, output / right_image, args.width, args.quality)
            spreads.append({"id": f"s{index // 2 + 1:03d}", "left": {"page": left_label, "sourcePage": left_pdf, "printedPage": left_label, "image": left_image, "people": None}, "right": {"page": right_label, "sourcePage": right_pdf, "printedPage": right_label, "image": right_image, "people": None}, "flags": []})
        book = {"id": args.id, "title": args.title, "author": args.author, "license": args.license, "version": args.version, "status": "draft", "coverImage": "cover.webp", "spreads": spreads}
        if args.year:
            book["year"] = args.year
        if args.description:
            book["description"] = args.description
        if args.illustrator:
            book["illustrator"] = args.illustrator
        if args.source:
            book["source"] = {"name": args.source_name, "url": args.source}
            if args.rights:
                book["source"]["rights"] = args.rights
        book_path.write_text(json.dumps(book, indent=2) + "\n", encoding="utf-8")
        shutil.copyfile(Path(__file__).with_name("counter.html"), output / "counter.html")
    size = sum(path.stat().st_size for path in output.rglob("*.webp"))
    print(f"Wrote {len(spreads)} spreads to {output} ({size / 1024:.1f} KiB of images)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
