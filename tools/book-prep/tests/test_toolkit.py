from __future__ import annotations
import json, os, subprocess, sys, tempfile, unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
EXTRACT, VALIDATE = ROOT / "tools/book-prep/extract.py", ROOT / "tools/book-prep/validate.py"

class ToolkitTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.root = Path(self.tmp.name); self.pdf = self.root / "book.pdf"
        import fitz
        doc = fitz.open()
        for i in range(42):
            page = doc.new_page(); page.draw_rect((40, 40, 200 + i, 200))
        doc.save(self.pdf); doc.close()
        self.command = [sys.executable, str(EXTRACT), str(self.pdf), "--id", "demo", "--title", "Demo", "--author", "A", "--first-left", "1", "--out", str(self.root / "out")]
        self.run_command(self.command, 0); self.path = self.root / "out/demo/book.json"

    def tearDown(self): self.tmp.cleanup()
    def run_command(self, command, code, env=None):
        result = subprocess.run(command, text=True, capture_output=True, env=env)
        self.assertEqual(result.returncode, code, result.stdout + result.stderr); return result
    def data(self): return json.loads(self.path.read_text())
    def write(self, data): self.path.write_text(json.dumps(data))

    def test_extract_writes_working_shape(self):
        data = self.data(); self.assertEqual(len(data["spreads"]), 21); self.assertTrue((self.path.parent / "cover.webp").is_file()); self.assertTrue((self.path.parent / "pages/p001.webp").is_file()); self.assertTrue(all(x[side]["people"] is None for x in data["spreads"] for side in ("left", "right")))
    def test_extract_refuses_overwrite_and_preserves_bytes(self):
        original = self.path.read_bytes(); self.run_command(self.command, 1); self.assertEqual(self.path.read_bytes(), original)
    def test_extract_force_overwrites(self):
        data = self.data(); data["title"] = "Changed"; self.write(data); self.run_command(self.command + ["--force"], 0); self.assertEqual(self.data()["title"], "Demo")

    def make_valid(self):
        data = self.data()
        for i, spread in enumerate(data["spreads"]): spread["left"]["people"], spread["right"]["people"] = i % 8, (i + 2) % 8
        data["spreads"][0]["flags"] = ["excluded"]; data["spreads"][0]["left"]["people"] = data["spreads"][0]["right"]["people"] = None
        data["spreads"][1]["flags"] = ["ambiguous"]; self.write(data); return data

    def test_validate_valid_book_passes(self):
        self.make_valid(); self.run_command([sys.executable, str(VALIDATE), str(self.path)], 0)
    def test_write_final_converts_excluded_nulls_to_zero(self):
        data = self.make_valid(); self.run_command([sys.executable, str(VALIDATE), str(self.path), "--write-final", "--base-url", "https://cdn.example/book"], 0)
        final = json.loads(self.path.with_name("book.final.json").read_text()); self.assertEqual(final["id"], data["id"]); self.assertEqual(len(final["spreads"]), len(data["spreads"])); self.assertTrue(final["coverImage"].startswith("https://cdn.example/book/")); self.assertTrue(all(isinstance(s[x]["people"], int) for s in final["spreads"] for x in ("left", "right")))
        self.assertEqual(final["spreads"][0]["left"]["people"], 0)

    def invalid(self, mutate):
        data = self.make_valid(); mutate(data); self.write(data); self.run_command([sys.executable, str(VALIDATE), str(self.path)], 1)
    def test_duplicate_spread_id_fails(self): self.invalid(lambda d: d["spreads"][1].__setitem__("id", d["spreads"][0]["id"]))
    def test_negative_count_fails(self): self.invalid(lambda d: d["spreads"][1]["left"].__setitem__("people", -1))
    def test_string_count_fails(self): self.invalid(lambda d: d["spreads"][1]["left"].__setitem__("people", "3"))
    def test_bool_count_fails(self): self.invalid(lambda d: d["spreads"][1]["left"].__setitem__("people", True))
    def test_non_excluded_null_fails(self): self.invalid(lambda d: d["spreads"][1]["left"].__setitem__("people", None))
    def test_missing_image_fails(self): self.invalid(lambda d: d["spreads"][1]["left"].__setitem__("image", "missing.webp"))
    def test_fewer_than_twenty_eligible_fails(self): self.invalid(lambda d: d.__setitem__("spreads", d["spreads"][:19]))
    def test_both_zero_is_not_eligible(self):
        data = self.make_valid(); data["spreads"][1]["left"]["people"] = data["spreads"][1]["right"]["people"] = 0; self.write(data)
        result = self.run_command([sys.executable, str(VALIDATE), str(self.path)], 1); self.assertIn("fewer than 20 eligible", result.stdout)
    def test_excluded_null_passes(self): self.make_valid(); self.run_command([sys.executable, str(VALIDATE), str(self.path)], 0)
    def test_final_preserves_excluded_entered_integer_and_base_url_forms(self):
        data = self.make_valid(); data["spreads"][0]["left"]["people"] = 7; self.write(data)
        for url in ("https://cdn.example/book", "https://cdn.example/book/"):
            self.run_command([sys.executable, str(VALIDATE), str(self.path), "--write-final", "--base-url", url], 0)
            final = json.loads(self.path.with_name("book.final.json").read_text()); self.assertEqual(final["spreads"][0]["left"]["people"], 7); self.assertEqual(final["spreads"][0]["right"]["people"], 0); self.assertTrue(final["coverImage"].startswith("https://cdn.example/book/"))
    def test_write_final_refuses_validation_errors(self):
        self.invalid(lambda d: d["spreads"][1]["left"].__setitem__("people", None))
        result = subprocess.run([sys.executable, str(VALIDATE), str(self.path), "--write-final", "--base-url", "https://cdn.example"], text=True, capture_output=True); self.assertEqual(result.returncode, 1); self.assertFalse(self.path.with_name("book.final.json").exists())
    def test_end_to_end_final_is_accepted_by_game_core(self):
        self.make_valid(); self.run_command([sys.executable, str(VALIDATE), str(self.path), "--write-final", "--base-url", "https://cdn.example/book"], 0)
        environment = {**os.environ, "BOOK_PREP_FINAL": str(self.path.with_name("book.final.json"))}
        self.run_command(["pnpm", "--filter", "@book-people/game-core", "exec", "vitest", "run", "--root", str(ROOT), "tools/book-prep/tests/game-core-compat.test.ts"], 0, environment)

if __name__ == "__main__": unittest.main()
