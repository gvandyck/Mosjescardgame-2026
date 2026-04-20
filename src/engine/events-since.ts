import type { GameEvent } from "../types/events.js";
import type { GameState } from "../types/game-state.js";

export function eventsSince(state: GameState, turnCount: number): ReadonlyArray<GameEvent> {
  let activeTurn = 0;
  const out: GameEvent[] = [];

  for (const event of state.eventLog) {
    if (event.type === "turn_started") {
      activeTurn = event.turn;
    }

    if (activeTurn >= turnCount) {
      out.push(event);
    }
  }

  return out;
}
