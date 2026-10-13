# Book People — Product Architecture V2 (canonical)

This document is the product source of truth. Do not change the journey, route
protection, or game rules without updating this file first.

## Player journey

Home → Play → Sign In / Create Account (when signed out) → Bookshelf → Match
Setup → Gameplay → Results.

- Authentication is required to play. There is no guest gameplay fallback.
- Home (`/`) and How to Play (`/how-to-play`) are public.
- Play always follows the auth rules: signed-in users go to the Bookshelf;
  signed-out users go to Sign In with a safe internal return (`next=/books`,
  allowlisted in `src/auth-routing.ts` — never an external URL).
- Protected routes: `/books`, `/setup`, `/game`, `/result`, `/profile`.
  Protection is route-level (`src/require-auth.tsx`), never button-hiding alone.
  Direct URLs, refreshes, browser Back, and restored sessions follow the same rules.
- After authentication initiated by Play, continue to Bookshelf. Signup
  establishes a session and continues to Bookshelf when successful.
- Sign-out returns Home; protected routes stay blocked. A loading state covers
  session restoration so protected content never flashes.
- The two in-game player names are per-match nicknames. Never overwrite them
  with the account display name; never require both players to register.

## Navigation

- Desktop/web (≥760px): compact top bar — brand, Home, Play, How to Play,
  account entry (initials avatar when signed in, Sign in otherwise).
- Mobile: bottom bar outside active gameplay — Home, Play, How to Play, Profile.
  Never show both bars at once. Respect safe-area insets; ≥44px targets.
- During a match (`/game`): standard navigation is hidden. A deliberate Exit
  action confirms first; cancelling preserves the match, confirming lands on the
  Bookshelf without corrupting game state.
- Results: Play Again, Choose Another Book, Return Home. No history, stats, or
  persistence claims until those phases ship.

## Identity

- `auth.users` is the email source; `public.profiles.display_name` is the only
  client-editable field (RLS: own row, `display_name` column only).
- Profiles are created by the database trigger, never by clients.
- Email belongs on Profile, not scattered across game screens.

## Game integrity (frozen)

People-first scoring, round-wins tiebreak, sudden death, draws, 5/10/15 rounds,
seeded Random Flip, human-counted Alice/Punjab data, spread eligibility, and
per-book asset bases are not redesigned to fix product bugs.

## Asset delivery and deployment dependencies

- Canonical book JSON carries relative paths only. Runtime resolution order:
  per-book `EXPO_PUBLIC_BOOK_ASSET_BASE_URL_<BOOK_ID>` → generic
  `EXPO_PUBLIC_BOOK_ASSET_BASE_URL` → `http://localhost:8000` dev fallback.
- The two scanned books reuse identical relative filenames, so they require
  **separate** per-book bases in every environment.
- Scanned WebP lives git-ignored under `.local/` and is served by a plain HTTP
  server in development. **No production asset host is configured.** Before any
  public deployment, upload both book folders to public HTTPS paths and bake the
  per-book bases at export time. A production build must never depend on a
  developer's localhost or private LAN IP — baked `localhost`/LAN URLs break on
  every other device, and baked IPs break when DHCP reassigns the address.
- Required for hosted operation (all manual, none configured): hosted Supabase
  project + auth redirect allowlist, public asset hosting, production env values
  (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, per-book asset
  bases). Never ship a secret/service-role key in the client.
