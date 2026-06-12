import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const LEIPE_SWAP: CardDefinition = {
  id: "piecie_leipe_swap" as CardId,
  name: "Leipe Swap",
  category: "piecie",
  subcategory: "UTILITY",
  rarity: "legendary",
  flavorText: "",
  isBoosterOnly: true,
  cost: { type: "free", levelRequirement: 1 },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "this_turn",
  effects: []
};

registerCard(LEIPE_SWAP);
