import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";

export interface DiscardSourceCardParams {
  readonly pendingEffectId: string;
}

export const discardSourceCard: Primitive<DiscardSourceCardParams> = (state, params, context) => {
  if (typeof params?.pendingEffectId !== "string") return state;

  const fromStack = state.effectStack.find((effect) => effect.id === params.pendingEffectId);
  const pending = fromStack ??
    (context.respondingToPendingEffect?.id === params.pendingEffectId
      ? context.respondingToPendingEffect
      : undefined);

  const sourceCardId = pending?.source.cardId;
  const sourcePlayerId = pending?.source.playerId;

  if (sourceCardId === undefined || sourcePlayerId === undefined) return state;

  const playerIndex = state.players.findIndex((player) => player.id === sourcePlayerId);
  if (playerIndex < 0) return state;

  const player = state.players[playerIndex];
  if (!player.hand.includes(sourceCardId)) return state;

  const updatedPlayers = state.players.map((candidate, index) =>
    index !== playerIndex
      ? candidate
      : {
          ...candidate,
          hand: candidate.hand.filter((cardId) => cardId !== sourceCardId),
          discard: [...candidate.discard, sourceCardId]
        }
  );

  return appendEvent(
    { ...state, players: updatedPlayers },
    {
      type: "card_discarded",
      playerId: sourcePlayerId,
      cardId: sourceCardId
    }
  );
};
