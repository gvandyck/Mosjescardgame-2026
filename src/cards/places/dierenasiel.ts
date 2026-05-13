import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

// Dierenasiel — for Cless teacher / AZN Cless. PET Piecies cost 0 MP; PET protection +25%.
// Effects enforced in UI via dierenasiel_active flag. No engine-level MP primitives needed.
export const DIERENASIEL: PlaceDefinition = {
  id: "place_dierenasiel" as CardId,
  name: "Dierenasiel",
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
  onEnterEffects: [{ primitive: "setGameFlag", params: { flag: "dierenasiel_active", value: true } }],
  onExitEffects: [{ primitive: "setGameFlag", params: { flag: "dierenasiel_active", value: false } }],
  triggers: []
};

registerCard(DIERENASIEL);
