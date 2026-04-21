import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

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
      forPlayer: "both",
      effects: [
        { primitive: "rollDie", params: {} },
        {
          primitive: "rollBranch",
          params: {
            branches: [
              {
                range: [1, 2],
                effect: { primitive: "gainMP", params: { target: "$self", amount: 0 } }
              },
              {
                range: [3, 4],
                effect: { primitive: "gainMP", params: { target: "$self", amount: 15 } }
              },
              {
                range: [5, 6],
                effect: { primitive: "gainMP", params: { target: "$self", amount: 30 } }
              }
            ]
          }
        }
      ]
    }
  ]
};

registerCard(ARCADE);
