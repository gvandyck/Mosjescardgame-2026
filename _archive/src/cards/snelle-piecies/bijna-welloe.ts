import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Bijna Welloe — play when an effect would send your Mosje to the Welloe pile.
// Negates that effect and sets MP to 5 (Resilient ★★★: 15 instead).
export const BIJNA_WELLOE: CardDefinition = {
  id: "snelle_bijna_welloe" as CardId,
  name: "Bijna Welloe",
  category: "snelle-piecie",
  requiresStackTarget: true,
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
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
          params: { target: "$self", trait: "Resilient", minStars: 3 }
        },
        then: { primitive: "setMP", params: { target: "$self", value: 15 } },
        else: { primitive: "setMP", params: { target: "$self", value: 5 } }
      }
    }
  ]
};

registerCard(BIJNA_WELLOE);
