import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const KANNETJE_MELK: CardDefinition = {
  id: "kannetje-melk" as CardId,
  name: "Kannetje Melk",
  category: "piecie",
  subcategory: "MOMENTUM-GAINING",
  rarity: "uncommon",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [{ primitive: "gainMP", params: { target: "$self", amount: 25 } }]
};

registerCard(KANNETJE_MELK);
