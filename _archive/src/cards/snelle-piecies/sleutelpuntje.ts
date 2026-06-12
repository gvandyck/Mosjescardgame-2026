import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Sleutelpuntje — instantly adjust active Mosje MP by +15 or -15 (player's choice).
// The choice is encoded as two options in the `choose` primitive.
// NOTE: resolver must be provided at runtime by the UI layer (Phase 2).
export const SLEUTELPUNTJE: CardDefinition = {
  id: "snelle_sleutelpuntje" as CardId,
  name: "Sleutelpuntje",
  category: "snelle-piecie",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 5 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    {
      primitive: "choose",
      params: {
        chooserId: "$player",
        options: [
          { primitive: "gainMP", params: { target: "$self", amount: 15 } },
          { primitive: "loseMP", params: { target: "$self", amount: 15, isCostPayment: false } }
        ]
      }
    }
  ]
};

registerCard(SLEUTELPUNTJE);
