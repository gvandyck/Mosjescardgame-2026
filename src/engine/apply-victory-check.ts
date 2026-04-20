import { appendEvent } from "./append-event.js";
import { checkVictory } from "./check-victory.js";
import type { GameState } from "../types/game-state.js";

export function applyVictoryCheck(state: GameState): GameState {
  const existingWinEvent = state.eventLog.some((event) => event.type === "game_won");
  if (existingWinEvent) return state;

  const result = checkVictory(state);
  if (!result.winnerId || !result.reason) {
    return state;
  }

  return appendEvent(state, {
    type: "game_won",
    playerId: result.winnerId,
    reason: result.reason
  });
}
