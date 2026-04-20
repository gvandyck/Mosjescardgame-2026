import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const BROODJE_DONER: CardDefinition = {
  id: "broodje-doner" as CardId,
  name: "Broodje Doner",
  category: "piecie",
  subcategory: "MOMENTUM-GAINING",
  isBoosterOnly: false,
  cost: { type: "free", levelRequirement: 1 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [{ primitive: "gainMP", params: { target: "$self", amount: 35 } }]
};

registerCard(BROODJE_DONER);
