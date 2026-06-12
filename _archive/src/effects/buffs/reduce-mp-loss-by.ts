import type { Primitive } from "../primitive.js";
import { applyBuff } from "./apply-buff.js";
import type { ReduceMPLossByParams } from "./types.js";

export const reduceMPLossBy: Primitive<ReduceMPLossByParams> = (state, params, context) => {
  return applyBuff(
    state,
    {
      target: params.target,
      buffId: "mp-loss-reduction",
      data: { amount: params.amount },
      expiryTurn: context.turnCount + params.duration
    },
    context
  );
};
