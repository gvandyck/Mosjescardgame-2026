import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const THE_VOID: PlaceDefinition = {
  id: "place_the_void" as CardId,
  name: "The Void",
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
  onEnterEffects: [{ primitive: "setGameFlag", params: { flag: "void_active", value: true } }],
  onExitEffects: [{ primitive: "setGameFlag", params: { flag: "void_active", value: false } }],
  triggers: []
};

registerCard(THE_VOID);
