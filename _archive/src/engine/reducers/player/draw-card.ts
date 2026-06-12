import { appendEvent } from "../../append-event.js";
import type { GameState } from "../../../types/game-state.js";
import type { DrawCardAction } from "../../../types/player-reducer-actions.js";

export function drawCard(state: GameState, action: DrawCardAction): GameState {
  const playerIndex = state.players.findIndex((player) => player.id === action.playerId);
  if (playerIndex < 0) return state;

  const player = state.players[playerIndex];
  const [topCard, ...remainingDeck] = player.deck;
  if (!topCard) return state;

  const updatedPlayer = {
    ...player,
    deck: remainingDeck,
    hand: [...player.hand, topCard]
  };

  const updatedPlayers = state.players.map((item, index) => (index === playerIndex ? updatedPlayer : item));

  const nextState = {
    ...state,
    players: updatedPlayers
  };

  return appendEvent(nextState, {
    type: "card_drawn",
    playerId: player.id,
    cardId: topCard
  });
}
