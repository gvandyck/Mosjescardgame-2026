import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const RONALD_KIP: CardDefinition = {
  id: "ronald-kip" as CardId,
  name: "Ronald Kip",
  category: "piecie",
  subcategory: "FOOD",
  isBoosterOnly: false,
  cost: { type: "free", levelRequirement: 2 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [{ primitive: "gainMP", params: { target: "$self", amount: 50 } }],
  synergies: [
    {
      partnerCardId: "ronald-the-master-chef" as CardId,
      bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
    }
  ]
};

registerCard(RONALD_KIP);
