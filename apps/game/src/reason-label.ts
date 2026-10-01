import type { WinReason } from "@book-people/game-core";

export function reasonLabel(reason: WinReason): string {
  const labels: Record<WinReason, string> = {
    roundWins: "round wins",
    peopleTotal: "most people",
    suddenDeath: "sudden death",
    draw: "a draw",
  };
  return labels[reason];
}
