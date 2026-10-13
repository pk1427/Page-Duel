import { expect, type Page } from "@playwright/test";

/**
 * Shared helpers for the Book People browser E2E suite.
 *
 * All helpers drive the real UI (no API shortcuts, no mocked game logic).
 * Every test starts from a clean browser context with no stored session.
 */

export const E2E_PASSWORD = "E2e-Test-123!";
export const ALICE_ASSET_BASE = "http://localhost:8000/book-people-alice-loc/alice-loc-1885";
export const PUNJAB_ASSET_BASE =
  "http://localhost:8000/book-people-punjab-1894/tales-of-punjab-1894";

export function uniqueEmail(prefix = "e2e"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}@example.com`;
}

export type ErrorLedger = {
  pageErrors: string[];
  consoleErrors: string[];
  failedRequests: string[];
};

/**
 * Attach console/page/network collectors. Call before navigation.
 * Filters out expected noise: aborted navigations (client-side redirects)
 * and deviations the tests declare explicitly.
 */
export function collectErrors(page: Page): ErrorLedger {
  const ledger: ErrorLedger = { pageErrors: [], consoleErrors: [], failedRequests: [] };
  page.on("pageerror", (error) => ledger.pageErrors.push(String(error?.message ?? error)));
  page.on("console", (message) => {
    if (message.type() === "error") ledger.consoleErrors.push(message.text().slice(0, 500));
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "";
    // Expo Router client-side redirects abort in-flight requests; not a bug.
    if (/aborted|ERR_ABORTED|net::ERR_ABORTED/i.test(failure)) return;
    ledger.failedRequests.push(`${request.method()} ${request.url()} :: ${failure}`.slice(0, 300));
  });
  page.on("response", (response) => {
    const url = response.url();
    const firstParty =
      url.includes("localhost:8081") || url.includes(":8000/") || url.includes("127.0.0.1:54321");
    if (firstParty && response.status() >= 400) {
      ledger.failedRequests.push(`${response.status()} ${url}`.slice(0, 300));
    }
  });
  return ledger;
}

export function expectNoAppErrors(ledger: ErrorLedger): void {
  expect(ledger.pageErrors, `uncaught page errors: ${ledger.pageErrors.join(" | ")}`).toEqual([]);
  expect(ledger.consoleErrors, `console errors: ${ledger.consoleErrors.join(" | ")}`).toEqual([]);
  expect(
    ledger.failedRequests,
    `failed first-party requests: ${ledger.failedRequests.join(" | ")}`,
  ).toEqual([]);
}

/** Wait for Expo web client-side navigation to settle on an expected path. */
export async function expectPath(page: Page, path: string): Promise<void> {
  await page.waitForURL((url) => new URL(url).pathname === path, { timeout: 20_000 });
  expect(new URL(page.url()).pathname).toBe(path);
}

/**
 * Text of the active screen only. Expo Router keeps previously visited stack
 * screens mounted under aria-hidden="true"; plain innerText would include
 * their stale content (e.g. an old scoreboard behind the results screen).
 */
export async function visibleText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let out = "";
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const el = node.parentElement;
      if (!el) continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      const text = node.textContent?.trim();
      if (text) out += `${text}\n`;
    }
    return out;
  });
}

/** Create an account through the real sign-up UI; ends on the Bookshelf. */
export async function signUp(page: Page, email: string, password = E2E_PASSWORD): Promise<void> {
  await page.goto("/sign-up?next=/books");
  // Wait for the sign-up form to be fully hydrated
  await page.getByPlaceholder("you@example.com").waitFor({ state: "visible", timeout: 15_000 });
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("At least 6 characters").fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  // Local Supabase autoconfirms email (mailer_autoconfirm), so signup
  // establishes a session and continues to Bookshelf per the spec.
  await expectPath(page, "/books");
  await expect(page.getByText("Choose a book")).toBeVisible();
}

/** Sign in through the real sign-in UI. */
export async function signIn(
  page: Page,
  email: string,
  password = E2E_PASSWORD,
  next = "/books",
): Promise<void> {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Your password").fill(password);
  // .last(): the top bar also carries a "Sign in" link on desktop; the form
  // submit renders after the header in DOM order on every viewport.
  await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
  await expectPath(page, "/books");
}

/** Sign out through the profile page. */
export async function signOut(page: Page): Promise<void> {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expectPath(page, "/");
  // Home page shows the brand in the top nav (desktop) or bottom bar (mobile)
  await Promise.all([
    expect(page.getByRole("button", { name: "Book People home" }))
      .toBeVisible()
      .catch(() => {}),
    expect(page.getByRole("button", { name: "Home", exact: true }))
      .toBeVisible()
      .catch(() => {}),
  ]);
}

export type MatchOptions = {
  bookButtonName: string | RegExp;
  player1: string;
  player2: string;
  rounds: 5 | 10 | 15;
};

/** Choose a book, set names + round count, and start a match via the real UI. */
export async function startMatch(page: Page, options: MatchOptions): Promise<void> {
  const { bookButtonName, player1, player2, rounds } = options;
  await page.goto("/books");
  await expect(page.getByText("Choose a book")).toBeVisible();
  await page.getByRole("button", { name: bookButtonName }).click();
  await expectPath(page, "/setup");
  await page.getByPlaceholder("Player 1").fill(player1);
  await page.getByPlaceholder("Player 2").fill(player2);
  // exact:true matters: "5 rounds" is a substring of "15 rounds".
  await page.getByRole("radio", { name: `${rounds} rounds`, exact: true }).click();
  await page.getByRole("button", { name: "Start Game", exact: true }).click();
  await expectPath(page, "/game");
  await expect(page.getByText(`Round 1 of ${rounds}`)).toBeVisible();
}

const REVEAL_MS = 800 + 800 + 600;

/** Flip one spread and wait until the round is scored (Continue control appears). */
export async function playOneRound(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Flip spread", exact: true }).click();
  const continueButton = page.getByRole("button", { name: "Continue game", exact: true });
  await continueButton.waitFor({ state: "visible", timeout: REVEAL_MS + 15_000 });
  // Round banner text ("X wins the round" / "Draw") on the active screen.
  const body = await visibleText(page);
  const banner = /wins the round/.test(body)
    ? (body.match(/.+ wins the round/)?.[0] ?? "")
    : /Draw/.test(body)
      ? "Draw"
      : "";
  return banner;
}

/**
 * Advance past a scored round. Returns "result" when the match finished and
 * the app navigated to /result, otherwise "next".
 */
export async function advanceFromScored(page: Page): Promise<"result" | "next"> {
  await page.getByRole("button", { name: "Continue game", exact: true }).click();
  try {
    await page.waitForURL((url) => new URL(url).pathname === "/result", { timeout: 8_000 });
    return "result";
  } catch {
    return "next";
  }
}

/** Play a full match through the real UI until the results screen appears. */
export async function playFullMatch(page: Page, rounds: 5 | 10 | 15): Promise<void> {
  const maxIterations = rounds + 6; // headroom for sudden-death rounds
  for (let i = 0; i < maxIterations; i++) {
    if (new URL(page.url()).pathname === "/result") return;
    const flip = page.getByRole("button", { name: "Flip spread", exact: true });
    if ((await flip.count()) > 0 && (await flip.isVisible())) {
      await playOneRound(page);
    }
    if (new URL(page.url()).pathname === "/result") return;
    const outcome = await advanceFromScored(page);
    if (outcome === "result") return;
  }
  throw new Error(`match did not reach /result within ${maxIterations} rounds`);
}
