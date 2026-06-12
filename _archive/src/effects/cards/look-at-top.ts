import { revealTopDeck } from "./reveal-top-deck.js";
import type { Primitive } from "../primitive.js";
import type { LookAtTopParams } from "./types.js";

export const lookAtTop: Primitive<LookAtTopParams> = (state, params, context) => {
  return revealTopDeck(
    state,
    {
      playerId: params.playerId,
      targetDeckOwner: params.targetDeckOwner,
      count: params.count
    },
    context
  );
};
