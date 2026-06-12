import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const DELLUFT: PlaceDefinition = {
  id: "place_delluft" as CardId,
  name: "Delluft",
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
      effects: [{ primitive: "drawCards", params: { playerId: "$player", count: 1 } }]
    }
  ]
};

registerCard(DELLUFT);
