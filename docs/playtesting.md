# Book People — First Real-User Playtest Guide

Goal: get 5–10 genuine people playing Book People and collect useful, structured feedback.
Time per session: 10–15 minutes. No account, no backend, no analytics — just watch and write down what happens.

> Status (verified 2026-10-11): same-Wi-Fi playtesting **works** when the app and asset
> servers are started with the commands in §2. Remote (public-URL) playtesting is **not**
> ready — there is no deployment configuration yet (see §3).

---

## 1. What the testers open

When the host Mac is serving (see §2), testers on the same Wi-Fi open this URL on their phone or computer:

- App: `http://<MAC_LAN_IP>:8081` (Expo web dev server)

At the time of writing the Mac's LAN IP is `192.168.43.213`, so the tester URL is:

- `http://192.168.43.213:8081`

⚠️ The LAN IP changes between networks. Re-check it before every session (see §2) and read the tester the current URL — do not reuse an old one blindly.

What testers should be able to reach through that URL:

1. The Home screen, "Choose a book", and "How to play".
2. All three books in Choose Book, each with correct title, author, and cover:
   - The Book People Practice Book (generated placeholder cover)
   - Alice's Adventures in Wonderland — Lewis Carroll (scanned cover)
   - Tales of the Punjab — Flora Annie Steel (scanned cover)
3. Scanned Alice pages (34 eligible spreads) and scanned Punjab pages (38 eligible spreads).
4. The full game flow: setup (5/10/15 rounds) → rounds with automatic count reveals → scoring → final result → Play Again / Choose Another Book.

---

## 2. Host setup: serve the app + assets over the local network (Option A)

Two servers must run on the host Mac. Both bind all network interfaces by default, so phones on the same Wi-Fi can reach them. The critical detail: **the app must be started with the Mac's LAN IP baked into the per-book asset URLs.** Starting Expo without them leaves the default `http://localhost:8000` base in the bundle, and testers' devices then fail to load every scanned page (their `localhost` is their own phone, not your Mac). This failure is silent-ish — the app shell loads fine, but covers and pages break — so always verify with §2.3 before inviting anyone.

### 2.1 Find the Mac's LAN IP

```sh
ipconfig getifaddr en0
```

(Wi-Fi is usually `en0`. If it prints nothing, try `en1`.) Note the result, e.g. `192.168.43.213`. In the commands below, replace `<LAN_IP>` with it.

### 2.2 Terminal 1 — asset server (scanned pages)

The scanned WebP assets live under `.local/` (git-ignored by design) and are served with plain HTTP. An asset server rooted at `.local/` is normally already running from earlier content work — check first:

```sh
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/book-people-alice-loc/alice-loc-1885/cover.webp
```

If that prints `200`, the asset server is up — skip ahead. If not, start it from the repo root:

```sh
python3 -m http.server 8000 --directory .local
```

Leave it running. Both books resolve under this root at separate paths, which matters because the two books reuse the same relative filenames (`cover.webp`, `pages/p002.webp`, …):

- Alice → `<root>/book-people-alice-loc/alice-loc-1885/`
- Punjab → `<root>/book-people-punjab-1894/tales-of-punjab-1894/`

### 2.3 Terminal 2 — Expo web app with LAN asset URLs

From the repo root, with `<LAN_IP>` replaced by the address from §2.1:

```sh
EXPO_PUBLIC_BOOK_ASSET_BASE_URL_ALICE_LOC_1885=http://<LAN_IP>:8000/book-people-alice-loc/alice-loc-1885 \
EXPO_PUBLIC_BOOK_ASSET_BASE_URL_TALES_OF_PUNJAB_1894=http://<LAN_IP>:8000/book-people-punjab-1894/tales-of-punjab-1894 \
CI=1 pnpm --filter game exec expo start --web --host lan --port 8081
```

Notes:

- `EXPO_PUBLIC_*` values are baked into the bundle at startup — changing them requires restarting Expo (a browser refresh is not enough).
- Never give testers a `localhost` URL for assets. The app URL itself may appear as `localhost:8081` in this terminal; testers must use the `http://<LAN_IP>:8081` variant (Expo also prints a LAN URL when `--host lan` is used).
- The Practice Book needs no assets (its pages render in-memory), so it has no env var.
- Both servers must stay running for the whole session. If the Mac sleeps, re-check both URLs.

### 2.4 Pre-session verification (2 minutes, do this every time)

On the host Mac, run:

