import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Jensen — ignore/negate a Piecie that specifically targets your Mosje,
// then send that source card to its owner's discard pile.
export const JENSEN: CardDefinition = {
  id: "snelle_jensen" as CardId,
  name: "Jensen!",
  category: "snelle-piecie",
  requiresStackTarget: true,
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
    { primitive: "discardSourceCard", params: { pendingEffectId: "$pendingEffectId" } }
  ]
};

registerCard(JENSEN);
