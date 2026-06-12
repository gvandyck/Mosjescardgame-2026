import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";

export const rerollDie: Primitive<Record<string, never>> = (state, _params, context) => {
  if (state.lastRoll === null) {
    return appendEvent(state, {
      type: "warning",
      code: "reroll_without_prior_roll",
      message: "reroll-die was called before any roll existed"
    });
  }

  const previous = state.lastRoll;
  const raw = context.rng.rollD6();
  const next = {
    raw,
    modifier: previous.modifier,
    final: raw + previous.modifier,
    rollerId: previous.rollerId
  };

  const withRoll = {
    ...state,
    lastRoll: next
  };

  return appendEvent(withRoll, {
    type: "die_rerolled",
    previous,
    next
  });
};
