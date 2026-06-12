import { activatePiecie } from "../../engine/reducers/player/activate-piecie.js";
import type { Primitive } from "../primitive.js";
import type { ActivateFaceDownPiecieParams } from "./types.js";

export const activateFaceDownPiecie: Primitive<ActivateFaceDownPiecieParams> = (state, params) => {
  const player = state.players.find((candidate) => candidate.id === params.playerId);
  if (player === undefined) return state;

  const slot = player.piecieSlots[params.slotIndex];
  if (slot === undefined || slot.cardId === null) return state;

  const fastSlots = (player.flags.fast_activate_piecie_slots as ReadonlyArray<number> | undefined) ?? [];
  const isFastActivate = fastSlots.includes(params.slotIndex);

  if (slot.turnsSincePlaced < 1 && !isFastActivate) {
    throw new Error("Cannot activate face-down piecie on the same turn it was placed");
  }

  return activatePiecie(state, {
    playerId: params.playerId,
    slotIndex: params.slotIndex,
    isSnelle: isFastActivate
  });
};
