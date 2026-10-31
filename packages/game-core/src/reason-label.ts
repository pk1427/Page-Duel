import type { WinReason } from "./types";

const reasonLabels: Record<WinReason, string> = {
  roundWins: "round wins",
  peopleTotal: "people total",
  suddenDeath: "sudden death",
  draw: "Game ended in a draw",
};

export function reasonLabel(reason: WinReason): string {
  return reasonLabels[reason];
}