import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const DIKKE_TAKS: CardDefinition = {
  id: "dikke-taks" as CardId,
  name: "Dikke Taks",
  category: "piecie",
  subcategory: "ATTACK",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 25, levelRequirement: 2 },
  requirements: [],
  target: "all_opponents",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "forEachTarget",
      params: {
        targetType: "all_opponents",
        effect: { primitive: "loseMP", params: { target: "$target", amount: 35 } }
      }
    },
    { primitive: "drawCards", params: { playerId: "$player", count: 2 } }
  ]
};

registerCard(DIKKE_TAKS);
