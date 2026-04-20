import type { GameState } from "../../types/game-state.js";

export function checkSynergy(
  state: GameState,
  params: { mosje: { playerId: string; instanceId: string }; partnerCardId: string }
): boolean {
  const player = state.players.find((candidate) => candidate.id === params.mosje.playerId);
  if (player === undefined) return false;

  const hasMosje = player.mosjes.some((candidate) => candidate.instanceId === params.mosje.instanceId);
  if (!hasMosje) return false;

  return player.mosjes.some((candidate) => candidate.cardId === params.partnerCardId);
}
