import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const AFFOE: CardDefinition = {
  id: "affoe" as CardId,
  name: "Affoe",
  category: "piecie",
  subcategory: "ATTACK",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 5 },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "loseMP", params: { target: "$target", amount: 15 } },
    { primitive: "gainMP", params: { target: "$self", amount: 10 } }
  ]
};

registerCard(AFFOE);
