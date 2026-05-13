import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

// Skiffa — SUBSTANCE Mosjes are immune to the end-phase drain.
// Note: discard-or-lose-MP choice requires UI prompt; engine applies drain to non-immune Mosjes.
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
              primitive: "ifThenElse",
              params: {
                condition: { primitive: "checkTrait", params: { target: "$target", trait: "Substance", minStars: 1 } },
                then: { primitive: "gainMP", params: { target: "$target", amount: 0 } },
                else: { primitive: "loseMP", params: { target: "$target", amount: 15, isCostPayment: false } }
              }
            }
          }
        }
      ]
    }
  ]
};

registerCard(SKIFFA);
