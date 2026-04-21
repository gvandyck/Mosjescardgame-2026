import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const SKIFFA: PlaceDefinition = {
  id: "place_skiffa" as CardId,
  name: "Skiffa",
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
      on: "turn_end",
      forPlayer: "both",
      effects: [
        {
          primitive: "forEachTarget",
          params: {
            targetType: "all_mosjes",
            effect: {
              primitive: "loseMP",
              params: { target: "$target", amount: 15, isCostPayment: false }
            }
          }
        }
      ]
    }
  ]
};

registerCard(SKIFFA);
