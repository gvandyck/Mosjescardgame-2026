import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const MOMENTUM_STABILIZER: PlaceDefinition = {
  id: "place_momentum_stabilizer" as CardId,
  name: "Momentum Stabilizer",
  category: "place",
  subcategory: "PLACE",
  rarity: "legendary",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "shared_field",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  onEnterEffects: [{ primitive: "setGameFlag", params: { flag: "stabilizer_active", value: true } }],
  onExitEffects: [{ primitive: "setGameFlag", params: { flag: "stabilizer_active", value: false } }],
  triggers: []
};

registerCard(MOMENTUM_STABILIZER);
