import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const LARRY_ZEGELTJE: CardDefinition = {
  id: "larry-zegeltje" as CardId,
  name: "Larry Zegeltje",
  category: "piecie",
  subcategory: "SUBSTANCE",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "gainMP", params: { target: "$self", amount: 20 } },
    { primitive: "loseMP", params: { target: "$self", amount: 25, isCostPayment: false } }
  ]
};

registerCard(LARRY_ZEGELTJE);
