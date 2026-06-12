import type { CardId } from "../types/card-id.js";
import type { GameState } from "../types/game-state.js";

export function injectCardIntoHand(
  state: GameState,
  playerId: string,
  cardId: CardId
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error(`Player ${playerId} not found`);
  }

  const deckIndex = player.deck.indexOf(cardId);
  const newDeck =
    deckIndex >= 0
      ? [
          cardId,
          ...player.deck.slice(0, deckIndex),
          ...player.deck.slice(deckIndex + 1),
        ]
      : [cardId, ...player.deck];

  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, deck: newDeck } : p
    ),
  };
}

export function getActiveMosjeMP(state: GameState, playerId: string): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return 0;
  const activeMosje = player.mosjes[player.activeMosjeIndex];
  return activeMosje?.mp ?? 0;
}
