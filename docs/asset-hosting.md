# Book People — Asset Hosting (Phase 9)

This document describes the versioned asset hosting contract for Book People gameplay assets.

## Storage Solution

**Supabase Storage** is used for hosting book gameplay assets.

- **Bucket name**: `book-assets`
- **Bucket ID**: `book-assets`
- **Public**: `false` (objects are NOT publicly readable by default)
- **File size limit**: 10 MiB
- **Allowed MIME types**: `image/webp`, `image/jpeg`, `image/png`, `application/json`

## Versioned Asset Directory Structure

Assets are stored under a collision-resistant, versioned path:

```
books/<book-slug>/versions/<version-label>/<relative-asset-path>
```

Examples:

```
books/alice-loc-1885/versions/1/cover.webp
books/alice-loc-1885/versions/1/pages/p002.webp
books/tales-of-punjab-1894/versions/1/cover.webp
books/tales-of-punjab-1894/versions/1/pages/p000.webp
```

### Why this layout?

- **`books/<slug>`** — prevents collisions between different books
- **`versions/<label>`** — prevents collisions between versions of the same book
- **`<relative-asset-path>`** — preserves the canonical relative path from the content manifest
- **Version-specific** — the base URL + relative path uniquely identifies the correct version
- **Admin pipeline** — easy to inspect and debug
- **No history breakage** — old snapshots store relative paths; the base URL changes per environment

## Relative Path Convention

The database and content manifests store **only relative asset paths**:

- `cover.webp`
- `pages/p002.webp`
- `pages/p003.webp`

**Never store**:

- Absolute filesystem paths (`/Users/example/...`)
- Full HTTP URLs (`https://...`)
- Path traversal (`../`)
- Windows-style separators (`\`)

The existing `isRelativeAssetPath()` function in `@book-people/book-data` enforces this.

## Environment Variables

### Per-book base URL

```
EXPO_PUBLIC_BOOK_ASSET_BASE_URL_<BOOK_ID_UPPERCASE>
```

Examples:

```
EXPO_PUBLIC_BOOK_ASSET_BASE_URL_ALICE_LOC_1885=https://<ref>.supabase.co/storage/v1/object/public/book-assets/books/alice-loc-1885/versions/1
EXPO_PUBLIC_BOOK_ASSET_BASE_URL_TALES_OF_PUNJAB_1894=https://<ref>.supabase.co/storage/v1/object/public/book-assets/books/tales-of-punjab-1894/versions/1
```

### Generic base URL

```
EXPO_PUBLIC_BOOK_ASSET_BASE_URL
```

Used as fallback when no per-book override is set.

### Local development

```
EXPO_PUBLIC_BOOK_ASSET_BASE_URL=http://localhost:8000
```

Serves assets from the local review server.

## Local Development Asset Flow

1. `extract.py` generates `book.json` + `pages/*.webp` + `cover.webp` in `out/<book-id>/`
2. `validate.py` checks the working file
3. `validate.py --write-final` produces `book.final.json` with relative paths
4. `python3 -m http.server 8000 --directory out/<book-id>` serves assets locally
5. `EXPO_PUBLIC_BOOK_ASSET_BASE_URL=http://localhost:8000` resolves assets
6. Per-book overrides point to the correct subdirectory: `http://localhost:8000/book-people-alice-loc/alice-loc-1885`

## Staging Hosted Asset Flow

1. `tools/book-prep/publish.py` uploads assets to Supabase Storage
2. `EXPO_PUBLIC_BOOK_ASSET_BASE_URL=https://<ref>.supabase.co/storage/v1/object/public/book-assets`
3. Per-book overrides include the version path
4. `resolvePageAsset()` combines the base URL with the relative path from the manifest

## How Prepared Assets Are Uploaded

```bash
python tools/book-prep/publish.py /path/to/book-dir \
  --supabase-url https://<ref>.supabase.co \
  --service-role-key <KEY> \
  --dry-run
```

Configuration via environment variables:

- `SUPABASE_URL` — project REST endpoint
- `SUPABASE_SERVICE_ROLE_KEY` — service-role key for admin write access
- `SUPABASE_STORAGE_BUCKET` — bucket name (default: `book-assets`)

Never print or commit credentials. Use `--dry-run` to validate before uploading.

## How Assets Are Validated

The `publish.py` tool validates:

- Expected asset files exist
- Referenced manifest paths exist
- No absolute filesystem paths are stored
- No full HTTP URLs are accidentally stored in content manifests
- Image files are readable
- Required cover exists when configured
- Page/spread references resolve
- Asset paths do not escape the book/version directory
- Duplicate/collision-prone paths are rejected

## How a Future Admin Publishing System Should Use This Contract

1. Read `book.final.json` from the prepared book directory
2. Validate the manifest (use `publish.validate_book_json`)
3. Upload assets using `publish.upload_file` with the service-role key
4. Set `EXPO_PUBLIC_BOOK_ASSET_BASE_URL_<BOOK_ID>` in the deployment environment
5. Update the catalog migration with the new book/version
6. Run `supabase db reset` to apply the migration

The upload tool never requires the service-role key to be bundled into the app.

## Security

- The player app only performs **public asset reads** via HTTPS
- No service-role key is present in the frontend bundle
- Storage bucket is `public = false`
- Only authenticated users can read `books/` objects in the bucket
- No INSERT/UPDATE/DELETE policies exist for authenticated users on storage.objects
- Admin upload access uses a service-role key stored in environment variables only
