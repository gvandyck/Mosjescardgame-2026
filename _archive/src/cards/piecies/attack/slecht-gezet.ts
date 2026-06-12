import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const SLECHT_GEZET: CardDefinition = {
  id: "slecht-gezet" as CardId,
  name: "Slecht Gezet",
  category: "piecie",
  subcategory: "ATTACK",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  effects: [{ primitive: "destroyPlace", params: {} }]
};

registerCard(SLECHT_GEZET);
