import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";
import type { DestroyPiecieParams } from "./types.js";

export const destroyPiecie: Primitive<DestroyPiecieParams> = (state, params) => {
  const ownerIndex = state.players.findIndex((player) => player.id === params.target.playerId);
  if (ownerIndex < 0) return state;

  const owner = state.players[ownerIndex];
  const slot = owner.piecieSlots[params.target.slotIndex];
  if (slot === undefined || slot.cardId === null) return state;

  const cardId = slot.cardId;
  const updatedSlots = owner.piecieSlots.map((candidate, index) => {
    if (index !== params.target.slotIndex) return candidate;
    return {
      ...candidate,
      cardId: null,
      faceUp: false,
      turnsSincePlaced: 0
    };
  });

  const updatedPlayers = state.players.map((candidate, index) => {
    if (index !== ownerIndex) return candidate;
    return {
      ...candidate,
      piecieSlots: updatedSlots,
      discard: [...candidate.discard, cardId]
    };
  });

  const withDestroy = {
    ...state,
    players: updatedPlayers
  };

  return appendEvent(withDestroy, {
    type: "piecie_destroyed",
    target: params.target,
    cardId
  });
};
