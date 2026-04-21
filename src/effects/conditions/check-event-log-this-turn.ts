import { eventsSince } from "../../engine/events-since.js";
import type { EffectContext } from "../effect-context.js";
import type { QueryPrimitive } from "../primitive.js";
import type { GameState } from "../../types/game-state.js";

export interface CheckEventLogThisTurnParams {
  readonly eventType: string;
  readonly cardIdFilter?: ReadonlyArray<string>;
}

export const checkEventLogThisTurn: QueryPrimitive<CheckEventLogThisTurnParams, boolean> = (
  state: GameState,
  params,
  _context: EffectContext
) => {
  const currentTurnEvents = eventsSince(state, state.currentTurnStartCount ?? state.turnCount);
  return currentTurnEvents.some((event) => {
    if (event.type !== params.eventType) return false;
    if (params.cardIdFilter === undefined) return true;
    if (!("cardId" in event)) return false;
    const cardId = String(event.cardId);
    return params.cardIdFilter.includes(cardId);
  });
};
