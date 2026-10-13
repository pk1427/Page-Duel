import { expect, test } from "@playwright/test";
import { collectErrors, expectNoAppErrors } from "./helpers";

/**
 * Test A — Public pages and navigation (signed out, clean context).
 * Runs on both desktop and mobile projects; viewport-specific branch asserts
 * exactly one navigation system is visible at a time.
 */
test.describe("public pages and navigation", () => {
  test("home loads, how-to-play is public, Play redirects to sign-in", async ({
    page,
  }, testInfo) => {
    const ledger = collectErrors(page);
    const isMobile = testInfo.project.name === "mobile";

    await page.goto("/");
    await expect(page.getByText("Book People").first()).toBeVisible();
    await expect(page.getByText("More people on your page wins the round.")).toBeVisible();
    // Signed-out home offers sign-in, not a session badge.
    await expect(page.getByText("Sign in to play")).toBeVisible();
    // Full account email is never scattered on Home.
    expect(await page.evaluate(() => document.body.innerText)).not.toContain("@example.com");

    if (isMobile) {
      // Mobile: bottom bar only — brand top bar must not render.
      await expect(page.getByRole("button", { name: "Book People home" })).toHaveCount(0);
      for (const item of ["Home", "Play", "How to Play", "Profile"]) {
        await expect(page.getByRole("button", { name: item, exact: true }).first()).toBeVisible();
      }
      // Signed-out bottom bar routes Profile to sign-in, so no top-bar variant exists.
      await expect(page.getByRole("button", { name: "Sign in", exact: true })).toHaveCount(0);
    } else {
      // Desktop: compact top bar only. (Home content also has Play/How to Play
      // call-to-action buttons, so counts are scoped: the bottom bar is proven
      // absent by its distinctive Profile entry.)
      await expect(page.getByRole("button", { name: "Book People home" })).toHaveCount(1);
      await expect(
        page.getByRole("button", { name: "Sign in", exact: true }).first(),
      ).toBeVisible();
      // No bottom-bar Profile button alongside the top bar.
      await expect(page.getByRole("button", { name: "Profile", exact: true })).toHaveCount(0);
    }

    // How to Play is public while signed out.
    await page.getByRole("button", { name: "How to Play", exact: true }).first().click();
    await page.waitForURL((url) => new URL(url).pathname === "/how-to-play");
    await expect(page.getByText("Two players, one open book.")).toBeVisible();

    // Play while signed out redirects to Sign In with a safe return.
    await page.goto("/");
    await page.getByRole("button", { name: "Play", exact: true }).first().click();
    await page.waitForURL((url) => new URL(url).pathname === "/sign-in");
    expect(new URL(page.url()).searchParams.get("next")).toBe("/books");
    await expect(page.getByText("Your shelf of finished games is waiting.")).toBeVisible();
    // The sign-in screen offers account creation.
    await expect(page.getByRole("button", { name: "New here? Create an account" })).toBeVisible();

    expectNoAppErrors(ledger);
  });
});
