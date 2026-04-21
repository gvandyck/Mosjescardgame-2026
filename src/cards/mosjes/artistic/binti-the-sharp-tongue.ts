import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const BINTI_THE_SHARP_TONGUE: MosjeDefinition = {
  id: "binti-the-sharp-tongue" as CardId,
  name: "Binti The Sharp Tongue",
  category: "mosje",
  subcategory: "ARTISTIC",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_activate",
  duration: "while_active",
  effects: [],
  mosjeType: "ARTISTIC",
  traits: { Physical: 0, Mental: 0, Social: 3, Creative: 2, Technical: 0, Resilient: 0 },
  startMP: 10,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "discard", discardCount: 1 },
    usageLimit: "once_per_turn",
    description: "Cutting Words: discard 1 Piecie from hand. Target opponent loses 10 MP. (Random opponent hand discard deferred — see phase8-questions.md)",
    effects: [
      { primitive: "loseMP", params: { target: "$target", amount: 10 } }
    ]
  },
  synergies: [
    {
      partnerCardId: "coert-tech-savant" as CardId,
      description: "Gain double MP from all FOOD-tagged Piecies.",
      bonusEffects: []
    },
    {
      partnerCardId: "coert-kasteluck" as CardId,
      description: "Gain double MP from all FOOD-tagged Piecies.",
      bonusEffects: []
    }
  ]
};

registerCard(BINTI_THE_SHARP_TONGUE);
