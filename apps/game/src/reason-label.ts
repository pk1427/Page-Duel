import { reasonLabel as coreReasonLabel, type WinReason } from "@book-people/game-core";
import { copy } from "./copy";

export function reasonLabel(reason: WinReason): string {
  const labels: Record<WinReason, string> = {
    roundWins: copy.result.reasonRoundWins,
    peopleTotal: copy.result.reasonPeopleTotal,
    suddenDeath: copy.result.reasonSuddenDeath,
    draw: copy.result.reasonDraw,
  };
  return labels[reason];
}
