import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const TUK_THE_HEALING_SPIRIT: MosjeDefinition = {
  id: "tuk-the-healing-spirit" as CardId,
  name: "Tuk The Healing Spirit",
  category: "mosje",
  subcategory: "ARTISTIC",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_activate",
  duration: "while_active",
  effects: [],
  mosjeType: "ARTISTIC",
  traits: { Physical: 0, Mental: 0, Social: 2, Creative: 2, Technical: 0, Resilient: 3 },
  startMP: 10,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "free" },
    usageLimit: "once_per_turn",
    description: "Healing Presence: gain 25 MP for yourself. (Ally-heal mode and passive +10 bonus deferred — see phase8-questions.md)",
    effects: [
      { primitive: "gainMP", params: { target: "$self", amount: 25 } }
    ]
  }
};

registerCard(TUK_THE_HEALING_SPIRIT);
