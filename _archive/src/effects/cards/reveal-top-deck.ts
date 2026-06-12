import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";
import type { RevealTopDeckParams } from "./types.js";

export const revealTopDeck: Primitive<RevealTopDeckParams> = (state, params) => {
  const owner = state.players.find((player) => player.id === params.targetDeckOwner);
  if (owner === undefined) return state;

  const cards = owner.deck.slice(0, params.count);
  return appendEvent(state, {
    type: "cards_revealed_private",
    viewerId: params.playerId,
    ownerId: params.targetDeckOwner,
    cards
  });
};
