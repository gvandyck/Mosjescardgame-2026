import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const COERT_KASTELEIN: MosjeDefinition = {
  id: "mosje_coert_kastelein" as CardId,
  name: "Coert Kast-elein",
  category: "mosje",
  subcategory: "ARTISTIC",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  mosjeType: "ARTISTIC",
  traits: { Physical: 2, Mental: 0, Social: 0, Creative: 2, Technical: 0, Resilient: 3 },
  startMP: 20,
  baseAbility: {
    trigger: "passive",
    usageLimit: "passive",
    description: "Immovable Object: reduce all incoming MP loss by 20 permanently. 50+ damage in one source is reduced to 25. Cannot be Welloe'd while MP ≥ 30. (Damage reduction enforcement requires engine-level hook — deferred.)",
    effects: [
      {
        primitive: "applyBuff",
        params: {
          target: "$self",
          buffId: "damage_reduction_20",
          duration: "permanent",
          expiryTurn: 9999
        }
      }
    ]
  },
  triggeredAbility: {
    trigger: "passive",
    usageLimit: "once_per_game",
    description: "Castle Builder: create Castle token on field. While Castle exists, gain +10 MP at turn start. Opponent needs 70+ single-turn damage to destroy it. (Castle token system deferred.)",
    effects: [
      { primitive: "gainMP", params: { target: "$self", amount: 10 } }
    ]
  },
  synergies: [
    {
      partnerCardId: "binti-the-sharp-tongue" as CardId,
      description: "Gain double MP from all [FOOD]-tagged Piecies. (Deferred — requires tag-check hook in Piecie gain handler.)",
      bonusEffects: []
    }
  ]
};

registerCard(COERT_KASTELEIN);
