import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";
import type { ApplyBuffParams } from "./types.js";

export const applyBuff: Primitive<ApplyBuffParams> = (state, params, context) => {
  const key = `buff:${params.buffId}`;
  const playerIndex = state.players.findIndex((player) => player.id === params.target.playerId);
  if (playerIndex < 0) return state;

  const durationBonusKey = `synergy_chamber_duration_bonus:${context.source.cardId ?? ""}`;
  const sourcePlayer = state.players.find((player) => player.id === context.actingPlayerId);
  const hasDurationBonus = sourcePlayer?.flags[durationBonusKey] === true;
  const effectiveExpiryTurn = hasDurationBonus ? params.expiryTurn + 1 : params.expiryTurn;

  if (params.target.instanceId === undefined) {
    const updatedPlayers = state.players.map((player, index) => {
      if (index !== playerIndex) return player;
      return {
        ...player,
        flags: {
          ...player.flags,
          [key]: {
            data: params.data,
            expiryTurn: effectiveExpiryTurn
          }
        }
      };
    });

    return appendEvent({ ...state, players: updatedPlayers }, {
      type: "buff_applied",
      target: { playerId: params.target.playerId },
      buffId: params.buffId,
      expiryTurn: effectiveExpiryTurn
    });
  }

  const player = state.players[playerIndex];
  const mosjeIndex = player.mosjes.findIndex((mosje) => mosje.instanceId === params.target.instanceId);
  if (mosjeIndex < 0) return state;

  const updatedMosjes = player.mosjes.map((mosje, index) => {
    if (index !== mosjeIndex) return mosje;
    return {
      ...mosje,
      flags: {
        ...mosje.flags,
        [key]: {
          data: params.data,
          expiryTurn: effectiveExpiryTurn
        }
      }
    };
  });

  const updatedPlayers = state.players.map((candidate, index) => {
    if (index !== playerIndex) return candidate;
    return {
      ...candidate,
      mosjes: updatedMosjes
    };
  });

  return appendEvent({ ...state, players: updatedPlayers }, {
    type: "buff_applied",
    target: { playerId: params.target.playerId, instanceId: params.target.instanceId },
    buffId: params.buffId,
    expiryTurn: effectiveExpiryTurn
  });
};
