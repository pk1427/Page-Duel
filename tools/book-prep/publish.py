#!/usr/bin/env python3
"""Publish prepared book assets to Supabase Storage.

Uploads the gameplay assets from a prepared book directory (containing
book.final.json and its referenced image files) to the `book-assets` storage
bucket under a versioned path:

    books/<book-slug>/versions/<version-label>/<relative-asset-path>

Usage:
    python publish.py <book_dir> [--slug SLUG] [--version LABEL]
                        [--supabase-url URL] [--service-role-key KEY]
                        [--bucket NAME] [--dry-run] [--force]

Configuration via environment variables:
    SUPABASE_URL          — project REST endpoint (e.g. https://<ref>.supabase.co)
    SUPABASE_SERVICE_ROLE_KEY — service-role key for admin write access
    SUPABASE_STORAGE_BUCKET   — bucket name (default: book-assets)

Never prints credentials. Dry-run mode validates without uploading.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_BUCKET = "book-assets"
ALLOWED_IMAGE_EXTS = {".webp", ".jpg", ".jpeg", ".png"}
ALLOWED_DOC_EXTS = {".json"}  # book.final.json if included


def get_env(name: str, required: bool = False, default: str | None = None) -> str | None:
    val = os.environ.get(name)
    if not val and required:
        print(f"ERROR: {name} environment variable is required.", file=sys.stderr)
        sys.exit(1)
    return val or default


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def upload_file(
    supabase_url: str,
    supabase_key: str,
    bucket: str,
    object_path: str,
    file_path: Path,
) -> bool:
    """Upload a single file to Supabase Storage. Returns True on success."""
    url = f"{supabase_url}/storage/v1/object/{bucket}/{object_path}"
    file_hash = sha256_file(file_path)

    ext = file_path.suffix.lower()
    mime_type = {
        ".webp": "image/webp",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".json": "application/json",
    }.get(ext, "application/octet-stream")

    with open(file_path, "rb") as f:
        body = f.read()

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": mime_type,
            "x-upsert": "true",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status == 200
    except urllib.error.HTTPError as e:
        print(f"  UPLOAD ERROR {file_hash[:12]} {object_path}: HTTP {e.code} {e.reason}", file=sys.stderr)
        return False


def check_exists(
    supabase_url: str,
    supabase_key: str,
    bucket: str,
    object_path: str,
) -> bool:
    """Check if an object exists in storage."""
    url = f"{supabase_url}/storage/v1/object/{bucket}/{object_path}"
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", f"Bearer {supabase_key}")
    try:
        urllib.request.urlopen(req, timeout=30)
        return True
    except urllib.error.HTTPError as e:
        return e.code != 404
    except urllib.error.URLError:
        return False


def validate_book_json(book: dict, book_dir: Path) -> list[str]:
    """Validate book.final.json structure and referenced asset paths."""
    errors: list[str] = []

    if not book.get("id"):
        errors.append("missing book id")
    if not book.get("title"):
        errors.append("missing title")
    if not book.get("version"):
        errors.append("missing version")
    if book.get("status") not in ("ready", "published"):
        errors.append(f"unexpected status: {book.get('status')} (expected 'ready' or 'published')")

    spreads = book.get("spreads")
    if not isinstance(spreads, list) or len(spreads) == 0:
        errors.append("book has no spreads")
        return errors

    seen_ids: set[str] = set()
    seen_pages: set[int] = set()

    for spread in spreads:
        sid = spread.get("id")
        if not sid:
            errors.append(f"spread without id: {spread}")
            continue
        if sid in seen_ids:
            errors.append(f"duplicate spread id: {sid}")
        seen_ids.add(sid)

        excluded = "excluded" in spread.get("flags", [])

        for side_name in ("left", "right"):
            side = spread.get(side_name, {})
            page = side.get("page")
            if not isinstance(page, int) or page < 0:
                errors.append(f"{sid} {side_name}: page must be a non-negative integer")
            elif page in seen_pages:
                errors.append(f"duplicate page reference: {page}")
            else:
                seen_pages.add(page)

            image = side.get("image", "")
            if not image:
                if not excluded:
                    errors.append(f"{sid} {side_name}: missing image reference")
                continue

            if image.startswith("placeholder:"):
                continue

            if not image or image.startswith("/") or "\\" in image or "://" in image:
                errors.append(f"{sid} {side_name}: image must be a relative path: {image}")
                continue

            if ".." in Path(image).parts:
                errors.append(f"{sid} {side_name}: image path escapes directory: {image}")
                continue

            asset_path = book_dir / image
            if not asset_path.is_file():
                errors.append(f"{sid} {side_name}: missing image asset: {image}")

            ext = Path(image).suffix.lower()
            if ext not in ALLOWED_IMAGE_EXTS:
                errors.append(f"{sid} {side_name}: unexpected image format: {ext}")

            people = side.get("people")
            if people is None and not excluded:
                errors.append(f"{sid} {side_name}: uncounted people (null) on non-excluded spread")
            elif people is not None and (not isinstance(people, int) or people < 0):
                errors.append(f"{sid} {side_name}: people must be a non-negative integer or null")

    cover = book.get("coverImage")
    if cover and not cover.startswith("placeholder:"):
        if cover.startswith("/") or "\\" in cover or "://" in cover:
            errors.append(f"cover image must be a relative path: {cover}")
        elif ".." in Path(cover).parts:
            errors.append(f"cover image path escapes directory: {cover}")
        elif not (book_dir / cover).is_file():
            errors.append(f"missing cover image asset: {cover}")

    return errors


def collect_asset_paths(book: dict) -> list[str]:
    """Collect all relative asset paths from the book manifest."""
    paths: list[str] = []
    cover = book.get("coverImage", "")
    if cover and not cover.startswith("placeholder:"):
        if not cover.startswith("/") and "\\" not in cover and "://" not in cover:
            paths.append(cover)

    for spread in book.get("spreads", []):
        for side in (spread.get("left", {}), spread.get("right", {})):
            image = side.get("image", "")
            if image and not image.startswith("placeholder:"):
                if not image.startswith("/") and "\\" not in image and "://" not in image:
                    paths.append(image)

    seen: set[str] = set()
    return [p for p in paths if not (p in seen or seen.add(p))]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("book_dir", type=Path, help="Directory containing book.final.json and assets")
    parser.add_argument("--slug", type=str, default=None, help="Book slug (defaults to book id)")
    parser.add_argument("--version", type=str, default=None, help="Version label (defaults to book.version)")
    parser.add_argument("--supabase-url", type=str, default=None, help="Supabase URL")
    parser.add_argument("--service-role-key", type=str, default=None, help="Service-role key")
    parser.add_argument("--bucket", type=str, default=DEFAULT_BUCKET, help="Storage bucket name")
    parser.add_argument("--dry-run", action="store_true", help="Validate only, do not upload")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files without checking")
    args = parser.parse_args()

    book_json_path = args.book_dir / "book.final.json"
    if not book_json_path.is_file():
        print(f"ERROR: {book_json_path} not found", file=sys.stderr)
        return 1

    book = json.loads(book_json_path.read_text(encoding="utf-8"))

    slug = args.slug or book.get("id")
    version_label = args.version or book.get("version")
    if not slug or not version_label:
        print("ERROR: missing slug or version label", file=sys.stderr)
        return 1

    errors = validate_book_json(book, args.book_dir)
    if errors:
        print("VALIDATION FAILED:")
        for e in errors:
            print(f"  {e}")
        return 1

    asset_paths = collect_asset_paths(book)
    if not asset_paths:
        print("No uploadable assets found.")
        return 0

    if args.dry_run:
        print(f"Dry run: validated {len(asset_paths)} asset paths for {slug} v{version_label}")
        for p in asset_paths:
            print(f"  {p}")
        return 0

    supabase_url = args.supabase_url or get_env("SUPABASE_URL", required=True)
    supabase_key = args.service_role_key or get_env("SUPABASE_SERVICE_ROLE_KEY", required=True)

    print(f"Publishing {slug} v{version_label}: {len(asset_paths)} assets -> {args.bucket}")
    print(f"  base path: books/{slug}/versions/{version_label}")

    uploaded = 0
    skipped = 0
    failed = 0

    for rel_path in asset_paths:
        object_path = f"books/{slug}/versions/{version_label}/{rel_path}"
        local_path = args.book_dir / rel_path

        if not args.force and check_exists(supabase_url, supabase_key, args.bucket, object_path):
            print(f"  SKIP (exists): {rel_path}")
            skipped += 1
            continue

        if upload_file(supabase_url, supabase_key, args.bucket, object_path, local_path):
            print(f"  UPLOADED: {rel_path}")
            uploaded += 1
        else:
            print(f"  FAILED: {rel_path}")
            failed += 1

    print(f"\nResults: {uploaded} uploaded, {skipped} skipped, {failed} failed")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
