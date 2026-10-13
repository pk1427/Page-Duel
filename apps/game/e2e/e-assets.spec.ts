import { expect, test } from "@playwright/test";
import {
  ALICE_ASSET_BASE,
  PUNJAB_ASSET_BASE,
  collectErrors,
  expectNoAppErrors,
  playOneRound,
  signUp,
  startMatch,
  uniqueEmail,
} from "./helpers";

/**
 * Test E — Book cover and scanned page assets (desktop).
 * Uses the real local asset server; any failed asset request fails the test.
 */
test.describe("book cover and scanned page assets", () => {
  test("covers render; Alice and Punjab spreads load with correct bases", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop", "asset flow covered once on desktop");
    const ledger = collectErrors(page);
    await signUp(page, uniqueEmail("bookpeople"));

    // Bookshelf covers for both scanned books resolve to their per-book bases.
    const aliceCover = page.getByRole("img", { name: "Alice's Adventures in Wonderland cover" });
    const punjabCover = page.getByRole("img", { name: "Tales of the Punjab cover" });
    await expect(aliceCover).toBeVisible();
    await expect(punjabCover).toBeVisible();
    expect(await aliceCover.getAttribute("src")).toContain(ALICE_ASSET_BASE);
    expect(await punjabCover.getAttribute("src")).toContain(PUNJAB_ASSET_BASE);
    for (const img of [aliceCover, punjabCover]) {
      const size = await img.evaluate((el) => ({
        w: (el as HTMLImageElement).naturalWidth,
        h: (el as HTMLImageElement).naturalHeight,
      }));
      expect(size.w, "cover must have nonzero width").toBeGreaterThan(0);
      expect(size.h, "cover must have nonzero height").toBeGreaterThan(0);
    }

    for (const book of [
      {
        choose: "Choose Alice's Adventures in Wonderland",
        base: ALICE_ASSET_BASE,
        forbiddenBase: PUNJAB_ASSET_BASE,
      },
      {
        choose: "Choose Tales of the Punjab",
        base: PUNJAB_ASSET_BASE,
        forbiddenBase: ALICE_ASSET_BASE,
      },
    ] as const) {
      await startMatch(page, {
        bookButtonName: book.choose,
        player1: "Left Reader",
        player2: "Right Reader",
        rounds: 5,
      });
      const banner = await playOneRound(page);
      expect(banner.length, "round must score and show a banner").toBeGreaterThan(0);

      // Left and right pages appear together with the correct per-book base.
      const leftPage = page.getByRole("img", { name: "Left Reader page" });
      const rightPage = page.getByRole("img", { name: "Right Reader page" });
      await expect(leftPage).toBeVisible();
      await expect(rightPage).toBeVisible();
      const leftSrc = await leftPage.getAttribute("src");
      const rightSrc = await rightPage.getAttribute("src");
      expect(leftSrc, "left page src matches book base").toContain(book.base);
      expect(rightSrc, "right page src matches book base").toContain(book.base);
      expect(leftSrc, "left page must not leak the other book").not.toContain(book.forbiddenBase);
      expect(rightSrc, "right page must not leak the other book").not.toContain(book.forbiddenBase);
      for (const img of [leftPage, rightPage]) {
        const size = await img.evaluate((el) => ({
          w: (el as HTMLImageElement).naturalWidth,
          h: (el as HTMLImageElement).naturalHeight,
        }));
        expect(size.w, "spread page must have nonzero width").toBeGreaterThan(0);
        expect(size.h, "spread page must have nonzero height").toBeGreaterThan(0);
      }
      // Paired pages: both srcs share the book base but are distinct files.
      expect(leftSrc).not.toEqual(rightSrc);
    }

    // No failed asset requests across the whole journey.
    expectNoAppErrors(ledger);
  });

  test("practice book plays without scanned assets (smoke)", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop", "smoke covered once on desktop");
    const ledger = collectErrors(page);
    await signUp(page, uniqueEmail("bookpeople"));
    await startMatch(page, {
      bookButtonName: "Choose The Book People Practice Book",
      player1: "Ann",
      player2: "Bob",
      rounds: 5,
    });
    const banner = await playOneRound(page);
    expect(banner.length).toBeGreaterThan(0);
    expectNoAppErrors(ledger);
  });
});
