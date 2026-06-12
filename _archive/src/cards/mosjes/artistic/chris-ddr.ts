import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const CHRIS_DDR: MosjeDefinition = {
  id: "mosje_chris_ddr" as CardId,
  name: "Dancing/DDR Chris",
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
  traits: { Physical: 3, Mental: 0, Social: 2, Creative: 3, Technical: 0, Resilient: 0 },
  startMP: 15,
  baseAbility: {
    trigger: "passive",
    usageLimit: "passive",
    description: "Perfect Combo Chain: after any Piecie activates, roll 1d6. 5-6=gain 10 MP (free chain Piecie activation deferred). Max 3 triggers per turn.",
    effects: [
      {
        primitive: "rollBranch",
        params: {
          branches: [
            { range: [1, 4], effects: [] },
            {
              range: [5, 6],
              effects: [
                { primitive: "gainMP", params: { target: "$self", amount: 10 } }
              ]
            }
          ]
        }
      }
    ]
  },
  synergies: [
    {
      partnerCardId: "mosje_youri" as CardId,
      description: "Both may play Piecies directly to active state without face-down waiting. (Direct-activate bypass deferred.)",
      bonusEffects: []
    }
  ]
};

registerCard(CHRIS_DDR);
