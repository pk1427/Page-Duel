import type { WinReason } from "@book-people/game-core";

export function reasonLabel(reason: WinReason): string {
  const labels: Record<WinReason, string> = {
    roundWins: "round wins",
    peopleTotal: "people total",
    suddenDeath: "sudden death",
    draw: "Game ended in a draw",
  };
  return labels[reason];
}
