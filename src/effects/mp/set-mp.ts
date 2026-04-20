import { appendEvent } from "../../engine/append-event.js";
import { applyVictoryCheck } from "../../engine/apply-victory-check.js";
import type { Primitive } from "../primitive.js";
import type { SetMPParams } from "./types.js";

export const setMP: Primitive<SetMPParams> = (state, params, context) => {
  if (state.activePlace?.cardId === "place_momentum_stabilizer") {
    return state;
  }

  const targetPlayerIndex = state.players.findIndex((player) => player.id === params.target.playerId);
  if (targetPlayerIndex < 0) return state;

  const targetPlayer = state.players[targetPlayerIndex];
  const targetMosjeIndex = targetPlayer.mosjes.findIndex(
    (mosje) => mosje.instanceId === params.target.instanceId
  );
  if (targetMosjeIndex < 0) return state;

  const oldValue = targetPlayer.mosjes[targetMosjeIndex].mp;
  const nextFlags = { ...targetPlayer.mosjes[targetMosjeIndex].flags };
  if (params.value < 0) {
    nextFlags.cannot_complete_quests = true;
  } else {
    delete nextFlags.cannot_complete_quests;
  }

  const updatedMosjes = targetPlayer.mosjes.map((mosje, index) => {
    if (index !== targetMosjeIndex) return mosje;
    return {
      ...mosje,
      mp: params.value,
      flags: nextFlags
    };
  });
  const updatedPlayers = state.players.map((player, index) => {
    if (index !== targetPlayerIndex) return player;
    return { ...player, mosjes: updatedMosjes };
  });

  const withValue = { ...state, players: updatedPlayers };
  const withEvent = appendEvent(withValue, {
    type: "mp_set",
    target: params.target,
    oldValue,
    newValue: params.value,
    source: context.source
  });

  return applyVictoryCheck(withEvent);
};
