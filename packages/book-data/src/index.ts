import type { Book, Spread } from "@book-people/game-core";

function count(index: number, salt: number): number { return (index * 7 + salt * 3 + 2) % 10; }
const spreads: Spread[] = Array.from({ length: 40 }, (_, index) => ({
  id: `placeholder-${String(index + 1).padStart(3, "0")}`,
  left: { page: index * 2 + 1, image: `placeholder:${count(index, 1)}`, people: count(index, 1) },
  right: { page: index * 2 + 2, image: `placeholder:${count(index, 2)}`, people: count(index, 2) },
  flags: [],
}));
export const placeholderBook: Book = { id: "placeholder-book", title: "The Book People Practice Book", author: "Book People", license: "Placeholder data", coverImage: "placeholder:0", spreads };
