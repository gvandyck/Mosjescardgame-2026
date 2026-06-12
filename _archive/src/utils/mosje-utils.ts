import { getCard } from "../cards/registry/card-registry.js";
import type { MosjeDefinition } from "../cards/schema/mosje-definition.js";
import type { MosjeRef } from "../types/events.js";
import type { GameState } from "../types/game-state.js";

function resolveMosjeCardId(state: GameState, mosjeRef: MosjeRef): string | undefined {
  const player = state.players.find((candidate) => candidate.id === mosjeRef.playerId);
  const mosje = player?.mosjes.find((candidate) => candidate.instanceId === mosjeRef.instanceId);
  return mosje?.cardId;
}

export function getMosjeType(
  state: GameState,
  mosjeRef: MosjeRef
): "FIGHTING" | "DIGITAL" | "ARTISTIC" | undefined {
  const cardId = resolveMosjeCardId(state, mosjeRef);
  if (cardId === undefined) return undefined;

  try {
    const card = getCard(cardId as never);
    if (card.category !== "mosje") return undefined;
    return (card as MosjeDefinition).mosjeType;
  } catch {
    return undefined;
  }
}
