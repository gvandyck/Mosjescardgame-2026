import { appendEvent } from "../../engine/append-event.js";
import { getCard } from "../../cards/registry/card-registry.js";
import type { Primitive } from "../primitive.js";
import type { SearchDeckAndDrawParams } from "./types.js";

export const searchDeckAndDraw: Primitive<SearchDeckAndDrawParams> = (state, params, context) => {
  const playerIndex = state.players.findIndex((player) => player.id === params.playerId);
  if (playerIndex < 0) return state;

  if (
    (params.filter.byType !== undefined || params.filter.byCost !== undefined) &&
    params.filter.byName === undefined &&
    params.filter.category === undefined &&
    params.filter.subcategory === undefined
  ) {
    return appendEvent(state, {
      type: "warning",
      code: "search_filter_metadata_unavailable",
      message: "byType/byCost search requires card catalog metadata not present in GameState"
    });
  }

  const player = state.players[playerIndex];
  const matchIndex = player.deck.findIndex((cardId) => {
    if (params.filter.byName !== undefined) {
      return cardId === params.filter.byName;
    }

    if (params.filter.category === undefined && params.filter.subcategory === undefined) {
      return false;
    }

    try {
      const card = getCard(cardId);
      if (params.filter.category !== undefined && card.category !== params.filter.category) return false;
      if (params.filter.subcategory !== undefined && card.subcategory !== params.filter.subcategory) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  });
  if (matchIndex < 0) return state;

  const extractedCard = player.deck[matchIndex];
  const remainingDeck = player.deck.filter((_, index) => index !== matchIndex);
  const shuffledDeck = [...remainingDeck];
  for (let i = shuffledDeck.length - 1; i > 0; i -= 1) {
    const swapIndex = context.rng.nextInt(0, i);
    const tmp = shuffledDeck[i];
    shuffledDeck[i] = shuffledDeck[swapIndex];
    shuffledDeck[swapIndex] = tmp;
  }

  const updatedPlayers = state.players.map((candidate, index) => {
    if (index !== playerIndex) return candidate;
    return {
      ...candidate,
      hand: [...candidate.hand, extractedCard],
      deck: shuffledDeck
    };
  });

  return { ...state, players: updatedPlayers };
};
