import {
  checkCardTypeInPlay,
  checkLevel,
  checkMP,
  checkPetSynergy,
  checkPlaceActive,
  checkSynergy,
  checkTrait
} from "../conditions/index.js";
import type { GameState } from "../../types/game-state.js";
import type { ConditionExpr } from "./types.js";

export function runConditionExpr(state: GameState, expr: ConditionExpr): boolean {
  if (expr.condition === "checkTrait") return checkTrait(state, expr.params as never);
  if (expr.condition === "checkSynergy") return checkSynergy(state, expr.params as never);
  if (expr.condition === "checkPetSynergy") return checkPetSynergy(state, expr.params as never);
  if (expr.condition === "checkLevel") return checkLevel(state, expr.params as never);
  if (expr.condition === "checkMP") return checkMP(state, expr.params as never);
  if (expr.condition === "checkCardTypeInPlay") return checkCardTypeInPlay(state, expr.params as never);
  if (expr.condition === "checkPlaceActive") return checkPlaceActive(state, expr.params as never);
  return false;
}
