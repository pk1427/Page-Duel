# Book People content platform

Book People is local-first: adding a book is primarily a content operation. Game core receives a
generic, fully counted `Book`; it has no knowledge of PDFs, sources, asset hosts, or the catalog.

```text
rights-checked source → extract → draft pack → human annotation → validate → final pack
→ catalog registration → runtime asset delivery → generic game core
```

## Canonical content-pack contract

Each pack has this portable shape. Its JSON contains only relative asset paths; large WebP files
may live outside Git.

```text
content/<book-id>/
  book.json
  cover.webp
  pages/
    p001.webp
```

`book.json` contains `id`, `title`, optional `author`, `year`, `description`, `source`, `version`,
`status`, `coverImage`, and `spreads`. A source records its publisher/archive name, stable URL, and
rights note. A spread has a unique `id`, `left` and `right` pages, optional `flags` (`excluded` or
`ambiguous`), and optional annotation `notes`. A page has a unique numeric `page`, optional
`sourcePage` (1-based PDF page), optional `printedPage`, a relative `image`, and `people`.

`people` is `null` only during `draft`. Excluded draft pages may remain null; finalization turns
those remaining null values into zero. `ready` and `published` packs have integers on every page.
No pack may contain an absolute filesystem path, a localhost URL, a URL of any kind, or `..` path
segments. Canonical examples are `cover.webp` and `pages/p002.webp`.

`packages/book-data` validates metadata, statuses, IDs, paths, counts, and optional local asset
manifests. It reports the eligible-spread count plus 5/10/15-round availability. Game core then
performs its own gameplay validation when `toPlayableBook` creates its input.

## Lifecycle and catalog

`draft` packs are visible to preparation tooling but never to players. Valid `ready` and
`published` packs are the only catalog entries returned by `listPlayableBooks()`. Catalog registration
is data configuration in `packages/book-data/src/index.ts`, not a game-code change.

The shipped catalog keeps the ready Practice Book and Alice's Adventures in Wonderland. Alice's
95 human-counted spreads and 34 eligible spreads are unchanged. The Practice Book stays an
in-memory deterministic development pack.

## Asset delivery

The Expo app resolves the canonical relative image reference at runtime. It checks, in order:

1. `EXPO_PUBLIC_BOOK_ASSET_BASE_URL_<BOOK_ID>` (for example
   `EXPO_PUBLIC_BOOK_ASSET_BASE_URL_ALICE_LOC_1885`),
2. `EXPO_PUBLIC_BOOK_ASSET_BASE_URL`,
3. the local review server default, `http://localhost:8000`.

This supports local HTTP serving, static hosting, object storage, or a CDN without modifying a
book pack or game core. Production must set a deployed base URL. The local WebP review workspace
remains ignored under `.local/`; it is not a release asset strategy.

## Add Book #2

1. Choose an illustrated source and record a stable source URL and explicit rights/access evidence.
2. Download the source PDF outside the committed content package.
3. Run `extract.py` to create a draft with real scanned WebP pages and source/printed page mapping.
4. Serve the folder locally and use `counter.html` for human annotation. Do not use automatic
   detection for authoritative counts.
5. Run `content-status.py` while counting, then `validate.py` after all normal spreads are counted.
6. Run `validate.py --write-final`; it creates `book.final.json` with relative paths and only
   integer counts.
7. Validate the final pack and add its JSON data to `packages/book-data`; register it in the
   catalog only as `ready` or `published`.
8. Configure its development or production asset base, run book-data/game-core tests, and verify
   a 5, 10, and 15 round game in Expo.

The reference is Alice: Library of Congress LCCN 16005942, the 1885 J. W. Lovell Company edition,
which LOC identifies as public domain and free to use and reuse. The generated local review pack
is `.local/book-people-alice-loc/alice-loc-1885/`; its finalized data is represented by
`packages/book-data/src/alice.final.json`.

## Second-book candidate

The next candidate is _The Adventures of Pinocchio_ (Library of Congress LCCN 04022857, Ginn and
Company, 1904). The LOC record provides a PDF, 232 images, and states that its books are public
domain and free to use and reuse. It has numerous original drawings by Charles Copeland, but it is
not yet catalogued or playable: illustration density and the required 30 eligible spreads remain
human-annotation questions. Its direct source PDF is:

`https://tile.loc.gov/storage-services/public/gdcmassbookdig/adventuresofpino00coll_4/adventuresofpino00coll_4.pdf`

This candidate is intentionally kept out of the player catalog until the full human-counted final
pack has passed validation.
