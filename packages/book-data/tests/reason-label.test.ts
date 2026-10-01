import { describe, expect, it } from "vitest";
import { reasonLabel } from "../../../apps/game/src/reason-label";

describe("reasonLabel", () => {
  it("maps every game result reason to player-facing text", () => {
    expect(reasonLabel("roundWins")).toBe("round wins");
    expect(reasonLabel("peopleTotal")).toBe("people total");
    expect(reasonLabel("suddenDeath")).toBe("sudden death");
    expect(reasonLabel("draw")).toBe("Game ended in a draw");
  });
});
