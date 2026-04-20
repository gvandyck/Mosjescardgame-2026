import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";
import { runEffectExpr } from "./run-effect-expr.js";
import type { ChooseParams } from "./types.js";

export const choose: Primitive<ChooseParams> = (state, params, context) => {
  if (params.options.length === 0) return state;

  if (params.resolver === undefined) {
    return appendEvent(state, {
      type: "warning",
      code: "choose_missing_resolver",
      message: "choose primitive requires resolver in Phase 2 tests"
    });
  }

  const selectedIndex = params.resolver(params.chooserId, params.options, state, context);
  if (selectedIndex < 0 || selectedIndex >= params.options.length) {
    return appendEvent(state, {
      type: "warning",
      code: "choose_invalid_index",
      message: "choose resolver returned out-of-range index"
    });
  }

  return runEffectExpr(state, params.options[selectedIndex], context);
};
