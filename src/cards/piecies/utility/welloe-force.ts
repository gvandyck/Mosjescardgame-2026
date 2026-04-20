import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const WELLOE_FORCE: CardDefinition = {
  id: "welloe-force" as CardId,
  name: "Welloe Force",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10, levelRequirement: 1 },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "forEachTarget",
      params: {
        targetType: "all_opponents",
        effect: { primitive: "loseMP", params: { target: "$target", amount: 10 } }
      }
    },
    { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
  ]
};

registerCard(WELLOE_FORCE);
