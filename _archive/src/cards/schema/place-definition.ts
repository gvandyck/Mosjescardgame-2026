import type { CardDefinition } from "./card-definition.js";
import type { EffectExpression } from "./effect-expression.js";
import type { PlaceTrigger } from "./place-trigger.js";

export interface PlaceDefinition extends CardDefinition {
  readonly category: "place";
  readonly onEnterEffects?: ReadonlyArray<EffectExpression>;
  readonly onExitEffects?: ReadonlyArray<EffectExpression>;
  readonly triggers: ReadonlyArray<PlaceTrigger>;
}
