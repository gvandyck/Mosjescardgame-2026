import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Jantje Jantje Jantje…
// Can only be played when Bank (place_bank_chilling) is the active Place.
// Discard 1 card from hand (cost — no-op per phase5-questions Q9).
// Ignore/cancel the currently resolving card.
export const JANTJE_JANTJE_JANTJE: CardDefinition = {
  id: "snelle_jantje_jantje_jantje" as CardId,
  name: "Jantje Jantje Jantje…",
  category: "snelle-piecie",
  requiresStackTarget: true,
  isBoosterOnly: false,
  cost: { type: "discard", discardCount: 1 },
  requirements: [{ type: "place_active", params: { placeCardId: "place_bank_chilling" } }],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } }
  ]
};

registerCard(JANTJE_JANTJE_JANTJE);
