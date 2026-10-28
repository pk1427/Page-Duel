import { expect, test } from "@playwright/test";
import {
  collectErrors,
  expectNoAppErrors,
  expectPath,
  playOneRound,
  signUp,
  startMatch,
  uniqueEmail,
  visibleText,
} from "./helpers";

/**
 * Test G — Exit confirmation and match abandonment (desktop).
 * Regression coverage for the custom cross-platform exit dialog.
 */
test.describe("exit confirmation and match abandonment", () => {
  test("stay preserves the match; exit returns to bookshelf without a result", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop", "exit dialog covered once on desktop");
    const ledger = collectErrors(page);
    await signUp(page, uniqueEmail("bookpeople"));
    await startMatch(page, {
      bookButtonName: "Choose Alice's Adventures in Wonderland",
      player1: "Ann",
      player2: "Bob",
      rounds: 5,
    });
    await playOneRound(page);

    // Record visible round progress and scores before exiting.
    const before = await visibleText(page);
    expect(before).toMatch(/round 1 of 5/i);
    const stayButton = page.getByRole("button", { name: "Keep playing", exact: true });
    const exitConfirmButton = page.getByRole("button", { name: "Exit Match", exact: true });

    // Open the dialog and verify every required string.
    await page.getByRole("button", { name: "Exit match", exact: true }).click();
    await expect(page.getByText("Leave this match?")).toBeVisible();
    await expect(
      page.getByText("Your current match progress will be lost if you leave."),
    ).toBeVisible();
    await expect(stayButton).toBeVisible();
    await expect(exitConfirmButton).toBeVisible();
    // Both actions are genuinely clickable (non-zero hit targets, enabled).
    for (const button of [stayButton, exitConfirmButton]) {
      const box = await button.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThan(0);
      expect(box?.height ?? 0).toBeGreaterThan(44 - 1);
      await expect(button).toBeEnabled();
    }
    // Keyboard: focusing Stay and pressing Enter keeps the match.
    await stayButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Leave this match?")).toHaveCount(0);

    // Match remains intact: same round, scores, and scored spread banner.
    const afterStay = await visibleText(page);
    expect(afterStay).toMatch(/round 1 of 5/i);
    for (const fragment of before
      .split("\n")
      .filter((line) => /round wins|wins the round/.test(line))) {
      expect(afterStay).toContain(fragment);
    }

    // Open again and confirm the exit.
    await page.getByRole("button", { name: "Exit match", exact: true }).click();
    await expect(page.getByText("Leave this match?")).toBeVisible();
    await exitConfirmButton.click();
    await expectPath(page, "/books");
    // The visible "Choose a book" is the last in DOM order (Expo Router keeps
    // previous screens mounted with aria-hidden="true").
    await expect(page.getByText("Choose a book").last()).toBeVisible();

    // The abandoned match must not display a fabricated completed result.
    await page.goto("/result");
    await expect(page.getByText("No finished game yet")).toBeVisible({ timeout: 20_000 });

    // A fresh match afterwards is usable.
    await startMatch(page, {
      bookButtonName: "Choose Alice's Adventures in Wonderland",
      player1: "Ann",
      player2: "Bob",
      rounds: 5,
    });
    await expect(page.getByText("Round 1 of 5")).toBeVisible();
    const freshBanner = await playOneRound(page);
    expect(freshBanner.length).toBeGreaterThan(0);

    expectNoAppErrors(ledger);
  });
});
