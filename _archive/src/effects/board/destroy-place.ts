import { exitPlace } from "../../engine/place-manager.js";
import type { Primitive } from "../primitive.js";

export const destroyPlace: Primitive<Record<string, never>> = (state) => {
  return exitPlace(state);
};