```sh
curl -s -o /dev/null -w "app: %{http_code}\n" http://<LAN_IP>:8081/
curl -s -o /dev/null -w "alice cover: %{http_code}\n" http://<LAN_IP>:8000/book-people-alice-loc/alice-loc-1885/cover.webp
curl -s -o /dev/null -w "punjab cover: %{http_code}\n" http://<LAN_IP>:8000/book-people-punjab-1894/tales-of-punjab-1894/cover.webp
```

All three must print `200`. Then open `http://<LAN_IP>:8081` on **your own phone** (not the Mac browser) and confirm: the three books show covers, and one Alice spread plus one Punjab spread load their scanned images. Only then invite the participant. A public-looking app URL is not proof the pages load — this phone check is the proof.

---

## 3. Remote playtest (Option B) — not ready, manual steps required

There is currently **no deployment configuration** in the repo: no `eas.json`, no Vercel/Netlify config, no static-hosting setup, and nothing that uploads `.local/` anywhere. Nothing has been deployed; there are no hosting URLs, accounts, or credentials in the project. Do not assume otherwise.

### Minimal remote strategy (when you want it)

1. **Static web build.** The app is already configured for static web output (`apps/game/app.json` → `web.output: "static"`), and `pnpm app:export` produces `apps/game/dist/`. Any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3+CloudFront, …) can serve that folder.
2. **Static asset hosting.** Upload the two asset folders **separately** (their relative paths collide, so they must live under different prefixes):
   - `.local/book-people-alice-loc/alice-loc-1885/` → e.g. `https://<host>/assets/alice-loc-1885/`
   - `.local/book-people-punjab-1894/tales-of-punjab-1894/` → e.g. `https://<host>/assets/tales-of-punjab-1894/`
3. **Point the build at the hosted assets** with the same per-book variables used in §2.3 (values are baked in at export time):
   ```sh
   EXPO_PUBLIC_BOOK_ASSET_BASE_URL_ALICE_LOC_1885=https://<host>/assets/alice-loc-1885 \
   EXPO_PUBLIC_BOOK_ASSET_BASE_URL_TALES_OF_PUNJAB_1894=https://<host>/assets/tales-of-punjab-1894 \
   pnpm --filter game exec expo export --platform web
   ```
4. Deploy the resulting `apps/game/dist/` folder.

### What you must do manually (nothing here is automated)

- [ ] Choose and create the hosting account(s) — the repo has none configured.
- [ ] Upload the two `.local/` book folders to public paths (they are git-ignored, so no git-based host will pick them up automatically — this step cannot be skipped).
- [ ] Run the export with the two `EXPO_PUBLIC_*` URLs above and deploy `apps/game/dist/`.
- [ ] Repeat the §2.4 checks against the public URLs from a device outside your network.

Until those boxes are ticked, use the same-Wi-Fi setup (§2) — it is the only working path today.

---

## 4. The 10–15-minute session plan

You need two players per game (left page vs right page). The participant can pair with you, a friend, or a second tester — note who the second player was in the feedback template (e.g. "facilitator", "friend"), not by name.

We want to learn: do people understand the game unassisted? Is left-vs-right fun? Are scans readable? Is the reveal satisfying? Do scores and the winner make sense? Which book do they prefer? Do they want another round? **Do not assume the answers — let the session discover them.**

### Phase A — Unassisted first impression (2 min)

Show the participant the Home screen. Say nothing about the rules. Ask:

- "What do you think this game is?"
- "What would you tap first?"
- "What do you expect to happen?"

Let them explore (including "How to play" if they find it) before giving any instructions. Note what they tap, what they read, and what they predict.

### Phase B — First game (5–7 min)

Ask the participant to:

1. Choose a book.
2. Start a **5-round** game (keep the first game short).
3. Play through all rounds.
4. After each round: "Who won that round, and why?"
5. At the final result: "Who won overall, and how was that decided?"

Observe without helping unless they are genuinely stuck. Record: points of confusion, misclicks, misunderstood scores, and anywhere they hesitate. Note whether the automatic count reveal (≈2 s: left page, then right page, then score) lands as satisfying or as waiting-around.

### Phase C — Replay and book choice (2–3 min)

Say: "We're done with that game — what would you like to do now?" Observe whether they voluntarily replay, switch books, or stop. **Do not suggest continuing.** If they choose, let them play (a second book is ideal for the book-preference question). Record what they chose and whether the replay was their idea.

