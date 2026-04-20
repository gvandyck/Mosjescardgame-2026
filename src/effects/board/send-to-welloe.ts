import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";

export interface SendToWelloeParams {
  readonly target: { readonly playerId: string; readonly instanceId: string };
}

export const sendToWelloe: Primitive<SendToWelloeParams> = (state, params) => {
  const playerIndex = state.players.findIndex((player) => player.id === params.target.playerId);
  if (playerIndex < 0) return state;

  const player = state.players[playerIndex];
  const mosjeIndex = player.mosjes.findIndex((mosje) => mosje.instanceId === params.target.instanceId);
  if (mosjeIndex < 0) return state;

  const updatedMosjes = player.mosjes.map((mosje, index) => {
    if (index !== mosjeIndex) return mosje;
    return {
      ...mosje,
      mp: -999,
      flags: {
        ...mosje.flags,
        in_welloe: true
      }
    };
  });
  const updatedPlayers = state.players.map((candidate, index) => {
    if (index !== playerIndex) return candidate;
    return { ...candidate, mosjes: updatedMosjes };
  });

  return appendEvent({ ...state, players: updatedPlayers }, {
    type: "mosje_defeated",
    target: params.target
  });
};
