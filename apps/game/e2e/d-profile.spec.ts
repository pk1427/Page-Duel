import { expect, test } from "@playwright/test";
import { collectErrors, expectNoAppErrors, signUp, uniqueEmail } from "./helpers";

/**
 * Test D — Profile and display-name persistence (desktop).
 * Mirrors the product validation rules (1–40 chars, trimmed).
 */
test.describe("profile and display-name persistence", () => {
  test("update persists, avatar reflects name, validation rejects bad names", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop", "profile flow covered once on desktop");
    const ledger = collectErrors(page);
    const email = uniqueEmail("bookpeople");
    await signUp(page, email);

    await page.goto("/profile");
    const nameField = page.getByRole("textbox", { name: "Display name", exact: true });
    await expect(nameField).toBeVisible();
    await expect(nameField).toHaveAttribute("maxlength", "40");

    // Change to a valid value and save.
    await nameField.fill("Ada Reader");
    await page.getByRole("button", { name: "Save display name", exact: true }).click();
    await expect(page.getByText("Saved to your shelf card.")).toBeVisible();

    // Reload: the updated name persists.
    await page.reload();
    await expect(page.getByText("Ada Reader").first()).toBeVisible({ timeout: 20_000 });
    // Avatar initial reflects the display name (AR for "Ada Reader").
    await expect(page.getByText("AR", { exact: true }).first()).toBeVisible();
    // Full email is displayed on Profile.
    await expect(page.getByText(email)).toBeVisible();
    // Email is not duplicated on Home.
    await page.goto("/");
    expect(await page.evaluate(() => document.body.innerText)).not.toContain(email);

    // Validation: empty and whitespace-only names fail without updating storage.
    await page.goto("/profile");
    await expect(page.getByText("Ada Reader").first()).toBeVisible();
    await nameField.fill("");
    await page.getByRole("button", { name: "Save display name", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Enter a display name.");
    await nameField.fill("   ");
    await page.getByRole("button", { name: "Save display name", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Enter a display name.");
    await page.reload();
    await expect(page.getByText("Ada Reader").first()).toBeVisible({ timeout: 20_000 });

    // Over-limit: the UI caps input at 40 chars and never stores more than that.
    await nameField.fill("x".repeat(50));
    expect(await nameField.inputValue()).toHaveLength(40);
    await page.getByRole("button", { name: "Save display name", exact: true }).click();
    await expect(page.getByText("Saved to your shelf card.")).toBeVisible();
    await page.reload();
    expect(await nameField.inputValue()).toHaveLength(40);

    expectNoAppErrors(ledger);
  });
});
