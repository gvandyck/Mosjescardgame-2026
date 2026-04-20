import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";
import type { ApplyBuffParams } from "./types.js";

export const applyBuff: Primitive<ApplyBuffParams> = (state, params) => {
  const key = `buff:${params.buffId}`;
  const playerIndex = state.players.findIndex((player) => player.id === params.target.playerId);
  if (playerIndex < 0) return state;

  if (params.target.instanceId === undefined) {
    const updatedPlayers = state.players.map((player, index) => {
      if (index !== playerIndex) return player;
      return {
        ...player,
        flags: {
          ...player.flags,
          [key]: {
            data: params.data,
            expiryTurn: params.expiryTurn
          }
        }
      };
    });

    return appendEvent({ ...state, players: updatedPlayers }, {
      type: "buff_applied",
      target: { playerId: params.target.playerId },
      buffId: params.buffId,
      expiryTurn: params.expiryTurn
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
          expiryTurn: params.expiryTurn
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
    expiryTurn: params.expiryTurn
  });
};
