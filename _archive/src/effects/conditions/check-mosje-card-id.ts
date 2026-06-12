import type { GameState } from "../../types/game-state.js";

export function checkMosjeCardId(
  state: GameState,
  params: { target: { playerId: string; instanceId: string }; pattern: string }
): boolean {
  const player = state.players.find((candidate) => candidate.id === params.target.playerId);
  const mosje = player?.mosjes.find((candidate) => candidate.instanceId === params.target.instanceId);
  if (mosje === undefined) return false;
  return mosje.cardId.includes(params.pattern);
}
