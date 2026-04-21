import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const COERT_KASTELUCK: MosjeDefinition = {
  id: "coert-kasteluck" as CardId,
  name: "Coert KasteLuck",
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
  traits: { Physical: 0, Mental: 0, Social: 2, Creative: 2, Technical: 0, Resilient: 1 },
  startMP: 20,
  baseAbility: {
    trigger: "passive",
    usageLimit: "passive",
    description: "Morning Luck: roll 1d6 at turn start. 4-6=play 1 extra Piecie for free this turn. 1-3=nothing.",
    effects: [
      {
        primitive: "rollBranch",
        params: {
          branches: [
            { range: [1, 3], effects: [] },
            {
              range: [4, 6],
              effects: [
                {
                  primitive: "applyBuff",
                  params: {
                    target: "$self",
                    buffId: "next_piecie_free",
                    data: { count: 1 },
                    expiryTurn: "$currentTurn"
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  },
  synergies: [
    {
      partnerCardId: "binti-the-sharp-tongue" as CardId,
      description: "Gain double MP from all FOOD-tagged Piecies.",
      bonusEffects: []
    },
    {
      partnerCardId: "binti-the-creator" as CardId,
      description: "Gain double MP from all FOOD-tagged Piecies.",
      bonusEffects: []
    }
  ]
};

registerCard(COERT_KASTELUCK);
