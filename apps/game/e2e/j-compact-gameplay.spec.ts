import { expect, test, type Page } from "@playwright/test";
import { expectPath, signUp, startMatch, uniqueEmail } from "./helpers";

const phoneViewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;

async function expectInViewport(page: Page, label: string): Promise<void> {
  const target = page.getByLabel(label, { exact: true });
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  const viewport = page.viewportSize();
  expect(box, `${label} needs a measurable box`).not.toBeNull();
  expect(viewport, "test needs a browser viewport").not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(
    box!.y + box!.height,
    `${label} should be reachable without scrolling`,
  ).toBeLessThanOrEqual(viewport!.height);
}

test.describe("compact mobile gameplay layout", () => {
  test("keeps scores, the open spread, and controls together on phone viewports", async ({
    page,
  }) => {
    test.skip(test.info().project.name !== "mobile", "mobile layout is covered once");
    test.setTimeout(180_000);

    await signUp(page, uniqueEmail("compact-game"));
    await page.getByRole("button", { name: "Choose The Book People Practice Book" }).click();
    await expectPath(page, "/setup");

    for (const viewport of phoneViewports) {
      await page.setViewportSize(viewport);
      await expectInViewport(page, "Selected book");
      await expectInViewport(page, "Change book");
      const card = await page.getByLabel("Selected book", { exact: true }).boundingBox();
      const change = await page.getByLabel("Change book", { exact: true }).boundingBox();
      expect(card).not.toBeNull();
      expect(change).not.toBeNull();
      expect(change!.y).toBeGreaterThanOrEqual(card!.y);
      expect(change!.y + change!.height).toBeLessThanOrEqual(card!.y + card!.height);
    }

    await startMatch(page, {
      bookButtonName: "Choose The Book People Practice Book",
      player1: "Ann",
      player2: "Bob",
      rounds: 5,
    });

    for (const viewport of phoneViewports) {
      await page.setViewportSize(viewport);
      await expectInViewport(page, "Ann score");
      await expectInViewport(page, "Bob score");
      await expectInViewport(page, "Open book spread");
      await expectInViewport(page, "Flip the page");
      await expectInViewport(page, "Exit match");
    }

    await page.getByRole("button", { name: "Flip the page", exact: true }).click();
    await page.getByRole("button", { name: "Next round", exact: true }).waitFor({ state: "visible" });

    for (const viewport of phoneViewports) {
      await page.setViewportSize(viewport);
      await expectInViewport(page, "Ann score");
      await expectInViewport(page, "Bob score");
      await expectInViewport(page, "Open book spread");
      await expectInViewport(page, "Next round");
      await expectInViewport(page, "Exit match");
    }
  });
});
