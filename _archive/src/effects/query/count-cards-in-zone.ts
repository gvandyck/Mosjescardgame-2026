import { getCard } from "../../cards/registry/card-registry.js";
import type { CardCategory } from "../../cards/schema/card-definition-types.js";
import type { CardId } from "../../types/card-id.js";
import type { QueryPrimitive } from "../primitive.js";

export interface CountParams {
  readonly playerId: string;
  readonly zone: "hand" | "deck" | "discard" | "piecie_slots";
  readonly filter?: {
    readonly category?: CardCategory;
    readonly subcategory?: string;
  };
}

function matchesFilter(cardId: CardId, filter: CountParams["filter"]): boolean {
  if (filter === undefined) return true;

  try {
    const card = getCard(cardId);
    if (filter.category !== undefined && card.category !== filter.category) return false;
    if (filter.subcategory !== undefined && card.subcategory !== filter.subcategory) return false;
    return true;
  } catch {
    // Unknown card metadata cannot match a category/subcategory filter.
    return false;
  }
}

export const countCardsInZone: QueryPrimitive<CountParams, number> = (state, params) => {
  const player = state.players.find((candidate) => candidate.id === params.playerId);
  if (player === undefined) return 0;

  if (params.zone === "piecie_slots") {
    return player.piecieSlots.filter((slot) => slot.faceUp && slot.cardId !== null).length;
  }

  const cards =
    params.zone === "hand" ? player.hand : params.zone === "deck" ? player.deck : player.discard;

  if (params.filter === undefined) return cards.length;
  return cards.filter((card) => matchesFilter(card, params.filter)).length;
};
