import type { GameState } from "../../types/game-state.js";

export function checkPetSynergy(
  state: GameState,
  params: { mosje: { playerId: string; instanceId: string }; petCardId: string }
): boolean {
  const player = state.players.find((candidate) => candidate.id === params.mosje.playerId);
  if (player === undefined) return false;

  const mosje = player.mosjes.find((candidate) => candidate.instanceId === params.mosje.instanceId);
  if (mosje === undefined) return false;

  return mosje.flags[`buff:pet_active:${params.petCardId}`] !== undefined;
}
