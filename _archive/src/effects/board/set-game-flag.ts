import type { Primitive } from "../primitive.js";

export interface SetGameFlagParams {
  readonly flag: string;
  readonly value: unknown;
}

export const setGameFlag: Primitive<SetGameFlagParams> = (state, params) => {
  if (params === undefined || typeof (params as { flag?: unknown }).flag !== "string") return state;
  return {
    ...state,
    gameFlags: {
      ...(state.gameFlags ?? {}),
      [params.flag]: params.value
    }
  };
};
