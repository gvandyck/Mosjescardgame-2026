import type { GameEvent } from "../types/events.js";
import type { GameState } from "../types/game-state.js";
import { resolveActivePlaceTriggers } from "./place-manager.js";

export function appendEvent(state: GameState, event: GameEvent): GameState {
  const appended = {
    ...state,
    eventLog: [...state.eventLog, event]
  };

  return resolveActivePlaceTriggers(appended, event);
}
