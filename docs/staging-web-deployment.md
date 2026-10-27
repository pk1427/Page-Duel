# Book People staging web deployment (Vercel)

This runbook deploys only the player-facing Expo web app for friends-and-family
testing. It deliberately keeps the existing hosted **staging** Supabase project
and public, versioned book assets. It does not deploy `apps/admin`, an Edge
Function, a database migration, or any server-side secret.

## Before you start

- The Vercel project must be connected to this repository's intended staging
  branch. Do not connect the admin app as a separate public project.
- Keep the Vercel project **Root Directory** at the repository root (`.`), not
  `apps/game`. The game has workspace dependencies in `packages/book-data` and
  `packages/game-core`, which Vercel cannot access from an `apps/game` root.
- The current source is an Expo Router static export. `vercel.json` builds only
  the game and sends an unknown client route to `index.html`; Vercel serves an
  existing static file before applying that fallback. Expo Router then renders
  the app's friendly unknown-route screen.
- `EXPO_PUBLIC_*` values are compiled into a web bundle. Use only the Supabase
  anon/publishable key and public Storage URLs; never set a service-role key,
  an admin credential, or any other secret in Vercel.

## Create the Vercel project (manual)

1. In Vercel, select **Add New → Project**, then import this Git repository.
2. Select the branch intended for the staging beta.
3. Set **Framework Preset** to `Other`.
4. Leave **Root Directory** as `.` (the repository root).
5. Under **Build and Deployment**, verify these values from `vercel.json`:

   | Setting          | Value                                                |
   | ---------------- | ---------------------------------------------------- |
   | Install Command  | `pnpm install --frozen-lockfile`                     |
   | Build Command    | `pnpm --filter game exec expo export --platform web` |
   | Output Directory | `apps/game/dist`                                     |

6. In **Environment Variables**, add the five names below for the environment
   you will deploy (usually Preview for a branch beta, or Production for a
   stable staging URL). Copy their values from the existing game staging
   environment file or the Supabase dashboard; do not put values in Git.
7. Add `ENABLE_EXPERIMENTAL_COREPACK` with the value `1`, so Vercel honors the
   root `packageManager` pin (`pnpm@9.15.0`).
8. Confirm that neither `EXPO_PUBLIC_STAGING_MODE` nor either
   `EXPO_PUBLIC_STAGING_SUPABASE_*` variable is set. This beta uses the normal
   `EXPO_PUBLIC_SUPABASE_*` source path with the hosted staging values.
9. Deploy. Vercel will issue an HTTPS URL. This guide does not perform that
   deployment.

## Required Vercel environment-variable names

| Name                                                   | Purpose                                                                                             |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`                             | Hosted staging Supabase project URL.                                                                |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`                        | Hosted staging Supabase anon/publishable key. This is the only Supabase key allowed in the browser. |
| `EXPO_PUBLIC_BOOK_ASSET_BASE_URL`                      | Public HTTPS base URL for the `book-assets` bucket.                                                 |
| `EXPO_PUBLIC_BOOK_ASSET_BASE_URL_ALICE_LOC_1885`       | Public HTTPS version-directory base URL for Alice assets.                                           |
| `EXPO_PUBLIC_BOOK_ASSET_BASE_URL_TALES_OF_PUNJAB_1894` | Public HTTPS version-directory base URL for Punjab assets.                                          |

Leave `EXPO_PUBLIC_AUTH_DEBUG` unset in the shareable deployment. Do not add
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_KEY`, passwords, JWTs, or
`EXPO_PUBLIC_STAGING_SUPABASE_*` values.

## Configure Supabase Auth after Vercel assigns the URL (manual)

In the existing staging Supabase project, go to **Authentication → URL
Configuration**. Replace `<staging-web-url>` below with the exact HTTPS Vercel
URL that testers will use (or a custom HTTPS staging domain):

| Field         | Entry                                      |
| ------------- | ------------------------------------------ |
| Site URL      | `https://<staging-web-url>`                |
| Redirect URLs | `https://<staging-web-url>/`               |
| Redirect URLs | `https://<staging-web-url>/reset-password` |

Keep the existing local development URL entries if local testing still needs
them. Do not disable email confirmation.

The current app behavior is:

- **Sign in:** no redirect URL is needed; the browser stays in the app.
- **Sign up / email confirmation:** the app relies on Supabase's Site URL, so
  a confirmation link returns to the staging web home page and Supabase parses
  the new session from the URL.
- **Password recovery:** the app explicitly uses the current origin plus
  `/reset-password`; that exact route must be in Redirect URLs.
- **Preview URLs:** use the stable staging URL for auth testing. If temporary
  Vercel preview URLs truly need password recovery, add only a narrowly scoped
  preview pattern after checking it matches your Vercel naming scheme. Do not
  use an unrestricted redirect pattern.

Vercel's rewrite sends direct visits to `/sign-in`, `/sign-up`,
`/forgot-password`, and `/reset-password` to the exported app. Existing static
assets are served normally, and the app provides the user-facing not-found
screen for unknown routes.

## Pre-deployment verification

Run from the repository root with the same five non-secret/public environment
values that will be set in Vercel (prefer sourcing an ignored local staging
file):

```bash
set -a
source apps/game/.env.staging.local
set +a
pnpm --filter game exec expo export --platform web
```

Expected output directory: `apps/game/dist`.

Before sharing the URL, inspect the deployment in a browser:

1. Open the home page, sign up with a test account, confirm the email, then
   sign in.
2. Exercise **Forgot password** and confirm its link opens the web
   `/reset-password` screen.
3. Open `/sign-in` and `/reset-password` directly in a new browser tab.
4. Confirm the Books screen shows the hosted published catalog and its images.
5. In browser DevTools Network, confirm requests go to hosted HTTPS Supabase
   and Storage endpoints; there must be no request to `127.0.0.1:54321`,
   `localhost:54321`, or `localhost:8000`.
6. Confirm no admin page is deployed or linked. Admin publishing must remain
   behind its existing authenticated Supabase/RLS/Edge Function controls.

## Rollback

If the beta is broken, use Vercel's deployment rollback to the prior known-good
deployment, or remove the shared URL. Do not change Supabase RLS, disable email
confirmation, or substitute local bundled books when staging services fail.
