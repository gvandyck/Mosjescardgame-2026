import { isFresh } from '../fresh/isFresh.js';

// The Void (2.0): Piecies and Snelle can't make a Mosje gain MP (a fresh Mosje ignores Places).
// A staying Piecie's start-of-turn gain (STAYS_START: Bowie & Stormey, Gekke Vogels) counts too (Gandalf 2026-10-18).
// One check for every Piecie / Snelle gain path (gainMP and the Emergency Healings beforeLoss step).
export function voidBlocksGain(gameState, playerId, slotIndex, source) {
  const placeId = gameState?.activePlace || gameState?.sharedPlaceSlot?.cardId || null;
  return placeId === 'place_the_void' && (source === 'PIECIE' || source === 'SNELLE' || source === 'STAYS_START')
    && !isFresh(gameState.players[playerId]?.activeSlots?.[slotIndex]);
}
