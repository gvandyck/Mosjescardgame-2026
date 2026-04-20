import type { GameState } from "../types/game-state.js";
import type { EffectContext } from "./effect-context.js";

export type Primitive<P = Record<string, unknown>> = (
  state: GameState,
  params: P,
  context: EffectContext
) => GameState;
