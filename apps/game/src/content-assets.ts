import { resolvePageAsset, type BookContent } from "@book-people/book-data";

const localDevelopmentAssetBaseUrl = "http://localhost:8000";

/**
 * Runtime delivery configuration, intentionally separate from canonical content paths.
 * Development defaults to the local review server. Release builds set a generic
 * base or an optional per-book override; canonical book JSON never carries hosts.
 */
function assetBaseUrlFor(book: BookContent): string | undefined {
  const perBookKey = `EXPO_PUBLIC_BOOK_ASSET_BASE_URL_${book.id
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")}`;
  const environment = process.env as Record<string, string | undefined>;
  return (
    environment[perBookKey] ??
    environment.EXPO_PUBLIC_BOOK_ASSET_BASE_URL ??
    localDevelopmentAssetBaseUrl
  );
}

export function resolveContentAsset(
  book: BookContent,
  asset: Parameters<typeof resolvePageAsset>[1],
): string {
  return resolvePageAsset(book, asset, assetBaseUrlFor(book));
}
