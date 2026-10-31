import { expect, test } from "@playwright/test";
import { collectErrors, expectNoAppErrors, expectPath, signUp, uniqueEmail } from "./helpers";

/**
 * Test B — Authentication and session persistence (desktop).
 * Uses a fresh dedicated E2E account per run; never touches existing users.
 */
test.describe("authentication and session persistence", () => {
  test("sign up, session restore on refresh, profile identity, sign out", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop", "auth flow covered once on desktop");
    const ledger = collectErrors(page);
    const email = uniqueEmail("bookpeople");

    // 1–3. Create an account through the real sign-up UI; Bookshelf follows.
    await signUp(page, email);
    await expect(page.getByText("Choose a book")).toBeVisible();

    // Home recognizes the signed-in user.
    await page.goto("/");
    await expect(page.getByText("Signed in. Press Play.")).toBeVisible();

    // 4. Refresh restores the session (no bounce to sign-in).
    await page.reload();
    await expect(page.getByText("Signed in. Press Play.")).toBeVisible({ timeout: 20_000 });
    await page.goto("/books");
    await expect(page.getByText("Choose a book")).toBeVisible();

    // 5. Profile displays the correct account.
    await page.goto("/profile");
    await expect(page.getByText(email)).toBeVisible();

    // 6. Sign out ends the session and protected content is blocked.
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expectPath(page, "/");
    await expect(page.getByText("Sign in to play")).toBeVisible();
    await page.goto("/books");
    await page.waitForURL((url) => new URL(url).pathname === "/sign-in", { timeout: 20_000 });
    await expect(page.getByText("Pick up where you left off.")).toBeVisible();

    expectNoAppErrors(ledger);
  });
});
