import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Not Today — negate any effect that would send a Mosje to the Welloe pile.
export const NOT_TODAY: CardDefinition = {
  id: "snelle_negate_elimination" as CardId,
  name: "Not Today",
  category: "snelle-piecie",
  requiresStackTarget: true,
  isBoosterOnly: false,
  cost: { type: "mp", mp: 20 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } }
  ]
};

registerCard(NOT_TODAY);
