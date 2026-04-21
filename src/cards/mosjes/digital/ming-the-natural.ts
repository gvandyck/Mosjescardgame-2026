import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const MING_THE_NATURAL: MosjeDefinition = {
  id: "ming-the-natural" as CardId,
  name: "Ming The Natural",
  category: "mosje",
  subcategory: "DIGITAL",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "conditional",
  duration: "while_active",
  effects: [],
  mosjeType: "DIGITAL",
  traits: { Physical: 1, Mental: 2, Social: 2, Creative: 1, Technical: 2, Resilient: 2 },
  startMP: 10,
  baseAbility: {
    trigger: "conditional",
    usageLimit: "once_per_turn",
    description: "Lucky Draw: when you draw a card, gain 15 MP.",
    effects: [
      {
        primitive: "ifThenElse",
        params: {
          condition: {
            primitive: "checkEventLogThisTurn",
            params: { eventType: "card_drawn", playerId: "$player" }
          },
          then: { primitive: "gainMP", params: { target: "$self", amount: 15 } },
          else: { primitive: "gainMP", params: { target: "$self", amount: 0 } }
        }
      }
    ]
  }
};

registerCard(MING_THE_NATURAL);
