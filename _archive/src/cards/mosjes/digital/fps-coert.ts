import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const FPS_COERT: MosjeDefinition = {
  id: "mosje_fps_coert" as CardId,
  name: "FPS Coert",
  category: "mosje",
  subcategory: "DIGITAL",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  mosjeType: "DIGITAL",
  traits: { Physical: 2, Mental: 2, Social: 0, Creative: 0, Technical: 3, Resilient: 0 },
  startMP: 15,
  baseAbility: {
    trigger: "passive",
    usageLimit: "passive",
    description: "Headshot Precision: after completing a Physical or Technical Quest, roll 1d6. 6=gain 30 MP and opponent loses 15 MP. 1-5=nothing.",
    effects: [
      {
        primitive: "rollBranch",
        params: {
          branches: [
            { range: [1, 5], effects: [] },
            {
              range: [6, 6],
              effects: [
                { primitive: "gainMP", params: { target: "$self", amount: 30 } },
                { primitive: "loseMP", params: { target: "$target", amount: 15 } }
              ]
            }
          ]
        }
      }
    ]
  },
  synergies: [
    {
      partnerCardId: "mosje_fps_west" as CardId,
      description: "When either Mosje completes a Quest: both gain +10 MP. Once per turn: may force opponent to reveal their full hand. (Hand reveal deferred.)",
      bonusEffects: [
        { primitive: "gainMP", params: { target: "$self", amount: 10 } }
      ]
    }
  ]
};

registerCard(FPS_COERT);
