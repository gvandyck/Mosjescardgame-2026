import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

// Arcade — for Martin, Chris, Youri. Technical Mosjes gain momentum on quest success.
export const ARCADE: PlaceDefinition = {
  id: "place_arcade" as CardId,
  name: "Arcade",
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
      forPlayer: "active",
      condition: {
        primitive: "checkTrait",
        params: { target: "$self", trait: "Technical", minStars: 2 }
      },
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 15 } }]
    }
  ]
};

registerCard(ARCADE);
