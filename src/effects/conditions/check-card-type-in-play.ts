import type { GameState } from "../../types/game-state.js";

export function checkCardTypeInPlay(
  state: GameState,
  params: { playerId: string; cardType: string }
): boolean {
  const player = state.players.find((candidate) => candidate.id === params.playerId);
  if (player === undefined) return false;

  const hasMosjeType = player.mosjes.some((mosje) => mosje.flags.cardType === params.cardType);
  if (hasMosjeType) return true;

  if (state.activePlace?.flags.cardType === params.cardType) return true;
  return false;
}
