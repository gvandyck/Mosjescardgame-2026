import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Frenssen — COUNTER-CHAIN
// Negate all cards named "Jensen" currently resolving.
// Deal 10 MP damage to the player who played "Jensen".
// canCounter: true so it can be placed on the effectStack and countered by Blensen.
// Target: opponent_active_mosje (the player who played Jensen provides the damage target).
export const FRENSSEN: CardDefinition = {
  id: "snelle_frenssen" as CardId,
  name: "Frenssen!",
  category: "snelle-piecie",
  canCounter: true,
  requiresStackTarget: true,
  isBoosterOnly: false,
  cost: { type: "mp", mp: 15 },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
    { primitive: "loseMP", params: { target: "$target", amount: 10, isCostPayment: false } }
  ]
};

registerCard(FRENSSEN);
