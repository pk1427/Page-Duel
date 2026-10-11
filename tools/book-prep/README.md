# Book People book-prep toolkit

Tested on Python 3.9; 3.10+ recommended.

Choose an illustrated source with explicit reuse rights from the Library of Congress or another
reputable archive. Record the source URL and rights note before downloading. Draws are boring:
crowds and wide count variation make a better game, while single-protagonist books usually produce
mostly 0–2 counts. Download its PDF, then run:

```sh
pip install -r requirements.txt
python extract.py book.pdf --id my-book --title "My Book" --author "Author" --year 1904 --first-left 12
```

Find `--first-left` by locating the PDF page where the first illustration spread begins. In printed books, a spread is normally even-left/odd-right. For the most reliable local review workflow, serve the generated folder and open the counter in Chrome:

```sh
python3 -m http.server 8000 --directory out/my-book
```

Visit `http://localhost:8000/counter.html`; it automatically loads `./book.json` and its `pages/` assets. When opening `counter.html` via `file://`, use **Choose Book Folder** in Chrome instead—the regular JSON file picker cannot grant access to sibling image files. Count each page, then download `book.json` over `out/my-book/book.json`.

`null` means not counted yet. Excluded spreads do not need counts. The final file always contains integers.

Inspect annotation progress, validate working data, and finalize it:

```sh
python content-status.py out/my-book/book.json
python validate.py out/my-book/book.json
python validate.py out/my-book/book.json --write-final
```

The latter writes `book.final.json`, marks it `ready`, converts remaining excluded `null` values to
zero, and preserves relative references such as `pages/p002.webp`. Do not bake a development host
or a filesystem path into content. Configure the delivery host at runtime with
`EXPO_PUBLIC_BOOK_ASSET_BASE_URL` or `EXPO_PUBLIC_BOOK_ASSET_BASE_URL_<BOOK_ID>`.

`extract.py` records both the source PDF page (`sourcePage`) and the derived printed label
(`printedPage`) for every generated page. The command refuses to overwrite a working `book.json`
without `--force`, protecting human annotation. The final JSON still needs the TypeScript
content-pack validation and catalog registration before it can be exposed to players.

## Source discovery

Before choosing a book, screen downloaded source PDFs without creating gameplay data:

```sh
python content-candidate-analysis.py .local/book-people-candidate-research/candidate/source.pdf
```

This command reports reproducible source-screening metrics such as PDF page count, fixed pair
count, OCR text density, low-text pages, and caption-keyword hints. It does **not** detect or count
people. Any people-density figure made from this stage is only a heuristic estimate and must be
visually checked; final people counts still come exclusively from `counter.html` human annotation.
