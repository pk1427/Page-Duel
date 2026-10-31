import { describe, expect, it } from "vitest";
import { filterCatalogByLanguage, type CatalogBook } from "../src/catalog";

const book = (id: string, language: CatalogBook["language"]): CatalogBook => ({
  id,
  slug: id,
  title: id,
  author: null,
  description: null,
  coverAssetPath: null,
  status: "published",
  versionId: `${id}:v1`,
  versionLabel: "v1",
  manifestSha256: null,
  language,
  content: null,
});

describe("filterCatalogByLanguage", () => {
  const catalog = [book("english", "en"), book("hindi", "hi"), book("marathi", "mr")];

  it("shows only matching content languages", () => {
    expect(filterCatalogByLanguage(catalog, "hi").map((entry) => entry.id)).toEqual(["hindi"]);
  });

  it("keeps all published content for the all-languages filter", () => {
    expect(filterCatalogByLanguage(catalog, "all")).toEqual(catalog);
  });
});
