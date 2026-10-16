# Book People — Asset Hosting and Secure Publishing (Phase 11)

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

## Phase 11 secure admin workflow

The admin app calls the `book-publish` Supabase Edge Function with the signed-in
user's access token; it never receives a service-role credential. The function
checks `public.is_admin()`, verifies the requested book/version pair, accepts only
manifest-referenced relative image paths, and writes solely below
`books/<slug>/versions/<version-label>/` in `book-assets`.

Select the manifest's images in Secure publishing, upload them, then run hosted
validation. Upload retries compare SHA-256 hashes: identical objects are skipped;
different existing objects are reported as conflicts. Server validation checks
identity, required cover/page objects, supported image extensions, and manifest
hash before it can mark a version validated. Publish and unpublish use the same
server boundary and retain the database one-published-version index.

Deploy after applying migrations:

```bash
supabase db push
supabase functions deploy book-publish
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<server-only-secret>
```

The Edge Function requires `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY`. Set the last one as a function secret only—never in
an Expo or `EXPO_PUBLIC_*` variable. A 403 upload response means the JWT has no
admin claim; a conflict means an already hosted file differs; a missing-asset
validation error can be resolved by selecting that manifest asset and retrying.

## Admin claim provisioning

Publishing authorization continues to use the top-level JWT admin claim through
`public.is_admin()`. A Postgres Custom Access Token Hook reads the server-owned
`public.admin_users` table and issues that claim. User metadata and app metadata
are never an authorization source.

After applying the migration to a hosted project, manually enable
**Authentication → Hooks → Custom Access Token Hook** in the Supabase Dashboard
and select `public.custom_access_token_hook`. Create the staging Auth user
normally, then use the privileged SQL Editor to assign it:

```sql
insert into public.admin_users (user_id)
values ('<DEDICATED_ADMIN_USER_UUID>');
```

To revoke access, delete that user's row from `public.admin_users`. Sign out and
sign in again after a change so Auth issues a fresh token. Verify authorization
without printing a JWT by calling `supabase.rpc('is_admin')` from that signed-in
user's anon-key client: it must return true for the assigned user and false for
an ordinary user.
