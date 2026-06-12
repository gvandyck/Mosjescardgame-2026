import type { GameState } from "../../types/game-state.js";

export function checkMP(
  state: GameState,
  params: {
    target: { playerId: string; instanceId: string };
    operator: "==" | ">=" | "<=" | "between";
    value: number;
    rangeEnd?: number;
    forQuestCheck?: boolean;
  }
): boolean {
  const player = state.players.find((candidate) => candidate.id === params.target.playerId);
  const mosje = player?.mosjes.find((candidate) => candidate.instanceId === params.target.instanceId);
  if (mosje === undefined) return false;

  const override = params.forQuestCheck === true ? Number(mosje.flags.quest_mp_override ?? Number.NaN) : Number.NaN;
  const effectiveMP = Number.isFinite(override) ? override : mosje.mp;

  if (params.operator === "==") return effectiveMP === params.value;
  if (params.operator === ">=") return effectiveMP >= params.value;
  if (params.operator === "<=") return effectiveMP <= params.value;

  const rangeEnd = params.rangeEnd ?? params.value;
  return effectiveMP >= params.value && effectiveMP <= rangeEnd;
}
