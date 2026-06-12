import { appendEvent } from "../../append-event.js";
import type { GameState } from "../../../types/game-state.js";
import type { DiscardCardAction } from "../../../types/player-reducer-actions.js";

export function discardCard(state: GameState, action: DiscardCardAction): GameState {
  const playerIndex = state.players.findIndex((player) => player.id === action.playerId);
  if (playerIndex < 0) return state;

  const player = state.players[playerIndex];
  const handIndex = player.hand.findIndex((cardId) => cardId === action.cardId);
  if (handIndex < 0) return state;

  const updatedHand = player.hand.filter((_, index) => index !== handIndex);
  const updatedPlayer = {
    ...player,
    hand: updatedHand,
    discard: [...player.discard, action.cardId]
  };

  const updatedPlayers = state.players.map((item, index) => (index === playerIndex ? updatedPlayer : item));
  const nextState = { ...state, players: updatedPlayers };

  return appendEvent(nextState, {
    type: "card_discarded",
    playerId: player.id,
    cardId: action.cardId
  });
}
