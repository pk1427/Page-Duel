import type { Book, Spread } from "./types";

/**
 * Eligible spreads (GDD 4.3):
 * - not flagged "excluded"
 * - not both pages at zero people (a dead round)
 * A spread with exactly one zero-people page is allowed.
 */
export function isEligible(spread: Spread): boolean {
  if (spread.flags?.includes("excluded")) return false;
  if (spread.left.people === 0 && spread.right.people === 0) return false;
  return true;
}

export function eligibleSpreads(book: Book): Spread[] {
  return book.spreads.filter(isEligible);
}

export interface BookValidation {
  ok: boolean;
  errors: string[];
}

/** Sanity-check book data before it reaches a game. */
export function validateBook(book: Book): BookValidation {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const s of book.spreads) {
    if (seen.has(s.id)) errors.push(`Duplicate spread id: ${s.id}`);
    seen.add(s.id);
    for (const side of [s.left, s.right] as const) {
      if (!Number.isInteger(side.people) || side.people < 0) {
        errors.push(`Spread ${s.id} page ${side.page}: people must be an integer >= 0`);
      }
      if (!side.image) errors.push(`Spread ${s.id} page ${side.page}: missing image`);
    }
  }
  return { ok: errors.length === 0, errors };
}
