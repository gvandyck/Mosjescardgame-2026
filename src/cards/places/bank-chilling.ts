import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const BANK_CHILLING: PlaceDefinition = {
  id: "place_bank_chilling" as CardId,
  name: "Bank Chilling",
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
      on: "turn_end",
      forPlayer: "both",
      condition: {
        primitive: "checkTrait",
        params: { target: "$self", trait: "Social", minStars: 1 }
      },
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 15 } }]
    }
  ]
};

registerCard(BANK_CHILLING);
