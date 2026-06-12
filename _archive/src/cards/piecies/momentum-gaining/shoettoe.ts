import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const ENERGY_SURGE: CardDefinition = {
  id: "shoettoe" as CardId,
  name: "Shoettoe",
  category: "piecie",
  subcategory: "MOMENTUM-GAINING",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "mp", params: { operator: "<=", value: 29 } }],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [{ primitive: "gainMP", params: { target: "$self", amount: 20 } }]
};

registerCard(ENERGY_SURGE);
