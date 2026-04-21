import type { EffectContext } from "../effect-context.js";
import type { QueryPrimitive } from "../primitive.js";
import type { GameState } from "../../types/game-state.js";

export interface CheckPendingEffectAmountParams {
  readonly operator: ">=" | "<=" | "==" | ">";
  readonly value: number;
}

export const checkPendingEffectAmount: QueryPrimitive<CheckPendingEffectAmountParams, boolean> = (
  _state: GameState,
  params,
  context: EffectContext
) => {
  const amount = Number(context.respondingToPendingEffect?.params?.["amount"] ?? 0);

  switch (params.operator) {
    case ">=":
      return amount >= params.value;
    case "<=":
      return amount <= params.value;
    case "==":
      return amount === params.value;
    case ">":
      return amount > params.value;
    default: {
      const _: never = params.operator;
      return _;
    }
  }
};
