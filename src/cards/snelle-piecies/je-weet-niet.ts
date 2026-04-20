import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Jeweetniet wie Ikben — negate all MP loss for active Mosje this turn AND next player turn.
// Implemented as a large reduction buff (9999) lasting 2 turns for effective immunity.
// NOTE: phase5-questions Q11 — proper turnsLeft-based immunity flag pending UI/turn tracker work.
export const JE_WEET_NIET: CardDefinition = {
  id: "snelle_jeweetniet" as CardId,
  name: "Jeweetniet wie Ikben",
  category: "snelle-piecie",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    {
      primitive: "reduceMPLossBy",
      params: { target: "$self", amount: 9999, duration: 2 }
    }
  ]
};

registerCard(JE_WEET_NIET);
