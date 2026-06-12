import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const CHRIS_THE_ALL_ROUNDER: MosjeDefinition = {
  id: "chris-the-all-rounder" as CardId,
  name: "Chris The All-Rounder",
  category: "mosje",
  subcategory: "DIGITAL",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_activate",
  duration: "while_active",
  effects: [],
  mosjeType: "DIGITAL",
  traits: { Physical: 3, Mental: 0, Social: 2, Creative: 0, Technical: 2, Resilient: 0 },
  startMP: 10,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "free" },
    usageLimit: "once_per_turn",
    description: "Perfect Setup: requires 3+ face-down Piecies. Activate 1 face-down Piecie for free and gain 15 MP.",
    effects: [
      {
        primitive: "ifThenElse",
        params: {
          condition: {
            primitive: "checkFieldCount",
            params: { playerId: "$player", zone: "piecie_face_down", operator: ">=", value: 3 }
          },
          then: {
            primitive: "sequence",
            params: {
              effects: [
                {
                  primitive: "activatePiecie",
                  params: { playerId: "$player", slotIndex: "$choice:slotIndex", free: true }
                },
                { primitive: "gainMP", params: { target: "$self", amount: 15 } }
              ]
            }
          },
          else: { primitive: "gainMP", params: { target: "$self", amount: 0 } }
        }
      }
    ]
  },
  synergies: [
    {
      partnerCardId: "youri-the-speedrunner" as CardId,
      description: "Both Mosjes may play Piecies directly to active state without placing face-down first.",
      bonusEffects: []
    }
  ]
};

registerCard(CHRIS_THE_ALL_ROUNDER);
