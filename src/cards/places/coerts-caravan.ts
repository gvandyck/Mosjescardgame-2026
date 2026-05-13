import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

// Coert's Caravan — exclusively for Coert Mosjes (cardId contains "coert"). Hard requirement, good payoff.
export const COERTS_CARAVAN: PlaceDefinition = {
  id: "place_coerts_caravan" as CardId,
  name: "Coert's Caravan",
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
      on: "turn_start",
      forPlayer: "active",
      condition: {
        primitive: "checkMosjeCardId",
        params: { target: "$self", pattern: "coert" }
      },
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 15 } }]
    }
  ]
};

registerCard(COERTS_CARAVAN);
