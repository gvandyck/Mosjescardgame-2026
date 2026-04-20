import { appendEvent } from "../../append-event.js";
import type { GameState } from "../../../types/game-state.js";
import type { PlayPiecieFaceDownAction } from "../../../types/player-reducer-actions.js";

export function playPiecieFaceDown(state: GameState, action: PlayPiecieFaceDownAction): GameState {
  const playerIndex = state.players.findIndex((player) => player.id === action.playerId);
  if (playerIndex < 0) return state;

  const player = state.players[playerIndex];
  const handIndex = player.hand.findIndex((cardId) => cardId === action.cardId);
  if (handIndex < 0) return state;

  const allSlotsOccupied = player.piecieSlots.every((slot) => slot.cardId !== null);
  if (allSlotsOccupied) return state;

  const targetSlot = player.piecieSlots[action.slotIndex];
  if (!targetSlot || targetSlot.cardId !== null) return state;

  const updatedSlots = player.piecieSlots.map((slot) => {
    if (slot.slotIndex !== action.slotIndex) return slot;
    return {
      ...slot,
      cardId: action.cardId,
      faceUp: false,
      turnsSincePlaced: 0
    };
  });

  const updatedHand = player.hand.filter((_, index) => index !== handIndex);
  const updatedPlayer = {
    ...player,
    hand: updatedHand,
    piecieSlots: updatedSlots
  };

  const updatedPlayers = state.players.map((item, index) => (index === playerIndex ? updatedPlayer : item));
  const nextState = { ...state, players: updatedPlayers };

  return appendEvent(nextState, {
    type: "piecie_placed",
    playerId: player.id,
    slotIndex: action.slotIndex,
    cardId: action.cardId
  });
}
