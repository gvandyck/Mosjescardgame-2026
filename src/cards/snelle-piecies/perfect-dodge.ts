import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Perfect Dodge — Physical ★★★ always negates incoming stack effect.
// Physical ★★ negates only when pending amount is >= 30.
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
          primitive: "checkTrait",
          params: { target: "$self", trait: "Physical", minStars: 3 }
        },
        then: {
          primitive: "chain",
          params: {
            effects: [
              { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
              { primitive: "gainMP", params: { target: "$self", amount: 15 } }
            ]
          }
        },
        else: {
          primitive: "ifThenElse",
          params: {
            condition: {
              primitive: "checkPendingEffectAmount",
              params: { operator: ">=", value: 30 }
            },
            then: {
              primitive: "chain",
              params: {
                effects: [
                  { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
                  { primitive: "gainMP", params: { target: "$self", amount: 15 } }
                ]
              }
            },
            else: { primitive: "gainMP", params: { target: "$self", amount: 15 } }
          }
        }
      }
    }
  ]
};

registerCard(PERFECT_DODGE);
