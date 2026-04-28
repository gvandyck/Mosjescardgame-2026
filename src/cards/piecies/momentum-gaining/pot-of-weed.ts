import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const POT_OF_WEED: CardDefinition = {
  id: "pot-of-weed" as CardId,
  name: "Pot of Weed",
  category: "piecie",
  subcategory: "MOMENTUM-GAINING",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  effects: [{ primitive: "drawCards", params: { playerId: "$player", count: 2 } }]
};

registerCard(POT_OF_WEED);
