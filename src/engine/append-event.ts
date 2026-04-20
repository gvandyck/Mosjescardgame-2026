import type { GameEvent } from "../types/events.js";
import type { GameState } from "../types/game-state.js";

export function appendEvent(state: GameState, event: GameEvent): GameState {
  return {
    ...state,
    eventLog: [...state.eventLog, event]
  };
}
