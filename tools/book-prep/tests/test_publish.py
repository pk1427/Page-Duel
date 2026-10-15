from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import publish


class PublishValidationTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def make_book_dir(self, book: dict, assets: dict[str, bytes | str] | None = None):
        """Create a book directory with book.final.json and asset files."""
        book_dir = self.root / book["id"]
        book_dir.mkdir()
        (book_dir / "book.final.json").write_text(json.dumps(book), encoding="utf-8")

        if assets:
            for rel_path, content in assets.items():
                asset_path = book_dir / rel_path
                asset_path.parent.mkdir(parents=True, exist_ok=True)
                if isinstance(content, str):
                    content = content.encode("utf-8")
                asset_path.write_bytes(content)

        return book_dir

    def make_valid_book(self):
        return {
            "id": "test-book",
            "title": "Test Book",
            "author": "Test Author",
            "version": "1",
            "status": "ready",
            "coverImage": "cover.webp",
            "spreads": [
                {
                    "id": "s001",
                    "left": {"page": 2, "image": "pages/p002.webp", "people": 0},
                    "right": {"page": 3, "image": "pages/p003.webp", "people": 1},
                    "flags": [],
                },
                {
                    "id": "s002",
                    "left": {"page": 4, "image": "pages/p004.webp", "people": 2},
                    "right": {"page": 5, "image": "pages/p005.webp", "people": 0},
                    "flags": [],
                },
            ],
        }

    def test_valid_book_passes_validation(self):
        book = self.make_valid_book()
        book_dir = self.make_book_dir(
            book,
            {
                "cover.webp": b"fake-cover",
                "pages/p002.webp": b"fake-page-2",
                "pages/p003.webp": b"fake-page-3",
                "pages/p004.webp": b"fake-page-4",
                "pages/p005.webp": b"fake-page-5",
            },
        )
        errors = publish.validate_book_json(book, book_dir)
        self.assertEqual(errors, [], f"Expected no errors, got: {errors}")

    def test_missing_cover_asset_fails(self):
        book = self.make_valid_book()
        book_dir = self.make_book_dir(
            book,
            {"pages/p002.webp": b"x", "pages/p003.webp": b"x", "pages/p004.webp": b"x", "pages/p005.webp": b"x"},
        )
        errors = publish.validate_book_json(book, book_dir)
        self.assertIn("missing cover image asset: cover.webp", errors)

    def test_missing_page_asset_fails(self):
        book = self.make_valid_book()
        book_dir = self.make_book_dir(
            book,
            {"cover.webp": b"x", "pages/p002.webp": b"x"},
        )
        errors = publish.validate_book_json(book, book_dir)
        self.assertTrue(any("missing image" in e for e in errors))

    def test_absolute_paths_rejected(self):
        book = self.make_valid_book()
        book["spreads"][0]["left"]["image"] = "/absolute/path/p002.webp"
        # No need to create the absolute file — validation rejects it before checking existence
        book_dir = self.make_book_dir(
            book,
            {"cover.webp": b"x", "pages/p002.webp": b"x", "pages/p003.webp": b"x", "pages/p004.webp": b"x", "pages/p005.webp": b"x"},
        )
        errors = publish.validate_book_json(book, book_dir)
        self.assertTrue(any("must be a relative path" in e for e in errors))

    def test_path_traversal_rejected(self):
        book = self.make_valid_book()
        book["spreads"][0]["left"]["image"] = "../escape.webp"
        book_dir = self.make_book_dir(
            book,
            {"cover.webp": b"x", "pages/p002.webp": b"x", "pages/p003.webp": b"x", "pages/p004.webp": b"x", "pages/p005.webp": b"x"},
        )
        errors = publish.validate_book_json(book, book_dir)
        self.assertTrue(any("escapes directory" in e for e in errors))

    def test_http_url_rejected(self):
        book = self.make_valid_book()
        book["coverImage"] = "http://example.com/cover.webp"
        book_dir = self.make_book_dir(
            book,
            {"pages/p002.webp": b"x", "pages/p003.webp": b"x", "pages/p004.webp": b"x", "pages/p005.webp": b"x"},
        )
        errors = publish.validate_book_json(book, book_dir)
        self.assertTrue(any("must be a relative path" in e for e in errors))

    def test_duplicate_spread_ids_rejected(self):
        book = self.make_valid_book()
        book["spreads"][0]["id"] = book["spreads"][1]["id"]
        book_dir = self.make_book_dir(
            book,
            {"cover.webp": b"x", "pages/p002.webp": b"x", "pages/p003.webp": b"x", "pages/p004.webp": b"x", "pages/p005.webp": b"x"},
        )
        errors = publish.validate_book_json(book, book_dir)
        self.assertTrue(any("duplicate spread id" in e for e in errors))

    def test_duplicate_page_references_rejected(self):
        book = self.make_valid_book()
        book["spreads"][1]["left"]["page"] = 2  # same as s001 left
        book_dir = self.make_book_dir(
            book,
            {"cover.webp": b"x", "pages/p002.webp": b"x", "pages/p003.webp": b"x", "pages/p004.webp": b"x", "pages/p005.webp": b"x"},
        )
        errors = publish.validate_book_json(book, book_dir)
        self.assertTrue(any("duplicate page reference" in e for e in errors))

    def test_placeholder_assets_skipped(self):
        book = self.make_valid_book()
        book["id"] = "placeholder-book"
        book["coverImage"] = "placeholder:0"
        book["spreads"] = [
            {
                "id": "p001",
                "left": {"page": 1, "image": "placeholder:5", "people": 5},
                "right": {"page": 2, "image": "placeholder:8", "people": 8},
                "flags": [],
            },
        ]
        book_dir = self.make_book_dir(book, assets=None)
        errors = publish.validate_book_json(book, book_dir)
        self.assertEqual(errors, [], f"Expected no errors for placeholder book, got: {errors}")

    def test_collect_asset_paths_excludes_placeholders(self):
        book = {
            "id": "test",
            "version": "1",
            "status": "ready",
            "coverImage": "cover.webp",
            "spreads": [
                {"id": "p1", "left": {"image": "placeholder:0"}, "right": {"image": "pages/r.webp"}, "flags": []},
            ],
        }
        paths = publish.collect_asset_paths(book)
        self.assertIn("cover.webp", paths)
        self.assertIn("pages/r.webp", paths)
        self.assertNotIn("placeholder:0", paths)

    def test_collect_asset_paths_deduplicates(self):
        book = {
            "id": "test",
            "version": "1",
            "status": "ready",
            "coverImage": "cover.webp",
            "spreads": [
                {"id": "p1", "left": {"image": "cover.webp"}, "right": {"image": "cover.webp"}, "flags": []},
            ],
        }
        paths = publish.collect_asset_paths(book)
        self.assertEqual(paths, ["cover.webp"])

    def test_invalid_status_rejected(self):
        book = self.make_valid_book()
        book["status"] = "draft"
        book_dir = self.make_book_dir(
            book,
            {"cover.webp": b"x", "pages/p002.webp": b"x", "pages/p003.webp": b"x", "pages/p004.webp": b"x", "pages/p005.webp": b"x"},
        )
        errors = publish.validate_book_json(book, book_dir)
        self.assertTrue(any("unexpected status" in e for e in errors))

    def test_uncounted_page_on_ready_rejected(self):
        book = self.make_valid_book()
        book["spreads"][0]["left"]["people"] = None
        book["spreads"][0]["flags"] = []
        book_dir = self.make_book_dir(
            book,
            {"cover.webp": b"x", "pages/p002.webp": b"x", "pages/p003.webp": b"x", "pages/p004.webp": b"x", "pages/p005.webp": b"x"},
        )
        errors = publish.validate_book_json(book, book_dir)
        self.assertTrue(any("uncounted" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
