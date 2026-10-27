# Production launch runbook

This runbook is for the Book People player app on web and Android. It does not
authorize production writes from a developer machine: production domains,
credentials, SMTP configuration, Supabase project settings, and Play Console
releases are manual operator actions.

## Release gates

Do not invite external testers until every item below is complete:

- The production Supabase project is separate from staging.
- Every migration, including `20261016090000_enforce_server_owned_publishing.sql`,
  has been applied and the `book-publish` Edge Function has been deployed.
- The production Custom Access Token Hook points to
  `public.custom_access_token_hook`, and production admins are manually entered
  in `public.admin_users`.
- A dedicated production test admin and a separate confirmed player account
  pass the Phase 11 acceptance harness.
- Production SMTP, Auth Site URL, and redirect allowlist have been tested for
  sign-up confirmation and password reset.
- A privacy policy, support contact, content-rights policy, and Play Store Data
  safety answers have been reviewed for the actual data the app collects.
- Final store icon, feature graphic, screenshots, app description, and age
  rating have been prepared; do not rely on development defaults for a store
  listing.
- The production build passes `pnpm release:verify-env`, typecheck, tests, and
  a real-device smoke test.

## 1. Create production services (MANUAL)

1. Create a new Supabase project for production. Do **not** reuse staging.
2. Choose a paid production plan and configure backup/retention appropriate for
   the data you intend to retain.
3. Create a production web domain, such as `https://app.example.com`.
4. Configure custom SMTP with a verified sender domain. Disable email-provider
   link tracking if it rewrites confirmation or recovery URLs.
5. In Supabase Auth URL Configuration set:

   ```text
   Site URL: https://app.example.com
   Redirect URLs:
   https://app.example.com/**
   bookpeople://**
   ```

   Replace the sample web host before saving. `bookpeople://` is the app's
   configured native scheme; it takes effect only in a standalone build.

6. Keep email confirmation enabled. Configure sensible Auth rate limits and
   CAPTCHA before a public sign-up announcement.

## 2. Deploy database and Edge Function (MANUAL)

1. Link the Supabase CLI to the production project only after confirming its
   project reference in the Dashboard.
2. Review the migration list. Apply forward-only migrations; never run
   `supabase db reset` against production.
3. Deploy `supabase/functions/book-publish`.
4. Set `SUPABASE_SERVICE_ROLE_KEY` only as an Edge Function secret. Never put
   it in Expo environment variables, source code, or GitHub.
5. Enable the Custom Access Token Hook in the Dashboard and use
   `public.custom_access_token_hook`.
6. Create a dedicated production admin user and insert only that user's UUID
   into `public.admin_users`. Sign out and in again, then verify `is_admin()`
   returns true. Verify a normal player returns false.

## 3. Configure build-time client values (MANUAL)

Copy the checked-in production examples to git-ignored local files:

```sh
cp apps/game/.env.production.example apps/game/.env.production.local
cp apps/admin/.env.production.example apps/admin/.env.production.local
```

Fill them with the production project URL, publishable/anon key, and public
book-assets URL. Client keys are designed to be public; service-role keys are
not. Before any release build:

```sh
set -a
source apps/game/.env.production.local
set +a
pnpm release:verify-env
```

The verifier checks only that values are present and use an HTTPS non-staging
host; it never prints a key.

## 4. Validate production safely

Run unit/type checks, then Phase 11 acceptance using dedicated production test
accounts that are not personal or staff accounts. Source credentials from a
local ignored file or a secret manager; never paste them into shell history or
GitHub Actions logs.

```sh
pnpm --filter admin typecheck
pnpm --filter admin test
pnpm --filter @book-people/game-core typecheck
pnpm --filter @book-people/game-core test
pnpm --filter @book-people/book-data typecheck
pnpm --filter @book-people/book-data test
pnpm --filter game typecheck
pnpm --filter game test
git diff --check
```

Then run `tools/phase11/acceptance.mjs` with `PHASE11_STAGING=1` only after
reviewing that its environment points to the intended isolated test project.
The harness creates and removes temporary catalog data.

## 5. Web tester release (MANUAL)

The player app uses Expo Router static web output. Build with the production
environment loaded, then deploy the generated `apps/game/dist` to EAS Hosting
or another HTTPS static host. Configure the chosen final web URL in Supabase
Auth before testing confirmation/recovery links.

Do not deploy the Admin app publicly unless it is intentionally hosted behind
an organization-controlled access boundary. Admin authorization still relies
on the server-side JWT claim and RLS.

## 6. Android tester release (MANUAL)

Before the first Android build, choose the permanent Android application ID.
It cannot be changed after the first Play upload. Add it to `apps/game/app.json`
under `expo.android.package`, for example `com.yourcompany.bookpeople`; do not
use that example value unchanged.

1. Log into Expo/EAS and initialize/link the EAS project.
2. Build an installable tester APK:

   ```sh
   npx eas-cli@latest build --platform android --profile preview
   ```

3. Install it on real Android devices and test sign-up, confirmation link,
   sign-in, password recovery, catalog, complete game, history, and sign-out.
4. Create the Google Play Console application with the exact same package ID.
5. Build the store `.aab`:

   ```sh
   npx eas-cli@latest build --platform android --profile production
   ```

6. Upload to **Internal testing** first, then use **Closed testing** for the
   selected tester group. Do not promote to public production until closed-test
   feedback is resolved.

## Rollback

- **Web:** redeploy the last known-good static artifact.
- **Android:** halt the rollout or promote the prior tested release in Play
  Console; do not depend on an untested OTA update for an urgent rollback.
- **Catalog:** use secure unpublish to remove a problematic book version from
  players without deleting game history.
- **Database:** never roll back a migration by editing production tables
  manually. Create a reviewed forward migration, or restore according to the
  configured backup/PITR procedure.

Record the release commit, EAS build URL, web deployment URL, Supabase
migration version, tester cohort, and rollback owner for every release.
