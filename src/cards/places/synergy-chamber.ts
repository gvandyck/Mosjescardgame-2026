import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const SYNERGY_CHAMBER: PlaceDefinition = {
  id: "place_synergy_chamber" as CardId,
  name: "Synergy Chamber",
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
  onEnterEffects: [{ primitive: "setGameFlag", params: { flag: "synergy_chamber_active", value: true } }],
  onExitEffects: [{ primitive: "setGameFlag", params: { flag: "synergy_chamber_active", value: false } }],
  triggers: []
};

registerCard(SYNERGY_CHAMBER);
