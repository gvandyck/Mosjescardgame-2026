import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const QUEST_HAVEN: PlaceDefinition = {
  id: "place_quest_haven" as CardId,
  name: "Quest Haven",
  category: "place",
  subcategory: "PLACE",
  rarity: "rare",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "shared_field",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  triggers: [
    {
      on: "quest_completed",
      forPlayer: "both",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
    }
  ]
};

registerCard(QUEST_HAVEN);
