import type { Primitive } from "../primitive.js";
import type { MultiplyNextMPGainParams } from "./types.js";

export const multiplyNextMPGain: Primitive<MultiplyNextMPGainParams> = (state, params, context) => {
  const targetPlayerIndex = state.players.findIndex((player) => player.id === params.target.playerId);
  if (targetPlayerIndex < 0) return state;

  const targetPlayer = state.players[targetPlayerIndex];
  const targetMosjeIndex = targetPlayer.mosjes.findIndex(
    (mosje) => mosje.instanceId === params.target.instanceId
  );
  if (targetMosjeIndex < 0) return state;

  const updatedMosjes = targetPlayer.mosjes.map((mosje, index) => {
    if (index !== targetMosjeIndex) return mosje;
    return {
      ...mosje,
      flags: {
        ...mosje.flags,
        mp_gain_multiplier: {
          multiplier: params.multiplier,
          duration: params.duration,
          expiresOnTurn: params.duration === "this_turn" ? context.turnCount : undefined
        }
      }
    };
  });

  const updatedPlayers = state.players.map((player, index) => {
    if (index !== targetPlayerIndex) return player;
    return { ...player, mosjes: updatedMosjes };
  });

  return { ...state, players: updatedPlayers };
};
