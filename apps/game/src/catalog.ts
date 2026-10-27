import { getSupabase, isSupabaseConfigured } from "./supabase";
import { bookCatalog, type BookContent, validateContentPack } from "@book-people/book-data";

export interface CatalogBook {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly author: string | null;
  readonly description: string | null;
  readonly coverAssetPath: string | null;
  readonly status: "draft" | "ready" | "published";
  readonly versionId: string;
  readonly versionLabel: string;
  readonly manifestSha256: string | null;
  readonly content: BookContent | null;
}

export interface CatalogState {
  readonly loaded: boolean;
  readonly loading: boolean;
  readonly error: string | null;
  readonly books: readonly CatalogBook[];
}

const fallbackBookMap: Record<string, { id: string; versionId: string; versionLabel: string }> = {
  "placeholder-book": {
    id: "placeholder-book",
    versionId: "placeholder-book:v1",
    versionLabel: "1",
  },
  "alice-loc-1885": { id: "alice-loc-1885", versionId: "alice-loc-1885:v1", versionLabel: "1" },
  "tales-of-punjab-1894": {
    id: "tales-of-punjab-1894",
    versionId: "tales-of-punjab-1894:v1",
    versionLabel: "1",
  },
};

function mapDbRowToCatalogBook(row: Record<string, unknown>): CatalogBook {
  const contentJson =
    typeof (row as Record<string, unknown>).content_json === "string"
      ? JSON.parse((row as Record<string, unknown>).content_json as string)
      : (row as Record<string, unknown>).content_json;

  const baseContent = {
    id: (row as Record<string, unknown>).book_id ?? (row as Record<string, unknown>).id,
    title: (row as Record<string, unknown>).title,
    author: (row as Record<string, unknown>).author,
    description: (row as Record<string, unknown>).description,
    coverImage: (row as Record<string, unknown>).cover_asset_path,
    version: (row as Record<string, unknown>).version_label,
    status: "ready" as const,
    spreads: [],
  };

  const content: BookContent | null = contentJson
    ? ({
        ...baseContent,
        ...(contentJson as object),
        source: (contentJson as Record<string, unknown>)?.source,
      } as BookContent)
    : null;

  if (content) {
    const validation = validateContentPack(content);
    if (!validation.ok) {
      console.warn(
        `Catalog: book "${content.id}" has content validation errors:`,
        validation.errors,
      );
    }
  }

  return {
    id: (row as Record<string, unknown>).slug as string,
    slug: (row as Record<string, unknown>).slug as string,
    title: (row as Record<string, unknown>).title as string,
    author: (row as Record<string, unknown>).author as string | null,
    description: (row as Record<string, unknown>).description as string | null,
    coverAssetPath: (row as Record<string, unknown>).cover_asset_path as string | null,
    status: (row as Record<string, unknown>).status as "draft" | "ready" | "published",
    versionId: ((row as Record<string, unknown>).book_version_id ??
      (row as Record<string, unknown>).id) as string,
    versionLabel: (row as Record<string, unknown>).version_label as string,
    manifestSha256: (row as Record<string, unknown>).manifest_sha256 as string | null,
    content,
  };
}

function fallbackCatalogBooks(): readonly CatalogBook[] {
  return bookCatalog.listPlayableBooks().map((book) => {
    const meta = fallbackBookMap[book.id] ?? {
      id: book.id,
      versionId: `${book.id}:v1`,
      versionLabel: book.version,
    };
    return {
      id: meta.id,
      slug: book.id,
      title: book.title,
      author: book.author ?? null,
      description: book.description ?? null,
      coverAssetPath: book.coverImage ?? null,
      status: "ready",
      versionId: meta.versionId,
      versionLabel: meta.versionLabel,
      manifestSha256: null,
      content: book,
    };
  });
}

export async function fetchCatalog(): Promise<readonly CatalogBook[]> {
  const client = getSupabase();
  if (!client) {
    return fallbackCatalogBooks();
  }

  const { data, error } = await client
    .from("books")
    .select(
      `slug, title, author, description, cover_asset_path, status,
       book_versions!inner (id, version_label, manifest_sha256, content_json, publication_status)`,
    )
    .eq("book_versions.publication_status", "published")
    .eq("status", "published");

  if (error) {
    console.error("Catalog fetch error:", error.message);
    throw new Error(`Failed to load book catalog: ${error.message}`);
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const versions = (row as Record<string, unknown>).book_versions as
      Record<string, unknown>[] | undefined;
    const version = versions && versions.length > 0 ? versions[0] : {};
    return mapDbRowToCatalogBook({
      ...version,
      slug: row.slug,
      title: row.title,
      author: row.author,
      description: row.description,
      cover_asset_path: row.cover_asset_path,
      status: row.status,
    });
  });
}

export async function fetchCatalogBook(slugOrId: string): Promise<CatalogBook | undefined> {
  const client = getSupabase();
  if (!client) {
    return fallbackCatalogBooks().find((b) => b.id === slugOrId || b.slug === slugOrId);
  }

  const { data, error } = await client
    .from("books")
    .select(
      `slug, title, author, description, cover_asset_path, status,
       book_versions!inner (id, version_label, manifest_sha256, content_json, publication_status)`,
    )
    .eq("book_versions.publication_status", "published")
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .single();

  if (error) {
    console.error("Catalog fetch error:", error.message);
    throw new Error(`Failed to load book: ${error.message}`);
  }

  if (!data) return undefined;

  const versions = (data as Record<string, unknown>).book_versions as
    Record<string, unknown>[] | undefined;
  const version = versions && versions.length > 0 ? versions[0] : {};
  return mapDbRowToCatalogBook({
    ...version,
    slug: (data as Record<string, unknown>).slug,
    title: (data as Record<string, unknown>).title,
    author: (data as Record<string, unknown>).author,
    description: (data as Record<string, unknown>).description,
    cover_asset_path: (data as Record<string, unknown>).cover_asset_path,
    status: (data as Record<string, unknown>).status,
  });
}

export function getPlayableBookContent(catalogBook: CatalogBook): BookContent | undefined {
  if (catalogBook.content) {
    const validation = validateContentPack(catalogBook.content);
    if (validation.playable) {
      return catalogBook.content;
    }
  }

  if (!isSupabaseConfigured) {
    const localBook = bookCatalog.getBook(catalogBook.id);
    if (localBook) return localBook;
    return bookCatalog.listPlayableBooks().find((b) => b.id === catalogBook.id);
  }

  return undefined;
}
