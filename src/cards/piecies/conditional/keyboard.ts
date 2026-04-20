import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const KEYBOARD: CardDefinition = {
  id: "keyboard" as CardId,
  name: "Keyboard",
  category: "piecie",
  subcategory: "DIGITAL-EQUIPMENT",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "gainMP", params: { target: "$self", amount: 10 } },
    { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
  ],
  synergies: [
    {
      partnerCardId: "mouse" as CardId,
      bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
    }
  ]
};

registerCard(KEYBOARD);
