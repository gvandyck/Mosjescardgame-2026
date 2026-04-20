import type { GameState } from "../../types/game-state.js";

export function checkPetSynergy(
  state: GameState,
  params: { mosje: { playerId: string; instanceId: string }; petCardId: string }
): boolean {
  const player = state.players.find((candidate) => candidate.id === params.mosje.playerId);
  if (player === undefined) return false;

  const hasMosje = player.mosjes.some((candidate) => candidate.instanceId === params.mosje.instanceId);
  if (!hasMosje) return false;

  const expiry = Number(player.flags[`pet:${params.petCardId}:expiryTurn`] ?? Number.POSITIVE_INFINITY);
  if (state.turnCount > expiry) return false;

  return player.piecieSlots.some((slot) => slot.faceUp && slot.cardId === params.petCardId);
}
