import type { GameState } from "../../types/game-state.js";
import type { EffectContext } from "../effect-context.js";

export interface EffectExpr {
  readonly primitive: string;
  readonly params: Readonly<Record<string, unknown>>;
}

export interface ConditionExpr {
  readonly condition?: string;
  readonly primitive?: string;
  readonly params: Readonly<Record<string, unknown>>;
}

export interface IfThenElseParams {
  readonly condition: ConditionExpr;
  readonly then: EffectExpr;
  readonly else?: EffectExpr;
}

export interface ChainParams {
  readonly effects: ReadonlyArray<EffectExpr>;
}

export interface ChooseParams {
  readonly options: ReadonlyArray<EffectExpr>;
  readonly chooserId: string;
  readonly resolver?: (
    chooserId: string,
    options: ReadonlyArray<EffectExpr>,
    state: GameState,
    context: EffectContext
  ) => number;
}

export interface RollBranchParams {
  readonly branches: ReadonlyArray<{
    readonly range: readonly [number, number];
    readonly effect: EffectExpr;
  }>;
}
