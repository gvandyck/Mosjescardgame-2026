import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";
import { runEffectExpr } from "./run-effect-expr.js";
import type { ChainParams } from "./types.js";

export const chain: Primitive<ChainParams> = (state, params, context) => {
  let nextState = state;

  for (const effect of params.effects) {
    try {
      nextState = runEffectExpr(nextState, effect, context);
    } catch (error) {
      return appendEvent(nextState, {
        type: "warning",
        code: "chain_effect_failed",
        message: `Effect ${effect.primitive} failed: ${String(error)}`
      });
    }
  }

  return nextState;
};
