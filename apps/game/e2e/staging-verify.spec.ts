import { test, expect } from "@playwright/test";

// This suite uses a hosted project and is intentionally excluded from the
// local-only E2E workflow. Keep its selectors current, but never run it as
// part of the local browser suite.
test.describe.skip("Staging asset verification", () => {
  test("Alice cover and page load from Supabase Storage", async ({ page }) => {
    // Sign in with pre-created user
    await page.goto("/sign-in?next=/books");
    await page.getByPlaceholder("you@example.com").fill("staging-test@example.com");
    await page.getByPlaceholder("Your password").fill("E2e-Test-123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await page.waitForURL((url) => new URL(url).pathname === "/books", { timeout: 30000 });
    await expect(page.getByText("Choose a book")).toBeVisible();

    // Check Alice cover loads from Supabase
    const aliceCover = page.getByRole("img", { name: "Alice's Adventures in Wonderland cover" });
    await expect(aliceCover).toBeVisible();
    const aliceCoverSrc = await aliceCover.getAttribute("src");
    console.log("Alice cover src:", aliceCoverSrc);
    expect(aliceCoverSrc).toContain("idtukblrevdayhfjmetr.supabase.co");
    expect(aliceCoverSrc).toContain("book-assets");

    // Start Alice match
    await page.getByRole("button", { name: "Choose Alice's Adventures in Wonderland" }).click();
    await page.waitForURL((url) => new URL(url).pathname === "/setup");
    await page.getByPlaceholder("Player 1").fill("Left Reader");
    await page.getByPlaceholder("Player 2").fill("Right Reader");
    await page.getByRole("radio", { name: "5 rounds", exact: true }).click();
    await page.getByRole("button", { name: "Start game", exact: true }).click();
    await page.waitForURL((url) => new URL(url).pathname === "/game");
    await expect(page.getByText("Round 1 of 5")).toBeVisible();

    // Flip spread and verify page images load from Supabase
    await page.getByRole("button", { name: "Flip the page", exact: true }).click();
    const continueButton = page.getByRole("button", { name: "Next round", exact: true });
    await continueButton.waitFor({ state: "visible", timeout: 60000 });

    const leftPage = page.getByRole("img", { name: "Left Reader page" });
    const rightPage = page.getByRole("img", { name: "Right Reader page" });
    await expect(leftPage).toBeVisible();
    await expect(rightPage).toBeVisible();

    const leftSrc = await leftPage.getAttribute("src");
    const rightSrc = await rightPage.getAttribute("src");
    console.log("Left page src:", leftSrc);
    console.log("Right page src:", rightSrc);

    expect(leftSrc).toContain("idtukblrevdayhfjmetr.supabase.co");
    expect(rightSrc).toContain("idtukblrevdayhfjmetr.supabase.co");
    expect(leftSrc).toContain("book-assets");
    expect(rightSrc).toContain("book-assets");

    // Verify images have content
    const leftSize = await leftPage.evaluate((el) => ({
      w: (el as HTMLImageElement).naturalWidth,
      h: (el as HTMLImageElement).naturalHeight,
    }));
    const rightSize = await rightPage.evaluate((el) => ({
      w: (el as HTMLImageElement).naturalWidth,
      h: (el as HTMLImageElement).naturalHeight,
    }));
    expect(leftSize.w).toBeGreaterThan(0);
    expect(leftSize.h).toBeGreaterThan(0);
    expect(rightSize.w).toBeGreaterThan(0);
    expect(rightSize.h).toBeGreaterThan(0);

    // Continue to complete round
    await page.getByRole("button", { name: "Next round", exact: true }).click();
    try {
      await page.waitForURL((url) => new URL(url).pathname === "/result", { timeout: 8000 });
      console.log("Match completed to result screen");
    } catch {
      console.log("Match continued to next round");
    }
  });

  test("Punjab cover and page load from Supabase Storage", async ({ page }) => {
    // Sign in with pre-created user
    await page.goto("/sign-in?next=/books");
    await page.getByPlaceholder("you@example.com").fill("staging-test@example.com");
    await page.getByPlaceholder("Your password").fill("E2e-Test-123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await page.waitForURL((url) => new URL(url).pathname === "/books", { timeout: 30000 });
    await expect(page.getByText("Choose a book")).toBeVisible();

    // Check Punjab cover loads from Supabase
    const punjabCover = page.getByRole("img", { name: "Tales of the Punjab cover" });
    await expect(punjabCover).toBeVisible();
    const punjabCoverSrc = await punjabCover.getAttribute("src");
    console.log("Punjab cover src:", punjabCoverSrc);
    expect(punjabCoverSrc).toContain("idtukblrevdayhfjmetr.supabase.co");
    expect(punjabCoverSrc).toContain("book-assets");

    // Start Punjab match
    await page.getByRole("button", { name: "Choose Tales of the Punjab" }).click();
    await page.waitForURL((url) => new URL(url).pathname === "/setup");
    await page.getByPlaceholder("Player 1").fill("Left Reader");
    await page.getByPlaceholder("Player 2").fill("Right Reader");
    await page.getByRole("radio", { name: "5 rounds", exact: true }).click();
    await page.getByRole("button", { name: "Start game", exact: true }).click();
    await page.waitForURL((url) => new URL(url).pathname === "/game");
    await expect(page.getByText("Round 1 of 5")).toBeVisible();

    // Flip spread and verify page images load from Supabase
    await page.getByRole("button", { name: "Flip the page", exact: true }).click();
    const continueButton = page.getByRole("button", { name: "Next round", exact: true });
    await continueButton.waitFor({ state: "visible", timeout: 60000 });

    const leftPage = page.getByRole("img", { name: "Left Reader page" });
    const rightPage = page.getByRole("img", { name: "Right Reader page" });
    await expect(leftPage).toBeVisible();
    await expect(rightPage).toBeVisible();

    const leftSrc = await leftPage.getAttribute("src");
    const rightSrc = await rightPage.getAttribute("src");
    console.log("Left page src:", leftSrc);
    console.log("Right page src:", rightSrc);

    expect(leftSrc).toContain("idtukblrevdayhfjmetr.supabase.co");
    expect(rightSrc).toContain("idtukblrevdayhfjmetr.supabase.co");
    expect(leftSrc).toContain("book-assets");
    expect(rightSrc).toContain("book-assets");

    // Verify images have content
    const leftSize = await leftPage.evaluate((el) => ({
      w: (el as HTMLImageElement).naturalWidth,
      h: (el as HTMLImageElement).naturalHeight,
    }));
    const rightSize = await rightPage.evaluate((el) => ({
      w: (el as HTMLImageElement).naturalWidth,
      h: (el as HTMLImageElement).naturalHeight,
    }));
    expect(leftSize.w).toBeGreaterThan(0);
    expect(leftSize.h).toBeGreaterThan(0);
    expect(rightSize.w).toBeGreaterThan(0);
    expect(rightSize.h).toBeGreaterThan(0);
  });

  test("Practice Book plays without scanned assets", async ({ page }) => {
    await page.goto("/sign-in?next=/books");
    await page.getByPlaceholder("you@example.com").fill("staging-test@example.com");
    await page.getByPlaceholder("Your password").fill("E2e-Test-123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await page.waitForURL((url) => new URL(url).pathname === "/books", { timeout: 30000 });
    await expect(page.getByText("Choose a book")).toBeVisible();

    await page.getByRole("button", { name: "Choose The Book People Practice Book" }).click();
    await page.waitForURL((url) => new URL(url).pathname === "/setup");
    await page.getByPlaceholder("Player 1").fill("Ann");
    await page.getByPlaceholder("Player 2").fill("Bob");
    await page.getByRole("radio", { name: "5 rounds", exact: true }).click();
    await page.getByRole("button", { name: "Start game", exact: true }).click();
    await page.waitForURL((url) => new URL(url).pathname === "/game");
    await expect(page.getByText("Round 1 of 5")).toBeVisible();

    await page.getByRole("button", { name: "Flip the page", exact: true }).click();
    const continueButton = page.getByRole("button", { name: "Next round", exact: true });
    await continueButton.waitFor({ state: "visible", timeout: 30000 });

    console.log("Practice book round completed");
  });
});
