import { appendEvent } from "../../engine/append-event.js";
import type { Primitive } from "../primitive.js";
import { destroyPlace } from "./destroy-place.js";
import type { EnterPlaceParams } from "./types.js";

export const enterPlace: Primitive<EnterPlaceParams> = (state, params, context) => {
  const withoutPriorPlace =
    state.activePlace === null ? state : destroyPlace(state, {}, context);

  const withPlace = {
    ...withoutPriorPlace,
    activePlace: {
      cardId: params.cardId as never,
      flags: {
        enteredBy: params.playerId
      }
    }
  };

  return appendEvent(withPlace, {
    type: "place_entered",
    cardId: params.cardId as never
  });
};
