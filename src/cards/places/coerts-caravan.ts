import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

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
      forPlayer: "both",
      effects: [
        {
          primitive: "ifThenElse",
          params: {
            condition: {
              primitive: "checkTrait",
              params: { target: "$self", trait: "Technical", minStars: 2 }
            },
            then: { primitive: "gainMP", params: { target: "$self", amount: 20 } },
            else: { primitive: "gainMP", params: { target: "$self", amount: 10 } }
          }
        }
      ]
    }
  ]
};

registerCard(COERTS_CARAVAN);
