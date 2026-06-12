import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const MICHELLE_IRON_TUK: MosjeDefinition = {
  id: "michelle-iron-tuk" as CardId,
  name: "Michelle Iron Tuk",
  category: "mosje",
  subcategory: "FIGHTING",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_activate",
  duration: "while_active",
  effects: [],
  mosjeType: "FIGHTING",
  traits: { Physical: 2, Mental: 2, Social: 2, Creative: 1, Technical: 1, Resilient: 3 },
  startMP: 10,
  baseAbility: {
    trigger: "on_activate",
    usageLimit: "once_per_turn",
    description: "Tough Gamble: roll 1d6. 1-2: lose 15 MP. 3-4: gain 15 MP. 5-6: gain 30 MP.",
    effects: [
      {
        primitive: "rollBranch",
        params: {
          branches: [
            {
              range: [1, 2],
              effect: {
                primitive: "loseMP",
                params: { target: "$self", amount: 15, isCostPayment: false }
              }
            },
            {
              range: [3, 4],
              effect: { primitive: "gainMP", params: { target: "$self", amount: 15 } }
            },
            {
              range: [5, 6],
              effect: { primitive: "gainMP", params: { target: "$self", amount: 30 } }
            }
          ]
        }
      }
    ]
  },
  petSynergies: [
    {
      petCardId: "bowie-stormey" as CardId,
      bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
    }
  ]
};

registerCard(MICHELLE_IRON_TUK);
