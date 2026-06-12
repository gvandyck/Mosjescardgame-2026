import { appendEvent } from "../../append-event.js";
import { getCard } from "../../../cards/registry/card-registry.js";
import type { CardId } from "../../../types/card-id.js";
import type { GameState } from "../../../types/game-state.js";
import type { PlayPiecieFaceDownAction } from "../../../types/player-reducer-actions.js";

function hasDurationBuffEffect(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => hasDurationBuffEffect(entry));
  }
  if (value === null || typeof value !== "object") return false;

  const obj = value as Record<string, unknown>;
  if (obj["primitive"] === "applyBuff") {
    const params = obj["params"] as Record<string, unknown> | undefined;
    if (params !== undefined && params["expiryTurn"] !== undefined) return true;
  }

  return Object.values(obj).some((nested) => hasDurationBuffEffect(nested));
}

function resolveCardEffects(cardId: CardId): ReadonlyArray<unknown> {
  try {
    return getCard(cardId).effects;
  } catch {
    return [];
  }
}

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
  const shouldMarkDurationBonus =
    state.gameFlags?.["synergy_chamber_active"] === true && hasDurationBuffEffect(resolveCardEffects(action.cardId));

  const updatedPlayer = {
    ...player,
    hand: updatedHand,
    piecieSlots: updatedSlots,
    flags: shouldMarkDurationBonus
      ? {
          ...player.flags,
          [`synergy_chamber_duration_bonus:${action.cardId}`]: true
        }
      : player.flags
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
