import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";
import type { RollDieParams } from "./types.js";

export const rollDie: Primitive<RollDieParams> = (state, params, context) => {
  const modifier = params.modifier ?? 0;
  const raw = context.rng.rollD6();
  const final = raw + modifier;

  const withRoll = {
    ...state,
    lastRoll: {
      raw,
      modifier,
      final,
      rollerId: context.actingPlayerId
    }
  };

  return appendEvent(withRoll, {
    type: "die_rolled",
    raw,
    modifier,
    final,
    rollerId: context.actingPlayerId
  });
};
