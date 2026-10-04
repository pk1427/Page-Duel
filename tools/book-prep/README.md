# Book People book-prep toolkit

Tested on Python 3.9; 3.10+ recommended.

Choose a crowd-heavy illustrated public-domain title from Internet Archive. Draws are boring: crowds and wide count variation make a better game, while single-protagonist books usually produce mostly 0–2 counts. Download its PDF, then run:

```sh
pip install -r requirements.txt
python extract.py book.pdf --id my-book --title "My Book" --author "Author" --first-left 12
```

Find `--first-left` by locating the PDF page where the first illustration spread begins. In printed books, a spread is normally even-left/odd-right. For the most reliable local review workflow, serve the generated folder and open the counter in Chrome:

```sh
python3 -m http.server 8000 --directory out/my-book
```

Visit `http://localhost:8000/counter.html`; it automatically loads `./book.json` and its `pages/` assets. When opening `counter.html` via `file://`, use **Choose Book Folder** in Chrome instead—the regular JSON file picker cannot grant access to sibling image files. Count each page, then download `book.json` over `out/my-book/book.json`.

`null` means not counted yet. Excluded spreads do not need counts. The final file always contains integers.

Validate working data and prepare hosted data:

```sh
python validate.py out/my-book/book.json
python validate.py out/my-book/book.json --write-final --base-url https://example.com/books/my-book
```

The latter writes `book.final.json`, suitable for the game.
