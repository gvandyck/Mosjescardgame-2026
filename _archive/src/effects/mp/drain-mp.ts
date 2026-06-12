import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";
import { gainMP } from "./gain-mp.js";
import { loseMP } from "./lose-mp.js";
import type { DrainMPParams } from "./types.js";

export const drainMP: Primitive<DrainMPParams> = (state, params, context) => {
  const sourcePlayer = state.players.find((player) => player.id === params.from.playerId);
  const sourceMosje = sourcePlayer?.mosjes.find((mosje) => mosje.instanceId === params.from.instanceId);
  if (sourceMosje === undefined) return state;

  const before = sourceMosje.mp;
  const afterLossState = loseMP(state, { target: params.from, amount: params.amount }, context);

  const refreshedSourcePlayer = afterLossState.players.find((player) => player.id === params.from.playerId);
  const refreshedSourceMosje = refreshedSourcePlayer?.mosjes.find(
    (mosje) => mosje.instanceId === params.from.instanceId
  );
  if (refreshedSourceMosje === undefined) return afterLossState;

  const actualLost = Math.max(0, before - refreshedSourceMosje.mp);
  const afterGainState =
    actualLost > 0
      ? gainMP(afterLossState, { target: params.to, amount: actualLost }, context)
      : afterLossState;

  return appendEvent(afterGainState, {
    type: "mp_drained",
    from: params.from,
    to: params.to,
    amount: actualLost
  });
};
