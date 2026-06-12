import { appendEvent } from "../../engine/append-event.js";
import { discardCard } from "../../engine/reducers/player/discard-card.js";
import type { Primitive } from "../primitive.js";
import type { DiscardCardsParams } from "./types.js";

export const discardCards: Primitive<DiscardCardsParams> = (state, params, context) => {
  const player = state.players.find((candidate) => candidate.id === params.playerId);
  if (player === undefined) return state;

  let nextState = state;

  if (params.mode === "choose") {
    if (params.chosenCardIds === undefined || params.chosenCardIds.length < params.count) {
      return appendEvent(state, {
        type: "warning",
        code: "discard_choose_missing_selection",
        message: "discard-cards choose mode requires chosenCardIds"
      });
    }

    for (let i = 0; i < params.count; i += 1) {
      nextState = discardCard(nextState, {
        playerId: params.playerId,
        cardId: params.chosenCardIds[i] as never
      });
    }

    return nextState;
  }

  for (let i = 0; i < params.count; i += 1) {
    const refreshedPlayer = nextState.players.find((candidate) => candidate.id === params.playerId);
    if (refreshedPlayer === undefined || refreshedPlayer.hand.length === 0) break;

    const randomIndex = context.rng.nextInt(0, refreshedPlayer.hand.length - 1);
    const randomCardId = refreshedPlayer.hand[randomIndex];
    nextState = discardCard(nextState, { playerId: params.playerId, cardId: randomCardId });
  }

  return nextState;
};
