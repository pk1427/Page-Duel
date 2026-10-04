import { resolvePageAsset, type BookContent } from "@book-people/book-data";

const aliceLocalDevelopmentBaseUrl = "http://localhost:8000";

/**
 * Runtime delivery configuration, intentionally separate from canonical content paths.
 * Development defaults to the local review server. Native/release builds must set
 * EXPO_PUBLIC_ALICE_ASSET_BASE_URL to their deployed content host.
 */
function assetBaseUrlFor(book: BookContent): string | undefined {
  if (book.id !== "alice-loc-1885") return undefined;
  return process.env.EXPO_PUBLIC_ALICE_ASSET_BASE_URL ?? aliceLocalDevelopmentBaseUrl;
}

export function resolveContentAsset(
  book: BookContent,
  asset: Parameters<typeof resolvePageAsset>[1],
): string {
  return resolvePageAsset(book, asset, assetBaseUrlFor(book));
}
