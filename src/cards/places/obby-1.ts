import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const OBBY_1: PlaceDefinition = {
  id: "place_obby_1" as CardId,
  name: "Obby #1",
  category: "place",
  subcategory: "PLACE",
  rarity: "uncommon",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "shared_field",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  triggers: [
    {
      on: "quest_attempt",
      forPlayer: "both",
      condition: {
        primitive: "checkTrait",
        params: { target: "$self", trait: "Physical", minStars: 1 }
      },
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
    }
  ]
};

registerCard(OBBY_1);
