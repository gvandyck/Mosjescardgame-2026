import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const MARTIN_SENOR_WEST: MosjeDefinition = {
  id: "martin-senor-west" as CardId,
  name: "Martin Senor West",
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
  traits: { Physical: 0, Mental: 3, Social: 0, Creative: 0, Technical: 1, Resilient: 0 },
  startMP: 15,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "free" },
    usageLimit: "once_per_turn",
    description: "Calculated Guess: reveal the top of any deck. Correct guess=draw 2 + gain 10 MP. Wrong=lose 10 MP. (Guess resolution deferred — see phase8-questions.md)",
    effects: [
      {
        primitive: "revealTopDeck",
        params: { playerId: "$player", targetDeckOwner: "$choice:deckOwnerId", count: 1 }
      }
    ]
  },
  synergies: [
    {
      partnerCardId: "azn-cless" as CardId,
      description: "Physical Quests give +15 bonus MP. May look at top Quest card before attempting once per turn.",
      bonusEffects: []
    }
  ]
};

registerCard(MARTIN_SENOR_WEST);
