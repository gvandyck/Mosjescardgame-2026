import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Perfect Dodge — reduce incoming MP loss of 30 or more to only 10.
// Physical ★★★: reduce to 0 instead.
// Implemented by applying a reduction buff sized to leave exactly 10 (or 0) remaining.
// The actual incoming amount is resolved from $pendingEffectDrainAmount / $pendingEffectGainAmount.
// Since we can't do arithmetic in effect params, we implement as:
//   - base: reduceMPLossBy 20 (for 30-damage → 10 remains; works for ≥30 exactly)
//   - Physical ★★★: reduceMPLossBy 9999 (full block = 0)
// NOTE: phase5-questions Q13 — the "≥30 threshold" condition isn't enforced at card level;
//   for amounts <30 the buff still applies (reduces by 20 which may be a smaller or larger effect).
export const PERFECT_DODGE: CardDefinition = {
  id: "snelle_perfect_dodge" as CardId,
  name: "Perfect Dodge",
  category: "snelle-piecie",
  requiresStackTarget: true,
  isBoosterOnly: false,
  cost: { type: "mp", mp: 20 },
  requirements: [{ type: "trait", params: { trait: "Physical", minStars: 2 } }],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkTrait",
          params: { target: "$self", trait: "Physical", minStars: 3 }
        },
        then: { primitive: "reduceMPLossBy", params: { target: "$self", amount: 9999, duration: 1 } },
        else: { primitive: "reduceMPLossBy", params: { target: "$self", amount: 20, duration: 1 } }
      }
    }
  ]
};

registerCard(PERFECT_DODGE);
