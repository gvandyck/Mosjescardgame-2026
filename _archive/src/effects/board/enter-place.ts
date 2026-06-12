import { enterPlace as enterPlaceManager } from "../../engine/place-manager.js";
import type { Primitive } from "../primitive.js";
import type { EnterPlaceParams } from "./types.js";

export const enterPlace: Primitive<EnterPlaceParams> = (state, params, context) => {
  return enterPlaceManager(state, params.cardId as never);
};
