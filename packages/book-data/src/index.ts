import type { Spread } from "@book-people/game-core";
import { createBookCatalog, toPlayableBook, type BookContent } from "./content";
import aliceFinal from "./alice.final.json";
import punjabFinal from "./tales-of-punjab.final.json";

export * from "./content";

function count(index: number, salt: number): number {
  return (index * 7 + salt * 3 + 2) % 10;
}
const spreads: Spread[] = Array.from({ length: 40 }, (_, index) => ({
  id: `placeholder-${String(index + 1).padStart(3, "0")}`,
  left: { page: index * 2 + 1, image: `placeholder:${count(index, 1)}`, people: count(index, 1) },
  right: { page: index * 2 + 2, image: `placeholder:${count(index, 2)}`, people: count(index, 2) },
  flags: [],
}));
export const placeholderContentPack: BookContent = {
  id: "placeholder-book",
  title: "The Book People Practice Book",
  author: "Book People",
  description: "A small deterministic practice book for the first playable build.",
  coverImage: "placeholder:0",
  version: "1",
  status: "ready",
  spreads,
};

/** Kept for consumers that already pass the Practice Book directly to game-core. */
export const placeholderBook = toPlayableBook(placeholderContentPack);

/**
 * Exact final human-annotated data generated from the local Alice review workspace.
 * Canonical asset paths remain relative; WebP assets deliberately remain outside Git.
 */
export const aliceContentPack = aliceFinal as BookContent;

/**
 * Exact final human-annotated data generated from the local Punjab review workspace.
 * Canonical asset paths remain relative; WebP assets deliberately remain outside Git.
 */
export const punjabContentPack = punjabFinal as BookContent;

/** The catalog retains content lifecycle state while exposing ready/published books for play. */
export const bookCatalog = createBookCatalog([
  placeholderContentPack,
  aliceContentPack,
  punjabContentPack,
]);
