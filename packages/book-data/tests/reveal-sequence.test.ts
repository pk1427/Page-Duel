import { afterEach, describe, expect, it, vi } from "vitest";
import { flipSpread, scoreRound, startGame } from "@book-people/game-core";
import { placeholderBook } from "../src";
import {
  LEFT_REVEAL_MS,
  RIGHT_REVEAL_MS,
  scheduleReveal,
  SCORE_MS,
} from "../../../apps/game/src/useRevealSequence";

afterEach(() => vi.useRealTimers());
describe("scheduleReveal", () => {
  it("reaches each stage on schedule and scores once", () => {
    vi.useFakeTimers();
    const state = flipSpread(
      startGame({ players: ["A", "B"], book: placeholderBook, rounds: 5, seed: 1 }),
    );
    const left = vi.fn(),
      right = vi.fn(),
      scored = vi.fn(),
      score = vi.fn(scoreRound);
    scheduleReveal(state, score, { left, right, scored });
    vi.advanceTimersByTime(LEFT_REVEAL_MS - 1);
    expect(left).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(left).toHaveBeenCalledOnce();
    expect(right).not.toHaveBeenCalled();
    vi.advanceTimersByTime(RIGHT_REVEAL_MS);
    expect(right).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(SCORE_MS);
    expect(score).toHaveBeenCalledOnce();
    expect(scored).toHaveBeenCalledOnce();
  });
  it("cleanup prevents stale callbacks", () => {
    vi.useFakeTimers();
    const state = flipSpread(
      startGame({ players: ["A", "B"], book: placeholderBook, rounds: 5, seed: 2 }),
    );
    const left = vi.fn(),
      right = vi.fn(),
      scored = vi.fn();
    const stop = scheduleReveal(state, scoreRound, { left, right, scored });
    stop();
    vi.runAllTimers();
    expect(left).not.toHaveBeenCalled();
    expect(right).not.toHaveBeenCalled();
    expect(scored).not.toHaveBeenCalled();
  });
});
