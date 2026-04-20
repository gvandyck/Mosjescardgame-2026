import type { EffectContext } from "../effect-context.js";
import { resolvePrimitive } from "../registry.js";
import type { GameState } from "../../types/game-state.js";
import type { EffectExpr } from "./types.js";

export function runEffectExpr(state: GameState, expr: EffectExpr, context: EffectContext): GameState {
  const primitive = resolvePrimitive(expr.primitive);
  return primitive(state, expr.params, context);
}
