import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Jensen — ignore/negate a Piecie that specifically targets your Mosje.
// The Piecie is sent to its owner's discard pile.
// NOTE: phase5-questions Q10 — "send triggering piecie to discard" requires
//   reverse-lookup of which card created the PendingEffect; stubbed as negateEffect only.
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
    { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } }
  ]
};

registerCard(JENSEN);
