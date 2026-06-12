import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";

// Mimics Chef's Special / Affoe: drain + gain with a condition.
// If target has Social 2+: drain 20 + gain 20 (net drain on target, gain on self).
// Otherwise: drain 10 + gain 10.
export const PROOF_CONDITIONAL_DRAIN: CardDefinition = {
  id: "proof-conditional-drain" as CardId,
  name: "Proof: Conditional Drain",
  category: "piecie",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10 },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_activate",
  duration: "instant",
  effects: [
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkTrait",
          params: { target: "$target", trait: "Social", minStars: 2 }
        },
        then: { primitive: "drainMP", params: { from: "$target", to: "$self", amount: 20 } },
        else: { primitive: "drainMP", params: { from: "$target", to: "$self", amount: 10 } }
      }
    }
  ]
};
