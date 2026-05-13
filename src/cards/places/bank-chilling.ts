import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

// Bank chilling is a social thing — Social 2+ Mosjes gain momentum just from vibing at the start of their turn.
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
      on: "turn_start",
      forPlayer: "active",
      condition: {
        primitive: "checkTrait",
        params: { target: "$self", trait: "Social", minStars: 2 }
      },
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 15 } }]
    }
  ]
};

registerCard(BANK_CHILLING);
