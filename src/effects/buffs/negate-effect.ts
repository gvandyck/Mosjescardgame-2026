import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";
import type { NegateEffectParams } from "./types.js";

export const negateEffect: Primitive<NegateEffectParams> = (state, params) => {
  const hasEffect = state.effectStack.some((effect) => effect.id === params.pendingEffectId);
  if (!hasEffect) return state;

  const nextState = {
    ...state,
    effectStack: state.effectStack.filter((effect) => effect.id !== params.pendingEffectId)
  };

  return appendEvent(nextState, {
    type: "effect_negated",
    pendingEffectId: params.pendingEffectId
  });
};
