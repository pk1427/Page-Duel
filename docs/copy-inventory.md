# Player copy inventory

English player copy is defined in `apps/game/src/copy/en.ts`. Placeholder names in braces are runtime values, not concatenated sentence fragments.

| Key | File | Screen | Text | Purpose |
| --- | --- | --- | --- | --- |
| `brand`, `nav.*` | `copy/en.ts`, `navbar.tsx` | Navigation | Book People; Home; Play; How to play; History; Profile; Sign in | Product and navigation labels |
| `actions.chooseBook`, `changeBook`, `browseBooks`, `startGame` | `copy/en.ts` | Books, setup | Choose a book; Change book; Browse books; Start game | Book and match actions |
| `actions.flipPage`, `nextRound`, `seeResult`, `exitMatch`, `stayInMatch` | `copy/en.ts` | Match | Flip the page; Next round; See result; Exit match; Keep playing | Match actions |
| `actions.retry`, `backHome`, `backToHistory`, `viewHistory`, `loadMore` | `copy/en.ts` | Recovery, history | Try again; Back home; Back to history; View history; Load more | Recovery and navigation actions |
| `actions.playAgain`, `chooseAnotherBook`, `saveName`, `signOut` | `copy/en.ts` | Result, profile | Play again; Choose another book; Save name; Sign out | Result and account actions |
| `actions.sendResetLink`, `requestAnotherReset`, `updatePassword`, `showPassword`, `hidePassword`, `sending`, `updating` | `copy/en.ts` | Password recovery | Send reset link; Use another email; Update password; Show password; Hide password; Sending; Updating | Password recovery actions and progress |
| `actions.createAccount`, `signInInstead`, `forgotPassword` | `copy/en.ts` | Authentication | Create an account; Sign in instead; Forgot password | Authentication actions |
| `home.*` | `copy/en.ts`, `app/index.tsx` | Home | A two-player counting game; game instructions; Two players; Illustrated books; signed-in status; book illustration labels | Explain the game and direct play |
| `setup.*` | `copy/en.ts`, `app/setup.tsx` | Setup | New game; Set the table; player and game-length labels; `{count} rounds`; book-first fallback | Configure a match and describe choices |
| `game.*` | `copy/en.ts`, `app/game.tsx` | Gameplay | Round `{current}` of `{total}`; Sudden death; open spread labels; reveal instruction; `{name} won the round.`; draw and totals messages | Round status, accessible labels, and reveal guidance |
| `auth.email`, `password`, `emailPlaceholder`, `passwordPlaceholder`, `newPasswordPlaceholder` | `copy/en.ts`, auth screens | Authentication | Email; Password; you@example.com; Your password; At least 6 characters | Form labels and placeholders |
| `auth.signInUnavailable`, `signInTitleUnavailable`, `signUpUnavailable`, `signUpTitleUnavailable` | `copy/en.ts`, auth screens, gate | Authentication | Sign-in is unavailable. Configure the game connection, then try again.; Account creation is unavailable. | Explain unavailable authentication safely |
| `auth.invalidEmail`, `invalidCredentials`, `accountExists`, `weakPassword`, `passwordTooShort` | `copy/en.ts`, auth helpers | Authentication errors | Valid email, credentials, account-exists, and password guidance | Friendly mapped validation errors |
| `auth.noConnection`, `rateLimited`, `genericRetry`, `confirmationSent`, `resetSent` | `copy/en.ts`, auth helpers | Authentication feedback | Connection, rate-limit, confirmation, and neutral reset messages | Actionable auth feedback |
| `auth.welcomeBack`, `signInDetail`, `signUpEyebrow`, `signUpTitle`, `signUpDetail` | `copy/en.ts`, sign-in and sign-up | Authentication | Welcome back; Pick up where you left off.; Keep your games; Create an account; Use one account to keep your match history. | Auth headings |
| `auth.forgotEyebrow`, `forgotTitle`, `forgotDetail`, `resetSentEyebrow`, `resetSentTitle` | `copy/en.ts`, forgot password | Password recovery | Forgot your password; Reset your password; neutral reset guidance; Check your email; Reset link sent | Neutral recovery |
| `auth.technicalDetails`, `hideTechnicalDetails`, `toggleTechnicalDetails` | `copy/en.ts`, sign-in | Development diagnostic | Technical details; Hide technical details; Toggle technical sign-in details | Development-only diagnostic controls |
| `errors.*` | `copy/en.ts`, stores and screens | Errors | Image, catalog, session, name, match, password, book, start, and save recovery messages | Actionable application errors |
| `empty.*` | `copy/en.ts`, result and history | Empty states | No books; No matches yet; No finished game yet, with next-step messages | Explain an empty state and the next step |
| `profile.*` | `copy/en.ts`, `app/profile.tsx`, `auth-routing.ts` | Profile | Your account; Profile; Display name; Reader; Name saved.; profile validation messages | Account identity and feedback |
| `resetPassword.*` | `copy/en.ts`, `app/reset-password.tsx` | Reset password | Link checking, invalid, success, password labels, and recovery actions | Reset-password states and controls |
| `history.*` | `copy/en.ts`, history routes | History | Your shelf; History; completed matches; Match not found; `{left} vs {right}`; `{date}, {time}`; `{configured} rounds` or Played `{played}` of `{configured}` rounds. | History headings, compact rows, detail, and accessibility |
| `result.*` | `copy/en.ts`, `app/result.tsx`, `reason-label.ts` | Result | Match result; `{name} won the match.`; The match is a draw.; tie rule; persistence and deciding-reason labels | Final outcome and tie explanation |
| `notFound.*`, `exit.*` | `copy/en.ts`, fallback and dialog | Recovery | Page-not-found and leave-match text | Route and exit recovery |
| `howToPlay.*` | `copy/en.ts`, `app/how-to-play.tsx` | How to play | Explanation, example labels, and six numbered steps | Explain play and tie order |
| `books.*` | `copy/en.ts`, `app/books.tsx`, `cover-image.tsx` | Bookshelf | Library labels, catalog states, Featured, Ready, `{count} spread(s) ready`, and cover labels | Catalog states, labels, and accessibility |
| `requireAuth.*` | `copy/en.ts`, `require-auth.tsx` | Auth gate | Checking your session; This will only take a moment.; Sign in to play; sign-in guidance | Protected-route loading and guidance |

## Intentional exceptions

- `apps/game/app.json` contains the native/web app name, `Book People`. Expo configuration is JSON and cannot import the TypeScript copy module.
- `apps/game/src/app/_layout.tsx` contains a development-only wrong-environment warning. It is shown only under `__DEV__` and is not player-facing product copy.
- Route paths, database names, test IDs, console diagnostics, developer comments, and style values are implementation text, not player copy.
