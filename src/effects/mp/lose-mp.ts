import { appendEvent } from "../../engine/append-event.js";
import { loseMP as loseMPReducer } from "../../engine/reducers/player/lose-mp.js";
import { ModifierSource } from "../../types/modifier-source.js";
import type { Primitive } from "../primitive.js";
import type { LoseMPParams } from "./types.js";

export const loseMP: Primitive<LoseMPParams> = (state, params, context) => {
  if (params.amount <= 0) {
    return appendEvent(state, {
      type: "warning",
      code: "lose_mp_invalid_amount",
      message: "loseMP called with amount <= 0"
    });
  }

  const targetPlayerIndex = state.players.findIndex((player) => player.id === params.target.playerId);
  if (targetPlayerIndex < 0) return state;

  const targetPlayer = state.players[targetPlayerIndex];
  const targetMosjeIndex = targetPlayer.mosjes.findIndex(
    (mosje) => mosje.instanceId === params.target.instanceId
  );
  if (targetMosjeIndex < 0) return state;

  const targetMosje = targetPlayer.mosjes[targetMosjeIndex];

  if (!params.isCostPayment && state.activePlace?.cardId === "place_the_void") {
    return state;
  }

  if (!params.isCostPayment && targetMosje.flags.negate_next_mp_loss === true) {
    const updatedMosjes = targetPlayer.mosjes.map((mosje, index) => {
      if (index !== targetMosjeIndex) return mosje;
      const nextFlags = { ...mosje.flags };
      delete nextFlags.negate_next_mp_loss;
      return { ...mosje, flags: nextFlags };
    });
    const updatedPlayers = state.players.map((player, index) => {
      if (index !== targetPlayerIndex) return player;
      return { ...player, mosjes: updatedMosjes };
    });
    return { ...state, players: updatedPlayers };
  }

  let adjustedAmount = params.amount;

  if (!params.isCostPayment) {
    const lossFlatReductionsBySource = targetMosje.flags.u6_loss_flat_reductions as
      | Readonly<Partial<Record<ModifierSource, number>>>
      | undefined;
    const sourceFlatReduction = Object.values(ModifierSource)
      .map((source) => Number(lossFlatReductionsBySource?.[source] ?? 0))
      .reduce((sum, value) => sum + value, 0);

    const flatReduction = Number(targetMosje.flags.kast_elein_flat_reduction ?? 0);
    adjustedAmount = Math.max(0, adjustedAmount - flatReduction - sourceFlatReduction);

    if (adjustedAmount >= 50 && targetMosje.flags.kast_elein_half_after_threshold === true) {
      adjustedAmount = Math.floor(adjustedAmount / 2);
    }

    const mpLossReductionBuff = targetMosje.flags["buff:mp-loss-reduction"] as
      | { readonly data?: { readonly amount?: number } }
      | undefined;
    const buffReduction = Number(mpLossReductionBuff?.data?.amount ?? 0);
    adjustedAmount = Math.max(0, adjustedAmount - buffReduction);
  }

  return loseMPReducer(state, {
    target: params.target,
    amount: adjustedAmount,
    source: params.isCostPayment === true ? { kind: "cost" } : context.source
  });
};
