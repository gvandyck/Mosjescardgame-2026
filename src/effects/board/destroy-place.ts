import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";

export const destroyPlace: Primitive<Record<string, never>> = (state) => {
  if (state.activePlace === null) return state;

  const nextState = {
    ...state,
    activePlace: null
  };

  return appendEvent(nextState, {
    type: "place_destroyed",
    cardId: state.activePlace.cardId
  });
};
