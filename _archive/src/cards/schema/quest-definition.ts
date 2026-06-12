import type { CardId } from "../../types/card-id.js";
import type { RequirementDefinition } from "./requirement-definition.js";
import type { EffectExpression } from "./effect-expression.js";
import type { CardDefinition } from "./card-definition.js";

export interface QuestDefinition extends CardDefinition {
  readonly category: "quest";
  readonly scope: "general" | "personal";
  readonly requiredMosjeCardId?: CardId;
  readonly roll?: {
    readonly die: "d6";
    readonly trait?: string;
    readonly thresholds: Readonly<Record<"1" | "2" | "3", number>>;
  };
  readonly autoSucceedCondition?: RequirementDefinition;
  readonly onSuccess: ReadonlyArray<EffectExpression>;
  readonly onFailure?: ReadonlyArray<EffectExpression>;
}
