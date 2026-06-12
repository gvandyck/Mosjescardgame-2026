import { appendEvent } from "../../engine/append-event.js";
import type { CardId } from "../../types/card-id.js";
import type { PlayerState } from "../../types/player-state.js";
import type { Primitive } from "../primitive.js";

export interface SendToBottomOfDeckParams {
  readonly playerId: string;
  readonly cardId: CardId;
}

function removeFromPiecieSlots(player: PlayerState, cardId: CardId): {
  readonly slots: PlayerState["piecieSlots"];
  readonly removed: boolean;
} {
  let removed = false;
  const slots = player.piecieSlots.map((slot) => {
    if (!removed && slot.cardId === cardId) {
      removed = true;
      return { ...slot, cardId: null, faceUp: false, turnsSincePlaced: 0 };
    }
    return slot;
  });
  return { slots, removed };
}

export const sendToBottomOfDeck: Primitive<SendToBottomOfDeckParams> = (state, params) => {
  if (typeof params?.playerId !== "string" || typeof params?.cardId !== "string") return state;

  const targetPlayerIndex = state.players.findIndex((player) => player.id === params.playerId);
  if (targetPlayerIndex < 0) return state;

  let movedFrom: "hand" | "discard" | "piecie_slots" | null = null;

  const playersWithoutCard = state.players.map((player) => {
    if (movedFrom === null && player.hand.includes(params.cardId)) {
      movedFrom = "hand";
      return { ...player, hand: player.hand.filter((cardId) => cardId !== params.cardId) };
    }

    if (movedFrom === null && player.discard.includes(params.cardId)) {
      movedFrom = "discard";
      return { ...player, discard: player.discard.filter((cardId) => cardId !== params.cardId) };
    }

    if (movedFrom === null) {
      const slotRemoval = removeFromPiecieSlots(player, params.cardId);
      if (slotRemoval.removed) {
        movedFrom = "piecie_slots";
        return { ...player, piecieSlots: slotRemoval.slots };
      }
    }

    return player;
  });

  if (movedFrom === null) return state;

  const playersWithDeckBottom = playersWithoutCard.map((player, index) =>
    index !== targetPlayerIndex ? player : { ...player, deck: [...player.deck, params.cardId] }
  );

  return appendEvent(
    { ...state, players: playersWithDeckBottom },
    {
      type: "card_sent_to_deck_bottom",
      playerId: params.playerId,
      cardId: params.cardId,
      source: movedFrom
    }
  );
};
