import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const FPS_WEST: MosjeDefinition = {
  id: "mosje_fps_west" as CardId,
  name: "FPS West",
  category: "mosje",
  subcategory: "DIGITAL",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_activate",
  duration: "instant",
  effects: [],
  mosjeType: "DIGITAL",
  traits: { Physical: 1, Mental: 3, Social: 0, Creative: 0, Technical: 3, Resilient: 0 },
  startMP: 10,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "mp", amount: 10 },
    usageLimit: "once_per_turn",
    description: "Tactical Analysis: look at opponent's hand. Predict next card type — correct=gain 20 MP, wrong=lose 10 MP. (Guess check deferred — see phase8-questions.md; auto-gains 20 MP.)",
    effects: [
      { primitive: "gainMP", params: { target: "$self", amount: 20 } }
    ]
  },
  synergies: [
    {
      partnerCardId: "mosje_fps_coert" as CardId,
      description: "When either Mosje completes a Quest: both gain +10 MP. Once per turn: may force opponent to reveal full hand. (Hand reveal deferred.)",
      bonusEffects: [
        { primitive: "gainMP", params: { target: "$self", amount: 10 } }
      ]
    },
    {
      partnerCardId: "cless-the-teacher" as CardId,
      description: "Physical Quests give +15 bonus MP. Once per turn: may look at top Quest card before attempting. (Quest hook deferred.)",
      bonusEffects: []
    }
  ]
};

registerCard(FPS_WEST);
