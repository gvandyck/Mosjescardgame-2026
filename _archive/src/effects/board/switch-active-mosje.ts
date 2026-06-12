import { switchActiveMosje as switchActiveMosjeReducer } from "../../engine/reducers/player/switch-active-mosje.js";
import type { Primitive } from "../primitive.js";

export interface SwitchActiveMosjeParams {
  readonly playerId: string;
}

export const switchActiveMosje: Primitive<SwitchActiveMosjeParams> = (state, params) =>
  switchActiveMosjeReducer(state, { playerId: params.playerId });
