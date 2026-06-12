import type { GameState } from "../../types/game-state.js";

export function checkTrait(
  state: GameState,
  params: { target: { playerId: string; instanceId: string }; trait: string; minStars: 1 | 2 | 3 }
): boolean {
  const player = state.players.find((candidate) => candidate.id === params.target.playerId);
  const mosje = player?.mosjes.find((candidate) => candidate.instanceId === params.target.instanceId);
  if (mosje === undefined) return false;

  const traits = (mosje.flags.traits as Readonly<Record<string, number>> | undefined) ?? {};
  const stars = Number(traits[params.trait] ?? 0);
  return stars >= params.minStars;
}
