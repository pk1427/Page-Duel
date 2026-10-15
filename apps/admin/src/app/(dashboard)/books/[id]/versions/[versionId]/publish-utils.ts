import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";

export interface BookManifest {
  id: string;
  title: string;
  author?: string;
  description?: string;
  coverImage?: string;
  version: string;
  status: "draft" | "ready" | "published";
  spreads: Array<{
    id: string;
    left: {
      page: number;
      image: string;
      people: number | null;
    };
    right: {
      page: number;
      image: string;
      people: number | null;
    };
    flags?: string[];
    notes?: string;
  }>;
}

const ALLOWED_IMAGE_EXTS = [".webp", ".jpg", ".jpeg", ".png"];

export function isRelativeAssetPath(value: string): boolean {
  if (!value || value.length === 0) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false; // URL scheme
  if (value.startsWith("/") || value.startsWith("\\")) return false;
  if (value.includes("\\")) return false;
  if (value.includes("://")) return false;
  if (value.split("/").includes("..")) return false;
  return true;
}

export function validateBookJson(book: BookManifest, bookSlug: string): string[] {
  const errors: string[] = [];

  if (!book.id) errors.push("missing book id");
  if (!book.title) errors.push("missing title");
  if (!book.version) errors.push("missing version");
  if (!["draft", "ready", "published"].includes(book.status)) {
    errors.push(`unexpected status: ${book.status} (expected 'draft', 'ready', or 'published')`);
  }

  const spreads = book.spreads;
  if (!Array.isArray(spreads) || spreads.length === 0) {
    errors.push("book has no spreads");
    return errors;
  }

  const seenIds = new Set<string>();
  const seenPages = new Set<number>();

  for (const spread of spreads) {
    const sid = spread.id;
    if (!sid) {
      errors.push("spread without id");
      continue;
    }
    if (seenIds.has(sid)) {
      errors.push(`duplicate spread id: ${sid}`);
    }
    seenIds.add(sid);

    const excluded = spread.flags?.includes("excluded");

    for (const sideName of ["left", "right"] as const) {
      const side = spread[sideName];
      const page = side.page;
      if (!Number.isInteger(page) || page < 0) {
        errors.push(`${sid} ${sideName}: page must be a non-negative integer`);
      } else if (seenPages.has(page)) {
        errors.push(`duplicate page reference: ${page}`);
      } else {
        seenPages.add(page);
      }

      const image = side.image;
      if (!image) {
        if (!excluded) {
          errors.push(`${sid} ${sideName}: missing image reference`);
        }
        continue;
      }

      if (image.startsWith("placeholder:")) continue;

      if (!isRelativeAssetPath(image)) {
        errors.push(`${sid} ${sideName}: image must be a relative path: ${image}`);
        continue;
      }

      const ext = image.toLowerCase().split(".").pop();
      if (ext && !ALLOWED_IMAGE_EXTS.includes("." + ext)) {
        errors.push(`${sid} ${sideName}: unexpected image format: .${ext}`);
      }

      const people = side.people;
      if (people === null && !excluded) {
        errors.push(`${sid} ${sideName}: uncounted people (null) on non-excluded spread`);
      } else if (people !== null && (!Number.isInteger(people) || people < 0)) {
        errors.push(`${sid} ${sideName}: people must be a non-negative integer or null`);
      }
    }
  }

  const cover = book.coverImage;
  if (cover && !cover.startsWith("placeholder:")) {
    if (!isRelativeAssetPath(cover)) {
      errors.push(`cover image must be a relative path: ${cover}`);
    }
  }

  return errors;
}

export function collectAssetPaths(book: BookManifest): string[] {
  const paths: string[] = [];
  const cover = book.coverImage;
  if (cover && !cover.startsWith("placeholder:") && isRelativeAssetPath(cover)) {
    paths.push(cover);
  }

  for (const spread of book.spreads || []) {
    for (const side of [spread.left, spread.right]) {
      const image = side.image;
      if (image && !image.startsWith("placeholder:") && isRelativeAssetPath(image)) {
        paths.push(image);
      }
    }
  }

  const seen = new Set<string>();
  return paths.filter(p => !seen.has(p) && seen.add(p));
}

export async function calculateManifestSha256(manifest: BookManifest): Promise<string> {
  const json = JSON.stringify(manifest, null, 2);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hash = sha256(data);
  return bytesToHex(hash);
}

export async function uploadFile(
  supabaseUrl: string,
  supabaseKey: string,
  bucket: string,
  objectPath: string,
  file: File | Blob
): Promise<{ success: boolean; error?: string }> {
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: file,
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}