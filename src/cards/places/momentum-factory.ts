import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const MOMENTUM_FACTORY: PlaceDefinition = {
  id: "place_momentum_factory" as CardId,
  name: "Momentum Factory",
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
      on: "piecie_activated",
      forPlayer: "both",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
    }
  ]
};

registerCard(MOMENTUM_FACTORY);
