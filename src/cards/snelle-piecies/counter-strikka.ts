import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Counter Strikka — redirect a resolving Piecie to a different target.
// Redirect is modeled as: negate the pending effect so it fires on "$self" instead of its
// original target. A full "change target" primitive doesn't exist yet; see phase5-questions Q12.
// For now: negates the pending effect entirely (cancels the redirect source).
// Mental ★★★ bonus (draw 1 card) is fully implemented.
export const COUNTER_STRIKKA: CardDefinition = {
  id: "snelle_counter_strikka" as CardId,
  name: "Counter Strikka",
  category: "snelle-piecie",
  requiresStackTarget: true,
  isBoosterOnly: false,
  cost: { type: "mp", mp: 15 },
  requirements: [{ type: "trait", params: { trait: "Mental", minStars: 2 } }],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkTrait",
          params: { target: "$self", trait: "Mental", minStars: 3 }
        },
        then: { primitive: "drawCards", params: { playerId: "$player", count: 1 } },
      }
    }
  ]
};

registerCard(COUNTER_STRIKKA);
