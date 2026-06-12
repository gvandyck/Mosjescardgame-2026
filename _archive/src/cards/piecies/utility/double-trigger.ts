// NOTE: buff:double_activate_this_turn is applied here but consumed double-activation
// in the executor is not yet implemented. Tracked in phase4-questions.md.
import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const DOUBLE_TRIGGER: CardDefinition = {
  id: "double-trigger" as CardId,
  name: "Double Trigger",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 20 },
  requirements: [],
  target: "self",
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

registerCard(DOUBLE_TRIGGER);
