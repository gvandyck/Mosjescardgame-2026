import { eventsSince } from "../../engine/events-since.js";
import type { EffectContext } from "../effect-context.js";
import type { QueryPrimitive } from "../primitive.js";
import type { GameState } from "../../types/game-state.js";

export interface CheckEventLogThisTurnParams {
  readonly eventType: string;
  readonly cardIdFilter?: ReadonlyArray<string>;
  readonly minAmount?: number;
  readonly playerId?: string;
  readonly targetSelf?: boolean;
}

export const checkEventLogThisTurn: QueryPrimitive<CheckEventLogThisTurnParams, boolean> = (
  state: GameState,
  params,
  context: EffectContext
) => {
  const currentTurnEvents = eventsSince(state, state.currentTurnStartCount ?? state.turnCount).filter((event) => {
    if (event.type !== params.eventType) return false;
    if (params.cardIdFilter !== undefined) {
      if (!("cardId" in event)) return false;
      if (!params.cardIdFilter.includes(String(event.cardId))) return false;
    }
    if (params.playerId !== undefined) {
      if (!("playerId" in event) || event.playerId !== params.playerId) return false;
    }
    if (params.targetSelf === true) {
      if (!("target" in event)) return false;
      const target = event.target as { readonly playerId?: string };
      if (target.playerId !== context.actingPlayerId) return false;
    }
    return true;
  });

  if (params.minAmount !== undefined) {
    const totalAmount = currentTurnEvents.reduce((sum, event) => {
      if (!("amount" in event) || typeof event.amount !== "number") return sum;
      return sum + event.amount;
    }, 0);
    return totalAmount >= params.minAmount;
  }

  return currentTurnEvents.length > 0;
}