### Phase D — Feedback (3 min)

Ask these neutral questions, in their own words first (don't paraphrase their answers into your words):

- What was most fun?
- What was confusing?
- Were the scanned pages clear enough to count?
- How did you decide who won each round?
- How was the overall winner decided?
- Which book would you choose again, and why?
- What is the one thing you would improve?
- Would you play another game? Why or why not?

Avoid leading questions such as "Did you enjoy the animation?" or "Wouldn't more books make this better?" If they raise animation, books, or features themselves, follow up — but let it come from them.

---

## 5. Feedback template (copy one per participant)

Keep feedback **anonymous**. Use participant IDs (`P01`, `P02`, …). Never record names, emails, phone numbers, precise locations, or other personal information. There is deliberately no tracking or analytics in the app for this test.

```text
Participant ID:
Date:
Device / browser (e.g. "iPhone + Safari", "Android + Chrome", "laptop + Firefox"):
Second player (facilitator / friend / family — no names):
Chosen book(s):
Completed a 5-round game? (yes / no — if no, where did it stop?):
Understood round scoring? (yes / partially / no — evidence: quote or behavior):
Understood final result? (yes / partially / no — evidence: quote or behavior):
Scanned pages readable? (yes / partially / no — which book?):
Reveal satisfying? (yes / meh / no — their words):
Voluntarily wanted to replay? (yes / no — what did they choose next?):
Preferred book + why:
Observed confusion / misclicks / hesitations:
Their improvement suggestion (their words):
Would play again? (yes / no — why):
Other notes:
```

Collect the filled copies as `docs/playtest-notes/P01.md`, `P02.md`, … (create the folder when the first session happens; do not commit personal data — anonymous IDs only).

---

## 6. Manual browser verification checklist (facilitator)

Automated checks (§7) cover data, scoring, and asset reachability, but a human must still confirm the on-screen experience on a real device before sessions start. Tick these off on the tester's class of device (at least one phone):

- [ ] All three books appear in Choose Book with right title, author, and cover.
- [ ] Each book's detail/setup screen shows the same correct metadata.
- [ ] Alice and Punjab show real scanned pages (not placeholders); Practice Book shows its generated spreads.
- [ ] 5-, 10-, and 15-round choices are all selectable at setup.
- [ ] Counts reveal automatically after Flip (≈2 s, left then right then score) with no tap needed.
- [ ] Round banner ("X wins the round" / "Draw") matches the revealed counts.
- [ ] Final result names the correct winner and reason (most people → round wins → sudden death / draw).
- [ ] "Play this book again" starts a fresh game with the same book.
- [ ] "Choose another book" returns to the library and the next game uses only the new book's spreads.
- [ ] Layout is usable on a small phone screen (setup inputs, Flip button, result cards reachable without horizontal scrolling).

As of this writing, the on-device pass is still outstanding — automated verification only (see §7). Complete this checklist on a phone before the first real session and note the device/browser in the session notes.

---

## 7. Automated verification (2026-10-11, all passing)

Run before every playtest round to catch regressions. Do not change game-core, finalized counts, or scoring rules to make these pass.

```sh
pnpm --filter @book-people/game-core test     # 32 tests: scoring, rounds, results
pnpm --filter @book-people/book-data test     # 22 tests: catalog, Alice (34 eligible), Punjab (38 eligible), isolation
pnpm -r run typecheck                          # game-core, book-data, game app
pnpm test:tools                                # 18 python toolkit tests + counter smoke test
pnpm --filter game exec expo export --platform web   # static web export builds
git diff --check                               # whitespace check
```

Plus a temporary vitest file (since removed) verified end-to-end on this machine: 3 playable books with correct titles/authors/covers, 5/10/15-round availability per book, Alice = 34 and Punjab = 38 eligible spreads, per-book asset bases resolving independently (same relative filename → different book URL), **every** eligible cover/page asset for both scanned books returning HTTP 200 via the LAN IP, full flip→score→result games for all books × round counts with consistent totals, restart, and no cross-book spread leaks.

---

## 8. Scope guardrails for this playtest

- The UI was already redesigned and checked — no broad redesign from this round.
- Fix only genuine playtest blockers: broken assets, unusable mobile layout, inaccessible controls, navigation failures, wrong metadata/scores, game-flow errors.
- Do not add accounts, multiplayer, leaderboards, payments, or AI features.
- Do not change game rules on assumptions — wait for actual player feedback from these sessions.
