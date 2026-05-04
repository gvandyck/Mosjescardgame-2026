import type { GameState } from "../types/game-state.js";
import type { EffectContext } from "./effect-context.js";

export type Primitive<P = unknown> = (
  state: GameState,
  params: P,
  context: EffectContext
) => GameState;

export type QueryPrimitive<P = unknown, R = unknown> = (
  state: GameState,
  params: P,
  context: EffectContext
) => R;
