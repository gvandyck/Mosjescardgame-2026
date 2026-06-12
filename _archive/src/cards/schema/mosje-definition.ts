import type { CardId } from "../../types/card-id.js";
import type { CardDefinition } from "./card-definition.js";
import type { CostDefinition } from "./cost-definition.js";
import type { EffectExpression } from "./effect-expression.js";
import type { PetSynergyDefinition } from "./pet-synergy-definition.js";
import type { TriggerType } from "./card-definition-types.js";

export interface MosjeTraits {
  readonly Physical: 0 | 1 | 2 | 3;
  readonly Mental: 0 | 1 | 2 | 3;
  readonly Social: 0 | 1 | 2 | 3;
  readonly Creative: 0 | 1 | 2 | 3;
  readonly Technical: 0 | 1 | 2 | 3;
  readonly Resilient: 0 | 1 | 2 | 3;
}

export interface MosjeAbility {
  readonly trigger: TriggerType;
  readonly cost?: CostDefinition;
  readonly usageLimit?: "once_per_turn" | "once_per_game" | "passive" | "unlimited" | "limit_2_per_game" | "limit_3_per_game" | "cooldown_5_turns";
  readonly effects: ReadonlyArray<EffectExpression>;
  readonly description: string;
}

export interface MosjeSynergyDefinition {
  readonly partnerCardId: CardId;
  readonly bonusEffects: ReadonlyArray<EffectExpression>;
  readonly description: string;
}

export interface MosjeDefinition extends CardDefinition {
  readonly category: "mosje";
  readonly mosjeType: "FIGHTING" | "DIGITAL" | "ARTISTIC";
  readonly traits: MosjeTraits;
  readonly startMP: number;
  readonly baseAbility: MosjeAbility;
  readonly triggeredAbility?: MosjeAbility;
  readonly levelAbilities?: Readonly<Record<2 | 3, MosjeAbility>>;
  readonly synergies?: ReadonlyArray<MosjeSynergyDefinition>;
  readonly petSynergies?: ReadonlyArray<PetSynergyDefinition>;
}
