import type { Primitive } from "../primitive.js";
import { rollDie } from "../dice/roll-die.js";
import { runEffectExpr } from "./run-effect-expr.js";
import type { RollBranchParams } from "./types.js";

export const rollBranch: Primitive<RollBranchParams> = (state, params, context) => {
  const withRoll = rollDie(state, {}, context);
  const result = withRoll.lastRoll?.final ?? 0;

  for (const branch of params.branches) {
    if (result >= branch.range[0] && result <= branch.range[1]) {
      return runEffectExpr(withRoll, branch.effect, context);
    }
  }

  return withRoll;
};
