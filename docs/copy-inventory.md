# Player copy inventory

The English source copy lives in `apps/game/src/copy/en.ts`. This inventory
tracks player-visible copy and the component or helper that uses it. Dynamic
values such as player names, counts, book titles, dates, and round numbers are
listed as placeholders rather than sample values.

| String key                  | Screen            | Current text / template                                                                        | Purpose                    |
| --------------------------- | ----------------- | ---------------------------------------------------------------------------------------------- | -------------------------- |
| `brand`                     | Global navigation | Book People                                                                                    | Product name               |
| `nav.home`                  | Navigation        | Home                                                                                           | Navigate home              |
| `nav.play`                  | Navigation, home  | Play                                                                                           | Start or resume a match    |
| `nav.howToPlay`             | Navigation, home  | How to play                                                                                    | Open instructions          |
| `nav.history`               | Navigation        | History                                                                                        | Open match history         |
| `nav.profile`               | Navigation        | Profile                                                                                        | Open profile               |
| `nav.signIn`                | Navigation, auth  | Sign in                                                                                        | Authenticate               |
| `home.eyebrow`              | Home              | A two-player counting game                                                                     | Explain product            |
| `home.howItWorks`           | Home              | Choose a book. Count the people on your page. The higher count wins the round.                 | Explain play               |
| `setup.title`               | Setup             | Set the table                                                                                  | Setup heading              |
| `setup.detail`              | Setup             | Name the players and choose the game length.                                                   | Setup instruction          |
| `setup.selectedBook`        | Setup             | Selected book                                                                                  | Selected-book marker       |
| `setup.playerOne`           | Setup             | Left page. Player 1.                                                                           | Explain player side        |
| `setup.playerTwo`           | Setup             | Right page. Player 2.                                                                          | Explain player side        |
| `setup.gameLength`          | Setup             | Game length                                                                                    | Round selection label      |
| `setup.rounds`              | Setup             | {count} rounds                                                                                 | Round-option label         |
| `game.round`                | Game              | Round {current} of {total}                                                                     | Match progress             |
| `game.suddenDeath`          | Game              | Sudden death                                                                                   | Tie-break round            |
| `game.awaitingTitle`        | Game              | The next spread is ready                                                                       | Before-flip state          |
| `game.awaitingDetail`       | Game              | Flip the page when both players are ready.                                                     | Before-flip instruction    |
| `game.prompt`               | Game              | Flip the page to reveal this round’s counts.                                                   | Before-flip instruction    |
| `game.wonRound`             | Game              | {name} won the round.                                                                          | Round result               |
| `game.draw`                 | Game              | This round is a draw.                                                                          | Round result               |
| `actions.flipPage`          | Game              | Flip the page                                                                                  | Reveal spread              |
| `actions.nextRound`         | Game              | Next round                                                                                     | Continue match             |
| `actions.seeResult`         | Game              | See result                                                                                     | Open final result          |
| `actions.exitMatch`         | Game, dialog      | Exit match                                                                                     | Leave current match        |
| `exit.detail`               | Exit dialog       | Leaving ends this match without saving its progress.                                           | Consequence of exit        |
| `howToPlay.steps`           | How to play       | Six numbered action steps                                                                      | Explain game and tie rules |
| `auth.confirmationSent`     | Sign-up           | Account created. Check your email for the confirmation link, then sign in.                     | Confirm email next step    |
| `auth.resetSent`            | Forgot password   | If that email has an account, we sent a password-reset link. Check your inbox and spam folder. | Neutral reset response     |
| `auth.rateLimited`          | Auth              | Too many requests. Wait a little while, then try again.                                        | Rate-limit guidance        |
| `auth.noConnection`         | Auth              | We could not connect. Check your internet connection, then try again.                          | Network guidance           |
| `errors.catalogUnavailable` | Bookshelf         | Your library is unavailable right now. Check your connection, then try again.                  | Catalog failure            |
| `empty.noHistoryTitle`      | History           | No matches yet                                                                                 | Empty history heading      |
| `empty.noHistoryDetail`     | History           | Finish a game and it will appear here.                                                         | Empty history next step    |
| `errors.unavailableImage`   | Game              | Page image unavailable                                                                         | Asset failure              |

## Intentional technical exceptions

The following are not player copy: database table/field names, route paths,
environment-variable names, console diagnostics, test fixture text, and
developer-only staging-environment warnings. Legacy player literals in the
remaining profile, history, and result routes are scheduled to move to this
module before Hindi and Marathi are added.
