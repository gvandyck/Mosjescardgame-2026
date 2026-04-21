import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const MOSJE_SHIELD: CardDefinition = {
  id: "mosje-shield" as CardId,
  name: "Mosje Shield",
  category: "piecie",
  subcategory: "UTILITY",
  flavorText: "Protect your active Mosje from being sent to the Welloe for 2 turns. Costs 10 MP.",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "welloe_protection",
        data: { negateElimination: true },
        expiryTurn: "$currentTurn + 2"
      }
    }
  ]
};

registerCard(MOSJE_SHIELD);
