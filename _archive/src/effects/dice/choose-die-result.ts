import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";
import type { ChooseDieResultParams } from "./types.js";

export const chooseDieResult: Primitive<ChooseDieResultParams> = (state, params, context) => {
  if (state.lastRoll === null) {
    return appendEvent(state, {
      type: "warning",
      code: "choose_die_without_prior_roll",
      message: "choose-die-result called without an active roll"
    });
  }

  return {
    ...state,
    lastRoll: {
      ...state.lastRoll,
      final: params.chosenValue,
      rollerId: context.actingPlayerId
    }
  };
};
