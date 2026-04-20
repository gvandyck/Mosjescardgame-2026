import { appendEvent } from "../../engine/append-event.js";
import { gainMP as gainMPReducer } from "../../engine/reducers/player/gain-mp.js";
import type { GameState } from "../../types/game-state.js";
import { ModifierSource } from "../../types/modifier-source.js";
import type { Primitive } from "../primitive.js";
import type { GainMPParams } from "./types.js";

export const gainMP: Primitive<GainMPParams> = (state, params, context) => {
  if (params.amount <= 0) {
    return appendEvent(state, {
      type: "warning",
      code: "gain_mp_invalid_amount",
      message: "gainMP called with amount <= 0"
    });
  }

  const targetPlayerIndex = state.players.findIndex((player) => player.id === params.target.playerId);
  if (targetPlayerIndex < 0) return state;

  const targetPlayer = state.players[targetPlayerIndex];
  const targetMosjeIndex = targetPlayer.mosjes.findIndex(
    (mosje) => mosje.instanceId === params.target.instanceId
  );
  if (targetMosjeIndex < 0) return state;

  if (context.source.kind !== "cost" && state.activePlace?.cardId === "place_the_void") {
    return state;
  }

  const actingPlayer = state.players.find((player) => player.id === context.actingPlayerId);
  const targetMosje = targetPlayer.mosjes[targetMosjeIndex];

  const targetFlatBySource = targetMosje.flags.u6_gain_flat_modifiers as
    | Readonly<Partial<Record<ModifierSource, number>>>
    | undefined;
  const actingMultipliersBySource = actingPlayer?.flags.u6_gain_multipliers as
    | Readonly<Partial<Record<ModifierSource, number>>>
    | undefined;
  const placeMultipliersBySource = state.activePlace?.flags.u6_gain_multipliers as
    | Readonly<Partial<Record<ModifierSource, number>>>
    | undefined;

  let computedAmount = params.amount;
  const ronaldBonus = Number(
    targetFlatBySource?.[ModifierSource.MOSJE_PASSIVE] ?? targetMosje.flags.u6_ronald_bonus ?? 0
  );
  computedAmount += ronaldBonus;

  const partnerMultiplier = Number(
    actingMultipliersBySource?.[ModifierSource.PARTNER_SYNERGY] ??
      actingPlayer?.flags.u6_partner_multiplier ??
      1
  );
  computedAmount = Math.floor(computedAmount * partnerMultiplier);

  const placeMultiplier = Number(
    placeMultipliersBySource?.[ModifierSource.PLACE] ?? state.activePlace?.flags.u6_place_multiplier ?? 1
  );
  computedAmount = Math.floor(computedAmount * placeMultiplier);

  let nextState = state;
  const multiplierFlag = targetMosje.flags.mp_gain_multiplier as
    | {
        readonly multiplier: number;
        readonly duration: "next_gain" | "this_turn";
        readonly expiresOnTurn?: number;
      }
    | undefined;

  if (multiplierFlag !== undefined) {
    const stillValid =
      multiplierFlag.duration === "next_gain" ||
      (multiplierFlag.duration === "this_turn" &&
        typeof multiplierFlag.expiresOnTurn === "number" &&
        context.turnCount <= multiplierFlag.expiresOnTurn);

    if (stillValid) {
      computedAmount = Math.floor(computedAmount * multiplierFlag.multiplier);
    }

    if (multiplierFlag.duration === "next_gain") {
      const updatedMosjes = targetPlayer.mosjes.map((mosje, index) => {
        if (index !== targetMosjeIndex) return mosje;
        const nextFlags = { ...mosje.flags };
        delete nextFlags.mp_gain_multiplier;
        return { ...mosje, flags: nextFlags };
      });
      const updatedPlayers = state.players.map((player, index) => {
        if (index !== targetPlayerIndex) return player;
        return { ...player, mosjes: updatedMosjes };
      });
      nextState = { ...state, players: updatedPlayers };
    }
  }

  const doubleNextGainBuff = targetMosje.flags["buff:double_next_mp_gain"] as
    | { readonly data?: { readonly multiplier?: number } }
    | undefined;
  if (doubleNextGainBuff !== undefined) {
    const buffMultiplier = Number(doubleNextGainBuff.data?.multiplier ?? 2);
    computedAmount = Math.floor(computedAmount * buffMultiplier);

    const updatedMosjes = nextState.players[targetPlayerIndex].mosjes.map((mosje, index) => {
      if (index !== targetMosjeIndex) return mosje;
      const nextFlags = { ...mosje.flags };
      delete nextFlags["buff:double_next_mp_gain"];
      return { ...mosje, flags: nextFlags };
    });
    const updatedPlayers = nextState.players.map((player, index) => {
      if (index !== targetPlayerIndex) return player;
      return { ...player, mosjes: updatedMosjes };
    });
    nextState = { ...nextState, players: updatedPlayers };
  }

  if (computedAmount <= 0) return nextState;

  return gainMPReducer(nextState, {
    target: params.target,
    amount: computedAmount,
    source: context.source
  });
};
