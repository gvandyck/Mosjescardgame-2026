import type { Primitive } from "../primitive.js";
import { runConditionExpr } from "./run-condition-expr.js";
import { runEffectExpr } from "./run-effect-expr.js";
import type { IfThenElseParams } from "./types.js";

export const ifThenElse: Primitive<IfThenElseParams> = (state, params, context) => {
  const conditionMet = runConditionExpr(state, params.condition, context);
  if (conditionMet) {
    return runEffectExpr(state, params.then, context);
  }

  if (params.else === undefined) return state;
  return runEffectExpr(state, params.else, context);
};
