import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Jammertje Gepakt — cancel a Piecie activation currently being attempted.
// Send that Piecie to the bottom of its owner's deck (not discard).
// Mental ★★★: also draw 1 card.
// NOTE: phase5-questions Q7 — sendToBottomOfDeck primitive missing.
//   Stubbed as negateEffect only; "send to deck bottom" deferred.
export const JAMMERTJE_GEPAKT: CardDefinition = {
  id: "snelle_jammertje_gepakt" as CardId,
  name: "Jammertje Gepakt",
  category: "snelle-piecie",
  requiresStackTarget: true,
  isBoosterOnly: false,
  cost: { type: "mp", mp: 20 },
  requirements: [{ type: "trait", params: { trait: "Mental", minStars: 3 } }],
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
        then: { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
      }
    }
  ]
};

registerCard(JAMMERTJE_GEPAKT);
