# Book People — Backend Setup (Supabase database foundation)

Phase 3 scope: **database foundation only**. Migrations, RLS policies, and security
tests live in `supabase/`. No app authentication, no Supabase client in the Expo app,
no game saving, and no history UI exist yet — those are later phases. The current game
is unchanged and works exactly as before.

> Truthful status (2026-10-11): **no live hosted Supabase project exists** for this
> repo, and none was tested. Everything below targets **local** Supabase. Migrations
> apply cleanly via `supabase db reset` and all 49 pgTAP assertions pass via
> `supabase test db` on the local stack. No hosted database has been verified.

## 1. Architecture and table relationships

```
auth.users (Supabase Auth, managed)
  │  trigger on_auth_user_created (AFTER INSERT, server-side)
  ▼
profiles (user_id PK/FK, display_name, created_at, updated_at)
  - one row per auth user, created by the trigger, never by clients

auth.users
  │  1 user → N completed games
  ▼
game_sessions (id UUID PK = client idempotency key, user_id FK, book snapshots,
  player names, rounds_config, people/round-win totals, winner, deciding method,
  seed, started/completed/created_at)
  │  1 session → N rounds, ON DELETE CASCADE
  ▼
game_rounds (session_id FK, round_number, round_type, spread_id, page-label
  snapshots, per-player counts, round winner; UNIQUE(session_id, round_number))
```

Ownership is stored once, on `game_sessions.user_id`. `game_rounds` carries no
`user_id`; its RLS policies check the parent session, so a round row can never
disagree with its session about who owns it. History rows are snapshots
(book title/version/author, names, totals, counts) — later book-content edits never
rewrite a saved result, and reconstructing it needs no live book data.

Game-core mapping (engine frozen; field semantics verified against
`packages/game-core/src/types.ts` and `result.tsx`):

| game-core                                                                      | database                                                                                                               |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `config.players[0]` / `[1]`                                                    | `player1_name` / `player2_name`                                                                                        |
| `config.rounds` (5\|10\|15)                                                    | `rounds_config`                                                                                                        |
| `config.seed`                                                                  | `game_seed` (nullable)                                                                                                 |
| `config.book.id` / `.title`                                                    | `book_id` / `book_title`                                                                                               |
| `BookContent.version` / `.author` (catalog-side; game-core `Book` has neither) | `book_version` / `book_author`                                                                                         |
| `getResult().peopleTotals`                                                     | `player1/2_people_total`                                                                                               |
| `getResult().roundWins`                                                        | `player1/2_round_wins`                                                                                                 |
| `getResult().winner` (0\|1\|null)                                              | `winner_player` (NULL = draw)                                                                                          |
| `getResult().reason`                                                           | `deciding_method`: `peopleTotal`→`people_total`, `roundWins`→`round_wins`, `suddenDeath`→`sudden_death`, `draw`→`draw` |
| `RoundResult.roundNumber`                                                      | `round_number`                                                                                                         |
| `RoundResult.suddenDeath`                                                      | `round_type` (`normal` / `sudden_death`)                                                                               |
| `RoundResult.spreadId`                                                         | `spread_id`                                                                                                            |
| `RoundResult.counts[0]` / `[1]`                                                | `player1_count` / `player2_count`                                                                                      |
| `RoundResult.winner` (0\|1\|null)                                              | `winner_player` (NULL = tied round)                                                                                    |
| `ContentSpread.printedPage` (catalog-side)                                     | `left/right_page_label` (a later phase resolves these)                                                                 |

No scanned images and no book JSON are stored in Postgres — only IDs, labels, and
counts. A later phase must pass `book_version`/`book_author`/page labels from
`@book-people/book-data` at save time, since game-core never sees them.

## 2. Prerequisites (one-time, manual — none of this is done)

1. **Start a container runtime.** Docker Desktop is installed (`/Applications/Docker.app`)
   but its daemon is not running. Either open Docker Desktop and wait for it to start,
   or use a lighter alternative the Supabase CLI supports (OrbStack, Rancher Desktop,
   Podman, or colima). Verify with:
   ```sh
   docker info
   ```
2. **Install the Supabase CLI** (pick one; this is a dev tool, not an app dependency):
   ```sh
   brew install supabase/tap/supabase   # macOS, this machine has Homebrew
   ```
   Verify with `supabase --version`. The CLI needs Node 20+ only for the npm install
   route; Homebrew has no such requirement.
3. Confirm `supabase/` in the repo root (created this phase: `config.toml`,
   `migrations/`, `tests/`). If your CLI version rejects the minimal `config.toml`,
   run `supabase init` in an empty directory and copy its `config.toml` over ours —
   `migrations/` and `tests/` stay as-is.

## 3. Start the local environment and apply migrations

From the repo root, with the container runtime running:

```sh
supabase start     # launches Postgres, Auth, Studio; prints local URLs/keys
supabase db reset  # applies supabase/migrations/* to a fresh local database
```

