import type { Book, Page, Spread, SpreadFlag } from "@book-people/game-core";

/** Content lifecycle is owned by the catalog, never by game-core. */
export type BookStatus = "draft" | "ready" | "published";

/** A page while a book is being prepared may not yet have a human count. */
export interface ContentPage extends Omit<Page, "people"> {
  readonly people: number | null;
}

export interface ContentSpread extends Omit<Spread, "left" | "right" | "flags"> {
  readonly left: ContentPage;
  readonly right: ContentPage;
  readonly flags?: readonly SpreadFlag[];
  readonly notes?: string;
}

/** Source-facing metadata; gameplay only receives the derived Book. */
export interface BookContent {
  readonly id: string;
  readonly title: string;
  readonly author?: string;
  readonly year?: number;
  readonly description?: string;
  readonly coverImage?: string;
  /** Optional content-host base URL; game-core only ever receives resolved image strings. */
  readonly assetBaseUrl?: string;
  readonly version: string;
  readonly status: BookStatus;
  readonly source?: { readonly name: string; readonly url?: string };
  readonly spreads: readonly ContentSpread[];
}

export interface ContentValidation {
  readonly ok: boolean;
  readonly playable: boolean;
  readonly errors: readonly string[];
}

function pageErrors(spread: ContentSpread, page: ContentPage, errors: string[]): void {
  if (!Number.isInteger(page.page) || page.page < 0) {
    errors.push(`Spread ${spread.id}: page reference must be a non-negative integer`);
  }
  if (!page.image) errors.push(`Spread ${spread.id} page ${page.page}: missing image reference`);
  if (page.people !== null && (!Number.isInteger(page.people) || page.people < 0)) {
    errors.push(`Spread ${spread.id} page ${page.page}: people must be an integer >= 0 or null`);
  }
}

/** Validate content independently from the stricter game-core Book validation. */
export function validateContentPack(content: BookContent): ContentValidation {
  const errors: string[] = [];
  if (!content.id) errors.push("Missing book id");
  if (!content.title.trim()) errors.push("Missing title");
  if (!content.version) errors.push("Missing content version");
  if (content.spreads.length === 0) errors.push("Book has no spreads");

  const spreadIds = new Set<string>();
  const pageIds = new Set<number>();
  let hasUncountedPage = false;
  for (const spread of content.spreads) {
    if (!spread.id) errors.push("Spread has no id");
    if (spreadIds.has(spread.id)) errors.push(`Duplicate spread id: ${spread.id}`);
    spreadIds.add(spread.id);
    for (const page of [spread.left, spread.right] as const) {
      pageErrors(spread, page, errors);
      if (pageIds.has(page.page)) errors.push(`Duplicate page reference: ${page.page}`);
      pageIds.add(page.page);
      if (page.people === null) hasUncountedPage = true;
    }
  }

  if (content.status !== "draft" && hasUncountedPage) {
    errors.push("Ready or published content cannot contain uncounted pages");
  }
  const playable = content.status !== "draft" && errors.length === 0;
  return { ok: errors.length === 0, playable, errors };
}

/** Convert fully annotated ready/published content to the book-agnostic game input. */
export function toPlayableBook(content: BookContent): Book {
  const validation = validateContentPack(content);
  if (!validation.playable) {
    throw new Error(
      `Book "${content.id}" is not playable: ${validation.errors.join("; ") || "draft content"}`,
    );
  }
  return {
    id: content.id,
    title: content.title,
    author: content.author || "Unknown author",
    coverImage: content.coverImage || "",
    ...(content.source?.url ? { source: content.source.url } : {}),
    spreads: content.spreads.map((spread) => ({
      id: spread.id,
      left: { ...spread.left, people: spread.left.people as number },
      right: { ...spread.right, people: spread.right.people as number },
      ...(spread.flags ? { flags: [...spread.flags] } : {}),
    })),
  };
}

/** The app supplies an environment-specific base; game-core never needs hosting knowledge. */
export function resolvePageAsset(
  content: BookContent,
  page: Pick<Page, "image">,
  runtimeAssetBaseUrl?: string,
): string {
  if (/^(?:https?:|file:|data:)/.test(page.image)) return page.image;
  const assetBaseUrl = runtimeAssetBaseUrl ?? content.assetBaseUrl;
  if (!assetBaseUrl) return page.image;
  return `${assetBaseUrl.replace(/\/+$/, "")}/${page.image.replace(/^\/+/, "")}`;
}

export interface BookCatalog {
  readonly books: readonly BookContent[];
  listBooks(): readonly BookContent[];
  listPlayableBooks(): readonly BookContent[];
  getBook(id: string): BookContent | undefined;
  getPlayableBook(id: string): Book | undefined;
}

export function createBookCatalog(books: readonly BookContent[]): BookCatalog {
  const ids = new Set<string>();
  for (const book of books) {
    if (ids.has(book.id)) throw new Error(`Duplicate book id: ${book.id}`);
    ids.add(book.id);
  }
  return {
    books: [...books],
    listBooks: () => [...books],
    listPlayableBooks: () => books.filter((book) => validateContentPack(book).playable),
    getBook: (id) => books.find((book) => book.id === id),
    getPlayableBook: (id) => {
      const book = books.find((candidate) => candidate.id === id);
      return book && validateContentPack(book).playable ? toPlayableBook(book) : undefined;
    },
  };
}
