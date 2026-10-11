import { describe, expect, it } from "vitest";
import {
  createBookCatalog,
  isRelativeAssetPath,
  placeholderContentPack,
  resolvePageAsset,
  validateContentPack,
  type BookContent,
} from "../src";
import { resolveContentAsset } from "../../../apps/game/src/content-assets";

function draftPack(): BookContent {
  return {
    id: "second-book-draft",
    title: "Second Book",
    author: "An Author",
    year: 1904,
    description: "A real-source draft awaiting human annotation.",
    source: {
      name: "Library of Congress",
      url: "https://www.loc.gov/item/04022857/",
      rights: "Public domain; free to use and reuse.",
    },
    version: "1",
    status: "draft",
    coverImage: "cover.webp",
    spreads: [
      {
        id: "s001",
        left: { page: 1, sourcePage: 12, printedPage: 1, image: "pages/p001.webp", people: null },
        right: { page: 2, sourcePage: 13, printedPage: 2, image: "pages/p002.webp", people: null },
        flags: [],
      },
    ],
  };
}

describe("reusable content-pack contract", () => {
  it("accepts a valid draft with relative paths but does not expose it for play", () => {
    const pack = draftPack();
    const validation = validateContentPack(pack, {
      assetPaths: new Set(["cover.webp", "pages/p001.webp", "pages/p002.webp"]),
    });
    expect(validation).toMatchObject({ ok: true, playable: false, eligibleSpreadCount: 0 });
    expect(validation.roundAvailability).toEqual({ 5: false, 10: false, 15: false });
    expect(createBookCatalog([placeholderContentPack, pack]).listPlayableBooks()).toEqual([
      placeholderContentPack,
    ]);
  });

  it("rejects invalid ready data, duplicate pages, absent assets, and host-specific paths", () => {
    const pack = draftPack();
    const invalid: BookContent = {
      ...pack,
      status: "ready",
      coverImage: "http://localhost:8000/cover.webp",
      spreads: [
        {
          ...pack.spreads[0]!,
          left: { ...pack.spreads[0]!.left, image: "/Users/example/pages/p001.webp" },
          right: { ...pack.spreads[0]!.left, image: "pages/not-present.webp", people: null },
        },
      ],
    };
    const validation = validateContentPack(invalid, { assetPaths: new Set(["pages/p001.webp"]) });
    expect(validation.ok).toBe(false);
    expect(validation.errors.join("\n")).toMatch(/relative asset path|uncounted|does not exist/);
  });

  it("calculates 5, 10, and 15 round availability from generic content", () => {
    const pack: BookContent = {
      ...draftPack(),
      status: "ready",
      spreads: Array.from({ length: 30 }, (_, index) => ({
        id: `s${String(index + 1).padStart(3, "0")}`,
        left: { page: index * 2 + 1, image: `pages/p${index * 2 + 1}.webp`, people: 1 },
        right: { page: index * 2 + 2, image: `pages/p${index * 2 + 2}.webp`, people: 0 },
        flags: [],
      })),
    };
    expect(validateContentPack(pack).roundAvailability).toEqual({ 5: true, 10: true, 15: true });
  });

  it("resolves a canonical relative path only against the caller's runtime host", () => {
    expect(isRelativeAssetPath("pages/p002.webp")).toBe(true);
    expect(isRelativeAssetPath("http://localhost:8000/pages/p002.webp")).toBe(false);
    expect(isRelativeAssetPath("/Users/example/p002.webp")).toBe(false);
    expect(resolvePageAsset(draftPack(), { image: "pages/p002.webp" })).toBe("pages/p002.webp");
    expect(
      resolvePageAsset(
        draftPack(),
        { image: "pages/p002.webp" },
        "https://cdn.example/books/pinocchio/",
      ),
    ).toBe("https://cdn.example/books/pinocchio/pages/p002.webp");
  });

  it("uses generic and per-book runtime asset bases without changing content", () => {
    const pack = draftPack();
    const previousGeneric = process.env.EXPO_PUBLIC_BOOK_ASSET_BASE_URL;
    const previousPerBook = process.env.EXPO_PUBLIC_BOOK_ASSET_BASE_URL_SECOND_BOOK_DRAFT;
    process.env.EXPO_PUBLIC_BOOK_ASSET_BASE_URL = "https://cdn.example/books";
    expect(resolveContentAsset(pack, { image: "pages/p002.webp" })).toBe(
      "https://cdn.example/books/pages/p002.webp",
    );
    process.env.EXPO_PUBLIC_BOOK_ASSET_BASE_URL_SECOND_BOOK_DRAFT =
      "https://special.example/packs/second";
    expect(resolveContentAsset(pack, { image: "pages/p002.webp" })).toBe(
      "https://special.example/packs/second/pages/p002.webp",
    );
    if (previousGeneric === undefined) delete process.env.EXPO_PUBLIC_BOOK_ASSET_BASE_URL;
    else process.env.EXPO_PUBLIC_BOOK_ASSET_BASE_URL = previousGeneric;
    if (previousPerBook === undefined)
      delete process.env.EXPO_PUBLIC_BOOK_ASSET_BASE_URL_SECOND_BOOK_DRAFT;
    else process.env.EXPO_PUBLIC_BOOK_ASSET_BASE_URL_SECOND_BOOK_DRAFT = previousPerBook;
  });
});
