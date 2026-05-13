import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const REDBULL: CardDefinition = {
  id: "redbull" as CardId,
  name: "Redbull",
  category: "piecie",
  subcategory: "UTILITY",
  flavorText: "Your active Mosje's unique ability triggers twice this turn. Costs 20 MP.",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 20, levelRequirement: 1 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "double_activate_this_turn",
        data: { usesRemaining: 1 },
        expiryTurn: "$currentTurn"
      }
    }
  ]
};

registerCard(REDBULL);
