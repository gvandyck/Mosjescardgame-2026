import { appendEvent } from "../../append-event.js";
import type { GameState } from "../../../types/game-state.js";
import type { ActivatePiecieAction } from "../../../types/player-reducer-actions.js";

export function activatePiecie(state: GameState, action: ActivatePiecieAction): GameState {
  const playerIndex = state.players.findIndex((player) => player.id === action.playerId);
  if (playerIndex < 0) return state;

  const player = state.players[playerIndex];
  const slot = player.piecieSlots[action.slotIndex];
  if (!slot || slot.cardId === null || slot.faceUp) return state;

  if (slot.turnsSincePlaced < 1 && !action.isSnelle) return state;

  const updatedSlots = player.piecieSlots.map((item) => {
    if (item.slotIndex !== action.slotIndex) return item;
    return { ...item, faceUp: true };
  });

  const updatedPlayer = { ...player, piecieSlots: updatedSlots };
  const updatedPlayers = state.players.map((item, index) => (index === playerIndex ? updatedPlayer : item));
  const nextState = { ...state, players: updatedPlayers };

  return appendEvent(nextState, {
    type: "piecie_activated",
    playerId: player.id,
    slotIndex: action.slotIndex,
    cardId: slot.cardId
  });
}
