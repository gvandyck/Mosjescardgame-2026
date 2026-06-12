import type { CardId } from "../../types/card-id.js";
import type { EffectExpression } from "./effect-expression.js";

export interface PetSynergyDefinition {
  readonly petCardId: CardId;
  readonly bonusEffects: ReadonlyArray<EffectExpression>;
}
