from __future__ import annotations
import json, subprocess, sys, tempfile, unittest
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
    def run_command(self, command, code):
        result = subprocess.run(command, text=True, capture_output=True)
        self.assertEqual(result.returncode, code, result.stdout + result.stderr); return result
    def data(self): return json.loads(self.path.read_text())
    def write(self, data): self.path.write_text(json.dumps(data))

    def test_extract_force_and_working_shape(self):
        data = self.data(); self.assertEqual(len(data["spreads"]), 21); self.assertTrue((self.path.parent / "cover.webp").is_file()); self.assertTrue((self.path.parent / "pages/p001.webp").is_file()); self.assertTrue(all(x[side]["people"] is None for x in data["spreads"] for side in ("left", "right")))
        original = self.path.read_text(); self.run_command(self.command, 1); self.assertEqual(self.path.read_text(), original); self.run_command(self.command + ["--force"], 0)

    def make_valid(self):
        data = self.data()
        for i, spread in enumerate(data["spreads"]): spread["left"]["people"], spread["right"]["people"] = i % 8, (i + 2) % 8
        data["spreads"][0]["flags"] = ["excluded"]; data["spreads"][0]["left"]["people"] = data["spreads"][0]["right"]["people"] = None
        data["spreads"][1]["flags"] = ["ambiguous"]; self.write(data); return data

    def test_validate_errors_and_final(self):
        data = self.make_valid(); self.run_command([sys.executable, str(VALIDATE), str(self.path)], 0)
        self.run_command([sys.executable, str(VALIDATE), str(self.path), "--write-final", "--base-url", "https://cdn.example/book"], 0)
        final = json.loads(self.path.with_name("book.final.json").read_text()); self.assertEqual(final["id"], data["id"]); self.assertEqual(len(final["spreads"]), len(data["spreads"])); self.assertTrue(final["coverImage"].startswith("https://cdn.example/book/")); self.assertTrue(all(isinstance(s[x]["people"], int) for s in final["spreads"] for x in ("left", "right")))
        cases = [(lambda d: d["spreads"].__setitem__(1, {**d["spreads"][1], "id": d["spreads"][0]["id"]})), (lambda d: d["spreads"][1]["left"].__setitem__("people", -1)), (lambda d: d["spreads"][1]["left"].__setitem__("people", "1")), (lambda d: d["spreads"][1]["left"].__setitem__("people", None)), (lambda d: d["spreads"][1]["left"].__setitem__("image", "missing.webp")), (lambda d: d.__setitem__("spreads", d["spreads"][:19]))]
        for mutate in cases:
            d = self.make_valid(); mutate(d); self.write(d); self.run_command([sys.executable, str(VALIDATE), str(self.path)], 1)

if __name__ == "__main__": unittest.main()
