import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// The Protector — active Mosje is immune to all MP loss for 2 turns.
// Limit: 1 copy per deck (not enforced at engine level; enforced at deck-building).
export const THE_PROTECTOR: CardDefinition = {
  id: "snelle_the_protector" as CardId,
  name: "The Protector",
  category: "snelle-piecie",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    {
      primitive: "reduceMPLossBy",
      params: { target: "$self", amount: 9999, duration: 2 }
    }
  ]
};

registerCard(THE_PROTECTOR);
