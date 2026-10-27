# Local book preparation and secure publishing

This is the current Phase 12 workflow for adding an illustrated book. It is
local-first: PDF rendering and count review happen on the administrator's
computer; the existing Phase 11 service uploads only the reviewed, prepared
assets and publishes only a server-validated version.

## Before you start

Only use a source for which you have recorded reuse rights (for example,
public-domain material or an explicit licence). Keep the source PDF outside
Git. Never upload a source PDF to the public `book-assets` bucket.

You need Python 3.10+ and the preparation dependencies:

```sh
cd ~/Desktop/book-people/tools/book-prep
python3 -m pip install -r requirements.txt
```

## 1. Create a draft package from a PDF

Choose a lowercase slug before extracting. It must match the Admin book slug
and the manifest `id` exactly.

```sh
cd ~/Desktop/book-people/tools/book-prep
python3 extract.py /absolute/path/to/source.pdf \
  --id my-book-1904 \
  --title "My Book" \
  --author "Author Name" \
  --first-left 12 \
  --out .local/prepared-books
```

`--first-left` is the 1-based source-PDF page for the first left page in the
first gameplay spread. Add `--cover`, `--last`, or `--page-offset` when the
source needs them. The command creates:

```text
.local/prepared-books/my-book-1904/
  book.json
  cover.webp
  pages/*.webp
  counter.html
```

The generated `book.json` is a **draft**. Its people values are deliberately
`null`; it cannot be published.

## 2. Review every people count

Serve the prepared directory locally:

```sh
python3 -m http.server 8000 --directory .local/prepared-books/my-book-1904
```

Open `http://localhost:8000/counter.html` in Chrome. Count both pages of each
spread. Use `ambiguous` when a decision needs a later re-check and `excluded`
when the whole spread should not enter gameplay. Download the updated
`book.json` back into the prepared folder when finished.

No AI count is authoritative in this phase. Any future AI assistant may make
suggestions, but an administrator must still review and approve every count.

## 3. Check and finalize locally

```sh
cd ~/Desktop/book-people/tools/book-prep
python3 content-status.py .local/prepared-books/my-book-1904/book.json
python3 validate.py .local/prepared-books/my-book-1904/book.json
python3 validate.py .local/prepared-books/my-book-1904/book.json --write-final
```

Do not proceed unless validation succeeds. The final command creates
`book.final.json`, with status `ready`, integer count values, and relative
asset paths only.

## 4. Create the catalog book and version in Admin

1. Open the Admin dashboard and create a book using the same slug.
2. New books always start as **Draft**.
3. Open that book and select **New Version**.
4. Use a version label that exactly matches `book.final.json`'s `version`.
5. Paste the complete contents of `book.final.json` into **Content JSON** and
   create the version.

## 5. Upload, validate, and publish

1. Open the new version and select **Upload Assets**.
2. Confirm or paste the same final manifest.
3. Select `cover.webp` and every image referenced below `pages/`.
4. Select **Upload assets**. The service accepts only manifest-referenced
   image paths and detects conflicting retry uploads.
5. Select **Validate hosted version**.
6. Return to Version Details, run validation if needed, then select
   **Publish**.

Only secure server-side validation can mark a version validated; only the
secure publish action makes it visible to players.

## Recovery and cleanup

- If local validation fails, fix the local manifest/counts and repeat from
  step 3. Do not hand-edit hosted validation fields.
- If an upload is interrupted, reselect the same files and retry. Identical
  bytes are idempotent; different bytes at the same path are rejected.
- To remove a test book from player visibility, use **Unpublish** first. Delete
  test records only when you are certain their associated history is not needed.
