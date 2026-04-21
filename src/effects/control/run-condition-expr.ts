import {
  checkCardTypeInPlay,
  checkEventLogThisTurn,
  checkLevel,
  checkMP,
  checkPendingEffectAmount,
  checkPetSynergy,
  checkPlaceActive,
  checkSynergy,
  checkTrait
} from "../conditions/index.js";
import type { GameState } from "../../types/game-state.js";
import type { EffectContext } from "../effect-context.js";
import type { ConditionExpr } from "./types.js";

export function runConditionExpr(state: GameState, expr: ConditionExpr, context: EffectContext): boolean {
  const conditionName = expr.condition ?? (expr as { primitive?: string }).primitive;
  if (conditionName === "checkTrait") return checkTrait(state, expr.params as never);
  if (conditionName === "checkSynergy") return checkSynergy(state, expr.params as never);
  if (conditionName === "checkPetSynergy") return checkPetSynergy(state, expr.params as never);
  if (conditionName === "checkLevel") return checkLevel(state, expr.params as never);
  if (conditionName === "checkMP") return checkMP(state, expr.params as never);
  if (conditionName === "checkCardTypeInPlay") return checkCardTypeInPlay(state, expr.params as never);
  if (conditionName === "checkPlaceActive") return checkPlaceActive(state, expr.params as never);
  if (conditionName === "checkPendingEffectAmount") {
    return checkPendingEffectAmount(state, expr.params as never, context);
  }
  if (conditionName === "checkEventLogThisTurn") {
    return checkEventLogThisTurn(state, expr.params as never, context);
  }
  return false;
}
