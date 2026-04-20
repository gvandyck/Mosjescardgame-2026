import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const MOMENTUM_RUSH: CardDefinition = {
  id: "momentum-rush" as CardId,
  name: "Momentum Rush",
  category: "snelle-piecie",
  subcategory: "MOMENTUM-GAINING",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    { primitive: "gainMP", params: { target: "$self", amount: 15 } },
    { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
  ]
};

registerCard(MOMENTUM_RUSH);
