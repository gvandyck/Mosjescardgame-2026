import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Blensen — COUNTER-CHAIN
// Ignore all effects targeting you or your Mosje this turn.
// Cost: 50 MP or free when Jensen/Frenssen was played this turn.
export const BLENSEN: CardDefinition = {
  id: "snelle_blensen" as CardId,
  name: "Blensen!",
  category: "snelle-piecie",
  canCounter: true,
  isBoosterOnly: false,
  cost: { type: "variable", resolver: "blensen_cost" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "effects_ignored_this_turn",
        data: { immune: true },
        expiryTurn: "$currentTurn"
      }
    }
  ]
};

registerCard(BLENSEN);
