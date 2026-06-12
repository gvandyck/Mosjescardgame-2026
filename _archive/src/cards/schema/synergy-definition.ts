import type { CardId } from "../../types/card-id.js";
import type { EffectExpression } from "./effect-expression.js";

export interface SynergyDefinition {
  readonly partnerCardId: CardId;
  readonly bonusEffects: ReadonlyArray<EffectExpression>;
}
