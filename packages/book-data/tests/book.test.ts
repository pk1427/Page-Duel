import { describe, expect, it } from "vitest";
import { eligibleSpreads, startGame, validateBook } from "@book-people/game-core";
import { placeholderBook } from "../src";
describe("placeholderBook", () => { it("is deterministic, valid, varied and playable", () => { expect(validateBook(placeholderBook).ok).toBe(true); const eligible=eligibleSpreads(placeholderBook); expect(eligible.length).toBeGreaterThanOrEqual(30); expect(eligible.filter(s=>s.left.people===s.right.people).length/eligible.length).toBeLessThan(.35); for(const rounds of [5,10,15] as const) expect(()=>startGame({players:["A","B"],book:placeholderBook,rounds,seed:1})).not.toThrow(); }); });
