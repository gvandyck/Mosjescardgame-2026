import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const MING_THE_PREDICTOR: MosjeDefinition = {
  id: "ming-the-predictor" as CardId,
  name: "Ming The Predictor",
  category: "mosje",
  subcategory: "DIGITAL",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_activate",
  duration: "while_active",
  effects: [],
  mosjeType: "DIGITAL",
  traits: { Physical: 0, Mental: 3, Social: 0, Creative: 0, Technical: 2, Resilient: 0 },
  startMP: 20,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "mp", mp: 10 },
    usageLimit: "once_per_turn",
    description: "Future Sight: look at the top Quest card. Pay 10 MP to move it to the bottom instead.",
    effects: [
      {
        primitive: "lookAtTop",
        params: { playerId: "$player", targetDeckOwner: "quest_deck", count: 1 }
      }
    ]
  }
};

registerCard(MING_THE_PREDICTOR);
