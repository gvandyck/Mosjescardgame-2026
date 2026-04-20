import type { CardId } from "../../types/card-id.js";
import type { CardCategory, DurationType, Rarity, TriggerType } from "./card-definition-types.js";
import type { CostDefinition } from "./cost-definition.js";
import type { EffectExpression } from "./effect-expression.js";
import type { PetSynergyDefinition } from "./pet-synergy-definition.js";
import type { RequirementDefinition } from "./requirement-definition.js";
import type { SynergyDefinition } from "./synergy-definition.js";
import type { TargetDefinition } from "./target-definition.js";

// The canonical shape every card in the game uses.
export interface CardDefinition {
  readonly id: CardId;
  readonly name: string;
  readonly category: CardCategory;
  readonly subcategory?: string; // e.g. 'MOMENTUM-GAINING', 'ATTACK'
  readonly rarity?: Rarity;
  readonly flavorText?: string;
  readonly isBoosterOnly: boolean;
  readonly cost: CostDefinition;
  readonly requirements: ReadonlyArray<RequirementDefinition>;
  readonly target: TargetDefinition;
  readonly trigger: TriggerType;
  readonly duration: DurationType;
  readonly effects: ReadonlyArray<EffectExpression>;
  readonly synergies?: ReadonlyArray<SynergyDefinition>;
  readonly petSynergies?: ReadonlyArray<PetSynergyDefinition>;
}
