import { appendEvent } from "../../engine/append-event.js";
import type { CardId } from "../../types/card-id.js";
import type { Primitive } from "../primitive.js";
import type { ReturnToHandParams } from "./types.js";

export const returnToHand: Primitive<ReturnToHandParams> = (state, params) => {
  const playerIndex = state.players.findIndex((player) => player.id === params.playerId);
  if (playerIndex < 0) return state;

  const player = state.players[playerIndex];
  const sourceZone = params.zone === "discard" ? player.discard : player.welloePile;
  const sourceIndex = sourceZone.findIndex((cardId) => cardId === params.cardId);
  if (sourceIndex < 0) {
    return appendEvent(state, {
      type: "warning",
      code: "return_to_hand_card_missing",
      message: "return-to-hand target card not found in requested zone"
    });
  }

  const nextZone = sourceZone.filter((_, index) => index !== sourceIndex);
  const updatedPlayer = {
    ...player,
    hand: [...player.hand, params.cardId as CardId],
    discard: params.zone === "discard" ? nextZone : player.discard,
    welloePile: params.zone === "welloe" ? nextZone : player.welloePile
  };

  const updatedPlayers = state.players.map((candidate, index) => {
    if (index !== playerIndex) return candidate;
    return updatedPlayer;
  });

  return { ...state, players: updatedPlayers };
};
