import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Gevalletje Klakkeloos — when an opponent gains MP from any source, one of your Mosjes gains
// the same amount. Implemented as a response interrupt: gainMP($self, $pendingEffectGainAmount).
// The card is played in the snelle window in response to an opponent gainMP effect on the stack.
export const GEVALLETJE_KLAKKELOOS: CardDefinition = {
  id: "snelle_gevalletje_klakkeloos" as CardId,
  name: "Gevalletje Klakkeloos",
  category: "snelle-piecie",
  requiresStackTarget: true,
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    {
      primitive: "gainMP",
      params: { target: "$self", amount: "$pendingEffectGainAmount" }
    }
  ]
};

registerCard(GEVALLETJE_KLAKKELOOS);
