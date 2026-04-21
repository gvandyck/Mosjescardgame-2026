import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const CLESS_THE_TEACHER: MosjeDefinition = {
  id: "cless-the-teacher" as CardId,
  name: "Cless The Teacher",
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
  traits: { Physical: 0, Mental: 2, Social: 0, Creative: 3, Technical: 0, Resilient: 0 },
  startMP: 10,
  baseAbility: {
    trigger: "passive",
    usageLimit: "passive",
    description: "Teaching Moment: whenever you activate a Piecie, roll 1d6. 5-6=draw 1 and gain 5 MP. 1-4=nothing.",
    effects: [
      {
        primitive: "rollBranch",
        params: {
          branches: [
            { range: [1, 4], effects: [] },
            {
              range: [5, 6],
              effects: [
                { primitive: "drawCards", params: { playerId: "$player", count: 1 } },
                { primitive: "gainMP", params: { target: "$self", amount: 5 } }
              ]
            }
          ]
        }
      }
    ]
  },
  synergies: [
    {
      partnerCardId: "parkour-west" as CardId,
      description: "Physical Quests give +15 bonus MP. May look at top Quest card before attempting once per turn.",
      bonusEffects: []
    }
  ]
};

registerCard(CLESS_THE_TEACHER);
