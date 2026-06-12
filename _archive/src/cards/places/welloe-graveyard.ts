import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const WELLOE_GRAVEYARD: PlaceDefinition = {
  id: "place_welloe_graveyard" as CardId,
  name: "Welloe Graveyard",
  category: "place",
  subcategory: "PLACE",
  rarity: "epic",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "shared_field",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  triggers: [
    {
      on: "mosje_defeated",
      forPlayer: "both",
      effects: [
        { primitive: "gainMP", params: { target: "$self", amount: 20 } },
        { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
      ]
    }
  ]
};

registerCard(WELLOE_GRAVEYARD);
