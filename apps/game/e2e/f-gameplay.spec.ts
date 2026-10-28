import { expect, test } from "@playwright/test";
import {
  collectErrors,
  expectNoAppErrors,
  expectPath,
  playFullMatch,
  playOneRound,
  signUp,
  startMatch,
  uniqueEmail,
  visibleText,
} from "./helpers";

/**
 * Test F — Full match and gameplay scoring (desktop).
 * Plays a real 5-round match through the UI. Nothing about the winner is
 * hardcoded: assertions are derived from the actual displayed game state.
 */
test.describe("full match and gameplay scoring", () => {
  test("setup options, full match to results, result navigation", async ({ page }) => {
    test.setTimeout(300_000);
    test.skip(test.info().project.name !== "desktop", "full match covered once on desktop");
    const ledger = collectErrors(page);
    await signUp(page, uniqueEmail("bookpeople"));

    // Round-count options 5/10/15 are exposed where the UI offers them.
    await page.goto("/books");
    await page.getByRole("button", { name: "Choose The Book People Practice Book" }).click();
    await expectPath(page, "/setup");
    for (const rounds of [5, 10, 15] as const) {
      await expect(
        page.getByRole("radio", { name: `${rounds} rounds`, exact: true }),
      ).toBeVisible();
    }

    await startMatch(page, {
      bookButtonName: "Choose The Book People Practice Book",
      player1: "Ann",
      player2: "Bob",
      rounds: 5,
    });

    // Initial game state: correct screen, round progress, names, zeroed scores.
    await expect(page.getByText("Round 1 of 5")).toBeVisible();
    await expect(page.getByText("Ann", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Bob", { exact: true }).first()).toBeVisible();

    // One normal round through the real controls: banner + progress + scores.
    const banner = await playOneRound(page);
    expect(["wins the round", "Draw"].some((fragment) => banner.includes(fragment))).toBe(true);
    const afterRound = await visibleText(page);
    expect(afterRound).toMatch(/wins the round|Draw/);
    expect(afterRound).toMatch(/round wins/);

    // Finish the match; results show the actual final game state.
    await playFullMatch(page, 5);
    await expectPath(page, "/result");

    // Derive the expected outcome from the displayed totals (no hardcoded winner).
    const resultText = await visibleText(page);
    const totals = [...resultText.matchAll(/(\d+)\s*people/g)].map((m) => Number(m[1]));
    const wins = [...resultText.matchAll(/(\d+)\s*round wins/g)].map((m) => Number(m[1]));
    expect(totals.length).toBeGreaterThanOrEqual(2);
    expect(wins.length).toBeGreaterThanOrEqual(2);
    const [annTotal, bobTotal] = totals;
    const [annWins, bobWins] = wins;
    const heading = resultText;
    if (annTotal !== bobTotal) {
      const leader = annTotal > bobTotal ? "Ann" : "Bob";
      expect(heading).toContain(`${leader} wins`);
      expect(heading).toMatch(/people total/);
    } else if (annWins !== bobWins) {
      const leader = annWins > bobWins ? "Ann" : "Bob";
      expect(heading).toContain(`${leader} wins`);
      expect(heading).toMatch(/round wins/);
    } else {
      expect(heading).toMatch(/draw|wins/i);
    }
    // Winner badge appears exactly once for decisive games, never for draws.
    const winnerBadges = resultText.split("\n").filter((line) => line === "Winner").length;
    expect(winnerBadges).toBe(annTotal === bobTotal && annWins === bobWins ? 0 : 1);

    // Play Again starts a fresh match with the same players.
    await page.getByRole("button", { name: "Play again", exact: true }).click();
    await expectPath(page, "/game");
    await expect(page.getByText("Round 1 of 5")).toBeVisible();

    // Finish again, then Choose Another Book returns to book selection.
    await playFullMatch(page, 5);
    await expectPath(page, "/result");
    await page.getByRole("button", { name: "Choose Another Book", exact: true }).click();
    await expectPath(page, "/books");
    // The visible "Choose a book" is the last in DOM order (Expo Router keeps
    // previous screens mounted with aria-hidden="true").
    await expect(page.getByText("Choose a book").last()).toBeVisible();

    // Return Home navigates home (via a fresh finished match).
    await startMatch(page, {
      bookButtonName: "Choose The Book People Practice Book",
      player1: "Ann",
      player2: "Bob",
      rounds: 5,
    });
    await playFullMatch(page, 5);
    await expectPath(page, "/result");
    await page.getByRole("button", { name: "Return Home", exact: true }).click();
    await expectPath(page, "/");
    await expect(page.getByText("Book People").first()).toBeVisible();

    expectNoAppErrors(ledger);
  });
});
