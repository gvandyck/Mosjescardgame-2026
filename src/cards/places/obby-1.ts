import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

// Obby #1 — for Ronald, Martin, Gandoe. Physical/Resilient 2+ quests give +20 MP; failure punishes with -10 MP.
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
      on: "quest_completed",
      forPlayer: "active",
      effects: [
        {
          primitive: "ifThenElse",
          params: {
            condition: { primitive: "checkTrait", params: { target: "$self", trait: "Physical", minStars: 2 } },
            then: { primitive: "gainMP", params: { target: "$self", amount: 20 } },
            else: {
              primitive: "ifThenElse",
              params: {
                condition: { primitive: "checkTrait", params: { target: "$self", trait: "Resilient", minStars: 2 } },
                then: { primitive: "gainMP", params: { target: "$self", amount: 20 } }
              }
            }
          }
        }
      ]
    },
    {
      on: "quest_failed",
      forPlayer: "active",
      effects: [
        {
          primitive: "ifThenElse",
          params: {
            condition: { primitive: "checkTrait", params: { target: "$self", trait: "Physical", minStars: 2 } },
            then: { primitive: "loseMP", params: { target: "$self", amount: 10, isCostPayment: false } },
            else: {
              primitive: "ifThenElse",
              params: {
                condition: { primitive: "checkTrait", params: { target: "$self", trait: "Resilient", minStars: 2 } },
                then: { primitive: "loseMP", params: { target: "$self", amount: 10, isCostPayment: false } }
              }
            }
          }
        }
      ]
    }
  ]
};

registerCard(OBBY_1);
