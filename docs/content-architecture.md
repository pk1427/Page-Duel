# Book content architecture

Book People separates book preparation from gameplay:

```text
SOURCE
  ↓
INGESTION
  ↓
CONTENT PACK
  ↓
VALIDATION
  ↓
BOOK CATALOG
  ↓
GAME CORE
  ↓
EXPO APP
```

## Game core

`packages/game-core` is a pure, deterministic TypeScript state machine. It accepts a generic
`Book` in `startGame` and uses only spread IDs, page image references, people counts, and
exclusion flags. It has no source, PDF, network, React, or Expo dependencies.

## Content packs and catalog

`packages/book-data` owns `BookContent`: metadata, lifecycle status, page references, spreads,
and annotation values. Counts may be `null` while a pack is a `draft`; only fully counted `ready`
or `published` packs can be converted to the game-core `Book` type.

The catalog retains both ready content and drafts. `listPlayableBooks()` exposes only validated
ready/published packs, so an incomplete Alice pack can be tracked without entering a game.
The current catalog contains the ready Practice Book and metadata-only draft Alice.

`resolvePageAsset` is the content-side seam for page delivery. Canonical content stores relative
references such as `pages/p002.webp`; the Expo app provides an environment-specific base URL at
runtime. Development defaults Alice to `http://localhost:8000` for the local review server.
Release/native builds set `EXPO_PUBLIC_ALICE_ASSET_BASE_URL`, while web production may serve the
same relative assets from its own origin. Local source files are never imported into game-core or
committed.

## Validation

Content validation checks book and spread IDs, title/version, page references, duplicate pages,
valid counts, and whether a ready/published pack has any uncounted pages. Game-core performs its
own final gameplay validation after receiving a playable `Book`.

## Future ingestion

Source adapters may normalize Library of Congress, Internet Archive, or other permitted sources
into draft content packs. Human annotation and validation happen before publication. Source APIs
and ingestion are build/preparation concerns, never runtime dependencies of gameplay.

## Human-count completion check

Human annotation is authoritative in V1. Run the non-mutating report before creating a ready
content pack:

```sh
python3 tools/book-prep/content-status.py .local/book-people-alice-loc/alice-loc-1885/book.json
```

It reports counted/remaining spreads, excluded and ambiguous flags, and existing preparation
validation errors. A non-zero exit and `Status: INCOMPLETE` mean the book must remain draft.
