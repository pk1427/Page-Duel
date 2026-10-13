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
 * Test H — Account identity and two-player independence (desktop).
 * The profile display name must never overwrite per-match player names.
 */
test.describe("account identity and two-player independence", () => {
  test("profile display name stays separate from player names and scoring", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop", "identity check covered once on desktop");
    const ledger = collectErrors(page);
    const email = uniqueEmail("bookpeople");
    await signUp(page, email);

    // Name the account distinctly from the upcoming match players.
    await page.goto("/profile");
    const nameField = page.getByRole("textbox", { name: "Display name", exact: true });
    await nameField.fill("Account Holder");
    await page.getByRole("button", { name: "Save display name", exact: true }).click();
    await expect(page.getByText("Saved to your shelf card.")).toBeVisible();

    // Start a match with unrelated player names; the game shows only those.
    await startMatch(page, {
      bookButtonName: "Choose The Book People Practice Book",
      player1: "Alpha",
      player2: "Beta",
      rounds: 5,
    });
    const gameText = await visibleText(page);
    expect(gameText).toContain("Alpha");
    expect(gameText).toContain("Beta");
    expect(gameText).not.toContain("Account Holder");

    // Play a round and exit the match (navigation is hidden during a match).
    await playOneRound(page);
    await page.getByRole("button", { name: "Exit match", exact: true }).click();
    await page.getByRole("button", { name: "Exit Match", exact: true }).click();
    await expectPath(page, "/books");

    // Change the profile display name.
    await page.goto("/profile");
    await nameField.fill("Renamed Holder");
    await page.getByRole("button", { name: "Save display name", exact: true }).click();
    await expect(page.getByText("Saved to your shelf card.")).toBeVisible();

    // Start a fresh match with the same player names; the game must still
    // show the per-match player names, not the profile display name.
    await startMatch(page, {
      bookButtonName: "Choose The Book People Practice Book",
      player1: "Alpha",
      player2: "Beta",
      rounds: 5,
    });
    const freshGameText = await visibleText(page);
    expect(freshGameText).toContain("Alpha");
    expect(freshGameText).toContain("Beta");
    expect(freshGameText).not.toContain("Renamed Holder");

    expectNoAppErrors(ledger);
  });
});
