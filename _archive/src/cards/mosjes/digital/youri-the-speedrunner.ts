import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const YOURI_THE_SPEEDRUNNER: MosjeDefinition = {
  id: "youri-the-speedrunner" as CardId,
  name: "Youri The Speedrunner",
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
  traits: { Physical: 0, Mental: 2, Social: 0, Creative: 0, Technical: 3, Resilient: 1 },
  startMP: 0,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "mp", mp: 20 },
    usageLimit: "limit_3_per_game",
    description: "Speed Activate: activate a Piecie the same turn it is placed face-down. Draw 1 card.",
    effects: [
      {
        primitive: "applyBuff",
        params: {
          target: "$self",
          buffId: "piecie_same_turn_activate",
          data: { slotIndex: "$choice:slotIndex" },
          expiryTurn: "$currentTurn"
        }
      },
      { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
    ]
  },
  synergies: [
    {
      partnerCardId: "chris-the-all-rounder" as CardId,
      description: "Both Mosjes may play Piecies directly to active state without placing face-down first.",
      bonusEffects: []
    }
  ]
};

registerCard(YOURI_THE_SPEEDRUNNER);
