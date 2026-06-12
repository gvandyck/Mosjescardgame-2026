import type { GameState } from "../../types/game-state.js";

export function checkPlaceActive(
  state: GameState,
  params: { placeCardId: string }
): boolean {
  return state.activePlace?.cardId === params.placeCardId;
}