`supabase/migrations/` is the source of truth — never hand-edit schema via the
dashboard. Current migrations:

- `20261011090000_profiles.sql` — `profiles`, auto-create trigger, `updated_at`
  trigger, RLS + grants.
- `20261011090001_game_sessions.sql` — `game_sessions`, history index, RLS + grants.
- `20261011090002_game_rounds.sql` — `game_rounds`, ordering index, RLS + grants.

After `supabase start`, Studio is at `http://127.0.0.1:54323` and Postgres at
`postgresql://postgres:postgres@127.0.0.1:54322/postgres` (values printed by the
CLI; these are the stock local defaults, not project credentials).

Useful inspection queries (Studio SQL editor or `psql`):

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
select policyname, cmd, roles from pg_policies where schemaname = 'public' order by 1;
select grantee, privilege_type from information_schema.role_table_grants
  where table_schema = 'public' and grantee in ('anon', 'authenticated') order by 1, 2;
```

## 4. Run the database security tests

```sh
supabase test db
```

Test files (`supabase/tests/`, pgTAP, each self-rolled-back):

- `profiles_rls.test.sql` (17 assertions): anon blocked on all operations; the
  harness identity is proven via `auth.uid()` for each simulated user; trigger
  creates one profile per new auth user; each identity reads exactly their own
  row; owner updates display name; strangers see nothing, plant nothing, and
  change nothing (cross-user updates scoped to zero rows with the target proven
  intact); owner ID, timestamps, and deletes are rejected through the client.
- `game_sessions_rls.test.sql` (16 assertions): anon blocked; owner saves/reads own
  games; no cross-user reads or forged ownership; history is append-only (no client
  update/delete); bad round counts, negative totals, bad winners, null-winner
  mismatch, unknown deciding methods, and reused session UUIDs are rejected.
- `game_rounds_rls.test.sql` (16 assertions): anon blocked; owner saves/reads ordered
  rounds in own sessions; no cross-user reads or inserts; owner cannot rewrite or
  delete rounds; duplicate round numbers, negative counts, bad round types, and bad
  winners are rejected.

These tests use genuinely distinct identities (`owner@example.com`,
`other@example.com`) plus the `anon` role — never a single-identity allow-check.

## 5. Future environment variables (not needed until the auth phase)

| Variable                        | Value                                                   | Notes                                                       |
| ------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | local: `http://127.0.0.1:54321` (from `supabase start`) | Build-time, same convention as the existing asset-base vars |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | local publishable key (from `supabase start`)           | Public by design; RLS enforces security, not key secrecy    |

Do **not** create these yet — no app code reads them, and inventing values now only
risks confusion. The secret/`service_role` key must **never** appear in the Expo app,
its config, or the repo: it bypasses RLS entirely and is for server-side admin use
only (which this product has none of).

## 6. How RLS protects user-owned data

- RLS is enabled on all three tables; `anon` holds **zero** grants, so signed-out
  requests fail with `42501` before any policy runs.
- `authenticated` holds only `select` (+`update(display_name)` on profiles, +`insert` on the history tables). Every policy pins ownership to
  `(select auth.uid())`, wrapped in a subselect so Postgres evaluates it once per
  statement; filter columns (`profiles.user_id`, `game_sessions.user_id`) lead btree
  indexes.
- Inserts must satisfy `WITH CHECK (user_id = auth.uid())` (sessions) or reference
  an owned session (rounds) — a forged `user_id` fails closed. The `DEFAULT
auth.uid()` on `game_sessions.user_id` is convenience only; the policy is the
  authority.
- The profile trigger is `SECURITY DEFINER` with `set search_path = ''`,
  schema-qualified names, execution revoked from client roles, and housed in the
  unexposed `private` schema — it cannot be invoked over the Data API.
- No `USING (true)` / `WITH CHECK (true)` policies exist anywhere.

## 7. How later phases use these tables

- **Auth phase:** Supabase client + session provider in Expo; signup fires the
  existing trigger (no client insert needed); profile screen edits `display_name`
  only. Required dashboard manual step: allowlist app redirect URLs for
  email-confirm/reset links.
- **Save phase:** on the result screen, insert one `game_sessions` row with a fresh
  client UUID plus its `game_rounds`, retrying with the same UUID on failure. A
  retried raw insert carrying the same UUID is rejected by the primary key
  (`23505`, pinned by the test suite) — the app must treat `23505` as "already
  saved", never as a second game. Frontend must supply
  `book_version`/`book_author`/page labels from book-data at save time.
- **History phase:** read-only lists and detail screens from these tables; draw the
  line at the stored snapshots, never current book JSON.

## 8. Explicitly still outstanding

- No live hosted Supabase project is configured; no project URL or credential exists
  anywhere in the repo (do not invent any).
- No app authentication is implemented; no history is saved by the game.
- Migrations and tests are verified against the **local** stack (`db reset` +
  `test db` green); no hosted database exists or has been tested.
- Remote scanned-asset hosting remains a separate, unsolved requirement for any
  external deployment.
