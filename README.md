# Book People

Book People is a page-based, head-to-head counting game built with Expo and
React Native. Players choose a published book, inspect each illustrated spread,
count the people they can see, and compete over five rounds.

**Live staging beta:** [page-duel.vercel.app](https://page-duel.vercel.app/)

The public site is for friends-and-family testing. It uses the hosted staging
Supabase project and its published catalog; it is not the production launch.

## What players can do

- Create an account and confirm their email.
- Sign in, reset a password, and keep a personal game history.
- Browse the published book catalog and play a five-round match.
- View hosted book pages and covers over HTTPS.

## Repository layout

| Path                 | Purpose                                                                               |
| -------------------- | ------------------------------------------------------------------------------------- |
| `apps/game`          | Player-facing Expo app for web, Android, and iOS.                                     |
| `apps/admin`         | Separate authenticated catalog and publishing dashboard. It is not publicly deployed. |
| `packages/game-core` | Deterministic game rules, scoring, and history contracts.                             |
| `packages/book-data` | Book-content types, validation, and bundled development content.                      |
| `supabase`           | Database migrations, RLS policies, SQL tests, and Edge Functions.                     |
| `tools/book-prep`    | Local book-preparation and validation tooling.                                        |
| `docs`               | Architecture, hosting, publishing, testing, and release runbooks.                     |

## Technology

- Expo SDK 57, Expo Router, React Native, and React Native Web
- TypeScript and pnpm workspaces
- Supabase Auth, Postgres with RLS, Storage, and an authenticated publishing
  Edge Function
- Vercel static hosting for the player staging web app

## Run locally

Prerequisites: Node.js compatible with the repository, pnpm 9.15.0, and a
hosted Supabase staging configuration.

```bash
pnpm install --frozen-lockfile
cp apps/game/.env.staging.example apps/game/.env.staging.local
```

Set the required public staging values in the ignored
`apps/game/.env.staging.local` file. Never add passwords, JWTs, or a
service-role key to this file or to a browser environment.

```bash
cd apps/game
pnpm staging
```

For ordinary local development without the staging wrapper:

```bash
pnpm --filter game web
```

## Checks

Run the targeted checks from the repository root:

```bash
pnpm --filter @book-people/game-core test
pnpm --filter @book-people/book-data test
pnpm --filter game test
pnpm --filter admin test
pnpm -r run typecheck
git diff --check
```

The browser E2E suite is intentionally separate because it needs a configured
staging environment:

```bash
pnpm --filter game test:e2e
```

## Staging web deployment

Only `apps/game` is deployed to Vercel. The repository root remains the Vercel
Root Directory so the game can use the workspace packages.

- Build command: `pnpm --filter game exec expo export --platform web`
- Output directory: `apps/game/dist`
- Required public variable names and dashboard instructions:
  [staging web deployment guide](docs/staging-web-deployment.md)

The deployment must use hosted HTTPS Supabase and Storage URLs. Release bundles
are designed not to fall back to local Supabase, `localhost`, or local book
assets when staging is unavailable.

## Security model

- Players use the Supabase anon/publishable key only; RLS protects player data.
- Admin access is server-authorized by the trusted JWT claim checked through
  `public.is_admin()`.
- Book uploads, validation, publication, and unpublication go through the
  authenticated `book-publish` Edge Function.
- Service-role credentials are server-only function secrets and must never be
  committed or exposed in Expo/Vercel public variables.
- Email confirmation remains enabled for new accounts.

See [asset hosting and secure publishing](docs/asset-hosting.md) for the
versioned Storage contract and [backend setup](docs/backend-setup.md) for the
database/auth model.

## Documentation

- [Game design document](docs/GDD.md)
- [Product architecture](docs/product-architecture.md)
- [Content architecture](docs/content-architecture.md)
- [Playtesting guide](docs/playtesting.md)
- [Staging web deployment](docs/staging-web-deployment.md)
- [Production launch runbook](docs/production-launch.md)
- [Local book-ingestion workflow](docs/local-book-ingestion.md)

## Contributing

Keep changes small, run the relevant targeted checks, and do not weaken RLS,
authentication, or the server-owned publishing boundary. Never commit local
environment files or credentials.
