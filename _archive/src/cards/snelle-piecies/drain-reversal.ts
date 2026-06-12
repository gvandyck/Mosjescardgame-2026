import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Drain Reversal — negate all MP loss from triggering effect; gain that same amount as MP.
// NOTE: phase5-questions Q8 — $pendingEffectDrainAmount resolves from
//   context.respondingToPendingEffect?.params?.amount ?? 0.
//   The original "check opponent MP before drain" guard is removed per Q8 ruling.
export const DRAIN_REVERSAL: CardDefinition = {
  id: "snelle_drain_reversal" as CardId,
  name: "Drain Reversal",
  category: "snelle-piecie",
  requiresStackTarget: true,
  isBoosterOnly: false,
  cost: { type: "mp", mp: 15 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
    {
      primitive: "gainMP",
      params: { target: "$self", amount: "$pendingEffectDrainAmount" }
    }
  ]
};

registerCard(DRAIN_REVERSAL);
