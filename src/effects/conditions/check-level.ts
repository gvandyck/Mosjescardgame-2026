import type { GameState } from "../../types/game-state.js";

export function checkLevel(
  state: GameState,
  params: { target: { playerId: string; instanceId: string }; minLevel: 1 | 2 | 3 }
): boolean {
  const player = state.players.find((candidate) => candidate.id === params.target.playerId);
  const mosje = player?.mosjes.find((candidate) => candidate.instanceId === params.target.instanceId);
  if (mosje === undefined) return false;
  return mosje.level >= params.minLevel;
}
