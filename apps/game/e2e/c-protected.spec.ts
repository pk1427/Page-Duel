import { expect, test } from "@playwright/test";
import {
  collectErrors,
  expectNoAppErrors,
  expectPath,
  signIn,
  signUp,
  uniqueEmail,
  visibleText,
} from "./helpers";

/**
 * Test C — Protected routes and redirect handling (clean signed-out context).
 * Runs on both viewports; navigation rules are viewport-independent.
 */
const PROTECTED = ["/books", "/setup", "/game", "/result", "/profile"] as const;

test.describe("protected routes and redirect handling", () => {
  test("signed-out visits to protected routes land on sign-in", async ({ page }) => {
    const ledger = collectErrors(page);
    for (const route of PROTECTED) {
      await page.goto(route);
      // Wait for session restoration + redirect to settle before asserting.
      await page.waitForURL((url) => new URL(url).pathname === "/sign-in", { timeout: 20_000 });
      const text = await page.evaluate(() => document.body.innerText);
      expect(text, `route ${route} must not leak protected content`).not.toContain("Choose a book");
      // Either the sign-in form or the signed-out gate is shown — never gameplay.
      expect(text).toMatch(/Sign in|Opening your book/);
    }
    // Refreshing a protected route does not bypass authentication.
    await page.goto("/game");
    await page.waitForURL((url) => new URL(url).pathname === "/sign-in", { timeout: 20_000 });
    await page.reload();
    await page.waitForURL((url) => new URL(url).pathname === "/sign-in", { timeout: 20_000 });
    expectNoAppErrors(ledger);
  });

  test("safe next returns to bookshelf; malicious next cannot escape", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop", "redirect matrix covered once on desktop");
    const ledger = collectErrors(page);
    const email = uniqueEmail("bookpeople");

    // Safe next=/books returns to Bookshelf after sign-up.
    await signUp(page, email);

    // Sign out, then verify malicious/unsupported next values fall back to /books.
    await page.goto("/profile");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expectPath(page, "/");
    for (const bad of [
      "https://evil.example/books",
      "//evil.example",
      "/profile",
      "/game",
      "javascript:alert(1)",
    ]) {
      await signIn(page, email, "E2e-Test-123!", bad);
      await page.goto("/profile");
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expectPath(page, "/");
    }
    expectNoAppErrors(ledger);
  });

  test("signing out then going back does not restore protected content", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop", "back-button check covered once on desktop");
    const ledger = collectErrors(page);
    await signUp(page, uniqueEmail("bookpeople"));
    await page.goto("/profile");
    await expect(page.getByText("Your shelf card")).toBeVisible();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expectPath(page, "/");
    await page.goBack();
    // History may revisit /profile, but the gate must redirect to sign-in.
    await page.waitForURL((url) => new URL(url).pathname === "/sign-in", { timeout: 20_000 });
    const text = await visibleText(page);
    expect(text).not.toContain("Your shelf card");
    expectNoAppErrors(ledger);
  });
});
