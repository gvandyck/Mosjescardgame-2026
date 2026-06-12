import type { GameState } from "../../types/game-state.js";
import { getMosjeType } from "../../utils/mosje-utils.js";

export function checkMosjeType(
  state: GameState,
  params: { target: { playerId: string; instanceId: string }; mosjeType: "FIGHTING" | "DIGITAL" | "ARTISTIC" }
): boolean {
  return getMosjeType(state, params.target) === params.mosjeType;
}
